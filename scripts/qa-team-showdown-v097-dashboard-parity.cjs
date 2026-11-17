/* PADEL 5IVE · staging dashboard visual parity guard (no mutation to engines). */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('public/modes/club-match/v097/index.html');
const classic=read('public/modes/club-match/index.html');
const unified=read('public/modes/unified/index.html');
const publicResult=read('public/results/showdown/v097/index.html');
const originalResult=read('public/results/showdown/index.html');
const marker='p5-showdown-v097-dashboard-device-parity';
assert.equal(page.split(marker).length-1,1,'Dashboard CSS injected exactly once');
const selector=/#liveScoreboard \.court-grid>\.court\.live-court/g;
assert((page.match(selector)||[]).length>=10,'Responsive rules target live court cards only');
for(const v of ['SESSION NAME','GAME MODE','PAIRING STYLE','Match Format','Date &amp; Time',
 'Progress','p5-si-parity-main','p5-si-parity-details','min-width:900px','max-width:700px',
 'min-height:36px!important;height:36px!important','min-height:44px!important;height:44px!important',
 'grid-template-rows:minmax(34px,auto) 44px!important','p5sm-open-score','p5sm-score-separator'])
 assert(page.includes(v),'Dashboard parity marker missing: '+v);
assert(!page.includes('<p class="match-center-sub">'),'Redundant LIVE MATCHES subtitle must be gone');
assert(page.includes('<div class="rounds-compact">'),'Interactive round/history controls retained');
assert(page.includes('class="round-progress-pill"'),'Native score progress retained');
assert(page.includes('P5DirectPDF.exportShowdown(showdownReportData())'),'Approved PDF path unchanged');
assert(page.includes("new URL('/ts/'+encodeURIComponent("),'Share Results routes unchanged');
assert(page.includes('class="court live-court p5sm-card"'),'Court scoring native controller unchanged');
assert(unified.includes('PR36 IPAD LANDSCAPE REFINEMENT'),'Americano/Mexicano master unchanged');
assert(!classic.includes(marker),'Production Classic dashboard untouched');
assert.equal(publicResult,originalResult
 .replace('src="/assets/p5-showdown-engine.js"','src="/v097/showdown-engine.js"')
 .replace('src="/assets/p5-showdown-results-v5514.js"','src="/v097/showdown-results-master.js"'),
 'Approved public Share Results page unchanged');
const style=page.match(/<style id="p5-showdown-v097-dashboard-device-parity">([\s\S]*?)<\/style>/);
assert(style,'Dedicated parity CSS should be present');
const media=[...style[1].matchAll(/@media screen and \((?:min|max)-width:(\d+)px\)/g)].map(m=>m[1]);
assert.deepEqual(media,['900','700'],'iPad and iPhone media split unchanged');
for(const [i,m] of [...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'dashboard-parity-native-'+i});
}
console.log('PASS v0.9.7 dashboard visual parity: compact iPhone, adjusted landscape cards, shared session details, native scoring and reporting intact');
