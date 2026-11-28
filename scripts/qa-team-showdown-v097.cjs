/* Team Showdown v0.9.7 sidecar regression: production master isolation */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const target=read('public/modes/club-match/v097/index.html');
const legacy=read('public/modes/club-match/index.html');
const cloud=read('public/v097/cloud-dashboard.js');
const originalCloud=read('public/phase58/cloud-dashboard.js');
const cloudHome=read('public/phase58/cloud-home.js');
const history=read('public/phase57/home-session-history.js');
const routes=read('netlify.toml'),sw=read('public/sw.js');
function must(s,x){assert(s.includes(x),'Missing staging marker: '+x)}
for(const x of ['universal-continuous','p5-showdown-v090-individual','p5-direct-pdf.js',
 'function showdownReportData()','loadPublic()',"/api/results",'data-p58-cloud',
 '/v097/cloud-dashboard.js','/phase58/cloud-session.css','/phase585/menu-unified-v585.js',
 '/phase5822/cloud-modal-compact-v5822.css','/phase5814/view-only-v5814.js?v=5834.1'])must(target,x);
for(const x of ['v5.5.16','Share Final Results Link','/phase585/menu-unified-v585.js',
 '/phase5822/cloud-modal-compact-v5822.css','cloud-dashboard.js?v=5834.1'])must(legacy,x);
assert(!legacy.includes('padel5ive-team-showdown-v090-individual-lab'),'Legacy master overwritten');
must(originalCloud,'padel5ive-team-showdown-state-v3');
must(cloudHome,'padel5ive-team-showdown-state-v3');
must(history,'padel5ive-team-showdown-state-v3');
must(cloud,'padel5ive-team-showdown-v090-individual-lab');
must(cloud,'p58-cloud-link-v097-');
must(routes,'from = "/i/*"');
must(routes,'from = "/ts/*"');
must(routes,'to = "/results/showdown/v097/index.html"');
must(sw,"'/i/'");
must(sw,"'/ts/'");
must(sw,"p5-pwa-setup-prewarm-v588-1");
assert(!target.includes('P5_QA_DATA'),'QA fixture leaked into native engine');
for(const [i,m] of [...target.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'v097-inline-'+i});
}
new vm.Script(cloud,{filename:'v097-cloud.js'});
console.log('PASS v0.9.7: isolated runtime, legacy UI/PWA/Cloud preserved');

// Use the generated native engine and score matches through the organizer flow.
const engineSource=read('public/v097/showdown-engine.js');
function checkOpponentDraw(seed, latestFirst, withLateArrival, multi=false){
 const seededMath=Object.create(Math);
 seededMath.random=()=>(seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32;
 const ctx={Math:seededMath};
 vm.runInNewContext(engineSource,ctx);
 const engine=ctx.ClubEngine, state=engine.newState(),n=multi?14:8;
 Object.assign(state.setup,{
  competitionFormat:'individual',individualDivision:multi?'multi':'single',
  individualCounts:{single:8,men:8,women:6},pairs:n,courts:3,clubs:{A:'SIS',B:'VIS'}
 });
 for(const side of ['A','B'])state.roster[side]=Array.from({length:n},(_,i)=>({players:[{id:side+i,name:side+i}]}));
 engine.createMatches(state);
 const expectedMatches=multi?43:28;
 const fixtures=engine.matchPool(state);
 assert.equal(fixtures.length,expectedMatches);
 assert.equal(engine.liveCourts(state).length,3,'opening did not fill all three courts');
 const draw=()=> {
  const sample=fixtures.filter(m=>m.division===(multi?'men':'single'));
  const encounters=Array.from({length:8},()=>Array(8).fill(0));
  for(const m of sample)for(const a of [m.a,m.a2])for(const b of [m.b,m.b2])encounters[a][b]++;
  for(const row of encounters)assert.equal(row.filter(x=>x===1).length,2);
  assert(encounters.flat().every(x=>x===1||x===2),'opponent draw broke its coverage or repetition limit');
  for(const side of ['A','B']){
   const keys=sample.map(m=>side==='A'?[m.a,m.a2].sort().join(','):[m.b,m.b2].sort().join(','));
   assert.equal(new Set(keys).size,28,'a teammate pairing was lost or repeated');
  }
 };
 draw();
 const late=withLateArrival?Array.from({length:8},(_,i)=>i).find(i=>
  !engine.liveCourts(state).some(m=>m.a===i||m.a2===i)):null;
 if(late!==null)engine.toggleArrival(state,'A',late);
 const scored=new Map();
 for(let i=0;i<expectedMatches;i++){
  const live=engine.liveCourts(state);
  assert(live.length&&live.length<=3,'court dispatch stalled or exceeded capacity');
  assert.equal(new Set(live.map(m=>m.court)).size,live.length,'duplicate live court');
  for(const side of ['A','B']){
   const players=live.flatMap(m=>side==='A'?[m.a,m.a2]:[m.b,m.b2]);
   assert.equal(new Set(players).size,players.length,'player was booked on two live courts');
  }
  const match=live.reduce((first,m)=>(latestFirst?m.sequence>first.sequence:m.sequence<first.sequence)?m:first);
  for(const m of live)scored.set(m.id,[m.a,m.a2,m.b,m.b2].join(','));
  engine.assignCourtResult(state,match.id,3,2);
  if(i===10)assert(engine.validateSavedState(JSON.parse(JSON.stringify(state))),'active session cannot be restored');
  if(late!==null&&i===5)engine.toggleArrival(state,'A',late);
 }
 draw();
 for(const m of fixtures){
  assert.equal(m.status,'completed');
  assert.equal(m.scoreA,3);assert.equal(m.scoreB,2);
  assert.equal([m.a,m.a2,m.b,m.b2].join(','),scored.get(m.id),'a live or scored fixture was rewired');
 }
}
for(const seed of [1000,2000,3000])checkOpponentDraw(seed,false,false);
checkOpponentDraw(1731,true,false);
checkOpponentDraw(2700,false,true);
checkOpponentDraw(1800,false,false,true);
console.log('PASS Team Showdown 8 vs 8: full partner/opponent coverage, continuous dispatch, late arrival and division offsets');
