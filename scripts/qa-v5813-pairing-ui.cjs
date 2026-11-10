'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const smart=fs.readFileSync('public/assets/p5-smart-player-input-v5812.js','utf8');
const esc=x=>String(x??'');
const modes=['Americano','Mexicano'].flatMap(game=>[
 {id:'individual-'+game.toLowerCase(),kind:'individual',game},
 {id:'fp-'+game.toLowerCase(),kind:'fixed',game},
 {id:'structured-'+game.toLowerCase(),kind:'individual',game}
]);
const registry={modes:()=>modes};
assert.equal(html.split('id="p5813-style-help"').length-1,1);
assert(html.includes("s.groupConfig={labels:['','']};"),'Fresh group labels must start blank');
assert(html.includes('l[0].toLocaleLowerCase()===l[1].toLocaleLowerCase()'),'Existing unique-label engine validation preserved');
assert(html.includes("alertModal(P5Structured.is(s)?'Pairing Groups':'Advanced Player Rules'"));
assert(html.includes("e.g. ${id==='A'?'Left':'Right'} /"),'Visible hint displays the correct example per group');
assert(html.includes('class="p5813-input-wrap"')&&html.includes('class="p5813-visible-example"'),'Group hints use glyph-safe overlay');
assert(html.includes('p5813-setup-style'));
function sourceBetween(a,b){
 const x=html.indexOf('function '+a+'('),y=html.indexOf('function '+b+'(',x);
 assert(x>=0&&y>x,'Native function range '+a+' to '+b);
 return html.slice(x,y);
}
const setup=new Function('P5EngineRegistry','esc','displayDate','homeExistingSessions',
 sourceBetween('formSetup','structuredReg')+';return formSetup;')(registry,esc,()=> 'Tuesday',()=> '');
for(const [id,selected,description] of [
 ['individual-americano','Normal • Flexible Pairing','Players rotate partners throughout the session.'],
 ['fp-americano','Fixed Partners','Partners remain together throughout the session.'],
 ['structured-americano','Structured Pairing (Left/Right • ♂/♀)','Partners are selected from opposite groups.'],
 ['individual-mexicano','Normal • Flexible Pairing','Players rotate partners throughout the session.'],
 ['fp-mexicano','Fixed Partners','Partners remain together throughout the session.'],
 ['structured-mexicano','Structured Pairing (Left/Right • ♂/♀)','Partners are selected from opposite groups.']
]){
 const markup=setup({mode:id,session:'Test',date:'2026-11-10',courts:2,matchFormat:'total5'});
 const d=new JSDOM(markup),doc=d.window.document,select=doc.querySelector('#setup-pairing');
 assert.deepEqual(Array.from(select.options).map(x=>x.textContent),[
 'Select pairing style','Normal • Flexible Pairing','Fixed Partners','Structured Pairing (Left/Right • ♂/♀)'
 ],'Pairing labels in '+id);
 assert.equal(select.options[select.selectedIndex].textContent,selected);
 assert.equal(doc.querySelector('#p5813-style-help').textContent,description);
 d.window.close();
}
const structuredReg=new Function('P5Structured','esc',sourceBetween('structuredReg','reg')+';return structuredReg;')(
 {labels:s=>s.groupConfig.labels},esc);
const roster=[
 {id:1,names:['Andry'],group:'A'},{id:2,names:['Felix'],group:'A'},
 {id:3,names:['Diki'],group:'B'},{id:4,names:['Dennis'],group:'B'}
];
let d=new JSDOM(structuredReg({roster,groupConfig:{labels:['','']}}));
let doc=d.window.document,a=doc.querySelector('#p5-51-label-a'),b=doc.querySelector('#p5-51-label-b');
assert(a&&b);
assert.equal(a.value,'');assert.equal(b.value,'');
assert(a.required&&b.required);
assert.equal(a.placeholder,' ','Real input is empty and uses placeholder-shown to control visual hint');
assert.equal(b.placeholder,' ');
assert.equal(a.value,'');assert.equal(b.value,'');
for(const [id,caption,symbol,expectedPath] of [['a','e.g. Left /','male','M12.25 11.75 19 5'],['b','e.g. Right /','female','M12 12.5V21']]){
 const input=doc.querySelector('#p5-51-label-'+id);
 const hint=doc.querySelector('#p5813-example-'+id);
 assert(hint&&input.nextElementSibling===hint,'Example is in same input wrapper: '+id);
 assert.equal(input.getAttribute('aria-describedby'),hint.id);
 assert.equal(hint.querySelector('span').textContent,caption);
 const visual=hint.querySelector('.p5813-gender-'+symbol);
 assert(visual&&visual.getAttribute('viewBox')==='0 0 24 24','Vector symbol used: '+id);
 assert(visual.querySelector('path')?.getAttribute('d')?.includes(expectedPath),'Entire symbol arrow/cross included: '+id);
 const wrapper=input.closest('.p5813-input-wrap');
 assert.equal(wrapper.dataset.p5813Group,id.toUpperCase());
 assert.equal(input.required,true);
}
assert.equal(doc.querySelectorAll('.p5813-required').length,2);
assert(doc.querySelector('.p5-51-summary').textContent.includes('Group A · 2 players'));
assert(doc.querySelector('.p5-51-summary').textContent.includes('Group B · 2 players'));
assert(doc.querySelector('.p5-52-rule').textContent.includes('Both group names are required'));
d.window.close();
d=new JSDOM(structuredReg({roster,groupConfig:{labels:['Left','Right']}}));
assert.equal(d.window.document.querySelector('#p5-51-label-a').value,'Left','Previously named Group A must remain');
assert.equal(d.window.document.querySelector('#p5-51-label-b').value,'Right','Previously named Group B must remain');
d.window.close();
const sd=new JSDOM('<!doctype html><html><body><input id="setup-session" value="Test"><input id="setup-date" value="2026-11-10"><span id="setup-date-display"></span><select id="setup-game"><option value="Americano">Americano</option><option value="Mexicano">Mexicano</option></select><select id="setup-pairing"><option value="">Select</option></select><select id="setup-courts"><option value="2">2</option></select><select id="setup-format"><option value="total5">Total 5</option></select><small id="p5813-style-help"></small><button data-act="setup-next"></button></body></html>');
const sid=id=>sd.window.document.getElementById(id);
const sync=new Function('$','P5EngineRegistry','document',sourceBetween('syncSetup','collectRegistration')+';return syncSetup;')(sid,registry,sd.window.document);
sync();
assert.deepEqual(Array.from(sid('setup-pairing').options).map(x=>x.textContent),[
 'Select pairing style','Normal • Flexible Pairing','Fixed Partners','Structured Pairing (Left/Right • ♂/♀)'
 ]);
