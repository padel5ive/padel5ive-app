/* PADEL 5IVE v5.8.22 — compact Cloud Session UI (no data changes).
 * Confirm mobile layout, credentials, conflict recovery and both modes.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const css=fs.readFileSync('public/phase5822/cloud-modal-compact-v5822.css','utf8');
const js=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const checks={
 'phone scope':css.includes('@media screen and (max-width:600px)'),
 'Cloud dialog only':css.includes('html body .p58-panel .p58-head')&&css.includes('html body .p58-backdrop .p58-panel'),
 'revision text hidden':css.includes('.p58-stamp {display:none!important}'),
 'Cloud revision logic preserved':js.includes("if(stamp)stamp.textContent=meta?'REVISION '")&&js.includes('meta.revision'),
 'reduced modal padding':css.includes('padding:15px!important'),
 'credential cards compact':css.includes('min-height:80px!important'),
 'credential cards two-column':css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),
 'narrow devices safely stack cards':css.includes('(max-width:350px)')&&css.includes('grid-template-columns:minmax(0,1fr)!important'),
 'private PIN remains copyable':js.includes('p58-private-pin-copy')&&js.includes("Copy Moderator PIN privately"),
 'Viewer access share preserved':js.includes('SHARE VIEWER ACCESS · WHATSAPP'),
 'Copy access preserved':js.includes('COPY ACCESS DETAILS'),
 'manual sync remains':js.includes("btn('SYNC NOW'"),
 'conflict warning remains visible':js.includes('This device has unsynced changes or a newer cloud revision')&&!css.includes('.p58-control-actions{display:none'),
 'local backup retained':js.includes('DOWNLOAD LOCAL BACKUP'),
 'cloud restore retained':js.includes('RESTORE LATEST CLOUD VERSION'),
 'no risky overlay disabled':!css.includes('.p58-backdrop{display:none')&&!css.includes('.p58-message{display:none'),
 'separate styles in both match modes':pages.every(p=>fs.readFileSync(p,'utf8').includes('<link rel="stylesheet" href="/phase5822/cloud-modal-compact-v5822.css">')),
 'PWA offline cache updated':sw.includes("'/phase5822/cloud-modal-compact-v5822.css',"),
 'build-integrated':JSON.parse(fs.readFileSync('package.json','utf8')).scripts.build.includes('phase5822-integrate.cjs')
};
for(const [name,pass] of Object.entries(checks))console.log((pass?'PASS ':'FAIL ')+name);
assert(Object.values(checks).every(Boolean),'Cloud compact modal QA');
const files=[...pages,'public/sw.js'];
const hash=()=>files.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=hash();
execFileSync(process.execPath,['scripts/phase5822-integrate.cjs']);
assert.deepEqual(hash(),before,'v5.8.22 build step must be repeat safe');
console.log('PASS v5.8.22 Cloud modal compact: '+Object.keys(checks).length+' source guards, integration idempotent.');
