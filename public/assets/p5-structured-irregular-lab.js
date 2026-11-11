/* PADEL 5IVE Structured Americano — irregular roster fairness optimizer.
 * Regroups intact A+B teams between unconfirmed rounds via alternating components.
 * Preserves each team's identity and all confirmed fixtures. Branch QA only.
 */
(function(root){
 'use strict';
 const original=root.P5Fair532;
 if(!original||!root.P5Structured)throw Error('Missing structured engine or optimizer');
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 function components(left,right){
  const edges=left.map((team,i)=>({team,side:0,index:i})).concat(right.map((team,i)=>({team,side:1,index:i})));const at=new Map();
  for(let i=0;i<edges.length;i++)for(const p of edges[i].team){if(!at.has(p))at.set(p,[]);at.get(p).push(i);}
  const seen=new Set(),out=[];
  for(let i=0;i<edges.length;i++){
   if(seen.has(i))continue;let stack=[i],arr=[];seen.add(i);
   while(stack.length){const z=stack.pop();arr.push(z);for(const p of edges[z].team)for(const j of at.get(p)){if(!seen.has(j)){seen.add(j);stack.push(j);}}}
   let a=0,b=0;for(const idx of arr)edges[idx].side===0?a++:b++;
   out.push({idx:arr,delta:b-a});
  }
  return {edges,out};
 }
 function assess(rows,prefix,ids){
  const count=Object.fromEntries(ids.map(x=>[x,0]));
  const streak=Object.fromEntries(ids.map(x=>[x,0]));const rest=Object.fromEntries(ids.map(x=>[x,0]));
  let doubleRest=0,play3=0,longest=0,gapMax=0,gapSum=0;
  const all=prefix.concat(rows);
  for(let r=0;r<all.length;r++){
   const row=all[r],matches=Array.isArray(row)?row:row.matches||[];
   const on=new Set(Array.isArray(row)?matches.flat():matches.filter(Boolean).flatMap(m=>m.teams.flat()));
   let min=Infinity,max=-Infinity;
   for(const id of ids){
    if(row.eligibleIds&&!row.eligibleIds.includes(id))continue;
    const playing=on.has(id);
    if(playing){count[id]++;streak[id]++;rest[id]=0;if(streak[id]>=3)play3++;}else{streak[id]=0;rest[id]++;if(rest[id]>=2)doubleRest++;}
    longest=Math.max(longest,streak[id]);
    min=Math.min(min,count[id]);max=Math.max(max,count[id]);
   }
   if(max!==-Infinity){const gap=max-min;gapMax=Math.max(gapMax,gap);gapSum+=gap*gap;}
  }
  return {doubleRest,play3,longest,gapMax,gapSum,
    cost:doubleRest*1400+play3*180+Math.max(0,longest-2)**2*2200+gapMax**2*3300+gapSum*160};
 }
 function teamRounds(future){return future.map(r=>(r.matches||[]).filter(Boolean).flatMap(m=>m.teams.map(t=>t.slice())));}
 function optimize(future,prefix,ids,random,options={}){
  if(!options.structured||!future?.length||future.some(r=>r.matches?.some(m=>m?.confirmed)))return original.optimize(future,prefix,ids,random,options);
  if(future.every(r=>r.structuredFairCycleCertified))return future;
  const baseline=original.optimize(future,prefix,ids,random,options);
  if(baseline.length<3)return baseline;
  const active=(options.availableIds||ids).slice(),coaches=(options.coaches||[]).filter(x=>active.includes(x));
  const rows=teamRounds(baseline),pfx=prefix||[];
  // Keep the historical prefix exactly; evaluate all history in fair counters.
  const evalCost=()=>assess(rows.map((teams,i)=>({eligibleIds:baseline[i].eligibleIds, matches:teams.map(team=>({teams:[team]}))})),pfx,active).cost;
  const baselineStats=assess(rows.map((teams,i)=>({eligibleIds:baseline[i].eligibleIds,matches:teams.map(team=>({teams:[team]}))})),pfx,active);
  let cost=baselineStats.cost,bestCost=cost,best=rows.map(x=>x.map(t=>t.slice()));
  const budget=rows.length<=24?26000:18000;
  for(let trial=0;trial<budget;trial++){
   const a=Math.floor(random()*rows.length),b=Math.floor(random()*rows.length);
   if(a===b)continue;
   const {edges,out}=components(rows[a],rows[b]);
   const good=out.filter(c=>!c.delta),plus=out.filter(c=>c.delta===1),minus=out.filter(c=>c.delta===-1);
   let selected=null;
   if(random()<.52&&good.length)selected=[good[Math.floor(random()*good.length)]];
   else if(plus.length&&minus.length)selected=[plus[Math.floor(random()*plus.length)],minus[Math.floor(random()*minus.length)]];
   else if(good.length)selected=[good[Math.floor(random()*good.length)]];
   else continue;
   const changed=new Set(selected.flatMap(x=>x.idx));
   const left=[],right=[];for(let x=0;x<edges.length;x++){
    const edge=edges[x],side=changed.has(x)?1-edge.side:edge.side;(side===0?left:right).push(edge.team);
   }
   if(left.length!==rows[a].length||right.length!==rows[b].length)continue;
   if(coaches.length){const l=new Set(left.flat()),r=new Set(right.flat());if(!coaches.every(id=>l.has(id)&&r.has(id)))continue;}
   const prevA=rows[a],prevB=rows[b];rows[a]=left;rows[b]=right;
   const next=evalCost(),temp=Math.max(.1,80*Math.pow(.02,trial/budget));
   if(next<=cost||random()<Math.exp((cost-next)/temp)){cost=next;if(next<bestCost){bestCost=next;best=rows.map(x=>x.map(t=>t.slice()));}}
   else{rows[a]=prevA;rows[b]=prevB;}
  }
  const newStats=assess(best.map((teams,i)=>({eligibleIds:baseline[i].eligibleIds,matches:teams.map(team=>({teams:[team]}))})),pfx,active);
  if(bestCost>=baselineStats.cost-1e-7||newStats.longest>baselineStats.longest||newStats.doubleRest>baselineStats.doubleRest||newStats.gapMax>baselineStats.gapMax)return baseline;
  // Re-match intact teams to minimize repeated opponent encounters against immutable past.
  const history=new Map(),fixture=new Map();
  const sig=(a,b)=>[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
  const add=m=>{const [a,b]=m.teams;fixture.set(sig(a,b),(fixture.get(sig(a,b))||0)+1);for(const x of a)for(const y of b)history.set(key(x,y),(history.get(key(x,y))||0)+1);};
  for(const r of pfx)for(const m of r.matches||[])if(m)add(m);
  function match(teams){const memo=new Map();function dp(mask){if(!mask)return {cost:0,groups:[]};if(memo.has(mask))return memo.get(mask);
    const i=31-Math.clz32(mask&-mask);let best=null;
    for(let j=i+1;j<teams.length;j++)if(mask&(1<<j)){
     const next=dp(mask^(1<<i)^(1<<j));let repeat=0;for(const a of teams[i])for(const b of teams[j])repeat+=history.get(key(a,b))||0;
     const cost=next.cost+repeat*20+(fixture.get(sig(teams[i],teams[j]))||0)*700+random()*.0001;
     if(!best||cost<best.cost)best={cost,groups:[[teams[i],teams[j]],...next.groups]};
    }
    memo.set(mask,best);return best;
  }return dp((1<<teams.length)-1).groups;}
  const output=baseline.map((r,i)=>{
   const groups=match(best[i]),oldMatches=r.matches.filter(Boolean);
   if(groups.length!==oldMatches.length)throw Error('Structured optimizer changed number of courts');
   const matches=groups.map((t,j)=>({...oldMatches[j],teams:t.map(x=>x.slice())}));
   matches.forEach(add);
   return {...r,matches,eligibleIds:r.eligibleIds||active.slice(),structuredRestOptimized:true};
  });
  return output;
 }
 root.P5Fair532=Object.freeze({...original,optimize});
 root.P5StructuredIrregularLab=Object.freeze({components,assess,optimize,version:'lab0.2'});
})(window);