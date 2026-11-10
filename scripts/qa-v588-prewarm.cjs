/* PADEL 5IVE v5.8.8 — safe Initial Setup prewarm + PWA regression. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const home=read('public/index.html'),sw=read('public/sw.js'),client=read('public/phase588/setup-prewarm-v588.js');
const uni=read('public/modes/unified/index.html'),club=read('public/modes/club-match/index.html');
const manifest=JSON.parse(read('public/manifest.webmanifest'));
new vm.Script(client,{filename:'setup-prewarm-v588.js'});new vm.Script(sw,{filename:'sw.js'});
assert.equal(manifest.display,'standalone');
assert(home.includes('<script defer src="/phase588/setup-prewarm-v588.js"></script>'));
assert(home.includes('setTimeout(()=>location.assign(url.href),64);'));
assert(!home.includes('setTimeout(()=>location.assign(url.href),230);'));
assert(client.includes("event.target.closest?.('.p54-mode[data-mode]:not(:disabled)')"));
assert(client.includes("navigator.serviceWorker.addEventListener('controllerchange'"));
assert(client.includes("type:'P5_PREWARM_SETUP'"));
assert(!client.includes('localStorage')&&!client.includes('sessionStorage')&&!client.includes('location.assign'),'Client stays read-only');
assert(uni.includes('P5PublicResults')&&uni.includes('function reg(s)'));
assert(club.includes('TEAM SHOWDOWN')||club.includes('Team Showdown'));
for(const term of ["const CACHE_PAGES","event.data.type === 'P5_APPLY_UPDATE'","P5_PREWARM_SETUP","DENY_PREFIXES","networkFirst(req, path, CACHE_PAGES, true)"])assert(sw.includes(term),term);
assert(sw.includes("if(url.searchParams.get('intent')==='new'"),'Only NEW sessions get warmed response');
assert(!sw.includes("event.data.type === 'P5_APPLY_UPDATE') self.skipWaiting();\n});"),'Both SW messages registered');
const incoming=[],cacheStore=new Map(),listeners={};
let now=Date.now(),calls=0;
const fakeResponse=(label='ok')=>({
 ok:true,type:'basic',headers:{get:()=>''},label,
 clone(){return fakeResponse(label);}
});
class Request{
 constructor(path,opts={}){this.url=new URL(path,'https://padel5ive.netlify.app').href;this.method=opts.method||'GET';this.mode=opts.mode||'cors';this.headers={has:()=>false};this.credentials=opts.credentials;this.cache=opts.cache;}
}
const ctx={
 self:{location:{origin:'https://padel5ive.netlify.app'},clients:{claim:()=>Promise.resolve()},skipWaiting(){},addEventListener(name,callback){listeners[name]=callback;}},
 Date,setTimeout,clearTimeout,Promise,Request,URL,
 fetch:async request=>{calls++;const u=new URL(request.url);incoming.push(u.pathname+(u.search||''));return fakeResponse('fetch#'+calls)},
 caches:{open:async()=>({put:async(k,r)=>{cacheStore.set(k,r)},match:async k=>cacheStore.get(k)||undefined}),match:async k=>cacheStore.get(k)||undefined,keys:async()=>[]},
};
vm.runInNewContext(sw,ctx,{filename:'sw.js'});
async function post(mode){
 let task;
 listeners.message({data:{type:'P5_PREWARM_SETUP',mode},waitUntil(p){task=p}});
 assert(task,'Warm SW event registered');
 return await task;
}
async function nav(url){
 let promise;
 listeners.fetch({request:{url:'https://padel5ive.netlify.app'+url,method:'GET',mode:'navigate',headers:{has:()=>false}},respondWith(p){promise=Promise.resolve(p)}});
 assert(promise,'Navigation should have a SW response');
 return await promise;
}
(async()=>{
  assert.equal(await post('unified'),true);
  assert.equal(calls,1,'Exactly one warm fetch for unified');
  assert.equal(cacheStore.has('/modes/unified/'),true,'Fresh document stored in cache');
  assert.equal((await nav('/modes/unified/?intent=new&mode=Americano&pairing=fixed')).label,'fetch#1');
  assert.equal(calls,1,'New setup shares warmed response with zero extra downloads');
  assert.equal((await nav('/modes/unified/?intent=resume')).label,'fetch#2');
  assert.equal(calls,2,'Resume always uses original network-first route');
  await post('invalid');
  assert.equal(calls,2,'Unknown or untrusted mode cannot trigger fetch');
  assert.equal(await post('club'),true);
  assert.equal(calls,3);
  assert.equal((await nav('/modes/club-match/?intent=new')).label,'fetch#3');
  assert.equal(calls,3,'Club Setup shares warmed response');
  assert.equal((await nav('/modes/club-match/?intent=archive&id=saved')).label,'fetch#4');
  assert.equal(calls,4,'Archive stays network-first');
  assert.equal((await nav('/modes/unified/?intent=new')).label,'fetch#5');
  assert.equal(calls,5,'No old prewarm after consume');
  let accepted;
  listeners.message({data:{type:'P5_APPLY_UPDATE'},waitUntil(p){accepted=p}});
  // skipWaiting exists and original update command stays accepted.
  assert.equal(accepted,undefined);
  const tracked=['public/index.html','public/sw.js'];
  const hash=()=>tracked.map(p=>crypto.createHash('sha256').update(read(p)).digest('hex'));
  const prior=hash();
  require('./phase588-integrate.cjs');
  assert.deepEqual(hash(),prior,'Repeat builds must be byte-for-byte idempotent');
  console.log('PASS v5.8.8 — warmed navigation, resume/archive network-first, cache, mode restriction, no roster writes, build idempotency.');
})().catch(e=>{console.error(e);process.exitCode=1;});
