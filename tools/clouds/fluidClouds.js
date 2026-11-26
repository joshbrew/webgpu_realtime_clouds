import { cloudDemoUrl, mountCloudDemoNavigation } from './cloudDemoNavigation.js';
import { createRailHead } from './cloudLabUi.js';
import { GRADE_PRESETS, FLUID_TWILIGHT_GRADE, MAX_SCENE_HAZE, MAX_SCENE_SHAFT_STRENGTH, MAX_SCENE_SHADOW_DARKNESS } from './cloudLookPresets.js';
import { cameraBasis, flyCamera } from './cloudNavigation.js';
import { createFluidCloudRenderer, createFluidCloudSimulation, DOMAIN_WIDTH, GRID_SIZE } from './fluidCloudGpu.js';
import { prepareFluidPlanetTerrain } from './fluidPlanetTerrain.js';
import { createFluidRenderResolution } from './fluidRenderResolution.js';
import {takeFluidRegion} from './fluidRegionHandoff.js';
import { planetRegionCoordinates, readPlanetRegion, recentPlanetRegionId } from '../planet/planetRegion.js';
import { upgradePlanetRegionContext } from '../planet/planetRegionContext.js';
import { fluidObstacleShapes, SEA_LEVEL, obstacleRadius, intersectFluidObstacle } from './fluidCloudShapes.js';

const STEP = 1 / 60;
const TARGET = [0, 0.26, 0];
const DEFAULT_DISTANCE = 23.5;
const DEFAULT_WATERLINE_HEIGHT = 2.16;
const {sunAzimuth: SUN_AZIMUTH} = GRADE_PRESETS[FLUID_TWILIGHT_GRADE];
const DEFAULT_SUN_ELEVATION = 5;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));
const radians = Math.PI / 180;
const initialObjects = [
  {x:-3.6, z:0.38, radius:0.71},
  {x:0.51, z:-2.83, radius:0.53},
  {x:3.30, z:2.47, radius:0.81},
];

