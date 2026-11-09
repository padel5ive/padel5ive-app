/* PADEL 5IVE v5.8.4 — isolated presentation layer after 5.7/5.8/5.8.3.
 * Fail on HTML source drift and leave embedded scheduling engines intact. */
const fs=require('node:fs');
function inject(file,anchor,payload,label,last=false){
 let s=fs.readFileSync(file,'utf8');
 if(s.includes(payload))return;
 const i=last?s.lastIndexOf(anchor):s.indexOf(anchor);
 if(i<0)throw Error('v5.8.4 missing insertion point: '+label);
 if(anchor==='</head>'&&i>s.indexOf('<body'))throw Error('v5.8.4 did not find real HTML head: '+label);
 s=s.slice(0,i)+payload+'\n'+s.slice(i);
 fs.writeFileSync(file,s);
}
inject('public/index.html','</head>','<link rel="stylesheet" href="/phase58/home-finish-v584.css">','Home photo and fixed viewport');
inject('public/index.html','</body>','<script defer src="/phase58/home-scroll-v584.js"></script>','Home PWA scroll control',true);
inject('public/modes/unified/index.html','</head>','<link rel="stylesheet" href="/phase58/share-menu-alignment-v584.css">','Unified Share and PDF alignment');
let sw=fs.readFileSync('public/sw.js','utf8');
const marker="'/phase58/home-cta-compact-v582.css',";
const addition=marker+" '/phase58/home-finish-v584.css', '/phase58/home-scroll-v584.js', '/phase58/share-menu-alignment-v584.css', '/phase58/dashboard-clean-v583.css',";
if(!sw.includes(addition)){
 const c=sw.split(marker).length-1;
 if(c!==1)throw Error('v5.8.4 PWA precache marker drift: '+c);
 sw=sw.replace(marker,addition);
 fs.writeFileSync('public/sw.js',sw);
}
for(const [file,needle] of [
 ['public/index.html','/phase58/home-finish-v584.css'],
 ['public/index.html','/phase58/home-scroll-v584.js'],
 ['public/modes/unified/index.html','/phase58/share-menu-alignment-v584.css'],
 ['public/sw.js','/phase58/home-finish-v584.css']
]){
 if(!fs.readFileSync(file,'utf8').includes(needle))throw Error('v5.8.4 failed to attach '+needle);
}
console.log('PADEL 5IVE 5.8.4 UI polish integrated; master engines and game state untouched.');
