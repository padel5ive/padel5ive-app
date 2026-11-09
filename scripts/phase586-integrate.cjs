/* PADEL 5IVE v5.8.6 — isolated iPad dashboard backdrop patch.
 * Appended AFTER all existing masters and v5.8.5 preview transforms.
 */
'use strict';
const fs=require('node:fs');
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
const css='<link rel="stylesheet" href="/phase586/dashboard-fixed-backdrop-v586.css">';
const js='<script defer src="/phase586/dashboard-fixed-backdrop-v586.js"></script>';
for(const path of pages){
 let html=fs.readFileSync(path,'utf8');
 for(const [needle,tag,last] of [['</head>',css,false],['</body>',js,true]]){
   if(html.includes(tag))continue;
   const at=last?html.lastIndexOf(needle):html.indexOf(needle);
   if(at<0)throw Error('No '+needle+' in '+path);
   if(needle==='</head>'&&at>html.indexOf('<body'))throw Error('Not real head: '+path);
   html=html.slice(0,at)+tag+'\n'+html.slice(at);
 }
 fs.writeFileSync(path,html);
}
let sw=fs.readFileSync('public/sw.js','utf8');
const needle="'/phase585/menu-unified-v585.js',";
const additions=needle+" '/phase586/dashboard-fixed-backdrop-v586.css', '/phase586/dashboard-fixed-backdrop-v586.js',";
if(!sw.includes("'/phase586/dashboard-fixed-backdrop-v586.css'")){
 if(sw.split(needle).length!==2)throw Error('PWA cache marker drift');
 sw=sw.replace(needle,additions);
 fs.writeFileSync('public/sw.js',sw);
}
for(const path of pages){
 const html=fs.readFileSync(path,'utf8');
 if(!html.includes(css)||!html.includes(js))throw Error('Missing dashboard wallpaper fix in '+path);
}
console.log('v5.8.6: original venue backdrop locked to viewport in Unified and Club Match.');
