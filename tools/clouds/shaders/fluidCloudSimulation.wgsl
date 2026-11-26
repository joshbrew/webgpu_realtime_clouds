struct Simulation {
  flow: vec4<f32>, // step, east wind, elapsed time, south wind
  obstacles: array<vec4<f32>, 3>, // center xz, scale, shape
  motion: array<vec4<f32>, 3>, // translation in cells/sec
  axes: array<vec4<f32>, 3>, // cosine, sine, angular speed in radians/sec
  terrain: vec4<f32>, // active, cutoff, drag, condensation rate
  weather: vec4<f32>, // formation mode
};

@group(0) @binding(0) var<uniform> settings: Simulation;
@group(0) @binding(1) var<storage, read> velocityIn: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> velocityOut: array<vec2<f32>>;
@group(0) @binding(3) var<storage, read_write> solid: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> field: array<f32>;
@group(0) @binding(5) var<storage, read> pressureIn: array<f32>;
@group(0) @binding(6) var<storage, read_write> pressureOut: array<f32>;
// Water channels hold condensate and vapor, respectively.
@group(0) @binding(7) var<storage, read> waterIn: array<vec2<f32>>;
@group(0) @binding(8) var<storage, read_write> waterOut: array<vec2<f32>>;
@group(0) @binding(9) var<storage, read> waterForward: array<vec2<f32>>;
@group(0) @binding(10) var<storage, read_write> coarseCells: array<vec4<f32>>;
@group(0) @binding(11) var<storage, read> correctionIn: array<f32>;
@group(0) @binding(12) var<storage, read_write> correctionOut: array<f32>;

@group(0) @binding(13) var cloudMaterialIn: texture_2d<f32>;
@group(0) @binding(14) var cloudMaterialOut: texture_storage_2d<rgba16float, write>;
@group(0) @binding(15) var materialSampler: sampler;
@group(0) @binding(16) var<storage, read> terrainField: array<vec2<f32>>;
@group(0) @binding(19) var<storage, read> initialMoisture: array<vec2<f32>>;
@group(0) @binding(17) var cloudDetailIn: texture_2d<f32>;
@group(0) @binding(18) var cloudDetailOut: texture_storage_2d<rgba16float, write>;

const coarseGrid = GRID / 2u;

const east = vec2<i32>(1, 0);
const north = vec2<i32>(0, 1);
const tau = 6.283185307;

fn index(p: vec2<i32>) -> u32 {
  let q = vec2<u32>(p) & vec2<u32>(GRID - 1u);
  return q.x + q.y * GRID;
}

fn reservoir(p: vec2<i32>, size: u32) -> bool {
  return settings.terrain.x > .5 && any(min(p, vec2<i32>(i32(size) - 1) - p) < vec2<i32>(1));
}

fn inGrid(id: vec3<u32>) -> bool {
  return all(id.xy < vec2<u32>(GRID));
}

fn waterDonor(p: vec2<i32>, center: u32, terrain: bool) -> u32 {
  let cell = select(p, clamp(p, vec2<i32>(0), vec2<i32>(i32(GRID) - 1)), terrain);
  let i = index(cell);
  // Keep moist air beside solid terrain. At the edges, water can leave
  // without re-entering from the opposite side of the periodic velocity grid.
  return select(i, center, terrain && solid[i].z > .5);
}

fn waterDonors(p: vec2<i32>, center: u32, terrain: bool) -> vec4<u32> {
  return vec4<u32>(waterDonor(p, center, terrain), waterDonor(p + east, center, terrain),
    waterDonor(p + north, center, terrain), waterDonor(p + east + north, center, terrain));
}

fn waterStencil(donors: vec4<u32>) -> mat4x2<f32> {
  return mat4x2<f32>(waterIn[donors.x], waterIn[donors.y], waterIn[donors.z], waterIn[donors.w]);
}

fn waterBilerp(v: mat4x2<f32>, f: vec2<f32>) -> vec2<f32> {
  return mix(mix(v[0], v[1], f.x), mix(v[2], v[3], f.x), f.y);
}

fn bilerp(v: vec4<f32>, f: vec2<f32>) -> f32 {
  return mix(mix(v.x, v.y, f.x), mix(v.z, v.w, f.x), f.y);
}

