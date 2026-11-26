// ---------------------- Main compute

fn initCloudWorkgroup(local_id: vec3<u32>) {
  // workgroup cache
  if (all(local_id == vec3<u32>(0u))) {
    let wd = textureDimensions(weather2D, 0);
    wg_weatherDim = vec2<f32>(f32(wd.x), f32(wd.y));
    let weatherEp = vec2<f32>(0.5 / max(wg_weatherDim.x, 1.0), 0.5 / max(wg_weatherDim.y, 1.0));
    wg_weatherUvMul = vec2<f32>(1.0, 1.0) - 2.0 * weatherEp;
    wg_weatherUvAdd = weatherEp;

    let bd = textureDimensions(blueTex, 0);
    wg_blueDim = vec2<f32>(f32(bd.x), f32(bd.y));

    let sd = textureDimensions(shape3D);
    wg_shapeDim = vec3<f32>(f32(sd.x), f32(sd.y), f32(sd.z));
    let shapeEp = vec3<f32>(
      0.5 / max(wg_shapeDim.x, 1.0),
      0.5 / max(wg_shapeDim.y, 1.0),
      0.5 / max(wg_shapeDim.z, 1.0)
    );
    wg_shapeUvMul = vec3<f32>(1.0, 1.0, 1.0) - 2.0 * shapeEp;
    wg_shapeUvAdd = shapeEp;

    let dd = textureDimensions(detail3D);
    wg_detailDim = vec3<f32>(f32(dd.x), f32(dd.y), f32(dd.z));
    let detailEp = vec3<f32>(
      0.5 / max(wg_detailDim.x, 1.0),
      0.5 / max(wg_detailDim.y, 1.0),
      0.5 / max(wg_detailDim.z, 1.0)
    );
    wg_detailUvMul = vec3<f32>(1.0, 1.0, 1.0) - 2.0 * detailEp;
    wg_detailUvAdd = detailEp;

    wg_maxMipW = f32(textureNumLevels(weather2D)) - 1.0;
    wg_maxMipS = f32(textureNumLevels(shape3D)) - 1.0;
    wg_maxMipD = f32(textureNumLevels(detail3D)) - 1.0;

    let scaleS_local = max(V.worldToUV * B.uvScale, EPS);
    wg_scaleS = scaleS_local;
    wg_scaleD = max(scaleS_local * (128.0 / 32.0), EPS);

    let sAxis = axisOrOne3(NTransform.shapeAxisScale);
    let dAxis = axisOrOne3(NTransform.detailAxisScale);

    let sMul = select(NTransform.shapeScale, 1.0, NTransform.shapeScale == 0.0);
    let dMul = select(NTransform.detailScale, 1.0, NTransform.detailScale == 0.0);

    wg_scaleS_effMax = wg_scaleS * max(sMul, EPS) * axisMaxAbs3(sAxis);
    wg_scaleD_effMax = wg_scaleD * max(dMul, EPS) * axisMaxAbs3(dAxis);

    wg_finestWorld = min(1.0 / wg_scaleS_effMax, 1.0 / wg_scaleD_effMax) * 0.6;

    // Keep jitter/warp amplitude and the homogeneous vertical profile at the
    // original local-cloud scale even when the horizon box tiles outward.
    let rawBoxMaxXZ = max(max(B.half.x, B.half.z), 1.0);
    wg_boxMaxXZ = min(rawBoxMaxXZ, 1.0);
    wg_tallBlend = saturate(remap(B.half.y, 0.34, 1.60, 0.0, 1.0));
    wg_thickPerfStrength = saturate(remap(B.half.y, 0.36, 2.40, 0.0, 1.0)) * clamp(TUNE.thickBoxPerf, 0.0, 2.0);

    wg_verticalHomogeneity = saturate(TUNE.verticalTextureHomogeneity);
    let baseHalfY = max(B.half.y, EPS);
    let refHalfY = clamp(wg_boxMaxXZ, 0.35, 1.25);
    wg_verticalRefHalfY = mix_f(baseHalfY, min(baseHalfY, refHalfY), wg_verticalHomogeneity);
    wg_verticalRefBoxH = max(wg_verticalRefHalfY * 2.0, EPS);
    let yTileTarget = rawBoxMaxXZ / max(wg_verticalRefBoxH * 2.75, 0.25);
    wg_verticalDomainScale = mix_f(1.0, clamp(yTileTarget, 1.0, 9.0), wg_verticalHomogeneity);
    wg_weatherAxisYAbs = max(abs(axisOrOne3(NTransform.weatherAxisScale).y), EPS);
    wg_boxMinCached = B.center - B.half;
    wg_boxMaxCached = B.center + B.half;
    if (CLOUD_USE_FIELDS == 0u) { wg_boxMaxCached.y += anvilLiftWorld(); }
  }
  workgroupBarrier();
}


fn storeRoundedSample(pix: vec2<i32>, color: vec4<f32>, farHistory: f32) {
  if (color.a <= 0.000001 && CLOUD_WRITE_RGB != 0u) {
    textureStore(outTex, pix, frame.layerIndex, vec4<f32>(0.0));
    store_history_full_res_if_owner(pix, frame.layerIndex, vec4<f32>(0.0));
    if (CLOUD_STAGED_RESOLVE != 0u) {
      let index = (u32(frame.layerIndex) * frame.fullHeight + u32(pix.y)) * frame.fullWidth + u32(pix.x);
      cloudResolveSamples[index].valid = 0u;
    }
    return;
  }
  if (CLOUD_STAGED_RESOLVE != 0u) {
    let index = (u32(frame.layerIndex) * frame.fullHeight + u32(pix.y)) * frame.fullWidth + u32(pix.x);
    cloudResolveSamples[index].color = color;
    cloudResolveSamples[index].farHistory = farHistory;
    cloudResolveSamples[index].valid = 1u;
  } else {
    let historyActive = reproj.enabled == 1u || temporalCellRateNormalized() > 1u || reproj.temporalBlend > 0.0001;
    resolveCloudColor(pix, color, farHistory, historyActive);
  }
}

// Rounded forms read shared fields; optional edge detail needs just two tiled
// noise reads near the visible surface, without a secondary sun march.
// Stable world-space density and fixed pixel jitter also work with sparse TAA.
fn cloudRayJitter(pix:vec2<u32>) -> f32 {
  // Integer avalanche avoids the diagonal correlation of scalar sin/fract
  // hashes and structured noise maps. Stable per pixel, with no frame flicker
  // or extra texture fetch. This only applies to the cached-volume ray path.
  var h=(pix.x*0x9e3779b9u) ^ (pix.y*0x85ebca6bu) ^ 0x68bc21ebu;
  h=(h ^ (h >> 16u))*0x7feb352du;
  h=(h ^ (h >> 15u))*0x846ca68bu;
  h=h ^ (h >> 16u);
  return f32(h >> 8u)*(1.0/16777216.0);
}

// Reuse the periodic noise tiles as a continuous material-space deformation.
// These coordinates are shared by density and lighting; the bake stays regular.
fn cachedDomainStrength() -> f32 {
  return select(0.0,clamp(FIELD.morphology.w,0.0,1.5),FIELD.volume.x<0.5);
}
struct CachedDomainWarp {
  strength: f32,
  shapeLod: i32,
  detailLod: i32,
  shapeScale: f32,
  detailScale: f32,
  shapeRate: vec3<f32>,
  detailRate: vec3<f32>,
  shapeAmplitude: vec3<f32>,
  detailAmplitude: vec3<f32>,
}

fn prepareCachedDomainWarp(spacing: vec3<f32>) -> CachedDomainWarp {
  var warp: CachedDomainWarp;
  warp.strength = cachedDomainStrength();
  if (warp.strength == 0.0) { return warp; }

  // Bound each displacement Jacobian row before applying strength. A filtered
  // [0,1] noise texel can change by at most its coordinate rate; mapping it to
  // [-1,1] doubles that bound. Include the vertical boundary fade's derivative.
  // The rates and amplitudes are the same for every sample along a ray.
  let fadeRate = vec3<f32>(0.0, 12.5 / FIELD.gridSize.y, 0.0);
  if (fieldIsTiled()) {
    let span = max(FIELD.gridSize.x, FIELD.gridSize.z) * 4.7;
    warp.shapeLod = max(i32(textureNumLevels(shape3D)) - 4, 0);
    warp.shapeScale = 1.0 / span;
    warp.shapeRate = vec3<f32>(textureDimensions(shape3D, warp.shapeLod)) / span;
    let broad = FIELD.gridSize.xyz * vec3<f32>(0.40, 0.12, 0.40);
    let bound = vec3<f32>(2.0 * dot(warp.shapeRate, vec3<f32>(1.0))) + fadeRate;
    warp.shapeAmplitude = min(broad, vec3<f32>(0.25) / bound) * warp.strength;
  }
  warp.detailLod = max(i32(textureNumLevels(detail3D)) - 4, 0);
  warp.detailScale = 0.22 / max(TUNE.puffScale, 0.75);
  warp.detailRate = vec3<f32>(textureDimensions(detail3D, warp.detailLod)) * warp.detailScale;
  let bound = vec3<f32>(2.0 * dot(warp.detailRate, vec3<f32>(1.0))) + fadeRate;
  warp.detailAmplitude = min(spacing * vec3<f32>(1.25, 1.8, 1.25), vec3<f32>(0.15) / bound) * warp.strength;
  return warp;
}

