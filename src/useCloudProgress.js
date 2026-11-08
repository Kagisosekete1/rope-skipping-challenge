import { useEffect, useRef, useState } from 'react';
import { loadSave } from './game';
// Online point balances never enter this practice-progress document.
const fields=['level','coins','xp','wins','matches','best','owned','looks','rope','sound','music','musicVersion','quality'];
const readCache=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
const writeCache=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Cloud upload still runs if device storage is full. */}};
const documentFor=s=>Object.fromEntries(fields.map(k=>[k,s[k]]));
export function useCloudProgress(account, save, setSave){
 const [status,setStatus]=useState('Saved on this device'),[ready,setReady]=useState(null);
 const hydrated=useRef(null), latest=useRef(save);latest.current=save;
 useEffect(()=>{
  hydrated.current=null;setReady(null);
  if(!account.authReady)return;
  if(!account.user){const guest=localStorage.getItem('rsc_guest');if(guest)setSave(loadSave({getItem:()=>guest}));setReady('guest');setStatus('Guest · saved on this device');return;}
  if(!localStorage.getItem('rsc_guest'))localStorage.setItem('rsc_guest',JSON.stringify(latest.current));
  let active=true;const id=account.user.id;
  setStatus('Restoring cloud progress…');
  account.client.from('practice_progress').select('save,updated_at').eq('user_id',id).maybeSingle().then(({data,error})=>{
   if(!active)return;
   if(error){setStatus('Cloud save unavailable · device save kept');return;}
   const cached=readCache('rsc_account_'+id);
   const source=cached?.pending && (!data?.updated_at || cached.updated_at>data.updated_at) ? cached.save : data?.save;
   if(source){const clean=loadSave({getItem:()=>JSON.stringify(source)});setSave(s=>({...s,...documentFor(clean)}));}
   hydrated.current=id;setReady(id);setStatus('Cloud progress connected');
  });return()=>{active=false;};
 },[account.user?.id,account.authReady]);
 useEffect(()=>{
  if(!account.user){if(account.authReady&&ready==='guest')localStorage.setItem('rsc_guest',JSON.stringify(save));return;}
  if(ready!==account.user.id)return;
  const id=account.user.id;
  const snapshot=documentFor(save),stamp=new Date().toISOString();
  writeCache('rsc_account_'+id,{save:snapshot,updated_at:stamp,pending:true});
  const timer=setTimeout(async()=>{
   setStatus('Saving progress…');
   const {error}=await account.client.from('practice_progress').upsert({user_id:id,save:snapshot,updated_at:stamp});
   if(!error){const cache=readCache('rsc_account_'+id);if(cache?.updated_at===stamp)writeCache('rsc_account_'+id,{...cache,pending:false});}
   if(hydrated.current===id)setStatus(error?'Cloud save failed · device save kept':'Progress saved to your account');
  },900);return()=>clearTimeout(timer);
 },[save,account.user?.id,ready,account.authReady]);
 return {status};
}
