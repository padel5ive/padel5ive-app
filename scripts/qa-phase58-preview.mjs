/* PADEL 5IVE v5.8 - real Netlify Deploy Preview smoke (never production).
 * Uses a disposable fake session in the preview-isolated Blobs namespace.
 */
import assert from 'node:assert/strict';
const base=(process.env.P5_PREVIEW_BASE||'https://deploy-preview-5--padel5ive.netlify.app').replace(/\/$/,'');
assert.match(new URL(base).hostname,/^deploy-preview-\d+--padel5ive\.netlify\.app$/,'Never run the smoke test against production');
let tries=0;
async function readPage(path,needle){
 let error;
 for(let i=0;i<9;i++){
  try{
   const r=await fetch(base+path,{redirect:'follow',signal:AbortSignal.timeout(15_000),cache:'no-store'});
   if(!r.ok)throw Error('Unexpected HTTP '+r.status+' for '+path);
   const src=await r.text();
   if(!src.includes(needle))throw Error('Preview not updated for '+path);
   return src;
  }catch(e){error=e;await new Promise(resolve=>setTimeout(resolve,2500));}
 }
 throw error;
}
await readPage('/','/phase58/cloud-home.js');
await readPage('/phase58/cloud-dashboard.js','TAKE CONTROL');
await readPage('/modes/unified/','/phase58/cloud-dashboard.js');
await readPage('/modes/club-match/','/phase58/cloud-dashboard.js');
let passed=4;
const api=async(action,params={})=>{
 const r=await fetch(base+'/api/cloud-session',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action,...params}),signal:AbortSignal.timeout(15_000),cache:'no-store'});
 const text=await r.text();
 let payload;try{payload=JSON.parse(text)}catch{throw Error('Function returned non-JSON ('+r.status+'): '+text.slice(0,100));}
 return {status:r.status,...payload};
};
const sample={version:24,stage:'registration',session:'QA Cloud Session '+Date.now(),
 _sessionId:'qa-'+Date.now(),date:'2026-11-13',time:'19:00',mode:'fp-americano',courts:2,
 roster:[{id:'a',names:['QA A','QA B']},{id:'b',names:['QA C','QA D']}],rounds:[]};
const create=await api('create',{kind:'unified',data:sample,label:'QA disposable iPhone'});
assert.equal(create.status,201,'Netlify create endpoint');
assert.match(create.code,/^\d{6}$/);assert.match(create.pin,/^\d{4}$/);
assert.ok(create.token?.length>=40);passed++;
const join=await api('join',{code:create.code,pin:create.pin,label:'QA disposable iPad'});
assert.equal(join.status,200,'Netlify join endpoint');assert.equal(join.role,'viewer');passed++;
const blocked=await api('save',{code:create.code,token:join.token,revision:1,data:sample});
assert.equal(blocked.status,423,'Read-only device may not edit');passed++;
const scored={...sample,stage:'stage1'};
const save=await api('save',{code:create.code,token:create.token,revision:1,data:scored});
assert.equal(save.status,200,'Controller score save succeeds');assert.equal(save.revision,2);passed++;
const stale=await api('save',{code:create.code,token:create.token,revision:1,data:sample});
assert.equal(stale.status,409,'Stale revision denied');passed++;
const poll=await api('sync',{code:create.code,token:join.token,afterRevision:1});
assert.equal(poll.status,200);assert.equal(poll.revision,2);assert.deepEqual(poll.data,scored);passed++;
const wait=await api('take-control',{code:create.code,token:join.token});
assert.equal(wait.status,202);assert.equal(wait.waiting,true);passed++;
const approve=await api('approve-control',{code:create.code,token:create.token});
assert.equal(approve.status,200);assert.equal(approve.role,'viewer');passed++;
const second=await api('save',{code:create.code,token:join.token,revision:2,data:{...scored,stage:'ko'}});
assert.equal(second.status,200);passed++;
const earlier=await api('save',{code:create.code,token:create.token,revision:3,data:sample});
assert.equal(earlier.status,423);passed++;
console.log('PASS real Netlify Deploy Preview cloud smoke:',passed,'checks across HTML + authenticated Netlify Blobs endpoints.');
