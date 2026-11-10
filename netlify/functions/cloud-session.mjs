/* PADEL 5IVE · v5.8 Cloud Session LAB.
 * Private Netlify Blobs data, isolated from public Share Results.
 * One writer lease + revision/ETag conditional writes; no silent overwrite.
 * Intentionally not a transactional multi-writer database.
 */
import { getStore } from '@netlify/blobs';
import { randomBytes, randomInt, createHash, scryptSync, timingSafeEqual } from 'node:crypto';

const STORE='padel5ive-cloud-sessions-v58';
const CODE=/^(?:\d{6}|[2-9A-HJ-NP-Z]{10})$/;
const NEW_CODE=/^[2-9A-HJ-NP-Z]{10}$/;
const CODE_ALPHABET='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MOD_PIN=/^\d{6}$/;
const VIEW_TOKEN=/^[A-Za-z0-9_-]{40,90}$/;
const createViewerCode=()=>Array.from({length:10},()=>CODE_ALPHABET[randomInt(0,CODE_ALPHABET.length)]).join('');
const PIN=/^\d{4}$/;
const TOKEN=/^[A-Za-z0-9_-]{40,90}$/;
const LEASE_MS=90_000;
const LOCK_MS=15*60_000;
const MAX_BYTES=1_700_000;
const allowed=new Set(['create','join','sync','save','heartbeat','take-control','approve-control','release-control','recover-access']);
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const safe=v=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,90);
const now=()=>Date.now();
const uid=()=>randomBytes(12).toString('base64url');
const deviceToken=()=>randomBytes(32).toString('base64url');
/* Every authenticated moderator can mint a separate viewer invite without
 * invalidating existing WhatsApp links. Persist hashes ONLY, never raw links. */
