import test from 'node:test';
import { atmosphereColors, planetNightRotation, sunDirection } from '../../planet/planet-approach.esm.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GRADE_PRESETS,REFERENCE_LOOK_PRESETS,SCULPTED_LOOK_IDS,FLUID_TWILIGHT_GRADE,resolveScenePalette} from '../cloudLookPresets.js';
import { resolvePlanetCloudGradient } from '../planetCloudGradients.js';
import { applyPlanetLightSwatches, PLANET_CLOUD_GRADE_FLOATS, resolvePlanetSceneLighting, writePlanetCloudGrade } from '../planetCloudGrade.js';

// Exercise the planet's actual palette converter without initializing terrain
// or Babylon. Applying a look must preserve cloud anatomy and sampling budget.
const source=await (Promise.all(['planetStudioPanel.js','noisePlanetTest.js'].map(file => readFile(new URL('../../noise/' + file,import.meta.url),'utf8'))).then(parts => parts.join('\n')));
const registry=source.slice(source.indexOf('export const CLOUD_LIGHTING_COLOR_PRESETS'),source.indexOf('function makeFullNoiseLayer')).replaceAll('export const','const');
const converter=source.slice(source.indexOf('function colorVec3FromPreset'),source.indexOf('function makeNoiseLayerFromMode'));
const convert=new Function('REFERENCE_LOOK_PRESETS','SCULPTED_LOOK_IDS','resolvePlanetCloudGradient','FLUID_TWILIGHT_GRADE',registry+converter+'return cloudColorPresetToConfigPatch;')(REFERENCE_LOOK_PRESETS,SCULPTED_LOOK_IDS,resolvePlanetCloudGradient,FLUID_TWILIGHT_GRADE);

test('the night sky uses the Planet solar orbit axis across a complete turn', () => {
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const reference = sunDirection(0);
  const axis = cross(reference, sunDirection(.25));
  for (const phase of [0, .125, .25, .5, .75, .99999, 1]) {
    const rotation = planetNightRotation(phase);
    const unrotate = ray => {
      const tangent = cross(rotation, ray).map(value => value * 2);
      const remainder = cross(rotation, tangent);
      return ray.map((value, i) => value + rotation[3] * tangent[i] + remainder[i]);
    };
    for (const [actual, expected] of [
      [unrotate(sunDirection(phase)), reference],
      [unrotate(axis), axis],
    ]) {
      assert.ok(actual.every((value, i) => Math.abs(value - expected[i]) < 1e-12));
    }
  }
});

test('the planet seed varies preset atmosphere density while explicit atmospheres stay fixed', () => {
  const defaultAir = atmosphereColors('lakeshore', 'preset');
  const densities = Array.from({length: 64}, (_, seed) => {
    const atmosphere = atmosphereColors('lakeshore', 'preset', seed);
    assert.deepEqual(atmosphere.slice(0, 2), defaultAir.slice(0, 2));
    assert.equal(atmosphereColors('lakeshore', 'preset', seed), atmosphere);
    assert.deepEqual(atmosphereColors('lakeshore', 'thin', seed), atmosphereColors('lakeshore', 'thin'));
    assert.ok(atmosphereColors('ceres', 'preset', seed)[2] < .03);
    return atmosphere[2];
  });
  assert.ok(Math.min(...densities) < defaultAir[2] * .50);
  assert.ok(Math.max(...densities) > defaultAir[2] * 1.50);
  assert.equal(atmosphereColors('lakeshore', 'preset', 0)[2], densities[0]);
});

test('planet cloud lighting depends on atmospheric density and stays consistent across camera altitudes', () => {
  const options = { cloudStyle: 'wind_swept_clouds', style: {} };
  const dense = { atmosphere: [[], [], 0.86] };
  const orbit = resolvePlanetSceneLighting(options, { ...dense, sceneAir: 0.002 });
  const nearSurface = resolvePlanetSceneLighting(options, { ...dense, sceneAir: 0.99 });
  const thin = resolvePlanetSceneLighting(options, { atmosphere: [[], [], 0.16] });
  assert.deepEqual(orbit, nearSurface);
  assert.ok(thin.weight < nearSurface.weight);
  assert.ok(nearSurface.weight > 0.5);
});

test('planet reference looks transfer lighting without changing cloud shapes or performance',()=>{
 for(const [id,look] of Object.entries(REFERENCE_LOOK_PRESETS)){
  const patch=convert(id);
  assert.equal(patch.style.colorPresetLabel,look.label);
  assert.equal(patch.tuning.lightingFinish,SCULPTED_LOOK_IDS.includes(Number(id))?2:1);
  assert.deepEqual(Object.keys(patch).sort(),['params','style','tuning']);
  assert.deepEqual(Object.keys(patch.params).sort(),['frontLightColor','shadowLightColor','silverIntensity','sunBloom','sunColor']);
  assert.ok(patch.params.sunColor.every(Number.isFinite));
  assert.ok(Number.isFinite(patch.params.silverIntensity));
  assert.equal(patch.tuning.formType,undefined);
 }
 assert.notDeepEqual(convert('20').params.frontLightColor,convert('21').params.frontLightColor);
});

