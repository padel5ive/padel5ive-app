'use strict';
const fs=require('node:fs');
for(const file of ['public/modes/unified/index.html','public/modes/club-match/index.html','public/phase58/cloud-session.css','public/phase58/cloud-dashboard.js']){
 const s=fs.readFileSync(file,'utf8');console.log('\n===== FILE '+file+' '+s.length+' =====');
 for(const term of [
  'MENU & SETTINGS','Menu & Settings','menu-settings','p5-menu','p5-v2-nav','LEADERBOARD','SCOREBOARD','GAME MODE','ROUND NAVIGATION','ROUND','ROUND 0','p58-view-only','p58-cloud-connected','p58-cloud','p5-52-registration','p5-b32-dashboard','p5-v2-dashboard','p5-v2-split','p5-v2-score','p5-v2-leaderboard','p5-52-dashboard','p5-stage','p5-50','<aside','<main','<section','function dash(', 'function dashboard(', 'function renderDashboard(','function render(', 'function menu(','function settings(', 'p5-dashboard','control-panel','leaderboard-panel','scoreboard-panel',
 ]){
 let n=0,a=[],p=-1;while((p=s.indexOf(term,p+1))>=0){n++;if(a.length<4)a.push(p)}
 if(n){console.log('TERM '+JSON.stringify(term)+' COUNT '+n+' POS '+a.join(','));for(const i of a.slice(0,term==='ROUND'||term==='<section'?0:2))console.log('SNIP '+JSON.stringify(term)+' @'+i+' '+s.slice(Math.max(0,i-250),i+650).replace(/\n/g,' '));}
 }
}
