// cloudsRender.wgsl - preview: world-space camera + directional sun,
// tone-map and composite the cloud layer over a procedural sky.
// Uses explicit-LOD sampling so textureSample* calls are valid in
// non-uniform control flow.

const PI : f32 = 3.141592653589793;
const SUN_UV_RADIUS : f32 = 0.018;
const SUN_GLOW_RADIUS : f32 = 0.075;
const SUN_EDGE_GLOW_RADIUS : f32 = 0.42;
override PREVIEW_SOFT_VOLUME: u32 = 0u;
override PREVIEW_PLANET_SHELL: u32 = 0u;

// The local projection has its reference surface at y=0. Expanding the
// sphere equation around it retains precision when flying near the ground.
fn previewPlanetBlocksSky(origin: vec3<f32>, ray: vec3<f32>, radius: f32) -> bool {
  if (radius <= 0.0) { return false; }
  let halfB = dot(origin.xz, ray.xz) + (radius + origin.y) * ray.y;
  let c = dot(origin.xz, origin.xz) + origin.y * (2.0 * radius + origin.y);
  return c < 0.0 || (halfB < 0.0 && halfB * halfB >= c);
}

// ---------- I/O ----------
struct RenderParams {
  layerIndex:u32,
  compositeQuality:u32,
  shadowDarkness:f32,
  fieldLighting:f32,

  // camera in world space
  camPos:vec3<f32>, nightAmount:f32,
  right:vec3<f32>,  _p4:f32,
  up:vec3<f32>,     _p5:f32,
  fwd:vec3<f32>,    _p6:f32,

  // frustum + exposure
  fovY:f32,
  aspect:f32,
  exposure:f32,
  sunBloom:f32,

  sunDir:vec3<f32>, celestialVisibility:f32,
  sky:vec3<f32>,    skyCycle:f32,

  gradeStyle:u32,
  shadowStrength:f32,
  colorLift:f32,
  saturationBoost:f32,

  sunColorTint:vec3<f32>, cloudShading:f32,
  lightTint:vec3<f32>, _p13:f32,
  shadowTint:vec3<f32>, _p14:f32,
  edgeTint:vec3<f32>, styleSkyOverride:f32,
  styleControls:vec4<f32>,
  godRayControls:vec4<f32>,
  reservedControls:vec4<f32>,
  silverControls:vec4<f32>,
  boxCenter:vec3<f32>, _p16:f32,
  boxHalf:vec3<f32>, _p17:f32,
  terrain:vec4<f32>, // terrain enabled, marine cloud perspective, local convection, local anvil
  planetOpacity: vec4<f32>, // alpha cutoff, alpha power, opacity, native shell
  planetGrade: PlanetCloudGrade,
  sceneSkyTint: vec4<f32>, // RGB and enable flag
  sceneSolar: vec4<f32>,   // RGB and bloom
  sceneLighting: vec4<f32>, // direct light, sine/cosine of sky azimuth, sine of sky elevation
  terrainBody: vec4<f32>, // reference sphere radius, star time, focused constellation, reveal
  ocean: vec4<f32>, // elapsed seconds, wave scale, region meters per unit, shell lighting weight
  region: vec4<f32>, // regional terrain half-width, highlight rolloff, display contrast
  cloudAir: vec4<f32>, // shell datum, cloud base, cloud thickness
};
@group(0) @binding(0) var samp : sampler;
@group(0) @binding(1) var tex  : texture_2d_array<f32>;
@group(0) @binding(2) var<uniform> R : RenderParams;
@group(0) @binding(3) var terrainTexture:texture_2d<f32>;
@group(0) @binding(4) var terrainWaterTexture:texture_2d<f32>;

struct VSOut { @builtin(position) pos:vec4<f32>, @location(0) uv:vec2<f32>, };

