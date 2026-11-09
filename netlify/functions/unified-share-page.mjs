/* Phase 5.7.4 dynamic Open Graph document — previews work without browser JS.
 * Existing read-only results viewer markup, functionality and metadata remain.
 */
import { getStore } from '@netlify/blobs';
import { projectResults } from '../helpers/unified-ranking.mjs';
const ID=/^[A-Za-z0-9_-]{6,32}$/;
const STORE='padel5ive-unified-results-5-4-13';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const response=(text,status=200)=>new Response(text,{status,headers:{
 'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, must-revalidate',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
const notFound=()=>response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>PADEL 5IVE · Results Unavailable</title><body><h1>Results unavailable</h1><p>Check your organizer link.</p></body></html>',404);
export default async function handler(request){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const url=new URL(request.url);
 const id=url.searchParams.get('id')||'';
 if(!ID.test(id))return notFound();
 let entry;try{entry=await getStore(STORE,{consistency:'strong'}).get(id,{type:'json'});}catch(e){console.error('Unified share document',e);return new Response('Results service unavailable',{status:503});}
 if(!entry||entry.revoked||!entry.data)return notFound();
 let summary;try{summary=projectResults(entry.data);}catch{return notFound();}
 const base=url.origin;
 const rel='/u/'+id;
 const image=entry.previewReady?base+'/social/u/'+id+'.png?v='+encodeURIComponent(entry.previewRevision||1):base+'/og-cover.jpg?v=573';
 const eventName=clean(summary.session).slice(0,100);
 const title='PADEL 5IVE · '+eventName+' · Official Results';
 const details=[summary.mode,summary.pairing,summary.date,summary.time].filter(Boolean).join(' · ');
 const headline=summary.champion?'Champion: '+summary.champion:summary.complete?'Final Top 5':'Live Top 5';
 const description=clean(details+' · '+headline).slice(0,240);
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
 '<meta name="theme-color" content="#101923"><meta name="robots" content="noindex,follow,noarchive">'+
 '<meta property="og:type" content="website"><meta property="og:site_name" content="PADEL 5IVE">'+
 '<meta property="og:url" content="'+esc(base+rel)+'">'+
 '<meta property="og:title" content="'+esc(title)+'">'+
 '<meta property="og:description" content="'+esc(description)+'">'+
 '<meta property="og:image" content="'+esc(image)+'">'+
 '<meta property="og:image:secure_url" content="'+esc(image)+'">'+
 '<meta property="og:image:type" content="'+(entry.previewReady?'image/png':'image/jpeg')+'">'+
 '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'+
 '<meta property="og:image:alt" content="PADEL 5IVE Official Results · Top 5 leaderboard">'+
 '<meta name="twitter:card" content="summary_large_image">'+
 '<meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'">'+
 '<meta name="twitter:image" content="'+esc(image)+'">'+
 '<title>'+esc(title)+'</title>'+
 '<link rel="stylesheet" href="/assets/fixed-master-official-results.css">'+
 '<link rel="stylesheet" href="/assets/p5-interactive-results.css">'+
 '<link rel="stylesheet" href="/assets/p5-reporting-foundation.css">'+
 '<link rel="stylesheet" href="/assets/p5-results-visual-v5514.css">'+
 '<link rel="stylesheet" href="/assets/p5-unified-fixed-backdrop-v5701.css">'+
 '<link rel="stylesheet" href="/phase57/share-champion-v571.css">'+
 '</head><body class="share-photo-results">'+
 '<div class="p5-unified-fixed-backdrop" aria-hidden="true"></div>'+
 '<main class="wrap" id="app"><div class="load-panel"><div class="eyebrow">PADEL 5IVE · MATCH CONTROL</div><h1>Official Results</h1><p>Loading published results…</p></div></main>'+
 '<script defer src="/assets/p5-results-nav-v5514.js"></script>'+
 '<script defer src="/assets/p5-interactive-results.js"></script>'+
 '<script defer src="/phase57/champion-render-v571.js"></script>'+
 '</body></html>';
 return response(request.method==='HEAD'?'':html);
}
