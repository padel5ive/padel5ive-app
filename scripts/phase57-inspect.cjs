const fs=require('fs');
const files=['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html','public/assets/p5-reporting-foundation.js','public/assets/p5-interactive-results.js','netlify/functions/unified-results.mjs'];
const pats={
'public/index.html':['START NEW SESSION','Existing Sessions','Restore Backup JSON','Game Date','Start New Session','P5PreviewLaunch','localStorage','p5-home','p5-session','data-mode','date','type="time"'],
'public/modes/unified/index.html':['Restore Backup JSON','Existing Sessions','Start New Session','Session History','Session Management','sessionName','gameDate','gameTime','sessionDate','localStorage','P5ReportUI.openShare','P5DirectPDF','champion reveal','Runner-Up','OFFICIAL CHAMPION','function saveSession','sessionHistory','backup','p5-session'],
'public/modes/club-match/index.html':['P5ReportUI.openShare','sessionName','gameDate','gameTime','OFFICIAL CHAMPION'],
'public/assets/p5-reporting-foundation.js':['openShare','makePayload','date','time','window.P5ReportUI'],
'public/assets/p5-interactive-results.js':['Session','Game Date','data.date','date','final','render('],
'netlify/functions/unified-results.mjs':['GET','method','read','blob','headers','request','payload']
};
for(const f of files){
 const s=fs.readFileSync(f,'utf8');
 console.log('===FILE '+f+' len='+s.length+' lines='+s.split('\n').length+'===');
 for(const pattern of pats[f]){
  const needle=pattern.toLowerCase(); let start=0, count=0;
  const total=s.toLowerCase().split(needle).length-1;
  console.log('PATTERN '+JSON.stringify(pattern)+' total='+total);
  while(count<3){
   const i=s.toLowerCase().indexOf(needle,start);
   if(i<0)break;
   let a=Math.max(0,i-220),b=Math.min(s.length,i+pattern.length+360);
   console.log('  @'+i+' '+JSON.stringify(s.slice(a,b)).slice(0,1050));
   start=i+pattern.length; count++;
  }
 }
 if(f.includes('/index.html')){
   for(const m of s.matchAll(/<(?:input|button|select|section|nav|dialog)[^>]{0,350}>/gi)){
    if(/session|date|time|restore|backup|champion|history|existing/i.test(m[0]))console.log('TAG '+m[0].slice(0,380));
   }
 }
}
