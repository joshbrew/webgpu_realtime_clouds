struct Scene {
  sizeTime: vec4<f32>, // canvas width, height, elapsed seconds, cloud thickness
  position: vec4<f32>,
  forward: vec4<f32>,
  right: vec4<f32>,
  up: vec4<f32>,
  view: vec4<f32>, // tangent of half field of view, orthographic half height, selected object
  obstacles: array<vec4<f32>, 3>, // center xz, scale, shape
  axes: array<vec4<f32>, 3>, // cosine, sine
  material: vec4<f32>, // wake detail, east/south travel, rock seed bits
  sunlight: vec4<f32>, // normalized light direction, terrain elevation datum
  region: vec4<f32>, // active, cloud layer height, terrain cutoff, sea height
  rockUp: vec4<f32>, // up, world radius
  rockEast: vec4<f32>, // east, horizontal metres per scene unit
  rockSouth: vec4<f32>, // south, vertical metres per scene unit
  rock: RegionRockAnchor,
  wind: vec4<f32>, // horizontal direction, formation mode, breakup
  terrainLOD: vec4<f32>, // grid spacing in metres, sea radius in scene units
  lookSky: vec4<f32>, // sky tint, bloom
  lookSun: vec4<f32>, // sun tint, direct boost
  lookFront: vec4<f32>, // lit cloud tint, direct blend
  lookShadow: vec4<f32>, // shaded cloud tint, shadow strength
  lookTransmission: vec4<f32>, // transmitted tint, rim strength
  lookPost: vec4<f32>, // exposure, saturation, lift, haze
  lookFog: vec4<f32>, // horizon, sun glow, shafts, ray sample multiplier
};

@group(0) @binding(0) var<uniform> scene: Scene;
@group(0) @binding(1) var material: texture_2d<f32>;
@group(0) @binding(2) var<storage, read> velocity: array<vec2<f32>>;
@group(0) @binding(3) var materialSampler: sampler;

@group(0) @binding(4) var terrainSurface: texture_2d<f32>;
@group(0) @binding(5) var<storage, read> terrainField: array<vec2<f32>>;
@group(0) @binding(6) var terrainCloudDetail: texture_2d<f32>;
@group(0) @binding(7) var terrainCloudLight: texture_3d<f32>;
@group(0) @binding(8) var terrainDensityOut: texture_storage_3d<rgba16float, write>;
@group(0) @binding(9) var terrainDensity: texture_3d<f32>;
@group(0) @binding(10) var terrainLightOut: texture_storage_3d<rgba16float, write>;
@group(0) @binding(11) var cloudGroundHeight: texture_2d<f32>;
@group(0) @binding(12) var cloudContextHeight: texture_2d<f32>;
@group(0) @binding(13) var terrainHorizonOut: texture_storage_2d<rgba16float, write>;
@group(0) @binding(14) var terrainHorizon: texture_2d<f32>;
@group(0) @binding(15) var regionSkylight: texture_2d<f32>;
@group(0) @binding(16) var terrainWater: texture_2d<f32>;

// Raymarch pipelines specialize these paths. Shared compute shaders use the
// scene flag when no mode is specified.
override FLUID_RAY_TERRAIN_MODE: u32 = 0u;

fn fluidTerrainActive() -> bool {
  return FLUID_RAY_TERRAIN_MODE == 2u || (FLUID_RAY_TERRAIN_MODE == 0u && scene.region.x > .5);
}

fn cloudCenter() -> f32 {
  return select(.26, scene.region.y, fluidTerrainActive());
}
const farDistance = 100000.0;

@vertex
fn vertexMain(@builtin(vertex_index) id: u32) -> @builtin(position) vec4<f32> {
  let corners = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  return vec4<f32>(corners[id], 0.0, 1.0);
}

fn index(p: vec2<i32>) -> u32 {
  let q = vec2<u32>(p) & vec2<u32>(GRID - 1u);
  return q.x + q.y * GRID;
}

fn cloudColumn(world: vec2<f32>) -> vec4<f32> {
  let uv = world / DOMAIN + 0.5;
  let sides = abs(uv - 0.5);
  let square = max(sides.x, sides.y);
  // Soften the outer corners beyond the selected region. The solver runs
  // across this margin, and a few banks fade away before reaching the edge.
  let edge = select(square, square + .58 * max(0.0, min(sides.x, sides.y) - .41), fluidTerrainActive());
  if (edge >= 0.5) { return vec4<f32>(0.0); }
  let fade = select(.39, .452, fluidTerrainActive());
  return textureSampleLevel(material, materialSampler, uv, 0.0) * (1.0 - smoothstep(fade, .50, edge));
}

fn columnDensity(world: vec2<f32>) -> f32 {
  return cloudColumn(world).x;
}

fn wakeCore(spin: f32) -> f32 {
  return smoothstep(0.19, 0.80, abs(spin)) * scene.material.x;
}

fn solarColor(sun: vec3<f32>) -> vec3<f32> {
  return sceneSolarColor(sun.y) * scene.lookSun.rgb;
}

// Direct illumination and cast-shadow contrast fade together near the horizon.
fn fluidDirectSun(elevation: f32) -> f32 {
  return smoothstep(0.0, .06, elevation);
}

fn sky(dir: vec3<f32>, sun: vec3<f32>, solar: vec3<f32>, night: f32, detail: bool) -> vec3<f32> {
  let nearSun = max(dot(dir, sun), 0.0);
  if (night >= 1.0) { return sceneNightGradient(dir, dir.y, scene.lookSky.rgb, detail); }
  // Terrain haze and reflections carry the same sunset gradient and broad glow.
  // Reserve the visible disk and its tight glare for direct views into the sky.
  var glow = sceneSolarHaze(nearSun);
  if (detail) {
    let disk = select(smoothstep(-.008, .008, dir.y), 1.0, fluidTerrainActive());
    glow += (sceneSolarGlare(nearSun) + 4.0 * sceneSolarDisk(nearSun)) * disk;
  }
  let day = sceneSkyGradient(dir.y, nearSun, sun.y) * scene.lookSky.rgb + solar * glow * (scene.lookSky.w / .18);
  if (night <= 0.0) { return day; }
  return mix(day, sceneNightGradient(dir, dir.y, scene.lookSky.rgb, detail), night);
}

fn ocean(p: vec3<f32>, ray: vec3<f32>, distance: f32, sun: vec3<f32>, solar: vec3<f32>) -> vec3<f32> {
  let time = scene.sizeTime.z;
  let pixelSpan = 2.0 * select(distance * scene.view.x, scene.view.y, scene.view.y > 0.0) / scene.sizeTime.y;
  let waves = oceanWaves(p.xz, time, pixelSpan);
  let normal = normalize(vec3<f32>(waves.slope.x, 1.0, waves.slope.y));
  let reflection = reflect(ray, normal);
  let fresnel = pow(1.0 - max(dot(-ray, normal), 0.0), 4.0);
  let reflectionSun = max(dot(reflection, sun), 0.0);
  let clear = sunlightThroughCloud(p, sun, scene.sizeTime.w, true);
  let deep = vec3<f32>(0.009, 0.037, 0.055) * (0.76 + waves.roll * 0.40);
  // The direct glint uses the same cloud transmittance as the volume.
  let night = sceneNightAmount(sun.y);
  let sunlight = solar * fluidDirectSun(sun.y);
  let reflectedSky = sky(reflection, sun, solar, night, false);
  let waterLight = oceanSurfaceLight(deep * mix(1.0, .30, night), reflectedSky, reflectionSun, sunlight, clear, fresnel);
  let horizon = normalize(vec3<f32>(ray.x, 0.0, ray.z) + vec3<f32>(0.000001, 0.0, 0.0));
  return mix(waterLight, sky(horizon, sun, solar, night, false) * 0.97, 1.0 - exp(-distance * 0.012));
}

