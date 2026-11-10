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
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
for(const page of pages){
 const built=fs.readFileSync(page,'utf8');
 assert(built.includes('view-only-v5814.css?v=5823.0'),'Safari must receive newly versioned stylesheet');
 assert(built.includes('view-only-v5814.js?v=5823.0'),'Safari must receive newly versioned viewer script');
 assert.equal(built.split('view-only-v5814.css?v=').length-1,1,'Only one viewer stylesheet reference');
 assert(built.includes('cloud-dashboard.js?v=5823.0'),'Safari receives latest Cloud moderator controller UI');
 assert(built.includes('cloud-session.css?v=5823.0'),'Safari receives latest Cloud Session modal sizing');
 assert.equal(built.split('cloud-dashboard.js?v=').length-1,1,'No duplicate Cloud controller script tags');
}
const sw=fs.readFileSync('public/sw.js','utf8');
assert(sw.includes("'/phase5814/view-only-v5814.js'")&&sw.includes("'/phase5814/view-only-v5814.css'"));
assert(css.includes('body.p58-view-only'));
assert(!css.includes('grid-template-columns'),'Master iPad split layout must not change');
assert(cloud.includes("['cloud','refresh','leave'].includes(viewerButton.dataset.p5814ViewerAction)"));
assert(cloud.includes("if(isSession(current)&&identity(current)===meta.localId)localStorage.removeItem(KEY)"));
assert(cloud.includes("if(!meta||!view())return false"),'A controller cannot leave as viewer');
assert(cloud.includes('location.reload();'),'Native Cloud state rehydrate policy preserved');
assert(!cloud.includes("btn('RELEASE CONTROL'"),'Moderator Cloud modal does not expose Release Control');
assert(cloud.includes("btn('SYNC NOW'"),'Moderator retains on-demand Sync Now');
assert(cloud.includes("meta.moderatorPin=pin;meta.viewerKey=response.viewerKey;"),
 'PIN takeover persists viewer sharing credentials for the newly authorized moderator');
assert(cloud.includes("meta.moderatorPin=pin;meta.viewerKey=recovered.viewerKey;"),
 'Previous takeovers can unlock full moderator sharing UI with their PIN');
assert(cloud.includes("if(meta.role==='controller'&&(meta.viewerKey||meta.pin))"),
 'Viewer-only devices never display moderator sharing controls');
assert(cloud.includes("cr.append(pinCard(meta.moderatorPin))"),
 'All PIN-authenticated moderators receive the same tappable/copyable private PIN card');
assert(cloud.includes("SHARE VIEWER ACCESS · WHATSAPP"),
 'All controllers have the same WhatsApp sharing action after authenticated takeover');


