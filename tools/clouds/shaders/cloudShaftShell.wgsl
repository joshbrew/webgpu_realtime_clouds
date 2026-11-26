@compute @workgroup_size(8, 8)
fn bakeShellShaftMask(@builtin(global_invocation_id) id: vec3<u32>, @builtin(local_invocation_index) lane: u32) {
  if (lane == 0u) {
    wg_weatherDim = vec2<f32>(textureDimensions(weather2D));
    wg_maxMipW = f32(textureNumLevels(weather2D)) - 1.0;
    if (CLOUD_WEATHER_PLANET_FORM > 0.0) { preparePlanetRayMotion(); }
  }
  workgroupBarrier();
  let dims = textureDimensions(shaftMaskOut);
  if (any(id.xy >= dims)) { return; }
  let uv = cloudShaftColumnUV(id.xy, dims);
  if (!cloudShaftColumnNeeded(uv, dims.x)) {
    textureStore(shaftMaskOut, vec2<i32>(id.xy), vec4<f32>(0.0, 0.0, 0.0, 1.0));
    return;
  }
  let origin = cloudShaftColumn(uv);
  let sun = normalize(select(L.sunDir, cross(shaftFrame.right.xyz, shaftFrame.up.xyz), shaftFrame.up.w < 0.0));
  let height = max(V.cloudTop - V.cloudBottom, EPS);
  let bottom = shaftFrame.right.w;
  let datum = shaftFrame.up.w;
  let scale = select(1.0, NTransform.planetUp.w, localPlanetShellMode());
  let path = cloudShaftSunwardShell(origin, sun, datum, bottom, height / scale);
  var transport = vec2<f32>(0.0);
  if (path.x < path.y) {
    let lengthInCloud = path.y - path.x;
    let steps = clamp(u32(ceil(8.0 * lengthInCloud * scale / height)), 8u, 16u);
    let interval = lengthInCloud / f32(steps);
    // Filter for the projected column and the integration spacing, so cast
    // shadows retain distinct weather gaps without following fine erosion noise.
    let footprint = max(2.0 * shaftFrame.center.w / f32(dims.x), interval * .3);
    let lod = clamp(log2(max(1.0, footprint * scale * NTransform.shapeScale * V.worldToUV *
      f32(textureDimensions(shape3D).x))), 0.0, 3.2);
    let intervalExtinction = .034 * interval * scale / height;
    let form = planetFormType();
    let rounded = form == 2.0 || form == 2.125 || isBigBlob(form);
    let denseForm = isFineCumulus(form) || isAnvilCloud(form);
    let richForm = isCumulusBank(form) || isPlanetFront(form) || isThinOrDiorama(form)
      || isEmberstorm(form) || isGlowingFissures(form);
    let erosion = select(select(.053, .091, richForm), .119, denseForm);
    let definition = clamp(TUNE.definition, 0.0, 1.0);
    let meanErosion = .46 * erosion * select(mix(.42, 1.55, definition), .06 + .23 * definition, rounded);
    let densityScale = max(C.globalDensity * 10.0, EPS);
    var transmittance = 1.0;
    for (var i = 0u; i < steps; i++) {
      let point = origin + sun * (path.x + (f32(i) + .5) * interval);
      var p = point;
      if (localPlanetShellMode()) { p = planetShellPosition(point); }
      let ph = clamp(planetPhase(p), 0.0, 1.0);
      let weather = planetRayWeather(p);
      if (weather.b > 1.0) { continue; }
      let geometry = planetCloudForm(ph, weather, planetShape(p, lod, weather, ph));
      let mass = styledPlanetDensityFromForm(geometry, meanErosion * planetCloudErosionStrength(weather, form));
      let feather = smoothstep(0.0, select(.035, .065, richForm || denseForm), mass / densityScale);
      let segment = 1.0 - exp(-mass * feather * intervalExtinction);
      let blocked = transmittance * segment;
      transport += blocked * vec2<f32>(1.0, cloudShaftBlockerHeight(point));
      transmittance *= 1.0 - segment;
      if (transmittance < .015) { break; }
    }
  }
  textureStore(shaftMaskOut, vec2<i32>(id.xy), vec4<f32>(transport, 0.0, 1.0));
}
