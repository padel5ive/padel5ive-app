/* PADEL 5IVE v5.8.8 | Prepare selected Setup mode while organizer chooses pairing.
   No navigation override, no session access, no tournament engine changes. */
(()=>{'use strict';
 const routes=Object.freeze({unified:'/modes/unified/',club:'/modes/club-match/'});
 let lastRoute='';
 function prepare(mode){
  const kind=mode==='Club Match'?'club':mode==='Americano'||mode==='Mexicano'?'unified':'';
  if(!kind)return false;
  const path=routes[kind];
  if(lastRoute===path)return true;
  lastRoute=path;
  try {
   const sw=navigator.serviceWorker;
   if(sw?.controller){
    sw.controller.postMessage({type:'P5_PREWARM_SETUP',mode:kind});
    return true;
   }
   // HTTP prefetch fallback for first visits without an active service worker.
   // The browser is free to ignore this hint; navigation works normally.
   const hint=document.createElement('link');
   hint.rel='prefetch';hint.as='document';hint.href=path;
   hint.dataset.p588Mode=kind;
   document.head.appendChild(hint);
   return true;
  } catch(_) {
   lastRoute='';
   return false;
  }
 }
 function onChoice(event){
  const b=event.target.closest?.('.p54-mode[data-mode]:not(:disabled)');
  if(b)prepare(b.dataset.mode);
 }
 // Capture before the existing mode-selection listener to initiate warming early.
 document.addEventListener('pointerdown',onChoice,true);
 document.addEventListener('click',onChoice,true);
 if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   const last=lastRoute;lastRoute='';
   if(last)prepare(last.includes('club-match')?'Club Match':'Americano');
  });
 }
 window.P5SetupPrewarm=Object.freeze({prepare});
})();
