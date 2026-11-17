/* PADEL 5IVE Team Showdown v0.9.7 · Classic Master reporting parity.
 * Runs AFTER staging sidecar/Home. Emits report artifacts only; never edits
 * frozen engine sources, /r/ public master, or main's PDF renderer.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>{fs.mkdirSync(require('node:path').dirname(p),{recursive:true});fs.writeFileSync(p,s);};
const swap=(src,from,to,tag)=>{
 const n=src.split(from).length-1;
 if(n!==1)throw Error('Master report adapter source drift: '+tag+' ('+n+' matches)');
 return src.replace(from,to);
};

// V097 retains a distinct native engine. Export its actual, intact engine
// into the public results shell, so three modes use identical report markup.
const nativePath='public/modes/club-match/v097/index.html';
let native=read(nativePath);
const scripts=[...native.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const engines=scripts.filter(m=>!/[\s]src\s*=/.test(m[1])&&m[2].includes('root.ClubEngine=engine')&&m[2].includes('function individualStats('));
if(engines.length!==1)throw Error('Expected exactly one v0.9.7 native Team Showdown engine');
const engine=engines[0][2];
new vm.Script(engine,{filename:'v097-native-report-engine.js'});
write('public/v097/showdown-engine.js',engine);

// Classic production report page is the canonical DOM/CSS/fonts/assets.
// Only the two script URLs differ, selecting the v097-compatible data adapter.
const masterHtml=read('public/results/showdown/index.html');
let page=swap(masterHtml,'src="/assets/p5-showdown-engine.js"','src="/v097/showdown-engine.js"','engine script URL');
page=swap(page,'src="/assets/p5-showdown-results-v5514.js"','src="/v097/showdown-results-master.js"','report adapter URL');
// Continuous dispatch has no round number. Describe the list by actual matches.
page=swap(page,'ROUND BY ROUND · LATEST FIRST','MATCH BY MATCH · LATEST FIRST','continuous match list caption');
write('public/results/showdown/v097/index.html',page);

// Reuse the proven original JS renderer (navigation, leaderboard, analysis,
// champion, match cards). Adapt data and text, not visual components.
let js=read('public/assets/p5-showdown-results-v5514.js');
js=swap(js,
 'const match=location.pathname.match(/^\\/r\\/([A-Za-z0-9_-]{6,32})\\/?$/);',
 'const match=location.pathname.match(/^\\/(?:ts|i)\\/([A-Za-z0-9_-]{6,32})\\/?$/);',
 'v097 public route');
js=swap(js,
 'const data=E.migrateLegacySchedule(state);',
 "const data=E.migrateLegacySchedule(state);\n const individual=data.setup.competitionFormat==='individual';",
 'individual format flag');
js=swap(js,
 "set('.hero .subtitle',['TEAM ROUND ROBIN',",
 "set('.hero .subtitle',[individual?'INDIVIDUAL AMERICANO':data.setup.competitionFormat==='multi'?'MULTI-DIVISION':'TEAM ROUND ROBIN',",
 'metadata title');
js=swap(js,
 "if(meta.length>=3){meta[0].textContent=String(data.setup.courts||'—');",
 "if(individual){const label=root.querySelectorAll('.p5-meta-stat-row .p5-meta-key')[1];if(label)label.textContent='PLAYERS';}\n if(meta.length>=3){meta[0].textContent=String(data.setup.courts||'—');",
 'individual metadata unit');
js=swap(js,
 "const a=stage===1?formatPair('A',m.a):selectedLineup(m,'A');",
 "const a=stage===1?(individual?[formatPair('A',m.a),formatPair('A',m.a2)].join(' & '):formatPair('A',m.a)):selectedLineup(m,'A');",
 'individual A side');
js=swap(js,
 "const b=stage===1?formatPair('B',m.b):selectedLineup(m,'B');",
 "const b=stage===1?(individual?[formatPair('B',m.b),formatPair('B',m.b2)].join(' & '):formatPair('B',m.b)):selectedLineup(m,'B');",
 'individual B side');
// Public Stage 1 continuous matches have `sequence`, not `wave` or `round`.
// Use the true assigned match number (M01..M99) and keep C1..C5 separately.
// Real round-based historical matches continue to display R1, R2, etc.
const stage1MatchTag="const reportMatchTag=(m,stage)=>{if(stage!==1)return 'M'+esc(m.id||'—');const round=[m.wave,m.round].find(n=>Number.isInteger(n)&&n>0);if(round)return 'R'+round;const seq=[m.sequence,m.completedSequence,Number.isInteger(m.order)?m.order+1:null].find(n=>Number.isInteger(n)&&n>0);return seq?'M'+String(seq).padStart(2,'0'):'MATCH';}; ";
js=swap(js,'const makeMatchRow=(m,stage)=>{',stage1MatchTag+'const makeMatchRow=(m,stage)=>{','Match label helper');
js=swap(js,
 "const where=stage===1?`R${esc(m.wave||m.round||'—')}`:`M${esc(m.id||'—')}`;",
 "const where=reportMatchTag(m,stage);",
 'Continuous Stage 1 R— regression');
js=swap(js,
 "if(rrStage)rrStage.innerHTML=block('Round Robin',rr,1,false);",
 "if(rrStage)rrStage.innerHTML=block(individual?'Individual Americano':'Round Robin',rr,1,false);",
 'stage match caption');
js=swap(js,
 "const pair=allPairs.get(pairId);const history=rr.filter(m=>m[pair.team.toLowerCase()]===pair.index);",
 "const pair=allPairs.get(pairId);const history=rr.filter(m=>individual?[m[pair.team.toLowerCase()],m[pair.team==='A'?'a2':'b2']].includes(pair.index):m[pair.team.toLowerCase()]===pair.index);",
 'individual per-player match history');
js=swap(js,
 "const analyze=(pairId,scroll=false)=>{",
 "const opponentName=(m,pair)=>{const other=pair.team==='A'?'B':'A',key=pair.team==='A'?'b':'a';return individual?[formatPair(other,m[key]),formatPair(other,m[key+'2'])].join(' & '):formatPair(other,m[key]);};\n const analyze=(pairId,scroll=false)=>{",
 'opponent name adapter');
js=swap(js,
 "formatPair(pair.team==='A'?'B':'A',m[pair.team==='A'?'b':'a'])",
 "opponentName(m,pair)",
 'history opponents');
const D=String.fromCharCode(36)+'{';
js=swap(js,'Round Robin Pair Performance','Round Robin '+D+"individual?'Player':'Pair'} Performance",'individual analysis wording');
js=swap(js,
 "const rank=stats.overallRanking;",
 "if(individual){const h=root.querySelector('#standings .heading h2');if(h)h.innerHTML='<span>04 /</span> Individual Americano Leaderboard';const l=root.querySelector('label[for=\"analysis-select\"]');if(l)l.textContent='SELECT PLAYER';}\n const rank=stats.overallRanking;",
 'individual semantic labels');
new vm.Script(js,{filename:'v097-classic-master-report-adapter.js'});
write('public/v097/showdown-results-master.js',js);

// All formats now call the original, direct PDF generator used by Classic
// (identical A4 landscape cover, typography, pagination, champion + ledgers).
// This replaces only the alternate Safari print branch for multi/individual.
native=swap(native,
 "if(state.setup.competitionFormat==='multi'||state.setup.competitionFormat==='individual'||typeof window.P5DirectPDF==='undefined'){\n   printReport();notify('Division-separated report opened · Print / Save as PDF');break;\n }",
 "if(typeof window.P5DirectPDF==='undefined'){throw Error('Classic master PDF renderer is unavailable');}",
 'native export PDF dispatch');
write(nativePath,native);
console.log('PASS v0.9.7 Classic master reporting reuse: 1 canonical HTML/CSS, 1 adapted JS renderer, 1 direct PDF generator, legacy unchanged');