fn heightInterval(originY: f32, rayY: f32, top: f32) -> vec2<f32> {
  if (abs(rayY) < 0.000001) {
    return select(vec2<f32>(0.0, farDistance), vec2<f32>(farDistance, -1.0), originY < seaLevel || originY > top);
  }
  let a = (seaLevel - originY) / rayY;
  let b = (top - originY) / rayY;
  return vec2<f32>(max(0.0, min(a, b)), max(a, b));
}

fn cylinder(origin: vec3<f32>, ray: vec3<f32>, object: vec4<f32>, top: f32) -> vec4<f32> {
  let miss = vec4<f32>(0, 1, 0, farDistance);
  let vertical = heightInterval(origin.y, ray.y, top);
  var near = vertical.x;
  var far = vertical.y;
  var normal = vec3<f32>(0.0, select(-1.0, 1.0, ray.y < 0.0), 0.0);
  let offset = origin.xz - object.xy;
  let a = dot(ray.xz, ray.xz);
  let b = dot(offset, ray.xz);
  let c = dot(offset, offset) - object.z * object.z;
  if (a < 0.000001) {
    if (c > 0.0) { return miss; }
  } else {
    let discriminant = b * b - a * c;
    if (discriminant < 0.0) { return miss; }
    let root = sqrt(discriminant);
    let entry = (-b - root) / a;
    if (entry > near) {
      near = entry;
      let n = normalize(offset + ray.xz * near);
      normal = vec3<f32>(n.x, 0.0, n.y);
    }
    far = min(far, (-b + root) / a);
  }
  if (near <= 0.0 || far < near) { return miss; }
  return vec4<f32>(normal, near);
}

fn obstacleHit(origin: vec3<f32>, ray: vec3<f32>, object: vec4<f32>, axis: vec2<f32>, top: f32) -> vec4<f32> {
  let kind = u32(object.w);
  if (kind == 0u) { return cylinder(origin, ray, object, top); }
  let miss = vec4<f32>(0, 1, 0, farDistance);
  let vertical = heightInterval(origin.y, ray.y, top);
  if (vertical.x > vertical.y) { return miss; }
  let local = obstacleLocal(origin.xz - object.xy, axis);
  let direction = obstacleLocal(ray.xz, axis);
  var near = vertical.x;
  var far = vertical.y;
  var normal = vec3<f32>(0.0, select(-1.0, 1.0, ray.y < 0.0), 0.0);
  // Intersect the same convex prism used to classify solid CFD cells.
  for (var i = 0u; i < obstaclePlaneCount(kind); i++) {
    let plane = obstaclePlane(kind, i);
    let signedDistance = dot(plane.xy, local) - object.z * plane.z;
    let slope = dot(plane.xy, direction);
    if (abs(slope) < 0.000001) {
      if (signedDistance > 0.0) { return miss; }
      continue;
    }
    let t = -signedDistance / slope;
    if (slope < 0.0 && t > near) {
      near = t;
      let n = obstacleWorld(plane.xy, axis);
      normal = vec3<f32>(n.x, 0.0, n.y);
    }
    if (slope > 0.0) { far = min(far, t); }
    if (near > far) { return miss; }
  }
  if (near <= 0.0) { return miss; }
  return vec4<f32>(normal, near);
}

fn buoyColor(id: u32) -> vec3<f32> {
  let marks = array<vec3<f32>, 3>(
    vec3<f32>(0.95, 0.32, 0.09), vec3<f32>(0.29, 0.72, 0.78), vec3<f32>(0.76, 0.56, 0.24));
  return marks[id];
}

fn objectLight(p: vec3<f32>, ray: vec3<f32>, normal: vec3<f32>, object: vec4<f32>, id: u32, sun: vec3<f32>, solar: vec3<f32>, directSun: f32) -> vec3<f32> {
  let radius = length(p.xz - object.xy) / object.z;
  let color = buoyColor(id);
  let isTop = normal.y > 0.5;
  let kind = u32(object.w);
  var topRings = smoothstep(0.74, 0.79, radius) * (1.0 - smoothstep(0.87, 0.91, radius));
  if (kind != 0u) {
    let delta = p.xz - object.xy;
    let axis = scene.axes[id].xy;
    let edge = -footprintDistance(delta, object.z, kind, axis) / object.z;
    topRings = smoothstep(0.050, 0.073, edge) * (1.0 - smoothstep(0.115, 0.135, edge));
    let local = obstacleLocal(delta, axis) / object.z;
    let stripe = (1.0 - smoothstep(0.018, 0.035, abs(local.y)))
      * smoothstep(-0.84, -0.73, local.x) * (1.0 - smoothstep(0.38, 0.49, local.x));
    topRings = max(topRings, stripe * 0.56);
  }
  let selected = f32(id) == scene.view.z;
  let ring = select(0.0, topRings * select(0.44, 1.0, selected), isTop);
  let sideBand = select(smoothstep(0.13, 0.17, p.y) * (1.0 - smoothstep(0.24, 0.28, p.y)), 0.0, isTop);
  let materialGrain = 0.82 + 0.31 * oceanNoise3(p * vec3<f32>(8.0, 22.0, 8.0));
  let lowerBounce = (1.0 - smoothstep(seaLevel + 0.04, seaLevel + 0.53, p.y)) * select(1.0, 0.0, isTop);
  let metal = vec3<f32>(0.045, 0.069, 0.087) * materialGrain + vec3<f32>(0.013, 0.027, 0.043) * lowerBounce;
  let panel = mix(metal, color * 0.64, ring + sideBand * 0.44);
  let diffuse = 0.32 + 0.70 * max(dot(sun, normal), 0.0);
  let specular = pow(max(dot(reflect(ray, normal), sun), 0.0), 44.0);
  let direct = sunlightThroughCloud(p, sun, scene.sizeTime.w, true) * directSun;
  return panel * (0.32 + (diffuse - 0.32) * direct)
    + solar * (0.15 * specular * direct) + color * (ring * 0.39 + sideBand * 0.15);
}

const terrainSpillDepth = .24;

fn fogBlanketActive() -> bool {
  return scene.wind.z >= 2.0;
}

fn cloudVerticalRange() -> vec2<f32> {
  // Include the shifted profile and the soft, noise-eroded edges.
  let terrainRange = vec2<f32>(-.68 + TERRAIN_LOFT_MIN - terrainSpillDepth, .87 + TERRAIN_LOFT_MAX + .29 * TERRAIN_BILLOW_MAX);
  let range = select(vec2<f32>(-.5, .5), terrainRange, fluidTerrainActive());
  return range - vec2<f32>(select(0.0, .14, fogBlanketActive()), 0.0);
}

