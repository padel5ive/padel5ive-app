'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const src=fs.readFileSync('public/phase5814/view-only-v5814.js','utf8');
const css=fs.readFileSync('public/phase5814/view-only-v5814.css','utf8');
const cloud=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
new vm.Script(src);new vm.Script(cloud);
for(const page of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const content=fs.readFileSync(page,'utf8');
 assert(content.includes('/phase5814/view-only-v5814.js'));
 assert(content.includes('/phase5814/view-only-v5814.css'));
}
const sw=fs.readFileSync('public/sw.js','utf8');
assert(sw.includes("'/phase5814/view-only-v5814.js'")&&sw.includes("'/phase5814/view-only-v5814.css'"));
assert(css.includes('body.p58-view-only'));
assert(!css.includes('grid-template-columns'),'Master iPad split layout must not change');
assert(cloud.includes("['cloud','refresh','home','leave'].includes(viewerButton.dataset.p5814ViewerAction)"));
assert(cloud.includes("if(isSession(current)&&identity(current)===meta.localId)localStorage.removeItem(KEY)"));
assert(cloud.includes("if(!meta||!view())return false"),'A controller cannot leave as viewer');
assert(cloud.includes('location.reload();'),'Native Cloud state rehydrate policy preserved');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const commonMenu='<details data-submenu="roster"><summary>Manage Players</summary></details><details data-submenu="match"><summary>Match Management</summary></details>';
const unified='<main id="americano"><details class="compact-controls"><summary>Menu &amp; Settings</summary><div class="ops-actions"><section class="p5-4852-menu">'+commonMenu+'</section><div class="p5-4857-new-row"><button data-act="new-tournament">New Session</button></div></div></details><div class="p5-stage-head">GAME MODE</div><div class="stats">stats</div><div class="bars"></div><div class="layout"><div><section class="card p5-v26-round-card"><button data-act="round">Round 2</button><div class="p5sm-card"><button data-act="score" class="p5sm-open-score">Andry vs Diki</button><div class="scorehint">Total of 5 · Tap to Score</div></div><div class="tools"><button data-act="next-round">Next Round</button></div></section></div><aside><section class="p5-b41-leaderboard">LEADERBOARD</section><div class="p5-v26-session-control">SESSION CONTROL</div></aside></div></main>';
const club='<details id="mainMenu"><summary>Menu &amp; Settings</summary><div class="ops-actions"><section class="p5-4852-menu">'+commonMenu+'</section></div></details><main id="app"><div class="p5-stage-head">GAME MODE</div><div class="master-stats">STATS</div><div class="layout stage1-layout"><div class="stage1-main"><section class="match-center"><button data-action="toggle-rounds">History</button><div class="rounds-drawer-head">MATCH HISTORY &amp; SCORE EDITING <span>Choose a round to view or correct past results</span></div><button data-action="view-round">Round 2</button><div class="court"><input data-stage1-score value="3"><input data-stage1-score value="2"><button data-action="complete-stage1">Review Score</button></div></section></div><aside><section class="leaderboard-card">LEADERBOARD</section></aside></div></main>';
async function one(kind){
 const isU=kind==='unified';
 const dom=new JSDOM('<!doctype html><html><head><style>'+css+'</style></head><body class="p58-view-only">'+(isU?unified:club)+'</body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://padel5ive.netlify.app/modes/'+(isU?'unified':'club-match')+'/'});
 const w=dom.window,doc=w.document;
 let opened=0,refreshed=0,left=0;
 w.P5CloudSession={getStatus:()=>({connected:true,role:'viewer',revision:7,status:'VIEW ONLY'}),open:()=>{opened++;return true},refreshNow:async()=>{refreshed++;return true},leaveViewer:()=>{left++;return true}};
 w.eval(src);doc.dispatchEvent(new w.Event('DOMContentLoaded'));await delay(100);
 const menu=doc.querySelector((isU?'#americano':'#mainMenu')+' .p5-4852-menu');
 const viewer=menu.querySelector('.p5814-view-menu');
 assert(viewer,'Viewer menu in native master component');
 assert.equal(menu.querySelectorAll('.p5814-view-menu').length,1);
 assert.equal(menu.querySelectorAll('.p5814-master-menu-hidden').length,2,'Moderator menus hidden');
 for(const label of ['Connection Status','Take Control','Refresh Data','Back to Home','Leave Cloud Session'])
  assert(viewer.textContent.includes(label),'Viewer menu item '+label);
 assert(doc.querySelector('.p5-stage-head').textContent.includes('GAME MODE'));
 assert(doc.querySelector(isU?'.p5-b41-leaderboard':'.leaderboard-card'));
 assert(doc.querySelector('.layout'),'Master split layout retained');
 if(isU){
  assert(doc.querySelector('[data-act=next-round]').classList.contains('p5814-hide-action'));
  assert(!doc.querySelector('[data-act=round]').classList.contains('p5814-hide-action'));
  assert(!doc.querySelector('[data-act=score]').classList.contains('p5814-hide-action'),'Scorecard visible');
  assert.equal(doc.querySelector('[data-act=score]').getAttribute('aria-disabled'),'true');
  assert.equal(doc.querySelector('.scorehint').textContent,'Total of 5');
  assert.equal(w.getComputedStyle(doc.querySelector('.p5-v26-session-control')).display,'none');
 }else{
  assert(doc.querySelector('[data-action=complete-stage1]').classList.contains('p5814-hide-action'));
  assert(!doc.querySelector('[data-action=view-round]').classList.contains('p5814-hide-action'));
  assert.equal(doc.querySelectorAll('.p5814-read-score').length,2);
  assert.deepEqual(Array.from(doc.querySelectorAll('.p5814-read-score')).map(e=>e.textContent),['3','2']);
  assert(doc.querySelector('.rounds-drawer-head').textContent.includes('Browse completed rounds'));
  assert.equal(w.getComputedStyle(doc.querySelector('.master-stats')).display,'none');
 }
 viewer.querySelector('[data-p5814-viewer-action=cloud]').click();assert.equal(opened,1);
 viewer.querySelector('[data-p5814-viewer-action=refresh]').click();await delay(45);assert.equal(refreshed,1);
 viewer.querySelector('[data-p5814-viewer-action=leave]').click();assert.equal(left,1);
 doc.body.classList.remove('p58-view-only');await delay(100);
 assert.equal(menu.querySelector('.p5814-view-menu'),null,'Viewer controls removed after taking control');
 assert.equal(doc.querySelector('.p5814-hide-action'),null,'Moderator actions restored');
 if(isU){
  assert.equal(doc.querySelector('.scorehint').textContent,'Total of 5 · Tap to Score');
  assert(!doc.querySelector('[data-act=score]').hasAttribute('aria-disabled'));
 }else{
  assert.equal(doc.querySelectorAll('.p5814-read-score').length,0);
  assert(!doc.querySelector('input[data-stage1-score]').hasAttribute('aria-disabled'));
 }
 w.close();
}
(async()=>{await one('unified');await one('club');console.log('PASS v5.8.14 viewer: native UI parity, permissions, menu, scoring and role recovery.');})().catch(e=>{console.error(e);process.exitCode=1});