@vertex
fn vs_main(@builtin(vertex_index) vid:u32)->VSOut {
  var p = array<vec2<f32>,6>(
    vec2<f32>(-1.0,-1.0), vec2<f32>( 1.0,-1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>( 1.0,-1.0), vec2<f32>( 1.0, 1.0)
  );
  var t = array<vec2<f32>,6>(
    vec2<f32>(0.0,1.0), vec2<f32>(1.0,1.0), vec2<f32>(0.0,0.0),
    vec2<f32>(0.0,0.0), vec2<f32>(1.0,1.0), vec2<f32>(1.0,0.0)
  );
  var o : VSOut;
  o.pos = vec4<f32>(p[vid], 0.0, 1.0);
  o.uv  = t[vid];
  return o;
}

// ---------- helpers ----------
fn previewSolarTransmission(aerialFog: f32) -> f32 {
  // The solar disk is an HDR emitter. Extinction dims it through the same
  // haze that colors the sky without replacing it with the haze radiance.
  return exp(-.46 * aerialFog);
}

fn toneMapFilmic(c:vec3<f32>)->vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c1 = 2.43;
  let d = 0.59;
  let e = 0.14;

  let x = max(c, vec3<f32>(0.0));
  return clamp((x * (a * x + b)) / (x * (c1 * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

fn luma(c:vec3<f32>)->f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

fn hash12(p: vec2<f32>) -> f32 {
  return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

fn displayTextureDimensions() -> vec2<f32> {
  let sourceDims = vec2<f32>(textureDimensions(tex, 0));
  let requestedDims = R.silverControls.zw;
  if (requestedDims.x >= 1.0 && requestedDims.y >= 1.0) {
    return requestedDims;
  }
  return sourceDims;
}

fn previewFogJitter(uv: vec2<f32>) -> f32 {
  let dims = displayTextureDimensions();
  let pix = floor(uv * dims + vec2<f32>(f32(R.layerIndex) * 0.37, f32(R.compositeQuality) * 1.91));
  return hash12(pix);
}

fn sampleCloudRaw(uv:vec2<f32>, layer:i32)->vec4<f32> {
  return textureSampleLevel(tex, samp, uv, layer, 0.0);
}

fn cloudCubicWeights(t:vec2<f32>)->mat4x2<f32> {
  let t2 = t * t; let t3 = t2 * t;
  return mat4x2<f32>(-0.5 * t + t2 - 0.5 * t3,
    vec2<f32>(1.0) - 2.5 * t2 + 1.5 * t3,
    0.5 * t + 2.0 * t2 - 1.5 * t3, -0.5 * t2 + 0.5 * t3);
}

fn cloudFootprintMayHitAircraft(ray: vec3<f32>, size: vec2<f32>) -> bool {
  if (R._p4 <= .5) { return false; }
  // Aircraft taps pack hull color and transmission. Allow for the whole filter footprint.
  let rel = R.camPos - vec3<f32>(R._p13, R._p14, R._p16);
  let closest = rel + ray * max(0.0, -dot(rel, ray));
  let tapSpread = 4.0 * tan(R.fovY * .5) * length(vec2<f32>(R.aspect, 1.0) / size);
  let guard = sqrt(AIRCRAFT_BOUND_SQUARED) + length(rel) * tapSpread;
  return dot(closest, closest) <= guard * guard;
}

fn reconstructTerrainBoundary(uv: vec2<f32>, layer: i32, size: vec2<f32>, receiver: f32) -> vec4<f32> {
  let pixel = uv * size - .5;
  let base = vec2<i32>(floor(pixel));
  let last = vec2<i32>(size) - 1;
  let lo = clamp(base, vec2<i32>(0), last);
  let hi = clamp(base + 1, vec2<i32>(0), last);
  let topRight = vec2<i32>(hi.x, lo.y);
  let bottomLeft = vec2<i32>(lo.x, hi.y);
  let loUV = (vec2<f32>(lo) + .5) / size;
  let hiUV = (vec2<f32>(hi) + .5) / size;
  let depth = vec4<f32>(
    cloudTerrainSample(terrainTexture, loUV, 1.0).a,
    cloudTerrainSample(terrainTexture, vec2<f32>(hiUV.x, loUV.y), 1.0).a,
    cloudTerrainSample(terrainTexture, vec2<f32>(loUV.x, hiUV.y), 1.0).a,
    cloudTerrainSample(terrainTexture, hiUV, 1.0).a
  );
  // Foreground land truncates the march. A clear ray or one reaching a
  // distant slope does not represent the same cloud column.
  var sameSurface = select(vec4<f32>(0.0), vec4<f32>(1.0), depth <= vec4<f32>(0.0));
  if (receiver > 0.0) {
    let separation = abs(depth - receiver) / max(min(depth, vec4<f32>(receiver)), vec4<f32>(1.0));
    sameSurface = select(vec4<f32>(0.0), 1.0 - smoothstep(vec4<f32>(.035), vec4<f32>(.18), separation),
      depth > vec4<f32>(0.0));
  }
  let f = fract(pixel);
  let g = 1.0 - f;
  let weight = vec4<f32>(g.x * g.y, f.x * g.y, g.x * f.y, f.x * f.y) * sameSurface;
  let total = weight.x + weight.y + weight.z + weight.w;
  // Only a depth break with enough matching rays needs cloud color taps.
  if (total >= .999 || total < .08) { return vec4<f32>(-1.0); }
  let sum = textureLoad(tex, lo, layer, 0) * weight.x + textureLoad(tex, topRight, layer, 0) * weight.y
    + textureLoad(tex, bottomLeft, layer, 0) * weight.z + textureLoad(tex, hi, layer, 0) * weight.w;
  return sum / total;
}

fn reconstructVolumeEdge(uv: vec2<f32>, layer: i32, size: vec2<f32>, center: vec4<f32>, ray: vec3<f32>) -> vec4<f32> {
  if (center.a <= .009 || center.a >= .99 || R.cloudShading > 1.5 ||
      cloudFootprintMayHitAircraft(ray, size)) { return center; }
  let pos = uv * size - .5;
  let base = floor(pos);
  let w = cloudCubicWeights(fract(pos));
  let mid = w[1] + w[2];
  let inner = (base + .5 + w[2] / mid) / size;
  let lo = (base - .5) / size;
  let hi = (base + 2.5) / size;
  let left = sampleCloudRaw(vec2<f32>(lo.x, inner.y), layer);
  let right = sampleCloudRaw(vec2<f32>(hi.x, inner.y), layer);
  let top = sampleCloudRaw(vec2<f32>(inner.x, lo.y), layer);
  let bottom = sampleCloudRaw(vec2<f32>(inner.x, hi.y), layer);
  let middle = sampleCloudRaw(inner, layer);
  // Drop the weakest four corner taps and renormalize the cross. Clamp
  // premultiplied values to the local range to prevent opacity ringing.
  let corners = w[0] + w[3];
  let resolved = (middle * mid.x * mid.y + (left * w[0].x + right * w[3].x) * mid.y
    + (top * w[0].y + bottom * w[3].y) * mid.x) / (1.0 - corners.x * corners.y);
  let low = min(min(left, right), min(min(top, bottom), min(middle, center)));
  let high = max(max(left, right), max(max(top, bottom), max(middle, center)));
  let contrast = smoothstep(.025, .26, high.a - low.a);
  let silhouette = smoothstep(.009, .06, center.a) * (1.0 - smoothstep(.87, .99, center.a));
  return mix(center, clamp(resolved, max(low, vec4<f32>(0.0)), high), contrast * silhouette * .72);
}

// Smooth the coarse ray lattice before the high-contrast surface finish.
fn sampleCloudResolved(uv:vec2<f32>, layer:i32, ray:vec3<f32>, center:vec4<f32>)->vec4<f32> {
  let size = vec2<f32>(textureDimensions(tex));
  let displaySize = displayTextureDimensions();
  if (R.compositeQuality == 0u || all(displaySize <= size * 1.25)) { return center; }
  if (R.fieldLighting > 0.5) {
    if (all(displaySize <= size * 1.5)) { return center; }
    return reconstructVolumeEdge(uv, layer, size, center, ray);
  }
  let pos = uv * size - 0.5; let base = floor(pos);
  let w = cloudCubicWeights(fract(pos)); let middle = w[1] + w[2];
  let xs = vec3<f32>(base.x - 0.5, base.x + 0.5 + w[2].x / middle.x, base.x + 2.5) / size.x;
  let ys = vec3<f32>(base.y - 0.5, base.y + 0.5 + w[2].y / middle.y, base.y + 2.5) / size.y;
  let wx = vec3<f32>(w[0].x, middle.x, w[3].x);
  let wy = vec3<f32>(w[0].y, middle.y, w[3].y);
  var result = vec4<f32>(0.0);
  var low = center; var high = center;
  for (var y = 0u; y < 3u; y++) { for (var x = 0u; x < 3u; x++) {
    let tap = sampleCloudRaw(vec2<f32>(xs[x], ys[y]), layer);
    low = min(low, tap); high = max(high, tap);
    result += tap * wx[x] * wy[y];
  }}
  // Aircraft rays encode transmission in alpha above one; do not interpolate
  // that representation with cloud-only rays using a negative-lobed kernel.
  if (high.a > 1.0) { return center; }
  result = clamp(result, max(low, vec4<f32>(0.0)), high);
  result.a = clamp(result.a, 0.0, 1.0);
  if (result.a < 0.00001) { result = vec4<f32>(0.0); }
  return result;
}

fn cloudDeDitherWeight(center: vec4<f32>, tap: vec4<f32>, spatialWeight: f32) -> f32 {
  let centerA = clamp(center.a, 0.0, 1.0);
  let tapA = clamp(tap.a, 0.0, 1.0);
  let alphaDelta = abs(tapA - centerA);
  let centerLum = luma(center.rgb); let tapLum = luma(tap.rgb);
  var lumaDelta = abs(tapLum - centerLum);
  // HDR procedural lighting can differ by many absolute units across adjacent
  // rays. Compare relative contrast when reconstructing its coarse buffer;
  // otherwise every neighbor is rejected and the ray grid stays unfiltered.
  let coarse = any(displayTextureDimensions() > vec2<f32>(textureDimensions(tex)) * 1.25);
  if (coarse && R.fieldLighting < 0.5) {
    lumaDelta /= max(0.5, max(centerLum, tapLum));
  }
  let alphaWeight = exp(-alphaDelta * 18.0);
  // Cached volumes contain stochastic integration noise in opaque lighting
  // too. Do not mistake every small radiance difference for a material edge.
  let volume = (R.fieldLighting > 0.5 && R.cloudShading < 1.5) || painterlyLook(R.gradeStyle);
  let lumaWeight = exp(-lumaDelta * select(14.0, 5.0, volume));
  let visibilityWeight = smoothstep(0.01, 0.12, tapA);
  return spatialWeight * alphaWeight * lumaWeight * visibilityWeight;
}

// Reuse the existing opposite neighbors to repair isolated thin grid seams.
// Monotone ramps and silhouette edges do not have agreeing samples on both sides.
fn cloudLineMetric(c:vec4<f32>)->vec2<f32> {
  let lum=max(luma(c.rgb),0.0);
  return vec2<f32>(lum/(max(c.a,0.02)+lum),clamp(c.a,0.0,1.0));
}
fn cloudLinePair(center:vec4<f32>,a:vec4<f32>,b:vec4<f32>)->vec4<f32> {
  let m=cloudLineMetric(center); let ma=cloudLineMetric(a); let mb=cloudLineMetric(b);
  let excursion=max(max(min(ma.x,mb.x)-m.x,m.x-max(ma.x,mb.x)),
    max(min(ma.y,mb.y)-m.y,m.y-max(ma.y,mb.y)));
  let spread=length(ma-mb);
  let confidence=smoothstep(0.003,0.024,excursion-spread*0.65)
    * (1.0-smoothstep(0.03,0.14,abs(a.a-b.a)));
  let pairColor=(a+b)*0.5;
  return mix(center,pairColor,confidence*0.97);
}
fn cloudLineRepair(center:vec4<f32>,left:vec4<f32>,right:vec4<f32>,down:vec4<f32>,up:vec4<f32>)->vec4<f32> {
  if(max(max(left.a,right.a),max(down.a,up.a))>1.0 || center.a>1.0){return center;}
  let horizontal=cloudLinePair(center,left,right);
  let vertical=cloudLinePair(center,down,up);
  let dh=dot(horizontal-center,horizontal-center);
  let dv=dot(vertical-center,vertical-center);
  return select(horizontal,vertical,dv>dh);
}

struct CloudNeighborhood {
  filtered: vec4<f32>,
  grad: vec2<f32>,
  occ: f32,
  lightGrad: vec2<f32>,
  lightDetail: f32,
}

fn sampleCloudNeighborhood(uv:vec2<f32>, layer:i32, centerInput:vec4<f32>)->CloudNeighborhood {
  var center=centerInput;
  var centerA = clamp(center.a, 0.0, 1.0);
  if (R.compositeQuality == 0u || centerA < 0.003) {
    return CloudNeighborhood(center, vec2<f32>(0.0, 0.0), centerA, vec2<f32>(0.0), 0.0);
  }

  let dims = displayTextureDimensions();
  let px = 1.0 / max(dims, vec2<f32>(1.0, 1.0));
  let volume = R.fieldLighting > 0.5 && R.cloudShading < 1.5;
  let painted = painterlyLook(R.gradeStyle);
  // Reconstruct in source texels. With divider 4, two display pixels only
  // reach halfway across one ray texel and cannot filter its random grain.
  // Keep the established sculpted relief footprint and the same four taps.
  let sourcePx = 1.0 / max(vec2<f32>(textureDimensions(tex)), vec2<f32>(1.0));
  let detailFraction = select(clamp(min(px.x / sourcePx.x, px.y / sourcePx.y), 0.0, 1.0), 1.0, R.fieldLighting > 0.5);
  let stepUvBase = select(max(px * 2.0, sourcePx), max(px * 3.0, sourcePx * 1.5), painted);
  let sumiStepUv = select(stepUvBase, max(px * 5.0, sourcePx * 2.0), R.gradeStyle == 43u);
  // The fine variant keeps the approved broad palette, but does not smooth its
  // illuminated threads with the broad crest footprint. Same four source taps.
  let originalStepUv = select(sumiStepUv, max(px, sourcePx), R.gradeStyle == 44u);
  let stepUv=select(max(originalStepUv,max(px*5.0,sourcePx*1.5)),originalStepUv,R.fieldLighting>0.5);

  let left = sampleCloudRaw(clamp(uv + vec2<f32>(-stepUv.x, 0.0), vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999)), layer);
  let right = sampleCloudRaw(clamp(uv + vec2<f32>(stepUv.x, 0.0), vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999)), layer);
  let down = sampleCloudRaw(clamp(uv + vec2<f32>(0.0, -stepUv.y), vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999)), layer);
  let up = sampleCloudRaw(clamp(uv + vec2<f32>(0.0, stepUv.y), vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999)), layer);

  if(R.fieldLighting<0.5) {
    center=cloudLineRepair(center,left,right,down,up);
    centerA=clamp(center.a,0.0,1.0);
  }
  let wCenter = 1.0;
  let wLeft = cloudDeDitherWeight(center, left, 0.58);
  let wRight = cloudDeDitherWeight(center, right, 0.58);
  let wDown = cloudDeDitherWeight(center, down, 0.58);
  let wUp = cloudDeDitherWeight(center, up, 0.58);
  let wSum = max(wCenter + wLeft + wRight + wDown + wUp, 1e-5);
  let filteredTap = (
    center * wCenter +
    left * wLeft +
    right * wRight +
    down * wDown +
    up * wUp
  ) / wSum;

  let edgeBand = smoothstep(0.02, 0.18, centerA) * (1.0 - smoothstep(0.62, 0.98, centerA));
  let bodyBand = smoothstep(0.18, 0.72, centerA) * (1.0 - smoothstep(0.88, 0.99, centerA));
  let qualityF = min(f32(R.compositeQuality), 2.0) * 0.5;
  let surfaceBlend = mix(0.34, 0.54, qualityF) * edgeBand + 0.12 * bodyBand;
  var volumeBlend = mix(0.40, 0.58, qualityF) * smoothstep(0.02, 0.20, centerA);
  if (volume && !painted) {
    // Preserve the extra source detail at finer ray settings. Draft keeps
    // the stronger reconstruction used to hide its wide texels.
    let sourceScale = max(sourcePx.x / px.x, sourcePx.y / px.y);
    volumeBlend *= mix(0.52, 1.0, smoothstep(1.0, 4.0, sourceScale));
  }
  if (volume && R.terrain.y > 0.5) {
    // Keep both the silhouette and the lighting folds inside opaque volumes.
    // Opposite neighbors agree around an isolated noise spike, so it can
    // still be filtered. Thin overhead wisps keep the original smoothing.
    let contour = length(vec2<f32>(right.a - left.a, up.a - down.a));
    let litSlope = length(vec2<f32>(luma(right.rgb - left.rgb), luma(up.rgb - down.rgb)));
    let body = smoothstep(0.55, 0.92, min(centerA, min(min(left.a, right.a), min(up.a, down.a))));
    let fold = body * smoothstep(0.07, 0.30, litSlope / max(luma(center.rgb), 0.13));
    let silhouette = smoothstep(0.12, 0.45, centerA) * smoothstep(0.10, 0.50, contour);
    volumeBlend *= 1.0 - 0.46 * max(silhouette, fold);
  }
  let blendBase = clamp(select(surfaceBlend, volumeBlend, volume || painted), 0.0, 0.64);
  let blend = select(blendBase, mix(0.22, blendBase, smoothstep(0.12, 0.45, centerA)), R.gradeStyle == 44u);
  var filtered = mix(center, filteredTap, blend);
  if (R.gradeStyle == 44u) {
    // Keep silhouette coverage filtered, but retain the material's firmer
    // overlapping pigment boundaries in opaque interiors.
    let pigmentBlend = mix(blend, mix(0.48, 0.08, detailFraction), smoothstep(0.35, 0.75, centerA));
    filtered = vec4<f32>(mix(center.rgb, filteredTap.rgb, pigmentBlend), filtered.a);
  }

  let grad = vec2<f32>(right.a - left.a, up.a - down.a);
  let occ = clamp(centerA * 0.42 + (left.a + right.a + down.a + up.a) * 0.145, 0.0, 1.0);
  var lightGrad = vec2<f32>(0.0);
  var lightDetail = 0.0;
  if (R.gradeStyle >= 30u && R.gradeStyle <= 44u) {
    // Follow the existing lit folds, including opaque interiors. These are
    // the same four samples used for reconstruction, not new texture reads.
    let leftLight = inkLightValue(left); let rightLight = inkLightValue(right);
    let downLight = inkLightValue(down); let upLight = inkLightValue(up);
    lightGrad = vec2<f32>(rightLight - leftLight, upLight - downLight);
    let surroundingLight = (leftLight + rightLight + downLight + upLight) * 0.25;
    lightDetail = clamp((inkLightValue(center) - surroundingLight) * 3.0, -0.06, 0.06)
      * smoothstep(0.40, 0.80, min(centerA, occ))
      * select(detailFraction, 1.0, R.fieldLighting > 0.5)
      * select(0.0, 1.0, R.gradeStyle >= 30u && R.gradeStyle <= 44u);
  }
  return CloudNeighborhood(filtered, grad, occ, lightGrad, lightDetail);
}

fn alphaFloorGate(alpha: f32) -> f32 {
  let floorA = clamp(R.reservedControls.x, 0.0, 0.24);
  return select(1.0, smoothstep(floorA, floorA + 0.035, alpha), floorA > 0.0001);
}

fn alphaColorResponse(alpha: f32) -> f32 {
  let a = clamp(alpha, 0.0, 1.0);
  let lowGate = smoothstep(0.014, 0.120, a);
  let highGate = 1.0 - smoothstep(0.38, 0.78, a);
  let responseGate = lowGate * highGate;
  let curvedA = min(pow(max(a, 0.00001), 0.66) * 0.70, a + 0.13);
  return mix(a, max(a, curvedA), responseGate * 0.42);
}

fn alphaDisplayResponse(alpha: f32) -> f32 {
  let a = clamp(alpha, 0.0, 1.0);
  let lowGate = smoothstep(0.014, 0.115, a);
  let highGate = 1.0 - smoothstep(0.48, 0.84, a);
  let responseGate = lowGate * highGate;
  let liftedA = min(pow(max(a, 0.00001), 0.68) * 0.72, a + 0.15);
  let shoulderGate = smoothstep(0.16, 0.50, a) * highGate;
  let shoulderA = min(pow(max(a, 0.00001), 0.82) * 0.96, a + 0.08);
  return max(
    mix(a, max(a, liftedA), responseGate * 0.42),
    mix(a, max(a, shoulderA), shoulderGate * 0.20)
  );
}

fn applyStyleGrade(cIn:vec3<f32>, style:u32, cloudMask:f32)->vec3<f32> {
  var c = clamp(cIn, vec3<f32>(0.0), vec3<f32>(1.0));
  let lum = luma(c);
  let hi = smoothstep(0.56, 0.96, lum);
  let mid = smoothstep(0.16, 0.56, lum) * (1.0 - smoothstep(0.62, 0.92, lum));
  let sh = 1.0 - smoothstep(0.14, 0.44, lum);
  let gradeAmt = mix(0.012, 0.085, clamp(cloudMask, 0.0, 1.0));

  var shadowTint = vec3<f32>(1.0, 1.0, 1.0);
  var midTint = vec3<f32>(1.0, 1.0, 1.0);
  var highTint = vec3<f32>(1.0, 1.0, 1.0);
  var contrast = 1.0;
  var saturation = 1.0;

  if (style == 1u) {
    shadowTint = vec3<f32>(0.92, 0.88, 1.18);
    midTint = vec3<f32>(1.08, 0.96, 1.02);
    highTint = vec3<f32>(1.18, 1.06, 0.78);
    contrast = 1.065;
    saturation = 1.18;
  } else if (style == 2u) {
    shadowTint = vec3<f32>(0.98, 0.96, 1.04);
    midTint = vec3<f32>(1.00, 0.98, 1.02);
    highTint = vec3<f32>(1.02, 0.98, 1.04);
    contrast = 1.02;
    saturation = 1.04;
  } else if (style == 3u) {
    shadowTint = vec3<f32>(0.98, 1.00, 1.02);
    midTint = vec3<f32>(0.99, 1.00, 1.01);
    highTint = vec3<f32>(1.01, 1.02, 1.02);
    contrast = 1.01;
    saturation = 1.01;
  } else if (style == 4u) {
    shadowTint = vec3<f32>(0.98, 0.96, 0.94);
    midTint = vec3<f32>(1.02, 0.98, 0.94);
    highTint = vec3<f32>(1.05, 0.99, 0.92);
    contrast = 1.03;
    saturation = 1.05;
  } else if (style == 5u) {
    shadowTint = vec3<f32>(0.98, 0.96, 1.04);
    midTint = vec3<f32>(1.00, 0.98, 1.00);
    highTint = vec3<f32>(1.03, 0.99, 1.02);
    contrast = 1.02;
    saturation = 1.03;
  } else if (style == 12u) {
    shadowTint = vec3<f32>(1.02, 0.99, 0.96);
    midTint = vec3<f32>(1.07, 1.03, 0.96);
    highTint = vec3<f32>(1.12, 1.06, 0.96);
    contrast = 1.010;
    saturation = 1.050;
  } else if (style == 13u) {
    shadowTint = vec3<f32>(1.03, 1.00, 0.97);
    midTint = vec3<f32>(1.08, 1.04, 0.98);
    highTint = vec3<f32>(1.14, 1.08, 0.98);
    contrast = 1.012;
    saturation = 1.055;
  } else if (style == 15u) {
    shadowTint = vec3<f32>(0.72, 0.86, 1.38);
    midTint = vec3<f32>(0.72, 1.34, 0.88);
    highTint = vec3<f32>(1.42, 0.58, 0.52);
    contrast = 1.055;
    saturation = 1.42;
  }

  c = mix(c, c * highTint, hi * gradeAmt * 0.16);
  c = mix(c, c * midTint, mid * gradeAmt * 0.10);
  c = mix(c, c * shadowTint, sh * gradeAmt * 0.12);

  let pivot = vec3<f32>(0.50, 0.50, 0.50);
  c = clamp((c - pivot) * mix(1.0, contrast, gradeAmt) + pivot, vec3<f32>(0.0), vec3<f32>(1.0));
  let gray = vec3<f32>(luma(c));
  c = mix(gray, c, mix(1.0, saturation, gradeAmt));
  return clamp(c, vec3<f32>(0.0), vec3<f32>(1.0));
}

fn illustratedLook(style:u32)->bool {
  return style == 19u || style == 20u || style == 21u || style == 23u || (style >= 26u && style <= 28u);
}

fn sumiLook(style:u32)->bool { return style == 43u || style == 44u; }

fn painterlyLook(style:u32)->bool {
  return style >= 29u && style <= 44u;
}

fn inkLook(style:u32)->bool {
  return (style >= 36u && style <= 40u) || style == 42u || sumiLook(style);
}

fn flowingInkLook(style:u32)->bool {
  return style == 38u || style == 39u || style == 40u || style == 42u || sumiLook(style);
}

// A directional crest, not a uniform outline. Reuse alpha gradients so the
// highlight follows the rendered cloud and remains attached during flight.
fn flowingInkCrest(alpha:f32, gradient:vec2<f32>, uv:vec2<f32>, sunUv:vec2<f32>, occupancy:f32)->f32 {
  let dims = displayTextureDimensions();
  let toSun = (sunUv - uv) * dims;
  let sunLength = max(length(toSun), 0.001);
  let slope = length(gradient);
  let outward = -gradient / max(slope, 0.00001);
  let facing = smoothstep(-0.12, 0.68, dot(outward, toSun / sunLength));
  if (sumiLook(R.gradeStyle)) {
    // A pale crest can reach the dense shoulder, but only on the light-facing
    // side. Keep the transparent outer wisps instead of outlining empty sky.
    let edge = smoothstep(0.04, 0.14, alpha) * (1.0 - smoothstep(0.32, 0.70, alpha));
    let worldUpScreen = normalize(vec2<f32>(R.right.y, -R.up.y) + vec2<f32>(0.00001, 0.0));
    let sweptShoulder = smoothstep(0.18, 0.72, abs(dot(outward, worldUpScreen)));
    let connected = mix(0.12, 1.0, smoothstep(0.08, 0.30, occupancy));
    if (R.gradeStyle == 44u) {
      // Pale branching filaments accompany the main shoulder. They still come
      // from real material edges and fade when the source gradient is unresolved.
      let thread = smoothstep(0.012, 0.06, alpha) * (1.0 - smoothstep(0.13, 0.38, alpha));
      let support = smoothstep(0.035, 0.18, occupancy);
      // This footprint is smaller than the broad preset's, so a resolved thin
      // edge has a smaller finite difference; use its own derivative threshold.
      let resolved = smoothstep(0.003, 0.024, slope);
      return max(edge * sweptShoulder * connected, thread * mix(0.10, 0.40, sweptShoulder) * support)
        * facing * resolved;
    }
    return edge * facing * smoothstep(0.008, 0.08, slope) * sweptShoulder * connected;
  }
  let edge = smoothstep(0.06, 0.24, alpha) * (1.0 - smoothstep(0.42, 0.82, alpha));
  return edge * facing * smoothstep(0.008, 0.08, slope);
}

fn inkLightValue(sample:vec4<f32>)->f32 {
  let radiance = max(luma(sample.rgb), 0.0) / max(sample.a, 0.08);
  if (R.gradeStyle == 41u || R.gradeStyle == 44u) {
    let scale = max(0.20, R.shadowStrength * select(0.85, 0.80, R.gradeStyle == 41u));
    let logLight = log2(1.0 + radiance / scale);
    return logLight / (logLight + 2.0);
  }
  if (sumiLook(R.gradeStyle)) { return radiance / (radiance + max(0.20, R.shadowStrength * 0.85)); }
  let scale = select(max(0.25, R.shadowStrength * 1.7), max(0.20, R.shadowStrength * select(0.70, 0.80, R.gradeStyle == 41u)), R.gradeStyle >= 40u && R.gradeStyle <= 42u);
  return radiance / (radiance + scale);
}

fn inkFoldHighlight(light:f32, gradient:vec2<f32>)->f32 {
  let slope = length(gradient);
  // Antialias the wash boundaries with their measured lighting variation.
  // Fine unresolved contours fade instead of turning into a screen-space grid.
  let width = clamp(slope * 3.0, 0.035, 0.20);
  let contour = 1.0 - smoothstep(width, width + 0.10, abs(fract(light * 7.0) - 0.55));
  return contour * smoothstep(0.004, 0.025, slope) * (1.0 - smoothstep(0.10, 0.22, slope))
    * smoothstep(0.18, 0.70, light);
}

// Keep three independent color contributions: authored pigment, ray-lit
// material chroma, and diluted sun tint on brighter washes. Existing source
// samples supply all variation; neither density nor alpha is recolored.
fn finishPigmentColor(pigment:vec3<f32>, light:f32, material:vec3<f32>, shadow:vec3<f32>, highlight:vec3<f32>, edge:vec3<f32>, saturation:f32)->vec3<f32> {
  if (R.gradeStyle < 30u || R.gradeStyle > 44u) { return pigment; }
  let materialChroma = clamp(material / vec3<f32>(max(luma(material), 0.001)), vec3<f32>(0.65), vec3<f32>(1.35));
  let sunChroma = clamp(edge / vec3<f32>(max(luma(edge), 0.001)), vec3<f32>(0.65), vec3<f32>(1.35));
  // Preserve the authored wash boundaries while keeping a continuous diluted
  // pigment contribution inside each plane, including the broad ink styles.
  let continuous = mix(shadow, highlight, pow(clamp(light, 0.0, 1.0), 0.85));
  var color = mix(pigment, continuous, select(0.22, 0.06, R.gradeStyle == 41u || R.gradeStyle == 44u));
  // Separate cooler reflected light from warm pigment shoulders. Normalize
  // the glaze so its hue enriches a fold without lifting away its value relief.
  let value = luma(color);
  color *= mix(vec3<f32>(1.0), materialChroma, 0.30);
  let warmWash = smoothstep(0.10, 0.60, light);
  color *= mix(vec3<f32>(1.0), sunChroma, warmWash * 0.30);
  color *= value / max(luma(color), 0.001);
  return max(mix(vec3<f32>(luma(color)), color, clamp(saturation, 0.0, 2.20)), vec3<f32>(0.0));
}

// Broad pigment washes with softly terraced transitions. Lighting and optical
// depth supply the brush shapes; no screen noise, density changes or new reads.
fn gouachePalette(light:f32, shadow:vec3<f32>, highlight:vec3<f32>)->vec3<f32> {
  if (sumiLook(R.gradeStyle)) {
    if (R.gradeStyle == 44u) {
      // Narrow pigment boundaries keep the close-up folds legible. Retain a
      // little within-wash relief rather than flattening each plane completely.
      // Expand the low-light range before terracing: opaque interiors used to
      // fall entirely below the first wash and lose their painted relief.
      let low = pow(clamp(light, 0.0, 1.0), 2.0);
      let high = pow(1.0 - clamp(light, 0.0, 1.0), 2.0) * 0.45;
      let value = pow(low / max(low + high, 0.0001), 0.85);
      // Continuous pigment dilution retains the small lighting differences
      // inside each fold; terracing turned these into large flat color patches.
      let underpaint = shadow * 0.72;
      let violet = mix(shadow, highlight, 0.42) * vec3<f32>(1.055, 0.985, 1.03);
      let coolWash = mix(shadow, highlight, 0.76) * vec3<f32>(0.95, 1.015, 1.07);
      let lower = mix(underpaint, violet, clamp(value / 0.42, 0.0, 1.0));
      let upper = mix(violet, coolWash, clamp((value - 0.42) / 0.34, 0.0, 1.0));
      let body = mix(lower, upper, smoothstep(0.36, 0.48, value));
      let highlightT = clamp((value - 0.76) / 0.24, 0.0, 1.0);
      return mix(body, highlight, mix(highlightT, smoothstep(0.0, 1.0, highlightT), 0.60));
    }
    // Four unequal ink washes, with long dark value ranges. They follow the
    // ray-lit material; no screen-space grain or decorative contour stripes.
    let value = pow(clamp(light, 0.0, 1.0), 1.06);
    let diluted = mix(shadow, highlight, 0.18);
    let fold = mix(shadow, highlight, 0.38);
    var pigment = mix(shadow * 0.62, diluted, smoothstep(0.08, 0.17, value));
    pigment = mix(pigment, fold, smoothstep(0.25, 0.34, value));
    pigment = mix(pigment, mix(shadow, highlight, 0.65), smoothstep(0.48, 0.59, value));
    return mix(pigment, highlight, smoothstep(0.73, 0.86, value));
  }
  if (R.gradeStyle >= 40u && R.gradeStyle <= 42u) {
    if (R.gradeStyle == 41u) {
      let low = pow(clamp(light, 0.0, 1.0), 2.0);
      let high = pow(1.0 - clamp(light, 0.0, 1.0), 2.0) * 0.45;
      let value = pow(low / max(low + high, 0.0001), 0.78);
      let violet = mix(shadow, highlight, 0.40) * vec3<f32>(0.91, 0.92, 1.17);
      let rose = mix(shadow, highlight, 0.76) * vec3<f32>(1.18, 0.90, 1.02);
      let lower = mix(shadow * 0.82, violet, clamp(value / 0.40, 0.0, 1.0));
      let upper = mix(violet, rose, clamp((value - 0.40) / 0.36, 0.0, 1.0));
      let highlightT = clamp((value - 0.76) / 0.24, 0.0, 1.0);
      return mix(mix(lower, upper, smoothstep(0.34, 0.46, value)), highlight, mix(highlightT, smoothstep(0.0, 1.0, highlightT), 0.60));
    }
    if (R.gradeStyle == 40u) {
      // Diluted indigo over a dark underpainting. Lift low ray-lit relief into
      // distinct broad washes; leave the deepest pockets dark and reserve the
      // pale pigment for illuminated folds rather than filling the whole body.
      let value = pow(clamp(light, 0.0, 1.0), 0.84);
      let x = min(value, 0.9999) * 5.0;
      let terrace = (floor(x) + smoothstep(0.20, 0.80, fract(x))) / 5.0;
      let wash = mix(value, terrace, 0.55);
      let diluted = mix(shadow, highlight, 0.27) * vec3<f32>(1.04, 0.98, 1.04);
      let fold = mix(shadow, highlight, 0.58);
      var pigment = mix(shadow * 0.68, diluted, smoothstep(0.04, 0.46, wash));
      pigment = mix(pigment, fold, smoothstep(0.40, 0.76, wash));
      return mix(pigment, highlight * 0.92, smoothstep(0.76, 1.0, wash));
    }
    // Pigment planes follow continuous ray-lit relief. Broad stable terraces
    // separate washes, with a small within-plane gradient like diluted ink.
    let bands = select(5.0, 4.0, R.gradeStyle == 41u);
    let x = clamp(light, 0.0, 0.9999) * bands;
    let terraced = (floor(x) + smoothstep(0.30, 0.70, fract(x))) / bands;
    let wash = mix(light, terraced, 0.80);
    let mid = mix(shadow, highlight, select(0.32, 0.44, R.gradeStyle == 41u));
    var pigment = mix(shadow * 0.70, mid, smoothstep(0.10, 0.54, wash));
    pigment = mix(pigment, highlight * 0.78, smoothstep(0.48, 0.85, wash));
    return mix(pigment, highlight, smoothstep(0.86, 1.0, wash));
  }
  if (flowingInkLook(R.gradeStyle)) {
    // Broad translucent ink planes leave room for fine pale crests. Avoid
    // turning the opaque body into a single nearly-black plateau.
    let x = clamp(light, 0.0, 0.9999) * 6.0;
    let layered = (floor(x) + smoothstep(0.12, 0.88, fract(x))) / 6.0;
    let wash = pow(mix(light, layered, 0.45), 0.72);
    let mid = mix(shadow, highlight, 0.36);
    let fold = mix(shadow, highlight, 0.68);
    var pigment = mix(shadow * 0.88, mid, smoothstep(0.03, 0.50, wash));
    pigment = mix(pigment, fold, smoothstep(0.38, 0.82, wash));
    return mix(pigment, highlight * 0.90, smoothstep(0.80, 1.0, wash));
  }
  if (inkLook(R.gradeStyle)) {
    let x = clamp(light, 0.0, 0.9999) * 7.0;
    let layered = (floor(x) + smoothstep(0.15, 0.85, fract(x))) / 7.0;
    let wash = mix(light, layered, 0.60);
    let dilutedInk = mix(shadow, highlight, 0.48);
    let body = mix(shadow * 0.90, dilutedInk, smoothstep(0.02, 0.70, wash));
    return mix(body, highlight * 0.82, smoothstep(0.68, 1.0, wash));
  }
  // Preserve the approved Gouache finish. Glaze/Sunwash soften its steps;
  // Underpainting adds an intermediate pigment plane without extra sampling.
  let bands = select(4.0, 5.0, R.gradeStyle == 34u);
  let x = clamp(light, 0.0, 0.9999) * bands;
  let terraced = (floor(x) + smoothstep(0.20, 0.80, fract(x))) / bands;
  let bandMix = select(0.65, 0.30, R.gradeStyle == 33u || R.gradeStyle == 35u);
  let wash = mix(light, terraced, bandMix);
  let violet = mix(shadow, highlight, 0.30);
  let rose = mix(shadow, highlight, 0.68) * vec3<f32>(1.045, 0.975, 1.015);
  var pigment = mix(shadow, violet, smoothstep(0.04, 0.36, wash));
  pigment = mix(pigment, rose, smoothstep(0.30, 0.72, wash));
  return mix(pigment, highlight, smoothstep(0.70, 1.0, wash));
}

fn stableSunHintUV(uvSun: vec2<f32>) -> vec2<f32> {
  return clamp(uvSun, vec2<f32>(-0.18, -0.18), vec2<f32>(1.18, 1.18));
}

fn stableSunProximity(uv: vec2<f32>, uvSun: vec2<f32>, towardSun: f32, fwdDot: f32) -> f32 {
  let sunHint = stableSunHintUV(uvSun);
  let d2 = dot(uv - sunHint, uv - sunHint);
  let screenNear = 1.0 / (1.0 + d2 * 8.65);
  let angular = smoothstep(0.18, 0.985, towardSun);
  let frontHemisphere = smoothstep(-0.10, 0.22, fwdDot);
  let offscreenFloor = 0.28 * angular * frontHemisphere;
  return max(screenNear * frontHemisphere, offscreenFloor);
}

// project a world-space direction onto the screen using camera basis + FOV
fn projectDirToUV(dirWS:vec3<f32>)->vec2<f32> {
  // unchanged
  let sx = dot(dirWS, R.right);
  let sy = dot(dirWS, R.up);
  let sz = dot(dirWS, R.fwd);

  let tanHalfY = tan(0.5 * R.fovY);
  let tanHalfX = tanHalfY * max(R.aspect, 0.000001);

  let invSz = 1.0 / max(sz, 0.000001);
  let ndc = vec2<f32>((sx * invSz) / tanHalfX, (sy * invSz) / tanHalfY);

  return vec2<f32>(0.5 + 0.5 * ndc.x, 0.5 - 0.5 * ndc.y);
}

fn rayDirFromUV(uv:vec2<f32>)->vec3<f32> {
  let ndc = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let tanHalfY = tan(0.5 * R.fovY);
  let tanHalfX = tanHalfY * max(R.aspect, 0.000001);
  let dir = R.fwd + R.right * (ndc.x * tanHalfX) + R.up * (ndc.y * tanHalfY);
  return normalize(dir);
}

fn regionalReceiverDepth(uv: vec2<f32>, ray: vec3<f32>, distance: f32) -> f32 {
  let dims = vec2<f32>(textureDimensions(terrainTexture));
  if (distance <= 0.0 || !any(displayTextureDimensions() > dims * 1.5)) { return distance; }
  let pixel = uv * dims - .5;
  let last = vec2<i32>(dims) - 1;
  let base = vec2<i32>(floor(pixel));
  let lo = clamp(base, vec2<i32>(0), last);
  let hi = clamp(base + 1, vec2<i32>(0), last);
  let depths = vec4<f32>(
    textureLoad(terrainTexture, lo, 0).a,
    textureLoad(terrainTexture, vec2<i32>(hi.x, lo.y), 0).a,
    textureLoad(terrainTexture, vec2<i32>(lo.x, hi.y), 0).a,
    textureLoad(terrainTexture, hi, 0).a);
  let nearest = min(min(depths.x, depths.y), min(depths.z, depths.w));
  if (nearest <= 0.0) { return distance; }
  let farthest = max(max(depths.x, depths.y), max(depths.z, depths.w));
  let confidence = 1.0 - smoothstep(.065, .18, (farthest - nearest) / max(nearest, 1.0));
  if (confidence <= .001) { return distance; }
  let scale = 2.0 * tan(.5 * R.fovY) * vec2<f32>(R.aspect, 1.0);
  let low = ((vec2<f32>(lo) + .5) / dims - .5) * scale;
  let high = ((vec2<f32>(hi) + .5) / dims - .5) * scale;
  let x = vec4<f32>(low.x, high.x, low.x, high.x);
  let y = vec4<f32>(low.y, low.y, high.y, high.y);
  // Reciprocal view depth is linear across a projected plane. Interpolating
  // radial distance directly would slide the receiver around on slopes.
  let invZ = sqrt(1.0 + x * x + y * y) / depths;
  let f = fract(pixel);
  let z = 1.0 / mix(mix(invZ.x, invZ.y, f.x), mix(invZ.z, invZ.w, f.x), f.y);
  return mix(distance, z / max(dot(ray, R.fwd), .001), confidence);
}

fn previewBoxInterval(ro: vec3<f32>, rd: vec3<f32>, bmin: vec3<f32>, bmax: vec3<f32>) -> vec2<f32> {
  let safeRd = vec3<f32>(
    select(1e-6, rd.x, abs(rd.x) > 1e-6),
    select(1e-6, rd.y, abs(rd.y) > 1e-6),
    select(1e-6, rd.z, abs(rd.z) > 1e-6)
  );
  let tA = (bmin - ro) / safeRd;
  let tB = (bmax - ro) / safeRd;
  let tNear3 = min(tA, tB);
  let tFar3 = max(tA, tB);
  return vec2<f32>(
    max(max(tNear3.x, tNear3.y), tNear3.z),
    min(min(tFar3.x, tFar3.y), tFar3.z)
  );
}

fn previewBoxHit(ro: vec3<f32>, rd: vec3<f32>) -> vec2<f32> {
  let half = max(R.boxHalf, vec3<f32>(0.001, 0.001, 0.001));
  let bmin = R.boxCenter - half;
  let bmax = R.boxCenter + vec3<f32>(half.x, half.y * 1.55 + 0.25, half.z);
  return previewBoxInterval(ro, rd, bmin, bmax);
}

fn previewFogBoxHit(ro: vec3<f32>, rd: vec3<f32>, fogHorizon: f32) -> vec2<f32> {
  let half = max(R.boxHalf, vec3<f32>(0.001, 0.001, 0.001));
  let h = clamp(fogHorizon * 0.50, 0.0, 1.0);
  let lower = half.y * mix(3.80, 6.20, h) + 0.55;
  let upper = half.y * mix(2.20, 3.80, h) + 0.35;
  let side = vec3<f32>(half.x * 1.05, lower, half.z * 1.05);
  let top = vec3<f32>(half.x * 1.05, upper, half.z * 1.05);
  let bmin = R.boxCenter - side;
  let bmax = R.boxCenter + top;
  return previewBoxInterval(ro, rd, bmin, bmax);
}

fn previewAtmosScale() -> f32 {
  let half = max(R.boxHalf, vec3<f32>(0.001, 0.001, 0.001));
  return max(max(half.x, half.z), max(half.y * 2.0, 1.0));
}

fn previewHorizonBand(rayDir: vec3<f32>, fogHorizon: f32) -> f32 {
  let h = clamp(fogHorizon * 0.50, 0.0, 1.0);
  let width = mix(3.15, 8.75, h);
  return pow(clamp(1.0 - abs(rayDir.y) * width, 0.0, 1.0), mix(1.55, 0.92, h));
}

// Fade the finite basin apron into the same atmospheric background as sky
// rays. Different ground/sky limiting colors otherwise draw a hard horizon.
// The mountain rim itself is inside 112 world units.
fn previewTerrainVisibility(distance:f32)->f32 {
  return 1.0-smoothstep(144.0,768.0,distance);
}
fn previewBackgroundDistance(rayDir:vec3<f32>,fogHorizon:f32,surfaceDistance:f32,terrainVisibility:f32,hullRay:bool)->f32 {
  let skyDistance=previewSkyAerialDistance(rayDir,fogHorizon);
  return select(mix(skyDistance,surfaceDistance,terrainVisibility),surfaceDistance,hullRay);
}

fn previewAerosolDensityAtY(y: f32, fogHorizon: f32) -> f32 {
  let half = max(R.boxHalf, vec3<f32>(0.001, 0.001, 0.001));
  let scale = previewAtmosScale();
  let h = clamp(fogHorizon * 0.50, 0.0, 1.0);
  let baseY = R.boxCenter.y - half.y * mix(1.15, 2.25, h) - 0.08;
  let scaleHeight = max(half.y * mix(0.95, 2.65, h) + scale * mix(0.010, 0.022, h), 0.045);
  let rel = (y - baseY) / scaleHeight;
  let belowLayer = 1.0 / (1.0 + max(-rel, 0.0) * 0.16);
  let aboveLayer = exp(-max(rel, 0.0));
  let layerDensity = select(aboveLayer, belowLayer, rel < 0.0);
  let highMist = mix(0.028, 0.070, h) * exp(-max(rel, 0.0) * mix(0.15, 0.08, h));
  return clamp(layerDensity + highMist, 0.0, 1.16);
}

// Continuous integral of the existing aerosol profile. Whole-number sample
// count changes and per-pixel jitter must not draw horizontal fog boundaries.
fn previewAerosolPrimitive(rel:f32,h:f32)->f32 {
  let above=max(rel,0.0);
  let layer=select(1.0-exp(-above),-log(1.0+max(-rel,0.0)*0.16)/0.16,rel<0.0);
  let decay=mix(0.15,0.08,h);
  let mist=mix(0.028,0.070,h)*select((1.0-exp(-above*decay))/decay,rel,rel<0.0);
  return layer+mist;
}
fn previewAerosolPathDistance(distance:f32,rayDir:vec3<f32>,fogHorizon:f32,jitter:f32)->f32 {
  let d=max(distance,0.0);
  let half=max(R.boxHalf,vec3<f32>(0.001));
  let scale=previewAtmosScale();
  let h=clamp(fogHorizon*0.50,0.0,1.0);
  let baseY=R.boxCenter.y-half.y*mix(1.15,2.25,h)-0.08;
  let scaleHeight=max(half.y*mix(0.95,2.65,h)+scale*mix(0.010,0.022,h),0.045);
  let rel0=(R.camPos.y-baseY)/scaleHeight;
  let delta=rayDir.y*d/scaleHeight;
  let midpoint=previewAerosolDensityAtY(R.camPos.y+rayDir.y*d*0.5,fogHorizon);
  let safeDelta=select(0.000001,delta,abs(delta)>0.000001);
  let integral=(previewAerosolPrimitive(rel0+delta,h)-previewAerosolPrimitive(rel0,h))/safeDelta;
  // Smoothly avoid cancellation on nearly horizontal rays. The midpoint is
  // accurate in this small interval; there is no hard angular switch.
  let average=mix(midpoint,integral,smoothstep(0.01,0.05,abs(delta)));
  let reservoir=previewHorizonBand(rayDir,fogHorizon)*mix(0.035,0.12,h);
  return d*clamp(average*mix(0.82,1.18,h)+reservoir,0.0,1.30);
}

fn previewSkyAerialDistance(rayDir: vec3<f32>, fogHorizon: f32) -> f32 {
  let scale = previewAtmosScale();
  let h = clamp(fogHorizon * 0.50, 0.0, 1.0);
  let horizonBand = previewHorizonBand(rayDir, fogHorizon);
  let verticalEscape = scale * mix(0.92, 2.70, h) / max(abs(rayDir.y) + 0.05, 0.08);
  let horizonReach = scale * mix(2.80, 28.0, horizonBand) * (0.74 + 0.34 * clamp(fogHorizon, 0.0, 1.0));
  let downReach = scale * mix(1.60, 5.80, h) / max(max(-rayDir.y, 0.0) + 0.22, 0.22);
  let skyReach = mix(verticalEscape, horizonReach, horizonBand);
  let directionalReach = mix(skyReach, max(skyReach, downReach), smoothstep(0.005,0.06,-rayDir.y));
  return max(directionalReach, scale * mix(0.62, 1.35, h));
}

fn previewCloudAerialDistance(rayDir: vec3<f32>, cloudDisplayA: f32, fogHorizon: f32) -> f32 {
  // Resolved radiance contains no per-pixel cloud depth. A binary proxy-box
  // hit is therefore not a surface depth: its top/bottom faces can stamp a fog
  // plane through nonzero procedural density, especially on enlarged layers.
  // Use a continuous optical-thickness estimate. Opaque matter gets shallow
  // foreground haze; thin material tends toward the atmospheric path behind it.
  let half=max(R.boxHalf,vec3<f32>(0.001));
  let approach=length(max(abs(R.camPos-R.boxCenter)-half,vec3<f32>(0.0)));
  let a = smoothstep(0.02, 0.98, clamp(cloudDisplayA, 0.0, 1.0));
  let thinThrough = pow(max(1.0 - a, 0.0), 0.58);
  let foregroundDepth=max(half.y*0.55,previewAtmosScale()*0.045);
  let throughDepth=max(foregroundDepth,previewSkyAerialDistance(rayDir,fogHorizon)*0.65);
  let proxyDepth = approach + mix(foregroundDepth, throughDepth, thinThrough * thinThrough);
  if (R.terrain.y > 0.5) {
    // Below a shared cloud base, opaque puffs near the horizon must still
    // travel through a long column of haze. Use the condensation altitude
    // as a continuous lower bound on distance without a cloud depth texture.
    let base = R.boxCenter.y - half.y * 0.79;
    let fromBase = max(base - R.camPos.y, 0.0) / max(rayDir.y, 0.018);
    return max(proxyDepth, min(fromBase, max(half.x, half.z) * 1.45));
  }
  return proxyDepth;
}

fn previewShellAirDistance(ray: vec3<f32>, receiver: f32, cloudOpacity: f32, fogHorizon: f32) -> f32 {
  let datum = R.cloudAir.x;
  let base = R.cloudAir.y;
  let thickness = max(R.cloudAir.z, .001);
  let outer = cloudShaftSphere(R.camPos, ray, datum, base + thickness);
  let entry = max(0.0, outer.x);
  let chord = max(0.0, outer.y - entry);
  let estimate = min(receiver, previewCloudAerialDistance(ray, cloudOpacity, fogHorizon));
  if (chord <= .0001) { return estimate; }

  let inner = cloudShaftSphere(R.camPos, ray, datum, base);
  let eyeHeight = cloudShaftAltitude(R.camPos, datum);
  let eyeFromCenter = R.camPos + vec3<f32>(0.0, datum, 0.0);
  let closest = max(entry, -dot(eyeFromCenter, ray));
  let heightAtClosest = cloudShaftAltitude(R.camPos + ray * closest, datum);
  let belowBase = smoothstep(0.0, thickness * .36, base - heightAtClosest);
  var begin = entry;
  var end = outer.y;
  if (inner.x < inner.y) {
    if (inner.x > entry) {
      end = mix(end, min(end, inner.x), belowBase);
    } else if (eyeHeight <= base && inner.y > 0.0) {
      begin = mix(entry, inner.y, smoothstep(0.0, thickness * .32, base - eyeHeight));
    }
  }
  let distance = min(receiver, begin + min(thickness * .80, max(end - begin, 0.0) * .18));
  return mix(estimate, distance, smoothstep(0.0, thickness * .75, chord));
}

fn previewShellAirFog(ray: vec3<f32>, distance: f32, strength: f32, horizon: f32) -> f32 {
  if (strength <= 0.0 || distance <= 0.0) { return 0.0; }
  let metersPerUnit = max(R.ocean.z, 1.0);
  let scaleHeight = mix(1450.0, 3200.0, clamp(horizon * .5, 0.0, 1.0));
  let radius = select(R.cloudAir.x, R.terrainBody.x, R.terrainBody.x > 0.0);
  var opticalPath = 0.0;
  // Bias the intervals toward the eye to cover the denser air in a long
  // upward ray. Each tap uses radial height along the path to the cloud.
  let path = min(distance, 140000.0 / metersPerUnit);
  for (var i = 0u; i < 4u; i++) {
    let low = f32(i) * .25;
    let high = low + .25;
    let start = low * low;
    let end = high * high;
    let point = R.camPos + ray * (.5 * (start + end) * path);
    let height = max(0.0, cloudShaftAltitude(point, radius) * metersPerUnit);
    opticalPath += (end - start) * exp(-height / scaleHeight);
  }
  return min(.97, 1.0 - exp(-strength * opticalPath * path * metersPerUnit / 11500.0));
}

fn previewCloudBoxImmersion(fogHorizon: f32) -> f32 {
  let half = max(R.boxHalf, vec3<f32>(0.001, 0.001, 0.001));
  let ext = vec3<f32>(half.x, half.y * 1.55 + 0.25, half.z);
  let q = abs(R.camPos - R.boxCenter) / max(ext, vec3<f32>(0.001, 0.001, 0.001));
  let maxQ = max(max(q.x, q.y), q.z);
  let edgeEase = 1.0 - smoothstep(0.70, 1.25, maxQ);
  let altitudeDensity = previewAerosolDensityAtY(R.camPos.y, fogHorizon);
  return edgeEase * altitudeDensity;
}

fn previewAerialFogAmount(distance: f32, rayDir: vec3<f32>, fogDensity: f32, fogHorizon: f32, fogSun: f32, lowSun: f32, towardSun: f32, jitter: f32) -> f32 {
  if (fogDensity <= 0.0001) {
    return 0.0;
  }

  let scale = previewAtmosScale();
  let h = clamp(fogHorizon * 0.50, 0.0, 1.0);
  let horizonBand = previewHorizonBand(rayDir, fogHorizon);
  let grazing = min(1.0 / max(abs(rayDir.y) * 2.00 + 0.22, 0.22), 4.55);
  let pathBoost = mix(1.0, grazing, horizonBand * clamp(fogHorizon * 0.48, 0.0, 0.92));
  let lowAltitudeBoost = mix(0.92, 1.22, lowSun);
  let aerosolDistance = previewAerosolPathDistance(distance, rayDir, fogHorizon, jitter);
  let extinction = fogDensity * mix(1.10, 2.05, h) * lowAltitudeBoost;
  let opticalDepth = aerosolDistance / max(scale, 0.001) * extinction * pathBoost;
  let rayleighMie = 1.0 - exp(-opticalDepth);
  let sun01 = clamp(towardSun, 0.0, 1.0);
  let fogSun01 = clamp(fogSun * 0.50, 0.0, 1.0);
  let sunCore = pow(sun01, mix(10.0, 2.65, fogSun01));
  let sunWide = pow(sun01, mix(4.10, 1.55, fogSun01));
  let forwardScatter =
    (1.0 - exp(-opticalDepth * 0.66)) *
    fogSun *
    (sunCore * mix(0.050, 0.360, lowSun) + sunWide * mix(0.020, 0.120, lowSun));
  return clamp(rayleighMie + forwardScatter, 0.0, 1.0);
}

fn previewSunConeHaze(towardSun: f32, fogDensity: f32, fogSun: f32, lowSun: f32) -> f32 {
  let sun01 = clamp(towardSun, 0.0, 1.0);
  let fogSun01 = clamp(fogSun * 0.50, 0.0, 1.0);
  let densityGate = smoothstep(0.020, 0.38, clamp(fogDensity, 0.0, 2.0));
  let wide = pow(sun01, mix(2.45, 1.38, fogSun01));
  let core = pow(sun01, mix(9.00, 3.55, fogSun01));
  let daylightScatter = 0.48 + 0.52 * lowSun;
  return (wide * 0.145 + core * 0.205) * fogSun01 * densityGate * daylightScatter;
}

fn previewAerialFogColor(
  horizonSky: vec3<f32>,
  zenithSky: vec3<f32>,
  sunWash: vec3<f32>,
  shadowCool: vec3<f32>,
  rayDir: vec3<f32>,
  towardSun: f32,
  fogHorizon: f32,
  fogSun: f32,
  lowSun: f32
) -> vec3<f32> {
  let horizonBand = previewHorizonBand(rayDir, fogHorizon);
  let hMix = clamp(horizonBand * (0.68 + 0.24 * clamp(fogHorizon, 0.0, 1.0)) + 0.10, 0.0, 1.0);
  let base = mix(zenithSky, horizonSky, hMix);
  let sun01 = clamp(towardSun, 0.0, 1.0);
  let fogSun01 = clamp(fogSun * 0.50, 0.0, 1.0);
  let sunCore = pow(sun01, mix(9.0, 2.4, fogSun01));
  let sunWide = pow(sun01, mix(3.8, 1.45, fogSun01));
  let sunMix = clamp(fogSun * (sunCore * mix(0.10, 0.66, lowSun) + sunWide * mix(0.035, 0.24, lowSun)), 0.0, 0.86);
  let coolMix = clamp((1.0 - towardSun) * 0.10 + (1.0 - lowSun) * 0.05, 0.0, 0.20);
  return max(mix(mix(base, shadowCool, coolMix), sunWash, sunMix), vec3<f32>(0.0));
}

// ---- faster alpha gather: fewer samples, lower LOD, and early-out ----
// - Uses LOD = 1 to sample a smaller mip (cheaper/more cache-friendly).
// - Uses 5 samples (center + 4 cardinal neighbors). You can reduce to 4 if needed.
// - Caller should skip this when sun is far from pixel (d > some threshold) or when clouds are fully opaque/clear.
fn alphaGatherFast(uv:vec2<f32>, layer:i32)->f32 {
  // precomputed radius in uv space
  let r = SUN_UV_RADIUS;
  // quick 5-sample kernel (center + 4)
  let k0 = vec2<f32>(0.0, 0.0);
  let k1 = vec2<f32>( r, 0.0);
  let k2 = vec2<f32>(-r, 0.0);
  let k3 = vec2<f32>(0.0, r);
  let k4 = vec2<f32>(0.0, -r);

  // sample at a lower LOD (1.0) to reduce cost & aggregate over a coarser area
  // note: textureSampleLevel returns a vec4; we only read .a
  var sum = 0.0;
  sum += clamp(textureSampleLevel(tex, samp, uv + k0, layer, 1.0).a, 0.0, 1.0);
  sum += clamp(textureSampleLevel(tex, samp, uv + k1, layer, 1.0).a, 0.0, 1.0);
  sum += clamp(textureSampleLevel(tex, samp, uv + k2, layer, 1.0).a, 0.0, 1.0);
  sum += clamp(textureSampleLevel(tex, samp, uv + k3, layer, 1.0).a, 0.0, 1.0);
  sum += clamp(textureSampleLevel(tex, samp, uv + k4, layer, 1.0).a, 0.0, 1.0);

  return sum * 0.2; // divide by 5
}

fn alphaGradAt(uv:vec2<f32>, layer:i32)->vec2<f32> {
  let dims = displayTextureDimensions();
  let px = 1.0 / max(dims, vec2<f32>(1.0, 1.0));

  let r1 = px * 1.5;
  let r2 = px * 3.0;

  let aL1 = textureSampleLevel(tex, samp, uv - vec2<f32>(r1.x, 0.0), layer, 0.0).a;
  let aR1 = textureSampleLevel(tex, samp, uv + vec2<f32>(r1.x, 0.0), layer, 0.0).a;
  let aD1 = textureSampleLevel(tex, samp, uv - vec2<f32>(0.0, r1.y), layer, 0.0).a;
  let aU1 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0, r1.y), layer, 0.0).a;

  let aL2 = textureSampleLevel(tex, samp, uv - vec2<f32>(r2.x, 0.0), layer, 1.0).a;
  let aR2 = textureSampleLevel(tex, samp, uv + vec2<f32>(r2.x, 0.0), layer, 1.0).a;
  let aD2 = textureSampleLevel(tex, samp, uv - vec2<f32>(0.0, r2.y), layer, 1.0).a;
  let aU2 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0, r2.y), layer, 1.0).a;

  let g1 = vec2<f32>(aR1 - aL1, aU1 - aD1);
  let g2 = vec2<f32>(aR2 - aL2, aU2 - aD2);

  return g1 * 0.72 + g2 * 0.28;
}

