'use strict';const fs=require('node:fs');
for(const file of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const s=fs.readFileSync(file,'utf8');console.log('FILE',file);
 for(const [term,before,after] of [
 ['function stage1(s)',100,7800],['function stage1HTML()',100,8500],
 ['function finished(s)',100,3200],['function ko(s)',100,5000],
 ['function menu(s)',100,5500],['function render(s)',100,2500],
 ['function stage2HTML()',100,4800],
 ['class="p5-v26-flow',1300,1800],
 ['class="p5-v26-session-control"',1100,1100],
 ['class="p5-4852-menu"',200,1500],
 ['class="p5-b41-leaderboard"',50,1300],
 ['class="stage1-layout"',300,3500],
 ['class="round-navigation"',300,1100],
 ['class="global-dock"',300,1300]
 ]){let pos=s.indexOf(term);if(pos>=0){if(term==='class="p5-4852-menu"')pos=s.lastIndexOf(term);console.log('TERM',JSON.stringify(term),'@',pos,'SNIP',s.slice(Math.max(0,pos-before),pos+after).replace(/\n/g,' '));}}
}
