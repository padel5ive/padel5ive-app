/* PADEL 5IVE Team Showdown v0.9.7 · native public results/PDF regression.
 * Offline only; no live publication or credential use. Frozen engine unchanged.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const page=read('public/modes/club-match/v097/index.html');
const legacy=read('public/modes/club-match/index.html');
const routes=read('netlify.toml'),sw=read('public/sw.js'),api=read('netlify/functions/results.mjs');
const must=(src,fragment)=>assert(src.includes(fragment),'Missing public/print marker '+fragment);
const occurrences=(src,term)=>src.split(term).length-1;
assert.equal(occurrences(page,"new URL('/ts/'+encodeURIComponent("),2,'Both new links must use the native viewer');
assert(!page.includes("(individualActive()?'/i/':'/r/')"),'v0.9.7 must not publish legacy /r/ pages');
for(const marker of ["function shareResults(){","fetch('/api/results',{method:'POST'","'X-Padel-Pin':pin",
 "if(!state.finalized||!['champion','stage1-champion'].includes(E.verdict(state).status))",
 "async function loadPublic(){const m=location.pathname.match(/^\\/(?:r|i|ts)\\/",
 "viewOnly=true;document.body.classList.add('sd-public-only')",
 "fetch('/api/results?id='+encodeURIComponent(m[1])",
 "if(d.schema!=='padel5ive-team-showdown-results-v1')",
 "if(!E.validateSavedState(imported))","state=E.migrateLegacySchedule(imported)"])must(page,marker);
assert(!legacy.includes("new URL('/ts/'+encodeURIComponent("),'Older master must keep historical share URLs');
assert.equal(occurrences(routes,'from = "/r/*"'),1,'Legacy /r/ route preserved');
assert.equal(occurrences(routes,'from = "/ts/*"'),1,'New native /ts/ route unique');
assert.equal(occurrences(routes,'to = "/modes/club-match/v097/index.html"'),2,'Old Individual and new /ts/ resolve to native viewer');
for(const m of ["'/ts/'",'p5-pwa-setup-prewarm-v588-1'])must(sw,m);
for(const m of ['Cache-Control = "no-store, max-age=0"','X-Robots-Tag = "noindex, nofollow"'])must(routes,m);
for(const m of ["getStore('team-showdown-results-v1')","if(!goodPin(request.headers.get('X-Padel-Pin')",
 "if(!/^[a-zA-Z0-9_-]{6,32}$/.test(id))","if(!data||data.schema!=='padel5ive-team-showdown-results-v1'"])must(api,m);
for(const m of ['@page {size:A4 landscape;margin:10mm}',
 "if(state.setup.competitionFormat==='multi'||state.setup.competitionFormat==='individual'||typeof window.P5DirectPDF==='undefined')",
 "printReport();notify('Division-separated report opened",
 "P5DirectPDF.exportShowdown(showdownReportData())",
 'function showdownReportData()','function printReport()','window.print()'])must(page,m);
const a=page.indexOf('async function loadPublic(){'),b=page.indexOf('\nlet pendingDuelReview=',a);
assert(a>0&&b>a&&b-a<5000,'Native public reader extraction failed');
const loader=page.slice(a,b);
(async()=>{
 for(const format of ['classic','multi','individual']){
  const id='A7b9Qz_5';
  const record={schema:'padel5ive-team-showdown-results-v1',
   setup:{competitionFormat:format,sessionName:'QA Only'},roster:{A:[],B:[]},schedule:[],stage:'finished',finalized:true};
  let url='',renders=0,checks=0,localReads=0;
  const context={viewOnly:false,location:{pathname:'/ts/'+id},state:{secret:'private-local-session'},
   document:{body:{classList:{add:s=>assert.equal(s,'sd-public-only')}}},
   app:{innerHTML:'OLD LOCAL DISPLAY'},
   fetch:async(u,opts)=>{url=u;assert.equal(opts.cache,'no-store');return{ok:true,json:async()=>record}},
   E:{newState:()=>({stage:'setup'}),validateSavedState:s=>{checks++;return s.setup.competitionFormat===format},
    migrateLegacySchedule:s=>s,ensureSitOut:()=>{}},
   render:()=>renders++,esc:s=>String(s).replace(/</g,'&lt;'),
   localStorage:{getItem:()=>{localReads++;throw Error('Public viewer cannot access private storage')}}};
  vm.runInNewContext(loader+'\nthis.load=loadPublic;',context,{filename:'v097-public-loader.js'});
  await context.load();
  assert.equal(url,'/api/results?id='+id);
  assert.equal(context.viewOnly,true);
  assert.equal(context.state.setup.competitionFormat,format);
  assert.equal(context.state.secret,undefined,'Public result must replace local session state');
  assert.equal(localReads,0);assert.equal(checks,1);assert.equal(renders,1);
 }
 const invalid={viewOnly:false,location:{pathname:'/ts/INVALID%20ID'},
  fetch:()=>{throw Error('Invalid ID must not fetch')},document:{body:{classList:{add(){}}}},app:{},E:{},render(){}};
 vm.runInNewContext(loader+'\nthis.load=loadPublic;',invalid);
 await invalid.load();assert.equal(invalid.viewOnly,false);
 console.log('PASS native Team Showdown v0.9.7: three public formats, signed publish/GET routes, legacy preservation, A4 Landscape print/PDF');
})().catch(error=>{console.error(error);process.exitCode=1});
