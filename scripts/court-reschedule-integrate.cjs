'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='public/modes/unified/index.html';let src=fs.readFileSync(file,'utf8');
if(src.includes('P5-PR29-PROTECTED-COURT-RESCHEDULING'))process.exit(0);
function replace(a,b){assert(src.includes(a),'Missing: '+a.slice(0,70));src=src.replace(a,b);}
const helper=[
' /* P5-PR29-PROTECTED-COURT-RESCHEDULING */',
' function p5ProtectedCourtReschedule(state,random){',
'  const start=arguments.length>2&&Number.isInteger(arguments[2])?arguments[2]:state.currentRound+1,original=state.rounds,limit=state.courts,todo=[];',
'  const locked=new Set();let lastLocked=start-1;',
'  for(let i=start;i<original.length;i++){',
'   const rd=original[i],ms=(rd.matches||[]).filter(Boolean);',
'   if(ms.some(m=>m.confirmed||m.score!=null||m.skipped)||rd.balancing){',
'    locked.add(i);lastLocked=i;',
'    if(ms.length>limit||ms.some(m=>(m.court||0)>limit))throw Error("Protected Round "+(i+1)+" has court assignments above new capacity; cannot downsize.");',
'   }else for(const m of ms)todo.push({...m,teams:m.teams.map(t=>t.slice())});',
'  }',
'  const out=original.slice(0,start),ids=state.roster.map(p=>p.id);',
'  const count=Object.fromEntries(ids.map(id=>[id,0])),last=Object.create(null);',
'  function note(rd,i){for(const m of (rd.matches||[]))if(m)for(const id of m.teams.flat()){count[id]=(count[id]||0)+1;last[id]=i;}}',
'  for(let i=0;i<start;i++)note(original[i],i);',
'  for(let i=start;i<original.length||todo.length;i++){',
'   if(locked.has(i)){out.push(original[i]);note(original[i],i);continue;}',
'   const chosen=[],used=new Set();',
'   let futureOpen=0;for(let r=i+1;r<=lastLocked;r++)if(!locked.has(r))futureOpen++;',
'   const available=Math.floor(ids.filter(id=>!(state.sitout||[]).includes(id)).length/((state.mode==="individual-americano"||state.mode==="structured-americano")?4:2));',
'   const cap=Math.min(limit,available,Math.max(1,todo.length-futureOpen));',
'   while(chosen.length<cap&&todo.length){',
'    let pick=-1,best=Infinity;',
'    for(let j=0;j<todo.length;j++){',
'     const ms=todo[j].teams.flat();if(ms.some(id=>used.has(id)))continue;',
'     const weight=ms.reduce((v,id)=>v+(count[id]||0),0)*30+ms.filter(id=>last[id]===i-1).length*7+j*.03+random()*.0001;',
'     if(weight<best){pick=j;best=weight;}',
'    }',
'    if(pick<0)break;',
'    const m=todo.splice(pick,1)[0];chosen.push(m);m.teams.flat().forEach(id=>used.add(id));',
'   }',
'   if(!chosen.length){',
'    if(i>lastLocked&&todo.length===0)break;',
'    out.push({index:i,matches:[],protectedGap:true});continue;',
'   }',
'   const matches=chosen.map((m,c)=>({...m,id:"R"+i+"C"+c,court:c+1,score:null,confirmed:false,skipped:false}));',
'   const row={index:i,matches,repacked:true};out.push(row);note(row,i);',
'   if(i>1500)throw Error("Repacking overflow");',
'  }',
'  const seen=new Set();',
'  for(const rd of out){const active=new Set();for(const m of rd.matches||[])if(m){',
'   if(seen.has(m.id))throw Error("Duplicate match ID "+m.id);seen.add(m.id);',
'   for(const id of m.teams.flat()){if(active.has(id))throw Error("Player in multiple courts");active.add(id);}',
'  }}',
'  return out;',
' }',
''].join("\n");
replace(' function nextRound(forceAdvance=false){',helper+' function nextRound(forceAdvance=false){');
replace('let changedRoster=changedSitout||added;','let changedRoster=changedSitout||added,courtOnly=false;');
replace('if(!ENG[s.mode].dynamic)changedRoster=true;\n    s.courts=next;','if(!ENG[s.mode].dynamic){changedRoster=true;courtOnly=!changedSitout&&!added;}\n    s.courts=next;');
const start=src.indexOf('   if(changedRoster&&!ENG[s.mode].dynamic){'),end=src.indexOf('   if(s.currentRound+1>=s.rounds.length){',start);
assert(start>=0&&end>start,'future rebuild boundary');assert(src.slice(start,end).includes('P5Recovery.rebuild(s,random)'));
const branch=[
'   if(changedRoster&&!ENG[s.mode].dynamic){',
'    if(courtOnly){s.rounds=p5ProtectedCourtReschedule(s,random);}',
'    else{',
'     if(s.rounds.slice(s.currentRound+1).some(rd=>(rd.matches||[]).some(m=>m?.confirmed||m?.score!=null)))',
'      throw Error("Protected future scores prevent roster-based schedule rebuild.");',
'     const future=P5Structured.is(s)?P5Structured.rebuild(s,random):P5AdvancedRules.constrained(s)?P5AdvancedRules.rebuild(s,random):P5Recovery.rebuild(s,random);',
'     const prefix=s.rounds.slice(0,s.currentRound+1);',
'     const optimized=P5Fair532.optimize(future,prefix,s.roster.map(p=>p.id),random,',
'      {coaches:P5AdvancedRules.coachIds(s),structured:s.mode==="structured-americano",availableIds:s.roster.map(p=>p.id).filter(id=>!s.sitout.includes(id))});',
'     if(P5CourtRotation.applies(s))P5CourtRotation.allocate(s,optimized,prefix);',
'     s.rounds=prefix.concat(optimized);',
'    }',
'   }',
''].join("\n");
src=src.slice(0,start)+branch+src.slice(end);
replace("if(s.stage==='stage1'&&!currentDone())return alertModal('Finish Round First','Complete all scores in the active round before changing courts.');","// Stage 1 court changes can be queued before the current round is finished.");
replace("if(next===s.courts){s.ui.modal=null;render();return toast('Court count unchanged');}","if(next===s.courts){s.pendingCourts=null;s.ui.modal=null;save();render();return toast('Court count unchanged · queued change cleared');}");
replace('A running round must be scored before Stage 1 court changes; live Knockout assignments remain protected.','Court changes queue until the active round is finished. Protected later rounds retain their fixtures; untouched rounds are repacked.');
replace('</div>\${arrivalPanel}</div><aside>\${standing(s)}<div class="card p5-v26-session-control">','</div>\${arrivalPanel}<div class="card p5-v26-session-control">');
const tick=String.fromCharCode(96);
const panel=src.indexOf('<div class="card p5-v26-session-control">');
const panelEnd=src.indexOf('</aside></div>'+tick,panel);
assert(panel>=0&&panelEnd>panel,'missing Stage1 Session Control closing layout');
src=src.slice(0,panelEnd)+'</div><aside>${standing(s)}</aside></div>'+src.slice(panelEnd+'</aside></div>'.length);
replace('if(s.viewRound!==s.currentRound){s.viewRound=s.currentRound;render();return;}',
 'if(s.viewRound!==s.currentRound){s.viewRound=s.currentRound;if(!(forceAdvance&&flexibleRoundScoring(s))){render();return;}}');