fn faceVelocity(p: vec2<i32>, axis: u32) -> f32 {
  if (settings.terrain.x > .5 && any(min(p, vec2<i32>(i32(GRID) - 1) - p) < vec2<i32>(0))) {
    return settings.flow.yw[axis];
  }
  return velocityIn[index(p)][axis];
}

fn componentAt(p: vec2<f32>, axis: u32) -> f32 {
  // Velocity components live on the positive faces of each cell.
  let q = p - select(vec2<f32>(0.5, 1.0), vec2<f32>(1.0, 0.5), axis == 0u);
  let c = vec2<i32>(floor(q));
  return bilerp(vec4<f32>(faceVelocity(c, axis), faceVelocity(c + east, axis),
    faceVelocity(c + north, axis), faceVelocity(c + east + north, axis)), fract(q));
}

fn backtrace(p: vec2<f32>, dt: f32) -> vec2<f32> {
  let v = vec2<f32>(componentAt(p, 0u), componentAt(p, 1u));
  let halfPoint = p - 0.5 * dt * v;
  return p - dt * vec2<f32>(componentAt(halfPoint, 0u), componentAt(halfPoint, 1u));
}

fn hash(p: vec2<f32>) -> f32 {
  let q = fract(vec3<f32>(p.xyx) * 0.1031);
  let h = q + dot(q, q.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

fn periodicNoise(uv: vec2<f32>, period: f32) -> f32 {
  let p = fract(uv) * period;
  let c = floor(p);
  let f = smoothstep(vec2<f32>(0.0), vec2<f32>(1.0), fract(p));
  let next = c + 1.0 - period * step(vec2<f32>(period), c + 1.0);
  return bilerp(vec4<f32>(hash(c), hash(vec2<f32>(next.x, c.y)),
    hash(vec2<f32>(c.x, next.y)), hash(next)), f);
}

fn cloudSeed(uv: vec2<f32>) -> f32 {
  let ribbon = 0.5 + 0.5 * sin(tau * (uv.y * 2.0 + sin(tau * uv.x) * 0.25));
  let field = periodicNoise(uv + 0.14, 5.0) * 0.59
    + periodicNoise(uv + 0.35, 12.0) * 0.26 + ribbon * 0.22;
  return smoothstep(0.37, 0.79, field) * 0.96;
}

@compute @workgroup_size(8, 8)
fn initialize(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<f32>(id.xy) + 0.5;
  let i = index(vec2<i32>(id.xy));
  let uv = p / f32(GRID);
  let wind = settings.flow.yw;
  let terrain = settings.terrain.x > 0.5;
  let seedMotion = select(1.0, min(.82, length(wind) * .085), terrain);
  velocityOut[i] = wind + vec2<f32>(3.1 * sin(tau * uv.y), 3.2 * sin(tau * uv.x)) * seedMotion;
  let seeded = cloudSeed(uv);
  // Visible cloud water and invisible vapor travel with the same wind.
  var initial = select(vec2<f32>(seeded, 0.0), vec2<f32>(seeded * .56, .39 + seeded * .39), terrain);
  let planetWeather = initialMoisture[i];
  if (terrain && planetWeather.y > 0.0) { initial = planetWeather; }
  if (settings.weather.x >= 2.0) {
    initial.x = max(initial.x, .35 + .07 * seeded);
    initial.y = max(initial.y, .36);
  }
  waterOut[i] = select(initial, vec2<f32>(0.0), terrain && solid[i].z > 0.5);
}

fn wallMotion(i: u32, offset: vec2<f32>) -> vec2<f32> {
  return settings.motion[i].xy + settings.axes[i].z * vec2<f32>(-offset.y, offset.x);
}

@compute @workgroup_size(8, 8)
fn updateObstacles(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<f32>(id.xy) + 0.5;
  if (settings.terrain.x > 0.5) {
    let i = index(vec2<i32>(id.xy));
    let terrain = terrainField[i];
    let blocked = terrain.x >= settings.terrain.y && terrain.y > .80;
    let resistance = smoothstep(.025, 1.0, terrain.x / settings.terrain.y) * terrain.y;
    solid[i] = vec4<f32>(0.0, 0.0, select(0.0, 1.0, blocked), resistance);
    return;
  }
  var state = vec4<f32>(0.0);
  for (var j = 0u; j < 3u; j++) {
    let object = settings.obstacles[j];
    let offset = p - object.xy;
    let kind = u32(object.w);
    let bound = object.z * footprintBoundScale(kind);
    if (dot(offset, offset) <= bound * bound
      && footprintDistance(offset, object.z, kind, settings.axes[j].xy) <= 0.0) {
      state = vec4<f32>(wallMotion(j, offset), 1.0, 0.0);
    }
  }
  solid[index(vec2<i32>(id.xy))] = state;
}

fn faceWall(p: vec2<i32>, neighbor: vec2<i32>, axis: u32) -> vec2<f32> {
  let a = solid[index(p)];
  let b = solid[index(neighbor)];
  let count = a.z + b.z;
  // A cell center and its normal face have the same transverse coordinate,
  // so this component of rigid-body rotation is exact on the MAC face.
  return vec2<f32>((a[axis] + b[axis]) / max(count, 1.0), min(count, 1.0));
}

fn crossDerivatives(p: vec2<i32>) -> vec2<f32> {
  let dv = (velocityIn[index(p + east)].y + velocityIn[index(p + east - north)].y)
    - (velocityIn[index(p - east)].y + velocityIn[index(p - east - north)].y);
  let du = (velocityIn[index(p + north)].x + velocityIn[index(p + north - east)].x)
    - (velocityIn[index(p - north)].x + velocityIn[index(p - north - east)].x);
  return vec2<f32>(dv, du) * .25;
}

fn cellCurl(p: vec2<i32>) -> f32 {
  let cross = crossDerivatives(p);
  return cross.x - cross.y;
}

@compute @workgroup_size(8, 8)
fn measureCurl(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  field[i] = select(cellCurl(p), 0.0, solid[i].z > 0.5);
}

fn faceResistance(p: vec2<i32>, q: vec2<i32>) -> f32 {
  return (solid[index(p)].w + solid[index(q)].w) * .5;
}

fn advectFace(p: vec2<f32>, axis: u32, boundary: vec2<f32>, force: f32, resistance: f32) -> f32 {
  if (boundary.y > 0.5) { return boundary.x; }
  let dt = settings.flow.x;
  let wind = settings.flow.yw[axis];
  var next = mix(componentAt(backtrace(p, dt), axis), wind, dt * 0.18) + force * dt;
  if (settings.terrain.x > .5) {
    // The outer reservoir imposes the incoming wind. Interior faces remain
    // free to turn, including where the selected map meets its surroundings.
    let edge = min(p, f32(GRID) - p);
    if (min(edge.x, edge.y) < 1.0) { return wind; }
    next *= exp(-dt * resistance * settings.terrain.z * 3.2);
    return clamp(next, -.78 * f32(GRID), .78 * f32(GRID));
  }
  // A small viscous layer transfers tangential motion just outside each
  // obstacle. Pressure projection below handles its normal wall velocity.
  for (var j = 0u; j < 3u; j++) {
    let object = settings.obstacles[j];
    let offset = p - object.xy;
    let kind = u32(object.w);
    let skinReach = object.z * footprintBoundScale(kind) + 2.7;
    if (dot(offset, offset) >= skinReach * skinReach) { continue; }
    let wallDistance = footprintDistance(offset, object.z, kind, settings.axes[j].xy);
    let coupling = 1.0 - smoothstep(0.0, 2.0, wallDistance);
    next = mix(next, wallMotion(j, offset)[axis], coupling * min(dt * 20.0, 1.0));
  }
  return clamp(next, -0.78 * f32(GRID), 0.78 * f32(GRID));
}

@compute @workgroup_size(8, 8)
fn advectVelocity(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let corner = vec2<f32>(p);
  let i = index(p);
  let gradient = vec2<f32>(abs(field[index(p + east)]) - abs(field[index(p - east)]),
    abs(field[index(p + north)]) - abs(field[index(p - north)]));
  let normal = gradient * inverseSqrt(max(dot(gradient, gradient), 0.05));
  let force = vec2<f32>(normal.y, -normal.x) * field[i] * 1.15;
  velocityOut[i] = vec2<f32>(
    advectFace(corner + vec2<f32>(1.0, 0.5), 0u, faceWall(p, p + east, 0u), force.x, faceResistance(p, p + east)),
    advectFace(corner + vec2<f32>(0.5, 1.0), 1u, faceWall(p, p + north, 1u), force.y, faceResistance(p, p + north)));
}

@compute @workgroup_size(8, 8)
fn measureDivergence(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  let v = velocityIn[i];
  let divergence = v.x - velocityIn[index(p - east)].x + v.y - velocityIn[index(p - north)].y;
  field[i] = select(divergence, 0.0, solid[i].z > 0.5);
}

@compute @workgroup_size(8, 8)
fn solvePressure(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  if (solid[i].z > 0.5 || reservoir(vec2<i32>(id.xy), GRID)) { pressureOut[i] = 0.0; return; }
  let a = index(p - east);
  let b = index(p + east);
  let c = index(p - north);
  let d = index(p + north);
  // Neumann conditions at moving walls. Their velocities already contribute
  // to the divergence. Pressure changes faces shared by two fluid cells.
  let open = 1.0 - vec4<f32>(solid[a].z, solid[b].z, solid[c].z, solid[d].z);
  let sum = dot(vec4<f32>(pressureIn[a], pressureIn[b], pressureIn[c], pressureIn[d]), open);
  let neighbors = dot(open, vec4<f32>(1.0));
  let estimate = (sum - field[i]) / max(neighbors, 1.0);
  pressureOut[i] = select(0.0, mix(pressureIn[i], estimate, 0.80), neighbors > 0.0);
}

fn coarseIndex(p: vec2<i32>) -> u32 {
  let q = vec2<u32>(p) & vec2<u32>(coarseGrid - 1u);
  return q.x + q.y * coarseGrid;
}

fn openFace(p: vec2<i32>, q: vec2<i32>) -> f32 {
  return 1.0 - max(solid[index(p)].z, solid[index(q)].z);
}

fn fineResidual(p: vec2<i32>) -> f32 {
  let i = index(p);
  if (solid[i].z > 0.5 || reservoir(p, GRID)) { return 0.0; }
  let a = index(p - east);
  let b = index(p + east);
  let c = index(p - north);
  let d = index(p + north);
  let open = 1.0 - vec4<f32>(solid[a].z, solid[b].z, solid[c].z, solid[d].z);
  let other = vec4<f32>(pressureIn[a], pressureIn[b], pressureIn[c], pressureIn[d]);
  return field[i] - dot(other - pressureIn[i], open);
}

@compute @workgroup_size(8, 8)
fn restrictPressureResidual(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id.xy >= vec2<u32>(coarseGrid))) { return; }
  let cell = vec2<i32>(id.xy);
  let a = cell * 2;
  let b = a + east;
  let c = a + north;
  let d = b + north;
  let count = 4.0 - (solid[index(a)].z + solid[index(b)].z + solid[index(c)].z + solid[index(d)].z);
  // Summing fine residuals accounts for the doubled spacing on the coarse
  // grid. Face weights keep the correction from crossing a closed buoy wall.
  let residual = fineResidual(a) + fineResidual(b) + fineResidual(c) + fineResidual(d);
  let openEast = (openFace(b, b + east) + openFace(d, d + east)) * 0.5;
  let openNorth = (openFace(c, c + north) + openFace(d, d + north)) * 0.5;
  let i = coarseIndex(cell);
  coarseCells[i] = vec4<f32>(residual, openEast, openNorth, count);
  correctionOut[i] = 0.0;
}

