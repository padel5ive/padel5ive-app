/* PADEL 5IVE v5.8.5 — presentation-only menu consolidation.
   Move live DOM nodes, never clone real buttons (their handlers stay intact).
   Applies to unified Americano/Mexicano variations and Club Match.
*/
(()=>{'use strict';
const create=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const heading=txt=>create('div','p585-heading',txt);
const block=(title)=>{const s=create('section','p585-group');s.append(heading(title));return s};
const nodes=(from,to)=>{if(!from||!to)return;while(from.firstChild)to.append(from.firstChild)};
const mark=(root)=>root.setAttribute('data-p585-done','yes');
const was=(root)=>root.getAttribute('data-p585-done')==='yes';
function moveInto(content,root){
 const s=root.querySelector(':scope > .p5-4852-content');
 if(s)nodes(s,content);
}
function unified(root){
 if(was(root))return;
 const pieces=Array.from(root.children).filter(x=>x.tagName==='DETAILS');
 const share=pieces.find(x=>x.getAttribute('data-submenu')==='share');
 const session=pieces.find(x=>x.querySelector('.p5-4852-label')?.textContent?.trim()==='Session Management');
 const advanced=pieces.find(x=>x.querySelector('.p5-4852-label')?.textContent?.trim()==='Advanced Settings');
 if(!share||!session||!advanced)return;
 const content=share.querySelector(':scope > .p5-4852-content');
 const sessionContent=session.querySelector(':scope > .p5-4852-content');
 const advancedContent=advanced.querySelector(':scope > .p5-4852-content');
 if(!content||!sessionContent||!advancedContent)return;
 const title=share.querySelector(':scope > summary .p5-4852-label');
 if(title)title.textContent='Session & Results';
 const results=block('RESULTS & EXPORT');
 const link=content.querySelector('[data-act="share-result-link"]');
 const pdf=content.querySelector('[data-act="pdf-download"]');
 if(link)results.append(link);
 if(pdf)results.append(pdf);
 nodes(content,results);
 content.append(results);
 const sessionGroup=block('SESSION DATA');
 nodes(sessionContent,sessionGroup);
 content.append(sessionGroup);
 const details=create('details','p585-tools');
 const summary=create('summary','','Advanced Tools');
 const body=create('div','p585-tools-body');
 nodes(advancedContent,body);
 details.append(summary,body);content.append(details);
 session.remove();advanced.remove();mark(root);
}
function club(root){
 if(was(root))return;
 const pieces=Array.from(root.children).filter(x=>x.tagName==='DETAILS');
 const teams=pieces.find(x=>x.getAttribute('data-menu-section')==='Manage Teams');
 const courts=pieces.find(x=>x.getAttribute('data-menu-section')==='Manage Courts');
 const share=pieces.find(x=>x.getAttribute('data-menu-section')==='Share & Export');
 if(!teams||!courts||!share)return;
 const outer=create('details','p5-4852-section p585-manage');
 outer.setAttribute('data-menu-section','Manage Players & Courts');
 const top=teams.querySelector(':scope > summary')?.cloneNode(true);
 if(!top)return;
 const label=top.querySelector('.p5-4852-label');
 if(label)label.textContent='Manage Players & Courts';
 const manageContent=create('div','p5-4852-content p585-manage-content');
 root.insertBefore(outer,teams);outer.append(top,manageContent);
 manageContent.append(teams,courts);
 const title=share.querySelector(':scope > summary .p5-4852-label');
 if(title)title.textContent='Session & Results';
 const content=share.querySelector(':scope > .p5-4852-content');
 if(!content)return;
 const results=block('RESULTS & EXPORT');
 const link=content.querySelector('#shareResults');
 const pdf=content.querySelector('#exportPdf');
 if(link)results.append(link);
 if(pdf)results.append(pdf);
 nodes(content,results);
 content.append(results);
 const panel=share.closest('#mainMenu');
 const session=panel?.querySelector(':scope > .ops-actions > details.mc32-advanced')||panel?.querySelector('.ops-actions > details.mc32-advanced');
 const advanced=Array.from(panel?.querySelectorAll('.ops-actions > details.mc32-advanced')||[]).find(x=>x!==session&&x.querySelector('summary')?.textContent.trim()==='Advanced Settings');
 const sessionGroup=block('SESSION DATA');
 if(session){const el=session.querySelector('.mc32-advanced-body');if(el)nodes(el,sessionGroup);session.remove()}
 if(advanced){const el=advanced.querySelector('.mc32-advanced-body');if(el)nodes(el,sessionGroup);advanced.remove()}
 content.append(sessionGroup);mark(root);
}
function removeLiveBadge(){
 document.querySelectorAll('.p5-b41-leaderboard > .row.between .pill, .p5-b41-leaderboard > header .pill').forEach(x=>{
  if(x.textContent.trim().toUpperCase()==='LIVE')x.remove();
 });
 // Club leaderboard: only remove a LIVE marker inside its own heading; never the
 // top session badge or a court status badge.
 document.querySelectorAll('section.leaderboard .pill, section.leaderboard .badge').forEach(x=>{
  if(x.textContent.trim().toUpperCase()==='LIVE')x.remove();
 });
}
function run(){
 const menu=document.querySelector('#americano .p5-4852-menu');
 if(menu)unified(menu);
 const clubMenu=document.querySelector('#mainMenu .p5-4852-menu');
 if(clubMenu)club(clubMenu);
 removeLiveBadge();
}
let scheduled=false;
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;run()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
// Unified replaces the entire menu HTML on game actions. Keep the new view in sync.
const obs=new MutationObserver(schedule);
obs.observe(document.body,{childList:true,subtree:true});
})();
