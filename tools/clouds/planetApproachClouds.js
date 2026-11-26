import { atmosphereColors, mountPlanetApproach, planetNightRotation, sunDirection } from '../planet/planet-approach.esm.js';
import { isSatelliteWeatherStyle, PLANET_CLOUD_STYLES } from './planetCloudStyles.js';
import { populateCloudDemoNavigation, pushCloudDemoRoute } from './cloudDemoNavigation.js';
import { installCloudLabTheme } from './cloudLabUi.js';
import {stageFluidRegion} from './fluidRegionHandoff.js';
import { stylePlanetPanel } from './planetPanelUi.js';
import { mountPlanetRegionPicker } from '../planet/planetRegionPicker.js';
import { PLANET_CLOUD_RADIUS } from './planetCloudStyles.js';
import { planetCloudMotion } from './planetCloudMotion.js';
import { readPlanetRegion, REGION_WEATHER_SCALE } from '../planet/planetRegion.js';
import { localPlanetCloudPreset } from './localPlanetClouds.js';
import { capturePlanetSurfaceRegionWeather } from './planetCloudSurface.js';
import {
  createPlanetCloudLayer, disposePlanetCloudLayer, getPlanetCloudRenderMode, togglePlanetCloudRenderMode,
  updatePlanetCloudLayer, updatePlanetCloudLayerOptions,
} from './planetClouds.js';
import { createTweakPanel, buildPlanetCloudConfig, buildPlanetAuroraConfig, cloudConfigForStyle, keepSelectedCloudLighting } from '../noise/planetStudioPanel.js';
import terrainDepthShader from './shaders/planetTerrainDepth.wgsl';
import oceanWaves from './shaders/oceanWaves.wgsl';
import planetOceanWaves from './shaders/planetOceanWaves.wgsl';
import sceneSkyLighting from './shaders/sceneSkyLighting.wgsl';
import sceneNightSky from './shaders/sceneNightSky.wgsl';
import sceneConstellation from './shaders/sceneConstellation.wgsl';
import {createConstellationGaze, nightConstellationsWGSL} from './nightConstellations.js';
import planetAerialPerspective from './shaders/planetAerialPerspective.wgsl';
import planetSkyLighting from './shaders/planetSkyLighting.wgsl';
import { FLUID_TWILIGHT_GRADE, GRADE_PRESETS, resolveScenePalette, sceneLightingValues, MAX_SCENE_HAZE } from './cloudLookPresets.js';
import cloudOverlayOpacityShader from './shaders/cloudOverlayOpacity.wgsl';
import cloudOverlayReconstructionShader from './shaders/cloudOverlayReconstruction.wgsl';

const returnRegionId = new URL(location.href).searchParams.get('region');
const returnRegion = returnRegionId ? await readPlanetRegion(returnRegionId).catch(() => undefined) : undefined;
const restoredCloudState = returnRegion?.cloudState;
const initialTerrain = returnRegion && {
  seed: returnRegion.seed, preset: returnRegion.preset, radius: returnRegion.radius,
  ...restoredCloudState?.terrain,
};
let restoreCloudClock = restoredCloudState?.clock;

const cloudRadius = PLANET_CLOUD_RADIUS;
const referencePlanetRadius = 262_144;
const weatherStyles = ['realistic', 'broken_cumulus', 'anvil_thunderstorms',
  'frontal_wave_bands', 'wind_swept_clouds', 'ice_filaments'];
const weatherHoldSeconds = 8;
const weatherFadeSeconds = 3;
const weatherPreloadSeconds = 4;

