import * as BABYLON from 'babylonjs';
import { NoiseComputeBuilder } from './noiseCompute.js';
import { PLANET_GRADIENTS, generatePlanetMeshGpu, createBabylonPlanetMeshes } from '../planet/planetGpuMesh';
import { AtmosphericScatteringPostProcess } from '../planet/atmosphericScattering';
import { createPlanetCloudLayer, setPlanetCloudStyle, updatePlanetCloudLayer, updatePlanetCloudLayerOptions, disposePlanetCloudLayer } from '../clouds/planetClouds.js';
import { stylePlanetPanel, planetDisclosure } from '../clouds/planetPanelUi.js';
import { createRailHead, watchStatus } from '../clouds/cloudLabUi.js';
import { randomizePlanetSceneConfig } from '../clouds/planetCloudRandomize.js';
import {
  DEFAULT_SEGMENTS, DEFAULT_RADIUS, DEFAULT_HEIGHT_SCALE, MAX_VERTICES_PER_PARTITION, DEFAULT_RANDOMIZE_NOISE, DEFAULT_ATMOSPHERE_ENABLED, DEFAULT_ATMOSPHERE_HEIGHT, DEFAULT_ATMOSPHERE_RADIUS_PAD, clonePlain, mergePlain, cloudConfigForStyle, defaultAuroraConfig, mulberry32, createNoisePlanetConfigSet, gradientIndexFromOptions, isCloudTextureBakePath, createTweakPanel,
  buildPlanetCloudConfig, buildPlanetAuroraConfig,
} from './planetStudioPanel.js';
export * from './planetStudioPanel.js';

function createContainer(options = {}) {
  const parent = options.parent || document.body;
  document.documentElement.style.height = '100%';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  const container = document.createElement('section');
  container.id = options.containerId || 'noise-planet-test';
  container.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100vw',
    'height:100dvh',
    'min-height:0',
    'overflow:hidden',
    'background:#02040a',
    'color:#e8eefc',
    'font:10px/1.2 system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  ].join(';');

  const canvas = document.createElement('canvas');
  canvas.id = options.canvasId || 'noise-planet-canvas';
  canvas.style.cssText = [
    'display:block',
    'width:100%',
    'height:100%',
    'touch-action:none',
    'outline:none',
  ].join(';');

  const hud = document.createElement('aside');
  hud.className = 'cl-rail cl-root';
  hud.setAttribute('aria-label', 'Planet controls');

  const title = document.createElement('div');
  title.textContent = 'Planet clouds';
  title.dataset.panelTitle = '';
  title.style.cssText = 'font-weight:700;font-size:10px;margin-bottom:4px;letter-spacing:0.02em';

  const status = document.createElement('div');
  status.textContent = 'Initializing WebGPU...';
  status.style.cssText = 'opacity:0.82;margin-bottom:4px;white-space:pre-line;font-size:9px';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;align-items:center';

  const rerenderButton = document.createElement('button');
  rerenderButton.type = 'button';
  rerenderButton.textContent = 'Re-render';

  const disposeButton = document.createElement('button');
  disposeButton.type = 'button';
  disposeButton.textContent = 'Dispose';

  for (const button of [rerenderButton, disposeButton]) {
    button.style.cssText = [
      'appearance:none',
      'border:1px solid rgba(255,255,255,0.22)',
      'border-radius:7px',
      'background:rgba(255,255,255,0.08)',
      'color:#e8eefc',
      'padding:3px 5px',
      'font:inherit',
      'cursor:pointer',
    ].join(';');
  }

  const info = document.createElement('pre');
  info.style.cssText = [
    'margin:10px 0 0',
    'padding-top:8px',
    'border-top:1px solid rgba(255,255,255,0.12)',
    'white-space:pre-wrap',
    'font:9px/1.15 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    'opacity:0.80',
    'max-height:none',
    'overflow:visible',
    'flex:0 0 auto',
  ].join(';');

  const tweakPanel = createTweakPanel(options);

  actions.append(rerenderButton, disposeButton);
  const diagnostics = planetDisclosure('Scene diagnostics', info, actions);
  diagnostics.classList.add('cl-legacy');
  const head = createRailHead({
    title: 'Planet clouds',
    statusEl: status,
    switcher: document.getElementById('cloud-demo-navigation'),
    onToggle: () => hud.classList.toggle('is-collapsed'),
  });
  head.querySelector('.cl-rail__title').dataset.panelTitle = '';
  watchStatus(status);
  hud.append(head, tweakPanel.element);
  const applyBar = tweakPanel.element.querySelector('#planet-edit-actions');
  if (applyBar) applyBar.before(diagnostics); else hud.append(diagnostics);
  stylePlanetPanel(hud);
  container.append(canvas, hud);
  parent.appendChild(container);

  return { container, canvas, status, info, rerenderButton, disposeButton, tweakPanel };
}

function getBabylonWebGpuDevice(engine) {
  const device = engine._device || engine._deviceWrapper?.device || engine._deviceManager?._device;
  const queue = device?.queue || engine._queue || engine._deviceQueue;

  if (!device || !queue) {
    throw new Error('Could not find the native GPUDevice/GPUQueue on Babylon WebGPUEngine. Check the engine internals for this Babylon version.');
  }

  return { device, queue };
}

