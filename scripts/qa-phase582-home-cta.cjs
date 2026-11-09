/* PADEL 5IVE v5.8.2: Home CTA layout regression.
 * 3 adjacent full-width bars are replaced with 1 primary and 2 half-width links.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('public/phase58/home-cta-compact-v582.css','utf8');
const home=fs.readFileSync('public/index.html','utf8');
const pwa=fs.readFileSync('public/phase58/pwa-fullscreen-v581.css','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
const sheet=['/phase58/pwa-fullscreen-v581.css','/phase58/home-cta-compact-v582.css'];
const checks={
 'two-column layout':css.includes('grid-template-columns: repeat(2, minmax(0, 1fr)) !important'),
 'only primary spans both columns':css.includes('grid-column: 1 / -1 !important'),
 'load in left secondary column':/>\s*#p58-load\s*\{\s*grid-column:\s*1\s*!important;[\s\S]*?grid-row:\s*2\s*!important;/.test(css),
 'history in right secondary column':/>\s*#p57-history-button\s*\{\s*grid-column:\s*2\s*!important;[\s\S]*?grid-row:\s*2\s*!important;/.test(css),
 'secondary buttons shorter':css.includes('height: 43px !important;'),
 'secondary buttons subtle transparent':css.includes('background: rgba(10, 25, 38, .71) !important;'),
 'running session Resume stays below':/>\s*#p54-resume\s*\{\s*grid-column:\s*1 \/ -1\s*!important;[\s\S]*?grid-row:\s*3\s*!important;/.test(css),
 'hidden Resume collapses':css.includes('> #p54-resume[hidden]')&&css.includes('display: none !important;'),
 'no venue re-cropping':!css.includes('.p541-venue')&&!css.includes('.masthead')&&!css.includes('.signature'),
 'dynamic viewport fix remains':pwa.includes('height: 100dvh !important;'),
 'Home has new stylesheet':home.includes('href="/phase58/home-cta-compact-v582.css"'),
 'stylesheet loads after fullscreen fix':home.indexOf(sheet[1])>home.indexOf(sheet[0]),
 'PWA pre-caches compact CSS':sw.includes("'/phase58/home-cta-compact-v582.css'"),
 'matches new Load Session markup':fs.readFileSync('public/phase58/cloud-home.js','utf8').includes("button.id='p58-load'"),
 'not added into game mode HTML':!fs.readFileSync('public/modes/unified/index.html','utf8').includes('home-cta-compact-v582'),
};
for(const [k,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+k);
assert(Object.values(checks).every(Boolean),'v5.8.2 compact Home CTA regression check');
console.log('PASS v5.8.2 compact Home CTAs '+Object.keys(checks).length+' checks.');
