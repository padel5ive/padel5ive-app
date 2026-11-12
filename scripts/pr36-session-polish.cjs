'use strict';
// PR36 review: quiet-luxury tap-to-rename (no edit icon) and lean court title.
// Operates on the finished Unified page; no changes to scoring / scheduling engines.
const fs=require('node:fs');
const f='public/modes/unified/index.html';
let html=fs.readFileSync(f,'utf8');
const marker='PR36 SESSION POLISH: tap name to rename without an edit icon';
if(html.includes(marker)){console.log('PASS PR36 session polish already installed');process.exit(0)}
function replaceOnce(before,after,label){
 const n=html.split(before).length-1;
 if(n!==1)throw Error('PR36 '+label+': expected unique insertion, got '+n);
 html=html.replace(before,after);
}
replaceOnce(
 '<div class="p5-si-identity-cell p5-si-session-name"><span>SESSION NAME</span><strong title="${esc(s.session)}">${esc(s.session)}</strong></div>',
 '<div class="p5-si-identity-cell p5-si-session-name"><span>SESSION NAME</span><strong data-act="edit-session-name" role="button" tabindex="0" title="Tap to edit session name" aria-label="Edit session name: ${esc(s.session)}">${esc(s.session)}</strong></div>',
 'session name affordance'
);
replaceOnce(
 'ROUND ${r+1} · ${format(s)} · COURT SCORING',
 'ROUND ${r+1} · COURT SCORING',
 'nonredundant round heading'
);
replaceOnce(
 "const content=m.type==='qualification'?qualifying:",
 "const sessionEditor=m.type==='session-name'?`<div class=\"p5-rename-session\"><label for=\"p5-edit-session-name\">SESSION NAME<input id=\"p5-edit-session-name\" maxlength=\"70\" autocapitalize=\"sentences\" autocomplete=\"off\" value=\"${esc(s.session)}\"></label><p class=\"muted\">Changing the session name does not change scores, players or schedules.</p></div>`:'';\n  const content=m.type==='session-name'?sessionEditor:m.type==='qualification'?qualifying:",
 'rename modal native content'
);
replaceOnce(
 "const label=m.type==='score'?'Confirm Score':",
 "const label=m.type==='session-name'?'Save Changes':m.type==='score'?'Confirm Score':",
 'rename modal native save button'
);
replaceOnce(
 "case 'edit-names':s.ui.modal={type:'names',title:'Edit Player Names'};render();break;",
 "case 'edit-session-name':{if(document.body.classList.contains('p58-view-only')||window.P5CloudSession?.getStatus?.()?.role==='viewer')break; if(!s.session||s.stage==='setup')break;s.ui.modal={type:'session-name',title:'Edit Session Name'};render();}break;\n   case 'edit-names':s.ui.modal={type:'names',title:'Edit Player Names'};render();break;",
 'native edit action'
);
replaceOnce(
 "if(m.type==='score')saveScore();else if(m.type==='ko-edit')saveHistoricalKO();",
 "if(m.type==='session-name')renameSession();else if(m.type==='score')saveScore();else if(m.type==='ko-edit')saveHistoricalKO();",
 'save modal router'
);
const renamed=`function renameSession(){
  if(document.body.classList.contains('p58-view-only')||window.P5CloudSession?.getStatus?.()?.role==='viewer')return;
  const field=document.getElementById('p5-edit-session-name');
  const next=String(field?.value||'').trim().replace(/\\s+/g,' ');
  if(!next||next.length>70)return toast('Session name must contain 1–70 characters');
  const before=clone(s);
  if(next!==s.session){s.session=next;logAction('Session name updated');}
  s.ui.modal=null;
  if(!save()){s=before;render();return alertModal('Rename Not Saved','Local storage could not save this session name. Existing match results remain unchanged.');}
  // Existing Sessions archives share the same stable ID, not the display name.
  const entries=library(),idx=entries.findIndex(e=>e.id===s._sessionId);
  if(idx>=0){entries[idx].state.session=next;if(!libraryWrite(entries))toast('Name saved locally; archived session name not updated');}
  render();toast('Session name updated');
 }
 `;
replaceOnce('function rename(){',renamed+'function rename(){','rename save handler');
replaceOnce(
 "function attach(){document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el){e.preventDefault();action(el.dataset.act,el,e.target.closest('[data-score-side]')?.dataset.scoreSide);}});",
 "function attach(){document.addEventListener('click',e=>{const el=e.target.closest('[data-act]');if(el){e.preventDefault();action(el.dataset.act,el,e.target.closest('[data-score-side]')?.dataset.scoreSide);}});\n  document.addEventListener('keydown',e=>{const el=e.target.closest?.('[data-act=\"edit-session-name\"]');if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();action('edit-session-name',el);}});",
 'keyboard activation'
);
const css=`
<style>
/* ${marker} */
#americano .p5-si-session-name>strong[data-act="edit-session-name"],
#knockout .p5-si-session-name>strong[data-act="edit-session-name"]{cursor:pointer;max-width:100%}
#americano .p5-si-session-name>strong[data-act="edit-session-name"]:focus-visible,
#knockout .p5-si-session-name>strong[data-act="edit-session-name"]:focus-visible{outline:1px solid rgba(210,180,137,.7);outline-offset:3px;border-radius:3px}
body.p58-view-only .p5-si-session-name>strong[data-act="edit-session-name"]{cursor:default;outline:0}
.p5-v2-modal .p5-rename-session{padding:8px 0 14px}
.p5-v2-modal .p5-rename-session label{display:flex;flex-direction:column;gap:9px;color:#d3ae7f;font-size:10px;letter-spacing:.12em;font-weight:700}
.p5-v2-modal .p5-rename-session input{margin:0;display:block;width:100%;height:46px;box-sizing:border-box;background:#101b24;border:1px solid #4b5c67;border-radius:9px;padding:10px 12px;color:#fff4e9;font-size:16px;font-weight:550;letter-spacing:normal;outline:0}
.p5-v2-modal .p5-rename-session input:focus{border-color:#c8ab83;box-shadow:0 0 0 2px rgba(190,158,115,.15)}
.p5-v2-modal .p5-rename-session p{margin:10px 0 0!important;font-size:11px;line-height:1.5;color:#9daeb9}
</style>
`;
const n=html.lastIndexOf('</body>');if(n<0)throw Error('PR36: final document body not found');
html=html.slice(0,n)+css+html.slice(n);
fs.writeFileSync(f,html);
console.log('PASS PR36: native tap-to-rename with no icon, court heading simplified');