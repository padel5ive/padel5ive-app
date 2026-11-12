'use strict';
// PR36: score-format changes never reinterpret confirmed historical results.
const fs=require('node:fs'),file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 SAFE FORMAT EDIT · preserve confirmed match format */';
if(html.includes(marker)){console.log('PASS PR36 safe format edit already applied');process.exit(0)}
if(!html.includes('PR36 PANEL RHYTHM: 12px mobile Stage 1 spacing'))throw Error('Missing PR36 prerequisite');
function one(a,b,label){const n=html.split(a).length-1;if(n!==1)throw Error(label+' source drift '+n);html=html.replace(a,b)}
one("const format=s=>s.matchFormat==='total4'?'Total of 4':s.matchFormat==='total6'?'Total of 6':s.matchFormat==='first4'?'First to 4':s.matchFormat==='first5'?'First to 5':s.matchFormat==='first6'?'First to 6':'Total of 5';", "const format=(s,m)=>{const f=m?.matchFormat||s.matchFormat;return f==='total4'?'Total of 4':f==='total6'?'Total of 6':f==='first4'?'First to 4':f==='first5'?'First to 5':f==='first6'?'First to 6':'Total of 5';};",'format resolver');
one('<span><b>Match Format</b> ${esc(fmt)}</span>', '<span class="p5-pr36-format-field" ${s.stage===\'stage1\'?\'data-act="edit-match-format" role="button" tabindex="0" title="Tap to change future match format"\':\'\'}><b>Match Format</b> ${esc(fmt)}</span>', 'format trigger');
one("${ko?'Knockout · '+P5KO.formatLabel(P5KO.matchFormat(s.ko,m.final)):format(s)}", "${ko?'Knockout · '+P5KO.formatLabel(P5KO.matchFormat(s.ko,m.final)):format(s,m)}",'court format');
one("const fmt=m.type==='ko-edit'?P5KO.matchFormat(s.ko,m.final):m.ko?P5KO.matchFormat(s.ko,m.match.final):s.matchFormat;", "const fmt=m.type==='ko-edit'?P5KO.matchFormat(s.ko,m.final):m.ko?P5KO.matchFormat(s.ko,m.match.final):(m.match?.matchFormat||s.matchFormat);",'score modal format');
one("m.ko?P5KO.formatLabel(fmt):format(s)}</p>","m.ko?P5KO.formatLabel(fmt):format(s,m.match)}</p>",'score modal note');
const opts=[['total4','Total of 4'],['total5','Total of 5'],['total6','Total of 6'],['first4','First to 4'],['first5','First to 5'],['first6','First to 6']];
const selectOptions=opts.map(([v,t])=>`<option value="${v}" \${s.matchFormat==='${v}'?'selected':''}>${t}</option>`).join('');
const editor="const formatEditor=m.type==='match-format'?`<div class=\"p5-pr36-format-modal\"><label for=\"p5-change-match-format\">MATCH FORMAT<select id=\"p5-change-match-format\" aria-label=\"Match Format\">"+selectOptions+"</select></label><p class=\"muted\">New format applies to future unplayed rounds. Current and confirmed matches keep their original format.</p><p class=\"p5-pr36-format-warning\">Different formats affect raw Points and DIFF tie-breakers. Please consider ranking fairness before switching.</p></div>`:'';";
one("const content=m.type==='session-name'?sessionEditor:",editor+"\n  const content=m.type==='match-format'?formatEditor:m.type==='session-name'?sessionEditor:",'format modal');
one("const label=m.type==='session-name'?'Save Changes':","const label=m.type==='match-format'?'Save Changes':m.type==='session-name'?'Save Changes':",'modal button');
one("case 'edit-session-name':{","case 'edit-match-format':{if(s.stage!=='stage1'||document.body.classList.contains('p58-view-only')||window.P5CloudSession?.getStatus?.()?.role==='viewer')break;s.ui.modal={type:'match-format',title:'Edit Match Format'};render();}break;\n   case 'edit-session-name':{",'format action');
one("if(m.type==='session-name')renameSession();","if(m.type==='match-format')saveMatchFormat();else if(m.type==='session-name')renameSession();",'format save router');
const applyFormat=`function saveMatchFormat(){
 if(s.stage!=='stage1'||s.ui.modal?.type!=='match-format'||document.body.classList.contains('p58-view-only')||window.P5CloudSession?.getStatus?.()?.role==='viewer')return;
 const next=document.getElementById('p5-change-match-format')?.value,old=s.matchFormat;
 if(!['total4','total5','total6','first4','first5','first6'].includes(next))return toast('Select a Match Format');
 if(next===old){s.ui.modal=null;render();return;}
 const scored=s.rounds.some(rd=>(rd.matches||[]).some(m=>m?.confirmed));
 const from=scored?Math.min(s.rounds.length,Math.max(s.currentRound,s.viewRound||0)+1):0;
 const applicable=s.rounds.slice(from).some(rd=>(rd.matches||[]).some(m=>m&&!m.confirmed&&!m.skipped&&m.score==null)&&!(rd.matches||[]).some(m=>m?.confirmed||m?.skipped||m?.score!=null));
 if(!applicable)return alertModal('No Future Rounds','Current or confirmed matches are protected. Add another unplayed round to change the Match Format.');
 const apply=()=>{const prior=clone(s);snapshot();try{
  for(let i=0;i<s.rounds.length;i++){const ms=(s.rounds[i].matches||[]).filter(Boolean),locked=i<from||ms.some(m=>m.confirmed||m.skipped||m.score!=null);
   for(const m of ms)m.matchFormat=locked||m.confirmed?(m.matchFormat||old):next;
  }
  s.matchFormat=next;s.ui.modal=null;logAction('Match Format updated '+old+' → '+next+' (future only)');
  if(!save())throw Error('Unable to save the updated Match Format');render();toast('Match Format updated for future rounds');
 }catch(e){s=prior;undo.pop();save();render();alertModal('Format Unchanged',e.message);}};
 if(scored)return modal('confirm','Confirm Scoring Format Change?',
 'Confirmed and active-round results retain their previous format. Future unplayed rounds use the new format. Switching format changes raw Points / DIFF comparisons.',apply);
 apply();
}
`;
one('function renameSession(){',applyFormat+'function renameSession(){','format save handler');
one("const f=ko?P5KO.matchFormat(s.ko,m.final):s.matchFormat;","const f=ko?P5KO.matchFormat(s.ko,m.final):(m.matchFormat||s.matchFormat);",'score validation format');
one("else{if(!m.confirmed&&!P5Availability.eligibleMatch(s,m))throw Error('Cannot score NOT ARRIVED or SIT OUT participants.');m.score=[a,b];m.confirmed=true;", "else{if(!m.confirmed&&!P5Availability.eligibleMatch(s,m))throw Error('Cannot score NOT ARRIVED or SIT OUT participants.');m.matchFormat=f;m.score=[a,b];m.confirmed=true;",'confirmed format stamp');
one("(ko?P5KO.formatLabel(f):P5UI.format(s))","(ko?P5KO.formatLabel(f):P5UI.format(s,m))",'score error label');
one('m?{id:m.id,court:m.court,teams:m.teams,score:m.score,confirmed:!!m.confirmed}:null','m?{id:m.id,court:m.court,teams:m.teams,score:m.score,confirmed:!!m.confirmed,matchFormat:m.matchFormat||state.matchFormat}:null','public share fixture format');
one('if(x.rounds.length)P5EngineRegistry.validateSchedule(x.rounds,{...x,roster:x.roster});',`if(x.rounds.length)P5EngineRegistry.validateSchedule(x.rounds,{...x,roster:x.roster});
  for(const rd of x.rounds)for(const m of rd.matches||[]){if(!m)continue;
   const f=m.matchFormat||x.matchFormat;
   if(!['total4','total5','total6','first4','first5','first6'].includes(f))throw Error('Invalid historical match format');
   if(m.confirmed&&!scoreValid(m.score,f))throw Error('Historical score invalid for its saved match format');
  }`,'backup score format validation');
