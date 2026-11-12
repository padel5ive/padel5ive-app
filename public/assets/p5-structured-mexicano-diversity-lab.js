/* PADEL 5IVE — Structured Mexicano conservative diversity optimizer (LAB).
 * Does not change selected players, match counts, rest, confirmed rounds or first round.
 * It will not accept a candidate with more repeated opponents, partners, or exact fixtures
 * than the original next() output, or with a materially worse rank balance.
 */
(function(root){
  'use strict';
  const previous=root.P5StructuredMX;
  if(!previous||!root.P5Structured)throw Error('P5StructuredMX must load first');
  const pair=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
  const sig=(a,b)=>[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
  function metrics(matches,h,ranks){
    let partnerRepeat=0,opponentRepeat=0,opponentWeight=0,fixtureRepeat=0,rankPenalty=0,maxSpread=0;
    for(const m of matches){
      const [a,b]=m.teams,rank=a.concat(b).map(id=>ranks[id]);
      const spread=Math.max(...rank)-Math.min(...rank);maxSpread=Math.max(maxSpread,spread);
      rankPenalty+=spread*70+Math.abs(rank[0]+rank[1]-rank[2]-rank[3])*70;
      rankPenalty+=(Math.abs(rank[0]-rank[1])+Math.abs(rank[2]-rank[3]))*30;
      for(const t of [a,b])if((h.partners[pair(t[0],t[1])]||0)>0)partnerRepeat++;
      if((h.fixtures[sig(a,b)]||0)>0)fixtureRepeat++;
      for(const x of a)for(const y of b){const k=h.opponents[pair(x,y)]||0;if(k){opponentRepeat++;opponentWeight+=k;}}
    }
    return {partnerRepeat,opponentRepeat,opponentWeight,fixtureRepeat,rankPenalty,maxSpread};
  }
  function enhance(base,s,standings,random){
    const history=previous.confirmedHistory(s.rounds||[]);
    // Honour the initial shuffle: no history exists to optimize yet.
    if(!(s.rounds||[]).some(r=>(r.matches||[]).some(m=>m&&m.confirmed)))return base;
    const groups=root.P5Structured.members(s),members=new Map(s.roster.map(p=>[p.id,p.group]));
    const order=(standings||[]).map(x=>x.id),positions=new Map(order.map((id,i)=>[id,i]));
    const ranks={};for(const arr of [groups.A,groups.B]){
      arr.slice().sort((a,b)=>(positions.get(a)??1e6)-(positions.get(b)??1e6)).forEach((id,i)=>{ranks[id]=i;});
    }
    const original=base.matches.map(m=>({teams:m.teams.map(t=>t.slice())})),baseline=metrics(original,history,ranks);
    const selected=original.flatMap(m=>m.teams.flat()),A=selected.filter(id=>members.get(id)==='A'),B=selected.filter(id=>members.get(id)==='B');
    if(A.length!==B.length||A.length%2||A.length<2)return base;
    // Retain original pair locations to stay near the ranking groups selected by old next().
    const initA=original.flatMap(m=>m.teams.flat()).filter(id=>members.get(id)==='A');
    const initB=original.flatMap(m=>m.teams.flat()).filter(id=>members.get(id)==='B');
    const n=initA.length,cap=n/2,maxPerm=Math.min(cap===5?2100:1100,cap===1?2:1100);
    const maxSpreadLimit=Math.max(baseline.maxSpread,Math.max(2,Math.ceil(groups.A.length/3)));
    const maxRankExtra=Math.max(200,140*cap);
    let best=null,bestMetric=baseline,bestValue=Infinity;
    const value=m=>m.opponentRepeat*1400+m.partnerRepeat*1800+m.fixtureRepeat*6000+
      m.opponentWeight*45+m.rankPenalty*0.06;
    function candidate(aIds,bIds){
      const teamOptions=[[],[]];
      for(let i=0;i<cap;i++){
        const [a,b]=[aIds.slice(i*2,i*2+2),bIds.slice(i*2,i*2+2)];
        teamOptions[0].push([[a[0],b[0]],[a[1],b[1]]]);
        teamOptions[1].push([[a[0],b[1]],[a[1],b[0]]]);
      }
      for(let mask=0;mask<(1<<cap);mask++){
        const current=Array.from({length:cap},(_,i)=>({teams:teamOptions[(mask>>i)&1][i]}));
        const metric=metrics(current,history,ranks);
        if(metric.maxSpread>maxSpreadLimit||metric.rankPenalty>baseline.rankPenalty+maxRankExtra)continue;
        // Pareto protection: never introduce a higher repeat count than baseline.
        if(metric.partnerRepeat>baseline.partnerRepeat||metric.opponentRepeat>baseline.opponentRepeat||metric.fixtureRepeat>baseline.fixtureRepeat)continue;
        const v=value(metric);
        if(v+1e-8<bestValue){bestValue=v;bestMetric=metric;best=current.map(m=>({teams:m.teams.map(t=>t.slice())}));}
      }
    }
    candidate(initA,initB);
    const attempts=cap===1?0:maxPerm;
    for(let trial=0;trial<attempts;trial++){
      const a=initA.slice(),b=initB.slice();
      // Local swaps among nearby rank positions only: remains competitive Mexicano.
      for(const group of [a,b]){
        const changes=1+Math.floor(random()*Math.min(4,cap));
        for(let j=0;j<changes;j++){
          let x=Math.floor(random()*n),y=Math.floor(random()*n);
          if(Math.abs(ranks[group[x]]-ranks[group[y]])<=maxSpreadLimit+1){[group[x],group[y]]=[group[y],group[x]];}
        }
      }
      candidate(a,b);
    }
    if(!best||bestValue>=value(baseline)-1e-8)return base;
    // Court 1 is the best-ranked quartet, keeping the native court hierarchy.
    best.sort((x,y)=>x.teams.flat().reduce((v,id)=>v+ranks[id],0)-y.teams.flat().reduce((v,id)=>v+ranks[id],0));
    const matches=best.map((m,i)=>({...base.matches[i],teams:m.teams}));
    const result={...base,matches,diversityOptimized:true};
    {
      // Always recalculate warnings even when the native candidate had none.
      // The native warnings were calculated for the old fixtures; only keep warnings
      // independent of partner/opponent repetition. Recompute the teammate note.
      const warning=(base.fairnessWarnings||[]).filter(x=>!String(x).includes('teammate repeat')&&!String(x).startsWith('Ranking-band compromise'));
      if(bestMetric.partnerRepeat)warning.push(`${bestMetric.partnerRepeat} teammate repeat encounter(s) within close-ranked groups`);
      const distance=Math.max(0,...matches.flatMap(m=>m.teams.map(t=>Math.abs(ranks[t[0]]-ranks[t[1]]))));
      if(distance>Math.max(2,Math.ceil(groups.A.length/3)))warning.push(`Ranking-band compromise: group-relative partner gap up to ${distance} while balancing Games Played and rest`);
      if(warning.length)result.fairnessWarnings=warning;else delete result.fairnessWarnings;
    }
    return result;
  }
  const next=(s,standings,random)=>enhance(previous.next(s,standings,random),s,standings,random);
  root.P5StructuredMX=Object.freeze({...previous,next});
  root.P5StructuredMXDiversityLab=Object.freeze({enhance,metrics,version:'lab0.2'});
})(window);