async function createTerrainDepthPass(device, terrainCoverage) {
  const pipeline = await device.createComputePipelineAsync({
    label: 'Planet depth for cloud occlusion',
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: cloudOverlayOpacityShader + cloudOverlayReconstructionShader + terrainDepthShader }), entryPoint: 'main' },
  });
  const params = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const values = new Float32Array(20);
  const empty = device.createTexture({ size: [1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING });
  const emptyView = empty.createView({ dimension: '2d-array' });
  const sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
  let source, opacitySource, nextOpacitySource, output, outputView, group;
  let sampledCamera, sampledScale;
  return {
    sample(depth, camera, scale, width, height, foreground) {
      // Both cloud banks can use the same terrain distances within one camera frame.
      if (terrainCoverage && camera === sampledCamera && scale === sampledScale && depth === source &&
          output?.width === width && output.height === height) return outputView;
      const current = foreground?.current;
      const next = foreground?.next;
      const cloud = current?.view ?? emptyView;
      const nextCloud = next?.view ?? emptyView;
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
      if (source !== depth || opacitySource !== cloud || nextOpacitySource !== nextCloud || !group) {
        source = depth;
        opacitySource = cloud;
        nextOpacitySource = nextCloud;
        group = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: depth.createView() },
            { binding: 1, resource: outputView },
            { binding: 2, resource: { buffer: params } },
            { binding: 3, resource: cloud },
            { binding: 4, resource: sampler },
            { binding: 5, resource: nextCloud },
          ],
        });
      }
      values[0] = camera.near * scale;
      values[1] = camera.near / camera.far;
      values[2] = camera.tanX;
      values[3] = camera.tanY;
      values[4] = current?.bottom ?? 0;
      values[5] = current?.top ?? 0;
      values[6] = current?.alphaPower ?? 1;
      values[7] = current?.opacity ?? 0;
      values[8] = current?.cutoff ?? 0;
      values[9] = Number(terrainCoverage);
      values[10] = Number(current?.reconstruct ?? false);
      values[11] = foreground?.blend ?? 0;
      values[12] = next?.bottom ?? values[4];
      values[13] = next?.top ?? values[5];
      values[14] = next?.alphaPower ?? 1;
      values[15] = next?.opacity ?? 0;
      values[16] = next?.cutoff ?? 0;
      values[17] = Number(next?.reconstruct ?? false);
      device.queue.writeBuffer(params, 0, values);
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group);
      pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
      pass.end();
      device.queue.submit([encoder.finish()]);
      sampledCamera = camera;
      sampledScale = scale;
      return outputView;
    },
    dispose() {
      output?.destroy();
      params.destroy();
      empty.destroy();
    },
  };
}

let planet, camera, sunPhase, animation, studio, cloudConfig, terrainEditor, atmosphereControl, orbitPlanet, regionPicker;
let clouds, aurora, cloudDepth, auroraDepth, activeSeed, activeRadius;
let pendingFrame = false;
let disposed = false;
let settingsWork = Promise.resolve();
let preparing = false;
let capture;
let firstSceneFrame;
let initialSettings;
let cloudShadowControl, cloudOverlay, weatherToggle, weatherStatus, rendererButton;
let incoming, blend = 0, nextWeatherAt;
let weatherVersion = 0, weatherIndex = 0;
let settingsPending = 0, loadingNext = false, switchingRenderer = false;

function weatherLabel(layer) {
  return PLANET_CLOUD_STYLES.find(preset => preset.id === layer?.options.cloudStyle)?.label ?? '';
}

function refreshWeatherControls() {
  const current = weatherLabel(clouds);
  const next = weatherLabel(incoming?.layer);
  const status = !clouds ? 'Preparing clouds…' : !clouds.options.enabled ? 'Clouds hidden' :
    next && blend > 0 ? current + ' → ' + next : current;
  if (weatherStatus.textContent !== status) weatherStatus.textContent = status;
  const mode = getPlanetCloudRenderMode(clouds);
  if (rendererButton.dataset.cloudRenderMode !== mode) {
    rendererButton.dataset.cloudRenderMode = mode;
    studio.setCloudTextureRenderer(mode);
    rendererButton.textContent = mode === 'mc33-shell' ? 'Cloud renderer: Voxel mesh (MC33)' : 'Cloud renderer: Raymarch';
    rendererButton.setAttribute('aria-pressed', String(mode === 'mc33-shell'));
  }
  rendererButton.disabled = !clouds?.options.enabled || loadingNext || !!incoming || switchingRenderer || preparing || settingsPending > 0;
}

function cloudHost(layer) {
  return layer?.parent;
}

function disposeWeatherLayer(layer) {
  const host = cloudHost(layer);
  disposePlanetCloudLayer(layer);
  host?.remove();
}

