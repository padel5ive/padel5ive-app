/* PADEL 5IVE · Team Showdown PDF cover spacing regression.
 * Validates emitted PDF coordinates; no browser, stored results or engine changes.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/assets/p5-direct-pdf.js','utf8');
const context={window:{},Blob,TextEncoder,Intl,Date,console};
vm.runInNewContext(source,context,{filename:'p5-direct-pdf.js'});
const render=context.window.P5DirectPDF.renderShowdown;
const H=595.28;
const base={
 p5showdown:1,date:'2026-11-13',courts:5,pairs:8,confirmed:0,
 teamA:'JuDel',teamB:'CaniPadel',roster:[{a:'Demo A',b:'Demo B'}],
 standings:[{rank:1,name:'Demo A',team:'JuDel',w:0,l:0,d:0,diff:0,p:0,g:0}],
 matches1:[],matches2:[],matches3:[],winner:null,pointsA:0,pointsB:0,
 stage1:{format:'Total of 5',aWins:0,bWins:0,status:'IN PROGRESS'},
 stage2:{format:'Not scheduled',aWins:0,bWins:0,status:'NOT REQUIRED'},
 stage3:{format:'Not scheduled',aWins:0,bWins:0,status:'NOT REQUIRED'}
};
async function pdfString(session){
 const blob=render({...base,session});
 assert.equal(blob.type,'application/pdf');
 return Buffer.from(await blob.arrayBuffer()).toString('latin1');
}
function yForText(pdf,value){
 const pos=pdf.indexOf('('+value+') Tj ET');
 assert(pos>=0,'Missing PDF text '+value);
 const before=pdf.slice(Math.max(0,pos-130),pos);
 const matches=[...before.matchAll(/1 0 0 1 ([\d.]+) ([\d.]+) Tm /g)];
 assert(matches.length,'Text coordinates missing for '+value);
 return Number(matches.at(-1)[2]);
}
(async()=>{
 const one=await pdfString('Jubilee Friendly Match');
 const two=await pdfString('Jubilee School x Kolese Kanisius');
 const oneSub=yForText(one,'Official Session Report');
 const twoSub=yForText(two,'Official Session Report');
 assert(Math.abs(oneSub-(H-343))<0.01,'Single-line cover must retain original layout');
 assert(Math.abs(twoSub-(H-363))<0.01,'Two-line subtitle must move down by 20pt');
 assert.equal(Number((oneSub-twoSub).toFixed(1)),20);
 assert(Math.abs(yForText(two,'Kanisius')-(H-321))<0.01,'Title second line changed');
 assert(yForText(two,'Kanisius')-twoSub>=40,'Subtitle too close to second title line');
 assert(Math.abs(yForText(two,'TEAM SHOWDOWN  /  JUDEL VS CANIPADEL')-(twoSub-48))<0.01,
 'Format caption should move with subtitle');
 assert(yForText(two,'TEAM SHOWDOWN  /  JUDEL VS CANIPADEL')>141+30,
 'Format caption too near cover metadata divider');
 assert(two.includes('(How the Showdown Works) Tj ET'),'Overview missing');
 console.log('PASS Team Showdown cover: one-line unchanged; two-line title spacing +20pt; caption follows; overview preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
