/* PADEL 5IVE · Continuously dispatched Americano · development only */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';let html=fs.readFileSync(file,'utf8');
function swap(a,b,label){const n=html.split(a).length-1;if(n!==1)throw Error(label+' anchor count '+n);html=html.replace(a,b);}
const engine=fs.readFileSync('public/assets/p5-continuous-v1.js','utf8');
swap('window.P5EngineRegistry=(function()',engine+'\nwindow.P5EngineRegistry=(function()','insert pure scheduler before engine registry');
swap("stage:'setup',mode:'',session:'',", "stage:'setup',mode:'',matchFlow:'',continuous:null,session:'',", 'new session default Match Flow');
swap('s.rules=s.rules||P5AdvancedRules.blank();',"s.matchFlow=s.matchFlow??(s.stage==='setup'?'':'rounds');s.continuous=s.continuous||null;s.rules=s.rules||P5AdvancedRules.blank();",'legacy session migration');
const field='<label class="p5-b2-wide" id="p5-match-flow-field" '+"${game==='Americano'?'':'style=\"display:none\"'}"+'>MATCH FLOW<select id="setup-match-flow"><option value="" '+"${!s.matchFlow?'selected':''}"+'>Select match flow</option><option value="rounds" '+"${s.matchFlow==='rounds'?'selected':''}"+'>By Rounds</option><option value="continuous" '+"${s.matchFlow==='continuous'?'selected':''}"+'>Court by Court</option></select><small class="p5-match-flow-help" aria-live="polite">Choose how matches progress.</small></label>';
swap('    <label>COURTS<select id="setup-courts">', '    '+field+'\n    <label>COURTS<select id="setup-courts">','setup Match Flow field');
swap("  const value=pairing.value,styles=", "  const flowRow=document.getElementById('p5-match-flow-field');if(flowRow){flowRow.hidden=game.value!=='Americano';flowRow.style.display=game.value==='Americano'?'':'none';const hint=flowRow.querySelector('.p5-match-flow-help');const flow=document.getElementById('setup-match-flow')?.value;if(hint)hint.textContent=flow==='rounds'?'All courts finish before the next round starts.':flow==='continuous'?'Next match starts when a court becomes free.':'Choose how matches progress.';}\n  const value=pairing.value,styles=",'hide flow for Mexicano');
swap("s.matchFormat=fmt;", "s.matchFormat=fmt;s.matchFlow=game==='Americano'?$('setup-match-flow')?.value||'':'rounds';s.continuous=null;",'persist setup match flow');
swap("if(!courtsText||", "if(game==='Americano'&&!['rounds','continuous'].includes($('setup-match-flow')?.value))return toast('Select Match Flow');\n  if(!courtsText||", 'require Match Flow in Americano setup');
swap("const ready=Boolean($('setup-session')", "const ready=Boolean((game.value!=='Americano'||['rounds','continuous'].includes($('setup-match-flow')?.value))&&$('setup-session')", 'match flow required for Continue button');
const flowHelpCSS="\n/* PR52 — two plain-language match flow choices; help updates with selection. */\n#americano #p5-match-flow-field .p5-match-flow-help {\n display:block!important;width:100%!important;margin:8px 1px 0!important;\n padding:0!important;min-height:16px!important;font-size:11px!important;\n line-height:1.45!important;letter-spacing:0!important;text-transform:none!important;\n font-style:normal!important;font-weight:400!important;color:#aebbc6!important;\n text-align:left!important;white-space:normal!important;\n}\n";
const styleEnd=html.lastIndexOf('</style>');if(styleEnd<0)throw Error('Match Flow stylesheet missing');html=html.slice(0,styleEnd)+'\n'+flowHelpCSS+html.slice(styleEnd);
const changeMarker="document.addEventListener('change',e=>{";
if(html.includes(changeMarker))swap(changeMarker,changeMarker+"if(e.target?.id==='setup-match-flow')syncSetup();", 'watch Match Flow selection on iPhone');
else throw Error('Missing setup event change listener');
const continuousUI=" function continuousStage1(s){\n  const c=s.continuous,summary=P5Continuous.verify(s),running=P5Continuous.active(s);\n  const confirmed=s.rounds.flatMap(r=>(r.matches||[]).filter(m=>m?.confirmed)).slice(-8).reverse();\n  const cards=Array.from({length:s.courts},(_,i)=>{const match=running.find(m=>m.court===i+1);return card(s,match||null,i,false)}).join('');\n  const pool=s.roster.filter(p=>!(s.sitout||[]).includes(p.id));\n  const onCourt=new Set(running.flatMap(m=>m.teams.flat()));\n  const rest=pool.filter(p=>!onCourt.has(p.id));\n  const finishedCycle=summary.fullCycleDone;\n  const cta=finishedCycle?`<div class=\"p5-cont-cycle-complete\"><strong>CYCLE ${c.cycle} COMPLETE</strong><p>All ${c.total} unique fixtures have been confirmed. No opponents repeated in this cycle.</p><button type=\"button\" class=\"primary\" data-act=\"continuous-next-cycle\">Start Next Cycle</button></div>`:`<div class=\"p5-cont-actions\"><button type=\"button\" data-act=\"continuous-pause\">${c.paused?'Resume Court Dispatch':'Pause New Matches'}</button><button type=\"button\" class=\"primary\" data-act=\"continuous-finish\">Finish Stage 1</button></div>`;\n  const history=confirmed.length?`<details class=\"p5-cont-history\"><summary>Completed Matches · ${summary.completed}</summary>${confirmed.map(m=>`<div><span>C${m.court} · ${esc(team(s,m.teams[0]))} vs ${esc(team(s,m.teams[1]))}</span><b>${m.score?.join('–')||''}</b></div>`).join('')}</details>`:'';\n  return `${menu(s)}${identity(s,'LIVE')}<div class=\"stats\"><div class=\"stat\"><strong>${summary.completed}/${c.total}</strong><small>CONFIRMED / CYCLE</small></div><div class=\"stat\"><strong>${summary.remaining}</strong><small>QUEUED FIXTURES</small></div><div class=\"stat\"><strong>${summary.inProgress}</strong><small>COURTS PLAYING</small></div></div><div class=\"layout\"><div><div class=\"card p5-v26-round-card p5-cont-stage\"><div class=\"row between p5-v26-round-title\"><h2>CONTINUOUS AMERICANO · LIVE COURTS</h2><span class=\"badge\">CYCLE ${c.cycle}${c.paused?' · PAUSED':''}</span></div><p class=\"muted p5-cont-desc\">Each court receives its next eligible fixture as soon as the score is confirmed. No full-round gate.</p><div class=\"p5-stage1-score-grid p5-cont-courts\">${cards}</div><div class=\"p5-cont-rest\"><b>RESTING / AVAILABLE</b><span>${rest.map(p=>esc(p.names.join(' & '))).join(' · ')||'None'}</span></div>${cta}${history}</div></div><aside>${standing(s)}</aside></div>`;\n }";
swap(' function stage1(s){',continuousUI+'\n function stage1(s){if(s.matchFlow===\'continuous\')return continuousStage1(s);','continuous dashboard route');
const oldProgress="const progress=stage2?`KO ${s.ko?.history?.length||0} confirmed · ${s.ko?.active?.length||0} active`:`Round ${Math.min(s.currentRound+1,s.rounds.length)}/${s.rounds.length} · ${done(s)}/${total(s)} scored`;";
const newProgress="const progress=stage2?`KO ${s.ko?.history?.length||0} confirmed · ${s.ko?.active?.length||0} active`:s.matchFlow==='continuous'&&s.continuous?`Continuous Cycle ${s.continuous.cycle} · ${done(s)}/${s.continuous.total} scored`:`Round ${Math.min(s.currentRound+1,s.rounds.length)}/${s.rounds.length} · ${done(s)}/${total(s)} scored`;";
swap(oldProgress,newProgress,'header continuous progress');
const controller=" function setContinuousArrival(id,ready){P5Availability.hydrate(s);s.availabilityById[String(id)]=ready?P5Availability.ACTIVE:P5Availability.NOT_ARRIVED;P5Availability.sync(s);}\n function canReshuffleContinuous(){return s.stage==='stage1'&&s.matchFlow==='continuous'&&!!s.continuous&&!s.rounds.some(r=>(r.matches||[]).some(m=>m?.cycle===s.continuous.cycle&&m.confirmed));}\n function startContinuous(){\n  const before=clone(s);snapshot();\n  try{\n   const plan=continuousCyclePlan();\n   s.stage='stage1';s.initialSchedule=clone(plan);s.initialCourts=s.courts;s.ko=null;\n   s.sitout=[];s.sitoutPending={};s.availabilityById=Object.fromEntries(s.roster.map(p=>[p.id,P5Availability.ACTIVE]));P5Availability.sync(s);s.pendingParticipants=[];\n   P5Continuous.create(s,plan);s.ui.contArrivalOpen=true;s.ui.contHistoryOpen=false;s.ui.contHistoryCycle=1;s.ui.contHistoryRound=0;\n   if(!P5Continuous.verify(s).valid)throw Error('Continuous schedule failed integrity validation');\n   if(!save())throw Error('Unable to store the tournament locally');\n   render();toast('Continuous Americano · court-by-court dispatch started');\n  }catch(e){s=before;undo.pop();render();toast('Continuous start rejected: '+e.message);}\n }\n function resetContinuous(){\n  modal('confirm','Reset Continuous Stage 1?','Reset the entire Continuous schedule and clear Stage 1 scores. Participant names remain unchanged. This action can be undone before reloading.',()=>{\n   const before=clone(s);snapshot();\n   try{const plan=clone(s.initialSchedule||[]);s.sitout=[];s.sitoutPending={};s.pendingParticipants=[];P5Continuous.create(s,plan);\n    if(!save())throw Error('Storage full');render();}\n   catch(e){s=before;undo.pop();render();toast('Reset failed: '+e.message);}\n  });\n }\n function continuousArrivalToggle(id){\n  const p=s.roster.find(p=>p.id===id);if(!p)return;\n  if(!canReshuffleContinuous()){\n   if(s.arrival?.[id]!==false)return toast('Opening matches already started · use Sit Out for active participants');\n   const before=clone(s);snapshot();\n   try{setContinuousArrival(id,true);P5Continuous.dispatch(s);\n    logAction('Late arrival checked in · '+p.names.join(' & '));\n    if(!save())throw Error('Storage failed');render();toast('Checked in · future eligible courts updated without reshuffle');}\n   catch(e){s=before;undo.pop();save();render();toast('Late check-in failed: '+e.message);}return;\n  }\n  const before=clone(s);snapshot();\n  try{setContinuousArrival(id,s.arrival[id]===false);P5Continuous.reshuffleOpening(s,random);\n   if(!save())throw Error('Storage failed');render();}\n  catch(e){s=before;undo.pop();save();render();toast('Arrival change rejected: '+e.message);}\n }\n function continuousReshuffle(){\n  if(!canReshuffleContinuous())return toast('Opening reshuffle is locked after first score');\n  const before=clone(s);snapshot();\n  try{P5Continuous.reshuffleOpening(s,random);logAction('Continuous Cycle '+s.continuous.cycle+' · opening reshuffled');\n   if(!save())throw Error('Storage failed');render();toast('Opening fixtures reshuffled');}\n  catch(e){s=before;undo.pop();save();render();toast('Reshuffle rejected: '+e.message);}\n }\n function finishContinuous(route='final'){\n  if(s.stage!=='stage1'||s.matchFlow!=='continuous')return;\n  if(P5Continuous.active(s).length)return alertModal('Active Courts Still Playing','Confirm all running match scores first. You may pause new dispatches at any time.');\n  if(!P5UI.done(s))return alertModal('No Confirmed Results','Score at least one match before finishing the tournament.');\n  const c=s.continuous,missing=c.queue.length;\n  modal('confirm',route==='ko'?'Continue to Stage 2?':'Finish Continuous Tournament?',`Use ${P5UI.done(s)} confirmed matches. ${missing?missing+' unplayed fixtures remain excluded.':'Full cycle complete.'} All cycle histories and confirmed scores are preserved.`,()=>{\n   const before=clone(s);snapshot();\n   try{s.stage=route==='ko'?'stage1finished':'champion';c.paused=true;s.qualification=null;s.ko=route==='ko'?null:{champion:[P5UI.statistics(s)[0]?.id].filter(Boolean),format:'none',rounds:[],roundIndex:0,teams:[]};\n    logAction('Continuous '+(route==='ko'?'Stage 2 qualification':'Tournament')+' confirmed · '+P5UI.done(s)+' matches');s.ui.modal=null;\n    if(!save())throw Error('Storage unavailable');render();}\n   catch(e){s=before;undo.pop();render();toast('Finish failed: '+e.message);}\n  });\n }";
function continuousCyclePlan(){
  if(s.mode==='fp-americano')return [];
  const ids=s.roster.map(p=>p.id),structured=P5Structured.is(s);
  const base=P5AdvancedRules.constrained(s)?P5AdvancedRules.build(s,random):structured?P5Structured.build(s,random):ENG[s.mode].build(ids,s.courts,random);
  return P5Fair532.optimize(base,[],ids,random,{coaches:P5AdvancedRules.coachIds(s),structured,availableIds:ids});
 }
 function changeContinuousCourts(next){
  const before=clone(s);
  try{
   s.pendingCourts=next===s.courts?null:next;
   P5Continuous.dispatch(s);
   if(!P5Continuous.verify(s).valid)throw Error('Continuous schedule failed integrity validation');
   const queued=s.pendingCourts!=null;
   logAction(queued?'Continuous court change queued · '+next:'Continuous courts active · '+s.courts);
   s.ui.modal=null;
   if(!save())throw Error('Unable to save court change');
  }catch(error){
   s=before;
   render();
   return toast('Court change rejected: '+error.message);
  }
  undo.push(JSON.stringify({...before,ui:undefined}));
  if(undo.length>80)undo.shift();
  redo=[];
  render();
  toast(s.pendingCourts?next+' courts queued · closing courts finish their active matches first':s.courts+' courts active');
 }
 function startNextContinuousCycle(){
  if(s.stage!=='stage1'||s.matchFlow!=='continuous'||!P5Continuous.complete(s))return;
  const before=clone(s);
  try{
   applyPendingParticipants();
   s.needsAvailabilityRebuild=false;
   s.availabilityById=Object.fromEntries(s.roster.map(p=>[p.id,P5Availability.ACTIVE]));
   s.sitoutPending={};
   P5Availability.sync(s);
   P5Continuous.nextCycle(s,continuousCyclePlan());
   if(!P5Continuous.verify(s).valid)throw Error('Continuous schedule failed integrity validation');
   s.ui.contHistoryOpen=false;
   s.ui.contHistoryCycle=s.continuous.cycle;
   s.ui.contHistoryRound=0;
   s.ui.contArrivalOpen=true;
   if(!save())throw Error('Unable to store the tournament locally');
  }catch(e){
   s=before;
   render();
   return toast('Next cycle could not start: '+e.message);
  }
  undo.push(JSON.stringify({...before,ui:undefined}));
  if(undo.length>80)undo.shift();
  redo=[];
  render();
 }
