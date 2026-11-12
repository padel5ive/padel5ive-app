'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
function fn(name,next){
 const a=html.indexOf(' function '+name+'('),b=html.indexOf(' function '+next+'(',a+10);
 assert(a>=0&&b>a,'Missing function '+name+'→'+next);
 return html.slice(a,b);
}
const code=fn('p5ProtectedCourtReschedule','nextRound')+fn('p5AutoApplyQueuedCourtChange','resetStage1');
const notices=[],logs=[];
const ctx={s:null,console,structuredClone,
 clone:state=>structuredClone(state),random:()=>0.42,toast:v=>notices.push(v),
 logAction:v=>logs.push(v),save(){return true},render(){},snapshot(){},
 currentDone(){return (ctx.s.rounds[ctx.s.currentRound]?.matches||[]).filter(Boolean).every(m=>m.confirmed);},
 flexibleRoundScoring:s=>s.mode==='fp-americano'||s.mode==='individual-americano'||s.mode==='structured-americano',
 alertModal:(title,msg)=>{throw Error('Unexpected alert '+title+': '+msg)},
 P5EngineRegistry:{validateSchedule(rows,state){
  const seen=new Set();
  for(let i=0;i<rows.length;i++){
   const used=new Set(),cap=i<state.currentRound?5:state.courts;
   for(const m of rows[i].matches||[])if(m){
    assert(!seen.has(m.id),'duplicate ID');seen.add(m.id);
    assert(m.court<=cap,'court capacity violation at R'+(i+1));
    for(const id of m.teams.flat()){assert(!used.has(id),'participant conflict at R'+(i+1));used.add(id);}
   }
  }
 }},
 $:id=>({value:id==='court-count-menu'?'3':id==='modal-a'?'4':'1'}),
 scoreValid:([a,b])=>a+b===5,
 closeMenu(){},undo:[],
 P5UI:{format(){return 'Total of 5'}},
};
vm.createContext(ctx);
// The browser exposes P5Availability globally. This isolated VM must load
// the actual module from the built page before invoking saveScore(), rather
// than omit eligibility protection or replace it with a permissive mock.
const availStart=html.indexOf('window.P5Availability=(function()');
const availEnd=html.indexOf('/* PADEL 5IVE Phase 5.1',availStart);
assert(availStart>=0&&availEnd>availStart,'Built P5Availability module missing');
ctx.window=ctx;
vm.runInContext(html.slice(availStart,availEnd),ctx);
ctx.P5Availability=ctx.window.P5Availability;
assert.equal(typeof ctx.P5Availability.eligibleMatch,'function','Real Availability eligibility is required in isolated scoring test');
vm.runInContext(code,ctx);
assert(!html.includes("||s.pendingCourts)?\`<button type=\"button\" class=\"p5-flex-schedule-advance\""),'Extra button must not appear for court-only change');
assert(html.includes('P5-PR29-AUTO-COURT-APPLY'));
assert(html.includes('s.pendingCourts&&typeof p5AutoApplyQueuedCourtChange==="function"'),'Score confirmation must check queued court');
const make=(r,c,a,b)=>({id:'R'+r+'C'+(c-1),court:c,teams:[[a],[b]],confirmed:false,score:null});
const rounds=Array.from({length:30},(_,i)=>({index:i,matches:[
 make(i,1,(i*4)%16+1,(i*4+1)%16+1),
 make(i,2,(i*4+2)%16+1,(i*4+3)%16+1)]}));
