/* Team Showdown v0.9.7 sidecar regression: production master isolation */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const target=read('public/modes/club-match/v097/index.html');
const legacy=read('public/modes/club-match/index.html');
const cloud=read('public/v097/cloud-dashboard.js');
const originalCloud=read('public/phase58/cloud-dashboard.js');
const cloudHome=read('public/phase58/cloud-home.js');
const history=read('public/phase57/home-session-history.js');
const routes=read('netlify.toml'),sw=read('public/sw.js');
function must(s,x){assert(s.includes(x),'Missing staging marker: '+x)}
for(const x of ['universal-continuous','p5-showdown-v090-individual','p5-direct-pdf.js',
 'function showdownReportData()','loadPublic()',"/api/results",'data-p58-cloud',
 '/v097/cloud-dashboard.js','/phase58/cloud-session.css','/phase585/menu-unified-v585.js',
 '/phase5822/cloud-modal-compact-v5822.css','/phase5814/view-only-v5814.js?v=5834.1'])must(target,x);
for(const x of ['v5.5.16','Share Final Results Link','/phase585/menu-unified-v585.js',
 '/phase5822/cloud-modal-compact-v5822.css','cloud-dashboard.js?v=5834.1'])must(legacy,x);
assert(!legacy.includes('padel5ive-team-showdown-v090-individual-lab'),'Legacy master overwritten');
must(originalCloud,'padel5ive-team-showdown-state-v3');
must(cloudHome,'padel5ive-team-showdown-state-v3');
must(history,'padel5ive-team-showdown-state-v3');
must(cloud,'padel5ive-team-showdown-v090-individual-lab');
must(cloud,'p58-cloud-link-v097-');
must(routes,'from = "/i/*"');
must(routes,'to = "/modes/club-match/v097/index.html"');
must(sw,"'/i/'");
must(sw,"p5-pwa-setup-prewarm-v588-1");
assert(!target.includes('P5_QA_DATA'),'QA fixture leaked into native engine');
for(const [i,m] of [...target.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].entries()){
 if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:'v097-inline-'+i});
}
new vm.Script(cloud,{filename:'v097-cloud.js'});
console.log('PASS v0.9.7: isolated runtime, frozen engine, legacy UI/PWA/Cloud preserved');
