'use strict';
// PR36 visual-only follow-up. Native Round/Leaderboard remain mounted;
// only presentation changes on narrow iPhone screens.
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file, 'utf8');
const cssMarker = '/* PR36 iPhone Stage 1 Rounds / Leaderboard tab bar · 2026-11-12 */';
const scriptMarker = '<!-- PR36 iPhone Stage 1 tab runtime · 2026-11-12 -->';
if (html.includes(cssMarker) && html.includes(scriptMarker)) {
  console.log('PASS PR36 mobile tabs already applied');process.exit(0);
}
if (html.includes(cssMarker) || html.includes(scriptMarker)) throw Error('Partial PR36 mobile tab install detected');
if (!html.includes('p5-stage1-score-grid') || !html.includes('p5-v26-round-card') || !html.includes('live-standings')) throw Error('Expected Stage 1 master layout not found');
// Presentation only: the score/fixture values and modal handlers are untouched.
const scoreCardVS = "#americano .p5-stage1-score-grid>.court .scorepairs::before{";
if (!html.includes(scoreCardVS)) throw Error('PR36 score separator selector missing');
const css = `\n${cssMarker}
/* Align multiplication sign with the ACTUAL score row, not the taller team-name + score stack. */
#americano .p5-stage1-score-grid>.court .scorepairs::before{
 content:'×'!important;top:auto!important;bottom:14px!important;
 left:50%!important;transform:translateX(-50%)!important;
 font-size:16px!important;line-height:16px!important;letter-spacing:0!important;
 font-weight:650!important;color:#b9a994!important;pointer-events:none!important;
}
#americano .p5-v26-ondeck-line em{font-size:12px!important;font-weight:650!important;letter-spacing:0!important;font-style:normal}
#americano .p5-pr36-mobile-tabs{display:none!important}
@media screen and (max-width:700px){
 #americano.p5-pr36-mobile-active{padding-bottom:calc(96px + env(safe-area-inset-bottom, 0px))!important}
 #americano.p5-pr36-mobile-active>.layout{display:block!important}
 #americano.p5-pr36-mobile-active[data-p5-pr36-view="rounds"]>.layout>aside{display:none!important}
 #americano.p5-pr36-mobile-active[data-p5-pr36-view="leaderboard"]>.layout>div:first-child{display:none!important}
 #americano.p5-pr36-mobile-active[data-p5-pr36-view="leaderboard"]>.layout>aside{display:block!important;width:100%!important;margin:0!important}
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tabs{
  display:flex!important;align-items:stretch;gap:8px;position:fixed;
  inset:auto 0 0 0;z-index:65;
  padding:12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
  border-top:1px solid rgba(138,159,177,.28);background:#102335;
  box-shadow:0 -10px 26px rgba(3,12,22,.22);
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab{
  display:flex;flex:1 1 0;min-width:0;min-height:54px;align-items:center;justify-content:center;
  border:1px solid transparent;border-radius:12px;background:transparent;
  padding:10px 7px;gap:10px;color:#98aab9;font:700 13px/1.2 inherit;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab[aria-selected="true"]{
  background:#2d4559;border-color:rgba(183,201,216,.10);color:#f2f4f5;
 }
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab:focus-visible{outline:2px solid #d4ae80;outline-offset:2px}
 #americano.p5-pr36-mobile-active .p5-pr36-mobile-tab svg{display:block;width:19px;height:19px;stroke:#d3ad80;flex:none}
}
@media print{#americano .p5-pr36-mobile-tabs{display:none!important}}
`;
const js = `
${scriptMarker}
<script>
(function(){
 'use strict';
 const root=document.getElementById('americano');if(!root)return;
 const marker='p5-pr36-mobile-tabs';
 let selected='rounds';
 const icons={
  rounds:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke="currentColor" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  leaderboard:'<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 17v-5h3v5M12 17V6h3v11M17 17v-8h3v8"/></svg>'
 };
 function sync(){
  const layout=root.querySelector(':scope > .layout');
  const ready=!!layout&&!!layout.querySelector('.p5-v26-round-card')&&!!layout.querySelector('aside .live-standings');
  if(!ready){root.classList.remove('p5-pr36-mobile-active');root.removeAttribute('data-p5-pr36-view');return;}
  root.classList.add('p5-pr36-mobile-active');
  const main=layout.firstElementChild,leaderboard=layout.querySelector(':scope > aside');
  if(main&&!main.id)main.id='p5-pr36-mobile-rounds-panel';
  if(leaderboard&&!leaderboard.id)leaderboard.id='p5-pr36-mobile-leaderboard-panel';
  // Legacy mobile layout uses display:contents!important on the left column.
  // An inline visibility guard is required so the two tabs never overlap.
  const narrow=window.matchMedia('(max-width:700px)').matches;
  if(main){if(narrow&&selected==='leaderboard')main.style.setProperty('display','none','important');else main.style.removeProperty('display');}
  if(leaderboard){if(narrow&&selected==='rounds')leaderboard.style.setProperty('display','none','important');else leaderboard.style.removeProperty('display');}
  let bar=root.querySelector(':scope > .'+marker);
  if(!bar){
   bar=document.createElement('nav');bar.className=marker;bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Stage 1 mobile views');
   bar.innerHTML=['rounds','leaderboard'].map(id=>'<button type="button" class="p5-pr36-mobile-tab" role="tab" data-p5-pr36-tab="'+id+'" aria-controls="p5-pr36-mobile-'+(id==='rounds'?'rounds':'leaderboard')+'-panel">'+icons[id]+'<span>'+(id==='rounds'?'Rounds':'Leaderboard')+'</span></button>').join('');
   root.appendChild(bar);
  }
  root.setAttribute('data-p5-pr36-view',selected);
  bar.querySelectorAll('[data-p5-pr36-tab]').forEach(button=>{
   const active=button.dataset.p5Pr36Tab===selected;
   if(button.getAttribute('aria-selected')!==String(active))button.setAttribute('aria-selected',String(active));
   if(button.tabIndex!==(active?0:-1))button.tabIndex=active?0:-1;
  });
 }
 root.addEventListener('click',function(e){
  const button=e.target.closest('[data-p5-pr36-tab]');if(!button||!root.contains(button))return;
  e.preventDefault();selected=button.dataset.p5Pr36Tab==='leaderboard'?'leaderboard':'rounds';sync();
  // Switch to the start of the selected view, without navigating or resetting the match.
  const layout=root.querySelector(':scope > .layout');
  if(layout&&window.matchMedia('(max-width:700px)').matches){
   const y=layout.getBoundingClientRect().top+window.scrollY-8;
   window.scrollTo({top:Math.max(0,y),behavior:'instant'});
  }
 });
 const observer=new MutationObserver(sync);observer.observe(root,{childList:true});
 const breakpoint=window.matchMedia('(max-width:700px)');
 if(breakpoint.addEventListener)breakpoint.addEventListener('change',sync);else if(breakpoint.addListener)breakpoint.addListener(sync);
 sync();
})();
</script>
`;
const styleClose=html.lastIndexOf('</style>');
const bodyClose=html.lastIndexOf('</body>');
if(styleClose<0||bodyClose<styleClose||!/^(<\/body>\s*<\/html>\s*)$/i.test(html.slice(bodyClose))) throw Error('Unsafe end-of-document source changed');
html=html.slice(0,styleClose)+css+html.slice(styleClose);
const lastBody=html.lastIndexOf('</body>');
html=html.slice(0,lastBody)+js+html.slice(lastBody);
// Only change visible VS labels in Stage 1. Never change score parsing or modal handlers.
const onDeck=' <em>vs</em> ${esc(team(s,m.teams[1]))}';
if (!html.includes(onDeck)) throw Error('Native Next on Court label changed');
html=html.replace(onDeck,' <em>×</em> ${esc(team(s,m.teams[1]))}');
const modalVS='<span class="p5-score-dual-vs">VS</span>';
if(html.includes(modalVS))html=html.replace(modalVS,'<span class="p5-score-dual-vs">×</span>');
fs.writeFileSync(file,html);
console.log('PASS PR36: iPhone bottom tabs and centered × score separators; master scoring untouched');