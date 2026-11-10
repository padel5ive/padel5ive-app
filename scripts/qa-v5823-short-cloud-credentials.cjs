/* PADEL 5IVE v5.8.23 · Short Cloud credentials end-to-end source guards.
 * The server integration tests in qa-phase58.mjs exercise actual requests
 * with a strong in-memory Netlify Blobs compare-and-swap mock.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const api=fs.readFileSync('netlify/functions/cloud-session.mjs','utf8');
const home=fs.readFileSync('public/phase58/cloud-home.js','utf8');
const dash=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const tests={
 'six-character codes generated from secure randomInt':api.includes('const createViewerCode=()=>CODE_LETTERS[randomInt(')&&api.includes('Array.from({length:5}'),
 'new codes start with a letter':api.includes("const CODE_LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ'"),
 'old 10-character codes accepted':api.includes('[2-9A-HJ-NP-Z]{10}'),
 'legacy six-digit PIN-based viewer codes accepted':api.includes('\\d{6}|'),
 'four-digit PIN uses cryptographic randomInt':api.includes('String(randomInt(0,10_000)).padStart(4,'),
 'new PIN length stored per session':api.includes('moderatorPinDigits:4,'),
 'old moderator PIN still supports six digits':api.includes('entry.moderatorPinDigits===4?4:6'),
 'new PIN enforced on backend':api.includes('validModeratorPin(entry,supplied)'),
 'device and global lockouts enabled':api.includes('deviceMax:3,globalMax:5,lockMs:30*60_000'),
 'PIN never sent to spectator during join':api.includes('if(includeData)r.data=entry.data')&&!api.includes('r.moderatorPin='),
 'Home accepts six or old ten chars':home.includes('[A-HJ-NP-Z][2-9A-HJ-NP-Z]{5}|[2-9A-HJ-NP-Z]{10}'),
 'Home retains numeric legacy detection':home.includes('const isLegacy=c=>/^\\d{6}$/.test(c)'),
 'Home join stores PIN digits metadata':home.includes('moderatorPinDigits:result.moderatorPinDigits||null'),
 'Moderator takeover honors actual PIN digits':dash.includes('const moderatorPinDigits=meta.moderatorPinDigits===4?4:6;'),
 'Moderator recovery honors actual PIN digits':dash.split("pin.length!==moderatorPinDigits").length===3,
 'Controller initializes PIN metadata':dash.includes('moderatorPinDigits:result.moderatorPinDigits||null'),
 'Only Cloud Home uses new asset version':index.includes('cloud-home.js?v=5823.0'),
 'Both game dashboards load new Cloud JS':pages.every(path=>fs.readFileSync(path,'utf8').includes('cloud-dashboard.js?v=5823.0')),
 'Keep private Viewer Link separate from PIN':dash.includes("if(m.viewerKey)return top+")&&dash.includes('SHARE VIEWER ACCESS · WHATSAPP'),
 'Cloud compact UI still applied':pages.every(path=>fs.readFileSync(path,'utf8').includes('cloud-modal-compact-v5822.css'))
};
for(const [name,ok] of Object.entries(tests))console.log((ok?'PASS ':'FAIL ')+name);
assert(Object.values(tests).every(Boolean),'Short Cloud code/PIN compatibility regression');
for(const file of ['public/phase58/cloud-dashboard.js','public/phase58/cloud-home.js','netlify/functions/cloud-session.mjs'])
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
const files=['public/index.html','public/sw.js',...pages];
const digest=()=>files.map(file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
const before=digest();
execFileSync(process.execPath,['scripts/phase5822-integrate.cjs']);
assert.deepEqual(digest(),before,'Cloud asset integration must be repeat-safe');
console.log('PASS v5.8.23 Short Cloud credentials: '+Object.keys(tests).length+' validations.');
