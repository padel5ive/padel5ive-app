/* PADEL 5IVE PR34 — Coach opponent-diversity laboratory.
 * Exact repacking of intact TWO-PLAYER TEAMS across active courts only.
 * Does not change selected players, partner identities, rests, fixed pairs,
 * existing scores, historical rounds, or the locked original scheduler code.
 */
(function(root){
 'use strict';
 const native=root.P5HistorySmart;
 if(!native||typeof native.create!=='function')throw Error('Native history-aware scheduler required');
 if(native.coachOppDiversityLab==='lab1')return;
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const sig=(a,b)=>[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
 function optimize(state,rounds,original,ranked){
  if(!state?.rules?.coachEnabled||!original?.matches||original.matches.filter(Boolean).length<2)return original;
  const active=new Set(original.matches.filter(Boolean).flatMap(m=>m.teams.flat()));
  const coaches=(state.rules.coachIds||[]).filter(id=>active.has(id));
  if(!coaches.length||!Array.isArray(rounds)||!rounds.length)return original;
  const games=original.matches.filter(Boolean),teams=games.flatMap(m=>m.teams.map(t=>t.slice()));
  if(teams.length>10||teams.some(t=>t.length!==2))return original;
  const h=native.metrics(rounds),opp=h.opp||{},fixtures=h.fixture||{};
  const mex=state.mode==='individual-mexicano',order=(ranked||[]).map(r=>r.id);
  const rank={};order.forEach((id,i)=>rank[id]=i);
  let nextRank=order.length;for(const p of state.roster||[])if(rank[p.id]===undefined)rank[p.id]=nextRank++;
  const coachSet=new Set(coaches),lastOpp=new Set();
  const prev=rounds.at(-1);
  for(const m of prev?.matches||[])if(m?.teams?.length===2){
   for(const x of m.teams[0])for(const y of m.teams[1])lastOpp.add(key(x,y));
  }
  function score(a,b){
   let coach=0,opponents=0;
   for(const x of a)for(const y of b){
    const k=key(x,y),n=opp[k]||0;
    if(n)opponents++;
    if(coachSet.has(x)||coachSet.has(y))
     coach+=n*140+n*n*75+(n&&lastOpp.has(k)?250:0);
   }
   const fixture=(fixtures[sig(a,b)]||0)>0?1:0;
   const positions=a.concat(b).map(id=>rank[id]);
   const spread=Math.max(...positions)-Math.min(...positions);
   const imbalance=Math.abs(rank[a[0]]+rank[a[1]]-rank[b[0]]-rank[b[1]]);
   const rankPenalty=mex?spread*70+imbalance*70+
     (Math.abs(rank[a[0]]-rank[a[1]])+Math.abs(rank[b[0]]-rank[b[1]]))*30:0;
   return {coach,opponents,fixture,rankPenalty,spread,
    value:coach*50+opponents*25+fixture*1700+rankPenalty*(mex?.045:0)};
  }
  const memo=new Map(),n=teams.length;
  function solve(mask){
   if(!mask)return {cost:0,pairs:[]};
   if(memo.has(mask))return memo.get(mask);
   const i=Math.floor(Math.log2(mask&-mask)),rest=mask^(1<<i);let best=null;
   for(let j=i+1;j<n;j++)if(rest&(1<<j)){
    const tail=solve(rest^(1<<j)),metric=score(teams[i],teams[j]);
    const cost=tail.cost+metric.value;
    if(!best||cost<best.cost)best={cost,pairs:[[teams[i],teams[j]],...tail.pairs]};
   }
   memo.set(mask,best);return best;
  }
  const proposal=solve((1<<n)-1).pairs,baseline=games.map(m=>m.teams);
  function audit(pairs){
   let coach=0,opponents=0,fixture=0,rankPenalty=0,maxSpread=0;
   for(const [a,b] of pairs){const s=score(a,b);coach+=s.coach;opponents+=s.opponents;
    fixture+=s.fixture;rankPenalty+=s.rankPenalty;maxSpread=Math.max(maxSpread,s.spread);}
   return {coach,opponents,fixture,rankPenalty,maxSpread};
  }
  const old=audit(baseline),fresh=audit(proposal);
  // Hard Pareto: coach exposure improves, without sacrificing overall opponent
  // encounters / exact fixture repeats or breaking Mexicano ranking proximity.
  if(fresh.coach>=old.coach||fresh.opponents>old.opponents+2||fresh.fixture>old.fixture||
     mex&&(fresh.rankPenalty>old.rankPenalty+420||fresh.maxSpread>old.maxSpread+1))return original;
  if(mex)proposal.sort((x,y)=>
   x.flat().reduce((v,id)=>v+rank[id],0)-y.flat().reduce((v,id)=>v+rank[id],0));
  const slots=original.matches.map((m,i)=>m?i:-1).filter(i=>i>=0);
  const matches=original.matches.slice();
  slots.forEach((slot,i)=>{matches[slot]={...original.matches[slot],
   teams:proposal[i].map(t=>t.slice())};});
  // Existing warning about opponents/fixtures was for an old matchup.
  const warnings=(original.fairnessWarnings||[]).filter(w=>!String(w).includes('previous opponent')&&
   !String(w).includes('exact match-up'));
  if(fresh.opponents)warnings.push(fresh.opponents+' previous opponent encounter(s) across this round');
  if(fresh.fixture)warnings.push(fresh.fixture+' previously played exact match-up(s)');
  return {...original,matches,coachOpponentDiversityOptimized:true,
   ...(warnings.length?{fairnessWarnings:warnings}:{fairnessWarnings:[]})};
 }
 function create(state,rounds,random,ranked,overrideIds){
  const result=native.create(state,rounds,random,ranked,overrideIds);
  return optimize(state,rounds,result,ranked);
 }
 root.P5HistorySmart=Object.freeze({...native,create,coachOppDiversityLab:'lab1'});
 root.P5CoachDiversityLab=Object.freeze({optimize,version:'lab1'});
})(window);
