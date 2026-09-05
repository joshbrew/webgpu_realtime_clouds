const PI: f32 = 3.141592653589793;

struct Params {
  angularCells: u32,
  radialCells: u32,
  visibleFaceMask: u32,
  maxVertices: u32,

  planetRadius: f32,
  cloudBottom: f32,
  cloudTop: f32,
  coverageThreshold: f32,

  heightScale: f32,
  minThickness: f32,
  maxThickness: f32,
  bulgeStrength: f32,

  cavityStrength: f32,
  lowPush: f32,
  curlPush: f32,
  detailPush: f32,

  weatherTime: f32,
  shapeTime: f32,
  detailTime: f32,
  normalEpsilon: f32,

  camPos: vec3<f32>,
  tanHalfFovY: f32,
  camRight: vec3<f32>,
  aspect: f32,
  camUp: vec3<f32>,
  frustumGuard: f32,
  camFwd: vec3<f32>,
  horizonGuard: f32,

  weatherScale: vec2<f32>,
  shapeScale: vec2<f32>,
  detailScale: vec2<f32>,
  fieldBlend: f32,
  previousFieldValid: u32,
  maxActiveCells: u32,
  projectionStrength: f32,
  projectionMaxStep: f32,
  occlusionRadiusScale: f32,
  previousFieldFaceMask: u32,
  tileCells: u32,
  tilesPerAxis: u32,
  totalTiles: u32,
  tileHistoryValid: u32,
  isoHysteresis: f32,
  tileCoverageGuard: f32,
  tileFrustumGuard: f32,
  tileHorizonGuard: f32,
  tileRadialGuard: f32,
  useTileCulling: u32,
  historyCount: u32,
  voxelPersistenceBand: f32,
  voxelHistoryWeight: f32,
  _padding0: f32,
  _padding1: f32,
}

struct CubeVals {
  v0: f32,
  v1: f32,
  v2: f32,
  v3: f32,
  v4: f32,
  v5: f32,
  v6: f32,
  v7: f32,
}

struct FaceTests {
  sum: i32,
  f0: i32,
  f1: i32,
  f2: i32,
  f3: i32,
  f4: i32,
  f5: i32,
}

struct PatternInfo {
  pcase: u32,
  reverse: bool,
}

@group(0) @binding(0) var weatherTex: texture_2d_array<f32>;
@group(0) @binding(1) var shapeTex: texture_2d_array<f32>;
@group(0) @binding(2) var detailTex: texture_2d_array<f32>;
@group(0) @binding(3) var linearSampler: sampler;
@group(0) @binding(4) var<storage, read> table: array<u32>;
@group(0) @binding(5) var<storage, read_write> outPositions: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> outNormals: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> outCounter: atomic<u32>;
@group(0) @binding(8) var<uniform> params: Params;
@group(0) @binding(9) var<storage, read_write> outIndirect: array<u32>;
@group(0) @binding(10) var<storage, read> previousField: array<f32>;
@group(0) @binding(11) var<storage, read_write> currentField: array<f32>;
@group(0) @binding(12) var<storage, read_write> activeCells: array<u32>;
@group(0) @binding(13) var<storage, read_write> activeCounter: atomic<u32>;
@group(0) @binding(14) var<storage, read_write> extractDispatch: array<u32>;
@group(0) @binding(15) var<storage, read_write> statusFlags: array<atomic<u32>>;
@group(0) @binding(16) var<storage, read_write> projectionDispatch: array<u32>;
@group(0) @binding(17) var<storage, read_write> currentTileFlags: array<u32>;
@group(0) @binding(18) var<storage, read> previousTileFlags: array<u32>;
@group(0) @binding(19) var<storage, read> olderField: array<f32>;

fn saturate(v: f32) -> f32 {
  return clamp(v, 0.0, 1.0);
}

fn wrap_uv(uv: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(fract(uv.x), clamp(uv.y, 0.001, 0.999));
}

fn cube_face_direction(face: u32, uv: vec2<f32>) -> vec3<f32> {
  let p = uv * 2.0 - vec2<f32>(1.0);
  switch face {
    case 0u: { return normalize(vec3<f32>(1.0, p.y, -p.x)); }
    case 1u: { return normalize(vec3<f32>(-1.0, p.y, p.x)); }
    case 2u: { return normalize(vec3<f32>(p.x, 1.0, -p.y)); }
    case 3u: { return normalize(vec3<f32>(p.x, -1.0, p.y)); }
    case 4u: { return normalize(vec3<f32>(p.x, p.y, 1.0)); }
    default: { return normalize(vec3<f32>(-p.x, p.y, -1.0)); }
  }
}

