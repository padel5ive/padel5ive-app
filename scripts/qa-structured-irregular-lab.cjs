'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const names=['p5-structured-fairness-lab.js','p5-structured-irregular-lab.js','p5-structured-mexicano-diversity-lab.js'];
for(const name of names)assert(html.includes('/assets/'+name),'Missing deployed script: '+name);
const ctx={};ctx.window=ctx;vm.createContext(ctx);
function section(first,next){
 const a=html.indexOf(first),b=html.indexOf(next,a+first.length);
 assert(a>=0&&b>a,'Missing actual-source engine: '+first);
 vm.runInContext(html.slice(a,b),ctx,{timeout:30000});
}
section('window.P5Structured=(function','window.P5EngineStructured=');
section('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
section('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano');
section('window.P5StructuredMX534=(function','/* PADEL 5IVE 5.4.13.5');
const priorOptimize=ctx.P5Fair532.optimize;
for(const name of names)vm.runInContext(fs.readFileSync('public/assets/'+name,'utf8'),ctx,{timeout:30000});
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const key=(a,b)=>a<b?a+':'+b:b+':'+a;
const create=(n,c,mode='structured-americano')=>({mode,courts:c,sitout:[],rounds:[],currentRound:0,groupConfig:{labels:['Left','Right']},roster:Array.from({length:n*2},(_,i)=>({id:i+1,group:i<n?'A':'B',names:['P'+(i+1)]}))});
const opts=s=>({structured:s.mode==='structured-americano',availableIds:s.roster.filter(p=>!s.sitout.includes(p.id)).map(p=>p.id),coaches:[]});
function audit(rows,s){
 const roster=new Map(s.roster.map(p=>[p.id,p.group])),ids=s.roster.filter(p=>!s.sitout.includes(p.id)).map(p=>p.id);
 const count=Object.fromEntries(ids.map(id=>[id,0])),play=Object.fromEntries(ids.map(id=>[id,[]]));
 const pCount=new Map(),oCount=new Map(),fCount=new Map();
 let doubleRest=0,triplePlay=0,longest=0,maxGap=0;
 for(const [i,r] of rows.entries()){
  assert(r.matches.length<=s.courts,'Court overcapacity');
  const occupied=new Set(),courtIds=new Set();
  for(const m of r.matches.filter(Boolean)){
   assert(!courtIds.has(m.court),'Double court booking');courtIds.add(m.court);
   assert(m.court>=1&&m.court<=s.courts,'Court outside capacity');
   for(const team of m.teams){
    assert.equal(team.length,2);
    assert.equal(roster.get(team[0]),'A','Wrong Group A');
    assert.equal(roster.get(team[1]),'B','Wrong Group B');
    pCount.set(key(...team),(pCount.get(key(...team))||0)+1);
    for(const id of team){assert(!occupied.has(id),'Double booked participant');occupied.add(id);assert(ids.includes(id),'Ineligible participant');}
   }
   const [a,b]=m.teams,sig=[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
   fCount.set(sig,(fCount.get(sig)||0)+1);
   for(const x of a)for(const y of b)oCount.set(key(x,y),(oCount.get(key(x,y))||0)+1);
  }
  for(const id of ids){const on=occupied.has(id),r=play[id];if(!on&&r.at(-1)===false)doubleRest++;if(on&&r.at(-1)===true&&r.at(-2)===true)triplePlay++;r.push(on);if(on)count[id]++;let streak=0;for(let k=r.length-1;k>=0&&r[k];k--)streak++;longest=Math.max(longest,streak);}
  const v=Object.values(count);maxGap=Math.max(maxGap,Math.max(...v)-Math.min(...v));
 }
 const repeats=m=>[...m.values()].reduce((v,n)=>v+Math.max(0,n-1),0);
 return {doubleRest,triplePlay,longest,maxGap,
  partnerMap:[...pCount.entries()].sort(([a],[b])=>a.localeCompare(b)),
  partnerRepeats:repeats(pCount),oppRepeats:repeats(oCount),exactRepeats:repeats(fCount)};
}
let total=0,changed=0,maxGenerationMs=0;
for(const [n,c] of [[7,2],[8,2],[8,3],[9,3],[10,3],[10,4],[11,3],[12,4],[15,5]]){
 for(const seed of [1,2,3,4,5,6]){
  const s=create(n,c),rng=random(seed),raw=ctx.P5Structured.build(s,rng);
  const originalHash=JSON.stringify(raw),ids=s.roster.map(p=>p.id);
  const ref=priorOptimize(raw,[],ids,random(seed+1000),opts(s)),baseline=audit(ref,s);
  const started=Date.now();
  const future=ctx.P5Fair532.optimize(raw,[],ids,random(seed+1000),opts(s));
  maxGenerationMs=Math.max(maxGenerationMs,Date.now()-started);
  assert.equal(JSON.stringify(raw),originalHash,'Optimizer mutated input');
  const q=audit(future,s);
  assert.deepEqual(q.partnerMap,baseline.partnerMap,'Opponent fairness altered partner multiset');
  assert(q.longest<=baseline.longest,'Rest streak regression');
  assert(q.doubleRest<=baseline.doubleRest,'Double-rest regression');
  assert(q.maxGap<=baseline.maxGap,'Game-count gap regression');
  assert(q.exactRepeats<=baseline.exactRepeats,'Repeated exact fixture regression');
  if(!future.every(r=>r.structuredFairCycleCertified)){
   const target=n-2*c>0?Math.ceil(2*c/(n-2*c)):Infinity;
   if(q.longest>target||q.maxGap>1){
    assert((future[0].fairnessWarnings||[]).some(w=>w.startsWith('Scheduling fairness watch:')),'Residual fairness risk not disclosed');
   }
  }
  const extra=q.oppRepeats-baseline.oppRepeats;
  assert(extra<=6,'Excessive opponent-repeat trade-off');
  if(extra>0){
   assert(baseline.longest>=5&&q.longest<baseline.longest,'Opponent compromise without severe rest benefit');
   assert((future[0].fairnessWarnings||[]).some(x=>x.includes('Fairness trade-off')),'Undisclosed opponent compromise');
  }
  if(q.longest<baseline.longest||q.doubleRest<baseline.doubleRest||q.maxGap<baseline.maxGap)changed++;
  total++;
 }
}
// Immutable past when players join, Sit Out, or courts are reduced.
let recoveryCases=0,recoveryWarnings=[];
for(const variation of ['sitout','add','court']){
 const s=create(9,3),built=ctx.P5Structured.build(s,random(75));
 s.rounds=built;s.currentRound=2;
 for(const r of s.rounds.slice(0,3))for(const m of r.matches){m.confirmed=true;m.score=[2,2];}
 const preserved=JSON.stringify(s.rounds.slice(0,3));
 if(variation==='sitout')s.sitout=[9,18];
 if(variation==='add'){s.roster.push({id:19,group:'A',names:['New A']},{id:20,group:'B',names:['New B']});}
 if(variation==='court')s.courts=2;
 ctx.P5Structured.validate(s);
 try{
  const future=ctx.P5Structured.rebuild(s,random(66));
  assert(future.length>0,'No reconstructed rounds');
  const pending=ctx.P5Fair532.optimize(future,s.rounds.slice(0,3),s.roster.map(p=>p.id),random(67),opts(s));
  assert.equal(JSON.stringify(s.rounds.slice(0,3)),preserved,'Confirmed past modified');
  const stage={...s,roster:s.roster.filter(p=>!s.sitout.includes(p.id))};
  audit(pending,stage);recoveryCases++;
 }catch(e){recoveryWarnings.push(variation+': '+e.message);}
}
assert.equal(recoveryWarnings.length,0,'Mid-session recovery failure: '+recoveryWarnings.join('; '));
// Isolated special-case certified cycles must not be altered by irregular optimizer.
const ideal=create(9,3),idealRounds=ctx.P5Structured.build(ideal,random(71)),before=JSON.stringify(idealRounds);
const result=ctx.P5Fair532.optimize(idealRounds,[],ideal.roster.map(p=>p.id),random(72),opts(ideal));
assert.equal(JSON.stringify(result),before,'Certified fairness cycles were modified');
assert(idealRounds.every(r=>r.structuredFairCycleCertified));
console.log(JSON.stringify({status:'PASS',irregularScenarios:total,restImprovedCases:changed,recoveryCases,maxObservedOptimizerMs:maxGenerationMs,certifiedCyclePreserved:true}));
