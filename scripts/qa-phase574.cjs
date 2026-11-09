/* Phase 5.7.4 — dynamic OG Top 5, final/KO, safety & route regression. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
(async()=>{
 const {projectResults}=await import('../netlify/helpers/unified-ranking.mjs');
 const {storeNameForUrl}=await import('../netlify/helpers/unified-store.mjs');
 const prod=storeNameForUrl('https://padel5ive.netlify.app/u/abcdefghijkl');
 const preview=storeNameForUrl('https://deploy-preview-3--padel5ive.netlify.app/u/abcdefghijkl');
 assert.notEqual(preview,prod,'Preview must never read/write production Blobs');
 assert.equal(preview,storeNameForUrl('https://deploy-preview-3--padel5ive.netlify.app/u/otherid'),'preview storage must survive the next commit');
 assert.equal(prod,storeNameForUrl('https://myfutureproductiondomain.com/u/abcdefghijkl'),'production and custom domain should preserve original namespace');

 const n=6;
 const roster=Array.from({length:n},(_,i)=>({id:i+1,names:['Player '+(i+1),'Partner '+(i+1)]}));
 const match=(id,a,b,x,y,confirmed=true)=>({id,court:1,teams:[[a],[b]],score:[x,y],confirmed});
 const src={p5report:1,mode:'fp-americano',stage:'stage1',session:'Test Friday Match',date:'2026-11-09',time:'19:00',courts:2,matchFormat:'total5',roster,ko:{format:'none'},rounds:[
   {matches:[match('1',1,2,4,1),match('2',3,4,2,2),match('3',5,6,0,4)]},
   {matches:[match('4',1,6,3,4),match('5',2,4,4,0),match('6',3,5,5,0,false)]}
 ]};
 const standings=projectResults(src);
 assert.deepEqual(standings.leaders.map(x=>x.id),[6,1,2,3,4],'Top 5 must follow Wins, Diff, Points and exclude unconfirmed scores');
 assert.equal(standings.heading,'LIVE STANDINGS');
 assert.equal(standings.leaders.length,5,'exactly 5 from 6 registered pairs');
 assert.equal(standings.mode,'AMERICANO');
 assert.equal(standings.time,'19:00');
 const finished=projectResults({...src,stage:'champion'});
 assert.equal(finished.heading,'FINAL LEADERBOARD');
 const knockout=projectResults({...src,stage:'champion',ko:{format:'double',champion:[2],runnerUp:[1]}});
 assert.equal(knockout.heading,'STAGE 1 TOP 5');
 assert.equal(knockout.champion,'Player 2 & Partner 2');
 assert.equal(knockout.runnerUp,'Player 1 & Partner 1');
 assert.equal(knockout.leaders[0].id,6,'KO winner must not rewrite Stage 1 leaderboard');
 const mx=projectResults({...src,mode:'fp-mexicano'});
 assert.equal(mx.mode,'MEXICANO');
 const ind=projectResults({...src,mode:'individual-mexicano',roster:roster.map(p=>({...p,names:[p.names[0]]})),rounds:[{matches:[{id:'m1',court:1,teams:[[1,2],[3,4]],score:[4,1],confirmed:true}]}]});
 assert.equal(ind.pairing,'FLEXIBLE PAIRING');
 const canvas=fs.readFileSync('public/phase57/social-card-v574.js','utf8');
 const records=[];
 const g={fillRect(){},fillText(v){records.push(String(v))},save(){},restore(){},measureText(v){return {width:String(v).length*11}},createLinearGradient(){return {addColorStop(){}}},globalAlpha:1,fillStyle:'',font:'',textAlign:'',textBaseline:''};
 const window={};
 vm.runInNewContext(canvas,{window,document:{createElement:tag=>{assert.equal(tag,'canvas');return {width:0,height:0,getContext:()=>g,toDataURL:()=> 'data:image/png;base64,QUJDRA=='};}}});
 const img=window.P5SocialCard.render(src);
 assert.equal(img,'QUJDRA==');
 assert(records.includes('LIVE STANDINGS'));
 assert(records.includes('Player 6 & Partner 6'));
 assert(records.some(x=>x.includes('OFFICIAL RESULTS')));
 records.length=0;window.P5SocialCard.render({...src,stage:'champion',ko:{format:'double',champion:[2],runnerUp:[1]}});
 assert(records.includes('TOURNAMENT CHAMPIONS'));
 assert(records.includes('STAGE 1 TOP 5'));
 const route=fs.readFileSync('netlify.toml','utf8');
 assert(route.includes('to = "/.netlify/functions/unified-share-page?id=:splat"'));
 assert(route.includes('to = "/.netlify/functions/unified-social-image?id=:splat"'));
 const page=fs.readFileSync('netlify/functions/unified-share-page.mjs','utf8');
 for(const k of ['og:title','og:image','og:image:secure_url','og:image:width','og:image:height','twitter:image','projectResults','entry.previewReady','esc(title)'])assert(page.includes(k),'Social document missing '+k);
 const image=fs.readFileSync('netlify/functions/unified-social-image.mjs','utf8');
 assert(image.includes("entry.revoked")&&image.includes("image/png")&&image.includes("social.png"));
 const api=fs.readFileSync('netlify/functions/unified-results.mjs','utf8');
 for(const k of ['MAX_PREVIEW_BYTES','previewBytes','readUInt32BE(16)','readUInt32BE(20)','previewRevision'])assert(api.includes(k),'Publish pipeline missing '+k);
 const compiled=fs.readFileSync('public/modes/unified/index.html','utf8');
 assert(compiled.includes('P5SocialCard.render(data)'),'Unified publishing must generate the PNG');
 assert(compiled.includes('body:JSON.stringify({data,preview,revision:stored.revision||1})'),'UPDATE must carry PNG');
 assert(compiled.includes('body:JSON.stringify({data,preview})'),'POST must carry PNG');
 assert(compiled.includes('/phase57/social-card-v574.js'),'Renderer must load with app');
 const worker=fs.readFileSync('public/sw.js','utf8');
 assert(worker.includes('p5-pwa-phase57-v574')&&worker.includes('/phase57/social-card-v574.js'),'PWA offline social renderer missing');
 console.log('PASS Phase 5.7.4 — Top 5, live/final/KO, Mexicano/Individual, Canvas, OG, server/image routes, PWA.');
})().catch(e=>{console.error(e);process.exitCode=1;});
