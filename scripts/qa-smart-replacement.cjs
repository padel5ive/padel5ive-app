const assert=require('node:assert/strict');
const {replacementPlan}=require('./smart-replacement.cjs');
const match=(a,b)=>({teams:[[a],[b]],confirmed:false,score:null});
const state=rounds=>({currentRound:1,rounds:rounds.map(matches=>({matches}))});
const saved=match(1,4),target=match(1,2),other=match(4,5),future=match(3,2);
saved.score=[3,2];saved.confirmed=true;
const s=state([[saved],[target,other],[future]]);
const before=JSON.stringify(s);
const plan=replacementPlan(s,target,0,0,3);
assert.equal(JSON.stringify(s),before);
assert.deepEqual([...plan.changes],[[future,[[1],[2]]]]);
assert.equal(plan.repeats,0);

for (const lock of [{confirmed:true,score:[3,2]},{substitutions:[{}]},{score:[0,0]}]) {
  const protectedMatch=Object.assign(match(3,2),lock);
  const result=replacementPlan(state([[saved],[target],[protectedMatch]]),target,0,0,3);
  assert.equal(result.changes.size,0);
  assert.equal(result.repeats,1);
}
const eligible=state([[saved],[target],[future]]);
eligible.rounds[2].eligibleIds=[2,3];
assert.equal(replacementPlan(eligible,target,0,0,3).changes.size,0);

// Include both live changes in the optimizer, and apply future updates separately.
const courtOne=match(1,2),courtTwo=match(3,4),queuedOne=match(3,2),queuedTwo=match(1,4);
const earlier=Object.assign(match(5,6),{confirmed:true,score:[3,2]});
const swapState=state([[earlier],[courtOne,courtTwo],[queuedOne,queuedTwo]]);
const swapBefore=JSON.stringify(swapState);
const swapPlan=replacementPlan(swapState,courtOne,0,0,3,{fixture:courtTwo,side:0,slot:0});
assert.equal(JSON.stringify(swapState),swapBefore);
assert(!swapPlan.changes.has(courtOne)&&!swapPlan.changes.has(courtTwo));
assert.deepEqual(swapPlan.changes.get(queuedOne),[[1],[2]]);
assert.deepEqual(swapPlan.changes.get(queuedTwo),[[3],[4]]);

const sameCourt={teams:[[1,2],[3,4]],confirmed:false,score:null};
const sameCourtFuture={teams:[[3,2],[1,4]],confirmed:false,score:null};
const sameCourtState=state([[earlier],[sameCourt],[sameCourtFuture]]);
const partnerSwap=replacementPlan(sameCourtState,sameCourt,0,0,3,{fixture:sameCourt,side:1,slot:0});
assert.deepEqual(partnerSwap.changes.get(sameCourtFuture),[[1,2],[3,4]],'Both switched slots are included in planning');
assert.deepEqual(sameCourt.teams,[[1,2],[3,4]],'Preview does not alter the live match');

// Every legal first-match substitution in a full fixed-partner continuous cycle.
for(let n=4;n<=12;n++){
  for(let id=3;id<=n;id++){
    const live=match(1,2), queue=[];
    for(let a=1;a<n;a++)for(let b=a+1;b<=n;b++)if(a!==1||b!==2)queue.push(match(a,b));
    const continuous={...state([[live]]),matchFlow:'continuous',continuous:{queue}};
    const result=replacementPlan(continuous,live,0,0,id);
    const actual=[[[id],[2]],...queue.map(f=>result.changes.get(f)||f.teams)];
    const keys=actual.map(t=>t.flat().sort((a,b)=>a-b).join(':'));
    assert.equal(new Set(keys).size,n*(n-1)/2);
    assert.equal(result.repeats,0);
    assert.equal(result.changes.size,1);
  }
}
console.log('PASS smart replacement, locked scores, availability, protected courts and 54 complete queue repairs');
