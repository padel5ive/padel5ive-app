/* PADEL 5IVE · Phase 5.7 Session History. Device-local, shared Home entry. */
(()=>{'use strict';
const K={u:'padel5ive-shared-foundation-v2.4-parity-lab',ul:'padel5ive-shared-v2.10-existing-sessions',c:'padel5ive-team-showdown-state-v3',cl:'padel5ive-clubmatch-p54-sessions'};
const MODES={'fp-americano':'Americano · Fixed Partner','fp-mexicano':'Mexicano · Fixed Partner','individual-americano':'Americano · Flexible','individual-mexicano':'Mexicano · Flexible','structured-americano':'Americano · Structured','structured-mexicano':'Mexicano · Structured'};
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const e=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;};
const isFinal=s=>['champion','finished','completed','complete','final'].includes(String(s?.stage||'').toLowerCase());
const validU=s=>s?.version===24&&Array.isArray(s.roster)&&Array.isArray(s.rounds)&&s.stage&&s.stage!=='setup'&&s.session;
const validC=s=>!!(s?.setup?.sessionName&&s?.stage);
let overlay,list,count,openButton,filter='all';
function all(){
 const out=[],u=get(K.u),c=get(K.c);
 if(validU(u))out.push({kind:'u',live:true,id:u._sessionId||'current',s:u,at:Date.now()});
 if(validC(c))out.push({kind:'c',live:true,id:'current',s:c,at:Date.now()-1});
 for(const [kind,key,check] of [['u',K.ul,validU],['c',K.cl,validC]]){
  const x=get(key);if(Array.isArray(x))for(const v of x)if(v?.id&&check(v.state))out.push({kind,live:false,id:v.id,s:v.state,at:+v.savedAt||0});
 }
 const seen=new Set();return out.filter(x=>{const id=x.kind+':'+(x.s._sessionId||x.id);if(seen.has(id))return false;seen.add(id);return true}).sort((a,b)=>b.at-a.at);
}
const title=x=>String(x.kind==='c'?x.s.setup.sessionName:x.s.session).slice(0,85);
const label=x=>x.kind==='c'?'TEAM SHOWDOWN':MODES[x.s.mode]||'AMERICANO / MEXICANO';
const gameDate=x=>x.kind==='c'?(x.s.setup.gameDate||x.s.setup.date||x.s.date||''):x.s.date||'';
const gameTime=x=>x.kind==='c'?(x.s.setup.gameTime||x.s.setup.time||x.s.time||''):x.s.time||'';
function dateLine(x){const d=gameDate(x);let output=d||'Date not set';if(/^\d{4}-\d\d-\d\d$/.test(d)){const dt=new Date(d+'T12:00:00Z');if(!isNaN(dt))output=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(dt);}return [output,gameTime(x)].filter(Boolean).join(' · ');}
function nav(url){overlay.hidden=true;location.assign(url);}
function route(x){return x.kind==='c'?'/modes/club-match/?intent='+(x.live?'resume':'archive&id='+encodeURIComponent(x.id)):'/modes/unified/?intent=resume';}
function backup(x){const blob=new Blob([JSON.stringify(x.s,null,2)],{type:'application/json'}),link=e('a');link.href=URL.createObjectURL(blob);link.download='PADEL5IVE_'+x.kind.toUpperCase()+'_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
function resume(x){
 if(x.live||x.kind==='c')return nav(route(x));
 if(!confirm('Resume '+title(x)+'? The current active session will be archived first.'))return;
 const src=get(K.ul),archive=Array.isArray(src)?src.slice():[],target=archive.find(v=>v.id===x.id),active=get(K.u);
 if(!target)return alert('Saved session not found. Please reopen Session History.');
 const remain=archive.filter(v=>v.id!==x.id);
 if(validU(active)&&active._sessionId!==x.id){const id=active._sessionId||'sess-'+Date.now().toString(36);const record={id,savedAt:Date.now(),state:active},i=remain.findIndex(v=>v.id===id);if(i>=0)remain[i]=record;else remain.push(record);}
 if(remain.length>50)return alert('Session History is full. Export backups before switching.');
 const oldU=localStorage.getItem(K.u),oldL=localStorage.getItem(K.ul);
 try{set(K.ul,remain);set(K.u,target.state);}catch{
  try{if(oldL===null)localStorage.removeItem(K.ul);else localStorage.setItem(K.ul,oldL);if(oldU===null)localStorage.removeItem(K.u);else localStorage.setItem(K.u,oldU);}catch{}
  return alert('Unable to safely resume session. Existing data is preserved.');
 }
 nav(route({...x,live:true}));
}
function remove(x){
 if(!confirm('Delete '+title(x)+' from this device? This does not revoke published results.'))return;
 try{if(x.live)localStorage.removeItem(x.kind==='u'?K.u:K.c);
 else{const key=x.kind==='u'?K.ul:K.cl;set(key,(get(key)||[]).filter(v=>v.id!==x.id));}render();}
 catch{alert('Unable to remove this local session.');}
}
function render(){
 const a=all(),selected=a.filter(x=>filter==='all'||(filter==='past'?isFinal(x.s):!isFinal(x.s)));
 count.textContent=a.length+' LOCAL SESSION'+(a.length===1?'':'S');
 list.replaceChildren();
 if(!selected.length)list.appendChild(e('p','p57-empty',a.length?'No sessions in this category.':'No sessions saved on this device.'));
 for(const x of selected){
  const card=e('article','p57-session'),head=e('div','p57-session-head'),badge=e('span','p57-session-status '+(isFinal(x.s)?'past':'active'),isFinal(x.s)?'PAST':'ACTIVE');
  head.append(e('strong','',title(x)),badge);
  card.append(head,e('p','p57-mode',label(x)),e('p','p57-meta',dateLine(x)));
  const buttons=e('div','p57-session-actions');
  for(const [word,fn,cls] of [[isFinal(x.s)?'View Results':'Resume',()=>resume(x),'primary'],['Backup',()=>backup(x),''],['Delete',()=>remove(x),'danger']]){
   const b=e('button',cls,word);b.type='button';b.addEventListener('click',fn);buttons.appendChild(b);
  }
  card.appendChild(buttons);list.appendChild(card);
 }
 overlay.querySelectorAll('[data-p57-filter]').forEach(b=>{const active=b.dataset.p57Filter===filter;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
}
async function restore(file){
 if(!file)return;if(file.size>5*1024*1024)return alert('File too large (maximum 5 MB).');
 let obj;try{obj=JSON.parse(await file.text())}catch{return alert('Invalid JSON backup.')}
 const isU=obj?.version===24&&Array.isArray(obj.roster)&&Array.isArray(obj.rounds)&&['registration','stage1','stage1finished','ko','champion'].includes(obj.stage);
 const isC=validC(obj);if(!isU&&!isC)return alert('Unrecognized PADEL 5IVE backup format.');
 if(!confirm('Restore backup? Your current session will be archived first.'))return;
 const key=isU?K.u:K.c,lib=isU?K.ul:K.cl,old=localStorage.getItem(key),oldLib=localStorage.getItem(lib);
 const active=get(key),saved=get(lib),arr=Array.isArray(saved)?saved.slice():[];
 if((isU?validU(active):validC(active))){const id=isU?(active._sessionId||'sess-'+Date.now().toString(36)):'club-'+Date.now().toString(36),entry={id,savedAt:Date.now(),state:active};const index=arr.findIndex(x=>x.id===id);if(index>=0)arr[index]=entry;else arr.push(entry);}
 if(arr.length>50)return alert('Session library full. Export an older backup before restoring.');
 try{set(lib,arr);set(key,obj);}catch{
  try{if(oldLib===null)localStorage.removeItem(lib);else localStorage.setItem(lib,oldLib);if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old);}catch{}
  return alert('Could not safely save restored session.');
 }
 nav(isU?'/modes/unified/?intent=resume':'/modes/club-match/?intent=resume');
}
function init(){
 const actions=document.querySelector('.p541-home-actions');if(!actions||document.getElementById('p57-history-button'))return;
 openButton=e('button','p57-history-link','SESSION HISTORY');openButton.id='p57-history-button';openButton.type='button';actions.insertBefore(openButton,document.getElementById('p54-resume'));
 overlay=e('div','p57-overlay');overlay.hidden=true;overlay.innerHTML='<section class="p57-panel" role="dialog" aria-modal="true" aria-labelledby="p57-title"><header><div><p class="p57-eyebrow">PADEL 5IVE · MATCH CONTROL</p><h2 id="p57-title">SESSION HISTORY</h2><p>Manage saved sessions on this device</p></div><button type="button" class="p57-close" aria-label="Close">×</button></header><nav class="p57-history-nav" aria-label="Session filters"><div><button data-p57-filter="all">All</button><button data-p57-filter="active">Active</button><button data-p57-filter="past">Past</button></div><small id="p57-count"></small></nav><div class="p57-list" id="p57-list"></div><footer><label class="p57-restore">Restore Backup JSON<input type="file" accept=".json,application/json" id="p57-file" hidden></label><p>Scores are stored locally. Export a backup before clearing Safari or removing the app.</p></footer></section>';
 document.body.appendChild(overlay);list=document.getElementById('p57-list');count=document.getElementById('p57-count');
 openButton.addEventListener('click',()=>{filter='all';render();overlay.hidden=false;overlay.querySelector('.p57-close').focus();});
 const close=()=>{overlay.hidden=true;openButton.focus();};
 overlay.querySelector('.p57-close').addEventListener('click',close);
 overlay.addEventListener('click',x=>{if(x.target===overlay)close();});
 overlay.querySelectorAll('[data-p57-filter]').forEach(x=>x.addEventListener('click',()=>{filter=x.dataset.p57Filter;render();}));
 document.getElementById('p57-file').addEventListener('change',async x=>{await restore(x.target.files?.[0]);x.target.value='';});
 document.addEventListener('keydown',x=>{if(x.key==='Escape'&&!overlay.hidden)close();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
