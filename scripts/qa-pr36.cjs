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
console.log('PASS PR36 post-build structural gate. Device/cloud E2E remains a manual review requirement.');