const fs=require('node:fs');
for(const p of ['public/modes/unified/index.html','public/modes/club-match/index.html','public/assets/p5-reporting-foundation.css']){
 const s=fs.readFileSync(p,'utf8');
 console.log('==== FILE '+p+' BYTES '+s.length);
 for(const term of ['FAIRNESS REVIEW','Fairness Review','fairness-review','consecutive-rest','COURT UTILIZATION','Court Utilization','court-utilization','Share Final Results Link','Share Results Link','ORGANIZER PIN','Organizer PIN','share-results','share-final','p5-v2-fair','p5-fairness']){
   const found=[];let x=0;
   while((x=s.indexOf(term,x))!==-1 && found.length<9){found.push(x);x+=term.length;}
   for(const i of found){
     console.log('TERM '+JSON.stringify(term)+' @'+i+' ---\n'+s.slice(Math.max(0,i-900),Math.min(s.length,i+1250)).replace(/\n{3,}/g,'\n\n')+'\n---END');
   }
 }
}