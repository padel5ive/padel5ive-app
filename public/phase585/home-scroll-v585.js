/* v5.8.5 standalone Home: restore visual top without touching score pages. */
(()=>{'use strict';
if(!window.matchMedia?.('(display-mode: standalone)').matches)return;
if(!document.getElementById('portal'))return;
try{history.scrollRestoration='manual'}catch(_){}
function reset(){
 if(document.body.classList.contains('p54-active'))return;
 const el=document.scrollingElement;
 if(el)el.scrollTop=0;
 document.documentElement.scrollTop=0;document.body.scrollTop=0;
 try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch(_){window.scrollTo(0,0)}
}
function enter(){reset();requestAnimationFrame(()=>{reset();requestAnimationFrame(reset)})}
window.addEventListener('pageshow',enter);
window.addEventListener('load',enter,{once:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)enter()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enter,{once:true});else enter();
})();
