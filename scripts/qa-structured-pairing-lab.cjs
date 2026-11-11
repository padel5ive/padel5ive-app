'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const path of ['/assets/p5-structured-fairness-lab.js','/assets/p5-structured-mexicano-diversity-lab.js'])assert(html.includes(path),'Missing integrated script '+path);
assert.equal(html.split('<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->').length-1,1,'Duplicate integration marker');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
function runBetween(from,to){const a=html.indexOf(from),b=html.indexOf(to,a+from.length);assert(a>=0&&b>a,from+' source missing');vm.runInContext(html.slice(a,b),ctx,{timeout:30000});}
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
console.log(JSON.stringify({integration:'PASS',americanSeeds:amerPass,mexicanSeeds:mexPass,mexicanoRoundsImproved:improved}));
