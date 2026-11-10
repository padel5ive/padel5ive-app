/* PADEL 5IVE v5.8.12 — Smart Input parse, registration and mode QA. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const js=fs.readFileSync('public/assets/p5-smart-player-input-v5812.js','utf8');
const html=fs.readFileSync('public/modes/unified/index.html','utf8'),css=fs.readFileSync('public/assets/p5-smart-player-input-v5812.css','utf8');
new vm.Script(js,{filename:'p5-smart-player-input-v5812.js'});
const context={window:{},document:{readyState:'loading',addEventListener(){}},MutationObserver:class{}};
vm.runInNewContext(js,context);
const P=context.window.P5SmartInput, names=['Edwin','Teo','Febrian','Macin','Chris','Agung','Diki','Wira','Kris','Calvin','Willy','Michael','Dani'];
const message=[
 '✨ UTARA @ Padel5','Rabu, 11 nov 19.00 - 22.00','2 court 19.00 - 20.00','3 court 20.00 - 22.00',
 '','1. Edwin ','2. Teo ','3. ','4. febrian','5. Macin','6. Chris*','7. Agung*',
 '8. Diki ','9. Wira ','10. Kris ','11. Calvin ','12. Willy *','13. Michael *','14. Dani *','15. .','16. .'
].join('\n');
const expected=['Edwin','Teo','febrian','Macin','Chris','Agung','Diki','Wira','Kris','Calvin','Willy','Michael','Dani'];
const parsed=P.parse(message);
assert.deepEqual(Array.from(parsed.names),expected);
assert.equal(parsed.slots,16);
assert.equal(parsed.skipped,3);
assert.equal(parsed.marked,5);
assert.equal(parsed.duplicates,0);
assert.equal(parsed.overflow,false);
assert.equal(P.parse('1. Edwin\n2. edwin\n3. Teo*').duplicates,1,'Repeated names ignored');
assert.equal(P.parse('Rabu 11 Nov\n2 court\n1. Chris*\n2. Chris*').names.length,1,'Unrelated metadata ignored');
assert.equal(P.parse('1. Kris\n2. Chris').names.length,2,'Distinct players must stay distinct');
assert.equal(P.parse('1. .\n2. -\n3. TBA').skipped,3);
assert.equal(P.parse(Array.from({length:61},(_,i)=>(i+1)+'. Player'+i).join('\n')).overflow,true,'Large lists require smaller batches');
assert.equal(html.split("case 'smart-player-import':").length-1,1,'Controller integration exactly once');
assert(html.includes('/assets/p5-smart-player-input-v5812.js'));
assert(html.includes('/assets/p5-smart-player-input-v5812.css'));
assert(css.includes('.p5812-smart')&&css.includes('.p5812-names'));

const start=html.indexOf("case 'smart-player-import':");
const stop=html.indexOf("case 'registration-add':",start);
const block=html.slice(start,stop);
const act=Function('s','window','ENG','P5Structured','collectRegistration','save','render','toast',
 'switch("smart-player-import"){'+block+'}');
function run(mode,data,initial,extra={}){
 let saved=0,renders=0,toast='';
 const s={mode,stage:'registration',roster:initial,nextId:initial.reduce((n,p)=>Math.max(n,p.id),0)+1,rules:{pairs:[],coachIds:[]}};
 const ctx={pending:()=>data,imported:count=>{ctx.count=count}};
 const individual=!mode.startsWith('fp-');
 act(s,{P5SmartInput:ctx},{[mode]:{kind:individual?'individual':'fixed'}},{is:s=>s.mode.startsWith('structured-')},
  ()=>{},()=>{saved++;return true},()=>{renders++;},m=>{toast=m});
 return {s,ctx,saved,renders,toast};
}
const blankIndividuals=Array.from({length:8},(_,i)=>({id:i+1,names:['']}));
const ind=run('individual-americano',{mode:'individual',names:expected,group:'A',paired:false},blankIndividuals);
assert.deepEqual(ind.s.roster.map(p=>p.names[0]),expected);
assert.equal(ind.s.nextId,14);
assert.equal(ind.saved,1);assert.equal(ind.renders,1);assert.equal(ind.ctx.count,13);
const fixed=run('fp-americano',{mode:'fixed',names:['A','B','C','D'],group:'A',paired:true},
 Array.from({length:6},(_,i)=>({id:i+1,names:['','']})));
assert.deepEqual(fixed.s.roster.slice(0,2).map(p=>p.names),[['A','B'],['C','D']]);
const odd=run('fp-americano',{mode:'fixed',names:expected,paired:true},[{id:1,names:['','']}]);
assert.equal(odd.saved,0);assert.equal(odd.renders,0);assert.equal(odd.s.roster[0].names[0],'');
const notConfirmed=run('fp-americano',{mode:'fixed',names:['A','B'],paired:false},[{id:1,names:['','']}]);
assert.equal(notConfirmed.saved,0,'Fixed pairing requires explicit confirmation');
const structured=run('structured-mexicano',{mode:'structured',names:['A1','A2','A3'],group:'B',paired:false},[
 {id:1,names:['Existing'],group:'A'},{id:2,names:[''],group:'A'},{id:3,names:[''],group:'B'}]);
assert.deepEqual(structured.s.roster.filter(p=>p.group==='B').map(p=>p.names[0]),['A1','A2','A3']);
assert.equal(structured.s.roster.find(p=>p.id===2).names[0],'','Do not overwrite blank Group A');
const duplicate=run('individual-americano',{mode:'individual',names:['edwin'],group:'A'},[{id:1,names:['Edwin']}]);
assert.equal(duplicate.saved,0,'Existing player duplicate must not be imported');

const {JSDOM}=require('jsdom');
const doc=new JSDOM('<!doctype html><html><body><main id="americano"><div class="card p5-b32-registration"><h1>Player Registration</h1><div class="p5-v2-reg p5-b32-reg-list"><input data-person="1" data-slot="0" value=""></div></div></main></body></html>',{runScripts:'outside-only',url:'https://padel5ive.netlify.app/modes/unified/'});
doc.window.eval(js);
doc.window.document.dispatchEvent(new doc.window.Event('DOMContentLoaded'));
const box=doc.window.document.getElementById('p5812-smart');
assert(box,'Smart Input must mount within native Registration');
const area=box.querySelector('textarea');area.value=message;area.dispatchEvent(new doc.window.Event('input',{bubbles:true}));
box.querySelector('.p5812-review').click();
assert.equal(box.querySelectorAll('.p5812-names li').length,13,'Preview shows all thirteen names');
assert.equal(box.querySelector('[data-act="smart-player-import"]').disabled,false);
const pending=doc.window.P5SmartInput.pending();
assert.equal(pending.names.length,13);
assert.equal(pending.mode,'individual');
doc.window.close();
console.log('PASS v5.8.12: 13/16 WhatsApp entries, empty slots, marker handling, duplicates, fixed-pair opt-in, structured groups, native 8-row Registration and preview.');
