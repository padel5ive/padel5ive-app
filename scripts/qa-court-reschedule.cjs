'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const start=html.indexOf(' function p5ProtectedCourtReschedule('),end=html.indexOf(' function nextRound(',start);
assert(start>=0&&end>start,'PR29 helper missing');
assert(html.includes('</div>\${arrivalPanel}<div class="card p5-v26-session-control">'),'Session Control should be in LEFT column');
assert(html.includes('</div><aside>\${standing(s)}</aside></div>'),'Leaderboard must remain in RIGHT column');
assert(!html.includes("if(s.stage==='stage1'&&!currentDone())return alertModal('Finish Round First','Complete all scores in the active round before changing courts.')"),'Change Court must allow queued changes');
const ctx={};vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const make=(id,a,b,index,court)=>({id:'R'+index+'C'+(court-1),court,teams:[[a],[b]],confirmed:false,score:null,fixture:id});
const roster=Array.from({length:8},(_,i)=>({id:i+1,names:['Player '+(i+1)]}));
const rounds=Array.from({length:27},(_,i)=>({index:i,matches:[
 make('A',1,2,i,1),make('B',3,4,i,2)]}));
rounds[0].matches.forEach(m=>{m.score=[3,2];m.confirmed=true});
rounds[19].matches[0].score=[4,1];rounds[19].matches[0].confirmed=true;
rounds[23].matches[0].score=[3,2];rounds[23].matches[0].confirmed=true;
const protected20=JSON.stringify(rounds[19]),protected24=JSON.stringify(rounds[23]),current=JSON.stringify(rounds[0]);
const state={mode:'fp-americano',currentRound:0,courts:3,roster,rounds,sitout:[]};
ctx.state=state;
const result=vm.runInContext('p5ProtectedCourtReschedule(state,()=>0.5)',ctx);
assert.equal(JSON.stringify(result[0]),current,'current round must never mutate');
assert.equal(JSON.stringify(result[19]),protected20,'partially scored round 20 must remain intact');
assert.equal(JSON.stringify(result[23]),protected24,'partially scored round 24 must remain intact');
const before=rounds.reduce((n,rd)=>n+rd.matches.filter(Boolean).length,0);
const after=result.reduce((n,rd)=>n+rd.matches.filter(Boolean).length,0);
assert.equal(after,before,'No fixture should be dropped or duplicated');
const ids=new Set();
for(const rd of result){const used=new Set();assert(rd.matches.length<=3);
 for(const m of rd.matches){assert(!ids.has(m.id),'Duplicate fixture IDs');ids.add(m.id);
  for(const id of m.teams.flat()){assert(!used.has(id),'Same player twice in round');used.add(id);}
 }
}
const down={...state,courts:1};ctx.down=down;
assert.throws(()=>vm.runInContext('p5ProtectedCourtReschedule(down,()=>0.5)',ctx),/Protected Round/,'Downsizing blocked if scored future round exceeds capacity');
assert(html.includes('if(courtOnly){s.rounds=p5ProtectedCourtReschedule(s,random);}') ,'nextRound uses new rescheduler');
console.log('PASS PR29: protected current R1, partial R20/R24, retained fixture count, unique courts, safe downsize rejection, iPad left Session Control.');
