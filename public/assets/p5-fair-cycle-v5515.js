/* PADEL 5IVE v5.5.15 — Fair-cycle Individual Americano schedule.
 * For n=6*c (c=1..5): exact 3-round checkpoints while the roster/courts remain fixed.
 * Construction: one-factorization of K_n; consecutive factors form Hamilton cycles;
 * each cycle is 3-edge-coloured, giving 3 disjoint rounds and 2 plays per player.
 * Historical scores, fixed-partner, structured and Mexicano engines are untouched.
 */
window.P5FairCycle=(function(){'use strict';
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function factors(n){const L=n-1,m=n/2;const out=[];
  for(let r=0;r<L;r++){const edges=[[L,r]];for(let k=1;k<m;k++)edges.push([((r+k)%L),((r-k+L)%L)]);out.push(edges);}return out;
 }
 function cycleFrom(a,b,n){const adj=Array.from({length:n},()=>[]);
  for(const [x,y] of [...a,...b]){adj[x].push(y);adj[y].push(x);}
  if(adj.some(p=>p.length!==2))throw Error('Invalid fair-cycle pairing');
  const cycle=[n-1],used=new Set([n-1]);let prev=-1,cur=n-1;
  while(true){const next=adj[cur][0]===prev?adj[cur][1]:adj[cur][0];if(next===n-1)break;
   if(used.has(next))throw Error('Fair-cycle premature closure');cycle.push(next);used.add(next);prev=cur;cur=next;
  }
  if(cycle.length!==n)throw Error('Fair-cycle incomplete');
  const colors=[[],[],[]];for(let i=0;i<n;i++)colors[i%3].push([cycle[i],cycle[(i+1)%n]]);
  return colors;
 }
 const PERMS=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 function pattern(colors,perm,n){return perm.map(c=>{const s=new Set();for(const a of colors[c]){s.add(a[0]);s.add(a[1]);}return s;});}
 function boundary(prev,next,n){let rest2=0,play3=0;
  if(!prev)return 0;
  for(let i=0;i<n;i++){
   const a=prev[1].has(i),b=prev[2].has(i),c=next[0].has(i),d=next[1].has(i);
   if(!b&&!c)rest2++;
   if((a&&b&&c)||(b&&c&&d))play3++;
  }
  return rest2*120+play3*65;
 }
 function orderCycles(cycles,n,r){const k=cycles.length;if(k===1)return [{idx:0,perm:0}];
  // Randomized multistart greedy plus bounded swap/phase refinement.
  let best=null,bestScore=Infinity;
  const pats=cycles.map(c=>PERMS.map(p=>pattern(c,p,n)));
  const cost=seq=>seq.reduce((s,x,i)=>s+(i?boundary(pats[seq[i-1].idx][seq[i-1].perm],pats[x.idx][x.perm],n):0),0);
  for(let trial=0;trial<5;trial++){
   const remaining=shuffle(Array.from({length:k},(_,i)=>i),r);const start=remaining.shift();let seq=[{idx:start,perm:Math.floor(r()*6)}];
   while(remaining.length){let option=null,score=Infinity;for(const idx of remaining)for(let perm=0;perm<6;perm++){
    const val=boundary(pats[seq.at(-1).idx][seq.at(-1).perm],pats[idx][perm],n)+r()*2;
    if(val<score){score=val;option={idx,perm};}}
    remaining.splice(remaining.indexOf(option.idx),1);seq.push(option);
   }
   let cst=cost(seq);
   for(let t=0;t<1250;t++){const a=Math.floor(r()*k),b=Math.floor(r()*k);
    const candidate=seq.slice();if(r()<.6){[candidate[a],candidate[b]]=[candidate[b],candidate[a]];}
    else candidate[a]={idx:candidate[a].idx,perm:Math.floor(r()*6)};
    const v=cost(candidate);if(v<cst||(v===cst&&r()<.015)){seq=candidate;cst=v;}
   }
   if(cst<bestScore){bestScore=cst;best=seq;}
  }
  return best;
 }
 function pairEdges(edges,opp,r){const n=edges.length,cache=new Map(),full=(1<<n)-1;
  function cost(i,j){let val=0;for(const x of edges[i])for(const y of edges[j]){const t=opp.get(key(x,y))||0;val+=2*t+1+4*Math.max(0,t-1);}return val;}
  function dp(mask){if(!mask)return {cost:0,pairs:[]};if(cache.has(mask))return cache.get(mask);
   const bit=mask&-mask,i=Math.log2(bit)|0;let best=null;
   for(let j=i+1;j<n;j++)if(mask&(1<<j)){
    const z=dp(mask^bit^(1<<j)),score=z.cost+cost(i,j)+r()*.00001;
    if(!best||score<best.cost)best={cost:score,pairs:[[i,j],...z.pairs]};
   }
   cache.set(mask,best);return best;
  }
  const sol=dp(full).pairs.map(([i,j])=>[edges[i],edges[j]]);
  for(const teams of sol)for(const x of teams[0])for(const y of teams[1])opp.set(key(x,y),(opp.get(key(x,y))||0)+1);
  return sol;
 }
 function build(ids,courts,random){const n=ids.length;
  if(n%6!==0||courts!==n/6||courts<1||courts>5)throw Error('Fair-cycle requires 6 players/court');
  const r=typeof random==='function'?random:Math.random;
  const perms=shuffle(ids,r),fac=factors(n),cycles=[];
  for(let i=0;i<fac.length-1;i+=2)cycles.push(cycleFrom(fac[i],fac[i+1],n));
  const order=orderCycles(cycles,n,r),opp=new Map(),out=[];
  for(const {idx,perm} of order){for(const c of PERMS[perm]){
   const edges=cycles[idx][c].map(e=>e.map(x=>perms[x]));
   out.push(pairEdges(edges,opp,r));
  }}
  const remaining=fac.at(-1).map(e=>e.map(x=>perms[x]));
  // Final matching accounts for all previously unplayed partnerships. If n/2 is
  // odd, exactly one repeated partnership is mathematically necessary.
  const tries=Math.min(240,n<=18?180:240);let best=null,bestCost=Infinity;
  for(let t=0;t<tries;t++){
   const s=shuffle(remaining,r),first=s.slice(0,2*courts),last=s.slice(2*courts);
   const used=first.flat(),extras=n/2%2?[[used[Math.floor(r()*used.length)],null]]:[];
   if(extras.length){const a=extras[0][0],others=used.filter(x=>x!==a);extras[0][1]=others[Math.floor(r()*others.length)];}
   const fst=first.slice(),lst=last.concat(extras);
   const score=(function(){const prev=out.slice(-2).map(row=>new Set(row.flat(2)));
    const roundA=new Set(first.flat()),roundB=new Set(lst.flat());let z=0;
    for(const id of ids){if(!prev[1].has(id)&&!roundA.has(id))z+=120;if(prev[0].has(id)&&prev[1].has(id)&&roundA.has(id))z+=65;if(prev[1].has(id)&&roundA.has(id)&&roundB.has(id))z+=65;}
    if(new Set(lst.flat()).size!==lst.flat().length)return 1e7;
    // Prefer not to duplicate a partnership from the immediately preceding block.
    if(extras.length&&out.slice(-3).some(row=>row.some(m=>m.some(team=>team.includes(extras[0][0])&&team.includes(extras[0][1])))))z+=250;
    return z;
   })();
   if(score<bestCost){bestCost=score;best=[fst,lst];}
  }
  if(!best)throw Error('Fair-cycle final pairing unavailable');
  for(const edges of best)out.push(pairEdges(edges,opp,r));
  const rows=out.map((matches,i)=>({index:i,matches:matches.map((teams,j)=>({id:'R'+i+'C'+j,court:j+1,teams,confirmed:false,score:null}))}));
  // Strict preflight: every partner pair exactly once, except the one repeat
  // mathematically unavoidable when C(n,2) is odd. Check every 3-round block.
  const seen=new Map(),cnt=Object.fromEntries(ids.map(id=>[id,0]));let maxGap=0;
  for(let i=0;i<rows.length;i++){
   const active=new Set();for(const m of rows[i].matches){for(const team of m.teams){
    for(const id of team){if(active.has(id))throw Error('Fair-cycle double-booked player');active.add(id);}
    const k=key(team[0],team[1]);seen.set(k,(seen.get(k)||0)+1);
   }}
   for(const id of active)cnt[id]++;
   const values=Object.values(cnt),gap=Math.max(...values)-Math.min(...values);
   maxGap=Math.max(maxGap,gap);
   if(i<cycles.length*3&&((i+1)%3===0&&gap!==0||gap>1))throw Error('Fair-cycle checkpoint failed at round '+(i+1)+': gap '+gap);
  }
  if(seen.size!==n*(n-1)/2||[...seen.values()].filter(x=>x>1).length!==(n/2%2))throw Error('Fair-cycle partner coverage failed');
  if(maxGap>1)throw Error('Fair-cycle running gap exceeds 1');
  return rows;
 }
 return Object.freeze({build,version:'5.5.15'});
})();
