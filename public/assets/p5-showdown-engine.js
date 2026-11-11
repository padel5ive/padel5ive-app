
/* PADEL 5IVE TEAM SHOWDOWN — independent competition engine v0.3
   No dependency on the legacy Match Control engine. UMD for browser and Node QA. */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;else root.ClubEngine=engine;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_PAIRS=10, MAX_COURTS=5;
const formats=['total4','total5','total6','first4','first5','first6'];
const fmt=(f)=>({kind:f.startsWith('total')?'total':'first',target:Number(f.slice(-1))});
function checkSetup(pairs,courts,format){return Number.isInteger(pairs)&&pairs>=1&&pairs<=MAX_PAIRS&&Number.isInteger(courts)&&courts>=1&&courts<=MAX_COURTS&&formats.includes(format);}
function pairing(n){const edges=[];for(let offset=0;offset<n;offset++)for(let i=0;i<n;i++)edges.push({a:i,b:(i+offset)%n,offset});return edges;}
/* Weighted bipartite maximum matching, restricted to edges not previously scheduled.
   Schedules are deterministic; tie breaking is driven by the initial Latin offsets.
   Fill at most `courts` matches per wave without duplicating a pair. */
function generateSchedule(n,courts){
 if(!checkSetup(n,courts,'total5'))throw Error('Pairs must be 1–10 and courts 1–5');
 const edgeList=pairing(n), left=new Set(edgeList.map(e=>`${e.a}:${e.b}`));
 const schedule=[],usedA=Array(n).fill(0),usedB=Array(n).fill(0),lastA=Array(n).fill(-100),lastB=Array(n).fill(-100);
 const courtA=Array.from({length:n},()=>Array(courts).fill(0));
 const courtB=Array.from({length:n},()=>Array(courts).fill(0));
 // Exhaustive matching of up to min(courts,n) A positions using candidate B choices.
 // n<=10 & courts<=5, max 5 players evaluated per wave.
 for(let wave=0;left.size;wave++){
   if(wave>n*n)throw Error('Schedule did not converge');
   const options=[];
   for(let a=0;a<n;a++)for(let b=0;b<n;b++)if(left.has(`${a}:${b}`)){
     const gapA=wave-lastA[a],gapB=wave-lastB[b];
     const score=25-(usedA[a]+usedB[b])*2+
       Math.min(10,gapA)*2+Math.min(10,gapB)*2-
       (gapA===1?22:0)-(gapB===1?22:0)+
       ((a+b*7)%11)*.001;
     options.push({a,b,score});
   }
   options.sort((x,y)=>y.score-x.score);
   const usedAThis=new Set(),usedBThis=new Set(),chosen=[];
   // Multi-start greedy matching. Prefer full utilization, then fairness.
   let best=null,bestScore=-Infinity;
   for(let seed=0;seed<Math.min(13,options.length+1);seed++){
     const cand=options.slice();
     if(seed){const j=Math.min(seed-1,cand.length-1);[cand[0],cand[j]]=[cand[j],cand[0]];}
     let cur=[],ua=new Set(),ub=new Set(),sc=0;
     for(const e of cand){if(cur.length>=Math.min(courts,n))break;if(ua.has(e.a)||ub.has(e.b))continue;ua.add(e.a);ub.add(e.b);cur.push(e);sc+=e.score;}
     const objective=cur.length*10000+sc;
     if(objective>bestScore){bestScore=objective;best=cur;}
   }
   if(!best?.length)throw Error('Unable to schedule remaining matches');
   // Greedily balance court usage within this wave.
   const avail=Array.from({length:courts},(_,i)=>i);
   best.sort((x,y)=>(usedA[x.a]+usedB[x.b])-(usedA[y.a]+usedB[y.b]));
   for(const e of best){
     avail.sort((x,y)=>(courtA[e.a][x]+courtB[e.b][x])-(courtA[e.a][y]+courtB[e.b][y]));
     const c=avail.shift();
     courtA[e.a][c]++;courtB[e.b][c]++;
     usedA[e.a]++;usedB[e.b]++;lastA[e.a]=wave;lastB[e.b]=wave;
     left.delete(`${e.a}:${e.b}`);
     chosen.push({id:`a${e.a}-b${e.b}`,a:e.a,b:e.b,court:c+1,wave:wave+1,scoreA:null,scoreB:null,winner:null});
   }
   chosen.sort((x,y)=>x.court-y.court);
   schedule.push(chosen);
 }
 return schedule;
}
function scoreMatch(format, raw, requireWinner=false, tieWinner=null){
 const {kind,target}=fmt(format);const a=Number(raw);
 if(raw===null||raw===undefined||raw===''||!Number.isInteger(a)||a<0)throw Error('Enter a valid nonnegative game score');
 let b;
 if(kind==='total'){
   if(a>target)throw Error('Score exceeds total games');
   b=target-a;
 }else{
   // Raw is the LOSER's score; winner determined separately when using First to.
   // This shorthand is not used. Always pass {a,b} for first-to.
   throw Error('First-to format requires both team scores');
 }
 const winner=a>b?'A':b>a?'B':(requireWinner?tieWinner:null);
 if(requireWinner&&winner!=='A'&&winner!=='B')throw Error('Draw needs a tiebreak winner');
 return {a,b,winner};
}
function validateScore(format,a,b,requireWinner=false,tieWinner=null){
 const {kind,target}=fmt(format);
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0)throw Error('Scores must be nonnegative integers');
 if(kind==='total'&&a+b!==target)throw Error(`Total must be ${target}`);
 if(kind==='first'&&!(Math.max(a,b)===target&&Math.min(a,b)<target))throw Error(`One side must reach ${target}, the other must be below ${target}`);
 const winner=a>b?'A':b>a?'B':(requireWinner?tieWinner:null);
 if(requireWinner&&winner!=='A'&&winner!=='B')throw Error('Select a tiebreak winner');
 return {a,b,winner};
}
function stage1Stats(state){
 const n=state.setup.pairs, pairStats={A:Array.from({length:n},(_,i)=>({index:i,w:0,l:0,d:0,p:0,against:0,diff:0,played:0})),B:Array.from({length:n},(_,i)=>({index:i,w:0,l:0,d:0,p:0,against:0,diff:0,played:0}))};
 const team={A:{w:0,l:0,d:0,p:0,against:0,played:0},B:{w:0,l:0,d:0,p:0,against:0,played:0}};
 for(const wave of state.schedule||[])for(const match of wave){if(match.scoreA===null||match.scoreB===null)continue;
   let a=pairStats.A[match.a],b=pairStats.B[match.b],win=match.winner;
   a.played++;b.played++;team.A.played++;team.B.played++;
   a.p+=match.scoreA;a.against+=match.scoreB;b.p+=match.scoreB;b.against+=match.scoreA;
   team.A.p+=match.scoreA;team.A.against+=match.scoreB;team.B.p+=match.scoreB;team.B.against+=match.scoreA;
   if(win==='A'){a.w++;b.l++;team.A.w++;team.B.l++;}
   else if(win==='B'){b.w++;a.l++;team.B.w++;team.A.l++;}
   else {a.d++;b.d++;team.A.d++;team.B.d++;}
 }
 for(const c of ['A','B'])for(const s of pairStats[c])s.diff=s.p-s.against;
 function rank(rows){return rows.slice().sort((a,b)=>b.w-a.w||b.diff-a.diff||b.p-a.p||a.index-b.index);}
 const complete=team.A.played===n*n;
 let stageWinner=null;
 if(complete){const a=team.A,b=team.B;stageWinner=a.w>b.w?'A':b.w>a.w?'B':a.p>b.p?'A':b.p>a.p?'B':null;}
 const overallRanking=[...pairStats.A.map(p=>({...p,team:'A'})),...pairStats.B.map(p=>({...p,team:'B'}))]
   .sort((a,b)=>b.w-a.w||b.diff-a.diff||b.p-a.p||a.team.localeCompare(b.team)||a.index-b.index)
   .map((p,i)=>({...p,rank:i+1}));
 return {pairStats:{A:rank(pairStats.A),B:rank(pairStats.B)},overallRanking,team,complete,winner:stageWinner,total:n*n};
}
function allowedDuels(n){return [1,3,5,7,9].filter(x=>x<=n);}
function stage2Stats(state){
 const matches=state.stage2?.matches||[];let wa=0,wb=0,pa=0,pb=0,completed=0;
 for(const m of matches){if(m.scoreA===null||m.scoreB===null)continue;completed++;pa+=m.scoreA;pb+=m.scoreB;if(m.winner==='A')wa++;if(m.winner==='B')wb++;}
 const valid=stage2DuplicateAssignments(state).length===0;
 return {wA:wa,wB:wb,pA:pa,pB:pb,completed,total:matches.length,validLineups:valid,complete:valid&&matches.length>0&&completed===matches.length,winner:valid&&completed===matches.length&&matches.length?wa>wb?'A':'B':null};
}
function stage3Matches(state){if(!state.stage3)return [];return Array.isArray(state.stage3.matches)?state.stage3.matches:[state.stage3];}
function stage3Stats(state){const matches=stage3Matches(state);let wA=0,wB=0,pA=0,pB=0,completed=0;
 for(const m of matches){if(m.scoreA===null||m.scoreB===null)continue;completed++;pA+=m.scoreA;pB+=m.scoreB;if(m.winner==='A')wA++;if(m.winner==='B')wB++;}
 const valid=stage3DuplicateAssignments(state).length===0;
 const complete=valid&&matches.length>0&&completed===matches.length;
 return {wA,wB,pA,pB,completed,total:matches.length,complete,validLineups:valid,winner:complete?(wA>wB?'A':'B'):null};
}
function verdict(state){const s1=stage1Stats(state);if(!s1.complete)return {status:'stage1',points:{A:0,B:0}};
 let pA=s1.winner==='A'?1:s1.winner==='B'?0:.5,pB=1-pA;
 if(!state.stage2){if(state.stage3){const s3=stage3Stats(state);if(s3.complete){if(s3.winner==='A')pA+=1;else pB+=1;return {status:'champion',champion:s3.winner,decider:true,points:{A:pA,B:pB}};}return {status:'final-needed',points:{A:pA,B:pB}};}return {status:s1.winner?'stage1-champion':'stage1-draw',champion:s1.winner,points:{A:pA,B:pB}};}
 const s2=stage2Stats(state);if(!s2.complete)return {status:'stage2',points:{A:pA,B:pB}};
 pA+=s2.winner==='A'?1:0;pB+=s2.winner==='B'?1:0;
 if(pA!==pB)return {status:'champion',champion:pA>pB?'A':'B',points:{A:pA,B:pB}};
 const s3=stage3Stats(state);if(s3.complete){if(s3.winner==='A')pA+=1;else pB+=1;return {status:'champion',champion:s3.winner,decider:true,points:{A:pA,B:pB}};}
 return {status:'final-needed',points:{A:pA,B:pB}};
}
function roster(n,club){return Array.from({length:n},(_,i)=>({id:`${club}${i}`,name:'',players:[{id:`${club}${i}p1`,name:''},{id:`${club}${i}p2`,name:''}]}));}
function newState(){return {version:1,stage:'setup',setup:{sessionName:'',date:'',clubs:{A:'',B:''},pairs:8,courts:5,format:'total5',teamColors:{A:'#77b7ec',B:'#d9ac72'}},roster:{A:roster(8,'A'),B:roster(8,'B')},schedule:[],activeWave:0,arrival:{A:Array(8).fill(true),B:Array(8).fill(true)},sitOut:{A:Array(8).fill(false),B:Array(8).fill(false)},openingShuffle:0,stage2:null,stage3:null,finalized:false};}
function createMatches(state){const {pairs,courts,format}=state.setup;if(!checkSetup(pairs,courts,format))throw Error('Invalid event setup');if(!state.setup.clubs.A?.trim()||!state.setup.clubs.B?.trim())throw Error('Enter both team names');for(const c of ['A','B'])for(const p of state.roster[c])if(!p.players[0].name.trim()||!p.players[1].name.trim())throw Error('Enter every player name');
 // A round-robin fixture pool. Court numbers are live resources, NOT fixed match assignments.
 state.schedule=[generateSchedule(pairs,courts).flat().map(m=>({ ...m,court:null,wave:null,status:'pending',sequence:null,completedSequence:null }))];
 state.activeWave=0;state.dispatchSequence=0;state.stage='stage1';state.stage2=null;state.stage3=null;state.finalized=false;
 state.arrival={A:Array(pairs).fill(true),B:Array(pairs).fill(true)};state.sitOut={A:Array(pairs).fill(false),B:Array(pairs).fill(false)};state.openingShuffle=0;
 fillAvailableCourts(state);return state;}

