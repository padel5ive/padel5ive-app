'use strict';
/* PR36 layout-only vertical rhythm for mobile Stage 1; no data/engine changes. */
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let src=fs.readFileSync(file,'utf8');
const marker='/* PR36 PANEL RHYTHM: 12px mobile Stage 1 spacing */';
if(src.includes(marker)){console.log('PASS PR36 mobile panel rhythm already installed');process.exit(0)}
if(!src.includes('PR36 SESSION CONTROL: quiet two-action layout') || !src.includes('PR36 MOBILE POLISH: compact identity'))throw Error('PR36 expected mobile panels not found; refuse to patch an unknown source');
const css=`
${marker}
/* The old .card 14px margins stacked on top of the mobile layout 12px gap,
   producing 40px and 26px gaps. Use a single 12px rhythm between sibling panels. */
@media screen and (max-width:700px){
 #americano.p5-pr36-mobile-active>.p5-stage-head.p5-si-card{
  margin-bottom:12px!important
 }
 #americano.p5-pr36-mobile-active>.layout:has(>div:first-child>.p5-v26-round-card){
  row-gap:12px!important;gap:12px!important
 }
 #americano.p5-pr36-mobile-active>.layout>div:first-child>.p5-v26-round-card,
 #americano.p5-pr36-mobile-active>.layout>div:first-child>.prematch-setup,
 #americano.p5-pr36-mobile-active>.layout>div:first-child>.p5-v26-session-control{
  margin-top:0!important;margin-bottom:0!important
 }
}
`;
const tail=src.lastIndexOf('</style>');const end=src.lastIndexOf('</body>');
if(tail<0 || end<tail || !/^<\/body>\s*<\/html>\s*$/i.test(src.slice(end)))throw Error('Unexpected style/body structure');
src=src.slice(0,tail)+css+src.slice(tail);
fs.writeFileSync(file,src,'utf8');
console.log('PASS PR36 mobile: uniform 12px sibling panel gaps; iPad unaffected');