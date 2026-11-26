import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CloudRayTargetCache } from '../cloudRayTargets.js';
import { LOCAL_PLANET_CLOUDS } from '../localPlanetClouds.js';
import { resolvePlanetShafts } from '../planetShafts.js';

// Exercise the real builder methods without requiring a GPU or WGSL bundler.
const source = (await readFile(new URL('../clouds.js', import.meta.url), 'utf8'))
  .replace(/^import (\w+) from "\.\.?\/[^" ]+\.wgsl";$/gm, 'const $1 = "";')
  .replace('"./cloudTerrainMesh.js"',JSON.stringify(new URL('../cloudTerrainMesh.js',import.meta.url).href))
  .replace('"./fluidPlanetTerrain.js"',JSON.stringify(new URL('../fluidPlanetTerrain.js',import.meta.url).href))
  .replace(/^import \{createRegionTerrainMarch,regionTerrainMarchWGSL\} from "\.\/planetRegionTerrainMarch\.js";$/m, '')
  .replace('"../planet/planetRegion.js"',JSON.stringify(new URL('../../planet/planetRegion.js',import.meta.url).href))
  .replace('"./cloudFieldQuality.js"',JSON.stringify(new URL('../cloudFieldQuality.js',import.meta.url).href))
  .replace('"./planetRegionWeather.js"',JSON.stringify(new URL('../planetRegionWeather.js',import.meta.url).href))
  .replace(/^import (\w+) from '\.\.?\/[^' ]+\.wgsl';$/gm, 'const $1 = "";')
  .replace("'./planetCloudGrade.js'",JSON.stringify(new URL('../planetCloudGrade.js',import.meta.url).href))
  .replace("'./cloudNavigation.js'",JSON.stringify(new URL('../cloudNavigation.js',import.meta.url).href))
  .replace("'./cloudFrozenPattern.js'",JSON.stringify(new URL('../cloudFrozenPattern.js',import.meta.url).href))
  .replace("'./cloudLookPresets.js'",JSON.stringify(new URL('../cloudLookPresets.js',import.meta.url).href))
  .replace("'./cloudRayTargets.js'",JSON.stringify(new URL('../cloudRayTargets.js',import.meta.url).href))
  .replace("'./localPlanetClouds.js'",JSON.stringify(new URL('../localPlanetClouds.js',import.meta.url).href))
  .replace("'./nightConstellations.js'",JSON.stringify(new URL('../nightConstellations.js',import.meta.url).href));
const { CloudComputeBuilder, CLOUD_PREVIEW_RENDER_BYTES } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function fixture(device = {}) {
  const builder = Object.create(CloudComputeBuilder.prototype);
  Object.assign(builder, {
    device, outFormat: 'rgba16float', module: {}, _computePipelineLayout: {},
    _dvOptions: new DataView(new ArrayBuffer(32)),
    _abView: new ArrayBuffer(160),
    _abTuning: new ArrayBuffer(272), _computePipelineKey: -1,
    _computePipelines: new Map(), _computePipelinePromises: new Map(),
    _state: { tuning: {} }, _writeIfChanged() {},
    // These tests isolate main-variant caching; the stage cache is tested below.
    _getFlatStageSetup() { return { layout: {} }; },
    _ensureFlatStagePipelineAsync() { return Promise.resolve({}); },
    _ensureFlatStagePipeline() { return {}; },
    _getStagedLayerShaderModule() { return {}; },
  });
  builder._dvView = new DataView(builder._abView);
  builder._dvTuning = new DataView(builder._abTuning);
  builder._dvOptions.setUint32(8, 1, true);
  builder.setTuning({ sunStride: 4 });
  return builder;
}

test('shelf flow occupies its own uniform lane and keeps the original domain by default', () => {
  const b = fixture();
  assert.equal(b._dvTuning.getFloat32(256,true),0);
  b.setTuning({shelfFlow:1.25,towerHeightVariation:.6});
  assert.equal(b._dvTuning.getFloat32(256,true),1.25);
  assert.ok(Math.abs(b._dvTuning.getFloat32(252,true)-.6)<1e-6);
  b.setTuning({shelfFlow:20});
  assert.equal(b._dvTuning.getFloat32(256,true),2);
  b.setTuning({shelfFlow:0});
  assert.equal(b._dvTuning.getFloat32(256,true),0);
});

test('painted-layer lighting defaults off and packs without changing geometry uniforms',()=>{
  const b=fixture(),before=new Uint8Array(b._abTuning).slice();
  assert.equal(b._dvTuning.getFloat32(260,true),0);
  b.setTuning({paintedLayers:1});
  assert.equal(b._dvTuning.getFloat32(260,true),1);
  assert.deepEqual(new Uint8Array(b._abTuning).slice(0,260),before.slice(0,260));
  assert.deepEqual(new Uint8Array(b._abTuning).slice(264),before.slice(264));
  b.setTuning({paintedLayers:4});assert.equal(b._dvTuning.getFloat32(260,true),1);
  b.setTuning({paintedLayers:0});assert.deepEqual(new Uint8Array(b._abTuning),before);
});

test('flat field fidelity replaces both cached textures without changing shader variants',()=>{
  globalThis.GPUTextureUsage={TEXTURE_BINDING:4,STORAGE_BINDING:8};
  globalThis.GPUBufferUsage={UNIFORM:64,COPY_DST:8};
  const allocated=[],retired=[];
  const b=fixture({createTexture(desc){const texture={desc,createView:()=>({texture})};allocated.push(texture);return texture;},createBuffer:desc=>({desc}),createBindGroup:desc=>({desc}),createShaderModule:desc=>desc,createComputePipeline:()=>({getBindGroupLayout:()=>({})})});
  b._retireTexture=t=>retired.push(t);
  b.setTuning({formType:3});const key=b._currentComputeVariantKey();
  b._ensureFlatFieldResources();const original=b._fieldResources;
  assert.deepEqual(original.dimensions,[128,64,128]);
  assert.ok(allocated.every(t=>t.desc.mipLevelCount===8));
  assert.equal(b._fieldMipGroups.flat().length,14);
  b.setFieldQuality('balanced');b._ensureFlatFieldResources();assert.equal(allocated.length,2);
  b.setFieldQuality('high');assert.equal(b._fieldResources,original,'allocate only at the next frame encode');
  b._fieldDensitySignature=b._fieldLightSignature='old';b._flatStageBindGroup={};
  b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[192,96,192]);
  assert.deepEqual(retired,[original.density,original.light]);
  assert.equal(b._fieldDensitySignature,null);assert.equal(b._fieldLightSignature,null);assert.equal(b._flatStageBindGroup,null);
  b.setFieldQuality('ultra');b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[256,128,256]);
  b.setFieldQuality('cinematic');b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[384,192,384]);
  b.setFieldQuality('reference');b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[512,256,512]);
  assert.equal(b._currentComputeVariantKey(),key,'no new quality pipeline or screen-size variant');
  b.setTuning({formType:0});const count=allocated.length;b.setFieldQuality('low');b._ensureFlatFieldResources();
  assert.equal(allocated.length,count,'the legacy layer does not allocate higher-detail fields');
  b.setTuning({formType:3});b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[96,48,96]);
  assert.throws(()=>b.setFieldQuality('bad'),RangeError);assert.equal(b._state.fieldQuality,'low');
  b.device.limits={maxTextureDimension3D:2048,maxBufferSize:256*1024**2};
  assert.throws(()=>b.setFieldQuality('reference'),/unavailable/);
  assert.equal(b._state.fieldQuality,'low','reject unsupported capture tiers before changing scene state');
  b.setFieldQuality('cinematic');b._ensureFlatFieldResources();assert.deepEqual(b._fieldResources.dimensions,[384,192,384]);
});

