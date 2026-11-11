'use strict';
/* Initial Setup regression for the PR preview and deep-link recovery.
   Verify real functions from the dashboard HTML without browser dependencies. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
function extract(from,to){
 const a=html.indexOf(' function '+from+'(');
 const b=html.indexOf(' function '+to+'(',a+1);
 assert(a>=0&&b>a,'Missing native shared function '+from+' -> '+to);
 return html.slice(a,b);
}
assert(html.includes('.p5-b2-form.p54-mode-locked > label:has(#setup-game)'),'Missing conditional Game Mode visibility');
assert(html.includes('.p5-b2-form.p54-mode-locked > label:has(#setup-pairing)'),'Missing conditional Pairing Style visibility');
assert(!html.includes('.p5-b2-form > label:has(#setup-game),\n#americano .p5-b2-setup .p5-b2-form > label:has(#setup-pairing){display:none!important;}'),'Do not hide required mode fields unconditionally');
const src=extract('syncSetup','collectRegistration')+extract('p54SelectedMode','init');
new vm.Script(src);
const modes=[
 {id:'fp-americano',game:'Americano',kind:'fixed'},
 {id:'individual-americano',game:'Americano',kind:'individual'},
 {id:'structured-americano',game:'Americano',kind:'individual'},
 {id:'fp-mexicano',game:'Mexicano',kind:'fixed'},
 {id:'individual-mexicano',game:'Mexicano',kind:'individual'},
 {id:'structured-mexicano',game:'Mexicano',kind:'individual'}
];
function testCase(query,existingMode){
 const form={classes:new Set(),html:'',classList:{add(name){form.classes.add(name)}},insertAdjacentHTML(_where,x){form.html=x}};
 const game={value:''},pair={value:'',_html:''};
 Object.defineProperty(pair,'innerHTML',{get(){return this._html},set(x){this._html=x;this.value=''}});
 const button={disabled:true};
 const dateDisplay={textContent:'',classList:{toggle(){}}};
 const fields={
  'setup-session':{value:'Test'},'setup-date':{value:'2026-11-11'},
  'setup-game':game,'setup-pairing':pair,'setup-courts':{value:'1'},
  'setup-format':{value:'total5'},'setup-date-display':dateDisplay
 };
 const ctx={s:{stage:'setup',mode:existingMode},window:{__P54_PREVIEW_QUERY:null},
  location:{search:query},URLSearchParams,Date,Number,Set,Boolean,
  P5EngineRegistry:{modes:()=>modes},$:id=>fields[id]||null,
  document:{getElementById:id=>fields[id]||null,querySelector:selector=>selector==='.p5-b2-form'?form:selector==='[data-act="setup-next"]'?button:null}};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 vm.runInContext('syncSetup();p54SelectedMode();',ctx);
 return {ctx,form,button,game,pair};
}
// Direct mode link must preselect/lock existing mode and enable Continue.
{
 const t=testCase('?mode=Americano&pairing=fixed&intent=new','');
 assert.equal(t.game.value,'Americano');
 assert.equal(t.pair.value,'fixed');
 assert.equal(t.button.disabled,false);
 assert(t.form.classes.has('p54-mode-locked'));
 assert(t.form.html.includes('Americano · Fixed Partner'));
}
// Preview refresh may lose query parameters but retain the saved mode.
{
 const t=testCase('','fp-mexicano');
 assert.equal(t.game.value,'Mexicano');
 assert.equal(t.pair.value,'fixed');
 assert.equal(t.button.disabled,false);
 assert(t.form.html.includes('Mexicano · Fixed Partner'));
}
// No query/no stored mode: expose both selectors; user selection enables Continue.
{
 const t=testCase('','');
 assert(!t.form.classes.has('p54-mode-locked'));
 assert.equal(t.button.disabled,true);
 t.game.value='Americano';
 vm.runInContext('syncSetup()',t.ctx);
 t.pair.value='individual';
 vm.runInContext('syncSetup()',t.ctx);
 assert.equal(t.button.disabled,false);
}
// Valid deep link must take precedence over an unrelated saved setup mode.
{
 const t=testCase('?mode=Mexicano&pairing=structured','fp-americano');
 assert.equal(t.game.value,'Mexicano');
 assert.equal(t.pair.value,'structured');
 assert.equal(t.button.disabled,false);
}
console.log('PASS Initial Setup: direct mode, cached mode, manual fallback and mode override; Continue unlocks.');
