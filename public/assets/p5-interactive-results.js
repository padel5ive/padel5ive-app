/* PADEL 5IVE · Official Results · Unified adapter v5.4.13.7
 * Presentation derives from the locked Fixed Partner v4.8.92.23 public viewer.
 * Input is a read-only, confirmed-score-only Unified snapshot served by Netlify.
 * No session secrets, no editor functionality, no engine mutations.
 */
(()=>{'use strict';
const el=document.getElementById('app');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const signed=v=>(v>0?'+':'')+v;
const ID=/^[A-Za-z0-9_-]{6,32}$/;
const MODE=new Set(['fp-americano','individual-americano','structured-americano','fp-mexicano','individual-mexicano','structured-mexicano']);
let data=null,stats=[],matches=[],koMatches=[],isFixed=false,source=new Map();
function check(s){
 if(!s||s.p5report!==1||!MODE.has(s.mode)||!Array.isArray(s.roster)||!Array.isArray(s.rounds))throw Error('Invalid published results data');
 if(s.roster.length<2||s.roster.length>80||s.rounds.length>300)throw Error('Results data outside supported limits');
 isFixed=s.mode.startsWith('fp-');let seen=new Set();
 for(const p of s.roster){if(!Number.isSafeInteger(p?.id)||seen.has(p.id)||!Array.isArray(p.names)||p.names.length!==(isFixed?2:1))throw Error('Invalid roster data');seen.add(p.id);}
 let count=0;for(const r of s.rounds){if(!Array.isArray(r.matches))throw Error('Invalid round data');for(const m of r.matches){if(!m)continue;if(!Array.isArray(m.teams)||m.teams.length!==2||m.teams.some(t=>!Array.isArray(t)||t.length!==(isFixed?1:2)||t.some(id=>!seen.has(id))))throw Error('Invalid match teams');if(m.confirmed&&(!Array.isArray(m.score)||m.score.length!==2||m.score.some(x=>!Number.isSafeInteger(x)||x<0||x>1000)))throw Error('Invalid confirmed match score');count++;}}
 if(count>1500)throw Error('Results too large');return s;
}
function person(id){let p=source.get(id);return p?p.names.filter(Boolean).join(' & '):'Unknown Player';}
function team(ids){return Array.isArray(ids)?ids.map(person).join(' & '):'TBD';}
function stageName(){return data.mode.includes('mexicano')?'MEXICANO':'AMERICANO';}
function pairingName(){return isFixed?'FIXED PARTNER':data.mode.startsWith('structured')?'STRUCTURED PAIRING':'FLEXIBLE PAIRING';}
function selectedName(id){return person(id);}
function makeMatches(){
 matches=[];data.rounds.forEach((r,i)=>r.matches.forEach((m,j)=>{
  if(!m?.confirmed||!Array.isArray(m.score))return;
  let A=m.teams[0],B=m.teams[1],x=num(m.score[0]),y=num(m.score[1]);
  matches.push({id:m.id||'r'+i+'m'+j,round:i+1,court:m.court||j+1,a:A,b:B,x,y});
 }));
 koMatches=(Array.isArray(data.publicKO)?data.publicKO:[]).filter(m=>m&&Array.isArray(m.teamA)&&Array.isArray(m.teamB)&&Array.isArray(m.score)&&m.score.length===2).map(m=>({...m,x:num(m.score[0]),y:num(m.score[1])}));
}
function computeStats(){
 stats=data.roster.map(p=>({id:p.id,name:person(p.id),w:0,l:0,t:0,diff:0,p:0,g:0,opp:[],history:[]}));
 let byId=new Map(stats.map(x=>[x.id,x]));
 for(const m of matches){for(let z=0;z<2;z++){
  const ids=z===0?m.a:m.b,enemy=z===0?m.b:m.a,ours=z===0?m.x:m.y,theirs=z===0?m.y:m.x;
  for(const id of ids){let s=byId.get(id);if(!s)continue;s.w+=ours>theirs?1:0;s.l+=ours<theirs?1:0;s.t+=ours===theirs?1:0;s.diff+=ours-theirs;s.p+=ours;s.g++;s.history.push({...m,ours,theirs,teamMembers:ids.filter(x=>x!==id),opponents:enemy,result:ours>theirs?'W':ours<theirs?'L':'T'});}
 }}
 stats.sort((a,b)=>b.w-a.w||b.diff-a.diff||b.p-a.p||a.name.localeCompare(b.name));
}
function getKOOutcome(){
 const isKO=data.ko&&data.ko.format&&data.ko.format!=='none';
 if(data.stage==='champion'&&Array.isArray(data.ko?.champion)&&data.ko.champion.length){return {winner:team(data.ko.champion),runner:team(data.ko.runnerUp||[]),isKO:!!isKO};}
 if(data.stage==='champion'&&stats.length){return {winner:stats[0].name,runner:stats[1]?.name||'',isKO:false};}
 return null;
}
function metric(label,value){return `<span>${esc(label)} · ${esc(value)}</span>`;}
function hero(){const label=stageName(),kind=pairingName();let meta=[metric('DATE',data.date||'—'),metric('COURTS',data.courts||'—'),metric(isFixed?'PAIRS':'PLAYERS',data.roster.length),metric('SCORED',matches.length)];
 return `<div class="share-topbar"><span>PADEL 5IVE · BEYOND 5IVE. BEYOND PLAY.</span><span class="status-chip">${esc(data.stage==='champion'?'FINAL':'PUBLISHED')}</span></div><header class="hero"><div class="brand">PADEL 5IVE · MATCH CONTROL</div><div class="mini-line"></div><h1>OFFICIAL RESULTS</h1><p class="hero-name">${esc(data.session||'Signature Game')}</p><div class="eyebrow">${label} · ${kind}</div><div class="meta-grid">${meta.join('')}</div></header>`;
}
function champion(){const c=getKOOutcome();return c?`<section class="champion" id="champion"><div class="trophy">✦</div><div class="eyebrow">${c.isKO?'TOURNAMENT CHAMPIONS':'STAGE 1 · FINAL RANKING'}</div><h2>${esc(c.winner)}</h2><div class="champion-sub">${c.isKO?'Official Championship Winners':'Official Final Leaderboard · Rank #1'}</div>${c.runner?`<div class="pair-sub"><span>RUNNER-UP · ${esc(c.runner)}</span></div>`:''}</section>`:`<section class="champion" id="champion"><div class="trophy">✦</div><div class="eyebrow">OFFICIAL SESSION RESULTS</div><h2>Competition in progress</h2><div class="champion-sub">Final champion appears when the session finishes</div></section>`;}
function leaderboard(){
 const title=stageName()+' Leaderboard';const hdr=isFixed?'PAIR':'PLAYER';
 return `<section class="section" id="leaderboard"><div class="section-head"><h2><span class="num">01 /</span>${title}</h2><span class="label">OFFICIAL STANDINGS</span></div><div class="leader-card"><table class="leader"><thead><tr><th>${hdr}</th><th>W–L–T</th><th>DIFF</th><th>P</th><th title="Games Played">G</th></tr></thead><tbody>${stats.map((s,i)=>`<tr data-standing="${s.id}"><td><button class="pick" type="button" data-select-player="${s.id}" aria-label="Analyze ${esc(s.name)}">${String(i+1).padStart(2,'0')} · ${esc(s.name)} ↗</button></td><td>${s.w}–${s.l}–${s.t}</td><td>${signed(s.diff)}</td><td>${s.p}</td><td>${s.g}</td></tr>`).join('')}</tbody></table></div><p class="small">Ranked by Wins → Game Difference → Points For. Confirmed matches only. Tap a ${isFixed?'pair':'player'} to explore performance.</p></section>`;
}
function rounds(){let byRound=new Map();for(const m of matches){if(!byRound.has(m.round))byRound.set(m.round,[]);byRound.get(m.round).push(m);}const parts=[...byRound].sort((a,b)=>a[0]-b[0]).map(([r,items])=>`<div class="round"><header>ROUND ${String(r).padStart(2,'0')}<span class="small">${items.length} MATCHES</span></header>${items.map(m=>`<div class="result"><span class="result-text">C${String(m.court).padStart(2,'0')} · ${esc(team(m.a))}<br><span class="small">vs ${esc(team(m.b))}</span></span><span class="score">${m.x} – ${m.y}</span></div>`).join('')}</div>`);
 return `<section class="section rounds" id="round-results"><div class="section-head"><h2><span class="num">02 /</span>${stageName()} Results</h2><span class="label">ROUND BY ROUND</span></div>${parts.join('')||'<p class="small">No confirmed results are available yet.</p>'}${parts.length>2?`<button type="button" class="results-toggle" id="p5-show-rounds" aria-expanded="false">View All ${parts.length} Rounds ↓</button>`:''}</section>`;
}
function koBracket(){if(!data.ko||data.ko.format==='none')return '';
 // Canonical feeder IDs from locked Fixed Partner v4.8.92.23. All scores come
 // exclusively from the confirmed Unified P5KO graph supplied at publish time.
 const sources={
  9:['L1','L2'],10:['L3','L4'],11:['L5','L6'],12:['L7','L8'],
  13:['W1','W2'],14:['W3','W4'],15:['W5','W6'],16:['W7','W8'],
  17:['W9','L16'],18:['W10','L15'],19:['W11','L14'],20:['W12','L13'],
  21:['W13','W14'],22:['W15','W16'],23:['W17','W18'],24:['W19','W20'],
  25:['W21','W22'],26:['W23','L22'],27:['W24','L21'],28:['W26','W27'],
  29:['W28','L25'],30:['W25','W29'],31:['W30','L30']
 };
 const winnerGroups=[{name:'OPENING DRAW',ids:[1,2,3,4,5,6,7,8]},{name:'QUARTERFINALS',ids:[13,14,15,16]},{name:'SEMIFINALS',ids:[21,22]},{name:data.ko.format==='double'?'WINNERS FINAL':'CHAMPIONSHIP FINAL',ids:[25]}];
 const loserGroups=[{name:'LOSERS OPENING',ids:[9,10,11,12]},{name:'SECOND CHANCE',ids:[17,18,19,20]},{name:'LOSERS ROUND 3',ids:[23,24]},{name:'LOSERS ROUND 4',ids:[26,27]},{name:'LOSERS SEMIFINAL',ids:[28]},{name:'LOSERS FINAL',ids:[29]}];
 const lookup=new Map(koMatches.map(m=>[Number(m.id),m]));
 function connected(groups,bracket){
  const cols=groups.map(g=>({name:g.name,items:g.ids.map(id=>lookup.get(id)).filter(Boolean)})).filter(g=>g.items.length);
  if(!cols.length)return '<div class="report-empty">No confirmed matches in this bracket yet.</div>';
  const cw=238,xgap=94,top=86,h=115,pitch=147;
  const largest=Math.max(...cols.map(c=>c.items.length)),height=Math.max(250,top+largest*pitch+28),width=18+cols.length*(cw+xgap)-xgap+36;
  const positions=new Map(),recorded=new Set(cols.flatMap(c=>c.items.map(m=>Number(m.id))));
  const sourceFor=m=>(sources[m.id]||[]).filter(src=>src[0]===bracket&&recorded.has(Number(src.slice(1)))).map(src=>Number(src.slice(1)));
  cols.forEach((col,i)=>{
    let targets=col.items.map((m,j)=>{const parents=sourceFor(m).map(id=>positions.get(id)).filter(Boolean);let y=parents.length?parents.reduce((a,v)=>a+v.y,0)/parents.length:top+((j+.5)/col.items.length)*(height-top-h)-h/2;return {m,y};});
    if(!i)targets=targets.map((x,j)=>({...x,y:top+(largest-col.items.length)*pitch/2+j*pitch}));
    else{
      targets.sort((a,b)=>a.y-b.y||a.m.id-b.m.id);
      for(let j=1;j<targets.length;j++)targets[j].y=Math.max(targets[j].y,targets[j-1].y+h+20);
      const overflow=targets.at(-1)?.y+h-(height-12)||0;if(overflow>0)targets.forEach(t=>t.y-=overflow);
      if(targets[0]?.y<top){const delta=top-targets[0].y;targets.forEach(t=>t.y+=delta);}
    }
    targets.forEach(t=>positions.set(Number(t.m.id),{x:18+i*(cw+xgap),y:t.y}));
  });
  let links='';for(const col of cols)for(const m of col.items){let dest=positions.get(Number(m.id));const parents=sourceFor(m).map(id=>positions.get(id)).filter(p=>p?.x<dest.x);if(!parents.length)continue;
   const join=dest.x-xgap/2,ty=dest.y+h/2;
   for(const a of parents){const sy=a.y+h/2;links+=`<path d="M${a.x+cw} ${sy} H${join}"/>`;}
   const sy=parents.map(p=>p.y+h/2);links+=`<path d="M${join} ${Math.min(...sy)} V${Math.max(...sy)}"/>`;
   links+=`<path class="share-tree-route-gold" d="M${join} ${(Math.min(...sy)+Math.max(...sy))/2} V${ty} H${dest.x}"/>`;
  }
  const headings=cols.map((c,i)=>`<div class="share-tree-heading" style="left:${18+i*(cw+xgap)}px"><span>${bracket==='W'?'WINNERS':'LOSERS'} · ROUND ${String(i+1).padStart(2,'0')}</span><strong>${esc(c.name)}</strong><small>${c.items.length} completed match${c.items.length===1?'':'es'}</small></div>`).join('');
  const cards=cols.flatMap(c=>c.items.map(m=>{let pos=positions.get(Number(m.id)),aWin=m.x>m.y,bWin=m.y>m.x;
   const l=(name,score,win)=>`<div class="share-tree-team ${win?'is-winner':''}"><span>${win?'◆ ':''}${esc(name)}</span><b>${score}</b></div>`;
   return `<button class="share-tree-card" type="button" style="left:${pos.x}px;top:${pos.y}px" data-ko-match="${esc(m.id)}" data-ko-players="${[...m.teamA,...m.teamB].join(',')}" aria-label="Match ${m.id}, ${esc(team(m.teamA))} ${m.x}, ${esc(team(m.teamB))} ${m.y}"><div class="share-tree-card-head"><span>${bracket}${String(m.id).padStart(2,'0')}</span><span>COMPLETED</span></div>${l(team(m.teamA),m.x,aWin)}${l(team(m.teamB),m.y,bWin)}</button>`;
  })).join('');
  return `<div class="share-tree-frame"><div class="share-tree-mobile-hint">↔ SWIPE TO FOLLOW THE BRACKET</div><div class="share-tree-scroll" role="region" aria-label="Connected ${bracket==='W'?'Winners':'Losers'} bracket" tabindex="0"><div class="share-tree-canvas" style="width:${width}px;height:${height}px"><svg class="share-tree-lines" viewBox="0 0 ${width} ${height}" aria-hidden="true">${links}</svg>${headings}${cards}</div></div><div class="share-tree-foot">Connected paths follow the confirmed match source IDs · PADEL 5IVE MATCH CONTROL</div></div>`;
 }
 const winners=connected(winnerGroups,'W'),losers=connected(loserGroups,'L');
 const gf=koMatches.filter(m=>m.group==='F');
 const finals=gf.map(m=>`<button class="match" type="button" data-ko-match="${esc(m.id)}" data-ko-players="${[...m.teamA,...m.teamB].join(',')}"><div class="ko-card-id">${m.id===31?'GRAND FINAL RESET':'GRAND FINAL'} · M${m.id}</div><div class="competitor"><span>${esc(team(m.teamA))}</span><b>${m.x}</b></div><div class="competitor"><span>${esc(team(m.teamB))}</span><b>${m.y}</b></div></button>`).join('');
 return `<section class="section" id="knockout"><div class="section-head"><h2><span class="num">03 /</span>Knockout Bracket</h2><span class="label">${esc(data.ko.format.toUpperCase())} ELIMINATION</span></div><nav class="ko-subnav"><a href="#share-winners">01 · Winners</a>${data.ko.format==='double'?'<a href="#share-losers">02 · Losers</a><a href="#share-finals">03 · Grand Final</a>':''}</nav><div class="bracket-block ko-navigator" id="share-winners"><div class="block-title">WINNERS BRACKET · UNBEATEN PATH</div><div class="block-hint">Connected winner routes based on official bracket dependencies</div>${winners}</div>${data.ko.format==='double'?`<div class="bracket-block ko-navigator" id="share-losers"><div class="block-title">LOSERS BRACKET · SECOND CHANCE</div><div class="block-hint">After the first loss · Connections follow canonical match IDs</div>${losers}</div><div class="bracket-block ko-navigator" id="share-finals"><div class="block-title">CHAMPIONSHIP FINALS</div><div class="block-hint">Winners Bracket Champion vs Losers Bracket Champion</div><div class="share-connected-finals">${finals||'<p class="small">Grand Final pending</p>'}</div></div>`:''}</section>`;
}
function analysis(){return `<section class="section" id="pair-analysis"><div class="section-head"><h2><span class="num">${koMatches.length?'04':'03'} /</span>Analyze Your ${isFixed?'Pair':'Player'}</h2><span class="label">PERSONAL PERFORMANCE</span></div><div class="analysis-wrap"><p class="small">Your match journey across the session${koMatches.length?' and championship':''}. Tap a leaderboard name or choose below.</p><label class="eyebrow" for="analysis-select">SELECT ${isFixed?'PAIR':'PLAYER'}</label><select id="analysis-select"><option value="">Choose ${isFixed?'a pair':'a player'}</option>${stats.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><div id="analysis-report" class="analysis-panel" hidden></div></div></section>`;}
function analyze(id,scroll=false){let p=stats.find(x=>x.id===id),e=document.getElementById('analysis-report');if(!p||!e)return;let ko=koMatches.filter(m=>m.teamA.includes(id)||m.teamB.includes(id)).map(m=>{const ours=m.teamA.includes(id)?m.x:m.y,theirs=m.teamA.includes(id)?m.y:m.x;return {round:'KO M'+m.id,court:null,ours,theirs,result:ours>theirs?'W':ours<theirs?'L':'T',opponents:m.teamA.includes(id)?m.teamB:m.teamA,teamMembers:(m.teamA.includes(id)?m.teamA:m.teamB).filter(a=>a!==id)}});
 const history=[...p.history.map(x=>({...x,round:'R'+x.round})),...ko];let wins=history.filter(x=>x.result==='W').length,losses=history.filter(x=>x.result==='L').length,ties=history.filter(x=>x.result==='T').length,gameDiff=history.reduce((a,m)=>a+m.ours-m.theirs,0);
 e.hidden=false;e.innerHTML=`<h3>${esc(p.name)}</h3><p class="small">${isFixed?'Fixed Partner':'Individual'} · ${p.g} Stage 1 matches · ${ko.length} KO matches</p><div class="analysis-metrics"><div><strong>${history.length?Math.round(100*wins/history.length):0}%</strong><small>WIN RATE</small></div><div><strong>${wins}–${losses}–${ties}</strong><small>W–L–T</small></div><div><strong>${signed(gameDiff)}</strong><small>GAME DIFF</small></div></div><div class="analysis-history-group"><h4>RECORDED MATCH JOURNEY</h4>${history.map(m=>`<div class="analysis-game"><span>${esc(m.result)} · ${esc(m.round)}${m.court?' · C'+m.court:''}${m.teamMembers?.length?' · with '+esc(team(m.teamMembers)):''}<br><span class="small">vs ${esc(team(m.opponents))}</span></span><strong>${m.ours}–${m.theirs}</strong></div>`).join('')||'<p class="small">No confirmed matches yet.</p>'}</div>`;
 document.getElementById('analysis-select').value=String(id);document.querySelectorAll('[data-standing]').forEach(r=>r.classList.toggle('is-selected',r.dataset.standing===String(id)));if(scroll)document.getElementById('pair-analysis').scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){source=new Map(data.roster.map(p=>[p.id,p]));makeMatches();computeStats();const hasKO=data.ko&&data.ko.format!=='none';
 const statsLabel=stageName();document.title='PADEL 5IVE · '+statsLabel+' Official Results';
 el.innerHTML=hero()+champion()+`<nav class="share-tabs" aria-label="Results sections"><a href="#leaderboard">Leaderboard</a><a href="#round-results">Round History</a>${hasKO?'<a href="#knockout">KO Bracket</a>':''}<a href="#pair-analysis">Player Analysis</a></nav>`+leaderboard()+rounds()+koBracket()+analysis()+`<div class="share-footer">PADEL 5IVE · BEYOND 5IVE. BEYOND PLAY.<p class="small" style="letter-spacing:normal">Published results are read-only · Updated by the organizer</p></div>`;
 document.querySelectorAll('[data-select-player]').forEach(b=>b.addEventListener('click',()=>analyze(Number(b.dataset.selectPlayer),true)));
 document.getElementById('analysis-select')?.addEventListener('change',e=>{if(e.target.value)analyze(Number(e.target.value));else document.getElementById('analysis-report').hidden=true;});
 document.getElementById('p5-show-rounds')?.addEventListener('click',e=>{let p=document.getElementById('round-results'),v=p.classList.toggle('is-expanded');e.currentTarget.textContent=v?'Collapse Remaining Rounds ↑':'View All Rounds ↓';e.currentTarget.setAttribute('aria-expanded',String(v));});
 document.querySelectorAll('[data-ko-match]').forEach(btn=>btn.addEventListener('click',()=>{let selected=btn.classList.contains('active');let p=btn.dataset.koPlayers.split(',');document.querySelectorAll('[data-ko-match]').forEach(card=>{card.classList.remove('active','muted');if(!selected){let q=card.dataset.koPlayers.split(',');card.classList.add(q.some(id=>p.includes(id))?'active':'muted');}});}));
}
async function load(){try{let id=location.pathname.match(/^\/u\/([A-Za-z0-9_-]{6,32})\/?$/)?.[1];if(!id||!ID.test(id))throw Error('Invalid public results URL');let response=await fetch('/api/unified-results?id='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});let res=await response.json();if(!response.ok)throw Error(res?.error||'Unable to load published results');data=check(res?.data);render();}catch(err){console.error(err);el.innerHTML=`<div class="error-panel" role="alert"><div class="eyebrow">PADEL 5IVE · OFFICIAL RESULTS</div><h1>Results Unavailable</h1><p>${esc(err.message||'Unable to open this link')}</p><p>Please contact the organizer for an updated link.</p></div>`;}}
load();
})();
