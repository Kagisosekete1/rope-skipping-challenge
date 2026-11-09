import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/rope-art.mjs',bundle:true,format:'esm',platform:'node'});
const {cartoonRope}=await import('../.test-tmp/rope-art.mjs');
test('cartoon rope sweeps under the feet at collision, over the head halfway through and keeps both handles anchored',()=>{
 const floor=900,scale=1.3;
 for(let i=0;i<720;i++){const p=cartoonRope(i*Math.PI/180,floor,scale);for(const value of [...p.start,...p.control,...p.end])assert.ok(Number.isFinite(value));assert.equal(p.start[1],p.end[1]);const mid=p.start[1]*.25+p.control[1]*.5+p.end[1]*.25;assert.ok(mid<=floor);}
 const low=cartoonRope(0,floor,scale),high=cartoonRope(Math.PI,floor,scale);assert.equal((low.start[1]+low.control[1])/2,floor-8);assert.ok((high.start[1]+high.control[1])/2<floor-300*scale);
});
