/* v5.8.6 regression: original image/gradient preserved on a stationary
 * GPU-backed layer; both modes are protected, print and scoring unaffected.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const css=fs.readFileSync('public/phase586/dashboard-fixed-backdrop-v586.css','utf8');
const js=fs.readFileSync('public/phase586/dashboard-fixed-backdrop-v586.js','utf8');
const sw=fs.readFileSync('public/sw.js','utf8');
new vm.Script(js,{filename:'dashboard-fixed-backdrop-v586.js'});
for(const path of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const h=fs.readFileSync(path,'utf8');
 assert(h.includes('/phase586/dashboard-fixed-backdrop-v586.css'),'Missing CSS in '+path);
 assert(h.includes('/phase586/dashboard-fixed-backdrop-v586.js'),'Missing JS in '+path);
 assert(h.indexOf('/phase585/menu-unified-v585.js')<h.indexOf('/phase586/dashboard-fixed-backdrop-v586.js'),'Layering order changed '+path);
}
assert(css.includes('position:fixed!important'),'Backdrop must be fixed');
assert(css.includes('height:100lvh!important'),'Viewport height must stay stable on iPad');
assert(css.includes('pointer-events:none!important'),'Backdrop must not intercept scoring clicks');
assert(css.includes('background-image:none!important'),'Old body/pseudo wallpaper must be disabled');
assert(css.includes('body.p586-dashboard-locked::before'),'Original pseudo wallpaper must not keep scrolling');
assert(css.includes('body.p586-dashboard-locked > .p586-dashboard-backdrop'),'Dedicated viewport layer required');
assert(css.includes('body.p586-dashboard-locked > main.wrap'),'Content stacking must stay above backdrop');
assert(css.includes('@media print'),'A4/PDF must not inherit background');
assert(js.includes("window.getComputedStyle(body,'::before')"),'Must preserve original venue photo and gradient');
assert(js.includes('body.insertBefore(backdrop,body.firstChild)'),'Layer should not be inside scrolling board');
assert(!js.includes('localStorage')&&!js.includes('fetch('),'No session or network side effects');
assert(sw.includes("'/phase586/dashboard-fixed-backdrop-v586.css'")&&sw.includes("'/phase586/dashboard-fixed-backdrop-v586.js'"),'PWA cache references missing');
const {JSDOM}=require('jsdom');
async function scenario(pseudoImage,bodyImage){
 const dom=new JSDOM('<!doctype html><html><body><main class="wrap"><button id="score">Score</button></main></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.test/modes/unified/'});
 const w=dom.window,d=w.document;let clicks=0;
 const score=d.getElementById('score');score.addEventListener('click',()=>clicks++);
 const style=(backgroundImage)=>({backgroundImage,backgroundPosition:'center top',backgroundSize:'cover',backgroundRepeat:'no-repeat',backgroundBlendMode:'normal',backgroundColor:'rgba(0, 0, 0, 0)'});
 w.getComputedStyle=(element,pseudo)=>style(pseudo?pseudoImage:bodyImage);
 w.eval(js);d.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
 const backs=d.querySelectorAll('body > .p586-dashboard-backdrop');
 assert.equal(backs.length,1,'One wallpaper only');
 assert.equal(backs[0].style.backgroundImage,pseudoImage.includes('url(')?pseudoImage:bodyImage,'Original background must be retained');
 assert.equal(backs[0].style.backgroundPosition,'center top');
 assert.equal(backs[0].style.backgroundSize,'cover');
 assert.equal(backs[0].getAttribute('aria-hidden'),'true');
 assert(d.body.classList.contains('p586-dashboard-locked'));
 assert.strictEqual(d.getElementById('score'),score,'Scoring button must not be reparented');
 score.click();assert.equal(clicks,1,'Score action listener must survive install');
 w.eval(js);assert.equal(d.querySelectorAll('body > .p586-dashboard-backdrop').length,1,'No duplicate layers after reentry');
 dom.window.close();
}
(async()=>{
 await scenario('linear-gradient(rgb(8, 19, 30), rgb(7, 17, 27)), url("venue.webp")','none');
 await scenario('none','url("club.webp")');
 execFileSync(process.execPath,['scripts/phase586-integrate.cjs']);
 console.log('PASS v5.8.6: fixed original venue backdrop in both modes, native scoring retained, repeat-safe installation.');
})().catch(e=>{console.error(e);process.exitCode=1});
