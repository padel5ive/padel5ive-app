/* Cloud Viewer selected-round fix · final asset version update.
 * Keep phase5814 HTML output unchanged until the frozen PR36 patch succeeds.
 * Only cache-bust the two Viewer adapter scripts AFTER all protected UI patches.
 * Never touch engine text, scoring logic, Cloud API or match state.
 */
'use strict';
const fs=require('node:fs');
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const changes=[
 ['/phase58/cloud-dashboard.js?v=5833.1','/phase58/cloud-dashboard.js?v=5834.1'],
 ['/phase5814/view-only-v5814.js?v=5830.1','/phase5814/view-only-v5814.js?v=5834.1']
];
for(const path of pages){
 let html=fs.readFileSync(path,'utf8');
 for(const [before,after] of changes){
  if(html.includes(after)){
   if(html.split(after).length!==2)throw Error('Viewer asset duplicated: '+after);
   continue;
  }
  if(html.split(before).length!==2)throw Error('Viewer cache-bust source drift: '+before);
  html=html.replace(before,after);
 }
 fs.writeFileSync(path,html);
}
console.log('PASS Cloud Viewer round retention: post-PR36 Safari/PWA scripts versioned without engine changes.');
