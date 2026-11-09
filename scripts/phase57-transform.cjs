/* Phase 5.7 integration: idempotent build-time changes to legacy embedded app.
 * Preserve scheduler, scoring, KO and archived state semantics. Fail closed on drift.
 */
const fs=require('node:fs');
function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s)}
function one(s,old,next,label){
 if(s.includes(next))return s;
 if(!s.includes(old))throw Error('Phase57 source drift: '+label);
 const parts=s.split(old);
 if(parts.length!==2)throw Error('Phase57 ambiguous marker '+label+' ('+(parts.length-1)+')');
 return s.replace(old,next);
}
function inject(path,marker,html,label){
 let s=read(path);if(s.includes(html))return;
 if(!s.includes(marker))throw Error('Missing phase57 hook: '+label);
 s=one(s,marker,html+marker,label);write(path,s);
}
inject('public/index.html','</head>','<link rel="stylesheet" href="/phase57/home-session-history.css">','Home CSS');
inject('public/modes/unified/index.html','</head>','<link rel="stylesheet" href="/phase57/setup-refinement-v572.css">','Shared Date & Time v5.7.2 CSS');
inject('public/index.html','</body>','<script defer src="/phase57/home-session-history.js"></script>','Home session controller');
inject('public/results/unified/index.html','</head>','<link rel="stylesheet" href="/phase57/share-champion-v571.css">','Champion Reveal CSS');
inject('public/results/unified/index.html','</body>','<script defer src="/phase57/champion-render-v571.js"></script>','Champion Reveal script');
let s=read('public/modes/unified/index.html');
s=one(s,"session:'',date:'',courts:null","session:'',date:'',time:'',courts:null",'new state game time');
const oldDateLabel='<label class="p5-b2-wide">GAME DATE<span class="p5-b2-date-wrap">';
if(!s.includes('class="p57-date-time"')){
 const start=s.indexOf(oldDateLabel),end=s.indexOf('</label>',start);
 if(start<0||end<0||end-start>1800)throw Error('Phase57 date markup changed');
 const dateMarkup=s.slice(start,end+8);
 const dateContent=dateMarkup.slice(oldDateLabel.length,-8);
 const hours=Array.from({length:24},(_,i)=>{
  const val=String(i).padStart(2,'0')+':00';
  const label=String(i%12||12)+':00 '+(i<12?'AM':'PM');
  const selected='${s.time==='+JSON.stringify(val)+'?"selected":""}';
  return '<option value="'+val+'" '+selected+'>'+label+'</option>';
 }).join('');
 const replacement='<div class="p57-date-time"><div class="p57-date-time-label">GAME DATE &amp; TIME</div><div class="p57-date-time-row">'+
  '<label class="p57-date-control"><span class="p5-b2-date-wrap">'+dateContent+'</label>'+
  '<label class="p57-time-control"><select id="setup-time" aria-label="Game Time"><option value="">Select hour</option>'+hours+'</select></label></div></div>';
 s=s.slice(0,start)+replacement+s.slice(end+8);
}
// session time is required for new sessions, optional for legacy snapshots.
s=one(s,"const ready=Boolean($('setup-session')?.value.trim()&&date?.value&&game.value","const ready=Boolean($('setup-session')?.value.trim()&&date?.value&&$('setup-time')?.value&&game.value",'setup validation');
s=one(s,"const session=$('setup-session')?.value.trim(),date=$('setup-date')?.value,game=","const session=$('setup-session')?.value.trim(),date=$('setup-date')?.value,time=$('setup-time')?.value,game=",'collect time');
s=one(s,"if(!validDate)return toast('Select a valid Game Date');","if(!validDate)return toast('Select a valid Game Date');\n  if(!/^(?:[01]\\d|2[0-3]):00$/.test(time||''))return toast('Select a valid Game Time');",'validate time');
s=one(s,"s.session=session;s.date=date;s.mode=candidate.id;","s.session=session;s.date=date;s.time=time;s.mode=candidate.id;",'save time');
s=one(s,"['setup-pairing','setup-courts','setup-format','setup-date'].includes","['setup-pairing','setup-courts','setup-format','setup-date','setup-time'].includes",'time input change');
s=one(s,"<span><b>Date</b> \${esc(s.date||'—')}</span>","<span><b>Date & Time</b> \${esc(s.date||'—')}\${s.time?' · '+esc(s.time):''}</span>",'header date/time');
s=one(s,"session:state.session||'',date:state.date||'',","session:state.session||'',date:state.date||'',time:state.time||'',",'published time');
s=one(s,"const hasKO=s.ko?.format!=='none',leader=statistics(s),winner=s.ko.champion||[],runner=s.ko.runnerUp||(!hasKO&&leader[1]?[leader[1].id]:null);",
"const hasKO=!!(s.ko&&s.ko.format&&s.ko.format!=='none'),leader=statistics(s),winner=hasKO?(s.ko?.champion||[]):(leader[0]?[leader[0].id]:[]),runner=hasKO?(s.ko?.runnerUp||null):(leader[1]?[leader[1].id]:null);",'no-KO winner and runner-up');

