/* v5.8.16 iOS PWA viewport-origin regression.
 * Build-only checks. No match state, scoring, or Cloud engine changes. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const home=fs.readFileSync('public/index.html','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const css=fs.readFileSync('public/phase5816/pwa-viewport-v5816.css','utf8');
const js=fs.readFileSync('public/phase5816/viewport-calibrate-v5816.js','utf8');
const modePages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const checks={
 'landing viewport-fit auto':home.includes('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=auto">'),
 'browser Safari retains cover':home.includes('id="p5816-viewport-mode"')&&home.includes('m.setAttribute("content","width=device-width, initial-scale=1, viewport-fit=cover")'),
 'correct head-only insertion':home.indexOf('pwa-viewport-v5816.css')<home.indexOf('</head>'),
 'only one stylesheet':home.split('/phase5816/pwa-viewport-v5816.css').length===2,
 'only one calibration script':home.split('/phase5816/viewport-calibrate-v5816.js').length===2,
 'css applies only standalone iPhone':css.includes('@media screen and (display-mode:standalone) and (max-width:760px)'),
 'restore one continuous venue photo':css.includes("url('/phase585/home-venue-user-refined-hd.webp')")&&css.includes('#portal .p541-venue'),
 'no old photo overscan':css.includes('height:100%!important;min-height:100%!important;max-height:none!important'),
 'do not shift CTA structure':!css.includes('grid-template-columns')&&!css.includes('#p54-start')&&!css.includes('#p58-load'),
 'calibrated header and footer':css.includes('--p5816-status-offset')&&js.includes('screen?.height')&&css.includes('bottom:calc(clamp('),
 'setup scroll preserved':css.includes('overflow-x:hidden!important;overflow-y:auto!important')&&css.includes('100dvh!important'),
 'single code path, no engines changed':modePages.every(p=>!fs.readFileSync(p,'utf8').includes('/phase5816/')),
 'separate master UI preserved':modePages.every(p=>fs.readFileSync(p,'utf8').includes('MATCH CONTROL')),
 'service worker cache version bump':sw.includes("const VERSION = 'p5-pwa-lab-v5816-ios-origin'"),
 'standalone assets precached':sw.includes("'/phase5816/pwa-viewport-v5816.css'")&&sw.includes("'/phase5816/viewport-calibrate-v5816.js'"),
 'iOS launch remains standalone':JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8')).display==='standalone'
};
for(const [label,good]of Object.entries(checks))console.log((good?'PASS ':'FAIL ')+label);
assert(Object.values(checks).every(Boolean),'PWA viewport source invariants');
const paths=['public/index.html','public/sw.js','public/modes/unified/index.html','public/modes/club-match/index.html'];
const sum=()=>paths.map(p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=sum();
execFileSync(process.execPath,['scripts/phase5816-integrate.cjs']);
assert.deepEqual(sum(),before,'v5816 must be idempotent across consecutive builds');
console.log('PASS v5.8.16 PWA full viewport '+Object.keys(checks).length+' checks and build idempotency.');
