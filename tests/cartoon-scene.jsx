import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {drawCharacter,drawBackground,scenePose,aircraftMotion,drawThemeLife} from '../src/cartoon-art';
import ItemArt from '../src/ItemArt';
import {ropeFrame,drawRopeLayer,bodyDepthAt} from '../src/rope-motion';
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

test('customization uses standalone SVG artwork and visibly changes every skin, hair and hairstyle selection',()=>{
 for(const category of ['skin','hair','style']){const options=category==='skin'?5:3;const outputs=new Set();for(let index=0;index<options;index++){const markup=renderToStaticMarkup(<ItemArt category={category} index={index} look={{hair:0,skin:2}}/>);assert.match(markup,/role="img"/);assert.match(markup,/<path/);assert.equal(markup.includes('<canvas'),false);outputs.add(markup);}assert.equal(outputs.size,options);}
 for(const category of ['outfit','shoes','rope']){const first=renderToStaticMarkup(<ItemArt category={category} item={{color:'#ff4488'}}/>),second=renderToStaticMarkup(<ItemArt category={category} item={{color:'#3366ee'}}/>);assert.notEqual(first,second);assert.match(first,/#ff4488/);}
});

test('back rope is hidden by the actual boy silhouette, while the front pass remains visible',()=>{
 const boy=createCanvas(1000,1000),bc=boy.getContext('2d');drawCharacter(bc,{x:500,y:900,kind:1,scale:1,time:2});
 const body=bc.getImageData(0,0,1000,1000).data;
 const render=phase=>{const image=createCanvas(1000,1000),c=image.getContext('2d'),nodes=ropeFrame(phase,{floor:900,scale:1,kind:1});c.fillStyle='#fff';c.fillRect(0,0,1000,1000);drawRopeLayer(c,nodes,false,'#ffd128');c.drawImage(boy,0,0);drawRopeLayer(c,nodes,true,'#ffd128');return {nodes,pixels:c.getImageData(0,0,1000,1000).data};};
 for(const [phase,back] of [[Math.PI*.5,true],[Math.PI*1.5,false]]){const {nodes,pixels}=render(phase),overlap=nodes.filter(p=>{const k=(Math.round(p.y)*1000+Math.round(p.x))*4;return body[k+3]===255&&Math.abs(p.z)>10;});assert.ok(overlap.length>0);for(const p of overlap){const k=(Math.round(p.y)*1000+Math.round(p.x))*4;if(back)assert.deepEqual([...pixels.slice(k,k+3)],[...body.slice(k,k+3)]);else assert.notDeepEqual([...pixels.slice(k,k+3)],[...body.slice(k,k+3)]);}}
});
test('rope rotates continuously without body-dependent snaps, and aircraft point in their travel direction',()=>{
 const tau=Math.PI*2,options={floor:900,scale:1,kind:1,jump:.8};
 for(let i=0;i<720;i++){const a=ropeFrame(i*tau/720,options),b=ropeFrame((i+1)*tau/720,options);for(let j=0;j<a.length;j++)assert.ok(Math.hypot(a[j].x-b[j].x,a[j].y-b[j].y)<6,'smooth continuous full orbit');}
 const bottom=ropeFrame(0,options)[48];assert.ok(bottom.y>890);assert.ok(bodyDepthAt(bottom.x,bottom.y,options)===0,'jump clears underfoot crossing');
 for(const type of ['plane','helicopter']){const a=aircraftMotion(type,4,1000,2000),b=aircraftMotion(type,5,1000,2000);assert.equal(Math.sign(b.x-a.x),a.direction);}
});

test('BeatBot feet are mechanical and do not inherit human shoe cosmetics',()=>{
 const render=shoes=>{const image=createCanvas(360,400),c=image.getContext('2d');drawCharacter(c,{x:180,y:360,robot:true,kind:1,look:{shoes},time:2});return image.toBuffer('image/png');};
 assert.deepEqual(render(0),render(2));
});

test('a caught rope rests visibly in front and stays still until the next roll',()=>{
 const engine={current:{phase:.03,state:'turnEnd',result:'miss',jumpAge:9}};
 const pose=scenePose(engine,1,'gameplay');assert.equal(pose.caught,true);
 assert.equal(scenePose(engine,100,'gameplay').phase,pose.phase);
 const nodes=ropeFrame(pose.phase,{floor:900,scale:1});assert.ok(nodes[48].z>0,'front pass remains visible');assert.ok(nodes[48].y>850,'rope rests against feet');
 engine.current.state='ready';assert.equal(scenePose(engine,100,'gameplay').caught,false);
});
test('all six themed locations and animated play activities render distinctly',()=>{
 const scenes=new Set();for(const level of [1,11,21,31,41,51]){const image=createCanvas(640,900),c=image.getContext('2d');drawBackground(c,640,900,0,level);drawThemeLife(c,640,900,3,level);scenes.add(image.toBuffer('image/png').toString('base64'));}assert.equal(scenes.size,6);
});
