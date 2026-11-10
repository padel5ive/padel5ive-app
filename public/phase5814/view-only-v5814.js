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
/* Promote the EXISTING Cloud Session action, never clone the button.
 * It remains wired to the original Cloud modal/permissions and sits alongside
 * the three native master accordions. Works for Unified and Club Match.
 * p585 consolidates its menu asynchronously, so this adapter follows it.
 */
/* The controller sees Cloud Session as the FOURTH native menu row.
 * Viewers see only Viewer Settings; the existing Cloud action remains wired
 * but is hidden (never cloned), so controller restoration is lossless.
 */
function promoteCloud(){
 const root=$(kind==='club'?'#mainMenu .p5-4852-menu':'#americano .p5-4852-menu');
 if(!root)return;
 const share=kind==='unified'?$('details[data-submenu="share"]',root):$('details[data-menu-section="Share & Export"]',root);
 const cloud=$('[data-p58-cloud]',root);
 if(!share||!cloud)return;
 if(!cloud.classList.contains('p5814-cloud-primary')){
  cloud.classList.add('p5814-cloud-primary');
  // Remove the old highlighted-action classes, keeping the real Cloud handler.
  cloud.classList.remove('p585-cloud-row','p58-menu-action','p5-4852-action');
  cloud.setAttribute('aria-label','Cloud Session');
  const summary=$(':scope > summary',share);
  const nativeSummary=summary?.cloneNode(true);
  if(nativeSummary){
   const icon=$('.p5-4852-icon',nativeSummary),label=$('.p5-4852-label',nativeSummary);
   const svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4.5 4.5 0 0 0 .6-9A6.5 6.5 0 0 0 5.2 11.3 3.5 3.5 0 0 0 7 18Z"/><path d="M12 13v8m-3-3 3 3 3-3"/></svg>';
   if(icon&&label){
    icon.innerHTML=svg;
    label.textContent='Cloud Session';
    cloud.replaceChildren(...Array.from(nativeSummary.childNodes));
   }else{
    // A legacy master may render plain <summary> text instead of label spans.
    const fallbackIcon=make('span','p5-4852-icon');
    fallbackIcon.innerHTML=svg;
    cloud.replaceChildren(fallbackIcon,make('span','p5-4852-label','Cloud Session'),
     make('span','p5-4852-chevron','›'));
   }
  }else{
   const icon=make('span','p5-4852-icon');
   icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4.5 4.5 0 0 0 .6-9A6.5 6.5 0 0 0 5.2 11.3 3.5 3.5 0 0 0 7 18Z"/><path d="M12 13v8m-3-3 3 3 3-3"/></svg>';
   cloud.replaceChildren(icon,make('span','p5-4852-label','Cloud Session'),
    make('span','p5-4852-chevron','›'));
  }
 }
 if(cloud.parentElement!==root||cloud.previousElementSibling!==share)
  root.insertBefore(cloud,share.nextSibling);
}
function menuView(){
 const root=$(kind==='club'?'#mainMenu .p5-4852-menu':'#americano .p5-4852-menu');
 if(!root)return;
 for(const child of Array.from(root.children)){
  if(child.classList.contains('p5814-view-menu'))continue;
  if(!child.classList.contains('p5814-master-menu-hidden'))child.classList.add('p5814-master-menu-hidden');
  hideControl(child);
 }
 const existing=$('.p5814-view-menu',root);
 if(existing){updateStatus(existing);return;}
 const panel=make('details','p5-4852-section p5814-view-menu');
 const summary=make('summary','');
 const icon=make('span','p5-4852-icon');
 icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.8-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.8 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
 summary.append(icon,make('span','p5-4852-label','Viewer Settings'),make('span','p5-4852-chevron','›'));
 const content=make('div','p5814-menu-body');
 const menuButton=(label,action)=>{
  const b=make('button','p5814-view-action');
  b.type='button';b.dataset.p5814ViewerAction=action;
  b.append(make('span','p5814-view-action-label',label),
   make('span','p5814-view-action-chevron','›'));
  return b;
 };
 content.append(menuButton('Take Control','cloud'));
 content.append(menuButton('Refresh Data','refresh'));
 // Keep a quiet, deliberate disconnect action for changing sessions.
 const footer=make('div','p5814-menu-footer');
 footer.append(menuButton('Leave Cloud Session','leave'));
 content.append(footer);
 panel.append(summary,content);root.append(panel);
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-p5814-viewer-action]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();
  if(button.disabled||!document.body.classList.contains('p58-view-only'))return;
  const action=button.dataset.p5814ViewerAction,cloud=window.P5CloudSession;
  if(!cloud)return;
  if(action==='leave'){cloud.leaveViewer?.();return;}
  if(action==='cloud'){cloud.open?.();return;}
  if(action==='refresh'){
   button.disabled=true;
   try{await cloud.refreshNow?.();}
   finally{button.disabled=false;}
  }
 });
 updateStatus(panel);
}
function updateStatus(root){
 const cloud=window.P5CloudSession?.getStatus?.();
 const take=$('[data-p5814-viewer-action="cloud"]',root);
 if(take){
  const desired=cloud?.waiting?'Check Control Request':'Take Control';
  const labelNode=$('.p5814-view-action-label',take);
  if(labelNode&&labelNode.textContent!==desired)labelNode.textContent=desired;
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
function actions(){
 const roots=kind==='unified'?[$('#americano')]:[$('#app'),$('#mainMenu')];
 const attr=kind==='unified'?'act':'action';
 // Closed-world spectator policy: hide all editor actions including buttons
 // without action IDs, Club's global dock, and controls added after re-render.
 for(const root of roots){
  if(!root)continue;
  for(const button of $$('button, input[type="button"], input[type="submit"]',root)){
   if(button.closest('.p5814-view-menu, #p58-cloud-host')||button.matches('[data-p58-cloud].p5814-cloud-primary'))continue;
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
function restore(){
 restoreText();
 $$('.p5814-view-menu').forEach(x=>x.remove());
 showAllControls();
 $$('.p5814-master-menu-hidden').forEach(x=>x.classList.remove('p5814-master-menu-hidden'));
 $$('.p5814-read-score, .p5814-score-static').forEach(x=>x.remove());
 $$('.p5814-locked-editor').forEach(x=>{x.classList.remove('p5814-locked-editor');x.removeAttribute('aria-disabled');x.removeAttribute('tabindex')});
}
function run(){
 promoteCloud();
 if(!document.body.classList.contains('p58-view-only')){
  if($('.p5814-view-menu')||$('.p5814-read-score')||$('.p5814-score-static')||hiddenInline.size||changed.size)restore();
  return;
 }
 promoteCloud();menuView();scoreViewer();actions();
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
