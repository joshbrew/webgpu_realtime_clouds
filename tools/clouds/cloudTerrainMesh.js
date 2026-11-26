// Reusable rasterized heightfield; all geometry is generated once on the CPU.
import {terrainErosion} from './cloudTerrainErosion.js';
import {LOCAL_REGION_UNITS, REGION_CONTEXT_SCALE} from '../planet/planetRegion.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
function lattice(x,z){
 let h=Math.imul(x,374761393)^Math.imul(z,668265263)^0x5bd1e995;
 h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;
}
function noise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
 const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
 const a=lattice(ix,iz),b=lattice(ix+1,iz),c=lattice(ix,iz+1),d=lattice(ix+1,iz+1);
 return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
}
function baseTerrainHeight(x,z){
 const r=Math.hypot(x,z*.86),q=r+5*Math.sin(x*.055)+4*Math.sin(z*.061);
 const rim=smooth(22,49,q)*(1-smooth(68,112,q));
 if(rim===0)return -6;
 const wx=x+9*(noise(x*.023+17,z*.023)-.5),wz=z+9*(noise(x*.023,z*.023+31)-.5);
 const ridge=(f,ox,oz)=>1-Math.sqrt((noise(wx*f+ox,wz*f+oz)*2-1)**2+.025);
 const mountain=Math.max(0,ridge(.037,9,23));
 const folds=Math.max(0,ridge(.105,41,7));
 const scree=noise(wx*.28+71,wz*.28+53)-.5;
 return -6+rim*(7+24*mountain**2.8+5.5*folds**3+scree*1.2);
}
export function terrainHeight(x,z,erosionStrength=1,pixelSpan=1.2){
 const base=baseTerrainHeight(x,z);
 if(base===-6 || erosionStrength===0)return base;
 // A fixed world-space guide keeps the gully direction independent of mesh LOD.
 const d=.8,sx=(baseTerrainHeight(x+d,z)-baseTerrainHeight(x-d,z))/(2*d);
 const sz=(baseTerrainHeight(x,z+d)-baseTerrainHeight(x,z-d))/(2*d);
 const mask=smooth(-5,-.5,base);
 return Math.max(-6,base+terrainErosion(x,z,sx,sz,pixelSpan)*mask*erosionStrength);
}
export function createOceanPlane() {
 const vertices=new Float32Array(24);
 const extent=16384, height=2.65;
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z],i)=>{
  vertices.set([x*extent,height,z*extent,0,1,0],i*6);
 });
 return {vertices,indices:new Uint32Array([0,2,1,1,2,3])};
}

// The bake uses a tangent-plane (gnomonic) square to choose directions.
// Past the seam, put those directions back at their true spherical XYZ.
export function regionContextScale(x, z, elevation, radius, coreHalf, transition) {
  const extent = Math.hypot(x, z);
  const coreExtent = Math.SQRT2 * coreHalf;
  if (extent <= coreExtent) return 1;
  const altitude = 1 + elevation / radius;
  const radial = extent / radius;
  const edgeRadial = coreExtent / radius;
  const projected = extent * altitude / Math.sqrt(1 + radial * radial);
  const projectedEdge = coreExtent * altitude / Math.sqrt(1 + edgeRadial * edgeRadial);
  // Anchor the sphere to the square at its seam. Remove that offset
  // gradually in projected distance so large tiles on small worlds
  // cannot fold the surrounding mesh back under the selected square.
  const offset = coreExtent - projectedEdge;
  const blend = smooth(0, Math.max(transition, Math.abs(offset) * 2.4), projected - projectedEdge);
  return (projected + offset * (1 - blend)) / extent;
}

// A monotone height curve rounds the grid silhouette without inventing a
// peak or a valley between the saved elevations.
function terrainCurve(a, b, c, d, t) {
  const delta = c - b;
  const left = b - a, right = d - c;
  const slope = v => v * delta > 0 ? 2 * v * delta / (v + delta) : 0;
  const leftSlope = slope(left), rightSlope = slope(right);
  return b + t * (leftSlope + t * (3 * delta - 2 * leftSlope - rightSlope
    + t * (leftSlope + rightSlope - 2 * delta)));
}

