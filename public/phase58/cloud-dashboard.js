/* PADEL 5IVE v5.8 Cloud Session LAB — isolated dashboard adapter.
 * Never changes core engine. Local-first, with explicit cloud revision and writer lease.
 * Viewer is read-only. Conflicts never overwrite local session data.
 */
(()=>{'use strict';
const kind=location.pathname.includes('/club-match/')?'club':'unified';
const KEY=kind==='club'?'padel5ive-team-showdown-state-v3':'padel5ive-shared-foundation-v2.4-parity-lab';
const META='p58-cloud-link-'+kind,API='/api/cloud-session';
const get=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
const set=(key,obj)=>localStorage.setItem(key,JSON.stringify(obj));
const identity=s=>kind==='unified'
 ? String(s?._sessionId||(s?.session||'')+'|'+(s?.date||''))
 : String((s?.setup?.sessionName||'')+'|'+(s?.setup?.gameDate||s?.setup?.date||s?.date||''));
const isSession=s=>kind==='unified'
 ? s?.version===24&&Array.isArray(s.roster)&&Array.isArray(s.rounds)&&s.stage!=='setup'&&!!s.session
 : !!s?.setup?.sessionName&&!!s?.stage&&s.stage!=='setup';
const e=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const formatDate=s=>{if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return s||'';const d=new Date(s+'T12:00:00Z');return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d)};
function message(m){const s=m.summary||{},date=[formatDate(s.date),s.time].filter(Boolean).join(' · ');
 return '**PADEL 5IVE · CLOUD SESSION**\n*BEYOND 5IVE. BEYOND PLAY.*\n\n'+
 '**'+(s.session||'Game Session')+'**\n'+(date?date+'\n\n':'\n')+
 location.origin+'\n\n**SESSION CODE:** '+m.code+'\n**ACCESS PIN:** '+m.pin+
 '\n\n**HOW TO ACCESS**\n1. Open the link.\n2. Select **Load Session**.\n3. Enter the Session Code & PIN.\n4. Tap **Load Session**.';
}
async function api(action,opts={}){
 const res=await fetch(API,{method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...opts})});
 let j;try{j=await res.json()}catch{throw Error('Cloud service did not return a valid response.')}
 if(!res.ok||!j.ok){const err=Error(j.error||'Cloud operation failed.');err.status=res.status;err.info=j;throw err}
 return j;
}
function backup(s){
 const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),a=e('a');
 a.href=URL.createObjectURL(blob);a.download='PADEL5IVE_LOCAL_RECOVERY_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
