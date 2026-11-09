import {levelTheme} from './themes';
import { COLORS, SKIN, ITEMS, jumpHeight } from './game';
export const INK='#202533';
function path(c,d,fill,stroke=INK,width=3.6){c.beginPath();const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(p);}}
function oval(c,x,y,rx,ry,color,stroke=INK,lw=2.8){c.beginPath();c.ellipse(x,y,rx,Math.max(.1,ry),0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function line(c,d,color=INK,w=5){path(c,d,null,color,w);}
function box(c,x,y,w,h,r,color){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();c.strokeStyle=INK;c.lineWidth=4;c.stroke();}
// The wrist, handle and rope tip all use this same articulated pose.
export function holderArmPose(phase){return {x:77+Math.cos(phase)*14,y:-213+Math.sin(phase)*22,angle:Math.cos(phase)*.38};}
function drawHand(c,skin,pose='relaxed'){
 if(pose==='grip'){
  line(c,'M0 -23 V19',INK,11);line(c,'M0 -22 V18','#ffcc54',6);
  path(c,'M-11 -8 Q-11 -14 -3 -13 L9 -10 Q16 -7 12 -1 L12 6 Q9 13 1 12 L-8 9 Q-13 4 -11 -8Z',skin,INK,2.6);
  line(c,'M-5 -5 L9 -3 M-5 2 L9 4',INK,1.6);
  path(c,'M-10 -8 Q-16 -10 -16 -3 Q-16 4 -6 7 L0 4 Q2 0 -4 -2Z',skin,INK,2.2);
 }else if(pose==='fist'){
  path(c,'M-11 6 L-12 -5 Q-13 -14 -5 -15 Q-2 -20 4 -16 Q12 -18 14 -10 L15 2 Q13 13 3 14 L-6 12Z',skin,INK,2.8);
  line(c,'M-5 -11 L-5 -6 M2 -13 L2 -7 M9 -10 L9 -5',INK,1.5);
  path(c,'M-10 -3 Q-17 -5 -16 2 Q-15 10 -4 10 L1 6 Q2 1 -4 1Z',skin,INK,2);
 }else{
  // Compact rounded palm, three short fingers and one thumb.
  path(c,'M-9 9 Q-15 4 -16 -2 Q-17 -9 -12 -9 L-8 -4 L-9 -16 Q-9 -23 -4 -22 Q0 -22 0 -15 L1 -20 Q3 -26 7 -23 Q10 -21 8 -13 L10 -17 Q14 -22 17 -17 Q19 -14 13 -4 L11 5 Q8 14 -1 14Z',skin,INK,2.7);
  line(c,'M-7 3 Q-2 0 5 3',INK,1.4);
 }
}
export function drawHolderGrip(c,{x,y,scale,flip=false,phase=0,skin}){
 const p=holderArmPose(phase);c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);c.translate(p.x,p.y);c.rotate(p.angle);drawHand(c,skin,'grip');c.restore();
}
export function drawCharacter(c,{x=0,y=0,scale=1,kind=0,look={},time=0,jump=0,emotion='idle',holder=0,phase=0,walk=false,robot=false,flip=false}={}){
 c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);
 const raisedHands=[];
 const shirt=COLORS[look.outfit??kind]||COLORS[0],skin=SKIN[look.skin??(kind===1?3:2)],hair=ITEMS.hair[look.hair??0]?.color||'#402217',shoe=ITEMS.shoes[look.shoes??kind]?.color||shirt;
 const step=walk?Math.sin(time*5):0,bounce=holder?0:walk?Math.abs(step)*4:0,win=emotion==='win',miss=emotion==='miss',excited=win||emotion==='happy',anticipate=emotion==='ready'?Math.sin(time*5)*.03:0;
 c.translate(0,-jump*92-bounce);if(win)c.rotate(Math.sin(time*6)*.055);const stretch=jump>0?1+.07*Math.sin(jump*Math.PI):1+anticipate;c.scale(1/stretch,stretch);
 // Only human characters use rubber-hose legs and canvas sneakers.
 if(!robot)for(const side of [-1,1]){const sx=side*22,sy=step*side*16,knee=jump?side*18:0;
 line(c,`M ${sx} -92 Q ${sx+knee} -44 ${sx+step*side*15} -12`,INK,23);
 line(c,`M ${sx-side*7} -87 Q ${sx+knee-side*7} -43 ${sx+step*side*15-side*7} -14`,shirt,5);
 c.save();c.translate(sx+step*side*15,-10+Math.min(0,sy));c.rotate(jump?side*.13:step*side*.08);
 path(c,'M-19 -12 Q-19 -31 2 -27 L12 -9 Q38 -9 39 7 L-25 7 Q-31 0 -19 -12Z',shoe);path(c,'M-25 3 L39 3 L39 12 Q10 17 -26 11Z','#fff8e6');line(c,'M-5 -17 L9 -16 M-6 -10 L11 -9','#fff8e6',4);c.restore();}
 if(robot){
  // Separate mechanical limbs: metal shin pistons, knee hubs and broad robot feet.
  for(const side of [-1,1]){const sx=side*24,foot=sx+step*side*10;
   line(c,`M${sx} -93 L${sx+side*(jump?12:0)} -53 L${foot} -13`,'#26394d',21);
   line(c,`M${sx} -88 L${sx+side*(jump?12:0)} -53 L${foot} -14`,'#b9d9dd',11);
   oval(c,sx+side*(jump?12:0),-53,14,13,'#ffca48',INK,3);
   box(c,foot-24,-19,54,30,8,'#78d8cf');line(c,`M${foot-16} 3 H${foot+22}`,'#26394d',5);
  }
  for(const side of [-1,1]){line(c,`M${side*45} -151 Q${side*83} -127 ${side*70} -93`,'#26394d',17);oval(c,side*70,-93,14,14,'#ffce48');}
  box(c,-48,-174,96,90,22,'#78d8cf');box(c,-63,-277,126,99,27,'#ffca48');box(c,-52,-263,104,63,19,'#26394d');
  for(const side of [-1,1]){oval(c,side*25,-238,12,excited?18:14,'#b5ff77',null);line(c,`M${side*25-7} -239 l7 -7 7 7`,'#26394d',3);}
  line(c,'M-16 -216 Q0 -202 16 -216','#b5ff77',4);line(c,'M0 -277 L0 -300',INK,5);oval(c,0,-306,9,9,'#f76d91');oval(c,0,-129,22,22,'#fff8e6');line(c,'M-8 -135 L0 -144 0 -116 M-8 -116 L8 -116',INK,4);
 }else{
 // Sunny's braids sit behind her shoulders, ears and face.
 if(kind===2)for(const side of [-1,1])for(let i=0;i<4;i++)oval(c,side*(62+i*2),-214+i*18,10-i*.5,13,hair,INK,2.5);
 // Rounded articulated sleeves: shoulder -> elbow -> wrist, with a separate cuff.
 for(const side of [-1,1]){
  const grip=holder&&side===1,p=holderArmPose(phase);
  const hx=grip?p.x:win?side*(98+Math.sin(time*5+side)*5):side*(75+jump*9);
  const hy=grip?p.y:win?-258+Math.sin(time*5+side)*12:-122-jump*29+(walk?step*side*12:0);
  const ex=grip?62+Math.cos(phase)*7:side*(win?73:59),ey=grip?-170+Math.sin(phase)*10:win?-208:-140-jump*12;
  const arm=`M${side*32} -159 Q${ex} ${ey} ${hx} ${hy}`;
  line(c,arm,INK,27);line(c,arm,shirt,20);
  const angle=grip?p.angle:win?-side*.22:side*.18;
  c.save();c.translate(hx,hy);c.rotate(angle);
  box(c,-12,4,24,10,3,shirt);
  if(!grip)c.scale(side,1);
  if(win)raisedHands.push(()=>{c.save();c.translate(hx,hy);c.rotate(angle);c.scale(side,1);drawHand(c,skin,'fist');c.restore();});
  else drawHand(c,skin,grip?'grip':'relaxed');c.restore();
 }
 // Hoodie, stitched pocket and contrasting cuff.
 path(c,'M-29 -176 Q0 -187 32 -175 Q46 -150 43 -94 Q1 -80 -43 -94 Q-45 -146 -29 -176Z',shirt);
 path(c,'M-29 -115 Q0 -124 29 -115 L25 -96 L-25 -96Z',shirt,INK,3);line(c,'M0 -167 L0 -124',INK,3);line(c,'M-12 -166 L-15 -139 M12 -166 L15 -139','#fff8e6',4);path(c,'M-28 -177 Q0 -154 30 -176 L15 -189 L-14 -188Z',shirt,INK,4);
 // Silhouette hair, ears and asymmetric face.
 if(kind===0&&(look.style??0)===0){c.save();c.translate(-43,-253);c.rotate(Math.sin(time*3)*.12+jump*.15);path(c,'M3 5 C-32 26 -74 8 -72 -20 C-101 -39 -85 -67 -61 -64 C-65 -94 -25 -110 -9 -88 C20 -74 -18 -35 3 5Z',hair);c.restore();}
 if(look.style===1)oval(c,-22,-301,34,32,hair);
 if(look.style===2){oval(c,-56,-281,36,34,hair);oval(c,53,-282,33,32,hair);}
 oval(c,-53,-230,17,22,skin);oval(c,52,-230,16,22,skin);
 path(c,'M-52 -274 Q-28 -313 26 -289 Q67 -275 57 -232 Q64 -189 26 -176 Q-24 -162 -49 -198 Q-65 -231 -52 -274Z',skin);
 path(c,'M-56 -247 C-76 -283 -51 -316 -15 -312 C9 -330 42 -310 49 -292 C70 -285 67 -258 58 -246 L44 -264 Q24 -263 17 -283 C2 -258 -12 -261 -21 -275 Q-31 -249 -48 -262Z',hair);
 line(c,'M-49 -278 Q-29 -301 -9 -293 M0 -303 Q29 -299 43 -277','#98704e',2);
 if(kind===1){for(let i=0;i<6;i++)oval(c,-48+i*19,-294-Math.sin(i)*7,15,18,hair);}
 if(kind===2){path(c,'M-62 -284 Q-35 -334 24 -315 Q53 -310 55 -278Z','#ffd749');path(c,'M-63 -283 Q-9 -298 70 -281 Q87 -262 59 -267 L-58 -272Z','#ffd749');}
 if(kind===0&&look.style!==1){oval(c,-43,-289,13,9,shirt);line(c,'M-52 -286 L-35 -294','#fff8e6',3);}
 // Large expressive eyes, animated pupils and brows.
 const blink=time%4.1<.13&&!excited,eyeY=miss?-225:-235;
 for(const side of [-1,1]){const ex=side*23+4;oval(c,ex,eyeY,21,blink?2:29,'#fffdf2',INK,3);if(!blink){oval(c,ex+4,eyeY+4,12,17,kind===1?'#73ad70':kind===2?'#9680ba':'#59afd0',INK,2);oval(c,ex+5,eyeY+5,6,11,INK,null);oval(c,ex+8,eyeY-3,3,5,'#fff',null);}line(c,`M${ex-15} ${eyeY-38+(miss?side*6:0)} Q${ex} ${eyeY-47} ${ex+14} ${eyeY-37}`,hair,4);if(kind!==1&&!blink)line(c,`M${ex-18} ${eyeY-14} l-7 -7 M${ex-20} ${eyeY-5} l-8 -3`,INK,3);}
 oval(c,7,-214,10,7,skin,INK,2.5);oval(c,-34,-210,10,5,'#e57f70',null);oval(c,40,-208,9,5,'#e57f70',null);
 for(const [fx,fy] of [[-40,-211],[-32,-207],[-24,-211],[33,-210],[41,-207],[46,-213]])oval(c,fx,fy,1.6,1.5,'#b8624d',null);

 if(miss){path(c,'M-13 -190 Q3 -207 23 -190',null,INK,4);oval(c,50,-239,5,10,'#6bddeb',INK,2);}
 else{path(c,excited?'M-24 -202 Q3 -179 29 -200 Q22 -157 -7 -170 Q-22 -179 -24 -202Z':'M-20 -201 Q4 -181 27 -200 Q14 -168 -8 -181Z','#60252e',INK,3);path(c,'M-15 -199 Q4 -188 22 -198 L17 -188 Q0 -184 -11 -192Z','#fffdf2',null);if(excited)oval(c,8,-175,12,5,'#ff8194',null);}
 }
 // Raised fists stay visible in front of ponytails and caps.
 for(const draw of raisedHands)draw();
 if(emotion==='frozen'){oval(c,0,-155,108,170,'#88e7f744','#3182a6',4);for(const sx of [-75,72])line(c,`M${sx} -190 v28 m-12 -20 l24 12 m-24 0 l24 -12`,'#fff',4);}
 if(emotion==='shield'){oval(c,0,-153,112,175,'#ffe96a22','#ffe468',5);}
 c.restore();
}
export function drawBackground(c,w,h,t=0,level=1){
 const theme=levelTheme(level);
 if(theme.kind!=='court'){drawThemedBackground(c,w,h,theme);return;}
 const palette=[theme.sky,'#b7e3a0',theme.ground];
 c.fillStyle=palette[0];c.fillRect(0,0,w,h);const {horizon}=playgroundLayout(h);
 // Sun cel; all clouds move in the independent sky layer.
 oval(c,w*.86,Math.max(75,Math.min(horizon-120,h*.19)),58,58,'#ffdd5a',INK,4);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,`M${w*.86+Math.cos(a)*73} ${Math.max(75,Math.min(horizon-120,h*.19))+Math.sin(a)*73} l${Math.cos(a)*13} ${Math.sin(a)*13}`,INK,3);}
 // Crooked seaside apartment silhouettes with individually inked windows.
 for(let i=0;i<10;i++){const x=i*135-100+(Math.sin(t*.08)*4),bh=110+(i%3)*55;c.save();c.translate(x,horizon-bh);c.rotate((i%2?1:-1)*.025);box(c,0,0,128,bh+35,9,['#f6bb66','#e6a9b9','#a4cace'][i%3]);path(c,'M-9 4 L63 -30 L138 4Z',['#d46a5e','#857cba','#589cac'][i%3]);for(let row=0;row<3;row++)for(let col=0;col<3;col++){box(c,18+col*33,25+row*45,20,27,3,'#fff3b4');line(c,`M${28+col*33} ${25+row*45}v27`,'#477883',2);}c.restore();}
 c.fillStyle=palette[1];c.fillRect(0,horizon,w,h*.2);
 for(const x of [25,w-35]){c.save();c.translate(x,horizon);path(c,'M-14 80 L-10 -90 L-43 -129 L-31 -136 L0 -110 L21 -159 L34 -150 L13 -91 L22 80Z','#b97c57');for(let i=0;i<6;i++)oval(c,Math.cos(i*1.1)*48,-139+Math.sin(i*1.1)*42,50,42,['#70b866','#86c46b','#a3d878'][i%3],INK,4);c.restore();}
 // Wavy mural wall and wire fence.
 box(c,-10,horizon+15,w+20,110,0,'#d69cc5');for(let i=0;i<10;i++){c.save();c.translate(i*134,horizon+80);c.rotate((i%2?1:-1)*.09);c.font='900 32px Nunito, sans-serif';c.lineWidth=7;c.strokeStyle=INK;c.strokeText(['JUMP!','★','PLAY','YEAH!'][i%4],0,0);c.fillStyle=['#ffe36b','#77d8d4','#ff91a5'][i%3];c.fillText(['JUMP!','★','PLAY','YEAH!'][i%4],0,0);c.restore();}
 for(let x=0;x<w;x+=140){line(c,`M${x} ${horizon+20}v-95`,'#3a6669',5);}
 line(c,`M0 ${horizon-75}H${w}`,'#3a6669',4);
 for(let x=-70;x<w+70;x+=35){line(c,`M${x} ${horizon-74}l100 94 M${x} ${horizon+20}l100 -94`,'#70948c',1.5);}
 // Court cels and hand-drawn linework.
 c.fillStyle=palette[2];c.fillRect(0,horizon+126,w,h);c.fillStyle='#e9c19b';c.fillRect(0,horizon+126,w,45);line(c,`M0 ${horizon+126}H${w}`,INK,4);line(c,`M0 ${horizon+171}H${w}`,'#956c60',3);
 for(let i=0;i<3;i++){line(c,`M${-100+i*w*.5} ${h} L${w*.5+(i-1)*150} ${horizon+128}`,'#ffe8ba',5);}
 c.save();c.translate(w*.5,h*.81);c.scale(1,.25);oval(c,0,0,w*.39,w*.39,'#ffffff00','#ffe8ba',10);c.restore();
 for(let i=0;i<20;i++){c.fillStyle='#bb687f';c.fillRect((i*173)%w,horizon+145+(i*67)%Math.max(20,h-horizon-150),3,2);}
 // A compact version of the same rope-framed brand hangs above the court.
 drawGameLogo(c,w/2-220,horizon-124,440,true);
}
export function scenePose(engine,time,screen){
 const e=engine?.current,caught=screen==='gameplay'&&e?.result==='miss'&&!['skipping','ready','rolling'].includes(e?.state);return {caught,phase:screen==='gameplay'?(caught?Math.PI*2-.55:(e?.phase||0)):time*2.6,jump:screen==='gameplay'?Math.max(jumpHeight(e?.jumpAge??9),e?.state!=='skipping'&&e?.previewJumpSlot===e?.current?jumpHeight(e?.previewJumpAge??9):0):jumpHeight((time+.38)%(Math.PI*2/2.6))};
}
// Quadratic rope path: at the collision phase its midpoint is just above the feet.
export function holderGrip(x,floor,scale,flip,phase){const p=holderArmPose(phase),sign=flip?-1:1;return [x+sign*(p.x+23*Math.sin(p.angle))*scale,floor+(p.y-23*Math.cos(p.angle))*scale];}
export function cartoonRope(phase,floor,scale=1){
 const start=holderGrip(130,floor,scale,false,phase),end=holderGrip(870,floor,scale,true,phase),y=start[1];
 // One smooth orbit around raised, anchored hands. Bottom crosses at phase zero;
 // the upper half clears the head rather than clamping into a repeated U shape.
 const radius=235*scale-8,mid=floor-8-radius*(1-Math.cos(phase));
 return {start,control:[500+Math.sin(phase)*48*scale,2*mid-y],end};
}
export function playgroundLayout(h){const horizon=Math.max(65,Math.min(h*.40,h-420));return {horizon,courtTop:horizon+126,spectatorFloor:horizon+165};}
export function drawSpectator(c,{x,y,scale=.3,time=0,variant=0,direction=1}){
 c.save();c.translate(x,y);c.scale(direction*scale,scale);const step=Math.sin(time*4),skin=['#b87750','#e8ae7b','#704b3b'][variant%3],shirt=['#e9ae71','#a0c888','#a396bd'][variant%3];
 for(const side of [-1,1]){const footX=side*14+step*side*17;line(c,`M${side*13} -63 Q${footX} -34 ${footX} -8`,INK,13);box(c,footX-11,-8-Math.max(0,step*side*12),29,13,5,'#eee4c9');line(c,`M${side*23} -130 Q${side*45} -103 ${side*35-step*side*10} -83`,skin,11);}
 path(c,variant===1?'M-19 -139 L19 -139 L35 -56 L-35 -56Z':'M-25 -140 L24 -140 L30 -64 L-29 -64Z',shirt);
 oval(c,0,-176,30,36,skin);if(variant===0){path(c,'M-31 -193 Q-23 -225 7 -217 Q35 -209 31 -192Z','#ddd4c0');line(c,'M-35 -192 H37',INK,5);line(c,'M-19 -172 H-2 M7 -172 H24',INK,8);line(c,'M-2 -172 H7',INK,3);}
 else if(variant===1){path(c,'M-31 -167 Q-46 -210 -7 -216 Q26 -225 33 -184 L20 -192 Q-3 -178 -24 -190Z','#6d3c30');oval(c,-25,-207,18,19,'#6d3c30');}
 else{path(c,'M-32 -191 Q-31 -219 4 -213 Q31 -210 31 -190Z','#e9e1cb');path(c,'M-20 -158 Q0 -136 23 -159 Q14 -130 -6 -139Z','#5f3b2b');}
 if(variant!==0){oval(c,-10,-174,3,5,INK,null);oval(c,12,-174,3,5,INK,null);}line(c,'M-8 -157 Q1 -151 12 -158',INK,2);path(c,'M25 -179 Q40 -169 27 -165Z',skin,INK,2);line(c,'M0 -135 V-85',INK,2);box(c,5,-113,13,15,2,shirt);c.restore();
}

