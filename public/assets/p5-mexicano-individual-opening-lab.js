/* PADEL 5IVE — PR34 Individual/Flexible Mexicano random opening draw.
 * First round has no earned ranking; randomize only the ranking tie order.
 * Native P5HistorySmart matchmaking keeps Coach, locked partners, selected
 * players, rest fairness, and all Round 2+ ranking logic unchanged.
 */
(function(root){
 'use strict';
 const native=root.P5AdvancedRules;
 if(!native||typeof native.next!=='function')throw Error('Native Advanced Rules required');
 if(native.mexicanoFirstDrawShuffle==='lab1')return;
 function next(state,random,standings){
  if(state.mode!=='individual-mexicano'||(state.rounds||[]).length!==0)
   return native.next(state,random,standings);
  const eligible=new Set((state.roster||[]).map(x=>x.id).filter(id=>!(state.sitout||[]).includes(id)));
  const ordered=(Array.isArray(standings)?standings:[]).filter(row=>eligible.has(row.id)).slice();
  const present=new Set(ordered.map(row=>row.id));
  for(const id of eligible)if(!present.has(id))ordered.push({id});
  for(let i=ordered.length-1;i>0;i--){
   const j=Math.floor(random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];
  }
  return native.next(state,random,ordered);
 }
 root.P5AdvancedRules=Object.freeze({...native,next,mexicanoFirstDrawShuffle:'lab1'});
})(window);
