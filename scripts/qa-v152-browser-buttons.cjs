/* PADEL 5IVE v1.5.2 — actual headless Chromium button & touch regression.
   Isolated localhost only. No browser packages, online sessions or Cloud writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),net=require('node:net');
const {spawn,spawnSync}=require('node:child_process'),{setTimeout:nap}=require('node:timers/promises');
let server,chrome,ws,profile;
const webRoot=path.resolve('public');
async function cleanup(){try{ws?.close()}catch{}try{chrome?.kill('SIGKILL')}catch{}try{server?.close()}catch{}try{if(profile)fs.rmSync(profile,{recursive:true,force:true})}catch{}}
async function startup(){
 server=http.createServer((req,res)=>{
  try{
   const reqPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(webRoot,'.'+reqPath);
   if(!file.startsWith(webRoot+path.sep)){res.writeHead(403);return res.end();}
   const f=fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
   const ext=path.extname(f),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'}[ext]||'text/plain';
   res.writeHead(200,{'content-type':type+'; charset=utf-8','cache-control':'no-store'});
   fs.createReadStream(f).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let bin;
 for(const b of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const w=spawnSync('which',[b],{encoding:'utf8'});if(w.status===0){bin=w.stdout.trim();break}}
 assert(bin,'Missing browser executable for true UI regression');
 profile=fs.mkdtempSync(path.join(os.tmpdir(),'padel5ive-browser-'));
 const debuggingPort=await new Promise((ok,fail)=>{const probe=net.createServer();probe.on('error',fail);probe.listen(0,'127.0.0.1',()=>{const n=probe.address().port;probe.close(()=>ok(n))})});
 let chromeErrors='';
 chrome=spawn(bin,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--no-first-run','--disable-background-networking','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debuggingPort,'--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 chrome.stderr?.on('data',chunk=>{chromeErrors+=String(chunk);if(chromeErrors.length>12000)chromeErrors=chromeErrors.slice(-12000)});
 let tabs;
 for(let i=0;i<140;i++){
  await nap(160);
  try{
   const res=await fetch('http://127.0.0.1:'+debuggingPort+'/json/list',{signal:AbortSignal.timeout(700)});
   if(res.ok){tabs=await res.json();if(tabs.some(x=>x.type==='page'))break}
  }catch{}
  if(chrome.exitCode!==null)throw Error('Chromium exited ('+chrome.exitCode+'): '+chromeErrors.slice(-2000));
 }
 assert(tabs?.length,'Chrome debugging port unavailable: '+bin+' ('+chrome.exitCode+'). '+chromeErrors.slice(-2200));
 const tab=tabs.find(t=>t.type==='page');assert(tab?.webSocketDebuggerUrl);
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
 let id=0;const pending=new Map();
 ws.addEventListener('message',e=>{const msg=JSON.parse(e.data),p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result)});
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const k=++id;pending.set(k,{resolve,reject});ws.send(JSON.stringify({id:k,method,params}))});
 await cmd('Page.enable');await cmd('Runtime.enable');
 return {cmd,url:'http://127.0.0.1:'+server.address().port+'/modes/unified/index.html'};
}
async function main(){
 const {cmd,url}=await startup();
 async function val(expr){const r=await cmd('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('Browser JS '+JSON.stringify(r.exceptionDetails));return r.result.value}
 const state=()=>val('P5App.getState()'),isModal=()=>val('!!document.querySelector("#p5-modal-root .p5-v2-modal")'),isStats=()=>val('!!document.querySelector("#p5ps-layer")');
 async function until(f,msg){for(let i=0;i<90;i++){try{if(await f())return}catch{}await nap(160)}let debug='';try{debug=JSON.stringify(await val('({stage:P5App?.getState()?.stage,body:document.querySelector("#americano")?.innerHTML?.slice(0,320),alert:document.querySelector("#toast")?.textContent,hasStats:!!document.querySelector(".p5-b41-leaderboard"),ready:document.readyState})'))}catch(e){debug=String(e)}const renderError=await val('(()=>{try{P5UI.render(P5App.getState());return "render successful"}catch(e){return e.stack||e.message}})()');throw Error('UI not ready: '+msg+' debug '+debug+' render '+renderError)}
 async function size(w,h){await cmd('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:w<700?3:2,mobile:w<700});await cmd('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})}
 async function tap(sel){
  const loc=await val('(()=>{const e=document.querySelector('+JSON.stringify(sel)+');if(!e)return {missing:true};e.scrollIntoView({block:"center",inline:"nearest",behavior:"instant"});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);return {x,y,visible:r.width>0&&r.height>0,covered:!(h&&(h===e||e.contains(h))),hit:h?.outerHTML?.slice(0,120)}})()');
  assert(!loc.missing,'Missing button '+sel);assert(loc.visible,'Hidden button '+sel);assert(!loc.covered,'Covered button '+sel+' by '+loc.hit);
  await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:loc.x,y:loc.y}]});
  await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await nap(200);
 }
 const name='#americano .p5-b41-leaderboard .live-standings tbody button.mc38-rename[data-act="manage-participant"]';
 const active='#p5-modal-root .p5-b31-status-choice [data-status="active"]',sitout='#p5-modal-root .p5-b31-status-choice [data-status="sitout"]';
 const save='#p5-modal-root [data-act="modal-save"]',cancel='#p5-modal-root [data-act="modal-cancel"]';
 await size(390,844);await cmd('Page.navigate',{url});
 await until(()=>val('!!window.P5App && !!window.P5EngineRegistry'),'boot');
 await until(()=>val('(()=>{try{return P5App.getState()?.version===24}catch{return false}})()'),'canonical app state initialized');
 // Setup parity: Match Flow starts blank and takes entire row, just like the other fields.
 await until(()=>val('P5App.getState().stage==="setup"&&!!document.querySelector("#setup-game")'),'initial setup');
 await val('(()=>{const game=document.querySelector("#setup-game");game.value="Americano";game.dispatchEvent(new Event("change",{bubbles:true}));})()');
 await until(()=>val('!!document.querySelector("#p5-match-flow-field")&&!document.querySelector("#p5-match-flow-field").hidden'),'Americano Match Flow visible');
 const flowSetup=await val('(()=>{const label=document.querySelector("#p5-match-flow-field"),court=document.querySelector("#setup-courts");return {empty:document.querySelector("#setup-match-flow").value==="",labelWidth:label.getBoundingClientRect().width,courtWidth:court.getBoundingClientRect().width,disabled:document.querySelector("[data-act=setup-next]").disabled}})()');
 assert(flowSetup.empty,'Fresh Americano must not preselect Match Flow');
 assert(flowSetup.labelWidth>flowSetup.courtWidth*1.5,'Match Flow takes full responsive setup row, no right-side gap');
 assert(flowSetup.disabled,'Continue is disabled without required Match Flow');

 const flowLabels=await val('(()=>({choices:Array.from(document.querySelectorAll("#setup-match-flow option")).map(x=>({value:x.value,label:x.textContent.trim()})),hint:document.querySelector("#p5-match-flow-field .p5-match-flow-help")?.textContent.trim()}))()');
 assert.equal(flowLabels.choices.find(x=>x.value==='rounds')?.label,'By Rounds');
 assert.equal(flowLabels.choices.find(x=>x.value==='continuous')?.label,'Court by Court');
 assert.equal(flowLabels.hint,'Choose how matches progress.');
 await val('(()=>{const flow=document.querySelector("#setup-match-flow");flow.value="rounds";flow.dispatchEvent(new Event("change",{bubbles:true}));})()');
 assert.equal(await val('document.querySelector("#p5-match-flow-field .p5-match-flow-help")?.textContent.trim()'),'All courts finish before the next round starts.');
 await val('(()=>{const flow=document.querySelector("#setup-match-flow");flow.value="continuous";flow.dispatchEvent(new Event("change",{bubbles:true}));})()');
 assert.equal(await val('document.querySelector("#p5-match-flow-field .p5-match-flow-help")?.textContent.trim()'),'Next match starts when a court becomes free.');
 console.log('PASS Match Flow setup: By Rounds / Court by Court, clear contextual one-line descriptions');

 await val('(()=>{const f=document.querySelector("#setup-match-flow");f.value="rounds";f.dispatchEvent(new Event("change",{bubbles:true}));const g=document.querySelector("#setup-game");g.value="Mexicano";g.dispatchEvent(new Event("change",{bubbles:true}));})()');
 assert(await val('document.querySelector("#p5-match-flow-field").hidden'),'Mexicano has no Continuous option');
 console.log('PASS setup: full-width Match Flow, blank default and Americano-only option');

 const fixture=[
  '(()=>{const s=P5App.getState(),roster=Array.from({length:8},(_,i)=>({id:i+1,names:["QA Player "+(i+1)]}));',
  'const rounds=P5EngineRegistry.engine("individual-americano").build(roster.map(x=>x.id),2,Math.random);',
  'Object.assign(s,{stage:"stage1",mode:"individual-americano",session:"QA Local Only",date:"2026-11-17",courts:2,matchFormat:"total5",koFormat:"none",',
  'roster,nextId:9,rounds,initialSchedule:JSON.parse(JSON.stringify(rounds)),initialCourts:2,currentRound:0,viewRound:0,sitout:[],sitoutPending:{},',
  'arrival:Object.fromEntries(roster.map(x=>[x.id,true]))});localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return rounds.length})()'
 ].join('');
 assert((await val(fixture))>0,'Failed to create isolated fixture');
 await until(()=>val('P5App?.getState()?.stage==="stage1"&&!!document.querySelector(".p5-b41-leaderboard")'),'stage1');
 await until(()=>val('!!document.querySelector('+JSON.stringify(name)+')'),'leaderboard names');
 await tap('[data-p5-pr36-tab="leaderboard"]');
 assert.equal(await val('document.querySelector("#americano").dataset.p5Pr36View'),'leaderboard','iPhone leaderboard tab must actually be selected');
 const id=await val('Number(document.querySelector('+JSON.stringify(name)+').dataset.id)');assert(Number.isInteger(id));
 const selectedName=name+'[data-id="'+id+'"]';
 await tap('#americano .p5-lb-privacy-toggle');
 assert(await val('document.querySelector(".p5-b41-leaderboard").classList.contains("p5-lb-private")'));
 await tap('#americano .p5-lb-privacy-toggle');
 assert(!(await val('document.querySelector(".p5-b41-leaderboard").classList.contains("p5-lb-private")')));
 console.log('PASS iPhone Privacy HIDE / SHOW');
 await tap(selectedName);await until(isStats,'player stats');await tap('[data-p5ps-status]');await until(isModal,'participation modal');
 assert.equal(await val('document.querySelector("#p5-modal-root").dataset.p5psContext'),'participation');
 async function participationHidden(){
  assert.equal(await val('getComputedStyle(document.querySelector("#p5-modal-root .p5-b3-participant-editor>label")).display'),'none','Name label exposed during Participation');
 }
 await participationHidden();
 assert.equal(await val('document.querySelectorAll("#p5-modal-root .p5-b31-dual-choice button").length'),2,'Active / Sit Out must both be real buttons');
 await tap(active);assert.equal(await val('document.querySelector('+JSON.stringify(active)+').getAttribute("aria-pressed")'),'true');
 await tap(sitout);assert.equal(await val('document.querySelector('+JSON.stringify(sitout)+').getAttribute("aria-pressed")'),'true');
 assert.equal((await state()).availabilityById[id],'ACTIVE','Draft changed canonical status before Confirm');
 await tap(cancel);await until(async()=>!(await isModal()),'Cancel participation');
 assert.equal((await state()).availabilityById[id],'ACTIVE','Cancel persisted draft');
 console.log('PASS iPhone Active / Sit Out / Cancel, no saved draft');
 await tap(selectedName);await until(isStats,'stats reopen');await tap('[data-p5ps-status]');await until(isModal,'participation reopen');
 await participationHidden();await tap(save);await until(async()=>!(await isModal()),'Confirm');
 assert.equal((await state()).availabilityById[id],'SIT_OUT','Confirm did not persist canonical Sit Out');
 assert((await state()).sitout.includes(id),'Sit Out must be excluded from active eligibility');
 assert((await state()).rounds.every(r=>r.matches.every(m=>!m||!m.confirmed)),'Confirmed scores changed from participation');
 console.log('PASS iPhone Confirm Participation, next-round queue and score protection');
 await tap(selectedName);await until(isStats,'stats for edit');await tap('[data-p5ps-edit]');await until(isModal,'edit name');
 assert.equal(await val('document.querySelector("#p5-modal-root").dataset.p5psContext'),'name');
 assert.equal(await val('getComputedStyle(document.querySelector("#p5-modal-root .p5-b31-status-editor")).display'),'none');
 await val('(()=>{const e=document.querySelector("#p5-modal-root [data-rename-id]");e.value="QA Name Updated";e.dispatchEvent(new Event("input",{bubbles:true}))})()');
 await tap(save);await until(async()=>!(await isModal()),'save name');
 assert.equal((await state()).roster.find(x=>x.id===id).names[0],'QA Name Updated');
 assert.equal((await state()).availabilityById[id],'SIT_OUT','Edit Name changed canonical availability');
 console.log('PASS iPhone Edit Name / Save, participation preserved');
 await tap(selectedName);await until(isStats,'stats close');await tap('.p5ps-close[data-p5ps-close]');await until(async()=>!(await isStats()),'close X');
 await tap('[data-p5-pr36-tab="rounds"]');
 if(await val('!!document.querySelector("#americano [data-act=score]")')){
  const before=JSON.stringify((await state()).rounds);
  await tap('#americano [data-act="score"]');await until(isModal,'score modal');
  const roundsModal=await val(`(()=>{
   const root=document.querySelector('#p5-modal-root .p5-cont-score-clean');
   const hint=root?.querySelector('#p5-score-dual-hint');
   const labels=root?.querySelectorAll('.p5-polish-team-label')||[];
   const duplicate=root?.querySelector('#modal-error');
   return {clean:!!root, hint:hint?.textContent?.trim(), labelsHidden:Array.from(labels).every(x=>getComputedStyle(x).display==='none'), formatHidden:!!duplicate&&getComputedStyle(duplicate).display==='none', formatCount:root?.querySelectorAll('.p5-polish-entry-overline span').length};
  })()`);
  assert(roundsModal.clean&&roundsModal.hint==='Enter one score; the other updates.'&&roundsModal.labelsHidden&&roundsModal.formatHidden&&roundsModal.formatCount===1,'By Rounds Americano must use the same clean score entry modal as Continuous: '+JSON.stringify(roundsModal));
  console.log('PASS By Rounds Americano score modal: single format, no Side A/B or duplicate help');
  await tap(cancel);await until(async()=>!(await isModal()),'score cancel');
  assert.equal(JSON.stringify((await state()).rounds),before,'Score Cancel modified matches');
  console.log('PASS iPhone Score Entry / Cancel');
 }
 await size(1180,820);await nap(250);
 await tap(selectedName);await until(isStats,'iPad stats');await tap('[data-p5ps-status]');await until(isModal,'iPad participation');
 await participationHidden();await tap(active);
 assert.equal(await val('document.querySelector('+JSON.stringify(active)+').getAttribute("aria-pressed")'),'true');
 await tap(cancel);await until(async()=>!(await isModal()),'iPad Cancel');
 console.log('PASS iPad landscape Participation Active / Cancel');

 // Verify the same Stage 1 score-entry presentation in all currently registered
 // Mexicano pairing modes. Keep the real scoring rules (Total and First-to) intact.
 await size(390,844);
 for(const mode of ['fp-mexicano','individual-mexicano','structured-mexicano']){
  const fmt=mode==='fp-mexicano'?'first4':'total5';
  await val('(()=>{const s=P5App.getState(),mode='+JSON.stringify(mode)+',fmt='+JSON.stringify(fmt)+';'+
   'const fixed=mode==="fp-mexicano",structured=mode==="structured-mexicano";'+
   'const roster=Array.from({length:8},(_,i)=>({id:i+1,names:fixed?["Mex "+(i+1)+" A","Mex "+(i+1)+" B"]:["Mex "+(i+1)],...(structured?{group:i<4?"A":"B"}:{})}));'+
   'const pairs=fixed?[[[1],[2]],[[3],[4]]]:structured?[[[1,5],[2,6]],[[[3,7],[4,8]]][0]]:[[[1,2],[3,4]],[[5,6],[7,8]]];'+
   'const matches=pairs.map((teams,i)=>({id:"mex-qa-"+i,teams,court:i+1,score:null,confirmed:false}));'+
   'const rounds=[{index:0,matches,eligibleIds:roster.map(x=>x.id)}];'+
   'Object.assign(s,{stage:"stage1",mode,matchFlow:"rounds",continuous:null,roster,nextId:9,courts:2,rounds,'+
   'currentRound:0,viewRound:0,initialSchedule:JSON.parse(JSON.stringify(rounds)),initialCourts:2,'+
   'sitout:[],sitoutPending:{},availabilityById:Object.fromEntries(roster.map(p=>[p.id,"ACTIVE"])),'+
   'arrival:Object.fromEntries(roster.map(p=>[p.id,true])),session:"Mexicano Score QA",date:"2026-11-19",matchFormat:fmt});'+
   'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()');
  await until(()=>val('P5App.getState().mode==='+JSON.stringify(mode)+'&&!!document.querySelector("#americano [data-act=score]")'),'Mexicano mode ready: '+mode);
  await tap('#americano [data-act="score"]');await until(isModal,'Mexicano score entry: '+mode);
  const view=await val(`(()=>{
   const root=document.querySelector('#p5-modal-root .p5-cont-score-clean');
   const format=root?.querySelector('.p5-polish-entry-overline span')?.textContent?.trim();
   const hint=root?.querySelector('#p5-score-dual-hint')?.textContent?.trim();
   const labels=root?.querySelectorAll('.p5-polish-team-label')||[];
   const duplicate=root?.querySelector('#modal-error');
   return {clean:!!root,format,hint,sideLabelsHidden:Array.from(labels).every(x=>getComputedStyle(x).display==='none'),duplicateHidden:!!duplicate&&getComputedStyle(duplicate).display==='none'};
  })()`);
  const expected=fmt==='total5'?'Enter one score; the other updates.':'Choose the losing score; winner scores 4.';
  assert(view.clean&&view.format===(fmt==='total5'?'TOTAL OF 5':'FIRST TO 4')&&view.hint===expected&&view.sideLabelsHidden&&view.duplicateHidden,'Mexicano shared score modal regression '+mode+': '+JSON.stringify(view));
  await tap(cancel);await until(async()=>!(await isModal()),'Mexicano cancel: '+mode);
  console.log('PASS Mexicano '+mode+' score input: shared compact UI, single format and original validation');
 }


 await until(()=>val('typeof window.P5App!=="undefined" && P5App.getState().stage==="stage1"'),'browser ready after Mexicano loop');
 // v0.1 isolated substitution acceptance: 12 players / 2 courts has resting substitutes.
 await size(1180,820);
 await val([
  '(()=>{const s=P5App.getState(),roster=Array.from({length:12},(_,i)=>({id:i+1,names:["SUB PLAYER "+(i+1)]}));',
  'const rounds=P5EngineRegistry.engine("individual-americano").build(roster.map(p=>p.id),2,Math.random);',
  'Object.assign(s,{stage:"stage1",mode:"individual-americano",matchFlow:"rounds",continuous:null,roster,nextId:13,courts:2,',
  'rounds,currentRound:0,viewRound:0,initialSchedule:JSON.parse(JSON.stringify(rounds)),initialCourts:2,',
  'sitout:[],sitoutPending:{},availabilityById:Object.fromEntries(roster.map(p=>[p.id,"ACTIVE"])),pendingParticipants:[],',
  'session:"SUB QA LOCAL",date:"2026-11-18",matchFormat:"total5"});',
  'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()'
 ].join(''));
 await until(()=>val('!!document.querySelector("#americano .p5-person-action")'),'player name actions in court card');
 const original=await state();
 const first=original.rounds[0].matches.filter(Boolean)[0],targetMatchId=first.id;
 const future=JSON.stringify(original.rounds.slice(1));
 const selector='#americano .p5-match-names .p5-person-action';
 await tap(selector);await until(isModal,'Replace Player modal');
 assert.equal(await val('document.querySelector("#p5-modal-root .p5-v2-modal h2")?.textContent'),'REPLACE PLAYER');
 const available=await val('Array.from(document.querySelectorAll("#p5-replacement-select option")).filter(x=>x.value&&!x.disabled).map(x=>x.value)');
 assert(available.length>=1,'12 players / 2 courts should include eligible resting substitutes');
 const chosen=available[0],chosenId=Number(chosen.split(':')[0]);
 await val('(()=>{document.querySelector("#p5-replacement-select").value='+JSON.stringify(chosen)+'})()');
 await tap('#p5-modal-root [data-act="replace-save"]');await until(async()=>!(await isModal()),'one-match replacement confirmed');
 const replaced=await state(),current=replaced.rounds[0].matches.find(m=>m?.id===targetMatchId);
 assert(current.substitutions?.length===1,'Substitution metadata recorded');
 assert.equal(current.teams[0][0],chosenId,'Individual replacement changes this one fixture');
 assert.equal(JSON.stringify(replaced.rounds.slice(1)),future,'No full reshuffle of remaining matches');
 assert(replaced.rounds.every(rd=>rd.matches.filter(Boolean).every(m=>!m.confirmed)),'Substitution cannot fabricate confirmed scores');
 console.log('PASS one-match replacement: tap name, eligible resting player, Save, no future reshuffle');
 assert.equal(current.teams[0][1],first.teams[0][1],'Replacement must NOT overwrite teammate');
 assert.equal(current.substitutions[0].slot,0,'Replacement metadata stays on selected player slot only');
 const normalCardHeight=await val('document.querySelector("#americano .court.p5sm-card")?.getBoundingClientRect().height');
 assert(normalCardHeight>0,'Round-by-round scorecard size reference available');
 const firstCardSelector='#americano .p5-match-names';
 assert.equal(await val('document.querySelector('+JSON.stringify(firstCardSelector)+')?.querySelectorAll(".p5-sub-badge").length'),1,'SUB badge must appear only on replaced name, not both teammates');
 // Replace again within the SAME fixture; no global one-time limit.
 await tap(selector);await until(isModal,'second replacement in same match');
 const nextOptions=await val('Array.from(document.querySelectorAll("#p5-replacement-select option")).filter(x=>x.value&&!x.disabled).map(x=>x.value)');
 const second=nextOptions.find(x=>x!==chosen);
 assert(second,'At least one different resting replacement should remain');
 await val('(()=>{document.querySelector("#p5-replacement-select").value='+JSON.stringify(second)+'})()');
 await tap('#p5-modal-root [data-act="replace-save"]');await until(async()=>!(await isModal()),'second replacement saved');
 const repeated=await state(),replacedAgain=repeated.rounds[0].matches.find(m=>m?.id===targetMatchId);
 assert.equal(replacedAgain.substitutions.length,1,'Repeated replacement updates same slot instead of duplicating substitution rows');
 assert.equal(replacedAgain.teams[0][0],Number(second.split(':')[0]),'Second replacement takes effect in target match');
 assert.equal(replacedAgain.teams[0][1],first.teams[0][1],'Original teammate preserved after repeated replacement');
 assert.equal(JSON.stringify(repeated.rounds.slice(1)),future,'Repeated replacements must not reshuffle future rounds');
 console.log('PASS repeated per-match replacement, teammate identity, single SUB badge and stable remaining rounds');

 // Cancel replacement from score entry must restore selected draft score.
 await tap('#americano .p5-score-tap');await until(isModal,'native score entry after replacement');
 const hasDual=await val('!!document.querySelector("#p5-score-a")');
 assert(hasDual,'Latest native score selector must remain present');
 await val('(()=>{document.querySelector("#p5-score-a").value="3";document.querySelector("#p5-score-b").value="2"})()');
 await tap('#p5-modal-root .p5-person-action');await until(()=>val('!!document.querySelector("#p5-replacement-select")'),'replace from score entry');
 await tap('#p5-modal-root [data-act="replace-cancel"]');await until(()=>val('!!document.querySelector("#p5-score-a")'),'score editor restored after cancel');
 assert.equal(await val('document.querySelector("#p5-score-a").value'),'3','Score draft A retained');
 assert.equal(await val('document.querySelector("#p5-score-b").value'),'2','Score draft B retained');
 await tap('#p5-modal-root [data-act="modal-cancel"]');await until(async()=>!(await isModal()),'close replacement score draft');
 console.log('PASS in-scoreboard replacement opens and Cancel restores draft inputs');

 // v0.1 Continuous Americano: fixed pairs, 2 courts, strict 15 unique fixtures.
 await size(390,844);
 await val([
  '(()=>{const s=P5App.getState(),roster=Array.from({length:6},(_,i)=>({id:i+1,names:["PAIR "+(i+1)+" A","PAIR "+(i+1)+" B"]}));',
  'Object.assign(s,{stage:"stage1",mode:"fp-americano",matchFlow:"continuous",roster,nextId:7,courts:2,',
  'rounds:[],currentRound:0,viewRound:0,sitout:[],sitoutPending:{},pendingParticipants:[],continuous:null,',
  'availabilityById:Object.fromEntries(roster.map(p=>[p.id,"ACTIVE"])),session:"CONTINUOUS QA LOCAL",',
  'date:"2026-11-18",matchFormat:"total5",initialSchedule:[],initialCourts:2});',
  'P5Continuous.create(s,[]);localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()'
 ].join(''));
 await until(()=>val('!!document.querySelector("#americano .p5-cont-stage")'),'continuous shared dashboard');
 await until(()=>val('!!document.querySelector("#americano [data-p5-pr36-tab]")'),'native continuous mobile tab bar');
 assert(await val('document.querySelector("#americano").classList.contains("p5-pr36-mobile-active")'),'Continuous must use native iPhone Rounds/Leaderboard tabs');
 await tap('#americano [data-p5-pr36-tab="leaderboard"]');
 assert.equal(await val('document.querySelector("#americano").dataset.p5Pr36View'),'leaderboard');
 await tap('#americano [data-p5-pr36-tab="rounds"]');
 assert.equal(await val('document.querySelector("#americano").dataset.p5Pr36View'),'rounds');
 console.log('PASS Continuous iPhone native Rounds/Leaderboard navigation');

 const compactTitle=await val('document.querySelector("#americano .p5-cont-stage .p5-v26-round-title h2")?.textContent?.trim()');
 assert.equal(compactTitle,'CONTINUOUS ROUND','Continuous header must not repeat cycle, match format or court scoring');
 // Exercise Structured Pairing markup under real iPhone CSS. Two players must sit on a single row.
 const structuredLayout=await val(`(()=>{
  const host=document.querySelector('#americano .p5-cont-courts');
  const probe=document.createElement('div'); probe.className='court p5sm-card';
  probe.style.cssText='position:absolute;visibility:hidden;width:310px;left:0;top:0';
  probe.innerHTML='<div class="scorepair"><div class="pairname p5-match-names"><button class="p5-person-action"><span class="p5-person-label">1</span></button><span class="p5-name-join">&amp;</span><button class="p5-person-action"><span class="p5-person-label">A</span></button></div></div>';
  host.appendChild(probe);
  const names=probe.querySelectorAll('.p5-person-action');
  const first=names[0].getBoundingClientRect(),second=names[1].getBoundingClientRect(),row=probe.querySelector('.p5-match-names').getBoundingClientRect();
  const result={sameRow:Math.abs(first.top-second.top)<3,ordered:second.left>first.right,rowHeight:row.height};
  probe.remove();return result;
 })()`);
 assert(structuredLayout.sameRow&&structuredLayout.ordered&&structuredLayout.rowHeight<65,'Structured partners must display 1 & A on a single horizontal line: '+JSON.stringify(structuredLayout));
 console.log('PASS Continuous iPhone compact title and side-by-side Structured Pairing names');
 assert(await val('document.querySelector("#americano .p5-cont-history .p5-cont-round-head strong")?.textContent?.trim()')==='MATCH HISTORY','History header must not repeat the current Cycle');
 assert.equal(await val('document.querySelectorAll("#americano .p5-cont-cycle-buttons").length'),0,'Single-cycle Match History must not waste space on a Cycle picker');
 console.log('PASS Continuous Cycle 1 uses simplified Match History without redundant cycle selector');


 const start=await state();
 assert.equal(start.continuous.total,15,'6 pairs must play 15 unique fixtures');
 assert.equal(start.rounds.flatMap(r=>r.matches).filter(Boolean).length,2,'Two active courts dispatched');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'Initial continuous scheduling valid');
 // iPhone substitution visual regression: fixed partner keeps a single SUB badge,
 // names remain within court cards and replacement participant stays physically busy.
 const fixedStart=await state(),fixedTarget=fixedStart.rounds.flatMap(r=>r.matches).find(m=>m&&!m.confirmed);
 const queuedFixed=JSON.stringify(fixedStart.continuous.queue),originalFixedId=fixedTarget.teams[0][0];
 await tap('#americano .p5-cont-courts .p5-person-action');
 await until(isModal,'iPhone fixed-partner replacement modal');
 assert.equal(await val('document.querySelector("#p5-modal-root .p5-v2-modal h2")?.textContent'),'REPLACE FIXED PAIR','Fixed Partner replacement must use whole-pair selector');
 const readyFixed=await val('Array.from(document.querySelectorAll("#p5-replacement-select option")).filter(x=>x.value&&!x.disabled).map(x=>x.value)');
 assert(readyFixed.length,'Resting fixed-pair players available for substitution');
 const picked=readyFixed[0],pickedId=Number(picked.split(':')[0]);
 await val('(()=>{document.querySelector("#p5-replacement-select").value='+JSON.stringify(picked)+'})()');
 await tap('#p5-modal-root [data-act="replace-save"]');await until(async()=>!(await isModal()),'fixed partner substitution confirmed');
 const fixedAfter=await state(),fixedChanged=fixedAfter.rounds.flatMap(r=>r.matches).find(m=>m?.id===fixedTarget.id);
 assert.equal(fixedChanged.teams[0][0],pickedId,'Fixed substitution replaces the complete pair ID');
 assert.notEqual(fixedChanged.teams[0][0],originalFixedId,'Original pair removed from selected fixture only');
 assert.equal(fixedChanged.substitutions?.filter(x=>x.wholePair).length,1,'Whole pair substitution recorded only once');
 assert.equal(JSON.stringify(fixedAfter.continuous.queue),queuedFixed,'Fixed pair replacement must not reshuffle remaining cycle fixtures');
 assert.equal(await val('document.querySelector("#americano .p5-pair-replace")?.innerText.includes("PAIR "+'+pickedId+')'),true,'Replacement renders both players from the new fixed pair');
 console.log('PASS Fixed Partner whole pair replacement, correct names, one-match scope and queue preserved');

 assert.equal(await val('document.querySelectorAll("#americano .p5-cont-courts .p5-sub-badge").length'),1,'Only one substituted player may get a SUB badge');
 assert(await val('P5Continuous.busyIds(P5App.getState()).has('+pickedId+')'),'Substitute is marked busy for all courts');
 const continuousHeight=await val('document.querySelector("#americano .p5-cont-courts .court.p5sm-card")?.getBoundingClientRect().height');
 console.log('SCORECARD PARITY HEIGHT',JSON.stringify({rounds:normalCardHeight,continuous:continuousHeight}));
 assert(continuousHeight<=normalCardHeight*1.15+20,'Continuous scorecards must be as compact as native round-by-round cards');
 const tidyCards=await val('Array.from(document.querySelectorAll("#americano .p5-cont-courts .court")).every(x=>x.scrollWidth<=x.clientWidth+3)');
 assert(tidyCards,'Continuous scorecards must not overflow after a fixed-player substitution');
 console.log('PASS iPhone Continuous SUB: correct player slot, no overflow and no court double-booking');

 await tap('#americano .p5-score-tap');await until(isModal,'continuous score entry');

 const cleanModal=await val(`(()=>{
   const root=document.querySelector('#p5-modal-root .p5-cont-score-clean');
   const hint=root?.querySelector('#p5-score-dual-hint');
   const labels=root?.querySelectorAll('.p5-polish-team-label')||[];
   const formatError=root?.querySelector('#modal-error');
   return {scoped:!!root,hint:hint?.textContent?.trim(),sideLabelsHidden:Array.from(labels).every(x=>getComputedStyle(x).display==='none'),formatHintHidden:!!formatError&&getComputedStyle(formatError).display==='none'};
 })()`);
 assert(cleanModal.scoped&&cleanModal.hint==='Enter one score; the other updates.'&&cleanModal.sideLabelsHidden&&cleanModal.formatHintHidden,'Continuous score modal should show only a single format and one helper line: '+JSON.stringify(cleanModal));
 console.log('PASS Continuous score modal: no Side A/B, duplicate format or verbose help');

 const nameGeometry=await val('Array.from(document.querySelectorAll("#p5-modal-root .p5-score-dual-team strong")).map(x=>({border:getComputedStyle(x).borderTopWidth,w:x.getBoundingClientRect().width}))');
 assert(nameGeometry.length===2&&nameGeometry.every(x=>x.border==="0px"),'Score modal team names must be borderless');

 await val('(()=>{const a=document.querySelector("#p5-score-a"),b=document.querySelector("#p5-score-b");a.value="3";b.value="2";a.dispatchEvent(new Event("change",{bubbles:true}));b.dispatchEvent(new Event("change",{bubbles:true}))})()');
 await tap('#p5-modal-root [data-act="modal-save"]');
 await until(()=>val('!!document.querySelector("#p5-modal-root .p5-cont-score-review")'),'Continuous score review');
 assert.equal((await state()).rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).length,0,'Review step cannot auto-save a result');
 assert.equal((await state()).rounds.flatMap(r=>r.matches).filter(m=>m&&!m.confirmed).length,2,'Review cannot release the court');
 await tap('#p5-modal-root [data-act="continuous-score-edit"]');
 assert(!(await val('!!document.querySelector("#p5-modal-root .p5-cont-score-review")')),'Edit returns to score selection');
 await tap('#p5-modal-root [data-act="modal-save"]');await until(()=>val('!!document.querySelector("#p5-modal-root .p5-cont-score-review")'),'score review again');
 await tap('#p5-modal-root [data-act="continuous-score-confirm"]');await until(async()=>!(await isModal()),'confirmed continuous result');
 const after=await state();
 assert.equal(after.rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).length,1,'Confirmed fixture retained');
 assert.equal(after.rounds.flatMap(r=>r.matches).filter(m=>m&&!m.confirmed).length,2,'Finished court immediately receives next fixture');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'No duplicate opponent or simultaneous assignment');
 // Team Showdown-style history: edit one confirmed score, keep other fixtures untouched.
 await tap('#americano [data-act="continuous-history-toggle"]');
 assert(await val('!!document.querySelector("#americano .p5-cont-history-panel:not([hidden])")'),'Match history drawer opens');
 const editButton='#americano .p5-cont-result-area button[data-act="score"]';
 await tap(editButton);await until(isModal,'historical score edit modal');
 const beforeEdit=await state();
 const beforeFixtures=beforeEdit.rounds.flatMap(r=>r.matches).filter(Boolean).map(m=>({id:m.id,teams:m.teams,score:m.score,confirmed:m.confirmed}));
 const editedId=beforeEdit.ui.modal.match.id;
 await val('(()=>{const a=document.querySelector("#p5-score-a"),b=document.querySelector("#p5-score-b");a.value="2";b.value="3";a.dispatchEvent(new Event("change",{bubbles:true}));b.dispatchEvent(new Event("change",{bubbles:true}))})()');
 await tap('#p5-modal-root [data-act="modal-save"]');await until(()=>val('!!document.querySelector("#p5-modal-root .p5-cont-score-review")'),'history score review');
 assert.equal((await state()).rounds.flatMap(r=>r.matches).find(m=>m?.id===editedId).score[0],3,'Historical score must remain saved until second confirm');
 await tap('#p5-modal-root [data-act="continuous-score-confirm"]');await until(async()=>!(await isModal()),'history correction confirmed');
 const corrected=await state();
 const afterFixtures=corrected.rounds.flatMap(r=>r.matches).filter(Boolean);
 assert.equal(afterFixtures.length,beforeFixtures.length,'Correcting history cannot dispatch or reshuffle fixtures');
 assert.equal(afterFixtures.find(m=>m.id===editedId).score[0],2,'Edit Score updates historical result');
 assert.equal(afterFixtures.find(m=>m.id===editedId).score[1],3,'Edit Score updates second team result');
 assert(afterFixtures.filter(m=>m.id!==editedId).every((m,i)=>JSON.stringify(m.teams)===JSON.stringify(beforeFixtures.filter(x=>x.id!==editedId)[i].teams)),'Score correction preserves all other teams');
 console.log('PASS Continuous Match History: review, correction and no remaining-round mutation');

 await tap('#americano [data-act="continuous-pause"]');
 assert.equal((await state()).continuous.paused,true,'Pause new dispatch');
 console.log('PASS iPhone Continuous: live dispatch per court, persisted score, unique opponents, pause');
 await size(1180,820);
 assert(await val('!!document.querySelector(".p5-cont-stage .p5-cont-courts")'),'iPad shared continuous dashboard rendered');
 console.log('PASS iPad landscape Continuous shared court layout');

 // The user must be able to finish a strict cycle then browse/edit it in Cycle 2.
 await val([
  '(()=>{const s=P5App.getState();s.continuous.paused=false;',
  'let steps=0;while(!P5Continuous.complete(s)&&steps++<200){',
  'const next=P5Continuous.active(s)[0];if(!next)break;next.score=[3,2];next.confirmed=true;P5Continuous.dispatch(s);}',
  'if(!P5Continuous.complete(s))throw Error("Could not complete Cycle 1");',
  'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()'
 ].join(''));
 await until(()=>val('!!document.querySelector("#americano .p5-cont-cycle-complete")'),'Cycle 1 completed buttons');
 const finishChoices=await val('Array.from(document.querySelectorAll("#americano .p5-cont-final-actions button")).map(x=>x.dataset.act)');
 assert.deepEqual(finishChoices,['continuous-next-cycle','continuous-finish','continuous-stage2'],'Three separate terminal choices required after complete cycle');
 const cycleOne=await state();
 assert.equal(cycleOne.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===1&&m.confirmed).length,15,'Full 15-fixture Cycle 1 preserved');
 await tap('#americano [data-act="continuous-next-cycle"]');
 await until(()=>val('P5App.getState().continuous.cycle===2'),'cycle 2 start');
 const cycleTwo=await state();
 assert.equal(await val('document.querySelectorAll("#americano .p5-cont-cycle-buttons [data-act=continuous-history-cycle]").length'),2,'Cycle picker must return when multiple cycles exist');

 assert.equal(cycleTwo.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===1&&m.confirmed).length,15,'Cycle 1 confirmed fixtures retained into Cycle 2');
 assert.equal(cycleTwo.continuous.total,15,'Second cycle repeats strict full-cycle target');
 assert.equal(cycleTwo.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2&&!m.confirmed).length,2,'Second cycle immediately starts two eligible courts');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'Cycle 2 dispatch integrity');
 console.log('PASS Cycle 2 begins without deleting Cycle 1 history');

 // Arrival + Reshuffle must be available until the first score of each fresh cycle.
 assert(await val('!!document.querySelector("#americano .p5-cont-arrival")'),'Pre-match arrival panel visible on Cycle 2');
 if(!(await val('!!document.querySelector("#americano .p5-cont-arrival-body:not([hidden])")')))await tap('#americano [data-act="continuous-arrival-open"]');
 const previousHistory=JSON.stringify(cycleTwo.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===1));
 const cycleTwoKeys=await val('P5App.getState().continuous.queue.concat(P5Continuous.active(P5App.getState()).map(m=>({key:m.fixtureKey}))).map(x=>x.key).sort().join("|")');
 await tap('#americano [data-act="continuous-arrival-toggle"][data-id="1"]');
 assert.equal((await state()).arrival[1],false,'Pair 1 marked Not Arrived');
 assert(await val('P5Continuous.active(P5App.getState()).every(m=>!m.teams.flat().includes(1))'),'Not Arrived pair removed from current courts');
 assert.equal(JSON.stringify((await state()).rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===1)),previousHistory,'Reshuffle must never touch Cycle 1');
 await tap('#americano [data-act="continuous-arrival-toggle"][data-id="1"]');
 assert.equal((await state()).arrival[1],true,'Pair 1 can return Ready');
 await tap('#americano [data-act="continuous-reshuffle"]');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'Reshuffled opening schedule remains conflict-free');
 const newKeys=await val('P5App.getState().continuous.queue.concat(P5Continuous.active(P5App.getState()).map(m=>({key:m.fixtureKey}))).map(x=>x.key).sort().join("|")');
 assert.equal(newKeys,cycleTwoKeys,'Reshuffle reorders fixtures, never changes fixed pair opponent roster');
 console.log('PASS Cycle 2 Arrival & Reshuffle: preserved Cycle 1 history and all RR opponents');

 // Late pair can check in after scoring starts; reshuffle must be locked.
 await tap('#americano [data-act="continuous-arrival-toggle"][data-id="1"]');
 assert.equal((await state()).arrival[1],false,'Pre-score Not Arrived is saved immediately');
 assert.equal((await state()).arrival[1],false,'Fixture pair marked Not Arrived before first Cycle 2 score');
 await val([
  '(()=>{const s=P5App.getState(),m=P5Continuous.active(s)[0];',
  'if(!m||m.teams.flat().includes(1))throw Error("Late pair incorrectly assigned before check-in");',
  'if(s.arrival[1]!==false)throw Error("Arrival got reset before first score");',
  'm.score=[3,2];m.confirmed=true;P5Continuous.dispatch(s);',
  'localStorage.setItem(P5App.key,JSON.stringify(s));if(JSON.parse(localStorage.getItem(P5App.key)).arrival[1]!==false)throw Error("Saved arrival not preserved");location.reload();return true})()'
 ].join(''));
 await until(()=>val('typeof P5App!=="undefined"&&P5App.getState().stage==="stage1"'),'reload after late match');
 const lateDiag=await val("({arrival:P5App.getState().arrival?.[1],flow:P5App.getState().matchFlow,cycle:P5App.getState().continuous?.cycle,stage:P5App.getState().stage,html:document.querySelector(\"#americano\")?.textContent?.includes(\"LATE ARRIVAL\"),panel:!!document.querySelector(\".p5-cont-arrival\"),scored:P5App.getState().rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2&&m.confirmed).length})");console.log('LATE ARRIVAL DIAG',lateDiag);
 await until(()=>val('!!document.querySelector("#americano .p5-cont-arrival")'),'late arrival panel remains after first result');
 assert(!(await val('!!document.querySelector("#americano [data-act=continuous-reshuffle]")')),'Reshuffle locked after cycle scoring');
 if(!(await val('!!document.querySelector("#americano .p5-cont-arrival-body:not([hidden])")')))await tap('#americano [data-act="continuous-arrival-open"]');
 const lateBefore=await state(),liveLate=lateBefore.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2&&!m.confirmed).map(m=>m.id);
 const oldScore=lateBefore.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2&&m.confirmed).map(m=>({id:m.id,score:m.score}));
 await tap('#americano [data-act="continuous-arrival-toggle"][data-id="1"]');
 const lateAfter=await state();
 assert.equal(lateAfter.arrival[1],true,'Late pair checked in successfully');
 assert(liveLate.every(id=>lateAfter.rounds.flatMap(r=>r.matches).some(m=>m?.id===id&&!m.confirmed)),'Late check-in cannot change already assigned courts');
 assert.deepEqual(lateAfter.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2&&m.confirmed).map(m=>({id:m.id,score:m.score})),oldScore,'Late arrival preserves confirmed history');
 console.log('PASS late Check In after scores, reshuffle locked, active courts and results unchanged');


 // Browse the older Cycle 1 and safely correct its score while Cycle 2 is running.
 await tap('#americano [data-act="continuous-history-toggle"]');
 await tap('#americano [data-act="continuous-history-cycle"][data-cycle="1"]');
 const oldHistory=await state();
 assert.equal(oldHistory.ui.contHistoryCycle,1,'Cycle 1 selected in history');
 assert(await val('!!document.querySelector("#americano .p5-cont-fixture button[data-act=score]")'),'Archived results remain editable');
 const pastFixture=oldHistory.rounds.flatMap(r=>r.matches).find(m=>m?.cycle===1&&m.confirmed);
 const activeBefore=JSON.stringify(oldHistory.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2));
 const queueBefore=JSON.stringify(oldHistory.continuous.queue);
 await tap('#americano .p5-cont-fixture button[data-act="score"]');
 await until(isModal,'Cycle 1 edit score');
 await val('(()=>{const a=document.querySelector("#p5-score-a"),b=document.querySelector("#p5-score-b");a.value="4";b.value="1";a.dispatchEvent(new Event("change",{bubbles:true}));b.dispatchEvent(new Event("change",{bubbles:true}));})()');
 await tap('#p5-modal-root [data-act="modal-save"]');
 await until(()=>val('!!document.querySelector("#p5-modal-root .p5-cont-score-review")'),'Cycle 1 historical score review');
 await tap('#p5-modal-root [data-act="continuous-score-confirm"]');
 await until(async()=>!(await isModal()),'Cycle 1 score corrected');
 const archivedCorrected=await state();
 assert(archivedCorrected.rounds.flatMap(r=>r.matches).some(m=>m?.cycle===1&&m.score?.[0]===4&&m.score?.[1]===1),'Cycle 1 corrected score retained');
 assert.equal(JSON.stringify(archivedCorrected.rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===2)),activeBefore,'Historical score correction cannot regenerate Cycle 2 courts');
 assert.equal(JSON.stringify(archivedCorrected.continuous.queue),queueBefore,'Historical score correction cannot reorder Cycle 2 queue');
 console.log('PASS archived Cycle 1: selectable in Cycle 2, review/edit score, no reschedule');

 // Finish cycle 2 and exercise Stage 2 choice.
 await val([
  '(()=>{const s=P5App.getState();let steps=0;while(!P5Continuous.complete(s)&&steps++<200){',
  'const next=P5Continuous.active(s)[0];if(!next)break;next.score=[3,2];next.confirmed=true;P5Continuous.dispatch(s);}',
  'if(!P5Continuous.complete(s))throw Error("Could not complete Cycle 2");',
  'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()'
 ].join(''));
 await until(()=>val('!!document.querySelector("#americano .p5-cont-final-actions")'),'Cycle 2 complete');
 await val('localStorage.setItem("p5qaCompleteCycle",JSON.stringify(P5App.getState()))');
 await tap('#americano [data-act="continuous-stage2"]');
 await until(isModal,'Stage 2 confirmation');
 await tap('#p5-modal-root [data-act="modal-save"]');
 await until(()=>val('P5App.getState().stage==="stage1finished"'),'Stage 2 config transition');
 assert(await val('!!document.querySelector("#ko-format")'),'Stage 2 uses native Knockout format setup');
 assert.equal((await state()).rounds.flatMap(r=>r.matches).filter(m=>m?.cycle===1&&m.confirmed).length,15,'Stage 2 preserves Cycle 1');
 console.log('PASS Stage 2 action: canonical KO configuration without dropping prior cycles');
 // Independent Finish Tournament route must use the preserved cycle scores.
 await val('(()=>{localStorage.setItem(P5App.key,localStorage.getItem("p5qaCompleteCycle"));location.reload();return true})()');
 await until(()=>val('!!document.querySelector("#americano [data-act=continuous-finish]")'),'restore completed Continuous tournament');
 await tap('#americano [data-act="continuous-finish"]');
 await until(isModal,'Finish Tournament confirmation');
 await tap('#p5-modal-root [data-act="modal-save"]');
 await until(()=>val('P5App.getState().stage==="champion"'),'Finish Tournament champion reveal');
 const finalTournament=await state();
 assert.equal(finalTournament.ko.format,'none','Finish Tournament must NOT accidentally schedule Stage 2');
 assert.equal(finalTournament.rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).length,30,'Final result retains every scored match from two cycles');
 console.log('PASS Finish Tournament route: champion summary, no KO and both cycles retained');





 // Shared Stage 2 regression: all four pairing variants in both games,
 // plus partial Continuous in all Americano pairing variants.
 const stage2Original=await state();
 for(const game of ['americano','mexicano']){
  for(const pairing of ['normal','flexible','fp','structured']){
   const mode=(['normal','flexible'].includes(pairing)?'individual':pairing)+'-'+game;
   for(const flow of (game==='americano'?['rounds','continuous']:['rounds'])){
    for(const format of ['single','double']){
     const setup='('+function(mode,pairing,flow){
      const s=P5App.getState(),fixed=pairing==='fp',structured=pairing==='structured';
      const roster=Array.from({length:8},(_,i)=>({id:i+1,names:fixed?['P'+(i+1)+' A','P'+(i+1)+' B']:['P'+(i+1)],...(structured?{group:i<4?'A':'B'}:{})}));
      const teams=fixed?[[[1],[2]],[[3],[4]],[[5],[6]],[[7],[8]]]:structured?[[[1,5],[2,6]],[[3,7],[4,8]]]:[[[1,2],[3,4]],[[5,6],[7,8]]];
      const schedule=[];
      for(let i=0;i<teams.length;i+=2)schedule.push({index:schedule.length,eligibleIds:roster.map(p=>p.id),matches:teams.slice(i,i+2).map((t,j)=>({id:'stage2-'+i+'-'+j,court:j+1,teams:t,confirmed:true,score:[3,2]}))});
      Object.assign(s,{stage:'stage1',mode,matchFlow:flow,continuous:null,session:'Stage 2 QA',roster,nextId:9,courts:2,initialCourts:2,currentRound:schedule.length-1,viewRound:schedule.length-1,rounds:schedule,initialSchedule:schedule,matchFormat:'total5',ko:null,qualification:null,koFormat:'',koMatchFormat:'',koFinalFormat:'',sitout:[],sitoutPending:{},pendingParticipants:[],pendingCourts:null,groupConfig:{labels:['Left','Right']},rules:{...P5AdvancedRules.blank(),fixedEnabled:pairing==='flexible',pairs:pairing==='flexible'?[[1,2]]:[]},arrival:Object.fromEntries(roster.map(p=>[p.id,true])),availabilityById:Object.fromEntries(roster.map(p=>[p.id,'ACTIVE'])),ui:{...s.ui,modal:null,menuOpen:false,submenus:[],stageTab:'stage1'}});
      if(flow==='continuous'){
       const partialPlan=schedule.map(r=>({...r,matches:r.matches.map(m=>({...m,confirmed:false,score:null}))}));
       if(!fixed)partialPlan.push({index:partialPlan.length,matches:[{id:'future',court:1,teams:structured?[[1,6],[2,5]]:pairing==='flexible'?[[1,2],[5,6]]:[[1,3],[5,7]]}]});
       P5Continuous.create(s,partialPlan);
       s.continuous.paused=true;
       for(const m of P5Continuous.active(s)){m.score=[3,2];m.confirmed=true;}
       if(P5Continuous.complete(s))throw Error('Expected partial cycle');
      }
      localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true;
     }.toString()+')('+[mode,pairing,flow].map(JSON.stringify).join(',')+')';
     await val(setup);
     await until(()=>val('P5App.getState().stage==="stage1"&&P5App.getState().mode==='+JSON.stringify(mode)),'Stage 2 QA fixture');
     const scores=await val('JSON.stringify(P5App.getState().rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).map(m=>[m.id,m.score]))');
     const clicked=await val('(()=>{const b=document.querySelector("#americano .p5-cont-run-actions [data-act=continuous-finish]")||document.querySelector("#americano .p5-v26-session-control [data-act=finish-stage1]")||document.querySelector("#americano [data-act=finish-stage1]");if(!b)return false;b.click();return true})()');
     assert(clicked,'Finish Stage 1 action missing '+pairing+' '+game+' '+flow);
     await until(isModal,'Stage 1 finish dialog');
     if(await val('!!document.querySelector("#p5-modal-root [data-act=balance-finish]")')){
      await val('document.querySelector("#p5-modal-root [data-act=balance-finish]").click();true');
      await until(()=>val('!!document.querySelector("#p5-modal-root [data-act=modal-save]")'),'fairness warning confirmed');
     }
     await val('document.querySelector("#p5-modal-root [data-act=modal-save]").click();true');
     await until(()=>val('P5App.getState().stage==="stage1finished"'),'all modes reach Stage 2 configuration '+pairing+' '+game+' '+flow);
     await val('(()=>{for(const [id,v] of '+JSON.stringify([['ko-format',format],['ko-match-format','first4'],['ko-final-format','first6']])+'){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event("change",{bubbles:true}));}return true})()');
     await val('document.querySelector("#americano [data-act=start-ko]").click();true');
     await until(()=>val('!!document.querySelector("#p5-modal-root [data-act=qualification-confirm]")'),'qualifiers '+pairing+' '+game+' '+flow);
     await val('document.querySelector("#p5-modal-root [data-act=qualification-confirm]").click();true');
     await until(()=>val('P5App.getState().stage==="ko"'),'KO dispatch '+pairing+' '+game+' '+flow+' '+format);
     const result=await state();
     assert.equal(result.ko.format,format);
     assert(result.ko.active.length>0,'KO court must dispatch');
     assert.equal(await val('JSON.stringify(P5App.getState().rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).map(m=>[m.id,m.score]))'),scores,'Stage 1 scores changed');
     if(pairing==='structured')assert(result.ko.teams.every(t=>t.ids.length===2&&t.ids.filter(id=>id<=4).length===1),'Structured KO must retain Group A + B');
     if(pairing==='flexible')assert(result.ko.teams.some(t=>t.ids.includes(1)&&t.ids.includes(2)),'Locked pair must remain together');
     console.log('PASS Stage 2',game,pairing,flow,format);
    }
   }
  }
 }
 await val('localStorage.setItem(P5App.key,'+JSON.stringify(JSON.stringify(stage2Original))+');location.reload();true');
 await until(()=>val('P5App.getState().stage==="champion"'),'restore original QA state');

 // PR52 shared-foundation visual parity: measure real computed geometry at phone/tablet
 // sizes for every registered Americano/Mexicano pairing mode and match flow.
 const paritySamples=[];
 for(const [device,w,h] of [['iPhone',390,844],['iPad',1194,834]]){
  await size(w,h);
  for(const mode of ['fp-americano','individual-americano','structured-americano','fp-mexicano','individual-mexicano','structured-mexicano']){
   for(const flow of (mode.endsWith('-americano')?['rounds','continuous']:['rounds'])){
    const setup='(()=>{'+
     'const s=P5App.getState(),mode='+JSON.stringify(mode)+',flow='+JSON.stringify(flow)+';'+
     'const fixed=mode.startsWith("fp-"),structured=mode.startsWith("structured-");'+
     'const roster=Array.from({length:8},(_,i)=>({id:i+1,names:fixed?["P"+(i+1)+" A","P"+(i+1)+" B"]:["P"+(i+1)],...(structured?{group:i<4?"A":"B"}:{})}));'+
     'const pairs=fixed?[[[1],[2]],[[3],[4]]]:structured?[[[1,5],[2,6]],[[3,7],[4,8]]]:[[[1,2],[3,4]],[[5,6],[7,8]]];'+
     'const matches=pairs.map((teams,i)=>({id:"ui-parity-"+i,court:i+1,teams,score:null,confirmed:false}));'+
     'const schedule=[{index:0,matches,eligibleIds:roster.map(p=>p.id)}];'+
     'Object.assign(s,{stage:"stage1",mode,matchFlow:flow,continuous:null,session:"UI Parity Lab",'+
     'roster,nextId:9,courts:2,currentRound:0,viewRound:0,matchFormat:"total5",'+
     'rounds:flow==="continuous"?[]:schedule,initialSchedule:JSON.parse(JSON.stringify(schedule)),initialCourts:2,'+
     'sitout:[],sitoutPending:{},pendingParticipants:[],groupConfig:{labels:["Left","Right"]},'+
     'arrival:Object.fromEntries(roster.map(p=>[p.id,true])),'+
     'availabilityById:Object.fromEntries(roster.map(p=>[p.id,"ACTIVE"])),'+
     'ui:{...s.ui,modal:null,contHistoryOpen:false,contHistoryCycle:1,contHistoryRound:1}});'+
     'if(flow==="continuous")P5Continuous.create(s,schedule);'+
     'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()';
    await val(setup);
    await until(()=>val('P5App?.getState()?.stage==="stage1"&&!!document.querySelector("#americano .p5-stage1-score-grid .court.p5sm-card")'),
     'dashboard '+device+' '+mode+' '+flow);
    const measured=await val('(()=>{'+
     'const root=document.querySelector("#americano"),board=root.querySelector(".p5-v26-round-card");'+
     'const courts=[...board.querySelectorAll(".p5-stage1-score-grid>.court.p5sm-card")];'+
     'const card=courts[0],score=card?.querySelector(".p5-score-tap"),leader=root.querySelector(".p5-b41-leaderboard");'+
     'const r=e=>e?.getBoundingClientRect(),b=r(board),c=r(card),z=r(score);'+
     'return {boardWidth:b?.width,courtWidth:c?.width,courtHeight:c?.height,scoreHeight:z?.height,'+
     'scoreWidth:z?.width,courtCount:courts.length,scoreCount:card?.querySelectorAll(".p5-score-tap").length,'+
     'overflow:Math.max(0,...courts.map(el=>el.scrollWidth-el.clientWidth)),'+
     'font:getComputedStyle(card).fontFamily,leaderWidth:r(leader)?.width,'+
     'roundTitleSize:getComputedStyle(board.querySelector(".p5-v26-round-title h2")).fontSize};'+
     '})()');
    assert(measured.boardWidth>250&&measured.courtWidth>100&&measured.scoreHeight>=38&&measured.scoreCount===2,
     'Scorecard measured geometry invalid '+JSON.stringify({device,mode,flow,measured}));
    assert(measured.overflow<=3,'Court cards must never horizontally overflow '+JSON.stringify({device,mode,flow,measured}));
    await tap('#americano .p5-stage1-score-grid>.court.p5sm-card .p5-score-tap');
    await until(isModal,'shared score modal '+device+' '+mode+' '+flow);
    const modal=await val('(()=>{'+
     'const box=document.querySelector("#p5-modal-root .p5-cont-score-clean"),r=box?.getBoundingClientRect();'+
     'const fmt=box?.querySelector(".p5-polish-entry-overline span")?.textContent.trim();'+
     'const hint=box?.querySelector("#p5-score-dual-hint")?.textContent.trim();'+
     'const sideLabels=[...(box?.querySelectorAll(".p5-polish-team-label")||[])];'+
     'const duplicate=box?.querySelector("#modal-error");'+
     'return {exists:!!box,width:r?.width,format:fmt,hint,labelsHidden:sideLabels.every(x=>getComputedStyle(x).display==="none"),'+
     'duplicateHidden:!!duplicate&&getComputedStyle(duplicate).display==="none",scoreInputs:box?.querySelectorAll(".p5-score-dual-select").length};'+
     '})()');
    assert(modal.exists&&modal.format==='TOTAL OF 5'&&modal.hint==='Enter one score; the other updates.'&&
     modal.labelsHidden&&modal.duplicateHidden&&modal.scoreInputs===2,
     'Score modal drift across mode/flow '+JSON.stringify({device,mode,flow,modal}));
    await tap('#p5-modal-root [data-act="modal-cancel"]');
    await until(async()=>!(await isModal()),'score cancel '+device+' '+mode+' '+flow);
    paritySamples.push({device,mode,flow,...measured,modalWidth:modal.width});
   }
  }
 }
 for(const device of ['iPhone','iPad']){
  for(const kind of ['fp','individual','structured']){
   const variants=paritySamples.filter(x=>x.device===device&&x.mode.startsWith(kind+'-'));
   const baseline=variants.find(x=>x.mode.endsWith('-americano')&&x.flow==='rounds');
   assert(baseline,'Missing baseline for '+device+' '+kind);
   for(const x of variants){
    assert(Math.abs(x.courtWidth-baseline.courtWidth)<=4,'Court width diverges from master '+JSON.stringify({device,mode:x.mode,flow:x.flow,baseline:baseline.courtWidth,actual:x.courtWidth}));
    assert(Math.abs(x.courtHeight-baseline.courtHeight)<=7,'Court height diverges from master '+JSON.stringify({device,mode:x.mode,flow:x.flow,baseline:baseline.courtHeight,actual:x.courtHeight}));
    assert(Math.abs(x.scoreHeight-baseline.scoreHeight)<=2,'Score entry height diverges from master '+JSON.stringify({device,mode:x.mode,flow:x.flow,baseline:baseline.scoreHeight,actual:x.scoreHeight}));
    assert(Math.abs(x.modalWidth-baseline.modalWidth)<=2,'Score modal width diverges from master '+JSON.stringify({device,mode:x.mode,flow:x.flow,baseline:baseline.modalWidth,actual:x.modalWidth}));
    assert(x.font===baseline.font&&x.roundTitleSize===baseline.roundTitleSize,'Shared dashboard typography diverges '+JSON.stringify({device,mode:x.mode,flow:x.flow,font:x.font,title:x.roundTitleSize}));
   }
  }
 }
 console.log('SHARED DASHBOARD PARITY MATRIX '+JSON.stringify(paritySamples.map(({device,mode,flow,courtWidth,courtHeight,scoreHeight,modalWidth,overflow})=>({device,mode,flow,courtWidth,courtHeight,scoreHeight,modalWidth,overflow}))));
 console.log('PASS shared Americano/Mexicano UI parity (6 pairing modes + 3 continuous variants) on iPhone and iPad');


 // PR52: visual QA for the reported 18-player / 3-court By Rounds Resting Players case.
 for(const [device,width,height] of [['iPhone',390,844],['iPad',1194,834]]){
  await size(width,height);
  const fixture='(()=>{'+
   'const s=P5App.getState(),roster=Array.from({length:18},(_,i)=>({id:i+1,names:["PLAYER "+(i+1)]}));'+
   'const matches=[0,1,2].map(i=>({id:"rest-parity-"+i,court:i+1,teams:[[i*4+1,i*4+2],[i*4+3,i*4+4]],score:null,confirmed:false}));'+
   'const rounds=[{index:0,matches,eligibleIds:roster.map(x=>x.id)}];'+
   'Object.assign(s,{stage:"stage1",mode:"individual-americano",matchFlow:"rounds",continuous:null,'+
   'roster,nextId:19,courts:3,rounds,currentRound:0,viewRound:0,session:"RESTING QA",date:"2026-11-19",matchFormat:"total5",'+
   'initialSchedule:JSON.parse(JSON.stringify(rounds)),initialCourts:3,'+
   'sitout:[],sitoutPending:{},availabilityById:Object.fromEntries(roster.map(p=>[p.id,"ACTIVE"])),'+
   'arrival:Object.fromEntries(roster.map(p=>[p.id,true])),pendingParticipants:[],ui:{...s.ui,modal:null}});'+
   'localStorage.setItem(P5App.key,JSON.stringify(s));location.reload();return true})()';
  await val(fixture);
  await until(()=>val('!!document.querySelector("#americano .p5-v26-flow-combo>.p5-rest-card .resting-pair-list")'),'By Rounds Resting UI '+device);
  const restingLayout=await val('(()=>{'+
   'const card=document.querySelector("#americano .p5-v26-flow-combo>.p5-rest-card"),list=card?.querySelector(".resting-pair-list");'+
   'const chips=[...(list?.querySelectorAll(".resting-pair-chip")||[])];'+
   'const boxes=chips.map(x=>x.getBoundingClientRect()),style=list?getComputedStyle(list):null,'+
   'chip=chips[0]?getComputedStyle(chips[0]):null;'+
   'const cols=style?.gridTemplateColumns?.split(" ").filter(Boolean).length;'+
   'return {label:card?.querySelector("h3")?.textContent?.trim(),count:chips.length,'+
   'display:style?.display,cols,gap:style?.gap,chipHeight:boxes[0]?.height,'+
   'rows:boxes.length?new Set(boxes.map(x=>Math.round(x.top))).size:0,'+
   'overflow:Math.max(0,...chips.map(x=>x.scrollWidth-x.clientWidth)),'+
   'cardOverflow:card?Math.max(0,card.scrollWidth-card.clientWidth):999,'+
   'chipBg:chip?.backgroundColor,chipFont:chip?.fontSize};'+
   '})()');
  assert(restingLayout.label?.startsWith('RESTING PLAYERS')&&restingLayout.count===6,
   'All six resting players must remain visible '+JSON.stringify({device,restingLayout}));
  assert(restingLayout.display==='grid'&&restingLayout.cols===3&&restingLayout.rows===2&&restingLayout.chipHeight>=30,
   'Resting chips must wrap to 3 balanced columns and 2 rows '+JSON.stringify({device,restingLayout}));
  assert(restingLayout.overflow<=2&&restingLayout.cardOverflow<=2,
   'Resting list must not overflow on '+device+': '+JSON.stringify(restingLayout));
  console.log('PASS By Rounds Resting Players '+device+': six balanced chips, 3x2, no overflow');
 }

 console.log('PASS v1.5.2 touch acceptance — privacy, statistics, edit, status, scoring, native buttons');
}
main().catch(e=>{console.error('FAIL v1.5.2 interactive QA',e.stack||e);process.exitCode=1}).finally(cleanup);
