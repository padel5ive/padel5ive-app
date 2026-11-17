/* PADEL 5IVE | Team Showdown v0.9.7 HOME / Cloud bridge — STAGING ONLY.
 * Applied AFTER all existing master build transforms.
 * Keep Classic/First Edition and shared engine files intact.
 */
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
function swap(source,before,after,tag){
 const n=source.split(before).length-1;
 if(n!==1){if(['caption default','format selection caption'].includes(tag))return source;throw Error('v097 HOME bridge source drift '+tag+' matches='+n);}
 return source.replace(before,after);
}
function save(path,value){fs.writeFileSync(path,value)}
const homePath='public/index.html';
let home=fs.readFileSync(homePath,'utf8');
home=swap(home,'<span class="p54-mode-name">Club Match</span>',
 '<span class="p54-mode-name">Team Showdown</span>','HOME tile title');
home=swap(home,'<span class="p54-mode-desc">Team Showdown · Club Americano (soon)</span>',
 '<span class="p54-mode-desc">Classic · Multi-Division · Individual Americano</span>','HOME mode description');
home=swap(home,
 "function chooseMode(m){",
 "function chooseMode(m){\n    if(m==='Club Match'){mode=m;continueToMode();return;}",
 'Team Showdown direct launch; format belongs to native setup');
home=swap(home,
 "const activeClub=()=>{const s=parse(KEY_CLUB);return s&&s.setup&&((s.stage&&s.stage!=='setup')||s.setup.sessionName)?s:null};",
 "const activeClub=()=>{const s=parse(KEY_CLUB);return s&&s.setup&&((s.stage&&s.stage!=='setup')||s.setup.sessionName)?s:null};\n  const activeV097=()=>{const s=parse('padel5ive-team-showdown-v090-individual-lab');return s&&s.setup&&s.stage&&s.stage!=='setup'&&s.setup.sessionName?s:null};",
 'native active-session detector');
home=swap(home,
 "target=which==='club'?route('club','new'):roots.unified+'?intent=new&mode='+encodeURIComponent(mode)+'&pairing='+encodeURIComponent(pairing);",
 "target=which==='club'?'modes/club-match/v097/?intent=new':roots.unified+'?intent=new&mode='+encodeURIComponent(mode)+'&pairing='+encodeURIComponent(pairing);",
 'selected-format route');
home=swap(home,
 "const prior=which==='club'?activeClub():activeUnified();",
 "const prior=which==='club'?activeV097():activeUnified();",
 'new-session confirmation context');
home=swap(home,
 "document.getElementById('p54-confirm-resume').addEventListener('click',()=>launch(route(pendingWhich)));",
 "document.getElementById('p54-confirm-resume').addEventListener('click',()=>launch(pendingWhich==='club'?'modes/club-match/v097/?intent=resume':route(pendingWhich)));",
 'confirmed native resume');
home=swap(home,
 "!/^\\/modes\\/(unified|club-match)\\/?$/.test(url.pathname)",
 "!/^\\/modes\\/(unified|club-match(?:\\/v097)?)\\/?$/.test(url.pathname)",
 'same-origin launcher allow-list');
// Append v0.9.7 resume OUTSIDE the frozen Home renderResume() function.
// Legacy Cloud/History regressions execute renderResume in an isolated VM.
const resumeUrl='/v097/home-resume.js';
home=swap(home,'</body>','<script defer src="'+resumeUrl+'"></script>\n</body>','native resume adapter script');
save(homePath,home);
const resumeJs=String.raw`/* v0.9.7 isolated HOME resume badge; does not modify legacy renderResume. */
(()=>{'use strict';
const KEY='padel5ive-team-showdown-v090-individual-lab';
const $=id=>document.getElementById(id);
const finished=new Set(['champion','finished','completed','complete','final']);
function state(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function refresh(){
 const node=$('p54-resume');if(!node)return;
 const existing=$('p54-v097-resume');if(existing)existing.remove();
 const s=state();
 if(!s?.setup?.sessionName||!s.stage||s.stage==='setup'||finished.has(String(s.stage).toLowerCase()))return;
 if(node.hidden)node.hidden=false;
 const button=document.createElement('button');
 button.id='p54-v097-resume';button.type='button';button.className='p54-resume-btn';
 button.textContent='RESUME · '+String(s.setup.sessionName).slice(0,76)+' · TEAM SHOWDOWN →';
 button.addEventListener('click',()=>window.P5PreviewLaunch('modes/club-match/v097/?intent=resume'));
 node.appendChild(button);
}
const initial=window.P5PreviewRefreshResume;
if(typeof initial==='function')window.P5PreviewRefreshResume=function(...args){
 const result=initial.apply(this,args);refresh();return result;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
window.addEventListener('pageshow',refresh);
window.addEventListener('storage',e=>{if(e.key===KEY)refresh()});
})();
`;
fs.mkdirSync('public/v097',{recursive:true});
fs.writeFileSync('public/v097/home-resume.js',resumeJs);