replace('active&&r<s.rounds.length-1&&((s.pendingParticipants||[]).length||Object.keys(s.sitoutPending||{}).length||s.pendingCourts)?',
 's.currentRound<s.rounds.length-1&&((s.pendingParticipants||[]).length||Object.keys(s.sitoutPending||{}).length||s.pendingCourts)?');

// Automatic court changes on Americano: preserve PR27 browse-any-round scoring.
const auto=[
' /* P5-PR29-AUTO-COURT-APPLY */',
' function p5AutoApplyQueuedCourtChange(){',
'  if(s.stage!=="stage1"||!flexibleRoundScoring(s)||!s.pendingCourts||!currentDone())return false;',
'  const requested=s.pendingCourts,old=clone(s);',
'  try{',
'   let boundary=s.currentRound;',
'   while(boundary<s.rounds.length){',
'    const matches=(s.rounds[boundary]?.matches||[]).filter(Boolean);',
'    if(!matches.length||!matches.every(m=>m.confirmed))break;',
'    boundary++;',
'   }',
'   if(boundary>=s.rounds.length){s.pendingCourts=null;return false;}',
'   s.courts=requested;',
'   s.currentRound=boundary;',
'   s.rounds=p5ProtectedCourtReschedule(s,random,boundary);',
'   P5EngineRegistry.validateSchedule(s.rounds,s);',
'   s.pendingCourts=null;',
'   logAction("Court capacity automatically updated · "+requested+" courts · future schedule from Round "+(boundary+1));',
'   return true;',
'  }catch(error){',
'   s=old;s.pendingCourts=null;',
'   toast("Court change not applied · "+error.message);',
'   return false;',
'  }',
' }',
''].join("\n");
replace(' function changeCourt(){',auto+' function changeCourt(){');
replace('else{m.score=[a,b];m.confirmed=true;m.skipped=false;}',
 'else{m.score=[a,b];m.confirmed=true;m.skipped=false;if(s.pendingCourts&&typeof p5AutoApplyQueuedCourtChange==="function")p5AutoApplyQueuedCourtChange();}');
