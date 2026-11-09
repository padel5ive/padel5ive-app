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
inject('public/index.html','</body>','<script defer src="/phase57/home-session-history.js"></script>','Home session controller');
let s=read('public/modes/unified/index.html');
s=one(s,"session:'',date:'',courts:null","session:'',date:'',time:'',courts:null",'new state game time');
const oldDateLabel='<label class="p5-b2-wide">GAME DATE<span class="p5-b2-date-wrap">';
if(!s.includes('id="setup-time"')){
 const start=s.indexOf(oldDateLabel),end=s.indexOf('</label>',start);
 if(start<0||end<0||end-start>1800)throw Error('Phase57 game-date markup changed');
 const insert='<label class="p5-b2-wide p57-game-time">GAME TIME<span class="p5-b2-time-wrap"><input id="setup-time" type="time" step="60" value="\${esc(s.time||\'\')}" aria-label="Game Time"></span></label>';
 s=s.slice(0,end+8)+insert+s.slice(end+8);
}
// session time is required for new sessions, optional for legacy snapshots.
s=one(s,"const ready=Boolean($('setup-session')?.value.trim()&&date?.value&&game.value","const ready=Boolean($('setup-session')?.value.trim()&&date?.value&&$('setup-time')?.value&&game.value",'setup validation');
s=one(s,"const session=$('setup-session')?.value.trim(),date=$('setup-date')?.value,game=","const session=$('setup-session')?.value.trim(),date=$('setup-date')?.value,time=$('setup-time')?.value,game=",'collect time');
s=one(s,"if(!validDate)return toast('Select a valid Game Date');","if(!validDate)return toast('Select a valid Game Date');\n  if(!/^(?:[01]\\d|2[0-3]):[0-5]\\d$/.test(time||''))return toast('Select a valid Game Time');",'validate time');
s=one(s,"s.session=session;s.date=date;s.mode=candidate.id;","s.session=session;s.date=date;s.time=time;s.mode=candidate.id;",'save time');
s=one(s,"['setup-pairing','setup-courts','setup-format','setup-date'].includes","['setup-pairing','setup-courts','setup-format','setup-date','setup-time'].includes",'time input change');
s=one(s,"<span><b>Date</b> \${esc(s.date||'—')}</span>","<span><b>Date & Time</b> \${esc(s.date||'—')}\${s.time?' · '+esc(s.time):''}</span>",'header date/time');
s=one(s,"session:state.session||'',date:state.date||'',","session:state.session||'',date:state.date||'',time:state.time||'',",'published time');
// Move JSON restore into Session Management, remove its setup footer button.
// The setup is still available from Home Session History.
const originalFooter='<div class="p5-v212-restore-home"><button type="button" data-act="restore">Restore Backup JSON</button><input id="restore-input" type="file" accept="application/json,.json" hidden aria-label="Restore tournament backup"></div>';
if(s.includes(originalFooter))s=s.replace(originalFooter,'');
const originalAdvanced="const advanced=entry('Advanced Settings','settings',block('UNDO / REDO',[historyControls])+block('SYSTEM DIAGNOSTICS',[audit,act('System Check','system-check'),act('Activity Log','activity-log')])+block('DATA MANAGEMENT',[act('Backup Data','backup'),act('Restore Backup','restore')])+\`<input id=\"restore-input\" type=\"file\" accept=\"application/json,.json\" style=\"display:none\">\`);";
const replacementAdvanced="const sessions=entry('Session Management','settings',block('SESSION DATA',[act('Backup Data','backup'),act('Restore Backup JSON','restore')])+\`<input id=\"restore-input\" type=\"file\" accept=\"application/json,.json\" style=\"display:none\">\`);\\n  const advanced=entry('Advanced Settings','settings',block('UNDO / REDO',[historyControls])+block('SYSTEM DIAGNOSTICS',[audit,act('System Check','system-check'),act('Activity Log','activity-log')]));";
s=one(s,originalAdvanced,replacementAdvanced.replace('\\n','\n'),'session management');
s=one(s,"\${playersCourts}\${management}\${share}\${advanced}","\${playersCourts}\${management}\${share}\${sessions}\${advanced}",'menu sessions');
// Time input is intentionally native on iOS, not a separate custom date picker.
if(!s.includes('p57-game-time-style')){
 s=one(s,'</head>',\`<style id="p57-game-time-style">
#americano .p57-game-time{grid-column:1/-1!important}
#americano .p5-b2-time-wrap{display:flex;align-items:center;height:50px;min-height:50px;width:100%;padding:0 13px;border:1px solid rgba(210,196,170,.32);border-radius:11px;background:#111d29}
#americano #setup-time{display:block;box-sizing:border-box;min-height:45px;width:100%;border:none;background:transparent;color:#f0e9dd;color-scheme:dark;outline:0;font:500 15px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
#americano #setup-time:focus-visible{outline:2px solid #d7b88b;outline-offset:2px;border-radius:4px}
</style></head>\`,'time input styles');
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
console.log('Phase 5.7 integrated source patch completed.');
