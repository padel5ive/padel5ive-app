/* PADEL 5IVE v5.8.3 - checks after npm run build. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const s=fs.readFileSync('public/modes/unified/index.html','utf8');
const styles=fs.readFileSync('public/phase58/dashboard-clean-v583.css','utf8');
const src=execFileSync('git',['show','HEAD:public/modes/unified/index.html'],{encoding:'utf8',maxBuffer:8*1024*1024});
const sourceCourt='COURT UTILIZATION · ROUND';
const sourceFair='FAIRNESS REVIEW · Preplanned sequence:';
assert(src.includes(sourceCourt)&&src.includes(sourceFair),'The canonical source must retain its original diagnostics');
assert(!s.includes(sourceCourt),'Court Utilization must not render in Stage 1');
assert(!s.includes(sourceFair),'Fairness Review must not render in Stage 1');
assert(s.includes("const courtInfo='';"),'Court Info render must be empty');
assert(s.includes('data-act="round" data-round='),'Round selector must remain');
assert(s.includes('class="grid2 p5-stage1-score-grid"'),'Court scoring cards must remain');
assert(s.includes('SCHEDULING FAIRNESS REVIEW'),'Constraint warning must remain');
assert(s.includes('ADVANCED PLAYER RULES'),'Active advanced rules warning must remain');
assert(s.includes('P5RecoveryAudit.inspect(s)'),'Fairness Monitor engine must remain');
assert(s.includes("entry('Share & Export'"),'Menu must remain');
assert(s.includes('p5-share-label-copy'),'Share Results label must remain');
assert(s.includes('data-act="${id}"'), 'Native actions must remain');
assert(s.includes('<link rel="stylesheet" href="/phase58/dashboard-clean-v583.css">'),'Share CSS must be in Unified');
assert(styles.includes('display:flex!important')&&styles.includes('flex-wrap:nowrap!important')&&styles.includes('justify-content:space-between!important')&&styles.includes('align-self:center!important'),'Chevron must remain aligned beside copy');
assert(styles.includes('[data-act="share-result-link"] > span[aria-hidden="true"]'),'Chevron selector must target actual markup');
assert(s.includes('class="p5-4852-action p5-b31-menu-row"')&&s.includes('<span aria-hidden="true">›</span>'),'Native right arrow markup preserved');
let checks=0;
for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
 if(/\bsrc\s*=/.test(m[1])||/type\s*=\s*["'](?:application\/json|module)/i.test(m[1])||!m[2].trim())continue;
 new vm.Script(m[2],{filename:'Unified built inline JS #'+checks});checks++;
}
const sha=()=>crypto.createHash('sha256').update(fs.readFileSync('public/modes/unified/index.html')).digest('hex');
const prior=sha();execFileSync('node',['scripts/phase583-transform.cjs'],{encoding:'utf8'});assert.equal(sha(),prior,'Cosmetic transform must be repeatable');
console.log('PASS v5.8.3: dashboard clean, advanced warnings intact, share chevron aligned, '+checks+' inline scripts valid, transform idempotent.');
