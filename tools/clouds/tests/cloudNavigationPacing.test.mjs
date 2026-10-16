import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const ui=await readFile(new URL('../cloudTestThreaded.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../cloudTest.worker.js',import.meta.url),'utf8');
const pump=ui.slice(ui.indexOf('let _frameRunActive ='),ui.indexOf('let _liveAnimationUpdateTimer ='));
const fences=worker.slice(worker.indexOf('function enqueueLoopGpuFence()'),worker.indexOf('function startLoop()'));

test('rapid camera input keeps the latest pose while a render is pending',async()=>{
  let release,entered;
  const firstEntered=new Promise(r=>entered=r),blocked=new Promise(r=>release=r);
  const calls=[],ticks=[];
  const run=new Function('rpc','nextAnimationFrame',`${pump};return runFrameLatest;`)(async(type,payload)=>{
    calls.push(payload.pose);
    if(calls.length===1){entered();await blocked;}
    return payload.pose;
  },async()=>ticks.push(calls.length));
  const initial=run({pose:0});
  await firstEntered;
  const updates=Array.from({length:100},(_,i)=>run({pose:i+1}));
  release();
  await Promise.all([initial,...updates]);
  assert.deepEqual(calls,[0,100]);
  assert.ok(ticks.length>=2,'input batches yield to another display tick');
});

test('navigation backpressure waits for the oldest GPU frame before allowing more work',async()=>{
  const releases=[];
  const queue={onSubmittedWorkDone:()=>new Promise(r=>releases.push(r))};
  const control=new Function('queue',`let loopGpuFences=[];const LOOP_MAX_GPU_FRAMES_IN_FLIGHT=3;
    ${fences};return {enqueue:enqueueLoopGpuFence,wait:waitForLoopGpuBackpressure,size:()=>loopGpuFences.length};`)(queue);
  control.enqueue();control.enqueue();
  let ready=false;
  const waiting=control.wait(1).then(()=>ready=true);
  await Promise.resolve();
  assert.equal(ready,false,'slow GPU applies backpressure instead of submitting obsolete views');
  releases[0]();await waiting;
  assert.equal(control.size(),1);
  control.enqueue();assert.equal(control.size(),2);
  releases[1]();releases[2]();await control.wait(0);
  assert.equal(control.size(),0);
});

test('navigation timing updates are bounded without suppressing manual progress',()=>{
 const source=worker.slice(worker.indexOf('function emitTimingProgress('),worker.indexOf('let lastPermSeed'));
 let now=0,snapshots=0;const posts=[];
 const emit=new Function('performance','postMessage',`let loopRunning=false,lastFrameTimingPost=-Infinity;${source};return emitTimingProgress;`)(
  {now:()=>now},event=>posts.push(event));
 const report={snapshot:()=>{snapshots++;return {};}};
 for(let i=0;i<60;i++){now=i*1000/60;emit(report,'frame:start',true);emit(report,'frame:complete',true);}
 assert.equal(posts.length,4);assert.equal(snapshots,4);
 emit(report,'frame:start');assert.equal(posts.length,5);
 emit(report,'startup:compiling',true);assert.equal(posts.length,6);
});
