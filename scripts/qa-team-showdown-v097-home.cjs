/* PADEL 5IVE v0.9.7 HOME / Team Showdown staging-only integration QA.
 * Focus on three format routes, local-history preservation and Cloud.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('public/index.html');
const native=read('public/modes/club-match/v097/index.html');
const legacy=read('public/modes/club-match/index.html');
const cloud=read('public/phase58/cloud-home.js');
const history=read('public/phase57/home-session-history.js');
const nativeResume=read('public/v097/home-resume.js');
const source=read('scripts/team-showdown-v097-stage.cjs');
const must=(s,x)=>assert(s.includes(x),'Expected marker not found: '+x);
const count=(s,x)=>s.split(x).length-1;
must(home,'>Team Showdown</span>');
must(home,'Classic · Multi-Division · Individual Americano');
for(const id of ['classic','multi','individual'])must(home,"'"+id+"'");
must(home,"modes/club-match/v097/?intent=new&competition=");
must(home,"modes/club-match/v097/?intent=resume");
must(nativeResume,"modes/club-match/v097/?intent=resume");
must(home,'/v097/home-resume.js');
must(home,"'padel5ive-team-showdown-v090-individual-lab'");
must(home,"const activeClub=()=>");
must(home,"const activeV097=()=>");
assert(!home.slice(home.indexOf('  function renderResume(){'),home.indexOf('  function chooseMode(m){')).includes('activeV097'),'Legacy renderResume() must remain testable unchanged');
must(home,"data-mode=\"Club Match\"");
must(native,"if(['classic','multi','individual'].includes(selected))state.setup.competitionFormat=selected");
must(source,'v0.9.7 source integrity mismatch');
must(cloud,"const native097=kind==='club'");
must(cloud,"'p58-cloud-link-v097-club'");
must(cloud,"'/modes/club-match/v097/?intent=resume'");
must(history,"kind==='v'?");
must(history,"padel5ive-team-showdown-native-v07-archive");
must(history,"/modes/club-match/v097/?intent=");
must(legacy,'v5.5.16');
must(legacy,'Share Final Results Link');
assert(!legacy.includes("padel5ive-team-showdown-v090-individual-lab"),'Legacy master state must stay isolated');
assert.equal(count(home,"modes/club-match/v097/?intent=new&competition="),1,'Format launch must be unique');
for(const [name,s] of [['HOME',home],['v0.9.7',native]]){
  let i=0;
  for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
    if(/\bsrc\s*=/.test(m[1])||!m[2].trim())continue;
    new vm.Script(m[2],{filename:name+':inline-'+i++});
  }
}
for(const [name,s] of [['cloud-home',cloud],['history',history],['native-resume',nativeResume]])
 new vm.Script(s,{filename:name+'.js'});
console.log('PASS Team Showdown v0.9.7: HOME routes 3 formats; isolated local/history/Cloud; legacy intact');