function refineContextGrid(context, span) {
  const side = context.resolution;
  // Keep the old sampled heights when the saved tile cannot be rebaked.
  const subdivisions = side === REGION_CONTEXT_SCALE * 32 + 1 ? 3 : 2;
  if (side < 65 || side > 257) return context;
  const resolution = (side - 1) * subdivisions + 1;
  const area = resolution ** 2;
  const elevations = new Float32Array(area);
  const water = new Uint8Array(area);
  const waterDepth = context.water.includes(1) ? new Float32Array(area) : undefined;
  const materials = context.materials && new Uint8Array(area * 4);
  const sea = waterDepth ? context.elevations[context.water.indexOf(1)] : undefined;
  const fallbackDepth = span * REGION_CONTEXT_SCALE / (side - 1) * .26;
  const signed = context.elevations.map((height, i) => context.water[i] ? sea - (context.waterDepth?.[i] ?? fallbackDepth) : height);
  // Every row and column uses the same source taps and interpolation weights.
  const cells = new Uint32Array(resolution);
  const fractions = new Float64Array(resolution);
  for (let i = 0; i < resolution; i++) {
    const source = i / subdivisions;
    cells[i] = Math.min(side - 2, Math.floor(source));
    fractions[i] = source - cells[i];
  }
  const rows = new Float64Array(side * resolution);
  for (let z = 0; z < side; z++) {
    const source = z * side;
    const target = z * resolution;
    for (let x = 0; x < resolution; x++) {
      const col = cells[x];
      rows[target + x] = terrainCurve(signed[source + Math.max(0, col - 1)], signed[source + col],
        signed[source + col + 1], signed[source + Math.min(side - 1, col + 2)], fractions[x]);
    }
  }
  for (let z = 0; z < resolution; z++) {
    const row = cells[z], v = fractions[z];
    const anchorRow = z % subdivisions === 0;
    const target = z * resolution;
    const above = Math.max(0, row - 1) * resolution;
    const top = row * resolution, bottom = top + resolution;
    const below = Math.min(side - 1, row + 2) * resolution;
    for (let x = 0; x < resolution; x++) {
      const col = cells[x], u = fractions[x];
      const i = target + x;
      if (anchorRow && x % subdivisions === 0) {
        const source = (z / subdivisions) * side + x / subdivisions;
        elevations[i] = context.elevations[source];
        water[i] = context.water[source];
        if (water[i]) waterDepth[i] = context.waterDepth?.[source] ?? fallbackDepth;
      } else {
        const height = terrainCurve(rows[above + x], rows[top + x], rows[bottom + x], rows[below + x], v);
        water[i] = Number(sea !== undefined && height < sea);
        elevations[i] = water[i] ? sea : height;
        if (water[i]) waterDepth[i] = sea - height;
      }
      if (materials) {
        const base = (row * side + col) * 4;
        for (let c = 0; c < 4; c++) {
          const a = context.materials[base+c];
          const b = context.materials[base+c+4];
          const d = context.materials[base+c+side*4];
          const e = context.materials[base+c+(side+1)*4];
          materials[i*4+c] = Math.round((a+(b-a)*u)*(1-v)+(d+(e-d)*u)*v);
        }
      }
    }
  }
  return {resolution, elevations, water, waterDepth, materials};
}

function regionContextHeight(x, z, elevation, radius, half, seamWidth) {
  const extent = Math.max(Math.abs(x), Math.abs(z));
  if (extent <= half) return 0;
  const radial = Math.hypot(x, z) / radius;
  const edgeRadial = radial * half / extent;
  const drop = (radius + elevation) * (1 - 1 / Math.sqrt(1 + radial * radial));
  const edgeDrop = (radius + elevation) * (1 - 1 / Math.sqrt(1 + edgeRadial * edgeRadial));
  const beyond = extent - half;
  const transition = Math.max(half * .72, edgeDrop * 3, seamWidth);
  return (drop - edgeDrop) * smooth(0, transition * .35, beyond) + edgeDrop * smooth(0, transition, beyond);
}