async function withGpuValidationScope(device, label, fn) {
  if (typeof device?.pushErrorScope !== 'function' || typeof device?.popErrorScope !== 'function') {
    return await fn();
  }

  device.pushErrorScope('validation');

  let value;
  let caught = null;
  try {
    value = await fn();
    await device.queue?.onSubmittedWorkDone?.();
  } catch (err) {
    caught = err;
  }

  let scopedError = null;
  try {
    scopedError = await device.popErrorScope();
  } catch (err) {
    if (!caught) caught = err;
  }

  if (scopedError) {
    const message = scopedError.message || String(scopedError);
    throw new Error(`${label}: ${message}`);
  }

  if (caught) throw caught;
  return value;
}

function createScene(engine, canvas, radius, options = {}) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.005, 0.008, 0.018, 1.0);

  const camera = new BABYLON.ArcRotateCamera(
    'planet-camera',
    Math.PI * 0.35,
    Math.PI * 0.38,
    radius * 4.3,
    BABYLON.Vector3.Zero(),
    scene,
  );
  camera.minZ = 0.05;
  camera.maxZ = radius * 32;
  camera.wheelPrecision = 32;
  camera.lowerRadiusLimit = radius * 1.25;
  camera.upperRadiusLimit = radius * 12;
  camera.attachControl(canvas, true);

  const sun = new BABYLON.DirectionalLight('planet-sun', new BABYLON.Vector3(-0.65, -0.28, -0.72), scene);
  sun.position = new BABYLON.Vector3(radius * 4, radius * 2.2, radius * 4);
  sun.intensity = options.sunIntensity ?? 2.4;

  const sunSource = new BABYLON.TransformNode('planet-atmosphere-sun-source', scene);
  sunSource.position.copyFrom(sun.position);

  const fill = new BABYLON.HemisphericLight('planet-fill', new BABYLON.Vector3(0.0, 1.0, 0.0), scene);
  fill.intensity = options.fillIntensity ?? 0.18;
  fill.groundColor = new BABYLON.Color3(0.05, 0.06, 0.12);

  const glow = new BABYLON.GlowLayer('planet-glow', scene, { mainTextureRatio: 0.35, blurKernelSize: 24 });
  glow.intensity = options.glowIntensity ?? 0.12;

  const depthRenderer = options.atmosphere === false
    ? null
    : scene.enableDepthRenderer(camera, false, true);

  return { scene, camera, sun, sunSource, fill, glow, depthRenderer };
}

function addStars(scene, radius) {
  const pcs = new BABYLON.PointsCloudSystem('stars', 1, scene);
  const count = 6000;
  const inner = radius * 7;
  const outer = radius * 11;

  pcs.addPoints(count, (particle) => {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const distance = inner + Math.pow(Math.random(), 0.35) * (outer - inner);

    particle.position = new BABYLON.Vector3(
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi),
    );

    const c = 0.62 + Math.random() * 0.38;
    particle.color = new BABYLON.Color4(c, c, c + Math.random() * 0.08, 1.0);
  });

  pcs.buildMeshAsync().then(() => {
    if (!pcs.mesh) return;
    pcs.mesh.name = 'stars-mesh';
    pcs.mesh.isPickable = false;
    pcs.mesh.alwaysSelectAsActiveMesh = true;
  });

  return pcs;
}


function vec3Array(v, fallback = [0, 0, 0]) {
  if (!v) return fallback.slice();
  return [
    Number.isFinite(v.x) ? v.x : fallback[0],
    Number.isFinite(v.y) ? v.y : fallback[1],
    Number.isFinite(v.z) ? v.z : fallback[2],
  ];
}

function planetCloudCameraState(runtime) {
  const camera = runtime.camera;
  const canvas = runtime.ui?.canvas;
  const pos = camera.globalPosition || camera.position;
  const forwardRay = camera.getForwardRay?.(1);
  const fwd = forwardRay?.direction || camera.getDirection(BABYLON.Axis.Z);
  const right = camera.getDirection(BABYLON.Axis.X);
  const up = camera.getDirection(BABYLON.Axis.Y);
  const width = Math.max(canvas?.width || canvas?.clientWidth || 1, 1);
  const height = Math.max(canvas?.height || canvas?.clientHeight || 1, 1);

  return {
    camPos: vec3Array(pos, [0, 0, runtime.lastResult?.radius * 4 || 200]),
    right: vec3Array(right, [1, 0, 0]),
    up: vec3Array(up, [0, 1, 0]),
    fwd: vec3Array(fwd, [0, 0, -1]),
    fovYDeg: (camera.fov || Math.PI / 3) * 180 / Math.PI,
    aspect: width / height,
  };
}

function planetCloudSunDir(runtime) {
  const dir = runtime.sun?.direction || new BABYLON.Vector3(-0.65, -0.32, -0.65);
  const n = dir.normalize ? dir.normalize() : dir;
  return vec3Array(n.scale ? n.scale(-1) : { x: -n.x, y: -n.y, z: -n.z }, [0.65, 0.32, 0.65]);
}


function summarizePlanetAuroraSettings(layer, config, startedAt) {
  if (!layer) return null;
  return {
    enabled: true,
    cloudBottom: layer.options.cloudBottom,
    cloudTop: layer.options.cloudTop,
    renderScaleDivider: layer.options.renderScaleDivider,
    weatherSize: [layer.options.weatherWidth, layer.options.weatherHeight],
    shapeSize: layer.options.shapeSize,
    detailSize: layer.options.detailSize,
    elapsedMs: typeof startedAt === 'number' ? performance.now() - startedAt : undefined,
    timings: layer.timings,
    configSummary: layer.configSummary,
    requestedConfig: config,
    effectiveOptions: layer.options,
    resourceNonce: layer.options.resourceNonce,
    cap: clonePlain(config.cap || {}),
  };
}

