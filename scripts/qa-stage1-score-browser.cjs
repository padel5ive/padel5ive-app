'use strict';
/* PADEL 5IVE: headless Chrome scoring regression for real shared HTML.
 * No additional npm packages; Chrome DevTools protocol + Node 22 WebSocket.
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const os=require('node:os'),child=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve('public');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 let url;try{url=new URL(req.url,'http://local.test');}catch{res.writeHead(400).end();return;}
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');}catch{}
 fs.readFile(file,(err,contents)=>{if(err){res.writeHead(404).end('not found');return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');res.end(contents);
 });
});
async function main(){
 const chrome=process.env.CHROME_BIN||['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(bin=>{
  try{return child.execFileSync('which',[bin],{stdio:'pipe'}).length>0;}catch{return false;}
 });
 assert(chrome,'Chrome/Chromium browser not installed');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'padel5ive-browser-'));
 const deadline=Date.now()+55000;
 let proc=null,ws=null;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  proc=child.spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
   '--no-first-run','--no-default-browser-check','--disable-extensions',
   '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
  const marker=path.join(dir,'DevToolsActivePort');
  while(!fs.existsSync(marker)&&Date.now()<deadline)await delay(80);
  assert(fs.existsSync(marker),'Chrome did not start DevTools');
  const debugPort=Number(fs.readFileSync(marker,'utf8').split('\n')[0]);
  const page=await(await fetch('http://127.0.0.1:'+debugPort+'/json/new?about:blank',{method:'PUT'})).json();
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let nextId=0;const pending=new Map();
  ws.onmessage=event=>{const x=JSON.parse(event.data);if(!x.id||!pending.has(x.id))return;
   const {resolve,reject}=pending.get(x.id);pending.delete(x.id);
   x.error?reject(Error(JSON.stringify(x.error))):resolve(x.result);
  };
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const id=++nextId;pending.set(id,{resolve,reject});
   ws.send(JSON.stringify({id,method,params}));
  });
  const evalJS=async(expression)=>{
   const r=await send('Runtime.evaluate',{expression:'(async()=>{'+expression+'})()',returnByValue:true,awaitPromise:true});
   if(r.exceptionDetails)throw Error('Chrome JS: '+(r.exceptionDetails.text||'exception')+' '+(r.exceptionDetails.exception?.description||''));
   return r.result?.value;
  };
  const run=fn=>evalJS('return ('+fn.toString()+')();');
  const until=async(expression)=>{
   while(Date.now()<deadline){try{const v=await evalJS(expression);if(v)return v;}catch{}
    await delay(150);
   }
   throw Error('Browser timeout: '+expression.slice(0,150));
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/modes/unified/'});
  await until('return Boolean(window.P5App?.getState && document.querySelector("#setup-session"));');
  const seed=await run(()=>{
   const s=window.P5App.getState();
   Object.assign(s,{_sessionId:'qa-browser-stage1',stage:'stage1',mode:'individual-americano',
    session:'QA Browser Score Tap',date:'2026-11-11',time:'12:00',courts:2,matchFormat:'total5',
    roster:Array.from({length:12},(_,i)=>({id:i+1,names:['Player '+(i+1)]})),
    nextId:13,currentRound:0,viewRound:1,
    rounds:Array.from({length:17},(_,r)=>({index:r,matches:[0,1].map(c=>({
      id:'R'+r+'C'+c,court:c+1,teams:c===0?[[1,2],[3,4]]:[[5,6],[7,8]],
      confirmed:false,score:null
    }))})),
    sitout:[],sitoutPending:{},pendingParticipants:[],arrival:{},
    ko:null,qualification:null,pendingCourts:null,pendingAdd:false,activityLog:[],
    seed:123,rules:window.P5AdvancedRules.blank(),ui:{modal:null,menuOpen:false,submenus:[],fullSchedule:false,reportPreview:false}
   });
   localStorage.setItem('padel5ive-shared-foundation-v2.4-parity-lab',JSON.stringify(s));
   return s.stage;
  });
  assert.equal(seed,'stage1');
  await send('Page.reload',{ignoreCache:true});
  await until('const s=window.P5App?.getState?.();return s?.stage==="stage1"&&s.viewRound===1&&document.querySelectorAll(".p5sm-card").length===2;');
  const nav=await run(()=>({
    upper:document.querySelectorAll('#americano .p5-flex-switch').length,
    chips:document.querySelectorAll('#americano .roundbuttons button').length,
    bottom:document.querySelectorAll('#americano .p5-flex-bottom-actions [data-act="round"]').length,
    cardAction:document.querySelector('.p5sm-card')?.dataset.act,
    role:document.body.classList.contains('p58-view-only')
  }));
  assert.equal(nav.upper,0,'Remove redundant upper navigation');
  assert.equal(nav.chips,17,'Keep all round chips');
  assert.equal(nav.bottom,2,'Keep bottom round buttons');
  assert.equal(nav.cardAction,'score','Court tile must open scoring');
  assert.equal(nav.role,false,'Must test editable controller session');
  const opened=await run(()=>{
   const errors=[];window.addEventListener('error',event=>errors.push(event.message));
   const card=document.querySelector('.p5sm-card');
   let clicks=[];
   document.addEventListener('click',event=>clicks.push({tag:event.target.tagName,act:event.target.closest('[data-act]')?.dataset.act}),true);
   card.querySelector('h3').click();
   const state=window.P5App.getState();
   return {modal:state.ui.modal?.type,
    a:!!document.querySelector('#modal-a'),b:!!document.querySelector('#modal-b'),
    debug:{errors,clicks,toast:document.getElementById('toast')?.textContent,stage:state.stage,
      view:state.viewRound,mode:state.mode,hasMatch:state.rounds[state.viewRound]?.matches[0]?.id,
      card:card.getAttribute('data-act'),button:card.querySelector('button')?.getAttribute('data-act'),
      modalState:state.ui.modal}};
  });
  if(opened.modal!=='score'||!opened.a||!opened.b)console.log('Court tap diagnostic:',JSON.stringify(opened.debug));
  assert.deepEqual({modal:opened.modal,a:opened.a,b:opened.b},{modal:'score',a:true,b:true},'Court header opens native score modal');
  const saved=await run(()=>{
   document.querySelector('#modal-a').value='3';document.querySelector('#modal-b').value='2';
   document.querySelector('[data-act="modal-save"]').click();
   const s=window.P5App.getState();
   return {confirmed:s.rounds[1].matches[0].confirmed,score:s.rounds[1].matches[0].score,
    currentRound:s.currentRound,viewRound:s.viewRound,modal:s.ui.modal,
    round1:s.rounds[0].matches[0].confirmed};
  });
  assert.equal(saved.confirmed,true,'Round 2 should score before Round 1');
  assert.deepEqual(saved.score,[3,2]);
  assert.equal(saved.currentRound,0,'Should not advance the engine');
  assert.equal(saved.viewRound,1);
  assert.equal(saved.round1,false);
  assert.equal(saved.modal,null);
  const footer=await run(()=>{
   document.querySelectorAll('.p5sm-card .scorehint')[1].click();
   return Boolean(document.querySelector('#modal-a')&&window.P5App.getState().ui.modal?.type==='score');
  });
  assert.equal(footer,true,'Tap to Score footer must open modal');
  const second=await run(()=>{
   document.querySelector('#modal-a').value='4';document.querySelector('#modal-b').value='1';
   document.querySelector('[data-act="modal-save"]').click();
   return window.P5App.getState().rounds[1].matches.map(m=>({confirmed:m.confirmed,score:m.score}));
  });
  assert.equal(second.every(x=>x.confirmed),true);
  assert.deepEqual(second.map(x=>x.score),[[3,2],[4,1]]);
  const history=await run(()=>{
   document.querySelector('#americano .roundbuttons [data-round="0"]').click();
   document.querySelector('#americano .roundbuttons [data-round="1"]').click();
   const s=window.P5App.getState();
   return {view:s.viewRound,score:s.rounds[1].matches[0].score,confirmed:s.rounds[1].matches[1].confirmed};
  });
  assert.equal(history.view,1);
  assert.deepEqual(history.score,[3,2]);
  assert.equal(history.confirmed,true);
  // PR36: changing live format must protect scored and currently viewed rounds.
  const formatBefore=await run(()=>{
    document.querySelector('#americano [data-act="edit-match-format"]').click();
    return {type:window.P5App.getState().ui.modal?.type,options:document.querySelectorAll('#p5-change-match-format option').length};
  });
  assert.equal(formatBefore.type,'match-format','Session Info opens the live format editor');
  assert.equal(formatBefore.options,6);
  const formatChanged=await run(()=>{
    document.querySelector('#p5-change-match-format').value='total4';
    document.querySelector('[data-act="modal-save"]').click();
    const confirm=window.P5App.getState().ui.modal?.type;
    document.querySelector('[data-act="modal-save"]').click();
    const s=window.P5App.getState();
    return {confirm,format:s.matchFormat,currentRound:s.currentRound,viewRound:s.viewRound,
      oldFormat:s.rounds[1].matches[0].matchFormat,
      oldScore:s.rounds[1].matches[0].score,
      nextFormat:s.rounds[2].matches[0].matchFormat};
  });
  assert.equal(formatChanged.confirm,'confirm','Mixed format requires moderator confirmation');
  assert.equal(formatChanged.format,'total4');
  assert.deepEqual(formatChanged.oldScore,[3,2],'Confirmed score remains unchanged');
  assert.equal(formatChanged.oldFormat,'total5','Confirmed match retains original score format');
  assert.equal(formatChanged.nextFormat,'total4','Only future untouched round gets new format');
  const reedit=await run(()=>{
    document.querySelector('.p5sm-card [data-act="score"]').click();
    return {fmt:document.querySelector('.p5-score-dual')?.dataset.p5ScoreFormat,
      scoreA:document.getElementById('p5-score-a')?.value};
  });
  assert.deepEqual(reedit,{fmt:'total5',scoreA:'3'},'Editing old score still uses original format');
  await run(()=>document.querySelector('[data-act="modal-cancel"]').click());
  console.log('PASS PR36 format edit: confirmed/viewed rounds protected, future format changed, old modal preserved.');
  // PR36 mobile layout: native stage-one cards are exclusive tabs, not stacked.
  // The legacy iPhone order assertions remain for builds without the PR36 tab feature.
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await delay(250);
  const mobile=await run(()=>{
    const app=document.querySelector('#americano'),root=app?.querySelector(':scope > .layout');
    const board=root?.querySelector(':scope > div:first-child > .p5-v26-round-card');
    const panel=root?.querySelector(':scope > div:first-child > .p5-v26-session-control');
    const leaderboard=root?.querySelector(':scope > aside');
    const tabbar=app?.querySelector(':scope > .p5-pr36-mobile-tabs');
    const rail=board?.querySelector('.round-picker .roundbuttons');
    const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
    return {viewport:innerWidth,layout:getComputedStyle(root).display,
      wrapper:getComputedStyle(root.firstElementChild).display,
      board:rect(board),leaderboard:rect(leaderboard),panel:rect(panel),
      verticalGap:board&&panel?(Math.round((panel.getBoundingClientRect().top-board.getBoundingClientRect().bottom)*10)/10):null,
      panelText:panel?.textContent,tabs:!!tabbar&&getComputedStyle(tabbar).display!=='none',
      view:app?.getAttribute('data-p5-pr36-view'),
      rail:rail?{width:rail.clientWidth,scrollWidth:rail.scrollWidth,wrap:getComputedStyle(rail).flexWrap}:null};
  });
  assert(mobile.board&&mobile.leaderboard&&mobile.panel,'Stage 1 cards exist on iPhone');
  assert.equal(mobile.layout,'flex','Phone Stage 1 layout retains vertical root');
  assert.equal(mobile.wrapper,'contents','Phone first-column wrapper keeps native order');
  assert(mobile.panelText.includes('Finish Americano'),'Moderator Session Control content remains usable');
  if(mobile.tabs){
    assert.equal(mobile.view,'rounds','Rounds is default iPhone tab');
    assert(Math.abs(mobile.verticalGap-12)<=1,'Mobile Court Scoring to Session Control gap must be 12px: '+JSON.stringify(mobile));
    assert(mobile.board.width>300&&mobile.panel.width>300,'Rounds tab keeps scoring and session control full width');
    assert.equal(mobile.leaderboard.width,0,'Leaderboard must not stack below Rounds tab');
    assert.equal(mobile.rail.wrap,'nowrap','Mobile round navigation is one horizontal row');
    assert(mobile.rail.scrollWidth>=mobile.rail.width,'Mobile round navigation remains scrollable');
    const toggled=await run(()=>{
      const app=document.querySelector('#americano');
      const button=app.querySelector('[data-p5-pr36-tab="leaderboard"]');button?.click();
      const root=app.querySelector(':scope > .layout');
      const board=root?.querySelector(':scope > div:first-child > .p5-v26-round-card');
      const leaderboard=root?.querySelector(':scope > aside');
      const view=app.getAttribute('data-p5-pr36-view');
      const state=window.P5App.getState();
      const result={view,boardWidth:board?.getBoundingClientRect().width,leaderboardWidth:leaderboard?.getBoundingClientRect().width,
        score:state.rounds[1].matches[0].score,confirmed:state.rounds[1].matches[0].confirmed};
      app.querySelector('[data-p5-pr36-tab="rounds"]')?.click();
      result.roundsReturned=app.getAttribute('data-p5-pr36-view')==='rounds';
      return result;
    });
    assert.equal(toggled.view,'leaderboard','Leaderboard tab selectable');
    assert.equal(toggled.boardWidth,0,'Rounds panel hidden when viewing Leaderboard');
    assert(toggled.leaderboardWidth>300,'Leaderboard uses full iPhone width');
    assert(toggled.roundsReturned,'Return to Rounds without page reload');
    assert(toggled.confirmed&&toggled.score[0]===3&&toggled.score[1]===2,'Tabs cannot reset confirmed scores');
  }else{
    assert(mobile.board.bottom<=mobile.leaderboard.top+2,'Court Scoring precedes Leaderboard: '+JSON.stringify(mobile));
    assert(mobile.leaderboard.bottom<=mobile.panel.top+2,'Session Control must be below Leaderboard on legacy iPhone');
    assert(mobile.panel.width>300&&mobile.leaderboard.width>300,'Legacy iPhone cards remain full width');
  }
  if(mobile.tabs){
    // PR36 verified visual footer gap in both exclusive mobile views.
    // The decorative footer must not reserve 98px of empty space.
    for(const view of ['rounds','leaderboard']){
      if(view==='leaderboard')await run(()=>document.querySelector('#americano [data-p5-pr36-tab="leaderboard"]')?.click());
      await run(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      await delay(110);
      const gap=await run(()=>{
        const root=document.getElementById('americano');
        const last=root.getAttribute('data-p5-pr36-view')==='leaderboard'?
          root.querySelector(':scope > .layout > aside > .p5-b41-leaderboard'):
          root.querySelector('.p5-v26-session-control');
        const footer=document.querySelector('main.wrap > .brand-footer');
        const bar=root.querySelector('.p5-pr36-mobile-tabs');
        const wrap=document.querySelector('main.wrap');
        const f=footer.getBoundingClientRect(),l=last.getBoundingClientRect(),t=bar.getBoundingClientRect();
        return {view:root.getAttribute('data-p5-pr36-view'),panelToFooter:f.top-l.bottom,
          footerToTab:t.top-f.bottom,footerPadding:parseFloat(getComputedStyle(footer).paddingBottom),
          mainPadding:parseFloat(getComputedStyle(wrap).paddingBottom),tabHeight:t.height};
      });
      assert.equal(gap.view,view);
      assert(Math.abs(gap.panelToFooter-12)<=3,'Panel/footer gap is not 12px: '+JSON.stringify(gap));
      assert(Math.abs(gap.footerToTab-12)<=3,'Footer/tab gap is not 12px: '+JSON.stringify(gap));
      assert(gap.footerPadding<1,'Decorative footer still has giant bottom padding: '+JSON.stringify(gap));
      assert(Math.abs(gap.mainPadding-gap.tabHeight-12)<=3,'Scroll container must own safe-area clearance: '+JSON.stringify(gap));
    }
    await run(()=>document.querySelector('#americano [data-p5-pr36-tab="rounds"]')?.click());
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1194,height:834,deviceScaleFactor:2,mobile:false});
  await delay(180);
  const ipad=await run(()=>{
    const root=document.querySelector('#americano .layout');
    const panel=root?.querySelector(':scope > div:first-child > .p5-v26-session-control');
    const leaderboard=root?.querySelector(':scope > aside');
    const r=e=>e?.getBoundingClientRect();
    const roundTitle=root.querySelector('.p5-v26-round-title h2');
    const boardTitle=leaderboard?.querySelector('h2');
    const rail=root.querySelector('.round-picker .roundbuttons');
    const scorecard=root.querySelector('.p5-stage1-score-grid>.court.p5sm-card');
    const names=scorecard?.querySelectorAll('.pairname');
    const scores=scorecard?.querySelectorAll('.p5sm-scorebox');
    const session=document.querySelector('#americano>.p5-stage-head.p5-si-card');
    const mid=e=>{const b=r(e);return b.left+b.width/2};
    return {
      display:getComputedStyle(root).display,leftPanel:r(panel)?.left,leftBoard:r(leaderboard)?.left,
      sessionHeight:r(session)?.height,
      headingGap:Math.abs(r(roundTitle).top-r(boardTitle).top),
      headingSizeGap:Math.abs(parseFloat(getComputedStyle(roundTitle).fontSize)-parseFloat(getComputedStyle(boardTitle).fontSize)),
      railWrap:getComputedStyle(rail).flexWrap,
      railClient:rail.clientWidth,railScroll:rail.scrollWidth,
      namesCentered:names?.length===2&&scores?.length===2&&Math.abs(mid(names[0])-mid(scores[0]))<2&&Math.abs(mid(names[1])-mid(scores[1]))<2,
      scoreRowGap:scores?.length===2?Math.abs(r(scores[0]).top-r(scores[1]).top):Infinity
    };
  });
  assert(ipad.leftPanel<ipad.leftBoard,'iPad keeps Session Control in left column');
  assert(ipad.sessionHeight>0&&ipad.sessionHeight<130,'iPad session info must remain compact: '+JSON.stringify(ipad));
  assert(ipad.headingGap<=1&&ipad.headingSizeGap<.1,'iPad scoring and leaderboard titles must align: '+JSON.stringify(ipad));
  assert(ipad.railWrap==='nowrap'&&ipad.railScroll>ipad.railClient,'iPad round pills must use one horizontal scrollable row: '+JSON.stringify(ipad));
  assert(ipad.namesCentered&&ipad.scoreRowGap<2,'iPad names and scoreboxes must align symmetrically: '+JSON.stringify(ipad));
  console.log('PASS iPhone 390px: PR36 exclusive Rounds/Leaderboard tabs (legacy ordering fallback); iPad 1194px split preserved.');
  console.log('PASS Chrome: Round 2 court header/footer open score modal; 3-2 + 4-1 saved; Round 1 pending; navigation intact; upper arrows removed.');
 }finally{
  try{ws?.close();}catch{}
  if(proc&&!proc.killed)proc.kill('SIGTERM');
  server.close();
 }
}
main().catch(e=>{console.error('FAIL Chrome score entry:',e.stack||e);process.exitCode=1;server.close();});
