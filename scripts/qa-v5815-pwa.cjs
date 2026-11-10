/* PADEL 5IVE 5.8.15 · standalone Home/Setup visual regression guard.
 * Static checks plus read-only idempotency verification; do not alter engines.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const crypto=require('node:crypto');
const css=fs.readFileSync('public/phase5815/pwa-fullscreen-v5815.css','utf8');
const home=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('public/sw.js','utf8');
const path='/phase5815/pwa-fullscreen-v5815.css';
const checks={
 'PWA only':css.includes('(display-mode:standalone)')&&css.includes('(max-width:760px)'),
 'safe-area full background':css.includes('--p5815-bleed: 90px')&&css.includes('height:calc(100% + var(--p5815-bleed))!important'),
 'Home foreground viewport stable':css.includes('max-height:100dvh!important')&&css.includes('#portal.portal'),
 'one genuine approved venue photo':css.includes("url('/phase585/home-venue-user-refined-hd.webp')")&&css.includes('body:not(.p54-active)::before'),
 'photo continues below Home viewport':css.includes('overflow:visible!important')&&css.includes('bottom:calc(-1 * var(--p5815-bleed))!important'),
 'subtitle specific and editorial':css.includes('#portal .p545-brand-sub')&&css.includes('font-weight:500!important')&&css.includes('letter-spacing:.18em!important'),
 'no whole-layout translation':!css.includes('transform:translateY('),
 'no glow':!css.includes('drop-shadow')&&!css.includes('filter:blur'),
 'Setup background overscan':css.includes('#p54-workspace.p54-workspace')&&css.includes('height:calc(100dvh + var(--p5815-bleed))!important'),
 'Setup retains normal scrolling':css.includes('overscroll-behavior-y:contain!important'),
 'correct real Home head insert':home.includes('<link rel="stylesheet" href="'+path+'">'),
 'single CSS import':home.split(path).length-1===1,
 'PWA offline shell cache':worker.includes("'"+path+"',"),
 'source viewport fit cover':home.includes('viewport-fit=cover'),
 'no in-match CSS':!fs.readFileSync('public/modes/unified/index.html','utf8').includes(path)&&
                      !fs.readFileSync('public/modes/club-match/index.html','utf8').includes(path)
};
for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
assert(Object.values(checks).every(Boolean),'v5.8.15 PWA visual checks');
const paths=['public/index.html','public/sw.js','public/modes/unified/index.html','public/modes/club-match/index.html'];
const dig=()=>paths.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=dig();
execFileSync(process.execPath,['scripts/phase5815-integrate.cjs']);
assert.deepEqual(dig(),before,'PWA integration must be byte-identical on second build');
console.log('PASS v5.8.15 PWA polish: '+Object.keys(checks).length+' checks and idempotent build.');