fn layerBounds(origin: vec3<f32>, ray: vec3<f32>, heights: vec2<f32>) -> vec2<f32> {
  let lower = vec3<f32>(-DOMAIN * .5, heights.x, -DOMAIN * .5);
  let upper = vec3<f32>(DOMAIN * .5, heights.y, DOMAIN * .5);
  let safeRay = select(ray, select(vec3<f32>(-0.000001), vec3<f32>(0.000001), ray >= vec3<f32>(0.0)), abs(ray) < vec3<f32>(0.000001));
  let a = (lower - origin) / safeRay;
  let b = (upper - origin) / safeRay;
  let near = min(a, b);
  let far = max(a, b);
  return vec2<f32>(max(0.0, max(near.x, max(near.y, near.z))), min(far.x, min(far.y, far.z)));
}

fn cloudBounds(origin: vec3<f32>, ray: vec3<f32>, thickness: f32) -> vec2<f32> {
  return layerBounds(origin, ray, vec2<f32>(cloudCenter()) + cloudVerticalRange() * thickness);
}

struct CloudLayer {
  moisture: f32,
  base: f32,
  crest: f32,
  condensation: f32,
  loft: f32,
};

fn cloudLayer(world: vec2<f32>, column: vec4<f32>) -> CloudLayer {
  let edge = world * (2.0 / DOMAIN);
  let curvedEdge = edge * edge * edge;
  let terrain = fluidTerrainActive();
  let taper = select(1.0 - smoothstep(0.24, 1.16, dot(curvedEdge, curvedEdge)), 1.0, terrain);
  let core = wakeCore(column.w);
  let moisture = column.x * taper * (1.0 - 0.09 * core);
  let coverage = smoothstep(0.11, 0.85, moisture);
  // Rotation thins the bank vertically. Dilute moisture can remain visible
  // as wrapping wisps instead of being subtracted out of the whole column.
  let condensation = mix(0.128, 0.071, core);
  // Moist ribbons share a diffuse base. Denser ribbons reach higher, while
  // circulation raises one side of the wake and lowers the other.
  let loft = select(0.0, column.y, terrain);
  let billow = select(0.0, column.z, terrain);
  let lift = column.w * scene.material.x * 0.13 + loft;
  let wakeGrowth = select(-.085, .035, terrain);
  var base = mix(-0.27, -0.34, coverage) + lift + 0.017 * core - .06 * billow;
  var crest = mix(-0.12, 0.36, coverage) + lift + wakeGrowth * core + .29 * billow;
  if (fogBlanketActive()) {
    // Keep a shallow body near the foot of the cloud layer. The history
    // still lifts and curls the exposed top where terrain disturbs the wind.
    base -= .13;
    crest = mix(crest, base + .46 + .15 * billow, .52);
  }
  return CloudLayer(moisture, base, crest, condensation, loft);
}

fn layerProfile(height: f32, base: f32, crest: f32) -> f32 {
  let lowerFade = smoothstep(-0.10, 0.14, height - base);
  let upperFade = smoothstep(-0.054, 0.155, crest - height);
  return lowerFade * upperFade;
}

fn terrainHeightAt(heights: texture_2d<f32>, world: vec2<f32>, width: f32) -> f32 {
  let inset = vec2<f32>(.5) / vec2<f32>(textureDimensions(heights));
  let uv = clamp(world / width + .5, inset, 1.0 - inset);
  let sample = textureSampleLevel(heights, materialSampler, uv, 0.0).rg;
  return select(-64.0, sample.x / max(sample.y, .001), sample.y > .5);
}

fn groundBelow(world: vec2<f32>) -> f32 {
  return max(terrainHeightAt(cloudGroundHeight, world, DOMAIN), scene.region.w);
}

