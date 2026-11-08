const $=s=>document.querySelector(s),TAU=Math.PI*2;
/* ===== Sound ===== */
const SFX=(()=>{let a;return(f,d=.12,t='sine',v=.15,s=0)=>{if(window.MUTE)return;try{a=a||new(window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,a.currentTime+s);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+s+d);o.connect(g).connect(a.destination);o.start(a.currentTime+s);o.stop(a.currentTime+s+d)}catch(e){}}})();
const sfx={jump:()=>SFX(520,.1,'triangle'),ok:()=>{SFX(660,.1);SFX(880,.15,'sine',.15,.08)},bad:()=>{SFX(130,.4,'sawtooth',.2);try{navigator.vibrate&&navigator.vibrate(120)}catch(e){}},tick:()=>SFX(300+Math.random()*200,.05,'square',.06),win:()=>[523,659,784,1047].forEach((f,i)=>SFX(f,.25,'triangle',.18,i*.12))};
/* ===== Kids crowd cheer (synthesized: noise roar + claps + kid voices) ===== */
const CROWD=(()=>{let a,nb;return big=>{if(window.MUTE)return;try{a=a||new(window.AudioContext||window.webkitAudioContext)();const c=a,t0=c.currentTime,dur=big?3.2:1.4;
 if(!nb){nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 const master=c.createGain();master.gain.value=big?.9:.6;master.connect(c.destination);
 const n=c.createBufferSource();n.buffer=nb;n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1800;bp.Q.value=.7;const g=c.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.25,t0+.25);g.gain.setValueAtTime(.25,t0+dur*.6);g.gain.linearRampToValueAtTime(0,t0+dur);n.connect(bp);bp.connect(g);g.connect(master);n.start(t0);n.stop(t0+dur);
 for(let i=0;i<(big?40:14);i++){const s=t0+Math.random()*dur*.9,cb=c.createBufferSource();cb.buffer=nb;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1500+Math.random()*2000;f.Q.value=1.2;const gg=c.createGain();gg.gain.setValueAtTime(.35,s);gg.gain.exponentialRampToValueAtTime(.001,s+.06);cb.connect(f);f.connect(gg);gg.connect(master);cb.start(s,Math.random(),.08)}
 for(let i=0;i<(big?14:6);i++){const s=t0+Math.random()*(big?.9:.4),len=.45+Math.random()*.5,f0=380+Math.random()*320,o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f0,s);o.frequency.linearRampToValueAtTime(f0*1.35,s+len*.4);o.frequency.linearRampToValueAtTime(f0*1.1,s+len);
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=5+Math.random()*2;lg.gain.value=f0*.02;lfo.connect(lg);lg.connect(o.frequency);
  const f1=c.createBiquadFilter();f1.type='bandpass';f1.frequency.value=900;f1.Q.value=4;const f2=c.createBiquadFilter();f2.type='bandpass';f2.frequency.value=2600;f2.Q.value=5;
  const vg=c.createGain();vg.gain.setValueAtTime(0,s);vg.gain.linearRampToValueAtTime(.12,s+.06);vg.gain.linearRampToValueAtTime(0,s+len);
  o.connect(f1);o.connect(f2);f1.connect(vg);f2.connect(vg);vg.connect(master);o.start(s);lfo.start(s);o.stop(s+len);lfo.stop(s+len)}
}catch(e){}}})();
/* ===== Nursery-song background music (public-domain tunes, music-box sound) ===== */
const MUS=(()=>{let c,tm,si=0,ni=0,next=0;const N={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 const S=['C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2','E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:2 D4:1 D4:1 D4:2 E4:1 G4:1 G4:2 E4:1 D4:1 C4:1 D4:1 E4:1 E4:1 E4:1 E4:1 D4:1 D4:1 E4:1 D4:1 C4:4','C4:1 C4:1 C4:.75 D4:.25 E4:1 E4:.75 D4:.25 E4:.75 F4:.25 G4:2 C5:.33 C5:.33 C5:.33 G4:.33 G4:.33 G4:.33 E4:.33 E4:.33 E4:.33 C4:.33 C4:.33 C4:.33 G4:.75 F4:.25 E4:.75 D4:.25 C4:2'].map(s=>s.split(' ').map(t=>{const[n,d]=t.split(':');return[261.63*Math.pow(2,(N[n[0]]+(+n[1]-4)*12)/12),+d*.46]}));
 function note(f,t,d){const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain();o.type='triangle';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+Math.max(.35,d*.95));o.connect(g);o2.connect(g);g.connect(c.destination);o.start(t);o2.start(t);o.stop(t+d+.4);o2.stop(t+d+.4)}
 function tick(){if(window.MUSICOFF)return;if(next<c.currentTime)next=c.currentTime+.05;while(next<c.currentTime+.3){const[f,d]=S[si][ni];note(f,next,d);next+=d;if(++ni>=S[si].length){ni=0;si=(si+1)%S.length;next+=.6}}}
 return{start(){try{c=c||new(window.AudioContext||window.webkitAudioContext)();if(c.state==='suspended')c.resume();if(!tm){next=c.currentTime+.1;tm=setInterval(tick,120)}}catch(e){}}}})();
