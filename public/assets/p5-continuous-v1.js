/* PADEL 5IVE · Continuous Americano LAB v0.1
 * Pure dispatch scheduler. NO UI, NO storage, NO edits to production masters.
 * Fixed Partner = strict unique pair-v-pair cycle. Other Americano = precomputed
 * individual fixtures with live court-by-court release and conflict checks.
 */
(function(root){
 'use strict';
 const pairKey=(a,b)=>[Number(a),Number(b)].sort((x,y)=>x-y).join(':');
 const allMatches=s=>(s.rounds||[]).flatMap(r=>(r.matches||[]).filter(Boolean));
 const active=s=>allMatches(s).filter(m=>!m.confirmed&&!m.skipped);
 const usedIds=matches=>new Set(matches.flatMap(m=>[...m.teams.flat(),...(m.substitutions||[]).map(x=>x.toId).filter(Number.isInteger)]));
 const count=s=>{const ids=s.roster.map(p=>p.id),out=Object.fromEntries(ids.map(id=>[id,0]));
  for(const m of allMatches(s).filter(m=>m.confirmed))for(const id of m.teams.flat())if(id in out)out[id]++;
  return out;
 };
 const queued=s=>s.continuous?.queue||[];
 const freeCourts=s=>{
  const playing=new Set(active(s).map(m=>m.court));
  return Array.from({length:s.courts},(_,i)=>i+1).filter(x=>!playing.has(x));
 };
 function create(s,precomputed){
  if(!String(s.mode||'').endsWith('-americano'))throw Error('Continuous is only available for Americano');
  if(!Array.isArray(s.roster)||s.roster.length<2)throw Error('Insufficient participants');
  const fixed=s.mode==='fp-americano';
  let queue=[];
  if(fixed){
   const ids=s.roster.map(x=>x.id);
   for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)
    queue.push({teams:[[ids[i]],[ids[j]]],key:pairKey(ids[i],ids[j])});
  }else{
   if(!Array.isArray(precomputed)||!precomputed.length)throw Error('A certified complete precomputed cycle is required');
   queue=precomputed.flatMap(r=>(r.matches||[]).filter(Boolean).map(m=>({teams:m.teams.map(ids=>ids.slice()),key:String(m.id)})));
  }
  s.continuous={cycle:1,queue,total:queue.length,scheduled:0,paused:false,fixed,serial:0};
  s.rounds=[];s.currentRound=0;s.viewRound=0;
  dispatch(s);
  return s.continuous;
 }
 function dispatch(s){
  const c=s.continuous;if(!c||c.paused)return 0;
  let created=0;
  for(const court of freeCourts(s)){
   if(!c.queue.length)break;
   const running=usedIds(active(s)),counts=count(s);
   const sequence=allMatches(s);
   const last=Object.fromEntries(s.roster.map(p=>[p.id,-1]));
   for(let k=0;k<sequence.length;k++)for(const id of sequence[k].teams.flat())last[id]=k;
   const candidates=[];
   for(let i=0;i<c.queue.length;i++){
    const f=c.queue[i],ids=f.teams.flat();
    if(ids.length!==new Set(ids).size)continue;
    if(ids.some(id=>running.has(id)||s.sitout?.includes(id)))continue;
    const maxG=Math.max(...ids.map(id=>counts[id]||0));
    const minG=Math.min(...ids.map(id=>counts[id]||0));
    const recovery=ids.reduce((x,id)=>x+Math.max(0,sequence.length-1-(last[id]??-1)),0);
    const immediate=ids.filter(id=>last[id]===sequence.length-1).length;
    // Fairness first; always prefer least-used players and longer rest.
    const score=-(maxG*15000+minG*1800)-immediate*800+recovery*16-i*.025;
    candidates.push({i,score});
   }
   if(!candidates.length)continue; // idle court is safer than a repeat/conflict
   candidates.sort((a,b)=>b.score-a.score||a.i-b.i);
   const selected=c.queue.splice(candidates[0].i,1)[0];
   const n=c.serial++;
   const m={id:'CONT'+c.cycle+'M'+(n+1),court,teams:selected.teams.map(x=>x.slice()),
    score:null,confirmed:false,cycle:c.cycle,fixtureKey:selected.key,dispatchIndex:n};
   const slots=Array(s.courts).fill(null);slots[court-1]=m;
   s.rounds.push({index:s.rounds.length,matches:slots,continuous:true});
   c.scheduled++;
   created++;
  }
  if(s.rounds.length){s.currentRound=s.rounds.length-1;s.viewRound=s.currentRound;}
  return created;
 }
 function preview(s,limit=5){
  const c=s.continuous;if(!c)return [];
  const running=active(s),busy=usedIds(running),counts=count(s);
  const sequence=allMatches(s);
  const last=Object.fromEntries(s.roster.map(p=>[p.id,-1]));
  for(let k=0;k<sequence.length;k++)for(const id of sequence[k].teams.flat())last[id]=k;
  return c.queue.map((fixture,index)=>{
   const ids=fixture.teams.flat();
   const valid=ids.length===new Set(ids).size&&!ids.some(id=>s.sitout?.includes(id));
   const ready=valid&&!ids.some(id=>busy.has(id));
   const maxG=Math.max(...ids.map(id=>counts[id]||0));
   const minG=Math.min(...ids.map(id=>counts[id]||0));
   const recovery=ids.reduce((sum,id)=>sum+Math.max(0,sequence.length-1-(last[id]??-1)),0);
   const immediate=ids.filter(id=>last[id]===sequence.length-1).length;
   const score=-(maxG*15000+minG*1800)-immediate*800+recovery*16-index*.025;
   return {key:fixture.key,teams:fixture.teams.map(x=>x.slice()),ready,score,index};
  }).sort((a,b)=>Number(b.ready)-Number(a.ready)||b.score-a.score||a.index-b.index).slice(0,Math.max(0,limit));
 }
 function complete(s){
  const c=s.continuous;
  return Boolean(c&&c.queue.length===0&&active(s).length===0&&c.scheduled===c.total);
 }
 function nextCycle(s,plan){
  const c=s.continuous;
  if(!complete(s))throw Error('Complete every fixture in this cycle before starting another');
  if(!c.fixed)throw Error('New individual cycles require regenerated partner coverage');
  const ids=s.roster.map(x=>x.id);const queue=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)
   queue.push({teams:[[ids[i]],[ids[j]]],key:pairKey(ids[i],ids[j])});
  c.cycle++;c.queue=queue;c.total=queue.length;c.scheduled=0;c.paused=false;c.serial=0;
  dispatch(s);return c.cycle;
 }
 function verify(s){
  if(!s.continuous)return {valid:false};
  const c=s.continuous,all=allMatches(s).filter(m=>m.cycle===c.cycle);
  const live=active(s);
  const unique=new Set(all.map(m=>m.fixtureKey));
  const courts=new Set(live.map(m=>m.court)),players=live.flatMap(m=>m.teams.flat());
  return {valid:unique.size===all.length&&courts.size===live.length&&new Set(players).size===players.length,
    total:c.total,scheduled:c.scheduled,remaining:c.queue.length,inProgress:live.length,completed:all.filter(m=>m.confirmed).length,
    cycle:c.cycle,paused:!!c.paused,fullCycleDone:complete(s)};
 }
 root.P5Continuous=Object.freeze({create,dispatch,preview,active,count,complete,nextCycle,verify,pairKey,busyIds:s=>usedIds(active(s))});
})(typeof window!=='undefined'?window:globalThis);
