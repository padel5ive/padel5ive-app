'use strict';
(function(root){root.P5AdaptiveReplacement=(function adaptiveFactory(){
 const supports=s=>['fp-americano','individual-americano','structured-americano'].includes(s?.mode);
 const flat=s=>(s.rounds||[]).flatMap(r=>(r.matches||[]).filter(Boolean));
 const copy=x=>JSON.parse(JSON.stringify(x));
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const fixed=s=>s.mode==='fp-americano';
 const constrained=s=>s.mode==='individual-americano'&&((s.rules?.fixedEnabled&&s.rules?.pairs?.length)||(s.rules?.coachEnabled&&s.rules?.coachIds?.length));
 function legal(s,t){const ids=t.flat();if(t.length!==2||t.some(x=>x.length!==(fixed(s)?1:2))||new Set(ids).size!==ids.length)return false;const people=new Map(s.roster.map(p=>[p.id,p]));if(ids.some(id=>!people.has(id)))return false;if(s.mode==='structured-americano'&&t.some(x=>!x.some(id=>people.get(id).group==='A')||!x.some(id=>people.get(id).group==='B')))return false;if(s.mode==='individual-americano'&&s.rules?.fixedEnabled)for(const p of s.rules.pairs||[])if(p.some(id=>ids.includes(id))&&!t.some(x=>p.every(id=>x.includes(id))))return false;return true;}
 function allowed(s,m,side,slot,id){if(!supports(s))return true;if(s.arrival?.[id]===false||(s.sitout||[]).includes(id))return false;const from=m.teams[side]?.[slot];if(!from||from===id)return false;if(s.mode==='individual-americano'&&s.rules?.coachEnabled&&(s.rules.coachIds||[]).some(x=>x===from||x===id))return false;const t=copy(m.teams);t[side][slot]=id;return legal(s,t);}
 function keys(s,t){const out=[];if(!fixed(s))for(const p of t)out.push(['P'+key(...p),1000,1]);for(const a of t[0])for(const b of t[1])out.push(['O'+key(a,b),fixed(s)?10000:8,fixed(s)?1:2]);if(!fixed(s))out.push(['F'+t.map(x=>x.slice().sort((a,b)=>a-b).join(':')).sort().join('|'),100,1]);return out;}
 function objective(s,protectedMatches,tasks){const map=new Map();let cost=0;function adjust(t,delta){for(const [k,w,limit] of keys(s,t)){const old=map.get(k)||0,next=old+delta;cost+=w*(Math.max(0,next-limit)**2-Math.max(0,old-limit)**2);map.set(k,next);}}for(const m of [...protectedMatches,...tasks])adjust(m.teams,1);return {adjust,get:()=>cost};}
 function allCount(s){const count=Object.fromEntries(s.roster.map(p=>[p.id,0]));for(const m of [...flat(s),...(s.matchFlow==='continuous'?s.continuous?.queue||[]:[])])if(!m.skipped)for(const id of m.teams.flat())count[id]=(count[id]||0)+1;return count;}
 function repair(s,before,matchId,from,to){
  if(!supports(s))return null;
  const continuous=s.matchFlow==='continuous',rows=s.rounds,cycle=s.continuous?.cycle;
  const target=flat(s).find(m=>m.id===matchId),index=rows.findIndex(r=>r.matches.includes(target));if(!target||target.confirmed||target.skipped||index<0)throw Error('Replacement match is no longer editable.');
  const locked=new Set(),tasks=[],history=[],strict=!!constrained(s)&&!continuous;
  if(continuous){for(const m of flat(s))if(m.cycle===cycle&&!m.skipped)history.push(m);for(const f of s.continuous.queue)tasks.push({ref:f,teams:copy(f.teams),row:-1});}
  else{const boundary=Math.max(s.currentRound||0,s.viewRound||0,index);for(let i=0;i<rows.length;i++){const r=rows[i],ms=r.matches.filter(Boolean);if(i<=boundary||r.balancing||ms.some(m=>m.confirmed||m.skipped||m.score!=null||m.substitutions?.length)){locked.add(i);history.push(...ms.filter(m=>!m.skipped));}else for(const m of ms)tasks.push({ref:m,teams:copy(m.teams),row:i});}}
  const expected=allCount(before),o=objective(s,history,tasks);const initial=o.get();
  const valid=(t,teams,other=null,otherTeams=null)=>legal(s,teams)&&(!strict||tasks.filter(x=>x.row===t.row&&x!==t).every(x=>teams.flat().every(id=>!(x===other?otherTeams:x.teams).flat().includes(id))));
  let best=null;for(const t of tasks){for(let side=0;side<2;side++)for(let slot=0;slot<t.teams[side].length;slot++)if(t.teams[side][slot]===to){const next=copy(t.teams);next[side][slot]=from;if(!valid(t,next))continue;o.adjust(t.teams,-1);o.adjust(next,1);const cost=o.get();o.adjust(next,-1);o.adjust(t.teams,1);if(!best||cost<best.cost)best={t,next,cost};}}
  if(!best)throw Error('No fair remaining fixture can absorb this replacement. Choose another available participant.');
  o.adjust(best.t.teams,-1);best.t.teams=best.next;o.adjust(best.t.teams,1);
  // Bounded local search; keeps the exact total match count of every player.
  // Swap across fixtures, or exchange opposing players within a fixture.
  let seed=7919;const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
  let improved=0;const limit=Math.min(6000,Math.max(600,tasks.length*30));for(let i=0;i<limit&&tasks.length&&o.get()>0;i++){
   const a=tasks[rand(tasks.length)],b=tasks[rand(tasks.length)];const x=rand(2),y=rand(2),u=rand(a.teams[x].length),v=rand(b.teams[y].length);if(a.teams[x][u]===b.teams[y][v])continue;
   const aa=copy(a.teams),bb=a===b?aa:copy(b.teams);[aa[x][u],bb[y][v]]=[bb[y][v],aa[x][u]];
   if(!valid(a,aa,b,bb)||a!==b&&!valid(b,bb,a,aa))continue;
   const old=o.get();o.adjust(a.teams,-1);if(a!==b)o.adjust(b.teams,-1);o.adjust(aa,1);if(a!==b)o.adjust(bb,1);
   if(o.get()<old){a.teams=aa;b.teams=bb;improved++;}else{o.adjust(aa,-1);if(a!==b)o.adjust(bb,-1);o.adjust(a.teams,1);if(a!==b)o.adjust(b.teams,1);}
  }
  if(continuous){for(const t of tasks)t.ref.teams=t.teams;const c=s.continuous;c.adaptiveReplacement=true;}
  else if(strict){for(const t of tasks)t.ref.teams=t.teams;}
  else{
   const remaining=tasks.slice(),counts=Object.fromEntries(s.roster.map(p=>[p.id,0])),last={};
   const note=(ms,i)=>{for(const m of ms.filter(Boolean))for(const id of m.teams.flat()){counts[id]++;last[id]=i;}};
   const out=[];let i=0;const usedIds=new Set(history.map(m=>m.id));let serial=0;const gen=()=>{let id;do{id='AD'+(serial++);}while(usedIds.has(id));usedIds.add(id);return id;};
   for(;i<rows.length||remaining.length;i++){
    if(locked.has(i)){out.push(rows[i]);note(rows[i].matches,i);continue;}
    if(!remaining.length){if([...locked].some(k=>k>i))out.push({index:i,matches:[],protectedGap:true});else break;continue;}
    const matches=[],used=new Set();while(matches.length<s.courts){let choice=-1,score=Infinity;for(let k=0;k<remaining.length;k++){const ids=remaining[k].teams.flat();if(ids.some(id=>used.has(id)))continue;const weight=ids.reduce((v,id)=>v+(counts[id]||0)*30+(last[id]===i-1?9:0),0)+k*.001;if(weight<score){score=weight;choice=k;}}if(choice<0)break;const t=remaining.splice(choice,1)[0];t.teams.flat().forEach(id=>used.add(id));matches.push({id:gen(),court:matches.length+1,teams:t.teams,confirmed:false,score:null});}
    out.push({index:i,matches,repacked:true});note(matches,i);if(i>2000)throw Error('Remaining schedule overflow.');
   }
   s.rounds=out;
  }
  const actual=allCount(s);if(Object.keys(expected).some(id=>expected[id]!==actual[id]))throw Error('Replacement would alter total match counts.');
  const remainingCost=o.get();return {adjusted:tasks.length,improved,remainingCost,initialCost:initial,rounds:s.rounds.length};
 }
 return Object.freeze({supports,allowed,repair,allCount,legal});
})();if(typeof module!=='undefined'&&module.exports)module.exports=root.P5AdaptiveReplacement;})(typeof window!=='undefined'?window:globalThis);