/* ===== Scene / stage ===== */
const ren=new THREE.WebGLRenderer({antialias:true,canvas:$('#c')});ren.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x8fd3ff);scene.fog=new THREE.Fog(0x8fd3ff,16,34);
const cam=new THREE.PerspectiveCamera(40,1,.1,60);
function resize(){const w=innerWidth,h=innerHeight,A=w/h,p=A<.85,d=p?(WEL?8.8:9.6):7.6,need=4.2;ren.setPixelRatio(Math.min(devicePixelRatio,2));ren.setSize(w,h);cam.aspect=A;cam.fov=Math.min(80,Math.max(34,2*Math.atan(need/d/A)*180/Math.PI));cam.position.set(0,p?2.6:1.9,d);cam.lookAt(0,WEL?1.75:1.1,0);cam.updateProjectionMatrix()}
addEventListener('resize',resize);
scene.add(new THREE.HemisphereLight(0xffffff,0x88aa66,.85));
const sun=new THREE.DirectionalLight(0xfff2d6,.9);sun.position.set(4,9,6);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6});sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7});
function mk(geo,c,p,par){const m=new THREE.Mesh(geo,M(c));m.castShadow=true;if(p)m.position.set(...p);if(par)par.add(m);return m}
const cyl=(a,b,h=1)=>new THREE.CylinderGeometry(a,b,h,10),sph=(r,...x)=>new THREE.SphereGeometry(r,16,12,...x);
const UP=new THREE.Vector3(0,1,0);
function seg(m,a,b){const d=b.clone().sub(a);m.position.copy(a).addScaledVector(d,.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(UP,d.normalize())}
const gr=mk(new THREE.PlaneGeometry(60,60),0xd98fa8);gr.rotation.x=-Math.PI/2;gr.castShadow=false;gr.receiveShadow=true;scene.add(gr);
const court=mk(new THREE.PlaneGeometry(10,5),0xf0a9c0,[0,.01,0]);court.rotation.x=-Math.PI/2;court.receiveShadow=true;court.castShadow=false;scene.add(court);
const wall=mk(new THREE.BoxGeometry(14,3,.3),0x5a4bd1,[0,1.5,-3],scene);
[0xff5ea8,0x2fd4c8,0xffc21a,0xff7a3a,0x7ad03a].forEach((c,i)=>{const p=mk(new THREE.BoxGeometry(2,1.6,.05),c,[-5.2+i*2.6,1.4+(i%2)*.4,-2.82],scene);p.rotation.z=(i-2)*.05});
[[-9,5,3],[-5,7,3],[-1,4,3],[3,8,3],[7,5.5,3],[11,7,3],[-12,6,3]].forEach(([x,h,w],i)=>mk(new THREE.BoxGeometry(w,h,2.5),[0x6c8fc9,0x9a7fc0,0x7db0d8][i%3],[x,h/2,-9],scene));
[-6.2,6.2].forEach(x=>{mk(cyl(.15,.2,2),0x7a4a2a,[x,1,-1.8],scene);mk(sph(1),0x3bbf5a,[x,2.5,-1.8],scene)});
/* ===== Scenery polish: gradient sky, clouds, court lines, chain-link fence ===== */
{const cv=document.createElement('canvas');cv.width=2;cv.height=256;const x=cv.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#5db6ff');g.addColorStop(.7,'#bfe6ff');g.addColorStop(1,'#fff1d6');x.fillStyle=g;x.fillRect(0,0,2,256);scene.background=new THREE.CanvasTexture(cv);
 for(let i=0;i<5;i++){const c=new THREE.Group();for(let j=0;j<4;j++){const b=new THREE.Mesh(new THREE.SphereGeometry(.8+Math.random()*.5,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));b.position.set(j*.9,Math.random()*.3,0);b.scale.y=.6;c.add(b)}c.position.set(-14+i*7,8+Math.random()*2,-16);scene.add(c)}
 const L=(w,d,x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.01,d),new THREE.MeshBasicMaterial({color:0xffffff}));m.position.set(x,.025,z);scene.add(m)};
 L(9.6,.06,0,-2.2);L(9.6,.06,0,2.2);L(.06,4.4,-4.8,0);L(.06,4.4,4.8,0);L(.06,4.4,0,0);
 const fc=document.createElement('canvas');fc.width=fc.height=32;const f=fc.getContext('2d');f.strokeStyle='rgba(60,70,90,.8)';f.lineWidth=2;f.beginPath();f.moveTo(0,0);f.lineTo(32,32);f.moveTo(32,0);f.lineTo(0,32);f.stroke();const ft=new THREE.CanvasTexture(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(28,3);
 const fence=new THREE.Mesh(new THREE.PlaneGeometry(14,1.6),new THREE.MeshBasicMaterial({map:ft,transparent:true}));fence.position.set(0,1.1,-2.6);scene.add(fence);
 [-7,7].forEach(x=>mk(cyl(.04,.04,1.8),0x666677,[x,.9,-2.6],scene))}