function finishWeather(keepIncoming) {
  if (!incoming) return;
  const { layer, completed } = incoming;
  incoming = null;
  completed.resolve();
  blend = 0;
  if (keepIncoming) {
    disposeWeatherLayer(clouds);
    clouds = layer;
  } else {
    disposeWeatherLayer(layer);
  }
  if (cloudHost(clouds)) cloudHost(clouds).style.opacity = '1';
  nextWeatherAt = animation.time + weatherHoldSeconds;
  refreshWeatherControls();
}

function restartWeather() {
  weatherVersion++;
  weatherIndex = weatherStyles.indexOf(clouds?.options.cloudStyle);
  nextWeatherAt = undefined;
}

// The cloud builders use a left-handed view; reflect the world and light together.
function cloudVector([x, y, z], scale = 1) {
  return [-x * scale, y * scale, z * scale];
}

function selectedWeatherLayer() {
  const selected = incoming && blend >= .5 ? incoming.layer : clouds;
  return selected?.activeLayer ?? selected;
}

function sourceCloudState() {
  const layer = selectedWeatherLayer();
  const options = layer?.options;
  if (!options) return undefined;
  const clock = layer.animationClock;
  const time = clock?.time ?? 0;
  const style = options.cloudStyle;
  const seed = layer.seed ?? options.seed ?? planet.studioSeed;
  const config = style === cloudConfig?.cloudStyle ? cloudConfig : rotatingWeatherConfig(style);
  const motion = planetCloudMotion(options, time);
  const {cloudBottom, cloudTop, transforms = {}} = options;
  const offset = transforms.shapeOffsetWorld ?? [0, 0, 0];
  const shapeScale = (options.worldToUV ?? (layer.kind === 'mc33-shell' ? 2.4 / cloudRadius :
    .78 / Math.max(cloudTop - cloudBottom, 1))) * (transforms.shapeScale ?? .44);
  return {
    seed, style, clock: { time, texturePhase: clock?.texturePhase },
    shapePhase: offset[1] + motion.evolution,
    volume: Number.isFinite(shapeScale) && cloudTop > cloudBottom ? {
      radius: cloudRadius, bottom: cloudBottom, top: cloudTop, shapeScale, density: options.params?.globalDensity,
      axis: transforms.shapeAxisScale ?? [1, 1, 1], shapeSize: options.shapeSize ?? 128,
      longitude: offset[0] + motion.shapeOffsetWorld[0], meridian: offset[2],
      warpPhase: motion.warpPhase, warpAmount: motion.warpAmount,
    } : undefined,
    config: { ...config, seed }, terrain: terrainEditor?.read(), sunTurn: sunPhase, paused: animation?.paused === true,
  };
}

async function captureRegionWeather(frame, span) {
  const layer = selectedWeatherLayer();
  const style = layer?.options.cloudStyle;
  if (!layer?.options.enabled || !localPlanetCloudPreset(style)) return;
  const coverage = layer.options.params?.globalCoverage;
  const scale = span * REGION_WEATHER_SCALE / planet.radius;
  const projection = new Float32Array(12);
  projection.set(cloudVector(frame.up), 0);
  projection.set(cloudVector(frame.east, scale), 4);
  projection.set(cloudVector(frame.south, scale), 8);
  const resolution = 256;
  const builder = layer.cloudBuilder;
  const pixels = await (layer.kind === 'mc33-shell'
    ? capturePlanetSurfaceRegionWeather(layer, projection, resolution)
    : builder?.weatherView && builder.capturePlanetRegionWeather(projection, resolution));
  if (pixels) return {style, coverage, resolution, pixels};
}

function cloudCamera() {
  return {
    camPos: cloudVector(camera.position, cloudRadius / planet.radius),
    fwd: cloudVector(camera.forward),
    up: cloudVector(camera.up),
    right: cloudVector(camera.right),
    fovYDeg: camera.fov * 180 / Math.PI,
    aspect: camera.aspect,
    animation,
    terrainCloudShadows: cloudShadowControl?.checked,
    atmosphere: atmosphereColors(planet.preset, atmosphereControl.value, planet.studioSeed),
  };
}

function layerVisible(layer, visible) {
  if (layer?.canvas) layer.canvas.style.display = visible ? '' : 'none';
}

