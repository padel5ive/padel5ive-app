// A complete 8-vs-8 draw for three courts. Indices are independently shuffled
// for each club. Both sides use every partnership once, and each cross-club
// opponent encounter occurs once or twice. Each group is conflict-free.
const individualThreeCourtDraw = [
 [[0,5,3,7],[2,6,4,5],[3,4,0,1]],
 [[2,7,1,3],[0,3,4,6],[1,5,0,5]],
 [[4,6,3,6],[0,7,0,7],[3,5,2,4]],
 [[5,7,1,6],[2,4,2,7],[0,1,3,4]],
 [[1,6,1,7],[0,4,2,5],[2,5,0,6]],
 [[1,3,6,7],[6,7,0,4],[0,2,1,5]],
 [[4,5,4,7],[3,6,3,5],[1,2,2,6]],
 [[3,7,5,7],[0,6,0,2],[1,4,1,4]],
 [[4,7,5,6],[5,6,1,2],[2,3,0,3]],
 [[1,7,2,3]]
];

function individualBuildThreeCourtDraw(start, division, rnd) {
 const players = Array.from({length:8}, (_, i) => start + i);
 const sideA = individualShuffle(players.slice(), rnd);
 const sideB = individualShuffle(players.slice(), rnd);
 return individualThreeCourtDraw.flatMap((round, i) => round.map(([x,y,u,v]) => {
  const a = Math.min(sideA[x], sideA[y]), a2 = Math.max(sideA[x], sideA[y]);
  const b = Math.min(sideB[u], sideB[v]), b2 = Math.max(sideB[u], sideB[v]);
  return {id:`ia-${division}-${a}-${a2}`, a, a2, b, b2, division,
   court:null, wave:null, plannedRound:i+1, status:'pending', sequence:null,
   completedSequence:null, scoreA:null, scoreB:null, winner:null};
 }));
}

function individualOpponentPenalty(count) {
 if (count === 0) return 4;
 return count <= 2 ? 0 : 4 * (count - 2) ** 2;
}

function individualOpponentRotationChanges(fixtures, total) {
 const change = new Map();
 const add = (a, b, delta) => {
  const key = a * total + b;
  change.set(key, (change.get(key) || 0) + delta);
 };
 fixtures.forEach((match, i) => {
  const next = fixtures[(i + 1) % fixtures.length];
  for (const a of [match.a, match.a2]) {
   for (const b of [match.b, match.b2]) add(a, b, -1);
   for (const b of [next.b, next.b2]) add(a, b, 1);
  }
 });
 return change;
}

function individualRotateOpponentDuos(fixtures) {
 const duos = fixtures.map(match => [match.b, match.b2]);
 fixtures.forEach((match, i) => {
  [match.b, match.b2] = duos[(i + 1) % duos.length];
 });
}

function individualFindOpponentRotation(byDivision, total, globallyCounted, globallyPlayed, maxOriginal, ledger, courts) {
 let best=null;
 for(const {seg,a:readyA,b:readyB,pending:available} of byDivision){
  const ceiling=Math.max(2,maxOriginal.get(seg.id));
  for(const x of readyA)for(const y of readyB){
   if(x===y)continue;
   const tryRotation=fixtures=>{
    const change=individualOpponentRotationChanges(fixtures,total);
    let delta=0;
    for(const [key,v] of change)if(v){
     const a=Math.floor(key/total),b=key%total,previous=globallyCounted[a][b],next=previous+v;
     if(next<0||next>ceiling)return false;
     delta+=individualOpponentPenalty(next)-individualOpponentPenalty(previous);
    }
    if(delta>0)return false;
    let price=0;
    for(const a of [x.a,x.a2]){
     price+=ledger.counts.A[a]**2*500;
     for(const b of [y.b,y.b2]){
      const met=globallyPlayed[a][b];
      price+=met===0?0:met===1?24:met===2?1700:9000;
     }
    }
    for(const b of [y.b,y.b2])price+=ledger.counts.B[b]**2*500;
    if(!best||price<best.price)best={fixtures,change,price};
    return true;
   };
   // In the three-court draw, try one additional pending duo when a
   // two-fixture swap would break coverage or create a third encounter.
   if(!tryRotation([x,y])&&seg.count===8&&courts===3&&ceiling===2){
    for(const z of available)if(z!==x&&z!==y&&tryRotation([x,y,z]))break;
   }
  }
 }
 return best;
}
