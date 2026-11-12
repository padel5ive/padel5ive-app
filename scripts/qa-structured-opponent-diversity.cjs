'use strict';
/* PR35: regression using real screenshot 18-player / 3-court / 14-round fixtures */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
assert(html.includes('/assets/p5-structured-opponent-diversity-v1.js'),'Opponent adapter missing from production HTML');
assert.equal(html.split('/assets/p5-structured-opponent-diversity-v1.js').length-1,1,'Duplicate adapter injection');
const src=fs.readFileSync('public/assets/p5-structured-opponent-diversity-v1.js','utf8');
const sample=[
 '5H 2D|9G 3B|4E 7A','1G 4F|2I 7C|6H 8B','6D 9I|3F 8A|1E 5C','3C 7H|5I 4B|2G 9E',
 '1B 3A|9F 8H|6G 5D','6I 2E|1F 7D|4A 8C','9B 1C|8I 5G|6F 3H','5E 2F|4C 3D|9A 7I',
 '4H 7G|6E 1A|2B 8D','6C 8F|9H 5B|1I 3G','9D 3E|4I 7F|5A 2C','6A 4G|2H 1D|8E 7B',
 '9C 8G|6B 5F|3I 1H','2A 3F|7E 4D'
];
const fixture=sample.map((rd,i)=>({index:i,structuredFairCycleCertified:true,
 eligibleIds:'123456789ABCDEFGHI'.split(''),groupSnapshot:{A:9,B:9},completePartnerCycle:true,
 matches:rd.split('|').map((x,j)=>({id:'R'+i+'C'+j,court:j+1,score:null,confirmed:false,teams:x.split(' ').map(t=>t.split(''))}))}));
const ctx={};ctx.window=ctx;ctx.P5Structured={build:()=>fixture};vm.runInNewContext(src,ctx,{timeout:30000});
const engine=ctx.P5StructuredOpponentLab;
const random=(seed)=>()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
function summary(rows){
 const gp={},rests={},partner={},byRound={};
 for(let ri=0;ri<rows.length;ri++){
  const players=new Set(),pairs=[];
  for(const m of rows[ri].matches)for(const team of m.teams){
   assert.equal(team.length,2);assert(/^[1-9]$/.test(team[0]));assert(/^[A-I]$/.test(team[1]));
   const k=team.join('|');partner[k]=(partner[k]||0)+1;pairs.push(k);
   for(const id of team){assert(!players.has(id),'Double booking '+id);players.add(id);gp[id]=(gp[id]||0)+1;}
  }
  for(const id of '123456789ABCDEFGHI'){if(!rests[id])rests[id]=[];rests[id].push(players.has(id));}
  byRound[ri]=pairs.sort().join(',');
 }
 return {gp,rests,partner,byRound};
}
const metric=rows=>engine.metrics(rows.map(x=>x.matches.map(m=>m.teams)));
const initial=metric(fixture),initialState=JSON.stringify(fixture),expected=summary(fixture);
assert.equal(initial.repeats,34);assert.equal(initial.peak,4);
let strictlyImproved=0,peakReduced=0,minimum=Infinity;
for(let seed=1;seed<=12;seed++){
 const out=engine.optimize(fixture,random(seed)),m=metric(out);
 assert(m.repeats<=initial.repeats&&m.peak<=initial.peak&&m.fixtureRepeats<=initial.fixtureRepeats,'Diversity regression');
 if(m.repeats<initial.repeats)strictlyImproved++;
 if(m.peak<initial.peak)peakReduced++;
 minimum=Math.min(minimum,m.repeats);
 const result=summary(out);
 for(const key of Object.keys(expected))assert.equal(JSON.stringify(result[key]),JSON.stringify(expected[key]),'Scheduling invariant violated: '+key);
 for(let i=0;i<out.length;i++){
  assert.equal(out[i].matches.length,fixture[i].matches.length);
  assert.equal(out[i].eligibleIds.join(','),fixture[i].eligibleIds.join(','));
  for(let j=0;j<out[i].matches.length;j++){
   const prev=fixture[i].matches[j],n=out[i].matches[j];
   assert.equal(n.id,prev.id);assert.equal(n.court,prev.court);
   assert.equal(n.score,null);assert.equal(n.confirmed,false);
  }
 }
}
assert.equal(JSON.stringify(fixture),initialState,'Original fixture mutated');
assert(strictlyImproved>=10);assert(peakReduced>=10);
const state={mode:'structured-americano',rounds:[],sitout:[],rules:{}};
assert.equal(ctx.P5Structured.build(state,random(13)).length,14);
assert.equal(ctx.P5Structured.build({...state,rounds:[fixture[0]]},random(13)),fixture,'Restored session must bypass optimizer');
assert.equal(ctx.P5Structured.build({...state,mode:'structured-mexicano'},random(13)),fixture,'Mexicano engine must bypass optimizer');
const scored=JSON.parse(initialState);scored[0].matches[0].confirmed=true;scored[0].matches[0].score=[3,1];
assert.equal(engine.optimize(scored,random(1)),scored,'Scored round cannot be modified');
console.log(JSON.stringify({qa:'PASS',seeds:12,strictlyImproved,peakReduced,initialOpponentRepeats:initial.repeats,bestOpponentRepeats:minimum,certifiedFairness:'PRESERVED',mexicano:'UNTOUCHED'}));
