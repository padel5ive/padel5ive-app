/* Temporary source inspection for PWA signature and viewport; used only in CI. */
'use strict';
const fs=require('node:fs');
const html=fs.readFileSync('public/index.html','utf8');
const anchors=['SIGNATURE GAME','signature-game','signature-game','p541-subtitle','p541-venue','#portal','p54-workspace'];
for(const needle of anchors){
 let indices=[],i=-1;
 while((i=html.indexOf(needle,i+1))!==-1&&indices.length<20)indices.push(i);
 console.log('ANCHOR',needle,'COUNT <=',indices.length);
 for(const off of indices.slice(0,12))console.log('SNIP',off,JSON.stringify(html.slice(Math.max(0,off-320),off+360).replace(/\s+/g,' ')));
}
const match=html.match(/<style[^>]*>[\s\S]*?<\/style>/g)||[];
console.log('INLINE STYLE BLOCKS',match.length);
for(const style of match){
 for(const needle of ['.masthead','.signature','#portal','.p54-workspace']){
  const re=new RegExp('(?:[^{}]{0,130})'+needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^{}]{0,200}\\{[^{}]{0,750}\\}','gi');
  let chunks=[...style.matchAll(re)];
  console.log('CSS',needle,'COUNT',chunks.length);
  for(const m of chunks.slice(0,12))console.log('CSS_RULE',JSON.stringify(m[0].replace(/\s+/g,' ')));
 }
}
