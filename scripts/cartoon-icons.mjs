import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {writeFile,readFile,readdir,mkdir} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/icon-art.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawCharacter}=await import('../.test-tmp/icon-art.mjs');
const master=createCanvas(1024,1024),c=master.getContext('2d');c.fillStyle='#82e0e8';c.fillRect(0,0,1024,1024);c.strokeStyle='#202533';c.lineWidth=17;c.lineJoin='round';c.beginPath();c.roundRect(35,35,954,954,140);c.fillStyle='#ffe388';c.fill();c.stroke();
c.save();c.beginPath();c.roundRect(46,46,932,932,130);c.clip();c.fillStyle='#87d5cd';c.fillRect(47,460,930,520);drawCharacter(c,{x:525,y:1030,scale:1.85,kind:0,time:2,emotion:'happy',look:{skin:2,outfit:0,hair:0,shoes:0}});c.restore();
c.save();c.translate(512,0);c.rotate(-.035);c.textAlign='center';c.lineWidth=17;c.font='900 150px Nunito';c.strokeStyle='#202533';c.fillStyle='#fff6dd';c.strokeText('ROPE',0,196);c.fillText('ROPE',0,196);c.font='900 126px Nunito';c.strokeText('SKIPPING',0,322);c.fillText('SKIPPING',0,322);c.restore();
for(const size of [192,512]){const icon=createCanvas(size,size),ic=icon.getContext('2d');ic.drawImage(master,0,0,size,size);await writeFile(`public/icons/icon-${size}.png`,icon.toBuffer('image/png'));}
const mask=createCanvas(512,512),mc=mask.getContext('2d');mc.fillStyle='#82e0e8';mc.fillRect(0,0,512,512);mc.drawImage(master,52,52,408,408);await writeFile('public/icons/maskable-512.png',mask.toBuffer('image/png'));
for(const dir of await readdir('android/app/src/main/res')){if(!dir.startsWith('mipmap-')||dir==='mipmap-anydpi-v26')continue;for(const file of await readdir('android/app/src/main/res/'+dir)){if(!file.endsWith('.png')||!file.startsWith('ic_launcher'))continue;const path='android/app/src/main/res/'+dir+'/'+file,original=await readFile(path),size=original.readUInt32BE(16),image=createCanvas(size,size),ctx=image.getContext('2d');ctx.fillStyle='#82e0e8';ctx.fillRect(0,0,size,size);const inset=file.includes('foreground')?size*.18:0;ctx.drawImage(master,inset,inset,size-inset*2,size-inset*2);await writeFile(path,image.toBuffer('image/png'));}}
console.log('Original 2D PWA and Android launcher icons generated.');
