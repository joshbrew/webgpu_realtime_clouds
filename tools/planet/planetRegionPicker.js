import {bakePlanetRegion, pickPlanetRegion, planetRegionCoordinates, planetRegionOutline,
  planetRegionFrame, projectPlanetRegionSurfacePoint, storePlanetRegion} from './planetRegion.js';
import {warmPlanetRegionSurface, samplePlanetRegionSurface} from './planetRegionMaterial.js';

// Find where a partly visible edge reaches the camera plane or planet limb.
function clipOutlineEnd(visible, hidden, project) {
  let end = project(visible);
  for (let i = 0; i < 12; i++) {
    const mid = visible.map((value, axis) => (value + hidden[axis]) / 2);
    const point = project(mid);
    if (point) {
      visible = mid;
      end = point;
    } else {
      hidden = mid;
    }
  }
  return end;
}

export function mountPlanetRegionPicker(document, parent, readScene, openFluidRegion) {
  const section = document.createElement('div');
  section.className = 'cl-basic-block';
  section.innerHTML = `
    <label class="row"><span>Local map width</span>
      <select id="planet-local-span"><option value="4000">4 km</option><option value="12000">12 km</option>
        <option value="32000" selected>32 km</option><option value="80000">80 km</option><option value="160000">160 km</option></select>
    </label>
    <label class="row"><span>Open picked region in</span>
      <select id="planet-local-destination"><option value="flat" selected>Flat clouds</option><option value="fluid">Fluid flight</option></select>
    </label>
    <div style="display:flex;gap:.45rem;flex-wrap:wrap">
      <button type="button" id="planet-local-pick" class="cl-btn">Pick local region</button>
      <button type="button" id="planet-local-export" class="cl-btn" disabled>Build local map</button>
      <a id="planet-local-open" class="cl-btn" hidden>Open in Flat</a>
      <a id="planet-local-fluid" class="cl-btn" hidden>Open in Fluid</a>
    </div>
    <output id="planet-local-status" style="display:block;margin:.4rem 0;font-size:.85em" aria-live="polite"></output>`;
  parent.after(section);
  const spanInput = section.querySelector('#planet-local-span');
  const destination = section.querySelector('#planet-local-destination');
  const pickButton = section.querySelector('#planet-local-pick');
  const buildButton = section.querySelector('#planet-local-export');
  const open = section.querySelector('#planet-local-open');
  const fluid = section.querySelector('#planet-local-fluid');
  const status = section.querySelector('output');
  const outline = document.createElement('canvas');
  outline.setAttribute('aria-label', 'Planet region selection');
  outline.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none';
  const surface = document.getElementById('planet');
  document.body.append(outline);
  const paint = outline.getContext('2d');
  const nextFrame = () => new Promise(requestAnimationFrame);
  let selected, picking = false, building = false, warmedWorld;
  let aim = [0, 0], hovered, lastPick = -Infinity, pickingStatus = '';
  let outlinedTile, outlinedMap, perimeter;

  function pickMode(enabled) {
    picking = enabled;
    aim = [0, 0];
    hovered = null;
    lastPick = -Infinity;
    surface.style.cursor = enabled ? 'crosshair' : '';
    pickButton.textContent = enabled ? 'Cancel selection' : 'Pick local region';
    pickButton.setAttribute('aria-pressed', String(enabled));
    if (enabled) surface.focus();
  }
  const selectedSpan = () => Number(spanInput.value);
  const widthLabel = span => (span / 1000).toFixed(1) + ' km square';
  function updatePickingStatus(message) {
    if (pickingStatus === message) return;
    pickingStatus = message;
    status.textContent = message;
  }
  function updateStatus() {
    open.hidden = fluid.hidden = true;
    if (!selected) return;
    const [lat, lon] = planetRegionCoordinates(selected.frame.up);
    status.textContent = `${widthLabel(selected.span)} · ${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
  }
  pickButton.onclick = () => {
    if (!readScene().camera) return;
    pickMode(!picking);
    if (picking) {
      pickingStatus = '';
      updatePickingStatus(widthLabel(selectedSpan()) + ' · Aim and click, or press Enter for the view center.');
      const {world} = readScene();
      void warmPlanetRegionSurface(world).catch(() => {});
    }
    else if (selected) updateStatus();
    else status.textContent = '';
  };
  const surfaceHeight = (world, dir) => Math.max(world.oceanLevel ?? -Infinity, world.sampleSurface(dir).height);
  function directionAt(world, camera, [x, y]) {
    return pickPlanetRegion(camera, x, y, world.radius, dir => surfaceHeight(world, dir));
  }

  function selectAt(point) {
    const {world, camera} = readScene();
    const direction = directionAt(world, camera, point);
    if (!direction) {
      updatePickingStatus('Aim at the visible planet surface.');
      return;
    }
    selected = {frame: planetRegionFrame(direction), span: selectedSpan(),
      seed: world.studioSeed, preset: world.preset, radius: world.radius};
    pickMode(false);
    buildButton.disabled = false;
    updateStatus();
    void buildLocalMap();
  }
  function pointerAim(event) {
    const rect = surface.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2];
  }
  surface.addEventListener('pointermove', event => {
    if (picking) aim = pointerAim(event);
  });
  surface.addEventListener('pointerleave', () => {
    if (picking) aim = [0, 0];
  });
  surface.addEventListener('pointerdown', event => {
    if (!picking || event.button !== 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    selectAt(pointerAim(event));
  }, true);
  surface.addEventListener('keydown', event => {
    if (!picking || !['Enter', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === 'Enter') selectAt([0, 0]);
    else {
      pickButton.click();
      pickButton.focus();
    }
  }, true);
  spanInput.onchange = () => {
    lastPick = -Infinity;
    if (picking) surface.focus();
    else if (selected) {
      selected = {...selected, span: selectedSpan()};
      updateStatus();
    }
  };
  async function buildLocalMap() {
    if (!selected || building) return;
    const {world, cloudStyle, cloudState, sunlight, captureWeather} = readScene();
    const tile = selected;
    const {span} = tile;
    const fluidFirst = destination.value === "fluid";
    pickMode(false);
    building = pickButton.disabled = spanInput.disabled = destination.disabled = buildButton.disabled = true;
    open.hidden = fluid.hidden = true;
    try {
      status.textContent = 'Sampling planet terrain…';
      const [region, weather] = await Promise.all([
        bakePlanetRegion(world, tile.frame.up, span, {
          sampleGrid: samplePlanetRegionSurface,
          cloudStyle, sunlight, includeSurroundings: true, yieldFrame: nextFrame,
          onProgress: progress => {status.textContent = `Refining local terrain… ${Math.floor(progress * 100)}%`;},
        }),
        captureWeather?.(tile.frame, span),
      ]);
      if (selected !== tile) throw new Error('Planet terrain changed. Select the region again.');
      if (weather) region.weather = weather;
      if (cloudState) region.cloudState = cloudState;
      const id = await storePlanetRegion(region);
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('demo', 'flat');
      url.searchParams.set('region', id);
      if (cloudStyle) {
        url.searchParams.set('clouds', 'shell');
        url.searchParams.set('planetCloud', cloudStyle);
      }
      open.href = url.href;
      url.searchParams.delete('clouds');
      url.searchParams.delete('planetCloud');
      url.searchParams.set('demo', 'fluid');
      url.searchParams.set('view', 'flight');
      fluid.href = url.href;
      open.hidden = fluid.hidden = false;
      status.textContent = `${region.resolution} × ${region.resolution} terrain samples · ${(region.span / (region.resolution - 1)).toFixed(1)} m spacing · ${(region.span / 1000).toFixed(1)} km square${weather ? ' · Planet weather captured' : ''}`;
      if (fluidFirst && openFluidRegion) await openFluidRegion(fluid.href, region);
      else location.assign(fluidFirst ? fluid.href : open.href);
    } catch (error) {
      status.textContent = error.message;
      console.error(error);
    } finally {
      building = pickButton.disabled = spanInput.disabled = destination.disabled = false;
      buildButton.disabled = !selected;
    }
  }
  buildButton.onclick = buildLocalMap;

  return {
    get building() { return building; },
    draw(world, camera) {
      if (!warmedWorld) {
        warmedWorld = world;
        // Compile after the initial orbit frame can paint, while the user is
        // choosing a location. A click can always start the same work sooner.
        const warm = () => { if (!world.disposed) void warmPlanetRegionSurface(world).catch(() => {}); };
        if (typeof requestIdleCallback === 'function') requestIdleCallback(warm, {timeout:500});
        else setTimeout(warm, 0);
      }
      if (selected && (selected.seed !== world.studioSeed || selected.preset !== world.preset || selected.radius !== world.radius)) {
        selected = null;
        open.hidden = fluid.hidden = true;
        buildButton.disabled = true;
        status.textContent = 'Planet changed. Pick a new local region.';
      }
      const now = performance.now();
      if (picking && now - lastPick >= 40) {
        lastPick = now;
        const direction = directionAt(world, camera, aim);
        if (!direction) {
          hovered = null;
        } else if (!hovered || hovered.span !== selectedSpan() || world.studioMap !== outlinedMap ||
            Math.hypot(...direction.map((value, axis) => value - hovered.frame.up[axis])) * world.radius > .25) {
          hovered = {frame: planetRegionFrame(direction), span: selectedSpan()};
        }
      }
      const tile = picking ? hovered : selected;
      if (!tile) {
        if (picking) updatePickingStatus(widthLabel(selectedSpan()) + ' · Aim at the visible planet surface.');
        buildButton.disabled = !selected;
        if (outline.width) outline.width = 0;
        return;
      }
      const width = outline.clientWidth, height = outline.clientHeight;
      if (outline.width !== width || outline.height !== height) {
        outline.width = width;
        outline.height = height;
      }
      paint.clearRect(0, 0, width, height);
      if (tile !== outlinedTile || world.studioMap !== outlinedMap) {
        outlinedTile = tile;
        outlinedMap = world.studioMap;
        perimeter = planetRegionOutline(tile.frame, tile.span, world.radius, dir => surfaceHeight(world, dir));
      }
      const referenceRadius = world.radius + Math.min(0, world.oceanLevel ?? 0);
      const project = point => projectPlanetRegionSurfacePoint(camera, point,
        Math.min(referenceRadius, Math.hypot(...point)));
      const points = perimeter.map(project);
      const fullyVisible = points.every(Boolean);
      if (picking) {
        const clipped = !fullyVisible || points.some(([x, y]) => Math.abs(x) > 1 || Math.abs(y) > 1);
        updatePickingStatus(widthLabel(tile.span) + (clipped
          ? ' · Outline clipped by the view. Zoom out to see more.'
          : ' · Aim and click, or press Enter for the view center.'));
      }
      const pixel = ([x, y]) => [(x + 1) * width / 2, (1 - y) * height / 2];
      paint.beginPath();
      paint.strokeStyle = 'rgba(137,235,255,.95)';
      paint.lineWidth = 2;
      if (fullyVisible) {
        paint.moveTo(...pixel(points[0]));
        for (const point of points.slice(1)) paint.lineTo(...pixel(point));
        paint.closePath();
        paint.fillStyle = 'rgba(74,193,242,.12)';
        paint.fill();
      } else {
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          const a = points[i], b = points[next];
          if (!a && !b) continue;
          paint.moveTo(...pixel(a ?? clipOutlineEnd(perimeter[next], perimeter[i], project)));
          paint.lineTo(...pixel(b ?? clipOutlineEnd(perimeter[i], perimeter[next], project)));
        }
      }
      paint.stroke();
    },
  };
}
