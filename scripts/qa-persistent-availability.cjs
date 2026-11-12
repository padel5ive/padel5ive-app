'use strict';
// Actual production-source check: persistent participation across all six engines.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const env={};env.window=env;vm.createContext(env);
const run=(code,label)=>vm.runInContext(code,env,{timeout:120000,filename:label});
function scriptAt(needle){
 const i=html.indexOf(needle);assert(i>=0,'Missing '+needle);
 const open=html.lastIndexOf('<script',i),from=html.indexOf('>',open)+1,end=html.indexOf('</script>',i);
 assert(end>i&&open>=0,'Script bounds '+needle);
 run(html.slice(from,end),needle);
}
function until(a,b){const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 assert(i>=0&&j>i,'Script bounds '+a);run(html.slice(i,j),a);}
scriptAt('const rr9=');
scriptAt('window.P5EngineFP=(function');
scriptAt('window.P5EngineMX=(function');
scriptAt('window.P5EngineIndividual=(function');
scriptAt('window.P5Recovery=(function');
run(fs.readFileSync('public/assets/p5-fair-cycle-v5515.js','utf8'),'fair-cycle');
until('window.P5Fair532=(function','/* PADEL 5IVE Phase 5.0.4');
until('window.P5HistorySmart=(function','/* PADEL 5IVE Phase 5.0 · OPTIONAL ADVANCED RULES');
until('window.P5AdvancedRules=(function','/* Phase 5.0: isolated Mexicano');
until('window.P5EngineIndividualMX=(function','/* PADEL 5IVE Phase 5.1');
until('window.P5Structured=(function','/* PADEL 5IVE Phase 5.2');
until('window.P5StructuredMX=(function','/* PADEL 5IVE Phase 5.3.4');
until('window.P5StructuredCycle534=(function','/* PADEL 5IVE Phase 5.3.4 | Structured Mexicano');
until('window.P5StructuredMX534=(function','/* PADEL 5IVE 5.4.13.5');
until('window.P5CourtRotation=(function','window.P5EngineRegistry=');
const registryStart=html.indexOf('window.P5EngineRegistry=(function'),
registryEnd=html.indexOf('})();',registryStart);
run(html.slice(registryStart,registryEnd+5),'engine registry');
env.ENG=Object.fromEntries(env.P5EngineRegistry.modes().map(d=>[d.id,env.P5EngineRegistry.engine(d.id)]));
for(const asset of ['p5-structured-fairness-lab.js','p5-structured-irregular-lab.js','p5-structured-mexicano-diversity-lab.js'])
 run(fs.readFileSync('public/assets/'+asset,'utf8'),asset);