fn cloudDensity(p: vec3<f32>, thickness: f32, stepSize: f32, resolvedDetail: f32) -> f32 {
  let terrain = fluidTerrainActive();
  if (terrain && p.y <= scene.region.w) { return 0.0; }
  let column = cloudColumn(p.xz);
  if (column.x < 0.032) { return 0.0; }
  let layer = cloudLayer(p.xz, column);
  if (layer.moisture < layer.condensation * 0.62) { return 0.0; }
  let center = cloudCenter();
  let height = (p.y - center) / thickness;
  let descent = select(0.0, smoothstep(.022, .145, -layer.loft), terrain);
  // The ridge can only raise the floor; downhill spill can lower it by
  // at most this amount. Reject clear air before sampling the terrain.
  let lowestFloor = layer.base - terrainSpillDepth * descent;
  if (height < lowestFloor - .17 || height > layer.crest + .23) { return 0.0; }
  var floor = layer.base;
  var ground = -1e6;
  if (terrain) {
    let groundHeight = groundBelow(p.xz);
    if (p.y <= groundHeight) { return 0.0; }
    ground = (groundHeight - center) / thickness;
    // Only a low bank carried down a lee slope can reach the surface.
    // Detached clouds retain their base over the deeper valley.
    let attached = 1.0 - smoothstep(.15, 1.06, layer.base - ground);
    floor = max(ground + .028, layer.base - terrainSpillDepth * descent * attached);
    if (height < floor - .17) { return 0.0; }
  }

  let wakeDetail = scene.material.x;
  let time = scene.sizeTime.z;
  let windOffset = mix(vec2<f32>(time * .34, time * .045), scene.material.yz, wakeDetail);
  var detail = vec4<f32>(column.yz, 0.0, 0.0);
  if (terrain) {
    let margin = vec2<f32>(.5 / f32(GRID));
    let uv = clamp(p.xz / DOMAIN + .5, margin, 1.0 - margin);
    detail = textureSampleLevel(terrainCloudDetail, materialSampler, uv, 0.0);
  }
  let strain = detail.zw;
  let response = smoothstep(.035, .63, length(strain)) * wakeDetail;
  let wind = scene.wind.xy;
  let crosswind = vec2<f32>(-wind.y, wind.x);
  // Apply the advected strain tensor to the flow direction. The bend
  // increases with height, while vorticity curls the exposed top over.
  let shear = vec2<f32>(dot(strain, wind), dot(strain, crosswind));
  let layerHeight = clamp((height - floor) / max(.15, layer.crest - floor), 0.0, 1.0);
  let turn = layerHeight * layerHeight;
  let wakeBend = shear * ((.27 * layerHeight + .24 * turn) * wakeDetail)
    + crosswind * (column.w * .41 * turn * response);
  let transported = p.xz - windOffset + detail.xy * wakeDetail + wakeBend;
  let loftHeight = height - layer.loft;
  let stream = vec2<f32>(transported.x + transported.y * 0.18, transported.y - transported.x * 0.11);
  let broad = oceanNoise3(vec3<f32>(stream.x * 1.06, loftHeight * 1.09 + 8.7, stream.y * 2.02)) - 0.5;
  let fold = vec2<f32>(stream.x * 0.91 + stream.y * 0.19, stream.y - broad * 0.21);
  let fine = oceanNoise3(vec3<f32>(fold.x * 3.32, loftHeight * 2.70 + 17.6, fold.y * 5.65)) - 0.5;
  let base = max(ground + .018, floor + broad * .066 + fine * .025);
  let smoothCrest = broad * .208 + fine * .145;
  let rollWeight = response * (1.0 - smoothstep(.13, .34, stepSize)) * smoothstep(.015, .17, height - floor);
  var roll = .5;
  if (rollWeight > .025) {
    let lobe = oceanNoise3(vec3<f32>(fold.x * 4.15 + fine * .36, loftHeight * 3.6 + 12.8, fold.y * 6.72 - broad * .72));
    roll = smoothstep(.33, .75, lobe);
  }
  // Rounded heads and openings use the same value. The amplitude stays
  // inside the existing cloud bounds even when the shear is strongest.
  let rollingCrest = broad * .132 + fine * .052 + (roll - .5) * .17;
  let crest = layer.crest + mix(smoothCrest, rollingCrest, rollWeight);
  let contact = smoothstep(0.0, .11, height - ground);
  let depth = max(.18, layer.crest - layer.base);
  let spread = clamp(depth / max(.18, layer.crest - floor), .72, 1.0);
  var profile = layerProfile(height, base, crest) * contact * spread;
  if (profile <= 0.0) { return 0.0; }
  // Erode exposed edges on several scales. Low-lying vapor can stay
  // connected beneath a torn crest, and dense interiors keep their body.
  let fringe = 1.0 - smoothstep(0.19, 0.72, layer.moisture);
  let crestEdge = smoothstep(-0.21, 0.13, height - crest);
  let eddyFringe = 1.0 - smoothstep(0.10, 0.49, layer.moisture);
  let eddy = wakeCore(column.w) * eddyFringe;
  let erosion = mix(0.25, 1.0, max(fringe, crestEdge)) + 0.32 * eddy;
  var grain = 0.0;
  if (erosion > 0.38 && resolvedDetail > 0.0) {
    grain = (oceanNoise3(vec3<f32>(fold.x * 7.25 + 5.7, loftHeight * 4.9, fold.y * 12.9 + 8.2)) - 0.5)
      * resolvedDetail;
  }
  let support = smoothstep(layer.condensation * 0.65, 0.24, layer.moisture);
  let openings = (roll - .5) * rollWeight * .23 * max(fringe, crestEdge);
  var vapor = layer.moisture + support * (erosion * (broad * .17 + fine * .185 + grain * .11) + openings);
  let breakup = scene.wind.w;
  if (breakup > 0.0) {
    let edgeWeight = max(fringe, crestEdge) * support;
    let crestSupport = smoothstep(-.38, .015, height - crest) * support;
    let coarseWeight = 1.0 - smoothstep(.10, .37, stepSize);
    if (coarseWeight * max(edgeWeight, crestSupport) > .005) {
      // Warp a finer octave with the existing flowing billows. The same
      // material coordinates feed the visible cloud and cached terrain light.
      let q = vec3<f32>(fold.x + fine * .17, loftHeight + broad * .54, fold.y - fine * .20);
      let cells = oceanNoise3(q * vec3<f32>(5.8, 4.4, 8.1) + vec3<f32>(13.0, 25.0, 6.0));
      var breakupShape = smoothstep(.26, .68, cells) - .62;
      let fineWeight = coarseWeight * resolvedDetail;
      if (fineWeight > .015) {
        let flecks = oceanNoise3(q * vec3<f32>(11.8, 8.6, 15.1) + 3.2 * cells);
        breakupShape += (flecks - .5) * .46 * fineWeight;
      }
      let strength = breakup * coarseWeight;
      vapor += breakupShape * strength * edgeWeight * mix(.30, .48, max(response, eddy));
      // Carve the top profile as well as its vapor. A dense blanket can
      // saturate the moisture response but still has a visible silhouette.
      let crestErosion = (1.0 - smoothstep(.25, .65, cells)) * strength * crestSupport
        * mix(.26, .39, response);
      profile = layerProfile(height, base, crest - crestErosion) * contact * spread;
    }
  }
  return smoothstep(layer.condensation, 0.77, vapor) * profile * 5.05;
}

fn lightExtinction(p: vec3<f32>, thickness: f32) -> f32 {
  let layer = cloudLayer(p.xz, cloudColumn(p.xz));
  let height = (p.y - cloudCenter()) / thickness;
  return smoothstep(layer.condensation, 0.77, layer.moisture)
    * layerProfile(height, layer.base, layer.crest + 0.035);
}

fn terrainVolumeUV(p: vec3<f32>, thickness: f32) -> vec3<f32> {
  let range = cloudVerticalRange();
  let y = ((p.y - cloudCenter()) / thickness - range.x) / (range.y - range.x);
  let worldUV = vec3<f32>(p.x / DOMAIN + .5, y, p.z / DOMAIN + .5);
  // Volume taps at a side use the boundary voxel. The shared material sampler
  // repeats its 2D inputs, so keep these coordinates inside the valid centers.
  let inset = .5 / vec3<f32>(TERRAIN_LIGHT_SIZE);
  return clamp(worldUV, inset, 1.0 - inset);
}

fn terrainVoxelPosition(id: vec3<u32>, thickness: f32) -> vec3<f32> {
  let uv = (vec3<f32>(id) + .5) / vec3<f32>(TERRAIN_LIGHT_SIZE);
  let range = cloudVerticalRange();
  return vec3<f32>((uv.x - .5) * DOMAIN,
    cloudCenter() + mix(range.x, range.y, uv.y) * thickness, (uv.z - .5) * DOMAIN);
}

fn sunlightThroughCloud(p: vec3<f32>, sun: vec3<f32>, thickness: f32, outside: bool) -> f32 {
  if (fluidTerrainActive()) {
    var entry = p;
    if (outside) {
      let interval = cloudBounds(p, sun, thickness);
      if (interval.y <= interval.x) { return 1.0; }
      entry += sun * interval.x;
    }
    return textureSampleLevel(terrainCloudLight, materialSampler, terrainVolumeUV(entry, thickness), 0.0).r;
  }
  // Grazing rays can leave through a side or either cap.
  let interval = cloudBounds(p, sun, thickness);
  let length = interval.y - interval.x;
  if (length <= 0.001) { return 1.0; }
  let step = min(0.45, length * 0.24);
  let remainder = length - step;
  let base = p + sun * interval.x;
  let nearDepth = lightExtinction(base + sun * (step * 0.56), thickness) * step;
  let depth = nearDepth + (lightExtinction(base + sun * (step + remainder * 0.22), thickness) * 0.50
    + lightExtinction(base + sun * (step + remainder * 0.69), thickness) * 0.50) * remainder;
  return exp(-depth * 4.0);
}

@compute @workgroup_size(8, 4, 4)
fn bakeTerrainCloudDensity(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id >= TERRAIN_LIGHT_SIZE)) { return; }
  let thickness = scene.sizeTime.w;
  let position = terrainVoxelPosition(id, thickness);
  // The volume resolves the rolled crest and the openings between lobes.
  // The last grain octave is finer than its voxels and stays view-only.
  let pitch = DOMAIN / f32(TERRAIN_LIGHT_SIZE.x);
  let density = cloudDensity(position, thickness, pitch, 0.0);
  textureStore(terrainDensityOut, vec3<i32>(id), vec4<f32>(density, 0.0, 0.0, 0.0));
}

