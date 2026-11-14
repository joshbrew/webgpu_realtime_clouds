import { mountPlanetApproach, sunDirection } from '../planet/planet-approach.esm.js';
import { isSatelliteWeatherStyle } from './planetCloudStyles.js';
import { cloudDemoUrl } from './cloudDemoNavigation.js';
import { installCloudLabTheme } from './cloudLabUi.js';
import { stylePlanetPanel } from './planetPanelUi.js';
import {
  createPlanetCloudLayer, disposePlanetCloudLayer, setPlanetCloudStyle,
  updatePlanetCloudLayer, updatePlanetCloudLayerOptions,
} from './planetClouds.js';
import { createTweakPanel, buildPlanetCloudConfig, buildPlanetAuroraConfig } from '../noise/planetStudioPanel.js';
import terrainDepthShader from './shaders/planetTerrainDepth.wgsl';
import cloudOverlayOpacityShader from './shaders/cloudOverlayOpacity.wgsl';
import cloudOverlayReconstructionShader from './shaders/cloudOverlayReconstruction.wgsl';

const cloudRadius = 50;
const referencePlanetRadius = 262_144;

async function createTerrainDepthPass(device, terrainCoverage) {
  const pipeline = await device.createComputePipelineAsync({
    label: 'Planet depth for cloud occlusion',
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: cloudOverlayOpacityShader + cloudOverlayReconstructionShader + terrainDepthShader }), entryPoint: 'main' },
  });
  const params = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const values = new Float32Array(12);
  const empty = device.createTexture({ size: [1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING });
  const emptyView = empty.createView({ dimension: '2d-array' });
  const sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
  let source, opacitySource, output, outputView, group;
  return {
    sample(depth, camera, scale, width, height, foreground) {
      const cloud = foreground?.view ?? emptyView;
      if (!output || output.width !== width || output.height !== height) {
        output?.destroy();
        output = device.createTexture({
          label: 'Planet ray distances',
          size: [width, height],
          format: 'rgba16float',
          usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
        });
        outputView = output.createView();
        group = null;
      }
      if (source !== depth || opacitySource !== cloud || !group) {
        source = depth;
        opacitySource = cloud;
        group = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: depth.createView() },
            { binding: 1, resource: outputView },
            { binding: 2, resource: { buffer: params } },
            { binding: 3, resource: cloud },
            { binding: 4, resource: sampler },
          ],
        });
      }
      values[0] = camera.near * scale;
      values[1] = camera.near / camera.far;
      values[2] = camera.tanX;
      values[3] = camera.tanY;
      values[4] = foreground?.bottom ?? 0;
      values[5] = foreground?.top ?? 0;
      values[6] = foreground?.alphaPower ?? 1;
      values[7] = foreground?.opacity ?? 0;
      values[8] = foreground?.cutoff ?? 0;
      values[9] = Number(terrainCoverage);
      values[10] = Number(foreground?.reconstruct ?? false);
      device.queue.writeBuffer(params, 0, values);
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group);
      pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
      pass.end();
      device.queue.submit([encoder.finish()]);
      return outputView;
    },
    dispose() {
      output?.destroy();
      params.destroy();
      empty.destroy();
    },
  };
}

let planet, camera, sunPhase, studio, cloudConfig, terrainEditor;
let clouds, aurora, cloudDepth, auroraDepth, activeSeed, activeRadius;
let pendingFrame = false;
let disposed = false;
let settingsWork = Promise.resolve();
let preparing = false;
let capture;
let firstSceneFrame;
let initialSettings;

// The cloud builders use a left-handed view; reflect the world and light together.
function cloudVector([x, y, z], scale = 1) {
  return [-x * scale, y * scale, z * scale];
}

function cloudCamera() {
  return {
    camPos: cloudVector(camera.position, cloudRadius / planet.radius),
    fwd: cloudVector(camera.forward),
    up: cloudVector(camera.up),
    right: cloudVector(camera.right),
    fovYDeg: camera.fov * 180 / Math.PI,
    aspect: camera.aspect,
  };
}