run(fs.readFileSync('public/assets/p5-coach-opponent-diversity-lab.js','utf8'),'coach-diversity');
const start=html.indexOf(' function p5SyncAvailability(){');
const end=html.indexOf(' function sitoutToggle(',start);
assert(start>=0&&end>start,'Availability helper source is missing');
run(html.slice(start,end),'production availability controller');
function rng(seed=54){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
function make(mode,n,c,off,rules={}){
 const roster=Array.from({length:n},(_,i)=>({id:i+1,names:['P'+(i+1)],group:i<n/2?'A':'B'}));
 return {stage:'stage1',mode,roster,courts:c,currentRound:0,viewRound:0,rounds:[],sitout:[],manualSitout:[],sitoutPending:{},
 arrival:Object.fromEntries(roster.map(p=>[p.id,!off.includes(p.id)])),
 groupConfig:{labels:['Left','Right']},
 rules:{fixedEnabled:false,coachEnabled:false,pairs:[],coachIds:[],...rules}};
}
function inspect(rd,state,tag){
 const absent=new Set(state.sitout),seen=new Set();
 for(const m of (rd.matches||[]).filter(Boolean))for(const id of m.teams.flat()){
  assert(!absent.has(id),tag+' scheduled unavailable #'+id);
  assert(!seen.has(id),tag+' double booked #'+id);seen.add(id);
 }
}
let cases=0;
const state=make('individual-americano',16,2,[14,15,16],{coachEnabled:true,coachIds:[1]});
env.s=state;
run('p5SyncAvailability()','sync16');
assert.deepEqual(Array.from(env.s.sitout),[14,15,16]);
const all=env.P5AdvancedRules.build({...state,sitout:[]},rng(),{rounds:30});
const opening=env.P5AdvancedRules.makeRound(state,[],rng(123));
state.rounds=[opening,...all.slice(1)];
const future=run('p5RebuildAfterArrival(s.rounds,()=>0.4321)','rebuild coach');
assert(future.length>1,'Coach schedule must have Round 2+');
for(let i=0;i<future.length;i++){
 inspect(future[i],state,'Coach R'+(i+1));
 assert(future[i].matches.some(m=>m&&m.teams.flat().includes(1)),'Coach missing R'+(i+1));
}
assert.equal(future[0],opening,'Do not replace opening');
assert(opening.matches.every(m=>!m.confirmed),'Do not fake-confirm R1');
cases++;
for(const [mode,n,c,off] of [
 ['individual-americano',16,2,[14,15,16]],
 ['fp-americano',10,2,[9,10]],
 ['structured-americano',12,2,[6,12]]
]){
 const state=make(mode,n,c,off);env.s=state;run('p5SyncAvailability()','sync '+mode);
 const active=state.roster.map(p=>p.id).filter(id=>!off.includes(id));
 let opening;
 if(mode==='structured-americano'){
  const copy={...state,rounds:[],currentRound:0};
  opening=env.P5Structured.makeRound(copy,[],rng(55));
 }else if(mode==='fp-americano'){
  opening=env.P5EngineFP.build(active,c,rng(44))[0];
 }else{
  opening=env.P5EngineIndividual.build(active,c,rng(44))[0];
 }
 state.rounds=[opening,...Array.from({length:24},(_,i)=>({index:i+1,matches:[]}))];
 const after=run('p5RebuildAfterArrival(s.rounds,()=>0.4321)','rebuild '+mode);
 assert(after.length>=2,mode+' future rounds missing');
 for(let i=0;i<after.length;i++)inspect(after[i],state,mode+' R'+(i+1));
 assert(after[0]===opening,mode+' original opening not preserved');
 cases++;
}
const legacy=make('fp-mexicano',8,2,[8]);delete legacy.manualSitout;legacy.sitout=[7];env.s=legacy;
run('p5SyncAvailability()','legacy hydrate');
assert.deepEqual(Array.from(legacy.sitout).sort((a,b)=>a-b),[7,8]);
legacy.sitoutPending={7:false,8:false};
run('p5PendingAvailability()','pending check');
const applyStart=html.indexOf(' function applySitoutQueue(){'),applyEnd=html.indexOf(' function fillEmptyCourts(){',applyStart);
assert(applyStart>=0&&applyEnd>applyStart,'Queue controller source missing');
run(html.slice(applyStart,applyEnd),'queue controller');
run('applySitoutQueue()','apply return');
assert(!legacy.sitout.length&&legacy.arrival[8]===true,'Return must remove both absence causes');
cases++;
for(const [mode,n,off] of [
 ['fp-mexicano',10,[9,10]],['individual-mexicano',12,[11,12]],['structured-mexicano',12,[6,12]]
]){
 const st=make(mode,n,2,off);env.s=st;run('p5SyncAvailability()','sync '+mode);
 const ranking=st.roster.map(p=>({id:p.id,points:0}));
 const next=env.P5EngineRegistry.engine(mode).next(st,ranking,rng());
 inspect(next,st,mode);cases++;
}

/* Browser-controller regression: mark Not Arrived in R1, press Reshuffle,
 * then confirm R1 and activate a late arrival for R2 via leaderboard.
 * No live sessions or data are modified.
 */
env.clone=v=>JSON.parse(JSON.stringify(v));
env.undo=[];env.snapshot=()=>env.undo.push('checkpoint');
env.save=()=>true;env.render=()=>{};env.logAction=()=>{};
env.toast=()=>{};env.alertModal=(title,msg)=>{throw Error(title+': '+msg)};
env.random=rng(111);
env.P5UI={statistics:st=>st.roster.map(p=>({id:p.id,points:0}))};
const live=make('individual-americano',16,2,[],{coachEnabled:true,coachIds:[1]});
live.ui={fullSchedule:false};env.s=live;
live.rounds=env.P5AdvancedRules.build(live,rng(449),{rounds:30});
for(const id of [14,15,16])live.arrival[id]=false;
run('p5SyncAvailability()','R1 absence controller');
assert(live.sitout.length===3,'R1 absence must persist in canonical sitout');
run('reshuffleArrival()','actual R1 arrival reshuffle');
assert(!live.sitoutPending||!Object.keys(live.sitoutPending).length);
assert(live.rounds.length>1);
for(let i=0;i<live.rounds.length;i++)inspect(live.rounds[i],live,'browser reshuffle R'+(i+1));
assert([14,15,16].every(id=>live.arrival[id]===false),'Reshuffle silently marked absent players arrived');
cases++;
for(const m of live.rounds[0].matches.filter(Boolean)){m.confirmed=true;m.score=[3,2];}
live.sitoutPending[14]=false;
env.currentDone=()=>env.s.rounds[env.s.currentRound].matches.filter(Boolean).every(m=>m.confirmed);
env.applyPendingParticipants=()=>false;
env.flexibleRoundScoring=()=>true;
env.closeMenu=()=>{};
const nextStart=html.indexOf(' function nextRound(forceAdvance=false){');
const nextEnd=html.indexOf(' function showBalance(){',nextStart);
assert(nextStart>=0&&nextEnd>nextStart,'Next Round controller bounds');
run(html.slice(nextStart,nextEnd),'production nextRound');
run('nextRound(true)','R2 apply late-arrival return');
assert(live.sitout.includes(15)&&live.sitout.includes(16),'Other missing players were activated by Return');
assert(!live.sitout.includes(14)&&live.arrival[14]===true,'Returning player not activated');
assert(live.currentRound===1,'Round 2 was not advanced');
assert(live.rounds.slice(1).some(rd=>rd.matches.filter(Boolean).some(m=>m.teams.flat().includes(14))),'Returned player absent from all future rounds');
for(let i=1;i<live.rounds.length;i++)inspect(live.rounds[i],live,'late-arrival R'+(i+1));
cases++;

assert(html.includes('if(flexibleRoundScoring(s)&&!forceAdvance&&p5PendingAvailability())'),'Round browser skips availability');
assert(html.includes('Not Arrived stays inactive in every round'),'Prematch instruction stale');
assert(!html.includes('full roster returns Round 2'),'Auto-arrival legacy behavior remains');
cases+=3;
console.log('PASS P5 PERSISTENT AVAILABILITY',cases,'checks: 16p/2C coach, three Americano formats, 3 Mexicano formats, restore, return & scoring guards');
