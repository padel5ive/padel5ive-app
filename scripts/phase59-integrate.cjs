/* PADEL 5IVE v5.9 UI laboratory — include Registration import preview.
 * Master engines, state and coach/flexible logic remain byte-for-byte intact.
 */
'use strict';const fs=require('node:fs');
const pages=['public/modes/unified/index.html'];
const css='<link rel="stylesheet" href="/phase59/registration-import-preview-v590.css">';
const js='<script defer src="/phase59/registration-import-preview-v590.js"></script>';
for(const path of pages){
 let h=fs.readFileSync(path,'utf8');
 for(const [anchor,tag,last] of [['</head>',css,false],['</body>',js,true]]){
   if(h.includes(tag))continue;
   const pos=last?h.lastIndexOf(anchor):h.indexOf(anchor);
   if(pos<0)throw Error('Invalid Unified HTML anchor '+anchor);
   if(anchor==='</head>'&&pos>h.indexOf('<body'))throw Error('Not a real head');
   h=h.slice(0,pos)+tag+'\n'+h.slice(pos);
 }
 fs.writeFileSync(path,h);
}
let sw=fs.readFileSync('public/sw.js','utf8');
const marker="'/phase586/dashboard-fixed-backdrop-v586.js',";
const entry=marker+" '/phase59/registration-import-preview-v590.css', '/phase59/registration-import-preview-v590.js',";
if(!sw.includes("'/phase59/registration-import-preview-v590.js'")){
 if(sw.split(marker).length!==2)throw Error('Unexpected PWA cache structure');
 sw=sw.replace(marker,entry);fs.writeFileSync('public/sw.js',sw);
}
if(!fs.readFileSync(pages[0],'utf8').includes(js)||!fs.readFileSync(pages[0],'utf8').includes(css))throw Error('Import UI not integrated');
console.log('v5.9 Import Players prototype integrated on native Registration (preview only).');
