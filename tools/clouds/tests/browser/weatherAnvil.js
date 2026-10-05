import {CloudComputeBuilder} from '../../clouds.js';
import {ANVIL_FORM,ANVIL_PARAMS,ANVIL_TUNING} from '../../weather/cloudAnvilLook.js';
import {sampleWeatherCycle,WEATHER_STATES} from '../../weather/cloudWeatherCycle.js';

async function run(){
 const device=await (await navigator.gpu.requestAdapter()).requestDevice();
 const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 const builder=new CloudComputeBuilder(device,device.queue);
 let weatherTexture;
 const map=(dimension,color)=>{
  const texture=device.createTexture({dimension,size:[1,1,1],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  device.queue.writeTexture({texture},new Uint8Array(color),{},[1,1,1]);
  if(dimension==='2d')weatherTexture=texture;
  return texture.createView({dimension:dimension==='3d'?'3d':'2d-array'});
 };
 builder.setInputMaps({weatherView:map('2d',[220,160,0,255]),shape3DView:map('3d',[150,125,140,115]),detail3DView:map('3d',[110,145,125,255])});
 builder.setBox({center:[0,ANVIL_FORM.halfY-.3,0],half:[18,ANVIL_FORM.halfY,18]});
 builder.setViewFromCamera({camPos:[4,.6,26],fwd:[-.14,.1,-1],aspect:1.5});
 builder.createOutputTexture(96,64);
 const size=32*32*32*32;
 const storage=device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});
 const readback=device.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
 const pixels=device.createBuffer({size:96*64*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
 const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{entryPoint:'read',module:device.createShaderModule({code:`
  @group(0) @binding(0) var density:texture_3d<f32>;
  @group(0) @binding(1) var light:texture_3d<f32>;
  @group(0) @binding(2) var<storage,read_write> result:array<vec4<f32>>;
  @compute @workgroup_size(4,4,4) fn read(@builtin(global_invocation_id) gid:vec3<u32>){
   let i=(gid.z*32u+gid.y)*32u+gid.x;let p=vec3<i32>(gid*vec3<u32>(4,2,4));
   result[i*2u]=textureLoad(density,p,0);result[i*2u+1u]=textureLoad(light,p,0);
  }`})}});
 const sample=async()=>{
  await builder.dispatch();
  const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
   {binding:0,resource:builder._fieldResources.densityView},{binding:1,resource:builder._fieldResources.lightView},{binding:2,resource:{buffer:storage}}]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
  pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(8,8,8);pass.end();
  encoder.copyBufferToBuffer(storage,0,readback,0,size);
  encoder.copyTextureToBuffer({texture:builder.outTexture},{buffer:pixels,bytesPerRow:768},[96,64,1]);device.queue.submit([encoder.finish()]);
  await Promise.all([readback.mapAsync(GPUMapMode.READ),pixels.mapAsync(GPUMapMode.READ)]);
  const result={field:new Float32Array(readback.getMappedRange()).slice(),pixels:new Uint16Array(pixels.getMappedRange()).slice()};readback.unmap();pixels.unmap();return result;
 };
 builder.setTuning({...ANVIL_TUNING,formType:3});builder.setParams(ANVIL_PARAMS);const manual=await sample();
 const phase=WEATHER_STATES.findIndex(s=>s.name==='Anvil storms'),peak=phase*420/WEATHER_STATES.length;
 const state=sampleWeatherCycle(peak);builder.setWeatherProfile(state.fieldProfile);builder.setTuning(state.tuning);builder.setParams(state.cloudParams);const cycle=await sample();
 let densityMaxDelta=0,lightMaxDelta=0,changedPixels=0,occupied=0;
 for(let i=0;i<manual.field.length;i++){
  const delta=Math.abs(manual.field[i]-cycle.field[i]);
  if(i%8<4)densityMaxDelta=Math.max(densityMaxDelta,delta);else lightMaxDelta=Math.max(lightMaxDelta,delta);
  if(i%8===0&&manual.field[i]>.1)occupied++;
 }
 for(let i=0;i<manual.pixels.length;i++)if(manual.pixels[i]!==cycle.pixels[i])changedPixels++;
 let transitionMaxDelta=0,worstTransition=0;
 // Phase joins alone missed the old bug: identity changed inside a phase
 // when an advecting green sample crossed the hard storm-selection threshold.
 for(const boundary of Array.from({length:24},(_,i)=>i*420/24)){
  const samples=[];for(const offset of [-1/60,1/60]){
   const s=sampleWeatherCycle(boundary+offset);builder.setWeatherProfile(s.fieldProfile);builder.setTuning(s.tuning);builder.setParams(s.cloudParams);samples.push(await sample());
  }
  for(let i=0;i<samples[0].field.length;i+=8){
   const delta=Math.abs(samples[0].field[i]-samples[1].field[i]);
   if(delta>transitionMaxDelta){transitionMaxDelta=delta;worstTransition=boundary;}
  }
 }
 // A smooth steep change converges with dt; a hard pop does not. Half the
 // frame interval at the worst point rather than hiding it under a big bound.
 const refined=[];for(const offset of [-1/120,1/120]){
  const s=sampleWeatherCycle(worstTransition+offset);builder.setWeatherProfile(s.fieldProfile);builder.setTuning(s.tuning);builder.setParams(s.cloudParams);refined.push(await sample());
 }
 let refinedTransitionMaxDelta=0;
 for(let i=0;i<refined[0].field.length;i+=8)refinedTransitionMaxDelta=Math.max(refinedTransitionMaxDelta,Math.abs(refined[0].field[i]-refined[1].field[i]));
 builder.setWeatherProfile(state.fieldProfile);builder.setTuning(state.tuning);builder.setParams(state.cloudParams);
 let identityMaxDelta=0;
 for(const green of [0,64,128,192,255]){
  device.queue.writeTexture({texture:weatherTexture},new Uint8Array([220,green,0,255]),{},[1,1,1]);
  builder.invalidateCloudFields();const varied=await sample();
  // All density AND light channels must agree. Weather G is not anatomy.
  for(let i=0;i<cycle.field.length;i++)identityMaxDelta=Math.max(identityMaxDelta,Math.abs(cycle.field[i]-varied.field[i]));
 }
 let windMaxDelta=0;
 // Straddle the material-lattice boundaries: dropping a neighbor must not
 // abruptly remove its anvil footprint. Test both signs and X/Z directions.
 for(const axis of [0,2])for(const boundary of [-7,0,7]){
  const frames=[];for(const delta of [-.001,.001]){
   const offset=[0,0,0];offset[axis]=boundary+delta;
   builder.setNoiseTransforms({shapeOffsetWorld:offset});frames.push(await sample());
  }
  for(let i=0;i<frames[0].field.length;i+=8){
   windMaxDelta=Math.max(windMaxDelta,Math.abs(frames[0].field[i]-frames[1].field[i]));
  }
 }
 const compiledBefore=builder.getComputePipelineTimings().variants.length,qualityGrids={};
 for(const quality of ['low','high','ultra','balanced']){
  builder.setFieldQuality(quality);await sample();qualityGrids[quality]=builder._fieldResources.dimensions;
 }
 const compiledAfter=builder.getComputePipelineTimings().variants.length;
 const qualityPass=compiledBefore===compiledAfter&&Object.entries(qualityGrids).every(([key,grid])=>grid.join()===({low:'96,48,96',high:'192,96,192',ultra:'256,128,256',balanced:'128,64,128'})[key]);
 const pass=densityMaxDelta===0&&lightMaxDelta===0&&changedPixels===0&&occupied>100&&transitionMaxDelta<.25&&refinedTransitionMaxDelta<transitionMaxDelta*.65+.005&&identityMaxDelta===0&&windMaxDelta<.5&&qualityPass&&errors.length===0;
 document.querySelector('#result').textContent=JSON.stringify({complete:true,pass,densityMaxDelta,lightMaxDelta,changedPixels,occupied,transitionMaxDelta,worstTransition,refinedTransitionMaxDelta,identityMaxDelta,windMaxDelta,qualityGrids,compiledBefore,compiledAfter,errors},null,2);
 device.destroy();
}
run().catch(error=>document.querySelector('#result').textContent=JSON.stringify({error:error.stack}));
