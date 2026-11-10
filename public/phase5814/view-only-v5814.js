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
const scoreButtons=new Set(['score']);
let queued=false;
const changed=new Map();
function replaceText(el,text){
 if(!el||el.textContent===text)return;
 if(!changed.has(el))changed.set(el,el.textContent);
 el.textContent=text;
}
function restoreText(){
 for(const [el,text] of changed){if(el.isConnected)el.textContent=text;}
 changed.clear();
}
function menuView(){
 const root=$(kind==='club'?'#mainMenu .p5-4852-menu':'#americano .p5-4852-menu');
 if(!root)return;
 for(const child of Array.from(root.children))if(!child.classList.contains('p5814-view-menu'))child.classList.add('p5814-master-menu-hidden');
 const outer=$('.p5814-view-menu',root);
 if(outer){updateStatus(outer);return;}
 const panel=make('details','p5-4852-section p5814-view-menu');
 const summary=make('summary','');
 const icon=make('span','p5-4852-icon');
 icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.8-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.8 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>';
 summary.append(icon,make('span','p5-4852-label','Viewer Settings'),make('span','p5-4852-chevron','›'));
 const content=make('div','p5-4852-content p5814-menu-body');
 content.append(make('div','p585-heading','CLOUD SESSION'));
 const line=make('div','p5814-connection');
 line.append(make('span','','Connection Status'),make('strong','p5814-cloud-state','VIEW ONLY'));
 content.append(line);
 const menuButton=(label,action,description)=>{
  const b=make('button','p5814-view-action',label);
  b.type='button';b.dataset.p5814ViewerAction=action;
  if(description)b.append(make('small','',description));
  return b;
 };
 content.append(menuButton('Take Control','cloud','Request permission from the active controller'));
 content.append(menuButton('Refresh Data','refresh','Check Cloud for the latest results'));
 content.append(make('div','p585-heading p5814-session-heading','SESSION'));
 content.append(menuButton('Back to Home','home','Keep this viewer connected'));
 content.append(menuButton('Leave Cloud Session','leave','Disconnect this viewer device'));
 panel.append(summary,content);root.append(panel);
 panel.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-p5814-viewer-action]');
  if(!button)return;
  event.preventDefault();event.stopPropagation();
  if(button.disabled||!document.body.classList.contains('p58-view-only'))return;
  const action=button.dataset.p5814ViewerAction,cloud=window.P5CloudSession;
  if(!cloud)return;
  if(action==='home'){location.assign('/');return;}
  if(action==='leave'){cloud.leaveViewer?.();return;}
  if(action==='cloud'){cloud.open?.();return;}
  if(action==='refresh'){
   button.disabled=true;
   try{await cloud.refreshNow?.();updateStatus(panel);}
   finally{button.disabled=false;}
  }
 });
 updateStatus(panel);
}
function updateStatus(root){
 const line=$('.p5814-cloud-state',root),cloud=window.P5CloudSession?.getStatus?.();
 if(!line)return;
 const label=cloud?.status||'VIEW ONLY';
 const value=label==='VIEW ONLY'?'CONNECTED · AUTO SYNC':label==='SYNCING'?'SYNCING':label==='OFFLINE'?'OFFLINE':label==='CONFLICT'?'SYNC CONFLICT':label;
 if(line.textContent!==value)line.textContent=value;
 line.dataset.state=label.toLowerCase().replaceAll(' ','-');
 const take=$('[data-p5814-viewer-action="cloud"]',root);
 if(take){
  const desired=cloud?.waiting?'Check Control Request':'Take Control';
  for(const node of Array.from(take.childNodes))if(node.nodeType===3&&node.textContent!==desired)node.textContent=desired;
 }
}
function scoreViewer(){
 if(kind==='unified'){
  for(const b of $$('#americano .p5sm-open-score')){
   b.classList.add('p5814-locked-editor');b.setAttribute('aria-disabled','true');b.tabIndex=-1;
  }
  for(const hint of $$('#americano .p5sm-card .scorehint')){
   const old=changed.get(hint)||hint.textContent;
   const neutral=old.replace(/\s*·\s*(?:Tap to Score|Edit)\s*$/i,'');
   replaceText(hint,neutral);
  }
 }else{
  for(const field of $$('#app input[data-stage1-score], #app input[data-custom-score]')){
   field.classList.add('p5814-locked-editor');field.tabIndex=-1;field.setAttribute('aria-disabled','true');
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
 const root=kind==='unified'?$('#americano'):$('#app');
 if(!root)return;
 const attr=kind==='unified'?'act':'action';
 for(const button of $$('button[data-'+attr+']',root)){
  if(button.closest('.p5814-view-menu, #p58-cloud-host'))continue;
  const action=button.dataset[attr];
  const preserve=scoreButtons.has(action)&&kind==='unified'||
   button.classList.contains('mc38-rename')||
   allowed[kind].has(action);
  button.classList.toggle('p5814-hide-action',!preserve);
  if(button.classList.contains('mc38-rename')){button.classList.add('p5814-locked-editor');button.tabIndex=-1;button.setAttribute('aria-disabled','true');}
 }
}
function restore(){
 restoreText();
 $$('.p5814-view-menu').forEach(x=>x.remove());
 $$('.p5814-hide-action, .p5814-master-menu-hidden').forEach(x=>x.classList.remove('p5814-hide-action','p5814-master-menu-hidden'));
 $$('.p5814-read-score').forEach(x=>x.remove());
 $('.p5814-locked-editor').forEach(x=>{x.classList.remove('p5814-locked-editor');x.removeAttribute('aria-disabled');x.removeAttribute('tabindex')});
}
function run(){
 if(!document.body.classList.contains('p58-view-only')){if($('.p5814-view-menu')||$('.p5814-read-score')||changed.size)restore();return;}
 menuView();scoreViewer();actions();
}
function schedule(){
 if(queued)return;
 queued=true;requestAnimationFrame(()=>{queued=false;run();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
