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
must(home,"modes/club-match/v097/?intent=new");
must(home,"modes/club-match/v097/?intent=resume");
must(nativeResume,"modes/club-match/v097/?intent=resume");
must(home,'/v097/home-resume.js');
must(home,"'padel5ive-team-showdown-v090-individual-lab'");
must(home,"const activeClub=()=>");
must(home,"const activeV097=()=>");
assert(!home.slice(home.indexOf('  function renderResume(){'),home.indexOf('  function chooseMode(m){')).includes('activeV097'),'Legacy renderResume() must remain testable unchanged');
must(home,"data-mode=\"Club Match\"");
assert(!native.includes("q.get('competition')"),'Native engine owns competition format choice');
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
assert.equal(count(home,"modes/club-match/v097/?intent=new"),1,'Single direct Team Showdown launch route required');
assert(!home.includes("['classic','Classic · Fixed Partner'"),'Duplicate HOME format picker must not exist');
assert(!home.includes("if(m==='Club Match'){mode=m;continueToMode();return;}"),'Team Showdown must NOT auto-launch');
assert(home.includes("if(club){"),'Team Showdown must have a selection-only branch');
assert(home.includes("sub.classList.remove('p54-show')"),'No HOME pairing panel for Team Showdown');
assert(home.includes("document.getElementById('p54-continue').addEventListener('click',continueToMode)"),'Continue click must be the only way to launch');
const chooseStart=home.indexOf('  function chooseMode(m){');
const chooseEnd=home.indexOf('  function closeConfirm(){',chooseStart);
const continueStart=home.indexOf('  function continueToMode(){',chooseEnd);
const continueEnd=home.indexOf("  document.getElementById('p54-start').addEventListener",continueStart);
assert(chooseStart>0&&chooseEnd>chooseStart&&continueStart>chooseEnd&&continueEnd>continueStart,'HOME navigation extraction markers');
const choose=home.slice(chooseStart,chooseEnd),continueFn=home.slice(continueStart,continueEnd);
const elements=new Map();
function node(id){
 if(!elements.has(id)){
  const classes=new Set();
  elements.set(id,{id,disabled:true,textContent:'',innerHTML:'',replaceChildren(){this.innerHTML='';this.replaced=true},
   classList:{add(c){classes.add(c)},remove(c){classes.delete(c)},contains(c){return classes.has(c)}}});
 }
 return elements.get(id);
}
const buttons=['Americano','Mexicano','Club Match'].map(mode=>({dataset:{mode},setAttribute(k,v){this[k]=v}}));
const context={
 console,
 document:{querySelectorAll:(q)=>q.startsWith('.p54-mode')?buttons:[],
  getElementById:node},
 activeV097:()=>null,activeUnified:()=>null,
 roots:{unified:'modes/unified/'},route:()=>{throw Error('Legacy route used for Team Showdown')},
 launch:(url)=>{context.launches.push(url)},launches:[]
};
vm.runInNewContext(
 "let mode='',pairing='fixed',target='',pendingWhich='';"+choose+continueFn+
 "chooseMode('Club Match');this.selected={mode,pairing};",context);
assert.equal(context.selected.mode,'Club Match');
assert.equal(context.launches.length,0,'Selecting Team Showdown must stay on Game Mode screen');
assert.equal(node('p54-continue').disabled,false,'Continue must be enabled after selecting');
assert.equal(node('p54-subpanel').classList.contains('p54-show'),false,'No duplicated Team Showdown format panel');
assert.equal(node('p54-options').replaced,true,'Previous mode pairing options must be cleared');
assert.equal(buttons[2]['aria-pressed'],'true','Team Showdown selection should highlight');
vm.runInNewContext('continueToMode();',context);
assert.equal(context.launches.length,1,'Only tapping Continue launches Team Showdown');
assert.equal(context.launches[0],'modes/club-match/v097/?intent=new');
vm.runInNewContext("chooseMode('Mexicano');this.mexPair=pairing;",context);
assert.equal(node('p54-subpanel').classList.contains('p54-show'),true,'Mexicano pairing selector must still appear');
assert.match(node('p54-options').innerHTML,/Structured Pairing/,'Mexicano options preserved');
assert.equal(context.mexPair,'flexible');
vm.runInNewContext("chooseMode('Americano');",context);
assert.equal(node('p54-subpanel').classList.contains('p54-show'),true,'Americano pairing selector must still appear');
assert.match(node('p54-options').innerHTML,/Fixed Partner/,'Americano options preserved');
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
