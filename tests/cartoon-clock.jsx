import {dom} from './dom-environment.js';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import CartoonScene from '../src/CartoonScene';
import {Match,defaultSave} from '../src/game';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
test('actual 2D animation loop advances the existing match clock once per frame, respects pause and cancels on unmount',async()=>{
 const frames=new Map(),surfaces=new WeakMap();let serial=0;
 const oldRAF=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
 globalThis.Path2D=Path2D;globalThis.requestAnimationFrame=fn=>{frames.set(++serial,fn);return serial;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
 const proto=window.HTMLCanvasElement.prototype,oldContext=proto.getContext,oldRect=proto.getBoundingClientRect;
 proto.getBoundingClientRect=()=>({width:390,height:844});
 proto.getContext=function(){if(!surfaces.has(this))surfaces.set(this,createCanvas(1000,2200));const ctx=surfaces.get(this).getContext('2d');return new Proxy(ctx,{get(target,key){if(key==='drawImage')return (image,...args)=>target.drawImage(surfaces.get(image)||image,...args);return typeof target[key]==='function'?target[key].bind(target):target[key];},set(target,key,value){target[key]=value;return true;}});};
 const engine={current:new Match()},root=createRoot(document.getElementById('root'));
 try{
 await act(async()=>root.render(<CartoonScene screen="gameplay" engine={engine} save={defaultSave()} match={engine.current.snapshot()}/>));
 const step=async time=>{const list=[...frames.values()];frames.clear();await act(async()=>list.forEach(fn=>fn(time)));};
 await step(100);await step(116);await step(132);
 assert.ok(engine.current.time>.03&&engine.current.time<.04,'one simulation tick per frame');
 engine.current.pause();const before=engine.current.time;await step(148);assert.equal(engine.current.time,before);
 await act(async()=>root.unmount());assert.equal(frames.size,0);
 }finally{proto.getContext=oldContext;proto.getBoundingClientRect=oldRect;globalThis.requestAnimationFrame=oldRAF;globalThis.cancelAnimationFrame=oldCancel;dom.window.close();}
});
