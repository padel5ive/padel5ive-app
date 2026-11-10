const fs=require('node:fs');
const paths=['public/modes/unified/index.html','public/modes/club-match/index.html'];
for(const path of paths){
 const s=fs.readFileSync(path,'utf8');
 console.log('==== FILE '+path+' bytes '+s.length);
 const terms=['registration','player registration','pair registration','advanced settings','flexible','coach','ADD PLAYER','ADD PAIR','STAGE 1','pair-list','roster','register','function reg','function registration','p5-reg','p5-advanced'];
 for(const term of terms){
  const positions=[];let x=-1;while((x=s.toLowerCase().indexOf(term.toLowerCase(),x+1))>=0&&positions.length<500)positions.push(x);
  console.log('TERM '+term+' COUNT '+positions.length+' LAST '+positions.slice(-8).join(','));
  const relevant=term==='registration'||term==='roster'||term==='register'||term==='STAGE 1'?positions.slice(-2):positions.slice(-5);
  for(const p of relevant)console.log('SNIPPET '+term+' @'+p+' '+JSON.stringify(s.slice(Math.max(0,p-570),Math.min(s.length,p+1100))).slice(0,2100));
 }
}
