/* Team Showdown v0.9.7 · exact Classic-master reporting shell/source parity QA.
 * Run AFTER npm run build; never publishes content or touches original engine.
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const h=read('public/results/showdown/index.html');
const v=read('public/results/showdown/v097/index.html');
const native=read('public/modes/club-match/v097/index.html');
const legacy=read('public/modes/club-match/index.html');
const originalJS=read('public/assets/p5-showdown-results-v5514.js');
const adaptedJS=read('public/v097/showdown-results-master.js');
const pdf=read('public/assets/p5-direct-pdf.js');
const routes=read('netlify.toml');
const builtEngine=read('public/v097/showdown-engine.js');
const sourceEngine=[...native.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
 .filter(m=>!/\bsrc\s*=/.test(m[1])&&m[2].includes('root.ClubEngine=engine')&&m[2].includes('function individualStats('));
assert.equal(sourceEngine.length,1,'v097 engine must exist exactly once');
assert.equal(crypto.createHash('sha256').update(sourceEngine[0][2]).digest('hex'),
 crypto.createHash('sha256').update(builtEngine).digest('hex'),'report and native game must run byte-identical engines');
const expected=h
 .replace('src="/assets/p5-showdown-engine.js"','src="/v097/showdown-engine.js"')
 .replace('src="/assets/p5-showdown-results-v5514.js"','src="/v097/showdown-results-master.js"');
assert.equal(v,expected,'Classic master result DOM/CSS/assets must remain byte-for-byte identical except script URLs');
assert(originalJS.includes('const match=location.pathname.match(/^\\/r\\/'),'original Classic master report must remain in place');
assert(adaptedJS.includes('const match=location.pathname.match(/^\\/(?:ts|i)\\/'),'v097 must support /ts/ and legacy /i/');
assert(adaptedJS.includes("const individual=data.setup.competitionFormat==='individual'"),'Individual source mapping missing');
assert(adaptedJS.includes("formatPair('A',m.a2)"),'Individual second partner A missing');
assert(adaptedJS.includes("formatPair('B',m.b2)"),'Individual second partner B missing');
assert(adaptedJS.includes("m[pair.team==='A'?'a2':'b2']"),'Individual analysis match list missing second teammate');
assert(adaptedJS.includes('opponentName(m,pair)'), 'Individual opponent analysis not mapped');
assert(adaptedJS.includes("label.textContent='PLAYERS'"),'Individual report player count label missing');
assert(!adaptedJS.includes('localStorage.getItem('),'Public results must not read private local sessions');
assert(!adaptedJS.includes('sessionStorage.getItem('),'Public results must not read viewer session state');
assert(native.includes("if(typeof window.P5DirectPDF==='undefined'){throw Error('Classic master PDF renderer is unavailable');}"),'No alternate PDF generator or iOS Print fallback');
assert(!native.includes("printReport();notify('Division-separated report opened"),'Separate Multi/Individual print path forbidden');
assert(native.includes('P5DirectPDF.exportShowdown(showdownReportData())'),'Must use canonical Classic direct PDF export');
assert(pdf.includes('function renderShowdown(d)')&&pdf.includes('function sdCover(d,')&&pdf.includes('function sdFinal(d,')&&pdf.includes('function sdLedger(d,'),'Canonical PDF generator must preserve cover/final/ledger');
assert(pdf.includes('SD_MATCHES_PER_PAGE')&&pdf.includes('return Object.freeze({render,exportPDF,renderShowdown,exportShowdown});'),'PDF component from certified master');
assert(native.includes("new URL('/ts/'+encodeURIComponent("),'Native share must publish new /ts/ result path');
assert.equal(routes.split('to = "/results/showdown/v097/index.html"').length-1,2,'Legacy /i/ and current /ts/ must both open Classic-master page');
assert(routes.includes('to = "/results/showdown/index.html"'),'Original /r/ master untouched');
assert(legacy.includes('v5.5.16')&&!legacy.includes('padel5ive-team-showdown-v090-individual-lab'),'Legacy master unchanged');
for(const [id,src] of [['engine',builtEngine],['report',adaptedJS]])new vm.Script(src,{filename:id+'.js'});
const E={exports:{}};vm.runInNewContext(builtEngine,{module:E,console,Math,Date,Set,Map,Array,Number,JSON,Intl,Uint8Array,Uint16Array,Float64Array,Int16Array,Int32Array}, {timeout:10000,filename:'v097-master-engine.js'});
assert.equal(typeof E.exports.stage1Stats,'function');
assert.equal(typeof E.exports.verdict,'function');
assert.equal(typeof E.exports.stage1DivisionStandings,'function');
console.log('PASS v0.9.7 Classic master parity: exact HTML/CSS/assets, live native engine, shared report JS, canonical PDF and /ts/ read-only routing');
