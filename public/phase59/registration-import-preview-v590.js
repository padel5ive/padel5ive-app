/* PADEL 5IVE v5.9.1 — Registration Reclub share auto-detect preview.
 * Recognizes a direct event URL OR the entire WhatsApp share message.
 * Never fabricates attendee names, hits undocumented endpoints, or writes
 * to native tournament state. An approved Reclub integration is required
 * before attendance can be imported.
 */
(()=>{'use strict';
const regSelector='.p5-b32-registration';
const rootDocument=document; // stable reference after test teardown
const create=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
let modal=null;
const urlPattern=/https?:\/\/(?:www\.)?reclub\.co\/(?:[a-z]{2}\/)?m\/[a-z0-9]+(?:[/?#][^\s<>]*)?/ig;
function parseSharedMessage(text){
 const value=String(text||'').trim();
 const candidate=value.match(urlPattern)?.[0]?.replace(/[),.;!?]+$/g,'');
 if(!candidate)return {valid:false,error:'Reclub event link not found. Paste a Reclub RSVP message or event URL.'};
 let url;
 try{url=new URL(candidate);}catch{return {valid:false,error:'This Reclub URL is not valid.'};}
 if(!['reclub.co','www.reclub.co'].includes(url.hostname.toLowerCase()))return {valid:false,error:'Only links from reclub.co are accepted.'};
 const found=url.pathname.match(/^\/(?:[a-z]{2}\/)?m\/([a-z0-9]{4,16})\/?$/i);
 if(!found)return {valid:false,error:'Reclub event link format not recognized.'};
 const lines=value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const nameLine=lines.find(s=>!s.includes('reclub.co')&&!/^(?:RSVP|⏰|📍|Date:|Time:|Location:)/i.test(s))||'';
 const title=nameLine.replace(/^[🟤🔴🟠🟡🟢🔵🟣⚪⚫•\s]+/u,'').trim().slice(0,130);
 const when=lines.find(s=>/^⏰|^(?:Date|Time):/i.test(s))?.replace(/^⏰\s*|^(?:Date|Time):\s*/i,'').trim().slice(0,100)||'';
 const venue=lines.find(s=>/^📍|^Location:/i.test(s))?.replace(/^📍\s*|^Location:\s*/i,'').trim().slice(0,100)||'';
 const eventCode=found[1].toUpperCase();
 return {valid:true,eventCode,url:'https://reclub.co/id/m/'+eventCode,title,when,venue};
}
function showDetected(container,raw){
 container.replaceChildren();
 const info=parseSharedMessage(raw);
 if(!raw.trim()){container.hidden=true;return}
 container.hidden=false;
 if(!info.valid){container.append(create('p','p59-warning',info.error));return}
 const head=create('div','p59-detected-header');
 head.append(create('span','p59-detected-status','EVENT DETECTED'));
 head.append(create('strong','',info.eventCode));
 container.append(head);
 if(info.title)container.append(create('p','p59-event-name',info.title));
 if(info.when)container.append(create('p','p59-event-meta','⏰ '+info.when));
 if(info.venue)container.append(create('p','p59-event-meta','📍 '+info.venue));
 const visit=create('a','p59-event-link','View Reclub Event ↗');
 visit.href=info.url;visit.target='_blank';visit.rel='noopener noreferrer';
 container.append(visit);
 const explain=create('div','p59-connection-note');
 explain.append(create('b','','PARTICIPANT IMPORT NOT CONNECTED'));
 explain.append(create('p','',
  'This event was detected from your message. Player names have not been retrieved. Authorized Reclub attendance access must be connected before automatic import can be enabled.'));
 container.append(explain);
}
function openModal(){
 if(modal){modal.remove();modal=null}
 const layer=create('div','p59-layer');layer.dataset.p59Modal='';
 layer.innerHTML='<section class="p59-dialog" role="dialog" aria-modal="true" aria-labelledby="p59-modal-title">'+
  '<header class="p59-modal-head"><div><small>PADEL 5IVE · REGISTRATION</small><h2 id="p59-modal-title">Import from Reclub</h2></div><button type="button" class="p59-close" aria-label="Close">×</button></header>'+
  '<div class="p59-content"><label for="p59-share">RECLUB EVENT LINK OR SHARED MESSAGE</label>'+
  '<textarea id="p59-share" rows="6" spellcheck="false" placeholder="Paste the Reclub invitation or RSVP URL here"></textarea>'+
  '<p class="p59-help">Paste the entire message from Reclub or WhatsApp. The event link is detected automatically.</p>'+
  '<div class="p59-preview" id="p59-preview" aria-live="polite" hidden></div></div>'+
  '<footer class="p59-modal-foot"><span>EVENT DETECTION PREVIEW · NO ROSTER CHANGES</span><button type="button" class="p59-commit" disabled title="Requires approved Reclub attendance access">Import Participants</button></footer></section>';
 const close=()=>{layer.remove();modal=null;document.removeEventListener('keydown',keydown)};
 const keydown=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
 layer.querySelector('.p59-close').addEventListener('click',close);
 layer.addEventListener('click',e=>{if(e.target===layer)close()});
 document.addEventListener('keydown',keydown);
 const textarea=layer.querySelector('#p59-share'),preview=layer.querySelector('#p59-preview');
 textarea.addEventListener('input',()=>showDetected(preview,textarea.value));
 document.body.append(layer);modal=layer;textarea.focus();
}
function insertImport(card){
 if(card.querySelector('[data-p59-import]'))return;
 const anchor=card.querySelector('.p5-50-rules, .p5-b42-reg-footer, .p5-52-footer');
 if(!anchor)return;
 const section=create('details','p59-import');section.dataset.p59Import='';
 section.innerHTML='<summary><span class="p59-import-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 18v3h14v-3" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Import from Reclub</span><span class="p59-chevron" aria-hidden="true">⌄</span></summary>'+
 '<div class="p59-import-body"><p>Paste a Reclub event URL or the complete RSVP message.</p><button type="button" data-p59-open><span>Paste Reclub Invitation</span><span aria-hidden="true">›</span></button></div>';
 section.querySelector('[data-p59-open]').addEventListener('click',openModal);
 anchor.parentNode.insertBefore(section,anchor);
}
function run(){
 document.querySelectorAll(regSelector).forEach(insertImport);
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
const observer=new MutationObserver(()=>{
 if(rootDocument.defaultView&&rootDocument.body&&rootDocument.querySelector(regSelector))schedule();
});
observer.observe(document.body,{subtree:true,childList:true});
// Expose only the pure share-message parser for test automation (never roster).
window.P5ReclubSharePreview=Object.freeze({parseSharedMessage});
})();