async function createLayer(options, isAurora = false, hidden = false) {
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
  const host = isAurora ? null : document.createElement('div');
  if (host) {
    host.style.cssText = 'position:absolute;inset:0;mix-blend-mode:plus-lighter;opacity:' + (hidden ? 0 : 1);
    cloudOverlay.append(host);
  }
  let layer;
  try {
    layer = await createPlanetCloudLayer({
      device: planet.device,
      queue: planet.device.queue,
      parent: host ?? document.body,
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
  } catch (error) {
    host?.remove();
    throw error;
  }
  if (disposed) {
    disposePlanetCloudLayer(layer);
    host?.remove();
    return null;
  }
  return layer;
}

function cloudRenderOptions(config) {
  const seed = planet.studioSeed;
  const { cloudOptions } = buildPlanetCloudConfig({ planetClouds: clouds }, { radius: cloudRadius }, seed, { clouds: config });
  // Keep full ray coverage on fast turns and keep the original weather/shape/detail volumes.
  const options = {
    ...cloudOptions,
    seed: config.seed ?? seed,
    loadingMessage: false,
    showRenderModeToggle: false,
    preloadAlternateCloudRendererOnIdle: false,
    retainCloudOpacity: true,
    reconstructAtPresentation: true,
    godRayAirHeight: 75000 * cloudRadius / planet.radius,
    satelliteOrbitRefinement: true,
    gasOrbitRefinement: true,
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
  return options;
}

async function prepareWeather(options, startTime, version) {
  const layer = await createLayer(options, false, true);
  if (!layer) return false;
  if (weatherVersion !== version) {
    disposeWeatherLayer(layer);
    return false;
  }
  incoming = { layer, startTime, completed: Promise.withResolvers() };
  return true;
}

function rotatingWeatherConfig(style) {
  const preset = cloudConfigForStyle(style, cloudRadius);
  for (const key of ['renderScaleDivider', 'updateEvery', 'outputFormat']) {
    preset.textures[key] = cloudConfig.textures[key];
  }
  return keepSelectedCloudLighting({
    ...preset,
    seed: cloudConfig.seed,
    enabled: cloudConfig.enabled,
    performance: cloudConfig.performance,
    reprojection: cloudConfig.reprojection,
    nearSurfaceAdaptiveQuality: cloudConfig.nearSurfaceAdaptiveQuality,
    motion: { ...preset.motion, animate: cloudConfig.motion.animate },
    render: { ...preset.render, shadingBlur: cloudConfig.render.shadingBlur },
    style: { ...preset.style, ...cloudConfig.style },
  }, cloudConfig);
}

function scheduleWeather() {
  if (!weatherToggle.checked || animation.paused || !clouds?.options.enabled ||
      incoming || loadingNext || switchingRenderer || settingsPending) return;
  nextWeatherAt ??= animation.time + weatherHoldSeconds;
  if (animation.time < nextWeatherAt - weatherPreloadSeconds) return;
  const nextIndex = (weatherIndex + 1) % weatherStyles.length;
  const version = weatherVersion;
  const seed = planet.studioSeed;
  const radius = planet.radius;
  const startTime = nextWeatherAt;
  loadingNext = true;
  refreshWeatherControls();
  settingsWork = settingsWork.catch(() => {}).then(async () => {
    if (version !== weatherVersion || seed !== planet.studioSeed || radius !== planet.radius || disposed) return;
    const style = weatherStyles[nextIndex];
    if (clouds.options.cloudStyle === style ||
        await prepareWeather(cloudRenderOptions(rotatingWeatherConfig(style)), startTime, version)) {
      weatherIndex = nextIndex;
      nextWeatherAt = animation.time + weatherHoldSeconds;
    }
  }).catch(error => {
    nextWeatherAt = animation.time + weatherHoldSeconds;
    studio.setStatus('Weather preset could not load. The current clouds are still active.');
    console.error(error);
  }).finally(() => {
    loadingNext = false;
    refreshWeatherControls();
  });
}

async function presentWeather() {
  await updatePlanetCloudLayer(clouds);
  const transition = incoming;
  if (!transition) return;
  const { layer, startTime } = transition;
  if (startTime !== undefined && animation.time < startTime) return;
  const now = startTime === undefined ? performance.now() / 1000 : animation.time;
  transition.fadeStart ??= now;
  await updatePlanetCloudLayer(layer);
  if (incoming !== transition || disposed) return;
  const duration = startTime === undefined ? 1.35 : weatherFadeSeconds;
  const elapsed = transition.wallClockStart === undefined ? now - transition.fadeStart :
    performance.now() / 1000 - transition.wallClockStart;
  transition.elapsed = elapsed;
  const t = Math.max(0, Math.min(1, elapsed / duration));
  blend = t * t * (3 - 2 * t);
  cloudHost(layer).style.opacity = String(blend);
  cloudHost(clouds).style.opacity = String(1 - blend);
  if (t === 1) finishWeather(true);
  else if (t > 0) refreshWeatherControls();
}

async function applyCloudSettings(config, { rebake, auroraOnly, replaceWorld }) {
  if (!planet || disposed) return;
  if (!auroraOnly) {
    // Finish a visible fade before applying a new selection, even if the
    // weather clock is paused. A hidden preload can be discarded immediately.
    if (incoming && blend > 0 && !replaceWorld) {
      incoming.wallClockStart ??= performance.now() / 1000 - incoming.elapsed;
      await incoming.completed.promise;
      if (disposed) return;
    } else {
      finishWeather(false);
    }
    const options = cloudRenderOptions(config);
    const wantsClouds = options.enabled;
    if (wantsClouds && (!clouds?.options.enabled || replaceWorld)) {
      const next = await createLayer(options, false, !!clouds);
      if (next) {
        if (restoreCloudClock) {
          (next.activeLayer ?? next).animationClock = { ...restoreCloudClock };
          restoreCloudClock = undefined;
        }
        disposeWeatherLayer(clouds);
        clouds = next;
        cloudHost(clouds).style.opacity = '1';
      }
    } else if (clouds) {
      const satelliteScaleChanged = isSatelliteWeatherStyle(options.cloudStyle) &&
        options.weatherSystemScale !== clouds.options.weatherSystemScale;
      if (wantsClouds && (rebake || clouds.options.cloudStyle !== options.cloudStyle || satelliteScaleChanged)) {
        await prepareWeather(options, undefined, weatherVersion);
      } else {
        updatePlanetCloudLayerOptions(clouds, options, { resetHistory: true });
      }
    }
    layerVisible(clouds, wantsClouds);
    restartWeather();
  }
  const { cloudOptions: auroraOptions } = buildPlanetAuroraConfig(
    { planetClouds: clouds }, { radius: cloudRadius }, planet.studioSeed, { clouds: config },
  );
  const auroraRenderOptions = { ...auroraOptions, loadingMessage: false,
    auroraTemporalBlend: 0.22, nearSurfaceCoarseFactor: 1, movingFullscreenCoarseFactor: 1, canvasZIndex: 3 };
  if (auroraOptions.enabled && (!aurora || rebake || replaceWorld)) {
    disposePlanetCloudLayer(aurora);
    aurora = null;
    aurora = await createLayer(auroraRenderOptions, true);
  } else if (aurora) {
    updatePlanetCloudLayerOptions(aurora, auroraRenderOptions, { resetHistory: true });
  }
  layerVisible(aurora, auroraOptions.enabled);
  cloudConfig = config;
}

function queueSettings(config, options = {}) {
  if (!options.auroraOnly) restartWeather();
  settingsPending++;
  refreshWeatherControls();
  settingsWork = settingsWork.catch(() => {}).then(() => applyCloudSettings(config, options)).finally(() => {
    settingsPending--;
    refreshWeatherControls();
  });
  return settingsWork;
}

let pendingStorybookClouds, randomizeFromSeed;

function setup(doc) {
  installCloudLabTheme(doc);
  doc.title = 'Planet Clouds';
  const panel = doc.getElementById('controls');
  atmosphereControl = doc.getElementById('atmosphere');
  panel.classList.add('cl-root');
  panel.style.colorScheme = 'dark';
  panel.style.overflowX = 'hidden';
  panel.querySelector('h1').textContent = 'Planet Clouds';
  const nav = panel.querySelector('nav');
  nav.replaceChildren();
  populateCloudDemoNavigation(nav, doc);
  for (const id of ['controls', 'performance', 'showInterface']) {
    doc.getElementById(id).style.zIndex = '4';
  }
  const quickFlight = doc.getElementById('approach').parentElement;
  const height = doc.getElementById('altitude').parentElement;
  const randomize = doc.getElementById('random');
  const help = panel.querySelector('.help') || panel.querySelector('p');
  const animationButton = doc.getElementById('sceneAnimation');
  const status = doc.getElementById('status');
  randomize.style.display = 'none';
  const terrain = doc.createElement('div');
  for (const child of [...panel.children]) {
    if (child !== nav && child !== status && child !== quickFlight && child !== height &&
        child !== help && child !== animationButton && !child.classList.contains('heading')) terrain.append(child);
  }
  const shadowLabel = doc.createElement('label');
  shadowLabel.className = 'checks';
  cloudShadowControl = doc.createElement('input');
  cloudShadowControl.type = 'checkbox';
  cloudShadowControl.id = 'cloudShadows';
  cloudShadowControl.checked = true;
  shadowLabel.append(cloudShadowControl, ' Cloud shadows (raymarch)');
  height.after(shadowLabel);
  regionPicker = mountPlanetRegionPicker(doc, shadowLabel, () => ({
    world: planet, camera, cloudStyle: selectedWeatherLayer()?.options.cloudStyle ?? cloudConfig?.cloudStyle,
    cloudState: sourceCloudState(),
    sunlight: Number.isFinite(sunPhase) ? sunDirection(sunPhase) : undefined,
    captureWeather: captureRegionWeather,
  }), openFluidRegion);
  cloudOverlay = doc.createElement('div');
  cloudOverlay.style.cssText = 'position:absolute;inset:0;z-index:2;isolation:isolate;pointer-events:none';
  doc.body.append(cloudOverlay);
  const weatherRow = doc.createElement('label');
  weatherRow.className = 'checks';
  weatherToggle = doc.createElement('input');
  weatherToggle.type = 'checkbox';
  weatherToggle.id = 'planet-weather-cycle';
  weatherToggle.checked = false;
  weatherStatus = doc.createElement('output');
  weatherStatus.id = 'planet-weather-current';
  weatherStatus.setAttribute('aria-live', 'polite');
  weatherStatus.style.cssText = 'display:block;font-size:.85em;margin:0 0 .5rem;color:#a7bed1';
  weatherRow.append(weatherToggle, ' Evolving weather');
  animationButton.after(weatherRow, weatherStatus);
  weatherToggle.addEventListener('change', () => {
    restartWeather();
    if (!weatherToggle.checked) {
      queueSettings(cloudConfig).catch(error => studio.setStatus('Cloud settings failed: ' + error.message));
    }
  });
  const studioOptions = {
    terrainControls: terrain,
    readTerrainLook: () => terrainEditor?.read(),
    stageTerrainLook: look => terrainEditor?.stage(look),
    getWorldSeed: () => planet?.studioSeed,
    viewAurora(pole) {
      if (!orbitPlanet || !planet) return;
      const north = pole === 'north';
      return orbitPlanet({
        direction: north ? [-0.32, 0.91, 0.28] : [-0.30, -0.94, -0.14],
        altitude: planet.radius * 0.7,
        sunTurn: north ? 0.5 : 0,
      });
    },
    captureImage: () => new Promise((resolve, reject) => { capture = { resolve, reject }; }),
    clouds: restoredCloudState?.config ?? (returnRegion?.cloudStyle && cloudConfigForStyle(returnRegion.cloudStyle)) ?? {
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
  studio.setCloudLiveApply(({ cloudConfig, path }) => {
    const auroraOnly = path.startsWith('aurora.');
    if (!auroraOnly) weatherToggle.checked = false;
    if (path === 'style.colorPresetId' && Number(cloudConfig.style?.colorPresetId) === FLUID_TWILIGHT_GRADE) {
      setPlanetSunElevation?.(GRADE_PRESETS[FLUID_TWILIGHT_GRADE].sunElevation);
    }
    return queueSettings(cloudConfig, { auroraOnly });
  });
  rendererButton = doc.createElement('button');
  rendererButton.type = 'button';
  rendererButton.className = 'cl-btn';
  rendererButton.style.width = '100%';
  doc.getElementById('planet-render-mode-slot').append(rendererButton);
  refreshWeatherControls();
  rendererButton.addEventListener('click', () => {
    if (rendererButton.disabled) return;
    switchingRenderer = true;
    refreshWeatherControls();
    settingsWork = settingsWork.catch(() => {}).then(() => togglePlanetCloudRenderMode(clouds))
      .catch(error => studio.setStatus('Cloud renderer could not switch: ' + error.message))
      .finally(() => {
        switchingRenderer = false;
        refreshWeatherControls();
      });
  });
  const terrainPreset = doc.getElementById('preset');
  const cloudShape = doc.getElementById('planet-shape-preset');
  terrainPreset.addEventListener('change', () => {
    const previousShape = cloudShape.value;
    pendingStorybookClouds = terrainPreset.value === 'storybook-glacier' ? (preset) => {
      if (preset !== 'storybook-glacier' && terrainPreset.disabled) return;
      pendingStorybookClouds = null;
      if (preset === 'storybook-glacier' && cloudShape.value === previousShape && previousShape !== 'storybook') {
        cloudShape.value = 'storybook';
        cloudShape.dispatchEvent(new Event('change'));
      }
    } : null;
  });
  studio.buttons.randomCloudButton.addEventListener('click', async () => {
    if (!planet || randomize.disabled || randomizeFromSeed !== undefined) return;
    const previousSeed=planet.studioSeed;
    randomizeFromSeed=previousSeed;
    try { await randomize.onclick(); }
    finally {
      if (planet.studioSeed === previousSeed) randomizeFromSeed=undefined;
    }
  });
  studio.buttons.resetButton.addEventListener('click', () => studio.resetEditors(studioOptions));
  const apply = async (rebake) => {
    try {
      await studio.flushPresetPreview();
      await terrainEditor?.apply();
      weatherToggle.checked = false;
      await queueSettings(studio.readOptions().clouds, { rebake: rebake || studio.hasPendingCloudTextures() });
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
  return { current: cloudOpacity(clouds), next: blend > 0 ? cloudOpacity(incoming?.layer) : null, blend };
}

function cloudOpacity(layer) {
  const active = layer?.activeLayer ?? layer;
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
  const blendCanvas = document.createElement('canvas');
  blendCanvas.width = canvas.width;
  blendCanvas.height = canvas.height;
  const blendContext = blendCanvas.getContext('2d');
  blendContext.globalCompositeOperation = 'lighter';
  for (const [layer, opacity] of [[clouds, 1 - blend], [incoming?.layer, blend]]) {
    if (!layer?.canvas || layer.canvas.style.display === 'none' || opacity === 0) continue;
    blendContext.globalAlpha = opacity;
    blendContext.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(blendCanvas, 0, 0);
  if (aurora?.canvas && aurora.canvas.style.display !== 'none') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(aurora.canvas, 0, 0, canvas.width, canvas.height);
  }
  canvas.toBlob(blob => blob ? request.resolve(blob) : request.reject(new Error('Screenshot capture failed.')));
}

function disposeCloudStudio(error) {
  if (disposed) return;
  disposed = true;
  firstSceneFrame?.reject(error);
  firstSceneFrame = null;
  disposeWeatherLayer(clouds);
  disposeWeatherLayer(incoming?.layer);
  incoming?.completed.resolve();
  cloudOverlay?.remove();
  disposePlanetCloudLayer(aurora);
  cloudDepth?.dispose();
  auroraDepth?.dispose();
  capture?.reject(error);
}

const previousHead = new Set(document.head.children);
let disposeOrbit, setPlanetSunElevation;
async function openFluidRegion(url, region) {
  if (!disposeOrbit || !planet?.device) {
    location.assign(url);
    return;
  }
  const {device} = planet;
  pushCloudDemoRoute(url);
  try {
    disposeOrbit({keepDevice:true});
    for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
      if (!previousHead.has(node)) node.remove();
    }
    document.body.replaceChildren();
    stageFluidRegion(device, region);
    const {fluidReady} = await import('./fluidClouds.js');
    await fluidReady;
  } catch (error) {
    console.warn('Fluid handoff failed. Opening the saved tile directly.', error);
    device.destroy();
    location.reload();
  }
}

const updateConstellationGaze = createConstellationGaze();

function planetSkyLook(view, phase) {
  const time = performance.now() / 1000;
  const [x, y, z, w] = planetNightRotation(phase);
  const [a, b, c] = view.forward;
  const tx = 2 * (y * c - z * b);
  const ty = 2 * (z * a - x * c);
  const tz = 2 * (x * b - y * a);
  const gaze = updateConstellationGaze([
    a + w * tx + y * tz - z * ty,
    b + w * ty + z * tx - x * tz,
    c + w * tz + x * ty - y * tx,
  ], time);
  const style = cloudConfig?.style;
  const palette = resolveScenePalette(style?.colorPresetId, {
    ...style,
    sunBloom: cloudConfig?.params?.sunBloom,
  });
  return {
    sky: palette.sky,
    sun: palette.sun,
    exposure: palette.exposure * palette.colorLift,
    saturation: palette.saturation,
    contrast: style?.displayContrast ?? 1,
    highlightRolloff: style?.highlightRolloff ?? 0,
    shadowDarkness: style?.styleShadowDarkness ?? 0,
    strength: 1,
    bloom: palette.bloom,
    haze: Math.max(0, Math.min(MAX_SCENE_HAZE, sceneLightingValues(style).haze)),
    direct: palette.direct / .65,
    nightTime: time,
    gaze,
  };
}

await mountPlanetApproach({
  setup,
  initialTerrain,
  oceanWaves: oceanWaves + planetOceanWaves,
  skyLighting: [sceneSkyLighting, sceneNightSky, nightConstellationsWGSL, sceneConstellation, planetAerialPerspective, planetSkyLighting].join('\n'),
  getSkyLook: planetSkyLook,
  onDeviceReady(world) {
    planet = world;
    firstSceneFrame = Promise.withResolvers();
    firstSceneFrame.promise.catch(() => {});
    studio.setStatus('Generating cloud volumes…');
    initialSettings = queueSettings(cloudConfig);
    initialSettings.catch(() => {});
  },
  sampleDepth: true,
  onTerrainReady(editor) {
    terrainEditor = editor;
  },
  onNavigationReady({ orbit, dispose, setSunElevation }) {
    orbitPlanet = orbit;
    setPlanetSunElevation = setSunElevation;
    disposeOrbit = dispose;
    if (!returnRegion) return;
    if (restoredCloudState?.paused) document.getElementById('sceneAnimation')?.click();
    void orbit({direction: returnRegion.direction, altitude: returnRegion.span * .92,
      sunTurn: restoredCloudState?.sunTurn});
  },
  onFrame(world, view, phase, animationState) {
    planet = world;
    camera = view;
    sunPhase = phase;
    animation = animationState;
    regionPicker?.draw(world, view);
    firstSceneFrame?.resolve();
    firstSceneFrame = null;
    if (pendingFrame || disposed || regionPicker?.building) return;
    // Stage the paired shape before the new world seed starts its cloud bake.
    pendingStorybookClouds?.(world.preset);
    const seed = world.studioSeed;
    pendingFrame = true;
    (async () => {
      const seedChanged = seed !== activeSeed;
      const scaleChanged = world.radius !== activeRadius;
      if ((seedChanged || scaleChanged) && !preparing) {
        const first = activeSeed === undefined;
        activeSeed = seed;
        activeRadius = world.radius;
        preparing = true;
        if (!first) finishWeather(false);
        studio.setStatus('Generating cloud volumes…');
        try {
          if (first) await (initialSettings ?? queueSettings(cloudConfig));
          else if (!seedChanged) await queueSettings(cloudConfig, { replaceWorld: true });
          else {
            const randomizeLook=randomizeFromSeed !== undefined && randomizeFromSeed !== seed;
            randomizeFromSeed=undefined;
            await studio.randomizeClouds(seed, config => queueSettings(config, { replaceWorld: true }), {randomizeLook});
          }
          studio.setStatus('Clouds ready.');
        } finally {
          preparing = false;
          initialSettings = null;
          refreshWeatherControls();
        }
      }
      await presentWeather();
      await updatePlanetCloudLayer(aurora);
      scheduleWeather();
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

