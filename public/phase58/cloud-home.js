/* PADEL 5IVE v5.8 · Load Session from Home.
 * Codes/PINs are never placed into URLs or analytics.
 */
(()=>{'use strict';
const API='/api/cloud-session';
const K={unified:'padel5ive-shared-foundation-v2.4-parity-lab',
 club:'padel5ive-team-showdown-state-v3'};
const ARCH={unified:'padel5ive-shared-v2.10-existing-sessions',
 club:'padel5ive-clubmatch-p54-sessions'};
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const e=(tag,cls,text)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(text!==undefined)v.textContent=text;return v};
const identity=(data,kind)=>kind==='unified'
 ?String(data?._sessionId||(data?.session||'')+'|'+(data?.date||''))
 :String((data?.setup?.sessionName||'')+'|'+(data?.setup?.gameDate||data?.setup?.date||data?.date||''));
const active=(s,kind)=>kind==='unified'
 ?s?.version===24&&Array.isArray(s.roster)&&Array.isArray(s.rounds)&&!!s.session&&s.stage!=='setup'
 :!!s?.setup?.sessionName&&s.stage&&s.stage!=='setup';
async function api(action,values){
 const res=await fetch(API,{method:'POST',cache:'no-store',credentials:'same-origin',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...values})});
 let data;try{data=await res.json()}catch{throw Error('Unable to contact the Cloud Session service.')}
 if(!res.ok||!data?.ok)throw Error(data?.error||'Cloud Session is unavailable.');
 return data;
}
function joinSafe(result){
 const kind=result.kind;
 if(!Object.hasOwn(K,kind)||!active(result.data,kind))throw Error('The cloud session data is not compatible with this version.');
 // First join follows the active round, not a moderator's temporary history view.
 if(kind==='unified'&&result.role==='viewer'&&Array.isArray(result.data.rounds)&&result.data.rounds.length){
  const now=Number(result.data.currentRound);
  if(Number.isInteger(now))result={...result,data:{...result.data,
   viewRound:Math.max(0,Math.min(now,result.data.rounds.length-1))}};
 }
 const key=K[kind],archKey=ARCH[kind],metaKey='p58-cloud-link-'+kind;
 const oldCurrent=localStorage.getItem(key),oldArchive=localStorage.getItem(archKey),oldMeta=localStorage.getItem(metaKey);
 const current=get(key),arch=get(archKey),list=Array.isArray(arch)?arch.slice():[];
 // Never silently replace a local version of the SAME session; it may contain
 // offline scores that do not exist in cloud storage yet.
 if(active(current,kind)&&identity(current,kind)===identity(result.data,kind)){
  const same=a=>{const v={...a};delete v.ui;if(kind==='unified')delete v.viewRound;return JSON.stringify(v)};
  if(same(current)!==same(result.data))throw Error('This session already has local changes on this device. Export its JSON backup before loading the cloud version.');
 }
 // Save the current local session before switching. Even an unexpected error restores it.
 if(active(current,kind)&&identity(current,kind)!==identity(result.data,kind)){
  const id=kind==='unified'?(current._sessionId||'sess-'+Date.now()):'club-'+Date.now();
  const record={id,savedAt:Date.now(),state:current};
  const i=list.findIndex(x=>x.id===id);
  if(i>=0)list[i]=record;else list.push(record);
 }
 if(list.length>60)throw Error('Session History is full. Export and remove an old session first.');
 const link={kind,code:result.code,token:result.token,pin:null,viewerKey:null,
  moderatorPinRequired:!!result.moderatorPinRequired,summary:result.summary,
  localId:identity(result.data,kind),revision:result.revision,role:result.role,waiting:false};
 // Baseline hash to detect unexpected offline changes after the next app restart.
 const stableCopy={...result.data};delete stableCopy.ui;if(kind==='unified')delete stableCopy.viewRound;
 const raw=JSON.stringify(stableCopy);let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}
 link.lastHash=(h>>>0).toString(36);
 try{put(archKey,list);put(key,result.data);put(metaKey,link)}
 catch(err){
  try{for(const [k,v] of [[key,oldCurrent],[archKey,oldArchive],[metaKey,oldMeta]]){
   if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);
  }}catch{}
  throw Error('Device storage is full. Existing session was preserved.');
 }
 return kind==='unified'?'/modes/unified/?intent=resume':'/modes/club-match/?intent=resume';
}
function init(){
 const actions=document.querySelector('.p541-home-actions');
 if(!actions||document.getElementById('p58-load'))return;
 const button=e('button','p58-load','LOAD SESSION');button.id='p58-load';button.type='button';
 const history=document.getElementById('p57-history-button');
 actions.insertBefore(button,history||document.getElementById('p54-resume'));
 const overlay=e('div','p58-home-overlay');overlay.hidden=true;
 const panel=e('section','p58-home-panel');panel.setAttribute('role','dialog');
 panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Load Cloud Session');
 const header=e('header','p58-home-head'),head=e('div');
 head.append(e('small','','PADEL 5IVE · MATCH CONTROL'),e('h2','','LOAD SESSION'));
 const close=e('button','p58-home-close','×');close.type='button';close.setAttribute('aria-label','Close');
 header.append(head,close);panel.append(header);
 const description=e('p','p58-home-hint','Open a Viewer Link for instant access, or enter a Session Code manually.');
 const form=e('form','p58-home-form');
 const codeLabel=e('label','','SESSION CODE'),code=e('input','');
 code.id='p58-session-code';code.name='code';code.required=true;code.maxLength=11;
 code.setAttribute('autocomplete','off');code.setAttribute('autocapitalize','characters');
 code.placeholder='10-character Session Code';
 const pinLabel=e('label','','LEGACY ACCESS PIN'),pin=e('input','');
 pin.name='pin';pin.type='password';pin.maxLength=4;pin.pattern='[0-9]{4}';
 pin.setAttribute('inputmode','numeric');pin.setAttribute('autocomplete','off');
 pin.placeholder='4-digit PIN';
 codeLabel.append(code);pinLabel.append(pin);pinLabel.hidden=true;
 const submit=e('button','p58-home-submit','VIEW SESSION');submit.type='submit';
 const status=e('p','p58-home-status','');
 form.append(codeLabel,pinLabel,submit,status);panel.append(description,form);overlay.append(panel);document.body.append(overlay);
 const normalize=x=>String(x||'').toUpperCase().replace(/[\s-]/g,'');
 const isLegacy=c=>/^\d{6}$/.test(c);
 const isNew=c=>/^[2-9A-HJ-NP-Z]{10}$/.test(c);
 const updatePin=()=>{const old=isLegacy(normalize(code.value));pinLabel.hidden=!old;pin.required=old;};
 const hide=()=>{overlay.hidden=true;pin.value='';status.textContent=''};
 const show=()=>{overlay.hidden=false;updatePin();code.focus()};
 button.addEventListener('click',show);code.addEventListener('input',updatePin);
 close.addEventListener('click',hide);overlay.addEventListener('click',x=>{if(x.target===overlay)hide()});
 document.addEventListener('keydown',x=>{if(x.key==='Escape'&&!overlay.hidden)hide()});
 async function connect(c,options={}){
  const normalized=normalize(c);
  if(!isNew(normalized)&&!isLegacy(normalized))throw Error('Enter a valid Session Code.');
  if(isLegacy(normalized)&&!options.pin)throw Error('This older session requires its original 4-digit Access PIN.');
  if(!options.auto&&!confirm('Load this Cloud Session? Your different local session will be saved to Session History first.'))return;
  submit.disabled=true;submit.textContent='CONNECTING';status.textContent='Connecting to Live Session…';
  try{
   const label=/iPad/i.test(navigator.userAgent)?'iPad':/Android/i.test(navigator.userAgent)?'Android tablet / phone':'iPhone / browser';
   const r=await api('join',{code:normalized,...options.pin?{pin:options.pin}:{},
    ...options.viewerKey?{viewerKey:options.viewerKey}:{},label});
   const destination=joinSafe(r);
   location.assign(destination);
  }catch(err){
   overlay.hidden=false;status.textContent=err.message;submit.disabled=false;
   submit.textContent='VIEW SESSION';
  }
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();const c=normalize(code.value);status.textContent='';
  void connect(c,{pin:isLegacy(c)?pin.value.trim():undefined});
 });
 // The token is kept in a URL fragment, never HTTP request or referrer.
 // Erase it before loading the cloud session to avoid accidental sharing.
 const params=new URLSearchParams(location.hash.startsWith('#')?location.hash.slice(1):'');
 const autoCode=normalize(params.get('join')),viewerKey=params.get('v');
 if(autoCode&&viewerKey){
  window.history.replaceState(window.history.state,'',location.pathname+location.search);
  code.value=autoCode;updatePin();
  overlay.hidden=false;close.disabled=true;
  void connect(autoCode,{viewerKey,auto:true}).finally(()=>{close.disabled=false});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();