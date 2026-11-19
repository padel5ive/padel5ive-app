'use strict';
/* Actual built Unified engine test. Structured Americano v2 must run AFTER
 * certified fairness + opponent diversity + PR40 late return recovery.
 * No mocking of the scheduler or any production user/session data.
 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const assets=[
 'p5-structured-fairness-lab.js',
 'p5-structured-irregular-lab.js',
 'p5-structured-opponent-diversity-v1.js',
 'p5-structured-late-return-density.js',
 'p5-structured-matchmaking-v2.js'
];
for(const name of assets)assert.equal(html.split('/assets/'+name).length-1,1,'Missing / duplicate built asset '+name);
assert.equal(html.split('<!-- P5 STRUCTURED MATCHMAKING V2 -->').length-1,1);
assert(html.includes('/* PR52 STRUCTURED FINAL ENCOUNTER GUARD */'),'Late arrival final fairness pass must preserve encounter optimizer');
assert(html.indexOf('p5-structured-late-return-density.js')<html.indexOf('p5-structured-matchmaking-v2.js'),
 'v2 must run after late-return recovery');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
function section(from,to){const a=html.indexOf(from),b=html.indexOf(to,a+from.length);
 assert(a>=0&&b>a,'Built engine section missing '+from);
 vm.runInContext(html.slice(a,b),ctx,{timeout:30000,filename:from});
}
section('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
section('window.P5Structured=(function','window.P5EngineStructured=');
for(const name of assets)vm.runInContext(fs.readFileSync('public/assets/'+name,'utf8'),ctx,{timeout:30000,filename:name});
assert.equal(ctx.P5Structured.structuredMatchmakingVersion,'2.3','Active encounter+partner-diversity adapter absent');
const rand=(seed)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);
 t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
function make(n,c,sit=[]){return {mode:'structured-americano',courts:c,sitout:sit.slice(),
 groupConfig:{labels:['Left','Right']},currentRound:0,rounds:[],
 roster:Array.from({length:2*n},(_,i)=>({id:i+1,group:i<n?'A':'B',names:['P'+(i+1)]}))};}
