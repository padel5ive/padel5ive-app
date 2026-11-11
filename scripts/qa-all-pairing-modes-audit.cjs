'use strict';
// PADEL 5IVE PR34: actual-source cross-mode matchmaking audit.
// Never loads production user data, edits dashboard state or modifies production.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const env={};env.window=env;vm.createContext(env);
function execute(source,label){assert(source&&source.trim(),label+' source missing');vm.runInContext(source,env,{timeout:30000,filename:label});}
function until(first,last){const i=html.indexOf(first),j=html.indexOf(last,i+first.length);assert(i>=0&&j>i,'Missing '+first);execute(html.slice(i,j),first);}
function scriptAt(needle){const i=html.indexOf(needle);assert(i>=0,'Missing '+needle);const open=html.lastIndexOf('<script',i);const from=html.indexOf('>',open)+1;const end=html.indexOf('</script>',i);assert(open>=0&&end>i,'Missing script around '+needle);execute(html.slice(from,end),needle);}
scriptAt('const rr9=');
scriptAt('window.P5EngineFP=(function');
scriptAt('window.P5EngineMX=(function');
scriptAt('window.P5EngineIndividual=(function');
scriptAt('window.P5Recovery=(function');
// Production also loads this defer asset. Without it, 18/3 and 30/5
// tests would silently exercise the fallback instead of the live fair-cycle.
execute(fs.readFileSync('public/assets/p5-fair-cycle-v5515.js','utf8'),'P5FairCycle production asset');
until('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
until('window.P5HistorySmart=(function','/* PADEL 5IVE Phase 5.0 · OPTIONAL ADVANCED RULES');
until('window.P5AdvancedRules=(function','/* Phase 5.0: isolated Mexicano');
until('window.P5EngineIndividualMX=(function','/* PADEL 5IVE Phase 5.1');
until('window.P5Structured=(function','/* PADEL 5IVE Phase 5.2');
until('window.P5StructuredMX=(function','/* PADEL 5IVE Phase 5.3.4');
until('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano');
until('window.P5StructuredMX534=(function','/* PADEL 5IVE 5.4.13.5');
until('window.P5CourtRotation=(function','window.P5EngineRegistry=');
const registryStart=html.indexOf('window.P5EngineRegistry=(function');
const registryEnd=html.indexOf('})();',registryStart);
execute(html.slice(registryStart,registryEnd+5),'P5EngineRegistry');
for(const name of ['p5-structured-fairness-lab.js','p5-structured-irregular-lab.js','p5-structured-mexicano-diversity-lab.js'])
 execute(fs.readFileSync('public/assets/'+name,'utf8'),name);
const preCoachNativeCreate=env.P5HistorySmart.create;
execute(fs.readFileSync('public/assets/p5-coach-opponent-diversity-lab.js','utf8'),'Coach opponent diversity adapter');
const modes=env.P5EngineRegistry.modes(),expectedIds=[
 'fp-americano','fp-mexicano','individual-americano','individual-mexicano','structured-americano','structured-mexicano'
];
assert.deepEqual(Array.from(modes,x=>x.id),expectedIds,'Expected six actual engines for eight conceptual styles');
const rand=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
const fixture=(a,b)=>[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
function make(mode,players,courts,rules={}){
 return {mode,courts,stage:'stage1',currentRound:0,sitout:[],rounds:[],groupConfig:{labels:['Left','Right']},
 rules:{fixedEnabled:false,coachEnabled:false,pairs:[],coachIds:[],...rules},
 roster:Array.from({length:players},(_,i)=>({id:i+1,group:i<players/2?'A':'B',names:['Player '+(i+1)]}))};
}
function metrics(s,rounds=s.rounds){
 const idSet=new Set(s.roster.map(x=>x.id)),gp=Object.fromEntries([...idSet].map(id=>[id,0]));
 const partners={},opponents={},fixtures={},appearance=Object.fromEntries([...idSet].map(id=>[id,[]]));
 let maxGap=0,repeatOpp=0,repeatPartner=0,repeatFixture=0,consecutiveRest=0,triplePlay=0;
 for(const [r,round] of rounds.entries()){
  assert(round&&Array.isArray(round.matches),'Missing round matches '+r);
  const playing=new Set(),occupiedCourts=new Set();
  assert(round.matches.filter(Boolean).length<=s.courts,'Court capacity exceeded');
  for(const m of round.matches.filter(Boolean)){
   assert(Number.isInteger(m.court)&&m.court>=1&&m.court<=s.courts,'Invalid court');
   assert(!occupiedCourts.has(m.court),'Court booked twice');occupiedCourts.add(m.court);
   assert(m.teams.length===2,'Not a two-sided match');
   const teamLen=s.mode.startsWith('fp-')?1:2;
   assert(m.teams.every(t=>t.length===teamLen),'Incorrect pairing-team size');
   if(s.mode.startsWith('structured-'))for(const t of m.teams){
    assert(s.roster.find(p=>p.id===t[0]).group==='A','Left group missing');
    assert(s.roster.find(p=>p.id===t[1]).group==='B','Right group missing');
   }
   const f=fixture(...m.teams);if(fixtures[f])repeatFixture++;fixtures[f]=(fixtures[f]||0)+1;
   for(const t of m.teams){
    if(t.length===2){const k=key(...t);if(partners[k])repeatPartner++;partners[k]=(partners[k]||0)+1;}
    for(const id of t){
     assert(idSet.has(id),'Unknown participant');
     assert(!playing.has(id),'Duplicate player in a round');
     playing.add(id);gp[id]++;
    }
   }
   for(const a of m.teams[0])for(const b of m.teams[1]){const k=key(a,b);if(opponents[k])repeatOpp++;opponents[k]=(opponents[k]||0)+1;}
  }
  const eligible=round.eligibleIds||[...idSet];
  for(const id of idSet){
   const seq=appearance[id],on=playing.has(id);
   if(eligible.includes(id)){
    if(!on&&seq.at(-1)===false)consecutiveRest++;
    if(on&&seq.at(-1)===true&&seq.at(-2)===true)triplePlay++;
    seq.push(on);
   }else seq.push(null);
  }
  const activeCounts=eligible.map(id=>gp[id]);
  if(activeCounts.length)maxGap=Math.max(maxGap,Math.max(...activeCounts)-Math.min(...activeCounts));
 }
 return {gp,partners,opponents,fixtures,maxGap,repeatOpp,repeatPartner,repeatFixture,consecutiveRest,triplePlay};
}
function score(round,seed){
 for(const m of round.matches.filter(Boolean)){
  assert(!m.confirmed&&m.score==null,'Generated round must be unconfirmed');
  m.score=seed%2?[3,2]:[2,3];m.confirmed=true;
 }
}
let completedFP=0,completedNormal=0,normalPartnerChecks=0;
for(const [n,c] of [[3,1],[6,2],[8,3],[9,3],[12,3],[12,4],[15,5]]){
 for(const seed of [5,19]){
  const s=make('fp-americano',n,c),rounds=env.P5EngineFP.build(s.roster.map(p=>p.id),c,rand(seed));
  assert(rounds.length,'Fixed Partner Americano failed');
  const m=metrics(s,rounds),want=n*(n-1)/2;
  assert.equal(Object.keys(m.fixtures).length,want,'Fixed Partner lost RR fixture');
  assert.equal(m.repeatFixture,0,'Repeated fixed fixture before complete RR');
  assert(Object.values(m.gp).every(x=>x===n-1),'Fixed RR games played differs');
  completedFP++;
 }
}
for(const [n,c] of [[8,2],[12,1],[12,2],[12,3],[16,2]]){
 for(const seed of [3,17]){
  const s=make('individual-americano',n,c),rows=env.P5EngineIndividual.build(s.roster.map(p=>p.id),c,rand(seed));
  const m=metrics(s,rows),want=n*(n-1)/2;
  assert.equal(Object.keys(m.partners).length,want,'Normal Americano missing teammate');
  assert.equal(m.repeatPartner,0,'Normal Americano repeating teammate in full cycle');
  assert(Object.values(m.gp).every(x=>x>=1),'Normal Americano never scheduled a player');
  if(n===12&&c===2){assert.equal(rows.length,17,'12 players/2 courts must be 17 rounds');
   assert.equal(m.consecutiveRest,0,'12/2 canonical has double-rest regression');
   assert.equal(m.triplePlay,0,'12/2 canonical has triple-play regression');
  }
  completedNormal++;normalPartnerChecks+=want;
 }
}

// Real production 6-players-per-court fair cycles, including the full 5-court case.
let certifiedNormalCycles=0,certifiedNormalPlayers=0;
for(const [n,c] of [[6,1],[18,3],[24,4],[30,5]]){
 const s=make('individual-americano',n,c),rounds=env.P5EngineIndividual.build(s.roster.map(p=>p.id),c,rand(500+n));
 const a=metrics(s,rounds),want=n*(n-1)/2;
 assert.equal(Object.keys(a.partners).length,want,'Production fair-cycle missing teammate: '+n+'/'+c);
 assert.equal(a.repeatPartner,n/2%2,'Production fair-cycle repeat count invalid: '+n+'/'+c);
 assert(a.maxGap<=1,'Production fair-cycle running G gap exceeded one: '+n+'/'+c);
 for(const id of Object.keys(a.gp))assert(a.gp[id]>0,'Player never played');
 certifiedNormalCycles++;certifiedNormalPlayers+=n;
}
// Flexible Americano: dynamic hard-constraint changes are already exercised
// with score confirmation and historic invariance in qa-structured-pairing-lab.
let mexicanModes=0,mexicanRounds=0,maxDynamicGap=0;
for(const [mode,rosters] of [
 ['fp-mexicano',[[3,1],[6,2],[9,3],[12,4],[15,5]]],
 ['individual-mexicano',[[8,2],[12,2],[16,3],[20,4]]],
 ['structured-mexicano',[[6,1],[12,2],[18,3],[24,4],[30,5]]]
]){
 for(const [n,c] of rosters){
  for(const seed of n>=24?[13]:[13,29]){
   const s=make(mode,n,c),g=Object.fromEntries(s.roster.map(p=>[p.id,0]));
   let maxObserved=0,rounds=n>=24?3:9;
   for(let r=0;r<rounds;r++){
    const leaderboard=s.roster.slice().sort((a,b)=>g[b.id]-g[a.id]||a.id-b.id).map(p=>({id:p.id,points:g[p.id]}));
    const old=JSON.stringify(s.rounds);
    const next=env.P5EngineRegistry.engine(mode).next(s,leaderboard,rand(seed*100+r));
    assert.equal(JSON.stringify(s.rounds),old,'Dynamic scheduler mutated prior rounds');
    assert(next.matches.length>0,'Round produced zero matches');
    assert(next.matches.length<=c,'Dynamic overcapacity');
    if(mode==='structured-mexicano')env.P5Structured.verifyRound(s,next);
    metrics(s,[next]); // checks court IDs, team sizes, group integrity, no double booking
    const pool=new Set(s.roster.map(p=>p.id).filter(id=>!s.sitout.includes(id)));
    for(const m of next.matches)for(const id of m.teams.flat())assert(pool.has(id),'Sit Out player scheduled');
    score(next,r+seed);s.rounds.push(next);
    for(const m of next.matches)for(const team of m.teams){
     for(const id of team)g[id]+=(team===m.teams[0]?m.score[0]:m.score[1]);
    }
    const snap=metrics(s);
    maxObserved=Math.max(maxObserved,snap.maxGap);
    mexicanRounds++;
   }
   maxDynamicGap=Math.max(maxDynamicGap,maxObserved);
   mexicanModes++;
  }
 }
}



// Historical production incidents: Fixed Partner mid-session roster/court growth.
// Old confirmed fixtures are immutable; future RR covers every opponent exactly
// once, and new pairs must not all play only each other.
let fpRecoveryIncidents=0;
for(const incident of [
 {initial:6,beginCourts:2,added:3,endCourts:3,playedRounds:2},
 {initial:9,beginCourts:3,added:3,endCourts:4,playedRounds:2}
]){
 const n=incident.initial,c=incident.beginCourts,s=make('fp-americano',n,c);
 s.rounds=env.P5EngineFP.build(s.roster.map(p=>p.id),c,rand(355+n));
 for(let i=0;i<incident.playedRounds;i++)score(s.rounds[i],i+1);
 s.currentRound=incident.playedRounds-1;
 const prefix=s.rounds.slice(0,incident.playedRounds),locked=JSON.stringify(prefix);
 for(let i=0;i<incident.added;i++)s.roster.push({id:n+i+1,names:['Late Pair '+(i+1)]});
 s.courts=incident.endCourts;
 const pending=env.P5Recovery.rebuild(s,rand(555+n));
 assert(pending.length,'No matches generated after FP mid-session join');
 assert.equal(JSON.stringify(prefix),locked,'Fixed Partner recovery mutated confirmed scores');
 const all=prefix.concat(pending),res=metrics(s,all),target=(n+incident.added)*(n+incident.added-1)/2;
 assert.equal(Object.keys(res.fixtures).length,target,'Fixed Partner recovery lost opponent coverage');
 assert.equal(res.repeatFixture,0,'Fixed Partner recovery repeated an old opponent pair');
 const matchIds=all.flatMap(rd=>rd.matches.filter(Boolean).map(m=>m.id));
 assert.equal(new Set(matchIds).size,matchIds.length,'Fixed Partner recovery duplicated match IDs');
 fpRecoveryIncidents++;
}

// Diversity telemetry: a Coach is required every eligible round, but should
// encounter a broad mix of opponents instead of repeatedly facing one player.
// Metrics intentionally reported without pretending zero repetition is possible.
let coachDiversityCases=0,worstCoachOpponentEncounter=0,minCoachUniqueOpponents=Infinity;
let coachPairingImproved=0;
for(const mode of ['individual-americano','individual-mexicano']){
 for(const seed of [41,97,133]){
  const s=make(mode,18,3,{fixedEnabled:true,pairs:[[2,3]],coachEnabled:true,coachIds:[1]});
  const opponents=new Map(),randSeed=rand(seed+(mode==='individual-mexicano'?2000:0));
  for(let r=0;r<10;r++){
   const rankings=s.roster.map((p,i)=>({id:p.id,points:(i*7+r*3)%23}));
   const before=JSON.stringify(s.rounds);
   const source=preCoachNativeCreate(s,s.rounds,rand(seed*10000+r+777),rankings);
   const enhanced=env.P5HistorySmart.create(s,s.rounds,rand(seed*10000+r+777),rankings);
   const partnerSet=rd=>rd.matches.filter(Boolean).flatMap(m=>m.teams.map(t=>key(...t))).sort().join('|');
   const played=rd=>rd.matches.filter(Boolean).flatMap(m=>m.teams.flat()).sort((a,b)=>a-b).join(',');
   assert.equal(partnerSet(enhanced),partnerSet(source),'Coach optimizer changed historical teammate assignment');
   assert.equal(played(enhanced),played(source),'Coach optimizer changed selected players/rests');
   assert.equal(JSON.stringify(s.rounds),before,'Coach optimizer rewrote old scores');
   if(enhanced.coachOpponentDiversityOptimized)coachPairingImproved++;
   const rd=env.P5AdvancedRules.makeRound(s,s.rounds,randSeed,rankings);
   const coachMatch=rd.matches.find(m=>m.teams.flat().includes(1));
   assert(coachMatch,'Coach missed required active round');
   const coachTeam=coachMatch.teams.find(team=>team.includes(1));
   const opponentsNow=coachMatch.teams.find(team=>team!==coachTeam);
   for(const id of opponentsNow)opponents.set(id,(opponents.get(id)||0)+1);
   score(rd,seed+r);s.rounds.push(rd);
  }
  const values=[...opponents.values()];
  worstCoachOpponentEncounter=Math.max(worstCoachOpponentEncounter,Math.max(...values));
  minCoachUniqueOpponents=Math.min(minCoachUniqueOpponents,opponents.size);
  coachDiversityCases++;
 }
}
// Detect accidental first-round de-randomization of Mexicano when no ranks
// or confirmed results exist. Product review can use draw-variety telemetry.
const firstRoundDraws=new Set();
for(let seed=1;seed<=10;seed++){
 const s=make('fp-mexicano',10,5),rank=s.roster.map(p=>({id:p.id}));
 const rd=env.P5EngineMX.next(s,rank,rand(seed));
 firstRoundDraws.add(rd.matches.map(m=>key(m.teams[0][0],m.teams[1][0])).sort().join('|'));
}
assert(firstRoundDraws.size>=7,'Fixed Mexicano opening draw lacks meaningful shuffle variety');


const individualOpeningDraws=new Set();
for(let seed=1;seed<=10;seed++){
 const s=make('individual-mexicano',12,2);
 const rankings=s.roster.map(p=>({id:p.id}));
 const draw=env.P5EngineIndividualMX.next(s,rankings,rand(seed));
 individualOpeningDraws.add(draw.matches.map(m=>fixture(...m.teams)).sort().join('|'));
 assert(draw.matches.every(m=>!m.confirmed&&m.score===null),'Initial Mexicano score not blank');
}
assert(individualOpeningDraws.size>=7,'Individual Mexicano opening remains dependent on registration rank');

// Stage 2 regression from full audit: Sit Out must be excluded from both the
// qualification UI and the canonical KO start API, not just initial selection.
scriptAt('window.P5KO=(function');
execute(fs.readFileSync('public/assets/p5-ko-qualification-sitout-guard.js','utf8'),'KO Sit Out external guard');
execute(fs.readFileSync('public/assets/p5-mexicano-individual-opening-lab.js','utf8'),'Mexicano Individual first draw adapter');
env.P5UI={statistics:s=>s.roster.map(p=>({id:p.id}))};
let koSitoutGuards=0;
for(const mode of ['fp-americano','fp-mexicano','individual-americano','individual-mexicano']){
 const s=make(mode,mode.startsWith('fp-')?8:12,2);
 s.sitout=[s.roster.at(-1).id];
 s.koMatchFormat='first4';s.koFinalFormat='first6';
 assert.throws(()=>env.P5KO.start(s,'single',s.roster.map(p=>p.id)),
  /Sit Out participants cannot enter Knockout/,'KO incorrectly admitted Sit Out: '+mode);
 assert.equal(s.ko,undefined,'Rejected KO must not mutate Stage 2 state');
 koSitoutGuards++;
}
assert(html.includes("if(enable&&group.some(pid=>(s.sitout||[]).includes(pid)))"),
 'Qualification UI does not block manual Sit Out selection');

// Structured group validation rejects unequal A/B before next-round scheduling.
const bad=make('structured-mexicano',12,2);bad.sitout=[1];
assert.throws(()=>env.P5Structured.validate(bad),/Balance both groups/);
const advanced=make('individual-americano',12,2,
 {fixedEnabled:true,pairs:[[1,2],[3,4]],coachEnabled:true,coachIds:[5]});
env.P5AdvancedRules.validate(advanced);
advanced.rules.pairs=[[1,2],[2,3]];
assert.throws(()=>env.P5AdvancedRules.validate(advanced),/disjoint pairs/);
advanced.rules.pairs=[[1,2]];
advanced.rules.coachIds=[1];
assert.throws(()=>env.P5AdvancedRules.validate(advanced),/coach cannot also be a Fixed Partner/);
console.log(JSON.stringify({
 fullModeAudit:'PASS',schedulerEngines:expectedIds.length,conceptualVariants:8,
 fixedAmericanoFullCycles:completedFP,normalAmericanoFullCycles:completedNormal,
 fixedPartnerMidSessionRecoveryCases:fpRecoveryIncidents,
 distinctNormalTeammatePairsAudited:normalPartnerChecks,
 productionFairCycles:certifiedNormalCycles,productionFairCyclePlayers:certifiedNormalPlayers,
 dynamicMexicanoScenarios:mexicanModes,dynamicMexicanoRounds:mexicanRounds,
 observedDynamicMaximumGamesGap:maxDynamicGap,
 protectedRoles:'Coach/Fixed Partner',structuredBalanceGuard:true,koSitoutGuards,coachDiversityCases,coachPairingImproved,worstCoachOpponentEncounter,minCoachUniqueOpponents,
 fixedMexFirstRoundUniqueDraws:firstRoundDraws.size,individualMexFirstRoundUniqueDraws:individualOpeningDraws.size
}));
