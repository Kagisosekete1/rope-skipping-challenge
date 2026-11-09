import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});await mkdir('/workspace/work/cartoon-review',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/review-art.mjs',bundle:true,format:'esm',platform:'node'});
await build({entryPoints:['src/rope-motion.js'],outfile:'.test-tmp/review-rope.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawCharacter,drawGroundShadow,drawBackground,drawSkyTraffic,courtActors}=await import('../.test-tmp/review-art.mjs');
const {ropeFrame,drawRopeLayer}=await import('../.test-tmp/review-rope.mjs');
const width=384,height=844,w=1000,h=1000*height/width,combined=createCanvas(width*3,height);
for(const [index,phase,jump] of [[0,Math.PI*1.5,0],[1,0,1.05],[2,Math.PI*.5,0]]){
 const image=createCanvas(width,height),c=image.getContext('2d');c.scale(width/w,height/h);const {floor,scale}=courtActors(width,height);drawBackground(c,w,h,0,1);drawSkyTraffic(c,w,h,8);
 const nodes=ropeFrame(phase,{floor,scale,jump,kind:1});drawRopeLayer(c,nodes,false,'#ffd128',8);
 for(const x of [130,500,870])drawGroundShadow(c,x,floor,scale,x===500?jump:0);
 drawCharacter(c,{x:130,y:floor,scale,kind:0,time:2,holder:1,phase});drawCharacter(c,{x:870,y:floor,scale,kind:2,time:2,holder:1,phase,flip:true});drawCharacter(c,{x:500,y:floor,scale,kind:1,time:2,jump});drawRopeLayer(c,nodes,true,'#ffd128',8);
 combined.getContext('2d').drawImage(image,index*width,0);await writeFile('/workspace/work/cartoon-review/rope-phase-'+index+'.png',image.toBuffer('image/png'));
}
await writeFile('/workspace/work/cartoon-review/rope-cycle.png',combined.toBuffer('image/png'));console.log('Back pass, underfoot jump and front pass artwork rendered.');
