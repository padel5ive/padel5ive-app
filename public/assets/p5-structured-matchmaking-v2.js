/* PADEL 5IVE — Structured Americano Matchmaking v2 (isolated adapter).
 * Goals: full feasible courts, equitable Games Played/rest, different opponents,
 * repeat A+B teammates when useful, avoid exact pair-versus-pair repeats.
 * Never alters confirmed history, other modes, or locked engines.
 * Installed after the certified, opponent and late-return adapters.
 */
(function(root){
 'use strict';
 const previous=root.P5Structured;
 if(!previous||typeof previous.build!=='function'||typeof previous.extend!=='function')
  throw Error('Structured Americano engine missing');
 const key=(a,b)=>String(a)<String(b)?String(a)+':'+String(b):String(b)+':'+String(a);
 const fixture=(a,b)=>[a.map(String).sort().join(':'),b.map(String).sort().join(':')].sort().join('|');
 const rng=r=>typeof r==='function'?r:Math.random;
 const shuffled=(items,r)=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const played=rd=>new Set((rd.matches||[]).filter(Boolean).flatMap(m=>m.teams.flat()));
 function active(s){const m=previous.members(s),A=m.A.slice(),B=m.B.slice();
  return {A,B,all:A.concat(B),cap:Math.min(Number(s.courts)||1,Math.floor(A.length/2),Math.floor(B.length/2))};
 }
 function validate(s,requireBalance=true){
  if(s?.mode!=='structured-americano')return previous.validate(s,requireBalance);
  previous.validate(s,false);
  // Non-strict validation is used by backup/restore and roster editing, even
  // when all players are temporarily unavailable. Do not reject valid archives.
  if(requireBalance===false)return true;
  const m=active(s);
  if(m.cap<1)throw Error('Structured Americano needs two available players in each group.');
  return true;
 }
 function history(rows,ids){
  const G=Object.fromEntries(ids.map(id=>[id,0])),states=Object.fromEntries(ids.map(id=>[id,[]]));
  const team=new Map(),opp=new Map(),exact=new Map();
  for(const [ri,rd] of (rows||[]).entries()){
   const on=played(rd),eligible=rd.eligibleIds||ids;
   // Availability gaps must break play/rest streaks. A late arrival or Sit Out
   // is not an involuntary rest, even if the last earlier eligible round was.
   for(const id of ids)if(eligible.includes(id)){states[id].push({round:ri,played:on.has(id)});if(on.has(id))G[id]++;}
   for(const m of (rd.matches||[]).filter(Boolean)){
    if(m.teams?.length!==2)continue;
    const [a,b]=m.teams;if(a.length!==2||b.length!==2)continue;
    for(const t of [a,b])team.set(key(...t),(team.get(key(...t))||0)+1);
    exact.set(fixture(a,b),(exact.get(fixture(a,b))||0)+1);
    for(const x of a)for(const y of b)opp.set(key(x,y),(opp.get(key(x,y))||0)+1);
   }
  }
  return {G,states,team,opp,exact,rounds:(rows||[]).length};
 }
 const last=(h,id)=>{const z=h.states[id]?.at(-1);return z?.round===h.rounds-1?z.played:undefined;};
 const twice=(h,id)=>{const seq=h.states[id]||[],a=seq.at(-2),b=seq.at(-1);
  return a?.round===h.rounds-2&&b?.round===h.rounds-1&&a.played&&b.played;};
 function combinationChoices(group,need,h,r,limit=6){
  const records=[],arr=[];
  function evaluate(){
   const chosen=new Set(arr),counts=group.map(id=>(h.G[id]||0)+(chosen.has(id)?1:0));
   const min=Math.min(...counts),max=Math.max(...counts);
   const avg=counts.reduce((a,b)=>a+b,0)/counts.length;
   let dbl=0,triple=0;
   for(const id of group){
    if(!chosen.has(id)&&last(h,id)===false)dbl++;
    if(chosen.has(id)&&twice(h,id))triple++;
   }
   const variance=counts.reduce((a,b)=>a+(b-avg)**2,0);
   const cost=(max-min)**2*160000+variance*9000+dbl*60000+triple*6500+r()*.025;
   records.push({ids:arr.slice(),cost});
  }
  function rec(start){if(arr.length===need){evaluate();return;}
   for(let i=start;i<=group.length-(need-arr.length);i++){arr.push(group[i]);rec(i+1);arr.pop();}
  }
  rec(0);
  records.sort((a,b)=>a.cost-b.cost);
  return records.slice(0,limit);
 }
 function encounterCost(a,b,h){
  const repeats=h.exact.get(fixture(a,b))||0;
  let opponent=0;
  for(const x of a)for(const y of b){const n=h.opp.get(key(x,y))||0;opponent+=n*n*170;}
  return repeats*120000+opponent;
 }
 function pairOpponents(teams,h,r){
  const n=teams.length,memo=new Map();
  function solve(mask){
   if(!mask)return {cost:0,matches:[]};
   if(memo.has(mask))return memo.get(mask);
   const bit=mask&-mask,i=31-Math.clz32(bit),rest=mask^bit;
   let best=null;
   for(let j=i+1;j<n;j++)if(rest&(1<<j)){
    const other=solve(rest^(1<<j));
    const cost=other.cost+encounterCost(teams[i],teams[j],h)+r()*.01;
    if(!best||cost<best.cost)best={cost,matches:[[teams[i],teams[j]],...other.matches]};
   }
   memo.set(mask,best);return best;
  }
  return solve((1<<n)-1);
 }
 function schedule(s,rows,r){
  const m=active(s);if(m.cap<1)throw Error('Not enough active players to fill one doubles court.');
  const h=history(rows,m.all),need=m.cap*2;
  const aChoices=combinationChoices(m.A,need,h,r),bChoices=combinationChoices(m.B,need,h,r);
  let best=null;
  for(const aa of aChoices)for(const bb of bChoices){
   const activeA=aa.ids,activeB=bb.ids,fair=aa.cost+bb.cost;
   // Search several cross-group teammate permutations; opponent matching is
   // solved exactly for each arrangement of intact teams.
   for(let sample=0;sample<Math.max(16,4*m.cap);sample++){
    const x=shuffled(activeA,r),y=shuffled(activeB,r);
    const teams=x.map((id,i)=>[id,y[i]]);
    const repeat=teams.reduce((sum,t)=>sum+(h.team.get(key(...t))||0)**2,0);
    const paired=pairOpponents(teams,h,r);
    const cost=fair+repeat*1600+paired.cost;
    if(!best||cost<best.cost)best={cost,matches:paired.matches,repeats:repeat};
   }
  }
  if(!best)throw Error('Structured Americano could not schedule valid A+B teams.');
  const index=rows.length;
  const matches=best.matches.map((teams,j)=>({
   id:'R'+index+'C'+j,court:j+1,teams:teams.map(x=>x.slice()),score:null,confirmed:false
  }));
  const duplicates=matches.filter(m=>(h.exact.get(fixture(...m.teams))||0)>0).length;
  const warnings=[];
  if(duplicates)warnings.push(duplicates+' previously played exact match-up(s) could not be avoided by the bounded search.');
  return {index,matches,eligibleIds:m.all.slice(),groupSnapshot:{A:m.A.length,B:m.B.length},
   structuredHistoryAware:true,...(warnings.length?{fairnessWarnings:warnings}:{})};
 }
 function addMissing(s,rd,prefix,r){
  const m=active(s),matches=(rd.matches||[]).filter(Boolean);
  if(matches.some(x=>x.confirmed||x.score!=null)||matches.length>=m.cap)return rd;
  const copy={...rd,matches:matches.map(x=>({...x,teams:x.teams.map(t=>t.slice())})),
   fairnessWarnings:(rd.fairnessWarnings||[]).slice()};
  let added=0;
  while(copy.matches.length<m.cap){
   const on=played(copy),A=m.A.filter(id=>!on.has(id)),B=m.B.filter(id=>!on.has(id));
   if(A.length<2||B.length<2)break;
   const h=history(prefix.concat([copy]),m.all),previousRest=history(prefix,m.all),all=m.all;
   const current=all.map(id=>h.G[id]||0),mean=(current.reduce((a,b)=>a+b,0)+4)/all.length;
   let best=null;
   for(let ai=0;ai<A.length;ai++)for(let aj=ai+1;aj<A.length;aj++)
    for(let bi=0;bi<B.length;bi++)for(let bj=bi+1;bj<B.length;bj++)
     for(const bs of [[B[bi],B[bj]],[B[bj],B[bi]]]){
      const x=[A[ai],bs[0]],y=[A[aj],bs[1]],chosen=new Set(x.concat(y));
      const updated=all.map(id=>(h.G[id]||0)+(chosen.has(id)?1:0));
      const gap=Math.max(...updated)-Math.min(...updated);
      const variance=updated.reduce((sum,v)=>sum+(v-mean)**2,0);
      let repeat=(h.team.get(key(...x))||0)+(h.team.get(key(...y))||0);
      const doubleRest=all.filter(id=>!on.has(id)&&!chosen.has(id)&&last(previousRest,id)===false).length;
      const cost=gap**2*150000+variance*8500+doubleRest*2000+
       repeat*900+encounterCost(x,y,h)+r()*.02;
      if(!best||cost<best.cost)best={cost,teams:[x,y]};
     }
   if(!best)break;
   const taken=new Set(copy.matches.map(x=>x.court));
   const court=Array.from({length:m.cap},(_,i)=>i+1).find(i=>!taken.has(i));
   copy.matches.push({id:'R'+copy.index+'C'+(court-1),court,
    teams:best.teams,score:null,confirmed:false,structuredCapacityMakeup:true});
   added++;
  }
  if(added){copy.structuredCapacityOptimized=true;copy.fairnessWarnings.push(
   added+' additional court match'+(added===1?'':'es')+' scheduled with history-aware A+B pairing.');}
  return added?copy:rd;
 }
 function build(s,random){
  if(s?.mode!=='structured-americano')return previous.build(s,random);
  validate(s);const r=rng(random),m=active(s);
  if(m.A.length!==m.B.length){
   const rounds=Math.max(1,Math.ceil(m.A.length*m.B.length/(2*m.cap))),out=[];
   for(let i=0;i<rounds;i++)out.push(schedule(s,out,r));
   return out;
  }
  const rows=previous.build(s,r);
  let prior=[];
  return rows.map(rd=>{const full=addMissing(s,rd,prior,r);prior.push(full);return full;});
 }
 function extend(s,random){
  if(s?.mode!=='structured-americano')return previous.extend(s,random);
  validate(s);return schedule(s,s.rounds||[],rng(random));
 }
 function rebuild(s,random){
  if(s?.mode!=='structured-americano')return previous.rebuild(s,random);
  validate(s);const r=rng(random),m=active(s);
  const prefix=(s.rounds||[]).slice(0,(s.currentRound||0)+1);
  if((s.rounds||[]).slice(prefix.length).some(rd=>(rd.matches||[]).some(m=>m&&(m.confirmed||m.score!=null||m.skipped))))
   throw Error('Structured rebuild cannot alter a scored or protected future fixture. Reopen it first.');
  const frozen=JSON.stringify(prefix),pending=Math.max(1,(s.rounds||[]).length-prefix.length);
  let future;
  if(m.A.length!==m.B.length){
   const seen=new Set(prefix.flatMap(rd=>(rd.matches||[]).filter(Boolean).flatMap(x=>x.teams.map(t=>key(...t)))));
   const unplayed=Math.max(0,m.A.length*m.B.length-
     m.A.reduce((v,a)=>v+m.B.filter(b=>seen.has(key(a,b))).length,0));
   const rounds=Math.max(pending,Math.ceil(unplayed/(2*m.cap)));
   future=[];const all=prefix.slice();for(let i=0;i<rounds;i++){const rd=schedule(s,all,r);all.push(rd);future.push(rd);}
  }else{
   future=previous.rebuild(s,r);
   let all=prefix.slice();
   future=future.map(rd=>{const full=addMissing(s,rd,all,r);all.push(full);return full;});
  }
  if(JSON.stringify(prefix)!==frozen)throw Error('Confirmed Structured match history was modified.');
  return future;
 }
 root.P5Structured=Object.freeze({...previous,validate,build,extend,rebuild,
  structuredMatchmakingVersion:'2.0'});
 root.P5StructuredMatchmakingV2=Object.freeze({version:'2.0',active,history,schedule,addMissing});
})(window);