export function courtActors(pixelWidth,pixelHeight,gameplay=true){
 const h=1000*pixelHeight/pixelWidth,controls=Math.min(220,Math.max(180,pixelHeight*.28))*1000/pixelWidth;
 const floor=gameplay?Math.min(h-controls,h*.69):h*.72;
 const scale=Math.min(1.08,Math.max(.45,(floor-210)/360));
 return {h,floor,scale,positions:[130,500,870]};
}
export function drawSkyTraffic(c,w,h,t){
 const {horizon}=playgroundLayout(h),ceiling=Math.max(110,horizon-95);
 c.save();c.beginPath();c.rect(0,0,w,ceiling);c.clip();
 for(let i=0;i<5;i++){const x=((i*270+t*(22+i*5))%(w+240))-120,y=Math.min(ceiling-25,h*(.19+i%3*.07));c.save();c.translate(x,y);path(c,'M-71 10 Q-85 -16 -52 -22 Q-45 -57 -12 -39 Q20 -61 42 -27 Q82 -28 73 9 Q20 26 -71 10Z','#fff9e7','#668b91',2);c.restore();}
 // A small propeller plane passes well behind the court.
 const plane=aircraftMotion('plane',t,w,h);c.save();c.translate(plane.x,plane.y);c.rotate(-.055);c.scale(plane.direction*.8,.8);
 path(c,'M-57 3 L-70 -18 L-53 -16 L-40 -3 L43 -5 Q69 -2 68 9 L-45 12Z','#fff6dc',INK,2.5);path(c,'M-8 -4 L-28 -37 L-7 -35 L21 3Z','#e89272',INK,2.5);path(c,'M1 10 L-18 34 L2 32 L27 9Z','#e89272',INK,2.5);box(c,25,-9,22,13,5,'#8bc7dc');line(c,`M70 ${-22*Math.cos(t*24)} L70 ${22*Math.cos(t*24)}`,INK,3);c.restore();
 // A friendly original helicopter, rotor and skids animated independently.
 const heli=aircraftMotion('helicopter',t,w,h);c.save();c.translate(heli.x,heli.y);c.scale(heli.direction*.67,.67);
 path(c,'M-30 0 L-78 -14 L-83 -28 L-93 -28 L-88 0 L-33 17Z','#e9b65f',INK,3);oval(c,0,8,40,27,'#e9b65f',INK,3);path(c,'M8 -16 Q43 -9 38 14 L8 14Z','#a5dbe2',INK,2.5);line(c,'M-17 31 V42 M18 31 V42 M-34 42 H39 M0 -19 V-33',INK,3);line(c,`M${-66*Math.cos(t*32)} -35 L${66*Math.cos(t*32)} -35`,INK,4);line(c,`M-89 ${-3-13*Math.sin(t*30)} L-89 ${-3+13*Math.sin(t*30)}`,INK,3);c.restore();c.restore();
}
// Original rope-framed lettering: each letter has its own animated-cartoon tilt.
export function drawGameLogo(c,x,y,width=500,compact=false){
 c.save();c.translate(x,y);c.scale(width/500,width/500);
 const letters=(text,y,size,spacing,fill)=>{const start=250-(text.length-1)*spacing/2;c.textAlign='center';c.font=`900 ${size}px Nunito, sans-serif`;c.lineJoin='round';for(let i=0;i<text.length;i++){c.save();c.translate(start+i*spacing,y+Math.sin(i*1.3)*3);c.rotate(Math.sin(i*1.7)*.075);c.strokeStyle=INK;c.lineWidth=compact?4:6;c.strokeText(text[i],0,0);c.fillStyle=fill;c.fillText(text[i],0,0);c.restore();}};
 if(compact){box(c,22,9,456,94,21,'#55bdc4');c.beginPath();c.roundRect(21,8,458,96,22);c.strokeStyle=INK;c.lineWidth=11;c.stroke();c.strokeStyle='#f8d35b';c.lineWidth=7;c.stroke();c.save();c.setLineDash([3,10]);c.strokeStyle='#fff1ba';c.lineWidth=1.5;c.stroke();c.restore();letters('ROPE SKIPPING',53,37,31,'#ffe47a');c.font='900 24px Nunito';c.fillStyle='#fff9df';c.textAlign='center';c.fillText('CHALLENGE',250,88);c.restore();return;}
 path(c,'M66 46 Q91 6 145 33 Q210 0 257 24 Q322 -1 363 31 Q429 9 451 62 Q491 100 459 144 Q491 197 437 229 Q382 267 323 238 Q245 268 191 241 Q105 264 64 223 Q17 207 44 151 Q8 85 66 46Z','#4bb8c6',INK,3);
 path(c,'M35 143 C1 54 61 5 144 29 Q250 -11 361 29 C443 4 498 56 465 143',null,INK,14);path(c,'M35 143 C1 54 61 5 144 29 Q250 -11 361 29 C443 4 498 56 465 143',null,'#ffda62',9);c.save();c.setLineDash([4,11]);path(c,'M35 143 C1 54 61 5 144 29 Q250 -11 361 29 C443 4 498 56 465 143',null,'#fff4c6',2);c.restore();
 for(const [hx,angle,col] of [[35,-.25,'#ed80a0'],[465,.25,'#72b7e0']]){c.save();c.translate(hx,147);c.rotate(angle);box(c,-14,-7,28,72,12,col);line(c,'M-12 9 H12 M-12 28 H12 M-11 46 H11','#fff7dd',3);c.restore();}
 letters('ROPE',93,78,58,'#ffe36a');letters('SKIPPING',166,67,45,'#ffe36a');
 path(c,'M85 184 Q250 165 416 184 L402 233 Q250 252 99 233Z','#326eac',INK,3);c.font='900 31px Nunito';c.textAlign='center';c.fillStyle='#fff9e4';c.fillText('CHALLENGE',250,221);
 for(const [sx,sy] of [[68,88],[434,91],[75,236],[431,236]]){path(c,`M${sx} ${sy-8} l3 6 7 2 -7 3 -3 7 -3 -7 -7 -3 7 -2Z`,'#fff5ce',INK,1.5);}
 c.restore();
}