@compute @workgroup_size(8, 8)
fn bakeTerrainHorizon(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id.xy >= TERRAIN_LIGHT_SIZE.xz)) { return; }
  let world = ((vec2<f32>(id.xy) + .5) / vec2<f32>(TERRAIN_LIGHT_SIZE.xz) - .5) * DOMAIN;
  let sun = scene.sunlight.xyz;
  let horizontal = length(sun.xz);
  var horizon = -64.0;
  var blockerDistance = 0.0;
  if (horizontal > .001 && textureDimensions(cloudContextHeight).x > 1u) {
    let direction = sun.xz / horizontal;
    let slope = sun.y / horizontal;
    var distance = .075;
    // A ridge projects a shadow down by tan(sun elevation) times distance.
    // Record the highest projected ridge so all heights can share this trace.
    for (var i = 0u; i < 124u; i++) {
      let p = world + direction * distance;
      let extent = max(abs(p.x), abs(p.y));
      if (extent >= TERRAIN_CONTEXT_WIDTH * .5) { break; }
      var height: f32;
      if (extent < DOMAIN * .5 - .12) {
        height = terrainHeightAt(cloudGroundHeight, p, DOMAIN);
      } else {
        height = terrainHeightAt(cloudContextHeight, p, TERRAIN_CONTEXT_WIDTH);
      }
      let projected = height - slope * distance;
      if (projected > horizon) {
        horizon = projected;
        blockerDistance = distance;
      }
      distance += clamp(distance * .065, .075, .92);
    }
  }
  let softness = .041 + .006 * blockerDistance;
  textureStore(terrainHorizonOut, vec2<i32>(id.xy), vec4<f32>(horizon, softness, 0.0, 0.0));
}

fn terrainSunAt(horizon: vec2<f32>, height: f32) -> f32 {
  return smoothstep(horizon.x - horizon.y, horizon.x + horizon.y, height);
}

fn terrainHorizonAt(world: vec2<f32>) -> vec2<f32> {
  let inset = .5 / vec2<f32>(TERRAIN_LIGHT_SIZE.xz);
  let uv = clamp(world / DOMAIN + .5, inset, 1.0 - inset);
  return textureSampleLevel(terrainHorizon, materialSampler, uv, 0.0).rg;
}

fn landSunVisibility(point: vec3<f32>, normal: vec3<f32>) -> f32 {
  let edge = max(abs(point.x), abs(point.z)) / DOMAIN;
  let coverage = 1.0 - smoothstep(.43, .50, edge);
  if (coverage <= 0.0) { return 1.0; }
  let horizon = terrainHorizonAt(point.xz);
  // Leave a small receiver bias for the terrain elevation raster and
  // interpolate out of the cached shadow near the edge of the cloud map.
  let receiver = point.y + .053 + .031 * (1.0 - normal.y);
  return mix(1.0, terrainSunAt(horizon, receiver), coverage);
}

fn sunThroughDensity(id: vec3<u32>, thickness: f32, sun: vec3<f32>) -> f32 {
  let position = terrainVoxelPosition(id, thickness);
  let length = max(0.0, cloudBounds(position, sun, thickness).y);
  let count = u32(clamp(ceil(length / .175), 2.0, 18.0));
  let stride = length / f32(count);
  let uv = (vec3<f32>(id) + .5) / vec3<f32>(TERRAIN_LIGHT_SIZE);
  let inset = .5 / vec3<f32>(TERRAIN_LIGHT_SIZE);
  let range = cloudVerticalRange();
  let uvStep = sun * stride / vec3<f32>(DOMAIN, (range.y - range.x) * thickness, DOMAIN);
  var depth = 0.0;
  for (var i = 0u; i < count; i++) {
    let tap = clamp(uv + uvStep * (f32(i) + .5), inset, 1.0 - inset);
    let density = textureSampleLevel(terrainDensity, materialSampler, tap, 0.0).r;
    depth += density * stride;
    if (depth >= 7.5) { break; }
  }
  return exp(-.86 * depth);
}

var<workgroup> columnSkyDepth: array<array<f32, TERRAIN_LIGHT_SIZE.y>, TERRAIN_LIGHT_COLUMNS>;

@compute @workgroup_size(TERRAIN_LIGHT_COLUMNS, TERRAIN_LIGHT_ROWS)
fn bakeTerrainCloudLight(@builtin(global_invocation_id) id: vec3<u32>,
    @builtin(local_invocation_id) local: vec3<u32>) {
  let thickness = scene.sizeTime.w;
  let range = cloudVerticalRange();
  let pitch = (range.y - range.x) * thickness / f32(TERRAIN_LIGHT_SIZE.y);
  // Preserve the top-down sky integral, then trace sunlight independently
  // at every height. A long shadow ray no longer holds up its whole column.
  if (local.y == 0u && id.x < TERRAIN_LIGHT_SIZE.x) {
    var skyDepth = 0.0;
    for (var row = i32(TERRAIN_LIGHT_SIZE.y) - 1; row >= 0; row--) {
      let ownDepth = textureLoad(terrainDensity, vec3<i32>(i32(id.x), row, i32(id.z)), 0).r * pitch;
      columnSkyDepth[local.x][row] = skyDepth + .5 * ownDepth;
      skyDepth += ownDepth;
    }
  }
  workgroupBarrier();
  if (any(id >= TERRAIN_LIGHT_SIZE)) { return; }

  let sky = exp(-1.05 * columnSkyDepth[local.x][local.y]);
  let direct = sunThroughDensity(id, thickness, scene.sunlight.xyz);
  let horizon = textureLoad(terrainHorizon, vec2<i32>(id.xz), 0).rg;
  let bottom = cloudCenter() + range.x * thickness;
  let height = bottom + (f32(id.y) + .5) * pitch;
  let terrainVisibility = terrainSunAt(horizon, height);
  textureStore(terrainLightOut, vec3<i32>(id), vec4<f32>(direct, sky, terrainVisibility, 0.0));
}

struct TerrainHaze {
  heights: vec2<f32>,
  ambient: vec3<f32>,
  direct: vec3<f32>,
  extinction: f32,
}

fn terrainHaze(thickness: f32, sun: vec3<f32>, solar: vec3<f32>, ray: vec3<f32>, directSun: f32) -> TerrainHaze {
  let heights = vec2<f32>(cloudCenter()) + cloudVerticalRange() * thickness + vec2<f32>(-.78, .58);
  let dusk = 1.0 - smoothstep(.085, .50, sun.y);
  let forward = max(dot(ray, sun), 0.0);
  let phase = .085 + sceneAirScatterPhase(forward);
  let ambient = sceneHazeAmbient(sun.y);
  let haze = scene.lookPost.w * (.82 + .60 * scene.lookFog.x);
  let shafts = .76 + scene.lookFog.y + scene.lookFog.z;
  let night = sceneNightAmount(sun.y);
  return TerrainHaze(heights, ambient * scene.lookSky.rgb * mix(vec3<f32>(1.0), vec3<f32>(.045, .076, .14), night),
    solar * phase * shafts * directSun, mix(.039, .078, dusk) * haze);
}

fn hazeExtinction(haze: TerrainHaze, p: vec3<f32>) -> f32 {
  let edge = max(abs(p.x), abs(p.z)) / DOMAIN;
  let coverage = 1.0 - smoothstep(.36, .50, edge);
  let bottom = smoothstep(haze.heights.x, haze.heights.x + .43, p.y);
  let upper = 1.0 - smoothstep(cloudCenter(), haze.heights.y, p.y);
  return haze.extinction * coverage * bottom * upper;
}

