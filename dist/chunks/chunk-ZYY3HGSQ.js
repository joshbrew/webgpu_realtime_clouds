import{planetRegionMaterialSource}from"./chunk-AGOQFEXH.js";import{planetRegionTerrainNoise_default}from"./chunk-KZZDKEXZ.js";var regionGridShader=`
struct RegionGrid {
  normal: vec3<f32>,
  halfAngle: f32,
  east: vec3<f32>,
  side: u32,
  south: vec3<f32>,
  footprint: f32,
  seed: u32,
}
`;function planetRegionGridDescriptor(world,frame,span,side){const descriptor=new ArrayBuffer(64);const values=new Float32Array(descriptor);values.set(frame.up);values[3]=span/(2*world.radius);values.set(frame.east,4);new Uint32Array(descriptor)[7]=side;values.set(frame.south,8);values[11]=span/(side-1);new Uint32Array(descriptor)[12]=world.studioSeed;return descriptor}function planetRegionShapeJob(world,frame,span,side){const job=new ArrayBuffer(48);const words=new Uint32Array(job);const values=new Float32Array(job);values.set(frame.up);words[3]=7;values.set(frame.east,4);words[7]=side;values.set(frame.south,8);values[11]=span/(2*world.radius);return job}async function loadRegionShapeInputs(world,studioMap){if(!world.startupPreview||world.studioVertices?.guide)return;const request=world.requestedWorld;const startupMap=world.startupMap;const ready=await(world.startupVertices??world.prepareStudioVertices(request));if(world.studioMap!==studioMap||world.requestedWorld!==request){throw new Error("Planet terrain changed. Select the region again.")}if(world.startupPreview&&!world.studioVertices?.guide){world.uploadProceduralWorld(ready,startupMap,request)}}async function preparePlanetRegionShape(world){const{studioMap}=world;await loadRegionShapeInputs(world,studioMap);if(world.studioMap!==studioMap||world.terrainSampling!=="procedural"){throw new Error("Planet terrain changed. Select the region again.")}const studio=world.studioVertices;const rowsPerGroup=world.regionPointRows??1;return(encoder,job,shape,side)=>{const[permutationsGroup,inputs]=studio.groups(job,shape);const pass=encoder.beginComputePass({label:"Sample Planet region height"});pass.setPipeline(studio.pipeline);pass.setBindGroup(0,permutationsGroup);pass.setBindGroup(1,inputs);pass.dispatchWorkgroups(Math.ceil(side/16),Math.ceil(side/rowsPerGroup));pass.end()}}var regionSurfaceShader=regionGridShader+`
@group(1) @binding(0) var<uniform> grid: RegionGrid;
@group(1) @binding(1) var<storage, read> studioShape: array<vec4<f32>>;

@vertex fn local_surface_vertex(@builtin(vertex_index) vertex: u32) -> @builtin(position) vec4<f32> {
  let p = vec2<f32>(f32((vertex << 1u) & 2u), f32(vertex & 2u));
  return vec4<f32>(p * 2.0 - 1.0, 0.0, 1.0);
}

fn shape_at(xy: vec2<u32>) -> vec4<f32> {
  return studioShape[xy.y * grid.side + xy.x];
}

fn shape_gradient(xy: vec2<u32>, offset: vec2<f32>, metric: f32) -> vec3<f32> {
  let lo = max(xy, vec2<u32>(1u)) - 1u;
  let hi = min(xy + 1u, vec2<u32>(grid.side - 1u));
  let dx = shape_at(vec2<u32>(hi.x, xy.y)).x - shape_at(vec2<u32>(lo.x, xy.y)).x;
  let dz = shape_at(vec2<u32>(xy.x, hi.y)).x - shape_at(vec2<u32>(xy.x, lo.y)).x;
  let slope = vec2<f32>(dx, dz) / (grid.footprint * vec2<f32>(hi - lo));
  return metric * (grid.east * slope.x + grid.south * slope.y - grid.normal * dot(offset, slope));
}

struct RegionSurface {
  @location(0) color: vec4<f32>,
  @location(1) elevation: f32,
}
@fragment fn local_surface_pixel(@builtin(position) pos: vec4<f32>) -> RegionSurface {
  let xy = vec2<u32>(pos.xy);
  let offset = (vec2<f32>(xy) / f32(grid.side - 1u) * 2.0 - 1.0) * grid.halfAngle;
  let point = grid.normal + grid.east * offset.x + grid.south * offset.y;
  let metric = length(point);
  let radial = point / metric;
  let uv = studio_uv(radial);
  let radius = frame.eye.w;
  let side = i32(style.palette.z);
  var base: StudioNoise;
  var rock: vec4<f32>;
  var gradient: vec3<f32>;
  if (proceduralTerrain) {
    let shape = shape_at(xy);
    base = StudioNoise(shape.x, studio_level(radial, radius, side, 0, uv).gradient, 0.0, uv);
    rock = vec4<f32>(max(0.0, 1.0 - dot(shape.yzw, vec3<f32>(1.0))), shape.yzw);
    rock /= max(.01, dot(rock, vec4<f32>(1.0)));
    gradient = shape_gradient(xy, offset, metric);
  } else {
    base = studio_noise(radial, radius, side, grid.footprint);
    gradient = base.gradient;
    rock = studio_regions(uv, side, style.ocean.z > .5, style.ocean.w > .5);
  }
  let relief = terrain_vertex_relief(radial, radius, grid.footprint, base, rock);
  let coast = select(1.0, smoothstep(0.0, 48.0, relief.x - style.ocean.x), style.ocean.y > .5);
  let grade = relief.yzw + (gradient - base.gradient) * studioReliefMeters * style.world.x;
  let slope = length(grade - radial * dot(radial, grade));
  let terrain = region_detail_elevation(radial * radius, grid.footprint, grid.seed);
  let elevation = relief.x + terrain * region_detail_strength(slope / sqrt(1.0 + slope * slope)) * coast;
  let input = SurfaceVarying(pos, -radial, radial, 0u, vec4<f32>(base.height, gradient), rock, base.gradient);
  let color = planet_surface_pixel(input, grid.footprint, style.ocean.x - elevation);
  return RegionSurface(color, elevation);
}
`;var surfacePipelines=new WeakMap;function getSurfacePipeline(world,procedural){const variants=surfacePipelines.get(world)??new Map;surfacePipelines.set(world,variants);if(!variants.has(procedural)){const{device}=world;const inputLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}}]});const module=device.createShaderModule({label:"Planet region elevation and materials",code:planetRegionMaterialSource()+planetRegionTerrainNoise_default+regionSurfaceShader});const pipeline=device.createRenderPipelineAsync({label:"Planet region elevation and materials",layout:device.createPipelineLayout({bindGroupLayouts:[world.terrainLayout,inputLayout]}),vertex:{module,entryPoint:"local_surface_vertex"},fragment:{module,entryPoint:"local_surface_pixel",constants:{regionMaterialPass:true,proceduralTerrain:procedural},targets:[{format:"rgba8unorm"},{format:"r32float"}]}}).then(render=>({render,inputLayout}));variants.set(procedural,pipeline);pipeline.catch(()=>variants.delete(procedural))}return variants.get(procedural)}function warmPlanetRegionSurface(world){const procedural=world.terrainSampling==="procedural";return getSurfacePipeline(world,procedural)}async function samplePlanetRegionSurface(world,frame,span,side){const{device,studioMap,terrainSampling}=world;const procedural=terrainSampling==="procedural";const[{render,inputLayout},encodeShape]=await Promise.all([getSurfacePipeline(world,procedural),procedural?preparePlanetRegionShape(world):null]);if(world.studioMap!==studioMap||world.terrainSampling!==terrainSampling){throw new Error("Planet terrain changed. Select the region again.")}const planetGroup=world.group;const descriptor=planetRegionGridDescriptor(world,frame,span,side);const bytesPerRow=Math.ceil(side*4/256)*256;const stride=bytesPerRow*side;const grid=device.createBuffer({size:descriptor.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const shape=device.createBuffer({size:procedural?side*side*16:16,usage:GPUBufferUsage.STORAGE});const job=procedural?device.createBuffer({size:48,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}):null;const outputs=["rgba8unorm","r32float"].map(format=>device.createTexture({size:[side,side],format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC}));const readback=device.createBuffer({size:stride*2,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});try{device.queue.writeBuffer(grid,0,descriptor);const group=device.createBindGroup({layout:inputLayout,entries:[{binding:0,resource:{buffer:grid}},{binding:1,resource:{buffer:shape}}]});const encoder=device.createCommandEncoder();if(job){device.queue.writeBuffer(job,0,planetRegionShapeJob(world,frame,span,side));encodeShape(encoder,job,shape,side)}const pass=encoder.beginRenderPass({colorAttachments:outputs.map(texture=>({view:texture.createView(),clearValue:[0,0,0,0],loadOp:"clear",storeOp:"store"}))});pass.setPipeline(render);pass.setBindGroup(0,planetGroup);pass.setBindGroup(1,group);pass.draw(3);pass.end();for(const[i,texture]of outputs.entries()){encoder.copyTextureToBuffer({texture},{buffer:readback,bytesPerRow,offset:i*stride},[side,side,1])}device.queue.submit([encoder.finish()]);await readback.mapAsync(GPUMapMode.READ);const mapped=readback.getMappedRange();const colors=new Uint8Array(mapped,0,stride);const heights=new Float32Array(mapped,stride);const materials=new Uint8Array(side*side*4);const elevations=new Float32Array(side*side);for(let y=0;y<side;y++){materials.set(colors.subarray(y*bytesPerRow,y*bytesPerRow+side*4),y*side*4);const row=y*bytesPerRow/4;elevations.set(heights.subarray(row,row+side),y*side)}if(materials[3]!==255||materials[materials.length-1]!==255)throw new Error("The planet surface pass did not cover the tile.");return{elevations,materials}}finally{grid.destroy();job?.destroy();shape.destroy();for(const texture of outputs)texture.destroy();readback.destroy()}}export{warmPlanetRegionSurface,samplePlanetRegionSurface};
