/* v5.8.3 cosmetic dashboard cleanup. No changes to scoring or engine scheduling. */
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const dollar=String.fromCharCode(36);
const tick=String.fromCharCode(96);
const fairnessStart=dollar+"{s.mode==='individual-americano'&&!P5AdvancedRules.constrained(s)?(()=>{const audit=P5EngineIndividual.fairness(";
const fairnessEnd="})():''}";
let begin=html.indexOf(fairnessStart);
if(begin>=0){
  if(html.indexOf(fairnessStart,begin+1)>=0)throw Error('Unexpected duplicate Fairness Review rendering');
  const finish=html.indexOf(fairnessEnd,begin);
  if(finish<0||finish-begin>1700)throw Error('Fairness Review template changed unexpectedly');
  const removable=html.slice(begin,finish+fairnessEnd.length);
  if(!removable.includes('FAIRNESS REVIEW · Preplanned sequence:')||!removable.includes('FAIRNESS CHECK · No consecutive rest'))throw Error('Fairness Review display mismatch');
  html=html.slice(0,begin).replace(/ +$/,'')+html.slice(finish+fairnessEnd.length);
}else if(html.includes('FAIRNESS REVIEW · Preplanned sequence:'))throw Error('Unrecognized Fairness Review rendering remains');
const courtInfoStart='const courtInfo='+tick+'<div class="p5-v26-utilization"';
const courtInfoEnd='</div>'+tick+';';
begin=html.indexOf(courtInfoStart);
if(begin>=0){
  if(html.indexOf(courtInfoStart,begin+1)>=0)throw Error('Unexpected duplicate Court Utilization');
  const finish=html.indexOf(courtInfoEnd,begin);
  if(finish<0||finish-begin>1000)throw Error('Court Utilization template changed unexpectedly');
  const removable=html.slice(begin,finish+courtInfoEnd.length);
  if(!removable.includes('COURT UTILIZATION · ROUND')||!removable.includes('spare courts remain available'))throw Error('Court Utilization display mismatch');
  html=html.slice(0,begin)+"const courtInfo='';"+html.slice(finish+courtInfoEnd.length);
}else if(!html.includes("const courtInfo='';"))throw Error('Court Utilization source drift');
const cssLink='<link rel="stylesheet" href="/phase58/dashboard-clean-v583.css">';
if(!html.includes(cssLink)){
  const at=html.indexOf('</head>');
  if(at<0||at>html.indexOf('<body'))throw Error('Missing real document head for UI update');
  html=html.slice(0,at)+cssLink+'\n'+html.slice(at);
}
fs.writeFileSync(file,html);
console.log('v5.8.3 dashboard: fairness summary and court utilization omitted; Share link chevron CSS installed.');
