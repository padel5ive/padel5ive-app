'use strict';
const fs=require('node:fs');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const look=['MANAGE COURTS','Manage Courts','Apply Court Changes','court change queued','Change active court','ACTIVE COURTS','SESSION CONTROL','Session Control','SESSION HISTORY','Session History','Pre-Match Setup','Arrival & Reshuffle','function nextRound(','function finish(','function render(','function renderDashboard('];
for(const word of look){
 let loc=html.indexOf(word),count=0;
 while(loc>=0&&count<3){
  console.log('\n=== CONTEXT '+JSON.stringify(word)+' #'+(count+1)+' offset='+loc+' ===');
  console.log(html.slice(Math.max(0,loc-650),Math.min(html.length,loc+1100)).replace(/data:image\/[^\s"']+/g,'[INLINE-IMAGE]'));
  loc=html.indexOf(word,loc+word.length);count++;
 }
}
const fn=/\b(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/g;let m;
while((m=fn.exec(html))){
 if(/court|round|regenerat|rebuild|schedul|layout|session|dashboard|history|stage|balance/i.test(m[1])) {
  console.log('FUNCTION '+m[1]+' OFFSET '+m.index);
 }
}