function regionGridElevation(grid, width, x, z) {
  const {resolution, elevations} = grid;
  const last = resolution - 1;
  const gx = Math.max(0, Math.min(last, (x / width + .5) * last));
  const gz = Math.max(0, Math.min(last, (z / width + .5) * last));
  const col = Math.min(last - 1, Math.floor(gx)), row = Math.min(last - 1, Math.floor(gz));
  const u = gx - col, v = gz - row;
  const at = row * resolution + col;
  const east = elevations[at + 1], south = elevations[at + resolution];
  return u + v <= 1
    ? elevations[at] * (1 - u - v) + east * u + south * v
    : elevations[at + resolution + 1] * (u + v - 1) + east * (1 - v) + south * (1 - u);
}

export function planetRegionGroundHeight(region, x, z) {
  const {min, radius, span, context} = region;
  const scale = LOCAL_REGION_UNITS / span;
  const half = LOCAL_REGION_UNITS * .5;
  const extent = Math.max(Math.abs(x), Math.abs(z));
  if (extent <= half) return (regionGridElevation(region, LOCAL_REGION_UNITS, x, z) - min) * scale;

  const width = LOCAL_REGION_UNITS * REGION_CONTEXT_SCALE;
  if (context && extent <= width * .5) {
    const subdivision = context.resolution === REGION_CONTEXT_SCALE * 32 + 1 ? 3 : 2;
    const seamWidth = width * 4 / ((context.resolution - 1) * subdivision);
    const worldRadius = radius * scale;
    const elevation = regionGridElevation(context, width, x, z) * scale;
    const projection = regionContextScale(x, z, elevation, worldRadius, half, seamWidth);
    const gx = x / projection, gz = z / projection;
    const h = regionGridElevation(context, width, gx, gz) * scale;
    return h - min * scale - regionContextHeight(gx, gz, h, worldRadius, half, seamWidth);
  }

  const datum = (radius + min) * scale;
  const r2 = x * x + z * z;
  return -r2 / Math.max(datum + Math.sqrt(Math.max(0, datum * datum - r2)), 1);
}

export function createPlanetNavigationTerrain(region) {
  if (!region) return undefined;
  const reduce = ({resolution, elevations}) => {
    if (resolution <= 257) return {resolution, elevations};
    const step = (resolution - 1) / 256;
    const samples = new Float32Array(257 * 257);
    for (let z = 0; z < 257; z++) {
      const row = Math.round(z * step) * resolution;
      for (let x = 0; x < 257; x++) samples[z * 257 + x] = elevations[row + Math.round(x * step)];
    }
    return {resolution:257, elevations:samples};
  };
  const {radius, span, min, context} = region;
  return {radius, span, min, ...reduce(region), context: context && reduce(context)};
}

