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
assert.match(owner.code,/^[A-HJ-NP-Z][2-9A-HJ-NP-Z]{5}$/);
assert.match(owner.moderatorPin,/^\d{4}$/);
assert.equal(owner.moderatorPinDigits,4);
assert.match(owner.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);
assert.equal(owner.role,'controller');assert.equal(owner.pin,undefined);checks++;
const raw=entries.get('session/'+owner.code).data;
assert(raw.viewerKeyHash&&raw.moderatorPinHash);
assert(!JSON.stringify(raw).includes(owner.viewerKey));
assert.equal(raw.moderatorPin,undefined,'Raw private Moderator PIN never stored');
assert.equal(raw.pin,undefined,'Raw legacy Access PIN never stored');
assert(!JSON.stringify(raw).includes(owner.token));checks++;
const manual=await call('join',{code:owner.code,label:'Manual Viewer'});
assert.equal(manual.status,200);assert.equal(manual.body.role,'viewer');
assert.equal(manual.body.moderatorPin,undefined);
assert.equal(manual.body.moderatorPinDigits,4);
assert.equal(manual.body.viewerKey,undefined);
assert.deepEqual(manual.body.data,state());checks++;
const link=await call('join',{code:owner.code,viewerKey:owner.viewerKey,label:'One Tap'});
assert.equal(link.status,200);assert.equal(link.body.role,'viewer');checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:'totally-invalid-viewer-key'})).status,401);checks++;
assert.equal((await call('save',{code:owner.code,token:manual.body.token,revision:1,data:state()})).status,423);checks++;
const next={...state(),stage:'stage1'};
const scored=await call('save',{code:owner.code,token:owner.token,revision:1,data:next});
assert.equal(scored.status,200);assert.equal(scored.body.revision,2);checks++;
const wrong=owner.moderatorPin==='0000'?'0001':'0000';
for(let i=0;i<3;i++){
 const bad=await call('take-control',{code:owner.code,token:link.body.token,moderatorPin:wrong});
 assert.equal(bad.status,401);checks++;
}
assert.equal((await call('take-control',{code:owner.code,token:link.body.token,moderatorPin:owner.moderatorPin})).status,429);checks++;
// Separate legitimate viewer remains able to take control, without active-device approval.
const transfer=await call('take-control',{code:owner.code,token:manual.body.token,moderatorPin:owner.moderatorPin});
assert.equal(transfer.status,200);assert.equal(transfer.body.role,'controller');
assert.equal(transfer.body.transferred,true);assert.deepEqual(transfer.body.data,next);checks++;
assert.equal((await call('save',{code:owner.code,token:owner.token,revision:2,data:next})).status,423);checks++;
assert.match(transfer.body.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);
assert.notEqual(transfer.body.viewerKey,owner.viewerKey,'New moderator gets a fresh share link');
assert.equal(transfer.body.moderatorPin,undefined,'Server never returns the private PIN');checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:owner.viewerKey})).status,200,'Existing WhatsApp links survive transfer');checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:transfer.body.viewerKey})).status,200,'New moderator can share a one-tap link');checks++;
assert.equal((await call('recover-access',{code:owner.code,token:owner.token,moderatorPin:owner.moderatorPin})).status,423,'Former controller cannot recover details');checks++;
assert.equal((await call('recover-access',{code:owner.code,token:link.body.token,moderatorPin:owner.moderatorPin})).status,423,'View-only device cannot recover details');checks++;
assert.equal((await call('recover-access',{code:owner.code,token:manual.body.token,moderatorPin:wrong})).status,401,'Current controller must provide correct PIN');checks++;
const restored=await call('recover-access',{code:owner.code,token:manual.body.token,moderatorPin:owner.moderatorPin});
assert.equal(restored.status,200);assert.match(restored.body.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:restored.body.viewerKey})).status,200,'Recovered link opens viewer');checks++;

const other=await call('join',{code:owner.code,label:'Second Moderator'});
assert.equal(other.status,200);checks++;
assert.equal((await call('take-control',{code:owner.code,token:other.body.token})).status,401);checks++;
const transferred=await call('take-control',{code:owner.code,token:other.body.token,moderatorPin:owner.moderatorPin});
assert.equal(transferred.status,200);assert.equal(transferred.body.role,'controller');checks++;
assert.match(transferred.body.viewerKey,/^[A-Za-z0-9_-]{40,90}$/,'Every next moderator receives fresh viewer access');checks++;
assert.equal((await call('join',{code:owner.code,viewerKey:transferred.body.viewerKey})).status,200,'Third moderator share link works');checks++;

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
// Existing ten-character cloud sessions retain their original six-digit
// moderator PIN, independent of the new creation format.
const originalCode='7AMR9QKT3Y',originalPin='583021';
const oldSalt=randomBytes(16).toString('hex'),oldToken=randomBytes(32).toString('base64url');
const oldViewerKey=randomBytes(32).toString('base64url');
entries.set('session/'+originalCode,{etag:'"old-modern"',data:{
 v:58,code:originalCode,kind:'unified',summary:{session:'Earlier cloud session'},
 data:state(),revision:1,updatedAt:clock,salt:oldSalt,
 viewerKeyHash:hash(oldViewerKey),moderatorPinHash:scryptSync(originalPin,oldSalt,32).toString('hex'),
 failures:{count:0,until:0},
 devices:[{id:'old-moderator',hash:hash(oldToken),label:'Old controller'}],
 controller:{id:'old-moderator',expires:clock+90_000},request:null
}});
const oldViewer=await call('join',{code:originalCode});
assert.equal(oldViewer.status,200);assert.equal(oldViewer.body.moderatorPinDigits,6);checks++;
assert.equal((await call('take-control',{code:originalCode,token:oldViewer.body.token,moderatorPin:'0123'})).status,401);checks++;
const oldTransfer=await call('take-control',{code:originalCode,token:oldViewer.body.token,moderatorPin:originalPin});
assert.equal(oldTransfer.status,200);assert.equal(oldTransfer.body.role,'controller');checks++;
assert.equal((await call('join',{code:originalCode,viewerKey:oldViewerKey})).status,200);checks++;

// Short PIN security: both device and global throttles apply.
const shortMade=(await call('create',{kind:'unified',data:state()})).body;
const viewers=[];
for(let i=0;i<3;i++){
 const v=await call('join',{code:shortMade.code,label:'Lockout '+i});
 assert.equal(v.status,200);viewers.push(v.body.token);checks++;
}
const invalid=shortMade.moderatorPin==='0000'?'0001':'0000';
for(let i=0;i<3;i++){
 assert.equal((await call('take-control',{code:shortMade.code,token:viewers[0],moderatorPin:invalid})).status,401);checks++;
}
assert.equal((await call('take-control',{code:shortMade.code,token:viewers[0],moderatorPin:shortMade.moderatorPin})).status,429);checks++;
for(let i=0;i<2;i++){
 assert.equal((await call('take-control',{code:shortMade.code,token:viewers[1],moderatorPin:invalid})).status,401);checks++;
}
assert.equal((await call('take-control',{code:shortMade.code,token:viewers[2],moderatorPin:shortMade.moderatorPin})).status,429,'Global PIN attempt lockout');checks++;
clock+=30*60_000+1;
const afterExpiry=await call('take-control',{code:shortMade.code,token:viewers[2],moderatorPin:shortMade.moderatorPin});
assert.equal(afterExpiry.status,200);assert.equal(afterExpiry.body.role,'controller');checks++;

console.log('PASS Cloud Session',checks,'checks: short code/PIN, rate limits, old 10/6 and legacy numeric access.');
