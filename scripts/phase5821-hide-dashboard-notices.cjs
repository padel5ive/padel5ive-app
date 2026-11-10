/* PADEL 5IVE v5.8.21 — remove TWO dashboard diagnostic notices,
 * for moderator AND view-only in every Unified Americano/Mexicano pairing.
 * Do not remove scheduler metadata, coach/fixed/sitout constraints, fairness
 * calculations, warnings in exports, or native court scoring logic.
 *
 * This is a surgical build transform: the two interpolation expressions are
 * deleted from the shared Stage 1 markup template, not hidden after render.
 * Safe to run repeatedly, including during integration regression tests.
 */
'use strict';
const fs=require('node:fs');
const path='public/modes/unified/index.html';
let src=fs.readFileSync(path,'utf8');
const removals=[
 {label:'Advanced Player Rules dashboard notice',
  needle:'ADVANCED PLAYER RULES · Locked partners remain together.',
  start:'${P5AdvancedRules.constrained(s)?',
  end:"</p>':''}"},
 {label:'Scheduling Fairness Review dashboard notice',
  needle:'SCHEDULING FAIRNESS REVIEW · ',
  start:'${rd?.fairnessWarnings?.length?',
  end:"</div>`:''}"}
];
let removed=0;
for(const item of removals){
 if(!src.includes(item.needle))continue;
 const n=src.split(item.needle).length-1;
 if(n!==1)throw Error('v5821: unexpected '+item.label+' count '+n);
 const pos=src.indexOf(item.needle);
 const from=src.lastIndexOf(item.start,pos);
 const close=src.indexOf(item.end,pos);
 if(from<0||close<0||close-pos>600||pos-from>150)
  throw Error('v5821: master markup drift at '+item.label);
 const to=close+item.end.length;
 const section=src.slice(from,to);
 if(!section.includes(item.needle)||!section.startsWith(item.start)||!section.endsWith(item.end))
  throw Error('v5821: unsafe Stage 1 notice removal: '+item.label);
 src=src.slice(0,from)+src.slice(to);
 removed++;
}
if(src.includes(removals[0].needle)||src.includes(removals[1].needle))
 throw Error('v5821: dashboard notices remain in Unified engine markup');
if(removed)fs.writeFileSync(path,src);
console.log('PASS v5.8.21 · Removed '+removed+' Stage 1 notice templates; scheduling and all roles preserved.');
