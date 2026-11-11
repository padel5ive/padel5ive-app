/* PADEL 5IVE — Structured Americano fair-cycle laboratory (non-production).
 * Opt-in for balanced, unchanged cross-group rosters with 3 active players per court.
 * Does not replace confirmed matches, original irregular-roster recovery, or Mexicano.
 */
(function (root) {
  'use strict';
  const previous = root.P5Structured;
  if (!previous || !root.P5Fair532) throw Error('P5Structured and P5Fair532 must load first');
  const pair = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
  const shuff = (a, r) => { a = a.slice(); for (let i=a.length-1; i>0; i--) {const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
  const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  function cycle(A, B, shift) {
    const n=A.length, adjacent=Array.from({length:2*n},()=>[]);
    for (let i=0;i<n;i++) for (const j of [(i+shift)%n,(i+shift+1)%n]) {
      const u=i,v=n+j; adjacent[u].push(v); adjacent[v].push(u);
    }
    const colors=[[],[],[]]; let cur=0,prev=-1; const seen=new Set([0]);
    for (let step=0;step<2*n;step++) {
      const next=adjacent[cur][0]===prev?adjacent[cur][1]:adjacent[cur][0];
      if (next===undefined)throw Error('Incomplete bipartite Hamilton cycle');
      const ai=cur<n?cur:next,bi=cur>=n?cur-n:next-n;
      colors[step%3].push([A[ai],B[bi]]);
      prev=cur;cur=next;
      if (step<2*n-1) {if(seen.has(cur))throw Error('Premature cycle closure'); seen.add(cur);}
      else if(cur!==0)throw Error('Cycle did not close');
    }
    if (seen.size!==2*n)throw Error('Incomplete 2n cycle');
    return colors;
  }
  function matchTeams(teams, opp, fixture, random) {
    const n=teams.length, sig=(a,b)=>[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
    const memo=new Map();
    function rec(mask){if(!mask)return {score:0,matches:[]};if(memo.has(mask))return memo.get(mask);
      const i=31-Math.clz32(mask&-mask); let best=null;
      for(let j=i+1;j<n;j++)if(mask&(1<<j)){
        let score=0;for(const a of teams[i])for(const b of teams[j]){const v=opp.get(pair(a,b))||0;score+=v?40+v*20:0;}
        score+=(fixture.get(sig(teams[i],teams[j]))||0)*600;
        const other=rec(mask^(1<<i)^(1<<j));score+=other.score+random()*.01;
        if(!best||score<best.score)best={score,matches:[[teams[i],teams[j]],...other.matches]};
      }
      memo.set(mask,best);return best;
    }
    return rec((1<<n)-1).matches;
  }
  const history=()=>({opp:new Map(),fixture:new Map()});
  function register(h, matches) {
    for(const teams of matches){
      const [a,b]=teams;
      const sig=[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
      h.fixture.set(sig,(h.fixture.get(sig)||0)+1);
      for(const x of a)for(const y of b)h.opp.set(pair(x,y),(h.opp.get(pair(x,y))||0)+1);
    }
  }
  function buildCandidate(A,B,cap,rng) {
    const n=A.length,c=shuff(Array.from({length:Math.floor(n/2)},(_,i)=>i*2),rng),h=history(),rounds=[];
    const rec=Object.fromEntries(A.concat(B).map(id=>[id,[]]));
    let opponentRepeats=0,fixtureRepeats=0,rest2=0,triple=0,longest=0;
    function scoreRound(teams,record=true){
      const playing=new Set(teams.flat());let rr=0,tt=0;
      for(const id of A.concat(B)){
        const h=rec[id],on=playing.has(id),p=h.at(-1),pp=h.at(-2);
        if(!on&&p===false)rr++;
        if(on&&p===true&&pp===true)tt++;
      }
      return {rr,tt};
    }
    function append(teams) {
      if(teams.length%2)throw Error('Unpaired teams');
      const current=matchTeams(teams,h.opp,h.fixture,rng);
      for(const m of current){let [a,b]=m;
        const sig=[a.slice().sort((x,y)=>x-y).join(':'),b.slice().sort((x,y)=>x-y).join(':')].sort().join('|');
        if(h.fixture.has(sig))fixtureRepeats++;
        for(const x of a)for(const y of b)if(h.opp.has(pair(x,y)))opponentRepeats++;
      }
      register(h,current);
      const set=new Set(current.flat(2));if(set.size!==current.length*4)throw Error('Double-booking');
      for(const id of A.concat(B)){
        const seq=rec[id],on=set.has(id),p=seq.at(-1),pp=seq.at(-2);
        if(!on&&p===false)rest2++;
        if(on&&p===true&&pp===true)triple++;
        seq.push(on);
        let st=0;for(let z=seq.length-1;z>=0&&seq[z];z--)st++;longest=Math.max(longest,st);
      }
      rounds.push(current);
    }
    for(const k of c){const colors=cycle(A,B,k);let choice=null;
      for(const perm of shuff(perms,rng)) {
        const active=perm.map(p=>colors[p].flat());
        let z=0,temporary=Object.fromEntries(A.concat(B).map(id=>[id,rec[id].slice(-2)]));
        for(const xs of active){const play=new Set(xs.flat());
          for(const id of A.concat(B)){
            const a=temporary[id],on=play.has(id);
            if(!on&&a.at(-1)===false)z+=2000;
            if(on&&a.at(-1)===true&&a.at(-2)===true)z+=1250;
            a.push(on);
          }
        }
        if(!choice||z<choice.z)choice={perm,z};
      }
      for(const k of choice.perm)append(colors[k]);
    }
    if(n%2){
      // One last perfect matching remains. Add one deliberate partnership repeat
      // so both final rounds consist exclusively of full doubles matches.
      const final=Array.from({length:n},(_,i)=>[A[i],B[(i+n-1)%n]]);
      let best=null;
      for(let trial=0;trial<300;trial++){
        const chosen=shuff(final,rng),first=chosen.slice(0,2*cap),rem=chosen.slice(2*cap);
        const aa=first[Math.floor(rng()*first.length)][0],bb=first[Math.floor(rng()*first.length)][1];
        if(first.some(t=>t[0]===aa&&t[1]===bb))continue; // must be an old cross-partner edge, not a fresh final matching
        const second=rem.concat([[aa,bb]]), tmp=Object.fromEntries(A.concat(B).map(id=>[id,rec[id].slice(-2)]));
        let z=0;
        for(const teams of [first,second]){
          const seen=new Set(teams.flat());if(seen.size!==teams.length*2){z=1e9;break;}
          for(const id of A.concat(B)){
            const v=seen.has(id),a=tmp[id];
            if(!v&&a.at(-1)===false)z+=2000;
            if(v&&a.at(-1)===true&&a.at(-2)===true)z+=1250;
            a.push(v);
          }
        }
        z+=(h.opp.get(pair(aa,bb))||0)*10+rng()*1;
        if(!best||z<best.z)best={first,second,z};
      }
      if(!best)throw Error('Unable to construct final complete doubles rounds');
      append(best.first);append(best.second);
    }
    return {rounds,score:rest2*2500+triple*1600+longest*450+opponentRepeats*90+fixtureRepeats*600,
      metrics:{rest2,triple,longest,opponentRepeats,fixtureRepeats}};
  }
  function balancedBuild(s,random) {
    previous.validate(s);const g=previous.members(s),n=g.A.length,c=Number(s.courts)||1;
    if(n!==3*c||c<1||c>5||n===6&&c===2)return previous.build(s,random);
    let best=null;const attempts=n<=9?140:n<=12?55:20;
    for(let t=0;t<attempts;t++){
      const A=shuff(g.A,random),B=shuff(g.B,random),candidate=buildCandidate(A,B,c,random);
      if(!best||candidate.score<best.score)best=candidate;
    }
    const ids=g.A.concat(g.B),counts=Object.fromEntries(ids.map(id=>[id,0]));
    const seen=new Map();let maxGap=0;
    for(const [i,matches] of best.rounds.entries()){
      for(const teams of matches){for(const team of teams){
        if(team.length!==2||!g.A.includes(team[0])||!g.B.includes(team[1]))throw Error('Structured group violation');
        const p=pair(...team);seen.set(p,(seen.get(p)||0)+1);
        for(const id of team)counts[id]++;
      }}
      const gap=Math.max(...Object.values(counts))-Math.min(...Object.values(counts));maxGap=Math.max(maxGap,gap);
      if(gap>1)throw Error('Structured fair-cycle running G gap '+gap+' in round '+(i+1));
      if((i+1)%3===0&&i<Math.floor(n/2)*3&&gap!==0)throw Error('Structured 3-round fairness failed at '+(i+1));
    }
    // Explicit acceptance gate for the WED MEX incident profile: 9+9 / 3 courts.
    // No seed may produce 5-7 Games Played after Round 9 or consecutive rests.
    if(n===9&&c===3){
     const firstNine=best.rounds.slice(0,9),g9=Object.fromEntries(ids.map(id=>[id,0]));
     const states=Object.fromEntries(ids.map(id=>[id,[]]));
     for(const teams of firstNine){
      if(teams.length!==3)throw Error('18-player three-court fixture density invalid');
      const active=new Set(teams.flat(2));
      for(const id of ids){
       const now=active.has(id),seq=states[id];
       if(!now&&seq.at(-1)===false)throw Error('Structured 18-player fairness: consecutive rests');
       seq.push(now);if(now)g9[id]++;
      }
     }
     if(Object.values(g9).some(count=>count!==6))throw Error('Structured 18-player fairness: Round 9 Games Played must equal 6 for every player');
    }
    if(seen.size!==n*n)throw Error('Structured partner coverage '+seen.size+'/'+n*n);
    if([...seen.values()].reduce((z,v)=>z+v-1,0)!==n%2)throw Error('Structured partner repeat count invalid');
    return best.rounds.map((matches,i)=>({index:i,structuredFairCycleCertified:true,matches:matches.map((teams,j)=>({id:`R${i}C${j}`,court:j+1,teams,score:null,confirmed:false})),eligibleIds:ids.slice(),groupSnapshot:{A:n,B:n},completePartnerCycle:true}));
  }
  root.P5Structured=Object.freeze({...previous,build:balancedBuild});
  const oldFair=root.P5Fair532;
  root.P5Fair532=Object.freeze({...oldFair,optimize:(future,prefix,ids,rng,options)=>
    Array.isArray(future)&&future.length&&future.every(x=>x.structuredFairCycleCertified)?future:oldFair.optimize(future,prefix,ids,rng,options)});
  root.P5StructuredFairLab=Object.freeze({version:'lab0.1',buildCandidate,balancedBuild});
})(window);