/* v5.8.16 — calibrate iOS installed PWA origin, without changing
 * gameplay, saved tournament state, or non-standalone Safari pages. */
(()=>{
 'use strict';
 const installed=window.matchMedia?.('(display-mode: standalone)').matches||
                 navigator.standalone===true;
 if(!installed||!window.matchMedia?.('(max-width:760px)').matches)return;
 const measure=()=>{
  if(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))return;
  // With viewport-fit=auto, PWA content starts beneath the status bar.
  // WebKit usually reports screen.height - innerHeight = 59–62 CSS px.
  const raw=Math.round((window.screen?.height||0)-(window.innerHeight||0));
  const gap=raw>=28&&raw<=90?raw:59;
  document.documentElement.style.setProperty('--p5816-status-offset',gap+'px');
 };
 if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',measure,{once:true});
 else measure();
 window.addEventListener('orientationchange',()=>requestAnimationFrame(measure),{passive:true});
})();
