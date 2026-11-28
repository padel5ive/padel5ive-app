function individualPrepareNextMatchHTML() {
 const pending = E.pendingMatches(state);
 const live = E.liveCourts(state);
 const closed = state.stage1Closed;
 const finish = state.equalization?.status === 'running' ? state.equalization : null;
 const rows = E.individualNextMatchMonitor(state);
 const next = rows.filter(m => m.finishingCourts.length);
 const onDeck = rows.filter(m => !m.finishingCourts.length);
 const allAllocated = !pending.length || (finish && finish.ids.every(id => !pending.some(m => m.id === id)));
 const message = closed ? 'Stage 1 closed' : allAllocated ? 'All matches allocated' :
  !live.length ? 'No eligible match. Check player availability.' :
  'No match can start after just one court finishes.';
 const row = (m,i) => {
  const next = m.confirmedNext;
  const status = next ? 'UP NEXT' : m.finishingCourts.length ?
   'WAITING FOR ' + m.finishingCourts.map(c => 'C'+c).join(' OR ') : 'ON DECK';
  return `<li class="prepare-row ${next?'prepare-row-locked':'prepare-row-standby'}"><span class="prepare-index">${String(i+1).padStart(2,'0')}</span><div class="prepare-division-slot">${matchCategoryBadge(m)}</div><div class="prepare-pairs"><span class="prepare-team" style="--team-accent:${teamColor('A')}"><i class="team-dot"></i>${esc(matchSideName('A',m))}</span><span class="prepare-versus">vs</span><span class="prepare-team" style="--team-accent:${teamColor('B')}"><i class="team-dot"></i>${esc(matchSideName('B',m))}</span></div><span class="prepare-status ${next?'prepare-ready':'prepare-standby'}">${status}</span></li>`;
 };
 return `<section class="prepare-next" aria-label="Prepare next match"><div class="prepare-next-heading"><div><h3>PREPARE NEXT MATCH</h3><p>${next.length?'Updates after each confirmed score':message}</p></div><span class="prepare-count">${pending.length} ${closed?'NOT PLAYED':'REMAINING'}</span></div>
 ${rows.length?`<div class="prepare-next-list">${next.length?`<div class="prepare-group-label">NEXT ON COURT</div><ol class="prepare-list">${next.map(row).join('')}</ol>`:''}${onDeck.length?`<div class="prepare-group-label">ON DECK · ORDER MAY CHANGE</div><ol class="prepare-list" start="${next.length+1}">${onDeck.map((m,i)=>row(m,next.length+i)).join('')}</ol>`:''}<p class="prepare-help">Use Live Matches to call players to court after score confirmation.</p></div>`:''}</section>`;
}