function writeRegionGrid(vertices, firstVertex, {resolution, elevations, water, waterDepth}, width, datum, scale, planetRadius = 0) {
  const step = width / (resolution - 1);
  const half = width / 2;
  const projection = planetRadius ? new Float32Array(elevations.length) : null;
  const heights = elevations.map((elevation, i) => {
    const localHeight = (elevation - datum) * scale;
    if (!projection) return localHeight;
    const x = (i % resolution) * step - half;
    const z = Math.floor(i / resolution) * step - half;
    const coreHalf = LOCAL_REGION_UNITS / 2;
    projection[i] = regionContextScale(x, z, elevation * scale, planetRadius, coreHalf, step * 4);
    // Join the flat tile with a level tangent, then return to the sphere.
    return localHeight - regionContextHeight(x, z, elevation * scale, planetRadius, coreHalf, step * 4);
  });
  let low = Infinity, high = -Infinity;
  for (let z = 0; z < resolution; z++) {
    const row = z * resolution;
    const back = Math.max(0, z - 1), front = Math.min(resolution - 1, z + 1);
    const zPosition = z * step - half;
    for (let x = 0; x < resolution; x++) {
      const i = row + x;
      const height = heights[i];
      low = Math.min(low, height);
      high = Math.max(high, height);
      const base = (firstVertex + i) * 6;
      const factor = projection?.[i] ?? 1;
      vertices[base] = (x * step - half) * factor;
      vertices[base + 1] = height;
      vertices[base + 2] = zPosition * factor;
      if (water[i]) {
        // A negative Y normal tags water. Its magnitude carries the sampled
        // shore depth, with exactly -1 denoting water with no depth value.
        const depth = waterDepth ? waterDepth[i] * scale : 0;
        vertices[base + 4] = -1 - depth;
      } else if (!projection) {
        const left = Math.max(0, x - 1), right = Math.min(resolution - 1, x + 1);
        const dx = (heights[row + left] - heights[row + right]) / ((right - left) * step);
        const dz = (heights[back * resolution + x] - heights[front * resolution + x]) / ((front - back) * step);
        const length = Math.sqrt(dx * dx + 1 + dz * dz);
        vertices[base + 3] = dx / length;
        vertices[base + 4] = 1 / length;
        vertices[base + 5] = dz / length;
      }
    }
  }
  if (projection) {
    // Measure the normal from the projected positions on the curved surface.
    for (let z = 0; z < resolution; z++) {
      const north = Math.max(0, z - 1), south = Math.min(resolution - 1, z + 1);
      for (let x = 0; x < resolution; x++) {
        const i = z * resolution + x;
        if (water[i]) continue;
        const west = Math.max(0, x - 1), east = Math.min(resolution - 1, x + 1);
        const base = (firstVertex + i) * 6;
        const w = (firstVertex + z * resolution + west) * 6, e = (firstVertex + z * resolution + east) * 6;
        const n = (firstVertex + north * resolution + x) * 6, s = (firstVertex + south * resolution + x) * 6;
        const ax = vertices[e] - vertices[w], ay = vertices[e + 1] - vertices[w + 1], az = vertices[e + 2] - vertices[w + 2];
        const bx = vertices[s] - vertices[n], by = vertices[s + 1] - vertices[n + 1], bz = vertices[s + 2] - vertices[n + 2];
        const nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax;
        const normalLength = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        vertices[base + 3] = nx / normalLength;
        vertices[base + 4] = ny / normalLength;
        vertices[base + 5] = nz / normalLength;
      }
    }
  }
  return [low, high];
}

function writeRegionQuads(indices, offset, base, side, gapMin = -1, gapMax = -1,
    startX = 0, startZ = 0, endX = side - 1, endZ = side - 1) {
  for (let z = startZ; z < endZ; z++) {
    for (let x = startX; x < endX; x++) {
      if (x >= gapMin && x < gapMax && z >= gapMin && z < gapMax) continue;
      const a = base + z * side + x;
      const b = a + 1, c = a + side;
      indices[offset++] = a;
      indices[offset++] = c;
      indices[offset++] = b;
      indices[offset++] = b;
      indices[offset++] = c;
      indices[offset++] = c + 1;
    }
  }
  return offset;
}

function writeRegionSeam(indices, offset, fineSide, coarseSide, first, last) {
  const fineCount = fineSide - 1, coarseCount = last - first;
  const coarseBase = fineSide ** 2;
  const around = (side, lo, hi, edge, step) => {
    if (edge === 0) return lo * side + lo + step;
    if (edge === 1) return (lo + step) * side + hi;
    if (edge === 2) return hi * side + hi - step;
    return (hi - step) * side + lo;
  };
  for (let edge = 0; edge < 4; edge++) {
    const inner = step => around(fineSide, 0, fineCount, edge, step);
    const outer = step => coarseBase + around(coarseSide, first, last, edge, step);
    let a = 0, b = 0;
    // Advance along either perimeter according to normalized distance. Every
    // fine edge is shared by the transition, so the seam has no T-junctions.
    while (a < fineCount || b < coarseCount) {
      if (a < fineCount && (b === coarseCount || (a + 1) * coarseCount <= (b + 1) * fineCount)) {
        indices.set([inner(a), inner(a + 1), outer(b)], offset);
        a++;
      } else {
        indices.set([inner(a), outer(b + 1), outer(b)], offset);
        b++;
      }
      offset += 3;
    }
  }
}

const regionDetailBlock = 16;
const regionDetailBlocksAcross = 4;
export const REGION_DETAIL_CELLS = regionDetailBlock * regionDetailBlocksAcross;
export const REGION_DETAIL_SUBDIVISIONS = 4;
export const REGION_NEAR_DETAIL_CELLS = 16;
export const REGION_NEAR_DETAIL_SUBDIVISIONS = 12;