/* Dynamic court dispatcher. A fixture is assigned when a physical court becomes free.
   While a fixture is active, neither of its pairs may be assigned anywhere else.
   Completed fixtures are never automatically replayed after a score correction. */
function matchPool(state){return (state.schedule||[]).flat();}
function liveCourts(state){return matchPool(state).filter(m=>m.status==='active').sort((a,b)=>a.court-b.court);}
function pendingMatches(state){return matchPool(state).filter(m=>m.status==='pending');}
/* Read-only, tentative operator preview. Never reserves players, courts or match IDs.
   Five rows are shown whenever five pending matches exist; actual dispatch
   remains determined only when an individual court becomes available. */
function previewNextMatches(state,limit=5){
 if(state.stage!=='stage1')return [];
 const all=matchPool(state),pending=pendingMatches(state),live=liveCourts(state);
 const busyA=new Set(live.map(m=>m.a)),busyB=new Set(live.map(m=>m.b));
 const playedA=Array(state.setup.pairs).fill(0),playedB=Array(state.setup.pairs).fill(0);
 const lastA=Array(state.setup.pairs).fill(-1000),lastB=Array(state.setup.pairs).fill(-1000);
 for(const m of all){if(m.status==='pending')continue;
   playedA[m.a]++;playedB[m.b]++;
   const seq=m.completedSequence??m.sequence??0;
   lastA[m.a]=Math.max(lastA[m.a],seq);lastB[m.b]=Math.max(lastB[m.b],seq);
 }
 const seq=(state.dispatchSequence||0)+1;
 const rating=m=>{
   const imbalance=Math.max(playedA[m.a],playedB[m.b]);
   const sum=playedA[m.a]+playedB[m.b];
   const gapA=seq-lastA[m.a],gapB=seq-lastB[m.b];
   const turnaround=(gapA<=state.setup.courts?1:0)+(gapB<=state.setup.courts?1:0);
   return imbalance*10000+sum*400+turnaround*75-Math.min(30,gapA+gapB);
 };
 const takenA=new Set(),takenB=new Set(),remaining=pending.filter(m=>isEligible(state,m)),chosen=[];
 const count=Math.min(Math.max(0,Math.floor(Number(limit)||0)),remaining.length);
 for(let i=0;i<count;i++){
   remaining.sort((a,b)=>{
     const readyA=busyA.has(a.a)||busyB.has(a.b)?1:0;
     const readyB=busyA.has(b.a)||busyB.has(b.b)?1:0;
     // Prefer useful distinct pair preparations, then the dispatch fairness order.
     const repeatedA=(takenA.has(a.a)?1:0)+(takenB.has(a.b)?1:0);
     const repeatedB=(takenA.has(b.a)?1:0)+(takenB.has(b.b)?1:0);
     return repeatedA-repeatedB||readyA-readyB||rating(a)-rating(b)||a.a-b.a||a.b-b.b;
   });
   const m=remaining.shift();takenA.add(m.a);takenB.add(m.b);
   chosen.push({id:m.id,a:m.a,b:m.b,ready:!busyA.has(m.a)&&!busyB.has(m.b)});
 }
 return chosen;
}
/* Opening arrival / reshuffle: preserve the complete n×n fixture pool, and only
   reassign unscored courts. Check-in can continue later as teams arrive. */
