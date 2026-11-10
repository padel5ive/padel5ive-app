/* PADEL 5IVE Cloud Session API — legacy and v5.8.14 security regression.
 * In-memory compare-and-swap store: never contacts production.
 */
import assert from 'node:assert/strict';
import { randomBytes, createHash, scryptSync } from 'node:crypto';
import { makeCloudHandler } from '../netlify/functions/cloud-session.mjs';
let clock=1_793_900_000_000,seq=1,checks=0;
const entries=new Map(),clone=x=>JSON.parse(JSON.stringify(x));
const store={
 async getWithMetadata(key){const r=entries.get(key);return r?{data:clone(r.data),etag:r.etag}:null;},
 async setJSON(key,data,opts={}){
  const p=entries.get(key);
  if((opts.onlyIfNew&&p)||(opts.onlyIfMatch&&(!p||p.etag!==opts.onlyIfMatch)))return {modified:false};
  const etag='"'+(++seq)+'"';entries.set(key,{data:clone(data),etag});
  return {modified:true,etag};
 }
};
const handler=makeCloudHandler({storeFactory:()=>store,clock:()=>clock});
async function call(action,values={}){
 const response=await handler(new Request('https://deploy-preview-17--padel5ive.netlify.app/api/cloud-session',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({action,...values})
 }));
 return {status:response.status,body:await response.json()};
}
const state=()=>({
 version:24,_sessionId:'p58-test-1',stage:'registration',mode:'fp-americano',
 session:'Tuesday Game',date:'2026-11-10',time:'19:00',courts:2,
 roster:[{id:1,names:['A','B']},{id:2,names:['C','D']}],rounds:[]
});
const made=await call('create',{kind:'unified',data:state()});
assert.equal(made.status,201);checks++;
const owner=made.body;
assert.match(owner.code,/^[2-9A-HJ-NP-Z]{10}$/);
assert.match(owner.moderatorPin,/^\d{6}$/);
assert.match(owner.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);
assert.equal(owner.role,'controller');assert.equal(owner.pin,undefined);checks++;
const raw=entries.get('session/'+owner.code).data;
assert(raw.viewerKeyHash&&raw.moderatorPinHash);
assert(!JSON.stringify(raw).includes(owner.viewerKey));
assert(!JSON.stringify(raw).includes(owner.moderatorPin));
assert(!JSON.stringify(raw).includes(owner.token));checks++;
const manual=await call('join',{code:owner.code,label:'Manual Viewer'});
assert.equal(manual.status,200);assert.equal(manual.body.role,'viewer');
assert.equal(manual.body.moderatorPin,undefined);
assert.equal(manual.body.viewerKey,undefined);
assert.deepEqual(manual.body.data,state());checks++;
const link=await call('join',{code:owner.code,viewerKey:owner.viewerKey,label:'One Tap'});
assert.equal(link.status,200);assert.equal(link.body.role,'viewer');checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:'totally-invalid-viewer-key'})).status,401);checks++;
assert.equal((await call('save',{code:owner.code,token:manual.body.token,revision:1,data:state()})).status,423);checks++;
const next={...state(),stage:'stage1'};
const scored=await call('save',{code:owner.code,token:owner.token,revision:1,data:next});
assert.equal(scored.status,200);assert.equal(scored.body.revision,2);checks++;
const wrong=owner.moderatorPin==='000000'?'000001':'000000';
for(let i=0;i<5;i++){
 const bad=await call('take-control',{code:owner.code,token:link.body.token,moderatorPin:wrong});
 assert.equal(bad.status,401);checks++;
}
assert.equal((await call('take-control',{code:owner.code,token:link.body.token,moderatorPin:owner.moderatorPin})).status,429);checks++;
// Separate legitimate viewer remains able to take control, without active-device approval.
const transfer=await call('take-control',{code:owner.code,token:manual.body.token,moderatorPin:owner.moderatorPin});
assert.equal(transfer.status,200);assert.equal(transfer.body.role,'controller');
assert.equal(transfer.body.transferred,true);assert.deepEqual(transfer.body.data,next);checks++;
assert.equal((await call('save',{code:owner.code,token:owner.token,revision:2,data:next})).status,423);checks++;
const other=await call('join',{code:owner.code,label:'Second Moderator'});
assert.equal(other.status,200);checks++;
assert.equal((await call('take-control',{code:owner.code,token:other.body.token})).status,401);checks++;
const transferred=await call('take-control',{code:owner.code,token:other.body.token,moderatorPin:owner.moderatorPin});
assert.equal(transferred.status,200);assert.equal(transferred.body.role,'controller');checks++;
assert.equal((await call('save',{code:owner.code,token:manual.body.token,revision:2,data:next})).status,423);checks++;
const s1=call('save',{code:owner.code,token:other.body.token,revision:2,data:{...next,stage:'ko'}});
const s2=call('save',{code:owner.code,token:other.body.token,revision:2,data:{...next,stage:'champion'}});
const raced=await Promise.all([s1,s2]);assert.deepEqual(raced.map(x=>x.status).sort(),[200,409]);checks++;
assert.equal((await call('sync',{code:owner.code,token:manual.body.token,force:true})).body.role,'viewer');checks++;
// Legacy six-digit sessions still require their original four-digit Access PIN.
const hash=x=>createHash('sha256').update(x).digest('hex');
const salt=randomBytes(16).toString('hex'),token=randomBytes(32).toString('base64url');
const legacyPin='0246',legacyCode='123456';
entries.set('session/'+legacyCode,{etag:'"legacy"',data:{
 v:58,code:legacyCode,kind:'unified',summary:{session:'Legacy'},
 data:state(),revision:1,updatedAt:clock,
 salt,pinHash:scryptSync(legacyPin,salt,32).toString('hex'),
 failures:{count:0,until:0},devices:[{id:'legacy-owner',hash:hash(token),label:'Original'}],
 controller:{id:'legacy-owner',expires:clock+90_000},request:null
}});
assert.equal((await call('join',{code:legacyCode})).status,401);checks++;
assert.equal((await call('join',{code:legacyCode,pin:'0000'})).status,401);checks++;
const legacyJoin=await call('join',{code:legacyCode,pin:legacyPin});
assert.equal(legacyJoin.status,200);assert.equal(legacyJoin.body.moderatorPinRequired,false);checks++;
const oldRequest=await call('take-control',{code:legacyCode,token:legacyJoin.body.token});
assert.equal(oldRequest.status,202);assert.equal(oldRequest.body.waiting,true);checks++;
const approved=await call('approve-control',{code:legacyCode,token});
assert.equal(approved.status,200);assert.equal(approved.body.role,'viewer');checks++;
assert.equal((await call('save',{code:legacyCode,token,revision:1,data:state()})).status,423);checks++;
assert.equal((await call('join',{code:'123'})).status,400);checks++;
assert.equal((await call('create',{kind:'unified',data:{...state(),stage:'setup'}})).status,422);checks++;
console.log('PASS Cloud Session',checks,'checks: token viewer, manual viewer, PIN takeover, single writer, legacy compatibility.');
