import {characterKind,AVATARS} from './profile-data';
export function sceneCast(profile,match={},screen='gameplay'){
 const primary=characterKind(profile),slot=screen==='rewards'?(match.winner??0):(match.current??0);
 let kind=primary,robot=false;
 if(['gameplay','rewards'].includes(screen)){
  robot=match.mode==='cpu'&&slot===1;
  if(match.mode==='online'&&slot!==match.mySlot)kind=Math.max(0,AVATARS.indexOf(match.avatars?.[slot]||(primary===1?'pink':'blue')));
  else if(match.mode==='pvp'&&slot===1)kind=primary===1?0:1;
 }
 const holders=robot?[primary,primary===2?1:2]:[0,1,2].filter(k=>k!==kind);
 return {kind,robot,holders,primary};
}
