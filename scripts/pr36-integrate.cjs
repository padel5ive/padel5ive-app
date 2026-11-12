'use strict';
// PADEL 5IVE PR36 – apply review-only changes AFTER the existing build pipeline.
// Scope: shared persistent availability, court-capacity recovery, existing UI polish.
// Deliberately fail closed on upstream changes: never overwrite a drifted master.
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const target=path.join(root,'public/modes/unified/index.html');
const patch=path.join(__dirname,'pr36-availability-court-ui.patch');
if(!fs.existsSync(target)||!fs.existsSync(patch))throw Error('PR36: required build or patch file missing');
const before=fs.readFileSync(target,'utf8');
const markers=['P5Availability','availabilityById','p5-score-dual-grid','p5CapacityRebuildUnscoredFuture','p5-polish-unavailable'];
const present=markers.filter(k=>before.includes(k));
if(present.length===markers.length){
 console.log('PR36: already applied; native builders untouched');
 process.exit(0);
}
if(present.length)throw Error('PR36: partially applied refinement detected; stop instead of corrupting source');
function run(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});if(r.error||r.status!==0)throw Error('PR36: upstream source drift; patch '+args[1]+' failed: '+(r.stderr||r.error||r.stdout||'unknown').slice(0,2200));}
run(['apply','--check','--whitespace=nowarn',patch]);
run(['apply','--whitespace=nowarn',patch]);
const after=fs.readFileSync(target,'utf8');
for(const k of markers)if(!after.includes(k))throw Error('PR36 missing required module: '+k);
console.log('PASS PR36: Availability Integrity + Court Utilization + Shared UI + Dual Score Dropdown');