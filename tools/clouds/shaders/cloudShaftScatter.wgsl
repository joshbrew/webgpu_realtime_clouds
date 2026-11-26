fn cloudShaftsAvailable() -> bool { return shaftFrame.center.w > 0.0; }

fn cloudShaftUV(offset: vec3<f32>) -> vec2<f32> {
  return vec2<f32>(dot(offset, shaftFrame.right.xyz), dot(offset, shaftFrame.up.xyz)) / (2.0 * shaftFrame.center.w);
}

// The camera can move eight texels from the bake origin. The visible
// disc stays within the baked support even at the largest offset.
const CLOUD_SHAFT_VIEW_RADIUS_SQUARED: f32 = .825;

fn cloudShaftRangeWeight(fromEye: vec2<f32>) -> f32 {
  let p = fromEye * 2.0;
  return 1.0 - smoothstep(.40, CLOUD_SHAFT_VIEW_RADIUS_SQUARED, dot(p, p));
}

fn cloudShaftBlockers(map: vec4<f32>, altitude: f32) -> vec2<f32> {
  let heights = shaftFrame.right.w + shaftFrame.air.z * clamp(map.zw / max(map.xy, vec2<f32>(.001)), vec2<f32>(0.0), vec2<f32>(1.0));
  let distanceBelow = heights - altitude;
  let minFade = select(1.5, 1.5 * shaftFrame.air.x / 115.0, shaftFrame.up.w < 0.0);
  let fade = max(shaftFrame.air.z * .16, minFade);
  let opacity = map.xy * smoothstep(vec2<f32>(-fade), vec2<f32>(fade * .45), distanceBelow);
  let penumbra = .30 * smoothstep(fade * 2.0, shaftFrame.air.x, distanceBelow.x);
  return vec2<f32>(mix(opacity.x, opacity.y, penumbra), opacity.y);
}

fn cloudShaftPlanetSun(point: vec3<f32>, sun: vec3<f32>, groundRadius: f32) -> f32 {
  if (groundRadius < 0.0) {
    let closest = dot(point, sun);
    if (closest >= 0.0) { return 1.0; }
    let clearance = cloudShaftAltitude(point - closest * sun, groundRadius);
    return smoothstep(-.002 * abs(groundRadius), .0015 * abs(groundRadius), clearance);
  }
  if (groundRadius == 0.0) { return 1.0; }
  let closest = dot(point, sun) + groundRadius * sun.y;
  if (closest >= 0.0) { return 1.0; }
  // Height of the closest point along the sun ray, without subtracting large radii.
  let radiusDelta = dot(point.xz, point.xz) + point.y * (2.0 * groundRadius + point.y);
  let clearance = (radiusDelta - closest * closest) / (2.0 * groundRadius);
  return smoothstep(-.20, .35, clearance);
}

fn cloudShaftSurfaceSun(origin: vec3<f32>, point: vec3<f32>, strength: f32, footprint: f32, darkness: f32) -> f32 {
  if (strength <= .001 || !cloudShaftsAvailable()) { return 1.0; }
  let weight = cloudShaftRangeWeight(cloudShaftUV(point - origin));
  if (weight <= .001) { return 1.0; }
  let projected = cloudShaftUV(point - shaftFrame.center.xyz);
  let texelsPerUnit = f32(textureDimensions(cloudShaftMask).x) / (2.0 * shaftFrame.center.w);
  let lod = clamp(log2(max(1.0, footprint * texelsPerUnit)), 0.0, 3.0);
  let map = textureSampleLevel(cloudShaftMask, samp, projected + .5, lod);
  let shade = cloudShaftBlockers(map, cloudShaftAltitude(point, shaftFrame.up.w)).x;
  return 1.0 - shade * weight * min(mix(.54, 1.0, sceneDeepShadowAmount(darkness)), strength * .34);
}

