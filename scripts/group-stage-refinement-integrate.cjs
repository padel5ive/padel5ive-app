'use strict';
(function refine(){
 const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),upgrade=require('./group-stage-ko-extension.cjs');
 const file='public/modes/unified/index.html',pub='public/assets/p5-interactive-results.js',pdf='public/assets/p5-direct-pdf.js',api='netlify/functions/unified-results.mjs';
 let html=fs.readFileSync(file,'utf8'),p=fs.readFileSync(pub,'utf8'),d=fs.readFileSync(pdf,'utf8'),a=fs.readFileSync(api,'utf8');
 function edit(s,from,to,label){const n=s.split(from).length-1;if(n!==1)throw Error('Group refinement drift '+label+' '+n);return s.replace(from,()=>to);}
 const one=(a,b,l)=>{html=edit(html,a,b,l);};
 function all(from,to){if(!html.includes(from))throw Error('Missing group refinement hook '+from);html=html.split(from).join(to);}
 const begin=html.indexOf('window.P5KO=(function'),end=html.indexOf('</script>',begin);if(begin<0||end<begin)throw Error('Missing canonical KO');
 html=html.slice(0,begin)+upgrade(html.slice(begin,end))+html.slice(end);
 // Keep the same score editor, validation, history, dispatch and bracket.
 all('P5KO.matchFormat(s.ko,m.final)','P5KO.matchFormat(s.ko,m.final,m.masterId)');
 all('P5KO.matchFormat(s.ko,m.match.final)','P5KO.matchFormat(s.ko,m.match.final,m.match.masterId)');
 all('P5KO.matchFormat(s.ko,m.final,m.masterId):m.ko?', 'P5KO.matchFormat(s.ko,m.final,m.masterId):m.ko?');
 one("const plan=P5Group.build({...s,initialCourts:s.courts},random);","const plan=P5Group.build({...s,initialCourts:s.courts},()=>0.5);",'stable confirmed group schedule');
 one("if(isKO||game.value==='Group Stage')pairing.value='fixed';","if(isKO||game.value==='Group Stage')pairing.value='fixed';if(game.value==='Group Stage'&&$('setup-match-flow')&&!$('setup-match-flow').value)$('setup-match-flow').value='rounds';",'default By Rounds');
 // Qualification rules are editable until the draw is confirmed.
 function recommendPanel(s,esc){
  const sizes=Array.from({length:s.tournamentGroup.count},(_,i)=>s.roster.filter(p=>s.groupDraw[p.id]===i).length);
  const choices=P5Group.recommend(sizes),cfg=s.tournamentGroup;
  return `<section class="card p5-group-refine"><h2>QUALIFICATION RULES</h2><p class="muted">Top ${cfg.top} per group + ${cfg.wild} wildcard${cfg.wild===1?'':'s'} = <strong>${cfg.top*cfg.count+cfg.wild} qualifiers</strong>. Direct places take priority; wildcards compare win %, DIFF per match, then points per match.</p>${choices.length?`<p class="muted">Recommended for this draw</p><div class="tools p5-group-options">${choices.slice(0,4).map((x,i)=>`<button type="button" data-act="group-recommend" data-top="${x.top}" data-wild="${x.wild}" aria-pressed="${x.top===cfg.top&&x.wild===cfg.wild}">${i===0?'Recommended · ':''}Top ${x.top} + ${x.wild} WC · ${x.target} KO</button>`).join('')}</div>`:'<p class="muted">Use your custom rule; no power-of-two recommendation fits this draw.</p>'}<p class="muted">You can keep the original custom rule or go back to Initial Setup to change it.</p></section>`;
 }
 function schedulePanel(s,plan,esc,team){
  if(!plan?.length)return '';
  const waves=P5Group.schedule(s,plan);
  const count=s.tournamentGroup.top*s.tournamentGroup.count+s.tournamentGroup.wild;
  const cfg=s.groupKOOptions||{},kind=s.koFormat||'single',bronze=kind==='single'&&cfg.bronze&&count>=4;
  // Exact planned group waves; provisional KO stage waves use conservative
  // stage dependencies, not fictional results. Double-elimination includes
  // an optional reset and is labelled as an upper-bound estimate.
  const duration=s.tournamentGroup.minutes,cap=s.initialCourts||s.courts;
  const stages=[];
  if(kind==='single'){
   const depth=Math.ceil(Math.log2(Math.max(2,count))),size=2**depth;
   let opening=count-size/2;if(opening>0)stages.push({label:depth===4?'ROUND OF 16 / PLAY-IN':depth===3?'QUARTERFINAL':depth===2?'SEMIFINAL':'FINAL',n:opening});
   for(let size2=size/2;size2>=2;size2/=2)stages.push({label:size2===8?'QUARTERFINAL':size2===4?'SEMIFINAL':'FINAL',n:size2/2+(size2===2&&bronze?1:0)});
   if(depth===1&&bronze)stages[0].n++;
  }else if(kind==='double'){
   // A serial upper bound; dispatch can finish earlier. No fabricated court assignments.
   stages.push({label:'DOUBLE ELIMINATION · UP TO '+(2*count-1)+' MATCHES INCLUDING RESET',n:2*count-1,serial:true});
  }
  const start=/^(\d{1,2}):(\d{2})/.exec(String(s.time||''));
  const base=start?+start[1]*60+ +start[2]:null;
  const clock=t=>base===null?'—':String(Math.floor((base+t)/60)%24).padStart(2,'0')+':'+String((base+t)%60).padStart(2,'0')+((base+t)>=1440?' +'+Math.floor((base+t)/1440)+'d':'');
  let offset=waves.length*duration;
  const ko=stages.map(x=>{const from=offset;offset+=(x.serial?x.n:Math.ceil(x.n/cap))*duration;return `<div class="p5-group-time-row"><strong>${esc(x.label)}</strong><span>${x.n} matches · ${clock(from)}–${clock(offset)}</span></div>`;}).join('');
  return `<details class="card p5-group-schedule" ${s.groupReview?'open':''}><summary>TOURNAMENT SCHEDULE · ${waves.length} GROUP WAVES</summary><p class="muted">${s.matchFlow==='continuous'?'Court by Court · indicative group timetable only; actual assignments and times may change.':'By Rounds · fixed group fixture allocation, all courts complete before the next round.'} ${duration} min per slot; excludes breaks and turnover.</p><div class="p5-group-time-list">${waves.map(w=>`<div class="p5-group-wave"><div class="row between"><strong>ROUND ${w.index}</strong><span>${esc(w.start||'—')}–${esc(w.end||'—')}</span></div>${w.matches.map(m=>`<div class="p5-group-time-row"><small>C${m.court} · ${esc(m.group)}</small><span>${esc(team(s,[m.ids[0]]))} vs ${esc(team(s,[m.ids[1]]))}</span></div>`).join('')}</div>`).join('')}</div><h3>PROJECTED KNOCKOUT</h3><p class="muted">Based on ${count} qualifiers, ${kind==='double'?'Double Elimination · conservative serial upper bound':'Single Elimination'+(bronze?' + Bronze':'')} and the same ${duration}-minute slot assumption. Final times and court allocation depend on qualification and live dispatch.</p>${ko}<p class="muted">Projected finish ${clock(offset)}.</p></details>`;
 }
 function bronzeCard(s,esc,team){
  if(!s.ko?.bronzeEnabled)return '';
  const m=P5KO.graph(s.ko)[32],name=(n,source)=>Number.isInteger(n)?team(s,s.ko.teams[n-1].ids):source;
  return `<section class="p5-group-bronze" aria-label="Bronze Match"><div class="row between"><h3>BRONZE MATCH</h3><span class="badge">${m?.valid?'COMPLETE':m?.ready?'READY':'WAITING'}</span></div><p>${esc(name(m?.a.id,'Loser SF1'))} <span class="muted">vs</span> ${esc(name(m?.b.id,'Loser SF2'))}</p><strong>${m?.valid?m.score.join('–'):'—'}</strong><p class="muted">${esc(P5KO.formatLabel(P5KO.matchFormat(s.ko,false,32)))} · Third Place</p></section>`;
 }
 function qualPanel(s,modal,esc,team,bracket){
  const groups=P5Group.standings(s,P5UI.statistics),ids=modal.selectedIds||[],labels=P5Group.labels(s,groups,ids);
  if(ids.length<2||ids.length>16)return '<p class="muted">Select 2–16 pairs to preview the bracket.</p>';
  try{
   const copy=JSON.parse(JSON.stringify(s));P5KO.start(copy,s.koFormat,ids);
   const seeds=copy.ko.teams.map(t=>{const id=t.ids[0],l=labels.get(id);return `<div class="p5-group-time-row"><b>#${t.seed} · ${esc(l.code)} ${esc(l.kind||'MANUAL')}</b><span>${esc(team(s,t.ids))}</span></div>`;}).join('');
   const pairs=P5Group.firstPairs(copy.ko.teams.length),conflicts=pairs.filter(([a,b])=>labels.get(copy.ko.teams[a].ids[0]).pool===labels.get(copy.ko.teams[b].ids[0]).pool).length;
   return `<section class="p5-group-refine"><h3>SEED &amp; BRACKET PREVIEW</h3><p class="muted">${conflicts?conflicts+' same-group opening encounter(s) remain under the seed-tier constraints.':'No same-group opening encounter in this draw.'} Higher group finish retains seed priority.</p>${seeds}<div class="p5-group-bracket-preview">${bracket(copy)}${bronzeCard(copy,esc,team)}</div></section>`;
  }catch(e){return '<p class="muted">'+esc(e.message)+'</p>';}
 }
 const ui=[recommendPanel,schedulePanel,bronzeCard,qualPanel].map(x=>x.toString()).join('\n');
 one('window.P5UI=(function(){\'use strict\';',"window.P5UI=(function(){'use strict';\n"+ui+'\n','shared group-specific view helpers');
 one('${error?`<p role="alert" class="muted">${esc(error)}</p>`:\'\'}<div class="tools"><button type="button" data-act="group-back">','${recommendPanel(s,esc)}${schedulePanel(s,plan,esc,team)}${error?`<p role="alert" class="muted">${esc(error)}</p>`:\'\'}<div class="tools"><button type="button" data-act="group-back">','group draw recommendation and schedule');
 one("case 'group-back':s.groupReview=false;","case 'group-recommend':if(s.mode==='fp-group-stage'&&s.groupReview){s.tournamentGroup={...s.tournamentGroup,top:Number(el.dataset.top),wild:Number(el.dataset.wild)};save();render();}break;\n   case 'group-back':s.groupReview=false;",'apply qualification recommendation');
 // Separate formats and optional Bronze in existing finished-stage configuration.
 one("const filled=Boolean(s.koFormat&&s.koMatchFormat&&s.koFinalFormat);","const filled=Boolean(s.koFormat&&s.koMatchFormat&&s.koFinalFormat);const groupOpts=s.groupKOOptions||{};const extra=s.mode==='fp-group-stage'?`<div class=\"p5-group-fields p5-group-extra\">${selector('group-ko-quarter','QUARTERFINAL MATCH FORMAT',options,groupOpts.quarter||s.koMatchFormat,'Use regular format')}${selector('group-ko-semi','SEMIFINAL MATCH FORMAT',options,groupOpts.semi||s.koMatchFormat,'Use regular format')}<label id=\"group-bronze-field\" ${s.koFormat==='double'?'hidden':''}><span>BRONZE MATCH · SINGLE ELIMINATION</span><select id=\"group-ko-bronze\"><option value=\"no\" ${!groupOpts.bronze?'selected':''}>No Bronze Match</option><option value=\"yes\" ${groupOpts.bronze?'selected':''}>Include Bronze Match</option></select></label><div id=\"group-bronze-format-field\" ${s.koFormat!=='single'||!groupOpts.bronze?'hidden':''}>${selector('group-ko-bronze-format','BRONZE MATCH FORMAT',options,groupOpts.bronzeFormat||s.koMatchFormat,'Use regular format')}</div></div><p class=\"muted\">Round-specific formats apply to the winners bracket. Bronze is available for Single Elimination with at least four qualifiers.</p>`:'';",'round-specific KO config');
 one("s.koFinalFormat,'Select grand final format')}</div>","s.koFinalFormat,'Select grand final format')}</div>${extra}",'KO extra config placement');
 one("s.koFormat=koFormat;s.koMatchFormat=regular;s.koFinalFormat=final;","s.koFormat=koFormat;s.koMatchFormat=regular;s.koFinalFormat=final;if(s.mode==='fp-group-stage'){s.groupKOOptions={quarter:$('group-ko-quarter')?.value||regular,semi:$('group-ko-semi')?.value||regular,bronze:koFormat==='single'&&$('group-ko-bronze')?.value==='yes',bronzeFormat:$('group-ko-bronze-format')?.value||regular};if(!P5Group.complete(s))return alertModal('Group Stage Incomplete','Confirm every group fixture first.');}",'persist round settings');
 one("if(['ko-format','ko-match-format','ko-final-format'].includes(e.target.id)){","if(s.mode==='fp-group-stage'&&['ko-format','ko-match-format','ko-final-format','group-ko-quarter','group-ko-semi','group-ko-bronze','group-ko-bronze-format'].includes(e.target.id)){s.koFormat=$('ko-format')?.value||'';s.koMatchFormat=$('ko-match-format')?.value||'';s.koFinalFormat=$('ko-final-format')?.value||'';s.groupKOOptions={quarter:$('group-ko-quarter')?.value||'',semi:$('group-ko-semi')?.value||'',bronze:s.koFormat==='single'&&$('group-ko-bronze')?.value==='yes',bronzeFormat:$('group-ko-bronze-format')?.value||''};const field=$('group-bronze-field'),fmt=$('group-bronze-format-field');if(field)field.hidden=s.koFormat!=='single';if(fmt)fmt.hidden=!s.groupKOOptions.bronze;const btn=document.querySelector('[data-act=\"start-ko\"]');if(btn)btn.disabled=!(s.koFormat&&s.koMatchFormat&&s.koFinalFormat);save();return;}\n   if(['ko-format','ko-match-format','ko-final-format'].includes(e.target.id)){",'KO config live visibility');
 // Qualification preview uses the canonical graph on a cloned state, not the real bracket.
 one('const qualifying=m.type===\'qualification\'?(()=>{const rows=statistics(s),selected=','const qualifying=m.type===\'qualification\'?(()=>{const rows=statistics(s),groupLabels=s.mode===\'fp-group-stage\'?P5Group.labels(s,P5Group.standings(s,statistics),m.selectedIds||[]):null,selected=','qualifier labels');
 one('<span class="p5-50-qual-rank">#${i+1}</span>','<span class="p5-50-qual-rank">${groupLabels?esc(groupLabels.get(r.id)?.code||\'—\'):\'#\'+(i+1)}</span>','group rank badge');
 one("${r.w} W · ${r.diff} DIFF · ${r.g} G</small></span></button>","${groupLabels&&groupLabels.get(r.id)?.kind?esc(groupLabels.get(r.id).kind)+' · ':''}${r.w} W · ${r.diff} DIFF · ${r.g} G</small></span></button>",'qualifier direct wildcard badge');
 one('data-act="qualification-active">Active Only</button>','data-act="qualification-active">${s.mode===\'fp-group-stage\'?\'Auto Qualifiers\':\'Active Only\'}</button>','reset to recommended auto qualifiers');
 one("case 'qualification-active':s.ui.modal.selectedIds=P5UI.statistics(s).filter(p=>!s.sitout.includes(p.id)).map(p=>p.id);","case 'qualification-active':s.ui.modal.selectedIds=s.mode==='fp-group-stage'?P5Group.qualification(s,P5Group.standings(s,P5UI.statistics)):P5UI.statistics(s).filter(p=>!s.sitout.includes(p.id)).map(p=>p.id);",'automatic reselect');
 one("${P5Structured.is(s)?window.p5StructuredKOPanel(s,m,rows,esc):''}</div>","${P5Structured.is(s)?window.p5StructuredKOPanel(s,m,rows,esc):''}${s.mode==='fp-group-stage'?qualPanel(s,m,esc,team,koBracket):''}</div>",'native bracket preview');
 // Include Bronze in official history and reporting, but use a dedicated bronze
 // card rather than distort the locked winners/losers SVG geometry.
 all('P5KO.definitions(k.format)','P5KO.definitions(k.format,k.bronzeEnabled)');
 all('P5KO.definitions(s.ko.format)','P5KO.definitions(s.ko.format,s.ko.bronzeEnabled)');
 all('P5KO.definitions(state.ko.format)','P5KO.definitions(state.ko.format,state.ko.bronzeEnabled)');
 one('function koBracket(s){const k=s.ko,map=P5KO.graph(k),defs=P5KO.definitions(k.format,k.bronzeEnabled);','function koBracket(s){const k=s.ko,map=P5KO.graph(k),defs=P5KO.definitions(k.format,k.bronzeEnabled).filter(d=>d.g!==\'B\');','keep canonical bracket geometry');
 // Live and champion views append the same bronze fixture card.
 all('${koBracket(s)}</section>','${koBracket(s)}${bronzeCard(s,esc,team)}</section>');
 one('${koBracket(s)}<div class="p5-b3-bracket-shortcut">','${koBracket(s)}${bronzeCard(s,esc,team)}<div class="p5-b3-bracket-shortcut">','live bronze fixture');
 one('${esc(team(s,runner))}</strong></div>`:\'\'}</div>`;','${esc(team(s,runner))}</strong></div>`:\'\'}${s.ko?.thirdPlace?`<div class="champion-runner"><span class="champion-runner-label">THIRD PLACE</span><strong class="champion-runner-name">${esc(team(s,s.ko.thirdPlace))}</strong></div>`:\'\'}</div>`;','podium');
 // Prevent group-specific values from leaking into a newly configured tournament.
 one('s.groupSeedOrder=null;if(game===\'Knockout\')','s.groupSeedOrder=null;s.groupKOOptions=null;if(game===\'Knockout\')','reset group options');
 // Show schedule using the same confirmed group plan in both stage views.
 one("function stage1(s){if(s.matchFlow==='continuous')return continuousStage1(s);","function stage1(s){if(s.mode==='fp-group-stage'){return groupNativeStage1(s)+schedulePanel(s,s.initialSchedule,esc,team);}return groupNativeStage1(s);}\n function groupNativeStage1(s){if(s.matchFlow==='continuous')return continuousStage1(s);",'group live full schedule');
 one("function finished(s){if(P5Group.is(s)&&s.groupFinalized)","function finished(s){return groupNativeFinished(s)+(s.mode==='fp-group-stage'?schedulePanel(s,s.initialSchedule,esc,team):'');}\n function groupNativeFinished(s){if(P5Group.is(s)&&s.groupFinalized)",'schedule on group results');
 one("function stage1Archive(s){","function stage1Archive(s){return groupNativeArchive(s)+(s.mode==='fp-group-stage'?schedulePanel(s,s.initialSchedule,esc,team):'');}\n function groupNativeArchive(s){",'schedule on archived group results');
 // Make Bronze corrections use the actual match ID rather than generic KO format.
 one("masterId:m.id,score:m.score.slice(),final:","masterId:m.id,score:m.score.slice(),final:",'historical score anchor');
 // Public KO validation: only Group Stage single-elimination Bronze is an extra canonical match.
 a=edit(a,"k.id>31||koIds.has(k.id)||!['W','L','F'].includes(k.group)","k.id>32||koIds.has(k.id)||!['W','L','F','B'].includes(k.group)||(k.id===32||k.group==='B')&&!(s.mode==='fp-group-stage'&&s.ko?.format==='single'&&s.ko?.bronzeEnabled===true&&k.id===32&&k.group==='B')",'public bronze validation');
 p=edit(p,"${c.runner?`<div class=\"pair-sub\"><span>RUNNER-UP · ${esc(c.runner)}</span></div>`:''}</section>","${c.runner?`<div class=\"pair-sub\"><span>RUNNER-UP · ${esc(c.runner)}</span></div>`:''}${data.ko?.thirdPlace?.length?`<div class=\"pair-sub\"><span>THIRD PLACE · ${esc(team(data.ko.thirdPlace))}</span></div>`:''}</section>",'public podium');
 p=edit(p,'<div class="p5-ko-match-inspector" id="p5-ko-match-inspector"','${data.ko?.bronzeEnabled?`<div class="bracket-block"><div class="block-title">BRONZE MATCH · THIRD PLACE</div>${finalCard(lookup.get(32),\'BRONZE MATCH\')||\'<p class="small">Losers of both semifinals · pending</p>\'}</div>`:\'\'}<div class="p5-ko-match-inspector" id="p5-ko-match-inspector"','public bronze card');
 d=edit(d,"`M${k.id}  /  ${k.group||'W'}`","k.group==='B'?'BRONZE':`M${k.id}  /  ${k.group||'W'}`",'PDF bronze result label');
 d=edit(d,"if(ended)doc.add(championPage(data,winner,runner,true,","if(ended&&data.ko?.thirdPlace?.length){doc.add(masthead('Official Podium',pg++)+text(52,H-140,'OFFICIAL PODIUM',28,'F2','ink')+text(52,H-210,'01  CHAMPION',12,'F2','gold')+text(52,H-242,ell(winner,65),23,'F2','ink')+text(52,H-305,'02  RUNNER-UP',12,'F2','gold')+text(52,H-337,ell(runner,65),23,'F2','ink')+text(52,H-400,'03  THIRD PLACE',12,'F2','gold')+text(52,H-432,ell(team(data.ko.thirdPlace),65),23,'F2','ink'));}\n  if(ended)doc.add(championPage(data,winner,runner,true,",'PDF podium page');
 const close=html.lastIndexOf('</style>');html=html.slice(0,close)+`
 #americano .p5-group-schedule{margin-top:14px}
 .p5-group-refine,.p5-group-bronze{margin:12px 0;padding:12px;border:1px solid rgba(194,171,137,.3);border-radius:10px}
 .p5-group-options{display:flex;flex-wrap:wrap;gap:8px}.p5-group-options button[aria-pressed="true"]{border-color:#d1af86;color:#eacdaa}
 .p5-group-time-list{max-height:410px;overflow:auto}.p5-group-wave{margin:8px 0;padding:10px;border:1px solid #46545d;border-radius:8px}
 .p5-group-time-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid rgba(158,174,183,.18);font-size:12px;overflow-wrap:anywhere}
 .p5-group-time-row>small,.p5-group-time-row>b{color:#cfb38d;flex-shrink:0}.p5-group-bracket-preview{max-height:360px;overflow:auto}
 .p5-group-extra [hidden]{display:none!important}.p5-group-bronze h3{margin:0;font-size:13px}
 @media(max-width:700px){.p5-group-time-row{font-size:11px}.p5-group-extra{grid-template-columns:1fr!important}.p5-group-bracket-preview{max-height:260px}}
 `+html.slice(close);
 for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())if(m[1].trim())new vm.Script(m[1],{filename:'unified#'+i});
 new vm.Script(p);new vm.Script(d);
 for(const [path,content] of [[file,html],[pub,p],[pdf,d],[api,a]])fs.writeFileSync(path,content);
 // Normalize only newly introduced whitespace-only lines in the generated HTML.
 // The native engines and all non-blank source lines stay byte-identical.
 const diff=require('node:child_process').spawnSync('git',['diff','--check','--',file],{encoding:'utf8'});
 if(diff.stdout){const lines=html.split('\n');let changed=false;for(const row of diff.stdout.split('\n')){const m=/^public\/modes\/unified\/index\.html:(\d+): trailing whitespace\.$/.exec(row);if(!m)continue;const i=Number(m[1])-1;if(/^[ \t]+$/.test(lines[i]||'')){lines[i]='';changed=true;}}if(changed)fs.writeFileSync(file,lines.join('\n'));}
 console.log('PASS Group Stage qualification recommendations, schedule, round formats, Bronze and podium integration');
})();
