import React,{useEffect,useRef,useState} from 'react';
import {drawCharacter,drawBackground,scenePose,cartoonRope,holderGrip,drawSpectator,playgroundLayout,INK} from './cartoon-art';
import {ITEMS,SKIN} from './game';
export function CartoonPreview({kind=0,look={},robot=false,className='',mode=false,looks=[]}){
 const canvas=useRef(null);
 useEffect(()=>{const c=canvas.current?.getContext('2d');if(!c)return;c.clearRect(0,0,360,320);
 if(mode){drawCharacter(c,{x:105,y:306,scale:.86,kind:1,look:looks[1],robot:robot,time:2});drawCharacter(c,{x:255,y:306,scale:.86,kind:robot?0:2,look:looks[robot?0:2],time:1});}
 else drawCharacter(c,{x:180,y:315,scale:1,kind,look,robot,time:2});
 },[kind,look.outfit,look.hair,look.skin,look.shoes,look.style,robot,mode,looks]);
 return <canvas ref={canvas} className={className} width="360" height="320" aria-label={robot?'BeatBot cartoon challenger':'Original cartoon crew character'} role="img"/>;
}
const PIPS={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
export function CartoonDie({value=1,rolling=false}){
 const [spinFace,setSpinFace]=useState(value);
 useEffect(()=>{if(!rolling){setSpinFace(value);return;}let n=value;const id=setInterval(()=>setSpinFace(n=n%6+1),80);return()=>clearInterval(id);},[rolling,value]);
 const shown=rolling?spinFace:value;
 return <div className={'dice-showcase cartoon-die '+(rolling?'rolling':'')} role="img" aria-label={rolling?'Dice rolling':`Die showing ${value} dots`}><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M17 7 H77 Q88 7 88 19 V76 Q88 90 76 91 H20 Q7 90 7 77 V20 Q7 7 17 7Z" fill="#fff9e4" stroke={INK} strokeWidth="5"/><path d="M88 21 L96 30 V83 Q96 96 82 97 H25 L18 91 H76 Q88 91 88 76Z" fill="#e2bb72" stroke={INK} strokeWidth="4"/>{(PIPS[shown]||PIPS[1]).map(([x,y],i)=><circle key={i} cx={48+x*22} cy={48+y*22} r="7" fill={INK}/>)}</svg><span>{rolling?'ROLLING!':'YOUR ROLL'}</span></div>;
}
export function CartoonItem({category,item,index}){
 if(category==='hair')return <CartoonPreview className="item-model" look={{hair:index,skin:2,outfit:0}}/>;
 const color=item.color;
 return <svg className="item-model cartoon-item" viewBox="0 0 180 150" aria-hidden="true" stroke={INK} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
 {category==='outfit'?<><path d="M57 36 Q90 10 123 36 L155 78 132 99 117 78 120 132 H60 L62 78 48 99 25 78Z" fill={color}/><path d="M57 36 Q89 66 123 36 L109 18 Q90 8 70 18Z" fill={color}/><path d="M72 100H108L105 121H75Z" fill={color}/><path d="M79 48V82 M101 48V82" stroke="#fff9e4"/></>:category==='shoes'?<><path d="M30 53 L65 42 83 82 138 94 Q160 99 155 119 H29Z" fill={color}/><path d="M29 114 H155 V132H29Z" fill="#fff9e4"/><path d="M57 71L81 67 M63 83L88 79 M71 94L99 90" stroke="#fff9e4"/><path d="M42 96L52 82 63 100 50 105Z" fill="#fff9e4" strokeWidth="2"/></>:<><ellipse cx="90" cy="72" rx="66" ry="45" fill="none" strokeWidth="14"/><ellipse cx="90" cy="72" rx="66" ry="45" fill="none" stroke={color} strokeWidth="7"/><path d="M40 103L30 130 M145 100L154 124" strokeWidth="14"/><path d="M40 103L30 130 M145 100L154 124" stroke={color} strokeWidth="8"/></>}
 </svg>;
}
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
    // Cloud cels move independently from buildings, fence and foreground walkers.
    c.save();c.beginPath();c.rect(0,0,w,h*.35);c.clip();c.fillStyle='#fff6d8';c.strokeStyle='#496b70';c.lineWidth=3;
    for(let i=0;i<2;i++){const x=((time*9+i*680)%(w+200))-100,y=65+i*130;c.beginPath();c.ellipse(x,y,65,21,0,0,Math.PI*2);c.fill();c.stroke();}c.restore();
    // Background life stays behind the action and uses a slow walk cycle.
    for(let i=0;i<3;i++){const x=((time*16+i*370)%(w+200))-100,y=playgroundLayout(h).spectatorFloor;drawSpectator(c,{x,y,scale:Math.min(.40,h/2200),time:time+i,variant:i});}
    for(let i=0;i<4;i++){const x=((time*34+i*290)%(w+180))-90,y=85+i%2*70+Math.sin(time+i)*10;c.beginPath();c.strokeStyle=INK;c.lineWidth=3;c.moveTo(x-14,y-Math.sin(time*5+i)*7);c.quadraticCurveTo(x-8,y-12,x,y);c.quadraticCurveTo(x+8,y-12,x+14,y-Math.sin(time*5+i)*7);c.stroke();}
    const gameplay=p.screen==='gameplay',welcome=p.screen==='welcome',custom=p.screen==='customize',profile=p.screen==='profile',reward=p.screen==='rewards';
    const pose=scenePose(p.engine,time,p.screen),m=p.engine.current,controlSpace=Math.min(235,Math.max(175,height*.30))*1000/width,scale=Math.min(1.7,Math.max(.5,(gameplay?h-controlSpace-180:h*.75)*.5/315)),floor=gameplay?h-controlSpace:h*.77;
    let kind=gameplay&&m.mode==='cpu'&&m.current===1?0:gameplay?m.current:custom?p.selection:profile?Math.max(0,['pink','blue','yellow'].indexOf(p.save.profile.avatar)):reward?m.winner||0:0;
    const robot=(gameplay||reward)&&m.mode==='cpu'&&(gameplay?m.current:m.winner)===1;
    const emotion=reward?'win':gameplay&&p.match.frozen?.[m.current]?'frozen':gameplay&&m.effects?.[m.current]?.shield?'shield':gameplay&&m.result==='miss'?'miss':gameplay&&m.progress?.[m.current]>=75?'happy':gameplay&&m.state==='ready'?'ready':'idle';
    if(['welcome','home','gameplay'].includes(p.screen)){
     const y=floor-8,handY=y-123*scale*.75,phase=pose.phase;
     const rope=front=>{if((Math.sin(phase+.15)>=0)!==front)return;const curve=cartoonRope(phase,floor,scale);c.beginPath();c.moveTo(...curve.start);c.quadraticCurveTo(...curve.control,...curve.end);c.strokeStyle=INK;c.lineWidth=front?13:10;c.stroke();c.strokeStyle=ITEMS.rope[p.save.rope]?.color||'#ffdd52';c.lineWidth=front?8:6;c.stroke();c.save();c.setLineDash([4,12]);c.lineDashOffset=-time*18;c.strokeStyle='#fff1aa';c.lineWidth=2;c.stroke();c.restore();};
     rope(false);
     drawCharacter(c,{x:180,y,scale:scale*.75,kind:1,look:p.save.looks[1],time,holder:1,phase});
     drawCharacter(c,{x:820,y,scale:scale*.75,kind:2,look:p.save.looks[2],time,holder:1,phase,flip:true});
     c.save();c.translate(500,floor+10);c.scale(1,.2);c.fillStyle='#81375340';c.beginPath();c.ellipse(0,0,75*(1-pose.jump*.2),55,0,0,Math.PI*2);c.fill();c.restore();
     drawCharacter(c,{x:500,y:floor,scale,kind,look:p.save.looks[kind],time,jump:pose.jump,emotion,robot});rope(true);
     // Redraw closed fingers over the rope endpoints so the handles visibly sit inside each fist.
     for(const [x,flip] of [[180,false],[820,true]]){const [gx,gy]=holderGrip(x,floor,scale,flip,phase);c.save();c.translate(gx,gy+22*scale*.75);c.scale((flip?-1:1)*scale*.75,scale*.75);c.fillStyle=SKIN[p.save.looks[flip?2:1]?.skin??(flip?2:3)];c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.roundRect(-14,-9,27,21,7);c.fill();c.stroke();c.beginPath();c.moveTo(-8,-1);c.lineTo(10,1);c.moveTo(-7,6);c.lineTo(9,8);c.stroke();c.restore();}
     if(pose.jump>.1){for(const side of [-1,1]){c.strokeStyle='#fff8df';c.lineWidth=4;c.beginPath();c.moveTo(500+side*65*scale,floor-60);c.lineTo(500+side*74*scale,floor-95);c.stroke();}}
     if(gameplay&&m.result==='miss'&&m.state==='turnEnd'){c.font='900 34px Nunito';c.textAlign='center';c.lineWidth=6;c.strokeStyle=INK;c.fillStyle='#ffe46e';c.strokeText('WHOOPS!',500,floor-340*scale);c.fillText('WHOOPS!',500,floor-340*scale);}
    }else if(custom||profile||reward){const x=width<650?270:280;drawCharacter(c,{x:reward?500:x,y:floor,scale:scale*1.17,kind,look:custom?p.lookDraft:p.save.looks[kind],time,emotion,robot});}
    if(gameplay&&m.jumpAge>.69&&m.jumpAge<.95){c.save();c.globalAlpha=1-(m.jumpAge-.69)/.26;c.fillStyle='#fff2cf';c.strokeStyle=INK;c.lineWidth=3;for(const side of [-1,1])for(let i=0;i<3;i++){c.beginPath();c.ellipse(500+side*(25+i*19)*scale,floor+7-i*6,15+i*3,9+i*2,0,0,Math.PI*2);c.fill();c.stroke();}c.restore();}
    if(welcome){c.save();c.translate(500,Math.max(140,h*.19));c.rotate(-.04);c.textAlign='center';c.lineJoin='round';for(const [text,y,size,col] of [['ROPE',-65,95,'#ffe16a'],['SKIPPING',29,105,'#ffe16a'],['CHALLENGE',91,48,'#fff9df']]){c.font=`900 ${size}px Nunito, sans-serif`;c.lineWidth=14;c.strokeStyle=INK;c.strokeText(text,0,y+7);c.fillStyle=col;c.fillText(text,0,y);}c.restore();}
    if(reward){for(let i=0;i<28;i++){const x=(i*137+Math.sin(time+i)*20)%1000,y=(time*80+i*89)%h;c.save();c.translate(x,y);c.rotate(time+i);c.fillStyle=['#ff6d91','#ffe16a','#5bbeb9'][i%3];c.fillRect(-4,-9,8,18);c.restore();}}
   }
   frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[]);
 return <canvas className="cartoon-world" ref={canvas} aria-label="Animated original cartoon playground" role="img"/>;
}