const triggerStart=src.indexOf(' function changeCourt(){');
const triggerEnd=src.indexOf(' function resetStage1(',triggerStart);
assert(triggerStart>=0&&triggerEnd>triggerStart,'changeCourt boundaries');
const block=src.slice(triggerStart,triggerEnd);
const queueTick=String.fromCharCode(96);
const pending="s.pendingCourts=next;s.ui.modal=null;logAction('Court change queued · '+next);save();render();toast("+queueTick+"$"+"{next} courts queued for the next round."+queueTick+");";
assert(block.includes(pending),'expected court queue branch');
const improved=[
'if(flexibleRoundScoring(s)&&next<s.courts){',
'   const invalid=s.rounds.findIndex((rd,i)=>i>s.currentRound&&(rd.matches||[]).some(m=>(m?.confirmed||m?.score!=null)&&(m.court||0)>next));',
'   if(invalid>=0)return alertModal("Cannot Reduce Courts","Round "+(invalid+1)+" contains a scored fixture on a court above the requested capacity. Keep that court or finish the affected fixtures first.");',
'  }',
'  snapshot();s.pendingCourts=next;s.ui.modal=null;',
'  const applied=typeof p5AutoApplyQueuedCourtChange==="function"&&p5AutoApplyQueuedCourtChange();',
'  if(applied){save();render();return toast(next+" courts active · remaining unscored rounds updated automatically.");}',
'  logAction("Court capacity queued automatically · "+next);save();render();',
'  if(!s.pendingCourts&&s.courts!==next)return;',
'  toast(flexibleRoundScoring(s)?next+" courts selected · future schedule updates automatically after the current round is complete.":next+" courts queued for the next round.");'
].join('\n  ');
src=src.slice(0,triggerStart)+block.replace(pending,improved)+src.slice(triggerEnd);
replace('s.currentRound<s.rounds.length-1&&((s.pendingParticipants||[]).length||Object.keys(s.sitoutPending||{}).length||s.pendingCourts)?',
 's.currentRound<s.rounds.length-1&&((s.pendingParticipants||[]).length||Object.keys(s.sitoutPending||{}).length)?');
replace('Apply Pending Changes · Advance Schedule','Apply Participant Changes · Advance Schedule');

fs.writeFileSync(file,src);console.log('PASS PR29 integrated');
