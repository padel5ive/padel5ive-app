// Runs inside the unified controller. The planner reads fixtures without mutating them.
function replacementPlan(s, target, side, slot, incoming, swap) {
  const outgoing = target.teams[side][slot];
  const continuous = s.matchFlow === 'continuous';
  const targetRound = s.rounds.findIndex(r => r.matches.includes(target));
  const blocks = [], matches = [], relations = new Map(), games = new Map();
  const proposed = new Map();
  const switched = teams => teams.map(t => t.map(id => id === incoming ? outgoing : id === outgoing ? incoming : id));
  const selected = target.teams.map(t => t.slice());
  selected[side][slot] = incoming;
  proposed.set(target, selected);
  if(swap){
    const teams=swap.fixture.teams.map(t=>t.slice());
    teams[swap.side][swap.slot]=outgoing;
    proposed.set(swap.fixture,teams);
  }

  // Count actual partners, opponents and appearances. Squared counts penalize
  // a third meeting more strongly than a second one.
  const fixturesSeen=new Map();
  const canonical = teams => teams.map(t=>t.slice().sort((a,b)=>a-b).join(',')).sort().join('|');
  let fixtureCost=0, repeatCost = 0, gameCost = 0;
  function count(map, key, step) {
    const before = map.get(key) || 0;
    map.set(key, before + step);
    return step * (2 * before + step);
  }
  function record(teams, step) {
    fixtureCost += count(fixturesSeen,canonical(teams),step);
    const [a,b] = teams;
    function relation(kind, x, y) {
      return count(relations, kind + Math.min(x,y) + '/' + Math.max(x,y), step);
    }
    for (const team of teams) {
      for (const id of team) gameCost += count(games, id, step);
      if (team.length === 2) repeatCost += 2 * relation('p', ...team);
    }
    for (const x of a) for (const y of b) repeatCost += relation('o', x, y);
  }
  function addBlock(fixtures, editable, index) {
    const affected = [];
    for (const m of fixtures) {
      if (!m || m.skipped || (continuous && m.cycle && m.cycle !== target.cycle)) continue;
      const teams = proposed.get(m) || m.teams;
      record(teams, 1);
      matches.push({m,index});
      if (teams.flat().some(id => id === incoming || id === outgoing)) affected.push(m);
    }
    if (editable && affected.length && affected.every(m => !m.confirmed && !m.score && !m.substitutions?.length)) {
      blocks.push({affected,index});
    }
  }
  s.rounds.forEach((r,i) => addBlock(r.matches, !continuous && i > Math.max(s.currentRound,targetRound) && (!r.eligibleIds || [incoming,outgoing].every(id=>r.eligibleIds.includes(id))), i));
  if (continuous) s.continuous.queue.forEach((m,i) => addBlock([m], true, s.rounds.length+i));

  // Swap both identities across an entire future round to avoid double booking.
  // The continuous queue has one fixture per block. Dispatch retains control of rest and courts.
  const toggled = new Set();
  function toggle(block) {
    for (const m of block.affected) {
      const before = proposed.get(m) || m.teams;
      const after = toggled.has(block) ? m.teams : switched(before);
      record(before,-1);
      record(after,1);
      if (toggled.has(block)) proposed.delete(m);
      else proposed.set(m,after);
    }
    if (toggled.has(block)) toggled.delete(block);
    else toggled.add(block);
  }
  function restCost() {
    if (continuous) return 0;
    let cost = 0;
    for (const id of [incoming,outgoing]) {
      let last = -2, streak = 0;
      for (const {m,index} of matches) {
        if (!(proposed.get(m)||m.teams).some(t => t.includes(id))) continue;
        streak = last === index-1 ? streak+1 : 1;
        cost += streak-1;
        last = index;
      }
    }
    return cost;
  }
  const metric = () => [fixtureCost,repeatCost,gameCost,restCost(),proposed.size];
  const better = (a,b) => {const i=a.findIndex((v,j)=>v!==b[j]);return i>=0 && a[i]<b[i];};
  // Bounded local search. Every accepted move strictly improves the schedule.
  for (let pass=0; pass<8; pass++) {
    let best=metric(), choice=null;
    for (const block of blocks) {
      toggle(block);
      if (fixtureCost <= best[0]) {
        const value=metric();
        if (better(value,best)) {best=value;choice=block;}
      }
      toggle(block);
    }
    if (!choice) break;
    toggle(choice);
  }
  const seen=new Set();
  let repeats=0;
  for (const {m} of matches) {
    const teams=proposed.get(m)||m.teams;
    if (!teams.flat().some(id=>id===incoming||(swap&&id===outgoing))) continue;
    const key=canonical(teams);
    if (seen.has(key)) repeats++;
    seen.add(key);
  }
  proposed.delete(target);
  if(swap)proposed.delete(swap.fixture);
  return {changes:proposed,repeats};
}

