/* PADEL 5IVE · Cloud Viewer selected-round retention regression.
 * A moderator may score Round 18 while currentRound still points at Round 5.
 * Viewer round choice must survive actual Cloud revisions and page reloads.
 * Presentation-only test: no engine fixtures, scores or roles are edited.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const cloud=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const viewer=fs.readFileSync('public/phase5814/view-only-v5814.js','utf8');
new vm.Script(cloud);new vm.Script(viewer);
const localSlice=cloud.slice(cloud.indexOf('const liveKey=()=>'),cloud.indexOf('function dirty(){'));
const remoteSlice=cloud.slice(cloud.indexOf('function applyRemote(r,force=false){'),cloud.indexOf('async function refresh(){'));
assert(localSlice.includes('function setViewedRound('));
assert(remoteSlice.includes('getViewedRound()'),'Cloud revision must consult local viewer presentation state');
const KEY='qa-unified';
const rounds=Array.from({length:24},(_,i)=>({id:i,matches:[{confirmed:false,score:null}]}));
const original={version:24,session:'LIVE QA',stage:'stage1',currentRound:4,viewRound:4,
 rounds,marker:'test'};
const store=new Map(),storage={
 getItem:k=>store.has(k)?store.get(k):null,
 setItem:(k,v)=>store.set(k,String(v)),
 removeItem:k=>store.delete(k)
};
let local=JSON.parse(JSON.stringify(original)),reloads=0;
const meta={kind:'unified',code:'P5QA18',role:'viewer',localId:'qa',revision:8};
const ctx={meta,kind:'unified',KEY,sessionStorage:storage,view:()=>meta.role==='viewer',
 get:()=>local,set:(key,value)=>{assert.equal(key,KEY);local=value},
 isSession:()=>true,identity:()=> 'qa',dirty:()=>false,
 stable:x=>JSON.stringify(x),last:'',persist:()=>{},offline:false,conflict:false,
 location:{reload(){reloads++}}
};
vm.runInNewContext(localSlice+'\n'+remoteSlice+
 '\nthis.api={getViewedRound,setViewedRound,isFollowingLive,setFollowingLive,latestRound,applyRemote};',ctx);
const fn=ctx.api;
assert.equal(fn.isFollowingLive(),true,'Fresh viewer must initially follow live');
assert.equal(fn.setViewedRound(17),true);
fn.setFollowingLive(false);
assert.equal(fn.getViewedRound(),17);
const scoreUpdate=(revision,currentRound)=>({
 revision,role:'viewer',summary:{session:'LIVE QA'},
 data:{...original,currentRound,viewRound:currentRound,
 rounds:rounds.map((r,i)=>i===17?{...r,matches:[{confirmed:true,score:[3,2]}]}:r)}
});
fn.applyRemote(scoreUpdate(9,4));
assert.equal(local.viewRound,17,'Remote Round 5 progress must not replace Viewer Round 18');
assert.equal(local.rounds[17].matches[0].confirmed,true,'Confirmed score must sync');
assert.equal(reloads,1,'Changed Cloud revision must rehydrate native engine');
fn.applyRemote(scoreUpdate(10,6));
assert.equal(local.viewRound,17,'Viewer stays on Round 18 after another score update');
assert.equal(reloads,2);
assert.equal(fn.getViewedRound(),17,'Selected round survives reload via sessionStorage');
fn.setFollowingLive(true);
assert.equal(fn.getViewedRound(),null,'Explicit Latest clears fixed round selection');
fn.applyRemote(scoreUpdate(11,5));
assert.equal(local.viewRound,5,'Latest resumes authoritative currentRound');
assert.equal(reloads,3);
meta.role='controller';
assert.equal(fn.setViewedRound(14),false,'Moderator cannot write Viewer presentation preference');
assert.equal(fn.getViewedRound(),null);
function spectatorScript(kind,selected,savedView){
 let captured=null,clicked=0,follow=[],chosen=[];
 const btn={disabled:false,dataset:kind==='club'?{action:'view-round',value:String(selected)}:{act:'round',round:String(selected)}};
 const target={click(){clicked++;if(captured)captured({target:{closest:()=>btn}})}};
 const doc={
  body:{classList:{contains:s=>s==='p58-view-only'}},
  addEventListener:(event,fn)=>{if(event==='click')captured=fn}
 };
 const adapter=viewer.slice(viewer.indexOf('let restoredViewerRound=false;'),viewer.indexOf("if(document.readyState==='loading')"));
 assert(adapter.includes('function restoreViewerRound()'));
 const context={
  kind,document:doc,window:{P5CloudSession:{
   viewedRound:()=>selected,rememberRound:n=>chosen.push(n),setFollowLive:v=>follow.push(v)
  }},
  localStorage:{getItem:()=>JSON.stringify({viewRound:savedView})},
  $:query=>query.includes('data-value=')||query.includes('data-round=')?target:null,
  schedule:()=>{},Number,JSON
 };
 vm.runInNewContext(adapter+'\nthis.restore=restoreViewerRound;',context);
 context.restore();context.restore();
 return {clicked,follow,chosen};
}
const unified=spectatorScript('unified',17,4);
assert.equal(unified.clicked,1,'Manual reload should restore Unified Round 18');
assert.deepEqual(unified.follow,[false]);
assert.deepEqual(unified.chosen,[17]);
const already=spectatorScript('unified',17,17);
assert.equal(already.clicked,0,'Cloud revision already restored correct round');
const club=spectatorScript('club',18,null);
assert.equal(club.clicked,1,'Club Match must restore transient inspectedRound after reload');
assert.deepEqual(club.chosen,[18]);
console.log('PASS viewer navigation: Round 18 stays after moderator scores while currentRound=Round 5; explicit Latest works; Club history survives reload; moderator data untouched.');
