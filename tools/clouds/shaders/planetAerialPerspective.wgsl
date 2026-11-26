// Measure air along the actual view. Looking down from thin air still
// reveals the denser column above terrain and clouds.
fn planetOverheadFog(eye: vec3<f32>, ray: vec3<f32>, distance: f32, radius: f32,
    airHeight: f32, haze: f32, density: f32) -> f32 {
  if (haze <= .001 || density <= .001 || airHeight <= 0.0 || distance <= 0.0) { return 0.0; }
  let eyeRadius = length(eye);
  let eyeAltitude = eyeRadius - radius;
  let down = -dot(eye / max(eyeRadius, .001), ray);
  let overhead = smoothstep(.016 * airHeight, .16 * airHeight, eyeAltitude)
    * smoothstep(-.045, .40, down);
  if (overhead <= .0001) { return 0.0; }

  let surface = eye + ray * distance;
  let surfaceRadius = length(surface);
  let scaleHeight = airHeight * .105;
  let top = radius + scaleHeight * 8.0;
  if (surfaceRadius >= top) { return 0.0; }
  // Start at the receiver and end at the camera or the top of the
  // atmosphere. This keeps samples in the atmospheric column from orbit.
  let along = dot(surface, -ray);
  let heightSquared = (top - surfaceRadius) * (top + surfaceRadius);
  let path = min(distance, heightSquared / max(sqrt(along * along + heightSquared) + along, .001));
  var column = 0.0;
  for (var i = 0u; i < 6u; i++) {
    let a = f32(i) / 6.0;
    let b = f32(i + 1u) / 6.0;
    let altitude = length(surface - ray * ((a * a + b * b) * .5 * path)) - radius;
    column += (b * b - a * a) * exp(-max(altitude, 0.0) / scaleHeight);
  }
  let opticalDepth = .29 * haze * clamp(density, 0.0, 1.7) * column * path / scaleHeight;
  return overhead * .88 * (1.0 - exp(-opticalDepth));
}

fn planetOverheadRadiance(ray: vec3<f32>, towardSun: vec3<f32>, elevation: f32,
    skyTint: vec3<f32>, sunTint: vec3<f32>) -> vec3<f32> {
  let sunward = max(dot(ray, towardSun), 0.0);
  let scatter = .08 * sunward * sunward * sceneTwilightWeight(elevation);
  let daylight = sceneSkyGradient(.065, sunward * .72, elevation) * skyTint
    + sceneSolarColor(elevation) * sunTint * scatter;
  return mix(daylight, vec3<f32>(.015, .026, .062) * skyTint, 1.0 - sceneTwilightWeight(elevation));
}
