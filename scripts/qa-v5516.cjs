// PADEL 5IVE v5.5.16 fair-cycle regression test. Run: node scripts/qa-v5515.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/modes/unified/index.html','utf8');
const window={};
const ctx={window,console,Math,Set,Map,Object};
vm.runInNewContext(fs.readFileSync('public/assets/p5-fair-cycle-v5515.js','utf8'),ctx);
const start=src.indexOf('window.P5EngineIndividual=(function()');
assert.ok(start>0,'Individual engine found');
const end=src.indexOf('</script><script>',start);
assert.ok(end>start,'Individual engine boundary');
vm.runInNewContext(src.slice(start,end),ctx);
function rng(seed){return ()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
const cases=[[6,1,8,8],[12,2,17,33],[18,3,26,77],[24,4,35,138],[30,5,44,218]];
let tests=0;
for(const [n,cap,rounds,matches] of cases)for(let seed=1;seed<=16;seed++){
 const ids=Array.from({length:n},(_,i)=>i);const result=window.P5EngineIndividual.build(ids,cap,rng(seed));
 assert.equal(result.length,rounds,`${n}/${cap} rounds`);
 assert.equal(result.reduce((v,r)=>v+r.matches.length,0),matches,`${n}/${cap} matches`);
 const g=Array(n).fill(0),seen=new Map();
 for(let i=0;i<result.length;i++){
  const used=new Set();assert.ok(result[i].matches.length<=cap);
  for(const m of result[i].matches){for(const t of m.teams){assert.equal(t.length,2);const [a,b]=t;assert.notEqual(a,b);
    assert.ok(!used.has(a)&&!used.has(b),'player collision');used.add(a);used.add(b);
    const key=[a,b].sort((a,b)=>a-b).join(':');seen.set(key,(seen.get(key)||0)+1);
  }}
  for(const id of used)g[id]++;
  const gap=Math.max(...g)-Math.min(...g);
  assert.ok(gap<=1,`${n}/${cap} seed ${seed} R${i+1} gap ${gap}`);
  if(n!==12&&(i+1)%3===0&&i<result.length-2)assert.equal(gap,0,`R${i+1} checkpoint`);
 }
 assert.equal(seen.size,n*(n-1)/2,'every partnership covered');
 assert.equal([...seen.values()].filter(x=>x>1).length,n%4===2?1:0,'minimal unavoidable partner repetition');
 tests++;
}
for(const f of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 const doc=fs.readFileSync(f,'utf8');assert.ok(doc.includes('v5.5.16')&&doc.includes('Share Final Results Link'));
}
const resultsJs=fs.readFileSync('public/assets/p5-showdown-results-v5514.js','utf8');
assert.ok(resultsJs.includes('Total games ·')&&resultsJs.includes('stats.team.A.w'));
const reportCss=fs.readFileSync('public/assets/p5-showdown-results-v5514.css','utf8');
assert.ok(reportCss.includes('.winner:before,.winner:after{content:none!important}'));
console.log(`PADEL 5IVE v5.5.16 QA PASS · ${tests} seeded engine scenarios; all partner-coverage and round fairness assertions passed.`);