function replacementCandidates(s, draft) {
  const {matchId, side, slot, draftScore}=draft;
  const round=s.rounds.find(r=>r.matches.some(m=>m?.id===matchId));
  const match=round?.matches.find(m=>m?.id===matchId);
  const from=match?.teams[side]?.[slot];
  if(from==null)return [];

  const active=s.matchFlow==='continuous'?P5Continuous.active(s):s.rounds[s.currentRound]?.matches;
  const assigned=s.matchFlow==='continuous'?(active||[]):round.matches;
  const onCourt=new Map();
  for(const fixture of assigned){
    if(!fixture||fixture.skipped)continue;
    fixture.teams.forEach((team,side)=>team.forEach((id,slot)=>onCourt.set(id,{fixture,side,slot})));
  }
  const games=new Map(P5UI.statistics(s).map(row=>[row.id,row.g]));
  const fixed=P5EngineRegistry.meta(s.mode).kind==='fixed';
  const group=id=>s.roster.find(p=>p.id===id)?.group;
  const structured=P5Structured.is(s),coaches=P5AdvancedRules.coachIds(s);
  const alreadyScoring=match.confirmed||match.skipped||match.score||Object.values(draftScore||{}).some(value=>value!=='');
  return s.roster.filter(p=>p.id!==from).map(p=>{
    const assignment=onCourt.get(p.id),court=assignment?.fixture.court;
    const availability=P5Availability.status(s,p.id);
    let reason='';
    if(availability!==P5Availability.ACTIVE)reason=availability===P5Availability.SIT_OUT?'Sit out':'Not arrived';
    else if(structured&&group(from)!==p.group)reason='Different group';
    else if(P5AdvancedRules.pairFor(s,from)||P5AdvancedRules.pairFor(s,p.id))reason='Locked partner';
    else if(coaches.includes(from)!==coaches.includes(p.id))reason='Coach role';
    else if(assignment?.fixture===match||court===match.court)reason='Same court';
    else if(alreadyScoring||assignment?.fixture.confirmed||assignment?.fixture.score)reason='Score entered';
    else if(assignment&&!active?.includes(match))reason='Outside current round';
    else if(assignment&&P5Availability.status(s,from)!==P5Availability.ACTIVE)reason='Source unavailable';
    return {id:p.id,name:p.names.join(fixed?' & ':''),played:games.get(p.id)||0,court,assignment,reason};
  });
}

function replacementMarkup(s, draft, esc) {
  const fixed=P5EngineRegistry.meta(s.mode).kind==='fixed';
  const label=fixed?'pair':'player';
  const candidates=replacementCandidates(s,draft);
  const resting=candidates.filter(p=>!p.reason&&!p.assignment).sort((a,b)=>a.played-b.played||a.name.localeCompare(b.name));
  const onCourt=candidates.filter(p=>!p.reason&&p.assignment).sort((a,b)=>a.court-b.court||a.name.localeCompare(b.name));
  const unavailable=candidates.filter(p=>p.reason);
  const options=(title,rows)=>rows.length?`<optgroup label="${title}">${rows.map(p=>{
    const description=[p.name,p.played+' played',p.court!=null?'Court '+p.court:'',p.reason].filter(Boolean).join(' · ');
    return `<option value="${p.id}:0" ${p.reason?'disabled':''}>${esc(description)}</option>`;
  }).join('')}</optgroup>`:'';
  return `<p class="p5-replace-current">${esc(draft.current.name)} · Court ${draft.court}</p>
    <label class="p5-replace-field">SELECT ${label.toUpperCase()}
      <select id="p5-replacement-select" aria-label="Choose replacement ${label}">
        <option value="">Select a ${label}</option>
        ${options('RESTING · REPLACE',resting)}${options('ON COURT · SWAP',onCourt)}${options('UNAVAILABLE',unavailable)}
      </select>
    </label>
    <div class="p5-replace-note" id="p5-replacement-preview" aria-live="polite">Choose a ${label} to preview the change.</div>`;
}

