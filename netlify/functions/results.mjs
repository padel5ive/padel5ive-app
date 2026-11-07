import {getStore} from '@netlify/blobs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
const json=(payload,status=200)=>new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const goodPin=(a,b)=>{const aa=Buffer.from(a||'');const bb=Buffer.from(b||'');return aa.length===bb.length&&aa.length>0&&timingSafeEqual(aa,bb);};
export default async function(request){
 try{
  const url=new URL(request.url),store=getStore('team-showdown-results-v1');
  if(request.method==='GET'){
   const id=url.searchParams.get('id')||'';
   if(!/^[a-zA-Z0-9_-]{6,32}$/.test(id))return json({error:'Invalid results ID'},400);
   const doc=await store.get(id,{type:'json'});
   if(!doc)return json({error:'Results not found'},404);
   return json(doc);
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!process.env.PADEL5IVE_SHOWDOWN_SHARE_PIN)return json({error:'TEAM SHOWDOWN sharing PIN is not configured'},503);
  if(!goodPin(request.headers.get('X-Padel-Pin'),process.env.PADEL5IVE_SHOWDOWN_SHARE_PIN))return json({error:'Invalid PIN'},401);
  const length=Number(request.headers.get('content-length')||0);if(length>400000)return json({error:'Results too large'},413);
  const body=await request.json();const data=body?.data;
  if(!data||data.schema!=='padel5ive-team-showdown-results-v1'||!data.setup||!data.roster||!Array.isArray(data.schedule))return json({error:'Invalid Team Showdown results'},400);
  if(JSON.stringify(data).length>400000)return json({error:'Results too large'},413);
  const id=(typeof body.id==='string'&&/^[a-zA-Z0-9_-]{6,32}$/.test(body.id))?body.id:randomBytes(8).toString('base64url');
  await store.setJSON(id,data);return json({id});
 }catch(e){console.error('Team Showdown results error',e);return json({error:'Unable to process results'},500);}
};
