import assert from 'node:assert/strict';
import {test} from 'node:test';
import {bakePlanetRegion, LOCAL_REGION_UNITS, planetRegionFrame, planetRegionOutline,
  projectPlanetRegionSurfacePoint} from '../../planet/planetRegion.js';
import {createPlanetRegionMesh} from '../cloudTerrainMesh.js';
import {planetRegionShapeJob, preparePlanetRegionShape} from '../../planet/planetRegionGpu.js';

test('the local grid descriptor uses the Planet sampler job layout', () => {
  const frame = {up:[0, 1, 0], east:[0, 0, 1], south:[1, 0, 0]};
  const job = planetRegionShapeJob({radius:256000}, frame, 32000, 1025);
  const f32 = new Float32Array(job);
  const u32 = new Uint32Array(job);
  assert.deepEqual(Array.from(f32.slice(0, 3)), frame.up);
  assert.equal(u32[3], 7);
  assert.deepEqual(Array.from(f32.slice(4, 7)), frame.east);
  assert.equal(u32[7], 1025);
  assert.deepEqual(Array.from(f32.slice(8, 11)), frame.south);
  assert.equal(f32[11], 0.0625);
});

test('the picker boundary follows the baked width on small and large worlds', () => {
  const frame = planetRegionFrame([1, 0, 0]);
  for (const radius of [98304, 262144, 1966080]) {
    for (const span of [4000, 12000, 32000, 80000, 160000]) {
      const outline = planetRegionOutline(frame, span, radius, () => 1234);
      for (const point of outline) {
        assert.ok(Math.abs(Math.hypot(...point) - radius - 1234) < 1e-8);
        // Invert the gnomonic projection to compare with the grid baked by the GPU.
        const [up, south, east] = point;
        assert.ok(Math.abs(Math.max(Math.abs(east), Math.abs(south)) * radius / up - span / 2) < 1e-8);
      }
    }
  }
});

test('a close camera clips hidden boundary points without resizing the visible footprint', () => {
  const radius = 262144;
  const half = 16000;
  const frame = planetRegionFrame([1, 0, 0]);
  const outline = planetRegionOutline(frame, half * 2, radius, () => 0);
  const above = {position: [radius + half * 4, 0, 0], forward: [-1, 0, 0],
    right: frame.east, up: frame.south, near: 1, tanX: 1, tanY: 1};
  const low = {...above, position: [radius + 5, 0, 0]};
  assert.ok(outline.every(point => projectPlanetRegionSurfacePoint(above, point, radius)));
  assert.ok(outline.every(point => projectPlanetRegionSurfacePoint(low, point, radius) === null));
});

test('two region grids can share the startup guide without upgrading the orbit', async () => {
  const source = Promise.withResolvers();
  const pipeline = {};
  const world = {
    startupPreview: true, terrainSampling: 'procedural',
    studioMap: {}, startupMap: {}, requestedWorld: {},
    startupVertices: source.promise,
    studioVertices: {groups: (job, shape) => [{}, {job, shape}]},
    uploadProceduralWorld(sampler, map, request) {
      assert.equal(sampler, pipeline);
      assert.equal(map, this.startupMap);
      assert.equal(request, this.requestedWorld);
      assert.equal(this.studioVertices.guide, undefined);
      this.studioVertices.guide = {};
      this.studioVertices.pipeline = sampler;
    },
  };
  const local = preparePlanetRegionShape(world);
  const context = preparePlanetRegionShape(world);
  source.resolve(pipeline);
  const encoders = await Promise.all([local, context]);
  const dispatches = [];
  const encoder = {
    beginComputePass() {
      return {
        setPipeline: actual => assert.equal(actual, pipeline),
        setBindGroup() {},
        dispatchWorkgroups: (...args) => dispatches.push(args),
        end() {},
      };
    },
  };
  encoders[0](encoder, {}, {}, 1025);
  encoders[1](encoder, {}, {}, 193);
  assert.deepEqual(dispatches, [[65, 1025], [13, 193]]);
  assert.equal(world.startupPreview, true);
});


test('the local point sampler rounds both axes up at the edge of the square', async () => {
  const world = {terrainSampling: 'procedural', regionPointRows: 4,
    studioVertices: {groups: () => []}};
  const encode = await preparePlanetRegionShape(world);
  const dispatches = [];
  const encoder = {beginComputePass: () => ({
    setPipeline() {},
    setBindGroup() {},
    dispatchWorkgroups: (...groups) => dispatches.push(groups),
    end() {},
  })};
  encode(encoder, {}, {}, 1025);
  encode(encoder, {}, {}, 577);
  assert.deepEqual(dispatches, [[65, 257], [37, 145]]);
});

test('a new wet region retains signed shoreline heights while old tiles can still render', async () => {
  const world = {radius: 262144, studioSeed: 10, studioMap: {}, oceanLevel: 5};
  const raw = [-5, 1, 5, 12];
  const tile = await bakePlanetRegion(world, [1, 0, 0], 32000, {
    resolution: 2,
    sampleGrid: () => ({elevations: Float32Array.from(raw)}),
  });
  assert.deepEqual([...tile.elevations], [5, 5, 5, 12]);
  assert.deepEqual([...tile.waterDepth], [10, 4, 0, 0]);
  const {vertices} = createPlanetRegionMesh(tile);
  const measuredDepth = -(vertices[4] + 1) * tile.span / LOCAL_REGION_UNITS;
  assert.ok(Math.abs(measuredDepth - 10) < 1e-4);
  assert.equal(createPlanetRegionMesh({...tile, waterDepth: undefined}).vertices[4], -1);
});
