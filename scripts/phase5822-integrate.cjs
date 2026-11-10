/* PADEL 5IVE v5.8.22 — compact Cloud Session modal on phone.
 * Only add a scoped stylesheet to the two native match dashboards.
 * No modifications to session data, score engines or Cloud controller.
 */
'use strict';
const fs=require('node:fs');
const href='/phase5822/cloud-modal-compact-v5822.css';
const tag='<link rel="stylesheet" href="'+href+'">';
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
for(const path of pages){
 let html=fs.readFileSync(path,'utf8');
 if(!html.includes(tag)){
  const index=html.indexOf('</head>');
  if(index<0||index>html.indexOf('<body'))throw Error('v5822: head tag not found in '+path);
  html=html.slice(0,index)+tag+'\n'+html.slice(index);
  fs.writeFileSync(path,html);
 }
}
// The Home "Load Session" form must not retain its old 10-character
// validator from an iPhone PWA cache after this server format migration.
const homePath='public/index.html';
let home=fs.readFileSync(homePath,'utf8');
const scriptRx=/<script\s+defer\s+src="\/phase58\/cloud-home\.js(?:\?[^"]*)?"\s*><\/script>/g;
const matching=home.match(scriptRx)||[];
if(matching.length!==1)throw Error('v5823: expected exactly one Cloud Home script');
home=home.replace(scriptRx,'<script defer src="/phase58/cloud-home.js?v=5823.0"></script>');
fs.writeFileSync(homePath,home);
const swPath='public/sw.js';
let worker=fs.readFileSync(swPath,'utf8');
const marker="'/phase5819/home-brass-setup-seam-v5819.css',";
const asset="'"+href+"',";
if(!worker.includes(asset)){
 if(worker.split(marker).length!==2)throw Error('v5822: expected PWA precache anchor missing');
 worker=worker.replace(marker,marker+' '+asset);
 fs.writeFileSync(swPath,worker);
}
console.log('PASS v5.8.22 Cloud Session compact UI applied to both match modes.');
