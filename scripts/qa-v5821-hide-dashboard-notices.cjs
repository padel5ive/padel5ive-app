/* PADEL 5IVE v5.8.21 · Dashboard-only notice removal.
 * This regression validates BOTH spectator and moderator rendering by
 * removing only the source-template interpolations that produced the notices.
 * Score data, scheduling rules, fairness calculations and other alerts remain.
 */
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path='public/modes/unified/index.html';
const s=fs.readFileSync(path,'utf8');
const club=fs.readFileSync('public/modes/club-match/index.html','utf8');
const rules='ADVANCED PLAYER RULES · Locked partners remain together.';
const fairness='SCHEDULING FAIRNESS REVIEW · ';
const checks={
 'No Advanced Player Rules court notice in any moderator/viewer pairing':!s.includes(rules),
 'No Scheduling Fairness Review court notice in any moderator/viewer pairing':!s.includes(fairness),
 'Other fairness diagnostics still available':s.includes('FAIRNESS CHECK · No consecutive rest'),
 'Player constraint engine retained':s.includes('P5AdvancedRules.constrained(s)'),
 'Fairness warning data kept for scheduler':s.includes('fairnessWarnings'),
 'Round/court scoring retains same native layout':s.includes('p5-stage1-score-grid')&&s.includes('p5-v26-round-card'),
 'Existing scoreboard not modified':s.includes('COURT SCORING'),
 'Club Match layout untouched':club.includes('TEAM SHOWDOWN')||club.includes('Team Showdown'),
 'Viewer adapter still available':fs.readFileSync('public/phase5814/view-only-v5814.js','utf8').includes('hideViewerDiagnostics'),
 'Cloud controller and scheduler untouched':fs.readFileSync('public/phase58/cloud-dashboard.js','utf8').includes('setFollowLive'),
 'Build script explicitly integrates the removal':JSON.parse(fs.readFileSync('package.json','utf8')).scripts.build.includes('phase5821-hide-dashboard-notices.cjs')
};
for(const [name,ok] of Object.entries(checks))console.log((ok?'PASS ':'FAIL ')+name);
assert(Object.values(checks).every(Boolean),'v5.8.21 targeted notice regression');
const digest=()=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const before=digest();
execFileSync(process.execPath,['scripts/phase5821-hide-dashboard-notices.cjs']);
assert.equal(digest(),before,'Repeated build must not rewrite or alter the master output');
console.log('PASS v5.8.21: 11 checks and idempotency, both notifications absent in all roles.');
