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
 const key=K[kind],archKey=ARCH[kind],metaKey='p58-cloud-link-'+kind;
 const oldCurrent=localStorage.getItem(key),oldArchive=localStorage.getItem(archKey),oldMeta=localStorage.getItem(metaKey);
 const current=get(key),arch=get(archKey),list=Array.isArray(arch)?arch.slice():[];
 // Save the current local session before switching. Even an unexpected error restores it.
 if(active(current,kind)&&identity(current,kind)!==identity(result.data,kind)){
  const id=kind==='unified'?(current._sessionId||'sess-'+Date.now()):'club-'+Date.now();
  const record={id,savedAt:Date.now(),state:current};
  const i=list.findIndex(x=>x.id===id);
  if(i>=0)list[i]=record;else list.push(record);
 }
 if(list.length>60)throw Error('Session History is full. Export and remove an old session first.');
 const link={kind,code:result.code,token:result.token,pin:null,summary:result.summary,
  localId:identity(result.data,kind),revision:result.revision,role:result.role,waiting:false};
 // Baseline hash to detect unexpected offline changes after the next app restart.
 const stableCopy={...result.data};delete stableCopy.ui;
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
 const panel=e('section','p58-home-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Load Cloud Session');
 const header=e('header','p58-home-head'),head=e('div');
 head.append(e('small','','PADEL 5IVE · MATCH CONTROL'),e('h2','','LOAD SESSION'));
 const close=e('button','p58-home-close','×');close.type='button';close.setAttribute('aria-label','Close');
 header.append(head,close);panel.append(header);
 const description=e('p','p58-home-hint','Enter the Session Code and Access PIN to continue on this device.');
 const form=e('form','p58-home-form');
 const codeLabel=e('label','','SESSION CODE'),code=e('input','');
 code.id='p58-session-code';code.name='code';code.required=true;code.maxLength=6;code.pattern='[0-9]{6}';code.setAttribute('inputmode','numeric');code.setAttribute('autocomplete','off');code.placeholder='6-digit code';
 const pinLabel=e('label','','ACCESS PIN'),pin=e('input','');
 pin.name='pin';pin.type='password';pin.required=true;pin.maxLength=4;pin.pattern='[0-9]{4}';pin.setAttribute('inputmode','numeric');pin.setAttribute('autocomplete','off');pin.placeholder='4-digit PIN';
 codeLabel.append(code);pinLabel.append(pin);
 const submit=e('button','p58-home-submit','LOAD SESSION');submit.type='submit';
 const status=e('p','p58-home-status','');
 form.append(codeLabel,pinLabel,submit,status);panel.append(description,form);overlay.append(panel);document.body.append(overlay);
 const hide=()=>{overlay.hidden=true;pin.value='';status.textContent=''};
 button.addEventListener('click',()=>{overlay.hidden=false;code.focus()});
 close.addEventListener('click',hide);overlay.addEventListener('click',x=>{if(x.target===overlay)hide()});
 document.addEventListener('keydown',x=>{if(x.key==='Escape'&&!overlay.hidden)hide()});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const c=code.value.replace(/\s+/g,'').trim(),p=pin.value.trim();
  if(!/^\d{6}$/.test(c)||!/^\d{4}$/.test(p)){status.textContent='Enter a valid 6-digit code and 4-digit PIN.';return}
  if(!confirm('Load this cloud session? Your current local session will be archived first.'))return;
  submit.disabled=true;submit.textContent='CONNECTING';status.textContent='Connecting securely…';
  try{
   const r=await api('join',{code:c,pin:p,label:/iPad/i.test(navigator.userAgent)?'iPad':/Android/i.test(navigator.userAgent)?'Android tablet / phone':'iPhone / browser'});
   const url=joinSafe(r);location.assign(url);
  }catch(err){status.textContent=err.message;submit.disabled=false;submit.textContent='LOAD SESSION'}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();