// Phase 5.7.2: Existing Sessions is managed exclusively on the Home screen.
// Do not duplicate the same archives beneath Initial Setup; preserve storage and APIs.
const duplicateSetupSessions='\x24{homeExistingSessions(s)}</section>';
if(s.includes(duplicateSetupSessions)){
 const count=s.split(duplicateSetupSessions).length-1;
 if(count!==1)throw Error('Phase57 ambiguous Existing Sessions setup hook');
 s=s.replace(duplicateSetupSessions,'</section>');
}
// Move JSON restore into Session Management, remove its setup footer button.
// The setup is still available from Home Session History.
const originalFooter='<div class="p5-v212-restore-home"><button type="button" data-act="restore">Restore Backup JSON</button><input id="restore-input" type="file" accept="application/json,.json" hidden aria-label="Restore tournament backup"></div>';
if(s.includes(originalFooter))s=s.replace(originalFooter,'');
const originalAdvanced="const advanced=entry('Advanced Settings','settings',block('UNDO / REDO',[historyControls])+block('SYSTEM DIAGNOSTICS',[audit,act('System Check','system-check'),act('Activity Log','activity-log')])+block('DATA MANAGEMENT',[act('Backup Data','backup'),act('Restore Backup','restore')])+\`<input id=\"restore-input\" type=\"file\" accept=\"application/json,.json\" style=\"display:none\">\`);";
const replacementAdvanced="const sessions=entry('Session Management','settings',block('SESSION DATA',[act('Backup Data','backup'),act('Restore Backup JSON','restore')])+\`<input id=\"restore-input\" type=\"file\" accept=\"application/json,.json\" style=\"display:none\">\`);\\n  const advanced=entry('Advanced Settings','settings',block('UNDO / REDO',[historyControls])+block('SYSTEM DIAGNOSTICS',[audit,act('System Check','system-check'),act('Activity Log','activity-log')]));";
s=one(s,originalAdvanced,replacementAdvanced.replace('\\n','\n'),'session management');
s=one(s,"\${playersCourts}\${management}\${share}\${advanced}","\${playersCourts}\${management}\${share}\${sessions}\${advanced}",'menu sessions');
// Time input is intentionally native on iOS, not a separate custom date picker.
if(!s.includes('p57-date-time-style')){
 const headClose=s.indexOf('</head>');if(headClose<0)throw Error('Phase57 head tag missing');
 const styles=`<style id="p57-date-time-style">
#americano .p57-date-time{grid-column:1/-1!important;min-width:0!important;width:100%!important}
#americano .p57-date-time-label{color:#d7bd93;font-size:10px;letter-spacing:.12em;font-weight:750;margin-bottom:8px}
#americano .p57-date-time-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(145px,195px);gap:10px;align-items:stretch;min-width:0}
#americano .p57-date-control,#americano .p57-time-control{display:flex!important;min-width:0;width:100%;align-items:stretch}
#americano .p57-date-control .p5-b2-date-wrap{width:100%!important;min-width:0!important;min-height:50px!important;height:50px!important;position:relative!important}
#americano .p57-date-control #setup-date-display{max-width:calc(100% - 34px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
#americano .p57-time-control select{width:100%!important;height:50px!important;min-height:50px!important;padding:0 13px!important;background:#111d29!important;color:#eee3d1!important;border:1px solid rgba(210,196,170,.32)!important;border-radius:11px!important;font:600 13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;outline:none;cursor:pointer}
#americano .p57-time-control select:focus-visible{outline:2px solid #d7b88b!important;outline-offset:2px!important}
@media(max-width:580px){#americano .p57-date-time-row{grid-template-columns:minmax(0,1fr) minmax(124px,36%);gap:8px}#americano .p57-date-control #setup-date-display{font-size:11px}}
@media(max-width:350px){#americano .p57-date-time-row{grid-template-columns:minmax(0,1fr)}#americano .p57-date-time-row .p57-time-control select{height:46px!important;min-height:46px!important}}
</style>`;
 s=s.slice(0,headClose)+styles+s.slice(headClose);
}
write('public/modes/unified/index.html',s);
let viewer=read('public/assets/p5-interactive-results.js');
viewer=one(viewer,"dayDate(data.date).replace(' · ', ', ')","dayDate(data.date).replace(' · ', ', ')+(data.time?' · '+data.time:'')",'public results date/time');
write('public/assets/p5-interactive-results.js',viewer);
let pdf=read('public/assets/p5-direct-pdf.js');
pdf=one(pdf,"ell(dayDate(data.date),37)","ell(dayDate(data.date)+(data.time?' · '+data.time:''),37)",'PDF date/time');
write('public/assets/p5-direct-pdf.js',pdf);
let api=read('netlify/functions/unified-results.mjs');
api=one(api,"if(!Number.isInteger(s.courts)||s.courts<1||s.courts>5)return false;","if(s.time!==undefined&&(typeof s.time!=='string'||(s.time!==''&&!/^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(s.time))))return false;\n  if(!Number.isInteger(s.courts)||s.courts<1||s.courts>5)return false;",'API optional time');
write('netlify/functions/unified-results.mjs',api);
// PWA caches the versioned Session History shell for offline PWA use.
let serviceWorker=read('public/sw.js');
serviceWorker=one(serviceWorker,"const VERSION = 'p5-pwa-lab-v566-1';","const VERSION = 'p5-pwa-phase57-v5701';",'PWA cache version');
serviceWorker=one(serviceWorker,"'/pwa-standalone-layout-v5601.css',","'/pwa-standalone-layout-v5601.css', '/phase57/home-session-history.js', '/phase57/home-session-history.css',",'PWA precache');
serviceWorker=one(serviceWorker,"asset.startsWith('/assets/') || asset.startsWith('/pwa/') ||","asset.startsWith('/assets/') || asset.startsWith('/pwa/') || asset.startsWith('/phase57/') ||",'PWA asset cache');
write('public/sw.js',serviceWorker);
// Keep WhatsApp preview discreet: one canonical title/description, not a giant data card.
let publicHtml=read('public/results/unified/index.html');
publicHtml=one(publicHtml,'content="PADEL 5IVE · Official Results"','content="PADEL 5IVE · Signature Game"','WhatsApp OG title');
publicHtml=one(publicHtml,'content="PADEL 5IVE Signature Game · Official Tournament Results"','content="Official Match Results · Beyond 5IVE. Beyond Play."','WhatsApp OG description');
write('public/results/unified/index.html',publicHtml);
console.log('Phase 5.7 integrated source patch completed.');