function audit(s,rows,expectedFull=true){
 const group=Object.fromEntries(s.roster.map(p=>[p.id,p.group]));
 const eligible=ctx.P5Structured.members(s),capacity=Math.min(s.courts,Math.floor(eligible.A.length/2),Math.floor(eligible.B.length/2));
 const G=Object.fromEntries(s.roster.map(p=>[p.id,0]));
 const history=Object.fromEntries(s.roster.map(p=>[p.id,[]]));
 const partners=new Map(),fixtures=new Map(),opponents=new Map();
 let doubleRest=0,peakGap=0,exactRepeated=0;
 for(const [i,rd] of rows.entries()){
  assert.equal(rd.index, (s.rounds.length&&rows===s.rounds)?i:rd.index,'Unexpected round index');
  const active=new Set(),courtIds=new Set();
  if(expectedFull)assert.equal(rd.matches.length,capacity,'Underfilled feasible court at round '+(i+1));
  assert(rd.matches.length<=capacity,'Court over-capacity');
  for(const m of rd.matches.filter(Boolean)){
   assert(!courtIds.has(m.court),'Double-booked court '+m.court);courtIds.add(m.court);
   assert(m.court>=1&&m.court<=s.courts);
   assert.equal(m.teams.length,2);
   for(const t of m.teams){
    assert.equal(t.length,2);assert.equal(group[t[0]],'A');assert.equal(group[t[1]],'B');
    for(const id of t){assert(!active.has(id),'Same player on two courts');active.add(id);
     assert(!s.sitout.includes(id),'Unavailable player scheduled');G[id]++;}
    const k=t.slice().sort((a,b)=>a-b).join(':');partners.set(k,(partners.get(k)||0)+1);
   }
   const f=m.teams.map(t=>t.slice().sort((a,b)=>a-b).join(':')).sort().join('|');
   if(fixtures.has(f))exactRepeated++;fixtures.set(f,(fixtures.get(f)||0)+1);
   for(const a of m.teams[0])for(const b of m.teams[1]){
    const k=[a,b].sort((a,b)=>a-b).join(':');
    opponents.set(k,(opponents.get(k)||0)+1);
   }
  }
  const possible=rd.eligibleIds||s.roster.map(p=>p.id);
  for(const id of possible){const seq=history[id],on=active.has(id);
   if(!on&&seq.at(-1)===false)doubleRest++;seq.push(on);}
  const vals=possible.map(id=>G[id]);if(vals.length)peakGap=Math.max(peakGap,Math.max(...vals)-Math.min(...vals));
 }
 const totalGames=Object.values(G);
 return {count:rows.length,matches:rows.reduce((v,r)=>v+r.matches.length,0),
  gpMin:Math.min(...totalGames),gpMax:Math.max(...totalGames),G,
  distinctPartners:partners.size,partnerRepeats:[...partners.values()].reduce((v,n)=>v+n-1,0),
  exactRepeated,distinctFixtures:fixtures.size,doubleRest,peakGap};
}
let normal=0,extended=0,lateReturn=0,sitout=0,asymmetric=0,protectedHistory=0;
for(const seed of [1,2,3,11,21]){
 const s=make(9,3),built=ctx.P5Structured.build(s,rand(seed));
 assert.equal(built.length,14);
 const m=audit(s,built);assert.equal(m.matches,42);assert.equal(m.distinctPartners,81);
 assert.equal(m.partnerRepeats,3);assert.equal(m.exactRepeated,0);
 assert(m.peakGap<=1);assert.equal(m.doubleRest,0);normal++;
 s.rounds=built;
 for(let i=0;i<16;i++){
  const previous=JSON.stringify(s.rounds),next=ctx.P5Structured.extend(s,rand(seed*1000+i));
  assert.equal(JSON.stringify(s.rounds),previous,'Historical fixtures mutated by extension');
  s.rounds.push(next);
  if(s.rounds.length===15){const v=audit(s,s.rounds);assert(Object.values(v.G).every(g=>g===10),'Round 15 must yield equal G10');}
  if(s.rounds.length===24){const v=audit(s,s.rounds);assert(Object.values(v.G).every(g=>g===16),'Round 24 must yield equal G16');assert.equal(v.doubleRest,0);assert.equal(v.exactRepeated,0);}
 }
 const x=audit(s,s.rounds);assert.equal(x.matches,90);assert(x.peakGap<=1);extended++;
}
// Unfilled final courts for other roster/court configurations remain covered.
for(const [n,c] of [[3,1],[5,2],[6,2],[8,3],[9,2],[9,4],[12,4],[15,5]]){
 const s=make(n,c),rows=ctx.P5Structured.build(s,rand(70+n+c));
 const a=audit(s,rows);assert.equal(a.matches,rows.length*c,'Unfilled court at '+n+'/'+c);
 if(n===9&&c===2)assert.equal(a.distinctPartners,81);
 normal++;
}
// Confirmed four rounds immutable; simulate one A+B and two A+B sit-out/return.
for(const [name,initialAbsent,currentAbsent] of [
 ['late1',[9,18],[]],['late2',[8,9,17,18],[]],
 ['sit1',[],[9,18]],['sit2',[],[8,9,17,18]],
 ['asymSit',[],[9]]
]){
 const s=make(9,3,initialAbsent);
 const original=ctx.P5Structured.build(s,rand(500));
 s.rounds=original.slice(0,4);
 for(const rd of s.rounds)for(const m of rd.matches){m.confirmed=true;m.score=[3,2];}
 s.currentRound=3;const frozen=JSON.stringify(s.rounds);
 s.sitout=currentAbsent;
 const pending=ctx.P5Structured.rebuild(s,rand(501));
 assert.equal(JSON.stringify(s.rounds),frozen,'Confirmed prefix was modified');
 assert(pending.length>0);
 // The full rebuilt suffix should use current eligible group sizes, every round.
 const subset={...s,rounds:[]};
 audit(subset,pending);
 assert(pending.every(rd=>rd.matches.every(m=>m.teams.flat().every(id=>!currentAbsent.includes(id)))));
 if(name.startsWith('late'))lateReturn++;
 else if(name.startsWith('sit'))sitout++;
 else asymmetric++;
 protectedHistory++;
}
// Staggered late-arrival regression: one player returns after Round 2,
// their opposite-group counterpart only after Round 4. Each rebuild must treat the confirmed prefix as
// immutable and recompute only unscored future opponent assignments.
{
 const s=make(9,3,[9,18]);
 const initial=ctx.P5Structured.build(s,rand(707));
 const play=(rows)=>{for(const rd of rows)for(const m of rd.matches){
  m.score=[3,2];m.confirmed=true;
 }};
 s.rounds=initial.slice(0,2);play(s.rounds);s.currentRound=1;
 const firstHistory=JSON.stringify(s.rounds);
 s.sitout=[18];
 const future1=ctx.P5Structured.rebuild(s,rand(708));
 assert.equal(JSON.stringify(s.rounds),firstHistory,'First staged return changed prior scores');
 assert(future1.length>=2,'First return must permit later rounds');
 s.rounds=s.rounds.concat(future1);
 s.rounds=s.rounds.slice(0,4);play(s.rounds.slice(2));s.currentRound=3;
 const secondHistory=JSON.stringify(s.rounds);
 s.sitout=[];
 const future2=ctx.P5Structured.rebuild(s,rand(709));
 assert.equal(JSON.stringify(s.rounds),secondHistory,'Second staged return changed prior scores');
 assert(future2.length>0,'Second return must generate the remaining schedule');
 const complete=s.rounds.concat(future2);
 const counted=new Set();
 for(const rd of complete){
  const used=new Set(),courts=new Set();
  for(const m of rd.matches.filter(Boolean)){
   assert(!courts.has(m.court),'Staggered return booked one court twice');
   courts.add(m.court);
   for(const team of m.teams){
    assert.equal(team.length,2);
    assert(s.roster.find(p=>p.id===team[0]).group==='A'&&s.roster.find(p=>p.id===team[1]).group==='B');
    for(const id of team){assert(!used.has(id),'Staggered return booked same player twice');used.add(id);counted.add(id);}
   }
  }
 }
 assert.equal(counted.size,18,'Returned participants were never scheduled');
 assert(complete.slice(0,4).every(rd=>rd.matches.every(m=>m.confirmed&&m.score?.length===2)),
  'Prior confirmed scores were changed during staged return');
 console.log('PASS Structured 18-player staggered single arrivals: unequal groups between R2/R4, all players reached, confirmed history untouched');
}

