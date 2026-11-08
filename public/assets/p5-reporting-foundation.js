/* PADEL 5IVE Phase 5.5 · shared reporting controls and keyboard focus policy.
   No game engine, winner calculation, or publishing credentials live here. */
(function(){'use strict';
const safe=v=>String(v==null?'':v);
const create=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=safe(txt);return e;};
const visible=e=>{if(!e||e.disabled||e.hidden||e.closest('[hidden],[inert]'))return false;const cs=getComputedStyle(e);return cs.display!=='none'&&cs.visibility!=='hidden'&&e.getClientRects().length>0;};
function focusScope(el){return el.closest('[role="dialog"],dialog,#p5-modal-root,#mainMenu,#americano,#app')||document;}
function fields(scope){return Array.from(scope.querySelectorAll('input:not([type="hidden"]),select,textarea')).filter(e=>!e.readOnly&&visible(e));}
function configure(e){if(!e||!e.matches('input,textarea'))return;const all=fields(focusScope(e)),ix=all.indexOf(e);if(ix<0)return;if(e.tagName==='INPUT'&&e.type!=='checkbox'&&e.type!=='radio'&&e.type!=='file'){e.enterKeyHint=ix===all.length-1?'done':'next';}}
function inputPolicy(){document.addEventListener('focusin',e=>configure(e.target),true);document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||e.shiftKey||e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
 const el=e.target;
 if(!(el instanceof HTMLInputElement)||!['text','number','password','email','tel','search','url'].includes(el.type)||el.readOnly||el.disabled)return;
 // Native Tab and Shift+Tab remain under the browser's normal focus order.
 const all=fields(focusScope(el)),ix=all.indexOf(el),next=all.slice(ix+1).find(x=>x!==el);
 if(next){e.preventDefault();next.focus({preventScroll:true});if(next instanceof HTMLInputElement&&['text','number','tel'].includes(next.type)){try{next.select();}catch(_){}}next.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
 else if(el.enterKeyHint==='done')el.blur();
 },true);}
let active=null;
async function copyLink(url){if(navigator.clipboard&&location.protocol==='https:'){await navigator.clipboard.writeText(url);return true;}
 const txt=document.createElement('textarea');txt.value=url;txt.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(txt);txt.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}txt.remove();return ok;}
