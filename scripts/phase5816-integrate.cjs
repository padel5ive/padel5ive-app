/* v5.8.16 · build-time landing-only viewport correction.
 * The iOS PWA bottom 59–62px strip is outside the viewport when Home uses
 * viewport-fit=cover. A larger CSS layer cannot paint outside the compositor.
 * Default to auto on the landing document BEFORE first render, and restore
 * cover to ordinary Safari tabs via an early script. Mode pages are untouched.
 */
'use strict';
const fs=require('node:fs');
const home='public/index.html',swFile='public/sw.js';
let h=fs.readFileSync(home,'utf8');
const meta='<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=auto">';
const before='<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
if(!h.includes(meta)){
 if(h.split(before).length!==2)throw Error('v5816: initial viewport meta is unexpected');
 h=h.replace(before,meta);
}
// The parser sees viewport-fit=auto immediately. Browser tabs recover their
// prior cover behavior at head parse time, without a visible layout flash.
const early='<script id="p5816-viewport-mode">(function(){if(!((window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true)){var m=document.querySelector(\'meta[name="viewport"]\');if(m)m.setAttribute("content","width=device-width, initial-scale=1, viewport-fit=cover");}})();</script>';
if(!h.includes('id="p5816-viewport-mode"'))h=h.replace(meta,meta+'\n'+early);
const css='<link rel="stylesheet" href="/phase5816/pwa-viewport-v5816.css">';
const js='<script defer src="/phase5816/viewport-calibrate-v5816.js"></script>';
if(!h.includes(css)){
 const j=h.indexOf('</head>');
 if(j<0||j>h.indexOf('<body'))throw Error('v5816: real HTML head not found');
 h=h.slice(0,j)+css+'\n'+h.slice(j);
}
if(!h.includes(js)){
 const j=h.indexOf('</head>');
 if(j<0||j>h.indexOf('<body'))throw Error('v5816: real HTML head not found');
 h=h.slice(0,j)+js+'\n'+h.slice(j);
}
fs.writeFileSync(home,h);
let sw=fs.readFileSync(swFile,'utf8');
const newAssets=["'/phase5816/pwa-viewport-v5816.css'","'/phase5816/viewport-calibrate-v5816.js'"];
const marker="'/phase5815/pwa-fullscreen-v5815.css',";
if(!newAssets.every(a=>sw.includes(a))){
 if(sw.split(marker).length!==2)throw Error('v5816: Service Worker asset anchor drift');
 sw=sw.replace(marker,marker+' '+newAssets.map(x=>x+',').join(' '));
}
const versionRx=/const VERSION\\s*=\\s*['"][^'"]+['"];/;
if(!versionRx.test(sw))throw Error('v5816: Service Worker cache version assignment missing');
sw=sw.replace(versionRx,"const VERSION = 'p5-pwa-lab-v5816-ios-origin';");
fs.writeFileSync(swFile,sw);
console.log('PASS v5.8.16: iOS PWA viewport origin and full-height landing/initial setup integrated.');