test('planet grade applies edits to the intended light without double tinting a saved look', () => {
  const { params, style } = convert('20');
  assert.deepEqual(applyPlanetLightSwatches(params, style, style), params);

  const edited = applyPlanetLightSwatches(params, {
    ...style, transmissiveLightTint: style.transmissiveLightTint.map(channel => channel * .5),
  }, style);
  assert.ok(edited.sunColor.every((channel, index) => channel < params.sunColor[index]));
  assert.deepEqual(edited.frontLightColor, params.frontLightColor);
  assert.deepEqual(edited.shadowLightColor, params.shadowLightColor);

  const custom = { ...params, sunColor: [6, 0, 2.5] };
  assert.deepEqual(applyPlanetLightSwatches(custom, style, style), custom);
});

test('planet grade uses authored tones and bypasses the palette for specialized cloud materials', () => {
  const { style } = convert('23');
  const data = new Float32Array(PLANET_CLOUD_GRADE_FLOATS + 4);
  const options = { style, cloudStyle: 'storybook', tuning: { formType: 2.125 } };
  writePlanetCloudGrade(data, 4, options);
  assert.deepEqual(Array.from(data.slice(4, 7)), style.cloudLitTint.map(Math.fround));
  assert.deepEqual(Array.from(data.slice(8, 11)), style.cloudShadowTint.map(Math.fround));
  assert.deepEqual(Array.from(data.slice(12, 15)), style.edgeTint.map(Math.fround));
  assert.deepEqual(Array.from(data.slice(24, 27)), style.transmissiveLightTint.map(Math.fround));
  assert.equal(data[18], Math.fround(style.styleMidLift));
  assert.ok(data[19] > 0);

  for (const special of [{ auroraMode: true }, { cloudStyle: 'emberstorm' }, {
    cloudStyle: 'jupiter_map', tuning: { formType: 6.25 },
  }]) {
    writePlanetCloudGrade(data, 4, { ...options, ...special });
    assert.equal(data[19], 0);
  }
  assert.deepEqual(Array.from(data.slice(0, 4)), [0, 0, 0, 0]);
});

test('calibrated grades have separate midtones and preserve hand-edited swatches in saved looks', () => {
  const colors = [26, 29, 33, 35, 37, 41].map(id => convert(id).style);
  assert.equal(new Set(colors.map(style => JSON.stringify(style.cloudMidTint))).size, colors.length);
  assert.ok(colors.every(style => style.planetGradient.pivot > 0));
  assert.equal(convert(20).style.planetGradient, null);
  const saved = {
    colorPresetSource: 'flat-cloud-test-v-grade', colorPresetId: 30,
    cloudLitTint: [1, .87, .79], cloudShadowTint: REFERENCE_LOOK_PRESETS[30].cloudShadowTint,
  };
  const refreshed = resolvePlanetCloudGradient(saved);
  assert.deepEqual(refreshed.cloudLitTint, saved.cloudLitTint);
  assert.notDeepEqual(refreshed.cloudShadowTint, saved.cloudShadowTint);
  assert.equal(resolvePlanetCloudGradient(refreshed), refreshed);
});

test('every Planet preset uses the Fluid sky colors and display response', () => {
  for (const id of Object.keys(GRADE_PRESETS)) {
    const fluid = resolveScenePalette(id);
    const { params, style } = convert(id);
    const planet = resolveScenePalette(id, { ...style, sunBloom: params.sunBloom });
    for (const channel of ['sky', 'sun', 'exposure', 'colorLift', 'saturation', 'bloom']) {
      assert.deepEqual(planet[channel], fluid[channel], `palette ${id} ${channel}`);
    }
  }
  const twilight = resolveScenePalette(FLUID_TWILIGHT_GRADE);
  assert.deepEqual(twilight.sky, [1, 1, 1]);
  const edited = resolveScenePalette(FLUID_TWILIGHT_GRADE, { sky: [.48, .23, .175] });
  assert.deepEqual(edited.sky, [2, 1, .5]);
});

test("Fluid Twilight transfers the shared reference light without a second sun tint",()=>{
  const look=REFERENCE_LOOK_PRESETS[FLUID_TWILIGHT_GRADE];
  const patch=convert(FLUID_TWILIGHT_GRADE);
  assert.deepEqual(patch.params.frontLightColor,look.frontLightTint.map((value,i)=>value*look.sunTint[i]));
  assert.deepEqual(patch.params.sunColor,look.transmissiveLightTint.map((value,i)=>value*look.sunTint[i]));
  assert.equal(patch.params.sunBloom,.18);
});
