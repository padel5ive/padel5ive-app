/* PADEL 5IVE v5.8.10: viewer navigates rounds, cannot edit scores/stages. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const u=fs.readFileSync('public/modes/unified/index.html','utf8');
const c=fs.readFileSync('public/modes/club-match/index.html','utf8');
new vm.Script(src,{filename:'cloud-dashboard.js'});
const begin=src.indexOf('// Verified native engine handlers.');
const end=src.indexOf('function mount(){',begin);
const stableBegin=src.indexOf('const legacyStable=');
const stableEnd=src.indexOf('const formatDate=',stableBegin);
const applyBegin=src.indexOf('function applyRemote(r,force=false){');
const applyEnd=src.indexOf('async function refresh(){',applyBegin);
assert(begin>=0&&end>begin&&stableBegin>=0&&stableEnd>stableBegin&&applyBegin>=0&&applyEnd>applyBegin);
const safe=src.slice(begin,end),stable=src.slice(stableBegin,stableEnd);
const stubButton=(action,kind,opts={})=>{
 const btn={dataset:kind==='unified'?{act:action}:{action},disabled:!!opts.disabled};
 const item={closest(selector){
  if(selector==='#p58-cloud-host')return opts.cloudHost?{}:null;
  if(selector==='button[data-p58-cloud]')return opts.cloudButton?btn:null;
  if(selector==='button[data-act],button[data-action]')return action?btn:null;
  if(selector==='button,input,select,textarea,[data-act],[data-action],[contenteditable],label')return btn;
  return null;
 }};
 return item;
};
function event(type,target,key){
 let blocked=false;
 return {type,target,key,preventDefault(){blocked=true},stopImmediatePropagation(){blocked=true},get blocked(){return blocked}};
}
const allowedU=['round','view-schedule','tab-stage1','tab-stage2','back-stage1','bracket-nav','jump-ko-courts','ko-history','report-preview','report-close','replay-champion'];
const allowedC=['view-round','toggle-rounds','latest-round','filter-leaderboard','jump-leaderboard','replay-champion'];
for(const kind of ['unified','club']){
 const ctx={kind,meta:{role:'viewer'},view(){return this.meta.role==='viewer'}};
 // VM globals aren't bound as this when passed directly; use local view closure.
 ctx.view=()=>ctx.meta.role==='viewer';
 vm.runInNewContext(safe+'\nthis.guard=guard;this.viewerNavigation=viewerNavigation;',ctx);
 const allowed=kind==='unified'?allowedU:allowedC;
 for(const action of allowed){
  const t=stubButton(action,kind);
  for(const type of ['click','touchend','pointerup']){
   const e=event(type,t);ctx.guard(e);assert(!e.blocked,kind+': '+action+' must work via '+type);
  }
  const e=event('keydown',t,'Enter');ctx.guard(e);assert(!e.blocked,kind+': keyboard Enter '+action);
 }
 for(const action of ['score','next-round','finish-stage1','reset-stage1','new-tournament','save','edit-ko-result','confirm-score','approve-control','jump-stage','reopen-stage1','set-courts','edit-stage1-result','complete-stage1','create-duels','view-final-verdict','tab-stage3']){
  const t=stubButton(action,kind);
  for(const type of ['click','touchend','pointerup']){
   const e=event(type,t);ctx.guard(e);assert(e.blocked,kind+': must block mutation '+action+' '+type);
  }
  const e=event('keydown',t,'Enter');ctx.guard(e);assert(e.blocked,kind+': Enter must block '+action);
 }
 for(const type of ['submit','input','change']){
  const e=event(type,stubButton(null,kind));ctx.guard(e);assert(e.blocked,kind+': block '+type);
 }
 const cloud=event('click',stubButton(null,kind,{cloudButton:true}));
 ctx.guard(cloud);assert(!cloud.blocked,kind+': Cloud Session menu must be usable');
 const host=event('click',stubButton(null,kind,{cloudHost:true}));
 ctx.guard(host);assert(!host.blocked,kind+': Cloud Session Take Control must be usable');
 const nonNav=event('click',stubButton('round',kind,{disabled:true}));
 ctx.guard(nonNav);assert(nonNav.blocked,'Disabled controls stay blocked');
 const tab=event('keydown',stubButton(null,kind),'Tab');
 ctx.guard(tab);assert(!tab.blocked,'Keyboard tab navigation not blocked');
 ctx.meta.role='controller';
 const own=event('click',stubButton('score',kind));
 ctx.guard(own);assert(!own.blocked,'Controller can still edit scores');
 const st={kind};
 vm.runInNewContext(stable+'\nthis.stable=stable;this.legacyStable=legacyStable;',st);
 const roundState={version:24,rounds:[{matches:[{confirmed:true,score:[3,2]}]}],ui:{stageTab:'stage1'},viewRound:0};
 const before=st.stable(roundState),legacy=st.legacyStable(roundState);
 roundState.viewRound=5;
 if(kind==='unified'){
  assert.equal(st.stable(roundState),before,'Viewer round choice cannot create cloud dirty conflict');
  assert.notEqual(st.legacyStable(roundState),legacy,'Old hash included viewRound');
 }else assert.notEqual(st.stable(roundState),before,'Club state remains unchanged semantics');
}
// PR36 adds persistent-availability repair before viewRound changes. Confirm the
// native action STILL updates only the viewed round, without advancing progress.
const roundAction=/case 'round':([\\s\\S]*?)case 'next-round':/.exec(u);
assert(roundAction,'Native unified round navigation handler is present');
assert(roundAction[1].includes('s.viewRound=Math.max(0,Math.min(s.rounds.length-1,+el.dataset.round))'),'Round click must update viewed round only');
assert(roundAction[1].includes('if(s.needsAvailabilityRebuild)')&&roundAction[1].includes('repairAvailabilitySchedule()'),'Round navigation must not bypass persistent availability reconciliation');
assert(!roundAction[1].includes('s.currentRound++'),'Browsing history must never advance active round');
for(const term of ["case 'view-schedule':s.ui.fullSchedule=","case 'tab-stage1':s.ui.stageTab='stage1'","case 'view-round':roundDrawerOpen=true;inspectedRound=","case 'toggle-rounds':roundDrawerOpen=!roundDrawerOpen","case 'latest-round':inspectedRound=null"]){
 assert((term.startsWith("case 'view-round'")||term.startsWith("case 'toggle-rounds'")||term.startsWith("case 'latest-round'")?c:u).includes(term),'Native safe navigation action missing '+term);
}
assert(!allowedC.includes('jump-stage'),'Club jump-stage changes saved state, must remain blocked');
assert(src.includes("for(const type of ['click','touchend','pointerup','change','input','submit','keydown'])"));
assert(src.includes('meta.lastHash===stringHash(legacyStable(local))'),'Existing Cloud links retain old hash compatibility');
assert(src.includes("r.data={...r.data,viewRound:Math.max(0,Math.min(selected,r.data.rounds.length-1))}"),'Viewer choice survives cloud update');

const existing={version:24,session:'TEST',stage:'stage1',rounds:[{matches:[]},{matches:[]},{matches:[]}],viewRound:2};
let written=null,refreshed=0,meta={localId:'test',revision:4,role:'viewer',summary:null};
const ctx={kind:'unified',meta,view:()=>true,get:()=>existing,set:(k,v)=>{written=v},KEY:'fake',isSession:()=>true,identity:()=> 'test',dirty:()=>false,stable:s=>JSON.stringify(s),persist:()=>{},location:{reload:()=>{refreshed++}},last:'',offline:false,conflict:false,isFollowingLive:()=>false,latestRound:()=>1};
vm.runInNewContext(src.slice(applyBegin,applyEnd)+'\nthis.applyRemote=applyRemote;',ctx);
ctx.applyRemote({data:{...existing,viewRound:0},revision:5,role:'viewer',summary:{}});
assert.equal(written.viewRound,2,'Viewer round should survive cloud score update');
assert.equal(refreshed,1);
assert.equal(ctx.meta.revision,5);
ctx.isFollowingLive=()=>true;
ctx.applyRemote({data:{...existing,currentRound:1,viewRound:0},revision:6,role:'viewer',summary:{}});
assert.equal(written.viewRound,1,'Following Live must use latest active round');
assert.equal(refreshed,2);
console.log('PASS v5.8.10: view-only round browsing in both engines, no score/stage edits, iOS touch, keyboard, cloud transfer, round preference sync.');
