'use strict';const fs=require('node:fs');
for(const path of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const s=fs.readFileSync(path,'utf8');console.log('==FILE '+path+'==');
 for(const needle of ['menu-toggle','openMenu','closeMenu','toggleMenu','menu-open','menu-close','settings-toggle','toggle-settings','id="mainMenu"','id="menu','data-act="menu','data-action="menu','Menu & Settings','menu-btn','data-p58-cloud']){
  const pos=[];let at=-1;while((at=s.indexOf(needle,at+1))>=0){if(pos.length<10)pos.push(at)}
  console.log('TERM '+needle+' '+pos.join(','));for(const i of pos.slice(-3)){const v=s.slice(Math.max(0,i-350),Math.min(s.length,i+500));console.log('CONTEXT '+needle+' '+i+' '+v))}
 }
}
