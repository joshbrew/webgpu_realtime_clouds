@group(0) @binding(0) var source: texture_2d<f32>;
@group(0) @binding(1) var filteredMask: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var previous: texture_2d<f32>;
@group(0) @binding(3) var<uniform> blendWeight: vec4<f32>;

fn shaftColumn(point: vec2<i32>, limit: vec2<i32>) -> vec2<f32> {
  return textureLoad(source, clamp(point, vec2<i32>(0), limit), 0).rg;
}

fn averagedShaftRing(p: vec2<i32>, a: vec2<i32>, b: vec2<i32>, limit: vec2<i32>) -> vec2<f32> {
  return (shaftColumn(p + a, limit) + shaftColumn(p - a, limit) +
    shaftColumn(p + b, limit) + shaftColumn(p - b, limit)) * .25;
}

@compute @workgroup_size(8, 8)
fn filterCloudShaftMask(@builtin(global_invocation_id) id: vec3<u32>) {
  let dims = textureDimensions(source);
  if (any(id.xy >= dims)) { return; }
  let p = vec2<i32>(id.xy);
  let limit = vec2<i32>(dims) - 1;
  let near = mix(shaftColumn(p, limit), averagedShaftRing(p, vec2<i32>(1, 0), vec2<i32>(0, 1), limit), .24);
  let inner = averagedShaftRing(p, vec2<i32>(4, 0), vec2<i32>(0, 4), limit);
  let outer = averagedShaftRing(p, vec2<i32>(9, 8), vec2<i32>(-8, 9), limit);
  let broad = near * .24 + inner * .44 + outer * .32;
  // Preserve opacity and its premultiplied height moment at both footprints.
  textureStore(filteredMask, p, vec4<f32>(near.x, broad.x, near.y, broad.y));
}

@compute @workgroup_size(8, 8)
fn blendCloudShaftMask(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id.xy >= textureDimensions(filteredMask))) { return; }
  let p = vec2<i32>(id.xy);
  let weight = blendWeight.x;
  var value: vec4<f32>;
  if (weight <= 0.0) {
    value = textureLoad(previous, p, 0);
  } else {
    value = textureLoad(source, p, 0);
    if (weight < 1.0) {
      // Blend the premultiplied height along with opacity. Downsample the
      // result so the compositor still reads a single texture at any LOD.
      value = mix(textureLoad(previous, p, 0), value, weight);
    }
  }
  textureStore(filteredMask, p, value);
}

@compute @workgroup_size(8, 8)
fn downsampleCloudShaftMask(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id.xy >= textureDimensions(filteredMask))) { return; }
  let p = vec2<i32>(id.xy) * 2;
  let filtered = textureLoad(source, p, 0) + textureLoad(source, p + vec2<i32>(1, 0), 0)
    + textureLoad(source, p + vec2<i32>(0, 1), 0) + textureLoad(source, p + vec2<i32>(1, 1), 0);
  textureStore(filteredMask, vec2<i32>(id.xy), filtered * .25);
}