async function setupPlanetAurora(runtime, result, seed, options = {}) {
  const auroraOptions = typeof options.clouds === 'object' ? options.clouds.aurora : null;
  if (options.clouds === false || auroraOptions?.enabled === false) {
    disposePlanetCloudLayer(runtime.planetAurora);
    runtime.planetAurora = null;
    runtime.planetAuroraSettings = null;
    window.noisePlanetTestAuroraConfig = null;
    return null;
  }

  disposePlanetCloudLayer(runtime.planetAurora);
  runtime.planetAurora = null;
  runtime.planetAuroraSettings = null;

  const { atmosphereRadius, config, cloudOptions: layerOptions } = buildPlanetAuroraConfig(runtime, result, seed, options);
  runtime.auroraBakeSerial = (runtime.auroraBakeSerial || 0) + 1;
  layerOptions.resourceNonce = `${seed}-aurora-${runtime.auroraBakeSerial}-${Date.now()}`;

  const started = performance.now();
  runtime.ui.status.textContent = 'Baking spherical aurora weather/shape/detail textures...';

  const layer = await createPlanetCloudLayer({
    device: runtime.device,
    queue: runtime.queue,
    parent: runtime.ui.container,
    sourceCanvas: runtime.ui.canvas,
    radius: result.radius,
    atmosphereRadius,
    getCameraState: () => planetCloudCameraState(runtime),
    getSunDir: () => planetCloudSunDir(runtime),
    options: layerOptions,
  });

  runtime.planetAurora = layer;
  runtime.planetAuroraSettings = summarizePlanetAuroraSettings(layer, config, started);
  window.noisePlanetTestAuroraConfig = runtime.planetAuroraSettings;

  await updatePlanetCloudLayer(layer);
  return layer;
}

async function applyPlanetAuroraLiveSettings(runtime, options = {}, meta = {}) {
  if (!runtime?.lastResult) return null;
  const seed = Math.floor(options.seed ?? runtime.currentSeed ?? window.noisePlanetTestCurrentSeed ?? Date.now());
  const auroraOptions = typeof options.clouds === 'object' ? options.clouds.aurora : null;
  if (options.clouds === false || auroraOptions?.enabled === false) {
    disposePlanetCloudLayer(runtime.planetAurora);
    runtime.planetAurora = null;
    runtime.planetAuroraSettings = null;
    window.noisePlanetTestAuroraConfig = null;
    return null;
  }

  const { atmosphereRadius, config, cloudOptions: layerOptions } = buildPlanetAuroraConfig(runtime, runtime.lastResult, seed, options);

  if (!runtime.planetAurora || runtime.planetAurora.disposed) {
    return setupPlanetAurora(runtime, runtime.lastResult, seed, options);
  }

  runtime.planetAurora.radius = runtime.lastResult.radius;
  runtime.planetAurora.atmosphereRadius = atmosphereRadius;

  updatePlanetCloudLayerOptions(runtime.planetAurora, layerOptions, {
    resetHistory: !!meta.resetHistory,
  });

  runtime.planetAuroraSettings = summarizePlanetAuroraSettings(runtime.planetAurora, config);
  window.noisePlanetTestAuroraConfig = runtime.planetAuroraSettings;

  await updatePlanetCloudLayer(runtime.planetAurora);
  return runtime.planetAurora;
}

async function rebakePlanetAuroraTexturesOnly(runtime, options = {}) {
  if (!runtime?.lastResult) return null;
  const seed = Math.floor(options.seed ?? runtime.currentSeed ?? window.noisePlanetTestCurrentSeed ?? Date.now());
  return setupPlanetAurora(runtime, runtime.lastResult, seed, options);
}

async function setupPlanetClouds(runtime, result, seed, options = {}) {
  const cloudOptions = options.clouds;
  if (cloudOptions === false || cloudOptions?.enabled === false) {
    if(runtime.planetClouds?.activeMode)runtime.cloudRenderMode=runtime.planetClouds.activeMode;
    disposePlanetCloudLayer(runtime.planetClouds);
    runtime.planetClouds = null;
    runtime.planetCloudSettings = null;
    return null;
  }

  if(runtime.planetClouds?.activeMode)runtime.cloudRenderMode=runtime.planetClouds.activeMode;
  disposePlanetCloudLayer(runtime.planetClouds);
  runtime.planetClouds = null;
  runtime.planetCloudSettings = null;

  const { atmosphereRadius, config, cloudOptions: layerOptions } = buildPlanetCloudConfig(runtime, result, seed, options);
  runtime.cloudBakeSerial = (runtime.cloudBakeSerial || 0) + 1;
  layerOptions.resourceNonce = `${seed}-${runtime.cloudBakeSerial}-${Date.now()}`;

  const started = performance.now();
  runtime.ui.status.textContent = 'Baking spherical cloud weather/shape/detail textures...';

  const layer = await createPlanetCloudLayer({
    device: runtime.device,
    queue: runtime.queue,
    // Use a dedicated noise builder for clouds so rebakes stay deterministic
    // and do not inherit any transient terrain-builder state.
    parent: runtime.ui.container,
    sourceCanvas: runtime.ui.canvas,
    radius: result.radius,
    atmosphereRadius,
    getCameraState: () => planetCloudCameraState(runtime),
    getSunDir: () => planetCloudSunDir(runtime),
    options: layerOptions,
  });

  runtime.planetClouds = layer;
  runtime.planetCloudSettings = {
    enabled: true,
    cloudBottom: layer.options.cloudBottom,
    cloudTop: layer.options.cloudTop,
    renderScaleDivider: layer.options.renderScaleDivider,
    weatherSize: [layer.options.weatherWidth, layer.options.weatherHeight],
    shapeSize: layer.options.shapeSize,
    detailSize: layer.options.detailSize,
    elapsedMs: performance.now() - started,
    timings: layer.timings,
    configSummary: layer.configSummary,
    requestedConfig: config,
    effectiveOptions: layer.options,
    resourceNonce: layer.options.resourceNonce,
  };

  window.noisePlanetTestCloudConfig = {
    requestedConfig: config,
    effectiveOptions: layer.options,
    resourceNonce: layer.options.resourceNonce,
    summary: layer.configSummary,
  };

  await updatePlanetCloudLayer(layer);
  return layer;
}

