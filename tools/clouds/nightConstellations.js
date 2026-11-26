// Equirectangular cells place the figures above and below the celestial equator.
const columns = 8;
const rowStep = Math.PI / 4;
const columnStep = 2 * Math.PI / columns;
const pointScale = Math.PI / 180;
const figures = [
  ['Loaf cat', '-5,-2 -3,1 -1,2 2,2 3,4 4,2 5,3 5,0 3,-2 -5,-2 | -4,-1 -5,0 -6,0 | 3,0 4,0'],
  ['Doge', '-5,-2 -5,1 -4,4 -2,2 2,2 4,4 5,1 5,-2 2,-4 -3,-4 -5,-2 | -3,0 -1,0 | 1,0 3,0 | -1,-2 0,-3 1,-2'],
  ['Tea frog', '-5,-1 -4,3 -2,4 -1,2 1,2 2,4 4,3 5,-1 3,-3 -3,-3 -5,-1 | -3,-1 0,-2 3,-1 | -3,2 -3,3 | 3,2 3,3'],
  ['This is fine', '-4,-4 3,-4 3,-1 -4,-1 -4,-4 | 3,-1 5,-1 5,-3 3,-3 | -3,0 -4,2 -2,4 -2,2 0,5 2,2 2,0'],
  ['Honking goose', '-5,-2 -2,-3 2,-2 2,1 3,3 5,3 6,2 4,2 3,0 3,-3 0,-4 -4,-3 -5,-2 | -4,-1 -2,-2 0,-2'],
  ['Rocket raccoon', '-5,-3 -3,-3 -1,-1 | -4,-4 -2,-4 0,-2 | -2,-2 -1,2 4,4 5,2 3,-2 -2,-2 | 1,1 2,2 3,1 2,0 1,1'],
  ['Space shrimp', '-5,1 -3,3 0,3 3,2 4,0 3,-2 1,-3 -1,-2 0,0 2,0 | -5,1 -6,3 -4,3 | -3,3 -2,1 | 0,3 0,1 | 3,2 2,0'],
  ['Bread winner', '-5,-3 -5,2 -4,3 4,3 5,2 5,-3 -5,-3 | -3,1 -2,1 | 2,1 3,1 | -2,-1 0,-2 2,-1'],
  ['Keyboard cat', '-5,-3 5,-3 5,-1 -5,-1 -5,-3 | -3,-1 -3,3 -1,2 1,2 3,3 3,-1 | -1,0 1,0 | -3,-2 -2,-2 | 1,-2 3,-2'],
  ['Mystery duck', '-5,-1 -3,-3 2,-3 4,-2 4,0 3,1 3,3 1,4 -1,3 -1,1 -3,0 -5,-1 | 3,3 5,2 3,2 | 1,2 2,2'],
  ['Capy with an orange', '-5,-2 -4,1 1,1 2,3 4,3 5,1 5,-2 -5,-2 | 2,3 2,5 4,5 4,3 | 3,0 4,0'],
  ['Pizza rat', '-5,-2 -2,-3 0,-1 -1,2 -3,2 -4,1 -5,-2 | 0,-1 5,-3 4,3 0,-1 | 3,0 4,0 | -3,2 -3,4 -1,3'],
  ['Space snail', '-6,-2 5,-2 5,0 4,1 3,0 2,-1 -4,-1 -6,-2 | -4,-1 -5,1 -4,3 -1,4 2,2 2,0 -1,-1 -3,0 -2,2 0,1 | 4,1 4,3 | 5,0 6,2'],
  ['Grumpy cloud', '-5,-2 -5,0 -3,1 -2,3 1,4 3,2 5,1 5,-2 -5,-2 | -3,1 -1,0 | 1,0 3,1 | -1,-2 0,-1 1,-2'],
  ['Little ghost', '-5,-4 -5,0 -3,3 0,4 3,3 5,0 5,-4 3,-2 1,-4 -1,-2 -3,-4 -5,-4 | -2,0 -2,1 | 2,0 2,1'],
  ['Unbothered blob', '-5,-2 -4,1 -2,3 2,3 5,1 5,-2 2,-3 -3,-3 -5,-2 | -3,0 -1,0 | 1,0 3,0 | -1,-1 1,-1'],
  ['Sleepy owl', '-4,-3 -5,0 -4,4 -2,2 2,2 4,4 5,0 4,-3 0,-4 -4,-3 | -3,1 -2,0 -1,1 | 1,1 2,0 3,1 | -1,-1 0,-2 1,-1'],
  ['Moon cheese', '-5,-3 5,-3 5,0 2,4 -5,-1 -5,-3 | -5,-1 5,0 | -2,-2 -1,-2 | 1,2 2,3 | 3,-2 4,-1'],
  ['Party shark', '-6,0 -2,2 0,4 2,2 5,1 6,0 5,-1 1,-2 -2,-1 -6,-3 -6,0 | 2,2 3,5 4,2 | 4,0 5,0'],
  ['Bean astronaut', '-4,-4 -5,-1 -4,3 -2,4 2,4 4,2 4,-2 2,-4 -4,-4 | -2,2 2,2 2,0 -2,0 -2,2 | 4,1 6,1 6,-2 4,-2'],
  ['Master Shake', '-4,2 -4.7,1 -3.3,1 -2.4,-4 2.4,-4 3.3,1 4.7,1 4,2 -4,2 | -.8,2 -.5,3.7 1.8,5.3 3.4,5.1 | -2,0 -1.4,-.25 | 1.3,0 1.9,-.25 | -1.2,-1.5 0,-1.85 1.3,-1.45 | -3,-1.2 -5,-1.8 -5.8,-.5 | 3,-1.2 5,-1.8 5.5,-.6'],
  ['Tiny crab', '-3,-2 -4,0 -2,2 2,2 4,0 3,-2 -3,-2 | -4,0 -6,2 -6,4 -4,3 | 4,0 6,2 6,4 4,3 | -2,2 -2,4 | 2,2 2,4 | -3,-2 -5,-3 | 3,-2 5,-3'],
  ['Disco possum', '-5,-1 -3,1 -2,3 1,2 4,3 5,1 5,-2 2,-3 -3,-2 -5,-1 | -5,-1 -6,1 -6,3 | 0,-3 -1,-5 | 3,-3 4,-5 | 2,1 3,1'],
  ['The Mooninites', '-5.6,4.5 -.6,4.5 -.6,.2 -1.5,.2 -1.5,-3 -2.4,-3 -2.4,-1 -3.8,-1 -3.8,-3 -4.7,-3 -4.7,.2 -5.6,.2 -5.6,4.5 | -.6,1 .3,1 .3,2 1.1,2 1.1,3.3 | -4.5,3.1 -3.6,3.1 | -2.7,3.1 -1.8,3.1 | -4.1,1.8 -2.1,1.8 | 1.8,1.9 5.8,1.9 5.8,-1.1 5.1,-1.1 5.1,-3.5 4.3,-3.5 4.3,-2 3.3,-2 3.3,-3.5 2.5,-3.5 2.5,-1.1 1.8,-1.1 1.8,1.9 | 2.8,.9 3.35,.65 | 4.25,.65 4.9,.9 | 3,-.3 4.8,-.3'],
];

