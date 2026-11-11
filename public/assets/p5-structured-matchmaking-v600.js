/* PADEL 5IVE v6.0.0 — Structured Americano fairness-certified 9+9 / 3 courts.
 * Uses 3-round, degree-2 blocks of the bipartite partner graph.
 * Preserves every unique A-B partnership (one mathematically required repeat).
 * Other modes, coach rules, Sit Out recovery, and saved rounds remain unchanged.
 */
(function () {
'use strict';
var previous=window.P5Structured;
function shuffle(x,r){x=x.slice();for(var i=x.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),z=x[i];x[i]=x[j];x[j]=z;}return x;}
function key(a,b){return a<b?a+':'+b:b+':'+a;}
function edgeRounds(A,B,shift,r){
 var n=A.length,edges=[],adj=new Map();
 for(var i=0;i<n;i++)for(var d=0;d<2;d++)edges.push({a:A[i],b:B[(i+shift+d)%n]});
 edges.forEach(function(e,i){for(var id of [e.a,e.b]){if(!adj.has(id))adj.set(id,[]);adj.get(id).push(i);}});
 var current=A[0],used=new Set(),cycle=[];
 for(var i=0;i<2*n;i++){var next=(adj.get(current)||[]).find(function(j){return !used.has(j);});
  if(next===undefined)throw Error('Structured cycle traversal failed');
  used.add(next);var e=edges[next];cycle.push(e);current=e.a===current?e.b:e.a;}
 if(current!==A[0]||cycle.length!==2*n)throw Error('Structured full cycle invalid');
 var rows=[[],[],[]];cycle.forEach(function(e,i){rows[i%3].push(e);});
 for(var row of rows){var ids=row.flatMap(function(e){return [e.a,e.b];});if(new Set(ids).size!==ids.length)throw Error('Structured conflict in 3-round block');}
 return shuffle(rows,r);
}
function buckets(A,B,r){
 var n=A.length,cap=n/3,blocks=[];
 for(var shift=0;shift+1<n;shift+=2)blocks.push(edgeRounds(A,B,shift,r));
 blocks=shuffle(blocks,r);
 var rows=blocks.flat();
 if(n%2){
  var original=A.map(function(a,i){return {a:a,b:B[(i+n-1)%n]};});
  var first=[original[0],original[1]],others=shuffle(original.slice(2),r);
  while(first.length<2*cap)first.push(others.shift());
  rows.push(first,others.concat([{a:A[0],b:B[0]}]));
 }
 return rows;
}
function matchTeams(edges,history,r){
 var teams=edges.map(function(e){return [e.a,e.b];}),n=teams.length,memo=new Map();
 function fixture(a,b){return [a.slice().sort().join(':'),b.slice().sort().join(':')].sort().join('|');}
 function penalty(a,b){
  var v=0;for(var x of a)for(var y of b){var z=history.opponents[key(x,y)]||0;v+=z?160+110*z*z:0;}
  v+=(history.fixtures[fixture(a,b)]||0)*4500;
  return v+r()*0.01;
 }
 function solve(mask){
  if(!mask)return {cost:0,pairs:[]};
  if(memo.has(mask))return memo.get(mask);
  var i=0;while(!(mask&(1<<i)))i++;
  var best=null,rest=mask^(1<<i);
  for(var j=i+1;j<n;j++)if(rest&(1<<j)){
   var tail=solve(rest^(1<<j)),candidate=penalty(teams[i],teams[j])+tail.cost;
   if(!best||candidate<best.cost)best={cost:candidate,pairs:[[teams[i],teams[j]]].concat(tail.pairs)};
  }
  memo.set(mask,best);return best;
 }
 return solve((1<<n)-1).pairs;
}
function make(A,B,r){
 var rows=buckets(A,B,r),history={opponents:Object.create(null),fixtures:Object.create(null)};
 var count=Object.create(null),prev=Object.create(null),prev2=Object.create(null),r2=0,p3=0,gapSum=0,prefixReps=0,totalReps=0,rounds=[];
 for(var id of A.concat(B)){count[id]=0;prev[id]=0;prev2[id]=0;}
 rows.forEach(function(edges,ri){
  var games=matchTeams(edges,history,r),playing=new Set();
  var matches=games.map(function(teams,c){
   var sig=teams.map(function(t){return t.slice().sort().join(':');}).sort().join('|');
   history.fixtures[sig]=(history.fixtures[sig]||0)+1;
   for(var t of teams)for(var id of t)playing.add(id);
   for(var x of teams[0])for(var y of teams[1]){
    var k=key(x,y),seen=history.opponents[k]||0;
    if(seen){totalReps++;if(ri<9)prefixReps++;}
    history.opponents[k]=seen+1;
   }
   return {id:'R'+ri+'C'+c,court:c+1,teams:teams,score:null,confirmed:false};
  });
  for(var id of A.concat(B)){
   var active=playing.has(id)?1:0;
   if(ri>0&&!active&&!prev[id])r2++;
   if(ri>1&&active&&prev[id]&&prev2[id])p3++;
   count[id]+=active;prev2[id]=prev[id];prev[id]=active;
  }
  var counts=A.concat(B).map(function(id){return count[id];});
  var gap=Math.max.apply(null,counts)-Math.min.apply(null,counts);
  gapSum+=gap*gap;
  if(ri<12&&(ri+1)%3===0&&gap!==0)throw Error('Fairness checkpoint violated at round '+(ri+1));
  rounds.push({index:ri,matches:matches,eligibleIds:A.concat(B),groupSnapshot:{A:A.length,B:B.length},completePartnerCycle:true});
 });
 var seen=Object.create(null);
 rounds.forEach(function(rd){rd.matches.forEach(function(m){m.teams.forEach(function(t){var k=key(t[0],t[1]);seen[k]=(seen[k]||0)+1;});});});
 var values=Object.values(seen),repeated=values.filter(function(n){return n>1;}).length;
 if(Object.keys(seen).length!==A.length*B.length||repeated!==(A.length%2))throw Error('Structured partner cycle coverage failed');
 if(repeated)rounds[rounds.length-1].fairnessWarnings=['One cross-group partnership repeated because the full cycle has an odd team count'];
 return {rounds:rounds,metrics:{prefixReps:prefixReps,totalReps:totalReps,rest2:r2,play3:p3,gapSum:gapSum},
  score:prefixReps*2500+totalReps*240+r2*290+p3*220+gapSum*15};
}
function applies(s){
 if(!s||s.mode!=='structured-americano'||!Number.isFinite(Number(s.courts)))return false;
 var groups=previous.members(s);
 return groups.A.length===9&&groups.B.length===9&&Number(s.courts)===3;
}
function build(s,r){
 if(!applies(s))return previous.build(s,r);
 previous.validate(s);
 var g=previous.members(s),best=null;
 for(var trial=0;trial<36;trial++){
  var A=shuffle(g.A,r),B=shuffle(g.B,r),q=make(A,B,r);
  if(!best||q.score<best.score)best=q;
 }
 return best.rounds;
}
window.P5Structured=Object.freeze(Object.assign({},previous,{build:build}));
window.P5StructuredFair6=Object.freeze({applies:applies,build:build,make:make,version:'6.0.0'});
})();