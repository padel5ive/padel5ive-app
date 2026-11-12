/* PADEL 5IVE · Structured Americano late-return / final-court density.
 * True current engine from built Unified HTML; deterministic 9+9/3 court
 * fixture where four participants join after completed Round 4.
 * Tests only non-production lab branch until reviewed.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const asset='p5-structured-late-return-density.js';
assert(html.includes('/assets/'+asset),'Late-return patch missing from deployed Unified page');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
function section(first,next){
 const a=html.indexOf(first),b=html.indexOf(next,a+first.length);
 assert(a>=0&&b>a,'Missing actual scheduling engine '+first);
 vm.runInContext(html.slice(a,b),ctx,{timeout:30000});
}
section('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
section('window.P5Structured=(function','window.P5EngineStructured=');
section('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano');
for(const name of [
 'p5-structured-fairness-lab.js',
 'p5-structured-irregular-lab.js',
 'p5-structured-opponent-diversity-v1.js'
]) vm.runInContext(fs.readFileSync('public/assets/'+name,'utf8'),ctx,{timeout:30000});
const old=ctx.P5Structured;
vm.runInContext(fs.readFileSync('public/assets/'+asset,'utf8'),ctx,{timeout:30000});
const makeRandom=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;
 let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;
};
const groupA=Array.from({length:9},(_,i)=>i+1);
const groupB=Array.from({length:9},(_,i)=>i+10);
const roster=groupA.concat(groupB).map(id=>({id,group:id<=9?'A':'B',names:['Player '+id]}));
const late=[1,3,10,12],active=roster.map(p=>p.id).filter(id=>!late.includes(id));
function fixture(teams,round,idx){
 const m=teams.map(t=>t.slice());return {id:'R'+round+'C'+idx,court:idx+1,teams:m,score:null,confirmed:false};
}
function assertValid(rows,cap){
 for(const r of rows){
  const used=new Set(),courts=new Set();
  assert(r.matches.filter(Boolean).length<=cap);
  for(const m of r.matches.filter(Boolean)){
   assert(m.court>=1&&m.court<=cap&&!courts.has(m.court),'Invalid court number');courts.add(m.court);
   assert(m.teams.length===2);
   for(const team of m.teams){
    assert(team.length===2);
    assert(team[0]<=9&&team[1]>=10,'Structured team must contain one A and one B');
    for(const id of team){assert(!used.has(id),'Player double-booked');used.add(id);}
   }
  }
 }
}
function gameCounts(rows){
 const counts=Object.fromEntries(roster.map(p=>[p.id,0]));
 for(const rd of rows)for(const m of rd.matches.filter(Boolean))for(const id of m.teams.flat())counts[id]++;
 return counts;
}
function gap(rows){const n=Object.values(gameCounts(rows));return Math.max(...n)-Math.min(...n);}
let cases=0,added=0,lateOpportunityCoverage=0;
for(const seed of [1,7,11]){
 const state={mode:'structured-americano',courts:3,sitout:late.slice(),roster,rounds:[],
 currentRound:0,groupConfig:{labels:['Kiri','Kanan']}};
 // Four players are truly unavailable until after Round 4. Only the first four
 // rounds can be confirmed; these historical outcomes are absolutely immutable.
 const originalCycle=old.build(state,makeRandom(seed));
 assertValid(originalCycle,3);assert(originalCycle.length>=4,'Opening roster insufficient');
 const prefix=originalCycle.slice(0,4);
 for(const r of prefix){assert(!r.eligibleIds.some(id=>late.includes(id)));
  for(const m of r.matches){m.confirmed=true;m.score=[3,2];}
 }
 const frozen=JSON.stringify(prefix);
 state.rounds=prefix.concat(originalCycle.slice(4));state.currentRound=3;state.sitout=[];
 const baseline=old.rebuild(state,makeRandom(seed+1000));
 const updated=ctx.P5Structured.rebuild(state,makeRandom(seed+1000));
 assert.equal(JSON.stringify(prefix),frozen,'Confirmed history mutated');
 assertValid(updated,3);
 assert.equal(updated.length,baseline.length,'Existing round count changed');
 assert(updated.every((r,i)=>i===updated.length-1||JSON.stringify(r)===JSON.stringify(baseline[i])),
  'Future rounds before final changed');
 const finalBase=baseline.at(-1),finalNew=updated.at(-1);
 const baseCount=finalBase.matches.filter(Boolean).length;
 const newCount=finalNew.matches.filter(Boolean).length;
 assert(newCount>=baseCount && newCount<=3,'Invalid final-court recovery');
 const expected=Math.min(3,baseCount+Math.floor(Math.min(
    9-new Set(finalBase.matches.flatMap(m=>m.teams.flat()).filter(id=>id<=9)).size,
    9-new Set(finalBase.matches.flatMap(m=>m.teams.flat()).filter(id=>id>=10)).size)/2));
 assert.equal(newCount,expected,'Available final court should not be left unused');
 const before=prefix.concat(baseline),after=prefix.concat(updated);
 const oldGames=gameCounts(before),newGames=gameCounts(after);
 assert(gap(after)<=gap(before),'Late-return Games Played gap worsened');
 for(const id of active.concat(late))assert(newGames[id]>=oldGames[id],'Existing games lost');
 const unmatchedA=groupA.filter(id=>!finalBase.matches.flatMap(m=>m.teams.flat()).includes(id));
 const unmatchedB=groupB.filter(id=>!finalBase.matches.flatMap(m=>m.teams.flat()).includes(id));
 assert(newCount-baseCount<=Math.min(Math.floor(unmatchedA.length/2),Math.floor(unmatchedB.length/2)));
 if(newCount>baseCount){
  added+=newCount-baseCount;
  assert(finalNew.fairnessWarnings.some(w=>w.includes('Late-return court recovery')));
  lateOpportunityCoverage+=late.filter(id=>newGames[id]>oldGames[id]).length;
 }
 cases++;
}
// Ordinary certified full-roster cycles must remain STRICTLY unchanged.
const allActive={mode:'structured-americano',courts:3,sitout:[],roster,rounds:[],currentRound:0,
 groupConfig:{labels:['Kiri','Kanan']}};
const certified=old.build(allActive,makeRandom(99));
const ordinary=ctx.P5Structured.build(allActive,makeRandom(99));
assert.deepEqual(JSON.parse(JSON.stringify(certified)),JSON.parse(JSON.stringify(ordinary)),
 'Certified baseline build must not be affected');
assert.equal(ctx.P5StructuredLateReturnDensity.fillVacantLateReturn(allActive,[],certified,makeRandom(10)),certified,
 'Full-roster cycle MUST retain baseline partner coverage');
// Confirmed future never changed.
const guarded=certified.map(r=>({...r,matches:r.matches.map(m=>({...m}))}));
guarded[0].matches[0].confirmed=true;
assert.equal(ctx.P5StructuredLateReturnDensity.fillVacantLateReturn(allActive,[],guarded,makeRandom(10)),guarded,
 'Any confirmed future is immutable');
const other={...allActive,mode:'structured-mexicano'};
assert.equal(ctx.P5StructuredLateReturnDensity.fillVacantLateReturn(other,[],guarded,makeRandom(10)),guarded,
 'Mexicano unaffected');
assert(added>0,'Reproduction must generate at least one missing court and fill it');
console.log(JSON.stringify({status:'PASS',testedSeeds:cases,extraMatches:added,
 lateParticipantsGivenAdditionalMatches:lateOpportunityCoverage,
 immutableHistory:true,certifiedCycleUntouched:true,mexicanoUntouched:true}));
