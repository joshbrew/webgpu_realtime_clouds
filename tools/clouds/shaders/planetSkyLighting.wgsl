// Fade the shared near-surface sky into the native globe atmosphere at altitude.
struct PlanetSkyLook {
  sky: vec3<f32>,
  solar: vec3<f32>,
  weight: f32,
  solarWeight: f32,
}

fn planetTwilightSun(elevation: f32) -> vec3<f32> {
  let tinted = sceneSolarColor(elevation) * frame.solarLook.rgb;
  return mix(tinted, tinted.r * vec3<f32>(1.0, .86, .69), .26);
}

fn planetSkyLook(ray: vec3<f32>, up: vec3<f32>, air: f32, visible: f32,
    sunElevation: f32, dip: f32, pixel: f32) -> PlanetSkyLook {
  let nearSun = max(dot(ray, sun()), 0.0);
  let atmosphere = clamp(air, 0.0, 1.0);
  let horizonLight = smoothstep(-.15, .03, sunElevation + dip);
  let twilight = 1.0 - smoothstep(.14, .62, sunElevation);
  let look = clamp(frame.skyLook.w, 0.0, 1.0);
  let weight = .86 * look * smoothstep(.04, .62, atmosphere) * mix(twilight, 1.0, look) * horizonLight;
  let gradient = sceneSkyGradient(dot(up, ray), nearSun, sunElevation) * frame.skyLook.rgb;
  let solarTint = planetTwilightSun(sunElevation);
  let bloom = clamp(frame.solarLook.w, 0.0, 2.0);
  let glare = sceneSolarHalo(nearSun) * bloom / .18 * horizonLight * atmosphere;
  let chord = sqrt(max(0.0, 2.0 * (1.0 - nearSun)));
  let edge = max(.0016, pixel);
  let disk = 1.0 - smoothstep(max(0.0, .008 - edge), .008 + edge, chord);
  let light = solarTint * (min(glare * .82, 1.4) + 2.2 * disk * visible);
  return PlanetSkyLook(gradient * (air * weight), light, weight,
    smoothstep(.035, .42, atmosphere) * mix(.64, 1.0, look));
}

fn planetFluidWeight(air: f32, elevation: f32) -> f32 {
  return step(.99, frame.skyLook.w) * smoothstep(.04, .87, air) * sceneTwilightWeight(elevation);
}

fn planetFluidSkyDisplay(ray: vec3<f32>, up: vec3<f32>, air: f32, diskVisible: f32,
    elevation: f32, nativeRadiance: vec3<f32>, opaqueAir: f32) -> vec3<f32> {
  let height = dot(up, ray);
  let skyRay = planetNightRay(ray);
  let pixelAngle = max(length(dpdx(ray)), length(dpdy(ray)));
  let night = sceneNightAmount(elevation);
  let starsVisible = max(night, 1.0 - clamp(opaqueAir, 0.0, 1.0)) * diskVisible;
  var stars = vec3<f32>(0.0);
  if (starsVisible > .001) {
    let nightAnimation = vec3<f32>(frame.ocean.w, frame.aerial.zw);
    stars = (sceneNightStars(skyRay, height, pixelAngle, nightAnimation.x)
      + sceneConstellation(skyRay, pixelAngle, nightAnimation)) * starsVisible;
  }
  let nativeDisplay = sceneHighlightRolloff(pow(clamp(nativeRadiance + stars, vec3<f32>(0.0), vec3<f32>(1.0)),
    vec3<f32>(1.0 / 2.2)), frame.tone.y) * smoothstep(0.0, .35, frame.ocean.y);
  let weight = planetFluidWeight(air, elevation);
  var color = nativeDisplay;
  if (weight > 0.0) {
    let sunward = max(dot(ray, sun()), 0.0);
    let solar = sceneSolarColor(elevation) * frame.solarLook.rgb;
    let haze = sceneSunlitHaze(height, sunward, elevation) * (1.0 - exp(-.19 * frame.aerial.x)) * frame.aerial.y;
    let radiance = sceneSkyRadiance(height, sunward, elevation, frame.skyLook.rgb, solar,
      frame.solarLook.w, diskVisible) + solar * haze;
    color = mix(color, sceneDisplayWithRolloff(radiance + stars, frame.ocean.y, frame.ocean.z, frame.tone.y), weight);
  }
  let nightAir = night * smoothstep(.04, .75, air);
  if (nightAir > 0.0) {
    let nightSky = sceneNightGradient(skyRay, height, frame.skyLook.rgb, diskVisible > .001)
      * mix(.52, 1.0, diskVisible);
    color = mix(color, sceneDisplayWithRolloff(nightSky + stars, frame.ocean.y, frame.ocean.z, frame.tone.y), nightAir);
  }
  return sceneDisplayContrast(color, frame.tone.x);
}

