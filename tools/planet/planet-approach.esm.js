var ki=`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Planet approach \u2014 Orbit to surface</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background: #07111e;
        color: #eef5ff;
        font:
          14px system-ui,
          sans-serif;
      }
      canvas {
        width: 100vw;
        height: 100dvh;
        display: block;
        touch-action: none;
        outline: none;
      }
      .panel {
        position: fixed;
        border: 1px solid #90b4d84d;
        border-radius: 12px;
        background: #101d2bee;
        padding: 14px;
        scrollbar-width: thin;
      }
      header {
        top: 16px;
        left: 16px;
        width: 340px;
        max-height: calc(100dvh - 32px);
        overflow: auto;
      }
      nav {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      nav a {
        color: #b8ddfc;
        text-decoration: none;
        padding: 4px 7px;
        border: 1px solid #93b9d750;
        border-radius: 5px;
        font-size: 12px;
      }
      nav a[aria-current] {
        background: #4b71974d;
        border-color: #93c9fb;
      }
      h1 {
        font-size: 23px;
        line-height: 1.15;
        margin: 0;
      }
      p {
        color: #b2c6db;
        line-height: 1.45;
        margin: 8px 0;
      }
      .buttons {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
        margin: 12px 0;
      }
      button,
      select {
        font: inherit;
        border-radius: 6px;
        border: 1px solid #86b2d85e;
        background: #233c53;
        color: inherit;
        padding: 7px 10px;
        cursor: pointer;
      }
      button:hover {
        background: #345775;
      }
      #approach {
        background: #295b83;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin: 9px 0;
      }
      .heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .heading button { white-space: nowrap; }
      .row select { width: 174px; max-width: 62%; }
      details { border-top: 1px solid #90b4d830; padding-top: 8px; margin-top: 8px; }
      summary { cursor: pointer; }
      #showInterface { position: fixed; top: 16px; left: 16px; }
      [hidden] { display: none !important; }
      input[type="range"] {
        width: 135px;
        accent-color: #8ccaf0;
      }
      input[type="checkbox"] {
        accent-color: #8ccaf0;
      }
      output {
        font-variant-numeric: tabular-nums;
        color: #b9e2ff;
      }
      #status {
        display: block;
        line-height: 1.4;
        margin-top: 12px;
      }
      .error {
        color: #ffbaba;
      }
      aside {
        right: 16px;
        bottom: 16px;
        width: 320px;
      }
      aside h2 {
        font-size: 14px;
        margin: 0 0 10px;
      }
      dl {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
        gap: 6px 10px;
        margin: 0;
        line-height: 1.35;
      }
      dt {
        color: #afc7de;
      }
      dd {
        margin: 0;
        font-variant-numeric: tabular-nums;
        text-align: right;
        overflow-wrap: anywhere;
      }
      .hint {
        font-size: 12px;
      }
      @media (max-width: 720px) {
        header {
          width: min(340px, calc(100vw - 20px));
          top: 10px;
          left: 10px;
          max-height: 59dvh;
        }
        aside {
          bottom: 10px;
          right: 10px;
          width: min(280px, calc(100vw - 20px));
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <canvas
      id="planet"
      tabindex="0"
      aria-label="Fly around the procedural planet"
    ></canvas>
    <button id="showInterface" type="button" aria-controls="controls performance" aria-expanded="false" hidden>
      Show UI
    </button>
    <header id="controls" class="panel">
      <nav aria-label="Demos">
        <a href="index.html?demo=sphere">Sphere</a
        ><a href="index.html?demo=terrain">Terrain</a>
        <a href="index.html?demo=space">Infinite space</a
        ><a href="index.html?demo=progressive">Noise tiles</a>
        <a href="index.html?demo=planet" aria-current="page">Planet approach</a>
      </nav>
      <div class="heading">
        <h1>Planet approach</h1>
        <button id="hideInterface" type="button" aria-controls="controls performance" title="Hide the controls and performance panel (H)">Hide UI</button>
      </div>
      <div class="row">
        <label for="preset">Planet preset</label>
        <select id="preset"></select>
      </div>
      <div class="row">
        <label for="planetSize">World size</label>
        <select id="planetSize">
          <option value="98304">Moon</option>
          <option value="262144" selected>Planet</option>
          <option value="786432">Super-planet</option>
          <option value="1966080">Super-duper planet</option>
        </select>
      </div>
      <div class="row">
        <label for="terrainSampling">Terrain sampling</label>
        <select id="terrainSampling">
          <option value="procedural" selected>Procedural vertices</option>
          <option value="cached">Cached atlas</option>
        </select>
      </div>
      <div class="row">
        <label for="region">Explore region</label>
        <select id="region">
          <option value="">Choose a landform</option>
          <option value="alpine">Rocky mountains</option>
          <option value="canyon">Canyons and mesas</option>
          <option value="granite">Granite domes</option>
          <option value="volcanic">Volcanic terrain</option>
          <option value="impact-basins">Giant impact basins</option>
          <option value="islands">Volcanic islands</option>
          <option value="drowned-canyons">Drowned canyons</option>
          <option value="sediment-shelves">Shallow coastal shelves</option>
          <option value="glacial-highlands">Glacial highlands</option>
          <option value="terraced-plateaus">Terraced plateaus</option>
          <option value="pinnacle-rims">Pinnacle rims</option>
          <option value="fractal-outcrops">Fractal outcrops</option>
          <option value="dune-seas">Sand-filled basins</option>
          <option value="wind-badlands">Wind-cut badlands</option>
          <option value="fault-blocks">Fault-block ranges</option>
          <option value="rift-inlets">Flooded rift valleys</option>
          <option value="alluvial-fans">Alluvial fans and dry washes</option>
          <option value="inverted-valleys">Inverted valleys</option>
          <option value="granite-divides">Granite divides</option>
          <option value="flatirons">Folded foothills</option>
          <option value="lava-benches">Lava-cut canyons</option>
          <option value="sandstone-fins">Sandstone fins and domes</option>
          <option value="basalt-highlands">Basalt highlands</option>
        </select>
      </div>
      <div class="buttons">
        <button id="approach">Start approach</button
        ><button id="orbit">Orbit</button>
        <button id="shore">Low flyover</button
        ><button id="surface">Near surface</button>
        <button id="random">Randomize planet</button>
      </div>
      <div class="row">
        <label for="altitude"
          >Height <output id="altitudeValue"></output
        ></label>
        <input
          id="altitude"
          type="range"
          min="1"
          max="20"
          step=".01"
          value="19"
          aria-label="Height"
        />
      </div>
      <details>
        <summary>Mesh detail</summary>
        <div class="row">
        <label for="detail"
          >Pixel error <output id="detailValue">1.25 px</output></label
        >
        <input
          id="detail"
          type="range"
          min="1"
          max="24"
          step=".25"
          value="1.25"
        />
      </div>
      <div class="row">
        <label for="lodScale">Distant LOD <output id="lodScaleValue">4.00\xD7</output></label>
        <input id="lodScale" type="range" min=".25" max="32" step=".25" value="4" />
      </div>
      <div class="row">
        <label for="triangleBudget">Triangle budget <output id="triangleBudgetValue">800,000</output></label>
        <input id="triangleBudget" type="range" min="100000" max="28325000" step="25000" value="800000" />
      </div>
      <div class="row">
        <label><input id="colors" type="checkbox" />LOD colors</label
        ><label><input id="wire" type="checkbox" />Wireframe</label>
      </div>
      </details>
      <details>
        <summary>Day and night</summary>
        <div class="row">
          <label><input id="sunCycle" type="checkbox" checked />Animate sun</label>
        </div>
        <div class="row">
          <label for="sunPhase">Sun orbit <output id="sunPhaseValue">0\xB0</output></label>
          <input id="sunPhase" type="range" min="0" max="360" step="1" value="0" />
        </div>
        <div class="row">
          <label for="atmosphere">Atmosphere</label>
          <select id="atmosphere">
            <option value="preset">Planet preset</option>
            <option value="blue">Blue</option>
            <option value="amber">Amber</option>
            <option value="violet">Violet</option>
            <option value="teal">Teal</option>
            <option value="thin">Thin atmosphere</option>
          </select>
        </div>
      </details>
      <details>
        <summary>Terrain noise</summary>
        <div class="row">
          <label for="landscape">Landscape</label>
          <select id="landscape">
            <option value="natural">Natural mix</option>
            <option value="mesas">Terraced mesas</option>
            <option value="fractal">Alien fractal</option>
            <option value="mosaic">Regional mosaic</option>
          </select>
        </div>
        <div class="row">
          <label for="landscapeStrength">Style strength</label>
          <input id="landscapeStrength" type="range" min="0" max="1" step=".05" value="1" />
        </div>
        <div class="row">
          <label for="terrainRelief">Relief multiplier</label>
          <input id="terrainRelief" type="range" min=".25" max="1.25" step=".05" value="1" />
        </div>
        <div class="row">
          <label for="rangeShape">Mountain ranges</label>
          <select id="rangeShape">
            <option value="hybrid">Mixed terrain</option>
            <option value="ridges">Sharper ridges</option>
            <option value="rolling">Rolling relief</option>
          </select>
        </div>
        <div class="row">
          <label for="slopeNoise">Hillside detail</label>
          <select id="slopeNoise">
            <option value="erosion">Downhill erosion</option>
            <option value="incised">Incised ridges</option>
            <option value="soft">Soft noise</option>
          </select>
        </div>
        <div class="row">
          <label for="slopeOctaves">Hillside octaves</label>
          <input id="slopeOctaves" type="number" min="0" max="4" value="4" />
        </div>
        <div class="row">
          <label for="erosionStrength">Local erosion <output id="erosionStrengthValue" for="erosionStrength">1.20\xD7</output></label>
          <input id="erosionStrength" type="range" min="0" max="2" step=".05" value="1.2" />
        </div>
        <div class="row">
          <label for="groundNoise">Ground detail</label>
          <select id="groundNoise">
            <option value="erosion">Downhill erosion</option>
            <option value="incised">Incised ridges</option>
            <option value="soft">Soft noise</option>
          </select>
        </div>
        <div class="row">
          <label for="groundOctaves">Ground octaves</label>
          <input id="groundOctaves" type="number" min="0" max="5" value="5" />
        </div>
        <div class="row">
          <label for="noiseVariation">Regional variation</label>
          <input id="noiseVariation" type="range" min="0" max="1" step=".05" value=".8" />
        </div>
      </details>
      <details id="terrainMix">
        <summary>Terrain layers and region map</summary>
      </details>
      <p class="hint">
        Left drag to orbit, right drag to look. WASD to fly, Space/C to climb or descend, Shift for speed, H to toggle the UI.
      </p>
      <output id="status">Preparing the planet\u2026</output>
    </header>
    <aside id="performance" class="panel" aria-label="Planet performance">
      <h2>Surface and performance</h2>
      <dl>
        <dt>Height above ground</dt>
        <dd id="heightReadout">\u2014</dd>
        <dt>Seed</dt>
        <dd id="seedReadout">\u2014</dd>
        <dt>Terrain relief</dt>
        <dd id="reliefReadout">\u2014</dd>
        <dt>World surface</dt>
        <dd id="oceanReadout">\u2014</dd>
        <dt>Climate</dt>
        <dd id="climateReadout">\u2014</dd>
        <dt>Landforms</dt>
        <dd id="geologyReadout">\u2014</dd>
        <dt>Finest grid spacing</dt>
        <dd id="spacing">\u2014</dd>
        <dt>Triangles</dt>
        <dd id="tris">\u2014</dd>
        <dt>Grid vertices</dt>
        <dd id="gridVertices">\u2014</dd>
        <dt title="Drawn / planned patches">Patches</dt>
        <dd id="tiles">\u2014</dd>
        <dt>Visible LOD grades</dt>
        <dd id="grades">\u2014</dd>
        <dt title="CPU frame work / GPU draw pass">CPU / GPU draw</dt>
        <dd id="timing">\u2014</dd>
        <dt title="Latest sampled GPU patch generation batch">GPU patch build</dt>
        <dd id="patchTiming">\u2014</dd>
        <dt>FPS</dt>
        <dd id="fps">\u2014</dd>
      </dl>
    </aside>
  </body>
</html>
`;var Ht=(i,e)=>{let t=i?.toArray?i.toArray():Array.from(i||[]);if(t.length!==3||!t.every(Number.isFinite))throw new TypeError(`${e} must contain three finite numbers.`);return t},Wa=i=>{let e=Math.hypot(...i);if(e<1e-12)throw new RangeError("Camera direction and up must be nonzero and not parallel.");return i.map(t=>t/e)},Bi=(i,e)=>[i[1]*e[2]-i[2]*e[1],i[2]*e[0]-i[0]*e[2],i[0]*e[1]-i[1]*e[0]],La=(i,e)=>i.reduce((t,a,r)=>t+a*e[r],0);function Ci(i){if(i?.length!==16||!Array.from(i).every(Number.isFinite))throw new TypeError("viewProjection must contain 16 finite numbers.");return[[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]].map(([e,t])=>{let a=[i[3]+t*i[e],i[7]+t*i[e+4],i[11]+t*i[e+8],i[15]+t*i[e+12]],r=Math.hypot(...a.slice(0,3));if(!r)throw new RangeError("Camera matrix contains a degenerate frustum.");return a.map(o=>o/r)})}function Ai({position:i=[0,200,450],target:e,forward:t,up:a=[0,1,0],fov:r=Math.PI/3,near:o=.1,far:s=2048,aspect:c=1,height:n=720,player:l}={}){i=Ht(i,"position"),t=Wa(t?Ht(t,"forward"):e?Ht(e,"target").map((M,h)=>M-i[h]):[0,-.2,-1]);let d=Wa(Bi(t,Ht(a,"up")));if(a=Wa(Bi(d,t)),!(r>0&&r<Math.PI&&o>0&&s>o&&c>0&&n>0)||![r,o,s,c,n].every(Number.isFinite))throw new RangeError("Use 0 < fov < pi, 0 < near < far, and positive aspect/height.");let u=Math.tan(r/2),f=u*c,p=[d[0],a[0],-t[0],0,d[1],a[1],-t[1],0,d[2],a[2],-t[2],0,-La(d,i),-La(a,i),La(t,i),1],x=(s+o)/(o-s),y=2*s*o/(o-s),m=new Float64Array(16);for(let M=0;M<4;M++){let h=M*4;m[h]=p[h]/f,m[h+1]=p[h+1]/u,m[h+2]=x*p[h+2]+y*p[h+3],m[h+3]=-p[h+2]}return{position:i,player:l?Ht(l,"player"):i.slice(),fov:r,near:o,far:s,aspect:c,height:n,right:d,up:a,forward:t,tanX:f,tanY:u,pixelScale:n/(2*u),viewProjection:m,planes:Ci(m)}}function Ri(i){let e=Array.from(i.viewProjection),t=i.position;for(let a=0;a<4;a++)e[12+a]+=e[a]*t[0]+e[4+a]*t[1]+e[8+a]*t[2];return{...i,viewProjection:e,planes:Ci(e)}}async function ro({adapterOptions:i,requiredFeatures:e=[],requiredLimits:t,preferredStorageBufferSize:a=0,timestamps:r=!0}={}){let o=globalThis.navigator?.gpu;if(!o)throw new Error("WebGPU is unavailable; use CPU extraction or a WebGPU browser over HTTPS.");let s=await o.requestAdapter(i);if(!s)throw new Error("No WebGPU adapter is available.");let c=new Set(e);if(r&&s.features.has("timestamp-query")&&c.add("timestamp-query"),a>0){let n=Math.min(a,s.limits.maxStorageBufferBindingSize,s.limits.maxBufferSize);t={...t,maxStorageBufferBindingSize:Math.max(n,t?.maxStorageBufferBindingSize??0),maxBufferSize:Math.max(n,t?.maxBufferSize??0)}}return s.requestDevice({requiredFeatures:[...c],requiredLimits:t})}async function Ti(i,e){i.ownsDevice=!i.options.device,i.device=i.options.device||await ro(e);let t=i.device;i.onGPUError=r=>i.errors.push(r.error.message),t.addEventListener("uncapturederror",i.onGPUError);let a=new WeakRef(i);if(t.lost.then(r=>{let o=a.deref();o&&!o.disposed&&o.errors.push(`GPU device lost: ${r.message}`)}),i.context=i.canvas.getContext("webgpu"),!i.context)throw new Error("Canvas cannot create a WebGPU context.");return i.format=i.options.format||globalThis.navigator.gpu.getPreferredCanvasFormat(),i.context.configure({device:t,format:i.format,alphaMode:"opaque"}),t}function qi(i){i.onGPUError&&i.device?.removeEventListener("uncapturederror",i.onGPUError),i.context?.unconfigure(),i.ownsDevice&&i.device?.destroy()}function Fi(i,e={}){let t=e.pixelRatio??Math.min(globalThis.devicePixelRatio||1,1.5);if(!Number.isFinite(t)||t<=0)throw new RangeError("pixelRatio must be positive and finite.");return{ratio:t,width:Math.max(1,Math.round(i.clientWidth===void 0?i.width:i.clientWidth*t)),height:Math.max(1,Math.round(i.clientHeight===void 0?i.height:i.clientHeight*t))}}function Ea(i={type:"cartesian"}){if(i.type==="cartesian")return(o,s,c)=>[o,s,c];if(i.type!=="spherical"&&i.type!=="cube-sphere")throw new Error(`Unknown coordinates: ${i.type}`);let e=i.radius||[.02,.7],t=i.center||[.5,.5,.5];if(e.length!==2||!e.every(Number.isFinite)||e[0]<0||e[1]<=e[0])throw new Error("Radius must be an increasing, nonnegative pair");if(t.length!==3||!t.every(Number.isFinite))throw new Error("Center must contain three finite coordinates");if(i.type==="cube-sphere"){if(!Number.isInteger(i.face)||i.face<0||i.face>5)throw new Error("Cube-sphere face must be 0..5");return(o,s,c)=>{let n=2*o-1,l=2*s-1,u=[[1,l,-n],[-1,l,n],[n,1,-l],[n,-1,l],[n,l,1],[-n,l,-1]][i.face],p=(e[0]+c*(e[1]-e[0]))/Math.hypot(...u);return u.map((x,y)=>t[y]+x*p)}}let a=i.longitude||[-Math.PI,Math.PI],r=i.latitude||[-Math.PI/2,Math.PI/2];for(let o of[a,r])if(o.length!==2||!o.every(Number.isFinite)||o[1]<=o[0])throw new Error("Angular ranges must be increasing finite pairs in radians");if(r[0]<-Math.PI/2||r[1]>Math.PI/2||a[1]-a[0]>2*Math.PI+1e-9)throw new Error("Latitude must be within \xB1pi/2 and longitude span at most 2*pi");return(o,s,c)=>{let n=a[0]+o*(a[1]-a[0]),l=r[0]+s*(r[1]-r[0]),d=e[0]+c*(e[1]-e[0]),u=d*Math.cos(l);return Math.abs(Math.cos(l))<1e-15?[t[0],t[1]+d*Math.sin(l),t[2]]:[t[0]+u*Math.cos(n),t[1]+d*Math.sin(l),t[2]+u*Math.sin(n)]}}function Ii(i,e){if(!e||e.type==="cartesian")return i;let t=Ea(e);for(let a=0;a<i.length;a+=3){let r=t(i[a],i[a+1],i[a+2]);i[a]=r[0],i[a+1]=r[1],i[a+2]=r[2]}return i}var so=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],no=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],Ni=[[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,8,3,9,8,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,2,10,0,2,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,8,3,2,10,8,10,9,8,-1,-1,-1,-1,-1,-1,-1],[3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,11,2,8,11,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,9,0,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,11,2,1,9,11,9,8,11,-1,-1,-1,-1,-1,-1,-1],[3,10,1,11,10,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,10,1,0,8,10,8,11,10,-1,-1,-1,-1,-1,-1,-1],[3,9,0,3,11,9,11,10,9,-1,-1,-1,-1,-1,-1,-1],[9,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,3,0,7,3,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,1,9,4,7,1,7,3,1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,4,7,3,0,4,1,2,10,-1,-1,-1,-1,-1,-1,-1],[9,2,10,9,0,2,8,4,7,-1,-1,-1,-1,-1,-1,-1],[2,10,9,2,9,7,2,7,3,7,9,4,-1,-1,-1,-1],[8,4,7,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,4,7,11,2,4,2,0,4,-1,-1,-1,-1,-1,-1,-1],[9,0,1,8,4,7,2,3,11,-1,-1,-1,-1,-1,-1,-1],[4,7,11,9,4,11,9,11,2,9,2,1,-1,-1,-1,-1],[3,10,1,3,11,10,7,8,4,-1,-1,-1,-1,-1,-1,-1],[1,11,10,1,4,11,1,0,4,7,11,4,-1,-1,-1,-1],[4,7,8,9,0,11,9,11,10,11,0,3,-1,-1,-1,-1],[4,7,11,4,11,9,9,11,10,-1,-1,-1,-1,-1,-1,-1],[9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,5,4,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,5,4,1,5,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,5,4,8,3,5,3,1,5,-1,-1,-1,-1,-1,-1,-1],[1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,8,1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1],[5,2,10,5,4,2,4,0,2,-1,-1,-1,-1,-1,-1,-1],[2,10,5,3,2,5,3,5,4,3,4,8,-1,-1,-1,-1],[9,5,4,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,11,2,0,8,11,4,9,5,-1,-1,-1,-1,-1,-1,-1],[0,5,4,0,1,5,2,3,11,-1,-1,-1,-1,-1,-1,-1],[2,1,5,2,5,8,2,8,11,4,8,5,-1,-1,-1,-1],[10,3,11,10,1,3,9,5,4,-1,-1,-1,-1,-1,-1,-1],[4,9,5,0,8,1,8,10,1,8,11,10,-1,-1,-1,-1],[5,4,0,5,0,11,5,11,10,11,0,3,-1,-1,-1,-1],[5,4,8,5,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1],[9,7,8,5,7,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,3,0,9,5,3,5,7,3,-1,-1,-1,-1,-1,-1,-1],[0,7,8,0,1,7,1,5,7,-1,-1,-1,-1,-1,-1,-1],[1,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,7,8,9,5,7,10,1,2,-1,-1,-1,-1,-1,-1,-1],[10,1,2,9,5,0,5,3,0,5,7,3,-1,-1,-1,-1],[8,0,2,8,2,5,8,5,7,10,5,2,-1,-1,-1,-1],[2,10,5,2,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1],[7,9,5,7,8,9,3,11,2,-1,-1,-1,-1,-1,-1,-1],[9,5,7,9,7,2,9,2,0,2,7,11,-1,-1,-1,-1],[2,3,11,0,1,8,1,7,8,1,5,7,-1,-1,-1,-1],[11,2,1,11,1,7,7,1,5,-1,-1,-1,-1,-1,-1,-1],[9,5,8,8,5,7,10,1,3,10,3,11,-1,-1,-1,-1],[5,7,0,5,0,9,7,11,0,1,0,10,11,10,0,-1],[11,10,0,11,0,3,10,5,0,8,0,7,5,7,0,-1],[11,10,5,7,11,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,0,1,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,8,3,1,9,8,5,10,6,-1,-1,-1,-1,-1,-1,-1],[1,6,5,2,6,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,6,5,1,2,6,3,0,8,-1,-1,-1,-1,-1,-1,-1],[9,6,5,9,0,6,0,2,6,-1,-1,-1,-1,-1,-1,-1],[5,9,8,5,8,2,5,2,6,3,2,8,-1,-1,-1,-1],[2,3,11,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,0,8,11,2,0,10,6,5,-1,-1,-1,-1,-1,-1,-1],[0,1,9,2,3,11,5,10,6,-1,-1,-1,-1,-1,-1,-1],[5,10,6,1,9,2,9,11,2,9,8,11,-1,-1,-1,-1],[6,3,11,6,5,3,5,1,3,-1,-1,-1,-1,-1,-1,-1],[0,8,11,0,11,5,0,5,1,5,11,6,-1,-1,-1,-1],[3,11,6,0,3,6,0,6,5,0,5,9,-1,-1,-1,-1],[6,5,9,6,9,11,11,9,8,-1,-1,-1,-1,-1,-1,-1],[5,10,6,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,3,0,4,7,3,6,5,10,-1,-1,-1,-1,-1,-1,-1],[1,9,0,5,10,6,8,4,7,-1,-1,-1,-1,-1,-1,-1],[10,6,5,1,9,7,1,7,3,7,9,4,-1,-1,-1,-1],[6,1,2,6,5,1,4,7,8,-1,-1,-1,-1,-1,-1,-1],[1,2,5,5,2,6,3,0,4,3,4,7,-1,-1,-1,-1],[8,4,7,9,0,5,0,6,5,0,2,6,-1,-1,-1,-1],[7,3,9,7,9,4,3,2,9,5,9,6,2,6,9,-1],[3,11,2,7,8,4,10,6,5,-1,-1,-1,-1,-1,-1,-1],[5,10,6,4,7,2,4,2,0,2,7,11,-1,-1,-1,-1],[0,1,9,4,7,8,2,3,11,5,10,6,-1,-1,-1,-1],[9,2,1,9,11,2,9,4,11,7,11,4,5,10,6,-1],[8,4,7,3,11,5,3,5,1,5,11,6,-1,-1,-1,-1],[5,1,11,5,11,6,1,0,11,7,11,4,0,4,11,-1],[0,5,9,0,6,5,0,3,6,11,6,3,8,4,7,-1],[6,5,9,6,9,11,4,7,9,7,11,9,-1,-1,-1,-1],[10,4,9,6,4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,10,6,4,9,10,0,8,3,-1,-1,-1,-1,-1,-1,-1],[10,0,1,10,6,0,6,4,0,-1,-1,-1,-1,-1,-1,-1],[8,3,1,8,1,6,8,6,4,6,1,10,-1,-1,-1,-1],[1,4,9,1,2,4,2,6,4,-1,-1,-1,-1,-1,-1,-1],[3,0,8,1,2,9,2,4,9,2,6,4,-1,-1,-1,-1],[0,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,3,2,8,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1],[10,4,9,10,6,4,11,2,3,-1,-1,-1,-1,-1,-1,-1],[0,8,2,2,8,11,4,9,10,4,10,6,-1,-1,-1,-1],[3,11,2,0,1,6,0,6,4,6,1,10,-1,-1,-1,-1],[6,4,1,6,1,10,4,8,1,2,1,11,8,11,1,-1],[9,6,4,9,3,6,9,1,3,11,6,3,-1,-1,-1,-1],[8,11,1,8,1,0,11,6,1,9,1,4,6,4,1,-1],[3,11,6,3,6,0,0,6,4,-1,-1,-1,-1,-1,-1,-1],[6,4,8,11,6,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,10,6,7,8,10,8,9,10,-1,-1,-1,-1,-1,-1,-1],[0,7,3,0,10,7,0,9,10,6,7,10,-1,-1,-1,-1],[10,6,7,1,10,7,1,7,8,1,8,0,-1,-1,-1,-1],[10,6,7,10,7,1,1,7,3,-1,-1,-1,-1,-1,-1,-1],[1,2,6,1,6,8,1,8,9,8,6,7,-1,-1,-1,-1],[2,6,9,2,9,1,6,7,9,0,9,3,7,3,9,-1],[7,8,0,7,0,6,6,0,2,-1,-1,-1,-1,-1,-1,-1],[7,3,2,6,7,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,11,10,6,8,10,8,9,8,6,7,-1,-1,-1,-1],[2,0,7,2,7,11,0,9,7,6,7,10,9,10,7,-1],[1,8,0,1,7,8,1,10,7,6,7,10,2,3,11,-1],[11,2,1,11,1,7,10,6,1,6,7,1,-1,-1,-1,-1],[8,9,6,8,6,7,9,1,6,11,6,3,1,3,6,-1],[0,9,1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,8,0,7,0,6,3,11,0,11,6,0,-1,-1,-1,-1],[7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,8,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,1,9,8,3,1,11,7,6,-1,-1,-1,-1,-1,-1,-1],[10,1,2,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,3,0,8,6,11,7,-1,-1,-1,-1,-1,-1,-1],[2,9,0,2,10,9,6,11,7,-1,-1,-1,-1,-1,-1,-1],[6,11,7,2,10,3,10,8,3,10,9,8,-1,-1,-1,-1],[7,2,3,6,2,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,0,8,7,6,0,6,2,0,-1,-1,-1,-1,-1,-1,-1],[2,7,6,2,3,7,0,1,9,-1,-1,-1,-1,-1,-1,-1],[1,6,2,1,8,6,1,9,8,8,7,6,-1,-1,-1,-1],[10,7,6,10,1,7,1,3,7,-1,-1,-1,-1,-1,-1,-1],[10,7,6,1,7,10,1,8,7,1,0,8,-1,-1,-1,-1],[0,3,7,0,7,10,0,10,9,6,10,7,-1,-1,-1,-1],[7,6,10,7,10,8,8,10,9,-1,-1,-1,-1,-1,-1,-1],[6,8,4,11,8,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,6,11,3,0,6,0,4,6,-1,-1,-1,-1,-1,-1,-1],[8,6,11,8,4,6,9,0,1,-1,-1,-1,-1,-1,-1,-1],[9,4,6,9,6,3,9,3,1,11,3,6,-1,-1,-1,-1],[6,8,4,6,11,8,1,2,10,-1,-1,-1,-1,-1,-1,-1],[1,2,10,3,0,11,0,6,11,0,4,6,-1,-1,-1,-1],[4,11,8,4,6,11,0,2,9,2,10,9,-1,-1,-1,-1],[10,9,3,10,3,2,9,4,3,11,3,6,4,6,3,-1],[8,2,3,8,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1],[0,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,9,0,2,3,4,2,4,6,4,3,8,-1,-1,-1,-1],[1,9,4,1,4,2,2,4,6,-1,-1,-1,-1,-1,-1,-1],[8,1,3,8,4,1,4,6,1,6,10,1,-1,-1,-1,-1],[10,1,0,10,0,6,6,0,4,-1,-1,-1,-1,-1,-1,-1],[4,6,3,4,3,8,6,10,3,0,3,9,10,9,3,-1],[10,9,4,6,10,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,9,5,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,4,9,5,11,7,6,-1,-1,-1,-1,-1,-1,-1],[5,0,1,5,4,0,7,6,11,-1,-1,-1,-1,-1,-1,-1],[11,7,6,8,3,4,3,5,4,3,1,5,-1,-1,-1,-1],[9,5,4,10,1,2,7,6,11,-1,-1,-1,-1,-1,-1,-1],[6,11,7,1,2,10,0,8,3,4,9,5,-1,-1,-1,-1],[7,6,11,5,4,10,4,2,10,4,0,2,-1,-1,-1,-1],[3,4,8,3,5,4,3,2,5,10,5,2,11,7,6,-1],[7,2,3,7,6,2,5,4,9,-1,-1,-1,-1,-1,-1,-1],[9,5,4,0,8,6,0,6,2,6,8,7,-1,-1,-1,-1],[3,6,2,3,7,6,1,5,0,5,4,0,-1,-1,-1,-1],[6,2,8,6,8,7,2,1,8,4,8,5,1,5,8,-1],[9,5,4,10,1,6,1,7,6,1,3,7,-1,-1,-1,-1],[1,6,10,1,7,6,1,0,7,8,7,0,9,5,4,-1],[4,0,10,4,10,5,0,3,10,6,10,7,3,7,10,-1],[7,6,10,7,10,8,5,4,10,4,8,10,-1,-1,-1,-1],[6,9,5,6,11,9,11,8,9,-1,-1,-1,-1,-1,-1,-1],[3,6,11,0,6,3,0,5,6,0,9,5,-1,-1,-1,-1],[0,11,8,0,5,11,0,1,5,5,6,11,-1,-1,-1,-1],[6,11,3,6,3,5,5,3,1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,9,5,11,9,11,8,11,5,6,-1,-1,-1,-1],[0,11,3,0,6,11,0,9,6,5,6,9,1,2,10,-1],[11,8,5,11,5,6,8,0,5,10,5,2,0,2,5,-1],[6,11,3,6,3,5,2,10,3,10,5,3,-1,-1,-1,-1],[5,8,9,5,2,8,5,6,2,3,8,2,-1,-1,-1,-1],[9,5,6,9,6,0,0,6,2,-1,-1,-1,-1,-1,-1,-1],[1,5,8,1,8,0,5,6,8,3,8,2,6,2,8,-1],[1,5,6,2,1,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,3,6,1,6,10,3,8,6,5,6,9,8,9,6,-1],[10,1,0,10,0,6,9,5,0,5,6,0,-1,-1,-1,-1],[0,3,8,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[10,5,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,5,10,7,5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,5,10,11,7,5,8,3,0,-1,-1,-1,-1,-1,-1,-1],[5,11,7,5,10,11,1,9,0,-1,-1,-1,-1,-1,-1,-1],[10,11,7,10,7,5,9,8,1,8,3,1,-1,-1,-1,-1],[11,1,2,11,7,1,7,5,1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,1,2,7,1,7,5,7,2,11,-1,-1,-1,-1],[9,7,5,9,2,7,9,0,2,2,11,7,-1,-1,-1,-1],[7,5,2,7,2,11,5,9,2,3,2,8,9,8,2,-1],[2,5,10,2,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1],[8,2,0,8,5,2,8,7,5,10,2,5,-1,-1,-1,-1],[9,0,1,5,10,3,5,3,7,3,10,2,-1,-1,-1,-1],[9,8,2,9,2,1,8,7,2,10,2,5,7,5,2,-1],[1,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,7,0,7,1,1,7,5,-1,-1,-1,-1,-1,-1,-1],[9,0,3,9,3,5,5,3,7,-1,-1,-1,-1,-1,-1,-1],[9,8,7,5,9,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[5,8,4,5,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1],[5,0,4,5,11,0,5,10,11,11,3,0,-1,-1,-1,-1],[0,1,9,8,4,10,8,10,11,10,4,5,-1,-1,-1,-1],[10,11,4,10,4,5,11,3,4,9,4,1,3,1,4,-1],[2,5,1,2,8,5,2,11,8,4,5,8,-1,-1,-1,-1],[0,4,11,0,11,3,4,5,11,2,11,1,5,1,11,-1],[0,2,5,0,5,9,2,11,5,4,5,8,11,8,5,-1],[9,4,5,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,5,10,3,5,2,3,4,5,3,8,4,-1,-1,-1,-1],[5,10,2,5,2,4,4,2,0,-1,-1,-1,-1,-1,-1,-1],[3,10,2,3,5,10,3,8,5,4,5,8,0,1,9,-1],[5,10,2,5,2,4,1,9,2,9,4,2,-1,-1,-1,-1],[8,4,5,8,5,3,3,5,1,-1,-1,-1,-1,-1,-1,-1],[0,4,5,1,0,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,4,5,8,5,3,9,0,5,0,3,5,-1,-1,-1,-1],[9,4,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,11,7,4,9,11,9,10,11,-1,-1,-1,-1,-1,-1,-1],[0,8,3,4,9,7,9,11,7,9,10,11,-1,-1,-1,-1],[1,10,11,1,11,4,1,4,0,7,4,11,-1,-1,-1,-1],[3,1,4,3,4,8,1,10,4,7,4,11,10,11,4,-1],[4,11,7,9,11,4,9,2,11,9,1,2,-1,-1,-1,-1],[9,7,4,9,11,7,9,1,11,2,11,1,0,8,3,-1],[11,7,4,11,4,2,2,4,0,-1,-1,-1,-1,-1,-1,-1],[11,7,4,11,4,2,8,3,4,3,2,4,-1,-1,-1,-1],[2,9,10,2,7,9,2,3,7,7,4,9,-1,-1,-1,-1],[9,10,7,9,7,4,10,2,7,8,7,0,2,0,7,-1],[3,7,10,3,10,2,7,4,10,1,10,0,4,0,10,-1],[1,10,2,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,9,1,4,1,7,7,1,3,-1,-1,-1,-1,-1,-1,-1],[4,9,1,4,1,7,0,8,1,8,7,1,-1,-1,-1,-1],[4,0,3,7,4,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,8,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,9,3,9,11,11,9,10,-1,-1,-1,-1,-1,-1,-1],[0,1,10,0,10,8,8,10,11,-1,-1,-1,-1,-1,-1,-1],[3,1,10,11,3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,11,1,11,9,9,11,8,-1,-1,-1,-1,-1,-1,-1],[3,0,9,3,9,11,1,2,9,2,11,9,-1,-1,-1,-1],[0,2,11,8,0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,8,2,8,10,10,8,9,-1,-1,-1,-1,-1,-1,-1],[9,10,2,0,9,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,8,2,8,10,0,1,8,1,10,8,-1,-1,-1,-1],[1,10,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,3,8,9,1,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,9,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,3,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]],lo=Uint32Array.from(Ni.flat(),i=>i>>>0),co={name:"Bourke",corners:so,edges:no,maxVertices:15,table:lo,cornerBit:i=>1<<i,createPolygonizer(){return(i,e,t)=>{let a=Ni[e],r=0;for(;r<15&&a[r]>=0;)t[r]=a[r],r++;return r}}};var Wi=co;var fo=new Uint32Array([0,2181,2182,2197,2179,6166,2205,2371,2180,2199,6164,2326,2193,2380,2335,1167,2178,2203,6152,2356,10243,14359,14356,1317,6158,2344,18434,1181,14357,1345,24580,272,2177,6154,2201,2338,6150,18432,2323,1177,10242,14350,14353,1341,14349,24578,1313,269,2187,2374,2359,1171,14355,24579,1349,302,14351,1329,24586,284,20481,12289,12297,135,2176,10241,6148,14343,2191,14347,2347,1337,6146,14342,18438,24577,2341,1309,1173,266,6162,14346,18437,24585,14358,20482,24584,12304,18433,24576,28672,16387,24582,12292,16391,4112,2185,14344,2362,1325,2377,24581,1169,305,14348,20480,24587,12306,1353,12290,281,141,2311,1333,1185,317,1321,12293,320,147,24583,12288,16388,4096,12291,8192,4108,127,896,265,538,2866,2373,1864,1974,1701,4489,312,4762,146,6970,794,4784,2944,4165,261,6517,2439,4928,884,7077,1973,5254,2920,5653,534,5926,1842,5226,2378,6469,56,4361,1864,5797,265,6469,538,5797,811,6070,538,6070,56,6962,1864,4634,56,6962,265,5797,2164,6469,1974,6405,4149,5203,2115,6516,6423,6257,129,5637,6480,4458,262,6725,6466,4682,402,5029,6998,4906,2869,4518,6066,4631,1649,6022,6150,7008,944,6196,4900,5954,2930,4666,5002,4520,24,4393,4793,4251,779,5285,6790,5258,1896,7013,6036,6073,1435,5797,896,6070,265,4634,1864,6469,2866,4261,6149,6243,5765,5795,928,6038,4534,4457,6512,6064,177,5962,6050,6258,6721,5249,386,4789,6964,6467,5556,5522,659,7066,6448,2483,6154,4122,2954,6299,6930,2961,4746,4994,2472,4678,5145,1057,6309,5253,2984,4134,4199,120,6213,5432,309,5994,6791,2442,5909,4530,379,4469,5896,1808,5158,6194,584,4202,5216,266,4425,4468,881,5163,5963,36,4773,5426,1845,5685,4971,339,5781,5641,518,6453,5008,1875,5046,4960,1030,6586,6068,2964,6054,5914,791,6693,4677,66,6501,6582,2233,5226,6804,896,5797,4489,312,5797,6155,43,7077,5499,56,5653,5665,2051,5797,4148,884,6326,5704,265,7077,6069,265,4762,6070,146,6070,4489,312,5926,5938,265,4165,6070,261,4762,4617,1864,6517,4634,2169,5254,4634,2230,4890,6970,2164,4634,4980,1027,5653,4630,2164,6469,4784,2944,6469,6970,794,5226,6474,811,6517,6535,691,4165,5392,2866,6469,5926,1842,4970,6410,4244,6148,5764,4998,928,6293,4517,4970,5521,5025,6243,2134,4261,6838,4138,6699,6251,5480,88,4261,6021,6267,5003,6715,4154,88,5765,4662,4897,4145,5377,6149,2147,4261,5206,4982,5748,4180,5024,2614,5270,6472,4248,6920,4363,5659,361,6037,4517,4538,6421,4247,6919,177,6566,5794,7010,4274,6064,6512,1942,6038,4411,6968,6072,6520,4457,438,6038,5936,4146,4354,5650,6422,2416,4453,5957,5974,5892,7009,4273,2823,5274,4616,6153,5257,5962,4730,1832,6565,5978,4521,6169,4632,5928,634,5286,6322,4790,6694,4516,6164,386,5146,7034,6067,6259,4483,5249,1191,5146,4116,4355,4627,5923,6695,1191,5701,5141,5958,4726,6258,4482,2068,6437,7044,5248,6464,4752,6994,1460,6565,4889,6426,7002,5211,4939,1081,7018,6982,4794,6442,4905,5177,843,4789,5016,4999,6967,5559,6437,659,6981,4389,4624,4896,5168,6964,2898,4709,5492,5479,4935,6467,4755,2341,4970,6410,5024,5764,902,5765,4970,6293,4410,2147,4261,6230,4138,6251,88,4261,6021,4184,6715,58,5765,4662,6243,5377,2053,4261,6710,4180,4982,928,5270,4457,6920,4363,1563,6037,4538,4273,4247,2823,6566,6038,4274,6064,2416,6038,4411,5659,6520,361,6038,4390,5936,6512,2326,4453,5892,6919,7009,177,5274,4616,5928,5962,634,6773,4730,6169,4632,1832,5286,6322,4482,4516,2068,5962,7034,4483,5249,2625,5146,4116,5923,6695,1191,5141,4726,6164,6258,386,6437,7044,5556,4752,2898,6837,4889,5177,5211,843,6982,6442,4939,4905,1081,4789,5016,4755,5559,2341,4789,4389,5168,6964,1460,4709,6437,5940,6467,659,6469,4634,1974,4787,6260,265,5797,6962,2164,6469,4634,56,6469,6070,56,5797,6962,265,5797,4361,1864,4634,6070,896,7013,6581,4634,6036,2967,7058,6260,6960,6576,2322,5285,6790,6962,6262,2212,6469,5002,6145,6785,2595,7013,4992,6036,7063,2485,5797,4393,7058,6960,2480,5285,6262,4361,6308,2694,6070,4666,6307,6145,2689,6725,6070,4682,4633,1065,4361,5251,4675,4791,1063,5797,4724,4791,5251,579,6725,4152,4633,5161,586,6469,6150,5752,4155,1547,5637,4245,4458,4907,97,5637,4245,4458,5960,97,6022,4634,4155,5643,104,6469,4518,5910,6066,370,4907,5961,4360,5912,377,5029,6998,5960,4955,810,6405,4634,4944,4996,1332,6405,5428,6070,4996,848,5029,6998,4361,4906,859,5797,5961,4473,4360,1816,4518,4992,6066,4466,1814,7269,7258,6084,7291,7316,7193,7201,7330,3254,7284,7351,7211,4553,7186,7177,7216,7299,3144,7333,7274,7218,7299,7240,7252,7286,7351,3115,6853,7224,7203,7330,7237,7316,7193,7169,3200,7269,6597,7350,7227,7171,7296,6084,7288,3220,5829,7274,7317,7177,7216,7347,7211,7186,3233,7317,7274,7184,7329,7240,7286,7303,7252,3081,7194,6086,7169,7296,7288,7350,7227,7203,3234,7269,7334,7257,4546,7346,6084,7291,7316,3098,7211,4553,7186,7241,7284,7303,7176,7216,3251,7333,7252,7286,7240,7210,7218,7347,7275,3207,7237,4810,7300,7224,7203,7257,7194,7169,3216,7269,7171,7312,7257,7350,6084,7291,7300,3128,7333,7254,7177,7216,7347,7275,7210,7186,3217,7333,7274,7252,7286,7303,7176,4553,7184,3145,7334,6086,7194,7169,7296,7224,7203,7346,3195,6853,7334,7316,7193,7201,7346,7291,7271,3141,7211,4553,7241,7284,7351,7218,7299,7176,3088,7333,7254,7210,7218,7299,7240,7284,7351,3179,6853,4810,7237,7300,7224,7171,7312,7193,3105,7237,7350,7227,7171,7312,7257,7300,7288,3175,5829,7210,5067,7275,7317,7177,7184,7329,3122,5829,7274,7317,7284,6088,7176,7184,7329,3145,7334,7296,7288,7271,7194,7201,7346,7227,3075,6757,5145,4530,6068,1201,5963,4425,4785,4532,2096,4773,5253,7030,6194,1410,6693,4664,5208,5416,25,6501,5008,7011,5779,1924,5781,4394,4243,6966,918,5269,5994,4362,6256,1952,6054,6016,4512,6768,946,5221,5209,4634,6834,7078,6070,5238,5537,2385,4228,5960,6327,7043,4787,4361,4400,4387,2308,5797,4907,7043,6260,6327,5494,5447,5810,2658,6469,4442,4152,4131,4609,6689,5401,6408,1176,5221,4992,6288,6532,5524,5703,7015,6019,2931,5797,6805,6561,4241,4882,4865,6962,4774,2854,5797,4361,6561,6805,5972,5989,6260,5264,2112,7078,4992,4984,5947,5755,6834,4514,4656,288,7066,2488,5158,36,4981,309,6054,4480,6017,2673,6978,4393,5266,1207,6709,5026,6227,1412,6501,5040,4278,105,5226,6474,4136,2091,6053,4489,4993,1978,5669,4928,5955,1313,6214,6410,6251,42,6037,4538,6025,945,4117,4662,5440,1891,4714,4137,4777,7010,5816,5224,5257,2057,6565,6025,6487,4521,6675,7075,6967,903,5125,5974,4117,4129,4896,4663,5671,1861,5226,6804,6404,5128,7040,6914,6834,2667,7077,4489,4408,5048,6327,5499,4442,405,5221,4438,5665,4657,4400,5123,5175,1607,6602,6854,6412,4140,4796,6347,6220,1132,7317,7354,7291,7255,6600,7224,7187,458,7189,4806,7201,5317,7286,6083,7171,3136,7238,7210,7316,7337,4800,7296,7352,3014,7333,6085,7354,7227,4553,5057,7305,2247,5829,4806,4668,5964,4988,4292,4124,348,5813,7040,5552,336,6022,4489,4390,1665,4762,6516,6034,882,5285,5050,5028,832,6517,6402,6439,1835,4458,6214,6241,2067,5994,6800,6048,880,6938,4416,4532,1867,4389,4741,4792,1112,5781,4662,5014,905,5270,4409,4969,1595,4773,6021,6181,2050,4678,4498,5161,56,6469,6170,4480,2954,5797,4393,7058,2203,5797,5961,4473,881,4666,6070,6307,2472,5797,4724,5931,36,5909,6066,4466,896,6586,6036,7063,2051,5126,4634,4155,1547,6405,4634,4944,1875,4933,6070,4996,309,6469,6022,4200,608,4678,4996,4930,400,6725,5288,6315,25,5813,5561,4394,2488,5269,4458,5655,1811,6022,5770,6793,571,5285,7030,6722,576,5909,4480,6167,2851,6586,5040,4281,1924,4518,4448,4196,946,6709,4666,5431,25,7013,6995,4945,1924,4197,6405,5634,1924,6214,6472,6528,6401,6243,4962,4402,259,6837,4441,4517,4496,5556,5304,4168,148,5765,4714,5513,4517,4790,5816,4769,345,6565,6710,6426,6675,6484,5687,5223,1110,4714,5944,4987,6025,5042,6038,5786,694,4261,7018,5957,5974,5440,5995,6658,2978,4117,4354,4611,4667,4184,6231,7047,2872,5050,6020,4987,5944,5024,4265,5129,1152,7018,7074,6756,6947,6721,4416,4880,801,6565,4896,4129,4663,4121,4730,6773,2330,4453,5206,5223,5240,5659,6931,6323,2171,4709,6153,6292,6402,6215,6437,5974,1861,6470,4882,4115,5665,6147,6497,5272,2312,6469,4442,4228,6404,7040,4528,6833,405,5797,4501,6677,6289,4737,7042,6950,678,5797,5988,5446,4980,6452,4409,4506,2394,4774,6950,6562,6070,5010,6291,6199,951,5797,6954,5818,4139,5972,5899,5127,1893,6949,6027,5048,5499,4152,4434,4384,560,6474,5264,6208,4992,6052,7079,7027,1923,7078,4400,4657,5123,6689,6979,5707,2858,6805,4506,5977,4634,4217,4976,4866,18,5221,5048,6027,4408,5755,5144,5396,1142,6469,5989,5972,4711,6183,4136,4233,2121,4806,7193,4544,5058,6156,6339,6476,1132,6853,4508,5321,5212,6844,4296,7052,448,7333,5484,4780,5820,7052,4553,6300,705,7333,6854,5317,5831,4988,4553,4412,2500,4810,7350,5052,6028,5756,6300,6572,962,7333,5452,5996,6854,5132,7106,4140,1995,7189,4668,4124,6339,6156,7111,5500,715,7354,7224,6084,7111,7300,7312,7337,960,5834,4546,7171,4811,7227,7232,7268,2753,6853,7193,4546,5056,4297,7223,7285,714,7237,6086,6028,7107,5835,4412,5404,1224,7237,7206,6220,6412,5532,4140,6086,2247,5228,6412,6220,5056,5004,4546,5676,2497,7237,4297,5320,5532,7052,4524,6844,448,5829,5804,5577,4554,6300,4796,7052,705,5829,5804,6492,6684,4412,7284,4988,2500,5834,4811,6076,6086,6572,5004,6300,962,5829,5578,7110,6850,4140,5964,5132,1995,6085,7227,6343,4156,4296,4636,4444,715,6602,7296,7316,6343,7239,7107,7354,960,4810,7350,7203,7107,7268,7169,7232,2753,6597,7194,4544,7312,7285,5058,7223,714,7269,6084,7111,7020,5404,6339,4412,1224,7269,6084,6476,6597,4716,6156,4140,2247,6469,4634,6070,896,6757,4496,6947,1924,7013,7001,4634,4992,6036,2967,6469,6070,6170,6145,6712,2595,6469,4634,4278,4155,5760,1656,6469,4518,4152,4466,6066,359,6725,6070,4992,5161,4633,1186,6757,6036,4503,5042,6167,2049,6405,4634,4933,6070,4944,900,4197,5520,4518,6020,6947,22,7013,4954,6020,4121,6995,2595,6757,4496,4930,4996,5234,1970,6757,6020,4281,4155,6953,537,6725,6310,4496,5042,5288,1656,7269,7257,4634,5321,4296,7288,7239,7227,5835,3075,6469,7334,5056,4546,7346,7227,7296,7288,6086,3098,7269,7334,6597,4524,7201,7346,6084,7111,7316,2051,6469,4810,7350,7227,7203,7194,7169,7288,4296,3175,7269,6764,6084,5532,6476,6028,6156,4524,4544,946,6469,7334,6076,6339,7203,7346,7271,7169,6849,3200,7269,7258,7350,4810,6084,7291,7193,5321,7201,56,6853,7334,7237,6086,7316,7193,7346,4546,7291,896,6757,7227,6084,6343,6156,4156,6956,7193,4636,2380,6853,7237,6070,4296,5321,7193,7169,7224,7203,714,6757,4508,4544,5058,5004,6156,6476,6076,6084,2860,6853,6764,7193,6476,5212,5756,6156,6343,4124,2851,7269,5834,4811,5532,4636,4524,4156,4297,5052,1924,7237,6086,7257,4634,7300,7288,7350,7227,7312,960,7269,6597,4634,7224,6084,7111,7300,7171,7312,3254,7237,5834,4297,5320,5532,4124,4524,5756,6028,571,7269,4810,5058,5532,4544,4524,5052,7020,6412,1924,6597,4810,7237,6070,6849,7169,7312,7300,7203,2243,6757,5320,4297,4156,5004,5244,6076,4636,4811,412,6853,5572,6070,7193,4546,5056,7312,7330,7300,3128,6853,7020,7193,6700,4636,6412,4156,7107,5724,1924,6853,5834,4811,5212,5756,6076,4668,5004,5320,25,7269,5548,6084,6076,7020,6700,5004,5058,6220,400,6853,7020,5212,7288,7107,5756,6220,6700,4668,25,7269,7258,7312,7171,7224,7300,7239,7291,7350,7330,7201,3097,6853,6764,5004,4668,6956,5212,6076,5756,6476,4508,4124,2060,7269,7334,7346,7257,7201,7194,7316,7239,7288,7296,7171,3131,7237,7020,5532,4524,4124,6412,6220,6028,5756,5052,4668,2604,6757,6020,7047,6323,6148,4244,4496,4880,4627,2851,6469,4442,6070,4992,4866,4114,6408,5272,6481,2593,6757,6565,6801,6694,4790,5042,4402,4145,6401,1924,6469,7078,4992,6199,5047,4656,4384,4634,4779,1659,5221,7078,5401,4634,4779,5537,5524,5238,6070,2051,6757,5042,6323,5492,7047,7010,5794,5974,6215,400,5221,5209,4634,4992,4233,6217,6019,7027,6070,1892,6757,4496,6801,6565,6464,5248,6020,5492,5749,946,6757,4992,4633,6466,5298,1972,6709,5508,6070,4496,4666,901,6501,4634,6915,7008,5776,1924,6469,6054,5042,4120,4472,423]);var Yt=fo;var uo=[[0,0,0],[0,1,0],[0,1,1],[0,0,1],[1,0,0],[1,1,0],[1,1,1],[1,0,1]],po=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],Ga=class{constructor(){this.table=Yt,this.f_test_results=new Int32Array(6)}signbf(e){return e<0}face_tests(e){let t=this.v,a=this.f_test_results;return a.fill(0),e&128?(a[0]=(e&204)===132?t[0]*t[5]<t[1]*t[4]?-1:1:0,a[3]=(e&153)===129?t[0]*t[7]<t[3]*t[4]?-1:1:0,a[4]=(e&240)===160?t[0]*t[2]<t[1]*t[3]?-1:1:0):(a[0]=(e&204)===72?t[0]*t[5]<t[1]*t[4]?1:-1:0,a[3]=(e&153)===24?t[0]*t[7]<t[3]*t[4]?1:-1:0,a[4]=(e&240)===80?t[0]*t[2]<t[1]*t[3]?1:-1:0),e&2?(a[1]=(e&102)===66?t[1]*t[6]<t[2]*t[5]?-1:1:0,a[2]=(e&51)===18?t[3]*t[6]<t[2]*t[7]?-1:1:0,a[5]=(e&15)===10?t[4]*t[6]<t[5]*t[7]?-1:1:0):(a[1]=(e&102)===36?t[1]*t[6]<t[2]*t[5]?1:-1:0,a[2]=(e&51)===33?t[3]*t[6]<t[2]*t[7]?1:-1:0,a[5]=(e&15)===5?t[4]*t[6]<t[5]*t[7]?1:-1:0),a[0]+a[1]+a[2]+a[3]+a[4]+a[5]}face_test1(e){let t=this.v;switch(e){case 0:return t[0]*t[5]<t[1]*t[4]?72:132;case 1:return t[1]*t[6]<t[2]*t[5]?36:66;case 2:return t[3]*t[6]<t[2]*t[7]?33:18;case 3:return t[0]*t[7]<t[3]*t[4]?24:129;case 4:return t[0]*t[2]<t[1]*t[3]?80:160;default:return t[4]*t[6]<t[5]*t[7]?5:10}}interior_test(e,t){let a=this.v,r=1e-9,o=a[4]-a[0],s=a[5]-a[1],c=a[6]-a[2],n=a[7]-a[3],l=o*c-s*n;if(this.signbf(l)){if(e&1)return 0}else if(!(e&1)||Math.abs(l)<r)return 0;let d=.5*(a[3]*s+a[1]*n-a[2]*o-a[0]*c)/l;if(d<=r||d>=1-r)return 0;let u=a[0]+o*d,f=a[1]+s*d,p=a[2]+c*d,x=a[3]+n*d,y=p*u,m=x*f;if(e&1){if(y<m&&!this.signbf(m))return(this.signbf(f)===this.signbf(a[e]))+t}else if(y>m&&!this.signbf(y))return(this.signbf(u)===this.signbf(a[e]))+t;return 0}pattern(e){let t=this.table,a=(e&128)!==0,r=a?e^255:e,o=t[r];if(o===void 0)throw new Error(`MC33 lookup miss: ${r}`);let s=(o&2048)!==0,c=a?!s:s,n=c?e:e^255,l=o&2047,d=o>>>12,u;switch(d){case 0:u=l;break;case 1:u=n&this.face_test1(l>>2)?183+(l<<1):159+l;break;case 2:u=this.interior_test(l,0)?239+6*l:231+(l<<1);break;case 3:n&this.face_test1(l%6)?u=575+5*l:u=this.interior_test(Math.floor(l/6),0)?407+7*l:335+3*l;break;case 4:{let f=this.face_tests(n);f===-3?u=695+3*l:f===-1?u=(this.f_test_results[4]+this.f_test_results[5]<0?this.f_test_results[0]+this.f_test_results[2]<0?759:799:719)+5*l:f===1?u=(this.f_test_results[4]+this.f_test_results[5]<0?983:this.f_test_results[0]+this.f_test_results[2]<0?839:911)+9*l:u=this.interior_test(l>>1,0)?1095+9*l:1055+5*l;break}case 5:{let f=this.face_tests(n);f===-2?u=(l&2?this.interior_test(0,0):this.interior_test(0,0)||this.interior_test(l?1:3,0))?1213+(l<<3):1189+(l<<2):f===0?u=(this.f_test_results[2+l]<0?1261:1285)+(l<<3):u=(l&2?this.interior_test(1,0):this.interior_test(2,0)||this.interior_test(l?3:1,0))?1237+(l<<3):1201+(l<<2);break}case 6:{let f=this.face_tests(n);f===-2?u=this.interior_test(14287116>>(l<<1)&3,0)?1453+(l<<3):1357+(l<<2):f===0?u=(this.f_test_results[l>>1]<0?1645:1741)+(l<<3):u=this.interior_test(10991589>>(l<<1)&3,0)?1549+(l<<3):1405+(l<<2);break}default:{let f=Math.abs(this.face_tests(n));if(f===0){let p=(this.f_test_results[1]<0)<<1|this.f_test_results[5]<0;if(this.f_test_results[0]*this.f_test_results[1]===this.f_test_results[5])u=2157+12*p;else{let x=this.interior_test(p,1);u=2285+(x?10*p-40*x:6*p)}}else if(f===2)u=1917+10*((this.f_test_results[0]<0?this.f_test_results[2]>0:12+(this.f_test_results[2]<0))+(this.f_test_results[1]<0?this.f_test_results[3]<0:6+(this.f_test_results[3]>0))),this.f_test_results[4]>0&&(u+=30);else if(f===4){let p=21+11*this.f_test_results[0]+4*this.f_test_results[1]+3*this.f_test_results[2]+2*this.f_test_results[3]+this.f_test_results[4];p>>4&&(p-=p&32?20:10),u=1845+3*p}else u=1839+2*this.f_test_results[0]}}return{offset:u+1,reverse:c}}triangles(e,t,a){if(this.v=e,t===0||t===255)return 0;let r=this.pattern(t),o=0;for(let s=r.offset;s<Yt.length;s++){let c=Yt[s],n=c&15,l=c>>4&15,d=c>>8&15;if(n<=12&&l<=12&&d<=12&&n!==l&&l!==d&&n!==d){if(o+3>a.length)throw new Error("MC33 cell exceeds output capacity");a[o++]=n,a[o++]=r.reverse?d:l,a[o++]=r.reverse?l:d}if(!(c&4096))return o}throw new Error("MC33 pattern exceeds lookup table")}},ho={name:"MC33",corners:uo,edges:po,maxVertices:36,table:Yt,cornerBit:i=>128>>i,createPolygonizer(){let i=new Ga;return i.triangles.bind(i)}};var Li=ho;var fa={bourke:Wi,mc33:Li};function Ei(i,e,t,a){let r=fa[a];if(!r)throw new Error(`Unknown marching cubes algorithm: ${a}`);if(!["x","y","z"].every(o=>Number.isInteger(e[o])&&e[o]>=2))throw new Error("Grid dimensions must be integers of at least 2");if(!(i instanceof Float32Array)||i.length!==e.x*e.y*e.z)throw new Error("Expected a Float32Array with x*y*z samples, indexed as (z*y + y)*x + x");if(!Number.isFinite(t))throw new Error("Isolevel must be finite");for(let o of i)if(!Number.isFinite(o)||!Number.isFinite(Math.fround(o-t)))throw new Error("Field samples and their differences from the isolevel must be finite f32 values");return r}function Ua(i,e,t=0,a="bourke",r={}){t=Math.fround(t),r.coordinates&&Ea(r.coordinates);let o=Ei(i,e,t,a),{x:s,y:c,z:n}=e,l=o.createPolygonizer(),d=new Float32Array(8),u=new Uint8Array(o.maxVertices),f=new Float32Array(39),p=new Float32Array(65536),x=0;for(let y=0;y<n-1;y++)for(let m=0;m<c-1;m++)for(let M=0;M<s-1;M++){let h=0;for(let b=0;b<8;b++){let z=o.corners[b];d[b]=i[((y+z[2])*c+m+z[1])*s+M+z[0]]-t,d[b]<0&&(h|=o.cornerBit(b))}if(h===0||h===255)continue;let v=l(d,h,u);if(x+v*3>p.length){let b=new Float32Array(Math.max(p.length*2,x+v*3));b.set(p),p=b}for(let b=0;b<12;b++){let[z,D]=o.edges[b];if(d[z]<0==d[D]<0)continue;let _=d[z]-d[D],S=Math.abs(_)<1e-9?.5:Math.max(0,Math.min(1,d[z]/_)),k=o.corners[z],g=o.corners[D];f[b*3]=(M+k[0]+S*(g[0]-k[0]))/(s-1),f[b*3+1]=(m+k[1]+S*(g[1]-k[1]))/(c-1),f[b*3+2]=(y+k[2]+S*(g[2]-k[2]))/(n-1)}f[36]=(M+.5)/(s-1),f[37]=(m+.5)/(c-1),f[38]=(y+.5)/(n-1);for(let b=0;b<v;b++){let z=u[b]*3;p[x++]=f[z],p[x++]=f[z+1],p[x++]=f[z+2]}}return Ii(p.slice(0,x),r.coordinates)}function xo(i){let e=fa[i];if(!e)throw new Error("Unknown terrain algorithm");let t=Float32Array.from(e.corners,c=>c[1]?1:-1),a=0;t.forEach((c,n)=>{c<0&&(a|=e.cornerBit(n))});let r=new Uint8Array(e.maxVertices),o=e.createPolygonizer()(t,a,r),s=[];for(let c of r.slice(0,o)){if(c===12)throw new Error("Heightfield template unexpectedly uses a center vertex");let[n,l]=e.edges[c],d=e.corners[n],u=e.corners[l];if(d[0]!==u[0]||d[2]!==u[2])throw new Error("Heightfield crossing must be vertical");s.push([d[0],d[2]])}return s}function Gi(i,e=0,t="mc33",a=!1){if(!Number.isInteger(i)||i<2||i&i-1)throw new Error("Divisions must be a power of two of at least 2");if(!Number.isInteger(e)||e<0||e>15)throw new Error("Seam mask must be 0..15");let r=i+1,o=xo(t),s=new Uint32Array(i*i*6),c=0;function n(u){let f=u.map(x=>[x%r,Math.floor(x/r)]),p=(f[1][0]-f[0][0])*(f[2][1]-f[0][1])-(f[1][1]-f[0][1])*(f[2][0]-f[0][0]);p!==0&&(p>0&&([u[1],u[2]]=[u[2],u[1]]),s.set(u,c),c+=3)}let l=[],d=[];for(let u=0;u<o.length;u+=3){let[f,p,x]=o.slice(u,u+3),y=(p[0]-f[0])*(x[1]-f[1])-(p[1]-f[1])*(x[0]-f[0]),m=[f[1]*r+f[0],p[1]*r+p[0],x[1]*r+x[0]];y>0&&([m[1],m[2]]=[m[2],m[1]]),l.push(...m),d.push(...m.map(M=>M+(M%r===0?1:-1)).reverse())}for(let u=0;u<i;u+=2)for(let f=0;f<i;f+=2)if(f===0&&e&1||f===i-2&&e&2||u===0&&e&4||u===i-2&&e&8){let x=[[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1]].map(m=>[f+m[0],u+m[1]]).filter(([m,M])=>{let h=m===0&&e&1||m===i&&e&2,v=M===0&&e&4||M===i&&e&8;return!(h&&M&1)&&!(v&&m&1)}).map(([m,M])=>M*r+m),y=(u+1)*r+f+1;for(let m=0;m<x.length;m++)n([y,x[m],x[(m+1)%x.length]])}else for(let x=0;x<2;x++)for(let y=0;y<2;y++){let m=a&&y!==x?d:l;for(let M of m)s[c++]=(u+x)*r+f+y+M}return s.slice(0,c)}function Oa(i){let e=new Map;for(let t=0;t<i.length;t+=3)for(let a=0;a<3;a++){let r=i[t+a],o=i[t+(a+1)%3],s=r<o?`${r},${o}`:`${o},${r}`;e.has(s)||e.set(s,[r,o])}return Uint32Array.from(Array.from(e.values()).flat())}var St=Object.freeze({natural:0,mesas:1,fractal:2,mosaic:3});function Va(i){let e=Math.imul(i,1664525)+1013904223>>>0,t=e>>>30,a=(e&65535)*(2*Math.PI/65536),r=o=>{let s=Math.max(0,Math.min(1,(o-.15)/.63));return s*s*(3-2*s)};return{mesas:t!==1,fractal:t!==0,score([o,s,c]){let n=Math.sin(-3.4*o+6.2*s+4.1*c-a),l=.72*Math.sin(7.2*o-4.6*s+3.8*c+a+.94*n)+.28*Math.sin(11.8*o+5.7*s-7.3*c-a);return[t===1?0:r(l),t===0?0:r(-l)]}}}function pa(i){let e=(i^1353215269)>>>0;return e=Math.imul(e^e>>>16,2146121005),e=Math.imul(e^e>>>15,2221713035),.24+.88*(((e^e>>>16)>>>0)/4294967296)**1.12}function je({regions:i},[e,t,a],r){if(!i)return r==="mesa"?[0,1,0,0]:r==="volcanic"?[0,0,0,1]:[1,0,0,0];let{side:o,values:s}=i,c=o-1,n=Math.hypot(e,a),l=n>0?Math.atan2(a,e)/(2*Math.PI):0,d=(l-Math.floor(l))*c,u=Math.atan2(n,t)*c/Math.PI,f=Math.floor(d),p=Math.floor(u),x=Math.min(c,p+1),y=d-f,m=u-p,M=s[p*o+f],h=s[p*o+Math.min(c,f+1)],v=s[x*o+f],b=s[x*o+Math.min(c,f+1)],z=w=>((M>>>w&255)*(1-y)*(1-m)+(h>>>w&255)*y*(1-m)+(v>>>w&255)*(1-y)*m+(b>>>w&255)*y*m)/255,D=z(0),_=z(8),S=z(16),k=D+_+S,g=1/Math.max(1,k);return[Math.max(0,1-k),D*g,_*g,S*g]}function Ui({side:i,values:e}){let t=i-1,a=Math.max(1,Math.floor(t/4)),r=a+1,o=new Float32Array(r**2),s=[1,4,6,4,1],c=new Float32Array(i*a);for(let n=0;n<a;n++){let l=Math.round(n*t/a),d=s.map((u,f)=>(l+(f-2)*2+t)%t);for(let u=0;u<i;u++){let f=u*i,p=0;for(let x=0;x<5;x++)p+=s[x]*e[f+d[x]];c[u*a+n]=p/16}}o.fill(e[0],0,r),o.fill(e[t*i],a*r);for(let n=1;n<a;n++){let l=Math.round(n*t/a),d=s.map((u,f)=>Math.min(t,Math.max(0,l+(f-2)*2))*a);for(let u=0;u<a;u++){let f=0;for(let p=0;p<5;p++)f+=s[p]*c[d[p]+u];o[n*r+u]=f/16}o[n*r+a]=o[n*r]}return o}function Oi(i=123456789,{reseedLayers:e=i!==123456789}={}){let t=i>>>0;function a(){t+=1831565813;let f=Math.imul(t^t>>>15,1|t);return f^=f+Math.imul(f^f>>>7,61|f),((f^f>>>14)>>>0)/4294967296}let r=f=>(a()<.5?-1:1)*a()*f,o=r(.3),s=r(.1),c=a()*.4-.2+.65,n=a()*.2-.1+.65,l=a()*.2-.1,d=2.4,u=[["computeFBM",.8,6,2,.75,l+2],["computeFBM2",1,8,2,.75,l+1.3],["computeVoronoiTileNoise",.35,2,2,.9,c],["computeRidgedMultifractal4",.2,6,2.1,1,c],["computeLanczosBillow",.5,6,2,1,n]].map(([f,p,x,y,m,M],h)=>({entryPoint:f,params:{seed:e?i+(h+1)*15485863>>>0:i,zoom:d*p,freq:1,octaves:x,lacunarity:y,gain:.5,scalar:m,transform:0,xShift:M,yShift:M,zShift:M,seedAngle:Math.PI/2,threshold:.3,voroMode:2,warpAmp:0}}));return{seed:i,sphereOffset:o,sphereOffset2:s,layers:u}}function ua(i,e,t,a,r){return e+r*(.5*(t-i)+r*(i-2.5*e+2*t-.5*a+r*(.5*(a-i)+1.5*(e-t))))}function Xt(i,e,t,a,r){return .5*(t-i)+r*(2*(i-2.5*e+2*t-.5*a)+r*(1.5*(a-i)+4.5*(e-t)))}function kt({side:i,values:e},[t,a,r],o){let s=Math.hypot(t,r),c=s>0?Math.atan2(r,t)/(2*Math.PI):0,n=(c-Math.floor(c))*(i-1),l=Math.atan2(s,a)*(i-1)/Math.PI,d=Math.floor(l),u=h=>(h+i-1)%(i-1),f=(h,v,b=ua)=>{(h<0||h>=i)&&(h=h<0?-h:2*(i-1)-h,v+=(i-1)*.5);let z=Math.floor(v),D=h*i;return b(e[D+u(z-1)],e[D+u(z)],e[D+u(z+1)],e[D+u(z+2)],v-z)},p=(h,v=ua)=>f(d+h,n,v),x=p(-1),y=p(0),m=p(1),M=p(2);if(o&&s>1e-5){let h=ua(p(-1,Xt),p(0,Xt),p(1,Xt),p(2,Xt),l-d),v=Xt(x,y,m,M,l-d),b=h/(2*Math.PI*s**2),z=v/(Math.PI*s),D=(i-1)*.023;o[0]=(-r*b+t*a*z)*D,o[1]=-s*s*z*D,o[2]=(t*b+r*a*z)*D}else if(o){let h=i-1,v=a>0?1:h-1,b=.023/(2*Math.sin(Math.PI/h));o[0]=(f(v,0)-f(v,h*.5))*b,o[1]=0,o[2]=(f(v,h*.25)-f(v,h*.75))*b}return ua(x,y,m,M,l-d)}var Bt=Object.freeze({computeFBM:"Perlin fBm",computeFBM2:"Warped fBm",computeVoronoiTileNoise:"Voronoi",computeRidgedMultifractal4:"Ridged multifractal",computeLanczosBillow:"Lanczos billow",computeLanczosAntiBillow:"Lanczos anti-billow",computeSimplexFBM:"Simplex fBm",computeBillow:"Billow",computeRidgedMultifractal:"Ridged Perlin",computeVoronoiBM1:"Voronoi fractal"}),ha=Object.freeze({perlin:"Perlin",ridged:"Ridged Perlin",fbm:"Perlin fBm",value:"Value noise"}),go=5,Vi=["Mountains","Canyons","Granite","Volcanic"],da=Object.freeze({seed:[0,4294967295,1],zoom:[1e-4,100,.01],freq:[1e-4,100,.01],octaves:[1,12,1],lacunarity:[1,4,.05],gain:[0,1,.01],xShift:[-1e3,1e3,.05],yShift:[-1e3,1e3,.05],zShift:[-1e3,1e3,.05],turbulence:[0,1,1],seedAngle:[-10,10,.05],exp1:[0,8,.05],exp2:[0,8,.05],threshold:[0,1,.01],rippleFreq:[0,100,.1],time:[-1e3,1e3,.05],warpAmp:[-10,10,.05],gaborRadius:[.001,20,.1],terraceStep:[.001,100,.1],toroidal:[0,1,1],voroMode:[0,16,1],edgeK:[0,100,.1],scalar:[-4,4,.05],transform:[-4,4,.05]}),Hi=Object.freeze({turbulence:0,exp1:1,exp2:0,rippleFreq:10,time:0,gaborRadius:4,terraceStep:8,toroidal:0,edgeK:0});function jt(i){if(i==null)return null;let{regionMap:e,layers:t}=i;if(!e||!Object.hasOwn(ha,e.algorithm)||!(e.frequency>=.25&&e.frequency<=24)||!(e.transition>=.05&&e.transition<=2)||!Array.isArray(t)||t.length!==go)throw new RangeError("Choose a valid region map and five terrain layers.");return Object.freeze({regionMap:Object.freeze({algorithm:e.algorithm,frequency:Number(e.frequency),transition:Number(e.transition)}),layers:Object.freeze(t.map(({algorithm:a,uniforms:r={},weights:o})=>{if(!Object.hasOwn(Bt,a)||!Array.isArray(o)||o.length!==4||!o.every(c=>Number.isFinite(c)&&c>=0&&c<=1))throw new RangeError("Choose a valid layer noise and region weights from 0 to 1.");let s={};for(let[c,n]of Object.entries(r)){let l=da[c];if(!Object.hasOwn(da,c)||!Number.isFinite(n)||n<l[0]||n>l[1]||l[2]===1&&!Number.isInteger(n))throw new RangeError(`Invalid terrain uniform ${c}.`);s[c]=n}return Object.freeze({algorithm:a,uniforms:Object.freeze(s),weights:Object.freeze([...o])})}))})}function ma(i,e){let t=i?.regionMap;return t?[t.frequency,t.transition,Object.keys(ha).indexOf(t.algorithm)+1,e]:[0,0,0,0]}var xa=["erosion","incised","soft"],ut={hybrid:1,ridges:1.35,rolling:.35},Ha=Object.freeze({range:"hybrid",landscape:"natural",landscapeStrength:1,relief:1,slopes:"erosion",ground:"erosion",slopeOctaves:4,groundOctaves:5,erosionStrength:1.2,variation:.8,noiseMix:null});function Zt(i,e=Ha){let t={...e,...i};if(i&&Object.hasOwn(i,"noiseMix")&&(t.noiseMix=jt(i.noiseMix)),!Object.hasOwn(ut,t.range)||!Object.hasOwn(St,t.landscape)||!Number.isFinite(t.landscapeStrength)||t.landscapeStrength<0||t.landscapeStrength>1||!Number.isFinite(t.relief)||t.relief<.25||t.relief>1.25||!xa.includes(t.slopes)||!xa.includes(t.ground)||!Number.isInteger(t.slopeOctaves)||t.slopeOctaves<0||t.slopeOctaves>4||!Number.isInteger(t.groundOctaves)||t.groundOctaves<0||t.groundOctaves>5||!Number.isFinite(t.erosionStrength)||t.erosionStrength<0||t.erosionStrength>2||!(t.variation>=0&&t.variation<=1)||!Number.isFinite(t.variation))throw new RangeError("Use a valid planet relief profile, octave counts and variation from 0 to 1.");return Object.freeze(t)}function Yi(i){return[ut[i.range],i.variation,i.slopeOctaves,i.groundOctaves,xa.indexOf(i.slopes),xa.indexOf(i.ground),0,0]}var Xi=[2500,1100,475,180,65,22,6],Ct=[245,138,73,24,7,2.25,.6],Zi=1.85*2*1.32*(.84*Ct[0]+Ct[1]+Ct[2]+Ct[3])+200;function gt(i,e,t){let a=Math.min(1,Math.max(0,(t-i)/(e-i)));return a*a*(3-2*a)}function ji([i,e,t],a,[r,o,s],c){let n=Math.max(.5,1+c*e),l=i/n,d=t/n,u=r*i+o*(c+e)+s*t,f=2/(1+l*l+d*d);return[l*a,d*a,(r-l*u)*f,(s-d*u)*f]}function vo(i,e,t,a,r,o){let s=Math.floor(i),c=Math.floor(e),n=i-s,l=e-c,d=n*n*(3-2*n),u=l*l*(3-2*l),f=0,p=0;for(let y=0;y<2;y++)for(let m=0;m<2;m++){let M=o(s+m,c+y,0,r),h=(M&255)*(.6/255)-.3,v=(M>>>8&255)*(.6/255)-.3,b=(n-m-h)*t+(l-y-v)*a+1.57,z=(m?d:1-d)*(y?u:1-u);f+=Math.cos(b)*z,p+=Math.sin(b)*z}let x=Math.max(.5,Math.hypot(f,p));return[f/x,p/x]}function Ki(i,e,t,a,r,o,s,c,n,l){if(!s.slopeOctaves&&!s.groundOctaves)return 0;let d=gt(.05,.76,Math.hypot(...a)),u=.06+.94*d,f=i[0]*a[0]+i[1]*a[1]+i[2]*a[2],p=gt(.45,2,Math.hypot(...a.map((S,k)=>S-i[k]*f))),x=gt(-.19,.19,i[1]),y=[[x,0,ji(i,e,a,1)],[1-x,1471,ji(i,e,a,-1)]].filter(([S])=>S>0),m=y.map(([,,[,,S,k]])=>{let g=Math.hypot(S+1e-5,k)||1;return[.74*(S+1e-5)/g,.74*k/g,0,gt(.045,.6,Math.hypot(S,k))]}),M=1,h=1,v=0,b=1-.74*c[2],z=1.32*c[0]+.86*c[1]+.74*c[2]+.84*c[3],D=s.erosionStrength;if(s.variation>0){let[S,k,g]=i,[w]=n(S*5.8+.87,k*5.8-1.52,g*5.8+2.3,t+811),[P]=n(S*9.2-2.4,k*9.2+.63,g*9.2+1.1,t+1979);M-=.75*s.variation*(1-gt(-.47,.31,w)),h-=.65*s.variation*(1-gt(-.47,.31,P))}let _=e;for(let S=0;S<Xi.length;S++){let k=S>=4;if(S===4&&(_=e+o+v),k?S-4>=s.groundOctaves:S>=s.slopeOctaves)continue;let g=k?s.ground:s.slopes,w=Ct[S]*(k?h:M*b),P=Xi[S],C=t+3023+S*71;if(g==="erosion"){let B=k?S===4?1-.35*p:.6-.38*p:1,W=k?Math.min(1.45,D):D*z*(S===0?.84:1);for(let R=0;S<6&&R<y.length;R++){let[Q,q,[E,N]]=y[R],[O,Z,Y,X]=m[R],te=Math.hypot(O+1e-5,Z)||1,ie=-7.1*Z/te,F=7.1*(O+1e-5)/te,[L,j]=vo(E/P,N/P,ie,F,C+q,l),I=L*(.58+.42*Math.abs(L)),$=Math.max(0,-I),V=w*u*B;v+=Q*V*W*(Y*(1-X)+(.7*I-1.05*$**2)*X-.1);let K=V*.71/P*j/Math.sqrt(.09+j**2);m[R]=[O-ie*K,Z-F*K,Y*(1-X)+I*X,X*(1.6-.6*X)*gt(.02,.49,Math.abs(j))]}if(S<=2||k){let[R,Q,q]=i,[,E,N,O]=c,Z=k?[(4*R-20*Q+22*q)/30,(28*R+10*Q+4*q)/30,(-10*R+20*Q+20*q)/30]:i,[Y,X,te]=Z,ie=k&&S%2===1?[(4*Y-4*X+7*te)/9,(8*Y+X-4*te)/9,(Y+8*X+4*te)/9]:Z,F=k?_:e+.6*r,[L]=n(...ie.map(j=>j*F/P),C+431);if(S<2){let j=Math.max(0,1-(Math.hypot(L,.018)-.018)/.63);v+=w*d*(S===1?.89:.59)*(j*j-.38)}else if(!k)v+=Ct[S]*.24*b*L;else{let j=L-.14*O,I=.55-.27*N,$=Math.max(0,1-(Math.hypot(j,.05)-.05)/I),V=Math.min(1,Math.max(0,(L+.72)/1.44)),K=gt(.26,.66,V)-V,ae=.48*L-(.22+.52*O+.12*N)*$*$+.68*E*K;v+=w*(1.24-.36*d)*(S>=6?1:.77)*ae}}}else{let[B]=n(...i.map(R=>R*(k?_:e)/P),C),W=Math.max(0,1-(Math.hypot(B,.055)-.055)/.51);v+=w*(g==="incised"?-W*W:.5*B)}}return v}var pt=[["Utahish","000033 000097 000097 ffb266 003300 75b582 994c00 cc6600 663300 994c00 cc6600 ff8000 ffb266 993300 ea9966 cc6633 003300 39b532 993300 663300 331900 994c00 cc6600 146338 75b582 146338 ff8000 e1e1e1"],["Volcanic","000000 190c00 331900 4c2600 663300 804000 995933 b32200 8b0000 661111 802d24 994600 b35900 cc9900 bb9b55 b3a970 ccc0a0 b39966 cccca4 b3a077 998e7e 6c5f6c 595959 696969 778899 708090 a9a9a9"],["Desert","4d3319 664c33 80664c 997f66 b39980 ccb399 cccc99 cccc66 cccc33 ccb300 cc8033 cc6600 cc6600 ff8000 ffb266 663300 664d33 996600 b38000 ccb366 b3b399 999980 808066 66664c 4c4c33 333319 ccb399"],["Forest","000019 003300 004d00 006600 008000 198019 338033 4c994c 66b366 80cc80 99cc66 b3cc33 cccc00 ccb300 cc9933 cc8000 004d00 006600 008000 663300 664d33 996600 b38000 ccb366 b3b399 999980 808066 66664c 4c4c33 e1e1e1"],["Oceanic","000019 000033 00004c 000066 000080 194d80 3380b3 4c99cc 66b3e5 72cccc 99ccff 59cccc 5699b3 3683b5 2d93c9 23415a 32557f 58626f 636d7f 708090 778899 696969 595959 4d4d4d 424242 373737"],["Ice","000033 000066 000099 0000cc 0000ff 3399ff 66ccff 99ccff cce5ff e5ffff ffffff e0ffff add8e6 87ceeb 87cefa 4682b4 6495ed b0c4de c7ceea fffafa f0f8ff f0ffff f0fff0 f5fffa fff8dc ffefd5 e1e1e1"],["Ice2","000019 000033 00004c 000066 000080 194d80 3380b3 4c99cc 66b3e5 72cccc 99ccff 59cccc 5699b3 3683b5 2d93c9 23415a 32557f 58626f 636d7f 808080 78879b 649696 64877d 7b9b9b ccd2b4 c8c3aa e1e1e1"],["Mars Dawn","120a0e 341612 582a18 7e3a1c a04c24 bf6434 d2824c dea270 e8be94 f3d7ba fcf0dc d0ae84 aa7852 885237 6c3e2d 523028 42583e 5c764c 847858 e0e0e0"],["Badlands","1c120c 3a2012 5c3016 82441e a45c2c c27640 d89256 e4ac70 ecc28a f4d6aa 785c36 5c784c 8a9860 bcaa6e d2bc84 a56e4c 744a34 56362a 462e24 e1e1e1"],["Jungle","06100c 0a2012 0e3418 164e22 206c2e 308840 46a052 5eb662 7ec46e 9cce7a bcc478 786e40 5c5230 4a4228 3a3222 2c281c 28606c 3e8a8e 74b0aa e4ece4"],["Toxic","080e08 121c0e 1c2e14 2e4618 46621a 5e801e 78a022 96bc2a b6d238 d6e452 c6bc60 a48c44 806432 624a2a 4c3626 3a2a24 265a52 328476 58c4a8 e4f8ce"],["Lavender Dusk","0c0a1c 181230 2a1c48 3e2a62 583a7e 764e9a 9668b2 b684c4 ce9ccc e2b8d2 f0d0d8 ceb0ac b08e88 8c6a66 6c5052 503e44 4e7286 709cb0 a4cad4 f4f4f6"],["Amberstone","22140e 3a2216 58361e 784e2a 986636 b68042 cc9a52 deb468 eaca82 f2dca0 e4ccb0 d2ba9e bea48c a8907c 927c6c 7c6c5e 685a50 967462 bc947a f5ece0"],["Copper Oxide","0a1416 122628 1a383a 224a4c 2c5e60 387476 488a8a 60a29c 82b09c a4a47e bc9260 cc7c4a ba663a a05230 844228 6a3624 542c20 74583a aa906c e8e2d4"],["Moon Dust","08080a 121216 1c1c22 28282e 36363c 46464e 585860 6c6c74 808088 94949a a8a8ac b8b8ba c4c4c4 b0a294 988a7e 80746c 6c625c 5e5854 7e848a e8e8ec"],["Coral Sea","000c1e 001a34 002c4e 00426e 005e8e 147caa 369cc0 5cb8cc 82cece a6dcc4 c4d6a8 dcc48e ecb07e f49a78 ee8278 de6c76 ba6078 926e8a 708aa4 f0f6f8"]],Ya=new Map,yo=new Set(["moon-dust","lunar-highlands","basalt-mare","pluto","ceres","ceres-crater-fields"]),bo={lakeshore:"alpine",ice:"alpine",ice2:"alpine",forest:"alpine",jungle:"alpine",utahish:"mesa",badlands:"mesa",desert:"mesa","copper-oxide":"mesa","verdigris-sea":"mesa",volcanic:"volcanic","amethyst-tide":"volcanic","mars-dawn":"volcanic",toxic:"volcanic",io:"volcanic"},wo={lakeshore:.87,forest:.98,jungle:1,oceanic:.36,utahish:.32,"coral-sea":.4,toxic:.52,"lavender-dusk":.26};function nt(i,e,t,{id:a=i.toLowerCase().replaceAll(" ","-"),ocean:r,dry:o=!1,material:s=0,craterDetail:c=0,cryoGlaciers:n=!1}={}){let l=e.split(" ").map(d=>parseInt(d,16));Ya.set(a,{id:a,name:i,stops:l,seedOffset:t,geology:bo[a]??"mixed",vegetation:wo[a]??.045,lunar:yo.has(a),ocean:r,dry:o,material:s,craterDetail:c,cryoGlaciers:n})}nt("Lakeshore","183b5b 285c7e 4b8b95 b8a979 59794e 789660 86996a 8e8976 bdbaa8 e1e7e9",0);pt.forEach((i,e)=>nt(...i,1013*(e+1),i[0]==="Amberstone"?{id:"gas-giant"}:void 0));nt("Verdigris Sea","173f40 448e7a d8c58f d7a873 b47851 a85a42 784438 5a4541 6c7774 b3bc9f f3e8ce",1013*(pt.length+1),{ocean:{coverage:.86,shallow:[.06,.3,.19,.006],deep:[.006,.064,.065,.0018],sediment:[.66,.51,.29],outcrop:[.33,.12,.06],shoal:[.16,.45,.29,440]}});nt("Amethyst Tide","241943 524873 d2a9c5 b888b6 885da2 674785 493855 404059 78758d b3a7c4 e1d7ed",1013*(pt.length+2),{ocean:{coverage:.93,shallow:[.23,.12,.36,.008],deep:[.043,.014,.097,.0019],sediment:[.52,.37,.53],outcrop:[.095,.063,.13],shoal:[.42,.23,.47,320]}});nt("Lunar Highlands","24272e 41454c 565b64 6c717a 80868e 999da3 aeb3b7 c3c6c7 d4d6d5 e3e5e2",1013*(pt.length+3));nt("Basalt Mare","17161a 28272d 3a373c 504847 655953 74645b 8c786b a39181 b8a898 d1c1af",1013*(pt.length+4));nt("Titan","192d31 304549 796746 9c8252 b7a274 ccb688 e0cca5 bca783 9c9f86 b8bda3 d6d3bb",1013*(pt.length+5),{material:1,ocean:{name:"Methane seas",coverage:.095,shallow:[.027,.073,.076,.014],deep:[.006,.016,.026,.005],sediment:[.38,.29,.16],outcrop:[.17,.13,.087],shoal:[.049,.1,.089,160]}});nt("Io","302529 614033 a7603c d08536 e1ad47 e9c461 ead178 dcca98 b5a6bb c8bfd6 efe3cc",1013*(pt.length+6),{material:2,dry:!0});nt("Pluto","431e24 793227 a04d35 ca6845 ce8667 dba990 b9c9ce d8e1df e9e7d9 f7f4e7",1013*(pt.length+7),{material:3,craterDetail:.62,cryoGlaciers:!0});var $i="211824 302c40 2c405d 47618a 65515f 8e5144 a76953 b78770 adaba7";nt("Ceres",$i,1013*(pt.length+8),{material:4,craterDetail:1.25});nt("Ceres Crater Fields",$i,1013*(pt.length+8),{material:4,craterDetail:2});var At=Object.freeze(Array.from(Ya.values(),({id:i,name:e,ocean:t})=>Object.freeze({id:i,name:e,wet:t!==void 0})));function ht(i="lakeshore"){let e=Ya.get(i);if(!e)throw new RangeError(`Unknown planet preset: ${i}`);return e}function Kt(i,[e,t,a],r=0){if(!i)return 0;let[o,s,c,n]=i.chart,l=Math.atan2(a,e)/(2*Math.PI)-o+.5,d=(l-Math.floor(l)-.5)/c,u=(Math.atan2(Math.hypot(e,a),t)/Math.PI-s)/n;if(Math.abs(d)>=1||Math.abs(u)>=1)return 0;let f=i.side-1,p=(.5+d*.5)*f,x=(.5+u*.5)*f,y=Math.min(f-1,Math.floor(p)),m=Math.min(f-1,Math.floor(x)),M=m*i.side+y,h=M+i.side,v=p-y,b=x-m,{values:z}=i,D=_=>(1-v)*(z[_]>>>r&255)+v*(z[_+1]>>>r&255);return((1-b)*D(M)+b*D(h))/255}var Rt=2*Math.PI,ga=(i,e,t)=>Math.min(t,Math.max(e,i)),$t=(i,e,t)=>i+(e-i)*t;function Ee(i,e,t){let a=ga((t-i)/(e-i),0,1);return a*a*(3-2*a)}function Ji(i,e,t){let a=Rt*i/t,r=Math.PI*e/t,o=Math.sin(r);return[o*Math.cos(a),Math.cos(r),o*Math.sin(a)]}function Qi(i,e){return Ee(.48,.92,Kt(i,e))}function er(i,e,t,a,r,o,s){let c=Ee(.31,.76,a);if(e<513||c<=0)return;let n=e-1,l=I=>(I%n+n)%n,d=Math.PI/n,u=(I,$)=>i[ga(Math.round($),0,n)*e+l(Math.round(I))],f=[];for(let I=0;I<24;I++){let $=Math.acos(1-(I+.5)/12)/d;for(let V=0;V<40;V++)f.push(u((V+.5)*n/40,$))}f.sort((I,$)=>I-$);let p=f[Math.floor(f.length*.74)]+.14,x=[...r.map(({head:I})=>I),...Object.values(o).flat().map(({target:I})=>I)],y=Math.imul(t^t>>>17,1757159915)^1900846437,m=()=>(y=Math.imul(y,1664525)+1013904223>>>0,y/4294967296),M;for(let I=0;I<17;I++)for(let $=0;$<32;$++){let V=($+m())*n/32,K=(.22+.56*(I+m())/17)*n,ae=Ji(V,K,n);if(x.some(le=>le[0]*ae[0]+le[1]*ae[1]+le[2]*ae[2]>.955))continue;let A=.54*ae[0]+.45*ae[1]+.71*ae[2];if(A<.22)continue;let H=Rt*Math.sin(K*d)/n,T=.042+.018*m(),G=m()*Rt,[,J,ee,oe]=je({regions:s},ae);for(let le=0;le<8;le++){let ce=G+le*Rt/8,re=Math.cos(ce),se=Math.sin(ce),fe=u(V-re*T/H,K-se*T/d),pe=u(V+re*T/H,K+se*T/d),de=fe-pe;if(pe<p-.2||de<.16||de>1.3)continue;let xe=u(V,K),we=.92*A-.6*Math.abs(de-.56)-.54*Math.abs(xe-(fe+pe)*.5)-.38*Math.abs(pe-p)+.31*oe+.19*J+.12*ee+.2*m();(!M||we>M.score)&&(M={x:V,y:K,xStep:H,size:T,dx:re,dy:se,high:fe,low:pe,score:we})}}if(!M)return;let{x:h,y:v,xStep:b,size:z,dx:D,dy:_,high:S,low:k}=M,g=.15+.15*m(),w=m()*Rt,P=.7+.6*m(),C=m(),B=(Math.imul(t^t>>>16,2654435761)>>>0)%3,W=.42+.19*m(),R=(I,$=0)=>g*Math.sin(2.4*I+w)+$*W*Ee(-.36,.68,I),Q=I=>$t(S,k,ga((I+.95)/1.9,0,1)**P),q=[];function E(I,$,V,K){q.push({u:I,v:R(I,$)+.17*(m()-.5),length:V,width:K,level:Q(I),phase:m()*Rt,chemistry:ga(.82*C+.33*m()-.06,0,1)})}function N(I,$,V,K,ae){let A=($-I)/K;for(let H=0;H<K;H++){let T=I+A*(H+.48+.32*(m()-.5));E(T,V,A*(.39+.21*m()),ae*(.62+.52*m()))}}B===0?(E(-.68,0,.3,.54+.19*m()),N(-.37,.97,-1,2+Math.floor(2*m()),.31),N(-.11,1,1,2+Math.floor(2*m()),.36)):B===1?N(-1,1.04,0,3+Math.floor(4*m()),.54):(E(-.54,0,.55+.1*m(),.68+.13*m()),N(.12,1.1,0,2+Math.floor(2*m()),.46)),q.sort((I,$)=>I.u-$.u);let O=2.1*z,Z=O/b,Y=O/d,X=[h/n,v/n,Z/n,Y/n],te=new Uint32Array(96**2),ie={height:0,wet:0,crust:0,tint:0},F=(I,$,V)=>{let K=(I-h)*b/z,ae=($-v)*d/z,A=K*D+ae*_,H=ae*D-K*_,T=B===0?Math.min(Math.abs(H-R(A,-1)),Math.abs(H-R(A,1))):Math.abs(H-R(A)),G=(1-Ee(.045,.16,T))*Ee(-1.23,-.83,A)*(1-Ee(.89,1.42,A)),J=Q(A),ee=$t(V,Math.min(V,J),.42*G),oe=0,le=G*.43,ce=C;for(let re of q){let se=(A-re.u)/re.length,fe=(H-re.v)/re.width;if(Math.abs(se)>1.62||Math.abs(fe)>1.62)continue;let pe=Math.atan2(fe,se),de=1+.097*Math.sin(3*pe+re.phase)+.042*Math.cos(7*pe-re.phase),xe=Math.hypot(se,fe)/de;if(xe>=1.42)continue;let we=Ee(.52,.98,Math.cos(pe))*(1-Ee(.09,.29,Math.abs(fe))),Me=Ee(.76,.93,xe)*(1-Ee(1,1.24,xe)),Be=Ee(1.02,1.23,xe)*(1-Ee(1.27,1.42,xe)),ye=re.level+Me*(.077-.063*we)-.05*Be,Se=1-Ee(.83,1.42,xe);ee=$t(ee,ye,Se);let Te=1-Ee(.64,.8,xe),Ie=(1-Ee(1.01,1.42,xe))*Ee(.58,.85,xe);oe=$t(oe,Te,Se),Ie>le&&(le=Ie,ce=re.chemistry*(.61+.39*Me))}ie.height=$t(V,ee,c),ie.wet=oe*c,ie.crust=le*c,ie.tint=ce};for(let I=Math.ceil(v-Y);I<=Math.floor(v+Y);I++){for(let $=Math.ceil(h-Z);$<=Math.floor(h+Z);$++){let V=I*e+l($);F($,I,i[V]),i[V]=ie.height}i[I*e+n]=i[I*e]}let L=95;for(let I=0;I<=L;I++)for(let $=0;$<=L;$++)F(h+(2*$/L-1)*Z,v+(2*I/L-1)*Y,0),te[I*96+$]=1056964608|Math.round(255*ie.wet)|Math.round(255*ie.crust)<<8|Math.round(255*ie.tint)<<16;let j=(I,$)=>Ji(h+(I*D-$*_)*z/b,v+(I*_+$*D)*z/d,n);return o.springs=[{overlook:j(.86,.82),target:j(-.12,0)}],{chart:X,values:te,side:96}}function Ke(i,e,t,a){let r=Math.imul(i,2376512323)^Math.imul(e,3625334849)^Math.imul(t,3407524639)^Math.imul(a,374761393);return r=Math.imul(r^r>>>16,2146121005),r=Math.imul(r^r>>>15,2221713035),(r^r>>>16)>>>0}function va(i,e,t,{min:a,max:r,mean:o,coverage:s}={}){if(s===0)return null;let c=Ke(0,0,0,t);if(s===void 0&&c>=2147483648)return null;if(a===void 0){a=1/0,r=-1/0;let p=0;for(let x of i)a=Math.min(a,x),r=Math.max(r,x),p+=x;o=p/i.length}let n=r-a;if(n===0)return a;let l=new Float64Array(96),d=Math.max(1,Math.floor((e-1)/160)),u=0;for(let p=1;p<e-1;p+=d){let x=Math.sin(Math.PI*p/(e-1));for(let y=0;y<e-1;y+=d){let m=Math.min(95,Math.floor((i[p*e+y]-a)/n*96));l[m]+=x,u+=x}}let f=u*(s??.28+.36*(c/2147483648));for(let p=0;p<l.length;p++){let x=l[p];if(x>0&&f<=x)return a+n*(p+f/x)/96;f-=x}return o}function Ge(i,e,t){let a=Math.max(0,Math.min(1,(t-i)/(e-i)));return a*a*(3-2*a)}function tr(i,e,t,a){let r=e-1,o=Math.max(1,Math.round(r/300)),s=r/65,c=.023*r/(2*Math.PI*o),n=i.slice();function l(d,u){let f=Math.floor(d),p=(f+r)%r,x=(p+1)%r,y=Math.max(0,Math.min(r,u)),m=Math.min(r-1,Math.floor(y)),M=d-f,h=y-m,v=m*e,b=n[v+p]*(1-M)+n[v+x]*M,z=n[v+e+p]*(1-M)+n[v+e+x]*M;return Ge(.025,.22,t-(b*(1-h)+z*h))}for(let d=o;d<=r-o;d++){let u=d*e,f=Math.sin(Math.PI*d/r),p=Ge(.08,.24,f);if(p===0)continue;let x=2*f,y=Math.max(1,Math.round(o/x));for(let m=0;m<r;m++){let M=n[u+m],h=M-t;if(h<-.2||h>.19)continue;let v=(n[u+(m+y)%r]-n[u+(m+r-y)%r])*o/(y*x),b=n[u+m+o*e]-n[u+m-o*e],z=Math.hypot(v,b),D=z*c;if(D<=.025)continue;let _=v/z,S=b/z,k=m-_*s/x,g=d-S*s,w=S*s*.58/x,P=-_*s*.58,C=Ge(.19,.84,.46*l(k,g)+.27*(l(k+w,g+P)+l(k-w,g-P))),B=Ge(.07,.36,D)*(.26+.74*C),W=(1-C)*Ge(.025,.13,D)*(1-Ge(.23,.56,D)),R=Math.min(h*.65,.058*(1-Ge(.035,.19,h))),Q=Math.min(-h*.64,.075*(1-Ge(.055,.2,-h))),q=Math.min(h*.52,.035*(1-Ge(.025,.13,h))),E=Math.min(-h*.68,.078*(1-Ge(.07,.2,-h))),N=h>=0?-B*R-W*q:B*Q+W*E;if(a!==void 0&&h>0){let Z=Ge(.025,.075,h)*(1-Ge(.12,.19,h));if(a==="mesa"){let Y=.05+.035*C,X=h/Y,te=(Math.floor(X)+Ge(.16,.76,X%1))*Y;N+=.72*Z*B*(te-h)}else{let Y=.045*W*(1-Ge(.07,.15,h));N+=Z*(Y-.035*B)}}if(a!==void 0&&h<0){let Z=-h,Y=Ge(.012,.065,Z)*(1-Ge(.09,.2,Z));N+=Y*(a==="mesa"?.064:.041)*W}let O=M+p*N;i[u+m]=h>=0?Math.max(t,O):Math.min(t,O)}i[u+r]=i[u]}}var $e=262144,ja=29,Za=5e3,me=(i,e)=>i[0]*e[0]+i[1]*e[1]+i[2]*e[2],at=(i,e)=>[i[1]*e[2]-i[2]*e[1],i[2]*e[0]-i[0]*e[2],i[0]*e[1]-i[1]*e[0]],Pe=i=>{let e=Math.hypot(...i);return i.map(t=>t/e)},he=(i,e,t)=>Math.max(e,Math.min(t,i)),tt=(i,e,t)=>i+(e-i)*t,ar=[8600,3600],Xa=[290,165],Mo=[.13,.22];function ir(i,e,t,a){let r=Math.floor(i),o=Math.floor(e),s=Math.floor(t),c=i-r,n=e-o,l=t-s,d=w=>w*w*w*(10+w*(-15+6*w)),u=d(c),f=d(n),p=d(l),x=1.15/Math.SQRT2,y=w=>30*w**2*(1-w)**2,m=y(c),M=y(n),h=(w,P,C)=>{let B=Ke(r+w,o+P,s+C,a)&15,W=B&1?-x:x,R=B&2?-x:x,Q=c-w,q=n-P,E=l-C;return[W*(B<8?Q:q)+R*(B<4?q:B===12||B===14?Q:E),(B>=8?W:0)+(B<4?R:0),(B<8?W:0)+(B===12||B===14?R:0)]},v=(w,P)=>{let[C,B,W]=h(0,w,P),[R,Q,q]=h(1,w,P);return[tt(C,R,u),tt(B,Q,u),tt(W,q,u)+(R-C)*m]},b=w=>{let[P,C,B]=v(0,w),[W,R,Q]=v(1,w);return[tt(P,W,f),tt(C,R,f)+(W-P)*M,tt(B,Q,f)]},[z,D,_]=b(0),[S,k,g]=b(1);return[tt(z,S,p),tt(D,k,p),tt(_,g,p)]}var Jt=(i=$e)=>i*(1.15/50);function rr(i,e=$e,t="mixed"){let a=(i.max-i.min)*.28125,r=Jt(e)/(i.featureDensity??1),o=Zi+(i.regions||t==="alpine"||t==="mixed"?2.4:1.22)*(Xa[0]+Xa[1]),s=i.reliefScale??1;return[((i.min-a)*r-o)*s,((i.max+a)*r+o)*s]}function or(i,e,t=$e){let a=i.ocean?.seed===e?i.ocean.datum:va(i.values,i.side,e,i);return a===null?null:a*Jt(t)*(i.reliefScale??1)/(i.featureDensity??1)}function sr(i,e=$e,t=ja,a,r,o=null,s="mixed",c=Ha,n){if(ht(a),!r)throw new TypeError("Bake a Planet Studio noise map before sampling the surface.");let[l,d,u]=i,f=[0,0,0],p=kt(r,i,f),x=n??p,y=r.featureDensity??1,m=Jt(e)/y;for(let N=0;N<3;N++)f[N]/=y;let M=x*m,h=(4*l-20*d+22*u)*e/30,v=(28*l+10*d+4*u)*e/30,b=(-10*l+20*d+20*u)*e/30,z=(4*h-4*v+7*b)/9,D=(8*h+v-4*b)/9,_=(h+8*v+4*b)/9,S=he((x+1)/3,0,1),k=.6+.62*S*S*(3-2*S),g=je(r,i,s),[w,P,C]=g,B=1.15*x,W=0;for(let N=0;N<ar.length;N++){let O=ar[N],[Z,Y]=ir((N===1?z:h)*(1+.18*w)/O+B,(N===1?D:v)*(1-.3*w)/O,(N===1?_:b)*(1-.06*w)/O,t+131+N*19),X=Math.max(0,1-Z*Z/(.34*.34)),te=(Z+1)*4,ie=Math.floor(te),F=he((te-ie-.22)/.56,0,1),L=(ie+F*F*(3-2*F))/4-1,I=tt(Z,L,Mo[N])-.11*X*X;if(w>0){let $=Z>0?.9:.66,V=Math.max(0,1-(Math.hypot(Z,.012)-.012)/$),K=V*V,ae=N===0?1:W,A=N===0?1.72:2.25;I=tt(I,.31*Z+A*(K*ae-.28),Math.min(.97,.89*ut[c.range])*w),N===0&&(W=.3+.7*K)}M+=Xa[N]*k*I*(1-.66*P-.52*C),B=.65*Z+.34*Y}M+=Ki(i,e,t,f,x*m,M,c,g,ir,Ke);let R=Kt(r.dunes,i),Q=Kt(r.dunes,i,8),q=Math.max(Qi(r.springs,i),1-(1-.91*R)*(1-Q));M=tt(M,x*m,q),M*=r.reliefScale??1;let E=o===null?0:Math.max(0,o-M);return{height:E>0?o:M,depth:E,land:x,lake:!1}}var Ka=[[[1,0,0],[0,0,1],[0,1,0]],[[-1,0,0],[0,0,-1],[0,1,0]],[[0,1,0],[1,0,0],[0,0,1]],[[0,-1,0],[1,0,0],[0,0,-1]],[[0,0,1],[-1,0,0],[0,1,0]],[[0,0,-1],[1,0,0],[0,1,0]]];function ba(i,e,t){let[a,r,o]=Ka[i];return a.map((s,c)=>s+e*r[c]+t*o[c])}function zo(i){let e=i.map(Math.abs),t=e[0]>=e[1]&&e[0]>=e[2]?0:e[1]>=e[2]?1:2,a=t*2+ +(i[t]<0);return[a,me(i,Ka[a][1])/e[t],me(i,Ka[a][2])/e[t]]}var cr=20,Qt=(i,e,t,a)=>(i*32+e)*1099511627776+t*1048576+a,fr=i=>i.level>0?Qt(i.face,i.level-1,i.x>>1,i.y>>1):null,ur=(i,e)=>i.level<cr?Qt(i.face,i.level+1,i.x*2+(e&1),i.y*2+(e>>1)):null;function nr(i,e,t,a){let r=2/2**e,o=t*r-1,s=a*r-1;return{key:Qt(i,e,t,a),face:i,level:e,x:t,y:a,size:r,u:o,v:s,dir:Pe(ba(i,o+r/2,s+r/2))}}function lr(i,e,t,a){let{u:r,v:o,size:s,level:c}=i,n=2**c,l=i.face,d=i.x+ +(t===1)-+(t===0),u=i.y+ +(t===3)-+(t===2);if(d<0||d>=n||u<0||u>=n){let x=s*1e-4,y=t===0?r-x:t===1?r+s+x:r+s/2,m=t===2?o-x:t===3?o+s+x:o+s/2,[M,h,v]=zo(ba(l,y,m));l=M,d=he(Math.floor((h+1)*n/2),0,n-1),u=he(Math.floor((v+1)*n/2),0,n-1)}let f=Qt(l,c,d,u),p=e.get(f);if(p||a?.has(f))return p;for(let x=c-1;x>=0;x--){d>>=1,u>>=1;let y=e.get(Qt(l,x,d,u));if(y)return y}}function Tt(i,e,t){let a=he((t-i)/(e-i),0,1);return a*a*(3-2*a)}function $a(i,e,t){return Tt(e,t,i)*(1-Tt(5e5,85e4,i))}var ya=class{items=[];push(e){let t=this.items,a=t.length;for(t.push(e);a>0;){let r=a-1>>1;if(t[r].score>=e.score)break;t[a]=t[r],a=r}t[a]=e}pop(){let e=this.items,t=e[0],a=e.pop();if(!e.length)return t;let r=0;for(;r*2+1<e.length;){let o=r*2+1;if(o+1<e.length&&e[o+1].score>e[o].score&&o++,e[o].score<=a.score)break;e[r]=e[o],r=o}return e[r]=a,t}};function pr(i,{radius:e=$e,divs:t=16,maxTiles:a=576,pixelError:r=3,lodScale:o=1.5,minSpacing:s=2,elevationBounds:c,sampleRelief:n,centerPriority:l=!1,previousFocal:d=new Set,splitBudget:u=1/0}={},f=new Set){let p=new Map,x=new Set,y=new Set,m=new ya,M=new ya,h=i.position,v=Math.hypot(...h),b=Pe(h),z=Math.max(1,i.clearance??v-e),D=he(Math.ceil(Math.log2(2*e/(t*s))),0,cr),[_,S]=c??[-Za,Za],k=e+_,g=e+S,w=(k+g)/2,P=(g-k)/2,C=Math.acos(he(k/v,-1,1))+Math.acos(k/g),B=Math.min(5e3,Math.max(64,z*.1)),W=1/o,R=Math.hypot(z,Math.min(1200,Math.max(150,z*.55))),Q=Tt(2e4,1e5,z),q=R*(1-Q),E=(1-W)*(1-Q),N=.82,O=l?(4+3*Tt(3e5,5e5,z))*$a(z,1e5,22e4):0,Z=Math.min(z*.12,e*.16),Y=Math.min(z*.55,e*.6),X=i.planes||[],te=Math.min(4,X.length),ie=l?me(h,i.forward):0,F=l?me(h,i.right):0,L=l?me(h,i.up):0,j=u,I=!1,$=!1,V=Array.from({length:D+1},(T,G)=>{let J=2/2**G,ee=Math.SQRT1_2*J,oe=e*J/t;return{lateral:e*ee,bound:w*ee+P,capCos:1-ee*ee/2,capSin:ee*Math.sqrt(1-ee*ee/4),horizon:Math.cos(Math.min(Math.PI,C+2*Math.asin(ee/2))),nearby:Math.min(90,e*J*.65),error:(Math.min(c?P:3300,oe*(c?.25:.13))+oe**2/(2*e))*i.pixelScale}});function K(T){p.set(T.key,T);let G=V[T.level],J=he(me(T.dir,b),-1,1);T.visible=J>=G.horizon;for(let ye=0;T.visible&&ye<X.length;ye++){let Se=X[ye];T.visible=w*me(Se,T.dir)+Se[3]>=-G.bound-(ye<4?B:0)}if(T.level>=D)return;let ee=Math.max(0,e*Math.sqrt(2*(1-J))-G.lateral);if(!T.visible&&ee>=G.nearby)return;let oe=Math.hypot(z,ee),le=oe*W+Math.min(oe,q)*E,ce=G.error/le,re=d.has(T.key),se=f.has(T.key),fe=r*(se&&!re?.76:1),pe=r*(se?.76:1),de=l&&T.visible;if(n&&z<6e4&&T.visible&&T.level>=3){let ye=ce*2.6;if(ye<=fe&&(!de||ye*(1+N)<=pe))return;let[Se,Te]=n(T),Ie=he(Te/Math.max(1,G.lateral)-.16,0,1);ce*=1+Ie*1.6;let qe=G.lateral*1.1+Te+Math.min(650,G.lateral)+B,Qe=Math.max(B,qe*.5),Le=e+Se,Ue=0;for(let it=0;it<te;it++){let xt=X[it],dt=-(Le*me(xt,T.dir)+xt[3])-qe;if(dt>Ue&&(Ue=dt),Ue>=Qe)break}Ue>0&&(ce*=1-.58*Math.min(1,Ue/Qe))}let xe=O>0&&ee<Y?O:0,we=0;if(de&&(xe>0&&ce*(1+xe)>fe||ce<=fe&&ce*(1+N)>pe)){let ye=Math.max(1,w*me(T.dir,i.forward)-ie),Se=(Math.abs(w*me(T.dir,i.right)-F)-G.lateral*.35)/(ye*i.tanX),Te=(Math.abs(w*me(T.dir,i.up)-L)-G.lateral*.35)/(ye*i.tanY),Ie=he((Math.hypot(Math.max(0,Se),Math.max(0,Te))-.12)/.98,0,1);we=1-Ie*Ie*(3-2*Ie)}let Me=xe>0&&we>0?xe*(1-Tt(Z,Y,ee))*we*we:0,Be=ce*(1+Me);if(Be>fe){let ye=l&&z<6e4&&ee<1750?1+.32*(1-Tt(750,1750,ee))*(1-Q):1;m.push({node:T,score:Be*ye*(T.visible?1.15:1)*(l&&se?1.52:1)})}else if(we>0){let ye=ce*(1+N*we);we>0&&ye>pe&&M.push({node:T,score:ye*(se?1.16:1)})}}let ae=new Set;function A(T){if(!ae.has(T)){ae.add(T);for(let G=0;G<4;G++){let J=lr(T,p,G,x);J&&J.level<T.level&&A(J)}}}for(let T=0;T<6;T++)K(nr(T,0,0,0));for(;(m.items.length||!$&&M.items.length)&&p.size+3<=a;){let T=!m.items.length,{node:G}=(T?M:m).pop();if(p.has(G.key)&&(ae.clear(),A(G),!(p.size+3*ae.size>a))){if(j<1/0){let J=0;for(let ee of ae)f.has(ee.key)||J++;if(J>j){I=!0,T||($=!0);continue}j-=J}for(let J of ae){p.delete(J.key),x.add(J.key),T&&y.add(J.key);for(let ee=0;ee<2;ee++)for(let oe=0;oe<2;oe++)K(nr(J.face,J.level+1,J.x*2+oe,J.y*2+ee))}}}let H=[];for(let T of p.values()){if(!T.visible)continue;let{capCos:G,capSin:J,bound:ee}=V[T.level],oe=B+.09*ee,le,ce=!0;for(let se=0;se<te;se++){let fe=X[se],pe=me(fe,T.dir);if(pe>=G)continue;let de=pe*G+Math.sqrt(Math.max(0,1-pe*pe))*J,xe=-(de*(de<0?k:g)+fe[3])-oe;if(!(xe<=0)&&(le??=.09*Math.hypot(w*T.dir[0]-h[0],w*T.dir[1]-h[1],w*T.dir[2]-h[2]),xe>le)){ce=!1;break}}if(!ce){T.visible=!1;continue}let re=0;for(let se=0;se<4;se++){let fe=lr(T,p,se,x);fe&&fe.level<T.level&&(re|=1<<se)}T.mask=re,T.spacing=e*T.size/t,H.push(T)}return{leaves:p,visible:H,split:x,focalSplit:y,deferred:I,advanced:j<u}}var wa=class{constructor(e){this.capacity=e,this.slots=new Map}clear(){this.slots.clear()}assign(e){let t=new Set(e.map(({key:s})=>s)),a=new Map,r=[],o=this.slots.keys();for(let s of e){let c=this.slots.get(s.key);if(c===void 0){if(this.slots.size<this.capacity)c=this.slots.size;else{let n=o.next();for(;!n.done&&t.has(n.value);)n=o.next();if(n.done)throw new RangeError("Visible tiles exceed cache capacity.");c=this.slots.get(n.value),this.slots.delete(n.value)}r.push({tile:s,slot:c})}this.slots.delete(s.key),this.slots.set(s.key,c),a.set(s.key,c)}return{assigned:a,builds:r}}};var Ma=`const PI : f32 = 3.141592653589793;
const TWO_PI : f32 = 6.283185307179586;

const ANGLE_INCREMENT : f32 = PI / 4.0;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 options UBO \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
struct NoiseComputeOptions {
  getGradient : u32,
  useCustomPos : u32,
  outputChannel : u32,
  ioFlags : u32,
  baseRadius : f32,
  heightScale : f32,
  sphereOffset : f32,
  sphereOffset2 : f32,
  sphereBlend : f32,
  sphereBlendPhase : f32,
  sphereRangeWeight : f32,
  spherePolarFade : f32,
  sphereLandscape : u32,
  sphereLandscapeStrength : f32,
  sphereFeatureDensity : f32,
  sphereRegionSeed : u32,
  sphereRegion : vec4<f32>,
  sphereLayerWeights : vec4<f32>,
};
@group(0) @binding(0) var<uniform> options : NoiseComputeOptions;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 params UBO (layout kept) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
struct NoiseParams {
  seed : u32,
  zoom : f32,
  freq : f32,
  octaves : u32,
  lacunarity : f32,
  gain : f32,
  xShift : f32,
  yShift : f32,
  zShift : f32,
  turbulence : u32,
  seedAngle : f32,
  exp1 : f32,
  exp2 : f32,
  threshold : f32,
  rippleFreq : f32,
  time : f32,
  warpAmp : f32,
  gaborRadius : f32,
  terraceStep : f32,
  toroidal : u32,
  voroMode : u32,
  edgeK : f32,
  scalar : f32,
  transform : f32,
};
@group(0) @binding(1) var<uniform> params : NoiseParams;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 permutation table \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
struct PermTable { values : array<u32, 512>, };
const PERM_SIZE : u32 = 512u;
const PERM_MASK : u32 = PERM_SIZE - 1u;
const INV_255 : f32 = 1.0 / 255.0;
const INV_2_OVER_255 : f32 = 2.0 / 255.0;

@group(0) @binding(2) var<storage, read> permTable : PermTable;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 IO resources \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@group(0) @binding(3) var inputTex : texture_2d_array<f32>;
@group(0) @binding(4) var outputTex : texture_storage_2d_array<rgba16float, write>;
@group(0) @binding(5) var<storage, read> posBuf : array<vec4<f32>>;

struct Frame {
  fullWidth : u32,
  fullHeight : u32,
  tileWidth : u32,
  tileHeight : u32,

  originX : i32,
  originY : i32,
  originZ : i32,
  fullDepth : u32,

  tileDepth : u32,
  layerIndex : i32,
  layers : u32,
  _pad : u32,

  originXf : f32,
  originYf : f32,
  originZf : f32,
  _pad1    : f32,
};
@group(0) @binding(6) var<uniform> frame : Frame;

@group(0) @binding(7) var inputTex3D : texture_3d<f32>;
@group(0) @binding(8) var outputTex3D : texture_storage_3d<rgba16float, write>;

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 small utilities \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn clampZ(z: i32)->i32 {
  let depth = i32(max(u32(frame.fullDepth), 1u));
  return clamp(z, 0, depth - 1);
}
fn layerToZ(layerIndex:i32, layers:u32)->f32 {
  if (layers <= 1u) { return 0.0; }
  let li = max(layerIndex, 0);
  return f32(li) / f32(layers - 1u);
}
fn readFrom3D()->bool { return (options.ioFlags & 0x1u) != 0u; }
fn writeTo3D()->bool { return (options.ioFlags & 0x2u) != 0u; }

fn loadPrevRGBA(fx:i32, fy:i32, fz:i32)->vec4<f32> {
  if (readFrom3D()) { return textureLoad(inputTex3D, vec3<i32>(fx, fy, clampZ(fz)), 0); }
  return textureLoad(inputTex, vec2<i32>(fx, fy), frame.layerIndex, 0);
}
fn storeRGBA(fx:i32, fy:i32, fz:i32, col:vec4<f32>) {
  if (writeTo3D()) { textureStore(outputTex3D, vec3<i32>(fx, fy, clampZ(fz)), col); }
  else { textureStore(outputTex, vec2<i32>(fx, fy), frame.layerIndex, col); }
}

fn rotateXY3(p: vec3<f32>, angle: f32) -> vec3<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec3<f32>(
    p.x * c - p.y * s,
    p.x * s + p.y * c,
    p.z
  );
}


const STEREO_SCALE : f32 = 1.8;          // fixed packing scale for Clifford torus
const INV_SQRT2    : f32 = 0.7071067811865476; // 1/\u221A2

// add next to your other constants
const U_SCALE : f32 = 3.0;
const V_SCALE : f32 = 3.0;
const T_SCALE : f32 = 2.0;
const PACK_BIAS : vec4<f32> = vec4<f32>(0.37, 0.21, 0.29, 0.31);

fn packPeriodicUV(u: f32, v: f32, theta: f32) -> vec4<f32> {
  let aU = fract(u) * TWO_PI;
  let aV = fract(v) * TWO_PI;
  let aT = fract(theta) * TWO_PI;

  let x = cos(aU) * U_SCALE;
  let y = sin(aU) * U_SCALE;
  let z = cos(aV) * V_SCALE + cos(aT) * T_SCALE;
  let w = sin(aV) * V_SCALE + sin(aT) * T_SCALE;

  return vec4<f32>(x, y, z, w) + PACK_BIAS;
}


fn thetaFromDepth(fz: i32) -> f32 {
  let uses3D = writeTo3D() || readFrom3D();
  if (uses3D) {
    let d = max(f32(frame.fullDepth), 1.0);
    return (f32(clampZ(fz)) + 0.5) / d; // [0,1)
  }
  return layerToZ(frame.layerIndex, frame.layers);
}

fn seedOffset3(seed: u32) -> vec3<f32> {
  let a = f32((seed * 1664525u + 1013904223u) & 65535u) / 65536.0;
  let b = f32((seed * 22695477u + 1u) & 65535u) / 65536.0;
  let c = f32((seed * 1103515245u + 12345u) & 65535u) / 65536.0;

  return vec3<f32>(
    17.173 + a * 131.0,
    31.947 + b * 137.0,
    47.521 + c * 149.0
  );
}

fn fetchPlanetSpherePos(fx: i32, fy: i32) -> vec3<f32> {
  let w = i32(max(frame.fullWidth, 2u));
  let h = i32(max(frame.fullHeight, 2u));
  let segments = max(w - 1, 1);
  let maxLat = max(h - 1, 1);

  let lat = clamp(fy, 0, maxLat);
  let rawLon = fx;
  let lon = ((rawLon % segments) + segments) % segments;

  if (lat <= 0) {
    // Y-up north pole, matching sphereUVFromWorld() and the Babylon planet.
    return vec3<f32>(2.0, 3.0, 2.0);
  }

  if (lat >= maxLat) {
    // Y-up south pole, matching sphereUVFromWorld() and the Babylon planet.
    return vec3<f32>(2.0, 1.0, 2.0);
  }

  let theta = f32(lat) * PI / f32(maxLat);
  let phi = f32(lon) * TWO_PI / f32(segments);

  let dir=vec3<f32>(sin(theta)*cos(phi),cos(theta),sin(theta)*sin(phi));
  return studio_sphere_position(dir,theta,phi);
}

fn studio_sphere_position(dir:vec3<f32>,theta:f32,phi:f32)->vec3<f32>{
  let sinTheta=length(dir.xz);
  // The first longitude harmonic is already a smooth tangent displacement.
  // Only the second harmonic needs to disappear faster than polar radius.
  let offset = options.sphereOffset;
  let offset2 = options.sphereOffset2;
  let second = vec2<f32>(offset2 * cos(2.0 * phi),offset * sin(2.0 * phi + theta));
  var warp=vec3<f32>(offset * sin(phi + theta) + second.x,
    offset * cos(theta + phi) + offset2 * sin(2.0 * theta),
    second.y + offset2 * cos(2.0 * theta + phi));
  if(options.spherePolarFade>0.0){
    let fade=1.0-smoothstep(0.0,options.spherePolarFade,sinTheta);
    warp-=fade*vec3<f32>(second.x,0.0,second.y);
  }
  return dir+2.0+sinTheta*warp;
}


fn fetchAuroraCapPos(fx: i32, fy: i32) -> vec3<f32> {
  let w = i32(max(frame.fullWidth, 2u));
  let h = i32(max(frame.fullHeight, 2u));
  let segments = max(w - 1, 1);
  let maxRadial = max(h - 1, 1);

  let radialIndex = clamp(fy, 0, maxRadial);
  let rawLon = fx;
  let lon = ((rawLon % segments) + segments) % segments;

  let capHalfAngleDeg = max(options.baseRadius, 0.001);
  let capHalfAngle = radians(capHalfAngleDeg);
  let hemisphere = select(-1.0, 1.0, options.heightScale >= 0.0);

  let radial = f32(radialIndex) * capHalfAngle / f32(maxRadial);
  let phi = f32(lon) * TWO_PI / f32(segments);

  let sinR = sin(radial);
  let cosR = cos(radial);
  let sinPhi = sin(phi);
  let cosPhi = cos(phi);

  let x = sinR * cosPhi;
  let y = hemisphere * cosR;
  let z = sinR * sinPhi;

  let capScale = sinR;
  let offset = options.sphereOffset;
  let offset2 = options.sphereOffset2;

  return vec3<f32>(
    x + 2.0 + capScale * (offset * sin(phi + radial) + offset2 * cos(2.0 * phi)),
    y + 2.0 + capScale * (offset * cos(radial + phi) + offset2 * sin(2.0 * radial)),
    z + 2.0 + capScale * (offset * sin(2.0 * phi + radial) + offset2 * cos(2.0 * radial + phi))
  );
}

fn fetchPos(fx: i32, fy: i32, fz: i32) -> vec3<f32> {
  if (options.useCustomPos == 2u) {
    return fetchPlanetSpherePos(fx, fy);
  }

  if (options.useCustomPos == 3u) {
    return fetchAuroraCapPos(fx, fy);
  }

  if (options.useCustomPos == 1u) {
    let use3D = writeTo3D() || readFrom3D();
    let localX = u32(clamp(fx - frame.originX, 0, i32(max(frame.tileWidth, 1u)) - 1));
    let localY = u32(clamp(fy - frame.originY, 0, i32(max(frame.tileHeight, 1u)) - 1));
    let localZ = u32(max(select(frame.layerIndex, clampZ(fz) - frame.originZ, use3D), 0));
    let idx = localZ * frame.tileWidth * frame.tileHeight + localY * frame.tileWidth + localX;
    return posBuf[idx].xyz;
  }

  if (params.toroidal == 1u) {
    let cx = clamp(fx, 0, i32(frame.fullWidth) - 1);
    let cy = clamp(fy, 0, i32(frame.fullHeight) - 1);

    let invW = 1.0 / max(f32(frame.fullWidth), 1.0);
    let invH = 1.0 / max(f32(frame.fullHeight), 1.0);

    let U = (f32(cx) + 0.5) * invW;
    let V = (f32(cy) + 0.5) * invH;
    let theta = thetaFromDepth(fz);

    return vec3<f32>(U, V, theta);
  }

  let invW = 1.0 / max(f32(frame.fullWidth), 1.0);
  let invH = 1.0 / max(f32(frame.fullHeight), 1.0);

  var ox = frame.originXf;
  var oy = frame.originYf;
  if (ox == 0.0 && oy == 0.0) {
    ox = f32(frame.originX);
    oy = f32(frame.originY);
  }

  let x = (ox + f32(fx) + 0.5) * invW;
  let y = (oy + f32(fy) + 0.5) * invH;

  var z: f32;
  let uses3D = writeTo3D() || readFrom3D();
  if (uses3D) {
    if (frame.fullDepth <= 1u) {
      z = 0.0;
    } else {
      z = (f32(clampZ(fz)) + 0.5) / f32(frame.fullDepth);
    }
  } else {
    z = layerToZ(frame.layerIndex, frame.layers);
  }

  return vec3<f32>(x, y, z);
}



fn writeChannel(fx:i32, fy:i32, fz:i32, v0:f32, channel:u32, overwrite:u32) {
  if (!writeTo3D()) {
    if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) { return; }
  }

  var v = v0 * params.scalar + params.transform;
  if(options.useCustomPos==2u && options.sphereBlend>0.0){
    v*=studio_layer_mask(fetchPos(fx,fy,fz));
  }
  if(options.useCustomPos==2u && options.sphereRegion.z>0.0 &&
      any(options.sphereLayerWeights!=vec4<f32>(1.0))){
    let dir=studio_atlas_direction(fx,fy);
    v*=dot(studio_region_map(dir),options.sphereLayerWeights);
  }
  let needsAccum = (overwrite == 0u);
  let writesAll = (channel == 0u);
  let skipRead = (!needsAccum) && (writesAll || channel == 5u);
  var inCol = vec4<f32>(0.0);
  if (!skipRead) { inCol = loadPrevRGBA(fx, fy, fz); }
  var outCol = inCol;

  if (channel == 0u)      { let h = select(v + inCol.x, v, overwrite == 1u); outCol = vec4<f32>(h, h, h, h); }
  else if (channel == 1u) { let h = select(v + inCol.x, v, overwrite == 1u); outCol.x = h; }
  else if (channel == 2u) { let h = select(v + inCol.y, v, overwrite == 1u); outCol.y = h; }
  else if (channel == 3u) { let h = select(v + inCol.z, v, overwrite == 1u); outCol.z = h; }
  else if (channel == 4u) { let h = select(v + inCol.w, v, overwrite == 1u); outCol.w = h; }
  else if (channel == 5u) { let p = fetchPos(fx, fy, fz); let h = select(v + inCol.w, v, overwrite == 1u); outCol = vec4<f32>(p.x, p.y, p.z, h); }
  else if (channel == 6u) { let p = fetchPos(fx, fy, fz); let h = select(v + inCol.w, v, overwrite == 1u); outCol = vec4<f32>(p.x, p.y, h, inCol.w); }

  storeRGBA(fx, fy, fz, outCol);
}

fn studio_layer_mask(p:vec3<f32>)->f32{
  let phase=options.sphereBlendPhase;
  let province=simplex3D(p*3.1+vec3<f32>(phase,-.51*phase,1.31*phase));
  let mask=mix(.36,1.0,smoothstep(-.55,.32,province));
  return mix(1.0,mask,clamp(options.sphereBlend,0.0,1.0));
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 math / noise bits \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
/* gradient tables */
const GRAD2 : array<vec2<f32>, 8> = array<vec2<f32>, 8>(
  vec2<f32>( 1.0,  1.0), vec2<f32>(-1.0,  1.0),
  vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0, -1.0),
  vec2<f32>( 1.0,  0.0), vec2<f32>(-1.0,  0.0),
  vec2<f32>( 0.0,  1.0), vec2<f32>( 0.0, -1.0)
);

const GRAD3 : array<vec3<f32>, 12> = array<vec3<f32>, 12>(
  vec3<f32>( 1.0,  1.0,  0.0), vec3<f32>(-1.0,  1.0,  0.0),
  vec3<f32>( 1.0, -1.0,  0.0), vec3<f32>(-1.0, -1.0,  0.0),
  vec3<f32>( 1.0,  0.0,  1.0), vec3<f32>(-1.0,  0.0,  1.0),
  vec3<f32>( 1.0,  0.0, -1.0), vec3<f32>(-1.0,  0.0, -1.0),
  vec3<f32>( 0.0,  1.0,  1.0), vec3<f32>( 0.0, -1.0,  1.0),
  vec3<f32>( 0.0,  1.0, -1.0), vec3<f32>( 0.0, -1.0, -1.0)
);
const GRAD4 : array<vec4<f32>, 32> = array<vec4<f32>, 32>(
  vec4<f32>( 0.0,  1.0,  1.0,  1.0), vec4<f32>( 0.0,  1.0,  1.0, -1.0),
  vec4<f32>( 0.0,  1.0, -1.0,  1.0), vec4<f32>( 0.0,  1.0, -1.0, -1.0),
  vec4<f32>( 0.0, -1.0,  1.0,  1.0), vec4<f32>( 0.0, -1.0,  1.0, -1.0),
  vec4<f32>( 0.0, -1.0, -1.0,  1.0), vec4<f32>( 0.0, -1.0, -1.0, -1.0),

  vec4<f32>( 1.0,  0.0,  1.0,  1.0), vec4<f32>( 1.0,  0.0,  1.0, -1.0),
  vec4<f32>( 1.0,  0.0, -1.0,  1.0), vec4<f32>( 1.0,  0.0, -1.0, -1.0),
  vec4<f32>(-1.0,  0.0,  1.0,  1.0), vec4<f32>(-1.0,  0.0,  1.0, -1.0),
  vec4<f32>(-1.0,  0.0, -1.0,  1.0), vec4<f32>(-1.0,  0.0, -1.0, -1.0),

  vec4<f32>( 1.0,  1.0,  0.0,  1.0), vec4<f32>( 1.0,  1.0,  0.0, -1.0),
  vec4<f32>( 1.0, -1.0,  0.0,  1.0), vec4<f32>( 1.0, -1.0,  0.0, -1.0),
  vec4<f32>(-1.0,  1.0,  0.0,  1.0), vec4<f32>(-1.0,  1.0,  0.0, -1.0),
  vec4<f32>(-1.0, -1.0,  0.0,  1.0), vec4<f32>(-1.0, -1.0,  0.0, -1.0),

  vec4<f32>( 1.0,  1.0,  1.0,  0.0), vec4<f32>( 1.0,  1.0, -1.0,  0.0),
  vec4<f32>( 1.0, -1.0,  1.0,  0.0), vec4<f32>( 1.0, -1.0, -1.0,  0.0),
  vec4<f32>(-1.0,  1.0,  1.0,  0.0), vec4<f32>(-1.0,  1.0, -1.0,  0.0),
  vec4<f32>(-1.0, -1.0,  1.0,  0.0), vec4<f32>(-1.0, -1.0, -1.0,  0.0)
);

/* Gradient accessors */
fn gradient(idx:u32)->vec3<f32> {
  return GRAD3[idx % 12u];
}
fn gradient2(idx:u32)->vec2<f32> {
  return GRAD2[idx % 8u];
}
fn gradient4(idx: u32) -> vec4<f32> {
  return GRAD4[idx % 32u];
}


fn fade(t:f32)->f32 { return t*t*t*(t*(t*6.0 - 15.0) + 10.0); }
fn lerp(a:f32, b:f32, t:f32)->f32 { return a + t * (b - a); }

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 perm/hash helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn perm(idx: u32) -> u32 {
  return permTable.values[idx & PERM_MASK];
}

fn rot3(p: vec3<f32>) -> vec3<f32> {
  let x = 0.00 * p.x + -0.80 * p.y + -0.60 * p.z;
  let y = 0.80 * p.x +  0.36 * p.y + -0.48 * p.z;
  let z = 0.60 * p.x + -0.48 * p.y +  0.64 * p.z;
  return vec3<f32>(x, y, z);
}

fn hash2(ix : i32, iy : i32) -> u32 {
  return perm((u32(ix) & PERM_MASK) + perm(u32(iy) & PERM_MASK)) & PERM_MASK;
}
fn rand2(ix : i32, iy : i32) -> f32 {
  let idx = hash2(ix, iy);
  return f32(perm(idx)) * INV_2_OVER_255 - 1.0;
}
fn rand2u(ix : i32, iy : i32) -> f32 {
  let idx = hash2(ix, iy);
  return f32(perm(idx)) * INV_255;
}

// 3D helpers
fn hash3(ix : i32, iy : i32, iz : i32) -> u32 {
  return perm((u32(ix) & PERM_MASK)
            + perm((u32(iy) & PERM_MASK) + perm(u32(iz) & PERM_MASK)))
         & PERM_MASK;
}
fn rand3(ix : i32, iy : i32, iz : i32) -> f32 {
  let idx = hash3(ix, iy, iz);
  return f32(perm(idx)) * INV_2_OVER_255 - 1.0;
}
fn rand3u(ix : i32, iy : i32, iz : i32) -> f32 {
  let idx = hash3(ix, iy, iz);
  return f32(perm(idx)) * INV_255;
}

// 4D helpers
fn hash4(ix : i32, iy : i32, iz : i32, iw : i32) -> u32 {
  let a = perm(u32(ix) & PERM_MASK);
  let b = perm((u32(iy) & PERM_MASK) + a);
  let c = perm((u32(iz) & PERM_MASK) + b);
  return perm((u32(iw) & PERM_MASK) + c) & PERM_MASK;
}
fn rand4(ix : i32, iy : i32, iz : i32, iw : i32) -> f32 {
  let idx = hash4(ix, iy, iz, iw);
  return f32(perm(idx)) * INV_2_OVER_255 - 1.0;
}
fn rand4u(ix : i32, iy : i32, iz : i32, iw : i32) -> f32 {
  let idx = hash4(ix, iy, iz, iw);
  return f32(perm(idx)) * INV_255;
}


/* ---------- classic 2D Perlin ---------- */
fn noise2D(p : vec2<f32>) -> f32 {
  let ix = i32(floor(p.x));
  let iy = i32(floor(p.y));
  let X: u32 = u32(ix) & PERM_MASK;
  let Y: u32 = u32(iy) & PERM_MASK;

  let xf = p.x - floor(p.x);
  let yf = p.y - floor(p.y);

  let u = fade(xf);
  let v = fade(yf);

  let A  = perm(X) + Y;
  let B  = perm((X + 1u) & PERM_MASK) + Y;

  let gAA = gradient2(perm(A & PERM_MASK));
  let gBA = gradient2(perm(B & PERM_MASK));
  let gAB = gradient2(perm((A + 1u) & PERM_MASK));
  let gBB = gradient2(perm((B + 1u) & PERM_MASK));

  let x1 = lerp(dot(gAA, vec2<f32>(xf,       yf      )),
                dot(gBA, vec2<f32>(xf - 1.0, yf      )), u);
  let x2 = lerp(dot(gAB, vec2<f32>(xf,       yf - 1.0)),
                dot(gBB, vec2<f32>(xf - 1.0, yf - 1.0)), u);
  return lerp(x1, x2, v);
}

//matches 3d z=0 slice, less multiplying
fn noise2D_from_3D(p: vec3<f32>) -> f32 {
  let ix = i32(floor(p.x));
  let iy = i32(floor(p.y));
  let X: u32 = u32(ix) & PERM_MASK;
  let Y: u32 = u32(iy) & PERM_MASK;

  let xf = p.x - floor(p.x);
  let yf = p.y - floor(p.y);
  let u = fade(xf);
  let v = fade(yf);

  // 3D hashing path with Z = 0
  let A  = perm(X) + Y;
  let AA = perm(A & PERM_MASK);                 // + Z(=0)
  let AB = perm((A + 1u) & PERM_MASK);          // + Z(=0)
  let B  = perm((X + 1u) & PERM_MASK) + Y;
  let BA = perm(B & PERM_MASK);                 // + Z(=0)
  let BB = perm((B + 1u) & PERM_MASK);          // + Z(=0)

  let gAA = gradient(perm(AA & PERM_MASK));
  let gBA = gradient(perm(BA & PERM_MASK));
  let gAB = gradient(perm(AB & PERM_MASK));
  let gBB = gradient(perm(BB & PERM_MASK));

  let n00 = dot(gAA, vec3<f32>(xf,       yf,       0.0));
  let n10 = dot(gBA, vec3<f32>(xf - 1.0, yf,       0.0));
  let n01 = dot(gAB, vec3<f32>(xf,       yf - 1.0, 0.0));
  let n11 = dot(gBB, vec3<f32>(xf - 1.0, yf - 1.0, 0.0));

  let nx0 = lerp(n00, n10, u);
  let nx1 = lerp(n01, n11, u);
  return lerp(nx0, nx1, v);
}

/* ---------- classic 3D Perlin ---------- */
fn noise3D(p: vec3<f32>) -> f32 {
  if (p.z == 0.0) { return noise2D_from_3D(p); }

  let ix = i32(floor(p.x));
  let iy = i32(floor(p.y));
  let iz = i32(floor(p.z));
  let X: u32 = u32(ix) & PERM_MASK;
  let Y: u32 = u32(iy) & PERM_MASK;
  let Z: u32 = u32(iz) & PERM_MASK;

  let xf = p.x - floor(p.x);
  let yf = p.y - floor(p.y);
  let zf = p.z - floor(p.z);

  let u = fade(xf);
  let v = fade(yf);
  let w = fade(zf);

  let A  = perm(X) + Y;
  let AA = perm(A & PERM_MASK) + Z;
  let AB = perm((A + 1u) & PERM_MASK) + Z;
  let B  = perm((X + 1u) & PERM_MASK) + Y;
  let BA = perm(B & PERM_MASK) + Z;
  let BB = perm((B + 1u) & PERM_MASK) + Z;

  let gAA  = gradient(perm(AA & PERM_MASK));
  let gBA  = gradient(perm(BA & PERM_MASK));
  let gAB  = gradient(perm(AB & PERM_MASK));
  let gBB  = gradient(perm(BB & PERM_MASK));
  let gAA1 = gradient(perm((AA + 1u) & PERM_MASK));
  let gBA1 = gradient(perm((BA + 1u) & PERM_MASK));
  let gAB1 = gradient(perm((AB + 1u) & PERM_MASK));
  let gBB1 = gradient(perm((BB + 1u) & PERM_MASK));

  let x1 = lerp(dot(gAA,  vec3<f32>(xf,       yf,       zf      )),
                dot(gBA,  vec3<f32>(xf - 1.0, yf,       zf      )), u);
  let x2 = lerp(dot(gAB,  vec3<f32>(xf,       yf - 1.0, zf      )),
                dot(gBB,  vec3<f32>(xf - 1.0, yf - 1.0, zf      )), u);
  let y1 = lerp(x1, x2, v);

  let x3 = lerp(dot(gAA1, vec3<f32>(xf,       yf,       zf - 1.0)),
                dot(gBA1, vec3<f32>(xf - 1.0, yf,       zf - 1.0)), u);
  let x4 = lerp(dot(gAB1, vec3<f32>(xf,       yf - 1.0, zf - 1.0)),
                dot(gBB1, vec3<f32>(xf - 1.0, yf - 1.0, zf - 1.0)), u);
  let y2 = lerp(x3, x4, v);

  return lerp(y1, y2, w);
}


/* ---------- 4D Perlin (hypercube corners, gradient-based) ---------- */
fn noise4D(p: vec4<f32>) -> f32 {
  // integer cell coords
  let ix = i32(floor(p.x));
  let iy = i32(floor(p.y));
  let iz = i32(floor(p.z));
  let iw = i32(floor(p.w));

  let X: u32 = u32(ix) & PERM_MASK;
  let Y: u32 = u32(iy) & PERM_MASK;
  let Z: u32 = u32(iz) & PERM_MASK;
  let W: u32 = u32(iw) & PERM_MASK;

  // fractional part
  let xf = p.x - floor(p.x);
  let yf = p.y - floor(p.y);
  let zf = p.z - floor(p.z);
  let wf = p.w - floor(p.w);

  let u = fade(xf);
  let v = fade(yf);
  let t = fade(zf);
  let s = fade(wf);

  // helper to get corner gradient and dot product
  // corner offsets are dx,dy,dz,dw in {0,1}
  // for fractional component, use (xf - dx) etc; for dw=1 use (wf - 1.0)
  // compute hash for corner using hash4(ix+dx, iy+dy, iz+dz, iw+dw)
  let d0000 = dot(gradient4(perm(hash4(ix + 0, iy + 0, iz + 0, iw + 0))), vec4<f32>(xf,       yf,       zf,       wf      ));
  let d1000 = dot(gradient4(perm(hash4(ix + 1, iy + 0, iz + 0, iw + 0))), vec4<f32>(xf - 1.0, yf,       zf,       wf      ));
  let d0100 = dot(gradient4(perm(hash4(ix + 0, iy + 1, iz + 0, iw + 0))), vec4<f32>(xf,       yf - 1.0, zf,       wf      ));
  let d1100 = dot(gradient4(perm(hash4(ix + 1, iy + 1, iz + 0, iw + 0))), vec4<f32>(xf - 1.0, yf - 1.0, zf,       wf      ));

  let d0010 = dot(gradient4(perm(hash4(ix + 0, iy + 0, iz + 1, iw + 0))), vec4<f32>(xf,       yf,       zf - 1.0, wf      ));
  let d1010 = dot(gradient4(perm(hash4(ix + 1, iy + 0, iz + 1, iw + 0))), vec4<f32>(xf - 1.0, yf,       zf - 1.0, wf      ));
  let d0110 = dot(gradient4(perm(hash4(ix + 0, iy + 1, iz + 1, iw + 0))), vec4<f32>(xf,       yf - 1.0, zf - 1.0, wf      ));
  let d1110 = dot(gradient4(perm(hash4(ix + 1, iy + 1, iz + 1, iw + 0))), vec4<f32>(xf - 1.0, yf - 1.0, zf - 1.0, wf      ));

  let d0001 = dot(gradient4(perm(hash4(ix + 0, iy + 0, iz + 0, iw + 1))), vec4<f32>(xf,       yf,       zf,       wf - 1.0));
  let d1001 = dot(gradient4(perm(hash4(ix + 1, iy + 0, iz + 0, iw + 1))), vec4<f32>(xf - 1.0, yf,       zf,       wf - 1.0));
  let d0101 = dot(gradient4(perm(hash4(ix + 0, iy + 1, iz + 0, iw + 1))), vec4<f32>(xf,       yf - 1.0, zf,       wf - 1.0));
  let d1101 = dot(gradient4(perm(hash4(ix + 1, iy + 1, iz + 0, iw + 1))), vec4<f32>(xf - 1.0, yf - 1.0, zf,       wf - 1.0));

  let d0011 = dot(gradient4(perm(hash4(ix + 0, iy + 0, iz + 1, iw + 1))), vec4<f32>(xf,       yf,       zf - 1.0, wf - 1.0));
  let d1011 = dot(gradient4(perm(hash4(ix + 1, iy + 0, iz + 1, iw + 1))), vec4<f32>(xf - 1.0, yf,       zf - 1.0, wf - 1.0));
  let d0111 = dot(gradient4(perm(hash4(ix + 0, iy + 1, iz + 1, iw + 1))), vec4<f32>(xf,       yf - 1.0, zf - 1.0, wf - 1.0));
  let d1111 = dot(gradient4(perm(hash4(ix + 1, iy + 1, iz + 1, iw + 1))), vec4<f32>(xf - 1.0, yf - 1.0, zf - 1.0, wf - 1.0));

  // interpolate along x -> y -> z for w=0 layer
  let x00 = lerp(d0000, d1000, u);
  let x10 = lerp(d0100, d1100, u);
  let y0  = lerp(x00, x10, v);

  let x01 = lerp(d0010, d1010, u);
  let x11 = lerp(d0110, d1110, u);
  let y1  = lerp(x01, x11, v);

  let zLayer0 = lerp(y0, y1, t);

  // interpolate for w=1 layer
  let x00w = lerp(d0001, d1001, u);
  let x10w = lerp(d0101, d1101, u);
  let y0w  = lerp(x00w, x10w, v);

  let x01w = lerp(d0011, d1011, u);
  let x11w = lerp(d0111, d1111, u);
  let y1w  = lerp(x01w, x11w, v);

  let zLayer1 = lerp(y0w, y1w, t);

  // final interp along w
  return lerp(zLayer0, zLayer1, s);
}

fn worley3D(p : vec3<f32>) -> f32 {
    let fx = i32(floor(p.x));
    let fy = i32(floor(p.y));
    let fz = i32(floor(p.z));
    var minD : f32 = 1e9;
    for (var dz = -1; dz <= 1; dz = dz + 1) {
      for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
          let xi = fx + dx;
          let yi = fy + dy;
          let zi = fz + dz;
          let px = f32(xi) + rand3u(xi, yi, zi);
          let py = f32(yi) + rand3u(yi, zi, xi);
          let pz = f32(zi) + rand3u(zi, xi, yi);
          let dxv = px - p.x;
          let dyv = py - p.y;
          let dzv = pz - p.z;
          let d2 = dxv*dxv + dyv*dyv + dzv*dzv;
          if (d2 < minD) { minD = d2; }
        }
      }
    }
    return sqrt(minD);

}


/* ---------- 4D Worley (cellular) ---------- */
// fn worley4D(p: vec4<f32>) -> f32 {
//   let fx = i32(floor(p.x));
//   let fy = i32(floor(p.y));
//   let fz = i32(floor(p.z));
//   let fw = i32(floor(p.w));

//   var minDistSq : f32 = 1e9;

//   // iterate neighbor cells in 4D (3^4 = 81)
//   for (var dw = -1; dw <= 1; dw = dw + 1) {
//     for (var dz = -1; dz <= 1; dz = dz + 1) {
//       for (var dy = -1; dy <= 1; dy = dy + 1) {
//         for (var dx = -1; dx <= 1; dx = dx + 1) {
//           let xi = fx + dx;
//           let yi = fy + dy;
//           let zi = fz + dz;
//           let wi = fw + dw;

//           // jitter within each cell using rotated rand4u calls to decorrelate axes
//           let rx = rand4u(xi, yi, zi, wi);
//           let ry = rand4u(yi, zi, wi, xi);
//           let rz = rand4u(zi, wi, xi, yi);
//           let rw = rand4u(wi, xi, yi, zi);

//           let px = f32(xi) + rx;
//           let py = f32(yi) + ry;
//           let pz = f32(zi) + rz;
//           let pw = f32(wi) + rw;

//           let dxv = px - p.x;
//           let dyv = py - p.y;
//           let dzv = pz - p.z;
//           let dwv = pw - p.w;
//           let d2 = dxv * dxv + dyv * dyv + dzv * dzv + dwv * dwv;
//           if (d2 < minDistSq) { minDistSq = d2; }
//         }
//       }
//     }
//   }

//   return sqrt(minDistSq);
// }


fn cellular3D(p : vec3<f32>) -> f32 {
    let fx = i32(floor(p.x));
    let fy = i32(floor(p.y));
    let fz = i32(floor(p.z));
    var d1 : f32 = 1e9; var d2 : f32 = 1e9;
    for (var dz = -1; dz <= 1; dz++) {
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          let xi = fx + dx; let yi = fy + dy; let zi = fz + dz;
          let px = f32(xi) + rand3u(xi, yi, zi);
          let py = f32(yi) + rand3u(yi, zi, xi);
          let pz = f32(zi) + rand3u(zi, xi, yi);
          let dd = (px - p.x)*(px - p.x) + (py - p.y)*(py - p.y) + (pz - p.z)*(pz - p.z);
          if (dd < d1) { d2 = d1; d1 = dd; }
          else if (dd < d2) { d2 = dd; }
        }
      }
    }
    return d2 - d1;
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  2-D Simplex  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn simplex2D(p : vec2<f32>) -> f32 {
  let F2 : f32 = 0.3660254037844386;  // (\u221A3-1)/2
  let G2 : f32 = 0.2113248654051871;  // (3-\u221A3)/6

  // Skew to simplex grid
  let s  = (p.x + p.y) * F2;
  let i  = i32(floor(p.x + s));
  let j  = i32(floor(p.y + s));
  let t  = f32(i + j) * G2;

  let X0 = f32(i) - t;
  let Y0 = f32(j) - t;
  let x0 = p.x - X0;
  let y0 = p.y - Y0;

  // Simplex corner order
  var i1u : u32 = 0u;
  var j1u : u32 = 0u;
  if (x0 > y0) { i1u = 1u; } else { j1u = 1u; }

  // Offsets for remaining corners
  let x1 = x0 - f32(i1u) + G2;
  let y1 = y0 - f32(j1u) + G2;
  let x2 = x0 - 1.0 + 2.0 * G2;
  let y2 = y0 - 1.0 + 2.0 * G2;

  // Hashed gradients (mod 8 for 2D gradient table)
  let ii  = u32(i) & PERM_MASK;
  let jj  = u32(j) & PERM_MASK;
  let gi0 = perm(ii + perm(jj)) & 7u;
  let gi1 = perm(ii + i1u + perm((jj + j1u) & PERM_MASK)) & 7u;
  let gi2 = perm((ii + 1u) + perm((jj + 1u) & PERM_MASK)) & 7u;

  // Contributions from each corner
  var t0 = 0.5 - x0 * x0 - y0 * y0;
  var n0 : f32 = 0.0;
  if (t0 > 0.0) {
    t0 *= t0;
    n0 = t0 * t0 * dot(gradient2(gi0), vec2<f32>(x0, y0));
  }

  var t1 = 0.5 - x1 * x1 - y1 * y1;
  var n1 : f32 = 0.0;
  if (t1 > 0.0) {
    t1 *= t1;
    n1 = t1 * t1 * dot(gradient2(gi1), vec2<f32>(x1, y1));
  }

  var t2 = 0.5 - x2 * x2 - y2 * y2;
  var n2 : f32 = 0.0;
  if (t2 > 0.0) {
    t2 *= t2;
    n2 = t2 * t2 * dot(gradient2(gi2), vec2<f32>(x2, y2));
  }

  // Same scale used in the standard reference implementation
  return 70.0 * (n0 + n1 + n2);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 3-D Simplex Noise \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Call it like: let v = simplex3D(vec3<f32>(x,y,z));

fn simplex3D(pos : vec3<f32>) -> f32 {
    // Skew/\u200Bunskew factors for 3D
    let F3 : f32 = 1.0 / 3.0;
    let G3 : f32 = 1.0 / 6.0;

    // Skew the input space to find the simplex cell
    let s  = (pos.x + pos.y + pos.z) * F3;
    let i_f = floor(pos.x + s);
    let j_f = floor(pos.y + s);
    let k_f = floor(pos.z + s);

    let i = i32(i_f);
    let j = i32(j_f);
    let k = i32(k_f);

    // Unskew back to (x,y,z) space
    let t0 = f32(i + j + k) * G3;
    let X0 = f32(i) - t0;
    let Y0 = f32(j) - t0;
    let Z0 = f32(k) - t0;

    var x0 = pos.x - X0;
    var y0 = pos.y - Y0;
    var z0 = pos.z - Z0;

    // Determine which simplex we are in
    var i1: i32; var j1: i32; var k1: i32;
    var i2: i32; var j2: i32; var k2: i32;
    if (x0 >= y0) {
        if (y0 >= z0) {
            // X Y Z
            i1 = 1; j1 = 0; k1 = 0;
            i2 = 1; j2 = 1; k2 = 0;
        } else if (x0 >= z0) {
            // X Z Y
            i1 = 1; j1 = 0; k1 = 0;
            i2 = 1; j2 = 0; k2 = 1;
        } else {
            // Z X Y
            i1 = 0; j1 = 0; k1 = 1;
            i2 = 1; j2 = 0; k2 = 1;
        }
    } else {
        if (y0 < z0) {
            // Z Y X
            i1 = 0; j1 = 0; k1 = 1;
            i2 = 0; j2 = 1; k2 = 1;
        } else if (x0 < z0) {
            // Y Z X
            i1 = 0; j1 = 1; k1 = 0;
            i2 = 0; j2 = 1; k2 = 1;
        } else {
            // Y X Z
            i1 = 0; j1 = 1; k1 = 0;
            i2 = 1; j2 = 1; k2 = 0;
        }
    }

    // Offsets for the other three corners
    let x1 = x0 - f32(i1) + G3;
    let y1 = y0 - f32(j1) + G3;
    let z1 = z0 - f32(k1) + G3;

    let x2 = x0 - f32(i2) + 2.0 * G3;
    let y2 = y0 - f32(j2) + 2.0 * G3;
    let z2 = z0 - f32(k2) + 2.0 * G3;

    let x3 = x0 - 1.0 + 3.0 * G3;
    let y3 = y0 - 1.0 + 3.0 * G3;
    let z3 = z0 - 1.0 + 3.0 * G3;

    // Hash the corner indices to get gradient indices
    let ii = u32(i) & PERM_MASK;
    let jj = u32(j) & PERM_MASK;
    let kk = u32(k) & PERM_MASK;

    let gi0 = perm(ii + perm(jj + perm(kk)))        % 12u;
    let gi1 = perm(ii + u32(i1) + perm((jj + u32(j1)) + perm((kk + u32(k1))))) % 12u;
    let gi2 = perm(ii + u32(i2) + perm((jj + u32(j2)) + perm((kk + u32(k2))))) % 12u;
    let gi3 = perm(ii + 1u      + perm((jj + 1u     ) + perm((kk + 1u     )))) % 12u;

    // Compute contributions from each corner
    var n0: f32;
    var t_0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t_0 < 0.0) {
        n0 = 0.0;
    } else {
        let t2 = t_0 * t_0;
        n0 = t2 * t2 * dot(gradient(gi0), vec3<f32>(x0, y0, z0));
    }

    var n1: f32;
    var t_1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t_1 < 0.0) {
        n1 = 0.0;
    } else {
        let t2 = t_1 * t_1;
        n1 = t2 * t2 * dot(gradient(gi1), vec3<f32>(x1, y1, z1));
    }

    var n2: f32;
    var t_2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t_2 < 0.0) {
        n2 = 0.0;
    } else {
        let t2 = t_2 * t_2;
        n2 = t2 * t2 * dot(gradient(gi2), vec3<f32>(x2, y2, z2));
    }

    var n3: f32;
    var t_3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t_3 < 0.0) {
        n3 = 0.0;
    } else {
        let t2 = t_3 * t_3;
        n3 = t2 * t2 * dot(gradient(gi3), vec3<f32>(x3, y3, z3));
    }

    // Final scale to match [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3);
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  helpers  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/

fn cubicInterpolate(p0 : f32, p1 : f32, p2 : f32, p3 : f32, t : f32) -> f32 {
    return p1 + 0.5 * t *
        (p2 - p0 + t *
        (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3 + t *
        (3.0 * (p1 - p2) + p3 - p0)));
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Fast Lanczos 2-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn lanczos2D(pos : vec2<f32>) -> f32 {
    let ix  : i32 = i32(floor(pos.x));
    let iy  : i32 = i32(floor(pos.y));
    let dx  : f32 = pos.x - f32(ix);
    let dy  : f32 = pos.y - f32(iy);

    /* 4\xD74 neighbourhood hashed once \u2014 unrolled for speed */
    let n00 = rand2(ix - 1, iy - 1);
    let n10 = rand2(ix + 0, iy - 1);
    let n20 = rand2(ix + 1, iy - 1);
    let n30 = rand2(ix + 2, iy - 1);

    let n01 = rand2(ix - 1, iy + 0);
    let n11 = rand2(ix + 0, iy + 0);
    let n21 = rand2(ix + 1, iy + 0);
    let n31 = rand2(ix + 2, iy + 0);

    let n02 = rand2(ix - 1, iy + 1);
    let n12 = rand2(ix + 0, iy + 1);
    let n22 = rand2(ix + 1, iy + 1);
    let n32 = rand2(ix + 2, iy + 1);

    let n03 = rand2(ix - 1, iy + 2);
    let n13 = rand2(ix + 0, iy + 2);
    let n23 = rand2(ix + 1, iy + 2);
    let n33 = rand2(ix + 2, iy + 2);

    /* cubic along x (columns) */
    let col0 = cubicInterpolate(n00, n10, n20, n30, dx);
    let col1 = cubicInterpolate(n01, n11, n21, n31, dx);
    let col2 = cubicInterpolate(n02, n12, n22, n32, dx);
    let col3 = cubicInterpolate(n03, n13, n23, n33, dx);

    /* cubic along y (rows)  */
    return cubicInterpolate(col0, col1, col2, col3, dy);
}


/* helper to fetch one z-slice and cubic-interpolate along x/y */
fn slice(ix : i32, iy : i32, iz : i32, dx : f32, dy : f32) -> f32 {
    let n00 = rand3(ix - 1, iy - 1, iz);
    let n10 = rand3(ix + 0, iy - 1, iz);
    let n20 = rand3(ix + 1, iy - 1, iz);
    let n30 = rand3(ix + 2, iy - 1, iz);

    let n01 = rand3(ix - 1, iy + 0, iz);
    let n11 = rand3(ix + 0, iy + 0, iz);
    let n21 = rand3(ix + 1, iy + 0, iz);
    let n31 = rand3(ix + 2, iy + 0, iz);

    let n02 = rand3(ix - 1, iy + 1, iz);
    let n12 = rand3(ix + 0, iy + 1, iz);
    let n22 = rand3(ix + 1, iy + 1, iz);
    let n32 = rand3(ix + 2, iy + 1, iz);

    let n03 = rand3(ix - 1, iy + 2, iz);
    let n13 = rand3(ix + 0, iy + 2, iz);
    let n23 = rand3(ix + 1, iy + 2, iz);
    let n33 = rand3(ix + 2, iy + 2, iz);

    let col0 = cubicInterpolate(n00, n10, n20, n30, dx);
    let col1 = cubicInterpolate(n01, n11, n21, n31, dx);
    let col2 = cubicInterpolate(n02, n12, n22, n32, dx);
    let col3 = cubicInterpolate(n03, n13, n23, n33, dx);

    return cubicInterpolate(col0, col1, col2, col3, dy);
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Fast Lanczos 3-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn lanczos3D(pos : vec3<f32>) -> f32 {
    let ix : i32 = i32(floor(pos.x));
    let iy : i32 = i32(floor(pos.y));
    let iz : i32 = i32(floor(pos.z));
    let dx : f32 = pos.x - f32(ix);
    let dy : f32 = pos.y - f32(iy);
    let dz : f32 = pos.z - f32(iz);

    /* 4\xD74\xD74 neighbourhood \u2014 fetch & interpolate on-the-fly */

    let row0 = slice(ix, iy, iz - 1, dx, dy);
    let row1 = slice(ix, iy, iz + 0, dx, dy);
    let row2 = slice(ix, iy, iz + 1, dx, dy);
    let row3 = slice(ix, iy, iz + 2, dx, dy);

    return cubicInterpolate(row0, row1, row2, row3, dz);
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Voronoi 2-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn voronoi2D(pos : vec2<f32>) -> f32 {
    let fx : i32 = i32(floor(pos.x));
    let fy : i32 = i32(floor(pos.y));

    var minDist : f32 = 1e9;
    var minVal  : f32 = 0.0;

    for (var dy : i32 = -1; dy <= 1; dy = dy + 1) {
        for (var dx : i32 = -1; dx <= 1; dx = dx + 1) {
            let xi = fx + dx;
            let yi = fy + dy;

            let px = f32(xi) + rand2u(xi, yi);
            let py = f32(yi) + rand2u(yi, xi);

            let dist = (px - pos.x) * (px - pos.x) +
                       (py - pos.y) * (py - pos.y);

            if (dist < minDist) {
                minDist = dist;
                minVal  = rand2u(xi, yi);
            }
        }
    }
    return minVal;          // in [0,1]
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Voronoi 3-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
// fn voronoi3D(pos : vec3<f32>) -> f32 {
//     let fx : i32 = i32(floor(pos.x));
//     let fy : i32 = i32(floor(pos.y));
//     let fz : i32 = i32(floor(pos.z));

//     var minDist : f32 = 1e9;
//     var minVal  : f32 = 0.0;

//     for (var dz : i32 = -1; dz <= 1; dz = dz + 1) {
//         for (var dy : i32 = -1; dy <= 1; dy = dy + 1) {
//             for (var dx : i32 = -1; dx <= 1; dx = dx + 1) {
//                 let xi = fx + dx;
//                 let yi = fy + dy;
//                 let zi = fz + dz;

//                 let px = f32(xi) + rand3u(xi, yi, zi);
//                 let py = f32(yi) + rand3u(yi, zi, xi);
//                 let pz = f32(zi) + rand3u(zi, xi, yi);

//                 let dist = (px - pos.x) * (px - pos.x) +
//                            (py - pos.y) * (py - pos.y) +
//                            (pz - pos.z) * (pz - pos.z);

//                 if (dist < minDist) {
//                     minDist = dist;
//                     minVal  = rand3u(xi, yi, zi);
//                 }
//             }
//         }
//     }
//     return minVal;          // in [0,1]
// }



// ----------------- types & mode constants -----------------
struct Voro3DMetrics { f1Sq: f32, f2Sq: f32, cellVal: f32, };
struct Voro4DMetrics { f1Sq: f32, f2Sq: f32, cellVal: f32, };

// ----------------- voro_eval: pick output depending on mode -----------------


const VORO_CELL            : u32 = 0u;
const VORO_F1              : u32 = 1u;
const VORO_INTERIOR        : u32 = 2u;  // gap = F2 - F1
const VORO_EDGES           : u32 = 3u;  // scaled gap
const VORO_EDGE_THRESH     : u32 = 4u;  // gate gap >= threshold
const VORO_FLAT_SHADE      : u32 = 5u;  // interior = 1, edges = 0 (edges defined by gap < threshold)
const VORO_FLAT_SHADE_INV  : u32 = 6u;  // edges = 1, interior = 0 (gap < threshold)

// Added: "old cellular3D" compatible squared-gap modes (F2^2 - F1^2)
const VORO_INTERIOR_SQ        : u32 = 7u;  // gapSq = F2^2 - F1^2
const VORO_EDGES_SQ           : u32 = 8u;  // scaled gapSq
const VORO_EDGE_THRESH_SQ     : u32 = 9u;  // gate gapSq >= threshold
const VORO_FLAT_SHADE_SQ      : u32 = 10u; // interior = 1, edges = 0 (gapSq < threshold)
const VORO_FLAT_SHADE_INV_SQ  : u32 = 11u; // edges = 1, interior = 0 (gapSq < threshold)

// Added: F1 threshold and masks (useful for "radius" gates, bubble masks, etc.)
const VORO_F1_THRESH      : u32 = 12u; // gate F1 >= threshold, returns F1 * gate
const VORO_F1_MASK        : u32 = 13u; // smooth mask: 0 below threshold, 1 above (feather=edgeK)
const VORO_F1_MASK_INV    : u32 = 14u; // inverted mask: 1 below threshold, 0 above (feather=edgeK)

// Added: softer edge line response (no threshold needed)
const VORO_EDGE_RCP       : u32 = 15u; // 1 / (1 + gap*k)
const VORO_EDGE_RCP_SQ    : u32 = 16u; // 1 / (1 + gapSq*k)

fn voro_edge_dist(f1Sq: f32, f2Sq: f32) -> f32 {
  let f1 = sqrt(max(f1Sq, 0.0));
  let f2 = sqrt(max(f2Sq, 0.0));
  return max(f2 - f1, 0.0);
}

// edgeDist is gap (or gapSq for *_SQ modes)
// returns 1 near edges (small edgeDist), 0 in interior
fn voro_edge_mask(edgeDist: f32, threshold: f32, feather: f32) -> f32 {
  let t = max(threshold, 0.0);
  if (t <= 0.0) { return 0.0; }

  let f = max(feather, 0.0);
  if (f > 0.0) {
    return 1.0 - smoothstep(t, t + f, edgeDist);
  }
  return select(0.0, 1.0, edgeDist < t);
}

// returns 0 below threshold, 1 above (optionally smoothed)
fn voro_thresh_mask(v: f32, threshold: f32, feather: f32) -> f32 {
  let t = max(threshold, 0.0);
  if (t <= 0.0) { return 0.0; }

  let f = max(feather, 0.0);
  if (f > 0.0) {
    return smoothstep(t, t + f, v);
  }
  return select(0.0, 1.0, v >= t);
}

fn voro_eval3D_metrics(m: Voro3DMetrics, params: NoiseParams, freqOrScale: f32) -> f32 {
  return voro_eval(
    m.f1Sq,
    m.f2Sq,
    m.cellVal,
    params.voroMode,
    max(params.edgeK, 0.0),
    max(params.threshold, 0.0),
    freqOrScale
  );
}


// f1Sq/f2Sq are squared distances; cellVal in [0,1].
// edgeK is scale (edges modes) or feather (mask modes). freqOrScale unused.
fn voro_eval(
  f1Sq: f32,
  f2Sq: f32,
  cellVal: f32,
  mode: u32,
  edgeK: f32,
  threshold: f32,
  freqOrScale: f32
) -> f32 {
  let f1 = sqrt(max(f1Sq, 0.0));
  let f2 = sqrt(max(f2Sq, 0.0));
  let gap = max(f2 - f1, 0.0);

  let gapSq = max(f2Sq - f1Sq, 0.0);

  switch (mode) {
    case VORO_CELL: {
      return cellVal;
    }
    case VORO_F1: {
      return f1;
    }
    case VORO_INTERIOR: {
      return gap;
    }
    case VORO_EDGES: {
      let k = max(edgeK, 0.0);
      return clamp(gap * select(10.0, k, k > 0.0), 0.0, 1.0);
    }
    case VORO_EDGE_THRESH: {
      let t = max(threshold, 0.0);
      let gate = select(0.0, 1.0, gap >= t);
      return gap * gate;
    }
    case VORO_FLAT_SHADE: {
      let edge = voro_edge_mask(gap, threshold, edgeK);
      return 1.0 - edge;
    }
    case VORO_FLAT_SHADE_INV: {
      let edge = voro_edge_mask(gap, threshold, edgeK);
      return edge;
    }

    case VORO_INTERIOR_SQ: {
      return gapSq;
    }
    case VORO_EDGES_SQ: {
      let k = max(edgeK, 0.0);
      return clamp(gapSq * select(10.0, k, k > 0.0), 0.0, 1.0);
    }
    case VORO_EDGE_THRESH_SQ: {
      let t = max(threshold, 0.0);
      let gate = select(0.0, 1.0, gapSq >= t);
      return gapSq * gate;
    }
    case VORO_FLAT_SHADE_SQ: {
      let edge = voro_edge_mask(gapSq, threshold, edgeK);
      return 1.0 - edge;
    }
    case VORO_FLAT_SHADE_INV_SQ: {
      let edge = voro_edge_mask(gapSq, threshold, edgeK);
      return edge;
    }

    case VORO_F1_THRESH: {
      let t = max(threshold, 0.0);
      let gate = select(0.0, 1.0, f1 >= t);
      return f1 * gate;
    }
    case VORO_F1_MASK: {
      return voro_thresh_mask(f1, threshold, edgeK);
    }
    case VORO_F1_MASK_INV: {
      return 1.0 - voro_thresh_mask(f1, threshold, edgeK);
    }

    case VORO_EDGE_RCP: {
      let k = max(edgeK, 0.0);
      return 1.0 / (1.0 + gap * k*10);
    }
    case VORO_EDGE_RCP_SQ: {
      let k = max(edgeK, 0.0);
      return 1.0 / (1.0 + gapSq * k*10);
    }

    default: {
      return gap;
    }
  }
}

// ----------------- helpers: metrics -----------------
fn voro3D_metrics(pos: vec3<f32>) -> Voro3DMetrics {
  let fx = i32(floor(pos.x));
  let fy = i32(floor(pos.y));
  let fz = i32(floor(pos.z));

  var d1 : f32 = 1e9;
  var d2 : f32 = 1e9;
  var lab: f32 = 0.0;

  for (var dz = -1; dz <= 1; dz = dz + 1) {
    for (var dy = -1; dy <= 1; dy = dy + 1) {
      for (var dx = -1; dx <= 1; dx = dx + 1) {
        let xi = fx + dx; let yi = fy + dy; let zi = fz + dz;

        let rx = rand3u(xi, yi, zi);
        let ry = rand3u(yi, zi, xi);
        let rz = rand3u(zi, xi, yi);

        let px = f32(xi) + rx;
        let py = f32(yi) + ry;
        let pz = f32(zi) + rz;

        let dxv = px - pos.x;
        let dyv = py - pos.y;
        let dzv = pz - pos.z;

        let d2c = dxv*dxv + dyv*dyv + dzv*dzv;

        if (d2c < d1) {
          d2 = d1;
          d1 = d2c;
          lab = rand3u(xi, yi, zi);
        } else if (d2c < d2) {
          d2 = d2c;
        }
      }
    }
  }
  return Voro3DMetrics(d1, d2, lab);
}

fn voro4D_metrics(p: vec4<f32>) -> Voro4DMetrics {
  let fx = i32(floor(p.x));
  let fy = i32(floor(p.y));
  let fz = i32(floor(p.z));
  let fw = i32(floor(p.w));

  var d1 : f32 = 1e9;
  var d2 : f32 = 1e9;
  var lab: f32 = 0.0;

  for (var dw = -1; dw <= 1; dw = dw + 1) {
    for (var dz = -1; dz <= 1; dz = dz + 1) {
      for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
          let xi = fx + dx; let yi = fy + dy; let zi = fz + dz; let wi = fw + dw;

          let rx = rand4u(xi, yi, zi, wi);
          let ry = rand4u(yi, zi, wi, xi);
          let rz = rand4u(zi, wi, xi, yi);
          let rw = rand4u(wi, xi, yi, zi);

          let px = f32(xi) + rx;
          let py = f32(yi) + ry;
          let pz = f32(zi) + rz;
          let pw = f32(wi) + rw;

          let dxv = px - p.x; let dyv = py - p.y;
          let dzv = pz - p.z; let dwv = pw - p.w;

          let d2c = dxv*dxv + dyv*dyv + dzv*dzv + dwv*dwv;

          if (d2c < d1) {
            d2 = d1;
            d1 = d2c;
            lab = rand4u(xi, yi, zi, wi);
          } else if (d2c < d2) {
            d2 = d2c;
          }
        }
      }
    }
  }
  return Voro4DMetrics(d1, d2, lab);
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Cellular 2-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn cellular2D(pos : vec2<f32>) -> f32 {
    let fx : i32 = i32(floor(pos.x));
    let fy : i32 = i32(floor(pos.y));

    var minDist1 : f32 = 1e9;
    var minDist2 : f32 = 1e9;

    for (var dy : i32 = -1; dy <= 1; dy = dy + 1) {
        for (var dx : i32 = -1; dx <= 1; dx = dx + 1) {
            let xi = fx + dx;
            let yi = fy + dy;

            /* feature point */
            let px = f32(xi) + rand2u(xi, yi);
            let py = f32(yi) + rand2u(yi, xi);

            /* squared distance */
            let d = (px - pos.x) * (px - pos.x)
                  + (py - pos.y) * (py - pos.y);

            /* keep two smallest distances */
            if (d < minDist1) {
                minDist2 = minDist1;
                minDist1 = d;
            } else if (d < minDist2) {
                minDist2 = d;
            }
        }
    }
    /* return difference of 1st and 2nd nearest feature distances */
    return minDist2 - minDist1;
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Worley 2-D  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn worley2D(pos : vec2<f32>) -> f32 {
    let fx : i32 = i32(floor(pos.x));
    let fy : i32 = i32(floor(pos.y));

    var minDist : f32 = 1e9;

    for (var dy : i32 = -1; dy <= 1; dy = dy + 1) {
        for (var dx : i32 = -1; dx <= 1; dx = dx + 1) {
            let xi = fx + dx;
            let yi = fy + dy;

            /* feature point */
            let px = f32(xi) + rand2u(xi, yi);
            let py = f32(yi) + rand2u(yi, xi);

            /* squared distance */
            let d = (px - pos.x) * (px - pos.x)
                  + (py - pos.y) * (py - pos.y);

            if (d < minDist) {
                minDist = d;
            }
        }
    }

    return sqrt(minDist);    // Euclidean distance to nearest feature
}

/* central-diff gradient of scalar simplex */
fn gradSimplex2(q: vec2<f32>, eps: f32) -> vec2<f32> {
  let dx = (simplex2D(q + vec2<f32>(eps, 0.0)) - simplex2D(q - vec2<f32>(eps, 0.0))) / (2.0 * eps);
  let dy = (simplex2D(q + vec2<f32>(0.0, eps)) - simplex2D(q - vec2<f32>(0.0, eps))) / (2.0 * eps);
  return vec2<f32>(dx, dy);
}

/* single-octave curl = grad rotated 90\xB0 (\u2202N/\u2202y, -\u2202N/\u2202x) */
fn curl2_simplex2D(pos: vec2<f32>, p: NoiseParams) -> vec2<f32> {
  let zoom = max(p.zoom, 1e-6);
  let freq = max(p.freq, 1e-6);
  let base = pos / zoom + vec2<f32>(p.xShift, p.yShift);
  let q = base * freq;

  // choose \u03B5 ~ half a cycle of current scale to avoid lattice aliasing
  let cycles_per_world = max(freq / zoom, 1e-6);
  let eps = 0.5 / cycles_per_world;

  let g = gradSimplex2(q, eps * freq);
  return vec2<f32>(g.y, -g.x);
}

/* multi-octave curl: sum derivatives per octave (no sharp creases) */
fn curl2_simplexFBM(pos: vec2<f32>, p: NoiseParams) -> vec2<f32> {
  let zoom = max(p.zoom, 1e-6);
  var q      = pos / zoom + vec2<f32>(p.xShift, p.yShift);
  var freq   : f32 = max(p.freq, 1e-6);
  var amp    : f32 = 1.0;
  var angle  : f32 = p.seedAngle;
  var curl   : vec2<f32> = vec2<f32>(0.0);

  for (var i: u32 = 0u; i < p.octaves; i = i + 1u) {
    // \u03B5 scales with octave so the finite difference stays well-conditioned
    let cycles_per_world = max(freq / zoom, 1e-6);
    let eps = 0.5 / cycles_per_world;

    let g = gradSimplex2(q * freq, eps * freq);
    curl += vec2<f32>(g.y, -g.x) * amp;

    // next octave
    freq *= p.lacunarity;
    amp  *= p.gain;

    // decorrelate like your Perlin path (XY rotate + shift bleed into next)
    let cA = cos(angle);
    let sA = sin(angle);
    let nx = q.x * cA - q.y * sA;
    let ny = q.x * sA + q.y * cA;
    q = vec2<f32>(nx, ny) + vec2<f32>(p.xShift, p.yShift);
    angle += ANGLE_INCREMENT;
  }
  return curl;
}

/* map a non-negative magnitude to [-1,1] for your writeChannel convention */
fn mag_to_signed01(m: f32) -> f32 {
  return clamp(m, 0.0, 1.0) * 2.0 - 1.0;
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Domain-warp FBM  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn domainWarpFBM(p: vec3<f32>, params: NoiseParams,
                 warpAmp: f32, stages: u32) -> f32 {
    var q = p;
    for (var i: u32 = 0u; i < stages; i = i + 1u) {
        let w = fbm3D(q, params) * warpAmp;
        q = q + vec3<f32>(w, w, w);
    }
    return fbm3D(q, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 gabor utils \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const TAU : f32 = 6.283185307179586;

fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }

fn hash_u32(x: u32) -> u32 {
  var v = x;
  v = (v ^ 61u) ^ (v >> 16u);
  v = v + (v << 3u);
  v = v ^ (v >> 4u);
  v = v * 0x27d4eb2du;
  v = v ^ (v >> 15u);
  return v;
}

fn hash3_u32(ix: i32, iy: i32, iz: i32, seed: u32, salt: u32) -> u32 {
  let x = u32(ix) * 73856093u;
  let y = u32(iy) * 19349663u;
  let z = u32(iz) * 83492791u;
  return hash_u32(x ^ y ^ z ^ seed ^ salt);
}

fn rnd01(h: u32) -> f32 {
  return f32(h) * (1.0 / 4294967295.0);
}

fn rand3_01(ix: i32, iy: i32, iz: i32, seed: u32, salt: u32) -> f32 {
  return rnd01(hash3_u32(ix, iy, iz, seed, salt));
}

fn rand3_vec3(ix: i32, iy: i32, iz: i32, seed: u32, salt: u32) -> vec3<f32> {
  let a = rand3_01(ix, iy, iz, seed, salt + 0u);
  let b = rand3_01(ix, iy, iz, seed, salt + 1u);
  let c = rand3_01(ix, iy, iz, seed, salt + 2u);
  return vec3<f32>(a, b, c);
}

fn rand_unit_vec3(ix: i32, iy: i32, iz: i32, seed: u32, salt: u32) -> vec3<f32> {
  let u = rand3_01(ix, iy, iz, seed, salt + 0u);
  let v = rand3_01(ix, iy, iz, seed, salt + 1u);

  let z = 1.0 - 2.0 * u;
  let r = sqrt(max(0.0, 1.0 - z * z));
  let a = TAU * v;

  return vec3<f32>(r * cos(a), r * sin(a), z);
}

fn gabor_kernel3D(d: vec3<f32>, dir: vec3<f32>, waveFreq: f32, sigma: f32, phase: f32) -> f32 {
  let s  = max(0.0005, sigma);
  let g  = exp(-dot(d, d) / (2.0 * s * s));
  let w  = cos(TAU * waveFreq * dot(dir, d) + phase);
  return g * w;
}

fn gaborWarpDomain(p: vec3<f32>, params: NoiseParams) -> vec3<f32> {
  let a = params.warpAmp;
  if (a <= 0.00001) { return p; }

  let w1 = simplex3D(p * 0.75 + vec3<f32>(13.1, 7.7, 19.3));
  let w2 = simplex3D(p * 0.75 + vec3<f32>(41.7, 23.9, 5.3));
  let w3 = simplex3D(p * 0.75 + vec3<f32>(9.9, 31.3, 17.7));

  return p + vec3<f32>(w1, w2, w3) * a;
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Gabor sparse-convolution  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn gaborOctave3D(p: vec3<f32>, waveFreq: f32, sigma: f32, params: NoiseParams) -> f32 {
  let base = vec3<i32>(
    i32(floor(p.x)),
    i32(floor(p.y)),
    i32(floor(p.z))
  );

  var sum: f32 = 0.0;

  for (var dz: i32 = -1; dz <= 1; dz = dz + 1) {
    for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
      for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
        let cx = base.x + dx;
        let cy = base.y + dy;
        let cz = base.z + dz;

        let jitter = rand3_vec3(cx, cy, cz, params.seed, 11u) - vec3<f32>(0.5, 0.5, 0.5);
        let center = vec3<f32>(f32(cx), f32(cy), f32(cz)) + vec3<f32>(0.5, 0.5, 0.5) + jitter * 0.95;

        let d     = p - center;
        let dir   = rand_unit_vec3(cx, cy, cz, params.seed, 41u);
        let phase = TAU * rand3_01(cx, cy, cz, params.seed, 71u);
        let amp   = rand3_01(cx, cy, cz, params.seed, 91u) * 2.0 - 1.0;

        sum += amp * gabor_kernel3D(d, dir, waveFreq, sigma, phase);
      }
    }
  }

  return sum * (1.0 / 9.0);
}

fn gaborShape(n: f32, params: NoiseParams) -> f32 {
  var v = 0.5 + 0.5 * clamp(n, -1.0, 1.0);

  let widen = max(0.0, params.gaborRadius) * max(0.0001, params.exp2);
  v = pow(saturate(v), 1.0 / (1.0 + widen));

  let t    = saturate(params.threshold);
  let hard = max(0.0001, params.exp1);

  let a = smoothstep(t - hard, t + hard, v);
  return a * 2.0 - 1.0;
}

fn gaborCellEdgeMask2D(cellP: vec2<f32>, edgeK: f32) -> f32 {
  let k = max(0.0, edgeK);
  if (k <= 0.00001) { return 1.0; }

  let width = select(k, 0.5 / k, k > 0.5);
  let w = clamp(width, 0.00001, 0.5);

  let f  = fract(cellP);
  let dx = min(f.x, 1.0 - f.x);
  let dy = min(f.y, 1.0 - f.y);
  let d  = min(dx, dy);

  return smoothstep(0.0, w, d);
}

/* Multi-octave Gabor with per-octave cell-edge fade */
fn gaborNoise3D(p: vec3<f32>, params: NoiseParams) -> f32 {
  var x = p.x / params.zoom + params.xShift;
  var y = p.y / params.zoom + params.yShift;
  var z = p.z / params.zoom + params.zShift;

  var sum     : f32 = 0.0;
  var amp     : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle   : f32 = params.seedAngle;

  let waveFreq = max(0.001, params.rippleFreq);

  var minMask : f32 = 1.0;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let sigma = max(0.0005, params.gaborRadius);

    var pp = vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc);
    pp = gaborWarpDomain(pp, params);

    let edgeM = gaborCellEdgeMask2D(pp.xy, params.edgeK);
    minMask = min(minMask, edgeM);

    var n = gaborOctave3D(pp, waveFreq, sigma, params);

    if (params.turbulence == 1u) {
      n = abs(n) * edgeM;
    } else {
      n = (-1.0) + (n + 1.0) * edgeM;
    }

    sum += n * amp;

    freqLoc *= params.lacunarity;
    amp     *= params.gain;

    let c  = cos(angle);
    let s  = sin(angle);
    let nx = x * c - y * s;
    let ny = x * s + y * c;
    let nz = y * s + z * c;

    x = nx + params.xShift;
    y = ny + params.yShift;
    z = nz + params.zShift;

    angle += ANGLE_INCREMENT;
  }

  if (params.turbulence == 1u) {
    sum = mix(-1.0, sum, minMask);
  }

  var out = gaborShape(sum, params);
  if (params.turbulence == 1u) { out = out - 1.0; }
  return out;
}

fn gaborFlowKernel3D(r: vec3<f32>, d: vec2<f32>, ex: f32, ey: f32, ez: f32, c: f32, phase: f32) -> f32 {
  let rx = dot(r.xy, d);
  let ry = dot(r.xy, vec2<f32>(d.y, -d.x));
  let g  = exp(ex * rx * rx + ey * ry * ry + ez * r.z * r.z);
  let w  = cos(c * rx + phase);
  return g * w;
}

fn gaborMagicNoise3D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let sizeF = select(12.0, par.terraceStep, par.terraceStep > 0.00001);
  let size  = max(1, i32(clamp(sizeF, 1.0, 48.0) + 0.5));

  let zRad  = i32(2u);

  let sig = max(0.0005, par.gaborRadius);
  let gam = max(0.0001, par.exp2);

  let sx = sig;
  let sy = sig / gam;
  let sz = sig;

  let ex = -0.5 / (sx * sx);
  let ey = -0.5 / (sy * sy);
  let ez = -0.5 / (sz * sz);

  let lam = max(0.001, par.rippleFreq);
  let c   = TAU / lam;

  let P = 0.1963495408; // PI/16

  var cs: array<vec2<f32>, 16>;
  var ph: array<f32, 16>;
  var acc: array<f32, 16>;

  for (var k: u32 = 0u; k < 16u; k = k + 1u) {
    acc[k] = 0.0;
    let a = f32(k) * P;
    cs[k] = vec2<f32>(cos(a), sin(a));
    ph[k] = TAU * rand3_01(i32(k), 0, 0, par.seed, 71u);
  }

  let base = vec3<f32>(
    p.x / par.zoom + par.xShift,
    p.y / par.zoom + par.yShift,
    p.z / par.zoom + par.zShift
  );

  let adv = vec3<f32>(par.time * 10.0, par.time * 10.0, par.time * 3.0);

  let seedOff = vec3<f32>(
    f32(par.seed & 1023u) * 23.17,
    f32((par.seed >> 10u) & 1023u) * 19.73,
    f32((par.seed >> 20u) & 1023u) * 17.11
  );

  let fscale = 0.1 * max(0.0001, par.freq);

  let phaseT = TAU * (par.time / lam);

  for (var dz: i32 = -zRad; dz <= zRad; dz = dz + 1) {
    for (var j: i32 = -size; j <= size; j = j + 1) {
      for (var i: i32 = -size; i <= size; i = i + 1) {
        let r = vec3<f32>(f32(i), f32(j), f32(dz));

        var sp = (base + r + adv + seedOff) * fscale;
        sp = gaborWarpDomain(sp, par);

        let src = 0.6 * (0.5 + 0.5 * noise3D(sp));

        for (var k: u32 = 0u; k < 16u; k = k + 1u) {
          acc[k] += src * gaborFlowKernel3D(r, cs[k], ex, ey, ez, c, ph[k] + phaseT);
        }
      }
    }
  }

  var mx: f32 = 0.0;
  for (var k: u32 = 0u; k < 16u; k = k + 1u) {
    mx = max(mx, acc[k]);
  }

  var v01 = saturate((mx / 10.0) * max(0.0001, par.gain));

  if (par.threshold > 0.00001) {
    let t    = saturate(par.threshold);
    let hard = max(0.0001, par.exp1);
    v01 = smoothstep(t - hard, t + hard, v01);
  }

  return v01 * 2.0 - 1.0;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 flow-gabor helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

fn hash2f01(p: vec2<f32>, seed: u32) -> f32 {
  let h = sin(dot(p, vec2<f32>(12.9898, 78.233)) + f32(seed) * 0.000123);
  return fract(h * 43758.5453);
}

fn mnoise3D(p: vec3<f32>, mode: u32) -> f32 {
  let n = noise3D(p); // ~[-1,1]
  if (mode == 1u) { return -1.0 + 2.0 * abs(n); }          // cloud-like
  if (mode == 2u) { return -1.0 + 2.0 * (1.0 - abs(n)); }  // flame-like
  return n;
}

fn turb2D(U: vec2<f32>, t: f32, par: NoiseParams) -> f32 {
  var u = U;
  var tt = t;

  var f: f32 = 0.0;
  var q: f32 = 1.0;
  var s: f32 = 0.0;

  let m: f32 = 2.0;
  let iters: u32 = clamp(par.octaves, 1u, 4u);

  for (var i: u32 = 0u; i < 4u; i = i + 1u) {
    if (i >= iters) { break; }

    u -= tt * vec2<f32>(0.6, 0.2);
    f += q * mnoise3D(vec3<f32>(u, tt), par.voroMode);
    s += q;

    q *= 0.5;
    u *= m;
    tt *= 1.71;
  }

  return f / max(1e-6, s);
}

fn flowDir2D(U: vec2<f32>, t: f32, par: NoiseParams) -> vec2<f32> {
  let eps: f32 = 1e-3;
  let S: f32 = max(1e-4, par.freq);

  let a = turb2D(S * (U + vec2<f32>(0.0, -eps)), t, par);
  let b = turb2D(S * (U + vec2<f32>(0.0,  eps)), t, par);
  let c = turb2D(S * (U + vec2<f32>( eps, 0.0)), t, par);
  let d = turb2D(S * (U + vec2<f32>(-eps, 0.0)), t, par);

  var V = vec2<f32>((a - b), (c - d)) / eps;

  let l2 = dot(V, V);
  if (l2 < 1e-20) { V = vec2<f32>(1.0, 0.0); }
  else { V *= inverseSqrt(l2); }

  // optional: rotate into "normal field" (like the shadertoy toggle)
  if ((par.voroMode & 4u) != 0u) { V = vec2<f32>(-V.y, V.x); }

  return V;
}

fn gaborPhasorFlow(U: vec2<f32>, V: vec2<f32>, par: NoiseParams) -> vec2<f32> {
  let F: f32 = max(1e-4, par.rippleFreq);

  let Wf = select(12.0, par.terraceStep, par.terraceStep > 0.00001);
  let W  = max(1, i32(clamp(Wf, 1.0, 24.0) + 0.5));

  let TG: f32 = par.time * 0.5 * max(0.0, par.warpAmp);

  var s: vec2<f32> = vec2<f32>(0.0);
  var T: f32 = 0.0;

  for (var j: i32 = -W; j <= W; j = j + 1) {
    for (var i: i32 = -W; i <= W; i = i + 1) {
      let P = vec2<f32>(f32(i), f32(j));

      let h = hash2f01(U + P, par.seed);
      let ang = TWO_PI * h - F * dot(P, V) + TG;

      let v = vec2<f32>(cos(ang), sin(ang));

      let d = min(1.0, length(P) / f32(W));
      let K = 0.5 + 0.5 * cos(PI * d); // raised-cosine kernel

      s += v * K;
      T += K;
    }
  }

  return s / max(1e-6, T);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

fn generateGaborFlow(pos: vec3<f32>, par: NoiseParams) -> f32 {
  let zoom = max(par.zoom, 1e-6);

  // reconstruct pixel-ish domain like shadertoy (centered)
  let R = vec2<f32>(max(f32(frame.fullWidth), 1.0), max(f32(frame.fullHeight), 1.0));
  let uPix = vec2<f32>(pos.x * R.x, pos.y * R.y);
  let Uflow = (uPix - 0.5 * R) / R.y;

  // animated flow time
  let t = par.time * 0.2;

  // flow direction
  let V = flowDir2D(Uflow * (1.0 / zoom), t, par);

  // gabor phasor (use centered pixel coords like the reference)
  let s = gaborPhasorFlow((uPix - 0.5 * R) / zoom, V, par);

  // output mode:
  //  - turbulence==0: phasor profile (0..1)
  //  - turbulence==1: contrast (magnitude)
  let l = length(s);
  var v01: f32;

  if (par.turbulence == 1u) {
    v01 = saturate(4.0 * l * max(0.0001, par.gain));
  } else {
    let nx = select(1.0, s.x / l, l > 1e-8);
    v01 = 0.5 + 0.5 * nx;
    v01 = saturate(v01 * max(0.0001, par.gain));
  }

  if (par.threshold > 0.00001) {
    let tt = saturate(par.threshold);
    let hard = max(0.0001, par.exp1);
    v01 = smoothstep(tt - hard, tt + hard, v01);
  }

  return v01 * 2.0 - 1.0;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 compute entry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

@compute @workgroup_size(8,8,1)
fn computeGaborFlow(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateGaborFlow(p, params), options.outputChannel, 0u);
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Terrace & Foam filters  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn terrace(v:f32, steps:f32)  -> f32 { return floor(v*steps)/steps; }
fn foamify(v: f32) -> f32 {
    let x = clamp(v, 0.0, 1.0);

    let lo = smoothstep(0.18, 0.48, x);
    let hi = 1.0 - smoothstep(0.58, 0.92, x);

    let band = clamp(lo * hi, 0.0, 1.0);
    return pow(band, 0.6);
}
fn turbulence(v:f32)          -> f32 { return abs(v); }

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Simplex (multi-octave) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn generateSimplex(pos: vec3<f32>, p: NoiseParams) -> f32 {
    let invZoom = 1.0 / max(p.zoom, 1e-6);
    let domainOffset = seedOffset3(p.seed);

    let base = vec3<f32>(
      pos.x * invZoom + p.xShift,
      pos.y * invZoom + p.yShift,
      pos.z * invZoom + p.zShift
    ) + domainOffset;

    var sum     : f32 = 0.0;
    var amp     : f32 = 1.0;
    var ampSum  : f32 = 0.0;
    var freqLoc : f32 = max(p.freq, 1e-6);
    var angle   : f32 = p.seedAngle;

    for (var i: u32 = 0u; i < p.octaves; i = i + 1u) {
        let samplePos = rotateXY3(base, angle) * freqLoc;
        var n = simplex3D(samplePos);
        if (p.turbulence == 1u) { n = abs(n); }
        sum += n * amp;
        ampSum += amp;

        freqLoc *= p.lacunarity;
        amp     *= p.gain;
        angle   += ANGLE_INCREMENT;
    }

    if (ampSum > 0.0) {
        sum = sum / ampSum;
    }
    if (p.turbulence == 1u) { sum = sum * 2.0 - 1.0; }
    return sum;
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Simplex-based fBm helper (normalized)  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn sfbm3D(pos : vec3<f32>, params: NoiseParams) -> f32 {
    let invZoom = 1.0 / max(params.zoom, 1e-6);
    let domainOffset = seedOffset3(params.seed);

    let base = vec3<f32>(
      pos.x * invZoom + params.xShift,
      pos.y * invZoom + params.yShift,
      pos.z * invZoom + params.zShift
    ) + domainOffset;

    var sum       : f32 = 0.0;
    var amplitude : f32 = 1.0;
    var maxValue  : f32 = 0.0;
    var freqLoc   : f32 = max(params.freq, 1e-6);
    var angle     : f32 = params.seedAngle;
    let angleInc  : f32 = 2.0 * PI / max(f32(params.octaves), 1.0);

    for (var i : u32 = 0u; i < params.octaves; i = i + 1u) {
        let samplePos = rotateXY3(base, angle) * freqLoc;
        var n = simplex3D(samplePos);
        if (params.turbulence == 1u) { n = abs(n); }

        sum      += amplitude * n;
        maxValue += amplitude;

        freqLoc   *= params.lacunarity;
        amplitude *= params.gain;
        angle     += angleInc;
    }

    if (maxValue > 0.0) {
        var out = sum / maxValue;
        if (params.turbulence == 1u) {
            out = out * 2.0 - 1.0;
        }
        return out;
    }
    return 0.0;
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Simplex FBM (Perlin-style nested fBm)  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
fn generateSimplexFBM(pos: vec3<f32>, p: NoiseParams) -> f32 {
    // Same  you use for Perlin FBM: fBm once, then feed through again
    let fbm1 = sfbm3D(pos, p);
    let fbm2 = sfbm3D(vec3<f32>(fbm1, fbm1, fbm1), p);
    return 2.0 * fbm2;  // keep roughly in [-1,1]
}

fn generateDomainWarpFBM1(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let v = domainWarpFBM(pos, par, par.warpAmp, 1u);
    return v;
}

fn generateDomainWarpFBM2(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let v = domainWarpFBM(pos, par, par.warpAmp, 2u);
    return v;
}

fn generateGaborAniso(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let v = gaborNoise3D(pos, par);
    return v;
}

fn generateGaborMagic(pos: vec3<f32>, par: NoiseParams) -> f32 {
  return gaborMagicNoise3D(pos, par);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Perlin Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generatePerlin(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let invZoom = 1.0 / max(params.zoom, 1e-6);
  let domainOffset = seedOffset3(params.seed);

  let base = vec3<f32>(
    pos.x * invZoom + params.xShift,
    pos.y * invZoom + params.yShift,
    pos.z * invZoom + params.zShift
  ) + domainOffset;

  var sum: f32 = 0.0;
  var amp: f32 = 1.0;
  var freqLoc: f32 = max(params.freq, 1e-6);
  var angle: f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let samplePos = rotateXY3(base, angle) * freqLoc;

    var n: f32 = noise3D(samplePos);
    if (params.turbulence == 1u) {
      n = abs(n);
    }

    sum += n * amp;

    freqLoc *= params.lacunarity;
    amp *= params.gain;
    angle += ANGLE_INCREMENT;
  }

  if (params.turbulence == 1u) {
    sum = sum - 1.0;
  }

  return sum;
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D Perlin FBM \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generatePerlin4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z) / zoom;
  } else {
    base = vec4<f32>(
      pos.x / zoom + params.xShift,
      pos.y / zoom + params.yShift,
      pos.z / zoom + params.zShift,
      params.time
    );
  }

  var sum     : f32 = 0.0;
  var amp     : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle   : f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    var n = noise4D(base * freqLoc) * amp;
    if (params.turbulence == 1u) { n = abs(n); }
    sum += n;

    freqLoc *= params.lacunarity;
    amp     *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let s = sin(angle);
      let xy = vec2<f32>( base.x * c - base.y * s, base.x * s + base.y * c );
      let zw = vec2<f32>( base.z * c - base.w * s, base.z * s + base.w * c );
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  if (params.turbulence == 1u) { sum -= 1.0; }
  return sum;
}


fn generateTerraceNoise(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let base = generatePerlin(pos, par);
    let v = terrace(base, par.terraceStep);
    return v;
}

fn generateFoamNoise(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let base = generateBillow(pos, par);
    let v = foamify(base);
    return v;
}

fn generateTurbulence(pos: vec3<f32>, par: NoiseParams) -> f32 {
    let base = generatePerlin(pos, par);
    let v = turbulence(base);
    return v;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Billow Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateBillow(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var p = pos / zoom + vec3<f32>(params.xShift, params.yShift, params.zShift);

    var sum: f32     = 0.0;
    var amp: f32     = 1.0;
    var freqLoc: f32 = max(params.freq, 1e-6);
    var ampSum: f32  = 0.0;
    var angle: f32   = params.seedAngle;

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        let n  = noise3D(p * freqLoc);
        let b  = pow(abs(n), 0.75);
        sum    = sum + b * amp;
        ampSum = ampSum + amp;

        freqLoc = freqLoc * params.lacunarity;
        amp     = amp     * params.gain;

        let c  = cos(angle);
        let s  = sin(angle);
        let xy = vec2<f32>(p.x, p.y);
        let r  = vec2<f32>(xy.x * c - xy.y * s, xy.x * s + xy.y * c);
        p = vec3<f32>(r.x, r.y, p.z + 0.03125);

        angle = angle + ANGLE_INCREMENT;
    }

    if (ampSum > 0.0) {
        sum = sum / ampSum;
    }

    let k: f32 = 1.2;
    let cMid   = sum - 0.5;
    let shaped = 0.5 + cMid * k / (1.0 + abs(cMid) * (k - 1.0));

    return clamp(shaped, 0.0, 1.0);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti-Billow Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateAntiBillow(pos: vec3<f32>, params: NoiseParams) -> f32 {
    return 1.0 - generateBillow(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Ridge Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// basic ridge transform of gradient noise
fn ridgeNoise(pos : vec3<f32>) -> f32 {
    let v = noise3D(pos);
    let w = 1.0 - abs(v);
    return w * w;
}

// octave\u2010sum generator using ridge noise
// sample like: let r = generateRidge(vec3<f32>(x,y,z));
fn generateRidge(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var sum     : f32 = 0.0;
    var amp     : f32 = 1.0;
    var freqLoc : f32 = max(params.freq, 1e-6);

    for (var i : u32 = 0u; i < params.octaves; i = i + 1u) {
        sum = sum + ridgeNoise(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)) * amp;
        freqLoc = freqLoc * params.lacunarity;
        amp     = amp     * params.gain;
        x = x + params.xShift;
        y = y + params.yShift;
        z = z + params.zShift;
    }

    sum = sum - 1.0;
    return -sum;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti\u2010Ridge Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// identical ridge transform, but flips sign at output
fn generateAntiRidge(pos : vec3<f32>, params:NoiseParams) -> f32 {
    // reuse generateRidge and negate its result
    return -generateRidge(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Ridged Multifractal Noise (Fast Lanczos) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateRidgedMultifractal(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var freqLoc : f32 = max(params.freq, 1e-6);

    var sum : f32 = 1.0 - abs(lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)));
    var amp : f32 = 1.0;

    for (var i:u32 = 1u; i < params.octaves; i = i + 1u) {
        freqLoc = freqLoc * params.lacunarity;
        amp = amp * params.gain;

        var n : f32 = abs(lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)));
        if (params.exp2 != 0.0) {
            n = 1.0 - pow(n, params.exp2);
        }
        if (params.exp1 != 0.0) {
            n = pow(n, params.exp1);
        }

        sum = sum - n * amp;

        x = x + params.xShift;
        y = y + params.yShift;
        z = z + params.zShift;
    }

    return sum;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Ridged Multifractal Noise 2 (Fast Lanczos + Rotation) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateRidgedMultifractal2(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var x = (pos.x + params.xShift) / zoom;
    var y = (pos.y + params.yShift) / zoom;
    var z = (pos.z + params.zShift) / zoom;

    var freqLoc : f32 = max(params.freq, 1e-6);
    var sum : f32 = 1.0 - abs(lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)));
    var amp : f32 = 1.0;
    var angle : f32 = params.seedAngle;

    for (var i:u32 = 1u; i < params.octaves; i = i + 1u) {
        freqLoc = freqLoc * params.lacunarity;
        amp = amp * params.gain;

        var n : f32 = abs(lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)));
        if (params.exp2 != 0.0) {
            n = 1.0 - pow(n, params.exp2);
        }
        if (params.exp1 != 0.0) {
            n = pow(n, params.exp1);
        }

        sum = sum - n * amp;

        let c = cos(angle);
        let s = sin(angle);
        let nx = x * c - y * s;
        let ny = x * s + y * c;
        let nz = z;

        x = nx + params.xShift;
        y = ny + params.yShift;
        z = nz + params.zShift;

        angle = angle + ANGLE_INCREMENT;
    }

    return sum;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Ridged Multifractal Noise 3 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateRidgedMultifractal3(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var x = (pos.x + params.xShift) / zoom;
    var y = (pos.y + params.yShift) / zoom;
    var z = (pos.z + params.zShift) / zoom;
    var sum : f32 = 0.0;
    var amp : f32 = 1.0;
    var freqLoc : f32 = max(params.freq, 1e-6);

    for (var i:u32 = 0u; i < params.octaves; i = i + 1u) {
        var n : f32 = lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc));
        n = max(1e-7, n + 1.0);
        n = 2.0 * pow(n * 0.5, params.exp2 + 1.5) - 1.0;
        n = 1.0 - abs(n);
        if (params.exp1 - 1.0 != 0.0) {
            n = 1.0 - pow(n, params.exp1 - 1.0);
        }

        sum = sum + n * amp;

        freqLoc = freqLoc * params.lacunarity;
        x = x + params.xShift;
        y = y + params.yShift;
        z = z + params.zShift;
        amp = amp * params.gain;
    }

    return sum - 1.0;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Ridged Multifractal Noise 4 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateRidgedMultifractal4(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);

    var x = (pos.x + params.xShift) / zoom;
    var y = (pos.y + params.yShift) / zoom;
    var z = (pos.z + params.zShift) / zoom;
    var sum : f32 = 0.0;
    var amp : f32 = 1.0;
    var freqLoc : f32 = max(params.freq, 1e-6);

    for (var i:u32 = 0u; i < params.octaves; i = i + 1u) {
        var n : f32 = abs(lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)));
        if (params.exp2 != 0.0) {
            n = 1.0 - pow(n, params.exp2);
        }
        if (params.exp1 != 0.0) {
            n = pow(n, params.exp1);
        }

        sum = sum + n * amp;

        freqLoc = freqLoc * params.lacunarity;
        x = x + params.xShift;
        y = y + params.yShift;
        z = z + params.zShift;
        amp = amp * params.gain;
    }

    return 1.0 - sum;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti\u2010Ridged Multifractal Noise \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateAntiRidgedMultifractal(pos : vec3<f32>, params:NoiseParams) -> f32 {
    return -generateRidgedMultifractal(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti\u2010Ridged Multifractal Noise 2 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateAntiRidgedMultifractal2(pos : vec3<f32>, params:NoiseParams) -> f32 {
    return -generateRidgedMultifractal2(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti\u2010Ridged Multifractal Noise 3 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateAntiRidgedMultifractal3(pos : vec3<f32>, params:NoiseParams) -> f32 {
    return -generateRidgedMultifractal3(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Anti\u2010Ridged Multifractal Noise 4 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateAntiRidgedMultifractal4(pos : vec3<f32>, params:NoiseParams) -> f32 {
    return -generateRidgedMultifractal4(pos, params);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Fractal Brownian Motion (3D Simplex) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// 3-D FBM helper: sums octaves of simplex noise with rotating shifts
fn fbm3D(pos : vec3<f32>, params:NoiseParams) -> f32 {
    // apply zoom
    var x       = (pos.x + params.xShift) / params.zoom;
    var y       = (pos.y + params.yShift) / params.zoom;
    var z       = (pos.z + params.zShift) / params.zoom;
    var sum       : f32 = 0.0;
    var amplitude : f32 = 1.0;
    var maxValue  : f32 = 0.0;
    var freqLoc   : f32 = max(params.freq, 1e-6);
    // start angle from uniform seedAngle
    var angle     : f32 = params.seedAngle;
    let angleInc  : f32 = 2.0 * PI / f32(params.octaves);

    for (var i : u32 = 0u; i < params.octaves; i = i + 1u) {
        // accumulate weighted noise
        sum = sum + amplitude * simplex3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc));
        maxValue = maxValue + amplitude;

        // next freq & amp
        freqLoc   = freqLoc * params.lacunarity;
        amplitude = amplitude * params.gain;

        // advance rotation
        angle = angle + angleInc;
        let offX = params.xShift * cos(angle);
        let offY = params.yShift * cos(angle);
        let offZ = params.zShift * cos(angle);

        // apply shift
        x = x + offX;
        y = y + offY;
        z = z + offZ;
    }
    // normalize
    return sum / maxValue;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 FBM Generator #1 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// two\u2010stage fbm, then doubled
fn generateFBM(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let fbm1 = fbm3D(pos, params);
    let fbm2 = fbm3D(vec3<f32>(fbm1, fbm1, fbm1), params);
    return 2.0 * fbm2;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 FBM Generator #2 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// chained fbm with scaling by zoom
fn generateFBM2(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let fbm1 = fbm3D(pos, params);
    let s    = params.zoom;
    let fbm2 = fbm3D(vec3<f32>(fbm1 * s, fbm1 * s, fbm1 * s), params);
    let fbm3 = fbm3D(vec3<f32>(pos.x + fbm2 * s,
                               pos.y + fbm2 * s,
                               pos.z + fbm2 * s), params);
    return 2.0 * fbm3;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 FBM Generator #3 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// three\u2010step chaining of fbm with offset
fn generateFBM3(pos : vec3<f32>, params:NoiseParams) -> f32 {
    let fbm1 = fbm3D(pos, params);
    let s    = params.zoom;
    let fbm2 = fbm3D(vec3<f32>(pos.x + fbm1 * s,
                               pos.y + fbm1 * s,
                               pos.z + fbm1 * s), params);
    let fbm3 = fbm3D(vec3<f32>(pos.x + fbm2 * s,
                               pos.y + fbm2 * s,
                               pos.z + fbm2 * s), params);
    return 2.0 * fbm3;
}

/*==============================================================================
  Cellular Brownian-Motion FBM helpers & generators
==============================================================================*/

fn edgeCut(val: f32, threshold: f32) -> f32 {
  // return 0.0 when val < threshold, otherwise return val
  return select(val, 0.0, val < threshold);
}

// 3-D Cellular FBM helper: sums octaves of cellular3D with rotating shifts
fn fbmCellular3D(pos : vec3<f32>, params : NoiseParams) -> f32 {
    var x = (pos.x + params.xShift) / params.zoom;
    var y = (pos.y + params.yShift) / params.zoom;
    var z = (pos.z + params.zShift) / params.zoom;

    var sum     : f32 = 0.0;
    var amp     : f32 = 1.0;
    var freqLoc : f32 = max(params.freq, 1e-6);

    var angle   : f32 = params.seedAngle;
    let angleInc: f32 = 2.0 * PI / f32(params.octaves);

    for (var i : u32 = 0u; i < params.octaves; i = i + 1u) {
        let n = edgeCut(cellular3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc)),
                        params.threshold);
        sum = sum + amp * n;

        freqLoc = freqLoc * params.lacunarity;
        amp     = amp     * params.gain;

        angle = angle + angleInc;
        let offX = params.xShift * cos(angle);
        let offY = params.yShift * cos(angle);
        let offZ = params.zShift * cos(angle);

        x = x + offX;
        y = y + offY;
        z = z + offZ;
    }
    return sum;
}

/* ---- Three cellular FBM flavours ---------------------------------------- */
fn generateCellularBM1(pos : vec3<f32>, params : NoiseParams) -> f32 {
    let f1 = fbmCellular3D(pos, params);
    let f2 = fbmCellular3D(vec3<f32>(f1 * params.zoom), params);
    return 1.5 * f2 - 1.0;
}

fn generateCellularBM2(pos : vec3<f32>, params : NoiseParams) -> f32 {
    let f1 = fbmCellular3D(pos, params);
    let f2 = fbmCellular3D(vec3<f32>(f1 * params.zoom), params);
    let f3 = fbmCellular3D(vec3<f32>(pos + f2 * params.zoom), params);
    return 1.5 * f3 - 1.0;
}

fn generateCellularBM3(pos : vec3<f32>, params : NoiseParams) -> f32 {
    let f1 = fbmCellular3D(pos, params);
    let f2 = fbmCellular3D(vec3<f32>(pos + f1 * params.zoom), params);
    let f3 = fbmCellular3D(vec3<f32>(pos + f2 * params.zoom), params);
    return 1.5 * f3 - 1.0;
}

/* ---- Voronoi and Voronoi Brownian-Motion flavours ---------------------------------- */

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D Voronoi Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateVoronoi4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var sum: f32 = 0.0;
  var amp: f32 = 1.0;
  var freqLoc: f32 = max(params.freq, 1e-6);

  let mode: u32 = params.voroMode;
  let edgeK: f32 = max(params.edgeK, 0.0);
  let threshold: f32 = max(params.threshold, 0.0);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z + params.time);
  } else {
    base = vec4<f32>(
      (pos.x + params.xShift) / zoom,
      (pos.y + params.yShift) / zoom,
      (pos.z + params.zShift) / zoom,
      params.time
    );
  }

  var angle: f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let P = base * freqLoc;
    let m = voro4D_metrics(P);
    let v = voro_eval(m.f1Sq, m.f2Sq, m.cellVal, mode, edgeK, threshold, freqLoc);

    sum += v * amp;

    freqLoc *= params.lacunarity;
    amp *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let s = sin(angle);
      let xy = vec2<f32>(base.x * c - base.y * s, base.x * s + base.y * c);
      let zw = vec2<f32>(base.z * c - base.w * s, base.z * s + base.w * c);
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  return sum;
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Voronoi Tile Noise (Edge-Aware) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateVoronoiTileNoise(pos : vec3<f32>, params:NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);
  var sum   : f32 = 0.0;
  var amp   : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);

  let mode : u32 = params.voroMode;
  let edgeK : f32 = max(params.edgeK, 0.0);
  let thresh : f32 = max(params.threshold, 0.0);

  var x = (pos.x + params.xShift) / zoom;
  var y = (pos.y + params.yShift) / zoom;
  var z = (pos.z + params.zShift) / zoom;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let P = vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc);
    let m = voro3D_metrics(P);
    let v = voro_eval(m.f1Sq, m.f2Sq, m.cellVal, mode, edgeK, thresh, freqLoc);

    sum = sum + v * amp;

    freqLoc = freqLoc * params.lacunarity;
    amp     = amp * params.gain;

    x = x + params.xShift;
    y = y + params.yShift;
    z = z + params.zShift;
  }

  return sum;
}


// BM1: f( f(p) )
fn generateVoronoiBM1(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoiTileNoise(p, par);
  return generateVoronoiTileNoise(vec3<f32>(f1 * par.zoom), par);
}

// BM2: f( p + f(f(p)) )
fn generateVoronoiBM2(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoiTileNoise(p, par);
  let f2 = generateVoronoiTileNoise(vec3<f32>(f1 * par.zoom), par);
  return generateVoronoiTileNoise(p + vec3<f32>(f2 * par.zoom), par);
}

// BM3: f( p + f(p + f(p)) )
fn generateVoronoiBM3(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoiTileNoise(p, par);
  let f2 = generateVoronoiTileNoise(p + vec3<f32>(f1 * par.zoom), par);
  return generateVoronoiTileNoise(p + vec3<f32>(f2 * par.zoom), par);
}

/* ---- Voronoi Brownian-Motion flavours (4D) ---------------------------------- */

// BM1 4D: f( f(p) )  (scalar feedback into XYZ, keep W/time from params)
fn generateVoronoiBM1_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoi4D(p, par);
  return generateVoronoi4D(vec3<f32>(f1 * par.zoom), par);
}

// BM2 4D: f( p + f(f(p)) )
fn generateVoronoiBM2_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoi4D(p, par);
  let f2 = generateVoronoi4D(vec3<f32>(f1 * par.zoom), par);
  return generateVoronoi4D(p + vec3<f32>(f2 * par.zoom), par);
}

// BM3 4D: f( p + f(p + f(p)) )
fn generateVoronoiBM3_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateVoronoi4D(p, par);
  let f2 = generateVoronoi4D(p + vec3<f32>(f1 * par.zoom), par);
  return generateVoronoi4D(p + vec3<f32>(f2 * par.zoom), par);
}

/* ---- vector-feedback variants (stronger, less axis-locked) ---------
   These keep it cheap but reduce the "all axes get same scalar" look by building
   a 3-vector from 3 decorrelated samples (offsets are constant, no extra params).
*/

fn _bm4D_vec(p: vec3<f32>, par: NoiseParams) -> vec3<f32> {
  let a = generateVoronoi4D(p + vec3<f32>(17.13,  3.71,  9.23), par);
  let b = generateVoronoi4D(p + vec3<f32>(-5.41, 11.19,  2.07), par);
  let c = generateVoronoi4D(p + vec3<f32>( 8.09, -6.77, 13.61), par);
  return vec3<f32>(a, b, c);
}

// BM1 4D (vec): f( vec(f(p)) )
fn generateVoronoiBM1_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec(p, par);
  return generateVoronoi4D(v1 * par.zoom, par);
}

// BM2 4D (vec): f( p + vec(f(vec(f(p)))) )
fn generateVoronoiBM2_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec(p, par);
  let v2 = _bm4D_vec(v1 * par.zoom, par);
  return generateVoronoi4D(p + v2 * par.zoom, par);
}

// BM3 4D (vec): f( p + vec(f(p + vec(f(p)))) )
fn generateVoronoiBM3_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec(p, par);
  let v2 = _bm4D_vec(p + v1 * par.zoom, par);
  return generateVoronoi4D(p + v2 * par.zoom, par);
}

// Generic "Voronoi-style" sampler for Cellular/Worley so they can share voro_eval modes.

struct VoroSample {
  f1Sq    : f32,
  f2Sq    : f32,
  cellVal : f32,
};

fn voro_sample3D(p: vec3<f32>) -> VoroSample {
  let fx = i32(floor(p.x));
  let fy = i32(floor(p.y));
  let fz = i32(floor(p.z));

  var d1: f32 = 1e9;
  var d2: f32 = 1e9;
  var cv: f32 = 0.0;

  for (var dz: i32 = -1; dz <= 1; dz = dz + 1) {
    for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
      for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
        let xi = fx + dx;
        let yi = fy + dy;
        let zi = fz + dz;

        let rx = rand3u(xi, yi, zi);
        let ry = rand3u(yi, zi, xi);
        let rz = rand3u(zi, xi, yi);

        let px = f32(xi) + rx;
        let py = f32(yi) + ry;
        let pz = f32(zi) + rz;

        let dxv = px - p.x;
        let dyv = py - p.y;
        let dzv = pz - p.z;
        let dd  = dxv * dxv + dyv * dyv + dzv * dzv;

        if (dd < d1) {
          d2 = d1;
          d1 = dd;
          cv = rand3u(xi, zi, yi);
        } else if (dd < d2) {
          d2 = dd;
        }
      }
    }
  }

  return VoroSample(d1, d2, cv);
}

fn voro_sample4D(p: vec4<f32>) -> VoroSample {
  let fx = i32(floor(p.x));
  let fy = i32(floor(p.y));
  let fz = i32(floor(p.z));
  let fw = i32(floor(p.w));

  var d1: f32 = 1e9;
  var d2: f32 = 1e9;
  var cv: f32 = 0.0;

  for (var dw: i32 = -1; dw <= 1; dw = dw + 1) {
    for (var dz: i32 = -1; dz <= 1; dz = dz + 1) {
      for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
        for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
          let xi = fx + dx;
          let yi = fy + dy;
          let zi = fz + dz;
          let wi = fw + dw;

          let rx = rand4u(xi, yi, zi, wi);
          let ry = rand4u(yi, zi, wi, xi);
          let rz = rand4u(zi, wi, xi, yi);
          let rw = rand4u(wi, xi, yi, zi);

          let px = f32(xi) + rx;
          let py = f32(yi) + ry;
          let pz = f32(zi) + rz;
          let pw = f32(wi) + rw;

          let dxv = px - p.x;
          let dyv = py - p.y;
          let dzv = pz - p.z;
          let dwv = pw - p.w;
          let dd  = dxv * dxv + dyv * dyv + dzv * dzv + dwv * dwv;

          if (dd < d1) {
            d2 = d1;
            d1 = dd;
            cv = rand4u(xi, zi, yi, wi);
          } else if (dd < d2) {
            d2 = dd;
          }
        }
      }
    }
  }

  return VoroSample(d1, d2, cv);
}

fn cellular4D(p: vec4<f32>) -> f32 {
  let s = voro_sample4D(p);
  return voro_edge_dist(s.f1Sq, s.f2Sq);
}

fn worley4D(p: vec4<f32>) -> f32 {
  let s = voro_sample4D(p);
  return sqrt(max(s.f1Sq, 0.0));
}

// Expects you to pass the same controls you use for Voronoi: params.voroMode, params.edgeK, params.threshold.
fn generateCellular(pos: vec3<f32>, params: NoiseParams) -> f32 {
  var x = (pos.x + params.xShift) / params.zoom;
  var y = (pos.y + params.yShift) / params.zoom;
  var z = (pos.z + params.zShift) / params.zoom;

  var sum     : f32 = 0.0;
  var amp     : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle   : f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let s = voro_sample3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc));

    var n = voro_eval(s.f1Sq, s.f2Sq, s.cellVal, params.voroMode, params.edgeK, params.threshold, freqLoc);
    if (params.turbulence == 1u) { n = abs(n); }
    n = clamp(n, 0.0, 1.0);

    sum = sum + n * amp;

    freqLoc = freqLoc * params.lacunarity;
    amp     = amp     * params.gain;

    let c = cos(angle);
    let sA = sin(angle);
    let nx = x * c - y * sA;
    let ny = x * sA + y * c;
    let nz = y * sA + z * c;

    x = nx + params.xShift;
    y = ny + params.yShift;
    z = nz + params.zShift;
    angle = angle + ANGLE_INCREMENT;
  }

  if (params.turbulence == 1u) { sum = sum - 1.0; }
  return 2.0 * sum - 1.0;
}

fn generateAntiCellular(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return -generateCellular(pos,params);
}

fn generateWorley(pos: vec3<f32>, params: NoiseParams) -> f32 {
  var x = (pos.x + params.xShift) / params.zoom;
  var y = (pos.y + params.yShift) / params.zoom;
  var z = (pos.z + params.zShift) / params.zoom;

  var sum     : f32 = 0.0;
  var amp     : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle   : f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let s = voro_sample3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc));

    var n = voro_eval(s.f1Sq, s.f2Sq, s.cellVal, params.voroMode, params.edgeK, params.threshold, freqLoc);
    if (params.turbulence == 1u) { n = abs(n); }
    n = clamp(n, 0.0, 1.0);

    sum = sum + n * amp;

    freqLoc = freqLoc * params.lacunarity;
    amp     = amp     * params.gain;

    let c = cos(angle);
    let sA = sin(angle);
    let nx = x * c - y * sA;
    let ny = x * sA + y * c;
    let nz = y * sA + z * c;

    x = nx + params.xShift;
    y = ny + params.yShift;
    z = nz + params.zShift;
    angle = angle + ANGLE_INCREMENT;
  }

  if (params.turbulence == 1u) { sum = sum - 1.0; }
  return sum - 1.0;
}

fn generateAntiWorley(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return -generateWorley(pos,params);
}

fn generateCellular4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z) / zoom;
  } else {
    base = vec4<f32>(
      pos.x / zoom + params.xShift,
      pos.y / zoom + params.yShift,
      pos.z / zoom + params.zShift,
      params.time
    );
  }

  var sum     : f32 = 0.0;
  var amp     : f32 = 1.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle   : f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let s = voro_sample4D(base * freqLoc);

    var v = voro_eval(s.f1Sq, s.f2Sq, s.cellVal, params.voroMode, params.edgeK, params.threshold, freqLoc);
    if (params.turbulence == 1u) { v = abs(v); }
    v = clamp(v, 0.0, 1.0);

    sum += v * amp;

    freqLoc *= params.lacunarity;
    amp     *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let sA = sin(angle);
      let xy = vec2<f32>( base.x * c - base.y * sA, base.x * sA + base.y * c );
      let zw = vec2<f32>( base.z * c - base.w * sA, base.z * sA + base.w * c );
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  if (params.turbulence == 1u) { sum -= 1.0; }
  return 2.0 * sum - 1.0;
}

fn generateAntiCellular4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return -generateCellular4D(pos,params);
}

fn generateWorley4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z) / zoom;
  } else {
    base = vec4<f32>(
      pos.x / zoom + params.xShift,
      pos.y / zoom + params.yShift,
      pos.z / zoom + params.zShift,
      params.time
    );
  }

  var sum    : f32 = 0.0;
  var amp    : f32 = 1.0;
  var ampSum : f32 = 0.0;
  var freqLoc : f32 = max(params.freq, 1e-6);
  var angle  : f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let s = voro_sample4D(base * freqLoc);

    var v = voro_eval(s.f1Sq, s.f2Sq, s.cellVal, params.voroMode, params.edgeK, params.threshold, freqLoc);
    if (params.turbulence == 1u) { v = abs(v); }
    v = clamp(v, 0.0, 1.0);

    sum    += v * amp;
    ampSum += amp;

    freqLoc *= params.lacunarity;
    amp     *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let sA = sin(angle);
      let xy = vec2<f32>( base.x * c - base.y * sA, base.x * sA + base.y * c );
      let zw = vec2<f32>( base.z * c - base.w * sA, base.z * sA + base.w * c );
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  let out = select(0.0, sum / ampSum, ampSum > 0.0);

  if (params.turbulence == 1u) { return clamp(out - 1.0, -1.0, 1.0); }
  return clamp(1.0 - out, 0.0, 1.0);
}

fn generateAntiWorley4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return 1-generateWorley4D(pos,params);
}

/* ---- Cellular Brownian-Motion flavours (4D) ---------------------------------- */

// BM1 4D: f( f(p) )
fn generateCellularBM1_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateCellular4D(p, par);
  return generateCellular4D(vec3<f32>(f1 * par.zoom), par);
}

// BM2 4D: f( p + f(f(p)) )
fn generateCellularBM2_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateCellular4D(p, par);
  let f2 = generateCellular4D(vec3<f32>(f1 * par.zoom), par);
  return generateCellular4D(p + vec3<f32>(f2 * par.zoom), par);
}

// BM3 4D: f( p + f(p + f(p)) )
fn generateCellularBM3_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateCellular4D(p, par);
  let f2 = generateCellular4D(p + vec3<f32>(f1 * par.zoom), par);
  return generateCellular4D(p + vec3<f32>(f2 * par.zoom), par);
}


/* ---- Worley Brownian-Motion flavours (4D) ----------------------------------- */

// BM1 4D: f( f(p) )
fn generateWorleyBM1_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateWorley4D(p, par);
  return generateWorley4D(vec3<f32>(f1 * par.zoom), par);
}

// BM2 4D: f( p + f(f(p)) )
fn generateWorleyBM2_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateWorley4D(p, par);
  let f2 = generateWorley4D(vec3<f32>(f1 * par.zoom), par);
  return generateWorley4D(p + vec3<f32>(f2 * par.zoom), par);
}

// BM3 4D: f( p + f(p + f(p)) )
fn generateWorleyBM3_4D(p: vec3<f32>, par: NoiseParams) -> f32 {
  let f1 = generateWorley4D(p, par);
  let f2 = generateWorley4D(p + vec3<f32>(f1 * par.zoom), par);
  return generateWorley4D(p + vec3<f32>(f2 * par.zoom), par);
}


/* ---- vector-feedback variants (stronger, less axis-locked) ------------------ */

fn _bm4D_vec_cellular(p: vec3<f32>, par: NoiseParams) -> vec3<f32> {
  let a = generateCellular4D(p + vec3<f32>(17.13,  3.71,  9.23), par);
  let b = generateCellular4D(p + vec3<f32>(-5.41, 11.19,  2.07), par);
  let c = generateCellular4D(p + vec3<f32>( 8.09, -6.77, 13.61), par);
  return vec3<f32>(a, b, c);
}

fn _bm4D_vec_worley(p: vec3<f32>, par: NoiseParams) -> vec3<f32> {
  let a = generateWorley4D(p + vec3<f32>(17.13,  3.71,  9.23), par);
  let b = generateWorley4D(p + vec3<f32>(-5.41, 11.19,  2.07), par);
  let c = generateWorley4D(p + vec3<f32>( 8.09, -6.77, 13.61), par);
  return vec3<f32>(a, b, c);
}


// BM1 4D (vec): f( vec(f(p)) )
fn generateCellularBM1_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_cellular(p, par);
  return generateCellular4D(v1 * par.zoom, par);
}

// BM2 4D (vec): f( p + vec(f(vec(f(p)))) )
fn generateCellularBM2_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_cellular(p, par);
  let v2 = _bm4D_vec_cellular(v1 * par.zoom, par);
  return generateCellular4D(p + v2 * par.zoom, par);
}

// BM3 4D (vec): f( p + vec(f(p + vec(f(p)))) )
fn generateCellularBM3_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_cellular(p, par);
  let v2 = _bm4D_vec_cellular(p + v1 * par.zoom, par);
  return generateCellular4D(p + v2 * par.zoom, par);
}


// BM1 4D (vec): f( vec(f(p)) )
fn generateWorleyBM1_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_worley(p, par);
  return generateWorley4D(v1 * par.zoom, par);
}

// BM2 4D (vec): f( p + vec(f(vec(f(p)))) )
fn generateWorleyBM2_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_worley(p, par);
  let v2 = _bm4D_vec_worley(v1 * par.zoom, par);
  return generateWorley4D(p + v2 * par.zoom, par);
}

// BM3 4D (vec): f( p + vec(f(p + vec(f(p)))) )
fn generateWorleyBM3_4D_vec(p: vec3<f32>, par: NoiseParams) -> f32 {
  let v1 = _bm4D_vec_worley(p, par);
  let v2 = _bm4D_vec_worley(p + v1 * par.zoom, par);
  return generateWorley4D(p + v2 * par.zoom, par);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D Billow Noise Generator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateBillow4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z + params.time) / zoom;
  } else {
    base = vec4<f32>(
      pos.x / zoom + params.xShift,
      pos.y / zoom + params.yShift,
      pos.z / zoom + params.zShift,
      params.time
    );
  }

  var sum: f32 = 0.0;
  var amp: f32 = 1.0;
  var freqLoc: f32 = max(params.freq, 1e-6);
  var ampSum: f32 = 0.0;
  var angle: f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let n = noise4D(base * freqLoc);
    let b = pow(abs(n), 0.75);
    sum += b * amp;
    ampSum += amp;

    freqLoc *= params.lacunarity;
    amp *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let s = sin(angle);
      let xy = vec2<f32>(base.x * c - base.y * s, base.x * s + base.y * c);
      let zw = vec2<f32>(base.z * c - base.w * s, base.z * s + base.w * c);
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  if (ampSum > 0.0) { sum /= ampSum; }

  let k: f32 = 1.2;
  let cMid = sum - 0.5;
  let shaped = 0.5 + cMid * k / (1.0 + abs(cMid) * (k - 1.0));

  return clamp(shaped, 0.0, 1.0);
}

fn generateAntiBillow4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return 1.0 - generateBillow4D(pos, params);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D Terrace + Foam + Turbulence \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateTerraceNoise4D(pos: vec3<f32>, par: NoiseParams) -> f32 {
  let base = generatePerlin4D(pos, par);
  return terrace(base, par.terraceStep);
}

fn generateFoamNoise4D(pos: vec3<f32>, par: NoiseParams) -> f32 {
  let base = generateBillow4D(pos, par);
  return foamify(base);
}

fn generateTurbulence4D(pos: vec3<f32>, par: NoiseParams) -> f32 {
  let base = generatePerlin4D(pos, par);
  return turbulence(base);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D "Lanczos-like" Lowpass \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn lowpass4D(p: vec4<f32>) -> f32 {
  let o = vec4<f32>(0.37, 0.21, 0.29, 0.31);
  let a = noise4D(p);
  let b = noise4D(p + vec4<f32>(o.x, 0.0, 0.0, 0.0));
  let c = noise4D(p + vec4<f32>(0.0, o.y, 0.0, 0.0));
  let d = noise4D(p + vec4<f32>(0.0, 0.0, o.z, 0.0));
  let e = noise4D(p + vec4<f32>(0.0, 0.0, 0.0, o.w));
  return (a + b + c + d + e) * 0.2;
}

fn generateLanczosBillow4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  var base: vec4<f32>;
  if (params.toroidal == 1u) {
    base = packPeriodicUV(pos.x, pos.y, pos.z + params.time) / zoom;
  } else {
    base = vec4<f32>(
      pos.x / zoom + params.xShift,
      pos.y / zoom + params.yShift,
      pos.z / zoom + params.zShift,
      params.time
    );
  }

  var sum: f32 = 0.0;
  var amp: f32 = 1.0;
  var ampSum: f32 = 0.0;
  var freqLoc: f32 = max(params.freq, 1e-6);
  var angle: f32 = params.seedAngle;

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    let n = lowpass4D(base * freqLoc);
    let b = pow(abs(n), 0.75);
    sum += b * amp;
    ampSum += amp;

    freqLoc *= params.lacunarity;
    amp *= params.gain;

    if (params.toroidal != 1u) {
      let c = cos(angle);
      let s = sin(angle);
      let xy = vec2<f32>(base.x * c - base.y * s, base.x * s + base.y * c);
      let zw = vec2<f32>(base.z * c - base.w * s, base.z * s + base.w * c);
      base = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
      angle += ANGLE_INCREMENT;
    }
  }

  if (ampSum > 0.0) { sum /= ampSum; }

  let k: f32 = 1.2;
  let cMid = sum - 0.5;
  let shaped = 0.5 + cMid * k / (1.0 + abs(cMid) * (k - 1.0));

  return clamp(shaped, 0.0, 1.0);
}

fn generateLanczosAntiBillow4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  return 1.0 - generateLanczosBillow4D(pos, params);
}



// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 4D FBM core + generators \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn fbm4D_core(base: vec4<f32>, params: NoiseParams) -> f32 {
  var p = base;

  var sum: f32 = 0.0;
  var amp: f32 = 1.0;
  var maxAmp: f32 = 0.0;
  var freqLoc: f32 = max(params.freq, 1e-6);

  var angle: f32 = params.seedAngle;
  let angleInc: f32 = 2.0 * PI / max(f32(params.octaves), 1.0);

  for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
    sum += amp * noise4D(p * freqLoc);
    maxAmp += amp;

    freqLoc *= params.lacunarity;
    amp *= params.gain;

    if (params.toroidal != 1u) {
      angle += angleInc;
      let c = cos(angle);
      let s = sin(angle);
      let xy = vec2<f32>(p.x * c - p.y * s, p.x * s + p.y * c);
      let zw = vec2<f32>(p.z * c - p.w * s, p.z * s + p.w * c);
      p = vec4<f32>(
        xy.x + params.xShift,
        xy.y + params.yShift,
        zw.x + params.zShift,
        zw.y + params.time
      );
    }
  }

  return select(0.0, sum / maxAmp, maxAmp > 0.0);
}

fn fbm4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let zoom = max(params.zoom, 1e-6);

  if (params.toroidal == 1u) {
    let base = packPeriodicUV(pos.x, pos.y, pos.z + params.time) / zoom;
    return fbm4D_core(base, params);
  }

  let base = vec4<f32>(
    (pos.x + params.xShift) / zoom,
    (pos.y + params.yShift) / zoom,
    (pos.z + params.zShift) / zoom,
    params.time
  );
  return fbm4D_core(base, params);
}

fn generateFBM4D(pos: vec3<f32>, params: NoiseParams) -> f32 {
  let fbm1 = fbm4D(pos, params);
  let fbm2 = fbm4D_core(vec4<f32>(fbm1, fbm1, fbm1, fbm1), params);
  return 2.0 * fbm2;
}


/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  Domain-warp FBM (4D)  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/

fn domainWarpFBM4D(p: vec3<f32>, params: NoiseParams, warpAmp: f32, stages: u32) -> f32 {
  var q = p;
  for (var i: u32 = 0u; i < stages; i = i + 1u) {
    let w = fbm4D(q, params) * warpAmp;
    q = q + vec3<f32>(w, w, w);
  }
  return fbm4D(q, params);
}

fn generateDomainWarpFBM1_4D(pos: vec3<f32>, par: NoiseParams) -> f32 {
  return domainWarpFBM4D(pos, par, par.warpAmp, 1u);
}

fn generateDomainWarpFBM2_4D(pos: vec3<f32>, par: NoiseParams) -> f32 {
  return domainWarpFBM4D(pos, par, par.warpAmp, 2u);
}

fn _warpVecFrom4D(p: vec3<f32>, par: NoiseParams) -> vec3<f32> {
  let a = fbm4D(p + vec3<f32>(17.13,  3.71,  9.23), par);
  let b = fbm4D(p + vec3<f32>(-5.41, 11.19,  2.07), par);
  let c = fbm4D(p + vec3<f32>( 8.09, -6.77, 13.61), par);
  return vec3<f32>(a, b, c);
}

fn domainWarpFBM4D_vec(p: vec3<f32>, params: NoiseParams, warpAmp: f32, stages: u32) -> f32 {
  var q = p;
  for (var i: u32 = 0u; i < stages; i = i + 1u) {
    let v = _warpVecFrom4D(q, params) * warpAmp;
    q = q + v;
  }
  return fbm4D(q, params);
}

fn generateDomainWarpFBM1_4D_vec(pos: vec3<f32>, par: NoiseParams) -> f32 {
  return domainWarpFBM4D_vec(pos, par, par.warpAmp, 1u);
}

fn generateDomainWarpFBM2_4D_vec(pos: vec3<f32>, par: NoiseParams) -> f32 {
  return domainWarpFBM4D_vec(pos, par, par.warpAmp, 2u);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Lanczos Billow Noise \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateLanczosBillow(pos : vec3<f32>, p : NoiseParams) -> f32 {
    var x       = (pos.x + p.xShift) / p.zoom;
    var y       = (pos.y + p.yShift) / p.zoom;
    var z       = (pos.z + p.zShift) / p.zoom;
    var sum     : f32 = 0.0;
    var maxAmp  : f32 = 0.0;
    var amp     : f32 = 1.0;
    var freqLoc : f32 = max(p.freq, 1e-6);
    var angle   : f32 = p.seedAngle;

    for (var i: u32 = 0u; i < p.octaves; i = i + 1u) {
        let n = lanczos3D(vec3<f32>(x * freqLoc, y * freqLoc, z * freqLoc));
        sum = sum + (2.0 * abs(n) - 1.0) * amp;
        maxAmp = maxAmp + amp;

        freqLoc = freqLoc * p.lacunarity;
        amp     = amp     * p.gain;

        // rotation around Z
        let c = cos(angle);
        let s = sin(angle);
        var newX = x * c - y * s;
        var newY = x * s + y * c;
        var newZ = z;

        // rotate in XZ plane
        let rX = newX * c + newZ * s;
        let rZ = -newX * s + newZ * c;
        newX = rX; newZ = rZ;

        // rotate in YZ plane
        let rY = newY * c - newZ * s;
        let rZ2 = newY * s + newZ * c;
        newY = rY; newZ = rZ2;

        // apply shift
        x = newX + p.xShift;
        y = newY + p.yShift;
        z = newZ + p.zShift;

        angle = angle + ANGLE_INCREMENT;
    }

    return sum / maxAmp;
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Lanczos Anti-Billow Noise \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn generateLanczosAntiBillow(pos : vec3<f32>, p : NoiseParams) -> f32 {
    return -generateLanczosBillow(pos, p);
}


// Raw Voronoi circle\u2010gradient cell value
fn voronoiCircleGradient(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let m = voro3D_metrics(pos);
    let minDist = sqrt(max(m.f1Sq, 0.0));
    let secondDist = sqrt(max(m.f2Sq, 0.0));

    let centerGrad = 1.0 - min(minDist, 1.0);
    let edgeDist = max(secondDist - minDist, 0.0);
    let edgeGrad = select(1.0, 0.0, edgeDist < params.threshold);
    let modeValue = voro_eval3D_metrics(m, params, max(params.freq, 1e-6));
    return select(modeValue, edgeGrad, params.voroMode == VORO_CELL) * centerGrad;
}

// Octaved generator matching your JS .generateNoise()
fn generateVoronoiCircleNoise(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var x       = pos.x / zoom + params.xShift;
    var y       = pos.y / zoom + params.yShift;
    var z       = pos.z / zoom + params.zShift;
    var total : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        let samplePos = vec3<f32>(x * freq, y * freq, z * freq);
        total = total + voronoiCircleGradient(samplePos, params) * amp;

        // next octave
        amp  = amp  * params.gain;
        freq = freq * params.lacunarity;
        x    = x + params.xShift;
        y    = y + params.yShift;
        z    = z + params.zShift;
    }

    // match JS: return \u2211noise \u2212 1.0
    return total - 1.0;
}




// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 distance helpers (add once) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
fn euclideanDist(a: vec3<f32>, b: vec3<f32>) -> f32 {
  return length(a - b);
}
fn euclideanDistSq(a: vec3<f32>, b: vec3<f32>) -> f32 {
  let d = a - b;
  return dot(d, d);
}

fn euclideanDist2(a: vec2<f32>, b: vec2<f32>) -> f32 {
  return length(a - b);
}
fn euclideanDistSq2(a: vec2<f32>, b: vec2<f32>) -> f32 {
  let d = a - b;
  return dot(d, d);
}

fn euclideanDist4(a: vec4<f32>, b: vec4<f32>) -> f32 {
  return length(a - b);
}
fn euclideanDistSq4(a: vec4<f32>, b: vec4<f32>) -> f32 {
  let d = a - b;
  return dot(d, d);
}


// \u2500\u2500\u2500\u2500\u2500 1. Voronoi Circle\u2010Gradient Tile Noise 2 \u2500\u2500\u2500\u2500\u2500

fn voronoiCircleGradient2Raw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let m = voro3D_metrics(pos);
    let centerDist = sqrt(max(m.f1Sq, 0.0));
    let gradient = sin(centerDist * PI);
    let modeValue = voro_eval3D_metrics(m, params, max(params.freq, 1e-6));
    return select(modeValue, m.cellVal, params.voroMode == VORO_CELL) * gradient;
}

fn generateVoronoiCircle2(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var total : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);
    var angle     : f32 = params.seedAngle;
    let angleInc  : f32 = 2.0 * PI / max(f32(params.octaves), 1.0);

    for(var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        let samplePos = vec3<f32>(x * freq, y * freq, z * freq);
        total = total + voronoiCircleGradient2Raw(samplePos, params) * amp;
        amp   = amp * params.gain;
        freq  = freq * params.lacunarity;
        angle = angle + angleInc;
        x = x + params.xShift * cos(angle) + params.xShift;
        y = y + params.yShift * cos(angle) + params.yShift;
        z = z + params.zShift * cos(angle) + params.zShift;
    }
    return total - 1.0;
}

// \u2500\u2500\u2500\u2500\u2500 2. Voronoi Flat\u2010Shade Tile Noise \u2500\u2500\u2500\u2500\u2500

fn voronoiFlatShadeRaw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let fx : i32 = i32(floor(pos.x));
    let fy : i32 = i32(floor(pos.y));
    let fz : i32 = i32(floor(pos.z));
    var minDist    : f32 = 1e9;
    var secondDist : f32 = 1e9;

    for(var dz = -1; dz <= 1; dz = dz + 1) {
        for(var dy = -1; dy <= 1; dy = dy + 1) {
            for(var dx = -1; dx <= 1; dx = dx + 1) {
                let xi = fx + dx;
                let yi = fy + dy;
                let zi = fz + dz;
                let feature = vec3<f32>(f32(xi) + rand3u(xi, yi, zi),
                                        f32(yi) + rand3u(yi, zi, xi),
                                        f32(zi) + rand3u(zi, xi, yi));
                let d = euclideanDist(feature, pos);
                if(d < minDist) {
                    secondDist = minDist;
                    minDist    = d;
                } else if(d < secondDist) {
                    secondDist = d;
                }
            }
        }
    }
    let edgeDist = secondDist - minDist;
    return select(1.0, 0.0, edgeDist < params.threshold);
}

fn generateVoronoiFlatShade(posIn: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var pos = posIn / zoom + vec3<f32>(params.xShift, params.yShift, params.zShift);
    var total : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);
    for(var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        total = total + voronoiFlatShadeRaw(pos * freq, params) * amp;
        amp  = amp * params.gain;
        freq = freq * params.lacunarity;
        pos  = pos + vec3<f32>(params.xShift, params.yShift, params.zShift);
    }
    return total;
}

// \u2500\u2500\u2500\u2500\u2500 3. Voronoi Ripple 3D \u2500\u2500\u2500\u2500\u2500

fn voronoiRipple3DRaw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let m = voro3D_metrics(pos);
    let edgeDist = voro_edge_dist(m.f1Sq, m.f2Sq);
    let ripple = sin(PI + edgeDist * PI * params.rippleFreq + params.time);
    let rippleAmp = (1.0 + ripple) * 0.5;
    let modeValue = voro_eval3D_metrics(m, params, max(params.freq, 1e-6));
    return select(modeValue, m.cellVal, params.voroMode == VORO_CELL) * rippleAmp;
}

fn generateVoronoiRipple3D(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var total : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);
    for(var i: u32=0u; i<params.octaves; i=i+1u) {
        let sample = vec3<f32>(x * freq, y * freq, z * freq);
        total = total + voronoiRipple3DRaw(sample, params) * amp;
        amp   = amp * params.gain;
        freq  = freq * params.lacunarity;
        let angle = params.seedAngle * 2.0 * PI;
        x = x + params.xShift * cos(angle + f32(i));
        y = y + params.yShift * cos(angle + f32(i));
        z = z + params.zShift * cos(angle + f32(i));
    }
    return 2.0 * total - 1.0;
}


// \u2500\u2500\u2500\u2500\u2500 4. Voronoi Ripple 3D 2 \u2500\u2500\u2500\u2500\u2500
fn voronoiRipple3D2Raw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let m = voro3D_metrics(pos);
    let edgeDist = voro_edge_dist(m.f1Sq, m.f2Sq);
    let ripple = sin(PI + params.zoom * edgeDist * PI * params.rippleFreq + params.time);
    let rippleAmp = (1.0 + ripple) * 0.5;
    let modeValue = voro_eval3D_metrics(m, params, max(params.freq, 1e-6));
    return select(modeValue, m.cellVal, params.voroMode == VORO_CELL) * rippleAmp;
}

fn generateVoronoiRipple3D2(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var total: f32 = 0.0;
    var amp: f32 = 1.0;
    var freq: f32 = max(params.freq, 1e-6);

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        let sample = vec3<f32>(x * freq, y * freq, z * freq);
        total = total + voronoiRipple3D2Raw(sample, params) * amp;
        amp = amp * params.gain;
        freq = freq * params.lacunarity;
        let angle = params.seedAngle * 2.0 * PI;
        x = x + params.xShift * cos(angle + f32(i));
        y = y + params.yShift * cos(angle + f32(i));
        z = z + params.zShift * cos(angle + f32(i));
    }
    return 2.0 * total - 1.0;
}

// \u2500\u2500\u2500\u2500\u2500 5. Voronoi Circular Ripple 3D \u2500\u2500\u2500\u2500\u2500
fn voronoiCircularRippleRaw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let m = voro3D_metrics(pos);
    let minDist = sqrt(max(m.f1Sq, 0.0));
    let ripple = sin(PI + minDist * PI * params.rippleFreq + params.time);
    let rippleAmp = (1.0 + ripple) * 0.5;
    let modeValue = voro_eval3D_metrics(m, params, max(params.freq, 1e-6));
    return select(modeValue, m.cellVal, params.voroMode == VORO_CELL) * rippleAmp;
}

fn generateVoronoiCircularRipple(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var x = pos.x / zoom + params.xShift;
    var y = pos.y / zoom + params.yShift;
    var z = pos.z / zoom + params.zShift;
    var total: f32 = 0.0;
    var amp: f32 = 1.0;
    var freq: f32 = max(params.freq, 1e-6);

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        let sample = vec3<f32>(x * freq, y * freq, z * freq);
        total = total + voronoiCircularRippleRaw(sample, params) * amp;
        amp = amp * params.gain;
        freq = freq * params.lacunarity;
        let angle = params.seedAngle * 2.0 * PI;
        x = x + params.xShift * cos(angle + f32(i));
        y = y + params.yShift * cos(angle + f32(i));
        z = z + params.zShift * cos(angle + f32(i));
    }
    return 2.0 * total - 1.0;
}

// 6a. Fractal Voronoi Ripple 3D
fn generateFVoronoiRipple3D(posIn: vec3<f32>, params: NoiseParams) -> f32 {
    // first FBM pass
    let fbm1 = generateVoronoiRipple3D(posIn, params);

    // prepare second\u2010pass params: keep everything the same except zoom=1
    var p2 = params;
    p2.zoom = 1.0;

    // second FBM pass, feeding the scalar result back into xyz
    let sample = vec3<f32>(fbm1, fbm1, fbm1);
    let fbm2   = generateVoronoiRipple3D(sample, p2);

    return 2.0 * fbm2;
}

// 6b. Fractal Voronoi Circular Ripple 3D
fn generateFVoronoiCircularRipple(posIn: vec3<f32>, params: NoiseParams) -> f32 {
    // first FBM pass
    let fbm1 = generateVoronoiCircularRipple(posIn, params);

    // second\u2010pass with zoom=1
    var p2 = params;
    p2.zoom = 1.0;

    let sample = vec3<f32>(fbm1, fbm1, fbm1);
    let fbm2   = generateVoronoiCircularRipple(sample, p2);

    return 2.0 * fbm2;
}

// \u2014\u2014\u2014 continuousPermutation \u2014\u2014\u2014
fn continuousPermutation(value: f32) -> f32 {
    let iVal    = floor(value);
    let frac    = value - iVal;
    let i0      = i32(iVal);
    let idx1    = u32((i0 % 256 + 256) % 256);
    let idx2    = u32(((i0 + 1) % 256 + 256) % 256);
    let v1      = f32(perm(idx1));
    let v2      = f32(perm(idx2));
    return v1 + frac * (v2 - v1);
}

// \u2014\u2014\u2014 calculateRippleEffect \u2014\u2014\u2014
fn calculateRippleEffect(pos: vec3<f32>,
                         rippleFreq: f32,
                         neighborhoodSize: i32) -> f32 {
    var sum: f32 = 0.0;
    var count: f32 = 0.0;
    for (var dz = -neighborhoodSize; dz <= neighborhoodSize; dz = dz + 1) {
        for (var dy = -neighborhoodSize; dy <= neighborhoodSize; dy = dy + 1) {
            for (var dx = -neighborhoodSize; dx <= neighborhoodSize; dx = dx + 1) {
                let sample = vec3<f32>(
                    continuousPermutation(pos.x + f32(dx)),
                    continuousPermutation(pos.y + f32(dy)),
                    continuousPermutation(pos.z + f32(dz))
                );
                let d = length(sample - pos);
                sum = sum + sin(d * PI * rippleFreq);
                count = count + 1.0;
            }
        }
    }
    return sum / count;
}

// \u2014\u2014\u2014 generateRippleNoise \u2014\u2014\u2014
fn generateRippleNoise(pos: vec3<f32>, p: NoiseParams) -> f32 {
    let zoom = max(p.zoom, 1e-6);
    var x = pos.x / zoom + p.xShift;
    var y = pos.y / zoom + p.yShift;
    var z = pos.z / zoom + p.zShift;
    var sum: f32 = 0.0;
    var amp: f32 = 1.0;
    var freq: f32 = max(p.freq, 1e-6);
    var angle: f32 = p.seedAngle * 2.0 * PI;
    let angleInc = 2.0 * PI / max(f32(p.octaves), 1.0);
    let rippleFreqScaled = p.rippleFreq;
    let neigh = i32(p.exp1);

    for (var i: u32 = 0u; i < p.octaves; i = i + 1u) {
        var n = /* your base noise fn */ lanczos3D(vec3<f32>(x * freq, y * freq, z * freq)) * amp;
        if (p.turbulence == 1u) {
            n = abs(n);
        }
        let rip = calculateRippleEffect(vec3<f32>(x * freq, y * freq, z * freq),
                                        rippleFreqScaled,
                                        neigh);
        sum = sum + n * rip;

        freq   = freq * p.lacunarity;
        amp    = amp * p.gain;
        angle  = angle + angleInc;

        // simple phase offset; replace 0.0 with a hash if desired
        let phase: f32 = 0.0;
        x = x + p.xShift * cos(angle + phase);
        y = y + p.yShift * cos(angle + phase);
        z = z + p.zShift * cos(angle + phase);
    }

    if (p.turbulence == 1u) {
        sum = sum - 1.0;
    }
    return f32(p.octaves) * sum;
}

// \u2014\u2014\u2014 generateFractalRipples \u2014\u2014\u2014
fn generateFractalRipples(posIn: vec3<f32>, p: NoiseParams) -> f32 {
    // first pass at zoom scaled by exp2
    var p1 = p;
    p1.zoom = p.zoom * p.exp2+1.5;
    let fbm1 = generateRippleNoise(posIn, p1);

    // second pass feeding fbm1 back into xyz
    var p2 = p;
    let sample = vec3<f32>(fbm1, fbm1, fbm1);
    let fbm2   = generateRippleNoise(sample, p2);

    return 2.0 * fbm2;
}

// \u2014\u2014\u2014 1. HexWorms Raw \u2014\u2014\u2014
fn hexWormsRaw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let steps       : u32 = 5u;
    let persistence : f32 = 0.5;
    var total       : f32 = 0.0;
    var frequency   : f32 = 1.0;
    var amplitude   : f32 = 1.0;

    for (var i: u32 = 0u; i < steps; i = i + 1u) {
        // base cellular noise for direction
        let angle = generateCellular(pos * frequency, params) * 2.0 * PI;

        // step along the \u201Cworm\u201D
        let offset = vec3<f32>(
            cos(angle),
            sin(angle),
            sin(angle)
        ) * 0.5;
        let samplePos = pos + offset;

        // accumulate
        total = total + generateCellular(samplePos, params) * amplitude;

        amplitude = amplitude * persistence;
        frequency = frequency * 2.0;
    }

    // match JS: subtract 1 at the end
    return total - 1.0;
}

// \u2014\u2014\u2014 2. HexWorms Generator \u2014\u2014\u2014
fn generateHexWormsNoise(posIn: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var pos   = posIn / zoom + vec3<f32>(params.xShift, params.yShift, params.zShift);
    var sum   : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        sum = sum + hexWormsRaw(pos * freq, params) * amp;
        freq = freq * params.lacunarity;
        amp  = amp * params.gain;
        pos  = pos + vec3<f32>(params.xShift, params.yShift, params.zShift);
    }

    return sum;
}

// \u2014\u2014\u2014 3. PerlinWorms Raw \u2014\u2014\u2014
fn perlinWormsRaw(pos: vec3<f32>, params: NoiseParams) -> f32 {
    let steps       : u32 = 5u;
    let persistence : f32 = 0.5;
    var total       : f32 = 0.0;
    var frequency   : f32 = 1.0;
    var amplitude   : f32 = 1.0;

    for (var i: u32 = 0u; i < steps; i = i + 1u) {
        // base Perlin noise for direction
        let angle = generatePerlin(pos * frequency, params) * 2.0 * PI;

        // step along the \u201Cworm\u201D
        let offset = vec3<f32>(
            cos(angle),
            sin(angle),
            sin(angle)
        ) * 0.5;
        let samplePos = pos + offset;

        // accumulate
        total = total + generatePerlin(samplePos, params) * amplitude;

        amplitude = amplitude * persistence;
        frequency = frequency * 2.0;
    }

    return total;
}

// \u2014\u2014\u2014 PerlinWorms Generator \u2014\u2014\u2014
fn generatePerlinWormsNoise(posIn: vec3<f32>, params: NoiseParams) -> f32 {
    let zoom = max(params.zoom, 1e-6);
    var pos   = posIn / zoom + vec3<f32>(params.xShift, params.yShift, params.zShift);
    var sum   : f32 = 0.0;
    var amp   : f32 = 1.0;
    var freq  : f32 = max(params.freq, 1e-6);

    for (var i: u32 = 0u; i < params.octaves; i = i + 1u) {
        sum = sum + perlinWormsRaw(pos * freq, params) * amp;
        freq = freq * params.lacunarity;
        amp  = amp * params.gain;
        pos  = pos + vec3<f32>(params.xShift, params.yShift, params.zShift);
    }

    return sum;
}

// small helper: derive a few pseudorandom offsets from seed (u32)
fn seedOffsets(seed: u32) -> vec3<f32> {
  let s = f32(seed);
  let a = fract(sin(s * 12.9898) * 43758.5453);
  let b = fract(sin((s + 17.0) * 78.233) * 23421.631);
  let c = fract(sin((s + 31.0) * 37.719) * 97531.135);
  return vec3<f32>(a, b, c) * 0.5;
}

// safe tile sizes (u32) derived from Frame (avoid zero)
fn tileSizeX() -> u32 { return max(frame.tileWidth, 1u); }
fn tileSizeY() -> u32 { return max(frame.tileHeight, 1u); }
fn tileSizeZ() -> u32 { return max(frame.tileDepth, 1u); }

// --- helper: map pos -> integer pixel coords (uses frame uniform) ----------
// Returns wrapped pixel coords (periodic) so noise will tile across chunks.
fn posToPixelCoords_tiled(p : vec3<f32>) -> vec3<u32> {
  let fx = p.x * f32(frame.fullWidth);
  let fy = p.y * f32(frame.fullHeight);

  let ox_i : i32 = max(frame.originX, 0);
  let oy_i : i32 = max(frame.originY, 0);

  // integer pixel coords (unwrapped)
  let pxu : u32 = u32(floor(fx)) + u32(ox_i);
  let pyu : u32 = u32(floor(fy)) + u32(oy_i);

  let layer_i = max(frame.layerIndex, 0);
  let layer_u : u32 = u32(layer_i);

  // wrap coordinates into tile using modulo (cheap & correct for arbitrary tile sizes)
  let tx = tileSizeX();
  let ty = tileSizeY();
  let tz = tileSizeZ();
  let rx = pxu % tx;
  let ry = pyu % ty;
  let rz = layer_u % tz;

  return vec3<u32>(rx, ry, rz);
}

// --- deterministic integer hash that mixes seed (uses perm table) ---
// perm(...) implementation expected elsewhere (perm indexes 0..511)
fn hashed_with_seed(ix: u32, iy: u32, iz: u32, seed: u32) -> u32 {
  let a = perm((ix + seed * 1664525u) & 511u);
  let b = perm((a + (iy + seed * 22695477u)) & 511u);
  let c = perm((b + (iz + seed * 1103515245u)) & 511u);
  return c & 511u;
}
fn hashTo01_seeded(ix: u32, iy: u32, iz: u32, seed: u32) -> f32 {
  return f32(hashed_with_seed(ix, iy, iz, seed)) / 511.0;
}
fn hashToSigned01_seeded(ix: u32, iy: u32, iz: u32, seed: u32) -> f32 {
  return hashTo01_seeded(ix, iy, iz, seed) * 2.0 - 1.0;
}

// integer lattice helper consistent with the perm table, tiled by Frame sizes.
// p is continuous; freq and shifts control lattice alignment.
fn posToIntsForHash_tiled(p: vec3<f32>, freq: f32, sx: f32, sy: f32, sz: f32) -> vec3<u32> {
  let fx = floor(p.x * freq + sx);
  let fy = floor(p.y * freq + sy);
  let fz = floor(p.z * freq + sz);

  // cast and wrap to tile-size
  let tx = tileSizeX();
  let ty = tileSizeY();
  let tz = tileSizeZ();

  let ix = u32(fx) % tx;
  let iy = u32(fy) % ty;
  let iz = u32(fz) % tz;
  return vec3<u32>(ix, iy, iz);
}

// ---------------------- tiled value-noise 2D (smooth) ----------------------
// Uses posToIntsForHash_tiled internally => tiled/periodic by Frame tile sizes.
fn valueNoise2D_seeded(p : vec2<f32>, freq: f32, seed: u32, sx: f32, sy: f32) -> f32 {
  let f = max(freq, 1e-6);
  let fx = p.x * f + sx;
  let fy = p.y * f + sy;
  let ix_f = floor(fx);
  let iy_f = floor(fy);
  let txf = fx - ix_f;
  let tyf = fy - iy_f;

  // get tiled integer lattice coords (z = 0)
  let base = posToIntsForHash_tiled(vec3<f32>(ix_f, iy_f, 0.0), 1.0, 0.0, 0.0, 0.0);
  let ix = base.x;
  let iy = base.y;

  // neighbors (wrapped by tile in posToIntsForHash_tiled above)
  let ix1 = (ix + 1u) % tileSizeX();
  let iy1 = (iy + 1u) % tileSizeY();

  let h00 = hashToSigned01_seeded(ix,  iy,  0u, seed);
  let h10 = hashToSigned01_seeded(ix1, iy,  0u, seed);
  let h01 = hashToSigned01_seeded(ix,  iy1, 0u, seed);
  let h11 = hashToSigned01_seeded(ix1, iy1, 0u, seed);

  let sx_f = fade(txf);
  let sy_f = fade(tyf);
  let a = lerp(h00, h10, sx_f);
  let b = lerp(h01, h11, sx_f);
  return lerp(a, b, sy_f);
}

// ---------------------- White Noise (tiled, seeded, contrast/gain) ----
fn generateWhiteNoise(pos : vec3<f32>, params: NoiseParams) -> f32 {
  let seed : u32 = params.seed;

  // integer pixel coords (wrapped to tile)
  let ip = posToPixelCoords_tiled(pos);

  // subsampling (blocky) or per-pixel; safe cast
  let subs = max(u32(max(params.freq, 1.0)), 1u);
  let sx = (ip.x / subs) % tileSizeX();
  let sy = (ip.y / subs) % tileSizeY();
  let sz = ip.z % tileSizeZ();

  var v01 = hashTo01_seeded(sx, sy, sz, seed);

  // apply contrast around 0.5 via params.gain
  let contrast = 1.0 + params.gain;
  v01 = (v01 - 0.5) * contrast + 0.5;

  return clamp(v01, 0.0, 1.0);
}

fn wrapCoordOffset(base: u32, offset: i32, size: u32) -> u32 {
  let s = max(i32(size), 1);
  let v = ((i32(base) + offset) % s + s) % s;
  return u32(v);
}

fn blueNoiseLocalRank(ip: vec3<u32>, seed: u32, radius: i32) -> f32 {
  let center = hashTo01_seeded(ip.x, ip.y, ip.z, seed);
  var lower = 0.0;
  var total = 0.0;

  for (var dy: i32 = -radius; dy <= radius; dy = dy + 1) {
    for (var dx: i32 = -radius; dx <= radius; dx = dx + 1) {
      if (dx == 0 && dy == 0) {
        continue;
      }

      let sx = wrapCoordOffset(ip.x, dx, tileSizeX());
      let sy = wrapCoordOffset(ip.y, dy, tileSizeY());
      let n = hashTo01_seeded(sx, sy, ip.z, seed);
      lower += select(0.0, 1.0, n < center);
      total += 1.0;
    }
  }

  return (lower + center) / (total + 1.0);
}

// ---------------------- Blue Noise Generator (tiled, seeded) -------------
fn generateBlueNoise(pos : vec3<f32>, params: NoiseParams) -> f32 {
  let seed : u32 = params.seed;
  let ip0 = posToPixelCoords_tiled(pos);

  var ip = ip0;
  if (params.warpAmp > 0.0) {
    let jx = i32(round(hashToSigned01_seeded(ip0.x + 5u, ip0.y + 11u, ip0.z + 17u, seed) * params.warpAmp * 2.0));
    let jy = i32(round(hashToSigned01_seeded(ip0.x + 19u, ip0.y + 23u, ip0.z + 29u, seed) * params.warpAmp * 2.0));
    ip = vec3<u32>(
      wrapCoordOffset(ip0.x, jx, tileSizeX()),
      wrapCoordOffset(ip0.y, jy, tileSizeY()),
      ip0.z
    );
  }

  let rankSmall = blueNoiseLocalRank(ip, seed, 1);
  let rankLarge = blueNoiseLocalRank(ip, seed ^ 0x9E3779B9u, 2);
  var result = mix(rankLarge, rankSmall, 0.65);

  let micro = hashTo01_seeded(ip.x + 37u, ip.y + 61u, ip.z + 17u, seed ^ 0x85EBCA6Bu);
  result = clamp(result + (micro - 0.5) * (1.0 / 25.0), 0.0, 1.0);

  let contrast = max(1.0 + params.gain, 0.05);
  result = clamp((result - 0.5) * contrast + 0.5, 0.0, 1.0);
  return result;
}

const HYDRO_TAU : f32 = 6.283185307179586;

fn clamp01(x: f32) -> f32 {
  return clamp(x, 0.0, 1.0);
}

fn hydroHash2(p: vec2<f32>) -> vec2<f32> {
  let k = vec2<f32>(0.3183099, 0.3678794);
  let q = p * k + k.yx;
  return -1.0 + 2.0 * fract(16.0 * k * fract(q.x * q.y * (q.x + q.y)));
}

fn safeNormalize2(v: vec2<f32>) -> vec2<f32> {
  let l = length(v);
  if (l > 1e-10) {
    return v / l;
  }
  return vec2<f32>(0.0, 0.0);
}

fn powInv(t: f32, power: f32) -> f32 {
  return 1.0 - pow(1.0 - clamp01(t), power);
}

fn easeOut(t: f32) -> f32 {
  let v = 1.0 - clamp01(t);
  return 1.0 - v * v;
}

fn smoothStart(t: f32, smoothing: f32) -> f32 {
  let s = max(smoothing, 1e-6);
  if (t >= s) {
    return t - 0.5 * s;
  }
  return 0.5 * t * t / s;
}

fn loadPrevClamped2D(fx: i32, fy: i32, fz: i32) -> vec4<f32> {
  let cx = clamp(fx, 0, i32(frame.fullWidth) - 1);
  let cy = clamp(fy, 0, i32(frame.fullHeight) - 1);
  return loadPrevRGBA(cx, cy, fz);
}

fn fetchPosClamped2D(fx: i32, fy: i32, fz: i32) -> vec3<f32> {
  let cx = clamp(fx, 0, i32(frame.fullWidth) - 1);
  let cy = clamp(fy, 0, i32(frame.fullHeight) - 1);
  return fetchPos(cx, cy, fz);
}

fn resolutionScale() -> f32 {
  let refRes = 1024.0;
  let curRes = max(min(f32(frame.fullWidth), f32(frame.fullHeight)), 1.0);
  return curRes / refRes;
}

fn resolveFiniteSlope2D(fx: i32, fy: i32, fz: i32) -> vec2<f32> {
  let hL = loadPrevClamped2D(fx - 1, fy, fz).x;
  let hR = loadPrevClamped2D(fx + 1, fy, fz).x;
  let hD = loadPrevClamped2D(fx, fy - 1, fz).x;
  let hU = loadPrevClamped2D(fx, fy + 1, fz).x;

  let pL = fetchPosClamped2D(fx - 1, fy, fz);
  let pR = fetchPosClamped2D(fx + 1, fy, fz);
  let pD = fetchPosClamped2D(fx, fy - 1, fz);
  let pU = fetchPosClamped2D(fx, fy + 1, fz);

  let dx = max(abs(pR.x - pL.x), 1e-6);
  let dy = max(abs(pU.y - pD.y), 1e-6);

  let dHdX = (hR - hL) / dx;
  let dHdY = (hU - hD) / dy;

  return vec2<f32>(dHdX, dHdY);
}

fn guideGaussian(dx: i32, dy: i32, sigmaPx: f32) -> f32 {
  let s = max(sigmaPx, 0.05);
  let d2 = f32(dx * dx + dy * dy);
  return exp(-0.5 * d2 / (s * s));
}

fn guideHeightAt(fx: i32, fy: i32, fz: i32, sigmaWorld: f32) -> f32 {
  let sigmaPx = sigmaWorld * resolutionScale();

  var sumW = 0.0;
  var sumH = 0.0;

  for (var j: i32 = -4; j <= 4; j = j + 1) {
    for (var i: i32 = -4; i <= 4; i = i + 1) {
      let h = loadPrevClamped2D(fx + i, fy + j, fz).x;
      let w = guideGaussian(i, j, sigmaPx);
      sumW += w;
      sumH += h * w;
    }
  }

  return sumH / max(sumW, 1e-6);
}

fn drainBlurWeight(dx: i32, dy: i32, sigmaPx: f32) -> f32 {
  let s = max(sigmaPx, 0.05);
  let d2 = f32(dx * dx + dy * dy);
  return exp(-0.5 * d2 / (s * s));
}

fn blurredHeightAt(fx: i32, fy: i32, fz: i32, sigmaWorld: f32) -> f32 {
  let sigmaPx = sigmaWorld * resolutionScale();

  var sumW = 0.0;
  var sumH = 0.0;

  for (var j: i32 = -4; j <= 4; j = j + 1) {
    for (var i: i32 = -4; i <= 4; i = i + 1) {
      let s = loadPrevClamped2D(fx + i, fy + j, fz).x;
      let w = drainBlurWeight(i, j, sigmaPx);
      sumW += w;
      sumH += s * w;
    }
  }

  return sumH / max(sumW, 1e-6);
}

fn blurredRidgeAt(fx: i32, fy: i32, fz: i32, sigmaWorld: f32) -> f32 {
  let sigmaPx = sigmaWorld * resolutionScale();

  var sumW = 0.0;
  var sumR = 0.0;

  for (var j: i32 = -4; j <= 4; j = j + 1) {
    for (var i: i32 = -4; i <= 4; i = i + 1) {
      let s = loadPrevClamped2D(fx + i, fy + j, fz);
      let ridge = s.w * 2.0 - 1.0;
      let w = drainBlurWeight(i, j, sigmaPx);
      sumW += w;
      sumR += ridge * w;
    }
  }

  return sumR / max(sumW, 1e-6);
}

fn phacelleNoise(
  p: vec2<f32>,
  normDir: vec2<f32>,
  freq: f32,
  offset: f32,
  normalization: f32
) -> vec4<f32> {
  let sideDir = normDir.yx * vec2<f32>(-1.0, 1.0) * freq * HYDRO_TAU;
  let phaseOffset = offset * HYDRO_TAU;

  let pInt = floor(p);
  let pFrac = fract(p);

  var phaseDir = vec2<f32>(0.0);
  var weightSum = 0.0;

  for (var j: i32 = -1; j <= 2; j = j + 1) {
    for (var i: i32 = -1; i <= 2; i = i + 1) {
      let gridOffset = vec2<f32>(f32(i), f32(j));
      let gridPoint = pInt + gridOffset;
      let randomOffset = hydroHash2(gridPoint) * 0.5;
      let v = pFrac - gridOffset - randomOffset;

      let sqrDist = dot(v, v);
      var weight = exp(-sqrDist * 2.0);
      weight = max(0.0, weight - 0.01111);

      weightSum += weight;

      let waveInput = dot(v, sideDir) + phaseOffset;
      phaseDir += vec2<f32>(cos(waveInput), sin(waveInput)) * weight;
    }
  }

  let interpolated = phaseDir / max(weightSum, 1e-6);
  let mag = max(1.0 - normalization, length(interpolated));

  return vec4<f32>(interpolated / max(mag, 1e-6), sideDir);
}

fn pixelSpan2D(fx: i32, fy: i32, fz: i32) -> f32 {
  let pL = fetchPosClamped2D(fx - 1, fy, fz);
  let pR = fetchPosClamped2D(fx + 1, fy, fz);
  let pD = fetchPosClamped2D(fx, fy - 1, fz);
  let pU = fetchPosClamped2D(fx, fy + 1, fz);

  let dx = max(abs(pR.x - pL.x) * 0.5, 1e-6);
  let dy = max(abs(pU.y - pD.y) * 0.5, 1e-6);

  return max(dx, dy);
}


fn rotate2(v: vec2<f32>, angle: f32) -> vec2<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec2<f32>(v.x * c - v.y * s, v.x * s + v.y * c);
}

fn signed01(v: f32) -> f32 {
  return v * 2.0 - 1.0;
}

fn terrainDetailMapScalar(uv: vec2<f32>, baseFreq: f32) -> f32 {
  var value = 0.0;
  var amp = 0.5;
  var ampSum = 0.0;
  var freqLoc = max(baseFreq, 1e-6);

  for (var i: u32 = 0u; i < 8u; i = i + 1u) {
    value += noise2D(uv * freqLoc) * amp;
    ampSum += amp;
    amp *= 0.95;
    freqLoc *= 2.0;
  }

  return value / max(ampSum, 1e-6);
}

fn generateSmokeNoise(pos: vec3<f32>, paramsIn: NoiseParams) -> f32 {
  let baseFreq = max(paramsIn.freq, 0.25);
  let baseOctaves = max(paramsIn.octaves, 3u);
  let lac = max(paramsIn.lacunarity, 2.0);

  var warpParams = paramsIn;
  warpParams.freq = baseFreq * 0.9;
  warpParams.octaves = max(baseOctaves, 3u);
  warpParams.gain = 0.55;
  warpParams.lacunarity = lac;

  let warpX = signed01(generateSimplex(pos + vec3<f32>(17.31, 9.73, 3.11), warpParams));
  let warpY = signed01(generatePerlin(pos + vec3<f32>(-11.37, 14.51, 5.71), warpParams));
  let warpZ = signed01(generateSimplex(pos + vec3<f32>(5.91, -7.13, 11.29), warpParams));
  let warpAmp = 0.18 + max(paramsIn.warpAmp, 0.0) * 0.35;
  let qWarp = pos + vec3<f32>(warpX, warpY, 0.35 * warpZ) * warpAmp;

  var macroParams = paramsIn;
  macroParams.freq = baseFreq * 0.5;
  macroParams.octaves = max(baseOctaves + 1u, 4u);
  macroParams.gain = 0.55;
  macroParams.lacunarity = lac;
  let macroRidge = signed01(generateRidgedMultifractal4(qWarp, macroParams));

  var continentalParams = paramsIn;
  continentalParams.freq = baseFreq * 0.28;
  continentalParams.octaves = max(baseOctaves, 3u);
  continentalParams.gain = 0.5;
  continentalParams.lacunarity = lac;
  let continental = signed01(generateBillow(qWarp + vec3<f32>(2.7, -4.1, 1.3), continentalParams));

  var ridgeParams = paramsIn;
  ridgeParams.freq = baseFreq * 1.45;
  ridgeParams.octaves = max(baseOctaves, 4u);
  ridgeParams.gain = 0.52;
  ridgeParams.lacunarity = lac;
  let detailRidge = signed01(generateRidgedMultifractal2(qWarp * 1.05 + vec3<f32>(4.2, 1.7, 0.0), ridgeParams));

  var worleyParams = paramsIn;
  worleyParams.freq = baseFreq * 1.75;
  worleyParams.octaves = 1u;
  worleyParams.gain = 1.0;
  worleyParams.lacunarity = 2.0;
  let cells = 1.0 - generateWorley(qWarp + vec3<f32>(7.5, -3.2, 0.0), worleyParams);
  let cellular = signed01(generateCellular(qWarp * 1.1 + vec3<f32>(-5.3, 6.4, 0.0), worleyParams));

  var rippleParams = paramsIn;
  rippleParams.freq = baseFreq * 2.25;
  rippleParams.octaves = 4u;
  rippleParams.gain = 0.7;
  rippleParams.lacunarity = max(lac, 2.0);
  let rippleWarpX = signed01(generatePerlin(qWarp * 1.9 + vec3<f32>(8.7, 3.1, 0.0), rippleParams));
  let rippleWarpY = signed01(generateSimplex(qWarp * 1.9 + vec3<f32>(-6.2, 5.4, 0.0), rippleParams));
  let rippleCarrier = signed01(generateBillow(qWarp * 2.3 + vec3<f32>(3.6, -8.9, 0.0), rippleParams));
  let rippleAngle = 0.6 + 0.35 * signed01(generatePerlin(qWarp + vec3<f32>(1.9, -2.7, 0.0), warpParams));
  let ripplePos = rotate2(qWarp.xy + vec2<f32>(rippleWarpX, rippleWarpY) * 0.08, rippleAngle);
  let rippleFreq = max(paramsIn.rippleFreq, 1.0);
  let ripple = sin(ripplePos.x * rippleFreq + rippleCarrier * 2.8);
  let rippleEnvelope = 0.5 + 0.5 * signed01(generatePerlin(qWarp * 1.35 + vec3<f32>(10.1, 4.8, 0.0), rippleParams));

  let cellBlend = clamp01(0.3 + paramsIn.threshold * 0.9);
  let rippleBlend = clamp01(0.02 + 0.008 * max(paramsIn.rippleFreq, 1.0));

  var terrain = 0.0;
  terrain += macroRidge * 0.46;
  terrain += continental * 0.14;
  terrain += detailRidge * 0.21;
  terrain += signed01(cells) * (0.10 * cellBlend);
  terrain += cellular * (0.06 * cellBlend);
  terrain += ripple * rippleEnvelope * rippleBlend;

  let lifted = terrain * 0.5 + 0.5 + paramsIn.zShift;
  return clamp01(lifted);
}

fn terrainVoroModeSample(pos: vec3<f32>, freqLoc: f32, mode: u32, edgeK: f32, threshold: f32) -> f32 {
  let s = voro_sample3D(pos * freqLoc);
  return clamp01(voro_eval(s.f1Sq, s.f2Sq, s.cellVal, mode, edgeK, threshold, freqLoc));
}

fn terrainVoroModeSmooth(pos: vec3<f32>, freqLoc: f32, mode: u32, edgeK: f32, threshold: f32) -> f32 {
  let step = 0.006;
  let center = terrainVoroModeSample(pos, freqLoc, mode, edgeK, threshold);
  let x1 = terrainVoroModeSample(pos + vec3<f32>( step, 0.0, 0.0), freqLoc, mode, edgeK, threshold);
  let x2 = terrainVoroModeSample(pos + vec3<f32>(-step, 0.0, 0.0), freqLoc, mode, edgeK, threshold);
  let y1 = terrainVoroModeSample(pos + vec3<f32>(0.0,  step, 0.0), freqLoc, mode, edgeK, threshold);
  let y2 = terrainVoroModeSample(pos + vec3<f32>(0.0, -step, 0.0), freqLoc, mode, edgeK, threshold);
  let d1 = terrainVoroModeSample(pos + vec3<f32>( step,  step, 0.0), freqLoc, mode, edgeK, threshold);
  let d2 = terrainVoroModeSample(pos + vec3<f32>(-step,  step, 0.0), freqLoc, mode, edgeK, threshold);
  let d3 = terrainVoroModeSample(pos + vec3<f32>( step, -step, 0.0), freqLoc, mode, edgeK, threshold);
  let d4 = terrainVoroModeSample(pos + vec3<f32>(-step, -step, 0.0), freqLoc, mode, edgeK, threshold);
  return clamp01((center * 4.0 + x1 * 2.0 + x2 * 2.0 + y1 * 2.0 + y2 * 2.0 + d1 + d2 + d3 + d4) / 16.0);
}

fn generateTerrainNoise(pos: vec3<f32>, paramsIn: NoiseParams) -> f32 {
  let baseFreq = max(paramsIn.freq, 0.24);
  let baseOctaves = max(paramsIn.octaves, 4u);
  let lac = max(paramsIn.lacunarity, 2.0);
  let warpAmount = 0.035 + max(paramsIn.warpAmp, 0.0) * 0.055;

  var warpParams = paramsIn;
  warpParams.freq = baseFreq * 0.55;
  warpParams.octaves = max(baseOctaves, 3u);
  warpParams.gain = 0.52;
  warpParams.lacunarity = lac;

  let warpA = signed01(generatePerlin(pos + vec3<f32>(7.3, -5.9, 1.7), warpParams));
  let warpB = signed01(generateSimplex(pos + vec3<f32>(-3.1, 9.4, 2.6), warpParams));
  let q = pos + vec3<f32>(warpA, warpB, 0.0) * warpAmount;

  var macroParams = paramsIn;
  macroParams.freq = baseFreq * 0.56;
  macroParams.octaves = max(baseOctaves + 1u, 5u);
  macroParams.gain = 0.58;
  macroParams.lacunarity = lac;
  let macroRidgeRaw = signed01(generateRidgedMultifractal4(q + vec3<f32>(4.2, 1.9, 0.0), macroParams));
  let macroRidge = sign(macroRidgeRaw) * pow(abs(macroRidgeRaw), 1.18);

  var sharpParams = paramsIn;
  sharpParams.freq = baseFreq * 1.08;
  sharpParams.octaves = max(baseOctaves, 5u);
  sharpParams.gain = 0.53;
  sharpParams.lacunarity = lac;
  let sharpRidgeRaw = signed01(generateRidgedMultifractal2(q * 1.04 + vec3<f32>(-3.7, 2.6, 0.0), sharpParams));
  let sharpRidge = sign(sharpRidgeRaw) * pow(abs(sharpRidgeRaw), 1.30);

  var worleyParams = paramsIn;
  worleyParams.freq = baseFreq * 0.82;
  worleyParams.octaves = 1u;
  worleyParams.gain = 1.0;
  worleyParams.lacunarity = 2.0;
  let worleyA = 1.0 - generateWorley(q + vec3<f32>(6.3, -1.7, 0.0), worleyParams);
  let worleyB = 1.0 - generateWorley(q + vec3<f32>(6.3 + 0.012, -1.7, 0.0), worleyParams);
  let worleyC = 1.0 - generateWorley(q + vec3<f32>(6.3 - 0.012, -1.7, 0.0), worleyParams);
  let worleyD = 1.0 - generateWorley(q + vec3<f32>(6.3, -1.7 + 0.012, 0.0), worleyParams);
  let worleyE = 1.0 - generateWorley(q + vec3<f32>(6.3, -1.7 - 0.012, 0.0), worleyParams);
  let smoothedWorley = (worleyA * 4.0 + worleyB + worleyC + worleyD + worleyE) / 8.0;
  let worleySignal = signed01(smoothedWorley);
  let worleyCarve = smoothstep(0.38, 0.84, smoothedWorley);
  let worleyGrad = vec2<f32>(worleyB - worleyC, worleyD - worleyE);
  let worleyTangent = safeNormalize2(vec2<f32>(-worleyGrad.y, worleyGrad.x));

  var angleParams = paramsIn;
  angleParams.freq = baseFreq * 0.72;
  angleParams.octaves = max(baseOctaves, 3u);
  angleParams.gain = 0.50;
  angleParams.lacunarity = lac;
  let angleField = signed01(generatePerlin(q + vec3<f32>(2.1, -4.7, 0.0), angleParams));
  let baseDir = safeNormalize2(vec2<f32>(cos(angleField * 1.9), sin(angleField * 1.9)));
  let joinMix = smoothstep(0.18, 0.82, smoothedWorley);
  let lineDir = safeNormalize2(mix(baseDir, worleyTangent, 0.72 * joinMix));
  let sideDir = vec2<f32>(-lineDir.y, lineDir.x);

  var rippleParams = paramsIn;
  rippleParams.freq = baseFreq * 1.7;
  rippleParams.octaves = 3u;
  rippleParams.gain = 0.62;
  rippleParams.lacunarity = max(lac, 2.0);
  let rippleWarp = vec2<f32>(
    signed01(generatePerlin(q * 1.25 + vec3<f32>(8.7, 1.3, 0.0), rippleParams)),
    signed01(generateSimplex(q * 1.25 + vec3<f32>(-6.2, 4.8, 0.0), rippleParams))
  ) * 0.024;
  let rippleCarrier = signed01(generateBillow(q * 1.85 + vec3<f32>(3.1, -7.2, 0.0), rippleParams));

  let detailMap = terrainDetailMapScalar(q.xy * 0.60 + vec2<f32>(11.7, -5.3), 2.0);
  let detailSoft = detailMap * detailMap * (3.0 - 2.0 * detailMap);
  let detailSignal = signed01(detailSoft);

  let joinedCoord = dot(q.xy + rippleWarp, sideDir);
  let branchCoord = dot(
    q.xy + rippleWarp * 0.7,
    safeNormalize2(mix(sideDir, worleyTangent, 0.35))
  );
  let rippleFreq = max(paramsIn.rippleFreq, 1.0) * 0.42;
  let ripplePrimary =
    sin(joinedCoord * rippleFreq + smoothedWorley * 4.0 + rippleCarrier * 1.1 + detailSignal * 0.28);
  let rippleBranch =
    sin(branchCoord * rippleFreq * 1.05 + smoothedWorley * 3.2 + rippleCarrier * 0.7 + detailSignal * 0.18);
  let ripple = mix(ripplePrimary, rippleBranch, 0.32 + 0.28 * joinMix);
  let rippleMask =
    smoothstep(0.08, 0.88, abs(macroRidge)) *
    (0.28 + 0.72 * joinMix) *
    (0.92 + 0.08 * detailSoft);
  let rippleBlend = clamp01(0.026 + 0.006 * max(paramsIn.rippleFreq, 1.0));

  let detailMask =
    smoothstep(0.12, 0.88, smoothedWorley) *
    smoothstep(0.04, 0.72, abs(macroRidge));

  var terrain = 0.0;
  terrain += macroRidge * 0.40;
  terrain += sharpRidge * 0.16;
  terrain += worleySignal * 0.11;
  terrain -= worleyCarve * 0.10;
  terrain += ripple * rippleMask * rippleBlend;
  terrain += detailSignal * detailMask * 0.012;

  let shaped = sign(terrain) * pow(abs(terrain), 0.96);
  let lifted = shaped * 0.5 + 0.5 + paramsIn.zShift;
  return clamp01(lifted);
}

fn erosionFilter(
  p: vec2<f32>,
  heightAndSlopeIn: vec3<f32>,
  fadeTargetIn: f32,
  strengthIn: f32,
  gullyWeightIn: f32,
  carrierWeightIn: f32,
  steeringWeightIn: f32,
  detailIn: f32,
  roundingIn: vec4<f32>,
  onsetIn: vec4<f32>,
  assumedSlopeIn: vec2<f32>,
  scaleIn: f32,
  octavesIn: u32,
  lacunarityIn: f32,
  gainIn: f32,
  cellScaleIn: f32,
  normalizationIn: f32,
  pixelSpanIn: f32,
  ridgeMapOut: ptr<function, f32>
) -> vec4<f32> {
  var heightAndSlope = heightAndSlopeIn;
  var fadeTarget = clamp(fadeTargetIn, -1.0, 1.0);

  let inputHeightAndSlope = heightAndSlopeIn;

  var strength = strengthIn * scaleIn;
  var freq = 1.0 / max(scaleIn * cellScaleIn, 1e-6);
  let carrierSharpness = 1.75;
  let slopeLength = max(length(heightAndSlopeIn.yz), 1e-10);
  var magnitude = 0.0;
  var roundingMult = 1.0;

  let roundingForInput =
    mix(roundingIn.y, roundingIn.x, clamp01(fadeTarget * 0.5 + 0.5)) * roundingIn.z;

  var combiMask =
    easeOut(smoothStart(slopeLength * onsetIn.x, roundingForInput * onsetIn.x));

  var ridgeMapCombiMask = easeOut(slopeLength * onsetIn.z);
  var ridgeMapFadeTarget = fadeTarget;

  var gullySlope =
    mix(
      heightAndSlopeIn.yz,
      safeNormalize2(heightAndSlopeIn.yz) * assumedSlopeIn.x,
      assumedSlopeIn.y
    );

  let pixelSpan = max(pixelSpanIn, 1e-6);

  for (var i: u32 = 0u; i < octavesIn; i = i + 1u) {
    let stripeStep = freq * cellScaleIn * HYDRO_TAU * pixelSpan;
    let stripeMask = 1.0 - smoothstep(1.05, 2.40, stripeStep);

    if (stripeMask <= 1e-4) {
      break;
    }

    var phacelle =
      phacelleNoise(
        p * freq,
        safeNormalize2(gullySlope),
        cellScaleIn,
        0.25,
        normalizationIn
      );

    phacelle = vec4<f32>(phacelle.xy, phacelle.z * -freq, phacelle.w * -freq);
    let sloping = abs(phacelle.y);
    let carrierRaw = clamp(phacelle.x, -1.0, 1.0);
    let carrierPhase = sign(carrierRaw) * pow(abs(carrierRaw), carrierSharpness);

    let octaveStrength = strength * stripeMask;

    gullySlope += sign(phacelle.y) * phacelle.zw * octaveStrength * gullyWeightIn * steeringWeightIn;

    let visibleGullies = vec3<f32>(carrierPhase, phacelle.y * phacelle.zw) * carrierWeightIn;
    let fadedGullies =
      mix(vec3<f32>(fadeTarget, 0.0, 0.0), visibleGullies, combiMask);

    heightAndSlope += fadedGullies * octaveStrength;
    magnitude += octaveStrength;
    let fadedCarrier = mix(fadeTarget, carrierPhase, combiMask);
    fadeTarget = mix(fadeTarget, fadedCarrier, stripeMask);

    let roundingForOctave =
      mix(roundingIn.y, roundingIn.x, clamp01(carrierPhase * 0.5 + 0.5)) * roundingMult;

    let newMask =
      easeOut(smoothStart(sloping * onsetIn.y, roundingForOctave * onsetIn.y));

    combiMask = powInv(combiMask, detailIn) * mix(1.0, newMask, stripeMask);

    ridgeMapFadeTarget = mix(ridgeMapFadeTarget, carrierPhase, ridgeMapCombiMask * stripeMask);

    let newRidgeMapMask = easeOut(sloping * onsetIn.w);
    ridgeMapCombiMask = ridgeMapCombiMask * mix(1.0, newRidgeMapMask, stripeMask);

    strength *= gainIn;
    freq *= lacunarityIn;
    roundingMult *= roundingIn.w;
  }

  *ridgeMapOut = ridgeMapFadeTarget * (1.0 - ridgeMapCombiMask);

  let delta = heightAndSlope - inputHeightAndSlope;
  return vec4<f32>(delta, magnitude);
}

fn studioSphereHeight(x:i32,y:i32,last:i32)->f32 {
  return loadPrevRGBA((x+last)%last,clamp(y,0,last),0).x;
}

struct StudioErosionChart { position:vec2<f32>, slope:vec2<f32>, pixelSpan:f32 }

fn studioErosionChart(
  dir:vec3<f32>,gradient:vec3<f32>,hemisphere:f32,pixelSpan:f32
)->StudioErosionChart {
  // Stereographic charts preserve the downhill angle. Their overlap avoids a
  // longitude seam and keeps the noise cells finite at both poles.
  let projection=1.0+hemisphere*dir.y;
  let uv=dir.xz/projection;
  let inverse=2.0/(1.0+dot(uv,uv));
  let angular=vec3<f32>(dir.x,hemisphere+dir.y,dir.z);
  let du=inverse*(vec3<f32>(1,0,0)-uv.x*angular);
  let dv=inverse*(vec3<f32>(0,0,1)-uv.y*angular);
  let slope=vec2<f32>(dot(gradient,du),dot(gradient,dv))*.14;
  let offset=seedOffset3(params.seed).xy;
  return StudioErosionChart(uv+offset,slope,pixelSpan/projection);
}

fn studioMountainCut(chart:StudioErosionChart,height:f32,ranges:bool)->f32 {
  let fade=2.0*smoothstep(.05,select(1.62,1.20,ranges),height)-1.0;
  var ridge=0.0;
  let mountain=erosionFilter(
    chart.position+vec2<f32>(.29,-.44),vec3<f32>(height,chart.slope),fade,
    select(4.4,5.8,ranges),.48,select(.76,.55,ranges),1.03,1.40,
    vec4<f32>(select(.10,.035,ranges),0,.10,2.0),vec4<f32>(1.10,1.25,2.80,1.50),
    vec2<f32>(.70,.88),select(.145,.083,ranges),select(1u,6u,ranges),
    2.08,.54,.82,.52,chart.pixelSpan,&ridge
  );
  if(ranges){
    // Preserve the fade contribution at crests. Clipping uplift rounds off
    // the exact divides the lower carrier weight is meant to keep.
    return mountain.x-.22*max(0.0,-mountain.x);
  }
  let incision=smoothstep(.065,.52,-mountain.x);
  let shoulder=smoothstep(.06,.48,mountain.x);
  return .10*shoulder-.55*incision;
}

fn studioGullyCut(chart:StudioErosionChart,height:f32)->f32 {
  let strength=select(3.05,3.55,params.voroMode==1u);
  var ridge=0.0;
  let erosion=erosionFilter(
    chart.position,vec3<f32>(height,chart.slope),-.17,strength,.48,.83,1.03,1.50,
    vec4<f32>(.10,0,.10,2.0),vec4<f32>(1.20,1.25,2.80,1.50),
    vec2<f32>(.72,.72),.076,3u,2.2,.48,.82,.52,chart.pixelSpan,&ridge
  );
  // Smaller tributaries start from the coarse pass's eroded slope.
  let tributaries=erosionFilter(
    chart.position+vec2<f32>(.57,.31),
    vec3<f32>(height+erosion.x,chart.slope+.30*erosion.yz),-.10,1.55,.37,.69,.92,1.38,
    vec4<f32>(.10,0,.10,1.8),vec4<f32>(1.20,1.25,2.80,1.50),
    vec2<f32>(.66,.68),.041,2u,2.1,.47,.83,.52,chart.pixelSpan,&ridge
  );
  return clamp(erosion.x+tributaries.x,-.265,.16);
}

fn studioVolcanicRelief(dir:vec3<f32>,texel:f32)->vec2<f32> {
  var relief=0.0;
  var foundation=0.0;
  var collapse=0.0;
  let density=options.sphereFeatureDensity;
  let vents=u32(clamp(round(12.0*density),5.0,32.0));
  for(var i=0u;i<vents;i++){
    let seed=params.seed+i*73856093u;
    let q=(seedOffset3(seed)-vec3<f32>(17.173,31.947,47.521))/
      vec3<f32>(131.0,137.0,149.0);
    let y=2.0*q.x-1.0;
    let ring=sqrt(max(0.0,1.0-y*y));
    let phi=TWO_PI*q.y;
    let center=vec3<f32>(ring*cos(phi),y,ring*sin(phi));
    let radius=mix(.035,.134,q.z*q.z);
    let distance2=max(0.0,2.0-2.0*dot(dir,center));
    let reach=mix(.11,.21,q.z)+.44*radius;
    let extent=max(radius*1.45,reach+.024);
    if(distance2*density*density>extent*extent){continue;}
    let east=vec3<f32>(-sin(phi),0,cos(phi));
    let north=cross(center,east);
    let angle=TWO_PI*canyon_bed_random(19,seed);
    let course=east*cos(angle)+north*sin(angle);
    let local=density*vec2<f32>(dot(dir,course),dot(dir,cross(center,course)));
    if(distance2*density*density<radius*radius*1.45*1.45){
      let shape=vec3<f32>(1.0-q.z,canyon_bed_random(23,seed),canyon_bed_random(37,seed));
      let profile=local/radius;
      let roughness=mix(.105,.040,shape.x)*simplex3D(dir*104.0+q*19.0);
      relief+=volcanic_vent(profile,shape,roughness);
      // Loose ejecta bury the old relief beneath the crater and upper flank.
      foundation=max(foundation,(1.0-smoothstep(.38,1.21,length(profile)))*mix(.45,1.0,shape.x));
    }
    // Off-axis flank vents and multiple tube directions follow the same
    // eruptive center. The world seed controls which branches survive.
    if(canyon_bed_random(5,seed)>.33){
      let flank=vec2<f32>(local.x*.64+local.y*.77,-local.x*.77+local.y*.64);
      let offset=radius*vec2<f32>(mix(.81,1.36,q.x),mix(-.34,.48,q.y));
      let smallRadius=clamp(radius*.45,.023,.044);
      let vent=(flank-offset)/smallRadius;
      if(dot(vent,vent)<1.45*1.45){
        let shape=vec3<f32>(mix(.56,.91,q.y),q.x,q.z);
        relief+=.62*volcanic_vent(vent,shape,.075*simplex3D(dir*140.0-q*17.0));
      }
    }
    collapse=min(collapse,lava_tube_collapse(local,radius,reach,seed,texel*density));
    if(q.x>.63){
      let branch=vec2<f32>(local.x*.78-local.y*.626,local.x*.626+local.y*.78);
      collapse=min(collapse,lava_tube_collapse(branch,radius*1.33,reach*.78,seed+8009u,texel*density));
    }
  }
  return vec2<f32>(clamp(relief,-.55,1.10)+collapse,foundation);
}

fn studioVolcanicCraterFields(dir:vec3<f32>,broad:f32,province:f32)->vec2<f32>{
  let volcanic=smoothstep(.22,.65,province);
  if(volcanic<=0.0){return vec2<f32>(0.0);}
  // Jitter vent centers in 3D so the fields wrap over every meridian.
  let shellRadius=24.0*options.sphereFeatureDensity;
  let position=dir*shellRadius;
  let base=vec3<i32>(floor(position));
  let next=select(vec3<i32>(1),vec3<i32>(-1),fract(position)<vec3<f32>(.5));
  let upland=smoothstep(-.36,.68,broad);
  let belt=smoothstep(-.53,.37,simplex3D(dir*11.0*options.sphereFeatureDensity+seedOffset3(params.seed)));
  let chance=volcanic*(.17+.31*upland+.21*belt);
  var raised=0.0;
  var carved=0.0;
  var foundation=0.0;
  // The radius and jitter bounds let each axis skip its farther neighbor.
  for(var i=0u;i<8u;i++){
    let cell=base+next*vec3<i32>(i32(i&1u),i32((i>>1u)&1u),i32(i>>2u));
    let key=params.seed^(bitcast<u32>(cell.x)*0x8da6b343u)^
      (bitcast<u32>(cell.y)*0xd8163841u)^(bitcast<u32>(cell.z)*0xcb1ab31fu);
    let activation=1.0-smoothstep(chance-.09,chance,canyon_bed_random(2,key));
    if(activation<=0.0){continue;}
    let shape=vec3<f32>(canyon_bed_random(5,key),canyon_bed_random(7,key),canyon_bed_random(11,key));
    let site=vec3<f32>(cell)+.22+.56*shape;
    let offset=site-position;
    if(dot(offset,offset)>.49){continue;}
    let lengthFromCenter=length(site);
    if(abs(lengthFromCenter-shellRadius)>.24){continue;}
    let center=site/lengthFromCenter;
    let width=mix(.19,.40,canyon_bed_random(19,key));
    let distance2=max(0.0,2.0-2.0*dot(dir,center))*shellRadius*shellRadius;
    if(distance2>width*width*2.56){continue;}
    let axis=select(vec3<f32>(0,1,0),vec3<f32>(1,0,0),abs(center.y)>.9);
    let east=normalize(cross(axis,center));
    let north=cross(center,east);
    let angle=TWO_PI*canyon_bed_random(23,key);
    let facing=east*cos(angle)+north*sin(angle);
    let point=vec2<f32>(dot(dir,facing),dot(dir,cross(center,facing)))*(shellRadius/width);
    let roughness=.064*simplex3D(dir*142.0*options.sphereFeatureDensity+shape*17.0);
    let threshold=mix(.63,.38,upland);
    let cinder=smoothstep(threshold-.07,threshold+.07,canyon_bed_random(29,key));
    var height=0.0;
    if(cinder>0.0){
      height+=cinder*volcanic_vent(point,vec3<f32>(mix(.70,1.0,shape.x),shape.y,shape.z),roughness);
    }
    if(cinder<1.0){
      height+=(1.0-cinder)*volcanic_caldera(point,shape,roughness);
    }
    let edge=1.0-smoothstep(1.30,1.55,length(point));
    height*=edge*activation*mix(.31,.62,width/.40);
    raised=max(raised,height);
    carved=min(carved,height);
    foundation=max(foundation,activation*(1.0-smoothstep(.28,1.28,length(point))));
  }
  return vec2<f32>(raised+carved,foundation);
}

fn studioRidge(value:f32,width:f32)->f32 {
  return max(0.0,1.0-abs(value)/width);
}

fn studioMountainRange(radial:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>)->f32 {
  let dir=radial*options.sphereFeatureDensity;
  // Fold the mountain belt and rotate the spurs away from the main divide.
  let fault=vec3<f32>(
    dot(dir,vec3<f32>(4,-20,22)/30.0),
    dot(dir,vec3<f32>(28,10,4)/30.0),
    dot(dir,vec3<f32>(-10,20,20)/30.0)
  );
  let province=simplex3D(dir*5.0-offset);
  let fold=simplex3D(dir*9.0+offset);
  let fracture=smoothstep(-.28,.52,province+.33*fold);
  let belt=fault*vec3<f32>(17,6,9)+vec3<f32>(.72*fold,.25*province,.34*fold);
  let line=simplex3D(belt+offset);
  let flank=abs(line)/(select(.82,1.22,line>0.0)*mix(1.12,.77,fracture));
  let crest=max(0.0,1.0-flank);
  // Oblique ribs cross the divide and split as the two limbs descend.
  // Intersect each rib with a dipping profile to make wedge-shaped faces.
  let spurDomain=vec3<f32>(belt.x*.77+1.05*belt.y,belt.y-.30*belt.x,belt.z);
  let spurLine=simplex3D(spurDomain*vec3<f32>(1.72,2.58,2.15)-offset)+.31*line;
  let opening=smoothstep(.07,.77,flank)*mix(.23,.55,.5+.5*fold);
  let fork=min(abs(spurLine-opening),abs(spurLine+.81*opening));
  let spur=studioRidge(fork,.53);
  let face=max(0.0,min(spur,1.22-1.09*flank));
  let ribs=studioRidge(simplex3D(spurDomain*vec3<f32>(3.7,5.6,4.6)+offset.yzx+.24*spurLine),.48);
  let relief=crest*(.57+.19*crest)+mix(.34,.55,fracture)*face+
    mix(.13,.28,fracture)*ribs*face*crest-.53;
  let uplift=smoothstep(-.58,.69,broad)*mix(.39,1.0,smoothstep(-.60,.34,province));
  let strength=select(.68,.89,params.voroMode==1u)*options.sphereRangeWeight;
  return strength*uplift*(relief+.82*(broad-height));
}

fn studio_atlas_direction(x:i32,y:i32)->vec3<f32>{
  let span=max(i32(frame.fullWidth)-1,1);
  let last=max(i32(frame.fullHeight)-1,1);
  if(y<=0){return vec3<f32>(0,1,0);}
  if(y>=last){return vec3<f32>(0,-1,0);}
  let theta=PI*f32(y)/f32(last);
  let phi=TWO_PI*f32((x%span+span)%span)/f32(span);
  return vec3<f32>(sin(theta)*cos(phi),cos(theta),sin(theta)*sin(phi));
}

// A separate seeded field keeps province boundaries independent of the
// permutation and parameters selected for any individual height layer.
fn studio_region_noise(p:vec3<f32>,salt:u32,valueNoise:bool)->f32{
  let cell=vec3<i32>(floor(p));
  let f=fract(p);
  let blend=f*f*f*(f*(6.0*f-15.0)+10.0);
  var result=0.0;
  for(var i=0u;i<8u;i++){
    let corner=vec3<i32>(i32(i&1u),i32((i>>1u)&1u),i32(i>>2u));
    let c=cell+corner;
    let hash=hash3_u32(c.x,c.y,c.z,options.sphereRegionSeed,salt);
    var height=2.0*rnd01(hash)-1.0;
    if(!valueNoise){height=dot(gradient(hash%12u),f-vec3<f32>(corner));}
    let w=select(1.0-blend,blend,corner!=vec3<i32>(0));
    result+=height*w.x*w.y*w.z;
  }
  return result;
}

fn studio_region_map(dir:vec3<f32>)->vec4<f32>{
  let mode=u32(options.sphereRegion.z);
  let p=dir*options.sphereRegion.x+seedOffset3(options.sphereRegionSeed);
  var scores:vec4<f32>;
  for(var i=0u;i<4u;i++){
    let salt=(i+1u)*0x9e3779b9u;
    var score=studio_region_noise(p,salt,mode==4u);
    if(mode==2u){score=.5-abs(score);}
    if(mode==3u){score+=.43*studio_region_noise(p*2.07,salt,false);}
    scores[i]=score;
  }
  // Region order is mountains, canyons, granite and volcanic.
  let geology=u32(options.sphereRegion.w);
  if(geology!=0u){scores[select(select(0u,1u,geology==2u),3u,geology==3u)]+=.17;}
  let peak=max(max(scores.x,scores.y),max(scores.z,scores.w));
  let influence=clamp(1.0-(peak-scores)/options.sphereRegion.y,vec4<f32>(0),vec4<f32>(1));
  let weights=influence*influence;
  return weights/dot(weights,vec4<f32>(1));
}

fn studioProvinces(dir:vec3<f32>,offset:vec3<f32>,hotspot:f32)->vec4<f32>{
  var home=vec4<f32>(1,0,0,0);
  if(params.voroMode==2u){home=vec4<f32>(0,1,0,0);}
  if(params.voroMode==3u){home=vec4<f32>(0,0,0,1);}
  if(options.sphereBlend<=0.0){return home;}
  let domain=dir*options.sphereFeatureDensity;
  let p=domain*3.45;
  let warp=.31*simplex3D(domain*6.7+offset.zxy);
  let scores=vec4<f32>(
    simplex3D(p+offset+warp),
    simplex3D(p-offset.yzx+warp),
    simplex3D(p*1.13+offset.zxy-warp),
    simplex3D(p*.93-offset-warp)+.68*hotspot
  )+home*select(.12,.38,params.voroMode!=0u);
  let top=max(max(scores.x,scores.y),max(scores.z,scores.w));
  let edge=max(vec4<f32>(0),1.0-(top-scores)/.44);
  let weights=edge*edge;
  var provinces=mix(home,weights/dot(weights,vec4<f32>(1)),smoothstep(0.0,.92,options.sphereBlend));
  // Let granite and alpine interiors keep their own profiles. Leave the
  // sandstone and volcanic shares intact at contacts with either one.
  let upland=provinces.x+provinces.z;
  let granite=provinces.z/max(.001,upland);
  provinces.z=upland*mix(granite,smoothstep(.12,.88,granite),.82*options.sphereBlend);
  provinces.x=upland-provinces.z;
  return provinces;
}

fn studioCanyonRelief(radial:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>)->f32{
  let dir=radial*options.sphereFeatureDensity;
  let strata=simplex3D(dir*8.0+offset);
  let fracture=simplex3D(dir*24.0-offset+strata*.5);
  let exposure=smoothstep(-.40,.32,strata)*smoothstep(-.44,.23,broad);
  let remnant=smoothstep(-.24,.30,fracture+.24*strata);
  // In some formations the same drainage widens into a basin, in others
  // it cuts a slot through the plateau. The shelf profile is applied later.
  var channel=simplex3D(dir*12.0-offset.zxy+1.55*strata);
  let basin=simplex3D(dir*4.1+offset.yzx);
  let winding=smoothstep(-.02,.54,basin)*smoothstep(-.48,-.08,broad)*
    (1.0-smoothstep(.42,.92,broad));
  var curvature=0.0;
  if(winding>0.0){
    // Bend an elongated channel field through the basin. Two bend scales
    // give long sweeps with smaller turns, and the domain stays spherical.
    let normal=normalize(fract(offset*vec3<f32>(.093,.127,.079))-.5+vec3<f32>(.001));
    let crosswise=normalize(cross(normal,select(vec3<f32>(0,1,0),vec3<f32>(0,0,1),abs(normal.y)>.9)));
    let along=dot(dir,crosswise);
    let across=dot(dir,normal);
    let lengthwise=along*14.0+1.9*basin;
    curvature=.72*sin(lengthwise)+.28*sin(lengthwise*2.31+.60*strata);
    let meander=vec3<f32>(10.0*across-1.55*curvature,along*6.0,
      9.0*dot(dir,cross(crosswise,normal)))+offset.zxy;
    channel=mix(channel,simplex3D(meander),winding*.76);
  }
  // Bedding can dip toward either bank. On the softer side the same
  // canyon opens into an apron, while the harder side holds its scarp.
  let dip=smoothstep(-.32,.32,strata)*2.0-1.0;
  let bend=mix(dip,curvature,winding*.86);
  let bank=(smoothstep(-.15,.15,channel)*2.0-1.0)*bend;
  let canyon=abs(channel)/mix(.69,1.40,.5+.5*bank);
  let narrow=smoothstep(-.49,.57,fracture);
  let width=mix(.47,.24,narrow)*(1.0+.46*winding);
  let wall=canyon/width;
  var tributary=0.0;
  var debris=0.0;
  var headcut=0.0;
  if(wall>.20 && wall<1.91){
    // Branches work back from the trunk along fractures. Their width
    // narrows upslope and both the cuts and the debris taper into the host.
    let joint=fracture+.31*channel+.19*strata;
    let head=smoothstep(.68,1.66,wall);
    let span=mix(.27,.105,head)*mix(.74,1.20,.5+.5*bank);
    let notch=1.0-smoothstep(.20*span,span,abs(joint));
    let weathered=smoothstep(-.48,.45,strata+.28*bank);
    let apron=smoothstep(.20,.47,wall);
    tributary=notch*apron*(1.0-head)*mix(.27,.57,weathered);
    debris=.060*notch*apron*(1.0-smoothstep(.43,.76,wall))*(.40+.60*weathered);
    if(wall>.67){
      // Persistent joints cut back through the upper rim. Where two arms
      // split, the strip between them keeps its cap as a spur or butte.
      let rim=smoothstep(.67,1.03,wall)*(1.0-smoothstep(1.46,1.91,wall));
      let deflect=simplex3D(dir*35.0+offset.yzx+.48*strata);
      let opening=.19*smoothstep(.79,1.49,wall)*smoothstep(-.52,.58,deflect);
      let fork=abs(abs(joint+.12*deflect)-opening);
      let cut=1.0-smoothstep(.042,mix(.16,.27,weathered),fork);
      headcut=rim*cut*mix(.19,.52,weathered)*(1.0-.32*exposure);
    }
  }
  let cutWall=wall-tributary;
  // A talus ramp leads to a middle bench, then a steeper caprock wall.
  // Its flat top follows the broad regional surface above the smaller hills.
  let apron=smoothstep(.04,.40,cutWall);
  let hardCap=smoothstep(-.18,.49,strata+.24*fracture);
  let capWall=mix(smoothstep(.38,1.14,cutWall),smoothstep(.57,.98,cutWall),hardCap);
  let ramp=mix(.32,.53,.5+.5*bank);
  let profile=ramp*apron+(1.0-ramp)*capWall;
  // A resistant cap follows the slow regional bedding, so small changes
  // in the underlying relief don't turn the top into a chain of peaks.
  let shelf=.24+.19*broad+.24*basin+.067*strata;
  let table=shelf+.065*remnant*exposure;
  let depth=mix(.30,.86,smoothstep(-.40,.52,broad))*mix(.76,1.0,narrow);
  // Cut an inset channel through the broad floor. The inside bench stays
  // shallower, leaving room for the sediment and runoff passes downstream.
  let inset=winding*.15*(1.0-smoothstep(.045,.23,cutWall));
  let pointBar=winding*.074*max(0.0,bank)*smoothstep(.07,.23,cutWall)*
    (1.0-smoothstep(.39,.62,cutWall));
  let canyonHeight=table-depth*max(1.0-profile,headcut)-inset+pointBar+debris;
  // Resistant beds recess softer sections of the wall. Fade them through
  // tributaries so the shelves break at gullies and at the foot of the cliff.
  let bed=canyon_bed(radial,canyonHeight,params.seed);
  let scarp=smoothstep(.19,.47,cutWall)*(1.0-smoothstep(.91,1.22,cutWall));
  let ledgeWeight=scarp*mix(.32,1.0,hardCap)*(1.0-smoothstep(.10,.48,max(tributary,headcut)));
  let ledges=ledgeWeight*clamp(bed.displacement,-.068,.068);
  let fit=smoothstep(-.66,.04,broad)*mix(.56,1.0,exposure);
  return fit*(canyonHeight+ledges-height);
}

fn graniteDome(cell:Voro3DMetrics,spread:f32)->f32{
  let center=pow(max(0.0,1.0-cell.f1Sq/spread),1.45);
  let interior=smoothstep(0.0,.24,cell.f2Sq-cell.f1Sq);
  return center*(.65+interior*mix(.04,.65,cell.cellVal));
}

fn studioGraniteRelief(radial:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>,granite:f32,texel:f32)->f32{
  let dir=radial*options.sphereFeatureDensity;
  let intrusion=simplex3D(dir*5.7+offset.zxy);
  let strike=normalize(offset.yzx-vec3<f32>(100.447,122.021,82.673));
  let along=dot(dir,strike);
  let hills=simplex3D(dir*13.0-offset+intrusion*.51);
  let knolls=simplex3D(dir*28.0+offset.yzx+hills*.59);
  let district=smoothstep(-.38,.46,intrusion+.39*hills);
  let field=dir*13.0-2.1*along*strike+offset+
    mix(.48,1.20,district)*vec3<f32>(.60*hills,.67*intrusion,.42*knolls);
  let coarse=voro3D_metrics(field);
  let mass=graniteDome(coarse,.92);
  let foothills=.46*broad+.15*hills+.059*knolls-.10;
  let outcrop=smoothstep(-.65,.37,intrusion+.28*hills);
  let packing=district*mix(.54,1.0,smoothstep(-.43,.52,knolls-.32*intrusion));
  var domes=mix(.31,.94,district)*mass;
  if(granite>.14 && outcrop>0.0){
    let medium=voro3D_metrics(field.yzx*2.14-offset.zxy);
    let knoll=graniteDome(medium,.83);
    let interstice=1.0-smoothstep(.45,.94,mass);
    domes+=smoothstep(.14,.49,granite)*mix(.09,.61,packing)*knoll*mix(.30,1.0,interstice);
    let fine=1.0-smoothstep(.004,.013,texel*options.sphereFeatureDensity);
    if(granite>.46 && fine>0.0){
      let blocks=voro3D_metrics(field.zxy*4.36-offset.yzx);
      domes+=fine*smoothstep(.46,.77,granite)*mix(.06,.17,packing)*graniteDome(blocks,.70);
    }
  }
  return foothills+outcrop*domes-height;
}

fn studio_mosaic(dir:vec3<f32>)->vec2<f32>{
  let key=params.seed*1664525u+1013904223u;
  let selection=key>>30u;
  let phase=f32(key&65535u)*(TWO_PI/65536.0);
  let bend=sin(dot(dir,vec3<f32>(-3.4,6.2,4.1))-phase);
  let belt=.72*sin(dot(dir,vec3<f32>(7.2,-4.6,3.8))+phase+.94*bend)+
    .28*sin(dot(dir,vec3<f32>(11.8,5.7,-7.3))-phase);
  return vec2<f32>(select(smoothstep(.15,.78,belt),0.0,selection==1u),
    select(smoothstep(.15,.78,-belt),0.0,selection==0u));
}

fn studioLandscape(dir:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>,canyon:f32)->f32{
  let mode=options.sphereLandscape;
  var mixWeights=vec2<f32>(select(0.0,1.0,mode==1u),select(0.0,1.0,mode==2u));
  if(mode==3u){mixWeights=studio_mosaic(dir);}
  if(mixWeights.x+mixWeights.y<=0.0){return height;}
  let province=simplex3D(dir*4.1+offset.yzx);
  let local=mix(1.0,smoothstep(-.58,.42,province),options.sphereBlend);
  let influence=options.sphereLandscapeStrength*select(local,1.0,mode==3u);
  let fold=simplex3D(dir*9.0-offset.zxy);
  if(mixWeights.x>0.0){
    // The broad profile sets the tablelands. Each contact has its own
    // elevation and thickness, and folds tilt whole runs of benches.
    let tilt=.09*fold+.08*dot(dir,vec3<f32>(.64,-.72,.38));
    let spacing=mix(.37,.65,smoothstep(-.65,.65,province+.27*fold));
    let column=(mix(broad,height,.80)-tilt)/spacing;
    let seed=params.seed+3167u;
    var layer=i32(floor(column));
    if(column<canyon_contact(layer,seed)){layer-=1;}
    let base=canyon_contact(layer,seed);
    let top=canyon_contact(layer+1,seed);
    let phase=clamp((column-base)/(top-base),0.0,1.0);
    let rim=mix(.38,.62,canyon_bed_random(layer,seed+9029u));
    let step=mix(phase,smoothstep(rim-.19,rim+.20,phase),.67);
    let table=(base+(top-base)*step)*spacing+tilt;
    let wash=abs(simplex3D(dir*23.0+offset.zxy+.97*fold));
    let cut=(1.0-smoothstep(.045,.32,wash))*.15;
    // Resistant horizons cross the region at different elevations. The
    // same eroded outline controls the apron, intermediate bench and cap.
    let block=simplex3D(dir*14.0+offset.zxy+.70*fold)+.24*simplex3D(dir*33.0-offset.yzx);
    let cap=.60+.36*province+.08*fold+tilt;
    let interval=mix(.21,.38,smoothstep(-.65,.65,fold-.28*province));
    let apron=smoothstep(-.48,-.27,block);
    let lowerCliff=smoothstep(-.28,-.10,block);
    let upperCliff=smoothstep(-.02,.16,block);
    let basin=mix(table-cut,min(table-cut,cap-1.85*interval),apron);
    let benchExposure=smoothstep(-.40,.53,fold+.31*province);
    let bench=mix(basin,cap-1.70*interval,mix(.24,.76,benchExposure)*apron);
    let shoulder=mix(bench,cap-.87*interval,lowerCliff);
    var landform=mix(shoulder,cap,upperCliff);
    let brokenRim=smoothstep(-.39,-.24,block)*(1.0-smoothstep(-.065,.085,block));
    if(brokenRim>0.0){
      // Closely spaced gullies isolate resistant fingers along some rims.
      // The pinnacles taper into the same bedrock as the adjoining cliffs.
      let weathering=smoothstep(-.05,.54,province+.65*fold);
      let fractures=abs(simplex3D(dir*47.0-offset.zxy+1.12*block));
      let ribs=(1.0-smoothstep(.055,.31,fractures))*brokenRim*weathering;
      let remnant=min(cap-.045,landform+interval*(.86+.56*wash));
      landform=mix(landform,max(landform,remnant),ribs);
    }
    let upland=smoothstep(-.98,-.26,broad);
    let strength=max(influence,options.sphereLandscapeStrength*smoothstep(.20,.68,canyon));
    let plateau=smoothstep(-.35,.45,province+.32*fold);
    return mix(height,landform,mixWeights.x*strength*upland*mix(.54,.91,plateau));
  }
  // Outward billows grow from the same coarse landscape. Smaller octaves
  // break up the shoulders while the host valleys remain between them.
  let p=dir*12.0+offset+vec3<f32>(.89*fold,.71*province,-.64*fold);
  let a=simplex3D(p);
  let b=simplex3D(p.yzx*2.07-offset.zxy+.68*a);
  let c=simplex3D(p.zxy*4.31+offset.yzx+.56*b);
  let d=simplex3D(p*8.91-offset+.51*c);
  let fbm=a+.49*b+.235*c+.106*d;
  let lobe=max(0.0,fbm+.31);
  let face=smoothstep(.04,.62,lobe);
  let ribs=1.0-smoothstep(.025,.32,abs(b+.46*c));
  return height+mixWeights.y*influence*(.64*lobe*min(.98,lobe)+.27*face*ribs-.10*face);
}

fn studioWindRelief(dir:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>,rock:vec4<f32>)->f32{
  let arid=studio_dryness(dir,rock,params.seed)*options.sphereBlend;
  if(arid<.025){return 0.0;}
  let wind=studio_wind_dir(params.seed);
  let along=dot(dir,wind);
  let across=dot(dir,vec3<f32>(-wind.z,0,wind.x));
  let warp=simplex3D(dir*11.0-offset.zxy);
  let corridor=simplex3D(vec3<f32>(along*10.0,across*37.0,dir.y*19.0)+offset.yzx+.55*warp);
  // Sand collects below the harder rock and thins across exposed uplands.
  let sediment=(1.0-smoothstep(.13,.58,broad))*(1.0-smoothstep(.10,.39,abs(height-broad)));
  let phase=fract(along*36.0+2.3*warp+.58*corridor+.28*cos(across*31.0+warp*3.1));
  let crest=mix(.50,.79,smoothstep(-.46,.46,warp));
  let dune=min(phase/crest,(1.0-phase)/(1.0-crest));
  let sand=sediment*smoothstep(-.63,.17,corridor)*(.37*dune*dune-.074-.75*(height-broad));
  // Wind runs along the resistant ribs. The soft material between them
  // wears into broad corridors that can still be cut by downstream runoff.
  let rib=studioRidge(corridor,.47);
  let erodible=smoothstep(-.53,.37,warp)*smoothstep(-.46,.15,broad);
  let abrasion=(1.0-sediment)*erodible*(.32*rib*rib-.19);
  let mesaRock=rock.y*smoothstep(-.02,.52,broad);
  return arid*smoothstep(.025,.13,arid)*(sand+abrasion)*(1.0-.65*mesaRock);
}

fn studioFaultRelief(dir:vec3<f32>,height:f32,broad:f32,offset:vec3<f32>,rock:vec4<f32>)->f32{
  let crystalline=4.0*rock.z*rock.w;
  let sedimentary=4.0*rock.y*rock.z;
  let susceptible=options.sphereBlend*(.37*rock.w+.67*crystalline+.36*sedimentary);
  if(susceptible<.025){return 0.0;}

  let strike=normalize(fract(offset*vec3<f32>(.109,.073,.127))-.5+vec3<f32>(.001));
  let east=normalize(cross(strike,select(vec3<f32>(0,1,0),vec3<f32>(1,0,0),abs(strike.y)>.9)));
  let plane=vec3<f32>(dot(dir,east),dot(dir,strike),dot(dir,cross(east,strike)));
  let extension=simplex3D(dir*4.6+offset.zxy);
  let activity=smoothstep(-.43,.37,extension);
  if(activity<=0.0){return 0.0;}
  let blocks=plane*vec3<f32>(15.0,5.0,10.0)+vec3<f32>(.84,.24,.45)*extension;
  let trace=simplex3D(blocks-offset);
  let relay=simplex3D(blocks*vec3<f32>(.74,2.7,1.6)+offset.yzx);

  // The hanging wall drops into the rift. Its footwall has a steep face
  // and a long tilted backslope. A relay passes the throw between strands.
  let slip=mix(.24,.76,smoothstep(-.56,.57,relay));
  let hanging=trace+.19*relay;
  let scarp=smoothstep(-.08,.135,hanging);
  let backSlope=1.0-smoothstep(.25,.97,hanging);
  let floor=1.0-smoothstep(.12,mix(.34,.68,slip),abs(hanging+.21));
  let outlet=smoothstep(.13,.57,abs(relay-.25*trace));
  let rift=floor*(.72+.28*outlet);
  let shoulder=scarp*backSlope*(.29+.17*slip);
  let shelf=smoothstep(.04,.20,hanging)*(1.0-smoothstep(.22,.41,hanging));
  let tilt=.17*scarp*hanging*smoothstep(-.49,.68,broad);
  let incision=(.42+.33*slip)*rift;
  // Preserve rough bedrock above the scarp and partially bury it on the
  // valley floor, where runoff will cut tributaries into the faulted blocks.
  let fill=.58*rift*(broad-height);
  return susceptible*activity*(shoulder+.10*shelf*crystalline-tilt-incision+fill);
}

// The same contact field runs through the whole sphere. It shapes rock
// where two provinces meet and leaves each pure province to its own profile.
fn studioContactRelief(dir:vec3<f32>,broad:f32,offset:vec3<f32>,rock:vec4<f32>)->f32{
  let graniteBelt=4.0*rock.x*rock.z;
  let tiltedBeds=4.0*rock.x*rock.y;
  let lavaPlateau=4.0*rock.w*rock.y;
  let sandstoneFins=4.0*rock.z*rock.y;
  let volcanicHighlands=4.0*rock.w*rock.x;
  let strength=graniteBelt+tiltedBeds+lavaPlateau+sandstoneFins+volcanicHighlands;
  if(strength<.008){return 0.0;}
  let uplift=smoothstep(-.57,.32,broad);
  if(uplift<=0.0){return 0.0;}

  let axis=normalize(fract(offset*vec3<f32>(.071,.113,.137))-.5+vec3<f32>(.001));
  let across=normalize(cross(axis,select(vec3<f32>(0,1,0),vec3<f32>(0,0,1),abs(axis.y)>.90)));
  let chart=vec3<f32>(dot(dir,across),dot(dir,cross(axis,across)),dot(dir,axis));
  let flexure=simplex3D(dir*6.3+offset.zxy);
  let belt=chart*vec3<f32>(22.0,8.0,11.0)+vec3<f32>(.68,.23,.39)*flexure;
  let line=simplex3D(belt+offset.yzx);
  let joints=simplex3D(belt*vec3<f32>(1.39,2.53,2.12)-offset+.24*line);

  // Granite ribs survive along the divide. Weathering widens the spaces
  // between them toward the domes and breaks their ends into rock steps.
  let rib=studioRidge(line,.81);
  let joint=1.0-smoothstep(.03,.26,abs(joints));
  let granite=.42*(rib*mix(.64,1.0,rib)-.29)-.14*joint*rib;

  // Folded beds leave triangular remnants on the softer flanks of a range.
  let dip=mix(.53,1.03,smoothstep(-.52,.52,flexure));
  let flank=abs(line)/select(dip,1.45-dip,line>0.0);
  let jointLine=abs(joints+.41*line);
  let wedge=max(0.0,min(1.0-flank,1.02-1.35*jointLine));
  let flankGully=smoothstep(.11,.46,flank)*(1.0-smoothstep(.84,1.24,flank))*
    smoothstep(.27,.61,jointLine);
  let flatiron=.77*wedge-.25*flankGully-.20;

  // Resistant lava caps a valley fill. Breaches in the cap become outlets
  // for runoff during the following erosion passes.
  let flow=smoothstep(-.42,.34,line+.37*flexure);
  let breach=1.0-smoothstep(.06,.42,abs(joints+.44*line));
  let cap=flow*mix(.19,.43,smoothstep(-.44,.44,flexure))*(1.0-.84*breach);
  let terrace=cap-.19*breach*smoothstep(.12,.76,flow)-.12;

  // Broken sedimentary ribs taper into the older crystalline floor. The
  // crest is offset by joints so the fins bend, break, and vary in length.
  let finAxis=abs(line+.21*joints);
  let fin=1.0-smoothstep(.08,.42,finAxis);
  let cover=smoothstep(-.48,.33,joints+.32*flexure);
  let shoulder=1.0-smoothstep(.23,.68,finAxis);
  let fins=cover*(.47*fin*fin+.15*shoulder)-.16;

  // Solid lava shoulders follow the flanks of the alpine divide. Glancing
  // fractures open into gullies while the harder flow tops remain above them.
  let flankRock=smoothstep(.14,.52,flank)*(1.0-smoothstep(.78,1.26,flank));
  let flowCap=smoothstep(-.42,.24,joints-.51*line)*flankRock;
  let spurCut=joint*smoothstep(.27,.93,flank);
  let basalt=.49*flowCap-.24*spurCut-.07;
  return uplift*smoothstep(.008,.065,strength)*
    (graniteBelt*granite+tiltedBeds*flatiron+lavaPlateau*terrace+
     sandstoneFins*fins+volcanicHighlands*basalt);
}

// Hotspots track an oblique arc. Older cones broaden and subside along it.
// The surrounding swell is wide enough for islands to emerge in ocean basins.
fn studioIslandArc(dir:vec3<f32>,broad:f32,texel:f32)->vec2<f32>{
  var height=0.0;
  var influence=0.0;
  var collapse=0.0;
  let density=options.sphereFeatureDensity;
  for(var chain=0u;chain<6u;chain++){
    let q=(seedOffset3(params.seed+chain*7302013u)-vec3<f32>(17.173,31.947,47.521))/
      vec3<f32>(131,137,149);
    let y=1.72*q.x-.86;
    let ring=sqrt(1.0-y*y);
    let angle=TWO_PI*q.y;
    let center=vec3<f32>(ring*cos(angle),y,ring*sin(angle));
    let span=max(0.0,2.0-2.0*dot(dir,center));
    if(span*density*density>.065){continue;}
    let east=vec3<f32>(-sin(angle),0,cos(angle));
    let course=normalize(east+(q.z-.5)*1.55*cross(center,east));
    if(q.z>.30){
      let tangent=cross(center,course);
      let flow=normalize(tangent+(q.y-.5)*course);
      let local=density*vec2<f32>(dot(dir,flow),dot(dir,cross(center,flow)));
      collapse=min(collapse,lava_tube_collapse(local,.047,mix(.12,.18,q.z),params.seed+chain*23179u,texel*density));
    }
    for(var i=0u;i<4u;i++){
      let age=f32(i)/3.0;
      let vent=normalize(center+course*((age-.50)*.22/density));
      let size=mix(.065,.029,age)*mix(.86,1.2,q.z)/density;
      let d=sqrt(max(0.0,2.0-2.0*dot(dir,vent)))/size;
      let tangent=normalize(course-vent*dot(vent,course));
      let local=vec2<f32>(dot(dir,tangent),dot(dir,cross(vent,tangent)))/size;
      let young=mix(.91,.37,age)*mix(.90,1.1,q.z);
      let shape=vec3<f32>(young,q.z,fract(q.x+age*1.7));
      let cone=volcanic_vent(local,shape,.065*simplex3D(dir*96.0+q*17.0));
      let pedestal=.32*(1.0-smoothstep(.22,1.64,d))*(1.0-smoothstep(-.60,.28,broad));
      height=max(height,cone+pedestal);
      influence=max(influence,1.0-smoothstep(.48,1.76,d));
    }
  }
  return vec2<f32>(height+collapse,influence);
}

@compute @workgroup_size(8,8,1)
fn computeStudioSphereRelief(@builtin(global_invocation_id) gid:vec3<u32>){
  let x=i32(gid.x)+frame.originX;
  let y=i32(gid.y)+frame.originY;
  let last=i32(frame.fullWidth)-1;
  if(x>last||y>last){return;}
  let col=x%last;
  let raw=studioSphereHeight(col,y,last);
  let step=PI/f32(last);
  let latitude=f32(y)*step;
  let longitude=2.0*f32(col)*step;
  let radial=sin(latitude);
  let dir=vec3<f32>(select(radial*cos(longitude),0.0,y==0||y==last),cos(latitude),
    select(radial*sin(longitude),0.0,y==0||y==last));
  var broad=raw;
  if(params.voroMode!=3u||options.sphereBlend>0.0){
    let spanY=max(1,i32(round(f32(last)*.017/options.sphereFeatureDensity)));
    let spanX=max(1,i32(round(f32(spanY)/max(.50,2.0*radial))));
    let around=studioSphereHeight(col-spanX,y-spanY,last)+studioSphereHeight(col+spanX,y-spanY,last)+
      studioSphereHeight(col-spanX,y+spanY,last)+studioSphereHeight(col+spanX,y+spanY,last);
    // The longitude box ceases to describe a square near a pole.
    broad=mix(raw,.28*raw+.18*around,smoothstep(.035,.155,radial));
  }
  let texel=step*max(1.0,2.0*radial);
  var regions=vec4<f32>(0);
  if(options.sphereRegion.z>0.0){regions=studio_region_map(dir);}
  storeRGBA(x,y,0,studio_sphere_relief(dir,raw,broad,texel,regions));
}

fn studio_sphere_relief(dir:vec3<f32>,raw:f32,broad:f32,texel:f32,regions:vec4<f32>)->vec4<f32>{
  let radial=length(dir.xz);
  let offset=seedOffset3(params.seed);
  var arc=vec2<f32>(0);
  if(options.sphereBlend>0.0){arc=studioIslandArc(dir,broad,texel);}
  var weights=regions;
  if(options.sphereRegion.z==0.0){weights=studioProvinces(dir,offset,arc.y);}
  var relief=0.0;
  if(weights.x>0.0){relief+=weights.x*studioMountainRange(dir,raw,broad,offset);}
  if(weights.z>0.0){relief+=weights.z*studioGraniteRelief(dir,raw,broad,offset,weights.z,texel);}
  if(weights.w>0.0){
    let volcanic=studioVolcanicRelief(dir,texel);
    let craters=studioVolcanicCraterFields(dir,broad,weights.w);
    relief+=weights.w*(volcanic.x+craters.x+max(volcanic.y,craters.y)*(broad-raw));
  }
  if(weights.y>0.0){
    // Broad caprock takes over inside sandstone country while the
    // existing province weights still blend it into neighboring ranges.
    let caprock=smoothstep(.10,.76,weights.y);
    relief=relief*((1.0-caprock)/max(.001,1.0-weights.y))+
      caprock*studioCanyonRelief(dir,raw,broad,offset);
  }
  relief+=studioContactRelief(dir,broad,offset,weights);
  relief+=studioWindRelief(dir,raw,broad,offset,weights);
  relief+=studioFaultRelief(dir,raw,broad,offset,weights);
  // A hot island can interrupt its host province without a terrain seam.
  relief+=arc.x*options.sphereBlend;
  var cap=0.0;
  if(radial<.23){
    // Reintroduce midsize landforms where longitude-based erosion fades.
    // The noise is evaluated in 3D, so ridges continue across the pole.
    let folds=simplex3D(dir*27.0+offset.zxy);
    let crest=studioRidge(simplex3D(dir*49.0-offset+folds*.69),.75);
    let rubble=simplex3D(dir*79.0+offset.yzx);
    let sharp=mix(.16,.26,weights.x+weights.y*.6);
    cap=(1.0-smoothstep(.075,.23,radial))*(.11*folds+.68*sharp*(crest*crest-.36)+.052*rubble);
  }
  var height=raw+relief+cap;
  if(options.sphereLandscape!=0u&&options.sphereLandscapeStrength>0.0){
    height=studioLandscape(dir,height,broad,offset,weights.y);
  }
  return vec4<f32>(height,weights.yzw);
}

fn applyStudioSphereErosion(gid:vec3<u32>,mountain:bool){
  let x=i32(gid.x)+frame.originX;
  let y=i32(gid.y)+frame.originY;
  let last=i32(frame.fullWidth)-1;
  if(x>last||y>last){return;}
  let col=x%last;
  let sample=loadPrevRGBA(col,y,0);
  let h=sample.x;
  let canyon=sample.y;
  let regional=options.sphereBlend>0.0;
  let ranges=params.voroMode<=1u||regional;
  if(y==0||y==last||(!mountain&&ranges&&!regional)){
    storeRGBA(x,y,0,sample);
    return;
  }
  let step=PI/f32(last);
  let latitude=f32(y)*step;
  let longitude=2.0*f32(col)*step;
  let radial=sin(latitude);
  let dir=vec3<f32>(radial*cos(longitude),cos(latitude),radial*sin(longitude));
  let east=vec3<f32>(-sin(longitude),0,cos(longitude));
  let north=cross(east,dir);
  var rise:vec2<f32>;
  var bankBend=vec2<f32>(0);
  if(mountain){
    // The angular window stays wide on smaller bakes and near the poles.
    let guideY=max(2,i32(round(f32(last)*select(.012,.0045,ranges))));
    let guideX=max(1,i32(round(f32(guideY)/max(.5,2.0*radial))));
    rise=vec2<f32>(
      (studioSphereHeight(col+guideX,y,last)-studioSphereHeight(col-guideX,y,last))/f32(guideX),
      (studioSphereHeight(col,y-guideY,last)-studioSphereHeight(col,y+guideY,last))/f32(guideY)
    );
  }else{
    // The local gullies read the mountain cuts from the previous dispatch.
    let localX=studioSphereHeight(col+1,y,last)-studioSphereHeight(col-1,y,last);
    let localY=studioSphereHeight(col,y-1,last)-studioSphereHeight(col,y+1,last);
    let wideHigh=vec2<f32>(studioSphereHeight(col+4,y,last),studioSphereHeight(col,y-4,last));
    let wideLow=vec2<f32>(studioSphereHeight(col-4,y,last),studioSphereHeight(col,y+4,last));
    rise=mix(vec2<f32>(localX,localY),(wideHigh-wideLow)*.25,.76);
    if(canyon>0.0){
      // Match the angular span along both axes without fetching more heights.
      let ratio=max(.5,2.0*radial);
      let referenceSpan=(.023/(4.0*step))*(f32(last)/1000.0);
      bankBend=(wideHigh+wideLow-2.0*h)*vec2<f32>(1.0/(ratio*ratio),1.0)*referenceSpan;
    }
  }
  let dx=rise.x/(4.0*step*max(radial,.03));
  let dy=rise.y/(2.0*step);
  let grade=vec2<f32>(dx,dy);
  let angularSample=step*max(1.0,2.0*radial);
  storeRGBA(x,y,0,vec4<f32>(studio_point_erosion(dir,sample,grade,east*dx+north*dy,bankBend,
    angularSample,mountain,ranges),sample.yzw));
}

fn studio_point_erosion(dir:vec3<f32>,sample:vec4<f32>,rise:vec2<f32>,gradient:vec3<f32>,
  bankBend:vec2<f32>,angularSample:f32,mountain:bool,ranges:bool)->f32{
  let h=sample.x;
  let canyon=sample.y;
  let granite=sample.z;
  let volcanic=sample.w;
  let alpine=clamp(1.0-canyon-granite-volcanic,0.0,1.0);
  let grade=.023*length(gradient);
  let mountainWear=smoothstep(.042,.25,grade)*select(1.0,.50,params.voroMode==3u);
  let rangeWear=smoothstep(-.58,.10,h)*mix(.82,1.0,mountainWear);
  let localWear=smoothstep(.06,.43,grade)*(canyon+.55*volcanic+.10*granite);
  let wear=select(
    select(smoothstep(.06,.43,grade),mountainWear,mountain),
    select(localWear,rangeWear*(1.16*alpine+.15*canyon+.45*volcanic+.12*granite),mountain),
    ranges);
  let polar=smoothstep(.055,.25,length(dir.xz));
  if(wear<=0.0){
    return h;
  }
  let blend=smoothstep(-.19,.19,dir.y);
  var delta=0.0;
  if(blend>0.0){
    let chart=studioErosionChart(dir,gradient,1.0,angularSample);
    if(mountain){delta+=blend*studioMountainCut(chart,h,ranges);}
    else{delta+=blend*studioGullyCut(chart,h);}
  }
  if(blend<1.0){
    let chart=studioErosionChart(dir,gradient,-1.0,angularSample);
    if(mountain){delta+=(1.0-blend)*studioMountainCut(chart,h,ranges);}
    else{delta+=(1.0-blend)*studioGullyCut(chart,h);}
  }
  delta*=wear;
  if(mountain){
    let eroded=h+polar*delta;
    let upland=max(0.0,eroded-.42);
    // Compress the vertical relief of the upper mountain belt. Crests and
    // branch cuts keep their shapes while broad slopes keep a wider base.
    let compression=.29*upland*upland/(.34+upland)*polar*alpine;
    return eroded-compression;
  }
  let elevation=h+delta;
  var ledge=0.0;
  if(canyon>0.0){
    let strata=canyon_bed(dir,elevation,params.seed);
    let resistant=smoothstep(.25,.83,strata.cement);
    let gully=canyon_gully_wear(rise,bankBend,grade,-delta);
    let exposure=smoothstep(.075,.49,grade)*
      (1.0-mix(.64,.24,resistant)*smoothstep(.025,.22,-delta));
    // Recess the shelf through the tributary and leave the adjacent spur proud.
    ledge+=canyon*(.72*strata.displacement*exposure*(1.0-mix(.89,.63,resistant)*gully)-.087*gully);
  }
  if(volcanic>0.0&&grade>.12){
    let flowBed=basalt_flow(dir,elevation,params.seed);
    let exposure=volcanic*smoothstep(.12,.56,grade);
    let scour=smoothstep(.02,.20,-delta);
    ledge+=exposure*((1.0+.72*alpine)*flowBed.displacement-.065*flowBed.ash*scour);
  }
  return h+polar*(delta+ledge);
}

@compute @workgroup_size(8,8,1)
fn computeStudioSphereMountainErosion(@builtin(global_invocation_id) gid:vec3<u32>){
  applyStudioSphereErosion(gid,true);
}

@compute @workgroup_size(8,8,1)
fn computeStudioSphereErosion(@builtin(global_invocation_id) gid:vec3<u32>){
  applyStudioSphereErosion(gid,false);
}

@compute @workgroup_size(8, 8, 1)
fn computeTerrainNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  let pos = fetchPos(fx, fy, fz);
  let v0 = generateTerrainNoise(pos, params);
  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeSmokeNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  let pos = fetchPos(fx, fy, fz);
  let v0 = generateSmokeNoise(pos, params);
  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeHydrologyErosionHeightfield(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (readFrom3D() || writeTo3D()) {
    return;
  }

  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  let src = loadPrevClamped2D(fx, fy, fz);
  let pos = fetchPos(fx, fy, fz);

  var baseHeight = src.x;
  var guideHeight = src.x;
  let rawSlope = resolveFiniteSlope2D(fx, fy, fz);
  var guideSlope = rawSlope;

  if (params.turbulence != 0u) {
    baseHeight = src.w;
    guideHeight = src.x;
    guideSlope = src.yz;

    if (length(guideSlope) < 1e-8) {
      guideSlope = rawSlope;
    }
  }

  let steerSlope = mix(rawSlope, guideSlope, 0.82);
  let fadeHeight = mix(baseHeight, guideHeight, 0.35);

  var erosionScale = params.zoom;
  if (abs(erosionScale) < 1e-6) {
    erosionScale = 0.15;
  }

  var domainScale = params.freq;
  if (abs(domainScale) < 1e-6) {
    domainScale = 1.0;
  }

  var erosionStrength = options.heightScale;
  if (abs(erosionStrength) < 1e-6) {
    erosionStrength = 1.0;
  }
  erosionStrength *= 0.22;

  var gullyWeight = params.exp1;
  if (abs(gullyWeight) < 1e-6) {
    gullyWeight = 0.5;
  }

  var carrierWeight = max(params.edgeK, 0.0);
  if (carrierWeight < 1e-6) {
    carrierWeight = 0.24;
  }
  carrierWeight = clamp01(carrierWeight);

  var steeringWeight = max(params.time, 0.0);
  if (steeringWeight < 1e-6) {
    steeringWeight = 1.10;
  }

  var detail = params.seedAngle;
  if (abs(detail) < 1e-6) {
    detail = 1.5;
  }

  var fadeScale = params.exp2;
  if (abs(fadeScale) < 1e-6) {
    fadeScale = 1.6666667;
  }

  var cellScale = params.threshold;
  if (abs(cellScale) < 1e-6) {
    cellScale = 0.7;
  }

  var normalization = params.rippleFreq;
  if (abs(normalization) < 1e-6) {
    normalization = 0.5;
  }
  normalization = clamp01(normalization);

  var assumedSlopeValue = params.warpAmp;
  if (abs(assumedSlopeValue) < 1e-6) {
    assumedSlopeValue = 0.7;
  }
  assumedSlopeValue = max(assumedSlopeValue, 1e-4);

  var assumedSlopeMix = params.gaborRadius;
  if (abs(assumedSlopeMix) < 1e-6) {
    assumedSlopeMix = 1.0;
  }
  assumedSlopeMix = clamp01(assumedSlopeMix);

  var onsetScale = params.terraceStep;
  if (abs(onsetScale) < 1e-6) {
    onsetScale = 8.0;
  }
  onsetScale = max(onsetScale / 8.0, 1e-4);

  let rounding = vec4<f32>(
    0.10,
    0.00,
    0.10,
    max(params.lacunarity, 1.0)
  );

  let onset = vec4<f32>(
    1.25,
    1.25,
    2.80,
    1.50
  ) * onsetScale;

  let assumedSlope = vec2<f32>(assumedSlopeValue, assumedSlopeMix);

  let seedShift = vec2<f32>(
    f32(params.seed & 65535u) * 0.00001173,
    f32((params.seed >> 16u) & 65535u) * 0.00000937
  );

  let domainP =
    pos.xy * domainScale +
    vec2<f32>(params.xShift, params.yShift) +
    seedShift;

  let fadeTarget = clamp(((fadeHeight - 0.5 + params.zShift) * 2.0) * fadeScale, -1.0, 1.0);
  let pixelSpan = pixelSpan2D(fx, fy, fz);

  var ridgeMap = 0.0;
  let h = erosionFilter(
    domainP,
    vec3<f32>(baseHeight, steerSlope.x, steerSlope.y),
    fadeTarget,
    erosionStrength,
    gullyWeight,
    carrierWeight,
    steeringWeight,
    detail,
    rounding,
    onset,
    assumedSlope,
    erosionScale,
    max(params.octaves, 1u),
    max(params.lacunarity, 1.0),
    max(params.gain, 1e-4),
    cellScale,
    normalization,
    pixelSpan,
    &ridgeMap
  );

  let terrainHeightOffsetConst = options.baseRadius;

  let offset = terrainHeightOffsetConst * h.w;

  let erodedHeight = baseHeight + h.x + offset;
  let outSlope = steerSlope + h.yz;
  let ridgeMapEncoded = clamp01(ridgeMap * 0.5 + 0.5);

  storeRGBA(
    fx,
    fy,
    fz,
    vec4<f32>(erodedHeight, outSlope.x, outSlope.y, ridgeMapEncoded)
  );
}

@compute @workgroup_size(8, 8, 1)
fn computeHydrologyGuideField(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (readFrom3D() || writeTo3D()) {
    return;
  }

  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  let src = loadPrevClamped2D(fx, fy, fz);
  let rawHeight = src.x;

  var sigma = abs(params.threshold);
  if (sigma < 1e-6) {
    sigma = 0.90;
  }

  var guideBlend = params.exp1;
  if (abs(guideBlend) < 1e-6) {
    guideBlend = 0.35;
  }
  guideBlend = clamp01(guideBlend);

  let blurredC = guideHeightAt(fx, fy, fz, sigma);
  let blurredL = guideHeightAt(fx - 1, fy, fz, sigma);
  let blurredR = guideHeightAt(fx + 1, fy, fz, sigma);
  let blurredD = guideHeightAt(fx, fy - 1, fz, sigma);
  let blurredU = guideHeightAt(fx, fy + 1, fz, sigma);

  let guideHeight = mix(rawHeight, blurredC, guideBlend);
  let guideL = mix(loadPrevClamped2D(fx - 1, fy, fz).x, blurredL, guideBlend);
  let guideR = mix(loadPrevClamped2D(fx + 1, fy, fz).x, blurredR, guideBlend);
  let guideD = mix(loadPrevClamped2D(fx, fy - 1, fz).x, blurredD, guideBlend);
  let guideU = mix(loadPrevClamped2D(fx, fy + 1, fz).x, blurredU, guideBlend);

  let pL = fetchPosClamped2D(fx - 1, fy, fz);
  let pR = fetchPosClamped2D(fx + 1, fy, fz);
  let pD = fetchPosClamped2D(fx, fy - 1, fz);
  let pU = fetchPosClamped2D(fx, fy + 1, fz);

  let dx = max(abs(pR.x - pL.x), 1e-6);
  let dy = max(abs(pU.y - pD.y), 1e-6);

  let guideSlopeX = (guideR - guideL) / dx;
  let guideSlopeY = (guideU - guideD) / dy;

  storeRGBA(
    fx,
    fy,
    fz,
    vec4<f32>(guideHeight, guideSlopeX, guideSlopeY, rawHeight)
  );
}

fn computeHydroDrainageField(fx: i32, fy: i32, fz: i32) -> vec4<f32> {
  let coarseSigma = 1.75;

  let hC = blurredHeightAt(fx, fy, fz, coarseSigma);
  let hL = blurredHeightAt(fx - 1, fy, fz, coarseSigma);
  let hR = blurredHeightAt(fx + 1, fy, fz, coarseSigma);
  let hD = blurredHeightAt(fx, fy - 1, fz, coarseSigma);
  let hU = blurredHeightAt(fx, fy + 1, fz, coarseSigma);

  let pL = fetchPosClamped2D(fx - 1, fy, fz);
  let pR = fetchPosClamped2D(fx + 1, fy, fz);
  let pD = fetchPosClamped2D(fx, fy - 1, fz);
  let pU = fetchPosClamped2D(fx, fy + 1, fz);

  let dx = max(abs(pR.x - pL.x), 1e-6);
  let dy = max(abs(pU.y - pD.y), 1e-6);

  let slope = vec2<f32>(
    (hR - hL) / dx,
    (hU - hD) / dy
  );

  let flowDir = -safeNormalize2(slope);

  let ridgeBroad = blurredRidgeAt(fx, fy, fz, 1.6);
  let valleyPrior = 1.0 - smoothstep(-0.12, 0.08, ridgeBroad);

  let valleyDepth = max(0.0, (hL + hR + hD + hU) * 0.25 - hC);
  let concavityGain = max(abs(params.edgeK), 1e-4) * 36.0;
  let concavityMask = clamp01(valleyDepth * concavityGain);

  let slopeOnset = max(abs(params.warpAmp), 1e-4);
  let slopeMask = easeOut(clamp01(length(slope) / slopeOnset));

  let contrast = max(abs(params.exp1), 1e-4);
  let gain = max(abs(params.exp2), 1e-4);

  var drainage = valleyPrior * concavityMask * slopeMask;
  drainage = pow(clamp01(drainage), contrast);
  drainage = clamp01(drainage * gain);

  return vec4<f32>(
    drainage,
    valleyPrior,
    flowDir.x * 0.5 + 0.5,
    flowDir.y * 0.5 + 0.5
  );
}

@compute @workgroup_size(8, 8, 1)
fn computeHydrologyDrainageMask(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (readFrom3D() || writeTo3D()) {
    return;
  }

  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  let outCol = computeHydroDrainageField(fx, fy, fz);
  storeRGBA(fx, fy, fz, outCol);
}

// Shared tiling constants
const WGX : u32 = 8u;
const WGY : u32 = 8u;
const TILE_W : u32 = WGX + 2u; // 1 texel halo on each side
const TILE_H : u32 = WGY + 2u;

// Per-kernel workgroup tiles at module scope
var<workgroup> normalTile  : array<array<f32, TILE_W>, TILE_H>;
var<workgroup> normal8Tile : array<array<f32, TILE_W>, TILE_H>;
var<workgroup> volumeTile  : array<array<f32, TILE_W>, TILE_H>;
var<workgroup> sphereTile  : array<array<f32, TILE_W>, TILE_H>;

// Height fetch
fn sampleHeight(x: i32, y: i32, z: i32) -> f32 { if (readFrom3D()) { return textureLoad(inputTex3D, vec3<i32>(x, y, clampZ(z)), 0).x; } return textureLoad(inputTex, vec2<i32>(x, y), frame.layerIndex, 0).x; } fn safeNormalize(v: vec3<f32>) -> vec3<f32> { let len2 = dot(v, v); if (len2 > 1e-12) { return v * inverseSqrt(len2); } return vec3<f32>(0.0, 0.0, 1.0); }

@compute @workgroup_size(WGX, WGY, 1)
fn computeNormal(@builtin(global_invocation_id) gid: vec3<u32>,
                 @builtin(local_invocation_id)  lid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let wMax = i32(frame.fullWidth)  - 1;
  let hMax = i32(frame.fullHeight) - 1;

  let tx = i32(lid.x) + 1;
  let ty = i32(lid.y) + 1;

  let cx = clamp(fx, 0, wMax);
  let cy = clamp(fy, 0, hMax);

  // center
  normalTile[u32(ty)][u32(tx)] = sampleHeight(cx, cy, fz);

  // 1-texel halo
  if (lid.x == 0u)               { normalTile[u32(ty)][0u]               = sampleHeight(clamp(cx - 1, 0, wMax), cy, fz); }
  if (lid.x == WGX - 1u)         { normalTile[u32(ty)][TILE_W - 1u]      = sampleHeight(clamp(cx + 1, 0, wMax), cy, fz); }
  if (lid.y == 0u)               { normalTile[0u][u32(tx)]               = sampleHeight(cx, clamp(cy - 1, 0, hMax), fz); }
  if (lid.y == WGY - 1u)         { normalTile[TILE_H - 1u][u32(tx)]      = sampleHeight(cx, clamp(cy + 1, 0, hMax), fz); }
  if (lid.x == 0u && lid.y == 0u) {
    normalTile[0u][0u]            = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy - 1, 0, hMax), fz);
  }
  if (lid.x == WGX - 1u && lid.y == 0u) {
    normalTile[0u][TILE_W - 1u]   = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy - 1, 0, hMax), fz);
  }
  if (lid.x == 0u && lid.y == WGY - 1u) {
    normalTile[TILE_H - 1u][0u]   = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }
  if (lid.x == WGX - 1u && lid.y == WGY - 1u) {
    normalTile[TILE_H - 1u][TILE_W - 1u] = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }

  workgroupBarrier();

  // 4-neighbor central differences
  let zC = normalTile[u32(ty)][u32(tx)];
  let zL = normalTile[u32(ty)][u32(tx - 1)];
  let zR = normalTile[u32(ty)][u32(tx + 1)];
  let zD = normalTile[u32(ty - 1)][u32(tx)];
  let zU = normalTile[u32(ty + 1)][u32(tx)];

  let dx = (zR - zL) * 0.5;
  let dy = (zU - zD) * 0.5;

  let n   = normalize(vec3<f32>(dx, dy, 1.0));
  let enc = n * 0.5 + vec3<f32>(0.5);

  // pack: .r = original height, .g = enc.y, .b = enc.x, .a = enc.z
  let outCol = vec4<f32>(zC, enc.y, enc.x, enc.z);
  storeRGBA(cx, cy, fz, outCol);
}

// 8-neighbor filtered gradient using the same tile
@compute @workgroup_size(WGX, WGY, 1)
fn computeNormal8(@builtin(global_invocation_id) gid: vec3<u32>,
                  @builtin(local_invocation_id)  lid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let wMax = i32(frame.fullWidth)  - 1;
  let hMax = i32(frame.fullHeight) - 1;

  let tx = i32(lid.x) + 1;
  let ty = i32(lid.y) + 1;

  let cx = clamp(fx, 0, wMax);
  let cy = clamp(fy, 0, hMax);

  // center
  normal8Tile[u32(ty)][u32(tx)] = sampleHeight(cx, cy, fz);

  // halo
  if (lid.x == 0u)                    { normal8Tile[u32(ty)][0u]               = sampleHeight(clamp(cx - 1, 0, wMax), cy, fz); }
  if (lid.x == WGX - 1u)              { normal8Tile[u32(ty)][TILE_W - 1u]      = sampleHeight(clamp(cx + 1, 0, wMax), cy, fz); }
  if (lid.y == 0u)                    { normal8Tile[0u][u32(tx)]               = sampleHeight(cx, clamp(cy - 1, 0, hMax), fz); }
  if (lid.y == WGY - 1u)              { normal8Tile[TILE_H - 1u][u32(tx)]      = sampleHeight(cx, clamp(cy + 1, 0, hMax), fz); }
  if (lid.x == 0u && lid.y == 0u)     { normal8Tile[0u][0u]                    = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy - 1, 0, hMax), fz); }
  if (lid.x == WGX - 1u && lid.y == 0u) {
    normal8Tile[0u][TILE_W - 1u]      = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy - 1, 0, hMax), fz);
  }
  if (lid.x == 0u && lid.y == WGY - 1u) {
    normal8Tile[TILE_H - 1u][0u]      = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }
  if (lid.x == WGX - 1u && lid.y == WGY - 1u) {
    normal8Tile[TILE_H - 1u][TILE_W - 1u] = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }

  workgroupBarrier();

  let zC  = normal8Tile[u32(ty)][u32(tx)];
  let zL  = normal8Tile[u32(ty)][u32(tx - 1)];
  let zR  = normal8Tile[u32(ty)][u32(tx + 1)];
  let zD  = normal8Tile[u32(ty - 1)][u32(tx)];
  let zU  = normal8Tile[u32(ty + 1)][u32(tx)];
  let zUL = normal8Tile[u32(ty + 1)][u32(tx - 1)];
  let zUR = normal8Tile[u32(ty + 1)][u32(tx + 1)];
  let zDL = normal8Tile[u32(ty - 1)][u32(tx - 1)];
  let zDR = normal8Tile[u32(ty - 1)][u32(tx + 1)];

  let dx = ((zR + zUR + zDR) - (zL + zUL + zDL)) / 3.0;
  let dy = ((zU + zUR + zUL) - (zD + zDR + zDL)) / 3.0;

  let n   = normalize(vec3<f32>(dx, dy, 1.0));
  let enc = n * 0.5 + vec3<f32>(0.5);
  let outCol = vec4<f32>(zC, enc.y, enc.x, enc.z);
  storeRGBA(cx, cy, fz, outCol);
}

fn encode01(v: vec3<f32>) -> vec3<f32> {
    return v * 0.5 + vec3<f32>(0.5);
}

// Volume normals: tile the XY plane and only sample Z neighbors per pixel
@compute @workgroup_size(WGX, WGY, 1)
fn computeNormalVolume(@builtin(global_invocation_id) gid: vec3<u32>,
                       @builtin(local_invocation_id)  lid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let wMax = i32(frame.fullWidth)  - 1;
  let hMax = i32(frame.fullHeight) - 1;

  let tx = i32(lid.x) + 1;
  let ty = i32(lid.y) + 1;

  let cx = clamp(fx, 0, wMax);
  let cy = clamp(fy, 0, hMax);

  // center slice values once per tile
  volumeTile[u32(ty)][u32(tx)] = sampleHeight(cx, cy, fz);
  if (lid.x == 0u)                    { volumeTile[u32(ty)][0u]               = sampleHeight(clamp(cx - 1, 0, wMax), cy, fz); }
  if (lid.x == WGX - 1u)              { volumeTile[u32(ty)][TILE_W - 1u]      = sampleHeight(clamp(cx + 1, 0, wMax), cy, fz); }
  if (lid.y == 0u)                    { volumeTile[0u][u32(tx)]               = sampleHeight(cx, clamp(cy - 1, 0, hMax), fz); }
  if (lid.y == WGY - 1u)              { volumeTile[TILE_H - 1u][u32(tx)]      = sampleHeight(cx, clamp(cy + 1, 0, hMax), fz); }
  if (lid.x == 0u && lid.y == 0u)     { volumeTile[0u][0u]                    = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy - 1, 0, hMax), fz); }
  if (lid.x == WGX - 1u && lid.y == 0u) {
    volumeTile[0u][TILE_W - 1u]       = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy - 1, 0, hMax), fz);
  }
  if (lid.x == 0u && lid.y == WGY - 1u) {
    volumeTile[TILE_H - 1u][0u]       = sampleHeight(clamp(cx - 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }
  if (lid.x == WGX - 1u && lid.y == WGY - 1u) {
    volumeTile[TILE_H - 1u][TILE_W - 1u] = sampleHeight(clamp(cx + 1, 0, wMax), clamp(cy + 1, 0, hMax), fz);
  }

  workgroupBarrier();

  let zC = volumeTile[u32(ty)][u32(tx)];
  let zL = volumeTile[u32(ty)][u32(tx - 1)];
  let zR = volumeTile[u32(ty)][u32(tx + 1)];
  let zD = volumeTile[u32(ty - 1)][u32(tx)];
  let zU = volumeTile[u32(ty + 1)][u32(tx)];

  let dx = (zR - zL) * 0.5;
  let dy = (zU - zD) * 0.5;

  let zB = sampleHeight(cx, cy, clampZ(fz - 1));
  let zF = sampleHeight(cx, cy, clampZ(fz + 1));
  let dz = (zF - zB) * 0.5;

  let n   = safeNormalize(vec3<f32>(dx, dy, dz));
  let enc = encode01(n);
  storeRGBA(cx, cy, fz, vec4<f32>(enc, zC));
}


fn wrapSphereLon(lon: i32, width: i32) -> i32 {
    let segments = max(width - 1, 1);
    return ((lon % segments) + segments) % segments;
}

fn loadSphereHeight(lon: i32, lat: i32, width: i32, height: i32, layer: i32) -> f32 {
    let x = wrapSphereLon(lon, width);
    let y = clamp(lat, 0, height - 1);
    return textureLoad(inputTex, vec2<i32>(x, y), layer, 0).x;
}

fn sphereUnitFromAngles(theta: f32, phi: f32) -> vec3<f32> {
    let sTh = sin(theta);
    return vec3<f32>(sTh * cos(phi), sTh * sin(phi), cos(theta));
}

fn sphereSurfacePos(lat: i32, theta: f32, phi: f32, heightValue: f32, maxLat: i32) -> vec3<f32> {
    let r = options.baseRadius + heightValue * options.heightScale;

    if (lat <= 0) {
        return vec3<f32>(0.0, 0.0, r);
    }

    if (lat >= maxLat) {
        return vec3<f32>(0.0, 0.0, -r);
    }

    return sphereUnitFromAngles(theta, phi) * r;
}

// Sphere normals with logical longitude wrapping.
// The mesh keeps a duplicate seam column at lon == segments for Babylon/UVs, but
// the sampler treats longitude as modulo segments. This keeps lon 0 and lon N
// numerically identical and avoids the hard normal/color seam that shows up as a
// zipper around the planet.
@compute @workgroup_size(WGX, WGY, 1)
fn computeSphereNormal(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let w  = i32(frame.fullWidth);
    let h  = i32(frame.fullHeight);

    if (fx < 0 || fy < 0 || fx >= w || fy >= h) {
        return;
    }

    let segments = max(w - 1, 1);
    let maxLat = h - 1;
    let lon = wrapSphereLon(fx, w);
    let lat = clamp(fy, 0, maxLat);

    let baseH = loadSphereHeight(lon, lat, w, h, frame.layerIndex);
    let dPhi = 2.0 * PI / f32(segments);
    let dTheta = PI / f32(max(maxLat, 1));
    let theta = f32(lat) * dTheta;
    let phi = f32(lon) * dPhi;

    var n: vec3<f32>;

    if (lat <= 0) {
        n = vec3<f32>(0.0, 0.0, 1.0);
    } else if (lat >= maxLat) {
        n = vec3<f32>(0.0, 0.0, -1.0);
    } else {
        let hW = loadSphereHeight(lon - 1, lat, w, h, frame.layerIndex);
        let hE = loadSphereHeight(lon + 1, lat, w, h, frame.layerIndex);
        let hS = loadSphereHeight(lon, lat - 1, w, h, frame.layerIndex);
        let hN = loadSphereHeight(lon, lat + 1, w, h, frame.layerIndex);

        let pW = sphereSurfacePos(lat, theta, phi - dPhi, hW, maxLat);
        let pE = sphereSurfacePos(lat, theta, phi + dPhi, hE, maxLat);
        let pS = sphereSurfacePos(lat - 1, theta - dTheta, phi, hS, maxLat);
        let pN = sphereSurfacePos(lat + 1, theta + dTheta, phi, hN, maxLat);

        let tLon = pE - pW;
        let tLat = pN - pS;
        let radial = sphereUnitFromAngles(theta, phi);
        n = safeNormalize(cross(tLat, tLon));

        if (dot(n, radial) < 0.0) {
            n = -n;
        }
    }

    let enc = n * 0.5 + vec3<f32>(0.5);
    textureStore(outputTex, vec2<i32>(fx, fy), frame.layerIndex, vec4<f32>(baseH, enc.x, enc.y, enc.z));
}


// Texture clear to reset channel(s)
@compute @workgroup_size(8, 8, 1)
fn clearTexture(@builtin(global_invocation_id) gid : vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  writeChannel(fx, fy, fz, 0.0, options.outputChannel, 1u);
}

// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014
// 0) Perlin
// \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014
@compute @workgroup_size(8, 8, 1)
fn computePerlin(@builtin(global_invocation_id) gid : vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);

    // fetch the 3D position for this pixel
    let p  = fetchPos(fx, fy, fz);

    // generate one sample of Perlin noise
    let v0 = generatePerlin(p, params);

    // add it into the selected channel (or all channels) of the output
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 0.1) Perlin 4D (fBM using time as W)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computePerlin4D(@builtin(global_invocation_id) gid : vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);

    // fetch the 3D position for this pixel (w comes from params.time inside the generator)
    let p  = fetchPos(fx, fy, fz);

    // generate one sample of 4D Perlin fBM (uses params.time as 4th dim)
    let v0 = generatePerlin4D(p, params);

    // write into output
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 1) Billow
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeBillow(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateBillow(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 2) AntiBillow
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiBillow(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiBillow(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 3) Ridge
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRidge(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRidge(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 4) AntiRidge
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiRidge(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiRidge(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 5) RidgedMultifractal
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRidgedMultifractal(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRidgedMultifractal(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 6) RidgedMultifractal2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRidgedMultifractal2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRidgedMultifractal2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 7) RidgedMultifractal3
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRidgedMultifractal3(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRidgedMultifractal3(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 8) RidgedMultifractal4
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRidgedMultifractal4(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRidgedMultifractal4(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 9) AntiRidgedMultifractal
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiRidgedMultifractal(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiRidgedMultifractal(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 10) AntiRidgedMultifractal2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiRidgedMultifractal2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiRidgedMultifractal2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 11) AntiRidgedMultifractal3
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiRidgedMultifractal3(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiRidgedMultifractal3(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 12) AntiRidgedMultifractal4
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiRidgedMultifractal4(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiRidgedMultifractal4(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 13) FBM (2\xB7simplex chain)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFBM(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFBM(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 14) FBM2 (chain+zoom FBM)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFBM2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFBM2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 15) FBM3 (three-stage FBM chain)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFBM3(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFBM3(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 16) CellularBM1
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellularBM1(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateCellularBM1(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 17) CellularBM2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellularBM2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateCellularBM2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 18) CellularBM3
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellularBM3(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateCellularBM3(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 19) VoronoiBM1
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM1(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiBM1(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 20) VoronoiBM2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiBM2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 21) VoronoiBM3
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM3(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiBM3(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 22) Cellular
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellular(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateCellular(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  22.1) AntiCellular
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
@compute @workgroup_size(8, 8, 1)
fn computeAntiCellular(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiCellular(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 22.2) Cellular
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellular4D(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateCellular4D(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  22.3) AntiCellular
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
@compute @workgroup_size(8, 8, 1)
fn computeAntiCellular4D(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiCellular4D(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 23) Worley
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeWorley(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateWorley(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

/*\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  23.1) AntiWorley
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500*/
@compute @workgroup_size(8, 8, 1)
fn computeAntiWorley(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateAntiWorley(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 23.2) Worley 4D (fBM using time as W)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeWorley4D(@builtin(global_invocation_id) gid : vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);

    // fetch the 3D position for this pixel (w comes from params.time inside the generator)
    let p  = fetchPos(fx, fy, fz);

    // generate one sample of 4D Worley fBM (uses params.time as 4th dim)
    let v0 = generateWorley4D(p, params);

    // write into output
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 23.3) Worley 4D (fBM using time as W)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeAntiWorley4D(@builtin(global_invocation_id) gid : vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);

    // fetch the 3D position for this pixel (w comes from params.time inside the generator)
    let p  = fetchPos(fx, fy, fz);

    // generate one sample of 4D Worley fBM (uses params.time as 4th dim)
    let v0 = generateAntiWorley4D(p, params);

    // write into output
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Worley 4D BM variants (time as W)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM1_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM1_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM2_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM2_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM3_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM3_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM1_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM1_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM2_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM2_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeWorleyBM3_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateWorleyBM3_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}


// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Cellular 4D BM variants (time as W)
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeCellularBM1_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM1_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeCellularBM2_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM2_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeCellularBM3_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM3_4D(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeCellularBM1_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM1_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeCellularBM2_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM2_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeCellularBM3_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let p = fetchPos(fx, fy, fz);
  let v0 = generateCellularBM3_4D_vec(p, params);

  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 24) VoronoiTileNoise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiTileNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiTileNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 25) LanczosBillow
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeLanczosBillow(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateLanczosBillow(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 26) LanczosAntiBillow
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeLanczosAntiBillow(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateLanczosAntiBillow(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 27) Voronoi Circle-Gradient Noise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiCircleNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiCircleNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 28) Voronoi Circle-Gradient Tile Noise 2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiCircle2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiCircle2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 29) Voronoi Flat-Shade Tile Noise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiFlatShade(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiFlatShade(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 30) Voronoi Ripple 3D
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiRipple3D(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiRipple3D(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 31) Voronoi Ripple 3D 2
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiRipple3D2(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiRipple3D2(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 32) Voronoi Circular Ripple 3D
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeVoronoiCircularRipple(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateVoronoiCircularRipple(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 33) Fractal Voronoi Ripple 3D
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFVoronoiRipple3D(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFVoronoiRipple3D(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 34) Fractal Voronoi Circular Ripple 3D
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFVoronoiCircularRipple(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFVoronoiCircularRipple(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 35) Ripple Noise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeRippleNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateRippleNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 36) Fractal Ripples
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeFractalRipples(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateFractalRipples(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 37) HexWorms
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeHexWorms(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateHexWormsNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 38) PerlinWorms
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computePerlinWorms(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generatePerlinWormsNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 39) White Noise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeWhiteNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateWhiteNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// 40) Blue Noise
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
@compute @workgroup_size(8, 8, 1)
fn computeBlueNoise(@builtin(global_invocation_id) gid: vec3<u32>) {
    let fx = i32(frame.originX) + i32(gid.x);
    let fy = i32(frame.originY) + i32(gid.y);
    let fz = i32(frame.originZ) + i32(gid.z);
    let p  = fetchPos(fx, fy, fz);
    let v0 = generateBlueNoise(p, params);
    writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

// 41) Simplex
@compute @workgroup_size(8,8,1)
fn computeSimplex(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  let v0 = generateSimplex(p, params);
  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeSimplexFBM(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  let v0 = generateSimplexFBM(p, params);
  writeChannel(fx, fy, fz, v0, options.outputChannel, 0u);
}


@compute @workgroup_size(8,8,1)
fn computeCurl2D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let pos = fetchPos(fx, fy, fz).xy;
  let v   = curl2_simplex2D(pos, params);
  // gentle gain so it doesn\u2019t clip hard; tweak 0.75 if you like
  let m   = mag_to_signed01(length(v) * 0.75);

  writeChannel(fx, fy, fz, m, options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeCurlFBM2D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);

  let pos = fetchPos(fx, fy, fz).xy;
  let v   = curl2_simplexFBM(pos, params);
  let m   = mag_to_signed01(length(v) * 0.75);

  writeChannel(fx, fy, fz, m, options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeDomainWarpFBM1(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM1(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeDomainWarpFBM2(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM2(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeGaborAnisotropic(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateGaborAniso(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeGaborMagic(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateGaborMagic(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeTerraceNoise(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateTerraceNoise(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeFoamNoise(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateFoamNoise(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeTurbulence(@builtin(global_invocation_id) gid: vec3<u32>){
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateTurbulence(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeBillow4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateBillow4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeAntiBillow4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateAntiBillow4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeLanczosBillow4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateLanczosBillow4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeLanczosAntiBillow4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateLanczosAntiBillow4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeFBM4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateFBM4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8,8,1)
fn computeVoronoi4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoi4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM1_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM1_4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM2_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM2_4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM3_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM3_4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM1_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM1_4D_vec(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM2_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM2_4D_vec(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeVoronoiBM3_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateVoronoiBM3_4D_vec(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeDomainWarpFBM1_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM1_4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeDomainWarpFBM2_4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM2_4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeDomainWarpFBM1_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM1_4D_vec(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeDomainWarpFBM2_4D_vec(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateDomainWarpFBM2_4D_vec(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeTerraceNoise4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateTerraceNoise4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeFoamNoise4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateFoamNoise4D(p, params), options.outputChannel, 0u);
}

@compute @workgroup_size(8, 8, 1)
fn computeTurbulence4D(@builtin(global_invocation_id) gid: vec3<u32>) {
  let fx = i32(frame.originX) + i32(gid.x);
  let fy = i32(frame.originY) + i32(gid.y);
  let fz = i32(frame.originZ) + i32(gid.z);
  let p  = fetchPos(fx, fy, fz);
  writeChannel(fx, fy, fz, generateTurbulence4D(p, params), options.outputChannel, 0u);
}



// too slow to compile all at once due to branching, had to write new entry point logic
// fn computeMixedNoise(pos : vec3<f32>) -> f32 {
//     var result   : f32 = 0.0;
//     var paramIdx : u32 = 0u;

//     // copy the mask so we can eat bits out of it
//     var bits : u32 = options.mask;

//     // while there's still a set bit, handle just that one
//     loop {
//         // bail as soon as we've consumed all bits
//         if (bits == 0u) {
//             break;
//         }

//         // find the lowest set bit index
//         let i : u32 = firstTrailingBit(bits);

//         // clear that bit so next iteration finds the next one
//         bits = bits & (bits - 1u);

//         // load this algo's params
//         let p = params[paramIdx];
//         paramIdx = paramIdx + 1u;

//         // dispatch the one selected generator
//         var v : f32 = 0.0;
//         switch(i) {
//             case 0u:  { v = generatePerlin(pos, p); }
//             // case 1u:  { v = generateBillow(pos, p); }
//             // case 2u:  { v = generateAntiBillow(pos, p); }
//             // case 3u:  { v = generateRidge(pos, p); }
//             // case 4u:  { v = generateAntiRidge(pos, p); }
//             // case 5u:  { v = generateRidgedMultifractal(pos, p); }
//             // case 6u:  { v = generateRidgedMultifractal2(pos, p); }
//             // case 7u:  { v = generateRidgedMultifractal3(pos, p); }
//             // case 8u:  { v = generateRidgedMultifractal4(pos, p); }
//             // case 9u:  { v = generateAntiRidgedMultifractal(pos, p); }
//             // case 10u: { v = generateAntiRidgedMultifractal2(pos, p); }
//             // case 11u: { v = generateAntiRidgedMultifractal3(pos, p); }
//             // case 12u: { v = generateAntiRidgedMultifractal4(pos, p); }
//             // case 13u: { v = generateFBM(pos, p); }
//             // case 14u: { v = generateFBM2(pos, p); }
//             // case 15u: { v = generateFBM3(pos, p); }
//             // case 16u: { v = generateCellularBM1(pos, p); }
//             // case 17u: { v = generateCellularBM2(pos, p); }
//             // case 18u: { v = generateCellularBM3(pos, p); }
//             // case 19u: { v = generateVoronoiBM1(pos, p); }
//             // case 20u: { v = generateVoronoiBM2(pos, p); }
//             // case 21u: { v = generateVoronoiBM3(pos, p); }
//             // case 22u: { v = generateCellular(pos, p); }
//             // case 23u: { v = generateWorley(pos, p); }
//             // case 24u: { v = generateVoronoiTileNoise(pos, p); }
//             // case 25u: { v = generateLanczosBillow(pos, p); }
//             // case 26u: { v = generateLanczosAntiBillow(pos, p); }
//             //todo port the rest, also more generic ones like white/blue noise
//             default:  { /* unsupported bit \u2192 no contribution */ }
//         }

//         result = result + v;

//         // stop if we've reached the max slots you filled
//         if (paramIdx >= MAX_NOISE_CONFIGS) {
//             break;
//         }
//     }

//     return result;
// }

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 Compute Entry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// @compute @workgroup_size(8, 8, 1)
// fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
//     // 2) compute absolute pixel coords in the full output
//     let fx = i32(frame.originX) + i32(gid.x);
//     let fy = i32(frame.originY) + i32(gid.y);
//     let p = fetchPos(fx, fy);

//     // 4) compute the mixed noise height
//     let h = computeMixedNoise(p);

//     // 5) (optional) finite-difference normal
//     var out: vec4<f32>;
//     if (options.getGradient == 1u) {
//         // let ex = options.epsilon.x;
//         // let ey = options.epsilon.y;
//         // let ez = options.epsilon.z;

//         // let hx = computeMixedNoise(p + vec3<f32>(ex, 0.0, 0.0));
//         // let lx = computeMixedNoise(p - vec3<f32>(ex, 0.0, 0.0));
//         // let hy = computeMixedNoise(p + vec3<f32>(0.0, ey, 0.0));
//         // let ly = computeMixedNoise(p - vec3<f32>(0.0, ey, 0.0));
//         // let hz = computeMixedNoise(p + vec3<f32>(0.0, 0.0, ez));
//         // let lz = computeMixedNoise(p - vec3<f32>(0.0, 0.0, ez));

//         // var dx = (hx - lx) / (2.0 * ex);
//         // var dy = (hy - ly) / (2.0 * ey);
//         // var dz = (hz - lz) / (2.0 * ez);
//         // let invLen = 1.0 / max(1e-6, sqrt(dx*dx + dy*dy + dz*dz));
//         // dx *= invLen; dy *= invLen; dz *= invLen;

//         // out = vec4<f32>(h, dx, dy, dz);
//     } else {
//         out = vec4<f32>(h, h, h, h);
//     }

//   // 6) write into the layer of the 2D-array texture
//   textureStore(
//     outputTex,
//     vec2<i32>(fx, fy),
//     frame.layerIndex,
//     out
//   );
// }



// 5x5 Gaussian blur (separable weights via shared tile, single-pass)
// Applies per-channel convolution on RGBA and writes rgba16f
// If options.outputChannel == 0, writes all channels
// If 1..4, only that channel is replaced with blurred value, others copied from source

const WG_X : u32 = 16u;
const WG_Y : u32 = 16u;
const R    : u32 = 2u;        // kernel radius for 5x5
const TILE_SIZE : u32 = TILE_W * TILE_H;

const G5 : array<f32, 5> = array<f32,5>(1.0, 4.0, 6.0, 4.0, 1.0);
const G5NORM : f32 = 1.0 / 256.0;

var<workgroup> tileRGBA : array<vec4<f32>, TILE_SIZE>;

fn tileIndex(x: u32, y: u32)->u32 {
  return y * TILE_W + x;
}

@compute @workgroup_size(WG_X, WG_Y, 1)
fn computeGauss5x5(
  @builtin(local_invocation_id)  lid: vec3<u32>,
  @builtin(workgroup_id)         wid: vec3<u32>,
  @builtin(global_invocation_id) gid: vec3<u32>
){
  // Workgroup top-left in full image space
  let wgOx = i32(frame.originX) + i32(wid.x) * i32(WG_X);
  let wgOy = i32(frame.originY) + i32(wid.y) * i32(WG_Y);
  let fz   = i32(frame.originZ) + i32(gid.z);

  // Cooperatively load a (WG_X+4) x (WG_Y+4) tile with a 2px halo
  var ty: u32 = lid.y;
  loop {
    if (ty >= TILE_H) { break; }
    var tx: u32 = lid.x;
    loop {
      if (tx >= TILE_W) { break; }
      let sx = clamp(wgOx + i32(tx) - i32(R), 0, i32(frame.fullWidth)  - 1);
      let sy = clamp(wgOy + i32(ty) - i32(R), 0, i32(frame.fullHeight) - 1);
      tileRGBA[tileIndex(tx, ty)] = loadPrevRGBA(sx, sy, fz);
      tx += WG_X;
    }
    ty += WG_Y;
  }
  workgroupBarrier();

  // Output pixel this thread is responsible for
  let fx = wgOx + i32(lid.x);
  let fy = wgOy + i32(lid.y);

  // Guard writes that might fall off the image on the final groups
  if (fx < 0 || fy < 0 || fx >= i32(frame.fullWidth) || fy >= i32(frame.fullHeight)) {
    return;
  }

  // Center within the shared tile
  let txc = u32(lid.x) + R;
  let tyc = u32(lid.y) + R;

  // 5x5 Gaussian using separable weights via outer product on the tile
  var acc : vec4<f32> = vec4<f32>(0.0);
  for (var j: u32 = 0u; j < 5u; j = j + 1u) {
    let wy = G5[j];
    let tyN = u32(i32(tyc) + i32(j) - 2);
    for (var i: u32 = 0u; i < 5u; i = i + 1u) {
      let wx = G5[i];
      let txN = u32(i32(txc) + i32(i) - 2);
      let w = (wx * wy) * G5NORM;
      acc += tileRGBA[tileIndex(txN, tyN)] * w;
    }
  }

  // Channel selection: 0 -> write all, 1..4 -> replace that channel only
  var outCol = acc;
  if (options.outputChannel != 0u) {
    let src = loadPrevRGBA(fx, fy, fz);
    let c = options.outputChannel;
    outCol = src;
    if (c == 1u) { outCol.x = acc.x; }
    else if (c == 2u) { outCol.y = acc.y; }
    else if (c == 3u) { outCol.z = acc.z; }
    else if (c == 4u) { outCol.w = acc.w; }
  }

  storeRGBA(fx, fy, fz, outCol);
}
`;var qt=`struct CanyonBed {
  displacement:f32,
  phase:f32,
  cement:f32,
  iron:f32,
  thickness:f32,
  lowerShelf:f32,
}

fn canyon_bed_random(layer:i32,seed:u32)->f32{
  var h=bitcast<u32>(layer)*0x9e3779b9u+seed;
  h=(h^(h>>16u))*0x7feb352du;
  h=(h^(h>>15u))*0x846ca68bu;
  return f32((h^(h>>16u))>>8u)/16777216.0;
}

fn canyon_contact(layer:i32,seed:u32)->f32{
  // Every contact stays inside its interval, so even the thinnest beds
  // stay in order as a formation dips and changes thickness.
  return f32(layer)+mix(.10,.76,canyon_bed_random(layer,seed));
}

fn canyon_bed(dir:vec3<f32>,height:f32,seed:u32)->CanyonBed{
  let salt=6.2831853*canyon_bed_random(11,seed);
  let orientation=seed^(seed>>13u);
  let strike=select(dir,dir.yzx,(orientation&1u)!=0u);
  let p=select(strike,strike.zxy,(orientation&2u)!=0u)*
    vec3<f32>(select(1.0,-1.0,(orientation&4u)!=0u),1.0,select(1.0,-1.0,(orientation&8u)!=0u));
  let fold=sin(dot(p,vec3<f32>(6.4,-8.9,4.8))+salt);
  let bend=sin(dot(p,vec3<f32>(-13.0,3.8,11.0))+.63*fold+salt);
  let province=smoothstep(-.8,.8,fold+.38*bend);
  let datum=dot(p,vec3<f32>(.33,-.27,.16))+.103*fold+.036*bend;
  let spacing=mix(.155,.395,province);
  let column=(height-datum)/spacing;
  var layer=i32(floor(column));
  if(column<canyon_contact(layer,seed)){layer-=1;}
  let bottom=canyon_contact(layer,seed);
  let top=canyon_contact(layer+1,seed);
  let phase=clamp((column-bottom)/(top-bottom),0.0,1.0);
  let cement=canyon_bed_random(layer,seed+3931u);
  let resistance=smoothstep(.16,.84,cement);
  let center=mix(.34,.67,canyon_bed_random(layer,seed+7207u));
  let transition=mix(.30,.075,resistance);
  let ramp=smoothstep(center-transition,center+transition,phase);
  // Where a bed is strongly cemented, a thinner ledge can split away from
  // the main face. It pinches back into the formation across the fold.
  let split=smoothstep(-.40,.61,bend-.31*fold)*smoothstep(.40,.85,cement);
  let lower=center-mix(.12,.21,province);
  let lowerRamp=smoothstep(lower-.053,lower+.072,phase);
  let profile=mix(ramp,lowerRamp,.44*split);
  let shelf=split*smoothstep(lower-.11,lower-.025,phase)*
    (1.0-smoothstep(lower+.048,lower+.126,phase));
  let thickness=(top-bottom)*spacing;
  let displacement=(profile-phase)*thickness*mix(.21,.98,resistance)*mix(.72,1.0,province);
  let iron=canyon_bed_random(layer,seed+19687u);
  let below=canyon_bed_random(layer-1,seed+19687u);
  let above=canyon_bed_random(layer+1,seed+19687u);
  let stain=iron+.5*(below-iron)*(1.0-smoothstep(0.0,.19,phase))+
    .5*(above-iron)*smoothstep(.81,1.0,phase);
  return CanyonBed(displacement,phase,cement,stain,thickness,shelf);
}

fn canyon_gully_wear(slope:vec2<f32>,bend:vec2<f32>,grade:f32,cut:f32)->f32{
  // Estimate the hollow across the fall line. Bends down the slope alone
  // often mark intact rock steps and should keep their profile.
  let crossSlope=slope.yx*slope.yx;
  let hollow=dot(bend,crossSlope)/max(dot(slope,slope),.001);
  return smoothstep(.016,.12,hollow)*smoothstep(.019,.155,cut)*smoothstep(.09,.38,grade);
}

struct BasaltFlow {
  displacement:f32,
  cap:f32,
  ash:f32,
  thickness:f32,
}

// Lava flows pond and thicken unevenly. Thin ash beds weather back between
// the hardened flows, especially where runoff already incises the slope.
fn basalt_flow(dir:vec3<f32>,height:f32,seed:u32)->BasaltFlow{
  let salt=6.2831853*canyon_bed_random(29,seed);
  let bend=sin(dot(dir,vec3<f32>(8.5,-5.2,11.3))+salt);
  let pond=sin(dot(dir,vec3<f32>(-5.8,11.3,4.6))+.83*bend-salt);
  let bedding=dot(dir,vec3<f32>(.19,.31,-.24))+.088*bend+.032*pond;
  let spacing=mix(.115,.315,smoothstep(-.94,.94,.56*bend+.68*pond));
  let units=(height-bedding)/spacing;
  let contacts=seed+5573u;
  var layer=i32(floor(units));
  if(units<canyon_contact(layer,contacts)){layer-=1;}
  let base=canyon_contact(layer,contacts);
  let top=canyon_contact(layer+1,contacts);
  let phase=clamp((units-base)/(top-base),0.0,1.0);
  let solid=smoothstep(.12,.86,canyon_bed_random(layer,seed+5399u)+.14*pond);
  let lip=mix(.43,.69,canyon_bed_random(layer,seed+7109u));
  let ramp=smoothstep(lip-mix(.29,.16,solid),lip+mix(.23,.08,solid),phase);
  let cap=solid*smoothstep(lip-.07,lip+.09,phase)*(1.0-smoothstep(.89,1.0,phase));
  let ash=mix(.92,.32,solid)*smoothstep(0.0,.13,phase)*(1.0-smoothstep(lip-.13,lip+.03,phase));
  let thickness=(top-base)*spacing;
  return BasaltFlow((ramp-phase)*thickness*mix(.20,.89,solid),cap,ash,thickness);
}
`;var Ft=`fn studio_wind_dir(seed:u32)->vec3<f32>{
  let heading=6.283185307*f32(seed&65535u)/65536.0;
  return vec3<f32>(cos(heading),0.0,sin(heading));
}

fn studio_dryness(dir:vec3<f32>,rock:vec4<f32>,seed:u32)->f32{
  let phase=6.283185307*f32(seed>>16u)/65536.0;
  let belt=1.0-smoothstep(.43,.81,abs(dir.y));
  let lee=.78*sin(dot(dir,vec3<f32>(4.0,2.0,-5.52))+phase)+
    .40*sin(dot(dir,vec3<f32>(-8.7,3.3,-5.4))-.71*phase);
  let supply=min(1.0,1.42*(rock.y+.78*rock.w+.36*rock.z));
  return belt*supply*smoothstep(-.67,.47,lee);
}
`;var za=`// Closed summit bowls have irregular rims. The same profile can describe
// a low breached shield or a steep cinder cone with a narrow summit vent.
fn volcanic_vent(p:vec2<f32>,shape:vec3<f32>,rimNoise:f32)->f32{
  // The vent is offset from the foot of the cone. In its seeded local
  // orientation, unequal lobes form a broken lip and slump on one flank.
  let drift=vec2<f32>(.13*(shape.z-.5),.09*(shape.y-.5));
  let q=p-drift*(1.0-smoothstep(.22,1.0,length(p)));
  let warped=vec2<f32>(q.x+.24*(shape.z-.5)*q.y,q.y*mix(.68,1.48,shape.y));
  let r=length(warped);
  let heading=warped/max(r,.08);
  let crown=heading.x*(heading.x*heading.x-3.0*heading.y*heading.y);
  let shoulder=2.0*heading.x*heading.y;
  let lip=mix(.35,.25,shape.x)*(1.0+mix(.08,.19,shape.y)*crown+
    mix(-.12,.15,shape.z)*shoulder);
  let d=r+1.34*rimNoise*smoothstep(.08,.30,r)*(1.0-smoothstep(.65,1.25,r));
  let flank=smoothstep(0.0,.09,d-lip)*clamp((d-lip)/(1.36-lip),0.0,1.0);
  let cone=pow(1.0-flank,mix(2.6,1.25,shape.x)+.31*heading.y);
  let bowl=1.0-smoothstep(lip*.26,lip*1.04,d);
  let rim=smoothstep(lip*.69,lip,d)*(1.0-smoothstep(lip*1.05,lip*1.52,d));
  let breach=smoothstep(.42,.91,shape.z)*smoothstep(.045,.34,q.y)*
    (1.0-smoothstep(.06,.36,abs(q.x+.34*q.y)));
  let edge=1.0-smoothstep(1.05,1.45,length(p));
  return edge*(mix(.27,.99,shape.x)*cone-mix(.28,.63,shape.y)*bowl+
    (.12+.045*shoulder)*rim-(.12+.38*rim)*cone*breach);
}

fn volcanic_caldera(p:vec2<f32>,shape:vec3<f32>,rimNoise:f32)->f32{
  let r=length(p*vec2<f32>(1.0,mix(.83,1.23,shape.x)));
  let d=r+rimNoise*smoothstep(.22,.66,r);
  let floor=1.0-smoothstep(.29,.88,d);
  let rim=smoothstep(.68,.96,d)*(1.0-smoothstep(1.0,1.42,d));
  let breach=smoothstep(.60,.92,shape.z)*smoothstep(.28,.78,p.y)*
    (1.0-smoothstep(.14,.46,abs(p.x+.24*p.y)));
  let apron=1.0-smoothstep(.54,1.45,d);
  return .13*apron+mix(.25,.48,shape.x)*rim*(1.0-.68*breach)-mix(.35,.74,shape.y)*floor;
}

fn lava_tube_collapse(p:vec2<f32>,radius:f32,reach:f32,seed:u32,texel:f32)->f32{
  let start=.72*radius;
  if(p.x<start||p.x>=reach||abs(p.y)>.033||texel>=.024){return 0.0;}
  let step=mix(.034,.055,canyon_bed_random(4,seed));
  let along=(p.x-start)/step;
  let segment=i32(floor(along));
  let profile=canyon_bed_random(segment,seed+1723u);
  if(profile<.23){return 0.0;}
  let offset=mix(.39,.61,canyon_bed_random(segment,seed+6857u));
  let width=mix(.008,.016,canyon_bed_random(segment,seed+2671u));
  let taper=smoothstep(start,start+step*.65,p.x)*(1.0-smoothstep(reach-step*.56,reach,p.x));
  let bend=sin(along*1.58+6.2831853*canyon_bed_random(7,seed));
  let cross=abs(p.y-width*(.72*bend+.29*sin(along*3.39+.6*bend)));
  let lengthwise=abs(fract(along)-offset)/mix(.18,.34,profile);
  let d=length(vec2<f32>(lengthwise,cross/width));
  let wall=1.0-smoothstep(.31,1.0,d);
  let resolution=1.0-smoothstep(width*.78,width*1.44,texel);
  return -mix(.055,.205,profile)*wall*taper*resolution;
}
`;var Ja=`// Fullscreen quad (module-scope constant)\r
const kQuad : array<vec2<f32>, 6> = array<vec2<f32>, 6>(\r
  vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),\r
  vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)\r
);\r
\r
struct VsOut {\r
  @builtin(position) pos : vec4<f32>,\r
  @location(0)       uv  : vec2<f32>,\r
};\r
\r
@vertex\r
fn vs_main(@builtin(vertex_index) i : u32) -> VsOut {\r
  let p = kQuad[i];\r
\r
  var o : VsOut;\r
  o.pos = vec4<f32>(p, 0.0, 1.0);\r
  o.uv  = p * 0.5 + vec2<f32>(0.5, 0.5);\r
  return o;\r
}\r
\r
@group(0) @binding(0) var samp : sampler;\r
@group(0) @binding(1) var tex  : texture_2d_array<f32>;\r
\r
struct UBlit2D {\r
  layer   : u32,\r
  channel : u32,\r
  _pad0   : u32,\r
  _pad1   : u32,\r
};\r
@group(0) @binding(2) var<uniform> U : UBlit2D;\r
\r
@fragment\r
fn fs_main(in : VsOut) -> @location(0) vec4<f32> {\r
  // For array textures the signature is (tex, sampler, uv, arrayIndex, level)\r
  let c = textureSampleLevel(tex, samp, in.uv, i32(U.layer), 0.0);\r
\r
  // display a single channel directly\r
  var v = c.r;\r
  if (U.channel == 2u) { v = c.g; }\r
  if (U.channel == 3u) { v = c.b; }\r
  if (U.channel == 4u) { v = c.a; }\r
\r
  return vec4<f32>(clamp(v, 0.0, 1.0));\r
}\r
`;var Qa=`const kQuad : array<vec2<f32>, 6> = array<vec2<f32>, 6>(\r
  vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),\r
  vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)\r
);\r
\r
struct VsOut {\r
  @builtin(position) pos : vec4<f32>,\r
  @location(0)       uv  : vec2<f32>,\r
};\r
\r
@vertex\r
fn vs_main(@builtin(vertex_index) i : u32) -> VsOut {\r
  let p = kQuad[i];\r
  var o : VsOut;\r
  o.pos = vec4<f32>(p, 0.0, 1.0);\r
  o.uv  = p * 0.5 + vec2<f32>(0.5, 0.5);\r
  return o;\r
}\r
\r
@group(0) @binding(0) var samp : sampler;\r
@group(0) @binding(1) var tex3d : texture_3d<f32>;\r
\r
struct UBlit3D {\r
  zNorm   : f32,  // normalized depth [0..1]\r
  channel : u32,\r
  _pad0   : u32,\r
  _pad1   : u32,\r
};\r
@group(0) @binding(2) var<uniform> U : UBlit3D;\r
\r
@fragment\r
fn fs_main(in : VsOut) -> @location(0) vec4<f32> {\r
  let coord = vec3<f32>(in.uv, clamp(U.zNorm, 0.0, 1.0));\r
  let c = textureSample(tex3d, samp, coord);\r
\r
  // display a single channel directly\r
  var v = c.r;\r
  if (U.channel == 2u) { v = c.g; }\r
  if (U.channel == 3u) { v = c.b; }\r
  if (U.channel == 4u) { v = c.a; }\r
\r
  return vec4<f32>(clamp(v, 0.0, 1.0));\r
}\r
`;var dr=4096;var ei=2048,Co=8,_a=class{constructor(e,t){this.device=e,this.queue=t,this.maxBufferChunkBytes=8e6,this.entryPoints=["computePerlin","computeBillow","computeAntiBillow","computeRidge","computeAntiRidge","computeRidgedMultifractal","computeRidgedMultifractal2","computeRidgedMultifractal3","computeRidgedMultifractal4","computeAntiRidgedMultifractal","computeAntiRidgedMultifractal2","computeAntiRidgedMultifractal3","computeAntiRidgedMultifractal4","computeFBM","computeFBM2","computeFBM3","computeCellularBM1","computeCellularBM2","computeCellularBM3","computeVoronoiBM1","computeVoronoiBM2","computeVoronoiBM3","computeCellular","computeWorley","computeAntiCellular","computeAntiWorley","computeLanczosBillow","computeLanczosAntiBillow","computeVoronoiTileNoise","computeVoronoiCircleNoise","computeVoronoiCircle2","computeVoronoiFlatShade","computeVoronoiRipple3D","computeVoronoiRipple3D2","computeVoronoiCircularRipple","computeFVoronoiRipple3D","computeFVoronoiCircularRipple","computeRippleNoise","computeFractalRipples","computeHexWorms","computePerlinWorms","computeWhiteNoise","computeBlueNoise","computeSimplex","computeSimplexFBM","computeCurl2D","computeCurlFBM2D","computeDomainWarpFBM1","computeDomainWarpFBM2","computeGaborAnisotropic","computeGaborMagic","computeGaborFlow","computeTerraceNoise","computeFoamNoise","computeTurbulence","computePerlin4D","computeWorley4D","computeAntiWorley4D","computeCellular4D","computeAntiCellular4D","computeBillow4D","computeAntiBillow4D","computeLanczosBillow4D","computeLanczosAntiBillow4D","computeFBM4D","computeVoronoi4D","computeVoronoiBM1_4D","computeVoronoiBM2_4D","computeVoronoiBM3_4D","computeVoronoiBM1_4D_vec","computeVoronoiBM2_4D_vec","computeVoronoiBM3_4D_vec","computeWorleyBM1_4D","computeWorleyBM2_4D","computeWorleyBM3_4D","computeWorleyBM1_4D_vec","computeWorleyBM2_4D_vec","computeWorleyBM3_4D_vec","computeCellularBM1_4D","computeCellularBM2_4D","computeCellularBM3_4D","computeCellularBM1_4D_vec","computeCellularBM2_4D_vec","computeCellularBM3_4D_vec","computeTerraceNoise4D","computeFoamNoise4D","computeTurbulence4D","computeSmokeNoise","computeTerrainNoise","computeHydrologyErosionHeightfield","computeStudioSphereErosion","computeHydrologyGuideField","computeHydrologyDrainageMask","computeGauss5x5","computeNormal","computeNormal8","computeSphereNormal","computeNormalVolume","clearTexture","computeStudioSphereRelief","computeStudioSphereMountainErosion"],this.shaderModule=e.createShaderModule({code:qt+Ft+za+Ma}),this.bindGroupLayout=e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:3,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:4,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float",viewDimension:"2d-array"}},{binding:5,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:6,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:7,visibility:GPUShaderStage.COMPUTE,texture:{sampleType:"float",viewDimension:"3d"}},{binding:8,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba16float",viewDimension:"3d"}}]}),this.pipelineLayout=e.createPipelineLayout({bindGroupLayouts:[this.bindGroupLayout]}),this.pipelines=new Map,this._texPairs=new Map,this._tid=null,this._tag=new WeakMap,this._default2DKey="__default2d",this._volumeCache=new Map,this.viewA=null,this.viewB=null,this.width=0,this.height=0,this.layers=1,this.isA=!0,this._initBuffers(),this._ensureDummies(),this._ctxMap=new WeakMap}_initBuffers(){this.optionsBuffer?.destroy(),this.paramsBuffer?.destroy(),this.permBuffer?.destroy(),this.nullPosBuffer?.destroy(),this.optionsBuffer=this.device.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.paramsBuffer=this.device.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.permBuffer=this.device.createBuffer({size:512*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.nullPosBuffer=this.device.createBuffer({size:64,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.queue.writeBuffer(this.optionsBuffer,0,new ArrayBuffer(96)),this.queue.writeBuffer(this.paramsBuffer,0,new ArrayBuffer(96)),this.queue.writeBuffer(this.permBuffer,0,new Uint32Array(512))}_ensureDummies(){this._dummy2D_sampleTex||(this._dummy2D_sampleTex=this.device.createTexture({size:[1,1,1],format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this._dummy2D_sampleView=this._dummy2D_sampleTex.createView({dimension:"2d-array",arrayLayerCount:1})),this._dummy2D_writeTex||(this._dummy2D_writeTex=this.device.createTexture({size:[1,1,1],format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST}),this._dummy2D_writeView=this._dummy2D_writeTex.createView({dimension:"2d-array",arrayLayerCount:1})),this._dummy3D_sampleTex||(this._dummy3D_sampleTex=this.device.createTexture({size:{width:1,height:1,depthOrArrayLayers:1},dimension:"3d",format:"rgba16float",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC}),this._dummy3D_sampleView=this._dummy3D_sampleTex.createView({dimension:"3d"})),this._dummy3D_writeTex||(this._dummy3D_writeTex=this.device.createTexture({size:{width:1,height:1,depthOrArrayLayers:1},dimension:"3d",format:"rgba16float",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.COPY_DST}),this._dummy3D_writeView=this._dummy3D_writeTex.createView({dimension:"3d"}))}_getMaxBufferChunkBytes(e){let t=this.device?.limits?.maxBufferSize??268435456,a=Math.max(1024*1024,Math.floor(t*.9)),r=Number.isFinite(e)?Math.floor(e):this.maxBufferChunkBytes;return(!Number.isFinite(r)||r<=0)&&(r=this.maxBufferChunkBytes),r=Math.max(4,r)&-4,Math.min(a,r)}_writeBufferChunked(e,t,a,r,o,s=null){let c=o|0;if(!(c>0))return;let n=this._getMaxBufferChunkBytes(s),l=0;for(;l<c;){let d=Math.min(n,c-l)|0;if(d=d&-4,d<=0)break;this.queue.writeBuffer(e,t+l|0,a,r+l|0,d),l=l+d|0}if(l!==c)throw new Error(`_writeBufferChunked: incomplete write ${l}/${c} bytes`)}async _readBGRA8TextureToRGBA8Pixels(e,t,a,r={}){let o=Math.max(1,t|0),s=Math.max(1,a|0),c=4,n=256,l=o*c,d=Math.ceil(l/n)*n,u=this.device?.limits?.maxBufferSize??256*1024*1024,f=Math.max(1024*1024,Math.floor(u*.9)),p=this._getMaxBufferChunkBytes(r.maxBufferChunkBytes);if(p<d&&(p=d),d>f)throw new Error(`_readBGRA8TextureToRGBA8Pixels: bytesPerRow=${d} exceeds safe buffer cap=${f}`);let x=Math.max(1,Math.floor(p/d))|0,y=new Uint8ClampedArray(o*s*4),m=[],M=this.device.createCommandEncoder();for(let h=0;h<s;h+=x){let v=Math.min(x,s-h)|0,b=d*v|0,z=this.device.createBuffer({size:b,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});M.copyTextureToBuffer({texture:e,origin:{x:0,y:h,z:0}},{buffer:z,bytesPerRow:d,rowsPerImage:v},{width:o,height:v,depthOrArrayLayers:1}),m.push({readBuffer:z,y0:h,rows:v})}if(this.queue.submit([M.finish()]),this.queue&&this.queue.onSubmittedWorkDone)try{await this.queue.onSubmittedWorkDone()}catch{}for(let h of m){let{readBuffer:v,y0:b,rows:z}=h;await v.mapAsync(GPUMapMode.READ);let D=v.getMappedRange(),_=new Uint8Array(D);for(let S=0;S<z;S++){let k=S*d,g=(b+S)*o*4;for(let w=0;w<o;w++){let P=k+w*4,C=g+w*4;y[C+0]=_[P+2],y[C+1]=_[P+1],y[C+2]=_[P+0],y[C+3]=_[P+3]}}v.unmap(),v.destroy()}return y}resize(e){this.maxConfigs=e,this._initBuffers()}setPermTable(e){this.queue.writeBuffer(this.permBuffer,0,e)}setPosBuffer(e){this.posBuffer=e}setInputTextureView(e){try{if(((e?.texture?.usage??0)&GPUTextureUsage.TEXTURE_BINDING)===0){console.warn("setInputTextureView: provided texture view not created with TEXTURE_BINDING; ignoring.");return}}catch{}if(this.inputTextureView=e,this._tid!==null){let t=this._texPairs.get(this._tid);t&&(t.bindGroupDirty=!0)}}setOutputTextureView(e){try{if(((e?.texture?.usage??0)&GPUTextureUsage.STORAGE_BINDING)===0){console.warn("setOutputTextureView: provided texture view not created with STORAGE_BINDING; ignoring.");return}}catch{}if(this.outputTextureView=e,this._tid!==null){let t=this._texPairs.get(this._tid);t&&(t.bindGroupDirty=!0)}}buildPermTable(e=Date.now()){let a=new ea(e).perm,r=new Uint32Array(512);for(let o=0;o<512;o++)r[o]=a[o];this.setPermTable(r)}setOptions(e={}){Array.isArray(e.noiseChoices)?this.noiseChoices=e.noiseChoices:this.noiseChoices||(this.noiseChoices=[0]);let{getGradient:t=0,outputChannel:a=1,baseRadius:r=0,heightScale:o=1,useCustomPos:s=0,ioFlags:c=0,sphereOffset:n=0,sphereOffset2:l=0,sphereBlend:d=0,sphereBlendPhase:u=0,sphereRangeWeight:f=1,spherePolarFade:p=0,sphereLandscape:x=0,sphereLandscapeStrength:y=0,sphereFeatureDensity:m=1,sphereRegionSeed:M=0,sphereRegion:h=[0,0,0,0],sphereLayerWeights:v=[1,1,1,1]}=e;this.useCustomPos=s>>>0;let b=new ArrayBuffer(96),z=new DataView(b);z.setUint32(0,t,!0),z.setUint32(4,this.useCustomPos,!0),z.setUint32(8,a,!0),z.setUint32(12,c>>>0,!0),z.setFloat32(16,r,!0),z.setFloat32(20,o,!0),z.setFloat32(24,Number.isFinite(Number(n))?Number(n):0,!0),z.setFloat32(28,Number.isFinite(Number(l))?Number(l):0,!0),z.setFloat32(32,d,!0),z.setFloat32(36,u,!0),z.setFloat32(40,f,!0),z.setFloat32(44,p,!0),z.setUint32(48,x,!0),z.setFloat32(52,y,!0),z.setFloat32(56,m,!0),z.setUint32(60,M,!0);for(let D=0;D<4;D++)z.setFloat32(64+4*D,h[D],!0),z.setFloat32(80+4*D,v[D],!0);this.queue.writeBuffer(this.optionsBuffer,0,b);for(let D of this._texPairs.values())D.bindGroupDirty=!0}setNoiseParams(e={}){let t=e||{},a=this._lastNoiseParams||{},r=Object.prototype.hasOwnProperty,o=(Z,Y)=>{let X=r.call(t,Z)?t[Z]:a[Z],te=Number(X);if(Number.isFinite(te))return te;let ie=Number(Y);return Number.isFinite(ie)?ie:0},s=(Z,Y)=>{let X=r.call(t,Z)?t[Z]:a[Z],te=Number(X);if(Number.isFinite(te))return te>>>0;let ie=Number(Y);return Number.isFinite(ie)?ie>>>0:0},c=(Z,Y)=>{let X=r.call(t,Z)?t[Z]:a[Z],te=Number(X);if(Number.isFinite(te))return te|0;let ie=Number(Y);return Number.isFinite(ie)?ie|0:0},n=(Z,Y)=>{let X=r.call(t,Z)?t[Z]:a[Z];return X===void 0?(Y?1:0)>>>0:(X?1:0)>>>0},l=c("seed",a.seed??Date.now()|0),d=o("zoom",a.zoom??1),u=o("freq",a.freq??1),f=Math.max(d||0,1e-6),p=Math.max(u||0,1e-6),x=s("octaves",a.octaves??8),y=n("turbulence",a.turbulence??0),m=o("lacunarity",a.lacunarity??2),M=o("gain",a.gain??.5),h=o("xShift",a.xShift??0),v=o("yShift",a.yShift??0),b=o("zShift",a.zShift??0),z=o("seedAngle",a.seedAngle??0),D=o("exp1",a.exp1??1),_=o("exp2",a.exp2??0),S=o("threshold",a.threshold??.1),k=o("rippleFreq",a.rippleFreq??10),g=o("time",a.time??0),w=o("warpAmp",a.warpAmp??.5),P=o("gaborRadius",a.gaborRadius??4),C=o("terraceStep",a.terraceStep??8),B=n("toroidal",a.toroidal??0),W=s("voroMode",a.voroMode??0),R=o("edgeK",a.edgeK??0),Q=o("scalar",a.scalar??1),q=o("transform",a.transform??0),E=new ArrayBuffer(96),N=new DataView(E),O=0;N.setUint32(O+0,l>>>0,!0),N.setFloat32(O+4,f,!0),N.setFloat32(O+8,p,!0),N.setUint32(O+12,x>>>0,!0),N.setFloat32(O+16,m,!0),N.setFloat32(O+20,M,!0),N.setFloat32(O+24,h,!0),N.setFloat32(O+28,v,!0),N.setFloat32(O+32,b,!0),N.setUint32(O+36,y>>>0,!0),N.setFloat32(O+40,z,!0),N.setFloat32(O+44,D,!0),N.setFloat32(O+48,_,!0),N.setFloat32(O+52,S,!0),N.setFloat32(O+56,k,!0),N.setFloat32(O+60,g,!0),N.setFloat32(O+64,w,!0),N.setFloat32(O+68,P,!0),N.setFloat32(O+72,C,!0),N.setUint32(O+76,B>>>0,!0),N.setUint32(O+80,W>>>0,!0),N.setFloat32(O+84,R,!0),N.setFloat32(O+88,Q,!0),N.setFloat32(O+92,q,!0),this.queue.writeBuffer(this.paramsBuffer,0,E),this._lastNoiseParams={seed:l,zoom:f,freq:p,octaves:x,lacunarity:m,gain:M,xShift:h,yShift:v,zShift:b,turbulence:y,seedAngle:z,exp1:D,exp2:_,threshold:S,rippleFreq:k,time:g,warpAmp:w,gaborRadius:P,terraceStep:C,toroidal:B,voroMode:W,edgeK:R,scalar:Q,transform:q};for(let Z of this._texPairs.values())Z.bindGroupDirty=!0;for(let[Z,Y]of this._volumeCache)!Y||!Array.isArray(Y.chunks)||(Y._bindGroupsDirty=!0)}_numOr0(e){let t=Number(e);return Number.isFinite(t)?t:0}_resolveScroll2D(e,t,a,r,o,s){let c=e||{},n=Math.max(1,t|0),l=Math.max(1,a|0),d=Math.max(1,(r??n)|0),u=Math.max(1,(o??l)|0),f=s?d:n,p=s?u:l,x=this._numOr0(c.offsetX)*f,y=this._numOr0(c.offsetY)*p,m=x+this._numOr0(c.offsetXf)+this._numOr0(c.originXf)+this._numOr0(c.originX),M=y+this._numOr0(c.offsetYf)+this._numOr0(c.originYf)+this._numOr0(c.originY);return{baseXf:m,baseYf:M}}_resolveScroll3D(e,t,a,r){let o=e||{},s=Math.max(1,t|0),c=Math.max(1,a|0),n=Math.max(1,r|0),l=this._numOr0(o.offsetX)*s,d=this._numOr0(o.offsetY)*c,u=this._numOr0(o.offsetZ)*n,f=l+this._numOr0(o.offsetXf)+this._numOr0(o.originXf)+this._numOr0(o.originX),p=d+this._numOr0(o.offsetYf)+this._numOr0(o.originYf)+this._numOr0(o.originY),x=u+this._numOr0(o.offsetZf)+this._numOr0(o.originZf)+this._numOr0(o.originZ),y=Math.floor(x)|0;return{baseXf:f,baseYf:p,baseZ:y}}_update2DTileFrames(e,t={}){let a=this._texPairs.get(e);if(!a||!Array.isArray(a.tiles)||a.tiles.length===0)return;let r=Number.isFinite(t.frameFullWidth)?t.frameFullWidth>>>0:a.fullWidth,o=Number.isFinite(t.frameFullHeight)?t.frameFullHeight>>>0:a.fullHeight,s=t.squareWorld||String(t.worldMode||"").toLowerCase()==="crop";if(t.squareWorld){let p=Math.max(r,o,a.fullWidth,a.fullHeight)>>>0;r=p,o=p}let c=a.fullWidth>>>0,n=a.fullHeight>>>0,{baseXf:l,baseYf:d}=this._resolveScroll2D(t,c,n,r,o,s),u=s?1:r/Math.max(1,c),f=s?1:o/Math.max(1,n);for(let p of a.tiles){let x=p?.frames?.[0];if(!x)continue;let y=p.originX|0,m=p.originY|0,M=(y+l)*u,h=(m+d)*f,v=r>0?M/r:0,b=o>0?h/o:0;this._writeFrameUniform(x,{fullWidth:r,fullHeight:o,tileWidth:a.tileWidth,tileHeight:a.tileHeight,originX:y,originY:m,originZ:0,fullDepth:1,tileDepth:1,layerIndex:p.layerIndex|0,layers:a.layers>>>0,originXf:v,originYf:b})}}_update3DChunkFrames(e,t=null,a={}){if(!e||!Array.isArray(e.chunks)||e.chunks.length===0)return;let r=t&&Number.isFinite(t?.w)?t.w>>>0:e.full.w,o=t&&Number.isFinite(t?.h)?t.h>>>0:e.full.h,s=t&&Number.isFinite(t?.d)?t.d>>>0:e.full.d,c=e.full.w>>>0,n=e.full.h>>>0,l=e.full.d>>>0,{baseXf:d,baseYf:u,baseZ:f}=this._resolveScroll3D(a,c,n,l),p=r/Math.max(1,c),x=o/Math.max(1,n);for(let y of e.chunks){y.fb||(y.fb=this.device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}));let m=((y.ox|0)+d)*p,M=((y.oy|0)+u)*x,h=r>0?m/r:0,v=o>0?M/o:0,b=(y.oz|0)+f|0;this._writeFrameUniform(y.fb,{fullWidth:r,fullHeight:o,tileWidth:y.w,tileHeight:y.h,originX:y.ox|0,originY:y.oy|0,originZ:b,fullDepth:s,tileDepth:y.d,layerIndex:0,layers:1,originXf:h,originYf:v})}}_compute2DTiling(e,t){let a=Math.min(e,dr),r=Math.min(t,dr),o=Math.ceil(e/a),s=Math.ceil(t/r),c=o*s;return{tileW:a,tileH:r,tilesX:o,tilesY:s,layers:c}}_create2DPair(e,t,a=null){let r=this._compute2DTiling(e,t),o=GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC|GPUTextureUsage.COPY_DST,s=p=>this.device.createTexture({label:p,size:[r.tileW,r.tileH,r.layers],format:"rgba16float",usage:o}),c={dimension:"2d-array",arrayLayerCount:r.layers},n=a!=null?String(a):String(this._texPairs.size),l=s(`2D texA ${e}x${t}x${r.layers} (${n})`),d=s(`2D texB ${e}x${t}x${r.layers} (${n})`),u=l.createView(c),f=d.createView(c);return u.label=`2D:viewA (${n})`,f.label=`2D:viewB (${n})`,this._tag.set(u,`2D:A (${n})`),this._tag.set(f,`2D:B (${n})`),this._texPairs.set(n,{texA:l,texB:d,viewA:u,viewB:f,fullWidth:e,fullHeight:t,tileWidth:r.tileW,tileHeight:r.tileH,tilesX:r.tilesX,tilesY:r.tilesY,layers:r.layers,isA:!0,tiles:null,bindGroupDirty:!0}),this._tid===null&&this.setActiveTexture(n),n}createShaderTextures(e,t){this._tid!==null&&this._texPairs.has(this._tid)&&this.destroyTexturePair(this._tid);let a=this._create2DPair(e,t);return this.setActiveTexture(a),a}destroyTexturePair(e){let t=String(e),a=this._texPairs.get(t);if(a){try{a.texA.destroy()}catch{}try{a.texB.destroy()}catch{}if(Array.isArray(a.tiles))for(let r of a.tiles){if(Array.isArray(r.frames))for(let o of r.frames)try{o.destroy()}catch{}if(r.posBuf&&r.posBuf!==this.nullPosBuffer)try{r.posBuf.destroy()}catch{}}this._texPairs.delete(t),this._tid===t&&(this._tid=null,this.inputTextureView=null,this.outputTextureView=null,this.viewA=null,this.viewB=null)}}destroyAllTexturePairs(){let e=Array.from(this._texPairs.keys());for(let t of e)this.destroyTexturePair(t)}dispose(){if(!this.disposed){this.disposed=!0,this.destroyAllTexturePairs(),this.destroyAllVolumes();for(let e of[this.optionsBuffer,this.paramsBuffer,this.permBuffer,this.nullPosBuffer,this._dummy2D_sampleTex,this._dummy2D_writeTex,this._dummy3D_sampleTex,this._dummy3D_writeTex,this.blit2DUbo,this.blit3DUbo])e?.destroy();this.pipelines.clear()}}setActiveTexture(e){let t=String(e);if(!this._texPairs.has(t))throw new Error("setActiveTexture: invalid id");this._tid=t;let a=this._texPairs.get(t);this.viewA=a.viewA,this.viewB=a.viewB,this.width=a.tileWidth,this.height=a.tileHeight,this.layers=a.layers,this.inputTextureView=a.isA?a.viewA:a.viewB,this.outputTextureView=a.isA?a.viewB:a.viewA}_buildPosBuffer(e,t,a){if(!(a instanceof Float32Array)||a.byteLength<=0)return this.nullPosBuffer;let r=Math.max(1,Math.floor(e)),o=Math.max(1,Math.floor(t)),c=r*o*4;if(a.length!==c)throw new Error(`_buildPosBuffer: customData length ${a.length} != expected ${c} (width=${r}, height=${o})`);let n=this.device?.limits?.maxBufferSize??2147483648,l=this.device?.limits?.maxStorageBufferBindingSize??134217728,d=Math.floor(Math.min(n,l)*.98);if(a.byteLength>d)throw new Error(`_buildPosBuffer: ${a.byteLength} bytes exceeds the safe storage binding limit ${d} (maxBufferSize=${n}, maxStorageBufferBindingSize=${l}, w=${r}, h=${o})`);let u=this.device.createBuffer({size:a.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return this._writeBufferChunked(u,0,a.buffer,a.byteOffset,a.byteLength,this.maxBufferChunkBytes),u}_writeFrameUniform(e,t){let a=new ArrayBuffer(64),r=new DataView(a);r.setUint32(0,t.fullWidth>>>0,!0),r.setUint32(4,t.fullHeight>>>0,!0),r.setUint32(8,t.tileWidth>>>0,!0),r.setUint32(12,t.tileHeight>>>0,!0),r.setInt32(16,t.originX|0,!0),r.setInt32(20,t.originY|0,!0),r.setInt32(24,t.originZ|0,!0),r.setUint32(28,t.fullDepth>>>0,!0),r.setUint32(32,t.tileDepth>>>0,!0),r.setInt32(36,t.layerIndex|0,!0),r.setUint32(40,t.layers>>>0,!0),r.setUint32(44,0,!0),r.setFloat32(48,t.originXf??0,!0),r.setFloat32(52,t.originYf??0,!0),r.setFloat32(56,0,!0),r.setFloat32(60,0,!0),this.queue.writeBuffer(e,0,a)}_create2DTileBindGroups(e,t={}){let a=this._texPairs.get(e);if(!a)throw new Error("_create2DTileBindGroups: invalid tid");let r=((t.useCustomPos??0)|0)>>>0,o=r===2||r===3,s=r!==0&&!o,c=s&&t.customData instanceof Float32Array?t.customData:null,n=!!c,l=Array.isArray(a.tiles)&&a.tiles.some(f=>f&&f.posIsCustom),d=s&&!n;if(!n&&l&&!d&&(a.bindGroupDirty=!0),Array.isArray(a.tiles)&&!a.bindGroupDirty&&!n)return;let u=[];for(let f=0;f<a.tilesY;f++)for(let p=0;p<a.tilesX;p++){let x=f*a.tilesX+p,y=p*a.tileWidth,m=f*a.tileHeight,M=a.tiles&&a.tiles[x]||null,h=this.nullPosBuffer,v=!1;if(n)h=this._buildPosBuffer(a.tileWidth,a.tileHeight,c),v=h!==this.nullPosBuffer;else if(d&&M&&M.posBuf&&M.posIsCustom)h=M.posBuf,v=!0;else{if(d)throw new Error("_create2DTileBindGroups: useCustomPos=1 was requested without customData and no reusable custom position buffer exists.");if(!o&&M&&M.posBuf&&!M.posIsCustom)h=M.posBuf,v=!1;else if(h=this.nullPosBuffer,v=!1,M&&M.posBuf&&M.posIsCustom)try{M.posBuf.destroy()}catch{}}let b;M&&M.frames&&M.frames[0]?b=M.frames[0]:b=this.device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let z=Number.isFinite(t.frameFullWidth)?t.frameFullWidth>>>0:a.fullWidth,D=Number.isFinite(t.frameFullHeight)?t.frameFullHeight>>>0:a.fullHeight,_=t.squareWorld||String(t.worldMode||"").toLowerCase()==="crop";if(t.squareWorld){let P=Math.max(z,D,a.fullWidth,a.fullHeight)>>>0;z=P,D=P}let S,k;if(_)S=y,k=m;else{let P=z/a.fullWidth,C=D/a.fullHeight;S=y*P,k=m*C}this._writeFrameUniform(b,{fullWidth:z,fullHeight:D,tileWidth:a.tileWidth,tileHeight:a.tileHeight,originX:y,originY:m,originZ:0,fullDepth:1,tileDepth:1,layerIndex:x,layers:a.layers,originXf:S,originYf:k});let g=M?.bgs?.[0]?.bgA??null,w=M?.bgs?.[0]?.bgB??null;(!g||!w||a.bindGroupDirty)&&(g=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:a.viewA},{binding:4,resource:a.viewB},{binding:5,resource:{buffer:h}},{binding:6,resource:{buffer:b}},{binding:7,resource:this._dummy3D_sampleView},{binding:8,resource:this._dummy3D_writeView}]}),w=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:a.viewB},{binding:4,resource:a.viewA},{binding:5,resource:{buffer:h}},{binding:6,resource:{buffer:b}},{binding:7,resource:this._dummy3D_sampleView},{binding:8,resource:this._dummy3D_writeView}]})),u.push({layerIndex:x,originX:y,originY:m,frames:[b],posBuf:h,posIsCustom:v,bgs:[{bgA:g,bgB:w}]})}a.tiles=u,a.bindGroupDirty=!1,this._tid===e&&(this._tiles=u)}async prepareTexturePipelines(e){let a=(await Promise.allSettled([...new Set(e)].map(async r=>{if(this.pipelines.has(r))return;let o=await this.device.createComputePipelineAsync({layout:this.pipelineLayout,compute:{module:this.shaderModule,entryPoint:r}});!this.disposed&&!this.pipelines.has(r)&&this.pipelines.set(r,o)}))).find(r=>r.status==="rejected");if(a)throw a.reason}async _runPipelines(e,t,a,r,o,s,c=1){let n=e,l=t,d=Array.isArray(s),u=0,f=this.device.createCommandEncoder(),p=f.beginComputePass();for(let x of this.noiseChoices){let y=typeof x=="number"?this.entryPoints[x]:x,m=this.pipelines.get(y);m||(m=this.device.createComputePipeline({layout:this.pipelineLayout,compute:{module:this.shaderModule,entryPoint:y}}),this.pipelines.set(y,m)),d&&this.setNoiseParams(s[u++]),p.setPipeline(m),p.setBindGroup(0,n),p.dispatchWorkgroups(Math.ceil(a/8),Math.ceil(r/8),c),[n,l]=[l,n]}return p.end(),this.queue.submit([f.finish()]),l}async computeToTexture(e,t,a={},r={}){let o=e|0,s=t|0;if(!(o>0&&s>0))throw new Error(`computeToTexture: invalid size ${e}x${t}`);let c=this._get2DKey(r),n=this._texPairs.get(c);n?(n.fullWidth!==o||n.fullHeight!==s)&&(this.destroyTexturePair(c),this._create2DPair(o,s,c)):this._create2DPair(o,s,c),this.setActiveTexture(c);let l=this._texPairs.get(c);if(!l)throw new Error("computeToTexture: missing pair after ensure");a&&!Array.isArray(a)&&this.setNoiseParams(a);let d=r||{},u=((d.useCustomPos??0)|0)>>>0,f=u===2||u===3,p=u!==0&&!f,x=p&&d.customData instanceof Float32Array?d.customData:null,y=x?1:f?u:p?1:0;this.setOptions({...d,ioFlags:0,useCustomPos:y});let m={...d,useCustomPos:y,customData:x};(!l.tiles||l.bindGroupDirty||x)&&this._create2DTileBindGroups(c,m),this._update2DTileFrames(c,m);let M=l.isA,h=null,v=null;for(let z of l.tiles){let{bgA:D,bgB:_}=z.bgs[0],S=h?h===D?D:_:M?D:_,k=S===D?_:D;h=await this._runPipelines(S,k,l.tileWidth,l.tileHeight,1,a,1),v={bgA:D,bgB:_}}let b=h===v.bgB;return l.isA=b,this.setActiveTexture(c),this.getCurrentView(c)}_get2DKey(e){let t=e&&e.textureKey!==void 0&&e.textureKey!==null?String(e.textureKey):"";return t&&t.length?t:this._default2DKey}get2DView(e){let t=String(e),a=this._texPairs.get(t);return a?a.isA?a.viewA:a.viewB:null}getCurrentView(e=null){let t=e!=null?String(e):this._tid,a=this._texPairs.get(t);return a?a.isA?a.viewA:a.viewB:null}getCurrentTextureResource(e=null){let t=e!=null?String(e):this._tid,a=this._texPairs.get(t);return a?{texture:a.isA?a.texA:a.texB,view:a.isA?a.viewA:a.viewB,width:a.fullWidth,height:a.fullHeight,layers:a.layers,format:"rgba16float"}:null}_compute3DTiling(e,t,a){let r=Math.min(e,ei),o=Math.min(t,ei),s=this.device?.limits?.maxBufferSize??256*1024*1024,c=r*o*Co,n=Math.max(1,Math.floor(s*.8/Math.max(1,c))),l=Math.min(a,ei,n),d=Math.ceil(e/r),u=Math.ceil(t/o),f=Math.ceil(a/l);return{tw:r,th:o,td:l,nx:d,ny:u,nz:f}}_create3DChunks(e,t,a){let r=this._compute3DTiling(e,t,a),o=[],s=GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC|GPUTextureUsage.COPY_DST;for(let c=0;c<r.nz;c++)for(let n=0;n<r.ny;n++)for(let l=0;l<r.nx;l++){let d=l*r.tw,u=n*r.th,f=c*r.td,p=this.device.createTexture({size:{width:r.tw,height:r.th,depthOrArrayLayers:r.td},dimension:"3d",format:"rgba16float",usage:s}),x=this.device.createTexture({size:{width:r.tw,height:r.th,depthOrArrayLayers:r.td},dimension:"3d",format:"rgba16float",usage:s}),y=p.createView({dimension:"3d"}),m=x.createView({dimension:"3d"});p.label=`3D texA ${r.tw}x${r.th}x${r.td} @ (${l},${n},${c})`,x.label=`3D texB ${r.tw}x${r.th}x${r.td} @ (${l},${n},${c})`,y.label=`3D:viewA[${l},${n},${c}]`,m.label=`3D:viewB[${l},${n},${c}]`,this._tag.set(y,`3D:A[${l},${n},${c}]`),this._tag.set(m,`3D:B[${l},${n},${c}]`),o.push({texA:p,texB:x,viewA:y,viewB:m,ox:d,oy:u,oz:f,w:r.tw,h:r.th,d:r.td,isA:!0,fb:null,posBuf:null,bgA:null,bgB:null})}return{chunks:o,tile:{w:r.tw,h:r.th,d:r.td},full:{w:e,h:t,d:a},grid:{nx:r.nx,ny:r.ny,nz:r.nz}}}_destroy3DSet(e){if(e)for(let t of e.chunks){try{t.texA.destroy()}catch{}try{t.texB.destroy()}catch{}if(t.viewA=null,t.viewB=null,t.bgA=null,t.bgB=null,t.fb){try{t.fb.destroy()}catch{}t.fb=null}if(t.posBuf&&t.posBuf!==this.nullPosBuffer){try{t.posBuf.destroy()}catch{}t.posBuf=null}}}destroyAllVolumes(){for(let[e,t]of this._volumeCache)this._destroy3DSet(t),this._volumeCache.delete(e)}get3DView(e){let t=this._volumeCache.get(String(e));if(!t)return null;let a=t.chunks.map(r=>r.isA?r.viewA:r.viewB);return a.length===1?a[0]:{views:a,meta:{full:t.full,tile:t.tile,grid:t.grid}}}destroyVolume(e){let t=String(e),a=this._volumeCache.get(t);a&&(this._destroy3DSet(a),this._volumeCache.delete(t))}_getOrCreate3DVolume(e,t,a,r=null,o=null){let s=r?String(r):`${e}x${t}x${a}`,c=this._volumeCache.get(s);if(c)return c;c=this._create3DChunks(e,t,a);for(let n of c.chunks){n.fb=this.device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let l=o&&Number.isFinite(o?.w)?o.w>>>0:c.full.w,d=o&&Number.isFinite(o?.h)?o.h>>>0:c.full.h,u=o&&Number.isFinite(o?.d)?o.d>>>0:c.full.d,f=l/c.full.w,p=d/c.full.h,x=n.ox*f,y=n.oy*p;this._writeFrameUniform(n.fb,{fullWidth:l,fullHeight:d,tileWidth:n.w,tileHeight:n.h,originX:n.ox,originY:n.oy,originZ:n.oz,fullDepth:u,tileDepth:n.d,layerIndex:0,layers:1,originXf:x,originYf:y});let m=this._buildPosBuffer(n.w,n.h,null);n.posBuf=m;try{n.bgA=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:this._dummy2D_sampleView},{binding:4,resource:this._dummy2D_writeView},{binding:5,resource:{buffer:m}},{binding:6,resource:{buffer:n.fb}},{binding:7,resource:n.viewA},{binding:8,resource:n.viewB}]}),n.bgB=this.device.createBindGroup({layout:this.bindGroupLayout,entries:[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:this._dummy2D_sampleView},{binding:4,resource:this._dummy2D_writeView},{binding:5,resource:{buffer:n.posBuf}},{binding:6,resource:{buffer:n.fb}},{binding:7,resource:n.viewB},{binding:8,resource:n.viewA}]})}catch(M){throw new Error(`_getOrCreate3DVolume: createBindGroup failed: ${M?.message||M}`)}}return c._bindGroupsDirty=!1,this._volumeCache.set(s,c),c}_recreate3DBindGroups(e,t=null){if(!e||!Array.isArray(e.chunks))return;let a=t&&Number.isFinite(t.w)?t.w>>>0:e.full.w,r=t&&Number.isFinite(t.h)?t.h>>>0:e.full.h,o=t&&Number.isFinite(t.d)?t.d>>>0:e.full.d;for(let s of e.chunks){if(!s.fb){s.fb=this.device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});let l=a/e.full.w,d=r/e.full.h,u=s.ox*l,f=s.oy*d;this._writeFrameUniform(s.fb,{fullWidth:a,fullHeight:r,tileWidth:s.w,tileHeight:s.h,originX:s.ox,originY:s.oy,originZ:s.oz,fullDepth:o,tileDepth:s.d,layerIndex:0,layers:1,originXf:u,originYf:f})}s.posBuf||(s.posBuf=this._buildPosBuffer(s.w,s.h,null));let c=[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:this._dummy2D_sampleView},{binding:4,resource:this._dummy2D_writeView},{binding:5,resource:{buffer:s.posBuf}},{binding:6,resource:{buffer:s.fb}},{binding:7,resource:s.viewA},{binding:8,resource:s.viewB}],n=[{binding:0,resource:{buffer:this.optionsBuffer}},{binding:1,resource:{buffer:this.paramsBuffer}},{binding:2,resource:{buffer:this.permBuffer}},{binding:3,resource:this._dummy2D_sampleView},{binding:4,resource:this._dummy2D_writeView},{binding:5,resource:{buffer:s.posBuf}},{binding:6,resource:{buffer:s.fb}},{binding:7,resource:s.viewB},{binding:8,resource:s.viewA}];try{s.bgA=this.device.createBindGroup({layout:this.bindGroupLayout,entries:c}),s.bgB=this.device.createBindGroup({layout:this.bindGroupLayout,entries:n})}catch(l){throw new Error(`_recreate3DBindGroups: failed to create bind groups: ${l?.message||l}`)}}e._bindGroupsDirty=!1}async computeToTexture3D(e,t,a,r={},o={}){let s=e|0,c=t|0,n=a|0;if(!(s>0&&c>0&&n>0))throw new Error(`computeToTexture3D: invalid size ${e}x${t}x${a}`);r&&!Array.isArray(r)&&this.setNoiseParams(r);let l=o||{};this.setOptions({...l,ioFlags:3,useCustomPos:l.useCustomPos??this.useCustomPos});let d=o&&(Number.isFinite(o.frameFullWidth)||Number.isFinite(o.frameFullHeight)||Number.isFinite(o.frameFullDepth))?{w:Number.isFinite(o.frameFullWidth)?o.frameFullWidth>>>0:s,h:Number.isFinite(o.frameFullHeight)?o.frameFullHeight>>>0:c,d:Number.isFinite(o.frameFullDepth)?o.frameFullDepth>>>0:n}:null,u=this._getOrCreate3DVolume(s,c,n,o.id,d);if(!u)throw new Error("computeToTexture3D: failed to create or retrieve volume");(u._bindGroupsDirty||!u.chunks[0].bgA||!u.chunks[0].bgB)&&this._recreate3DBindGroups(u,d),this._update3DChunkFrames(u,d,o);let f=null;for(let x of u.chunks){let y=x.isA?x.bgA:x.bgB,m=x.isA?x.bgB:x.bgA;if(!y||!m)throw new Error("computeToTexture3D: missing bind groups (volume not initialized correctly)");f=await this._runPipelines(y,m,x.w,x.h,x.d,r,x.d),x.isA=f===x.bgB}let p=u.chunks.map(x=>x.isA?x.viewA:x.viewB);return p.length===1?p[0]:{views:p,meta:{full:u.full,tile:u.tile,grid:u.grid}}}configureCanvas(e){let t=navigator.gpu.getPreferredCanvasFormat&&navigator.gpu.getPreferredCanvasFormat()||"bgra8unorm",a=e.getContext("webgpu");a.configure({device:this.device,format:t,alphaMode:"opaque",size:[e.width,e.height]}),this._ctxMap.set(e,{ctx:a,size:[e.width,e.height]})}initBlitRender(){this.sampler||(this.sampler=this.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"})),this.bgl2D||(this.bgl2D=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this.pipeline2D=this.device.createRenderPipeline({layout:this.device.createPipelineLayout({bindGroupLayouts:[this.bgl2D]}),vertex:{module:this.device.createShaderModule({code:Ja}),entryPoint:"vs_main"},fragment:{module:this.device.createShaderModule({code:Ja}),entryPoint:"fs_main",targets:[{format:"bgra8unorm"}]},primitive:{topology:"triangle-list"}}),this.blit2DUbo=this.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.bgl3D||(this.bgl3D=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"3d"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),this.pipeline3D=this.device.createRenderPipeline({layout:this.device.createPipelineLayout({bindGroupLayouts:[this.bgl3D]}),vertex:{module:this.device.createShaderModule({code:Qa}),entryPoint:"vs_main"},fragment:{module:this.device.createShaderModule({code:Qa}),entryPoint:"fs_main",targets:[{format:"bgra8unorm"}]},primitive:{topology:"triangle-list"}}),this.blit3DUbo=this.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}))}_renderCommonCanvasSetup(e,t){let a="bgra8unorm",r=this._ctxMap.get(e);if(r){let c=e.width|0,n=e.height|0;(r.size[0]!==c||r.size[1]!==n)&&(r.size=[c,n],r.ctx.configure({device:this.device,format:a,alphaMode:"opaque",size:r.size}))}else{let c=e.getContext("webgpu"),n=[e.width|0,e.height|0];c.configure({device:this.device,format:a,alphaMode:"opaque",size:n}),r={ctx:c,size:n},this._ctxMap.set(e,r)}let o=this.device.createCommandEncoder(),s=o.beginRenderPass({colorAttachments:[{view:r.ctx.getCurrentTexture().createView(),loadOp:t?"clear":"load",clearValue:{r:0,g:0,b:0,a:1},storeOp:"store"}]});return{enc:o,pass:s,ctxEntry:r}}renderTextureToCanvas(e,t,a={}){let{layer:r=0,channel:o=0,preserveCanvasSize:s=!0,clear:c=!0}=a;if(this.initBlitRender(),!s)try{let f=e.texture;f&&typeof f.width=="number"&&typeof f.height=="number"&&(t.width=f.width,t.height=f.height)}catch{}let n=new Uint32Array([r>>>0,o>>>0,0,0]);this.queue.writeBuffer(this.blit2DUbo,0,n.buffer,n.byteOffset,n.byteLength);let l=this.device.createBindGroup({layout:this.bgl2D,entries:[{binding:0,resource:this.sampler},{binding:1,resource:e},{binding:2,resource:{buffer:this.blit2DUbo}}]}),{enc:d,pass:u}=this._renderCommonCanvasSetup(t,c);u.setPipeline(this.pipeline2D),u.setBindGroup(0,l),u.draw(6,1,0,0),u.end(),this.queue.submit([d.finish()])}renderTexture3DSliceToCanvas(e,t,a={}){let{depth:r,slice:o=0,zNorm:s=null,channel:c=0,chunk:n=0,preserveCanvasSize:l=!0,clear:d=!0}=a;this.initBlitRender();let u,f;if(e&&e.views&&Array.isArray(e.views)?(u=e.views[Math.max(0,Math.min(n|0,e.views.length-1))],f=e.meta?.tile?.d??r):(u=e,f=r),!u||!f)throw new Error("renderTexture3DSliceToCanvas: need a 3D view and its depth");if(!l)try{let v=u.texture;v&&typeof v.width=="number"&&typeof v.height=="number"&&(t.width=v.width,t.height=v.height)}catch{}let p=s??(Math.min(Math.max(o,0),f-1)+.5)/f;p=Math.min(Math.max(p,0),1);let x=new ArrayBuffer(16),y=new DataView(x);y.setFloat32(0,p,!0),y.setUint32(4,c>>>0,!0),y.setUint32(8,0,!0),y.setUint32(12,0,!0),this.queue.writeBuffer(this.blit3DUbo,0,x);let m=this.device.createBindGroup({layout:this.bgl3D,entries:[{binding:0,resource:this.sampler},{binding:1,resource:u},{binding:2,resource:{buffer:this.blit3DUbo}}]}),{enc:M,pass:h}=this._renderCommonCanvasSetup(t,d);h.setPipeline(this.pipeline3D),h.setBindGroup(0,m),h.draw(6,1,0,0),h.end(),this.queue.submit([M.finish()])}setExportBackground(e="black"){this.exportBackground=e}_resolveExportBackground(e){let t=e===void 0?this.exportBackground:e;if(t==null)return{r:0,g:0,b:0,a:1,transparent:!1};if(typeof t=="string"){let r=t.trim().toLowerCase();if(r==="transparent")return{r:0,g:0,b:0,a:0,transparent:!0};if(r==="black")return{r:0,g:0,b:0,a:1,transparent:!1};if(r==="white")return{r:1,g:1,b:1,a:1,transparent:!1};if(r[0]==="#")return this._parseHexBackground(r)}let a=r=>{let o=Number(r);if(!Number.isFinite(o))return 0;let s=o>1?o/255:o;return Math.min(Math.max(s,0),1)};if(Array.isArray(t)){let r=a(t[0]),o=a(t[1]),s=a(t[2]),c=t.length>=4?a(t[3]):1;return{r,g:o,b:s,a:c,transparent:c<=0}}if(typeof t=="object"){let r=a(t.r),o=a(t.g),s=a(t.b),c=t.a===void 0?1:a(t.a);return{r,g:o,b:s,a:c,transparent:c<=0}}return{r:0,g:0,b:0,a:1,transparent:!1}}_parseHexBackground(e){let t=String(e).trim().replace(/^#/,""),a=f=>f+f,r=0,o=0,s=0,c=255;if(t.length===3||t.length===4)r=parseInt(a(t[0]),16),o=parseInt(a(t[1]),16),s=parseInt(a(t[2]),16),t.length===4&&(c=parseInt(a(t[3]),16));else if(t.length===6||t.length===8)r=parseInt(t.slice(0,2),16),o=parseInt(t.slice(2,4),16),s=parseInt(t.slice(4,6),16),t.length===8&&(c=parseInt(t.slice(6,8),16));else return{r:0,g:0,b:0,a:1,transparent:!1};let n=r/255,l=o/255,d=s/255,u=c/255;return{r:n,g:l,b:d,a:u,transparent:u<=0}}_applyExportBackground(e,t){if(!e||!t||t.transparent)return;let a=Math.round(t.r*255),r=Math.round(t.g*255),o=Math.round(t.b*255),s=Math.round((t.a??1)*255);if(s<=0)return;let c=e.length|0;if(s>=255){for(let n=0;n<c;n+=4){let l=e[n+3]|0;if(l===255)continue;if(l===0){e[n+0]=a,e[n+1]=r,e[n+2]=o,e[n+3]=255;continue}let d=255-l;e[n+0]=(e[n+0]*l+a*d)/255|0,e[n+1]=(e[n+1]*l+r*d)/255|0,e[n+2]=(e[n+2]*l+o*d)/255|0,e[n+3]=255}return}for(let n=0;n<c;n+=4){let l=e[n+0]|0,d=e[n+1]|0,u=e[n+2]|0,f=e[n+3]|0,p=f+s*(255-f)/255|0;if(p<=0){e[n+0]=0,e[n+1]=0,e[n+2]=0,e[n+3]=0;continue}let x=a*s|0,y=r*s|0,m=o*s|0,M=l*f|0,h=d*f|0,v=u*f|0,b=255-f|0,z=M+x*b/255|0,D=h+y*b/255|0,_=v+m*b/255|0;e[n+0]=Math.min(255,Math.max(0,z*255/p|0)),e[n+1]=Math.min(255,Math.max(0,D*255/p|0)),e[n+2]=Math.min(255,Math.max(0,_*255/p|0)),e[n+3]=Math.min(255,Math.max(0,p))}}_forceOpaqueAlpha(e){let t=e.length|0;for(let a=3;a<t;a+=4)e[a]=255}async export2DTextureToPNGBlob(e,t,a,r={}){if(!e)throw new Error("export2DTextureToPNGBlob: textureView is required");let o=Math.max(1,t|0),s=Math.max(1,a|0),c=r.layer??0,n=r.channel??0,l=this._resolveExportBackground(r.background);if(this.initBlitRender(),this.queue&&this.queue.onSubmittedWorkDone)try{await this.queue.onSubmittedWorkDone()}catch{}let u=this.device.createTexture({size:[o,s,1],format:"bgra8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),f=new Uint32Array([c>>>0,n>>>0,0,0]);this.queue.writeBuffer(this.blit2DUbo,0,f.buffer,f.byteOffset,f.byteLength);let p=this.device.createBindGroup({layout:this.bgl2D,entries:[{binding:0,resource:this.sampler},{binding:1,resource:e},{binding:2,resource:{buffer:this.blit2DUbo}}]}),x=this.device.createCommandEncoder(),y=x.beginRenderPass({colorAttachments:[{view:u.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});if(y.setPipeline(this.pipeline2D),y.setBindGroup(0,p),y.draw(6,1,0,0),y.end(),this.queue.submit([x.finish()]),this.queue&&this.queue.onSubmittedWorkDone)try{await this.queue.onSubmittedWorkDone()}catch{}let m=await this._readBGRA8TextureToRGBA8Pixels(u,o,s,{maxBufferChunkBytes:r.maxBufferChunkBytes??this.maxBufferChunkBytes});u.destroy();let M=r.useAlphaForBackground===!0;l.transparent||M?this._applyExportBackground(m,l):this._forceOpaqueAlpha(m);let h=document.createElement("canvas");h.width=o,h.height=s;let v=h.getContext("2d");if(!v)throw new Error("export2DTextureToPNGBlob: unable to get 2D context");return v.putImageData(new ImageData(m,o,s),0,0),await new Promise((z,D)=>{h.toBlob(_=>{_?z(_):D(new Error("export2DTextureToPNGBlob: toBlob returned null"))},"image/png")})}async exportCurrent2DToPNGBlob(e,t,a={}){let r=this.getCurrentView();if(!r)throw new Error("exportCurrent2DToPNGBlob: no active 2D texture view");return this.export2DTextureToPNGBlob(r,e,t,a)}async export3DSliceToPNGBlob(e,t,a,r={}){if(!e)throw new Error("export3DSliceToPNGBlob: target is required");let o=Math.max(1,t|0),s=Math.max(1,a|0),{depth:c,slice:n=0,zNorm:l=null,channel:d=0,chunk:u=0}=r;if(!c||c<=0)throw new Error("export3DSliceToPNGBlob: depth must be provided and > 0");let f=this._resolveExportBackground(r.background);if(this.initBlitRender(),this.queue&&this.queue.onSubmittedWorkDone)try{await this.queue.onSubmittedWorkDone()}catch{}let p,x;if(e&&e.views&&Array.isArray(e.views)){let N=Math.max(0,Math.min(u|0,e.views.length-1));p=e.views[N],x=e.meta?.tile?.d??c}else p=e,x=c;if(!p||!x)throw new Error("export3DSliceToPNGBlob: need a 3D view and its depth");let y=l??(Math.min(Math.max(n,0),x-1)+.5)/x;y=Math.min(Math.max(y,0),1);let M=this.device.createTexture({size:[o,s,1],format:"bgra8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),h=new ArrayBuffer(16),v=new DataView(h);v.setFloat32(0,y,!0),v.setUint32(4,d>>>0,!0),v.setUint32(8,0,!0),v.setUint32(12,0,!0),this.queue.writeBuffer(this.blit3DUbo,0,h);let b=this.device.createBindGroup({layout:this.bgl3D,entries:[{binding:0,resource:this.sampler},{binding:1,resource:p},{binding:2,resource:{buffer:this.blit3DUbo}}]}),z=this.device.createCommandEncoder(),D=z.beginRenderPass({colorAttachments:[{view:M.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});D.setPipeline(this.pipeline3D),D.setBindGroup(0,b),D.draw(6,1,0,0),D.end();let _=4,S=256,k=o*_,g=Math.ceil(k/S)*S,w=g*s,P=this.device.createBuffer({size:w,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});z.copyTextureToBuffer({texture:M},{buffer:P,bytesPerRow:g,rowsPerImage:s},{width:o,height:s,depthOrArrayLayers:1}),this.queue.submit([z.finish()]),this.queue&&this.queue.onSubmittedWorkDone&&await this.queue.onSubmittedWorkDone(),await P.mapAsync(GPUMapMode.READ);let C=P.getMappedRange(),B=new Uint8Array(C),W=new Uint8ClampedArray(o*s*_),R=0;for(let N=0;N<s;N++){let O=N*g;for(let Z=0;Z<o;Z++){let Y=O+Z*4;W[R++]=B[Y+2],W[R++]=B[Y+1],W[R++]=B[Y+0],W[R++]=B[Y+3]}}P.unmap(),P.destroy(),M.destroy(),this._applyExportBackground(W,f);let Q=document.createElement("canvas");Q.width=o,Q.height=s;let q=Q.getContext("2d");if(!q)throw new Error("export3DSliceToPNGBlob: unable to get 2D context");return q.putImageData(new ImageData(W,o,s),0,0),await new Promise((N,O)=>{Q.toBlob(Z=>{Z?N(Z):O(new Error("export3DSliceToPNGBlob: toBlob returned null"))},"image/png")})}async _render3DSliceToRGBA8Pixels(e,t,a,r,o=0,s=null){if(!e)throw new Error("_render3DSliceToRGBA8Pixels: view3D is required");let c=Math.max(1,t|0),n=Math.max(1,a|0);this.initBlitRender();let l=Math.min(Math.max(Number(r)||0,0),1),u=this.device.createTexture({size:[c,n,1],format:"bgra8unorm",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}),f=new ArrayBuffer(16),p=new DataView(f);p.setFloat32(0,l,!0),p.setUint32(4,o>>>0,!0),p.setUint32(8,0,!0),p.setUint32(12,0,!0),this.queue.writeBuffer(this.blit3DUbo,0,f);let x=this.device.createBindGroup({layout:this.bgl3D,entries:[{binding:0,resource:this.sampler},{binding:1,resource:e},{binding:2,resource:{buffer:this.blit3DUbo}}]}),y=this.device.createCommandEncoder(),m=y.beginRenderPass({colorAttachments:[{view:u.createView(),loadOp:"clear",storeOp:"store",clearValue:{r:0,g:0,b:0,a:0}}]});m.setPipeline(this.pipeline3D),m.setBindGroup(0,x),m.draw(6,1,0,0),m.end();let M=4,h=256,v=c*M,b=Math.ceil(v/h)*h,z=b*n,D=this.device.createBuffer({size:z,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});y.copyTextureToBuffer({texture:u},{buffer:D,bytesPerRow:b,rowsPerImage:n},{width:c,height:n,depthOrArrayLayers:1}),this.queue.submit([y.finish()]),this.queue&&this.queue.onSubmittedWorkDone&&await this.queue.onSubmittedWorkDone(),await D.mapAsync(GPUMapMode.READ);let _=D.getMappedRange(),S=new Uint8Array(_),k=new Uint8ClampedArray(c*n*M),g=0;for(let w=0;w<n;w++){let P=w*b;for(let C=0;C<c;C++){let B=P+C*4;k[g++]=S[B+2],k[g++]=S[B+1],k[g++]=S[B+0],k[g++]=S[B+3]}}return D.unmap(),D.destroy(),u.destroy(),s&&this._applyExportBackground(k,s),k}async export3DTilesetToPNGBlob(e,t,a,r={}){if(!e)throw new Error("export3DTilesetToPNGBlob: target is required");let o=Math.max(1,t|0),s=Math.max(1,(a??t)|0),{depth:c,channel:n=0,chunk:l=0,tilesAcross:d=16,tilesDown:u=null,startSlice:f=0,sliceCount:p=null}=r,x=this._resolveExportBackground(r.background);if(this.initBlitRender(),this.queue&&this.queue.onSubmittedWorkDone)try{await this.queue.onSubmittedWorkDone()}catch{}let y,m;if(e&&e.views&&Array.isArray(e.views)){let P=Math.max(0,Math.min(l|0,e.views.length-1));y=e.views[P],m=e.meta?.tile?.d??c}else y=e,m=c;if(!y)throw new Error("export3DTilesetToPNGBlob: missing 3D view");if(!m||m<=0)throw new Error("export3DTilesetToPNGBlob: depth must be provided and > 0");let M=Math.max(1,d|0),h=u!=null?Math.max(1,u|0):Math.ceil(m/M),v=Math.min(Math.max(f|0,0),m-1),b=p!=null?Math.max(0,p|0):m-v,z=o*M,D=s*h,_=new Uint8ClampedArray(z*D*4),S=Math.min(m,v+b);for(let P=v;P<S;P++){let C=P-v,B=C%M,W=C/M|0;if(W>=h)break;let R=(P+.5)/m,Q=await this._render3DSliceToRGBA8Pixels(y,o,s,R,n,x),q=B*o,E=W*s;for(let N=0;N<s;N++){let O=N*o*4,Z=((E+N)*z+q)*4;_.set(Q.subarray(O,O+o*4),Z)}}let k=document.createElement("canvas");k.width=z,k.height=D;let g=k.getContext("2d");if(!g)throw new Error("export3DTilesetToPNGBlob: unable to get 2D context");return g.putImageData(new ImageData(_,z,D),0,0),await new Promise((P,C)=>{k.toBlob(B=>{B?P(B):C(new Error("export3DTilesetToPNGBlob: toBlob returned null"))},"image/png")})}},ea=class{constructor(e=Date.now()){e<1e7&&(e*=1e7),this.seedN=e,this.seedK=e,this.perm=new Uint8Array(512),this.seed(e)}seed(e){let t=this.xorshift(e);for(let a=0;a<256;a++)this.perm[a]=a;for(let a=255;a>0;a--){let r=Math.floor(t()*(a+1));[this.perm[a],this.perm[r]]=[this.perm[r],this.perm[a]]}for(let a=0;a<256;a++)this.perm[a+256]=this.perm[a]}setSeed(e){this.seedN=e,this.seed(e),this.resetSeed()}random(e,t,a){let r;return typeof a=="number"?r=this.perm[(e&255)+this.perm[(t&255)+this.perm[a&255]]]&255:r=this.perm[(e&255)+this.perm[t&255]]&255,this.perm[r]/255*2-1}seededRandom(){this.seedK+=Math.E;let e=1e9*Math.sin(this.seedK);return e-Math.floor(e)}resetSeed(){this.seedK=this.seedN}xorshift(e){let t=e;return function(){return t^=t<<13,t^=t>>17,t^=t<<5,(t<0?1+~t:t)/4294967295}}dot(e,t=0,a=0,r=0){return e[0]*t+e[1]*a+e[2]*r}};function Sa(i,e,t){let a=Math.min(1,Math.max(0,(t-i)/(e-i)));return a*a*(3-2*a)}function ta(i,e){return Sa(.0175,.0805,Math.min(i,e-i)/e)}function ti(i,e,t){let a=i.length,r=2*t+1,o=0;for(let s=-t;s<=t;s++)o+=i[(s+a)%a];for(let s=0;s<a;s++)e[s]=o/r,o+=i[(s+t+1)%a]-i[(s-t+a)%a]}function ai(i,e){let t=e-1;if(t<64)return;let a=Math.floor(Math.asin(.25)/Math.PI*t),r=new Float32Array(t),o=new Float32Array(t),s=Float64Array.from({length:t},(f,p)=>Math.cos(p*2*Math.PI/t)),c=Float64Array.from({length:t},(f,p)=>Math.sin(p*2*Math.PI/t)),n=Math.max(2,Math.round(t*.005)),l=Math.max(1,Math.round(t*.0035)),d=[1,4,6,4,1],u=new Float32Array((a+l*2+1)*e);for(let f of[0,t]){let p=f===0?1:-1;for(let D=1;D<=a;D++){let _=Math.sin(Math.PI*D/t),S=1-Sa(.071,.25,_),k=Math.min(Math.floor(.23*t),Math.max(1,Math.round((1.5+2.3*S)/(2*_)))),g=(f+p*D)*e;r.set(i.subarray(g,g+t));let w=0,P=0;for(let R=0;R<t;R++)w+=r[R]*s[R],P+=r[R]*c[R];ti(r,o,k),ti(o,r,k),ti(r,o,k);let C=2*k+1,W=2*(1-(Math.sin(C*Math.PI/t)/(C*Math.sin(Math.PI/t)))**3)/t;for(let R=0;R<t;R++){let Q=W*(w*s[R]+P*c[R]);i[g+R]+=S*(o[R]+Q-i[g+R])}i[g+t]=i[g]}for(let D=0;D<=a+l*2;D++){let _=(f+p*D)*e;u.set(i.subarray(_,_+e),D*e)}let x=0;for(let D of[l,2*l]){let _=0;for(let S=0;S<t;S++)_+=u[D*e+S];x+=(D===l?8:2)*_/t}i.fill((6*u[0]+x)/16,f*e,(f+1)*e);let y=Math.floor(t/2),m=t%2;for(let D=1;D<=a;D++){let _=Math.sin(Math.PI*D/t),S=1-Sa(.038,.21,_);if(S<=0)break;let k=(f+p*D)*e;for(let g=0;g<t;g++){let w=0;for(let P=0;P<5;P++){let C=D+(P-2)*l,B=Math.abs(C)*e,W=C<0?(g+y)%t:g,R=u[B+W];w+=d[P]*(C<0&&m?(R+u[B+(W+1)%t])*.5:R)}i[k+g]+=S*(w/16-i[k+g])}i[k+t]=i[k]}let M=i[f*e],h=(f+p*n)*e,v=0,b=0,z=0;for(let D=0;D<t;D++){let _=i[h+D]-M;v+=_,b+=_*s[D],z+=_*c[D]}v/=t,b*=2/t,z*=2/t;for(let D=1;D<n;D++){let _=Math.sin(Math.PI*D/t)/Math.sin(Math.PI*n/t),S=1-Sa(.45,1,_),k=(f+p*D)*e;for(let g=0;g<t;g++){let w=M+(b*s[g]+z*c[g])*_+v*_*_;i[k+g]+=S*(w-i[k+g])}i[k+t]=i[k]}}}function hr(i,e,t=1){let a=e-1,r=a*(e-2),o=new Int32Array(r).fill(-1),s=new Int32Array(r).fill(-1),c=new Uint8Array(r),n=new Float32Array(r),l=new Float32Array(r),d=new Float32Array(r),u=new Uint32Array(r),f=_=>(_+a)%a,p=Float64Array.from({length:e},(_,S)=>Math.sin(Math.PI*S/a));for(let _=1;_<a;_++){let S=p[_],k=Math.max(.06,2*S),g=1/Math.hypot(1,k);for(let w=0;w<a;w++){let P=(_-1)*a+w,C=i[_*e+w];d[P]=S;let B=-1,W=-1,R=0,Q=0;for(let q=-1;q<=1;q++){let E=_+q;if(!(E<=0||E>=a))for(let N=-1;N<=1;N++){if(!N&&!q)continue;let O=f(w+N),Y=(C-i[E*e+O])*(q?N?g:1:1/k),X=(E-1)*a+O;Y>R?(W=B,Q=R,B=X,R=Y):Y>Q&&(W=X,Q=Y)}}B<0||(o[P]=B,n[P]=R,c[B]++,Q>=.42*R&&(s[P]=W,c[W]++,l[P]=Q*Q/(R*R+Q*Q)))}}let x=0;for(let _=0;_<r;_++)c[_]||(u[x++]=_);for(let _=0;_<x;_++){let S=u[_],k=o[S],g=s[S];if(k<0)continue;let w=d[S]*l[S];d[k]+=d[S]-w,--c[k]||(u[x++]=k),g>=0&&(d[g]+=w,--c[g]||(u[x++]=g))}let y=new Float32Array(r),m=new Float32Array(r),M=new Float32Array(r),h=.66*Math.PI/(.023*a),v=.023*a/Math.PI,b=(1e3/a)**2,z=_=>Math.min(1,Math.max(0,_)),D=[-1,1];for(let _=0;_<r;_++){let S=Math.max(0,d[_]-p[Math.floor(_/a)+1]),k=Math.max(0,Math.min(1,(Math.log2(1+S*b)-2.65)/5.9)),g=n[_]*v;y[_]=k*(.065+.18*k)*(.7+.3*z(g/.22));let w=o[_];if(w>=0){let X=Math.max(0,n[_]-h)*.11;m[_]-=X,m[w]+=X}if(k<.5||w<0)continue;let P=Math.floor(_/a)+1,C=_%a,B=Math.floor(w/a)+1-P,W=(w%a-C+a+1)%a-1,R=n[w]*v,Q=z((g-R-.035)/.32),q=1-z(R/.28),E=X=>{let te=Math.max(1,Math.min(a-1,P+X*W));return d[(te-1)*a+f(C-X*B)]},N=z(1.8*(1-Math.max(E(-1),E(1))/d[_])),O=Q*q*N*k*.06,Z=1-z(g/.13),Y=i[P*e+C];for(let X of D){let te=P+X*W;if(Z>0&&te>0&&te<a){let ie=f(C-X*B),F=(te-1)*a+ie,L=i[te*e+ie]-Y-.018;M[F]=Math.max(M[F],Math.min(.043,Math.max(0,L))*Z*k)}if(O>0)for(let ie=1;ie<=3;ie++){let F=P+ie*B+X*W*Math.min(ie,2);if(F<1||F>=a)continue;let L=f(C+ie*W-X*B*Math.min(ie,2));m[(F-1)*a+L]+=O*(1-ie/4)}}}for(let _=1;_<a;_++){let S=t*ta(_,a);for(let k=0;k<a;k++){let g=(_-1)*a+k,w=0;for(let P=-1;P<=1;P++){let C=Math.max(1,Math.min(a-1,_+P));for(let B=-1;B<=1;B++)w+=y[(C-1)*a+f(k+B)]*(B?1:2)*(P?1:2)}i[_*e+k]+=S*(Math.min(.06,m[g])-M[g]-.52*y[g]-.82*w/16)}i[_*e+a]=i[_*e]}return i}var vt=2*Math.PI,Ve=(i,e,t)=>Math.min(t,Math.max(e,i)),We=(i,e,t)=>{let a=Ve((t-i)/(e-i),0,1);return a*a*(3-2*a)};function mr(i,e,t){return e*(.9*Math.sin(vt*i)+.34*Math.sin(1.7*vt*i+t*vt))}function Ao(i,e,t,a,r,o){let{x:s,y:c,xScale:n,yScale:l,dx:d,dy:u,length:f,width:p,bend:x,branch:y,cirque:m,head:M,outlet:h}=a,v=e-1,b=t.side-1,z=Ve(M-h,.14,.73),D=x/f,_=q=>h-.04*z+.7*z*(1-Ve(q,0,1))**2,S=[],k=4+Math.floor(4*m);for(let q=0;q<k;q++){let E=.16+.79*(q+.15+.7*o())/k,N=.1+.24*o(),O=y*(q%2?-1:1)*(.065+.14*o()),Z=E-N,Y=(.31+.3*o())*p/f;if(S.push({start:Z,end:E,offset:O,root:0,bank:Y,depth:.43+.24*o()}),o()<.74){let X=.33+.32*o(),te=Z+N*X,ie=O*(1-X)**1.3;S.push({start:te-(.055+.105*o()),end:te,offset:-O*(.24+.28*o()),root:ie,bank:.63*Y,depth:.32})}}let g=d*f/n,w=u*f/l,P=.39*f,C=Math.max(1,Math.floor(c+Math.min(-.37*w,1.11*w)-P/l)),B=Math.min(v-1,Math.ceil(c+Math.max(-.37*w,1.11*w)+P/l)),W=Math.floor(s+Math.min(-.37*g,1.11*g)-P/n),R=Math.ceil(s+Math.max(-.37*g,1.11*g)+P/n),Q=.58*Math.hypot(u*n,d*l)/f;for(let q=C;q<=B;q++){let E=Math.round(q*b/v)*t.side;for(let N=W;N<=R;N++){let O=(N-s)*n,Z=(q-c)*l,Y=(O*d+Z*u)/f;if(Y<=-.37||Y>=1.11)continue;let X=(-O*u+Z*d)/f-mr(Y,D,m);if(Math.abs(X)>.3)continue;let te=(N%v+v)%v,ie=q*e+te,F=i[ie],L=We(-.02,.23,Y),j=Math.max(Q,p/f*(.32+.68*L)*(1+.22*Math.sin(13*Y+m*vt))),I=X*y<0?.69:1.13,$=Math.max(0,1-Math.abs(X)/(j*I)),V=We(-.03,.14,Y)*(1-We(.94,1.11,Y)),K=V*$**1.25*Ve(F-_(Y)+.24*z,0,.88),ae=V*$;for(let A of S){if(Y<=A.start||Y>=A.end+.025)continue;let H=Ve((Y-A.start)/(A.end-A.start),0,1),T=A.root+A.offset*(1-H)**1.3,G=Math.max(Q*.75,A.bank*(.22+.78*H)),J=Math.max(0,1-Math.abs(X-T)/G),ee=We(0,.46,H)*(1-We(A.end,A.end+.025,Y)),oe=_(A.end)+z*.42*(1-H);K=Math.max(K,ee*J*Ve(F-oe+.1*z,0,.72)*A.depth),ae=Math.max(ae,.72*ee*J)}if(i[ie]=F-r*K,ae>0){let A=Math.round(te*b/v)%b,H=E+A;t.values[H]=Math.max(t.values[H],r*ae),A===0&&(t.values[E+b]=t.values[H])}}i[q*e+v]=i[q*e]}}function ii(i,e,t,a,r){let o=!!r,s=We(.18,.84,a);if(e<257||s===0)return[];let c=e-1,n=g=>(g%c+c)%c,l=(g,w)=>i[Ve(Math.round(w),0,c)*e+n(Math.round(g))],d=(g,w)=>{let P=g/c*vt,C=w/c*Math.PI;return[Math.sin(C)*Math.cos(P),Math.cos(C),Math.sin(C)*Math.sin(P)]},u=t>>>0,f=()=>(u=Math.imul(u,1664525)+1013904223>>>0,u/2**32),p=[],x=[],y=[];for(let g=0;g<24;g++){let w=Math.acos(1-(g+.5)/12)*c/Math.PI;for(let P=0;P<48;P++)y.push(l((P+.5)*c/48,w))}y.sort((g,w)=>g-w);let m=y[Math.floor(y.length*.71)]+.19,M=32,h=20;for(let g=0;g<h;g++)for(let w=0;w<M;w++){let P=(w+f())*c/M,C=(.23+.54*(g+f())/h)*c,B=vt*Math.sin(C/c*Math.PI)/c,W=Math.PI/c,R=(o?.195:.075)+(o?.25:.055)*f(),Q=f(),q=o?.005+R*(.019+.023*Q):R*(.17+.065*Q),E=(o?R*.12:q*1.25)*(f()-.5),N=f()<.5?-1:1,O=f(),Z=f()*vt,Y=l(P,C),X=d(P,C),te=X[0]*.54+X[1]*.45+X[2]*.71,ie,F;for(let L=0;L<8;L++){let j=Z+L*vt/8,I=Math.cos(j),$=Math.sin(j),V=l(P+I*R/B,C+$*R/W),K=Y-V;if(K<(o?.085:.25))continue;let ae=l(P+I*R*.52/B,C+$*R*.52/W),A=l(P+(I*R*.4-$*q)/B,C+($*R*.4+I*q)/W),H=l(P+(I*R*.4+$*q)/B,C+($*R*.4-I*q)/W),T=Math.min(A,H)-V,G=.65*Ve(K,0,1.3)+.58*Ve(T,-.35,.85)+.24*Ve(ae-V,-.45,.65)+.46*te+.16*f()+(o?.6*R:0),J={x:P,y:C,xScale:B,yScale:W,dx:I,dy:$,length:R,width:q,bend:E,branch:N,cirque:O,head:Y,outlet:V,score:G};(!ie||G>ie.score)&&(ie=J),V>=m&&(!F||G>F.score)&&(F=J)}ie&&p.push(ie),F&&x.push(F)}let v=[],b=p.map(({outlet:g})=>g).sort((g,w)=>g-w),z=b[Math.floor(b.length*.76)],D=b[Math.floor(b.length*.44)];p.sort((g,w)=>w.score-g.score);let _=g=>v.every(({x:w,y:P})=>Math.hypot(Math.min(Math.abs(w-g.x),c-Math.abs(w-g.x))*g.xScale,(P-g.y)*g.yScale)>=(o?.2:.31)),S=x.sort((g,w)=>w.score-g.score)[0];S&&v.push(S);let k=p.find(g=>g.outlet<=z&&g.outlet>=D&&_(g));k&&v.push(k);for(let g of p)if(_(g)&&(v.push(g),v.length===(o?11+(t>>>5)%5:4)))break;return v.map(g=>{let{x:w,y:P,xScale:C,yScale:B,dx:W,dy:R,length:Q,width:q,bend:E,branch:N,cirque:O,head:Z,outlet:Y}=g,X=ae=>{let A=r?mr(ae,E,O):0;return d(w+(ae*W*Q-R*A)/C,P+(ae*R*Q+W*A)/B)},te={overlook:X(.93),head:X(.12)};if(r)return Ao(i,e,r,g,s,f),te;let ie=Ve(Z-Y,.26,1.14),F=W*Q/C,L=R*Q/B,j=Math.floor(w+Math.min(0,F)-3.2*q/C),I=Math.ceil(w+Math.max(0,F)+3.2*q/C),$=Math.max(1,Math.floor(P+Math.min(0,L)-3.2*q/B)),V=Math.min(c-1,Math.ceil(P+Math.max(0,L)+3.2*q/B)),K=ae=>Y-.09*ie+.63*ie*(1-ae)**2;for(let ae=$;ae<=V;ae++){for(let A=j;A<=I;A++){let H=(A-w)*C,T=(ae-P)*B,G=(H*W+T*R)/Q,J=E*Math.sin(Math.PI*G),ee=(-H*R+T*W-J)/q,oe=Ve(G,0,1),le=.68+(.28+.37*O)*(1-We(.04,.36,oe))+(.22+.24*(1-O))*We(.56,.97,oe),re=We(-.17,.07,G)*(1-We(.83,1.19,G))*(1-We(.25,1,Math.abs(ee)/le)),se=ae*e+n(A),fe=i[se],pe=re*Ve(fe-K(oe),0,.95),de=O>.28?2:1;for(let Me=0;Me<de;Me++){let Be=Me===0?N:-N,ye=.25+.14*O+Me*.31,Se=ee*Be,Te=G-ye+.16*Se-.021*Se*Se,Ie=1-We(.047,.16+.07*O,Math.abs(Te)),qe=2+.55*O-.3*Me,Qe=Ie*We(.21,.72,Se)*(1-We(qe*.59,qe,Se)),Le=K(ye)+ie*(.18+.09*Ve(Se,0,2.6));pe=Math.max(pe,Qe*Ve(fe-Le,0,.62))}let xe=.89-.11*ee*ee,we=(1-We(.015,.067,Math.abs(G-xe)))*(1-We(.56,.97,Math.abs(ee)))*We(-.7,.28,ee*N)*ie*O*.075;i[se]=fe+s*(we-pe)}i[ae*e+c]=i[ae*e]}return te})}var Je=2*Math.PI,xr=(i,e,t)=>Math.min(t,Math.max(e,i)),ze=(i,e,t)=>i+(e-i)*t;function Ze(i,e,t){let a=xr((t-i)/(e-i),0,1);return a*a*(3-2*a)}function ri(i,e,t=!1){let a=Math.imul(i^i>>>16,2246822507)^3355159585,r=()=>(a=Math.imul(a,1664525)+1013904223>>>0,a/4294967296),o=r(),s=o<.44?1:o<.81?2:3+Math.floor(r()*2),c=r()*Je,n=[Math.cos(c),Math.sin(c)],l=r();return Array.from({length:t?1:s},(d,u)=>{let f=u===0,p=f?0:.51+.94*r(),x=(r()-.5)*p*(s===2?.84:1.6),y=n[0]*p-n[1]*x,m=n[1]*p+n[0]*x,M=f?.87+.24*r():(s===2?.38:.24)+.39*r(),h=f?l:.12+.7*r(),v=r()*Je,b=.7+.3*r(),z=Math.cos(v),D=Math.sin(v),_=Array.from({length:12},(P,C)=>{let B=C*Je/12,W=M*Math.cos(B),R=M*b*Math.sin(B);return e(y+W*z-R*D,m+W*D+R*z)}),S=_.reduce((P,C)=>P+C,0)/_.length,k=_.indexOf(Math.min(..._)),g=_.indexOf(Math.max(..._)),w=(.41+.38*r())*M**.74*ze(1,.69,h);return{x:y,y:m,size:M,stretch:b,cos:z,sin:D,datum:S,depth:w,wear:h,low:k*Je/12,high:g*Je/12,breach:ze(.19,.66,h)+.12*r(),rim:.33+.25*r(),harmonics:3+Math.floor(r()*5),warp:.042+.075*r(),offset:r()*Je,bench:.6+.13*r(),rebound:M<.48?0:Math.floor(r()*4),reboundAngle:r()*Je,reboundHeight:.34+.41*r()}})}function oi(i,e,t,a){let r=i-a.x,o=e-a.y,s=1.53*a.size*(1.021+a.warp);if(r*r+o*o>=s*s)return t;let c=(r*a.cos+o*a.sin)/a.size,n=(o*a.cos-r*a.sin)/(a.size*a.stretch),l=Math.atan2(n,c),d=Math.cos(a.harmonics*l+a.offset+.7*Math.sin(3*l)),u=Math.cos((a.harmonics+5)*l-a.offset),f=Math.hypot(c,n)/(1+a.warp*d+.021*u);if(f>=1.53)return t;let p=Ze(.76-.2*a.wear,.99,Math.cos(l-a.low)),x=a.breach*p,m=a.datum-a.depth*(1-(a.flatFloor?.065:.19)*f*f)+a.depth*(a.flatFloor?.045:.14)*(c*Math.cos(a.high)+n*Math.sin(a.high)),M=Ze(a.bench-.1,a.bench,f)*(1-Ze(a.bench+.08,a.bench+.18,f)),h=Ze(.66-.09*a.wear,.96,f),v=Ze(.84-.06*a.wear,1,f)*(1-Ze(1.02,1.24+.1*a.wear,f)),b=a.depth*a.rim*v*(1+.28*d+.11*u)*(1-x),z=c*Math.cos(a.reboundAngle)+n*Math.sin(a.reboundAngle),D=n*Math.cos(a.reboundAngle)-c*Math.sin(a.reboundAngle),_=0;a.rebound===1?_=1-Ze(.035,.33,Math.hypot(z+.1,D*1.35)):a.rebound===2?_=Math.max(1-Ze(.02,.24,Math.hypot(z+.17,D-.08)),.76*(1-Ze(.025,.2,Math.hypot(z-.19,D+.07)))):a.rebound===3&&(_=(1-Ze(.025,.14,Math.abs(Math.hypot(z,D*.92)-.29)))*Ze(-.66,.44,d+.5*u));let S=Ze(1,1.16,f)*(1-Ze(1.16,1.53,f)),k=a.depth*.11*S*(.57+.26*d+.15*u),g=m+a.depth*((1.06-.62*x)*h+.26*M+a.reboundHeight*_),w=(1-Ze(.89,1.2,f))*(a.flatFloor?.98:ze(.94,.72,a.wear));return ze(t,g,w)+b+k}function si(i,e=!1){let t=(s,c)=>Ke(s,c,613,i)/4294967296,a=t(-1,0),r=e?1+Math.floor(4*a):a<.012?2:a<.08?1:0,o=t(0,0)*Je;return Array.from({length:r},(s,c)=>{let n=ze(-.54,.54,t(c,1)),l=o+c*Je/r+ze(-.39,.39,t(c,2)),d=Math.sqrt(1-n*n),u=c===0?ze(.32,.43,t(c,3)):ze(.17,.3,t(c,3));return{center:[d*Math.cos(l),n,d*Math.sin(l)],longitude:l,size:u}})}function ni(i,e,t,a,r=1,o=!1,s=a>0||o?si(t,o):[],c=0){if(a<=0&&!s.length)return 0;let n={side:e,values:i},l=e-1,d=Math.PI/l,u=Je/l,f=(W,R)=>Ke(W,R,187,t)/4294967296,p=f(0,0),x=o?Math.max(.72,r):r,y=o?ze(115,190,f(0,1)):p<.48?ze(0,5,f(0,1)):p<.79?ze(12,31,f(0,1)):ze(62,134,f(0,1)),m=Math.min(640,Math.round(a*x**2*y)),M=Math.min(1,c),h=Math.max(0,c-1),v=M**4,b=Math.max(1,x),z=Math.round((v*ze(190,255,p)+h*b*ze(355,490,p))*ze(.72,1,a)),D=Math.round((M*ze(295,440,p)+710*v+860*h*b)*ze(.65,1,a)),_=Float64Array.from({length:e},(W,R)=>Math.sin(R*d)),S=Float64Array.from({length:e},(W,R)=>Math.cos(R*d)),k=Float64Array.from({length:l},(W,R)=>Math.sin(R*u)),g=Float64Array.from({length:l},(W,R)=>Math.cos(R*u)),w=new Float64Array(l),P=new Float64Array(l),C=new Int32Array(l),B=0;for(let W=-s.length;W<m+z+D;W++){let R=W<0?s[W+s.length]:void 0,Q=W>=m&&W<m+z,q=W>=m+z,E=f(W,2),N=R?.size??(q?(.008+.067*E**ze(ze(3,2.3,v),1.7,h))/Math.sqrt(x):Q?(.036+.092*E**ze(2.7,1.7,h))/Math.sqrt(x):(.014+.103*E**2.3)/x);if(N<2.1*d||!R&&N>.28)continue;let O=h>0&&(Q||q)?.998:Math.min(.94,Math.cos(2*N+.04)),Z=Math.acos(R?.center[1]??ze(-O,O,f(W,3))),Y=R?(R.longitude+Je)%Je:Je*f(W,4),X=Math.sin(Z),te=Math.cos(Z);if(N<1.4*u*X)continue;let ie=Math.sin(Y),F=Math.cos(Y),L=[X*F,te,X*ie],j=[-ie,0,F],I=[-te*F,X,-te*ie],$=(re,se)=>{let fe=Math.hypot(1,re*N,se*N);return kt(n,L.map((pe,de)=>(pe+N*(re*j[de]+se*I[de]))/fe))},[V]=ri(Ke(W,5,187,t),$,!0),K=f(W,6),ae=R?ze(.38,.62,K):q||Q?ze(.12,.85,K):ze(.86,.13,(W+K)/Math.max(1,m)),A=R?ze(.79,1.15,N/.43):V.depth*ze(1.02,.63,ae)*(q?ze(.12+.065*v,.51+.15*v,E**1.8)+.22*h:Q?ze(.42,.92,E)+.22*h:ze(.31,.95,(N*x-.014)/.103)),H=R?{...V,wear:ae,depth:A,size:1,stretch:ze(.9,.99,f(W,7)),warp:.42*V.warp,breach:.18,rim:.38,rebound:f(W,8)<.32?3:0,reboundHeight:.28,flatFloor:!0}:{...V,wear:ae,depth:A,stretch:ze(.81,1,f(W,7)),rim:Q?Math.max(.49,V.rim):V.rim,rebound:q&&E<.84?0:V.rebound},T=Math.asin(1.53*H.size*(1.021+H.warp)*N),G=T>=Math.min(Z,Math.PI-Z),J=Math.max(G?0:1,Math.ceil((Z-T)/d)),ee=Math.min(G?l:l-1,Math.floor((Z+T)/d)),oe=G?Math.floor(l/2):Math.ceil(Math.asin(xr(Math.sin(T)/X,0,1))/u)+1,le=Math.round(Y/u),ce=Math.min(l,2*oe+1);for(let re=0;re<ce;re++){let se=(le-oe+re+l)%l;C[re]=se,w[re]=(k[se]*F-g[se]*ie)/N,P[re]=(g[se]*F+k[se]*ie)/N}for(let re=J;re<=ee;re++){let se=re===0||re===l?0:_[re],fe=X*S[re]/N,pe=re*e;for(let de=0;de<ce;de++){if(G&&te*S[re]+X*se*P[de]*N<=0)continue;let xe=se*w[de],we=fe-te*se*P[de],Me=pe+C[de];i[Me]=oi(xe,we,i[Me],H)}i[pe+l]=i[pe]}B++}return B}var ia=2*Math.PI,li=(i,e,t)=>Math.min(t,Math.max(e,i)),yt=(i,e,t)=>i+(e-i)*t;function _e(i,e,t){let a=li((t-i)/(e-i),0,1);return a*a*(3-2*a)}function gr(i){return()=>(i=Math.imul(i,1664525)+1013904223>>>0,i/4294967296)}function vr(i,e,t){let a=ia*e/i,r=Math.PI*t/i,o=Math.sin(r);return[o*Math.cos(a),Math.cos(r),o*Math.sin(a)]}function Ro(i){let e=[],t=3+Math.floor(3*i());for(let a=0;a<t;a++){let r=i()*Math.PI,o=Math.cos(r),s=Math.sin(r),c=1.6*(i()-.5),n=-1.15+.38*i(),l=.2+.17*i();for(let d=n;d<1.12;d+=l*(.7+.66*i())){let u=c+.27*(i()-.5);e.push({x:d*o-u*s,y:d*s+u*o,width:.19+.23*i(),depth:.14+.32*i(),elongation:.58+.4*i()})}}return e}function To(i,e,t,a,r){let o=.1*Math.sin(5*e+2*i),s=1-_e(.77,1.36,Math.hypot(i*.88,e));if(s<=0)return t;let c=0,n=0,l=1.4,d=1.4;for(let h of r){let v=i+o-h.x,b=e-h.y;if(Math.abs(v)*h.elongation>1.4*h.width||Math.abs(b)>1.4*h.width)continue;let z=Math.hypot(v*h.elongation,b)/h.width;z<l?(d=l,l=z):d=Math.min(d,z);let D=1-_e(.12,.95,z);c=Math.max(c,D*h.depth),n=Math.max(n,.045*_e(.19,.51,z)*(1-_e(.54,.84,z)))}let u=1-_e(.04,.24,Math.abs(e-.25*Math.sin(3.4*i)+.07*i)),f=_e(.04,.19,c),p=Math.max(c,.17*u)+.05*u*f,x=yt(t,a+.13,.7),y=.14*(1-_e(.02,.12,c))*_e(.08,.28,u+n),M=.26*((1-_e(.07,.48,d-l))*_e(.4,.79,l)*(1-_e(1.06,1.37,d)))*(.72+.28*Math.sin(7*i-9*e));return yt(t,x-p+n+y+M,s)}function yr(i,e){return e.bend*Math.sin(e.curve*i+e.phase)+e.shift*(_e(e.first-.25,e.first,i)-_e(e.last,e.last+.36,i))}function qo(i,e,t){let a={phase:e,bend:.08+.16*i(),curve:.72+1.86*i(),shift:.44*(i()-.5),first:-1.1+.86*i(),last:.12+.89*i(),width:.17+.17*i(),depth:.43+.21*t,vents:[],splays:[]},r=1+Math.floor(4*i());for(let s=0;s<r;s++){let c=-1.39+2.76*(s+.19+.63*i())/r;a.vents.push({at:c,across:yr(c,a)+.64*(i()-.5),width:.12+.26*i(),height:.28+.44*i(),crater:.09+.17*i()})}let o=Math.floor(3*i());for(let s=0;s<o;s++)a.splays.push({start:-1.32+1.65*i(),length:.76+.83*i(),reach:(i()<.5?-1:1)*(.38+.5*i())});return a}function Fo(i,e,t,a,r,o){let s=1-_e(1.35,2.25,Math.abs(i));if(s<=0)return t;let{phase:c,depth:n}=r,l=r.width+.14*_e(-.68,.79,Math.cos(i*3.6+c)),d=e-yr(i,r),u=d<0?-1:1,f=_e(-.7,.7,u*Math.sin(1.9*i+c)),p=Math.abs(d)/(l*yt(1.28,.82,f)),x=a-n-o*.35*i+.1*_e(.3,.95,Math.sin(i*4.5+c)),y=_e(.46,yt(1.2,.87,f),p),m=_e(.66,.83,p)*(1-_e(.86,1.13,p)),M=1-_e(.75,1.28,p),h=_e(.48,.84,p)*(1-_e(.96,1.18,p)),v=yt(x+n*y,t,.12+.2*y);v+=.11*f*m+.065*h*(1-f);let b=yt(t,v,s*M),z=_e(.76,1.08,p)*(1-_e(1.19,1.86,p));b+=s*z*yt(.038,.21,f);let D=0;for(let{start:_,length:S,reach:k}of r.splays){let g=(i-_)/S;if(g<=0||g>=1)continue;let w=Math.abs(d-k*(.18+.82*g)),P=_e(0,.22,g)*(1-_e(.69,1,g))*(1-_e(.065,.23,w));D=Math.max(D,.23*P)}b-=D;for(let _ of r.vents){let S=Math.hypot(i-_.at,e-_.across)/_.width;if(S>=1.24)continue;let k=1-_e(.09,1.24,S),g=1-_e(.1,.39,S);b+=_.height*k**1.4-_.crater*g}return b}var aa=(i,e)=>i[0]*e[0]+i[1]*e[1]+i[2]*e[2];function br(i,e,t,a,r,o){let s={impact:[],karst:[],rift:[]},c=_e(.24,.85,a);if(e<257||c<=0)return s;let n=e-1,l=g=>(g%n+n)%n,d=Math.PI/n,u=(g,w)=>i[li(Math.round(w),0,n)*e+l(Math.round(g))],f=r.flatMap(({overlook:g,head:w})=>[g,w]),p=gr(t^2476863307),x=[];for(let g=0;g<13;g++)for(let w=0;w<28;w++){let P=(w+p())*n/28,C=(.22+.56*(g+p())/13)*n,B=vr(n,P,C),W=.54*B[0]+.45*B[1]+.71*B[2];if(f.some(F=>aa(F,B)>.95))continue;let R=ia*Math.sin(C*d)/n,Q=.067+.035*p(),q=p()*ia,E=Array.from({length:8},(F,L)=>{let j=q+L*ia/8;return u(P+Q*Math.cos(j)/R,C+Q*Math.sin(j)/d)}),N=E.reduce((F,L)=>F+L,0)/E.length,O=Math.max(...E)-Math.min(...E),Z=u(P,C),[,Y,X,te]=je({regions:o},B),ie=.54*Y+.48*X;x.push({x:P,y:C,dir:B,xStep:R,radius:Q,phase:q,datum:N,relief:O,height:Z,light:W,bedrock:ie,volcanic:te,samples:E,chance:p()})}if(!x.length)return s;let y=x.map(({datum:g})=>g).sort((g,w)=>g-w),m=y[Math.floor(y.length*.7)],M=({datum:g,height:w,light:P,relief:C,chance:B})=>1.3*P-Math.abs(g-m-.26)-.44*C-.32*Math.abs(w-g)+.2*B,h=({datum:g,height:w,light:P,relief:C,bedrock:B,chance:W})=>P-Math.abs(g-m-.36)-.65*C+.4*(w-g)+B+.3*W,v=x.sort((g,w)=>M(w)-M(g))[0],b=x.filter(({dir:g})=>aa(g,v.dir)<.94).sort((g,w)=>h(w)-h(g))[0],z=g=>({datum:w,relief:P,light:C,volcanic:B,chance:W})=>C-1.26*Math.abs(w-g)-.38*P+.64*B+.17*W,D=x.filter(({dir:g})=>aa(g,v.dir)<.91&&(!b||aa(g,b.dir)<.92)),_=(g,w)=>{let P=z(w);return g.sort((C,B)=>P(B)-P(C))[0]},S=_(D,y[Math.floor(y.length*.56)]+.3),k=S&&_(D.filter(({dir:g,datum:w})=>aa(g,S.dir)<.91&&w>S.datum+.29),m+.6);for(let[g,w]of[["impact",v],["karst",b],["rift",S],["rift",k]]){if(!w)continue;let{x:P,y:C,xStep:B,radius:W,phase:R,datum:Q,chance:q}=w,E=g==="rift",N=E?w.samples.indexOf(Math.min(...w.samples)):0,O=R+N*ia/8,Z=Math.cos(O),Y=Math.sin(O),X=g==="impact",te=X?ri(t,(T,G)=>u(P+(T*Z-G*Y)*W/B,C+(T*Y+G*Z)*W/d)).sort((T,G)=>G.wear-T.wear):[],ie=Math.max(0,...te.map(({x:T,y:G,size:J,warp:ee})=>Math.hypot(T,G)+1.53*J*(1.021+ee))),F=W*(E?2.65:X?ie:1.56),L=g==="karst"?Ro(p):[],j=Math.imul(t^t>>>16,2246822507)^Math.imul(Math.floor(P),2654435761),I=E?qo(gr(j),R,q):null,$=E?li(Q-w.samples[N],.03,.28):0;for(let T=Math.max(1,Math.ceil(C-F/d));T<=Math.min(n-1,C+F/d);T++){for(let G=Math.ceil(P-F/B);G<=P+F/B;G++){let J=(G-P)*B/W,ee=(T-C)*d/W,oe=J*Z+ee*Y,le=ee*Z-J*Y,ce=T*e+l(G),re=i[ce],se=re;if(X)for(let fe of te)se=oi(oe,le,se,fe);else E?se=Fo(oe,le,re,Q,I,$):se=To(oe,le,re,Q,L);i[ce]=yt(re,se,c)}i[T*e+n]=i[T*e]}let V=E?1.68:X?-Math.max(1.05,ie*.46):-.97,K=E?.65:0,ae=0,A=0;if(X){let T=te.reduce((G,J)=>G+J.size,0);for(let G of te)ae+=G.x*G.size/T,A+=G.y*G.size/T}let H=(T,G)=>vr(n,P+(T*Z-G*Y)*W/B,C+(T*Y+G*Z)*W/d);s[g].push({overlook:H(ae+V,A+K),target:H(ae,A)})}return s}var ra=2*Math.PI,oa=(i,e,t)=>Math.min(t,Math.max(e,i)),It=(i,e,t)=>i+(e-i)*t;function mt(i,e,t){let a=oa((t-i)/(e-i),0,1);return a*a*(3-2*a)}function wr(i,e,t){let a=Math.PI*e/t,r=ra*i/t;return[Math.sin(a)*Math.cos(r),Math.cos(a),Math.sin(a)*Math.sin(r)]}function ci(i,e){let t=i-Math.floor(i),a=Math.min(t/e,(1-t)/(1-e));return a*a*(1.32-.32*a)}function Mr(i,e,t,a,r,o,s){let c=mt(.32,.76,a);if(e<513||c<=0)return;let n=e-1,l=Math.PI/n,d=A=>(A%n+n)%n,u=(A,H)=>i[oa(Math.round(H),0,n)*e+d(Math.round(A))],f=Math.imul(t^t>>>16,2221713035)^458671337,p=()=>(f=Math.imul(f,1664525)+1013904223>>>0,f/4294967296),x=[...r.map(({head:A})=>A),...Object.values(o).flat().map(({target:A})=>A)],y=[];for(let A=0;A<20;A++){let H=Math.acos(1-(A+.5)/10)/l;for(let T=0;T<36;T++)y.push(u((T+.5)*n/36,H))}y.sort((A,H)=>A-H);let m=y[Math.floor(y.length*.75)],M;for(let A=0;A<18;A++)for(let H=0;H<36;H++){let T=(H+p())*n/36,G=(.23+.54*(A+p())/18)*n,J=wr(T,G,n),ee=.54*J[0]+.45*J[1]+.71*J[2];if(ee<.22||x.some(we=>we[0]*J[0]+we[1]*J[1]+we[2]*J[2]>.934))continue;let oe=ra*Math.sin(G*l)/n,le=.066+.027*p(),ce=Array.from({length:8},(we,Me)=>{let Be=Me*ra/8;return u(T+le*Math.cos(Be)/oe,G+le*Math.sin(Be)/l)}),re=u(T,G);if(re<m-.12)continue;let se=ce.reduce((we,Me)=>we+Me,0)/ce.length,fe=Math.max(...ce)-Math.min(...ce),[,pe,,de]=je({regions:s},J),xe=.8*ee-.52*Math.abs(re-m-.17)+.55*oa(se-re,-.6,.65)-.26*oa(fe-.33,0,1.6)+.3*pe+.39*de+.18*p();(!M||xe>M.score)&&(M={x:T,y:G,xStep:oe,radius:le,center:re,mean:se,volcanic:de,score:xe})}if(!M)return;let{x:h,y:v,xStep:b,radius:z,center:D,mean:_,volcanic:S}=M,k=p()*ra,g=Math.cos(k),w=Math.sin(k),P=p()*ra,C=(Math.imul(t^t>>>17,2146121005)>>>0)%3,B=3.05+1.24*p(),W=oa(.7*S+.55*p()-.1,0,1),R=It(D,_,.19),Q=.19+.16*p(),q=Q*(.68+.58*p()),E=0,N=0,O=1/0;for(let A=0;A<18;A++){let H=.14+.56*p(),T=.86*(p()-.5),G=u(h+(g*H-w*T)*z/b,v+(w*H+g*T)*z/l);G<O&&(E=H,N=T,O=G)}O=Math.max(R-.19,O-.055);let Z=Array.from({length:20+Math.floor(12*p())},()=>({x:1.94*(p()-.5),y:1.9*(p()-.5),length:.15+.2*p(),width:.17+.23*p(),height:.09+.15*p(),curve:.22+.6*p()})),Y=1.37*z/b,X=1.37*z/l,te=[h/n,v/n,Y/n,X/n],ie=new Uint32Array(96**2),F={height:0,sand:0,salt:0};function L(A,H,T){let G=(A-h)*b/z,J=(H-v)*l/z,ee=g*G+w*J,oe=g*J-w*G,le=1-mt(.71,1.21,Math.hypot(ee*.95,oe)),ce=R+.12*oe+.075*ee*ee,re=mt(.19,.59,T-ce),se=mt(-.63,.62,.65*Math.sin(5.7*oe+P+1.5*ee)+.36*Math.cos(7.2*ee-4.5*oe)),fe=le*(1-re)*It(.53,1,se),pe=Math.hypot((ee-E)/q,(oe-N)/Q)+.1*Math.sin(17*oe+5*ee+P),de=le*(1-mt(.63,1.23,pe))*(1-mt(O+.15,O+.33,T)),xe;if(C===1){xe=0;for(let Me of Z){let Be=(oe-Me.y)/Me.width;if(Math.abs(Be)>=1)continue;let ye=Be*Be,Se=(ee-Me.x)/Me.length-Me.curve*ye,Te=(1-mt(.06,1,Math.abs(Be)))*mt(-1,.48,Se)*(1-mt(.48,.83,Se));xe=Math.max(xe,Me.height*Te)}}else{let Me=ee+.095*Math.sin(4.6*oe+P)+.054*Math.cos(10*oe-3.4*ee),Be=ci(B*Me+.18*Math.sin(oe*7+P),.76);if(C===2){let ye=ci(B*(oe*.67-.77*ee+.08*Math.sin(ee*8+P)),.68),Se=ci(B*(oe*.72+.63*ee+.13*Math.sin(oe*6-P)),.72);xe=.13*Be+.115*ye*Se+.082*Be*Math.max(ye,Se)}else xe=.22*Be}let we=It(T,ce+xe*It(.49,1.18,se),fe*.92);F.height=It(T,It(we,O,de*.95),c),F.sand=fe*(1-de)*c,F.salt=de*c}let j=95;for(let A=0;A<=j;A++)for(let H=0;H<=j;H++){let T=h+(2*H/j-1)*Y,G=v+(2*A/j-1)*X;L(T,G,u(T,G)),ie[A*96+H]=1056964608|Math.round(255*F.sand)|Math.round(255*F.salt)<<8|Math.round(255*W)<<16}for(let A=Math.ceil(v-X);A<=Math.floor(v+X);A++){for(let H=Math.ceil(h-Y);H<=Math.floor(h+Y);H++){let T=A*e+d(H);L(H,A,i[T]),i[T]=F.height}i[A*e+n]=i[A*e]}let I=(A,H)=>wr(h+(A*g-H*w)*z/b,v+(A*w+H*g)*z/l,n);o.dunes=[{overlook:I(.94,.69),target:I(-.07,0)}];let $=I(-.01,0),K=I(.01,0).map((A,H)=>A-$[H]),ae=Math.hypot(...K);return{chart:te,values:ie,side:96,wind:K.map(A=>A/ae)}}var Io=2*Math.PI;function No(i,e){return[Math.sin(i)*Math.cos(e),Math.cos(i),Math.sin(i)*Math.sin(e)]}var Pa=(i,e)=>i[0]*e[0]+i[1]*e[1]+i[2]*e[2];function Pt(i,e,t,a){let{bend:r,twist:o,thickness:s,peak:c,portals:n}=a,l=t-r*i*i+o*i*e,d=c-.17*i-.13*Math.cos(4.1*i+o),u=Math.hypot(i*.87+.08*e,(e-.15)/d,l/s)-1,f=Math.hypot((Math.abs(i)-.83-.11*e)/.34,(e+.28)/.68,(l+.06*i)/(s*1.48))-1,p=Math.max(0,.2-Math.abs(u-f)),x=Math.min(u,f)-1.25*p*p,y=.034*Math.sin(19*e+2.3*i+2.1*l)+.025*Math.sin(12*i+7.3*l+5*e)*Math.cos(10*e-3*l),m=1/0;for(let{at:M,width:h,height:v,lean:b}of n){let z=(i-M-b*e-.05*t)/h,D=Math.max(0,e+.08+.05*t)/v;m=Math.min(m,Math.hypot(z,D)-1)}return Math.max(x+y,-m+.37*y)}function Wo(i){let e={x:55,y:45,z:29},t=[-1.39,-1.05,-.88],a=[1.39,1.6,.88],r=a.map((n,l)=>(n-t[l])/([e.x,e.y,e.z][l]-1)),o=new Float32Array(e.x*e.y*e.z);for(let n=0;n<e.z;n++)for(let l=0;l<e.y;l++)for(let d=0;d<e.x;d++)o[(n*e.y+l)*e.x+d]=Pt(t[0]+d*r[0],t[1]+l*r[1],t[2]+n*r[2],i);let s=Ua(o,e,0,"mc33"),c=new Float32Array(s.length*2);for(let n=0;n<s.length;n+=3){let l=t[0]+s[n]*(a[0]-t[0]),d=t[1]+s[n+1]*(a[1]-t[1]),u=t[2]+s[n+2]*(a[2]-t[2]),f=.004;c.set([l,d,u,Pt(l+f,d,u,i)-Pt(l-f,d,u,i),Pt(l,d+f,u,i)-Pt(l,d-f,u,i),Pt(l,d,u+f,i)-Pt(l,d,u-f,i)],n*2)}return c}function zr(i,e,t,a,r,o){if(e<513||a<.38)return;let s=e-1,c=Object.values(r).flat().map(({target:m})=>m),n=(m,M)=>i[Math.round(M)*e+(Math.round(m)%s+s)%s],l=[];for(let m=12;m<s;m+=19)for(let M=1;M<s;M+=19)l.push(n(M,m));l.sort((m,M)=>m-M);let d=l[Math.floor(.77*l.length)],u=Math.imul(t^t>>>17,2654435761)^1126074651,f=()=>(u=Math.imul(u,1664525)+1013904223>>>0,u/4294967296),p=[];for(let m=0;m<19;m++)for(let M=0;M<33;M++){let h=(M+f())*s/33,v=(.22+.56*(m+f())/19)*s,b=n(h,v);if(b<d-.18)continue;let z=Math.PI*v/s,D=Io*h/s,_=No(z,D),S=Pa(_,[.54,.45,.71]);if(S<.25||c.some(R=>Pa(R,_)>.998))continue;let[,k,g,w]=je({regions:o},_),P=n(h+2,v)-n(h-2,v),C=n(h,v+4)-n(h,v-4),B=Math.hypot(P,C),W=.8*S+.56*k+.32*g+.24*w-.51*Math.abs(b-d-.21)-.38*Math.abs(B-.31)+.22*f();p.push({dir:_,theta:z,phi:D,dx:P,dy:C,canyon:k,volcanic:w,score:W})}let x=[];for(let m of p.sort((M,h)=>h.score-M.score))if(!x.some(M=>Pa(M.dir,m.dir)>.94)&&(x.push(m),x.length===2))break;if(!x.length)return;let y=x.map(({dir:m,theta:M,phi:h,dx:v,dy:b,canyon:z,volcanic:D})=>{let _=[-Math.sin(h),0,Math.cos(h)],S=[Math.cos(M)*Math.cos(h),-Math.sin(M),Math.cos(M)*Math.sin(h)],k=Math.atan2(b,v)+Math.PI/2+(f()-.5)*1.55,g=_.map((q,E)=>q*Math.cos(k)+S[E]*Math.sin(k)),w=_.map((q,E)=>-q*Math.sin(k)+S[E]*Math.cos(k)),P=240+250*f(),C=.64+.45*f(),B={bend:.25*(f()-.5),twist:.35*(f()-.5),thickness:.23+.13*f(),peak:.79+.2*f(),portals:[]};f()<.39?B.portals.push({at:-.41,width:.24+.1*f(),height:.4+.14*f(),lean:-.11},{at:.34,width:.29+.1*f(),height:.49+.13*f(),lean:.13}):B.portals.push({at:(f()-.5)*.24,width:.52+.17*f(),height:.49+.14*f(),lean:(f()-.5)*.36});let W=Pa(w,[.54,.45,.71])>=0?1:-1,R=m.map((q,E)=>q+(w[E]*W*P*3.6+g[E]*P*.78)/262144),Q=Math.hypot(...R);return{direction:m,span:g,depth:w,size:P,rise:C,tint:Math.min(1,.24+.59*z-.2*D+.27*f()),site:{target:m,overlook:R.map(q=>q/Q)},vertices:Wo(B)}});return r.arches=y.map(({site:m})=>m),y}function Dt(i){let e=s=>Ke(s,0,0,i)/4294967296,t=e(47);if(t>=.55)return[0,0,0,0];if(t>=.3)return[0,0,0,1.18+.42*e(37)];let a=.48*(e(21)-.5),r=.48*(e(23)-.5),o=Math.hypot(a,1,r);return[a/o,1/o,r/o,.65+.48*e(37)]}function sa(i,e,t,a,r){if(r[3]===0)return-1/0;let o=Math.abs(i*r[0]+e*r[1]+t*r[2]),s=Math.sin(9*i+4*e-7*t+14*r[0]);return a-r[3]+1.08*o*o-.115*s}function _r(i,[e,t,a]){if(!i)return 0;let{side:r,values:o}=i,s=Math.atan2(a,e)/(2*Math.PI),c=(s-Math.floor(s))*(r-1),n=Math.atan2(Math.hypot(e,a),t)/Math.PI*(r-1),l=Math.min(r-2,Math.floor(c)),d=Math.min(r-2,Math.floor(n)),u=c-l,f=n-d,p=x=>o[x+l]*(1-u)+o[x+l+1]*u;return p(d*r)*(1-f)+p((d+1)*r)*f}function Sr(i,e,t,a,r,o,s=!0,c=1,n,l=!1,d=0,u=!1){let f=l||r>0?si(a,l):[];if(l){ai(i,e);let S=Math.min(e,257),k=d>=1?{side:S,values:new Float32Array(S**2)}:void 0,g=C=>Math.round(C*(e-1)/(S-1));if(k)for(let C=0;C<S;C++)for(let B=0;B<S;B++)k.values[C*S+B]=i[g(C)*e+g(B)];if(ni(i,e,a,r,c,!0,f,d),k)for(let C=0;C<S;C++)for(let B=0;B<S;B++){let W=C*S+B;k.values[W]=i[g(C)*e+g(B)]-k.values[W]}let w=u?{side:S,values:new Float32Array(S**2)}:void 0,P=w?ii(i,e,a,.87,w):[];return{values:i,glacialSites:P,glacialIce:w,impactMaterial:k,landmarks:{},impactBasins:f,ocean:{seed:a,datum:null}}}let p=s?ii(i,e,a,r):[],x=s?br(i,e,a,r,p,o):{};ni(i,e,a,s?0:r,c,!1,f);let y=s&&n===void 0?null:va(i,e,a,{coverage:n}),m=s?null:Dt(a),M=Math.min(e,257),h=s?null:{side:M,values:new Float32Array(M**2)},v=!s&&o&&r>0?{seed:a,variation:r,regions:o,sites:[]}:null;if(Eo(i,e,t==="volcanic"?.84:1.32,y,m,h,v,!s&&{seed:a,geology:t,regions:o}),hr(i,e,t==="alpine"?.94:.74),y!==null&&tr(i,e,y,n===void 0?void 0:t),ai(i,e),!s)return{values:i,glacialSites:p,landmarks:x,impactBasins:f,alluvium:h,invertedRidges:v?.sites,ocean:{seed:a,datum:y}};let z=er(i,e,a,r,p,x,o),D=Mr(i,e,a,r,p,x,o),_=zr(i,e,a,r,x,o);return{values:i,glacialSites:p,landmarks:x,impactBasins:f,springs:z,dunes:D,rockSpans:_,ocean:n===void 0?void 0:{seed:a,datum:y}}}function Eo(i,e,t=1,a=null,r=null,o=null,s=null,c=null){let n=e-1,l=Math.min(256,Math.floor(n/3.5));if(l<12)return i;let d=l*(l-1),u=n/l,f=new Float32Array(d),p=Float32Array.from({length:l+1},(F,L)=>Math.sin(Math.PI*L/l)),x=(F,L)=>(F+L)%L,y=(F,L)=>i[Math.round(L)*e+x(Math.round(F),n)];for(let F=1;F<l;F++)for(let L=0;L<l;L++){let j=L*u,I=F*u,$=u*.48;f[(F-1)*l+L]=.4*y(j,I)+.15*(y(j-$,I)+y(j+$,I)+y(j,I-$)+y(j,I+$))}let M=f.slice().sort()[Math.floor(d*.2)],h=new Float32Array(d).fill(1/0),v=new Int32Array(d).fill(-1),b=new Uint32Array(d),z=new Uint32Array(d).fill(d),D=new Float32Array(d),_=new Uint32Array(d),S=0;function k(F){let L=S++;for(;L;){let j=L-1>>1;if(h[_[j]]<=h[F])break;_[L]=_[j],L=j}_[L]=F}function g(){let F=_[0],L=_[--S],j=0;for(;j*2+1<S;){let I=j*2+1;if(I+1<S&&h[_[I+1]]<h[_[I]]&&I++,h[L]<=h[_[I]])break;_[j]=_[I],j=I}return _[j]=L,F}for(let F=0;F<d;F++)f[F]<=M&&(h[F]=f[F],k(F));for(let F=0;S;F++){let L=g(),j=L%l,I=Math.floor(L/l)+1,$=p[I],V=Math.max(.08,2*$),K=1/Math.hypot(V,1);b[F]=L,z[L]=F,D[L]=$;let ae=0;for(let A=-1;A<=1;A++){let H=I+A;if(!(H<1||H>=l))for(let T=-1;T<=1;T++){if(!T&&!A)continue;let G=(H-1)*l+x(j+T,l);if(h[G]===1/0)h[G]=Math.max(f[G],h[L]+2e-5),v[G]=L,k(G);else if(z[G]<F){let J=(h[L]-h[G])*(A?T?K:1:1/V);J>ae&&(ae=J,v[L]=G)}}}}let w=o&&new Float32Array(d),P=o&&new Float32Array(d),C=(1e3/l)**2;for(let F=d-1;F>=0;F--){let L=b[F],j=v[L];if(j<0)continue;let I=D[L];D[j]+=I,P&&(P[j]=Math.max(P[j],Math.min(w[j],I)),w[j]=Math.max(w[j],I))}if(P){let F=106.63474115247546/C;for(let L=0;L<d;L++){let j=P[L];if(j<=F){P[L]=0;continue}let I=Math.min(1,(Math.log2(1+j*C)-6.75)/4.6),$=Math.min(1,j/Math.max(1,w[L]*.58));P[L]=I*$}}let B=new Float32Array(e*e),W=a===null&&!o?null:new Float32Array(e*e),R=r&&r[3]!==0&&new Float32Array(d),Q=s&&new Float32Array(d),q=c&&(c.regions||c.geology==="mesa")&&new Float32Array(d),E=q&&new Float32Array(d),N=q&&new Float32Array(d),O=s&&new Float32Array(e*e),Z=[];if(R||Q||q){let F=Float64Array.from({length:l},(V,K)=>Math.cos(2*Math.PI*K/l)),L=Float64Array.from({length:l},(V,K)=>Math.sin(2*Math.PI*K/l)),j=s?Ke(53,0,0,s.seed)*(2*Math.PI/4294967296):0,I=q?Ke(61,0,0,c.seed)*(2*Math.PI/4294967296):0,$=Math.min(1,l/160);for(let V=1;V<l;V++){let K=p[V],ae=Math.cos(Math.PI*V/l);for(let A=0;A<l;A++){let H=(V-1)*l+A,T=f[H],G=K*F[A],J=K*L[A];if(R){let le=sa(G,ae,J,T,r),ce=Math.max(0,Math.min(1,(le-.015)/.48)),re=Math.max(0,Math.min(1,(T-M-.16)/.54));R[H]=ce*ce*(3-2*ce)*re}let ee=Q&&K>.19&&T>(a??M)+.12,oe=q||ee?je(c||s,[G,ae,J],c?.geology):null;if(q){let le=a===null?1:Math.max(0,Math.min(1,(T-a-.02)/.22)),ce=Math.max(0,(oe[1]-.18)/.82)*(1-(R?.[H]??0));q[H]=ce;let re=ce*le*ta(V,l)*u;if(re>0){let se=$*(35*G-52*ae+28*J)+I,fe=$*(-67*G+21*ae+49*J)-I;E[H]=re*(1.36*Math.sin(se)+.38*Math.sin(fe))/Math.max(.5,2*K),N[H]=re*(.76*Math.cos(fe)+.29*Math.cos(se))}}if(ee){let[,le,ce,re]=oe,se=.45*le+.27*ce+.91*re,fe=.69*Math.sin(9*G+3*ae-7*J+j)+.31*Math.cos(15*G-8*ae+9*J-j),pe=Math.max(0,Math.min(1,(fe-.1)/.73)),de=Math.max(0,Math.min(1,(se-.26)/.57));Q[H]=s.variation*de*pe*pe*(1-.85*(R?.[H]??0))}}}}let Y=F=>Math.max(0,Math.min(1,(Math.log2(1+D[F]*C)-6.45)/6.4+.17*(q?.[F]??0))),X=(F,L)=>{let j=Math.min(1,Math.max(0,(f[F]-M+.12)/.36));return t*L*(.095+.24*L)*(.46+.54*j)*(1+.32*(q?.[F]??0))},te=(F,L)=>{let j=v[F];if(j<0||L<=.53)return 0;let I=Math.abs(f[F]-f[j])*l/256,$=(L-.53)/.47,V=Math.max(0,1-I/.065),K=a===null?1:Math.max(0,Math.min(1,(f[F]-a-.04)/.17));return $*V*V*K*(1-(R?.[F]??0))};for(let F=0;F<d;F++){let L=v[F];if(L<0)continue;let j=Y(F);if(j<=0)continue;let I=Y(L),$=Math.floor(F/l)+1,V=F%l*u+(E?.[F]??0),K=$*u+(N?.[F]??0),ae=(x(L%l-F%l+1,l)-1)*u+(E?.[L]??0)-(E?.[F]??0),A=(Math.floor(L/l)-$+1)*u+(N?.[L]??0)-(N?.[F]??0),H=Math.max(.35,2*p[$]),T=ae*H,G=Math.max(1e-6,T*T+A*A),J=(R?.[F]??0)*j*j,ee=(R?.[L]??0)*I*I,oe=q?.[F]??0,le=q?.[L]??0,ce=(P?.[F]??0)*(1-J),re=(P?.[L]??0)*(1-ee),se=(.43+1.44*j)*u*(1+.57*J+.43*ce),fe=(.43+1.44*I)*u*(1+.57*ee+.43*re),pe=Math.max(se,fe),de=X(F,j)*(1+.72*J),xe=X(L,I)*(1+.72*ee),we=f[F]-de,Me=Math.min(we,f[L]-xe),Be=o?te(F,j):0,ye=o?te(L,I):0,Se=Be>0||ye>0,Te=j*j*(Q?.[F]??0),Ie=I*I*(Q?.[L]??0),qe=Math.max(Te,Ie)>.025;Te>.17&&Ie>.17&&Z.push({x:F%l,y:$,score:(Te+Ie)/2});let Qe=a!==null&&j>.57&&f[F]>=a&&f[F]<a+.24&&f[L]<a&&f[L]>a-.2,Le=0,Ue=v[L];if(o&&j>.59&&Ue>=0&&J<.22&&(a===null||f[L]>a+.05)){let ve=f[F]-f[L],Ae=Math.max(0,f[L]-f[Ue]),De=Math.max(0,Math.min(1,(.76*ve-Ae-.016)/.075));Le=t*j*De*Math.min(.2,.73*ve)}let it=Le>.005,xt=0;if(it){let ve=((x(Ue%l-L%l+1,l)-1)*u+(E?.[Ue]??0)-(E?.[L]??0))*H,Ae=(Math.floor(Ue/l)-Math.floor(L/l))*u+(N?.[Ue]??0)-(N?.[L]??0);xt=(T*Ae-A*ve)/Math.sqrt(G*Math.max(1e-6,ve**2+Ae**2))}let dt=pe*(it?2.04:Qe?1.65:qe?1.35:1),rt=it?3.3:Qe?2.65:1,Ot=dt/H,U=Qe||it?Math.sqrt(G):0,ne=Math.max(1,Math.floor(Math.min(K,K+rt*A)-dt)),ue=Math.min(n-1,Math.ceil(Math.max(K,K+rt*A)+dt)),ge=Math.floor(Math.min(V,V+rt*ae)-Ot),be=Math.ceil(Math.max(V,V+rt*ae)+Ot);for(let ve=ne;ve<=ue;ve++){let Ae=ta(ve,n),De=ve-K;for(let Ye=ge;Ye<=be;Ye++){let ct=(Ye-V)*H,ot=(ct*T+De*A)/G,Xe=Math.min(1,Math.max(0,ot)),Re=ve*e+x(Ye,n);if(Qe&&ot>.2&&ot<rt){let Ne=(ot-.2)/(rt-.2),Oe=Math.abs(ct*A-De*T)/U,st=fe*(.52+Ne),zt=i[Re]-a;if(Oe<st&&zt>-.19&&zt<.034){let _t=Oe/st,ca=(1-_t)*Math.min(1,_t*4),Ia=Math.min(.15,.034-zt);W[Re]=Math.max(W[Re],Ia*ca*4*Ne*(1-Ne)*j*Ae)}}if(it&&ot>.42&&ot<rt){let Ne=(ot-.42)/(rt-.42),Oe=(ct*A-De*T)/U,st=fe*(.48+1.27*Ne),zt=f[L]-.068*(ot-1),_t=Math.max(0,i[Re]-zt);if(Math.abs(Oe)<st&&_t<.28){let ca=Oe/st,Ia=1+.46*xt*ca,Na=Math.abs(ca),Qr=(1-Na)**2*Math.min(1,5*Na),eo=Math.min(1,.28+8*Math.abs(Na-.58*Ne)),to=Qr*eo*4*Ne*(1-Ne),ao=Le*to*Ia*(1-_t/.28)*Ae;W[Re]=Math.max(W[Re],ao)}}let Vt=se+Xe*(fe-se),Ce=Math.hypot(ct-Xe*T,De-Xe*A)/Vt;if(qe&&Ce<1.35){let Ne=(Te+Xe*(Ie-Te))*Ae,Oe=Math.max(0,Math.min(1,(.54-Ce)/.3)),st=Math.max(0,1-Math.abs(Ce-.84)/.51);O[Re]=Math.max(O[Re],.35*Ne*Oe*Oe*(3-2*Oe)),B[Re]=Math.max(B[Re],.19*Ne*st*st)}if(Ce>=1)continue;let ke=de+Xe*(xe-de),Fe=ce+Xe*(re-ce),ft=.27*(j+Xe*(I-j))**2+.19*Fe,Mt=1-Math.max(0,(Ce-ft)/(1-ft));if(oe>0||le>0){let Ne=oe+Xe*(le-oe),Oe=Math.max(0,Math.min(1,(Ce-.19)/.59)),st=1-Oe*Oe*(3-2*Oe);Mt+=.77*Ne*(st-Mt)}let Kr=J+Xe*(ee-J),Fa=Ce*Ce,$r=1-Fa*Fa*(3-2*Fa),Jr=Mt+Kr*($r-Mt),Di=we+Xe*(Me-we),la=Math.min(1.65*ke,Math.max(.4*ke,i[Re]-Di))*Ae*Jr;if(Se&&Ce>.28&&Ce<.94){let Ne=Math.min(1,(Ce-.28)/.21,(.94-Ce)/.22),Oe=Ne*Ne*(3-2*Ne)*(Be+Xe*(ye-Be)),zt=(Di+ke*(.24+.18*Ce)-(i[Re]-la))*Oe,_t=Math.max(-.073*t,Math.min(.14*t,-zt));la=Math.max(0,la+_t*Ae)}B[Re]=Math.max(B[Re],la)}}}let ie=o?(o.side-1)/n:0;for(let F=1;F<n;F++){let L=F*e;for(let j=0;j<n;j++){let I=L+j,$=W?.[I]??0,V=O?.[I]??0;if(i[I]+=$+V-B[I]*(1-.89*Math.min(1,V/.115)),o&&$>0){let K=Math.round(F*ie);if(K===0||K===o.side-1)continue;let ae=Math.round(j*ie)%(o.side-1),A=K*o.side+ae,H=$*(1-.5*Math.min(1,B[I]/.24));o.values[A]=Math.max(o.values[A],Math.min(1,H*9))}}i[L+n]=i[L]}if(Z.length){Z.sort((F,L)=>L.score-F.score);for(let{x:F,y:L}of Z){let j=Math.PI*L/l,I=2*Math.PI*F/l,$=Math.sin(j),V=[$*Math.cos(I),Math.cos(j),$*Math.sin(I)];if(!s.sites.some(K=>K[0]*V[0]+K[1]*V[1]+K[2]*V[2]>.998)&&(s.sites.push(V),s.sites.length>=48))break}}if(o)for(let F=1;F<o.side-1;F++){let L=F*o.side;o.values[L+o.side-1]=o.values[L]}return i}var Go='(()=>{function b0(t,c,o){let x=Math.min(1,Math.max(0,(o-t)/(c-t)));return x*x*(3-2*x)}function t0(t,c){return b0(.0175,.0805,Math.min(t,c-t)/c)}function S0(t,c,o){let x=t.length,a=2*o+1,e=0;for(let f=-o;f<=o;f++)e+=t[(f+x)%x];for(let f=0;f<x;f++)c[f]=e/a,e+=t[(f+o+1)%x]-t[(f-o+x)%x]}function _0(t,c){let o=c-1;if(o<64)return;let x=Math.floor(Math.asin(.25)/Math.PI*o),a=new Float32Array(o),e=new Float32Array(o),f=Float64Array.from({length:o},(s,h)=>Math.cos(h*2*Math.PI/o)),M=Float64Array.from({length:o},(s,h)=>Math.sin(h*2*Math.PI/o)),r=Math.max(2,Math.round(o*.005)),n=Math.max(1,Math.round(o*.0035)),l=[1,4,6,4,1],b=new Float32Array((x+n*2+1)*c);for(let s of[0,o]){let h=s===0?1:-1;for(let F=1;F<=x;F++){let m=Math.sin(Math.PI*F/o),U=1-b0(.071,.25,m),E=Math.min(Math.floor(.23*o),Math.max(1,Math.round((1.5+2.3*U)/(2*m)))),i=(s+h*F)*c;a.set(t.subarray(i,i+o));let d=0,_=0;for(let k=0;k<o;k++)d+=a[k]*f[k],_+=a[k]*M[k];S0(a,e,E),S0(e,a,E),S0(a,e,E);let R=2*E+1,z=2*(1-(Math.sin(R*Math.PI/o)/(R*Math.sin(Math.PI/o)))**3)/o;for(let k=0;k<o;k++){let J=z*(d*f[k]+_*M[k]);t[i+k]+=U*(e[k]+J-t[i+k])}t[i+o]=t[i]}for(let F=0;F<=x+n*2;F++){let m=(s+h*F)*c;b.set(t.subarray(m,m+c),F*c)}let A=0;for(let F of[n,2*n]){let m=0;for(let U=0;U<o;U++)m+=b[F*c+U];A+=(F===n?8:2)*m/o}t.fill((6*b[0]+A)/16,s*c,(s+1)*c);let j=Math.floor(o/2),g=o%2;for(let F=1;F<=x;F++){let m=Math.sin(Math.PI*F/o),U=1-b0(.038,.21,m);if(U<=0)break;let E=(s+h*F)*c;for(let i=0;i<o;i++){let d=0;for(let _=0;_<5;_++){let R=F+(_-2)*n,C=Math.abs(R)*c,z=R<0?(i+j)%o:i,k=b[C+z];d+=l[_]*(R<0&&g?(k+b[C+(z+1)%o])*.5:k)}t[E+i]+=U*(d/16-t[E+i])}t[E+o]=t[E]}let B=t[s*c],u=(s+h*r)*c,I=0,W=0,P=0;for(let F=0;F<o;F++){let m=t[u+F]-B;I+=m,W+=m*f[F],P+=m*M[F]}I/=o,W*=2/o,P*=2/o;for(let F=1;F<r;F++){let m=Math.sin(Math.PI*F/o)/Math.sin(Math.PI*r/o),U=1-b0(.45,1,m),E=(s+h*F)*c;for(let i=0;i<o;i++){let d=B+(W*f[i]+P*M[i])*m+I*m*m;t[E+i]+=U*(d-t[E+i])}t[E+o]=t[E]}}}function X0(t,c,o=1){let x=c-1,a=x*(c-2),e=new Int32Array(a).fill(-1),f=new Int32Array(a).fill(-1),M=new Uint8Array(a),r=new Float32Array(a),n=new Float32Array(a),l=new Float32Array(a),b=new Uint32Array(a),s=m=>(m+x)%x,h=Float64Array.from({length:c},(m,U)=>Math.sin(Math.PI*U/x));for(let m=1;m<x;m++){let U=h[m],E=Math.max(.06,2*U),i=1/Math.hypot(1,E);for(let d=0;d<x;d++){let _=(m-1)*x+d,R=t[m*c+d];l[_]=U;let C=-1,z=-1,k=0,J=0;for(let Y=-1;Y<=1;Y++){let V=m+Y;if(!(V<=0||V>=x))for(let G=-1;G<=1;G++){if(!G&&!Y)continue;let v=s(d+G),T=(R-t[V*c+v])*(Y?G?i:1:1/E),D=(V-1)*x+v;T>k?(z=C,J=k,C=D,k=T):T>J&&(z=D,J=T)}}C<0||(e[_]=C,r[_]=k,M[C]++,J>=.42*k&&(f[_]=z,M[z]++,n[_]=J*J/(k*k+J*J)))}}let A=0;for(let m=0;m<a;m++)M[m]||(b[A++]=m);for(let m=0;m<A;m++){let U=b[m],E=e[U],i=f[U];if(E<0)continue;let d=l[U]*n[U];l[E]+=l[U]-d,--M[E]||(b[A++]=E),i>=0&&(l[i]+=d,--M[i]||(b[A++]=i))}let j=new Float32Array(a),g=new Float32Array(a),B=new Float32Array(a),u=.66*Math.PI/(.023*x),I=.023*x/Math.PI,W=(1e3/x)**2,P=m=>Math.min(1,Math.max(0,m)),F=[-1,1];for(let m=0;m<a;m++){let U=Math.max(0,l[m]-h[Math.floor(m/x)+1]),E=Math.max(0,Math.min(1,(Math.log2(1+U*W)-2.65)/5.9)),i=r[m]*I;j[m]=E*(.065+.18*E)*(.7+.3*P(i/.22));let d=e[m];if(d>=0){let D=Math.max(0,r[m]-u)*.11;g[m]-=D,g[d]+=D}if(E<.5||d<0)continue;let _=Math.floor(m/x)+1,R=m%x,C=Math.floor(d/x)+1-_,z=(d%x-R+x+1)%x-1,k=r[d]*I,J=P((i-k-.035)/.32),Y=1-P(k/.28),V=D=>{let a1=Math.max(1,Math.min(x-1,_+D*z));return l[(a1-1)*x+s(R-D*C)]},G=P(1.8*(1-Math.max(V(-1),V(1))/l[m])),v=J*Y*G*E*.06,x1=1-P(i/.13),T=t[_*c+R];for(let D of F){let a1=_+D*z;if(x1>0&&a1>0&&a1<x){let Q=s(R-D*C),p=(a1-1)*x+Q,w=t[a1*c+Q]-T-.018;B[p]=Math.max(B[p],Math.min(.043,Math.max(0,w))*x1*E)}if(v>0)for(let Q=1;Q<=3;Q++){let p=_+Q*C+D*z*Math.min(Q,2);if(p<1||p>=x)continue;let w=s(R+Q*z-D*C*Math.min(Q,2));g[(p-1)*x+w]+=v*(1-Q/4)}}}for(let m=1;m<x;m++){let U=o*t0(m,x);for(let E=0;E<x;E++){let i=(m-1)*x+E,d=0;for(let _=-1;_<=1;_++){let R=Math.max(1,Math.min(x-1,m+_));for(let C=-1;C<=1;C++)d+=j[(R-1)*x+s(E+C)]*(C?1:2)*(_?1:2)}t[m*c+E]+=U*(Math.min(.06,g[i])-B[i]-.52*j[i]-.82*d/16)}t[m*c+x]=t[m*c]}return t}var L1=2*Math.PI,S1=(t,c,o)=>Math.min(o,Math.max(c,t)),g1=(t,c,o)=>{let x=S1((o-t)/(c-t),0,1);return x*x*(3-2*x)};function q0(t,c,o){return c*(.9*Math.sin(L1*t)+.34*Math.sin(1.7*L1*t+o*L1))}function yt(t,c,o,x,a,e){let{x:f,y:M,xScale:r,yScale:n,dx:l,dy:b,length:s,width:h,bend:A,branch:j,cirque:g,head:B,outlet:u}=x,I=c-1,W=o.side-1,P=S1(B-u,.14,.73),F=A/s,m=Y=>u-.04*P+.7*P*(1-S1(Y,0,1))**2,U=[],E=4+Math.floor(4*g);for(let Y=0;Y<E;Y++){let V=.16+.79*(Y+.15+.7*e())/E,G=.1+.24*e(),v=j*(Y%2?-1:1)*(.065+.14*e()),x1=V-G,T=(.31+.3*e())*h/s;if(U.push({start:x1,end:V,offset:v,root:0,bank:T,depth:.43+.24*e()}),e()<.74){let D=.33+.32*e(),a1=x1+G*D,Q=v*(1-D)**1.3;U.push({start:a1-(.055+.105*e()),end:a1,offset:-v*(.24+.28*e()),root:Q,bank:.63*T,depth:.32})}}let i=l*s/r,d=b*s/n,_=.39*s,R=Math.max(1,Math.floor(M+Math.min(-.37*d,1.11*d)-_/n)),C=Math.min(I-1,Math.ceil(M+Math.max(-.37*d,1.11*d)+_/n)),z=Math.floor(f+Math.min(-.37*i,1.11*i)-_/r),k=Math.ceil(f+Math.max(-.37*i,1.11*i)+_/r),J=.58*Math.hypot(b*r,l*n)/s;for(let Y=R;Y<=C;Y++){let V=Math.round(Y*W/I)*o.side;for(let G=z;G<=k;G++){let v=(G-f)*r,x1=(Y-M)*n,T=(v*l+x1*b)/s;if(T<=-.37||T>=1.11)continue;let D=(-v*b+x1*l)/s-q0(T,F,g);if(Math.abs(D)>.3)continue;let a1=(G%I+I)%I,Q=Y*c+a1,p=t[Q],w=g1(-.02,.23,T),q=Math.max(J,h/s*(.32+.68*w)*(1+.22*Math.sin(13*T+g*L1))),y=D*j<0?.69:1.13,N=Math.max(0,1-Math.abs(D)/(q*y)),O=g1(-.03,.14,T)*(1-g1(.94,1.11,T)),$=O*N**1.25*S1(p-m(T)+.24*P,0,.88),Z=O*N;for(let S of U){if(T<=S.start||T>=S.end+.025)continue;let H=S1((T-S.start)/(S.end-S.start),0,1),X=S.root+S.offset*(1-H)**1.3,L=Math.max(J*.75,S.bank*(.22+.78*H)),t1=Math.max(0,1-Math.abs(D-X)/L),c1=g1(0,.46,H)*(1-g1(S.end,S.end+.025,T)),n1=m(S.end)+P*.42*(1-H);$=Math.max($,c1*t1*S1(p-n1+.1*P,0,.72)*S.depth),Z=Math.max(Z,.72*c1*t1)}if(t[Q]=p-a*$,Z>0){let S=Math.round(a1*W/I)%W,H=V+S;o.values[H]=Math.max(o.values[H],a*Z),S===0&&(o.values[V+W]=o.values[H])}}t[Y*c+I]=t[Y*c]}}function A0(t,c,o,x,a){let e=!!a,f=g1(.18,.84,x);if(c<257||f===0)return[];let M=c-1,r=i=>(i%M+M)%M,n=(i,d)=>t[S1(Math.round(d),0,M)*c+r(Math.round(i))],l=(i,d)=>{let _=i/M*L1,R=d/M*Math.PI;return[Math.sin(R)*Math.cos(_),Math.cos(R),Math.sin(R)*Math.sin(_)]},b=o>>>0,s=()=>(b=Math.imul(b,1664525)+1013904223>>>0,b/2**32),h=[],A=[],j=[];for(let i=0;i<24;i++){let d=Math.acos(1-(i+.5)/12)*M/Math.PI;for(let _=0;_<48;_++)j.push(n((_+.5)*M/48,d))}j.sort((i,d)=>i-d);let g=j[Math.floor(j.length*.71)]+.19,B=32,u=20;for(let i=0;i<u;i++)for(let d=0;d<B;d++){let _=(d+s())*M/B,R=(.23+.54*(i+s())/u)*M,C=L1*Math.sin(R/M*Math.PI)/M,z=Math.PI/M,k=(e?.195:.075)+(e?.25:.055)*s(),J=s(),Y=e?.005+k*(.019+.023*J):k*(.17+.065*J),V=(e?k*.12:Y*1.25)*(s()-.5),G=s()<.5?-1:1,v=s(),x1=s()*L1,T=n(_,R),D=l(_,R),a1=D[0]*.54+D[1]*.45+D[2]*.71,Q,p;for(let w=0;w<8;w++){let q=x1+w*L1/8,y=Math.cos(q),N=Math.sin(q),O=n(_+y*k/C,R+N*k/z),$=T-O;if($<(e?.085:.25))continue;let Z=n(_+y*k*.52/C,R+N*k*.52/z),S=n(_+(y*k*.4-N*Y)/C,R+(N*k*.4+y*Y)/z),H=n(_+(y*k*.4+N*Y)/C,R+(N*k*.4-y*Y)/z),X=Math.min(S,H)-O,L=.65*S1($,0,1.3)+.58*S1(X,-.35,.85)+.24*S1(Z-O,-.45,.65)+.46*a1+.16*s()+(e?.6*k:0),t1={x:_,y:R,xScale:C,yScale:z,dx:y,dy:N,length:k,width:Y,bend:V,branch:G,cirque:v,head:T,outlet:O,score:L};(!Q||L>Q.score)&&(Q=t1),O>=g&&(!p||L>p.score)&&(p=t1)}Q&&h.push(Q),p&&A.push(p)}let I=[],W=h.map(({outlet:i})=>i).sort((i,d)=>i-d),P=W[Math.floor(W.length*.76)],F=W[Math.floor(W.length*.44)];h.sort((i,d)=>d.score-i.score);let m=i=>I.every(({x:d,y:_})=>Math.hypot(Math.min(Math.abs(d-i.x),M-Math.abs(d-i.x))*i.xScale,(_-i.y)*i.yScale)>=(e?.2:.31)),U=A.sort((i,d)=>d.score-i.score)[0];U&&I.push(U);let E=h.find(i=>i.outlet<=P&&i.outlet>=F&&m(i));E&&I.push(E);for(let i of h)if(m(i)&&(I.push(i),I.length===(e?11+(o>>>5)%5:4)))break;return I.map(i=>{let{x:d,y:_,xScale:R,yScale:C,dx:z,dy:k,length:J,width:Y,bend:V,branch:G,cirque:v,head:x1,outlet:T}=i,D=Z=>{let S=a?q0(Z,V,v):0;return l(d+(Z*z*J-k*S)/R,_+(Z*k*J+z*S)/C)},a1={overlook:D(.93),head:D(.12)};if(a)return yt(t,c,a,i,f,s),a1;let Q=S1(x1-T,.26,1.14),p=z*J/R,w=k*J/C,q=Math.floor(d+Math.min(0,p)-3.2*Y/R),y=Math.ceil(d+Math.max(0,p)+3.2*Y/R),N=Math.max(1,Math.floor(_+Math.min(0,w)-3.2*Y/C)),O=Math.min(M-1,Math.ceil(_+Math.max(0,w)+3.2*Y/C)),$=Z=>T-.09*Q+.63*Q*(1-Z)**2;for(let Z=N;Z<=O;Z++){for(let S=q;S<=y;S++){let H=(S-d)*R,X=(Z-_)*C,L=(H*z+X*k)/J,t1=V*Math.sin(Math.PI*L),c1=(-H*k+X*z-t1)/Y,n1=S1(L,0,1),s1=.68+(.28+.37*v)*(1-g1(.04,.36,n1))+(.22+.24*(1-v))*g1(.56,.97,n1),K=g1(-.17,.07,L)*(1-g1(.83,1.19,L))*(1-g1(.25,1,Math.abs(c1)/s1)),o1=Z*c+r(S),r1=t[o1],f1=K*S1(r1-$(n1),0,.95),l1=v>.28?2:1;for(let M1=0;M1<l1;M1++){let m1=M1===0?G:-G,F1=.25+.14*v+M1*.31,d1=c1*m1,C1=L-F1+.16*d1-.021*d1*d1,U1=1-g1(.047,.16+.07*v,Math.abs(C1)),J1=2+.55*v-.3*M1,T1=U1*g1(.21,.72,d1)*(1-g1(J1*.59,J1,d1)),Q1=$(F1)+Q*(.18+.09*S1(d1,0,2.6));f1=Math.max(f1,T1*S1(r1-Q1,0,.62))}let b1=.89-.11*c1*c1,u1=(1-g1(.015,.067,Math.abs(L-b1)))*(1-g1(.56,.97,Math.abs(c1)))*g1(-.7,.28,c1*G)*Q*v*.075;t[o1]=r1+f*(u1-f1)}t[Z*c+M]=t[Z*c]}return a1})}var Tt=Object.freeze({natural:0,mesas:1,fractal:2,mosaic:3});function z1({regions:t},[c,o,x],a){if(!t)return a==="mesa"?[0,1,0,0]:a==="volcanic"?[0,0,0,1]:[1,0,0,0];let{side:e,values:f}=t,M=e-1,r=Math.hypot(c,x),n=r>0?Math.atan2(x,c)/(2*Math.PI):0,l=(n-Math.floor(n))*M,b=Math.atan2(r,o)*M/Math.PI,s=Math.floor(l),h=Math.floor(b),A=Math.min(M,h+1),j=l-s,g=b-h,B=f[h*e+s],u=f[h*e+Math.min(M,s+1)],I=f[A*e+s],W=f[A*e+Math.min(M,s+1)],P=d=>((B>>>d&255)*(1-j)*(1-g)+(u>>>d&255)*j*(1-g)+(I>>>d&255)*(1-j)*g+(W>>>d&255)*j*g)/255,F=P(0),m=P(8),U=P(16),E=F+m+U,i=1/Math.max(1,E);return[Math.max(0,1-E),F*i,m*i,U*i]}function M0(t,c,o,x,a){return c+a*(.5*(o-t)+a*(t-2.5*c+2*o-.5*x+a*(.5*(x-t)+1.5*(c-o))))}function x0(t,c,o,x,a){return .5*(o-t)+a*(2*(t-2.5*c+2*o-.5*x)+a*(1.5*(x-t)+4.5*(c-o)))}function L0({side:t,values:c},[o,x,a],e){let f=Math.hypot(o,a),M=f>0?Math.atan2(a,o)/(2*Math.PI):0,r=(M-Math.floor(M))*(t-1),n=Math.atan2(f,x)*(t-1)/Math.PI,l=Math.floor(n),b=u=>(u+t-1)%(t-1),s=(u,I,W=M0)=>{(u<0||u>=t)&&(u=u<0?-u:2*(t-1)-u,I+=(t-1)*.5);let P=Math.floor(I),F=u*t;return W(c[F+b(P-1)],c[F+b(P)],c[F+b(P+1)],c[F+b(P+2)],I-P)},h=(u,I=M0)=>s(l+u,r,I),A=h(-1),j=h(0),g=h(1),B=h(2);if(e&&f>1e-5){let u=M0(h(-1,x0),h(0,x0),h(1,x0),h(2,x0),n-l),I=x0(A,j,g,B,n-l),W=u/(2*Math.PI*f**2),P=I/(Math.PI*f),F=(t-1)*.023;e[0]=(-a*W+o*x*P)*F,e[1]=-f*f*P*F,e[2]=(o*W+a*x*P)*F}else if(e){let u=t-1,I=x>0?1:u-1,W=.023/(2*Math.sin(Math.PI/u));e[0]=(s(I,0)-s(I,u*.5))*W,e[1]=0,e[2]=(s(I,u*.25)-s(I,u*.75))*W}return M0(A,j,g,B,n-l)}function j1(t,c,o,x){let a=Math.imul(t,2376512323)^Math.imul(c,3625334849)^Math.imul(o,3407524639)^Math.imul(x,374761393);return a=Math.imul(a^a>>>16,2146121005),a=Math.imul(a^a>>>15,2221713035),(a^a>>>16)>>>0}function N0(t,c,o,{min:x,max:a,mean:e,coverage:f}={}){if(f===0)return null;let M=j1(0,0,0,o);if(f===void 0&&M>=2147483648)return null;if(x===void 0){x=1/0,a=-1/0;let h=0;for(let A of t)x=Math.min(x,A),a=Math.max(a,A),h+=A;e=h/t.length}let r=a-x;if(r===0)return x;let n=new Float64Array(96),l=Math.max(1,Math.floor((c-1)/160)),b=0;for(let h=1;h<c-1;h+=l){let A=Math.sin(Math.PI*h/(c-1));for(let j=0;j<c-1;j+=l){let g=Math.min(95,Math.floor((t[h*c+j]-x)/r*96));n[g]+=A,b+=A}}let s=b*(f??.28+.36*(M/2147483648));for(let h=0;h<n.length;h++){let A=n[h];if(A>0&&s<=A)return x+r*(h+s/A)/96;s-=A}return e}function y1(t,c,o){let x=Math.max(0,Math.min(1,(o-t)/(c-t)));return x*x*(3-2*x)}function Y0(t,c,o,x){let a=c-1,e=Math.max(1,Math.round(a/300)),f=a/65,M=.023*a/(2*Math.PI*e),r=t.slice();function n(l,b){let s=Math.floor(l),h=(s+a)%a,A=(h+1)%a,j=Math.max(0,Math.min(a,b)),g=Math.min(a-1,Math.floor(j)),B=l-s,u=j-g,I=g*c,W=r[I+h]*(1-B)+r[I+A]*B,P=r[I+c+h]*(1-B)+r[I+c+A]*B;return y1(.025,.22,o-(W*(1-u)+P*u))}for(let l=e;l<=a-e;l++){let b=l*c,s=Math.sin(Math.PI*l/a),h=y1(.08,.24,s);if(h===0)continue;let A=2*s,j=Math.max(1,Math.round(e/A));for(let g=0;g<a;g++){let B=r[b+g],u=B-o;if(u<-.2||u>.19)continue;let I=(r[b+(g+j)%a]-r[b+(g+a-j)%a])*e/(j*A),W=r[b+g+e*c]-r[b+g-e*c],P=Math.hypot(I,W),F=P*M;if(F<=.025)continue;let m=I/P,U=W/P,E=g-m*f/A,i=l-U*f,d=U*f*.58/A,_=-m*f*.58,R=y1(.19,.84,.46*n(E,i)+.27*(n(E+d,i+_)+n(E-d,i-_))),C=y1(.07,.36,F)*(.26+.74*R),z=(1-R)*y1(.025,.13,F)*(1-y1(.23,.56,F)),k=Math.min(u*.65,.058*(1-y1(.035,.19,u))),J=Math.min(-u*.64,.075*(1-y1(.055,.2,-u))),Y=Math.min(u*.52,.035*(1-y1(.025,.13,u))),V=Math.min(-u*.68,.078*(1-y1(.07,.2,-u))),G=u>=0?-C*k-z*Y:C*J+z*V;if(x!==void 0&&u>0){let x1=y1(.025,.075,u)*(1-y1(.12,.19,u));if(x==="mesa"){let T=.05+.035*R,D=u/T,a1=(Math.floor(D)+y1(.16,.76,D%1))*T;G+=.72*x1*C*(a1-u)}else{let T=.045*z*(1-y1(.07,.15,u));G+=x1*(T-.035*C)}}if(x!==void 0&&u<0){let x1=-u,T=y1(.012,.065,x1)*(1-y1(.09,.2,x1));G+=T*(x==="mesa"?.064:.041)*z}let v=B+h*G;t[b+g]=u>=0?Math.max(o,v):Math.min(o,v)}t[b+a]=t[b]}}var P1=2*Math.PI,O0=(t,c,o)=>Math.min(o,Math.max(c,t)),i1=(t,c,o)=>t+(c-t)*o;function I1(t,c,o){let x=O0((o-t)/(c-t),0,1);return x*x*(3-2*x)}function I0(t,c,o=!1){let x=Math.imul(t^t>>>16,2246822507)^3355159585,a=()=>(x=Math.imul(x,1664525)+1013904223>>>0,x/4294967296),e=a(),f=e<.44?1:e<.81?2:3+Math.floor(a()*2),M=a()*P1,r=[Math.cos(M),Math.sin(M)],n=a();return Array.from({length:o?1:f},(l,b)=>{let s=b===0,h=s?0:.51+.94*a(),A=(a()-.5)*h*(f===2?.84:1.6),j=r[0]*h-r[1]*A,g=r[1]*h+r[0]*A,B=s?.87+.24*a():(f===2?.38:.24)+.39*a(),u=s?n:.12+.7*a(),I=a()*P1,W=.7+.3*a(),P=Math.cos(I),F=Math.sin(I),m=Array.from({length:12},(_,R)=>{let C=R*P1/12,z=B*Math.cos(C),k=B*W*Math.sin(C);return c(j+z*P-k*F,g+z*F+k*P)}),U=m.reduce((_,R)=>_+R,0)/m.length,E=m.indexOf(Math.min(...m)),i=m.indexOf(Math.max(...m)),d=(.41+.38*a())*B**.74*i1(1,.69,u);return{x:j,y:g,size:B,stretch:W,cos:P,sin:F,datum:U,depth:d,wear:u,low:E*P1/12,high:i*P1/12,breach:i1(.19,.66,u)+.12*a(),rim:.33+.25*a(),harmonics:3+Math.floor(a()*5),warp:.042+.075*a(),offset:a()*P1,bench:.6+.13*a(),rebound:B<.48?0:Math.floor(a()*4),reboundAngle:a()*P1,reboundHeight:.34+.41*a()}})}function k0(t,c,o,x){let a=t-x.x,e=c-x.y,f=1.53*x.size*(1.021+x.warp);if(a*a+e*e>=f*f)return o;let M=(a*x.cos+e*x.sin)/x.size,r=(e*x.cos-a*x.sin)/(x.size*x.stretch),n=Math.atan2(r,M),l=Math.cos(x.harmonics*n+x.offset+.7*Math.sin(3*n)),b=Math.cos((x.harmonics+5)*n-x.offset),s=Math.hypot(M,r)/(1+x.warp*l+.021*b);if(s>=1.53)return o;let h=I1(.76-.2*x.wear,.99,Math.cos(n-x.low)),A=x.breach*h,g=x.datum-x.depth*(1-(x.flatFloor?.065:.19)*s*s)+x.depth*(x.flatFloor?.045:.14)*(M*Math.cos(x.high)+r*Math.sin(x.high)),B=I1(x.bench-.1,x.bench,s)*(1-I1(x.bench+.08,x.bench+.18,s)),u=I1(.66-.09*x.wear,.96,s),I=I1(.84-.06*x.wear,1,s)*(1-I1(1.02,1.24+.1*x.wear,s)),W=x.depth*x.rim*I*(1+.28*l+.11*b)*(1-A),P=M*Math.cos(x.reboundAngle)+r*Math.sin(x.reboundAngle),F=r*Math.cos(x.reboundAngle)-M*Math.sin(x.reboundAngle),m=0;x.rebound===1?m=1-I1(.035,.33,Math.hypot(P+.1,F*1.35)):x.rebound===2?m=Math.max(1-I1(.02,.24,Math.hypot(P+.17,F-.08)),.76*(1-I1(.025,.2,Math.hypot(P-.19,F+.07)))):x.rebound===3&&(m=(1-I1(.025,.14,Math.abs(Math.hypot(P,F*.92)-.29)))*I1(-.66,.44,l+.5*b));let U=I1(1,1.16,s)*(1-I1(1.16,1.53,s)),E=x.depth*.11*U*(.57+.26*l+.15*b),i=g+x.depth*((1.06-.62*A)*u+.26*B+x.reboundHeight*m),d=(1-I1(.89,1.2,s))*(x.flatFloor?.98:i1(.94,.72,x.wear));return i1(o,i,d)+W+E}function P0(t,c=!1){let o=(f,M)=>j1(f,M,613,t)/4294967296,x=o(-1,0),a=c?1+Math.floor(4*x):x<.012?2:x<.08?1:0,e=o(0,0)*P1;return Array.from({length:a},(f,M)=>{let r=i1(-.54,.54,o(M,1)),n=e+M*P1/a+i1(-.39,.39,o(M,2)),l=Math.sqrt(1-r*r),b=M===0?i1(.32,.43,o(M,3)):i1(.17,.3,o(M,3));return{center:[l*Math.cos(n),r,l*Math.sin(n)],longitude:n,size:b}})}function F0(t,c,o,x,a=1,e=!1,f=x>0||e?P0(o,e):[],M=0){if(x<=0&&!f.length)return 0;let r={side:c,values:t},n=c-1,l=Math.PI/n,b=P1/n,s=(z,k)=>j1(z,k,187,o)/4294967296,h=s(0,0),A=e?Math.max(.72,a):a,j=e?i1(115,190,s(0,1)):h<.48?i1(0,5,s(0,1)):h<.79?i1(12,31,s(0,1)):i1(62,134,s(0,1)),g=Math.min(640,Math.round(x*A**2*j)),B=Math.min(1,M),u=Math.max(0,M-1),I=B**4,W=Math.max(1,A),P=Math.round((I*i1(190,255,h)+u*W*i1(355,490,h))*i1(.72,1,x)),F=Math.round((B*i1(295,440,h)+710*I+860*u*W)*i1(.65,1,x)),m=Float64Array.from({length:c},(z,k)=>Math.sin(k*l)),U=Float64Array.from({length:c},(z,k)=>Math.cos(k*l)),E=Float64Array.from({length:n},(z,k)=>Math.sin(k*b)),i=Float64Array.from({length:n},(z,k)=>Math.cos(k*b)),d=new Float64Array(n),_=new Float64Array(n),R=new Int32Array(n),C=0;for(let z=-f.length;z<g+P+F;z++){let k=z<0?f[z+f.length]:void 0,J=z>=g&&z<g+P,Y=z>=g+P,V=s(z,2),G=k?.size??(Y?(.008+.067*V**i1(i1(3,2.3,I),1.7,u))/Math.sqrt(A):J?(.036+.092*V**i1(2.7,1.7,u))/Math.sqrt(A):(.014+.103*V**2.3)/A);if(G<2.1*l||!k&&G>.28)continue;let v=u>0&&(J||Y)?.998:Math.min(.94,Math.cos(2*G+.04)),x1=Math.acos(k?.center[1]??i1(-v,v,s(z,3))),T=k?(k.longitude+P1)%P1:P1*s(z,4),D=Math.sin(x1),a1=Math.cos(x1);if(G<1.4*b*D)continue;let Q=Math.sin(T),p=Math.cos(T),w=[D*p,a1,D*Q],q=[-Q,0,p],y=[-a1*p,D,-a1*Q],N=(K,o1)=>{let r1=Math.hypot(1,K*G,o1*G);return L0(r,w.map((f1,l1)=>(f1+G*(K*q[l1]+o1*y[l1]))/r1))},[O]=I0(j1(z,5,187,o),N,!0),$=s(z,6),Z=k?i1(.38,.62,$):Y||J?i1(.12,.85,$):i1(.86,.13,(z+$)/Math.max(1,g)),S=k?i1(.79,1.15,G/.43):O.depth*i1(1.02,.63,Z)*(Y?i1(.12+.065*I,.51+.15*I,V**1.8)+.22*u:J?i1(.42,.92,V)+.22*u:i1(.31,.95,(G*A-.014)/.103)),H=k?{...O,wear:Z,depth:S,size:1,stretch:i1(.9,.99,s(z,7)),warp:.42*O.warp,breach:.18,rim:.38,rebound:s(z,8)<.32?3:0,reboundHeight:.28,flatFloor:!0}:{...O,wear:Z,depth:S,stretch:i1(.81,1,s(z,7)),rim:J?Math.max(.49,O.rim):O.rim,rebound:Y&&V<.84?0:O.rebound},X=Math.asin(1.53*H.size*(1.021+H.warp)*G),L=X>=Math.min(x1,Math.PI-x1),t1=Math.max(L?0:1,Math.ceil((x1-X)/l)),c1=Math.min(L?n:n-1,Math.floor((x1+X)/l)),n1=L?Math.floor(n/2):Math.ceil(Math.asin(O0(Math.sin(X)/D,0,1))/b)+1,s1=Math.round(T/b),e1=Math.min(n,2*n1+1);for(let K=0;K<e1;K++){let o1=(s1-n1+K+n)%n;R[K]=o1,d[K]=(E[o1]*p-i[o1]*Q)/G,_[K]=(i[o1]*p+E[o1]*Q)/G}for(let K=t1;K<=c1;K++){let o1=K===0||K===n?0:m[K],r1=D*U[K]/G,f1=K*c;for(let l1=0;l1<e1;l1++){if(L&&a1*U[K]+D*o1*_[l1]*G<=0)continue;let b1=o1*d[l1],u1=r1-a1*o1*_[l1],M1=f1+R[l1];t[M1]=k0(b1,u1,t[M1],H)}t[f1+n]=t[f1]}C++}return C}var o0=2*Math.PI,C0=(t,c,o)=>Math.min(o,Math.max(c,t)),N1=(t,c,o)=>t+(c-t)*o;function h1(t,c,o){let x=C0((o-t)/(c-t),0,1);return x*x*(3-2*x)}function V0(t){return()=>(t=Math.imul(t,1664525)+1013904223>>>0,t/4294967296)}function G0(t,c,o){let x=o0*c/t,a=Math.PI*o/t,e=Math.sin(a);return[e*Math.cos(x),Math.cos(a),e*Math.sin(x)]}function wt(t){let c=[],o=3+Math.floor(3*t());for(let x=0;x<o;x++){let a=t()*Math.PI,e=Math.cos(a),f=Math.sin(a),M=1.6*(t()-.5),r=-1.15+.38*t(),n=.2+.17*t();for(let l=r;l<1.12;l+=n*(.7+.66*t())){let b=M+.27*(t()-.5);c.push({x:l*e-b*f,y:l*f+b*e,width:.19+.23*t(),depth:.14+.32*t(),elongation:.58+.4*t()})}}return c}function St(t,c,o,x,a){let e=.1*Math.sin(5*c+2*t),f=1-h1(.77,1.36,Math.hypot(t*.88,c));if(f<=0)return o;let M=0,r=0,n=1.4,l=1.4;for(let u of a){let I=t+e-u.x,W=c-u.y;if(Math.abs(I)*u.elongation>1.4*u.width||Math.abs(W)>1.4*u.width)continue;let P=Math.hypot(I*u.elongation,W)/u.width;P<n?(l=n,n=P):l=Math.min(l,P);let F=1-h1(.12,.95,P);M=Math.max(M,F*u.depth),r=Math.max(r,.045*h1(.19,.51,P)*(1-h1(.54,.84,P)))}let b=1-h1(.04,.24,Math.abs(c-.25*Math.sin(3.4*t)+.07*t)),s=h1(.04,.19,M),h=Math.max(M,.17*b)+.05*b*s,A=N1(o,x+.13,.7),j=.14*(1-h1(.02,.12,M))*h1(.08,.28,b+r),B=.26*((1-h1(.07,.48,l-n))*h1(.4,.79,n)*(1-h1(1.06,1.37,l)))*(.72+.28*Math.sin(7*t-9*c));return N1(o,A-h+r+j+B,f)}function T0(t,c){return c.bend*Math.sin(c.curve*t+c.phase)+c.shift*(h1(c.first-.25,c.first,t)-h1(c.last,c.last+.36,t))}function _t(t,c,o){let x={phase:c,bend:.08+.16*t(),curve:.72+1.86*t(),shift:.44*(t()-.5),first:-1.1+.86*t(),last:.12+.89*t(),width:.17+.17*t(),depth:.43+.21*o,vents:[],splays:[]},a=1+Math.floor(4*t());for(let f=0;f<a;f++){let M=-1.39+2.76*(f+.19+.63*t())/a;x.vents.push({at:M,across:T0(M,x)+.64*(t()-.5),width:.12+.26*t(),height:.28+.44*t(),crater:.09+.17*t()})}let e=Math.floor(3*t());for(let f=0;f<e;f++)x.splays.push({start:-1.32+1.65*t(),length:.76+.83*t(),reach:(t()<.5?-1:1)*(.38+.5*t())});return x}function At(t,c,o,x,a,e){let f=1-h1(1.35,2.25,Math.abs(t));if(f<=0)return o;let{phase:M,depth:r}=a,n=a.width+.14*h1(-.68,.79,Math.cos(t*3.6+M)),l=c-T0(t,a),b=l<0?-1:1,s=h1(-.7,.7,b*Math.sin(1.9*t+M)),h=Math.abs(l)/(n*N1(1.28,.82,s)),A=x-r-e*.35*t+.1*h1(.3,.95,Math.sin(t*4.5+M)),j=h1(.46,N1(1.2,.87,s),h),g=h1(.66,.83,h)*(1-h1(.86,1.13,h)),B=1-h1(.75,1.28,h),u=h1(.48,.84,h)*(1-h1(.96,1.18,h)),I=N1(A+r*j,o,.12+.2*j);I+=.11*s*g+.065*u*(1-s);let W=N1(o,I,f*B),P=h1(.76,1.08,h)*(1-h1(1.19,1.86,h));W+=f*P*N1(.038,.21,s);let F=0;for(let{start:m,length:U,reach:E}of a.splays){let i=(t-m)/U;if(i<=0||i>=1)continue;let d=Math.abs(l-E*(.18+.82*i)),_=h1(0,.22,i)*(1-h1(.69,1,i))*(1-h1(.065,.23,d));F=Math.max(F,.23*_)}W-=F;for(let m of a.vents){let U=Math.hypot(t-m.at,c-m.across)/m.width;if(U>=1.24)continue;let E=1-h1(.09,1.24,U),i=1-h1(.1,.39,U);W+=m.height*E**1.4-m.crater*i}return W}var c0=(t,c)=>t[0]*c[0]+t[1]*c[1]+t[2]*c[2];function $0(t,c,o,x,a,e){let f={impact:[],karst:[],rift:[]},M=h1(.24,.85,x);if(c<257||M<=0)return f;let r=c-1,n=i=>(i%r+r)%r,l=Math.PI/r,b=(i,d)=>t[C0(Math.round(d),0,r)*c+n(Math.round(i))],s=a.flatMap(({overlook:i,head:d})=>[i,d]),h=V0(o^2476863307),A=[];for(let i=0;i<13;i++)for(let d=0;d<28;d++){let _=(d+h())*r/28,R=(.22+.56*(i+h())/13)*r,C=G0(r,_,R),z=.54*C[0]+.45*C[1]+.71*C[2];if(s.some(p=>c0(p,C)>.95))continue;let k=o0*Math.sin(R*l)/r,J=.067+.035*h(),Y=h()*o0,V=Array.from({length:8},(p,w)=>{let q=Y+w*o0/8;return b(_+J*Math.cos(q)/k,R+J*Math.sin(q)/l)}),G=V.reduce((p,w)=>p+w,0)/V.length,v=Math.max(...V)-Math.min(...V),x1=b(_,R),[,T,D,a1]=z1({regions:e},C),Q=.54*T+.48*D;A.push({x:_,y:R,dir:C,xStep:k,radius:J,phase:Y,datum:G,relief:v,height:x1,light:z,bedrock:Q,volcanic:a1,samples:V,chance:h()})}if(!A.length)return f;let j=A.map(({datum:i})=>i).sort((i,d)=>i-d),g=j[Math.floor(j.length*.7)],B=({datum:i,height:d,light:_,relief:R,chance:C})=>1.3*_-Math.abs(i-g-.26)-.44*R-.32*Math.abs(d-i)+.2*C,u=({datum:i,height:d,light:_,relief:R,bedrock:C,chance:z})=>_-Math.abs(i-g-.36)-.65*R+.4*(d-i)+C+.3*z,I=A.sort((i,d)=>B(d)-B(i))[0],W=A.filter(({dir:i})=>c0(i,I.dir)<.94).sort((i,d)=>u(d)-u(i))[0],P=i=>({datum:d,relief:_,light:R,volcanic:C,chance:z})=>R-1.26*Math.abs(d-i)-.38*_+.64*C+.17*z,F=A.filter(({dir:i})=>c0(i,I.dir)<.91&&(!W||c0(i,W.dir)<.92)),m=(i,d)=>{let _=P(d);return i.sort((R,C)=>_(C)-_(R))[0]},U=m(F,j[Math.floor(j.length*.56)]+.3),E=U&&m(F.filter(({dir:i,datum:d})=>c0(i,U.dir)<.91&&d>U.datum+.29),g+.6);for(let[i,d]of[["impact",I],["karst",W],["rift",U],["rift",E]]){if(!d)continue;let{x:_,y:R,xStep:C,radius:z,phase:k,datum:J,chance:Y}=d,V=i==="rift",G=V?d.samples.indexOf(Math.min(...d.samples)):0,v=k+G*o0/8,x1=Math.cos(v),T=Math.sin(v),D=i==="impact",a1=D?I0(o,(X,L)=>b(_+(X*x1-L*T)*z/C,R+(X*T+L*x1)*z/l)).sort((X,L)=>L.wear-X.wear):[],Q=Math.max(0,...a1.map(({x:X,y:L,size:t1,warp:c1})=>Math.hypot(X,L)+1.53*t1*(1.021+c1))),p=z*(V?2.65:D?Q:1.56),w=i==="karst"?wt(h):[],q=Math.imul(o^o>>>16,2246822507)^Math.imul(Math.floor(_),2654435761),y=V?_t(V0(q),k,Y):null,N=V?C0(J-d.samples[G],.03,.28):0;for(let X=Math.max(1,Math.ceil(R-p/l));X<=Math.min(r-1,R+p/l);X++){for(let L=Math.ceil(_-p/C);L<=_+p/C;L++){let t1=(L-_)*C/z,c1=(X-R)*l/z,n1=t1*x1+c1*T,s1=c1*x1-t1*T,e1=X*c+n(L),K=t[e1],o1=K;if(D)for(let r1 of a1)o1=k0(n1,s1,o1,r1);else V?o1=At(n1,s1,K,J,y,N):o1=St(n1,s1,K,J,w);t[e1]=N1(K,o1,M)}t[X*c+r]=t[X*c]}let O=V?1.68:D?-Math.max(1.05,Q*.46):-.97,$=V?.65:0,Z=0,S=0;if(D){let X=a1.reduce((L,t1)=>L+t1.size,0);for(let L of a1)Z+=L.x*L.size/X,S+=L.y*L.size/X}let H=(X,L)=>G0(r,_+(X*x1-L*T)*z/C,R+(X*T+L*x1)*z/l);f[i].push({overlook:H(Z+O,S+$),target:H(Z,S)})}return f}var D1=2*Math.PI,u0=(t,c,o)=>Math.min(o,Math.max(c,t)),n0=(t,c,o)=>t+(c-t)*o;function _1(t,c,o){let x=u0((o-t)/(c-t),0,1);return x*x*(3-2*x)}function Z0(t,c,o){let x=D1*t/o,a=Math.PI*c/o,e=Math.sin(a);return[e*Math.cos(x),Math.cos(a),e*Math.sin(x)]}function D0(t,c,o,x,a,e,f){let M=_1(.31,.76,x);if(c<513||M<=0)return;let r=c-1,n=y=>(y%r+r)%r,l=Math.PI/r,b=(y,N)=>t[u0(Math.round(N),0,r)*c+n(Math.round(y))],s=[];for(let y=0;y<24;y++){let N=Math.acos(1-(y+.5)/12)/l;for(let O=0;O<40;O++)s.push(b((O+.5)*r/40,N))}s.sort((y,N)=>y-N);let h=s[Math.floor(s.length*.74)]+.14,A=[...a.map(({head:y})=>y),...Object.values(e).flat().map(({target:y})=>y)],j=Math.imul(o^o>>>17,1757159915)^1900846437,g=()=>(j=Math.imul(j,1664525)+1013904223>>>0,j/4294967296),B;for(let y=0;y<17;y++)for(let N=0;N<32;N++){let O=(N+g())*r/32,$=(.22+.56*(y+g())/17)*r,Z=Z0(O,$,r);if(A.some(s1=>s1[0]*Z[0]+s1[1]*Z[1]+s1[2]*Z[2]>.955))continue;let S=.54*Z[0]+.45*Z[1]+.71*Z[2];if(S<.22)continue;let H=D1*Math.sin($*l)/r,X=.042+.018*g(),L=g()*D1,[,t1,c1,n1]=z1({regions:f},Z);for(let s1=0;s1<8;s1++){let e1=L+s1*D1/8,K=Math.cos(e1),o1=Math.sin(e1),r1=b(O-K*X/H,$-o1*X/l),f1=b(O+K*X/H,$+o1*X/l),l1=r1-f1;if(f1<h-.2||l1<.16||l1>1.3)continue;let b1=b(O,$),u1=.92*S-.6*Math.abs(l1-.56)-.54*Math.abs(b1-(r1+f1)*.5)-.38*Math.abs(f1-h)+.31*n1+.19*t1+.12*c1+.2*g();(!B||u1>B.score)&&(B={x:O,y:$,xStep:H,size:X,dx:K,dy:o1,high:r1,low:f1,score:u1})}}if(!B)return;let{x:u,y:I,xStep:W,size:P,dx:F,dy:m,high:U,low:E}=B,i=.15+.15*g(),d=g()*D1,_=.7+.6*g(),R=g(),C=(Math.imul(o^o>>>16,2654435761)>>>0)%3,z=.42+.19*g(),k=(y,N=0)=>i*Math.sin(2.4*y+d)+N*z*_1(-.36,.68,y),J=y=>n0(U,E,u0((y+.95)/1.9,0,1)**_),Y=[];function V(y,N,O,$){Y.push({u:y,v:k(y,N)+.17*(g()-.5),length:O,width:$,level:J(y),phase:g()*D1,chemistry:u0(.82*R+.33*g()-.06,0,1)})}function G(y,N,O,$,Z){let S=(N-y)/$;for(let H=0;H<$;H++){let X=y+S*(H+.48+.32*(g()-.5));V(X,O,S*(.39+.21*g()),Z*(.62+.52*g()))}}C===0?(V(-.68,0,.3,.54+.19*g()),G(-.37,.97,-1,2+Math.floor(2*g()),.31),G(-.11,1,1,2+Math.floor(2*g()),.36)):C===1?G(-1,1.04,0,3+Math.floor(4*g()),.54):(V(-.54,0,.55+.1*g(),.68+.13*g()),G(.12,1.1,0,2+Math.floor(2*g()),.46)),Y.sort((y,N)=>y.u-N.u);let v=2.1*P,x1=v/W,T=v/l,D=[u/r,I/r,x1/r,T/r],a1=new Uint32Array(96**2),Q={height:0,wet:0,crust:0,tint:0},p=(y,N,O)=>{let $=(y-u)*W/P,Z=(N-I)*l/P,S=$*F+Z*m,H=Z*F-$*m,X=C===0?Math.min(Math.abs(H-k(S,-1)),Math.abs(H-k(S,1))):Math.abs(H-k(S)),L=(1-_1(.045,.16,X))*_1(-1.23,-.83,S)*(1-_1(.89,1.42,S)),t1=J(S),c1=n0(O,Math.min(O,t1),.42*L),n1=0,s1=L*.43,e1=R;for(let K of Y){let o1=(S-K.u)/K.length,r1=(H-K.v)/K.width;if(Math.abs(o1)>1.62||Math.abs(r1)>1.62)continue;let f1=Math.atan2(r1,o1),l1=1+.097*Math.sin(3*f1+K.phase)+.042*Math.cos(7*f1-K.phase),b1=Math.hypot(o1,r1)/l1;if(b1>=1.42)continue;let u1=_1(.52,.98,Math.cos(f1))*(1-_1(.09,.29,Math.abs(r1))),M1=_1(.76,.93,b1)*(1-_1(1,1.24,b1)),m1=_1(1.02,1.23,b1)*(1-_1(1.27,1.42,b1)),F1=K.level+M1*(.077-.063*u1)-.05*m1,d1=1-_1(.83,1.42,b1);c1=n0(c1,F1,d1);let C1=1-_1(.64,.8,b1),U1=(1-_1(1.01,1.42,b1))*_1(.58,.85,b1);n1=n0(n1,C1,d1),U1>s1&&(s1=U1,e1=K.chemistry*(.61+.39*M1))}Q.height=n0(O,c1,M),Q.wet=n1*M,Q.crust=s1*M,Q.tint=e1};for(let y=Math.ceil(I-T);y<=Math.floor(I+T);y++){for(let N=Math.ceil(u-x1);N<=Math.floor(u+x1);N++){let O=y*c+n(N);p(N,y,t[O]),t[O]=Q.height}t[y*c+r]=t[y*c]}let w=95;for(let y=0;y<=w;y++)for(let N=0;N<=w;N++)p(u+(2*N/w-1)*x1,I+(2*y/w-1)*T,0),a1[y*96+N]=1056964608|Math.round(255*Q.wet)|Math.round(255*Q.crust)<<8|Math.round(255*Q.tint)<<16;let q=(y,N)=>Z0(u+(y*F-N*m)*P/W,I+(y*m+N*F)*P/l,r);return e.springs=[{overlook:q(.86,.82),target:q(-.12,0)}],{chart:D,values:a1,side:96}}var a0=2*Math.PI,s0=(t,c,o)=>Math.min(o,Math.max(c,t)),K1=(t,c,o)=>t+(c-t)*o;function H1(t,c,o){let x=s0((o-t)/(c-t),0,1);return x*x*(3-2*x)}function K0(t,c,o){let x=Math.PI*c/o,a=a0*t/o;return[Math.sin(x)*Math.cos(a),Math.cos(x),Math.sin(x)*Math.sin(a)]}function R0(t,c){let o=t-Math.floor(t),x=Math.min(o/c,(1-o)/(1-c));return x*x*(1.32-.32*x)}function J0(t,c,o,x,a,e,f){let M=H1(.32,.76,x);if(c<513||M<=0)return;let r=c-1,n=Math.PI/r,l=S=>(S%r+r)%r,b=(S,H)=>t[s0(Math.round(H),0,r)*c+l(Math.round(S))],s=Math.imul(o^o>>>16,2221713035)^458671337,h=()=>(s=Math.imul(s,1664525)+1013904223>>>0,s/4294967296),A=[...a.map(({head:S})=>S),...Object.values(e).flat().map(({target:S})=>S)],j=[];for(let S=0;S<20;S++){let H=Math.acos(1-(S+.5)/10)/n;for(let X=0;X<36;X++)j.push(b((X+.5)*r/36,H))}j.sort((S,H)=>S-H);let g=j[Math.floor(j.length*.75)],B;for(let S=0;S<18;S++)for(let H=0;H<36;H++){let X=(H+h())*r/36,L=(.23+.54*(S+h())/18)*r,t1=K0(X,L,r),c1=.54*t1[0]+.45*t1[1]+.71*t1[2];if(c1<.22||A.some(u1=>u1[0]*t1[0]+u1[1]*t1[1]+u1[2]*t1[2]>.934))continue;let n1=a0*Math.sin(L*n)/r,s1=.066+.027*h(),e1=Array.from({length:8},(u1,M1)=>{let m1=M1*a0/8;return b(X+s1*Math.cos(m1)/n1,L+s1*Math.sin(m1)/n)}),K=b(X,L);if(K<g-.12)continue;let o1=e1.reduce((u1,M1)=>u1+M1,0)/e1.length,r1=Math.max(...e1)-Math.min(...e1),[,f1,,l1]=z1({regions:f},t1),b1=.8*c1-.52*Math.abs(K-g-.17)+.55*s0(o1-K,-.6,.65)-.26*s0(r1-.33,0,1.6)+.3*f1+.39*l1+.18*h();(!B||b1>B.score)&&(B={x:X,y:L,xStep:n1,radius:s1,center:K,mean:o1,volcanic:l1,score:b1})}if(!B)return;let{x:u,y:I,xStep:W,radius:P,center:F,mean:m,volcanic:U}=B,E=h()*a0,i=Math.cos(E),d=Math.sin(E),_=h()*a0,R=(Math.imul(o^o>>>17,2146121005)>>>0)%3,C=3.05+1.24*h(),z=s0(.7*U+.55*h()-.1,0,1),k=K1(F,m,.19),J=.19+.16*h(),Y=J*(.68+.58*h()),V=0,G=0,v=1/0;for(let S=0;S<18;S++){let H=.14+.56*h(),X=.86*(h()-.5),L=b(u+(i*H-d*X)*P/W,I+(d*H+i*X)*P/n);L<v&&(V=H,G=X,v=L)}v=Math.max(k-.19,v-.055);let x1=Array.from({length:20+Math.floor(12*h())},()=>({x:1.94*(h()-.5),y:1.9*(h()-.5),length:.15+.2*h(),width:.17+.23*h(),height:.09+.15*h(),curve:.22+.6*h()})),T=1.37*P/W,D=1.37*P/n,a1=[u/r,I/r,T/r,D/r],Q=new Uint32Array(96**2),p={height:0,sand:0,salt:0};function w(S,H,X){let L=(S-u)*W/P,t1=(H-I)*n/P,c1=i*L+d*t1,n1=i*t1-d*L,s1=1-H1(.71,1.21,Math.hypot(c1*.95,n1)),e1=k+.12*n1+.075*c1*c1,K=H1(.19,.59,X-e1),o1=H1(-.63,.62,.65*Math.sin(5.7*n1+_+1.5*c1)+.36*Math.cos(7.2*c1-4.5*n1)),r1=s1*(1-K)*K1(.53,1,o1),f1=Math.hypot((c1-V)/Y,(n1-G)/J)+.1*Math.sin(17*n1+5*c1+_),l1=s1*(1-H1(.63,1.23,f1))*(1-H1(v+.15,v+.33,X)),b1;if(R===1){b1=0;for(let M1 of x1){let m1=(n1-M1.y)/M1.width;if(Math.abs(m1)>=1)continue;let F1=m1*m1,d1=(c1-M1.x)/M1.length-M1.curve*F1,C1=(1-H1(.06,1,Math.abs(m1)))*H1(-1,.48,d1)*(1-H1(.48,.83,d1));b1=Math.max(b1,M1.height*C1)}}else{let M1=c1+.095*Math.sin(4.6*n1+_)+.054*Math.cos(10*n1-3.4*c1),m1=R0(C*M1+.18*Math.sin(n1*7+_),.76);if(R===2){let F1=R0(C*(n1*.67-.77*c1+.08*Math.sin(c1*8+_)),.68),d1=R0(C*(n1*.72+.63*c1+.13*Math.sin(n1*6-_)),.72);b1=.13*m1+.115*F1*d1+.082*m1*Math.max(F1,d1)}else b1=.22*m1}let u1=K1(X,e1+b1*K1(.49,1.18,o1),r1*.92);p.height=K1(X,K1(u1,v,l1*.95),M),p.sand=r1*(1-l1)*M,p.salt=l1*M}let q=95;for(let S=0;S<=q;S++)for(let H=0;H<=q;H++){let X=u+(2*H/q-1)*T,L=I+(2*S/q-1)*D;w(X,L,b(X,L)),Q[S*96+H]=1056964608|Math.round(255*p.sand)|Math.round(255*p.salt)<<8|Math.round(255*z)<<16}for(let S=Math.ceil(I-D);S<=Math.floor(I+D);S++){for(let H=Math.ceil(u-T);H<=Math.floor(u+T);H++){let X=S*c+l(H);w(H,S,t[X]),t[X]=p.height}t[S*c+r]=t[S*c]}let y=(S,H)=>K0(u+(S*i-H*d)*P/W,I+(S*d+H*i)*P/n,r);e.dunes=[{overlook:y(.94,.69),target:y(-.07,0)}];let N=y(-.01,0),$=y(.01,0).map((S,H)=>S-N[H]),Z=Math.hypot(...$);return{chart:a1,values:Q,side:96,wind:$.map(S=>S/Z)}}var It=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],kt=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],Q0=[[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,8,3,9,8,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,1,2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,2,10,0,2,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,8,3,2,10,8,10,9,8,-1,-1,-1,-1,-1,-1,-1],[3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,11,2,8,11,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,9,0,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,11,2,1,9,11,9,8,11,-1,-1,-1,-1,-1,-1,-1],[3,10,1,11,10,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,10,1,0,8,10,8,11,10,-1,-1,-1,-1,-1,-1,-1],[3,9,0,3,11,9,11,10,9,-1,-1,-1,-1,-1,-1,-1],[9,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,3,0,7,3,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,1,9,4,7,1,7,3,1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,8,4,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,4,7,3,0,4,1,2,10,-1,-1,-1,-1,-1,-1,-1],[9,2,10,9,0,2,8,4,7,-1,-1,-1,-1,-1,-1,-1],[2,10,9,2,9,7,2,7,3,7,9,4,-1,-1,-1,-1],[8,4,7,3,11,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,4,7,11,2,4,2,0,4,-1,-1,-1,-1,-1,-1,-1],[9,0,1,8,4,7,2,3,11,-1,-1,-1,-1,-1,-1,-1],[4,7,11,9,4,11,9,11,2,9,2,1,-1,-1,-1,-1],[3,10,1,3,11,10,7,8,4,-1,-1,-1,-1,-1,-1,-1],[1,11,10,1,4,11,1,0,4,7,11,4,-1,-1,-1,-1],[4,7,8,9,0,11,9,11,10,11,0,3,-1,-1,-1,-1],[4,7,11,4,11,9,9,11,10,-1,-1,-1,-1,-1,-1,-1],[9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,5,4,0,8,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,5,4,1,5,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,5,4,8,3,5,3,1,5,-1,-1,-1,-1,-1,-1,-1],[1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,8,1,2,10,9,5,4,-1,-1,-1,-1,-1,-1,-1],[5,2,10,5,4,2,4,0,2,-1,-1,-1,-1,-1,-1,-1],[2,10,5,3,2,5,3,5,4,3,4,8,-1,-1,-1,-1],[9,5,4,2,3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,11,2,0,8,11,4,9,5,-1,-1,-1,-1,-1,-1,-1],[0,5,4,0,1,5,2,3,11,-1,-1,-1,-1,-1,-1,-1],[2,1,5,2,5,8,2,8,11,4,8,5,-1,-1,-1,-1],[10,3,11,10,1,3,9,5,4,-1,-1,-1,-1,-1,-1,-1],[4,9,5,0,8,1,8,10,1,8,11,10,-1,-1,-1,-1],[5,4,0,5,0,11,5,11,10,11,0,3,-1,-1,-1,-1],[5,4,8,5,8,10,10,8,11,-1,-1,-1,-1,-1,-1,-1],[9,7,8,5,7,9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,3,0,9,5,3,5,7,3,-1,-1,-1,-1,-1,-1,-1],[0,7,8,0,1,7,1,5,7,-1,-1,-1,-1,-1,-1,-1],[1,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,7,8,9,5,7,10,1,2,-1,-1,-1,-1,-1,-1,-1],[10,1,2,9,5,0,5,3,0,5,7,3,-1,-1,-1,-1],[8,0,2,8,2,5,8,5,7,10,5,2,-1,-1,-1,-1],[2,10,5,2,5,3,3,5,7,-1,-1,-1,-1,-1,-1,-1],[7,9,5,7,8,9,3,11,2,-1,-1,-1,-1,-1,-1,-1],[9,5,7,9,7,2,9,2,0,2,7,11,-1,-1,-1,-1],[2,3,11,0,1,8,1,7,8,1,5,7,-1,-1,-1,-1],[11,2,1,11,1,7,7,1,5,-1,-1,-1,-1,-1,-1,-1],[9,5,8,8,5,7,10,1,3,10,3,11,-1,-1,-1,-1],[5,7,0,5,0,9,7,11,0,1,0,10,11,10,0,-1],[11,10,0,11,0,3,10,5,0,8,0,7,5,7,0,-1],[11,10,5,7,11,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,0,1,5,10,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,8,3,1,9,8,5,10,6,-1,-1,-1,-1,-1,-1,-1],[1,6,5,2,6,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,6,5,1,2,6,3,0,8,-1,-1,-1,-1,-1,-1,-1],[9,6,5,9,0,6,0,2,6,-1,-1,-1,-1,-1,-1,-1],[5,9,8,5,8,2,5,2,6,3,2,8,-1,-1,-1,-1],[2,3,11,10,6,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,0,8,11,2,0,10,6,5,-1,-1,-1,-1,-1,-1,-1],[0,1,9,2,3,11,5,10,6,-1,-1,-1,-1,-1,-1,-1],[5,10,6,1,9,2,9,11,2,9,8,11,-1,-1,-1,-1],[6,3,11,6,5,3,5,1,3,-1,-1,-1,-1,-1,-1,-1],[0,8,11,0,11,5,0,5,1,5,11,6,-1,-1,-1,-1],[3,11,6,0,3,6,0,6,5,0,5,9,-1,-1,-1,-1],[6,5,9,6,9,11,11,9,8,-1,-1,-1,-1,-1,-1,-1],[5,10,6,4,7,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,3,0,4,7,3,6,5,10,-1,-1,-1,-1,-1,-1,-1],[1,9,0,5,10,6,8,4,7,-1,-1,-1,-1,-1,-1,-1],[10,6,5,1,9,7,1,7,3,7,9,4,-1,-1,-1,-1],[6,1,2,6,5,1,4,7,8,-1,-1,-1,-1,-1,-1,-1],[1,2,5,5,2,6,3,0,4,3,4,7,-1,-1,-1,-1],[8,4,7,9,0,5,0,6,5,0,2,6,-1,-1,-1,-1],[7,3,9,7,9,4,3,2,9,5,9,6,2,6,9,-1],[3,11,2,7,8,4,10,6,5,-1,-1,-1,-1,-1,-1,-1],[5,10,6,4,7,2,4,2,0,2,7,11,-1,-1,-1,-1],[0,1,9,4,7,8,2,3,11,5,10,6,-1,-1,-1,-1],[9,2,1,9,11,2,9,4,11,7,11,4,5,10,6,-1],[8,4,7,3,11,5,3,5,1,5,11,6,-1,-1,-1,-1],[5,1,11,5,11,6,1,0,11,7,11,4,0,4,11,-1],[0,5,9,0,6,5,0,3,6,11,6,3,8,4,7,-1],[6,5,9,6,9,11,4,7,9,7,11,9,-1,-1,-1,-1],[10,4,9,6,4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,10,6,4,9,10,0,8,3,-1,-1,-1,-1,-1,-1,-1],[10,0,1,10,6,0,6,4,0,-1,-1,-1,-1,-1,-1,-1],[8,3,1,8,1,6,8,6,4,6,1,10,-1,-1,-1,-1],[1,4,9,1,2,4,2,6,4,-1,-1,-1,-1,-1,-1,-1],[3,0,8,1,2,9,2,4,9,2,6,4,-1,-1,-1,-1],[0,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,3,2,8,2,4,4,2,6,-1,-1,-1,-1,-1,-1,-1],[10,4,9,10,6,4,11,2,3,-1,-1,-1,-1,-1,-1,-1],[0,8,2,2,8,11,4,9,10,4,10,6,-1,-1,-1,-1],[3,11,2,0,1,6,0,6,4,6,1,10,-1,-1,-1,-1],[6,4,1,6,1,10,4,8,1,2,1,11,8,11,1,-1],[9,6,4,9,3,6,9,1,3,11,6,3,-1,-1,-1,-1],[8,11,1,8,1,0,11,6,1,9,1,4,6,4,1,-1],[3,11,6,3,6,0,0,6,4,-1,-1,-1,-1,-1,-1,-1],[6,4,8,11,6,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,10,6,7,8,10,8,9,10,-1,-1,-1,-1,-1,-1,-1],[0,7,3,0,10,7,0,9,10,6,7,10,-1,-1,-1,-1],[10,6,7,1,10,7,1,7,8,1,8,0,-1,-1,-1,-1],[10,6,7,10,7,1,1,7,3,-1,-1,-1,-1,-1,-1,-1],[1,2,6,1,6,8,1,8,9,8,6,7,-1,-1,-1,-1],[2,6,9,2,9,1,6,7,9,0,9,3,7,3,9,-1],[7,8,0,7,0,6,6,0,2,-1,-1,-1,-1,-1,-1,-1],[7,3,2,6,7,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,11,10,6,8,10,8,9,8,6,7,-1,-1,-1,-1],[2,0,7,2,7,11,0,9,7,6,7,10,9,10,7,-1],[1,8,0,1,7,8,1,10,7,6,7,10,2,3,11,-1],[11,2,1,11,1,7,10,6,1,6,7,1,-1,-1,-1,-1],[8,9,6,8,6,7,9,1,6,11,6,3,1,3,6,-1],[0,9,1,11,6,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,8,0,7,0,6,3,11,0,11,6,0,-1,-1,-1,-1],[7,11,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,8,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,1,9,11,7,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,1,9,8,3,1,11,7,6,-1,-1,-1,-1,-1,-1,-1],[10,1,2,6,11,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,3,0,8,6,11,7,-1,-1,-1,-1,-1,-1,-1],[2,9,0,2,10,9,6,11,7,-1,-1,-1,-1,-1,-1,-1],[6,11,7,2,10,3,10,8,3,10,9,8,-1,-1,-1,-1],[7,2,3,6,2,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[7,0,8,7,6,0,6,2,0,-1,-1,-1,-1,-1,-1,-1],[2,7,6,2,3,7,0,1,9,-1,-1,-1,-1,-1,-1,-1],[1,6,2,1,8,6,1,9,8,8,7,6,-1,-1,-1,-1],[10,7,6,10,1,7,1,3,7,-1,-1,-1,-1,-1,-1,-1],[10,7,6,1,7,10,1,8,7,1,0,8,-1,-1,-1,-1],[0,3,7,0,7,10,0,10,9,6,10,7,-1,-1,-1,-1],[7,6,10,7,10,8,8,10,9,-1,-1,-1,-1,-1,-1,-1],[6,8,4,11,8,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,6,11,3,0,6,0,4,6,-1,-1,-1,-1,-1,-1,-1],[8,6,11,8,4,6,9,0,1,-1,-1,-1,-1,-1,-1,-1],[9,4,6,9,6,3,9,3,1,11,3,6,-1,-1,-1,-1],[6,8,4,6,11,8,1,2,10,-1,-1,-1,-1,-1,-1,-1],[1,2,10,3,0,11,0,6,11,0,4,6,-1,-1,-1,-1],[4,11,8,4,6,11,0,2,9,2,10,9,-1,-1,-1,-1],[10,9,3,10,3,2,9,4,3,11,3,6,4,6,3,-1],[8,2,3,8,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1],[0,4,2,4,6,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,9,0,2,3,4,2,4,6,4,3,8,-1,-1,-1,-1],[1,9,4,1,4,2,2,4,6,-1,-1,-1,-1,-1,-1,-1],[8,1,3,8,4,1,4,6,1,6,10,1,-1,-1,-1,-1],[10,1,0,10,0,6,6,0,4,-1,-1,-1,-1,-1,-1,-1],[4,6,3,4,3,8,6,10,3,0,3,9,10,9,3,-1],[10,9,4,6,10,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,9,5,7,6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,4,9,5,11,7,6,-1,-1,-1,-1,-1,-1,-1],[5,0,1,5,4,0,7,6,11,-1,-1,-1,-1,-1,-1,-1],[11,7,6,8,3,4,3,5,4,3,1,5,-1,-1,-1,-1],[9,5,4,10,1,2,7,6,11,-1,-1,-1,-1,-1,-1,-1],[6,11,7,1,2,10,0,8,3,4,9,5,-1,-1,-1,-1],[7,6,11,5,4,10,4,2,10,4,0,2,-1,-1,-1,-1],[3,4,8,3,5,4,3,2,5,10,5,2,11,7,6,-1],[7,2,3,7,6,2,5,4,9,-1,-1,-1,-1,-1,-1,-1],[9,5,4,0,8,6,0,6,2,6,8,7,-1,-1,-1,-1],[3,6,2,3,7,6,1,5,0,5,4,0,-1,-1,-1,-1],[6,2,8,6,8,7,2,1,8,4,8,5,1,5,8,-1],[9,5,4,10,1,6,1,7,6,1,3,7,-1,-1,-1,-1],[1,6,10,1,7,6,1,0,7,8,7,0,9,5,4,-1],[4,0,10,4,10,5,0,3,10,6,10,7,3,7,10,-1],[7,6,10,7,10,8,5,4,10,4,8,10,-1,-1,-1,-1],[6,9,5,6,11,9,11,8,9,-1,-1,-1,-1,-1,-1,-1],[3,6,11,0,6,3,0,5,6,0,9,5,-1,-1,-1,-1],[0,11,8,0,5,11,0,1,5,5,6,11,-1,-1,-1,-1],[6,11,3,6,3,5,5,3,1,-1,-1,-1,-1,-1,-1,-1],[1,2,10,9,5,11,9,11,8,11,5,6,-1,-1,-1,-1],[0,11,3,0,6,11,0,9,6,5,6,9,1,2,10,-1],[11,8,5,11,5,6,8,0,5,10,5,2,0,2,5,-1],[6,11,3,6,3,5,2,10,3,10,5,3,-1,-1,-1,-1],[5,8,9,5,2,8,5,6,2,3,8,2,-1,-1,-1,-1],[9,5,6,9,6,0,0,6,2,-1,-1,-1,-1,-1,-1,-1],[1,5,8,1,8,0,5,6,8,3,8,2,6,2,8,-1],[1,5,6,2,1,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,3,6,1,6,10,3,8,6,5,6,9,8,9,6,-1],[10,1,0,10,0,6,9,5,0,5,6,0,-1,-1,-1,-1],[0,3,8,5,6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[10,5,6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,5,10,7,5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[11,5,10,11,7,5,8,3,0,-1,-1,-1,-1,-1,-1,-1],[5,11,7,5,10,11,1,9,0,-1,-1,-1,-1,-1,-1,-1],[10,11,7,10,7,5,9,8,1,8,3,1,-1,-1,-1,-1],[11,1,2,11,7,1,7,5,1,-1,-1,-1,-1,-1,-1,-1],[0,8,3,1,2,7,1,7,5,7,2,11,-1,-1,-1,-1],[9,7,5,9,2,7,9,0,2,2,11,7,-1,-1,-1,-1],[7,5,2,7,2,11,5,9,2,3,2,8,9,8,2,-1],[2,5,10,2,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1],[8,2,0,8,5,2,8,7,5,10,2,5,-1,-1,-1,-1],[9,0,1,5,10,3,5,3,7,3,10,2,-1,-1,-1,-1],[9,8,2,9,2,1,8,7,2,10,2,5,7,5,2,-1],[1,3,5,3,7,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,8,7,0,7,1,1,7,5,-1,-1,-1,-1,-1,-1,-1],[9,0,3,9,3,5,5,3,7,-1,-1,-1,-1,-1,-1,-1],[9,8,7,5,9,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[5,8,4,5,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1],[5,0,4,5,11,0,5,10,11,11,3,0,-1,-1,-1,-1],[0,1,9,8,4,10,8,10,11,10,4,5,-1,-1,-1,-1],[10,11,4,10,4,5,11,3,4,9,4,1,3,1,4,-1],[2,5,1,2,8,5,2,11,8,4,5,8,-1,-1,-1,-1],[0,4,11,0,11,3,4,5,11,2,11,1,5,1,11,-1],[0,2,5,0,5,9,2,11,5,4,5,8,11,8,5,-1],[9,4,5,2,11,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,5,10,3,5,2,3,4,5,3,8,4,-1,-1,-1,-1],[5,10,2,5,2,4,4,2,0,-1,-1,-1,-1,-1,-1,-1],[3,10,2,3,5,10,3,8,5,4,5,8,0,1,9,-1],[5,10,2,5,2,4,1,9,2,9,4,2,-1,-1,-1,-1],[8,4,5,8,5,3,3,5,1,-1,-1,-1,-1,-1,-1,-1],[0,4,5,1,0,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[8,4,5,8,5,3,9,0,5,0,3,5,-1,-1,-1,-1],[9,4,5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,11,7,4,9,11,9,10,11,-1,-1,-1,-1,-1,-1,-1],[0,8,3,4,9,7,9,11,7,9,10,11,-1,-1,-1,-1],[1,10,11,1,11,4,1,4,0,7,4,11,-1,-1,-1,-1],[3,1,4,3,4,8,1,10,4,7,4,11,10,11,4,-1],[4,11,7,9,11,4,9,2,11,9,1,2,-1,-1,-1,-1],[9,7,4,9,11,7,9,1,11,2,11,1,0,8,3,-1],[11,7,4,11,4,2,2,4,0,-1,-1,-1,-1,-1,-1,-1],[11,7,4,11,4,2,8,3,4,3,2,4,-1,-1,-1,-1],[2,9,10,2,7,9,2,3,7,7,4,9,-1,-1,-1,-1],[9,10,7,9,7,4,10,2,7,8,7,0,2,0,7,-1],[3,7,10,3,10,2,7,4,10,1,10,0,4,0,10,-1],[1,10,2,8,7,4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,9,1,4,1,7,7,1,3,-1,-1,-1,-1,-1,-1,-1],[4,9,1,4,1,7,0,8,1,8,7,1,-1,-1,-1,-1],[4,0,3,7,4,3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[4,8,7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[9,10,8,10,11,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,0,9,3,9,11,11,9,10,-1,-1,-1,-1,-1,-1,-1],[0,1,10,0,10,8,8,10,11,-1,-1,-1,-1,-1,-1,-1],[3,1,10,11,3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,2,11,1,11,9,9,11,8,-1,-1,-1,-1,-1,-1,-1],[3,0,9,3,9,11,1,2,9,2,11,9,-1,-1,-1,-1],[0,2,11,8,0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[3,2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,8,2,8,10,10,8,9,-1,-1,-1,-1,-1,-1,-1],[9,10,2,0,9,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[2,3,8,2,8,10,0,1,8,1,10,8,-1,-1,-1,-1],[1,10,2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[1,3,8,9,1,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,9,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[0,3,8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]],Pt=Uint32Array.from(Q0.flat(),t=>t>>>0),Ft={name:"Bourke",corners:It,edges:kt,maxVertices:15,table:Pt,cornerBit:t=>1<<t,createPolygonizer(){return(t,c,o)=>{let x=Q0[c],a=0;for(;a<15&&x[a]>=0;)o[a]=x[a],a++;return a}}};var v0=Ft;var Ct=new Uint32Array([0,2181,2182,2197,2179,6166,2205,2371,2180,2199,6164,2326,2193,2380,2335,1167,2178,2203,6152,2356,10243,14359,14356,1317,6158,2344,18434,1181,14357,1345,24580,272,2177,6154,2201,2338,6150,18432,2323,1177,10242,14350,14353,1341,14349,24578,1313,269,2187,2374,2359,1171,14355,24579,1349,302,14351,1329,24586,284,20481,12289,12297,135,2176,10241,6148,14343,2191,14347,2347,1337,6146,14342,18438,24577,2341,1309,1173,266,6162,14346,18437,24585,14358,20482,24584,12304,18433,24576,28672,16387,24582,12292,16391,4112,2185,14344,2362,1325,2377,24581,1169,305,14348,20480,24587,12306,1353,12290,281,141,2311,1333,1185,317,1321,12293,320,147,24583,12288,16388,4096,12291,8192,4108,127,896,265,538,2866,2373,1864,1974,1701,4489,312,4762,146,6970,794,4784,2944,4165,261,6517,2439,4928,884,7077,1973,5254,2920,5653,534,5926,1842,5226,2378,6469,56,4361,1864,5797,265,6469,538,5797,811,6070,538,6070,56,6962,1864,4634,56,6962,265,5797,2164,6469,1974,6405,4149,5203,2115,6516,6423,6257,129,5637,6480,4458,262,6725,6466,4682,402,5029,6998,4906,2869,4518,6066,4631,1649,6022,6150,7008,944,6196,4900,5954,2930,4666,5002,4520,24,4393,4793,4251,779,5285,6790,5258,1896,7013,6036,6073,1435,5797,896,6070,265,4634,1864,6469,2866,4261,6149,6243,5765,5795,928,6038,4534,4457,6512,6064,177,5962,6050,6258,6721,5249,386,4789,6964,6467,5556,5522,659,7066,6448,2483,6154,4122,2954,6299,6930,2961,4746,4994,2472,4678,5145,1057,6309,5253,2984,4134,4199,120,6213,5432,309,5994,6791,2442,5909,4530,379,4469,5896,1808,5158,6194,584,4202,5216,266,4425,4468,881,5163,5963,36,4773,5426,1845,5685,4971,339,5781,5641,518,6453,5008,1875,5046,4960,1030,6586,6068,2964,6054,5914,791,6693,4677,66,6501,6582,2233,5226,6804,896,5797,4489,312,5797,6155,43,7077,5499,56,5653,5665,2051,5797,4148,884,6326,5704,265,7077,6069,265,4762,6070,146,6070,4489,312,5926,5938,265,4165,6070,261,4762,4617,1864,6517,4634,2169,5254,4634,2230,4890,6970,2164,4634,4980,1027,5653,4630,2164,6469,4784,2944,6469,6970,794,5226,6474,811,6517,6535,691,4165,5392,2866,6469,5926,1842,4970,6410,4244,6148,5764,4998,928,6293,4517,4970,5521,5025,6243,2134,4261,6838,4138,6699,6251,5480,88,4261,6021,6267,5003,6715,4154,88,5765,4662,4897,4145,5377,6149,2147,4261,5206,4982,5748,4180,5024,2614,5270,6472,4248,6920,4363,5659,361,6037,4517,4538,6421,4247,6919,177,6566,5794,7010,4274,6064,6512,1942,6038,4411,6968,6072,6520,4457,438,6038,5936,4146,4354,5650,6422,2416,4453,5957,5974,5892,7009,4273,2823,5274,4616,6153,5257,5962,4730,1832,6565,5978,4521,6169,4632,5928,634,5286,6322,4790,6694,4516,6164,386,5146,7034,6067,6259,4483,5249,1191,5146,4116,4355,4627,5923,6695,1191,5701,5141,5958,4726,6258,4482,2068,6437,7044,5248,6464,4752,6994,1460,6565,4889,6426,7002,5211,4939,1081,7018,6982,4794,6442,4905,5177,843,4789,5016,4999,6967,5559,6437,659,6981,4389,4624,4896,5168,6964,2898,4709,5492,5479,4935,6467,4755,2341,4970,6410,5024,5764,902,5765,4970,6293,4410,2147,4261,6230,4138,6251,88,4261,6021,4184,6715,58,5765,4662,6243,5377,2053,4261,6710,4180,4982,928,5270,4457,6920,4363,1563,6037,4538,4273,4247,2823,6566,6038,4274,6064,2416,6038,4411,5659,6520,361,6038,4390,5936,6512,2326,4453,5892,6919,7009,177,5274,4616,5928,5962,634,6773,4730,6169,4632,1832,5286,6322,4482,4516,2068,5962,7034,4483,5249,2625,5146,4116,5923,6695,1191,5141,4726,6164,6258,386,6437,7044,5556,4752,2898,6837,4889,5177,5211,843,6982,6442,4939,4905,1081,4789,5016,4755,5559,2341,4789,4389,5168,6964,1460,4709,6437,5940,6467,659,6469,4634,1974,4787,6260,265,5797,6962,2164,6469,4634,56,6469,6070,56,5797,6962,265,5797,4361,1864,4634,6070,896,7013,6581,4634,6036,2967,7058,6260,6960,6576,2322,5285,6790,6962,6262,2212,6469,5002,6145,6785,2595,7013,4992,6036,7063,2485,5797,4393,7058,6960,2480,5285,6262,4361,6308,2694,6070,4666,6307,6145,2689,6725,6070,4682,4633,1065,4361,5251,4675,4791,1063,5797,4724,4791,5251,579,6725,4152,4633,5161,586,6469,6150,5752,4155,1547,5637,4245,4458,4907,97,5637,4245,4458,5960,97,6022,4634,4155,5643,104,6469,4518,5910,6066,370,4907,5961,4360,5912,377,5029,6998,5960,4955,810,6405,4634,4944,4996,1332,6405,5428,6070,4996,848,5029,6998,4361,4906,859,5797,5961,4473,4360,1816,4518,4992,6066,4466,1814,7269,7258,6084,7291,7316,7193,7201,7330,3254,7284,7351,7211,4553,7186,7177,7216,7299,3144,7333,7274,7218,7299,7240,7252,7286,7351,3115,6853,7224,7203,7330,7237,7316,7193,7169,3200,7269,6597,7350,7227,7171,7296,6084,7288,3220,5829,7274,7317,7177,7216,7347,7211,7186,3233,7317,7274,7184,7329,7240,7286,7303,7252,3081,7194,6086,7169,7296,7288,7350,7227,7203,3234,7269,7334,7257,4546,7346,6084,7291,7316,3098,7211,4553,7186,7241,7284,7303,7176,7216,3251,7333,7252,7286,7240,7210,7218,7347,7275,3207,7237,4810,7300,7224,7203,7257,7194,7169,3216,7269,7171,7312,7257,7350,6084,7291,7300,3128,7333,7254,7177,7216,7347,7275,7210,7186,3217,7333,7274,7252,7286,7303,7176,4553,7184,3145,7334,6086,7194,7169,7296,7224,7203,7346,3195,6853,7334,7316,7193,7201,7346,7291,7271,3141,7211,4553,7241,7284,7351,7218,7299,7176,3088,7333,7254,7210,7218,7299,7240,7284,7351,3179,6853,4810,7237,7300,7224,7171,7312,7193,3105,7237,7350,7227,7171,7312,7257,7300,7288,3175,5829,7210,5067,7275,7317,7177,7184,7329,3122,5829,7274,7317,7284,6088,7176,7184,7329,3145,7334,7296,7288,7271,7194,7201,7346,7227,3075,6757,5145,4530,6068,1201,5963,4425,4785,4532,2096,4773,5253,7030,6194,1410,6693,4664,5208,5416,25,6501,5008,7011,5779,1924,5781,4394,4243,6966,918,5269,5994,4362,6256,1952,6054,6016,4512,6768,946,5221,5209,4634,6834,7078,6070,5238,5537,2385,4228,5960,6327,7043,4787,4361,4400,4387,2308,5797,4907,7043,6260,6327,5494,5447,5810,2658,6469,4442,4152,4131,4609,6689,5401,6408,1176,5221,4992,6288,6532,5524,5703,7015,6019,2931,5797,6805,6561,4241,4882,4865,6962,4774,2854,5797,4361,6561,6805,5972,5989,6260,5264,2112,7078,4992,4984,5947,5755,6834,4514,4656,288,7066,2488,5158,36,4981,309,6054,4480,6017,2673,6978,4393,5266,1207,6709,5026,6227,1412,6501,5040,4278,105,5226,6474,4136,2091,6053,4489,4993,1978,5669,4928,5955,1313,6214,6410,6251,42,6037,4538,6025,945,4117,4662,5440,1891,4714,4137,4777,7010,5816,5224,5257,2057,6565,6025,6487,4521,6675,7075,6967,903,5125,5974,4117,4129,4896,4663,5671,1861,5226,6804,6404,5128,7040,6914,6834,2667,7077,4489,4408,5048,6327,5499,4442,405,5221,4438,5665,4657,4400,5123,5175,1607,6602,6854,6412,4140,4796,6347,6220,1132,7317,7354,7291,7255,6600,7224,7187,458,7189,4806,7201,5317,7286,6083,7171,3136,7238,7210,7316,7337,4800,7296,7352,3014,7333,6085,7354,7227,4553,5057,7305,2247,5829,4806,4668,5964,4988,4292,4124,348,5813,7040,5552,336,6022,4489,4390,1665,4762,6516,6034,882,5285,5050,5028,832,6517,6402,6439,1835,4458,6214,6241,2067,5994,6800,6048,880,6938,4416,4532,1867,4389,4741,4792,1112,5781,4662,5014,905,5270,4409,4969,1595,4773,6021,6181,2050,4678,4498,5161,56,6469,6170,4480,2954,5797,4393,7058,2203,5797,5961,4473,881,4666,6070,6307,2472,5797,4724,5931,36,5909,6066,4466,896,6586,6036,7063,2051,5126,4634,4155,1547,6405,4634,4944,1875,4933,6070,4996,309,6469,6022,4200,608,4678,4996,4930,400,6725,5288,6315,25,5813,5561,4394,2488,5269,4458,5655,1811,6022,5770,6793,571,5285,7030,6722,576,5909,4480,6167,2851,6586,5040,4281,1924,4518,4448,4196,946,6709,4666,5431,25,7013,6995,4945,1924,4197,6405,5634,1924,6214,6472,6528,6401,6243,4962,4402,259,6837,4441,4517,4496,5556,5304,4168,148,5765,4714,5513,4517,4790,5816,4769,345,6565,6710,6426,6675,6484,5687,5223,1110,4714,5944,4987,6025,5042,6038,5786,694,4261,7018,5957,5974,5440,5995,6658,2978,4117,4354,4611,4667,4184,6231,7047,2872,5050,6020,4987,5944,5024,4265,5129,1152,7018,7074,6756,6947,6721,4416,4880,801,6565,4896,4129,4663,4121,4730,6773,2330,4453,5206,5223,5240,5659,6931,6323,2171,4709,6153,6292,6402,6215,6437,5974,1861,6470,4882,4115,5665,6147,6497,5272,2312,6469,4442,4228,6404,7040,4528,6833,405,5797,4501,6677,6289,4737,7042,6950,678,5797,5988,5446,4980,6452,4409,4506,2394,4774,6950,6562,6070,5010,6291,6199,951,5797,6954,5818,4139,5972,5899,5127,1893,6949,6027,5048,5499,4152,4434,4384,560,6474,5264,6208,4992,6052,7079,7027,1923,7078,4400,4657,5123,6689,6979,5707,2858,6805,4506,5977,4634,4217,4976,4866,18,5221,5048,6027,4408,5755,5144,5396,1142,6469,5989,5972,4711,6183,4136,4233,2121,4806,7193,4544,5058,6156,6339,6476,1132,6853,4508,5321,5212,6844,4296,7052,448,7333,5484,4780,5820,7052,4553,6300,705,7333,6854,5317,5831,4988,4553,4412,2500,4810,7350,5052,6028,5756,6300,6572,962,7333,5452,5996,6854,5132,7106,4140,1995,7189,4668,4124,6339,6156,7111,5500,715,7354,7224,6084,7111,7300,7312,7337,960,5834,4546,7171,4811,7227,7232,7268,2753,6853,7193,4546,5056,4297,7223,7285,714,7237,6086,6028,7107,5835,4412,5404,1224,7237,7206,6220,6412,5532,4140,6086,2247,5228,6412,6220,5056,5004,4546,5676,2497,7237,4297,5320,5532,7052,4524,6844,448,5829,5804,5577,4554,6300,4796,7052,705,5829,5804,6492,6684,4412,7284,4988,2500,5834,4811,6076,6086,6572,5004,6300,962,5829,5578,7110,6850,4140,5964,5132,1995,6085,7227,6343,4156,4296,4636,4444,715,6602,7296,7316,6343,7239,7107,7354,960,4810,7350,7203,7107,7268,7169,7232,2753,6597,7194,4544,7312,7285,5058,7223,714,7269,6084,7111,7020,5404,6339,4412,1224,7269,6084,6476,6597,4716,6156,4140,2247,6469,4634,6070,896,6757,4496,6947,1924,7013,7001,4634,4992,6036,2967,6469,6070,6170,6145,6712,2595,6469,4634,4278,4155,5760,1656,6469,4518,4152,4466,6066,359,6725,6070,4992,5161,4633,1186,6757,6036,4503,5042,6167,2049,6405,4634,4933,6070,4944,900,4197,5520,4518,6020,6947,22,7013,4954,6020,4121,6995,2595,6757,4496,4930,4996,5234,1970,6757,6020,4281,4155,6953,537,6725,6310,4496,5042,5288,1656,7269,7257,4634,5321,4296,7288,7239,7227,5835,3075,6469,7334,5056,4546,7346,7227,7296,7288,6086,3098,7269,7334,6597,4524,7201,7346,6084,7111,7316,2051,6469,4810,7350,7227,7203,7194,7169,7288,4296,3175,7269,6764,6084,5532,6476,6028,6156,4524,4544,946,6469,7334,6076,6339,7203,7346,7271,7169,6849,3200,7269,7258,7350,4810,6084,7291,7193,5321,7201,56,6853,7334,7237,6086,7316,7193,7346,4546,7291,896,6757,7227,6084,6343,6156,4156,6956,7193,4636,2380,6853,7237,6070,4296,5321,7193,7169,7224,7203,714,6757,4508,4544,5058,5004,6156,6476,6076,6084,2860,6853,6764,7193,6476,5212,5756,6156,6343,4124,2851,7269,5834,4811,5532,4636,4524,4156,4297,5052,1924,7237,6086,7257,4634,7300,7288,7350,7227,7312,960,7269,6597,4634,7224,6084,7111,7300,7171,7312,3254,7237,5834,4297,5320,5532,4124,4524,5756,6028,571,7269,4810,5058,5532,4544,4524,5052,7020,6412,1924,6597,4810,7237,6070,6849,7169,7312,7300,7203,2243,6757,5320,4297,4156,5004,5244,6076,4636,4811,412,6853,5572,6070,7193,4546,5056,7312,7330,7300,3128,6853,7020,7193,6700,4636,6412,4156,7107,5724,1924,6853,5834,4811,5212,5756,6076,4668,5004,5320,25,7269,5548,6084,6076,7020,6700,5004,5058,6220,400,6853,7020,5212,7288,7107,5756,6220,6700,4668,25,7269,7258,7312,7171,7224,7300,7239,7291,7350,7330,7201,3097,6853,6764,5004,4668,6956,5212,6076,5756,6476,4508,4124,2060,7269,7334,7346,7257,7201,7194,7316,7239,7288,7296,7171,3131,7237,7020,5532,4524,4124,6412,6220,6028,5756,5052,4668,2604,6757,6020,7047,6323,6148,4244,4496,4880,4627,2851,6469,4442,6070,4992,4866,4114,6408,5272,6481,2593,6757,6565,6801,6694,4790,5042,4402,4145,6401,1924,6469,7078,4992,6199,5047,4656,4384,4634,4779,1659,5221,7078,5401,4634,4779,5537,5524,5238,6070,2051,6757,5042,6323,5492,7047,7010,5794,5974,6215,400,5221,5209,4634,4992,4233,6217,6019,7027,6070,1892,6757,4496,6801,6565,6464,5248,6020,5492,5749,946,6757,4992,4633,6466,5298,1972,6709,5508,6070,4496,4666,901,6501,4634,6915,7008,5776,1924,6469,6054,5042,4120,4472,423]);var e0=Ct;var Rt=[[0,0,0],[0,1,0],[0,1,1],[0,0,1],[1,0,0],[1,1,0],[1,1,1],[1,0,1]],Wt=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],W0=class{constructor(){this.table=e0,this.f_test_results=new Int32Array(6)}signbf(c){return c<0}face_tests(c){let o=this.v,x=this.f_test_results;return x.fill(0),c&128?(x[0]=(c&204)===132?o[0]*o[5]<o[1]*o[4]?-1:1:0,x[3]=(c&153)===129?o[0]*o[7]<o[3]*o[4]?-1:1:0,x[4]=(c&240)===160?o[0]*o[2]<o[1]*o[3]?-1:1:0):(x[0]=(c&204)===72?o[0]*o[5]<o[1]*o[4]?1:-1:0,x[3]=(c&153)===24?o[0]*o[7]<o[3]*o[4]?1:-1:0,x[4]=(c&240)===80?o[0]*o[2]<o[1]*o[3]?1:-1:0),c&2?(x[1]=(c&102)===66?o[1]*o[6]<o[2]*o[5]?-1:1:0,x[2]=(c&51)===18?o[3]*o[6]<o[2]*o[7]?-1:1:0,x[5]=(c&15)===10?o[4]*o[6]<o[5]*o[7]?-1:1:0):(x[1]=(c&102)===36?o[1]*o[6]<o[2]*o[5]?1:-1:0,x[2]=(c&51)===33?o[3]*o[6]<o[2]*o[7]?1:-1:0,x[5]=(c&15)===5?o[4]*o[6]<o[5]*o[7]?1:-1:0),x[0]+x[1]+x[2]+x[3]+x[4]+x[5]}face_test1(c){let o=this.v;switch(c){case 0:return o[0]*o[5]<o[1]*o[4]?72:132;case 1:return o[1]*o[6]<o[2]*o[5]?36:66;case 2:return o[3]*o[6]<o[2]*o[7]?33:18;case 3:return o[0]*o[7]<o[3]*o[4]?24:129;case 4:return o[0]*o[2]<o[1]*o[3]?80:160;default:return o[4]*o[6]<o[5]*o[7]?5:10}}interior_test(c,o){let x=this.v,a=1e-9,e=x[4]-x[0],f=x[5]-x[1],M=x[6]-x[2],r=x[7]-x[3],n=e*M-f*r;if(this.signbf(n)){if(c&1)return 0}else if(!(c&1)||Math.abs(n)<a)return 0;let l=.5*(x[3]*f+x[1]*r-x[2]*e-x[0]*M)/n;if(l<=a||l>=1-a)return 0;let b=x[0]+e*l,s=x[1]+f*l,h=x[2]+M*l,A=x[3]+r*l,j=h*b,g=A*s;if(c&1){if(j<g&&!this.signbf(g))return(this.signbf(s)===this.signbf(x[c]))+o}else if(j>g&&!this.signbf(j))return(this.signbf(b)===this.signbf(x[c]))+o;return 0}pattern(c){let o=this.table,x=(c&128)!==0,a=x?c^255:c,e=o[a];if(e===void 0)throw new Error(`MC33 lookup miss: ${a}`);let f=(e&2048)!==0,M=x?!f:f,r=M?c:c^255,n=e&2047,l=e>>>12,b;switch(l){case 0:b=n;break;case 1:b=r&this.face_test1(n>>2)?183+(n<<1):159+n;break;case 2:b=this.interior_test(n,0)?239+6*n:231+(n<<1);break;case 3:r&this.face_test1(n%6)?b=575+5*n:b=this.interior_test(Math.floor(n/6),0)?407+7*n:335+3*n;break;case 4:{let s=this.face_tests(r);s===-3?b=695+3*n:s===-1?b=(this.f_test_results[4]+this.f_test_results[5]<0?this.f_test_results[0]+this.f_test_results[2]<0?759:799:719)+5*n:s===1?b=(this.f_test_results[4]+this.f_test_results[5]<0?983:this.f_test_results[0]+this.f_test_results[2]<0?839:911)+9*n:b=this.interior_test(n>>1,0)?1095+9*n:1055+5*n;break}case 5:{let s=this.face_tests(r);s===-2?b=(n&2?this.interior_test(0,0):this.interior_test(0,0)||this.interior_test(n?1:3,0))?1213+(n<<3):1189+(n<<2):s===0?b=(this.f_test_results[2+n]<0?1261:1285)+(n<<3):b=(n&2?this.interior_test(1,0):this.interior_test(2,0)||this.interior_test(n?3:1,0))?1237+(n<<3):1201+(n<<2);break}case 6:{let s=this.face_tests(r);s===-2?b=this.interior_test(14287116>>(n<<1)&3,0)?1453+(n<<3):1357+(n<<2):s===0?b=(this.f_test_results[n>>1]<0?1645:1741)+(n<<3):b=this.interior_test(10991589>>(n<<1)&3,0)?1549+(n<<3):1405+(n<<2);break}default:{let s=Math.abs(this.face_tests(r));if(s===0){let h=(this.f_test_results[1]<0)<<1|this.f_test_results[5]<0;if(this.f_test_results[0]*this.f_test_results[1]===this.f_test_results[5])b=2157+12*h;else{let A=this.interior_test(h,1);b=2285+(A?10*h-40*A:6*h)}}else if(s===2)b=1917+10*((this.f_test_results[0]<0?this.f_test_results[2]>0:12+(this.f_test_results[2]<0))+(this.f_test_results[1]<0?this.f_test_results[3]<0:6+(this.f_test_results[3]>0))),this.f_test_results[4]>0&&(b+=30);else if(s===4){let h=21+11*this.f_test_results[0]+4*this.f_test_results[1]+3*this.f_test_results[2]+2*this.f_test_results[3]+this.f_test_results[4];h>>4&&(h-=h&32?20:10),b=1845+3*h}else b=1839+2*this.f_test_results[0]}}return{offset:b+1,reverse:M}}triangles(c,o,x){if(this.v=c,o===0||o===255)return 0;let a=this.pattern(o),e=0;for(let f=a.offset;f<e0.length;f++){let M=e0[f],r=M&15,n=M>>4&15,l=M>>8&15;if(r<=12&&n<=12&&l<=12&&r!==n&&n!==l&&r!==l){if(e+3>x.length)throw new Error("MC33 cell exceeds output capacity");x[e++]=r,x[e++]=a.reverse?l:n,x[e++]=a.reverse?n:l}if(!(M&4096))return e}throw new Error("MC33 pattern exceeds lookup table")}},Bt={name:"MC33",corners:Rt,edges:Wt,maxVertices:36,table:e0,cornerBit:t=>128>>t,createPolygonizer(){let t=new W0;return t.triangles.bind(t)}};var tt=Bt;function B0(t={type:"cartesian"}){if(t.type==="cartesian")return(e,f,M)=>[e,f,M];if(t.type!=="spherical"&&t.type!=="cube-sphere")throw new Error(`Unknown coordinates: ${t.type}`);let c=t.radius||[.02,.7],o=t.center||[.5,.5,.5];if(c.length!==2||!c.every(Number.isFinite)||c[0]<0||c[1]<=c[0])throw new Error("Radius must be an increasing, nonnegative pair");if(o.length!==3||!o.every(Number.isFinite))throw new Error("Center must contain three finite coordinates");if(t.type==="cube-sphere"){if(!Number.isInteger(t.face)||t.face<0||t.face>5)throw new Error("Cube-sphere face must be 0..5");return(e,f,M)=>{let r=2*e-1,n=2*f-1,b=[[1,n,-r],[-1,n,r],[r,1,-n],[r,-1,n],[r,n,1],[-r,n,-1]][t.face],h=(c[0]+M*(c[1]-c[0]))/Math.hypot(...b);return b.map((A,j)=>o[j]+A*h)}}let x=t.longitude||[-Math.PI,Math.PI],a=t.latitude||[-Math.PI/2,Math.PI/2];for(let e of[x,a])if(e.length!==2||!e.every(Number.isFinite)||e[1]<=e[0])throw new Error("Angular ranges must be increasing finite pairs in radians");if(a[0]<-Math.PI/2||a[1]>Math.PI/2||x[1]-x[0]>2*Math.PI+1e-9)throw new Error("Latitude must be within \\xB1pi/2 and longitude span at most 2*pi");return(e,f,M)=>{let r=x[0]+e*(x[1]-x[0]),n=a[0]+f*(a[1]-a[0]),l=c[0]+M*(c[1]-c[0]),b=l*Math.cos(n);return Math.abs(Math.cos(n))<1e-15?[o[0],o[1]+l*Math.sin(n),o[2]]:[o[0]+b*Math.cos(r),o[1]+l*Math.sin(n),o[2]+b*Math.sin(r)]}}function xt(t,c){if(!c||c.type==="cartesian")return t;let o=B0(c);for(let x=0;x<t.length;x+=3){let a=o(t[x],t[x+1],t[x+2]);t[x]=a[0],t[x+1]=a[1],t[x+2]=a[2]}return t}var zt={bourke:v0,mc33:tt};function jt(t,c,o,x){let a=zt[x];if(!a)throw new Error(`Unknown marching cubes algorithm: ${x}`);if(!["x","y","z"].every(e=>Number.isInteger(c[e])&&c[e]>=2))throw new Error("Grid dimensions must be integers of at least 2");if(!(t instanceof Float32Array)||t.length!==c.x*c.y*c.z)throw new Error("Expected a Float32Array with x*y*z samples, indexed as (z*y + y)*x + x");if(!Number.isFinite(o))throw new Error("Isolevel must be finite");for(let e of t)if(!Number.isFinite(e)||!Number.isFinite(Math.fround(e-o)))throw new Error("Field samples and their differences from the isolevel must be finite f32 values");return a}function ct(t,c,o=0,x="bourke",a={}){o=Math.fround(o),a.coordinates&&B0(a.coordinates);let e=jt(t,c,o,x),{x:f,y:M,z:r}=c,n=e.createPolygonizer(),l=new Float32Array(8),b=new Uint8Array(e.maxVertices),s=new Float32Array(39),h=new Float32Array(65536),A=0;for(let j=0;j<r-1;j++)for(let g=0;g<M-1;g++)for(let B=0;B<f-1;B++){let u=0;for(let W=0;W<8;W++){let P=e.corners[W];l[W]=t[((j+P[2])*M+g+P[1])*f+B+P[0]]-o,l[W]<0&&(u|=e.cornerBit(W))}if(u===0||u===255)continue;let I=n(l,u,b);if(A+I*3>h.length){let W=new Float32Array(Math.max(h.length*2,A+I*3));W.set(h),h=W}for(let W=0;W<12;W++){let[P,F]=e.edges[W];if(l[P]<0==l[F]<0)continue;let m=l[P]-l[F],U=Math.abs(m)<1e-9?.5:Math.max(0,Math.min(1,l[P]/m)),E=e.corners[P],i=e.corners[F];s[W*3]=(B+E[0]+U*(i[0]-E[0]))/(f-1),s[W*3+1]=(g+E[1]+U*(i[1]-E[1]))/(M-1),s[W*3+2]=(j+E[2]+U*(i[2]-E[2]))/(r-1)}s[36]=(B+.5)/(f-1),s[37]=(g+.5)/(M-1),s[38]=(j+.5)/(r-1);for(let W=0;W<I;W++){let P=b[W]*3;h[A++]=s[P],h[A++]=s[P+1],h[A++]=s[P+2]}}return xt(h.slice(0,A),a.coordinates)}var Ut=2*Math.PI;function Ht(t,c){return[Math.sin(t)*Math.cos(c),Math.cos(t),Math.sin(t)*Math.sin(c)]}var m0=(t,c)=>t[0]*c[0]+t[1]*c[1]+t[2]*c[2];function G1(t,c,o,x){let{bend:a,twist:e,thickness:f,peak:M,portals:r}=x,n=o-a*t*t+e*t*c,l=M-.17*t-.13*Math.cos(4.1*t+e),b=Math.hypot(t*.87+.08*c,(c-.15)/l,n/f)-1,s=Math.hypot((Math.abs(t)-.83-.11*c)/.34,(c+.28)/.68,(n+.06*t)/(f*1.48))-1,h=Math.max(0,.2-Math.abs(b-s)),A=Math.min(b,s)-1.25*h*h,j=.034*Math.sin(19*c+2.3*t+2.1*n)+.025*Math.sin(12*t+7.3*n+5*c)*Math.cos(10*c-3*n),g=1/0;for(let{at:B,width:u,height:I,lean:W}of r){let P=(t-B-W*c-.05*o)/u,F=Math.max(0,c+.08+.05*o)/I;g=Math.min(g,Math.hypot(P,F)-1)}return Math.max(A+j,-g+.37*j)}function Xt(t){let c={x:55,y:45,z:29},o=[-1.39,-1.05,-.88],x=[1.39,1.6,.88],a=x.map((r,n)=>(r-o[n])/([c.x,c.y,c.z][n]-1)),e=new Float32Array(c.x*c.y*c.z);for(let r=0;r<c.z;r++)for(let n=0;n<c.y;n++)for(let l=0;l<c.x;l++)e[(r*c.y+n)*c.x+l]=G1(o[0]+l*a[0],o[1]+n*a[1],o[2]+r*a[2],t);let f=ct(e,c,0,"mc33"),M=new Float32Array(f.length*2);for(let r=0;r<f.length;r+=3){let n=o[0]+f[r]*(x[0]-o[0]),l=o[1]+f[r+1]*(x[1]-o[1]),b=o[2]+f[r+2]*(x[2]-o[2]),s=.004;M.set([n,l,b,G1(n+s,l,b,t)-G1(n-s,l,b,t),G1(n,l+s,b,t)-G1(n,l-s,b,t),G1(n,l,b+s,t)-G1(n,l,b-s,t)],r*2)}return M}function ot(t,c,o,x,a,e){if(c<513||x<.38)return;let f=c-1,M=Object.values(a).flat().map(({target:g})=>g),r=(g,B)=>t[Math.round(B)*c+(Math.round(g)%f+f)%f],n=[];for(let g=12;g<f;g+=19)for(let B=1;B<f;B+=19)n.push(r(B,g));n.sort((g,B)=>g-B);let l=n[Math.floor(.77*n.length)],b=Math.imul(o^o>>>17,2654435761)^1126074651,s=()=>(b=Math.imul(b,1664525)+1013904223>>>0,b/4294967296),h=[];for(let g=0;g<19;g++)for(let B=0;B<33;B++){let u=(B+s())*f/33,I=(.22+.56*(g+s())/19)*f,W=r(u,I);if(W<l-.18)continue;let P=Math.PI*I/f,F=Ut*u/f,m=Ht(P,F),U=m0(m,[.54,.45,.71]);if(U<.25||M.some(k=>m0(k,m)>.998))continue;let[,E,i,d]=z1({regions:e},m),_=r(u+2,I)-r(u-2,I),R=r(u,I+4)-r(u,I-4),C=Math.hypot(_,R),z=.8*U+.56*E+.32*i+.24*d-.51*Math.abs(W-l-.21)-.38*Math.abs(C-.31)+.22*s();h.push({dir:m,theta:P,phi:F,dx:_,dy:R,canyon:E,volcanic:d,score:z})}let A=[];for(let g of h.sort((B,u)=>u.score-B.score))if(!A.some(B=>m0(B.dir,g.dir)>.94)&&(A.push(g),A.length===2))break;if(!A.length)return;let j=A.map(({dir:g,theta:B,phi:u,dx:I,dy:W,canyon:P,volcanic:F})=>{let m=[-Math.sin(u),0,Math.cos(u)],U=[Math.cos(B)*Math.cos(u),-Math.sin(B),Math.cos(B)*Math.sin(u)],E=Math.atan2(W,I)+Math.PI/2+(s()-.5)*1.55,i=m.map((Y,V)=>Y*Math.cos(E)+U[V]*Math.sin(E)),d=m.map((Y,V)=>-Y*Math.sin(E)+U[V]*Math.cos(E)),_=240+250*s(),R=.64+.45*s(),C={bend:.25*(s()-.5),twist:.35*(s()-.5),thickness:.23+.13*s(),peak:.79+.2*s(),portals:[]};s()<.39?C.portals.push({at:-.41,width:.24+.1*s(),height:.4+.14*s(),lean:-.11},{at:.34,width:.29+.1*s(),height:.49+.13*s(),lean:.13}):C.portals.push({at:(s()-.5)*.24,width:.52+.17*s(),height:.49+.14*s(),lean:(s()-.5)*.36});let z=m0(d,[.54,.45,.71])>=0?1:-1,k=g.map((Y,V)=>Y+(d[V]*z*_*3.6+i[V]*_*.78)/262144),J=Math.hypot(...k);return{direction:g,span:i,depth:d,size:_,rise:R,tint:Math.min(1,.24+.59*P-.2*F+.27*s()),site:{target:g,overlook:k.map(Y=>Y/J)},vertices:Xt(C)}});return a.arches=j.map(({site:g})=>g),j}function nt(t){let c=f=>j1(f,0,0,t)/4294967296,o=c(47);if(o>=.55)return[0,0,0,0];if(o>=.3)return[0,0,0,1.18+.42*c(37)];let x=.48*(c(21)-.5),a=.48*(c(23)-.5),e=Math.hypot(x,1,a);return[x/e,1/e,a/e,.65+.48*c(37)]}function at(t,c,o,x,a){if(a[3]===0)return-1/0;let e=Math.abs(t*a[0]+c*a[1]+o*a[2]),f=Math.sin(9*t+4*c-7*o+14*a[0]);return x-a[3]+1.08*e*e-.115*f}function st(t,c,o,x,a,e,f=!0,M=1,r,n=!1,l=0,b=!1){let s=n||a>0?P0(x,n):[];if(n){_0(t,c);let U=Math.min(c,257),E=l>=1?{side:U,values:new Float32Array(U**2)}:void 0,i=R=>Math.round(R*(c-1)/(U-1));if(E)for(let R=0;R<U;R++)for(let C=0;C<U;C++)E.values[R*U+C]=t[i(R)*c+i(C)];if(F0(t,c,x,a,M,!0,s,l),E)for(let R=0;R<U;R++)for(let C=0;C<U;C++){let z=R*U+C;E.values[z]=t[i(R)*c+i(C)]-E.values[z]}let d=b?{side:U,values:new Float32Array(U**2)}:void 0,_=d?A0(t,c,x,.87,d):[];return{values:t,glacialSites:_,glacialIce:d,impactMaterial:E,landmarks:{},impactBasins:s,ocean:{seed:x,datum:null}}}let h=f?A0(t,c,x,a):[],A=f?$0(t,c,x,a,h,e):{};F0(t,c,x,f?0:a,M,!1,s);let j=f&&r===void 0?null:N0(t,c,x,{coverage:r}),g=f?null:nt(x),B=Math.min(c,257),u=f?null:{side:B,values:new Float32Array(B**2)},I=!f&&e&&a>0?{seed:x,variation:a,regions:e,sites:[]}:null;if(Lt(t,c,o==="volcanic"?.84:1.32,j,g,u,I,!f&&{seed:x,geology:o,regions:e}),X0(t,c,o==="alpine"?.94:.74),j!==null&&Y0(t,c,j,r===void 0?void 0:o),_0(t,c),!f)return{values:t,glacialSites:h,landmarks:A,impactBasins:s,alluvium:u,invertedRidges:I?.sites,ocean:{seed:x,datum:j}};let P=D0(t,c,x,a,h,A,e),F=J0(t,c,x,a,h,A,e),m=ot(t,c,x,a,A,e);return{values:t,glacialSites:h,landmarks:A,impactBasins:s,springs:P,dunes:F,rockSpans:m,ocean:r===void 0?void 0:{seed:x,datum:j}}}function Lt(t,c,o=1,x=null,a=null,e=null,f=null,M=null){let r=c-1,n=Math.min(256,Math.floor(r/3.5));if(n<12)return t;let l=n*(n-1),b=r/n,s=new Float32Array(l),h=Float32Array.from({length:n+1},(p,w)=>Math.sin(Math.PI*w/n)),A=(p,w)=>(p+w)%w,j=(p,w)=>t[Math.round(w)*c+A(Math.round(p),r)];for(let p=1;p<n;p++)for(let w=0;w<n;w++){let q=w*b,y=p*b,N=b*.48;s[(p-1)*n+w]=.4*j(q,y)+.15*(j(q-N,y)+j(q+N,y)+j(q,y-N)+j(q,y+N))}let B=s.slice().sort()[Math.floor(l*.2)],u=new Float32Array(l).fill(1/0),I=new Int32Array(l).fill(-1),W=new Uint32Array(l),P=new Uint32Array(l).fill(l),F=new Float32Array(l),m=new Uint32Array(l),U=0;function E(p){let w=U++;for(;w;){let q=w-1>>1;if(u[m[q]]<=u[p])break;m[w]=m[q],w=q}m[w]=p}function i(){let p=m[0],w=m[--U],q=0;for(;q*2+1<U;){let y=q*2+1;if(y+1<U&&u[m[y+1]]<u[m[y]]&&y++,u[w]<=u[m[y]])break;m[q]=m[y],q=y}return m[q]=w,p}for(let p=0;p<l;p++)s[p]<=B&&(u[p]=s[p],E(p));for(let p=0;U;p++){let w=i(),q=w%n,y=Math.floor(w/n)+1,N=h[y],O=Math.max(.08,2*N),$=1/Math.hypot(O,1);W[p]=w,P[w]=p,F[w]=N;let Z=0;for(let S=-1;S<=1;S++){let H=y+S;if(!(H<1||H>=n))for(let X=-1;X<=1;X++){if(!X&&!S)continue;let L=(H-1)*n+A(q+X,n);if(u[L]===1/0)u[L]=Math.max(s[L],u[w]+2e-5),I[L]=w,E(L);else if(P[L]<p){let t1=(u[w]-u[L])*(S?X?$:1:1/O);t1>Z&&(Z=t1,I[w]=L)}}}}let d=e&&new Float32Array(l),_=e&&new Float32Array(l),R=(1e3/n)**2;for(let p=l-1;p>=0;p--){let w=W[p],q=I[w];if(q<0)continue;let y=F[w];F[q]+=y,_&&(_[q]=Math.max(_[q],Math.min(d[q],y)),d[q]=Math.max(d[q],y))}if(_){let p=106.63474115247546/R;for(let w=0;w<l;w++){let q=_[w];if(q<=p){_[w]=0;continue}let y=Math.min(1,(Math.log2(1+q*R)-6.75)/4.6),N=Math.min(1,q/Math.max(1,d[w]*.58));_[w]=y*N}}let C=new Float32Array(c*c),z=x===null&&!e?null:new Float32Array(c*c),k=a&&a[3]!==0&&new Float32Array(l),J=f&&new Float32Array(l),Y=M&&(M.regions||M.geology==="mesa")&&new Float32Array(l),V=Y&&new Float32Array(l),G=Y&&new Float32Array(l),v=f&&new Float32Array(c*c),x1=[];if(k||J||Y){let p=Float64Array.from({length:n},(O,$)=>Math.cos(2*Math.PI*$/n)),w=Float64Array.from({length:n},(O,$)=>Math.sin(2*Math.PI*$/n)),q=f?j1(53,0,0,f.seed)*(2*Math.PI/4294967296):0,y=Y?j1(61,0,0,M.seed)*(2*Math.PI/4294967296):0,N=Math.min(1,n/160);for(let O=1;O<n;O++){let $=h[O],Z=Math.cos(Math.PI*O/n);for(let S=0;S<n;S++){let H=(O-1)*n+S,X=s[H],L=$*p[S],t1=$*w[S];if(k){let s1=at(L,Z,t1,X,a),e1=Math.max(0,Math.min(1,(s1-.015)/.48)),K=Math.max(0,Math.min(1,(X-B-.16)/.54));k[H]=e1*e1*(3-2*e1)*K}let c1=J&&$>.19&&X>(x??B)+.12,n1=Y||c1?z1(M||f,[L,Z,t1],M?.geology):null;if(Y){let s1=x===null?1:Math.max(0,Math.min(1,(X-x-.02)/.22)),e1=Math.max(0,(n1[1]-.18)/.82)*(1-(k?.[H]??0));Y[H]=e1;let K=e1*s1*t0(O,n)*b;if(K>0){let o1=N*(35*L-52*Z+28*t1)+y,r1=N*(-67*L+21*Z+49*t1)-y;V[H]=K*(1.36*Math.sin(o1)+.38*Math.sin(r1))/Math.max(.5,2*$),G[H]=K*(.76*Math.cos(r1)+.29*Math.cos(o1))}}if(c1){let[,s1,e1,K]=n1,o1=.45*s1+.27*e1+.91*K,r1=.69*Math.sin(9*L+3*Z-7*t1+q)+.31*Math.cos(15*L-8*Z+9*t1-q),f1=Math.max(0,Math.min(1,(r1-.1)/.73)),l1=Math.max(0,Math.min(1,(o1-.26)/.57));J[H]=f.variation*l1*f1*f1*(1-.85*(k?.[H]??0))}}}}let T=p=>Math.max(0,Math.min(1,(Math.log2(1+F[p]*R)-6.45)/6.4+.17*(Y?.[p]??0))),D=(p,w)=>{let q=Math.min(1,Math.max(0,(s[p]-B+.12)/.36));return o*w*(.095+.24*w)*(.46+.54*q)*(1+.32*(Y?.[p]??0))},a1=(p,w)=>{let q=I[p];if(q<0||w<=.53)return 0;let y=Math.abs(s[p]-s[q])*n/256,N=(w-.53)/.47,O=Math.max(0,1-y/.065),$=x===null?1:Math.max(0,Math.min(1,(s[p]-x-.04)/.17));return N*O*O*$*(1-(k?.[p]??0))};for(let p=0;p<l;p++){let w=I[p];if(w<0)continue;let q=T(p);if(q<=0)continue;let y=T(w),N=Math.floor(p/n)+1,O=p%n*b+(V?.[p]??0),$=N*b+(G?.[p]??0),Z=(A(w%n-p%n+1,n)-1)*b+(V?.[w]??0)-(V?.[p]??0),S=(Math.floor(w/n)-N+1)*b+(G?.[w]??0)-(G?.[p]??0),H=Math.max(.35,2*h[N]),X=Z*H,L=Math.max(1e-6,X*X+S*S),t1=(k?.[p]??0)*q*q,c1=(k?.[w]??0)*y*y,n1=Y?.[p]??0,s1=Y?.[w]??0,e1=(_?.[p]??0)*(1-t1),K=(_?.[w]??0)*(1-c1),o1=(.43+1.44*q)*b*(1+.57*t1+.43*e1),r1=(.43+1.44*y)*b*(1+.57*c1+.43*K),f1=Math.max(o1,r1),l1=D(p,q)*(1+.72*t1),b1=D(w,y)*(1+.72*c1),u1=s[p]-l1,M1=Math.min(u1,s[w]-b1),m1=e?a1(p,q):0,F1=e?a1(w,y):0,d1=m1>0||F1>0,C1=q*q*(J?.[p]??0),U1=y*y*(J?.[w]??0),J1=Math.max(C1,U1)>.025;C1>.17&&U1>.17&&x1.push({x:p%n,y:N,score:(C1+U1)/2});let T1=x!==null&&q>.57&&s[p]>=x&&s[p]<x+.24&&s[w]<x&&s[w]>x-.2,Q1=0,$1=I[w];if(e&&q>.59&&$1>=0&&t1<.22&&(x===null||s[w]>x+.05)){let R1=s[p]-s[w],E1=Math.max(0,s[w]-s[$1]),Z1=Math.max(0,Math.min(1,(.76*R1-E1-.016)/.075));Q1=o*q*Z1*Math.min(.2,.73*R1)}let v1=Q1>.005,E0=0;if(v1){let R1=((A($1%n-w%n+1,n)-1)*b+(V?.[$1]??0)-(V?.[w]??0))*H,E1=(Math.floor($1/n)-Math.floor(w/n))*b+(G?.[$1]??0)-(G?.[w]??0);E0=(X*E1-S*R1)/Math.sqrt(L*Math.max(1e-6,R1**2+E1**2))}let d0=f1*(v1?2.04:T1?1.65:J1?1.35:1),X1=v1?3.3:T1?2.65:1,z0=d0/H,j0=T1||v1?Math.sqrt(L):0,et=Math.max(1,Math.floor(Math.min($,$+X1*S)-d0)),rt=Math.min(r-1,Math.ceil(Math.max($,$+X1*S)+d0)),it=Math.floor(Math.min(O,O+X1*Z)-z0),ht=Math.ceil(Math.max(O,O+X1*Z)+z0);for(let R1=et;R1<=rt;R1++){let E1=t0(R1,r),Z1=R1-$;for(let r0=it;r0<=ht;r0++){let i0=(r0-O)*H,q1=(i0*X+Z1*S)/L,W1=Math.min(1,Math.max(0,q1)),A1=R1*c+A(r0,r);if(T1&&q1>.2&&q1<X1){let p1=(q1-.2)/(X1-.2),w1=Math.abs(i0*S-Z1*X)/j0,B1=r1*(.52+p1),Y1=t[A1]-x;if(w1<B1&&Y1>-.19&&Y1<.034){let O1=w1/B1,f0=(1-O1)*Math.min(1,O1*4),y0=Math.min(.15,.034-Y1);z[A1]=Math.max(z[A1],y0*f0*4*p1*(1-p1)*q*E1)}}if(v1&&q1>.42&&q1<X1){let p1=(q1-.42)/(X1-.42),w1=(i0*S-Z1*X)/j0,B1=r1*(.48+1.27*p1),Y1=s[w]-.068*(q1-1),O1=Math.max(0,t[A1]-Y1);if(Math.abs(w1)<B1&&O1<.28){let f0=w1/B1,y0=1+.46*E0*f0,w0=Math.abs(f0),mt=(1-w0)**2*Math.min(1,5*w0),dt=Math.min(1,.28+8*Math.abs(w0-.58*p1)),pt=mt*dt*4*p1*(1-p1),gt=Q1*pt*y0*(1-O1/.28)*E1;z[A1]=Math.max(z[A1],gt)}}let lt=o1+W1*(r1-o1),k1=Math.hypot(i0-W1*X,Z1-W1*S)/lt;if(J1&&k1<1.35){let p1=(C1+W1*(U1-C1))*E1,w1=Math.max(0,Math.min(1,(.54-k1)/.3)),B1=Math.max(0,1-Math.abs(k1-.84)/.51);v[A1]=Math.max(v[A1],.35*p1*w1*w1*(3-2*w1)),C[A1]=Math.max(C[A1],.19*p1*B1*B1)}if(k1>=1)continue;let p0=l1+W1*(b1-l1),ft=e1+W1*(K-e1),U0=.27*(q+W1*(y-q))**2+.19*ft,h0=1-Math.max(0,(k1-U0)/(1-U0));if(n1>0||s1>0){let p1=n1+W1*(s1-n1),w1=Math.max(0,Math.min(1,(k1-.19)/.59)),B1=1-w1*w1*(3-2*w1);h0+=.77*p1*(B1-h0)}let bt=t1+W1*(c1-t1),g0=k1*k1,Mt=1-g0*g0*(3-2*g0),ut=h0+bt*(Mt-h0),H0=u1+W1*(M1-u1),l0=Math.min(1.65*p0,Math.max(.4*p0,t[A1]-H0))*E1*ut;if(d1&&k1>.28&&k1<.94){let p1=Math.min(1,(k1-.28)/.21,(.94-k1)/.22),w1=p1*p1*(3-2*p1)*(m1+W1*(F1-m1)),Y1=(H0+p0*(.24+.18*k1)-(t[A1]-l0))*w1,O1=Math.max(-.073*o,Math.min(.14*o,-Y1));l0=Math.max(0,l0+O1*E1)}C[A1]=Math.max(C[A1],l0)}}}let Q=e?(e.side-1)/r:0;for(let p=1;p<r;p++){let w=p*c;for(let q=0;q<r;q++){let y=w+q,N=z?.[y]??0,O=v?.[y]??0;if(t[y]+=N+O-C[y]*(1-.89*Math.min(1,O/.115)),e&&N>0){let $=Math.round(p*Q);if($===0||$===e.side-1)continue;let Z=Math.round(q*Q)%(e.side-1),S=$*e.side+Z,H=N*(1-.5*Math.min(1,C[y]/.24));e.values[S]=Math.max(e.values[S],Math.min(1,H*9))}}t[w+r]=t[w]}if(x1.length){x1.sort((p,w)=>w.score-p.score);for(let{x:p,y:w}of x1){let q=Math.PI*w/n,y=2*Math.PI*p/n,N=Math.sin(q),O=[N*Math.cos(y),Math.cos(q),N*Math.sin(y)];if(!f.sites.some($=>$[0]*O[0]+$[1]*O[1]+$[2]*O[2]>.998)&&(f.sites.push(O),f.sites.length>=48))break}}if(e)for(let p=1;p<e.side-1;p++){let w=p*e.side;e.values[w+e.side-1]=e.values[w]}return t}self.onmessage=({data:{values:t,side:c,settings:o}})=>{let{geology:x,seed:a,variation:e,regions:f,landmarkPatches:M,featureDensity:r,oceanCoverage:n,lunar:l,craterDetail:b,cryoGlaciers:s}=o,h=st(t,c,x,a,e,f,M,r,n,l,b,s),A=[h.values.buffer];h.alluvium&&A.push(h.alluvium.values.buffer),h.glacialIce&&A.push(h.glacialIce.values.buffer),h.impactMaterial&&A.push(h.impactMaterial.values.buffer),h.springs&&A.push(h.springs.values.buffer),h.dunes&&A.push(h.dunes.values.buffer);for(let j of h.rockSpans??[])A.push(j.vertices.buffer);self.postMessage(h,A)};;if(typeof import_meta !== \'undefined\')import_meta.url=location.origin+"/dist/";})();\n',Uo=URL.createObjectURL(new globalThis.Blob([Go],{type:"text/javascript"})),Pr=Uo;var Wt={mixed:0,alpine:1,mesa:2,volcanic:3};function na(i,e,t,a,r,o,s,c){let n=Oi(i,{reseedLayers:s}),l=e==="alpine"||e==="mixed",d=e==="alpine"?2.2:e==="volcanic"?1.36:1.75,u=l?.48:e==="mesa"?.43:.25,f=n.layers.map(({entryPoint:p,params:x},y)=>{let m={...Hi,...x};if(t&&p==="computeRidgedMultifractal4"){let h=1+(d-1)*r;m.scalar=h,m.transform=.36*(h-1)}else t&&(p==="computeFBM"&&(m.scalar*=.94),p==="computeFBM2"&&(m.scalar*=1-u*r),l&&p==="computeLanczosBillow"&&(m.scalar*=1-.52*r));let M=c?.layers[y];return M&&Object.assign(m,M.uniforms),m.zoom/=o,{entryPoint:M?.algorithm??p,layer:m,weights:M?.weights,blend:t&&y>0?a:0,phase:13.7*y+(i>>>0)%997*.13}});return{...n,layers:f,mountainRanges:l}}async function Oo(i,e,t){if(typeof Worker=="function"){let p;try{return p=new Worker(Pr),await new Promise((x,y)=>{p.onmessage=({data:m})=>x(m),p.onerror=y,p.onmessageerror=y,p.postMessage({values:i,side:e,settings:t})})}catch{}finally{p?.terminate()}}let{geology:a,seed:r,variation:o,regions:s,landmarkPatches:c,featureDensity:n,oceanCoverage:l,lunar:d,craterDetail:u,cryoGlaciers:f}=t;return Sr(i,e,a,r,o,s,c,n,l,d,u,f)}var Vo=Float32Array.from({length:31},(i,e)=>2**(Math.max(1,e)-25));function Nt(i){let e=i>>10&31,t=i&1023,a=i&32768?-1:1;return e===31?t?NaN:a*(1/0):a*Vo[e]*(t+(e?1024:0))}async function Dr(i,{seed:e=123456789,segments:t=1e3,reseedLayers:a,erosion:r=!1,geology:o="mixed",variation:s=.8,rangeWeight:c=1,landscape:n="natural",landscapeStrength:l=1,featureDensity:d=1,oceanCoverage:u,lunar:f=!1,craterDetail:p=0,cryoGlaciers:x=!1,landmarkPatches:y=!0,proceduralGuide:m=!1,noiseMix:M=null}={}){if(!Number.isInteger(t)||t<8||t>1536)throw new RangeError("Planet Studio noise needs 8\u20131536 segments.");if(!Number.isInteger(e))throw new RangeError("Use an integer noise seed.");if(!Number.isFinite(p)||p<0||p>2)throw new RangeError("Lunar crater detail must be between 0 and 2.");if(!Number.isFinite(d)||d<.0625||d>8)throw new RangeError("Feature density must be between 0.0625 and 8.");if(u!==void 0&&!(u>=0&&u<1&&Number.isFinite(u)))throw new RangeError("Ocean coverage must be at least 0 and less than 1.");if(!Object.hasOwn(Wt,o))throw new RangeError("Unknown planet geology.");if(!Object.hasOwn(St,n)||!Number.isFinite(l)||l<0||l>1)throw new RangeError("Use a valid planet landscape and strength from 0 to 1.");if(!Number.isFinite(s)||s<0||s>1||!Number.isFinite(c)||c<.35||c>1.35)throw new RangeError("Planet variation must be 0\u20131 and range weight 0.35\u20131.35.");let h=t+1,{sphereOffset:v,sphereOffset2:b,layers:z,mountainRanges:D}=na(e,o,r,s,c,d,a,M),_=ma(M,Wt[o]),{device:S}=i,k="planet-studio-height",g=r?["computeStudioSphereRelief","computeStudioSphereMountainErosion",...D&&s===0?[]:["computeStudioSphereErosion"]]:[],w;try{let q=function(V){let{texture:K}=i.getCurrentTextureResource(k),ae=S.createCommandEncoder();ae.copyTextureToBuffer({texture:K},{buffer:w,bytesPerRow:R,offset:Q*V},[h,h,1]),S.queue.submit([ae.finish()])},{messages:P}=await i.shaderModule.getCompilationInfo(),C=P.filter(V=>V.type==="error");if(C.length)throw new Error(C.map(V=>V.message).join(`
`));let B=async()=>{await i.prepareTexturePipelines(["clearTexture",...z.map(({entryPoint:V})=>V)]),await i.computeToTexture(h,h,{scalar:1,transform:0},{textureKey:k,noiseChoices:["clearTexture"]});for(let{entryPoint:V,layer:K,weights:ae,blend:A,phase:H}of z)i.buildPermTable(K.seed),await i.computeToTexture(h,h,K,{textureKey:k,useCustomPos:2,sphereOffset:v,sphereOffset2:b,spherePolarFade:r?.15:0,sphereBlend:A,sphereBlendPhase:H,sphereRegion:_,sphereRegionSeed:e,sphereLayerWeights:ae,noiseChoices:[V]})},W=await Promise.allSettled([B(),i.prepareTexturePipelines(g)]);for(let V of W)if(V.status==="rejected")throw V.reason;let R=Math.ceil(h*8/256)*256,Q=R*h;if(w=S.createBuffer({size:Q*(m?3:1),usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}),r){let V={seed:e,voroMode:Wt[o]},K={textureKey:k,sphereBlend:s,sphereRangeWeight:c,sphereLandscape:St[n],sphereLandscapeStrength:l,sphereFeatureDensity:d,sphereRegion:_,sphereRegionSeed:e};m&&(q(1),await i.computeToTexture(h,h,V,{...K,noiseChoices:g.slice(0,1)}),q(2)),await i.computeToTexture(h,h,V,{...K,noiseChoices:m?g.slice(1):g})}q(0),await w.mapAsync(GPUMapMode.READ);let E=new Uint16Array(w.getMappedRange()),N=h*h,O=R/2,Z=Q/2,Y=new Float32Array(N),X=m?new Float32Array(2*N):null;for(let V=0;V<h;V++){let K=V*O,ae=V*h;for(let A=0;A<h;A++){let H=Nt(E[K+A*4]);if(!Number.isFinite(H))throw new Error("Planet Studio noise produced a nonfinite height.");Y[ae+A]=H}if(X)for(let A=0;A<h;A++){let H=K+A*4;X[ae+A]=Nt(E[Z+H]),X[N+ae+A]=Nt(E[2*Z+H])}}let te;if(r){let V=Math.min(h,129),K=new Uint32Array(V**2),ae=t/(V-1);for(let A=0;A<V;A++){let H=Math.round(A*ae)*O;for(let T=0;T<V;T++){let G=H+Math.round(T*ae)*4,J=Math.round(Nt(E[G+1])*255),ee=Math.round(Nt(E[G+2])*255),oe=Math.round(Nt(E[G+3])*255);K[A*V+T]=1056964608|J|ee<<8|oe<<16}}te={side:V,values:K}}w.destroy(),w=null;let ie,F=r&&f?.46-.25*Math.min(1,p)**8-.13*Math.max(0,p-1):1;if(r){if(f)for(let ae=0;ae<Y.length;ae++)Y[ae]*=F;let{values:V,...K}=await Oo(Y,h,{geology:o,seed:e,variation:s,regions:te,landmarkPatches:y,featureDensity:d,oceanCoverage:u,lunar:f,craterDetail:p,cryoGlaciers:x});Y=V,ie=K}else{let V=Math.min(8,Math.floor(t/8));for(let K of[0,t])for(let ae=1;ae<=V;ae++){let A=Math.abs(K-ae)*h,H=0;for(let G=0;G<t;G++)H+=Y[A+G]/t;let T=.9*(1-ae/(V+1))**2;for(let G=0;G<h;G++)Y[A+G]+=(H-Y[A+G])*T}}let L=1/0,j=-1/0,I=0;for(let V of Y)L=Math.min(L,V),j=Math.max(j,V),I+=V;if(j-L<1e-7)throw new Error("Planet Studio noise produced a flat heightmap.");let $={side:h,values:Y,min:L,max:j,mean:I/Y.length,featureDensity:d};if(X){for(let V=0;V<N;V++)X[N+V]=Y[V]-X[N+V]*F;$.guide=X,$.hostRelief=F}return te?{...$,regions:te,...ie,reliefScale:pa(e)}:$}finally{w?.destroy(),i.destroyTexturePair(k)}}var bt=`@group(0) @binding(3) var<storage,read> studioHeights:array<f32>;

fn studio_uv(dir:vec3<f32>)->vec2<f32>{
  let h=length(dir.xz);
  var longitude=0.0;
  if(h>0.0){longitude=atan2(dir.z,dir.x)/6.283185307179586;}
  return vec2<f32>(fract(longitude),atan2(h,dir.y)/3.141592653589793);
}

// The last component interpolates sample curvature across texel boundaries.
fn studio_cubic(a:f32,b:f32,c:f32,d:f32,t:f32)->vec3<f32>{
  let p=.5*(c-a);
  let q=a-2.5*b+2.0*c-.5*d;
  let r=.5*(d-a)+1.5*(b-c);
  return vec3<f32>(b+t*(p+t*(q+t*r)),p+t*(2.0*q+t*3.0*r),mix(a-2.0*b+c,b-2.0*c+d,t));
}
// Blend toward a cubic B-spline when the guide needs low-pass filtering.
fn studio_curve(a:f32,b:f32,c:f32,d:f32,t:f32,smoothing:f32)->vec3<f32>{
  let cubic=studio_cubic(a,b,c,d,t);
  if(smoothing==0.0){return cubic;}
  let p=.5*(c-a);
  let q=.5*(a-2.0*b+c);
  let r=(d-a)/6.0+.5*(b-c);
  let spline=vec3<f32>((a+4.0*b+c)/6.0+t*(p+t*(q+t*r)),
    p+t*(2.0*q+3.0*t*r),2.0*q+6.0*t*r);
  return mix(cubic,spline,smoothing);
}
fn studio_row(pixel:vec2<i32>,t:f32,side:i32,offset:i32,smoothing:f32)->vec3<f32>{
  let columns=side-1;
  var y=pixel.y;
  var x=pixel.x;
  var fraction=t;
  if(y<0||y>columns){
    // Across a pole the meridian continues half a turn away.
    y=select(2*columns-y,-y,y<0);
    let across=f32(x)+t+f32(columns)*.5;
    x=i32(floor(across));
    fraction=fract(across);
  }
  let base=offset+y*side;
  x+=columns;
  return studio_curve(
    studioHeights[base+(x-1)%columns],studioHeights[base+x%columns],
    studioHeights[base+(x+1)%columns],studioHeights[base+(x+2)%columns],fraction,smoothing
  );
}
struct StudioNoise { height:f32, gradient:vec3<f32>, concavity:f32, uv:vec2<f32> }
fn studio_sample(dir:vec3<f32>,radius:f32,side:i32,offset:i32,uv:vec2<f32>,smoothing:f32)->StudioNoise{
  let segments=f32(side-1);
  let tau=6.283185307179586;
  let h=length(dir.xz);
  let p=uv*segments;
  let pixel=vec2<i32>(floor(p));
  let t=fract(p);
  let a=studio_row(pixel+vec2<i32>(0,-1),t.x,side,offset,smoothing);
  let b=studio_row(pixel,t.x,side,offset,smoothing);
  let c=studio_row(pixel+vec2<i32>(0,1),t.x,side,offset,smoothing);
  let d=studio_row(pixel+vec2<i32>(0,2),t.x,side,offset,smoothing);
  let value=studio_curve(a.x,b.x,c.x,d.x,t.y,smoothing);
  var gradient=vec3<f32>(0.0);
  if(h>1e-5){
    let du=studio_curve(a.y,b.y,c.y,d.y,t.y,smoothing).x;
    let tangentU=vec3<f32>(-dir.z,0,dir.x)/(tau*h*h);
    let tangentV=vec3<f32>(dir.x*dir.y/h,-h,dir.z*dir.y/h)/(tau*.5);
    gradient=(du*tangentU+value.y*tangentV)*segments/radius;
  }else{
    let ring=select(side-2,1,dir.y>0.0);
    let east=segments*.25;
    let west=segments*.75;
    let back=segments*.5;
    let x=studio_row(vec2<i32>(0,ring),0.0,side,offset,smoothing).x-
      studio_row(vec2<i32>(i32(back),ring),fract(back),side,offset,smoothing).x;
    let z=studio_row(vec2<i32>(i32(east),ring),fract(east),side,offset,smoothing).x-
      studio_row(vec2<i32>(i32(west),ring),fract(west),side,offset,smoothing).x;
    gradient=vec3<f32>(x,0,z)/(2.0*radius*sin(3.141592653589793/segments));
  }
  let longitudeSpan=max(.5,2.0*h);
  let concavity=value.z+mix(b.z,c.z,t.y)/(longitudeSpan*longitudeSpan);
  let scale=segments*.001;
  return StudioNoise(value.x,gradient,concavity*scale*scale*smoothstep(0.0,.11,h),uv);
}
fn studio_level(dir:vec3<f32>,radius:f32,side:i32,offset:i32,uv:vec2<f32>)->StudioNoise{
  return studio_sample(dir,radius,side,offset,uv,0.0);
}
fn studio_lod_weight(footprint:f32,radius:f32,side:i32)->f32{
  let texel=6.283185307179586*radius/f32(side-1);
  return smoothstep(texel*1.5,texel*4.0,footprint);
}
fn studio_noise(dir:vec3<f32>,radius:f32,side:i32,footprint:f32)->StudioNoise{
  let uv=studio_uv(dir);
  let weight=studio_lod_weight(footprint,radius,side);
  if(weight<=0.0){return studio_level(dir,radius,side,0,uv);}
  let coarse=studio_level(dir,radius,max(1,(side-1)/4)+1,side*side,uv);
  if(weight>=1.0){return coarse;}
  let fine=studio_level(dir,radius,side,0,uv);
  return StudioNoise(mix(fine.height,coarse.height,weight),
    mix(fine.gradient,coarse.gradient,weight),mix(fine.concavity,coarse.concavity,weight),uv);
}

fn studio_region_cell(index:i32)->vec3<f32>{
  let packed=bitcast<u32>(studioHeights[index]);
  return vec3<f32>(vec3<u32>(packed,packed>>8u,packed>>16u)&vec3<u32>(255u))/255.0;
}

fn studio_regions(uv:vec2<f32>,side:i32,mesa:bool,mountains:bool)->vec4<f32>{
  let coarse=max(1,(side-1)/4)+1;
  let start=side*side+coarse*coarse;
  let width=min(129,side);
  if(i32(arrayLength(&studioHeights))<start+width*width){
    if(mesa){return vec4<f32>(0,1,0,0);}
    return select(vec4<f32>(0,0,0,1),vec4<f32>(1,0,0,0),mountains);
  }
  let p=uv*f32(width-1);
  let cell=vec2<i32>(floor(p));
  let next=min(cell+1,vec2<i32>(width-1));
  let t=fract(p);
  let a=start+cell.y*width;
  let b=start+next.y*width;
  let rock=mix(
    mix(studio_region_cell(a+cell.x),studio_region_cell(a+next.x),t.x),
    mix(studio_region_cell(b+cell.x),studio_region_cell(b+next.x),t.x),t.y);
  let total=dot(rock,vec3<f32>(1));
  return vec4<f32>(max(0.0,1.0-total),rock/max(1.0,total));
}
`;var Da=`struct TileJob {
  origin:vec2<f32>, size:f32, face:u32, level:u32, slot:u32, parent:u32, quadrant:u32,
  children:vec4<u32>,
}

// The grid spacing doubles between a child and its parent. Sample indices
// are stored plus one so zero can indicate that the source is unavailable.
fn tile_sample_source(job:TileJob,xy:vec2<u32>,divs:u32)->u32{
  let row=divs+1u;
  let count=row*row;
  let midpoint=divs/2u;
  if(job.parent>0u && all((xy&vec2<u32>(1u))==vec2<u32>(0u))){
    let quadrant=vec2<u32>(job.quadrant&1u,job.quadrant>>1u);
    let parentXY=xy/2u+quadrant*midpoint;
    return (job.parent-1u)*count+parentXY.y*row+parentXY.x+1u;
  }
  if(any(job.children!=vec4<u32>(0u))){
    let quadrant=select(vec2<u32>(0u),vec2<u32>(1u),xy>=vec2<u32>(midpoint));
    let childSlot=job.children[quadrant.x+2u*quadrant.y];
    if(childSlot>0u){
      let childXY=(xy-quadrant*midpoint)*2u;
      return (childSlot-1u)*count+childXY.y*row+childXY.x+1u;
    }
  }
  return 0u;
}
`;var pi=`struct VertexRecipe {
  layers:array<NoiseParams,5>,
  shape:vec4<f32>,
  style:vec4<f32>,
  world:vec4<u32>,
  grid:vec4<u32>,
  region:vec4<f32>,
  regionWeights:array<vec4<f32>,5>,
  algorithms:array<vec4<u32>,2>,
}
@group(1) @binding(0) var<uniform> recipe:VertexRecipe;
@group(1) @binding(1) var<storage,read> vertexJobs:array<TileJob>;
@group(1) @binding(2) var<storage,read_write> vertexSamples:array<vec4<u32>>;

fn guide_at(dir:vec3<f32>,offset:i32)->StudioNoise{
  return studio_sample(dir,recipe.shape.x,i32(recipe.grid.x),offset,studio_uv(dir),select(1.0,.40,offset>0));
}

fn studio_vertex_height(dir:vec3<f32>)->vec4<f32>{
  let radial=length(dir.xz);
  let theta=atan2(radial,dir.y);
  let phi=select(0.0,atan2(dir.z,dir.x),radial>0.0);
  options.sphereOffset=recipe.shape.y;
  options.sphereOffset2=recipe.shape.z;
  options.spherePolarFade=.15;
  options.sphereFeatureDensity=recipe.shape.w;
  options.sphereRegion=recipe.region;
  options.sphereRegionSeed=recipe.world.x;
  let point=studio_sphere_position(dir,theta,phi);
  var regions=vec4<f32>(1,0,0,0);
  if(recipe.region.z>0.0){regions=studio_region_map(dir);}
  var raw=0.0;
  for(var layer=0u;layer<5u;layer++){
    studioPermutationSlot=layer;
    let p=recipe.layers[layer];
    var height:f32;
    switch recipe.algorithms[layer/4u][layer%4u] {
      case 0u:{height=generateFBM(point,p);}
      case 1u:{height=generateFBM2(point,p);}
      case 2u:{height=generateVoronoiTileNoise(point,p);}
      case 3u:{height=generateRidgedMultifractal4(point,p);}
      case 4u:{height=generateLanczosBillow(point,p);}
      // Custom noise algorithms
      case 5u:{height=generateLanczosAntiBillow(point,p);}
      case 6u:{height=generateSimplexFBM(point,p);}
      case 7u:{height=generateBillow(point,p);}
      case 8u:{height=generateRidgedMultifractal(point,p);}
      case 9u:{height=generateVoronoiBM1(point,p);}
      // End custom noise algorithms
      default:{height=0.0;}
    }
    options.sphereBlend=select(recipe.style.x,0.0,layer==0u);
    options.sphereBlendPhase=13.7*f32(layer)+f32(recipe.world.x%997u)*.13;
    var value=height*p.scalar+p.transform;
    if(options.sphereBlend>0.0){value*=studio_layer_mask(point);}
    raw+=value*dot(regions,recipe.regionWeights[layer]);
  }
  options.sphereBlend=recipe.style.x;
  options.sphereRangeWeight=recipe.style.y;
  options.sphereLandscape=recipe.world.z;
  options.sphereLandscapeStrength=recipe.style.z;
  params.seed=recipe.world.x;
  params.voroMode=recipe.world.y;
  let side=i32(recipe.grid.x);
  let span=PI*.017/recipe.shape.w;
  var broad=raw;
  if(radial>.035&&(params.voroMode!=3u||options.sphereBlend>0.0)){
    let east=vec3<f32>(-dir.z,0.0,dir.x)/radial;
    let north=cross(east,dir);
    let cornerA=(east+north)*span;
    let cornerB=(east-north)*span;
    let offset=0;
    let around=guide_at(normalize(dir+cornerA),offset).height+guide_at(normalize(dir-cornerA),offset).height+
      guide_at(normalize(dir+cornerB),offset).height+guide_at(normalize(dir-cornerB),offset).height;
    broad=mix(raw,.28*raw+.18*around,smoothstep(.035,.155,radial));
  }
  // Match the reference Studio recipe's footprint for collapse and landforms.
  let angularSample=PI/f32(recipe.grid.y)*max(1.0,2.0*radial);
  let relief=studio_sphere_relief(dir,raw,broad,angularSample,regions);
  let erosion=guide_at(dir,side*side).height;
  return vec4<f32>(relief.x*recipe.style.w+erosion,relief.yzw);
}

fn vertex_direction(face:u32,point:vec2<f32>)->vec3<f32>{
  switch face {
    case 0u:{return normalize(vec3<f32>(1,point.y,point.x));}
    case 1u:{return normalize(vec3<f32>(-1,point.y,-point.x));}
    case 2u:{return normalize(vec3<f32>(point.x,1,point.y));}
    case 3u:{return normalize(vec3<f32>(point.x,-1,-point.y));}
    case 4u:{return normalize(vec3<f32>(-point.x,point.y,1));}
    default:{return normalize(vec3<f32>(point.x,point.y,-1));}
  }
}

var<workgroup> sampledRelief:array<vec4<f32>,48>;
@compute @workgroup_size(16,4)
fn sample_studio_vertices(@builtin(workgroup_id) group:vec3<u32>,@builtin(local_invocation_id) lane:vec3<u32>){
  let divs=recipe.world.w;
  let row=divs+1u;
  let count=row*row;
  let id=group.x*16u+lane.x;
  let job=vertexJobs[group.y];
  let probe=job.face==6u;
  let xy=vec2<u32>(id%row,id/row);
  let source=tile_sample_source(job,xy,divs);
  let dir=vertex_direction(job.face,job.origin+vec2<f32>(xy)*(job.size/f32(divs)));
  let axis=select(vec3<f32>(0,1,0),vec3<f32>(1,0,0),abs(dir.y)>.85);
  let east=normalize(cross(axis,dir));
  let north=cross(dir,east);
  // Each lane runs the same height evaluator, so the driver only has to
  // compile it once. The stencil is fixed in world space across every LOD.
  let step=24.0/recipe.shape.x;
  if(select(id<count && source==0u && lane.y<3u,id==0u && lane.y==0u,probe)){
    var sampleDir=dir;
    if(probe){sampleDir=vec3<f32>(job.origin,job.size);}
    else if(lane.y!=0u){sampleDir=normalize(dir+step*select(east,north,lane.y==2u));}
    sampledRelief[lane.y*16u+lane.x]=studio_vertex_height(sampleDir);
  }
  workgroupBarrier();
  if(lane.y!=0u || id>=count){return;}
  if(probe){
    if(id==0u){vertexSamples[0].x=bitcast<u32>(sampledRelief[0].x);}
    return;
  }
  let index=job.slot*count+id;
  if(source>0u){
    vertexSamples[index]=vertexSamples[source-1u];
    return;
  }
  let relief=sampledRelief[lane.x];
  let eastHeight=sampledRelief[16u+lane.x].x;
  let northHeight=sampledRelief[32u+lane.x].x;
  let gradient=(east*(eastHeight-relief.x)+north*(northHeight-relief.x))/24.0;
  let rock=vec4<f32>(max(0.0,1.0-dot(relief.yzw,vec3<f32>(1.0))),relief.yzw);
  vertexSamples[index]=vec4<u32>(bitcast<u32>(relief.x),pack2x16float(gradient.xy),
    pack2x16float(vec2<f32>(gradient.z,0.0)),pack4x8unorm(rock));
}

`;var kr=512,Lt=48,jo=Ma.replace("@group(0) @binding(0) var<uniform> options","var<private> options").replace("@group(0) @binding(1) var<uniform> params","var<private> params").replace("var<storage, read> permTable : PermTable;",`var<storage, read> permTables : array<PermTable,5>;
var<private> studioPermutationSlot:u32;`).replace("permTable.values[idx & PERM_MASK]","permTables[studioPermutationSlot].values[idx & PERM_MASK]"),Zo=pi.replace(/\/\/ Custom noise algorithms[\s\S]*?\/\/ End custom noise algorithms/,""),ka=class{constructor(e){this.device=e,this.pipelines=new Map;let t=e;this.recipe=t.createBuffer({size:672,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.permutations=t.createBuffer({size:5*512*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.probeJob=t.createBuffer({size:Lt,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.probeOutput=t.createBuffer({size:16,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.probeReadback=t.createBuffer({size:4,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}prepare(e){if(!this.pipelines.has(e)){let t=this.compile(e).catch(a=>{throw this.pipelines.delete(e),a});this.pipelines.set(e,t)}return this.pipelines.get(e)}async compile(e){let t=this.device,a=bt.replace("@group(0) @binding(3)","@group(1) @binding(3)"),r=e?"Custom planet point sampling":"Default planet point sampling",o=t.createShaderModule({label:r,code:qt+Ft+za+jo+a+Da+(e?pi:Zo)});return t.createComputePipelineAsync({label:r,layout:"auto",compute:{module:o,entryPoint:"sample_studio_vertices"}})}setWorld(e,t,a,r,o,s,c,n){this.pipeline=e;let l=this.device,d=ut[s.range],{sphereOffset:u,sphereOffset2:f,layers:p}=na(o,r,!0,s.variation,d,t.featureDensity,void 0,s.noiseMix),x=new ArrayBuffer(this.recipe.size),y=new Float32Array(x),m=new Uint32Array(x),M=new Uint32Array(5*512),h=Object.keys(Bt);p.forEach(({layer:v,entryPoint:b,weights:z},D)=>{let _=24*D;y.set([0,v.zoom,v.freq,0,v.lacunarity,v.gain,v.xShift,v.yShift,v.zShift,0,v.seedAngle,v.exp1,v.exp2,v.threshold,v.rippleFreq,v.time,v.warpAmp,v.gaborRadius,v.terraceStep,0,0,v.edgeK,v.scalar,v.transform],_),m[_]=v.seed,m[_+3]=v.octaves,m[_+9]=v.turbulence,m[_+19]=v.toroidal,m[_+20]=v.voroMode,y.set(z??[1,1,1,1],140+4*D),m[160+D]=h.indexOf(b),M.set(new ea(v.seed).perm,D*512)}),y.set([a,u,f,t.featureDensity,s.variation,d,s.landscapeStrength,t.hostRelief??1],120),m.set([o,Wt[r],St[s.landscape],c,t.side,n],128),y.set(ma(s.noiseMix,Wt[r]),136),l.queue.writeBuffer(this.recipe,0,x),l.queue.writeBuffer(this.permutations,0,M),this.guide?.size!==t.guide.byteLength&&(this.guide?.destroy(),this.guide=l.createBuffer({size:t.guide.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})),l.queue.writeBuffer(this.guide,0,t.guide),this.probeGroups=this.groups(this.probeJob,this.probeOutput)}groups(e,t){let a=this.device;return[a.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:2,resource:{buffer:this.permutations}}]}),a.createBindGroup({layout:this.pipeline.getBindGroupLayout(1),entries:[{binding:0,resource:{buffer:this.recipe}},{binding:1,resource:{buffer:e}},{binding:2,resource:{buffer:t}},{binding:3,resource:{buffer:this.guide}}]})]}bindTiles(e,t){this.tileGroups=this.groups(e,t)}dispatch(e,t,a){e.setPipeline(this.pipeline),this.tileGroups.forEach((r,o)=>e.setBindGroup(o,r)),e.dispatchWorkgroups(Math.ceil(t/16),a)}probe(e){let t=this.pipeline,a=this.probeGroups,r=async()=>{if(this.disposed||t!==this.pipeline||a!==this.probeGroups)return;let s=this.device,c=new ArrayBuffer(Lt);new Float32Array(c).set(e),new Uint32Array(c)[3]=6,s.queue.writeBuffer(this.probeJob,0,c);let n=s.createCommandEncoder(),l=n.beginComputePass();l.setPipeline(t),a.forEach((u,f)=>l.setBindGroup(f,u)),l.dispatchWorkgroups(1),l.end(),n.copyBufferToBuffer(this.probeOutput,0,this.probeReadback,0,4),s.queue.submit([n.finish()]),await this.probeReadback.mapAsync(GPUMapMode.READ);let d=new Float32Array(this.probeReadback.getMappedRange())[0];return this.probeReadback.unmap(),d},o=(this.pendingProbe??Promise.resolve()).then(r);return this.pendingProbe=o.catch(()=>{}),o}dispose(){this.disposed=!0;for(let e of[this.recipe,this.permutations,this.guide,this.probeJob,this.probeOutput,this.probeReadback])e?.destroy()}};var hi=Pe([.54,.45,.71]),Ko=Pe([hi[2],0,-hi[0]]);function lt(i){let e=i*2*Math.PI,t=Math.cos(e),a=Math.sin(e);return hi.map((r,o)=>r*t+Ko[o]*a)}var di={blue:[[.23,.4,.65],[.93,.34,.105],1],amber:[[.54,.34,.14],[.95,.24,.072],1.1],violet:[[.35,.26,.57],[.76,.22,.46],.93],teal:[[.15,.43,.4],[.73,.53,.15],1.06],thin:[[.3,.4,.57],[.82,.36,.18],.18],titan:[[.31,.43,.33],[.92,.56,.2],1.18],airless:[[.27,.32,.44],[.69,.37,.22],.015],pluto:[[.28,.43,.7],[.65,.43,.25],.09]},$o={utahish:"amber",desert:"amber",volcanic:"amber","mars-dawn":"amber",badlands:"amber","gas-giant":"amber","lavender-dusk":"violet",toxic:"teal","copper-oxide":"teal",jungle:"teal","moon-dust":"thin","verdigris-sea":"teal","amethyst-tide":"violet","lunar-highlands":"thin","basalt-mare":"thin",titan:"titan",io:"airless",pluto:"pluto",ceres:"airless","ceres-crater-fields":"airless"};function Br(i,e){let t=e==="preset"?$o[i]??"blue":e;return Object.hasOwn(di,t)?di[t]:di.blue}var Cr=`const terrainRotation=mat3x3<f32>(
  vec3<f32>(4,28,-10)/30.0, vec3<f32>(-20,10,20)/30.0, vec3<f32>(22,4,20)/30.0);
const octaveTwist=mat3x3<f32>(
  vec3<f32>(4,8,1)/9.0, vec3<f32>(-4,1,8)/9.0, vec3<f32>(7,-4,4)/9.0);
struct PlanetSurface {
  height:f32, value:f32, gradient:vec3<f32>, patina:f32, shelter:f32,
  basin:f32, mineral:f32, uv:vec2<f32>, rock:vec4<f32>, baseGradient:vec3<f32>,
}
fn planet_surface(dir:vec3<f32>, radius:f32, seed:u32, footprint:f32, materialPixel:f32,
  base:StudioNoise, rock:vec4<f32>, bands:u32, detail:vec4<f32>, modes:vec3<f32>)->PlanetSurface {
  let scale=studioReliefMeters;
  let p=(terrainRotation*dir)*radius;
  let twistedPoint=octaveTwist*p;
  let studioSlope=terrainRotation*base.gradient;
  var height=base.height*scale;
  var gradient=vec3<f32>(0.0);
  var warp=vec2<f32>(1.15*base.height,0.0);
  var warpXGradient=1.15*studioSlope;
  var ridgeCarry=0.0;
  var ridgeCarrySlope=vec3<f32>(0.0);
  let upland=clamp((base.height+1.0)/3.0,0.0,1.0);
  let regionalStrength=.60+.62*upland*upland*(3.0-2.0*upland);
  let regionalSlope=studioSlope*(.62*2.0*upland*(1.0-upland));
  let waves=array<f32,2>(8600,3600);
  let amplitudes=array<f32,2>(290,165);
  let terraces=array<f32,2>(.13,.22);
  for(var level=0u;level<2u;level++){
    let wave=waves[level];
    let bandWeight=1.0-smoothstep(wave*.18,wave*.52,footprint);
    if(bandWeight<=0.0){break;}
    let crestWeight=1.0-smoothstep(wave*.065,wave*.19,footprint);
    let twisted=level==1u;
    let point=select(p,twistedPoint,twisted);
    let domain=mix(vec3<f32>(1.0),vec3<f32>(1.18,.70,.94),rock.x);
    let n=planet_noise(point*domain/wave+vec3<f32>(warp,0),seed+131u+level*19u);
    let groove=max(0.0,1.0-n.value*n.value/(.34*.34));
    let amplitude=amplitudes[level]*bandWeight*(1.0-.66*rock.y-.52*rock.z);
    let cut=.11*crestWeight;
    let layer=(n.value+1.0)*4.0;
    let edge=clamp((fract(layer)-.22)/.56,0.0,1.0);
    let shelf=(floor(layer)+edge*edge*(3.0-2.0*edge))*.25-1.0;
    let rounded=mix(n.value,shelf,terraces[level])-cut*groove*groove;
    // Chain the derivative through the offset, then through the cut in the height profile.
    let nativeSlope=n.slope*domain;
    let unwarpedSlope=select(nativeSlope,transpose(octaveTwist)*nativeSlope,twisted);
    let slope=unwarpedSlope/wave+n.slope.x*warpXGradient;
    let roundedSlope=mix(1.0,6.0*edge*(1.0-edge)/.56,terraces[level])+
      (4.0*cut/(.34*.34))*n.value*groove;
    var form=rounded;
    var shapeSlope=roundedSlope;
    if(rock.x>0.0){
      // Break the baked slopes into kilometer-scale divides and shoulders.
      // The second band only reaches full strength on the first band's ridge.
      let magnitude=length(vec2<f32>(n.value,.012));
      let width=select(.66,.90,n.value>0.0);
      let crest=max(0.0,1.0-(magnitude-.012)/width);
      let ridge=crest*crest;
      let ridgeSlope=-2.0*crest*n.value/(width*magnitude);
      let parent=select(1.0,ridgeCarry,level==1u);
      let relief=select(1.72,2.25,level==1u);
      let weight=min(.97,.89*detail.x)*crestWeight*rock.x;
      let sculpted=.31*n.value+relief*(ridge*parent-.28);
      form=mix(form,sculpted,weight);
      shapeSlope=mix(shapeSlope,.31+relief*ridgeSlope*parent,weight);
      if(level==0u){
        ridgeCarry=.30+.70*ridge;
        ridgeCarrySlope=.70*ridgeSlope*slope;
      }else{
        gradient+=amplitude*regionalStrength*weight*relief*ridge*ridgeCarrySlope;
      }
    }
    height+=amplitude*regionalStrength*form;
    gradient+=amplitude*(slope*(regionalStrength*shapeSlope)+form*regionalSlope);
    if(level==1u){break;}
    let along=.18+.16*crestWeight;
    warp=vec2<f32>(.65*n.value+along*n.slope.y,0);
    warpXGradient=.65*slope+along*(n.dySlope*domain/wave+n.dySlope.x*warpXGradient);
  }
  let terrainSlope=base.gradient*scale+transpose(terrainRotation)*gradient;
  let drainage=local_relief(dir,radius,seed,base.gradient*scale,base.height*scale,height,terrainSlope,
    footprint,materialPixel,bands,detail,modes,rock);
  let rockFace=smoothstep(.40,1.9,length(base.gradient*scale));
  let wallDetail=rockFace*(.65+.92*smoothstep(5.0,52.0,footprint));
  let slope=terrainSlope+drainage.slope*(1.0+wallDetail)+drainage.groundSlope;
  return PlanetSurface(height+drainage.height,base.height,slope,drainage.pigment,
    drainage.channels,base.concavity,drainage.pigment,base.uv,rock,base.gradient*scale);
}
`;var Ar=`// Compact, slope-steered carrier for the scales below the baked erosion map.
// Each cell fades to zero at its boundary. The chart overlap closes the globe.
fn drainage_carrier(p:vec2<f32>,wave:vec2<f32>,seed:u32)->vec2<f32>{
  let cell=vec2<i32>(floor(p));
  let f=fract(p);
  let w=f*f*(3.0-2.0*f);
  var sum=vec2<f32>(0.0);
  for(var j=0;j<2;j++){
    for(var i=0;i<2;i++){
      let corner=vec2<i32>(i,j);
      let hash=planet_hash_bits(vec3<i32>(cell+corner,0),seed);
      let jitter=vec2<f32>(f32(hash&255u),f32((hash>>8u)&255u))*(.60/255.0)-.30;
      let phase=dot(f-vec2<f32>(corner)-jitter,wave)+1.57;
      let weight=select(1.0-w,w,corner>vec2<i32>(0));
      sum+=vec2<f32>(cos(phase),sin(phase))*weight.x*weight.y;
    }
  }
  return sum/max(.50,length(sum));
}

struct DrainageChart { point:vec2<f32>, slope:vec2<f32>, du:vec3<f32>, dv:vec3<f32> }
fn drainage_chart(dir:vec3<f32>,radius:f32,grade:vec3<f32>,hemisphere:f32)->DrainageChart{
  let projection=max(.5,1.0+hemisphere*dir.y);
  let uv=dir.xz/projection;
  let angular=vec3<f32>(dir.x,hemisphere+dir.y,dir.z);
  let du=vec3<f32>(1,0,0)-uv.x*angular;
  let dv=vec3<f32>(0,0,1)-uv.y*angular;
  let metric=2.0/(1.0+dot(uv,uv));
  return DrainageChart(uv*radius,vec2<f32>(dot(grade,du),dot(grade,dv))*metric,du/projection,dv/projection);
}

struct DrainageState { slope:vec2<f32>, fade:f32, mask:f32 }
fn drainage_start(grade:vec2<f32>)->DrainageState{
  return DrainageState(.74*normalize(grade+vec2<f32>(1e-5,0)),0.0,smoothstep(.045,.60,length(grade)));
}

// Use a separate, nearly constant flank slope to steer the smaller gullies.
// Their height fades back to the parent crest or crease at branch junctions.
fn drainage_band(chart:DrainageChart, wave:f32, amplitude:f32, seed:u32, state:ptr<function,DrainageState>)->vec4<f32>{
  let flow=normalize((*state).slope+vec2<f32>(1e-5,0));
  let across=vec2<f32>(-flow.y,flow.x)*7.1;
  let carrier=drainage_carrier(chart.point/wave,across,seed);
  let phase=carrier.x*(.58+.42*abs(carrier.x));
  let coverage=(*state).mask;
  let trough=max(0.0,-phase);
  let height=amplitude*(mix((*state).fade,.70*phase-1.05*trough*trough,coverage)-.10);
  let slope=-amplitude*(.70+2.10*trough)*coverage*(.58+.84*abs(carrier.x))*carrier.y*across/wave;
  (*state).fade=mix((*state).fade,phase,coverage);
  (*state).mask=coverage*(1.6-.6*coverage)*smoothstep(.02,.49,abs(carrier.y));
  let steering=carrier.y*inverseSqrt(.09+carrier.y*carrier.y);
  (*state).slope-=across*(amplitude*.71/wave)*steering;
  return vec4<f32>(height,slope,smoothstep(.28,.97,-(*state).fade));
}

struct LocalRelief { height:f32, slope:vec3<f32>, groundSlope:vec3<f32>, channels:f32, pigment:f32 }
fn local_relief(dir:vec3<f32>,radius:f32,seed:u32,grade:vec3<f32>,baseHeight:f32,
  terrainHeight:f32,terrainSlope:vec3<f32>,footprint:f32,materialPixel:f32,
  bands:u32, detail:vec4<f32>, modes:vec3<f32>, rockType:vec4<f32>)->LocalRelief{
  var result=LocalRelief(0.0,vec3<f32>(0),vec3<f32>(0),0.0,0.0);
  if(footprint>=1125.0 || detail.z+detail.w==0.0){return result;}
  let strength=smoothstep(.05,.76,length(grade));
  let wall=smoothstep(.45,2.0,length(grade-dir*dot(dir,grade)));
  let overlap=smoothstep(-.19,.19,dir.y);
  let north=drainage_chart(dir,radius,grade,1.0);
  let south=drainage_chart(dir,radius,grade,-1.0);
  var parentN=drainage_start(north.slope);
  var parentS=drainage_start(south.slope);
  var province=vec2<f32>(1.0);
  if(detail.y>0.0){
    let a=planet_noise(dir*5.8+vec3<f32>(.87,-1.52,2.3),seed+811u).value;
    let b=planet_noise(dir*9.2+vec3<f32>(-2.4,.63,1.1),seed+1979u).value;
    province=mix(vec2<f32>(1.0),mix(vec2<f32>(.25,.35),vec2<f32>(1.0),
      smoothstep(vec2<f32>(-.47),vec2<f32>(.31),vec2<f32>(a,b))),detail.y);
  }
  let waves=array<f32,9>(2500,1100,475,180,65,22,6,1.8,.55);
  let heights=array<f32,9>(245,138,73,24,7,2.25,.60,.18,.04);
  let graniteWear=1.0-.74*rockType.z;
  let hillsideWear=dot(rockType,vec4<f32>(1.32,.86,.74,.84));
  var groundRadius=radius;
  var groundGrade=terrainSlope;
  for(var i=0u;i<bands;i++){
    let wave=waves[i];
    let sampleSize=select(footprint,max(footprint,materialPixel),i>=7u);
    let weight=1.0-smoothstep(wave*.12,wave*.45,sampleSize);
    if(weight<=0.0){break;}
    let ground=i>=4u;
    if(i==4u){
      // Freeze the domain at the larger terrain scales. Fine octaves sample
      // actual relief in meters, including the sides of gullies and cliffs.
      groundRadius=radius+terrainHeight+result.height;
      groundGrade=terrainSlope+result.slope;
    }
    let octave=i-select(0u,4u,ground);
    if(octave>=u32(select(detail.z,detail.w,ground))){continue;}
    let mode=select(modes.x,modes.y,ground);
    let mask=select(province.x*graniteWear,province.y,ground);
    let amplitude=heights[i]*weight*mask;
    let salt=seed+3023u+i*71u;
    var height=0.0;
    var slope=vec3<f32>(0);
    if(mode==0.0){
      let flowWeight=select(1.0,select(mix(.60,.22,wall),mix(1.0,.65,wall),i==4u),ground);
      let wet=amplitude*mix(.06,1.0,strength)*flowWeight;
      let cutStrength=select(modes.z*hillsideWear*select(1.0,.84,i==0u),min(1.45,modes.z),ground);
      if(i<6u && overlap>0.0){
        let cut=drainage_band(north,wave,wet,salt,&parentN);
        height+=overlap*cut.x*cutStrength;
        slope+=overlap*(north.du*cut.y+north.dv*cut.z)*cutStrength;
        result.channels+=overlap*cut.w*weight*strength*mask*.11*flowWeight*min(1.5,cutStrength);
      }
      if(i<6u && overlap<1.0){
        let cut=drainage_band(south,wave,wet,salt+1471u,&parentS);
        height+=(1.0-overlap)*cut.x*cutStrength;
        slope+=(1.0-overlap)*(south.du*cut.y+south.dv*cut.z)*cutStrength;
        result.channels+=(1.0-overlap)*cut.w*weight*strength*mask*.11*flowWeight*min(1.5,cutStrength);
      }
      // Sample the displaced surface so rock detail survives steep slopes.
      // Kilometer-scale rock ribs survive between valleys, with finer grain
      // breaking up the channel walls.
      if(i<=2u || ground){
        let sampleRadius=select(radius+.60*baseHeight,groundRadius,ground);
        let sampleGrade=select(.60*grade,groundGrade,ground);
        let point=dir*sampleRadius;
        let twisted=ground&&(i&1u)==1u;
        let rotated=terrainRotation*point;
        let domain=select(select(point,rotated,ground),octaveTwist*rotated,twisted);
        let grain=planet_noise(domain/wave,salt+431u);
        let sampleSlope=select(grain.slope,transpose(octaveTwist)*grain.slope,twisted);
        let nativeSlope=select(sampleSlope,transpose(terrainRotation)*sampleSlope,ground);
        let gradient=(nativeSlope*(sampleRadius/radius)+dot(nativeSlope,dir)*sampleGrade)/wave;
        if(i<2u){
          let magnitude=length(vec2<f32>(grain.value,.018));
          let crest=max(0.0,1.0-(magnitude-.018)/.63);
          let rock=crest*crest-.38;
          let rubble=amplitude*strength*select(.59,.89,i==1u);
          height+=rubble*rock;
          slope-=rubble*(2.0*crest*grain.value/(.63*magnitude))*gradient;
          result.pigment+=rock*strength*weight*.08;
        }else if(!ground){
          let rubble=heights[i]*weight*.24*graniteWear;
          height+=rubble*grain.value;
          slope+=gradient*rubble;
          result.pigment+=grain.value*weight*.075;
        }else{
          // Quiet slopes expose rock between the channels. Sandstone ledges,
          // granite joints and porous lava share the same noise evaluation.
          let joint=grain.value-.14*rockType.w;
          let width=mix(.55,.28,rockType.z);
          let magnitude=length(vec2<f32>(joint,.05));
          let cut=max(0.0,1.0-(magnitude-.05)/width);
          let rim=clamp((grain.value+.72)/1.44,0.0,1.0);
          let lip=smoothstep(.26,.66,rim)-rim;
          let pit=.22+.52*rockType.w+.12*rockType.z;
          let form=.48*grain.value-pit*cut*cut+.68*rockType.y*lip;
          let rimT=clamp((rim-.26)/.40,0.0,1.0);
          let rimSlope=select(0.0,(6.0*rimT*(1.0-rimT)/.40-1.0)/1.44,rim>0.0&&rim<1.0);
          let derivative=.48+2.0*pit*cut*joint/(width*magnitude)+
            .68*rockType.y*rimSlope;
          let rubble=amplitude*mix(1.24,.88,strength)*select(.77,1.0,i>=6u);
          height+=rubble*form;
          slope+=gradient*(rubble*derivative);
          result.pigment+=form*weight*mask*mix(.25,.12,strength);
        }
      }
    }else{
      let sampleRadius=select(radius,groundRadius,ground);
      let n=planet_noise(dir*sampleRadius/wave,salt);
      let edge=length(vec2<f32>(n.value,.055));
      let groove=max(0.0,1.0-(edge-.055)/.51);
      let cut=mode==1.0;
      height=amplitude*select(.50*n.value,-groove*groove,cut);
      let derivative=select(.50,2.0*groove*n.value/(.51*edge),cut);
      let gradient=n.slope*(sampleRadius/radius)+select(vec3<f32>(0),dot(n.slope,dir)*groundGrade,ground);
      slope+=gradient*(amplitude*derivative/wave);
    }
    if(ground){result.groundSlope+=slope;}else{result.slope+=slope;}
    if(i<7u){result.height+=height;}
    result.pigment+=height/heights[i]*select(.015,.025,ground);
  }
  return result;
}
`;var Et=`struct Frame {
  vp:mat4x4<f32>, eye:vec4<f32>, right:vec4<f32>, up:vec4<f32>, forward:vec4<f32>, options:vec4<f32>,
  solar:vec4<f32>, air:vec4<f32>, dusk:vec4<f32>, surface:vec4<f32>,
}
@group(0) @binding(0) var<uniform> frame:Frame;
struct RockShadow { center:vec4<f32>, along:vec4<f32>, across:vec4<f32> }
struct PlanetStyle {
  palette:vec4<f32>, ocean:vec4<f32>, detail:vec4<f32>, modes:vec4<f32>, stops:array<vec4<f32>,32>,
  world:vec4<f32>, springChart:vec4<f32>, duneChart:vec4<f32>, duneWind:vec4<f32>,
  rockShadows:array<RockShadow,2>,
  climate:vec4<f32>, shallowWater:vec4<f32>, deepWater:vec4<f32>,
  coastSediment:vec4<f32>, coastOutcrop:vec4<f32>, coastShoal:vec4<f32>,
  lunarMaterial:vec4<f32>,
}
@group(0) @binding(2) var<uniform> style:PlanetStyle;
@group(0) @binding(4) var sunVisibility:texture_2d_array<f32>;
@group(0) @binding(5) var sunSampler:sampler;
fn sun()->vec3<f32>{return frame.solar.xyz;}
fn shadow_visibility(uv:vec2<f32>)->f32{
  if(frame.surface.z<0.5){return 1.0;}
  let layer=i32(frame.dusk.w);
  let a=textureSampleLevel(sunVisibility,sunSampler,uv,layer,0.0).r;
  if(frame.solar.w==0.0){return a;}
  let b=textureSampleLevel(sunVisibility,sunSampler,uv,1-layer,0.0).r;
  return mix(a,b,frame.solar.w);
}
fn preset_color(value:f32,nearDetail:f32)->vec3<f32>{
  let last=style.palette.x-1.0;
  let index=last*clamp((value-style.palette.w)*style.palette.y,0.0,1.0);
  let lower=min(u32(index),u32(last)-1u);
  let fraction=index-f32(lower);
  let t=mix(clamp(fraction,.1,.9),fraction,nearDetail);
  return pow(mix(style.stops[lower].xyz,style.stops[lower+1u].xyz,t),vec3<f32>(2.2));
}
fn sky_air_color(up:vec3<f32>,ray:vec3<f32>)->vec3<f32>{
  let zenith=max(0.0,dot(up,ray));
  let horizon=(1.0-zenith)*(1.0-zenith);
  let day=dot(up,sun());
  let daylight=smoothstep(-.16,.28,day);
  let twilight=smoothstep(-.23,-.035,day)*(1.0-smoothstep(.03,.38,day));
  let facing=clamp(.5+.5*dot(ray,sun()),0.0,1.0);
  let sunward=facing*facing*facing;
  let blue=mix(frame.air.xyz*vec3<f32>(.16,.28,.53),frame.air.xyz,horizon);
  let dusk=frame.dusk.xyz*twilight*(.06+.48*sunward)*(.13+.87*horizon);
  return vec3<f32>(.002,.0035,.007)+blue*(.019+.98*daylight)+dusk;
}
fn solar_light(day:f32, diffuse:f32, visibility:f32, ambient:f32)->vec3<f32>{
  let twilight=smoothstep(-.20,.24,day);
  let lit=smoothstep(-.008,.025,day);
  let tint=mix(mix(vec3<f32>(1.0,.42,.18),frame.dusk.xyz,.32),vec3<f32>(1.10,1.01,.88),smoothstep(0.0,.38,day));
  let skyTint=mix(vec3<f32>(.70,.84,1.10),normalize(frame.air.xyz)*1.64,.34);
  let fill=ambient*mix(.075,.98,twilight);
  return fill*skyTint+(.94-ambient)*diffuse*lit*visibility*tint;
}
fn terrain_haze(up:vec3<f32>,ray:vec3<f32>,distance:f32)->f32{
  let horizon=1.0-max(0.0,dot(-ray,up));
  let air=exp(-max(0.0,length(frame.eye.xyz)-frame.eye.w)/44000.0)*frame.air.w;
  return .22*air*horizon*horizon*(1.0-exp(-distance/54000.0));
}
const studioReliefMeters=262144.0*.023;\r
`;var Rr=`struct Tile { origin:vec2<f32>, size:f32, face:u32, level:u32, pad0:u32, pad1:u32, pad2:u32 }
@group(0) @binding(1) var<storage,read> tiles:array<Tile>;
struct BaseVertex { fine:vec4<f32>, coarse:vec4<f32>, rock:vec4<f32> }
@group(0) @binding(6) var<storage,read> baseVertices:array<vec4<u32>>;
@group(0) @binding(7) var<storage,read> tileJobs:array<TileJob>;
@group(0) @binding(8) var<storage,read_write> tileOutput:array<BaseVertex>;
fn cube_point(face:u32,p:vec2<f32>)->vec3<f32>{
  switch face {
    case 0u: {return vec3<f32>(1,p.y,p.x);}
    case 1u: {return vec3<f32>(-1,p.y,-p.x);}
    case 2u: {return vec3<f32>(p.x,1,p.y);}
    case 3u: {return vec3<f32>(p.x,-1,-p.y);}
    case 4u: {return vec3<f32>(-p.x,p.y,1);}
    default: {return vec3<f32>(p.x,p.y,-1);}
  }
}
fn tile_direction(tile:Tile,index:u32,divs:u32)->vec3<f32>{
  let row=divs+1u;
  let uv=tile.origin+vec2<f32>(f32(index%row),f32(index/row))*(tile.size/f32(divs));
  return normalize(cube_point(tile.face,uv));
}
@compute @workgroup_size(64) fn bake_tile_vertices(@builtin(global_invocation_id) id:vec3<u32>){
  let divs=u32(frame.options.x);
  let row=divs+1u;
  let vertices=row*row;
  if(id.x>=vertices){return;}
  let job=tileJobs[id.y];
  let at=job.slot*vertices+id.x;
  let xy=vec2<u32>(id.x%row,id.x/row);
  let source=tile_sample_source(job,xy,divs);
  if(source>0u){
    tileOutput[at]=tileOutput[source-1u];
    return;
  }
  let dir=normalize(cube_point(job.face,job.origin+vec2<f32>(xy)*(job.size/f32(divs))));
  let uv=studio_uv(dir);
  let side=i32(style.palette.z);
  let fine=studio_level(dir,frame.eye.w,side,0,uv);
  let coarse=studio_level(dir,frame.eye.w,max(1,(side-1)/4)+1,side*side,uv);
  let rock=studio_regions(uv,side,style.ocean.z>.5,style.ocean.w>.5);
  tileOutput[at]=BaseVertex(vec4<f32>(fine.height,fine.gradient),vec4<f32>(coarse.height,coarse.gradient),rock);
}
`;var Ba=`fn planet_hash_bits(p:vec3<i32>, seed:u32)->u32 {
  var n=(bitcast<u32>(p.x)*0x8da6b343u)^(bitcast<u32>(p.y)*0xd8163841u)^
    (bitcast<u32>(p.z)*0xcb1ab31fu)^(seed*0x165667b1u);
  n=(n^(n>>16u))*0x7feb352du;
  n=(n^(n>>15u))*0x846ca68bu;
  return n^(n>>16u);
}
fn planet_hash(p:vec3<i32>, seed:u32)->f32 {
  return f32(planet_hash_bits(p,seed))/4294967295.0*2.0-1.0;
}
fn gradient_corner(cell:vec3<i32>,f:vec3<f32>,offset:vec3<i32>,seed:u32)->vec4<f32>{
  let h=planet_hash_bits(cell+offset,seed)&15u;
  let x=vec3<f32>(1,0,0); let y=vec3<f32>(0,1,0); let z=vec3<f32>(0,0,1);
  let a=select(y,x,h<8u);
  let b=select(select(z,x,h==12u||h==14u),y,h<4u);
  let g=(select(a,-a,(h&1u)!=0u)+select(b,-b,(h&2u)!=0u))*(1.15/sqrt(2.0));
  return vec4<f32>(dot(g,f-vec3<f32>(offset)),g);
}
struct PlanetNoise { value:f32, slope:vec3<f32>, dySlope:vec3<f32> }
fn planet_noise(p:vec3<f32>, seed:u32)->PlanetNoise {
  let c=vec3<i32>(floor(p)); let f=fract(p);
  let t=f*f*f*(10.0+f*(-15.0+6.0*f));
  let g=30.0*f*f*(1.0-f)*(1.0-f);
  let a=gradient_corner(c,f,vec3<i32>(0,0,0),seed);
  let b=gradient_corner(c,f,vec3<i32>(1,0,0),seed);
  let d=gradient_corner(c,f,vec3<i32>(0,1,0),seed);
  let e=gradient_corner(c,f,vec3<i32>(1,1,0),seed);
  let h=gradient_corner(c,f,vec3<i32>(0,0,1),seed);
  let i=gradient_corner(c,f,vec3<i32>(1,0,1),seed);
  let j=gradient_corner(c,f,vec3<i32>(0,1,1),seed);
  let k=gradient_corner(c,f,vec3<i32>(1,1,1),seed);
  let a0=mix(a,b,t.x); let a1=mix(d,e,t.x);
  let b0=mix(h,i,t.x); let b1=mix(j,k,t.x);
  let z0=mix(a0,a1,t.y); let z1=mix(b0,b1,t.y);
  let y0=a1-a0; let y1=b1-b0;
  let value=mix(z0,z1,t.z);
  let x0=mix(b-a,e-d,t.y); let x1=mix(i-h,k-j,t.y);
  let xBlend=mix(x0,x1,t.z);
  let dx=xBlend*g.x;
  let yBlend=mix(y0,y1,t.z);
  let dy=yBlend*g.y;
  let dz=(z1-z0)*g.z;
  let slope=value.yzw+vec3<f32>(dx.x,dy.x,dz.x);
  let dd=60.0*f*(f-1.0)*(2.0*f-1.0);
  let dySlope=vec3<f32>(
    dx.z+dy.y+mix((e.x-d.x)-(b.x-a.x),(k.x-j.x)-(i.x-h.x),t.z)*g.x*g.y,
    2.0*dy.z+yBlend.x*dd.y,
    dz.z+dy.w+(y1.x-y0.x)*g.y*g.z);
  return PlanetNoise(value.x,slope,dySlope);
}
`;var Tr=`struct OrbitVarying {
  @builtin(position) clip:vec4<f32>,
  @location(0) relative:vec3<f32>,
  @location(1) radial:vec3<f32>,
  @location(2) terrain:vec4<f32>,
  @location(3) @interpolate(flat) level:u32,
}

// The initial orbit samples the existing atlas directly. The full renderer
// builds patch samples once and reuses them when the camera moves.
fn orbit_sample(dir:vec3<f32>,radius:f32,side:i32,offset:i32,uv:vec2<f32>)->vec4<f32>{
  let segments=side-1;
  let p=uv*f32(segments);
  let cell=min(vec2<i32>(floor(p)),vec2<i32>(segments-1));
  let t=p-vec2<f32>(cell);
  let nextX=(cell.x+1)%segments;
  let row=offset+cell.y*side;
  let a=studioHeights[row+cell.x];
  let b=studioHeights[row+nextX];
  let c=studioHeights[row+side+cell.x];
  let d=studioHeights[row+side+nextX];
  let lo=mix(a,b,t.x);
  let hi=mix(c,d,t.x);
  let horizontal=max(length(dir.xz),.0001);
  let east=vec3<f32>(-dir.z,0,dir.x)/horizontal;
  let south=vec3<f32>(dir.x*dir.y/horizontal,-horizontal,dir.z*dir.y/horizontal);
  let du=mix(b-a,d-c,t.y)*smoothstep(.0001,.01,horizontal)/(6.28318530718*horizontal);
  let dv=(hi-lo)/3.14159265359;
  return vec4<f32>(mix(lo,hi,t.y),(east*du+south*dv)*(f32(segments)/radius));
}

@vertex fn orbit_vertex(@builtin(vertex_index) vertex:u32,@builtin(instance_index) instance:u32)->OrbitVarying {
  let tile=tiles[instance];
  let dir=tile_direction(tile,vertex,u32(frame.options.x));
  let radius=frame.eye.w;
  let pixel=length(dir*radius-frame.eye.xyz)*frame.forward.w;
  let side=i32(style.palette.z);
  let uv=studio_uv(dir);
  let blend=studio_lod_weight(pixel,radius,side);
  let fine=orbit_sample(dir,radius,side,0,uv);
  let coarse=orbit_sample(dir,radius,max(1,(side-1)/4)+1,side*side,uv);
  let terrain=mix(fine,coarse,blend);
  let ground=terrain.x*studioReliefMeters*style.world.x;
  let height=select(ground,max(ground,style.ocean.x),style.ocean.y>.5);
  let relative=dir*(radius+height)-frame.eye.xyz;
  var clip=frame.vp*vec4<f32>(relative,1);
  clip.z=(clip.z+clip.w)*.5;
  return OrbitVarying(clip,relative,dir,terrain,tile.level);
}

@fragment fn orbit_fragment(v:OrbitVarying)->@location(0) vec4<f32> {
  if(frame.options.z>.5){
    return vec4<f32>(.45+.4*cos(vec3<f32>(0,2,4)+f32(v.level)*.85),1);
  }
  let radial=normalize(v.radial);
  let distance=length(v.relative);
  let ray=v.relative/max(distance,.001);
  let gradient=v.terrain.yzw-radial*dot(radial,v.terrain.yzw);
  let normal=normalize(radial-gradient*studioReliefMeters*style.world.x*.68);
  let day=dot(radial,sun());
  let ground=v.terrain.x*studioReliefMeters*style.world.x;
  let depth=style.ocean.x-ground;
  var color=preset_color(v.terrain.x,1.0)*solar_light(day,max(0.0,dot(normal,sun())),1.0,.27);
  if(style.ocean.y>.5&&depth>0.0){
    let water=mix(style.shallowWater.xyz,style.deepWater.xyz,1.0-exp(-depth*style.deepWater.w));
    let reflection=sky_air_color(radial,reflect(ray,radial))*.66;
    let fresnel=.025+.72*pow(1.0-max(0.0,dot(radial,-ray)),5.0);
    let lit=water*solar_light(day,max(0.0,day),1.0,.30);
    color=mix(color,mix(lit,reflection,fresnel),smoothstep(0.0,max(2.0,distance*frame.forward.w*.15),depth));
  }
  color=mix(color,sky_air_color(radial,-ray),terrain_haze(radial,-ray,distance));
  return vec4<f32>(pow(color,vec3<f32>(1.0/2.2)),1.0);
}
`;var qr=`override proceduralTerrain:bool=false;
fn detail_footprint(distance:f32,pixel:f32)->f32{
  return max(pixel,max(0.0,distance-420.0)*.004);
}
fn district_cell(index:i32)->vec3<f32>{
  let packed=bitcast<u32>(studioHeights[index]);
  return vec3<f32>(vec3<u32>(packed,packed>>8u,packed>>16u)&vec3<u32>(255u))/255.0;
}
fn district_material(uv:vec2<f32>,chart:vec4<f32>,width:i32,offset:i32)->vec3<f32>{
  if(width<2){return vec3<f32>(0.0);}
  let delta=uv-chart.xy;
  let local=vec2<f32>(fract(delta.x+.5)-.5,delta.y)/chart.zw;
  if(any(abs(local)>=vec2<f32>(1.0))){return vec3<f32>(0.0);}
  let side=i32(style.palette.z);
  let coarse=(side-1)/4+1;
  let provinces=min(129,side);
  let start=side*side+coarse*coarse+provinces*provinces+offset;
  let p=(local*.5+.5)*f32(width-1);
  let cell=min(vec2<i32>(floor(p)),vec2<i32>(width-2));
  let t=clamp(p-vec2<f32>(cell),vec2<f32>(0.0),vec2<f32>(1.0));
  let at=start+cell.y*width+cell.x;
  return mix(mix(district_cell(at),district_cell(at+1),t.x),
    mix(district_cell(at+width),district_cell(at+width+1),t.x),t.y);
}
fn district_flatness(water:f32,dune:vec2<f32>)->f32{
  return max(smoothstep(.48,.92,water),1.0-(1.0-.91*dune.x)*(1.0-dune.y));
}
fn studio_deposits(uv:vec2<f32>)->f32{
  let side=i32(style.palette.z);
  let coarse=(side-1)/4+1;
  let provinces=min(129,side);
  let start=side*side+coarse*coarse+provinces*provinces+2*i32(style.world.w);
  let width=min(257,side);
  if(i32(arrayLength(&studioHeights))<start+width*width){return 0.0;}
  let p=uv*f32(width-1);
  let cell=min(vec2<i32>(floor(p)),vec2<i32>(width-2));
  let t=p-vec2<f32>(cell);
  let a=start+cell.y*width+cell.x;
  return mix(mix(studioHeights[a],studioHeights[a+1],t.x),
    mix(studioHeights[a+width],studioHeights[a+width+1],t.x),t.y);
}
fn district_height(surface:PlanetSurface,flatness:f32)->f32{
  return mix(surface.height,surface.value*studioReliefMeters,flatness);
}
fn rock_visibility(world:vec3<f32>,distance:f32)->f32{
  let cutoff=22000.0*frame.eye.w/262144.0;
  if(distance>=cutoff){return 1.0;}
  var visibility=1.0;
  for(var i=0u;i<2u;i++){
    let rock=style.rockShadows[i];
    let size=rock.center.w;
    let p=world-rock.center.xyz;
    if(size<=0.0 || dot(p,p)>size*size*10.0){continue;}
    let up=normalize(rock.center.xyz);
    let day=dot(sun(),up);
    let travel=(rock.along.w*.55-dot(p,up))/max(day,.14);
    let q=(p+sun()*max(0.0,travel))/size;
    let width=length(vec2<f32>(dot(q,rock.along.xyz),2.7*dot(q,rock.across.xyz)));
    let shade=(1.0-smoothstep(.78,1.12,width))*smoothstep(-.06,.18,travel/size)*smoothstep(.09,.36,day);
    let contact=1.0-smoothstep(.32,1.34,length(p)/size);
    visibility=min(visibility,1.0-.42*shade-.13*contact);
  }
  return mix(visibility,1.0,smoothstep(cutoff*.65,cutoff,distance));
}
struct SurfaceVarying {
  @builtin(position) clip:vec4<f32>,
  @location(0) relative:vec3<f32>, @location(1) radial:vec3<f32>,
  @location(2) @interpolate(flat) level:u32,
  @location(3) baseShape:vec4<f32>,
  @location(4) rock:vec4<f32>,
  @location(5) guideSlope:vec3<f32>,
}
@vertex fn planet_vertex(@builtin(vertex_index) index:u32,@builtin(instance_index) instance:u32)->SurfaceVarying {
  let tile=tiles[instance]; let divs=u32(frame.options.x); let row=divs+1u;
  let dir=tile_direction(tile,index,divs); let radius=frame.eye.w;
  // The footprint depends on position, so stitched edges agree across tiles.
  let lateral=length(dir*length(frame.eye.xyz)-frame.eye.xyz);
  let range=length(vec2<f32>(lateral,frame.options.w));
  let pixel=range*frame.forward.w;
  // Use a continuous footprint so shared edge vertices evaluate the same
  // octaves. Finer relief still contributes to per-pixel shading.
  let footprint=max(frame.surface.y*.75,detail_footprint(range,pixel));
  let side=i32(style.palette.z);
  let vertex=tile.pad0*row*row+index;
  var sample:vec4<f32>;
  var gradient:vec3<f32>;
  var rock:vec4<f32>;
  let uv=studio_uv(dir);
  if(proceduralTerrain){
    let packed=baseVertices[vertex];
    gradient=vec3<f32>(unpack2x16float(packed.y),unpack2x16float(packed.z).x);
    sample=vec4<f32>(bitcast<f32>(packed.x),studio_level(dir,radius,side,0,uv).gradient);
    let weights=unpack4x8unorm(packed.w);
    rock=weights/max(.01,dot(weights,vec4<f32>(1.0)));
  }else{
    let at=vertex*3u;
    sample=mix(bitcast<vec4<f32>>(baseVertices[at]),bitcast<vec4<f32>>(baseVertices[at+1u]),studio_lod_weight(pixel,radius,side));
    gradient=sample.yzw;
    rock=bitcast<vec4<f32>>(baseVertices[at+2u]);
  }
  let base=StudioNoise(sample.x,sample.yzw,0.0,uv);
  let s=planet_surface(dir,radius,bitcast<u32>(frame.options.y),footprint,0.0,base,rock,7u,style.detail,
    vec3<f32>(style.modes.xy,style.lunarMaterial.y));
  let spring=district_material(s.uv,style.springChart,i32(style.world.y),0);
  let dune=district_material(s.uv,style.duneChart,i32(style.world.z),i32(style.world.w));
  let terrainHeight=district_height(s,district_flatness(spring.x,dune.xy))*style.world.x;
  let height=select(terrainHeight,max(terrainHeight,style.ocean.x),style.ocean.y>.5);
  let p=(dir*radius-frame.eye.xyz)+dir*height;
  var clip=frame.vp*vec4<f32>(p,1);
  clip.z=(clip.z+clip.w)*.5;
  return SurfaceVarying(clip,p,dir,tile.level,vec4<f32>(sample.x,gradient),rock,sample.yzw);
}
fn satellite_color(palette:vec3<f32>,radial:vec3<f32>,surface:PlanetSurface,mode:f32,pixel:f32)->vec3<f32>{
  let seed=u32(style.modes.z)|(u32(style.modes.w)<<16u);
  let district=planet_noise(radial*3.4,seed+6211u).value;
  let grain=planet_noise(radial*15.0,seed+8119u).value;
  let soil=.75*district+.25*grain;
  if(mode==1.0){
    let dune=smoothstep(-.07,.31,-soil-.12*surface.value);
    return mix(palette,vec3<f32>(.19,.14,.071),.72*dune);
  }
  if(mode==2.0){
    let sulfur=mix(vec3<f32>(.50,.14,.031),vec3<f32>(.83,.64,.24),smoothstep(-.12,.27,soil));
    let frost=smoothstep(.14,.37,district+.16*grain);
    let deposits=mix(sulfur,vec3<f32>(.55,.48,.57),frost);
    let lava=smoothstep(.18,.46,grain-.14*district)*smoothstep(.27,.79,surface.rock.w);
    return mix(mix(palette,deposits,.77),vec3<f32>(.064,.050,.047),.92*lava);
  }
  let texel=pixel/frame.eye.w;
  let patches=planet_noise(radial*42.0,seed+12473u).value*(1.0-smoothstep(.005,.018,texel));
  var chips=0.0;
  if(texel<.006){
    chips=planet_noise(radial*139.0,seed+19603u).value*(1.0-smoothstep(.0017,.006,texel));
  }
  if(mode==3.0){
    let basinBias=.12*clamp(surface.value,-1.0,1.0);
    let sheet=smoothstep(-.25,-.09,.88*district+.23*grain+.10*patches+.045*chips-basinBias);
    let glacier=studio_deposits(surface.uv);
    let ice=smoothstep(.11,.62,glacier);
    let fractures=1.0-smoothstep(.015,.12,abs(.71*patches+.29*chips));
    let plain=mix(vec3<f32>(.76,.81,.85),vec3<f32>(.96,.97,.94),smoothstep(-.24,.28,grain+.24*patches));
    let flow=mix(vec3<f32>(.29,.52,.64),vec3<f32>(.73,.87,.90),smoothstep(.18,.78,glacier))*
      (1.0-.14*fractures*abs(patches)*3.0);
    let rust=mix(vec3<f32>(.23,.026,.018),vec3<f32>(.59,.135,.060),
      smoothstep(-.30,.26,.44*grain+.37*patches+.19*chips));
    return mix(mix(palette,rust,.91),mix(plain,flow,ice),max(.96*sheet,ice));
  }
  let tone=smoothstep(-.17,.17,.77*district+.46*grain+.16*patches);
  let wear=smoothstep(-.33,.27,.48*grain+.44*patches+.18*chips);
  let slate=mix(vec3<f32>(.034,.074,.155),vec3<f32>(.166,.269,.412),wear);
  let oxidized=mix(vec3<f32>(.20,.045,.029),vec3<f32>(.53,.179,.092),wear);
  let regolith=mix(slate,oxidized,tone);
  let displacement=studio_deposits(surface.uv);
  let floor=smoothstep(.03,.36,-displacement);
  let rim=smoothstep(.022,.19,displacement);
  let saltNoise=planet_noise(radial*47.0,seed+49253u).value;
  let salts=smoothstep(.22,.49,.78*saltNoise+.27*grain)*smoothstep(.14,.42,-displacement);
  let rock=mix(palette,regolith,.97)*(1.0+.23*patches+.14*chips+.26*rim-.32*floor);
  return mix(rock,vec3<f32>(.58,.56,.50),.60*salts);
}
fn frost_margin(dir:vec3<f32>,height:f32)->f32{
  let latitude=dot(dir,style.climate.xyz);
  let wind=sin(dot(dir,vec3<f32>(9,4,-7))+14.0*style.climate.x);
  return height-style.climate.w+1.08*latitude*latitude-.115*wind;
}

fn ocean_color(radial:vec3<f32>,view:vec3<f32>,depth:f32,pixel:f32,bottom:vec3<f32>,shoal:f32,visibility:f32)->vec3<f32>{
  var n=radial;
  if(pixel<5.0){
    let p=radial*frame.eye.w;
    let ripple=planet_noise(p/17.0,2501u).slope;
    n=normalize(radial-.055*(ripple-radial*dot(ripple,radial))*(1.0-smoothstep(2.0,5.0,pixel)));
  }
  let clarity=exp(-depth*style.shallowWater.w);
  let depthMix=1.0-exp(-depth*style.deepWater.w);
  let water=mix(mix(style.shallowWater.xyz,style.deepWater.xyz,depthMix),style.coastShoal.xyz,.43*shoal)+
    bottom*.29*clarity;
  let facing=max(0.0,dot(n,view));
  let fresnel=.025+.72*pow(1.0-facing,5.0);
  let reflection=sky_air_color(radial,reflect(-view,n))*.66;
  let day=dot(radial,sun());
  let glint=.30*pow(max(0.0,dot(n,normalize(view+sun()+vec3<f32>(1e-6)))),115.0)*
    visibility*smoothstep(-.008,.09,day);
  let light=solar_light(day,max(0.0,dot(n,sun())),visibility,.30);
  return mix(water*light,reflection,fresnel)+glint*mix(frame.dusk.xyz,vec3<f32>(1.0),smoothstep(0.0,.34,day));
}
@fragment fn planet_fragment(v:SurfaceVarying)->@location(0) vec4<f32> {
  let radial=normalize(v.radial);
  let distance=length(v.relative);
  let view=-v.relative/max(distance,1e-3);
  // A smooth angular footprint keeps octave transitions off triangle edges.
  let facing=dot(view,radial);
  let pixel=distance*frame.forward.w*inverseSqrt(max(.20,abs(facing)));
  let materialPixel=pixel;
  if(frame.options.z>.5) {
    return vec4<f32>(.45+.4*cos(vec3<f32>(0,2,4)+f32(v.level)*.85),1);
  }
  // Keep projected-pixel filtering while allowing kilometer-scale relief
  // to show beneath the camera during an orbital approach.
  let orbit=frame.surface.x*smoothstep(.57,.95,facing)*
    smoothstep(.81,.985,dot(-view,frame.forward.xyz));
  let reliefPixel=max(pixel,max(0.0,distance-420.0)*mix(.002,.00068,orbit));
  let side=i32(style.palette.z);
  let satellite=style.lunarMaterial.z;
  let craterLight=select(0.0,smoothstep(15000.0,48000.0,distance),satellite==4.0);
  var base:StudioNoise;
  var provinceRock:vec4<f32>;
  var craterSlope=vec3<f32>(0.0);
  if(proceduralTerrain){
    base=StudioNoise(v.baseShape.x,v.guideSlope,0.0,studio_uv(radial));
    provinceRock=v.rock;
    if(craterLight>0.0){
      // Resolve impact rims from the filtered height field even when the
      // orbital mesh is too coarse to carry their slopes at each vertex.
      let crater=studio_noise(radial,frame.eye.w,side,pixel);
      base.concavity=crater.concavity*craterLight;
      craterSlope=crater.gradient*studioReliefMeters;
    }
  }else{
    base=studio_noise(radial,frame.eye.w,side,pixel);
    provinceRock=studio_regions(base.uv,side,style.ocean.z>.5,style.ocean.w>.5);
  }
  let material=planet_surface(radial,frame.eye.w,bitcast<u32>(frame.options.y),reliefPixel,materialPixel,
    base,provinceRock,9u,style.detail,vec3<f32>(style.modes.xy,style.lunarMaterial.y));
  let spring=district_material(material.uv,style.springChart,i32(style.world.y),0);
  let dune=district_material(material.uv,style.duneChart,i32(style.world.z),i32(style.world.w));
  let flatness=district_flatness(spring.x,dune.xy);
  var slope=mix(material.gradient,material.baseGradient,flatness);
  if(proceduralTerrain){
    slope+=(v.baseShape.yzw-v.guideSlope)*studioReliefMeters;
    slope=mix(slope,craterSlope,.86*craterLight);
  }
  var windblown=0.0;
  if(satellite!=4.0 && style.detail.y>0.0 && abs(radial.y)<.81 && material.rock.y+material.rock.z+material.rock.w>.20){
    let seed=u32(style.modes.z)|(u32(style.modes.w)<<16u);
    let dryness=studio_dryness(radial,material.rock,seed)*style.detail.y;
    let sheltered=1.0-smoothstep(.34,.92,length(material.baseGradient)*style.world.x);
    windblown=smoothstep(.11,.59,dryness)*sheltered*(1.0-smoothstep(.22,.64,material.value));
    if(windblown>.07 && materialPixel<5.0){
      let wind=studio_wind_dir(seed);
      let ripple=dot(radial,wind)*frame.eye.w*.86+3.4*material.mineral;
      slope+=wind*.065*cos(ripple)*(1.0-smoothstep(.9,5.0,materialPixel))*windblown;
    }
  }
  if(dune.x>.08 && materialPixel<5.0){
    let wind=style.duneWind.xyz;
    let p=radial*frame.eye.w;
    let warp=planet_noise(p/55.0,4109u).value;
    let wave=1.37*dot(p,wind)+3.8*warp;
    let fade=1.0-smoothstep(.8,5.0,materialPixel);
    slope+=wind*(.14*cos(wave)+.036*cos(wave*2.13))*fade*dune.x;
  }
  let tangent=slope-radial*dot(radial,slope);
  let nearDetail=1.0-smoothstep(2500.0,55000.0,distance);
  let orbitalRelief=select(0.0,select(.52,1.28,satellite==4.0),satellite>=3.0)*
    (1.0-smoothstep(5.0,11.0,distance/frame.eye.w));
  let flyoverFade=smoothstep(35000.0,210000.0,distance);
  let normalDetail=max(orbitalRelief,1.0-flyoverFade*(1.0-.80*orbit));
  let normal=normalize(radial-tangent*(normalDetail*style.world.x));
  let steepness=1.0-max(0.0,dot(radial,normal));
  let parentSlope=material.baseGradient*style.world.x;
  let slopeCover=mix(1.0-inverseSqrt(1.0+dot(parentSlope,parentSlope)),steepness,.58);
  let footprint=max(materialPixel,reliefPixel*.30);
  var mottling=0.0;
  var grit=0.0;
  if(footprint<110.0 && distance<58000.0){
    let p=radial*(frame.eye.w+material.height*style.world.x);
    mottling=planet_noise(p/160.0,18461u).value*(1.0-smoothstep(32.0,110.0,footprint))*nearDetail;
    if(footprint<7.5){
      grit=planet_noise(p/9.0,14627u).value*(1.0-smoothstep(2.5,7.5,footprint));
    }
  }
  let mountain=material.rock.x;
  let rock=material.rock;
  let variance=style.detail.y;
  let exposureRange=mix(nearDetail,1.0-smoothstep(8000.0,85000.0,distance),mountain);
  let bare=dot(rock.yzw,vec3<f32>(.47,.62,.71))*variance;
  let cover=smoothstep(-.34,.58,material.value+.95*material.patina);
  let exposed=exposureRange*max(bare*mix(.53,1.0,cover),
    smoothstep(.047,.30,slopeCover-.11*material.patina+.12*mottling));
  let shade=mix(.24,.29,nearDetail)-.065*exposed;
  let basin=smoothstep(.018,.19,material.basin)*(1.0-smoothstep(17000.0,85000.0,distance));
  let diffuse=max(0.0,dot(normal,sun()));
  let day=dot(radial,sun());
  var visibility=1.0;
  if(day>-.008&&day<.94){visibility=shadow_visibility(material.uv);}
  let ambient=shade*clamp(1.0-material.shelter*nearDetail-.40*basin,.25,1.0);
  let light=solar_light(day,diffuse,visibility,ambient);
  let pigment=material.patina*nearDetail;
  var palette=preset_color(material.value+.16*pigment,nearDetail);
  if(satellite>0.0){palette=satellite_color(palette,radial,material,satellite,pixel);}
  // Carry the planet's hue into each rock family while keeping light and
  // dark minerals distinct, even where the preset ramp is very saturated.
  let paletteTint=mix(vec3<f32>(1),clamp((palette+.065)/(dot(palette,vec3<f32>(.30,.50,.20))+.065),
    vec3<f32>(.45),vec3<f32>(1.65)),.52);
  let weathering=smoothstep(-.12,.14,material.mineral+.30*pigment);
  let lowland=smoothstep(-.34,.10,-material.value+.12*material.patina);
  let alpine=mix(vec3<f32>(.17,.24,.13),vec3<f32>(.083,.15,.10),lowland);
  let sandstone=mix(vec3<f32>(.31,.137,.065),vec3<f32>(.51,.32,.17),mix(weathering,lowland,.32));
  let granite=mix(vec3<f32>(.23,.26,.28),vec3<f32>(.45,.38,.30),weathering);
  let volcanic=mix(vec3<f32>(.042,.050,.062),vec3<f32>(.21,.102,.060),weathering);
  let province=rock.x*alpine+rock.y*sandstone+rock.z*granite+rock.w*volcanic;
  let lunar=style.lunarMaterial.x;
  let paletteAuthority=max(lunar,select(0.0,.82,satellite>0.0));
  let regionalColor=(mix(.45,.59,nearDetail)+rock.w*mix(.07,.17,nearDetail))*(1.0-.88*paletteAuthority);
  let host=mix(palette,province*paletteTint,regionalColor);
  let retained=1.0-smoothstep(.024,.195,slopeCover+.066*mottling);
  let growth=style.duneWind.w*retained*dot(rock,vec4<f32>(1.0,.32,.60,.12))*exposureRange*
    (1.0-smoothstep(.62,1.46,material.value+.12*mottling));
  let turf=mix(vec3<f32>(.062,.102,.043),vec3<f32>(.145,.183,.073),
    smoothstep(-.34,.43,.61*mottling+.39*material.patina+.16*lowland));
  let drySediment=retained*exposureRange*(1.0-style.duneWind.w)*(1.0-paletteAuthority)*dot(rock,vec4<f32>(.29,.72,.18,.08));
  let dust=mix(vec3<f32>(.27,.20,.13),vec3<f32>(.43,.34,.22),weathering);
  let baseColor=mix(mix(host,dust*paletteTint,drySediment*.58),turf*paletteTint,growth*.88)*
    (1.0+.16*mottling+.095*grit);
  let slate=mix(vec3<f32>(.125,.16,.20),vec3<f32>(.29,.28,.245),weathering);
  var rockColor=rock.x*slate+rock.y*sandstone+rock.z*(granite*1.10)+rock.w*(volcanic*.73);
  var strata=0.0;
  if(exposed>.02 && rock.y>.03 && reliefPixel<680.0){
    // Pigment follows the same tilted, nonuniform formation as the baked ledges.
    let seed=u32(style.modes.z)|(u32(style.modes.w)<<16u);
    let bed=canyon_bed(radial,material.value,seed);
    let thickness=bed.thickness*studioReliefMeters*style.world.x;
    let visible=1.0-smoothstep(.12,.44,reliefPixel/max(1.0,thickness));
    let stain=clamp(.16+.70*bed.iron+.22*material.mineral,0.0,1.0);
    let bedPigment=mix(vec3<f32>(.56,.405,.235),vec3<f32>(.34,.112,.048),stain);
    let mainRib=smoothstep(.25,.48,bed.phase)*(1.0-smoothstep(.66,.86,bed.phase));
    let ribs=max(mainRib,.68*bed.lowerShelf);
    let wall=smoothstep(.025,.24,steepness);
    let cap=wall*ribs*smoothstep(.24,.81,bed.cement);
    let underside=smoothstep(.43,.59,bed.phase)*(1.0-smoothstep(.60,.72,bed.phase));
    let varnish=wall*underside*smoothstep(.47,.84,bed.iron)*bed.cement;
    let ledgeColor=bedPigment*mix(vec3<f32>(1),vec3<f32>(1.13,1.05,.92),cap)*
      mix(vec3<f32>(1),vec3<f32>(.72,.65,.58),varnish*.68);
    rockColor=mix(rockColor,ledgeColor,rock.y*visible*.64);
    strata=mix(.18,.27,wall)*rock.y*visible*(ribs-.38)*bed.cement;
  }
  if(exposed>.02 && reliefPixel<130.0){
    let bedHeight=material.height*style.world.x+frame.eye.w*dot(radial,vec3<f32>(.17,-.14,.09));
    let broad=cos(6.2831853*(bedHeight/310.0+1.8*material.mineral));
    let fine=cos(6.2831853*(bedHeight/84.0+3.0*material.mineral));
    let bedExposure=smoothstep(-.10,.12,material.mineral)*.42*(1.0-rock.y-.78*rock.w);
    strata+=bedExposure*(.09*broad*(1.0-smoothstep(35.0,130.0,reliefPixel))+
      .065*fine*(1.0-smoothstep(10.0,35.0,reliefPixel)));
  }
  let sediment=smoothstep(.014,.13,material.shelter)*exposureRange;
  let volcanicBedding=rock.w*min(1.28,.81+1.6*rock.x*variance);
  if(volcanicBedding>.035 && exposed>.015 && reliefPixel<620.0){
    let seed=u32(style.modes.z)|(u32(style.modes.w)<<16u);
    let bed=basalt_flow(radial,material.value,seed);
    let thickness=bed.thickness*studioReliefMeters*style.world.x;
    let visible=volcanicBedding*(1.0-smoothstep(.13,.52,reliefPixel/max(1.0,thickness)))*
      (1.0-smoothstep(280.0,620.0,reliefPixel));
    let basalt=mix(vec3<f32>(.060,.073,.088),vec3<f32>(.22,.15,.115),weathering*.68);
    let ash=mix(vec3<f32>(.25,.233,.213),vec3<f32>(.37,.241,.155),weathering);
    rockColor=mix(rockColor,ash,visible*max(.68*bed.ash,.28*sediment*(1.0-bed.cap)));
    rockColor=mix(rockColor,basalt,visible*.84*bed.cap);
  }
  let bedColor=mix(.60,.78,rock.y+rock.z);
  let stoneTint=mix(rockColor*paletteTint,palette*mix(.60,1.12,weathering),paletteAuthority);
  let stone=mix(baseColor,stoneTint,bedColor)*
    (1.0+strata+.40*mountain*sediment+.28*mottling+.30*grit);
  let localLight=rock_visibility(v.relative+frame.eye.xyz,distance);
  var color=mix(baseColor,stone,exposed)*light*clamp(1.0+pigment,.62,1.25)*localLight;
  if(windblown>.01){
    let ochre=mix(vec3<f32>(.46,.33,.17),vec3<f32>(.41,.235,.11),weathering);
    let sand=mix(ochre,vec3<f32>(.17,.145,.113),.88*rock.w);
    color=mix(color,mix(sand*paletteTint,baseColor,.26)*light*localLight,.73*windblown);
  }
  if(style.lunarMaterial.w==0.0 && distance<95000.0 && steepness<.17){
    let alluvium=studio_deposits(material.uv);
    if(alluvium>.015){
      let rockDust=mix(vec3<f32>(.35,.30,.22),vec3<f32>(.52,.30,.17),rock.y);
      let gravel=mix(rockDust,vec3<f32>(.16,.18,.19),.86*rock.w);
      let gravelShade=mix(mix(gravel*paletteTint,baseColor,.32),gravel*paletteTint,.58*weathering);
      let spread=smoothstep(.015,.58,alluvium)*(1.0-smoothstep(.04,.17,steepness));
      color=mix(color,gravelShade*light*localLight,.74*spread*(1.0-smoothstep(42000.0,95000.0,distance)));
    }
  }
  let depth=style.ocean.x-district_height(material,flatness)*style.world.x;
  let shoalDepth=style.coastShoal.w*max(.35,style.world.x);
  var shoal=0.0;
  if(shoalDepth>0.0 && style.ocean.y>.5 && depth<shoalDepth && materialPixel<940.0){
    // World-space bands give neighboring beaches different deposits and
    // fade out before the grain becomes smaller than a pixel.
    let seed=bitcast<u32>(frame.options.y);
    let point=radial*frame.eye.w;
    let bedVariation=planet_noise(point/1850.0,seed+3527u).value;
    let textureFade=1.0-smoothstep(340.0,940.0,materialPixel);
    var grains=0.0;
    if(materialPixel<72.0){
      grains=planet_noise((octaveTwist*point)/145.0,seed+2011u).value*
        (1.0-smoothstep(22.0,72.0,materialPixel));
    }
    let sheltered=1.0-smoothstep(.035,.22,slopeCover);
    let sedimentPatch=smoothstep(-.26,.44,bedVariation+.43*grains+.12*material.patina);
    if(depth>0.0){
      let reefBand=smoothstep(0.0,.19,depth/shoalDepth)*
        (1.0-smoothstep(.38,1.0,depth/shoalDepth));
      shoal=reefBand*sedimentPatch*mix(.26,1.0,sheltered)*textureFade;
    }else{
      let coast=1.0-smoothstep(.12,1.65,-depth/shoalDepth);
      let outcrop=smoothstep(.04,.26,slopeCover+.13*bedVariation);
      let deposits=sheltered*sedimentPatch;
      let rockTint=mix(style.coastSediment.xyz,style.coastOutcrop.xyz,outcrop);
      let brightness=1.0+.32*grains+.13*mottling+.14*grit;
      let coverage=textureFade*(.31*coast+.19*outcrop+.21*deposits)*
        mix(.45,1.0,max(deposits,outcrop));
      color=mix(color,rockTint*light*localLight*brightness,coverage);
    }
  }
  if(style.climate.w>0.0){
    let cold=frost_margin(radial,material.value)+.13*material.mineral+.19*sediment;
    let pack=smoothstep(.04,.39,cold)*(1.0-smoothstep(.045,.27,steepness));
    let ice=smoothstep(.16,.47,cold)*sediment;
    let frozen=mix(vec3<f32>(.70,.76,.81),vec3<f32>(.27,.46,.57),.64*ice);
    color=mix(color,frozen*light*localLight,.91*pack);
  }
  if(dune.x+dune.y>0.0){
    let sand=mix(vec3<f32>(.57,.31,.115),vec3<f32>(.10,.095,.09),smoothstep(.19,.83,dune.z));
    let saltBase=mix(vec3<f32>(.74,.69,.54),vec3<f32>(.60,.69,.68),dune.z);
    var salt=saltBase;
    if(dune.y>.04 && materialPixel<210.0){
      let p=radial*frame.eye.w;
      let tint=planet_noise(p/825.0,5171u).value;
      var crust=0.0;
      if(materialPixel<40.0){
        crust=planet_noise(p/85.0,7019u).value*(1.0-smoothstep(12.0,40.0,materialPixel));
      }
      let minerals=smoothstep(-.23,.45,tint+.31*crust);
      salt=mix(saltBase,vec3<f32>(.64,.43,.34),.37*minerals*(1.0-smoothstep(.62,.97,dune.y)));
      salt*=1.0+.13*tint+.08*crust;
    }
    color=mix(color,sand*paletteTint*light*(.96+.14*pigment),smoothstep(.035,.65,dune.x)*.96);
    color=mix(color,salt*mix(vec3<f32>(1),paletteTint,.45)*light,smoothstep(.035,.82,dune.y)*.94);
  }
  if(spring.x+spring.y>0.0){
    let ivory=vec3<f32>(.74,.64,.47);
    let ochre=vec3<f32>(.68,.23,.045);
    let deposit=mix(ivory,ochre,smoothstep(.14,.78,spring.z));
    color=mix(color,deposit*light*(.90+.36*pigment),spring.y*.92);
    let pool=mix(vec3<f32>(.12,.59,.48),vec3<f32>(.014,.23,.27),smoothstep(.20,.95,spring.x));
    let facing=max(0.0,dot(radial,view));
    let reflection=sky_air_color(radial,reflect(-view,radial));
    let sheen=.04+.39*pow(1.0-facing,4.0);
    let water=mix(pool*solar_light(day,max(0.0,day),visibility,.30),reflection,sheen);
    color=mix(color,water,smoothstep(.03,.76,spring.x));
  }
  var shoreBed=baseColor;
  let shoreWidth=212.34*style.world.x;
  if(style.ocean.y>.5 && abs(depth)<shoreWidth*2.0){
    let sheltered=(1.0-smoothstep(.012,.17,steepness))*mix(.56,1.0,sediment);
    let shore=1.0-smoothstep(.18,1.0,abs(depth)/shoreWidth);
    let shingle=mix(vec3<f32>(.30,.34,.33),vec3<f32>(.45,.29,.145),rock.y);
    let sand=mix(shingle,vec3<f32>(.105,.105,.095),rock.w);
    let bed=mix(sand*paletteTint,baseColor,.31);
    color=mix(color,bed*light,shore*sheltered*.72);
    shoreBed=mix(baseColor,bed,sheltered*(1.0-smoothstep(.12,2.0,max(0.0,depth)/shoreWidth)));
  }
  if(style.ocean.y>.5 && depth>0.0){
    color=mix(color,ocean_color(radial,view,depth,pixel,shoreBed,shoal,visibility),smoothstep(0.0,max(2.0,pixel*.15),depth));
  }
  color=mix(color,sky_air_color(radial,-view),terrain_haze(radial,-view,distance));
  return vec4<f32>(pow(color,vec3<f32>(1.0/2.2)),1);
}
`;var Fr=`struct RockVarying {
  @builtin(position) clip:vec4<f32>,
  @location(0) relative:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) bed:vec2<f32>,
}
@vertex fn rock_vertex(
  @location(0) world:vec3<f32>, @location(1) normal:vec3<f32>, @location(2) bed:vec2<f32>
)->RockVarying{
  let relative=world-frame.eye.xyz;
  var clip=frame.vp*vec4<f32>(relative,1);
  clip.z=(clip.z+clip.w)*.5;
  return RockVarying(clip,relative,normal,bed);
}
@fragment fn rock_fragment(v:RockVarying)->@location(0) vec4<f32>{
  let world=v.relative+frame.eye.xyz;
  let up=normalize(world);
  let n=normalize(v.normal);
  let detail=1.0-smoothstep(2.0,9.0,max(length(dpdx(v.relative)),length(dpdy(v.relative))));
  let weather=planet_noise(world/86.0,3401u).value;
  let grain=planet_noise(world/14.0,2619u);
  let face=normalize(n-detail*.15*(grain.slope-n*dot(grain.slope,n)));
  let bed=v.bed.x*19.0+weather*.70;
  let stratum=.78+.22*smoothstep(-.50,.68,sin(bed)+.31*sin(bed*2.74));
  let basalt=vec3<f32>(.18,.17,.15);
  let sandstone=mix(vec3<f32>(.46,.25,.13),vec3<f32>(.54,.36,.23),smoothstep(-.3,.42,weather));
  let stone=mix(basalt,sandstone,v.bed.y);
  let elevation=(length(world)-frame.eye.w)/(studioReliefMeters*style.world.x);
  let ground=preset_color(elevation,1.0);
  let rooted=mix(.24,.83,smoothstep(-.22,.60,v.bed.x));
  let color=mix(ground,stone,rooted)*mix(1.0,stratum,rooted)*(1.0+.13*grain.value*detail);
  let above=dot(up,face);
  let diffuse=max(0.0,dot(face,sun()));
  let day=dot(up,sun());
  var visibility=1.0;
  if(day>-.008&&day<.94){visibility=shadow_visibility(studio_uv(up));}
  let light=solar_light(day,diffuse,visibility,.26*(.66+.34*max(0.0,above)));
  let ray=normalize(v.relative);
  let haze=terrain_haze(up,ray,length(v.relative));
  return vec4<f32>(pow(mix(color*light,sky_air_color(up,ray),haze),vec3<f32>(1.0/2.2)),1.0);
}
`;var Ir=`struct SkyVertex { @builtin(position) clip:vec4<f32>, @location(0) uv:vec2<f32> }
@vertex fn sky_vertex(@builtin(vertex_index) i:u32)->SkyVertex {
  let uv=array<vec2<f32>,3>(vec2<f32>(-1,-1),vec2<f32>(3,-1),vec2<f32>(-1,3));
  return SkyVertex(vec4<f32>(uv[i],.999999,1),uv[i]);
}
@fragment fn sky_fragment(v:SkyVertex)->@location(0) vec4<f32> {
  let ray=normalize(frame.forward.xyz+frame.right.xyz*v.uv.x*frame.right.w+
    frame.up.xyz*v.uv.y*frame.up.w);
  let eye=frame.eye.xyz; let r=frame.eye.w;
  let altitude=max(0.0,length(eye)-r);
  let air=exp(-altitude/18000.0)*frame.air.w;
  let up=normalize(eye);
  let day=dot(up,sun());
  let color=sky_air_color(up,ray)*air;
  let star=pow(clamp((planet_hash(vec3<i32>(floor(ray*1024.0)),58u)-.9965)/.0035,0.0,1.0),3.0)*.46;
  let opaqueAir=(1.0-smoothstep(10000.0,52000.0,altitude))*frame.air.w;
  let starVisibility=1.0-clamp(opaqueAir*smoothstep(-.20,.08,day),0.0,1.0);
  var result=vec3<f32>(.0007,.0012,.0025)+star*starVisibility*starVisibility+color;
  let closest=length(cross(eye,ray));
  let limb=(1.0-smoothstep(r+500.0,r+7000.0,closest))*
    smoothstep(r-5500.0,r+500.0,closest)*step(dot(eye,ray),0.0)*smoothstep(14000.0,44000.0,altitude);
  let limbUp=normalize(eye-ray*dot(eye,ray)+vec3<f32>(1e-6));
  result+=sky_air_color(limbUp,ray)*limb*frame.air.w;
  let sunAngle=length(ray-sun());
  let pixel=max(.0004,frame.forward.w*.65);
  let disk=1.0-smoothstep(max(0.0,.013-pixel),.013+pixel,sunAngle);
  let halo=exp(-sunAngle*18.0)*.24*air;
  let sunColor=mix(mix(vec3<f32>(1.0,.31,.11),frame.dusk.xyz,.40),vec3<f32>(1.0,.91,.70),
    mix(smoothstep(-.04,.35,day),1.0,1.0-clamp(air,0.0,1.0)));
  result+=(disk*2.2+halo)*sunColor;
  return vec4<f32>(pow(clamp(result,vec3<f32>(0),vec3<f32>(1)),vec3<f32>(1.0/2.2)),1);
}
`;var Nr=`@group(0) @binding(0) var sunMap: texture_storage_2d<rgba8unorm,write>;
struct ShadowParams { ocean:vec4<f32>, light:vec4<f32> }
@group(0) @binding(1) var<uniform> shadow:ShadowParams;

fn shadow_height(dir:vec3<f32>, side:i32)->f32{
  let last=side-1;
  let p=studio_uv(dir)*f32(last);
  let cell=vec2<i32>(floor(p));
  let f=fract(p);
  let x=cell.x%last;
  let next=(x+1)%last;
  let y=min(cell.y,last)*side;
  let row=min(cell.y+1,last)*side;
  return mix(mix(studioHeights[y+x],studioHeights[y+next],f.x),
    mix(studioHeights[row+x],studioHeights[row+next],f.x),f.y);
}

@compute @workgroup_size(8,8,1)
fn bake_sun_visibility(@builtin(global_invocation_id) id:vec3<u32>){
  let size=textureDimensions(sunMap);
  if(any(id.xy>=size)){return;}
  let uv=(vec2<f32>(id.xy)+.5)/vec2<f32>(size);
  let phi=uv.x*6.283185307179586;
  let theta=uv.y*3.141592653589793;
  let dir=vec3<f32>(sin(theta)*cos(phi),cos(theta),sin(theta)*sin(phi));
  let light=shadow.light.xyz;
  let day=dot(light,dir);
  let traceWeight=smoothstep(-.06,.045,day)*(1.0-smoothstep(.81,.94,day));
  var visibility=1.0;
  if(traceWeight>0.0){
    let side=i32(round(sqrt(f32(arrayLength(&studioHeights)))));
    // Trace the sun ray in radius-relative space, including planet curvature.
    let scale=.023*shadow.ocean.z;
    let ground=scale*shadow_height(dir,side);
    let surface=select(ground,max(ground,shadow.ocean.x),shadow.ocean.y>.5);
    let origin=dir*(1.0+surface);
    var distance=.0055;
    for(var i=0u;i<10u;i++){
      let samplePoint=origin+light*distance;
      let sampleRadius=length(samplePoint);
      let terrainRadius=1.0+scale*shadow_height(samplePoint/sampleRadius,side);
      let block=smoothstep(.00065,.0013+.009*distance,terrainRadius-sampleRadius);
      visibility=min(visibility,1.0-block);
      if(visibility<=.005){break;}
      distance*=1.55;
    }
  }
  textureStore(sunMap,vec2<i32>(id.xy),vec4<f32>(mix(1.0,visibility,traceWeight),0,0,1));
}
`;function Wr(i){if(!Number.isSafeInteger(i))throw new RangeError("Use an integer planet seed.");return i>>>0}var Ca=512,Aa=72,ls=[.032,.16,.17,.008],cs=[.009,.038,.073,.0019],fs=i=>i/$e,Lr=i=>i<$e*.5?1536:void 0,us=16e6,mi=Da+Rr,vi=64,Ra=i=>(i+1)**2,xi=i=>i==="procedural"?16:48,Er=i=>i+Math.min(i,vi);function gi(i){if(i!=="cached"&&i!=="procedural")throw new RangeError("Choose cached or procedural terrain sampling.");return i}var yi=class{constructor(e,t={}){this.canvas=e,this.options={radius:$e,seed:ja,studioSeed:t.seed??123456789,divs:16,maxTiles:576,minSpacing:2,...t,landmarkPatches:t.landmarkPatches??!1};let{radius:a,divs:r,maxTiles:o,minSpacing:s}=this.options,c=Math.min(65535,Math.floor(us/Ra(r)));if(!(Number.isFinite(a)&&a>=16384&&a<=2e6&&[8,16,32].includes(r)&&Number.isInteger(o)&&o>=24&&o<=c&&Number.isFinite(s)&&s>=.5&&s<=a))throw new RangeError(`Use a radius of 16,384\u20132,000,000 m, 8/16/32 divisions, 24\u2013${c} tiles and valid spacing.`);if(this.pixelError=3,this.lodScale=1.5,this.tileBudget=t.tileBudget??o,!Number.isInteger(this.tileBudget)||this.tileBudget<24||this.tileBudget>o)throw new RangeError("Tile budget must be between 24 and the allocated maximum.");this.reliefCache=new Map,this.profile=ht(t.preset),this.activeStudioSeed=Wr(t.studioSeed??this.options.studioSeed+this.profile.seedOffset),this.detail=Zt(t.detail),this.terrainSampling=gi(t.terrainSampling??"cached"),this.startupPreview=t.progressiveStartup===!0,this.terrainPipelines=new Map,this.requestedWorld={profile:this.profile,seed:this.studioSeed,detail:this.detail,radius:a,terrainSampling:this.terrainSampling},this.studioRequest=0,this.studioQueue=Promise.resolve(),this.split=new Set,this.focalSplit=new Set,this.templates=new Map,this.rockSpans=[],this.terrainTriangles=0,this.stats={gpuMs:null,patchGpuMs:null,patchGpuTiles:0,planBuilds:0},this.errors=[],this.lastSelect=-1/0,this.dirty=!0,this.frame=new Float32Array(52),this.words=new Uint32Array(this.frame.buffer)}async initialize(){let e=Er(this.options.maxTiles)*Ra(this.options.divs)*xi("cached"),t=await Ti(this,{preferredStorageBufferSize:e>128*1024**2?e:0}),a=this.maxTileBudget();if(a<24||this.options.tileBudget!==void 0&&this.tileBudget>a)throw new RangeError(`This GPU supports up to ${a} ${this.terrainSampling} terrain patches.`);this.tileBudget=Math.min(this.tileBudget,a),this.noiseBuilder=new _a(t,t.queue),this.geology=this.profile.geology,this.sunMap=t.createTexture({label:"Planet sun visibility snapshots",size:[Ca,Ca,2],format:"rgba8unorm",usage:GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.sunView=this.sunMap.createView({dimension:"2d-array"}),this.sunSampler=t.createSampler({addressModeU:"repeat",minFilter:"linear",magFilter:"linear"}),this.shadowParams=[0,1].map(()=>t.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST})),this.uniform=t.createBuffer({size:this.frame.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.styleBuffer=t.createBuffer({size:848,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.instances=t.createBuffer({size:this.options.maxTiles*32,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.records=new ArrayBuffer(this.instances.size);let r=this.options.maxTiles;this.tileJobRecords=new ArrayBuffer(r*Lt),this.tileJobBuffer=t.createBuffer({size:this.tileJobRecords.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.allocateTileSamples();let o=this.terrainLayout=t.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:3,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d-array"}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:6,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}}]}),s=t.createPipelineLayout({bindGroupLayouts:[o]});this.makeRenderPipeline=(D,_,S,{wire:k=!1,sky:g=!1,buffers:w=[],constants:P}={})=>t.createRenderPipelineAsync({label:`${_}${k?" wireframe":""}${P?P.proceduralTerrain?" procedural":" cached":""}`,layout:s,vertex:{module:D,entryPoint:_,buffers:w,constants:P},fragment:{module:D,entryPoint:S,targets:[{format:this.format}],constants:P},primitive:{topology:k?"line-list":"triangle-list",cullMode:!k&&!g&&!w.length?"back":"none"},depthStencil:{format:"depth24plus",depthWriteEnabled:!g,depthCompare:g?"always":"less"}});let c=this.requestedWorld,n=this.bakeWorld(c);this.studioQueue=n.then(()=>{},()=>{});let l=this.startupPreview,d=l&&this.makeRenderPipeline(t.createShaderModule({label:"Initial planet orbit",code:Et+bt+mi+Tr}),"orbit_vertex","orbit_fragment"),u=this.makeRenderPipeline(t.createShaderModule({label:"Planet atmosphere",code:Et+Ba+Ir}),"sky_vertex","sky_fragment",{sky:!0}),f=Promise.all([n,l?void 0:this.compileSunShadows(),!l&&c.terrainSampling==="cached"?this.cachedTilePipeline():void 0,l?d:this.terrainPipeline(c.terrainSampling),u,!l&&this.options.landmarkPatches?this.rockPipeline():void 0,l?void 0:this.terrainPipeline(c.terrainSampling,!0),!l&&this.options.landmarkPatches?this.rockPipeline(!0):void 0,l?void 0:this.prepareStudioVertices(c)]);l&&c.terrainSampling==="procedural"&&(this.startupVertices=Promise.all([d,u]).then(()=>{if(!this.disposed)return this.prepareStudioVertices(c)}).catch(()=>{}));try{this.options.onDeviceReady?.(this)}catch(D){throw await f.catch(()=>{}),D}let[p,x,y,m,M,h,v,b,z]=await f;return Object.assign(this,{sunBake:x,tileCompute:y,solid:m,sky:M,rockSolid:h,wire:v,rockWire:b,wireMode:v?c.terrainSampling:void 0}),this.uploadStudioMap(p,this.studioSeed),l?this.startupMap=p:(z&&this.uploadProceduralWorld(z,p,c),this.fitRockSpans()),this.uploadStyle(),t.features.has("timestamp-query")&&(this.queries=t.createQuerySet({type:"timestamp",count:4}),this.resolve=t.createBuffer({size:32,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),this.read=t.createBuffer({size:32,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})),this.frameIndex=0,this.lastPatchSample=-1/0,this.resize(),this}cachedTilePipeline(){let e=this.device;return this.cachedTileCompilation??=e.createComputePipelineAsync({layout:"auto",compute:{module:e.createShaderModule({label:"Cached planet patches",code:Et+bt+mi}),entryPoint:"bake_tile_vertices"}})}compileSunShadows(){return this.device.createComputePipelineAsync({layout:"auto",compute:{module:this.device.createShaderModule({code:bt+Nr}),entryPoint:"bake_sun_visibility"}})}terrainPipeline(e,t=!1){let a=`${e}:${t}`;return this.terrainPipelines.has(a)||(this.terrainModule??=this.device.createShaderModule({label:"Planet terrain",code:qt+Ft+Et+bt+mi+Ba+Cr+Ar+qr}),this.terrainPipelines.set(a,this.makeRenderPipeline(this.terrainModule,"planet_vertex","planet_fragment",{wire:t,constants:{proceduralTerrain:e==="procedural"}}))),this.terrainPipelines.get(a)}rockPipeline(e=!1){return this.rockModule??=this.device.createShaderModule({label:"Planet rock formations",code:Et+bt+Ba+Fr}),this.makeRenderPipeline(this.rockModule,"rock_vertex","rock_fragment",{wire:e,buffers:[{arrayStride:32,attributes:[{shaderLocation:0,format:"float32x3",offset:0},{shaderLocation:1,format:"float32x3",offset:12},{shaderLocation:2,format:"float32x2",offset:24}]}]})}finishStartup(){return this.startupCompletion??=this.upgradeOrbit()}async upgradeOrbit(){if(!this.startupPreview||this.disposed)return;let e=this.requestedWorld,[t,a,r,o]=await Promise.all([this.terrainPipeline(e.terrainSampling),this.options.landmarkPatches?this.rockPipeline():void 0,e.terrainSampling==="cached"?this.cachedTilePipeline():void 0,this.startupVertices?.then(s=>{if(!this.disposed)return s??this.prepareStudioVertices(e)})??this.prepareStudioVertices(e)]);this.startupVertices=null,!this.disposed&&(this.solid=t,this.rockSolid=a,this.tileCompute=r,this.startupPreview=!1,this.allocateTileSamples(!1),o&&this.uploadProceduralWorld(o,this.startupMap,e),this.startupMap=null,this.bundle=null,this.fitRockSpans(),this.uploadStyle(),this.compileSunShadows().then(s=>{this.disposed||(this.sunBake=s,this.bindSunShadows(this.studioMap.values.byteLength))}).catch(s=>{this.disposed||this.errors.push(s.message)}))}prepareStudioVertices(e){if(e.terrainSampling==="procedural")return this.studioVertices??=new ka(this.device),this.studioVertices.prepare(!!e.detail.noiseMix)}get preset(){return this.profile.id}get studioSeed(){return this.activeStudioSeed}get radius(){return this.options.radius}get detailSeed(){return this.studioSeed+this.options.seed}get usesProceduralTiles(){return!this.startupPreview&&this.terrainSampling==="procedural"}maxTileBudget(e=this.terrainSampling){if(gi(e),!this.device)return this.options.maxTiles;let t=this.device.limits,a=Math.min(t.maxStorageBufferBindingSize,t.maxBufferSize),r=Math.floor(a/(Ra(this.options.divs)*xi(e))),o=r>=2*vi?r-vi:Math.floor(r/2);return Math.min(this.options.maxTiles,t.maxComputeWorkgroupsPerDimension,o)}sampleSurface(e,t){return sr(e,this.options.radius,this.detailSeed,this.preset,this.studioMap,this.oceanLevel,this.geology,this.detail,t)}async probeSurface(e){if(this.terrainSampling!=="procedural")return this.sampleSurface(e);this.startupPreview&&await this.finishStartup();let t=this.studioMap,a=await this.studioVertices.probe(e);return t===this.studioMap&&Number.isFinite(a)?this.sampleSurface(e,a):null}bakeWorld({profile:e,seed:t,detail:a,radius:r,terrainSampling:o}){let s=o==="procedural",c=s?e.cryoGlaciers||e.craterDetail>=1?768:kr:this.options.atlasSegments??Lr(r);return Dr(this.noiseBuilder,{seed:t,erosion:!0,geology:e.geology,variation:a.variation,rangeWeight:ut[a.range],landscape:a.landscape,noiseMix:a.noiseMix,landscapeStrength:a.landscapeStrength,featureDensity:fs(r),oceanCoverage:e.dry?0:e.ocean?.coverage,lunar:e.lunar,craterDetail:e.craterDetail,cryoGlaciers:e.cryoGlaciers,landmarkPatches:this.options.landmarkPatches,segments:c,proceduralGuide:s})}uploadProceduralWorld(e,t,{radius:a,profile:r,seed:o,detail:s}){this.studioVertices.setWorld(e,t,a,r.geology,o,s,this.options.divs,this.options.atlasSegments??Lr(a)??1e3),this.studioVertices.bindTiles(this.tileJobBuffer,this.baseTileBuffer)}allocateTileSamples(e=!0,t=!1){let a=Er(this.tileBudget),r=Ra(this.options.divs)*xi(this.terrainSampling),o=this.startupPreview?16:a*r;if(this.baseTileBuffer?.size===o)return;let s=this.baseTileBuffer,c=t&&!this.startupPreview&&s?.size<o&&this.tileCache.slots.size>0;if(this.baseTileBuffer=this.device.createBuffer({size:o,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),c){let n=this.device.createCommandEncoder();n.copyBufferToBuffer(s,0,this.baseTileBuffer,0,this.tileCache.slots.size*r),this.device.queue.submit([n.finish()]),this.tileCache.capacity=a}else this.tileCache=new wa(a);this.studioBuffer&&this.bindTerrain(),this.usesProceduralTiles&&this.studioVertices?.guide&&this.studioVertices.bindTiles(this.tileJobBuffer,this.baseTileBuffer),this.state=null,this.bundle=null,e&&!c&&this.options.streamingLod&&(this.split.clear(),this.focalSplit.clear()),this.dirty=!0,s?.destroy()}sampleLandforms(e){let[t,a,r,o]=je(this.studioMap,e,this.geology);return{alpine:t,canyon:a,granite:r,volcanic:o}}fitRockSpans(){for(let t of this.rockSpans)t.vertices.destroy(),t.indices?.destroy();this.rockSpans=[];let e=this.options.radius;for(let t of this.studioMap.rockSpans??[]){let{direction:a,span:r,depth:o}=t,s=t.size*e/$e,c=s*t.rise*Math.sqrt(this.studioMap.reliefScale??1),n=(h,v)=>this.sampleSurface(Pe(a.map((b,z)=>b+v*s/e*h[z]))),l=n(r,-.76),d=n(r,.76);if(l.depth>0||d.depth>0)continue;let u=(d.height-l.height)/1.52,f=(n(o,.48).height-n(o,-.48).height)/.96,p=(l.height+d.height)*.5-c*.06,x=a.map(h=>h*(e+p)),y=t.vertices.length/6,m=new Float32Array(y*8);for(let h=0;h<y;h++){let v=h*6,b=t.vertices[v],z=t.vertices[v+1],D=t.vertices[v+2],_=t.vertices[v+4]/c,S=(t.vertices[v+3]-u*_)/s,k=(t.vertices[v+5]-f*_)/s,g=Math.hypot(S,_,k)||1;for(let w=0;w<3;w++)m[h*8+w]=x[w]+s*(b*r[w]+D*o[w])+(z*c+b*u+D*f)*a[w],m[h*8+3+w]=(S*r[w]+_*a[w]+k*o[w])/g;m[h*8+6]=z+.1*b,m[h*8+7]=t.tint}let M=this.device.createBuffer({size:m.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(M,0,m),this.rockSpans.push({site:{...t.site,targetHeight:p+.42*c},vertices:M,count:y,center:x,size:s,tall:c,span:r,depth:o,bound:s*2.3+Math.abs(u)+Math.abs(f)})}}visibleRockSpans(e,t){let a=[];for(let r of this.rockSpans){let o=r.center[0]-e.position[0],s=r.center[1]-e.position[1],c=r.center[2]-e.position[2],n=p=>p[0]*o+p[1]*s+p[2]*c,l=n(e.forward),d=r.bound*1.6,u=Math.min(e.far,22e3*this.options.radius/$e);if(l<-r.bound||o*o+s*s+c*c>u*u||Math.abs(n(e.right))>l*e.tanX+d||Math.abs(n(e.up))>l*e.tanY+d)continue;let f=t?"wire":"solid";if(!r[f]){let p=this.device.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:"depth24plus"});if(p.setBindGroup(0,this.group),p.setPipeline(t?this.rockWire:this.rockSolid),p.setVertexBuffer(0,r.vertices),t){let x=Oa(Uint32Array.from({length:r.count},(y,m)=>m));r.indices=this.device.createBuffer({size:x.byteLength,usage:GPUBufferUsage.INDEX|GPUBufferUsage.COPY_DST}),this.device.queue.writeBuffer(r.indices,0,x),p.setIndexBuffer(r.indices,"uint32"),p.drawIndexed(x.length)}else p.draw(r.count);r[f]=p.finish()}a.push(r)}return a}bindTerrain(){this.group=this.device.createBindGroup({layout:this.terrainLayout,entries:[{binding:0,resource:{buffer:this.uniform}},{binding:1,resource:{buffer:this.instances}},{binding:2,resource:{buffer:this.styleBuffer}},{binding:3,resource:{buffer:this.studioBuffer}},{binding:4,resource:this.sunView},{binding:5,resource:this.sunSampler},{binding:6,resource:{buffer:this.baseTileBuffer}}]}),this.bundle=null,this.tileCompute&&this.bindTileCompute()}bindTileCompute(){this.tileComputeGroup=this.device.createBindGroup({layout:this.tileCompute.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.uniform}},{binding:2,resource:{buffer:this.styleBuffer}},{binding:3,resource:{buffer:this.studioBuffer}},{binding:7,resource:{buffer:this.tileJobBuffer}},{binding:8,resource:{buffer:this.baseTileBuffer}}]})}uploadStudioMap(e,t,a=Ui(e),r=this.detail.relief){let o=this.device;this.tileCache.clear(),this.state=null;let s=e.glacialIce??e.impactMaterial??e.alluvium,c=e.values.byteLength+a.byteLength+e.regions.values.byteLength+96**2*8+(s?.values.byteLength??0);if(!this.studioBuffer||this.studioBuffer.size!==c){let l=this.studioBuffer;this.studioBuffer=o.createBuffer({size:c,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.bindTerrain(),this.shadowBytes=0,l?.destroy()}this.sunBake&&this.shadowBytes!==e.values.byteLength&&this.bindSunShadows(e.values.byteLength),this.device.queue.writeBuffer(this.studioBuffer,0,e.values),this.device.queue.writeBuffer(this.studioBuffer,e.values.byteLength,a),this.device.queue.writeBuffer(this.studioBuffer,e.values.byteLength+a.byteLength,e.regions.values);let n=e.values.byteLength+a.byteLength+e.regions.values.byteLength;e.springs&&this.device.queue.writeBuffer(this.studioBuffer,n,e.springs.values),e.dunes&&this.device.queue.writeBuffer(this.studioBuffer,n+96**2*4,e.dunes.values),s&&this.device.queue.writeBuffer(this.studioBuffer,n+96**2*8,s.values),this.setStudioSurface(e,t,r)}bindSunShadows(e){this.shadowBytes=e,this.sunBakeGroups=this.shadowParams.map((t,a)=>this.device.createBindGroup({layout:this.sunBake.getBindGroupLayout(0),entries:[{binding:0,resource:this.sunMap.createView({dimension:"2d",baseArrayLayer:a,arrayLayerCount:1})},{binding:1,resource:{buffer:t}},{binding:3,resource:{buffer:this.studioBuffer,size:e}}]}))}setStudioSurface(e,t,a){let r=Math.min(1,Math.sqrt(this.radius/$e)),o=pa(t)*r*a;if(e.guide){let{guide:s,...c}=e;this.studioMap={...c,reliefScale:o}}else this.studioMap=e.reliefScale===o?e:{...e,reliefScale:o};this.shadowBins=[-1,-1],this.reliefCache.clear(),this.activeStudioSeed=t,this.oceanLevel=or(this.studioMap,t,this.options.radius),this.elevationBounds=rr(this.studioMap,this.options.radius,this.geology),this.oceanLevel!==null&&(this.elevationBounds[0]=Math.max(this.elevationBounds[0],this.oceanLevel)),this.dirty=!0}updateSunShadows(e,t,a){let r;for(let o=0;o<(a>0?2:1);o++){let s=(t+o)%Aa,c=s%2;this.shadowBins[c]!==s&&(this.device.queue.writeBuffer(this.shadowParams[c],0,new Float32Array([(this.oceanLevel??0)/this.options.radius,+(this.oceanLevel!==null),(this.studioMap.reliefScale??1)/this.studioMap.featureDensity,0,...lt(s/Aa),0])),r||(r=e.beginComputePass(),r.setPipeline(this.sunBake)),r.setBindGroup(0,this.sunBakeGroups[c]),r.dispatchWorkgroups(Ca/8,Ca/8),this.shadowBins[c]=s)}r?.end()}uploadStyle(){let{stops:e,ocean:t}=this.profile,{min:a,max:r,side:o}=this.studioMap,s=r-a,c=new Float32Array(this.styleBuffer.size/4);c.set([e.length,1/(s*1.08),o,a-s*.04]);let n=this.studioMap.ocean?.datum;if(t&&n!=null&&n<r){let l=2/(e.length-1);c[1]=(1-l)/(r-n),c[3]=n-l/c[1]}c.set([this.oceanLevel??0,+(this.oceanLevel!==null),+(this.geology==="mesa"),+(this.geology==="alpine"||this.geology==="mixed")],4),c.set(Yi(this.detail),8),c[14]=this.studioSeed&65535,c[15]=this.studioSeed>>>16;for(let l=0;l<e.length;l++){let d=e[l];for(let u=0;u<3;u++){let f=d>>16-u*8&255;c[16+l*4+u]=f/255}}c[144]=this.studioMap.reliefScale??1,c[147]=96**2,!this.options.landmarkPatches&&!this.profile.lunar&&!this.profile.material&&c.set(Dt(this.studioSeed),184),c.set(t?.shallow??ls,188),c.set(t?.deep??cs,192),t&&(c.set(t.sediment,196),c.set(t.outcrop,200),c.set(t.shoal,204)),c[208]=Number(this.profile.lunar),c[209]=this.detail.erosionStrength,c[210]=this.profile.material,c[211]=+!!(this.studioMap.glacialIce??this.studioMap.impactMaterial),this.studioMap.springs&&(c[145]=this.studioMap.springs.side,c.set(this.studioMap.springs.chart,148)),this.studioMap.dunes&&(c[146]=this.studioMap.dunes.side,c.set(this.studioMap.dunes.chart,152),c.set(this.studioMap.dunes.wind,156)),c[159]=this.profile.vegetation;for(let l=0;l<this.rockSpans.length;l++){let d=this.rockSpans[l],u=160+l*12;c.set([...d.center,d.size,...d.span,d.tall,...d.depth,0],u)}this.device.queue.writeBuffer(this.styleBuffer,0,c)}configure(e={}){let{pixelError:t=this.pixelError,lodScale:a=this.lodScale,tileBudget:r=this.tileBudget,preset:o,studioSeed:s,detail:c,radius:n,terrainSampling:l}=e;if(this.studioBuffer&&this.startupPreview&&(o!==void 0||s!==void 0||c!==void 0||n!==void 0||l!==void 0))return this.finishStartup().then(()=>this.configure(e));if(!(Number.isFinite(t)&&t>0))throw new RangeError("Pixel error must be positive.");if(!(Number.isFinite(a)&&a>=.25&&a<=32))throw new RangeError("LOD scale must be between 0.25 and 32.");let d=this.requestedWorld,u=l===void 0?d.terrainSampling:gi(l),f=l===void 0?this.terrainSampling:u,p=this.maxTileBudget(f);if(e.tileBudget!==void 0&&(!Number.isInteger(r)||r<24||r>p))throw new RangeError(`Tile budget must be between 24 and ${p} for ${f} sampling.`);let x=f===this.terrainSampling,y=x?r:this.tileBudget,m=n??d.radius;if(!Number.isFinite(m)||m<16384||m>2e6||m<this.options.minSpacing)throw new RangeError("Use a radius of 16,384\u20132,000,000 m and at least the minimum spacing.");let M=o===void 0?d.profile:ht(o),h=c===void 0?d.detail:Zt(c,d.detail),v=Wr(s??(M===d.profile?d.seed:this.options.studioSeed+M.seedOffset));if((t!==this.pixelError||a!==this.lodScale||y!==this.tileBudget)&&(this.pixelError=t,this.lodScale=a,this.tileBudget=y,this.baseTileBuffer&&this.allocateTileSamples(!0,!0),this.options.streamingLod||this.split.clear(),this.dirty=!0),o===void 0&&s===void 0&&c===void 0&&n===void 0&&l===void 0)return Promise.resolve();let b=this.requestedWorld={profile:M,seed:v,detail:h,radius:m,terrainSampling:u};if(!this.studioBuffer)return this.profile=M,this.activeStudioSeed=v,this.detail=h,this.options.radius=m,this.terrainSampling=u,this.tileBudget=Math.min(r,this.maxTileBudget(u)),Promise.resolve();let z=++this.studioRequest,D=()=>!this.disposed&&z===this.studioRequest,_=this.studioQueue.then(async()=>{if(!D())return;let S=this.studioMap,k=this.detail,g=m!==this.radius,w=u!==this.terrainSampling;if(g||w||v!==this.studioSeed||M.geology!==this.geology||M.ocean?.coverage!==this.profile.ocean?.coverage||M.lunar!==this.profile.lunar||M.dry!==this.profile.dry||M.craterDetail!==this.profile.craterDetail||M.cryoGlaciers!==this.profile.cryoGlaciers||h.variation!==this.detail.variation||h.range!==this.detail.range||h.noiseMix!==this.detail.noiseMix||h.landscape!==this.detail.landscape||h.landscape!=="natural"&&h.landscapeStrength!==this.detail.landscapeStrength){let[P,C,B]=await Promise.allSettled([this.bakeWorld(b),w?Promise.all([this.terrainPipeline(u),u==="cached"?this.cachedTilePipeline():void 0,this.options.progressiveStartup?void 0:this.terrainPipeline(u,!0)]):void 0,this.prepareStudioVertices(b)]);if(P.status==="rejected")throw P.reason;if(C.status==="rejected")throw C.reason;if(B.status==="rejected")throw B.reason;if(!D())return;let W=P.value;this.options.radius=m,this.geology=M.geology,this.terrainSampling=u,w&&(this.tileBudget=Math.min(x?this.tileBudget:e.tileBudget??this.tileBudget,this.maxTileBudget(u)),[this.solid,this.tileCompute,this.wire]=C.value,this.wireMode=this.wire?u:void 0);let R=this.baseTileBuffer;this.allocateTileSamples(),w&&this.tileCompute&&R===this.baseTileBuffer&&this.bindTileCompute(),this.uploadStudioMap(W,v,void 0,h.relief),B.value?this.uploadProceduralWorld(B.value,W,b):this.studioVertices&&(this.studioVertices.dispose(),this.studioVertices=null)}else h.relief!==k.relief&&this.setStudioSurface(S,v,h.relief);this.profile=M,this.detail=h,g&&this.split.clear(),(S!==this.studioMap||k!==h)&&this.fitRockSpans(),this.uploadStyle()});return this.studioQueue=_.catch(()=>{D()&&(this.requestedWorld={profile:this.profile,seed:this.studioSeed,detail:this.detail,radius:this.radius,terrainSampling:this.terrainSampling})}),_}resize(){let{width:e,height:t}=Fi(this.canvas,this.options);this.depth&&e===this.canvas.width&&t===this.canvas.height||(this.canvas.width=e,this.canvas.height=t,this.depth?.destroy(),this.depth=this.device.createTexture({size:[e,t],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT|(this.options.sampleDepth?GPUTextureUsage.TEXTURE_BINDING:0)}),this.dirty=!0)}indexBuffer(e){let t=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0});return new Uint32Array(t.getMappedRange()).set(e),t.unmap(),t}template(e){if(this.templates.has(e))return this.templates.get(e);let t=Gi(this.options.divs,e,"mc33",!0),a={solid:this.indexBuffer(t),solidCount:t.length,indices:t};return this.templates.set(e,a),a}sampleTileRelief(e){let t=this.reliefCache.get(e.key);if(t)return t;let a=Jt(this.options.radius)/this.studioMap.featureDensity*(this.studioMap.reliefScale??1),r=l=>{let d=kt(this.studioMap,l)*a;return this.oceanLevel===null?d:Math.max(d,this.oceanLevel)},o=r(e.dir),s=o,c=o;for(let[l,d]of[[.12,.12],[.88,.12],[.12,.88],[.88,.88]]){let u=r(Pe(ba(e.face,e.u+l*e.size,e.v+d*e.size)));s=Math.min(s,u),c=Math.max(c,u)}let n=[o,c-s];return this.reliefCache.set(e.key,n),n}select(e,t,a){let r=performance.now();this.reliefCache.size>Math.max(16e3,this.tileBudget*3)&&this.reliefCache.clear();let o=this.options.streamingLod,s=Math.min(12,Math.ceil(this.tileBudget/4096)),c=o?Math.min(1,Math.sqrt(2/this.pixelError)):1,n=pr(e,{...this.options,maxTiles:Math.max(24,Math.floor(this.tileBudget*c)),centerPriority:o,previousFocal:this.focalSplit,splitBudget:o?(this.usesProceduralTiles?24:48)*s:1/0,pixelError:this.pixelError,lodScale:this.lodScale,elevationBounds:this.elevationBounds,sampleRelief:v=>this.sampleTileRelief(v)},this.split);this.split=n.split,this.focalSplit=n.focalSplit,this.pose=a,this.lastSelect=t,this.dirty=!1,this.stats.selectionMs=performance.now()-r,this.stats.leaves=n.leaves.size;let l=this.state,d=l?.length===n.visible.length&&l.every(v=>n.leaves.get(v.key)?.mask===v.mask);if(this.refineNext=n.deferred&&n.advanced,d)return;this.state=n.visible,this.bundle=null;let u=this.startupPreview?null:this.tileCache.assign(n.visible);if(this.pendingBaseTiles=u?.builds.length??0,u?.builds.length){let{builds:v}=u,b=new Float32Array(this.tileJobRecords),z=new Uint32Array(this.tileJobRecords),D=new Set(v.map(({tile:S})=>S.key)),_=S=>D.has(S)?0:(this.tileCache.slots.get(S)??-1)+1;v.forEach(({tile:S,slot:k},g)=>{let w=g*(Lt/4);b[w]=S.u,b[w+1]=S.v,b[w+2]=S.size,z[w+3]=S.face,z[w+5]=k,z[w+6]=_(fr(S)),z[w+7]=S.x&1|(S.y&1)<<1;for(let P=0;P<4;P++)z[w+8+P]=_(ur(S,P))}),this.device.queue.writeBuffer(this.tileJobBuffer,0,this.tileJobRecords,0,v.length*Lt)}let f=Array.from({length:16},()=>[]);for(let v of n.visible)f[v.mask].push(v);let p=new Float32Array(this.records),x=new Uint32Array(this.records),y=0,m=0,M=1/0,h=new Set;this.draws=[];for(let v=0;v<16;v++){let b=f[v];if(!b.length)continue;let z=this.template(v),D=y;for(let _ of b){let S=y++*8;p[S]=_.u,p[S+1]=_.v,p[S+2]=_.size,x[S+3]=_.face,x[S+4]=_.level,x[S+5]=u?.assigned.get(_.key)??0,M=Math.min(M,_.spacing),h.add(_.level)}m+=b.length*z.solidCount/3,this.draws.push({template:z,count:b.length,base:D})}y&&this.device.queue.writeBuffer(this.instances,0,this.records,0,y*32),this.terrainTriangles=m,Object.assign(this.stats,{tiles:y,triangles:m,grades:h.size,finest:M,planBuilds:this.stats.planBuilds+1,instanceBytes:this.instances.size})}render(e,t=performance.now(),{lodColors:a=!1,wireframe:r=!1,sunPhase:o=0,atmosphere:s="preset"}={}){let c=performance.now(),n=this.device;this.resize();let l=e.clearance??Math.hypot(...e.position)-this.options.radius-this.sampleSurface(Pe(e.position)).height,d=t-this.lastSelect,u=this.pose,f=!u||e.pixelScale!==u.pixelScale||e.tanX!==u.tanX,p=u&&(Math.abs(e.near-u.near)>=Math.max(1,u.near*.04)||Math.abs(e.far-u.far)>=Math.max(1,u.far*.01)),x=u?Math.max(1-me(e.forward,u.forward),1-me(e.up,u.up)):0,y=Math.max(1,Math.min(400,(this.stats.finest??2)*.4)),m=u&&(Math.abs(l-u.clearance)>=y||e.position.some((q,E)=>Math.abs(q-u.position[E])>=y)),M=this.usesProceduralTiles;if(r&&!this.startupPreview){let q=this.terrainSampling;this.wireMode!==q&&(this.wireMode=q,this.wire=void 0,this.terrainPipeline(q,!0).then(E=>{this.wireMode===q&&(this.wire=E)}).catch(E=>{this.disposed||this.errors.push(E.message)})),this.rockSpans.length&&!this.rockWire&&!this.rockWireCompilation&&(this.rockWireCompilation=this.rockPipeline(!0).then(E=>{this.rockWire=E}).catch(E=>{this.disposed||this.errors.push(E.message)})),r=!!this.wire&&(!this.rockSpans.length||!!this.rockWire)}else r=!1;(!this.refinementInFlight||this.state===null)&&(this.dirty||f||d>=50&&x>=.0024||d>=110&&(m||p||x>=22e-5))&&this.select({...e,clearance:l},t,{position:[...e.position],forward:[...e.forward],up:[...e.up],pixelScale:e.pixelScale,tanX:e.tanX,near:e.near,far:e.far,clearance:l});let h=this.frame;h.set(Ri(e).viewProjection),h.set([...e.position,this.options.radius],16),h.set([...e.right,e.tanX],20),h.set([...e.up,e.tanY],24),h.set(e.forward,28),h[31]=1/e.pixelScale,h.set([this.options.divs,0,Number(a),Math.max(0,l)],32),this.words[33]=this.detailSeed;let v=Number.isFinite(o)?o-Math.floor(o):0,b=Math.floor(v*Aa),z=v*Aa-b,[D,_,S]=Br(this.preset,s);h.set([...lt(v),z],36),h.set([...D,S],40),h.set([..._,b%2],44),h[48]=this.options.streamingLod?$a(l,6e4,1e5):0,h[49]=this.options.minSpacing,h[50]=+!!this.sunBake,n.queue.writeBuffer(this.uniform,0,h);let k=this.visibleRockSpans(e,r);if(this.stats.drawCalls=this.draws.length+1+k.length,this.stats.triangles=this.terrainTriangles+k.reduce((q,E)=>q+E.count/3,0),!this.bundle||this.bundleWire!==r){let q=n.createRenderBundleEncoder({colorFormats:[this.format],depthStencilFormat:"depth24plus"});q.setBindGroup(0,this.group),q.setPipeline(this.sky),q.draw(3),q.setPipeline(r?this.wire:this.solid);for(let{template:E,count:N,base:O}of this.draws){if(r&&!E.wire){let Z=Oa(E.indices);E.wire=this.indexBuffer(Z),E.wireCount=Z.length,E.indices=null}q.setIndexBuffer(r?E.wire:E.solid,"uint32"),q.drawIndexed(r?E.wireCount:E.solidCount,N,0,0,O)}this.bundle=q.finish(),this.bundleWire=r}let g=n.createCommandEncoder(),w=this.pendingBaseTiles,P=w>0,C=this.queries&&!this.timing,B=C&&this.frameIndex++%20===0,W=C&&P&&c-this.lastPatchSample>=100;if(P){W&&(this.lastPatchSample=c);let q=g.beginComputePass(W?{timestampWrites:{querySet:this.queries,beginningOfPassWriteIndex:2,endOfPassWriteIndex:3}}:void 0),E=(this.options.divs+1)**2;M?this.studioVertices.dispatch(q,E,w):(q.setPipeline(this.tileCompute),q.setBindGroup(0,this.tileComputeGroup),q.dispatchWorkgroups(Math.ceil(E/64),w)),q.end(),this.stats.baseTileBuilds=(this.stats.baseTileBuilds??0)+w,this.pendingBaseTiles=0}this.sunBake&&this.updateSunShadows(g,b,z);let R=g.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:[0,0,0,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this.depth.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:this.options.sampleDepth?"store":"discard"},...B?{timestampWrites:{querySet:this.queries,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}}:{}});R.executeBundles([this.bundle,...k.map(q=>r?q.wire:q.solid)]),R.end();let Q=B||W;if(Q){let q=B&&W?4:2;g.resolveQuerySet(this.queries,B?0:2,q,this.resolve,0),g.copyBufferToBuffer(this.resolve,0,this.read,0,q*8)}if(n.queue.submit([g.finish()]),this.startupPreview&&!this.startupScheduled&&(this.startupScheduled=!0,requestAnimationFrame(()=>{this.finishStartup().catch(q=>{this.disposed||this.errors.push(q.message)})})),this.options.streamingLod&&!this.refinementInFlight&&(P||this.refineNext)){this.refinementInFlight=!0;let q=this.refineNext;n.queue.onSubmittedWorkDone().then(()=>{!this.disposed&&q&&(this.dirty=!0)}).catch(E=>{this.disposed||this.errors.push(E.message)}).finally(()=>{this.refinementInFlight=!1})}return Q&&(this.timing=!0,this.read.mapAsync(GPUMapMode.READ).then(()=>{let q=new BigUint64Array(this.read.getMappedRange());if(B&&(this.stats.gpuMs=Number(q[1]-q[0])/1e6),W){let E=B?2:0;this.stats.patchGpuTiles=w,this.stats.patchGpuMs=Number(q[E+1]-q[E])/1e6}this.read.unmap()}).catch(q=>{this.disposed||this.errors.push(q.message)}).finally(()=>{this.timing=!1})),this.stats.cpuMs=performance.now()-c,this.stats}dispose(){if(!this.disposed){this.disposed=!0;for(let e of this.templates.values())e.solid.destroy(),e.wire?.destroy();for(let e of this.rockSpans)e.vertices.destroy(),e.indices?.destroy();for(let e of[this.depth,this.uniform,this.styleBuffer,this.studioBuffer,this.baseTileBuffer,this.tileJobBuffer,...this.shadowParams??[],this.sunMap,this.instances,this.queries,this.resolve,this.read])e?.destroy();this.studioMap=null,this.startupMap=null,Promise.allSettled([this.studioQueue,this.startupCompletion]).then(()=>{this.noiseBuilder?.dispose(),this.studioVertices?.dispose()}),qi(this)}}};async function Gr(i,e){let t=new yi(i,e);try{return await t.initialize()}catch(a){throw t.dispose(),a}}function Ur(i,e,t){let a=document.createElement("form"),r,o=0,s=!1,c;function n(p,x,y){let m=document.createElement("label");m.className="row";let M=document.createElement("span");M.textContent=x,m.append(M,y),p.append(m)}function l(p,x,y,m,M,h=!0){let v=document.createElement("select");for(let[b,z]of Object.entries(y))v.add(new Option(z,b));v.value=m,v.onchange=()=>{h&&(s=!0),M(v.value)},n(p,x,v)}function d(p,x,[y,m,M],h,v,b){let z=document.createElement("input");z.type="number",z.min=y,z.max=m,z.step="any",z.placeholder=v===void 0?"":String(Number(v.toFixed(5))),h!==void 0&&(z.value=h),z.title=`Range ${y} to ${m}${M===1?" (whole numbers)":""}`,z.oninput=()=>{s=!0,b(z.value===""?void 0:z.valueAsNumber)},n(p,x,z)}function u(){let{detail:p}=e,x=na(e.studioSeed,e.geology,!0,p.variation,ut[p.range],1).layers;r??={regionMap:{algorithm:"perlin",frequency:3.45,transition:.44},layers:x.map(({entryPoint:g})=>({algorithm:g,uniforms:{},weights:[1,1,1,1]}))};let{regionMap:y,layers:m}=r,M=m[o],h=document.createElement("details"),v=document.createElement("summary");v.textContent="Layer uniforms",h.append(v);let b=document.createElement("p");b.className="hint",b.textContent="Blank uniforms use the current preset. Region weights run from 0 (off) to 1 (full).",a.replaceChildren(),l(a,"Region map",ha,y.algorithm,g=>{y.algorithm=g}),d(a,"Region frequency",[.25,24,.05],y.frequency,void 0,g=>{y.frequency=g}),d(a,"Region blend width",[.05,2,.05],y.transition,void 0,g=>{y.transition=g}),l(a,"Terrain layer",Object.fromEntries(m.map((g,w)=>[w,`${w+1}. ${Bt[g.algorithm]}`])),String(o),g=>{o=Number(g),u()},!1),l(a,"Layer noise",Bt,M.algorithm,g=>{M.algorithm=g,u()});for(let[g,w]of Vi.entries())d(a,w,[0,1,.05],M.weights[g],void 0,P=>{M.weights[g]=P});for(let[g,w]of Object.entries(da))d(h,g,w,M.uniforms[g],x[o].layer[g],P=>{P===void 0?delete M.uniforms[g]:M.uniforms[g]=P});let z=document.createElement("div");z.className="actions";let D=document.createElement("button");D.type="submit",D.textContent="Apply terrain mix";let _=document.createElement("button");_.type="button",_.textContent="Use preset mix";let S=document.createElement("p");S.className="hint",S.setAttribute("role","status");let k=async g=>{let w=[...a.querySelectorAll("button, input, select")];w.forEach(P=>{P.disabled=!0});try{await t(g?null:jt(r)),f()}catch(P){S.textContent=P.message}finally{w.forEach(P=>{P.disabled=!1})}};a.onsubmit=g=>{g.preventDefault(),k(!1)},_.onclick=()=>k(!0),z.append(D,_),a.append(b,h,z,S)}function f(){r=structuredClone(e.detail.noiseMix),s=!1,c=void 0,u()}return i.append(a),f(),{refresh:f,syncPreset:u,get disabled(){return a.inert},set disabled(p){a.inert=p},read:()=>s?jt(r):c===void 0?e.detail.noiseMix:c,stage(p){r=structuredClone(p),c=p,s=!1,u()}}}function Or(i,e,t){let a=Math.max(0,Math.min(1,(t-i)/(e-i)));return a*a*(3-2*a)}function Vr([i,e,t],{canyon:a,volcanic:r,granite:o},s){let c=2*Math.PI*(s>>>16)/65536,n=1-Or(.43,.81,Math.abs(e)),l=.78*Math.sin(4*i+2*e-5.52*t+c)+.4*Math.sin(-8.7*i+3.3*e-5.4*t-.71*c),d=Math.min(1,1.42*(a+.78*r+.36*o));return n*d*Or(-.67,.47,l)}var Gt=2;function Hr(i,e,t,a,r){let o=t+Gt,s=Math.max(o,e,a+Gt);if(Math.abs(s-i)<.01)return s;let c=s>i?6:2;return Math.max(o,i+(s-i)*-Math.expm1(-c*r))}function He(i){let e=Pe(at(Math.abs(i[1])>.98?[0,0,1]:[0,1,0],i));return{direction:i,east:e,north:at(i,e)}}function Ta({east:i,north:e},t){let a=Math.cos(t),r=Math.sin(t);return[i.map((o,s)=>o*a-e[s]*r),e.map((o,s)=>o*a+i[s]*r)]}function Yr(i,e,t){let{direction:a,east:r}=i,o=Math.cos(t),s=Math.sin(t),c=Pe(a.map((f,p)=>f*o+e[p]*s)),n=me(r,e),l=r.map((f,p)=>f+n*(e[p]*(o-1)-a[p]*s)),d=me(l,c),u=Pe(l.map((f,p)=>f-d*c[p]));return{direction:c,east:u,north:at(c,u)}}function bi(i,e,t,a,r){let o=Math.hypot(t,a);if(o===0)return i;let[s,c]=Ta(i,e),n=s.map((l,d)=>(t*l+a*c[d])/o);return Yr(i,n,o/r)}function Xr(i,e){let{direction:t}=i,a=he(me(t,e),-1,1),r=e.map((n,l)=>n-a*t[l]),o=Math.hypot(...r),s=o>1e-12?r.map(n=>n/o):i.east,c=Math.atan2(o,a);return n=>Yr(i,s,c*n)}var wt=Pe([.67,.32,.67]),ps=12e4,wi=Math.PI/180,ds={alpine:"Rocky mountains",canyon:"Canyons and mesas",granite:"Granite domes",volcanic:"Volcanic terrain"},jr={"granite-divides":["alpine","granite"],flatirons:["alpine","canyon"],"lava-benches":["volcanic","canyon"],"sandstone-fins":["canyon","granite"],"basalt-highlands":["alpine","volcanic"],"fault-blocks":["granite","volcanic"]},Si={"drowned-canyons":5500,"sediment-shelves":3300,"rift-inlets":6900},Pi={"dune-seas":4100,"wind-badlands":5200},Mi={"terraced-plateaus":0,"pinnacle-rims":0,"fractal-outcrops":1},hs={...Si,...Pi,"inverted-valleys":3600,"alluvial-fans":4200,"glacial-highlands":6300,"fault-blocks":8100,"terraced-plateaus":5500,"pinnacle-rims":3800,granite:4400,canyon:8200,volcanic:6500},Ut=3e5,ms=1156e3,xs=Math.PI/3;function gs(i,e){let t=i.studioMap.featureDensity,a=he(Math.round(12*t),5,32),r,o=-1/0;for(let s=0;s<a;s++){let c=i.studioSeed+Math.imul(s,73856093)>>>0,n=2*((Math.imul(c,1664525)+1013904223&65535)/65536)-1,l=2*Math.PI*((Math.imul(c,22695477)+1&65535)/65536),d=(Math.imul(c,1103515245)+12345&65535)/65536,u=Math.sqrt(1-n*n),f=[u*Math.cos(l),n,u*Math.sin(l)],p=i.sampleLandforms(f).volcanic,x=me(f,e);if(p<.38||x<.15)continue;let{east:y,north:m}=He(f),M=(.035+.099*d**2)/t,h=(g,w)=>Pe(f.map((P,C)=>P+M*w*g[C])),v=i.sampleSurface(f),b=[y,m].flatMap(g=>[-.29,.29].map(w=>i.sampleSurface(h(g,w)).height)).sort((g,w)=>g-w),z=(b[1]+b[2])*.5,D=Pe(e.map((g,w)=>g-x*f[w])),_=h(D,.88),S=i.sampleSurface(_);if(i.oceanLevel!==null&&z<i.oceanLevel+120)continue;let k=(z-v.height)*.7+(z-S.height)*.3+1e3*p+650*x-650*d;if(k>o){let g=He(_),w=Math.atan2(me(f,g.east),me(f,g.north)),P=.88*M*i.radius,C=Math.max(3e3,z-S.height+.96*P);r={dir:_,yaw:w,height:C},o=k}}return r}function vs(i,e){let{radius:t}=i,a=lt(0),r=e==="volcanic"?gs(i,a):null;if(r)return r;let o=e==="islands",s=e==="glacial-highlands",c=Object.hasOwn(Pi,e),n=e==="dune-seas",l=e==="fault-blocks",d=e==="granite",u=e==="canyon",f=e==="volcanic",p=Object.hasOwn(Mi,e)?Va(i.studioSeed):null,x=o?"volcanic":s?"alpine":e,y=s?Dt(i.studioSeed):null;if(s&&y[3]===0)return null;let m=jr[x],M=D=>{if(p)return i.detail.landscape==="mosaic"?p.score(D)[Mi[e]]:1;let _=i.sampleLandforms(D);return c?Vr(D,_,i.studioSeed):m?4*_[m[0]]*_[m[1]]:_[x]},h=u?4096:s||c||l||p||d?2304:x?1280:256,v=x?null:{dir:wt,yaw:0},b=-1/0,z=-1/0;for(let D=0;D<h;D++){let _=2*(D+.5)/h-1,S=D*Math.PI*(3-Math.sqrt(5)),k=Math.sqrt(1-_*_),g=[k*Math.cos(S),_,k*Math.sin(S)],w=me(a,g),P=x?M(g):1;if(P<(u||f?.55:s||l?.26:.48)||x&&w<.32)continue;let C=i.sampleSurface(g);if(C.depth>0||s&&sa(...g,C.land,y)<.11||c&&C.land>(n?.38:.94)||(!o&&!s&&!c&&!p&&!d&&!u&&b===-1/0&&w>z&&(v={dir:g,yaw:0},z=w),w<(x?.32:.55)))continue;let{east:B,north:W}=He(g),R=(E,N)=>Pe(g.map((O,Z)=>O+E[Z]*N/t)),Q=E=>(i.sampleSurface(R(E,40)).height-i.sampleSurface(R(E,-40)).height)/80,q=Math.hypot(Q(B),Q(W));for(let E=0;E<8;E++){let N=E*Math.PI/4,O=W.map((A,H)=>A*Math.cos(N)+B[H]*Math.sin(N)),Z=R(O,1600),Y=R(O,u?9700:5900),X=i.sampleSurface(Z),te=i.sampleSurface(Y);if(l&&(X.depth>0||te.depth>0)||c&&(X.depth>0||te.depth>0||n&&te.land>.47))continue;let ie=s?sa(...Y,te.land,y):0;if(s&&(ie<.19||X.depth>0))continue;let F=i.oceanLevel,L=o?i.sampleSurface(R(O,12500)).depth:0;if(o&&(F===null||L<80||C.height-F>2200))continue;let j=i.sampleSurface(R(O,42)).height,I=Math.min(1.4,Math.max(0,te.height-X.height)/950),$=Math.min(1.1,Math.max(0,C.height-X.height)/560),V=Math.max(0,(te.height-C.height)/5900-.16),K=0;if(x&&!o){let A=M(Y);K=.62*P+.74*A-.63*+(X.depth>0)-.82*+(te.depth>0)}if(n){let A=i.sampleSurface(R(O,9900));if(A.depth>0)continue;let H=Math.max(C.height,X.height,te.height,A.height)-Math.min(C.height,X.height,te.height,A.height);K-=.85*Math.abs(C.land-.05)+1.45*he(H/1400,0,2)}else if(c)K+=.44*I+.28*he(C.land,0,1);else if(u){if(te.depth>0||M(Y)<.6)continue;let A=at(g,O),H=-1/0;for(let T of[-1,1]){let G=fe=>Pe(Y.map((pe,de)=>pe+T*A[de]*fe/t)),J=G(1800),ee=i.sampleSurface(J),oe=i.sampleSurface(G(3e3));if(ee.depth>0||oe.depth>0||M(J)<.66)continue;let le=i.sampleSurface(Pe(J.map((fe,pe)=>fe+O[pe]*1100/t))),ce=Math.min(ee.height,oe.height,le.height)-te.height,re=Math.max(Math.abs(oe.height-ee.height),Math.abs(le.height-ee.height)),se=i.studioMap.reliefScale;ce<240*se||re>ce*.42||(H=Math.max(H,he((ce-2.25*re)/(250*se),-1,4)))}if(!Number.isFinite(H))continue;K+=H}else if(f&&te.depth===0&&M(Y)>.58){let A=at(g,O),H=(G,J)=>i.sampleSurface(Pe(Y.map((ee,oe)=>ee+G[oe]*J/t))).height,T=Math.min(H(A,-2400),H(A,2400),H(O,-2400),H(O,2400));K+=he((T-te.height)/180,0,4)}else if(d){if(M(Y)<.62||X.depth>0||te.depth>0)continue;let A=at(g,O),H=se=>i.sampleSurface(Pe(Y.map((fe,pe)=>fe+se*A[pe]*4200/t))),T=H(-1),G=H(1),J=R(O,13300),ee=i.sampleSurface(J);if(T.depth>0||G.depth>0||ee.depth>0)continue;let oe=te.land-.5*(X.land+ee.land),le=Math.min(T.land,G.land)-X.land,ce=Math.max(0,te.land-.5*(T.land+G.land)-.18),re=Math.min(M(Z),M(J),M(R(O,23500)));K+=he(3.6*oe+2.3*le-4.1*ce,-1.4,2.5)+2.5*re}else if(p){if(X.depth>0||te.depth>0||M(Y)<.5)continue;let A=i.sampleSurface(R(O,9200));if(A.depth>0)continue;let H=Math.min(A.height,te.height)-X.height,T=Math.abs(A.height-te.height);if(Mi[e]===0){let G=at(g,O),J=le=>i.sampleSurface(Pe(Y.map((ce,re)=>ce+le*G[re]*1700/t))),ee=J(-1),oe=J(1);if(ee.depth>0||oe.depth>0)continue;if(e==="terraced-plateaus"){let le=Math.max(Math.abs(ee.height-te.height),Math.abs(oe.height-te.height));K+=he((H-1.7*T-1.25*le)/520,-2,3)}else{let le=te.height-Math.max(ee.height,oe.height,X.height);K+=he(le/290,-1.4,2.6)}}else K+=.55*he((Math.abs(H)+T)/1100,0,2)}else if(l){let A=at(g,O),H=le=>i.sampleSurface(Pe(Z.map((ce,re)=>ce+le*A[re]*4100/t))),T=H(-1),G=H(1);if(T.depth>0||G.depth>0)continue;let J=T.height,ee=G.height,oe=Math.max(J,ee)-X.height;K+=.72*he(oe/1250,0,2)+.42*he(Math.abs(J-ee)/1500,0,1)}let ae=1+K+Math.min(.45,L/2e3)+he(ie,0,.64)-Math.abs(w-.68)+.35*I+.3*$-Math.min(.65,Math.max(0,(j-C.height)/70))-2.2*V-.85*Math.min(1,q);ae>b&&(v={dir:g,yaw:N},b=ae)}}return v}function ys(i,e){let{radius:t}=i,a=i.oceanLevel;if(a===null)return null;let r=e==="drowned-canyons",o=e==="rift-inlets",s=lt(0),c=null,n=2304;for(let l=0;l<n;l++){let d=2*(l+.5)/n-1,u=l*Math.PI*(3-Math.sqrt(5)),f=Math.sqrt(1-d*d),p=[f*Math.cos(u),d,f*Math.sin(u)],x=me(p,s);if(x<.34)continue;let y=i.sampleSurface(p);if(y.depth>0||y.height-a>1550)continue;let{east:m,north:M}=He(p),h=i.sampleLandforms(p),v=o?h.volcanic*(.55+1.8*h.granite):h.canyon;for(let b=0;b<8;b++){let z=b*Math.PI/4,D=M.map((q,E)=>q*Math.cos(z)+m[E]*Math.sin(z)),_=at(p,D),S=(q,E=0)=>i.sampleSurface(Pe(p.map((N,O)=>N+(D[O]*q+_[O]*E)/t))),k=S(4e3),g=S(10500);if(k.depth<=0||g.depth<70)continue;let w=S(5200,-4100),P=S(5200,4100),C=Math.max(w.height,P.height)-a,B=he(C/1250,0,2),W=1-he(k.depth/450,0,1),R=Math.min(w.height,P.height)-a,Q=x*.5+(o?2*v+B+.65*he(R/700,0,1):r?1.24*v+B+.4*he(k.depth/450,0,1):1.65*W-.65*B-Math.abs(y.height-a-160)/1e3);(!c||Q>c.score)&&(c={dir:p,yaw:z,score:Q})}}return c}function bs(i){let{radius:e}=i,t=i.studioMap.alluvium;if(!t)return null;let{side:a,values:r}=t,o=lt(0),s=[];for(let n=1;n<a-1;n++)for(let l=0;l<a-1;l++){let d=r[n*a+l];if(d<.13)continue;let u=Math.PI*n/(a-1),f=2*Math.PI*l/(a-1),p=Math.sin(u),x=[p*Math.cos(f),Math.cos(u),p*Math.sin(f)],y=me(x,o);y>.32&&s.push({target:x,score:d+.43*y})}s.sort((n,l)=>l.score-n.score);let c=null;for(let{target:n,score:l}of s.slice(0,72)){let d=i.sampleSurface(n);if(i.oceanLevel!==null&&(d.depth>0||d.height-i.oceanLevel<130))continue;let{east:u,north:f}=He(n);for(let p=0;p<8;p++){let x=p*Math.PI/4,y=u.map((z,D)=>z*Math.cos(x)+f[D]*Math.sin(x)),m=Pe(n.map((z,D)=>z+y[D]*(6900/e))),M=i.sampleSurface(m);if(M.depth>0)continue;let h=Pe(n.map((z,D)=>z-y[D]*(5300/e))),v=i.sampleSurface(h).height-d.height,b=l+.33*he(v/850,0,1)-.49*he(Math.abs(M.height-d.height)/1600,0,1)+.15*_r(t,h);if(!c||b>c.score){let z=He(m);c={dir:m,yaw:Math.atan2(me(n,z.east),me(n,z.north)),score:b}}}}return c}function ws(i){let{radius:e}=i,t=lt(0),a=null;for(let r of i.studioMap.invertedRidges??[]){let o=me(r,t);if(o<.23)continue;let s=i.sampleSurface(r);if(s.depth>0)continue;let{east:c,north:n}=He(r);for(let l=0;l<8;l++){let d=l*Math.PI/4,u=c.map((h,v)=>h*Math.cos(d)+n[v]*Math.sin(d)),f=h=>Pe(r.map((v,b)=>v+u[b]*h/e)),p=i.sampleSurface(f(2700)),x=i.sampleSurface(f(-2700)),y=f(5700);if(i.sampleSurface(y).depth>0)continue;let m=Math.min(s.height-p.height,s.height-x.height),M=1.8*he(m/1100,-1,1.2)+.65*o;if(!a||M>a.score){let h=He(y);a={dir:y,yaw:Math.atan2(me(r,h.east),me(r,h.north)),score:M}}}}return a}var zi=()=>crypto.getRandomValues(new Uint32Array(1))[0],qa=i=>(i=he(i,0,1),i*i*(3-2*i)),_i=i=>i>=1e3?`${(i/1e3).toLocaleString(void 0,{maximumFractionDigits:1})} km`:`${i.toLocaleString(void 0,{maximumFractionDigits:2})} m`;async function Zr({onFrame:i,onDispose:e,onTerrainReady:t,onDeviceReady:a,sampleDepth:r=!1}={}){let o=U=>document.getElementById(U),s=o("planet"),c=o("status"),n=[o("controls"),o("performance")],l=o("hideInterface"),d=o("showInterface");function u(U){for(let ne of n)ne.hidden=U;d.hidden=!U,U?s.focus():l.focus()}l.onclick=()=>u(!0),d.onclick=()=>u(!1);let f=[...o("controls").querySelectorAll("button,input,select")].filter(U=>U!==l);for(let U of f)U.disabled=!0;let p=o("terrainSampling"),x=o("triangleBudget"),y=16,m=2*y**2,M=(y+1)**2,h=Number(x.step),v=U=>Math.floor(U/m),b=await Gr(s,{studioSeed:zi(),terrainSampling:p.value,divs:y,maxTiles:v(Number(x.max)),tileBudget:v(x.valueAsNumber),streamingLod:!0,progressiveStartup:!0,sampleDepth:r,onDeviceReady:a});await b.configure({pixelError:o("detail").valueAsNumber,lodScale:o("lodScale").valueAsNumber});function z(U){let ue=(b.maxTileBudget(U)+1)*m-1;return Math.floor(ue/h)*h}function D(){o("triangleBudgetValue").textContent=x.valueAsNumber.toLocaleString(),x.title=`Up to ${(v(Number(x.max))*M).toLocaleString()} grid vertices`}function _(){x.max=z(b.terrainSampling),D()}_();let S=o("preset"),k=o("planetSize"),g=o("region"),w=b.radius,P=()=>Math.max(ms-w,w*2.15);for(let U of At)S.add(new Option(U.name,U.id));S.value=b.preset;let C,B="";function W(U){if(U==="glacial-highlands"&&ht(b.preset).cryoGlaciers){let ne=lt(0),ue=({overlook:Ye,head:ct})=>Math.acos(he(me(Ye,ct),-1,1)),ge=Ye=>me(Ye.overlook,ne)+.8*ue(Ye),[be]=[...b.studioMap.glacialSites].sort((Ye,ct)=>ge(ct)-ge(Ye));if(!be)return null;let{north:ve,east:Ae}=He(be.overlook),De=Math.atan2(me(be.head,Ae),me(be.head,ve));return{dir:be.overlook,yaw:De,height:Math.max(4200,.37*ue(be)*b.radius),pitch:-39}}if(U==="impact-basins"){let ne=lt(0),[ue]=[...b.studioMap.impactBasins??[]].sort((ge,be)=>me(be.center,ne)-me(ge.center,ne));return ue?{dir:ue.center,yaw:0,height:b.radius*ue.size*1.9,pitch:-83}:null}return U==="inverted-valleys"?ws(b):U==="alluvial-fans"?bs(b):Object.hasOwn(Si,U)?ys(b,U):vs(b,U||void 0)}function R(){let U=[...g.options].find(({value:ue})=>ue===B),ne=B&&U&&!U.disabled?W(B):null;ne||(B=""),g.value=B,C=ne}function Q(){let U=b.detail.variation===0,ne=ht(b.preset),ue=ne.lunar||ne.material?[0,0,0,0]:Dt(b.studioSeed);g.querySelector('option[value="impact-basins"]').disabled=!b.studioMap.impactBasins?.length,o("climateReadout").textContent=ne.cryoGlaciers?"Glacial ice":ue[3]===0?"Snow-free":ue[1]===0?"Highland snow":"Polar snow",g.querySelector('option[value="glacial-highlands"]').disabled=ne.cryoGlaciers?!b.studioMap.glacialSites?.length:ue[3]===0;let ge=Va(b.studioSeed),{landscape:be,landscapeStrength:ve}=b.detail,Ae=ve>0&&(be==="mesas"||be==="mosaic"&&ge.mesas);for(let De of["terraced-plateaus","pinnacle-rims"])g.querySelector(`option[value="${De}"]`).disabled=!Ae;g.querySelector('option[value="fractal-outcrops"]').disabled=!ve||!(be==="fractal"||be==="mosaic"&&ge.fractal);for(let De of["islands",...Object.keys(Si)])g.querySelector(`option[value="${De}"]`).disabled=b.oceanLevel===null||De==="rift-inlets"&&U;for(let De of[...Object.keys(jr),...Object.keys(Pi)])g.querySelector(`option[value="${De}"]`).disabled=U;g.querySelector('option[value="inverted-valleys"]').disabled=!b.studioMap.invertedRidges?.length,g.querySelector('option[value="alluvial-fans"]').disabled=!b.studioMap.alluvium}Q();let q=!1,E="";async function N(U){let ne=b.studioMap,ue=b.sampleSurface(U).height,ge=await b.probeSurface(U);return!ge||ne!==b.studioMap?null:{dir:U,map:ne,correction:ge.height-ue,height:ge.height}}let O,Z=b.sampleSurface(wt).height,Y=He(wt),X=Z+Ut,te=X,ie=Ut,F=0,L=-Math.PI/2,j,I,$,V,K,ae=-1/0,A=16.7,H=!1,T=-1/0,G=0,J=new Set;function ee(){j=null,o("approach").textContent="Start approach"}function oe(){o("altitude").value=Math.log2(ie),o("altitudeValue").textContent=_i(ie)}function le(U,ne=b.sampleSurface(Y.direction).height){ie=he(U,Gt,P()),te=X=ne+ie,$=null,oe()}async function ce(){let U=++G;ee();let ne=Y=He(wt);F=0,L=-Math.PI/2,le(Ut);try{let ue=await N(wt);if(U!==G||Y!==ne||!ue)return;O=ue,le(Ut,ue.height)}catch(ue){U===G&&(E=ue.message)}}o("orbit").onclick=ce;async function re(U,ne,ue,ge,be=!1,ve){G++,ee(),q=!0,E="";let Ae=[S,o("random"),g,k,p,x];for(let De of Ae)De.disabled=!0;Le.disabled=!0,c.textContent="Generating Planet Studio terrain\u2026",c.hidden=!1;try{let De=ge?Math.min(x.valueAsNumber,z(ge)):void 0;await b.configure({preset:U,studioSeed:ne,radius:ue,terrainSampling:ge,detail:ve,tileBudget:De===void 0?void 0:v(De)}),O=null,w=b.radius,o("altitude").max=Math.log2(P()),Q(),R(),!ge&&!ve&&await ce(),be&&Me(0),Le.syncPreset()}catch(De){if(E=De.message,ve)throw De}finally{q=!1,S.value=b.preset,k.value=String(b.radius),p.value=b.terrainSampling,_();for(let De of Ae)De.disabled=!1;Le.disabled=!1}}S.onchange=()=>re(S.value,zi()),k.onchange=()=>re(void 0,void 0,Number(k.value)),p.onchange=()=>re(void 0,void 0,void 0,p.value),o("random").onclick=()=>{let U=zi(),ne=At.findIndex(({id:ve})=>ve===b.preset),ue=Math.imul(U^2654435769,1664525)+1013904223>>>0,ge=(ne+1+ue%(At.length-1))%At.length,be=[...k.options].map(ve=>Number(ve.value)).filter(ve=>ve!==b.radius);return re(At[ge].id,U,be[(ue>>>24)%be.length],void 0,!0)};async function se(U,ne){if(q)return;ee();let ue=++G,{dir:ge,yaw:be}=C??=W(""),ve;try{ve=await N(ge)}catch(Ae){ue===G&&(E=Ae.message);return}ue!==G||!ve||(O=ve,Y=He(ge),F=be,L=ne*wi,le(U,ve.height))}o("shore").onclick=()=>se(600,-13),o("surface").onclick=()=>se(3,-7),g.onchange=()=>{let U=g.value,ne=W(U);if(!ne){g.value=B,E="No suitable site for that landform on this world.";return}E="",B=U,C=ne,U&&se(ne.height??hs[U]??7e3,ne.pitch??(ne.height?-44:U==="volcanic"?-48:U==="canyon"?-40:-31))},o("approach").onclick=()=>{if(q)return;if(G++,j){ee();return}C??=W("");let U=Xr(He(wt),C.dir),ne=U(1),[,ue]=Ta(He(C.dir),C.yaw),ge=Math.atan2(me(ue,ne.east),me(ue,ne.north));j={start:performance.now(),route:U,heading:ge,startGround:O?.dir===wt&&O.map===b.studioMap?O.height:b.sampleSurface(wt).height,endGround:b.sampleSurface(C.dir).height},$=null,o("approach").textContent="Stop approach",s.focus()},o("altitude").max=Math.log2(P()),o("altitude").oninput=()=>{G++,ee(),le(2**Number(o("altitude").value)),L=(-7-83*qa((Math.log2(ie)-7)/10))*wi},o("detail").oninput=()=>{b.configure({pixelError:Number(o("detail").value)}),o("detailValue").textContent=`${o("detail").value} px`},o("lodScale").oninput=()=>{let U=Number(o("lodScale").value);b.configure({lodScale:U}),o("lodScaleValue").textContent=`${U.toFixed(2)}\xD7`},x.oninput=D,x.onchange=()=>b.configure({tileBudget:v(x.valueAsNumber)});let fe=0,pe=o("sunCycle"),de=o("sunPhase"),xe=o("sunPhaseValue"),we=o("atmosphere");function Me(U){fe=U,de.value=Math.floor(U*360),xe.textContent=`${de.value}\xB0`}de.oninput=()=>{pe.checked=!1,Me(de.valueAsNumber/360)};let Be={landscape:"landscape",landscapeStrength:"landscapeStrength",terrainRelief:"relief",rangeShape:"range",slopeNoise:"slopes",groundNoise:"ground",slopeOctaves:"slopeOctaves",groundOctaves:"groundOctaves",noiseVariation:"variation",erosionStrength:"erosionStrength"},ye=o("erosionStrength");ye.oninput=()=>{o("erosionStrengthValue").textContent=`${ye.valueAsNumber.toFixed(2)}\xD7`};let Se=Object.keys(Be).map(o),Te=()=>{o("landscapeStrength").disabled=b.detail.landscape==="natural"};function Ie(){for(let U of Se)U.value=b.detail[Be[U.id]];ye.oninput(),Te()}let qe;async function Qe(U,ne){await re(ne?.preset,ne?.seed,ne?.radius,ne?.terrainSampling,!1,U),Ie()}let Le=Ur(o("terrainMix"),b,async U=>{await Qe({...qe?.detail,noiseMix:U},qe),qe=void 0});t?.({read(){return{preset:b.preset,seed:b.studioSeed,radius:b.radius,terrainSampling:b.terrainSampling,...qe,detail:{...qe?.detail??b.detail,noiseMix:Le.read()}}},stage(U){if(!U)return;let ne=Zt(U.detail);qe={...U,detail:ne},Le.stage(ne.noiseMix)},async apply(){let U=Le.read();!qe&&U===b.detail.noiseMix||(await Qe({...qe?.detail,noiseMix:U},qe),qe=void 0,Le.refresh())}});for(let U of Se)U.onchange=async()=>{let ne=Be[U.id],ue=U.tagName==="SELECT"?U.value:U.valueAsNumber,ge=ne==="range"||ne==="variation"||ne==="landscape"||ne==="landscapeStrength";if(ge){ee(),q=!0;for(let be of[...Se,S,k,p,g,o("random")])be.disabled=!0;c.textContent="Rebuilding terrain relief\u2026",c.hidden=!1}E="";try{await b.configure({detail:{[ne]:ue}}),Q(),Le.syncPreset(),ge&&R()}catch(be){E=be.message,U.value=b.detail[ne],U===ye&&ye.oninput()}finally{if(ge){q=!1;for(let be of[...Se,S,k,p,g,o("random")])be.disabled=!1;Te()}}};oe();for(let U of f)U.disabled=!1;Te(),s.oncontextmenu=U=>U.preventDefault(),s.onpointerdown=U=>{I||U.button!==0&&U.button!==2||(U.preventDefault(),ee(),I={id:U.pointerId,button:U.button===2?2:1,x:U.clientX,y:U.clientY},s.setPointerCapture(U.pointerId),s.focus())},s.onpointerup=s.onpointercancel=s.onlostpointercapture=U=>{I?.id===U.pointerId&&(I=null)};function Ue(U,ne){Y=bi(Y,F,U,ne,w);let ue=Math.hypot(U,ne);if(ie<1500&&ue>0){let ge=Math.min(12,80/ue);$=bi(Y,F,U*ge,ne*ge,w).direction}}s.onpointermove=U=>{if(I?.id!==U.pointerId)return;if(!(U.buttons&I.button)){I=null;return}let ne=U.clientX-I.x,ue=U.clientY-I.y;if(I.x=U.clientX,I.y=U.clientY,I.button===2)F+=ne*.003,L=he(L-ue*.003,-Math.PI/2,1.1);else{let ge=he(ie*.002,.25,w*.003);Ue(-ne*ge,ue*ge)}};let it=new Set(["KeyW","KeyA","KeyS","KeyD","Space","KeyC","ShiftLeft","ShiftRight"]);function xt(U){if(U.code==="KeyH"&&!U.repeat&&!U.ctrlKey&&!U.metaKey&&!U.altKey&&!U.target.closest?.("input, select, textarea, [contenteditable]")){u(!n[0].hidden),U.preventDefault();return}!it.has(U.code)||document.activeElement!==s||(ee(),J.add(U.code),U.preventDefault())}function dt(U){J.delete(U.code)}let rt=()=>J.clear();window.addEventListener("keydown",xt),window.addEventListener("keyup",dt),window.addEventListener("blur",rt);function Ot(U){let ne=K===void 0?16.7:Math.max(0,U-K),ue=Math.min(.05,ne/1e3);K=U,pe.checked&&(fe=(fe+ne/ps)%1),A+=.08*(ne-A);let ge=0,be;if(j){let ke=he((U-j.start)/19e3,0,1),Fe=qa(ke/.68);Y=j.route(Fe),be=j.startGround+(j.endGround-j.startGround)*Fe+Ut*(3/Ut)**ke,F=j.heading*qa(ke/.7),L=(-90+83*qa((ke-.59)/.37))*wi,ke===1&&ee()}else{let ke=Number(J.has("KeyW"))-Number(J.has("KeyS")),Fe=Number(J.has("KeyD"))-Number(J.has("KeyA")),ft=Math.max(5,ie*.32)*(J.has("ShiftLeft")||J.has("ShiftRight")?4:1);(ke||Fe)&&Ue(Fe*ft*ue,ke*ft*ue),ge=(Number(J.has("Space"))-Number(J.has("KeyC")))*ft*ue}let ve=Y.direction,[Ae,De]=Ta(Y,F),Ye=ve.map((ke,Fe)=>ke*Math.sin(L)+De[Fe]*Math.cos(L)),ct=at(Ae,Ye),ot=b.sampleSurface(ve).height,Xe=O?.map===b.studioMap?Math.hypot(...ve.map((ke,Fe)=>ke-O.dir[Fe]))*w:1/0,Re=ot+(O?.correction??0)*he(1-Xe/200,0,1);if(!q&&!H&&b.terrainSampling==="procedural"&&ie<14e3&&Xe>1&&U-T>90){let ke=b.studioMap;H=!0,T=U,b.probeSurface(ve).then(Fe=>{Fe&&ke===b.studioMap&&(O={dir:ve,map:ke,correction:Fe.height-ot})}).catch(Fe=>{ke===b.studioMap&&(E=Fe.message)}).finally(()=>{H=!1})}if(be!==void 0)te=be,X=Math.max(te,Re+Gt);else if(ge)te=X=he(X+ge,Re+Gt,Re+P());else{let ke=$?b.sampleSurface($).height:Re;X=Hr(X,te,Re,ke,ue)}$=null,ie=X-Re,b.resize();let Vt=Ai({position:ve.map(ke=>ke*(w+X)),forward:Ye,up:ct,fov:xs,near:Math.max(.12,ie*.08),far:2*w+Math.max(0,X)+12e3,aspect:s.width/s.height,height:s.height});Vt.clearance=ie;let Ce=b.render(Vt,U,{lodColors:o("colors").checked,wireframe:o("wire").checked,sunPhase:fe,atmosphere:we.value});if(i?.(b,Vt,fe),U-ae>=225){ae=U,oe(),pe.checked&&(de.value=Math.floor(fe*360),xe.textContent=`${de.value}\xB0`),o("heightReadout").textContent=_i(ie),o("seedReadout").textContent=b.studioSeed,o("reliefReadout").textContent=`${b.studioMap.reliefScale.toFixed(2)}\xD7`,o("oceanReadout").textContent=b.oceanLevel===null?"Dry":ht(b.preset).ocean?.name??"Ocean";let ke=Object.entries(b.sampleLandforms(ve)).sort((ft,Mt)=>Mt[1]-ft[1]);o("geologyReadout").textContent=ke.slice(0,ke[1][1]>.28?2:1).map(([ft])=>ds[ft]).join(" / "),o("spacing").textContent=Number.isFinite(Ce.finest)?_i(Ce.finest):"\u2014",o("tris").textContent=Ce.triangles.toLocaleString(),o("gridVertices").textContent=(Ce.tiles*M).toLocaleString(),o("tiles").textContent=`${Ce.tiles} / ${Ce.leaves}`,o("grades").textContent=Ce.grades,o("timing").textContent=`${Ce.cpuMs.toFixed(1)} / ${Ce.gpuMs?.toFixed(1)??"\u2014"} ms`;let Fe=o("patchTiming");Fe&&(Fe.textContent=Ce.patchGpuMs===null?"\u2014":`${Ce.patchGpuMs.toFixed(2)} ms / ${Ce.patchGpuTiles}`),o("fps").textContent=document.hidden?"Background":Math.round(1e3/A),c.textContent=b.errors.at(-1)||E||(q?"Generating Planet Studio terrain\u2026":j?"Descending toward the surface\u2026":b.startupPreview?"Preparing surface detail\u2026":""),c.hidden=!c.textContent,c.classList.toggle("error",!!E||b.errors.length>0)}V=requestAnimationFrame(Ot)}V=requestAnimationFrame(Ot),window.addEventListener("pagehide",()=>{cancelAnimationFrame(V),window.removeEventListener("keydown",xt),window.removeEventListener("keyup",dt),window.removeEventListener("blur",rt);try{e?.()}finally{b.dispose()}},{once:!0})}async function Sl({setup:i,...e}={}){let t=new DOMParser().parseFromString(ki,"text/html");document.title=t.title,document.head.append(...t.head.querySelectorAll('style,link[rel="stylesheet"]')),document.body.replaceChildren(...t.body.childNodes),i?.(document);try{await Zr(e)}catch(a){let r=document.getElementById("status");throw r.textContent=a.message,r.classList.add("error"),a}}export{Sl as mountPlanetApproach,lt as sunDirection};
