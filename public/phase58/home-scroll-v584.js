/* PADEL 5IVE v5.8.4 — Home entry / return scroll reset for iOS PWA.
 * Never reset the score pages or internal Session History / Cloud dialogs. */
(()=>{'use strict';
if(!window.matchMedia?.('(display-mode: standalone)').matches)return;
const root=document.getElementById('portal');
if(!root)return;
try{history.scrollRestoration='manual'}catch(_){}
const isHome=()=>!document.body.classList.contains('p54-active');
const restoreHome=()=>{
 if(!isHome())return;
 const doc=document.scrollingElement;
 if(doc)doc.scrollTop=0;
 document.documentElement.scrollTop=0;
 document.body.scrollTop=0;
 try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch(_){window.scrollTo(0,0)}
};
const onReturn=()=>{
 if(!isHome())return;
 restoreHome();
 requestAnimationFrame(()=>{restoreHome();requestAnimationFrame(restoreHome)});
};
window.addEventListener('pageshow',onReturn);
window.addEventListener('load',onReturn,{once:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)onReturn()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReturn,{once:true});
else onReturn();
})();