function ensureArrival(state){
 const n=state.setup.pairs;
 if(!state.arrival||typeof state.arrival!=='object')state.arrival={};
 for(const c of ['A','B']){
   if(!Array.isArray(state.arrival[c]))state.arrival[c]=Array(n).fill(true);
   else state.arrival[c]=Array.from({length:n},(_,i)=>state.arrival[c][i]!==false);
 }
 if(!Number.isInteger(state.openingShuffle)||state.openingShuffle<0)state.openingShuffle=0;
 return state.arrival;
}
/* Stage 1 Sit Out: optional in old backups; distinct from Not Arrived. */
function ensureSitOut(state){
 const n=state.setup.pairs;
 if(!state.sitOut||typeof state.sitOut!=='object')state.sitOut={};
 for(const c of ['A','B']){
  const old=Array.isArray(state.sitOut[c])?state.sitOut[c]:[];
  state.sitOut[c]=Array.from({length:n},(_,i)=>old[i]===true);
 }
 return state.sitOut;
}
function pairIsSitOut(state,club,index){return ensureSitOut(state)[club]?.[index]===true;}
function hasOpeningScore(state){return matchPool(state).some(m=>m.status==='completed'||m.scoreA!==null||m.scoreB!==null);}
function isArrived(state,m){const a=ensureArrival(state);return a.A[m.a]!==false&&a.B[m.b]!==false;}
function isEligible(state,m){return isArrived(state,m)&&!pairIsSitOut(state,'A',m.a)&&!pairIsSitOut(state,'B',m.b);}
function seededDrawRank(a,b,seed){
 let x=(Math.imul(a+1,0x9e3779b9)^Math.imul(b+1,0x85ebca6b)^Math.imul(seed,0xc2b2ae35))|0;
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0;
}
function reshuffleOpening(state,increment=true){
 if(state.stage!=='stage1'||state.stage2||hasOpeningScore(state))throw Error('Reshuffle is available only before the first Round 1 result');
 ensureArrival(state);
 const readyA=state.arrival.A.filter((v,i)=>v&&!pairIsSitOut(state,'A',i)).length,readyB=state.arrival.B.filter((v,i)=>v&&!pairIsSitOut(state,'B',i)).length;
 if(increment&&(readyA<1||readyB<1))throw Error('Mark at least one pair from each team Ready before reshuffling');
 const before=liveCourts(state).map(m=>m.id).join('|');
 const all=matchPool(state);
 for(const m of all){if(m.status==='active'){m.status='pending';m.court=null;m.wave=null;m.sequence=null;m.completedSequence=null;}}
 state.dispatchSequence=0;state.activeWave=0;
 if(increment)state.openingShuffle++;
 fillAvailableCourts(state);
 // With multiple eligible fixtures, try a few distinct deterministic draw seeds
 // so an explicit Reshuffle usually yields an actually different opening.
 if(increment&&readyA*readyB>Math.min(state.setup.courts,readyA,readyB)){
   for(let tries=0;tries<10&&liveCourts(state).map(m=>m.id).join('|')===before;tries++){
     for(const m of liveCourts(state)){m.status='pending';m.court=null;m.sequence=null;m.completedSequence=null;}
     state.dispatchSequence=0;state.openingShuffle++;fillAvailableCourts(state);
   }
 }
 return liveCourts(state);
}
function setPairSitOut(state,club,index,sitOut){
 if(state.stage!=='stage1'||state.stage2||!['A','B'].includes(club)||!Number.isInteger(index)||index<0||index>=state.setup.pairs||typeof sitOut!=='boolean')throw Error('Sit Out is available only for registered pairs in Stage 1');
 ensureSitOut(state)[club][index]=sitOut;
 // Active games are preserved; only future court assignments are filtered.
 const activeMatch=liveCourts(state).some(m=>m[club==='A'?'a':'b']===index);
 fillAvailableCourts(state);
 return {sitOut,activeMatch};
}
function toggleArrival(state,club,index){
 if(state.stage!=='stage1'||!['A','B'].includes(club)||!Number.isInteger(index)||index<0||index>=state.setup.pairs)throw Error('Invalid arrival selection');
 ensureArrival(state);
 const next=state.arrival[club][index]===false;
 if(!next&&hasOpeningScore(state)&&liveCourts(state).some(m=>m[club==='A'?'a':'b']===index))
   throw Error('Finish the active court match before marking this pair Not Arrived');
 state.arrival[club][index]=next;
 if(!hasOpeningScore(state))reshuffleOpening(state,false);
 else fillAvailableCourts(state);
 return next;
}
/* v0.8.49 · Recovery-first, history-aware court dispatch.
   Never reorders completed fixtures, never moves an active court, never waits for
   all active courts. Each assignment selects a maximum-cardinality matching
   among ready pairs, then optimizes match equity and recovery as soft targets.
   The team-showdown Stage 1 remains n×n cross-club round robin. */