test('a sculpted first frame binds valid single-level placeholder fields',()=>{
  globalThis.GPUTextureUsage={TEXTURE_BINDING:4,STORAGE_BINDING:8};
  globalThis.GPUBufferUsage={UNIFORM:64,COPY_DST:8};
  const allocated=[];
  const b=fixture({createTexture(desc){
    assert.ok(desc.mipLevelCount<=1+Math.floor(Math.log2(Math.max(...desc.size))));
    const texture={desc,createView:()=>({texture})};allocated.push(texture);return texture;
  },createBuffer:desc=>({desc}),createBindGroup:desc=>({desc}),createShaderModule:desc=>desc,createComputePipeline:()=>({getBindGroupLayout:()=>({})})});
  b._retireTexture=()=>{};
  b.setTuning({formType:0});b._ensureFlatFieldResources();
  assert.deepEqual(b._fieldResources.dimensions,[1,1,1]);
  assert.ok(allocated.every(t=>t.desc.mipLevelCount===1));
  assert.equal(b._fieldMipGroups.flat().length,0);
  b.setTuning({formType:3});b._ensureFlatFieldResources();
  assert.deepEqual(b._fieldResources.dimensions,[128,64,128]);
  assert.equal(b._fieldMipGroups.flat().length,14);
});

test('variant follows the uploaded stride and preserves all mode bits', () => {
  const builder = fixture();
  for (const [stride, detail] of [[4, false], [2, false], [1, true], [0, true], [-2, true], [1.9, true], [2.9, false]]) {
    builder.setTuning({ sunStride: stride });
    for (const spherical of [false, true]) for (const custom of [false, true]) for (const rgb of [false, true]) {
      builder._dvOptions.setFloat32(16, spherical ? 1 : 0, true);
      builder._dvOptions.setUint32(0, custom ? 1 : 0, true);
      builder._dvOptions.setUint32(8, rgb ? 1 : 0, true);
      const key = builder._currentComputeVariantKey();
      assert.equal(key, +spherical | (+custom << 2) | (+rgb << 3) | (+detail << 4) | (spherical ? 0 : 32));
      const { compute } = builder._computePipelineDescriptorForKey(key);
      assert.equal(compute.constants.CLOUD_DETAILED_LIGHTING, +detail);
      assert.equal(compute.entryPoint, spherical ? 'computeCloudSphere' : 'computeCloudBox');
    }
  }
});

test('procedural flat rays use wide groups while fields and planets keep their layout', () => {
  const b = fixture();
  b._dvFrame = new DataView(new ArrayBuffer(64));
  b.setFrame({ fullWidth: 773, fullHeight: 435, tileWidth: 773, tileHeight: 435 });
  assert.equal(b._computePipelineDescriptorForKey(40).compute.constants.CLOUD_WORKGROUP_WIDTH, 16);
  b._getFieldShaderModule = () => ({});
  assert.equal(b._computePipelineDescriptorForKey(104).compute.constants.CLOUD_WORKGROUP_WIDTH, undefined);
  assert.equal(b._computePipelineDescriptorForKey(9).compute.constants.CLOUD_WORKGROUP_WIDTH, undefined);
  assert.deepEqual(b._rayDispatchShape(40), [49, 55]);
  assert.deepEqual(b._rayDispatchShape(104), [97, 55]);
  assert.deepEqual(b._rayDispatchShape(9), [97, 55]);
  b.setFrame({ tileWidth: 37, tileHeight: 19, originX: 12, originY: 7 });
  assert.deepEqual(b._rayDispatchShape(40), [3, 3]);
  assert.deepEqual(b._rayDispatchShape(40, { w: 388, h: 55 }), [25, 7]);
  assert.deepEqual(b._rayDispatchShape(104, { w: 388, h: 55 }), [49, 7]);
  assert.deepEqual([b._wgX, b._wgY], [5, 3], 'resolve remains in 8x8 groups');
});

test('styled planets select the matching ray kernel for warmup and rendering', async () => {
  const descriptors = [];
  const builder = fixture({ async createComputePipelineAsync(descriptor) {
    descriptors.push(descriptor);
    return {};
  } });
  builder._dvOptions.setFloat32(16, 1, true);
  builder._dvView.setFloat32(92, 1, true);
  builder._getPlanetShaderModule = () => ({planet: true});
  builder._planetStyleMode = true;

  const cases = [
    [1, 'CLOUD_THIN_PLANET_FORM', 1],
    [2, 'CLOUD_WEATHER_PLANET_FORM', undefined],
    [2.125, 'CLOUD_WEATHER_PLANET_FORM', 2.125],
    [2.25, 'CLOUD_WEATHER_PLANET_FORM', 2.25],
    [2.38, 'CLOUD_WEATHER_PLANET_FORM', Math.fround(2.38)],
    [5, 'CLOUD_GAS_PLANET_FORM', 1],
  ];
  for (const [formType, constant, value] of cases) {
    await builder.prewarmComputePipelineVariantAsync({spherical: true, formType});
    builder.setTuning({formType});
    const {compute} = builder._computePipelineDescriptorForKey();
    assert.equal(compute.entryPoint, 'computeCloudPlanet');
    assert.equal(compute.constants[constant], value);
    assert.equal(compute.constants.CLOUD_FLAT_TOWER_FORM, undefined);
    assert.deepEqual(compute, descriptors.at(-1).compute);
    const count = descriptors.length;
    await builder.ensureComputePipelineReadyAsync();
    assert.equal(descriptors.length, count);
  }
  assert.equal(descriptors.length, cases.length);

  builder.setTuning({sunStride: 1});
  builder._dvView.setFloat32(92, 2, true);
  assert.equal(builder._currentComputeVariantKey(), 25);
  builder._dvView.setFloat32(92, 1, true);
  builder._planetStyleMode = false;
  assert.equal(builder._currentComputeVariantKey(), 25);
  builder.setTuning({formType: 0, sunStride: 4});
  assert.equal(builder._currentComputeVariantKey(), 9);
});

test('async warmups share one compilation and do not install a stale variant', async () => {
  let calls = 0, resolve;
  const device = { createComputePipelineAsync: () => { calls++; return new Promise(done => { resolve = done; }); } };
  const builder = fixture(device);
  const first = builder.ensureComputePipelineReadyAsync();
  const second = builder.ensureComputePipelineReadyAsync();
  assert.equal(calls, 1);
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'compiling');
  builder.setTuning({ sunStride: 1 });
  const regular = {};
  resolve(regular);
  assert.equal(await first, regular);
  assert.equal(await second, regular);
  assert.equal(builder.pipeline, undefined);
  assert.equal(builder._computePipelinePromises.size, 0);
  builder.setTuning({ sunStride: 4 });
  assert.equal(await builder.ensureComputePipelineReadyAsync(), regular);
  assert.equal(calls, 1);
  const snapshot = builder.getComputePipelineTimings();
  assert.equal(snapshot.activeKey, 40);
  assert.equal(snapshot.variants[0].status, 'ready');
  assert.ok(snapshot.variants[0].compileMs >= 0);
  snapshot.variants[0].status = 'modified';
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'ready');
  assert.deepEqual(structuredClone(builder.getComputePipelineTimings()), builder.getComputePipelineTimings());
});

