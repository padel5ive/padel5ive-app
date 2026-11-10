/* PADEL 5IVE v5.8.17 · iPhone PWA top-chrome parity regression
 * No tournament gameplay, Cloud Session, or viewport-origin changes. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const home=fs.readFileSync('public/index.html','utf8');
const unified=fs.readFileSync('public/modes/unified/index.html','utf8');
const club=fs.readFileSync('public/modes/club-match/index.html','utf8');
const css=fs.readFileSync('public/phase5817/statusbar-parity-v5817.css','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const marks={
 'Home native chrome exactly dashboard charcoal':home.includes('<meta name="theme-color" content="#11171d">'),
 'Dashboard theme unaffected':unified.includes('<meta name="theme-color" content="#11171d">'),
 'Browser theme restored early':home.includes('id="p5817-browser-theme"')&&home.includes('m.setAttribute("content","#071629")'),
 'Home removed legacy black-translucent':!home.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"'),
 'In-game status bar preserved':unified.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"')&&club.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"'),
 'Existing Home viewport origin fix preserved':home.includes('viewport-fit=auto')&&home.includes('id="p5816-viewport-mode"'),
 'Home still uses installed standalone':home.includes('name="apple-mobile-web-app-capable" content="yes"'),
 'New iPhone-only stylesheet':css.includes('(display-mode:standalone) and (max-width:760px)'),
 'Root matches dashboard color':css.includes('--p5817-dashboard-chrome: #11171d'),
 'Actual approved photo retained':css.includes("url('/phase585/home-venue-user-refined-hd.webp')"),
 'No layout position modifications':!css.includes('100dvh')&&!css.includes('height:calc(')&&!css.includes('padding-top:'),
 'Home and Setup both styled':css.includes('body:not(.p54-active)')&&css.includes('body.p54-active #p54-workspace'),
 'Only one new CSS import':home.split('/phase5817/statusbar-parity-v5817.css').length===2,
 'SW precache updated':sw.includes("'/phase5817/statusbar-parity-v5817.css'"),
 'Mode engines untouched':!unified.includes('phase5817/')&&!club.includes('phase5817/'),
 'Frontend input and mode selectors preserved':home.includes('INITIAL SETUP')&&home.includes('SIGNATURE GAME')
};
for(const [name,ok] of Object.entries(marks))console.log((ok?'PASS ':'FAIL ')+name);
assert(Object.values(marks).every(Boolean),'v5.8.17 status-bar parity checks failed');
const paths=['public/index.html','public/sw.js','public/modes/unified/index.html','public/modes/club-match/index.html'];
const hash=()=>paths.map(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
const before=hash();
execFileSync(process.execPath,['scripts/phase5817-integrate.cjs']);
assert.deepEqual(hash(),before,'v5.8.17 integration must be byte-identical on rerun');
console.log('PASS v5.8.17 dashboard status chrome parity: '+Object.keys(marks).length+' checks + repeat-safe build');
