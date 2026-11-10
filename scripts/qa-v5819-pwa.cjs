/* PADEL 5IVE 5.8.19 — Home CTA glow parity and Initial Setup seam regression.
 * iPhone standalone only; do not touch match engine or Cloud Session. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const css=fs.readFileSync('public/phase5819/home-brass-setup-seam-v5819.css','utf8');
const home=fs.readFileSync('public/index.html','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const original=fs.readFileSync('public/phase5818/home-cta-lower-v5818.css','utf8');
const modePages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const checks={
 'iPhone standalone portrait Home only':css.includes('(display-mode:standalone) and (max-width:760px) and (orientation:portrait)')&&css.includes('body:not(.p54-active) #portal .p541-home-actions'),
 'whole group moved lower':css.includes('- 110px')&&css.includes('p541-home-actions'),
 'previous base offset preserved':original.includes('- 40px')&&css.includes('var(--p5816-status-offset,59px)'),
 'short screens get smaller move':css.includes('(max-height:760px)')&&css.includes('- 59px'),
 'tagline moves with protected bottom margin':css.includes('#portal .signature')&&css.includes('bottom:max(24px,'),
 'brass CTA color matches warm venue':css.includes('background:#c7a477!important')&&css.includes('border:1px solid #d6b78b!important'),
 'secondary cards subdued bronze outline':css.includes('rgba(202,164,115,.63)')&&css.includes('rgba(10,26,39,.78)'),
 'resume has original editorial style':css.includes('#p54-resume .p54-resume-btn')&&css.includes('color:#d9c09d!important'),
 'CSS does not reposition hero or image':!css.includes('background-image:')&&!css.includes('#portal .masthead')&&!css.includes('.p541-venue'),
 'Initial Setup uses overlay outside scroll flow':css.includes('body.p54-active #p54-workspace.p54-workspace::before')&&css.includes('position:fixed!important')&&css.includes('height:88px!important'),
 'Initial Setup overlay does not affect touches':css.includes('pointer-events:none!important')&&css.includes('.p54-shell'),
 'existing top/fullscreen fixes remain':home.includes('pwa-viewport-v5816.css')&&home.includes('statusbar-parity-v5817.css'),
 'new CSS only one landing import':home.split('/phase5819/home-brass-setup-seam-v5819.css').length===2,
 'new CSS in PWA precache':sw.includes("'/phase5819/home-brass-setup-seam-v5819.css'"),
 'game mode pages unchanged':modePages.every(p=>!fs.readFileSync(p,'utf8').includes('phase5819/')),
 'no script behavior changes':!css.includes('takeControl(')&&!css.includes('score(')
};
for(const [name,ok]of Object.entries(checks))console.log((ok?'PASS ':'FAIL ')+name);
assert(Object.values(checks).every(Boolean),'v5.8.19 layout regression');
const files=['public/index.html','public/sw.js',...modePages];
const digest=()=>files.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=digest();
execFileSync(process.execPath,['scripts/phase5819-integrate.cjs']);
assert.deepEqual(digest(),before,'v5.8.19 integration must be idempotent');
console.log('PASS v5.8.19 Home brass and Setup seam: '+Object.keys(checks).length+' checks + repeat-safe build.');
