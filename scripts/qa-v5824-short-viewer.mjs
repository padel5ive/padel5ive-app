/* PADEL 5IVE v5.8.24 — secure short WhatsApp viewer URL.
 * All credentials are validated with an in-memory Netlify Blobs CAS store.
 * Never touches production sessions, public Results or real PINs.
 */
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {makeCloudHandler} from '../netlify/functions/cloud-session.mjs';
let seq=0;
const records=new Map(),copy=x=>JSON.parse(JSON.stringify(x));
const store={
 async getWithMetadata(key){const item=records.get(key);return item?{data:copy(item.data),etag:item.etag}:null;},
 async setJSON(key,data,{onlyIfMatch,onlyIfNew}={}){
  const found=records.get(key);
  if((onlyIfNew&&found)||(onlyIfMatch&&(!found||found.etag!==onlyIfMatch)))
   return {modified:false};
  const etag='"'+(++seq)+'"';records.set(key,{etag,data:copy(data)});
  return {modified:true,etag};
 }
};
const handler=makeCloudHandler({storeFactory:()=>store,clock:()=>1_795_000_000_000});
async function call(action,params={}){
 const res=await handler(new Request('https://deploy-preview-31--padel5ive.netlify.app/api/cloud-session',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({action,...params})
 }));
 return {status:res.status,...await res.json()};
}
const state={version:24,stage:'stage1',mode:'fp-americano',session:'Short Link QA',
 date:'2026-11-10',time:'19:00',courts:2,roster:[{id:'a',names:['A','B']},{id:'b',names:['C','D']}],rounds:[]};
const made=await call('create',{kind:'unified',data:state});
assert.equal(made.status,201);
assert.match(made.code,/^[A-HJ-NP-Z][2-9A-HJ-NP-Z]{5}$/);
assert.match(made.shortToken,/^[A-Za-z0-9_-]{16}$/);
assert.match(made.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);
const saved=records.get('session/'+made.code).data;
assert(saved.shortViewerHashes.some(h=>h===createHash('sha256').update(made.shortToken).digest('hex')));
assert(!JSON.stringify(saved).includes(made.shortToken),'Never store raw short credential');
assert(!JSON.stringify(saved).includes(made.viewerKey),'Never store raw long credential');
assert.equal(saved.moderatorPin,undefined,'Never store private Moderator PIN');
const link='https://padel5ive.netlify.app/v/'+made.code+'.'+made.shortToken;
assert.equal(new URL(link).pathname.split('/').length,3);
assert(link.length<65,'Viewer link should be much shorter than old tokenized fragment');
const viewer=await call('join-short',{code:made.code,shortToken:made.shortToken});
assert.equal(viewer.status,200);assert.equal(viewer.role,'viewer');
assert.equal(viewer.shortToken,undefined);
assert.equal(viewer.moderatorPin,undefined);
assert.deepEqual(viewer.data,state);
assert.equal((await call('join-short',{code:made.code,shortToken:'invalid'})).status,401);
assert.equal((await call('join-short',{code:made.code,shortToken:randomBytes(12).toString('base64url')})).status,401);
assert.equal((await call('join-short',{code:'A23456',shortToken:made.shortToken})).status,404);
assert.equal((await call('share-short',{code:made.code,token:viewer.token})).status,423,'Viewer cannot mint invites');
assert.equal((await call('save',{code:made.code,token:viewer.token,revision:1,data:state})).status,423,'Short URL grants no scoring rights');
const another=await call('share-short',{code:made.code,token:made.token});
assert.equal(another.status,200);
assert.match(another.shortToken,/^[A-Za-z0-9_-]{16}$/);
assert.notEqual(another.shortToken,made.shortToken);
assert.equal((await call('join-short',{code:made.code,shortToken:another.shortToken})).status,200);
assert.equal((await call('join-short',{code:made.code,shortToken:made.shortToken})).status,200,'Already shared short links remain valid');
assert.equal((await call('join',{code:made.code,viewerKey:made.viewerKey})).status,200,'Already shared long links remain valid');
const takeover=await call('take-control',{code:made.code,token:viewer.token,moderatorPin:made.moderatorPin});
assert.equal(takeover.status,200);assert.equal(takeover.role,'controller');
assert.match(takeover.shortToken,/^[A-Za-z0-9_-]{16}$/);
assert.equal((await call('share-short',{code:made.code,token:made.token})).status,423,'Old moderator loses invite rights');
assert.equal((await call('share-short',{code:made.code,token:viewer.token})).status,200,'New moderator can share');
const recovery=await call('recover-access',{code:made.code,token:viewer.token,moderatorPin:made.moderatorPin});
assert.equal(recovery.status,200);assert.match(recovery.shortToken,/^[A-Za-z0-9_-]{16}$/);
assert.equal((await call('join-short',{code:made.code,shortToken:recovery.shortToken})).status,200);
const home=readFileSync('public/phase58/cloud-home.js','utf8');
const dashboard=readFileSync('public/phase58/cloud-dashboard.js','utf8');
const routing=readFileSync('netlify.toml','utf8');
assert(home.includes("api(options.shortToken?'join-short':'join'"));
assert(home.includes("history.replaceState(window.history.state,'','/'+location.search)"));
assert(dashboard.includes("await api('share-short'"));
assert(dashboard.includes("'/v/'+m.code+'.'+m.shortToken"));
assert(routing.includes('from = "/v/*"')&&routing.includes('to = "/index.html"'));
assert(routing.includes('Referrer-Policy = "no-referrer"'));
for(const file of ['netlify/functions/cloud-session.mjs','public/phase58/cloud-dashboard.js','public/phase58/cloud-home.js']){
 const {execFileSync}=await import('node:child_process');
 execFileSync(process.execPath,['--check',file]);
}
console.log('PASS v5.8.24: 96-bit short viewer links, one-tap join, role security, old links, takeover, recovery and routing.');
