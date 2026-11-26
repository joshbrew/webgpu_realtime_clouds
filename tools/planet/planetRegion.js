const radians = Math.PI / 180;
export const LOCAL_REGION_RESOLUTION = 1025;
export const LOCAL_REGION_UNITS = 256;
export const REGION_WEATHER_SCALE = 2;
export const REGION_CONTEXT_SCALE = 6;
export const REGION_CONTEXT_RESOLUTION = REGION_CONTEXT_SCALE * 96 + 1;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = v => {
  const length = Math.hypot(...v);
  if (!Number.isFinite(length) || length < 1e-9) throw new RangeError('Invalid planet direction.');
  return v.map(value => value / length);
};

export function planetRegionFrame(direction) {
  const up = unit(direction);
  const east = unit(Math.hypot(up[0], up[2]) > 1e-8 ? [-up[2], 0, up[0]] : [0, 0, 1]);
  return {up, east, south: cross(up, east)};
}

// Store an integer origin and a small metric remainder. Feeding the full
// planetary coordinate to f32 would lose the smallest gravel wavelengths.
export function writePlanetRegionRockAnchor(buffer, offset, up, radius) {
  const cells = new Int32Array(buffer, offset, 4);
  const remainder = new Float32Array(buffer, offset + 16, 4);
  for (let axis = 0; axis < 3; axis++) {
    const origin = up[axis] * radius;
    cells[axis] = Math.floor(origin / 128);
    remainder[axis] = origin - cells[axis] * 128;
  }
}

export function planetRegionDirection(frame, x, z, radius) {
  const {up, east, south} = frame;
  return unit(up.map((value, i) => value + (east[i] * x + south[i] * z) / radius));
}

export function planetRegionCoordinates(direction) {
  return [Math.asin(direction[1]) / radians, Math.atan2(direction[2], direction[0]) / radians];
}

export function planetRegionSun(frame, direction) {
  return {
    azDeg: (Math.atan2(dot(direction, frame.east), dot(direction, frame.south)) / radians + 360) % 360,
    elDeg: Math.asin(Math.max(-1, Math.min(1, dot(direction, frame.up)))) / radians,
  };
}

export function pickPlanetRegion(camera, ndcX, ndcY, radius, heightAt) {
  const ray = unit(camera.forward.map((value, i) =>
    value + ndcX * camera.tanX * camera.right[i] + ndcY * camera.tanY * camera.up[i]));
  const along = -dot(camera.position, ray);
  const miss = Math.max(0, dot(camera.position, camera.position) - along * along);
  if (along <= 0) return null;
  function surfaceAtDistance(distance) {
    const at = camera.position.map((value, i) => value + ray[i] * distance);
    const length = Math.hypot(...at);
    // At the center the radial direction is immaterial to the sign.
    const direction = length > 1e-9 ? at.map(value => value / length) : unit(camera.position);
    const surfaceRadius = radius + heightAt(direction);
    return {direction, surfaceRadius, offset: length - surfaceRadius};
  }
  let surfaceRadius = radius;
  for (let i = 0; i < 6; i++) {
    const discriminant = surfaceRadius * surfaceRadius - miss;
    const near = along - Math.sqrt(Math.max(0, discriminant));
    if (near <= 0 || (discriminant < 0 && i > 0)) break;
    const hit = surfaceAtDistance(near);
    if (Math.abs(hit.offset) < Math.min(0.25, radius * 1e-9)) return hit.direction;
    surfaceRadius = hit.surfaceRadius;
  }
  // A camera below the reference radius can still be above a valley or
  // the ocean. Bracket the real surface when the reference sphere misses.
  let near = 0, far = along;
  if (surfaceAtDistance(near).offset < 0 || surfaceAtDistance(far).offset > 0) return null;
  for (let i = 0; i < 23; i++) {
    const distance = (near + far) / 2;
    if (surfaceAtDistance(distance).offset > 0) near = distance;
    else far = distance;
  }
  return surfaceAtDistance((near + far) / 2).direction;
}

// Trace the same tangent-plane boundary sampled by the terrain bake.
export function planetRegionOutline(frame, span, radius, heightAt) {
  const half = span / 2;
  const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
  const edgeSamples = 8;
  return corners.flatMap(([x, z], edge) => {
    const [nextX, nextZ] = corners[(edge + 1) % corners.length];
    return Array.from({length: edgeSamples}, (_, i) => {
      const t = i / edgeSamples;
      const direction = planetRegionDirection(frame, x + (nextX - x) * t, z + (nextZ - z) * t, radius);
      const surfaceRadius = radius + heightAt(direction);
      return direction.map(value => value * surfaceRadius);
    });
  });
}