function cloudOptionsAffectBakedTextures(path = '') {
  const p = String(path || '');
  return isCloudTextureBakePath(p);
}

async function applyPlanetCloudLiveSettings(runtime, options = {}, meta = {}) {
  if (!runtime?.lastResult) return null;
  const seed = Math.floor(options.seed ?? runtime.currentSeed ?? window.noisePlanetTestCurrentSeed ?? Date.now());
  const { atmosphereRadius, config, cloudOptions: layerOptions } = buildPlanetCloudConfig(runtime, runtime.lastResult, seed, options);

  if (!runtime.planetClouds || runtime.planetClouds.disposed) {
    return setupPlanetClouds(runtime, runtime.lastResult, seed, options);
  }

  runtime.planetClouds.radius = runtime.lastResult.radius;
  runtime.planetClouds.atmosphereRadius = atmosphereRadius;
  if(runtime.planetClouds.options.cloudStyle !== layerOptions.cloudStyle) {
    await setPlanetCloudStyle(runtime.planetClouds,layerOptions.cloudStyle,layerOptions);
  }

  updatePlanetCloudLayerOptions(runtime.planetClouds, layerOptions, {
    resetHistory: !!meta.resetHistory,
  });

  runtime.planetCloudSettings = {
    ...(runtime.planetCloudSettings || {}),
    enabled: true,
    cloudBottom: runtime.planetClouds.options.cloudBottom,
    cloudTop: runtime.planetClouds.options.cloudTop,
    renderScaleDivider: runtime.planetClouds.options.renderScaleDivider,
    weatherSize: [runtime.planetClouds.options.weatherWidth, runtime.planetClouds.options.weatherHeight],
    shapeSize: runtime.planetClouds.options.shapeSize,
    detailSize: runtime.planetClouds.options.detailSize,
    requestedConfig: config,
    effectiveOptions: runtime.planetClouds.options,
  };

  window.noisePlanetTestCloudConfig = {
    requestedConfig: config,
    effectiveOptions: runtime.planetClouds.options,
    summary: runtime.planetClouds.configSummary,
  };

  await updatePlanetCloudLayer(runtime.planetClouds);
  return runtime.planetClouds;
}

async function rebakePlanetCloudTexturesOnly(runtime, options = {}) {
  if (!runtime?.lastResult) return null;
  const seed = Math.floor(options.seed ?? runtime.currentSeed ?? window.noisePlanetTestCurrentSeed ?? Date.now());
  return setupPlanetClouds(runtime, runtime.lastResult, seed, options);
}

function disposeAtmosphere(runtime) {
  runtime.atmosphere?.dispose?.();
  runtime.atmosphere = null;

  runtime.atmosphereReference?.dispose?.();
  runtime.atmosphereReference = null;
  runtime.atmosphereSettings = null;
}

function createAtmosphereReference(scene, radius) {
  const mesh = BABYLON.MeshBuilder.CreateSphere(
    'planet-atmosphere-reference',
    { segments: 32, radius },
    scene,
  );
  mesh.isVisible = false;
  mesh.isPickable = false;
  mesh.freezeWorldMatrix();
  return mesh;
}

function pickAtmosphereWavelengths(seed, options = {}) {
  if (options.atmosphere?.redWaveLength || options.atmosphere?.greenWaveLength || options.atmosphere?.blueWaveLength) {
    return {
      red: options.atmosphere.redWaveLength ?? 700,
      green: options.atmosphere.greenWaveLength ?? 530,
      blue: options.atmosphere.blueWaveLength ?? 440,
    };
  }

  if (options.atmosphereRandomizeWavelengths === false || options.atmosphere?.randomizeWavelengths === false) {
    return { red: 700, green: 530, blue: 440 };
  }

  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  return {
    red: 700 - rng() * 300,
    green: 530 - rng() * 200,
    blue: 440 - rng() * 100,
  };
}