if (!document.querySelector('meta[name="viewport"]')) {
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1';
  document.head.append(viewport);
}
const nav = mountCloudDemoNavigation();
document.title = 'Fluid Clouds · Clouds Lab';
const stage = document.createElement('main');
stage.className = 'cl-root fluid-stage';
stage.innerHTML = `
  <canvas id="fluid-canvas" tabindex="0" aria-label="Volumetric fluid clouds. Drag an obstacle, or use the arrow keys to move the selected obstacle." aria-describedby="fluid-instructions"></canvas>
  <aside class="cl-rail fluid-rail" aria-label="Fluid cloud controls">
    <fieldset id="fluid-controls" disabled>
      <div class="fluid-row fluid-actions">
        <button class="cl-btn cl-btn--primary" id="fluid-pause" type="button" aria-pressed="false">Pause</button>
        <button class="cl-btn" id="fluid-reset" type="button">Reset flow</button>
      </div>
      <label class="cl-field" for="fluid-map">
        <span class="cl-field__label">Map</span>
        <select class="cl-input" id="fluid-map"><option value="ocean">Ocean and obstacles</option></select>
      </label>
      <p id="fluid-map-info" class="cl-hint" hidden></p>
      <div id="fluid-terrain-fields" hidden>
        <label class="cl-field" for="fluid-cutoff">
          <span class="cl-field__label">Terrain cutoff <output class="cl-value" id="fluid-cutoff-value" for="fluid-cutoff"></output></span>
          <input id="fluid-cutoff" type="range" title="Terrain above this elevation blocks the cloud-layer flow.">
        </label>
        <label class="cl-field" for="fluid-drag">
          <span class="cl-field__label">Terrain drag <output class="cl-value" id="fluid-drag-value">100%</output></span>
          <input id="fluid-drag" type="range" min="0" max="200" step="5" value="100">
        </label>
        <label class="cl-field" for="fluid-heading">
          <span class="cl-field__label">Wind heading <output class="cl-value" id="fluid-heading-value">90°</output></span>
          <input id="fluid-heading" type="range" min="0" max="359" step="1" value="90" title="Direction the wind blows toward. 0° is north.">
        </label>
      </div>
      <div class="cl-tabs fluid-views" role="group" aria-label="View">
        <button id="fluid-orbit" type="button" data-view="orbit" aria-pressed="true">Orbit</button>
        <button id="fluid-flight" type="button" data-view="flight" aria-pressed="false" hidden>Flight</button>
        <button id="fluid-waterline" type="button" data-view="waterline" aria-pressed="false">Waterline</button>
        <button id="fluid-plan" type="button" data-view="plan" aria-pressed="false">Plan</button>
        <button id="fluid-flow" type="button" data-view="flow" aria-pressed="false">Flow</button>
      </div>
      <p id="fluid-flight-help" class="cl-hint" hidden>Drag to look. W/A/S/D to move, Space/C to climb or descend, Shift to boost. Scroll to adjust speed.</p>
      <div class="fluid-legend" id="fluid-legend" hidden>
        <span class="fluid-clockwise">Clockwise curl</span><span class="fluid-counterclockwise">Counterclockwise curl</span>
        <span>Arrow length shows flow speed</span>
        <span id="fluid-terrain-legend" hidden>Brown marks terrain above the cutoff</span>
      </div>
      <label class="cl-field" for="fluid-wind">
        <span class="cl-field__label">Wind <output class="cl-value" id="fluid-wind-value" for="fluid-wind"></output></span>
        <input id="fluid-wind" type="range" min="0" max="2.8" value="1.2" step="0.1">
      </label>
      <label class="cl-field" for="fluid-formation">
        <span class="cl-field__label">Cloud formation</span>
        <select class="cl-input" id="fluid-formation" aria-describedby="fluid-formation-hint">
          <option value="0">Turbulence</option>
          <option value="1">Stable air (inversion)</option>
          <option value="2">Fog blanket</option>
        </select>
      </label>
      <p id="fluid-formation-hint" class="cl-hint" aria-live="polite"></p>
      <label class="cl-field" for="fluid-condensation">
        <span class="cl-field__label">Cloud buildup <output class="cl-value" id="fluid-condensation-value">100%</output></span>
        <input id="fluid-condensation" type="range" min="0" max="200" step="5" value="100" title="How quickly vapor condenses in the selected formation mode.">
      </label>
      <label class="cl-field" for="fluid-thickness">
        <span class="cl-field__label">Cloud thickness <output class="cl-value" id="fluid-thickness-value" for="fluid-thickness"></output></span>
        <input id="fluid-thickness" type="range" min="0.18" max="1.10" value="0.52" step="0.02">
      </label>
      <label class="cl-field" for="fluid-breakup">
        <span class="cl-field__label">Cloud breakup <output class="cl-value" id="fluid-breakup-value">0%</output></span>
        <input id="fluid-breakup" type="range" min="0" max="100" step="5" value="0" title="Adds fine cloud erosion that moves with the wind and wakes.">
      </label>
      <label class="cl-field" id="fluid-camera-height-field" for="fluid-camera-height" hidden>
        <span class="cl-field__label"><span id="fluid-camera-height-label">Height above water</span> <output class="cl-value" id="fluid-camera-height-value" for="fluid-camera-height">${DEFAULT_WATERLINE_HEIGHT.toFixed(2)}</output></span>
        <input id="fluid-camera-height" type="range" min="0.36" max="3.2" value="${DEFAULT_WATERLINE_HEIGHT}" step="0.02">
      </label>
      <div id="fluid-sun-field">
        <label class="cl-field" for="fluid-lighting">
          <span class="cl-field__label">Lighting preset</span>
          <select class="cl-input" id="fluid-lighting">
            <option value="${FLUID_TWILIGHT_GRADE}">Fluid Twilight</option>
            ${Object.entries(GRADE_PRESETS).filter(([id]) => Number(id) !== FLUID_TWILIGHT_GRADE)
              .map(([id, {label}]) => `<option value="${id}">${label}</option>`).join('')}
          </select>
        </label>
        <label class="cl-field" for="fluid-sun">
          <span class="cl-field__label">Sun elevation <output class="cl-value" id="fluid-sun-value" for="fluid-sun">${DEFAULT_SUN_ELEVATION}°</output></span>
          <input id="fluid-sun" type="range" min="0" max="90" value="${DEFAULT_SUN_ELEVATION}" step="1">
        </label>
        <label class="cl-field" for="fluid-sun-azimuth">
          <span class="cl-field__label">Sun azimuth <output class="cl-value" id="fluid-sun-azimuth-value"></output></span>
          <input id="fluid-sun-azimuth" type="range" min="0" max="359" value="${SUN_AZIMUTH}" step="1">
        </label>
        <label class="cl-field" for="fluid-exposure">
          <span class="cl-field__label">Exposure <output class="cl-value" id="fluid-exposure-value"></output></span>
          <input id="fluid-exposure" type="range" min="0" max="3" value="1.16" step=".01">
        </label>
        <label class="cl-field" for="fluid-light-strength">
          <span class="cl-field__label">Direct light <output class="cl-value" id="fluid-light-strength-value"></output></span>
          <input id="fluid-light-strength" type="range" min="0" max="2.2" value=".65" step=".01">
        </label>
        <label class="cl-field" for="fluid-light-shafts">
          <span class="cl-field__label">Light shafts <output class="cl-value" id="fluid-light-shafts-value"></output></span>
          <input id="fluid-light-shafts" type="range" min="0" max="${MAX_SCENE_SHAFT_STRENGTH}" value=".12" step=".01">
        </label>
        <label class="cl-field" for="fluid-haze">
          <span class="cl-field__label">Haze <output class="cl-value" id="fluid-haze-value"></output></span>
          <input id="fluid-haze" type="range" min="0" max="${MAX_SCENE_HAZE}" value="1" step=".05">
        </label>
        <label class="cl-field cl-field--full" for="fluid-shadow-darkness">
          <span class="cl-field__label">Shadow darkness <output class="cl-value" id="fluid-shadow-darkness-value"></output></span>
          <input id="fluid-shadow-darkness" type="range" min="0" max="${MAX_SCENE_SHADOW_DARKNESS}" value="0" step=".01">
        </label>
      </div>
      <label class="cl-field fluid-wake-detail" id="fluid-wake-field" for="fluid-wake">
        <span class="cl-field__label">Wake detail <output class="cl-value" id="fluid-wake-value" for="fluid-wake">90%</output></span>
        <input id="fluid-wake" type="range" min="0" max="100" value="90" step="5">
      </label>
      <div id="fluid-object-fields">
      <div class="fluid-row fluid-objects">
        <label for="fluid-object">Object</label>
        <select class="cl-input" id="fluid-object">
          <option value="0">Orange</option><option value="1">Teal</option><option value="2">Gold</option>
        </select>
        <label class="fluid-auto"><input id="fluid-auto" type="checkbox" checked> Auto motion</label>
      </div>
      <label class="cl-field" for="fluid-shape">
        <span class="cl-field__label">Shape</span>
        <select class="cl-input" id="fluid-shape">
          ${fluidObstacleShapes.map(({id,name}) => `<option value="${id}">${name}</option>`).join('')}
        </select>
      </label>
      <label class="cl-field fluid-angle" id="fluid-angle-field" for="fluid-angle" hidden>
        <span class="cl-field__label">Heading <output class="cl-value" id="fluid-angle-value" for="fluid-angle">0°</output></span>
        <input id="fluid-angle" type="range" min="-180" max="180" value="0" step="1">
      </label>
      <p class="cl-hint" id="fluid-shape-status" role="status" hidden></p>
      </div>
      <p class="cl-hint" id="fluid-instructions">Drag an object or use the arrow keys to move it. Drag open water in Orbit or Waterline to rotate the camera. Scroll to zoom.</p>
    </fieldset>
    <p id="fluid-error" class="cl-hint" hidden></p>
  </aside>`;
