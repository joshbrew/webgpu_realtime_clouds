import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Exercise the real builder methods without requiring a GPU or WGSL bundler.
const source = (await readFile(new URL('../clouds.js', import.meta.url), 'utf8'))
  .replace('import cloudWGSL from "./clouds.wgsl";', 'const cloudWGSL = "";')
  .replace('import previewWGSL from "./cloudsRender.wgsl";', 'const previewWGSL = "";');
const { CloudComputeBuilder } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function fixture(device = {}) {
  const builder = Object.create(CloudComputeBuilder.prototype);
  Object.assign(builder, {
    device, outFormat: 'rgba16float', module: {}, _computePipelineLayout: {},
    _dvOptions: new DataView(new ArrayBuffer(32)),
    _abTuning: new ArrayBuffer(256), _computePipelineKey: -1,
    _computePipelines: new Map(), _computePipelinePromises: new Map(),
    _state: { tuning: {} }, _writeIfChanged() {},
  });
  builder._dvTuning = new DataView(builder._abTuning);
  builder._dvOptions.setUint32(8, 1, true);
  builder.setTuning({ sunStride: 4 });
  return builder;
}

test('variant follows the uploaded stride and preserves all mode bits', () => {
  const builder = fixture();
  for (const [stride, detail] of [[4, false], [2, false], [1, true], [0, true], [-2, true], [1.9, true], [2.9, false]]) {
    builder.setTuning({ sunStride: stride });
    for (const spherical of [false, true]) for (const custom of [false, true]) for (const rgb of [false, true]) {
      builder._dvOptions.setFloat32(16, spherical ? 1 : 0, true);
      builder._dvOptions.setUint32(0, custom ? 1 : 0, true);
      builder._dvOptions.setUint32(8, rgb ? 1 : 0, true);
      const key = builder._currentComputeVariantKey();
      assert.equal(key, +spherical | (+custom << 2) | (+rgb << 3) | (+detail << 4));
      const { compute } = builder._computePipelineDescriptorForKey(key);
      assert.equal(compute.constants.CLOUD_DETAILED_LIGHTING, +detail);
      assert.equal(compute.entryPoint, spherical ? 'computeCloudSphere' : 'computeCloudBox');
    }
  }
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
  assert.equal(snapshot.activeKey, 8);
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
  assert.equal(builder._currentComputeVariantKey(), 8);
});

test('sync fallback retains cache and diagnostic behavior', async () => {
  let calls = 0;
  const builder = fixture({ createComputePipeline() { calls++; return {}; } });
  const pipeline = await builder.ensureComputePipelineReadyAsync();
  assert.equal(builder.ensureComputePipelineReady(), pipeline);
  assert.equal(calls, 1);
  assert.equal(builder.getComputePipelineTimings().variants[0].async, false);
});

test('shader retains dynamic detailed lighting guard and compact probe loops', async () => {
  const shader = await readFile(new URL('../clouds.wgsl', import.meta.url), 'utf8');
  assert.equal(shader.match(/CLOUD_DETAILED_LIGHTING != 0u && !fastLighting && sunStrideSafe <= 1/g)?.length, 2);
  assert.equal(shader.match(/for \(var i = 0u; i < 6u; i\+\+\)/g)?.length, 3);
  assert.match(shader, /for \(var i = 0u; i < 3u; i\+\+\)/);
});
