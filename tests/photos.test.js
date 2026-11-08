import test from 'node:test';
import assert from 'node:assert/strict';
import {preparePhoto} from '../src/photos.js';
test('phone photos with missing MIME are decoded, cropped and encoded as JPEG; unsupported HEIC gives useful help',async()=>{
 const original={Image:globalThis.Image,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};let revoked=0,encoding,fail=false,draw;
 try{
 URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>revoked++;
 globalThis.Image=class{width=1200;height=800;set src(v){queueMicrotask(()=>fail?this.onerror():this.onload());}};
 globalThis.document={createElement:()=>({getContext:()=>({drawImage:(...a)=>draw=a}),toBlob:(callback,type)=>{encoding=type;callback(new Blob(['jpg'],{type}));}})};
 const blob=await preparePhoto({name:'gallery.jpg',type:'',size:123});
 assert.equal(blob.type,'image/jpeg');assert.equal(encoding,'image/jpeg');assert.deepEqual(draw.slice(1),[200,0,800,800,0,0,512,512]);assert.equal(revoked,1);
 fail=true;await assert.rejects(preparePhoto({name:'photo.HEIC',type:'image/heic',size:123}),/Export the photo as JPG/);assert.equal(revoked,2);
 await assert.rejects(preparePhoto({name:'file.txt',type:'text/plain',size:123}),/Choose a photo/);
 }finally{globalThis.Image=original.Image;globalThis.document=original.document;URL.createObjectURL=original.create;URL.revokeObjectURL=original.revoke;}
});
