'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
function source(a,b){
 const start=html.indexOf(' function '+a+'('),end=html.indexOf(' function '+b+'(',start+10);
 assert(start>=0&&end>start,'Missing production function '+a+' → '+b);
 return html.slice(start,end);
}
const js=source('flexibleRoundScoring','card')+source('p5AppendExtendedRound','nextRound')+source('nextRound','showBalance');
new vm.Script(js);
assert(html.includes('P5-PR29-FLEX-EXTRA-ROUND'),'Add Extra Round code must be installed');
const q=String.fromCharCode(96);
assert(html.includes('r===s.rounds.length-1?'+q+'<button type="button" class="p5-537-extra-round" data-act="next-round">+ Add Extra Round</button>'+q+':'),'Extra Round button visible at final viewed round regardless of currentRound');
assert(!html.includes('Before adding an extended round, confirm the'),'No all-scores-required error should remain');
let extensions=0,coachExtensions=0,structuredExtensions=0,notices=[],errors=[];
const ctx={
 s:null,random:()=>0.5,toast:t=>notices.push(t),render(){},p5PendingAvailability:()=>false,
 clone:v=>structuredClone(v),save(){return true},
 snapshot(){ctx.undo.push('snapshot')},undo:[],
 alertModal:(title,msg)=>errors.push({title,msg}),
 ENG:{'fp-americano':{dynamic:false},'fp-mexicano':{dynamic:true},'individual-americano':{dynamic:false},'structured-americano':{dynamic:false}},
 P5Structured:{is:s=>s.mode==='structured-americano',extend(s){
  structuredExtensions++;
  assert.equal(s.currentRound,s.rounds.length-1,'Structured extension should use newest round for fairness');
  return {index:s.rounds.length,matches:[{id:'R'+s.rounds.length+'C0',court:1,teams:[[1,2],[3,4]],score:null,confirmed:false}]};
 }},
 P5AdvancedRules:{constrained:s=>s.mode==='individual-americano'&&s.coachId===1,makeRound(s,rows){
  coachExtensions++;
  assert.equal(s.currentRound,s.rounds.length-1,'Coach rest recovery uses latest round, not PR27 browser checkpoint');
  const eligible=s.roster.map(p=>p.id).filter(id=>!(s.sitout||[]).includes(id));
  assert(!s.sitout.includes(s.coachId),'Coach cannot be Sit Out in this scenario');
  const others=eligible.filter(id=>id!==s.coachId);
  return {index:rows.length,matches:[{id:'R'+rows.length+'C0',court:1,teams:[[s.coachId,others[0]],[others[1],others[2]]],score:null,confirmed:false}]};
 }},
 P5Recovery:{extend(s){
  extensions++;
  assert.equal(s.currentRound,s.rounds.length-1,'Recovery engine must use most recent round for rest fairness');
  const active=s.roster.map(p=>p.id).filter(id=>!(s.sitout||[]).includes(id));
  if(active.length<2)throw Error('Not enough active pairs');
  return {index:s.rounds.length,matches:[{id:'R'+s.rounds.length+'C0',court:1,teams:[[active[0]],[active[1]]],score:null,confirmed:false}],extended:true};
 }},
 P5EngineRegistry:{validateFreshRound(rd,history,s){
  assert(rd.matches.length<=s.courts,'Court capacity respected');
  const ids=new Set(history.flatMap(row=>row.matches.filter(Boolean).map(m=>m.id)));
  const used=new Set();
  for(const m of rd.matches){
   assert(!ids.has(m.id),'New round IDs unique');assert(m.court<=s.courts,'No court above capacity');
   for(const id of m.teams.flat()){assert(!used.has(id),'Player not on multiple courts');used.add(id);}
  }
 }},
};
vm.createContext(ctx);vm.runInContext(js,ctx);
const rounds=Array.from({length:24},(_,r)=>({index:r,matches:[
 {id:'R'+r+'C0',court:1,teams:[[1],[2]],score:null,confirmed:false},
 {id:'R'+r+'C1',court:2,teams:[[3],[4]],score:null,confirmed:false}
]}));
for(const m of rounds[0].matches){m.confirmed=true;m.score=[3,2];}
rounds[19].matches[0].confirmed=true;rounds[19].matches[0].score=[4,1];
rounds[23].matches[0].confirmed=true;rounds[23].matches[0].score=[3,2];
const roster=Array.from({length:12},(_,i)=>({id:i+1,names:['P'+(i+1)]}));
const before=JSON.stringify(rounds);
ctx.s={mode:'fp-americano',stage:'stage1',roster,sitout:[12],courts:2,rounds,currentRound:0,viewRound:23,ui:{},pendingCourts:null};
assert.equal(vm.runInContext('flexibleRoundScoring(s)',ctx),true);
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.rounds.length,25,'Append R25 despite pending earlier matches');
assert.equal(ctx.s.viewRound,24,'Display new R25');assert.equal(ctx.s.currentRound,0,'Checkpoint unchanged');
assert.equal(JSON.stringify(ctx.s.rounds.slice(0,24)),before,'Past fixture and score history immutable');
assert(ctx.s.rounds[24].matches[0].teams.flat().every(id=>id!==12),'Sit Out excluded');
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.rounds.length,26,'Allow R26 even if R25 has no score');
assert.equal(JSON.stringify(ctx.s.rounds.slice(0,24)),before);assert.equal(extensions,2);
ctx.s.viewRound=4;vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.viewRound,5,'PR27 free round browsing preserved');assert.equal(ctx.s.rounds.length,26);
ctx.s.viewRound=25;ctx.s.mode='fp-mexicano';vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.viewRound,ctx.s.currentRound,'Mexicano remains sequential');assert.equal(ctx.s.rounds.length,26);
ctx.s.mode='individual-americano';ctx.s.coachId=1;ctx.s.viewRound=25;
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.rounds.length,27,'Coach-constrained Individual Americano extends');
assert.equal(coachExtensions,1);assert(ctx.s.rounds[26].matches[0].teams.flat().includes(1));
ctx.s.mode='structured-americano';ctx.s.coachId=null;ctx.s.viewRound=26;ctx.s.sitout=[];
vm.runInContext('nextRound()',ctx);
assert.equal(ctx.s.rounds.length,28,'Structured Americano extends');
assert.equal(structuredExtensions,1);assert.equal(errors.length,0,'No errors: '+JSON.stringify(errors));
console.log('PASS PR29 Extra Rounds: append R25/R26 with pending scores; protect old results; PR27 navigation; Mexicano gate; Coach, Sit Out and Structured.');