fn localCloudShafts(origin: vec3<f32>, ray: vec3<f32>, sun: vec3<f32>, receiver: f32,
    groundRadius: f32, controls: vec4<f32>, haze: f32, sunlight: f32, cloudTransmission: f32,
    nearFade: f32) -> vec2<f32> {
  let datum = shaftFrame.up.w;
  let planetCentered = datum < 0.0;
  let sunElevation = select(sun.y, dot(normalize(origin), sun), planetCentered);
  let sunGate = select(smoothstep(.005, .075, sunElevation), smoothstep(-.04, .045, sunElevation), planetCentered);
  let strength = controls.x * sceneShaftStrength(controls.y) * sunlight * sunGate;
  if (strength <= .001 || receiver <= 0.0 || !cloudShaftsAvailable()) { return vec2<f32>(0.0); }
  let lengthScale = clamp(controls.z, .1, 2.0);
  let distanceScale = shaftFrame.air.x * lengthScale;
  let scatterDistance = sqrt(distanceScale * max(shaftFrame.air.w * lengthScale, .1));
  let projectedOrigin = cloudShaftUV(origin - shaftFrame.center.xyz);
  let stepUV = cloudShaftUV(ray);
  let projectedSpeed = length(stepUV);
  let rangeLimit = .5 * sqrt(CLOUD_SHAFT_VIEW_RADIUS_SQUARED) / max(projectedSpeed, 1e-6);
  let reach = min(distanceScale * 2.0, shaftFrame.center.w * 1.65);
  var begin = 0.0;
  var end = min(receiver, min(reach, rangeLimit));
  let bottom = shaftFrame.right.w;
  let transition = shaftFrame.air.y;
  let ceiling = bottom + transition;
  if (datum != 0.0) {
    let inside = cloudShaftSphere(origin, ray, datum, ceiling);
    if (inside.x > inside.y) { return vec2<f32>(0.0); }
    begin = max(begin, inside.x);
    end = min(end, inside.y);
  } else if (ray.y > .0001) {
    end = min(end, (ceiling - origin.y) / ray.y);
  } else if (ray.y < -.0001) {
    begin = max(begin, (ceiling - origin.y) / ray.y);
  } else if (origin.y >= ceiling) {
    return vec2<f32>(0.0);
  }
  if (groundRadius != 0.0) {
    let ground = cloudShaftSphere(origin, ray, groundRadius, 0.0);
    if (cloudShaftAltitude(origin, groundRadius) < -.0001) {
      return vec2<f32>(0.0);
    }
    if (ground.x >= 0.0 && ground.x < ground.y) { end = min(end, ground.x); }
  }
  if (end <= begin) { return vec2<f32>(0.0); }
  // Traverse a fixed world-space grid. Rotating the camera leaves the
  // integration cells in place, and terrain only clips the last segment.
  let cellSize = max(reach / 15.0, .001);
  let cellPosition = (origin + ray * begin) / cellSize;
  let nextPlane = floor(cellPosition) + select(vec3<f32>(0.0), vec3<f32>(1.0), ray > vec3<f32>(0.0));
  let speed = abs(ray);
  let cellStride = cellSize / max(speed, vec3<f32>(1e-6));
  var crossings = select(vec3<f32>(1e10),
    begin + abs(nextPlane - cellPosition) * cellStride, speed > vec3<f32>(1e-6));
  var start = begin;
  let stepScale = select(1.0, shaftFrame.air.x / 115.0, planetCentered);
  let maskSize = f32(textureDimensions(cloudShaftMask).x);
  let texelsPerWorldUnit = maskSize / (2.0 * shaftFrame.center.w);
  let marchFootprint = projectedSpeed * maskSize * cellSize * .78;
  let hazeSpread = mix(1.0, 1.8, smoothstep(0.0, 9.0, haze));
  let sunward = max(0.0, dot(ray, sun));
  let phase = .58 + .23 * sunward * sunward + .48 * sceneAirScatterPhase(sunward);
  let aerosol = mix(.56, 1.0, smoothstep(0.0, 1.6, haze)) + 1.9 * smoothstep(1.6, 12.0, haze);
  let decay = clamp(controls.w, .2, 4.0) / max(distanceScale, .1);
  let eyeAltitude = cloudShaftAltitude(origin, datum);
  let eyeInDeck = smoothstep(bottom - transition * .12, bottom + transition * .30, eyeAltitude)
    * (1.0 - smoothstep(bottom + shaftFrame.air.z * .65, bottom + shaftFrame.air.z + transition, eyeAltitude));
  let fromAbove = select(0.0, smoothstep(bottom, bottom + shaftFrame.air.z, eyeAltitude), planetCentered);
  var scattered = vec2<f32>(0.0);
  // Fifteen cell widths can intersect at most 29 cells along any diagonal.
  for (var i = 0u; i < 30u && start < end; i++) {
    let crossing = min(crossings.x, min(crossings.y, crossings.z));
    let stop = min(end, crossing);
    let interval = stop - start;
    let t = (start + stop) * .5;
    start = stop;
    // Advance all tied axes when the ray crosses a grid corner.
    crossings += select(vec3<f32>(0.0), cellStride,
      crossings <= vec3<f32>(crossing + cellSize * 1e-5));
    if (interval <= 0.0) { continue; }
    let fromEye = stepUV * t;
    let mapWeight = cloudShaftRangeWeight(fromEye);
    if (mapWeight <= .001) { continue; }
    let point = origin + ray * t;
    let altitude = cloudShaftAltitude(point, datum);
    let airWeight = 1.0 - smoothstep(bottom - transition, ceiling, altitude);
    let viewInCloud = max(max(eyeInDeck, fromAbove), smoothstep(bottom - transition * .12, ceiling, altitude));
    let viewThrough = mix(1.0, cloudTransmission * cloudTransmission, viewInCloud);
    // A cloud shadow develops a wider penumbra farther below its caster.
    // Apply that blur to the haze, leaving the surface shadow map sharp.
    let below = max(0.0, bottom + shaftFrame.air.z * .4 - altitude);
    let penumbra = (1.5 * stepScale + min(7.0 * stepScale, below * .10) + min(2.0 * stepScale, t * .012)) * hazeSpread * texelsPerWorldUnit;
    let footprint = length(vec2<f32>(marchFootprint, penumbra));
    let lod = clamp(log2(max(1.0, footprint)), 0.0, 3.0);
    let map = textureSampleLevel(cloudShaftMask, samp, projectedOrigin + fromEye + .5, lod);
    let blocker = cloudShaftBlockers(map, altitude);
    let opening = max(blocker.y - blocker.x, 0.0);
    let shade = max(blocker.x - blocker.y, 0.0);
    // A uniform overcast has no shaft contrast. Keep light and shade in
    // separate channels so gaps and cloud shadows along one ray can coexist.
    let light = vec2<f32>(opening * 1.35, shade * .96);
    if (max(light.x, light.y) <= .0001) { continue; }
    let planetSun = cloudShaftPlanetSun(point, sun, groundRadius);
    if (planetSun <= .001) { continue; }
    let sunlit = planetSun * cloudShaftTerrainSun(point);
    let rangeFade = 1.0 - smoothstep(distanceScale * 1.30, distanceScale * 2.0, t);
    let nearWeight = smoothstep(0.0, max(nearFade, .001), t);
    scattered += light * sunlit * mapWeight * airWeight * viewThrough * exp(-t * decay) * rangeFade * nearWeight * interval;
  }
  return scattered / max(scatterDistance, .1) * strength * aerosol * phase;
}