function layerVisible(layer, visible) {
  if (layer?.canvas) layer.canvas.style.display = visible ? '' : 'none';
}

async function createLayer(options, isAurora = false) {
  if (disposed) return null;
  const sceneReady = firstSceneFrame?.promise;
  let depth = isAurora ? auroraDepth : cloudDepth;
  if (!depth) {
    depth = await createTerrainDepthPass(planet.device, !isAurora);
    if (disposed) {
      depth.dispose();
      return null;
    }
    if (isAurora) auroraDepth = depth;
    else cloudDepth = depth;
  }
  if (options.cloudRenderMode === 'mc33-shell' && !isAurora) await sceneReady;
  if (disposed) return null;
  const layer = await createPlanetCloudLayer({
    device: planet.device,
    queue: planet.device.queue,
    parent: document.body,
    sourceCanvas: planet.canvas,
    getCameraState: cloudCamera,
    getSunDir: () => cloudVector(sunDirection(sunPhase)),
    getTerrainDepth: (width, height) => disposed ? null :
      depth.sample(planet.depth, camera, cloudRadius / planet.radius, width, height,
        isAurora ? foregroundClouds() : null),
    radius: cloudRadius,
    beforeFirstFrame: sceneReady ? () => sceneReady : undefined,
    options,
  });
  if (disposed) {
    disposePlanetCloudLayer(layer);
    return null;
  }
  return layer;
}

async function applyCloudSettings(config, rebake = false) {
  if (!planet || disposed) return;
  const seed = planet.studioSeed;
  const runtime = { planetClouds: clouds };
  const result = { radius: cloudRadius };
  const { cloudOptions } = buildPlanetCloudConfig(runtime, result, seed, { clouds: config });
  const { cloudOptions: auroraOptions } = buildPlanetAuroraConfig(runtime, result, seed, { clouds: config });
  // Keep full ray coverage on fast turns and keep the original weather/shape/detail volumes.
  const options = {
    ...cloudOptions,
    seed: config.seed ?? seed,
    loadingMessage: false,
    preloadAlternateCloudRendererOnIdle: false,
    retainCloudOpacity: true,
    reconstructAtPresentation: true,
    satelliteOrbitRefinement: true,
    surfaceFieldUpdateHz: cloudOptions.surfaceFieldUpdateHz ?? 12,
    surfaceMeshUpdateHz: cloudOptions.surfaceMeshUpdateHz ?? 12,
    surfaceComputeBudget: cloudOptions.surfaceComputeBudget ?? 0.20,
    nearSurfaceCoarseFactor: 1,
    nearSurfaceMaxSteps: 120,
    fullscreenMaxSteps: 120,
    movingFullscreenMaxSteps: 104,
    movingFullscreenCoarseFactor: 1,
    animatedTemporalBlend: 0.86,
    // Avoid alternating coarse pixel cells across overlapping transparent banks.
    reprojection: { ...cloudOptions.reprojection, temporalCellRate: 1, compactInterleave: 0, temporalBlend: 0.86 },
  };
  const planetRadius = planet.radius;
  if (isSatelliteWeatherStyle(options.cloudStyle)) {
    // The renderer uses a fixed radius of 50. Convert authored heights and
    // frequencies to the active world's scale before baking and rendering.
    const relativeRadius = planetRadius / referencePlanetRadius;
    for (const key of ['cloudBottom', 'cloudTop', 'shellMaxHalfHeight', 'stepBase']) {
      options[key] /= relativeRadius;
    }
    options.worldToUV *= relativeRadius;
    options.weatherSystemScale = relativeRadius * (config.style?.weatherSystemScale ?? 1);
  }
  const wantsClouds = options.enabled;
  const satelliteScaleChanged = isSatelliteWeatherStyle(clouds?.options.cloudStyle)
    && isSatelliteWeatherStyle(options.cloudStyle)
    && options.weatherSystemScale !== clouds.options.weatherSystemScale;
  if (wantsClouds && (!clouds || rebake)) {
    disposePlanetCloudLayer(clouds);
    clouds = null;
    clouds = await createLayer(options);
  } else if (clouds) {
    if (wantsClouds && (clouds.options.cloudStyle !== options.cloudStyle || satelliteScaleChanged)) {
      await setPlanetCloudStyle(clouds, options.cloudStyle, options);
    }
    updatePlanetCloudLayerOptions(clouds, options, { resetHistory: true });
  }
  layerVisible(clouds, wantsClouds);
  const auroraRenderOptions = { ...auroraOptions, loadingMessage: false,
    auroraTemporalBlend: 0.22, nearSurfaceCoarseFactor: 1, movingFullscreenCoarseFactor: 1, canvasZIndex: 3 };
  if (auroraOptions.enabled && (!aurora || rebake)) {
    disposePlanetCloudLayer(aurora);
    aurora = null;
    aurora = await createLayer(auroraRenderOptions, true);
  } else if (aurora) {
    updatePlanetCloudLayerOptions(aurora, auroraRenderOptions, { resetHistory: true });
  }
  layerVisible(aurora, auroraOptions.enabled);
  if (wantsClouds) activeRadius = planetRadius;
  cloudConfig = config;
}

