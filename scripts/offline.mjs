import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const files = [];
async function walk(dir) {
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) await walk(p);
    else if (f.name !== "sw.js") files.push("./" + p.replace(/^dist\//, ""));
  }
}
await walk("dist");
const version = "rope-v2-" + Date.now();
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(version)},FILES=${JSON.stringify(["./", ...files])};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rope-v2-')&&k!==CACHE||k.startsWith('rsc-v')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));});`,
);
console.log("Offline cache generated:", files.length, "files");
