'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const path of ['/assets/p5-structured-fairness-lab.js','/assets/p5-structured-mexicano-diversity-lab.js'])assert(html.includes(path),'Missing integrated script '+path);
assert.equal(html.split('<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->').length-1,1,'Duplicate integration marker');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
function runBetween(from,to){const a=html.indexOf(from),b=html.indexOf(to,a+from.length);assert(a>=0&&b>a,from+' source missing');vm.runInContext(html.slice(a,b),ctx,{timeout:30000});}
runBetween('window.P5HistorySmart=(function','/* PADEL 5IVE Phase 5.0 · OPTIONAL ADVANCED RULES');
runBetween('window.P5AdvancedRules=(function','/* Phase 5.0: isolated Mexicano');
runBetween('window.P5Structured=(function','window.P5EngineStructured=');
runBetween('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
runBetween('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano');
runBetween('window.P5StructuredMX534=(function','/* PADEL 5IVE 5.4.13.5');
const nativeMX=ctx.P5StructuredMX.next;
vm.runInContext(fs.readFileSync('public/assets/p5-structured-fairness-lab.js','utf8'),ctx,{timeout:30000});
vm.runInContext(fs.readFileSync('public/assets/p5-structured-mexicano-diversity-lab.js','utf8'),ctx,{timeout:30000});
const rnd=(seed)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return ((x^x>>>14)>>>0)/4294967296;};
const teamKey=(a,b)=>a<b?a+':'+b:b+':'+a;
const create=(mode)=>({mode,courts:3,groupConfig:{labels:['Left','Right']},sitout:[],rounds:[],roster:Array.from({length:18},(_,i)=>({id:i+1,names:['P'+(i+1)],group:i<9?'A':'B'}))});
function audit(rounds,roster){
 const games=Object.fromEntries(roster.map(p=>[p.id,0])),rec=Object.fromEntries(roster.map(p=>[p.id,[]]));let rest2=0,play3=0,partner={},opp={};
 for(const [ri,rd] of rounds.entries()){
  const seen=new Set();
  for(const m of rd.matches){for(const team of m.teams){
   assert.equal(team.length,2);
   assert.equal(roster.find(p=>p.id===team[0]).group,'A');
   assert.equal(roster.find(p=>p.id===team[1]).group,'B');
   for(const id of team){assert(!seen.has(id),'Player double booked');seen.add(id);}
   const k=teamKey(...team);partner[k]=(partner[k]||0)+1;
  }
   for(const x of m.teams[0])for(const y of m.teams[1]){const k=teamKey(x,y);opp[k]=(opp[k]||0)+1;}
  }
  for(const p of roster){const id=p.id,on=seen.has(id),seq=rec[id];if(!on&&seq.at(-1)===false)rest2++;if(on&&seq.at(-1)===true&&seq.at(-2)===true)play3++;seq.push(on);if(on)games[id]++;}
  if(ri<9){const vals=Object.values(games);assert(Math.max(...vals)-Math.min(...vals)<=1,'Running match-count gap >1');if((ri+1)%3===0)assert.equal(Math.max(...vals)-Math.min(...vals),0,'3-round fairness checkpoint fails');}
 }
 return {games,rest2,play3,partnerRepeats:Object.values(partner).reduce((s,x)=>s+x-1,0),opponentRepeats:Object.values(opp).reduce((s,x)=>s+x-1,0),uniquePartners:Object.keys(partner).length};
}
let amerPass=0,mexPass=0,improved=0;
for(let seed=1;seed<=20;seed++){
 const s=create('structured-americano');const rs=ctx.P5Structured.build(s,rnd(seed));assert.equal(rs.length,14);assert(rs.every(r=>r.structuredFairCycleCertified));const a=audit(rs,s.roster);
 assert.equal(a.uniquePartners,81);assert.equal(a.partnerRepeats,1);const after9=audit(rs.slice(0,9),s.roster);assert(Object.values(after9.games).every(x=>x===6));assert.equal(after9.rest2,0);amerPass++;
 const m=create('structured-mexicano'),rank=m.roster.map(p=>({id:p.id}));
 for(let ri=0;ri<9;ri++){
  const prior=JSON.stringify(m.rounds),base=nativeMX(m,rank,rnd(seed*100+ri)),changed=ctx.P5StructuredMX.next(m,rank,rnd(seed*100+ri));
  assert.equal(JSON.stringify(m.rounds),prior,'Past rounds mutated');
  assert.deepEqual(changed.matches.flatMap(x=>x.teams.flat()).sort((a,b)=>a-b),base.matches.flatMap(x=>x.teams.flat()).sort((a,b)=>a-b));
  const h=ctx.P5StructuredMX.confirmedHistory(m.rounds),ranks={};for(let i=1;i<=18;i++)ranks[i]=(i-1)%9;
  const before=ctx.P5StructuredMXDiversityLab.metrics(base.matches,h,ranks),after=ctx.P5StructuredMXDiversityLab.metrics(changed.matches,h,ranks);
  assert(after.opponentRepeat<=before.opponentRepeat&&after.partnerRepeat<=before.partnerRepeat&&after.fixtureRepeat<=before.fixtureRepeat,'Mexicano diversity regression');
  assert(after.rankPenalty<=before.rankPenalty+420,'Mexicano ranking penalty regression');
  if(after.opponentRepeat<before.opponentRepeat||after.partnerRepeat<before.partnerRepeat)improved++;
  changed.matches.forEach(x=>{x.confirmed=true;x.score=[2,2];});m.rounds.push(changed);
 }
 const q=audit(m.rounds,m.roster);assert(Object.values(q.games).every(x=>x===6));assert.equal(q.play3,0);assert.equal(q.rest2,0);mexPass++;
}

