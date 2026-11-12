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
/* Resting Players and Next on Court share the same brass, weight, tracking and line height on every device. */
#americano .p5-v26-flow-combo>.p5-rest-card>h3,
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title{
  display:flex!important;align-items:center!important;
  min-height:20px!important;margin-bottom:10px!important;padding-left:0!important;
  font-family:inherit!important;font-size:12px!important;font-weight:750!important;
  line-height:1.35!important;letter-spacing:.10em!important;
  text-transform:uppercase!important;color:#d8bd95!important;
}
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title>b{
  font:inherit!important;letter-spacing:inherit!important;color:inherit!important;
}
#americano .p5-v26-flow-combo>.p5-rest-card>h3>.badge,
#americano .p5-v26-flow-combo>.p5-v26-on-deck>.p5-v26-ondeck-title>span{
  font-family:inherit!important;font-size:10px!important;line-height:1.35!important;
  font-weight:600!important;letter-spacing:.06em!important;
  color:#aab8c0!important;
}
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