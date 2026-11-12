/* PADEL 5IVE · Structured Americano late-return court-density recovery.
 * Opt-in after historical eligibility changes. Refill otherwise-unused courts
 * in the FINAL unconfirmed round without changing immutable earlier fixtures.
 * Complete partner coverage remains intact; a repeat teammate is explicitly
 * permitted when that is the only way to use a booked court.
 *
 * Not used by: ordinary certified full-roster cycles, Mexicano, Fixed Partner,
 * Flexible Pairing, KO, or any established scored/confirmed round.
 */
(function(root){
 'use strict';
 const baseline=root.P5Structured;
 if(!baseline||typeof baseline.rebuild!=='function')throw Error('Structured Americano scheduler missing');
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const sig=(x,y)=>[x.slice().sort((a,b)=>a-b).join(':'),y.slice().sort((a,b)=>a-b).join(':')].sort().join('|');
 const flatten=rd=>(rd?.matches||[]).filter(Boolean);
 function participants(s){
  const g=baseline.members(s);
  return {A:g.A.slice(),B:g.B.slice(),all:g.A.concat(g.B)};
 }
 function hasReturnedEligiblePlayer(prefix,ids){
  return prefix.some(r=>Array.isArray(r?.eligibleIds) &&
    flatten(r).some(m=>m.confirmed) &&
    ids.some(id=>!r.eligibleIds.includes(id)));
 }
 function history(rows,ids){
  const games=Object.fromEntries(ids.map(id=>[id,0])),
   allowed=Object.fromEntries(ids.map(id=>[id,0])),
   rest=Object.fromEntries(ids.map(id=>[id,0])),
   partner=new Map(),opponent=new Map(),fixtures=new Map();
  for(const rd of rows){
   const played=new Set();
   for(const m of flatten(rd)){
    if(!Array.isArray(m.teams)||m.teams.length!==2)continue;
    const [x,y]=m.teams;
    if(x.length!==2||y.length!==2)continue;
    fixtures.set(sig(x,y),(fixtures.get(sig(x,y))||0)+1);
    for(const t of [x,y]){
     partner.set(key(...t),(partner.get(key(...t))||0)+1);
     for(const id of t)played.add(id);
    }
    for(const a of x)for(const b of y)opponent.set(key(a,b),(opponent.get(key(a,b))||0)+1);
   }
   for(const id of ids){
    // Late arrival and explicit Sit Out are neither a game nor a rest.
    if(Array.isArray(rd.eligibleIds)&&!rd.eligibleIds.includes(id))continue;
    allowed[id]++;
    if(played.has(id)){games[id]++;rest[id]=0;}else rest[id]++;
   }
  }
  return {games,allowed,rest,partner,opponent,fixtures};
 }
 function candidate(g,round,past,random){
  const unavailable=new Set(flatten(round).flatMap(m=>m.teams.flat()));
  const A=g.A.filter(id=>!unavailable.has(id)),B=g.B.filter(id=>!unavailable.has(id));
  if(A.length<2||B.length<2)return null;
  const ids=g.all,base=past.games,initialVals=ids.map(id=>base[id]||0);
  const mean=(initialVals.reduce((a,b)=>a+b,0)+4)/ids.length;
  let best=null;
  for(let ai=0;ai<A.length;ai++)for(let aj=ai+1;aj<A.length;aj++)
   for(let bi=0;bi<B.length;bi++)for(let bj=bi+1;bj<B.length;bj++){
    const selected=[A[ai],A[aj],B[bi],B[bj]];
    const after=ids.map(id=>(base[id]||0)+(selected.includes(id)?1:0));
    const gap=Math.max(...after)-Math.min(...after);
    const variance=after.reduce((sum,n)=>sum+(n-mean)**2,0);
    // Favor players who previously rested while eligible. The upcoming round
    // is already excluded from 'past.rest': only the preceding round matters.
    const overdue=selected.reduce((sum,id)=>sum+Math.min(3,past.rest[id]||0),0);
    for(const Bpair of [[B[bi],B[bj]],[B[bj],B[bi]]]){
     const x=[A[ai],Bpair[0]],y=[A[aj],Bpair[1]];
     const repeats=(past.partner.get(key(...x))||0)+(past.partner.get(key(...y))||0);
     const exact=past.fixtures.get(sig(x,y))||0;
     let opponent=0;for(const a of x)for(const b of y)opponent+=past.opponent.get(key(a,b))||0;
     // Hard scheduling validity is checked separately. Repeats are soft costs:
     // never leave an eligible court empty solely to protect partner uniqueness.
     const cost=gap*100000+variance*5000+exact*12000+
       repeats*350+opponent*24-overdue*240+random()*.01;
     if(!best||cost<best.cost)best={teams:[x,y],cost,repeats,exact};
    }
   }
  return best;
 }
 function fillVacantLateReturn(s,prefix,future,random){
  if(s?.mode!=='structured-americano'||!Array.isArray(future)||!future.length)
   return future;
  if(future.some(rd=>flatten(rd).some(m=>m.confirmed||m.score!=null)))
   return future;
  const g=participants(s);
  if(g.A.length!==g.B.length||!hasReturnedEligiblePlayer(prefix,g.all))
   return future;
  const capacity=Math.min(Number(s.courts)||1,Math.floor(g.A.length/2));
  if(capacity<1)return future;
  // Scope to the end of the precomputed incomplete-partner cycle.
  const last=future[future.length-1],existing=flatten(last);
  if(!existing.length||existing.length>=capacity)return future;
  const eligible=Array.isArray(last.eligibleIds)?last.eligibleIds:g.all;
  if(g.all.some(id=>!eligible.includes(id)))return future;
  const occupied=new Set(existing.flatMap(m=>m.teams.flat()));
  if(g.A.filter(id=>!occupied.has(id)).length<2||
     g.B.filter(id=>!occupied.has(id)).length<2)return future;

  // Copy only future scheduling records. The prefix, the caller's original
  // future array and every confirmed game remain byte-for-byte untouched.
  const result=future.map((rd,i)=>i===future.length-1?{
   ...rd,matches:flatten(rd).map(m=>({...m,teams:m.teams.map(t=>t.slice())})),
   fairnessWarnings:(rd.fairnessWarnings||[]).slice()
  }:rd);
  const tail=result[result.length-1];
  let added=0;
  while(flatten(tail).length<capacity){
   const prior=history(prefix.concat(result),g.all);
   // If a rest streak started in the previous round, remove the last round
   // from that calculation: it is the round we're currently filling.
   const previous=history(prefix.concat(result.slice(0,-1)),g.all);
   const pick=candidate(g,tail,{...prior,rest:previous.rest},random);
   if(!pick)break;
   const taken=new Set(flatten(tail).map(m=>m.court));
   const court=Array.from({length:capacity},(_,i)=>i+1).find(c=>!taken.has(c));
   if(!court)break;
   const id='R'+tail.index+'C'+(court-1);
   tail.matches.push({id,court,teams:pick.teams,confirmed:false,score:null,
    structuredLateReturnMakeup:true});
   added++;
  }
  if(!added)return future;
  tail.structuredLateReturnDensity=true;
  tail.fairnessWarnings.push('Late-return court recovery: '+added+
   ' additional match'+(added===1?'':'es')+
   ' scheduled in the previously unused final court'+(added===1?'':'s')+
   '; repeated teammates may be necessary.');
  return result;
 }
 function rebuild(s,random){
  const before=baseline.rebuild(s,random);
  const prefix=(s.rounds||[]).slice(0,s.currentRound+1);
  return fillVacantLateReturn(s,prefix,before,random);
 }
 root.P5Structured=Object.freeze({...baseline,rebuild});
 root.P5StructuredLateReturnDensity=Object.freeze({
  version:'qa-1',fillVacantLateReturn,hasReturnedEligiblePlayer,history
 });
})(window);
