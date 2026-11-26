// One angular cell per figure keeps the night pass bounded regardless of the
// number of constellations. Points are tangent-plane offsets in radians.
fn sceneConstellation(ray: vec3<f32>, pixelAngle: f32, animation: vec3<f32>) -> vec3<f32> {
  let longitude = atan2(ray.x, ray.z);
  let latitude = asin(clamp(ray.y, -1.0, 1.0));
  let row = round(latitude / .78539816);
  let column = round(longitude / .78539816);
  if (abs(row) > 1.0) { return vec3<f32>(0.0); }

  let lat = row * .78539816;
  let lon = column * .78539816;
  let delta = longitude - lon;
  let tangent = vec2<f32>(cos(latitude) * sin(delta),
    sin(latitude) * cos(lat) - cos(latitude) * sin(lat) * cos(delta));
  if (any(abs(tangent) > vec2<f32>(.116))) { return vec3<f32>(0.0); }

  let index = u32((row + 1.0) * 8.0) + u32((i32(column) + 8) % 8);
  let range = constellationRanges[index];
  let footprint = max(.0008, pixelAngle * .68);
  var stars = 0.0;
  for (var i = range.x; i < range.y; i++) {
    let offset = tangent - constellationPoints[i];
    let energy = dot(offset, offset);
    let pulse = .86 + .50 * sin(animation.x * (3.5 + f32(i % 7u) * .52) + f32(i) * 2.37);
    stars += pulse * (exp(-energy / (footprint * footprint)) * 1.7 + .12 * exp(-energy / .000018));
  }
  var lines = 0.0;
  if (animation.y == f32(index + 1u) && animation.z > 0.0) {
    let lineWidth = max(.00048, pixelAngle * .39);
    for (var i = range.z; i < range.w; i++) {
      let a = constellationSegments[i * 2u];
      let edge = constellationSegments[i * 2u + 1u] - a;
      let offset = tangent - a;
      let t = clamp(dot(offset, edge) / dot(edge, edge), 0.0, 1.0);
      let perpendicular = offset - edge * t;
      lines = max(lines, exp(-dot(perpendicular, perpendicular) / (lineWidth * lineWidth)));
    }
  }
  return vec3<f32>(.83, .90, 1.0) * stars + vec3<f32>(.28, .55, .85) * lines * animation.z * .46;
}