export function projectPlanetRegionSurfacePoint(camera, point, horizonRadius) {
  const relative = point.map((value, axis) => value - camera.position[axis]);
  const depth = dot(relative, camera.forward);
  if (depth < camera.near) return null;

  const closest = -dot(camera.position, relative) / dot(relative, relative);
  if (closest > 0 && closest < 1) {
    const onRay = relative.map((value, axis) => camera.position[axis] + value * closest);
    if (dot(onRay, onRay) < horizonRadius ** 2) return null;
  }
  return [dot(relative, camera.right) / (depth * camera.tanX), dot(relative, camera.up) / (depth * camera.tanY)];
}

export function projectPlanetRegionPoint(camera, direction, surfaceRadius) {
  return projectPlanetRegionSurfacePoint(camera, direction.map(value => value * surfaceRadius), surfaceRadius);
}

function sphericalGrain(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const f = [x - ix, y - iy, z - iz].map(value => value * value * (3 - 2 * value));
  let sum = 0;
  for (let k = 0; k < 8; k++) {
    const a = k & 1, b = (k >> 1) & 1, c = k >> 2;
    let hash = seed ^ Math.imul(ix + a, 0x9e3779b9) ^ Math.imul(iy + b, 0x85ebca6b) ^ Math.imul(iz + c, 0xc2b2ae35);
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
    const weight = (a ? f[0] : 1 - f[0]) * (b ? f[1] : 1 - f[1]) * (c ? f[2] : 1 - f[2]);
    sum += (((hash ^ (hash >>> 12)) >>> 0) / 0x100000000 - 0.5) * weight;
  }
  return sum;
}

async function sampleRegionGrid(world, frame, span, resolution, map, {sampleGrid, sampleProcedural, sampleMaterials, onProgress, yieldFrame}) {
  if (sampleGrid) {
    onProgress(0.05);
    const {elevations, materials} = await sampleGrid(world, frame, span, resolution);
    if (world.studioMap !== map) throw new Error('Planet terrain changed. Select the region again.');
    const water = new Uint8Array(elevations.length);
    const waterDepth = new Float32Array(elevations.length);
    const ocean = world.oceanLevel ?? -Infinity;
    let min = Infinity, peak = -Infinity;
    for (let i = 0; i < elevations.length; i++) {
      const height = elevations[i];
      if (!Number.isFinite(height)) throw new Error('Planet terrain returned an invalid elevation.');
      if (height < ocean) {
        water[i] = 1;
        waterDepth[i] = ocean - height;
        elevations[i] = ocean;
      }
      min = Math.min(min, elevations[i]);
      peak = Math.max(peak, elevations[i]);
    }
    onProgress(1);
    return {resolution, elevations, water, waterDepth, materials, min, peak};
  }
  const radius = world.radius, seed = world.studioSeed;
  const gridSpan = span / (resolution - 1);
  const coarse = world.terrainSampling !== 'procedural';
  const source = coarse ? null : await sampleProcedural(world, frame, span, resolution);
  const elevations = new Float32Array(resolution ** 2);
  const water = new Uint8Array(elevations.length);
  const waterDepth = new Float32Array(elevations.length);
  const materialInputs = sampleMaterials && new Float32Array(elevations.length * 2);
  const progressScale = sampleMaterials ? 0.90 : 1;
  let min = Infinity, peak = -Infinity;
  for (let row = 0; row < resolution; row++) {
    if (world.studioMap !== map) throw new Error('Planet terrain changed. Select the region again.');
    for (let column = 0; column < resolution; column++) {
      const index = row * resolution + column;
      const radial = planetRegionDirection(frame, column * gridSpan - span / 2, row * gridSpan - span / 2, radius);
      const surface = world.sampleSurface(radial, source?.[index]);
      let height = surface.height;
      if (surface.depth > 0) {
        water[index] = 1;
        waterDepth[index] = surface.depth;
      } else {
        // These scale bands are anchored in spherical space. When multiple
        // nearby tiles are opened, gullies and ridges stay on the same terrain.
        const [x, y, z] = radial.map(value => value * radius);
        const grain = sphericalGrain(x / 220, y / 220, z / 220, seed)
          + 0.31 * sphericalGrain(x / 67, y / 67, z / 67, seed ^ 72349);
        const rock = Math.min(1, Math.max(0, (height - (world.oceanLevel ?? height - 300)) / 300));
        const fade = Math.max(0, Math.min(1, (220 - gridSpan) / 145));
        const refined = height + grain * (6 + 26 * rock) * fade;
        height = world.oceanLevel === null ? refined : Math.max(world.oceanLevel, refined);
      }
      if (!Number.isFinite(height)) throw new Error('Planet terrain returned an invalid elevation.');
      elevations[index] = height;
      if (materialInputs) {
        materialInputs[index * 2] = surface.land + (height - surface.height);
        materialInputs[index * 2 + 1] = water[index] ? surface.depth : (world.oceanLevel ?? height) - height;
      }
      min = Math.min(min, height);
      peak = Math.max(peak, height);
    }
    if (row % 12 === 0) {
      onProgress((row + 1) / resolution * progressScale);
      await yieldFrame();
    }
  }
  if (world.studioMap !== map) throw new Error('Planet terrain changed. Select the region again.');
  const materials = sampleMaterials ? await sampleMaterials(world, frame, span, resolution, materialInputs) : undefined;
  onProgress(1);
  return {resolution, elevations, water, waterDepth, materials, min, peak};
}

