'use strict';
/* Let a moderator correct saved Mexicano scores without changing round sequencing. */
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file, 'utf8');

function replace(before, after) {
 const count = html.split(before).length - 1;
 if (count !== 1) throw Error('Mexicano score correction anchor count '+count+': '+before.slice(0, 90));
 html = html.replace(before, () => after);
}

const rules = ` function isLiveMexicano(session){
  return session.stage==='stage1'&&session.mode?.endsWith('-mexicano');
 }
 function mexicanoScoreCorrection(session,match,round=session.viewRound){
  return isLiveMexicano(session)&&round<=session.currentRound&&match?.confirmed===true;
 }
 function roundScoreLocked(session,match){
  return !flexibleRoundScoring(session)&&session.viewRound!==session.currentRound&&!mexicanoScoreCorrection(session,match);
 }
`;
replace(' function roundScoreState(round){', rules+' function roundScoreState(round){');
replace('menu,flexibleRoundScoring,matchNames});','menu,flexibleRoundScoring,isLiveMexicano,mexicanoScoreCorrection,roundScoreLocked,matchNames});');

replace('const locked=!flexibleRoundScoring(s)&&s.viewRound!==s.currentRound;', 'const locked=roundScoreLocked(s,m);');
replace('aria-label="Score Team ${j===0?\'A\':\'B\'}"', 'aria-label="${mexicanoScoreCorrection(s,m)?\'Edit score for\':\'Score\'} Team ${j===0?\'A\':\'B\'}"');
replace("${format(s)}${locked?' · Planned':m.confirmed?' · Edit score'", "${format(s,mexicanoScoreCorrection(s,m)?m:undefined)}${locked?' · Planned':m.confirmed?' · Edit score'");
replace(
 "${m.confirmed&&Array.isArray(m.score)?m.score.join('–'):(m.skipped?'Not Played':'Pending')}</strong></p>",
 "${m.confirmed&&Array.isArray(m.score)?m.score.join('–'):(m.skipped?'Not Played':'Pending')}</strong>${mexicanoScoreCorrection(s,m,i)?` <button type=\"button\" data-act=\"edit-mexicano-score\" data-round=\"${i}\" data-match=\"${esc(m.id)}\">Edit Score</button>`:''}</p>"
);

replace("m.type==='score'?'Confirm Score':m.type==='ko-edit'", "m.type==='score'?(m.correction?'Save Score':'Confirm Score'):m.type==='ko-edit'");
replace("m.type==='score'?'CONFIRM MATCH SCORE':esc(m.title)", "m.type==='score'?(m.correction?'EDIT MATCH SCORE':'CONFIRM MATCH SCORE'):esc(m.title)");

const oldModalStart = " function scoreModal(id,ko,side='a'){if(!ko&&s.needsAvailabilityRebuild)";
const newModalStart = ` function scoreModal(id,ko,side='a'){
  let m=findMatch(id,ko);
  const correction=!ko&&P5UI.mexicanoScoreCorrection(s,m);
  if(!ko&&!correction&&s.needsAvailabilityRebuild)`;
replace(oldModalStart,newModalStart);
replace("}const m=findMatch(id,ko);if(!m)return toast('Match not found');",
 "\n   m=findMatch(id,ko);\n  }\n  if(!m)return toast('Match not found');");
replace("if(!ko&&!flexibleRoundScoring(s)&&s.viewRound!==s.currentRound)return toast('Finish the current round before scoring another Mexicano round.');",
 "if(!ko&&P5UI.roundScoreLocked(s,m))return toast('Finish the current round before scoring another Mexicano round.');");
replace("  s.ui.modal={type:'score',title:'Confirm Score',match:m,ko};render();",
 "  s.ui.modal={type:'score',title:correction?'Edit Match Score':'Confirm Score',match:m,ko,correction};render();");
replace("   case 'edit-ko-result':",
 `   case 'edit-mexicano-score':{
    const round=Number(el.dataset.round),match=s.rounds[round]?.matches.find(m=>m?.id===el.dataset.match);
    if(!P5UI.mexicanoScoreCorrection(s,match,round))return toast('This score is unavailable for editing.');
    s.viewRound=round;
    scoreModal(match.id,false);
   }break;
   case 'edit-ko-result':`);

replace("m=s.ui.modal?.match,ko=s.ui.modal?.ko;\n  const f=ko?",
 "m=s.ui.modal?.match,ko=s.ui.modal?.ko;\n  const correction=!ko&&P5UI.mexicanoScoreCorrection(s,m);\n  const f=ko?");
replace('m.skipped=false;if(s.pendingCourts&&typeof p5AutoApplyQueuedCourtChange', 'm.skipped=false;if(!correction&&s.pendingCourts&&typeof p5AutoApplyQueuedCourtChange');
replace("logAction((ko?'KO':'Stage 1')+' score confirmed · '+m.id+' · '+a+'–'+b)",
 "logAction((ko?'KO':'Stage 1')+(correction?' score corrected · ':' score confirmed · ')+m.id+' · '+a+'–'+b)");
replace("P5Continuous.dispatch(s);}save();render();toast(ko?'KO score confirmed · free court dispatched':'Score confirmed');",
 "P5Continuous.dispatch(s);}if(!save()&&correction)throw Error('Unable to save the corrected score.');render();toast(correction?'Score updated · leaderboard recalculated':ko?'KO score confirmed · free court dispatched':'Score confirmed');");

// Reviewing a past round must not repack live courts due to a pending availability repair.
replace("   case 'round':if(s.needsAvailabilityRebuild)",
 `   case 'round':{
    const round=+el.dataset.round,viewingHistory=P5UI.isLiveMexicano(s)&&round<s.currentRound;
    if(s.needsAvailabilityRebuild&&!viewingHistory)`);
replace("s.viewRound=Math.max(0,Math.min(s.rounds.length-1,+el.dataset.round));render();break;",
 "s.viewRound=Math.max(0,Math.min(s.rounds.length-1,round));render();break;\n   }");

fs.writeFileSync(file, html);
console.log('PASS Mexicano score corrections: scoring UI, round guard and existing fixtures preserved');