export function createRegionDetailIndices(near = false) {
  const cells = REGION_DETAIL_CELLS * REGION_DETAIL_SUBDIVISIONS + (near
    ? REGION_NEAR_DETAIL_CELLS * (REGION_NEAR_DETAIL_SUBDIVISIONS - REGION_DETAIL_SUBDIVISIONS)
    : 0);
  const indices = new Uint32Array(cells * cells * 6);
  writeRegionQuads(indices, 0, 0, cells + 1);
  return indices;
}

export function selectRegionDetail(region, position, forward, altitudeRange = 1) {
  const {resolution, min, span} = region;
  const cells = resolution - 1;
  const step = LOCAL_REGION_UNITS / cells;
  const windowCells = cells >= 256 ? REGION_DETAIL_CELLS * 2 : REGION_DETAIL_CELLS;
  const width = windowCells * step;
  const half = LOCAL_REGION_UNITS * .5;
  const sample = (x, z) => (regionGridElevation(region, LOCAL_REGION_UNITS, x, z) - min) * LOCAL_REGION_UNITS / span;
  const [x, y, z] = position;
  if (Math.max(Math.abs(x), Math.abs(z)) > half + width * .3) return null;
  const clearance = Math.abs(y - sample(x, z));
  // Center the fine terrain toward the part of the ground the camera can see.
  const look = Math.min(width * .38, (width * .04 + clearance) / Math.max(.24, -forward[1]));
  const focusX = x + forward[0] * look;
  const focusZ = z + forward[2] * look;
  const depth = Math.min(clearance, Math.abs(y - sample(focusX, focusZ)));
  const strength = 1 - smooth(width * .24 * altitudeRange, width * .62 * altitudeRange, depth);
  if (strength <= 0) return null;
  const blockWidth = regionDetailBlock * step;
  const last = (cells - windowCells) / regionDetailBlock;
  const origin = focus => Math.max(0, Math.min(last, Math.round((focus + half - width * .5) / blockWidth)));
  const column = origin(focusX), row = origin(focusZ);
  const startX = column * regionDetailBlock, startZ = row * regionDetailBlock;
  // Keep the denser part near the camera even when the larger window is
  // pinned to a tile edge. The innermost variation fades inside this area.
  const nearOrigin = (focus, start) => {
    const center = (focus + half) / step - start - REGION_NEAR_DETAIL_CELLS * .5;
    const aligned = Math.round(center / 4) * 4;
    return Math.max(0, Math.min(windowCells - REGION_NEAR_DETAIL_CELLS, aligned));
  };
  const nearStrength = 1 - smooth(step * 4, step * 12, depth);
  return {column, row, startX, startZ, focusX, focusZ, strength, nearStrength, cells: windowCells,
    nearX: nearOrigin(focusX, startX), nearZ: nearOrigin(focusZ, startZ)};
}

export function regionDetailDrawRanges(resolution, indexCount, {column, row, cells = REGION_DETAIL_CELLS}) {
  const windowBlocks = cells / regionDetailBlock;
  const blocks = (resolution - 1) / regionDetailBlock;
  const blockIndices = regionDetailBlock ** 2 * 6;
  const ranges = [];
  let cursor = 0;
  for (let z = row; z < row + windowBlocks; z++) {
    const skip = (z * blocks + column) * blockIndices;
    if (skip > cursor) ranges.push([cursor, skip - cursor]);
    cursor = skip + windowBlocks * blockIndices;
  }
  if (cursor < indexCount) ranges.push([cursor, indexCount - cursor]);
  return ranges;
}

