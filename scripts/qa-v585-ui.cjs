/* PADEL 5IVE v5.8.5 — static guardrails after npm run build. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const get=p=>fs.readFileSync(p,'utf8');
const home=get('public/index.html'),uni=get('public/modes/unified/index.html'),club=get('public/modes/club-match/index.html');
const css=get('public/phase585/home-stage-v585.css'),menu=get('public/phase585/menu-unified-v585.js'),style=get('public/phase585/menu-unified-v585.css'),scroll=get('public/phase585/home-scroll-v585.js'),sw=get('public/sw.js');
const art=fs.readFileSync('public/phase585/home-venue-user-refined-hd.webp');
const checks={
 'single photographic portrait, no fallback to double-image layers':css.includes('background-image:url(')&&css.includes('/phase585/home-venue-user-refined-hd.webp')&&css.includes('#portal .p541-venue > img')&&css.includes('display:none!important'),
 'photo is the full-resolution approved venue image with refined tonal treatment':art.length>250000&&art.subarray(0,4).toString()==='RIFF'&&art.subarray(8,12).toString()==='WEBP',
 'old layered image selectors explicitly overruled':css.includes('html body #portal .p541-venue > img.p544-ambient')&&css.includes('html body #portal .p541-venue > img.p544-foreground')&&css.includes('display:none!important'),
 'light venue fade, no foreground mask':!css.includes('mask-image')&&!css.includes('blur(25px)'),
 'mobile Home only':css.includes('@media(max-width:760px)'),
 'installed PWA Home fixed viewport':css.includes('position:fixed!important')&&css.includes('height:100dvh!important'),
 'Home reset cannot interfere with score view':scroll.includes("document.getElementById('portal')")&&scroll.includes("classList.contains('p54-active')")&&!scroll.includes('localStorage'),
 'Home photo stylesheet wired':home.includes('/phase585/home-stage-v585.css'),
 'Home script wired':home.includes('/phase585/home-scroll-v585.js'),
 'both games have same visual menu CSS':uni.includes('/phase585/menu-unified-v585.css')&&club.includes('/phase585/menu-unified-v585.css'),
 'both games have same menu adapter':uni.includes('/phase585/menu-unified-v585.js')&&club.includes('/phase585/menu-unified-v585.js'),
 'menu actions are moved not cloned':menu.includes('while(from.firstChild)to.append(from.firstChild)')&&menu.includes('session.remove();advanced.remove();mark(root)'),
 'three Unified menu categories':menu.includes("title.textContent='Session & Results'")&&menu.includes("session.remove();advanced.remove()"),
 'three Club menu categories':menu.includes("Manage Players & Courts")&&menu.includes("manageContent.append(teams,courts)")&&menu.includes("content.append(sessionGroup)"),
 'Share and PDF remain native':uni.includes("act('Export / Save as PDF','pdf-download')")&&uni.includes("'share-result-link'")&&club.includes('id="shareResults"')&&club.includes('id="exportPdf"'),
 'Cloud Session remains native':uni.includes('data-p58-cloud')&&club.includes('data-p58-cloud'),
 'Backup and Restore handlers retained':uni.includes("act('Backup Data','backup')")&&uni.includes("act('Restore Backup JSON','restore')")&&club.includes('data-action="backup"')&&club.includes('data-action="restore"'),
 'advanced fairness remains':uni.includes('P5RecoveryAudit.inspect(s)')&&uni.includes('Fairness Monitor'),
 'LIVE removed only from leaderboard':menu.includes('removeLiveBadge()')&&menu.includes('.p5-b41-leaderboard')&&uni.includes("pill=live?'LIVE':'FINAL'"),
 'stage status retained at top':uni.includes('p5-si-status')&&club.includes('id="headerStatus"'),
 'uniform button rows against master importance':style.includes('html body #americano .p5-4852-content .p585-group')&&style.includes('html body #mainMenu .p5-4852-content .p585-group'),
 'PWA approved venue photo and menu scripts precached':sw.includes("'/phase585/home-venue-user-refined-hd.webp'")&&sw.includes("'/phase585/menu-unified-v585.js'"),
 'Cloud Session native row and duplicate-heading fix':menu.includes("cloud.textContent='Cloud Session'")&&menu.includes("const sessionGroup=block('SESSION DATA')")&&style.includes('button.p585-cloud-row'),
 'Advanced Tools kept collapsible':menu.includes("const tools=create('details','p585-tools')"),
 'PWA published report bypass safe':sw.includes("'/api/'")&&sw.includes("'/results/'"),
 'Club stages and court management preserved':club.includes('data-action="apply-courts"')&&club.includes('data-menu-section="Match Management"')
};
for(const [n,v] of Object.entries(checks))console.log((v?'PASS ':'FAIL ')+n);
assert(Object.values(checks).every(Boolean),'v5.8.5 regression assertions failed');
new vm.Script(menu,{filename:'menu-unified-v585.js'});new vm.Script(scroll,{filename:'home-scroll-v585.js'});
let scripts=0;
for(const [name,doc] of [['Home',home],['Unified',uni],['Club Match',club]]){
 let count=0;for(const m of doc.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1])||!m[2].trim()||/type\s*=\s*["'](?:application\/json|module)/i.test(m[1]))continue;
  new vm.Script(m[2],{filename:name+' embedded '+count});count++;
 }
 console.log('PASS '+name+' native scripts parsed: '+count);scripts+=count;
}
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const tracked=['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html','public/sw.js'];
const before=tracked.map(digest);
execFileSync(process.execPath,['scripts/phase585-integrate.cjs']);
assert.deepEqual(tracked.map(digest),before,'Review integration must be idempotent');
console.log('PASS v5.8.5 UI QA: '+Object.keys(checks).length+' checks / '+scripts+' embedded scripts / idempotent build.');
