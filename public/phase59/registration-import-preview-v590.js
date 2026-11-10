/* PADEL 5IVE v5.9 LAB — Registration import UX only.
 * No writes to roster, sessions, game states, or API. All native registration
 * and advanced Coach / Flexible pairing handlers remain intact.
 */
(()=>{'use strict';
const sel='.p5-b32-registration';
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const sample={fixed:"Andry & Mario\nBilly & Dylan\nEdgar & Felix",individual:"Andry\nMario\nBilly\nDylan\nEdgar\nFelix"};
let modal=null;
let inFlight=false;
function isFixed(card){const title=card.querySelector('h1')?.textContent||'';return /fixed partner/i.test(title)}
function parseNames(source,fixed){
 const lines=source.split(/\r?\n|[,;]+/).map(s=>s.trim().replace(/^[-•*\u2022]\s*/,'').replace(/^\d+[.)]\s*/,'').trim()).filter(Boolean);
 const result=[],seen=new Set(),warnings=[];
 for(const raw of lines){
  const values=fixed?raw.split(/\s+(?:&|\+|\/|\band\b)\s+/i).map(s=>s.trim()):[raw];
  if(fixed&&values.length!==2){warnings.push('Pair requires two names: '+raw.slice(0,100));continue;}
  if(!fixed&&values.length===1&&/(\s+&\s+|\s+\+\s+)/.test(raw)){warnings.push('Check individual entry: '+raw.slice(0,100));continue;}
  if(values.some(v=>v.length<2||v.length>75)){warnings.push('Invalid name: '+raw.slice(0,100));continue;}
  const lower=values.map(v=>v.toLocaleLowerCase());
  if(lower.some(v=>seen.has(v))||new Set(lower).size!==lower.length){warnings.push('Duplicate name: '+raw.slice(0,100));continue;}
  lower.forEach(v=>seen.add(v));
  result.push(values);
 }
 return {entries:result,warnings};
}
function getRoster(card){
 return [...card.querySelectorAll('.p5-b32-regrow')].map(row=>
  [...row.querySelectorAll('input[data-slot]')].map(n=>n.value.trim()).filter(Boolean)
 ).filter(a=>a.length);
}
function markupModal(card){
 const fixed=isFixed(card);
 const layer=make('div','p59-layer');
 layer.dataset.p59Modal='';
 layer.innerHTML='<section class="p59-dialog" role="dialog" aria-modal="true" aria-labelledby="p59-modal-title">'+
 '<header class="p59-modal-head"><div><small>PADEL 5IVE · REGISTRATION</small><h2 id="p59-modal-title">Import Players</h2></div><button class="p59-close" type="button" aria-label="Close Import Players">×</button></header>'+
 '<nav class="p59-tabs" role="tablist" aria-label="Import method"><button type="button" class="is-active" data-p59-method="paste" role="tab" aria-selected="true">Paste Player List</button><button type="button" data-p59-method="reclub" role="tab" aria-selected="false">Reclub Link</button></nav>'+
 '<div class="p59-content"><div data-p59-pane="paste"><label for="p59-names">PASTE '+(fixed?'FIXED PAIRS':'PLAYER NAMES')+'</label><textarea id="p59-names" rows="6" spellcheck="false" placeholder="'+(fixed?'Andry & Mario&#10;Billy & Dylan':'Andry&#10;Mario&#10;Billy')+'"></textarea><p class="p59-help">'+(fixed?'One pair per line · Use “&” between partners.':'One player per line, or separate names with commas.')+'</p><button type="button" data-p59-action="preview" class="p59-primary">Preview Registration</button></div>'+
 '<div data-p59-pane="reclub" hidden><label for="p59-url">RECLUB EVENT LINK</label><input id="p59-url" type="url" inputmode="url" placeholder="https://reclub.co/id/m/T3H3TL"><p class="p59-help">Paste a Reclub event link. Automatic attendee retrieval requires authorized access and is not enabled in this preview.</p><button type="button" data-p59-action="inspect" class="p59-primary">Check Link Format</button></div>'+
 '<div class="p59-preview" id="p59-preview" aria-live="polite" hidden></div></div>'+
 '<footer class="p59-modal-foot"><span>DESIGN PREVIEW · ROSTER UNCHANGED</span><button type="button" class="p59-commit" disabled>Confirm & Import</button></footer></section>';
 const close=()=>{layer.remove();modal=null;document.removeEventListener('keydown',onKey);};
 const onKey=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
 layer.querySelector('.p59-close').addEventListener('click',close);
 layer.addEventListener('click',e=>{if(e.target===layer)close();});
 document.addEventListener('keydown',onKey);
 const out=layer.querySelector('#p59-preview');
 const methods=layer.querySelectorAll('[data-p59-method]');
 const switchTo=method=>{
  methods.forEach(b=>{const active=b.dataset.p59Method===method;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});
  layer.querySelectorAll('[data-p59-pane]').forEach(p=>p.hidden=p.dataset.p59Pane!==method);
  out.hidden=true;out.replaceChildren();
 };
 methods.forEach(b=>b.addEventListener('click',()=>switchTo(b.dataset.p59Method)));
 layer.querySelector('[data-p59-action="inspect"]').addEventListener('click',()=>{
  const val=layer.querySelector('#p59-url').value.trim();
  out.hidden=false;out.replaceChildren();
  let url;
  try{url=new URL(val)}catch{out.append(make('p','p59-warning','Please enter a valid Reclub event URL.'));return}
  if(!/(^|\.)reclub\.co$/i.test(url.hostname)||!/^\/(?:id\/)?m\/[a-zA-Z0-9]+\/?$/.test(url.pathname)){
   out.append(make('p','p59-warning','Link format not recognized. Use an event URL such as https://reclub.co/id/m/T3H3TL.'));return;
  }
  out.append(make('b','p59-preview-title','RECLUB EVENT LINK RECOGNIZED'));
  out.append(make('p','p59-help','Event code: '+url.pathname.split('/').filter(Boolean).at(-1).toUpperCase()));
  out.append(make('p','p59-warning','Participant data cannot be fetched in this preview. Please use Paste Player List to test the registration flow.'));
 });
 layer.querySelector('[data-p59-action="preview"]').addEventListener('click',()=>{
  const data=parseNames(layer.querySelector('#p59-names').value,fixed);
  const existing=new Set(getRoster(card).flat().map(n=>n.toLocaleLowerCase()));
  const duplicates=data.entries.filter(entry=>entry.some(name=>existing.has(name.toLocaleLowerCase())));
  const ready=data.entries.filter(entry=>!entry.some(name=>existing.has(name.toLocaleLowerCase())));
  out.hidden=false;out.replaceChildren();
  out.append(make('b','p59-preview-title',ready.length+' '+(fixed?'PAIRS':'PLAYERS')+' READY FOR REVIEW'));
  if(ready.length){
   const list=make('ol','p59-name-list');
   ready.forEach(entry=>list.append(make('li','',entry.join('  +  '))));
   out.append(list);
  }else out.append(make('p','p59-help','No new entries to preview.'));
  if(duplicates.length)out.append(make('p','p59-warning',duplicates.length+' entries already exist in registration.'));
  if(data.warnings.length){
   const box=make('div','p59-warning');box.append(make('b','','CHECK THESE ENTRIES'));
   data.warnings.forEach(w=>box.append(make('p','',w)));
   out.append(box);
  }
  out.append(make('p','p59-notice','Preview only — Confirm & Import is intentionally disabled until the full import workflow is approved.'));
 });
 document.body.append(layer);modal=layer;layer.querySelector('#p59-names').focus();
}
function importCard(card){
 if(card.querySelector('[data-p59-import]'))return;
 const anchor=card.querySelector('.p5-50-rules, .p5-b42-reg-footer, .p5-52-footer');
 if(!anchor)return;
 const details=make('details','p59-import');details.dataset.p59Import='';
 details.innerHTML='<summary><span class="p59-import-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 18v3h14v-3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Import Players</span><span class="p59-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="p59-import-body"><p>Register multiple '+(isFixed(card)?'pairs':'players')+' from a list or Reclub event.</p>'+
 '<button type="button" data-p59-open="reclub"><span>Import from Reclub</span><span aria-hidden="true">›</span></button>'+
 '<button type="button" data-p59-open="paste"><span>Paste Player List</span><span aria-hidden="true">›</span></button></div>';
 details.querySelectorAll('[data-p59-open]').forEach(button=>button.addEventListener('click',()=>{
  if(modal)modal.remove();
  markupModal(card);
  if(button.dataset.p59Open==='reclub')modal.querySelector('[data-p59-method="reclub"]').click();
 }));
 anchor.parentNode.insertBefore(details,anchor);
}
function run(){
 if(inFlight)return;inFlight=true;
 try{
  document.querySelectorAll(sel).forEach(importCard);
 }finally{inFlight=false}
}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const ob=new MutationObserver(()=>{if(document.querySelector(sel))schedule()});
ob.observe(document.body,{subtree:true,childList:true});
})();