// Native Planet Clouds clips the view ray using the rendered terrain depth.
// The shared integrator also tests its sun rays against the solid planet.
fn cloudShaftTerrainSun(point: vec3<f32>) -> f32 { return 1.0; }

fn planetShaftTint(linearTint: vec3<f32>, contrast: f32, rolloff: f32) -> vec3<f32> {
  let color = sceneHighlightRolloff(cloudShaftTint(linearTint), rolloff);
  return sceneDisplayContrast(color, contrast);
}

fn planetShaftDepth(terrain: texture_2d<f32>, uv: vec2<f32>) -> vec4<f32> {
  let dims = vec2<f32>(textureDimensions(terrain));
  return textureLoad(terrain, min(vec2<i32>(uv * dims), vec2<i32>(dims) - 1), 0);
}

fn planetShaftReceiver(depth: vec4<f32>) -> f32 {
  return select(1e6, max(0.0, depth.a + depth.b), depth.g < 0.0 && depth.a > 0.0);
}

fn planetShaftOverheadWeight(eye: vec3<f32>, ray: vec3<f32>) -> f32 {
  let datum = shaftFrame.up.w;
  let base = shaftFrame.right.w;
  let eyeAltitude = cloudShaftAltitude(eye, datum);
  let fromAbove = smoothstep(base, base + shaftFrame.air.z, eyeAltitude);
  if (fromAbove <= .001) { return 1.0; }
  let inside = cloudShaftSphere(eye, ray, datum, base + shaftFrame.air.y);
  if (inside.y <= max(0.0, inside.x)) { return 1.0 - fromAbove; }

  // Fade the local effect over a broad area in world space, after applying
  // the shaft brightness curve. High settings cannot reveal the atlas edge.
  let entry = max(0.0, inside.x);
  let offset = cloudShaftUV(ray * entry) * 2.0;
  let support = 1.0 - smoothstep(.10, .60, dot(offset, offset));
  let proximity = 1.0 - smoothstep(shaftFrame.air.x * .65, shaftFrame.air.x * 1.7, entry);
  return mix(1.0, support * proximity * .61, fromAbove);
}

fn planetWorldShafts(depth: vec4<f32>, origin: vec3<f32>, ray: vec3<f32>,
    sun: vec3<f32>, controls: vec4<f32>, haze: f32, coverage: f32, airHeight: f32) -> vec2<f32> {
  let receiver = planetShaftReceiver(depth);
  // The terrain depth already limits the ray. A short fade handles contact
  // with very close surfaces while leaving the rest of the foreground lit.
  let nearFade = min(airHeight * .008, shaftFrame.air.z * .14);
  return localCloudShafts(origin, ray, sun, receiver, shaftFrame.up.w,
    controls, haze, 1.0, 1.0 - coverage, nearFade);
}

fn planetShaftOverlay(response: vec2<f32>, tint: vec3<f32>) -> vec4<f32> {
  // Premultiplied light and shaded transmission for the separate planet and cloud canvases.
  let light = tint * response.x;
  let alpha = max(light.r, max(light.g, light.b));
  return vec4<f32>(light, alpha + (1.0 - alpha) * response.y);
}