@compute @workgroup_size(8, 8)
fn solveCoarsePressure(@builtin(global_invocation_id) id: vec3<u32>) {
  if (any(id.xy >= vec2<u32>(coarseGrid))) { return; }
  let p = vec2<i32>(id.xy);
  let i = coarseIndex(p);
  if (reservoir(p, coarseGrid)) { correctionOut[i] = 0.0; return; }
  let a = coarseIndex(p - east);
  let b = coarseIndex(p + east);
  let c = coarseIndex(p - north);
  let d = coarseIndex(p + north);
  let state = coarseCells[i];
  let open = vec4<f32>(coarseCells[a].y, state.y, coarseCells[c].z, state.z);
  let other = vec4<f32>(correctionIn[a], correctionIn[b], correctionIn[c], correctionIn[d]);
  let neighbors = dot(open, vec4<f32>(1.0));
  let estimate = (dot(other, open) - state.x) / max(neighbors, 0.5);
  correctionOut[i] = select(0.0, mix(correctionIn[i], estimate, 0.80), neighbors > 0.0);
}

@compute @workgroup_size(8, 8)
fn addPressureCorrection(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let i = index(vec2<i32>(id.xy));
  if (solid[i].z > 0.5 || reservoir(vec2<i32>(id.xy), GRID)) { pressureOut[i] = 0.0; return; }
  let q = (vec2<f32>(id.xy) + 0.5) * 0.5 - 0.5;
  let p = vec2<i32>(floor(q));
  let a = coarseIndex(p);
  let b = coarseIndex(p + east);
  let c = coarseIndex(p + north);
  let d = coarseIndex(p + east + north);
  let f = fract(q);
  let weight = vec4<f32>((1.0-f.x)*(1.0-f.y), f.x*(1.0-f.y), (1.0-f.x)*f.y, f.x*f.y)
    * step(vec4<f32>(0.5), vec4<f32>(coarseCells[a].w, coarseCells[b].w, coarseCells[c].w, coarseCells[d].w));
  let correction = dot(weight, vec4<f32>(correctionIn[a], correctionIn[b], correctionIn[c], correctionIn[d]))
    / max(dot(weight, vec4<f32>(1.0)), 0.000001);
  pressureOut[i] = pressureIn[i] + correction;
}