const roster=Array.from({length:16},(_,i)=>({id:i+1,names:['P'+(i+1)]}));
rounds[0].matches[0].confirmed=true;rounds[0].matches[0].score=[3,2];
for(let i=1;i<4;i++)for(const m of rounds[i].matches){m.confirmed=true;m.score=[3,2]}
rounds[19].matches[0].confirmed=true;rounds[19].matches[0].score=[4,1];
rounds[23].matches[0].confirmed=true;rounds[23].matches[0].score=[4,1];
const old20=JSON.stringify(rounds[19]),old24=JSON.stringify(rounds[23]),oldR4=JSON.stringify(rounds[3]);
ctx.s={mode:'fp-americano',stage:'stage1',courts:2,pendingCourts:null,currentRound:0,viewRound:3,rounds,roster,sitout:[],ui:{modal:{type:'courts'}},matchFormat:'total5'};
vm.runInContext('changeCourt()',ctx);
assert.equal(ctx.s.pendingCourts,3,'court selection queues during current partial round');
assert.equal(ctx.s.courts,2,'current partial round protected');
assert.equal(ctx.s.currentRound,0,'current round does not auto-advance until completed');
ctx.s.ui.modal={type:'score',match:ctx.s.rounds[0].matches[1],ko:false};
vm.runInContext(fn('saveScore','openHistoricalKO')+'\nsaveScore();',ctx);
assert.equal(ctx.s.courts,3,'saving final score auto-applies court change · notices: '+JSON.stringify(notices));
assert.equal(ctx.s.pendingCourts,null,'queue clears automatically');
assert.equal(ctx.s.currentRound,4,'scheduler checkpoint moves past 4 completed rounds');
assert.equal(ctx.s.viewRound,3,'PR27 freely selected round is preserved');
assert.equal(JSON.stringify(ctx.s.rounds[3]),oldR4,'previously completed round 4 unchanged');
assert.equal(JSON.stringify(ctx.s.rounds[19]),old20,'partial Round 20 protected');
assert.equal(JSON.stringify(ctx.s.rounds[23]),old24,'partial Round 24 protected');
assert(ctx.s.rounds.slice(4,19).some(x=>x.matches.length===3),'third court populated automatically');
assert(logs.some(x=>x.includes('automatically updated')),'auto action is logged');
// When the currently scheduled round is already complete, Apply Court Changes must update immediately.
const immediate=structuredClone(rounds);
immediate[0].matches[0].confirmed=true;immediate[0].matches[0].score=[3,2];
immediate[0].matches[1].confirmed=true;immediate[0].matches[1].score=[4,1];
ctx.s={mode:'fp-americano',stage:'stage1',courts:2,pendingCourts:null,currentRound:0,viewRound:3,rounds:immediate,roster,sitout:[],ui:{modal:{type:'courts'}},matchFormat:'total5'};
vm.runInContext('changeCourt()',ctx);
assert.equal(ctx.s.courts,3,'already-complete round should apply court change at selection without extra click');
assert.equal(ctx.s.pendingCourts,null);
assert.equal(ctx.s.viewRound,3);
assert.equal(JSON.stringify(ctx.s.rounds[19]),old20);
assert.equal(JSON.stringify(ctx.s.rounds[23]),old24);
// A selected running round with no score is also protected, even if PR27's original checkpoint lags behind.
const pendingRound=structuredClone(rounds);
for(let i=0;i<3;i++)for(const m of pendingRound[i].matches){m.confirmed=true;m.score=[3,2]}
for(const m of pendingRound[3].matches){m.confirmed=false;m.score=null}
const protectedLive=JSON.stringify(pendingRound[3]);
ctx.s={mode:'fp-americano',stage:'stage1',courts:2,pendingCourts:null,currentRound:0,viewRound:3,rounds:pendingRound,roster,sitout:[],ui:{modal:{type:'courts'}},matchFormat:'total5'};
vm.runInContext('changeCourt()',ctx);
assert.equal(ctx.s.courts,3);
assert.equal(JSON.stringify(ctx.s.rounds[3]),protectedLive,'selected unscored live round must not change');
assert(ctx.s.rounds.slice(4,19).some(r=>r.matches.length===3),'future after selected live round uses new capacity');
console.log('PASS PR29 AUTO: select 2→3 during partial R1 → save last score → automatic future reschedule; R4/R20/R24 preserved; viewRound unchanged; court 3 filled.');
