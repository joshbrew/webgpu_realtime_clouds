import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('gas curls bake in a lazy separate entry and use seam-free tangent gradients',async()=>{
 const noise=await readFile(new URL('../planetCloudNoise.js',import.meta.url),'utf8');
 assert.match(noise,/fn gasWeatherNoise/);
 assert.match(noise,/return cross\(direction,gradient\)/);
 assert.match(noise,/valueGradient\(direction\*3\.1/);
 assert.match(noise,/valueGradient\(direction\*6\.3/);
 assert.match(noise,/midpoint=normalize\(direction-gasCurl/);
 assert.match(noise,/bandPhase\*3\.7/);
 assert.match(noise,/if\(gas && !this.gasPipelineReady\)/);
 const setup=noise.slice(noise.indexOf('async prepare()'),noise.indexOf('async bake('));
 assert.doesNotMatch(setup,/entryPoint:'gasWeatherNoise'/);
});

test('both gas renderers shear along latitude without moving the poles or changing latitude',async()=>{
 const files=await Promise.all(['shaders/cloudPlanet.wgsl','shaders/planetCloudSurfaceMC33.wgsl','shaders/planetCloudSurfaceRender.wgsl'].map(x=>readFile(new URL('../'+x,import.meta.url),'utf8')));
 const helper=x=>x.slice(x.indexOf('fn gasZonalAngle'),x.indexOf('\n}',x.indexOf('fn gasZonalAngle'))).replace(/\s/g,'');
 for(const shader of files){assert.match(shader,/wind\+sin\(wind\*\.7\)\*sin\(latitude\*14\.0\)\*\.12/);assert.equal(helper(shader),helper(files[0]));}
 assert.match(files[0],/wind=vec3<f32>\(gasZonalAngle[^\n]*,0,0\)/);
 assert.match(files[2],/binding\(5\) var weatherTex/);
 assert.match(files[2],/gasZonalAngle\(radial.y,params.weatherTime\)/);
 assert.match(files[2],/if\(params.formType>=4\.5\)/);
 for(const y of [-1,-.8,-.4,0,.4,.8,1]){
  const p=[Math.sqrt(1-y*y),y,0],angle=1.3+Math.sin(1.3*.7)*Math.sin(y*14)*.12;
  const moved=[p[0]*Math.cos(angle),p[1],p[0]*Math.sin(angle)];
  assert.equal(moved[1],y);
  assert.ok(Math.abs(Math.hypot(...moved)-1)<1e-12);
 }
 for(const time of [0,1,60,3600,86400,31536000]){
  const wind=time*.00065*2*Math.PI;
  for(const latitude of [-1,-.5,0,.5,1]){
   const angle=wind+Math.sin(wind*.7)*Math.sin(latitude*14)*.12;
   assert.ok(Math.abs(angle-wind)<=.12000001,'band shear cannot stretch baked curls indefinitely');
  }
 }
});
