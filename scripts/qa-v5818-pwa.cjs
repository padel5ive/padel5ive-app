/* PADEL 5IVE v5.8.18 — iPhone PWA Home CTA composition regression.
 * The hero, logo, matches, dashboard, and Initial Setup must remain untouched.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const css=fs.readFileSync('public/phase5818/home-cta-lower-v5818.css','utf8');
const home=fs.readFileSync('public/index.html','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const modes=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const check={
 'PWA iPhone portrait only':css.includes('(display-mode:standalone) and (max-width:760px) and (orientation:portrait)'),
 'only landing Home when not in Initial Setup':css.includes('body:not(.p54-active) #portal .p541-home-actions'),
 '40px CTA lower':css.includes('var(--p5816-status-offset,59px)')&&css.includes('- 40px'),
 'tagline lower by 16px':css.includes('#portal .signature')&&css.includes('- 16px'),
 'all Home action buttons move together':!css.includes('#p58-load')&&!css.includes('#p57-history-button')&&!css.includes('#p54-resume'),
 'short iPhone safe adjustment':css.includes('(max-height:760px)')&&css.includes('- 24px')&&css.includes('- 10px'),
 'button/card sizes unchanged':!css.includes('min-height:')&&!css.includes('padding:')&&!css.includes('width:'),
 'photography and logo unchanged':!css.includes('background-image')&&!css.includes('masthead'),
 'bottom fullscreen fix preserved':home.includes('viewport-fit=auto')&&home.includes('pwa-viewport-v5816.css'),
 'dashboard status-bar match retained':home.includes('statusbar-parity-v5817.css'),
 'style inserted once into landing page':home.split('/phase5818/home-cta-lower-v5818.css').length===2&&home.indexOf('phase5818/home-cta-lower')<home.indexOf('</head>'),
 'service worker precache includes style':sw.includes("'/phase5818/home-cta-lower-v5818.css'"),
 'dashboard modes unmodified':modes.every(p=>!fs.readFileSync(p,'utf8').includes('phase5818/')),
 'no match engine changes':!css.includes('score')&&!css.includes('rounds')
};
for(const [label,ok] of Object.entries(check))console.log((ok?'PASS ':'FAIL ')+label);
assert(Object.values(check).every(Boolean),'v5.8.18 PWA layout checks failed');
const inputs=['public/index.html','public/sw.js',...modes];
const fingerprint=()=>inputs.map(x=>crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex'));
const before=fingerprint();
execFileSync(process.execPath,['scripts/phase5818-integrate.cjs']);
assert.deepEqual(fingerprint(),before,'v5.8.18 integration should be idempotent');
console.log('PASS v5.8.18 PWA Home CTA: '+Object.keys(check).length+' checks + idempotent build.');