function mintInvite(entry){
 const viewerKey=deviceToken();
 const prev=Array.isArray(entry.viewerKeyHashes)?entry.viewerKeyHashes:[];
 return {viewerKey,viewerKeyHashes:[...prev.slice(-255),hash(viewerKey)]};
}
const pinHash=(pin,salt)=>scryptSync(pin,salt,32).toString('hex');
const eq=(a,b)=>{const x=Buffer.from(String(a||''),'hex'),y=Buffer.from(String(b||''),'hex');return x.length===32&&y.length===32&&timingSafeEqual(x,y)};
function storeFor(request){
 const host=new URL(request.url).hostname.toLowerCase();
 const preview=/^(?:deploy-preview-\d+|[a-z0-9-]+)--padel5ive\.netlify\.app$/.test(host);
 const suffix=preview?'-qa-'+hash(host).slice(0,10):'';
 return getStore(STORE+suffix,{consistency:'strong'});
}
function json(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
 }});
}
function error(message,status=400){return json({ok:false,error:message},status)}
function validState(data,kind){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 if(kind==='unified')return data.version===24&&Array.isArray(data.roster)&&Array.isArray(data.rounds)&&
   ['registration','stage1','stage1finished','ko','champion'].includes(data.stage)&&
   typeof data.session==='string'&&data.session.trim().length>0;
 if(kind==='club')return !!data.setup&&typeof data.setup.sessionName==='string'&&
   data.setup.sessionName.trim().length>0&&typeof data.stage==='string'&&data.stage!=='setup';
 return false;
}
function summary(data,kind){
 const session=kind==='club'?data.setup.sessionName:data.session;
 const date=kind==='club'?(data.setup.gameDate||data.setup.date||data.date||''):data.date||'';
 const time=kind==='club'?(data.setup.gameTime||data.setup.time||data.time||''):data.time||'';
 return {session:safe(session),date:safe(date),time:safe(time),kind};
}
function role(entry,id,ts){
 return entry.controller?.id===id&&entry.controller.expires>ts?'controller':'viewer';
}
function metadata(entry,id,ts,includeData){
 const r={ok:true,code:entry.code,kind:entry.kind,summary:entry.summary,revision:entry.revision,
  role:role(entry,id,ts),moderatorPinRequired:!!entry.moderatorPinHash,controllerOnline:!!(entry.controller&&entry.controller.expires>ts),
  controllerExpires:entry.controller?.expires||null,
  pendingControl:entry.request?.id===id,
  takeoverRequested:entry.controller?.id===id&&!!entry.request&&entry.request.expires>ts,
  deviceId:id,updatedAt:entry.updatedAt};
 if(includeData)r.data=entry.data;
 return r;
}
async function read(store,code){return await store.getWithMetadata('session/'+code,{consistency:'strong',type:'json'})}
async function write(store,code,entry,etag){return await store.setJSON('session/'+code,entry,{onlyIfMatch:etag})}
const changed=result=>result?.modified===true&&typeof result.etag==='string'&&result.etag.length>0;
function verify(entry,token){
 if(!TOKEN.test(String(token||'')))return null;
 const h=hash(token);const d=entry.devices?.find(d=>eq(d.hash,h));return d?.id||null;
}
export function makeCloudHandler({storeFactory=storeFor,clock=now}={}){
 return async function handler(request){
  if(request.method!=='POST')return error('Method not allowed',405);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return error('Cross-origin request denied',403);
  if(!String(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
   return error('JSON request required',415);
  if(+(request.headers.get('content-length')||0)>MAX_BYTES)return error('Request too large',413);
  let input;
  try{
   const raw=await request.text();
   if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)return error('Request too large',413);
   input=JSON.parse(raw);
  }catch{return error('Invalid JSON',400)}
  const action=String(input?.action||'');
  if(!allowed.has(action))return error('Unsupported action',400);
  const store=storeFactory(request),ts=clock();
  try{
   if(action==='create'){
    const kind=input.kind, data=input.data;
    if(!validState(data,kind))return error('Save a registered session before enabling cloud access',422);
    if(Buffer.byteLength(JSON.stringify(data),'utf8')>1_450_000)return error('Session exceeds cloud size limit',413);
    const moderatorPin=String(randomInt(0,1_000_000)).padStart(6,'0');
    const viewerKey=deviceToken();
    const salt=randomBytes(16).toString('hex'),token=deviceToken(),id=uid();
    for(let attempt=0;attempt<20;attempt++){
     const code=createViewerCode();
     const entry={v:58,code,kind,summary:summary(data,kind),data,revision:1,updatedAt:ts,
      salt,viewerKeyHash:hash(viewerKey),moderatorPinHash:pinHash(moderatorPin,salt),
      failures:{count:0,until:0},
      devices:[{id,hash:hash(token),label:safe(input.label)||'Primary device',joinedAt:ts}],
      controller:{id,expires:ts+LEASE_MS},request:null};
     const result=await store.setJSON('session/'+code,entry,{onlyIfNew:true});
     if(changed(result))return json({...metadata(entry,id,ts,false),viewerKey,moderatorPin,token,created:true},201);
     if(result.modified) return error('Cloud write could not be verified. Please retry.',503);
    }
    return error('Could not generate unique code. Please retry.',503);
   }
   const code=String(input.code||'').replace(/\s+/g,'');
   if(!CODE.test(code))return error('Invalid Session Code',400);
   // All non-create actions require a valid existing code.
   const found=await read(store,code);
   if(!found||!found.data)return error('Session not found or access denied',404);
   let entry=found.data,etag=found.etag;
   if(entry.v!==58||!Array.isArray(entry.devices))return error('Unsupported session version',409);
   if(action==='join'){
    if(entry.viewerKeyHash){
     // New sessions: 50-bit manual code or one-tap token grants VIEW ONLY.
     if(input.viewerKey){
      if(!VIEW_TOKEN.test(String(input.viewerKey))||!(eq(hash(input.viewerKey),entry.viewerKeyHash)||(entry.viewerKeyHashes||[]).some(h=>eq(hash(input.viewerKey),h))))
       return error('Invalid Viewer Link',401);
     }else if(!NEW_CODE.test(code))return error('Invalid Session Code',401);
    }else{
     // Existing six-digit sessions retain their original Access PIN.
     if(entry.failures?.until>ts)return error('Too many attempts. Try again later.',429);
     const pin=String(input.pin||'');
     const correct=PIN.test(pin)&&eq(pinHash(pin,entry.salt),entry.pinHash);
     if(!correct){
      const count=(entry.failures?.count||0)+1;
      const next={...entry,failures:{count,until:count>=5?ts+LOCK_MS:0}};
      await write(store,code,next,etag);
      return error('Invalid Session Code or Access PIN',401);
     }
    }
    if(entry.devices.length>=128)return error('Device limit reached. Contact session owner.',403);
    const token=deviceToken(),id=uid();
    const next={...entry,devices:[...entry.devices,{id,hash:hash(token),
     label:safe(input.label)||'Connected device',joinedAt:ts}],
     failures:entry.viewerKeyHash?entry.failures:{count:0,until:0}};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Session changed or cloud write could not be verified. Please retry.',409);
    return json({...metadata(next,id,ts,true),token});
   }
   const id=verify(entry,input.token);
   if(!id)return error('This device is not authorized for the session',401);
   if(action==='sync'){
    return json(metadata(entry,id,ts,input.afterRevision!==entry.revision||input.force===true));
   }
   if(action==='save'){
    if(role(entry,id,ts)!=='controller')return error('View only. Take control before editing.',423);
    if(!Number.isInteger(input.revision)||input.revision!==entry.revision)
     return json({ok:false,error:'Cloud revision changed; local edits were not uploaded',revision:entry.revision},409);
    if(!validState(input.data,entry.kind))return error('Invalid session data',422);
    if(Buffer.byteLength(JSON.stringify(input.data),'utf8')>1_450_000)return error('Session exceeds cloud size limit',413);
    const next={...entry,data:input.data,summary:summary(input.data,entry.kind),
      revision:entry.revision+1,updatedAt:ts,controller:{id,expires:ts+LEASE_MS}};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return json({ok:false,error:'Concurrent update rejected or write unverified. No data overwritten.'},409);
    return json(metadata(next,id,ts,false));
   }
   if(action==='heartbeat'){
    if(role(entry,id,ts)!=='controller')return error('Control lease is no longer active',423);
    const next={...entry,controller:{id,expires:ts+LEASE_MS}};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Session changed; retry sync',409);
    return json(metadata(next,id,ts,false));
   }
   if(action==='recover-access'){
    // A moderator who transferred control before credentials recovery was added
    // can unlock the SAME full Cloud UI by re-entering the private PIN.
    if(role(entry,id,ts)!=='controller')return error('Only the active moderator can recover access details',423);
    if(!entry.moderatorPinHash)return error('Legacy sessions use their original Access PIN',409);
    const d=entry.devices.find(d=>d.id===id);
    if((entry.failures?.until||0)>ts||(d?.pinLockedUntil||0)>ts)
     return error('Too many incorrect PIN attempts. Try again later.',429);
    const supplied=String(input.moderatorPin||'');
    if(!MOD_PIN.test(supplied)||!eq(pinHash(supplied,entry.salt),entry.moderatorPinHash)){
     const attempts=(d?.pinAttempts||0)+1,global=(entry.failures?.count||0)+1;
     const next={...entry,failures:{count:global>=8?0:global,until:global>=8?ts+LOCK_MS:0},
      devices:entry.devices.map(x=>x.id===id?{...x,pinAttempts:attempts>=5?0:attempts,
       pinLockedUntil:attempts>=5?ts+LOCK_MS:0}:x)};
     const saved=await write(store,code,next,etag);
     if(!changed(saved))return error('PIN verification conflicted. Retry.',409);
     return error('Incorrect Moderator PIN',401);
    }
    const invite=mintInvite(entry);
    const next={...entry,failures:{count:0,until:0},viewerKeyHashes:invite.viewerKeyHashes,
     devices:entry.devices.map(x=>x.id===id?{...x,pinAttempts:0,pinLockedUntil:0}:x)};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Session changed. Retry access recovery.',409);
    return json({...metadata(next,id,ts,false),viewerKey:invite.viewerKey});
   }
   if(action==='take-control'){
    if(role(entry,id,ts)==='controller')return json(metadata(entry,id,ts,false));
    if(entry.moderatorPinHash){
     const device=entry.devices.find(d=>d.id===id);
     if((entry.failures?.until||0)>ts||(device?.pinLockedUntil||0)>ts)
      return error('Too many incorrect PIN attempts. Try again later.',429);
     const supplied=String(input.moderatorPin||'');
     const correct=MOD_PIN.test(supplied)&&eq(pinHash(supplied,entry.salt),entry.moderatorPinHash);
     if(!correct){
      const attempts=(device?.pinAttempts||0)+1;
      const globalAttempts=(entry.failures?.count||0)+1;
      const next={...entry,
       failures:{count:globalAttempts>=8?0:globalAttempts,until:globalAttempts>=8?ts+LOCK_MS:0},
       devices:entry.devices.map(d=>d.id===id
       ?{...d,pinAttempts:attempts>=5?0:attempts,pinLockedUntil:attempts>=5?ts+LOCK_MS:0}:d)};
      const saved=await write(store,code,next,etag);
      if(!changed(saved))return error('PIN check conflicted. Please retry.',409);
      return error('Incorrect Moderator PIN',401);
     }
     // Atomic single-writer transfer, with a fresh viewer invitation for the new moderator.
     const invite=mintInvite(entry);
     const next={...entry,failures:{count:0,until:0},viewerKeyHashes:invite.viewerKeyHashes,
      devices:entry.devices.map(d=>d.id===id
       ?{...d,pinAttempts:0,pinLockedUntil:0}:d),
      controller:{id,expires:ts+LEASE_MS},request:null};
     const saved=await write(store,code,next,etag);
     if(!changed(saved))return error('Another device updated control. Refresh and retry.',409);
     return json({...metadata(next,id,ts,true),viewerKey:invite.viewerKey,transferred:true});
    }
    // Legacy sessions retain their request/approval/lease flow.
    const active=entry.controller&&entry.controller.expires>ts;
    if(active){
     const next={...entry,request:{id,expires:ts+120_000}};
     const saved=await write(store,code,next,etag);
     if(!changed(saved))return error('Control request conflict; retry',409);
     return json({...metadata(next,id,ts,false),waiting:true},202);
    }
    const next={...entry,controller:{id,expires:ts+LEASE_MS},request:null};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Control already changed; retry',409);
    return json(metadata(next,id,ts,false));
   }
   if(action==='approve-control'){
    if(role(entry,id,ts)!=='controller')return error('Only the active controller can approve',423);
    const target=entry.request?.id;
    if(!target||entry.request.expires<ts||!entry.devices.some(d=>d.id===target))
     return error('No pending transfer request',409);
    const next={...entry,controller:{id:target,expires:ts+LEASE_MS},request:null};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Transfer conflict; retry',409);
    return json(metadata(next,id,ts,false));
   }
   if(action==='release-control'){
    if(role(entry,id,ts)!=='controller')return error('Not the active controller',423);
    const target=entry.request?.id&&entry.request.expires>ts?entry.request.id:null;
    const next={...entry,controller:target?{id:target,expires:ts+LEASE_MS}:null,request:null};
    const saved=await write(store,code,next,etag);
    if(!changed(saved))return error('Release conflict; retry',409);
    return json(metadata(next,id,ts,false));
   }
  }catch(e){
   console.error('Cloud session operation failed:',action,e);
   return error('Cloud service temporarily unavailable. Local data is preserved.',503);
  }
 };
}
export default makeCloudHandler();
