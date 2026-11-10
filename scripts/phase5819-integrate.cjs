/* v5.8.19 — isolated iPhone PWA Home colors/position and Initial Setup seam.
 * Runs after prior polish steps; idempotent, no mutation of mode documents.
 */
'use strict';
const fs=require('node:fs');
const homePath='public/index.html',swPath='public/sw.js';
const path='/phase5819/home-brass-setup-seam-v5819.css';
const htmlTag='<link rel="stylesheet" href="'+path+'">';
let home=fs.readFileSync(homePath,'utf8');
if(!home.includes(htmlTag)){
 const i=home.indexOf('</head>');
 if(i<0||i>home.indexOf('<body'))throw Error('v5819: Home head marker missing');
 home=home.slice(0,i)+htmlTag+'\n'+home.slice(i);
 fs.writeFileSync(homePath,home);
}
let sw=fs.readFileSync(swPath,'utf8');
const asset="'"+path+"',";
if(!sw.includes(asset)){
 const marker="'/phase5818/home-cta-lower-v5818.css',";
 if(sw.split(marker).length!==2)throw Error('v5819: PWA precache source drift');
 sw=sw.replace(marker,marker+' '+asset);
 fs.writeFileSync(swPath,sw);
}
console.log('PASS v5.8.19: warm-brass Home CTA / setup top seam integrated.');
