@compute @workgroup_size(8, 8)
fn bakeVolumeShaftMask(@builtin(global_invocation_id) id: vec3<u32>) {
  let dims = textureDimensions(shaftMaskOut);
  if (any(id.xy >= dims)) { return; }
  let uv = cloudShaftColumnUV(id.xy, dims);
  if (!cloudShaftColumnNeeded(uv, dims.x)) {
    textureStore(shaftMaskOut, vec2<i32>(id.xy), vec4<f32>(0.0, 0.0, 0.0, 1.0));
    return;
  }
  let worldOrigin = cloudShaftColumn(uv);
  let origin = flatCloudMaterialOrigin(worldOrigin);
  let sun = normalize(L.sunDir);
  let bounds = intersectAABB_robust(origin, sun, FIELD.gridMin.xyz, FIELD.gridMin.xyz + FIELD.gridSize.xyz);
  let tiled = fieldIsTiled() || (CLOUD_FROZEN_PATTERN != 0u && FIELD.patternMotion.w > 0.5);
  let y = (vec2<f32>(FIELD.gridMin.y, FIELD.gridMin.y + FIELD.gridSize.y) - origin.y) / max(sun.y, .005);
  let path = select(bounds, y, tiled);
  let cloudScale = flatCloudScale();
  var transport = vec2<f32>(0.0);
  var transmittance = 1.0;
  if (path.y > path.x) {
    let spacing = FIELD.gridSize.xyz / vec3<f32>(FIELD.dimensions.xyz);
    let warp = prepareCachedDomainWarp(spacing);
    let interval = (path.y - path.x) / 10.0;
    let lod = clamp(log2(max(1.0, interval * .28 / max(spacing.x, spacing.z))), 0.0, 3.0);
    for (var i = 0u; i < 10u; i++) {
      let distance = path.x + (f32(i) + .5) * interval;
      let p = origin + sun * distance;
      let mass = fieldSampleAtLod(cachedDomainPosition(p, warp), lod).g;
      let segment = 1.0 - exp(-mass * interval * VIEW_EXTINCTION_SCALE);
      let blocked = transmittance * segment;
      transport += blocked * vec2<f32>(1.0, cloudShaftBlockerHeight(worldOrigin + sun * (distance * cloudScale)));
      transmittance *= 1.0 - segment;
      if (transmittance < .015) { break; }
    }
  }
  textureStore(shaftMaskOut, vec2<i32>(id.xy), vec4<f32>(transport, 0.0, 1.0));
}