const points = [];
const segments = [];
const ranges = figures.map(([, drawing]) => {
  const pointStart = points.length;
  const segmentStart = segments.length;
  const unique = new Set();
  for (const stroke of drawing.split(' | ')) {
    const path = stroke.split(' ');
    for (let i = 1; i < path.length; i++) segments.push(...[path[i - 1], path[i]]);
    for (const point of path) unique.add(point);
  }
  points.push(...unique);
  return [pointStart, points.length, segmentStart / 2, segments.length / 2];
});

const formatPoint = point => 'vec2<f32>(' + point.split(',').map(Number).map(x => (x * pointScale).toFixed(6)).join(',') + ')';

export const nightConstellationsWGSL =
  'const constellationPoints = array<vec2<f32>, ' + points.length + '>(' + points.map(formatPoint).join(',') + ');\n' +
  'const constellationSegments = array<vec2<f32>, ' + segments.length + '>(' + segments.map(formatPoint).join(',') + ');\n' +
  'const constellationRanges = array<vec4<u32>, ' + ranges.length + '>(' +
  ranges.map(range => 'vec4<u32>(' + range.map(x => x + 'u').join(',') + ')').join(',') + ');\n';

export function createConstellationGaze() {
  let focused = -1;
  let since = 0;
  return (direction, time) => {
    const longitude = Math.atan2(direction[0], direction[2]);
    const latitude = Math.asin(Math.max(-1, Math.min(1, direction[1])));
    const row = Math.round(latitude / rowStep);
    const column = Math.round(longitude / columnStep);
    const dot = Math.sin(latitude) * Math.sin(row * rowStep)
      + Math.cos(latitude) * Math.cos(row * rowStep) * Math.cos(longitude - column * columnStep);
    const next = Math.abs(row) <= 1 && dot > .993
      ? (row + 1) * columns + (column + columns) % columns : -1;
    if (next !== focused) {
      focused = next;
      since = time;
    }
    const dwell = Math.max(0, Math.min(1, (time - since - 1.1) / 2.1));
    return [focused + 1, dwell * dwell * (3 - 2 * dwell)];
  };
}

export function flatCelestialDirection([x, y, z], azimuth, elevation) {
  const along = x * Math.sin(azimuth) + z * Math.cos(azimuth);
  const sin = Math.sin(elevation);
  const cos = Math.cos(elevation);
  return [x * Math.cos(azimuth) - z * Math.sin(azimuth), y * cos - along * sin, along * cos + y * sin];
}
