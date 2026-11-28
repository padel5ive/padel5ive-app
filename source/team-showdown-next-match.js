// Preview the same dispatch that runs after score confirmation, on a copy of
// the session. A projected court and pairing can depend on which court ends.
function individualNextMatchMonitor(state, limit = 5) {
 const live = liveCourts(state);
 const pending = pendingMatches(state);
 if (state.stage !== 'stage1' || state.stage1Closed || !limit || !pending.length) return [];
 const byFixture = new Map();
 for (const current of live) {
  const projected = JSON.parse(JSON.stringify(state));
  const {assigned} = assignCourtResult(projected, current.id, fmt(state.setup.format).target, 0);
  for (const [index, match] of assigned.entries()) {
   const key = [match.id, match.b, match.b2].join(':');
   let row = byFixture.get(key);
   if (!row) {
    row = {...match, finishingCourts:[], firstAfter:0};
    byFixture.set(key, row);
   }
   row.finishingCourts.push(current.court);
   if (index === 0) row.firstAfter++;
  }
 }
 const nearIds = new Set();
 const next = [...byFixture.values()]
  .sort((a,b) => b.firstAfter - a.firstAfter || b.finishingCourts.length - a.finishingCourts.length)
  .filter(match => !nearIds.has(match.id) && nearIds.add(match.id))
  .slice(0, Math.min(2, limit))
  .map(match => ({...match, confirmedNext:match.firstAfter === live.length}));

 const finish = state.equalization?.status === 'running' ? new Set(state.equalization.ids) : null;
 const shown = new Set(next.map(match => match.id));
 const counts = individualCounts(state).counts;
 const ranked = pending.filter(match => !shown.has(match.id) &&
  (!finish || finish.has(match.id)) && individualEligible(state, match)).map(match => {
   const blockers = live.filter(current => ['A','B'].some(side =>
    individualPlayersOf(match, side).some(player => individualPlayersOf(current, side).includes(player)))).length;
   const booked = ['A','B'].reduce((sum, side) =>
    sum + individualPlayersOf(match, side).reduce((total, player) => total + counts[side][player], 0), 0);
   return {match, blockers, booked};
  }).sort((a,b) => a.blockers - b.blockers || a.booked - b.booked ||
   (a.match.plannedRound || 0) - (b.match.plannedRound || 0) || a.match.id.localeCompare(b.match.id));
 const onDeck = ranked.slice(0, limit - next.length)
  .map(({match}) => ({...match, finishingCourts:[], confirmedNext:false}));
 return [...next, ...onDeck];
}