// Keep ranges in index order so culling cannot change the order of visible
// triangles. Each bound encloses actual vertices, including curved terrain.
export function regionDrawBounds(vertices, indices, coreIndexCount, contextSide) {
  const groups = [];
  // Shared vertices contribute once per batch. Use the batch's starting
  // index as its stamp so a vertex can still extend the neighboring bound.
  const visited = new Uint32Array(vertices.length / 6);
  const append = (start, end, stride) => {
    let group;
    for (let first = start; first < end; first += stride) {
      const last = Math.min(first + stride, end);
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      const stamp = first + 1;
      for (let i = first; i < last; i++) {
        const index = indices[i];
        if (visited[index] === stamp) continue;
        visited[index] = stamp;
        const offset = index * 6;
        const x = vertices[offset], y = vertices[offset + 1], z = vertices[offset + 2];
        minX = Math.min(minX, x); minY = Math.min(minY, y); minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); maxZ = Math.max(maxZ, z);
      }
      const box = { first, last, minX, minY, minZ, maxX, maxY, maxZ };
      if (!group || group.children.length === 16) {
        group = { ...box, children: [box] };
        groups.push(group);
      } else {
        group.last = last;
        group.minX = Math.min(group.minX, minX);
        group.minY = Math.min(group.minY, minY);
        group.minZ = Math.min(group.minZ, minZ);
        group.maxX = Math.max(group.maxX, maxX);
        group.maxY = Math.max(group.maxY, maxY);
        group.maxZ = Math.max(group.maxZ, maxZ);
        group.children.push(box);
      }
    }
  };
  append(0, coreIndexCount, regionDetailBlock ** 2 * 6);
  append(coreIndexCount, indices.length, Math.max(contextSide - 1, 16) * 18);
  return groups;
}

export function visibleRegionDrawRanges(groups, ranges, position, right, up, forward, fovY, aspect, oneDrawPerRange = false) {
  const tanY = Math.tan(fovY / 2);
  if (ranges.length === 0 || !Number.isFinite(tanY) || tanY <= 0 || fovY >= Math.PI || !Number.isFinite(aspect) || aspect <= 0) return ranges;
  const tanX = tanY * aspect;
  const side = (axis, slope, sign) => forward.map((v, i) => v * slope + axis[i] * sign);
  // Leave room at the clip planes for GPU float rounding. The actual near
  // plane is in front of the camera, so using the camera plane is conservative.
  const planes = [forward, side(right, tanX, 1), side(right, tanX, -1), side(up, tanY, 1), side(up, tanY, -1)]
    .map(([x, y, z]) => [x, y, z, x * position[0] + y * position[1] + z * position[2] - .02 * Math.hypot(x, y, z)]);
  return clipRegionDrawRanges(groups, ranges, planes, oneDrawPerRange);
}

export function regionShadowDrawRanges(contextBounds, count, frame, coreCount = 0) {
  if (!contextBounds.length) return [[0, count]];
  const planes = [];
  // Match the orthographic clip volume written by region_shadow_clip.
  // Keep one shadow texel of padding for GPU rounding at its boundaries.
  const padding = frame[12] * 2;
  for (let axis = 0; axis < 3; axis++) {
    const offset = axis * 4;
    const [x, y, z, origin] = frame.subarray(offset, offset + 4);
    const lower = axis === 2 ? 0 : -1;
    planes.push([x, y, z, lower - origin - padding], [-x, -y, -z, origin - 1 - padding]);
  }
  const ranges = clipRegionDrawRanges(contextBounds, [[coreCount, count - coreCount]], planes);
  const omitted = count - coreCount - ranges.reduce((sum, range) => sum + range[1], 0);
  // The light projection already fits the core. Keep one draw when culling
  // the surrounding terrain would save too little to split the submission.
  if (omitted < count * .08) return [[0, count]];
  if (coreCount) {
    if (ranges[0]?.[0] === coreCount) ranges[0] = [0, coreCount + ranges[0][1]];
    else ranges.unshift([0, coreCount]);
  }
  return ranges;
}