one(`document.addEventListener('keydown',e=>{const el=e.target.closest?.('[data-act="edit-session-name"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();action('edit-session-name',el);}});`,`document.addEventListener('keydown',e=>{const el=e.target.closest?.('[data-act="edit-session-name"],[data-act="edit-match-format"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();action(el.dataset.act,el);}});`,'format keyboard action');
const css=`
${marker}
/* Reduce the dead space below the last panel; keep the fixed tabs accessible. */
@media screen and (max-width:700px){
 #americano.p5-pr36-mobile-active{min-height:0!important;padding-bottom:0!important}
 #americano.p5-pr36-mobile-active+.brand-footer{
  margin:12px 0 0!important;
  padding-bottom:calc(98px + env(safe-area-inset-bottom,0px))!important
 }
}
#americano .p5-si-details .p5-pr36-format-field[data-act="edit-match-format"]{cursor:pointer;-webkit-tap-highlight-color:transparent}
#americano .p5-si-details .p5-pr36-format-field[data-act="edit-match-format"]:focus-visible{outline:1px solid #cbb089;outline-offset:3px;border-radius:3px}
body.p58-view-only .p5-pr36-format-field{cursor:default!important}
.p5-v2-modal .p5-pr36-format-modal{display:grid;gap:12px;padding:4px 0 10px}
.p5-v2-modal .p5-pr36-format-modal label{display:grid;gap:8px;color:#d3ae7f;font-size:10px;letter-spacing:.1em;font-weight:700}
.p5-v2-modal .p5-pr36-format-modal select{width:100%;box-sizing:border-box;min-height:45px;background:#101b24;color:#f6eee4;border:1px solid #58636b;border-radius:9px;padding:10px;font-size:16px;letter-spacing:normal}
.p5-v2-modal .p5-pr36-format-modal p{font-size:11px;line-height:1.55;margin:0;color:#a9b5c0}
.p5-v2-modal .p5-pr36-format-modal .p5-pr36-format-warning{color:#d4b489}
`;
const pos=html.lastIndexOf('</style>'),body=html.lastIndexOf('</body>');
if(pos<0||body<pos)throw Error('Expected final stylesheet not found');
html=html.slice(0,pos)+css+html.slice(pos);
fs.writeFileSync(file,html);
console.log('PASS PR36 safe in-game format editor + compact bottom whitespace');