/* PADEL 5IVE · Public Team Showdown Share Results · visual baseline v5.5.14
 * Read-only adapter for the existing Team Showdown Netlify results snapshot.
 * All public names are escaped; original scheduling and scoring engine untouched.
 */
(async()=>{
'use strict';
const root=document.getElementById('app');
const loading=document.getElementById('p5-loading');
const E=window.ClubEngine;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const names={A:'TEAM A',B:'TEAM B'};
const allPairs=new Map(),allPlayers=new Map();
const exactDate=value=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value||''));if(!m)return String(value||'—');const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])));return new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(d);};
function label(code){return names[code]||code;}
function formatPair(code,ix){const p=allPairs.get(`${code}${ix}`);return p?.label||`${label(code)} · Pair ${ix+1}`;}
function getPlayer(id){return allPlayers.get(String(id))||String(id||'Unknown');}
function selectedLineup(m,code){return Array.isArray(m?.[`players${code}`])?m[`players${code}`].map(getPlayer).join(' & '):label(code);}
function set(q,v){let el=root.querySelector(q);if(el)el.textContent=v;}
function emptyIf(shouldHide,sel){const el=root.querySelector(sel);if(el)el.hidden=!!shouldHide;}
function error(msg){if(loading)loading.remove();root.hidden=false;root.innerHTML=`<div style="max-width:560px;margin:16vh auto;background:#152b3d;border:1px solid #536371;border-radius:16px;padding:28px;text-align:center"><h1 style="color:#e2c293;font-size:22px">Results Unavailable</h1><p style="color:#e4e9ed;font-size:14px">${esc(msg)}</p><p style="color:#9baab6;font-size:12px">Please ask the organizer for the updated public link.</p></div>`;}
try{
 const match=location.pathname.match(/^\/r\/([A-Za-z0-9_-]{6,32})\/?$/);
 if(!match)throw Error('Invalid public results URL');
 const response=await fetch('/api/results?id='+encodeURIComponent(match[1]),{cache:'no-store',credentials:'omit'});
 const raw=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(raw.error||'Unable to retrieve results');
 if(raw?.schema!=='padel5ive-team-showdown-results-v1'||!raw.setup||!raw.roster||!Array.isArray(raw.schedule))throw Error('Invalid published Team Showdown report');
 const state={...E.newState(),...raw,version:1,activeWave:0,finalized:false};
 if(!E.validateSavedState(state))throw Error('Published results failed integrity validation');
 const data=E.migrateLegacySchedule(state);
 names.A=String(data.setup.clubs?.A||'TEAM A');names.B=String(data.setup.clubs?.B||'TEAM B');
 for(const c of ['A','B'])for(const [i,p] of (data.roster[c]||[]).entries()){
  const labelText=p.players?.map(x=>String(x.name||'').trim()).filter(Boolean).join(' & ')||p.name||`${c}${i+1}`;
  allPairs.set(`${c}${i}`,{label:labelText,team:c,index:i});
  for(const pl of p.players||[])allPlayers.set(String(pl.id),String(pl.name||pl.id));
 }
 const completed=(m)=>m&&Number.isInteger(m.scoreA)&&Number.isInteger(m.scoreB);
 const rr=(data.schedule||[]).flat().filter(completed).map((m,i)=>({...m,stage:1,sort:num(m.completedSequence??m.sequence??m.wave??0),order:i})).sort((a,b)=>b.sort-a.sort||b.order-a.order);
 const duels=(data.stage2?.matches||[]).filter(completed).slice().reverse();
 const deciders=E.stage3Matches(data).filter(completed).slice().reverse();
 const stats=E.stage1Stats(data),s2=data.stage2?E.stage2Stats(data):null,s3=data.stage3?E.stage3Stats(data):null,verdict=E.verdict(data);
 const hasStage2=!!data.stage2,hasStage3=!!data.stage3;
 const winner=verdict.champion,loser=winner==='A'?'B':'A';
 const played=rr.length+duels.length+deciders.length;
 // Preserve the existing approved report cover, date and simple metrics.
 set('.hero .session',data.setup.sessionName||'TEAM SHOWDOWN');
 set('.hero .subtitle',['TEAM ROUND ROBIN',...(hasStage2?['TEAM DUEL']:[]),...(hasStage3?['THE DECIDER']:[])].join(' · '));
 set('.p5-meta-date',exactDate(data.setup.date));
 const meta=root.querySelectorAll('.p5-meta-stat-row .p5-meta-stat strong');
 if(meta.length>=3){meta[0].textContent=String(data.setup.courts||'—');meta[1].textContent=String((data.roster.A||[]).length+(data.roster.B||[]).length);meta[2].textContent=String(played);}
 set('.winner h2',winner?label(winner):'Final Results Pending');
 set('.winner .sub',hasStage3?'Official Championship Winners · The Decider':hasStage2?'Official Championship Winners · Team Duel':'Official Round Robin Winners');
 set('.winner .runner',winner?'RUNNER-UP · '+label(loser):'Final results are pending');
 root.querySelector('.top-status').textContent=winner?'FINAL':'PUBLISHED';
 const result=root.querySelector('#team-result');
 if(result){const teams=result.querySelectorAll('.team strong');if(teams.length===2){teams[0].textContent=names.A;teams[1].textContent=names.B;}
  const points=verdict.points||{A:0,B:0};
  const score=result.querySelector('.team-bar .score');
  if(score)score.innerHTML=`${esc(points.A)}–${esc(points.B)}<small>STAGES WON</small>`;
  set('#team-result .p5-championship-signoff span:last-child',winner?label(winner)+' · CHAMPIONS':'CHAMPIONSHIP IN PROGRESS');
 }
 const summaries=[];
 const stageLine=(completed,aWins,bWins,aGames,bGames,kind)=>({
  desc:`${completed} ${kind} · ${names.A} ${aWins}W – ${bWins}W ${names.B}`,
  detail:`Total games · ${names.A} ${aGames} – ${bGames} ${names.B}`
 });
 if(hasStage3){const champ=s3?.winner;const v=stageLine(s3?.completed||0,s3?.wA||0,s3?.wB||0,s3?.pA||0,s3?.pB||0,'deciding match'+((s3?.completed||0)===1?'':'es'));
  summaries.push({n:3,name:'THE DECIDER',winner:champ,...v});}
 if(hasStage2){const v=stageLine(s2?.completed||0,s2?.wA||0,s2?.wB||0,s2?.pA||0,s2?.pB||0,'team duel'+((s2?.completed||0)===1?'':'s'));
  summaries.push({n:2,name:'TEAM DUEL',winner:s2?.winner,...v});}
 const rrInfo=stageLine(stats.team.A.played,stats.team.A.w,stats.team.B.w,stats.team.A.p,stats.team.B.p,'matches');
 summaries.push({n:1,name:'ROUND ROBIN',winner:stats.winner,...rrInfo});
 const summary=root.querySelector('#stage-summary .stage-summary');
 if(summary)summary.innerHTML=summaries.map(x=>`<article class="stage-card"><small>STAGE ${x.n} · ${x.name}</small><strong>${x.winner?esc(label(x.winner))+' Wins':'Stage Result Pending'}</strong><div class="desc">${esc(x.desc)}<span class="p5-detail">${esc(x.detail)}</span></div></article>`).join('');
 const summaryTitle=root.querySelector('#stage-summary .heading h2');
 if(summaryTitle)summaryTitle.innerHTML='<span>02 /</span> Stage Highlights';
 const makeMatchRow=(m,stage)=>{
  const a=stage===1?formatPair('A',m.a):selectedLineup(m,'A');
  const b=stage===1?formatPair('B',m.b):selectedLineup(m,'B');
  const where=stage===1?`R${esc(m.wave||m.round||'—')}`:`M${esc(m.id||'—')}`;
  const court=m.court??m.lastCourt??m.finishedCourt??'';
  return `<div class="match"><div class="meta">${where}${court?'<br>C'+esc(court):''}</div><div class="teams"><span>${esc(a)}</span><strong>vs ${esc(b)}</strong></div><div class="score">${num(m.scoreA)} – ${num(m.scoreB)}</div></div>`;
 };
 const block=(title,items,stage,open)=>`<details ${open?'open':''}><summary><div><strong>STAGE ${stage} · ${title}</strong><br><small>${items.length} matches</small></div><b>VIEW SCORES <span aria-hidden="true">⌄</span></b></summary><div class="matches">${items.map(m=>makeMatchRow(m,stage)).join('')||'<p class="mini">No scores yet</p>'}</div></details>`;
 const stageList=root.querySelector('#stage-list');
 if(stageList)stageList.innerHTML=[...(hasStage3?[block('The Decider',deciders,3,true)]:[]),...(hasStage2?[block('Team Duel',duels,2,true)]:[])].join('');
 const rrStage=root.querySelector('#rr-stage-list');
 if(rrStage)rrStage.innerHTML=block('Round Robin',rr,1,false);
 emptyIf(!hasStage2&&!hasStage3,'#match-history');
 const navMatch=root.querySelector('.nav a[href="#match-history"]');if(navMatch)navMatch.hidden=!hasStage2&&!hasStage3;
 const navStand=root.querySelector('.nav a[href="#standings"]');if(navStand)navStand.textContent='Standings';
 const navMatchType=root.querySelector('.nav a[href="#match-history"]');if(navMatchType)navMatchType.textContent='Matches';
 const rows=root.querySelector('#standings-rows'),filters=root.querySelector('.filters');
 if(filters)filters.innerHTML=[{id:'all',name:'All'},{id:'A',name:names.A},{id:'B',name:names.B}].map(f=>`<button type="button" data-filter="${f.id}" aria-pressed="${f.id==='all'}" class="${f.id==='all'?'active':''}">${esc(f.name)}</button>`).join('');
 const rank=stats.overallRanking;
 let currentFilter='all';
 const fillTable=()=>{if(!rows)return;rows.innerHTML=rank.filter(x=>currentFilter==='all'||x.team===currentFilter).map(x=>`<tr><td><button type="button" data-pair="${x.team}${x.index}">${String(x.rank).padStart(2,'0')} · ${esc(formatPair(x.team,x.index))} ↗</button></td><td>${x.w}–${x.l}–${x.d}</td><td>${x.diff>0?'+':''}${x.diff}</td><td>${x.p}</td><td>${x.played}</td></tr>`).join('');};
 fillTable();
 filters?.addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;currentFilter=b.dataset.filter;for(const x of filters.querySelectorAll('button')){const is=x===b;x.classList.toggle('active',is);x.setAttribute('aria-pressed',String(is));}fillTable();});
 const selector=root.querySelector('#analysis-select'),details=root.querySelector('#analysis-detail');
 if(selector)selector.innerHTML='<option value="">Choose a pair</option>'+rank.slice().sort((a,b)=>a.team.localeCompare(b.team)||a.index-b.index).map(x=>`<option value="${x.team}${x.index}">${esc(formatPair(x.team,x.index))}</option>`).join('');
 const analyze=(pairId,scroll=false)=>{
  if(!details)return;
  if(!pairId||!allPairs.has(pairId)){details.hidden=true;details.innerHTML='';return;}
  const pair=allPairs.get(pairId);const history=rr.filter(m=>m[pair.team.toLowerCase()]===pair.index);
  const wins=history.filter(m=>m.winner===pair.team).length;
  details.hidden=false;
  details.innerHTML=`<h3>${esc(pair.label)}</h3><p class="mini">${esc(label(pair.team))} · Round Robin Pair Performance</p><div class="analysis-metrics"><div><b>${history.length?Math.round(100*wins/history.length):0}%</b><small>WIN RATE</small></div><div><b>${wins}–${history.length-wins}</b><small>WINS · LOSSES</small></div><div><b>${history.length}</b><small>MATCHES</small></div></div><p class="mini">LATEST RESULTS FIRST</p>${history.map(m=>`<div class="match"><div class="meta">R${esc(m.wave||'—')}</div><div class="teams">${m.winner===pair.team?'WIN':'LOSS'} · vs ${esc(formatPair(pair.team==='A'?'B':'A',m[pair.team==='A'?'b':'a']))}</div><div class="score">${m[pair.team==='A'?'scoreA':'scoreB']}–${m[pair.team==='A'?'scoreB':'scoreA']}</div></div>`).join('')}`;
  if(selector)selector.value=pairId;
  if(scroll)root.querySelector('#analysis')?.scrollIntoView({behavior:'smooth',block:'start'});
 };
 rows?.addEventListener('click',e=>{const b=e.target.closest('button[data-pair]');if(b)analyze(b.dataset.pair,true);});
 selector?.addEventListener('change',e=>analyze(e.target.value));
 const links=[...root.querySelectorAll('.nav a:not([hidden])')];
 links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>x.classList.toggle('active',x===a));}));
 window.addEventListener('scroll',()=>{let selected=0;for(let i=0;i<links.length;i++){const t=root.querySelector(links[i].getAttribute('href'));if(t?.getBoundingClientRect().top<96)selected=i;}links.forEach((a,i)=>a.classList.toggle('active',selected===i));},{passive:true});
 document.title='PADEL 5IVE · '+(data.setup.sessionName||'Team Showdown')+' · Official Results';
 if(loading)loading.remove();root.hidden=false;
}catch(e){console.error('PADEL 5IVE public Team Showdown error:',e);error(e?.message||'Unable to load published results');}
})();