document.body.append(stage);
const style = document.createElement('style');
style.textContent = `
  .fluid-stage { position:fixed; inset:0; isolation:isolate; background:#132233; }
  #fluid-canvas { position:absolute; inset:0; width:100%; height:100%; touch-action:none; cursor:grab; }
  #fluid-canvas:active { cursor:grabbing; }
  #fluid-canvas:focus-visible { outline-offset:-3px; }
  .fluid-stage .fluid-rail { bottom:auto; width:344px; max-height:calc(100dvh - 2 * var(--space-4)); }
  .fluid-rail .cl-switch a { padding:0 5px; }
  .fluid-rail fieldset { display:grid; gap:14px; min-width:0; padding:0; border:0; }
  .fluid-rail input[type="range"] { width:100%; margin:0; accent-color:var(--sky); }
  .fluid-row { display:grid; align-items:center; gap:6px; }
  .fluid-actions { grid-template-columns:1fr 1fr; }
  .fluid-rail .fluid-views { grid-template-columns:repeat(auto-fit,minmax(0,1fr)) !important; }
  .fluid-views [hidden], #fluid-flight-help[hidden] { display:none !important; }
  .fluid-rail .fluid-views > button { padding-inline:0 !important; }
  .fluid-views button[aria-pressed="true"] { color:var(--sky) !important; background:var(--sky-soft) !important; box-shadow:inset 0 0 0 1px var(--sky) !important; }
  .fluid-legend:not([hidden]) { display:grid; grid-template-columns:repeat(2, auto); gap:5px 8px; color:var(--ink-muted); font-size:11px; line-height:15px; }
  .fluid-legend span:first-child::before, .fluid-legend span:nth-child(2)::before { content:''; display:inline-block; width:8px; height:8px; margin-right:5px; border-radius:50%; }
  .fluid-clockwise::before { background:#26a6ed; }
  .fluid-counterclockwise::before { background:#ff783d; }
  .fluid-legend span:nth-child(n+3) { grid-column:1 / -1; }
  #fluid-terrain-fields:not([hidden]), #fluid-object-fields:not([hidden]) { display:grid; gap:14px; }
  #fluid-map-info { margin:0; }
  #fluid-map-info a { color:var(--sky); }
  .fluid-row .cl-btn { min-width:0; padding-inline:6px; }
  .fluid-row.fluid-objects { grid-template-columns:auto 1fr auto; gap:8px; }
  .fluid-auto { white-space:nowrap; display:flex; gap:4px; align-items:center; }
  .fluid-rail label[hidden] { display:none !important; }
  #fluid-error { color:var(--storm); overflow-wrap:anywhere; }
  @media (max-width:719px) {
    .fluid-stage { display:grid; grid-template-rows:minmax(0, 1fr) auto; }
    #fluid-canvas { position:relative; min-height:0; }
    .fluid-stage .fluid-rail { position:relative; inset:auto; width:100%; max-height:49vh; }
    body.cl-clean-view .fluid-stage .fluid-rail { display:none; }
  }
`;
document.head.append(style);

const get = id => stage.querySelector('#fluid-' + id);
const canvas = get('canvas');
const rail = stage.querySelector('.fluid-rail');
const status = document.createElement('span');
status.id = 'fluid-status';
rail.prepend(createRailHead({
  title:'Fluid clouds', statusEl:status, switcher:nav,
  onToggle:() => rail.classList.toggle('is-collapsed'),
}));
const controls = get('controls');
const visibly = (text, state) => {
  status.textContent = text;
  status.dataset.state = state;
};
visibly('Starting WebGPU', 'busy');
get('wind-value').textContent = '1.2';
get('thickness-value').textContent = '0.52';

function autoOffset(time, index) {
  const angle = time * [0.57, 0.66, 0.49][index] + index * 2.08;
  return [Math.sin(angle) * 1.62, Math.cos(angle * 0.82) * 0.94];
}

function captureOrbit(object, time, index) {
  const offset = autoOffset(time, index);
  object.anchorX = object.x - offset[0];
  object.anchorZ = object.z - offset[1];
  object.manual = false;
}

function newObjects() {
  return initialObjects.map((source, i) => {
    const object = {...source, targetX:source.x, targetZ:source.z, vx:0, vz:0,
      kind:0, angle:0, targetAngle:0, angularSpeed:0};
    captureOrbit(object, 0, i);
    return object;
  });
}

function objectMargin(object) {
  return DOMAIN_WIDTH * 0.5 - obstacleRadius(object) - 0.32;
}

function positionClear(objects, object, x, z, radius = obstacleRadius(object)) {
  return !objects.some(other => other !== object
    && Math.hypot(x-other.x, z-other.z) < radius + obstacleRadius(other) + 0.12);
}

