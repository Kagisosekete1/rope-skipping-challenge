import test from 'node:test';
import assert from 'node:assert/strict';
import {jumpTap,jumpEnergy} from '../src/controls.js';
import {Match} from '../src/game.js';
test('Jump immediately starts an idle roll and a warm-up hop without awarding points',()=>{
 const m=new Match(()=>{},()=>.4);assert.equal(jumpTap(m,120),'warmup');assert.equal(m.state,'rolling');assert.equal(m.previewJumpAt,120);assert.deepEqual(m.progress,[0,0]);assert.equal(jumpTap(m,200),'warmup');assert.deepEqual(m.progress,[0,0]);
 m.state='skipping';m.jumpAge=9;assert.equal(jumpTap(m,300),'jump');assert.equal(m.jumpAge,0);assert.equal(jumpTap(m,305),'recovering');
});
test('off-turn, paused and frozen taps cannot control the opponent or bypass a freeze',()=>{
 const m=new Match();m.current=1;assert.equal(jumpTap(m),'waiting');assert.equal(m.jumpAge,9);m.current=0;m.frozenUntil[0]=m.time+1;assert.equal(jumpTap(m),'frozen');assert.equal(jumpEnergy(m,0).label,'FROZEN');m.pause();assert.equal(jumpTap(m),'paused');
});
test('live energy follows actual jump recovery rather than inventing additional score',()=>{
 const m=new Match();m.state='skipping';m.jumpAge=.41;assert.equal(jumpEnergy(m,0).value,50);assert.equal(jumpEnergy(m,0).label,'JUMPING');m.jumpAge=.82;assert.equal(jumpEnergy(m,0).label,'READY');assert.equal(jumpEnergy(m,1).label,'WAITING');assert.deepEqual(m.progress,[0,0]);
});
