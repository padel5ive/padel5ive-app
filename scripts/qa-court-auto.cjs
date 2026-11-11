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
console.log('PASS PR29 AUTO: select 2→3 during partial R1 → save last score → automatic future reschedule; R4/R20/R24 preserved; viewRound unchanged; court 3 filled.');