function dispatchMatching(state,freeCount,busyA,busyB){
 const n=state.setup.pairs,courts=state.setup.courts,all=matchPool(state);
 const done=all.filter(m=>m.status!=='pending');
 const counts={A:Array(n).fill(0),B:Array(n).fill(0)};
 const last={A:Array(n).fill(-10000),B:Array(n).fill(-10000)};
 const prior={A:Array.from({length:n},()=>[]),B:Array.from({length:n},()=>[])};
 for(const m of done){
   counts.A[m.a]++;counts.B[m.b]++;
   const seq=Number.isInteger(m.sequence)?m.sequence:0;
   last.A[m.a]=Math.max(last.A[m.a],seq);last.B[m.b]=Math.max(last.B[m.b],seq);
   prior.A[m.a].push(seq);prior.B[m.b].push(seq);
 }
 const current=(state.dispatchSequence||0)+1,remaining={A:Array(n).fill(0),B:Array(n).fill(0)};
 const pending=pendingMatches(state).filter(m=>isEligible(state,m)&&!busyA.has(m.a)&&!busyB.has(m.b));
 for(const m of pending){remaining.A[m.a]++;remaining.B[m.b]++;}
 const minA=Math.min(...counts.A),minB=Math.min(...counts.B);
 function burden(side,index){
   const played=counts[side][index],gap=current-last[side][index];
   const rec=prior[side][index].filter(x=>x>0).sort((x,y)=>y-x);
   // Counts dominate. A recently deployed pair should recover if an
   // equally eligible pair has waited. Delayed fixtures are not discarded.
   let cost=(played-(side==='A'?minA:minB))*850;
   cost+=gap<=courts?210:gap<=courts*2?50:0;
   if(rec.length>=2&&rec[0]>=current-courts&&rec[1]>=current-2*courts)cost+=260;
   // Avoid starving a pair when it has very few opponents remaining.
   cost-=Math.min(65,Math.max(0,gap-courts*2)*6);
   cost-=Math.min(20,20/Math.max(1,remaining[side][index]));
   return cost;
 }
 // Deterministic, saved-seed tie-break to preserve Round 1 reshuffle behavior.
 const order=pending.map(m=>({m,cost:burden('A',m.a)+burden('B',m.b)+
   seededDrawRank(m.a,m.b,Math.max(1,state.openingShuffle||0))%997/997}));
 const choices=Array.from({length:n},()=>[]);
 for(const entry of order)choices[entry.m.a].push(entry);
 for(const entries of choices)entries.sort((x,y)=>x.cost-y.cost);
 // n<=10: subset DP finds maximum number of simultaneous usable courts.
 // Greedy selection can unnecessarily leave courts idle at roster constraints.
 let dp=new Map([[0,{cost:0,edges:[],count:0}]]);
 for(let a=0;a<n;a++){
   const next=new Map(dp); // Skipping this A pair is allowed.
   for(const [mask,v] of dp){
     if(v.count>=freeCount)continue;
     for(const e of choices[a]){
       const bit=1<<e.m.b;if(mask&bit)continue;
       const newMask=mask|bit,newCount=v.count+1,newCost=v.cost+e.cost;
       const old=next.get(newMask);
       if(!old||newCount>old.count||(newCount===old.count&&newCost<old.cost))
         next.set(newMask,{cost:newCost,count:newCount,edges:[...v.edges,e.m]});
     }
   }
   dp=next;
 }
 let best={count:0,cost:Infinity,edges:[]};
 for(const v of dp.values())if(v.count>best.count||(v.count===best.count&&v.cost<best.cost))best=v;
 return best.edges;
}
function fillAvailableCourts(state){
 if(state.stage!=='stage1')return [];
 ensureArrival(state);
 const live=liveCourts(state),busyA=new Set(live.map(m=>m.a)),busyB=new Set(live.map(m=>m.b));
 const free=Array.from({length:state.setup.courts},(_,i)=>i+1).filter(c=>!live.some(m=>m.court===c));
 if(!free.length)return [];
 const chosen=dispatchMatching(state,free.length,busyA,busyB),assigned=[];
 for(let i=0;i<chosen.length;i++){
   const m=chosen[i];m.court=free[i];m.wave=null;m.status='active';m.sequence=++state.dispatchSequence;
   assigned.push(m);
 }
 return assigned;
}
function assignCourtResult(state,matchId,a,b){
 const m=matchPool(state).find(m=>m.id===matchId);
 if(!m||m.status!=='active')throw Error('Only a live court match can be completed');
 const sc=validateScore(state.setup.format,a,b,false);
 Object.assign(m,{scoreA:sc.a,scoreB:sc.b,winner:sc.winner,status:'completed',completedSequence:++state.dispatchSequence});
 state.stage3=null;state.finalized=false;
 const assigned=fillAvailableCourts(state);
 return {saved:m,assigned};
}
function amendCourtResult(state,matchId,a,b){
 const m=matchPool(state).find(m=>m.id===matchId);
 if(!m||m.status!=='completed')throw Error('Recorded match not found');
 const sc=validateScore(state.setup.format,a,b,false);
 Object.assign(m,{scoreA:sc.a,scoreB:sc.b,winner:sc.winner});
 state.stage3=null;state.finalized=false;
 return sc;
}
function courtStatus(state){const all=matchPool(state);return {
 live:liveCourts(state),pending:pendingMatches(state),completed:all.filter(m=>m.status==='completed'),
 idleCourts:Array.from({length:state.setup.courts},(_,i)=>i+1).filter(c=>!liveCourts(state).some(m=>m.court===c)),
 total:all.length
};}
function isValidLineup(state,club,ids){const all=state.roster[club].flatMap(p=>p.players.map(q=>q.id));return Array.isArray(ids)&&ids.length===2&&ids[0]!==ids[1]&&ids.every(id=>all.includes(id));}
function setStage1Result(state,matchId,a,b,tieWinner=null){const m=state.schedule.flat().find(m=>m.id===matchId);if(!m)throw Error('Match not found');const sc=validateScore(state.setup.format,a,b,false,tieWinner);const changed=m.scoreA!==sc.a||m.scoreB!==sc.b||m.winner!==sc.winner;Object.assign(m,{scoreA:sc.a,scoreB:sc.b,winner:sc.winner});if(changed){state.stage3=null;state.finalized=false;}return sc;}
function makeStage2(state,count,format=state.setup.format){if(!stage1Stats(state).complete)throw Error('Finish all Stage 1 matches first');if(!allowedDuels(state.setup.pairs).includes(count))throw Error('Stage 2 must have an odd number of matches, capped by registered pairs');if(!formats.includes(format))throw Error('Invalid format');state.stage2={format,matches:Array.from({length:count},(_,i)=>({id:`duel-${i+1}`,court:i%state.setup.courts+1,wave:Math.floor(i/state.setup.courts)+1,playersA:['',''],playersB:['',''],scoreA:null,scoreB:null,winner:null}))};state.stage='stage2';state.finalized=false;return state.stage2;}
// Stage 2 one-appearance policy: ALL duels reserve players, including later waves.
function stage2AssignedPlayers(state,exceptId=null){
 const assigned={A:new Map(),B:new Map()};
 for(const match of state.stage2?.matches||[]){
  if(match.id===exceptId)continue;
  for(const c of ['A','B'])for(const id of match[`players${c}`]||[]){if(id&&!assigned[c].has(id))assigned[c].set(id,match.id);}
 }
 return assigned;
}
function assertStage2DuelAvailable(state,duelId,idsA,idsB){
 const used=stage2AssignedPlayers(state,duelId);
 for(const [c,ids] of [['A',idsA],['B',idsB]])for(const playerId of ids){
  const duel=used[c].get(playerId);
  if(duel){
   const player=state.roster[c].flatMap(p=>p.players).find(p=>p.id===playerId);
   throw Error(`${player?.name||'Player'} (${state.setup.clubs[c]||`Team ${c}`}) is already assigned to Duel ${duel.split('-').pop()}. Each player can play only once in Stage 2.`);
  }
 }
 return true;
}
function stage2DuplicateAssignments(state){
 const seen={A:new Map(),B:new Map()},conflicts=[];
 for(const m of state.stage2?.matches||[])for(const c of ['A','B'])for(const id of m[`players${c}`]||[]){
  if(!id)continue;
  if(seen[c].has(id))conflicts.push({club:c,playerId:id,first:seen[c].get(id),second:m.id});
  else seen[c].set(id,m.id);
 }
 return conflicts;
}
function clearDuelLineup(state,id){
 const m=state.stage2?.matches.find(m=>m.id===id);if(!m)throw Error('Duel not found');
 Object.assign(m,{playersA:['',''],playersB:['',''],scoreA:null,scoreB:null,winner:null});
 state.stage3=null;state.finalized=false;return m;
}
function setDuelLineup(state,id,idsA,idsB){const m=state.stage2?.matches.find(m=>m.id===id);if(!m)throw Error('Duel not found');if(!isValidLineup(state,'A',idsA)||!isValidLineup(state,'B',idsB))throw Error('Choose two distinct registered players from each team');
 assertStage2DuelAvailable(state,id,idsA,idsB);
 const unchanged=idsA.every((id,i)=>m.playersA[i]===id)&&idsB.every((id,i)=>m.playersB[i]===id);
 if(unchanged)return m;
 m.playersA=idsA.slice();m.playersB=idsB.slice();m.scoreA=null;m.scoreB=null;m.winner=null;state.stage3=null;state.finalized=false;return m;}
