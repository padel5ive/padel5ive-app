/* Source audit for v5.8.5. This script does not mutate production source. */
const fs=require('fs'),path=require('path');
for(const filename of ['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html']){
 const s=fs.readFileSync(filename,'utf8');
 console.log('==== '+filename+' LENGTH '+s.length);
 for(const needle of filename.includes('index.html')&&filename==='public/index.html'
 ? ['p541-venue','p544-foreground','p544-ambient','<div class="p541-venue"','<img','src="data:image','<img src="data:image','p541-home-actions']
 : filename.includes('unified')
 ? ["const entry=","const act=","const share=entry(","const advanced=entry(","const sessionManage=entry(","const sessionManagement=entry(","p5-4852-content","const audit=","function leaderboard(","LEADERBOARD</","LIVE</","<span class=\"badge\">LIVE","const playersCourts=","return `<details class=\"compact-controls\""]
 : ['data-menu-section="Share','data-menu-section="Match','data-menu-section="Manage','data-menu-section="Session','mc32-advanced','id="mainMenu"','LEADERBOARD</','LIVE</','p5-live','function renderMenu(','function renderLeaderboard(']){
  let arr=[],i=-1;while((i=s.indexOf(needle,i+1))>=0&&arr.length<30)arr.push(i);
  console.log('NEEDLE '+JSON.stringify(needle)+' COUNT '+arr.length+' POS '+arr.slice(0,7));
  for(const at of arr.slice(0,2))console.log('AT '+at+'\n'+s.slice(Math.max(0,at-550),Math.min(s.length,at+4200))+'\n----');
 }
 if(filename==='public/index.html'){
  const imageRE=/<img\b[^>]*>/g;let count=0,m;
  while((m=imageRE.exec(s))&&count<30){
   const tag=m[0],sr=tag.match(/src=["']([^"']+)["']/);
   if(sr){let dim='',kind=sr[1].slice(0,100);
    if(sr[1].startsWith('data:')){
      const parts=sr[1].match(/^data:([^;]+);base64,(.*)$/s);
      if(parts){
        const raw=Buffer.from(parts[2],'base64');
        dim=' bytes='+raw.length+' mime='+parts[1];
        if(parts[1]==='image/png'&&raw.length>=24)dim+=' '+raw.readUInt32BE(16)+'x'+raw.readUInt32BE(20);
        if(parts[1]==='image/jpeg'){
          let n=2;while(n<raw.length-10){if(raw[n]!==255){n++;continue;}const mark=raw[n+1];if(mark===0xD8||mark===0xD9){n+=2;continue;}const len=raw.readUInt16BE(n+2);
            if([0xC0,0xC1,0xC2].includes(mark)){dim+=' '+raw.readUInt16BE(n+7)+'x'+raw.readUInt16BE(n+5);break;}
            if(len<2)break;n+=2+len;
          }
        }
      }
    }
    console.log('IMG#'+count+' AT '+m.index+' SRC '+kind+' '+dim);
    count++;
   }
  }
 }
}
