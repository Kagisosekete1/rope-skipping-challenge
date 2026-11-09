import { COLORS, SKIN, ITEMS, jumpHeight } from './game';
export const INK='#202533';
function path(c,d,fill,stroke=INK,width=3.6){c.beginPath();const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(p);}}
function oval(c,x,y,rx,ry,color,stroke=INK,lw=2.8){c.beginPath();c.ellipse(x,y,rx,Math.max(.1,ry),0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function line(c,d,color=INK,w=5){path(c,d,null,color,w);}
function box(c,x,y,w,h,r,color){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill();c.strokeStyle=INK;c.lineWidth=4;c.stroke();}
export function drawCharacter(c,{x=0,y=0,scale=1,kind=0,look={},time=0,jump=0,emotion='idle',holder=0,phase=0,walk=false,robot=false,flip=false}={}){
 c.save();c.translate(x,y);c.scale(flip?-scale:scale,scale);
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
 // Waving sleeves and three-finger cartoon hands.
 for(const side of [-1,1]){const hx=holder?side*74+(side===1?Math.cos(phase)*6:0):win?side*100:side*(79+jump*12),hy=holder?-213+Math.sin(phase)*12:win?(side<0?-210:-265)+Math.sin(time*5+side)*3:-111-jump*35+(walk?step*side*12:0);
 path(c,`M${side*35} -167 Q${side*64} -158 ${hx} ${hy-13} L${hx-side*20} ${hy+10} Q${side*43} -130 ${side*28} -132Z`,shirt);
 c.save();c.translate(hx,hy);
 if(win){c.rotate(-side*.12);c.scale(side===-1?-1:1,1);oval(c,1,-2,15,17,skin,INK,2.5);line(c,'M-5 -10 Q0 -13 5 -10 M-5 -4 Q1 -7 6 -4',INK,1.5);path(c,'M-10 5 Q-20 0 -16 -8 Q-11 -14 -6 -5 L1 1 Q3 8 -4 9Z',skin,INK,2);}
 else if(holder&&side===1){line(c,'M3 -22 V21',INK,13);line(c,'M3 -20 V19','#ffcc54',7);path(c,'M-13 -7 Q-13 -17 -3 -14 L14 -10 Q21 -6 15 1 Q18 10 9 13 L-9 10 Q-17 4 -13 -7Z',skin,INK,3);line(c,'M-7 -4 L11 -1 M-7 3 L10 6',INK,2);path(c,'M-11 -12 Q-3 -20 3 -10 L8 -5 Q9 3 2 2 L-9 -4Z',skin,INK,2.5);}
 else{c.rotate(side*.35);path(c,'M-11 -7 Q-21 -20 -12 -22 L-3 -15 Q-6 -33 2 -33 Q9 -33 9 -16 Q13 -34 20 -28 Q24 -24 18 -11 Q35 -18 35 -9 Q30 1 16 6 Q1 14 -11 -7Z',skin,INK,3);}c.restore();}
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
 if(emotion==='frozen'){oval(c,0,-155,108,170,'#88e7f744','#3182a6',4);for(const sx of [-75,72])line(c,`M${sx} -190 v28 m-12 -20 l24 12 m-24 0 l24 -12`,'#fff',4);}
 if(emotion==='shield'){oval(c,0,-153,112,175,'#ffe96a22','#ffe468',5);}
 c.restore();
}
export function drawBackground(c,w,h,t=0,level=1){
 const palette=[['#82e0e8','#b7e3a0','#f49b88'],['#ffd79c','#c4cf85','#e4a6c6'],['#b6d5f2','#a6d1b3','#f1b17e']][Math.floor((level-1)/4)%3];
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
 const e=engine?.current;return {phase:screen==='gameplay'?(e?.phase||0):time*2.6,jump:screen==='gameplay'?Math.max(jumpHeight(e?.jumpAge??9),e?.state!=='skipping'&&e?.previewJumpSlot===e?.current?jumpHeight(e?.previewJumpAge??9):0):jumpHeight((time+.38)%(Math.PI*2/2.6))};
}
// Quadratic rope path: at the collision phase its midpoint is just above the feet.
export function holderGrip(x,floor,scale,flip,phase){const s=scale;return [x+(flip?-1:1)*(77+Math.cos(phase)*6)*s,floor+(-235+Math.sin(phase)*12)*s];}
export function cartoonRope(phase,floor,scale=1){
 const start=holderGrip(130,floor,scale,false,phase),end=holderGrip(870,floor,scale,true,phase),y=start[1];
 // One smooth orbit around raised, anchored hands. Bottom crosses at phase zero;
 // the upper half clears the head rather than clamping into a repeated U shape.
 const radius=235*scale-8,mid=y+Math.cos(phase)*radius;
 return {start,control:[500+Math.sin(phase)*48*scale,2*mid-y],end};
}
export function playgroundLayout(h){const horizon=Math.max(65,Math.min(h*.40,h-420));return {horizon,courtTop:horizon+126,spectatorFloor:horizon+165};}
export function drawSpectator(c,{x,y,scale=.3,time=0,variant=0}){
 c.save();c.translate(x,y);c.scale(scale,scale);const step=Math.sin(time*4),skin=['#b87750','#e8ae7b','#704b3b'][variant%3],shirt=['#e9ae71','#a0c888','#a396bd'][variant%3];
 for(const side of [-1,1]){const footX=side*14+step*side*17;line(c,`M${side*13} -63 Q${footX} -34 ${footX} -8`,INK,13);box(c,footX-11,-8-Math.max(0,step*side*12),29,13,5,'#eee4c9');line(c,`M${side*23} -130 Q${side*45} -103 ${side*35-step*side*10} -83`,skin,11);}
 path(c,variant===1?'M-19 -139 L19 -139 L35 -56 L-35 -56Z':'M-25 -140 L24 -140 L30 -64 L-29 -64Z',shirt);
 oval(c,0,-176,30,36,skin);if(variant===0){path(c,'M-31 -193 Q-23 -225 7 -217 Q35 -209 31 -192Z','#ddd4c0');line(c,'M-35 -192 H37',INK,5);line(c,'M-19 -172 H-2 M7 -172 H24',INK,8);line(c,'M-2 -172 H7',INK,3);}
 else if(variant===1){path(c,'M-31 -167 Q-46 -210 -7 -216 Q26 -225 33 -184 L20 -192 Q-3 -178 -24 -190Z','#6d3c30');oval(c,-25,-207,18,19,'#6d3c30');}
 else{path(c,'M-32 -191 Q-31 -219 4 -213 Q31 -210 31 -190Z','#e9e1cb');path(c,'M-20 -158 Q0 -136 23 -159 Q14 -130 -6 -139Z','#5f3b2b');}
 if(variant!==0){oval(c,-10,-174,3,5,INK,null);oval(c,12,-174,3,5,INK,null);}line(c,'M-8 -157 Q1 -151 12 -158',INK,2);c.restore();
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
