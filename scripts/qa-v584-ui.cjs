/* v5.8.4 isolated Home + Unified menu UI regression guards.
 * Verify compiled output; game state/engines intentionally untouched. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('public/index.html'),uni=read('public/modes/unified/index.html'),club=read('public/modes/club-match/index.html');
const hcss=read('public/phase58/home-finish-v584.css'),mcss=read('public/phase58/share-menu-alignment-v584.css'),scroll=read('public/phase58/home-scroll-v584.js'),sw=read('public/sw.js');
const assertions={
 'new Home stylesheet in compiled document':home.includes('<link rel="stylesheet" href="/phase58/home-finish-v584.css">'),
 'new Home scroll reset in compiled document':home.includes('<script defer src="/phase58/home-scroll-v584.js"></script>'),
 'new share menu stylesheet compiled':uni.includes('<link rel="stylesheet" href="/phase58/share-menu-alignment-v584.css">'),
 'no unintended club style injection':!club.includes('home-finish-v584.css')&&!club.includes('share-menu-alignment-v584.css'),
 'original app navigation preserved':home.includes('window.P5PreviewLaunch')&&uni.includes("entry('Share & Export'"),
 'existing round controls preserved':uni.includes('round-picker round-picker-expanded')&&uni.includes('p5-stage1-score-grid'),
 'both Share and PDF button actions preserved':uni.includes("act('Export / Save as PDF','pdf-download')")&&uni.includes("'share-result-link'"),
 'menu labels aligned with a shared row geometry':mcss.includes('data-act="pdf-download"],')&&mcss.includes('data-act="share-result-link"] {')&&mcss.includes('justify-content:space-between!important'),
 'both chevrons right-aligned':mcss.includes('button.p5-b31-menu-row[data-act="pdf-download"] > span[aria-hidden="true"]')&&mcss.includes('button.p5-b31-menu-row[data-act="share-result-link"] > span[aria-hidden="true"]')&&mcss.includes('margin:0 0 0 auto!important'),
 'both labels use identical horizontal padding':mcss.includes('padding:12px 9px!important'),
 'original menu data-actions remain handlers':uni.includes('data-act="${id}"'),
 'court foreground fades gradually':hcss.includes('rgba(0,0,0,.54) 100%')&&hcss.includes('rgba(3,12,25,.15) 75%'),
 'court photo content retained':home.includes('p544-foreground')&&home.includes('p544-ambient'),
 'standalone Home viewport is fixed':hcss.includes('position:fixed!important')&&hcss.includes('height:100dvh!important')&&hcss.includes('max-height:100dvh!important'),
 'Home disables extra scroll only outside Setup':hcss.includes('body:not(.p54-active)')&&hcss.includes('overflow-y:hidden!important'),
 'scroll reset only in standalone app':scroll.includes("(display-mode: standalone)")&&scroll.includes('scrollRestoration'),
 'scroll reset handles bfcache return':scroll.includes("addEventListener('pageshow'")&&scroll.includes('requestAnimationFrame'),
 'No editor state or scoring changes in reset script':!scroll.includes('localStorage')&&!scroll.includes('fetch('),
 'PWA precaches new assets':sw.includes("'/phase58/home-finish-v584.css'")&&sw.includes("'/phase58/home-scroll-v584.js'")&&sw.includes("'/phase58/share-menu-alignment-v584.css'"),
 'PWA API bypass remains':sw.includes("'/api/'"),
 'Stage 1 Fairness Monitor remains':uni.includes('P5RecoveryAudit.inspect(s)'),
 'Share menu fixes extend v5.8.3 not replace it':uni.includes('/phase58/dashboard-clean-v583.css')
};
for(const [k,v] of Object.entries(assertions))console.log((v?'PASS ':'FAIL ')+k);
assert(Object.values(assertions).every(Boolean),'v5.8.4 source and layout regression guard failed');
let compiled=0;
for(const [file,html] of [['public/index.html',home],['public/modes/unified/index.html',uni]]){
 let i=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1])||/type\s*=\s*["'](?:application\/json|module)/i.test(m[1])||!m[2].trim())continue;
  new vm.Script(m[2],{filename:file+':inline '+i});i++;
 }
 console.log('PASS '+file+' inline JS parser: '+i+' scripts');compiled+=i;
}
new vm.Script(scroll,{filename:'home-scroll-v584.js'});
const hash=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const targets=['public/index.html','public/modes/unified/index.html','public/sw.js'];
const before=targets.map(hash);
execFileSync('node',['scripts/phase584-transform.cjs'],{encoding:'utf8'});
assert.deepEqual(targets.map(hash),before,'v5.8.4 build transform must be idempotent');
console.log('PASS v5.8.4: '+Object.keys(assertions).length+' UI checks, '+compiled+' embedded scripts, transform idempotent.');
