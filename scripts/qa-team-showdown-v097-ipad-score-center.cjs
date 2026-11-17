/* Stage 1 visual parity regression: native v0.9.7 iPad landscape only. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const native=read('public/modes/club-match/v097/index.html');
const original=read('public/modes/club-match/index.html');
const unified=read('public/modes/unified/index.html');
const pdf=read('public/assets/p5-direct-pdf.js');
const marker='p5-showdown-v097-ipad-score-center';
assert.equal(native.split(marker).length-1,1,'One iPad layout override only');
const css=native.match(/<style id="p5-showdown-v097-ipad-score-center">([\s\S]*?)<\/style>/);
assert(css,'Centering CSS must be present');
const v=css[1];
assert(v.includes('@media screen and (min-width:900px) and (orientation:landscape)'), 'Must be iPad landscape only');
for(const anchor of [
 'grid-template-columns:repeat(2,minmax(0,1fr))!important',
 'grid-template-rows:minmax(34px,auto) 42px!important',
 'column-gap:20px!important',
 'width:min(100%,130px)!important',
 'height:42px!important',
 '.scorepair:nth-child(1) .pairname',
 '.scorepair:nth-child(3) .pairname',
 '.scorepair:nth-child(1) .p5sm-scorebox',
 '.scorepair:nth-child(3) .p5sm-scorebox',
 '.scorepairs>.p5sm-score-separator',
 'display:none!important',
 '.scorepairs::after',
 "content:'×'!important",
 'left:50%!important',
 'bottom:13px!important',
 '.prepare-next .prepare-row',
 'position:relative!important',
 '.prepare-row .prepare-versus',
 'transform:translate(-50%,-50%)!important'
])assert(v.includes(anchor),'Missing visual parity guard '+anchor);
assert(!v.includes('max-width:700px'),'Mobile must remain untouched');
assert(native.includes('p5-showdown-v097-dashboard-device-parity'),'Previously approved device/session detail retained');
assert(native.includes('class="p5sm-score-separator"'),'Original match-scoring structure kept');
assert(native.includes('class="prepare-versus"'),'Original on-deck data structure kept');
assert(native.includes('P5DirectPDF.exportShowdown(showdownReportData())'),'Direct PDF master not touched');
assert(native.includes("new URL('/ts/'+encodeURIComponent("),'Share Results unchanged');
assert(unified.includes('PR36 IPAD LANDSCAPE REFINEMENT'),'Americano and Mexicano master reference retained');
assert(!original.includes(marker),'Classic production main untouched');
assert(pdf.includes('function renderShowdown(d)'),'Classic PDF renderer retained');
for(const [i,m] of [...native.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'v097-ipad-align-'+i});
}
console.log('PASS v0.9.7 iPad score × and VS centering; unified card height; mobile/reporting untouched');