@compute @workgroup_size(8, 8)
fn projectVelocity(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  let rightWall = faceWall(p, p + east, 0u);
  let topWall = faceWall(p, p + north, 1u);
  let center = pressureIn[i];
  let gradient = vec2<f32>(pressureIn[index(p + east)] - center, pressureIn[index(p + north)] - center);
  let projected = velocityIn[i] - gradient;
  velocityOut[i] = mix(projected, vec2<f32>(rightWall.x, topWall.x), vec2<f32>(rightWall.y, topWall.y));
}

@compute @workgroup_size(8, 8)
fn advectCloud(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<f32>(id.xy) + 0.5;
  let i = index(vec2<i32>(id.xy));
  if (solid[i].z > 0.5) { waterOut[i] = vec2<f32>(0.0); return; }
  let q = backtrace(p, settings.flow.x) - 0.5;
  let donors = waterDonors(vec2<i32>(floor(q)), i, settings.terrain.x > .5);
  waterOut[i] = waterBilerp(waterStencil(donors), fract(q));
}

fn exchangeWater(water: vec2<f32>, saturation: f32, growth: f32, drying: f32, dt: f32) -> vec2<f32> {
  let surplus = water.y - saturation;
  let condensed = max(0.0, surplus) * (1.0 - exp(-growth * dt));
  let evaporated = min(water.x, max(0.0, -surplus)) * (1.0 - exp(-drying * dt));
  let transferred = condensed - evaporated;
  return water + vec2<f32>(transferred, -transferred);
}