fn alphaOpenTowardSoft(uv:vec2<f32>, dir:vec2<f32>, layer:i32)->f32 {
  let dims = displayTextureDimensions();
  let px = 1.0 / max(dims, vec2<f32>(1.0, 1.0));
  let pix = max(px.x, px.y);
  let lenDir = max(length(dir), 1e-5);
  let d = dir / lenDir;

  let a0 = textureSampleLevel(tex, samp, uv + d * pix * 5.0, layer, 1.0).a;
  let a1 = textureSampleLevel(tex, samp, uv + d * pix * 11.0, layer, 2.0).a;
  let a2 = textureSampleLevel(tex, samp, uv + d * pix * 22.0, layer, 3.0).a;
  let a3 = textureSampleLevel(tex, samp, uv + d * pix * 40.0, layer, 3.0).a;

  let blocking = clamp(max(max(a0, a1 * 0.92), max(a2 * 0.78, a3 * 0.62)), 0.0, 1.0);
  let open = 1.0 - blocking;
  return smoothstep(0.18, 0.86, open);
}

fn alphaReliefStats(uv:vec2<f32>, layer:i32)->vec2<f32> {
  let dims = displayTextureDimensions();
  let px = 1.0 / max(dims, vec2<f32>(1.0, 1.0));

  let r1 = px * 2.0;
  let r2 = px * 4.0;

  let c = textureSampleLevel(tex, samp, uv, layer, 0.0).a;

  let n1 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0,  r1.y), layer, 0.0).a;
  let s1 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0, -r1.y), layer, 0.0).a;
  let e1 = textureSampleLevel(tex, samp, uv + vec2<f32>( r1.x, 0.0), layer, 0.0).a;
  let w1 = textureSampleLevel(tex, samp, uv + vec2<f32>(-r1.x, 0.0), layer, 0.0).a;

  let n2 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0,  r2.y), layer, 1.0).a;
  let s2 = textureSampleLevel(tex, samp, uv + vec2<f32>(0.0, -r2.y), layer, 1.0).a;
  let e2 = textureSampleLevel(tex, samp, uv + vec2<f32>( r2.x, 0.0), layer, 1.0).a;
  let w2 = textureSampleLevel(tex, samp, uv + vec2<f32>(-r2.x, 0.0), layer, 1.0).a;

  let mean1 = (n1 + s1 + e1 + w1) * 0.25;
  let mean2 = (n2 + s2 + e2 + w2) * 0.25;
  let mean = mix(mean1, mean2, 0.35);

  let cavity = clamp(mean - c, 0.0, 1.0);
  let ridge = clamp(c - mean, 0.0, 1.0);
  return vec2<f32>(cavity, ridge);
}

fn alphaReliefStatsFast(centerAlpha:f32, occ:f32, gradLen:f32)->vec2<f32> {
  let cavity = clamp(occ - centerAlpha, 0.0, 1.0);
  let ridge = clamp(centerAlpha - occ + gradLen * 1.75, 0.0, 1.0);
  return vec2<f32>(cavity, ridge);
}

fn silverEdgeBand(alpha: f32) -> f32 {
  let enter = smoothstep(0.08, 0.24, alpha);
  let leave = 1.0 - smoothstep(0.26, 0.62, alpha);
  return enter * leave;
}

fn renderSilverControl() -> f32 {
  let x = clamp(R.silverControls.x, -12.0, 12.0);
  let normalized = abs(x) / 12.0;
  let curved = pow(max(normalized, 0.0), 0.46) * 2.80;
  return clamp(sign(x) * curved, -12.0, 12.0);
}

fn renderSilverSharp01() -> f32 {
  let normalized = clamp((max(R.silverControls.y, 0.5) - 0.5) / 47.5, 0.0, 1.0);
  return pow(normalized, 0.38);
}

fn silverEdgeBandShaped(alpha: f32, sharp01: f32) -> f32 {
  let enterLo = mix(0.034, 0.078, sharp01);
  let enterHi = mix(0.205, 0.290, sharp01);
  let leaveLo = mix(0.74, 0.30, sharp01);
  let leaveHi = mix(1.06, 0.56, sharp01);
  let enter = smoothstep(enterLo, enterHi, alpha);
  let leave = 1.0 - smoothstep(leaveLo, max(leaveLo + 0.035, leaveHi), alpha);
  return enter * leave;
}

fn cloudCoreMask(alpha: f32, occ: f32, edge: f32) -> f32 {
  let body = smoothstep(0.44, 0.92, alpha);
  let dense = smoothstep(0.52, 0.96, occ);
  return body * dense * (1.0 - edge);
}


fn inside01(uv:vec2<f32>)->f32 {
  return select(0.0, 1.0, all(uv >= vec2<f32>(0.0, 0.0)) && all(uv <= vec2<f32>(1.0, 1.0)));
}

fn sampleAlphaWide(
  uv: vec2<f32>,
  layer: i32,
  lod: f32,
  width: f32,
  dir: vec2<f32>,
  perp: vec2<f32>
) -> f32 {
  let uv0 = clamp(uv, vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999));
  let uv1 = clamp(uv + perp * width * 0.82, vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999));
  let uv2 = clamp(uv - perp * width * 0.82, vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999));

  let a0 = clamp(textureSampleLevel(tex, samp, uv0, layer, lod).a, 0.0, 1.0);
  let a1 = clamp(textureSampleLevel(tex, samp, uv1, layer, lod).a, 0.0, 1.0);
  let a2 = clamp(textureSampleLevel(tex, samp, uv2, layer, lod).a, 0.0, 1.0);

  return clamp(a0 * 0.46 + (a1 + a2) * 0.27, 0.0, 1.0);
}

// Terrain is an opaque blocker only when it lies in front of the receiver.
// This retains visible haze in front of a mountain, without rays leaking from
// behind it or a distant ridge shadowing a nearer surface.
fn terrainGodRayBlocker(uv:vec2<f32>,receiverDistance:f32)->f32 {
  if(R.terrain.x<0.5 || inside01(uv)<0.5){return 0.0;}
  let distance=cloudTerrainDepth(terrainTexture,uv,R.terrain.x);
  return select(0.0,previewTerrainVisibility(distance),distance<1000000.0 && distance<receiverDistance-max(0.02,distance*0.001));
}

fn filteredGodRayMask(uv:vec2<f32>,layer:i32,lod:f32,along:vec2<f32>,across:vec2<f32>,receiverDistance:f32)->vec2<f32> {
  // Integrate each radial segment, rather than stamping a sharp cloud or
  // mountain silhouette once per step. Four alpha reads replace the previous
  // three-wide-plus-mip mask; terrain coverage is filtered separately.
  var mask=vec2<f32>(0.0);
  var weight=0.0;
  for(var j=0u;j<2u;j++){for(var k=0u;k<2u;k++){
    let at=uv+along*select(-0.57735,0.57735,j==1u)+across*select(-0.57735,0.57735,k==1u);
    let cloud=clamp(textureSampleLevel(tex,samp,clamp(at,vec2<f32>(0.001),vec2<f32>(0.999)),layer,lod).a,0.0,1.0);
    let margin=min(at,1.0-at);
    let visible=smoothstep(0.0,.025,min(margin.x,margin.y));
    mask+=vec2<f32>(cloud,terrainGodRayBlocker(at,receiverDistance))*visible;
    weight+=visible;
  }}
  return mask/max(1.0,weight);
}