/* ===== Ambient life: birds and people walking behind the kids ===== */
const BIRDS=[],WALK=[];
for(let i=0;i<5;i++){const g=new THREE.Group(),m=M(0x2a2f55);g.add(new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),m));g.wings=[-1,1].map(s=>{const p=new THREE.Group(),w=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.1),m);w.position.x=s*.15;p.add(w);g.add(p);return[p,s]});g.position.set(-12+i*5,4+Math.random()*2,-7-Math.random()*2);g.sp=.8+Math.random()*.8;g.ph=Math.random()*6;scene.add(g);BIRDS.push(g)}
for(let i=0;i<4;i++){const g=new THREE.Group();mk(cyl(.12,.1,.5),[0xe8553c,0x3caee8,0xf2c230,0x6bbf5a][i],[0,.7,0],g);mk(sph(.13),[0xc98a5e,0x8d5a3a,0xf0c8a0,0xb87a50][i],[0,1.08,0],g);g.legs=[-1,1].map(s=>{const p=new THREE.Group();p.position.set(s*.06,.45,0);mk(cyl(.05,.05,.45),0x2a2a3a,[0,-.22,0],p);g.add(p);return p});g.position.set(-8+i*4,0,-2.1);g.dir=i%2?1:-1;g.sp=.5+Math.random()*.4;g.scale.setScalar(.85);scene.add(g);WALK.push(g)}
function ambient(t,dt){BIRDS.forEach(b=>{b.position.x+=b.sp*dt;if(b.position.x>12)b.position.x=-12;b.wings.forEach(([p,s])=>{p.rotation.z=s*Math.sin(t*12+b.ph)*.7})});WALK.forEach(w=>{w.position.x+=w.dir*w.sp*dt;if(Math.abs(w.position.x)>9)w.dir*=-1;w.rotation.y=w.dir>0?Math.PI/2:-Math.PI/2;const s=Math.sin(t*5*w.sp*2+w.position.x)*.5;w.legs[0].rotation.x=s;w.legs[1].rotation.x=-s})}
/* ===== Characters ===== */
// Shared materials keep all clothing details in sync with the shop.
function person(o){
 const g=new THREE.Group(),p={g},mats={};
 const mat=c=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,roughness:.48}));
 const add=(geo,c,pos,sc,parent=g)=>{const m=new THREE.Mesh(geo,mat(c));m.castShadow=true;m.receiveShadow=true;m.position.set(...pos);if(sc)m.scale.set(...sc);parent.add(m);return m};
 const ball=(r,c,pos,sc,parent)=>add(new THREE.SphereGeometry(r,24,16),c,pos,sc,parent);
 const line=(points,r,c,parent=g)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),16,r,6,false),c,[0,0,0],null,parent);
 p.legL=add(new THREE.SphereGeometry(.13,24,16).scale(1,2.4,1),o.pants,[-.14,.38,0]);p.legR=add(new THREE.SphereGeometry(.13,24,16).scale(1,2.4,1),o.pants,[.14,.38,0]);
 for(const [i,x] of [-.14,.14].entries()){
  const leg=i?p.legR:p.legL;
  if(o.style==='boy') {leg.scale.y=.56;leg.position.y=.52;ball(.095,o.skin,[x,.27,0],[1,1.6,1]);ball(.1,0xffffff,[x,.15,0],[1,.7,1]);}
  else line([[x+(i?.1:-.1),.16,.015],[x+(i?.12:-.12),.4,.015],[x+(i?.1:-.1),.64,.015]],.018,o.shirt);
  ball(.15,0xfaf7ff,[x,.065,.075],[1,.42,1.65]);
  ball(.14,o.shoe,[x,.12,.06],[1,.7,1.5]);ball(.105,o.shoe,[x,.2,-.015],[1,.9,1]);
  ball(.1,0xffffff,[x,.105,.21],[1,.5,.5]);
  for(let j=0;j<3;j++)line([[x-.065,.17+j*.018,.12-j*.025],[x+.065,.17+j*.018,.12-j*.025]],.008,0xffffff);
 }
 p.torso=ball(.28,o.shirt,[0,.98,0],[1,1.25,.8]);
 ball(.27,o.shirt,[0,1.23,-.08],[1,.65,1]); // hood resting behind neck
 ball(.23,o.shirt,[0,.72,0],[1.05,.25,.85]);
 ball(.17,o.shirt,[0,.87,.204],[1,.48,.18]);
 line([[0,.76,.223],[0,1.2,.225]],.009,0xffeeee);
 for(const x of [-.075,.075]){line([[x,1.22,.20],[x*1.15,1.04,.245]],.009,0xffffff);ball(.016,0xdddddd,[x*1.15,1.03,.245]);}
 ball(.085,o.skin,[0,1.36,0],[1,1.1,1]);
 p.head=ball(.335,o.skin,[0,1.67,0],[1,1.08,.94]);
 for(const x of [-.325,.325]){ball(.075,o.skin,[x,1.64,0],[.65,1,.65]);if(o.style!=='boy')add(new THREE.TorusGeometry(.052,.009,8,20),0xffcf45,[x,1.55,.02]);}
 p.hair=add(new THREE.SphereGeometry(.35,24,16,0,TAU,0,Math.PI*.55),o.hair,[0,1.72,-.035],[1,1.02,1]);
 for(const x of [-.125,.125]){
  ball(.09,0x32170e,[x,1.7,.273],[1,1.2,.45]);
  ball(.082,0xffffff,[x,1.7,.29],[1,1.18,.42]);
  ball(.057,0x793a15,[x+.008,1.7,.322],[1,1.1,.35]);
  ball(.035,0x170f13,[x+.008,1.7,.338],[1,1.15,.32]);
  ball(.018,0xffffff,[x-.009,1.727,.35]);ball(.008,0xffffff,[x+.028,1.68,.351]);
  line([[x-.067,1.83,.26],[x,1.855,.29],[x+.064,1.83,.26]],.019,o.hair);
  if(o.style!=='boy')line([[x-.075,1.75,.30],[x,1.80,.315],[x+.075,1.75,.30]],.012,o.hair);
 }
 ball(.045,o.skin,[0,1.62,.325],[1,.8,.8]);
 ball(.086,0x61202a,[0,1.545,.289],[1,.6,.38]);
 ball(.064,0xffffff,[0,1.567,.31],[1,.28,.28]);ball(.041,0xf27986,[0,1.518,.31],[1,.3,.25]);
 for(const x of [-.215,.215])ball(.046,0xe58c79,[x,1.60,.255],[1,.5,.2]);
 if(o.style==='boy'){
  for(let row=0;row<4;row++)for(let j=0;j<8;j++){const t=j/8*TAU,r=.30*Math.sin(.45+row*.33);ball(.07,o.hair,[Math.cos(t)*r,2.025-row*.065,Math.sin(t)*r-.03],[1,.9,1]);}
 }else{
  for(let j=0;j<5;j++){const m=ball(.09,o.hair,[-.22+j*.07,1.86+j*.014,.21],[1.5,.55,.65]);m.rotation.z=.5;}
 }
 if(o.cap){
  add(new THREE.SphereGeometry(.365,24,16,0,TAU,0,Math.PI*.5),o.cap,[0,1.78,-.01]);
  ball(.24,o.cap,[0,1.79,-.32],[1.1,.12,1]); // backward brim
  add(new THREE.BoxGeometry(.23,.055,.025),o.cap,[0,1.81,.346]);
  for(const side of [-1,1])for(let i=0;i<8;i++)ball(.064,o.hair,[side*(.29+.025*Math.sin(i*1.7)),1.65-i*.065,-.10],[1,.9,1]);
 }
 p.detailLine=line;p.detailBall=ball;
 return p;
}
function personOld(o){const g=new THREE.Group();
 const p={g};p.legL=mk(cyl(.11,.1,.6),o.pants,[-.13,.35,0],g);p.legR=mk(cyl(.11,.1,.6),o.pants,[.13,.35,0],g);
 [-.13,.13].forEach(x=>mk(new THREE.BoxGeometry(.18,.1,.3),0xffffff,[x,.05,.05],g));
 p.torso=mk(cyl(.24,.2,.6),o.shirt,[0,.95,0],g);p.head=mk(sph(.24),o.skin,[0,1.5,0],g);
 p.hair=mk(sph(.26,0,TAU,0,Math.PI*.62),o.hair,[0,1.54,-.02],g);
 [-.09,.09].forEach(x=>mk(sph(.03),0x1a1a1a,[x,1.52,.22],g));mk(new THREE.BoxGeometry(.1,.03,.02),0xb03a3a,[0,1.43,.23],g);
 if(o.cap){mk(sph(.27,0,TAU,0,Math.PI*.5),o.cap,[0,1.57,0],g);mk(new THREE.BoxGeometry(.3,.03,.22),o.cap,[0,1.55,.28],g)}
 return p}
