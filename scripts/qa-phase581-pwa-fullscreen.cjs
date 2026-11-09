/* PADEL 5IVE v5.8.1 — standalone PWA bottom seam regression guard. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('public/phase58/pwa-fullscreen-v581.css','utf8');
const home=fs.readFileSync('public/index.html','utf8');
const worker=fs.readFileSync('public/sw.js','utf8');
const old=fs.readFileSync('public/pwa-standalone-layout-v5601.css','utf8');
const tests={
 'standalone-only CSS':css.includes('@media screen and (display-mode: standalone)'),
 'Home uses true dynamic viewport':/#portal\.portal\s*\{[^}]*height:\s*100dvh\s*!important;[^}]*min-height:\s*100dvh\s*!important;/m.test(css),
 'Initial Setup uses dynamic viewport':/#p54-workspace\.p54-workspace\s*\{[^}]*height:\s*100dvh\s*!important;[^}]*min-height:\s*100dvh\s*!important;/m.test(css),
 'older iOS vh fallback':css.includes('height: 100vh !important;'),
 'venue photo reaches bottom':css.includes('#portal .p541-venue')&&css.includes('min-height: 100% !important;'),
 'artwork retained':css.includes('background-size: cover;')&&!css.includes('background-image:'),
 'not pushing cards down':!css.includes('transform: translateY(')&&!css.includes('padding-top:')&&!css.includes('.p541-home-actions'),
 'loaded into Home only':home.includes('/phase58/pwa-fullscreen-v581.css'),
 'offline PWA precache':worker.includes("'/phase58/pwa-fullscreen-v581.css'"),
 'existing PWA header kept':old.includes('body.p5-pwa-compact-nav .p5-pwa-header-footer'),
};
for(const [name,pass] of Object.entries(tests))console.log((pass?'PASS ':'FAIL ')+name);
assert(Object.values(tests).every(Boolean),'PWA dynamic viewport regression');
console.log('PASS iPhone/iPad PWA full-height continuity: '+Object.keys(tests).length+' checks');
