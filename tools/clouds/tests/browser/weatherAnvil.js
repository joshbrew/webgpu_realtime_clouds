import {CloudComputeBuilder} from '../../clouds.js';
import {ANVIL_FORM,ANVIL_PARAMS,ANVIL_TUNING} from '../../weather/cloudAnvilLook.js';
import {sampleWeatherCycle,WEATHER_STATES} from '../../weather/cloudWeatherCycle.js';

async function run(){
 const device=await (await navigator.gpu.requestAdapter()).requestDevice();
 const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 const builder=new CloudComputeBuilder(device,device.queue);
 const map=(dimension,color)=>{
  const texture=device.createTexture({dimension,size:[1,1,1],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
  device.queue.writeTexture({texture},new Uint8Array(color),{},[1,1,1]);
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
 let transitionMaxDelta=0;
 for(const boundary of [peak,peak+420/WEATHER_STATES.length]){
  const samples=[];for(const offset of [-1/60,1/60]){
   const s=sampleWeatherCycle(boundary+offset);builder.setWeatherProfile(s.fieldProfile);builder.setTuning(s.tuning);builder.setParams(s.cloudParams);samples.push(await sample());
  }
  for(let i=0;i<samples[0].field.length;i+=8)transitionMaxDelta=Math.max(transitionMaxDelta,Math.abs(samples[0].field[i]-samples[1].field[i]));
 }
 const pass=densityMaxDelta===0&&lightMaxDelta===0&&changedPixels===0&&occupied>100&&transitionMaxDelta<.02&&errors.length===0;
 document.querySelector('#result').textContent=JSON.stringify({complete:true,pass,densityMaxDelta,lightMaxDelta,changedPixels,occupied,transitionMaxDelta,errors},null,2);
 device.destroy();
}
run().catch(error=>document.querySelector('#result').textContent=JSON.stringify({error:error.stack}));
