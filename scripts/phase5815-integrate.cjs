/* PADEL 5IVE v5.8.15 · iPhone standalone viewport/typography polish.
 * Scoped to Home page; no in-match source or scheduling engine changes.
 * Running twice is byte-for-byte idempotent.
 */
'use strict';
const fs=require('node:fs');
const home='public/index.html',swPath='public/sw.js';
const href='/phase5815/pwa-fullscreen-v5815.css';
const tag='<link rel="stylesheet" href="'+href+'">';
let content=fs.readFileSync(home,'utf8');
if(!content.includes(tag)){
 const at=content.indexOf('</head>');
 if(at<0||at>content.indexOf('<body'))throw Error('PWA v5815: actual Home head marker missing');
 content=content.slice(0,at)+tag+'\n'+content.slice(at);
 fs.writeFileSync(home,content);
}
let sw=fs.readFileSync(swPath,'utf8');
const asset="'"+href+"',";
if(!sw.includes(asset)){
 const marker="'/phase587/pwa-home-finish-v587.css',";
 if(sw.split(marker).length!==2)throw Error('PWA v5815: service-worker precache source drift');
 sw=sw.replace(marker,marker+' '+asset);
 fs.writeFileSync(swPath,sw);
}
const css=fs.readFileSync('public/phase5815/pwa-fullscreen-v5815.css','utf8');
if(!css.includes('(display-mode:standalone)')||!css.includes('p545-brand-sub'))
 throw Error('PWA v5815: missing standalone CSS or editorial subtitle');
console.log('PASS v5.8.15 iPhone standalone Home + Initial Setup polish integrated.');