function close(){if(!active)return;const prev=active.previous;active.layer.remove();active=null;if(prev&&prev.isConnected)prev.focus({preventScroll:true});}
function openShare(opts={}){
 close();const previous=document.activeElement;
 const lay=create('div','p5-report-overlay');lay.id='p5-reporting-dialog';
 const dlg=create('section','p5-report-modal');dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-labelledby','p5-report-title');
 const top=create('div','p5-report-modal-header');const brand=create('div','p5-report-brand','PADEL 5IVE · MATCH CONTROL');const x=create('button','p5-report-close','×');x.type='button';x.setAttribute('aria-label','Close');x.onclick=close;
 top.append(brand,x);
 const tagline=create('div','p5-report-signature','BEYOND 5IVE. BEYOND PLAY.');const title=create('h2','', 'Official Share Results');title.id='p5-report-title';const name=create('p','p5-report-session',opts.session||'Signature Game');
 const intro=create('p','p5-report-intro',opts.existingUrl?'Update the existing public results link or share the last published version.':'Publish confirmed tournament results as a read-only public link.');
 const state=create('div','p5-report-state',opts.existingUrl?'EXISTING PUBLIC LINK':'READY TO PUBLISH');
 const pinWrap=create('label','p5-report-pinwrap');pinWrap.textContent='Organizer publishing PIN';const pin=create('input','p5-report-pin');pin.type='password';pin.autocomplete='off';pin.spellcheck=false;pin.placeholder='Enter PIN';pinWrap.append(pin);pinWrap.hidden=opts.pinRequired===false;
 const urlWrap=create('div','p5-report-urlbox');const urlLabel=create('label','', 'Public results URL');const url=create('input','p5-report-url');url.type='text';url.readOnly=true;url.value=opts.existingUrl||'';urlWrap.append(urlLabel,url);urlWrap.hidden=!opts.existingUrl;
 const status=create('p','p5-report-message');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const actions=create('div','p5-report-actions');const publish=create('button','p5-report-primary',opts.existingUrl?'Update Published Results':'Publish Results');publish.type='button';
 const copy=create('button','p5-report-secondary','Copy Link');copy.type='button';const whats=create('button','p5-report-secondary','WhatsApp');whats.type='button';const native=create('button','p5-report-secondary','Share Link');native.type='button';const view=create('button','p5-report-secondary','Open Results');view.type='button';
 const showActions=val=>[copy,whats,native,view].forEach(b=>b.hidden=!val);
 actions.append(publish,copy,whats,native,view);showActions(!!opts.existingUrl);
 const note=create('p','p5-report-note','Published results show names and scores to anyone with the link. Updates are manual; your publishing PIN is never put into the public URL.');
 const foot=create('div','p5-report-modal-foot');foot.append(note);
 if(opts.onNewLink&&opts.existingUrl){const fresh=create('button','p5-report-text-button','Create a new link');fresh.type='button';fresh.addEventListener('click',()=>{if(confirm('Create a new URL? The previous link will not receive updates.')){opts.onNewLink();}});foot.append(fresh);}
 dlg.append(top,tagline,title,name,intro,state,pinWrap,urlWrap,status,actions,foot);lay.append(dlg);document.body.append(lay);
 active={layer:lay,previous};
 const message=(text,error=false)=>{status.textContent=safe(text);status.classList.toggle('error',!!error);};
 let link=opts.existingUrl||'';
 const wire=urlString=>{link=urlString;url.value=link;urlWrap.hidden=false;showActions(true);pin.value='';pinWrap.hidden=true;state.textContent='PUBLISHED · PUBLIC LINK READY';publish.textContent='Update Published Results';};
 copy.onclick=async()=>{try{message(await copyLink(link)?'Link copied.':'Select the URL above to copy it.');if(!navigator.clipboard)url.select();}catch(e){url.select();message('Select and copy the URL above.');}};
 whats.onclick=()=>{if(link)window.open('https://wa.me/?text='+encodeURIComponent('PADEL 5IVE · Official Tournament Results\n'+link),'_blank','noopener,noreferrer');};
 native.onclick=async()=>{if(!link)return;try{if(navigator.share){await navigator.share({title:(opts.session||'PADEL 5IVE')+' · Official Results',url:link});}else{await copyLink(link);message('Link copied.');}}catch(e){if(e.name!=='AbortError')message('Share not available on this device. Use Copy Link.',true);}};
 view.onclick=()=>{if(link)window.open(link,'_blank','noopener,noreferrer');};
 publish.onclick=async()=>{
  if(opts.previewOnly){message('Offline preview: publishing requires your Netlify HTTPS site and its configured PIN.',true);return;}
  if(pinWrap.hidden===false&&pin.value.trim().length<1){message('Enter the organizer publishing PIN.',true);pin.focus();return;}
  publish.disabled=true;message('Publishing confirmed results…');
  try{const result=await opts.onSubmit(pin.value.trim());const out=typeof result==='string'?result:result?.url;
   if(!out)throw Error('Publishing service did not return a public URL');wire(out);message('Published successfully. Copy, open, or share this link.');}
  catch(err){message(err?.message||'Publishing failed.',true);}finally{publish.disabled=false;}
 };
 lay.addEventListener('click',e=>{if(e.target===lay)close();});
 lay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const focusables=Array.from(lay.querySelectorAll('button:not(:disabled):not([hidden]),input:not([hidden])')).filter(visible);if(!focusables.length)return;let first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 (opts.pinRequired===false?publish:pin).focus();return {close,layer:lay};
}
inputPolicy();window.P5ReportUI=Object.freeze({openShare,close,inputPolicy});
})();
