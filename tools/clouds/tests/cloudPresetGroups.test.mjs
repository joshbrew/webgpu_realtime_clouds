import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ANVIL_FORM,ANVIL_PRESET_VALUES} from '../weather/cloudAnvilLook.js';

const source=await readFile(new URL('../cloudTestThreaded.js',import.meta.url),'utf8');
const catalogSource=source.slice(source.indexOf('const CLOUD_LAYER_PRESETS ='),source.indexOf('function injectPreviewLookControls()'));
const catalog=Function('ANVIL_FORM','ANVIL_PRESET_VALUES',`${catalogSource}; return CLOUD_LAYER_PRESETS;`)(ANVIL_FORM,ANVIL_PRESET_VALUES);
const menu=source.slice(source.indexOf('<select id="v-layer-preset"'),source.indexOf('</select>',source.indexOf('<select id="v-layer-preset"')));

test('every cloud preset appears once under its actual calculation method',()=>{
  const seen=new Set();
  for(const [,label,body] of menu.matchAll(/<optgroup label="([^"]+)">([\s\S]*?)<\/optgroup>/g)){
    for(const [,key] of body.matchAll(/<option value="([^"]+)"/g)){
      assert.ok(catalog[key],key);
      assert.ok(!seen.has(key),`duplicate ${key}`);seen.add(key);
      assert.equal((catalog[key].form?.type||0)>0,label.startsWith('Cached'),key);
    }
  }
  assert.deepEqual([...seen].sort(),Object.keys(catalog).sort());
});

test('cached painted folds preserve animation and quality choices',()=>{
  const preset=catalog.cached_ink_folds;
  assert.equal(preset.form.type,9);
  for(const key of Object.keys(preset.values))assert.ok(!/anim|field-quality|render-scale|temporal-cell/.test(key),key);
  assert.equal(preset.values['sh-vel-y'],0);
  assert.notEqual(preset.values['sh-vel-x'],preset.values['de-vel-x']);
});

 test('twelve curated sky scenes cover both methods without replacing existing presets',()=>{
   const demos=Object.values(catalog).filter(p=>p.demoGrade!==undefined);
   assert.equal(demos.length,12);
   assert.equal(demos.filter(p=>p.form.type>0).length,8);
   assert.equal(demos.filter(p=>p.form.type===0).length,4);
   for(const demo of demos){
     assert.ok(demo.form.span>=180);assert.ok(demo.form.halfY>0);
     assert.equal(demo.form.camera.length,5);
     for(const key of Object.keys(demo.values))assert.ok(!/anim|field-quality|render-scale|temporal-cell/.test(key),key);
   }
 });