test('failed async compilation is timed, cleared and retryable', async () => {
  let fail = true;
  const device = { async createComputePipelineAsync() { if (fail) throw new Error('compile failed'); return {}; } };
  const builder = fixture(device);
  await assert.rejects(builder.ensureComputePipelineReadyAsync(), /compile failed/);
  assert.equal(builder._computePipelinePromises.size, 0);
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'error');
  fail = false;
  await builder.ensureComputePipelineReadyAsync();
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'ready');
});

test('prewarming respects explicit and current stride without changing render state', async () => {
  const descriptors = [];
  const builder = fixture({ async createComputePipelineAsync(descriptor) { descriptors.push(descriptor); return {}; } });
  await builder.prewarmComputePipelineVariantAsync({ spherical: true });
  await builder.prewarmComputePipelineVariantAsync({ aurora: true, sunStride: 1 });
  assert.deepEqual([...builder._computePipelines.keys()], [9, 25]);
  assert.deepEqual(descriptors.map(d => d.compute.constants.CLOUD_DETAILED_LIGHTING), [0, 1]);
  assert.equal(builder._currentComputeVariantKey(), 40);
});

test('sync fallback retains cache and diagnostic behavior', async () => {
  let calls = 0;
  const builder = fixture({ createComputePipeline() { calls++; return {}; } });
  const pipeline = await builder.ensureComputePipelineReadyAsync();
  assert.equal(builder.ensureComputePipelineReady(), pipeline);
  assert.equal(calls, 1);
  assert.equal(builder.getComputePipelineTimings().variants[0].async, false);
});

test('live slices and frozen volume variants prewarm independently', async()=>{
  const b=fixture();b._getFieldShaderModule=()=>({});
  const keys=[];b._ensureComputePipelineForKeyAsync=async key=>{keys.push(key);return {};};
  for(const formType of [0,2])for(const [enabled,axis] of [[false,0],[false,2],[true,0],[true,3]]){
    b.setTuning({formType});b.setFrozenPattern({enabled,axis,first:.25,last:.75,spacing:8});
    const key=b._currentComputeVariantKey();await b.prewarmComputePipelineVariantAsync();
    assert.equal(keys.at(-1),key);
    assert.equal(!!(key&512),axis>0,'slice layout is independent of capture');
    assert.equal(!!(key&256),enabled&&formType>0,'only cached fields freeze');
    const constants=b._computePipelineDescriptorForKey(key).compute.constants;
    assert.equal(constants.CLOUD_FROZEN_SLICES,+(axis>0));
    if(formType>0)assert.equal(constants.CLOUD_FROZEN_PATTERN,+enabled);
  }
});

test('shader retains dynamic detailed lighting guard and compact probe loops', async () => {
  const shader = await readFile(new URL('../shaders/cloudCommon.wgsl', import.meta.url), 'utf8') + await readFile(new URL('../shaders/cloudLayer.wgsl', import.meta.url), 'utf8');
  assert.equal(shader.match(/CLOUD_DETAILED_LIGHTING != 0u && !fastLighting && sunStrideSafe <= 1/g)?.length, 2);
  assert.equal(shader.match(/for \(var i = 0u; i < 6u; i\+\+\)/g)?.length, 3);
  assert.match(shader, /for \(var i = 0u; i < 3u; i\+\+\)/);
});

test('rounded forms share one variant and oversized outputs fall back to inline resolve', () => {
  const builder = fixture({ limits: { maxStorageBufferBindingSize: 1024 } });
  builder._getFieldShaderModule = () => 'fields';
  builder.width = 4; builder.height = 4; builder.layers = 1;
  for (const formType of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13]) {
    builder.setTuning({ formType, sunStride: 1 });
    assert.equal(builder._currentComputeVariantKey(), 104);
    assert.equal(builder._computePipelineDescriptorForKey(104).compute.module, 'fields');
  }
  builder.width = 128;
  assert.equal(builder._currentComputeVariantKey(), 72);
  assert.equal(builder._currentComputeVariantKey({ coarseFactor: 8 }), 104);
  builder.setTuning({ formType: 0 });
  assert.equal(builder._currentComputeVariantKey(), 24);
  assert.equal(builder._currentComputeVariantKey({ coarseFactor: 8 }), 56);
});

test('coarse warmup prepares the dispatched variant without compiling a large logical target', async () => {
  const keys = [];
  const builder = fixture({ limits: { maxStorageBufferBindingSize: 1024 }, async createComputePipelineAsync(descriptor) { keys.push(descriptor.compute.constants.CLOUD_STAGED_RESOLVE); return {}; } });
  builder.width = 128; builder.height = 4;
  await builder.ensureComputePipelineReadyAsync({ coarseFactor: 8 });
  assert.deepEqual(keys, [1]);
  assert.equal(builder._computePipelineKey, 40);
  assert.equal(builder.ensureComputePipelineReady({ coarseFactor: 8 }), builder.pipeline);
  assert.equal(builder._currentComputeVariantKey(), 8);
});

