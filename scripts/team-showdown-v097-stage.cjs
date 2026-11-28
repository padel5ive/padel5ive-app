/* PADEL 5IVE · Team Showdown v0.9.7 staging-only adapter.
 * Frozen source is recovered by checksum before runtime adapters.
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const dir='source/team-showdown-v097';
const files=fs.readdirSync(dir).filter(x=>/^chunk-\d\d-\d\d\.txt$/.test(x)).sort();
if(files.length!==31)throw Error('v0.9.7 source incomplete: expected 31 chunks, got '+files.length);
const source=files.map(f=>fs.readFileSync(dir+'/'+f,'utf8')).join('');
const digest=crypto.createHash('sha256').update(source).digest('hex');
if(digest!=='6e0630f814b48c39a77cf326c4ca38987b360187f973fed3c0824df548992f48')throw Error('v0.9.7 source integrity mismatch: '+digest);
const check=(fragment,label)=>{if(!source.includes(fragment))throw Error('v0.9.7 source drift: '+label);};
check("KEY='padel5ive-team-showdown-v090-individual-lab'",'native state key');
check("'universal-continuous'",'frozen scheduler');
check('function loadPublic()','native public results reader');
check('function showdownReportData()','native reporting');
check('<details class="mc32-advanced"><summary>Advanced Settings','native settings menu');
check('P5ReportUI.openShare','native publishing');
check('printReport()','native A4 landscape PDF print');
for(const [i,m] of [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'v097-native-inline-'+i});
}
/* Keep the existing First Edition master byte-for-byte intact.
 * Compile v0.9.7 as a separate native Team Showdown page.
 * This avoids breaking all the validated UI/PWA/Cloud adapters on Classic + Fixed.
 */
let html=source;
function replaceEngine(fragment,replacement){
 if(html.split(fragment).length!==2)throw Error('Team Showdown opponent adapter source drift: '+fragment.slice(0,100));
 html=html.replace(fragment,replacement);
}
const opponentDraw=fs.readFileSync('source/team-showdown-individual-opponents.js','utf8');
replaceEngine('function individualBuildDivision(n,start,division,rnd){',
 opponentDraw+'\nfunction individualBuildDivision(n,start,division,rnd,courts){\n if(n===8&&courts===3)return individualBuildThreeCourtDraw(start,division,rnd);');
replaceEngine('individualBuildDivision(d.count,d.start,d.id,rnd)', 'individualBuildDivision(d.count,d.start,d.id,rnd,courts)');

// Preserve the best round-safe draw found by the existing bounded search.
replaceEngine(`const penalty=v=>v===0?14:v===1?0:v===2?0:v===3?90:v===4?450:450+(v-4)*600;
 const size=fixtures.length,tries=Math.max(4000,size*1000);`,
 `const penalty=individualOpponentPenalty;
 const size=fixtures.length,tries=Math.max(4000,size*1000);
 let score=0;for(const row of encounter)for(const count of row)score+=penalty(count);
 if(score===0)return;
 let bestScore=score,bestDuos=fixtures.map(m=>[m.b,m.b2]);`);
replaceEngine('const temperature=step<tries*.2?20:step<tries*.5?7:step<tries*.85?3:0;',
 'const temperature=step<tries*.15?6:step<tries*.45?3:step<tries*.8?1.8:0;');
replaceEngine(`for(let i=0;i<x.length;i++){[x[i].b,y[i].b]=[y[i].b,x[i].b];[x[i].b2,y[i].b2]=[y[i].b2,x[i].b2];}
  }
 }
}`,`for(let i=0;i<x.length;i++){[x[i].b,y[i].b]=[y[i].b,x[i].b];[x[i].b2,y[i].b2]=[y[i].b2,x[i].b2];}
   score+=delta;
   if(score<bestScore){
    bestScore=score;bestDuos=fixtures.map(m=>[m.b,m.b2]);
    if(bestScore===0)break;
   }
  }
 }
 fixtures.forEach((m,i)=>{[m.b,m.b2]=bestDuos[i];});
}`);

// A pending-duo swap can fill a court or rebalance play counts. Retain the
// planned opponent quality across those swaps while a legal fixture can run.
replaceEngine('return {seg,a:a.slice(0,65),b:b.slice(0,65)};',
 'return {seg,a:a.slice(0,65),b:b.slice(0,65),pending:list};');
const rescueStart='   let best=null;\n   for(const {seg,a:readyA,b:readyB}';
const rescueEnd='   choice=x;\n';
const rescue=html.indexOf(rescueStart),rescueEndIndex=html.indexOf(rescueEnd,rescue);
if(rescue<0||rescueEndIndex<0)throw Error('Team Showdown court rescue source drift');
replaceEngine(html.slice(rescue,rescueEndIndex+rescueEnd.length),`   const best=individualFindOpponentRotation(byDivision,total,globallyCounted,globallyPlayed,maxOriginal,ledger,s.setup.courts);
   if(!best)break;
   const {fixtures,change}=best;
   individualRotateOpponentDuos(fixtures);
   for(const [k,v] of change)if(v)globallyCounted[Math.floor(k/total)][k%total]+=v;
   choice=fixtures[0];
`);
replaceEngine(' const penalty=v=>v<=2?(v===0?15:0):v===3?250:v===4?1900:1900+(v-4)*(v-4)*3500;\n','');
replaceEngine('const pen=v=>v===0?22:v===1?0:v===2?0:v===3?180:v===4?1300:1300+(v-4)*2000;',
 'const pen=individualOpponentPenalty;');