const J=person({shirt:0xff4fa3,pants:0x222233,skin:0xc98a5e,hair:0x3b1f14,shoe:0xf42b91,style:'girl'});
J.pony=mk(sph(.16),0x3b1f14,[0,1.7,-.42],J.g);J.pony.scale.set(1,1.05,1);
// A swept, layered ponytail with a bright hair tie.
J.pony.position.set(-.19,1.98,-.25);
for(let i=0;i<7;i++)J.detailBall(.14,0x3b1f14,[-.08-i*.035,-i*.10,-.04-i*.025],[1,.8,1],J.pony);
J.detailBall(.105,0xff4fa3,[-.12,1.99,-.20],[1,.5,1]);
J.bunL=mk(sph(.13),0x1b1b1b,[-.3,2.0,0],J.g);J.bunR=mk(sph(.13),0x1b1b1b,[.3,2.0,0],J.g);
J.armL=mk(cyl(.08,.07),0xff4fa3,null,J.g);J.armR=mk(cyl(.08,.07),0xff4fa3,null,J.g);J.hl=mk(sph(.085),0xc98a5e,null,J.g);J.hr=mk(sph(.085),0xc98a5e,null,J.g);scene.add(J.g);
const HL=person({shirt:0x2f7bff,pants:0x222222,skin:0x8d5a3a,hair:0x111111,shoe:0x1674ed,style:'boy'}),HR=person({shirt:0xffd21a,pants:0x2a2a38,skin:0xd9a07a,hair:0x4a2a14,cap:0xffc21a,shoe:0xffc21a,style:'braids'});
HL.g.position.x=-3.25;HR.g.position.x=3.25;HL.g.rotation.y=.5;HR.g.rotation.y=-.5;scene.add(HL.g,HR.g);
HL.arm=mk(cyl(.08,.07),0x2f7bff,null,scene);HR.arm=mk(cyl(.08,.07),0xffd21a,null,scene);HL.hnd=mk(sph(.085),0x8d5a3a,null,scene);HR.hnd=mk(sph(.085),0xd9a07a,null,scene);
/* ===== Rope ===== */
const L=2.85,N=28,rope=[...Array(N)].map(()=>mk(cyl(.035,.035),0xffd36b,null,scene)),pts=[...Array(N+1)].map(()=>new THREE.Vector3());
function ropeAt(x,th){const s=1-Math.pow(Math.abs(x/L),2.5),A=(.12+.83*s)*(1+.03*Math.sin(th*2+x*2.5));return[1-A*Math.cos(th),A*Math.sin(th)]}
function updRope(th){for(let i=0;i<=N;i++){const x=-L+2*L*i/N,[y,z]=ropeAt(x,th);pts[i].set(x,y,z)}if(HL.hand)HL.hand.getWorldPosition(pts[0]);if(HR.hand)HR.hand.getWorldPosition(pts[N]);for(let i=0;i<N;i++)seg(rope[i],pts[i],pts[i+1]);
 HL.arm.visible=HR.arm.visible=!HL.glb;seg(HL.arm,new THREE.Vector3(-3.15,1.3,0),pts[0]);seg(HR.arm,new THREE.Vector3(3.15,1.3,0),pts[N]);HL.hnd.position.copy(pts[0]);HR.hnd.position.copy(pts[N]);HL.hnd.visible=HR.hnd.visible=!HL.glb}
/* ===== Dice (CSS 3D) ===== */
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]},FACE={1:'',6:'rotateY(180deg)',3:'rotateY(90deg)',4:'rotateY(-90deg)',2:'rotateX(90deg)',5:'rotateX(-90deg)'},SHOW={1:[0,0],6:[0,180],3:[0,-90],4:[0,90],2:[-90,0],5:[90,0]};
for(const v in FACE){const f=document.createElement('div');f.className='f';f.style.transform=FACE[v]+' translateZ(45px)';for(let i=0;i<9;i++){const b=document.createElement('b');b.style.visibility=PIPS[v].includes(i)?'visible':'hidden';f.appendChild(b)}$('#cube').appendChild(f)}
function rand6(){const a=new Uint32Array(1);crypto.getRandomValues(a);return 1+a[0]%6}
function rollDice(v,cb){const b=$('#dicebox'),c=$('#cube');b.className='on';c.style.transition='none';c.style.transform='rotateX(0) rotateY(0)';void c.offsetWidth;c.style.transition='';
 const[x,y]=SHOW[v];c.style.transform=`rotateX(${x+720}deg) rotateY(${y+1080}deg)`;b.classList.add('bounce');let k=0;const t=setInterval(()=>{sfx.tick();if(++k>7)clearInterval(t)},130);setTimeout(()=>{SFX(90,.25,'sine',.3);b.classList.add('park');cb()},1500)}
/* ===== Match / game state ===== */
const P=[{shirt:0xff4fa3,pants:0x222233,hair:0x3b1f14,name:'Player 1'},{shirt:0x8e5bff,pants:0x2a2a55,hair:0x1b1b1b,name:'Player 2'}];
const AI={Easy:{sd:.15,lazy:.2,d:.6},Normal:{sd:.1,lazy:.08,d:.35},Hard:{sd:.06,lazy:.02,d:.15}};
const G={mode:'cpu',diff:'Normal',cur:0,pct:[0,0],state:'menu',need:0,done:0,th:0,cyc:0,T:1.5,aiErr:0,aiSkip:false,t:0};
const D=.52,H=.8,CD=.45,PER=5,BONUS=5,Y={y:0,air:false,t:0,cd:0};
const human=p=>G.mode==='pvp'||(G.mode==='net'?p===G.me:p===0);
let coins=0;try{coins=+localStorage.getItem('rsc_coins')||0}catch(e){}
let xp=0;try{xp=+localStorage.getItem('rsc_xp')||0}catch(e){}
let ST={m:0,w:0,s:0,b:0,p:0};try{ST=Object.assign(ST,JSON.parse(localStorage.getItem('rsc_st')))}catch(e){}
const lvl=()=>Math.floor(xp/200)+1;function LV(){$('#lv').textContent='Level '+lvl()+' ('+(xp%200)+'/200 XP) - '+ST.w+'/'+ST.m+' wins, best streak '+ST.b}
function tut(){try{if(localStorage.getItem('rsc_tut'))return false;localStorage.setItem('rsc_tut',1)}catch(e){}return true}$('#coins').textContent=coins;
function say(t,ms=1000){const m=$('#msg');m.textContent=t;m.classList.add('show');clearTimeout(say.k);say.k=setTimeout(()=>m.classList.remove('show'),ms)}
function hud(){for(let i=0;i<2;i++){$('#b'+i).style.width=G.pct[i]+'%';$('#t'+i).textContent=Math.round(G.pct[i])+'%';$('#p'+i).classList.toggle('on',G.cur===i&&G.state!=='menu'&&G.state!=='over');$('#p'+i).classList.toggle('hot',G.pct[i]>=75)}
 $('#cnt').innerHTML=`Jumps<br>${G.done} / ${G.need}`;$('#jump').disabled=!(G.state==='skip'&&human(G.cur));$('#pz').style.display=(G.state==='skip'&&G.mode!=='net')?'block':'none';const tm=G.state==='skip'&&human(G.cur)?'block':'none';$('#tm').style.display=tm;$('#tmt').style.display=tm;$('#pwr').style.display=tm==='block'?'flex':'none';$('#pu').style.display=(human(G.cur)&&(G.state==='idle'||G.state==='skip'))?'flex':'none';hudPU()}
function add(p,n){const o=G.pct[p];G.pct[p]=Math.min(100,o+n);[[75,'NEARLY THERE!'],[90,'ONE MORE PUSH!'],[100,'METER FULL!']].forEach(([m,t])=>{if(o<m&&G.pct[p]>=m)say(t,1300)});hud()}
function startMatch(mode,diff){G.mode=mode;G.diff=diff||G.diff;G.pct=[0,0];G.cur=0;G.need=0;G.done=0;PU=[{s:1,h:1,b:1},{s:1,h:1,b:1}];if(mode!=='net'){P[1].name=mode==='cpu'?'Computer':'Player 2';P[0].name=ST.name||'Player 1'}$('#n0').textContent=P[0].name;$('#n1').textContent=P[1].name;
 $('#menu').classList.remove('on');$('#end').classList.remove('on');say(tut()?'Tap JUMP just as the rope reaches the ground':'Match start!',2200);beginTurn()}
