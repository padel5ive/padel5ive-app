/* PADEL 5IVE v5.8.14 · View Only master presentation integration.
 * Inject only separate CSS/JS on Unified and Club Match; leave engines intact.
 */
'use strict';
const fs=require('node:fs');
const assetVersion='5829.1'; // fresh viewer navigation code for Safari/PWA; all Cloud asset URLs are versioned
const css=`<link rel="stylesheet" href="/phase5814/view-only-v5814.css?v=${assetVersion}">`;
const viewerJsVersion='5830.1'; // bust iPhone Safari/PWA cache for read-only leaderboard name fix
const js=`<script defer src="/phase5814/view-only-v5814.js?v=${viewerJsVersion}"></script>`;
function insert(path,anchor,tag){
 let s=fs.readFileSync(path,'utf8');
 // Remove any earlier cache-keyed or unversioned tags before adding exactly
 // one current adapter reference. Repeated builds remain idempotent.
 if(anchor==='</head>')
  s=s.replace(/<link\s+rel="stylesheet"\s+href="\/phase5814\/view-only-v5814\.css(?:\?[^"]*)?"\s*\/?>\s*/g,'');
 else
  s=s.replace(/<script\s+defer\s+src="\/phase5814\/view-only-v5814\.js(?:\?[^"]*)?"\s*><\/script>\s*/g,'');
 const i=s.lastIndexOf(anchor);
 if(i<0)throw Error('v5814 missing HTML anchor '+path);
 s=s.slice(0,i)+tag+'\n'+s.slice(i);
 fs.writeFileSync(path,s);
}
for(const file of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 insert(file,'</head>',css);
 insert(file,'</body>',js);
}
/* Version the existing Cloud UI assets too, so a WhatsApp/Safari webview
 * cannot reuse pre-takeover scripts while loading the latest Viewer adapter.
 * Keep the first tag in its original order and eliminate duplicates.
 */
for(const file of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 let markup=fs.readFileSync(file,'utf8');
 for(const [pattern,tag] of [
  [/<link\s+rel="stylesheet"\s+href="\/phase58\/cloud-session\.css(?:\?[^"]*)?"\s*\/?>/g,
   `<link rel="stylesheet" href="/phase58/cloud-session.css?v=${assetVersion}">`],
  [/<script\s+defer\s+src="\/phase58\/cloud-dashboard\.js(?:\?[^"]*)?"\s*><\/script>/g,
   `<script defer src="/phase58/cloud-dashboard.js?v=${assetVersion}"></script>`]
 ]){
  let first=true;
  markup=markup.replace(pattern,()=>{if(!first)return '';first=false;return tag;});
  if(first)throw Error('Missing Cloud UI asset on '+file);
 }
 fs.writeFileSync(file,markup);
}
const swFile='public/sw.js';
let sw=fs.readFileSync(swFile,'utf8');
const target="'/phase58/cloud-dashboard.js',";
const assets="'/phase5814/view-only-v5814.css', '/phase5814/view-only-v5814.js',";
if(!sw.includes(assets)){
 if(sw.split(target).length!==2)throw Error('v5814 PWA cache anchor changed');
 sw=sw.replace(target,target+' '+assets);
 fs.writeFileSync(swFile,sw);
}
for(const p of ['public/phase5814/view-only-v5814.css','public/phase5814/view-only-v5814.js'])
 if(!fs.existsSync(p))throw Error('Missing v5814 role adapter asset '+p);
console.log('PADEL 5IVE v5.8.14 View Only · master-scoped role adapter integrated.');
