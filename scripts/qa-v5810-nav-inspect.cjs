'use strict';
const fs=require('node:fs');
for(const path of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const s=fs.readFileSync(path,'utf8');
 console.log('\n=== '+path+' '+s.length+' ===');
 const r=/<(?:button|a|select|input)\b[^>]{0,1300}>/gmi;let match;const found=new Map();
 while((match=r.exec(s))!==null){
  const item=match[0];
  if(!/round|history|stage|score|leaderboard|court|view|next|prev|nav|menu/i.test(item))continue;
  const act=(item.match(/data-(?:act|action|nav|role|target|round|view|round-nav|step)\s*=\s*["']([^"']+)/i)||[])[1]||'';
  const short=item.replace(/(?:style|class)=["'][^"']*["']/gi,'').slice(0,460);
  const key=act+'|'+short.replace(/[\d]+/g,'#').slice(0,180);
  if(!found.has(key))found.set(key,{act,tag:short,pos:match.index});
 }
 const fsx=[...found.values()];
 console.log('BUTTONS '+fsx.length);
 for(const x of fsx.slice(0,170))console.log('BTN '+x.pos+' '+x.act+' '+x.tag);
 for(const needle of ['prev-round','next-round','previous-round','round-prev','round-next','round-nav','go-round','view-round','select-round','data-act="round','data-action="round','data-round','history-round','roundIndex','roundIdx','activeRound','roundCursor','currentRound','roundDrawerOpen','inspectedRound','leaderboardFilter','p58-view-only']){
  let at=-1, count=0, loc=[];
  while((at=s.indexOf(needle,at+1))>=0){count++;if(loc.length<20)loc.push(at)}
  if(count){
   console.log('TERM '+needle+' count '+count+' at '+loc.join(','));
   for(const i of loc.slice(0,4))console.log('CTX '+needle+' '+i+' '+s.slice(Math.max(0,i-340),Math.min(s.length,i+560)).replace(/\n/g,' '));
  }
 }
}