function beginTurn(){G.state='idle';G.slow=G.shield=G.boost=0;G.need=0;G.done=0;Y.air=false;Y.y=0;Y.cd=0;setJ(G.cur);$('#dicebox').className='';hud();
 say(human(G.cur)?`${P[G.cur].name}: roll!`:(G.mode==='net'?'Opponent rolls...':'Computer rolls...'),900);
 $('#roll').style.visibility=human(G.cur)?'visible':'hidden';if(!human(G.cur)&&G.mode!=='net')setTimeout(roll,1000)}
function roll(fv){if(G.state!=='idle')return;G.state='rolling';$('#roll').style.visibility='hidden';const v=fv||rand6();if(G.mode==='net'&&!fv)NET.send('roll',{v});
 rollDice(v,()=>{G.need=v;G.done=0;say(`${v} jump${v>1?'s':''}!`,1100);setTimeout(()=>{G.T=1.5;const w=TAU/G.T;G.th=(Math.floor(G.th/TAU)+1)*TAU-w*1.4;G.cyc=Math.floor(G.th/TAU);G.aiErr=0;G.aiSkip=false;if(G.mode==='net'&&!human(G.cur)){G.state='wait';say('Opponent jumping...',1500);hud();return}G.state='skip';say('Jump!',500);hud()},1000)})}
function jump(){if(G.state!=='skip'||Y.air||Y.cd>0)return;Y.air=true;Y.t=0;sfx.jump()}
function cross(){const ai=!human(G.cur);
 if(Y.y>.3){G.done++;const pf=Y.y>.62;add(G.cur,PER+(pf?2:0)+(G.boost?5:0));if(G.boost){G.boost=0;hudPU()}sfx.ok();burst(pf);G.T=Math.max(.85,1.5-.08*G.done);say(pf?'Perfect! +2%':'Nice!',500);hud();
  if(G.done>=G.need){G.state='cheer';G.t=0;add(G.cur,BONUS);CROWD(false);NET.send('end',{pct:G.pct[G.cur],ok:1});say('Challenge clear! +'+BONUS+'%',1100);setTimeout(next,1400)}}
 else if(G.shield){G.shield=0;say('Shield saved you!',900);sfx.ok();hudPU()}else{G.state='hit';G.t=0;Y.air=false;NET.send('end',{pct:G.pct[G.cur],ok:0});sfx.bad();shake=.35;say('Ouch! Rope hit',1100);hud();setTimeout(next,1400)}
 if(ai){const a=AI[G.diff];G.aiErr=(Math.random()+Math.random()+Math.random()-1.5)*2*a.sd+a.d*0;G.aiSkip=Math.random()<a.lazy}}
function next(){if(G.state==='over')return;if(G.pct[G.cur]>=100)return finish(G.cur);G.cur=1-G.cur;beginTurn()}
function finish(w){G.state='over';G.t=0;sfx.win();CROWD(true);hud();const win=G.mode==='cpu'?w===0:G.mode==='net'?w===G.me:true,r=G.mode==='pvp'?200:win?250:80;coins+=r;const lv0=lvl();xp+=win?50:20;const up=lvl()>lv0;if(up)coins+=150;if(G.mode!=='pvp'){ST.p=Math.max(0,(ST.p||0)+(win?30:-10));ST.m++;if(win){ST.w++;ST.s++;ST.b=Math.max(ST.b,ST.s)}else ST.s=0}const sb=(win&&ST.s>1&&G.mode!=='pvp')?Math.min(ST.s,5)*20:0;coins+=sb;ST.h=[{w:win?1:0,m:G.mode,s:Math.round(G.pct[0])+'-'+Math.round(G.pct[1])}].concat(ST.h||[]).slice(0,5);save();LV();
 setTimeout(()=>{$('#win').textContent=G.mode==='cpu'?(w===0?'You win!':'Computer wins'):P[w].name+' wins!';$('#rw').textContent='+'+r+' coins, +'+(win?50:20)+' XP'+(up?', level up! +150 coins':'')+(sb?', streak bonus +'+sb:'')+(G.mode!=='pvp'?', '+(win?'+30':'-10')+' RP':'');$('#end').classList.add('on')},1800);confetti(w)}
function confetti(w){const c=w===0?['#ffc21a','#2fd45a','#ff4fa3']:['#ffc21a','#8e5bff','#4ac3ff'];for(let i=0;i<70;i++){const e=document.createElement('div');e.className='conf';e.style.left=Math.random()*100+'vw';e.style.background=c[i%3];e.style.animationDuration=1.8+Math.random()*1.6+'s';e.style.animationDelay=Math.random()*.6+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),4500)}}
function setJ(p){const c=P[p];J.torso.material.color.set(c.shirt);J.legL.material.color.set(c.pants);J.legR.material.color.set(c.pants);J.hair.material.color.set(c.hair);J.pony.material.color.set(c.hair);J.pony.visible=p===0;J.armL.material.color.set(c.shirt);J.armR.material.color.set(c.shirt);J.bunL.visible=J.bunR.visible=p===1;J.g.rotation.set(0,0,0)}
/* ===== Loop ===== */
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1e3);last=now;if(PZ){ren.render(scene,cam);requestAnimationFrame(frame);return}G.t+=dt;
 const skip=G.state==='skip',w=skip?TAU/(G.T*(G.slow?1.3:1)):0;if(skip)G.th+=w*dt;else if(WEL)G.th+=TAU/1.6*dt;else G.th+=(Math.round(G.th/TAU)*TAU-G.th)*Math.min(1,dt*5);
 if(skip){const nc=Math.floor(G.th/TAU);{const tc=((G.cyc+1)*TAU-G.th)/w;$('#tmn').style.left=Math.max(0,Math.min(100,50+(D/2-tc)*100))+'%'}
  if(!human(G.cur)&&!Y.air&&Y.cd<=0&&!G.aiSkip){const tc=((G.cyc+1)*TAU-G.th)/w;if(tc<=D/2-G.aiErr)jump()}
  if(Y.air){Y.t+=dt;const u=Y.t/D;if(u>=1){Y.air=false;Y.y=0;Y.cd=CD}else Y.y=H*4*u*(1-u)}else{Y.y=0;Y.cd-=dt}
  if(nc>G.cyc){G.cyc=nc;cross()}}
 else{G.cyc=Math.floor(G.th/TAU);Y.y=0}
 $('#pwb').style.height=Math.round(Y.y/H*100)+'%';
 const g=J.g;g.position.y=Y.y;g.rotation.set(0,0,0);
 const tuck=Y.air||WEL?.3:0;J.legL.scale.y=J.legR.scale.y=1-tuck;J.legL.position.y=J.legR.position.y=.38+.3*tuck*.5;
 if(G.state==='idle'||G.state==='rolling')g.position.y=Math.abs(Math.sin(G.t*4))*.04;
 if(WEL)g.position.y=.12+Math.abs(Math.cos(G.th/2))*.55;
 if(G.state==='hit'){g.rotation.z=Math.sin(G.t*18)*.35*Math.max(0,1-G.t/1.1);g.rotation.x=-.3*Math.min(1,G.t*4)}
 if(G.state==='cheer'||G.state==='over'){const win=G.state==='cheer'||G.pct[G.cur]>=100;g.position.y=win?Math.abs(Math.sin(G.t*7))*.5:0;g.rotation.y=win?G.t*5:0}
 const a=Math.abs(Math.sin(G.t*6));J.armL.visible=J.armR.visible=!J.glb;const up=Y.air||G.state==='cheer'||WEL?.7:0;
 {const sL=new THREE.Vector3(-.3,1.25,0),eL=new THREE.Vector3(-.55,1.0+up*.45,.05),sR=new THREE.Vector3(.3,1.25,0),eR=new THREE.Vector3(.55,1.0+up*.45,.05);seg(J.armL,sL,eL);seg(J.armR,sR,eR);J.hl.position.copy(eL);J.hr.position.copy(eR);J.hl.visible=J.hr.visible=!J.glb}
 HL.g.position.y=HR.g.position.y=Math.abs(Math.sin(G.th))*.05;
 updRope(G.th);
 {const st=G.state,win=st==='cheer'||(st==='over'&&G.pct[G.cur]>=100);play(J,Y.air?/jump/i:st==='hit'?/hit|fall|lose|stumble/i:win?/win|victor|cheer/i:/idle/i);[HL,HR].forEach(h=>play(h,st==='hit'?/idle/i:/swing|rope|turn|idle/i));[J,HL,HR].forEach(T=>T.mx&&T.mx.update(dt))}
 ambient(now/1e3,dt);parts(dt);cam.position.x=shake>0?(Math.random()-.5)*shake*.4:0;shake-=dt;
 ren.render(scene,cam);requestAnimationFrame(frame)}
