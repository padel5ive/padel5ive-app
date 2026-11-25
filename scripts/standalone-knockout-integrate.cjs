'use strict';
(function standalone(){
 const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
 const path='public/modes/unified/index.html',homePath='public/index.html';
 let html=fs.readFileSync(path,'utf8'),home=fs.readFileSync(homePath,'utf8');
 function edit(source,a,b,label){const n=source.split(a).length-1;if(n!==1)throw Error('Standalone KO source drift: '+label+' ('+n+')');return source.replace(a,()=>b);}
 const swap=(a,b,l)=>{html=edit(html,a,b,l);}, hs=(a,b,l)=>{home=edit(home,a,b,l);};
 // The standalone registry entry is only a route/metadata adapter. Canonical P5KO owns all fixtures.
 swap(" register(window.P5EngineStructuredMX,{title:'Mexicano · Structured Pairing',game:'Mexicano'});"," register(window.P5EngineStructuredMX,{title:'Mexicano · Structured Pairing',game:'Mexicano'});\n register(Object.freeze({id:'fp-knockout',name:'Knockout',kind:'fixed',dynamic:false,build(){throw Error('Knockout uses the canonical bracket, not a Stage 1 schedule.');}}),{title:'Knockout · Fixed Partners',game:'Knockout'});",'registry');
 swap("[['Americano','Americano'],['Mexicano','Mexicano']]","[['Americano','Americano'],['Mexicano','Mexicano'],['Knockout','Knockout']]",'setup game option');
 swap("pairingStyleOptions:[],style","game==='Knockout'?[['fixed','Fixed Partners']]:pairingStyleOptions:[],style",'setup fixed pairing');
 // Add format fields to the existing setup form; hide outside standalone mode.
 const setupExtra='<label class="p5-b2-wide" id="p5-ko-setup-type" ${game===\'Knockout\'?\'\':\'hidden style="display:none"\' }>ELIMINATION FORMAT<select id="setup-ko-type">${opts([[\'single\',\'Single Elimination\'],[\'double\',\'Double Elimination\']],s.koFormat||\'\',\'Select format\')}</select></label><label class="p5-b2-wide" id="p5-ko-setup-final" ${game===\'Knockout\'?\'\':\'hidden style="display:none"\' }>FINAL MATCH FORMAT<select id="setup-ko-final">${opts([[\'first4\',\'First to 4\'],[\'first5\',\'First to 5\'],[\'first6\',\'First to 6\'],[\'total5\',\'Total of 5\']],s.koFinalFormat||\'\',\'Select final format\')}</select></label>';
 swap('<label>COURTS<select id="setup-courts">',setupExtra+'<label>COURTS<select id="setup-courts">','setup fields');
 swap("const value=pairing.value,styles=","const isKO=game.value==='Knockout';for(const id of ['p5-ko-setup-type','p5-ko-setup-final']){const n=document.getElementById(id);if(n){n.hidden=!isKO;n.style.display=isKO?'':'none';}}\n  const regular=$('setup-format');if(regular)for(const opt of regular.options){if(['total4','total6'].includes(opt.value)){opt.disabled=isKO;opt.hidden=isKO;}}if(isKO&&['total4','total6'].includes(regular?.value))regular.value='';\n  const value=pairing.value,styles=",'setup sync');
 swap("if(styles.includes(value))pairing.value=value;","if(styles.includes(value))pairing.value=value;if(isKO)pairing.value='fixed';",'fixed pairing');
 // Match format validation + configuration persistence before registration.
 swap("if(!['first4','first5','first6','total4','total5','total6'].includes(fmt))return toast('Select a Match Format');","if(!['first4','first5','first6','total4','total5','total6'].includes(fmt))return toast('Select a Match Format');\n  if(game==='Knockout'&&(!['single','double'].includes($('setup-ko-type')?.value)||!['first4','first5','first6','total5'].includes($('setup-ko-final')?.value)||!['first4','first5','first6','total5'].includes(fmt)))return toast('Select valid Knockout and Final formats');",'KO format validation');
 swap("s.continuous=null;\n  if(!keepRoster)","s.continuous=null;\n  if(game==='Knockout'){s.koFormat=$('setup-ko-type').value;s.koMatchFormat=fmt;s.koFinalFormat=$('setup-ko-final').value;}else{s.koFormat='';s.koMatchFormat='';s.koFinalFormat='';}\n  if(!keepRoster)",'save KO setup');
 swap("const btn=document.querySelector('[data-act=\"setup-next\"]');if(btn)btn.disabled=!ready;","const btn=document.querySelector('[data-act=\"setup-next\"]');if(btn)btn.disabled=!ready||(isKO&&(!['single','double'].includes($('setup-ko-type')?.value)||!['first4','first5','first6','total5'].includes($('setup-ko-final')?.value)));",'continue readiness');
 swap("if(e.target.id==='restore-input')","if(['setup-ko-type','setup-ko-final'].includes(e.target.id)){syncSetup();return;}\n   if(e.target.id==='restore-input')",'format change');
 // Direct entry from registration. Existing validation still handles blank/duplicate names.
 swap("if(s.roster.length<s.courts*(individual?4:2))","if(s.mode!=='fp-knockout'&&s.roster.length<s.courts*(individual?4:2))",'allow idle courts for small bracket');
 swap("if(s.matchFlow==='continuous')return startContinuous();","if(s.mode==='fp-knockout')return startStandaloneKO();\n  if(s.matchFlow==='continuous')return startContinuous();",'direct KO start');
 const startFn="function startStandaloneKO(){if(s.roster.length<2||s.roster.length>16)return toast('Register 2–16 pairs for Knockout');if(!['single','double'].includes(s.koFormat)||!['first4','first5','first6','total5'].includes(s.koMatchFormat)||!['first4','first5','first6','total5'].includes(s.koFinalFormat))return toast('Return to Setup and select Knockout formats');const before=clone(s);snapshot();try{s.rounds=[];s.initialSchedule=[];s.initialCourts=s.courts;s.currentRound=s.viewRound=0;s.sitout=[];s.sitoutPending={};s.pendingParticipants=[];s.pendingCourts=null;s.availabilityById=Object.fromEntries(s.roster.map(p=>[p.id,P5Availability.ACTIVE]));P5Availability.sync(s);s.qualification=null;s.ko=null;P5KO.start(s,s.koFormat,s.roster.map(p=>p.id));s.ui.stageTab='stage2';closeMenu();if(!save())throw Error('Storage unavailable');render();toast('Knockout started · '+s.roster.length+' seeded pairs');}catch(e){s=before;undo.pop();render();alertModal('Knockout Setup',e.message);}}\n ";
 swap("function start(){collectRegistration();",startFn+"function start(){collectRegistration();",'standalone controller');
 swap("const ranking=P5UI.statistics(s).map(x=>x.id);","const ranking=s.mode==='fp-knockout'?s.roster.map(p=>p.id):P5UI.statistics(s).map(x=>x.id);",'registration order seeding');
 swap("Register each fixed partner once. Partners stay together throughout Stage 1.","Register each fixed partner once. Partners stay together throughout the session.",'registration text');
 // Existing KO screens remain the master. Only omit Stage 1 navigation/management in standalone.
 swap("function stageTabs(s){const selected=","function stageTabs(s){if(s.mode==='fp-knockout')return '';const selected=",'hide irrelevant stage tabs');
 swap("if(s.ui?.stageTab==='stage1')return stage1Archive(s);","if(s.mode!=='fp-knockout'&&s.ui?.stageTab==='stage1')return stage1Archive(s);",'KO reload route');
 swap("if(s.ui?.stageTab==='stage1'&&s.ko?.format!=='none')return stage1Archive(s);","if(s.mode!=='fp-knockout'&&s.ui?.stageTab==='stage1'&&s.ko?.format!=='none')return stage1Archive(s);",'champion reload route');
 swap("s.stage==='ko'?'STAGE 2':inStage1(s)","s.stage==='ko'?(s.mode==='fp-knockout'?'KNOCKOUT':'STAGE 2'):inStage1(s)",'header status');
 swap("s.stage==='champion'?'CHAMPION':'STAGE 2'","s.stage==='champion'?'CHAMPION':s.mode==='fp-knockout'?'KNOCKOUT':'STAGE 2'",'identity status');
 swap("s.ui?.stageTab!=='stage1';","(s.mode==='fp-knockout'||s.ui?.stageTab!=='stage1');",'identity after reload');
 swap("block(P5Structured.is(s)?'SESSION · '+mode(s).toUpperCase():'STAGE 1 · '+mode(s).toUpperCase(),[","(s.mode==='fp-knockout'?'':block(P5Structured.is(s)?'SESSION · '+mode(s).toUpperCase():'STAGE 1 · '+mode(s).toUpperCase(),[",'stage1 menu scope');
 swap("])+block('STAGE 2 · KNOCKOUT',[","] ))+block(s.mode==='fp-knockout'?'KNOCKOUT':'STAGE 2 · KNOCKOUT',[",'KO menu scope');
 swap("actionLine('Cancel Stage 2','cancel-stage2',canKO,true)","actionLine(s.mode==='fp-knockout'?'Cancel Knockout':'Cancel Stage 2','cancel-stage2',canKO,true)",'cancel label');
 swap("s.ko=null;s.qualification=null;s.stage='stage1finished';s.koFormat='';s.koMatchFormat='';s.koFinalFormat='';s.ui.stageTab='stage1';save();render();","s.ko=null;s.qualification=null;if(s.mode==='fp-knockout'){s.stage='registration';s.ui.stageTab='stage2';}else{s.stage='stage1finished';s.koFormat='';s.koMatchFormat='';s.koFinalFormat='';s.ui.stageTab='stage1';}save();render();",'cancel direct draw');
 swap("function reOpen(){","function reOpen(){if(s.mode==='fp-knockout')return toast('Use Knockout score management or Cancel Knockout.');",'guard reopen stage1');
 // Preserve official results semantics: publish only a real scored KO match, no fabricated Stage 1.
 swap("const isScored=state.rounds?.some(r=>r.matches?.some(m=>m&&m.confirmed));","const isScored=state.rounds?.some(r=>r.matches?.some(m=>m&&m.confirmed))||(state.mode==='fp-knockout'&&snapshot(state).publicKO.length>0);",'publish direct KO scores');
 // Enable only Knockout within Tournament Mode.
 hs('data-mode="Tournament Mode" disabled aria-disabled="true"','data-mode="Tournament Mode" aria-pressed="false"','home tile');
 hs('Tournament Mode is coming soon.','Group Stage is coming soon.','home footnote');
 hs("const club=m==='Club Match';const sub=document.getElementById('p54-subpanel');","const club=m==='Club Match';const sub=document.getElementById('p54-subpanel');\n    if(m==='Tournament Mode'){sub.classList.add('p54-show');document.getElementById('p54-subtitle').textContent='TOURNAMENT FORMAT';pairing='fixed';document.getElementById('p54-options').innerHTML='<button type=\"button\" class=\"p54-opt\" data-pairing=\"fixed\" data-label=\"Knockout\" aria-pressed=\"true\"><span class=\"p548-pair-name\">Knockout</span><span class=\"p548-pair-desc\">Single / Double Elimination</span></button><button type=\"button\" class=\"p54-opt\" disabled aria-disabled=\"true\"><span class=\"p548-pair-name\">Group Stage · Coming Soon</span></button>';document.getElementById('p54-continue').disabled=false;document.getElementById('p54-caption').textContent='Tournament Mode · Knockout';return;}",'home tournament options');
 hs("encodeURIComponent(mode)+'&pairing='+encodeURIComponent(pairing)","encodeURIComponent(mode==='Tournament Mode'?'Knockout':mode)+'&pairing='+encodeURIComponent(pairing)",'home direct route');
 // Public report and PDF consumers understand the new explicit game ID.
 const pub='public/assets/p5-interactive-results.js',pdf='public/assets/p5-direct-pdf.js',api='netlify/functions/unified-results.mjs';
 let p=fs.readFileSync(pub,'utf8'),d=fs.readFileSync(pdf,'utf8'),a=fs.readFileSync(api,'utf8');
 p=edit(p,"'structured-mexicano']);","'structured-mexicano','fp-knockout']);",'public mode allowlist');
 p=edit(p,"return data.mode.includes('mexicano')?'MEXICANO':'AMERICANO';","return data.mode==='fp-knockout'?'KNOCKOUT':data.mode.includes('mexicano')?'MEXICANO':'AMERICANO';",'public mode title');
 p=edit(p,"const stage1Intro=hasKO?","const stage1Intro=hasKO&&data.mode!=='fp-knockout'?",'public stage1 intro');
 p=edit(p,"const tabs=hasKO?","const tabs=data.mode==='fp-knockout'?'<nav class=\"share-tabs\" aria-label=\"Results sections\"><a href=\"#overview\">Overview</a><a href=\"#knockout\">Bracket</a></nav>':hasKO?",'public tabs');
 p=edit(p,"+stage1Intro+leaderboard()+rounds()+analysis()+","+(data.mode==='fp-knockout'?'':stage1Intro+leaderboard()+rounds()+analysis())+",'public direct result sections');
 d=edit(d,"mode=String(data.mode).includes('mexicano')?'Mexicano':'Americano'","mode=data.mode==='fp-knockout'?'Knockout':String(data.mode).includes('mexicano')?'Mexicano':'Americano'",'PDF title');
 d=edit(d,"coverPage(data,mode,pairing,session,matches.length)","coverPage(data,mode,pairing,session,data.mode==='fp-knockout'?ko.length:matches.length)",'PDF match count');
 d=edit(d,"championPage(data,winner,runner,true,matches.length,mode,pg++)","championPage(data,winner,runner,true,data.mode==='fp-knockout'?ko.length:matches.length,mode,pg++)",'PDF champion count');
 d=edit(d,"for(const [i,items] of chunk(stats,16).entries())","for(const [i,items] of chunk(data.mode==='fp-knockout'?[]:stats,16).entries())",'PDF skip fictional standings');
 d=edit(d,"${count} CONFIRMED ${hasKO?'STAGE 1 ':''}MATCHES","${count} CONFIRMED ${hasKO&&data.mode!=='fp-knockout'?'STAGE 1 ':''}MATCHES",'PDF count label');
 a=edit(a,"'fp-mexicano','individual-mexicano','structured-mexicano'","'fp-mexicano','individual-mexicano','structured-mexicano','fp-knockout'",'API mode allowlist');
 a=edit(a,"if(!foundScore)return false;","if(s.mode==='fp-knockout'){if(s.rounds.length||!['ko','champion'].includes(s.stage)||!['single','double'].includes(s.ko?.format)||!s.publicKO?.length)return false;}else if(!foundScore)return false;",'API direct KO score check');
 for(const [file,source] of [[path,html],[homePath,home]])for(const [i,m] of [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())if(m[1].trim())new vm.Script(m[1],{filename:file+'#'+i});
 new vm.Script(p);new vm.Script(d);
 for(const [file,source] of [[path,html],[homePath,home],[pub,p],[pdf,d],[api,a]])fs.writeFileSync(file,source);
 console.log('PASS standalone Knockout integrated into native registration, P5KO, reporting and Home');
})();