function setDuelScore(state,id,a,b,tieWinner=null){const m=state.stage2?.matches.find(m=>m.id===id);if(!m)throw Error('Duel not found');if(!isValidLineup(state,'A',m.playersA)||!isValidLineup(state,'B',m.playersB))throw Error('Complete the lineup first');assertStage2DuelAvailable(state,id,m.playersA,m.playersB);const sc=validateScore(state.stage2.format,a,b,true,tieWinner);const changed=m.scoreA!==sc.a||m.scoreB!==sc.b||m.winner!==sc.winner;Object.assign(m,{scoreA:sc.a,scoreB:sc.b,winner:sc.winner});if(changed){state.stage3=null;state.finalized=false;}return sc;}
function stage3AssignedPlayers(state,exceptId=null){const used={A:new Map(),B:new Map()};for(const m of stage3Matches(state)){
 if(m.id===exceptId)continue;for(const c of ['A','B'])for(const id of m[`players${c}`]||[])if(id&&!used[c].has(id))used[c].set(id,m.id);
 }return used;}
function stage3DuplicateAssignments(state){const used={A:new Set(),B:new Set()},collisions=[];for(const m of stage3Matches(state))for(const c of ['A','B'])for(const id of m[`players${c}`]||[]){if(!id)continue;if(used[c].has(id))collisions.push({club:c,playerId:id,duel:m.id});else used[c].add(id);}return collisions;}
function stage3Match(state,id){return stage3Matches(state).find(m=>m.id===id)||null;}
function startFinal(state,format=state.setup.format,count=1){
 if(verdict(state).status!=='final-needed'&&verdict(state).status!=='stage1-draw')throw Error('The Decider is available only when the series is tied');
 if(!formats.includes(format)||!allowedDuels(state.setup.pairs).includes(count))throw Error('Choose an odd number of duels and valid match format');
 state.stage3={format,matches:Array.from({length:count},(_,i)=>({id:`final-${i+1}`,court:i%state.setup.courts+1,wave:Math.floor(i/state.setup.courts)+1,playersA:['',''],playersB:['',''],scoreA:null,scoreB:null,winner:null}))};
 state.stage='stage3';state.finalized=false;return state.stage3;
}
function setFinalLineup(state,idsA,idsB,id='final-1'){
 const m=stage3Match(state,id);if(!m)throw Error('Decider match not found');
 if(!isValidLineup(state,'A',idsA)||!isValidLineup(state,'B',idsB))throw Error('Select two different registered players from each team');
 const assigned=stage3AssignedPlayers(state,m.id);
 for(const c of ['A','B'])for(const pid of (c==='A'?idsA:idsB))if(assigned[c].has(pid))throw Error('A player can take part in only one duel per stage');
 const changed=idsA.some((v,i)=>v!==m.playersA[i])||idsB.some((v,i)=>v!==m.playersB[i]);
 if(changed)Object.assign(m,{playersA:idsA.slice(),playersB:idsB.slice(),scoreA:null,scoreB:null,winner:null});return m;
}
function clearFinalLineup(state,id){const m=stage3Match(state,id);if(!m)throw Error('Decider match not found');Object.assign(m,{playersA:['',''],playersB:['',''],scoreA:null,scoreB:null,winner:null});state.finalized=false;return m;}
function setFinalScore(state,a,b,tieWinner=null,id='final-1'){
 const m=stage3Match(state,id);if(!m||!isValidLineup(state,'A',m.playersA)||!isValidLineup(state,'B',m.playersB))throw Error('Complete decider lineup first');
 const assigned=stage3AssignedPlayers(state,m.id);for(const c of ['A','B'])for(const pid of m[`players${c}`])if(assigned[c].has(pid))throw Error('A player can take part in only one duel per stage');
 const sc=validateScore(state.stage3.format,a,b,true,tieWinner);Object.assign(m,{scoreA:sc.a,scoreB:sc.b,winner:sc.winner});return sc;
}
function migrateLegacySchedule(state){
 if(!Array.isArray(state.schedule)||!state.schedule.length||!state.schedule.flat().some(m=>!m.status))return state;
 const matches=state.schedule.flat();let seq=0;
 for(const m of matches){
   if(m.status)continue;
   const recorded=m.scoreA!==null&&m.scoreB!==null;
   m.status=recorded?'completed':'pending';
   if(recorded){m.sequence=++seq;m.completedSequence=seq;}else {m.court=null;m.sequence=null;m.completedSequence=null;}
   m.wave=null;
 }
 state.schedule=[matches];state.dispatchSequence=seq;state.activeWave=0;
 if(state.stage==='stage1')fillAvailableCourts(state);
 return state;
}
function validateSavedState(s){
 if(!s||s.version!==1||typeof s.stage!=='string'||!['setup','stage1','stage2choice','stage2','stage3choice','stage3','finished'].includes(s.stage))return false;
 const t=s.setup;if(!t||!t.clubs||typeof t.clubs.A!=='string'||typeof t.clubs.B!=='string'||typeof t.date!=='string'||!(checkSetup(t.pairs,t.courts,t.format)||(s.stage==='setup'&&t.format===''&&Number.isInteger(t.pairs)&&t.pairs>=1&&t.pairs<=MAX_PAIRS&&Number.isInteger(t.courts)&&t.courts>=1&&t.courts<=MAX_COURTS&&Array.isArray(s.schedule)&&s.schedule.length===0)))return false;
 if(t.teamColors!==undefined&&(!t.teamColors||!['A','B'].every(c=>typeof t.teamColors[c]==='string'&&/^#[0-9a-fA-F]{6}$/.test(t.teamColors[c]))))return false;
 if(!s.roster||!['A','B'].every(c=>Array.isArray(s.roster[c])&&s.roster[c].length===t.pairs&&s.roster[c].every(p=>Array.isArray(p.players)&&p.players.length===2&&p.players.every(x=>typeof x.id==='string'&&typeof x.name==='string'))))return false;
 if(s.sitOut!==undefined&&(!s.sitOut||!['A','B'].every(c=>Array.isArray(s.sitOut[c])&&s.sitOut[c].length===t.pairs&&s.sitOut[c].every(x=>typeof x==='boolean'))))return false;
 if(!Array.isArray(s.schedule)||s.schedule.length>t.pairs*t.pairs)return false;
 if(!Number.isInteger(s.activeWave)||s.activeWave<0||s.activeWave>Math.max(0,s.schedule.length-1))return false;
 const used=new Set(),onCourtA=new Set(),onCourtB=new Set(),courts=new Set();let count=0;
 for(const wave of s.schedule){if(!Array.isArray(wave))return false;for(const m of wave){
   if(!m||!Number.isInteger(m.a)||!Number.isInteger(m.b)||m.a<0||m.b<0||m.a>=t.pairs||m.b>=t.pairs)return false;
   const key=`${m.a}:${m.b}`;if(used.has(key))return false;used.add(key);count++;
   if(m.status){
     if(!['pending','active','completed'].includes(m.status))return false;
     if(m.status==='active'){
       if(!Number.isInteger(m.court)||m.court<1||m.court>t.courts||courts.has(m.court)||onCourtA.has(m.a)||onCourtB.has(m.b))return false;
       courts.add(m.court);onCourtA.add(m.a);onCourtB.add(m.b);
     }
     if(m.status==='pending'&&(m.scoreA!==null||m.scoreB!==null))return false;
     if(m.status==='completed'&&(m.scoreA===null||m.scoreB===null))return false;
   }else if(!Number.isInteger(m.court)||m.court<1||m.court>t.courts)return false;
   if(m.scoreA!==null||m.scoreB!==null){try{const v=validateScore(t.format,m.scoreA,m.scoreB);if(m.winner!==v.winner)return false;}catch(e){return false;}}
 }}
 if(s.schedule.length>0&&count!==t.pairs*t.pairs)return false;
 if(s.stage!=='setup'&&count!==t.pairs*t.pairs)return false;
 if(s.stage2!==null){if(!s.stage2||!formats.includes(s.stage2.format)||!Array.isArray(s.stage2.matches)||!allowedDuels(t.pairs).includes(s.stage2.matches.length))return false;}
 if(s.stage3!==null&&(!s.stage3||!formats.includes(s.stage3.format)||!allowedDuels(t.pairs).includes(stage3Matches(s).length)))return false;
 // v0.8.34 QA hardening: a restored backup must never bypass the scoring rules.
 // A saved lineup may be unfinished; saved RESULTS must always be legal and consistent.
 const checkRestoredDuels=(list,format)=>{
  for(const m of list){
   if(!m||typeof m.id!=='string'||!Array.isArray(m.playersA)||!Array.isArray(m.playersB)||m.playersA.length!==2||m.playersB.length!==2)return false;
   for(const c of ['A','B']){
    const ids=m[`players${c}`];
    const known=new Set(s.roster[c].flatMap(pair=>pair.players.map(player=>player.id)));
    if(ids.some(pid=>typeof pid!=='string'||(pid&&!known.has(pid))))return false;
    if(ids[0]&&ids[0]===ids[1])return false;
   }
   const absent=m.scoreA===null&&m.scoreB===null;
   if(absent){if(m.winner!==null)return false;continue;}
   if(m.scoreA===null||m.scoreB===null||m.playersA.some(pid=>!pid)||m.playersB.some(pid=>!pid))return false;
   try{const legal=validateScore(format,m.scoreA,m.scoreB,true,m.winner);if(legal.winner!==m.winner)return false;}catch(e){return false;}
  }
  return true;
 };
 if(s.stage2&&!checkRestoredDuels(s.stage2.matches,s.stage2.format))return false;
 if(s.stage3&&!checkRestoredDuels(stage3Matches(s),s.stage3.format))return false;
 return true;
}
return {MAX_PAIRS,MAX_COURTS,formats,fmt,ensureArrival,ensureSitOut,pairIsSitOut,setPairSitOut,toggleArrival,reshuffleOpening,hasOpeningScore,checkSetup,validateSavedState,generateSchedule,stage1Stats,stage2Stats,stage3Stats,stage3Matches,stage3AssignedPlayers,stage3DuplicateAssignments,stage3Match,verdict,allowedDuels,roster,newState,createMatches,matchPool,liveCourts,pendingMatches,courtStatus,fillAvailableCourts,previewNextMatches,assignCourtResult,amendCourtResult,migrateLegacySchedule,validateScore,scoreMatch,isValidLineup,setStage1Result,makeStage2,stage2AssignedPlayers,assertStage2DuelAvailable,stage2DuplicateAssignments,clearDuelLineup,setDuelLineup,setDuelScore,startFinal,setFinalLineup,setFinalScore,clearFinalLineup};
});