fn planetFluidSurfaceDisplay(color: vec3<f32>, nativeSky: vec3<f32>, ray: vec3<f32>, distance: f32,
    aerialFog: f32, directLight: f32) -> vec3<f32> {
  let shaded = color * sceneCloudShadowGain(vec3<f32>(directLight), frame.tone.z);
  let up = normalize(frame.eye.xyz);
  let elevation = dot(up, sun());
  let overhead = planetOverheadFog(frame.eye.xyz, ray, distance, frame.eye.w, 75000.0, frame.aerial.x, frame.air.w);
  let overheadColor = planetOverheadRadiance(ray, sun(), elevation, frame.skyLook.rgb, frame.solarLook.rgb);
  let nativeFogged = mix(mix(shaded, nativeSky, aerialFog), overheadColor, overhead);
  let nativeDisplay = sceneHighlightRolloff(pow(nativeFogged, vec3<f32>(1.0 / 2.2)), frame.tone.y)
    * smoothstep(0.0, .35, frame.ocean.y);
  let air = exp(-max(0.0, length(frame.eye.xyz) - frame.eye.w) / 18000.0) * frame.air.w;
  let weight = planetFluidWeight(air, elevation);
  let night = sceneNightAmount(elevation) * smoothstep(.04, .75, air);
  if (max(weight, night) == 0.0) { return sceneDisplayContrast(nativeDisplay, frame.tone.x); }
  let horizon = normalize(ray + up * (.13 - dot(up, ray)));
  let sunward = max(dot(ray, sun()), 0.0);
  let horizonSun = max(dot(horizon, sun()), 0.0);
  let solar = sceneSolarColor(elevation) * frame.solarLook.rgb;
  // Integrate broad scattering along the view to the terrain. The disk and
  // its sharp glare are only drawn by the sky pass.
  let scatter = sceneSunlitHaze(dot(up, ray), sunward, elevation) * frame.aerial.y;
  let glowVisibility = sceneTerrainGlowVisibility(distance);
  let sky = sceneSkyGradient(dot(up, horizon), horizonSun * glowVisibility, elevation) * frame.skyLook.rgb
    + solar * (sceneSolarHaze(horizonSun) * (frame.solarLook.w / .18) + scatter) * glowVisibility;
  let surface = sceneDisplayWithRolloff(mix(mix(shaded, sky * .83, aerialFog), overheadColor, overhead), frame.ocean.y, frame.ocean.z, frame.tone.y);
  let dayDisplay = mix(nativeDisplay, surface, weight);
  if (night == 0.0) { return sceneDisplayContrast(dayDisplay, frame.tone.x); }
  let nightSky = sceneNightGradient(planetNightRay(horizon), dot(up, horizon), frame.skyLook.rgb, false);
  let nightSurface = sceneDisplayWithRolloff(mix(mix(shaded, nightSky * .83, aerialFog), overheadColor, overhead), frame.ocean.y, frame.ocean.z, frame.tone.y);
  return sceneDisplayContrast(mix(dayDisplay, nightSurface, night), frame.tone.x);
}

struct PlanetWaterLighting {
  sky: vec3<f32>,
  sun: vec3<f32>,
}

fn planetWaterLighting(radial: vec3<f32>, reflected: vec3<f32>, day: f32,
    nativeSky: vec3<f32>, nativeSun: vec3<f32>) -> PlanetWaterLighting {
  let altitude = max(0.0, length(frame.eye.xyz) - frame.eye.w);
  let air = exp(-altitude / 18000.0) * frame.air.w;
  let daylight = smoothstep(-.10,.04,day);
  let weight = frame.skyLook.w * smoothstep(.04,.62,air) * daylight;
  if (weight == 0.0) {
    let night = sceneNightAmount(day) * smoothstep(.04, .75, air);
    if (night > 0.0) {
      let nightSky = sceneNightGradient(planetNightRay(reflected), dot(reflected, radial), frame.skyLook.rgb, false);
      return PlanetWaterLighting(mix(nativeSky, nightSky, night), nativeSun * (1.0 - night));
    }
    return PlanetWaterLighting(nativeSky, nativeSun);
  }

  let nearSun = max(dot(reflected,sun()),0.0);
  let gradient = sceneSkyGradient(dot(reflected,radial),nearSun,day) * frame.skyLook.rgb;
  let solar = planetTwilightSun(day);
  let haze = (sceneSolarHalo(nearSun) - sceneSolarGlare(nearSun)) * frame.solarLook.w * 1.2;
  return PlanetWaterLighting(mix(nativeSky,gradient * .66 + solar * haze,weight * .78),
    mix(nativeSun,solar,weight * .41));
}
