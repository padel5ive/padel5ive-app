/* PADEL 5IVE — Structured Americano opponent diversity, isolated adapter.
 * Changes only the TWO intact teams facing one another in an UNSCORED,
 * fully certified schedule. No changes to players' partners, round/bye
 * assignments, court slots, results, or other matchmaking engines.
 */
(function(root){
 'use strict';
 const master=root.P5Structured;
 if(!master||typeof master.build!=='function')throw Error('Structured pairing scheduler required');
 if(master.opponentDiversityVersion==='1.0')return;
 const edge=(a,b)=>String(a)<String(b)?String(a)+':'+String(b):String(b)+':'+String(a);
 const fixture=(a,b)=>[a.map(String).sort().join(':'),b.map(String).sort().join(':')].sort().join('|');
 const add=(map,k,n)=>map.set(k,(map.get(k)||0)+n);
 const oppPenalty=n=>n<=1?0:(n-1)*1000+Math.max(0,n-2)**2*2600+Math.max(0,n-3)**2*6000;
 const fixturePenalty=n=>n<=1?0:(n-1)*30000;
 const valid=rows=>Array.isArray(rows)&&rows.length>0&&rows.every(r=>r?.structuredFairCycleCertified===true&&Array.isArray(r.matches)&&r.matches.length&&r.matches.every(m=>m&&!m.confirmed&&m.score==null&&m.teams?.length===2&&m.teams.every(t=>Array.isArray(t)&&t.length===2)));
 function counter(teams){
  const opponents=new Map(),fixtures=new Map();
  for(const rd of teams)for(const [a,b] of rd){add(fixtures,fixture(a,b),1);for(const x of a)for(const y of b)add(opponents,edge(x,y),1);}
  return {opponents,fixtures};
 }
 function metrics(teams){
  const {opponents,fixtures}=counter(teams);let repeats=0,peak=0,triples=0,fixtureRepeats=0,score=0;
  for(const n of opponents.values()){repeats+=Math.max(0,n-1);peak=Math.max(peak,n);triples+=Math.max(0,n-2);score+=oppPenalty(n);}
  for(const n of fixtures.values()){fixtureRepeats+=Math.max(0,n-1);score+=fixturePenalty(n);}
  return {repeats,peak,triples,fixtureRepeats,score};
 }
 const clone=teams=>teams.map(r=>r.map(m=>m.slice())); // each match is [teamA, teamB]; preserve team references
 function changeMap(before,after){const changes=new Map();
  for(const [a,b] of before)for(const x of a)for(const y of b)add(changes,edge(x,y),-1);
  for(const [a,b] of after)for(const x of a)for(const y of b)add(changes,edge(x,y),1);
  return changes;
 }
 function fixtureChanges(before,after){const changes=new Map();
  for(const [a,b] of before)add(changes,fixture(a,b),-1);
  for(const [a,b] of after)add(changes,fixture(a,b),1);
  return changes;
 }
 function incremental(counter,changes,penalty){let value=0;
  for(const [k,d] of changes)if(d){const old=counter.get(k)||0,next=old+d;
   if(next<0)throw Error('Opponent counter underflow');value+=penalty(next)-penalty(old);
  }
  return value;
 }
 function apply(counter,changes){for(const [k,d] of changes)if(d){const n=(counter.get(k)||0)+d;
  if(n)counter.set(k,n);else counter.delete(k);
 }}
 function optimize(rows,random=Math.random){
  if(!valid(rows))return rows;
  const rng=typeof random==='function'?random:Math.random;
  const base=rows.map(r=>r.matches.map(m=>m.teams));
  const initial=metrics(base),eligible=base.map((r,i)=>r.length>=2?i:-1).filter(i=>i>=0);
  if(!eligible.length)return rows;
  let best=base,bestScore=initial.score,bestMetrics=initial;
  // Bounded multi-start 2-opt search. Each move only swaps opponents of
  // two matches IN THE SAME ROUND: every existing partnership and bye is fixed.
  const budget=Math.min(5500,900+rows.length*180),restarts=4;
  for(let restart=0;restart<restarts;restart++){
   const current=clone(restart%2===0?base:best);const counters=counter(current);let score=metrics(current).score;
   for(let i=0;i<budget;i++){
    const ri=eligible[Math.floor(rng()*eligible.length)],rd=current[ri];
    const ai=Math.floor(rng()*rd.length);let bi=Math.floor(rng()*(rd.length-1));if(bi>=ai)bi++;
    const [a,b]=rd[ai],[c,d]=rd[bi],before=[[a,b],[c,d]];
    const options=[[[a,c],[b,d]],[[a,d],[b,c]]];
    let selected=null;
    for(const after of options){const oc=changeMap(before,after),fc=fixtureChanges(before,after);
     const delta=incremental(counters.opponents,oc,oppPenalty)+incremental(counters.fixtures,fc,fixturePenalty);
     if(!selected||delta<selected.delta||(delta===selected.delta&&rng()<.5))selected={after,oc,fc,delta};
    }
    if(!selected)continue;
    const temperature=restart===0?0:Math.max(30,1300*(1-i/budget));
    if(selected.delta>0&&(!temperature||rng()>=Math.exp(-selected.delta/temperature)))continue;
    rd[ai]=selected.after[0];rd[bi]=selected.after[1];
    apply(counters.opponents,selected.oc);apply(counters.fixtures,selected.fc);score+=selected.delta;
    if(score>=bestScore)continue;
    const candidate=metrics(current);
    if(candidate.repeats<=initial.repeats&&candidate.peak<=initial.peak&&candidate.fixtureRepeats<=initial.fixtureRepeats){
     best=clone(current);bestMetrics=candidate;bestScore=candidate.score;
    }
   }
  }
  if(bestScore>=initial.score)return rows;
  // Hard postflight guarantees: unchanged round occupancy, unchanged teams,
  // unchanged court count / metadata, and no deterioration of encounter metrics.
  const improved=metrics(best);
  if(improved.repeats>initial.repeats||improved.peak>initial.peak||improved.fixtureRepeats>initial.fixtureRepeats)throw Error('Opponent diversity regression');
  for(let i=0;i<rows.length;i++){
   const roster=t=>t.flat(2).map(String).sort().join('|');
   const partners=t=>t.flatMap(m=>m.map(team=>team.map(String).sort().join(':'))).sort().join('|');
   if(roster(best[i])!==roster(base[i])||partners(best[i])!==partners(base[i]))throw Error('Opponent optimizer altered participants/partners');
  }
  return rows.map((r,i)=>({...r,matches:r.matches.map((m,j)=>({...m,teams:best[i][j].map(t=>t.slice())})),structuredOpponentOptimized:true}));
 }
 function build(state,rng){
  const rows=master.build(state,rng);
  // No modification to a restored/in-progress tournament, edited history,
  // irregular group size, Coach, Sit Out, or an uncertified schedule.
  if(state?.mode!=='structured-americano'||state.rounds?.length||state.sitout?.length||state.rules?.coachEnabled||state.rules?.fixedEnabled)return rows;
  return optimize(rows,rng);
 }
 root.P5Structured=Object.freeze({...master,build,opponentDiversityVersion:'1.0'});
 root.P5StructuredOpponentLab=Object.freeze({version:'1.0',optimize,metrics});
})(window);
