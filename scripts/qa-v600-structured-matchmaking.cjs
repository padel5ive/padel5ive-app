'use strict';
// Regression QA for Structured Americano 9+9/3C and rank-based Structured Mexicano.
// Run: node scripts/qa-v600-structured-matchmaking.cjs
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const patch=fs.readFileSync('public/assets/p5-structured-matchmaking-v600.js','utf8');
const section=(from,to)=>{
 const start=html.indexOf(from),end=html.indexOf(to,start);
 assert(start>=0&&end>start,'Missing engine section: '+from);return html.slice(start,end);
};
const ctx={};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(section('window.P5Structured=(function','window.P5EngineStructured='),ctx);
vm.runInContext(section('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano'),ctx);
vm.runInContext(patch,ctx);
vm.runInContext(section('window.P5StructuredMX534=(function','/assets/p5-structured-matchmaking-v600.js'),ctx);
assert(html.includes("window.P5StructuredFair6?.applies(s)"),'Live setup must preserve certified schedule');
assert(html.includes('repeat*1700+opp*240+exact*3500'),'Mexicano encounter penalties absent');
assert(html.includes('attempt<48'),'Mexicano candidate search budget absent');
assert.equal(ctx.P5StructuredFair6.version,'6.0.0');
const rng=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)|0;return(seed>>>0)/4294967296;};
const state=mode=>({mode,courts:3,roster:Array.from({length:18},(_,i)=>({id:i+1,names:['P'+(i+1)],group:i<9?'A':'B'})),
 groupConfig:{labels:['Left','Right']},sitout:[],rounds:[],currentRound:0});
const pair=(a,b)=>a<b?a+':'+b:b+':'+a;
function scan(rounds){
 const counts=Object.fromEntries(Array.from({length:18},(_,i)=>[i+1,0])),partner=new Map(),opp=new Map(),gaps=[],played={};
 let dupPartner=0,dupOpp=0,prefixOpp=0,maxPlay=0;
 for(let ri=0;ri<rounds.length;ri++){
  const rd=rounds[ri],active=new Set();
  for(const match of rd.matches.filter(Boolean)){
   assert.equal(match.teams.length,2);
   for(const team of match.teams){
    assert.equal(team.length,2);
    assert.notEqual(team[0]<=9,team[1]<=9,'Cross-group rule violated');
    const k=pair(...team);if(partner.has(k))dupPartner++;
    partner.set(k,(partner.get(k)||0)+1);
    for(const id of team){assert(!active.has(id),'Double booking round '+ri);active.add(id);}
   }
   for(const a of match.teams[0])for(const b of match.teams[1]){
    const k=pair(a,b);if(opp.has(k)){dupOpp++;if(ri<9)prefixOpp++;}
    opp.set(k,(opp.get(k)||0)+1);
   }
  }
  for(let id=1;id<=18;id++){
   const hist=(played[id]||[]);hist.push(active.has(id)?1:0);played[id]=hist;
   if(active.has(id))counts[id]++;
  }
  const v=Object.values(counts);gaps.push(Math.max(...v)-Math.min(...v));
 }
 for(const p of Object.values(played)){
  let streak=0;for(const x of p){streak=x?streak+1:0;maxPlay=Math.max(maxPlay,streak);}
 }
 return {gaps,partner,dupPartner,dupOpp,prefixOpp,maxPlay};
}
let americanRepeats=0,americaMax=0;
for(let seed=1;seed<=80;seed++){
 const s=state('structured-americano'),rounds=ctx.P5Structured.build(s,rng(seed)),v=scan(rounds);
 assert.equal(rounds.length,14);
 assert.equal(v.partner.size,81,'Every cross-group partnership exactly once (plus one repeat)');
 assert.equal(v.dupPartner,1,'Odd full cycle requires exactly one repeated partnership');
 for(const i of [2,5,8,11])assert.equal(v.gaps[i],0,'Equal G after Round '+(i+1));
 assert(v.maxPlay<=4,'Excessive uninterrupted play streak');
 americaMax=Math.max(americaMax,v.prefixOpp);americanRepeats+=v.prefixOpp;
}
let mexicanoOpp=0,mexicanoPartner=0;
for(let seed=1;seed<=25;seed++){
 const s=state('structured-mexicano'),random=rng(seed+890);
 for(let ri=0;ri<9;ri++){
  const next=ctx.P5StructuredMX.next(s,s.roster.map(p=>({id:p.id})),random);
  for(const m of next.matches){m.confirmed=true;m.score=[2,2];}
  s.rounds.push(next);
 }
 const audit=scan(s.rounds);
 assert(audit.gaps.every(g=>g<=1),'Mexicano must keep G gap <=1');
 assert.equal(audit.gaps.at(-1),0,'Equal G after 9 Mexican rounds');
 mexicanoOpp+=audit.dupOpp;mexicanoPartner+=audit.dupPartner;
}
console.log(JSON.stringify({
 status:'PASS',americano:{seeds:80,rounds:14,round9GGap:0,partners:81,unavoidablePartnerRepeat:1,
 avgRound9RepeatedOpponents:+(americanRepeats/80).toFixed(2),maxRound9RepeatedOpponents:americaMax,maxPlayStreak:4},
 mexicano:{seeds:25,rounds:9,GGapAtRound9:0,avgRepeatedOpponents:+(mexicanoOpp/25).toFixed(2),
 avgRepeatedPartners:+(mexicanoPartner/25).toFixed(2)}
},null,2));