function replacementSelection(draft, value) {
  const id=Number(value.split(':')[0]);
  return replacementCandidates(s,draft).find(p=>p.id===id&&!p.reason);
}

function replacementSchedule(match, draft, candidate) {
  if(s.mode.endsWith('-mexicano'))return {changes:new Map(),repeats:0};
  return replacementPlan(s,match,draft.side,draft.slot,candidate.id,candidate.assignment);
}

function renderReplacementPreview(value) {
  const draft=s.ui.modal;
  const box=document.getElementById('p5-replacement-preview');
  const button=document.querySelector('[data-act="replace-save"]');
  if(draft?.type!=='replacement'||!box||!button)return;
  const candidate=replacementSelection(draft,value);
  const swap=candidate?.assignment;
  button.textContent=swap?'Confirm Swap':'Confirm Replacement';
  button.disabled=!candidate;
  if(!candidate){box.textContent='Choose an available option to preview the change.';return;}

  const match=matchForReplacement(draft.matchId);
  const plan=replacementSchedule(match,draft,candidate);
  const lines=swap?
    ['Court '+match.court+' · '+draft.current.name+' out, '+candidate.name+' in',
     'Court '+candidate.court+' · '+candidate.name+' out, '+draft.current.name+' in',
     'Swap only if both matches haven’t started.']:
    ['Court '+match.court+' · '+candidate.name+' in, '+draft.current.name+' rests'];
  if(s.mode.endsWith('-americano')){
    lines.push(plan.changes.size?plan.changes.size+' upcoming fixture(s) adjusted.':'No upcoming fixture adjustments.');
    if(plan.repeats)lines.push(plan.repeats+' repeat matchup(s) in the resulting schedule.');
  }
  box.style.whiteSpace='pre-line';
  box.textContent=lines.join('\n');
}

function setReplacementSlot(match,side,slot,incoming,fixed,at) {
  match.originalTeams??=match.teams.map(team=>team.slice());
  const fromId=match.originalTeams[side][slot];
  const display=id=>s.roster.find(p=>p.id===id)?.names.join(fixed?' & ':'')||'';
  match.substitutions=(match.substitutions||[]).filter(sub=>sub.side!==side||sub.slot!==slot);
  if(incoming!==fromId){
    match.substitutions.push({side,slot,wholePair:fixed,fromId,fromName:display(fromId),
      toId:incoming,toSlot:0,toName:display(incoming),at});
  }
  match.teams[side][slot]=incoming;
}

function saveReplacement(){
  const draft=s.ui.modal;
  if(draft?.type!=='replacement'||s.stage!=='stage1')return;
  const match=matchForReplacement(draft.matchId);
  if(!match||match.teams[draft.side]?.[draft.slot]!==draft.current.id)return toast('The court lineup changed. Reopen Replace Player.');
  const selected=document.getElementById('p5-replacement-select');
  const candidate=replacementSelection(draft,selected?.value||'');
  if(!candidate)return toast('This player or pair is no longer available.');
  const before=clone(s),swap=candidate.assignment,fixed=P5EngineRegistry.meta(s.mode).kind==='fixed';
  try{
    const plan=replacementSchedule(match,draft,candidate);
    const now=new Date().toISOString();
    setReplacementSlot(match,draft.side,draft.slot,candidate.id,fixed,now);
    if(swap)setReplacementSlot(swap.fixture,swap.side,swap.slot,draft.current.id,fixed,now);
    for(const [fixture,teams] of plan.changes){
      if(s.matchFlow==='continuous')fixture.adaptiveBaseTeams??=fixture.teams;
      fixture.teams=teams;
    }
    logAction(swap?'Court swap · '+draft.current.name+' ↔ '+candidate.name+' · C'+match.court+' / C'+candidate.court:
      'One-match substitution · '+draft.current.name+' → '+candidate.name+' · '+match.id);
    if(!save())throw Error('Storage save failed');
  }catch(error){
    s=before;
    render();
    return toast('Replacement failed: '+error.message);
  }
  undo.push(JSON.stringify({...before,ui:undefined}));
  if(undo.length>80)undo.shift();
  redo=[];
  resumeReplacement(draft);
  toast(swap?'Players swapped':'Replacement saved');
}

