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
function dayDate(v){const raw=String(v||'').trim(),m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);if(!m)return raw||'—';const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()+1!==+m[2]||d.getUTCDate()!==+m[3])return raw;return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(d).replace(/^([^,]+),\s*/,'$1 · ');} 
function metric(label,value){return `<span>${esc(label)} · ${esc(value)}</span>`;}
function hero(){const totalMatches=(Array.isArray(data.rounds)?data.rounds:[]).reduce((sum,r)=>sum+(Array.isArray(r?.matches)?r.matches.filter(m=>m&&(m.confirmed||Array.isArray(m.score))).length:0),0)+koMatches.length;const label=stageName(),kind=pairingName();let meta=`<div class="p5-meta-date">${esc(dayDate(data.date).replace(' · ', ', '))}</div><div class="p5-meta-stat-row"><div class="p5-meta-stat"><span class="p5-meta-key">COURTS</span><strong>${esc(data.courts||'—')}</strong></div><div class="p5-meta-stat"><span class="p5-meta-key">${isFixed?'PAIRS':'PLAYERS'}</span><strong>${esc(data.roster.length)}</strong></div><div class="p5-meta-stat"><span class="p5-meta-key">MATCHES</span><strong>${esc(totalMatches)}</strong></div></div>`;
 return `<header class="hero" id="overview"><span class="status-chip p5-hero-status">${esc(data.stage==='champion'?'FINAL':'PUBLISHED')}</span><div class="brand">PADEL 5IVE · MATCH CONTROL</div><div class="mini-line"></div><h1>OFFICIAL RESULTS</h1><p class="hero-name">${esc(data.session||'Signature Game')}</p><div class="eyebrow">${label} · ${kind}</div><div class="meta-grid p5-hero-metadata">${meta}</div></header>`;
}
function champion(){const c=getKOOutcome();return c?`<section class="champion" id="champion"><div class="trophy">✦</div><div class="eyebrow">${c.isKO?'TOURNAMENT CHAMPIONS':'OFFICIAL FINAL RANKING'}</div><h2>${esc(c.winner)}</h2><div class="champion-sub">${c.isKO?'Official Championship Winners':'Official Final Leaderboard · Rank #1'}</div>${c.runner?`<div class="pair-sub"><span>RUNNER-UP · ${esc(c.runner)}</span></div>`:''}</section>`:`<section class="champion" id="champion"><div class="trophy">✦</div><div class="eyebrow">OFFICIAL SESSION RESULTS</div><h2>Competition in progress</h2><div class="champion-sub">Final champion appears when the session finishes</div></section>`;}
function leaderboard(){
 const title=stageName()+' Leaderboard';const hdr=isFixed?'PAIR':'PLAYER';
 return `<section class="section" id="leaderboard"><div class="section-head"><h2><span class="num">${data.ko?.format&&data.ko.format!=='none'?'02':'01'} /</span>${title}</h2><span class="label">OFFICIAL STANDINGS</span></div><div class="leader-card"><table class="leader"><thead><tr><th>${hdr}</th><th>W–L–T</th><th>DIFF</th><th>P</th><th title="Games Played">G</th></tr></thead><tbody>${stats.map((s,i)=>`<tr data-standing="${s.id}"><td><button class="pick" type="button" data-select-player="${s.id}" aria-label="Analyze ${esc(s.name)}">${String(i+1).padStart(2,'0')} · ${esc(s.name)} ↗</button></td><td>${s.w}–${s.l}–${s.t}</td><td>${signed(s.diff)}</td><td>${s.p}</td><td>${s.g}</td></tr>`).join('')}</tbody></table></div><p class="small">Ranked by Wins → Game Difference → Points For. Confirmed matches only. Tap a ${isFixed?'pair':'player'} to explore performance.</p></section>`;
}
function rounds(){let byRound=new Map();for(const m of matches){if(!byRound.has(m.round))byRound.set(m.round,[]);byRound.get(m.round).push(m);}const parts=[...byRound].sort((a,b)=>b[0]-a[0]).map(([r,items])=>`<div class="round"><header>ROUND ${String(r).padStart(2,'0')}<span class="small">${items.length} MATCHES</span></header>${items.slice().reverse().map(m=>`<div class="result"><span class="result-text">C${String(m.court).padStart(2,'0')} · ${esc(team(m.a))}<br><span class="small">vs ${esc(team(m.b))}</span></span><span class="score">${m.x} – ${m.y}</span></div>`).join('')}</div>`);
 return `<section class="section rounds" id="round-results"><div class="section-head"><h2><span class="num">${data.ko?.format&&data.ko.format!=='none'?'03':'02'} /</span>${stageName()} Results</h2><span class="label">ROUND BY ROUND</span></div>${parts.join('')||'<p class="small">No confirmed results are available yet.</p>'}${parts.length>2?`<button type="button" class="results-toggle" id="p5-show-rounds" aria-expanded="false">View All Rounds ↓</button>`:''}</section>`;
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
 const loserGroups=[{name:'LOSERS OPENING',ids:[9,10,11,12]},{name:'SECOND CHANCE',ids:[17,18,19,20]},{name:'ELIMINATION QUALIFIER',ids:[23,24]},{name:'ELIMINATION PLAYOFF',ids:[26,27]},{name:'LOSERS SEMIFINAL',ids:[28]},{name:'LOSERS FINAL',ids:[29]}];
 const lookup=new Map(koMatches.map(m=>[Number(m.id),m]));
 function connected(groups,bracket){
  const cols=groups.map(g=>({name:g.name,items:g.ids.map(id=>lookup.get(id)).filter(Boolean)})).filter(g=>g.items.length);
  if(!cols.length)return '<div class="report-empty">No confirmed matches in this bracket yet.</div>';
  const cw=180,xgap=58,top=63,h=82,pitch=94;
  const largest=Math.max(...cols.map(c=>c.items.length)),height=Math.max(220,top+largest*pitch+24),width=18+cols.length*(cw+xgap)-xgap+36;
  const positions=new Map(),recorded=new Set(cols.flatMap(c=>c.items.map(m=>Number(m.id))));
  const sourceFor=m=>(sources[m.id]||[]).filter(src=>recorded.has(Number(src.slice(1)))).map(src=>Number(src.slice(1)));
  cols.forEach((col,i)=>{
    let targets=col.items.map((m,j)=>{const parents=sourceFor(m).map(id=>positions.get(id)).filter(Boolean);let y=parents.length?parents.reduce((a,v)=>a+v.y,0)/parents.length:top+((j+.5)/col.items.length)*(height-top-h)-h/2;return {m,y};});
    if(!i)targets=targets.map((x,j)=>({...x,y:top+(largest-col.items.length)*pitch/2+j*pitch}));
    else{
      targets.sort((a,b)=>a.y-b.y||a.m.id-b.m.id);
      for(let j=1;j<targets.length;j++)targets[j].y=Math.max(targets[j].y,targets[j-1].y+h+8);
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
  const headings=cols.map((c,i)=>`<div class="share-tree-heading" style="left:${18+i*(cw+xgap)}px"><span>${bracket==='W'?'WINNERS BRACKET':'LOSERS BRACKET'}</span><strong>${esc(c.name)}</strong></div>`).join('');
  const cards=cols.flatMap(c=>c.items.map(m=>{let pos=positions.get(Number(m.id)),aWin=m.x>m.y,bWin=m.y>m.x;
   const l=(name,score,win)=>`<div class="share-tree-team ${win?'is-winner':''}"><span>${win?'◆ ':''}${esc(name)}</span><b>${score}</b></div>`;
   return `<button class="share-tree-card" type="button" style="left:${pos.x}px;top:${pos.y}px" data-ko-match="${esc(m.id)}" data-ko-players="${[...m.teamA,...m.teamB].join(',')}" aria-label="Match ${m.id}, ${esc(team(m.teamA))} ${m.x}, ${esc(team(m.teamB))} ${m.y}"><div class="share-tree-card-head"><span>${bracket}${String(m.id).padStart(2,'0')}</span></div>${l(team(m.teamA),m.x,aWin)}${l(team(m.teamB),m.y,bWin)}</button>`;
  })).join('');
  return `<div class="share-tree-frame"><div class="share-tree-mobile-hint">↔ SWIPE TO FOLLOW THE BRACKET</div><div class="share-tree-scroll" role="region" aria-label="Connected ${bracket==='W'?'Winners':'Losers'} bracket" tabindex="0"><div class="share-tree-canvas" style="width:${width}px;height:${height}px"><svg class="share-tree-lines" viewBox="0 0 ${width} ${height}" aria-hidden="true">${links}</svg>${headings}${cards}</div></div><div class="share-tree-foot">CHAMPAGNE HIGHLIGHTS THE WINNER · TAP A MATCH FOR DETAILS</div></div>`;
 }
 const winners=connected(winnerGroups,'W'),losers=connected(loserGroups,'L');
 const gf=koMatches.filter(m=>m.group==='F').slice().sort((a,b)=>Number(b.id)-Number(a.id));
 const wLast=winnerGroups.flatMap(g=>g.ids).map(id=>lookup.get(id)).filter(Boolean).at(-1);
 const lLast=loserGroups.flatMap(g=>g.ids).map(id=>lookup.get(id)).filter(Boolean).at(-1);
 function sourceCard(m,label){
  const aWin=m&&m.x>m.y,win=m?(aWin?m.teamA:m.teamB):[],lose=m?(aWin?m.teamB:m.teamA):[];
  return `<button class="p5-path-source" type="button" ${m?`data-ko-match="${esc(m.id)}" data-ko-players="${[...m.teamA,...m.teamB].join(',')}"`:''}><small>${label}${m?' · M'+m.id:''}</small><strong>${m?esc(team(win)):'Pending'}</strong>${m?`<span>Defeated ${esc(team(lose))} · ${Math.max(m.x,m.y)}–${Math.min(m.x,m.y)}</span>`:''}</button>`;
 }
 function finalCard(m,label){
  if(!m)return '';
  const aWin=m.x>m.y;
  return `<button class="p5-path-final" type="button" data-ko-match="${esc(m.id)}" data-ko-players="${[...m.teamA,...m.teamB].join(',')}"><small>${label} · M${m.id}</small><div class="p5-path-team ${aWin?'is-winner':''}"><span>${esc(team(m.teamA))}</span><b>${m.x}</b></div><div class="p5-path-team ${!aWin?'is-winner':''}"><span>${esc(team(m.teamB))}</span><b>${m.y}</b></div></button>`;
 }
 const ascendingFinals=gf.slice().reverse(),grand=ascendingFinals[0],reset=ascendingFinals[1];
 const path=grand?`<div class="p5-champ-path p5-horizontal-final-path"><div class="p5-champ-feed">${sourceCard(wLast,'WINNERS FINAL')}${sourceCard(lLast,'LOSERS FINAL')}</div><div class="p5-champ-connect" aria-hidden="true"><svg viewBox="0 0 54 180" preserveAspectRatio="none"><path d="M0 43 H29 V90 H54 M0 137 H29 V90"/></svg></div><div class="p5-champ-finals">${finalCard(grand,'GRAND FINAL')}</div>${reset?`<div class="p5-reset-arrow" aria-hidden="true"><span>→</span></div><div class="p5-champ-finals p5-champ-reset">${finalCard(reset,'GRAND FINAL RESET')}</div>`:''}</div>`:'<p class="small">Grand Final pending</p>';
 return `<section class="section" id="knockout"><div class="section-head"><h2><span class="num">01 /</span>Knockout Bracket</h2><span class="label">${esc(data.ko.format.toUpperCase())} ELIMINATION</span></div><p class="p5-ko-intro">Select a bracket. Tap any match to view the result.</p><nav class="ko-subnav p5-ko-tabbar ${data.ko.format==='double'?'is-double':'is-single'}" role="tablist" aria-label="Knockout bracket sections">${data.ko.format==='double'?'<button type="button" role="tab" class="is-current" id="p5-tab-finals" aria-controls="share-finals" aria-selected="true" data-p5-bracket-tab="share-finals">Championship</button>':''}<button type="button" role="tab" ${data.ko.format==='single'?'class="is-current" aria-selected="true"':'aria-selected="false"'} id="p5-tab-winners" aria-controls="share-winners" data-p5-bracket-tab="share-winners">${data.ko.format==='single'?'Knockout':'Winners'}</button>${data.ko.format==='double'?'<button type="button" role="tab" id="p5-tab-losers" aria-selected="false" aria-controls="share-losers" data-p5-bracket-tab="share-losers">Losers</button>':''}</nav>${data.ko.format==='double'?`<div class="bracket-block ko-navigator p5-ko-tabpanel" id="share-finals" role="tabpanel" aria-labelledby="p5-tab-finals" data-p5-bracket-panel><div class="block-title">CHAMPIONSHIP PATH</div><div class="block-hint">Winners Final + Losers Final → Grand Final → Reset (if played)</div><div class="p5-ko-gesture">SWIPE LEFT / RIGHT TO FOLLOW THE BRACKET →</div>${path}</div>`:''}<div class="bracket-block ko-navigator p5-ko-tabpanel" id="share-winners" role="tabpanel" aria-labelledby="p5-tab-winners" data-p5-bracket-panel ${data.ko.format==='double'?'hidden':''}><div class="block-title">${data.ko.format==='double'?'WINNERS BRACKET · UNBEATEN PATH':'KNOCKOUT BRACKET'}</div><div class="block-hint">Opening Draw → Quarterfinals → Semifinals → ${data.ko.format==='double'?'Winners Final':'Final'}</div>${winners}</div>${data.ko.format==='double'?`<div class="bracket-block ko-navigator p5-ko-tabpanel" id="share-losers" role="tabpanel" aria-labelledby="p5-tab-losers" data-p5-bracket-panel hidden><div class="block-title">LOSERS BRACKET · SECOND CHANCE</div><div class="block-hint">Elimination path to the Losers Final.</div>${losers}</div>`:''}<div class="p5-ko-match-inspector" id="p5-ko-match-inspector" aria-live="polite" hidden></div></section>`;
}
function analysis(){return `<section class="section" id="pair-analysis"><div class="section-head"><h2><span class="num">${data.ko?.format&&data.ko.format!=='none'?'04':'03'} /</span>Analyze Your ${isFixed?'Pair':'Player'}</h2><span class="label">PERSONAL PERFORMANCE</span></div><div class="analysis-wrap"><p class="small">Your match journey across the session${koMatches.length?' and championship':''}. Tap a leaderboard name or choose below.</p><label class="eyebrow" for="analysis-select">SELECT ${isFixed?'PAIR':'PLAYER'}</label><select id="analysis-select"><option value="">Choose ${isFixed?'a pair':'a player'}</option>${stats.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><div id="analysis-report" class="analysis-panel" hidden></div></div></section>`;}
function analyze(id,scroll=false){let p=stats.find(x=>x.id===id),e=document.getElementById('analysis-report');if(!p||!e)return;let ko=koMatches.filter(m=>m.teamA.includes(id)||m.teamB.includes(id)).map(m=>{const ours=m.teamA.includes(id)?m.x:m.y,theirs=m.teamA.includes(id)?m.y:m.x;return {round:'KO M'+m.id,court:null,ours,theirs,result:ours>theirs?'W':ours<theirs?'L':'T',opponents:m.teamA.includes(id)?m.teamB:m.teamA,teamMembers:(m.teamA.includes(id)?m.teamA:m.teamB).filter(a=>a!==id)}});
 const history=[...ko.slice().reverse(),...p.history.slice().reverse().map(x=>({...x,round:'R'+x.round}))];let wins=history.filter(x=>x.result==='W').length,losses=history.filter(x=>x.result==='L').length,ties=history.filter(x=>x.result==='T').length,gameDiff=history.reduce((a,m)=>a+m.ours-m.theirs,0);
 e.hidden=false;e.innerHTML=`<h3>${esc(p.name)}</h3><p class="small">${isFixed?'Fixed Partner':'Individual'} · ${p.g} ${data.ko?.format&&data.ko.format!=='none'?'Stage 1 matches · '+ko.length+' KO matches':'matches played'}</p><div class="analysis-metrics"><div><strong>${history.length?Math.round(100*wins/history.length):0}%</strong><small>WIN RATE</small></div><div><strong>${wins}–${losses}–${ties}</strong><small>W–L–T</small></div><div><strong>${signed(gameDiff)}</strong><small>GAME DIFF</small></div></div><div class="analysis-history-group"><h4>RECORDED MATCH JOURNEY</h4>${history.map(m=>`<div class="analysis-game"><span>${esc(m.result)} · ${esc(m.round)}${m.court?' · C'+m.court:''}${m.teamMembers?.length?' · with '+esc(team(m.teamMembers)):''}<br><span class="small">vs ${esc(team(m.opponents))}</span></span><strong>${m.ours}–${m.theirs}</strong></div>`).join('')||'<p class="small">No confirmed matches yet.</p>'}</div>`;
 document.getElementById('analysis-select').value=String(id);document.querySelectorAll('[data-standing]').forEach(r=>r.classList.toggle('is-selected',r.dataset.standing===String(id)));if(scroll)document.getElementById('pair-analysis').scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){source=new Map(data.roster.map(p=>[p.id,p]));makeMatches();computeStats();const hasKO=data.ko&&data.ko.format!=='none';
 const statsLabel=stageName();document.title='PADEL 5IVE · '+statsLabel+' Official Results';
 const stage2Intro=hasKO?`<div class="p5-slim-stage">STAGE 2 <span>/</span> CHAMPIONSHIP</div>`:'';
 const stage1Intro=hasKO?`<div class="p5-slim-stage">STAGE 1 <span>/</span> QUALIFYING RESULTS</div>`:'';
 const tabs=hasKO?`<nav class="share-tabs" aria-label="Results sections"><a href="#overview">Overview</a><a href="#knockout">Bracket</a><a href="#leaderboard">Standings</a><a href="#round-results">Rounds</a><a href="#pair-analysis">Analysis</a></nav>`:`<nav class="share-tabs" aria-label="Results sections"><a href="#overview">Overview</a><a href="#leaderboard">Standings</a><a href="#round-results">Rounds</a><a href="#pair-analysis">Analysis</a></nav>`;
 // The public results are editorial/read-only. With KO, the final outcome and
 // Stage 2 are shown FIRST, while Stage 1 qualification follows them.
 el.innerHTML=hero()+champion()+tabs+stage2Intro+(hasKO?koBracket():'')+stage1Intro+leaderboard()+rounds()+analysis()+`<footer class="share-footer"><div class="p5-footer-brand">PADEL 5IVE</div><div class="p5-footer-tagline"><em>BEYOND 5IVE. BEYOND PLAY.</em></div></footer>`;
 document.querySelectorAll('[data-select-player]').forEach(b=>b.addEventListener('click',()=>analyze(Number(b.dataset.selectPlayer),true)));
 document.getElementById('analysis-select')?.addEventListener('change',e=>{if(e.target.value)analyze(Number(e.target.value));else document.getElementById('analysis-report').hidden=true;});
 document.getElementById('p5-show-rounds')?.addEventListener('click',e=>{let p=document.getElementById('round-results'),v=p.classList.toggle('is-expanded');e.currentTarget.textContent=v?'Show Fewer Rounds ↑':'View All Rounds ↓';e.currentTarget.setAttribute('aria-expanded',String(v));});
 // Shared KO viewer controls: mutually exclusive tab panels and read-only match details.
 const koPanels=[...document.querySelectorAll('[data-p5-bracket-panel]')];
 const koTabs=[...document.querySelectorAll('[data-p5-bracket-tab]')];
 function selectBracketPanel(id,updateUrl=false){
  if(!koPanels.some(p=>p.id===id))return;
  for(const p of koPanels)p.hidden=p.id!==id;
  const oldInspector=document.getElementById('p5-ko-match-inspector');if(oldInspector){oldInspector.hidden=true;oldInspector.innerHTML='';}
  document.querySelectorAll('[data-ko-match]').forEach(c=>c.classList.remove('active','muted'));
  for(const t of koTabs){const active=t.dataset.p5BracketTab===id;t.classList.toggle('is-current',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;}
  if(updateUrl&&location.hash!=='#'+id)history.replaceState(null,'','#'+id);
 }
 koTabs.forEach((t,i)=>{
  t.addEventListener('click',()=>selectBracketPanel(t.dataset.p5BracketTab,true));
  t.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'&&e.key!=='Home'&&e.key!=='End')return;e.preventDefault();let n=e.key==='Home'?0:e.key==='End'?koTabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+koTabs.length)%koTabs.length;selectBracketPanel(koTabs[n].dataset.p5BracketTab,true);koTabs[n].focus();});
 });
 function syncBracketHash(){const id=location.hash.slice(1);if(id.startsWith('share-'))selectBracketPanel(id,false);}
 syncBracketHash();window.addEventListener('hashchange',syncBracketHash);
 function matchPhase(m){const id=Number(m.id);if(m.group==='F')return Number(m.round)===2?'Grand Final Reset':'Grand Final';if(m.group==='W')return id<=8?'Opening Draw':id<=16?'Quarterfinals':id<=22?'Semifinals':data.ko.format==='double'?'Winners Final':'Final';return id<=12?'Losers Opening':id<=20?'Second Chance':id<=24?'Elimination Qualifier':id<=27?'Elimination Playoff':id===28?'Losers Semifinal':'Losers Final';}
 const koInspector=document.getElementById('p5-ko-match-inspector');
 document.querySelectorAll('[data-ko-match]').forEach(btn=>btn.addEventListener('click',()=>{
  const selected=btn.classList.contains('active'),players=btn.dataset.koPlayers.split(','),m=koMatches.find(x=>String(x.id)===btn.dataset.koMatch);
  document.querySelectorAll('[data-ko-match]').forEach(card=>{card.classList.remove('active','muted');if(!selected){const other=card.dataset.koPlayers.split(',');card.classList.add(other.some(id=>players.includes(id))?'active':'muted');}});
  if(selected||!m){koInspector.hidden=true;koInspector.innerHTML='';return;}
  const aWins=m.x>m.y,bWins=m.y>m.x;
  koInspector.hidden=false;
  koInspector.innerHTML=`<div class="p5-inspect-head"><span>${esc(matchPhase(m))} · MATCH ${esc(m.id)}</span><button type="button" class="p5-inspect-close" aria-label="Close match details">×</button></div><div class="p5-inspect-teams"><div class="${aWins?'is-winner':''}"><strong>${esc(team(m.teamA))}</strong><b>${m.x}</b></div><div class="${bWins?'is-winner':''}"><strong>${esc(team(m.teamB))}</strong><b>${m.y}</b></div></div><p>${aWins||bWins?`Winner: <strong>${esc(team(aWins?m.teamA:m.teamB))}</strong>`:'Match tied'}</p>`;
  koInspector.querySelector('.p5-inspect-close')?.addEventListener('click',()=>{koInspector.hidden=true;koInspector.innerHTML='';document.querySelectorAll('[data-ko-match]').forEach(card=>card.classList.remove('active','muted'));});
  koInspector.scrollIntoView({block:'nearest',behavior:'smooth'});
 }));
}
async function load(){try{let id=location.pathname.match(/^\/u\/([A-Za-z0-9_-]{6,32})\/?$/)?.[1];if(!id||!ID.test(id))throw Error('Invalid public results URL');let response=await fetch('/api/unified-results?id='+encodeURIComponent(id),{credentials:'omit',cache:'no-store'});let res=await response.json();if(!response.ok)throw Error(res?.error||'Unable to load published results');data=check(res?.data);render();}catch(err){console.error(err);el.innerHTML=`<div class="error-panel" role="alert"><div class="eyebrow">PADEL 5IVE · OFFICIAL RESULTS</div><h1>Results Unavailable</h1><p>${esc(err.message||'Unable to open this link')}</p><p>Please contact the organizer for an updated link.</p></div>`;}}
load();
})();
