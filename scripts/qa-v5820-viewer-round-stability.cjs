/* PADEL 5IVE v5.8.20 · read-only round navigation MUST NOT reload.
 * Only a changed authoritative Cloud revision should call applyRemote.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/phase58/cloud-dashboard.js','utf8');
const viewer=fs.readFileSync('public/phase5814/view-only-v5814.js','utf8');
const pages=['public/modes/unified/index.html','public/modes/club-match/index.html'];
new vm.Script(source,{filename:'cloud-dashboard.js'});
new vm.Script(viewer,{filename:'view-only-v5814.js'});
const a=source.indexOf(' setFollowLive:(enabled)=>{');
const b=source.indexOf(' leaveViewer:()=>{',a);
assert(a>=0&&b>a,'Follow Live action must exist');
const method=source.slice(a,b).trim().replace(/,\s*$/,'');
let saves=[],reloads=0,writes=0;
let isViewer=true;
const ctx={
 view:()=>isViewer,
 setFollowingLive:(value)=>saves.push(value),
 kind:'unified',
 get:()=>{throw Error('Round browsing must not fetch authoritative score state')},
 set:()=>{writes++;throw Error('Round browsing must not replace local tournament state')},
 location:{reload:()=>{reloads++}}
};
vm.runInNewContext('this.follow=({'+method+'}).setFollowLive;',ctx);
assert.equal(ctx.follow(false),true,'Browsing an older round pauses Live Follow');
assert.equal(ctx.follow(true),true,'Returning to latest round resumes Live Follow');
assert.equal(ctx.follow(true),true,'Already following latest should remain enabled');
assert.deepEqual(saves,[false,true,true]);
assert.equal(reloads,0,'Repeated viewer navigation must NEVER reload the page');
assert.equal(writes,0,'Viewer navigation must not rewrite local tournament data');
isViewer=false;
assert.equal(ctx.follow(false),false,'Controller has no viewer-only Follow Live state');
assert.equal(saves.length,3,'Controller cannot accidentally pause viewer mode');
assert(viewer.includes("cloud?.setFollowLive?.(latest===selected)"),
 'Unified round navigation still sets follow preference based on selected round');
assert(viewer.includes("cloud?.setFollowLive?.(false);schedule();"),
 'Club history navigation still pauses follow preference');
assert(viewer.includes("cloud?.setFollowLive?.(true);schedule();"),
 'Club latest-round navigation still resumes follow preference');
// Polls unchanged revision every 5.5 seconds without refreshing the UI.
// A changed Cloud revision still calls applyRemote to refresh confirmed scores.
const start=source.indexOf('async function refresh(){');
const end=source.indexOf('async function push(){',start);
assert(start>=0&&end>start,'Native Cloud polling adapter preserved');
const refreshCode=source.slice(start,end);
let revision=7,applyCount=0,markCount=0;
const pollCtx={
 meta:{role:'viewer',revision:7,code:'ABC',token:'T',waiting:false,takeoverRequested:false},
 busy:false,conflict:false,offline:false,dialog:{hidden:true},
 api:async()=>({
  role:'viewer',revision,summary:{session:'Test'},
  controllerOnline:true,pendingControl:false,takeoverRequested:false,
  moderatorPinRequired:true,
  ...(revision===7?{}:{data:{stage:'stage1',rounds:[]}})
 }),
 dirty:()=>false,
 applyRemote:()=>{applyCount++},
 persist:()=>{},
 mark:()=>{markCount++},
 render:()=>{},
 push:()=>{throw Error('Viewer must never push scores')},
 role:()=> 'viewer'
};
vm.runInNewContext(refreshCode+'\nthis.poll=refresh;',pollCtx);
(async()=>{
 for(let n=0;n<6;n++)await pollCtx.poll();
 assert.equal(applyCount,0,'Unchanged Cloud revision must not reapply or reload score data');
 assert.equal(pollCtx.meta.revision,7);
 revision=8;
 await pollCtx.poll();
 assert.equal(applyCount,1,'Actual changed revision should apply the authoritative snapshot');
 assert.equal(pollCtx.meta.revision,7,'Revision is only advanced by applyRemote');
 const pageContent=pages.map(p=>fs.readFileSync(p,'utf8'));
 for(const [index,html] of pageContent.entries()){
  assert(html.includes('cloud-dashboard.js?v=5820.2'),
   pages[index]+': browser must load fresh Cloud adapter');
  assert(html.includes('view-only-v5814.js?v=5820.2'),
   pages[index]+': browser must load fresh viewer adapter');
  assert.equal(html.split('cloud-dashboard.js?v=').length-1,1,'No duplicate Cloud JS');
 }
 assert(source.includes('location.reload();'),'Only real score/state changes may rehydrate native engine');
 console.log('PASS v5.8.20 Viewer round browsing: no reload, cloud unchanged no reapply, new revision applies, both modes updated.');
})().catch(err=>{console.error(err);process.exitCode=1;});
