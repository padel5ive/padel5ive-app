import assert from 'node:assert/strict';
import {makeCloudHandler} from '../netlify/functions/cloud-session.mjs';
let clock=1_795_000_000_000,seq=0;
const entries=new Map(),clone=x=>JSON.parse(JSON.stringify(x));
const store={
 async getWithMetadata(key){const x=entries.get(key);return x?{data:clone(x.data),etag:x.etag}:null},
 async setJSON(key,data,o={}){const old=entries.get(key);
  if(o.onlyIfNew&&old||o.onlyIfMatch&&(!old||o.onlyIfMatch!==old.etag))return {modified:false};
  const etag='"'+(++seq)+'"';entries.set(key,{data:clone(data),etag});return {modified:true,etag};
 }
};
const handler=makeCloudHandler({storeFactory:()=>store,clock:()=>clock});
async function call(action,values={}){
 const response=await handler(new Request('https://padel5ive.netlify.app/api/cloud-session',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...values})
 }));
 return {status:response.status,body:await response.json()};
}
const state={version:24,_sessionId:'p5-permanent-moderator-test',stage:'stage1',
 mode:'fp-americano',session:'Persistent Moderator QA',date:'2026-11-11',courts:2,
 roster:[{id:1,names:['Andry','Teo']},{id:2,names:['Diki','Willy']}],
 rounds:[{index:0,matches:[{id:'R0C0',teams:[[1],[2]],court:1,confirmed:true,score:[3,2]}]}]};
const created=await call('create',{kind:'unified',data:state});
assert.equal(created.status,201);
const owner=created.body,auth={code:owner.code,token:owner.token};
assert.equal(owner.role,'controller');
assert.equal((await call('release-control',auth)).status,409,'PIN Moderator cannot release without a verified transfer');
assert.equal((await call('approve-control',auth)).status,409,'PIN Moderator cannot approve an unverified transfer');
assert.match(owner.moderatorPin,/^\d{4}$/);
// WhatsApp background suspends all JavaScript timers: no heartbeat for >5 minutes.
clock+=5*60_000;
let sync=await call('sync',{...auth,afterRevision:owner.revision});
assert.equal(sync.status,200);
assert.equal(sync.body.role,'controller','Moderator ownership cannot expire while in WhatsApp');
assert.equal(sync.body.controllerOnline,false,'Heartbeat lease only describes online presence');
assert.equal(sync.body.revision,owner.revision);
const short=await call('share-short',auth);
assert.equal(short.status,200,'Moderator can still share after long background idle');
assert.equal(short.body.role,'controller');
const viewer=await call('join-short',{code:owner.code,shortToken:short.body.shortToken,label:'WhatsApp viewer'});
assert.equal(viewer.status,200);assert.equal(viewer.body.role,'viewer');
const vAuth={code:owner.code,token:viewer.body.token};
for(const [action,values] of [
 ['save',{...vAuth,revision:owner.revision,data:state}],
 ['heartbeat',vAuth],['share-short',vAuth]
]){
 const attempt=await call(action,values);
 assert.equal(attempt.status,423,action+' must remain moderator-only');
}
// No PIN entry: viewer cannot usurp owner, even after a full offline period.
clock+=15*60_000;
sync=await call('sync',{...vAuth,afterRevision:viewer.body.revision});
assert.equal(sync.body.role,'viewer');
assert.equal((await call('take-control',vAuth)).status,401,'PIN-less takeover forbidden');
sync=await call('sync',{...auth,afterRevision:owner.revision});
assert.equal(sync.body.role,'controller');
assert.equal(sync.body.controllerOnline,false);
const heartbeat=await call('heartbeat',auth);
assert.equal(heartbeat.status,200,'Returning moderator can renew lease without a PIN');
assert.equal(heartbeat.body.role,'controller');
assert.equal(heartbeat.body.controllerOnline,true);
const beforeSave=await call('sync',{...auth,afterRevision:0});
const update=clone(state);update.rounds[0].matches[0].score=[4,1];
const saved=await call('save',{...auth,revision:beforeSave.body.revision,data:update});
assert.equal(saved.status,200);
assert.equal(saved.body.role,'controller');
const post=await call('sync',{...vAuth,afterRevision:viewer.body.revision});
assert.deepEqual(post.body.data.rounds[0].matches[0].score,[4,1],'Viewer receives controller scoring changes');
// Transfer requires valid PIN; ownership then moves atomically.
const wrong=await call('take-control',{...vAuth,moderatorPin:'000000'});
assert.equal(wrong.status,401);
const moved=await call('take-control',{...vAuth,moderatorPin:owner.moderatorPin});
assert.equal(moved.status,200);assert.equal(moved.body.role,'controller');
assert.equal((await call('sync',{...auth,afterRevision:saved.body.revision})).body.role,'viewer','Old moderator must be demoted on valid transfer');
assert.equal((await call('heartbeat',auth)).status,423,'Old moderator cannot renew lease');
assert.equal((await call('save',{...auth,revision:saved.body.revision,data:update})).status,423);
clock+=8*60_000;
assert.equal((await call('sync',{...vAuth,afterRevision:saved.body.revision})).body.role,'controller',
 'New moderator retains ownership through next long background period');
assert.equal((await call('sync',{...auth,afterRevision:saved.body.revision})).body.role,'viewer');
console.log('PASS PIN Moderator persists after WhatsApp background 5+15m, share and scoring; Viewer denied; PIN takeover transfers authority; prior owner demoted.');