assert.equal(sid('p5813-style-help').hidden,true);
for(const [v,desc] of [
 ['individual','Players rotate partners throughout the session.'],
 ['fixed','Partners remain together throughout the session.'],
 ['structured','Partners are selected from opposite groups.']
]){
 sid('setup-pairing').value=v;sync();
 assert.equal(sid('setup-pairing').value,v);
 assert.equal(sid('p5813-style-help').textContent,desc);
 assert.equal(sid('p5813-style-help').hidden,false);
}
sid('setup-game').value='Mexicano';sync();
assert.equal(sid('setup-pairing').value,'structured');
sd.window.close();
const mock=new JSDOM('<!doctype html><html><body><main id="americano"><div class="card p5-b32-registration p5-52-registration"><h1>Player Registration</h1><div class="p5-52-columns"><input id="p5-51-label-a" value="Left"><input id="p5-51-label-b" value="Right"></div></div></main></body></html>',{runScripts:'outside-only',url:'https://padel5ive.netlify.app/modes/unified/'});
mock.window.eval(smart);
mock.window.document.dispatchEvent(new mock.window.Event('DOMContentLoaded'));
const widget=mock.window.document.querySelector('#p5812-smart');
assert(widget,'Structured Smart Input in native Registration');
const area=widget.querySelector('textarea');area.value='1. Andry\n2. Felix';area.dispatchEvent(new mock.window.Event('input',{bubbles:true}));
widget.querySelector('.p5812-review').click();
const select=widget.querySelector('.p5812-group select');
assert(select,'Structured Preview group selector');
assert.deepEqual(Array.from(select.options).map(x=>x.textContent),['Group A · Left','Group B · Right']);
select.value='B';select.dispatchEvent(new mock.window.Event('change',{bubbles:true}));
const batch=mock.window.P5SmartInput.pending();
assert(batch&&batch.mode==='structured'&&batch.group==='B');
assert.deepEqual(Array.from(batch.names),['Andry','Felix']);
mock.window.close();
// Home Game Mode and pairing selection must use precisely the same labels.
const home=fs.readFileSync('public/index.html','utf8');
for(const name of ['Normal • Flexible Pairing','Fixed Partners','Structured Pairing (Left/Right • ♂/♀)'])
 assert(home.includes("'"+name+"',false"),'Home Pairing Style missing: '+name);
assert(home.includes("m+' · Normal • Flexible Pairing'"),'Home current selection caption updated');
assert.equal((home.match(/Flexible Pairing · Fixed Partners · Structured/g)||[]).length,2,'Home Americano/Mexicano descriptions consistent');
assert(!home.includes("'Normal / Flexible Pairing',false"));
assert(!home.includes("['fixed','Fixed Partner',false"));
assert(!home.includes("['structured','Structured Pairing',false"));
assert(html.includes('.p5813-gender-male')&&html.includes('.p5813-gender-female'),'Full symbols rendered with SVG');
assert(html.includes('input:not(:placeholder-shown)+.p5813-visible-example{display:none}'),'Examples hide automatically when user enters a label');
assert(html.includes('pointer-events:none'),'Example overlay must not block tapping input');
assert(html.includes('data-p5813-group="A"')&&html.includes('data-p5813-group="B"')?true:html.includes('data-p5813-group="${id}"'),'Group styling is data-attribute driven');
console.log('PASS v5.8.13: pairing styles and descriptions, blank required unique labels, restored labels, Structured Smart Input group destination.');