fn cachedDomainPosition(worldP: vec3<f32>, warp: CachedDomainWarp) -> vec3<f32> {
  var p=worldP;
  if((CLOUD_FROZEN_PATTERN!=0u && FIELD.patternMotion.w>0.5)){
    let repeat=max(FIELD.patternStyle.x,0.25);
    p=FIELD.gridMin.xyz+FIELD.gridSize.xyz*0.5+(worldP-B.center)/vec3<f32>(repeat,1.0,repeat)+FIELD.patternMotion.xyz;
  }
  if (warp.strength < 0.001) { return p; }
  var noiseP=p;
  if(CLOUD_FROZEN_PATTERN!=0u){
    noiseP.x=FIELD.gridMin.x+fract((p.x-FIELD.gridMin.x)/FIELD.gridSize.x)*FIELD.gridSize.x;
    noiseP.z=FIELD.gridMin.z+fract((p.z-FIELD.gridMin.z)/FIELD.gridSize.z)*FIELD.gridSize.z;
  }
  var displacement = vec3<f32>(0.0);
  if (fieldIsTiled()) {
    let noise = textureSampleLevel(shape3D, sampShape, (noiseP + NTransform.shapeOffsetWorld)
      * warp.shapeScale + vec3<f32>(0.17, 0.39, 0.61), f32(warp.shapeLod)).gbr;
    displacement += clamp(noise * 2.0 - 1.0, vec3<f32>(-1.0), vec3<f32>(1.0)) * warp.shapeAmplitude;
  }
  let noise = textureSampleLevel(detail3D, sampDetail,
    (noiseP + NTransform.detailOffsetWorld) * warp.detailScale, f32(warp.detailLod)).brg;
  displacement += clamp(noise * 2.0 - 1.0, vec3<f32>(-1.0), vec3<f32>(1.0)) * warp.detailAmplitude;
  // Fade vertical displacement before the volume boundary, preserving its halo.
  let ph=clamp((p.y-FIELD.gridMin.y)/FIELD.gridSize.y,0.0,1.0);
  displacement.y*=smoothstep(0.0,0.12,ph)*(1.0-smoothstep(0.88,1.0,ph));
  return p+displacement;
}
// Bound the deformed interval using the maximum slope of filtered noise texels.
// Empty-space queries include cubic support and cannot jump warped cloud edges.
fn cachedDomainSkipFootprint(length:f32,rd:vec3<f32>,spacing:vec3<f32>,warp:CachedDomainWarp)->f32 {
  let metricRd=rd/select(vec3<f32>(1.0),vec3<f32>(max(FIELD.patternStyle.x,0.25),1.0,max(FIELD.patternStyle.x,0.25)),(CLOUD_FROZEN_PATTERN!=0u && FIELD.patternMotion.w>0.5));
  let broadDelta=select(min(2.0,3.0*length*dot(abs(metricRd),warp.shapeRate)),2.0,CLOUD_FROZEN_PATTERN!=0u);
  let fineDelta=select(min(2.0,3.0*length*dot(abs(metricRd),warp.detailRate)),2.0,CLOUD_FROZEN_PATTERN!=0u);
  var extent=warp.shapeAmplitude*broadDelta+warp.detailAmplitude*fineDelta;
  extent.y+=(warp.shapeAmplitude.y+warp.detailAmplitude.y)*min(2.0,12.5*length*abs(metricRd.y)/FIELD.gridSize.y);
  let cells=(abs(metricRd)*length+extent*2.0)/spacing;
  return max(max(cells.x,cells.y),cells.z)+4.0;
}
// Positive cubic B-spline reconstruction uses eight hardware trilinear reads.
// Unlike a sharp interpolator, it cannot create negative density or bright halos.
fn cachedCubicSample(tex:texture_3d<f32>,uv:vec3<f32>)->vec4<f32> {
  let dims=vec3<f32>(textureDimensions(tex));
  let coord=uv*dims-0.5;
  let cell=floor(coord);
  let f=fract(coord);
  let w0=(1.0-f)*(1.0-f)*(1.0-f)/6.0;
  let w1=(3.0*f*f*f-6.0*f*f+4.0)/6.0;
  let w2=(-3.0*f*f*f+3.0*f*f+3.0*f+1.0)/6.0;
  let w3=f*f*f/6.0;
  let g0=w0+w1;
  let g1=w2+w3;
  let a=(cell-1.0+w1/g0+0.5)/dims;
  let b=(cell+1.0+w3/g1+0.5)/dims;
  var result=vec4<f32>(0.0);
  for(var z=0u;z<2u;z++){for(var y=0u;y<2u;y++){for(var x=0u;x<2u;x++){
    let at=vec3<f32>(select(a.x,b.x,x==1u),select(a.y,b.y,y==1u),select(a.z,b.z,z==1u));
    let weight=select(g0.x,g1.x,x==1u)*select(g0.y,g1.y,y==1u)*select(g0.z,g1.z,z==1u);
    result+=textureSampleLevel(tex,cloudFieldSampler,at,0.0)*weight;
  }}}
  return result;
}
fn cachedVisibleSample(tex:texture_3d<f32>,uv:vec3<f32>,lod:f32)->vec4<f32> {
  if(flatFormType()>8.5 && flatFormType()<9.5 && lod<1.0){
    return mix(cachedCubicSample(tex,uv),textureSampleLevel(tex,cloudFieldSampler,uv,1.0),lod);
  }
  return textureSampleLevel(tex,cloudFieldSampler,uv,lod);
}

