const fs=require('node:fs');
const pages=['public/index.html','public/modes/unified/index.html','public/pwa-standalone-layout-v5601.css','public/phase58/dashboard-clean-v583.css','public/phase58/pwa-fullscreen-v581.css','public/phase58/home-cta-compact-v582.css'];
const termsByPage=[
 ['#portal.portal','#portal .p541-venue','.p541-venue{','.p541-venue::before','.p541-venue::after','.p541-venue:before','.p541-venue:after','.portal{','.signature{','.p541-home-actions{','overflow-y','scrollTo(','scrollRestoration','P5PreviewLaunch','p54-home-link','p54-resume'],
 ['const act=','p5-b31-menu-row','p5-4852-content .p5-4852-action','p5-share-label-copy','share-result-link','pdf-download','p5-4852-action{','.global-dock #mainMenu'],
 [],[],[],[]
];
for(let p=0;p<pages.length;p++){
const file=pages[p],source=fs.readFileSync(file,'utf8');
console.log('FILE '+file+' LENGTH '+source.length);
for(const t of termsByPage[p]){
 let matches=[],idx=-1;
 while((idx=source.indexOf(t,idx+1))>=0){matches.push(idx);if(matches.length>=80)break;}
 console.log('\nTERM '+t+' '+matches.length+' POS '+matches.slice(0,15).join(','));
 const n=t==='overflow-y'||t==='p54-resume'||t==='scrollTo('?3:(t.includes('portal')||t.includes('venue')?7:5);
 const subset=[...matches.slice(0,n)];if(matches.length>n)subset.push(...matches.slice(-Math.min(2,matches.length-n)));
 for(const at of new Set(subset)){
 const from=Math.max(0,at-200),to=Math.min(source.length,at+1300);
 console.log('AT '+at+'\n'+source.slice(from,to).replace(/\n\s*\n\s*\n/g,'\n\n')+'\n---');
 }
}
}
