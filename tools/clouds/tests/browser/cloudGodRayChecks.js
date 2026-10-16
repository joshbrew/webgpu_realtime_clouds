import current from '../../shaders/cloudsRender.wgsl';
import baseline from './cloudsRender_cell-baseline.wgsl';
import aircraft from '../../shaders/cloudAircraft.wgsl';
import terrain from '../../shaders/cloudTerrain.wgsl';
import {CloudComputeBuilder} from '../../clouds.js';
async function run(){
 const adapter=await navigator.gpu.requestAdapter(),device=await adapter.requestDevice(),errors=[];
 device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
 const W=256,H=256,b=new CloudComputeBuilder(device,device.queue);b.createOutputTexture(W,H);
 const input=device.createTexture({size:[W,H,1],mipLevelCount:9,format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
 const ground=device.createTexture({size:[1,1],format:'rgba16float',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
 const output=device.createTexture({size:[W,H],format:'rgba16float',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
 const read=device.createBuffer({size:W*H*8,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
 const half=v=>{const e=(v>>10)&31,m=v&1023;return e===0?m*2**-24:(1+m/1024)*2**(e-15);};
 const pipelines=[];
 for(const [label,source] of [['before',baseline],['after',current]]){
  const module=device.createShaderModule({code:source+'\n'+terrain+'\n'+aircraft+`
   @fragment fn shaftCheck(in:VSOut)->@location(0) vec4<f32>{
    let shaft=godRayShaft(in.uv,vec2<f32>(0.5,0.15),0,1.0,0.95,0.0,0.8);
    return vec4<f32>(shaft.x,shaft.y,0.0,1.0);
   }`});
  const pipe=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs_main'},fragment:{module,entryPoint:'shaftCheck',targets:[{format:'rgba16float'}]}});
  const group=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:device.createSampler({magFilter:'linear',minFilter:'linear',mipmapFilter:'linear'})},{binding:1,resource:input.createView({dimension:'2d-array'})},{binding:2,resource:{buffer:b.renderParams}},{binding:3,resource:ground.createView()}]});
  pipelines.push({label,pipe,group});
 }
 const rows=[];
 for(const clear of [false,true]){
  let pixels=new Uint8Array(W*H*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const u=(x+.5)/W,v=(y+.5)/H;
   const gap=[.29,.46,.63,.80].some(c=>Math.abs(u-c)<.022);
   pixels[(y*W+x)*4+3]=!clear&&v>.28&&v<.40&&u>.08&&u<.92&&!gap?255:0;
  }
  let width=W,height=H;
  for(let level=0;level<9;level++){
   device.queue.writeTexture({texture:input,mipLevel:level},pixels,{bytesPerRow:width*4},[width,height,1]);
   if(level===8)break;
   const next=new Uint8Array(width/2*height/2*4);
   for(let y=0;y<height/2;y++)for(let x=0;x<width/2;x++)for(let c=0;c<4;c++){
    next[(y*width/2+x)*4+c]=Math.round((pixels[(y*2*width+x*2)*4+c]+pixels[(y*2*width+x*2+1)*4+c]+pixels[((y*2+1)*width+x*2)*4+c]+pixels[((y*2+1)*width+x*2+1)*4+c])/4);
   }
   pixels=next;width/=2;height/=2;
  }
  for(const {label,pipe,group} of pipelines)for(const strength of [0,.5,2]){
   b._writeRenderUniforms({cam:{camPos:[0,0,0],right:[1,0,0],up:[0,1,0],fwd:[0,0,1],fovYDeg:60,aspect:1},compositeQuality:2,terrainEnabled:false,godRaysEnabled:true,godRayStrength:strength,godRayLength:1.6,godRayFalloff:1.5});
   const enc=device.createCommandEncoder(),pass=enc.beginRenderPass({colorAttachments:[{view:output.createView(),loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipe);pass.setBindGroup(0,group);pass.draw(6);pass.end();enc.copyTextureToBuffer({texture:output},{buffer:read,bytesPerRow:W*8},[W,H]);device.queue.submit([enc.finish()]);
   await read.mapAsync(GPUMapMode.READ);const data=new Uint16Array(read.getMappedRange()).slice();read.unmap();
   let max=0,sum=0,sum2=0,n=0;
   for(let y=H*.55|0;y<H;y++)for(let x=16;x<W-16;x++){const v=half(data[(y*W+x)*4]);max=Math.max(max,v);sum+=v;sum2+=v*v;n++;}
   rows.push({label,clear,strength,max,mean:sum/n,contrast:Math.sqrt(Math.max(0,sum2/n-(sum/n)**2))});
  }
 }
 const before=rows.find(r=>r.label==='before'&&!r.clear&&r.strength===2),after=rows.find(r=>r.label==='after'&&!r.clear&&r.strength===2);
 const low=rows.find(r=>r.label==='after'&&!r.clear&&r.strength===.5);
 const pass=!errors.length&&after.contrast>before.contrast*1.5&&after.max>low.max*2&&rows.filter(r=>r.clear||r.strength===0).every(r=>r.max<.00001);
 document.querySelector('#result').textContent=JSON.stringify({rows,errors,pass},null,2);device.destroy();
}
run().catch(e=>document.querySelector('#result').textContent=JSON.stringify({error:e.stack}));