function setupAtmosphere(runtime, result, seed, options = {}) {
  disposeAtmosphere(runtime);

  const atmosphereOptions = {
    enabled: DEFAULT_ATMOSPHERE_ENABLED,
    height: DEFAULT_ATMOSPHERE_HEIGHT,
    falloffFactor: 15,
    intensity: 15,
    scatteringStrength: 1,
    densityModifier: 1,
    ...(options.atmosphere || {}),
  };

  if (options.atmosphere === false || atmosphereOptions.enabled === false || !runtime.depthRenderer) {
    return null;
  }

  const terrainFloor = Math.min(0, result.minHeightValue || 0);
  const planetRadius = options.atmospherePlanetRadius
    ?? atmosphereOptions.planetRadius
    ?? result.radius + terrainFloor;
  const atmosphereRadius = options.atmosphereRadius
    ?? atmosphereOptions.atmosphereRadius
    ?? result.radius + (atmosphereOptions.height ?? DEFAULT_ATMOSPHERE_HEIGHT) + DEFAULT_ATMOSPHERE_RADIUS_PAD;

  const reference = createAtmosphereReference(runtime.scene, result.radius);
  runtime.atmosphereReference = reference;

  const wavelengths = pickAtmosphereWavelengths(seed, options);
  const postProcess = new AtmosphericScatteringPostProcess(
    'planet-atmosphere-postprocess',
    reference,
    planetRadius,
    atmosphereRadius,
    runtime.sunSource,
    runtime.camera,
    runtime.depthRenderer,
    runtime.scene,
    wavelengths.red,
    wavelengths.green,
    wavelengths.blue,
    atmosphereOptions,
  );

  runtime.atmosphere = postProcess;
  runtime.atmosphereSettings = {
    planetRadius,
    atmosphereRadius,
    redWaveLength: wavelengths.red,
    greenWaveLength: wavelengths.green,
    blueWaveLength: wavelengths.blue,
    falloffFactor: postProcess.settings.falloffFactor,
    intensity: postProcess.settings.intensity,
    scatteringStrength: postProcess.settings.scatteringStrength,
    densityModifier: postProcess.settings.densityModifier,
  };

  return postProcess;
}

function formatInfo(result, configSet, elapsedMs) {
  return [
    `seed              ${result.seed ?? 'stored in options'}`,
    `segments          ${result.segments}`,
    `vertices          ${result.vertexCount}`,
    `radius            ${result.radius}`,
    `heightScale       ${result.heightScale}`,
    `normalMode        ${result.normalMode || 'sphere'}`,
    `seam canonical    ${result.canonicalizeSeams !== false}`,
    `pole canonical    ${result.canonicalizePoles !== false}`,
    `polar cap mode   ${result.polarCapMode || 'fan'}`,
    `polar blend      ${result.polarBlendRows ?? 8} rows @ ${result.polarBlendStrength ?? 0.9}`,
    `gradient          ${result.gradient.name}`, 
    `mesh partitions   ${result.partitionCount}`,
    `max partition vtx ${result.maxVerticesPerPartition}`,
    `partition skirts  ${result.partitionSkirts ? `${result.partitionSkirtDepth.toFixed(3)} units` : 'off'}`,
    `atmosphere        ${result.atmosphereSettings ? `${result.atmosphereSettings.planetRadius.toFixed(3)} -> ${result.atmosphereSettings.atmosphereRadius.toFixed(3)}` : 'off'}`,
    `spherical clouds  ${result.planetCloudSettings ? `${result.planetCloudSettings.cloudBottom.toFixed(2)} -> ${result.planetCloudSettings.cloudTop.toFixed(2)} @ /${result.planetCloudSettings.renderScaleDivider}` : 'off'}`,
    `noise range       ${result.minNoiseValue.toFixed(4)} .. ${result.maxNoiseValue.toFixed(4)}`,
    `height range      ${result.minHeightValue.toFixed(4)} .. ${result.maxHeightValue.toFixed(4)}`,
    `elapsed           ${(elapsedMs / 1000).toFixed(2)}s`,
    `offset            ${(configSet.offset ?? 0).toFixed(4)}`,
    `offset2           ${(configSet.offset2 ?? 0).toFixed(4)}`,
    `randomizer1       ${(configSet.randomizer1 ?? 0).toFixed(4)}`,
    `randomizer2       ${(configSet.randomizer2 ?? 0).toFixed(4)}`,
    `randomizer3       ${(configSet.randomizer3 ?? 0).toFixed(4)}`,
    '',
    ...(result.noiseLabels || []),
  ].join('\n');
}

