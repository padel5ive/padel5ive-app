/* PADEL 5IVE · View Only v1.0
 * Presentation-only adapter over the unchanged master dashboard.
 * The Cloud Session API remains the authority for all permissions.
 */
(()=>{'use strict';
const kind=location.pathname.includes('/club-match/')?'club':'unified';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
const allowed={
 unified:new Set(['round','view-schedule','tab-stage1','tab-stage2','back-stage1','bracket-nav','jump-ko-courts','ko-history','report-preview','report-close','replay-champion']),
 club:new Set(['view-round','toggle-rounds','latest-round','filter-leaderboard','jump-leaderboard','replay-champion'])
};
let queued=false;
const changed=new Map(), hiddenInline=new Map();
// Inline important is intentional: the legacy master applies many
// high-specificity display: flex!important overrides to its own buttons.
function hideControl(el){
 if(!el)return;
 if(!hiddenInline.has(el))hiddenInline.set(el,{
  value:el.style.getPropertyValue('display'),
  priority:el.style.getPropertyPriority('display')
 });
 if(!el.classList.contains('p5814-hide-action'))el.classList.add('p5814-hide-action');
 if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important')
  el.style.setProperty('display','none','important');
}
function showControl(el){
 if(!el)return;
 if(el.classList.contains('p5814-hide-action'))el.classList.remove('p5814-hide-action');
 if(!hiddenInline.has(el))return;
 const prior=hiddenInline.get(el);hiddenInline.delete(el);
 if(prior.value)el.style.setProperty('display',prior.value,prior.priority);
 else el.style.removeProperty('display');
}
function showAllControls(){
 for(const el of hiddenInline.keys())showControl(el);
}
function replaceText(el,text){
 if(!el||el.textContent===text)return;
 if(!changed.has(el))changed.set(el,el.textContent);
 el.textContent=text;
}
function restoreText(){
 for(const [el,text] of changed){if(el.isConnected)el.textContent=text;}
 changed.clear();
}
/* Use native <details>/<summary> rows from the actual master UI.
 * Never style a Cloud button to pretend to be a master menu row: the native
 * button rules have !important styles and were centering the item on iPhone.
 * Keep the original button in a hidden host so its registered action works.
 */
const cloudGlyph='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4.5 4.5 0 0 0 .6-9A6.5 6.5 0 0 0 5.2 11.3 3.5 3.5 0 0 0 7 18Z"/><path d="M12 13v8m-3-3 3 3 3-3"/></svg>';
const eyeGlyph='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.8-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.8 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
function masterSummary(reference,label,glyph){
 const native=$(':scope > summary',reference);
 const summary=native?.cloneNode(true)||make('summary','');
 summary.removeAttribute('aria-expanded');
 let icon=$('.p5-4852-icon',summary),name=$('.p5-4852-label',summary);
 if(!icon||!name){
  summary.replaceChildren();
  icon=make('span','p5-4852-icon');
  name=make('span','p5-4852-label');
  const chevron=make('span','p5-4852-chevron','›');
  summary.append(icon,name,chevron);
 }
 icon.innerHTML=glyph;
 name.textContent=label;
 return summary;
}
function nativeMenu(){
 return $(kind==='club'?'#mainMenu .p5-4852-menu':'#americano .p5-4852-menu');
}
function shareMenu(root){
 return $(kind==='unified'?'details[data-submenu="share"]':'details[data-menu-section="Share & Export"]',root);
}
function promoteCloud(){
 const root=nativeMenu();
 if(!root)return;
 const share=shareMenu(root);
 if(!share)return;
 const existing=$(':scope > details.p5814-cloud-section',root);
 if(existing)return;
 // The original Cloud Session action has a delegated click handler in p58.
 // It is moved to the section's hidden host, not duplicated or replaced.
 const original=$('[data-p58-cloud]',root);
 if(!original)return;
 const section=make('details','p5-4852-section p5814-cloud-section');
 const summary=masterSummary(share,'Cloud Session',cloudGlyph);
 const holder=make('div','p5814-cloud-native-handler');
 holder.hidden=true;
 holder.append(original);
 section.append(summary,holder);
 summary.addEventListener('click',event=>{
  event.preventDefault();
  if(document.body.classList.contains('p58-view-only'))return;
  original.click();
 });
 root.insertBefore(section,share.nextSibling);
}
function menuView(){
 const root=nativeMenu(),share=root&&shareMenu(root);
 if(!root||!share)return;
 for(const child of Array.from(root.children)){
  if(child.classList.contains('p5814-view-menu'))continue;
  if(!child.classList.contains('p5814-master-menu-hidden'))child.classList.add('p5814-master-menu-hidden');
  hideControl(child);
 }
 const existing=$(':scope > details.p5814-view-menu',root);
 if(existing){updateStatus(existing);return;}
 const panel=make('details','p5-4852-section p5814-view-menu');
 panel.append(masterSummary(share,'Viewer Settings',eyeGlyph));
 const content=make('div','p5814-menu-body');
 // Safari/WhatsApp cached earlier CSS while loading the new JS. Apply the
 // essential native row geometry directly to the elements, so an outdated
 // stylesheet can NEVER collapse them into unstyled text again.
 const essential=(el,properties)=>{
  for(const [name,value] of Object.entries(properties))
   el.style.setProperty(name,value,'important');
 };
 essential(content,{
  display:'block',width:'100%','box-sizing':'border-box',
  padding:'5px 22px 13px',margin:'0',background:'transparent'
 });
 const menuRow=(label,action)=>{
  // Independent accessible row: master-wide BUTTON rules must not bleed in.
  const row=make('div','p5814-view-row');
  row.setAttribute('role','button');
  row.setAttribute('tabindex','0');
  row.dataset.p5814ViewerAction=action;
  const title=make('span','p5814-view-row-label',label);
  const arrow=make('span','p5814-view-row-chevron','›');
  row.append(title,arrow);
  essential(row,{
   display:'flex','flex-flow':'row nowrap','align-items':'center',
   'justify-content':'space-between',width:'100%','min-width':'0',
   'min-height':'55px',height:'auto','box-sizing':'border-box',
   padding:'13px 5px',margin:'0',gap:'12px',
   border:'0','border-top':'1px solid rgba(206,184,153,.17)',
   'border-radius':'0',background:'transparent','box-shadow':'none',
   color:'#efede8',font:'600 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
   'text-align':'left','white-space':'normal',cursor:'pointer'
  });
  essential(title,{
   display:'block',flex:'1 1 auto','min-width':'0',margin:'0',padding:'0',
   color:'inherit',font:'inherit','text-align':'left','white-space':'normal'
  });
  essential(arrow,{
   display:'block',flex:'0 0 17px',width:'17px',
   'margin-left':'auto',padding:'0',color:'#c9ad87',
   font:'400 20px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
   'text-align':'right'
  });
  return row;
 };
 content.append(menuRow('Take Control','cloud'));
 content.append(menuRow('Refresh Data','refresh'));
 const footer=make('div','p5814-view-footer');
 essential(footer,{
  display:'block',width:'100%','box-sizing':'border-box',margin:'8px 0 0',
  padding:'6px 0 0','border-top':'1px solid rgba(206,184,153,.15)'
 });
 const leave=menuRow('Leave Cloud Session','leave');
 leave.style.setProperty('color','#b4bec5','important');
 leave.style.setProperty('font-weight','500','important');
 leave.style.setProperty('border-top','0','important');
 footer.append(leave);
 content.append(footer);
 panel.append(content);root.append(panel);
 panel.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const row=event.target.closest('[data-p5814-viewer-action]');
  if(!row)return;
  event.preventDefault();
  row.click();
 });
 panel.addEventListener('click',async event=>{
  const row=event.target.closest('[data-p5814-viewer-action]');
  if(!row)return;
  event.preventDefault();event.stopPropagation();
  if(row.getAttribute('aria-disabled')==='true'||!document.body.classList.contains('p58-view-only'))return;
  const action=row.dataset.p5814ViewerAction,cloud=window.P5CloudSession;
  if(!cloud)return;
  if(action==='cloud'){cloud.open?.();return;}
  if(action==='leave'){cloud.leaveViewer?.();return;}
  if(action==='refresh'){
   row.setAttribute('aria-disabled','true');
   try{await cloud.refreshNow?.();}
   finally{row.removeAttribute('aria-disabled');}
  }
 });
 updateStatus(panel);
}
function updateStatus(root){
 const cloud=window.P5CloudSession?.getStatus?.();
 const take=$('[data-p5814-viewer-action="cloud"]',root);
 if(take){
  const label=$('.p5814-view-row-label',take);
  const desired=cloud?.waiting?'Check Control Request':'Take Control';
  if(label&&label.textContent!==desired)label.textContent=desired;
 }
}
function scoreViewer(){
 if(kind==='unified'){
  for(const button of $$('#americano button.p5sm-open-score')){
   // A score card is informational, not an unclickable edit button.
   // Keep the original button untouched underneath for Controller restoration.
   let display=button.nextElementSibling;
   if(!display||!display.classList.contains('p5814-score-static')){
    display=make('div','p5sm-open-score p5814-score-static');
    display.setAttribute('role','group');
    display.setAttribute('aria-label','Match score · View Only');
    button.insertAdjacentElement('afterend',display);
   }
   if(display.innerHTML!==button.innerHTML)display.innerHTML=button.innerHTML;
   hideControl(button);
  }
  for(const hint of $$('#americano .p5sm-card .scorehint')){
   const old=changed.get(hint)||hint.textContent;
   const neutral=old.replace(/\s*·\s*(?:Tap to Score|Edit)\s*$/i,'');
   replaceText(hint,neutral);
  }
 }else{
  for(const field of $$('#app input[data-stage1-score], #app input[data-custom-score]')){
   if(!field.classList.contains('p5814-locked-editor'))field.classList.add('p5814-locked-editor');field.tabIndex=-1;field.setAttribute('aria-disabled','true');
   let display=field.nextElementSibling;
   if(!display||!display.classList.contains('p5814-read-score')){
    display=make('span','p5814-read-score');
    field.insertAdjacentElement('afterend',display);
   }
   const value=field.value.trim()||'–';
   if(display.textContent!==value)display.textContent=value;
  }
  const head=$('#app .rounds-drawer-head');
  if(head){
   const label=Array.from(head.childNodes).find(n=>n.nodeType===3);
   if(label&&label.textContent.includes('SCORE EDITING'))replaceText(label,'MATCH HISTORY ');
   const note=$('span',head);if(note)replaceText(note,'Browse completed rounds and confirmed scores');
  }
 }
}
/* Viewer panel keeps master layout, with read-only explanation only. */
function viewerSessionSummary(){
 if(kind!=='unified')return;
 const panel=$('#americano .layout > div:first-child > .p5-v26-session-control');
 if(!panel)return;
 const description=$(':scope > p',panel);
 if(description)replaceText(description,'Browse the full match schedule and confirmed results. Only the active moderator can change scores.');
}
/* Native standings names are management buttons in the controller.
 * Viewer guard hides those buttons; mirror their text as passive spans so
 * ranks never become blank while retaining the original editing blockade.
 * No server data or local session state is modified here.
 */
