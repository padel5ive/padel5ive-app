/* PADEL 5IVE v5.8.7: Home-only PWA finishing patch. */
'use strict';
const fs=require('node:fs');
const home='public/index.html';
const css='<link rel="stylesheet" href="/phase587/pwa-home-finish-v587.css">';
let h=fs.readFileSync(home,'utf8');
if(!h.includes(css)){
 const i=h.indexOf('</head>');
 if(i<0||i>h.indexOf('<body'))throw Error('Home real <head> not found');
 h=h.slice(0,i)+css+'\n'+h.slice(i);
 fs.writeFileSync(home,h);
}
let sw=fs.readFileSync('public/sw.js','utf8');
const marker="'/phase585/home-stage-v585.css',";
const insert=marker+" '/phase587/pwa-home-finish-v587.css',";
if(!sw.includes("'/phase587/pwa-home-finish-v587.css'")){
 if(sw.split(marker).length!==2)throw Error('Service worker source drift');
 sw=sw.replace(marker,insert);
 fs.writeFileSync('public/sw.js',sw);
}
if(!fs.existsSync('public/phase585/home-venue-user-refined-hd.webp'))throw Error('Original approved photo missing');
console.log('v5.8.7 Home PWA finish loaded, genuine venue photo preserved.');
