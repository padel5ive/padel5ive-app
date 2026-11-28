// Preview the same dispatch that runs after score confirmation, on a copy of
// the session. A projected court and pairing can depend on which court ends.
function individualNextMatchMonitor(state, limit = 5) {
 const live = liveCourts(state);
 const pending = pendingMatches(state);
 if (state.stage !== 'stage1' || state.stage1Closed || !live.length || !pending.length) return [];
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
 return [...byFixture.values()]
  .sort((a,b) => b.firstAfter - a.firstAfter || b.finishingCourts.length - a.finishingCourts.length)
  .slice(0, limit)
  .map(match => ({...match, confirmedNext:match.firstAfter === live.length}));
}