struct TerrainAirflow {
  uplift: f32,
  descent: f32,
  turbulence: f32,
  strainAxis: vec2<f32>,
}

fn terrainAirflow(p: vec2<i32>, ground: vec2<f32>, cross: vec2<f32>) -> TerrainAirflow {
  let positive = velocityIn[index(p)];
  let negative = vec2<f32>(velocityIn[index(p - east)].x, velocityIn[index(p - north)].y);
  let velocity = .5 * (positive + negative);
  let stretch = positive - negative;
  // The traceless strain tensor stores an axis modulo 180 degrees. Rotation
  // alone does not stretch a cloud, even in the center of a fast vortex.
  let strain = vec2<f32>(stretch.x - stretch.y, cross.x + cross.y);
  let magnitude = length(strain);
  let shear = smoothstep(.08, .89, magnitude);
  let spin = smoothstep(.15, 1.25, abs(cross.x - cross.y));
  let slope = .5 * vec2<f32>(terrainField[index(p + east)].x - terrainField[index(p - east)].x,
    terrainField[index(p + north)].x - terrainField[index(p - north)].x);
  let coverage = smoothstep(.65, 1.0, ground.y);
  let vertical = dot(velocity, slope) * coverage;
  let turbulence = shear * mix(.57, 1.0, spin) * smoothstep(.55, 4.2, length(velocity));
  return TerrainAirflow(smoothstep(.012, .21, vertical), smoothstep(.016, .19, -vertical),
    turbulence, strain / max(.001, magnitude));
}

