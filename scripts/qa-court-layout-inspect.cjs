'use strict';
const fs=require('node:fs');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const [label,start,end] of [
 ['COURT CHANGE',' function changeCourt(', ' function resetStage1('],
 ['NEXT ROUND',' function nextRound(', ' function showBalance('],
 ['STAGE1 UI',' function stage1(s)', ' function finished('],
 ['RECOVERY','window.P5Recovery=', 'window.P5EngineRegistry='],
 ['MODE REGISTRY','window.P5EngineRegistry=', 'window.P5UI=']
]){
 let a=html.indexOf(start);let b=html.indexOf(end,a+start.length);
 console.log('===== '+label+' start='+a+' end='+b+' =====');
 if(a>=0){let txt=html.slice(a,b>a?b:Math.min(a+15000,html.length));console.log(txt.slice(0,label==='RECOVERY'?20000:label==='MODE REGISTRY'?12500:label==='STAGE1 UI'?14000:30000).replace(/data:image\/[^\s"']+/g,'[INLINE-IMAGE]'))}
}
for(const p of ['p5-v26-session-control','session-history','p5-v24-arrival','class="stage1','<aside>','p5-v26-session-control']){
 const a=html.indexOf(p);console.log('CSS_ANCHOR '+p+' '+a+' '+(a>=0?html.slice(Math.max(0,a-800),a+900):''));
}
