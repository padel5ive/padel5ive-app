'use strict';
const fs = require('node:fs');
const file = 'public/modes/unified/index.html';
let html = fs.readFileSync(file, 'utf8');
const marker = '<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->';
const assets = [
  'p5-structured-fairness-lab.js',
  'p5-structured-irregular-lab.js',
  'p5-structured-mexicano-diversity-lab.js',
  'p5-ko-qualification-sitout-guard.js',
  'p5-mexicano-individual-opening-lab.js',
  'p5-coach-opponent-diversity-lab.js',
  'p5-structured-opponent-diversity-v1.js'
];
const insert = marker + assets.map(name => '<script src="/assets/' + name + '"></script>').join('');
if (!html.includes('window.P5StructuredCycle534=') ||
    !html.includes('window.P5StructuredMX534=') ||
    !html.includes('window.P5Fair532=')) {
  throw Error('Structured engine baseline missing; integration aborted');
}
for (const name of assets) {
  if (!fs.existsSync('public/assets/' + name)) throw Error('Missing lab asset: ' + name);
}
// PDF renderer contains a literal </body> inside embedded JavaScript.
// Always inject at the LAST document-level </body>, never the first occurrence.
const close = html.lastIndexOf('</body>');
if (close < 0 || !/^<\/body>\s*<\/html>\s*$/i.test(html.slice(close))) {
  throw Error('Dashboard document closing body/html tags missing');
}
const occurrences = html.split(marker).length - 1;
if (occurrences === 0) {
  html = html.slice(0, close) + insert + html.slice(close);
  fs.writeFileSync(file, html, 'utf8');
} else if (occurrences !== 1) {
  throw Error('Duplicate structured lab injection marker');
}
const lastBody = html.lastIndexOf('</body>');
if (html.slice(lastBody - insert.length, lastBody) !== insert) {
  throw Error('Structured lab scripts not immediately before final body close');
}
console.log('PASS: Structured lab scripts inserted once at final HTML body, outside embedded JS/PDF templates.');
// Stage 2 hard safety: the default qualification set already excludes Sit Out,
// but manual qualifier toggling previously allowed those participants back in.
// Enforce the rule in both the UI action and the canonical KO start API.
function installGuard(original, guarded, label) {
  if (html.includes(guarded)) return;
  const occurrences = html.split(original).length - 1;
  if (occurrences !== 1) throw Error('Expected one '+label+' insertion site, found '+occurrences);
  html = html.replace(original, guarded);
  fs.writeFileSync(file, html, 'utf8');
}
// Locked KO engine stays byte-identical. The separate asset wraps only its public start() API.
// Fixed Partner Mexicano opening draw must be shuffled; ranking is meaningful
// only AFTER confirmed results. Never modify the restored/prior round pathway.
const mxOpening = "  const byId=new Map(standings.map((x,i)=>[x.id,{...x,rank:i}]));";
const mxRandomized = [
 "  /* PR34 FIXED MEXICANO RANDOM OPENING */",
 "  if((state.rounds||[]).length===0){",
 "   const shuffled=eligible.slice();",
 "   for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}",
 "   const players=shuffled.slice(0,2*cap);",
 "   const matches=Array.from({length:cap},(_,court)=>({",
 "    id:'R0C'+court,court:court+1,teams:[[players[2*court]],[players[2*court+1]]],score:null,confirmed:false",
 "   }));",
 "   return {index:0,eligibleIds:eligible.slice(),matches,openingRandomized:true};",
 "  }"
].join('\n')+'\n'+mxOpening;
installGuard(mxOpening,mxRandomized,'Fixed Partner Mexicano randomized opening round');

const koToggle = "const selected=new Set(m.selectedIds),group=pairedIds(id),enable=!group.every(pid=>selected.has(pid));";
installGuard(koToggle,
 koToggle+"\n  if(enable&&group.some(pid=>(s.sitout||[]).includes(pid)))return toast('Sit Out participants cannot qualify for KO. Return Active first.');",
 'KO qualification UI');
console.log('PASS: KO Sit Out qualification guarded in UI and external adapter; locked KO untouched.');