export function drawGroundShadow(c,x,floor,scale,jump=0){
 c.save();const shrink=1-Math.min(1,jump)*.16;
 for(const [radius,alpha] of [[70,.04],[52,.055],[34,.075]]){c.beginPath();c.ellipse(x+7*scale,floor+12*scale,radius*scale*shrink,9*scale*shrink,0,0,Math.PI*2);c.fillStyle=`rgba(75,52,49,${alpha*(1-jump*.2)})`;c.fill();}c.restore();
}

export function aircraftMotion(type,t,w,h){const ceiling=Math.max(110,playgroundLayout(h).horizon-95);return type==='helicopter'?{x:((t*33+120)%(w+260))-130,y:Math.min(ceiling-35,h*.22)+Math.sin(t*.8)*8,direction:1}:{x:((t*42+160)%(w+280))-140,y:Math.min(ceiling-50,h*.29)+Math.sin(t*.4)*9,direction:1};}

function themeTree(c,x,y,size=1,pine=false){
 c.save();c.translate(x,y);c.scale(size,size);box(c,-11,-80,22,90,5,'#a47051');
 if(pine){for(let i=0;i<3;i++)path(c,`M0 ${-210+i*45} L${-85+i*9} ${-90+i*34} H${85-i*9}Z`,['#3b8972','#53a67d','#68b68b'][i]);}
 else for(let i=0;i<5;i++)oval(c,Math.cos(i*1.3)*44,-110+Math.sin(i*1.3)*35,48,44,['#7abf65','#9ad17a','#66aa61'][i%3],INK,3);
 c.restore();
}
function drawThemedBackground(c,w,h,theme){
 const {horizon}=playgroundLayout(h),night=theme.kind==='night';c.fillStyle=theme.sky;c.fillRect(0,0,w,h);
 if(theme.indoor){
  // Windowed playroom, bunting, cubbies, books and a colourful foam floor.
  for(const x of [100,640]){box(c,x,horizon-250,245,185,16,'#99dce7');line(c,`M${x+122} ${horizon-248}v180 M${x} ${horizon-157}h245`,'#fff6d2',9);path(c,`M${x+12} ${horizon-79} Q${x+80} ${horizon-147} ${x+150} ${horizon-80}`,'#a2cc87',null);}
  for(let i=0;i<9;i++){const x=65+i*110;line(c,`M${x} ${horizon-285}l110 8`,INK,2);path(c,`M${x} ${horizon-285}l65 5 -32 45Z`,['#f18d9e','#69bbcc','#f4cf60'][i%3]);}
  box(c,18,horizon-60,220,140,8,'#d49467');for(let i=0;i<4;i++){box(c,30+i*52,horizon-48,42,54,3,['#e78096','#7ac2c6','#f2d16e','#9a96cf'][i]);box(c,30+i*52,horizon+15,42,52,3,'#ffe9ad');}
  box(c,754,horizon-30,220,110,8,'#ba845f');for(let i=0;i<10;i++)box(c,765+i*19,horizon-18,15,65,2,['#73b8cc','#f1c962','#e9879c'][i%3]);
  c.font='900 29px Nunito';c.fillStyle=INK;c.textAlign='center';c.fillText('PLAY · LEARN · JUMP',w/2,horizon+25);
 }else if(theme.kind==='park'||theme.kind==='forest'){
  c.fillStyle=theme.kind==='forest'?'#75aa83':'#a9d48b';c.beginPath();c.moveTo(0,horizon+50);for(let x=0;x<=w;x+=100)c.lineTo(x,horizon-50+Math.sin(x*.009)*35);c.lineTo(w,horizon+100);c.lineTo(0,horizon+100);c.fill();
  for(let i=0;i<7;i++)themeTree(c,i*180-35,horizon+55,.8+(i%3)*.2,theme.kind==='forest');
  if(theme.kind==='park'){
   // Slide tower and two-seat swing set stay behind the pedestrian path.
   box(c,115,horizon-75,108,95,5,'#f3bf6c');path(c,`M100 ${horizon-75} L170 ${horizon-130} L238 ${horizon-75}Z`,'#dc7d86');path(c,`M211 ${horizon-50} Q260 ${horizon+65} 360 ${horizon+58} L355 ${horizon+79} Q245 ${horizon+85} 192 ${horizon-50}Z`,'#68b7cf');
   line(c,`M650 ${horizon+85} L685 ${horizon-100} H895 L935 ${horizon+85}`,'#6d84a6',10);
  }else{path(c,`M280 ${horizon+90} Q450 ${horizon-40} 700 ${horizon+80}`,'#ddb97a',INK,3);box(c,425,horizon-50,160,70,9,'#b58b5d');c.font='900 20px Nunito';c.textAlign='center';c.fillStyle='#fff5d2';c.fillText('FOREST TRAIL',505,horizon-10);}
 }else if(theme.kind==='beach'){
  c.fillStyle='#4bb9d0';c.fillRect(0,horizon-80,w,160);for(let j=0;j<3;j++)line(c,`M0 ${horizon-50+j*35} Q200 ${horizon-75+j*35} 400 ${horizon-50+j*35} T800 ${horizon-50+j*35} T1200 ${horizon-50+j*35}`,'#cbf0e7',4);
  for(const x of [160,840]){line(c,`M${x} ${horizon+90} V${horizon-65}`,'#a97b56',7);path(c,`M${x-100} ${horizon-55} Q${x} ${horizon-170} ${x+100} ${horizon-55}Z`,x===160?'#ef8fa4':'#f4d36b');box(c,x-55,horizon+34,110,35,6,'#fff0c6');}
 }else{
  oval(c,w*.8,horizon-180,43,43,'#fff0ad',null);for(let i=0;i<45;i++){const x=(i*149)%w,y=50+(i*79)%Math.max(60,horizon-95);path(c,`M${x} ${y-4} l2 3 4 1 -4 2 -2 4 -1 -4 -4 -2 4 -1Z`,'#f9ecb2',null);}
  for(let i=0;i<8;i++)box(c,i*145,horizon-75-(i%3)*35,125,150,5,['#59628c','#747ba4','#6c7093'][i%3]);
  for(const x of [120,880]){line(c,`M${x} ${horizon+100}V${horizon-110}`,INK,6);oval(c,x,horizon-114,20,28,'#ffe5a1');}
 }
 // Each location has a grounded pedestrian path and its own play surface.
 c.fillStyle=theme.indoor?'#f0dcb0':night?'#76718b':'#a3c886';c.fillRect(0,horizon+80,w,46);
 c.fillStyle=theme.ground;c.fillRect(0,horizon+126,w,h);c.fillStyle=theme.indoor?'#d8b786':'#e9c19b';c.fillRect(0,horizon+126,w,45);line(c,`M0 ${horizon+126}H${w} M0 ${horizon+171}H${w}`,INK,3);
 if(theme.indoor){for(let y=horizon+171,row=0;y<h;y+=180,row++)for(let x=0,col=0;x<w;x+=170,col++){box(c,x,y,170,180,2,['#eab8cb','#b7d8cd','#f2daa2','#bdc9e3'][(row+col+theme.tour)%4]);}}
 else{for(let i=0;i<3;i++)line(c,`M${-100+i*w*.5} ${h} L${w*.5+(i-1)*150} ${horizon+128}`,'#fff0cc',4);c.save();c.translate(w/2,h*.81);c.scale(1,.25);oval(c,0,0,w*.37,w*.37,'#ffffff00','#fff0cc',8);c.restore();}
 drawGameLogo(c,w/2-205,horizon-143,410,true);
 c.font='900 22px Nunito';c.textAlign='center';c.fillStyle=night?'#fff0bd':INK;c.fillText(theme.name,w/2,horizon+115);
}
export function drawThemeLife(c,w,h,time,level){
 const theme=levelTheme(level),{horizon}=playgroundLayout(h);
 if(theme.kind==='park')for(let i=0;i<2;i++){
  const x=735+i*105,sway=Math.sin(time*1.8+i)*16,y=horizon+18;
  line(c,`M${x} ${horizon-98} L${x+sway} ${y} M${x+30} ${horizon-98} L${x+30+sway} ${y}`,'#665f58',3);box(c,x+sway-6,y,44,8,3,'#c1845a');
  c.save();c.translate(x+15+sway,y-3);c.scale(.66,.66);
  const skin=i?'#b9784a':'#dfa278',shirt=i?'#e68b9e':'#6db4ce',kick=Math.sin(time*1.8+i)*9;
  for(const side of [-1,1]){line(c,`M${side*8} -8 L${side*17} 9 L${side*17+kick} 27`,INK,8);box(c,side*17+kick-7,25,16,8,3,'#fff3cb');line(c,`M${side*10} -34 L${side*26} -65`,skin,7);}
  box(c,-14,-41,28,34,6,shirt);oval(c,0,-61,17,20,skin,INK,2);path(c,'M-17 -66 Q-17 -88 4 -82 Q20 -77 17 -63 L6 -70 Q-4 -60 -17 -66Z',i?'#442a24':'#805537',INK,2);oval(c,-6,-61,2,3,INK,null);oval(c,7,-61,2,3,INK,null);line(c,'M-5 -51 Q0 -46 6 -51',INK,2);c.restore();
 }
 if(theme.indoor){
  for(let i=0;i<2;i++){const x=300+i*360;drawSpectator(c,{x,y:horizon+120,scale:.35,time:time*.4+i,variant:i+1,direction:i?-1:1});oval(c,x+35,horizon+106-Math.abs(Math.sin(time*2+i))*35,13,13,i?'#e990a7':'#6faecb',INK,2);}
  for(let i=0;i<5;i++)box(c,390+i*25,horizon+95-(i%2)*24,24,24,3,['#e9a47c','#a0cab0','#b7b0d8'][i%3]);
 }
}