swap(' function start(){collectRegistration();',[continuousCyclePlan,startNextContinuousCycle,changeContinuousCourts].map(fn=>fn.toString()).join('\n')+'\n'+controller+'\n function start(){collectRegistration();','continuous controller functions');
swap('  const engine=ENG[s.mode];snapshot();try{',"  if(s.matchFlow==='continuous')return startContinuous();\n  const engine=ENG[s.mode];snapshot();try{",'route registration start');
swap('function findMatch(id,ko=false){const matches=ko?s.ko?.rounds[s.ko.roundIndex]?.matches:s.rounds[s.viewRound]?.matches;',"function findMatch(id,ko=false){const matches=ko?s.ko?.rounds[s.ko.roundIndex]?.matches:s.matchFlow==='continuous'?s.rounds.flatMap(r=>r.matches||[]):s.rounds[s.viewRound]?.matches;",'find live match across all continuous court rounds');
swap('s.ui.modal=null;save();render();toast(ko?',"s.ui.modal=null;if(!ko&&s.matchFlow==='continuous'&&!alreadyConfirmed){applySitoutQueue();P5Continuous.dispatch(s);}save();render();toast(ko?",'release court after confirmed score');
swap("if(ko)P5KO.confirm(s,m.id,[a,b]);","const alreadyConfirmed=!!m.confirmed;\n   if(ko)P5KO.confirm(s,m.id,[a,b]);",'identify historical correction before dispatch');
swap(' function finish(skipBalanceCheck=false){'," function finish(skipBalanceCheck=false){if(s.matchFlow==='continuous')return finishContinuous();",'finish continuous without fabricated round gate');
swap("   case 'score':scoreModal", "   case 'continuous-pause':if(s.matchFlow==='continuous'&&s.continuous){snapshot();s.continuous.paused=!s.continuous.paused;if(!s.continuous.paused)P5Continuous.dispatch(s);save();render();}break;\n   case 'continuous-next-cycle':startNextContinuousCycle();break;\n   case 'continuous-finish':finishContinuous('final');break;\n   case 'continuous-stage2':finishContinuous('ko');break;\n   case 'continuous-arrival-open':s.ui.contArrivalOpen=!s.ui.contArrivalOpen;render();break;\n   case 'continuous-arrival-toggle':continuousArrivalToggle(Number(el.dataset.id));break;\n   case 'continuous-reshuffle':continuousReshuffle();break;\n   case 'score':scoreModal",'continuous actions');
swap("function action(act,el,scoreSide){if(!", "function action(act,el,scoreSide){if(s.matchFlow==='continuous'&&s.stage==='stage1'&&act==='reset-stage1')return resetContinuous();\n  if(s.matchFlow==='continuous'&&s.stage==='stage1'&&['next-round','advance-schedule','fill-empty-court'].includes(act))return toast('Continuous: pause and finish active fixtures before changing the fixture cycle.');\n  if(!",'disable round-specific actions in continuous');
swap('if(x.rounds.length)P5EngineRegistry.validateSchedule(x.rounds,{...x,roster:x.roster});',"if(x.rounds.length){if(x.matchFlow==='continuous'){if(!P5Continuous.verify(x).valid)throw Error('Continuous fixture integrity failure');}else P5EngineRegistry.validateSchedule(x.rounds,{...x,roster:x.roster});}",'safe backup import for continuous data');
swap('if(next===s.courts){s.pendingCourts=null;', "if(s.stage==='stage1'&&s.matchFlow==='continuous')return changeContinuousCourts(next);if(next===s.courts){s.pendingCourts=null;",'route Continuous court changes');
swap('if(s.stage!=="stage1"||!flexibleRoundScoring(s)||!s.pendingCourts||!currentDone())',
 "if(s.stage!=='stage1'||s.matchFlow==='continuous'||!flexibleRoundScoring(s)||!s.pendingCourts||s.pendingParticipants?.length||!currentDone())",'route court changes by flow and keep queued roster changes together');