/* ===== Online play (room capability: two invited people with the page open) ===== */
const NET={r:null,send(t,d){if(this.r)this.r.emit(t,d).catch(()=>{})}};
async function goOnline(){const raw=(prompt('Room code - you and your friend both type the same code:')||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20);if(!raw)return;
 let room=null;try{room=window.claude&&await claude.use('room')}catch(e){}
 if(!room){alert('Online play needs this page opened in Claude by two invited people.');return}
 let r;try{r=await room.join('rsc-'+raw)}catch(e){alert('Could not join the room.');return}
 NET.r=r;const id=Math.random();let started=false;const iv=setInterval(()=>{if(!started)NET.send('hello',{id})},2000);
 r.on('hello',m=>{if(m.isMe||started)return;const o=m.data&&+m.data.id;if(!o||o===id)return;started=true;clearInterval(iv);G.me=id<o?0:1;$('#menu').classList.remove('on');NET.send('hello',{id});startMatch('net');say(G.me===0?'You are Player 1':'You are Player 2',1500)});
 r.on('roll',m=>{if(m.isMe||G.mode!=='net'||G.state!=='idle'||human(G.cur))return;const v=+(m.data&&m.data.v);if(v>=1&&v<=6)roll(v)});
 r.on('end',m=>{if(m.isMe||G.mode!=='net'||human(G.cur)||(G.state!=='wait'&&G.state!=='rolling'&&G.state!=='skip'))return;const d=m.data||{};add(G.cur,Math.min(100,+d.pct||0)-G.pct[G.cur]);G.state=d.ok?'cheer':'hit';G.t=0;say(d.ok?'Challenge clear!':'Rope hit!',1000);setTimeout(next,1400)});
 NET.send('hello',{id});say('Waiting for your friend...',8000)}
/* ===== Power-ups, profile and ranks ===== */
let PU=[{s:1,h:1,b:1},{s:1,h:1,b:1}];
function hudPU(){const p=PU[G.cur]||PU[0];[['s','🐢','slow'],['h','🛡️','shield'],['b','⚡','boost']].forEach(([k,e,f],i)=>{const b=$('#pu'+i);b.innerHTML=e+'<b>'+p[k]+'</b>';b.disabled=!p[k];b.classList.toggle('on',!!G[f])})}
function usePU(i){if(!human(G.cur)||!(G.state==='idle'||G.state==='skip'))return;const k='shb'[i],f=['slow','shield','boost'][i],p=PU[G.cur];if(!p[k]||G[f])return;p[k]--;G[f]=1;say(['Slow rope!','Shield on!','Boost ready!'][i],700);sfx.ok();hudPU()}
[0,1,2].forEach(i=>$('#pu'+i).onclick=()=>usePU(i));
const TIERS_OLD=[['Bronze',0],['Silver',5],['Gold',15],['Platinum',30],['Diamond',60]],esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function tier(){let t=0;TIERS.forEach((x,i)=>{if(ST.w>=x[1])t=i});return t}
function renderProf(){const t=tier(),nx=TIERS[t+1],wr=ST.m?Math.round(ST.w/ST.m*100):0,H2=(ST.h||[]).map(h=>'<div>'+(h.w?'Win ':'Loss ')+h.s+' ('+({cpu:'vs Computer',pvp:'2 players',net:'Online'}[h.m]||'')+')</div>').join('')||'<div>No matches yet</div>';
 $('#profb2').innerHTML=`<div class='big'>${esc(ST.name||'Player 1')} <button class='btn chip' id='rn'>Rename</button></div><div>Rank: <b style='color:#ffc21a'>${TIERS[t][0]}</b>${nx?' ('+(nx[1]-ST.w)+' wins to '+nx[0]+')':' (top rank)'}</div><div>Level ${lvl()} - ${xp%200}/200 XP</div><div>Wins ${ST.w} of ${ST.m} (${wr}%) - Best streak ${ST.b}</div><div>Coins ${coins}</div><h2>Recent matches</h2>${H2}`;
 $('#rn').onclick=()=>{const n=(prompt('Your name:',ST.name||'')||'').trim().slice(0,12);if(n){ST.name=n;save();renderProf()}}}
