/* v5.8.5 real DOM smoke, run after "npm install --no-save jsdom@26".
 * Validates native actions survive DOM movement and menus rerender safely.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const script=fs.readFileSync('public/phase585/menu-unified-v585.js','utf8');
const d=(name,text,body)=>'<details class="p5-b3-menu-section" data-submenu="'+name+'"><summary><span class="p5-4852-label">'+text+'</span></summary><div class="p5-4852-content">'+body+'</div></details>';
const c=(name,text,body)=>'<details class="p5-4852-section" data-menu-section="'+name+'"><summary><span class="p5-4852-label">'+text+'</span></summary><div class="p5-4852-content">'+body+'</div></details>';
const shareButtons='<button type="button" data-act="pdf-download" class="p5-4852-action p5-b31-menu-row">PDF<span aria-hidden="true">›</span></button><button type="button" data-act="share-result-link" class="p5-4852-action p5-b31-menu-row"><span class="p5-share-label-copy">Share<small>PIN</small></span><span aria-hidden="true">›</span></button>';
const uni=()=>d('roster','Manage Players & Courts','')+d('match','Match Management','')+d('share','Share & Export',shareButtons)+d('settings','Session Management','<section>Backup and Restore</section><button data-p58-cloud type="button">Cloud</button>')+d('settings','Advanced Settings','<button data-act="undo">Undo</button><button data-act="system-check">System Check</button>');
const club=()=>c('Manage Teams','Manage Teams','<button data-action="edit-roster">Edit</button>')+c('Manage Courts','Manage Courts','<select data-setting="court-count"></select><button data-action="apply-courts">Apply</button>')+c('Match Management','Match Management','<button data-action="reset-stage1">Reset</button>')+c('Share & Export','Share & Export','<button id="exportPdf" data-action="pdf">PDF</button><button id="shareResults" data-action="share"><span class="p5-share-label-copy">Share</span></button>');
const wait=()=>new Promise(r=>setTimeout(r,85));
async function checkUnified(){
 const html='<div id="americano"><section class="p5-4852-menu">'+uni()+'</section><section class="p5-b41-leaderboard"><div class="row between"><h2>LEADERBOARD</h2><span class="pill">LIVE</span></div></section><div class="p5-stage-head"><span class="pill">LIVE</span></div></div>';
 const dom=new JSDOM(html,{url:'https://example.test/modes/unified/',pretendToBeVisual:true,runScripts:'outside-only'});
 const doc=dom.window.document,root=doc.querySelector('.p5-4852-menu');
 const share=doc.querySelector('[data-act="share-result-link"]');let calls=0;share.addEventListener('click',()=>calls++);
 dom.window.eval(script);
 doc.dispatchEvent(new dom.window.Event('DOMContentLoaded',{bubbles:true}));
 await wait();
 assert.equal(root.children.length,3,'Unified must have three categories');
 assert.equal(root.lastElementChild.querySelector('summary .p5-4852-label').textContent,'Session & Results');
 assert.strictEqual(root.querySelector('[data-act="share-result-link"]'),share,'Share native button identity preserved');
 assert.strictEqual(root.querySelector('[data-p58-cloud]')?.textContent,'Cloud','Cloud control preserved');
 assert(root.querySelector('.p585-tools'),'Advanced Tools remains accessible');
 share.click();assert.equal(calls,1,'Live Share event survives move');
 assert(!doc.querySelector('.p5-b41-leaderboard .pill'),'Leaderboard LIVE removed');
 assert.equal(doc.querySelector('.p5-stage-head .pill')?.textContent,'LIVE','Header LIVE status untouched');
 root.innerHTML=uni();await wait();
 assert.equal(root.children.length,3,'Unified rerender must reconsolidate menu');
 dom.window.close();
}
async function checkClub(){
 const html='<div id="mainMenu"><div class="ops-actions"><section class="p5-4852-menu">'+club()+'</section><details class="mc32-advanced"><summary>Session Management</summary><div class="mc32-advanced-body"><button data-p58-cloud type="button">CLOUD SESSION</button></div></details><details class="mc32-advanced"><summary>Advanced Settings</summary><div class="mc32-advanced-body"><button data-action="backup">Backup</button><button data-action="restore">Restore</button></div></details></div></div>';
 const dom=new JSDOM(html,{url:'https://example.test/modes/club-match/',pretendToBeVisual:true,runScripts:'outside-only'});
 const doc=dom.window.document,root=doc.querySelector('.p5-4852-menu');
 const backup=doc.querySelector('[data-action="backup"]'),pdf=doc.querySelector('#exportPdf');let count=0;backup.addEventListener('click',()=>count++);
 dom.window.eval(script);
 doc.dispatchEvent(new dom.window.Event('DOMContentLoaded',{bubbles:true}));await wait();
 assert.equal(root.children.length,3,'Club must have three categories');
 assert.equal(root.firstElementChild.querySelector('summary .p5-4852-label')?.textContent,'Manage Players & Courts');
 assert(root.querySelector('[data-menu-section="Manage Teams"]'));
 assert(root.querySelector('[data-menu-section="Manage Courts"]'));
 assert(root.querySelector('[data-action="apply-courts"]'),'Courts controls must survive nesting');
 assert.strictEqual(root.querySelector('[data-action="backup"]'),backup,'Backup native action identity preserved');
 assert.strictEqual(root.querySelector('#exportPdf'),pdf,'PDF original button preserved');
 assert(root.querySelector('[data-action="restore"]'),'Restore action preserved');
 assert(root.querySelector('[data-p58-cloud]'),'Cloud launcher preserved');
 backup.click();assert.equal(count,1,'Backup original event survives move');
 assert(!doc.querySelector('.ops-actions > details.mc32-advanced'),'Legacy extra tabs removed');
 dom.window.close();
}
(async()=>{await checkUnified();console.log('PASS Unified 3-section and rerender DOM');await checkClub();console.log('PASS Club Match menu and native action DOM');})().catch(e=>{console.error(e);process.exitCode=1});
