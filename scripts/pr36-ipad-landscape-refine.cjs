'use strict';
// PR36 review-only: iPad landscape presentation polish. No engine, session, or score changes.
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 IPAD LANDSCAPE REFINEMENT: compact session, linear rounds, aligned headers and scorecards */';
if(html.includes(marker)){console.log('PASS PR36 iPad landscape style already present');process.exit(0)}
for(const s of ['p5-v26-round-title','p5-b41-leaderboard','p5-b3-stable-header','p5sm-scorebox','p5-flex-heading','PR36 SCORECARD REFINEMENT']){
 if(!html.includes(s))throw Error('PR36 iPad baseline source drift: '+s);
}
const css=`\n${marker}
/* Apply only to tablet/desktop landscape. iPhone retains its approved independent layout. */
@media screen and (min-width:920px) and (orientation:landscape){
 /* Consolidated session identity: 3 columns, all metadata preserved, no new actions. */
 #americano>.p5-stage-head.p5-si-card,
 #americano .p5-ipad-summary.p5-si-card{
  padding:11px 15px!important;min-height:0!important;height:auto!important;
  margin-bottom:10px!important;
 }
 #americano .p5-b3-stable-header .p5-si-top{gap:12px!important;align-items:flex-start!important}
 #americano .p5-b3-stable-header .p5-si-identity{
  grid-template-columns:minmax(0,1.25fr) minmax(0,.85fr) minmax(0,1.15fr)!important;
  gap:12px!important;align-items:start!important;
 }
 #americano .p5-b3-stable-header .p5-si-identity-cell{gap:3px!important}
 #americano .p5-b3-stable-header .p5-si-identity-cell>span{font-size:9px!important;letter-spacing:.14em!important}
 #americano .p5-b3-stable-header .p5-si-identity-cell>strong{
  font-size:clamp(16px,1.45vw,20px)!important;line-height:1.17!important;
  min-height:0!important;letter-spacing:0!important;
 }
 #americano .p5-b3-stable-header .p5-si-session-name>strong{font-size:clamp(18px,1.7vw,23px)!important}
 #americano .p5-b3-stable-header .p5-si-details{
  min-height:0!important;margin-top:8px!important;padding-top:7px!important;
  gap:4px 12px!important;font-size:10px!important;line-height:1.35!important;
 }
 #americano .p5-b3-stable-header .p5-si-details>span{gap:5px!important;font-size:10px!important}
 #americano .p5-b3-stable-header .p5-si-details b{font-size:10px!important}
 #americano .p5-b3-stable-header .p5-si-status{min-height:23px!important;padding:4px 9px!important;font-size:9px!important}
 /* One swipeable horizontal round rail; remove only redundant instructions and legend. */
 #americano .p5-v26-round-card .round-picker-expanded{
  padding:8px 10px!important;margin:9px 0 10px!important;overflow:hidden!important;
 }
 #americano .p5-v26-round-card .p5-flex-heading{margin:0 0 7px!important;align-items:center!important}
 #americano .p5-v26-round-card .p5-flex-heading>span{display:none!important}
 #americano .p5-v26-round-card .p5-flex-legend{display:none!important}
 #americano .p5-v26-round-card .round-picker .roundbuttons{
  display:flex!important;flex-wrap:nowrap!important;align-items:center!important;
  gap:6px!important;overflow-x:auto!important;overflow-y:hidden!important;
  max-width:100%!important;white-space:nowrap!important;scrollbar-width:none!important;
  -webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;
  padding:1px 1px 3px!important;margin:0!important;
 }
 #americano .p5-v26-round-card .round-picker .roundbuttons::-webkit-scrollbar{display:none!important}
 #americano .p5-v26-round-card .round-picker .roundbuttons>button{
  flex:0 0 30px!important;width:30px!important;min-width:30px!important;max-width:30px!important;
  min-height:30px!important;height:30px!important;padding:3px!important;
  font-size:10px!important;border-radius:7px!important;scroll-snap-align:start;
 }
 /* Equal section titles and identical top inset on both desktop columns. */
 #americano>.layout .p5-v26-round-card,
 #americano>.layout>aside>.p5-b41-leaderboard{padding:14px!important}
 #americano>.layout .p5-v26-round-title,
 #americano>.layout>aside>.p5-b41-leaderboard>.row.between{
  display:flex!important;align-items:center!important;min-height:23px!important;
  margin:0 0 8px!important;gap:9px!important;
 }
 #americano>.layout .p5-v26-round-title h2,
 #americano>.layout>aside>.p5-b41-leaderboard>.row.between>h2{
  font-size:14px!important;font-weight:720!important;line-height:1.3!important;
  letter-spacing:.015em!important;text-transform:uppercase!important;margin:0!important;
 }
 #americano>.layout .p5-v26-round-title>.badge{margin-left:auto!important;align-self:center!important}
 #americano>.layout>aside>.p5-b41-leaderboard>.row.between>h2{transform:translateY(-3px)!important}
 /* Symmetric two-team scorecard grid: shared name row above shared score row. */
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepairs{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  grid-template-rows:minmax(34px,auto) 42px!important;
  column-gap:20px!important;row-gap:5px!important;align-items:center!important;
  margin:0!important;position:relative!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair,
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2){
  display:contents!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepair:nth-child(1) .pairname{grid-column:1!important;grid-row:1!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepair:nth-child(2) .pairname{grid-column:2!important;grid-row:1!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepair:nth-child(1) .p5sm-scorebox{grid-column:1!important;grid-row:2!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepair:nth-child(2) .p5sm-scorebox{grid-column:2!important;grid-row:2!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair .pairname,
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2) .pairname{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;min-width:0!important;height:auto!important;min-height:34px!important;
  padding:1px 5px!important;margin:0!important;flex:none!important;
  box-sizing:border-box!important;text-align:center!important;
  font-size:11px!important;line-height:1.3!important;
  white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .p5sm-scorebox{
  width:min(100%,130px)!important;max-width:130px!important;
  min-width:0!important;height:42px!important;min-height:42px!important;
  align-self:stretch!important;justify-self:center!important;flex:none!important;
  box-sizing:border-box!important;font-size:23px!important;margin:0!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepairs::before{
  content:'×'!important;position:absolute!important;left:50%!important;top:auto!important;
  bottom:13px!important;transform:translateX(-50%)!important;
  font-size:15px!important;line-height:16px!important;letter-spacing:0!important;
  font-weight:650!important;color:#bfae94!important;pointer-events:none!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5-v26-format-hint{margin-top:6px!important}
}
`;
const styleEnd=html.lastIndexOf('</style>'),bodyEnd=html.lastIndexOf('</body>');
if(styleEnd<0||bodyEnd<styleEnd||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyEnd)))throw Error('PR36 iPad HTML anchor changed');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);
const jsMarker='<!-- PR36 IPAD LANDSCAPE ACTIVE ROUND RAIL -->';
const script=`\n${jsMarker}
<script>
(function(){
 'use strict';
 const root=document.getElementById('americano');if(!root)return;
 const media=window.matchMedia('(min-width:920px) and (orientation:landscape)');
 let lastKey='',queued=false;
 function keepActiveVisible(){
  if(!media.matches)return;
  const rail=root.querySelector('.p5-v26-round-card .round-picker .roundbuttons');
  const active=rail?.querySelector('button.selected');if(!active)return;
  const key=(active.dataset.round||active.textContent||'')+'/'+rail.childElementCount;
  if(key===lastKey)return;
  lastKey=key;
  requestAnimationFrame(function(){
   if(!active.isConnected||!rail.isConnected)return;
   const a=active.getBoundingClientRect(),r=rail.getBoundingClientRect();
   if(a.left<r.left+5||a.right>r.right-5){
    rail.scrollLeft+=a.left-r.left-r.width/2+a.width/2;
   }
  });
 }
 const obs=new MutationObserver(()=>{
  if(queued)return;queued=true;queueMicrotask(()=>{queued=false;keepActiveVisible()});
 });
 obs.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 if(media.addEventListener)media.addEventListener('change',()=>{lastKey='';keepActiveVisible()});
 keepActiveVisible();
})();
</script>
`;
const bodyEnd2=html.lastIndexOf('</body>');
html=html.slice(0,bodyEnd2)+script+html.slice(bodyEnd2);
fs.writeFileSync(file,html);
console.log('PASS PR36 iPad landscape: compact session, 1-row rail, matched headers and centered court scores');