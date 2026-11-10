const fs=require('node:fs');
const home=fs.readFileSync('public/index.html','utf8');
console.log('==== HOME LAST 24K ====\n'+home.slice(-25000));
const idx=home.lastIndexOf('window.P5PreviewLaunch=function');
console.log('==== home launch exact '+idx+' ====\n'+home.slice(idx-800,idx+3000));
const iframe=home.indexOf('id="p54-offline-frame"');console.log('==== iframe start ====\n'+home.slice(iframe-2200,iframe+2000));
for(const p of ['public/modes/unified/index.html','public/modes/club-match/index.html']){const s=fs.readFileSync(p,'utf8');console.log('==== '+p+' boot end ====\n'+s.slice(-9500));}
