'use strict';
const fs=require('node:fs');const s=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const term of ['function standing(s)','function standings(','function nameOf(','function playerName(','function hydrate(','function load(','function init(','function render(','P5App=','function validateSchedule(','function saveScore(','const KEY=', 'function leaderboard(']){
 const i=s.indexOf(term);console.log('===' +term+' index='+i+' ===');if(i>=0)console.log(s.slice(i,i+11000).slice(0,term==='function standing(s)'?10500:term==='function load('?6500:term==='function init('?5000:2500));
}
