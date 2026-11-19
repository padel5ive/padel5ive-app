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
 // A court encounter includes all six relationships in the quartet, whether
 // they were partners or opponents. Do not confuse partner diversity with
 // diversity of the actual people sharing the court.
 const quartet=(a,b)=>a.concat(b).map(String).sort().join(':');
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
  const team=new Map(),opp=new Map(),exact=new Map(),together=new Map(),quartets=new Map(),lastTogether=new Map();
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
    quartets.set(quartet(a,b),(quartets.get(quartet(a,b))||0)+1);
    const four=a.concat(b);
    for(let i=0;i<four.length;i++)for(let j=i+1;j<four.length;j++){
     const k=key(four[i],four[j]);
     together.set(k,(together.get(k)||0)+1);
     lastTogether.set(k,ri);
    }
    for(const x of a)for(const y of b)opp.set(key(x,y),(opp.get(key(x,y))||0)+1);
   }
  }
  return {G,states,team,opp,exact,together,quartets,lastTogether,rounds:(rows||[]).length};
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
  const sameQuartet=h.quartets.get(quartet(a,b))||0;
  let opponent=0,coCourt=0,recent=0;
  for(const x of a)for(const y of b){const n=h.opp.get(key(x,y))||0;opponent+=n*n*170;}
  const four=a.concat(b);
  for(let i=0;i<four.length;i++)for(let j=i+1;j<four.length;j++){
   const k=key(four[i],four[j]),n=h.together.get(k)||0;
   coCourt+=n*n*1700;
   const since=h.rounds-(h.lastTogether.get(k)??-1);
   if(n&&since<=2)recent+=(since===1?9000:3000);
  }
  return repeats*120000+sameQuartet*42000+opponent+coCourt+recent;
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
  const sameFour=matches.filter(m=>(h.quartets.get(quartet(...m.teams))||0)>0).length;
  if(sameFour)warnings.push(sameFour+' repeated four-player court encounter(s) remain under current availability and rest constraints.');
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

 // Rescue rescheduled rounds after late arrival. Re-pair WHOLE intact A+B
 // teams across courts; never change teammates, selection, rests or court slots.
 // A different partner and a different opponent are not sufficient if the
 // same quartet keeps meeting. Optimize all-role court encounters too.
 function quality(matches,h){
  let score=0,exact=0,quartets=0,opponent=0;
  for(const m of matches){
   const [a,b]=m.teams;
   score+=encounterCost(a,b,h);
   if(h.exact.get(fixture(a,b)))exact++;
   if(h.quartets.get(quartet(a,b)))quartets++;
   for(const x of a)for(const y of b)if(h.opp.get(key(x,y)))opponent++;
  }
  return {score,exact,quartets,opponent};
 }

 // A completed match can feel repetitive even without an identical quartet:
 // in the real 18-player report Kosy+Raffy partnered in adjacent rounds, while
 // Hans+Indri shared a court in three consecutive rounds in different roles.
 // After a LATE ARRIVAL only, allow a minimal B-side teammate exchange
 // between unscored courts if it strictly improves whole-schedule partner
 // coverage. Fixed/Individual/Mexicano and certified normal builds are exempt.
 function partnerRisk(rows){
  const seen=new Map(),last=new Map();let repeated=0,adjacent=0,recent=0;
  for(const [ri,rd] of rows.entries())for(const m of rd.matches||[])if(m?.teams){
   for(const t of m.teams){
    if(t.length!==2)continue;
    const k=key(...t),n=seen.get(k)||0,prev=last.get(k);
    if(n)repeated++;
    if(n&&prev===ri-1)adjacent++;
    else if(n&&prev===ri-2)recent++;
    seen.set(k,n+1);last.set(k,ri);
   }
  }
  return {repeated,adjacent,recent};
 }
 function repairLatePartnerRepeats(s,prefix,future){
  if(s?.mode!=='structured-americano'||!Array.isArray(future)||!future.length)return future;
  const members=new Map((s.roster||[]).map(p=>[p.id,p.group]));
  const eligible=active(s).all;
  // Match data explicitly proves somebody was unavailable during a scored
  // earlier round; ordinary roster shuffles must not rewrite partner cycles.
  const returned=prefix.some(rd=>Array.isArray(rd.eligibleIds)&&
   (rd.matches||[]).some(m=>m?.confirmed)&&
   eligible.some(id=>!rd.eligibleIds.includes(id)));
  if(!returned)return future;
  const originalPrefix=JSON.stringify(prefix),originalFuture=JSON.stringify(future);
  const output=future.slice();
  for(let ri=0;ri<output.length;ri++){
   const rd=output[ri],slots=(rd.matches||[]).filter(Boolean);
   if(slots.length<2||slots.some(m=>m.confirmed||m.score!=null||m.skipped||
      m.teams?.length!==2||m.teams.some(t=>t.length!==2||
       members.get(t[0])!=='A'||members.get(t[1])!=='B')))continue;
   const prefixNow=prefix.concat(output.slice(0,ri));
   const h=history(prefixNow,eligible),originalQuality=quality(slots,h);
   const before=partnerRisk(prefix.concat(output)),originalMatches=slots;
   // We only touch a round that repeats a teammate from earlier rounds.
   if(!slots.some(m=>m.teams.some(t=>(h.team.get(key(...t))||0)>0)))continue;
   let choice=null,bestRisk=before,bestCost=Infinity;
   const positions=slots.flatMap((m,mi)=>m.teams.map((_,ti)=>({mi,ti})));
   for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
    const p=positions[i],q=positions[j];
    const replaced=slots.map(m=>({...m,teams:m.teams.map(t=>t.slice())}));
    const a=replaced[p.mi].teams[p.ti],b=replaced[q.mi].teams[q.ti];
    // Same-group player swap retains a legal A+B partnership and all
    // selected participants, rest assignments and scoring court identities.
    if(a[1]===b[1])continue;
    [a[1],b[1]]=[b[1],a[1]];
    const metric=quality(replaced,h);
    if(metric.exact>originalQuality.exact||
       metric.quartets>originalQuality.quartets||
       metric.opponent>originalQuality.opponent+3)continue;
    const nextRound={...rd,matches:(rd.matches||[]).map(m=>{
     if(!m)return m;
     const idx=originalMatches.indexOf(m);
     return replaced[idx];
    })};
    const trial=output.slice();trial[ri]=nextRound;
    const nextRisk=partnerRisk(prefix.concat(trial));
    const improved=nextRisk.adjacent<before.adjacent&&
      nextRisk.repeated<=before.repeated||
      nextRisk.adjacent===before.adjacent&&nextRisk.repeated<before.repeated;
    if(!improved)continue;
    const cost=nextRisk.adjacent*1000000+nextRisk.repeated*100000+
      nextRisk.recent*15000+metric.score;
    if(!choice||cost<bestCost){choice=nextRound;bestRisk=nextRisk;bestCost=cost;}
   }
   if(choice){
    output[ri]={...choice,structuredLatePartnerRepaired:true};
   }
  }
  if(JSON.stringify(prefix)!==originalPrefix||JSON.stringify(future)!==originalFuture)
   throw Error('Partner repair mutated protected historical or original future fixtures.');
  return output;
 }


 // Recovery-first scheduling after late check-in. A player's consecutive-play
 // streak is distinct from partner/opponent history. Swapping opponents alone
 // cannot give Jess (R2-R8) or Kosy (R1-R8) a turn to sit out.
 // Only touch UNCONFIRMED future matches, never historical scores or normal
 // certified opening schedules. Respect A+B structured pairing in every court.
 function restMetrics(rows,s){
  const roster=s.roster||[],group=new Map(roster.map(p=>[p.id,p.group]));
  const ids=roster.map(p=>p.id),games=Object.fromEntries(ids.map(id=>[id,0]));
  const expected=Object.fromEntries(ids.map(id=>[id,0]));
  const playRun=Object.fromEntries(ids.map(id=>[id,0]));
  const restRun=Object.fromEntries(ids.map(id=>[id,0]));
  let playCost=0,restCost=0,longest=0,triples=0;
  for(const rd of rows){
   const matches=(rd.matches||[]).filter(Boolean),on=played(rd);
   const available=Array.isArray(rd.eligibleIds)?rd.eligibleIds:ids;
   const eligible=new Set(available),a=available.filter(id=>group.get(id)==='A').length;
   const b=available.filter(id=>group.get(id)==='B').length;
   const cap=matches.length;
   for(const id of ids){
    if(!eligible.has(id)){playRun[id]=0;restRun[id]=0;continue;}
    const g=group.get(id),n=g==='A'?a:b;
    if(n>0)expected[id]+=2*cap/n;
    if(on.has(id)){
     games[id]++;
     playRun[id]++;restRun[id]=0;
     longest=Math.max(longest,playRun[id]);
     if(playRun[id]>2){
      triples++;
      playCost+=(playRun[id]-2)**2;
     }
    }else{
     playRun[id]=0;restRun[id]++;
     if(restRun[id]>1)restCost+=(restRun[id]-1)**2;
    }
   }
  }
  const deficit=ids.reduce((sum,id)=>{
   const delta=games[id]-expected[id];return sum+delta*delta;
  },0);
  return {playCost,restCost,deficit,longest,triples,
   score:playCost*250000+restCost*24000+deficit*3500};
 }
 function repeatedMeetings(rows){
  const partners=new Map(),fixtures=new Map(),quartets=new Map(),opponents=new Map();
  let repeatPartner=0,repeatFixture=0,repeatQuartet=0,repeatOpponent=0;
  for(const rd of rows)for(const m of (rd.matches||[]).filter(Boolean)){
   if(m.teams?.length!==2||m.teams.some(t=>t.length!==2))continue;
   const [a,b]=m.teams;
   for(const t of [a,b]){
    const k=key(...t),n=partners.get(k)||0;if(n)repeatPartner++;partners.set(k,n+1);
   }
   const f=fixture(a,b),q=quartet(a,b);
   if(fixtures.get(f))repeatFixture++;fixtures.set(f,(fixtures.get(f)||0)+1);
   if(quartets.get(q))repeatQuartet++;quartets.set(q,(quartets.get(q)||0)+1);
   for(const x of a)for(const y of b){
    const k=key(x,y),n=opponents.get(k)||0;
    if(n)repeatOpponent++;
    opponents.set(k,n+1);
   }
  }
  return {repeatPartner,repeatFixture,repeatQuartet,repeatOpponent};
 }
 function repairLateRestStreaks(s,prefix,future){
  if(s?.mode!=='structured-americano'||!Array.isArray(future)||!future.length)return future;
  const roster=s.roster||[],members=new Map(roster.map(p=>[p.id,p.group]));
  const current=active(s).all;
  // Actual historical attendance difference is required. Do not replace
  // routine certified round-robin pairings or users who deliberately sit out.
  const hasLate=prefix.some(rd=>Array.isArray(rd.eligibleIds)&&
   (rd.matches||[]).some(m=>m?.confirmed)&&
   current.some(id=>!rd.eligibleIds.includes(id)));
  if(!hasLate)return future;
  const protect=JSON.stringify(prefix),source=JSON.stringify(future),result=future.slice();
  let risk=restMetrics(prefix.concat(result),s);
  let repetition=repeatedMeetings(prefix.concat(result));
  // Deterministic bounded local search: a resting, eligible same-side player
  // replaces an overplayed participant in one future unscored court.
  // Unlike a full reshuffle, it preserves court slot, score, round ID,
  // selected court count and completed history.
  const trials=Math.min(18,result.length*2);
  for(let turn=0;turn<trials;turn++){
   let winner=null;
   for(let ri=0;ri<result.length;ri++){
    const rd=result[ri];
    if(!rd||!Array.isArray(rd.matches)||rd.matches.some(m=>m&&
       (m.confirmed||m.score!=null||m.skipped)))continue;
    const scheduled=played(rd),eligible=Array.isArray(rd.eligibleIds)?rd.eligibleIds:current;
    const resting=eligible.filter(id=>current.includes(id)&&!scheduled.has(id));
    if(!resting.length)continue;
    for(let mi=0;mi<rd.matches.length;mi++){
     const m=rd.matches[mi];
     if(!m?.teams||m.teams.length!==2||m.teams.some(t=>t.length!==2))continue;
     for(let ti=0;ti<2;ti++)for(let pi=0;pi<2;pi++){
      const oldId=m.teams[ti][pi],side=members.get(oldId);
      if(side!=='A'&&side!=='B')continue;
      for(const incoming of resting){
       if(members.get(incoming)!==side)continue;
       const swapped={...m,teams:m.teams.map(t=>t.slice())};
       swapped.teams[ti][pi]=incoming;
       if(swapped.teams[ti].some(id=>!eligible.includes(id)))continue;
       const updated={...rd,matches:rd.matches.map((x,i)=>i===mi?swapped:x)};
       const proposal=result.slice();proposal[ri]=updated;
       const combined=prefix.concat(proposal),newRisk=restMetrics(combined,s);
       if(newRisk.score>=risk.score-1e-6)continue;
       const rep=repeatedMeetings(combined);
       // Preserve diversity whenever possible; never improve one streak by
       // creating a repeated teammate, identical fixture or same quartet.
       if(rep.repeatPartner>repetition.repeatPartner||
          rep.repeatFixture>repetition.repeatFixture||
          rep.repeatQuartet>repetition.repeatQuartet||
          rep.repeatOpponent>repetition.repeatOpponent+1)continue;
       const gain=risk.score-newRisk.score;
       const tie=rep.repeatOpponent-repetition.repeatOpponent;
       if(!winner||gain>winner.gain+1e-6||
          Math.abs(gain-winner.gain)<1e-6&&tie<winner.tie){
        winner={ri,updated,newRisk,rep,gain,tie};
       }
      }
     }
    }
   }
   if(!winner)break;
   result[winner.ri]={...winner.updated,structuredRestRecovered:true};
   risk=winner.newRisk;repetition=winner.rep;
  }
  if(JSON.stringify(prefix)!==protect||JSON.stringify(future)!==source)
   throw Error('Rest recovery attempted to modify protected matches or source schedule.');
  return result;
 }

 function rebalanceFuture(s,prefix,future,random){
  if(s?.mode!=='structured-americano'||!Array.isArray(future))return future;
  const r=rng(random),preserved=JSON.stringify(prefix),past=prefix.slice();
  const ids=active(s).all,output=[];
  for(const rd of future){
   const slots=(rd.matches||[]).filter(Boolean);
   if(slots.length<2||slots.length>5||
      slots.some(m=>m.confirmed||m.score!=null||m.skipped||
        m.teams?.length!==2||m.teams.some(t=>t.length!==2))){
    output.push(rd);past.push(rd);continue;
   }
   const h=history(past,ids),original=quality(slots,h);
   const teams=slots.flatMap(m=>m.teams.map(t=>t.slice()));
   const n=teams.length;
   // Safety: never hand the optimizer an already invalid/double-booked round.
   if(new Set(teams.flat()).size!==n*2){output.push(rd);past.push(rd);continue;}
   let best=original,chosen=null;
   function search(remaining,matches){
    if(!remaining.length){
     const metric=quality(matches,h);
     // Never trade a new repeated opponent, exact fixture, or repeated
     // quartet just to improve another soft metric.
     if(metric.exact>original.exact||metric.quartets>original.quartets||
        metric.opponent>original.opponent)return;
     if(metric.score+1e-6<best.score){
      best=metric;chosen=matches.map(m=>m.teams.map(t=>t.slice()));
     }
     return;
    }
    const first=remaining[0];
    for(let j=1;j<remaining.length;j++){
     const second=remaining[j];
     search(remaining.filter((_,k)=>k!==0&&k!==j),
       matches.concat([{teams:[teams[first],teams[second]]}]));
    }
   }
   search(Array.from({length:n},(_,i)=>i),[]);
   const updated=chosen?{...rd,matches:(rd.matches||[]).map((m,i)=>{
    if(!m)return m;
    // Sparse court arrays remain sparse: assign only actual fixture slots.
    const slot=slots.indexOf(m);
    return {...m,teams:chosen[slot].map(t=>t.slice())};
   }),structuredEncounterBalanced:true}:rd;
   output.push(updated);past.push(updated);
  }
  if(JSON.stringify(prefix)!==preserved)throw Error('Late arrival changed protected match history.');
  return repairLateRestStreaks(s,prefix,repairLatePartnerRepeats(s,prefix,output));
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
  return rebalanceFuture(s,prefix,future,r);
 }
 root.P5Structured=Object.freeze({...previous,validate,build,extend,rebuild,
  structuredMatchmakingVersion:'2.4'});
 root.P5StructuredMatchmakingV2=Object.freeze({version:'2.4',active,history,schedule,addMissing,rebalanceFuture,quality,partnerRisk,repairLatePartnerRepeats,restMetrics,repeatedMeetings,repairLateRestStreaks});
})(window);
