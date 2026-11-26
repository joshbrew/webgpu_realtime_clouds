import simulationSource from './shaders/fluidCloudSimulation.wgsl';
import rockSource from './shaders/planetRegionRock.wgsl';
import regionNoise from '../planet/planetRegionTerrainNoise.wgsl';
import refinement from './shaders/planetRegionTerrainRefinement.wgsl';
import regionMaterial from './shaders/planetRegionTerrainMaterial.wgsl';
import regionSkylight from './shaders/planetRegionSkylight.wgsl';
import { resolveScenePalette } from './cloudLookPresets.js';
import {regionDetailDrawRanges, regionDrawBounds, selectRegionDetail, visibleRegionDrawRanges} from './cloudTerrainMesh.js';
import {createRegionTerrainMarch, regionTerrainMarchWGSL} from './planetRegionTerrainMarch.js';
import { LOCAL_REGION_UNITS, REGION_CONTEXT_SCALE, writePlanetRegionRockAnchor } from '../planet/planetRegion.js';
import renderSource from './shaders/fluidCloudRender.wgsl';
import oceanWavesSource from './shaders/oceanWaves.wgsl';
import sceneSkyLightingSource from './shaders/sceneSkyLighting.wgsl';
import sceneNightSkySource from './shaders/sceneNightSky.wgsl';
import { FLUID_DOMAIN_WIDTH, FLUID_MAP_FRACTION } from './fluidPlanetTerrain.js';
import { SEA_LEVEL, fluidObstacleGeometryWGSL } from './fluidCloudShapes.js';

export const GRID_SIZE = 128;
export const DOMAIN_WIDTH = FLUID_DOMAIN_WIDTH;
const PRE_PRESSURE_SWEEPS = 6;
const COARSE_PRESSURE_SWEEPS = 24;
const POST_PRESSURE_SWEEPS = 10;
const TERRAIN_LIGHT_SIZE = [160, 26, 160];
const TERRAIN_LIGHT_WORKGROUPS = TERRAIN_LIGHT_SIZE.map((n, axis) => Math.ceil(n / [8, 4, 4][axis]));
const TERRAIN_COLUMN_WORKGROUPS = [TERRAIN_LIGHT_SIZE[0], TERRAIN_LIGHT_SIZE[2]].map(n => Math.ceil(n / 8));
const TERRAIN_LIGHT_COLUMNS = 4;
const TERRAIN_LIGHT_ROWS = 32; // One workgroup covers all heights in a column.
const TERRAIN_SHADOW_WORKGROUPS = [Math.ceil(TERRAIN_LIGHT_SIZE[0] / TERRAIN_LIGHT_COLUMNS), 1, TERRAIN_LIGHT_SIZE[2]];
const TERRAIN_CONTEXT_WIDTH = DOMAIN_WIDTH * FLUID_MAP_FRACTION * REGION_CONTEXT_SCALE;

const cellsPerUnit = GRID_SIZE / DOMAIN_WIDTH;
const shaderConstants = `
const GRID = ${GRID_SIZE}u;
const DOMAIN = ${DOMAIN_WIDTH}.0;
const MAP_FRACTION = ${FLUID_MAP_FRACTION};
const TERRAIN_LOFT_MIN = -.18;
const TERRAIN_LOFT_MAX = .46;
const TERRAIN_BILLOW_MAX = .78;
const TERRAIN_LIGHT_SIZE = vec3<u32>(${TERRAIN_LIGHT_SIZE.map(n => n + 'u').join(', ')});
const TERRAIN_LIGHT_COLUMNS = ${TERRAIN_LIGHT_COLUMNS}u;
const TERRAIN_LIGHT_ROWS = ${TERRAIN_LIGHT_ROWS}u;
const TERRAIN_CONTEXT_WIDTH = ${TERRAIN_CONTEXT_WIDTH};
`;
const toGrid = world => (world + DOMAIN_WIDTH / 2) * cellsPerUnit;

async function shaderModule(device, label, source) {
  const module = device.createShaderModule({label, code:shaderConstants + fluidObstacleGeometryWGSL + source});
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter(message => message.type === 'error');
  if (errors.length) {
    throw new Error(errors.map(message => `${label} line ${message.lineNum}: ${message.message}`).join('\n'));
  }
  return module;
}

