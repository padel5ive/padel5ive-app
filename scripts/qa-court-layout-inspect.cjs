'use strict';
const fs=require('node:fs'),s=fs.readFileSync('public/modes/unified/index.html','utf8');
function show(label,a,b,max){let i=s.indexOf(a),j=b?s.indexOf(b,i+a.length):Math.min(s.length,i+(max||5000));console.log('### '+label+' @'+i);if(i>=0)console.log(s.slice(i,Math.min(j>i?j:s.length,i+(max||10000))))}
show('nextRound',' function nextRound(',' function showBalance(',9000);
show('fillEmptyCourts',' function fillEmptyCourts(',' function nextRound(',2500);
show('extendRecovery',' function extend(s,random){',' function fillVacantIndividual(',3500);
show('current-mode stage1','function stage1(s){','function homeExistingSessions(s){',7500);
show('event dispatch','case \'next-round\'','case \'',2600);
show('advanced make round',' function makeRound(s,rounds,random)',' function ',3000);
for(const t of ['case \'next-round\'','case \'advance-schedule\'','case \'fill-empty-court\'','function flexibleRoundScoring(']){let at=s.indexOf(t);console.log('### '+t+'\n'+s.slice(Math.max(0,at-150),at+450));}
