import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/rope-art.mjs',bundle:true,format:'esm',platform:'node'});
const {cartoonRope,holderGrip,playgroundLayout,courtActors}=await import('../.test-tmp/rope-art.mjs');
test('cartoon rope sweeps under the feet at collision, over the head halfway through and keeps both handles anchored',()=>{
 const floor=900,scale=1.3;
 for(let i=0;i<720;i++){const p=cartoonRope(i*Math.PI/180,floor,scale);for(const value of [...p.start,...p.control,...p.end])assert.ok(Number.isFinite(value));assert.equal(p.start[1],p.end[1]);const mid=p.start[1]*.25+p.control[1]*.5+p.end[1]*.25;assert.ok(mid<=floor);}
 const low=cartoonRope(0,floor,scale),high=cartoonRope(Math.PI,floor,scale);assert.equal((low.start[1]+low.control[1])/2,floor-8);assert.ok((high.start[1]+high.control[1])/2<floor-300*scale);
});

test('rope ends use the same closed-fist anchors and spectators stand below the mural on every layout',()=>{
 for(const phase of [0,.4,1.5,3,5]){const r=cartoonRope(phase,900,1.3);assert.deepEqual(r.start,holderGrip(130,900,1.3,false,phase));assert.deepEqual(r.end,holderGrip(870,900,1.3,true,phase));}
 for(const height of [500,700,1200,2200]){const layout=playgroundLayout(height);assert.ok(layout.spectatorFloor>layout.courtTop);assert.ok(layout.spectatorFloor<height);}
 const front=cartoonRope(Math.PI/2,900,1),back=cartoonRope(Math.PI*1.5,900,1);assert.notEqual(front.control[0],back.control[0],'projection traces rotation rather than a vertical line');
});

test('phone crew shares one age/scale and has clear separation from each other and the control dock',()=>{
 for(const [w,h] of [[360,740],[384,844],[576,1280],[1100,700]]){const a=courtActors(w,h);assert.equal(a.positions[1]-a.positions[0],a.positions[2]-a.positions[1]);assert.ok(a.positions[1]-a.positions[0]>290*a.scale);assert.ok(a.floor/a.h<.73);assert.ok(a.floor-350*a.scale>0);const rope=cartoonRope(Math.PI,a.floor,a.scale);const middle=(rope.start[1]+rope.control[1])/2;assert.ok(middle<a.floor-(350+97)*a.scale,'overhead rope clears hair even with a warm-up hop');}
});
