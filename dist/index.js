(()=>{var ve=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,s)=>(typeof require<"u"?require:t)[s]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var ae=`<!-- tools/clouds/clouds.html -->\r
<!doctype html>\r
<html lang="en">\r
\r
<head>\r
  <meta charset="utf-8" />\r
  <meta name="viewport" content="width=device-width,initial-scale=1" />\r
  <title>Clouds - UI</title>\r
  <style>\r
    :root {\r
      --side: 340px;\r
      --fg: #dbe4ff;\r
      --fg2: #9fb0d0;\r
      --bg: #0e1117;\r
      --panel: #0c111b;\r
    }\r
\r
    * { box-sizing: border-box }\r
\r
    html, body {\r
      margin: 0;\r
      height: 100%;\r
      background: var(--bg);\r
      color: var(--fg);\r
      font: 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;\r
    }\r
\r
    #sidebar {\r
      position: fixed;\r
      inset: 0 auto 0 0;\r
      width: var(--side);\r
      background: var(--panel);\r
      overflow: auto;\r
      padding: 16px 16px 80px;\r
      border-right: 1px solid #151c2b;\r
    }\r
\r
    #gpuCanvas {\r
      position: fixed;\r
      left: var(--side);\r
      top: 0;\r
      right: 0;\r
      bottom: 0;\r
      width: calc(100vw - var(--side));\r
      height: 100vh;\r
      display: block;\r
      background: #000;\r
    }\r
\r
    h1 {\r
      margin: 0 0 8px;\r
      font-size: 18px;\r
    }\r
\r
    h2 {\r
      margin: 16px 0 8px;\r
      font-size: 13px;\r
      color: var(--fg2);\r
    }\r
\r
    label {\r
      display: block;\r
      margin: 6px 0 2px;\r
      color: var(--fg2);\r
      font-size: 12px;\r
    }\r
\r
    select {\r
      width: 100%;\r
      padding: 0px 8px;\r
      border-radius: 8px;\r
      border: 1px solid #26304a;\r
      background: #0b0f19;\r
      color: var(--fg);\r
      height: 28px;\r
    }\r
\r
    input, button {\r
      width: 100%;\r
      padding: 6px 8px;\r
      border-radius: 8px;\r
      border: 1px solid #26304a;\r
      background: #0b0f19;\r
      color: var(--fg);\r
    }\r
\r
    input[type="number"] { appearance: textfield }\r
\r
    button {\r
      margin-top: 10px;\r
      cursor: pointer;\r
    }\r
\r
    .row {\r
      display: grid;\r
      grid-template-columns: 1fr 1fr;\r
      gap: 8px;\r
    }\r
\r
    .panel {\r
      margin: 10px 0;\r
      padding: 10px;\r
      border: 1px solid #1a2135;\r
      border-radius: 10px;\r
      background: #0b101a;\r
    }\r
\r
    .dbg .slot { margin-bottom: 14px }\r
    .dbg .slot div {\r
      margin: 0 0 6px;\r
      font-weight: 600;\r
      font-size: 12px;\r
      color: #b8c7e6;\r
    }\r
\r
    .dbg canvas {\r
      width: 100%;\r
      height: auto;\r
      display: block;\r
      border-radius: 8px;\r
      background: #000;\r
      box-shadow: 0 0 0 1px #131b2b inset;\r
    }\r
\r
    small { color: #7f8cb0; font-size: 12px }\r
\r
    #busyOverlay {\r
      position: fixed;\r
      left: var(--side);\r
      top: 0;\r
      right: 0;\r
      bottom: 0;\r
      display: none;\r
      align-items: center;\r
      justify-content: center;\r
      background: rgba(2, 4, 8, 0.55);\r
      z-index: 9999;\r
    }\r
\r
    #busyOverlay .box {\r
      padding: 12px 16px;\r
      border-radius: 8px;\r
      background: #0b1220;\r
      border: 1px solid #26304a;\r
      color: var(--fg);\r
      font-weight: 600;\r
    }\r
\r
    .inline {\r
      display: flex;\r
      gap: 8px;\r
      align-items: center;\r
    }\r
\r
    .smallLabel {\r
      font-size: 12px;\r
      color: var(--fg2);\r
      margin-right: 8px;\r
    }\r
\r
    .triple {\r
      display: grid;\r
      grid-template-columns: repeat(3, 1fr);\r
      gap: 8px;\r
    }\r
\r
    .compact {\r
      font-size: 12px;\r
      padding: 6px;\r
      border-radius: 6px;\r
    }\r
\r
    .divider {\r
      margin-top: 12px;\r
      border-top: 1px dashed #142034;\r
      padding-top: 10px;\r
    }\r
\r
    .hint {\r
      margin-top: 6px;\r
      color: #93a6ce;\r
      display: block;\r
    }\r
  </style>\r
</head>\r
\r
<body>\r
\r
  <aside id="sidebar">\r
    <h1>Pipeline</h1>\r
\r
    <div class="panel">\r
      <div style="display:flex;gap:8px">\r
        <label for="pass">Controls:</label>\r
        <select id="pass" style="flex:1">\r
          <option value="weather">Weather 2D</option>\r
          <option value="shape128">Shape128 RGBA</option>\r
          <option value="detail32">Detail32 RGB</option>\r
          <option value="blue">Blue Noise 2D</option>\r
          <option value="clouds">Clouds</option>\r
          <option value="preview" selected>Preview</option>\r
        </select>\r
      </div>\r
\r
      <button id="rebake-all">Re-Bake Textures</button>\r
      <button id="render">Re-Render</button>\r
\r
      <div style="margin-top:10px" class="inline">\r
        <div style="flex:1">\r
          <label style="margin-bottom:6px">Reproject &amp; Animate</label>\r
          <button id="reproj-anim-toggle">Start x4 Anim</button>\r
          <small class="hint">Click to enable coarse x4 reprojection and start/stop the animation loop.</small>\r
        </div>\r
        <div style="width:110px">\r
          <div style="margin-top:6px;font-size:12px;color:var(--fg2)">FPS: <span id="fpsDisplay">-</span></div>\r
        </div>\r
      </div>\r
    </div>\r
\r
    <!-- Weather -->\r
    <div class="panel" id="p-weather">\r
      <h2>Weather 2D (R and G channels)</h2>\r
\r
      <div style="display:flex;gap:8px;margin-bottom:8px">\r
        <button id="bake-weather">Bake Weather</button>\r
        <button id="seed-weather">Seed Weather</button>\r
      </div>\r
\r
      <h2 style="margin-top:8px;font-size:13px;color:var(--fg2)">Base (R channel)</h2>\r
\r
      <div class="row">\r
        <div>\r
          <label>Mode</label>\r
          <select id="we-mode" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Seed (u32)</label>\r
          <input id="we-seed" type="number" step="1" class="compact">\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Zoom</label><input id="we-zoom" type="number" step="0.05" class="compact"></div>\r
        <div><label>Frequency</label><input id="we-freq" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Octaves</label><input id="we-oct" type="number" step="1" class="compact"></div>\r
        <div><label>Lacunarity</label><input id="we-lac" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Gain</label><input id="we-gain" type="number" step="0.05" class="compact"></div>\r
        <div><label>Threshold</label><input id="we-thr" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Seed Angle</label><input id="we-seedAngle" type="number" step="0.01" class="compact"></div>\r
        <div><label>Time</label><input id="we-time" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Voro Mode (u32)</label><input id="we-voroMode" type="number" step="1" class="compact"></div>\r
        <div><label>EdgeK</label><input id="we-edgeK" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Warp Amp</label><input id="we-warpAmp" type="number" step="0.05" class="compact"></div>\r
        <div></div>\r
      </div>\r
\r
      <div class="divider">\r
        <h2 style="margin:6px 0 8px;font-size:13px;color:var(--fg2)">Secondary (G channel)</h2>\r
\r
        <div class="row">\r
          <div class="inline" style="gap:10px">\r
            <input id="we-billow-enable" type="checkbox" class="compact" style="width:auto">\r
            <div class="smallLabel">Enable</div>\r
          </div>\r
          <div>\r
            <label>Mode</label>\r
            <select id="we-billow-mode" class="compact">\r
              <option value="">Loading...</option>\r
            </select>\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Seed (u32)</label><input id="we-billow-seed" type="number" step="1" class="compact"></div>\r
          <div><label>Scale</label><input id="we-billow-scale" type="number" step="0.01" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Zoom</label><input id="we-billow-zoom" type="number" step="0.05" class="compact"></div>\r
          <div><label>Frequency</label><input id="we-billow-freq" type="number" step="0.05" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Octaves</label><input id="we-billow-oct" type="number" step="1" class="compact"></div>\r
          <div><label>Lacunarity</label><input id="we-billow-lac" type="number" step="0.1" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Gain</label><input id="we-billow-gain" type="number" step="0.05" class="compact"></div>\r
          <div><label>Threshold</label><input id="we-billow-thr" type="number" step="0.01" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Seed Angle</label><input id="we-billow-seedAngle" type="number" step="0.01" class="compact"></div>\r
          <div><label>Time</label><input id="we-billow-time" type="number" step="0.01" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Voro Mode (u32)</label><input id="we-billow-voroMode" type="number" step="1" class="compact"></div>\r
          <div><label>EdgeK</label><input id="we-billow-edgeK" type="number" step="0.1" class="compact"></div>\r
        </div>\r
\r
        <div class="row">\r
          <div><label>Warp Amp</label><input id="we-billow-warpAmp" type="number" step="0.05" class="compact"></div>\r
          <div></div>\r
        </div>\r
\r
        <small class="hint">Weather modes list is populated from NoiseComputeBuilder entry points.</small>\r
      </div>\r
    </div>\r
\r
    <!-- Blue Noise -->\r
    <div class="panel" id="p-blue">\r
      <h2>Blue Noise 2D</h2>\r
\r
      <div style="display:flex;gap:8px;margin-bottom:8px">\r
        <button id="bake-blue">Bake Blue Noise</button>\r
        <button id="seed-blue">Seed Blue</button>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Seed (u32)</label><input id="bn-seed" type="number" step="1" class="compact"></div>\r
        <div></div>\r
      </div>\r
    </div>\r
\r
    <!-- Shape128 -->\r
    <div class="panel" id="p-shape128">\r
      <h2>Shape128 RGBA</h2>\r
\r
      <div style="display:flex;gap:8px;margin-bottom:8px">\r
        <button id="bake-shape128">Bake Shape128</button>\r
        <button id="seed-shape">Seed Shape</button>\r
      </div>\r
\r
      <h2 style="margin-top:8px;font-size:13px;color:var(--fg2)">Modes (4D-only)</h2>\r
\r
      <div class="row">\r
        <div>\r
          <label>Base A (R)</label>\r
          <select id="sh-mode-a" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Base B (R, optional)</label>\r
          <select id="sh-mode-b" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div>\r
          <label>Channel 2 (G)</label>\r
          <select id="sh-mode-2" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Channel 3 (B)</label>\r
          <select id="sh-mode-3" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div>\r
          <label>Channel 4 (A)</label>\r
          <select id="sh-mode-4" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Seed (u32)</label>\r
          <input id="sh-seed" type="number" step="1" class="compact">\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Zoom</label><input id="sh-zoom" type="number" step="0.05" class="compact"></div>\r
        <div><label>Frequency</label><input id="sh-freq" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Octaves</label><input id="sh-oct" type="number" step="1" class="compact"></div>\r
        <div><label>Lacunarity</label><input id="sh-lac" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Gain</label><input id="sh-gain" type="number" step="0.05" class="compact"></div>\r
        <div><label>Threshold</label><input id="sh-thr" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Seed Angle</label><input id="sh-seedAngle" type="number" step="0.01" class="compact"></div>\r
        <div><label>Time</label><input id="sh-time" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Voro Mode (u32)</label><input id="sh-voroMode" type="number" step="1" class="compact"></div>\r
        <div><label>EdgeK</label><input id="sh-edgeK" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Warp Amp</label><input id="sh-warpAmp" type="number" step="0.05" class="compact"></div>\r
        <div></div>\r
      </div>\r
\r
      <div class="divider">\r
        <h2 style="margin:6px 0 8px;font-size:13px;color:var(--fg2)">Shape Scale, Pos &amp; Vel (XYZ)</h2>\r
\r
        <div class="row">\r
          <div><label>Shape Scale</label><input id="sh-scale" type="number" step="0.0005" value="0.1" class="compact"></div>\r
          <div></div>\r
        </div>\r
\r
        <div class="triple" style="margin-top:8px">\r
          <div><label>Shape Pos X</label><input id="sh-pos-x" type="number" step="0.001" value="0" class="compact"></div>\r
          <div><label>Shape Pos Y</label><input id="sh-pos-y" type="number" step="0.001" value="0" class="compact"></div>\r
          <div><label>Shape Pos Z</label><input id="sh-pos-z" type="number" step="0.001" value="0" class="compact"></div>\r
        </div>\r
\r
        <div class="triple" style="margin-top:8px">\r
          <div><label>Shape Vel X</label><input id="sh-vel-x" type="number" step="0.0001" value="0.2" class="compact"></div>\r
          <div><label>Shape Vel Y</label><input id="sh-vel-y" type="number" step="0.0001" value="0" class="compact"></div>\r
          <div><label>Shape Vel Z</label><input id="sh-vel-z" type="number" step="0.0001" value="0" class="compact"></div>\r
        </div>\r
\r
        <small class="hint">Transforms apply immediately without rebaking. Modes and noise params rebake.</small>\r
      </div>\r
    </div>\r
\r
    <!-- Detail32 -->\r
    <div class="panel" id="p-detail32">\r
      <h2>Detail32 RGB</h2>\r
\r
      <div style="display:flex;gap:8px;margin-bottom:8px">\r
        <button id="bake-detail32">Bake Detail32</button>\r
        <button id="seed-detail">Seed Detail</button>\r
      </div>\r
\r
      <h2 style="margin-top:8px;font-size:13px;color:var(--fg2)">Modes (4D-only)</h2>\r
\r
      <div class="row">\r
        <div>\r
          <label>Channel 1 (R)</label>\r
          <select id="de-mode-1" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Channel 2 (G)</label>\r
          <select id="de-mode-2" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div>\r
          <label>Channel 3 (B)</label>\r
          <select id="de-mode-3" class="compact">\r
            <option value="">Loading...</option>\r
          </select>\r
        </div>\r
        <div>\r
          <label>Seed (u32)</label>\r
          <input id="de-seed" type="number" step="1" class="compact">\r
        </div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Zoom</label><input id="de-zoom" type="number" step="0.05" class="compact"></div>\r
        <div><label>Frequency</label><input id="de-freq" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Octaves</label><input id="de-oct" type="number" step="1" class="compact"></div>\r
        <div><label>Lacunarity</label><input id="de-lac" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Gain</label><input id="de-gain" type="number" step="0.05" class="compact"></div>\r
        <div><label>Threshold</label><input id="de-thr" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Seed Angle</label><input id="de-seedAngle" type="number" step="0.01" class="compact"></div>\r
        <div><label>Time</label><input id="de-time" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Voro Mode (u32)</label><input id="de-voroMode" type="number" step="1" class="compact"></div>\r
        <div><label>EdgeK</label><input id="de-edgeK" type="number" step="0.1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Warp Amp</label><input id="de-warpAmp" type="number" step="0.05" class="compact"></div>\r
        <div></div>\r
      </div>\r
\r
      <div class="divider">\r
        <h2 style="margin:6px 0 8px;font-size:13px;color:var(--fg2)">Detail Scale, Pos &amp; Vel (XYZ)</h2>\r
\r
        <div class="row">\r
          <div><label>Detail Scale</label><input id="de-scale" type="number" step="0.0005" value="1.0" class="compact"></div>\r
          <div></div>\r
        </div>\r
\r
        <div class="triple" style="margin-top:8px">\r
          <div><label>Detail Pos X</label><input id="de-pos-x" type="number" step="0.001" value="0" class="compact"></div>\r
          <div><label>Detail Pos Y</label><input id="de-pos-y" type="number" step="0.001" value="0" class="compact"></div>\r
          <div><label>Detail Pos Z</label><input id="de-pos-z" type="number" step="0.001" value="0" class="compact"></div>\r
        </div>\r
\r
        <div class="triple" style="margin-top:8px">\r
          <div><label>Detail Vel X</label><input id="de-vel-x" type="number" step="0.0001" value="0.02" class="compact"></div>\r
          <div><label>Detail Vel Y</label><input id="de-vel-y" type="number" step="0.0001" value="0" class="compact"></div>\r
          <div><label>Detail Vel Z</label><input id="de-vel-z" type="number" step="0.0001" value="0" class="compact"></div>\r
        </div>\r
\r
        <small class="hint">Transforms apply immediately without rebaking. Modes and noise params rebake.</small>\r
      </div>\r
    </div>\r
\r
    <!-- Cloud Params + Tuning -->\r
    <div class="panel" id="p-cloudParams">\r
      <h2>Cloud Params</h2>\r
\r
      <div class="row">\r
        <div><label>Sun Az (deg)</label><input id="c-az" type="number" step="1" class="compact"></div>\r
        <div><label>Sun El (deg)</label><input id="c-el" type="number" step="1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Sun Bloom</label><input id="c-bloom" type="number" step="0.05" class="compact"></div>\r
        <div></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Coverage</label><input id="p-coverage" type="number" step="0.02" class="compact"></div>\r
        <div><label>Density</label><input id="p-density" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Beer \u03C3</label><input id="p-beer" type="number" step="0.05" class="compact"></div>\r
        <div><label>Clamp</label><input id="p-clamp" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>In g</label><input id="p-ins" type="number" step="0.01" class="compact"></div>\r
        <div><label>Out g</label><input id="p-outs" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>In\u2194Out</label><input id="p-ivo" type="number" step="0.01" class="compact"></div>\r
        <div><label>Silver I</label><input id="p-sI" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Silver Exp</label><input id="p-sE" type="number" step="1" class="compact"></div>\r
        <div><label>Amb Out</label><input id="p-ambOut" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Amb Min</label><input id="p-ambMin" type="number" step="0.02" class="compact"></div>\r
        <div><label>Anvil</label><input id="p-anvil" type="number" step="0.02" class="compact"></div>\r
      </div>\r
\r
      <h2 style="margin-top:12px;font-size:13px;color:var(--fg2)">Tuning</h2>\r
\r
      <div class="row">\r
        <div><label>Max Steps</label><input id="t-maxSteps" type="number" step="1" class="compact"></div>\r
        <div><label>Min Step</label><input id="t-minStep" type="number" step="0.001" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Max Step</label><input id="t-maxStep" type="number" step="0.01" class="compact"></div>\r
        <div><label>Sun Steps</label><input id="t-sunSteps" type="number" step="1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Phase Jitter</label><input id="t-phaseJitter" type="number" step="0.01" class="compact"></div>\r
        <div><label>Step Jitter</label><input id="t-stepJitter" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Base Jitter Frac</label><input id="t-baseJitter" type="number" step="0.01" class="compact"></div>\r
        <div><label>Top Jitter Frac</label><input id="t-topJitter" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>LOD Bias Weather</label><input id="t-lodBiasWeather" type="number" step="0.1" class="compact"></div>\r
        <div><label>Near Fluff Dist</label><input id="t-nearFluffDist" type="number" step="1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Near Density Mult</label><input id="t-nearDensityMult" type="number" step="0.1" class="compact"></div>\r
        <div><label>Far Start</label><input id="t-farStart" type="number" step="10" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Far Full</label><input id="t-farFull" type="number" step="10" class="compact"></div>\r
        <div><label>Ray Smooth Dens</label><input id="t-raySmoothDens" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Ray Smooth Sun</label><input id="t-raySmoothSun" type="number" step="0.01" class="compact"></div>\r
        <div></div>\r
      </div>\r
    </div>\r
\r
    <!-- Preview -->\r
    <div class="panel" id="p-preview">\r
      <h2>Preview (World camera)</h2>\r
\r
      <div class="row">\r
        <div><label>Cam X</label><input id="v-cx" type="number" step="0.05" class="compact"></div>\r
        <div><label>Cam Y</label><input id="v-cy" type="number" step="0.05" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Cam Z</label><input id="v-cz" type="number" step="0.05" class="compact"></div>\r
        <div><label>FOV Y (deg)</label><input id="v-fov" type="number" step="1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Yaw (deg)</label><input id="v-yaw" type="number" step="1" class="compact"></div>\r
        <div><label>Pitch (deg)</label><input id="v-pitch" type="number" step="1" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Exposure</label><input id="v-exposure" type="number" step="0.05" class="compact"></div>\r
        <div></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Sky R</label><input id="v-sr" type="number" step="0.01" class="compact"></div>\r
        <div><label>Sky G</label><input id="v-sg" type="number" step="0.01" class="compact"></div>\r
      </div>\r
\r
      <div class="row">\r
        <div><label>Sky B</label><input id="v-sb" type="number" step="0.01" class="compact"></div>\r
        <div><label>Sun Bloom</label><input id="v-sbloom" type="number" step="0.05" class="compact" disabled></div>\r
      </div>\r
    </div>\r
\r
    <!-- Slice -->\r
    <div class="panel">\r
      <h2>Slice</h2>\r
      <input id="slice" type="range" min="0" max="127" value="0">\r
      <small>Slice: <span id="sliceLabel">0</span> / 127</small>\r
    </div>\r
\r
    <!-- Debug canvases -->\r
    <div class="panel dbg" id="dbgWrap">\r
      <div class="slot">\r
        <div>Weather 2D (R)</div><canvas id="dbg-weather"></canvas>\r
      </div>\r
      <div class="slot">\r
        <div>Weather 2D (G)</div><canvas id="dbg-weather-g"></canvas>\r
      </div>\r
      <div class="slot">\r
        <div>Shape128 - R channel</div><canvas id="dbg-r"></canvas>\r
      </div>\r
      <div class="slot">\r
        <div>Detail32 - R channel</div><canvas id="dbg-g"></canvas>\r
      </div>\r
      <div class="slot">\r
        <div>Blue Noise 2D</div><canvas id="dbg-blue"></canvas>\r
      </div>\r
    </div>\r
\r
  </aside>\r
\r
  <canvas id="gpuCanvas"></canvas>\r
\r
  <div id="busyOverlay">\r
    <div class="box" id="busyMsg">Working...</div>\r
  </div>\r
\r
</body>\r
\r
</html>\r
`;var H={},U;if(typeof process<"u")try{typeof H<"u"&&(globalThis.__filename=fileURLToPath(H.url),globalThis.__dirname=fileURLToPath(new URL(".",H.url))),U=ve("path").join(process.cwd(),__dirname,"dist","cloudTest.worker.js")}catch{}else{let t=globalThis.location.href.split("/");t.pop(),t=t.join("/"),U=t+"/dist/cloudTest.worker.js"}var te=U;var X,be=128,he=32,we=512,fe=512,ge=256,ye=256,xe=224,Se=()=>Math.max(1,Math.floor(window.devicePixelRatio||1)),Q=[],v={cam:{x:-1,y:0,z:-1,yawDeg:35,pitchDeg:1,fovYDeg:60},exposure:1.35,sky:[.55,.7,.95],layer:0,sun:{azDeg:45,elDeg:22,bloom:0}},r={mode:"computeFBM",seed:123456789e3,zoom:2,freq:1,octaves:5,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:0,edgeK:0,warpAmp:0},n={enabled:!0,mode:"computeBillow",seed:123456789e3,scale:1,zoom:2,freq:1.5,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:0,edgeK:0,warpAmp:0},i={seed:Date.now()>>>0,zoom:4,freq:1,octaves:2,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:7,edgeK:0,warpAmp:0,baseModeA:"computePerlin4D",baseModeB:"computeAntiWorley4D",bandMode2:"computeWorley4D",bandMode3:"computeWorley4D",bandMode4:"computeWorley4D"},d={seed:Date.now()>>>0,zoom:4,freq:1,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:7,edgeK:0,warpAmp:0,mode1:"computeAntiWorley4D",mode2:"computeAntiWorley4D",mode3:"computeAntiWorley4D"},T={seed:(Date.now()&4294967295)>>>0},o={shapeOffset:[0,0,0],detailOffset:[0,0,0],shapeScale:.1,detailScale:1,shapeVel:[.2,0,0],detailVel:[-.02,0,0]},y=!1,N=1/4,O=!1,c=e=>document.getElementById(e),l=(e,t)=>{let s=c(e);if(!s)return t;let p=+s.value;return Number.isFinite(p)?p:t},E=(e,t)=>{let s=l(e,t);return(Number.isFinite(s)?Math.max(0,Math.floor(s)):t)>>>0},a=e=>{try{return JSON.parse(JSON.stringify(e))}catch{return Object.assign({},e)}};function j(...e){try{console.log("[UI]",...e)}catch{}}var Me=1,V=new Map;function h(e,t={},s=[]){return new Promise((p,m)=>{let b=Me++;V.set(b,{resolve:p,reject:m});try{X.postMessage({id:b,type:e,payload:t},s)}catch(u){V.delete(b),m(u)}})}async function $(e){return h("setTileTransforms",{tileTransforms:a(e)})}function Ae(e){return typeof e=="string"&&/4D/.test(e)}function ie(e){return typeof e!="string"||!e||e==="clearTexture"||e==="computeGauss5x5"||e==="computeNormal"||e==="computeNormal8"||e==="computeSphereNormal"||e==="computeNormalVolume"}function Pe(e){let t=String(e||"");return t?t.startsWith("compute")&&t.slice(7)||t:"Unknown"}function ke(){return Q.filter(e=>!ie(e))}function De(){return Q.filter(e=>!ie(e)&&Ae(e))}function A(e,t,s,p={}){let m=c(e);if(!m)return;let b=!!p.allowNone;if(m.innerHTML="",b){let w=document.createElement("option");w.value="",w.textContent="None",m.appendChild(w)}let u=Array.isArray(t)?t:[];for(let w of u){let M=document.createElement("option");M.value=w,M.textContent=Pe(w),m.appendChild(M)}let g=u.includes(s);m.value=g?s:b?"":u[0]||""}function P(e,t){let s=c(e);return s&&String(s.value||"")||t}var R=null;function oe(e,t){if(!t)return!0;let s=Object.keys(e),p=Object.keys(t);if(s.length!==p.length)return!0;for(let m of s)if(e[m]!==t[m])return!0;return!1}function de(e){return Object.assign({},e)}function ne(){return{maxSteps:+(c("t-maxSteps")?.value||256)|0,minStep:+(c("t-minStep")?.value||.003),maxStep:+(c("t-maxStep")?.value||.1),sunSteps:+(c("t-sunSteps")?.value||4)|0,phaseJitter:+(c("t-phaseJitter")?.value||1),stepJitter:+(c("t-stepJitter")?.value||.08),baseJitterFrac:+(c("t-baseJitter")?.value||.15),topJitterFrac:+(c("t-topJitter")?.value||.1),lodBiasWeather:+(c("t-lodBiasWeather")?.value||1.5),nearFluffDist:+(c("t-nearFluffDist")?.value||60),nearDensityMult:+(c("t-nearDensityMult")?.value||2.5),farStart:+(c("t-farStart")?.value||800),farFull:+(c("t-farFull")?.value||2500),raySmoothDens:+(c("t-raySmoothDens")?.value||.5),raySmoothSun:+(c("t-raySmoothSun")?.value||.5)}}async function re(e){return h("setTuning",{tuning:e})}function le(){try{let e=ne();if(!oe(e,R))return;re(e).then(t=>{R=de(e),t&&t.tuning&&j("worker ack tuning",t.tuning)}).catch(t=>{console.warn("sendTuningIfChanged: setTuningRPC failed",t)})}catch(e){console.warn("sendTuningIfChanged error",e)}}async function k(e=!1){let t=ne();if(!e&&!oe(t,R))return R;let s=await re(t);return R=de(t),s&&s.tuning&&j("worker ack tuning (now)",s.tuning),R}function D(){let e=l("c-az",v.sun.azDeg),t=l("c-el",v.sun.elDeg),s=l("c-bloom",v.sun.bloom);return v.sun.azDeg=e,v.sun.elDeg=t,v.sun.bloom=s,{globalCoverage:l("p-coverage",1),globalDensity:l("p-density",100),cloudAnvilAmount:l("p-anvil",.1),cloudBeer:l("p-beer",6),attenuationClamp:l("p-clamp",.15),inScatterG:l("p-ins",.7),silverIntensity:l("p-sI",.25),silverExponent:l("p-sE",16),outScatterG:l("p-outs",.2),inVsOut:l("p-ivo",.3),outScatterAmbientAmt:l("p-ambOut",1),ambientMinimum:l("p-ambMin",.25),sunColor:[1,.8,.5],sunAzDeg:e,sunElDeg:t,sunBloom:s}}function K(){r.mode=P("we-mode",r.mode),r.seed=E("we-seed",r.seed),r.zoom=l("we-zoom",r.zoom),r.freq=l("we-freq",r.freq),r.octaves=Math.max(1,l("we-oct",r.octaves)|0),r.lacunarity=l("we-lac",r.lacunarity),r.gain=l("we-gain",r.gain),r.threshold=l("we-thr",r.threshold),r.seedAngle=l("we-seedAngle",r.seedAngle),r.time=l("we-time",r.time),r.voroMode=E("we-voroMode",r.voroMode),r.edgeK=l("we-edgeK",r.edgeK),r.warpAmp=l("we-warpAmp",r.warpAmp)}function I(){n.enabled=!!c("we-billow-enable")?.checked,n.mode=P("we-billow-mode",n.mode),n.seed=E("we-billow-seed",n.seed),n.scale=l("we-billow-scale",n.scale),n.zoom=l("we-billow-zoom",n.zoom),n.freq=l("we-billow-freq",n.freq),n.octaves=Math.max(1,l("we-billow-oct",n.octaves)|0),n.lacunarity=l("we-billow-lac",n.lacunarity),n.gain=l("we-billow-gain",n.gain),n.threshold=l("we-billow-thr",n.threshold),n.seedAngle=l("we-billow-seedAngle",n.seedAngle),n.time=l("we-billow-time",n.time),n.voroMode=E("we-billow-voroMode",n.voroMode),n.edgeK=l("we-billow-edgeK",n.edgeK),n.warpAmp=l("we-billow-warpAmp",n.warpAmp)}function J(){T.seed=E("bn-seed",T.seed)}function G(){i.baseModeA=P("sh-mode-a",i.baseModeA),i.baseModeB=P("sh-mode-b",i.baseModeB),i.bandMode2=P("sh-mode-2",i.bandMode2),i.bandMode3=P("sh-mode-3",i.bandMode3),i.bandMode4=P("sh-mode-4",i.bandMode4),i.seed=E("sh-seed",i.seed),i.zoom=l("sh-zoom",i.zoom),i.freq=l("sh-freq",i.freq),i.octaves=Math.max(1,l("sh-oct",i.octaves)|0),i.lacunarity=l("sh-lac",i.lacunarity),i.gain=l("sh-gain",i.gain),i.threshold=l("sh-thr",i.threshold),i.seedAngle=l("sh-seedAngle",i.seedAngle),i.time=l("sh-time",i.time),i.voroMode=E("sh-voroMode",i.voroMode),i.edgeK=l("sh-edgeK",i.edgeK),i.warpAmp=l("sh-warpAmp",i.warpAmp)}function W(){o.shapeScale=l("sh-scale",o.shapeScale),o.shapeOffset[0]=l("sh-pos-x",o.shapeOffset[0]),o.shapeOffset[1]=l("sh-pos-y",o.shapeOffset[1]),o.shapeOffset[2]=l("sh-pos-z",o.shapeOffset[2]),o.shapeVel=o.shapeVel||[0,0,0],o.shapeVel[0]=l("sh-vel-x",o.shapeVel[0]),o.shapeVel[1]=l("sh-vel-y",o.shapeVel[1]),o.shapeVel[2]=l("sh-vel-z",o.shapeVel[2])}function _(){d.mode1=P("de-mode-1",d.mode1),d.mode2=P("de-mode-2",d.mode2),d.mode3=P("de-mode-3",d.mode3),d.seed=E("de-seed",d.seed),d.zoom=l("de-zoom",d.zoom),d.freq=l("de-freq",d.freq),d.octaves=Math.max(1,l("de-oct",d.octaves)|0),d.lacunarity=l("de-lac",d.lacunarity),d.gain=l("de-gain",d.gain),d.threshold=l("de-thr",d.threshold),d.seedAngle=l("de-seedAngle",d.seedAngle),d.time=l("de-time",d.time),d.voroMode=E("de-voroMode",d.voroMode),d.edgeK=l("de-edgeK",d.edgeK),d.warpAmp=l("de-warpAmp",d.warpAmp)}function q(){o.detailScale=l("de-scale",o.detailScale),o.detailOffset[0]=l("de-pos-x",o.detailOffset[0]),o.detailOffset[1]=l("de-pos-y",o.detailOffset[1]),o.detailOffset[2]=l("de-pos-z",o.detailOffset[2]),o.detailVel=o.detailVel||[0,0,0],o.detailVel[0]=l("de-vel-x",o.detailVel[0]),o.detailVel[1]=l("de-vel-y",o.detailVel[1]),o.detailVel[2]=l("de-vel-z",o.detailVel[2])}function F(){v.cam.x=l("v-cx",v.cam.x),v.cam.y=l("v-cy",v.cam.y),v.cam.z=l("v-cz",v.cam.z),v.cam.yawDeg=l("v-yaw",v.cam.yawDeg),v.cam.pitchDeg=l("v-pitch",v.cam.pitchDeg),v.cam.fovYDeg=l("v-fov",v.cam.fovYDeg),v.exposure=l("v-exposure",v.exposure),v.sky[0]=l("v-sr",v.sky[0]),v.sky[1]=l("v-sg",v.sky[1]),v.sky[2]=l("v-sb",v.sky[2])}function ze(e){return!e||e<=0?1:Math.max(1,Math.round(1/Math.sqrt(e)))}function S(){let e=!!y,t=N;return{enabled:e,scale:t,coarseFactor:ze(t)}}function z(e){if(!e)return e;if(e.reproj&&typeof e.reproj.coarseFactor=="number")e.coarseFactor=e.reproj.coarseFactor;else if(y){let t=S();e.reproj=e.reproj||t,e.coarseFactor=t.coarseFactor}else e.coarseFactor=e.coarseFactor||4;return e}function L(e,t){for(let s of e){let p=c(s);p&&(p.addEventListener("input",t),p.addEventListener("change",t))}}function Te(){let e=Array.from(document.querySelectorAll('input[id^="t-"], select[id^="t-"], textarea[id^="t-"]'));e.length&&e.forEach(t=>{t.addEventListener("input",()=>{le()}),t.addEventListener("change",()=>{le()})})}async function x(e,t={},s={}){f(!0,"Baking...");try{await h(e,a(t)),await k(),F();let p=D(),m=Object.assign({weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:p},s||{});y&&(m.reproj=S()),z(m),await h("runFrame",m)}finally{f(!1)}}function f(e,t="Working..."){let s=c("busyOverlay"),p=c("busyMsg");s&&(p&&(p.textContent=t),s.style.display=e?"flex":"none",["bake-weather","bake-blue","bake-shape128","bake-detail32","rebake-all","render"].forEach(m=>{let b=c(m);b&&(b.disabled=e)}))}function Y(e,t){let s=Math.floor(Math.random()*1e4)>>>0,m=((Date.now()*Math.floor(Math.random()*1e4)^s)>>>0||1)>>>0;e.seed=m;let b=c(t);return b&&(b.value=String(m)),e.seed}function Ee(){return(+c("slice")?.value|0)>>>0}function ce(){let e=c("sliceLabel");e&&(e.textContent=String(Ee()))}function se(e){let t=(s,p)=>{let m=c(s);m&&(m.style.display=p?"":"none")};t("p-weather",e==="weather"),t("p-shape128",e==="shape128"),t("p-detail32",e==="detail32"),t("p-blue",e==="blue"),t("p-cloudParams",e==="clouds"),t("p-preview",e==="preview")}function pe(){let e=Se(),t=c("gpuCanvas"),s=Math.max(1,Math.round(t.clientWidth)),p=Math.max(1,Math.round(t.clientHeight)),m=Math.max(1,Math.floor(s*e)),b=Math.max(1,Math.floor(p*e)),u=Math.round(xe*e);h("resize",{main:{width:m,height:b},dbg:{width:u,height:u}}).catch(g=>console.warn("resize rpc failed",g))}function Ce(){let e=ke(),t=De();A("we-mode",e,r.mode,{allowNone:!1}),A("we-billow-mode",e,n.mode,{allowNone:!1}),A("sh-mode-a",t,i.baseModeA,{allowNone:!1}),A("sh-mode-b",t,i.baseModeB,{allowNone:!0}),A("sh-mode-2",t,i.bandMode2,{allowNone:!1}),A("sh-mode-3",t,i.bandMode3,{allowNone:!1}),A("sh-mode-4",t,i.bandMode4,{allowNone:!1}),A("de-mode-1",t,d.mode1,{allowNone:!1}),A("de-mode-2",t,d.mode2,{allowNone:!1}),A("de-mode-3",t,d.mode3,{allowNone:!1})}async function Fe(){c("pass")?.addEventListener("change",()=>se(c("pass").value)),se(c("pass")?.value||"preview");let e=c("reproj-anim-toggle"),t=c("fpsDisplay");y=!1,O=!1,e&&(e.textContent="Start x4 Anim"),t&&(t.textContent="-"),e?.addEventListener("click",async()=>{if(O){try{await h("stopLoop",{})}catch(p){console.warn("stopLoop failed",p)}O=!1,y=!1;try{await h("setReproj",{reproj:{enabled:!1,scale:N,coarseFactor:Math.round(1/N)},perf:null})}catch(p){console.warn("Failed unset reproj",p)}e&&(e.textContent="Start x4 Anim");let s=c("fpsDisplay");s&&(s.textContent="-")}else{y=!0;let s=S();try{await h("setReproj",{reproj:s,perf:null})}catch(m){console.warn("Failed setReproj",m)}F();let p=D();f(!0,"Seeding animation...");try{await k();let m={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:p,reproj:s};z(m),await h("runFrame",m),await h("startLoop",{}),O=!0,e&&(e.textContent="Stop Anim")}catch(m){console.warn("start animation failed",m),y=!1,O=!1;try{await h("setReproj",{reproj:{enabled:!1,scale:N,coarseFactor:Math.round(1/N)},perf:null})}catch{}e&&(e.textContent="Start x4 Anim")}finally{f(!1)}}}),c("render")?.addEventListener("click",async()=>{f(!0,"Rendering...");try{F();let s=D();await k();let p={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:s};y&&(p.reproj=S()),z(p);let{timings:m}=await h("runFrame",p);console.log("[BENCH] compute(ms):",m.computeMs.toFixed(2),"render(ms):",m.renderMs.toFixed(2),"total(ms):",m.totalMs.toFixed(2))}finally{f(!1)}}),L(["we-mode","we-seed","we-zoom","we-freq","we-oct","we-lac","we-gain","we-thr","we-seedAngle","we-time","we-voroMode","we-edgeK","we-warpAmp","we-billow-enable","we-billow-mode","we-billow-seed","we-billow-scale","we-billow-zoom","we-billow-freq","we-billow-oct","we-billow-lac","we-billow-gain","we-billow-thr","we-billow-seedAngle","we-billow-time","we-billow-voroMode","we-billow-edgeK","we-billow-warpAmp"],async()=>{K(),I(),await x("bakeWeather",{weatherParams:a(r),billowParams:a(n)})}),L(["bn-seed"],async()=>{J(),await x("bakeBlue",{blueParams:a(T)})}),L(["sh-mode-a","sh-mode-b","sh-mode-2","sh-mode-3","sh-mode-4","sh-seed","sh-zoom","sh-freq","sh-oct","sh-lac","sh-gain","sh-thr","sh-seedAngle","sh-time","sh-voroMode","sh-edgeK","sh-warpAmp"],async()=>{G(),W(),await x("bakeShape",{shapeParams:a(i),tileTransforms:a(o)})}),L(["sh-scale","sh-pos-x","sh-pos-y","sh-pos-z","sh-vel-x","sh-vel-y","sh-vel-z"],async()=>{try{W(),await $(o),await k(),F();let s=D(),p={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:s};y&&(p.reproj=S()),z(p),await h("runFrame",p)}catch(s){console.warn("shape transform update failed",s)}}),L(["de-mode-1","de-mode-2","de-mode-3","de-seed","de-zoom","de-freq","de-oct","de-lac","de-gain","de-thr","de-seedAngle","de-time","de-voroMode","de-edgeK","de-warpAmp"],async()=>{_(),q(),await x("bakeDetail",{detailParams:a(d),tileTransforms:a(o)})}),L(["de-scale","de-pos-x","de-pos-y","de-pos-z","de-vel-x","de-vel-y","de-vel-z"],async()=>{try{q(),await $(o),await k(),F();let s=D(),p={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:s};y&&(p.reproj=S()),z(p),await h("runFrame",p)}catch(s){console.warn("detail transform update failed",s)}});{let s=c("p-cloudParams");s&&s.querySelectorAll("input,select,textarea").forEach(p=>{p.addEventListener("input",async()=>{F();let m=D();await k();let b={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:m};y&&(b.reproj=S()),z(b);try{await h("runFrame",b)}catch(u){console.warn("runFrame failed (cloudParams)",u)}})})}{let s=c("p-preview");s&&s.querySelectorAll("input,select,textarea").forEach(p=>{p.addEventListener("input",async()=>{F();let m=D();await k();let b={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:m};y&&(b.reproj=S()),z(b);try{await h("runFrame",b)}catch(u){console.warn("runFrame failed (preview)",u)}})})}Te(),c("bake-weather")?.addEventListener("click",async()=>{K(),I(),await x("bakeWeather",{weatherParams:a(r),billowParams:a(n)})}),c("bake-blue")?.addEventListener("click",async()=>{J(),await x("bakeBlue",{blueParams:a(T)})}),c("bake-shape128")?.addEventListener("click",async()=>{G(),W(),await x("bakeShape",{shapeParams:a(i),tileTransforms:a(o)})}),c("bake-detail32")?.addEventListener("click",async()=>{_(),q(),await x("bakeDetail",{detailParams:a(d),tileTransforms:a(o)})}),c("rebake-all")?.addEventListener("click",async()=>{f(!0,"Rebaking all...");try{K(),I(),J(),G(),W(),_(),q(),await h("bakeAll",{weatherParams:a(r),billowParams:a(n),blueParams:a(T),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o)}),await k();let s=D(),p={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:s};y&&(p.reproj=S()),z(p),await h("runFrame",p)}finally{f(!1)}}),c("slice")?.addEventListener("input",()=>{ce(),h("setSlice",{slice:(+c("slice").value|0)>>>0}).catch(s=>console.warn("setSlice failed",s))}),c("seed-weather")?.addEventListener("click",async()=>{let s=Y(r,"we-seed");j("new weather seed",s),f(!0,"Seeding weather...");try{K(),I(),await x("bakeWeather",{weatherParams:a(r),billowParams:a(n)})}finally{f(!1)}}),c("seed-blue")?.addEventListener("click",async()=>{let s=Y(T,"bn-seed");j("new blue seed",s),f(!0,"Seeding blue...");try{J(),await x("bakeBlue",{blueParams:a(T)})}finally{f(!1)}}),c("seed-shape")?.addEventListener("click",async()=>{let s=Y(i,"sh-seed");j("new shape seed",s),f(!0,"Seeding shape...");try{G(),W(),await x("bakeShape",{shapeParams:a(i),tileTransforms:a(o)})}finally{f(!1)}}),c("seed-detail")?.addEventListener("click",async()=>{let s=Y(d,"de-seed");j("new detail seed",s),f(!0,"Seeding detail...");try{_(),q(),await x("bakeDetail",{detailParams:a(d),tileTransforms:a(o)})}finally{f(!1)}}),window.addEventListener("resize",()=>pe())}async function Be(){document.body.insertAdjacentHTML("beforeend",ae);let e=(u,g)=>{let w=c(u);w&&(w.type==="checkbox"?w.checked=!!g:w.value=String(g))};e("we-seed",r.seed),e("we-zoom",r.zoom),e("we-freq",r.freq),e("we-oct",r.octaves),e("we-lac",r.lacunarity),e("we-gain",r.gain),e("we-thr",r.threshold),e("we-seedAngle",r.seedAngle),e("we-time",r.time),e("we-voroMode",r.voroMode),e("we-edgeK",r.edgeK),e("we-warpAmp",r.warpAmp),e("we-billow-enable",n.enabled),e("we-billow-seed",n.seed),e("we-billow-scale",n.scale),e("we-billow-zoom",n.zoom),e("we-billow-freq",n.freq),e("we-billow-oct",n.octaves),e("we-billow-lac",n.lacunarity),e("we-billow-gain",n.gain),e("we-billow-thr",n.threshold),e("we-billow-seedAngle",n.seedAngle),e("we-billow-time",n.time),e("we-billow-voroMode",n.voroMode),e("we-billow-edgeK",n.edgeK),e("we-billow-warpAmp",n.warpAmp),e("bn-seed",T.seed),e("sh-seed",i.seed),e("sh-zoom",i.zoom),e("sh-freq",i.freq),e("sh-oct",i.octaves),e("sh-lac",i.lacunarity),e("sh-gain",i.gain),e("sh-thr",i.threshold),e("sh-seedAngle",i.seedAngle),e("sh-time",i.time),e("sh-voroMode",i.voroMode),e("sh-edgeK",i.edgeK),e("sh-warpAmp",i.warpAmp),e("sh-scale",o.shapeScale),e("sh-pos-x",o.shapeOffset[0]),e("sh-pos-y",o.shapeOffset[1]),e("sh-pos-z",o.shapeOffset[2]),e("sh-vel-x",o.shapeVel[0]),e("sh-vel-y",o.shapeVel[1]),e("sh-vel-z",o.shapeVel[2]),e("de-seed",d.seed),e("de-zoom",d.zoom),e("de-freq",d.freq),e("de-oct",d.octaves),e("de-lac",d.lacunarity),e("de-gain",d.gain),e("de-thr",d.threshold),e("de-seedAngle",d.seedAngle),e("de-time",d.time),e("de-voroMode",d.voroMode),e("de-edgeK",d.edgeK),e("de-warpAmp",d.warpAmp),e("de-scale",o.detailScale),e("de-pos-x",o.detailOffset[0]),e("de-pos-y",o.detailOffset[1]),e("de-pos-z",o.detailOffset[2]),e("de-vel-x",o.detailVel[0]),e("de-vel-y",o.detailVel[1]),e("de-vel-z",o.detailVel[2]),e("c-az",v.sun.azDeg),e("c-el",v.sun.elDeg),e("c-bloom",v.sun.bloom),e("p-coverage",1),e("p-density",100),e("p-beer",6),e("p-clamp",.15),e("p-ins",.7),e("p-outs",.2),e("p-ivo",.3),e("p-sI",.25),e("p-sE",16),e("p-ambOut",1),e("p-ambMin",.25),e("p-anvil",.1),e("t-maxSteps",256),e("t-minStep",.003),e("t-maxStep",.1),e("t-sunSteps",4),e("t-phaseJitter",1),e("t-stepJitter",.08),e("t-baseJitter",.15),e("t-topJitter",.1),e("t-lodBiasWeather",1.5),e("t-nearFluffDist",60),e("t-nearDensityMult",2.5),e("t-farStart",800),e("t-farFull",2500),e("t-raySmoothDens",.5),e("t-raySmoothSun",.5),e("v-cx",v.cam.x),e("v-cy",v.cam.y),e("v-cz",v.cam.z),e("v-fov",v.cam.fovYDeg),e("v-yaw",v.cam.yawDeg),e("v-pitch",v.cam.pitchDeg),e("v-exposure",v.exposure),e("v-sr",v.sky[0]),e("v-sg",v.sky[1]),e("v-sb",v.sky[2]),X=new Worker(te,{type:"module"}),X.onmessage=u=>{let{id:g,type:w,ok:M,data:Z,error:me}=u.data||{};if(g&&V.has(g)){let{resolve:C,reject:B}=V.get(g);return V.delete(g),M?C(Z):B(me||new Error("Worker error"))}if(w==="log"&&console.log(...Z||[]),w==="frame"){let C=Z||{},B=C.fps?Math.round(C.fps*100)/100:"-",ee=c("fpsDisplay");ee&&(ee.textContent=String(B))}if(w==="loop-stopped"){O=!1;let C=c("reproj-anim-toggle");C&&(C.textContent="Start x4 Anim");let B=c("fpsDisplay");B&&(B.textContent="-")}};let t=c("gpuCanvas"),s=["dbg-weather","dbg-weather-g","dbg-r","dbg-g","dbg-blue"],p=t.transferControlToOffscreen(),m=Object.fromEntries(s.map(u=>[u,c(u).transferControlToOffscreen()])),b=await h("init",{canvases:{main:p,dbg:{weather:m["dbg-weather"],weatherG:m["dbg-weather-g"],shapeR:m["dbg-r"],detailR:m["dbg-g"],blue:m["dbg-blue"]}},constants:{SHAPE_SIZE:be,DETAIL_SIZE:he,WEATHER_W:we,WEATHER_H:fe,BN_W:ge,BN_H:ye}},[p,m["dbg-weather"],m["dbg-weather-g"],m["dbg-r"],m["dbg-g"],m["dbg-blue"]]);Q=Array.isArray(b?.entryPoints)?b.entryPoints.slice():[],Ce();{let u=(g,w)=>{let M=c(g);M&&(M.value=String(w||""))};u("we-mode",r.mode),u("we-billow-mode",n.mode),u("sh-mode-a",i.baseModeA),u("sh-mode-b",i.baseModeB),u("sh-mode-2",i.bandMode2),u("sh-mode-3",i.bandMode3),u("sh-mode-4",i.bandMode4),u("de-mode-1",d.mode1),u("de-mode-2",d.mode2),u("de-mode-3",d.mode3)}pe();try{await $(o)}catch{}f(!0,"Initializing...");try{ce(),await h("bakeAll",{weatherParams:a(r),billowParams:a(n),blueParams:a(T),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o)}),await h("setReproj",{reproj:S(),perf:null});try{await k(!0)}catch(M){console.warn("initial sendTuningNow failed",M)}let u=D(),g={weatherParams:a(r),billowParams:a(n),shapeParams:a(i),detailParams:a(d),tileTransforms:a(o),preview:a(v),cloudParams:u};y&&(g.reproj=S()),z(g);let{timings:w}=await h("runFrame",g);console.log("[BENCH] init frame timings:",w)}finally{f(!1)}await Fe()}Be().catch(e=>{console.error(e);let t=document.createElement("pre");t.textContent=e&&e.stack?e.stack:String(e),document.body.appendChild(t)});})();