function viewerLeaderboardNames(){
 if(kind!=='unified')return;
 for(const button of $$('#americano .p5-b41-leaderboard button[data-act="manage-participant"]')){
  let passive=button.nextElementSibling;
  if(!passive||!passive.classList.contains('p5814-standing-name')){
   passive=make('span','p5814-standing-name');
   passive.setAttribute('role','text');
   button.insertAdjacentElement('afterend',passive);
  }
  const copy=button.cloneNode(true);
  $$('.p5-sitout-indicator',copy).forEach(el=>el.remove());
  const text=copy.textContent.replace(/\s+/g,' ').trim();
  if(passive.textContent!==text)passive.textContent=text;
 }
}
function actions(){
 const roots=kind==='unified'?[$('#americano')]:[$('#app'),$('#mainMenu')];
 const attr=kind==='unified'?'act':'action';
 // Closed-world spectator policy: hide all editor actions including buttons
 // without action IDs, Club's global dock, and controls added after re-render.
 for(const root of roots){
  if(!root)continue;
  for(const button of $$('button, input[type="button"], input[type="submit"]',root)){
   if(button.closest('.p5814-view-menu, .p5814-cloud-native-handler, #p58-cloud-host'))continue;
   const action=button.dataset[attr];
   const permitted=button.tagName==='BUTTON'&&allowed[kind].has(action);
   if(permitted)showControl(button);else hideControl(button);
  }
  // Club score values are mirrored in passive text before hiding input fields.
  for(const field of $$('input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea',root)){
   if(field.closest('.p5814-view-menu, #p58-cloud-host'))continue;
   hideControl(field);
  }
 }
}
/* Spectators only need match schedules and scores. Scheduling diagnostics
 * are useful for moderators, but clutter the court cards on small screens.
 * Hide by actual notice text and not parent ID: some engines render these
 * outside #americano, where the old CSS rule did not apply.
 * hideControl remembers original styles for instant Moderator restoration.
 */
