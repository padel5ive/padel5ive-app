/* PADEL 5IVE v5.8 Cloud Session backend contract tests.
 * Real handler, mock atomic key store; no preview can touch production Netlify Blobs.
 */
import assert from 'node:assert/strict';
import { makeCloudHandler } from '../netlify/functions/cloud-session.mjs';
let now=1_793_900_000_000,serial=1;
const entries=new Map();
const clone=x=>JSON.parse(JSON.stringify(x));
const store={
 async getWithMetadata(key){
  const r=entries.get(key);return r?{data:clone(r.data),etag:r.etag,metadata:{}}:null;
 },
 async setJSON(key,data,opts={}){
  const prev=entries.get(key);
  if(opts.onlyIfNew&&prev)return {modified:false};
  if(opts.onlyIfMatch&&(!prev||prev.etag!==opts.onlyIfMatch))return {modified:false};
  const etag='"'+(++serial)+'"';
  entries.set(key,{etag,data:clone(data)});
  return {modified:true,etag};
 }
};
const handler=makeCloudHandler({storeFactory:()=>store,clock:()=>now});
let checks=0;
async function call(action,values={},method='POST'){
 const r=await handler(new Request('https://deploy-preview-58--padel5ive.netlify.app/api/cloud-session',{
  method,headers:{'content-type':'application/json'},
  body:JSON.stringify({action,...values})
 }));
 const body=await r.json();return {status:r.status,body};
}
const valid=()=>({version:24,_sessionId:'abc-session-001',stage:'registration',
 mode:'fp-americano',session:'Friday Signature',date:'2026-11-13',time:'19:00',
 courts:5,roster:[{id:1,names:['A','B']},{id:2,names:['C','D']}],rounds:[]});
const good=async()=>{const r=await call('create',{kind:'unified',data:valid()});assert.equal(r.status,201);checks++;return r.body};
let owner=await good();
assert.match(owner.code,/^\d{6}$/);assert.match(owner.pin,/^\d{4}$/);assert.ok(owner.token.length>=40);checks++;
const raw=entries.get('session/'+owner.code).data;
assert.equal(raw.devices.length,1);assert.ok(raw.pinHash&&!JSON.stringify(raw).includes(owner.pin));assert.ok(!JSON.stringify(raw).includes(owner.token));checks++;
for(let i=0;i<5;i++){const r=await call('join',{code:owner.code,pin:'bad'});assert.equal(r.status,401);checks++}
assert.equal((await call('join',{code:owner.code,pin:owner.pin})).status,429);checks++;
now+=15*60_000+1;
const joined=await call('join',{code:owner.code,pin:owner.pin,label:'iPad'});assert.equal(joined.status,200);
const ipad=joined.body;assert.equal(ipad.role,'viewer');assert.deepEqual(ipad.data,valid());checks++;
const deny=await call('save',{code:owner.code,token:ipad.token,revision:1,data:valid()});assert.equal(deny.status,423);checks++;
const next={...valid(),stage:'stage1'};
const save=await call('save',{code:owner.code,token:owner.token,revision:1,data:next});assert.equal(save.status,200);assert.equal(save.body.revision,2);checks++;
assert.equal((await call('save',{code:owner.code,token:owner.token,revision:1,data:next})).status,409);checks++;
const old=await call('sync',{code:owner.code,token:ipad.token,afterRevision:1});
assert.equal(old.status,200);assert.deepEqual(old.body.data,next);assert.equal(old.body.revision,2);checks++;
const req=await call('take-control',{code:owner.code,token:ipad.token});assert.equal(req.status,202);assert.equal(req.body.waiting,true);checks++;
const approval=await call('approve-control',{code:owner.code,token:owner.token});
assert.equal(approval.status,200);assert.equal(approval.body.role,'viewer');checks++;
assert.equal((await call('save',{code:owner.code,token:owner.token,revision:2,data:next})).status,423);checks++;
assert.equal((await call('save',{code:owner.code,token:ipad.token,revision:2,data:{...next,stage:'ko'}})).status,200);checks++;
// Invalid upload cannot mutate good data.
assert.equal((await call('save',{code:owner.code,token:ipad.token,revision:3,data:{stage:'ko'}})).status,422);checks++;
const again=await call('join',{code:owner.code,pin:owner.pin,label:'Android'});
assert.equal(again.status,200);const android=again.body;checks++;
const waiting=await call('take-control',{code:owner.code,token:android.token});assert.equal(waiting.status,202);checks++;
// After owner lease expires, verified device can take over without another PIN.
now+=91_000;
const transfer=await call('take-control',{code:owner.code,token:android.token});assert.equal(transfer.status,200);assert.equal(transfer.body.role,'controller');checks++;
const snapshot=await call('sync',{code:owner.code,token:android.token,force:true});
assert.equal(snapshot.status,200);assert.equal(snapshot.body.data.stage,'ko');checks++;
// CAS rejects two writes that started at the same version.
const c1=call('save',{code:owner.code,token:android.token,revision:4,data:{...valid(),stage:'stage1'}});
const c2=call('save',{code:owner.code,token:android.token,revision:4,data:{...valid(),stage:'champion'}});
const both=await Promise.all([c1,c2]);assert.deepEqual(both.map(x=>x.status).sort(),[200,409]);checks++;
assert.equal((await call('sync',{code:owner.code,token:'nonsense',force:true})).status,401);checks++;
assert.equal((await call('join',{code:'123',pin:'0000'})).status,400);checks++;
assert.equal((await call('create',{kind:'unified',data:{...valid(),stage:'setup'}})).status,422);checks++;
const req3=await call('take-control',{code:owner.code,token:owner.token});
assert.equal(req3.status,202);checks++;
const rel=await call('release-control',{code:owner.code,token:android.token});
assert.equal(rel.status,200);assert.equal(rel.body.role,'viewer');checks++;
const passed=await call('sync',{code:owner.code,token:owner.token,afterRevision:5});
assert.equal(passed.status,200);assert.equal(passed.body.role,'controller');checks++;
console.log('PASS: PADEL 5IVE Cloud Session API',checks,'checks; no credentials in persistent raw JSON; no stale overwrites.');
