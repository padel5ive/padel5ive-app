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
// UI presentation state is not a score edit. Exclude it from dirty/conflict detection.
// Viewer round selection is local presentation, not a cloud score change.
const legacyStable=s=>{if(!s||typeof s!=='object')return '';const copy={...s};delete copy.ui;return JSON.stringify(copy)};
const stable=s=>{if(!s||typeof s!=='object')return '';const copy={...s};delete copy.ui;if(kind==='unified')delete copy.viewRound;return JSON.stringify(copy)};
const formatDate=s=>{if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return s||'';const d=new Date(s+'T12:00:00Z');return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d)};
function viewerLink(m){
 if(m.shortToken)return location.origin+'/v/'+m.code+'.'+m.shortToken;
 // Older viewer links remain valid, even for already-shared WhatsApp messages.
 return location.origin+'/#'+new URLSearchParams({join:m.code,v:m.viewerKey}).toString()
}
async function ensureShortViewerLink(){
 if(meta?.role!=='controller'||!meta.viewerKey||meta.shortToken)return;
 const r=await api('share-short',{code:meta.code,token:meta.token});
 if(!r.shortToken)throw Error('Short Viewer Link could not be created.');
 meta.shortToken=r.shortToken;persist();
}
let preparingShort=false,shortLinkError='';
function prefetchShortViewerLink(){
 if(preparingShort||!meta||meta.role!=='controller'||!meta.viewerKey||meta.shortToken)return;
 preparingShort=true;shortLinkError='';
 void ensureShortViewerLink()
  .catch(err=>{shortLinkError=err?.message||'Unable to create short Viewer Link.'})
  .finally(()=>{preparingShort=false;if(dialog&&!dialog.hidden)render()});
}
function message(m){
 const s=m.summary||{},date=[formatDate(s.date),s.time].filter(Boolean).join(' · ');
 const top='*PADEL 5IVE · CLOUD SESSION*\n_BEYOND 5IVE. BEYOND PLAY._\n\n'+
  '*'+(s.session||'Game Session')+'*\n'+(date?date+'\n\n':'\n');
 if(m.viewerKey)return top+'*JOIN LIVE SESSION*\n'+viewerLink(m)+'\n\n'+
  '*MANUAL ACCESS*\nOpen '+location.origin+' → Load Session\n'+
  '*SESSION CODE:* '+m.code+'\n\n_View Only · Live Scores · Auto Sync_';
 return top+location.origin+'\n\n*SESSION CODE:* '+m.code+'\n*ACCESS PIN:* '+(m.pin||'')+
  '\n\n*HOW TO ACCESS*\n1. Open the link → Load Session.\n2. Enter Code & PIN → Load Session.'+
  '\n\n*HOW TO TAKE CONTROL*\n1. Open Menu & Settings → Cloud Session.\n2. Tap Take Control.\n3. Current controller taps Approve Control Transfer.'+
  '\n\n*NOTE*\nOne controller at a time. Others are View Only. Offline control transfers after the lease expires.';
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
const liveKey=()=> 'p5814-follow-live-'+kind+'-'+(meta?.code||'');
function isFollowingLive(){try{return sessionStorage.getItem(liveKey())!=='off'}catch{return true}}
function setFollowingLive(value){try{sessionStorage.setItem(liveKey(),value?'on':'off')}catch{}}
function latestRound(state){
 const max=Math.max(0,(state?.rounds?.length||1)-1);
 const current=Number(state?.currentRound);
 const selected=Number(state?.viewRound);
 return Math.max(0,Math.min(Number.isInteger(current)?current:Number.isInteger(selected)?selected:0,max));
}
function dirty(){const s=get(KEY);return isSession(s)&&stable(s)!==last}
function mark(){
 if(!status)return;
 const label=!meta?'LOCAL ONLY':conflict?'CONFLICT · LOCAL PRESERVED':offline?'OFFLINE · NOT SYNCED':busy?'SYNCING':view()?'VIEW ONLY':meta.waiting?'TRANSFER PENDING':'SYNCED';
 status.textContent=label;
 status.dataset.state=conflict?'danger':offline?'warning':view()?'viewer':'ready';
 if(openButton)openButton.textContent=meta?'CLOUD SESSION':'SAVE TO CLOUD';
 document.body.classList.toggle('p58-view-only',view());
 document.body.classList.toggle('p58-cloud-connected',!!meta);
 if(stamp)stamp.textContent=meta?'REVISION '+meta.revision+' · '+(role()==='controller'?'ACTIVE CONTROLLER':'VIEW ONLY'):'';
}
function info(text){const p=e('p','p58-message',text);return p}
function btn(label,fn,secondary=false){
 const b=e('button','p58-action'+(secondary?' secondary':''),label);b.type='button';
 b.addEventListener('click',async()=>{if(working)return;working=true;b.disabled=true;try{await fn()}catch(err){alert(err.message||'Unable to perform this action.')}finally{working=false;b.disabled=false;render();}});
 return b;
}
function card(label,value){const w=e('div','p58-credential');w.append(e('small','',label),e('strong','',value));return w}
function pinCard(pin){
 const box=card('MODERATOR PIN · PRIVATE',pin);
 box.classList.add('p58-private-pin-copy');box.setAttribute('role','button');
 box.setAttribute('tabindex','0');box.setAttribute('aria-label','Copy Moderator PIN privately');
 box.append(e('small','p58-copy-hint','TAP TO COPY · SHARE PRIVATELY'));
 const copy=async()=>{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(pin);
  else{
   const a=e('textarea');a.value=pin;document.body.append(a);a.select();
   const ok=document.execCommand('copy');a.remove();
   if(!ok)throw Error('Copy is unavailable on this device.');
  }
  alert('Moderator PIN copied. Share only via private message.');
 };
 box.addEventListener('click',()=>void copy().catch(err=>alert(err.message)));
 box.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();void copy().catch(err=>alert(err.message))}});
 return box;
}
function render(){
 if(!body)return;
 mark();body.replaceChildren();
 if(!meta){
  const state=get(KEY);
  body.append(info('Save this session to use it across devices. Viewer Code and private Moderator PIN are generated automatically.'));
  const b=btn('SAVE TO CLOUD',async()=>{
   if(!isSession(state))throw Error('Complete session registration before saving to cloud.');
   if(!navigator.onLine)throw Error('Connect to the internet to create a Cloud Session.');
   const data=get(KEY),localId=identity(data);
   const result=await api('create',{kind,data,label:'Primary device'});
   meta={kind,code:result.code,token:result.token,pin:result.pin||null,
    moderatorPin:result.moderatorPin||null,viewerKey:result.viewerKey||null,shortToken:result.shortToken||null,
    moderatorPinRequired:!!result.moderatorPinRequired,moderatorPinDigits:result.moderatorPinDigits||null,summary:result.summary,
    localId,revision:result.revision,role:result.role,waiting:false};
   last=stable(data);persist();offline=false;conflict=false;dialog.hidden=false;
  });b.disabled=!isSession(state);body.append(b);return;
 }
 const cr=e('div','p58-credentials');
 cr.append(card('SESSION CODE',meta.code));
 if(meta.role==='controller'&&meta.moderatorPin)cr.append(pinCard(meta.moderatorPin));
 else if(meta.pin)cr.append(card('LEGACY ACCESS PIN',meta.pin));
 else if(meta.role==='controller'&&meta.moderatorPinRequired)
  cr.append(card('MODERATOR PIN · PRIVATE','Unlock below'));
 body.append(cr);
 const s=meta.summary||{};
 body.append(e('p','p58-session',s.session||'Cloud Session'));
 body.append(e('p','p58-date',[formatDate(s.date),s.time].filter(Boolean).join(' · ')));
 if(meta.role==='controller'&&(meta.viewerKey||meta.pin)){
  if(meta.moderatorPin)body.append(info('Moderator PIN stays private and is never included in Viewer WhatsApp shares. Share it separately with trusted moderators.'));
  if(meta.viewerKey&&!meta.shortToken){
   // Preparing on Cloud modal open avoids iPhone Safari popup blocks after
   // asynchronous network calls. Copy and WhatsApp share stay tap-synchronous.
   if(shortLinkError)body.append(info(shortLinkError));
   const prepare=btn(preparingShort?'PREPARING SHORT VIEWER LINK…':'GENERATE SHORT VIEWER LINK',
    async()=>{await ensureShortViewerLink()},true);
   prepare.disabled=preparingShort;body.append(prepare);
  }else{
   body.append(btn('SHARE VIEWER ACCESS · WHATSAPP',async()=>{
    const text=message(meta);
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');
   }));
   body.append(btn('COPY ACCESS DETAILS',async()=>{
    const str=message(meta);
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(str);
    else{
     const a=e('textarea');a.value=str;document.body.append(a);a.select();
     if(!document.execCommand('copy'))throw Error('Copy is unavailable on this device.');
     a.remove();
    }
    alert('Access details copied.');
   },true));
  }
 }
 const controls=e('div','p58-control-actions');
 const moderatorPinDigits=meta.moderatorPinDigits===4?4:6;
 if(meta.role==='viewer'){
  if(meta.moderatorPinRequired){
   const form=e('form','p58-moderator-form');
   const title=e('label','p58-moderator-label','MODERATOR PIN');
   const field=e('input','p58-moderator-input');
   field.type='password';field.inputMode='numeric';field.autocomplete='one-time-code';
   field.maxLength=moderatorPinDigits;field.pattern='[0-9]{'+moderatorPinDigits+'}';field.required=true;
   field.placeholder='Enter private '+moderatorPinDigits+'-digit PIN';
   title.append(field);form.append(title);
   const take=e('button','p58-action','TAKE CONTROL');take.type='submit';form.append(take);
   form.addEventListener('submit',async ev=>{
    ev.preventDefault();const pin=field.value.trim();
    if(!/^\d+$/.test(pin)||pin.length!==moderatorPinDigits||working)return;
    working=true;take.disabled=true;
    try{
     const response=await api('take-control',{code:meta.code,token:meta.token,moderatorPin:pin});
     if(!response.data||!response.viewerKey)throw Error('Secure moderator access could not be activated. Refresh and retry.');
     // PIN-authenticated takeover receives a fresh Viewer Link and preserves existing shares.
     meta.moderatorPin=pin;meta.viewerKey=response.viewerKey;meta.shortToken=response.shortToken||null;
     applyRemote(response,true);
    }catch(err){field.value='';alert(err.message||'Unable to take control.');}
    finally{working=false;take.disabled=false;}
   });
   controls.append(form);
  }else{
   controls.append(btn(meta.waiting?'REQUEST SENT · CHECK STATUS':'TAKE CONTROL',async()=>{
    const oldRevision=meta.revision;
    const result=await api('take-control',{code:meta.code,token:meta.token});
    Object.assign(meta,{role:result.role,waiting:!!result.waiting,revision:result.revision,summary:result.summary});persist();
    if(result.waiting)alert('Approval requested from the active device. If it is offline, control becomes available after its lease expires.');
    else if(result.role==='controller')conflict=result.revision!==oldRevision;
   },true));
  }
 }else{
  // A takeover completed before access-recovery support could have missing
  // viewer credentials on this device. PIN verification restores the identical
  // moderator sharing UI without exposing credentials to anonymous viewers.
  if(meta.moderatorPinRequired&&(!meta.moderatorPin||!meta.viewerKey)){
   controls.append(info('Enter your Moderator PIN once to unlock the complete Cloud Session controls on this device.'));
   const form=e('form','p58-moderator-form');
   const title=e('label','p58-moderator-label','MODERATOR PIN');
   const field=e('input','p58-moderator-input');
   field.type='password';field.inputMode='numeric';field.autocomplete='one-time-code';
   field.maxLength=moderatorPinDigits;field.pattern='[0-9]{'+moderatorPinDigits+'}';field.required=true;
   field.placeholder='Enter private '+moderatorPinDigits+'-digit PIN';
   title.append(field);form.append(title);
   const unlock=e('button','p58-action','UNLOCK ACCESS DETAILS');unlock.type='submit';form.append(unlock);
   form.addEventListener('submit',async event=>{
    event.preventDefault();const pin=field.value.trim();
    if(!/^\d+$/.test(pin)||pin.length!==moderatorPinDigits||working)return;
    working=true;unlock.disabled=true;
    try{
     const recovered=await api('recover-access',{code:meta.code,token:meta.token,moderatorPin:pin});
     if(!recovered.viewerKey)throw Error('Viewer Link could not be restored.');
     meta.moderatorPin=pin;meta.viewerKey=recovered.viewerKey;meta.shortToken=recovered.shortToken||null;
     persist();render();
    }catch(err){field.value='';alert(err.message||'Unable to unlock access details.');}
    finally{working=false;unlock.disabled=false;}
   });
   controls.append(form);
  }
  if(meta.takeoverRequested)controls.append(btn('APPROVE CONTROL TRANSFER',async()=>{
   if(dirty())await push();if(dirty())throw Error('Unsynced changes must be resolved before transferring control.');
   const r=await api('approve-control',{code:meta.code,token:meta.token});
   meta.role=r.role;meta.takeoverRequested=false;persist();await refresh();
  }));
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
 body.append(e('p','p58-footnote',meta.moderatorPinRequired?'Only one controller can edit. Keep Moderator PIN private.':'Only the active controller can edit. Legacy Access PIN grants access.'));
}
function applyRemote(r,force=false){
 if(!r?.data||!isSession(r.data)||identity(r.data)!==meta.localId){
  conflict=true;throw Error('Cloud session identity differs from the local session. Local data preserved.');
 }
 if(dirty()&&!force){
  conflict=true;throw Error('Local changes have not been uploaded. Cloud data was not applied.');
 }
 // Default: follow the latest active round. Browsing history pauses Live Follow.
 if(view()&&kind==='unified'){
  if(isFollowingLive())r.data={...r.data,viewRound:latestRound(r.data)};
  else{
   const selected=Number(get(KEY)?.viewRound);
   if(Number.isInteger(selected)&&Array.isArray(r.data.rounds)&&r.data.rounds.length)
    r.data={...r.data,viewRound:Math.max(0,Math.min(selected,r.data.rounds.length-1))};
  }
 }
 set(KEY,r.data);last=stable(r.data);
 meta.revision=r.revision;meta.role=r.role;meta.summary=r.summary;
 meta.waiting=!!r.pendingControl;meta.takeoverRequested=!!r.takeoverRequested;
 meta.moderatorPinRequired=!!r.moderatorPinRequired;
 meta.moderatorPinDigits=r.moderatorPinDigits||meta.moderatorPinDigits||null;
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
  // An offline controller can safely reclaim an expired, unowned lease when the
  // cloud revision is unchanged. Never auto-reclaim over another active device.
  if(meta.role==='controller'&&!meta.moderatorPinRequired&&r.role!=='controller'&&!r.controllerOnline&&r.revision===before){
   const resumed=await api('take-control',{code:meta.code,token:meta.token});
   if(resumed.role==='controller'){
    meta.role='controller';meta.revision=resumed.revision;meta.waiting=false;
    persist();mark();if(dirty())void push();return;
   }
  }
  if(r.role!==meta.role||r.revision!==before||!!r.pendingControl!==!!meta.waiting){
   const localDirty=dirty();
   if(r.revision!==before&&r.data){
    if(localDirty&&meta.role==='controller'){conflict=true;mark();return}
    applyRemote(r);return;
   }
   meta.role=r.role;meta.revision=r.revision;meta.summary=r.summary;
   meta.waiting=!!r.pendingControl;meta.takeoverRequested=!!r.takeoverRequested;
   meta.moderatorPinRequired=!!r.moderatorPinRequired;
   meta.moderatorPinDigits=r.moderatorPinDigits||meta.moderatorPinDigits||null;
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
 const bodyText=JSON.stringify(s),currentStable=stable(s);
 if(currentStable===last)return;
 busy=true;mark();
 try{
  const r=await api('save',{code:meta.code,token:meta.token,revision:meta.revision,data:s});
  last=currentStable;meta.revision=r.revision;meta.role=r.role;meta.summary=r.summary;meta.waiting=false;
  offline=false;persist();
 }catch(e){offline=!e.status||e.status>=500;if(e.status===409||e.status===423||e.status===401)conflict=true;}
 finally{busy=false;mark()}
}
async function heartbeat(){
 if(!meta||role()!=='controller'||busy||offline||conflict||document.hidden||dirty())return;
 try{
  const r=await api('heartbeat',{code:meta.code,token:meta.token});
  meta.role=r.role;meta.takeoverRequested=!!r.takeoverRequested;persist();
 }catch(e){if(e.status===423){meta.role='viewer';persist();void refresh();}else if(e.status===401)conflict=true;else offline=true;}
 mark();
}
// Verified native engine handlers. All other controls (especially score,
// next-round, stage mutations and edit/court tools) remain strictly blocked.
const viewerActions={
 unified:new Set(['round','view-schedule','tab-stage1','tab-stage2','back-stage1','bracket-nav','jump-ko-courts','ko-history','report-preview','report-close','replay-champion']),
 club:new Set(['view-round','toggle-rounds','latest-round','filter-leaderboard','jump-leaderboard','replay-champion'])
};
function viewerNavigation(target){
 // Explicitly allow only v5.8.14 spectator menu actions; no tournament mutation.
 const viewerButton=target?.closest?.('button[data-p5814-viewer-action]');
 if(viewerButton&&!viewerButton.disabled)
  return ['cloud','refresh','leave'].includes(viewerButton.dataset.p5814ViewerAction);
 const cloud=target?.closest?.('button[data-p58-cloud]');
 if(cloud&&!cloud.disabled)return true;
 const button=target?.closest?.('button[data-act],button[data-action]');
 if(!button||button.disabled)return false;
 return viewerActions[kind].has(kind==='club'?button.dataset.action:button.dataset.act);
}
function guard(e){
 if(!view()||!meta)return;
 if(e.target?.closest?.('#p58-cloud-host'))return;
 const t=e.target;
 if(e.type==='keydown'&&['Escape','Tab','ArrowUp','ArrowDown','PageUp','PageDown'].includes(e.key))return;
 // Navigate existing rounds/history and read-only tabs via click, keyboard,
 // or iOS touch. Never allow a mutation event or form submission through.
 const navEvent=e.type==='click'||e.type==='touchend'||e.type==='pointerup'||
   (e.type==='keydown'&&(e.key==='Enter'||e.key===' '));
 if(navEvent&&viewerNavigation(t))return;
 if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;
 if(e.type==='submit'||(e.type==='keydown'&&e.key==='Enter')||
    t?.closest?.('button,input,select,textarea,[data-act],[data-action],[contenteditable],label')){
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
 const close=btn('',async()=>{dialog.hidden=true},true);close.className='p58-close';close.setAttribute('aria-label','Close');
 // SVG keeps the X optically centered in its circle across iOS font metrics.
 close.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
 head.append(h,close);
 body=e('div','p58-body');panel.append(head,body);dialog.append(panel);host.append(dialog);document.body.append(host);
 openButton.addEventListener('click',()=>{dialog.hidden=false;render();prefetchShortViewerLink()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.hidden=true});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-p58-cloud]')){e.preventDefault();e.stopImmediatePropagation();dialog.hidden=false;render();prefetchShortViewerLink();}},true);
 for(const type of ['click','touchend','pointerup','change','input','submit','keydown'])document.addEventListener(type,guard,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden){dialog.hidden=true;}});
 render();
 if(meta){
  const local=get(KEY),snapshot=stable(local);
  // Existing cloud links were hashed before viewRound was classified as UI
  // state. Accept both hashes so opening a current session is never treated
  // as an offline conflict just because this version was deployed.
  last=(meta.lastHash===stringHash(snapshot)||meta.lastHash===stringHash(legacyStable(local)))?snapshot:'';
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
 window.addEventListener('online',async()=>{offline=false;await refresh();if(role()==='controller')await push()});
 window.addEventListener('pagehide',()=>{if(meta&&role()==='controller')localPersistHash()});
}
function stringHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
function localPersistHash(){if(meta&&last)meta.lastHash=stringHash(last);persist()}
function safeTick(){
 if(meta&&role()==='controller'&&!conflict&&!busy&&dirty())void push();
 if(meta&&last)localPersistHash();
}
window.addEventListener('visibilitychange',()=>{if(document.hidden)safeTick();else if(meta)void refresh()});
window.addEventListener('pageshow',()=>{if(meta&&!document.hidden)void refresh()});
window.addEventListener('beforeunload',localPersistHash);
window.P5CloudSession=Object.freeze({
 version:'5.8-lab',
 getStatus:()=>({connected:!!meta,code:meta?.code||null,role:role(),revision:meta?.revision||null,
  followingLive:isFollowingLive(),
  status:conflict?'CONFLICT':offline?'OFFLINE':busy?'SYNCING':view()?'VIEW ONLY':meta?'SYNCED':'LOCAL ONLY',
  waiting:!!meta?.waiting}),
 open:()=>{if(!meta||!dialog)return false;dialog.hidden=false;render();return true},
 refreshNow:async()=>{if(!meta)return false;await refresh();return !offline&&!conflict},
 setFollowLive:(enabled)=>{
  if(!view())return false;
  // Round buttons already update the native engine's in-memory viewRound and
  // render the selected round. Only remember the viewer's Follow Live choice.
  // Reloading here caused a full-page refresh every time the latest round
  // was selected, even when the moderator hadn't changed any cloud revision.
  setFollowingLive(!!enabled);
  return true;
 },
 leaveViewer:()=>{
  if(!meta||!view())return false;
  if(!confirm('Leave this Cloud Session on this device? Your local View Only copy will be cleared. The online session and other devices will not be affected.'))return false;
  const current=get(KEY);
  // Erase only this viewer's matching cloud copy; archived local sessions remain untouched.
  if(isSession(current)&&identity(current)===meta.localId)localStorage.removeItem(KEY);
  localStorage.removeItem(META);meta=null;last='';location.assign('/');return true;
 }
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();