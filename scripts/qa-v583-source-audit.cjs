const fs=require('node:fs');
for(const path of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
const s=fs.readFileSync(path,'utf8');console.log('FILE '+path+' '+s.length);
for(const term of ["const act=","function act(","function entry(","p5-share-label-copy","p5-4852-action-chevron","p5-4852-action::after","p5-4852-action >","p5-4852-content .p5-4852-action","p5-v26-utilization","p5-b2-fairness-warning","const courtInfo="]){
 let loc=-1,count=0;
 while((loc=s.indexOf(term,loc+1))>=0){
  if(count<4||((term==="p5-share-label-copy"||term==="p5-4852-action::after")&&loc>2e6)){
   console.log('NEEDLE '+term+' @'+loc+'\n'+s.slice(Math.max(0,loc-1100),Math.min(s.length,loc+1500))+'\n===END===');
  }
  count++;
 }
 console.log('COUNT '+term+' '+count);
}
}