fn disturbedAir(p: vec2<i32>) -> f32 {
  let positive = velocityIn[index(p)];
  let negative = vec2<f32>(velocityIn[index(p - east)].x, velocityIn[index(p - north)].y);
  let stretch = positive - negative;
  let cross = crossDerivatives(p);
  let shear = smoothstep(.055, .72, length(vec2<f32>(stretch.x - stretch.y, cross.x + cross.y)));
  let spin = smoothstep(.12, 1.12, abs(cross.x - cross.y));
  return max(shear, spin * .74);
}

fn condensationWeather(water: vec2<f32>, disturbance: f32, dt: f32) -> vec2<f32> {
  let churn = smoothstep(.045, .72, disturbance);
  let fog = settings.weather.x >= 2.0;
  // The surrounding moist air replenishes vapor. Condensation and evaporation
  // then transfer water between phases, including inside moving wakes.
  let humidity = select(.61, .77, fog);
  let supply = max(0.0, humidity - water.x - water.y) * (1.0 - exp(-dt * select(.53, 1.28, fog)));
  let saturation = select(mix(.34, .91, churn), mix(.22, .46, churn), fog);
  let growth = select(mix(1.95, .22, churn), mix(1.75, 1.34, churn), fog) * settings.terrain.w;
  let drying = select(mix(.32, 2.9, churn), mix(.38, 2.15, churn), fog);
  return exchangeWater(water + vec2<f32>(0.0, supply), saturation, growth, drying, dt);
}

fn terrainMoisture(p: vec2<i32>, uv: vec2<f32>, water: vec2<f32>, dt: f32) -> vec2<f32> {
  if (dt <= 0.0) { return water; }
  let wind = settings.flow.yw;
  let windSpeed = length(wind);
  let local = vec2<f32>(componentAt(vec2<f32>(p) + .5, 0u), componentAt(vec2<f32>(p) + .5, 1u));
  let inbound = max(vec2<f32>(0.0), select(-local, local, uv < vec2<f32>(.5)));
  let edgeDistance = min(uv, 1.0 - uv) * f32(GRID);
  let entry = (1.0 - smoothstep(vec2<f32>(1.0), vec2<f32>(3.8), edgeDistance))
    * clamp(inbound / max(windSpeed, 1.0), vec2<f32>(0.0), vec2<f32>(1.0));
  let inflow = max(entry.x, entry.y) * smoothstep(.0, 2.0, windSpeed);
  let stream = vec2<f32>(-wind.y, wind.x) / max(.001, windSpeed);
  let ribbon = smoothstep(.26, .79, .47 + .31 * sin(tau * (dot(uv, stream) * 2.3 + settings.flow.z * .09))
    + .24 * periodicNoise(uv + settings.flow.z * .027, 7.0));
  let fresh = vec2<f32>(.035 + .22 * ribbon, .40 + .45 * ribbon);
  let ground = terrainField[index(p)];
  let motion = terrainAirflow(p, ground, crossDerivatives(p));
  let uplift = motion.uplift;
  let descent = motion.descent;
  let turbulence = motion.turbulence;
  let altitudeCooling = .11 * smoothstep(.12, .85, ground.x) * smoothstep(.65, 1.0, ground.y);
  // Uplift and shear favor condensation. Descent warms the air and allows
  // a cloud carried off the ridge to thin gradually on its lee side.
  let saturation = clamp(.76 - .38 * uplift - .26 * turbulence - altitudeCooling + .24 * descent, .21, .98);
  let growth = (.085 + 1.83 * uplift + 1.08 * turbulence) * settings.terrain.w;
  let drying = (.31 + 1.36 * descent) * (1.0 - .44 * turbulence);
  let inletWeight = 1.0 - exp(-dt * inflow * 6.6);
  if (settings.weather.x >= 1.0) {
    let churn = max(turbulence, .76 * max(uplift, descent));
    let inlet = select(fresh, vec2<f32>(.40 + .08 * ribbon, .37), settings.weather.x >= 2.0);
    return mix(condensationWeather(water, churn, dt), inlet, inletWeight);
  }
  let weather = exchangeWater(water, saturation, growth, drying, dt);
  return mix(weather, fresh, inletWeight);
}