fn hazeLighting(haze: TerrainHaze, visibility: f32) -> vec3<f32> {
  return haze.ambient + haze.direct * visibility;
}

// Between cloud banks, trace the clear air on its own coarser grid. Use
// the same sun-facing cloud cache and sample the ridge at the actual height.
fn marchClearHaze(origin: vec3<f32>, ray: vec3<f32>, sun: vec3<f32>, thickness: f32,
    interval: vec2<f32>, jiggle: f32, haze: TerrainHaze) -> vec4<f32> {
  if (interval.y <= interval.x) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }
  let length = interval.y - interval.x;
  let steps = u32(clamp(ceil(length / .48), 2.0, 24.0));
  let stride = length / f32(steps);
  var sum = vec3<f32>(0.0);
  var remaining = 1.0;
  for (var i = 0u; i < steps; i++) {
    let p = origin + ray * (interval.x + (f32(i) + jiggle) * stride);
    let density = hazeExtinction(haze, p);
    if (density < .0005) { continue; }
    let sunTerrain = terrainSunAt(terrainHorizonAt(p.xz), p.y);
    var visibility = 0.0;
    if (sunTerrain > .001) {
      visibility = sunTerrain * sunlightThroughCloud(p, sun, thickness, true);
    }
    let alpha = 1.0 - exp(-density * stride);
    sum += hazeLighting(haze, visibility) * (alpha * remaining);
    remaining *= 1.0 - alpha;
  }
  return vec4<f32>(sum, remaining);
}

fn tonemap(color: vec3<f32>) -> vec3<f32> {
  return sceneDisplay(color, scene.lookPost.x * scene.lookPost.z, scene.lookPost.y);
}

// Discrete circulation at a staggered-grid vertex. The projected faces
// that drive the moisture also drive these arrows and signed curl colors.
fn vertexCurl(p: vec2<i32>) -> f32 {
  let v = velocity[index(p)];
  let eastFace = velocity[index(p + vec2<i32>(1, 0))].y;
  let northFace = velocity[index(p + vec2<i32>(0, 1))].x;
  return eastFace - v.y - (northFace - v.x);
}

fn centeredFlow(p: vec2<i32>) -> vec2<f32> {
  let lowX = velocity[index(p - vec2<i32>(1, 0))].x;
  let lowZ = velocity[index(p - vec2<i32>(0, 1))].y;
  return 0.5 * (velocity[index(p)] + vec2<f32>(lowX, lowZ));
}

fn segmentDistance(p: vec2<f32>, start: vec2<f32>, end: vec2<f32>) -> f32 {
  let line = end - start;
  let along = clamp(dot(p - start, line) / max(dot(line, line), 0.000001), 0.0, 1.0);
  return length(p - start - line * along);
}

fn flowDisplay(world: vec2<f32>) -> vec3<f32> {
  let extent = max(abs(world.x), abs(world.y));
  let edge = extent - DOMAIN * .5;
  let pixelWidth = 2.0 * scene.view.y / scene.sizeTime.y;
  let backdrop = vec3<f32>(0.031, 0.052, 0.083);
  if (edge > pixelWidth * 2.0) { return backdrop; }

  let grid = (world / DOMAIN + 0.5) * f32(GRID);
  let vertex = grid - 1.0;
  let c = vec2<i32>(floor(vertex));
  let f = fract(vertex);
  let low = mix(vertexCurl(c), vertexCurl(c + vec2<i32>(1, 0)), f.x);
  let high = mix(vertexCurl(c + vec2<i32>(0, 1)), vertexCurl(c + vec2<i32>(1, 1)), f.x);
  let curl = mix(low, high, f.y);
  let curlInk = select(vec3<f32>(0.15, 0.65, 0.93), vec3<f32>(1.0, 0.47, 0.24), curl >= 0.0);
  let curlStrength = 1.0 - exp(-abs(curl) * 0.55);
  let cloud = columnDensity(world);
  var color = mix(vec3<f32>(0.063, 0.102, 0.153), vec3<f32>(0.215, 0.274, 0.327), cloud * 0.63);
  let gridUV = world / DOMAIN + .5;
  let margin = min(gridUV, 1.0 - gridUV);
  let reliableCurl = select(1.0, smoothstep(.046, .10, min(margin.x, margin.y)), fluidTerrainActive());
  color = mix(color, curlInk, curlStrength * reliableCurl * 0.80);

  // Fixed world anchors make arrows easy to follow as the field moves.
  let spacing = 0.84;
  let anchor = (floor(world / spacing) + 0.5) * spacing;
  let anchorGrid = vec2<i32>(floor((anchor / DOMAIN + 0.5) * f32(GRID)));
  let v = centeredFlow(anchorGrid);
  let speed = length(v) * DOMAIN / f32(GRID);
  let direction = v / max(length(v), 0.0001);
  let arrowLength = 0.62 * (1.0 - exp(-speed * 0.72));
  let offset = world - anchor;
  let tail = -direction * arrowLength * 0.50;
  let tip = direction * arrowLength * 0.50;
  let head = tip - direction * min(arrowLength * 0.44, 0.115);
  let wing = vec2<f32>(-direction.y, direction.x) * min(arrowLength * 0.26, 0.056);
  let distance = min(segmentDistance(offset, tail, tip),
    min(segmentDistance(offset, head + wing, tip), segmentDistance(offset, head - wing, tip)));
  let line = (1.0 - smoothstep(pixelWidth * 0.45, pixelWidth * 1.35, distance))
    * smoothstep(0.12, 0.60, speed);
  let border = 1.0 - smoothstep(0.0, pixelWidth * 1.8, abs(edge));
  color = mix(color, vec3<f32>(0.78, 0.89, 0.94), line * 0.68);
  color = mix(backdrop, color, 1.0 - smoothstep(-pixelWidth, pixelWidth, edge));
  color = mix(color, vec3<f32>(0.30, 0.43, 0.56), border * 0.46);
  if (fluidTerrainActive()) {
    let cell = clamp(vec2<i32>(floor(grid)), vec2<i32>(0), vec2<i32>(i32(GRID) - 1));
    let terrain = terrainField[index(cell)];
    let hills = smoothstep(.02, max(.35, scene.region.z), terrain.x) * terrain.y;
    let ridge = terrain.x >= scene.region.z && terrain.y > .80;
    color = mix(color, vec3<f32>(.21, .21, .17), hills * .33);
    color = mix(color, vec3<f32>(.34, .30, .24), select(0.0, .88, ridge));
    let selection = 1.0 - smoothstep(0.0, pixelWidth, abs(extent - DOMAIN * MAP_FRACTION * .5));
    return mix(color, vec3<f32>(.59, .70, .77), selection * .32);
  }
  for (var i = 0u; i < 3u; i++) {
    let object = scene.obstacles[i];
    let kind = u32(object.w);
    let delta = world - object.xy;
    if (length(delta) > object.z * footprintBoundScale(kind) + pixelWidth * 3.0) { continue; }
    let r = footprintDistance(delta, object.z, kind, scene.axes[i].xy);
    let fill = 1.0 - smoothstep(-pixelWidth, pixelWidth, r);
    let rim = 1.0 - smoothstep(pixelWidth * 1.05, pixelWidth * 2.3, abs(r));
    let tint = buoyColor(i) * select(0.82, 1.12, f32(i) == scene.view.z);
    color = mix(color, vec3<f32>(0.027, 0.048, 0.075), fill);
    color = mix(color, min(tint + 0.08, vec3<f32>(1.0)), rim);
  }
  return color;
}

