/* PADEL 5IVE · First Edition v1.5 · read-only Player / Pair Statistics
 * Uses the official P5App state + official ranking, never modifies either.
 * Shared Americano / Mexicano, including Individual, Fixed Partner and Mixed pairing.
 */
(function(root){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const key=id=>String(id);
 const nameOf=(state,id)=>{
  const p=(state.roster||[]).find(x=>key(x.id)===key(id));
  return p?(p.names||[]).filter(Boolean).join(' & '):'Unknown';
 };
 const sideNames=(state,ids)=>(ids||[]).map(id=>nameOf(state,id)).join(' & ')||'—';
 const scoreValid=m=>m.confirmed&&Array.isArray(m.score)&&m.score.length===2&&m.score.every(Number.isFinite);
 const toRankedCounts=(map,state)=>Array.from(map.entries()).sort((a,b)=>b[1]-a[1]||nameOf(state,a[0]).localeCompare(nameOf(state,b[0]))).map(([id,count])=>({id,name:nameOf(state,id),count}));
 function analyze(state,ranking,participantId){
  if(!state||!Array.isArray(state.roster)||!Array.isArray(state.rounds))throw Error('Session has no match history');
  const p=state.roster.find(x=>key(x.id)===key(participantId));
  if(!p)throw Error('Player or pair not found in current session');
  const rankRows=Array.isArray(ranking)?ranking:[];
  const rankIndex=rankRows.findIndex(x=>key(x.id)===key(participantId));
  const official=rankIndex>=0?rankRows[rankIndex]:null;
  const history=[],paired=new Map(),opposed=new Map();
  let played=0,wins=0,losses=0,ties=0,scored=0,conceded=0;
  (state.rounds||[]).forEach((round,ri)=>{
   (round.matches||[]).forEach((m,mi)=>{
    if(!m||!Array.isArray(m.teams)||m.teams.length!==2)return;
    const side=m.teams.findIndex(ids=>Array.isArray(ids)&&ids.some(id=>key(id)===key(participantId)));
    if(side<0)return;
    const other=1-side,valid=scoreValid(m);
    const a=valid?Number(m.score[side]):null,b=valid?Number(m.score[other]):null;
    const result=valid?(a>b?'W':a<b?'L':'T'):'UPCOMING';
    const mates=m.teams[side].filter(id=>key(id)!==key(participantId));
    const opponents=m.teams[other];
    if(valid){
     played++;scored+=a;conceded+=b;
     if(result==='W')wins++;else if(result==='L')losses++;else ties++;
     for(const id of mates)paired.set(key(id),(paired.get(key(id))||0)+1);
     for(const id of opponents)opposed.set(key(id),(opposed.get(key(id))||0)+1);
    }
    history.push({
     round:Number.isInteger(round.index)?round.index+1:ri+1,
     court:Number.isInteger(m.court)?m.court:mi+1,
     own:sideNames(state,m.teams[side]),
     other:sideNames(state,opponents),
     ownScore:a,otherScore:b,completed:valid,result,
     id:m.id==null?'':String(m.id)
    });
   });
  });
  // The ranking remains the authority: we do not recalculate or alter tie-breaks.
  const g=official?official.g:played;
  const w=official?official.w:wins,l=official?official.l:losses,t=official?official.t:ties;
  return {
   id:p.id,name:(p.names||[]).filter(Boolean).join(' & ')||'Unnamed',
   type:(p.names||[]).filter(Boolean).length>=2?'PAIR':'PLAYER',
   rank:rankIndex<0?null:rankIndex+1,mode:String(state.mode||''),
   played:g,w,l,t,winRate:g?Math.round(w*100/g):0,
   points:official?official.p:scored,diff:official?official.diff:scored-conceded,
   scored,conceded,avgScored:played?scored/played:0,avgConceded:played?conceded/played:0,
   paired:toRankedCounts(paired,state),opposed:toRankedCounts(opposed,state),
   history,completed:played,scheduled:history.length
  };
 }
 function metric(label,value,accent){
  return '<div class="p5ps-metric"><strong'+(accent?' class="'+accent+'"':'')+'>'+esc(value)+'</strong><small>'+esc(label)+'</small></div>';
 }
 function record(p){
  const title=p.result==='W'?'WIN':p.result==='L'?'LOSS':p.result==='T'?'TIE':'NOT STARTED';
  const score=p.completed?String(p.ownScore)+' – '+String(p.otherScore):'— : —';
  const statusClass=p.result==='W'?'win':p.result==='L'?'loss':p.result==='T'?'tie':'pending';
  return '<article class="p5ps-game"><div class="p5ps-game-top"><span>ROUND '+esc(p.round)+' · COURT '+esc(p.court)+'</span><b class="'+statusClass+'">'+title+'</b></div>'+
    '<div class="p5ps-game-grid"><div><small>YOUR TEAM</small><strong>'+esc(p.own)+'</strong></div>'+
    '<div class="p5ps-game-score">'+esc(score)+'</div><div><small>OPPONENTS</small><strong>'+esc(p.other)+'</strong></div></div></article>';
 }
 function group(title,items,empty){
  return '<div class="p5ps-group"><h3>'+esc(title)+'</h3>'+(
   items.length?items.slice(0,10).map((x,i)=>'<div class="p5ps-group-row"><span>'+String(i+1)+'. '+esc(x.name)+'</span><b>'+x.count+'×</b></div>').join(''):
   '<p>'+esc(empty)+'</p>')+'</div>';
 }
 function view(p,options){
  const fixed=p.type==='PAIR',editable=!!options.editable;
  const isSitout=options.status==='sitout';
  const pencil='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15.5 5.5 3 3M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/></svg>';
  const closeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>';
  const edit=editable?'<button class="p5ps-edit" type="button" data-p5ps-edit aria-label="Edit '+esc(p.type.toLowerCase())+' name" title="Edit name only">'+pencil+'</button>':'';
  const participation='<div class="p5ps-participation"><div class="p5ps-participation-info"><span>PARTICIPATION</span><small>'+
    (editable?'Changes apply next eligible round after saving':'Current session status · view only')+'</small></div>'+
    '<button type="button" class="p5ps-attendance-switch '+(!isSitout?'is-on':'is-off')+'" role="switch" '+
    'aria-label="Participant active for next round" aria-checked="'+(!isSitout)+'" '+
    'data-p5ps-status="'+(isSitout?'active':'sitout')+'" '+(!editable?'disabled':'')+'>'+
    '<span class="p5ps-switch-track"><span class="p5ps-switch-thumb"></span></span>'+
    '<span class="p5ps-switch-label">'+(isSitout?'SIT OUT':'ACTIVE')+'</span></button></div>';
  return '<div class="p5ps-handle" aria-hidden="true"></div>'+
   '<div class="p5ps-head"><div class="p5ps-heading"><div class="p5ps-eyebrow">PADEL 5IVE · '+esc(p.type)+' STATISTICS</div>'+
   '<div class="p5ps-title-row"><h2 id="p5ps-title">'+esc(p.name)+'</h2>'+edit+'</div><div class="p5ps-subtitle">STAGE 1 · '+esc(p.mode.replace(/[-_]/g,' ').toUpperCase())+'</div></div>'+
   '<button class="p5ps-close" type="button" aria-label="Close statistics" data-p5ps-close>'+closeIcon+'</button></div>'+
   (options.showStatus?participation:'')+
   '<div class="p5ps-hero"><div><small>WIN RATE</small><strong>'+p.winRate+'%</strong></div>'+
   '<div class="p5ps-rank"><small>CURRENT RANK</small><strong>'+(p.rank==null?'—':'#'+p.rank)+'</strong></div></div>'+
   '<div class="p5ps-metrics">'+metric('PLAYED',p.played)+metric('WINS',p.w,'win')+metric('LOSSES',p.l,'loss')+metric('TIES',p.t)+'</div>'+
   '<div class="p5ps-totals">'+
   '<div><span>TOTAL POINTS</span><strong>'+esc(p.points)+'</strong></div>'+
   '<div><span>GAME DIFFERENCE</span><strong>'+(p.diff>0?'+':'')+esc(p.diff)+'</strong></div>'+
   '<div><span>SCORED / AVG</span><strong>'+p.scored+' / '+p.avgScored.toFixed(1)+'</strong></div>'+
   '<div><span>CONCEDED / AVG</span><strong>'+p.conceded+' / '+p.avgConceded.toFixed(1)+'</strong></div></div>'+
   '<h3 class="p5ps-section">PAIRING ANALYSIS</h3>'+
   '<div class="p5ps-groups">'+group('MOST PAIRED',p.paired,fixed?'Fixed partnership · statistics are for the pair':'No completed partner matches yet')+
   group('MOST OPPOSED',p.opposed,'No completed opponents yet')+'</div>'+
   '<div class="p5ps-section-row"><h3 class="p5ps-section">MATCH HISTORY</h3><span>'+p.completed+' played · '+(p.scheduled-p.completed)+' upcoming</span></div>'+
   '<div class="p5ps-games">'+(p.history.length?p.history.map(record).join(''):'<p class="p5ps-empty">No assigned matches yet.</p>')+'</div>'+
   '';
 }
 let dialog=null,origin=null,bypass=false,oldOverflow='';
 const close=()=>{
  if(!dialog)return;
  dialog.remove();dialog=null;origin=null;
  document.body.style.overflow=oldOverflow;
 };
 function open(id,source){
  if(!root.P5App||typeof root.P5App.getState!=='function'||typeof root.P5App.statistics!=='function')return;
  const state=root.P5App.getState();
  const ranking=root.P5App.statistics();
  let profile;
  try{profile=analyze(state,ranking,id)}catch(err){console.warn('Player stats unavailable',err);return;}
  close();origin=source||null;
  const editable=!!(origin&&origin.isConnected&&state.stage==='stage1'&&!document.body.classList.contains('p58-view-only'));
  const pending=state.sitoutPending||{};
  const saved=(state.sitout||[]).some(x=>key(x)===key(profile.id));
  const queued=Object.prototype.hasOwnProperty.call(pending,profile.id)?!!pending[profile.id]:saved;
  dialog=document.createElement('div');
  dialog.id='p5ps-layer';
  dialog.className='p5ps-layer';
  dialog.innerHTML='<div class="p5ps-backdrop" data-p5ps-close></div><section class="p5ps-panel" role="dialog" aria-modal="true" aria-labelledby="p5ps-title" tabindex="-1">'+view(profile,{editable,showStatus:state.stage==='stage1',status:queued?'sitout':'active'})+'</section>';
  document.body.appendChild(dialog);
  // Two visibly separate moderator flows backed by the original safe editor:
  // Edit Name exposes name fields ONLY; Participation exposes status ONLY.
  // Existing native validation, Save/Cancel and queued-next-round logic remain
  // authoritative. Never write scores, roster or session state from this view.
  const openNative=(intent)=>{
   if(!editable||!origin||!origin.isConnected)return;
   const mode=intent==='edit'?'name':'participation';
   const nativeRoot=document.getElementById('p5-modal-root');
   if(!nativeRoot)return;
   const btn=origin;close();
   bypass=true;
   try{btn.click();}finally{bypass=false;}
   if(!nativeRoot.querySelector('.p5-b3-participant-editor'))return;
   nativeRoot.dataset.p5psContext=mode;
   const heading=mode==='name'?'EDIT '+(profile.type==='PAIR'?'PAIR':'PLAYER')+' NAME':'PARTICIPATION · NEXT ROUND';
   const sync=()=>{
    const editor=nativeRoot.querySelector('.p5-b3-participant-editor');
    if(!editor){
     delete nativeRoot.dataset.p5psContext;
     watcher.disconnect();
     return;
    }
    const h=nativeRoot.querySelector('.p5-v2-modal > h2');
    if(h&&h.textContent!==heading)h.textContent=heading;
    const save=nativeRoot.querySelector('[data-act="modal-save"]');
    const buttonText=mode==='name'?'Save Name':'Confirm Participation';
    if(save&&save.textContent!==buttonText)save.textContent=buttonText;
   };
   const watcher=new MutationObserver(sync);
   watcher.observe(nativeRoot,{childList:true});
   if(mode==='participation'){
    const wanted=intent==='sitout'?'sitout':'active';
    const choice=nativeRoot.querySelector('.p5-b31-status-choice [data-act="participant-toggle"][data-status="'+wanted+'"]');
    // Clicking sets a DRAFT only; the native Save Changes commits the
    // requested status for the next eligible round.
    if(choice&&choice.getAttribute('aria-pressed')!=='true')choice.click();
   }
   sync();
   if(mode==='name')nativeRoot.querySelector('[data-rename-id]')?.focus({preventScroll:true});
   else nativeRoot.querySelector('.p5-b31-status-choice [data-act="participant-toggle"][aria-pressed="true"]')?.focus({preventScroll:true});
  };
  dialog.querySelector('[data-p5ps-edit]')?.addEventListener('click',()=>openNative('edit'));
  dialog.querySelector('[data-p5ps-status]')?.addEventListener('click',event=>openNative(event.currentTarget.dataset.p5psStatus));
  dialog.addEventListener('click',event=>{
   if(event.target.closest('[data-p5ps-close]')){event.preventDefault();close();}
  });
  oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  dialog.querySelector('.p5ps-panel')?.focus({preventScroll:true});
 }
 function findName(target){
  if(!target||typeof target.closest!=='function')return null;
  const targetName=target.closest('#americano .p5-b41-leaderboard .live-standings tbody button.mc38-rename[data-act="manage-participant"],#americano .p5-b41-leaderboard .live-standings tbody .p5-b41-static-name');
  if(!targetName||targetName.closest('.p5-lb-private'))return null;
  const id=targetName.getAttribute('data-id')||targetName.closest('tr')?.querySelector('[data-id]')?.getAttribute('data-id');
  if(id!=null)return {id,element:targetName};
  // Finished-stage names use static spans, so identify the unchanged official row order.
  const tr=targetName.closest('tr'),tbody=tr?.parentElement;
  const n=tr&&tbody?Array.prototype.indexOf.call(tbody.children,tr):-1;
  const row=n>=0&&root.P5App?.statistics?.()[n];
  return row?{id:row.id,element:targetName}:null;
 }
 function click(event){
  if(bypass||dialog)return;
  const hit=findName(event.target);if(!hit)return;
  event.preventDefault();event.stopPropagation();
  open(hit.id,hit.element.matches('button')?hit.element:null);
 }
 function keydown(event){
  if(dialog&&event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Enter'&&event.key!==' ')return;
  if(!event.target?.matches?.('#americano .p5-b41-leaderboard .p5-b41-static-name'))return;
  const hit=findName(event.target);if(!hit)return;
  event.preventDefault();event.stopPropagation();open(hit.id,null);
 }
 function enhance(){
  for(const node of document.querySelectorAll('#americano .p5-b41-leaderboard .live-standings tbody .p5-b41-static-name')){
   if(!node.hasAttribute('tabindex'))node.setAttribute('tabindex','0');
   node.setAttribute('role','button');
   node.setAttribute('title','View statistics');
   node.classList.add('p5ps-entry');
  }
 }
 let queued=false;
 const observe=new MutationObserver(()=>{
  if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});
 });
 function init(){
  if(!document.getElementById('americano'))return;
  document.addEventListener('click',click,true);
  document.addEventListener('keydown',keydown,true);
  observe.observe(document.getElementById('americano'),{childList:true,subtree:true});
  enhance();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 root.P5PlayerStatsV15=Object.freeze({analyze});
})(window);