function clipRegionDrawRanges(groups, ranges, planes, oneDrawPerRange = false) {
  // A group wholly inside or outside the view needs no per-batch checks.
  const classify = (box, checkInterior) => {
    let interior = checkInterior;
    for (const [x, y, z, limit] of planes) {
      const nearX = x >= 0 ? box.minX : box.maxX;
      const nearY = y >= 0 ? box.minY : box.maxY;
      const nearZ = z >= 0 ? box.minZ : box.maxZ;
      const farX = x >= 0 ? box.maxX : box.minX;
      const farY = y >= 0 ? box.maxY : box.minY;
      const farZ = z >= 0 ? box.maxZ : box.minZ;
      if (x * farX + y * farY + z * farZ < limit) return -1;
      if (interior && x * nearX + y * nearY + z * nearZ < limit) interior = false;
    }
    return interior ? 1 : 0;
  };
  const visible = [];
  let rangeIndex = 0;
  const appendVisible = box => {
    while (rangeIndex < ranges.length && ranges[rangeIndex][0] + ranges[rangeIndex][1] <= box.first) rangeIndex++;
    for (let i = rangeIndex; i < ranges.length && ranges[i][0] < box.last; i++) {
      const [start, length] = ranges[i];
      const first = Math.max(start, box.first);
      const last = Math.min(start + length, box.last);
      const previous = visible.at(-1);
      const previousEnd = previous ? previous[0] + previous[1] : -1;
      // Never bridge a gap between allowed ranges. It belongs to the fine
      // mesh. In close flight, only trim the ends of each existing draw.
      const mergeWithinRange = previousEnd >= start && (oneDrawPerRange || first - previousEnd <= 2 * regionDetailBlock ** 2 * 6);
      if (previousEnd === first || mergeWithinRange) previous[1] = last - previous[0];
      else visible.push([first, last - first]);
    }
  };
  for (const group of groups) {
    if (rangeIndex === ranges.length) break;
    if (group.first >= ranges[ranges.length - 1][0] + ranges[ranges.length - 1][1]) break;
    const relation = classify(group, true);
    if (relation < 0) continue;
    if (relation > 0) appendVisible(group);
    else for (const box of group.children) {
      if (classify(box, false) >= 0) appendVisible(box);
    }
  }
  return visible;
}

// The selected square always occupies the first set of indices. The same
// buffers serve the terrain camera and the square-only map overview.
export function createPlanetRegionMesh(region) {
  const {resolution, span, min, radius} = region;
  const context = region.context && refineContextGrid(region.context, span);
  const scale = LOCAL_REGION_UNITS / span;
  const coreIndexCount = (resolution - 1) ** 2 * 6;
  const coarseSide = context?.resolution ?? 0;
  const first = Math.floor((coarseSide - 1) * (0.5 - 0.5 / REGION_CONTEXT_SCALE)) - 1;
  const last = coarseSide - 1 - first;
  const gap = last - first;
  const contextIndexCount = context ? ((coarseSide - 1) ** 2 - gap ** 2) * 6 + 12 * (resolution - 1 + gap) : 0;
  const vertices = new Float32Array((resolution ** 2 + coarseSide ** 2) * 6);
  const indices = new Uint32Array(coreIndexCount + contextIndexCount);
  const coreHeights = writeRegionGrid(vertices, 0, region, LOCAL_REGION_UNITS, min, scale);
  let surroundingsHeights;
  const cells = resolution - 1;
  const canRefine = !!((region.terrainDetail && region.materials || region.direction && radius > 0) &&
    cells >= REGION_DETAIL_CELLS && cells % regionDetailBlock === 0);
  if (canRefine) {
    // Store contiguous blocks so a refined window can replace only its own indices.
    let offset = 0;
    for (let z = 0; z < cells; z += regionDetailBlock) {
      for (let x = 0; x < cells; x += regionDetailBlock) {
        offset = writeRegionQuads(indices, offset, 0, resolution, -1, -1,
          x, z, x + regionDetailBlock, z + regionDetailBlock);
      }
    }
  } else {
    writeRegionQuads(indices, 0, 0, resolution);
  }
  if (context) {
    surroundingsHeights = writeRegionGrid(vertices, resolution ** 2, context,
      LOCAL_REGION_UNITS * REGION_CONTEXT_SCALE, min, scale, radius * scale);
    const seamOffset = writeRegionQuads(indices, coreIndexCount, resolution ** 2, coarseSide, first, last);
    writeRegionSeam(indices, seamOffset, resolution, coarseSide, first, last);
  }
  let materials;
  if (region.materials || context?.materials) {
    materials = new Uint8Array((resolution ** 2 + coarseSide ** 2) * 4);
    if (region.materials) materials.set(region.materials);
    if (context?.materials) materials.set(context.materials, resolution ** 2 * 4);
  }
  return {vertices, indices, coreIndexCount, materials, canRefine, context, shadowBounds: {coreHeights, surroundingsHeights}};
}

