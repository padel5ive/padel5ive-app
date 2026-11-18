/* Lab QA: pure asynchronous Americano scheduler — independent of DOM and storage */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('public/assets/p5-continuous-v1.js','utf8'),context);
const C=context.window.P5Continuous;
assert(C);
function make(n,c,mode='fp-americano'){
 return {mode,courts:c,roster:Array.from({length:n},(_,i)=>({id:i+1,names:['P'+(i+1)]})),rounds:[],sitout:[],currentRound:0,viewRound:0};
}
function playCycle(n,c){
 const s=make(n,c);C.create(s,[]);
 const initial=C.verify(s);assert(initial.valid,'initial dispatch valid');
 let steps=0,seen=new Set();
 while(!C.complete(s)){
  const live=C.active(s);
  assert(live.length<=c,'max concurrency respected');
  assert.equal(new Set(live.flatMap(m=>m.teams.flat())).size,live.length*2,'no simultaneous reuse');
  if(!live.length)throw Error('stalled dispatch: '+JSON.stringify(C.verify(s)));
  const m=live[steps%live.length];
  assert(!seen.has(m.fixtureKey),'opponent repeated before complete cycle: '+m.fixtureKey);
  seen.add(m.fixtureKey);m.score=[3,2];m.confirmed=true;
  C.dispatch(s);
  assert(C.verify(s).valid,'unique opponents and safe courts');
  if(++steps>n*(n-1))throw Error('scheduler never terminates');
 }
 assert.equal(seen.size,n*(n-1)/2);
 assert.equal(C.verify(s).remaining,0);
 assert.equal(C.verify(s).completed,n*(n-1)/2);
 return s;
}
for(const [n,c] of [[3,1],[6,2],[9,3],[12,4],[15,5]]){
 const s=playCycle(n,c);console.log('PASS strict RR',n,'pairs',c,'courts',s.continuous.total,'unique matches');
 if(n===6){const old=s.rounds.length;C.nextCycle(s);assert.equal(s.continuous.cycle,2);assert(C.verify(s).valid);assert(s.rounds.length>old)}
}

/* Showdown-style provisional preview must not mutate the fixture pool. */
const previewFixture=make(6,2);
C.create(previewFixture,[]);
const pendingBefore=JSON.stringify(previewFixture.continuous.queue);
const nextPreview=C.preview(previewFixture,5);
assert(nextPreview.length===5,'Five provisional matchups are shown');
assert(nextPreview.every(x=>typeof x.ready==='boolean'&&x.teams.length===2),'READY/WAIT preview status present');
assert.equal(JSON.stringify(previewFixture.continuous.queue),pendingBefore,'Preview cannot mutate pending fixtures');
const current=C.active(previewFixture);
const involved=new Set(current.flatMap(m=>m.teams.flat()));
const substitute=previewFixture.roster.find(p=>!involved.has(p.id));
assert(substitute,'A resting pair available for one-match substitution');
current[0].substitutions=[{side:0,slot:0,fromId:current[0].teams[0][0],toId:substitute.id,toSlot:0,toName:substitute.names[0]}];
assert(C.busyIds(previewFixture).has(substitute.id),'Substitute cannot be assigned on another court while actively playing');
assert(C.preview(previewFixture,5).every(x=>!x.ready||!x.teams.flat().includes(substitute.id)),'Substitute held out from READY matches');
console.log('PASS READY/WAIT preview is nonmutating and substitution-aware');

const s=make(6,2);C.create(s,[]);
const size=C.active(s).length;s.continuous.paused=true;const previous=s.rounds.length;
C.active(s)[0].confirmed=true;C.dispatch(s);
assert.equal(s.rounds.length,previous,'paused queue must not release fixtures');
s.continuous.paused=false;C.dispatch(s);assert(C.active(s).length>=size-1,'resume dispatch works');
const f=make(8,2,'individual-americano');
const fixture=[{index:0,matches:[{id:'A',teams:[[1,2],[3,4]]},{id:'B',teams:[[5,6],[7,8]]}]},{index:1,matches:[{id:'C',teams:[[1,3],[5,7]]},{id:'D',teams:[[2,4],[6,8]]}]}];
C.create(f,fixture);assert.equal(f.continuous.total,4);
assert(C.verify(f).valid);
console.log('PASS mixed/individual precomputed fixtures, stop/resume, second cycle');


/* Parse all emitted inline JavaScript, not just the engine module.
   This catches non-executing P5UI/score modal scripts before browser UI tests. */
const page=fs.readFileSync('public/modes/unified/index.html','utf8');
const inlineScripts=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
let parsed=0;
for(let i=0;i<inlineScripts.length;i++){
 const body=inlineScripts[i][1];
 if(!body.trim())continue;
 try{new vm.Script(body,{filename:'unified-script-'+i+'.js'});parsed++;}
 catch(err){throw Error('Invalid emitted inline JS script '+i+': '+err.stack);}
}
assert(parsed>3,'All shared app scripts should parse');
console.log('PASS generated UI JavaScript parsed:',parsed,'inline scripts');
