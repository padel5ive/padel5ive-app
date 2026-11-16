/* Team Showdown v0.9.7: offline staging smoke test. No live POST. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const club=read('public/modes/club-match/index.html');
const cloud=read('public/phase58/cloud-dashboard.js');
const cloudHome=read('public/phase58/cloud-home.js'),history=read('public/phase57/home-session-history.js');
const routes=read('netlify.toml'),sw=read('public/sw.js');
const must=(s,x)=>assert(s.includes(x),'Missing staging marker: '+x);
for(const x of ['universal-continuous','p5-showdown-v090-individual','p5-direct-pdf.js',
 "function showdownReportData()",'loadPublic()',"/api/results",'data-p58-cloud',
 '/phase58/cloud-dashboard.js','/phase58/cloud-session.css'])must(club,x);
for(const s of [cloud,cloudHome,history])must(s,'padel5ive-team-showdown-v090-individual-lab');
must(routes,'from = "/i/*"');
must(routes,'to = "/modes/club-match/index.html"');
must(sw,"'/i/'");
assert(!club.includes('P5_QA_DATA'),'QA fixture leaked into native engine');
for(const [i,m] of [...club.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'club-inline-'+i});
}
assert(cloudHome.includes('/modes/club-match/?intent=resume'),'Load Session route to Team Showdown missing');
assert(!cloud.includes("club:'padel5ive-team-showdown-state-v3'"),'Cloud uses old key');
console.log('PASS Team Showdown v0.9.7 staging: engine JS, Cloud Session, Home, /i/ and PDF hooks');