export async function noisePlanetTest(options = {}) {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not available in this browser.');
  }

  const mergedOptions = {
    ...(window.NOISE_PLANET_TEST_OPTIONS || {}),
    ...options,
  };

  mergedOptions.studioTerrain ??= mergedOptions.noiseConfigs?.length ? 'noise-stack' : 'lakeshore';
  const radius = mergedOptions.radius ?? DEFAULT_RADIUS;
  const ui = createContainer(mergedOptions);
  const engine = new BABYLON.WebGPUEngine(ui.canvas, {
    antialias: mergedOptions.antialias ?? true,
    adaptToDeviceRatio: mergedOptions.adaptToDeviceRatio ?? true,
  });

  await engine.initAsync();

  const { device, queue } = getBabylonWebGpuDevice(engine);
  const builder = await withGpuValidationScope(
    device,
    'NoiseComputeBuilder initialization',
    async () => new NoiseComputeBuilder(device, queue),
  );
  const { scene, camera, sun, sunSource, depthRenderer } = createScene(engine, ui.canvas, radius, mergedOptions);
  // Studio "Save image": a full-resolution PNG of the current view, without the UI.
  mergedOptions.captureImage = async () => {
    const dataUrl = await BABYLON.Tools.CreateScreenshotAsync(engine, camera, { precision: 1 });
    return (await fetch(dataUrl)).blob();
  };
  const stars = addStars(scene, radius);

  const runtime = {
    engine,
    device,
    queue,
    scene,
    camera,
    sun,
    sunSource,
    depthRenderer,
    builder,
    atmosphere: null,
    atmosphereReference: null,
    atmosphereSettings: null,
    planetClouds: null,
    planetCloudSettings: null,
    planetAurora: null,
    planetAuroraSettings: null,
    cloudUpdatePending: false,
    cloudUpdateErrorLogged: false,
    auroraUpdatePending: false,
    auroraUpdateErrorLogged: false,
    stars,
    ui,
    tweakPanel: ui.tweakPanel,
    meshes: [],
    renderToken: 0,
    disposed: false,
    lastResult: null,
  };

  async function disposePlanetMeshes({ preserveClouds = false } = {}) {
    disposeAtmosphere(runtime);

    if (!preserveClouds) {
      if(runtime.planetClouds?.activeMode)runtime.cloudRenderMode=runtime.planetClouds.activeMode;
      disposePlanetCloudLayer(runtime.planetClouds);
      runtime.planetClouds = null;
      runtime.planetCloudSettings = null;
      disposePlanetCloudLayer(runtime.planetAurora);
      runtime.planetAurora = null;
      runtime.planetAuroraSettings = null;
      window.noisePlanetTestAuroraConfig = null;
    }

    for (const mesh of runtime.meshes) {
      mesh.material?.dispose?.();
      mesh.dispose();
    }
    runtime.meshes = [];
  }

  async function renderPlanet(renderOptions = {}) {
    const token = ++runtime.renderToken;
    const seed = Math.floor(renderOptions.seed ?? runtime.currentSeed ?? mergedOptions.seed ?? Date.now());
    runtime.currentSeed = seed;
    mergedOptions.seed = seed;
    const segments = Math.max(8, Math.floor(renderOptions.segments ?? mergedOptions.segments ?? DEFAULT_SEGMENTS));
    const heightScale = renderOptions.heightScale ?? mergedOptions.heightScale ?? DEFAULT_HEIGHT_SCALE;
    const gradient = gradientIndexFromOptions(
      { gradient: renderOptions.gradient ?? mergedOptions.gradient, gradientIndex: renderOptions.gradientIndex ?? mergedOptions.gradientIndex },
      runtime.currentGradientIndex ?? (seed % PLANET_GRADIENTS.length),
    );
    runtime.currentGradientIndex = gradient;
    mergedOptions.gradientIndex = gradient;
    mergedOptions.gradient = gradient;
    const studioTerrain = renderOptions.studioTerrain ?? mergedOptions.studioTerrain;
    const configSet = createNoisePlanetConfigSet(seed, {
      randomizeNoise: DEFAULT_RANDOMIZE_NOISE,
      ...mergedOptions,
      ...renderOptions,
    });
    configSet.seed = seed;
    window.noisePlanetTestNoiseConfig = configSet;
    window.noisePlanetTestCurrentSeed = seed;
    window.noisePlanetTestCurrentGradient = {
      index: gradient,
      name: PLANET_GRADIENTS[gradient]?.name || `Gradient ${gradient}`,
    };
    const colorOptions = {
      autoRange: true,
      ...(mergedOptions.color || {}),
      ...(renderOptions.color || {}),
    };

    const preserveCloudTextures = !!renderOptions._preserveCloudTextures
      && !!runtime.planetClouds
      && !runtime.planetClouds.disposed
      && renderOptions.clouds !== false
      && renderOptions.clouds?.enabled !== false;

    ui.rerenderButton.disabled = true;
    ui.status.textContent = preserveCloudTextures
      ? 'Generating GPU planet mesh; preserving existing baked cloud textures...'
      : 'Generating GPU planet mesh...';

    await disposePlanetMeshes({ preserveClouds: preserveCloudTextures });

    const started = performance.now();
    const result = await withGpuValidationScope(
      device,
      'Planet GPU generation',
      async () => generatePlanetMeshGpu(
        builder,
        {
          seed,
          segments,
          radius,
          noiseConfigs: configSet.noiseConfigs,
          studioTerrain,
          studioOptions: renderOptions.studioOptions ?? mergedOptions.studioOptions,
          offset: configSet.offset,
          offset2: configSet.offset2,
          heightScale,
          gradient,
          color: colorOptions,
          normalMode: renderOptions.normalMode ?? mergedOptions.normalMode ?? (studioTerrain === 'noise-stack' ? 'sphere' : 'gpu'),
          flipGpuNormals: renderOptions.flipGpuNormals ?? mergedOptions.flipGpuNormals ?? false,
          canonicalizeSeams: renderOptions.canonicalizeSeams ?? mergedOptions.canonicalizeSeams ?? true,
          canonicalizePoles: renderOptions.canonicalizePoles ?? mergedOptions.canonicalizePoles ?? true,
          polarCapMode: renderOptions.polarCapMode ?? mergedOptions.polarCapMode ?? 'fan',
          polarBlendRows: renderOptions.polarBlendRows ?? mergedOptions.polarBlendRows ?? 8,
          polarBlendStrength: renderOptions.polarBlendStrength ?? mergedOptions.polarBlendStrength ?? 0.90,
          allowFlatHeightmap: renderOptions.allowFlatHeightmap ?? mergedOptions.allowFlatHeightmap ?? false,
          maxVerticesPerPartition: renderOptions.maxVerticesPerPartition
            ?? mergedOptions.maxVerticesPerPartition
            ?? MAX_VERTICES_PER_PARTITION,
          maxPositionsPerPartition: renderOptions.maxPositionsPerPartition
            ?? mergedOptions.maxPositionsPerPartition,
          useGpuSpherePositionMode: renderOptions.useGpuSpherePositionMode
            ?? mergedOptions.useGpuSpherePositionMode
            ?? true,
          partitionSkirts: renderOptions.partitionSkirts
            ?? mergedOptions.partitionSkirts
            ?? true,
          partitionSkirtDepth: renderOptions.partitionSkirtDepth
            ?? mergedOptions.partitionSkirtDepth,
          doubleSidedPartitionSkirts: renderOptions.doubleSidedPartitionSkirts
            ?? mergedOptions.doubleSidedPartitionSkirts
            ?? true,
          textureKey: `noise-planet-${seed}-${segments}-${runtime.renderToken}`,
        },
      ),
    );

    if (runtime.disposed || token !== runtime.renderToken) return null;

    const meshes = createBabylonPlanetMeshes(scene, result.partitions, {
      isPickable: false,
      alwaysSelectAsActiveMesh: true,
      specularColor: new BABYLON.Color3(0.015, 0.015, 0.015),
    });

    runtime.meshes = meshes;
    runtime.lastResult = result;
    setupAtmosphere(runtime, result, seed, { ...mergedOptions, ...renderOptions });
    result.atmosphereSettings = runtime.atmosphereSettings;

    if (preserveCloudTextures) {
      await applyPlanetCloudLiveSettings(runtime, { ...mergedOptions, ...renderOptions }, { resetHistory: true });
      await applyPlanetAuroraLiveSettings(runtime, { ...mergedOptions, ...renderOptions }, { resetHistory: true });
      runtime.planetCloudSettings = {
        ...(runtime.planetCloudSettings || {}),
        preservedTexturesOnPlanetRebake: true,
      };
      if (runtime.planetAuroraSettings) {
        runtime.planetAuroraSettings = {
          ...(runtime.planetAuroraSettings || {}),
          preservedTexturesOnPlanetRebake: true,
        };
      }
    } else {
      await setupPlanetClouds(runtime, result, seed, { ...mergedOptions, ...renderOptions });
      await setupPlanetAurora(runtime, result, seed, { ...mergedOptions, ...renderOptions });
    }

    result.planetCloudSettings = runtime.planetCloudSettings;
    result.planetAuroraSettings = runtime.planetAuroraSettings;
    window.noisePlanetTestCloudConfig = runtime.planetCloudSettings;
    window.noisePlanetTestAuroraConfig = runtime.planetAuroraSettings;

    runtime.lastRenderOptions = clonePlain({...mergedOptions, ...renderOptions, noiseConfigs: configSet.noiseConfigs});
    const elapsedMs = performance.now() - started;
    ui.status.textContent = `Rendered in ${(elapsedMs / 1000).toFixed(2)}s`;
    ui.info.textContent = formatInfo({ ...result, seed }, configSet, elapsedMs);
    ui.rerenderButton.disabled = false;

    return meshes;
  }

  async function rebakeFromTweakPanel({ newSeed = false } = {}) {
    const panel = ui.tweakPanel;
    try {
      await panel.flushPresetPreview();
      const nextOptions = panel.readOptions({ newSeed });
      panel.setStatus(newSeed ? 'Rebaking with a new seed...' : `Rebaking seed ${nextOptions.seed} from JSON editors...`);
      await renderPlanet({
        ...nextOptions,
        _fromTweakPanel: true,
        _preserveCloudTextures: !newSeed && !panel.hasPendingCloudTextures(),
      });
      panel.markApplied();
      panel.setStatus(newSeed
        ? `Rebaked ${new Date().toLocaleTimeString()} with new seed and fresh cloud textures.`
        : `Rebaked ${new Date().toLocaleTimeString()} with same seed; manual edits applied.`
      );
    } catch (err) {
      console.error(err);
      panel.setStatus(`Rebake failed: ${err?.message || err}`);
      ui.status.textContent = err?.message || String(err);
      ui.rerenderButton.disabled = false;
    }
  }

  ui.tweakPanel.setCloudLiveApply(async ({cloudConfig}) => {
    const nextOptions = {...mergedOptions, seed:runtime.currentSeed, clouds:cloudConfig};
    await applyPlanetCloudLiveSettings(runtime, nextOptions, { resetHistory: false });
    await applyPlanetAuroraLiveSettings(runtime, nextOptions, { resetHistory: false });
  });

  ui.rerenderButton.textContent = 'New seed + rebake';
  ui.rerenderButton.addEventListener('click', () => {
    rebakeFromTweakPanel({ newSeed: true });
  });

  ui.tweakPanel.buttons.rebakeButton.addEventListener('click', () => {
    rebakeFromTweakPanel({ newSeed: false });
  });

  ui.tweakPanel.buttons.randomButton.addEventListener('click', () => {
    rebakeFromTweakPanel({ newSeed: true });
  });

  ui.tweakPanel.buttons.randomCloudButton.addEventListener('click', async () => {
    const panel = ui.tweakPanel, button = panel.buttons.randomCloudButton;
    button.disabled = true;
    try {
      panel.setStatus('Randomizing planet, atmosphere and clouds; keeping the cloud preset...');
      const pending = await panel.randomizeClouds(Date.now(), async cloudConfig => {
        const nextOptions = randomizePlanetSceneConfig({
          ...(runtime.lastRenderOptions || mergedOptions), clouds: cloudConfig,
        }, cloudConfig.seed, PLANET_GRADIENTS.length);
        panel.syncRandomizedPlanet(nextOptions);
        await renderPlanet({...nextOptions, _preserveCloudTextures: false});
      });
      panel.setStatus('Planet, atmosphere and clouds randomized; cloud shape and lighting kept.' + (pending ? ' Manual edits still pending.' : ''));
    } catch (error) {
      console.error(error);
      panel.setStatus('Planet randomize failed: ' + (error?.message || error));
    } finally { button.disabled = false; }
  });

  ui.tweakPanel.buttons.rebakeCloudButton.addEventListener('click', async () => {
    try {
      const nextOptions = ui.tweakPanel.readOptions({ newSeed: false });
      ui.tweakPanel.setStatus('Rebaking cloud and aurora weather/shape/detail textures only...');
      await rebakePlanetCloudTexturesOnly(runtime, nextOptions);
      await rebakePlanetAuroraTexturesOnly(runtime, nextOptions);
      ui.tweakPanel.markApplied();
      ui.tweakPanel.setStatus('Cloud and aurora textures updated.');
    } catch (err) {
      console.error(err);
      ui.tweakPanel.setStatus(`Cloud texture rebake failed: ${err?.message || err}`);
    }
  });

  ui.tweakPanel.buttons.currentStackButton.addEventListener('click', () => {
    ui.tweakPanel.setCurrentStack(window.noisePlanetTestNoiseConfig?.noiseConfigs || []);
  });

  ui.tweakPanel.buttons.resetButton.addEventListener('click', () => {
    ui.tweakPanel.resetEditors(window.NOISE_PLANET_TEST_OPTIONS || mergedOptions);
  });

  ui.disposeButton.addEventListener('click', () => {
    clearNoisePlanetTest(runtime);
  });

  const resize = () => engine.resize();
  window.addEventListener('resize', resize);
  runtime.resize = resize;
  runtime.renderPlanet = renderPlanet;

  scene.registerBeforeRender(() => {
    const t = performance.now() * 0.00008;
    sun.direction = new BABYLON.Vector3(-Math.cos(t), -0.32, -Math.sin(t)).normalize();
    sunSource.position.copyFrom(sun.direction.scale(-radius * 8));
    sun.position.copyFrom(sunSource.position);
    if (stars.mesh) stars.mesh.rotation.y += scene.getEngine().getDeltaTime() * 0.000008;

    if (runtime.planetClouds && !runtime.cloudUpdatePending) {
      runtime.cloudUpdatePending = true;
      updatePlanetCloudLayer(runtime.planetClouds)
        .catch((err) => {
          if (!runtime.cloudUpdateErrorLogged) {
            runtime.cloudUpdateErrorLogged = true;
            console.error('Planet cloud update failed', err);
          }
        })
        .finally(() => { runtime.cloudUpdatePending = false; });
    }

    if (runtime.planetAurora && !runtime.auroraUpdatePending) {
      runtime.auroraUpdatePending = true;
      updatePlanetCloudLayer(runtime.planetAurora)
        .catch((err) => {
          if (!runtime.auroraUpdateErrorLogged) {
            runtime.auroraUpdateErrorLogged = true;
            console.error('Planet aurora update failed', err);
          }
        })
        .finally(() => { runtime.auroraUpdatePending = false; });
    }
  });

  engine.runRenderLoop(() => {
    if (!runtime.disposed) scene.render();
  });

  await renderPlanet(mergedOptions);

  window.noisePlanetTestRender = runtime;
  window.noisePlanetTestTweakPanel = ui.tweakPanel;
  return runtime;
}