// Incident-inspired regression from nine visible match rounds (18 players,
// three courts): two Group A+Group B participants were partners in both R7/R8.
// Group membership is inferred from the recorded cross-group pairings, but
// availability before R2 is a deliberate TEST hypothesis, not a fact proven
// by the screenshot. Real names are anonymized to stable numeric IDs.
{
 const namesA=['abi','davita','iko','indri','jess','kosy','lena','ricky','tom'];
 const namesB=['andry','felix','gege','hans','junito','kylie','raffy','rein','weiny'];
 const id=Object.fromEntries(namesA.concat(namesB).map((n,i)=>[n,i+1]));
 const fixtureRows=[
  [[['lena','gege'],['indri','felix']],[['iko','junito'],['kosy','kylie']],[['davita','raffy'],['ricky','rein']]],
  [[['tom','kylie'],['ricky','gege']],[['iko','felix'],['indri','junito']],[['kosy','weiny'],['jess','raffy']]],
  [[['iko','raffy'],['lena','hans']],[['kosy','felix'],['davita','kylie']],[['jess','weiny'],['indri','rein']]],
  [[['abi','felix'],['tom','weiny']],[['kosy','rein'],['indri','hans']],[['jess','gege'],['iko','andry']]],
  [[['abi','hans'],['indri','raffy']],[['kosy','andry'],['davita','weiny']],[['tom','gege'],['jess','rein']]],
  [[['ricky','weiny'],['lena','junito']],[['jess','andry'],['abi','kylie']],[['indri','gege'],['kosy','hans']]],
  [[['indri','weiny'],['iko','kylie']],[['jess','felix'],['kosy','raffy']],[['abi','gege'],['davita','junito']]],
  [[['jess','hans'],['abi','junito']],[['tom','andry'],['kosy','raffy']],[['davita','gege'],['lena','kylie']]]
 ];
 const rows=fixtureRows.map((matches,ri)=>({
  index:ri,
  eligibleIds:ri===0?Array.from(new Set(matches.flat(2))).map(n=>id[n]):Object.values(id),
  matches:matches.map((teams,ci)=>({id:'INC-R'+ri+'C'+ci,court:ci+1,teams:teams.map(t=>t.map(n=>id[n])),
   confirmed:ri<7,score:ri<7?[2,2]:null}))
 }));
 const s=make(9,3);s.roster=namesA.concat(namesB).map((n,i)=>({
  id:i+1,group:i<9?'A':'B',names:['Participant '+(i+1)]}));
 const prefix=rows.slice(0,7),future=rows.slice(7);
 const before=JSON.stringify(rows),p1=id.kosy,p2=id.raffy;
 const risk=ctx.P5StructuredMatchmakingV2.partnerRisk(rows);
 assert.equal(risk.adjacent,1,'Round 7/Round 8 repeated teammates must be reproducible');
 const revised=ctx.P5StructuredMatchmakingV2.rebalanceFuture(s,prefix,future,rand(207));
 const revisedRisk=ctx.P5StructuredMatchmakingV2.partnerRisk(prefix.concat(revised));
 assert(revisedRisk.adjacent<risk.adjacent,'Incident adjacent teammate repeat was not repaired');
 assert(revisedRisk.repeated<=risk.repeated,'Fix introduced extra teammates repeats elsewhere');
 assert.equal(JSON.stringify(rows),before,'Incident input fixture changed');
 assert.equal(JSON.stringify(prefix),JSON.stringify(rows.slice(0,7)),'Confirmed incident rounds changed');
 const beforePlayers=future[0].matches.flatMap(m=>m.teams.flat()).sort((a,b)=>a-b);
 const afterPlayers=revised[0].matches.flatMap(m=>m.teams.flat()).sort((a,b)=>a-b);
 assert.equal(afterPlayers.length,beforePlayers.length,'Late recovery must preserve total court capacity');
 assert.equal(new Set(afterPlayers).size,afterPlayers.length,'Late recovery double-booked a player');
 assert(afterPlayers.every(pid=>s.roster.some(p=>p.id===pid)),'Late recovery scheduled an unknown player');
 const beforeRest=ctx.P5StructuredMatchmakingV2.restMetrics(rows,s);
 const afterRest=ctx.P5StructuredMatchmakingV2.restMetrics(prefix.concat(revised),s);
 assert(afterRest.score<beforeRest.score,'Streak/rest recovery failed to improve actual 18-player match history: '+JSON.stringify({beforeRest,afterRest}));
 assert(!afterPlayers.includes(id.jess),'Jess remains scheduled for seventh consecutive eligible round despite three rest alternatives');
 console.log('PASS incident recovery: Jess gets rest before seventh successive match; full courts and historical scores preserved');
 for(let ci=0;ci<3;ci++){
  assert.equal(revised[0].matches[ci].id,future[0].matches[ci].id);
  assert.equal(revised[0].matches[ci].court,future[0].matches[ci].court);
  assert.equal(revised[0].matches[ci].score,null);
  assert.equal(revised[0].matches[ci].confirmed,false);
 }
 for(const m of revised[0].matches)for(const t of m.teams){
  assert(s.roster.find(p=>p.id===t[0]).group==='A'&&s.roster.find(p=>p.id===t[1]).group==='B',
    'Incident-inspired repair breaks structured pair constraints');
 }
 assert(!revised[0].matches.some(m=>m.teams.some(t=>t.includes(p1)&&t.includes(p2))),
  'Kosy/Raffy remain partners in successive rounds despite available changes');

 // Another observed case: Hans and Indri shared one court in R4, R5 and R6,
 // as partners once and opponents twice. R6 had a valid alternative using
 // the same six intact teams across three courts.
 const early=rows.slice(0,5);
 const roundSix={...rows[5],matches:rows[5].matches.map(m=>({...m,score:null,confirmed:false}))};
 const originalSix=JSON.stringify(roundSix),frozenFive=JSON.stringify(early);
 assert(roundSix.matches.some(m=>m.teams.flat().includes(id.hans)&&m.teams.flat().includes(id.indri)),
  'Screenshot R6 must reproduce Hans/Indri shared court');
 const revisedSix=ctx.P5StructuredMatchmakingV2.rebalanceFuture(s,early,[roundSix],rand(218))[0];
 assert(!revisedSix.matches.some(m=>m.teams.flat().includes(id.hans)&&m.teams.flat().includes(id.indri)),
  'R6 retained third Hans/Indri encounter despite a legal alternative');
 assert.equal(JSON.stringify(roundSix),originalSix,'R6 source schedule unexpectedly changed');
 assert.equal(JSON.stringify(early),frozenFive,'R1–R5 confirmed scores unexpectedly changed');
 const teamStrings=rd=>rd.matches.flatMap(m=>m.teams.map(t=>t.slice().sort((a,b)=>a-b).join(':'))).sort();
 assert.deepEqual(teamStrings(revisedSix),teamStrings(roundSix),
  'Avoiding Hans/Indri encounter must not change their selected teammate');

 console.log('PASS screenshot-based Structured 18/3: R7-R8 partner repeat repaired with no changes to scored rounds, selected players or court slots');
}

