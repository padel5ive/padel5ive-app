/* v5.8.17 — match the dashboard's native iPhone status-bar treatment.
 * Apple/WebKit: black-translucent PWA status-bar style is deprecated and can
 * create a painted strip on iOS 27 Home Screen web apps. We remove it only
 * from the landing document; the in-game dashboard stays unchanged.
 * The v5.8.16 viewport-fit=auto and bottom-fullscreen fix remain untouched.
 */
'use strict';
const fs=require('node:fs');
const homeFile='public/index.html',swFile='public/sw.js';
let html=fs.readFileSync(homeFile,'utf8');
const oldTheme='<meta name="theme-color" content="#071629">';
const newTheme='<meta name="theme-color" content="#11171d">';
if(html.includes(oldTheme)){
 if(html.split(oldTheme).length!==2)throw Error('v5817: multiple Home theme meta tags');
 html=html.replace(oldTheme,newTheme);
}else if(!html.includes(newTheme))throw Error('v5817: Home theme meta drift');
// Keep the existing theme color for Safari tabs (not the installed PWA).
const browserTheme='<script id="p5817-browser-theme">(function(){if(!((window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true)){var m=document.querySelector(\'meta[name="theme-color"]\');if(m)m.setAttribute("content","#071629");}})();</script>';
if(!html.includes('id="p5817-browser-theme"'))html=html.replace(newTheme,newTheme+'\n'+browserTheme);
const legacyStyle=/<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="black-translucent"\s*\/?>/g;
html=html.replace(legacyStyle,'');
const css='<link rel="stylesheet" href="/phase5817/statusbar-parity-v5817.css">';
if(!html.includes(css)){
 const at=html.indexOf('</head>');
 if(at<0||at>html.indexOf('<body'))throw Error('v5817: Home head missing');
 html=html.slice(0,at)+css+'\n'+html.slice(at);
}
fs.writeFileSync(homeFile,html);
let sw=fs.readFileSync(swFile,'utf8');
const entry="'/phase5817/statusbar-parity-v5817.css',";
if(!sw.includes(entry)){
 const marker="'/phase5816/viewport-calibrate-v5816.js',";
 if(sw.split(marker).length!==2)throw Error('v5817: PWA precache marker drift');
 sw=sw.replace(marker,marker+' '+entry);
 fs.writeFileSync(swFile,sw);
}
console.log('PASS v5.8.17: Home PWA status chrome matches dashboard; no viewport/engine modifications.');
