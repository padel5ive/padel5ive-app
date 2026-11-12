'use strict';
// PR36: shared editorial typography for stage-one operational headings.
// Presentation-only: no event handlers, scheduler, state or score mutations.
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 SHARED TYPOGRAPHY: resting and deck + iPhone court and leaderboard */';
if(html.includes(marker)){console.log('PASS PR36 typography already installed');process.exit(0)}
for (const needle of ['p5-v26-flow-combo','p5-rest-card','p5-v26-ondeck-title','p5-v26-round-title','p5-b41-leaderboard']) {
  if(!html.includes(needle))throw Error('PR36 typography source drift: '+needle);
}
const css=`\n${marker}
/* Resting and Next on Court are metadata, not major section headings. */
#americano .p5-v26-flow-combo>.p5-rest-card>h3,
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  flex-wrap:nowrap!important;gap:12px!important;min-width:0!important;
  min-height:18px!important;height:auto!important;margin:0 0 7px!important;
  padding:0!important;border-left:0!important;
  font-family:inherit!important;font-size:11px!important;font-weight:700!important;
  line-height:1.28!important;letter-spacing:.085em!important;text-transform:uppercase!important;
  color:#cfb18a!important;
}
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title>b{
  min-width:0!important;flex:0 1 auto!important;font:inherit!important;
  color:inherit!important;letter-spacing:inherit!important;
}
/* Right-side round/count follows the same baseline in both section headers. */
#americano .p5-v26-flow-combo>.p5-rest-card>h3>.badge,
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title>span{
  display:inline-block!important;flex:0 0 auto!important;margin:0 0 0 auto!important;
  padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;
  font-family:inherit!important;font-size:10px!important;font-weight:620!important;
  line-height:1.28!important;letter-spacing:.045em!important;
  color:#aab5bd!important;white-space:nowrap!important;
}
#americano .p5-v26-flow-combo>.p5-v26-on-deck{
  margin-top:12px!important;padding-top:12px!important;
}
#americano .p5-v26-flow-combo .p5-v26-ondeck-grid{row-gap:0!important}
#americano .p5-v26-flow-combo .p5-v26-ondeck-line{padding:6px 0!important;line-height:1.42!important}
#americano .p5-v26-flow-combo .p5-v26-ondeck-line span{font-weight:480!important;letter-spacing:0!important}
/* Same iPhone type scale for Round Court Scoring and Leaderboard panel titles. */
@media screen and (max-width:700px){
 #americano.p5-pr36-mobile-active>.layout>div:first-child>.card.p5-v26-round-card>.row.between.p5-v26-round-title:first-child>h2,
 #americano.p5-pr36-mobile-active>.layout>aside>.p5-b41-leaderboard>.row.between>h2{
   font-family:inherit!important;font-size:15px!important;font-weight:720!important;
   line-height:1.35!important;letter-spacing:.015em!important;
   text-transform:uppercase!important;
 }
}
`;
const styleEnd=html.lastIndexOf('</style>'),bodyEnd=html.lastIndexOf('</body>');
if(styleEnd<0||bodyEnd<styleEnd||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyEnd)))throw Error('PR36 typography style anchor drift');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);
fs.writeFileSync(file,html);
console.log('PASS PR36 typography: shared Resting/Next heading styles + equal iPhone panel headings');