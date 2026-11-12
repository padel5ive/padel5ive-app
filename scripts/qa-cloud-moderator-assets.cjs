'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const d=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const h=fs.readFileSync('public/phase58/cloud-home.js','utf8');
const api=fs.readFileSync('netlify/functions/cloud-session.mjs','utf8');
const root=fs.readFileSync('public/index.html','utf8');
const modePages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
assert(root.includes('cloud-home.js?v=5833.1'),'Cloud Home script must bypass stale Safari/PWA cache');
for(const path of modePages){
 const page=fs.readFileSync(path,'utf8');
 assert(page.includes('cloud-dashboard.js?v=5834.1'),path+' must load persistent Moderator dashboard script');
 assert.equal(page.split('cloud-dashboard.js?v=').length-1,1,path+' must load only one Cloud script');
}
assert(d.includes('!meta.moderatorPinRequired&&r.role'),'No PIN-less reclaim of transferred PIN session');
assert(d.includes("window.addEventListener('pageshow',()=>{if(meta&&!document.hidden)void refresh()})"),'Refresh on PWA resume');
assert(d.includes("else if(meta)void refresh()"),'Refresh on visibility change');
assert(h.includes("link.role==='controller'")&&h.includes("identity(local,kind)===link.localId"),'Self Viewer Link must not clobber Moderator token');
assert(api.includes("if(entry.moderatorPinHash)")&&api.includes("entry.controller?.id===id?'controller':'viewer'"),'PIN ownership remains durable');
console.log('PASS Safari/PWA cache assets 5833.1; moderator ownership, visibility and self-link guards installed.');
// CI discovery: identify historical tests needing only version assertions refreshed.
for(const file of fs.readdirSync('scripts').filter(x=>/\.(?:mjs|cjs)$/.test(x))){
 const text=fs.readFileSync('scripts/'+file,'utf8');
 const found=['cloud-home.js?v=5824.0','cloud-dashboard.js?v=5829.1'].filter(t=>text.includes(t));
 if(found.length)console.log('OLDER-ASSET-ASSERTION scripts/'+file+': '+found.join(' / '));
}