fn direction_to_uv(dir: vec3<f32>) -> vec2<f32> {
  let lon = atan2(dir.z, dir.x);
  let lat = asin(clamp(dir.y, -1.0, 1.0));
  return vec2<f32>(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
}

fn sample_weather(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(weatherTex, linearSampler, wrap_uv(uv), 0, 0.0);
}

fn sample_shape(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(shapeTex, linearSampler, wrap_uv(uv), 0, 0.0);
}

fn sample_detail(uv: vec2<f32>) -> vec4<f32> {
  return textureSampleLevel(detailTex, linearSampler, wrap_uv(uv), 0, 0.0);
}

fn smooth_min_field(a: f32, b: f32, softness: f32) -> f32 {
  let k = max(softness, 1e-4);
  let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

fn smooth_max_field(a: f32, b: f32, softness: f32) -> f32 {
  return -smooth_min_field(-a, -b, softness);
}

fn cloud_blob_field(
  radius: f32,
  macroMask: f32,
  seedValue: f32,
  centerSignal: f32,
  radiusSignal: f32
) -> f32 {
  let occupancy = saturate(macroMask * seedValue);
  let edge = smoothstep(params.coverageThreshold - 0.05, params.coverageThreshold + 0.12, occupancy);
  let centerRange = max(params.cloudTop - params.cloudBottom, 0.25);
  let centerRadius = params.planetRadius + params.cloudBottom +
    centerRange * clamp(0.18 + centerSignal * 0.64, 0.12, 0.88);
  let baseRadius = mix(params.minThickness * 0.72, params.maxThickness * 0.92, radiusSignal);
  let blobRadius = (baseRadius + params.bulgeStrength * 0.42 * radiusSignal) *
    mix(0.22, 1.0, pow(max(edge, 1e-4), 0.58));
  let radialSdf = abs(radius - centerRadius) - blobRadius;
  let lateralSdf = (params.coverageThreshold - occupancy) * max(params.maxThickness * 1.35, 1.0);
  return smooth_max_field(radialSdf, lateralSdf, max(0.08, blobRadius * 0.22));
}

fn scalar_field_world(pos: vec3<f32>) -> f32 {
  let radius = length(pos);
  let dir = pos / max(radius, 1e-6);
  let uv = direction_to_uv(dir);

  let weatherUv = uv * params.weatherScale + vec2<f32>(params.weatherTime, params.weatherTime * 0.11);
  let shapeUv = uv * params.shapeScale + vec2<f32>(params.shapeTime, -params.shapeTime * 0.07);
  let weather = sample_weather(weatherUv);
  let shapeA = sample_shape(shapeUv);
  let shapeB = sample_shape(shapeUv * 1.31 + vec2<f32>(0.173, 0.419));
  let shapeC = sample_shape(shapeUv * 1.73 + vec2<f32>(0.619, 0.237));

  let weatherField = saturate(weather.r * 0.62 + weather.g * 0.38);
  let macroMask = smoothstep(0.27, 0.72, weatherField);

  let seedA = smoothstep(0.42, 0.80, saturate(shapeA.r * 0.68 + weather.b * 0.32));
  let seedB = smoothstep(0.46, 0.82, saturate(shapeB.r * 0.74 + weather.g * 0.26));
  let seedC = smoothstep(0.48, 0.84, saturate(shapeC.r * 0.72 + weather.b * 0.28));

  let centerA = saturate(shapeA.r * 0.70 + weather.g * 0.30);
  let centerB = saturate(shapeB.r * 0.66 + weather.b * 0.34);
  let centerC = saturate(shapeC.r * 0.68 + weather.g * 0.32);

  let radiusA = smoothstep(0.34, 0.86, saturate(seedA * 0.76 + weather.b * 0.24));
  let radiusB = smoothstep(0.36, 0.88, saturate(seedB * 0.72 + shapeA.r * 0.28));
  let radiusC = smoothstep(0.38, 0.90, saturate(seedC * 0.74 + shapeB.r * 0.26));

  let blobA = cloud_blob_field(radius, macroMask, seedA, centerA, radiusA);
  let blobB = cloud_blob_field(radius, macroMask, seedB, centerB, radiusB);
  let blobC = cloud_blob_field(radius, macroMask, seedC, centerC, radiusC);

  let unionAB = smooth_min_field(blobA, blobB, max(0.16, params.minThickness * 0.32));
  return smooth_min_field(unionAB, blobC, max(0.16, params.minThickness * 0.32));
}
fn param_to_world(face: u32, gridPos: vec3<f32>) -> vec3<f32> {
  let angular = max(f32(params.angularCells), 1.0);
  let radial = max(f32(params.radialCells), 1.0);
  let uv = gridPos.xy / angular;
  let depth = clamp(gridPos.z / radial, 0.0, 1.0);
  let dir = cube_face_direction(face, uv);
  let shellRadius = mix(shell_radial_minimum(), shell_radial_maximum(), depth);
  return dir * shellRadius;
}

fn points_per_face() -> u32 {
  let angularPoints = params.angularCells + 1u;
  return angularPoints * angularPoints * (params.radialCells + 1u);
}

fn shell_radial_minimum() -> f32 {
  let lowerMargin = max(params.maxThickness * 1.35 + params.bulgeStrength * 0.55, params.maxThickness + 0.75);
  return params.planetRadius + params.cloudBottom - lowerMargin;
}

fn shell_radial_maximum() -> f32 {
  let upperMargin = max(params.maxThickness * 1.20 + params.bulgeStrength * 1.10, params.maxThickness + params.bulgeStrength + 0.75);
  return params.planetRadius + params.cloudTop + upperMargin;
}

fn field_index(face: u32, point: vec3<u32>) -> u32 {
  let angularPoints = params.angularCells + 1u;
  return face * points_per_face() +
    point.z * angularPoints * angularPoints +
    point.y * angularPoints +
    point.x;
}

fn load_cube_values(face: u32, cell: vec3<u32>) -> CubeVals {
  var values = CubeVals(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  for (var corner = 0u; corner < 8u; corner += 1u) {
    let value = currentField[field_index(face, cell + corner_offset(corner))];
    switch corner {
      case 0u: { values.v0 = value; }
      case 1u: { values.v1 = value; }
      case 2u: { values.v2 = value; }
      case 3u: { values.v3 = value; }
      case 4u: { values.v4 = value; }
      case 5u: { values.v5 = value; }
      case 6u: { values.v6 = value; }
      default: { values.v7 = value; }
    }
  }
  return values;
}

fn cube_index(values: CubeVals) -> u32 {
  var index = 0u;
  for (var corner = 0u; corner < 8u; corner += 1u) {
    if (getv(values, corner) < 0.0) {
      index |= corner_bit(corner);
    }
  }
  return index;
}

fn pack_cell(face: u32, cell: vec3<u32>) -> u32 {
  return (cell.x & 0xffu) |
    ((cell.y & 0xffu) << 8u) |
    ((cell.z & 0x3fu) << 16u) |
    ((face & 0x7u) << 22u);
}

fn unpack_cell(packed: u32) -> vec4<u32> {
  return vec4<u32>(
    packed & 0xffu,
    (packed >> 8u) & 0xffu,
    (packed >> 16u) & 0x3fu,
    (packed >> 22u) & 0x7u
  );
}

fn nth_visible_face(mask: u32, ordinal: u32) -> u32 {
  var seen = 0u;
  for (var face = 0u; face < 6u; face += 1u) {
    if ((mask & (1u << face)) != 0u) {
      if (seen == ordinal) {
        return face;
      }
      seen += 1u;
    }
  }
  return 0u;
}

fn tiles_per_face() -> u32 {
  return params.tilesPerAxis * params.tilesPerAxis;
}

fn tile_index(face: u32, tile: vec2<u32>) -> u32 {
  return face * tiles_per_face() + tile.y * params.tilesPerAxis + tile.x;
}

fn cell_tile(cell: vec2<u32>) -> vec2<u32> {
  let tileSize = max(params.tileCells, 1u);
  return min(cell / tileSize, vec2<u32>(params.tilesPerAxis - 1u));
}

fn tile_flag_value(flagsIndex: u32, usePrevious: bool) -> u32 {
  if (usePrevious) {
    return previousTileFlags[flagsIndex];
  }
  return currentTileFlags[flagsIndex];
}

fn tile_is_active(flag: u32) -> bool {
  return (flag & 1u) != 0u;
}

fn tile_min_radial_cell(flag: u32) -> u32 {
  return (flag >> 1u) & 0x7fu;
}

fn tile_max_radial_cell(flag: u32) -> u32 {
  return (flag >> 8u) & 0x7fu;
}

fn pack_tile_range(minCell: u32, maxCell: u32) -> u32 {
  return 1u | ((minCell & 0x7fu) << 1u) | ((maxCell & 0x7fu) << 8u);
}

fn point_has_active_tile(face: u32, point: vec2<u32>, radialPoint: u32, usePrevious: bool) -> bool {
  if (params.useTileCulling == 0u) {
    return true;
  }
  if (params.tilesPerAxis == 0u || params.tileCells == 0u) {
    return false;
  }

  for (var oy = 0u; oy < 2u; oy += 1u) {
    for (var ox = 0u; ox < 2u; ox += 1u) {
      if (point.x == 0u && ox == 0u) {
        continue;
      }
      if (point.y == 0u && oy == 0u) {
        continue;
      }
      let cellX = select(point.x, point.x - 1u, ox == 0u);
      let cellY = select(point.y, point.y - 1u, oy == 0u);
      if (cellX >= params.angularCells || cellY >= params.angularCells) {
        continue;
      }
      let tile = cell_tile(vec2<u32>(cellX, cellY));
      let flag = tile_flag_value(tile_index(face, tile), usePrevious);
      if (
        tile_is_active(flag) &&
        radialPoint >= tile_min_radial_cell(flag) &&
        radialPoint <= tile_max_radial_cell(flag) + 1u
      ) {
        return true;
      }
    }
  }
  return false;
}

fn tile_sample_surface(face: u32, gridXY: vec2<f32>) -> vec3<f32> {
  let uvFace = clamp(gridXY / max(f32(params.angularCells), 1.0), vec2<f32>(0.0), vec2<f32>(1.0));
  let direction = cube_face_direction(face, uvFace);
  let uv = direction_to_uv(direction);
  let weatherUv = uv * params.weatherScale + vec2<f32>(params.weatherTime, params.weatherTime * 0.11);
  let shapeUv = uv * params.shapeScale + vec2<f32>(params.shapeTime, -params.shapeTime * 0.07);
  let weather = sample_weather(weatherUv);
  let shape = sample_shape(shapeUv);
  let weatherField = saturate(weather.r * 0.72 + weather.g * 0.28);
  let shapeField = saturate(shape.r);
  let coverage = saturate(weatherField * 0.70 + shapeField * 0.30 - 0.03 + weather.b * 0.04);
  let edgeBody = smoothstep(params.coverageThreshold, 1.0, coverage);
  let coreBody = smoothstep(params.coverageThreshold + 0.06, 1.0, coverage);
  let heightMix = saturate((0.18 + shapeField * 0.82) * params.heightScale);
  let broadHeight = mix(params.cloudBottom, params.cloudTop, heightMix);
  let bulb = params.bulgeStrength * edgeBody * edgeBody * (0.46 + 0.34 * weather.g + 0.20 * weather.b) + params.bulgeStrength * 0.48 * weather.b * mix(0.5, 1.0, coreBody);
  let outerRadius = params.planetRadius + broadHeight + bulb;
  let thickness = mix(params.minThickness * 0.72, params.maxThickness * 0.90, saturate(weather.g * 0.56 + weather.b * 0.44));
  let innerRadius = outerRadius - thickness * pow(max(edgeBody, 1e-4), 0.84);
  return vec3<f32>(coverage, innerRadius, outerRadius);
}

fn point_is_visible_world(point: vec3<f32>, frustumGuard: f32, horizonGuard: f32) -> bool {
  let pointDir = normalize(point);
  let camDir = normalize(params.camPos);
  if (dot(pointDir, camDir) < horizonGuard) {
    return false;
  }

  let occlusionRadius = params.planetRadius * clamp(params.occlusionRadiusScale, 0.90, 1.08);
  if (segment_hits_planet(params.camPos, point, occlusionRadius)) {
    return false;
  }

  let rel = point - params.camPos;
  let vz = dot(rel, params.camFwd);
  if (vz <= 0.0) {
    return false;
  }
  let nx = abs(dot(rel, params.camRight)) / max(vz * params.tanHalfFovY * params.aspect, 1e-5);
  let ny = abs(dot(rel, params.camUp)) / max(vz * params.tanHalfFovY, 1e-5);
  return nx <= frustumGuard && ny <= frustumGuard;
}

fn cell_may_contain_cloud(face: u32, cell: vec3<u32>) -> bool {
  let centerGrid = vec3<f32>(cell) + vec3<f32>(0.5);
  let centerWorld = param_to_world(face, centerGrid);
  let uv = direction_to_uv(normalize(centerWorld));
  let weatherUv = uv * params.weatherScale + vec2<f32>(params.weatherTime, params.weatherTime * 0.11);
  let shapeUv = uv * params.shapeScale + vec2<f32>(params.shapeTime, -params.shapeTime * 0.07);
  let weather = sample_weather(weatherUv);
  let shape = sample_shape(shapeUv);
  let weatherField = saturate(weather.r * 0.60 + weather.g * 0.40);
  let shapeField = saturate(shape.r);
  let macroMask = smoothstep(0.40, 0.74, weatherField);
  let lobeField = smoothstep(0.28, 0.72, saturate(weather.b * 0.62 + shapeField * 0.38));
  let coverage = saturate(macroMask * mix(0.18, 1.0, lobeField) * mix(0.44, 1.0, shapeField) - 0.08);
  return coverage >= params.coverageThreshold - 0.06;
}

fn segment_hits_planet(ro: vec3<f32>, point: vec3<f32>, radius: f32) -> bool {
  let segment = point - ro;
  let segmentLength = length(segment);
  let direction = segment / max(segmentLength, 1e-6);
  let b = dot(ro, direction);
  let c = dot(ro, ro) - radius * radius;
  let discriminant = b * b - c;
  if (discriminant <= 0.0) {
    return false;
  }
  let nearest = -b - sqrt(discriminant);
  return nearest > 0.0 && nearest < segmentLength - 0.02;
}

fn cell_is_visible(face: u32, cell: vec3<u32>) -> bool {
  let centerGrid = vec3<f32>(cell) + vec3<f32>(0.5);
  let centerWorld = param_to_world(face, centerGrid);
  let pointDir = normalize(centerWorld);
  let cameraDir = normalize(params.camPos);
  if (dot(pointDir, cameraDir) < -0.34) {
    return false;
  }

  let rel = centerWorld - params.camPos;
  let viewDepth = dot(rel, params.camFwd);
  if (viewDepth <= 0.0) {
    return false;
  }
  let nx = abs(dot(rel, params.camRight)) / max(viewDepth * params.tanHalfFovY * params.aspect, 1e-5);
  let ny = abs(dot(rel, params.camUp)) / max(viewDepth * params.tanHalfFovY, 1e-5);
  return nx <= params.frustumGuard + 0.38 && ny <= params.frustumGuard + 0.38;
}

fn signbit(v: f32) -> bool {
  return v < 0.0;
}

fn corner_offset(c: u32) -> vec3<u32> {
  switch c {
    case 0u: { return vec3<u32>(0u, 0u, 0u); }
    case 1u: { return vec3<u32>(0u, 1u, 0u); }
    case 2u: { return vec3<u32>(0u, 1u, 1u); }
    case 3u: { return vec3<u32>(0u, 0u, 1u); }
    case 4u: { return vec3<u32>(1u, 0u, 0u); }
    case 5u: { return vec3<u32>(1u, 1u, 0u); }
    case 6u: { return vec3<u32>(1u, 1u, 1u); }
    default: { return vec3<u32>(1u, 0u, 1u); }
  }
}

fn corner_bit(c: u32) -> u32 {
  switch c {
    case 0u: { return 0x80u; }
    case 1u: { return 0x40u; }
    case 2u: { return 0x20u; }
    case 3u: { return 0x10u; }
    case 4u: { return 0x08u; }
    case 5u: { return 0x04u; }
    case 6u: { return 0x02u; }
    default: { return 0x01u; }
  }
}

fn edge_corner_a(edge: u32) -> u32 {
  switch edge {
    case 0u: { return 0u; }
    case 1u: { return 1u; }
    case 2u: { return 2u; }
    case 3u: { return 3u; }
    case 4u: { return 4u; }
    case 5u: { return 5u; }
    case 6u: { return 6u; }
    case 7u: { return 7u; }
    case 8u: { return 0u; }
    case 9u: { return 1u; }
    case 10u: { return 2u; }
    default: { return 3u; }
  }
}

fn edge_corner_b(edge: u32) -> u32 {
  switch edge {
    case 0u: { return 1u; }
    case 1u: { return 2u; }
    case 2u: { return 3u; }
    case 3u: { return 0u; }
    case 4u: { return 5u; }
    case 5u: { return 6u; }
    case 6u: { return 7u; }
    case 7u: { return 4u; }
    case 8u: { return 4u; }
    case 9u: { return 5u; }
    case 10u: { return 6u; }
    default: { return 7u; }
  }
}

fn getv(v: CubeVals, i: u32) -> f32 {
  switch i {
    case 0u: { return v.v0; }
    case 1u: { return v.v1; }
    case 2u: { return v.v2; }
    case 3u: { return v.v3; }
    case 4u: { return v.v4; }
    case 5u: { return v.v5; }
    case 6u: { return v.v6; }
    default: { return v.v7; }
  }
}

fn face_test1(face: u32, v: CubeVals) -> u32 {
  switch face {
    case 0u: { return select(0x84u, 0x48u, v.v0 * v.v5 < v.v1 * v.v4); }
    case 1u: { return select(0x42u, 0x24u, v.v1 * v.v6 < v.v2 * v.v5); }
    case 2u: { return select(0x12u, 0x21u, v.v3 * v.v6 < v.v2 * v.v7); }
    case 3u: { return select(0x81u, 0x18u, v.v0 * v.v7 < v.v3 * v.v4); }
    case 4u: { return select(0xA0u, 0x50u, v.v0 * v.v2 < v.v1 * v.v3); }
    default: { return select(0x0Au, 0x05u, v.v4 * v.v6 < v.v5 * v.v7); }
  }
}

fn face_tests(i: u32, v: CubeVals) -> FaceTests {
  var f0 = 0i;
  var f1 = 0i;
  var f2 = 0i;
  var f3 = 0i;
  var f4 = 0i;
  var f5 = 0i;

  if ((i & 0x80u) != 0u) {
    if ((i & 0xCCu) == 0x84u) { f0 = select(1i, -1i, v.v0 * v.v5 < v.v1 * v.v4); }
    if ((i & 0x99u) == 0x81u) { f3 = select(1i, -1i, v.v0 * v.v7 < v.v3 * v.v4); }
    if ((i & 0xF0u) == 0xA0u) { f4 = select(1i, -1i, v.v0 * v.v2 < v.v1 * v.v3); }
  } else {
    if ((i & 0xCCu) == 0x48u) { f0 = select(-1i, 1i, v.v0 * v.v5 < v.v1 * v.v4); }
    if ((i & 0x99u) == 0x18u) { f3 = select(-1i, 1i, v.v0 * v.v7 < v.v3 * v.v4); }
    if ((i & 0xF0u) == 0x50u) { f4 = select(-1i, 1i, v.v0 * v.v2 < v.v1 * v.v3); }
  }

  if ((i & 0x02u) != 0u) {
    if ((i & 0x66u) == 0x42u) { f1 = select(1i, -1i, v.v1 * v.v6 < v.v2 * v.v5); }
    if ((i & 0x33u) == 0x12u) { f2 = select(1i, -1i, v.v3 * v.v6 < v.v2 * v.v7); }
    if ((i & 0x0Fu) == 0x0Au) { f5 = select(1i, -1i, v.v4 * v.v6 < v.v5 * v.v7); }
  } else {
    if ((i & 0x66u) == 0x24u) { f1 = select(-1i, 1i, v.v1 * v.v6 < v.v2 * v.v5); }
    if ((i & 0x33u) == 0x21u) { f2 = select(-1i, 1i, v.v3 * v.v6 < v.v2 * v.v7); }
    if ((i & 0x0Fu) == 0x05u) { f5 = select(-1i, 1i, v.v4 * v.v6 < v.v5 * v.v7); }
  }

  return FaceTests(f0 + f1 + f2 + f3 + f4 + f5, f0, f1, f2, f3, f4, f5);
}

fn interior_test(i: u32, flag13: u32, v: CubeVals) -> u32 {
  let tiny = 1e-9;
  let At = v.v4 - v.v0;
  let Bt = v.v5 - v.v1;
  let Ct = v.v6 - v.v2;
  let Dt = v.v7 - v.v3;
  let denom = At * Ct - Bt * Dt;

  if (signbit(denom)) {
    if ((i & 1u) != 0u) {
      return 0u;
    }
  } else if (((i & 1u) == 0u) || abs(denom) < tiny) {
    return 0u;
  }

  let t = 0.5 * (v.v3 * Bt + v.v1 * Dt - v.v2 * At - v.v0 * Ct) / denom;
  if (t <= tiny || t >= 1.0 - tiny) {
    return 0u;
  }

  let a = v.v0 + At * t;
  let b = v.v1 + Bt * t;
  let c = v.v2 + Ct * t;
  let d = v.v3 + Dt * t;
  let ac = c * a;
  let bd = d * b;

  if ((i & 1u) != 0u) {
    if (ac < bd && !signbit(bd)) {
      return select(0u, 1u, signbit(b) == signbit(getv(v, i))) + flag13;
    }
  } else if (ac > bd && !signbit(ac)) {
    return select(0u, 1u, signbit(a) == signbit(getv(v, i))) + flag13;
  }

  return 0u;
}

fn pattern_info(cubeIdx: u32, v: CubeVals) -> PatternInfo {
  let inverted = (cubeIdx & 0x80u) != 0u;
  let li = select(cubeIdx, cubeIdx ^ 0xFFu, inverted);
  let e0 = table[li];
  let reverseBit = (e0 & 0x800u) != 0u;
  let m = select(reverseBit, !reverseBit, inverted);
  let activeIndex = select(cubeIdx ^ 0xFFu, cubeIdx, m);
  let k = e0 & 0x7FFu;
  let caseId = e0 >> 12u;
  var pcase = 0u;

  switch caseId {
    case 0u: {
      pcase = k;
    }
    case 1u: {
      if ((activeIndex & face_test1(k >> 2u, v)) != 0u) {
        pcase = 183u + (k << 1u);
      } else {
        pcase = 159u + k;
      }
    }
    case 2u: {
      if (interior_test(k, 0u, v) != 0u) {
        pcase = 239u + 6u * k;
      } else {
        pcase = 231u + (k << 1u);
      }
    }
    case 3u: {
      if ((activeIndex & face_test1(k % 6u, v)) != 0u) {
        pcase = 575u + 5u * k;
      } else if (interior_test(k / 6u, 0u, v) != 0u) {
        pcase = 407u + 7u * k;
      } else {
        pcase = 335u + 3u * k;
      }
    }
    case 4u: {
      let ft = face_tests(activeIndex, v);
      if (ft.sum == -3i) {
        pcase = 695u + 3u * k;
      } else if (ft.sum == -1i) {
        if (ft.f4 + ft.f5 < 0i) {
          pcase = select(799u, 759u, ft.f0 + ft.f2 < 0i) + 5u * k;
        } else {
          pcase = 719u + 5u * k;
        }
      } else if (ft.sum == 1i) {
        if (ft.f4 + ft.f5 < 0i) {
          pcase = 983u + 9u * k;
        } else {
          pcase = select(911u, 839u, ft.f0 + ft.f2 < 0i) + 9u * k;
        }
      } else if (interior_test(k >> 1u, 0u, v) != 0u) {
        pcase = 1095u + 9u * k;
      } else {
        pcase = 1055u + 5u * k;
      }
    }
    case 5u: {
      let ft = face_tests(activeIndex, v);
      if (ft.sum == -2i) {
        var cond = false;
        if ((k & 2u) != 0u) {
          cond = interior_test(0u, 0u, v) != 0u;
        } else {
          cond = (interior_test(0u, 0u, v) != 0u) || (interior_test(select(3u, 1u, k != 0u), 0u, v) != 0u);
        }
        pcase = select(1189u + (k << 2u), 1213u + (k << 3u), cond);
      } else if (ft.sum == 0i) {
        pcase = select(1285u, 1261u, get_face_result(ft, 2u + k) < 0i) + (k << 3u);
      } else {
        var cond = false;
        if ((k & 2u) != 0u) {
          cond = interior_test(1u, 0u, v) != 0u;
        } else {
          cond = (interior_test(2u, 0u, v) != 0u) || (interior_test(select(1u, 3u, k != 0u), 0u, v) != 0u);
        }
        pcase = select(1201u + (k << 2u), 1237u + (k << 3u), cond);
      }
    }
    case 6u: {
      let ft = face_tests(activeIndex, v);
      if (ft.sum == -2i) {
        let arg = (0xDA010Cu >> (k << 1u)) & 3u;
        pcase = select(1357u + (k << 2u), 1453u + (k << 3u), interior_test(arg, 0u, v) != 0u);
      } else if (ft.sum == 0i) {
        pcase = select(1741u, 1645u, get_face_result(ft, k >> 1u) < 0i) + (k << 3u);
      } else {
        let arg = (0xA7B7E5u >> (k << 1u)) & 3u;
        pcase = select(1405u + (k << 2u), 1549u + (k << 3u), interior_test(arg, 0u, v) != 0u);
      }
    }
    default: {
      let ft = face_tests(activeIndex, v);
      let ftAbs = abs(ft.sum);
      if (ftAbs == 0i) {
        let kk = select(0u, 2u, ft.f1 < 0i) | select(0u, 1u, ft.f5 < 0i);
        if (ft.f0 * ft.f1 == ft.f5) {
          pcase = 2157u + 12u * kk;
        } else {
          let c = interior_test(kk, 1u, v);
          if (c != 0u) {
            pcase = u32(2285i + 10i * i32(kk) - 40i * i32(c));
          } else {
            pcase = 2285u + 6u * kk;
          }
        }
      } else if (ftAbs == 2i) {
        var idx = 0u;
        if (ft.f0 < 0i) {
          idx += select(0u, 1u, ft.f2 > 0i);
        } else {
          idx += 12u + select(0u, 1u, ft.f2 < 0i);
        }

        if (ft.f1 < 0i) {
          idx += select(0u, 1u, ft.f3 < 0i);
        } else {
          idx += 6u + select(0u, 1u, ft.f3 > 0i);
        }

        pcase = 1917u + 10u * idx;
        if (ft.f4 > 0i) {
          pcase += 30u;
        }
      } else if (ftAbs == 4i) {
        var kk = 21i + 11i * ft.f0 + 4i * ft.f1 + 3i * ft.f2 + 2i * ft.f3 + ft.f4;
        if (kk < 0i || kk >= 16i) {
          if ((kk & 32i) != 0i) {
            kk -= 20i;
          } else {
            kk -= 10i;
          }
        }
        pcase = u32(1845i + 3i * kk);
      } else {
        pcase = u32(1839i + 2i * ft.f0);
      }
    }
  }

  return PatternInfo(pcase + 1u, m);
}

fn get_face_result(ft: FaceTests, idx: u32) -> i32 {
  switch idx {
    case 0u: { return ft.f0; }
    case 1u: { return ft.f1; }
    case 2u: { return ft.f2; }
    case 3u: { return ft.f3; }
    case 4u: { return ft.f4; }
    default: { return ft.f5; }
  }
}



fn local_field_gradient(local: vec3<f32>, v: CubeVals) -> vec3<f32> {
  let tx = clamp(local.x, 0.0, 1.0);
  let ty = clamp(local.y, 0.0, 1.0);
  let tz = clamp(local.z, 0.0, 1.0);

  let dx0 = mix(v.v4 - v.v0, v.v5 - v.v1, ty);
  let dx1 = mix(v.v7 - v.v3, v.v6 - v.v2, ty);
  let dx = mix(dx0, dx1, tz);

  let dy0 = mix(v.v1 - v.v0, v.v5 - v.v4, tx);
  let dy1 = mix(v.v2 - v.v3, v.v6 - v.v7, tx);
  let dy = mix(dy0, dy1, tz);

  let dz0 = mix(v.v3 - v.v0, v.v7 - v.v4, tx);
  let dz1 = mix(v.v2 - v.v1, v.v6 - v.v5, tx);
  let dz = mix(dz0, dz1, ty);

  return vec3<f32>(dx, dy, dz);
}

fn world_normal_for_local(face: u32, gridPos: vec3<f32>, cellBase: vec3<f32>, v: CubeVals) -> vec3<f32> {
  let local = gridPos - cellBase;
  let g = local_field_gradient(local, v);
  let e = max(params.normalEpsilon, 0.01);
  let tx = param_to_world(face, gridPos + vec3<f32>(e, 0.0, 0.0)) - param_to_world(face, gridPos - vec3<f32>(e, 0.0, 0.0));
  let ty = param_to_world(face, gridPos + vec3<f32>(0.0, e, 0.0)) - param_to_world(face, gridPos - vec3<f32>(0.0, e, 0.0));
  let tz = param_to_world(face, gridPos + vec3<f32>(0.0, 0.0, e)) - param_to_world(face, gridPos - vec3<f32>(0.0, 0.0, e));
  let mapped = cross(ty, tz) * g.x + cross(tz, tx) * g.y + cross(tx, ty) * g.z;
  let len = length(mapped);
  if (len > 1e-8) {
    return mapped / len;
  }
  return normalize(param_to_world(face, gridPos));
}

fn vertex_grid_for_code(code: u32, cell: vec3<u32>, v: CubeVals) -> vec3<f32> {
  let base = vec3<f32>(f32(cell.x), f32(cell.y), f32(cell.z));
  if (code == 12u) {
    return base + vec3<f32>(0.5, 0.5, 0.5);
  }

  let c1 = edge_corner_a(code);
  let c2 = edge_corner_b(code);
  let f1 = getv(v, c1);
  let f2 = getv(v, c2);
  let diff = f1 - f2;
  let t = clamp(select(f1 / diff, 0.5, abs(diff) < 1e-9), 0.0, 1.0);
  let a = vec3<f32>(corner_offset(c1));
  let b = vec3<f32>(corner_offset(c2));
  return base + a + t * (b - a);
}

fn world_to_face_grid(pos: vec3<f32>) -> vec4<f32> {
  let radius = max(length(pos), 1e-6);
  let dir = pos / radius;
  let absolute = abs(dir);
  var face = 0u;
  var facePoint = vec2<f32>(0.0);

  if (absolute.x >= absolute.y && absolute.x >= absolute.z) {
    if (dir.x >= 0.0) {
      face = 0u;
      facePoint = vec2<f32>(-dir.z / max(dir.x, 1e-6), dir.y / max(dir.x, 1e-6));
    } else {
      face = 1u;
      let denominator = max(-dir.x, 1e-6);
      facePoint = vec2<f32>(dir.z / denominator, dir.y / denominator);
    }
  } else if (absolute.y >= absolute.z) {
    if (dir.y >= 0.0) {
      face = 2u;
      facePoint = vec2<f32>(dir.x / max(dir.y, 1e-6), -dir.z / max(dir.y, 1e-6));
    } else {
      face = 3u;
      let denominator = max(-dir.y, 1e-6);
      facePoint = vec2<f32>(dir.x / denominator, dir.z / denominator);
    }
  } else if (dir.z >= 0.0) {
    face = 4u;
    facePoint = vec2<f32>(dir.x / max(dir.z, 1e-6), dir.y / max(dir.z, 1e-6));
  } else {
    face = 5u;
    let denominator = max(-dir.z, 1e-6);
    facePoint = vec2<f32>(-dir.x / denominator, dir.y / denominator);
  }

  let uv = clamp(facePoint * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
  let radialMinimum = shell_radial_minimum();
  let radialMaximum = shell_radial_maximum();
  let depth = clamp((radius - radialMinimum) / max(radialMaximum - radialMinimum, 1e-6), 0.0, 1.0);
  return vec4<f32>(
    uv * f32(params.angularCells),
    depth * f32(params.radialCells),
    f32(face)
  );
}

fn trilinear_field_value(local: vec3<f32>, values: CubeVals) -> f32 {
  let x00 = mix(values.v0, values.v4, local.x);
  let x10 = mix(values.v1, values.v5, local.x);
  let x11 = mix(values.v2, values.v6, local.x);
  let x01 = mix(values.v3, values.v7, local.x);
  let xy0 = mix(x00, x10, local.y);
  let xy1 = mix(x01, x11, local.y);
  return mix(xy0, xy1, local.z);
}

@compute @workgroup_size(64)
fn classify_tiles(@builtin(global_invocation_id) gid: vec3<u32>) {
  let tileId = gid.x;
  if (tileId >= params.totalTiles || params.tilesPerAxis == 0u) {
    return;
  }

  let perFace = tiles_per_face();
  let face = tileId / perFace;
  let localTile = tileId - face * perFace;
  let tileY = localTile / params.tilesPerAxis;
  let tileX = localTile - tileY * params.tilesPerAxis;
  var tileActive = false;

  if ((params.visibleFaceMask & (1u << face)) != 0u) {
    let tileSize = max(params.tileCells, 1u);
    let x0 = tileX * tileSize;
    let y0 = tileY * tileSize;
    let x1 = min(x0 + tileSize, params.angularCells);
    let y1 = min(y0 + tileSize, params.angularCells);
    let fx0 = f32(x0);
    let fy0 = f32(y0);
    let fx1 = f32(x1);
    let fy1 = f32(y1);
    let center = vec2<f32>((fx0 + fx1) * 0.5, (fy0 + fy1) * 0.5);
    let shellDepth = f32(params.radialCells) * 0.56;

    var visible = false;
    var maximumCoverage = 0.0;
    var minimumInnerRadius = 1e30;
    var maximumOuterRadius = -1e30;
    let samples = array<vec2<f32>, 9>(
      vec2<f32>(fx0, fy0),
      vec2<f32>(fx1, fy0),
      vec2<f32>(fx0, fy1),
      vec2<f32>(fx1, fy1),
      center,
      vec2<f32>(center.x, fy0),
      vec2<f32>(center.x, fy1),
      vec2<f32>(fx0, center.y),
      vec2<f32>(fx1, center.y)
    );

    for (var sampleIndex = 0u; sampleIndex < 9u; sampleIndex += 1u) {
      let gridXY = samples[sampleIndex];
      let surfaceSample = tile_sample_surface(face, gridXY);
      maximumCoverage = max(maximumCoverage, surfaceSample.x);
      minimumInnerRadius = min(minimumInnerRadius, surfaceSample.y);
      maximumOuterRadius = max(maximumOuterRadius, surfaceSample.z);
      let sampleDirection = cube_face_direction(face, clamp(gridXY / max(f32(params.angularCells), 1.0), vec2<f32>(0.0), vec2<f32>(1.0)));
      let sampleRadius = mix(surfaceSample.y, surfaceSample.z, 0.62);
      let sampleWorld = sampleDirection * sampleRadius;
      visible = visible || point_is_visible_world(
        sampleWorld,
        params.tileFrustumGuard,
        params.tileHorizonGuard
      );
    }

    tileActive = visible && maximumCoverage >= params.coverageThreshold - params.tileCoverageGuard;
    if (tileActive) {
      currentTileFlags[tileId] = pack_tile_range(0u, params.radialCells - 1u);
      atomicAdd(&statusFlags[2], 1u);
      return;
    }
  }

  currentTileFlags[tileId] = 0u;
}

@compute @workgroup_size(128)
fn evaluate_field(@builtin(global_invocation_id) gid: vec3<u32>) {
  let visibleFaceCount = countOneBits(params.visibleFaceMask);
  let pointCount = points_per_face() * visibleFaceCount;
  let visiblePointId = gid.x;
  if (visiblePointId >= pointCount || visibleFaceCount == 0u) {
    return;
  }

  let faceOrdinal = visiblePointId / points_per_face();
  let face = nth_visible_face(params.visibleFaceMask, faceOrdinal);
  let localId = visiblePointId - faceOrdinal * points_per_face();
  let angularPoints = params.angularCells + 1u;
  let planePoints = angularPoints * angularPoints;
  let z = localId / planePoints;
  let planeId = localId - z * planePoints;
  let y = planeId / angularPoints;
  let x = planeId - y * angularPoints;
  let pointXY = vec2<u32>(x, y);
  let destinationIndex = field_index(face, vec3<u32>(x, y, z));
  let pointIsActive = point_has_active_tile(face, pointXY, z, false);
  let pointWasActive = params.tileHistoryValid != 0u && point_has_active_tile(face, pointXY, z, true);
  let faceWasValid = params.previousFieldValid != 0u &&
    (params.previousFieldFaceMask & (1u << face)) != 0u &&
    pointWasActive;
  let previousValue = previousField[destinationIndex];
  let olderValue = olderField[destinationIndex];
  var historyValue = max(params.maxThickness, 1.0);
  if (faceWasValid && params.historyCount >= 2u) {
    let historyWeight = clamp(params.voxelHistoryWeight, 0.0, 0.98);
    historyValue = previousValue * historyWeight + olderValue * (1.0 - historyWeight);
  } else if (faceWasValid && params.historyCount >= 1u) {
    historyValue = previousValue;
  }

  if (!pointIsActive) {
    if (faceWasValid) {
      let releaseTarget = max(params.maxThickness, 1.0);
      let releaseBlend = min(clamp(params.fieldBlend, 0.02, 0.12) * 0.30, 0.045);
      currentField[destinationIndex] = mix(historyValue, releaseTarget, releaseBlend);
    } else {
      currentField[destinationIndex] = max(params.maxThickness, 1.0);
    }
    return;
  }

  let gridPos = vec3<f32>(f32(x), f32(y), f32(z));
  let rawValue = scalar_field_world(param_to_world(face, gridPos));

  var stableValue = rawValue;
  if (faceWasValid) {
    let blendAlpha = clamp(params.fieldBlend, 0.018, 0.11);
    stableValue = mix(historyValue, rawValue, blendAlpha);

    let persistenceBand = max(params.voxelPersistenceBand, 0.0);
    if (historyValue < 0.0 && stableValue < persistenceBand) {
      stableValue = -max(abs(stableValue), 1e-5);
    } else if (historyValue >= 0.0 && stableValue > -persistenceBand) {
      stableValue = max(abs(stableValue), 1e-5);
    }
  }

  let hysteresis = max(params.isoHysteresis, 0.0);
  if (faceWasValid && hysteresis > 0.0 && abs(stableValue) < hysteresis) {
    stableValue = select(hysteresis, -hysteresis, historyValue < 0.0);
  }
  currentField[destinationIndex] = stableValue;
}

@compute @workgroup_size(128)
fn classify_cells(@builtin(global_invocation_id) gid: vec3<u32>) {
  let cellsPerFace = params.angularCells * params.angularCells * params.radialCells;
  let visibleFaceCount = countOneBits(params.visibleFaceMask);
  let totalCells = cellsPerFace * visibleFaceCount;
  let cellId = gid.x;
  if (cellId >= totalCells || visibleFaceCount == 0u) {
    return;
  }

  let faceOrdinal = cellId / cellsPerFace;
  let face = nth_visible_face(params.visibleFaceMask, faceOrdinal);
  let faceCell = cellId - faceOrdinal * cellsPerFace;
  let x = faceCell % params.angularCells;
  let y = (faceCell / params.angularCells) % params.angularCells;
  let z = faceCell / (params.angularCells * params.angularCells);
  let cell = vec3<u32>(x, y, z);
  if (params.useTileCulling != 0u) {
    let tile = cell_tile(cell.xy);
    let tileFlag = currentTileFlags[tile_index(face, tile)];
    if (
      !tile_is_active(tileFlag) ||
      cell.z < tile_min_radial_cell(tileFlag) ||
      cell.z > tile_max_radial_cell(tileFlag)
    ) {
      return;
    }
  }

  if (!cell_is_visible(face, cell)) {
    return;
  }

  let values = load_cube_values(face, cell);
  let index = cube_index(values);
  if (index == 0u || index == 255u) {
    return;
  }

  let slot = atomicAdd(&activeCounter, 1u);
  if (slot < params.maxActiveCells) {
    activeCells[slot] = pack_cell(face, cell);
  } else {
    atomicStore(&statusFlags[1], 1u);
  }
}

@compute @workgroup_size(1)
fn prepare_extract_dispatch(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x != 0u) {
    return;
  }
  let count = min(atomicLoad(&activeCounter), params.maxActiveCells);
  extractDispatch[0] = (count + 127u) / 128u;
  extractDispatch[1] = 1u;
  extractDispatch[2] = 1u;
}

fn reserve_vertices(count: u32) -> u32 {
  var expected = atomicLoad(&outCounter);
  loop {
    if (expected > params.maxVertices) {
      atomicStore(&statusFlags[0], 1u);
      return 0xffffffffu;
    }
    if (count > params.maxVertices - expected) {
      atomicStore(&statusFlags[0], 1u);
      return 0xffffffffu;
    }
    let result = atomicCompareExchangeWeak(&outCounter, expected, expected + count);
    if (result.exchanged) {
      return expected;
    }
    expected = result.old_value;
  }
}

@compute @workgroup_size(128)
fn extract_active(@builtin(global_invocation_id) gid: vec3<u32>) {
  let activeCount = min(atomicLoad(&activeCounter), params.maxActiveCells);
  let activeId = gid.x;
  if (activeId >= activeCount) {
    return;
  }

  let packed = unpack_cell(activeCells[activeId]);
  let cell = packed.xyz;
  let face = packed.w;
  let vals = load_cube_values(face, cell);
  let cubeIdx = cube_index(vals);
  if (cubeIdx == 0u || cubeIdx == 255u) {
    return;
  }

  let info = pattern_info(cubeIdx, vals);
  var pcase = info.pcase;
  var triCodes: array<vec3<u32>, 12>;
  var triCount = 0u;

  loop {
    if (pcase >= 2310u) {
      break;
    }
    let patternWord = table[pcase];
    let c0 = patternWord & 0xFu;
    let c1 = (patternWord >> 4u) & 0xFu;
    let c2 = (patternWord >> 8u) & 0xFu;
    if (c0 <= 12u && c1 <= 12u && c2 <= 12u && c0 != c1 && c1 != c2 && c0 != c2) {
      if (triCount < 12u) {
        triCodes[triCount] = vec3<u32>(c0, c1, c2);
      }
      triCount += 1u;
    }
    if ((patternWord & 0x1000u) == 0u) {
      break;
    }
    pcase += 1u;
  }

  if (triCount == 0u) {
    return;
  }

  let safeTriCount = min(triCount, 12u);
  let emitVertexCount = safeTriCount * 3u;
  let base = reserve_vertices(emitVertexCount);
  if (base == 0xffffffffu) {
    return;
  }

  let cellBase = vec3<f32>(f32(cell.x), f32(cell.y), f32(cell.z));
  for (var triangle = 0u; triangle < safeTriCount; triangle += 1u) {
    let codes = triCodes[triangle];
    let dst = base + triangle * 3u;
    var g0 = vertex_grid_for_code(codes.x, cell, vals);
    var g1 = vertex_grid_for_code(codes.y, cell, vals);
    var g2 = vertex_grid_for_code(codes.z, cell, vals);

    if (info.reverse) {
      let temporary = g1;
      g1 = g2;
      g2 = temporary;
    }

    let p0 = param_to_world(face, g0);
    let p1 = param_to_world(face, g1);
    let p2 = param_to_world(face, g2);
    outPositions[dst] = vec4<f32>(p0, 1.0);
    outPositions[dst + 1u] = vec4<f32>(p1, 1.0);
    outPositions[dst + 2u] = vec4<f32>(p2, 1.0);
    outNormals[dst] = vec4<f32>(world_normal_for_local(face, g0, cellBase, vals), 0.0);
    outNormals[dst + 1u] = vec4<f32>(world_normal_for_local(face, g1, cellBase, vals), 0.0);
    outNormals[dst + 2u] = vec4<f32>(world_normal_for_local(face, g2, cellBase, vals), 0.0);
  }
}

@compute @workgroup_size(128)
fn project_vertices(@builtin(global_invocation_id) gid: vec3<u32>) {
  let vertexId = gid.x;
  let vertexCount = min(atomicLoad(&outCounter), params.maxVertices);
  if (vertexId >= vertexCount) {
    return;
  }

  let mapping = world_to_face_grid(outPositions[vertexId].xyz);
  let maximumCell = vec3<u32>(params.angularCells - 1u, params.angularCells - 1u, params.radialCells - 1u);
  let floored = vec3<u32>(floor(mapping.xyz));
  let cell = min(floored, maximumCell);
  let local = clamp(mapping.xyz - vec3<f32>(cell), vec3<f32>(0.0), vec3<f32>(1.0));
  let face = min(u32(mapping.w + 0.5), 5u);
  let values = load_cube_values(face, cell);
  let value = trilinear_field_value(local, values);
  let normal = world_normal_for_local(face, vec3<f32>(cell) + local, vec3<f32>(cell), values);
  let displacement = clamp(
    value * clamp(params.projectionStrength, 0.0, 1.0),
    -max(params.projectionMaxStep, 0.0),
    max(params.projectionMaxStep, 0.0)
  );
  let projectedPosition = outPositions[vertexId].xyz - normal * displacement;
  outPositions[vertexId] = vec4<f32>(projectedPosition, 1.0);
  outNormals[vertexId] = vec4<f32>(normal, 0.0);
}

@compute @workgroup_size(1)
fn prepare_draw_indirect(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x != 0u) {
    return;
  }
  let vertexCount = min(atomicLoad(&outCounter), params.maxVertices);
  outIndirect[0] = vertexCount;
  outIndirect[1] = 1u;
  outIndirect[2] = 0u;
  outIndirect[3] = 0u;
  projectionDispatch[0] = (vertexCount + 127u) / 128u;
  projectionDispatch[1] = 1u;
  projectionDispatch[2] = 1u;
}