let meta=get(META), last='',lastPoll=0,lastHeartbeat=0,busy=false,offline=false,conflict=false,working=false;
let host,openButton,dialog,body,status,stamp;
if(meta?.kind!==kind)meta=null;
if(meta&&(!isSession(get(KEY))||identity(get(KEY))!==meta.localId))meta=null;
function persist(){if(meta){if(last)meta.lastHash=stringHash(last);set(META,meta)}else localStorage.removeItem(META)}
function role(){return meta?.role||'none'}
function view(){return role()==='viewer'}
function dirty(){const s=get(KEY);return isSession(s)&&JSON.stringify(s)!==last}
function mark(){
 if(!status)return;
 const label=!meta?'LOCAL ONLY':conflict?'CONFLICT · LOCAL PRESERVED':offline?'OFFLINE · NOT SYNCED':busy?'SYNCING':view()?'VIEW ONLY':meta.waiting?'TRANSFER PENDING':'SYNCED';
 status.textContent=label;
 status.dataset.state=conflict?'danger':offline?'warning':view()?'viewer':'ready';
 if(openButton)openButton.textContent=meta?'CLOUD SESSION':'SAVE TO CLOUD';
 document.body.classList.toggle('p58-view-only',view());
 if(stamp)stamp.textContent=meta?'REVISION '+meta.revision+' · '+(role()==='controller'?'ACTIVE CONTROLLER':'VIEW ONLY'):'';
}
function info(text){const p=e('p','p58-message',text);return p}
function btn(label,fn,secondary=false){
 const b=e('button','p58-action'+(secondary?' secondary':''),label);b.type='button';
 b.addEventListener('click',async()=>{if(working)return;working=true;b.disabled=true;try{await fn()}catch(err){alert(err.message||'Unable to perform this action.')}finally{working=false;b.disabled=false;render();}});
 return b;
}
function card(label,value){const w=e('div','p58-credential');w.append(e('small','',label),e('strong','',value));return w}
function render(){
 if(!body)return;
 mark();body.replaceChildren();
 if(!meta){
  const state=get(KEY);
  body.append(info('Save your current session to open it on another device. Session Code and PIN are generated automatically.'));
  const b=btn('SAVE TO CLOUD',async()=>{
   if(!isSession(state))throw Error('Complete session registration before saving to cloud.');
   if(!navigator.onLine)throw Error('Connect to the internet to create a Cloud Session.');
   const data=get(KEY),localId=identity(data);
   const result=await api('create',{kind,data,label:'Primary device'});
   meta={kind,code:result.code,token:result.token,pin:result.pin,summary:result.summary,
    localId,revision:result.revision,role:result.role,waiting:false};
   last=JSON.stringify(data);persist();offline=false;conflict=false;dialog.hidden=false;
  });b.disabled=!isSession(state);body.append(b);return;
 }
 const cr=e('div','p58-credentials');
 cr.append(card('SESSION CODE',meta.code),card('ACCESS PIN',meta.pin||'Saved on creator device'));
 body.append(cr);
 const s=meta.summary||{};
 body.append(e('p','p58-session',s.session||'Cloud Session'));
 body.append(e('p','p58-date',[formatDate(s.date),s.time].filter(Boolean).join(' · ')));
 if(meta.pin){
  body.append(btn('SHARE VIA WHATSAPP',async()=>{
   const text=message(meta);window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
  }));
  body.append(btn('COPY ACCESS DETAILS',async()=>{
   const str=message(meta);if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(str);
   else{const a=e('textarea');a.value=str;document.body.append(a);a.select();if(!document.execCommand('copy'))throw Error('Copy is unavailable on this device.');a.remove();}
   alert('Access details copied.');
  },true));
 }
 const controls=e('div','p58-control-actions');
 if(meta.role==='viewer'){
  controls.append(btn(meta.waiting?'REQUEST SENT · CHECK STATUS':'TAKE CONTROL',async()=>{
   const r=await api('take-control',{code:meta.code,token:meta.token});
   Object.assign(meta,{role:r.role,waiting:!!r.waiting,revision:r.revision,summary:r.summary});persist();
   if(r.waiting)alert('Approval requested from the active device. If it is offline, control becomes available after its lease expires.');
   else if(r.role==='controller'){
    if(r.revision!==meta.revision)conflict=true;
    else conflict=false;
   }
  },true));
 }else{
  if(meta.takeoverRequested)controls.append(btn('APPROVE CONTROL TRANSFER',async()=>{
   if(dirty())await push();if(dirty())throw Error('Unsynced changes must be resolved before transferring control.');
   const r=await api('approve-control',{code:meta.code,token:meta.token});
   meta.role=r.role;meta.takeoverRequested=false;persist();await refresh();
  }));
  controls.append(btn('RELEASE CONTROL',async()=>{
   if(dirty())await push();if(dirty())throw Error('Unsynced local changes must be saved before releasing control.');
   const r=await api('release-control',{code:meta.code,token:meta.token});
   meta.role=r.role;persist();
  },true));
  controls.append(btn('SYNC NOW',async()=>{await push();await refresh()},true));
 }
 body.append(controls);
 if(conflict){
  body.append(info('This device has unsynced changes or a newer cloud revision. Nothing was overwritten. Download your local backup before restoring.'));
  body.append(btn('DOWNLOAD LOCAL BACKUP',async()=>backup(get(KEY)),true));
  body.append(btn('RESTORE LATEST CLOUD VERSION',async()=>{
   if(!confirm('Replace this device’s local version with the latest cloud version? Export a JSON backup first.'))return;
   const r=await api('sync',{code:meta.code,token:meta.token,force:true});
   if(!r.data)throw Error('Cloud session data not available.');
   backup(get(KEY));applyRemote(r,true);
  },true));
 }
 if(offline)body.append(info('Cloud unavailable. Changes remain on this device until a safe sync is possible.'));
 body.append(e('p','p58-footnote','Only the active controller can edit. Session Code and PIN grant access—share them privately.'));
}
function applyRemote(r,force=false){
 if(!r?.data||!isSession(r.data)||identity(r.data)!==meta.localId){
  conflict=true;throw Error('Cloud session identity differs from the local session. Local data preserved.');
 }
 if(dirty()&&!force){
  conflict=true;throw Error('Local changes have not been uploaded. Cloud data was not applied.');
 }
 set(KEY,r.data);last=JSON.stringify(r.data);
 meta.revision=r.revision;meta.role=r.role;meta.summary=r.summary;
 meta.waiting=!!r.pendingControl;meta.takeoverRequested=!!r.takeoverRequested;
 persist();offline=false;conflict=false;
 // Embedded engine keeps in-memory state: reload is necessary to render updated score cards.
 location.reload();
}
async function refresh(){
 if(!meta||busy||conflict)return;
 const before=meta.revision;
 try{
  const r=await api('sync',{code:meta.code,token:meta.token,afterRevision:before});
  offline=false;
  if(r.role!==meta.role||r.revision!==before||!!r.pendingControl!==!!meta.waiting){
   const localDirty=dirty();
   if(r.revision!==before&&r.data){
    if(localDirty&&meta.role==='controller'){conflict=true;mark();return}
    applyRemote(r);return;
   }
   meta.role=r.role;meta.revision=r.revision;meta.summary=r.summary;
   meta.waiting=!!r.pendingControl;meta.takeoverRequested=!!r.takeoverRequested;
   persist();
   if(localDirty&&r.role!=='controller')conflict=true;
  }else{
   meta.takeoverRequested=!!r.takeoverRequested;
  }
  mark();if(dialog&&!dialog.hidden)render();
 }catch(e){if(e.status===401){conflict=true;}else offline=true;mark();}
}
async function push(){
 if(!meta||role()!=='controller'||busy||conflict)return;
 const s=get(KEY);if(!isSession(s)||identity(s)!==meta.localId){conflict=true;mark();return}
 const bodyText=JSON.stringify(s);
 if(bodyText===last)return;
 busy=true;mark();
 try{
  const r=await api('save',{code:meta.code,token:meta.token,revision:meta.revision,data:s});
  last=bodyText;meta.revision=r.revision;meta.role=r.role;meta.summary=r.summary;meta.waiting=false;
  offline=false;persist();
 }catch(e){offline=!e.status||e.status>=500;if(e.status===409||e.status===423||e.status===401)conflict=true;}
 finally{busy=false;mark()}
}
async function heartbeat(){
 if(!meta||role()!=='controller'||busy||offline||conflict||document.hidden||dirty())return;
 try{
  const r=await api('heartbeat',{code:meta.code,token:meta.token});
  meta.role=r.role;meta.takeoverRequested=!!r.takeoverRequested;persist();
 }catch(e){if(e.status===423||e.status===401)conflict=true;else offline=true;}
 mark();
}
function guard(e){
 if(!view()||!meta)return;
 if(e.target?.closest?.('#p58-cloud-host'))return;
 if(e.type==='keydown'&&['Escape','Tab','ArrowUp','ArrowDown','PageUp','PageDown',' '].includes(e.key))return;
 // Read-only client: prevent all editing controls and in-engine mutation actions.
 const t=e.target;
 if(e.type==='submit'||(e.type==='keydown'&&e.key==='Enter')||
    t?.closest?.('button,input,select,textarea,[data-act],[contenteditable],label')){
  e.preventDefault();e.stopImmediatePropagation();
 }
}
function mount(){
 if(document.getElementById('p58-cloud-host'))return;
 host=e('div','p58-host');host.id='p58-cloud-host';
 openButton=e('button','p58-launch',meta?'CLOUD SESSION':'SAVE TO CLOUD');
 openButton.type='button';host.append(openButton);
 status=e('span','p58-status','');host.append(status);
 dialog=e('div','p58-backdrop');dialog.hidden=true;
 const panel=e('section','p58-panel');
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Cloud Session');
 const head=e('header','p58-head');
 const h=e('div');h.append(e('small','p58-eyebrow','PADEL 5IVE · MATCH CONTROL'),e('h2','','CLOUD SESSION'));
 stamp=e('small','p58-stamp','');h.append(stamp);
 const close=btn('×',async()=>{dialog.hidden=true},true);close.className='p58-close';close.setAttribute('aria-label','Close');
 head.append(h,close);
 body=e('div','p58-body');panel.append(head,body);dialog.append(panel);host.append(dialog);document.body.append(host);
 openButton.addEventListener('click',()=>{dialog.hidden=false;render()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.hidden=true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-p58-cloud]')){e.preventDefault();e.stopImmediatePropagation();dialog.hidden=false;render();}},true);
 for(const type of ['click','change','input','submit','keydown'])document.addEventListener(type,guard,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden){dialog.hidden=true;}});
 render();
 if(meta){last=meta.lastHash===stringHash(JSON.stringify(get(KEY)))?JSON.stringify(get(KEY)):'';
  // Device was edited offline while this app was closed: retain dirty session instead of treating it as cloud baseline.
  if(!last){offline=true;conflict=false;}
  void refresh();
 }
 setInterval(()=>{
  if(!meta||document.hidden)return;
  const ts=Date.now();
  if(meta.role==='controller'&&!busy&&!conflict&&dirty())void push();
  if(ts-lastPoll>5500){lastPoll=ts;void refresh();}
  if(ts-lastHeartbeat>35000){lastHeartbeat=ts;void heartbeat();}
 },1800);
 window.addEventListener('online',()=>{offline=false;void refresh();if(role()==='controller')void push()});
 window.addEventListener('pagehide',()=>{if(meta&&role()==='controller')localPersistHash()});
}
function stringHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
function localPersistHash(){if(meta&&last)meta.lastHash=stringHash(last);persist()}
function safeTick(){
 if(meta&&role()==='controller'&&!conflict&&!busy&&dirty())void push();
 if(meta&&last)localPersistHash();
}
window.addEventListener('visibilitychange',()=>{if(document.hidden)safeTick()});
window.addEventListener('beforeunload',localPersistHash);
window.P5CloudSession=Object.freeze({version:'5.8-lab',getStatus:()=>({connected:!!meta,role:role(),revision:meta?.revision||null})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();