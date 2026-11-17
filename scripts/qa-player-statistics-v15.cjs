/* PADEL 5IVE First Edition v1.5 · read-only Player Statistics QA */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('public/modes/unified/index.html');
const js=read('public/assets/p5-player-statistics-v15.js');
const path='/assets/p5-player-statistics-v15.js';
assert.equal(app.split('src="'+path+'"').length-1,1,'Single asset included in shared Unified dashboard');
assert(app.includes('P5 PLAYER STATISTICS V15'),'Premium modal stylesheet installed');
assert(app.includes('p5-leaderboard-privacy'),'Hide / Show Leaderboard feature remains installed');
assert(app.includes('data-act="manage-participant"'),'Original participant management route not removed');
assert(app.includes('window.P5App='),'Engine retained');
const unavailable=/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.setItem\s*\(|window\.P5App\.render\s*\()/;
assert(!unavailable.test(js),'Read-only viewer must not mutate Cloud, cache or scoring');
assert(!js.includes('P5App.setState'),'Viewer cannot modify a saved state');
const ctx={
 window:{},
 document:{readyState:'loading',addEventListener(type,listener){assert.equal(type,'DOMContentLoaded');}},
 MutationObserver:class {constructor(callback){this.callback=callback;}observe(){}disconnect(){}},
 console,
};
vm.runInNewContext(js,ctx,{timeout:3000,filename:'p5-player-statistics-v15.js'});
const run=ctx.window.P5PlayerStatsV15?.analyze;
assert.equal(typeof run,'function','Pure analysis function available');
const roster=[
 {id:101,names:['Agus']},{id:102,names:['Vania']},{id:103,names:['Maria']},{id:104,names:['Neta']},
 {id:105,names:['Lusi']},{id:106,names:['Eve']}
];
const state={
 stage:'stage1',mode:'individual-americano',roster,
 rounds:[
  {index:0,matches:[
   {id:'R0C0',court:1,confirmed:true,teams:[[101,102],[103,104]],score:[4,1]},
   {id:'R0C1',court:2,confirmed:true,teams:[[105,106],[103,101]],score:[2,2]}
  ]},
  {index:1,matches:[
   {id:'R1C0',court:2,confirmed:true,teams:[[102,103],[101,104]],score:[1,4]},
   {id:'R1C1',court:1,confirmed:false,teams:[[101,105],[104,106]],score:null}
  ]},
  {index:2,matches:[{id:'R2C0',court:1,confirmed:false,teams:[[101,103],[102,106]],score:[0,0]}]}
 ]
};
const stateBefore=JSON.stringify(state);
const official=[{id:101,name:'Agus',w:2,l:0,t:1,p:10,diff:6,g:3},{id:102,w:1,l:1,t:0,p:5,diff:-1,g:2},{id:105,w:0,l:0,t:1,p:2,diff:0,g:1}];
const result=run(state,official,101);
assert.equal(result.rank,1);
assert.equal(result.type,'PLAYER');
assert.equal(result.name,'Agus');
assert.equal(result.played,3);
assert.equal(result.w,2);
assert.equal(result.l,0);
assert.equal(result.t,1);
assert.equal(result.winRate,67);
assert.equal(result.points,10);
assert.equal(result.diff,6);
assert.equal(result.scored,10);
assert.equal(result.conceded,4);
assert.equal(result.avgScored,10/3);
assert.equal(result.avgConceded,4/3);
assert.equal(result.history.length,5);
assert.equal(result.history.filter(x=>x.completed).length,3);
assert.equal(result.history.filter(x=>!x.completed).length,2);
assert.equal(result.history[0].own,'Agus & Vania');
assert.equal(result.history[0].other,'Maria & Neta');
assert.equal(result.history[0].result,'W');
assert.equal(result.history[0].round,1);
assert.equal(result.history[0].court,1);
assert.equal(result.history[1].result,'T');
assert.equal(result.history[2].result,'W');
assert.equal(result.history[3].result,'UPCOMING');
assert.equal(result.history[4].result,'UPCOMING');
assert(result.paired.some(x=>x.name==='Vania'&&x.count===1));
assert(result.paired.some(x=>x.name==='Neta'&&x.count===1));
assert(result.opposed.some(x=>x.name==='Maria'&&x.count===2),'Opponent Maria encountered in both Round 1 and Round 2');
assert(result.opposed.some(x=>x.name==='Neta'&&x.count===1));
assert.equal(JSON.stringify(state),stateBefore,'Statistics must leave tournament data untouched');
const fpState={
 mode:'fixed-americano',stage:'stage1',
 roster:[{id:1,names:['Frans','Fred']},{id:2,names:['Andry','Diki']},{id:3,names:['Bram','Felix']}],
 rounds:[
  {index:0,matches:[{id:'m1',court:1,confirmed:true,score:[5,0],teams:[[1],[2]]}]},
  {index:1,matches:[{id:'m2',court:2,confirmed:false,score:null,teams:[[3],[1]]}]}
 ]
};
const fp=run(fpState,[{id:1,w:1,l:0,t:0,p:5,diff:5,g:1}],1);
assert.equal(fp.type,'PAIR');
assert.equal(fp.name,'Frans & Fred');
assert.equal(fp.paired.length,0,'Fixed pair should not pretend to have dynamic teammates');
assert.equal(fp.opposed[0].name,'Andry & Diki');
assert.equal(fp.history.length,2);
assert.equal(fp.history[0].own,'Frans & Fred');
assert.equal(fp.history[1].own,'Frans & Fred');
const americano=run({...state,mode:'individual-mexicano'},official,101);
assert.equal(americano.played,3,'Mexicano uses same read-only stats algorithm');
assert.throws(()=>run(state,official,999),/not found/);
for(const check of [
 'P5App.getState()','P5App.statistics()',
 "m.teams[side]","round.matches","winRate","avgScored","avgConceded","p5ps-layer",
 "data-p5ps-edit","data-p5ps-status","p5ps-attendance-switch","data-p5ps-close","MutationObserver","aria-modal","MATCH HISTORY",
 'MOST PAIRED','MOST OPPOSED','UPCOMING'
])assert(js.includes(check),'Missing Player Stats component: '+check);
assert(app.includes('.p5ps-panel'),'Stats modal CSS missing');
assert(js.includes('const edit=editable?'), 'Edit pencil must be shown only for editable Stage 1');
assert(js.includes('const openNative=(intent)=>'), 'Edit and participation must reuse native controller');
assert(js.includes("const mode=intent==='edit'?'name':'participation'"), 'Edit pencil and switch must open distinct scoped editor purposes');
assert(js.includes("openNative('edit')"), 'Name pencil must open the name-only editor');
assert(js.includes("openNative(event.currentTarget.dataset.p5psStatus)"), 'Switch must open the status-only editor');
assert(js.includes('nativeRoot.dataset.p5psContext=mode'), 'Editor must set its visual context');
assert(js.includes('delete nativeRoot.dataset.p5psContext'), 'Editor context must clear on modal closure');
assert(app.includes('data-p5ps-context="name"] .p5-b3-participant-editor .p5-b31-status-editor'), 'Edit Name must hide Active/Sit Out controls');
assert(app.includes('data-p5ps-context="participation"] .p5-b3-participant-editor>label'), 'Participation must hide name inputs');
assert(app.includes('data-p5ps-context="participation"] .p5-b3-participant-editor>p.muted'), 'Participation must hide name-edit helper text');
assert(!js.includes('p5ps-footer'), 'Stats detail panel must not render a duplicate bottom Close or Save footer');
assert(js.includes('const closeIcon='), 'Statistics must keep single X close in header');
assert(js.includes('btn.click();'), 'Moderator action must flow through existing Manage Participant controller');
assert(js.includes('state.sitoutPending||{}'), 'Must show queued next-round participation status');
assert(js.includes('options.showStatus?participation'), 'Status bar should appear only during Stage 1');
assert(!js.includes('data-p5ps-manage'), 'Bottom Manage Pair button must be removed');
assert(app.includes('.p5ps-panel .p5ps-title-row'), 'Inline edit pencil alignment CSS');
assert(app.includes('.p5ps-panel .p5ps-close svg'), 'Precisely centered SVG close icon');
assert(app.includes('.p5ps-panel .p5ps-participation'), 'Compact top participation status');
assert(app.includes('.p5ps-panel .p5ps-attendance-switch'), 'A single Active/Sit Out switch must render');
assert(app.includes('.p5ps-panel .p5ps-switch-thumb'), 'Status switch thumb must remain aligned');
assert(js.includes('role="switch"'), 'Single participation control should be accessible');
assert(js.includes('aria-checked'), 'Status switch must report its state');
assert(js.includes("data-p5ps-status=\""), 'Switch must preserve native participant-toggle path');
assert(!js.includes('p5ps-status-controls'), 'Two-button status selector must be removed');
assert(js.includes('Changes apply next eligible round after saving'), 'Status must not imply immediate effect');
assert(app.includes('.p5ps-panel .p5ps-close svg'), 'SVG X size must be fixed');
assert(app.includes('max-height:94dvh'),'Mobile stats view must fit Safari');
assert(app.includes('v1.5.1 · Native Edit Player/Pair Name and Participation visual polish'),'Native participant modal refined');
assert(app.includes('P5 V152 INTERACTIVE PARTICIPATION SELECTOR'),'Native two-button selector integrated at build');
assert(app.includes('p5-b31-dual-choice'),'Shared availability selector uses two real buttons');
assert(app.includes('data-status="active"') && app.includes('data-status="sitout"'),'Both native availability action states exist');
assert(js.includes('root.P5Availability?.status'),'Stats status must use canonical PR36 Availability');
assert(js.includes("'not_arrived'"),'Stats must distinguish NOT_ARRIVED from SIT_OUT');
assert(app.includes('#p5-modal-root[data-p5ps-context] .p5-v2-modal{'),'Modal padding targets the actual global native dialog root');
assert(app.includes('#p5-modal-root[data-p5ps-context] .p5-b3-participant-editor>label{'),'Label spacing applies to actual native editor');
assert(app.includes('gap:11px!important;margin:0!important;padding:0!important'),'Label separated from input with explicit 11px gap');
assert(app.includes('min-height:50px!important;margin:0!important;padding:12px 15px!important'),'Native name input is sufficiently tall with interior padding');
assert(app.includes('padding:25px 22px 23px!important;border-radius:17px!important'),'iPhone modal maintains edge and content breathing room');
assert(app.includes('#p5-modal-root[data-p5ps-context] .p5-v2-modal .tools{'),'Modal Cancel/Save buttons retain alignment and spacing');
assert(!app.includes('id="p5ps-duplicate-close"'),'No redundant footer Close action');
console.log('PASS First Edition v1.5 Player/Pair Statistics: official rank, W/L/T, points, scored, completed/upcoming matches, partners/opponents and fixed pair, read-only');
