import { getStore } from '@netlify/blobs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** PADEL 5IVE Phase 5.4.13 – Official Unified read-only public reports.
 *  Site-wide store belongs to a SEPARATE staging site until approved.
 *  Only the PIN holder may create/revoke; only an owner with the session's
 *  unguessable edit token may update. Public GET returns no credentials.
 */
const ID_RE = /^[A-Za-z0-9_-]{6,32}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{32,100}$/;
const MODE_IDS = new Set([
  'fp-americano','individual-americano','structured-americano',
  'fp-mexicano','individual-mexicano','structured-mexicano'
]);
const STAGES = new Set(['registration','stage1','stage1finished','ko','champion']);
const MAX_BYTES=1200000,MAX_REPORT_BYTES=600000,MAX_PREVIEW_BYTES=400000;
const STORE_NAME='padel5ive-unified-results-5-4-13';
function json(value,status=200){
  return new Response(JSON.stringify(value),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0',
      'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}
  });
}
function eq(a,b){
  const aa=Buffer.from(String(a??''),'utf8'),bb=Buffer.from(String(b??''),'utf8');
  return aa.length>0&&aa.length===bb.length&&timingSafeEqual(aa,bb);
}
const sha=s=>createHash('sha256').update(s).digest('hex');
function pinConfigured(){
  return typeof process.env.PADEL5IVE_UNIFIED_SHARE_PIN==='string'&&process.env.PADEL5IVE_UNIFIED_SHARE_PIN.length>=12;
}
function pinValid(pin){return pinConfigured()&&eq(pin,process.env.PADEL5IVE_UNIFIED_SHARE_PIN);}
function validateReport(s){
  if(!s||typeof s!=='object'||s.p5report!==1||!MODE_IDS.has(s.mode)||!STAGES.has(s.stage))return false;
  if(typeof s.session!=='string'||s.session.length>180||typeof s.date!=='string'||s.date.length>40)return false;
  if(!Number.isInteger(s.courts)||s.courts<1||s.courts>5)return false;
  if(typeof s.matchFormat!=='string'||s.matchFormat.length>100)return false;
  if(!Array.isArray(s.roster)||s.roster.length<2||s.roster.length>80||!Array.isArray(s.rounds)||s.rounds.length>300)return false;
  const single=s.mode.startsWith('fp-'),identifiers=new Set();
  for(const p of s.roster){
    if(!Number.isSafeInteger(p?.id)||identifiers.has(p.id)||!Array.isArray(p.names)||p.names.length!==(single?2:1)||p.names.some(n=>typeof n!=='string'||n.length>100))return false;
    identifiers.add(p.id);
  }
  let foundScore=false;
  for(const r of s.rounds){
    if(!r||!Array.isArray(r.matches)||r.matches.length>5)return false;
    for(const match of r.matches){
      if(match===null)continue;
      if(!match||typeof match.id!=='string'||match.id.length>120||!Number.isInteger(match.court)||match.court<1||match.court>5||typeof match.confirmed!=='boolean')return false;
      if(!Array.isArray(match.teams)||match.teams.length!==2)return false;
      if(match.teams.some(team=>!Array.isArray(team)||team.length!==(single?1:2)||team.some(id=>!identifiers.has(id))))return false;
      const all=[...match.teams[0],...match.teams[1]];
      if(new Set(all).size!==all.length)return false;
      if(match.score!=null&&(!Array.isArray(match.score)||match.score.length!==2||match.score.some(n=>!Number.isSafeInteger(n)||n<0||n>1000)))return false;
      if(match.confirmed){if(match.score==null)return false;foundScore=true;}
    }
  }
  // v5.4.13.7: optional confirmed knockout graph, serialized for the master-style
  // interactive public bracket. Existing published snapshots without this field
  // remain backwards compatible. Only canonical bracket match IDs may be sent.
  if(s.publicKO!==undefined){
    if(!Array.isArray(s.publicKO)||s.publicKO.length>31)return false;
    const koIds=new Set();
    for(const k of s.publicKO){
      if(!Number.isInteger(k?.id)||k.id<1||k.id>31||koIds.has(k.id)||!['W','L','F'].includes(k.group))return false;
      koIds.add(k.id);
      if(!Number.isInteger(k.round)||k.round<1||k.round>12)return false;
      if(!Array.isArray(k.teamA)||!Array.isArray(k.teamB)||k.teamA.length!==k.teamB.length||k.teamA.length!==(single?1:2))return false;
      const all=[...k.teamA,...k.teamB];
      if(new Set(all).size!==all.length||all.some(id=>!identifiers.has(id)))return false;
      if(!Array.isArray(k.score)||k.score.length!==2||k.score.some(v=>!Number.isSafeInteger(v)||v<0||v>1000)||k.score[0]===k.score[1])return false;
    }
  }
  // The client requires >=1 confirmed score before it will publish.
  if(!foundScore)return false;
  return true;
}
async function readBody(request){
  if(!String(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw Object.assign(new Error('JSON Content-Type required'),{status:415});
  const len=Number(request.headers.get('content-length')||0);
  if(!Number.isFinite(len)||len>MAX_BYTES)throw Object.assign(new Error('Results payload exceeds size limit'),{status:413});
  const raw=await request.text();
  if(Buffer.byteLength(raw,'utf8')>MAX_BYTES)throw Object.assign(new Error('Results payload exceeds size limit'),{status:413});
  let body;try{body=JSON.parse(raw);}catch{throw Object.assign(new Error('Invalid JSON body'),{status:400});}
  if(!validateReport(body?.data))throw Object.assign(new Error('Invalid or unconfirmed Unified results snapshot'),{status:400});
  if(Buffer.byteLength(JSON.stringify(body.data),'utf8')>MAX_REPORT_BYTES)throw Object.assign(new Error('Results data exceeds report size limit'),{status:413});
  if(body.preview!==undefined&&body.preview!==null){
    if(typeof body.preview!=='string'||body.preview.length>550000||!/^[-a-zA-Z0-9+/=]+$/.test(body.preview))throw Object.assign(new Error('Invalid social preview image'),{status:400});
    const bytes=Buffer.from(body.preview,'base64');
    if(bytes.byteLength>MAX_PREVIEW_BYTES||bytes.byteLength<60||
       bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
       bytes.readUInt32BE(16)!==1200||bytes.readUInt32BE(20)!==630)
       throw Object.assign(new Error('Social preview must be a 1200x630 PNG'),{status:400});
    body.previewBytes=bytes;
  }
  return body;
}
export default async function handler(request){
  try{
    const url=new URL(request.url),id=url.searchParams.get('id')||'';
    const store=getStore(STORE_NAME,{consistency:'strong'});
    switch(request.method){
      case 'GET':{
        if(!ID_RE.test(id))return json({error:'Invalid results ID'},400);
        const entry=await store.get(id,{type:'json'});
        if(!entry||entry.revoked)return json({error:'Results not found or revoked'},404);
        return json({data:entry.data,revision:entry.revision,updatedAt:entry.updatedAt});
      }
      case 'POST':{
        if(!pinConfigured())return json({error:'Unified publishing PIN not configured on this Netlify site'},503);
        if(!pinValid(request.headers.get('X-Padel-Pin')))return json({error:'Invalid publishing PIN'},401);
        const body=await readBody(request),id=randomBytes(12).toString('base64url'),token=randomBytes(32).toString('base64url'),now=new Date().toISOString();
        if(body.previewBytes)await store.set(id+'.social.png',body.previewBytes);
        await store.setJSON(id,{version:1,hash:sha(token),data:body.data,revision:1,createdAt:now,updatedAt:now,revoked:false});
        return json({id,editToken:token,revision:1,updatedAt:now},201);
      }
      case 'PUT':{
        if(!ID_RE.test(id))return json({error:'Invalid results ID'},400);
        const entry=await store.get(id,{type:'json'});
        if(!entry||entry.revoked)return json({error:'Results not found or revoked'},404);
        const token=request.headers.get('X-Padel-Edit-Token')||'';
        if(!TOKEN_RE.test(token)||!eq(sha(token),entry.hash))return json({error:'Invalid session edit key'},403);
        const body=await readBody(request);
        if(!Number.isInteger(body.revision)||body.revision!==entry.revision)return json({error:'Results revision conflict. Reload the latest publishing state.'},409);
        const revision=entry.revision+1,now=new Date().toISOString();
        if(body.previewBytes)await store.set(id+'.social.png',body.previewBytes);
        // Not an atomic database transaction: concurrent organizer updates remain a staging QA risk.
        await store.setJSON(id,{...entry,data:body.data,revision,updatedAt:now});
        return json({id,revision,updatedAt:now});
      }
      case 'DELETE':{
        if(!pinConfigured())return json({error:'Unified publishing PIN not configured on this Netlify site'},503);
        if(!pinValid(request.headers.get('X-Padel-Pin')))return json({error:'Invalid publishing PIN'},401);
        if(!ID_RE.test(id))return json({error:'Invalid results ID'},400);
        const entry=await store.get(id,{type:'json'});
        if(!entry)return json({error:'Results not found'},404);
        await store.setJSON(id,{...entry,revoked:true,updatedAt:new Date().toISOString()});
        return json({id,revoked:true});
      }
      default:return json({error:'Method not allowed'},405);
    }
  }catch(e){
    if(e?.status)return json({error:e.message},e.status);
    console.error('Unified Official Results API',e);
    return json({error:'Unable to process results at this time'},500);
  }
}
