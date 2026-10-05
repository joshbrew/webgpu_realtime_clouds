import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CLOUD_FIELD_QUALITIES,normalizeCloudFieldQuality} from '../cloudFieldQuality.js';
import {cyclePreview,sampleWeatherCycle} from '../weather/cloudWeatherCycle.js';

test('quality presets keep the old default and bound screenshot memory',()=>{
 assert.equal(normalizeCloudFieldQuality(undefined),'balanced');
 assert.equal(normalizeCloudFieldQuality('bad'),'balanced');
 assert.equal(normalizeCloudFieldQuality('ultra'),'ultra');
 assert.deepEqual(CLOUD_FIELD_QUALITIES.balanced.dimensions,[128,64,128]);
 const memory=key=>CLOUD_FIELD_QUALITIES[key].dimensions.reduce((a,b)=>a*b,16)/1024**2;
 assert.equal(memory('balanced'),16);assert.equal(memory('high'),54);assert.equal(memory('ultra'),128);
 for(const preset of Object.values(CLOUD_FIELD_QUALITIES)){
  assert.ok(preset.dimensions.every(v=>v%4===0&&v<=256));assert.ok(Object.isFrozen(preset.dimensions));
 }
});

test('quick sky span installs both extents before rendering and preserves vertical bounds through weather',async()=>{
 const ui=await readFile(new URL('../cloudTestThreaded.js',import.meta.url),'utf8');
 const start=ui.indexOf('const updateSkySpan ='),end=ui.indexOf('$("quick-sky-span")?.addEventListener',start);
 const values=new Map([['quick-sky-span',{value:'72'}],['v-box-hy',{value:'5.8'}]]),events=[];
 const update=new Function('$','setFieldValue','dispatchInput',`${ui.slice(start,end)};return updateSkySpan;`)(
  id=>values.get(id),(id,value)=>values.set(id,{value}),id=>events.push([id,values.get('v-box-hx').value,values.get('v-box-hz').value]));
 update();assert.deepEqual(events,[['v-box-hx',36,36]]);assert.equal(values.get('v-box-hy').value,'5.8');
 values.get('quick-sky-span').value='bad';update();assert.equal(events.length,1);
 const base={fieldQuality:'ultra',box:{center:[2,5.5,-3],half:[36,5.8,42],uvScale:1}};
 const preview=cyclePreview(base,sampleWeatherCycle(105),false);
 assert.deepEqual(preview.box.half,[36,5.8,42]);assert.equal(preview.fieldQuality,'ultra');
});

test('field quality reaches the worker and reseeds temporal history in manual and cycling scenes',async()=>{
 const worker=await readFile(new URL('../cloudTest.worker.js',import.meta.url),'utf8');
 const start=worker.indexOf('function makeViewSignature('),end=worker.indexOf('\nfunction ',start+10);
 const signature=new Function('roundSig','makeColorSignature','normalizeTemporalCellRate','previewRenderScaleDivider',`${worker.slice(start,end)};return makeViewSignature;`)(
  v=>v,a=>String(a),v=>v,p=>p.renderScaleDivider||4);
 for(const weatherCycle of [false,true]){
  const preview={weatherCycle,cam:{x:1,y:2,z:3},fieldQuality:'balanced'};
  const before=signature(preview,1920,1080);
  assert.equal(before,signature({...preview},1920,1080));
  assert.notEqual(before,signature({...preview,fieldQuality:'ultra'},1920,1080));
 }
 assert.match(worker,/cb.setFieldQuality\(preview\?\.fieldQuality \|\| 'balanced'\)/);
 const ui=await readFile(new URL('../cloudTestThreaded.js',import.meta.url),'utf8');
 assert.match(ui,/cloneOptions\("v-field-quality", "quick-field-quality"\)/);
 assert.match(ui,/preview.fieldQuality = normalizeCloudFieldQuality/);
 assert.match(ui,/"v-field-quality"\)\?\.dispatchEvent/);
});