export function regionShadowProjection({coreHeights, surroundingsHeights}, sun, size, receiverScale = 1) {
  const [x, y, z] = sun;
  // Wait until the sun clears the horizon before allocating direct light.
  if (y <= .015) return null;
  const horizontal = Math.hypot(x, z);
  const right = horizontal > 1e-6 ? [z / horizontal, 0, -x / horizontal] : [1, 0, 0];
  const up = [y * right[2], z * right[0] - x * right[2], -y * right[0]];
  const depth = [-x, -y, -z];
  const half = LOCAL_REGION_UNITS * .5;
  const fitRadius = (axis, width, heights) => (Math.abs(axis[0]) + Math.abs(axis[2])) * width +
    Math.abs(axis[1]) * (heights[1] - heights[0]) * .5;
  const fitCenter = (axis, heights) => axis[1] * (heights[0] + heights[1]) * .5;
  const pad = half * .18;
  // Include neighboring shaft receivers when the air is sampling this map.
  // The full surroundings contribute depth where they project into its footprint.
  const receiverHalf = half * receiverScale;
  const extentX = fitRadius(right, receiverHalf, coreHeights) + pad;
  const extentY = fitRadius(up, receiverHalf, coreHeights) + pad;
  const casters = surroundingsHeights
    ? [Math.min(coreHeights[0], surroundingsHeights[0]), Math.max(coreHeights[1], surroundingsHeights[1])]
    : coreHeights;
  const extentZ = fitRadius(depth, half * (surroundingsHeights ? REGION_CONTEXT_SCALE : 1), casters) + pad;
  const depthScale = .5 / extentZ;
  return new Float32Array([
    ...right.map(v => v / extentX), -fitCenter(right, coreHeights) / extentX,
    ...up.map(v => v / extentY), -fitCenter(up, coreHeights) / extentY,
    ...depth.map(v => v * depthScale), .5 - fitCenter(depth, casters) * depthScale,
    1 / size, 2 * Math.max(extentX, extentY) / size, depthScale, 1,
  ]);
}

export function createTerrainMesh(resolution=289,extent=192){
 const vertices=new Float32Array((resolution*resolution+8)*6),indices=new Uint32Array((resolution-1)**2*6+24);
 // Concentrate triangles around the basin and ridges, not the flat outer apron.
 const axis=Float64Array.from({length:resolution},(_,i)=>{
  const u=i*2/(resolution-1)-1;return extent*u*(.3+.7*Math.abs(u));
 });
 const heights=new Float64Array(resolution*resolution);
 for(let z=0;z<resolution;z++)for(let x=0;x<resolution;x++){
  const span=Math.max(axis[Math.min(x+1,resolution-1)]-axis[Math.max(x-1,0)],axis[Math.min(z+1,resolution-1)]-axis[Math.max(z-1,0)])*.5;
  heights[z*resolution+x]=terrainHeight(axis[x],axis[z],1,span);
 }
 for(let z=0;z<resolution;z++)for(let x=0;x<resolution;x++){
  const x0=Math.max(0,x-1),x1=Math.min(resolution-1,x+1),z0=Math.max(0,z-1),z1=Math.min(resolution-1,z+1);
  const nx=(heights[z*resolution+x0]-heights[z*resolution+x1])/(axis[x1]-axis[x0]);
  const nz=(heights[z0*resolution+x]-heights[z1*resolution+x])/(axis[z1]-axis[z0]);
  const length=Math.hypot(nx,1,nz),offset=(z*resolution+x)*6;
  vertices.set([axis[x],heights[z*resolution+x],axis[z],nx/length,1/length,nz/length],offset);
 }
 let i=0;
 for(let z=0;z<resolution-1;z++)for(let x=0;x<resolution-1;x++){
  const a=z*resolution+x,b=a+1,c=a+resolution,d=c+1;indices.set([a,c,b,b,c,d],i);i+=6;
 }
 const base=resolution*resolution,outer=16384,corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
 for(let ring=0;ring<2;ring++)for(let c=0;c<4;c++){
  const radius=ring?outer:extent,[x,z]=corners[c];vertices.set([x*radius,-6,z*radius,0,1,0],(base+ring*4+c)*6);
 }
 for(let c=0;c<4;c++){
  const a=base+c,b=base+(c+1)%4,d=a+4,e=b+4;indices.set([a,b,d,b,e,d],i);i+=6;
 }
 return {vertices,indices};
}