export async function clearNoisePlanetTest(runtime = window.noisePlanetTestRender) {
  if (!runtime || runtime.disposed) return;

  runtime.disposed = true;
  runtime.renderToken++;

  if (runtime.resize) window.removeEventListener('resize', runtime.resize);

  for (const mesh of runtime.meshes || []) {
    mesh.material?.dispose?.();
    mesh.dispose();
  }

  disposeAtmosphere(runtime);
  if(runtime.planetClouds?.activeMode)runtime.cloudRenderMode=runtime.planetClouds.activeMode;
  disposePlanetCloudLayer(runtime.planetClouds);
  runtime.planetClouds = null;
  disposePlanetCloudLayer(runtime.planetAurora);
  runtime.planetAurora = null;

  runtime.builder?.destroyAllTexturePairs?.();
  runtime.stars?.dispose?.();
  runtime.scene?.dispose?.();
  runtime.engine?.dispose?.();
  runtime.ui?.container?.remove?.();

  if (window.noisePlanetTestRender === runtime) {
    window.noisePlanetTestRender = null;
  }
  if (window.noisePlanetTestTweakPanel === runtime.ui?.tweakPanel) {
    window.noisePlanetTestTweakPanel = null;
  }
}

async function startNoisePlanetTestFromImport() {
  try {
    if (window.noisePlanetTestRender) {
      await clearNoisePlanetTest(window.noisePlanetTestRender);
    }

    await noisePlanetTest(window.NOISE_PLANET_TEST_OPTIONS || {});
  } catch (err) {
    console.error(err);
    const pre = document.createElement('pre');
    pre.textContent = err?.stack || err?.message || String(err);
    pre.style.cssText = [
      'position:fixed',
      'inset:12px',
      'z-index:9999',
      'overflow:auto',
      'padding:12px',
      'background:#14070a',
      'color:#ffd6d6',
      'border:1px solid #ff8f8f',
      'white-space:pre-wrap',
    ].join(';');
    document.body.appendChild(pre);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startNoisePlanetTestFromImport, { once: true });
} else {
  queueMicrotask(startNoisePlanetTestFromImport);
}

export default noisePlanetTest;