function advanceObjects(objects, dt, time, auto) {
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const offset = autoOffset(time, i);
    if (auto && !object.manual) {
      object.targetX = object.anchorX + offset[0];
      object.targetZ = object.anchorZ + offset[1];
    }
    const margin = objectMargin(object);
    const dx = clamp(object.targetX, -margin, margin) - object.x;
    const dz = clamp(object.targetZ, -margin, margin) - object.z;
    const speed = Math.min(6.0, Math.hypot(dx, dz) * 11);
    const length = Math.hypot(dx, dz);
    const fraction = Math.min(1, dt * speed / Math.max(length, 0.000001));
    const x = object.x + dx * fraction;
    const z = object.z + dz * fraction;
    const free = positionClear(objects, object, x, z);
    object.vx = free ? (x-object.x) / dt : 0;
    object.vz = free ? (z-object.z) / dt : 0;
    if (free) Object.assign(object, {x,z});
    const rotation = object.targetAngle - object.angle;
    const shortest = Math.atan2(Math.sin(rotation), Math.cos(rotation));
    const turn = object.kind === 0 ? 0 : clamp(shortest, -dt * 3.2, dt * 3.2);
    object.angle = Math.atan2(Math.sin(object.angle + turn), Math.cos(object.angle + turn));
    object.angularSpeed = turn / dt;
  }
}

function cameraView(camera, aspect, mode, aim = TARGET, surface = SEA_LEVEL) {
  const waterline = mode === 'waterline';
  const plan = mode === 'plan' || mode === 'flow';
  const pitchDeg = plan ? -90 : camera.pitchDeg;
  const {forward,right,up} = cameraBasis({yawDeg:camera.yawDeg, pitchDeg});
  const screenFit = Math.max(0.53, Math.min(1, aspect));
  const distance = camera.distance / screenFit;
  const halfFovTan = Math.tan((waterline ? 34 : 44) * radians / 2);
  if (waterline) {
    const {forward:horizontal} = cameraBasis({yawDeg:camera.yawDeg, pitchDeg:0});
    return {position:[-horizontal[0] * distance, surface + camera.height, -horizontal[2] * distance],
      forward, right, up, halfFovTan, orthoHalfHeight:0};
  }
  const mapRadius = DOMAIN_WIDTH * 0.5 * (Math.abs(right[0]) + Math.abs(right[2]));
  const orthoHalfHeight = plan ? (mapRadius + 0.78) * distance / DEFAULT_DISTANCE : 0;
  return {position:aim.map((value, i) => value - forward[i] * distance),
    forward, right, up, halfFovTan, orthoHalfHeight};
}

function pointerRay(canvas, view, event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) * 2 / rect.width - 1) * rect.width / rect.height;
  const y = 1 - (event.clientY - rect.top) * 2 / rect.height;
  const offset = view.right.map((value, i) => value*x + view.up[i]*y);
  const origin = view.position.map((value,i) => value + view.orthoHalfHeight*offset[i]);
  const direction = view.forward.map((value,i) => value + (view.orthoHalfHeight ? 0 : view.halfFovTan)*offset[i]);
  return {origin, direction};
}

function pointAtHeight({origin, direction}, height) {
  if (direction[1] >= -0.0001) return null;
  const distance = (height - origin[1]) / direction[1];
  return [origin[0] + direction[0]*distance, origin[2] + direction[2]*distance];
}

function pickObject(ray, objects) {
  let closest = Infinity;
  let selected = -1;
  for (let i = 0; i < objects.length; i++) {
    const distance = intersectFluidObstacle(ray, objects[i], i, 0.12);
    if (distance < closest) {
      closest = distance;
      selected = i;
    }
  }
  return {selected, distance:closest};
}

let device, context, frame = 0, failed = false, disposed = false;
function fail(error) {
  if (failed || disposed) return;
  failed = true;
  cancelAnimationFrame(frame);
  controls.disabled = true;
  visibly('Unavailable', 'error');
  const errorEl = get('error');
  errorEl.textContent = error.message || String(error);
  errorEl.hidden = false;
}

