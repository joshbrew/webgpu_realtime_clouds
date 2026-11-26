// Shared daylight and sunset profile from Fluid Clouds. Radiance is linear.
fn sceneSolarColor(elevation: f32) -> vec3<f32> {
  return mix(vec3<f32>(1.83, 0.79, 0.32), vec3<f32>(1.42, 1.20, 0.93), smoothstep(0.085, 0.54, elevation));
}

fn sceneSkyGradient(height: f32, nearSun: f32, sunElevation: f32) -> vec3<f32> {
  let dusk = 1.0 - smoothstep(0.07, 0.44, sunElevation);
  let coolHaze = mix(vec3<f32>(0.34, 0.46, 0.61), vec3<f32>(0.24, 0.23, 0.35), dusk);
  let warmHaze = mix(vec3<f32>(0.63, 0.50, 0.39), vec3<f32>(0.65, 0.32, 0.21), dusk);
  let horizon = mix(coolHaze, warmHaze, pow(nearSun, 14.0));
  let blue = mix(vec3<f32>(0.105, 0.24, 0.42), vec3<f32>(0.064, 0.13, 0.26), dusk);
  return mix(horizon, blue, 1.0 - exp(-max(height, 0.0) * 5.2));
}

fn sceneTerrainFog(distanceMeters: f32, height: f32, air: f32) -> f32 {
  let horizon = 1.0 + min(0.0, height);
  let reach = mix(54000.0, 30000.0, exp(-abs(height) * 7.0));
  return clamp(.22 * air * horizon * horizon * (1.0 - exp(-distanceMeters / reach)), 0.0, .80);
}

// Short paths to opaque terrain carry little forward-scattered sunlight.
fn sceneTerrainGlowVisibility(distanceMeters: f32) -> f32 {
  return smoothstep(350.0, 9000.0, distanceMeters);
}

fn sceneHazeAmbient(elevation: f32) -> vec3<f32> {
  let dusk = 1.0 - smoothstep(.085, .50, elevation);
  return mix(vec3<f32>(.21, .29, .40), vec3<f32>(.12, .17, .27), dusk);
}

fn sceneAirScatterPhase(sunward: f32) -> f32 {
  return .42 * pow(sunward, 7.0) + 1.32 * pow(sunward, 26.0);
}

fn sceneSunlitHaze(height: f32, sunward: f32, elevation: f32) -> f32 {
  let lowSun = 1.0 - smoothstep(.08, .52, elevation);
  return sceneAirScatterPhase(sunward) * exp(-abs(height) * 2.4)
    * mix(.23, .92, lowSun) * sceneTwilightWeight(elevation);
}

fn sceneSolarGlare(nearSun: f32) -> f32 {
  return 0.66 * pow(nearSun, 1400.0);
}

fn sceneSolarDisk(nearSun: f32) -> f32 {
  return smoothstep(0.999955, 0.999981, nearSun);
}

fn sceneSolarHaze(nearSun: f32) -> f32 {
  return 0.10 * pow(nearSun, 19.0) + 0.29 * pow(nearSun, 135.0);
}

fn sceneSolarHalo(nearSun: f32) -> f32 {
  return sceneSolarHaze(nearSun) + sceneSolarGlare(nearSun);
}

fn sceneSkyRadiance(height: f32, nearSun: f32, elevation: f32, skyTint: vec3<f32>,
    solar: vec3<f32>, bloom: f32, diskVisibility: f32) -> vec3<f32> {
  let glow = sceneSolarHalo(nearSun) + 4.0 * sceneSolarDisk(nearSun) * diskVisibility;
  return sceneSkyGradient(height, nearSun, elevation) * skyTint + solar * glow * (bloom / .18);
}

fn sceneDeepShadowAmount(darkness: f32) -> f32 {
  return smoothstep(1.5, 48.0, darkness);
}

fn sceneDeepShadowGain(light: vec3<f32>, darkness: f32) -> f32 {
  let luma = dot(light, vec3<f32>(.2126, .7152, .0722));
  let shade = 1.0 - smoothstep(.18, .62, luma);
  return mix(1.0, .0002, shade * sceneDeepShadowAmount(darkness));
}

fn sceneShaftStrength(setting: f32) -> f32 {
  let slider = clamp(setting, 0.0, 48.0);
  return 4.0 * slider / (1.0 + .25 * slider) + 1.7 * max(slider - 1.5, 0.0);
}

fn sceneCloudShadowGain(light: vec3<f32>, darkness: f32) -> f32 {
  let luma = dot(light, vec3<f32>(.2126, .7152, .0722));
  let shade = 1.0 - smoothstep(.11, .65, luma);
  return sceneDeepShadowGain(light, darkness) / (1.0 + clamp(darkness, 0.0, 6.0) * .85 * shade * shade);
}

