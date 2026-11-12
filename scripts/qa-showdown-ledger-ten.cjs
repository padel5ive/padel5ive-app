/* PADEL 5IVE | Team Showdown PDF: ten-row match history regression.
 * Tests exact export bytes, stage chunking, row numbering, page height and footer gap.
 * All data below are synthetic QA fixtures, not real tournament results.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/assets/p5-direct-pdf.js','utf8');
const context={window:{},Blob,TextEncoder,Intl,Date,console};
vm.runInNewContext(source,context,{filename:'p5-direct-pdf.js'});
const render=context.window.P5DirectPDF.renderShowdown;
const match=(tag,i)=>({
 a:tag+' Home '+String(i+1).padStart(2,'0'),
 b:tag+' Away '+String(i+1).padStart(2,'0'),
 court:i%5+1,score:'PENDING'
});
const matches1=Array.from({length:64},(_,i)=>match('Round Robin',i));
const matches2=Array.from({length:21},(_,i)=>match('Duel',i));
const matches3=Array.from({length:12},(_,i)=>match('Decider',i));
const data={
 p5showdown:1,session:'Jubilee School x Kolese Kanisius',
 date:'2026-11-13',courts:5,pairs:8,confirmed:0,
 teamA:'JuDel',teamB:'CaniPadel',
 roster:Array.from({length:8},(_,i)=>({a:'JuDel Pair '+(i+1),b:'Cani Pair '+(i+1)})),
 standings:Array.from({length:16},(_,i)=>({rank:i+1,name:'QA Pair '+(i+1),team:i<8?'JuDel':'CaniPadel',w:0,l:0,d:0,diff:0,p:0,g:0})),
 matches1,matches2,matches3,winner:null,pointsA:0,pointsB:0,
 stage1:{format:'Total of 5',aWins:0,bWins:0,status:'IN PROGRESS'},
 stage2:{format:'First to 4',aWins:0,bWins:0,status:'IN PROGRESS'},
 stage3:{format:'First to 6',aWins:0,bWins:0,status:'IN PROGRESS'}
};
(async()=>{
 const pdf=render(data);
 assert.equal(pdf.type,'application/pdf');
 const bytes=Buffer.from(await pdf.arrayBuffer());
 const raw=bytes.toString('latin1');
 assert(raw.startsWith('%PDF-1.4'),'PDF header');
 const streams=[...raw.matchAll(/\nstream\n([\s\S]*?)\nendstream/g)].map(m=>m[1]);
 const ledger=streams.filter(p=>p.includes('MATCHES ON THIS PAGE'));
 const pages=12; // 64 => 7, 21 => 3, 12 => 2
 assert.equal(ledger.length,pages,'Exactly 12 match-history pages');
 const counts=ledger.map(p=>{
   const m=p.match(/\((\d+) MATCHES ON THIS PAGE\) Tj ET/);
   assert(m,'Missing match-count page subtitle');
   const count=Number(m[1]);
   const rows=[...p.matchAll(/\(PENDING\) Tj ET/g)].length;
   assert.equal(rows,count,'Subtitle and actual match rows differ');
   assert(count>=1&&count<=10,'Exceeded ten rows per page');
   const ys=[...p.matchAll(/1 0 0 1 57 ([\d.]+) Tm \(\d{2}\) Tj ET/g)].map(m=>Number(m[1]));
   assert.equal(ys.length,rows,'Match number labels missing');
   assert(Math.min(...ys)>75,'Last match number too close to footer');
   return count;
 });
 assert.deepEqual(counts,[10,2,10,10,1,10,10,10,10,10,10,4],'Expected stage 3 / 2 / 1 descending pagination');
 assert.equal(counts.reduce((a,b)=>a+b,0),97,'Some matches are missing');
 assert.equal((raw.match(/\(PENDING\) Tj ET/g)||[]).length,97,'Missing or duplicated score rows');
 for(let i=1;i<=64;i++){
   const label='(Round Robin Home '+String(i).padStart(2,'0')+') Tj ET';
   assert(raw.includes(label),'Missing Stage 1 match '+i);
 }
 assert.equal((raw.match(/\/Type \/Page \/Parent /g)||[]).length,1+1+1+2+12,
   'Cover, overview, standings, roster and 12 ledger pages expected');
 assert(raw.includes('(How the Showdown Works) Tj ET'),'Overview missing');
 fs.writeFileSync('QA_PREVIEW_CLUB_MATCH_10_MATCHES.pdf',bytes);
 console.log('PASS Team Showdown PDF: 97 matches across 12 ledger pages, 10/page max, bottom row safe, full match coverage.');
})().catch(e=>{console.error(e);process.exitCode=1;});
