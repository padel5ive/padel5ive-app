/* PADEL 5IVE v5.8.20.2: spectator diagnostics hidden without losing
 * moderator operational notices or unrelated schedule warnings.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const src=fs.readFileSync('public/phase5814/view-only-v5814.js','utf8');
const doc=new JSDOM(`<!doctype html><html><body class="p58-view-only">
 <main id="americano">
  <p class="p5-b2-fairness-ok" id="advanced">ADVANCED PLAYER RULES · Locked partners remain together. Active coaches scheduled every round.</p>
  <div class="p5-b2-fairness-warning" id="fairness">SCHEDULING FAIRNESS REVIEW · 7 previous opponent encounters.</div>
  <div class="p5-b2-fairness-ok" id="other">FAIRNESS CHECK · No consecutive rest</div>
  <div class="p5-b2-fairness-warning" id="other-warning">OTHER WARNING · Review players</div>
 </main></body></html>`).window.document;
const original=doc.querySelector('#advanced');
original.style.setProperty('display','flex');
const helperStart=src.indexOf('function hideControl(el){');
const helperEnd=src.indexOf('function replaceText(el,text){',helperStart);
const hideStart=src.indexOf('function hideViewerDiagnostics(){');
const hideEnd=src.indexOf('function restore(){',hideStart);
assert(helperStart>=0&&helperEnd>helperStart&&hideStart>=0&&hideEnd>hideStart,'Viewer notice helpers exist');
const sandbox={document:doc,Map,Array,console};
vm.runInNewContext(`const hiddenInline=new Map();const $$=(q)=>Array.from(document.querySelectorAll(q));
`+src.slice(helperStart,helperEnd)+src.slice(hideStart,hideEnd)+
`this.hideViewerDiagnostics=hideViewerDiagnostics;this.showAllControls=showAllControls;`,sandbox);
sandbox.hideViewerDiagnostics();
for(const id of ['advanced','fairness']){
 const el=doc.getElementById(id);
 assert.equal(el.style.getPropertyValue('display'),'none',id+' hidden for View Only');
 assert.equal(el.style.getPropertyPriority('display'),'important');
 assert(el.classList.contains('p5814-hide-action'));
}
for(const id of ['other','other-warning']){
 assert.notEqual(doc.getElementById(id).style.display,'none',id+' remains visible');
}
sandbox.hideViewerDiagnostics();
sandbox.showAllControls();
assert.equal(original.style.display,'flex','Moderator original display restored');
assert(!original.classList.contains('p5814-hide-action'),'Moderator notice visible again');
assert.notEqual(doc.querySelector('#fairness').style.display,'none','Moderator fairness warning visible again');
assert(src.includes('promoteCloud();menuView();scoreViewer();viewerSessionSummary();hideViewerDiagnostics();actions();'),
 'Viewer run pass must reapply hiding after master round changes');
assert(src.includes('showAllControls();'), 'Role restoration flow retained');
for(const path of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const html=fs.readFileSync(path,'utf8');
 assert(html.includes('view-only-v5814.js?v=5830.1'),'iOS fresh Viewer asset after fix');
 assert(html.includes('cloud-dashboard.js?v=5829.1'),'iOS fresh Cloud asset after fix');
}
console.log('PASS v5.8.20.2: Advanced Player Rules / Scheduling Fairness Review are View Only hidden, restored for moderator, unrelated warnings intact.');