function queueSettings(config, rebake = false) {
  settingsWork = settingsWork.catch(() => {}).then(() => applyCloudSettings(config, rebake));
  return settingsWork;
}

function setup(doc) {
  installCloudLabTheme(doc);
  doc.title = 'Planet Clouds';
  const panel = doc.getElementById('controls');
  panel.classList.add('cl-root');
  panel.style.colorScheme = 'dark';
  panel.style.overflowX = 'hidden';
  panel.querySelector('h1').textContent = 'Planet Clouds';
  const nav = panel.querySelector('nav');
  nav.replaceChildren();
  for (const [demo, label] of [['flat', 'Flat clouds'], ['planet', 'Planet clouds']]) {
    const link = doc.createElement('a');
    link.textContent = label;
    link.href = cloudDemoUrl(demo);
    if (demo === 'planet') link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  for (const id of ['controls', 'performance', 'showInterface']) {
    doc.getElementById(id).style.zIndex = '4';
  }
  const quickFlight = doc.getElementById('approach').parentElement;
  const height = doc.getElementById('altitude').parentElement;
  const randomize = doc.getElementById('random');
  const help = panel.querySelector('.help') || panel.querySelector('p');
  const status = doc.getElementById('status');
  randomize.style.display = 'none';
  const terrain = doc.createElement('div');
  for (const child of [...panel.children]) {
    if (child !== nav && child !== status && child !== quickFlight && child !== height &&
        child !== help && !child.classList.contains('heading')) terrain.append(child);
  }
  const studioOptions = {
    terrainControls: terrain,
    readTerrainLook: () => terrainEditor?.read(),
    stageTerrainLook: look => terrainEditor?.stage(look),
    getWorldSeed: () => planet?.studioSeed,
    captureImage: () => new Promise((resolve, reject) => { capture = { resolve, reject }; }),
    clouds: {
      performance: { coarseFactor: 1 },
      aurora: {
        enabled: true,
        textures: { renderScaleDivider: 3 },
        tuning: { maxSteps: 48 },
        performance: { coarseFactor: 1 },
      },
    },
  };
  studio = createTweakPanel(studioOptions);
  status.before(studio.element);
  stylePlanetPanel(panel, panel.id);
  cloudConfig = studio.readOptions().clouds;
  studio.setCloudLiveApply(({ cloudConfig }) => queueSettings(cloudConfig));
  studio.buttons.randomCloudButton.addEventListener('click', () => randomize.click());
  studio.buttons.resetButton.addEventListener('click', () => studio.resetEditors(studioOptions));
  const apply = async (rebake) => {
    try {
      await studio.flushPresetPreview();
      await terrainEditor?.apply();
      await queueSettings(studio.readOptions().clouds, rebake || studio.hasPendingCloudTextures());
      studio.markApplied();
      studio.setStatus('Studio settings applied.');
    } catch (error) {
      studio.setStatus(`Studio settings failed: ${error.message}`);
    }
  };
  studio.buttons.rebakeButton.addEventListener('click', () => apply(false));
  studio.buttons.rebakeCloudButton.addEventListener('click', () => apply(true));
}

function foregroundClouds() {
  const active = clouds?.activeLayer ?? clouds;
  if (!active || active.options.enabled === false) return null;
  const voxel = active.kind === 'mc33-shell';
  const view = voxel ? active.opacityView : active.cloudRenderView;
  if (!view) return null;
  const { cloudBottom, cloudTop, tuning, alphaPower, opacity, alphaCutoff } = active.options;
  const lift = Math.max(0, tuning?.anvilLift ?? 0);
  return { view, bottom: cloudRadius + cloudBottom, top: cloudRadius + cloudTop + lift,
    reconstruct: !voxel && active.options.reconstructAtPresentation,
    alphaPower: voxel ? 1 : alphaPower ?? 0.82, opacity: voxel ? 1 : opacity ?? 1,
    cutoff: voxel ? 0 : alphaCutoff ?? 0 };
}

function saveFrame() {
  const request = capture;
  capture = null;
  const canvas = document.createElement('canvas');
  canvas.width = planet.canvas.width;
  canvas.height = planet.canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(planet.canvas, 0, 0);
  for (const layer of [clouds, aurora]) {
    if (!layer?.canvas || layer.canvas.style.display === 'none') continue;
    ctx.globalCompositeOperation = layer === aurora ? 'lighter' : 'source-over';
    ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
  }
  canvas.toBlob(blob => blob ? request.resolve(blob) : request.reject(new Error('Screenshot capture failed.')));
}

function disposeCloudStudio(error) {
  if (disposed) return;
  disposed = true;
  firstSceneFrame?.reject(error);
  firstSceneFrame = null;
  disposePlanetCloudLayer(clouds);
  disposePlanetCloudLayer(aurora);
  cloudDepth?.dispose();
  auroraDepth?.dispose();
  capture?.reject(error);
}

await mountPlanetApproach({
  setup,
  onDeviceReady(world) {
    planet = world;
    firstSceneFrame = Promise.withResolvers();
    firstSceneFrame.promise.catch(() => {});
    studio.setStatus('Generating cloud volumes…');
    initialSettings = queueSettings(cloudConfig);
    initialSettings.catch(() => {});
  },
  sampleDepth: true,
  onTerrainReady(editor) { terrainEditor = editor; },
  onFrame(world, view, phase) {
    planet = world;
    camera = view;
    sunPhase = phase;
    firstSceneFrame?.resolve();
    firstSceneFrame = null;
    if (pendingFrame || disposed) return;
    const seed = world.studioSeed;
    pendingFrame = true;
    (async () => {
      const seedChanged = seed !== activeSeed;
      const scaleChanged = world.radius !== activeRadius && isSatelliteWeatherStyle(cloudConfig.cloudStyle);
      if ((seedChanged || scaleChanged) && !preparing) {
        const first = activeSeed === undefined;
        activeSeed = seed;
        activeRadius = world.radius;
        preparing = true;
        studio.setStatus('Generating cloud volumes…');
        try {
          if (first) await (initialSettings ?? queueSettings(cloudConfig));
          else if (!seedChanged) await queueSettings(cloudConfig);
          else await studio.randomizeClouds(seed, config => queueSettings(config, true));
          studio.setStatus('Clouds ready.');
        } finally {
          preparing = false;
          initialSettings = null;
        }
      }
      await updatePlanetCloudLayer(clouds);
      await updatePlanetCloudLayer(aurora);
      if (capture) saveFrame();
    })().catch((error) => {
      if (disposed) return;
      studio.setStatus(`Cloud render failed: ${error.message}`);
      console.error(error);
    }).finally(() => { pendingFrame = false; });
  },
  onDispose() {
    disposeCloudStudio(new Error('The planet preview closed.'));
  },
}).catch(error => {
  disposeCloudStudio(error);
  throw error;
});

