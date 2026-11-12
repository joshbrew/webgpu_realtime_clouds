struct DepthParams {
  scaledNear: f32,
  nearOverFar: f32,
  tanHalfFov: vec2<f32>,
  cloud: vec4<f32>,
  cutoff: f32,
}

@group(0) @binding(0) var sceneDepth: texture_depth_2d;
@group(0) @binding(1) var rayDistance: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> params: DepthParams;
@group(0) @binding(3) var cloudColor: texture_2d<f32>;
@group(0) @binding(4) var cloudSampler: sampler;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let size = textureDimensions(rayDistance);
  if (any(id.xy >= size)) { return; }
  let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(size);
  let srcSize = textureDimensions(sceneDepth);
  let src = min(vec2<u32>(uv * vec2<f32>(srcSize)), srcSize - 1u);
  var depth = textureLoad(sceneDepth, vec2<i32>(src), 0);
  if (any(srcSize > size)) {
    // Keep thin foreground ridges from disappearing between cloud rays.
    let low = min(id.xy * srcSize / size, srcSize - 1u);
    let high = min(((id.xy + 1u) * srcSize - 1u) / size, srcSize - 1u);
    depth = min(depth, textureLoad(sceneDepth, vec2<i32>(low), 0));
    depth = min(depth, textureLoad(sceneDepth, vec2<i32>(i32(high.x), i32(low.y)), 0));
    depth = min(depth, textureLoad(sceneDepth, vec2<i32>(i32(low.x), i32(high.y)), 0));
    depth = min(depth, textureLoad(sceneDepth, vec2<i32>(high), 0));
  }
  var distance = 0.0;
  if (depth < 1.0) {
    let viewDistance = params.scaledNear / (1.0 - depth + depth * params.nearOverFar);
    let ray = vec3<f32>((2.0 * uv - 1.0) * params.tanHalfFov, 1.0);
    distance = viewDistance * length(ray);
  }
  var opacity = 0.0;
  if (params.cloud.w > 0.0) {
    let alpha = textureSampleLevel(cloudColor, cloudSampler, uv, 0.0).a;
    let cutoff = clamp(params.cutoff, 0.0, 0.94);
    let gate = select(1.0, smoothstep(cutoff, cutoff + 0.045, alpha), cutoff > 0.0001);
    opacity = clamp(pow(alpha * gate, max(params.cloud.z, 0.001)) * params.cloud.w, 0.0, 1.0);
  }
  textureStore(rayDistance, id.xy, vec4<f32>(opacity, params.cloud.xy, distance));
}