@compute @workgroup_size(8, 8)
fn correctCloud(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<f32>(id.xy) + 0.5;
  let i = index(vec2<i32>(id.xy));
  if (solid[i].z > 0.5) { waterOut[i] = vec2<f32>(0.0); return; }
  // Limit each phase to its donor range when correcting diffusion.
  let dt = settings.flow.x;
  let terrain = settings.terrain.x > .5;
  let forward = backtrace(p, -dt) - 0.5;
  let backward = backtrace(p, dt) - 0.5;
  let reverse = waterDonors(vec2<i32>(floor(forward)), i, terrain);
  let forwardWater = mat4x2<f32>(waterForward[reverse.x], waterForward[reverse.y],
    waterForward[reverse.z], waterForward[reverse.w]);
  let reversed = waterBilerp(forwardWater, fract(forward));
  let donor = waterStencil(waterDonors(vec2<i32>(floor(backward)), i, terrain));
  let lo = min(min(donor[0], donor[1]), min(donor[2], donor[3]));
  let hi = max(max(donor[0], donor[1]), max(donor[2], donor[3]));
  let water = clamp(waterForward[i] + 0.5 * (waterIn[i] - reversed), lo, hi);
  let uv = p / f32(GRID);
  if (terrain) {
    waterOut[i] = terrainMoisture(vec2<i32>(id.xy), uv, water, dt);
    return;
  }
  if (settings.weather.x >= 1.0) {
    waterOut[i] = condensationWeather(water, disturbedAir(vec2<i32>(id.xy)), dt);
    return;
  }
  let inflow = 0.12 + 0.88 * pow(0.5 + 0.5 * cos(tau * (uv.x - 0.11)), 10.0);
  let inflowMoisture = cloudSeed(uv + vec2<f32>(0.0, sin(settings.flow.z * 0.14) * 0.10));
  let cloud = clamp(mix(water.x * (1.0 - dt * 0.018), inflowMoisture, dt * inflow * 0.18), 0.0, 1.0);
  waterOut[i] = vec2<f32>(cloud, 0.0);
}

fn eddyMixing(p: vec2<i32>) -> f32 {
  let wrapped = vec2<i32>(vec2<u32>(p) & vec2<u32>(GRID - 1u));
  return smoothstep(0.068, 0.56, abs(textureLoad(cloudMaterialIn, wrapped, 0).w));
}

@compute @workgroup_size(8, 8)
fn mixWakeMoisture(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  if (solid[i].z > 0.5) { waterOut[i] = vec2<f32>(0.0); return; }
  let moisture = waterIn[i];
  let dt = settings.flow.x;
  if (dt <= 0.0) { waterOut[i] = moisture; return; }

  // Each open face trades the same amount of moisture in both directions.
  // Use the preceding step's transported curl to include recent eddies.
  let stir = eddyMixing(p);
  let neighbors = array<vec2<i32>, 4>(p + east, p - east, p + north, p - north);
  let terrain = settings.terrain.x > .5;
  var exchange = vec2<f32>(0.0);
  for (var k = 0u; k < 4u; k++) {
    let q = neighbors[k];
    if (terrain && any(clamp(q, vec2<i32>(0), vec2<i32>(i32(GRID) - 1)) != q)) { continue; }
    let j = index(q);
    if (solid[j].z > 0.5) { continue; }
    let mixing = max(stir, eddyMixing(q));
    exchange += (waterIn[j] - moisture) * mixing;
  }
  // Four face weights sum to at most one, even at larger time steps.
  let rate = min(0.24, dt * 9.5);
  waterOut[i] = moisture + rate * exchange;
}