function integrate() {
  const fs=require('node:fs'), file='public/modes/unified/index.html';
  let html=fs.readFileSync(file,'utf8');
  function edit(a,b) {
    if (html.split(a).length!==2) throw Error('Smart replacement anchor: '+a);
    html=html.replace(a,()=>b);
  }
  function replaceSection(start,end,content){
    const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
    if(from<0||to<0)throw Error('Smart replacement section: '+start);
    html=html.slice(0,from)+content+html.slice(to);
  }
  const shared=[replacementCandidates,replacementMarkup].map(fn=>fn.toString()).join('\n');
  edit('window.P5AdvancedRules=',shared+'\nwindow.P5AdvancedRules=');
  for(const badge of ['SUB','SUB PAIR']) edit("+(sub?' <small class=\"p5-sub-badge\">"+badge+"</small>':'')",'');
  replaceSection("  const replacement=m.type==='replacement'?(()=>{","  const content=",
    "  const replacement=m.type==='replacement'?replacementMarkup(s,m,esc):'';\n");
  edit('title="Replace this match only"','title="Replace or swap player"');
  edit('data-act="replace-save">Confirm Replacement','data-act="replace-save" disabled>Confirm Replacement');
  replaceSection(' function activeReplacementMatches(m){',' function openReplace(el){','');
  edit("  const current=effectivePersonSlots(m).find(p=>p.side===side&&p.slot===slot);",
    "  const participant=s.roster.find(p=>p.id===m.teams[side]?.[slot]);\n  const current=participant&&{id:participant.id,name:participant.names.join(' & ')};");
  edit('matchId:id,side,slot,current,fromScore,draftScore','matchId:id,side,slot,current,court:m.court,fromScore,draftScore');
  edit("    if(a)a.value=m.draftScore.a;if(b)b.value=m.draftScore.b;",
    "    if(a)a.value=m.draftScore.a;if(b)b.value=m.draftScore.b;\n    if($('modal-a'))$('modal-a').value=m.draftScore.a;if($('modal-b'))$('modal-b').value=m.draftScore.b;");
  const controller=[replacementPlan,replacementSelection,replacementSchedule,renderReplacementPreview,setReplacementSlot,saveReplacement];
  replaceSection(' function saveReplacement(){',' function continuousReviewScore(){',
    controller.map(fn=>fn.toString()).join('\n')+'\n');
  edit("document.addEventListener('change',e=>{if(e.target?.id==='setup-match-flow')",
    "document.addEventListener('change',e=>{if(e.target?.id==='p5-replacement-select')return renderReplacementPreview(e.target.value);if(e.target?.id==='setup-match-flow')");
  edit('   const slots=Array(s.courts).fill(null);slots[court-1]=m;',
    '   if(selected.adaptiveBaseTeams)m.adaptiveBaseTeams=selected.adaptiveBaseTeams;\n   const slots=Array(s.courts).fill(null);slots[court-1]=m;');
  edit(
    '  const currentQueue=c.queue.concat(taken.map(m=>({key:m.fixtureKey,teams:m.originalTeams?m.originalTeams.map(t=>t.slice()):m.teams.map(t=>t.slice())})));',
    `  const currentQueue=[
   ...c.queue.map(f=>({key:f.key,teams:f.adaptiveBaseTeams||f.teams})),
   ...taken.map(m=>({key:m.fixtureKey,teams:m.adaptiveBaseTeams||m.originalTeams||m.teams}))
  ];`
  );
  fs.writeFileSync(file,html);
}
if(require.main===module) integrate();
module.exports={replacementPlan};
