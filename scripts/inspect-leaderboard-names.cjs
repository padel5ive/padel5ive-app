'use strict';
const fs=require('node:fs'),s=fs.readFileSync('public/modes/unified/index.html','utf8');
const terms=['function standing(', 'function leaderboard(', 'p5-b41-leaderboard', 'leaderboard-name','data-act="player','data-act="leader','data-act="details','function standings('];
for(const q of terms){let i=s.indexOf(q),n=0;while(i>=0&&n++<4){console.log('\n### '+q+' @'+i+' / '+s.length);console.log(s.slice(Math.max(0,i-700),Math.min(s.length,i+2700)).replace(/data:image\/[^\s"']+/g,'[IMAGE]'));i=s.indexOf(q,i+q.length);}}