swap("} · Next Round</button>", "} · Next ${s.matchFlow==='continuous'?'Cycle':'Round'}</button>",'show Add Participant timing');
swap('Participants join only after the active round is fully scored. Historical fixtures remain intact.',
 "${s.matchFlow==='continuous'?'Participants join at the start of the next cycle.':'Participants join only after the active round is fully scored.'} Historical fixtures remain intact.",'explain enrollment timing');
swap("m.type==='add-live'?'Queue for Next Round'", "m.type==='add-live'?(s.matchFlow==='continuous'?'Queue for Next Cycle':'Queue for Next Round')",'label participant queue action');
swap("title:ENG[s.mode].kind==='individual'?'Add Player · Next Round':'Add Fixed Pair · Next Round'", "title:ENG[s.mode].kind==='individual'?'Add Player':'Add Fixed Pair'",'keep participant dialog title consistent');
swap("queued · joins the next round.", "queued · joins the next ${s.matchFlow==='continuous'?'cycle':'round'}.",'confirm participant queue timing');
swap('Change active court capacity. Court changes queue until the active round is finished. Protected later rounds retain their fixtures; untouched rounds are repacked.',
 "${s.matchFlow==='continuous'&&s.stage==='stage1'?'New courts can start as soon as a fixture is eligible. Courts being closed finish their current matches first.':'Change active court capacity. Court changes queue until the active round is finished. Protected later rounds retain their fixtures; untouched rounds are repacked.'}",'explain Continuous court adjustments');