export async function createFluidCloudSimulation(device) {
  const module = await shaderModule(device, 'Fluid cloud simulation', simulationSource);
  const makeField = (label, components, width = GRID_SIZE) => device.createBuffer({
    label, size:width * width * components * Float32Array.BYTES_PER_ELEMENT,
    usage:GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  });
  const settings = device.createBuffer({
    label:'Fluid simulation settings', size:192, usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const velocity = [makeField('Fluid projected velocity', 2), makeField('Fluid advected velocity', 2)];
  const pressure = [makeField('Fluid pressure', 1), makeField('Fluid pressure scratch', 1)];
  const coarseWidth = GRID_SIZE / 2;
  const coarseCells = makeField('Fluid coarse residual and faces', 4, coarseWidth);
  const correction = [makeField('Fluid coarse pressure', 1, coarseWidth), makeField('Fluid coarse scratch', 1, coarseWidth)];
  const moisture = [makeField('Fluid cloud and vapor A', 2), makeField('Fluid cloud and vapor B', 2)];
  const forward = makeField('Fluid forward-advected water', 2);
  const corrected = makeField('Fluid corrected water', 2);
  const cloudHistory = (name) => ['A', 'B'].map(label => device.createTexture({
    label:name + ' ' + label,
    size:[GRID_SIZE, GRID_SIZE],
    format:'rgba16float',
    usage:GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
  }).createView());
  const material = cloudHistory('Fluid cloud material');
  const detail = cloudHistory('Fluid terrain detail and strain');
  const materialSampler = device.createSampler({
    addressModeU:'repeat', addressModeV:'repeat', minFilter:'linear', magFilter:'linear',
  });
  const obstacles = makeField('Fluid solid boundary', 4);
  const terrainField = makeField('Fluid terrain height and coverage', 2);
  const initialMoisture = makeField('Planet cloud and vapor snapshot', 2);
  function setTerrain(next) {
    if (!next) return;
    device.queue.writeBuffer(terrainField, 0, next.field);
    if (next.initialMoisture) device.queue.writeBuffer(initialMoisture, 0, next.initialMoisture);
  }
  const field = makeField('Fluid curl and divergence', 1);
  const parameters = new Float32Array(settings.size / 4);
  const workgroups = GRID_SIZE / 8;

  async function stage(entryPoint, groupDefs, groupsPerAxis = workgroups) {
    const pipeline = await device.createComputePipelineAsync({label:entryPoint, layout:'auto', compute:{module, entryPoint}});
    const groups = groupDefs.map(def => device.createBindGroup({
      layout:pipeline.getBindGroupLayout(0),
      entries:Object.entries(def).map(([binding, resource]) => ({binding:Number(binding),
        resource:resource instanceof GPUBuffer ? {buffer:resource} : resource})),
    }));
    return (pass, group = 0) => {
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, groups[group]);
      pass.dispatchWorkgroups(groupsPerAxis, groupsPerAxis);
    };
  }

  const [
    initialize, updateObstacles, measureCurl, advectVelocity, measureDivergence,
    solvePressure, restrictPressureResidual, solveCoarsePressure, addPressureCorrection,
    projectVelocity, advectCloud, correctCloud, mixWakeMoisture, resetCloudMaterial, transportCloudMaterial,
  ] = await Promise.all([
    stage('initialize', [{0:settings, 2:velocity[0], 3:obstacles, 8:moisture[0], 19:initialMoisture}]),
    stage('updateObstacles', [{0:settings, 3:obstacles, 16:terrainField}]),
    stage('measureCurl', [{1:velocity[0], 3:obstacles, 4:field}]),
    stage('advectVelocity', [{0:settings, 1:velocity[0], 2:velocity[1], 3:obstacles, 4:field}]),
    stage('measureDivergence', [{1:velocity[1], 3:obstacles, 4:field}]),
    stage('solvePressure', pressure.map((input, i) => ({0:settings, 3:obstacles, 4:field, 5:input, 6:pressure[1-i]}))),
    stage('restrictPressureResidual', pressure.map(input => ({
      0:settings, 3:obstacles, 4:field, 5:input, 10:coarseCells, 12:correction[0],
    })), workgroups / 2),
    stage('solveCoarsePressure', correction.map((input, i) => ({
      0:settings, 10:coarseCells, 11:input, 12:correction[1-i],
    })), workgroups / 2),
    stage('addPressureCorrection', pressure.map((input, i) => ({
      0:settings, 3:obstacles, 5:input, 6:pressure[1-i], 10:coarseCells, 11:correction[COARSE_PRESSURE_SWEEPS % 2],
    }))),
    stage('projectVelocity', pressure.map(input => ({1:velocity[1], 2:velocity[0], 3:obstacles, 5:input}))),
    stage('advectCloud', moisture.map(input => ({0:settings, 1:velocity[0], 3:obstacles, 7:input, 8:forward}))),
    stage('correctCloud', moisture.map(input => ({
      0:settings, 1:velocity[0], 3:obstacles, 7:input, 8:corrected, 9:forward, 16:terrainField,
    }))),
    stage('mixWakeMoisture', material.map((input, i) => ({
      0:settings, 3:obstacles, 7:corrected, 8:moisture[1-i], 13:input,
    }))),
    stage('resetCloudMaterial', [{7:moisture[0], 14:material[0], 18:detail[0]}]),
    stage('transportCloudMaterial', material.map((input, i) => ({
      0:settings, 1:velocity[0], 3:obstacles, 7:moisture[1-i],
      13:input, 14:material[1-i], 15:materialSampler, 16:terrainField,
      17:detail[i], 18:detail[1-i],
    }))),
  ]);
  let index = 0;
  let pressureIndex = 0;
  let revision = 0;

  function smoothPressure(pass, sweeps) {
    for (let i = 0; i < sweeps; i++) {
      solvePressure(pass, pressureIndex);
      pressureIndex = 1 - pressureIndex;
    }
  }

  function upload(dt, time, wind, objects, options = {}) {
    const {active = false, cutoff = 1, drag = 1, condensation = 1, heading = 90, formation = 0} = options;
    const angle = heading * Math.PI / 180;
    const east = active ? Math.sin(angle) : 1;
    const south = active ? -Math.cos(angle) : 0;
    parameters.set([dt, wind * cellsPerUnit * east, time, wind * cellsPerUnit * south]);
    parameters.set([active ? 1 : 0, Math.max(.03, cutoff), drag, condensation], 40);
    parameters[44] = formation;
    for (let i = 0; i < objects.length; i++) {
      const {x,z,radius,vx,vz,kind = 0,angle = 0,angularSpeed = 0} = objects[i];
      parameters.set([toGrid(x), toGrid(z), radius * cellsPerUnit, kind], 4 + i * 4);
      parameters.set([vx * cellsPerUnit, vz * cellsPerUnit, 0, 0], 16 + i * 4);
      parameters.set([Math.cos(angle), Math.sin(angle), angularSpeed, 0], 28 + i * 4);
    }
    device.queue.writeBuffer(settings, 0, parameters);
  }

  return {
    moisture, material, detail, materialSampler, terrainField, velocityField:velocity[0], setTerrain,
    get index() { return index; },
    get revision() { return revision; },
    reset(wind, objects, options) {
      index = 0;
      pressureIndex = 0;
      revision++;
      upload(0, 0, wind, objects, options);
      const encoder = device.createCommandEncoder();
      for (const buffer of pressure) encoder.clearBuffer(buffer);
      const pass = encoder.beginComputePass();
      updateObstacles(pass);
      initialize(pass);
      resetCloudMaterial(pass);
      pass.end();
      device.queue.submit([encoder.finish()]);
    },
    step(dt, time, wind, objects, options) {
      upload(dt, time, wind, objects, options);
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      updateObstacles(pass);
      measureCurl(pass);
      advectVelocity(pass);
      measureDivergence(pass);
      smoothPressure(pass, PRE_PRESSURE_SWEEPS);
      restrictPressureResidual(pass, pressureIndex);
      for (let i = 0; i < COARSE_PRESSURE_SWEEPS; i++) solveCoarsePressure(pass, i % 2);
      addPressureCorrection(pass, pressureIndex);
      pressureIndex = 1 - pressureIndex;
      smoothPressure(pass, POST_PRESSURE_SWEEPS);
      projectVelocity(pass, pressureIndex);
      advectCloud(pass, index);
      correctCloud(pass, index);
      mixWakeMoisture(pass, index);
      transportCloudMaterial(pass, index);
      pass.end();
      index = 1 - index;
      revision++;
      device.queue.submit([encoder.finish()]);
    },
  };
}

async function createTerrainPass(device, module, settings, terrainReady) {
  const fragment = {module, entryPoint:'terrainFragment', targets:[{format:'rgba16float'}, {format:'r8unorm'}]};
  const depthStencil = {format:'depth32float', depthWriteEnabled:true, depthCompare:'greater'};
  const heightPipeline = (label, width) => device.createRenderPipelineAsync({
    label, layout:'auto',
    vertex:{module, entryPoint:'terrainHeightVertex', constants:{terrainHeightWidth:width}, buffers:[
      {arrayStride:24, attributes:[{shaderLocation:0, offset:0, format:'float32x3'}]},
    ]},
    fragment:{module, entryPoint:'terrainHeightFragment', targets:[{format:'rgba16float'}]},
  });
  const pipelines = Promise.all([device.createRenderPipelineAsync({
    label:'Fluid planet terrain', layout:'auto',
    vertex:{module, entryPoint:'terrainVertex', buffers:[
      {arrayStride:24, attributes:[
        {shaderLocation:0, offset:0, format:'float32x3'}, {shaderLocation:1, offset:12, format:'float32x3'},
      ]},
      {arrayStride:4, attributes:[{shaderLocation:2, offset:0, format:'unorm8x4'}]},
    ]},
    fragment, depthStencil,
  }), heightPipeline('Fluid terrain heightfield', DOMAIN_WIDTH),
    heightPipeline('Fluid surroundings heightfield', TERRAIN_CONTEXT_WIDTH)]);
  // The shader layouts do not depend on the region. Start them before its
  // data arrives and build the CPU mesh as soon as the region is available.
  const geometry = terrainReady.then(terrain => {
    if (!terrain) return null;
    const mesh = terrain.mesh;
    const bounds = regionDrawBounds(mesh.vertices, mesh.indices, mesh.coreIndexCount, mesh.context?.resolution ?? 0);
    return {terrain, mesh, bounds};
  });
  const [prepared, [pipeline, localHeightPipeline, contextHeightPipeline]] = await Promise.all([geometry, pipelines]);
  if (!prepared) return null;
  const {terrain, mesh, bounds} = prepared;
  const refine = mesh.canRefine && terrain.rock;
  const fullRange = [[0, mesh.indices.length]];
  const create = (data, usage) => {
    const buffer = device.createBuffer({size:data.byteLength, usage:usage | GPUBufferUsage.COPY_DST});
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  };
  const storage = refine ? GPUBufferUsage.STORAGE : 0;
  const vertices = create(mesh.vertices, GPUBufferUsage.VERTEX | storage);
  const indices = create(mesh.indices, GPUBufferUsage.INDEX);
  const colors = create(mesh.materials ?? new Uint8Array(mesh.vertices.length / 6 * 4), GPUBufferUsage.VERTEX | storage);
  let group, march;
  // Both footprints use the rendered triangles so even surrounding
  // mountains can cast into the cloud volume.
  const encoder = device.createCommandEncoder();
  const bakeHeight = (label, pipeline) => {
    const view = device.createTexture({
      label, size:[512, 512], format:'rgba16float',
      usage:GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    }).createView();
    const pass = encoder.beginRenderPass({colorAttachments:[{
      view, clearValue:{r:0,g:0,b:0,a:0}, loadOp:'clear', storeOp:'store',
    }]});
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertices);
    pass.setIndexBuffer(indices, 'uint32');
    pass.drawIndexed(mesh.indices.length);
    pass.end();
    return view;
  };
  const height = bakeHeight('Fluid terrain heightfield', localHeightPipeline);
  const contextHeight = bakeHeight('Fluid surroundings heightfield', contextHeightPipeline);
  const skylightSize = refine ? 512 : 1;
  const skylight = device.createTexture({label:'Fluid terrain skylight', size:[skylightSize, skylightSize],
    format:'rgba8unorm', usage:GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING}).createView();
  if (refine) {
    const region = terrain.detailRegion;
    const module = device.createShaderModule({label:'Fluid terrain skylight', code:regionSkylight});
    const pipeline = device.createComputePipeline({
      label:'Fluid terrain skylight', layout:'auto', compute:{module, entryPoint:'bake_region_skylight'},
    });
    const data = new ArrayBuffer(32);
    new Uint32Array(data, 0, 2).set([region.resolution, mesh.context?.resolution ?? 0]);
    const core = DOMAIN_WIDTH * FLUID_MAP_FRACTION * .5;
    new Float32Array(data, 8, 4).set([core, core * REGION_CONTEXT_SCALE, core * 1.25, core * 2 / LOCAL_REGION_UNITS]);
    const uniform = create(data, GPUBufferUsage.UNIFORM);
    const group = device.createBindGroup({layout:pipeline.getBindGroupLayout(0), entries:[
      {binding:0, resource:{buffer:uniform}}, {binding:1, resource:{buffer:vertices}}, {binding:2, resource:skylight},
    ]});
    const pass = encoder.beginComputePass({label:'Fluid terrain skylight'});
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(skylightSize / 8, skylightSize / 8);
    pass.end();
  }
  device.queue.submit([encoder.finish()]);
  return {
    height, contextHeight,
    encode(encoder, view, water, depth, horizon, camera, aspect, materialSampler) {
      const sceneGroup = pipe => device.createBindGroup({layout:pipe.getBindGroupLayout(0), entries:[
        {binding:0, resource:{buffer:settings}}, {binding:3, resource:materialSampler}, {binding:14, resource:horizon}, {binding:15, resource:skylight},
      ]});
      group ??= sceneGroup(pipeline);
      let window;
      const region = terrain.detailRegion;
      if (refine && camera.orthoHalfHeight === 0) {
        const units = LOCAL_REGION_UNITS / region.span;
        const horizontal = terrain.rock.horizontalMeters * units;
        const vertical = terrain.rock.verticalMeters * units;
        const [x,y,z] = camera.position;
        const [dx,dy,dz] = camera.forward;
        const scaled = [dx * horizontal,dy * vertical,dz * horizontal];
        const length = Math.hypot(...scaled);
        window = selectRegionDetail(region,[x * horizontal,(y - SEA_LEVEL) * vertical,z * horizontal],
          scaled.map(v => v / length), 1.65);
        if (window) {
          march ??= createRegionTerrainMarch(device, module, {fragment, depthStencil}, {
            vertices, materials:colors, renderScene:sceneGroup, sampleScene:{binding:0, resource:{buffer:settings}},
          });
          march.prepare(encoder, region, window);
        }
      }
      const pass = encoder.beginRenderPass({
        label:'Fluid planet terrain',
        colorAttachments:[view, water].map(view => ({view, loadOp:'clear', storeOp:'store', clearValue:{r:0,g:0,b:0,a:0}})),
        depthStencilAttachment:{view:depth, depthClearValue:0, depthLoadOp:'clear', depthStoreOp:'discard'},
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group);
      pass.setVertexBuffer(0, vertices);
      pass.setVertexBuffer(1, colors);
      pass.setIndexBuffer(indices, 'uint32');
      const ranges = window ? regionDetailDrawRanges(region.resolution, mesh.indices.length, window) : fullRange;
      const visible = camera.orthoHalfHeight === 0
        ? visibleRegionDrawRanges(bounds, ranges, camera.position, camera.right, camera.up, camera.forward,
          2 * Math.atan(camera.halfFovTan), aspect, Boolean(window))
        : ranges;
      const maxDraws = window ? ranges.length : ranges.length + 8;
      // Small trims in the refined window can lose more batching efficiency
      // than they save. Require substantial index savings for close flight.
      const indexCount = list => list.reduce((total, [, count]) => total + count, 0);
      const worthCulling = !window || indexCount(visible) <= indexCount(ranges) * .8;
      const draws = worthCulling && visible.length <= maxDraws ? visible : ranges;
      for (const [first, count] of draws) pass.drawIndexed(count, 1, first);
      if (window) march.draw(pass);
      pass.end();
    },
  };
}

function createTerrainCloudLighting(device, settings, {material, detail, materialSampler}, height, contextHeight, pipelines) {
  const makeVolume = label => device.createTexture({
    label, size:TERRAIN_LIGHT_SIZE, dimension:'3d', format:'rgba16float',
    usage:GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  }).createView();
  const density = makeVolume('Fluid terrain cloud density');
  const light = makeVolume('Fluid terrain cloud sunlight');
  const horizon = device.createTexture({
    label:'Fluid terrain horizon', size:[TERRAIN_LIGHT_SIZE[0], TERRAIN_LIGHT_SIZE[2]], format:'rgba16float',
    usage:GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  }).createView();
  const [densityPipeline, lightPipeline, horizonPipeline] = pipelines;
  const common = [{binding:0, resource:{buffer:settings}}, {binding:3, resource:materialSampler}];
  const densityGroups = material.map((view, index) => device.createBindGroup({
    layout:densityPipeline.getBindGroupLayout(0),
    entries:[...common, {binding:1, resource:view}, {binding:6, resource:detail[index]},
      {binding:8, resource:density}, {binding:11, resource:height}],
  }));
  const lightGroup = device.createBindGroup({
    layout:lightPipeline.getBindGroupLayout(0),
    entries:[...common, {binding:9, resource:density}, {binding:10, resource:light}, {binding:14, resource:horizon}],
  });
  const horizonGroup = device.createBindGroup({
    layout:horizonPipeline.getBindGroupLayout(0),
    entries:[...common, {binding:11, resource:height}, {binding:12, resource:contextHeight}, {binding:13, resource:horizon}],
  });
  let lastDensity, lastSun;
  return {
    light, horizon,
    encode(encoder, index, densityKey, sunKey) {
      if (lastDensity === densityKey && lastSun === sunKey) return;
      const pass = encoder.beginComputePass({label:'Fluid terrain cloud lighting'});
      if (lastSun !== sunKey) {
        pass.setPipeline(horizonPipeline);
        pass.setBindGroup(0, horizonGroup);
        pass.dispatchWorkgroups(...TERRAIN_COLUMN_WORKGROUPS);
      }
      if (lastDensity !== densityKey) {
        pass.setPipeline(densityPipeline);
        pass.setBindGroup(0, densityGroups[index]);
        pass.dispatchWorkgroups(...TERRAIN_LIGHT_WORKGROUPS);
        lastDensity = densityKey;
      }
      pass.setPipeline(lightPipeline);
      pass.setBindGroup(0, lightGroup);
      pass.dispatchWorkgroups(...TERRAIN_SHADOW_WORKGROUPS);
      pass.end();
      lastSun = sunKey;
    },
  };
}

export async function createFluidCloudRenderer(device, context, format, simulationReady, initialTerrainReady) {
  const module = await shaderModule(device, 'Fluid cloud rendering', [rockSource, regionNoise, regionMaterial, oceanWavesSource, sceneSkyLightingSource, sceneNightSkySource, renderSource, refinement, regionTerrainMarchWGSL].join('\n'));
  const settings = device.createBuffer({
    label:'Fluid scene settings', size:464, usage:GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const binding = (index, resource) => ({binding:index, visibility:GPUShaderStage.FRAGMENT, ...resource});
  const texture = (index, viewDimension = '2d') => binding(index, {texture:{viewDimension}});
  // Both modes share resources so changing maps does not rebuild bind groups.
  const raymarchGroupLayout = device.createBindGroupLayout({entries:[
    binding(0, {buffer:{type:'uniform'}}), texture(1),
    binding(2, {buffer:{type:'read-only-storage'}}), binding(3, {sampler:{type:'filtering'}}),
    texture(4), binding(5, {buffer:{type:'read-only-storage'}}), texture(6), texture(7, '3d'),
    texture(11), texture(14), texture(16),
  ]});
  const raymarchLayout = device.createPipelineLayout({bindGroupLayouts:[raymarchGroupLayout]});
  let raster, lighting, terrain;
  const parameters = new Float32Array(settings.size / 4);
  function setTerrain(next) {
    terrain = next;
    parameters[85] = next?.seaRadius ?? 0;
    const rock = next?.rock;
    if (!rock) return;
    parameters.set([...rock.up, rock.radius, ...rock.east, rock.horizontalMeters, ...rock.south, rock.verticalMeters], 60);
    new Uint32Array(parameters.buffer)[51] = rock.seed;
    parameters[55] = rock.datum;
    parameters[84] = next.detailRegion.span / (next.detailRegion.resolution - 1);
    writePlanetRegionRockAnchor(parameters.buffer, 288, rock.up, rock.radius);
  }
  const firstTerrain = initialTerrainReady?.then(value => {
    if (value) setTerrain(value);
    return value;
  });

  async function prepareTerrain() {
    const lightingReady = Promise.all(['bakeTerrainCloudDensity', 'bakeTerrainCloudLight', 'bakeTerrainHorizon'].map(entryPoint =>
      device.createComputePipelineAsync({label:entryPoint, layout:'auto', compute:{module, entryPoint}})));
    const [terrainPass, simulation, lightingPipelines] = await Promise.all([
      createTerrainPass(device, module, settings, terrain ? Promise.resolve(terrain) : firstTerrain),
      simulationReady, lightingReady,
    ]);
    if (!terrainPass) return false;
    raster = terrainPass;
    lighting = createTerrainCloudLighting(device, settings, simulation, raster.height, raster.contextHeight, lightingPipelines);
    return true;
  }

  const views = new Map();
  function prepareView(useTerrain, showFlow) {
    const key = showFlow ? 'flow' : useTerrain ? 'terrain' : 'ocean';
    if (views.has(key)) return views.get(key);
    const view = {key};
    const label = showFlow ? 'Fluid flow display' : `Fluid ${key} cloud raymarch`;
    const pipeline = device.createRenderPipelineAsync({
      label, layout:raymarchLayout, vertex:{module, entryPoint:'vertexMain'},
      fragment:{module, entryPoint:showFlow ? 'flowFragment' : 'fragmentMain', targets:[{format}],
        constants:{FLUID_RAY_TERRAIN_MODE:showFlow ? 0 : key === 'terrain' ? 2 : 1}},
    });
    view.ready = Promise.all([pipeline, key === 'terrain' ? prepareTerrain() : true]).then(([render, available]) => {
      if (available) view.pipeline = render;
    });
    views.set(key, view);
    return view;
  }

  const initialView = prepareView(Boolean(firstTerrain), false);
  const [simulation] = await Promise.all([simulationReady, initialView.ready]);
  if (!initialView.pipeline) await prepareView(false, false).ready;
  const {material, detail, materialSampler, velocityField, terrainField} = simulation;
  const blank = device.createTexture({size:[1, 1], format:'rgba16float', usage:GPUTextureUsage.TEXTURE_BINDING}).createView();
  const blankLight = device.createTexture({
    size:[1, 1, 1], dimension:'3d', format:'rgba16float', usage:GPUTextureUsage.TEXTURE_BINDING,
  }).createView();
  const makeGroups = (ground, water, useTerrain) => material.map((view, index) => device.createBindGroup({
    layout:raymarchGroupLayout,
    entries:[{binding:0, resource:{buffer:settings}}, {binding:1, resource:view},
      {binding:2, resource:{buffer:velocityField}}, {binding:3, resource:materialSampler},
      {binding:4, resource:ground}, {binding:5, resource:{buffer:terrainField}},
      {binding:6, resource:detail[index]}, {binding:7, resource:useTerrain ? lighting.light : blankLight},
      {binding:11, resource:useTerrain ? raster.height : blank},
      {binding:14, resource:useTerrain ? lighting.horizon : blank}, {binding:16, resource:water}],
  }));
  const defaultGroups = makeGroups(blank, blank, false);
  let target;
  function draw(prepared, width, height, time, thickness, view, objects, selected, index, wakeDetail, windTravel, sunDirection,
      region = {}, look = {}) {
    const {position, forward, right, up, halfFovTan, orthoHalfHeight} = view;
    parameters.set([width, height, time, thickness]);
    parameters.set(position, 4);
    parameters.set(forward, 8);
    parameters.set(right, 12);
    parameters.set(up, 16);
    parameters.set([halfFovTan, orthoHalfHeight, selected], 20);
    for (let i = 0; i < objects.length; i++) {
      const {x,z,radius,kind = 0,angle = 0} = objects[i];
      parameters.set([x,z,radius,kind], 24 + i * 4);
      parameters.set([Math.cos(angle), Math.sin(angle), 0, 0], 36 + i * 4);
    }
    const [east, south] = Array.isArray(windTravel) ? windTravel : [windTravel, 0];
    parameters.set([wakeDetail, east, south], 48);
    parameters.set(sunDirection, 52);
    parameters.set([Number(Boolean(region.active)), region.layer ?? .26, region.cutoff ?? 1, terrain?.waterLevel ?? -1e6], 56);
    const heading = (region.heading ?? 90) * Math.PI / 180;
    const formation = region.formation ?? 0;
    const breakup = region.breakup ?? 0;
    parameters.set([Math.sin(heading), -Math.cos(heading), formation, breakup], 80);
    const palette = resolveScenePalette(look.grade);
    parameters.set([...palette.sky, palette.bloom], 88);
    parameters.set([...palette.sun, look.direct ?? palette.direct], 92);
    parameters.set([...palette.front, palette.directBlend], 96);
    const shadowGain = 1 / (1 + .85 * (look.shadowDarkness ?? 0));
    parameters.set([...palette.shadow.map(channel => channel * shadowGain), palette.shadowStrength], 100);
    parameters.set([...palette.transmission, palette.rim], 104);
    parameters.set([look.exposure ?? palette.exposure, palette.saturation, palette.colorLift, look.haze ?? 1], 108);
    parameters.set([palette.fogHorizon, palette.fogSun, look.shafts ?? .12, look.inspection ? 2 : 1], 112);
    device.queue.writeBuffer(settings, 0, parameters);
    const encoder = device.createCommandEncoder();
    let groups = defaultGroups;
    if (prepared.key === 'terrain') {
      const densityKey = [simulation.revision, thickness, region.layer, wakeDetail, heading, formation, breakup].join(',');
      lighting.encode(encoder, index, densityKey, sunDirection.join(','));
      if (!target || target.width !== width || target.height !== height) {
        target?.color.destroy();
        target?.depth.destroy();
        target?.water.destroy();
        const size = [width, height];
        const color = device.createTexture({label:'Fluid ground color and distance', size, format:'rgba16float',
          usage:GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT});
        const depth = device.createTexture({size, format:'depth32float', usage:GPUTextureUsage.RENDER_ATTACHMENT});
        const water = device.createTexture({label:'Fluid terrain water coverage', size, format:'r8unorm',
          usage:GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT});
        const groundView = color.createView(), waterView = water.createView();
        target = {width, height, color, depth, water, groundView, waterView, depthView:depth.createView(),
          groups:makeGroups(groundView, waterView, true)};
      }
      const signature = [position, forward, right, up, halfFovTan, orthoHalfHeight, sunDirection].join(',');
      if (target.signature !== signature) {
        raster.encode(encoder, target.groundView, target.waterView, target.depthView, lighting.horizon, view, width / height, materialSampler);
        target.signature = signature;
      }
      groups = target.groups;
    }
    const pass = encoder.beginRenderPass({
      colorAttachments:[{view:context.getCurrentTexture().createView(), loadOp:'clear', storeOp:'store',
        clearValue:{r:0,g:0,b:0,a:1}}],
    });
    pass.setPipeline(prepared.pipeline);
    pass.setBindGroup(0, groups[index]);
    pass.draw(3);
    pass.end();
    device.queue.submit([encoder.finish()]);
  }
  return {draw, prepareView, setTerrain};
}
