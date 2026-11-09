/* PADEL 5IVE PWA Lab 5.6.0 — static production-fingerprint / PWA audit */
const assert = require('node:assert/strict'), fs=require('node:fs');
const j = p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists = p=>assert.ok(fs.statSync(p).size>0,p);
const m=j('public/manifest.webmanifest');
assert.equal(m.display,'standalone'); assert.equal(m.scope,'/'); assert.ok(m.name.includes('PADEL 5IVE'));
for(const i of m.icons){exists('public'+i.src)}
for(const p of ['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html']){
 const html=fs.readFileSync(p,'utf8');
 assert.ok(html.includes('rel="manifest"'),p+' manifest');
 assert.ok(html.includes('apple-touch-icon'),p+' apple icon');
 assert.ok(html.includes('/pwa-register.js'),p+' registration');
}
const sw=fs.readFileSync('public/sw.js','utf8');
for(const s of ['/api/','/.netlify/','/results/','/r/','/u/','networkFirst','skipWaiting','CACHE_PAGES'])assert.ok(sw.includes(s),'SW missing '+s);
assert.ok(!sw.includes("caches.open('/api/"));
const registration=fs.readFileSync('public/pwa-register.js','utf8');
assert.ok(registration.includes('serviceWorker.register'));
assert.ok(registration.includes('OFFLINE'));
const netlify=fs.readFileSync('netlify.toml','utf8');
assert.ok(netlify.includes('functions = "netlify/functions"'));
assert.ok(fs.existsSync('public/assets/p5-fair-cycle-v5515.js'));
assert.ok(fs.existsSync('public/assets/p5-showdown-fixed-backdrop-v5517.css'));
assert.ok(fs.existsSync('public/assets/p5-keyboard-nav-v5516.js'));
console.log('PADEL 5IVE PWA Lab static checks PASSED');