swap('court change queued for the next eligible round.', "court change queued ${s.matchFlow==='continuous'&&s.stage==='stage1'?'until closing courts finish.':'for the next eligible round.'}",'show correct pending court status');
swap('  if(s.viewRound!==s.currentRound){s.viewRound=s.currentRound;render();return;}',
 '  if(s.viewRound!==s.currentRound&&!(forceAdvance&&flexibleRoundScoring(s))){s.viewRound=s.currentRound;render();return;}','apply queued changes from Americano round navigation');
swap('   const changedSitout=applySitoutQueue(),added=applyPendingParticipants();', `   if(forceAdvance&&flexibleRoundScoring(s)){
    // The scoring view can finish several rounds before applying roster changes.
    while(s.currentRound+1<s.rounds.length){
     const next=s.rounds[s.currentRound+1].matches.filter(Boolean);
     if(!next.length||!next.every(m=>m.confirmed))break;
     s.currentRound++;
    }
   }
   const changedSitout=applySitoutQueue(),added=applyPendingParticipants();`,'keep completed rounds during roster advancement');
swap('P5EngineRegistry.validateFreshRound(s.rounds[s.currentRound],s.rounds.slice(0,s.currentRound),s);save();render();',
 'P5EngineRegistry.validateFreshRound(s.rounds[s.currentRound],s.rounds.slice(0,s.currentRound),s);if(added)s.needsAvailabilityRebuild=false;save();render();','avoid rebuilding the same roster change twice');
