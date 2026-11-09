/* PADEL 5IVE 5.7.4 — 1200×630 per-session WhatsApp / social preview.
 * Uses only published confirmed scores. No hidden organizer tokens on card.
 * One canvas render per publish/update; no wallpaper motion and no engine changes.
 */
(()=>{'use strict';
const W=1200,H=630;
function project(data){
  const fixed=String(data.mode||'').startsWith('fp-');
  const roster=(data.roster||[]).map(p=>({id:p.id,name:(p.names||[]).filter(Boolean).join(' & ')}));
  const byId=new Map(roster.map(p=>[p.id,{...p,w:0,diff:0,p:0}]));
  for(const round of data.rounds||[])for(const m of round.matches||[]){
    if(!m?.confirmed||!Array.isArray(m.score)||m.score.length!==2)continue;
    const [x,y]=m.score.map(Number);
    if(!Number.isFinite(x)||!Number.isFinite(y))continue;
    for(let side=0;side<2;side++)for(const id of m.teams?.[side]||[]){
      const e=byId.get(id);if(!e)continue;
      const a=side===0?x:y,b=side===0?y:x;
      e.w+=a>b?1:0;e.diff+=a-b;e.p+=a;
    }
  }
  const sorted=[...byId.values()].sort((a,b)=>b.w-a.w||b.diff-a.diff||b.p-a.p||a.name.localeCompare(b.name));
  const hasKO=!!(data.ko?.format&&data.ko.format!=='none');
  const complete=data.stage==='champion';
  const team=ids=>Array.isArray(ids)?ids.map(id=>byId.get(id)?.name||'').filter(Boolean).join(' & '):'';
  const champ=hasKO&&complete?team(data.ko?.champion):'';
  const runner=champ?team(data.ko?.runnerUp):'';
  return {fixed,hasKO,complete,champ,runner,
    leaders:sorted.slice(0,5),mode:String(data.mode||'').includes('mexicano')?'MEXICANO':'AMERICANO',
    pairing:fixed?'FIXED PARTNER':String(data.mode||'').startsWith('structured-')?'STRUCTURED PAIRING':'FLEXIBLE PAIRING',
    session:String(data.session||'Signature Game'),date:String(data.date||''),time:String(data.time||'')};
}
function render(data){
  if(!document.createElement('canvas').getContext)throw Error('Canvas is not supported on this browser.');
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');if(!g)throw Error('Unable to render WhatsApp preview on this device.');
  const p=project(data);
  const col={bg:'#101d2b',bg2:'#132332',gold:'#d7b98b',ivory:'#f5eee3',soft:'#bdc8d0',muted:'#97a9b6',line:'#53606c'};
  const rect=(x,y,w,h,fill)=>{g.fillStyle=fill;g.fillRect(x,y,w,h);};
  const text=(value,x,y,size=20,color=col.ivory,weight=500,spacing=0)=>{
    g.fillStyle=color;g.font=weight+' '+size+'px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    g.textBaseline='alphabetic';const v=String(value||'');
    if(spacing&&typeof g.letterSpacing==='string')g.letterSpacing=spacing+'px';
    g.fillText(v,x,y);
    if(spacing&&typeof g.letterSpacing==='string')g.letterSpacing='0px';
  };
  const fit=(value,x,y,width,size,color,weight=600)=>{
    const v=String(value||'').trim();
    g.font=weight+' '+size+'px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    if(g.measureText(v).width<=width){text(v,x,y,size,color,weight);return;}
    let end=v.length;while(end>1&&g.measureText(v.slice(0,end)+'…').width>width)end--;
    text(v.slice(0,end)+'…',x,y,size,color,weight);
  };
  rect(0,0,W,H,col.bg);
  const glow=g.createLinearGradient(0,0,W,H);glow.addColorStop(0,'#192d3d');glow.addColorStop(.65,'#101e2c');glow.addColorStop(1,'#0e1b29');rect(0,0,W,H,glow);
  // Quiet-luxury standalone numeral watermark, not the wordmark or a photo.
  g.save();g.globalAlpha=.047;g.fillStyle='#e6c69b';g.font='900 540px Arial, sans-serif';g.textAlign='center';g.fillText('5',615,515);g.restore();g.textAlign='left';
  rect(0,0,W,6,'#b99b72');
  rect(58,92,1084,1,col.line);
  text('PADEL 5IVE  ·  MATCH CONTROL',64,67,19,col.gold,650,2);
  text('OFFICIAL RESULTS',64,175,49,col.ivory,740);
  fit(p.session,66,235,520,34,col.gold,640);
  text(p.mode+'  ·  '+p.pairing,66,276,17,col.soft,620);
  let day=p.date;
  if(/^\d{4}-\d{2}-\d{2}$/.test(day)){const [y,m,d]=day.split('-');day=d+'/'+m+'/'+y;}
  text([day,p.time].filter(Boolean).join('  ·  ')||'SESSION DETAILS',66,310,19,col.muted,520);
  const ko=!!p.champ;
  if(ko){
    text('TOURNAMENT CHAMPIONS',66,390,17,col.gold,740,1);
    fit(p.champ,66,435,520,31,col.ivory,730);
    if(p.runner){text('RUNNER-UP',66,483,16,col.gold,680,1);fit(p.runner,66,522,520,26,col.soft,620);}
  }else{
    text(p.complete?'FINAL RESULTS':'PUBLISHED STANDINGS',66,412,18,col.gold,700,1);
    text('BEYOND 5IVE. BEYOND PLAY.',66,460,18,col.soft,500);
  }
  rect(614,126,1,420,'#445666');
  text(ko?'STAGE 1 TOP 5':p.complete?'FINAL LEADERBOARD':'LIVE STANDINGS',655,154,20,col.gold,700,1);
  rect(655,168,479,1,col.line);
  const y0=215,step=67;
  for(let i=0;i<5;i++){
    const e=p.leaders[i];if(!e)break;
    const y=y0+i*step;
    text(String(i+1).padStart(2,'0'),656,y,26,i===0?col.gold:col.muted,730);
    fit(e.name,718,y,398,21,i===0?col.ivory:col.soft,i===0?710:550);
    if(i<4)rect(655,y+20,479,1,'#344654');
  }
  rect(58,573,1084,1,col.line);
  text('BEYOND 5IVE. BEYOND PLAY.',64,605,14,col.gold,520,1);
  text('PADEL5IVE.NETLIFY.APP',927,605,13,col.muted,550,1);
  // Safari creates surprisingly large lossless PNGs with gradient/watermark.
  // JPEG is WhatsApp-compatible and preserves the premium card at ~1/4 the size.
  // Try progressively smaller quality rather than preventing result publishing.
  const prefix='data:image/jpeg;base64,';
  let base64='';
  for(const quality of [.86,.76,.64,.52]){
    const uri=c.toDataURL('image/jpeg',quality);
    if(!uri.startsWith(prefix))throw Error('This device could not generate a WhatsApp-compatible preview.');
    base64=uri.slice(prefix.length);
    if(base64&&base64.length<=350000)break;
  }
  if(!base64||base64.length>350000)throw Error('Social preview image could not be compressed. Please retry publishing.');
  return base64;
}
window.P5SocialCard=Object.freeze({render,project});
})();