fn anvilAperture(uv:vec2<f32>, offset:vec2<f32>, layer:i32, lod:f32, center:f32) -> f32 {
  let lower = uv - abs(offset);
  let upper = uv + abs(offset);
  let inset = min(lower, 1.0 - upper);
  let screenEdge = smoothstep(0.0, 0.035, min(inset.x, inset.y));
  if (screenEdge <= 0.0) { return 0.0; }
  let a = textureSampleLevel(tex,samp,uv-offset,layer,lod).a;
  let b = textureSampleLevel(tex,samp,uv+offset,layer,lod).a;
  // Most of the light comes from a clear route bounded on both sides.
  // A weaker term preserves light through the ragged edge of a single fold.
  let shoulders = mix(min(a,b), max(a,b), 0.19);
  let contrast = smoothstep(0.085, 0.62, shoulders - center);
  return contrast * (1.0 - center) * (1.0 - center) * screenEdge;
}

fn godRayShaft(
  uv: vec2<f32>,
  uvSun: vec2<f32>,
  layer: i32,
  fwdDot: f32,
  towardSun: f32,
  cloudA: f32,
  lowSun: f32
) -> vec2<f32> {
  let enabled = clamp(R.godRayControls.x, 0.0, 1.0);
  let strength = sceneShaftStrength(R.godRayControls.y) * enabled;
  if (strength <= 0.0001 || fwdDot <= -0.08) {
    return vec2<f32>(0.0, 0.0);
  }

  let sunHint = stableSunHintUV(uvSun);
  let localBank = R.terrain.z > 0.5;
  let stableShaft = R.terrain.y > 0.5 || localBank;
  let trackAnvilGaps = R.terrain.w > 0.5 && towardSun > 0.42 && cloudA < 0.88;
  let metric = vec2<f32>(select(1.0, R.aspect, stableShaft), 1.0);
  let fromSun = (uv - sunHint) * metric;
  let dist = length(fromSun);
  if (dist <= 1e-5) {
    return vec2<f32>(0.0, 0.0);
  }

  let radial = fromSun / dist;
  let dir = radial / metric;
  let perp = vec2<f32>(-radial.y, radial.x) / metric;

  let rayLength = clamp(R.godRayControls.z, 0.10, 2.0);
  let falloff = clamp(R.godRayControls.w, 0.20, 4.0);

  let screenGate = select(
    0.70,
    1.0,
    all(uvSun >= vec2<f32>(-0.25, -0.25)) && all(uvSun <= vec2<f32>(1.25, 1.25))
  ) * smoothstep(-0.08, 0.22, fwdDot);

  if (screenGate <= 0.0001) {
    return vec2<f32>(0.0, 0.0);
  }

  let span = mix(0.52, 1.55, clamp(rayLength * 0.60, 0.0, 1.0));
  let reach = min(dist, span);
  let toSun = sunHint - uv;
  let edge = select(uv, 1.0 - uv, toSun > vec2<f32>(0.0));
  let visibleFraction = min(edge.x / max(abs(toSun.x), .00001), edge.y / max(abs(toSun.y), .00001));
  let entry = dist * (1.0 - clamp(visibleFraction, 0.0, 1.0));
  let visibleLength = reach - entry;
  if (visibleLength <= 0.0) { return vec2<f32>(0.0); }
  let radialX = dist / max(span, 0.001);
  let radialGate = 1.0 / (1.0 + radialX * radialX * mix(1.45, 2.35, clamp(falloff * 0.22, 0.0, 1.0)));
  let angularGate = smoothstep(0.08, 0.88, towardSun) * mix(0.68, 1.22, lowSun);

  let horizonFog = pow(clamp(1.0 - abs(uv.y - 0.55) * 2.0, 0.0, 1.0), 0.48);
  let upperFog = pow(clamp(1.0 - uv.y, 0.0, 1.0), 0.30);
  let fogDensity = mix(0.34, 0.92, max(horizonFog, upperFog * 0.42)) * mix(0.74, 1.18, lowSun);

  let localFadeA = pow(max(1.0 - cloudA, 0.0), 1.10);
  let localFadeB = pow(max(1.0 - cloudA, 0.0), 1.95);
  let edgeBand = smoothstep(0.035, 0.22, cloudA) * (1.0 - smoothstep(0.24, 0.62, cloudA));
  let localFade = mix(localFadeA, localFadeB, smoothstep(0.22, 0.82, cloudA)) * (1.0 - 0.62 * edgeBand);

  var samples: u32 = 8u;
  if (R.compositeQuality >= 1u) {
    samples = 12u;
  }
  if (R.compositeQuality >= 2u) {
    samples = 16u;
  }

  let dims = displayTextureDimensions();
  let pix = 1.0 / max(min(dims.x, dims.y), 1.0);
  let pixelCell = floor(uv * dims);
  let coarseCell = floor(uv * dims * 0.18);
  let baseRand = mix(hash12(coarseCell + sunHint * 19.1), hash12(pixelCell + sunHint * 7.7), 0.35);
  let windowPre = radialGate * angularGate * screenGate * fogDensity * strength * smoothstep(0.0, .065, visibleLength);
  if (windowPre <= 0.00001) {
    return vec2<f32>(0.0, 0.0);
  }

  var transmittance = 1.0;
  var brightAccum = 0.0;
  var blockerAccum = 0.0;
  var edgeAccum = 0.0;
  var apertureAccum = 0.0;
  var weightAccum = 0.0;

  let receiverDistance=cloudTerrainDepth(terrainTexture,uv,R.terrain.x);
  var prevOcc = clamp(textureSampleLevel(
    tex,
    samp,
    clamp(sunHint + dir * entry, vec2<f32>(0.001, 0.001), vec2<f32>(0.999, 0.999)),
    layer,
    2.5
  ).a, 0.0, 1.0);

  for (var i: u32 = 0u; i < 16u; i = i + 1u) {
    if (i >= samples) {
      break;
    }

    // Share radial segments across receivers. Stretching every sample pattern
    // to each pixel's distance repeatedly projected the same blocker outline.
    // Only the last segment's integrated length varies with the receiver.
    let segmentBegin=max(entry,span*pow(f32(i)/f32(samples),1.35));
    let segmentEnd=span*pow(f32(i+1u)/f32(samples),1.35);
    if(segmentBegin>=reach){break;}
    let stepLen=min(reach,segmentEnd)-segmentBegin;
    if(stepLen<=0.0){continue;}
    let segmentLength=stepLen;
    // Even quadrature of the visible part of the segment keeps the marine
    // shafts coherent as the cloud breaks move across the ray grid.
    let along=segmentBegin+segmentLength*select(mix(0.5,baseRand,0.12),0.5,stableShaft);
    let t=along/span;

    let beamWidth = max(
      mix(0.0075, 0.029, sqrt(t)) *
      mix(0.92, 1.34, lowSun) *
      mix(1.00, 1.26, clamp(dist / max(span, 0.001), 0.0, 1.0)),
      pix * mix(2.0, 4.0, sqrt(t))
    ) * select(1.0, 0.72, localBank);

    var jitter=0.0;
    if (!stableShaft) {
      jitter=(hash12(pixelCell + vec2<f32>(f32(i)*7.13,f32(i)*3.17))*2.0-1.0)*beamWidth*0.025;
    }

    let suv = clamp(
      sunHint + dir * along + perp * jitter,
      vec2<f32>(0.001, 0.001),
      vec2<f32>(0.999, 0.999)
    );

    let sourceDims=vec2<f32>(textureDimensions(tex,0));
    let segmentLOD=log2(max(length(dir*sourceDims)*segmentLength*0.30,1.0));
    let lod=max(mix(2.25,0.65,t),segmentLOD);
    let mask=filteredGodRayMask(suv,layer,lod,dir*segmentLength*0.5,perp*beamWidth,receiverDistance);
    let cloudOcc=mask.x;
    let occ=max(cloudOcc,mask.y);
    // Terrain removes light. Its abrupt depth silhouette is not a luminous
    // cloud opening: feeding it into edgeLift made mountains emit bright fans.
    let edge = abs(cloudOcc - prevOcc) * 0.72;

    let extinction =
      occ *
      mix(1.45, 2.30, lowSun) *
      mix(0.90, 1.20, smoothstep(0.015, 0.14, edge)) *
      (stepLen * 12.0);

    let stepTr = 1.0 / (1.0 + extinction * (1.0 + 0.28 * extinction));

    let scatterW =
      (1.0 - occ) *
      mix(0.62, 0.84, smoothstep(0.015, 0.14, edge)) *
      mix(1.0, 0.86, pow(t, 1.4));

    let weight=stepLen/max(visibleLength,0.0001);
    if (trackAnvilGaps && cloudOcc < 0.72 && mask.y < 0.84) {
      // Compare the narrow beam to the neighboring directions over the same
      // radial segment. Favor a lit opening and let terrain close the path.
      let flank = min(beamWidth * 3.6 + 0.018, 0.075);
      let opening = anvilAperture(suv, perp * flank, layer, max(lod, 1.0), cloudOcc);
      apertureAccum += transmittance * opening * (1.0 - mask.y) * weight;
    }
    brightAccum += transmittance * scatterW * weight;
    blockerAccum += transmittance * (1.0 - stepTr) * mix(0.60, 1.0, t);
    edgeAccum += edge * weight;
    weightAccum += weight;

    transmittance *= stepTr;
    prevOcc = cloudOcc;

    // Keep normalization independent of where an opaque blocker is first hit.
    // A variable early-exit count produced abrupt ray bands across the sky.
  }

  let brightBase = brightAccum / max(weightAccum * 0.68, 0.0001);
  let blocker = blockerAccum / 0.80;
  let edgeLift = smoothstep(0.004, 0.060, edgeAccum / max(weightAccum, 1.0));

  // Clear gaps transport light; uniform clear sky carries no artificial shaft glow.
  var shaft = brightBase * edgeLift * pow(max(transmittance, 0.0), 0.16) * mix(0.35,2.60,smoothstep(0.45,2.0,strength));
  if (trackAnvilGaps) {
    let aperture = apertureAccum / max(weightAccum, 0.0001);
    let fade = (1.0 - smoothstep(0.30, 1.15, radialX)) * smoothstep(0.42, 0.82, towardSun);
    let focused = aperture * pow(max(transmittance, 0.0), 0.38) * mix(6.4, 10.6, lowSun);
    shaft = mix(shaft, shaft * 0.63 + focused, fade);
  }
  let shadow = blocker * mix(0.68, 1.08, edgeLift);
  // Compress smoothly instead of clipping whole sky regions to identical
  // bright/dark values as strength increases. Clipping made mask bands visible.
  let result=max(vec2<f32>(shaft*windowPre*localFade,shadow*windowPre),vec2<f32>(0.0));
  return result/(vec2<f32>(1.0)+result);
}

fn flatAircraftForeground(sample: vec4<f32>, paint: vec3<f32>) -> vec4<f32> {
  let transmission = clamp((sample.a - .5) * 2.0, 0.0, 1.0);
  return vec4<f32>(max(sample.rgb - transmission * paint, vec3<f32>(0.0)), 1.0 - transmission);
}

fn sampleAircraftForeground(uv: vec2<f32>, layer: i32, sunDir: vec3<f32>, paint: vec3<f32>,
    shell: bool) -> vec4<f32> {
  let center = sampleCloudRaw(uv, layer);
  let dimensions = vec2<i32>(textureDimensions(tex));
  if ((shell && center.a < .001) || all(displayTextureDimensions() <= vec2<f32>(dimensions))) {
    return select(flatAircraftForeground(center, paint), center, shell);
  }

  // Interpolate only rays that also hit the plane. A ray beside a thin wing
  // may contain cloud behind it, and a ray on a different panel has other paint.
  let pixel=uv*vec2<f32>(dimensions)-.5;
  let base=vec2<i32>(floor(pixel));
  let fraction=fract(pixel);
  let position=vec3<f32>(R._p13,R._p14,R._p16);
  var sum=vec4<f32>(0.0);
  var total=0.0;
  for(var y=0; y<2; y++){
    for(var x=0; x<2; x++){
      let offset=vec2<i32>(x,y);
      let samplePixel=clamp(base+offset,vec2<i32>(0),dimensions-1);
      let sampleUV=(vec2<f32>(samplePixel)+.5)/vec2<f32>(dimensions);
      let hit=sceneAircraft(R.camPos,rayDirFromUV(sampleUV),position,R.right,R.up,R.fwd,
        R._p4,R._p5,R._p6,R._p17,sunDir);
      if(hit.distance>=cloudTerrainDepth(terrainTexture,sampleUV,R.terrain.x)){continue;}
      let weights=1.0-abs(vec2<f32>(offset)-fraction);
      let weight=weights.x*weights.y;
      let tap=textureLoad(tex,samplePixel,layer,0);
      sum+=select(flatAircraftForeground(tap, hit.color), tap, shell)*weight;
      total+=weight;
    }
  }
  return sum/max(total,.00001);
}

@fragment
fn fs_main(in:VSOut)->@location(0) vec4<f32> {
  let color = resolvePreviewColor(in);
  return vec4<f32>(sceneDisplayContrast(color.rgb, R.region.z), color.a);
}

