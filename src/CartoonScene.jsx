import React,{useEffect,useRef,useState} from 'react';
import {drawCharacter,drawBackground,scenePose,cartoonRope,holderGrip,drawSpectator,playgroundLayout,courtActors,drawSkyTraffic,drawGameLogo,drawGroundShadow,INK} from './cartoon-art';
import ItemArt from './ItemArt';
import {sceneCast} from './cast';
import {ropeFrame,drawRopeLayer} from './rope-motion';
import {ITEMS,SKIN} from './game';
export function CartoonPreview({kind=0,look={},robot=false,className='',mode=false,looks=[],portrait=false}){
 const canvas=useRef(null);
 useEffect(()=>{const c=canvas.current?.getContext('2d');if(!c)return;c.clearRect(0,0,360,320);
 if(mode){drawCharacter(c,{x:105,y:306,scale:.86,kind:1,look:looks[1],robot:robot,time:2});drawCharacter(c,{x:255,y:306,scale:.86,kind:robot?0:2,look:looks[robot?0:2],time:1});}
 else drawCharacter(c,{x:portrait?220:180,y:portrait?580:315,scale:portrait?1.65:1,kind,look,robot,time:2});
 },[kind,look.outfit,look.hair,look.skin,look.shoes,look.style,robot,mode,looks,portrait]);
 return <canvas ref={canvas} className={className} width="360" height="320" aria-label={robot?'BeatBot cartoon challenger':'Original cartoon crew character'} role="img"/>;
}
const PIPS={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
export function CartoonDie({value=1,rolling=false,reroll=false,onRoll,canRoll=false}){
 const [spinFace,setSpinFace]=useState(value);
 useEffect(()=>{if(!rolling){setSpinFace(value);return;}let n=value;const id=setInterval(()=>setSpinFace(n=n%6+1),80);return()=>clearInterval(id);},[rolling,value]);
 const shown=rolling?spinFace:value;
 const Tag=onRoll?"button":"div";
 return <Tag type={onRoll?'button':undefined} onClick={onRoll} disabled={onRoll?!canRoll:undefined} className={'dice-showcase cartoon-die '+(rolling?'rolling':'')} role={onRoll?undefined:"img"} aria-label={reroll?"Six jumps cleared! Tap for your bonus roll":rolling?'Dice rolling':`Die showing ${value} dots`}><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M17 7 H77 Q88 7 88 19 V76 Q88 90 76 91 H20 Q7 90 7 77 V20 Q7 7 17 7Z" fill="#fff9e4" stroke={INK} strokeWidth="5"/><path d="M88 21 L96 30 V83 Q96 96 82 97 H25 L18 91 H76 Q88 91 88 76Z" fill="#e2bb72" stroke={INK} strokeWidth="4"/>{(PIPS[shown]||PIPS[1]).map(([x,y],i)=><circle key={i} cx={48+x*22} cy={48+y*22} r="7" fill={INK}/>)}</svg><span>{rolling?'ROLLING!':reroll?'BONUS ROLL':canRoll?'TAP TO ROLL':'YOUR ROLL'}</span></Tag>;
}
export function CartoonItem(props){return <ItemArt {...props}/>;}
export default function CartoonScene(props){
 const canvas=useRef(null),live=useRef(props);live.current=props;
 useEffect(()=>{
  const el=canvas.current,c=el?.getContext('2d');if(!c)return;
  let frame,last=0,time=0,width=0,height=0,backKey='';
  const back=document.createElement('canvas'),bc=back.getContext('2d');
  document.fonts?.ready.then(()=>{backKey='';});
  const draw=now=>{
   const p=live.current,dt=last?Math.min((now-last)/1000,.05):0;last=now;
   if(!document.hidden){time+=dt;if(p.screen==='gameplay'){p.engine.current.tick(dt);if(!p.engine.current.paused)p.engine.current.previewJumpAge=(now-(p.engine.current.previewJumpAt??-9000000))/1000;}}
   const rect=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,p.save.quality==='low'?1:1.7);
   if(rect.width>0&&rect.height>0){if(width!==rect.width||height!==rect.height||el.width!==Math.round(rect.width*dpr)){width=rect.width;height=rect.height;el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);}
    const w=1000,h=1000*height/width;c.setTransform(el.width/w,0,0,el.height/h,0,0);c.clearRect(0,0,w,h);
    const key=width+':'+height+':'+(p.save.level||1);
    if(bc){if(key!==backKey){back.width=el.width;back.height=el.height;bc.setTransform(back.width/w,0,0,back.height/h,0,0);drawBackground(bc,w,h,0,p.save.level||1);backKey=key;}c.drawImage(back,-3+Math.sin(time*.12)*2,-2,w+6,h+4);}else drawBackground(c,w,h,0,p.save.level||1);
    drawSkyTraffic(c,w,h,time);
    // Background life stays behind the action and uses a slow walk cycle.
    for(let i=0;i<3;i++){const x=((time*16+i*370)%(w+200))-100,y=playgroundLayout(h).spectatorFloor;drawGroundShadow(c,x,y-7*Math.min(.40,h/2200),Math.min(.40,h/2200)*.7);drawSpectator(c,{x,y,scale:Math.min(.40,h/2200),time:time+i,variant:i});}
    for(let i=0;i<4;i++){const x=((time*34+i*290)%(w+180))-90,y=Math.min(playgroundLayout(h).horizon-70,h*.26)+i%2*35+Math.sin(time+i)*10;c.beginPath();c.strokeStyle=INK;c.lineWidth=3;c.moveTo(x-14,y-Math.sin(time*5+i)*7);c.quadraticCurveTo(x-8,y-12,x,y);c.quadraticCurveTo(x+8,y-12,x+14,y-Math.sin(time*5+i)*7);c.stroke();}
    const gameplay=p.screen==='gameplay',welcome=p.screen==='welcome',custom=p.screen==='customize',profile=p.screen==='profile',reward=p.screen==='rewards';
    const pose=scenePose(p.engine,time,p.screen),m=p.engine.current,actors=courtActors(width,height,gameplay),scale=actors.scale,floor=actors.floor;
    const cast=sceneCast(p.save.profile,m,p.screen);
    const kind=custom?p.selection:cast.kind,robot=cast.robot;
    const emotion=reward?'win':gameplay&&p.match.frozen?.[m.current]?'frozen':gameplay&&m.effects?.[m.current]?.shield?'shield':gameplay&&m.result==='miss'?'miss':gameplay&&m.progress?.[m.current]>=75?'happy':gameplay&&m.state==='ready'?'ready':'idle';
    if(['welcome','home','gameplay'].includes(p.screen)){
     const y=floor,handY=y-123*scale,phase=pose.phase;
     const nodes=ropeFrame(phase,{floor,scale,jump:pose.jump,kind});
     drawRopeLayer(c,nodes,false,ITEMS.rope[p.save.rope]?.color||'#ffdd52',time);
     const [leftKind,rightKind]=cast.holders;
     drawGroundShadow(c,130,floor,scale);drawGroundShadow(c,870,floor,scale);drawGroundShadow(c,500,floor,scale,pose.jump);
     drawCharacter(c,{x:130,y,scale,kind:leftKind,look:p.save.looks[leftKind],time,holder:1,phase});
     drawCharacter(c,{x:870,y,scale,kind:rightKind,look:p.save.looks[rightKind],time,holder:1,phase,flip:true});
     drawCharacter(c,{x:500,y:floor,scale,kind,look:p.save.looks[kind],time,jump:pose.jump,emotion,robot});
     drawRopeLayer(c,nodes,true,ITEMS.rope[p.save.rope]?.color||'#ffdd52',time);
     // Redraw closed fingers over the rope endpoints so the handles visibly sit inside each fist.
     for(const [x,flip] of [[130,false],[870,true]]){const [gx,gy]=holderGrip(x,floor,scale,flip,phase);c.save();c.translate(gx,gy+22*scale);c.scale((flip?-1:1)*scale,scale);c.fillStyle=SKIN[p.save.looks[flip?cast.holders[1]:cast.holders[0]]?.skin??2];c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.roundRect(-14,-9,27,21,7);c.fill();c.stroke();c.beginPath();c.moveTo(-8,-1);c.lineTo(10,1);c.moveTo(-7,6);c.lineTo(9,8);c.stroke();c.restore();}
     if(gameplay&&m.combo>=3&&pose.jump>.2){c.save();c.fillStyle='#ffdc68';c.strokeStyle=INK;c.lineWidth=2;for(let i=0;i<5;i++){const a=time*2+i*Math.PI*.4,sx=500+Math.cos(a)*100*scale,sy=floor-210*scale+Math.sin(a)*40*scale;c.beginPath();for(let j=0;j<10;j++){const r=j%2?4:9;c.lineTo(sx+Math.cos(j*Math.PI/5)*r,sy+Math.sin(j*Math.PI/5)*r);}c.closePath();c.fill();c.stroke();}c.restore();}
     if(pose.jump>.1){for(const side of [-1,1]){c.strokeStyle='#fff8df';c.lineWidth=4;c.beginPath();c.moveTo(500+side*65*scale,floor-60);c.lineTo(500+side*74*scale,floor-95);c.stroke();}}
     if(gameplay&&m.result==='miss'&&m.state==='turnEnd'){c.font='900 34px Nunito';c.textAlign='center';c.lineWidth=6;c.strokeStyle=INK;c.fillStyle='#ffe46e';c.strokeText('WHOOPS!',500,floor-340*scale);c.fillText('WHOOPS!',500,floor-340*scale);}
    }else if(custom||profile||reward){const x=reward?500:width<650?270:280,y=reward?h*.64:floor,s=scale*(reward?1.12:1.17);drawGroundShadow(c,x,y,s);drawCharacter(c,{x,y,scale:s,kind,look:custom?p.lookDraft:p.save.looks[kind],time,emotion,robot});}
    if(gameplay&&m.jumpAge>.69&&m.jumpAge<.95){c.save();c.globalAlpha=1-(m.jumpAge-.69)/.26;c.fillStyle='#fff2cf';c.strokeStyle=INK;c.lineWidth=3;for(const side of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.ellipse(500+side*(25+i*19)*scale,floor+7-i*6,15+i*3,9+i*2,0,0,Math.PI*2);c.fill();c.stroke();}c.restore();}
    if(welcome){const logoWidth=Math.min(820,h*.45);drawGameLogo(c,(w-logoWidth)/2,Math.max(60,h*.10),logoWidth);}
    if(reward){for(let i=0;i<28;i++){const x=(i*137+Math.sin(time+i)*20)%1000,y=(time*80+i*89)%h;c.save();c.translate(x,y);c.rotate(time+i);c.fillStyle=['#ff6d91','#ffe16a','#5bbeb9'][i%3];c.fillRect(-4,-9,8,18);c.restore();}}
   }
   frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[]);
 return <canvas className="cartoon-world" ref={canvas} aria-label="Animated original cartoon playground" role="img"/>;
}
