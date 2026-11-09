import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/cartoon-art.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawCharacter,drawBackground,cartoonRope,drawSpectator,playgroundLayout,courtActors,drawSkyTraffic}=await import('../.test-tmp/cartoon-art.mjs');
for(const [name,width,height] of [['portrait',384,844],['phone-large',576,1280],['landscape',1100,700]]){
 const canvas=createCanvas(width,height),c=canvas.getContext('2d'),w=1000,h=1000*height/width;c.scale(width/w,height/h);drawBackground(c,w,h,2,1);drawSkyTraffic(c,w,h,8);
 for(let i=0;i<3;i++)drawSpectator(c,{x:160+i*300,y:playgroundLayout(h).spectatorFloor,scale:.35,time:i,variant:i});
 const {floor,scale}=courtActors(width,height);
 drawCharacter(c,{x:130,y:floor,kind:1,scale,time:2,holder:1});drawCharacter(c,{x:870,y:floor,kind:2,scale,time:2,holder:-1,flip:true});drawCharacter(c,{x:500,y:floor,kind:0,scale,time:2,jump:.8,emotion:'happy'});
 const rope=cartoonRope(0,floor,scale);c.beginPath();c.moveTo(...rope.start);c.quadraticCurveTo(...rope.control,...rope.end);c.strokeStyle='#202533';c.lineWidth=12;c.stroke();c.strokeStyle='#ffdd52';c.lineWidth=7;c.stroke();
 await writeFile('/workspace/work/cartoon-review/'+name+'.png',canvas.toBuffer('image/png'));
}
const sheet=createCanvas(1000,410),ctx=sheet.getContext('2d');ctx.fillStyle='#fff4d5';ctx.fillRect(0,0,1000,410);for(let i=0;i<4;i++)drawCharacter(ctx,{x:125+i*250,y:370,kind:i%3,scale:1,robot:i===3,time:i,emotion:i===2?'miss':'happy',look:{outfit:i%3,hair:0,shoes:i%3,skin:i%3+1}});await writeFile('/workspace/work/cartoon-review/crew.png',sheet.toBuffer('image/png'));

const win=createCanvas(500,440),wc=win.getContext('2d');wc.fillStyle='#fff4d5';wc.fillRect(0,0,500,440);drawCharacter(wc,{x:250,y:400,kind:0,emotion:'win',scale:1.1,time:2});await writeFile('/workspace/work/cartoon-review/victory.png',win.toBuffer('image/png'));
