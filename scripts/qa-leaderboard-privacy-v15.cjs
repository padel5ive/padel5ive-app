/* First Edition v1.5 · Americano/Mexicano leaderboard privacy.
 * Functional DOM harness and build-source isolation without browser dependencies.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const showdown=fs.readFileSync('public/modes/club-match/v097/index.html','utf8');
const legacy=fs.readFileSync('public/modes/club-match/index.html','utf8');
const id='<script id="p5-leaderboard-privacy">';
assert.equal(html.split(id).length-1,1,'Privacy controller installed once in shared Americano/Mexicano page');
const start=html.indexOf(id)+id.length,end=html.indexOf('</script>',start);
assert(end>start,'Controller script ends properly');
const js=html.slice(start,end);
new vm.Script(js,{filename:'p5-leaderboard-privacy.js'});
assert(html.includes('P5 LEADERBOARD PRIVACY v1.5'),'Privacy CSS installed');
assert(html.includes('#americano .p5-b41-leaderboard.p5-lb-private> :not(.row.between)'),'Only the leaderboard body can be blurred');
assert(html.includes('filter:blur(7px)!important'),'Blur must remain a visible effect');
assert(html.includes('min-height:40px!important'),'Mobile toggle must remain touch friendly');
assert(!/localStorage|sessionStorage|fetch\(|XMLHttpRequest|state\.|scoreMatch|save\(/.test(js),'Privacy must never write session/engine state or send network data');
assert(!showdown.includes(id)&&!legacy.includes(id),'Team Showdown shells must remain unchanged');
function cls(){
 const set=new Set();
 return {contains:x=>set.has(x),add:x=>set.add(x),remove:x=>set.delete(x),
  toggle:(x,force)=>{const apply=force===undefined?!set.has(x):!!force;apply?set.add(x):set.delete(x);return apply;}};
}
function node(){
 return {dataset:{},children:[],attrs:new Map(),classList:cls(),listeners:{},innerHTML:'',
  addEventListener(k,fn){this.listeners[k]=fn;},
  appendChild(child){this.children.push(child);child.parentNode=this;return child;},
  hasAttribute(k){return this.attrs.has(k);},
  setAttribute(k,v){this.attrs.set(k,String(v));},
  removeAttribute(k){this.attrs.delete(k);},
  getAttribute(k){return this.attrs.get(k)??null;},
  querySelector(sel){if(sel==='.p5-lb-privacy-toggle')return this.children.find(c=>c.className==='p5-lb-privacy-toggle')||null; return null;}
 };
}
function cardFactory(){
 const card=node(),head=node(),table=node(),footer=node();
 head.className='row between';
 head.children.push({text:'LEADERBOARD'});
 table.textContent='Frans & Fred 3–0–0 15';
 footer.textContent='Wins → Diff → Points';
 card.children=[head,table,footer];
 card.querySelector=sel=>sel===':scope > .row.between'?head:null;
 return {card,head,table,footer};
}
let active=cardFactory(),observeCallback=null,events=0;
const root={querySelector(sel){assert.equal(sel,'.p5-b41-leaderboard');return active.card;}};
const ctx={
 document:{getElementById:x=>x==='americano'?root:null,createElement:tag=>{assert.equal(tag,'button');return node();}},
 MutationObserver:class {constructor(cb){observeCallback=cb;}observe(target,opts){assert.equal(target,root);assert.equal(opts.subtree,true);assert.equal(opts.childList,true);}},
 queueMicrotask:fn=>fn(),
 console
};
vm.runInNewContext(js,ctx,{timeout:2000});
assert.equal(active.head.children.filter(x=>x.className==='p5-lb-privacy-toggle').length,1);
let button=active.head.querySelector('.p5-lb-privacy-toggle');
assert.equal(button.getAttribute('aria-label'),'Hide Leaderboard');
assert.equal(button.getAttribute('aria-pressed'),'false');
assert.equal(active.card.classList.contains('p5-lb-private'),false);
button.listeners.click({stopPropagation(){events++;}});
assert.equal(events,1);
assert.equal(active.card.classList.contains('p5-lb-private'),true);
assert.equal(active.table.hasAttribute('inert'),true,'Hidden leaderboard must be noninteractive');
assert.equal(active.footer.hasAttribute('inert'),true);
assert.equal(active.table.textContent,'Frans & Fred 3–0–0 15','Rankings remain unchanged under blur');
assert.equal(button.getAttribute('aria-label'),'Show Leaderboard');
assert.equal(button.getAttribute('aria-pressed'),'true');
button.listeners.click({stopPropagation(){events++;}});
assert.equal(active.card.classList.contains('p5-lb-private'),false);
assert.equal(active.table.hasAttribute('inert'),false);
assert.equal(active.footer.hasAttribute('inert'),false);
assert.equal(button.getAttribute('aria-label'),'Hide Leaderboard');
// Hide, then replace the leaderboard DOM to simulate a Mexicano round refresh.
button.listeners.click({stopPropagation(){}});
active=cardFactory();
observeCallback();
button=active.head.querySelector('.p5-lb-privacy-toggle');
assert(button,'Toggle is remounted after a leaderboard redraw');
assert.equal(active.card.classList.contains('p5-lb-private'),true,'Concealed state persists when a mode rerenders');
assert.equal(active.table.hasAttribute('inert'),true);
button.listeners.click({stopPropagation(){}});
assert.equal(active.card.classList.contains('p5-lb-private'),false);
assert.equal(active.table.hasAttribute('inert'),false);
console.log('PASS First Edition v1.5 leaderboard Hide/Show: reversible blur, accessible button, rerender persistence, no engine/state/report changes');