async function start() {
  if (!navigator.gpu) throw new Error('WebGPU is required for the Fluid Clouds experiment.');
  const handoff = takeFluidRegion();
  device = handoff?.device;
  if (!device) {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('This browser did not provide a WebGPU adapter.');
    device = await adapter.requestDevice();
  }
  device.lost.then(info => fail(new Error(info.message || 'The WebGPU device was lost. Reload to start a new session.')));
  device.addEventListener('uncapturederror', event => fail(event.error));
  context = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({device,format,alphaMode:'opaque'});
  const params = new URL(location.href).searchParams;
  const linkedId = params.get('region');
  const regionId = linkedId ?? recentPlanetRegionId();
  async function loadTerrain(saved) {
    const region = await upgradePlanetRegionContext(device, saved, regionId);
    return {region, terrain:prepareFluidPlanetTerrain(region, DOMAIN_WIDTH, GRID_SIZE)};
  }
  let region, terrain;
  if (regionId) {
    try {
      region = handoff?.region ?? await readPlanetRegion(regionId);
    } catch (error) {
      console.warn('Fluid planet map unavailable', error);
      region = undefined;
    }
  }
  const initialRegion = linkedId && region ? loadTerrain(region).catch(error => {
    console.warn('Fluid planet map unavailable', error);
  }) : null;
  if (initialRegion) visibly('Preparing saved map…', 'busy');
  const simulationReady = createFluidCloudSimulation(device);
  const rendererReady = createFluidCloudRenderer(device, context, format, simulationReady,
    initialRegion?.then(result => result?.terrain));
  const [loaded, simulation, {draw, prepareView, setTerrain:setRenderTerrain}] =
    await Promise.all([initialRegion, simulationReady, rendererReady]);
  if (failed || disposed) return;
  if (initialRegion) {
    region = loaded?.region;
    terrain = loaded?.terrain;
    simulation.setTerrain(terrain);
  }

  const map = get('map');
  const mapInfo = get('map-info');
  const cutoff = get('cutoff');
  const heading = get('heading');
  const drag = get('drag');
  const condensation = get('condensation');
  const formation = get('formation');
  const breakup = get('breakup');
  function syncCutoffLimits() {
    cutoff.min = String(Math.floor(terrain.minCutoff));
    cutoff.max = String(Math.ceil(terrain.maxCutoff));
    cutoff.step = String(Math.max(1, Math.round((terrain.maxCutoff - terrain.minCutoff) / 240)));
    cutoff.value = String(terrain.cutoff);
  }
  function showMapLink(unavailable) {
    const link = document.createElement('a');
    const planetUrl = new URL(cloudDemoUrl('planet'));
    planetUrl.searchParams.delete('region');
    link.href = planetUrl.href;
    link.textContent = 'Build a local map in Planet';
    mapInfo.replaceChildren();
    if (unavailable) mapInfo.append('This saved map is unavailable. ');
    mapInfo.append(link);
  }
  if (region) {
    const [lat, lon] = planetRegionCoordinates(region.direction);
    map.add(new Option('Planet region · ' + (region.span / 1000).toFixed(1) + ' km', 'terrain'));
    if (terrain) {
      map.value = 'terrain';
      syncCutoffLimits();
    }
    mapInfo.textContent = lat.toFixed(2) + '°, ' + lon.toFixed(2) + '°';
  } else {
    showMapLink(Boolean(linkedId));
  }
  let activeMap = map.value;
  const terrainActive = () => activeMap === 'terrain';
  const cloudSettings = () => ({
    formation: Number(formation.value), condensation: Number(condensation.value) / 100,
    breakup: Number(breakup.value) / 100,
    ...(terrainActive() ? {
      active: true, cutoff: terrain.normalizedCutoff(Number(cutoff.value)),
      drag: Number(drag.value) / 100, heading: Number(heading.value),
      layer: terrain.layerHeight(Number(cutoff.value)),
    } : {}),
  });
  let objects = newObjects();
  const orbit = {yawDeg:208, pitchDeg:-38, distance:DEFAULT_DISTANCE};
  const waterline = {yawDeg:228, pitchDeg:-1.8, distance:12.8, height:DEFAULT_WATERLINE_HEIGHT};
  let flight;
  let flightSpeed = 1;
  const flightKeys = new Set();
  let mode = 'orbit', paused = false, dirty = true, inFlight = false, geometryDirty = false;
  let renderView = prepareView(terrainActive(), false);
  let time = 0, windTravel = [0, 0], lastFrame = 0, accumulator = 0, gesture = null;
  const renderResolution = createFluidRenderResolution();
  let viewportWidth = 0, viewportHeight = 0, viewportRatio = 0;
  let renderedInspection = false;
  const camera = () => mode === 'flight' ? flight : mode === 'waterline' ? waterline : orbit;
  const wind = get('wind');
  const sun = get('sun');
  const sunAzimuth = get('sun-azimuth');
  const lighting = get('lighting');
  const exposure = get('exposure');
  const lightStrength = get('light-strength');
  const lightShafts = get('light-shafts');
  const haze = get('haze');
  const shadowDarkness = get('shadow-darkness');
  let sunDirection;
  function syncLighting() {
    sunDirection = cameraBasis({yawDeg:Number(sunAzimuth.value), pitchDeg:Number(sun.value)}).forward;
    get('sun-value').textContent = sun.value + '°';
    get('sun-azimuth-value').textContent = sunAzimuth.value + '°';
    get('exposure-value').textContent = Number(exposure.value).toFixed(2);
    get('haze-value').textContent = Number(haze.value).toFixed(2);
    get('shadow-darkness-value').textContent = Number(shadowDarkness.value).toFixed(2);
    get('light-strength-value').textContent = Number(lightStrength.value).toFixed(2);
    get('light-shafts-value').textContent = Number(lightShafts.value).toFixed(2);
    dirty = true;
  }
  const thickness = get('thickness');
  const wake = get('wake');
  const selection = get('object');
  const shape = get('shape');
  const angle = get('angle');
  const shapeStatus = get('shape-status');
  const auto = get('auto');
  const pauseButton = get('pause');
  const viewButtons = [...stage.querySelectorAll('.fluid-views button')];

  function syncObjectControls() {
    const object = objects[Number(selection.value)];
    shape.value = String(object.kind);
    angle.value = String(Math.round(object.targetAngle / radians));
    get('angle-value').textContent = angle.value + '°';
    get('angle-field').hidden = object.kind === 0;
    shapeStatus.hidden = true;
  }

  function reset() {
    const geometry = objects.map(({kind,targetAngle}) => ({kind, angle:targetAngle, targetAngle}));
    objects = newObjects();
    for (let i = 0; i < objects.length; i++) Object.assign(objects[i], geometry[i]);
    time = 0;
    windTravel = [0, 0];
    geometryDirty = false;
    accumulator = 0;
    const config = cloudSettings();
    simulation.reset(Number(wind.value), objects, config);
    simulation.step(STEP, time, Number(wind.value), objects, config);
    dirty = true;
  }
  function syncFormation() {
    const mode = Number(formation.value);
    condensation.disabled = !terrainActive() && mode === 0;
    get('formation-hint').textContent = [
      terrainActive() ? 'Clouds gather in rising or turbulent air over terrain.' : 'Clouds stream around the obstacles.',
      'Clouds build in calm air and thin in turbulent wakes.',
      'Moist air feeds a low layer across the map. Wakes thin and stir the fog.',
    ][mode];
    dirty = true;
  }

  function syncMapControls() {
    syncFormation();
    const active = terrainActive();
    get('terrain-fields').hidden = !active;
    get('flight').hidden = !active;
    if (!active && mode === 'flight') setView('orbit');
    get('object-fields').hidden = active;
    mapInfo.hidden = Boolean(region) && !active;
    get('terrain-legend').hidden = !active;
    get('waterline').textContent = active ? 'Low view' : 'Waterline';
    get('camera-height-label').textContent = active ? 'Height above cloud layer' : 'Height above water';
    get('instructions').textContent = active
      ? 'Use Flow to see wind and curl. Terrain above the cutoff blocks flow.'
      : 'Drag an object or use the arrow keys to move it. Drag open water in Orbit or Waterline to rotate the camera. Scroll to zoom.';
    canvas.setAttribute('aria-label', active ? 'Volumetric clouds flowing across the saved Planet terrain.' :
      'Volumetric fluid clouds. Drag an obstacle, or use the arrow keys to move the selected obstacle.');
    if (active) get('cutoff-value').textContent = Math.round(Number(cutoff.value)).toLocaleString() + ' m';
    sun.value = String(active && Number.isFinite(region.sun?.elDeg)
      ? Math.round(clamp(region.sun.elDeg, DEFAULT_SUN_ELEVATION, 90)) : DEFAULT_SUN_ELEVATION);
    const azimuth = active ? region.sun?.azDeg : undefined;
    sunAzimuth.value = String(Number.isFinite(azimuth) ? (Math.round(azimuth) % 360 + 360) % 360 : SUN_AZIMUTH);
    syncLighting();
  }
  function syncRenderStatus() {
    if (map.value === 'terrain' && !terrain) {
      visibly('Preparing saved map…', 'busy');
    } else if (!renderView.pipeline) {
      visibly(`Preparing ${renderView.key}…`, 'busy');
    } else {
      visibly(paused ? 'Paused' : `${GRID_SIZE}² · Live`, paused ? '' : 'live');
    }
  }
  function selectRenderView() {
    const next = prepareView(terrainActive(), mode === 'flow');
    if (next === renderView) return;
    renderView = next;
    syncRenderStatus();
    if (next.pipeline) return;
    next.ready.then(() => {
      if (disposed || failed || renderView !== next) return;
      dirty = true;
      syncRenderStatus();
    }, error => {
      if (renderView === next) fail(error);
    });
  }
  let terrainLoad;
  function changeMap() {
    if (map.value === 'terrain' && !terrain) {
      syncRenderStatus();
      // Continue showing Ocean while the saved surroundings are prepared.
      // Apply the result only if the saved map is still selected.
      terrainLoad ??= loadTerrain(region).then(result => {
        if (disposed || failed) return;
        ({region, terrain} = result);
        simulation.setTerrain(terrain);
        setRenderTerrain(terrain);
        syncCutoffLimits();
        changeMap();
      }).catch(error => {
        if (disposed || failed) return;
        console.warn('Fluid planet map unavailable', error);
        region = undefined;
        map.querySelector('option[value="terrain"]').remove();
        map.value = 'ocean';
        showMapLink(true);
        syncMapControls();
        syncRenderStatus();
      });
      return;
    }
    if (map.value === activeMap) {
      syncRenderStatus();
      return;
    }
    activeMap = map.value;
    syncMapControls();
    selectRenderView();
    syncRenderStatus();
    reset();
  }
  map.addEventListener('change', changeMap);
  formation.addEventListener('change', syncFormation);
  breakup.addEventListener('input', () => {
    get('breakup-value').textContent = breakup.value + '%';
    dirty = true;
  });
  for (const [control, suffix] of [[cutoff, ' m'], [drag, '%'], [condensation, '%'], [heading, '°']]) {
    control.addEventListener('input', () => {
      get(control.id.slice(6)+'-value').textContent = Math.round(Number(control.value)).toLocaleString() + suffix;
      if (control === cutoff) geometryDirty = true;
      dirty = true;
    });
  }
  syncMapControls();
  reset();
  if (terrainActive() && params.get('view') === 'flight') setView('flight');
  syncObjectControls();
  controls.disabled = false;
  visibly(`${GRID_SIZE}² · Live`, 'live');

  for (const input of [wind,thickness]) {
    input.addEventListener('input', () => {
      get(input.id.slice(6)+'-value').textContent = Number(input.value).toFixed(input === wind ? 1 : 2);
      dirty = true;
    });
  }
  const cameraHeight = get('camera-height');
  cameraHeight.addEventListener('input', () => {
    waterline.height = Number(cameraHeight.value);
    get('camera-height-value').textContent = waterline.height.toFixed(2);
    dirty = true;
  });
  for (const slider of [sun, sunAzimuth, exposure, haze, lightStrength, lightShafts, shadowDarkness]) slider.addEventListener('input', syncLighting);
  lighting.addEventListener('change', () => {
    const id = Number(lighting.value);
    const preset = GRADE_PRESETS[id];
    if (preset.sunAzimuth !== undefined) sunAzimuth.value = String(preset.sunAzimuth);
    if (preset.sunElevation !== undefined) sun.value = String(Math.max(0, preset.sunElevation));
    exposure.value = String(preset.exposure ?? 1.16);
    lightStrength.value = String(id === FLUID_TWILIGHT_GRADE ? .65 : preset.directLightBoost ?? .65);
    lightShafts.value = String(id === FLUID_TWILIGHT_GRADE ? .12 : preset.godRaysEnabled ? preset.godRayStrength ?? .12 : 0);
    haze.value = String(id === FLUID_TWILIGHT_GRADE ? 1 : (preset.fogDensity ?? .22) / .22);
    shadowDarkness.value = String(id === FLUID_TWILIGHT_GRADE ? 0 : preset.styleShadowDarkness ?? 0);
    syncLighting();
  });
  wake.addEventListener('input', () => {
    get('wake-value').textContent = wake.value + '%';
    dirty = true;
  });
  selection.addEventListener('change', () => {
    syncObjectControls();
    dirty = true;
  });
  shape.addEventListener('change', () => {
    const object = objects[Number(selection.value)];
    const kind = Number(shape.value);
    const candidate = {...object,kind};
    const margin = objectMargin(candidate);
    if (Math.max(Math.abs(object.x), Math.abs(object.z)) > margin
      || !positionClear(objects, object, object.x, object.z, obstacleRadius(candidate))) {
      shape.value = String(object.kind);
      shapeStatus.textContent = 'Move the object into open space to fit that shape.';
      shapeStatus.hidden = false;
      return;
    }
    object.kind = kind;
    object.angularSpeed = 0;
    syncObjectControls();
    geometryDirty = dirty = true;
  });
  angle.addEventListener('input', () => {
    const object = objects[Number(selection.value)];
    object.targetAngle = Number(angle.value) * radians;
    get('angle-value').textContent = angle.value + '°';
    geometryDirty = dirty = true;
  });
  get('reset').addEventListener('click', reset);
  auto.addEventListener('change', () => {
    if (auto.checked) objects.forEach((object,i) => captureOrbit(object,time,i));
  });
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    pauseButton.textContent = paused ? 'Resume' : 'Pause';
    pauseButton.setAttribute('aria-pressed', String(paused));
    syncRenderStatus();
  });
  function setView(next) {
    if (next === 'flight' && !terrainActive()) return;
    if (next === 'flight' && !flight) {
      const config = cloudSettings();
      const {forward} = cameraBasis({yawDeg:orbit.yawDeg, pitchDeg:0});
      const x = -forward[0] * 5.5, z = -forward[2] * 5.5;
      const y = Math.max(config.layer + 1.35, terrain.surfaceHeightAt(x, z) + 1.10);
      flight = {x,y,z,yawDeg:orbit.yawDeg,pitchDeg:-15};
    }
    mode = next;
    selectRenderView();
    flightKeys.clear();
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === mode));
    get('legend').hidden = mode !== 'flow';
    get('wake-field').hidden = mode === 'flow';
    get('sun-field').hidden = mode === 'flow';
    get('camera-height-field').hidden = mode !== 'waterline';
    get('flight-help').hidden = mode !== 'flight';
    if (mode === 'flight') canvas.focus({preventScroll:true});
    dirty = true;
  }
  for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.view));

  function viewFor(aspect, config = cloudSettings()) {
    if (mode === 'flight') {
      return {...cameraBasis(flight), position:[flight.x,flight.y,flight.z],
        halfFovTan:Math.tan(27 * radians), orthoHalfHeight:0};
    }
    if (!config.active) return cameraView(camera(), aspect, mode);
    const aim = [0, (config.layer - SEA_LEVEL) * .45 + SEA_LEVEL, 0];
    return cameraView(camera(), aspect, mode, aim, config.layer);
  }
  const currentView = () => viewFor(canvas.clientWidth/canvas.clientHeight);
  const rayAt = event => pointerRay(canvas, currentView(), event);
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || gesture) return;
    const view = currentView();
    const ray = pointerRay(canvas, view, event);
    const at = pointAtHeight(ray, TARGET[1]);
    const hit = terrainActive() || event.shiftKey ? {selected:-1} : pickObject(ray, objects);
    const selected = at || mode === 'waterline' ? hit.selected : -1;
    if ((mode === 'plan' || mode === 'flow') && selected < 0) return;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({preventScroll:true});
    gesture = {id:event.pointerId, selected, x:event.clientX, y:event.clientY};
    if (selected >= 0) {
      const object = objects[selected];
      object.manual = true;
      object.targetX = object.x;
      object.targetZ = object.z;
      selection.value = String(selected);
      syncObjectControls();
      if (mode === 'waterline') {
        // Move across or along the view at the picked depth. A horizontal
        // ray near the horizon has no stable intersection with the CFD plane.
        const {forward,right} = cameraBasis({yawDeg:waterline.yawDeg, pitchDeg:0});
        const scale = 2 * hit.distance * view.halfFovTan / canvas.clientHeight;
        gesture.groundDrag = {x:object.x, z:object.z, forward, right, scale};
      } else {
        gesture.offset = [object.x-at[0],object.z-at[1]];
      }
    }
    dirty = true;
  });
  canvas.addEventListener('pointermove', event => {
    if (gesture?.id !== event.pointerId) return;
    if (gesture.selected >= 0) {
      const object = objects[gesture.selected];
      if (gesture.groundDrag) {
        const {x,z,forward,right,scale} = gesture.groundDrag;
        const across = (event.clientX - gesture.x) * scale;
        const along = (gesture.y - event.clientY) * scale * 2.4;
        object.targetX = x + right[0] * across + forward[0] * along;
        object.targetZ = z + right[2] * across + forward[2] * along;
      } else {
        const at = pointAtHeight(rayAt(event), TARGET[1]);
        if (at) {
          object.targetX = at[0] + gesture.offset[0];
          object.targetZ = at[1] + gesture.offset[1];
        }
      }
    } else {
      const active = camera();
      active.yawDeg -= (event.clientX - gesture.x) * 0.32;
      active.pitchDeg = mode === 'waterline'
        ? clamp(active.pitchDeg + (event.clientY - gesture.y) * 0.15, -12, 9)
        : clamp(active.pitchDeg + (event.clientY - gesture.y) * .24, mode === 'flight' ? -85 : -83, mode === 'flight' ? 85 : -8);
      gesture.x = event.clientX;
      gesture.y = event.clientY;
    }
    dirty = true;
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(event, input => { if (input.pointerId === gesture?.id) gesture = null; });
  }
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const factor = Math.exp(clamp(event.deltaY, -240, 240) * .0014);
    if (mode === 'flight') flightSpeed = clamp(flightSpeed / factor, .07, 8);
    else {
      const active = camera();
      active.distance = clamp(active.distance * factor, mode === 'waterline' ? 10 : 9, 40);
    }
    dirty = true;
  }, {passive:false});
  const movement = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'Space','KeyC','KeyQ','KeyE','ShiftLeft','ShiftRight']);
  canvas.addEventListener('blur', () => flightKeys.clear());
  canvas.addEventListener('keyup', event => flightKeys.delete(event.code));
  canvas.addEventListener('keydown', event => {
    if (mode === 'flight' && movement.has(event.code)) {
      event.preventDefault();
      flightKeys.add(event.code);
      return;
    }
    if (terrainActive()) return;
    const step = {ArrowUp:[0,0.58],ArrowDown:[0,-0.58],ArrowRight:[0.58,0],ArrowLeft:[-0.58,0]}[event.key];
    if (!step) return;
    event.preventDefault();
    const object = objects[Number(selection.value)];
    if (!object.manual) {
      object.targetX = object.x;
      object.targetZ = object.z;
      object.manual = true;
    }
    const {right,forward} = cameraBasis({yawDeg:camera().yawDeg,pitchDeg:0});
    object.targetX += right[0]*step[0] + forward[0]*step[1];
    object.targetZ += right[2]*step[0] + forward[2]*step[1];
    const margin = objectMargin(object);
    object.targetX = clamp(object.targetX, -margin, margin);
    object.targetZ = clamp(object.targetZ, -margin, margin);
  });

  function advanceFlight(elapsed) {
    const held = (...codes) => Number(codes.some(code => flightKeys.has(code)));
    const axes = {
      forward:held('KeyW','ArrowUp') - held('KeyS','ArrowDown'),
      right:held('KeyD','ArrowRight') - held('KeyA','ArrowLeft'),
      up:held('Space','KeyE') - held('KeyC','KeyQ'),
    };
    if (!axes.forward && !axes.right && !axes.up) return;
    const clearance = flight.y - terrain.surfaceHeightAt(flight.x, flight.z);
    const speed = clamp(clearance * .75, .035, 2.8) * flightSpeed * (held('ShiftLeft','ShiftRight') ? 3.5 : 1);
    const next = flyCamera(flight, axes, speed, elapsed);
    next.y = Math.max(next.y, terrain.surfaceHeightAt(next.x,next.z) + .008);
    flight = next;
    dirty = true;
  }

  function animate(now) {
    if (disposed || failed) return;
    frame = requestAnimationFrame(animate);
    const elapsed = lastFrame ? Math.min(0.05, (now - lastFrame) * 0.001) : 0;
    lastFrame = now;
    // Keep the last frame on screen and avoid catch-up steps during compilation.
    if (!renderView.pipeline) return;
    accumulator = paused ? 0 : Math.min(accumulator + elapsed, STEP * 3);
    if (mode === 'flight' && flightKeys.size) advanceFlight(elapsed);
    if (inFlight) return;

    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (width < 1 || height < 1) return;
    const nativeRatio = Math.min(devicePixelRatio, device.limits.maxTextureDimension2D / Math.max(width, height));
    const nativePixels = width * height * nativeRatio ** 2;
    const viewportChanged = width !== viewportWidth || height !== viewportHeight || nativeRatio !== viewportRatio;
    viewportWidth = width;
    viewportHeight = height;
    viewportRatio = nativeRatio;
    const inspecting = paused && mode !== 'flow' && !document.hidden;
    const editing = dirty || viewportChanged || gesture !== null || flightKeys.size > 0;
    const {pixelBudget, inspection} = renderResolution.frameQuality(now, inspecting, editing);
    // A native-size live frame still needs a redraw for finer sampling.
    if (inspection !== renderedInspection) dirty = true;
    const pixelRatio = Math.min(nativeRatio, Math.sqrt(pixelBudget / (width * height)));
    const renderWidth = Math.max(1, Math.round(width * pixelRatio));
    const renderHeight = Math.max(1, Math.round(height * pixelRatio));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      dirty = true;
    }
    const config = cloudSettings();
    const measuring = !paused && mode !== 'flow' && !document.hidden;
    const frameStarted = measuring ? performance.now() : 0;
    if (geometryDirty && paused) {
      for (const object of objects) Object.assign(object, {
        angle:object.targetAngle, vx:0, vz:0, angularSpeed:0,
      });
      simulation.step(0, time, Number(wind.value), objects, config);
      geometryDirty = false;
    }
    if (geometryDirty && accumulator < STEP) return;
    while (accumulator >= STEP) {
      time += STEP;
      const windSpeed = Number(wind.value);
      const direction = (config.heading ?? 90) * radians;
      windTravel[0] += STEP * windSpeed * Math.sin(direction);
      windTravel[1] -= STEP * windSpeed * Math.cos(direction);
      if (!config.active) advanceObjects(objects, STEP, time, auto.checked);
      simulation.step(STEP, time, windSpeed, objects, config);
      geometryDirty = false;
      accumulator -= STEP;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    const renderedView = renderView;
    draw(renderedView, renderWidth, renderHeight, time, Number(thickness.value),
      viewFor(renderWidth/renderHeight, config), objects, Number(selection.value),
      simulation.index, Number(wake.value) / 100, windTravel, sunDirection, config,
      {grade:Number(lighting.value), exposure:Number(exposure.value), haze:Number(haze.value),
        direct:Number(lightStrength.value), shafts:Number(lightShafts.value),
        shadowDarkness:Number(shadowDarkness.value), inspection});
    renderedInspection = inspection;
    inFlight = true;
    device.queue.onSubmittedWorkDone().then(() => {
      inFlight = false;
      if (measuring && renderedView === renderView && !paused && !document.hidden) {
        renderResolution.recordFrame(performance.now() - frameStarted, nativePixels);
      }
    }, fail);
  }
  frame = requestAnimationFrame(animate);
}

window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  cancelAnimationFrame(frame);
  context?.unconfigure();
  device?.destroy();
});
export const fluidReady = start();
fluidReady.catch(fail);
