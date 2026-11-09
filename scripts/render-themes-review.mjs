import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});await mkdir('/workspace/work/cartoon-review',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/theme-art.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawBackground,drawThemeLife,drawCharacter,drawGroundShadow,courtActors}=await import('../.test-tmp/theme-art.mjs');
const sheet=createCanvas(1080,1520),sc=sheet.getContext('2d');
for(let i=0;i<6;i++){const image=createCanvas(360,760),c=image.getContext('2d'),w=1000,h=760/360*1000;c.scale(.36,.36);drawBackground(c,w,h,0,1+i*10);drawThemeLife(c,w,h,3,1+i*10);const {floor,scale}=courtActors(360,760);for(const [kind,x] of [[1,130],[0,500],[2,870]]){drawGroundShadow(c,x,floor,scale);drawCharacter(c,{x,y:floor,scale,kind,time:2,holder:x===500?0:1,phase:2});}sc.drawImage(image,(i%3)*360,Math.floor(i/3)*760);}
await writeFile('/workspace/work/cartoon-review/themes.png',sheet.toBuffer('image/png'));console.log('Six themed phone-format artwork reviews rendered.');
