const fs=require('node:fs');
const text=fs.readFileSync('public/index.html','utf8');
const patterns=['viewport-fit','#p54-resume','p54-resume','p541-venue','p541-home-actions','#portal.portal','100svh','100dvh','background-attachment','backdrop-filter','::after','max-height','min-height'];
console.log('TOTAL '+text.length);
for(const pattern of patterns){
 const matches=[];let at=-1;
 while((at=text.indexOf(pattern,at+1))>=0 && matches.length<80)matches.push(at);
 console.log('TERM '+pattern+' COUNT '+matches.length+' POS '+matches.slice(0,12));
 for(const pos of matches.slice(0,8)){
  const raw=text.slice(Math.max(0,pos-240),Math.min(text.length,pos+540));
  console.log('AT '+pos+' '+JSON.stringify(raw).slice(0,1500));
 }
}
const sheets=[...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
console.log('STYLE BLOCKS '+sheets.length);
for(let i=0;i<sheets.length;i++){
 const css=sheets[i][1];
 const rules=[...css.matchAll(/([^{}]{0,185}\{[^{}]{0,550}\})/g)]
  .map(m=>m[1])
  .filter(x=>/#p54-resume|p541-venue|p541-home-actions|#portal\.portal|\.signature/.test(x));
 console.log('SHEET '+i+' RULES '+rules.length);
 for(const rule of rules.slice(0,50))console.log('RULE '+rule.replace(/\s+/g,' ').slice(0,735));
}
