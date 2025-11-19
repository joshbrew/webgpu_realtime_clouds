(()=>{var ie=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(i,s)=>(typeof require<"u"?require:i)[s]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var G=`<!doctype html>\r
<html lang="en">\r
\r
<head>\r
    <meta charset="utf-8" />\r
    <meta name="viewport" content="width=device-width,initial-scale=1" />\r
    <title>Clouds \u2014 UI</title>\r
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
            box-sizing: border-box\r
        }\r
\r
        html,\r
        body {\r
            margin: 0;\r
            height: 100%;\r
            background: var(--bg);\r
            color: var(--fg);\r
            font: 14px/1.35 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif\r
        }\r
\r
        #sidebar {\r
            position: fixed;\r
            inset: 0 auto 0 0;\r
            width: var(--side);\r
            background: var(--panel);\r
            overflow: auto;\r
            padding: 16px 16px 80px;\r
            border-right: 1px solid #151c2b\r
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
            background: #000\r
        }\r
\r
        h1 {\r
            margin: 0 0 8px;\r
            font-size: 18px\r
        }\r
\r
        h2 {\r
            margin: 16px 0 8px;\r
            font-size: 13px;\r
            color: var(--fg2)\r
        }\r
\r
        label {\r
            display: block;\r
            margin: 6px 0 2px;\r
            color: var(--fg2);\r
            font-size: 12px\r
        }\r
\r
        select  {\r
            width: 100%;\r
            padding: 0px 8px;\r
            border-radius: 8px;\r
            border: 1px solid #26304a;\r
            background: #0b0f19;\r
            color: var(--fg)\r
        }\r
        input,\r
        button {\r
            width: 100%;\r
            padding: 6px 8px;\r
            border-radius: 8px;\r
            border: 1px solid #26304a;\r
            background: #0b0f19;\r
            color: var(--fg)\r
        }\r
\r
        input[type="number"] {\r
            appearance: textfield\r
        }\r
\r
        button {\r
            margin-top: 10px;\r
            cursor: pointer\r
        }\r
\r
        .row {\r
            display: grid;\r
            grid-template-columns: 1fr 1fr;\r
            gap: 8px\r
        }\r
\r
        .panel {\r
            margin: 10px 0;\r
            padding: 10px;\r
            border: 1px solid #1a2135;\r
            border-radius: 10px;\r
            background: #0b101a\r
        }\r
\r
        .dbg .slot {\r
            margin-bottom: 14px\r
        }\r
\r
        .dbg .slot div {\r
            margin: 0 0 6px;\r
            font-weight: 600;\r
            font-size: 12px;\r
            color: #b8c7e6\r
        }\r
\r
        .dbg canvas {\r
            width: 100%;\r
            height: auto;\r
            display: block;\r
            border-radius: 8px;\r
            background: #000;\r
            box-shadow: 0 0 0 1px #131b2b inset\r
        }\r
\r
        small {\r
            color: #7f8cb0;\r
            font-size: 12px\r
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
            z-index: 9999\r
        }\r
\r
        #busyOverlay .box {\r
            padding: 12px 16px;\r
            border-radius: 8px;\r
            background: #0b1220;\r
            border: 1px solid #26304a;\r
            color: var(--fg);\r
            font-weight: 600\r
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
            margin-right: 8px\r
        }\r
\r
        /* compact 3-column helper for XYZ entries */\r
        .triple {\r
            display: grid;\r
            grid-template-columns: repeat(3, 1fr);\r
            gap: 8px\r
        }\r
\r
        .compact {\r
            font-size: 12px;\r
            padding: 6px;\r
            border-radius: 6px\r
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
                    <small style="display:block;margin-top:6px;color:#93a6ce">Click to enable coarse \xD74 reprojection and\r
                        start/stop the animation loop.</small>\r
                </div>\r
                <div style="width:110px">\r
                    <div style="margin-top:6px;font-size:12px;color:var(--fg2)">FPS: <span id="fpsDisplay">\u2014</span>\r
                    </div>\r
                </div>\r
            </div>\r
        </div>\r
\r
        <!-- Weather -->\r
        <div class="panel" id="p-weather">\r
            <h2>Weather (FBM \u2192 2D R) + Billow (G)</h2>\r
\r
            <div style="display:flex;gap:8px;margin-bottom:8px">\r
                <button id="bake-weather">Bake Weather</button>\r
                <button id="seed-weather">Seed Weather</button>\r
                <button id="bake-blue">Bake Blue Noise</button>\r
                <button id="seed-blue">Seed Blue</button>\r
            </div>\r
\r
            <!-- Base FBM (R channel) -->\r
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
            </div>\r
\r
            <!-- Billow (G channel) \u2014 full FBM-like parameter set, decoupled from base -->\r
            <h2 style="margin-top:12px;font-size:13px;color:var(--fg2)">Billow (G channel)</h2>\r
\r
            <div class="row">\r
                <div><label>Enable Billow</label><input id="we-billow-enable" type="checkbox" class="compact"></div>\r
                <div><label>Billow Zoom</label><input id="we-billow-zoom" type="number" step="0.05" class="compact">\r
                </div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Billow Frequency</label><input id="we-billow-freq" type="number" step="0.05"\r
                        class="compact"></div>\r
                <div><label>Billow Octaves</label><input id="we-billow-oct" type="number" step="1" class="compact">\r
                </div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Billow Lacunarity</label><input id="we-billow-lac" type="number" step="0.1" class="compact">\r
                </div>\r
                <div><label>Billow Gain</label><input id="we-billow-gain" type="number" step="0.05" class="compact">\r
                </div>\r
            </div>\r
\r
\r
            <!-- Note: billow DOES NOT have scroll/scale \u2014 shape & detail control scrolling/scaling in their panels. -->\r
        </div>\r
        <!-- Shape128 -->\r
        <div class="panel" id="p-shape128">\r
            <h2>Shape128 RGBA</h2>\r
\r
            <div style="display:flex;gap:8px;margin-bottom:8px">\r
                <button id="bake-shape128">Bake Shape128</button>\r
                <button id="seed-shape">Seed Shape</button>\r
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
            <!-- Shape Scroll (3D) & Shape Scale -->\r
            <div style="margin-top:12px;border-top:1px dashed #142034;padding-top:10px">\r
                <h2 style="margin:6px 0 8px;font-size:13px;color:var(--fg2)">Shape Scale, Pos &amp; Vel (XYZ)</h2>\r
\r
                <div class="row">\r
                    <div><label>Shape Scale</label><input id="sh-scale" type="number" step="0.0005" value="0.1"\r
                            class="compact"></div>\r
                    <div></div>\r
                </div>\r
\r
                <div class="triple" style="margin-top:8px">\r
                    <div><label>Shape Pos X</label><input id="sh-pos-x" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Shape Pos Y</label><input id="sh-pos-y" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Shape Pos Z</label><input id="sh-pos-z" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                </div>\r
\r
                <div class="triple" style="margin-top:8px">\r
                    <div><label>Shape Vel X</label><input id="sh-vel-x" type="number" step="0.0001" value="0.2"\r
                            class="compact"></div>\r
                    <div><label>Shape Vel Y</label><input id="sh-vel-y" type="number" step="0.0001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Shape Vel Z</label><input id="sh-vel-z" type="number" step="0.0001" value="0"\r
                            class="compact"></div>\r
                </div>\r
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
            <!-- Detail Scroll (3D) & Detail Scale -->\r
            <div style="margin-top:12px;border-top:1px dashed #142034;padding-top:10px">\r
                <h2 style="margin:6px 0 8px;font-size:13px;color:var(--fg2)">Detail Scale, Pos &amp; Vel (XYZ)</h2>\r
\r
                <div class="row">\r
                    <div><label>Detail Scale</label><input id="de-scale" type="number" step="0.0005" value="1.0"\r
                            class="compact"></div>\r
                    <div></div>\r
                </div>\r
\r
                <div class="triple" style="margin-top:8px">\r
                    <div><label>Detail Pos X</label><input id="de-pos-x" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Detail Pos Y</label><input id="de-pos-y" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Detail Pos Z</label><input id="de-pos-z" type="number" step="0.001" value="0"\r
                            class="compact"></div>\r
                </div>\r
\r
                <div class="triple" style="margin-top:8px">\r
                    <div><label>Detail Vel X</label><input id="de-vel-x" type="number" step="0.0001" value="0.02"\r
                            class="compact"></div>\r
                    <div><label>Detail Vel Y</label><input id="de-vel-y" type="number" step="0.0001" value="0"\r
                            class="compact"></div>\r
                    <div><label>Detail Vel Z</label><input id="de-vel-z" type="number" step="0.0001" value="0"\r
                            class="compact"></div>\r
                </div>\r
            </div>\r
        </div>\r
\r
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
                <div><label>Phase Jitter</label><input id="t-phaseJitter" type="number" step="0.01" class="compact">\r
                </div>\r
                <div><label>Step Jitter</label><input id="t-stepJitter" type="number" step="0.01" class="compact"></div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Base Jitter Frac</label><input id="t-baseJitter" type="number" step="0.01" class="compact">\r
                </div>\r
                <div><label>Top Jitter Frac</label><input id="t-topJitter" type="number" step="0.01" class="compact">\r
                </div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>LOD Bias Weather</label><input id="t-lodBiasWeather" type="number" step="0.1"\r
                        class="compact"></div>\r
                <div><label>Near Fluff Dist</label><input id="t-nearFluffDist" type="number" step="1" class="compact">\r
                </div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Near Density Mult</label><input id="t-nearDensityMult" type="number" step="0.1"\r
                        class="compact"></div>\r
                <div><label>Far Start</label><input id="t-farStart" type="number" step="10" class="compact"></div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Far Full</label><input id="t-farFull" type="number" step="10" class="compact"></div>\r
                <div><label>Ray Smooth Dens</label><input id="t-raySmoothDens" type="number" step="0.01"\r
                        class="compact"></div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Ray Smooth Sun</label><input id="t-raySmoothSun" type="number" step="0.01" class="compact">\r
                </div>\r
                <div></div>\r
            </div>\r
        </div>\r
\r
        <!-- Preview -->\r
        <div class="panel" id="p-preview">\r
            <h2>Preview (World camera)</h2>\r
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
            </div>\r
\r
            <div class="row">\r
                <div><label>Sky R</label><input id="v-sr" type="number" step="0.01" class="compact"></div>\r
                <div><label>Sky G</label><input id="v-sg" type="number" step="0.01" class="compact"></div>\r
            </div>\r
\r
            <div class="row">\r
                <div><label>Sky B</label><input id="v-sb" type="number" step="0.01" class="compact"></div>\r
                <div><label>Sun Bloom</label><input id="v-sbloom" type="number" step="0.05" class="compact" disabled>\r
                </div>\r
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
                <div>Weather 2D (G - Billow)</div><canvas id="dbg-weather-g"></canvas>\r
            </div>\r
            <div class="slot">\r
                <div>Shape128 \u2014 R channel</div><canvas id="dbg-r"></canvas>\r
            </div>\r
            <div class="slot">\r
                <div>Detail32 \u2014 R channel</div><canvas id="dbg-g"></canvas>\r
            </div>\r
            <div class="slot">\r
                <div>Blue Noise 2D</div><canvas id="dbg-blue"></canvas>\r
            </div>\r
        </div>\r
\r
    </aside>\r
\r
    <!-- main canvas -->\r
    <canvas id="gpuCanvas"></canvas>\r
\r
    <!-- busy overlay -->\r
    <div id="busyOverlay">\r
        <div class="box" id="busyMsg">Working...</div>\r
    </div>\r
\r
</body>\r
\r
</html>`;var L={},V;if(typeof process<"u")try{typeof L<"u"&&(globalThis.__filename=fileURLToPath(L.url),globalThis.__dirname=fileURLToPath(new URL(".",L.url))),V=ie("path").join(process.cwd(),__dirname,"dist","cloudTest.worker.js")}catch{}else{let i=globalThis.location.href.split("/");i.pop(),i=i.join("/"),V=i+"/dist/cloudTest.worker.js"}var N=V;var I,oe=128,re=32,de=512,ce=512,pe=256,ue=256,ve=224,be=()=>Math.max(1,Math.floor(window.devicePixelRatio||1)),d={cam:{x:-1,y:0,z:-1,yawDeg:35,pitchDeg:1,fovYDeg:60},exposure:1.35,sky:[.55,.7,.95],layer:0,sun:{azDeg:45,elDeg:22,bloom:0}},p={zoom:2,freq:1,octaves:5,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,seed:123456789e3},n={enabled:!0,zoom:2,freq:1.5,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,threshold:0,scale:1,pos:[0,0,0],vel:[0,0,0],seed:123456789e3},u={zoom:4,freq:1,octaves:1,lacunarity:2,seedAngle:Math.PI/2,gain:.5,seed:Date.now()},v={zoom:4,freq:1,octaves:4,lacunarity:2,seedAngle:Math.PI/2,gain:.5,seed:Date.now()},C={seed:Date.now()&4294967295},l={shapeOffset:[0,0,0],detailOffset:[0,0,0],shapeScale:.1,detailScale:1,shapeVel:[.2,0,0],detailVel:[-.02,0,0]},w=!1,E=1/4,O=!1,r=e=>document.getElementById(e),t=(e,i)=>{let s=r(e);if(!s)return i;let o=+s.value;return Number.isFinite(o)?o:i},a=e=>{try{return JSON.parse(JSON.stringify(e))}catch{return Object.assign({},e)}};function T(...e){try{console.log("[UI]",...e)}catch{}}var me=1,j=new Map;function b(e,i={},s=[]){return new Promise((o,c)=>{let m=me++;j.set(m,{resolve:o,reject:c});try{I.postMessage({id:m,type:e,payload:i},s)}catch(f){j.delete(m),c(f)}})}async function W(e){return b("setTileTransforms",{tileTransforms:a(e)})}var B=null;function K(e,i){if(!i)return!0;let s=Object.keys(e),o=Object.keys(i);if(s.length!==o.length)return!0;for(let c of s)if(e[c]!==i[c])return!0;return!1}function Q(e){return Object.assign({},e)}function ee(){return{maxSteps:+(r("t-maxSteps")?.value||256)|0,minStep:+(r("t-minStep")?.value||.003),maxStep:+(r("t-maxStep")?.value||.1),sunSteps:+(r("t-sunSteps")?.value||4)|0,phaseJitter:+(r("t-phaseJitter")?.value||1),stepJitter:+(r("t-stepJitter")?.value||.08),baseJitterFrac:+(r("t-baseJitter")?.value||.15),topJitterFrac:+(r("t-topJitter")?.value||.1),lodBiasWeather:+(r("t-lodBiasWeather")?.value||1.5),nearFluffDist:+(r("t-nearFluffDist")?.value||60),nearDensityMult:+(r("t-nearDensityMult")?.value||2.5),farStart:+(r("t-farStart")?.value||800),farFull:+(r("t-farFull")?.value||2500),raySmoothDens:+(r("t-raySmoothDens")?.value||.5),raySmoothSun:+(r("t-raySmoothSun")?.value||.5)}}async function ae(e){return b("setTuning",{tuning:e})}function he(){try{let e=ee();if(!K(e,B))return;ae(e).then(i=>{B=Q(e),i&&i.tuning&&T("worker ack tuning",i.tuning)}).catch(i=>{console.warn("sendTuningIfChanged: setTuningRPC failed",i)})}catch(e){console.warn("sendTuningIfChanged error",e)}}async function S(e=!1){let i=ee();if(!e&&!K(i,B))return B;let s=await ae(i);return B=Q(i),s&&s.tuning&&T("worker ack tuning (now)",s.tuning),B}function P(){let e=t("c-az",d.sun.azDeg),i=t("c-el",d.sun.elDeg),s=t("c-bloom",d.sun.bloom);return d.sun.azDeg=e,d.sun.elDeg=i,d.sun.bloom=s,{globalCoverage:t("p-coverage",1),globalDensity:t("p-density",100),cloudAnvilAmount:t("p-anvil",.1),cloudBeer:t("p-beer",6),attenuationClamp:t("p-clamp",.15),inScatterG:t("p-ins",.7),silverIntensity:t("p-sI",.25),silverExponent:t("p-sE",16),outScatterG:t("p-outs",.2),inVsOut:t("p-ivo",.3),outScatterAmbientAmt:t("p-ambOut",1),ambientMinimum:t("p-ambMin",.25),sunColor:[1,.8,.5],sunAzDeg:e,sunElDeg:i,sunBloom:s}}function Z(){Object.assign(p,{zoom:t("we-zoom",p.zoom),freq:t("we-freq",p.freq),octaves:Math.max(1,t("we-oct",p.octaves)|0),lacunarity:t("we-lac",p.lacunarity),gain:t("we-gain",p.gain),threshold:t("we-thr",p.threshold)})}function _(){n.enabled=!!r("we-billow-enable")?.checked,n.zoom=t("we-billow-zoom",n.zoom),n.freq=t("we-billow-freq",n.freq),n.octaves=Math.max(1,t("we-billow-oct",n.octaves)|0),n.lacunarity=t("we-billow-lac",n.lacunarity),n.seedAngle=Number(r("we-billow-seedAngle")?.value)||n.seedAngle,n.gain=t("we-billow-gain",n.gain),n.threshold=t("we-billow-thr",n.threshold),n.scale=t("we-billow-scale",n.scale),n.pos[0]=t("we-billow-pos-x",n.pos[0]),n.pos[1]=t("we-billow-pos-y",n.pos[1]),n.pos[2]=t("we-billow-pos-z",n.pos[2]),n.vel[0]=t("we-billow-vel-x",n.vel[0]),n.vel[1]=t("we-billow-vel-y",n.vel[1]),n.vel[2]=t("we-billow-vel-z",n.vel[2])}function Y(){Object.assign(u,{zoom:t("sh-zoom",u.zoom),freq:t("sh-freq",u.freq),octaves:Math.max(1,t("sh-oct",u.octaves)|0),lacunarity:t("sh-lac",u.lacunarity),gain:t("sh-gain",u.gain),threshold:t("sh-thr",u.threshold)})}function H(){l.shapeScale=t("sh-scale",l.shapeScale),l.shapeOffset[0]=t("sh-pos-x",l.shapeOffset[0]),l.shapeOffset[1]=t("sh-pos-y",l.shapeOffset[1]),l.shapeOffset[2]=t("sh-pos-z",l.shapeOffset[2]),l.shapeVel=l.shapeVel||[0,0,0],l.shapeVel[0]=t("sh-vel-x",l.shapeVel[0]),l.shapeVel[1]=t("sh-vel-y",l.shapeVel[1]),l.shapeVel[2]=t("sh-vel-z",l.shapeVel[2])}function X(){Object.assign(v,{zoom:t("de-zoom",v.zoom),freq:t("de-freq",v.freq),octaves:Math.max(1,t("de-oct",v.octaves)|0),lacunarity:t("de-lac",v.lacunarity),gain:t("de-gain",v.gain),threshold:t("de-thr",v.threshold)})}function U(){l.detailScale=t("de-scale",l.detailScale),l.detailOffset[0]=t("de-pos-x",l.detailOffset[0]),l.detailOffset[1]=t("de-pos-y",l.detailOffset[1]),l.detailOffset[2]=t("de-pos-z",l.detailOffset[2]),l.detailVel=l.detailVel||[0,0,0],l.detailVel[0]=t("de-vel-x",l.detailVel[0]),l.detailVel[1]=t("de-vel-y",l.detailVel[1]),l.detailVel[2]=t("de-vel-z",l.detailVel[2])}function z(){d.cam.x=t("v-cx",d.cam.x),d.cam.y=t("v-cy",d.cam.y),d.cam.z=t("v-cz",d.cam.z),d.cam.yawDeg=t("v-yaw",d.cam.yawDeg),d.cam.pitchDeg=t("v-pitch",d.cam.pitchDeg),d.cam.fovYDeg=t("v-fov",d.cam.fovYDeg),d.exposure=t("v-exposure",d.exposure),d.sky[0]=t("v-sr",d.sky[0]),d.sky[1]=t("v-sg",d.sky[1]),d.sky[2]=t("v-sb",d.sky[2])}function fe(e){return!e||e<=0?1:Math.max(1,Math.round(1/Math.sqrt(e)))}function g(){let e=!!w,i=E;return{enabled:e,scale:i,coarseFactor:fe(i)}}function k(e){if(!e)return e;if(e.reproj&&typeof e.reproj.coarseFactor=="number")e.coarseFactor=e.reproj.coarseFactor;else if(w){let i=g();e.reproj=e.reproj||i,e.coarseFactor=i.coarseFactor}else e.coarseFactor=e.coarseFactor||4;return e}function M(e,i){let s=document.getElementById(e);s&&s.querySelectorAll("input,select,textarea").forEach(o=>{o.addEventListener("input",i)})}function we(){let e=Array.from(document.querySelectorAll('input[id^="t-"], select[id^="t-"], textarea[id^="t-"]'));e.length&&e.forEach(i=>{i.addEventListener("input",()=>{he()})})}async function x(e,i={},s={}){h(!0,"Baking\u2026");try{await b(e,a(i)),await S(),z();let o=P(),c=Object.assign({weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:o},s||{});w&&(c.reproj=g()),k(c),await b("runFrame",c)}finally{h(!1)}}function h(e,i="Working..."){let s=r("busyOverlay"),o=r("busyMsg");s&&(o&&(o.textContent=i),s.style.display=e?"flex":"none",["bake-weather","bake-blue","bake-shape128","bake-detail32","rebake-all","render"].forEach(c=>{let m=r(c);m&&(m.disabled=e)}))}function R(e){let i=Math.floor(Math.random()*1e4)>>>0,o=(Date.now()*Math.floor(Math.random()*1e4)^i)>>>0||1;return e.seed=o,e.seed}function ye(){return+r("slice")?.value|0}function te(){let e=r("sliceLabel");e&&(e.textContent=String(ye()))}async function ge(){r("pass").addEventListener("change",()=>$(r("pass").value)),$(r("pass").value);let e=r("reproj-anim-toggle"),i=r("fpsDisplay");w=!1,O=!1,e&&(e.textContent="Start x4 Anim"),i&&(i.textContent="\u2014"),e?.addEventListener("click",async()=>{if(O){try{await b("stopLoop",{})}catch(o){console.warn("stopLoop failed",o)}O=!1,w=!1;try{await b("setReproj",{reproj:{enabled:!1,scale:E,coarseFactor:Math.round(1/E)},perf:null})}catch(o){console.warn("Failed unset reproj",o)}e&&(e.textContent="Start x4 Anim");let s=r("fpsDisplay");s&&(s.textContent="\u2014")}else{w=!0;let s=g();try{await b("setReproj",{reproj:s,perf:null})}catch(c){console.warn("Failed setReproj",c)}z();let o=P();h(!0,"Seeding animation\u2026");try{await S();let c={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:o,reproj:s};k(c),await b("runFrame",c),await b("startLoop",{}),O=!0,e&&(e.textContent="Stop Anim")}catch(c){console.warn("start animation failed",c),w=!1,O=!1;try{await b("setReproj",{reproj:{enabled:!1,scale:E,coarseFactor:Math.round(1/E)},perf:null})}catch{}e&&(e.textContent="Start x4 Anim")}finally{h(!1)}}}),r("render")?.addEventListener("click",async()=>{h(!0,"Rendering\u2026");try{z();let s=P();await S();let o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o);let{timings:c}=await b("runFrame",o);console.log("[BENCH] compute(ms):",c.computeMs.toFixed(2),"render(ms):",c.renderMs.toFixed(2),"total(ms):",c.totalMs.toFixed(2))}finally{h(!1)}}),M("p-weather",async()=>{Z(),_(),await x("bakeWeather",{weatherParams:a(p),billowParams:a(n)})}),M("p-shape128",async()=>{try{Y(),H(),await W(l),await S(),z();let s=P(),o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o),await b("runFrame",o)}catch(s){console.warn("shape transform update failed",s)}}),M("p-detail32",async()=>{try{X(),U(),await W(l),await S(),z();let s=P(),o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o),await b("runFrame",o)}catch(s){console.warn("detail transform update failed",s)}}),M("p-cloudParams",async()=>{z();let s=P();await S();let o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o);try{await b("runFrame",o)}catch(c){console.warn("runFrame failed (cloudParams)",c)}}),M("p-preview",async()=>{z();let s=P();await S();let o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o);try{await b("runFrame",o)}catch(c){console.warn("runFrame failed (preview)",c)}}),we(),r("bake-weather")?.addEventListener("click",async()=>{Z(),_(),await x("bakeWeather",{weatherParams:a(p),billowParams:a(n)})}),r("bake-blue")?.addEventListener("click",async()=>{await x("bakeBlue",{blueParams:a(C)})}),r("bake-shape128")?.addEventListener("click",async()=>{Y(),H(),await x("bakeShape",{shapeParams:a(u),tileTransforms:{shapeOffset:l.shapeOffset,shapeScale:l.shapeScale}})}),r("bake-detail32")?.addEventListener("click",async()=>{X(),U(),await x("bakeDetail",{detailParams:a(v),tileTransforms:{detailOffset:l.detailOffset,detailScale:l.detailScale}})}),r("rebake-all")?.addEventListener("click",async()=>{h(!0,"Rebaking all...");try{await b("bakeAll",{weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l)}),await S();let s=P(),o={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:s};w&&(o.reproj=g()),k(o),await b("runFrame",o)}finally{h(!1)}}),r("slice")?.addEventListener("input",()=>{te(),b("setSlice",{slice:+r("slice").value|0}).catch(s=>console.warn("setSlice failed",s))}),r("seed-weather")?.addEventListener("click",async()=>{let s=R(p);T("new weather seed",s,p),h(!0,"Seeding weather...");try{await x("bakeWeather",{weatherParams:a(p),billowParams:a(n)}),console.log("Weather seed set to",s)}finally{h(!1)}}),r("seed-shape")?.addEventListener("click",async()=>{let s=R(u);T("new shape seed",s,u),h(!0,"Seeding shape...");try{await x("bakeShape",{shapeParams:a(u),tileTransforms:{shapeOffset:l.shapeOffset,shapeScale:l.shapeScale}}),console.log("Shape seed set to",s)}finally{h(!1)}}),r("seed-detail")?.addEventListener("click",async()=>{let s=R(v);T("new detail seed",s,v),h(!0,"Seeding detail...");try{await x("bakeDetail",{detailParams:a(v),tileTransforms:{detailOffset:l.detailOffset,detailScale:l.detailScale}}),console.log("Detail seed set to",s)}finally{h(!1)}}),r("seed-blue")?.addEventListener("click",async()=>{let s=R(C);T("new blue seed",s,C),h(!0,"Seeding blue...");try{await x("bakeBlue",{blueParams:a(C)}),console.log("Blue seed set to",s)}finally{h(!1)}}),window.addEventListener("resize",()=>le())}function $(e){let i=(s,o)=>{let c=r(s);c&&(c.style.display=o?"":"none")};i("p-weather",e==="weather"),i("p-shape128",e==="shape128"),i("p-detail32",e==="detail32"),i("p-cloudParams",e==="clouds"),i("p-preview",e==="preview")}function le(){let e=be(),i=r("gpuCanvas"),s=Math.max(1,Math.round(i.clientWidth)),o=Math.max(1,Math.round(i.clientHeight)),c=Math.max(1,Math.floor(s*e)),m=Math.max(1,Math.floor(o*e)),f=Math.round(ve*e);b("resize",{main:{width:c,height:m},dbg:{width:f,height:f}}).catch(y=>console.warn("resize rpc failed",y))}async function xe(){document.body.insertAdjacentHTML("beforeend",G);let e=(m,f)=>{let y=r(m);y&&(y.type==="checkbox"?y.checked=!!f:y.value=f)};e("we-zoom",p.zoom),e("we-freq",p.freq),e("we-oct",p.octaves),e("we-lac",p.lacunarity),e("we-gain",p.gain),e("we-thr",p.threshold),e("we-billow-enable",n.enabled),e("we-billow-zoom",n.zoom),e("we-billow-freq",n.freq),e("we-billow-oct",n.octaves),e("we-billow-lac",n.lacunarity),e("we-billow-gain",n.gain),e("we-billow-thr",n.threshold),e("we-billow-scale",n.scale),e("we-billow-pos-x",n.pos[0]),e("we-billow-pos-y",n.pos[1]),e("we-billow-pos-z",n.pos[2]),e("we-billow-vel-x",n.vel[0]),e("we-billow-vel-y",n.vel[1]),e("we-billow-vel-z",n.vel[2]),e("sh-zoom",u.zoom),e("sh-freq",u.freq),e("sh-oct",u.octaves),e("sh-lac",u.lacunarity),e("sh-gain",u.gain),e("sh-thr",u.threshold),e("sh-scale",l.shapeScale),e("sh-pos-x",l.shapeOffset[0]),e("sh-pos-y",l.shapeOffset[1]),e("sh-pos-z",l.shapeOffset[2]),e("sh-vel-x",l.shapeVel[0]),e("sh-vel-y",l.shapeVel[1]),e("sh-vel-z",l.shapeVel[2]),e("de-zoom",v.zoom),e("de-freq",v.freq),e("de-oct",v.octaves),e("de-lac",v.lacunarity),e("de-gain",v.gain),e("de-thr",v.threshold),e("de-scale",l.detailScale),e("de-pos-x",l.detailOffset[0]),e("de-pos-y",l.detailOffset[1]),e("de-pos-z",l.detailOffset[2]),e("de-vel-x",l.detailVel[0]),e("de-vel-y",l.detailVel[1]),e("de-vel-z",l.detailVel[2]),e("c-az",d.sun.azDeg),e("c-el",d.sun.elDeg),e("c-bloom",d.sun.bloom),e("p-coverage",1),e("p-density",100),e("p-beer",6),e("p-clamp",.15),e("p-ins",.7),e("p-outs",.2),e("p-ivo",.3),e("p-sI",.25),e("p-sE",16),e("p-ambOut",1),e("p-ambMin",.25),e("p-anvil",.1),e("t-maxSteps",256),e("t-minStep",.003),e("t-maxStep",.1),e("t-sunSteps",4),e("t-phaseJitter",1),e("t-stepJitter",.08),e("t-baseJitter",.15),e("t-topJitter",.1),e("t-lodBiasWeather",1.5),e("t-nearFluffDist",60),e("t-nearDensityMult",2.5),e("t-farStart",800),e("t-farFull",2500),e("t-raySmoothDens",.5),e("t-raySmoothSun",.5),e("v-cx",d.cam.x),e("v-cy",d.cam.y),e("v-cz",d.cam.z),e("v-fov",d.cam.fovYDeg),e("v-yaw",d.cam.yawDeg),e("v-pitch",d.cam.pitchDeg),e("v-exposure",d.exposure),e("v-sr",d.sky[0]),e("v-sg",d.sky[1]),e("v-sb",d.sky[2]),I=new Worker(N,{type:"module"}),I.onmessage=m=>{let{id:f,type:y,ok:A,data:q,error:se}=m.data||{};if(f&&j.has(f)){let{resolve:D,reject:F}=j.get(f);return j.delete(f),A?D(q):F(se||new Error("Worker error"))}if(y==="log"&&console.log(...q||[]),y==="frame"){let D=q||{},F=D.fps?Math.round(D.fps*100)/100:"\u2014",J=r("fpsDisplay");J&&(J.textContent=String(F))}if(y==="loop-stopped"){O=!1;let D=r("reproj-anim-toggle");D&&(D.textContent="Start x4 Anim");let F=r("fpsDisplay");F&&(F.textContent="\u2014")}};let i=r("gpuCanvas"),s=["dbg-weather","dbg-weather-g","dbg-r","dbg-g","dbg-blue"],o=i.transferControlToOffscreen(),c=Object.fromEntries(s.map(m=>[m,r(m).transferControlToOffscreen()]));await b("init",{canvases:{main:o,dbg:{weather:c["dbg-weather"],weatherG:c["dbg-weather-g"],shapeR:c["dbg-r"],detailR:c["dbg-g"],blue:c["dbg-blue"]}},constants:{SHAPE_SIZE:oe,DETAIL_SIZE:re,WEATHER_W:de,WEATHER_H:ce,BN_W:pe,BN_H:ue}},[o,c["dbg-weather"],c["dbg-weather-g"],c["dbg-r"],c["dbg-g"],c["dbg-blue"]]),le();try{await W(l)}catch{}h(!0,"Initializing\u2026");try{await b("bakeAll",{weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l)}),te(),await b("setReproj",{reproj:g(),perf:null});try{await S(!0)}catch(A){console.warn("initial sendTuningNow failed",A)}let m=P(),f={weatherParams:a(p),billowParams:a(n),shapeParams:a(u),detailParams:a(v),tileTransforms:a(l),preview:a(d),cloudParams:m};w&&(f.reproj=g()),k(f);let{timings:y}=await b("runFrame",f);console.log("[BENCH] init frame timings:",y)}finally{h(!1)}await ge()}xe().catch(e=>{console.error(e);let i=document.createElement("pre");i.textContent=e&&e.stack?e.stack:String(e),document.body.appendChild(i)});})();
