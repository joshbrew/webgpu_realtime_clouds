// Trace celestial detail in the rotating sky frame. The caller supplies
// the original elevation for the atmospheric fade at the ground horizon.
fn flatNightRay(ray: vec3<f32>, heading: vec2<f32>, sinElevation: f32) -> vec3<f32> {
  let cosElevation = sqrt(max(0.0, 1.0 - sinElevation * sinElevation));
  let horizontal = dot(ray.xz, heading);
  return vec3<f32>(dot(ray.xz, vec2<f32>(heading.y, -heading.x)),
    ray.y * cosElevation - horizontal * sinElevation,
    horizontal * cosElevation + ray.y * sinElevation);
}
fn sceneNightAmount(elevation: f32) -> f32 {
  return 1.0 - smoothstep(-.40, -.18, elevation);
}

fn nightHash(cell: vec2<i32>, salt: u32) -> f32 {
  var h = (u32(cell.x) * 374761393u) ^ (u32(cell.y) * 668265263u) ^ (salt * 2246822519u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  return f32((h ^ (h >> 16u)) & 0x00ffffffu) / 16777216.0;
}

fn galaxyNoise(p: vec3<f32>) -> f32 {
  let cell = vec3<i32>(floor(p));
  let f = fract(p);
  let t = f * f * f * (f * (6.0 * f - 15.0) + 10.0);
  // Salt each depth slice independently. Interpolation keeps the field
  // continuous across slices and across the celestial longitude seam.
  let a = u32(cell.z) * 1013u + 73u;
  let b = a + 1013u;
  let low = mix(
    mix(nightHash(cell.xy, a), nightHash(cell.xy + vec2<i32>(1, 0), a), t.x),
    mix(nightHash(cell.xy + vec2<i32>(0, 1), a), nightHash(cell.xy + vec2<i32>(1, 1), a), t.x), t.y);
  let high = mix(
    mix(nightHash(cell.xy, b), nightHash(cell.xy + vec2<i32>(1, 0), b), t.x),
    mix(nightHash(cell.xy + vec2<i32>(0, 1), b), nightHash(cell.xy + vec2<i32>(1, 1), b), t.x), t.y);
  return mix(low, high, t.z);
}

fn nightGalacticLatitude(ray: vec3<f32>) -> f32 {
  return dot(ray, vec3<f32>(.253, .817, -.518));
}

fn nightGalacticPlane(ray: vec3<f32>) -> vec2<f32> {
  return vec2<f32>(dot(ray, vec3<f32>(.769, .155, .622)), dot(ray, vec3<f32>(-.587, .556, .588)));
}

fn milkyWayRadiance(ray: vec3<f32>) -> vec3<f32> {
  let latitude = nightGalacticLatitude(ray);
  let band = 1.0 - smoothstep(.17, .31, abs(latitude));
  if (band <= 0.0) { return vec3<f32>(0.0); }

  // Latitude shapes the disk. Sample its contents in 3D around the celestial
  // sphere so star clouds have comparable scales along and across the disk.
  let mass = galaxyNoise(ray * 14.0 + vec3<f32>(4.3, -8.7, 2.5));
  let clouds = galaxyNoise(ray * 42.0 + vec3<f32>(-2.9, 17.3, 11.0));
  let knots = galaxyNoise(ray * 97.0 + vec3<f32>(14.2, 3.0, -6.4));
  let grain = galaxyNoise(ray * 201.0 + vec3<f32>(-25.3, -2.4, 8.1));
  let brightness = smoothstep(.26, .79, .31 * mass + .35 * clouds + .23 * knots + .11 * grain);
  let latitudeOffset = latitude + (mass - .5) * .041;
  let disk = exp(-latitudeOffset * latitudeOffset / mix(.006, .015, mass));

  let facingCore = max(0.0, dot(nightGalacticPlane(ray), vec2<f32>(.939, .344)));
  let bulge = pow(facingCore, 9.0) * exp(-latitude * latitude * 90.0);
  let core = pow(facingCore, 25.0) * disk;

  let dustField = galaxyNoise(ray * 37.0 + vec3<f32>(-11.0, 3.1, 21.5));
  let obscuration = smoothstep(.36, .73, .60 * dustField + .26 * knots + .14 * grain);
  let dustBelt = exp(-latitudeOffset * latitudeOffset * 128.0);
  let transmission = 1.0 - obscuration * (.24 + .61 * dustBelt);

  let diffuse = vec3<f32>(.012, .020, .036) * disk;
  let starClouds = vec3<f32>(.043, .062, .092) * disk * brightness * (.28 + .72 * brightness);
  let warm = vec3<f32>(.090, .067, .059) * bulge * brightness
    + vec3<f32>(.115, .087, .062) * core * clouds * brightness;
  return (diffuse + (starClouds + warm) * transmission) * band;
}

fn sceneNightGradient(ray: vec3<f32>, height: f32, skyTint: vec3<f32>, detail: bool) -> vec3<f32> {
  let horizon = exp(-max(height, 0.0) * 5.0);
  let lowGlow = mix(vec3<f32>(.018, .016, .050), vec3<f32>(.010, .035, .061),
    smoothstep(-.75, .8, ray.x + ray.z * .45));
  var color = mix(vec3<f32>(.0034, .007, .025), lowGlow, horizon);
  if (detail) {
    color += milkyWayRadiance(ray) * mix(.65, 1.0, smoothstep(0.0, .24, height));
  }
  // Honor the selected look without losing the night sky's blue-hour colors.
  let tint = clamp(skyTint / max(.14, dot(skyTint, vec3<f32>(.2126, .7152, .0722))),
    vec3<f32>(.30), vec3<f32>(2.0));
  return color * mix(vec3<f32>(1.0), tint, .37);
}

fn nightStarLayer(uv: vec2<f32>, cells: f32, latitudeScale: f32, pixelAngle: f32,
    seconds: f32, chance: f32, brightLayer: bool) -> vec3<f32> {
  let p = uv * cells;
  var cell = vec2<i32>(floor(p));
  cell.x = ((cell.x % i32(cells)) + i32(cells)) % i32(cells);
  let salt = select(37u, 113u, brightLayer);
  let rank = nightHash(cell, salt);
  if (rank >= chance) { return vec3<f32>(0.0); }

  let center = vec2<f32>(nightHash(cell, salt + 1u), nightHash(cell, salt + 2u)) * .56 + .22;
  let offset = (fract(p) - center) * vec2<f32>(latitudeScale, 1.0);
  let distance = dot(offset, offset);
  let strength = nightHash(cell, salt + 3u);
  let radius = select(.033, .050, brightLayer) * mix(.64, 1.38, strength);
  let footprint = pixelAngle * (cells / 6.2831853);
  let broadened = sqrt(radius * radius + footprint * footprint * .64);
  let energy = radius * radius / (broadened * broadened);
  let starCore = exp(-distance / (broadened * broadened)) * energy;
  let haloRadius = select(.088, .116, brightLayer);
  let halo = exp(-distance / (haloRadius * haloRadius)) * select(.09, .13, brightLayer);
  var glint = 0.0;
  if (brightLayer && strength > .72) {
    let flare = abs(offset);
    let arms = max(exp(-flare.x * 10.0 - flare.y * 66.0), exp(-flare.y * 10.0 - flare.x * 66.0));
    glint = arms * (1.0 - smoothstep(.10, .23, sqrt(distance))) * .19;
  }
  let hue = nightHash(cell, salt + 4u);
  let color = mix(vec3<f32>(.63, .81, 1.0), vec3<f32>(1.0, .76, .55), smoothstep(.35, .93, hue));
  let phase = nightHash(cell, salt + 5u) * 6.2831853;
  let sparkle = select(.37, .63, brightLayer);
  let scintillation = 1.0 + sparkle * sin(seconds * mix(2.2, 6.1, strength) + phase)
    + .16 * sin(seconds * mix(6.2, 10.1, hue) - phase * 1.3);
  let luminosity = mix(.11, .58, strength * strength) * select(1.0, 3.5, brightLayer);
  return color * (starCore + halo + glint) * luminosity * scintillation;
}

fn sceneNightStars(ray: vec3<f32>, height: f32, pixelAngle: f32, seconds: f32) -> vec3<f32> {
  let latitude = clamp(nightGalacticLatitude(ray), -1.0, 1.0);
  let latitudeScale = sqrt(1.0 - latitude * latitude);
  let plane = nightGalacticPlane(ray);
  let longitude = atan2(plane.y, plane.x);
  let uv = vec2<f32>(longitude / 6.2831853 + .5, asin(latitude) / 6.2831853 + .25);
  let disk = exp(-latitude * latitude * 82.0);
  let core = pow(max(0.0, dot(plane, vec2<f32>(.939, .344))), 6.0);
  let visibility = mix(.28, 1.0, smoothstep(0.0, .20, height)) * smoothstep(.08, .31, latitudeScale);
  let faint = nightStarLayer(uv, 420.0, latitudeScale, pixelAngle, seconds, .14 + disk * (.30 + .10 * core), false);
  let bright = nightStarLayer(uv + vec2<f32>(.092, .063), 168.0, latitudeScale, pixelAngle, seconds, .077, true);
  var clusters = vec3<f32>(0.0);
  if (disk > .20) {
    let density = galaxyNoise(ray * 44.0 + vec3<f32>(8.0, -1.5, 13.0));
    let cluster = disk * smoothstep(.37, .73, density);
    clusters = nightStarLayer(uv + vec2<f32>(.016, .11), 816.0, latitudeScale, pixelAngle, seconds,
      .34 * cluster, false) * (.31 + .24 * core) * smoothstep(.20, .55, disk);
  }
  return (faint + bright + clusters) * visibility;
}

