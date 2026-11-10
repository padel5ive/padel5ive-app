'use strict';
const fs=require('node:fs');
for(const [path,needles] of [
 ['public/modes/unified/index.html',["case 'round':","case 'tab-stage1':","case 'tab-stage2':","case 'bracket-nav':","case 'view-schedule':","case 'jump-ko-courts':","case 'next-round':","case 'score':","case 'toggle-menu':","case 'open-menu':"]],
 ['public/modes/club-match/index.html',["case 'view-round':","case 'toggle-rounds':","case 'latest-round':","case 'jump-stage':","case 'filter-leaderboard':","case 'view-final-verdict':","case 'jump-leaderboard':","case 'back-stage1':","case 'reopen-stage1':","case 'edit-stage1-result':"]]]){
 const s=fs.readFileSync(path,'utf8');console.log('==FILE '+path+'==');
 for(const needle of needles){
  const positions=[];let at=-1;while((at=s.indexOf(needle,at+1))!==-1){positions.push(at);}
  console.log('TERM '+needle+' COUNT '+positions.length);
  for(const i of positions.slice(-2)){console.log('CONTEXT '+needle+' @ '+i+'\n'+s.slice(Math.max(0,i-280),Math.min(s.length,i+1800))+'\nENDCONTEXT');}
 }
}
