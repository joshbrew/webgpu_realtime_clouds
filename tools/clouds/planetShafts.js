import { MAX_SCENE_HAZE, MAX_SCENE_SHAFT_STRENGTH, MAX_SCENE_SHADOW_DARKNESS, sceneLightingValues } from './cloudLookPresets.js';

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(low, high, value) {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
}

export function resolvePlanetShafts(style, radius, airHeight, camera, sun, atmosphere, base, top) {
  const { exposure, godRayStrength, haze, styleShadowDarkness } = sceneLightingValues(style);
  if (!(godRayStrength > 0) || !(exposure > 0)) return null;

  const cameraRadius = Math.max(Math.hypot(...camera), .001);
  const elevation = sun.reduce((sum, value, axis) => sum + value * camera[axis], 0) / cameraRadius;
  const groundRadius = radius / cameraRadius;
  const clearance = elevation + Math.sqrt(Math.max(0, 1 - groundRadius * groundRadius));
  const altitude = cameraRadius - radius;
  const thickness = Math.max(.05, top - base);
  // Haze sets the scattering strength in both demos. The world atmosphere
  // only cuts the shafts back on worlds with very little air.
  const hasAir = smoothstep(.015, .25, atmosphere?.[2] ?? 1);
  // Only fade here at the planet's limb. The integrator handles twilight.
  const limb = smoothstep(-.025, -.005, clearance);
  // Local shadow detail fades into the global aerial perspective at orbital distances.
  const visibility = (1 - smoothstep(airHeight * .55, airHeight * 1.55, altitude))
    * hasAir * limb * Math.min(1, exposure / .45);
  if (visibility <= .001) return null;

  return {
    enabled: true, sun, camera, datum: -radius, elevation, clearance, atmosphere, airHeight, visibility, base, thickness,
    reach: airHeight * .75,
    strength: clamp(godRayStrength, 0, MAX_SCENE_SHAFT_STRENGTH),
    length: clamp(style?.godRayLength ?? 1, .12, 2),
    decay: clamp(style?.godRayFalloff ?? 1.3, .3, 4),
    haze: clamp(haze, 0, MAX_SCENE_HAZE),
    darkness: clamp(styleShadowDarkness, 0, MAX_SCENE_SHADOW_DARKNESS),
  };
}
