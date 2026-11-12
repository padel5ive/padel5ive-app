'use strict';
// PR36 follow-up: fix iPhone bottom blank space caused by padding being
// attached to decorative footer rather than the scroll container.
// Stage 1 layout only; no changes to scoring, sessions, data, engines or iPad.
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file,'utf8');
const marker = '/* PR36 FOOTER RHYTHM: move safe-area clearance from branding to main */';
if(html.includes(marker)){
 console.log('PASS PR36 footer rhythm already installed');
 process.exit(0);
}
for(const needle of [
 'PR36 SAFE FORMAT EDIT · preserve confirmed match format',
 'PR36 PANEL RHYTHM: 12px mobile Stage 1 spacing',
 'p5-pr36-mobile-tabs',
 '<div class="brand-footer">',
 'padding-bottom:calc(98px + env(safe-area-inset-bottom,0px))!important'
]) if(!html.includes(needle))throw Error('PR36 footer baseline changed: '+needle);
const css = `
${marker}
/* The 98px padding on the brand footer created a visible blank block.
   Clearance now lives outside the content, in the main scroll container.
   Tab height is 66px + iOS safe-area inset; keep 12px visual breathing room. */
@media screen and (max-width:700px){
 body main.wrap:has(> #americano.p5-pr36-mobile-active){
  padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;
 }
 body main.wrap:has(> #americano.p5-pr36-mobile-active)>.brand-footer{
  margin:12px 0 0!important;
  padding:0!important;
  padding-bottom:0!important;
  min-height:0!important;
 }
}
`;
const styleEnd = html.lastIndexOf('</style>');
const bodyEnd = html.lastIndexOf('</body>');
if(styleEnd<0 || bodyEnd<styleEnd || !/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyEnd)))throw Error('PR36 footer stylesheet anchor not found');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);
fs.writeFileSync(file,html);
console.log('PASS PR36 footer rhythm: 12px panel/footer/tab, no iPhone footer padding');