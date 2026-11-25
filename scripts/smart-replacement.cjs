// Runs inside the unified controller. The planner reads fixtures without mutating them.
function replacementPlan(s, target, side, slot, incoming) {
  const outgoing = target.teams[side][slot];
  const continuous = s.matchFlow === 'continuous';
  const targetRound = s.rounds.findIndex(r => r.matches.includes(target));
  const blocks = [], matches = [], relations = new Map(), games = new Map();
  const proposed = new Map();
  const switched = teams => teams.map(t => t.map(id => id === incoming ? outgoing : id === outgoing ? incoming : id));
  const selected = target.teams.map(t => t.slice());
  selected[side][slot] = incoming;
  proposed.set(target, selected);

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
    if (!teams.flat().includes(incoming)) continue;
    const key=canonical(teams);
    if (seen.has(key)) repeats++;
    seen.add(key);
  }
  proposed.delete(target);
  return {changes:proposed,repeats};
}

function replacementEligible(s, from, id) {
  if (from===id || s.sitout?.includes(id) || s.arrival?.[id]===false) return false;
  if (P5Structured.is(s) && s.roster.find(p=>p.id===from)?.group!==s.roster.find(p=>p.id===id)?.group) return false;
  if (P5AdvancedRules.pairFor(s,from) || P5AdvancedRules.pairFor(s,id)) return false;
  const coaches=P5AdvancedRules.coachIds(s);
  return coaches.includes(from)===coaches.includes(id);
}

function integrate() {
  const fs=require('node:fs'), file='public/modes/unified/index.html';
  let html=fs.readFileSync(file,'utf8');
  function edit(a,b) {
    if (html.split(a).length!==2) throw Error('Smart replacement anchor: '+a);
    html=html.replace(a,()=>b);
  }
  edit(' function matchForReplacement(id)',replacementPlan.toString()+'\n function matchForReplacement(id)');
  edit('window.P5AdvancedRules=',replacementEligible.toString()+'\nwindow.P5AdvancedRules=');
  for(const badge of ['SUB','SUB PAIR']) edit('+(sub?\' <small class="p5-sub-badge">'+badge+'</small>\':\'\')','');
  edit('All other scheduled matches stay unchanged. Confirmed scores and tournament history are protected.', 'Review the suggested updates to upcoming matches before confirming.');
  edit('Original participant remains eligible in other rounds. A one-match substitution is recorded in the session activity log.', '<span id="p5-replacement-preview" aria-live="polite">Choose a replacement to preview the schedule.</span>');
  edit('   return `<p class="p5-replace-note">','   for(const c of candidates)c.allowed=c.allowed&&replacementEligible(s,match.teams[m.side][m.slot],c.id);\n   return `<p class="p5-replace-note">');
  const preview = `if(e.target?.id==='p5-replacement-select'){
    const d=s.ui.modal, m=matchForReplacement(d.matchId), box=document.getElementById('p5-replacement-preview');
    if(!e.target.value){box.textContent='Choose a replacement to preview the schedule.';return;}
    const incoming=Number(e.target.value.split(':')[0]), plan=replacementPlan(s,m,d.side,d.slot,incoming);
    const names=teams=>teams.map(t=>t.map(id=>s.roster.find(p=>p.id===id)?.names.join(' & ')).join(' & ')).join(' vs ');
    const lines=Array.from(plan.changes,([f,t])=>{
      const index=s.rounds.findIndex(r=>r.matches.includes(f));
      return (index>=0?'Round '+(index+1):'Queue '+(s.continuous.queue.indexOf(f)+1))+' · '+names(t);
    });
    box.style.whiteSpace='pre-line';
    box.textContent=[lines.length?lines.length+' upcoming fixture(s) adjusted.':'No upcoming fixture adjustments.',...lines,plan.repeats?'Schedule includes '+plan.repeats+' repeat matchup(s) for this replacement.':''].filter(Boolean).join('\\n');
    return;
  }`;
  edit("document.addEventListener('change',e=>{if(e.target?.id==='setup-match-flow')","document.addEventListener('change',e=>{"+preview+"if(e.target?.id==='setup-match-flow')");
  edit("if(!c)return toast('Selected player", "if(!c||!replacementEligible(s,m.teams[draft.side][draft.slot],id)||activeReplacementMatches(m).some(f=>f.teams.flat().includes(id)))return toast('Selected player");
  edit('   m.originalTeams=original;', `   const plan=replacementPlan(s,m,draft.side,draft.slot,id);
   for(const [fixture,teams] of plan.changes){
    if(s.matchFlow==='continuous')fixture.adaptiveBaseTeams??=fixture.teams;
    fixture.teams=teams;
   }
   m.originalTeams=original;`);
  edit('   const slots=Array(s.courts).fill(null);slots[court-1]=m;',
    '   if(selected.adaptiveBaseTeams)m.adaptiveBaseTeams=selected.adaptiveBaseTeams;\n   const slots=Array(s.courts).fill(null);slots[court-1]=m;');
  edit(
    '  const currentQueue=c.queue.concat(taken.map(m=>({key:m.fixtureKey,teams:m.originalTeams?m.originalTeams.map(t=>t.slice()):m.teams.map(t=>t.slice())})));',
    `  const currentQueue=[
   ...c.queue.map(f=>({key:f.key,teams:f.adaptiveBaseTeams||f.teams})),
   ...taken.map(m=>({key:m.fixtureKey,teams:m.adaptiveBaseTeams||m.originalTeams||m.teams}))
  ];`
  );
  edit("toast('Player replaced for this match only')","toast('Replacement saved · '+plan.changes.size+' upcoming fixtures adjusted')");
  fs.writeFileSync(file,html);
}
if(require.main===module) integrate();
module.exports={replacementPlan};
