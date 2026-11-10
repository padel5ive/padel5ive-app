/* PADEL 5IVE v5.8.18 — Home-only button cluster position.
 * Appends one isolated stylesheet after v5.8.17; no changes to game
 * engines, storage, other routes or existing PWA geometry.
 */
'use strict';
const fs=require('node:fs');
const file='public/index.html',worker='public/sw.js';
const path='/phase5818/home-cta-lower-v5818.css';
const tag='<link rel="stylesheet" href="'+path+'">';
let html=fs.readFileSync(file,'utf8');
if(!html.includes(tag)){
 const i=html.indexOf('</head>');
 if(i<0||i>html.indexOf('<body'))throw Error('v5818: landing HTML head missing');
 html=html.slice(0,i)+tag+'\n'+html.slice(i);
 fs.writeFileSync(file,html);
}
let sw=fs.readFileSync(worker,'utf8');
const asset="'"+path+"',";
if(!sw.includes(asset)){
 const marker="'/phase5817/statusbar-parity-v5817.css',";
 if(sw.split(marker).length!==2)throw Error('v5818: PWA precache marker missing');
 sw=sw.replace(marker,marker+' '+asset);
 fs.writeFileSync(worker,sw);
}
console.log('PASS v5.8.18: Home CTA group lowered; all gameplay unchanged.');
