'use strict';const fs=require('node:fs');const s=fs.readFileSync('public/index.html','utf8');console.log('SIZE',s.length);
for(const term of ['Normal · Flexible','Normal ·','Flexible Pairing','Fixed Partner','Structured Pairing','PAIRING STYLE','pairing-style','pairingStyle','pairingstyle','p54-pairing','p54-style','p54-pair','p54-active','p54-option']){
 const a=[];let i=-1;while((i=s.indexOf(term,i+1))>=0){a.push(i);if(a.length===20)break;}
 console.log('TERM',JSON.stringify(term),'COUNT',a.length,'AT',a.join(','));
 for(const pos of a.slice(0,4))console.log('SNIP',JSON.stringify(term),'@'+pos,s.slice(Math.max(0,pos-320),pos+1450).replace(/\n/g,' '));
}