$('#profb').onclick=()=>{$('#menu').classList.remove('on');$('#prof').classList.add('on');renderProf()};
$('#profx').onclick=()=>{$('#prof').classList.remove('on');$('#menu').classList.add('on')};
/* ===== Pause ===== */
let PZ=false;function pause(on){if(on&&!(G.state==='skip'&&G.mode!=='net'))return;PZ=on;$('#pause').classList.toggle('on',on)}
$('#pz').onclick=()=>pause(true);$('#res').onclick=()=>pause(false);$('#qt').onclick=()=>{pause(false);$('#tomenu').onclick()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true)});
/* ===== Effects: sparkle burst + screen shake ===== */
const PART=[],pg=new THREE.SphereGeometry(.05,6,6);let shake=0;
function burst(pf){for(let i=0;i<(pf?18:9);i++){const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:pf?0xffe14a:0xffffff,transparent:true}));m.position.set(0,.2,0);m.v=new THREE.Vector3((Math.random()-.5)*3,Math.random()*3+1,(Math.random()-.2)*2);m.l=1;scene.add(m);PART.push(m)}}
function parts(dt){for(let i=PART.length-1;i>=0;i--){const m=PART[i];m.l-=dt*1.6;m.v.y-=7*dt;m.position.addScaledVector(m.v,dt);m.material.opacity=Math.max(0,m.l);if(m.l<=0){scene.remove(m);m.material.dispose();PART.splice(i,1)}}}
/* ===== Shop: outfits and ropes (saved in this browser) ===== */
const SHOP={outfit:[{n:'Pink',c:0xff4fa3,p:0},{n:'Blue',c:0x2f7bff,p:400},{n:'Yellow',c:0xffc21a,p:600},{n:'Green',c:0x2fd45a,p:800}],rope:[{n:'Gold',c:0xffd36b,p:0},{n:'Red',c:0xff3b3b,p:300},{n:'Neon',c:0x39ff9a,p:500},{n:'Violet',c:0xb06bff,p:700}],hair:[{n:'Brown',c:0x3b1f14,p:0},{n:'Black',c:0x111111,p:300},{n:'Auburn',c:0x8a3a1a,p:400},{n:'Blonde',c:0xe0b050,p:500}]};
let SV={own:['outfit0','rope0'],eq:{outfit:0,rope:0}};try{SV=JSON.parse(localStorage.getItem('rsc_shop'))||SV}catch(e){}SV.eq.hair=SV.eq.hair||0;if(!SV.own.includes('hair0'))SV.own.push('hair0');
function save(){try{localStorage.setItem('rsc_xp',xp);localStorage.setItem('rsc_st',JSON.stringify(ST));localStorage.setItem('rsc_shop',JSON.stringify(SV));localStorage.setItem('rsc_coins',coins)}catch(e){}$('#coins').textContent=coins}
function applyLook(){P[0].shirt=SHOP.outfit[SV.eq.outfit].c;P[0].hair=SHOP.hair[SV.eq.hair||0].c;const rc=SHOP.rope[SV.eq.rope].c;rope.forEach(r=>r.material.color.set(rc));setJ(0)}
function renderShop(){const el=$('#shopl');el.innerHTML='';for(const k of ['outfit','rope','hair']){const h=document.createElement('div');h.textContent={outfit:'Outfits (Player 1)',rope:'Ropes',hair:'Hair'}[k];h.style.margin='8px 0 4px';el.appendChild(h);const row=document.createElement('div');row.className='chips';row.style.flexWrap='wrap';SHOP[k].forEach((it,i)=>{const id=k+i,own=SV.own.includes(id),eq=SV.eq[k]===i,b=document.createElement('button');b.className='btn chip'+(eq?' sel':'');b.style.borderLeft='10px solid #'+it.c.toString(16).padStart(6,'0');b.textContent=eq?it.n+' (on)':own?it.n:it.n+' - '+it.p;b.onclick=()=>{if(!own){if(coins<it.p){say('Not enough coins',800);return}coins-=it.p;SV.own.push(id)}SV.eq[k]=i;save();applyLook();renderShop()};row.appendChild(b)});el.appendChild(row)}$('#shopc').textContent=coins}
$('#shopb').onclick=()=>{$('#menu').classList.remove('on');$('#shop').classList.add('on');renderShop()};
$('#shopx').onclick=()=>{$('#shop').classList.remove('on');$('#menu').classList.add('on')};
/* ===== GLB character import (replaces the primitive stand-ins) ===== */
const GL=new THREE.GLTFLoader();
function play(T,re){if(!T.mx)return;const c=T.clips.find(c=>re.test(c.name));if(!c||T.curN===c.name)return;const a=T.mx.clipAction(c);a.reset().fadeIn(.15).play();if(T.curA)T.curA.fadeOut(.15);T.curA=a;T.curN=c.name}
function useGLB(role,buf,name){GL.parse(buf,'',gl=>{const T={girl:J,left:HL,right:HR}[role];
 T.g.children.slice().forEach(c=>{c.visible=false});if(T.mx){T.mx.stopAllAction()}T.curN=null;T.curA=null;
 const m=gl.scene;m.traverse(o=>{if(o.isMesh){o.castShadow=true}});const b=new THREE.Box3().setFromObject(m),s=1.75/(b.max.y-b.min.y);m.scale.setScalar(s);m.position.y=-b.min.y*s;T.g.add(m);
 T.mx=new THREE.AnimationMixer(m);T.clips=gl.animations;T.glb=true;T.hand=null;m.traverse(o=>{if(o.isBone&&/hand/i.test(o.name)&&(!T.hand||/right|_r|r$/i.test(o.name)))T.hand=o});say(name+' loaded ('+gl.animations.length+' clips)',1500)},()=>alert('Could not read '+name))}
document.querySelectorAll('input[data-r]').forEach(i=>i.onchange=()=>{const f=i.files[0];if(f)f.arrayBuffer().then(b=>useGLB(i.dataset.r,b,f.name))});
/* ===== Pages: rankings, profile, shop, settings ===== */
const TIERS=[['Bronze',0,'🥉'],['Silver',100,'🥈'],['Gold',250,'🥇'],['Platinum',500,'💠'],['Diamond',900,'💎']];
function tier(){let t=0;TIERS.forEach((x,i)=>{if((ST.p||0)>=x[1])t=i});return t}
function LV(){$('#lv').textContent='⭐ Lv '+lvl()+'  '+TIERS[tier()][2]+' '+TIERS[tier()][0]}
const pbar=(v,m)=>`<div class='pbar'><i style='width:${Math.max(0,Math.min(100,v/m*100))}%'></i></div>`;
function renderRanks(){const t=tier(),p=ST.p||0,nx=TIERS[t+1],lo=TIERS[t][1],wr=ST.m?Math.round(ST.w/ST.m*100):0;
 const stat=(a,b)=>`<div class='st'><b>${a}</b><small>${b}</small></div>`;
 const hist=(ST.h||[]).map(h=>`<div class='row'><span>${h.w?'🏆 Win':'😅 Loss'}</span><span>${h.s}</span><span>${({cpu:'vs Computer',pvp:'2 players',net:'Online'})[h.m]||''}</span></div>`).join('')||`<div class='row'>No matches yet. Play one to get ranked!</div>`;
 const lad=TIERS.map((x,i)=>`<div class='row${i===t?' me':''}'><span>${x[2]} ${x[0]}</span><span>${x[1]}+ RP</span><span>${i===t?'You are here':p>=x[1]?'Reached':''}</span></div>`).join('');
 $('#rankb2').innerHTML=`<div class='sec hero2'><div class='badge'>${TIERS[t][2]}</div><div><div class='big'>${TIERS[t][0]}</div><div>${p} rank points</div></div></div><div class='sec'>${nx?`<div>${nx[1]-p} RP to ${nx[0]}</div>${pbar(p-lo,nx[1]-lo)}`:'<div>Top rank reached!</div>'}<small>Win +30 RP, loss -10 RP (2-player matches do not count)</small></div><div class='sec'><h3>Your stats</h3><div class='stats'>${stat('Lv '+lvl(),'Level')}${stat(xp%200+'/200','XP')}${stat(ST.w,'Wins')}${stat(ST.m,'Matches')}${stat(wr+'%','Win rate')}${stat(ST.b,'Best streak')}</div></div><div class='sec'><h3>Rank ladder</h3>${lad}</div><div class='sec'><h3>Recent matches</h3>${hist}</div><div class='sec'><h3>Global leaderboard</h3><div>Rankings against other players need an online server, which this game does not have yet. Your ranking is saved on this device.</div></div>`}