const cloudPath='public/phase58/cloud-home.js';let cloud=fs.readFileSync(cloudPath,'utf8');
cloud=swap(cloud,
 "function joinSafe(result){\n const kind=result.kind;",
 "function joinSafe(result){\n const kind=result.kind;\n const native097=kind==='club'&&['classic','multi','individual'].includes(result.data?.setup?.competitionFormat);",
 'cloud native format classifier');
cloud=swap(cloud,
 "const key=K[kind],archKey=ARCH[kind],metaKey='p58-cloud-link-'+kind;",
 "const key=native097?'padel5ive-team-showdown-v090-individual-lab':K[kind],archKey=native097?'padel5ive-team-showdown-native-v07-archive':ARCH[kind],metaKey=native097?'p58-cloud-link-v097-club':'p58-cloud-link-'+kind;",
 'cloud native storage isolation');
cloud=swap(cloud,
 "return kind==='unified'?'/modes/unified/?intent=resume':'/modes/club-match/?intent=resume';",
 "return native097?'/modes/club-match/v097/?intent=resume':kind==='unified'?'/modes/unified/?intent=resume':'/modes/club-match/?intent=resume';",
 'cloud loaded destination');
cloud=swap(cloud,
 "const ownedKind=Object.keys(K).find(kind=>{",
 "const nativeLink=get('p58-cloud-link-v097-club'),nativeLocal=get('padel5ive-team-showdown-v090-individual-lab');\n  if(nativeLink?.code===normalized&&nativeLink.role==='controller'&&active(nativeLocal,'club')&&identity(nativeLocal,'club')===nativeLink.localId&&nativeLink.token){\n    location.assign('/modes/club-match/v097/?intent=resume');return;\n  }\n  const ownedKind=Object.keys(K).find(kind=>{",
 'moderator reopening own Viewer Link safely');
save(cloudPath,cloud);

const histPath='public/phase57/home-session-history.js';
let hist=fs.readFileSync(histPath,'utf8');
hist=swap(hist,
 "cl:'padel5ive-clubmatch-p54-sessions'};",
 "cl:'padel5ive-clubmatch-p54-sessions',v:'padel5ive-team-showdown-v090-individual-lab',vl:'padel5ive-team-showdown-native-v07-archive'};",
 'Session History native keys');
hist=swap(hist,
 "const out=[],u=get(K.u),c=get(K.c);",
 "const out=[],u=get(K.u),c=get(K.c),v=get(K.v);",
 'Session History native current');
hist=swap(hist,
 "if(validC(c))out.push({kind:'c',live:true,id:'current',s:c,at:Date.now()-1});",
 "if(validC(c))out.push({kind:'c',live:true,id:'current',s:c,at:Date.now()-1});\n if(validC(v))out.push({kind:'v',live:true,id:'current-v097',s:v,at:Date.now()-2});",
 'Session History native active');
hist=swap(hist,
 "['c',K.cl,validC]])",
 "['c',K.cl,validC],['v',K.vl,validC]])",
 'Session History native archive');
hist=swap(hist,
 "const title=x=>String(x.kind==='c'?x.s.setup.sessionName:x.s.session).slice(0,85);",
 "const title=x=>String(x.kind==='u'?x.s.session:x.s.setup.sessionName).slice(0,85);",
 'history title');