test('field cache reuses camera/AO changes, relights the sun, and rebakes changed inputs', () => {
  const builder = fixture();
  Object.assign(builder, {
    _u32Views: new WeakMap(), _abParams: new ArrayBuffer(96), _abNTransform: new ArrayBuffer(128), _abBox: new ArrayBuffer(32),
    _dvView: new DataView(new ArrayBuffer(128)), _fieldParamsAB: new ArrayBuffer(272), _fieldResources: { dimensions: [128,64,128] },
    _ensureFlatFieldResources() {}, _getResId(resource) { return resource; },
    _ensureFlatStagePipeline(entry) { return entry; },
    _fieldMipGroups: [['density mip'], ['light mip']], _fieldMipPipelines: ['density mips', 'light mips'],
    weatherView: 1, shape3DView: 2, detail3DView: 3,
  });
  builder._state.box = { center: [0,1,0], half: [18,1.4,18] };
  builder._state.light = { sunDir: [0,1,0] };
  const pipelines = [];
  const pass = { setPipeline(entry) { pipelines.push(entry); }, setBindGroup() {}, dispatchWorkgroups() {} };
  const stages = () => { const timings = []; pipelines.length = 0; builder._encodeFlatFields(pass, timings); return timings.filter(t => t.dispatched).map(t => t.stage); };
  const both = ['buildCloudDensityField', 'buildCloudLightField'];
  assert.deepEqual(stages(), both);
  assert.deepEqual(pipelines, [both[0], 'density mips', both[1], 'light mips']);
  assert.deepEqual(stages(), []);
  const appearance=new DataView(builder._abParams);
  appearance.setFloat32(24,2.5,true); // silver intensity is resolved per ray
  appearance.setFloat32(48,1.7,true); // sun tint is not cached geometry
  builder.setTuning({lightingFinish:2});
  assert.deepEqual(stages(), [], 'appearance changes preserve density and lighting');
  appearance.setFloat32(12,4.5,true); // extinction changes cached sun visibility
  assert.deepEqual(stages(), ['buildCloudLightField']);
  assert.deepEqual(pipelines, ['buildCloudLightField', 'light mips']);
  appearance.setFloat32(4,2,true); // density changes both fields
  assert.deepEqual(stages(), both);
  const fieldResources = builder._fieldResources;
  builder.setCloudTurbulence(.75);
  assert.deepEqual(stages(), [], 'visible turbulence must reuse density and lighting');
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(76,true), .75);
  assert.equal(builder._fieldResources, fieldResources);
  builder.setCloudTurbulence(100);assert.equal(builder._state.cloudTurbulence,1.5);
  builder.setCloudTurbulence(NaN);assert.equal(builder._state.cloudTurbulence,0);
  assert.deepEqual(stages(), []);
  builder._dvView.setFloat32(0, 12, true); // camera, not field coordinates
  builder.setTuning({ aoStrength: 0.75 });
  assert.deepEqual(stages(), []);
  builder._state.light.sunDir = [1,0,0];
  assert.deepEqual(stages(), ['buildCloudLightField']);
  builder.setTuning({ puffScale: 5 });
  assert.deepEqual(stages(), both);
  builder.weatherView = 4;
  assert.deepEqual(stages(), both);
  builder.regionWeatherSpan = 512;
  assert.deepEqual(stages(), both);
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(128, true), 512);
  assert.deepEqual(stages(), []);
  builder.localWeatherSeed = 17371;
  assert.deepEqual(stages(), both, 'a new weather seed rebakes the volume');
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(136, true), 17371);
  assert.deepEqual(stages(), []);
  builder.localWeatherLayoutSeed = 147;
  assert.deepEqual(stages(), both, "a different placement seed refreshes the cached silhouette");
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(140, true), 147);
  assert.deepEqual(stages(), []);
  builder.regionCloudProjection = Array.from({length:24}, (_, index) => index + 1);
  builder.regionCloudProjection.splice(17, 4, 0.25, -0.125, 1, 0.2);
  assert.deepEqual(stages(), both, 'a different source volume rebakes density and lighting');
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(144, true), 1);
  const rotation = new Float32Array(builder._fieldParamsAB, 240, 8);
  const expected = [0, 1, Math.SQRT1_2, -Math.SQRT1_2, 1, -0.77,
    2 * Math.sin(1) * 0.065 * 0.38, 2 * Math.sin(-0.77) * 0.040 * 0.38];
  expected.forEach((value, index) => assert.ok(Math.abs(rotation[index] - value) < 1e-6));
  assert.deepEqual(stages(), []);
  const windStreets = LOCAL_PLANET_CLOUDS.find(style => style.id === 'trade_wind_streets');
  builder.setTuning({ formType: windStreets.form });
  assert.deepEqual(stages(), both);
  expected.slice(0, 6).forEach((value, index) => assert.ok(Math.abs(rotation[index] - value) < 1e-6));
  assert.ok(Math.abs(rotation[6] - expected[6] * 0.28) < 1e-6);
  assert.ok(Math.abs(rotation[7] - expected[7] * 0.28) < 1e-6);
  builder.regionCloudProjection = undefined;
  assert.deepEqual(stages(), both, 'returning to Flat clears the source projection');
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(144, true), 0);
  assert.ok(rotation.every(value => value === 0), 'clearing a projection clears its prepared phases');
  builder.invalidateCloudFields(); // in-place texture rebake
  assert.deepEqual(stages(), both);
  builder._dvView.setFloat32(96, 2, true); // world-to-noise scale
  assert.deepEqual(stages(), both);
  new DataView(builder._abNTransform).setFloat32(0, 2.25, true); // advected cloud-cell domain
  assert.deepEqual(stages(), both);
  builder.setVolumeMask({shape:'torus',rotationAngle:0.4});
  assert.deepEqual(stages(), both);
  builder.setVolumeMask({shape:'torus',rotationAngle:0.8});
  assert.deepEqual(stages(), both);
  builder.setVolumeMask({shape:'box',rotationAngle:0.8});
  assert.deepEqual(stages(), both);
  builder.setVolumeMask({shape:'box',rotationAngle:1.2}); // irrelevant in a box
  assert.deepEqual(stages(), []);
  builder.setWeatherProfile({shelf:1});
  assert.deepEqual(stages(),both);assert.deepEqual(stages(),[]);
  assert.equal(new DataView(builder._fieldParamsAB).getFloat32(12,true),1);
  builder.setWeatherProfile({deck:.4,wisps:.6});
  assert.deepEqual(stages(),both);
  builder.setWeatherProfile();assert.deepEqual(stages(),both);
  builder.setVolumeMask({shape:'torus'});assert.deepEqual(stages(),both);
  builder.setWeatherProfile({shelf:1});assert.deepEqual(stages(),[]); // layer weights don't touch arbitrary volumes
  builder.setVolumeMask({shape:'box'});
  builder._state.box.half=[90,10,90];
  builder.setTuning({formType:1});stages();
  const fieldParams=new DataView(builder._fieldParamsAB);
  assert.equal(fieldParams.getUint32(44,true),1,'ordinary wide skies retain their tiled cache');
  for(const formType of [11,12]){
    builder.setTuning({formType});assert.deepEqual(stages(),both);
    assert.equal(fieldParams.getUint32(44,true),0,'finite storms never tile when enlarged');
    assert.equal(fieldParams.getFloat32(16,true),180,'the whole storm uses the full box');
    assert.deepEqual(stages(),[],'a stopped storm retains its baked fields');
  }
});

test('planet shaft controls retain their authored strength across normal atmospheres', () => {
  const settings = {
    godRaysEnabled: true,
    godRayStrength: 12,
    fogDensity: .44,
    styleShadowDarkness: 18,
    exposure: 1,
  };
  const sun = [0, .2, Math.sqrt(.96)];
  const light = (density, altitude = .2, style = settings, direction = sun) =>
    resolvePlanetShafts(style, 50, 14, [0, 50 + altitude, 0], direction,
      [[0, 0, 0], [0, 0, 0], density], .7, 2.2);

  const thin = light(.18);
  const standard = light(1);
  assert.equal(standard.strength, 12);
  assert.equal(standard.haze, 2);
  assert.equal(standard.darkness, 18);
  assert.equal(light(.36).visibility, standard.visibility);
  assert.ok(thin.visibility > 0 && thin.visibility < standard.visibility);
  assert.equal(light(.015), null);
  assert.equal(light(1, 3).visibility, standard.visibility);
  assert.ok(light(1, 12).visibility < standard.visibility);
  assert.equal(light(1, 24), null);
  assert.equal(light(1, .2, settings, [0, -1, 0]), null);
  assert.equal(light(1, .2, { ...settings, godRayStrength: 0 }), null);
});

