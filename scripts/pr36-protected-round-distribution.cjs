'use strict';
// PR36: preserve viable unscheduled fixtures for open rounds before scored/locked fixtures.
// This fixes a real PR29 fallback gap; original confirmed rounds remain untouched.
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 PROTECTED ROUND DISTRIBUTION: reserve a future fixture before compaction */';
if(html.includes(marker)){console.log('PASS PR36 protected round distribution already installed');process.exit(0);}
if(!html.includes('/* P5-PR29-PROTECTED-COURT-RESCHEDULING */')||!html.includes('p5CapacityRebuildUnscoredFuture'))
 throw Error('PR29/PR36 scheduling baseline missing');
const fnStart=html.indexOf(' function p5ProtectedCourtReschedule('),fnEnd=html.indexOf(' function nextRound(',fnStart);
if(fnStart<0||fnEnd<=fnStart)throw Error('PR29 fallback function source changed');
const functionText=html.slice(fnStart,fnEnd);
const old='   const cap=Math.min(limit,available,todo.length);';
if(functionText.split(old).length!==2)throw Error('Expected unique PR29 greedy-capacity expression not found');
const updated=functionText.replace(old,`   ${marker}
   // Fill each eligible court while reserving a minimum of one fixture for
   // every future unscored round that precedes a protected/confirmed round.
   // Prevents a mid-tournament void after a 2-to-3 court expansion.
   // When all protected rounds are behind us, no reservation applies.
   const cap=Math.min(limit,available,Math.max(1,todo.length-futureOpen));`);
html=html.slice(0,fnStart)+updated+html.slice(fnEnd);
fs.writeFileSync(file,html);
console.log('PASS PR36 protected distribution: maximize court use without empty gaps before locked rounds');