struct TerrainPoint {
  @builtin(position) clip: vec4<f32>,
  @location(0) world: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) albedo: vec3<f32>,
  @location(3) shore: vec3<f32>,
  @location(4) baseHeight: f32,
}
alias TerrainVertex = TerrainPoint;

fn region_refinement_frame() -> RegionRefinementFrame {
  return RegionRefinementFrame(scene.rockUp.xyz, scene.rockUp.w, scene.rockEast.xyz, scene.rockEast.w,
    scene.rockSouth.xyz, scene.rockSouth.w, seaLevel, scene.sunlight.w, scene.terrainLOD.x,
    bitcast<u32>(scene.material.w), select(0u, 1u, scene.region.w > -1e5), scene.rock);
}

struct TerrainHeightPoint {
  @builtin(position) clip: vec4<f32>,
  @location(0) height: f32,
}

override terrainHeightWidth: f32 = DOMAIN;

@vertex fn terrainHeightVertex(@location(0) p: vec3<f32>) -> TerrainHeightPoint {
  let scale = 2.0 / terrainHeightWidth;
  return TerrainHeightPoint(vec4<f32>(p.x * scale, -p.z * scale, 0.0, 1.0), p.y);
}

@fragment fn terrainHeightFragment(v: TerrainHeightPoint) -> @location(0) vec4<f32> {
  return vec4<f32>(v.height, 1.0, 0.0, 0.0);
}

@vertex fn terrainVertex(@location(0) p: vec3<f32>, @location(1) n: vec3<f32>,
    @location(2) materialColor: vec4<f32>) -> TerrainPoint {
  return terrain_vertex(p, vec3<f32>(n.x, min(abs(n.y), 1.0), n.z), vec4<f32>(pow(materialColor.rgb, vec3<f32>(2.2)), materialColor.a),
    vec3<f32>(select(0.0, 1.0, n.y < 0.0), 0.0, 0.0), p.y);
}

fn terrain_vertex(p: vec3<f32>, n: vec3<f32>, color: vec4<f32>, shore: vec3<f32>, baseHeight: f32) -> TerrainVertex {
  let eye = p - scene.position.xyz;
  let z = dot(eye, scene.forward.xyz);
  let aspect = scene.sizeTime.x / scene.sizeTime.y;
  let xy = vec2<f32>(dot(eye, scene.right.xyz) / aspect, dot(eye, scene.up.xyz));
  let ortho = scene.view.y > 0.0;
  let near = clamp(1.25 / max(scene.rockEast.w, 1.0), .00004, .007);
  let projected = select(vec4<f32>(xy / scene.view.x, near, z),
    vec4<f32>(xy / max(.001, scene.view.y), 1.0 - (z - near) / 480.0, 1.0), ortho);
  let normal = normalize(n);
  let ground = mix(vec3<f32>(.16, .21, .105), vec3<f32>(.27, .235, .195), 1.0 - normal.y);
  let albedo = mix(ground, color.rgb, color.a);
  return TerrainPoint(projected, p, normal, albedo, shore, baseHeight);
}

const opaqueTerrainWater = .96;

struct TerrainRaster {
  @location(0) surface: vec4<f32>,
  @location(1) water: f32,
}

@fragment fn terrainFragment(v: TerrainPoint) -> TerrainRaster {
  let eye = v.world - scene.position.xyz;
  let distance = select(length(eye), dot(eye, scene.forward.xyz), scene.view.y > 0.0);
  let footprint = max(length(dpdx(v.world)), length(dpdy(v.world))) * scene.rockEast.w;
  let waterCoverage = region_shore_coverage(v.shore);
  // Ocean shading replaces the land color above this cutoff. Leave an R8
  // quantization step of headroom and still write the distance.
  if (waterCoverage >= opaqueTerrainWater + 1.0 / 255.0) {
    return TerrainRaster(vec4<f32>(0.0, 0.0, 0.0, distance), waterCoverage);
  }
  let sun = scene.sunlight.xyz;
  let direct = landSunVisibility(v.world, v.normal) * fluidDirectSun(sun.y);
  var color = v.albedo * (vec3<f32>(.36, .41, .47) + solarColor(sun) * max(dot(v.normal, sun), 0.0) * (.79 * direct));
  if (scene.rockUp.w > 0.0 && waterCoverage < opaqueTerrainWater) {
    let baseHeight = v.baseHeight - seaLevel;
    let point = v.world - vec3<f32>(0.0, seaLevel, 0.0);
    let skyHalf = DOMAIN * MAP_FRACTION * .625;
    let skyUV = point.xz / (2.0 * skyHalf) + .5;
    let margin = min(skyUV, 1.0 - skyUV);
    let coverage = smoothstep(0.0, .085, min(margin.x, margin.y));
    let bakedSky = textureSampleLevel(regionSkylight, materialSampler, skyUV, 0.0).r;
    let frame = RegionMaterialFrame(scene.rockUp.xyz, scene.rockUp.w, scene.rockEast.xyz,
      scene.rockEast.w, scene.rockSouth.xyz, scene.sunlight.w, scene.terrainLOD.x,
      bitcast<u32>(scene.material.w), u32(scene.region.w > -1e5), skyHalf, scene.rock);
    color = region_land_color(point, baseHeight, v.normal, v.albedo, sun, direct,
      mix(1.0, bakedSky, coverage), footprint, frame);
  }
  return TerrainRaster(vec4<f32>(color, distance), waterCoverage);
}

fn regionOceanDistance(origin: vec3<f32>, ray: vec3<f32>) -> f32 {
  let sea = scene.region.w;
  let radius = scene.terrainLOD.y;
  if (sea < -1e5 || radius <= 0.0) { return farDistance; }
  let above = origin.y - sea;
  let b = dot(origin.xz, ray.xz) + (radius + above) * ray.y;
  let c = dot(origin.xz, origin.xz) + above * (2.0 * radius + above);
  let discriminant = b * b - c;
  if (discriminant < 0.0) { return farDistance; }
  let far = sqrt(discriminant) - b;
  if (far <= 0.0) { return farDistance; }
  return select(c / far, far, c <= 0.0);
}

