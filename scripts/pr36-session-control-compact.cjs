'use strict';
/* PR36 compact Session Control: two clear actions, history with results.
   Leaves scheduler, confirmed matches, modal actions and iPad split view untouched. */
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 SESSION CONTROL: quiet two-action layout */';
if(html.includes(marker)){
 console.log('PASS PR36 Session Control compact already applied');process.exit(0);
}
function replaceOnce(oldValue,newValue,label){
 const n=html.split(oldValue).length-1;
 if(n!==1)throw Error('PR36 Session Control: '+label+' expected once, found '+n);
 html=html.replace(oldValue,newValue);
}
const desc='<p>${P5Structured.is(s)?\'End the session at any time after confirming at least one score. Unplayed fixtures stay excluded from final standings; no Stage 2.\':!P5EngineRegistry.meta(s.mode).dynamic?\'Moderator may finish Stage 1 at any time. Only CONFIRMED scores determine standings and KO seeds; pending matches become Not Played.\':\'Finish the current round when possible. The completed leaderboard determines Knockout seeds.\'}</p>';
replaceOnce(desc,'','long explanatory text');
const origActions='<div class="tools"><button data-act="view-schedule">${s.ui.fullSchedule?\'Hide\':\'View\'} Full Schedule</button>${!P5AdvancedRules.constrained(s)&&!P5Structured.is(s)&&P5MatchBalance.summary(s).gap>0?\'<button type="button" data-act="balance-check" class="p5-b44-check">Check Match Balance</button>\':\'\'}</div>';
const newActions='<div class="tools p5-pr36-session-actions"><button type="button" data-act="view-schedule" aria-expanded="${s.ui.fullSchedule?\'true\':\'false\'}">${s.ui.fullSchedule?\'Hide History\':\'View Full History\'}</button><button type="button" class="primary p5-pr36-session-finish" data-act="finish-stage1">${P5Structured.is(s)?\'Finish Session\':\'Finish \'+mode(s)} →</button></div>';
replaceOnce(origActions,newActions,'two primary actions');
replaceOnce('<button type="button" class="primary full" style="margin-top:12px" data-act="finish-stage1">${P5Structured.is(s)?\'Finish Session\':\'Finish \'+mode(s)} →</button></div></div><aside>', '</div></div><aside>','duplicate finish button');
// The expanded view retains the full schedule and shows results for scored matches.
const oldRow='<p class="muted">Court ${j+1}: ${esc(team(s,m.teams[0]))} vs ${esc(team(s,m.teams[1]))}</p>';
const newRow='<p class="muted">Court ${m.court||j+1}: ${esc(team(s,m.teams[0]))} × ${esc(team(s,m.teams[1]))} <strong class="p5-pr36-history-score">${m.confirmed&&Array.isArray(m.score)?m.score.join(\'–\'):(m.skipped?\'Not Played\':\'Pending\')}</strong></p>';
replaceOnce(oldRow,newRow,'history score display');
// Keep the optional Match Balance tool available inside expanded history,
// but never show a third action in the compact at-a-glance panel.
const endHistory="`).join('')}</div>`:''}";
const historyPart="`).join('')}</div>${!P5AdvancedRules.constrained(s)&&!P5Structured.is(s)&&P5MatchBalance.summary(s).gap>0?'<div class=\"p5-pr36-history-tools\"><button type=\"button\" data-act=\"balance-check\" class=\"p5-b44-check\">Check Match Balance</button></div>':''}`:''}";
replaceOnce(endHistory,historyPart,'optional advanced balance tool');
const css=`
${marker}
#americano .p5-v26-session-control{padding:15px 16px 16px!important}
#americano .p5-v26-session-control>h2{margin:0 0 12px!important;font-size:14px!important;letter-spacing:.055em!important;line-height:1.35!important}
#americano .p5-v26-session-control>.p5-pr36-session-actions{
 display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.14fr)!important;
 gap:9px!important;align-items:stretch!important;margin:0!important;padding:0!important
}
#americano .p5-v26-session-control>.p5-pr36-session-actions>button{
 width:100%!important;min-width:0!important;min-height:44px!important;
 margin:0!important;padding:10px 9px!important;border-radius:9px!important;
 font-size:12px!important;font-weight:650!important;line-height:1.2!important;
 white-space:normal!important;letter-spacing:0!important;text-align:center!important
}
#americano .p5-v26-session-control>.p5-pr36-session-actions>button:first-child{
 color:#e5e2dc!important;background:#283641!important;border:1px solid #56616a!important
}
#americano .p5-v26-session-control>.p5-pr36-session-actions>button.p5-pr36-session-finish{
 background:#ceb18a!important;color:#1b2530!important;border:1px solid #ddbf96!important
}
#americano .p5-v26-session-control .p5-v26-full-schedule{
 margin-top:12px!important;max-height:340px!important
}
#americano .p5-v26-session-control .p5-pr36-history-score{color:#e0c29d!important;font-weight:650!important}
#americano .p5-v26-session-control .p5-pr36-history-tools{margin-top:9px}
@media screen and (max-width:360px){
 #americano .p5-v26-session-control>.p5-pr36-session-actions{gap:7px!important}
 #americano .p5-v26-session-control>.p5-pr36-session-actions>button{font-size:11px!important;padding:9px 6px!important}
}
`;
const styleClose=html.lastIndexOf('</style>'),bodyClose=html.lastIndexOf('</body>');
if(styleClose<0||bodyClose<styleClose||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyClose)))throw Error('PR36 session control: closing style/body location changed');
html=html.slice(0,styleClose)+css+html.slice(styleClose);
if(html.split(marker).length!==2)throw Error('PR36 session control: duplicate CSS marker');
fs.writeFileSync(file,html);
console.log('PASS PR36 Session Control: compact two actions, history with score, optional advanced balance');