fn cloudShaftTint(solar: vec3<f32>) -> vec3<f32> {
  let tint = sqrt(max(solar, vec3<f32>(0.0)));
  return mix(vec3<f32>(1.0), tint / max(1.0, max(tint.r, max(tint.g, tint.b))), .62);
}

fn cloudShaftResponse(shaft: vec2<f32>, cloudCoverage: f32, strength: f32, darkness: f32) -> vec2<f32> {
  // Opaque cloud surfaces already have self-shadowing and only pick up foreground haze.
  let opaque = smoothstep(.15, .96, cloudCoverage);
  let dramatic = smoothstep(1.5, 22.0, strength);
  let deep = max(dramatic * .72, sceneDeepShadowAmount(darkness));
  let shadow = mix(.48, .995, deep) * mix(1.0, .28, opaque) * (1.0 - exp(-shaft.y * 3.0));
  let scatter = mix(.53, .98, dramatic) * mix(1.0, .55, opaque) * (1.0 - exp(-shaft.x * 4.4));
  return vec2<f32>(scatter, shadow);
}

fn applyLocalCloudShafts(color: vec3<f32>, shaft: vec2<f32>, solar: vec3<f32>, cloudCoverage: f32,
    strength: f32, darkness: f32) -> vec3<f32> {
  let response = cloudShaftResponse(shaft, cloudCoverage, strength, darkness);
  let shade = color * (1.0 - response.y);
  return shade + (1.0 - shade) * cloudShaftTint(solar) * response.x;
}