struct SceneRay {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

fn sceneRay(pixel: vec2<f32>) -> SceneRay {
  let dims = scene.sizeTime.xy;
  let screen = (pixel / dims * vec2<f32>(2.0, -2.0) + vec2<f32>(-1.0, 1.0)) * vec2<f32>(dims.x / dims.y, 1.0);
  let offset = scene.right.xyz * screen.x + scene.up.xyz * screen.y;
  let orthographic = scene.view.y > 0.0;
  let origin = scene.position.xyz + offset * scene.view.y;
  let ray = select(normalize(scene.forward.xyz + offset * scene.view.x), scene.forward.xyz, orthographic);
  return SceneRay(origin, ray);
}

@fragment
fn flowFragment(@builtin(position) pixel: vec4<f32>) -> @location(0) vec4<f32> {
  let view = sceneRay(pixel.xy);
  let plane = view.origin + view.direction * ((cloudCenter() - view.origin.y) / min(view.direction.y, -0.000001));
  return vec4<f32>(flowDisplay(plane.xz), 1.0);
}

@fragment
fn fragmentMain(@builtin(position) pixel: vec4<f32>) -> @location(0) vec4<f32> {
  let view = sceneRay(pixel.xy);
  let origin = view.origin;
  let ray = view.direction;
  let sun = scene.sunlight.xyz;
  let solar = solarColor(sun);
  let directSun = fluidDirectSun(sun.y);
  let terrainMode = fluidTerrainActive();
  var nearest = farDistance;
  let night = sceneNightAmount(sun.y);
  let pixelAngle = max(length(dpdx(ray)), length(dpdy(ray)));
  var surface = sky(ray, sun, solar, night, true);
  if (terrainMode) {
    let cell = vec2<i32>(pixel.xy);
    let terrain = textureLoad(terrainSurface, cell, 0);
    let distance = terrain.a;
    if (distance > 0.0) {
      nearest = distance;
      let position = origin + ray * distance;
      let water = smoothstep(.02, opaqueTerrainWater, textureLoad(terrainWater, cell, 0).r);
      if (water > 0.0) { surface = ocean(position, ray, distance, sun, solar); }
      if (water < 1.0) {
        let shade = mix(1.0, sunlightThroughCloud(position, sun, scene.sizeTime.w, true), directSun);
        let hazeDirection = normalize(vec3<f32>(ray.x, .13, ray.z));
        let distanceFog = 1.0 - exp(-distance * .006 * scene.lookPost.w);
        let gradeTint = mix(scene.lookSky.rgb, scene.lookSun.rgb, clamp(shade, .35, .90));
        let nightLight = mix(vec3<f32>(1.0), vec3<f32>(.12, .20, .37), night);
        let land = mix(terrain.rgb * (.65 + .35 * shade) * gradeTint * nightLight,
          sky(hazeDirection, sun, solar, night, false) * .83, distanceFog);
        surface = mix(land, surface, water);
      }
    } else {
      nearest = regionOceanDistance(origin, ray);
      if (nearest < farDistance) { surface = ocean(origin + ray * nearest, ray, nearest, sun, solar); }
    }
  } else {
    if (ray.y < -.000001) {
      let ground = (seaLevel - origin.y) / ray.y;
      if (ground > 0.0 && ground < farDistance) {
        nearest = ground;
        surface = ocean(origin + ray * ground, ray, ground, sun, solar);
      }
    }
    for (var i = 0u; i < 3u; i++) {
      let object = scene.obstacles[i];
      let hit = obstacleHit(origin, ray, object, scene.axes[i].xy, obstacleTop(i));
      if (hit.w < nearest) {
        nearest = hit.w;
        surface = objectLight(origin + ray * nearest, ray, hit.xyz, object, i, sun, solar, directSun)
          * mix(vec3<f32>(1.0), vec3<f32>(.12, .20, .37), night);
      }
    }
  }

  var stars = vec3<f32>(0.0);
  if (night > 0.0 && nearest >= farDistance && scene.view.y <= 0.0) {
    stars = sceneNightStars(ray, ray.y, pixelAngle, scene.sizeTime.z) * night;
  }

  let thickness = scene.sizeTime.w;
  let span = cloudBounds(origin, ray, thickness);
  let end = min(span.y, nearest);
  let visibleCloud = end > span.x;
  let jitter = .32 + .36 * oceanHash3(vec3<f32>(pixel.xy, 1.0));
  var haze: TerrainHaze;
  var hazeSpan = vec2<f32>(0.0);
  var front = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  if (terrainMode) {
    haze = terrainHaze(thickness, sun, solar, ray, directSun);
    let bounds = layerBounds(origin, ray, haze.heights);
    hazeSpan = vec2<f32>(bounds.x, min(bounds.y, nearest));
    let frontEnd = select(hazeSpan.y, min(hazeSpan.y, span.x), visibleCloud);
    front = marchClearHaze(origin, ray, sun, thickness, vec2<f32>(hazeSpan.x, frontEnd), jitter, haze);
  }
  if (!visibleCloud) {
    return vec4<f32>(tonemap(front.rgb + (surface + stars * front.a) * front.a), 1.0);
  }
  let length = end - span.x;
  let liveCount = u32(clamp(ceil(length / .073), 12.0, 92.0));
  let count = liveCount * u32(max(1.0, scene.lookFog.w));
  let stepSize = length / f32(count);
  // Integrate the same volume more closely without changing its detail
  // or crest shape when the paused frame settles.
  let detailStep = length / f32(liveCount);
  let resolvedDetail = 1.0 - smoothstep(0.11, 0.25, detailStep);
  let sunward = max(dot(ray, sun), 0.0);
  let light = sceneCloudLighting(sun.y, sunward);
  let response = vec3<f32>((scene.lookSun.w / .65) * (scene.lookFront.w / .85),
    1.0 / max(.75, scene.lookShadow.w / 1.5), .9 + scene.lookTransmission.w);
  var transmittance = front.a;
  var radiance = front.rgb;

  for (var i = 0u; i < count; i++) {
    let p = origin + ray * (span.x + (f32(i) + jitter) * stepSize);
    let density = cloudDensity(p, thickness, detailStep, resolvedDetail);
    var air = 0.0;
    if (terrainMode) { air = hazeExtinction(haze, p); }
    let extinction = density + air;
    if (extinction < .0005 || (!terrainMode && density < .012)) { continue; }

    var illumination: f32;
    var skyVisibility = 1.0;
    var emitted = vec3<f32>(0.0);
    if (terrainMode) {
      let light = textureSampleLevel(terrainCloudLight, materialSampler, terrainVolumeUV(p, thickness), 0.0).rgb;
      illumination = light.x * light.z;
      skyVisibility = light.y;
      emitted = hazeLighting(haze, illumination) * air;
    } else {
      illumination = sunlightThroughCloud(p, sun, thickness, false);
    }
    if (density >= .012) {
      let height = (p.y - cloudCenter()) / thickness;
      let exposure = select(smoothstep(-.29, .36, height), skyVisibility, terrainMode);
      let edge = 1.0 - smoothstep(.10, .72, density / 5.05);
      let lit = sceneCloudRadiance(light, solar, illumination * directSun, exposure, edge, terrainMode,
        scene.lookFront.rgb, scene.lookShadow.rgb, scene.lookTransmission.rgb, response);
      let nightFill = vec3<f32>(.009, .018, .038) * mix(.57, 1.28, exposure);
      emitted += mix(lit, nightFill, night) * density;
    }
    let alpha = 1.0 - exp(-extinction * stepSize);
    radiance += emitted * (alpha * transmittance / extinction);
    transmittance *= 1.0 - alpha;
    if (transmittance < .013) { break; }
  }
  if (terrainMode && transmittance >= .013 && end < hazeSpan.y) {
    let tail = marchClearHaze(origin, ray, sun, thickness, vec2<f32>(max(hazeSpan.x, end), hazeSpan.y), jitter, haze);
    radiance += tail.rgb * transmittance;
    transmittance *= tail.a;
  }
  return vec4<f32>(tonemap(radiance + (surface + stars * transmittance) * transmittance), 1.0);
}