test('world cloud shadows reuse short camera moves and rebake changed shell geometry', async t => {
  let now = 1000;
  t.mock.method(performance, 'now', () => now);
  const builder = fixture();
  const pipeline = {};
  const projectionWrites = [];
  const weights = [];
  const blendBuffer = {};
  Object.assign(builder, {
    queue: { writeBuffer: (buffer, offset, values) => {
      if (buffer === blendBuffer) weights.push(values[0]);
      else projectionWrites.push(values.slice());
    } },
    _currentComputeVariantKey: () => 128,
    _shaftFrameBuffer: {}, _shaftMaskView: {},
    _shaftPipelines: { get: () => pipeline }, _shaftMipGroups: [],
    _shaftFilterGroups: [{}, {}], _shaftBlendGroups: [{}, {}], _shaftBlendBuffer: blendBuffer,
    _abBox: new ArrayBuffer(64),
    _abParams: new ArrayBuffer(112),
    _abNTransform: new ArrayBuffer(176),
    _u32Views: new WeakMap(),
    _getResId: () => 0,
  });
  builder.setTuning({ formType: 6, definition: .4 });
  const pass = { setPipeline() {}, setBindGroup() {}, dispatchWorkgroups() {} };
  const encode = () => {
    const timings = [];
    builder._encodeCloudShaftMask(pass, null, timings);
    return timings[0]?.baked ?? null;
  };
  const view = { enabled: true, strength: 1, sun: [0, 1, 0], camera: [0, 4, 0],
    base: 16, thickness: 12, datum: 10000, animated: true };
  await builder.prepareLocalCloudShafts(view);
  assert.ok(encode());
  assert.equal(projectionWrites.length, 1);
  assert.equal(weights.at(-1), 1);

  await builder.prepareLocalCloudShafts({ ...view, camera: [6, 4, 0] });
  assert.equal(projectionWrites.length, 1);
  assert.equal(encode(), null);

  await builder.prepareLocalCloudShafts({ ...view, camera: [20, 4, 7] });
  assert.equal(projectionWrites.length, 2);
  assert.ok(encode());
  assert.equal(weights.at(-1), 1);
  const [x, , z, halfWidth] = projectionWrites.at(-1);
  const coarsestTexel = (2 * halfWidth / 320) * 8;
  for (const coordinate of [x, z]) {
    const grid = coordinate / coarsestTexel;
    assert.notEqual(Math.round(grid), 0);
    assert.ok(Math.abs(grid - Math.round(grid)) < 1e-5);
  }

  builder.setTuning({ definition: .9 });
  assert.ok(encode());
  builder._dvView.setFloat32(144, 2, true);
  assert.ok(encode());
  new DataView(builder._abNTransform).setFloat32(32, 1.25, true);
  assert.ok(encode());

  const motion = new DataView(builder._abNTransform);
  motion.setFloat32(0, .25, true);
  now += 16;
  assert.equal(encode(), null);

  now += 18;
  assert.equal(encode(), true);
  assert.equal(weights.at(-1), 0);
  motion.setFloat32(0, .3, true);
  now += 16;
  assert.equal(encode(), false);
  assert.ok(Math.abs(weights.at(-1) - .48) < 1e-6);
  now += 18;
  assert.equal(encode(), true);
  assert.equal(weights.at(-1), 0);
  now += 34;
  assert.equal(encode(), false);
  assert.equal(weights.at(-1), 1);
  assert.equal(encode(), null);

  motion.setFloat32(0, .4, true);
  assert.equal(encode(), true);
  assert.equal(weights.at(-1), 0);
  await builder.prepareLocalCloudShafts({ ...view, camera: [20, 4, 7], animated: false });
  assert.equal(encode(), false);
  assert.equal(weights.at(-1), 1);
  assert.equal(encode(), null);

  await builder.prepareLocalCloudShafts({ ...view, enabled: false });
  assert.equal(encode(), null);
  assert.ok(projectionWrites.at(-1).every(value => value === 0));
  await builder.prepareLocalCloudShafts(view);
  assert.equal(encode(), true);
  assert.equal(weights.at(-1), 1);

  // Planet-centered views use the same baker in either hemisphere.
  const nativeView = { ...view, camera: [0, -50.12, 0], sun: [0, -1, 0],
    base: .7, thickness: 1.5, datum: -50, reach: 10 };
  await builder.prepareLocalCloudShafts(nativeView);
  assert.ok(encode());
  assert.equal(projectionWrites.at(-1)[11], -50);
  const writeCount = projectionWrites.length;
  await builder.prepareLocalCloudShafts({ ...nativeView, sun: [.0005, -Math.sqrt(1 - .0005**2), 0] });
  assert.equal(projectionWrites.length, writeCount);
  assert.equal(encode(), null);
});