let dynamicCases=0,dynamicRounds=0;
for(let seed=1;seed<=4;seed++){
 const state=create('structured-mexicano'),points=Object.fromEntries(state.roster.map(p=>[p.id,0]));
 for(let ri=0;ri<12;ri++){
  const rankings=state.roster.map(p=>({id:p.id,points:points[p.id]||0})).sort((a,b)=>b.points-a.points||a.id-b.id);
  const before=JSON.stringify(state.rounds),seedValue=10000+seed*100+ri;
  const baseline=nativeMX(state,rankings,rnd(seedValue)),enhanced=ctx.P5StructuredMX.next(state,rankings,rnd(seedValue));
  assert.equal(JSON.stringify(state.rounds),before,'Mexicano touched confirmed history after a roster change');
  const originalIds=baseline.matches.flatMap(m=>m.teams.flat()).sort((a,b)=>a-b);
  const optimizedIds=enhanced.matches.flatMap(m=>m.teams.flat()).sort((a,b)=>a-b);
  assert.deepEqual(optimizedIds,originalIds,'Mexicano changed selected players or rest when optimizing opponents');
  const seen=new Set();
  for(const m of enhanced.matches){
   assert(m.court>=1&&m.court<=state.courts,'Invalid Mexicano court');
   for(const team of m.teams){
    assert.equal(state.roster.find(p=>p.id===team[0]).group,'A');
    assert.equal(state.roster.find(p=>p.id===team[1]).group,'B');
    for(const id of team){assert(!state.sitout.includes(id),'Sit Out player scheduled');assert(!seen.has(id),'Mexicano double booking');seen.add(id);}
   }
   m.score=ri%2?[2,3]:[3,2];m.confirmed=true;
   for(const id of m.teams[0])points[id]=(points[id]||0)+m.score[0];
   for(const id of m.teams[1])points[id]=(points[id]||0)+m.score[1];
  }
  state.rounds.push(enhanced);dynamicRounds++;
  if(ri===2)state.sitout=[9,18];
  if(ri===5){state.sitout=[];state.roster.push({id:19,group:'A',names:['Late A']},{id:20,group:'B',names:['Late B']});state.courts=4;}
 }
 dynamicCases++;
}
console.log(JSON.stringify({integration:'PASS',americanSeeds:amerPass,mexicanSeeds:mexPass,mexicanoRoundsImproved:improved,dynamicRosterMexicanoCases:dynamicCases,dynamicRounds:dynamicRounds}));