fn turbulentCloudSample(p:vec3<f32>, density:vec4<f32>, footprint:f32, sunDir:vec3<f32>,
  family:u32, localBank:bool, localAnvil:bool) -> vec3<f32> {
  let base = max(density.r, 0.0);
  let amount = clamp(FIELD.morphology.w, 0.0, 1.5);
  // Empty space and dense interiors retain the cheap cached path. Subtractive
  // erosion cannot fill empty sky, expand a mask, or expose an unlit outer halo.
  let marine = marineCumulusForm();
  let squall = flatFormType() == 1.375 && CLOUD_FROZEN_PATTERN == 0u;
  let billows = family == VOLUME_BILLOWS && flatFormType() > 0.5 && CLOUD_FROZEN_PATTERN == 0u;
  let puff = max(TUNE.puffScale, 0.75);
  let bankDepth = select(clamp(puff * 0.082, 0.22, 0.93), clamp(puff * 0.12, 0.38, 1.6), localBank);
  let rollDepth = select(bankDepth, clamp(puff * 0.158, 0.47, 2.1), localAnvil);
  let shoulder = select(1.0 - smoothstep(0.04, 0.38, density.a),
    1.0 - smoothstep(rollDepth * 0.27, rollDepth * 1.52, density.a), marine || localBank);
  let relativeFootprint = footprint / puff;
  let resolved = select(1.0 - smoothstep(0.07, 0.32, relativeFootprint),
    1.0 - smoothstep(0.052, 0.27, relativeFootprint), marine);
  // In thin cirrus, fluctus crests and morning ruffles the whole body can be
  // classified as a shoulder. Keep that scaffold instead of eroding it into
  // disconnected transparent ribbons at the strongest turbulence setting.
  let thinForm = family == VOLUME_FILAMENTS || (flatFormType() > 5.5 && flatFormType() < 6.5)
    || (flatFormType() > 7.5 && flatFormType() < 8.5);
  // The eyewall's fine spiral structure is baked into a solid body. Keep the
  // optional ray-side wisps subtle so they cannot turn it into noisy gauze.
  let eyewallDetail=select(1.0,0.22,flatFormType()>11.5 && flatFormType()<12.5);
  let strength = amount * shoulder * resolved * select(1.0,0.35,thinForm) * eyewallDetail;
  if (base < 0.0001 || strength < 0.001) { return vec3<f32>(base, 0.0, 0.0); }
  var noiseP=p;
  if(CLOUD_FROZEN_PATTERN!=0u){
    noiseP.x=FIELD.gridMin.x+fract((p.x-FIELD.gridMin.x)/FIELD.gridSize.x)*FIELD.gridSize.x;
    noiseP.z=FIELD.gridMin.z+fract((p.z-FIELD.gridMin.z)/FIELD.gridSize.z)*FIELD.gridSize.z;
  }
  if (marine || localBank || billows) {
    // Read the billow and its sunward slope. Local Planet banks keep
    // broader folds that still cover a pixel at range.
    // The wider balanced-cache intervals were filtering the shoulder
    // signal away. A medium-scale source survives those intervals; the mip
    // still tracks the actual ray footprint as it grows toward the horizon.
    let bankScale = select(select(0.52, 0.45, marine), 0.28, localBank);
    let curlScale = select(bankScale, 0.36, localAnvil) / puff;
    let curlDim = f32(textureDimensions(shape3D).x);
    let curlLod = clamp(log2(max(footprint * curlScale * curlDim, 1.0)),
      0.0, f32(textureNumLevels(shape3D) - 1u));
    let drift = mix(NTransform.shapeOffsetWorld, NTransform.detailOffsetWorld, 0.16);
    var material = noiseP + drift;
    var curlSun = sunDir;
    if (localBank) {
      material -= B.center;
      let curlXZ = rotateXZ(material.xz, 0.57);
      let sunXZ = rotateXZ(sunDir.xz, 0.57);
      material = vec3<f32>(curlXZ.x, material.y, curlXZ.y);
      curlSun = vec3<f32>(sunXZ.x, sunDir.y, sunXZ.y);
    }
    if (localAnvil) {
      // Let detail curl across the updraft. Apply the same mapping to the
      // light probe so creases still respond to the direction of the sun.
      material += vec3<f32>(material.y * 0.38, -material.x * 0.20, material.y * 0.27);
      curlSun += vec3<f32>(curlSun.y * 0.38, -curlSun.x * 0.20, curlSun.y * 0.27);
    }
    let curlAxis = select(vec3<f32>(0.89, 1.23, 0.94), vec3<f32>(1.0), localBank);
    let curlRate = select(curlScale * curlAxis, fieldPeriodicScale(curlScale * curlAxis), !marine && !localBank);
    let curlPosition = material * curlRate + vec3<f32>(0.54, 0.12, 0.37);
    let cells = textureSampleLevel(shape3D, sampShape, curlPosition, curlLod);
    let probeDistance = max(puff * select(0.062, 0.13, localBank), footprint * 0.75);
    let sunward = textureSampleLevel(shape3D, sampShape, curlPosition + curlSun * curlRate * probeDistance, curlLod);
    let blend = select(vec2<f32>(0.71, 0.29), vec2<f32>(0.57, 0.43), localAnvil);
    let localMass = dot(cells.gb, blend);
    var hollow = smoothstep(0.22, 0.68, 1.0 - localMass);
    var fineSlope = 0.0;
    var finePocket = 0.0;
    if (marine) {
      // A secondary octave eats into the exposed face between cache voxels.
      // The broader rolls determine where that fine breakup can appear.
      let fineLod = min(curlLod + 0.87, f32(textureNumLevels(shape3D) - 1u));
      let fineUV = curlPosition * 1.83 + (cells.brg - 0.5) * 0.09 + vec3<f32>(0.17, 0.58, 0.73);
      let fine = textureSampleLevel(shape3D, sampShape, fineUV, fineLod);
      let fineWeights = vec2<f32>(0.58, 0.42);
      let fineMass = dot(fine.gb, fineWeights);
      let fineHollow = smoothstep(0.24, 0.68, 1.0 - fineMass);
      let rollingShoulder = smoothstep(0.20, 0.64, hollow);
      if (squall) {
        // Retain the small recesses within each broad roll. Probe their
        // horizon-facing side in the same advected volume used for erosion.
        let openDirection = normalizeOr(vec3<f32>(curlSun.x, -0.19, curlSun.z), vec3<f32>(0.0, -0.19, 1.0));
        let fineStep = max(puff * 0.046, footprint * 0.62);
        let next = textureSampleLevel(shape3D, sampShape, fineUV + openDirection * curlRate * (1.83 * fineStep), fineLod);
        let support = rollingShoulder * (1.0 - smoothstep(0.62, 0.90, hollow));
        finePocket = (fineHollow - 0.41) * support;
        fineSlope = (fineMass - dot(next.gb, fineWeights)) * (0.49 + 0.51 * support);
      } else {
        hollow = mix(hollow, fineHollow, 0.38 * rollingShoulder);
      }
    }
    // Scale the recess in material space. Sampling through the smaller
    // hollows reveals the next layer of cloud on oblique, close views.
    let indentation = (hollow - 0.17 + finePocket * 0.87) * rollDepth;
    let recess = 1.0 - smoothstep(indentation - rollDepth * 0.18,
      indentation + rollDepth * 0.23, density.a);
    let erosion = strength * max(0.0, hollow + finePocket * 0.54)
      * (0.22 + select(0.99, 1.15, marine) * recess);
    let fineDensity = base * max(0.065, 1.0 - erosion);
    let litSlope = clamp((localMass - dot(sunward.gb, blend)) * select(2.7, 3.9, localAnvil),
      -0.70, 0.70) * strength;
    var skyRelief = (0.45 - hollow) * strength;
    if (squall) {
      skyRelief = clamp(fineSlope * 14.0 - finePocket * 1.30, -0.72, 0.72) * strength;
    }
    if (localAnvil) {
      // Shade the small folds with high-angle skylight even if the long
      // sunward path is blocked. The cached light still supplies the larger
      // shadow. Keep that shadow coherent by limiting the fine contrast.
      let skyStep = vec3<f32>(0.38 - curlSun.x * 0.27, 0.91, 0.27 - curlSun.z * 0.27);
      let skyProbe = textureSampleLevel(shape3D, sampShape,
        curlPosition + skyStep * (curlScale * probeDistance), curlLod);
      let skySlope = localMass - dot(skyProbe.gb, blend);
      skyRelief = clamp(skySlope * 5.4 + (0.45 - hollow) * 0.46, -0.60, 0.60) * strength;
    }
    return vec3<f32>(fineDensity, skyRelief, litSlope);
  }
  let dimensions = vec3<f32>(textureDimensions(detail3D));
  let axes = array<vec3<f32>, 5>(
    vec3<f32>(0.65, 1.35, 1.0), vec3<f32>(0.42, 1.13, 1.48), vec3<f32>(0.55, 1.23, 0.84),
    vec3<f32>(0.76, 1.20, 0.88), vec3<f32>(0.88, 1.11, 0.94));
  let scale = 0.90 / puff;
  let rate = fieldPeriodicScale(axes[family] * scale);
  let warpRate = fieldPeriodicScale(vec3<f32>(scale * 0.28));
  let texelRate = rate * dimensions;
  let maxRate = max(max(texelRate.x, texelRate.y), texelRate.z);
  let maxLOD = f32(textureNumLevels(detail3D) - 1u);
  let lod = clamp(log2(max(footprint * maxRate, 1.0)), 0.0, maxLOD);
  let warpLOD = clamp(lod - 1.8, 0.0, maxLOD);
  // Follow the storm's material flow and retain the stretching of thin layers.
  if (family == VOLUME_ROTATING_STORM) { noiseP = stormMaterialPosition(noiseP); }
  let q = noiseP + NTransform.detailOffsetWorld;
  let bend = textureSampleLevel(detail3D, sampDetail, q * warpRate, warpLOD).gbr - 0.5;
  let fineUV = q * rate + bend * 0.70;
  let fine = textureSampleLevel(detail3D, sampDetail, fineUV, min(lod + 0.45, maxLOD)).rgb;
  let turbulence = dot(fine, vec3<f32>(0.55, 0.30, 0.15));
  let erosion = smoothstep(0.32, 0.70, turbulence);
  return vec3<f32>(base * max(0.08, 1.0 - strength * erosion * 0.85), 0.0, 0.0);
}
// Filter along the plane only. Ordinary 3D mips also average across its normal,
// which would erase a thin selected slice as the view approaches the horizon.
fn frozenPlaneSample(tex:texture_3d<f32>,uv:vec3<f32>,axis:u32,footprint:f32)->vec4<f32> {
  let a=(axis+1u)%3u;let b=(axis+2u)%3u;
  let spacing=FIELD.gridSize.xyz/vec3<f32>(FIELD.dimensions.xyz);
  let ratio=footprint/min(spacing[a],spacing[b]);
  if(ratio<=1.0){return textureSampleLevel(tex,cloudFieldSampler,uv,0.0);}
  let width=footprint*0.5*smoothstep(1.0,2.0,ratio);
  var u=vec3<f32>(0.0);var v=vec3<f32>(0.0);
  u[a]=min(width/FIELD.gridSize[a],0.125);v[b]=min(width/FIELD.gridSize[b],0.125);
  return (textureSampleLevel(tex,cloudFieldSampler,uv-u-v,0.0)+textureSampleLevel(tex,cloudFieldSampler,uv+u-v,0.0)
    +textureSampleLevel(tex,cloudFieldSampler,uv-u+v,0.0)+textureSampleLevel(tex,cloudFieldSampler,uv+u+v,0.0))*0.25;
}
// Optional stylistic slices intersect selected fixed world planes directly,
// reusing held fields instead of marching their surrounding empty volume.
// No card geometry is used.
fn frozenPlaneClouds(ro:vec3<f32>,rd:vec3<f32>,entry:f32,exit:f32,tanY:f32)->vec4<f32> {
  let axis=u32(FIELD.pattern.x)-1u;
  let direction=rd[axis];
  if(abs(direction)<0.00001){return vec4<f32>(0.0);}
  let count=f32(FIELD.dimensions[axis]);
  let cell=FIELD.gridSize[axis]/count;
  let repeat=select(1.0,max(FIELD.patternStyle.x,0.25),CLOUD_FROZEN_PATTERN!=0u && axis!=1u);
  let first=round(FIELD.pattern.y*(count-1.0));
  let last=round(FIELD.pattern.z*(count-1.0));
  let stride=max(round(FIELD.pattern.w),1.0);
  let lastOwned=first+floor((last-first)/stride)*stride;
  let thickness=cell*repeat*max(FIELD.patternStyle.y,0.1);
  let grazing=smoothstep(0.015,0.08,abs(direction));
  let sun=normalizeOr(L.sunDir,vec3<f32>(0.0,1.0,0.0));
  let phase=saturate(dot(rd,sun)*0.5+0.5);
  let scatter=0.10+0.30*pow(phase,4.0);
  let silver=pow(phase,max(6.0,C.silverExponent*8.0));
  let localBank = localPlanetConvectiveForm();
  let localAnvil = localPlanetAnvilForm();
  let family = flatVolumeFamily();
  let volumeLighting = flatFormType() > 0.5;
  let domainWarp = prepareCachedDomainWarp(FIELD.gridSize.xyz / vec3<f32>(FIELD.dimensions.xyz));
  var cursor=entry+cell*repeat*0.0001;
  var Tr=1.0;var rgb=vec3<f32>(0.0);
  for(var layer=0;layer<512;layer++){
    let coordinate=((ro[axis]+direction*cursor-B.center[axis])/repeat)/cell+count*0.5;
    var cycle=select(floor(coordinate/count),0.0,axis==1u);
    let local=coordinate-cycle*count;
    var index=first+select(floor((local-0.5-first)/stride),ceil((local-0.5-first)/stride),direction>0.0)*stride;
    if(direction>0.0){
      index=max(index,first);
      if(index>lastOwned){if(axis==1u){break;}cycle+=1.0;index=first;}
    }else{
      index=min(index,lastOwned);
      if(index<first){if(axis==1u){break;}cycle-=1.0;index=lastOwned;}
    }
    let plane=B.center[axis]+(cycle*count+index+0.5-count*0.5)*cell*repeat;
    let t=(plane-ro[axis])/direction;
    if(t>exit){break;}
    cursor=t+cell*repeat*0.0001/max(abs(direction),0.00001);
    if(t<entry){continue;}
    var p=ro+rd*t;
    // A captured 2D slice scrolls along its own plane. Normal wind must not
    // feed another cross-section into its tangent deformation over time.
    if(CLOUD_FROZEN_PATTERN!=0u){p[axis]-=FIELD.patternMotion[axis]*repeat;}
    var q=cachedDomainPosition(p, domainWarp);
    q[axis]=FIELD.gridMin[axis]+(index+0.5)*cell;
    let footprint=max(t*(2.0*tanY)/f32(frame.fullHeight),0.00001)/(min(repeat,1.0)*max(abs(direction),0.08));
    let uv=cloudFieldUV(q);
    let density=frozenPlaneSample(cloudDensityField,uv,axis,footprint);
    let fine=turbulentCloudSample(q,density,footprint,sun,family,localBank,localAnvil).x;
    let nearFade=smoothstep(0.0,thickness*1.5,t);
    let alpha=(1.0-exp(-fine*thickness/max(abs(direction),0.10)*VIEW_EXTINCTION_SCALE))*grazing*nearFade;
    if(alpha>0.00001){
      let light=frozenPlaneSample(cloudLightField,uv,axis,footprint);
      let visibility=clamp(light.b,0.0,1.0);
      let diffuse=clamp(light.r,0.0,1.0);
      let skyExposure = saturate(0.25 + 0.59 * uv.y);
      let upper = select(clamp(light.g, 0.0, 1.0), skyExposure, volumeLighting);
      let ao=mix_f(1.0,light.a,saturate(TUNE.aoStrength));
      let root=sqrt(visibility);
      let direct=visibility*(0.20+0.80*diffuse);
      let bounce=(0.035+0.18*sqrt(root))*(0.25+0.75*upper)*ao;
      let rim=silver*root*pow(1.0-diffuse,0.90)*(1.0-smoothstep(0.02,0.20,density.w))*max(C.silverIntensity,0.0)*1.4;
      let color=max(C.frontLightColor,vec3<f32>(0.0))*(direct+visibility*scatter+bounce)
        +max(C.shadowLightColor,vec3<f32>(0.0))*(0.10+0.19*upper)*ao+max(C.sunColor,vec3<f32>(0.0))*rim;
      rgb+=Tr*alpha*color;Tr*=1.0-alpha;
    }
    if(Tr<0.008){break;}
  }
  return vec4<f32>(rgb,1.0-Tr);
}
@compute @workgroup_size(8, 8, 1)
fn computeCloudBox(@builtin(global_invocation_id) gid: vec3<u32>) {
  var pix = vec2<i32>(gid.xy) + vec2<i32>(frame.originX, frame.originY);
  if (reproj.compactInterleave != 0u && temporalCellRateNormalized() > 1u && reproj.frameIndex > 0u) {
    let mapped = compactTemporalPixel(gid.xy, temporalCellRateNormalized());
    if (mapped.z == 0u) { return; }
    pix = vec2<i32>(mapped.xy);
  } else {
    let tileSize = select(vec2<u32>(frame.fullWidth, frame.fullHeight),
      vec2<u32>(frame.tileWidth, frame.tileHeight), vec2<bool>(frame.tileWidth > 0u, frame.tileHeight > 0u));
    if (any(gid.xy >= tileSize)) { return; }
  }
  if (any(pix < vec2<i32>(0)) || any(pix >= vec2<i32>(i32(frame.fullWidth), i32(frame.fullHeight)))) { return; }
  var ro = V.camPos;
  if (CLOUD_USE_CUSTOM_POS != 0u) { ro = posBuf[u32(pix.y) * frame.fullWidth + u32(pix.x)].xyz; }
  let uv = (vec2<f32>(pix) + 0.5) / vec2<f32>(f32(frame.fullWidth), f32(frame.fullHeight));
  let ndc = uv * 2.0 - 1.0;
  let tanY = tan(V.fovY * 0.5);
  let rd = normalize(V.fwd + V.right * (ndc.x * V.aspect * tanY) - V.up * (ndc.y * tanY));
  var aircraft = sceneAircraft(ro,rd,V.aircraftPosition,V.right,V.up,V.fwd,V._v0,V._v1,V._v2,V.aircraftYaw,normalize(L.sunDir));
  let worldTerrainDistance=cloudTerrainDepth(cloudTerrainTexture,uv,V._v3);
  if(worldTerrainDistance<aircraft.distance){aircraft.distance=1000000.0;}
  let cloudScale=flatCloudScale();
  let terrainDistance=worldTerrainDistance/cloudScale;
  if(aircraft.distance<1000000.0){aircraft.distance/=cloudScale;}
  ro=flatCloudMaterialOrigin(ro);
  let rayMin=select(FIELD.gridMin.xyz,B.center-B.half,fieldIsTiled() || (CLOUD_FROZEN_PATTERN!=0u && FIELD.patternMotion.w>0.5));
  let rayMax=select(FIELD.gridMin.xyz+FIELD.gridSize.xyz,B.center+B.half,fieldIsTiled() || (CLOUD_FROZEN_PATTERN!=0u && FIELD.patternMotion.w>0.5));
  var hit = intersectAABB_robust(ro, rd, rayMin,rayMax);
  let begin = max(hit.x, 0.0);
  if(aircraft.distance<1000000.0 && (hit.y<=begin || aircraft.distance<=begin)){
    storeRoundedSample(pix,vec4<f32>(aircraft.color,1.0),0.0);return;
  }
  hit.y=min(hit.y,min(aircraft.distance,terrainDistance));
  if (hit.y <= begin) { storeRoundedSample(pix, vec4<f32>(0.0), 0.0); return; }
  if(CLOUD_FROZEN_SLICES!=0u){
    var result=frozenPlaneClouds(ro,rd,begin,hit.y,tanY);
    let Tr=1.0-result.a;
    let fade=smoothstep(0.0,max(TUNE.minOutputAlpha,0.00001),result.a);
    let a=result.a*fade;
    if(aircraft.distance<1000000.0){result=vec4<f32>(result.rgb+Tr*aircraft.color,.5+.5*Tr);}
    else{result*=fade;}
    if(CLOUD_WRITE_RGB==0u){
      if(opt.outputChannel==0u){result=vec4<f32>(a,0.0,0.0,1.0);}
      else if(opt.outputChannel==1u){result=vec4<f32>(0.0,a,0.0,1.0);}
      else if(opt.outputChannel==2u){result=vec4<f32>(0.0,0.0,a,1.0);}
      else{result=vec4<f32>(0.0,0.0,0.0,a);}
    }
    storeRoundedSample(pix,result,0.0);return;
  }
  let fieldSpacing = FIELD.gridSize.xyz / vec3<f32>(FIELD.dimensions.xyz);
  let domainWarp = prepareCachedDomainWarp(fieldSpacing);
  let repeat=select(1.0,max(FIELD.patternStyle.x,0.25),(CLOUD_FROZEN_PATTERN!=0u && FIELD.patternMotion.w>0.5));
  let spacing=fieldSpacing*vec3<f32>(repeat,1.0,repeat);
  let voxelStep = 1.0 / max(max(abs(rd.x) / spacing.x, abs(rd.y) / spacing.y), abs(rd.z) / spacing.z);
  let budget = max(TUNE.maxSteps, 1);
  // Cover the entire segment without thin-sheet thickBox/vertical step boosts.
  let localPlanet = isLocalPlanetCloud(flatFormType()) && CLOUD_FROZEN_PATTERN == 0u;
  let planetForm = localPlanetForm(flatFormType());
  let projectedPlanet = localPlanet && capturedPlanetVolume();
  var shellOuter = vec2<f32>(-1e20, 1e20);
  var shellInner = vec2<f32>(1.0, -1.0);
  if (projectedPlanet && FIELD.regionWarp.w > 0.0) {
    let radius = FIELD.regionWarp.y + FIELD.regionWarp.z;
    let relativeOrigin = ro + vec3<f32>(0.0, FIELD.regionWarp.y, 0.0);
    // Every point between the displaced endpoints is within this much of
    // the unwarped segment. Include rounding room for near-tangent rays.
    let pad = length(domainWarp.shapeAmplitude + domainWarp.detailAmplitude) + max(.015, radius * .00002);
    shellOuter = intersectSphere_robust(relativeOrigin, rd, radius + 1.0 / FIELD.regionWarp.w + pad);
    if (radius > pad) {
      shellInner = intersectSphere_robust(relativeOrigin, rd, radius - pad);
    }
  }
  let capturedBillow = projectedPlanet && capturedBillowLighting(planetForm);
  let planetWeatherVolume = localPlanet && !localConvectiveForm(planetForm);
  let planetTower = localPlanet && localPlanetTower(planetForm);
  let filterShadows = localPlanet && filterPlanetVolumeShadows(planetForm);
  let waveWeather = flatFormType() == 6.0 || flatFormType() == 7.0;
  let stratified = localPlanet || waveWeather;
  let angularStep = 1.0 / max(length(rd / spacing), EPS);
  let boxDistance = length(max(abs(ro - B.center) - B.half, vec3<f32>(0.0)));
  // Glide between lighting footprints as the camera approaches a bank.
  // A hard camera-distance threshold changes every shadow sample at once.
  let nearBank = select(0.0, 1.0 - smoothstep(.65, 1.45, boxDistance / max(TUNE.puffScale, EPS)), stratified);
  let baseStep = max(select(voxelStep * .65, angularStep * mix(.58, .36, nearBank), stratified), TUNE.minStep);
  var step=baseStep;
  let marine = marineCumulusForm();
  let family = flatVolumeFamily();
  let volumeLighting = flatFormType() > 0.5;
  let filament = family == VOLUME_FILAMENTS;
  let layered = family == VOLUME_LAYERS;
  let rotating = family == VOLUME_ROTATING_STORM;
  let shapedMask = family == VOLUME_MASK;
  let breaking = flatFormType() == 6.0;
  let oceanDeck = flatFormType() == 13.0;
  let localBank = localPlanetConvectiveForm();
  let jitterStrength = clamp(TUNE.phaseJitter, 0.0, 0.15);
  let noise = cloudRayJitter(vec2<u32>(pix));
  let intervalPhase = (dot(ro - B.center, rd) + begin) / baseStep - noise * jitterStrength;
  // Long wisps and ridges expose coherent ray intervals. Decorrelate them
  // across pixels while keeping each pixel's phase stable between frames.
  let phaseSpread = select(select(0.0, 0.76, filament || layered || rotating), 1.0, marine);
  // A camera inside a bank must not share its radial sample shells with
  // adjacent rays. Use stable independent strata and a smooth angular step.
  let rayPhase = select(mix(fract(intervalPhase), noise, phaseSpread * smoothstep(0.0, 0.07, jitterStrength)),
    noise, stratified);
  var t=begin;
  // Phase-lock the near ray intervals under translation. These are intervals
  // along the actual camera ray, not cells of an axis-aligned spatial grid.
  // Integrate the first partial interval instead of leaving a jittered gap.
  let firstInterval = baseStep * (1.0 - rayPhase);
  let legacyNear = min(max(ceil(max(TUNE.puffScale*2.0,voxelStep*8.0)/baseStep),1.0),max(floor(f32(budget)*0.38),1.0));
  let nearCount = select(legacyNear, max(floor(f32(budget) * mix(.34, .51, nearBank)), 1.0), stratified);
  let nearEnd=begin+firstInterval+baseStep*(nearCount-1.0);
  let farCount=max(f32(budget)-nearCount,1.0);
  let farLength=max(hit.y-nearEnd-baseStep*farCount,0.0);
  var previousDensity=vec4<f32>(0.0);
  var previousDensityReady=false;
  var previousDomain=vec3<f32>(0.0);
  var previousEnd=-1.0;
  var previousLod=-1.0;
  var transmittance = 1.0;
  var radiance = vec3<f32>(0.0);
  let sun = normalizeOr(L.sunDir, vec3<f32>(0.0, 1.0, 0.0));
  let phase = saturate(dot(rd, sun) * 0.5 + 0.5);
  let scatterPhase=0.10+0.30*pow(phase,4.0);
  let sceneWeight = L.sceneWeight * sceneTwilightWeight(sun.y);
  let referenceLight = sceneCloudLighting(sun.y, max(dot(rd, sun), 0.0));
  let referenceSun = sceneSolarColor(sun.y) * L.sceneSun.rgb;
  let silverPhase=pow(phase,max(6.0,C.silverExponent*8.0));
  let coastalStorm = flatFormType() == 1.4375;
  let localAnvil = localPlanetAnvilForm();
  let horizonFade = smoothstep(-0.10, 0.02, sun.y);
  let solarVisibility = sceneLocalCloudSun(sun.y);
  let nightFill = sceneLocalCloudNightWeight(sun.y);
  let twilight = bankTwilight(sun.y, localBank);
  let coastalDusk = select(0.0, horizonFade * (1.0 - smoothstep(0.04, 0.32, sun.y)), coastalStorm);
  let horizonFill = select(0.0, coastalDuskStrength(sun.y), marine);
  let amberSquall = flatFormType() == 1.375;
  let refineSquall = amberSquall && CLOUD_FROZEN_PATTERN == 0u;
  let sunAzimuth = normalizeOr(vec3<f32>(sun.x, 0.0, sun.z), vec3<f32>(0.0, 0.0, 1.0));
  let viewAzimuth = normalizeOr(vec3<f32>(rd.x, 0.0, rd.z), sunAzimuth);
  let azimuthWeight = 1.0 - smoothstep(0.79, 0.99, abs(rd.y));
  let sunwardHorizon = smoothstep(-0.66, 1.0, dot(sunAzimuth, viewAzimuth) * azimuthWeight);
  let airTint = mix(vec3<f32>(1.0, 0.43, 0.25), vec3<f32>(1.0, 0.60, 0.35), sunwardHorizon);
  let transmittedTint = mix(twilight.tint, vec3<f32>(1.19, 0.82, 0.67), coastalDusk);
  let sunColor = max(C.frontLightColor, vec3<f32>(0.0)) * transmittedTint * twilight.direct * solarVisibility;
  let skylightTint = mix(vec3<f32>(1.0), vec3<f32>(0.84, 0.92, 1.04), twilight.amount);
  let skyColor = max(C.shadowLightColor,vec3<f32>(0.0)) * skylightTint * twilight.ambient;
  let towardsSun = pow(phase, 4.0);
  let forwardLobe = pow(phase, 14.0);
  let lowSun = 1.0 - smoothstep(0.10, 0.63, max(sun.y, 0.0));
  let sunTint = max(C.sunColor, vec3<f32>(0.0)) * transmittedTint * twilight.direct * solarVisibility;
  let forwardTint = mix(sunColor, sunTint, 0.16 + 0.72 * towardsSun);
  let skyLuma = dot(skyColor, vec3<f32>(0.2126, 0.7152, 0.0722));
  let coolSkylight = skyLuma * vec3<f32>(0.91, 1.0, 1.12);
  let neutralSky = mix(skyColor, coolSkylight, select(0.37, 0.50 + 0.22 * lowSun, marine));
  let horizontalSpacing = min(fieldSpacing.x, fieldSpacing.z);
  let minimumSpacing = min(horizontalSpacing, fieldSpacing.y);
  // A thin layer's Y pitch alone chooses a mip too soft for its XZ billows.
  // Marine fields keep a bounded portion of that horizontal detail and still
  // increase the mip with the projected pixel footprint at the horizon.
  let weatherSpacing = select(minimumSpacing, mix(minimumSpacing, horizontalSpacing, 0.62), marine || filament);
  // The vertical pitch is much finer than the horizontal pitch on a large
  // tile. Keep lateral billows at mid distance, then filter at the horizon.
  let bankSpacing = mix(minimumSpacing, horizontalSpacing, 0.68 + 0.22 * abs(rd.y));
  let volumeSpacing = select(weatherSpacing, bankSpacing, localBank);
  let fieldFilterSpacing = select(volumeSpacing, horizontalSpacing, flatFormType() > 7.5 && flatFormType() < 8.5);
  // Density and lighting resolve different things. Use a world-space light
  // footprint so more voxels add shape detail without shrinking the shadows.
  let minimumLightFootprint = TUNE.puffScale * flatLightWidth(family);
  let fullyResolvedRay = hit.y * (2.0 * tanY) / f32(frame.fullHeight) <= horizontalSpacing * .90;
  for (var i = 0; i < budget; i++) {
    if (t >= hit.y || transmittance < 0.008 || (fullyResolvedRay && t >= shellOuter.y)) { break; }
    let pixelFootprint = t * (2.0 * tanY) / f32(frame.fullHeight);
    // Resolve the entire visible layer in continuous material coordinates.
    // A density-cache cell cannot veto an unseen filament or cut the edge
    // of a tower. Only the projected footprint blends into the distant cache.
    let resolve = 1.0 - smoothstep(horizontalSpacing * .90, horizontalSpacing * 2.35, pixelFootprint);
    let usePlanetSamples = localPlanet && (!localAnvil || projectedPlanet) && resolve > 0.001;
    if(f32(i)<nearCount){
      step=max(begin+firstInterval+baseStep*f32(i)-t,0.000001);
    }else{
      let farIndex=f32(i)+1.0-nearCount;
      let progress=farIndex/farCount;
      let plannedEnd=nearEnd+baseStep*farIndex+farLength*progress*progress*progress;
      step=max(max(baseStep,pixelFootprint*0.65),plannedEnd-t);
    }
    let distance = min(step, hit.y - t);
    let end = t + distance;
    if (usePlanetSamples && resolve == 1.0 &&
        (t >= shellOuter.y || end <= shellOuter.x || (t >= shellInner.x && end <= shellInner.y))) {
      // Whole interval outside the deformed shell. Cached density can
      // still contribute around the layer at coarse footprints.
      previousDensityReady = false;
      previousEnd = -1.0;
      t += step;
      continue;
    }
    let p = ro + rd * (t + distance * 0.5);
    let fieldLod=clamp(log2(max(max(pixelFootprint,step*0.35)/(fieldFilterSpacing*min(repeat,1.0)),1.0)),0.0,3.0);
    // A fully resolved near sample supplies extinction, relief and the light
    // lookup position. It only needs cached density weights while haze varies
    // along the interval; clear or fully hazed intervals give the same tint.
    let hazeVaries = (marine || localBank) && t * cloudScale < 91.0 &&
      (t + distance) * cloudScale > 14.0;
    let useCachedDensity = !usePlanetSamples || resolve < 1.0 || nearBank < 1.0 || hazeVaries;
    let domainEnd = cachedDomainPosition(ro + rd * (t + distance), domainWarp);
    var domainStart = previousDomain;
    if (abs(previousEnd - t) > 0.00001) {
      domainStart = cachedDomainPosition(ro + rd * t, domainWarp);
    }
    var fine = vec3<f32>(0.0);
    var sampleUV = vec3<f32>(0.0);
    var foldLight = 0.0;
    if (usePlanetSamples) {
      let phaseOffset = fract(noise + f32(i) * .6180339) - .5;
      let samplePosition = mix(domainStart, domainEnd, .5 + mix(.58, .87, nearBank) * phaseOffset);
      sampleUV = cloudFieldUV(samplePosition);
      let coverage = saturate(C.globalCoverage);
      // A ray segment is long in its own direction. Do not blur a thin
      // transverse ridge by treating the segment as an isotropic footprint.
      let sampleFootprint = max(vec3<f32>(pixelFootprint), abs(rd) * distance * .48);
      if (projectedPlanet) {
        fine = capturedPlanetCloudBody(samplePosition, sampleUV.y, planetForm, coverage, sampleFootprint, resolve == 1.0);
      } else if (planetWeatherVolume) {
        let weather = localPlanetWeather(samplePosition);
        fine = localPlanetWeatherBody(samplePosition, sampleUV.y, planetForm, weather, coverage, sampleFootprint);
      } else {
        let weather = localPlanetWeather(samplePosition);
        let bankFootprint = max(pixelFootprint, distance * select(.42, .23, planetTower));
        let bank = localConvectiveBank(samplePosition, sampleUV.y, weather, coverage, planetForm, bankFootprint, resolve == 1.0);
        fine = localPlanetDensityProfile(bank, 1.0, coverage, 0.0, 0.0);
        // A short sunward probe picks out which faces of the moving folds
        // catch light. The cached field handles shadows from farther away.
        let foldSupport = smoothstep(.025, .20, fine.x) * (1.0 - smoothstep(.82, .98, fine.x));
        if (planetTower && foldSupport > 0.0) {
          let probe = samplePosition + sun * max(TUNE.puffScale * .065, bankFootprint);
          let nearSun = localConvectiveBank(probe, cloudFieldUV(probe).y, weather, coverage, planetForm, bankFootprint, false);
          foldLight = clamp((bank.x - nearSun.x) * 7.0, -.65, .65) * resolve * foldSupport;
        }
      }
    }
    if (usePlanetSamples && resolve == 1.0 && fine.x == 0.0) {
      // The continuous sample supplies all extinction here. Defer the
      // endpoint read until a later interval needs it, keeping its original mip.
      previousDensityReady = false;
      previousLod = select(-1.0, fieldLod, useCachedDensity);
      previousDomain = domainEnd;
      previousEnd = t + distance;
      t += step;
      continue;
    }
    var density = vec4<f32>(0.0);
    var lightWeight = 0.5;
    if (useCachedDensity) {
      // Reuse the previous endpoint except when the filtering footprint changes.
      var densityStart = previousDensity;
      if (abs(previousEnd - t) > 0.00001 || abs(previousLod - fieldLod) > 0.25) {
        densityStart = cachedVisibleSample(cloudDensityField, cloudFieldUV(domainStart), fieldLod);
      } else if (!previousDensityReady) {
        densityStart = cachedVisibleSample(cloudDensityField, cloudFieldUV(domainStart), previousLod);
      }
      let densityEnd = cachedVisibleSample(cloudDensityField, cloudFieldUV(domainEnd), fieldLod);
      previousDensity = densityEnd;
      previousDensityReady = true;
      previousLod = fieldLod;
      density = (densityStart + densityEnd) * 0.5;
      lightWeight += (densityEnd.r - densityStart.r) / (6.0 * max(densityStart.r + densityEnd.r, 0.000001));
      // Simpson weights preserve transparent wisps in the near, cached part
      // of the integral. Fade to the endpoint integral with distance.
      let nearBlend = 1.0 - smoothstep(max(TUNE.puffScale, voxelStep * 4.0),
        max(TUNE.puffScale * 2.0, voxelStep * 8.0), t - begin);
      if (nearBlend > 0.001) {
        let middle = cachedVisibleSample(cloudDensityField, cloudFieldUV(cachedDomainPosition(p, domainWarp)), fieldLod);
        let integral = (densityStart + middle * 4.0 + densityEnd) / 6.0;
        density = mix(density, integral, nearBlend);
        let midpointWeight = (middle.r * 2.0 + densityEnd.r) / max(densityStart.r + middle.r * 4.0 + densityEnd.r, 0.000001);
        lightWeight = mix(lightWeight, midpointWeight, nearBlend);
        density.b = max(density.b, middle.b);
      }
      density.b = max(density.b, max(densityStart.b, densityEnd.b));
    } else {
      previousLod = -1.0;
    }
    previousDomain = domainEnd;
    previousEnd = t + distance;
    if(!usePlanetSamples && fieldIsTiled() && f32(i)>=nearCount && density.b<0.00001){
      var skip=min(max(step,(t-begin)*0.045),hit.y-t);
      var skipped=false;
      for(var attempt=0;attempt<3;attempt++){
        if(skip<=step*1.25){break;}
        let lod=clamp(ceil(log2(max(cachedDomainSkipFootprint(skip,rd,fieldSpacing,domainWarp),1.0))),0.0,f32(textureNumLevels(cloudDensityField)-1u));
        let bound=textureSampleLevel(cloudDensityField,cloudFieldSampler,cloudFieldUV(cachedDomainPosition(ro+rd*(t+skip*0.5),domainWarp)),lod).b;
        if(bound<0.00001){t+=skip;skipped=true;break;}
        skip*=0.25;
      }
      if(skipped){continue;}
    }
    let transportUV = cloudFieldUV(mix(domainStart, domainEnd, lightWeight));
    var fieldUV = transportUV;
    let detailPosition = select(p, ro + rd * (t + distance * lightWeight), refineSquall);
    let finePosition = select(detailPosition, mix(domainStart, domainEnd, lightWeight),
      CLOUD_FROZEN_PATTERN != 0u && FIELD.patternMotion.w > 0.5);
    let footprint = max(step, pixelFootprint);
    var fringe = vec3<f32>(density.r, 0.0, 0.0);
    if (!usePlanetSamples || resolve < .995) {
      fringe = turbulentCloudSample(finePosition, density, footprint, sun, family, localBank, localAnvil);
    }
    var extinction = fringe.x;
    if (usePlanetSamples) {
      fringe.y += foldLight * .21;
      fringe.z += foldLight;
      let fineDensity = fine.x * localPlanetDensityScale(sampleUV);
      let mixWeight = resolve;
      extinction = mix(extinction, fineDensity, mixWeight);
      fieldUV = mix(fieldUV, sampleUV, mixWeight);
      // The cache still supplies the broad shadow. Small signed-form
      // differences give those folds a local light response.
      let relief = mix(clamp((fine.z - density.a) / max(TUNE.puffScale * .052, .1), -.55, .55),
        clamp((fine.y - fine.x) * 1.8, -.35, .35), nearBank);
      // Light on faint rear folds should be supported by the underlying mass.
      let support = select(1.0, smoothstep(.015, .20, fine.y), planetTower);
      fringe.y += relief * mixWeight * support * .50;
      fringe.z += relief * mixWeight * support * .36;
      density.a = mix(density.a, fine.z, mixWeight);
    }
    let alpha = 1.0 - exp(-extinction * distance * VIEW_EXTINCTION_SCALE);
    if (alpha > 0.00001) {
      let lightingFootprint = max(minimumLightFootprint, max(pixelFootprint, distance * 0.57));
      let lightLod = select(fieldLod,
        clamp(max(fieldLod, log2(max(lightingFootprint / horizontalSpacing, 1.0))), 0.0, 3.0), volumeLighting);
      // The coarse shadow/sky field should read as illumination over a
      // continuous volume, not as a second faceted cloud surface.
      let towerLightLod = mix(1.26, .84, smoothstep(.018, .14, alpha) * smoothstep(.12, .60, transmittance));
      let nearLightLod = select(select(.84, .60, capturedBillow), towerLightLod, planetTower);
      // Translucent rear folds should sample the wider light field. Keep
      // the near, optically thick faces sharper and leave opacity untouched.
      let frontBody = smoothstep(.04, .30, alpha) * smoothstep(.28, .75, transmittance);
      let shadowLod = select(nearLightLod, mix(2.45, 1.65, frontBody), filterShadows);
      let lightingLod = select(lightLod, max(lightLod, shadowLod), localPlanet);
      // Integrate broad shadows at the interval's density centroid. The
      // jittered fine sample still adds silhouette detail and opacity.
      let lightUV = select(fieldUV, transportUV, filterShadows);
      let lighting = cachedVisibleSample(cloudLightField, lightUV, lightingLod);
      var diffuse = clamp(lighting.r, 0.0, 1.0);
      let visibility = clamp(lighting.b, 0.0, 1.0);
      if (usePlanetSamples) {
        diffuse = clamp(diffuse + fringe.z * select(.28, .08, filterShadows), 0.0, 1.0);
      }
      var matchedLight = vec3<f32>(0.0);
      if (sceneWeight > 0.0) {
        let skyExposure = clamp(lighting.a, 0.0, 1.0);
        let viewEdge = 1.0 - smoothstep(.10, .72, extinction / 5.05);
        matchedLight = sceneCloudRadiance(referenceLight, referenceSun, visibility * solarVisibility, skyExposure,
          viewEdge, true, L.sceneFront.rgb, L.sceneShadow.rgb, L.sceneTransmission.rgb, L.sceneResponse.rgb);
      }
      var color = matchedLight;
      if (sceneWeight < 1.0) {
        let skyOrLocalSun = clamp(lighting.g, 0.0, 1.0);
        let rootVisibility = sqrt(visibility);
        let exposedEdge = 1.0 - smoothstep(0.02, 0.20, density.w);
        let silver = silverPhase * rootVisibility * pow(1.0 - diffuse, 0.90)
          * exposedEdge * max(C.silverIntensity, 0.0) * 1.4;
        if (volumeLighting) {
          let localSun = max(visibility, skyOrLocalSun);
          let skyAccess = clamp(lighting.a, 0.0, 1.0);
          let exposed = smoothstep(0.10, 0.66, visibility);
          let softSky = mix(sqrt(skyAccess), skyAccess, saturate(TUNE.aoStrength) * 0.58);
          let elevation = smoothstep(0.06, 0.91, fieldUV.y);
          let thickness = smoothstep(0.07, 0.88, density.a);
          let underside = 1.0 - exposed;
          let silhouetteContrast = breaking || rotating || oceanDeck;
          let ambientFloor = select(0.12, 0.042, silhouetteContrast);
          let lift = select(0.12, 0.052, silhouetteContrast);
          let skyTransport = select(1.0, mix(0.70, 1.08, softSky), capturedBillow);
          let ambientSky = (ambientFloor + 0.50 * softSky * (1.0 - 0.59 * horizonFill) + lift * elevation)
            * (1.0 - 0.09 * thickness) * skyTransport;
          let skyReliefStrength = select(0.24, 0.04, filterShadows);
          let skyRelief = select(0.0, clamp(fringe.y, -0.38, 0.38) * softSky * skyReliefStrength, localAnvil || usePlanetSamples);
          let squallRelief = select(0.0, clamp(fringe.y, -0.48, 0.48) * (1.0 - thickness) * underside, refineSquall);
          let shelteredFold = select(0.0, smoothstep(0.065, 0.52, skyAccess), refineSquall) * squallRelief;
          let shadowFill = select(0.0, horizonFill * (1.0 - smoothstep(0.018, 0.24, visibility)), amberSquall);
          let baseFillTint = mix(neutralSky, skyColor, 0.18 + 0.49 * softSky);
          // Skylight keeps the palette's hue while giving sheltered folds a
          // cooler fill. The direct path still uses the chosen sunlight swatch.
          let fillTint = select(baseFillTint, baseFillTint * mix(
            vec3<f32>(0.86, 0.96, 1.18), vec3<f32>(0.98, 1.0, 1.06), exposed), capturedBillow);
          let through = rootVisibility * mix(0.55, 1.0, localSun);
          let bounceTint = mix(neutralSky, forwardTint, 0.10 + 0.53 * through);
          let bounceFloor = select(0.10, 0.056, silhouetteContrast);
          let localScattering = sqrt(localSun);
          let bounceTransport = select(1.0, 0.60 + 0.18 * softSky + 0.19 * localScattering, capturedBillow);
          let bounceLight = (bounceFloor + 0.15 * through) * (0.57 + 0.43 * softSky) * bounceTransport;
          // The short light path still describes the sheltered faces of folds.
          // Only the longer path contributes direct sun and the bright rim.
          let nearLight = localScattering * (0.32 + 0.68 * softSky);
          let reliefTint = mix(neutralSky * 0.69, forwardTint * 0.68, 0.36 + 0.22 * towardsSun);
          let reliefAmount = select(select(0.0, 0.26, silhouetteContrast), 0.29, shapedMask);
          let shoulderBounce = underside * (1.0 - thickness) * nearLight * (0.32 + 0.68 * diffuse) * reliefAmount;
          // Deeper layers keep some diffuse fill while light through gaps
          // changes with the angle and the longer path to the sun.
          let layeredFill = select(0.147, 0.073, silhouetteContrast);
          let indirectStrength = select(select(0.11, layeredFill, layered || rotating), 0.28 + 0.07 * lowSun, marine);
          let indirect = underside * (0.18 + 0.82 * softSky * (1.0 - 0.56 * horizonFill)) * indirectStrength;
          let warmLeak = (0.10 + 0.15 * lowSun) * softSky * (0.36 + 0.64 * towardsSun);
          let diffuseTint = mix(neutralSky, forwardTint * 0.58, warmLeak);
          let facet = diffuse * (0.68 + 0.32 * diffuse);
          let faceTransport = select(1.0, mix(0.88, 1.10, diffuse), capturedBillow);
          let face = visibility * (0.15 + select(0.73, 0.52, filament) * facet) * faceTransport;
          let maskScatter = select(0.0, 0.20 * through + 0.10 * softSky * (1.0 - thickness), shapedMask);
          let fineRelief = exposed * (1.0 - thickness) * clamp(fringe.z, -0.37, 0.37);
          let forward = visibility * (0.078 + forwardLobe
            * (0.11 + select(0.29, 0.46, filament) * (1.0 - thickness)));
          let rim = (1.0 - thickness) * rootVisibility
            * smoothstep(0.26, 0.88, localSun) * forwardLobe;
          let twilightRim = select(0.0, rim * twilight.amount * 0.18, localBank);
          // Some indirect light follows the finer world-space folds. Attenuate
          // that contribution in the most enclosed pockets of the bank.
          color = fillTint * ambientSky * (1.0 + skyRelief + 0.95 * squallRelief)
            + bounceTint * bounceLight * (1.0 + 1.26 * shelteredFold)
            + diffuseTint * indirect * (1.0 + 0.72 * shelteredFold)
            + reliefTint * shoulderBounce + sunColor * (face * (1.0 + 0.56 * fineRelief) + maskScatter)
            + forwardTint * forward + sunTint * (0.43 * silver + rim * (0.15 + 0.07 * lowSun) + twilightRim);
          if (shadowFill > 0.001) {
            // Replace part of the even shadow fill with light from the lower
            // sky. Shoulder highlights stay broad, with a little local relief.
            let lowerSkyAccess = smoothstep(0.11, 0.85, -lighting.r);
            let foldLight = lowerSkyAccess * (1.0 + 0.94 * squallRelief) * (1.0 - 0.32 * thickness);
            let violetSky = mix(neutralSky, coolSkylight * vec3<f32>(0.95, 1.01, 1.19), 0.65);
            let warmOpening = smoothstep(0.46, 0.91, skyAccess) * sunwardHorizon;
            color += (violetSky * (foldLight * (0.46 - 0.095 * warmOpening)) - fillTint * ambientSky * 0.16)
              * shadowFill;
          }
          if (horizonFill > 0.001) {
            // Broad illumination from sunlit air can reach into the shade. Keep
            // it separate from the direct solar path and from the bright rim.
            let openAir = smoothstep(0.08, 0.85, skyAccess);
            let smallFolds = select(clamp(fringe.y, -0.28, 0.28) * 0.58, squallRelief * 1.80, refineSquall);
            let fold = mix(0.49, 1.0, softSky) + smallFolds * openAir;
            let warmSky = airTint * (0.035 + 0.66 * pow(sunwardHorizon, 2.6))
              * select(0.64, 1.0, amberSquall);
            let warmTransport = openAir * fold * (0.47 + 0.53 * underside) * (1.0 - 0.37 * thickness);
            let coolTransport = openAir * (1.0 - sunwardHorizon) * (0.18 + 0.24 * softSky);
            color += (warmSky * warmTransport + coolSkylight * coolTransport) * horizonFill;
          }
          if (marine || localBank) {
            let air = smoothstep(14.0, 91.0, (t + distance * lightWeight) * cloudScale);
            let hazeTint = mix(neutralSky * 1.28, forwardTint * 0.59, 0.12 + 0.22 * towardsSun);
            color = mix(color, hazeTint, air * select(0.12, 0.22, marine));
          }
        } else {
          let ao = mix_f(1.0, lighting.a, saturate(TUNE.aoStrength));
          let asperitasFill = FIELD.morphology.z;
          let ambient = (0.10 + 0.19 * skyOrLocalSun + asperitasFill * 0.22) * ao;
          let bounce = (0.035 + asperitasFill * 0.045 + 0.18 * sqrt(rootVisibility))
            * (0.25 + 0.75 * skyOrLocalSun) * ao;
          let direct = visibility * (0.20 + 0.80 * diffuse + scatterPhase);
          color = sunColor * (direct + bounce) + skyColor * ambient + sunTint * silver;
        }
        color = mix(color, matchedLight, sceneWeight);
      }
      color = mix(color, sceneLocalCloudNightFill(lighting.a), nightFill);
      if (localPlanet && isEmberstorm(planetForm)) {
        let core = smoothstep(.09, .73, density.a);
        let gapLight = (.20 + .80 * sqrt(visibility)) * (1.0 - core);
        let glow = vec3<f32>(1.14, .49, .23) * (.033 + .32 * gapLight + .21 * diffuse * towardsSun);
        let shade = vec3<f32>(.12, .15, .20) * (.16 + .27 * core);
        let altitude = clamp(fieldUV.y, 0.0, 1.0);
        let channels = localPlanetWeather(p);
        let shape = localPlanetShape(p, altitude, planetForm, channels, vec3<f32>(max(step, pixelFootprint) * .65));
        color = .60 * color + glow + shade
          + emberstormEmission(shape, altitude, NTransform.shapeOffsetWorld.y, 1.0 - core);
      }
      if (isLocalPlanetCloud(flatFormType()) && isGlowingFissures(localPlanetForm(flatFormType()))) {
        let altitude = clamp(fieldUV.y, 0.0, 1.0);
        let form = localPlanetForm(flatFormType());
        let channels = localPlanetWeather(p);
        let shape = localPlanetShape(p, altitude, form, channels, vec3<f32>(max(step, pixelFootprint)));
        color += glowingFissureEmission(shape, altitude, NTransform.shapeOffsetWorld.y, vec3<f32>(1.38, 0.39, 0.063));
      }
      radiance += transmittance * alpha * color;
      transmittance *= 1.0 - alpha;
    }
    t += step;
  }
  let rawAlpha = clamp(1.0 - transmittance, 0.0, 1.0);
  // The hybrid has genuinely tenuous edges. Fade them before history instead
  // of retaining a pale outline of the scaffold, or using a hard alpha cutoff
  // which would make developing clouds pop. Keep radiance premultiplied.
  let edgeFade = smoothstep(0.0, max(TUNE.minOutputAlpha, 0.00001), rawAlpha);
  let a = rawAlpha * edgeFade;
  var result = vec4<f32>(radiance * edgeFade, a);
  // Hull rays encode their front transmission in alpha (.5..1); the preview
  // separates metal from cloud before grading and fogging the two components.
  if(aircraft.distance<1000000.0){result=vec4<f32>(radiance+transmittance*aircraft.color,.5+.5*transmittance);}
  if (CLOUD_WRITE_RGB == 0u) {
    if (opt.outputChannel == 0u) { result = vec4<f32>(a,0.0,0.0,1.0); }
    else if (opt.outputChannel == 1u) { result = vec4<f32>(0.0,a,0.0,1.0); }
    else if (opt.outputChannel == 2u) { result = vec4<f32>(0.0,0.0,a,1.0); }
    else { result = vec4<f32>(0.0,0.0,0.0,a); }
  }
  let farHistory = saturate((hit.y * cloudScale - TUNE.farStart) / max(TUNE.farFull - TUNE.farStart, EPS));
  storeRoundedSample(pix, result, farHistory);
}
