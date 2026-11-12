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
console.log('PASS PR36 post-build structural gate. Device/cloud E2E remains a manual review requirement.');