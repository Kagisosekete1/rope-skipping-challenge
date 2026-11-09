import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});await mkdir('/workspace/work/cartoon-review',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/hand-art.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawCharacter,drawHolderGrip,holderGrip}=await import('../.test-tmp/hand-art.mjs');
const image=createCanvas(1440,800),c=image.getContext('2d');c.fillStyle='#fff4d5';c.fillRect(0,0,1440,800);
for(let i=0;i<8;i++){
 const x=180+(i%4)*360,y=360+Math.floor(i/4)*400,phase=i%4*Math.PI/2,win=i>=4;
 drawCharacter(c,{x,y,kind:i%3,time:1+i*.25,holder:win?0:1,phase,emotion:win?'win':'idle'});
 if(!win){const tip=holderGrip(x,y,1,false,phase);c.beginPath();c.moveTo(...tip);c.lineTo(tip[0]+70,tip[1]+Math.cos(phase)*70);c.strokeStyle='#ffb726';c.lineWidth=6;c.stroke();drawHolderGrip(c,{x,y,scale:1,phase,skin:['#d98b58','#b9784a','#d98b58'][i%3]});}
 c.fillStyle='#202533';c.font='900 17px Nunito';c.textAlign='center';c.fillText(win?'Victory arm pump':'Rope phase '+i+'/4',x,y+35);
}
await writeFile('/workspace/work/cartoon-review/hands.png',image.toBuffer('image/png'));console.log('Hand movement and victory artwork rendered.');