const menu='<details class="mc32-advanced"><summary>Advanced Settings';
const session='<details class="mc32-advanced"><summary>Session Management</summary><div class="mc32-advanced-body"><button type="button" data-p58-cloud class="p58-menu-action">CLOUD SESSION</button></div></details>\n';
if(html.split(menu).length!==2)throw Error('v097 native menu drift');
html=html.replace(menu,session+menu);
const headEnd=html.indexOf('</head>'),body=html.indexOf('<body');
if(headEnd<0||body<0||headEnd>body)throw Error('v097 real head missing');
const styles=[
 '/phase58/cloud-session.css',
 '/phase5822/cloud-modal-compact-v5822.css',
 '/phase585/menu-unified-v585.css',
 '/phase5814/view-only-v5814.css'
].map(url=>'<link rel="stylesheet" href="'+url+'">').join('\n');
const social=[
 '<meta name="robots" content="noindex,nofollow,noarchive">',
 '<meta property="og:type" content="website">',
 '<meta property="og:site_name" content="PADEL 5IVE">',
 '<meta property="og:title" content="PADEL 5IVE · Team Showdown">',
 '<meta property="og:description" content="Official Match Results · Beyond 5IVE. Beyond Play.">',
 '<meta property="og:image" content="https://padel5ive.netlify.app/og-cover.jpg">',
 '<meta property="og:image:width" content="1200">',
 '<meta property="og:image:height" content="630">',
 '<meta name="twitter:card" content="summary_large_image">'
].join('\n');
html=html.slice(0,headEnd)+social+'\n'+styles+'\n'+html.slice(headEnd);
const target='public/modes/club-match/v097/index.html';
fs.mkdirSync('public/modes/club-match/v097',{recursive:true});
const end=html.lastIndexOf('</body>');if(end<0)throw Error('v097 body terminator missing');
const scripts=[
 '/v097/cloud-dashboard.js',
 '/phase5814/view-only-v5814.js?v=5834.1',
 '/phase585/menu-unified-v585.js'
].map(url=>'<script defer src="'+url+'"></script>').join('\n');
html=html.slice(0,end)+scripts+'\n'+html.slice(end);
html=html.replace('PADEL 5IVE | Team Showdown Individual Americano Continuous Balanced v0.9.6 Offline',
 'PADEL 5IVE | Team Showdown v0.9.7 · Staging');
/* First Edition v1.5 HOME 404 hotfix.
 * Native frozen v0.9.7 HTML linked ../../ from /modes/club-match/v097/,
 * which navigated to /modes/ (404), NOT /. Do not edit the frozen engine.
 */
const oldBackHome='<a class="p54-back-home" href="../../" id="p54-home-link">';
if(html.split(oldBackHome).length!==2)throw Error('First Edition v1.5 HOME link source drift');
html=html.replace(oldBackHome,'<a class="p54-back-home" href="/" id="p54-home-link">');
// Production Integration v0.9.7: all three formats share one native
// read-only public renderer. Keep legacy /r/ results fully untouched.
const oldSharePrefix="(individualActive()?'/i/':'/r/')";
if(html.split(oldSharePrefix).length!==3)throw Error('v097 share URL source drift');
html=html.split(oldSharePrefix).join("'/ts/'");
const oldViewerGroup='(?:r|i)';
if(html.split(oldViewerGroup).length!==3)throw Error('v097 public viewer gate source drift');
html=html.split(oldViewerGroup).join('(?:r|i|ts)');
fs.writeFileSync(target,html);
const originalCloud=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const oldKey='padel5ive-team-showdown-state-v3',newKey='padel5ive-team-showdown-v090-individual-lab';
if(originalCloud.split(oldKey).length!==2)throw Error('Cloud master session key changed upstream');
const oldMeta="const META='p58-cloud-link-'+kind";
if(!originalCloud.includes(oldMeta))throw Error('Cloud link metadata identity changed upstream');
let cloud=originalCloud.replace(oldKey,newKey)
 .replace(oldMeta,"const META='p58-cloud-link-v097-'+kind");
const boot="(()=>{'use strict';";
if(!cloud.includes(boot))throw Error('Cloud boot changed');
cloud=cloud.replace(boot,boot+"\nif(/^\\/(?:r|i|ts)\\//.test(location.pathname))return;");
fs.mkdirSync('public/v097',{recursive:true});
fs.writeFileSync('public/v097/cloud-dashboard.js',cloud);
// Public /i/ and /ts/ results must never be handled by the PWA's cached HTML fallback.
// Keep the exact current production SW fingerprint: many shared-mode QA
// checks explicitly require the already approved cache version.
const swFile='public/sw.js';let sw=fs.readFileSync(swFile,'utf8');
const deny="'/r/', '/u/'";
if(sw.includes(deny))sw=sw.replace(deny,"'/r/', '/i/', '/ts/', '/u/'");
else if(!sw.includes("'/i/'")||!sw.includes("'/ts/'"))throw Error('PWA result cache bypass missing');
fs.writeFileSync(swFile,sw);
console.log('PASS v0.9.7 staging sidecar: frozen source, native Cloud, /i/; First Edition main HTML/Cloud untouched');