// PR34 release acceptance: all certified court configurations, plus flexible
// fixed-partner/coach/sit-out lifecycle. Actual scheduling source is loaded above.
let extendedAcceptanceCases=0;
const makeStructured=(perGroup,courts)=>({
 mode:'structured-americano',courts,sitout:[],rounds:[],currentRound:0,
 groupConfig:{labels:['Left','Right']},
 roster:Array.from({length:perGroup*2},(_,i)=>({
   id:i+1,group:i<perGroup?'A':'B',names:['P'+(i+1)]
 }))
});
for(const [perGroup,courts,seeds] of [[3,1,3],[9,3,3],[12,4,3],[15,5,2]]){
 for(let seed=1;seed<=seeds;seed++){
  const state=makeStructured(perGroup,courts);
  const started=Date.now(),rounds=ctx.P5Structured.build(state,rnd(seed+4000));
  assert(rounds.every(r=>r.structuredFairCycleCertified),'Certified roster returned fallback schedule');
  const expected=Math.floor(perGroup/2)*3+(perGroup%2?2:0);
  assert.equal(rounds.length,expected,'Complete group cycle length mismatch');
  const counts=Object.fromEntries(state.roster.map(p=>[p.id,0]));
  const partners=new Map(),playedHistory=Object.fromEntries(state.roster.map(p=>[p.id,[]]));
  for(const [i,r] of rounds.entries()){
   const used=new Set(),courtsUsed=new Set();
   assert(r.matches.length>0&&r.matches.length<=courts,'Invalid court density');
   for(const m of r.matches){
    assert(m.court>=1&&m.court<=courts&&!courtsUsed.has(m.court),'Court collision');
    courtsUsed.add(m.court);
    assert.equal(m.teams.length,2,'Not a doubles fixture');
    for(const team of m.teams){
     assert.equal(team.length,2,'Not a doubles team');
     assert(team[0]<=perGroup&&team[1]>perGroup,'Structured pairing group violation');
     const k=teamKey(...team);partners.set(k,(partners.get(k)||0)+1);
     for(const id of team){assert(!used.has(id),'Player booked twice');used.add(id);counts[id]++;}
    }
   }
   for(const id of Object.keys(counts)){
    const playing=used.has(Number(id)),history=playedHistory[id];
    if(perGroup===9&&i<9&&!playing&&history.at(-1)===false)throw Error('9+9 double rest in opening nine rounds');
    history.push(playing);
   }
   const games=Object.values(counts),spread=Math.max(...games)-Math.min(...games);
   assert(spread<=1,'Certified running games-played spread >1');
   if((i+1)%3===0&&i<Math.floor(perGroup/2)*3)
    assert.equal(spread,0,'Three-round games-played fairness checkpoint missed');
  }
  assert.equal(partners.size,perGroup*perGroup,'Incomplete partner coverage');
  const repeated=[...partners.values()].reduce((sum,n)=>sum+n-1,0);
  assert.equal(repeated,perGroup%2,'Excess complete-cycle partner repeats');
  if(perGroup===9){
   for(const games of Object.values(playedHistory))assert.equal(games.slice(0,9).filter(Boolean).length,6);
  }
  extendedAcceptanceCases++;
 }
}

// Flexible Pairing is separate from Structured Pairing. Its existing actual-source
// scheduler must retain hard Coach/Fixed Partner constraints, even after Sit Out,
// Return, and court-capacity changes while preserving confirmed historical rounds.
let advancedRuleCases=0;
for(const mode of ['individual-americano','individual-mexicano']){
 for(const seed of [1,2]){
  const state={
   mode,courts:3,sitout:[],rounds:[],currentRound:0,
   roster:Array.from({length:18},(_,i)=>({id:i+1,names:['P'+(i+1)]})),
   rules:{fixedEnabled:true,pairs:[[1,2],[3,4]],coachEnabled:true,coachIds:[5]}
  };
  assert(ctx.P5AdvancedRules.validate(state));
  const random=rnd(9000+seed+(mode==='individual-mexicano'?500:0));
  let preserved=[];
  for(let ri=0;ri<7;ri++){
   if(ri===3)state.sitout=[1,2];
   if(ri===4)state.sitout=[];
   if(ri===5)state.courts=2;
   const before=JSON.stringify(state.rounds);
   const standings=state.roster.map((p,i)=>({id:p.id,points:(ri*7+i*3)%19}));
   const round=ctx.P5AdvancedRules.makeRound(state,state.rounds,random,standings);
   assert.equal(JSON.stringify(state.rounds),before,'Scheduler mutated prior confirmed rounds');
   const on=new Set(),teamByPlayer=new Map();
   assert(round.matches.length<=state.courts,'Flexible court overcapacity');
   for(const match of round.matches){
    assert.equal(match.teams.length,2);
    for(const team of match.teams){
     assert.equal(team.length,2);
     for(const id of team){
      assert(!on.has(id),'Flexible duplicate booking');
      assert(!state.sitout.includes(id),'Sit Out participant scheduled');
      on.add(id);teamByPlayer.set(id,team.slice());
     }
    }
    match.score=[3,2];match.confirmed=true;
   }
   assert(on.has(5),'Active Coach must participate every round');
   for(const [a,b] of [[1,2],[3,4]]){
    assert.equal(on.has(a),on.has(b),'Fixed partners must play or rest together');
    if(on.has(a))assert(teamByPlayer.get(a).includes(b),'Fixed partners split across teams');
   }
   state.rounds.push(round);
   preserved.push(JSON.stringify(round));
  }
  for(let ri=0;ri<state.rounds.length;ri++)
   assert.equal(JSON.stringify(state.rounds[ri]),preserved[ri],'Historical score/fixture modified');
  // Invalid half-sitout is an explicit error, never a silent broken fixed team.
  state.sitout=[1];
  assert.throws(()=>ctx.P5AdvancedRules.makeRound(state,state.rounds,random),/Sit Out or Return together/);
  state.sitout=[];
  state.rules.coachIds=[1];
  assert.throws(()=>ctx.P5AdvancedRules.validate(state),/coach cannot also be a Fixed Partner/);
  advancedRuleCases++;
 }
}
console.log(JSON.stringify({releaseAcceptance:'PASS',
 certifiedCycleConfigurations:extendedAcceptanceCases,
 flexibleCoachAndFixedPartnerCases:advancedRuleCases,
 historyImmutable:true,sitoutReturnAndCourtChange:true}));