test('rounded clouds advect their scaffold and grow billows without rescaling tower height', async () => {
  const shader = await readFile(new URL('../shaders/cloudFields.wgsl', import.meta.url), 'utf8');
  assert.match(shader, /floor\(\(p\.xz \+ windOffset\) \/ cellSize\)/);
  assert.match(shader, /centerXZ = materialCenterXZ - windOffset/);
  assert.match(shader, /columnHeight = layerHeight \* heightFraction \* select\(1\.0/);
  assert.match(shader, /headRadius = fullHeadRadius \* puffGrowth/);
  assert.match(shader, /radiusY = fullRadiusY \* puffGrowth/);
  assert.match(shader, /fieldWeatherUV\(vec3<f32>\(materialCenterXZ\.x/);
  assert.match(shader, /body = max\(body, localForm/);
});

test('hybrid clouds use volume noise for density, billow deformation and cached lighting', async () => {
  const shader = await readFile(new URL('../shaders/cloudFields.wgsl', import.meta.url), 'utf8');
  assert.match(shader, /fbm = dot\(shape\.gba, vec3<f32>\(0\.625, 0\.25, 0\.125\)\)/);
  assert.match(shader, /macroSigned = localBody \* 0\.85 \+ cellStructure/);
  assert.match(shader, /fineSigned = macroSigned - erosion/);
  assert.match(shader, /localForm \* 0\.85 \+ cellStructure \* 0\.65 - erosion/);
  assert.match(shader, /materialP \+ detailWarp \+ shapeAdvection/);
  assert.match(shader, /var materialP=p;\s*if\(TUNE.formType>10.5 && TUNE.formType<12.5\)\{materialP=stormMaterialPosition\(p\);\}/);
  assert.match(shader, /select\(0\.04,0\.065,TUNE.formType>11\.5 && TUNE.formType<12\.5\)/);
  // These compact density operations stay in the cached entrypoint. The
  // legacy recursive density/light graph must not return to the small raymarch.
  const rays = await readFile(new URL('../shaders/clouds.wgsl', import.meta.url), 'utf8');
  assert.doesNotMatch(rays, /densityFromSamples\(|roundedCloudBody\(/);
  assert.equal(shader.match(/let detail = wrap3D_detail/g)?.length, 1);
  assert.equal(shader.match(/let shape = wrap3D_shape/g)?.length, 1);
});

test('anvil scenes mix stable storm cells with lower cumulus and keep upper turrets below the canopy', async () => {
  const shader = await readFile(new URL('../shaders/cloudFields.wgsl', import.meta.url), 'utf8');
  assert.match(shader, /stormCell = cloudCellRandom\(id, 237\.9\) < 0\.27/);
  assert.doesNotMatch(shader, /stormCell = [^;]*weather\./);
  assert.match(shader, /anvil = select\(C\.cloudAnvilAmount > 0\.65, stormCell, stormSystem\)/);
  assert.match(shader, /mix_f\(0\.22, 0\.54, r0\), stormSystem && !stormCell/);
  assert.match(shader, /stormHeight = mix_f\(0\.52, 1\.0/);
  assert.match(shader, /capGrowth = sqrt\(smoothstep\(0\.40, 0\.84, maturity\)\)/);
  assert.match(shader, /C\.cloudAnvilAmount \* max\(TUNE\.anvilLift, 0\.0\)/);
  assert.match(shader, /columnHeight \* select\(0\.24, 0\.16, anvil\)/);
  assert.match(shader, /for \(var fan = 0; fan < 5; fan\+\+\)/);
});

test('rounded bulk develops continuously behind the noisy surface without extra samples', async () => {
  const shader = await readFile(new URL('../shaders/cloudFields.wgsl', import.meta.url), 'utf8');
  assert.match(shader, /interior = smoothstep\(0\.04, 0\.42, localBody \+ cellStructure \* 0\.40 - erosion \* 0\.20\)/);
  assert.match(shader, /smoothstep\(0\.20, 1\.00, maturity\)/);
  assert.match(shader, /coreDensity = interior \* 2\.0/);
  assert.match(shader, /fineDensity = max\(smoothstep\(-0\.025, 0\.24, fineSigned\), coreDensity\)/);
  assert.match(shader, /macroDensity = max\(smoothstep\(-0\.025, 0\.24, macroSigned\), coreDensity\)/);
  assert.match(shader, /shapeScale = [\s\S]*?\* select\(0\.35,0\.85,TUNE\.formType>8\.5\);/);
  assert.match(shader, /detailWarp = .*vec3<f32>\(0\.16, 0\.12, 0\.16\)/);
  assert.equal(shader.match(/let detail = wrap3D_detail/g)?.length, 1);
  assert.equal(shader.match(/let shape = wrap3D_shape/g)?.length, 1);
});

test('cached lighting filters scalar responses instead of compressed-normal seams', async () => {
  const fields = await readFile(new URL('../shaders/cloudFields.wgsl', import.meta.url), 'utf8');
  const rays = await readFile(new URL('../shaders/clouds.wgsl', import.meta.url), 'utf8');
  assert.doesNotMatch(fields + rays, /encodeCloudNormal|decodeCloudNormal/);
  assert.match(fields, /vec4<f32>\(diffuse, skyOrLocalSun, sunVisibility, ambientVisibility\)/);
  assert.match(fields, /localSun = exp\(-localOpticalDepth \* beer\)/);
  assert.match(fields, /vec4<f32>\(diffuse, localSun, sunVisibility, skyAccess\)/);
  assert.match(rays, /diffuse = clamp\(lighting\.r, 0\.0, 1\.0\)/);
  assert.match(fields, /diffuse = mix\(diffuse, -below, shade\)/);
  assert.match(rays, /lowerSkyAccess = smoothstep\([^;\n]+, -lighting\.r\)/);
  assert.match(rays, /skyOrLocalSun = clamp\(lighting\.g, 0\.0, 1\.0\)/);
  assert.match(rays, /localSun = max\(visibility, skyOrLocalSun\)/);
  assert.match(fields, /nearbyDensity = max\(nearbyDensity, neighbor\.g\)/);
  assert.match(fields, /if \(nearbyDensity <= emptyDensity\)/);
  assert.match(fields, /smoothstep\(emptyDensity, fullLightDensity, nearbyDensity\)/);
  assert.match(fields, /mix\(emptyLight, light, support\)/);
  assert.match(fields, /shadowSteps = u32\(clamp\(ceil\(reach \/ sunVoxelStep \* 2\.0\), 16\.0,\s*select\(48\.0,24\.0,TUNE\.formType>8\.5\)\)\)/);
  assert.match(fields, /f32\(i\) \+ 0\.5/);
  assert.equal(rays.slice(rays.indexOf('fn computeCloudBox(')).match(/cachedVisibleSample\(cloudLightField/g)?.length, 1);
});

test('automatic finishing follows the form while either shading style packs independently', async () => {
  const builder = fixture();
  builder._abRender = new ArrayBuffer(CLOUD_PREVIEW_RENDER_BYTES);
  builder._dvRender = new DataView(builder._abRender);
  for (const formType of [0,1,2,3]) for (const spherical of [false,true]) {
    builder.setTuning({formType});
    builder._dvOptions.setFloat32(16, spherical ? 1 : 0, true);
    for(const [cloudShading,mode] of [['auto',0],['soft',1],['sculpted',2]]) {
      builder._writeRenderUniforms({cloudShading,styleSkyOverride:true});
      assert.equal(builder._dvRender.getFloat32(12,true), formType>0 && !spherical ? 1 : 0);
      assert.equal(builder._dvRender.getFloat32(156,true),mode);
      assert.equal(builder._dvRender.getFloat32(204,true),1);
      assert.equal(builder._dvRender.getFloat32(244,true), Math.fround(.34));
    }
    builder._writeRenderUniforms();
    assert.equal(builder._dvRender.getFloat32(156,true),0);
    assert.equal(builder._dvRender.getFloat32(204,true),0);
  }
  const shader = await readFile(new URL('../shaders/cloudsRender.wgsl', import.meta.url), 'utf8');
  const volumeBranch = shader.slice(shader.indexOf('if (softVolumeFinish)'), shader.indexOf('if (cloudA < 0.003)'));
  assert.match(volumeBranch, /volumeTint = mix\(userShadowTint, userLightTint/);
  assert.match(volumeBranch, /clamp\(R\.saturationBoost, 0\.0, 2\.20\)/);
  assert.doesNotMatch(volumeBranch, /gradLenCached|bodyShadow|sunEdgeSilver/);
});

test('preview fog bounds follow the march scale and its lower support in world space',()=>{
 const b=fixture();b._abRender=new ArrayBuffer(CLOUD_PREVIEW_RENDER_BYTES);b._dvRender=new DataView(b._abRender);
 for(const formType of [0,1])for(const scale of [1,3,8]){
  b.setTuning({formType,baseJitterFrac:.02});b._dvOptions.setFloat32(16,0,true);
  b._writeRenderUniforms({box:{center:[2,6.45,-3],half:[90,.75,90]},cloudScale:scale});
  const lower=formType?5.7:5.67;
  assert.ok(Math.abs(b._dvRender.getFloat32(276,true)-(lower+(6.45-lower)*scale))<1e-5);
  assert.equal(b._dvRender.getFloat32(272,true),2);assert.equal(b._dvRender.getFloat32(280,true),-3);
  assert.equal(b._dvRender.getFloat32(288,true),90*scale);assert.equal(b._dvRender.getFloat32(292,true),.75*scale);
 }
 b._writeRenderUniforms({box:{center:[2,6.45,-3],half:[90,.75,90]},cloudScale:8,cloudHeightOffset:12});
 assert.ok(Math.abs(b._dvRender.getFloat32(276,true)-23.7)<1e-5);
 b._dvOptions.setFloat32(16,10,true);
 b._writeRenderUniforms({box:{center:[2,6.45,-3],half:[90,.75,90]},cloudScale:8,cloudHeightOffset:12});
 assert.ok(Math.abs(b._dvRender.getFloat32(276,true)-6.45)<1e-5);
 assert.equal(b._dvRender.getFloat32(288,true),90);assert.equal(b._dvRender.getFloat32(292,true),.75);
 b._writeRenderUniforms({cloudAir:[10000, 25, 8, 0],exposure:0,styleShadowDarkness:48,godRayStrength:48});
 assert.deepEqual(Array.from(new Float32Array(b._abRender, CLOUD_PREVIEW_RENDER_BYTES - 16)), [10000, 25, 8, 0]);
 assert.equal(b._dvRender.getFloat32(88,true),0);
 assert.equal(b._dvRender.getFloat32(8,true),48);
 assert.equal(b._dvRender.getFloat32(228,true),48);
});

test('aircraft state uses view padding without changing the cloud field or view-extra layout',()=>{
  const b=fixture();
  b.setViewFromCamera({aircraft:{enabled:true,bank:.25,pitch:-.125},viewExtraA:3,viewExtraB:4,viewExtraC:5});
  assert.equal(b._dvView.getFloat32(12,true),1);
  assert.equal(b._dvView.getFloat32(28,true),.25);
  assert.equal(b._dvView.getFloat32(44,true),-.125);
  assert.equal(b._dvView.getFloat32(100,true),3);
  assert.equal(b._dvView.getFloat32(104,true),4);
  assert.equal(b._dvView.getFloat32(108,true),5);
  b.setViewFromCamera();
  for(const offset of [12,28,44])assert.equal(b._dvView.getFloat32(offset,true),0);
});

test('planet aurora curtain parameters pack independently of camera and aircraft', () => {
  const builder = fixture();
  builder.setViewFromCamera();
  const before = new Float32Array(builder._abView.slice(0, 128));
  builder.setViewFromCamera({ auroraCurtainPattern: { count: 7, coverage: 0.98, strandFrequency: 61, phase: 3 } });
  assert.deepEqual(new Float32Array(builder._abView.slice(0, 128)), before);
  assert.deepEqual(Array.from(new Float32Array(builder._abView, 128, 4)), [7, Math.fround(0.98), 61, 3]);
  builder.setViewFromCamera();
  assert.deepEqual(Array.from(new Float32Array(builder._abView, 128, 4)), [4, Math.fround(0.46), 47, 0]);
});

test('independent stage compilation deduplicates and retries failed sync fallback', async () => {
  const builder = fixture();
  const setup = { pipelines: new Map(), promises: new Map() };
  builder._getFlatStageSetup = () => setup;
  builder._flatStageDescriptor = entryPoint => ({ compute: { entryPoint } });
  let calls = 0, fail = true;
  builder.device.createComputePipeline = () => { calls++; if (fail) throw new Error('stage failed'); return {}; };
  const ensure = CloudComputeBuilder.prototype._ensureFlatStagePipelineAsync.bind(builder);
  await assert.rejects(ensure('resolveCloudFlat'), /stage failed/);
  assert.equal(setup.promises.size, 0);
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'error');
  fail = false;
  const [first, second] = await Promise.all([ensure('resolveCloudFlat'), ensure('resolveCloudFlat')]);
  assert.equal(first, second);
  assert.equal(calls, 2);
  assert.equal(builder.getComputePipelineTimings().variants[0].status, 'ready');
});

test('arbitrary volume configuration retains partial updates and validates its mask', () => {
  const builder=fixture();
  builder.setVolumeMask({shape:'torus',rotationAngle:1.05});
  builder.setVolumeMask({rotationAngle:2});
  assert.deepEqual(builder._state.volumeMask,{shape:'torus',rotationAngle:2});
  assert.throws(()=>builder.setVolumeMask({shape:'unsupported'}),/Unknown cloud volume/);
  builder.setVolumeMask({shape:'box'});
  assert.equal(builder._state.volumeMask.shape,'box');
  builder.setVolumeMask({shape:'gallery'});
  assert.equal(builder._state.volumeMask.shape,'gallery');
});

test('continuous weather profile weights normalize and clear without changing shader variants',()=>{
  const b=fixture(),key=b._currentComputeVariantKey();
  b.setWeatherProfile({shelf:.8,deck:.8,wisps:Infinity});
  assert.deepEqual(b._state.weatherProfile,{shelf:.5,deck:.5,wisps:0,cirrus:0,fluctus:0,asperitas:0});
  assert.equal(b._currentComputeVariantKey(),key);
  b.setWeatherProfile({cirrus:1,fluctus:1,asperitas:1});
  assert.equal(b._state.weatherProfile.asperitas,1/3);
  assert.equal(b._currentComputeVariantKey(),key);
  b.setWeatherProfile();assert.deepEqual(b._state.weatherProfile,{shelf:0,deck:0,wisps:0,cirrus:0,fluctus:0,asperitas:0});
});

test('flat terrain uses spare view padding and clears on planet views',()=>{
 const b=fixture();
 b.setViewFromCamera({terrainEnabled:true});assert.equal(b._dvView.getFloat32(60,true),1);
 b.setViewFromCamera({terrainEnabled:true,planetRadius:10});assert.equal(b._dvView.getFloat32(60,true),0);
 b.setViewFromCamera();assert.equal(b._dvView.getFloat32(60,true),0);
});


test('cloud size and lift use view lanes without changing field input buffers',()=>{
 const b=fixture();
 const before=new Uint8Array(b._abTuning).slice();
 b.setViewFromCamera({cloudScale:3.5,cloudHeightOffset:7.5});
 assert.equal(b._dvView.getFloat32(100,true),3.5);
 assert.equal(b._dvView.getFloat32(144,true),7.5);
 b.setViewFromCamera({cloudScale:50});assert.equal(b._dvView.getFloat32(100,true),32);
 b.setViewFromCamera({cloudScale:-2});assert.equal(b._dvView.getFloat32(100,true),1);
 b.setViewFromCamera({cloudScale:8,planetRadius:10,viewExtraA:7});assert.equal(b._dvView.getFloat32(100,true),7);
 b.setViewFromCamera();assert.equal(b._dvView.getFloat32(100,true),0);
 assert.equal(b._dvView.getFloat32(144,true),0);
 assert.deepEqual(new Uint8Array(b._abTuning),before);
});

test('flight renders a fractional ray divider into the matching coarse target', () => {
  for (const [divider, width, height] of [[1.5, 1707, 960], [3.5, 732, 412]]) {
    const builder = fixture();
    builder.width = 2560;
    builder.height = 1440;
    builder.layers = 1;
    builder._dvFrame = new DataView(new ArrayBuffer(48));
    builder._dvReproj = new DataView(new ArrayBuffer(48));
    builder._encodeTerrainPass = () => {};
    builder._ensureCoarseTexture = (width, height, layers) => {
      assert.deepEqual([width, height, layers], [width, height, 1]);
      builder._coarseView = {};
    };
    builder.setFrame = ({ fullWidth, fullHeight }) => {
      assert.deepEqual([fullWidth, fullHeight], [width, height]);
    };
    builder._encodeCurrentComputePass = () => {
      assert.deepEqual([builder.width, builder.height], [width, height]);
    };

    const encoded = builder.encodeDispatchPasses({}, { coarseFactor: divider, reconstructAtPresentation: true });
    assert.equal(encoded.coarseFactor, divider);
    assert.equal(encoded.previewView, builder._coarseView);
    assert.deepEqual([builder.width, builder.height], [2560, 1440]);
  }
});

test('flight ray targets reuse adjacent grids and retire the spare outside flight', () => {
  const allocations = [];
  const retired = [];
  const device = {
    createTexture({ size }) {
      const texture = { size, createView: () => ({ texture }) };
      allocations.push(texture);
      return texture;
    },
  };
  const targets = new CloudRayTargetCache(device, {
    count: 2, label: 'history', usage: 15, retire: texture => retired.push(texture),
  });
  const large = targets.acquire(854, 480, 1, 'rgba16float', true);
  const small = targets.acquire(732, 412, 1, 'rgba16float', true);
  assert.equal(targets.acquire(854, 480, 1, 'rgba16float', true), large);
  assert.equal(targets.acquire(732, 412, 1, 'rgba16float', true), small);
  assert.equal(allocations.length, 4);
  assert.deepEqual(retired, []);

  assert.equal(targets.acquire(732, 412, 1, 'rgba16float', false), small);
  assert.deepEqual(retired, large.textures);

  const oversized = targets.acquire(1920, 1080, 1, 'rgba16float', true);
  assert.equal(targets.acquire(732, 412, 1, 'rgba16float', true), small);
  assert.deepEqual(retired, [...large.textures, ...oversized.textures]);
});

test('flat tower variants specialize the source projection and keep masked or frozen paths shared', () => {
  const builder = fixture();
  builder._getFieldShaderModule = () => ({});
  const constants = () => builder._computePipelineDescriptorForKey().compute.constants;
  const style = LOCAL_PLANET_CLOUDS.find(({ id }) => id === 'detailed_cumulus');
  builder.setTuning({ formType: style.form });

  assert.equal(constants().CLOUD_FLAT_TOWER_FORM, style.form);
  assert.equal(constants().CLOUD_FLAT_TOWER_PROJECTED, 0);
  builder.regionWeatherSpan = 160;
  builder.regionCloudProjection = Array(17).fill(0);
  builder.regionCloudProjection[16] = 200;
  assert.equal(constants().CLOUD_FLAT_TOWER_PROJECTED, 1);

  builder.setVolumeMask({ shape: 'torus' });
  assert.equal(constants().CLOUD_FLAT_TOWER_FORM, undefined);
  builder.setVolumeMask({ shape: 'box' });
  builder._frozenPattern = { enabled: true };
  assert.equal(constants().CLOUD_FLAT_TOWER_FORM, undefined);
  builder._frozenPattern = { enabled: false, axis: 2 };
  assert.equal(constants().CLOUD_FLAT_TOWER_FORM, undefined);
});

test('flat volume variants prewarm separate ray pipelines and keep masked and frozen volumes shared', async () => {
  const descriptors = [];
  const builder = fixture({ async createComputePipelineAsync(descriptor) {
    descriptors.push(descriptor);
    return {};
  } });
  builder._getFieldShaderModule = () => ({});
  builder._ensureFlatStagePipelineAsync = async () => {};
  const constants = () => builder._computePipelineDescriptorForKey().compute.constants;

  const projectedForms = LOCAL_PLANET_CLOUDS.filter(({ id }) => id === "storybook" || id === "torn_ribbons");
  const volumeForms = [1.375, 12, 1.4375, 11, ...projectedForms.map(({ form }) => form)];
  for (const formType of volumeForms) {
    await builder.prewarmComputePipelineVariantAsync({ formType });
    builder.setTuning({ formType });
    assert.equal(constants().CLOUD_FLAT_VOLUME_FORM, formType);
    assert.equal(constants().CLOUD_FLAT_TOWER_FORM, undefined);
    assert.deepEqual(constants(), descriptors.at(-1).compute.constants);
    const count = descriptors.length;
    await builder.ensureComputePipelineReadyAsync();
    assert.equal(descriptors.length, count);
  }
  assert.equal(descriptors.length, volumeForms.length);

  builder.regionWeatherSpan = 160;
  builder.regionCloudProjection = Array(17).fill(0);
  builder.regionCloudProjection[16] = 200;
  assert.equal(constants().CLOUD_FLAT_VOLUME_FORM, projectedForms.at(-1).form);
  assert.equal(constants().CLOUD_FLAT_TOWER_PROJECTED, undefined);

  builder.setVolumeMask({ shape: 'torus' });
  assert.equal(constants().CLOUD_FLAT_VOLUME_FORM, undefined);
  builder.setVolumeMask({ shape: 'box' });
  builder._frozenPattern = { enabled: true };
  assert.equal(constants().CLOUD_FLAT_VOLUME_FORM, undefined);
  builder._frozenPattern = { enabled: false, axis: 2 };
  assert.equal(constants().CLOUD_FLAT_VOLUME_FORM, undefined);
});

test('a storm renders with the shared shader while its specialized pipeline compiles', async () => {
  const shared = {};
  const specialized = {};
  let release;
  let attempts = 0;
  const builder = fixture({ async createComputePipelineAsync({ compute }) {
    if (!compute.constants.CLOUD_FLAT_VOLUME_FORM) return shared;
    attempts++;
    return new Promise(resolve => { release = () => resolve(specialized); });
  } });
  builder._getFieldShaderModule = () => ({});
  builder._ensureFlatStagePipelineAsync = async () => {};
  builder._ensureFlatStagePipeline = () => {};
  builder.setTuning({ formType: 11 });
  const key = builder._currentComputeVariantKey();

  assert.equal(await builder.ensureComputePipelineReadyAsync(), shared);
  assert.equal(builder.ensureComputePipelineReady(), shared);
  assert.equal(await builder.ensureComputePipelineReadyAsync(), shared);
  assert.equal(attempts, 1);
  const compiling = builder._computePipelinePromises.get(key);
  release();
  await compiling;
  assert.equal(builder.ensureComputePipelineReady(), specialized);
  assert.equal(builder._computePipelineKey, key);
});

test('preview variants compile once and follow mode switches during compilation', async () => {
  let complete;
  const compiled = [];
  const device = {
    createRenderPipeline({ variant }) {
      compiled.push(variant);
      return { variant };
    },
    createRenderPipelineAsync({ variant }) {
      compiled.push(variant);
      return new Promise(resolve => { complete = () => resolve({ variant }); });
    },
  };
  const builder = fixture(device);
  builder._dvRender = new DataView(new ArrayBuffer(336));
  builder._createRenderPipelineSetup = (_format, variant = '') => ({ descriptor: { variant } });
  const set = (offset, value) => builder._dvRender.setFloat32(offset, value, true);
  const format = 'bgra8unorm';

  const general = builder._ensureRenderPipeline(format);
  set(12, 1); // field lighting
  set(156, 1); // soft finish
  assert.equal(builder._ensureRenderPipeline(format), general);
  assert.equal(builder._ensureRenderPipeline(format), general);
  assert.deepEqual(compiled, ['', 'soft']);

  const softReady = builder.ensureRenderPipelineReadyAsync(format, true);
  set(156, 2); // sculpted
  complete();
  const soft = await softReady;
  assert.equal(builder._ensureRenderPipeline(format), general);
  set(156, 1);
  assert.equal(builder._ensureRenderPipeline(format), soft);

  set(332, 1); // Planet shell
  assert.equal(builder._ensureRenderPipeline(format), general);
  assert.equal(builder._ensureRenderPipeline(format), general);
  assert.deepEqual(compiled, ['', 'soft', 'shell']);
  const shellReady = builder.ensureRenderPipelineReadyAsync(format, 'shell');
  set(332, 0);
  complete();
  const shell = await shellReady;
  assert.equal(builder._ensureRenderPipeline(format), soft);
  set(332, 1);
  assert.equal(builder._ensureRenderPipeline(format), shell);
  assert.deepEqual(compiled, ['', 'soft', 'shell']);
});
