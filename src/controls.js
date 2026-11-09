// A tap always produces feedback. Only the existing engine can authorize a scored jump.
export function jumpTap(match,now=performance.now()){
 if(match.paused||match.state==='over')return 'paused';
 if(match.ai||match.isSpectating)return 'waiting';
 if(match.frozen?.[match.current]||match.frozenUntil?.[match.current]>match.time)return 'frozen';
 if(match.jump())return 'jump';
 if(match.state==='skipping')return 'recovering';
 if(match.state==='idle'&&!match.reroll)match.roll();
 match.previewJumpAt=now;match.previewJumpAge=0;match.previewJumpSlot=match.current;return 'warmup';
}
export function jumpEnergy(match,actor){
 if(match.paused)return {value:0,label:'PAUSED'};
 if(match.frozen?.[actor]||match.frozenUntil?.[actor]>match.time)return {value:0,label:'FROZEN'};
 if(match.current!==actor)return {value:100,label:'WAITING'};
 const age=match.state==='skipping'?match.jumpAge:match.previewJumpSlot===actor?match.previewJumpAge:9;
 if(age!=null&&age<.82)return {value:Math.max(0,Math.min(100,age/.82*100)),label:age<.76?'JUMPING':'RECOVERING'};
 return {value:100,label:match.state==='skipping'?'READY':'WARM-UP READY'};
}