// A future scored fixture cannot silently be rebuilt.
{
 const s=make(9,3);s.rounds=ctx.P5Structured.build(s,rand(321));s.currentRound=2;
 s.rounds[3].matches[0].score=[3,2];s.rounds[3].matches[0].confirmed=true;
 const before=JSON.stringify(s.rounds);
 assert.throws(()=>ctx.P5Structured.rebuild(s,rand(14)),/protected future fixture/);
 assert.equal(JSON.stringify(s.rounds),before);
 protectedHistory++;
}

// Reproduce the reported issue: the exact same four people share a court,
// swapping between teammates and opponents. A late-return rebuild must not
// consider those pairings sufficiently "random".
{
 const s=make(4,2),prefix=[{index:0,eligibleIds:s.roster.map(p=>p.id),matches:[
  {id:'R0C0',court:1,teams:[[1,5],[2,6]],confirmed:true,score:[3,2]},
  {id:'R0C1',court:2,teams:[[3,7],[4,8]],confirmed:true,score:[3,2]}
 ]}];
 const future=[{index:1,eligibleIds:s.roster.map(p=>p.id),matches:[
  {id:'R1C0',court:1,teams:[[1,6],[2,5]],confirmed:false,score:null},
  {id:'R1C1',court:2,teams:[[3,8],[4,7]],confirmed:false,score:null}
 ]}];
 const frozen=JSON.stringify(prefix),original=JSON.stringify(future);
 const paired=(rows)=>rows.flatMap(rd=>rd.matches.flatMap(m=>m.teams.map(t=>t.slice().sort((a,b)=>a-b).join(':')))).sort();
 const encounters=(rows)=>rows.flatMap(rd=>rd.matches.map(m=>m.teams.flat().slice().sort((a,b)=>a-b).join(':')));
 const baseline=new Set(encounters(prefix));
 assert(encounters(future).every(q=>baseline.has(q)),
  'The regression fixture must repeat the same four people');
 const optimized=ctx.P5StructuredMatchmakingV2.rebalanceFuture(s,prefix,future,rand(42));
 assert.equal(JSON.stringify(prefix),frozen,'Prior confirmed history changed');
 assert.equal(JSON.stringify(future),original,'Source future schedule mutated');
 assert.equal(JSON.stringify(paired(optimized)),JSON.stringify(paired(future)),
  'Players were assigned new partners rather than only changed court opponents');
 assert(optimized[0].matches.every(m=>!baseline.has(m.teams.flat().slice().sort((a,b)=>a-b).join(':'))),
  'Repeated four-person court encounters remain despite an available alternative');
 assert(optimized[0].matches.every((m,i)=>m.id===future[0].matches[i].id&&m.court===future[0].matches[i].court&&!m.confirmed&&m.score==null),
  'Match identity, court allocation and pending score status must remain stable');
 console.log('PASS Structured late-return encounter case: same quartet avoided, all teammates/history protected');
}

console.log(JSON.stringify({status:'PASS',mode:'Structured Americano',normal,extended,
 lateReturn,sitout,asymmetric,protectedHistory,courtUtilization:'FULL WHEN FEASIBLE',
 teammateRepeat:'ALLOWED',exactFixtureRepeatsAt24:0,scoreHistory:'IMMUTABLE'}));
