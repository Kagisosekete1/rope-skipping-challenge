import {build} from 'esbuild';
import {createCanvas,Path2D,GlobalFonts} from '@napi-rs/canvas';
import {writeFile,readFile,readdir,mkdir} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});
await build({entryPoints:['src/cartoon-art.js'],outfile:'.test-tmp/icon-art.mjs',bundle:true,format:'esm',platform:'node'});
globalThis.Path2D=Path2D;GlobalFonts.registerFromPath('public/fonts/nunito-900.ttf','Nunito');
const {drawCharacter,drawGameLogo}=await import('../.test-tmp/icon-art.mjs');
await mkdir('public/branding',{recursive:true});
const logo=createCanvas(1000,540);drawGameLogo(logo.getContext('2d'),0,0,1000);await writeFile('public/branding/rope-skipping-logo.png',logo.toBuffer('image/png'));await mkdir('src/assets',{recursive:true});await writeFile('src/assets/rope-skipping-logo.png',logo.toBuffer('image/png'));
const master=createCanvas(1024,1024),c=master.getContext('2d');c.fillStyle='#a4dfdb';c.fillRect(0,0,1024,1024);c.fillStyle='#ffe9aa';c.beginPath();c.roundRect(35,35,954,954,130);c.fill();c.strokeStyle='#26313b';c.lineWidth=12;c.stroke();
c.save();c.beginPath();c.roundRect(42,42,940,940,125);c.clip();c.fillStyle='#7dccca';c.fillRect(42,580,940,410);drawCharacter(c,{x:530,y:1070,scale:1.5,kind:0,time:2,emotion:'happy',look:{skin:2,outfit:0,hair:0,shoes:0}});c.restore();
drawGameLogo(c,30,64,964);
for(const size of [192,512]){const icon=createCanvas(size,size),ic=icon.getContext('2d');ic.drawImage(master,0,0,size,size);await writeFile(`public/icons/icon-${size}.png`,icon.toBuffer('image/png'));}
const mask=createCanvas(512,512),mc=mask.getContext('2d');mc.fillStyle='#82e0e8';mc.fillRect(0,0,512,512);mc.drawImage(master,52,52,408,408);await writeFile('public/icons/maskable-512.png',mask.toBuffer('image/png'));
for(const dir of await readdir('android/app/src/main/res')){if(!dir.startsWith('mipmap-')||dir==='mipmap-anydpi-v26')continue;for(const file of await readdir('android/app/src/main/res/'+dir)){if(!file.endsWith('.png')||!file.startsWith('ic_launcher'))continue;const path='android/app/src/main/res/'+dir+'/'+file,original=await readFile(path),size=original.readUInt32BE(16),image=createCanvas(size,size),ctx=image.getContext('2d');ctx.fillStyle='#82e0e8';ctx.fillRect(0,0,size,size);const inset=file.includes('foreground')?size*.18:0;ctx.drawImage(master,inset,inset,size-inset*2,size-inset*2);await writeFile(path,image.toBuffer('image/png'));}}
console.log('Original 2D PWA and Android launcher icons generated.');