@compute @workgroup_size(8, 8)
fn resetCloudMaterial(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  textureStore(cloudMaterialOut, p, vec4<f32>(waterIn[index(p)].x, 0.0, 0.0, 0.0));
  textureStore(cloudDetailOut, p, vec4<f32>(0.0));
}

// Lift and crest growth use the same air motion that drives condensation.
// Transporting both lets a bank keep its shape after leaving a ridge.
fn transportLoft(motion: TerrainAirflow, history: vec2<f32>, water: f32, dt: f32) -> vec2<f32> {
  let support = smoothstep(.035, .34, water);
  let clearAir = 1.0 - support;
  let height = history.x * exp(-dt * (.56 + 1.24 * motion.descent + 2.0 * clearAir))
    + dt * (.94 * motion.uplift - .52 * motion.descent) * support;
  let crest = history.y * exp(-dt * (.95 + .95 * motion.descent + 2.3 * clearAir))
    + dt * (1.25 * motion.uplift + .88 * motion.turbulence) * support;
  return vec2<f32>(clamp(height, TERRAIN_LOFT_MIN, TERRAIN_LOFT_MAX), clamp(crest, 0.0, TERRAIN_BILLOW_MAX));
}

fn transportWakeStrain(motion: TerrainAirflow, history: vec2<f32>, curl: f32, water: f32, dt: f32) -> vec2<f32> {
  let support = smoothstep(.035, .28, water);
  // The tensor axis turns twice as fast as the fluid angle. Curl is twice
  // the angular speed, so it can rotate the two coefficients directly.
  let angle = curl * dt;
  let rotated = history * cos(angle) + vec2<f32>(-history.y, history.x) * sin(angle);
  let fresh = motion.strainAxis * motion.turbulence * support;
  let retained = exp(-dt * 1.45);
  return mix(fresh, rotated, retained) * exp(-dt * 1.8 * (1.0 - support));
}

@compute @workgroup_size(8, 8)
fn transportCloudMaterial(@builtin(global_invocation_id) id: vec3<u32>) {
  if (!inGrid(id)) { return; }
  let p = vec2<i32>(id.xy);
  let i = index(p);
  let terrain = settings.terrain.x > .5;
  if (solid[i].z > 0.5) {
    textureStore(cloudMaterialOut, p, vec4<f32>(0.0));
    if (terrain) { textureStore(cloudDetailOut, p, vec4<f32>(0.0)); }
    return;
  }
  let center = vec2<f32>(p) + 0.5;
  let dt = settings.flow.x;
  let donor = backtrace(center, dt);
  let uv = donor / f32(GRID);
  let halfTexel = vec2<f32>(.5 / f32(GRID));
  let historyUV = select(uv, clamp(uv, halfTexel, 1.0 - halfTexel), terrain);
  let history = textureSampleLevel(cloudMaterialIn, materialSampler, historyUV, 0.0);
  var detail = vec4<f32>(history.yz, 0.0, 0.0);
  if (terrain) { detail = textureSampleLevel(cloudDetailIn, materialSampler, historyUV, 0.0); }
  // Transport texture coordinates relative to the bulk wind. Relaxing the
  // offset lets stretched detail blend back into the inflow over time.
  let relativeStep = (donor - center + dt * settings.flow.yw) * (DOMAIN / f32(GRID));
  let offset = (detail.xy + relativeStep) * exp(-dt * 0.46);
  let limitedOffset = offset * min(1.0, 1.85 / max(length(offset), 0.0001));

  let cross = crossDerivatives(p);
  let curl = cross.x - cross.y;
  let spin = curl / (abs(curl) + 1.15);
  let smoothedSpin = mix(spin, history.w, select(0.0, exp(-dt * 14.0), dt > 0.0));
  let water = waterIn[i].x;
  if (terrain) {
    let motion = terrainAirflow(p, terrainField[i], cross);
    let strain = transportWakeStrain(motion, detail.zw, curl, water, dt);
    textureStore(cloudDetailOut, p, vec4<f32>(limitedOffset, strain));
    textureStore(cloudMaterialOut, p, vec4<f32>(water, transportLoft(motion, history.yz, water, dt), smoothedSpin));
  } else {
    textureStore(cloudMaterialOut, p, vec4<f32>(water, limitedOffset, smoothedSpin));
  }
}
