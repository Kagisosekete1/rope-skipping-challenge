import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {drawCharacter,drawBackground,scenePose} from '../src/cartoon-art';
import {CartoonDie} from '../src/CartoonScene';
import {Match,defaultSave} from '../src/game';
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
test('all six cartoon dice faces contain the correct number of pips and no numeric face text',()=>{
 for(let value=1;value<=6;value++){const svg=renderToStaticMarkup(<CartoonDie value={value}/>);assert.equal((svg.match(/<circle /g)||[]).length,value);assert.equal(svg.includes('<text'),false);assert.match(svg,new RegExp(`Die showing ${value} dots`));}
});
test('crew cosmetics, facial reactions, BeatBot and every playground palette render as original 2D cels',()=>{
 const canvas=createCanvas(640,800),c=canvas.getContext('2d');const hashes=[];
 for(let i=0;i<8;i++){c.clearRect(0,0,640,800);drawBackground(c,640,800,i,i*4+1);drawCharacter(c,{x:320,y:690,kind:i%3,look:{outfit:i,hair:i%3,skin:i%5,style:i%3,shoes:i%3},time:i,jump:i%2,emotion:['idle','happy','miss','win','frozen','shield'][i%6],robot:i===7,walk:i===5});const bytes=canvas.toBuffer('image/png');assert.ok(bytes.length>10000);hashes.push(bytes.toString('base64').slice(-3000));}
 assert.equal(new Set(hashes).size,8);
});
test('2D rope and jumper read the existing authoritative timing without modifying scores',()=>{
 const engine={current:new Match(()=>{},()=>.4)};engine.current.phase=4.3;engine.current.jumpAge=.38;const before=engine.current.snapshot();const pose=scenePose(engine,10,'gameplay');assert.equal(pose.phase,4.3);assert.ok(pose.jump>1);assert.deepEqual(engine.current.snapshot(),before);const welcome=scenePose(engine,.1,'welcome');assert.ok(Number.isFinite(welcome.jump));assert.equal(defaultSave().level,1);
});
