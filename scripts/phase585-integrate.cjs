/* PADEL 5IVE v5.8.5 — isolated review build. No engine modifications.
 * Native menus are reorganized by moving their existing action DOM nodes.
 * Home uses one versioned user-approved tone-adjusted photo, not layered mask/blur effects.
 */
'use strict';
const fs=require('node:fs');
function inject(file,needle,insert,last=false){
 let s=fs.readFileSync(file,'utf8');
 if(s.includes(insert))return;
 const at=last?s.lastIndexOf(needle):s.indexOf(needle);
 if(at<0)throw Error('v5.8.5 insertion point missing '+file+' '+needle);
 if(needle==='</head>'&&at>s.indexOf('<body'))throw Error('Not a real HTML head');
 s=s.slice(0,at)+insert+'\n'+s.slice(at);
 fs.writeFileSync(file,s);
}
const home='public/index.html';
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
inject(home,'</head>','<link rel="stylesheet" href="/phase585/home-stage-v585.css">');
inject(home,'</body>','<script defer src="/phase585/home-scroll-v585.js"></script>',true);
for(const page of pages){
 inject(page,'</head>','<link rel="stylesheet" href="/phase585/menu-unified-v585.css">');
 inject(page,'</body>','<script defer src="/phase585/menu-unified-v585.js"></script>',true);
}
let sw=fs.readFileSync('public/sw.js','utf8');
const marker="'/phase58/home-cta-compact-v582.css',";
const assets=["'/phase585/home-venue-user-refined-hd.webp'","'/phase585/home-stage-v585.css'","'/phase585/home-scroll-v585.js'","'/phase585/menu-unified-v585.css'","'/phase585/menu-unified-v585.js'"];
if(!sw.includes(assets[0])){
 const n=sw.split(marker).length-1;
 if(n!==1)throw Error('v5.8.5 SW source drift '+n);
 sw=sw.replace(marker,marker+' '+assets.join(', ')+',');
}
// Retain legacy cache fingerprint during preview; new content is versioned by URL.
fs.writeFileSync('public/sw.js',sw);
const checks=[
[home,'/phase585/home-stage-v585.css'],
[home,'/phase585/home-scroll-v585.js'],
[pages[0],'/phase585/menu-unified-v585.js'],
[pages[1],'/phase585/menu-unified-v585.js'],
['public/sw.js','/phase585/home-venue-user-refined-hd.webp']
];
for(const [p,v]of checks){if(!fs.readFileSync(p,'utf8').includes(v))throw Error('Missing 5.8.5 integration '+p+' '+v)}
if(!fs.existsSync('public/phase585/home-venue-user-refined-hd.webp'))throw Error('Generated full-height venue asset missing');
console.log('v5.8.5 UI review integrated (Home, Unified, Club) without changing match engines.');
