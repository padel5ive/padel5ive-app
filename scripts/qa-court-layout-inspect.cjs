'use strict';
const fs=require('node:fs'),s=fs.readFileSync('public/modes/unified/index.html','utf8');
function print(label,first,last,max=12000){const i=s.indexOf(first),j=last?s.indexOf(last,i+first.length):-1;console.log('==== '+label+' offset '+i+' ===');console.log(s.slice(i,j>i?Math.min(j,i+max):i+max));}
print('SAVE SCORE', ' function saveScore(', ' function openHistoricalKO(', 13000);
print('SCORE MODAL', ' function scoreModal(', ' function openHistoricalKO(', 9500);
print('CURRENT DONE', ' function currentDone(', ' function ', 3500);
print('COURT CHANGE', ' function changeCourt(', ' function resetStage1(', 3500);
print('ROUND DISPATCH', "case 'advance-schedule'", "case '",2500);
print('STAGE1 ADVANCE BUTTON', 'Apply Pending Changes · Advance Schedule',null,700);
for(const word of ['saveScore()','changeCourt()','currentDone()','case \'modal-save\'','case \'score-save\'','case \'advance-schedule\'','data-act="advance-schedule"']){
 let at=s.indexOf(word);console.log('=== '+word+' === '+at+' '+(at>=0?s.slice(at-350,at+950):''));
}
