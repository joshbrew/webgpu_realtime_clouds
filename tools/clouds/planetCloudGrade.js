import { MAX_SCENE_SHADOW_DARKNESS, resolveScenePalette } from './cloudLookPresets.js';
import { planetGasWeatherMode } from './planetCloudStyles.js';

export const PLANET_CLOUD_GRADE_FLOATS = 24;

const neutral = [1, 1, 1];
const daylightShadow = [0.64, 0.75, 0.94];

function bounded(value, fallback, min, max) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function writeColor(data, offset, color, fallback) {
  for (let channel = 0; channel < 3; channel++) {
    data[offset + channel] = bounded(color?.[channel], fallback[channel], 0, 4);
  }
}

// Keep the existing HDR params as the source of light intensity. The style
// swatches are relative to the selected preset so live edits and saved looks
// both work without applying an unedited preset's tints twice.
export function applyPlanetLightSwatches(params, style, reference) {
  if (!params) return params;
  const result = { ...params };
  const tintFields = {
    sunColor: ['sunTint', 'transmissiveLightTint'],
    frontLightColor: ['sunTint', 'frontLightTint'],
    shadowLightColor: ['volumeShadowTint'],
  };
  for (const [light, fields] of Object.entries(tintFields)) {
    if (!params[light]) continue;
    result[light] = params[light].map((value, channel) => {
      let ratio = 1;
      for (const field of fields) {
        const baseline = bounded(reference?.[field]?.[channel], 1, 0, 4);
        const edited = bounded(style?.[field]?.[channel], baseline, 0, 4);
        ratio *= (edited + .05) / (baseline + .05);
      }
      return ratio === 1 ? value : bounded(value * ratio, value, 0, 4);
    });
  }
  return result;
}

export function resolvePlanetSceneLighting(options, camera) {
  if (options.auroraMode || planetGasWeatherMode(options.cloudStyle) ||
      options.cloudStyle === 'emberstorm' || options.cloudStyle === 'glowing_fissures') {
    return { palette: null, weight: 0 };
  }
  const { style } = options;
  // The planet gradients already apply their pigments at display resolution.
  const overrides = style?.planetGradient
    ? { ...style, cloudLitTint: undefined, cloudShadowTint: undefined, edgeTint: undefined }
    : style;
  const palette = resolveScenePalette(style?.colorPresetId, overrides);
  // Camera altitude changes the air along the view ray. The cloud's
  // illumination and color grade depend on the scene, not the observer.
  const air = camera.atmosphere?.[2] ?? 1;
  const t = Math.max(0, Math.min(1, (air - .04) / (.87 - .04)));
  return { palette, weight: t * t * (3 - 2 * t) };
}

export function writePlanetCloudGrade(data, offset, options) {
  const style = options.style;
  const form = options.tuning?.formType ?? 0;
  const weather = !options.auroraMode && !planetGasWeatherMode(options.cloudStyle) &&
    options.cloudStyle !== 'emberstorm' && options.cloudStyle !== 'glowing_fissures' && form > 0 && form < 4.5;
  writeColor(data, offset, style?.cloudLitTint, neutral);
  data[offset + 3] = bounded(style?.styleColorLift, 1, .2, 2.5);
  writeColor(data, offset + 4, style?.cloudShadowTint, daylightShadow);
  data[offset + 7] = bounded(style?.styleShadowDarkness, 0, 0, MAX_SCENE_SHADOW_DARKNESS);
  writeColor(data, offset + 8, style?.edgeTint, neutral);
  data[offset + 11] = bounded(style?.styleRimStrength, .1, 0, 2);
  data[offset + 12] = bounded(style?.styleShadowStrength, 1, 0, 4);
  data[offset + 13] = bounded(style?.styleShadowEdge, .25, 0, 2.2);
  data[offset + 14] = bounded(style?.styleMidLift, 1, .2, 2.5);
  data[offset + 15] = options.localPalette ? .69 :
    weather ? (style?.planetGradient ? .82 : style?.colorPresetSource ? .64 : .38) : 0;
  data[offset + 16] = bounded(style?.exposure, 1.18, 0, 3) / 1.18;
  const saturation = bounded(style?.styleSaturation, 1, 0, 2.2);
  data[offset + 17] = weather ? saturation : Math.min(2.2, saturation * 1.16);
  data[offset + 18] = bounded(style?.styleSunBleed, .1, 0, 1);
  data[offset + 19] = bounded(style?.planetGradient?.pivot, 0, 0, .8);
  writeColor(data, offset + 20, style?.cloudMidTint ?? style?.transmissiveLightTint, neutral);
  data[offset + 23] = bounded(style?.planetGradient?.feather, .2, .04, .6);
}
