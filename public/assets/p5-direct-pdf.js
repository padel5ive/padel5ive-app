/* PADEL 5IVE Unified v5.4.13.7 · real downloadable A4 Landscape PDF.
   Zero CDN dependencies. Produces a binary PDF Blob and shares it with Files on iOS.
   Print preview's original editorial report remains separately in the original engine. */
window.P5DirectPDF=(()=>{'use strict';
const W=841.89,H=595.28;
const C={navy:[.059,.114,.157],slate:[.12,.19,.23],gold:[.75,.59,.39],light:[.97,.965,.94],ink:[.12,.19,.23],gray:[.48,.55,.58],watermark:[.095,.163,.205],edge:[.30,.275,.23],rule:[.80,.82,.83],cream:[.975,.967,.95]};
const fmt=n=>Number(n).toFixed(2).replace(/\.00$/,'');
const safeText=(s)=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2022\u25c6]/g,'*').replace(/[^\x20-\x7E\xA0-\xFF]/g,'?');
const pdfStr=s=>'('+safeText(s).replace(/[\\()]/g,c=>'\\'+c)+')';
const rgb=v=>v.map(fmt).join(' ');
const col=(c,stroke=false)=>rgb(C[c]||c)+(stroke?' RG\n':' rg\n');
const text=(x,y,s,size=12,font='F1',color='ink')=>`BT /${font} ${fmt(size)} Tf ${col(color)}1 0 0 1 ${fmt(x)} ${fmt(y)} Tm ${pdfStr(s)} Tj ET\n`;
const rect=(x,y,w,h,c)=>col(c)+`${fmt(x)} ${fmt(y)} ${fmt(w)} ${fmt(h)} re f\n`;
const line=(x,y,x2,y2,c='rule',thick=.7)=>col(c,true)+`${fmt(thick)} w ${fmt(x)} ${fmt(y)} m ${fmt(x2)} ${fmt(y2)} l S\n`;
const wrap=(s,max=95)=>{const words=safeText(s).split(/\s+/);let lines=[],cur='';for(const w of words){if((cur+' '+w).length>max){if(cur)lines.push(cur);cur=w;}else cur+=(cur?' ':'')+w;}if(cur)lines.push(cur);return lines;};
class PDF{
 constructor(){this.pages=[];}
 add(content){this.pages.push(content);}
 bytes(){let objects=[null],catalogId,rootId,pagesId,fontRegular,fontBold,fontItalic;const add=o=>(objects.push(o),objects.length-1);
  fontRegular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  fontBold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  fontItalic=add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>');
  pagesId=add('');let ids=[];for(const page of this.pages){const contents=add('<< /Length '+new TextEncoder().encode(page).length+' >>\nstream\n'+page+'endstream');
   ids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontItalic} 0 R >> >> /Contents ${contents} 0 R >>`));}
  objects[pagesId]=`<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(id=>id+' 0 R').join(' ')}] >>`;
  rootId=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let result='%PDF-1.4\n%PADEL5IVE\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(new TextEncoder().encode(result).length);result+=i+' 0 obj\n'+objects[i]+'\nendobj\n';}
  const xref=new TextEncoder().encode(result).length;result+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(const off of offsets.slice(1))result+=String(off).padStart(10,'0')+' 00000 n \n';result+=`trailer\n<< /Size ${objects.length} /Root ${rootId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([new TextEncoder().encode(result)],{type:'application/pdf'});
 }
}
function header(section,page){let p=rect(0,0,W,H,'light');p+=rect(0,H-77,W,77,'navy');p+=text(48,H-42,'5',37,'F2','gold')+text(90,H-34,'PADEL 5IVE',15,'F2','light')+text(91,H-51,'MATCH CONTROL',8,'F1','gold')+text(W-222,H-35,section.toUpperCase(),10,'F2','light');p+=line(48,46,W-48,46,'rule',1)+text(48,29,'PADEL 5IVE  /  OFFICIAL SESSION RECORD',8,'F2','gray')+text(W-112,29,String(page).padStart(2,'0'),9,'F2','gold');return p;}
function nameMap(s){return new Map((s.roster||[]).map(p=>[p.id,(p.names||[]).filter(Boolean).join(' & ')]));}
function koDiagram(ko,mode,page){
 const defs={
  9:['L1','L2'],10:['L3','L4'],11:['L5','L6'],12:['L7','L8'],
  13:['W1','W2'],14:['W3','W4'],15:['W5','W6'],16:['W7','W8'],
  17:['W9','L16'],18:['W10','L15'],19:['W11','L14'],20:['W12','L13'],
  21:['W13','W14'],22:['W15','W16'],23:['W17','W18'],24:['W19','W20'],
  25:['W21','W22'],26:['W23','L22'],27:['W24','L21'],28:['W26','W27'],
  29:['W28','L25']
 };
 const groups=mode==='W'?[{title:'OPENING',ids:[1,2,3,4,5,6,7,8]},{title:'QUARTERFINALS',ids:[13,14,15,16]},{title:'SEMIFINALS',ids:[21,22]},{title:'WINNERS FINAL',ids:[25]}]:[
  {title:'LOSERS 1',ids:[9,10,11,12]},{title:'LOSERS 2',ids:[17,18,19,20]},{title:'LOSERS 3',ids:[23,24]},{title:'LOSERS 4',ids:[26,27]},{title:'LOSERS SEMI',ids:[28]},{title:'LOSERS FINAL',ids:[29]}];
 const map=new Map(ko.filter(k=>k.group===mode).map(k=>[k.id,k]));
 const columns=groups.filter(g=>g.ids.some(id=>map.has(id)));
 if(!columns.length)return null;
 let p=header(mode==='W'?'Connected Winners Bracket':'Connected Losers Bracket',page);
 p+=text(48,H-108,mode==='W'?'STAGE 2 · WINNERS BRACKET':'STAGE 2 · LOSERS BRACKET',11,'F2','gold');
 p+=text(48,H-141,mode==='W'?'The Unbeaten Path':'The Second Chance',24,'F2','ink');
 p+=text(48,H-161,'Confirmed matches only · Lines follow official bracket match IDs',9,'F1','gray');
 const bx=48,bw=mode==='W'?148:108,gap=mode==='W'?47:23,bh=39,top=H-221;
 const pos=new Map();
 for(let ci=0;ci<columns.length;ci++){
  const c=columns[ci],items=c.ids.filter(id=>map.has(id));
  p+=text(bx+ci*(bw+gap),H-198,c.title,8,'F2','gold');
  for(let j=0;j<items.length;j++){
   const id=items[j],parent=(defs[id]||[]).filter(x=>x.startsWith(mode)&&pos.has(Number(x.slice(1)))).map(x=>pos.get(Number(x.slice(1))));
   let y;
   if(ci===0)y=top-(j+(Math.floor((8-items.length)/2)))*44;
   else if(parent.length)y=parent.reduce((acc,v)=>acc+v.y,0)/parent.length;
   else y=top-((j+.5)*(8/Math.max(1,items.length))-.5)*44;
   y=Math.min(top,Math.max(104,y));
   if(j>0){const previous=pos.get(items[j-1]);if(previous)y=Math.min(y,previous.y-44);}
   pos.set(id,{x:bx+ci*(bw+gap),y});
  }
 }
 for(const [id,xy] of pos.entries()){
  const parents=(defs[id]||[]).filter(x=>x.startsWith(mode)&&pos.has(Number(x.slice(1)))).map(x=>pos.get(Number(x.slice(1))));
  for(const prev of parents){const x0=prev.x+bw,x1=xy.x,y0=prev.y+bh/2,y1=xy.y+bh/2,join=(x0+x1)/2;
   p+=line(x0,y0,join,y0,'gold',.8)+line(join,y0,join,y1,'gold',.8)+line(join,y1,x1,y1,'gold',.8);
  }
 }
 const title=id=>map.get(id);
 for(const [id,xy] of pos.entries()){
  const k=title(id),a=String(k.teamAText||'Team A'),b=String(k.teamBText||'Team B'),max=mode==='W'?21:14;
  p+=rect(xy.x,xy.y,bw,bh,'cream')+line(xy.x,xy.y+bh,xy.x+bw,xy.y+bh,'gold',.7);
  p+=text(xy.x+5,xy.y+bh-9,`${mode}${id} · ${safeText(a).slice(0,max)}`,7,'F2','ink')+text(xy.x+bw-17,xy.y+bh-9,k.score[0],7,'F2','gold');
  p+=text(xy.x+5,xy.y+11,safeText(b).slice(0,max),7,'F1','ink')+text(xy.x+bw-17,xy.y+11,k.score[1],7,'F2','gold');
 }
 return p;
}
function render(data){if(!data||data.p5report!==1||!Array.isArray(data.roster)||!Array.isArray(data.rounds))throw Error('Unable to export unknown results snapshot');
 const doc=new PDF(),byId=nameMap(data),isFixed=data.mode.startsWith('fp-'),mode=data.mode.includes('mexicano')?'Mexicano':'Americano',pairing=isFixed?'Fixed Partner':data.mode.startsWith('structured')?'Structured Pairing':'Flexible Pairing',team=(ids)=>ids.map(id=>byId.get(id)||'Unknown').join(' & '), session=data.session||'Signature Game';
 let matches=[];data.rounds.forEach((r,i)=>r.matches.forEach((m,j)=>{if(m?.confirmed&&Array.isArray(m.score))matches.push({round:i+1,court:m.court||j+1,a:m.teams[0],b:m.teams[1],x:Number(m.score[0]),y:Number(m.score[1])});}));
 let stats=(data.roster||[]).map(p=>({id:p.id,name:team([p.id]),w:0,l:0,t:0,diff:0,points:0,g:0}));const m=new Map(stats.map(x=>[x.id,x]));for(const match of matches){[match.a,match.b].forEach((ids,j)=>{let ours=j?match.y:match.x,theirs=j?match.x:match.y;ids.forEach(id=>{let r=m.get(id);if(!r)return;r.w+=+(ours>theirs);r.l+=+(ours<theirs);r.t+=+(ours===theirs);r.diff+=ours-theirs;r.points+=ours;r.g++;});});}
 stats.sort((a,b)=>b.w-a.w||b.diff-a.diff||b.points-a.points);
 let co=rect(0,0,W,H,'navy');co+=text(170,-80,'5',540,'F2','watermark');co+=col('edge',true)+'0.85 w 130 95 m 210 20 375 28 480 80 c 575 131 696 118 835 140 c S\n';co+=rect(0,0,W,17,'gold');co+=text(57,H-83,'5',62,'F2','gold')+text(118,H-67,'P A D E L  5 I V E',16,'F2','light')+text(119,H-90,'M A T C H  C O N T R O L',10,'F1','gold');co+=line(57,H-118,W-57,H-118,'gold',1);co+=text(57,H-174,'T H E   O F F I C I A L   R E C O R D',12,'F2','gold');
 let slugs=wrap(session,32).slice(0,2);slugs.forEach((s,i)=>{co+=text(57,H-241-i*49,s,39,'F2','light');});co+=text(57,H-321,'Official Session Report',26,'F3','gold')+rect(57,H-350,160,3,'gold')+text(57,H-386,`${mode.toUpperCase()}   /   ${pairing.toUpperCase()}   /   ${data.stage==='champion'?'FINAL RESULTS':'STAGE 1 RESULTS'}`,11,'F2','light');co+=text(57,H-432,`SESSION DATE: ${data.date||'—'}`,11,'F2','gold')+text(315,H-432,`${data.roster.length} ${isFixed?'PAIRS':'PLAYERS'}  /  ${data.courts} COURTS`,11,'F2','gold')+line(57,55,W-57,55,'gold',1)+text(57,35,'BEYOND 5IVE. BEYOND PLAY.',9,'F3','light')+text(W-210,35,'PADEL 5IVE / 01',9,'F2','light');doc.add(co);
 let page=2;
 // Official standings table; page rows never exceed the page bounds.
 const chunk=(arr,n)=>Array.from({length:Math.ceil(arr.length/n)},(_,i)=>arr.slice(i*n,(i+1)*n));
 for(const [part,items] of chunk(stats,19).entries()){
  let p=header('Stage 1 · Official Standings',page++),y=H-112;p+=text(52,y,'STAGE 1 · OFFICIAL STANDINGS',11,'F2','gold');y-=34;p+=text(52,y,mode+' Leaderboard',27,'F2','ink');y-=26;p+=text(52,y,'Official ranking · Wins > Game Difference > Points For',10,'F1','gray');y-=27;
  p+=rect(48,y-9,W-96,30,'slate');p+=text(58,y,'#',9,'F2','light')+text(90,y,isFixed?'PAIR':'PLAYER',9,'F2','light')+text(555,y,'W-L-T',9,'F2','light')+text(633,y,'DIFF',9,'F2','light')+text(689,y,'P',9,'F2','light')+text(739,y,'G',9,'F2','light');y-=33;
  items.forEach((r,i)=>{if(i%2===0)p+=rect(48,y-13,W-96,21,'cream');let name=safeText(r.name).slice(0,64);p+=text(57,y,String(part*19+i+1).padStart(2,'0'),10,'F2','ink')+text(90,y,name,10,'F2','ink')+text(555,y,`${r.w}-${r.l}-${r.t}`,10,'F1','ink')+text(633,y,(r.diff>0?'+':'')+r.diff,10,'F1','ink')+text(690,y,r.points,10,'F1','ink')+text(740,y,r.g,10,'F1','ink');y-=21;});doc.add(p);
 }
 for(const [part,items] of chunk(matches,12).entries()){
  let p=header('Stage 1 · Match History',page++),y=H-108;p+=text(52,y,'STAGE 1 · ROUND BY ROUND',11,'F2','gold');y-=34;p+=text(52,y,mode+' Match Results',25,'F2','ink');y-=25;p+=text(52,y,'Confirmed scores only · '+matches.length+' matches recorded',10,'F1','gray');y-=25;
  p+=rect(48,y-12,W-96,30,'slate')+text(57,y,'ROUND',9,'F2','light')+text(125,y,'COURT',9,'F2','light')+text(194,y,'TEAM A',9,'F2','light')+text(510,y,'TEAM B',9,'F2','light')+text(743,y,'SCORE',9,'F2','light');y-=39;
  items.forEach((r,i)=>{if(i%2===0)p+=rect(48,y-23,W-96,32,'cream');p+=text(57,y,'R'+String(r.round).padStart(2,'0'),10,'F2','ink')+text(125,y,'C'+r.court,10,'F1','ink')+text(194,y,safeText(team(r.a)).slice(0,49),9,'F1','ink')+text(510,y,safeText(team(r.b)).slice(0,36),9,'F1','ink')+text(740,y,`${r.x}-${r.y}`,10,'F2','gold');y-=35;});doc.add(p);
 }
 const ko=(Array.isArray(data.publicKO)?data.publicKO:[]).filter(m=>Array.isArray(m.score)&&Array.isArray(m.teamA)&&Array.isArray(m.teamB));
 if(data.ko&&data.ko.format!=='none'){
  const renderKo=ko.map(k=>({...k,teamAText:team(k.teamA),teamBText:team(k.teamB)}));
  for(const type of (data.ko.format==='double'?['W','L']:['W'])){
   const graphic=koDiagram(renderKo,type,page);
   if(graphic){doc.add(graphic);page++;}
  }
  for(const [part,items] of chunk(ko,11).entries()){ 
   let p=header('Stage 2 · Knockout',page++),y=H-105;p+=text(52,y,'STAGE 2 · KNOCKOUT',11,'F2','gold');y-=34;p+=text(52,y,(data.ko.format||'').toUpperCase()+' Elimination',25,'F2','ink');y-=25;p+=text(52,y,'Official bracket record · confirmed results only',10,'F1','gray');y-=30;
   for(const k of items){p+=rect(49,y-12,W-100,31,'cream')+text(56,y,`M${k.id}  ${k.group||'W'}  R${k.round||1}`,10,'F2','gold')+text(185,y,safeText(team(k.teamA)).slice(0,43),10,'F1','ink')+text(486,y,safeText(team(k.teamB)).slice(0,35),10,'F1','ink')+text(739,y,k.score.join('-'),10,'F2','gold');y-=36;}if(!items.length)p+=text(52,y,'No confirmed knockout scores yet.',11,'F1','gray');doc.add(p);
  }
  if(!ko.length){let p=header('Stage 2 · Knockout',page++)+text(52,H-140,'KNOCKOUT · AWAITING RESULTS',21,'F2','ink');doc.add(p);}
 }
 if(data.stage==='champion'){
  const winner=(data.ko?.champion?.length?team(data.ko.champion):stats[0]?.name)||'Official Winner',runner=data.ko?.runnerUp?.length?team(data.ko.runnerUp):stats[1]?.name;
  let p=header('Official Champion',page++);p+=text(53,H-150,'PADEL 5IVE · TOURNAMENT CHAMPIONS',14,'F2','gold')+text(53,H-226,safeText(winner).slice(0,48),32,'F2','ink')+line(53,H-254,W-55,H-254,'gold',2);if(runner)p+=text(53,H-303,'RUNNER-UP',11,'F2','gold')+text(53,H-345,safeText(runner).slice(0,54),22,'F2','ink');p+=text(53,104,'BEYOND 5IVE. BEYOND PLAY.',12,'F3','gray');doc.add(p);
 }
 return doc.bytes();
}
async function exportPDF(state){const blob=render(state);const filename='PADEL5IVE_OFFICIAL_'+safeText(state.session||'SESSION').replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,40)+'.pdf';
 const file=new File([blob],filename,{type:'application/pdf'});
 if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'PADEL 5IVE · Official Report'});return {filename,bytes:blob.size,shared:true};}catch(e){if(e.name==='AbortError')return {filename,bytes:blob.size,cancelled:true};}}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return {filename,bytes:blob.size,downloaded:true};
}
return Object.freeze({render,exportPDF});
})();
