'use strict';
/* Structured Americano v2: post-build opt-in wrapper. Existing source masters
 * stay unchanged. The QA fails closed if any required integration is absent.
 */
const fs=require('node:fs');
const file='public/modes/unified/index.html';
const asset='/assets/p5-structured-matchmaking-v2.js';
const tag='<script src="'+asset+'"></script>';
const marker='<!-- P5 STRUCTURED MATCHMAKING V2 -->';
let html=fs.readFileSync(file,'utf8');
if(html.includes(marker)){
 if(html.split(marker).length!==2||html.split(tag).length!==2)
  throw Error('Duplicate Structured Matchmaking v2 integration');
 console.log('PASS Structured Matchmaking v2 already integrated');process.exit(0);
}
for(const required of [
 '<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->',
 '<!-- P5 STRUCTURED LATE RETURN DENSITY 20261112 -->',
 '/* PR36 PROTECTED ROUND DISTRIBUTION: reserve a future fixture before compaction */',
 'window.P5Structured=(function'
])if(!html.includes(required))throw Error('Structured Matchmaking v2 missing prerequisite: '+required);
if(!fs.existsSync('public'+asset))throw Error('Structured Matchmaking v2 asset not found');
// The UI controller performs a second fairness pass after P5Structured.rebuild
// on a late arrival or roster change. That pass can undo history-aware court
// matching. Reapply encounter diversity at the FINAL dispatch boundary,
// preserving the existing selected participants, partners and scored prefix.
const controllerNeedle="    if(P5CourtRotation.applies(s))P5CourtRotation.allocate(s,optimized,prefix);\n    s.rounds=prefix.concat(optimized);";
if(html.split(controllerNeedle).length!==2)throw Error('Structured final-round controller anchor changed');
html=html.replace(controllerNeedle,
 "    if(P5CourtRotation.applies(s))P5CourtRotation.allocate(s,optimized,prefix);\n"+
 "    /* PR52 STRUCTURED FINAL ENCOUNTER GUARD */\n"+
 "    const schedulingFinal=s.mode==='structured-americano'&&window.P5StructuredMatchmakingV2?\n"+
 "      window.P5StructuredMatchmakingV2.rebalanceFuture(s,prefix,optimized,random):optimized;\n"+
 "    s.rounds=prefix.concat(schedulingFinal);");
const last=html.lastIndexOf('</body>');
if(last<0||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(last)))
 throw Error('Missing document close for Structured Matchmaking v2');
html=html.slice(0,last)+marker+tag+'\n'+html.slice(last);
fs.writeFileSync(file,html);
console.log('PASS Structured Matchmaking v2 integrated after protected base modules');
