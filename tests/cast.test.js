import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({entryPoints:['src/cast.js'],outfile:'.test-tmp/cast.mjs',bundle:true,format:'esm',platform:'node'});
const {sceneCast}=await import('../.test-tmp/cast.mjs');
test('male and female profiles play as their gender-linked crew member with distinct rope holders',()=>{
 const boy=sceneCast({gender:'male',avatar:'pink'},{mode:'cpu',current:0});assert.equal(boy.kind,1);assert.deepEqual(boy.holders,[0,2]);
 const girl=sceneCast({gender:'female',avatar:'blue'},{mode:'cpu',current:0});assert.equal(girl.kind,0);assert.deepEqual(girl.holders,[1,2]);
 const robot=sceneCast({gender:'male',avatar:'blue'},{mode:'cpu',current:1});assert.equal(robot.robot,true);assert.equal(robot.holders[0],1);
 const online=sceneCast({gender:'male',avatar:'blue'},{mode:'online',current:1,mySlot:0,avatars:['blue','yellow']});assert.equal(online.kind,2);
});
