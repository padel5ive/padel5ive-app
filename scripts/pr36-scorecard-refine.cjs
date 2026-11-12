'use strict';
// PR36 iPhone scorecard interaction and alignment: presentation only.
// No scoring modal, match data, scheduling or engine changes.
const fs = require('node:fs');
const path = 'public/modes/unified/index.html';
let html = fs.readFileSync(path, 'utf8');
const marker = '/* PR36 SCORECARD REFINEMENT: invisible hit target, symmetrical mobile names */';
if (html.includes(marker)) {
  if (!html.includes('grid-row:2!important')) throw Error('Partial PR36 scorecard refinement');
  console.log('PASS PR36 scorecard refinement already present');
  process.exit(0);
}
for (const expected of ['p5sm-open-score','p5sm-scorebox','PR36 SESSION POLISH','PR36 MOBILE POLISH']) {
  if (!html.includes(expected)) throw Error('PR36 scorecard source drift: '+expected);
}
const css = `
${marker}
/* Scoring is still one tap anywhere; touch/hover MUST NOT fill its whole button. */
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score,
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score:hover:not(:disabled),
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score:active:not(:disabled),
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score:focus:not(:focus-visible){
 background:transparent!important;background-image:none!important;
 box-shadow:none!important;filter:none!important;transform:none!important;
 -webkit-tap-highlight-color:transparent!important;
 -webkit-appearance:none!important;appearance:none!important;
 transition:none!important;
}
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score:focus:not(:focus-visible){outline:none!important}
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score{
 -webkit-tap-highlight-color:transparent!important;
 touch-action:manipulation;
}
#americano .p5-stage1-score-grid>.court.p5sm-card .pairname,
#americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-scorebox{
 user-select:none;-webkit-user-select:none;
}
@media screen and (max-width:700px){
 /* Shared name row: one or two lines do not offset the opposing score row. */
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepairs{
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  grid-template-rows:minmax(43px,auto) minmax(43px,auto)!important;
  column-gap:16px!important;row-gap:7px!important;
  align-items:stretch!important;position:relative!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair,
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2){
  display:contents!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(1) .pairname{grid-column:1!important;grid-row:1!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2) .pairname{grid-column:2!important;grid-row:1!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(1) .p5sm-scorebox{grid-column:1!important;grid-row:2!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2) .p5sm-scorebox{grid-column:2!important;grid-row:2!important}
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair .pairname,
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .scorepair:nth-child(2) .pairname{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:auto!important;min-height:43px!important;
  padding:2px 3px!important;margin:0!important;
  flex:none!important;box-sizing:border-box!important;
  text-align:center!important;text-wrap:balance;
  font-size:12px!important;line-height:1.34!important;
  overflow-wrap:break-word!important;word-break:normal!important;
 }
 #americano .p5-stage1-score-grid>.court.p5sm-card .p5sm-open-score .p5sm-scorebox{
  box-sizing:border-box!important;align-self:stretch!important;
  width:100%!important;min-width:0!important;
  min-height:43px!important;height:43px!important;
  flex:none!important;margin:0!important;
 }
 /* Center multiplication sign on score row, not name row. */
 #americano .p5-stage1-score-grid>.court.p5sm-card .scorepairs::before{
  bottom:13.5px!important;line-height:16px!important;
 }
}
`;
const styleClose = html.lastIndexOf('</style>');
const bodyClose = html.lastIndexOf('</body>');
if (styleClose<0 || bodyClose<styleClose || !/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyClose))) {
  throw Error('PR36 scorecard source closing tags changed');
}
html=html.slice(0,styleClose)+css+html.slice(styleClose);
if (html.split(marker).length!==2) throw Error('PR36 scorecard marker duplicated');
fs.writeFileSync(path,html);
console.log('PASS PR36: tap highlight removed, symmetric mobile scores and names');