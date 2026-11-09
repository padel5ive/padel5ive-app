/* Read-only embedded master audit: Home resume visibility and Arriving/Reshuffle scope. */
const fs=require('node:fs');
function slices(name,file,terms,limit=18,before=200,after=600){
 const s=fs.readFileSync(file,'utf8');
 console.log('\n==== '+name+' byteLength '+s.length);
 for(const term of terms){
  console.log('\n-- '+term+' --');
  let at=0,n=0,tot=0;
  while((at=s.toLowerCase().indexOf(term.toLowerCase(),at))!==-1){
   tot++;
   if(n++<limit)console.log('OFFSET '+at+' '+s.slice(Math.max(0,at-before),Math.min(s.length,at+after)).replace(/\n{3,}/g,'\n\n').slice(0,before+after));
   at+=term.length||1;
  }
  console.log('TOTAL_MATCHES '+term+' '+tot);
 }
}
slices('Home','public/index.html',['p54-resume','Resume ·','resumeSession','resumeLabel','champion','p541-home-actions'],8,200,350);
slices('Unified','public/modes/unified/index.html',['reshuffle','arriving','arrival','Shuffle Round 1','shuffle-round','reshuffle-round','data-act="reshuffle"','round===0','round===1'],13,220,450);
