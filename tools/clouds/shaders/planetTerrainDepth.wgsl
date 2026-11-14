struct DepthParams {
  scaledNear: f32,
  nearOverFar: f32,
  tanHalfFov: vec2<f32>,
  cloud: vec4<f32>,
  cutoff: f32,
  terrainCoverage: f32,
  reconstructClouds: f32,
}

@group(0) @binding(0) var sceneDepth: texture_depth_2d;
@group(0) @binding(1) var rayDistance: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> params: DepthParams;
@group(0) @binding(3) var cloudColor: texture_2d_array<f32>;
@group(0) @binding(4) var cloudSampler: sampler;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let size = textureDimensions(rayDistance);
  if (any(id.xy >= size)) { return; }
  let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(size);
  let srcSize = textureDimensions(sceneDepth);
  let src = min(vec2<u32>(uv * vec2<f32>(srcSize)), srcSize - 1u);
  var depth = textureLoad(sceneDepth, vec2<i32>(src), 0);
  var coverage = select(0.0, 1.0, depth < 1.0);
  if (any(srcSize > size)) {
    // Gather nearest terrain and the fraction of this cloud pixel it covers.
    let low = min(id.xy * srcSize / size, srcSize - 1u);
    let high = min(((id.xy + 1u) * srcSize - 1u) / size, srcSize - 1u);
    let corners = vec4<f32>(
      textureLoad(sceneDepth, vec2<i32>(low), 0),
      textureLoad(sceneDepth, vec2<i32>(i32(high.x), i32(low.y)), 0),
      textureLoad(sceneDepth, vec2<i32>(i32(low.x), i32(high.y)), 0),
      textureLoad(sceneDepth, vec2<i32>(high), 0)
    );
    depth = min(depth, min(min(corners.x, corners.y), min(corners.z, corners.w)));
    coverage = (coverage + dot(select(vec4<f32>(0.0), vec4<f32>(1.0), corners < vec4<f32>(1.0)), vec4<f32>(1.0))) * 0.2;
  }
  var distance = 0.0;
  if (depth < 1.0) {
    let viewDistance = params.scaledNear / (1.0 - depth + depth * params.nearOverFar);
    let ray = vec3<f32>((2.0 * uv - 1.0) * params.tanHalfFov, 1.0);
    distance = viewDistance * length(ray);
  }
  var opacity = 0.0;
  if (params.cloud.w > 0.0) {
    var alpha: f32;
    if (params.reconstructClouds > 0.5) {
      alpha = reconstructCloudOverlay(cloudColor, cloudSampler, uv, 0.0).a;
    } else {
      alpha = textureSampleLevel(cloudColor, cloudSampler, uv, 0, 0.0).a;
    }
    opacity = clamp(cloudOverlayOpacity(alpha, params.cutoff, params.cloud.z, params.cloud.w), 0.0, 1.0);
  }
  // Aurora uses RGB for foreground cloud opacity and shell radii.
  // A negative radius tags coverage data for the cloud marcher.
  let channels = select(vec3<f32>(opacity, params.cloud.xy), vec3<f32>(coverage, -1.0, 0.0), params.terrainCoverage > 0.5);
  textureStore(rayDistance, id.xy, vec4<f32>(channels, distance));
}