function renderProf(){const t=tier();$('#profb2').innerHTML=`<div class='sec hero2'><div class='badge'>👧</div><div><div class='big'>${esc(ST.name||'Player 1')}</div><div>${TIERS[t][2]} ${TIERS[t][0]} - Level ${lvl()}</div></div></div><div class='sec'><div>Level ${lvl()}</div>${pbar(xp%200,200)}<small>${xp%200}/200 XP to level ${lvl()+1}</small></div><div class='sec'><button class='btn go2' id='rn'>Rename player</button><button class='btn go2' id='toranks'>View rankings</button></div>`;
 $('#rn').onclick=()=>{const n=(prompt('Your name:',ST.name||'')||'').trim().slice(0,12);if(n){ST.name=n;save();renderProf()}};
 $('#toranks').onclick=()=>{$('#prof').classList.remove('on');$('#ranks').classList.add('on');renderRanks()}}
function renderShop(){const el=$('#shopl'),T={outfit:'Outfits (Player 1)',rope:'Ropes',hair:'Hair colours'};el.innerHTML='';$('#shopmsg').textContent='';
 for(const k of ['outfit','rope','hair']){const h=document.createElement('h3');h.textContent=T[k];el.appendChild(h);const grid=document.createElement('div');grid.className='grid';
  SHOP[k].forEach((it,i)=>{const id=k+i,own=SV.own.includes(id),eq=SV.eq[k]===i,b=document.createElement('button');b.className='item btn'+(eq?' eq':'');
   b.innerHTML=`<i class='sw' style='background:#${it.c.toString(16).padStart(6,'0')}'></i><b>${it.n}</b><small>${eq?'Equipped':own?'Owned':'🪙 '+it.p}</small>`;
   b.onclick=()=>{if(!own){if(coins<it.p){$('#shopmsg').textContent='Not enough coins for '+it.n;return}coins-=it.p;SV.own.push(id)}SV.eq[k]=i;save();applyLook();renderShop()};grid.appendChild(b)});el.appendChild(grid)}
 $('#shopc').textContent=coins}
$('#rankb').onclick=()=>{$('#menu').classList.remove('on');$('#ranks').classList.add('on');renderRanks()};
$('#rankx').onclick=()=>{$('#ranks').classList.remove('on');$('#menu').classList.add('on')};
$('#setb').onclick=()=>{$('#menu').classList.remove('on');$('#set').classList.add('on')};
$('#setx').onclick=()=>{$('#set').classList.remove('on');$('#menu').classList.add('on')};
$('#cpill').onclick=()=>$('#shopb').click();$('#lpill').onclick=()=>$('#profb').click();
$('#endrank').onclick=()=>{$('#end').classList.remove('on');$('#rankb').click()};
$('#reset').onclick=()=>{if(confirm('Reset coins, level, rank and shop items?')){try{['rsc_coins','rsc_xp','rsc_st','rsc_shop','rsc_day','rsc_tut'].forEach(k=>localStorage.removeItem(k))}catch(e){}location.reload()}};
/* ===== Welcome screen ===== */
let WEL=true;
function leaveWelcome(){WEL=false;$('#welcome').classList.remove('on');resize()}
$('#play').onclick=()=>{leaveWelcome();$('#menu').classList.add('on')};
$('#wrank').onclick=()=>{leaveWelcome();$('#rankb').click()};$('#wshop').onclick=()=>{leaveWelcome();$('#shopb').click()};$('#wset').onclick=()=>{leaveWelcome();$('#setb').click()};
/* ===== Input / menu ===== */
addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();if(G.state==='skip'&&human(G.cur))jump();else if(G.state==='idle'&&human(G.cur))roll()}});
$('#c').addEventListener('pointerdown',()=>{if(human(G.cur))jump()});
$('#jump').addEventListener('pointerdown',e=>{e.preventDefault();if(human(G.cur))jump()});
$('#roll').onclick=()=>roll();$('#onl').onclick=goOnline;
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>startMatch(b.dataset.m));
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');G.diff=b.textContent});
$('#again').onclick=()=>startMatch(G.mode);$('#tomenu').onclick=()=>{$('#end').classList.remove('on');$('#menu').classList.add('on');G.state='menu';$('#dicebox').className='';hud()};
try{window.MUTE=!!localStorage.getItem('rsc_mute')}catch(e){}$('#snd').textContent='Sound: '+(window.MUTE?'off':'on');
$('#snd').onclick=()=>{window.MUTE=!window.MUTE;$('#snd').textContent='Sound: '+(window.MUTE?'off':'on');try{localStorage.setItem('rsc_mute',window.MUTE?1:'')}catch(e){}};
try{const d=new Date().toDateString();if(localStorage.getItem('rsc_day')!==d){localStorage.setItem('rsc_day',d);coins+=100;save();setTimeout(()=>say('Daily reward: +100 coins',2500),600)}}catch(e){}
try{window.MUSICOFF=!!localStorage.getItem('rsc_mus')}catch(e){}$('#mus').textContent='Music: '+(window.MUSICOFF?'off':'on');$('#mus').onclick=()=>{window.MUSICOFF=!window.MUSICOFF;$('#mus').textContent='Music: '+(window.MUSICOFF?'off':'on');try{localStorage.setItem('rsc_mus',window.MUSICOFF?1:'')}catch(e){}if(!window.MUSICOFF)MUS.start()};addEventListener('pointerdown',()=>MUS.start(),{once:true});
LV();applyLook();resize();hud();requestAnimationFrame(frame);