const delay=ms=>new Promise(r=>setTimeout(r,ms));
const commonMenu='<details data-submenu="roster"><summary>Manage Players</summary></details><details data-submenu="match"><summary>Match Management</summary></details><details data-submenu="share" data-menu-section="Share & Export"><summary>Session & Results</summary><div class="p5-4852-content"><button type="button" data-p58-cloud>Cloud Session</button></div></details>';
const unified='<main id="americano"><details class="compact-controls"><summary>Menu &amp; Settings</summary><div class="ops-actions"><section class="p5-4852-menu">'+commonMenu+'</section><div class="p5-4857-new-row"><button data-act="new-tournament">New Session</button></div></div></details><div class="p5-stage-head">GAME MODE</div><div class="stats">stats</div><div class="bars"></div><div class="layout"><div><section class="card p5-v26-round-card"><button data-act="round">Round 2</button><div class="p5sm-card"><button data-act="score" class="p5sm-open-score">Andry vs Diki</button><div class="scorehint">Total of 5 · Tap to Score</div></div><div class="tools"><button data-act="next-round">Next Round</button><button id="viewer-untagged">Undo Score</button><input id="viewer-edit" placeholder="Change Player"></div></section></div><aside><section class="p5-b41-leaderboard">LEADERBOARD</section><div class="p5-v26-session-control">SESSION CONTROL</div></aside></div></main>';
const club='<details id="mainMenu"><summary>Menu &amp; Settings</summary><div class="ops-actions"><section class="p5-4852-menu">'+commonMenu+'</section><button id="club-global-admin">New Tournament</button></div></details><main id="app"><div class="p5-stage-head">GAME MODE</div><div class="master-stats">STATS</div><div class="layout stage1-layout"><div class="stage1-main"><section class="match-center"><button data-action="toggle-rounds">History</button><div class="rounds-drawer-head">MATCH HISTORY &amp; SCORE EDITING <span>Choose a round to view or correct past results</span></div><button data-action="view-round">Round 2</button><div class="court"><input data-stage1-score value="3"><input data-stage1-score value="2"><button data-action="complete-stage1">Review Score</button><button id="viewer-untagged">Reset Court</button></div></section></div><aside><section class="leaderboard-card">LEADERBOARD</section></aside></div></main>';
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
 assert.equal(viewer.tagName,'DETAILS','Viewer is native master accordion');
 assert(viewer.classList.contains('p5-4852-section'),'Viewer uses exact master accordion class');
 assert(viewer.querySelector(':scope > summary .p5-4852-label'),'Viewer header uses native title geometry');
 assert(viewer.querySelector('.p5814-view-row-label'),'Viewer rows have standalone full-width labels');
 assert(!viewer.querySelector('button'),'No inherited browser button CSS inside Viewer Settings');
 assert(viewer.querySelector('.p5814-view-row-chevron'),'Native-style row chevron is present');
 const rowStyle=w.getComputedStyle(viewer.querySelector('.p5814-view-row'));
 assert.equal(rowStyle.display,'flex','Viewer action must be a full-width flex ROW');
 assert.equal(rowStyle.flexFlow,'row nowrap','Viewer action must not stack or float into inline pills');
 assert.equal(rowStyle.width,'100%','Viewer action fills accordion width');
 const actualRow=viewer.querySelector('.p5814-view-row');
 assert.equal(actualRow.style.getPropertyValue('display'),'flex','iOS intrinsic layout remains flex even if stylesheet is cached');
 assert.equal(actualRow.style.getPropertyPriority('display'),'important','Critical row display has inline override');
 assert.equal(actualRow.style.getPropertyValue('justify-content'),'space-between','Chevron is aligned to the right');
 assert.match(actualRow.style.getPropertyValue('border-top'),/1px solid/,'Viewer actions have dividers');
 assert.equal(actualRow.style.getPropertyValue('min-height'),'55px','Rows keep native touch-friendly height');
 assert.equal(actualRow.querySelector('.p5814-view-row-chevron').style.getPropertyValue('margin-left'),'auto','Chevron stays at far right');
 assert.equal(doc.querySelectorAll('.p5814-view-row').length,3,'Exactly three viewer actions');

 assert.equal(menu.querySelectorAll('.p5814-view-menu').length,1);
 assert.equal(menu.querySelectorAll('.p5814-master-menu-hidden').length,4,'All four moderator menus hidden');
 const cloudRow=menu.querySelector(':scope > details.p5814-cloud-section');
 assert(cloudRow,'Cloud Session must be a native master accordion, not a button');
 assert.equal(cloudRow.tagName,'DETAILS');
 assert(cloudRow.classList.contains('p5-4852-section'),'Cloud Session uses the EXACT master accordion class');
 assert.equal(cloudRow.querySelector(':scope > summary').tagName,'SUMMARY','Cloud control is native master summary');
 assert.equal(menu.querySelectorAll(':scope > .p5814-cloud-section').length,1,'Only one native Cloud section');
 assert.equal(cloudRow.previousElementSibling?.getAttribute('data-submenu'),'share','Cloud Session directly follows Session & Results');
 assert.equal(cloudRow.querySelector(':scope > summary .p5-4852-label')?.textContent,'Cloud Session');
 assert(!cloudRow.textContent.includes('LIVE SYNC & DEVICE ACCESS'),'No Cloud promo copy');
 assert.equal(cloudRow.style.getPropertyValue('display'),'none','Viewer hides moderator Cloud Section');
 const original=cloudRow.querySelector('.p5814-cloud-native-handler [data-p58-cloud]');
 assert(original,'Native Cloud handler is preserved inside a hidden container');
 assert.equal(original.closest('.p5814-cloud-native-handler').hidden,true,'Original action must not render visibly');
 for(const label of ['Take Control','Refresh Data','Leave Cloud Session'])
  assert(viewer.textContent.includes(label),'Viewer menu item '+label);
 for(const label of ['CONNECTION STATUS','Follow Latest Round','Back to Home','CLOUD ACCESS'])
  assert(!viewer.textContent.includes(label),'Removed obsolete viewer action '+label);
 assert.equal(viewer.querySelectorAll('[role=button].p5814-view-row').length,3,'Viewer has exactly three accessible full-width rows');
 assert.equal(viewer.querySelectorAll('button').length,0,'No grey button pills can reappear');
 assert(!css.includes('p5814-cloud-primary'),'Old Cloud button override CSS fully removed');
 assert(!css.includes('p5814-view-action'),'Old viewer BUTTON CSS fully removed');
 assert(css.includes('details.p5814-cloud-section > summary'),'Cloud uses native summary selectors');
 assert(css.includes('.p5814-view-row'),'Viewer rows are independent from master BUTTON styles');
 assert(doc.querySelector('.p5-stage-head').textContent.includes('GAME MODE'));
 assert(doc.querySelector(isU?'.p5-b41-leaderboard':'.leaderboard-card'));
 assert(doc.querySelector('.layout'),'Master split layout retained');
 if(isU){
  assert(doc.querySelector('[data-act=next-round]').classList.contains('p5814-hide-action'));
  assert(!doc.querySelector('[data-act=round]').classList.contains('p5814-hide-action'));
  assert.equal(doc.querySelector('[data-act=score]').style.getPropertyValue('display'),'none','Editable score button must actually disappear');
  const staticScore=doc.querySelector('.p5814-score-static');
  assert(staticScore&&staticScore.textContent.includes('Andry vs Diki'),'Native scorecard content remains, but is passive');
  assert.equal(staticScore.tagName,'DIV','Read-only card is not a button');
  assert.equal(doc.querySelector('#viewer-untagged').style.getPropertyValue('display'),'none','Unlabelled moderator button hidden');
  assert.equal(doc.querySelector('.scorehint').textContent,'Total of 5');
  assert.equal(w.getComputedStyle(doc.querySelector('.p5-v26-session-control')).display,'none');
  assert.equal(doc.querySelector('#viewer-edit').style.getPropertyValue('display'),'none','Free-form player edits hidden');
  assert.equal(doc.querySelector('[data-act=round]').style.getPropertyValue('display'),'','Round navigation remains enabled');
  // The original controls can be dynamically added by the master after a round update.
  const dynamic=doc.createElement('button');dynamic.id='viewer-dynamic';dynamic.textContent='Reset Stage';
  doc.querySelector('.p5-v26-round-card').append(dynamic);
  await delay(80);
  assert.equal(dynamic.style.getPropertyValue('display'),'none','Newly rendered moderator buttons immediately hide');

 }else{
  assert.equal(doc.querySelector('[data-action=complete-stage1]').style.getPropertyValue('display'),'none','Club scoring button removed');
  assert.equal(doc.querySelector('#viewer-untagged').style.getPropertyValue('display'),'none','Club untagged button removed');
  assert.equal(doc.querySelector('#club-global-admin').style.getPropertyValue('display'),'none','Club global dock moderator button removed');
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
 const controllerCloud=menu.querySelector(':scope > details.p5814-cloud-section');
 assert(controllerCloud,'Cloud Session stays top-level as fourth native master accordion');
 assert(controllerCloud.classList.contains('p5-4852-section'),'Moderator Cloud has native master styling');
 assert(!controllerCloud.textContent.includes('LIVE SYNC'),'No promo copy');
 assert.notEqual(controllerCloud.style.getPropertyValue('display'),'none','Moderator Cloud row is visible');
 let nativeTriggered=0;
 doc.addEventListener('click',ev=>{if(ev.target.closest('[data-p58-cloud]'))nativeTriggered++},true);
 controllerCloud.querySelector(':scope > summary').click();
 assert.equal(nativeTriggered,1,'Native summary calls existing Cloud handler exactly once');
 assert.equal(controllerCloud.previousElementSibling?.getAttribute('data-submenu'),'share');
 if(isU){
  assert.equal(doc.querySelector('.scorehint').textContent,'Total of 5 · Tap to Score');
  assert(!doc.querySelector('.p5814-score-static'),'Passive score surface removed on controller switch');
  assert.notEqual(doc.querySelector('[data-act=score]').style.getPropertyValue('display'),'none','Native scoring restored');
  assert.notEqual(doc.querySelector('#viewer-untagged').style.getPropertyValue('display'),'none','Other controller controls restored');
 }else{
  assert.equal(doc.querySelectorAll('.p5814-read-score').length,0);
  assert(!doc.querySelector('input[data-stage1-score]').hasAttribute('aria-disabled'));
  assert.notEqual(doc.querySelector('#club-global-admin').style.getPropertyValue('display'),'none','Club global dock restored');
 }
 // Keep this jsdom window alive until its pending requestAnimationFrame flushes;
 // native Safari never destroys the document mid-frame during role restoration.
 await delay(120);
}
async function moderatorParity(){
 const start=cloud.indexOf('function card(label,value){');
 const end=cloud.indexOf('function applyRemote(r,force=false){',start);
 assert(start>=0&&end>start,'Cloud moderator renderer can be independently tested');
 const script=cloud.slice(start,end);
 const PIN='513966',KEY='p58-test-viewer-token';
 const base={kind:'unified',code:'T2NXA49VXT',token:'local-token',pin:null,
  moderatorPinRequired:true,summary:{session:'QA Match',date:'2026-11-10',time:'09:00'},
  revision:1,waiting:false,takeoverRequested:false};
 const testModal=(role,hasAccess)=>{
  const dom=new JSDOM('<!doctype html><body><section id="cloud-root"></section></body>',{
   runScripts:'outside-only',url:'https://deploy-preview-17--padel5ive.netlify.app'});
  const doc=dom.window.document,ctx={
   document:doc,meta:{...base,role,
    moderatorPin:hasAccess?PIN:null,viewerKey:hasAccess?KEY:null},
   body:doc.querySelector('#cloud-root'),conflict:false,offline:false,working:false,
   e:(tag,cls,text)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el},
   btn:(label)=>{const b=doc.createElement('button');b.textContent=label;return b},
   info:(text)=>{const p=doc.createElement('p');p.textContent=text;return p},
   mark:()=>{},formatDate:s=>s,get:()=>null,isSession:()=>true,
   navigator:{clipboard:{writeText:async v=>{ctx.copied=v}}},
   alert:()=>{},persist:()=>{ctx.persisted=true},
   api:async action=>{
    ctx.lastAction=action;
    if(action==='take-control')return {data:{},viewerKey:KEY};
    if(action==='recover-access')return {viewerKey:KEY};
    throw Error('Unexpected Cloud action '+action);
   },
   applyRemote:()=>{ctx.applied=true}
  };
  vm.runInNewContext(script+'\nthis.renderForTest=render;',ctx);
  ctx.renderForTest();
  return {dom,ctx,doc,root:ctx.body};
 };
 const original=testModal('controller',true);
 const controls=root=>Array.from(root.querySelectorAll('button')).map(x=>x.textContent);
 assert(original.root.querySelector('.p58-private-pin-copy'),'Original controller shows private PIN');
 assert(controls(original.root).includes('SHARE VIEWER ACCESS · WHATSAPP'));
 assert(controls(original.root).includes('COPY ACCESS DETAILS'));
 assert(controls(original.root).includes('SYNC NOW'));
 original.root.querySelector('.p58-private-pin-copy').click();
 await delay(15);assert.equal(original.ctx.copied,PIN,'PIN copy action copies only the private PIN');
 const migrating=testModal('controller',false);
 assert(controls(migrating.root).includes('UNLOCK ACCESS DETAILS'));
 assert(!controls(migrating.root).includes('SHARE VIEWER ACCESS · WHATSAPP'));
 const unlock=migrating.root.querySelector('.p58-moderator-form');
 unlock.querySelector('input').value=PIN;
 unlock.dispatchEvent(new migrating.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await delay(25);
 assert.equal(migrating.ctx.lastAction,'recover-access');
 assert.equal(migrating.ctx.meta.viewerKey,KEY);
 assert.equal(migrating.ctx.meta.moderatorPin,PIN);
 assert(controls(migrating.root).includes('SHARE VIEWER ACCESS · WHATSAPP'));
 assert(controls(migrating.root).includes('COPY ACCESS DETAILS'));
 assert(controls(migrating.root).includes('SYNC NOW'));
 const spectator=testModal('viewer',false);
 const takeover=spectator.root.querySelector('.p58-moderator-form');
 takeover.querySelector('input').value=PIN;
 takeover.dispatchEvent(new spectator.dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await delay(25);
 assert.equal(spectator.ctx.lastAction,'take-control');
 assert.equal(spectator.ctx.meta.moderatorPin,PIN,'Takeover retains entered private Moderator PIN');
 assert.equal(spectator.ctx.meta.viewerKey,KEY,'Takeover retains new Viewer Link');
 assert(spectator.ctx.applied,'Takeover applies server-authoritative cloud snapshot');
 spectator.ctx.meta.role='controller';spectator.ctx.renderForTest();
 assert.deepEqual(controls(spectator.root),controls(original.root),
  'Transferred and originating moderators have identical share, copy and sync controls');
 assert.equal(spectator.root.querySelectorAll('.p58-credential').length,
  original.root.querySelectorAll('.p58-credential').length,
  'Transferred and original moderator credential card layouts match');
 console.log('PASS v5.8.14 Cloud modal parity: creator / new moderator / recovery, PIN copy and share.');
}
(async()=>{await one('unified');await one('club');await moderatorParity();console.log('PASS v5.8.14 viewer: native UI parity, permissions, menu, scoring and role recovery.');})().catch(e=>{console.error(e);process.exitCode=1});
