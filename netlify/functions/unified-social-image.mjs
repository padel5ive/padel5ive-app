/* Phase 5.7.4 social image — only public, non-revoked results are readable. */
import { resultsStore } from '../helpers/unified-store.mjs';
export const config = { path: '/social/u/*' };
const ID=/^[A-Za-z0-9_-]{6,32}$/;
export default async function handler(request){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const slug=new URL(request.url).pathname.split('/').pop()||'';
 const id=slug.endsWith('.png')?slug.slice(0,-4):slug;
 if(!ID.test(id))return new Response('Not found',{status:404});
 try{
  const store=resultsStore(request);
  const entry=await store.get(id,{type:'json'});
  if(!entry||entry.revoked||!entry.previewReady)return new Response('Not found',{status:404});
  const bytes=await store.get(id+'.social.png',{type:'arrayBuffer'});
  if(!bytes||bytes.byteLength<60)return new Response('Not found',{status:404});
  return new Response(request.method==='HEAD'?null:bytes,{status:200,headers:{
    'Content-Type':'image/png','Content-Length':String(bytes.byteLength),
    'Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff',
    'Access-Control-Allow-Origin':'*'
  }});
 }catch(e){console.error('Social preview fetch failed',e);return new Response('Image unavailable',{status:503});}
}
