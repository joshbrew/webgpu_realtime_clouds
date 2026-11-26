@group(3) @binding(0) var<uniform> shaftFrame: CloudShaftFrame;
@group(3) @binding(1) var shaftMaskOut: texture_storage_2d<rgba16float, write>;

// Normalize the altitude of each blocker along the sun ray for the
// opacity-weighted depth moment in the shadow map.
fn cloudShaftBlockerHeight(point: vec3<f32>) -> f32 {
  return clamp((cloudShaftAltitude(point, shaftFrame.up.w) - shaftFrame.right.w) /
    max(shaftFrame.air.z, .001), 0.0, 1.0);
}

fn cloudShaftColumnUV(id: vec2<u32>, dims: vec2<u32>) -> vec2<f32> {
  return (vec2<f32>(id) + .5) * (2.0 / vec2<f32>(dims)) - 1.0;
}

fn cloudShaftColumnNeeded(uv: vec2<f32>, size: u32) -> bool {
  // Keep the full filter footprint at mip 3, including its outer ring taps.
  let radius = sqrt(CLOUD_SHAFT_SUPPORT_SQUARED) + 60.0 / f32(size);
  return dot(uv, uv) <= radius * radius;
}

fn cloudShaftColumn(uv: vec2<f32>) -> vec3<f32> {
  let p = uv * shaftFrame.center.w;
  return shaftFrame.center.xyz + shaftFrame.right.xyz * p.x + shaftFrame.up.xyz * p.y;
}