swap("try{const plan=clone(s.initialSchedule||[]);s.sitout=[];s.sitoutPending={};s.pendingParticipants=[];P5Continuous.create(s,plan);",
 `try{
    s.availabilityById=Object.fromEntries(s.roster.map(p=>[p.id,P5Availability.ACTIVE]));
    P5Availability.sync(s);
    s.pendingParticipants=[];s.pendingCourts=null;s.needsAvailabilityRebuild=false;
    const saved=clone(s.initialSchedule||[]);
    const scheduledIds=new Set(saved.flatMap(r=>r.matches.filter(Boolean).flatMap(m=>m.teams.flat())));
    const sameRoster=scheduledIds.size===s.roster.length&&s.roster.every(p=>scheduledIds.has(p.id));
    const keepPlan=s.mode==='fp-group-stage'||(s.initialCourts===s.courts&&sameRoster);
    P5Continuous.create(s,keepPlan?saved:continuousCyclePlan());`,'reset uses current roster and capacity');
const css="\n#americano .p5-cont-stage .p5-v26-ondeck-line > span:only-child{grid-column:1/-1}\n/* Continuous Americano · same native dashboard components */\n#americano .p5-cont-stage .p5-cont-desc{margin:8px 0 14px;line-height:1.6;font-size:12px;color:#b4c2cb}\n#americano .p5-cont-courts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px}\n#americano .p5-cont-courts .court{min-width:0;min-height:160px}\n#americano .p5-cont-actions{display:flex;flex-wrap:wrap;gap:10px;margin:17px 0}\n#americano .p5-cont-actions button{min-height:44px;min-width:160px;flex:1}\n#americano .p5-cont-rest{display:flex;flex-wrap:wrap;gap:9px;border:1px solid #4d585d;background:#1a252d;border-radius:10px;padding:12px;margin:15px 0;color:#b7c4c6;font-size:11px;line-height:1.6}\n#americano .p5-cont-rest b{color:#d6bd94;white-space:nowrap}\n#americano .p5-cont-history{margin:15px 0;border-top:1px solid #3e4b52;padding-top:12px}\n#americano .p5-cont-history summary{font-size:12px;color:#e1c5a1;cursor:pointer}\n#americano .p5-cont-history>div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #38464e;font-size:11px}\n#americano .p5-cont-history>div>b{white-space:nowrap;color:#edce9c}\n#americano .p5-cont-cycle-complete{border:1px solid #8c7959;background:#2a302d;border-radius:12px;padding:16px;margin:17px 0;display:grid;gap:10px}\n#americano .p5-cont-cycle-complete strong{letter-spacing:.12em;color:#ebd5af;font-size:12px}\n#americano .p5-cont-cycle-complete p{font-size:12px;color:#c0c9c8;margin:0}\n#americano .p5-cont-cycle-complete button{min-height:44px}\n@media(max-width:700px){#americano .p5-cont-courts{grid-template-columns:1fr}#americano .p5-cont-actions button{min-width:0}#americano .p5-cont-rest{display:block}}\n";
const end=html.lastIndexOf('</style>');if(end<0)throw Error('No final stylesheet');html=html.slice(0,end)+'\n/* PADEL 5IVE LAB CONTINUOUS */\n'+css+'\n'+html.slice(end);
fs.writeFileSync(file,html);console.log('Continuous Americano integrated using shared registration, dashboard, score, KO and reporting');