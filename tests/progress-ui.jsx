import './dom-environment.js';
import React,{act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import test from 'node:test';
import assert from 'node:assert/strict';
import {useCloudProgress} from '../src/useCloudProgress';
import {defaultSave} from '../src/game';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('cloud hydration precedes uploads, excludes stake currency and restores guest save on signout',async()=>{
 localStorage.clear();const writes=[];let release;let setAccount,change,latest;
 const client={from:()=>({select:()=>({eq:()=>({maybeSingle:()=>new Promise(r=>release=r)})}),upsert:async row=>{writes.push(row);return {error:null};}})};
 function Harness(){const [account,setA]=useState({authReady:true,user:null,client});setAccount=setA;const [save,setSave]=useState({...defaultSave(),wins:3,level:4});change=setSave;latest=save;const cloud=useCloudProgress(account,save,setSave);return <p>{cloud.status}</p>;}
 const root=createRoot(document.getElementById('root'));
 try{
 await act(async()=>root.render(<Harness/>));
 await act(async()=>setAccount({authReady:true,user:{id:'A'},client}));
 await act(async()=>{await wait(1000);});assert.equal(writes.length,0,'no upload before download');
 await act(async()=>release({data:{save:{...defaultSave(),level:12,wins:11}},error:null}));
 assert.equal(latest.level,12);
 await act(async()=>{await wait(1000);});assert.equal(writes[0].save.level,12);assert.equal('points' in writes[0].save,false);assert.equal('freezes' in writes[0].save,false);
 await act(async()=>change(s=>({...s,level:13,wins:12})));
 await act(async()=>{await wait(1000);});assert.equal(writes.at(-1).save.level,13);
 await act(async()=>setAccount({authReady:true,user:null,client}));assert.equal(latest.level,4,'guest progress remains separate');
 }finally{await act(async()=>root.unmount());}
});
