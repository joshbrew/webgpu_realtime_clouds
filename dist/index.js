(()=>{var ue=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(s,i)=>(typeof require<"u"?require:s)[i]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var le=`<!-- tools/clouds/clouds.html -->\r
<!doctype html>\r
<html lang="en">\r
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
      * {\r
        box-sizing: border-box;\r
      }\r
\r
      html,\r
      body {\r
        margin: 0;\r
        height: 100%;\r
        background: var(--bg);\r
        color: var(--fg);\r
        font:\r
          14px/1.35 system-ui,\r
          -apple-system,\r
          "Segoe UI",\r
          Roboto,\r
          sans-serif;\r
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
      input,\r
      button {\r
        width: 100%;\r
        padding: 6px 8px;\r
        border-radius: 8px;\r
        border: 1px solid #26304a;\r
        background: #0b0f19;\r
        color: var(--fg);\r
      }\r
\r
      input[type="number"] {\r
        appearance: textfield;\r
      }\r
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
      .dbg .slot {\r
        margin-bottom: 14px;\r
      }\r
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
      small {\r
        color: #7f8cb0;\r
        font-size: 12px;\r
      }\r
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
    <aside id="sidebar">\r
      <h1>Pipeline</h1>\r
\r
      <div class="panel">\r
        <div style="display: flex; gap: 8px">\r
          <label for="pass">Controls:</label>\r
          <select id="pass" style="flex: 1">\r
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
        <div style="margin-top: 10px" class="inline">\r
          <div style="flex: 1">\r
            <label style="margin-bottom: 6px">Reproject &amp; Animate</label>\r
            <button id="reproj-anim-toggle">Start x4 Anim</button>\r
            <small class="hint"\r
              >Click to enable coarse x4 reprojection and start/stop the\r
              animation loop.</small\r
            >\r
          </div>\r
          <div style="width: 110px">\r
            <div style="margin-top: 6px; font-size: 12px; color: var(--fg2)">\r
              FPS: <span id="fpsDisplay">-</span>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <!-- Weather -->\r
      <div class="panel" id="p-weather">\r
        <h2>Weather 2D (R, G, B channels)</h2>\r
\r
        <div style="display: flex; gap: 8px; margin-bottom: 8px">\r
          <button id="bake-weather">Bake Weather</button>\r
          <button id="seed-weather">Seed Weather</button>\r
        </div>\r
\r
        <h2 style="margin-top: 8px; font-size: 13px; color: var(--fg2)">\r
          Base (R channel)\r
        </h2>\r
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
            <input id="we-seed" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Zoom</label\r
            ><input id="we-zoom" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Frequency</label\r
            ><input id="we-freq" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Octaves</label\r
            ><input id="we-oct" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Lacunarity</label\r
            ><input id="we-lac" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Gain</label\r
            ><input id="we-gain" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Threshold</label\r
            ><input id="we-thr" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Seed Angle</label\r
            ><input\r
              id="we-seedAngle"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Time</label\r
            ><input id="we-time" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Voro Mode (u32)</label\r
            ><input id="we-voroMode" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>EdgeK</label\r
            ><input id="we-edgeK" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Warp Amp</label\r
            ><input id="we-warpAmp" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div></div>\r
        </div>\r
\r
        <div class="divider">\r
          <h2 style="margin: 6px 0 8px; font-size: 13px; color: var(--fg2)">\r
            Secondary (G channel)\r
          </h2>\r
\r
          <div class="row">\r
            <div class="inline" style="gap: 10px">\r
              <input\r
                id="we-billow-enable"\r
                type="checkbox"\r
                class="compact"\r
                style="width: auto"\r
              />\r
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
            <div>\r
              <label>Seed (u32)</label\r
              ><input\r
                id="we-billow-seed"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Zoom</label\r
              ><input\r
                id="we-billow-zoom"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Frequency</label\r
              ><input\r
                id="we-billow-freq"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Octaves</label\r
              ><input\r
                id="we-billow-oct"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Lacunarity</label\r
              ><input\r
                id="we-billow-lac"\r
                type="number"\r
                step="0.1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Gain</label\r
              ><input\r
                id="we-billow-gain"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Threshold</label\r
              ><input\r
                id="we-billow-thr"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Seed Angle</label\r
              ><input\r
                id="we-billow-seedAngle"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Time</label\r
              ><input\r
                id="we-billow-time"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Voro Mode (u32)</label\r
              ><input\r
                id="we-billow-voroMode"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>EdgeK</label\r
              ><input\r
                id="we-billow-edgeK"\r
                type="number"\r
                step="0.1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Warp Amp</label\r
              ><input\r
                id="we-billow-warpAmp"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <small class="hint"\r
            >Weather modes list is populated from NoiseComputeBuilder entry\r
            points.</small\r
          >\r
        </div>\r
\r
        <div class="divider">\r
          <h2 style="margin: 6px 0 8px; font-size: 13px; color: var(--fg2)">\r
            Tertiary (B channel)\r
          </h2>\r
\r
          <div class="row">\r
            <div class="inline" style="gap: 10px">\r
              <input\r
                id="we-bandb-enable"\r
                type="checkbox"\r
                class="compact"\r
                style="width: auto"\r
              />\r
              <div class="smallLabel">Enable</div>\r
            </div>\r
            <div>\r
              <label>Mode</label>\r
              <select id="we-bandb-mode" class="compact">\r
                <option value="">Loading...</option>\r
              </select>\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Seed (u32)</label\r
              ><input\r
                id="we-bandb-seed"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Zoom</label\r
              ><input\r
                id="we-bandb-zoom"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Frequency</label\r
              ><input\r
                id="we-bandb-freq"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Octaves</label\r
              ><input\r
                id="we-bandb-oct"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Lacunarity</label\r
              ><input\r
                id="we-bandb-lac"\r
                type="number"\r
                step="0.1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Gain</label\r
              ><input\r
                id="we-bandb-gain"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Threshold</label\r
              ><input\r
                id="we-bandb-thr"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Seed Angle</label\r
              ><input\r
                id="we-bandb-seedAngle"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Time</label\r
              ><input\r
                id="we-bandb-time"\r
                type="number"\r
                step="0.01"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Voro Mode (u32)</label\r
              ><input\r
                id="we-bandb-voroMode"\r
                type="number"\r
                step="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>EdgeK</label\r
              ><input\r
                id="we-bandb-edgeK"\r
                type="number"\r
                step="0.1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="row">\r
            <div>\r
              <label>Warp Amp</label\r
              ><input\r
                id="we-bandb-warpAmp"\r
                type="number"\r
                step="0.05"\r
                class="compact"\r
              />\r
            </div>\r
            <div></div>\r
          </div>\r
\r
          <small class="hint"\r
            >Default is disabled. Toggle Enable to include this channel in the\r
            weather bake.</small\r
          >\r
        </div>\r
        <div class="divider">\r
          <h2 style="margin: 6px 0 8px; font-size: 13px; color: var(--fg2)">\r
            Weather Scale, Pos &amp; Axis Scale (XYZ)\r
          </h2>\r
\r
          <div class="row">\r
            <div>\r
              <label>Weather Scale</label\r
              ><input\r
                id="we-scale"\r
                type="number"\r
                step="0.0005"\r
                value="1.0"\r
                class="compact"\r
              />\r
            </div>\r
            <div></div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Weather Pos X</label\r
              ><input\r
                id="we-pos-x"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Weather Pos Y</label\r
              ><input\r
                id="we-pos-y"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Weather Pos Z</label\r
              ><input\r
                id="we-pos-z"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Weather Axis X</label\r
              ><input\r
                id="we-axis-x"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Weather Axis Y</label\r
              ><input\r
                id="we-axis-y"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Weather Axis Z</label\r
              ><input\r
                id="we-axis-z"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <small class="hint"\r
            >Transforms apply immediately without rebaking. Modes and noise\r
            params rebake.</small\r
          >\r
        </div>\r
      </div>\r
\r
      <!-- Blue Noise -->\r
      <div class="panel" id="p-blue">\r
        <h2>Blue Noise 2D</h2>\r
\r
        <div style="display: flex; gap: 8px; margin-bottom: 8px">\r
          <button id="bake-blue">Bake Blue Noise</button>\r
          <button id="seed-blue">Seed Blue</button>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Seed (u32)</label\r
            ><input id="bn-seed" type="number" step="1" class="compact" />\r
          </div>\r
          <div></div>\r
        </div>\r
      </div>\r
\r
      <!-- Shape128 -->\r
      <div class="panel" id="p-shape128">\r
        <h2>Shape128 RGBA</h2>\r
\r
        <div style="display: flex; gap: 8px; margin-bottom: 8px">\r
          <button id="bake-shape128">Bake Shape128</button>\r
          <button id="seed-shape">Seed Shape</button>\r
        </div>\r
\r
        <h2 style="margin-top: 8px; font-size: 13px; color: var(--fg2)">\r
          Modes (4D-only)\r
        </h2>\r
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
            <input id="sh-seed" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Zoom</label\r
            ><input id="sh-zoom" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Frequency</label\r
            ><input id="sh-freq" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Octaves</label\r
            ><input id="sh-oct" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Lacunarity</label\r
            ><input id="sh-lac" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Gain</label\r
            ><input id="sh-gain" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Threshold</label\r
            ><input id="sh-thr" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Seed Angle</label\r
            ><input\r
              id="sh-seedAngle"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Time</label\r
            ><input id="sh-time" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Voro Mode (u32)</label\r
            ><input id="sh-voroMode" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>EdgeK</label\r
            ><input id="sh-edgeK" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Warp Amp</label\r
            ><input id="sh-warpAmp" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="divider">\r
          <h2 style="margin: 6px 0 8px; font-size: 13px; color: var(--fg2)">\r
            Shape Scale, Pos &amp; Vel (XYZ)\r
          </h2>\r
\r
          <div class="row">\r
            <div>\r
              <label>Shape Scale</label\r
              ><input\r
                id="sh-scale"\r
                type="number"\r
                step="0.0005"\r
                value="0.1"\r
                class="compact"\r
              />\r
            </div>\r
            <div></div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Shape Pos X</label\r
              ><input\r
                id="sh-pos-x"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Pos Y</label\r
              ><input\r
                id="sh-pos-y"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Pos Z</label\r
              ><input\r
                id="sh-pos-z"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Shape Vel X</label\r
              ><input\r
                id="sh-vel-x"\r
                type="number"\r
                step="0.0001"\r
                value="0.2"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Vel Y</label\r
              ><input\r
                id="sh-vel-y"\r
                type="number"\r
                step="0.0001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Vel Z</label\r
              ><input\r
                id="sh-vel-z"\r
                type="number"\r
                step="0.0001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Shape Axis X</label\r
              ><input\r
                id="sh-axis-x"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Axis Y</label\r
              ><input\r
                id="sh-axis-y"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Shape Axis Z</label\r
              ><input\r
                id="sh-axis-z"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <small class="hint"\r
            >Transforms apply immediately without rebaking. Modes and noise\r
            params rebake.</small\r
          >\r
        </div>\r
      </div>\r
\r
      <!-- Detail32 -->\r
      <div class="panel" id="p-detail32">\r
        <h2>Detail32 RGB</h2>\r
\r
        <div style="display: flex; gap: 8px; margin-bottom: 8px">\r
          <button id="bake-detail32">Bake Detail32</button>\r
          <button id="seed-detail">Seed Detail</button>\r
        </div>\r
\r
        <h2 style="margin-top: 8px; font-size: 13px; color: var(--fg2)">\r
          Modes (4D-only)\r
        </h2>\r
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
            <input id="de-seed" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Zoom</label\r
            ><input id="de-zoom" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Frequency</label\r
            ><input id="de-freq" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Octaves</label\r
            ><input id="de-oct" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Lacunarity</label\r
            ><input id="de-lac" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Gain</label\r
            ><input id="de-gain" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Threshold</label\r
            ><input id="de-thr" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Seed Angle</label\r
            ><input\r
              id="de-seedAngle"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Time</label\r
            ><input id="de-time" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Voro Mode (u32)</label\r
            ><input id="de-voroMode" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>EdgeK</label\r
            ><input id="de-edgeK" type="number" step="0.1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Warp Amp</label\r
            ><input id="de-warpAmp" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div></div>\r
        </div>\r
\r
        <div class="divider">\r
          <h2 style="margin: 6px 0 8px; font-size: 13px; color: var(--fg2)">\r
            Detail Scale, Pos &amp; Vel (XYZ)\r
          </h2>\r
\r
          <div class="row">\r
            <div>\r
              <label>Detail Scale</label\r
              ><input\r
                id="de-scale"\r
                type="number"\r
                step="0.0005"\r
                value="1.0"\r
                class="compact"\r
              />\r
            </div>\r
            <div></div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Detail Pos X</label\r
              ><input\r
                id="de-pos-x"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Pos Y</label\r
              ><input\r
                id="de-pos-y"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Pos Z</label\r
              ><input\r
                id="de-pos-z"\r
                type="number"\r
                step="0.001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Detail Vel X</label\r
              ><input\r
                id="de-vel-x"\r
                type="number"\r
                step="0.0001"\r
                value="0.02"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Vel Y</label\r
              ><input\r
                id="de-vel-y"\r
                type="number"\r
                step="0.0001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Vel Z</label\r
              ><input\r
                id="de-vel-z"\r
                type="number"\r
                step="0.0001"\r
                value="0"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <div class="triple" style="margin-top: 8px">\r
            <div>\r
              <label>Detail Axis X</label\r
              ><input\r
                id="de-axis-x"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Axis Y</label\r
              ><input\r
                id="de-axis-y"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
            <div>\r
              <label>Detail Axis Z</label\r
              ><input\r
                id="de-axis-z"\r
                type="number"\r
                step="0.001"\r
                value="1"\r
                class="compact"\r
              />\r
            </div>\r
          </div>\r
\r
          <small class="hint"\r
            >Transforms apply immediately without rebaking. Modes and noise\r
            params rebake.</small\r
          >\r
        </div>\r
      </div>\r
\r
      <!-- Cloud Params + Tuning -->\r
      <div class="panel" id="p-cloudParams">\r
        <h2>Cloud Params</h2>\r
\r
        <div class="row">\r
          <div>\r
            <label>Sun Az (deg)</label\r
            ><input id="c-az" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Sun El (deg)</label\r
            ><input id="c-el" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Sun Bloom</label\r
            ><input id="c-bloom" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div></div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Coverage</label\r
            ><input id="p-coverage" type="number" step="0.02" class="compact" />\r
          </div>\r
          <div>\r
            <label>Density</label\r
            ><input id="p-density" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Beer \u03C3</label\r
            ><input id="p-beer" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Clamp</label\r
            ><input id="p-clamp" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>In g</label\r
            ><input id="p-ins" type="number" step="0.01" class="compact" />\r
          </div>\r
          <div>\r
            <label>Out g</label\r
            ><input id="p-outs" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>In\u2194Out</label\r
            ><input id="p-ivo" type="number" step="0.01" class="compact" />\r
          </div>\r
          <div>\r
            <label>Silver I</label\r
            ><input id="p-sI" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Silver Exp</label\r
            ><input id="p-sE" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Amb Out</label\r
            ><input id="p-ambOut" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Amb Min</label\r
            ><input id="p-ambMin" type="number" step="0.02" class="compact" />\r
          </div>\r
          <div>\r
            <label>Anvil</label\r
            ><input id="p-anvil" type="number" step="0.02" class="compact" />\r
          </div>\r
        </div>\r
\r
        <h2 style="margin-top: 12px; font-size: 13px; color: var(--fg2)">\r
          Tuning\r
        </h2>\r
\r
        <div class="row">\r
          <div>\r
            <label>Max Steps</label\r
            ><input id="t-maxSteps" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Min Step</label\r
            ><input id="t-minStep" type="number" step="0.001" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Max Step</label\r
            ><input id="t-maxStep" type="number" step="0.01" class="compact" />\r
          </div>\r
          <div>\r
            <label>Sun Steps</label\r
            ><input id="t-sunSteps" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Phase Jitter</label\r
            ><input\r
              id="t-phaseJitter"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Step Jitter</label\r
            ><input\r
              id="t-stepJitter"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Base Jitter Frac</label\r
            ><input\r
              id="t-baseJitter"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Top Jitter Frac</label\r
            ><input\r
              id="t-topJitter"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>LOD Bias Weather</label\r
            ><input\r
              id="t-lodBiasWeather"\r
              type="number"\r
              step="0.1"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Near Fluff Dist</label\r
            ><input\r
              id="t-nearFluffDist"\r
              type="number"\r
              step="1"\r
              class="compact"\r
            />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Near Density Mult</label\r
            ><input\r
              id="t-nearDensityMult"\r
              type="number"\r
              step="0.1"\r
              class="compact"\r
            />\r
          </div>\r
          <div>\r
            <label>Far Start</label\r
            ><input id="t-farStart" type="number" step="10" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Far Full</label\r
            ><input id="t-farFull" type="number" step="10" class="compact" />\r
          </div>\r
          <div>\r
            <label>Ray Smooth Dens</label\r
            ><input\r
              id="t-raySmoothDens"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Ray Smooth Sun</label\r
            ><input\r
              id="t-raySmoothSun"\r
              type="number"\r
              step="0.01"\r
              class="compact"\r
            />\r
          </div>\r
          <div></div>\r
        </div>\r
      </div>\r
\r
      <!-- Preview -->\r
      <div class="panel" id="p-preview">\r
        <h2>Preview (World camera)</h2>\r
\r
        <div class="row">\r
          <div>\r
            <label>Cam X</label\r
            ><input id="v-cx" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>Cam Y</label\r
            ><input id="v-cy" type="number" step="0.05" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Cam Z</label\r
            ><input id="v-cz" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div>\r
            <label>FOV Y (deg)</label\r
            ><input id="v-fov" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Yaw (deg)</label\r
            ><input id="v-yaw" type="number" step="1" class="compact" />\r
          </div>\r
          <div>\r
            <label>Pitch (deg)</label\r
            ><input id="v-pitch" type="number" step="1" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Exposure</label\r
            ><input id="v-exposure" type="number" step="0.05" class="compact" />\r
          </div>\r
          <div></div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Sky R</label\r
            ><input id="v-sr" type="number" step="0.01" class="compact" />\r
          </div>\r
          <div>\r
            <label>Sky G</label\r
            ><input id="v-sg" type="number" step="0.01" class="compact" />\r
          </div>\r
        </div>\r
\r
        <div class="row">\r
          <div>\r
            <label>Sky B</label\r
            ><input id="v-sb" type="number" step="0.01" class="compact" />\r
          </div>\r
          <div>\r
            <label>Sun Bloom</label\r
            ><input\r
              id="v-sbloom"\r
              type="number"\r
              step="0.05"\r
              class="compact"\r
              disabled\r
            />\r
          </div>\r
        </div>\r
      </div>\r
\r
      <!-- Slice -->\r
      <div class="panel">\r
        <h2>Slice</h2>\r
        <input id="slice" type="range" min="0" max="127" value="0" />\r
        <small>Slice: <span id="sliceLabel">0</span> / 127</small>\r
      </div>\r
\r
      <!-- Debug canvases -->\r
      <div class="panel dbg" id="dbgWrap">\r
        <div class="slot">\r
          <div>Weather 2D (R)</div>\r
          <canvas id="dbg-weather"></canvas>\r
        </div>\r
        <div class="slot">\r
          <div>Weather 2D (G)</div>\r
          <canvas id="dbg-weather-g"></canvas>\r
        </div>\r
        <div class="slot">\r
          <div>Weather 2D (B)</div>\r
          <canvas id="dbg-weather-b"></canvas>\r
        </div>\r
        <div class="slot">\r
          <div>Shape128 - R channel</div>\r
          <canvas id="dbg-r"></canvas>\r
        </div>\r
        <div class="slot">\r
          <div>Detail32 - R channel</div>\r
          <canvas id="dbg-g"></canvas>\r
        </div>\r
        <div class="slot">\r
          <div>Blue Noise 2D</div>\r
          <canvas id="dbg-blue"></canvas>\r
        </div>\r
      </div>\r
    </aside>\r
\r
    <canvas id="gpuCanvas"></canvas>\r
\r
    <div id="busyOverlay">\r
      <div class="box" id="busyMsg">Working...</div>\r
    </div>\r
  </body>\r
</html>\r
`;var $={},Q;if(typeof process<"u")try{typeof $<"u"&&(globalThis.__filename=fileURLToPath($.url),globalThis.__dirname=fileURLToPath(new URL(".",$.url))),Q=ue("path").join(process.cwd(),__dirname,"dist","cloudTest.worker.js")}catch{}else{let s=globalThis.location.href.split("/");s.pop(),s=s.join("/"),Q=s+"/dist/cloudTest.worker.js"}var se=Q;var ee,he=128,fe=32,ge=512,ye=512,xe=256,Se=256,Ae=224,Pe=()=>Math.max(1,Math.floor(window.devicePixelRatio||1)),ae=[],v={cam:{x:-1,y:0,z:-1,yawDeg:35,pitchDeg:1,fovYDeg:60},exposure:1.35,sky:[.55,.7,.95],layer:0,sun:{azDeg:45,elDeg:22,bloom:0}},p={mode:"computeFBM",seed:123456789e3,zoom:2,freq:1,octaves:5,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:0,edgeK:0,warpAmp:0},r={enabled:!0,mode:"computeBillow",seed:123456789e3,scale:1,zoom:2,freq:1.5,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:0,edgeK:0,warpAmp:0},c={enabled:!1,mode:"computeBillow",seed:123456789e3,scale:1,zoom:2,freq:1.5,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:0,edgeK:0,warpAmp:0},d={seed:Date.now()>>>0,zoom:4,freq:1,octaves:2,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:7,edgeK:0,warpAmp:0,baseModeA:"computePerlin4D",baseModeB:"computeAntiWorley4D",bandMode2:"computeWorley4D",bandMode3:"computeWorley4D",bandMode4:"computeWorley4D"},o={seed:Date.now()>>>0,zoom:4,freq:1,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,time:0,voroMode:7,edgeK:0,warpAmp:0,mode1:"computeAntiWorley4D",mode2:"computeAntiWorley4D",mode3:"computeAntiWorley4D"},E={seed:(Date.now()&4294967295)>>>0},a={shapeOffset:[0,0,0],detailOffset:[0,0,0],weatherOffset:[0,0,0],shapeScale:.1,detailScale:1,weatherScale:1,shapeAxisScale:[1,1,1],detailAxisScale:[1,1,1],weatherAxisScale:[1,1,1],shapeVel:[.2,0,0],detailVel:[-.02,0,0]},x=!1,N=1/4,L=!1,m=e=>document.getElementById(e),l=(e,s)=>{let i=m(e);if(!i)return s;let n=+i.value;return Number.isFinite(n)?n:s},z=(e,s)=>{let i=l(e,s);return(Number.isFinite(i)?Math.max(0,Math.floor(i)):s)>>>0},t=e=>{try{return JSON.parse(JSON.stringify(e))}catch{return Object.assign({},e)}};function q(...e){try{console.log("[UI]",...e)}catch{}}var Me=1,V=new Map;function h(e,s={},i=[]){return new Promise((n,b)=>{let w=Me++;V.set(w,{resolve:n,reject:b});try{ee.postMessage({id:w,type:e,payload:s},i)}catch(u){V.delete(w),b(u)}})}async function X(e){return h("setTileTransforms",{tileTransforms:t(e)})}function ze(e){return typeof e=="string"&&/4D/.test(e)}function oe(e){return typeof e!="string"||!e||e==="clearTexture"||e==="computeGauss5x5"||e==="computeNormal"||e==="computeNormal8"||e==="computeSphereNormal"||e==="computeNormalVolume"}function ke(e){let s=String(e||"");return s?s.startsWith("compute")&&s.slice(7)||s:"Unknown"}function De(){return ae.filter(e=>!oe(e))}function Be(){return ae.filter(e=>!oe(e)&&ze(e))}function P(e,s,i,n={}){let b=m(e);if(!b)return;let w=!!n.allowNone;if(b.innerHTML="",w){let f=document.createElement("option");f.value="",f.textContent="None",b.appendChild(f)}let u=Array.isArray(s)?s:[];for(let f of u){let k=document.createElement("option");k.value=f,k.textContent=ke(f),b.appendChild(k)}let y=u.includes(i);b.value=y?i:w?"":u[0]||""}function M(e,s){let i=m(e);return i&&String(i.value||"")||s}var j=null;function ne(e,s){if(!s)return!0;let i=Object.keys(e),n=Object.keys(s);if(i.length!==n.length)return!0;for(let b of i)if(e[b]!==s[b])return!0;return!1}function re(e){return Object.assign({},e)}function ce(){return{maxSteps:+(m("t-maxSteps")?.value||256)|0,minStep:+(m("t-minStep")?.value||.003),maxStep:+(m("t-maxStep")?.value||.1),sunSteps:+(m("t-sunSteps")?.value||4)|0,phaseJitter:+(m("t-phaseJitter")?.value||1),stepJitter:+(m("t-stepJitter")?.value||.08),baseJitterFrac:+(m("t-baseJitter")?.value||.15),topJitterFrac:+(m("t-topJitter")?.value||.1),lodBiasWeather:+(m("t-lodBiasWeather")?.value||1.5),nearFluffDist:+(m("t-nearFluffDist")?.value||60),nearDensityMult:+(m("t-nearDensityMult")?.value||2.5),farStart:+(m("t-farStart")?.value||800),farFull:+(m("t-farFull")?.value||2500),raySmoothDens:+(m("t-raySmoothDens")?.value||.5),raySmoothSun:+(m("t-raySmoothSun")?.value||.5)}}async function pe(e){return h("setTuning",{tuning:e})}function ie(){try{let e=ce();if(!ne(e,j))return;pe(e).then(s=>{j=re(e),s&&s.tuning&&q("worker ack tuning",s.tuning)}).catch(s=>{console.warn("sendTuningIfChanged: setTuningRPC failed",s)})}catch(e){console.warn("sendTuningIfChanged error",e)}}async function D(e=!1){let s=ce();if(!e&&!ne(s,j))return j;let i=await pe(s);return j=re(s),i&&i.tuning&&q("worker ack tuning (now)",i.tuning),j}function B(){let e=l("c-az",v.sun.azDeg),s=l("c-el",v.sun.elDeg),i=l("c-bloom",v.sun.bloom);return v.sun.azDeg=e,v.sun.elDeg=s,v.sun.bloom=i,{globalCoverage:l("p-coverage",1),globalDensity:l("p-density",100),cloudAnvilAmount:l("p-anvil",.1),cloudBeer:l("p-beer",6),attenuationClamp:l("p-clamp",.15),inScatterG:l("p-ins",.7),silverIntensity:l("p-sI",.25),silverExponent:l("p-sE",16),outScatterG:l("p-outs",.2),inVsOut:l("p-ivo",.3),outScatterAmbientAmt:l("p-ambOut",1),ambientMinimum:l("p-ambMin",.25),sunColor:[1,1,1],sunAzDeg:e,sunElDeg:s,sunBloom:i}}function I(){p.mode=M("we-mode",p.mode),p.seed=z("we-seed",p.seed),p.zoom=l("we-zoom",p.zoom),p.freq=l("we-freq",p.freq),p.octaves=Math.max(1,l("we-oct",p.octaves)|0),p.lacunarity=l("we-lac",p.lacunarity),p.gain=l("we-gain",p.gain),p.threshold=l("we-thr",p.threshold),p.seedAngle=l("we-seedAngle",p.seedAngle),p.time=l("we-time",p.time),p.voroMode=z("we-voroMode",p.voroMode),p.edgeK=l("we-edgeK",p.edgeK),p.warpAmp=l("we-warpAmp",p.warpAmp)}function J(){r.enabled=!!m("we-billow-enable")?.checked,r.mode=M("we-billow-mode",r.mode),r.seed=z("we-billow-seed",r.seed),r.zoom=l("we-billow-zoom",r.zoom),r.freq=l("we-billow-freq",r.freq),r.octaves=Math.max(1,l("we-billow-oct",r.octaves)|0),r.lacunarity=l("we-billow-lac",r.lacunarity),r.gain=l("we-billow-gain",r.gain),r.threshold=l("we-billow-thr",r.threshold),r.seedAngle=l("we-billow-seedAngle",r.seedAngle),r.time=l("we-billow-time",r.time),r.voroMode=z("we-billow-voroMode",r.voroMode),r.edgeK=l("we-billow-edgeK",r.edgeK),r.warpAmp=l("we-billow-warpAmp",r.warpAmp)}function G(){c.enabled=!!m("we-bandb-enable")?.checked,c.mode=M("we-bandb-mode",c.mode),c.seed=z("we-bandb-seed",c.seed),c.zoom=l("we-bandb-zoom",c.zoom),c.freq=l("we-bandb-freq",c.freq),c.octaves=Math.max(1,l("we-bandb-oct",c.octaves)|0),c.lacunarity=l("we-bandb-lac",c.lacunarity),c.gain=l("we-bandb-gain",c.gain),c.threshold=l("we-bandb-thr",c.threshold),c.seedAngle=l("we-bandb-seedAngle",c.seedAngle),c.time=l("we-bandb-time",c.time),c.voroMode=z("we-bandb-voroMode",c.voroMode),c.edgeK=l("we-bandb-edgeK",c.edgeK),c.warpAmp=l("we-bandb-warpAmp",c.warpAmp)}function Te(){a.weatherScale=l("we-scale",a.weatherScale),a.weatherOffset[0]=l("we-pos-x",a.weatherOffset[0]),a.weatherOffset[1]=l("we-pos-y",a.weatherOffset[1]),a.weatherOffset[2]=l("we-pos-z",a.weatherOffset[2]),a.weatherAxisScale=a.weatherAxisScale||[1,1,1],a.weatherAxisScale[0]=l("we-axis-x",a.weatherAxisScale[0]),a.weatherAxisScale[1]=l("we-axis-y",a.weatherAxisScale[1]),a.weatherAxisScale[2]=l("we-axis-z",a.weatherAxisScale[2])}function Z(){E.seed=z("bn-seed",E.seed)}function Y(){d.baseModeA=M("sh-mode-a",d.baseModeA),d.baseModeB=M("sh-mode-b",d.baseModeB),d.bandMode2=M("sh-mode-2",d.bandMode2),d.bandMode3=M("sh-mode-3",d.bandMode3),d.bandMode4=M("sh-mode-4",d.bandMode4),d.seed=z("sh-seed",d.seed),d.zoom=l("sh-zoom",d.zoom),d.freq=l("sh-freq",d.freq),d.octaves=Math.max(1,l("sh-oct",d.octaves)|0),d.lacunarity=l("sh-lac",d.lacunarity),d.gain=l("sh-gain",d.gain),d.threshold=l("sh-thr",d.threshold),d.seedAngle=l("sh-seedAngle",d.seedAngle),d.time=l("sh-time",d.time),d.voroMode=z("sh-voroMode",d.voroMode),d.edgeK=l("sh-edgeK",d.edgeK),d.warpAmp=l("sh-warpAmp",d.warpAmp)}function K(){a.shapeScale=l("sh-scale",a.shapeScale),a.shapeOffset[0]=l("sh-pos-x",a.shapeOffset[0]),a.shapeOffset[1]=l("sh-pos-y",a.shapeOffset[1]),a.shapeOffset[2]=l("sh-pos-z",a.shapeOffset[2]),a.shapeVel=a.shapeVel||[0,0,0],a.shapeVel[0]=l("sh-vel-x",a.shapeVel[0]),a.shapeVel[1]=l("sh-vel-y",a.shapeVel[1]),a.shapeVel[2]=l("sh-vel-z",a.shapeVel[2]),a.shapeAxisScale=a.shapeAxisScale||[1,1,1],a.shapeAxisScale[0]=l("sh-axis-x",a.shapeAxisScale[0]),a.shapeAxisScale[1]=l("sh-axis-y",a.shapeAxisScale[1]),a.shapeAxisScale[2]=l("sh-axis-z",a.shapeAxisScale[2])}function _(){o.mode1=M("de-mode-1",o.mode1),o.mode2=M("de-mode-2",o.mode2),o.mode3=M("de-mode-3",o.mode3),o.seed=z("de-seed",o.seed),o.zoom=l("de-zoom",o.zoom),o.freq=l("de-freq",o.freq),o.octaves=Math.max(1,l("de-oct",o.octaves)|0),o.lacunarity=l("de-lac",o.lacunarity),o.gain=l("de-gain",o.gain),o.threshold=l("de-thr",o.threshold),o.seedAngle=l("de-seedAngle",o.seedAngle),o.time=l("de-time",o.time),o.voroMode=z("de-voroMode",o.voroMode),o.edgeK=l("de-edgeK",o.edgeK),o.warpAmp=l("de-warpAmp",o.warpAmp)}function R(){a.detailScale=l("de-scale",a.detailScale),a.detailOffset[0]=l("de-pos-x",a.detailOffset[0]),a.detailOffset[1]=l("de-pos-y",a.detailOffset[1]),a.detailOffset[2]=l("de-pos-z",a.detailOffset[2]),a.detailVel=a.detailVel||[0,0,0],a.detailVel[0]=l("de-vel-x",a.detailVel[0]),a.detailVel[1]=l("de-vel-y",a.detailVel[1]),a.detailVel[2]=l("de-vel-z",a.detailVel[2]),a.detailAxisScale=a.detailAxisScale||[1,1,1],a.detailAxisScale[0]=l("de-axis-x",a.detailAxisScale[0]),a.detailAxisScale[1]=l("de-axis-y",a.detailAxisScale[1]),a.detailAxisScale[2]=l("de-axis-z",a.detailAxisScale[2])}function C(){v.cam.x=l("v-cx",v.cam.x),v.cam.y=l("v-cy",v.cam.y),v.cam.z=l("v-cz",v.cam.z),v.cam.yawDeg=l("v-yaw",v.cam.yawDeg),v.cam.pitchDeg=l("v-pitch",v.cam.pitchDeg),v.cam.fovYDeg=l("v-fov",v.cam.fovYDeg),v.exposure=l("v-exposure",v.exposure),v.sky[0]=l("v-sr",v.sky[0]),v.sky[1]=l("v-sg",v.sky[1]),v.sky[2]=l("v-sb",v.sky[2])}function Ee(e){return!e||e<=0?1:Math.max(1,Math.round(1/Math.sqrt(e)))}function A(){let e=!!x,s=N;return{enabled:e,scale:s,coarseFactor:Ee(s)}}function T(e){if(!e)return e;if(e.reproj&&typeof e.reproj.coarseFactor=="number")e.coarseFactor=e.reproj.coarseFactor;else if(x){let s=A();e.reproj=e.reproj||s,e.coarseFactor=s.coarseFactor}else e.coarseFactor=e.coarseFactor||4;return e}function O(e,s){for(let i of e){let n=m(i);n&&(n.addEventListener("input",s),n.addEventListener("change",s))}}function Ce(){let e=Array.from(document.querySelectorAll('input[id^="t-"], select[id^="t-"], textarea[id^="t-"]'));e.length&&e.forEach(s=>{s.addEventListener("input",()=>{ie()}),s.addEventListener("change",()=>{ie()})})}async function S(e,s={},i={}){g(!0,"Baking...");try{await h(e,t(s)),await D(),C();let n=B(),b=Object.assign({weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:n},i||{});x&&(b.reproj=A()),T(b),await h("runFrame",b)}finally{g(!1)}}function g(e,s="Working..."){let i=m("busyOverlay"),n=m("busyMsg");i&&(n&&(n.textContent=s),i.style.display=e?"flex":"none",["bake-weather","bake-blue","bake-shape128","bake-detail32","rebake-all","render"].forEach(b=>{let w=m(b);w&&(w.disabled=e)}))}function H(e,s){let i=Math.floor(Math.random()*1e4)>>>0,b=((Date.now()*Math.floor(Math.random()*1e4)^i)>>>0||1)>>>0;e.seed=b;let w=m(s);return w&&(w.value=String(b)),e.seed}function Fe(){return(+m("slice")?.value|0)>>>0}function me(){let e=m("sliceLabel");e&&(e.textContent=String(Fe()))}function de(e){let s=(i,n)=>{let b=m(i);b&&(b.style.display=n?"":"none")};s("p-weather",e==="weather"),s("p-shape128",e==="shape128"),s("p-detail32",e==="detail32"),s("p-blue",e==="blue"),s("p-cloudParams",e==="clouds"),s("p-preview",e==="preview")}function be(){let e=Pe(),s=m("gpuCanvas"),i=Math.max(1,Math.round(s.clientWidth)),n=Math.max(1,Math.round(s.clientHeight)),b=Math.max(1,Math.floor(i*e)),w=Math.max(1,Math.floor(n*e)),u=Math.round(Ae*e);h("resize",{main:{width:b,height:w},dbg:{width:u,height:u}}).catch(y=>console.warn("resize rpc failed",y))}function Oe(){let e=De(),s=Be();P("we-mode",e,p.mode,{allowNone:!1}),P("we-billow-mode",e,r.mode,{allowNone:!1}),P("we-bandb-mode",e,c.mode,{allowNone:!1}),P("sh-mode-a",s,d.baseModeA,{allowNone:!1}),P("sh-mode-b",s,d.baseModeB,{allowNone:!0}),P("sh-mode-2",s,d.bandMode2,{allowNone:!1}),P("sh-mode-3",s,d.bandMode3,{allowNone:!1}),P("sh-mode-4",s,d.bandMode4,{allowNone:!1}),P("de-mode-1",s,o.mode1,{allowNone:!1}),P("de-mode-2",s,o.mode2,{allowNone:!1}),P("de-mode-3",s,o.mode3,{allowNone:!1})}async function We(){m("pass")?.addEventListener("change",()=>de(m("pass").value)),de(m("pass")?.value||"preview");let e=m("reproj-anim-toggle"),s=m("fpsDisplay");x=!1,L=!1,e&&(e.textContent="Start x4 Anim"),s&&(s.textContent="-"),e?.addEventListener("click",async()=>{if(L){try{await h("stopLoop",{})}catch(n){console.warn("stopLoop failed",n)}L=!1,x=!1;try{await h("setReproj",{reproj:{enabled:!1,scale:N,coarseFactor:Math.round(1/N)},perf:null})}catch(n){console.warn("Failed unset reproj",n)}e&&(e.textContent="Start x4 Anim");let i=m("fpsDisplay");i&&(i.textContent="-")}else{x=!0;let i=A();try{await h("setReproj",{reproj:i,perf:null})}catch(b){console.warn("Failed setReproj",b)}C();let n=B();g(!0,"Seeding animation...");try{await D();let b={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:n,reproj:i};T(b),await h("runFrame",b),await h("startLoop",{}),L=!0,e&&(e.textContent="Stop Anim")}catch(b){console.warn("start animation failed",b),x=!1,L=!1;try{await h("setReproj",{reproj:{enabled:!1,scale:N,coarseFactor:Math.round(1/N)},perf:null})}catch{}e&&(e.textContent="Start x4 Anim")}finally{g(!1)}}}),m("render")?.addEventListener("click",async()=>{g(!0,"Rendering...");try{C();let i=B();await D();let n={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:i};x&&(n.reproj=A()),T(n);let{timings:b}=await h("runFrame",n);console.log("[BENCH] compute(ms):",b.computeMs.toFixed(2),"render(ms):",b.renderMs.toFixed(2),"total(ms):",b.totalMs.toFixed(2))}finally{g(!1)}}),O(["we-mode","we-seed","we-zoom","we-freq","we-oct","we-lac","we-gain","we-thr","we-seedAngle","we-time","we-voroMode","we-edgeK","we-warpAmp","we-billow-enable","we-billow-mode","we-billow-seed","we-billow-zoom","we-billow-freq","we-billow-oct","we-billow-lac","we-billow-gain","we-billow-thr","we-billow-seedAngle","we-billow-time","we-billow-voroMode","we-billow-edgeK","we-billow-warpAmp","we-bandb-enable","we-bandb-mode","we-bandb-seed","we-bandb-zoom","we-bandb-freq","we-bandb-oct","we-bandb-lac","we-bandb-gain","we-bandb-thr","we-bandb-seedAngle","we-bandb-time","we-bandb-voroMode","we-bandb-edgeK","we-bandb-warpAmp"],async()=>{I(),J(),G(),await S("bakeWeather",{weatherParams:t(p),billowParams:t(r),weatherBParams:t(c)})}),O(["we-scale","we-pos-x","we-pos-y","we-pos-z","we-axis-x","we-axis-y","we-axis-z"],async()=>{try{Te(),await X(a),await D(),C();let i=B(),n={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:i};x&&(n.reproj=A()),T(n),await h("runFrame",n)}catch(i){console.warn("weather transform update failed",i)}}),O(["bn-seed"],async()=>{Z(),await S("bakeBlue",{blueParams:t(E)})}),O(["sh-mode-a","sh-mode-b","sh-mode-2","sh-mode-3","sh-mode-4","sh-seed","sh-zoom","sh-freq","sh-oct","sh-lac","sh-gain","sh-thr","sh-seedAngle","sh-time","sh-voroMode","sh-edgeK","sh-warpAmp"],async()=>{Y(),K(),await S("bakeShape",{shapeParams:t(d),tileTransforms:t(a)})}),O(["de-mode-1","de-mode-2","de-mode-3","de-seed","de-zoom","de-freq","de-oct","de-lac","de-gain","de-thr","de-seedAngle","de-time","de-voroMode","de-edgeK","de-warpAmp"],async()=>{_(),R(),await S("bakeDetail",{detailParams:t(o),tileTransforms:t(a)})}),O(["sh-scale","sh-pos-x","sh-pos-y","sh-pos-z","sh-vel-x","sh-vel-y","sh-vel-z","sh-axis-x","sh-axis-y","sh-axis-z"],async()=>{try{K(),await X(a),await D(),C();let i=B(),n={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:i};x&&(n.reproj=A()),T(n),await h("runFrame",n)}catch(i){console.warn("shape transform update failed",i)}}),O(["de-scale","de-pos-x","de-pos-y","de-pos-z","de-vel-x","de-vel-y","de-vel-z","de-axis-x","de-axis-y","de-axis-z"],async()=>{try{R(),await X(a),await D(),C();let i=B(),n={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:i};x&&(n.reproj=A()),T(n),await h("runFrame",n)}catch(i){console.warn("detail transform update failed",i)}});{let i=m("p-cloudParams");i&&i.querySelectorAll("input,select,textarea").forEach(n=>{n.addEventListener("input",async()=>{C();let b=B();await D();let w={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:b};x&&(w.reproj=A()),T(w);try{await h("runFrame",w)}catch(u){console.warn("runFrame failed (cloudParams)",u)}})})}{let i=m("p-preview");i&&i.querySelectorAll("input,select,textarea").forEach(n=>{n.addEventListener("input",async()=>{C();let b=B();await D();let w={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:b};x&&(w.reproj=A()),T(w);try{await h("runFrame",w)}catch(u){console.warn("runFrame failed (preview)",u)}})})}Ce(),m("bake-weather")?.addEventListener("click",async()=>{I(),J(),G(),await S("bakeWeather",{weatherParams:t(p),billowParams:t(r),weatherBParams:t(c)})}),m("bake-blue")?.addEventListener("click",async()=>{Z(),await S("bakeBlue",{blueParams:t(E)})}),m("bake-shape128")?.addEventListener("click",async()=>{Y(),K(),await S("bakeShape",{shapeParams:t(d),tileTransforms:t(a)})}),m("bake-detail32")?.addEventListener("click",async()=>{_(),R(),await S("bakeDetail",{detailParams:t(o),tileTransforms:t(a)})}),m("rebake-all")?.addEventListener("click",async()=>{g(!0,"Rebaking all...");try{I(),J(),G(),Z(),Y(),K(),_(),R(),await h("bakeAll",{weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),blueParams:t(E),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a)}),await D();let i=B(),n={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:i};x&&(n.reproj=A()),T(n),await h("runFrame",n)}finally{g(!1)}}),m("slice")?.addEventListener("input",()=>{me(),h("setSlice",{slice:(+m("slice").value|0)>>>0}).catch(i=>console.warn("setSlice failed",i))}),m("seed-weather")?.addEventListener("click",async()=>{let i=H(p,"we-seed");q("new weather seed",i),g(!0,"Seeding weather...");try{I(),J(),G(),await S("bakeWeather",{weatherParams:t(p),billowParams:t(r),weatherBParams:t(c)})}finally{g(!1)}}),m("seed-blue")?.addEventListener("click",async()=>{let i=H(E,"bn-seed");q("new blue seed",i),g(!0,"Seeding blue...");try{Z(),await S("bakeBlue",{blueParams:t(E)})}finally{g(!1)}}),m("seed-shape")?.addEventListener("click",async()=>{let i=H(d,"sh-seed");q("new shape seed",i),g(!0,"Seeding shape...");try{Y(),K(),await S("bakeShape",{shapeParams:t(d),tileTransforms:t(a)})}finally{g(!1)}}),m("seed-detail")?.addEventListener("click",async()=>{let i=H(o,"de-seed");q("new detail seed",i),g(!0,"Seeding detail...");try{_(),R(),await S("bakeDetail",{detailParams:t(o),tileTransforms:t(a)})}finally{g(!1)}}),window.addEventListener("resize",()=>be())}async function Le(){document.body.insertAdjacentHTML("beforeend",le);let e=(u,y)=>{let f=m(u);f&&(f.type==="checkbox"?f.checked=!!y:f.value=String(y))};e("we-seed",p.seed),e("we-zoom",p.zoom),e("we-freq",p.freq),e("we-oct",p.octaves),e("we-lac",p.lacunarity),e("we-gain",p.gain),e("we-thr",p.threshold),e("we-seedAngle",p.seedAngle),e("we-time",p.time),e("we-voroMode",p.voroMode),e("we-edgeK",p.edgeK),e("we-warpAmp",p.warpAmp),e("we-billow-enable",r.enabled),e("we-billow-seed",r.seed),e("we-billow-zoom",r.zoom),e("we-billow-freq",r.freq),e("we-billow-oct",r.octaves),e("we-billow-lac",r.lacunarity),e("we-billow-gain",r.gain),e("we-billow-thr",r.threshold),e("we-billow-seedAngle",r.seedAngle),e("we-billow-time",r.time),e("we-billow-voroMode",r.voroMode),e("we-billow-edgeK",r.edgeK),e("we-billow-warpAmp",r.warpAmp),e("we-scale",a.weatherScale),e("we-pos-x",a.weatherOffset[0]),e("we-pos-y",a.weatherOffset[1]),e("we-pos-z",a.weatherOffset[2]),e("we-axis-x",a.weatherAxisScale[0]),e("we-axis-y",a.weatherAxisScale[1]),e("we-axis-z",a.weatherAxisScale[2]),e("sh-axis-x",a.shapeAxisScale[0]),e("sh-axis-y",a.shapeAxisScale[1]),e("sh-axis-z",a.shapeAxisScale[2]),e("de-axis-x",a.detailAxisScale[0]),e("de-axis-y",a.detailAxisScale[1]),e("de-axis-z",a.detailAxisScale[2]),e("we-bandb-enable",c.enabled),e("we-bandb-seed",c.seed),e("we-bandb-zoom",c.zoom),e("we-bandb-freq",c.freq),e("we-bandb-oct",c.octaves),e("we-bandb-lac",c.lacunarity),e("we-bandb-gain",c.gain),e("we-bandb-thr",c.threshold),e("we-bandb-seedAngle",c.seedAngle),e("we-bandb-time",c.time),e("we-bandb-voroMode",c.voroMode),e("we-bandb-edgeK",c.edgeK),e("we-bandb-warpAmp",c.warpAmp),e("bn-seed",E.seed),e("sh-seed",d.seed),e("sh-zoom",d.zoom),e("sh-freq",d.freq),e("sh-oct",d.octaves),e("sh-lac",d.lacunarity),e("sh-gain",d.gain),e("sh-thr",d.threshold),e("sh-seedAngle",d.seedAngle),e("sh-time",d.time),e("sh-voroMode",d.voroMode),e("sh-edgeK",d.edgeK),e("sh-warpAmp",d.warpAmp),e("sh-scale",a.shapeScale),e("sh-pos-x",a.shapeOffset[0]),e("sh-pos-y",a.shapeOffset[1]),e("sh-pos-z",a.shapeOffset[2]),e("sh-vel-x",a.shapeVel[0]),e("sh-vel-y",a.shapeVel[1]),e("sh-vel-z",a.shapeVel[2]),e("de-seed",o.seed),e("de-zoom",o.zoom),e("de-freq",o.freq),e("de-oct",o.octaves),e("de-lac",o.lacunarity),e("de-gain",o.gain),e("de-thr",o.threshold),e("de-seedAngle",o.seedAngle),e("de-time",o.time),e("de-voroMode",o.voroMode),e("de-edgeK",o.edgeK),e("de-warpAmp",o.warpAmp),e("de-scale",a.detailScale),e("de-pos-x",a.detailOffset[0]),e("de-pos-y",a.detailOffset[1]),e("de-pos-z",a.detailOffset[2]),e("de-vel-x",a.detailVel[0]),e("de-vel-y",a.detailVel[1]),e("de-vel-z",a.detailVel[2]),e("c-az",v.sun.azDeg),e("c-el",v.sun.elDeg),e("c-bloom",v.sun.bloom),e("p-coverage",1),e("p-density",100),e("p-beer",6),e("p-clamp",.15),e("p-ins",.7),e("p-outs",.2),e("p-ivo",.3),e("p-sI",.25),e("p-sE",16),e("p-ambOut",1),e("p-ambMin",.25),e("p-anvil",.1),e("t-maxSteps",256),e("t-minStep",.003),e("t-maxStep",.1),e("t-sunSteps",4),e("t-phaseJitter",1),e("t-stepJitter",.08),e("t-baseJitter",.15),e("t-topJitter",.1),e("t-lodBiasWeather",1.5),e("t-nearFluffDist",60),e("t-nearDensityMult",2.5),e("t-farStart",800),e("t-farFull",2500),e("t-raySmoothDens",.5),e("t-raySmoothSun",.5),e("v-cx",v.cam.x),e("v-cy",v.cam.y),e("v-cz",v.cam.z),e("v-fov",v.cam.fovYDeg),e("v-yaw",v.cam.yawDeg),e("v-pitch",v.cam.pitchDeg),e("v-exposure",v.exposure),e("v-sr",v.sky[0]),e("v-sg",v.sky[1]),e("v-sb",v.sky[2]),ee=new Worker(se,{type:"module"}),ee.onmessage=u=>{let{id:y,type:f,ok:k,data:U,error:ve}=u.data||{};if(y&&V.has(y)){let{resolve:F,reject:W}=V.get(y);return V.delete(y),k?F(U):W(ve||new Error("Worker error"))}if(f==="log"&&console.log(...U||[]),f==="frame"){let F=U||{},W=F.fps?Math.round(F.fps*100)/100:"-",te=m("fpsDisplay");te&&(te.textContent=String(W))}if(f==="loop-stopped"){L=!1;let F=m("reproj-anim-toggle");F&&(F.textContent="Start x4 Anim");let W=m("fpsDisplay");W&&(W.textContent="-")}};let s=m("gpuCanvas"),i=["dbg-weather","dbg-weather-g","dbg-weather-b","dbg-r","dbg-g","dbg-blue"],n=s.transferControlToOffscreen(),b=Object.fromEntries(i.map(u=>[u,m(u).transferControlToOffscreen()])),w=await h("init",{canvases:{main:n,dbg:{weather:b["dbg-weather"],weatherG:b["dbg-weather-g"],weatherB:b["dbg-weather-b"],shapeR:b["dbg-r"],detailR:b["dbg-g"],blue:b["dbg-blue"]}},constants:{SHAPE_SIZE:he,DETAIL_SIZE:fe,WEATHER_W:ge,WEATHER_H:ye,BN_W:xe,BN_H:Se}},[n,b["dbg-weather"],b["dbg-weather-g"],b["dbg-weather-b"],b["dbg-r"],b["dbg-g"],b["dbg-blue"]]);ae=Array.isArray(w?.entryPoints)?w.entryPoints.slice():[],Oe();{let u=(y,f)=>{let k=m(y);k&&(k.value=String(f||""))};u("we-mode",p.mode),u("we-billow-mode",r.mode),u("we-bandb-mode",c.mode),u("sh-mode-a",d.baseModeA),u("sh-mode-b",d.baseModeB),u("sh-mode-2",d.bandMode2),u("sh-mode-3",d.bandMode3),u("sh-mode-4",d.bandMode4),u("de-mode-1",o.mode1),u("de-mode-2",o.mode2),u("de-mode-3",o.mode3)}be();try{await X(a)}catch{}g(!0,"Initializing...");try{me(),await h("bakeAll",{weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),blueParams:t(E),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a)}),await h("setReproj",{reproj:A(),perf:null});try{await D(!0)}catch(k){console.warn("initial sendTuningNow failed",k)}let u=B(),y={weatherParams:t(p),billowParams:t(r),weatherBParams:t(c),shapeParams:t(d),detailParams:t(o),tileTransforms:t(a),preview:t(v),cloudParams:u};x&&(y.reproj=A()),T(y);let{timings:f}=await h("runFrame",y);console.log("[BENCH] init frame timings:",f)}finally{g(!1)}await We()}Le().catch(e=>{console.error(e);let s=document.createElement("pre");s.textContent=e&&e.stack?e.stack:String(e),document.body.appendChild(s)});})();
