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
  await tap('#americano [data-act="score"]');await until(isModal,'score modal');await tap(cancel);await until(async()=>!(await isModal()),'score cancel');
  assert.equal(JSON.stringify((await state()).rounds),before,'Score Cancel modified matches');
  console.log('PASS iPhone Score Entry / Cancel');
 }
 await size(1180,820);await nap(250);
 await tap(selectedName);await until(isStats,'iPad stats');await tap('[data-p5ps-status]');await until(isModal,'iPad participation');
 await participationHidden();await tap(active);
 assert.equal(await val('document.querySelector('+JSON.stringify(active)+').getAttribute("aria-pressed")'),'true');
 await tap(cancel);await until(async()=>!(await isModal()),'iPad Cancel');
 console.log('PASS iPad landscape Participation Active / Cancel');

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
 const start=await state();
 assert.equal(start.continuous.total,15,'6 pairs must play 15 unique fixtures');
 assert.equal(start.rounds.flatMap(r=>r.matches).filter(Boolean).length,2,'Two active courts dispatched');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'Initial continuous scheduling valid');
 await tap('#americano .p5-score-tap');await until(isModal,'continuous score entry');
 await val('(()=>{const a=document.querySelector("#p5-score-a"),b=document.querySelector("#p5-score-b");a.value="3";b.value="2";a.dispatchEvent(new Event("change",{bubbles:true}));b.dispatchEvent(new Event("change",{bubbles:true}))})()');
 await tap('#p5-modal-root [data-act="modal-save"]');await until(async()=>!(await isModal()),'continuous score confirm');
 const after=await state();
 assert.equal(after.rounds.flatMap(r=>r.matches).filter(m=>m?.confirmed).length,1,'Confirmed fixture retained');
 assert.equal(after.rounds.flatMap(r=>r.matches).filter(m=>m&&!m.confirmed).length,2,'Finished court immediately receives next fixture');
 assert(await val('P5Continuous.verify(P5App.getState()).valid'),'No duplicate opponent or simultaneous assignment');
 await tap('#americano [data-act="continuous-pause"]');
 assert.equal((await state()).continuous.paused,true,'Pause new dispatch');
 console.log('PASS iPhone Continuous: live dispatch per court, persisted score, unique opponents, pause');
 await size(1180,820);
 assert(await val('!!document.querySelector(".p5-cont-stage .p5-cont-courts")'),'iPad shared continuous dashboard rendered');
 console.log('PASS iPad landscape Continuous shared court layout');

 console.log('PASS v1.5.2 touch acceptance — privacy, statistics, edit, status, scoring, native buttons');
}
main().catch(e=>{console.error('FAIL v1.5.2 interactive QA',e.stack||e);process.exitCode=1}).finally(cleanup);
