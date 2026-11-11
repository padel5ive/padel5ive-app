'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/phase58/cloud-home.js','utf8');
const start=src.indexOf(' async function connect(c,options={}){');
const end=src.indexOf(" form.addEventListener('submit'",start+10);
assert(start>=0&&end>start,'Cloud Home connect function missing');
const code=src.slice(start,end);
new vm.Script(code);
const data={version:24,_sessionId:'mod-owner-abc',session:'Cloud Match',stage:'stage1',roster:[],rounds:[]};
const kind='unified',key='local-session',metaKey='p58-cloud-link-unified',sessionId='A2B3C4';
const store=new Map();
const get=k=>store.get(k)||null;
store.set(key,data);
const token='original-moderator-private-token';
store.set(metaKey,{role:'controller',code:sessionId,token,localId:data._sessionId,revision:8});
const nav=[],queries=[],prompts=[];
const normalize=s=>String(s||'').toUpperCase().replace(/[\s-]/g,'');
const ctx={
 K:{unified:key,club:'other-key'},
 active:(s,k)=>k==='unified'&&!!s&&Array.isArray(s.roster)&&Array.isArray(s.rounds),
 identity:(s,k)=>s?._sessionId,
 get,normalize,isNew:c=>/^[A-HJ-NP-Z][2-9A-HJ-NP-Z]{5}$/.test(c),
 isLegacy:c=>/^\d{6}$/.test(c),
 location:{assign:v=>nav.push(v)},
 confirm:v=>{prompts.push(v);return true},
 submit:{disabled:false,textContent:''},status:{textContent:''},overlay:{hidden:true},
 navigator:{userAgent:'iPhone'},window:{},console,
 api:async(action,payload)=>{queries.push({action,payload});return {kind:'unified',code:payload.code,token:'new-viewer-token',revision:9,role:'viewer',data}},
 joinSafe:result=>{store.set(metaKey,{role:result.role,token:result.token});return '/modes/unified/?intent=resume'}
};
vm.createContext(ctx);vm.runInContext(code+'\nthis.connect=connect;',ctx);
async function reset(){nav.length=0;queries.length=0;prompts.length=0;}
(async()=>{
 await reset();
 await ctx.connect(sessionId,{shortToken:'example-private-short',auto:true});
 assert.deepEqual(queries,[],'Self WhatsApp short link must not join new viewer device');
 assert.equal(nav[0],'/modes/unified/?intent=resume');
 assert.equal(get(metaKey).role,'controller');assert.equal(get(metaKey).token,token);
 await reset();await ctx.connect(sessionId,{viewerKey:'long-private-viewer-key',auto:true});
 assert.equal(queries.length,0,'Self long viewer link must not overwrite moderator');
 assert.equal(get(metaKey).token,token);
 await reset();await ctx.connect(sessionId,{auto:false});
 assert.equal(queries.length,0,'Manual load of same session must not silently demote moderator');
 await reset();await ctx.connect('B2C3D4',{shortToken:'another-link',auto:true});
 assert.equal(queries.length,1,'Different session link must still join normally');
 assert.equal(queries[0].action,'join-short');
 store.set(metaKey,{role:'viewer',code:sessionId,token:'viewer-device',localId:data._sessionId});
 await reset();await ctx.connect(sessionId,{shortToken:'another-link',auto:true});
 assert.equal(queries.length,1,'Actual viewers must still join through server');
 console.log('PASS Moderator self-Link safe: short/long/manual never replace original controller token; other session and Viewer join preserved.');
})().catch(e=>{console.error(e);process.exitCode=1});
