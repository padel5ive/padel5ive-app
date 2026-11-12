'use strict';
// PR36 lightweight post-build gate; existing native and structured test suites run in CI separately.
const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('public/modes/unified/index.html','utf8');
const checks={
 'persistent availability controller': 'window.P5Availability=',
 'availability persisted per player': 'availabilityById',
 'active-only scheduling': 'P5Availability.activeIds(s)',
 'contextual player actions': 'participant-toggle',
 'arrival reshuffle': 'arrival-reshuffle',
 'recovery of unscored court capacity': 'p5CapacityRebuildUnscoredFuture',
 'unavailable separate from resting': 'p5-polish-unavailable',
 'two-dropdown score modal': 'p5-score-dual-grid',
 'numeric Side A dropdown': 'p5-score-a',
 'numeric Side B dropdown': 'p5-score-b',
 'native score confirm': 'modal-save',
 'full-width court cards': 'p5-stage1-score-grid'
};
for(const [name,needle] of Object.entries(checks)){
 assert(html.includes(needle),'PR36 missing '+name+' ('+needle+')');
 console.log('PASS',name);
}
assert(html.includes('p5-coach-opponent-diversity-lab.js'),'PR35 coach module missing');
assert(html.includes('p5-structured-opponent-diversity-v1.js'),'PR35 opponent diversity missing');
assert(fs.existsSync('public/index.html'),'Home missing');
assert(!html.includes("const input=$('p5-score-a');if(input)input.focus();"),'Score select must never autofocus on modal open');
assert(html.includes('P5 PR36 REVIEW: explicit score picker interaction and aligned flow rule'),'Safari interaction fix missing');
assert(html.includes('p5-v26-flow-combo>.p5-rest-card::before{content:none!important;display:none!important}'),'Nested Resting rule must not be displaced');
assert(html.includes('p5-stage1-score-grid>.p5-v26-flow-combo::before'),'Flow accent must align with outer court cards');
console.log('PASS PR36 Safari selector and Resting/On Deck alignment regression guards');

assert(html.includes('PR36 iPhone Stage 1 Rounds / Leaderboard tab bar'),'PR36 mobile tab styles not integrated');
assert(html.includes('PR36 iPhone Stage 1 tab runtime'),'PR36 iPhone mobile tab controller missing');
assert(html.includes('data-p5-pr36-tab'),'PR36 mobile tab switching missing');
assert(html.includes("content:'×'!important"),'PR36 centered score x marker missing');
assert(html.includes('p5-pr36-mobile-active'),'PR36 mobile Stage 1 view guard missing');
console.log('PASS PR36 mobile responsive tabs and × scoring separator');
assert(html.includes('PR36 MOBILE POLISH: compact identity, one-row round rail, brass tabs, hide match monitor'),'Mobile polish stylesheet missing');
assert(html.includes('PR36 MOBILE POLISH: keep selected round visible in horizontal rail'),'Active round scroll support missing');
assert(html.includes('scroll-snap-type:x proximity'),'Round rail must swipe horizontally');
assert(html.includes('flex-wrap:nowrap!important'),'Round rail must remain on one row');
assert(html.includes('#americano.p5-pr36-mobile-active>.stats,#americano.p5-pr36-mobile-active>.bars{display:none!important}'),'Mobile monitor should be hidden');
assert(html.includes('background:#1b262f!important'),'Native navy/brass bottom tab style missing');
console.log('PASS PR36 mobile density: one-row rail, compact session, invisible KPIs, quiet-luxury tabs');
assert(html.includes('PR36 SESSION POLISH: tap name to rename without an edit icon'),'Session name edit script missing');
assert(html.includes('data-act="edit-session-name"'),'Tap Session Name action missing');
assert(html.includes('function renameSession(){'),'Session name save handler missing');
assert(html.includes("m.type==='session-name'?'Save Changes'"),'Rename button missing');
assert(html.includes('ROUND ${r+1} · COURT SCORING'),'Simplified round title missing');
assert(!html.includes('ROUND ${r+1} · ${format(s)} · COURT SCORING'),'Scoring format still redundant in round heading');
console.log('PASS PR36 session rename and lean round title');
assert(html.includes('PR36 SCORECARD REFINEMENT: invisible hit target, symmetrical mobile names'),'Mobile scorecard refinement missing');
assert(html.includes('scorepair:nth-child(2) .pairname{grid-column:2!important;grid-row:1!important}'),'Right player names are not aligned into shared name row');
assert(html.includes('scorepair:nth-child(2) .p5sm-scorebox{grid-column:2!important;grid-row:2!important}'),'Right score not aligned in shared score row');
assert(html.includes('-webkit-tap-highlight-color:transparent!important'),'iOS scorecard touch highlight guard missing');
console.log('PASS PR36 mobile scorecard: shared grid rows, centered player names and suppressed tap overlays');
assert(html.includes('PR36 SESSION CONTROL: quiet two-action layout'),'Compact Session Control style missing');
assert(html.includes('p5-pr36-session-actions'),'Compact Session Control buttons missing');
assert(html.includes('View Full History'),'View Full History control missing');
assert(html.includes('p5-pr36-history-score'),'Confirmed score history display missing');
assert(!html.includes('Moderator may finish Stage 1 at any time. Only CONFIRMED scores determine standings and KO seeds; pending matches become Not Played.'),'Long Session Control instructions should not remain');
console.log('PASS PR36 Session Control: minimal actions, intact history and finished score display');
console.log('PASS PR36 post-build structural gate. Device/cloud E2E remains a manual review requirement.');