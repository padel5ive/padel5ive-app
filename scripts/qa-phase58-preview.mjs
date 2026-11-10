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
assert.match(create.code,/^[A-HJ-NP-Z][2-9A-HJ-NP-Z]{5}$/,'New Session Code is 6 characters');
assert.match(create.moderatorPin,/^\d{4}$/,'New Moderator PIN is 4 digits');
assert.equal(create.moderatorPinDigits,4);assert.ok(create.token?.length>=40);passed++;
assert.match(create.shortToken,/^[A-Za-z0-9_-]{16}$/,'New short Viewer token is 96-bit');passed++;
const shortUrl='/v/'+create.code+'.'+create.shortToken;
const shortLanding=await readPage(shortUrl,'/phase58/cloud-home.js');
assert(/<html\b/i.test(shortLanding),'Short Viewer URL serves an HTML landing document');passed++;
const shortJoin=await api('join-short',{code:create.code,shortToken:create.shortToken,label:'QA short-link viewer'});
assert.equal(shortJoin.status,200);assert.equal(shortJoin.role,'viewer');passed++;
const shortDenied=await api('join-short',{code:create.code,shortToken:'ABCDEF1234567890'});
assert.equal(shortDenied.status,401,'Incorrect short token cannot join');passed++;

const join=await api('join',{code:create.code,label:'QA disposable iPad'});
assert.equal(join.status,200,'Short manual code opens viewer');
assert.equal(join.role,'viewer');assert.equal(join.moderatorPinDigits,4);passed++;
const oneTap=await api('join',{code:create.code,viewerKey:create.viewerKey,label:'QA one-tap viewer'});
assert.equal(oneTap.status,200);assert.equal(oneTap.role,'viewer');passed++;
const blocked=await api('save',{code:create.code,token:join.token,revision:1,data:sample});
assert.equal(blocked.status,423,'Read-only device may not edit');passed++;
const scored={...sample,stage:'stage1'};
const save=await api('save',{code:create.code,token:create.token,revision:1,data:scored});
assert.equal(save.status,200,'Controller save succeeds');assert.equal(save.revision,2);passed++;
const stale=await api('save',{code:create.code,token:create.token,revision:1,data:sample});
assert.equal(stale.status,409,'Stale revision denied');passed++;
const poll=await api('sync',{code:create.code,token:join.token,afterRevision:1});
assert.equal(poll.status,200);assert.equal(poll.revision,2);assert.deepEqual(poll.data,scored);passed++;
const transfer=await api('take-control',{code:create.code,token:join.token,moderatorPin:create.moderatorPin});
assert.equal(transfer.status,200);assert.equal(transfer.role,'controller');assert.equal(transfer.transferred,true);
assert.match(transfer.shortToken,/^[A-Za-z0-9_-]{16}$/,'New moderator automatically receives short share');passed++;

assert.match(transfer.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);passed++;
const originalDenied=await api('save',{code:create.code,token:create.token,revision:2,data:sample});
assert.equal(originalDenied.status,423,'Former controller cannot edit');passed++;
const copiedLink=await api('join',{code:create.code,viewerKey:transfer.viewerKey,label:'New viewer'});
assert.equal(copiedLink.status,200);assert.equal(copiedLink.role,'viewer');passed++;
const oldLinkStillValid=await api('join',{code:create.code,viewerKey:create.viewerKey,label:'Prior link'});
assert.equal(oldLinkStillValid.status,200);passed++;
const recovered=await api('recover-access',{code:create.code,token:join.token,moderatorPin:create.moderatorPin});
assert.equal(recovered.status,200);assert.match(recovered.viewerKey,/^[A-Za-z0-9_-]{40,90}$/);passed++;
const mint=await api('share-short',{code:create.code,token:join.token});
assert.equal(mint.status,200);assert.match(mint.shortToken,/^[A-Za-z0-9_-]{16}$/);passed++;
const rejoin=await api('join-short',{code:create.code,shortToken:mint.shortToken});
assert.equal(rejoin.status,200);assert.equal(rejoin.role,'viewer');passed++;

console.log('PASS real Netlify Deploy Preview cloud smoke:',passed,'checks incl short /v/ route, hashed 96-bit token join, PIN security, old links, role transfer and revision.');
