/* PADEL 5IVE · Team Showdown v0.9.7 staging-only adapter.
 * Frozen source is recovered by checksum; engine scheduling/scoring untouched.
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
let html=source;
const menu='<details class="mc32-advanced"><summary>Advanced Settings';
const session='<details class="mc32-advanced"><summary>Session Management</summary><div class="mc32-advanced-body"><button type="button" data-p58-cloud class="p58-menu-action">CLOUD SESSION</button></div></details>\n';
html=html.replace(menu,session+menu);
const headEnd=html.indexOf('</head>'),body=html.indexOf('<body');
if(headEnd<0||body<0||headEnd>body)throw Error('v097 real head missing');
html=html.slice(0,headEnd)+'<link rel="stylesheet" href="/phase58/cloud-session.css">\n'+html.slice(headEnd);
const end=html.lastIndexOf('</body>');if(end<0)throw Error('v097 body terminator missing');
html=html.slice(0,end)+'<script defer src="/phase58/cloud-dashboard.js"></script>\n'+html.slice(end);
html=html.replace('PADEL 5IVE | Team Showdown Individual Americano Continuous Balanced v0.9.6 Offline',
 'PADEL 5IVE | Team Showdown v0.9.7 · Staging');
fs.writeFileSync('public/modes/club-match/index.html',html);
const legacy='padel5ive-team-showdown-state-v3',current='padel5ive-team-showdown-v090-individual-lab';
for(const file of ['public/phase58/cloud-dashboard.js','public/phase58/cloud-home.js','public/phase57/home-session-history.js','public/index.html']){
 let s=fs.readFileSync(file,'utf8'),count=s.split(legacy).length-1;
 if(file!=='public/index.html'&&count!==1)throw Error('Cloud/Home storage-key drift: '+file+' (count='+count+')');
 if(count)fs.writeFileSync(file,s.split(legacy).join(current));
}
const oldArch='padel5ive-clubmatch-p54-sessions',newArch='padel5ive-team-showdown-native-v07-archive';
for(const file of ['public/phase58/cloud-home.js','public/phase57/home-session-history.js']){
 let s=fs.readFileSync(file,'utf8');
 if(!s.includes(oldArch))throw Error('Archive-key drift: '+file);
 fs.writeFileSync(file,s.split(oldArch).join(newArch));
}
const swFile='public/sw.js';let sw=fs.readFileSync(swFile,'utf8');
const deny="'/r/', '/u/'";
if(sw.includes(deny))sw=sw.replace(deny,"'/r/', '/i/', '/u/'");
else if(!sw.includes("'/i/'"))throw Error('PWA result-cache bypass missing');
sw=sw.replace(/const VERSION = '[^']+';/,"const VERSION = 'p5-stage-team-showdown-v097-1';");
fs.writeFileSync(swFile,sw);
console.log('PASS Team Showdown v0.9.7 staging adapter: SHA verified, native engine preserved; Cloud Session, Home & /i/ wired');
