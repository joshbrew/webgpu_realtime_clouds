struct SurfaceShaftParams {
  sun: vec4<f32>,        // world direction, elevation
  shafts: vec4<f32>,    // strength, span, falloff, sun clearance
  air: vec4<f32>,       // atmosphere height, haze, shaft visibility, display contrast
  sky: vec4<f32>,
  dusk: vec4<f32>,
  tint: vec4<f32>,      // RGB tint, highlight rolloff
  eye: vec4<f32>,
  right: vec4<f32>,
  up: vec4<f32>,
  forward: vec4<f32>,   // view forward, shadow darkness
}

@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var clouds: texture_2d_array<f32>;
@group(0) @binding(2) var terrain: texture_2d<f32>;
@group(0) @binding(3) var<uniform> params: SurfaceShaftParams;
@group(0) @binding(4) var cloudShaftMask: texture_2d<f32>;
@group(0) @binding(5) var<uniform> shaftFrame: CloudShaftFrame;

struct SurfaceShaftVertex {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> SurfaceShaftVertex {
  let position = array(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0))[index];
  return SurfaceShaftVertex(vec4<f32>(position, 0.0, 1.0), position * vec2<f32>(.5, -.5) + .5);
}

@fragment
fn fs_main(input: SurfaceShaftVertex) -> @location(0) vec4<f32> {
  let uv = input.uv;
  if (!cloudShaftsAvailable()) { return vec4<f32>(0.0); }
  let opacity = textureSampleLevel(clouds, samp, uv, 0, 0.0).a;
  let depth = planetShaftDepth(terrain, uv);
  let ndc = (uv - .5) * vec2<f32>(2.0, -2.0);
  let ray = normalize(params.forward.xyz + params.right.xyz * ndc.x + params.up.xyz * ndc.y);
  let scatter = planetWorldShafts(depth, params.eye.xyz, ray, params.sun.xyz,
    vec4<f32>(1.0, params.shafts.xyz), params.air.y, opacity, params.air.x);
  let response = cloudShaftResponse(scatter, opacity, params.shafts.x, params.forward.w)
    * params.air.z * planetShaftOverheadWeight(params.eye.xyz, ray);
  let light = planetSunTint(params.sun.w, params.shafts.w, params.sky, params.dusk) * params.tint.rgb;
  return planetShaftOverlay(response, planetShaftTint(light, params.air.w, params.tint.w));
}
