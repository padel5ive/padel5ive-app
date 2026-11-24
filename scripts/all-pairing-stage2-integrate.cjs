'use strict';
// Apply after PR52 to preserve locked source and other build transforms.
(function integrate(){
 const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
 const file='public/modes/unified/index.html';
 let html=fs.readFileSync(file,'utf8');
 function swap(a,b,label){const count=html.split(a).length-1;if(count!==1)throw Error('Stage 2 / Continuous source drift: '+label+' ('+count+')');html=html.replace(a,()=>b);}
 // Pure reporting projection. Never regroup engine state, court assignments or stored matches.
 function reportRounds(s){
  const rounds=s.rounds||[];
  if(s.matchFlow!=='continuous'||!s.continuous)return rounds;
  const width=Math.max(1,Math.min(5,Number(s.initialCourts||s.courts)||1)),groups=new Map(),fallback=new Map();
  for(const rd of rounds)for(const m of rd.matches||[]){
   if(!m)continue;
   const cycle=Number(m.cycle)||1,seq=fallback.get(cycle)||0;
   fallback.set(cycle,seq+1);
   const dispatch=Number.isInteger(m.dispatchIndex)&&m.dispatchIndex>=0?m.dispatchIndex:seq;
   const round=Math.floor(dispatch/width),key=cycle+':'+round;
   if(!groups.has(key))groups.set(key,{cycle,round,matches:[]});
   groups.get(key).matches.push(m);
  }
  return [...groups.values()].sort((a,b)=>a.cycle-b.cycle||a.round-b.round).map((rd,index)=>({...rd,index,matches:rd.matches.slice().sort((a,b)=>(a.dispatchIndex??0)-(b.dispatchIndex??0))}));
 }
 // Self-check exact screenshot fixture, second cycle, and round mode identity.
 const raw={matchFlow:'continuous',continuous:{cycle:1},courts:3,rounds:Array.from({length:31},(_,i)=>({matches:[{id:'m'+i,cycle:1,dispatchIndex:i,court:i%3+1,confirmed:true,score:[3,2]}]}))};
 const before=JSON.stringify(raw),out=reportRounds(raw);
 assert.equal(out.length,11);assert.deepEqual(out.map(r=>r.matches.length),[3,3,3,3,3,3,3,3,3,3,1]);
 assert.equal(JSON.stringify(raw),before);assert.deepEqual(out.flatMap(r=>r.matches),raw.rounds.flatMap(r=>r.matches));
 raw.rounds.push({matches:[{id:'new',cycle:2,dispatchIndex:0,court:1}]});
 assert.equal(reportRounds(raw).at(-1).cycle,2);assert.equal(reportRounds(raw).length,12);
 assert.equal(reportRounds({...raw,matchFlow:'rounds'}),raw.rounds);
 swap("window.P5UI=(function(){'use strict';","window.p5Stage1ReportRounds="+reportRounds.toString()+";\nwindow.P5UI=(function(){'use strict';",'report projection');
 swap('const rounds=s.rounds.map((rd,r)=>`<details class="p5-b31-history-round">','const rounds=window.p5Stage1ReportRounds(s).map((rd,r)=>`<details class="p5-b31-history-round">','final/archive history');
 swap('const rounds=s.rounds.map((rd,i)=>({label:`ROUND ${i+1}`','const rounds=window.p5Stage1ReportRounds(s).map((rd,i)=>({label:`ROUND ${i+1}`','HTML report');
 swap('rounds:(state.rounds||[]).map(r=>({matches:', 'rounds:window.p5Stage1ReportRounds(state).map(r=>({matches:','public/PDF snapshot');
 // Structured: use the existing canonical qualification / group-balanced KO builder.
 const start=html.indexOf('function finished(s){if(P5Structured.is(s)){'),end=html.indexOf('const rows=statistics(s),options=',start);
 if(start<0||end<start)throw Error('Structured finished UI source drift');
 html=html.slice(0,start)+'function finished(s){'+html.slice(end);
 swap("function promptKo(){if(P5Structured.is(s))return alertModal('No Stage 2','Structured Pairing finishes with the official session leaderboard. Knockout is not available for this pairing style.');","function promptKo(){",'qualification gate');
 swap("s.stage=structured?'champion':'stage1finished';s.qualification=null;s.ko=structured?{champion:[P5UI.statistics(s)[0]?.id].filter(Boolean),format:'none',rounds:[],roundIndex:0,teams:[]}:s.ko;","s.stage='stage1finished';s.qualification=null;s.ko=null;",'structured finish route');
 swap("Finish this Structured Pairing session using confirmed scores only. Final standings and winner will be available immediately. There is no Knockout or Stage 2.","Finish Stage 1 using confirmed scores only. Continue to Knockout or finish without Knockout.",'structured finish copy');
 swap("End the session at any time after confirming at least one score. Unplayed fixtures stay excluded from final standings; no Stage 2.","Finish Stage 1 using confirmed scores only. Unplayed fixtures are excluded from standings and KO seeds.",'structured session copy');
 swap("])+(P5Structured.is(s)?'':block('STAGE 2 · KNOCKOUT',[","])+block('STAGE 2 · KNOCKOUT',[",'structured management menu');
 swap("actionLine('Reset Stage 2','reset-stage2',canKO,true)\n   ])));","actionLine('Reset Stage 2','reset-stage2',canKO,true)\n   ]));",'management menu close');
 // Continuous: partial Finish Stage 1 goes to native qualification; completed
 // cycle Finish Tournament still explicitly finalizes without KO.
 swap("function finishContinuous(route='final')","function finishContinuous(route='ko')",'default stage1 route');
 swap("case 'continuous-finish':finishContinuous('final');break;","case 'continuous-finish':finishContinuous(P5Continuous.complete(s)?'final':'ko');break;",'partial cycle action');
 swap("s.stage=route==='ko'?'stage1finished':'champion';c.paused=true;s.qualification=null;","s.stage=route==='ko'?'stage1finished':'champion';c.paused=true;closeMenu();s.ui.stageTab='stage1';s.koFormat='';s.koMatchFormat='';s.koFinalFormat='';s.qualification=null;",'clean stage transition');
 swap("const c=s.continuous,missing=c.queue.length;","const c=s.continuous,missing=c.queue.length,counts=P5UI.statistics(s).filter(x=>!(s.sitout||[]).includes(x.id)).map(x=>x.g);const gap=counts.length?Math.max(...counts)-Math.min(...counts):0;",'continuous fairness calculation');
 swap("All cycle histories and confirmed scores are preserved.`,()=>{","All cycle histories and confirmed scores are preserved.${gap?' FAIRNESS WARNING: participants have unequal confirmed match counts (G gap '+gap+'). Rankings may be affected.':''}`,()=>{",'continuous fairness warning');
 swap('${done(s)}/${s.continuous.total} scored','${P5Continuous.verify(s).completed}/${s.continuous.total} scored${s.stage!==\'stage1\'?\' · FINALIZED\':\'\'}','current-cycle counter');
 // Recover already finalized Stage 1-only sessions without replaying or deleting scores.
 swap("actionLine('Reset Stage 2','reset-stage2',canKO,true)","actionLine('Continue to Stage 2','prepare-stage2',s.stage==='champion'&&!canKO&&done(s)>0),\n    actionLine('Reset Stage 2','reset-stage2',canKO,true)",'recover stage1-only champion');
 swap("case 'end-without-ko':if(P5UI.done(s)===0)","case 'prepare-stage2':if(s.stage!=='champion'||s.ko?.format!=='none'||!P5UI.done(s))break;modal('confirm','Continue to Stage 2?','Preserve all confirmed Stage 1 scores and configure Knockout.',()=>{snapshot();s.stage='stage1finished';s.ko=null;s.qualification=null;s.koFormat='';s.koMatchFormat='';s.koFinalFormat='';if(s.continuous)s.continuous.paused=true;closeMenu();s.ui.stageTab='stage1';save();render();});break;\n   case 'end-without-ko':if(P5UI.done(s)===0)",'recover action');
 // Parse generated inline scripts before writing, matching existing QA style.
 for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())if(m[1].trim())new vm.Script(m[1],{filename:'stage2-inline-'+i+'.js'});
 fs.writeFileSync(file,html);
 console.log('PASS: Stage 2 shared routes, Continuous history projection fixture and generated JavaScript syntax');
})();