async function sampleContextGrid(world, frame, span, map, options) {
  const {resolution, elevations, water, waterDepth, materials} = await sampleRegionGrid(
    world, frame, span * REGION_CONTEXT_SCALE, REGION_CONTEXT_RESOLUTION, map, options);
  return {resolution, elevations, water, waterDepth, materials};
}

export function bakePlanetRegionContext(world, direction, span, sampleGrid) {
  return sampleContextGrid(world, planetRegionFrame(direction), span, world.studioMap, {
    sampleGrid, onProgress: () => {},
  });
}

export async function bakePlanetRegion(world, direction, span, {sampleGrid, sampleProcedural, sampleMaterials, cloudStyle, sunlight,
  resolution = LOCAL_REGION_RESOLUTION, includeSurroundings = false,
  onProgress = () => {}, yieldFrame = () => Promise.resolve()} = {}) {
  const frame = planetRegionFrame(direction);
  const {radius, studioSeed: seed, studioMap: map, preset} = world;
  const options = {sampleGrid, sampleProcedural, sampleMaterials, yieldFrame};
  let localProgress = 0, contextProgress = 0;
  const report = () => onProgress(includeSurroundings ? .8 * localProgress + .2 * contextProgress : localProgress);
  const localJob = sampleRegionGrid(world, frame, span, resolution, map, {
    ...options, onProgress: progress => { localProgress = progress; report(); },
  });
  const sampleContext = () => sampleContextGrid(world, frame, span, map, {
    ...options, onProgress: progress => { contextProgress = progress; report(); },
  });
  // Submit both GPU grids together so the surroundings do not wait on a
  // separate CPU readback of the larger local grid.
  const [local, context] = await Promise.all([localJob, includeSurroundings
    ? (sampleGrid ? sampleContext() : localJob.then(sampleContext)) : undefined]);
  if (world.studioMap !== map) throw new Error('Planet terrain changed. Select the region again.');
  return {version: 1, seed, preset, span, radius, context, ...local,
    direction: frame.up, terrainDetail: Boolean(sampleGrid), cloudStyle, sun: sunlight && planetRegionSun(frame, sunlight)};
}

const databaseName = 'cloud-lab-planet-regions';
const recentRegionKey = 'cloud-lab-recent-planet-region';

export function recentPlanetRegionId() {
  try { return localStorage.getItem(recentRegionKey); }
  catch { return null; }
}
async function regionDatabase() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(databaseName, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('regions');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

export async function storePlanetRegion(region) {
  const id = crypto.randomUUID();
  const db = await regionDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('regions', 'readwrite');
      transaction.objectStore('regions').put(region, id);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
  try { localStorage.setItem(recentRegionKey, id); }
  catch { /* The saved map is still reachable by its URL. */ }
  return id;
}

export async function updatePlanetRegionContext(id, context) {
  const db = await regionDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('regions', 'readwrite');
      const store = transaction.objectStore('regions');
      const read = store.get(id);
      read.onsuccess = () => {
        const saved = read.result;
        if (saved?.version === 1 && (saved.context?.resolution ?? 0) < context.resolution) {
          store.put({...saved, context}, id);
        }
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function readPlanetRegion(id) {
  const db = await regionDatabase();
  try {
    const region = await new Promise((resolve, reject) => {
      const load = db.transaction('regions').objectStore('regions').get(id);
      load.onsuccess = () => resolve(load.result);
      load.onerror = () => reject(load.error);
    });
    if (!region || region.version !== 1) throw new Error('This planet tile is unavailable in this browser.');
    return region;
  } finally {
    db.close();
  }
}
