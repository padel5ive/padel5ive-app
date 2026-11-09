const fs=require('fs');
const text=fs.readFileSync('public/index.html','utf8');
const patterns=['viewport-fit','meta name="viewport"','#p54-resume','p54-resume','p541-venue','p541-home-actions','p541-home-actions::','p541-home-actions:','portal.portal','p541-home-actions .resume','p541-venue::after','p541-venue:after','p541-venue::before','p541-venue:before','100svh','100dvh','::after{content','body:has('];
console.log('TOTAL '+text.length+' BYTES');
for(const pattern of patterns){
 const arr=[];let p=-1;while((p=text.indexOf(pattern,p+1))>=0&&arr.length<80)arr.push(p);
 console.log('=='+pattern+' MATCHES '+arr.length+' '+arr.slice(0,15).join(','));
 const n=['#p54-resume','p54-resume','p541-venue','p541-home-actions','100svh','100dvh'].includes(pattern)?12:4;
 for(const pos of arr.slice(-Math.min(n,arr.length))){
   const start=Math.max(0,pos-400),end=Math.min(text.length,pos+800);
   const chunk=text.slice(start,end);
   // Embedded binary image data may be enormous; summaries are text-only.
   console.log('HIT '+pattern+' '+pos+'\\n'+chunk.replace(/data:image\\/[a-z]+;base64,[A-Za-z0-9+/=]{200,}/g,'[image data omitted]').slice(0,1600)+'\\n--END');
 }
}
const css=[...text.matchAll(/<style\\b[^>]*>([\\s\\S]*?)<\\/style>/gi)];
console.log('STYLE COUNT '+css.length);
for(const m of css){
 const s=m[1]; const picks=[...s.matchAll(/([^{}]{0,180}\\{[^{}]{0,900}\\})/g)].map(v=>v[1]).filter(v=>/(#p54-resume|#portal.*p541-venue|#portal.*p541-home-actions|\\.signature|#portal\\.portal)/.test(v));
 for(const q of picks.slice(-80)){if(q.length>1000)continue;console.log('RULE '+q.replace(/\\s+/g,' ').slice(0,1000))}
}
