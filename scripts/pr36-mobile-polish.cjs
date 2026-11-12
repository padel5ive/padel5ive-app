'use strict';
// PR36 iPhone-focused review refinement; native scheduling/scoring untouched.
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file,'utf8');
const cssMarker = '/* PR36 MOBILE POLISH: compact identity, one-row round rail, brass tabs, hide match monitor */';
const jsMarker = '<!-- PR36 MOBILE POLISH: keep selected round visible in horizontal rail -->';
if(html.includes(cssMarker) && html.includes(jsMarker)) {
 console.log('PASS PR36 mobile polish already applied'); process.exit(0);
}
if(html.includes(cssMarker)||html.includes(jsMarker))throw Error('Partial PR36 mobile polish; stopped');
if(!html.includes('PR36 iPhone Stage 1 tab runtime')||!html.includes('p5-pr36-mobile-tabs'))throw Error('PR36 mobile tab foundation missing');
const css = `\n${cssMarker}
/* On iPhone only: 1-row swipeable rounds. No loss of rounds or click handlers. */
@media screen and (max-width:700px){
 #americano.p5-pr36-mobile-active .round-picker-expanded{
  margin:8px 0 10px!important;padding:10px 10px 9px!important;overflow:hidden!important
 }
 #americano.p5-pr36-mobile-active .round-picker .roundbuttons{
  display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;
  gap:6px!important;max-height:none!important;max-width:100%!important;
  overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;
  padding:1px 1px 7px!important;margin:0!important;
  scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;
  scrollbar-width:none
 }
 #americano.p5-pr36-mobile-active .round-picker .roundbuttons::-webkit-scrollbar{display:none!important}
 #americano.p5-pr36-mobile-active .round-picker .roundbuttons>button{
  flex:0 0 39px!important;width:39px!important;min-width:39px!important;max-width:39px!important;
  height:40px!important;min-height:40px!important;padding:3px!important;
  font-size:13px!important;border-radius:9px!important;scroll-snap-align:start
 }
 #americano.p5-pr36-mobile-active .p5-flex-heading{margin:0 0 9px!important;display:flex!important;align-items:center!important}
 #americano.p5-pr36-mobile-active .p5-flex-heading span{display:none!important}
 #americano.p5-pr36-mobile-active .p5-flex-legend{margin:3px 0 0!important;gap:11px!important;white-space:nowrap!important;font-size:10px!important}

 /* Keep session identity legible while removing excess height. The same data stays visible. */
 #americano.p5-pr36-mobile-active>.p5-stage-head.p5-si-card{
  padding:12px 13px 11px!important;margin:0 0 10px!important;gap:0!important;
  min-height:0!important;height:auto!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-top{
  display:flex!important;flex-wrap:nowrap!important;align-items:flex-start!important;
  gap:7px!important;position:relative!important;padding:0!important;margin:0!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-identity{
  display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;
  gap:6px 11px!important;flex:1 1 auto!important;width:100%!important;min-width:0!important;
  order:0!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-session-name{
  grid-column:1/-1!important;min-height:0!important;padding-right:84px!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-identity-cell{
  display:flex!important;flex-direction:column!important;gap:2px!important;min-width:0!important;
  overflow:hidden!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-identity-cell>span{
  font-size:8px!important;line-height:1.3!important;letter-spacing:.12em!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-identity-cell>strong{
  font-size:14px!important;line-height:1.26!important;min-height:0!important;
  white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-session-name>strong{
  font-size:20px!important;line-height:1.12!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-status{
  position:absolute!important;right:0!important;top:0!important;
  width:auto!important;min-width:66px!important;max-width:84px!important;
  padding:6px 9px!important;font-size:9px!important;letter-spacing:.09em!important;
  margin:0!important;order:0!important;line-height:1.15!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-details{
  display:flex!important;flex-wrap:wrap!important;align-items:baseline!important;
  gap:3px 10px!important;margin:9px 0 0!important;padding:8px 0 0!important;
  min-height:0!important;font-size:10px!important;line-height:1.42!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-details>span{
  gap:4px!important;white-space:nowrap!important;flex-wrap:nowrap!important;
  min-width:0!important;font-size:10px!important
 }
 #americano.p5-pr36-mobile-active .p5-b3-stable-header .p5-si-details b{font-size:10px!important}
 /* Match Monitor metrics remain in state/reporting; no oversized KPI cards on iPhone. */
 #americano.p5-pr36-mobile-active>.stats,#americano.p5-pr36-mobile-active>.bars{display:none!important}

 /* Match Control visual parity: muted navy/charcoal + quiet brass, not blue tiles. */
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tabs{
  background:#1b262f!important;border-top:1px solid rgba(194,166,126,.26)!important;
  padding:9px 12px calc(9px + env(safe-area-inset-bottom, 0px))!important;
  gap:7px!important;box-shadow:0 -8px 26px rgba(5,11,17,.32)!important
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab{
  min-height:47px!important;border-radius:10px!important;
  border:1px solid transparent!important;background:transparent!important;
  color:#a9b0b4!important;font-weight:650!important;font-size:13px!important;
  padding:9px 7px!important;gap:8px!important;box-shadow:none!important
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab svg{
  width:17px!important;height:17px!important;stroke:#aa9679!important
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab[aria-selected="true"]{
  background:linear-gradient(145deg,#33343a,#292e34)!important;
  border-color:rgba(203,170,120,.48)!important;
  color:#f1e6d6!important;box-shadow:inset 0 0 0 1px rgba(222,177,110,.045)!important
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab[aria-selected="true"] svg{stroke:#d7b184!important}
 #americano.p5-pr36-mobile-active{padding-bottom:calc(79px + env(safe-area-inset-bottom,0px))!important}
}
`;
const script = `\n${jsMarker}
<script>
(function(){
 'use strict';
 const root=document.getElementById('americano');if(!root)return;
 let lastRound='';
 function keepRoundVisible(){
  if(!window.matchMedia('(max-width:700px)').matches)return;
  const rail=root.querySelector('.p5-v26-round-card .round-picker .roundbuttons');
  if(!rail)return;
  const active=rail.querySelector('button.selected');if(!active)return;
  const round=(active.getAttribute('data-round')||'')+'/'+rail.childElementCount;
  if(round===lastRound)return;
  lastRound=round;
  requestAnimationFrame(function(){
   if(!active.isConnected||!rail.isConnected)return;
   const a=active.getBoundingClientRect(),r=rail.getBoundingClientRect();
   const target=rail.scrollLeft+a.left-r.left-9;
   if(a.right>r.right-5||a.left<r.left+5)rail.scrollLeft=Math.max(0,target);
  });
 }
 const observer=new MutationObserver(keepRoundVisible);
 observer.observe(root,{childList:true});
 const media=window.matchMedia('(max-width:700px)');
 if(media.addEventListener)media.addEventListener('change',()=>{lastRound='';keepRoundVisible()});
 keepRoundVisible();
})();
</script>
`;
const styleClose=html.lastIndexOf('</style>');
const bodyClose=html.lastIndexOf('</body>');
if(styleClose<0||bodyClose<styleClose||!/^(<\/body>\s*<\/html>\s*)$/i.test(html.slice(bodyClose)))throw Error('PR36 mobile polish: closing tags changed; abort');
html=html.slice(0,styleClose)+css+html.slice(styleClose);
const finalBody=html.lastIndexOf('</body>');
html=html.slice(0,finalBody)+script+html.slice(finalBody);
fs.writeFileSync(file,html);
console.log('PASS PR36 mobile polish: horizontal round rail, compact session identity, no mobile match monitor, quiet luxury tabs');