fn resolvePreviewColor(in: VSOut) -> vec4<f32> {
  let layer = i32(R.layerIndex);
  let shellScene = PREVIEW_PLANET_SHELL != 0u || (PREVIEW_SOFT_VOLUME == 0u && R.planetOpacity.w > .5);
  let rayDir = rayDirFromUV(in.uv);
  let terrainSample = cloudTerrainSample(terrainTexture, in.uv, R.terrain.x);
  let center = sampleCloudRaw(in.uv, layer);
  var depthEdge = vec4<f32>(-1.0);
  if (R.terrain.x > .5 && (shellScene || (R.fieldLighting > .5 && R.cloudShading < 1.5)) &&
      R.compositeQuality != 0u && center.a > .008) {
    let size = vec2<f32>(textureDimensions(tex));
    if (any(displayTextureDimensions() > size * 1.5) && !cloudFootprintMayHitAircraft(rayDir, size)) {
      depthEdge = reconstructTerrainBoundary(in.uv, layer, size, terrainSample.a);
    }
  }
  var neighborhood = CloudNeighborhood(center, vec2<f32>(0.0), center.a, vec2<f32>(0.0), 0.0);
  var texel = center;
  if (!shellScene) {
    var centerTexel = depthEdge;
    if (depthEdge.a < 0.0) {
      centerTexel = sampleCloudResolved(in.uv, layer, rayDir, center);
    }
    neighborhood = sampleCloudNeighborhood(in.uv, layer, centerTexel);
    texel = select(neighborhood.filtered, depthEdge, depthEdge.a >= 0.0);
  }
  let alphaGate = alphaFloorGate(texel.a);
  var cloudRGB = texel.rgb * alphaGate;
  var cloudA = clamp(texel.a * alphaGate, 0.0, 1.0);

  let sunDir = normalize(R.sunDir);
  let aircraftPosition = vec3<f32>(R._p13, R._p14, R._p16);
  let aircraft=sceneAircraft(R.camPos,rayDir,aircraftPosition,R.right,R.up,R.fwd,R._p4,R._p5,R._p6,R._p17,sunDir);
  let regionRadius = R.terrainBody.x;
  let regionExtent = R.region.x;
  let planetInterval = cloudShaftSphere(R.camPos, rayDir, regionRadius, 0.0);
  let regionGroundRay = regionExtent > 0.0 && planetInterval.x <= planetInterval.y && planetInterval.y > 0.0;
  let regionGroundDepth = select(1000000.0, max(0.0, planetInterval.x), regionGroundRay);
  var terrainDistance = select(1000000.0, terrainSample.a, terrainSample.a > 0.0);
  let terrainRay=terrainDistance<1000000.0;
  if (terrainRay && regionExtent > 0.0) {
    terrainDistance = regionalReceiverDepth(in.uv, rayDir, terrainDistance);
  }
  let sceneDepth = select(regionGroundDepth, terrainDistance, terrainRay);
  let hullRay=aircraft.distance<1000000.0 && aircraft.distance<sceneDepth;
  // Terrain and aircraft depth block celestial bodies even when distance fog
  // blends their surface colors into the sky.
  // The mesh ends before the full horizon in some views. Keep the solid
  // planet opaque beyond its last rendered triangles.
  let planetBlocksSky = previewPlanetBlocksSky(R.camPos, rayDir, regionRadius);
  let celestialRay = !terrainRay && !hullRay && !planetBlocksSky;
  let terrainMetersPerUnit = R.ocean.z;
  let distantGlow = select(smoothstep(3.0, 70.0, terrainDistance),
    sceneTerrainGlowVisibility(terrainDistance * terrainMetersPerUnit), terrainMetersPerUnit > 0.0);
  let foregroundGlow = select(select(1.0, distantGlow, terrainRay), 0.0, hullRay);
  if(PREVIEW_PLANET_SHELL == 0u && hullRay && (PREVIEW_SOFT_VOLUME != 0u || R.planetOpacity.w < .5)){
    let foreground = sampleAircraftForeground(in.uv, layer, sunDir, aircraft.color, false);
    cloudRGB = foreground.rgb;
    cloudA = foreground.a;
  }
  let uvSun = projectDirToUV(sunDir);

  let v = in.uv.y;
  let horizon = pow(clamp(1.0 - abs(rayDir.y) * 7.5, 0.0, 1.0), 1.65) * 0.28;
  let lowSunRaw = 1.0 - clamp((sunDir.y + 0.08) / 0.82, 0.0, 1.0);
  let lowSun = clamp(pow(lowSunRaw, 0.72) * 1.18, 0.0, 1.0);
  let towardSunSky = clamp(dot(rayDir, sunDir), 0.0, 1.0);
  let localBank = R.terrain.z > 0.5 && R.skyCycle < 0.5;
  let twilight = bankTwilight(sunDir.y, localBank);

  let style = R.gradeStyle;
  var zenithSky = mix(R.sky * 0.98 + vec3<f32>(0.010, 0.018, 0.034), vec3<f32>(0.56, 0.66, 0.86), lowSun * 0.18);
  var horizonSky = mix(R.sky * 0.78 + vec3<f32>(0.040, 0.056, 0.078), vec3<f32>(0.90, 0.84, 0.88), lowSun * 0.22);
  var sunWash = mix(vec3<f32>(1.02, 0.98, 0.94), vec3<f32>(1.06, 0.90, 0.84), lowSun * 0.42);
  var sunColor = mix(vec3<f32>(1.02, 0.98, 0.94), vec3<f32>(1.08, 0.90, 0.82), lowSun * 0.34);
  var shadowCool = mix(vec3<f32>(0.84, 0.90, 0.98), vec3<f32>(0.76, 0.82, 0.96), lowSun * 0.26);
  var edgeWarm = mix(vec3<f32>(1.02, 1.00, 0.98), vec3<f32>(1.08, 0.96, 0.90), lowSun * 0.34);
  var litTintBase = vec3<f32>(0.99, 1.0, 1.0);
  var shadowTintBase = vec3<f32>(0.84, 0.90, 0.98);

  if (style == 1u) {
    zenithSky = mix(R.sky * 0.92 + vec3<f32>(0.018, 0.012, 0.044), vec3<f32>(0.58, 0.40, 0.74), lowSun * 0.62);
    horizonSky = mix(R.sky * 0.68 + vec3<f32>(0.094, 0.050, 0.070), vec3<f32>(1.12, 0.60, 0.42), lowSun * 0.88);
    sunWash = mix(vec3<f32>(1.0, 0.94, 0.88), vec3<f32>(1.16, 0.68, 0.46), lowSun * 0.86);
    sunColor = mix(vec3<f32>(1.0, 0.96, 0.90), vec3<f32>(1.12, 0.74, 0.52), lowSun * 0.78);
    shadowCool = mix(vec3<f32>(0.94, 0.96, 1.0), vec3<f32>(0.62, 0.56, 0.82), lowSun * 0.84);
    edgeWarm = mix(vec3<f32>(1.0, 0.97, 0.92), vec3<f32>(1.20, 0.84, 0.58), lowSun * 0.82);
    litTintBase = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.20, 0.88, 0.68), lowSun * 0.82);
    shadowTintBase = mix(vec3<f32>(0.96, 0.97, 1.0), vec3<f32>(0.40, 0.34, 0.58), lowSun * 0.86);
  } else if (style == 2u) {
    zenithSky = mix(R.sky * 0.88 + vec3<f32>(0.014, 0.012, 0.040), vec3<f32>(0.28, 0.22, 0.52), lowSun * 0.70);
    horizonSky = mix(R.sky * 0.64 + vec3<f32>(0.042, 0.040, 0.076), vec3<f32>(0.84, 0.54, 0.82), lowSun * 0.74);
    sunWash = mix(vec3<f32>(0.96, 0.92, 0.96), vec3<f32>(0.98, 0.70, 1.06), lowSun * 0.96);
    sunColor = mix(vec3<f32>(0.98, 0.92, 0.96), vec3<f32>(1.00, 0.74, 1.08), lowSun * 0.90);
    shadowCool = mix(vec3<f32>(0.88, 0.90, 0.99), vec3<f32>(0.66, 0.58, 0.96), lowSun * 1.00);
    edgeWarm = mix(vec3<f32>(0.98, 0.94, 0.98), vec3<f32>(1.02, 0.80, 1.04), lowSun * 0.88);
    litTintBase = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(1.08, 0.92, 1.04), lowSun * 0.82);
    shadowTintBase = mix(vec3<f32>(0.96, 0.97, 1.0), vec3<f32>(0.52, 0.46, 0.88), lowSun * 1.00);
  } else if (style == 3u) {
    zenithSky = mix(R.sky * 0.94 + vec3<f32>(0.010, 0.016, 0.030), vec3<f32>(0.42, 0.48, 0.62), lowSun * 0.18);
    horizonSky = mix(R.sky * 0.66 + vec3<f32>(0.030, 0.042, 0.060), vec3<f32>(0.62, 0.68, 0.78), lowSun * 0.16);
    sunWash = mix(vec3<f32>(0.90, 0.94, 1.00), vec3<f32>(0.82, 0.88, 0.98), lowSun * 0.20);
    sunColor = mix(vec3<f32>(0.94, 0.96, 1.00), vec3<f32>(0.88, 0.92, 0.98), lowSun * 0.18);
    shadowCool = mix(vec3<f32>(0.90, 0.94, 1.0), vec3<f32>(0.78, 0.84, 0.96), lowSun * 0.42);
    edgeWarm = mix(vec3<f32>(0.96, 0.97, 1.0), vec3<f32>(0.88, 0.90, 0.96), lowSun * 0.22);
    litTintBase = vec3<f32>(0.98, 0.99, 1.0);
    shadowTintBase = vec3<f32>(0.84, 0.89, 0.97);
  } else if (style == 4u) {
    zenithSky = mix(R.sky * 0.78 + vec3<f32>(0.022, 0.012, 0.018), vec3<f32>(0.18, 0.08, 0.14), lowSun * 0.82);
    horizonSky = mix(R.sky * 0.52 + vec3<f32>(0.098, 0.026, 0.028), vec3<f32>(1.12, 0.48, 0.14), lowSun * 0.94);
    sunWash = mix(vec3<f32>(1.02, 0.92, 0.84), vec3<f32>(1.20, 0.52, 0.20), lowSun * 0.90);
    sunColor = mix(vec3<f32>(1.04, 0.92, 0.80), vec3<f32>(1.20, 0.56, 0.18), lowSun * 0.92);
    shadowCool = mix(vec3<f32>(0.74, 0.68, 0.72), vec3<f32>(0.14, 0.06, 0.10), lowSun * 0.98);
    edgeWarm = mix(vec3<f32>(1.02, 0.96, 0.90), vec3<f32>(1.24, 0.68, 0.24), lowSun * 0.96);
    litTintBase = mix(vec3<f32>(1.0, 0.98, 0.94), vec3<f32>(1.22, 0.76, 0.40), lowSun * 0.92);
    shadowTintBase = mix(vec3<f32>(0.24, 0.12, 0.10), vec3<f32>(0.04, 0.015, 0.022), lowSun * 1.00);
  } else if (style == 5u) {
    zenithSky = mix(R.sky * 0.86 + vec3<f32>(0.016, 0.012, 0.034), vec3<f32>(0.30, 0.18, 0.38), lowSun * 0.56);
    horizonSky = mix(R.sky * 0.64 + vec3<f32>(0.054, 0.030, 0.056), vec3<f32>(0.94, 0.52, 0.50), lowSun * 0.72);
    sunWash = mix(vec3<f32>(0.98, 0.92, 0.92), vec3<f32>(1.10, 0.66, 0.64), lowSun * 0.76);
    sunColor = mix(vec3<f32>(1.0, 0.92, 0.90), vec3<f32>(1.10, 0.68, 0.66), lowSun * 0.76);
    shadowCool = mix(vec3<f32>(0.90, 0.90, 1.0), vec3<f32>(0.58, 0.42, 0.96), lowSun * 0.82);
    edgeWarm = mix(vec3<f32>(1.0, 0.96, 0.96), vec3<f32>(1.12, 0.78, 0.86), lowSun * 0.76);
    litTintBase = mix(vec3<f32>(1.0, 0.98, 0.98), vec3<f32>(1.14, 0.84, 0.80), lowSun * 0.78);
    shadowTintBase = mix(vec3<f32>(0.96, 0.97, 1.0), vec3<f32>(0.46, 0.32, 0.90), lowSun * 0.86);
  } else if (style == 6u) {
    zenithSky = mix(R.sky * 0.82 + vec3<f32>(0.028, 0.020, 0.012), vec3<f32>(0.44, 0.26, 0.14), lowSun * 0.70);
    horizonSky = mix(R.sky * 0.58 + vec3<f32>(0.080, 0.046, 0.020), vec3<f32>(1.04, 0.62, 0.24), lowSun * 0.86);
    sunWash = mix(vec3<f32>(1.04, 0.94, 0.80), vec3<f32>(1.18, 0.72, 0.30), lowSun * 0.86);
    sunColor = mix(vec3<f32>(1.06, 0.94, 0.74), vec3<f32>(1.18, 0.72, 0.34), lowSun * 0.84);
    shadowCool = mix(vec3<f32>(0.82, 0.78, 0.74), vec3<f32>(0.30, 0.16, 0.12), lowSun * 0.88);
    edgeWarm = mix(vec3<f32>(1.04, 0.96, 0.84), vec3<f32>(1.28, 0.82, 0.34), lowSun * 0.88);
    litTintBase = mix(vec3<f32>(1.0, 0.98, 0.90), vec3<f32>(1.22, 0.86, 0.48), lowSun * 0.86);
    shadowTintBase = mix(vec3<f32>(0.72, 0.62, 0.58), vec3<f32>(0.18, 0.08, 0.06), lowSun * 0.90);
  } else if (style == 7u) {
    zenithSky = mix(R.sky * 0.86 + vec3<f32>(0.004, 0.016, 0.034), vec3<f32>(0.10, 0.24, 0.42), lowSun * 0.32);
    horizonSky = mix(R.sky * 0.58 + vec3<f32>(0.008, 0.052, 0.072), vec3<f32>(0.24, 0.64, 0.88), lowSun * 0.42);
    sunWash = mix(vec3<f32>(0.78, 0.96, 1.08), vec3<f32>(0.46, 0.86, 1.12), lowSun * 0.44);
    sunColor = mix(vec3<f32>(0.78, 0.96, 1.12), vec3<f32>(0.42, 0.78, 1.16), lowSun * 0.40);
    shadowCool = mix(vec3<f32>(0.70, 0.86, 1.0), vec3<f32>(0.06, 0.20, 0.36), lowSun * 0.62);
    edgeWarm = mix(vec3<f32>(0.72, 0.98, 1.16), vec3<f32>(0.38, 1.08, 1.38), lowSun * 0.54);
    litTintBase = mix(vec3<f32>(0.94, 0.98, 1.0), vec3<f32>(0.56, 0.96, 1.22), lowSun * 0.56);
    shadowTintBase = mix(vec3<f32>(0.72, 0.84, 1.0), vec3<f32>(0.03, 0.12, 0.26), lowSun * 0.72);
  } else if (style == 8u) {
    zenithSky = mix(R.sky * 0.88 + vec3<f32>(0.004, 0.030, 0.028), vec3<f32>(0.08, 0.38, 0.34), lowSun * 0.50);
    horizonSky = mix(R.sky * 0.62 + vec3<f32>(0.008, 0.074, 0.056), vec3<f32>(0.32, 0.92, 0.64), lowSun * 0.62);
    sunWash = mix(vec3<f32>(0.80, 1.06, 0.96), vec3<f32>(0.50, 1.18, 0.80), lowSun * 0.58);
    sunColor = mix(vec3<f32>(0.84, 1.04, 0.94), vec3<f32>(0.58, 1.16, 0.72), lowSun * 0.56);
    shadowCool = mix(vec3<f32>(0.74, 0.92, 0.94), vec3<f32>(0.04, 0.24, 0.22), lowSun * 0.72);
    edgeWarm = mix(vec3<f32>(0.78, 1.06, 0.96), vec3<f32>(0.38, 1.28, 0.78), lowSun * 0.68);
    litTintBase = mix(vec3<f32>(0.96, 1.0, 0.96), vec3<f32>(0.64, 1.18, 0.82), lowSun * 0.68);
    shadowTintBase = mix(vec3<f32>(0.76, 0.92, 0.92), vec3<f32>(0.04, 0.18, 0.18), lowSun * 0.78);
  } else if (style == 9u) {
    zenithSky = mix(R.sky * 0.90 + vec3<f32>(0.018, 0.018, 0.012), vec3<f32>(0.48, 0.40, 0.24), lowSun * 0.38);
    horizonSky = mix(R.sky * 0.62 + vec3<f32>(0.052, 0.046, 0.026), vec3<f32>(0.92, 0.70, 0.34), lowSun * 0.54);
    sunWash = mix(vec3<f32>(1.0, 0.96, 0.82), vec3<f32>(1.10, 0.88, 0.44), lowSun * 0.58);
    sunColor = mix(vec3<f32>(1.0, 0.96, 0.80), vec3<f32>(1.12, 0.90, 0.50), lowSun * 0.52);
    shadowCool = mix(vec3<f32>(0.84, 0.82, 0.76), vec3<f32>(0.34, 0.28, 0.18), lowSun * 0.64);
    edgeWarm = mix(vec3<f32>(1.02, 0.98, 0.84), vec3<f32>(1.20, 0.98, 0.52), lowSun * 0.60);
    litTintBase = mix(vec3<f32>(1.0, 0.98, 0.90), vec3<f32>(1.18, 0.98, 0.58), lowSun * 0.58);
    shadowTintBase = mix(vec3<f32>(0.72, 0.70, 0.64), vec3<f32>(0.20, 0.16, 0.10), lowSun * 0.68);
  } else if (style == 10u) {
    zenithSky = mix(R.sky * 0.86 + vec3<f32>(0.020, 0.010, 0.024), vec3<f32>(0.34, 0.14, 0.28), lowSun * 0.58);
    horizonSky = mix(R.sky * 0.62 + vec3<f32>(0.064, 0.024, 0.040), vec3<f32>(1.02, 0.46, 0.58), lowSun * 0.74);
    sunWash = mix(vec3<f32>(1.0, 0.88, 0.94), vec3<f32>(1.16, 0.60, 0.76), lowSun * 0.74);
    sunColor = mix(vec3<f32>(1.0, 0.88, 0.94), vec3<f32>(1.12, 0.60, 0.80), lowSun * 0.72);
    shadowCool = mix(vec3<f32>(0.86, 0.82, 0.96), vec3<f32>(0.30, 0.12, 0.34), lowSun * 0.82);
    edgeWarm = mix(vec3<f32>(1.0, 0.92, 0.98), vec3<f32>(1.18, 0.70, 0.96), lowSun * 0.74);
    litTintBase = mix(vec3<f32>(1.0, 0.96, 0.98), vec3<f32>(1.16, 0.78, 0.88), lowSun * 0.76);
    shadowTintBase = mix(vec3<f32>(0.84, 0.78, 0.96), vec3<f32>(0.20, 0.08, 0.28), lowSun * 0.86);
  } else if (style == 11u) {
    zenithSky = mix(R.sky * 0.84 + vec3<f32>(0.004, 0.008, 0.030), vec3<f32>(0.04, 0.10, 0.30), lowSun * 0.22);
    horizonSky = mix(R.sky * 0.58 + vec3<f32>(0.006, 0.014, 0.060), vec3<f32>(0.14, 0.30, 0.74), lowSun * 0.30);
    sunWash = mix(vec3<f32>(0.72, 0.84, 1.10), vec3<f32>(0.38, 0.54, 1.16), lowSun * 0.36);
    sunColor = mix(vec3<f32>(0.74, 0.86, 1.14), vec3<f32>(0.44, 0.58, 1.18), lowSun * 0.34);
    shadowCool = mix(vec3<f32>(0.62, 0.72, 1.0), vec3<f32>(0.02, 0.04, 0.18), lowSun * 0.58);
    edgeWarm = mix(vec3<f32>(0.72, 0.86, 1.18), vec3<f32>(0.38, 0.62, 1.42), lowSun * 0.46);
    litTintBase = mix(vec3<f32>(0.90, 0.94, 1.0), vec3<f32>(0.52, 0.72, 1.28), lowSun * 0.50);
    shadowTintBase = mix(vec3<f32>(0.58, 0.66, 0.96), vec3<f32>(0.015, 0.030, 0.14), lowSun * 0.64);
  } else if (style == 12u) {
    zenithSky = mix(R.sky * 1.02 + vec3<f32>(0.000, 0.016, 0.052), vec3<f32>(0.34, 0.54, 0.86), lowSun * 0.16);
    horizonSky = mix(R.sky * 0.72 + vec3<f32>(0.018, 0.064, 0.126), vec3<f32>(0.66, 0.78, 0.96), lowSun * 0.18);
    sunWash = mix(vec3<f32>(1.15, 1.06, 0.94), vec3<f32>(1.18, 0.98, 0.86), lowSun * 0.24);
    sunColor = mix(vec3<f32>(1.16, 1.06, 0.92), vec3<f32>(1.20, 0.98, 0.84), lowSun * 0.22);
    shadowCool = mix(vec3<f32>(0.94, 0.86, 0.76), vec3<f32>(0.86, 0.72, 0.66), lowSun * 0.34);
    edgeWarm = mix(vec3<f32>(1.22, 1.12, 0.98), vec3<f32>(1.26, 1.04, 0.90), lowSun * 0.24);
    litTintBase = vec3<f32>(1.15, 1.08, 0.96);
    shadowTintBase = vec3<f32>(0.96, 0.88, 0.78);
  } else if (style == 13u) {
    zenithSky = mix(R.sky * 1.06 + vec3<f32>(0.000, 0.022, 0.070), vec3<f32>(0.26, 0.48, 0.88), lowSun * 0.14);
    horizonSky = mix(R.sky * 0.70 + vec3<f32>(0.010, 0.068, 0.150), vec3<f32>(0.58, 0.74, 1.00), lowSun * 0.16);
    sunWash = mix(vec3<f32>(1.18, 1.08, 0.96), vec3<f32>(1.22, 1.00, 0.88), lowSun * 0.22);
    sunColor = mix(vec3<f32>(1.20, 1.08, 0.94), vec3<f32>(1.24, 1.00, 0.86), lowSun * 0.20);
    shadowCool = mix(vec3<f32>(0.96, 0.88, 0.80), vec3<f32>(0.88, 0.74, 0.68), lowSun * 0.34);
    edgeWarm = mix(vec3<f32>(1.26, 1.16, 1.00), vec3<f32>(1.30, 1.08, 0.92), lowSun * 0.22);
    litTintBase = vec3<f32>(1.18, 1.10, 0.98);
    shadowTintBase = vec3<f32>(0.98, 0.90, 0.80);
  } else if (style == 15u) {
    zenithSky = R.sky * 0.92 + vec3<f32>(0.000, 0.006, 0.045);
    horizonSky = R.sky * 0.62 + vec3<f32>(0.010, 0.030, 0.112);
    sunWash = vec3<f32>(1.26, 0.16, 0.12);
    sunColor = vec3<f32>(1.36, 0.12, 0.10);
    shadowCool = vec3<f32>(0.06, 0.16, 1.10);
    edgeWarm = vec3<f32>(0.08, 1.24, 0.20);
    litTintBase = vec3<f32>(1.18, 0.22, 0.18);
    shadowTintBase = vec3<f32>(0.04, 0.12, 1.10);
  }

  let userSunTint = max(R.sunColorTint, vec3<f32>(0.0));
  let userLightTint = max(R.lightTint, vec3<f32>(0.0));
  let userShadowTint = max(R.shadowTint, vec3<f32>(0.0));
  let userEdgeTint = max(R.edgeTint, vec3<f32>(0.0));

  if (style >= 16u) {
    // New looks are authored entirely by the shared palette, with no hidden
    // legacy sunset family fighting its sky or volume-light colors.
    zenithSky = R.sky;
    horizonSky = R.sky * 1.16;
    sunColor = vec3<f32>(1.0);
    sunWash = vec3<f32>(1.0);
    shadowCool = userShadowTint;
    edgeWarm = userEdgeTint;
    litTintBase = userLightTint;
    shadowTintBase = userShadowTint;
  }
  if (style == 45u) {
    horizonSky = mix(R.sky * 1.16, vec3<f32>(0.94, 0.58, 0.30), lowSun * 0.90);
    sunWash = mix(vec3<f32>(1.0), vec3<f32>(1.10, 0.78, 0.43), lowSun);
  }

  let marineGrade = style >= 50u && style <= 54u;
  if (marineGrade) {
    let daylightHorizon = vec3<f32>(0.42, 0.54, 0.66);
    var warmHorizon = mix(vec3<f32>(0.73, 0.52, 0.35), vec3<f32>(0.90, 0.58, 0.32), select(0.0, 1.0, style == 53u));
    var localTwilight = smoothstep(0.06, 0.9, lowSun);
    if (style == 54u) {
      // Low sunlight warms the horizon in the direction of the opening.
      // The rest of the sky and the shaded cloud can hold their blue-gray.
      let dusk = 1.0 - smoothstep(0.05, 0.37, sunDir.y);
      let sunward = pow(towardSunSky, 3.2);
      warmHorizon = mix(vec3<f32>(0.75, 0.46, 0.44), vec3<f32>(0.94, 0.43, 0.27), dusk);
      localTwilight *= mix(0.43, 1.0, sunward);
    }
    let warm = select(0.0, localTwilight, style >= 52u);
    horizonSky = mix(daylightHorizon, warmHorizon, warm);
    sunWash = mix(vec3<f32>(1.0), userSunTint, warm * 0.72);
  }
  sunColor *= mix(vec3<f32>(1.0, 1.0, 1.0), userSunTint, 0.72);
  sunWash *= mix(vec3<f32>(1.0, 1.0, 1.0), userSunTint, 0.26);
  if (localBank) {
    let sunward = pow(towardSunSky, 4.5);
    let horizonWarmth = twilight.amount * mix(0.12, 0.78, sunward);
    horizonSky = mix(horizonSky, vec3<f32>(0.92, 0.39, 0.20), horizonWarmth) * twilight.ambient;
    zenithSky *= twilight.ambient;
    sunColor *= twilight.tint;
    sunWash *= twilight.tint;
  }

  // The authored atmosphere applies equally to cached and procedural clouds.
  // Cached lighting is illumination inside cloud matter, not aerial extinction.
  let fogDensity = clamp(R.reservedControls.y, 0.0, 5.28);
  let fogHorizon = clamp(R.reservedControls.z, 0.0, 2.0);
  let fogSun = clamp(R.reservedControls.w, 0.0, 2.0);
  let sunConeHaze = previewSunConeHaze(towardSunSky, fogDensity, fogSun, lowSun) * foregroundGlow;
  let sunConeHorizon = 0.58 + 0.42 * previewHorizonBand(rayDir, fogHorizon);

  var sky = mix(horizonSky, zenithSky, pow(clamp(v, 0.0, 1.0), 1.35));
  if (style == 45u) {
    // Photo-inspired blue morning sky: keep warm color close to the physical
    // horizon rather than washing the entire sky orange with screen height.
    let elevation = max(rayDir.y, 0.0);
    let blue = mix(vec3<f32>(0.39, 0.61, 0.86), R.sky, smoothstep(0.0, 0.55, elevation));
    let dawnBand = exp(-elevation * 22.0) * lowSun * mix(0.30, 1.0, towardSunSky * towardSunSky);
    sky = mix(blue, vec3<f32>(1.0, 0.62, 0.31), dawnBand * 0.85);
  }
  if (marineGrade) {
    sky = mix(horizonSky, zenithSky, smoothstep(0.0, 0.53, max(rayDir.y, 0.0)));
  }
  if(R.skyCycle>0.5) {
    // Explicit linear TOD colors must not inherit a bright daytime horizon.
    zenithSky=R.sky;
    let twilight=(1.0-smoothstep(.05,.55,sunDir.y))*(1.0-smoothstep(.85,1.0,R.nightAmount));
    horizonSky=mix(R.sky*1.35,vec3<f32>(.65,.22,.09),twilight*.70);
    if (R.styleSkyOverride > 0.5) {
      // A selected palette keeps its sky family, while the clock still warms
      // the horizon. Previously the override erased sunrise/sunset entirely.
      horizonSky=mix(R.sky*1.16,vec3<f32>(.65,.22,.09),twilight*.62);
    }
    sunColor=max(R.sunColorTint,vec3<f32>(0));
    sunWash=sunColor;
    shadowCool=mix(vec3<f32>(.65,.75,.90),vec3<f32>(.08,.12,.24),R.nightAmount);
    if (R.styleSkyOverride > 0.5) {
      shadowCool=userShadowTint*mix(1.0,.20,R.nightAmount);
    }
    // Tie twilight to the world horizon so orbiting/pitching the camera cannot
    // put the warm band overhead or reverse it with the screen-space gradient.
    sky=mix(horizonSky,zenithSky,pow(clamp(rayDir.y,0.0,1.0),0.65));
  }
  // The shared atmosphere uses angular distance to the sun and the world horizon.
  // Keep night and air below the horizon on the existing day/night transition.
  let nearSun = max(dot(rayDir, sunDir), 0.0);
  let sunAboveHorizon = smoothstep(-.13, .035, sunDir.y) * (1.0 - smoothstep(.18, .62, R.nightAmount));
  let sunsetWeight = (1.0 - smoothstep(.12, .55, sunDir.y)) * sunAboveHorizon;
  let cloudSunVisibility = sceneLocalCloudSun(sunDir.y);
  let sharedSkyWeight = .26 * sunsetWeight;
  let cycle = R.skyCycle > .5 && !shellScene;
  let night = select(sceneNightAmount(sunDir.y), smoothstep(.52, 1.0, R.nightAmount), cycle);
  let dayWeight = sceneTwilightWeight(sunDir.y) * (1.0 - smoothstep(.5, .92, R.nightAmount));
  let atmosphereWeight = select(R.sceneSkyTint.w * select(1.0, max(dayWeight, night), cycle), 1.0, shellScene);
  let pixelAngle = max(length(dpdx(rayDir)), length(dpdy(rayDir)));
  let skyTint = mix(vec3<f32>(.82,.90,1.0), R.sky, .24);
  let sharedSky = sceneSkyGradient(rayDir.y, nearSun, sunDir.y) * skyTint;
  let sharedHorizon = sceneSkyGradient(0.0, nearSun, sunDir.y) * skyTint;
  let sharedZenith = sceneSkyGradient(1.0, nearSun, sunDir.y) * skyTint;
  sky = mix(sky, sharedSky, sharedSkyWeight);
  horizonSky = mix(horizonSky, sharedHorizon, sharedSkyWeight);
  zenithSky = mix(zenithSky, sharedZenith, sharedSkyWeight);
  let sharedSolar = sceneSolarColor(sunDir.y) * userSunTint;
  let angularBloom = R.sunBloom * (.60 + .52 * sunsetWeight);
  let solarHaze = sceneSolarHaze(nearSun);
  let daylightHalo = (solarHaze + select(0.0, sceneSolarGlare(nearSun), celestialRay))
    * angularBloom * sunAboveHorizon * R.celestialVisibility;
  sky += sharedSolar * daylightHalo;
  sky += vec3<f32>(0.004, 0.006, 0.011) * horizon * twilight.ambient;
  sky += sunWash * pow(towardSunSky, 5.0) * mix(0.020, 0.090, lowSun) * twilight.direct;
  sky += sunWash * sunConeHaze * sunConeHorizon * twilight.direct;
  let paletteEnabled = R.sceneSkyTint.w > .5;
  let fluidSkyTint = select(R.sky / vec3<f32>(.50, .59, .74), R.sceneSkyTint.rgb, paletteEnabled);
  let fluidSolar = sceneSolarColor(sunDir.y) * select(userSunTint, R.sceneSolar.rgb, paletteEnabled);
  let fluidBloom = select(R.sunBloom, R.sceneSolar.w, paletteEnabled) * R.celestialVisibility;
  let directLight = select(1.0, R.sceneLighting.x, paletteEnabled);
  let litHaze = fluidSolar * sceneSunlitHaze(rayDir.y, nearSun, sunDir.y) * directLight * R.celestialVisibility;
  let aerialStrength = clamp(fogDensity / .22, 0.0, 12.0);
  let skyFlood = litHaze * (1.0 - exp(-.19 * aerialStrength));
  sky += skyFlood * (1.0 - night);
  var fluidBackdrop = vec3<f32>(0.0);
  var nightStars = vec3<f32>(0.0);
  if (atmosphereWeight > 0.0) {
    fluidBackdrop = sceneSkyGradient(rayDir.y, nearSun, sunDir.y) * fluidSkyTint + fluidSolar * (fluidBloom / .18)
      * (solarHaze + select(0.0, sceneSolarGlare(nearSun) + 4.0 * sceneSolarDisk(nearSun), celestialRay))
      + skyFlood;
    if (night > 0.0) {
      let skyRay = flatNightRay(rayDir, R.sceneLighting.yz, R.sceneLighting.w);
      var nightSky = sceneNightGradient(skyRay, rayDir.y, fluidSkyTint, celestialRay);
      if (celestialRay) {
        nightStars = (sceneNightStars(skyRay, rayDir.y, pixelAngle, R.terrainBody.y)
          + sceneConstellation(skyRay, pixelAngle, R.terrainBody.yzw)) * night;
      }
      if (celestialRay && cycle && R.nightAmount > .5) {
        let moon = .46 * sceneSolarDisk(nearSun) + .09 * sceneSolarHalo(nearSun);
        nightSky += vec3<f32>(.64, .76, 1.0) * moon * R.celestialVisibility;
      }
      fluidBackdrop = mix(fluidBackdrop, nightSky, night);
    }
  }
  var terrainVisibility = select(0.0, previewTerrainVisibility(terrainDistance), terrainRay);
  if (regionGroundRay) {
    let surface = R.camPos + rayDir * regionGroundDepth;
    let radial = normalize(surface + vec3<f32>(0.0, regionRadius, 0.0));
    let incidence = clamp(dot(radial, -rayDir), 0.0, 1.0);
    let diffuse = max(dot(radial, sunDir), 0.0);
    // Opaque low-detail continuation of the planet beyond the sampled tile.
    // Keep the directional terminator and soften only the distant limb with air.
    let base = vec3<f32>(.068, .116, .127) * (.24 + .76 * clamp(directLight, 0.0, 1.7) * diffuse);
    let planetaryHaze = sceneTerrainFog(regionGroundDepth * R.ocean.z, -incidence, aerialStrength);
    let haze = sceneSkyGradient(0.0, 0.0, sunDir.y) * fluidSkyTint;
    let body = mix(base * mix(1.0, .18, night), haze * .77, planetaryHaze * (1.0 - .85 * night));
    // At tangency the distant surface disappears into the same air as the sky.
    let limb = smoothstep(0.0, max(.018, pixelAngle * 8.0), incidence);
    fluidBackdrop = mix(fluidBackdrop, body, limb);
    sky = mix(sky, body, limb);
  }
  if (terrainRay) {
    let terrainPoint = R.camPos + rayDir * terrainDistance;
    if (regionExtent > 0.0) {
      let tangent = terrainPoint.xz * (regionRadius / max(1.0, regionRadius + terrainPoint.y));
      let edge = max(abs(tangent.x), abs(tangent.y)) / regionExtent;
      terrainVisibility = select(1.0, 1.0 - smoothstep(.78, .995, edge), regionGroundRay);
    }
    let cloudSun = cloudShaftSurfaceSun(R.camPos, terrainPoint, R.godRayControls.x * R.godRayControls.y
      * (1.0 - night) * smoothstep(.005, .075, sunDir.y), terrainDistance * pixelAngle, R.shadowDarkness);
    let shadowFill = mix(vec3<f32>(.27, .40, .55), vec3<f32>(.002), sceneDeepShadowAmount(R.shadowDarkness));
    var terrainColor = terrainSample.rgb * mix(vec3<f32>(1.0), vec3<f32>(.15, .22, .40), night)
      * mix(shadowFill, vec3<f32>(1.0), cloudSun);
    let receiver = cloudTerrainSample(terrainWaterTexture, in.uv, 1.0).rg;
    let receiverLight = clamp((receiver.y - .25) / .75, 0.0, 1.0);
    let surfaceShade = 1.0 - receiverLight;
    let darkness = max(sceneDeepShadowAmount(R.shadowDarkness), R.shadowDarkness * .65 / (R.shadowDarkness + 5.0));
    if (receiver.y > .12) {
      terrainColor *= mix(1.0, .003, surfaceShade * darkness);
    }
    if (R.ocean.y > 0.0) {
      if (receiver.x > .02) {
        let position = terrainPoint.xz * R.ocean.y;
        let pixelSpan = 2.0 * terrainDistance * tan(R.fovY * .5) * R.ocean.y /
          (displayTextureDimensions().y * sqrt(max(.20, abs(rayDir.y))));
        let waves = oceanWaves(position, R.ocean.x, pixelSpan);
        let normal = normalize(vec3<f32>(waves.slope.x, 1.0, waves.slope.y));
        let reflected = reflect(rayDir, normal);
        let fresnel = pow(1.0 - max(dot(-rayDir, normal), 0.0), 4.0);
        let reflectedSun = max(dot(reflected, sunDir), 0.0);
        var reflectedSky = mix(horizonSky, zenithSky, 1.0 - exp(-max(reflected.y, 0.0) * 5.2))
          + sharedSolar * (sceneSolarHalo(reflectedSun) - sceneSolarGlare(reflectedSun)) * angularBloom * sunAboveHorizon;
        let waterBase = vec3<f32>(.019,.066,.088) * (.76 + .40 * waves.roll);
        let solar = sunColor * twilight.direct * smoothstep(-.02,.13,sunDir.y);
        var reflectedLight = mix(solar, sharedSolar, sharedSkyWeight);
        if (atmosphereWeight > 0.0) {
          var newReflection = sceneSkyRadiance(reflected.y, reflectedSun, sunDir.y, fluidSkyTint, fluidSolar, fluidBloom, 0.0)
            - fluidSolar * sceneSolarGlare(reflectedSun) * (fluidBloom / .18);
          if (night > 0.0) {
            let reflectedSkyRay = flatNightRay(reflected, R.sceneLighting.yz, R.sceneLighting.w);
            newReflection = mix(newReflection, sceneNightGradient(reflectedSkyRay, reflected.y, fluidSkyTint, false), night);
          }
          reflectedSky = mix(reflectedSky, newReflection, atmosphereWeight);
          let directWaterLight = smoothstep(-.006, .025, sunDir.y);
          reflectedLight = mix(reflectedLight, fluidSolar * (1.0 - night) * directWaterLight, atmosphereWeight);
        }
        let litWater = oceanSurfaceLight(waterBase, reflectedSky, reflectedSun, reflectedLight * (directLight * cloudSun), receiverLight, fresnel);
        terrainColor = mix(terrainColor, litWater, smoothstep(.02, .96, receiver.x));
      }
    }
    sky = mix(sky, terrainColor * mix(1.0, .22, R.nightAmount) * twilight.ambient, terrainVisibility);
    if (atmosphereWeight > 0.0) {
      let hazeDirection = normalize(vec3<f32>(rayDir.x, max(.018, rayDir.y), rayDir.z));
      let hazeSun = max(dot(hazeDirection, sunDir), 0.0);
      var haze = sceneSkyGradient(hazeDirection.y, hazeSun * foregroundGlow, sunDir.y) * fluidSkyTint
        + (fluidSolar * sceneSolarHaze(hazeSun) * (fluidBloom / .18) + litHaze) * foregroundGlow;
      if (night > 0.0) {
        let hazeSkyRay = flatNightRay(hazeDirection, R.sceneLighting.yz, R.sceneLighting.w);
        haze = mix(haze, sceneNightGradient(hazeSkyRay, hazeDirection.y, fluidSkyTint, false), night);
      }
      var distanceFog: f32;
      if (shellScene) {
        // The shell uses the planet's distance scale. Unbounded local-world
        // haze washed out whole valleys and swallowed the low cloud banks.
        let horizonBias = (fogHorizon - .30) * .40 * exp(-abs(rayDir.y) * 8.0);
        let fogStrength = clamp(aerialStrength * (1.0 + horizonBias), 0.0, 12.0);
        var fogAngle = rayDir.y;
        if (regionExtent > 0.0) {
          let radial = normalize(terrainPoint + vec3<f32>(0.0, regionRadius, 0.0));
          fogAngle = mix(rayDir.y, min(0.0, dot(rayDir, radial)), smoothstep(144.0, 768.0, terrainDistance));
        }
        distanceFog = sceneTerrainFog(terrainDistance * R.ocean.z, fogAngle, fogStrength);
        let sunHaze = fogSun * pow(towardSunSky, 7.0) * .085 * (1.0 - night) * foregroundGlow;
        haze = mix(haze, fluidSolar * .28, sunHaze);
      } else {
        distanceFog = previewAerialFogAmount(terrainDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, .5);
      }
      fluidBackdrop = mix(fluidBackdrop, mix(terrainColor, haze * .83, distanceFog), terrainVisibility);
    }
  }
  if(hullRay){sky=aircraft.color*mix(1.0,.22,R.nightAmount);fluidBackdrop=aircraft.color;}

  // Keep the close chase aircraft in front of the atmospheric shaft composite.
  let shaftReceiver = select(sceneDepth, 0.0, hullRay);
  let shaftNearFade = select(0.0, 12.0 * length(aircraftPosition - R.camPos), R._p4 > .5);
  let shaftSun = 1.0 - night;
  let horizonAir = sceneSkyGradient(max(.015, rayDir.y * .35), nearSun * foregroundGlow, sunDir.y);
  let ambientAir = mix(horizonAir, sceneHazeAmbient(sunDir.y), .60) * fluidSkyTint;
  let airSkyRay = flatNightRay(rayDir, R.sceneLighting.yz, R.sceneLighting.w);
  let nightAir = sceneNightGradient(airSkyRay, max(.06, rayDir.y), fluidSkyTint, false) * .46;
  let airTint = mix(ambientAir + litHaze * foregroundGlow * .28, nightAir, night);

  if (shellScene) {
    var shellTexel = depthEdge;
    if (hullRay) {
      shellTexel = sampleAircraftForeground(in.uv, layer, sunDir, aircraft.color, true);
    } else if (depthEdge.a < 0.0) {
      shellTexel = reconstructCloudOverlay(tex, samp, in.uv, 1.0, 0.0);
    }
    let raw = clamp(shellTexel.a, 0.0, 1.0);
    let coverage = clamp(cloudOverlayOpacity(raw, R.planetOpacity.x, R.planetOpacity.y, R.planetOpacity.z), 0.0, 1.0);
    let exposure = R.exposure * R.colorLift;
    let backdrop = sceneDisplayWithRolloff(fluidBackdrop + nightStars * (1.0 - coverage),
      exposure, R.saturationBoost, R.region.y);
    var cloud = vec3<f32>(0.0);
    if (coverage > 0.0) {
      cloud = planetCloudResolvedDisplay(vec4<f32>(shellTexel.rgb, raw), R.planetGrade, exposure,
        R.saturationBoost, R.ocean.w, sunDir.y, R.region.y);
      let airDistance = previewShellAirDistance(rayDir, min(terrainDistance, aircraft.distance), coverage, fogHorizon);
      let airFog = previewShellAirFog(rayDir, airDistance, aerialStrength, fogHorizon);
      let airDisplay = sceneDisplayWithRolloff(airTint, exposure, R.saturationBoost, R.region.y);
      cloud = mix(cloud, airDisplay, airFog);
    }
    let scene = mix(backdrop, cloud, coverage);
    let localShaft = localCloudShafts(R.camPos, rayDir, sunDir, shaftReceiver, R.terrainBody.x,
      R.godRayControls, aerialStrength, shaftSun, 1.0 - coverage, shaftNearFade);
    return vec4<f32>(applyLocalCloudShafts(scene, localShaft, fluidSolar, coverage, R.godRayControls.y, R.shadowDarkness), 1.0);
  }

  let localShaft = localCloudShafts(R.camPos, rayDir, sunDir, shaftReceiver, R.terrainBody.x,
    R.godRayControls, aerialStrength, shaftSun, 1.0 - cloudA, shaftNearFade);
  let resolvedCloud = vec4<f32>(cloudRGB, cloudA);
  var fluidColor = vec3<f32>(0.0);
  // Preserve the authored cloud finish while using the same clear sky.
  let stylized = R.cloudShading > 1.5 || illustratedLook(style) || painterlyLook(style) ||
    style == 48u || style == 49u;
  let stylizedWeight = 1.0 - smoothstep(.015, .78, cloudA);
  let fluidWeight = atmosphereWeight * select(1.0, mix(stylizedWeight, 1.0, night), stylized);

  var sunGlow = 0.0;
  var sunDisk = 0.0;
  let fwdDot = dot(sunDir, R.fwd);

  if (celestialRay && fwdDot > 0.0 && all(uvSun >= vec2<f32>(-0.25, -0.25)) && all(uvSun <= vec2<f32>(1.25, 1.25))) {
    let d = distance(in.uv, uvSun);
    if (d <= SUN_GLOW_RADIUS) {
      var centerOcc = 0.0;
      if (d <= SUN_UV_RADIUS * 3.0) {
        centerOcc = alphaGatherFast(uvSun, layer);
      } else {
        centerOcc = textureSampleLevel(tex, samp, uvSun, layer, 2.0).a;
      }

      let localThrough = pow(max(1.0 - cloudA, 0.0), 0.9);
      let centerThrough = pow(max(1.0 - clamp(centerOcc, 0.0, 1.0), 0.0), 1.35);
      let diskGate = smoothstep(SUN_UV_RADIUS * 3.0, SUN_UV_RADIUS * 0.8, d);
      let sunThrough = mix(localThrough, centerThrough, diskGate);

      var core = smoothstep(SUN_UV_RADIUS, SUN_UV_RADIUS * 0.25, d);
      if(R.skyCycle>0.5 && R.nightAmount>.5) {
        // Crescent moon uses the same celestial disk, not a second light march.
        let cut=1.0-smoothstep(SUN_UV_RADIUS*.65,SUN_UV_RADIUS*.95,distance(in.uv,uvSun+vec2<f32>(SUN_UV_RADIUS*.55,0)));
        core*=1.0-cut;
      }
      let innerGlow = exp(-pow(d / (SUN_UV_RADIUS * 1.55), 2.0));
      let outerGlow = exp(-pow(d / SUN_GLOW_RADIUS, 2.3));

      sunDisk = core * sunThrough;
      sunGlow = (innerGlow * (0.18 + 0.18 * R.sunBloom) + outerGlow * (0.03 + 0.15 * R.sunBloom)) * sunThrough;
    }
  }

  sunDisk*=R.celestialVisibility * twilight.direct * cloudSunVisibility;
  sunGlow*=R.celestialVisibility * twilight.direct * cloudSunVisibility;
  let godRayGate = clamp(R.godRayControls.x, 0.0, 1.0) * sceneShaftStrength(R.godRayControls.y) * smoothstep(-0.04, 0.20, fwdDot) * smoothstep(0.06, 0.72, towardSunSky) * twilight.direct * cloudSunVisibility;
  var godRayFog = vec2<f32>(0.0, 0.0);
  if (!cloudShaftsAvailable() && godRayGate > 0.0001 && !hullRay) {
    godRayFog = godRayShaft(in.uv, uvSun, layer, fwdDot, towardSunSky, cloudA, lowSun) * twilight.direct * cloudSunVisibility;
    if(terrainRay){
      let foregroundHaze=previewAerialFogAmount(terrainDistance,rayDir,fogDensity,fogHorizon,fogSun,lowSun,towardSunSky,0.5);
      godRayFog*=mix(1.0,foregroundHaze,terrainVisibility)*foregroundGlow;
    }
  }
  let hazeLift = mix(1.30, 1.85, smoothstep(.06, .55, fogDensity));
  let godRays = godRayFog.x * hazeLift;
  let godRayShadow = godRayFog.y;
  let godRayColor = mix(sunWash, sunColor, 0.72);
  if (atmosphereWeight > 0.0) {
    let backdrop = fluidBackdrop * (1.0 - godRayShadow * .34);
    let transmission = 1.0 - resolvedCloud.a;
    let stars = nightStars * transmission * transmission;
    let shafts = fluidSolar * godRays * (.40 + .86 * lowSun) * (1.0 - night)
      * mix(.16, 1.0, transmission);
    let cloudShade = sceneCloudShadowGain(resolvedCloud.rgb / max(resolvedCloud.a, .001), R.shadowDarkness);
    var cloudRadiance = resolvedCloud.rgb * cloudShade;
    if (resolvedCloud.a > .001) {
      let airDistance = min(previewCloudAerialDistance(rayDir, resolvedCloud.a, fogHorizon), min(sceneDepth, aircraft.distance));
      let airFog = previewAerialFogAmount(airDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, .5);
      cloudRadiance = mix(cloudRadiance, airTint * resolvedCloud.a, airFog);
    }
    fluidColor = sceneDisplayWithRolloff(cloudRadiance + backdrop * transmission + stars + shafts,
      R.exposure * R.colorLift, R.saturationBoost, R.region.y);
    if (fluidWeight >= 1.0) { return vec4<f32>(applyLocalCloudShafts(fluidColor, localShaft, fluidSolar, cloudA, R.godRayControls.y, R.shadowDarkness), 1.0); }
  }
  // Cached-volume clouds already carry resolved ray jitter. Their inexpensive
  // smooth aerial veil needs a deterministic midpoint, not another correlated
  // sin-hash dither visibly stamped across bright puffs at coarse resolution.
  let fogJitter = select(previewFogJitter(in.uv), 0.5, R.fieldLighting > 0.5);

  // Optical thickness, rather than front-facing light, gates the backlit rim.
  // Opaque bodies and empty sky stay dark; thin silhouettes near the sun glow.
  // This uses the resolved alpha and adds no neighboring texture probes.
  let silverShoulder=smoothstep(0.045,0.16,cloudA)*(1.0-smoothstep(0.24,0.64,cloudA));
  let backlitSilver=max(renderSilverControl(),0.0)*silverShoulder*cloudSunVisibility
    *pow(max(dot(rayDir,sunDir),0.0),max(12.0,R.silverControls.y*5.0))*1.25;

  let softVolumeFinish = PREVIEW_SOFT_VOLUME != 0u || R.cloudShading == 1.0 ||
    (R.cloudShading < 0.5 && R.fieldLighting > 0.5);
  if (softVolumeFinish) {
    // Premultiplied radiance already contains directional light, folded normals,
    // sun shadows and AO. Do not infer a second painted surface from 2D alpha:
    // that flattened the puffs and outlined their soft edges in every grade.
    let skyDistance = previewBackgroundDistance(rayDir,fogHorizon,min(terrainDistance,aircraft.distance),terrainVisibility,hullRay);
    let skyFog = previewAerialFogAmount(skyDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, fogJitter);
    let fogColor = previewAerialFogColor(horizonSky, zenithSky, sunWash, shadowCool, rayDir, towardSunSky, fogHorizon, fogSun * foregroundGlow, lowSun);
    let clearSky = mix(sky, fogColor, skyFog) * (1.0-godRayShadow*(0.16+0.34*lowSun));
    var cloudRadiance = vec3<f32>(0.0);
    // Empty cloud samples still receive the full sky, terrain and shaft lighting.
    if (cloudA > 0.0 || any(cloudRGB != vec3<f32>(0.0))) {
      let cloudDistance = previewCloudAerialDistance(rayDir, cloudA, fogHorizon);
      let cloudFog = min(0.82, previewAerialFogAmount(cloudDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, fogJitter));
      let contrast = mix(1.0, 1.35, clamp(R.shadowStrength / 5.0, 0.0, 1.0));
      // Daylight contrast must not crush low moonlit radiance into black. Keep
      // the existing preview pivot outside the opt-in cycle, and adapt smoothly.
      let contrastPivot = mix(0.22, 0.015, night);
      let contrastedCloud = max((cloudRGB - cloudA * contrastPivot) * contrast + cloudA * contrastPivot, vec3<f32>(0.0));
      let volumeLum = luma(cloudRGB) / max(cloudA, 0.0001);
      let volumeTint = mix(userShadowTint, userLightTint, smoothstep(0.18, 0.70, volumeLum));
      let liftedCloud = contrastedCloud * mix(vec3<f32>(1.0), volumeTint, 0.35)
        * mix(1.0, clamp(R.colorLift, 0.5, 2.0), 0.25) * 1.15 * max(0.0, 1.0 - R.shadowDarkness * 0.12);
      var litCloud = max(mix(vec3<f32>(luma(liftedCloud)), liftedCloud, clamp(R.saturationBoost, 0.0, 2.20)), vec3<f32>(0.0));
      if (illustratedLook(style)) {
        // Palette bands follow the existing 3D radiance, so billows, shadow
        // pockets and motion survive stylization. No density or extra probes.
        let softLight = smoothstep(0.06, 0.85, volumeLum);
        let hardLight = smoothstep(0.30, 0.56, volumeLum);
        let band = mix(softLight, hardLight, clamp(R.styleControls.z / 2.20, 0.0, 1.0));
        let palette = mix(userShadowTint * 0.18, userLightTint, band);
        let lightScale = mix(0.20, 1.05, band) * mix(1.0, 0.22, R.nightAmount);
        let painted = palette * lightScale * cloudA;
        litCloud = mix(litCloud, painted, 0.78);
        // Only illuminated translucent shoulders receive the authored rim.
        // The premultiplied alpha gate keeps empty sky free of colored outlines.
        let shoulder = smoothstep(0.035, 0.18, cloudA) * (1.0 - smoothstep(0.35, 0.92, cloudA));
        let rimLight = smoothstep(0.08, 0.60, volumeLum) * mix(0.25, 1.0, pow(towardSunSky, 4.0));
        litCloud += userEdgeTint * shoulder * rimLight * clamp(R.styleControls.x, 0.0, 2.20)
          * 0.55 * mix(1.0, 0.18, R.nightAmount) * cloudA;
      }
      if (painterlyLook(style)) {
        // Compress HDR ray lighting before the indigo washes, as in the sculpted
        // path. Clipping it at 0.85 erased the soft finish's painted folds.
        let wash = select(smoothstep(0.025, 0.85, volumeLum), inkLightValue(vec4<f32>(cloudRGB, cloudA)), style == 40u || style == 41u || sumiLook(style));
        var pigment = gouachePalette(wash + neighborhood.lightDetail, userShadowTint, userLightTint);
        pigment = finishPigmentColor(pigment, wash, cloudRGB / max(cloudA, 0.001), userShadowTint, userLightTint, userEdgeTint, R.saturationBoost);
        let painted = pigment * cloudA * mix(1.0, 0.18, R.nightAmount);
        litCloud = mix(litCloud, painted, select(0.90, 0.985, inkLook(style)));
        let shoulder = select(smoothstep(0.035, 0.18, cloudA) * (1.0 - smoothstep(0.32, 0.82, cloudA)),
          smoothstep(0.025, 0.10, cloudA) * (1.0 - smoothstep(0.12, 0.32, cloudA)), inkLook(style));
        let rimLight = smoothstep(0.08, 0.55, volumeLum) * mix(0.12, 1.0, pow(towardSunSky, 5.0));
        if (flowingInkLook(style)) {
          let crest = flowingInkCrest(cloudA, neighborhood.grad, in.uv, uvSun, neighborhood.occ);
          litCloud += userEdgeTint * crest * rimLight * clamp(R.styleControls.x, 0.0, 2.20)
            * cloudA * 1.85 * mix(1.0, 0.18, R.nightAmount);
        } else {
          litCloud += userEdgeTint * shoulder * rimLight * clamp(R.styleControls.x, 0.0, 2.20)
            * cloudA * 0.70 * mix(1.0, 0.18, R.nightAmount);
        }
        if (inkLook(style) && !sumiLook(style)) {
          litCloud += userEdgeTint * inkFoldHighlight(wash, neighborhood.lightGrad) * cloudA
            * rimLight * select(0.07, 0.04, flowingInkLook(style)) * mix(1.0, 0.18, R.nightAmount);
        }
      }
      // Marine rays already integrate their thin illuminated shoulders.
      let silverFinish = select(1.0, 0.44, R.terrain.y > 0.5);
      litCloud += sunColor * backlitSilver * cloudA * silverFinish * twilight.direct;
      cloudRadiance = mix(litCloud, fogColor * cloudA, cloudFog);
    }
    cloudRadiance *= sceneDeepShadowGain(cloudRGB / max(cloudA, .001), R.shadowDarkness);
    var linear = cloudRadiance + clearSky * (1.0 - cloudA);
    linear += sunColor * (1.18 * sunDisk + 0.22 * sunGlow);
    if ((R.terrain.y > 0.5 || marineGrade || localBank) && !hullRay && !terrainRay && fwdDot > 0.0) {
      // Broad forward scatter through gaps and thin shoulders, using the
      // resolved coverage already available at this pixel. Dense cores keep
      // their gradients, and the existing shaft mask still shapes the rays.
      let atmosphericHalo = 0.60 * pow(towardSunSky, 36.0) + 0.20 * pow(towardSunSky, 9.0);
      let solarVeil = pow(towardSunSky, 155.0) * (0.36 + 0.44 * R.sunBloom);
      let clear = max(1.0 - cloudA, 0.0);
      let marine = R.terrain.y > 0.5;
      let transmissionPower = select(select(0.72, 1.31, marine), mix(1.31, 1.92, twilight.amount), localBank);
      let transmittance = pow(clear, transmissionPower);
      let cutoff = select(vec2<f32>(0.48, 0.98), vec2<f32>(0.40, 0.72), marine);
      let transmittentEdge = smoothstep(0.02, 0.24, cloudA) * (1.0 - smoothstep(cutoff.x, cutoff.y, cloudA));
      let edgeSpill = transmittentEdge * select(select(0.31, 0.14, marine), 0.11, localBank);
      // Surrounding cloud makes a bright break read as a gap in the bank.
      // The clear ray carries the light and opaque folds retain their shade.
      let opening = smoothstep(0.08, 0.54, neighborhood.occ) * clear * clear;
      let gapLight = twilight.amount * opening * pow(towardSunSky, 18.0) * 0.96;
      let spill = (atmosphericHalo + solarVeil) * (transmittance + edgeSpill) + gapLight;
      let airLight = clamp(R.styleControls.y, 0.0, 2.20) * R.celestialVisibility * twilight.direct;
      linear += mix(sunWash, sunColor, 0.58) * spill * airLight;
    }
    linear += godRayColor * godRays * (0.40 + 0.86 * lowSun) * (1.0 - cloudA);
    let mapped = toneMapFilmic(sceneHighlightRolloff(linear * max(R.exposure * 0.80, 0.0), R.region.y));
    let display = mix(applyStyleGrade(mapped, style, cloudA), fluidColor, fluidWeight);
    return vec4<f32>(applyLocalCloudShafts(display, localShaft, fluidSolar, cloudA, R.godRayControls.y, R.shadowDarkness), 1.0);
  }

  if (cloudA < 0.003) {
    var clearLinear = sky * (1.0 - godRayShadow * (0.16 + 0.34 * lowSun));

    let skyFogDistance = previewBackgroundDistance(rayDir,fogHorizon,min(terrainDistance,aircraft.distance),terrainVisibility,hullRay);
    let skyFogAmount = previewAerialFogAmount(skyFogDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, fogJitter);
    let skyFogColor = previewAerialFogColor(horizonSky, zenithSky, sunWash, shadowCool, rayDir, towardSunSky, fogHorizon, fogSun * foregroundGlow, lowSun);
    clearLinear = mix(clearLinear, skyFogColor, skyFogAmount)
      + godRayColor * godRays * (.40 + .86 * lowSun)
      + sunColor * (1.18 * sunDisk + .22 * sunGlow) * previewSolarTransmission(skyFogAmount);
    clearLinear += sunWash * sunConeHaze * (0.34 + 0.18 * R.sunBloom) * (1.0 - skyFogAmount * 0.42);

    let clearMapped = toneMapFilmic(sceneHighlightRolloff(clearLinear * max(R.exposure * 0.80, 0.0), R.region.y));
    let clearStyled = applyStyleGrade(clearMapped, style, 0.0);
    let display = mix(pow(clearStyled, vec3<f32>(0.99, 0.995, 1.0)), fluidColor, fluidWeight);
    return vec4<f32>(applyLocalCloudShafts(display, localShaft, fluidSolar, cloudA, R.godRayControls.y, R.shadowDarkness), 1.0);
  }
  let cloudColorA = alphaColorResponse(cloudA);
  let cloudColorLift = max(cloudColorA - cloudA, 0.0);
  var sunEdgeSilver = 0.0;
  var bodyShadow = 0.0;
  var cavity = 0.0;
  var ridge = 0.0;
  var surfaceLit = 0.0;
  var gradLenCached = 0.0;
  var occCached = cloudA;
  var upperExposureCached = 0.55;

  if (R.compositeQuality >= 1u) {
    let grad = neighborhood.grad;
    let gradLen = length(grad);
    gradLenCached = gradLen;
    let towardSun = clamp(dot(rayDir, sunDir), 0.0, 1.0);
    var facing = 0.0;
    var upperExposure = 0.55;
    if (gradLen > 1e-5) {
      let gradDir = grad / gradLen;
      let outward = -gradDir;
      let toSunScreen = normalize(uvSun - in.uv + vec2<f32>(1e-5, 0.0));
      facing = clamp(dot(outward, toSunScreen), 0.0, 1.0);
      upperExposure = smoothstep(-0.22, 0.52, dot(outward, vec2<f32>(0.0, -1.0)));
    }
    upperExposureCached = upperExposure;

    let edge = smoothstep(0.012, 0.065, gradLen);
    let edgeBand = silverEdgeBand(cloudA);
    let occ = neighborhood.occ;
    occCached = occ;
    let powder = 0.34 + 0.66 * pow(clamp(occ * (1.0 - occ) * 4.0, 0.0, 1.0), 0.72);
    let nearSun = stableSunProximity(in.uv, uvSun, towardSun, fwdDot);
    let forwardCone = smoothstep(0.55, 0.985, towardSun);
    sunEdgeSilver = edge * edgeBand * mix(0.42, 1.0, facing) * powder * nearSun * forwardCone * mix(0.82, 1.0, upperExposure);

    let coreMask = cloudCoreMask(cloudA, occ, edge);
    let awayFromSun = 1.0 - towardSun;
    let surfaceFacing = clamp(mix(upperExposure, facing, 0.62), 0.0, 1.0);
    let fluffySurface = pow(clamp(1.0 - occ * 0.86, 0.0, 1.0), 0.72) * mix(0.64, 1.0, upperExposure);
    surfaceLit = coreMask * smoothstep(0.18, 0.96, surfaceFacing) * fluffySurface * smoothstep(0.08, 0.92, towardSun);
    bodyShadow = coreMask * mix(0.055, 0.18, awayFromSun) * mix(1.0, 0.72, facing) * mix(1.0, 0.78, surfaceLit);
    ridge = edge * edgeBand * (0.42 + 0.22 * surfaceLit);
    cavity = smoothstep(0.55, 0.96, occ) * smoothstep(0.35, 0.98, cloudA) * 0.22;
  } else {
    if (fwdDot > -0.10) {
      let sunHint = stableSunHintUV(uvSun);
      let dSun = distance(in.uv, sunHint);
      let grad = alphaGradAt(in.uv, layer);
      let gradLen = length(grad);
      gradLenCached = gradLen;
      let towardSun = clamp(dot(rayDir, sunDir), 0.0, 1.0);

      var facing = 0.0;
      var openSoft = 1.0;
      var upperExposure = 0.55;
      if (gradLen > 1e-5 && dSun > 1e-5) {
        let toSun = (uvSun - in.uv) / dSun;
        let gradDir = grad / gradLen;
        let outward = -gradDir;
        facing = clamp(dot(outward, toSun), 0.0, 1.0);
        openSoft = alphaOpenTowardSoft(in.uv, toSun, layer);
        upperExposure = smoothstep(-0.22, 0.52, dot(outward, vec2<f32>(0.0, -1.0)));
      }
      upperExposureCached = upperExposure;

      let edge = smoothstep(0.016, 0.072, gradLen);
      let edgeBand = silverEdgeBand(cloudA);
      let occ = clamp(alphaGatherFast(in.uv, layer), 0.0, 1.0);
      occCached = occ;
      let powder = 0.34 + 0.66 * pow(clamp(occ * (1.0 - occ) * 4.0, 0.0, 1.0), 0.72);
      let nearSun = stableSunProximity(in.uv, uvSun, towardSun, fwdDot);
      let forwardCone = smoothstep(0.55, 0.985, towardSun);
      let exposedGate = openSoft * mix(0.74, 1.0, upperExposure);

      sunEdgeSilver = edge * edgeBand * facing * powder * nearSun * forwardCone * exposedGate;

      let coreMask = cloudCoreMask(cloudA, occ, edge);
      let sunFacing = smoothstep(0.38, 0.96, towardSun);
      let silhouette = coreMask * sunFacing * nearSun * mix(0.10, 0.32, 1.0 - facing) * smoothstep(0.12, 0.92, 1.0 - openSoft);
      let surfaceFacing = clamp(mix(upperExposure, facing, 0.58), 0.0, 1.0);
      let fluffySurface = pow(clamp(1.0 - occ * 0.82, 0.0, 1.0), 0.76) * mix(0.70, 1.0, openSoft) * mix(0.66, 1.0, upperExposure);
      surfaceLit = coreMask * smoothstep(0.18, 0.94, surfaceFacing) * fluffySurface * sunFacing;
      let awayFromSun = 1.0 - towardSun;
      bodyShadow = (coreMask * mix(0.06, 0.20, awayFromSun) + silhouette) * mix(1.0, 0.80, surfaceLit);
    }

    let relief = alphaReliefStatsFast(cloudA, occCached, gradLenCached);
    cavity = smoothstep(0.015, 0.110, relief.x) * smoothstep(0.22, 0.92, cloudA);
    ridge = smoothstep(0.010, 0.080, relief.y) * smoothstep(0.16, 0.86, cloudA);
  }

  let bodyMask = smoothstep(0.22, 0.92, cloudA);
  let bodyCore = smoothstep(0.48, 0.96, cloudA) * (1.0 - smoothstep(0.010, 0.050, gradLenCached));
  let cavityShadow = cavity * bodyMask * mix(0.08, 0.22, bodyShadow) * mix(1.0, 0.82, bodyCore);
  let ridgeLift = ridge * (1.0 - cavity) * (0.030 + 0.060 * (1.0 - bodyShadow));
  let finalShadow = clamp(bodyShadow + cavityShadow, 0.0, mix(0.72, 0.62, bodyCore));
  let fluffyLight = clamp(surfaceLit * (0.62 + 0.38 * bodyMask) + ridgeLift * 0.52, 0.0, 1.0);
  let softWrap = clamp((1.0 - finalShadow) * (0.28 + 0.72 * fluffyLight) * (0.20 + 0.80 * bodyMask), 0.0, 1.0);

  // Rain Shelf already has strong layered relief. Reference palettes and the
  // opt-in sculpted volume finish must not double its hard shadows/silver edge.
  let adaptedSurface = style >= 16u || R.cloudShading == 2.0;
  let surfaceContrastScale = select(1.0, 0.85, adaptedSurface && !illustratedLook(style));
  let surfaceRimScale = select(1.0, 0.36, adaptedSurface && !illustratedLook(style));
  let userShadowStrength = clamp(R.shadowStrength * surfaceContrastScale, 0.0, 5.00);
  let userColorLift = clamp(R.colorLift, 0.0, 2.20);
  let userSaturation = clamp(R.saturationBoost, 0.0, 2.20);
  let userRimStrength = clamp(R.styleControls.x * surfaceRimScale, 0.0, 2.20);
  let userSunBleed = clamp(R.styleControls.y * surfaceRimScale, 0.0, 2.20);
  let userShadowEdge = clamp(R.styleControls.z * surfaceContrastScale, 0.0, 2.20);
  let userMidLift = clamp(R.styleControls.w, 0.0, 2.20);
  let userShadowDarkness = clamp(R.shadowDarkness * surfaceContrastScale, 0.0, 6.00);
  let rimDrive = pow(clamp(userRimStrength / 1.60, 0.0, 1.0), 0.65);
  let bleedDrive = pow(clamp(userSunBleed / 1.60, 0.0, 1.0), 0.30);
  let rimGain = userRimStrength * mix(1.15, 2.40, rimDrive);
  let bleedGain = userSunBleed * mix(1.35, 5.10, bleedDrive);
  let userSilverIntensity = renderSilverControl() * select(1.0, 0.38, adaptedSurface && !illustratedLook(style));
  let userSilverAbs = abs(userSilverIntensity);
  let userSilverSign = sign(userSilverIntensity);
  let userSilverSharp01 = renderSilverSharp01();

  var styleLightBoost = 1.10;
  var styleShadowDarkness = 0.14;
  var styleRimBoost = 1.16;
  var styleShadowColorAmt = 0.68;
  var styleBaseMix = 0.82;
  var styleMidLift = 0.18;
  var styleSunInfluence = 0.10;
  if (style == 1u) {
    styleLightBoost = 1.22;
    styleShadowDarkness = 0.26;
    styleRimBoost = 1.18;
    styleShadowColorAmt = 0.96;
    styleBaseMix = 0.94;
    styleMidLift = 0.13;
    styleSunInfluence = 0.08;
  } else if (style == 2u) {
    styleLightBoost = 1.05;
    styleShadowDarkness = 0.28;
    styleRimBoost = 1.03;
    styleShadowColorAmt = 0.92;
    styleBaseMix = 0.91;
    styleMidLift = 0.16;
    styleSunInfluence = 0.12;
  } else if (style == 3u) {
    styleLightBoost = 0.98;
    styleShadowDarkness = 0.18;
    styleRimBoost = 0.96;
    styleShadowColorAmt = 0.80;
    styleBaseMix = 0.84;
    styleMidLift = 0.08;
    styleSunInfluence = 0.08;
  } else if (style == 4u) {
    styleLightBoost = 1.14;
    styleShadowDarkness = 0.46;
    styleRimBoost = 1.14;
    styleShadowColorAmt = 0.96;
    styleBaseMix = 0.94;
    styleMidLift = 0.06;
    styleSunInfluence = 0.16;
  } else if (style == 5u) {
    styleLightBoost = 1.06;
    styleShadowDarkness = 0.30;
    styleRimBoost = 1.05;
    styleShadowColorAmt = 0.92;
    styleBaseMix = 0.91;
    styleMidLift = 0.15;
    styleSunInfluence = 0.12;
  } else if (style == 6u) {
    styleLightBoost = 1.16;
    styleShadowDarkness = 0.38;
    styleRimBoost = 1.12;
    styleShadowColorAmt = 0.94;
    styleBaseMix = 0.92;
    styleMidLift = 0.10;
    styleSunInfluence = 0.14;
  } else if (style == 7u) {
    styleLightBoost = 0.98;
    styleShadowDarkness = 0.34;
    styleRimBoost = 1.18;
    styleShadowColorAmt = 0.92;
    styleBaseMix = 0.90;
    styleMidLift = 0.12;
    styleSunInfluence = 0.10;
  } else if (style == 8u) {
    styleLightBoost = 1.08;
    styleShadowDarkness = 0.28;
    styleRimBoost = 1.20;
    styleShadowColorAmt = 0.90;
    styleBaseMix = 0.90;
    styleMidLift = 0.16;
    styleSunInfluence = 0.10;
  } else if (style == 9u) {
    styleLightBoost = 1.00;
    styleShadowDarkness = 0.42;
    styleRimBoost = 1.02;
    styleShadowColorAmt = 0.96;
    styleBaseMix = 0.93;
    styleMidLift = 0.06;
    styleSunInfluence = 0.12;
  } else if (style == 10u) {
    styleLightBoost = 1.10;
    styleShadowDarkness = 0.36;
    styleRimBoost = 1.10;
    styleShadowColorAmt = 0.94;
    styleBaseMix = 0.92;
    styleMidLift = 0.13;
    styleSunInfluence = 0.12;
  } else if (style == 11u) {
    styleLightBoost = 0.92;
    styleShadowDarkness = 0.48;
    styleRimBoost = 1.06;
    styleShadowColorAmt = 0.98;
    styleBaseMix = 0.94;
    styleMidLift = 0.05;
    styleSunInfluence = 0.10;
  } else if (style == 12u) {
    styleLightBoost = 1.14;
    styleShadowDarkness = 0.055;
    styleRimBoost = 1.20;
    styleShadowColorAmt = 0.54;
    styleBaseMix = 0.86;
    styleMidLift = 0.24;
    styleSunInfluence = 0.12;
  } else if (style == 13u) {
    styleLightBoost = 1.18;
    styleShadowDarkness = 0.045;
    styleRimBoost = 1.30;
    styleShadowColorAmt = 0.50;
    styleBaseMix = 0.86;
    styleMidLift = 0.26;
    styleSunInfluence = 0.12;
  } else if (style == 15u) {
    styleLightBoost = 1.24;
    styleShadowDarkness = 0.26;
    styleRimBoost = 1.62;
    styleShadowColorAmt = 1.00;
    styleBaseMix = 0.94;
    styleMidLift = 0.10;
    styleSunInfluence = 0.04;
  }

  if (style >= 16u) {
    styleShadowColorAmt = 1.0;
    styleBaseMix = 0.94;
    styleSunInfluence = 0.04;
    styleShadowDarkness = select(0.04, 0.22, illustratedLook(style));
    styleRimBoost = select(1.0, 1.15, illustratedLook(style));
  }

  let daylightCreamStyle = style == 12u || style == 13u;
  var shadowTintTarget = max(mix(shadowTintBase, userShadowTint, styleShadowColorAmt), vec3<f32>(0.015, 0.015, 0.015));
  var litTintTarget = max(mix(litTintBase, userLightTint, 0.86), vec3<f32>(0.02, 0.02, 0.02));
  if (daylightCreamStyle) {
    shadowTintTarget = mix(shadowTintTarget, vec3<f32>(1.02, 0.94, 0.84), 0.42);
    litTintTarget = mix(litTintTarget, vec3<f32>(1.22, 1.12, 0.98), 0.26);
  }
  let litCloudTint = litTintTarget * mix(vec3<f32>(1.0, 1.0, 1.0), sunColor, styleSunInfluence);
  let ambientSkyMix = select(0.18, 0.018, daylightCreamStyle);
  var coolAmbientTint = mix(shadowTintTarget, shadowTintTarget * max(R.sky + vec3<f32>(0.08, 0.10, 0.14), vec3<f32>(0.18, 0.18, 0.22)), ambientSkyMix);
  if (daylightCreamStyle) {
    coolAmbientTint = mix(coolAmbientTint, vec3<f32>(0.98, 0.90, 0.80), 0.46);
  }
  let sunsetMidMix = select(mix(0.58, 0.76, bodyCore), mix(0.70, 0.84, bodyCore), style == 1u);
  let daylightMidMix = mix(0.34, 0.50, bodyCore);
  let midCloudMix = select(sunsetMidMix, daylightMidMix, daylightCreamStyle);
  let midCloudTint = mix(litCloudTint, coolAmbientTint, midCloudMix);
  let rimTint = max(mix(edgeWarm, userEdgeTint, 0.82), vec3<f32>(0.02, 0.02, 0.02)) * mix(vec3<f32>(1.0, 1.0, 1.0), sunColor, 0.10);

  let rawLum = max(luma(cloudRGB), 1e-4);
  let unpremulCloud = cloudRGB / max(cloudA, 0.08);
  let unpremulLum = max(luma(unpremulCloud), 1e-4);
  let coherentAlpha = smoothstep(0.095, 0.32, max(cloudA, occCached));
  let thinHaloSuppress = smoothstep(0.080, 0.26, cloudA) * smoothstep(0.10, 0.34, occCached);
  let opticalDepth = clamp(cloudA * 0.78 + occCached * 0.52 + bodyCore * 0.36, 0.0, 1.0);
  let imageCavity = clamp(1.0 - smoothstep(0.16, 0.72, unpremulLum), 0.0, 1.0) * smoothstep(0.18, 0.84, cloudA);
  let baseBodyLum = clamp(mix(rawLum * 1.18, unpremulLum * cloudColorA, 0.62), 0.025, 1.45);
  let detailTint = mix(vec3<f32>(1.0, 1.0, 1.0), clamp(unpremulCloud / max(vec3<f32>(unpremulLum), vec3<f32>(0.001)), vec3<f32>(0.92), vec3<f32>(1.08)), 0.18);

  let directSurface = clamp(surfaceLit * (0.72 + 0.28 * bodyMask) + ridgeLift * 0.64 + softWrap * 0.18, 0.0, 1.0);
  let rimBandBase = clamp(sunEdgeSilver * (0.62 + 0.38 * (1.0 - bodyCore)) * mix(0.28, 1.0, thinHaloSuppress), 0.0, 1.0);
  let rimBand = clamp(pow(rimBandBase, mix(0.90, 0.55, rimDrive)) * rimGain, 0.0, 1.0);
  let shapedSilverEdge = silverEdgeBandShaped(cloudA, userSilverSharp01);
  let defaultSilverEdge = max(silverEdgeBand(cloudA), 0.06);
  let silverRamp = pow(clamp(rimBandBase * (shapedSilverEdge / defaultSilverEdge), 0.0, 1.0), mix(0.80, 0.45, userSilverSharp01));
  let silverBand = clamp(silverRamp * userSilverAbs * mix(0.90, 1.55, userSilverSharp01), 0.0, 1.0);
  let lightBand = clamp(directSurface * (1.0 - cavity * 0.42) + ridgeLift * 0.48 + rimBand * 0.22 + silverBand * 0.30, 0.0, 1.0);
  let lightBlock = clamp(1.0 - lightBand * 0.92 - rimBand * 0.48 - silverBand * 0.16, 0.0, 1.0);
  let lowerFaceShadow =
    smoothstep(0.10, 0.78, 1.0 - upperExposureCached) *
    smoothstep(0.18, 0.82, max(cloudA, occCached)) *
    (1.0 - directSurface * 0.62);
  let broadFormShadow = clamp(
    (
      (1.0 - directSurface) * 0.34 +
      lightBlock * 0.24 +
      opticalDepth * 0.24 +
      smoothstep(0.24, 0.86, occCached) * 0.22 +
      lowerFaceShadow * 0.34
    ) *
    bodyMask *
    clamp(1.0 - rimBand * 0.42 - silverBand * 0.24, 0.20, 1.0),
    0.0,
    1.0
  );
  let pocketOcclusion = clamp(
    (
      cavity * 0.34 +
      imageCavity * 0.18 +
      opticalDepth * (1.0 - directSurface) * 0.32 +
      broadFormShadow * 0.48 +
      lowerFaceShadow * 0.18
    ) *
    smoothstep(0.12, 0.82, max(cloudA, occCached)),
    0.0,
    1.0
  );
  let shadowRaw = (
    finalShadow * 0.70 +
    cavity * 0.20 +
    imageCavity * 0.18 +
    broadFormShadow * 0.42 +
    opticalDepth * lightBlock * 0.30 +
    pocketOcclusion * 0.16
  ) * (0.62 + 0.22 * bodyCore);
  let daylightShadowScale = select(1.0, 0.72, daylightCreamStyle);
  let shadowSoftBand = clamp(shadowRaw * userShadowStrength * daylightShadowScale, 0.0, 1.0);
  let shadowEdgeAmt = clamp(userShadowEdge / 2.20, 0.0, 1.0);
  let shadowHardLo = mix(0.04, 0.30, shadowEdgeAmt);
  let shadowHardHi = mix(0.96, 0.58, shadowEdgeAmt);
  let shadowHardBand = smoothstep(shadowHardLo, max(shadowHardLo + 0.05, shadowHardHi), shadowSoftBand);
  let shadowBand = mix(shadowSoftBand, shadowHardBand, shadowEdgeAmt);
  let midBand = clamp((1.0 - lightBand * 0.62) * (1.0 - shadowBand * 0.36) * (0.46 + 0.54 * opticalDepth), 0.0, 1.0);
  let highlightBand = clamp(lightBand * (1.0 - shadowBand * 0.42) + rimBand * 0.34 + silverBand * 0.30, 0.0, 1.0);
  let shadowedEdgeSuppression = clamp(
    mix(0.12, 1.0, highlightBand) *
    mix(0.16, 1.0, 1.0 - shadowBand) *
    mix(0.44, 1.0, 1.0 - cavity),
    0.0,
    1.0
  );
  let alphaEdgeColorBand =
    smoothstep(0.035, 0.18, cloudA) *
    (1.0 - smoothstep(0.30, 0.70, cloudA)) *
    (0.54 + 0.46 * clamp(gradLenCached * 11.0, 0.0, 1.0)) *
    mix(0.32, 1.0, thinHaloSuppress);
  let edgeChroma = clamp(length(userEdgeTint - vec3<f32>(luma(userEdgeTint))) * 0.95, 0.0, 1.0);

  let paletteBody = mix(midCloudTint, litCloudTint, highlightBand);
  let shadowBodyDarkness = clamp(styleShadowDarkness + userShadowDarkness * 0.16, 0.0, 1.35);
  let daylightShadowLift = select(0.0, 0.18, daylightCreamStyle);
  let shadowBody = coolAmbientTint * (0.72 + 0.24 * baseBodyLum + daylightShadowLift) * max(0.0, 1.0 - shadowBodyDarkness * 0.82 * clamp(shadowBand, 0.0, 1.0));
  let bodyShadowMix = select(0.70, 0.44, daylightCreamStyle);
  let bodyTint = mix(paletteBody, shadowBody, clamp(shadowBand * bodyShadowMix, 0.0, 0.88));
  let retainedShadowDim = select(0.88, 0.96, daylightCreamStyle);
  let retainedShape = vec3<f32>(baseBodyLum) * mix(0.80, 1.08, highlightBand) * mix(1.0, retainedShadowDim, shadowBand);

  var cloudShaded = mix(cloudRGB * vec3<f32>(0.10), bodyTint * retainedShape * detailTint, min(styleBaseMix + 0.03, 0.98));
  cloudShaded += litCloudTint * cloudColorA * highlightBand * (0.085 + 0.095 * styleLightBoost) * (1.0 - shadowBand * 0.52);
  cloudShaded += midCloudTint * cloudColorA * midBand * styleMidLift * userMidLift * 0.82 * select(1.0, 0.78, style == 1u);
  cloudShaded += rimTint * rimBand * shadowedEdgeSuppression * (0.48 + 0.42 * R.sunBloom) * styleRimBoost * mix(0.62, 1.0, coherentAlpha);
  let broadShadowTintDefault = mix(coolAmbientTint * 0.68, shadowTintTarget * 0.50, 0.46);
  let broadShadowTint = select(broadShadowTintDefault, mix(vec3<f32>(1.04, 0.96, 0.86), coolAmbientTint, 0.42), daylightCreamStyle);
  let broadShadowAmount = select(0.10 + 0.14 * userShadowStrength, 0.035 + 0.050 * userShadowStrength, daylightCreamStyle);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(broadShadowTint, vec3<f32>(0.18, 0.18, 0.18)),
    clamp(broadFormShadow * broadShadowAmount * (1.0 - highlightBand * 0.46), 0.0, select(0.32, 0.18, daylightCreamStyle))
  );

  let silverTint = mix(vec3<f32>(1.10, 1.05, 0.94), max(rimTint, vec3<f32>(0.02, 0.02, 0.02)), 0.12) * mix(vec3<f32>(1.0, 1.0, 1.0), sunColor, 0.06);
  let silverBrightMode = clamp(userSilverSign, 0.0, 1.0);
  let silverDarkMode = clamp(-userSilverSign, 0.0, 1.0);
  let silverExposure = clamp((0.16 + 0.84 * highlightBand) * (0.14 + 0.86 * directSurface), 0.0, 1.0);
  let silverGate = silverBand * shadowedEdgeSuppression * (1.0 - shadowBand * 0.58) * silverExposure * mix(0.62, 1.0, 1.0 - bodyCore);
  let darkSilverGate = silverBand * (0.32 + 0.68 * shadowBand) * (0.28 + 0.72 * (1.0 - directSurface)) * (0.40 + 0.60 * (1.0 - bodyCore));
  if (silverBrightMode > 0.0) {
    let brightGate = silverGate * silverBrightMode;
    cloudShaded += silverTint * cloudColorA * brightGate * (0.76 + 0.56 * R.sunBloom);
    cloudShaded = mix(cloudShaded, max(cloudShaded, silverTint * max(baseBodyLum, 0.08) * (1.10 + userSilverAbs * 0.82)), clamp(brightGate * 0.52, 0.0, 0.82));
    cloudShaded+=silverTint*backlitSilver*cloudColorA;
  }
  if (silverDarkMode > 0.0) {
    let darkSilverTint = mix(shadowTintTarget * 0.26, coolAmbientTint * 0.44, 0.58);
    let darkGate = clamp(darkSilverGate * silverDarkMode, 0.0, 1.0);
    cloudShaded = mix(
      cloudShaded,
      cloudShaded * max(darkSilverTint, vec3<f32>(0.10, 0.11, 0.12)),
      clamp(darkGate * (0.18 + 0.12 * userSilverAbs), 0.0, 0.76)
    );
  }

  let shadowRimBand = clamp(
    pow(rimBandBase, mix(0.92, 0.46, shadowEdgeAmt)) *
    shadowBand *
    (1.0 - highlightBand) *
    (0.28 + 0.72 * (1.0 - directSurface)) *
    (0.42 + 0.58 * (1.0 - bodyCore)),
    0.0,
    1.0
  );
  let shadowRimTintDefault = mix(coolAmbientTint * 0.42, shadowTintTarget * 0.30, 0.55);
  let shadowRimTint = select(shadowRimTintDefault, mix(coolAmbientTint * 0.86, shadowTintTarget * 0.74, 0.45), daylightCreamStyle);
  let shadowRimStrength = clamp(userShadowStrength * (0.22 + 0.78 * shadowEdgeAmt) + userShadowDarkness * 0.08, 0.0, 1.8);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(shadowRimTint, vec3<f32>(0.12, 0.13, 0.14)),
    clamp(shadowRimBand * shadowRimStrength * select(0.46, 0.24, daylightCreamStyle), 0.0, select(0.68, 0.34, daylightCreamStyle))
  );

  let undersideBand = clamp((1.0 - surfaceLit) * (0.30 + 0.70 * bodyCore) * (0.24 + 0.76 * shadowBand), 0.0, 1.0);
  let undersideTintDefault = mix(shadowTintTarget * 0.44, coolAmbientTint * 0.62, 0.46);
  let undersideTint = select(undersideTintDefault, mix(shadowTintTarget * 0.82, coolAmbientTint * 0.90, 0.52), daylightCreamStyle);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(undersideTint, vec3<f32>(0.16, 0.17, 0.18)),
    clamp(undersideBand * select(0.18 + 0.22 * userShadowStrength, 0.08 + 0.10 * userShadowStrength, daylightCreamStyle), 0.0, select(0.36, 0.22, daylightCreamStyle))
  );

  let brokenPocketBand =
    smoothstep(0.020, 0.115, gradLenCached) *
    smoothstep(0.035, 0.24, cloudA) *
    (1.0 - smoothstep(0.62, 0.95, cloudA)) *
    (0.42 + 0.58 * cavity) *
    (0.32 + 0.68 * (1.0 - directSurface));
  let pocketShadowGate = clamp(
    brokenPocketBand *
    (0.35 + 0.65 * shadowBand) *
    (1.0 - highlightBand * 0.52) *
    (0.58 + 0.42 * max(silverDarkMode, shadowEdgeAmt)),
    0.0,
    1.0
  );
  let pocketTint = mix(coolAmbientTint * 0.34, shadowTintTarget * 0.24, 0.54);
  let daylightPocketTint = mix(coolAmbientTint * 0.76, shadowTintTarget * 0.68, 0.52);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(select(pocketTint, daylightPocketTint, daylightCreamStyle), vec3<f32>(0.10, 0.11, 0.12)),
    clamp(pocketShadowGate * select(0.20 + 0.25 * userShadowStrength + 0.18 * userSilverAbs * silverDarkMode, 0.08 + 0.12 * userShadowStrength + 0.08 * userSilverAbs * silverDarkMode, daylightCreamStyle), 0.0, select(0.64, 0.34, daylightCreamStyle))
  );

  let volumePocketGate = clamp(
    pocketOcclusion *
    (0.42 + 0.58 * shadowBand) *
    (1.0 - highlightBand * 0.48) *
    coherentAlpha,
    0.0,
    1.0
  );
  let volumePocketTintDefault = mix(coolAmbientTint * 0.54, shadowTintTarget * 0.38, 0.52);
  let volumePocketTint = select(volumePocketTintDefault, mix(coolAmbientTint * 0.84, shadowTintTarget * 0.76, 0.52), daylightCreamStyle);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(volumePocketTint, vec3<f32>(0.18, 0.19, 0.20)),
    clamp(volumePocketGate * select(0.12 + 0.22 * userShadowStrength, 0.055 + 0.095 * userShadowStrength, daylightCreamStyle), 0.0, select(0.46, 0.24, daylightCreamStyle))
  );

  let innerLipBand = clamp(
    smoothstep(0.14, 0.32, cloudA) *
    (1.0 - smoothstep(0.48, 0.82, cloudA)) *
    (0.35 + 0.65 * clamp(gradLenCached * 9.0 + rimBandBase * 0.55, 0.0, 1.0)) *
    (0.28 + 0.72 * max(cavity, pocketOcclusion)) *
    coherentAlpha,
    0.0,
    1.0
  );
  let innerLipTintDefault = mix(coolAmbientTint * 0.50, shadowTintTarget * 0.34, 0.54);
  let innerLipTint = select(innerLipTintDefault, mix(coolAmbientTint * 0.82, shadowTintTarget * 0.72, 0.54), daylightCreamStyle);
  cloudShaded = mix(
    cloudShaded,
    cloudShaded * max(innerLipTint, vec3<f32>(0.17, 0.18, 0.19)),
    clamp(innerLipBand * select(0.14 + 0.18 * userShadowStrength, 0.065 + 0.090 * userShadowStrength, daylightCreamStyle) * (1.0 - highlightBand * 0.28), 0.0, select(0.42, 0.24, daylightCreamStyle))
  );

  let alphaColorTint = max(mix(edgeWarm, userEdgeTint, 0.84), vec3<f32>(0.02, 0.02, 0.02));
  let alphaColorMix = clamp(
    alphaEdgeColorBand *
    mix(0.16, 1.0, shadowedEdgeSuppression) *
    (0.09 + 0.20 * edgeChroma + 0.045 * rimGain) *
    (0.55 + 0.45 * (1.0 - shadowBand)) *
    (0.72 + 0.28 * userColorLift),
    0.0,
    0.13
  );
  let alphaColorLum = max(luma(cloudShaded), max(baseBodyLum * 0.42, 0.035));
  cloudShaded = mix(cloudShaded, alphaColorTint * alphaColorLum * (1.02 + 0.14 * userColorLift), alphaColorMix);
  cloudShaded += alphaColorTint * cloudColorLift * alphaEdgeColorBand * shadowedEdgeSuppression * (0.035 + 0.12 * edgeChroma + 0.030 * rimGain) * (1.0 - shadowBand * 0.56);

  let bleedEdgeRaw = clamp(rimBandBase * (0.70 + 0.30 * (1.0 - bodyCore)) + directSurface * 0.46 + softWrap * 0.22, 0.0, 1.0);
  let bleedEdge = clamp(pow(bleedEdgeRaw, mix(0.64, 0.24, bleedDrive)) * bleedGain, 0.0, 1.0);
  cloudShaded += sunColor * cloudColorA * (fluffyLight * 0.052 + ridgeLift * 0.070 + softWrap * 0.034 + bleedEdge * 0.092) * (1.0 - shadowBand * 0.72) * bleedGain * mix(0.62, 1.0, thinHaloSuppress);
  cloudShaded = mix(cloudShaded, shadowBody * baseBodyLum, clamp(shadowBand * 0.14 + imageCavity * 0.06, 0.0, 0.28));

  let liftBand = clamp(midBand * 0.60 + highlightBand * 0.36 + (1.0 - shadowBand) * 0.12, 0.0, 1.0);
  cloudShaded = mix(cloudShaded, max(cloudShaded, vec3<f32>(baseBodyLum) * vec3<f32>(0.98, 0.99, 1.0)), highlightBand * 0.14 + rimBand * 0.045 * shadowedEdgeSuppression + silverBand * 0.035);
  let liftTint = mix(midCloudTint, litCloudTint, clamp(highlightBand * 0.58 + softWrap * 0.20, 0.0, 1.0));
  cloudShaded += liftTint * cloudColorA * liftBand * (0.040 + 0.075 * userColorLift);
  if (daylightCreamStyle) {
    let creamRecover = clamp(
      (midBand * 0.36 + highlightBand * 0.22 + (1.0 - shadowBand) * 0.12) *
      coherentAlpha *
      (1.0 - pocketOcclusion * 0.22),
      0.0,
      1.0
    );
    let creamTarget = max(cloudShaded, vec3<f32>(baseBodyLum) * vec3<f32>(1.12, 1.04, 0.92));
    cloudShaded = mix(cloudShaded, creamTarget, creamRecover * 0.22);
    cloudShaded += vec3<f32>(1.10, 0.92, 0.74) * cloudColorA * creamRecover * 0.025 * userColorLift;
  }
  let shadedLum = luma(cloudShaded);
  cloudShaded = clamp(mix(vec3<f32>(shadedLum), cloudShaded, userSaturation), vec3<f32>(0.0), vec3<f32>(8.0));

  if (style == 4u) {
    let charMix = clamp(shadowBand * (0.92 + 0.08 * bodyCore) * (1.0 - highlightBand * 0.70), 0.0, 1.0);
    let charTint = mix(vec3<f32>(0.075, 0.042, 0.034), shadowTintTarget, 0.44);
    cloudShaded = mix(cloudShaded, cloudShaded * charTint, charMix * 0.36 * userShadowStrength);

    let litRecover = clamp(highlightBand * (1.0 - shadowBand * 0.78) * (0.32 + 0.68 * bodyMask) + rimBand * 0.28 + silverBand * 0.12, 0.0, 1.0);
    let emberTint = mix(vec3<f32>(0.90, 0.24, 0.05), vec3<f32>(1.12, 0.54, 0.14), clamp(highlightBand + rimBand, 0.0, 1.0));
    cloudShaded += emberTint * cloudColorA * litRecover * 0.056 * userColorLift;
  }

  let sunLeak = (1.0 - shadowBand * 0.86) * (0.36 + 0.64 * (1.0 - bodyCore)) * bleedGain;
  cloudShaded += sunWash * sunGlow * (0.008 + 0.014 * R.sunBloom) * sunLeak * mix(0.75, 1.0, shadowedEdgeSuppression);

  let cloudDisplayA = alphaDisplayResponse(cloudA);
  let wispyDisplayBand =
    smoothstep(0.004, 0.13, cloudA) *
    (1.0 - smoothstep(0.28, 0.74, cloudA));
  let displayColorBoost = clamp(cloudDisplayA / max(cloudA, 0.065), 1.0, 1.24);
  cloudShaded *= mix(1.0, displayColorBoost, wispyDisplayBand * 0.10);

  let shadowDarknessNorm = clamp(userShadowDarkness / 6.0, 0.0, 1.0);
  let shadowDarknessBase = clamp(
    shadowBand * (0.50 + 0.34 * opticalDepth) +
    broadFormShadow * 0.22 +
    imageCavity * 0.14 +
    cavity * 0.10 +
    pocketOcclusion * 0.15,
    0.0,
    1.0
  );
  let shadowDarknessBand = clamp(pow(shadowDarknessBase, mix(1.35, 0.42, shadowDarknessNorm)) * userShadowDarkness, 0.0, 1.0);
  let shadowDarknessFloor = mix(1.0, 0.028, shadowDarknessBand);
  cloudShaded *= vec3<f32>(shadowDarknessFloor);

  if (adaptedSurface) {
    // Keep real ray-lit folds beneath the sculpted finish on either morphology.
    // The same shape, alpha, normals and density cache survive a shading switch.
    let physicalTint = mix(userShadowTint, userLightTint, smoothstep(0.08, 0.80, luma(cloudRGB) / max(cloudA, 0.0001)));
    let retainedRadiance = cloudRGB * mix(vec3<f32>(1.0), physicalTint, 0.24);
    cloudShaded = mix(retainedRadiance, cloudShaded, select(0.85, 0.65, R.fieldLighting > 0.5));
  }
  if(illustratedLook(style)){
    // Keep the authored three-tone relief, with a restrained silhouette away
    // from the light. Fine alpha folds must not become a uniform bright wire.
    let relief=clamp(surfaceLit*.60+(1.0-finalShadow)*.26+ridge*.14,0.0,1.0);
    let mid=smoothstep(.28,.38,relief);let bright=smoothstep(.64,.74,relief);
    let ink=mix(userShadowTint*.25,userLightTint*.48,mid);
    let paint=mix(ink,userLightTint,bright)*cloudA;
    cloudShaded=mix(cloudShaded,paint,.80);
    let outline=smoothstep(.06,.20,cloudA)*(1.0-smoothstep(.32,.70,cloudA));
    let fold=smoothstep(.006,.050,gradLenCached);
    let outlineLight=.12+.88*pow(max(dot(rayDir,sunDir),0.0),6.0);
    cloudShaded+=userEdgeTint*outline*(.15+.85*fold)*userRimStrength*cloudA*outlineLight*.40;
  }
  if (painterlyLook(style)) {
    // Optical folds give Rain Shelf its broad painted planes. Retain a little
    // ray-lit texture beneath the washes instead of hardening the whole image.
    // The procedural shelf can carry HDR radiance far above one. Compress it
    // before painting so bright source lights do not flatten every wash.
    let washScaleBase = select(max(0.25, R.shadowStrength * 1.7), max(0.20, R.shadowStrength * select(0.70, 0.80, style == 41u)), style >= 40u && style <= 42u);
    let washScale = select(washScaleBase, max(0.20, R.shadowStrength * 0.85), sumiLook(style));
    let lightWash = unpremulLum / (unpremulLum + washScale);
    var relief = select(clamp((1.0 - opticalDepth) * 0.38 + lightWash * 0.55
      + upperExposureCached * 0.07 + directSurface * 0.08, 0.0, 1.0),
      clamp(lightWash * 0.82 + upperExposureCached * 0.08 + directSurface * 0.10 - opticalDepth * 0.14, 0.0, 1.0), style >= 40u && style <= 42u);
    if (sumiLook(style)) { relief = clamp(lightWash * 0.80 + upperExposureCached * 0.12 + directSurface * 0.08 - opticalDepth * 0.06, 0.0, 1.0); }
    if (style == 44u || style == 41u) {
      // Opaque coverage must not clamp all low ray-lit washes to zero. Keep
      // the material's overlapping strokes inside a solid cloud body.
      let pigmentLight = inkLightValue(vec4<f32>(unpremulCloud, 1.0));
      relief = clamp(pigmentLight * 0.94 + upperExposureCached * 0.03 + directSurface * 0.03 + neighborhood.lightDetail, 0.0, 1.0);
    } else if (style >= 30u && style <= 44u) {
      relief = clamp(relief + neighborhood.lightDetail * 0.65, 0.0, 1.0);
    }
    var pigment = gouachePalette(relief, userShadowTint, userLightTint);
    pigment = finishPigmentColor(pigment, relief, unpremulCloud, userShadowTint, userLightTint, userEdgeTint, userSaturation);
    let paint = pigment * cloudA * mix(1.0, 0.18, R.nightAmount);
    let paintBlend = select(select(0.92, 0.985, inkLook(style)), 0.998, flowingInkLook(style));
    cloudShaded = mix(cloudShaded, paint, select(paintBlend, 0.96, style == 44u));
    let shoulder = select(smoothstep(0.035, 0.18, cloudA) * (1.0 - smoothstep(0.30, 0.76, cloudA)),
      smoothstep(0.025, 0.10, cloudA) * (1.0 - smoothstep(0.12, 0.32, cloudA)), inkLook(style));
    let fold = smoothstep(0.004, 0.045, gradLenCached);
    let rimLight = mix(select(0.025, 0.14, sumiLook(style)), 1.0, pow(max(dot(rayDir, sunDir), 0.0), 8.0));
    if (flowingInkLook(style)) {
      let crest = flowingInkCrest(cloudA, neighborhood.grad, in.uv, uvSun, neighborhood.occ);
      cloudShaded += userEdgeTint * crest * rimLight * clamp(R.styleControls.x, 0.0, 2.20)
        * cloudA * select(2.2, 2.4, sumiLook(style)) * mix(1.0, 0.18, R.nightAmount);
    } else {
      cloudShaded += userEdgeTint * shoulder * mix(0.30, 1.0, fold) * rimLight
        * clamp(R.styleControls.x, 0.0, 2.20) * cloudA * 0.85 * mix(1.0, 0.18, R.nightAmount);
    }
    if (inkLook(style) && !sumiLook(style)) {
      cloudShaded += userEdgeTint * inkFoldHighlight(relief, neighborhood.lightGrad) * cloudA
        * rimLight * select(0.08, 0.04, flowingInkLook(style)) * mix(1.0, 0.18, R.nightAmount);
    }
  }

  let skyMask = max(1.0 - cloudDisplayA, 0.0);
  let skyFogMask = pow(skyMask, 0.90);
  let lightingSkyMask = max(1.0 - cloudA, 0.0);
  let lightingSkyFogMask = pow(lightingSkyMask, 0.90);
  let edgeAlphaBand = smoothstep(0.03, 0.20, cloudA) * (1.0 - smoothstep(0.22, 0.58, cloudA));
  let rayBodyMask =
    pow(max(1.0 - max(cloudA, occCached), 0.0), 1.95) *
    pow(max(1.0 - cloudA, 0.0), 0.65) *
    (1.0 - 0.90 * bodyCore) *
    (1.0 - 0.72 * edgeAlphaBand) *
    mix(1.0, 0.72, shadowBand);

  let skyFogDistance = previewBackgroundDistance(rayDir,fogHorizon,min(terrainDistance,aircraft.distance),terrainVisibility,hullRay);
  let skyFogAmount = previewAerialFogAmount(skyFogDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, fogJitter);
  let fogColor = previewAerialFogColor(horizonSky, zenithSky, sunWash, shadowCool, rayDir, towardSunSky, fogHorizon, fogSun * foregroundGlow, lowSun);
  let foggedSky = mix(sky, fogColor, skyFogAmount);

  var linear =
    foggedSky * skyMask * (1.0 - godRayShadow * (0.13 + 0.30 * lowSun) * skyFogMask) +
    cloudShaded * sceneDeepShadowGain(cloudRGB / max(cloudA, .001), R.shadowDarkness);
  linear += sunWash * sunConeHaze * skyMask * skyFogMask * (0.32 + 0.22 * R.sunBloom);

  linear += sunColor * (
    (0.28 + 0.14 * R.sunBloom) * (rimBand + silverBand * silverBrightMode) * sunLeak * shadowedEdgeSuppression * mix(0.64, 1.0, thinHaloSuppress)
  );

  let cloudFogDistance = previewCloudAerialDistance(rayDir, cloudDisplayA, fogHorizon);
  let aerialFogRaw = previewAerialFogAmount(cloudFogDistance, rayDir, fogDensity, fogHorizon, fogSun, lowSun, towardSunSky, fogJitter);
  let cloudMatterResponse = mix(0.98, 0.72, smoothstep(0.54, 1.0, bodyCore)) * mix(0.98, 0.78, smoothstep(0.72, 1.0, cloudDisplayA));
  let skyBehindMix = pow(max(1.0 - cloudDisplayA, 0.0), 1.10);
  let edgeMistLift = 1.0 + 0.14 * skyBehindMix + 0.08 * edgeAlphaBand;
  let matterFogGate = smoothstep(0.006, 0.24, cloudDisplayA);
  let immersedFog =
    previewCloudBoxImmersion(fogHorizon) *
    matterFogGate *
    fogDensity *
    mix(0.020, 0.095, clamp(fogHorizon * 0.50, 0.0, 1.0)) *
    (1.0 - 0.42 * bodyCore) *
    (0.70 + 0.30 * skyBehindMix);
  let fogAmount = clamp(aerialFogRaw * cloudMatterResponse * edgeMistLift * matterFogGate + immersedFog, 0.0, 0.82);
  linear = mix(linear, fogColor, fogAmount)
    + godRayColor * godRays * (.32 + .68 * lowSun) * lightingSkyFogMask * rayBodyMask
    + sunColor * (1.04 * sunDisk + (.24 + .22 * R.sunBloom) * sunGlow * bleedGain)
      * previewSolarTransmission(max(skyFogAmount, fogAmount));

  let mapped = toneMapFilmic(sceneHighlightRolloff(linear * max(R.exposure * 0.82, 0.0), R.region.y));
  let styled = applyStyleGrade(mapped, style, clamp(cloudA * 1.15 + bodyCore * 0.35, 0.0, 1.0));
  var graded = pow(styled, vec3<f32>(0.99, 0.995, 1.0));
  if(cloudA<0.025){
    var clearLinear=sky*(1.0-godRayShadow*(0.16+0.34*lowSun));
    clearLinear=mix(clearLinear,fogColor,skyFogAmount)
      +godRayColor*godRays*(.40+.86*lowSun)
      +sunColor*(1.18*sunDisk+.22*sunGlow)*previewSolarTransmission(skyFogAmount);
    clearLinear+=sunWash*sunConeHaze*(0.34+0.18*R.sunBloom)*(1.0-skyFogAmount*0.42);
    let clearMapped=toneMapFilmic(sceneHighlightRolloff(clearLinear * max(R.exposure * 0.80, 0.0), R.region.y));
    let clearStyled=pow(applyStyleGrade(clearMapped,style,0.0),vec3<f32>(0.99,0.995,1.0));
    graded=mix(clearStyled,graded,smoothstep(0.003,0.025,cloudA));
  }
  let display = mix(graded, fluidColor, fluidWeight);
  return vec4<f32>(applyLocalCloudShafts(display, localShaft, fluidSolar, cloudA, R.godRayControls.y, R.shadowDarkness), 1.0);
}
