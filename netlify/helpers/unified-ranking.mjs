/* PADEL 5IVE Phase 5.7.4 — single official leaderboard projection.
 * Matches public results: confirmed Stage 1 scores only, Wins > Diff > Points > name.
 * No KO results are mixed into qualification rankings.
 */
export function projectResults(data){
  if(!data||!Array.isArray(data.roster)||!Array.isArray(data.rounds))throw Error('Missing report results');
  const fixed=String(data.mode||'').startsWith('fp-');
  const pair=new Map(data.roster.map(p=>[p.id,p.names.filter(Boolean).join(' & ')]));
  const entries=data.roster.map(p=>({id:p.id,name:pair.get(p.id)||'Player',w:0,l:0,t:0,diff:0,p:0,g:0}));
  const byId=new Map(entries.map(p=>[p.id,p]));
  for(const round of data.rounds){
    for(const match of round.matches||[]){
      if(!match?.confirmed||!Array.isArray(match.score)||match.score.length!==2)continue;
      const [x,y]=match.score.map(Number);
      if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      for(let side=0;side<2;side++){
        const ids=match.teams?.[side]||[],ours=side===0?x:y,theirs=side===0?y:x;
        for(const id of ids){const e=byId.get(id);if(!e)continue;
          e.w+=ours>theirs?1:0;e.l+=ours<theirs?1:0;e.t+=ours===theirs?1:0;
          e.diff+=ours-theirs;e.p+=ours;e.g++;
        }
      }
    }
  }
  entries.sort((a,b)=>b.w-a.w||b.diff-a.diff||b.p-a.p||a.name.localeCompare(b.name));
  const ko=Boolean(data.ko?.format&&data.ko.format!=='none');
  const complete=data.stage==='champion';
  const displayIds=ids=>Array.isArray(ids)?ids.map(id=>pair.get(id)||'Unknown Player').join(' & '):'';
  const champion=ko&&complete&&Array.isArray(data.ko?.champion)&&data.ko.champion.length?displayIds(data.ko.champion):'';
  const runnerUp=champion&&Array.isArray(data.ko?.runnerUp)?displayIds(data.ko.runnerUp):'';
  return {
    session:String(data.session||'Signature Game'),
    mode:String(data.mode||'').includes('mexicano')?'MEXICANO':'AMERICANO',
    pairing:fixed?'FIXED PARTNER':String(data.mode||'').startsWith('structured-')?'STRUCTURED PAIRING':'FLEXIBLE PAIRING',
    date:String(data.date||''),time:String(data.time||''),
    isKO:ko,complete,
    champion,runnerUp,
    heading:ko?'STAGE 1 TOP 5':complete?'FINAL LEADERBOARD':'LIVE STANDINGS',
    leaders:entries.slice(0,5)
  };
}
