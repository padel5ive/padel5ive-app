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
assert.equal(ctx.P5Structured.structuredMatchmakingVersion,'2.0','Active v2 adapter absent');
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
// A future scored fixture cannot silently be rebuilt.
{
 const s=make(9,3);s.rounds=ctx.P5Structured.build(s,rand(321));s.currentRound=2;
 s.rounds[3].matches[0].score=[3,2];s.rounds[3].matches[0].confirmed=true;
 const before=JSON.stringify(s.rounds);
 assert.throws(()=>ctx.P5Structured.rebuild(s,rand(14)),/protected future fixture/);
 assert.equal(JSON.stringify(s.rounds),before);
 protectedHistory++;
}
console.log(JSON.stringify({status:'PASS',mode:'Structured Americano',normal,extended,
 lateReturn,sitout,asymmetric,protectedHistory,courtUtilization:'FULL WHEN FEASIBLE',
 teammateRepeat:'ALLOWED',exactFixtureRepeatsAt24:0,scoreHistory:'IMMUTABLE'}));
