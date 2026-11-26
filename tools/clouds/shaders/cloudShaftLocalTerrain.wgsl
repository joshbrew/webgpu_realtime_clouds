@group(0) @binding(5) var cloudShaftMask: texture_2d<f32>;
@group(0) @binding(6) var<uniform> shaftFrame: CloudShaftFrame;
@group(0) @binding(7) var shaftTerrainDepth: texture_depth_2d;
@group(0) @binding(8) var shaftTerrainCompare: sampler_comparison;
@group(0) @binding(9) var<uniform> shaftTerrainFrame: RegionShadowFrame;

fn cloudShaftTerrainSun(point: vec3<f32>) -> f32 {
  let frame = shaftTerrainFrame;
  if (frame.sampling.w < .5) { return 1.0; }
  let projected = region_shadow_clip(frame, point);
  let uv = projected.xy * vec2<f32>(.5, -.5) + .5;
  let border = min(uv, 1.0 - uv);
  let edge = smoothstep(0.0, .045, min(border.x, border.y));
  if (edge <= .001 || projected.z < 0.0 || projected.z > 1.0) { return 1.0; }
  let bias = frame.sampling.y * frame.sampling.z * .24;
  return mix(1.0, textureSampleCompareLevel(shaftTerrainDepth, shaftTerrainCompare, uv, projected.z - bias), edge);
}