hist=swap(hist,
 "const label=x=>x.kind==='c'?'TEAM SHOWDOWN':MODES[x.s.mode]||'AMERICANO / MEXICANO';",
 "const label=x=>x.kind==='v'?'TEAM SHOWDOWN · '+({classic:'CLASSIC',multi:'MULTI-DIVISION',individual:'INDIVIDUAL AMERICANO'}[x.s.setup.competitionFormat]||'v0.9.7'):x.kind==='c'?'TEAM SHOWDOWN · PREVIOUS EDITION':MODES[x.s.mode]||'AMERICANO / MEXICANO';",
 'history mode labels');
hist=swap(hist,
 "x.kind==='c'?(x.s.setup.gameDate||x.s.setup.date||x.s.date||''):x.s.date||'';",
 "x.kind!=='u'?(x.s.setup.gameDate||x.s.setup.date||x.s.date||''):x.s.date||'';",
 'native history date');
hist=swap(hist,
 "x.kind==='c'?(x.s.setup.gameTime||x.s.setup.time||x.s.time||''):x.s.time||'';",
 "x.kind!=='u'?(x.s.setup.gameTime||x.s.setup.time||x.s.time||''):x.s.time||'';",
 'native history time');
hist=swap(hist,
 "return x.kind==='c'?'/modes/club-match/?intent='+(x.live?'resume':'archive&id='+encodeURIComponent(x.id)):'/modes/unified/?intent=resume';",
 "return x.kind==='v'?'/modes/club-match/v097/?intent='+(x.live?'resume':'archive&id='+encodeURIComponent(x.id)):x.kind==='c'?'/modes/club-match/?intent='+(x.live?'resume':'archive&id='+encodeURIComponent(x.id)):'/modes/unified/?intent=resume';",
 'native history resume route');
hist=swap(hist,
 "if(x.live||x.kind==='c')return nav(route(x));",
 "if(x.live||x.kind!=='u')return nav(route(x));",
 'native archive resume');
hist=swap(hist,
 "if(x.live)localStorage.removeItem(x.kind==='u'?K.u:K.c);",
 "if(x.live)localStorage.removeItem(x.kind==='u'?K.u:x.kind==='v'?K.v:K.c);",
 'native history delete current');
hist=swap(hist,
 "const key=x.kind==='u'?K.ul:K.cl;",
 "const key=x.kind==='u'?K.ul:x.kind==='v'?K.vl:K.cl;",
 'native history archive deletion');
hist=swap(hist,
 "const isC=validC(obj);if(!isU&&!isC)return alert('Unrecognized PADEL 5IVE backup format.');",
 "const isC=validC(obj),isV=isC&&['classic','multi','individual'].includes(obj.setup.competitionFormat);if(!isU&&!isC)return alert('Unrecognized PADEL 5IVE backup format.');",
 'native backup detection');
hist=swap(hist,
 "const key=isU?K.u:K.c,lib=isU?K.ul:K.cl,old=localStorage.getItem(key),oldLib=localStorage.getItem(lib);",
 "const key=isU?K.u:isV?K.v:K.c,lib=isU?K.ul:isV?K.vl:K.cl,old=localStorage.getItem(key),oldLib=localStorage.getItem(lib);",
 'native backup storage');
hist=swap(hist,
 "nav(isU?'/modes/unified/?intent=resume':'/modes/club-match/?intent=resume');",
 "nav(isU?'/modes/unified/?intent=resume':isV?'/modes/club-match/v097/?intent=resume':'/modes/club-match/?intent=resume');",
 'native restored destination');
save(histPath,hist);
for(const [path,content] of [[homePath,home],[cloudPath,cloud],[histPath,hist]]){
 const matches=[...content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
 for(const [i,m] of matches.entries())if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())new vm.Script(m[2],{filename:path+':inline-'+i});
}
new vm.Script(cloud,{filename:cloudPath});
new vm.Script(hist,{filename:histPath});
console.log('PASS staging HOME: 3 Team Showdown formats, native resume/history/Cloud and old masters preserved');