function hideViewerDiagnostics(){
 for(const notice of $$('.p5-b2-fairness-ok, .p5-b2-fairness-warning')){
  const title=(notice.textContent||'').trim();
  if(title.startsWith('ADVANCED PLAYER RULES')||
     title.startsWith('SCHEDULING FAIRNESS REVIEW'))
   hideControl(notice);
 }
}
function restore(){
 restoreText();
 $$('.p5814-view-menu').forEach(x=>x.remove());
 showAllControls();
 $$('.p5814-master-menu-hidden').forEach(x=>x.classList.remove('p5814-master-menu-hidden'));
 $('.p5814-standing-name').forEach(x=>x.remove());
 $('.p5814-read-score, .p5814-score-static').forEach(x=>x.remove());
 $$('.p5814-locked-editor').forEach(x=>{x.classList.remove('p5814-locked-editor');x.removeAttribute('aria-disabled');x.removeAttribute('tabindex')});
}
function run(){
 promoteCloud();
 if(!document.body.classList.contains('p58-view-only')){
  if($('.p5814-view-menu')||$('.p5814-read-score')||$('.p5814-score-static')||hiddenInline.size||changed.size)restore();
  return;
 }
 promoteCloud();menuView();scoreViewer();viewerLeaderboardNames();viewerSessionSummary();hideViewerDiagnostics();actions();
}
function schedule(){
 if(queued)return;
 queued=true;requestAnimationFrame(()=>{queued=false;run();});
}
// Previous-round navigation pauses Follow Live; the Live action restores it.
document.addEventListener('click',event=>{
 if(!document.body.classList.contains('p58-view-only'))return;
 const button=event.target?.closest?.('button[data-act],button[data-action]');
 if(!button)return;
 const action=kind==='club'?button.dataset.action:button.dataset.act;
 const cloud=window.P5CloudSession;
 if(action==='round'){
  // Evaluate after the native round handler saves the chosen viewRound.
  // Returning to the most recent round automatically resumes Follow Live.
  requestAnimationFrame(()=>{
   try{
    const state=JSON.parse(localStorage.getItem('padel5ive-shared-foundation-v2.4-parity-lab')||'null');
    const latest=Number(state?.currentRound),selected=Number(state?.viewRound);
    if(Number.isInteger(latest)&&Number.isInteger(selected))
     cloud?.setFollowLive?.(latest===selected);
   }catch{}
   schedule();
  });
 }else if(action==='view-round'){cloud?.setFollowLive?.(false);schedule();}
 else if(action==='latest-round'){cloud?.setFollowLive?.(true);schedule();}
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
