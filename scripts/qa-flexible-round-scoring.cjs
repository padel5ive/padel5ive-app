'use strict';
/* PADEL 5IVE · v5.8.25 · Americano Flexible Round Scoring regression.
 * Test actual production functions extracted from the shared unified dashboard,
 * without modifying Mexicano scheduling or requiring a browser.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
function extract(from,to){
 const i=html.indexOf(' function '+from+'(');
 const j=html.indexOf(' function '+to+'(',i+1);
 assert(i>=0&&j>i,'Missing function boundary '+from+' → '+to);
 return html.slice(i,j);
}
for(const anchor of [
 'p5-v5825-flex-round-styles','ROUND NAVIGATION',
 'data-p5-status','if(!ko&&!flexibleRoundScoring(s)',
 'data-act="round" data-round="${r+1}">Next Round →',
 's.rounds=s.rounds.slice(0,endRound+1)',
 'if(flexible){for(const rd of s.rounds)'
])assert(html.includes(anchor),'Missing implementation: '+anchor);
const source=[
 extract('flexibleRoundScoring','card'),
 extract('scoreModal','openHistoricalKO'),
 extract('nextRound','showBalance'),
 extract('finish','promptKo')
].join('\n');
new vm.Script(source,{filename:'americano-flexible-functions.js'});
const notices=[];
const ctx={
 console,notices,nextScore:[3,2],s:null,
 $:id=>({value:id==='modal-a'?String(ctx.nextScore[0]):String(ctx.nextScore[1]),focus(){}}),
 findMatch:id=>(ctx.s.rounds[ctx.s.viewRound]?.matches||[]).find(m=>m?.id===id),
 toast:text=>notices.push(text),render(){},save(){return true;},snapshot(){},
 logAction(){},closeMenu(){},applySitoutQueue(){return false;},
 clone:x=>structuredClone(x),undo:[],
 scoreValid:([a,b])=>a>=0&&b>=0&&a+b===5,
 format(){return 'TOTAL OF 5';},
 P5KO:{},
 P5UI:{done:state=>state.rounds.reduce((n,rd)=>n+rd.matches.filter(m=>m?.confirmed).length,0),
  statistics(){return [{id:1}];}},
 P5Structured:{is:state=>state.mode.startsWith('structured-')},
 P5MatchBalance:{summary(){return {gap:0,min:0,max:1};}},
 P5AdvancedRules:{constrained(){return false;}},
 ENG:{'fp-americano':{dynamic:false},'fp-mexicano':{dynamic:true}},
 modal:(kind,title,message,confirm)=>confirm(),
 alertModal:(title,message)=>{throw Error('Unexpected alert: '+title+': '+message)},
 mode(){return 'Americano';}
};
vm.createContext(ctx);
vm.runInContext(source,ctx);
ctx.s={
 mode:'fp-americano',stage:'stage1',currentRound:0,viewRound:23,
 rounds:Array.from({length:24},(_,i)=>({matches:[
  {id:'r'+i+'c1',teams:[[1,2],[3,4]],confirmed:false,score:null},
  {id:'r'+i+'c2',teams:[[5,6],[7,8]],confirmed:false,score:null}
 ]})),
 ui:{modal:null},roster:[],sitout:[],pendingParticipants:[],matchFormat:'total5',ko:null
};
assert.equal(vm.runInContext('flexibleRoundScoring(s)',ctx),true);
assert.equal(vm.runInContext('roundScoreState(s.rounds[23]).status',ctx),'pending');
// Real nextRound handler must browse a precomputed schedule even with zero scores.
ctx.s.viewRound=0;
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.viewRound,1,'Next Round must browse without confirming scores');
assert.equal(ctx.s.currentRound,0,'Browsing must not advance the engine currentRound');
ctx.s.viewRound=19;
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.viewRound,20,'Next Round must browse from Round 20 to 21');
assert.equal(ctx.s.currentRound,0,'Browsing must not regenerate the schedule');
ctx.s.viewRound=23;
assert.throws(()=>vm.runInContext('nextRound()',ctx),/Finish Scheduled Matches First/,'Extension must not skip pending fixtures');
vm.runInContext("scoreModal('r23c1',false)",ctx);
assert.equal(ctx.s.ui.modal.match.id,'r23c1','Round 24 must allow input while currentRound=1');
vm.runInContext('saveScore()',ctx);
assert.equal(vm.runInContext('roundScoreState(s.rounds[23]).status',ctx),'partial');
assert.deepEqual(Array.from(ctx.s.rounds[23].matches[0].score),[3,2]);
ctx.s.viewRound=19;
assert.equal(vm.runInContext('roundScoreState(s.rounds[19]).status',ctx),'pending');
assert.equal(ctx.s.rounds[23].matches[0].confirmed,true,'Round 24 score must persist across navigation');
ctx.s.viewRound=23;
vm.runInContext("scoreModal('r23c1',false)",ctx);
ctx.nextScore=[4,1];
vm.runInContext('saveScore()',ctx);
assert.deepEqual(Array.from(ctx.s.rounds[23].matches[0].score),[4,1]);
assert.equal(vm.runInContext('P5UI.done(s)',ctx),1,'Editing must not double-count confirmed matches');
ctx.s.rounds[23].matches[1].confirmed=true;
assert.equal(vm.runInContext('roundScoreState(s.rounds[23]).status',ctx),'completed');
ctx.s.rounds[23].matches[1].confirmed=false;
vm.runInContext('finish(true)',ctx);
assert.equal(ctx.s.rounds.length,24,'Finish must retain scored Round 24');
assert.deepEqual(Array.from(ctx.s.rounds[23].matches[0].score),[4,1]);
assert.equal(ctx.s.rounds[19].matches[0].skipped,true,'Unscored Round 20 is Not Played');
assert.equal(vm.runInContext('P5UI.done(s)',ctx),1);
assert.equal(ctx.s.stage,'stage1finished');
ctx.s.stage='stage1';ctx.s.mode='fp-mexicano';ctx.s.currentRound=0;ctx.s.viewRound=23;ctx.s.ui.modal=null;
assert.equal(vm.runInContext('flexibleRoundScoring(s)',ctx),false);
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.viewRound,0,'Mexicano must keep its sequential navigation guard');
ctx.s.viewRound=23;
vm.runInContext("scoreModal('r23c1',false)",ctx);
assert.equal(ctx.s.ui.modal,null,'Mexicano future scoring must remain gated');
assert(notices.some(n=>n.includes('Mexicano round')),'Mexicano guard notice missing');
console.log('PASS v5.8.26 flexible Americano: Next browses unscored rounds; R24 3–2 → R20 pending → R24 4–1; safe extension; finish preserves; Mexicano gated.');
