/* PADEL 5IVE v5.8 — Home Resume only for active/uncompleted tournaments.
 * Evaluate the compiled native renderResume function with fake DOM and session
 * fixtures, without modifying the pre-existing Master UI/engine code.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const source=fs.readFileSync('public/index.html','utf8');
const begin=source.lastIndexOf('  function renderResume(){');
const end=source.indexOf('  function chooseMode(m){',begin);
assert(begin>0&&end>begin&&end-begin<6000,'Home Resume renderer missing or unexpected drift');
const fn=source.slice(begin,end);
assert(fn.includes('p58Finished'),'Missing terminal state filter');
assert(!fn.includes("const archived=parse(KEY_CLUB_ARCH)"),'History archives must not appear on Home Resume');
const history=fs.readFileSync('public/phase57/home-session-history.js','utf8');
assert(history.includes("isFinal(x.s)?'View Results':'Resume'"),'Finished sessions must open from History as View Results');
let cases=0;
function mockNode(tag='button'){
 return {
  tag,className:'',textContent:'',hidden:false,children:[],attrs:{},
  replaceChildren(...parts){this.children=[...parts]},
  appendChild(child){this.children.push(child);return child},
  addEventListener(){},
  setAttribute(k,v){this.attrs[k]=v}
 };
}
function render(u,c,archives=[]){
 const el=mockNode('div'),context={
  document:{getElementById:id=>id==='p54-resume'?el:null,createElement:tag=>mockNode(tag)},
  activeUnified:()=>u,activeClub:()=>c,parse:()=>archives,KEY_CLUB_ARCH:'test-archive',
  clean:x=>x,route:(name)=>'/modes/'+name+'/?intent=resume',
  localStorage:{getItem:()=>null,setItem(){}},window:{P5PreviewLaunch(){}},
  console
 };
 vm.runInNewContext(fn+'\nrenderResume();',context,{filename:'compiled-home-renderResume.js'});
 return el;
}
const champ={stage:'champion',session:'Bintang Utara'};
const progress={stage:'stage1',session:'Friday Signature'};
const clubFinished={stage:'finished',setup:{sessionName:'Club Final'}};
const clubInProgress={stage:'stage2',setup:{sessionName:'Club Game'}};
let el=render(champ,null);assert.equal(el.hidden,true);assert.equal(el.children.length,0);cases++;
el=render({...champ,stage:'completed'},clubFinished);assert.equal(el.hidden,true);cases++;
el=render({...champ,stage:'final'},null);assert.equal(el.hidden,true);cases++;
el=render(progress,null);assert.equal(el.hidden,false);assert.match(el.children[0].textContent,/^RESUME · Friday Signature/);cases++;
el=render(champ,clubInProgress);assert.equal(el.hidden,false);assert.match(el.children[0].textContent,/Club Game/);cases++;
el=render(progress,clubInProgress);assert.equal(el.hidden,false);assert.equal(el.children.length,3);cases++;
el=render(champ,null,[{id:'old',state:{setup:{sessionName:'Finished Archive'},stage:'champion'}}]);
assert.equal(el.hidden,true);cases++;
el=render(null,null,[{id:'old',state:{setup:{sessionName:'Active Archive'},stage:'stage1'}}]);
assert.equal(el.hidden,true);cases++;
const unified=fs.readFileSync('public/modes/unified/index.html','utf8');
assert(unified.includes("function canReshuffle(){return s.stage==='stage1'&&s.currentRound===0&&!s.rounds.some(r=>r.matches.some(m=>m&&m.confirmed));}"),'Arrival must be locked after first score and only in Round 1');cases++;
// PR36 intentionally makes Not Arrived and Sit Out persistent until explicit Arrived/Return.
assert(unified.includes('window.P5Availability=(function()'),'Persistent availability is available to all engines');
assert(unified.includes('function activeIds(s)'),'Scheduling reads the shared eligibility state');
assert(unified.includes('P5Availability.sync(s)'),'Schedule rebuilding must preserve persisted eligibility');
assert(!unified.includes('All registered participants return to normal scheduling from Round 2.'),'Round 2 must not reactivate absent players');cases++;
// Exercise the real built module: a missing player may not reappear after hydrate/next-round sync.
const start=unified.indexOf('window.P5Availability=(function()'),stop=unified.indexOf('/* PADEL 5IVE Phase 5.1',start);
assert(start>=0&&stop>start,'Availability module extraction anchors missing');
const context={window:{}};vm.createContext(context);
vm.runInContext(unified.slice(start,stop),context);
const avail=context.window.P5Availability;
assert(avail&&typeof avail.update==='function'&&typeof avail.activeIds==='function');
const state={roster:[{id:1},{id:2},{id:3},{id:4}],sitout:[],sitoutPending:{},arrival:{1:true,2:true,3:true,4:true}};
avail.hydrate(state);avail.update(state,[2],avail.NOT_ARRIVED);avail.update(state,[3],avail.SIT_OUT);
assert.deepEqual(Array.from(avail.activeIds(state)),[1,4]);
avail.hydrate(state);avail.sync(state);
assert.equal(avail.status(state,2),avail.NOT_ARRIVED,'Not Arrived must persist through round/scheduler synchronization');
assert.equal(avail.status(state,3),avail.SIT_OUT,'Sit Out must persist through round/scheduler synchronization');
avail.update(state,[2],avail.ACTIVE);assert.deepEqual(Array.from(avail.activeIds(state)),[1,2,4],'Explicit Arrived restores eligibility');
avail.update(state,[3],avail.ACTIVE);assert.deepEqual(Array.from(avail.activeIds(state)),[1,2,3,4],'Explicit Return restores eligibility');cases++;
console.log('PASS v5.8 finished-session Resume and Round 1 Arrival/Reshuffle:',cases,'checks.');
