struct CloudShaftFrame {
  center: vec4<f32>, // projection center and half width
  right: vec4<f32>,  // light-space horizontal axis and cloud base
  up: vec4<f32>,    // light-space vertical axis and spherical datum (negative radius for planet-centered coordinates)
  air: vec4<f32>,   // reach, cloud-base fade width, thickness, and reference scatter distance
}

const CLOUD_SHAFT_SUPPORT_SQUARED: f32 = .92;

fn cloudShaftAltitude(point: vec3<f32>, datum: f32) -> f32 {
  if (datum < 0.0) { return length(point) + datum; }
  if (datum == 0.0) { return point.y; }
  let r2 = dot(point.xz, point.xz);
  let y = datum + point.y;
  return point.y + r2 / max(sqrt(y * y + r2) + y, .001);
}

fn cloudShaftSphere(origin: vec3<f32>, direction: vec3<f32>, datum: f32, height: f32) -> vec2<f32> {
  let y = origin.y - height;
  let sphereRadius = -datum + height;
  let distanceFromCenter = length(origin);
  let c = select(dot(origin.xz, origin.xz) + y * (2.0 * (datum + height) + y),
    (distanceFromCenter - sphereRadius) * (distanceFromCenter + sphereRadius), datum < 0.0);
  let b = select(dot(origin, direction) + datum * direction.y, dot(origin, direction), datum < 0.0);
  let disc = b * b - c;
  if (disc < 0.0) { return vec2<f32>(1.0, -1.0); }
  let root = sqrt(disc);
  let far = -b + root;
  let near = -b - root;
  if (b < 0.0 && abs(far) > .0001) { return vec2<f32>(c / far, far); }
  if (b > 0.0 && abs(near) > .0001) { return vec2<f32>(near, c / near); }
  return vec2<f32>(near, far);
}

fn cloudShaftSunwardShell(origin: vec3<f32>, sun: vec3<f32>, datum: f32,
    bottom: f32, thickness: f32) -> vec2<f32> {
  let outer = cloudShaftSphere(origin, sun, datum, bottom + thickness);
  if (outer.x >= outer.y) { return outer; }
  let inner = cloudShaftSphere(origin, sun, datum, bottom);
  // As a light ray begins to graze the inner shell, its entrance approaches
  // the chord midpoint. Continue that interval through the limb.
  let midpoint = (outer.x + outer.y) * .5;
  return vec2<f32>(select(midpoint, inner.y, inner.x <= inner.y), outer.y);
}