// Compress above the midtones with one RGB scale to preserve the highlight hue.
fn sceneHighlightRolloff(color: vec3<f32>, strength: f32) -> vec3<f32> {
  let peak = max(color.r, max(color.g, color.b));
  let knee = .48;
  if (strength <= 0.0 || peak <= knee) { return color; }
  let excess = peak - knee;
  let shoulder = knee + excess / (1.0 + 3.0 * strength * excess);
  return color * (shoulder / peak);
}

fn sceneDisplayContrast(color: vec3<f32>, setting: f32) -> vec3<f32> {
  let contrast = clamp(setting, .5, 2.0);
  if (contrast == 1.0) { return color; }
  let rgb = clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
  let luminance = dot(rgb, vec3<f32>(.2126, .7152, .0722));
  let centered = 2.0 * luminance - 1.0;
  let adjusted = .5 + .5 * centered * contrast / (1.0 + (contrast - 1.0) * abs(centered));
  let chroma = rgb - vec3<f32>(luminance);
  let darkExtent = -min(chroma.r, min(chroma.g, chroma.b));
  let lightExtent = max(chroma.r, max(chroma.g, chroma.b));
  let gamut = min(adjusted / max(darkExtent, .00001), (1.0 - adjusted) / max(lightExtent, .00001));
  return vec3<f32>(adjusted) + chroma * min(1.0, gamut);
}

fn sceneDisplay(color: vec3<f32>, exposure: f32, saturation: f32) -> vec3<f32> {
  return sceneDisplayWithRolloff(color, exposure, saturation, 0.0);
}

fn sceneDisplayWithRolloff(color: vec3<f32>, exposure: f32, saturation: f32, rolloff: f32) -> vec3<f32> {
  let luma = dot(color, vec3<f32>(.2126, .7152, .0722));
  let graded = mix(vec3<f32>(luma), color, saturation);
  let x = sceneHighlightRolloff(max(graded, vec3<f32>(0.0)) * max(exposure, 0.0), rolloff);
  let mapped = x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14);
  return pow(clamp(mapped, vec3<f32>(0.0), vec3<f32>(1.0)), vec3<f32>(0.4545));
}

// Preserve the Fluid reference through blue hour, then fade to native night.
fn sceneTwilightWeight(elevation: f32) -> f32 {
  return smoothstep(-.36, -.18, elevation);
}

fn scenePlanetCloudWeight(elevation: f32) -> f32 {
  // Preserve the native shaping light and palette in daylight. Near dusk
  // the shared atmospheric light contributes more of the cloud color.
  return sceneTwilightWeight(elevation) * mix(.70, .18, smoothstep(.12, .55, elevation));
}

// A local view can retain blue-hour skylight after direct sun drops out.
fn sceneLocalCloudSun(elevation: f32) -> f32 {
  return smoothstep(-.09, -.008, elevation);
}

fn sceneLocalCloudNightWeight(elevation: f32) -> f32 {
  return 1.0 - smoothstep(-.33, -.055, elevation);
}

fn sceneLocalCloudNightFill(skyAccess: f32) -> vec3<f32> {
  let open = clamp(skyAccess, 0.0, 1.0);
  return vec3<f32>(.004, .0065, .013) * mix(.13, 1.0, open * open);
}

struct SceneCloudLight {
  shade: vec3<f32>,
  sky: vec3<f32>,
  directPhase: f32,
  transmissionPhase: f32,
}

fn sceneCloudLighting(elevation: f32, sunward: f32) -> SceneCloudLight {
  let dusk = 1.0 - smoothstep(.075, .50, elevation);
  let shade = mix(vec3<f32>(.17, .218, .267), vec3<f32>(.086, .108, .140), dusk);
  let sky = mix(vec3<f32>(.355, .423, .502), vec3<f32>(.202, .233, .278), dusk);
  let phase = .16 + .32 * pow(sunward, 7.0) + .74 * pow(sunward, 42.0);
  return SceneCloudLight(shade, sky, phase * .91, pow(sunward, 16.0));
}

fn sceneCloudRadiance(light: SceneCloudLight, solar: vec3<f32>, illumination: f32,
    skyVisibility: f32, edge: f32, localTerrain: bool, front: vec3<f32>, shadow: vec3<f32>,
    transmission: vec3<f32>, response: vec3<f32>) -> vec3<f32> {
  let scatteredSun = sqrt(illumination);
  let fill = select(mix(light.shade, light.sky, .26 + .60 * skyVisibility + .14 * scatteredSun),
    mix(light.shade * .74, light.sky, .13 + .72 * skyVisibility + .15 * scatteredSun), localTerrain);
  let diffuse = solar * front * (.11 * scatteredSun);
  let beam = solar * illumination;
  return fill * mix(shadow, front, scatteredSun) * mix(response.y, 1.0, scatteredSun) + diffuse
    + beam * front * (light.directPhase * response.x)
    + beam * transmission * (edge * .23 * light.transmissionPhase * response.z);
}
