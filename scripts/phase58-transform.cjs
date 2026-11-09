/* PADEL 5IVE v5.8 isolated Cloud Session hooks.
 * Runs only after the already locked Phase 5.7 transform in build.
 * Engine logic and existing score controls are left untouched.
 */
const fs=require('node:fs');
function patch(path,from,to,label){
 let s=fs.readFileSync(path,'utf8');
 if(s.includes(to))return;
 const n=s.split(from).length-1;
 if(n!==1)throw Error('v5.8 source drift: '+label+' expected one target, found '+n);
 s=s.replace(from,to);
 fs.writeFileSync(path,s);
}
function inject(path,token,markup,position='first'){
 let s=fs.readFileSync(path,'utf8');
 if(s.includes(markup))return;
 const i=position==='last'?s.lastIndexOf(token):s.indexOf(token);
 if(i<0)throw Error('v5.8 HTML insertion point missing: '+path+' '+token);
 s=s.slice(0,i)+markup+'\n'+s.slice(i);
 fs.writeFileSync(path,s);
}
inject('public/index.html','</head>','<link rel="stylesheet" href="/phase58/cloud-session.css">');
inject('public/index.html','</body>','<script defer src="/phase58/cloud-home.js"></script>','last');
for(const page of ['public/modes/unified/index.html','public/modes/club-match/index.html']){
 inject(page,'</head>','<link rel="stylesheet" href="/phase58/cloud-session.css">');
 inject(page,'</body>','<script defer src="/phase58/cloud-dashboard.js"></script>','last');
}
// Home Resume is ONLY for in-progress sessions. Champions/final results remain
// accessible through Session History -> Past (never by the Home Resume shortcut).
// Stored club archives also belong in History, not in this live shortcut.
patch('public/index.html',
 "    const a=activeUnified(),b=activeClub();\n    if(a)sessions.push({name:clean(a.session),kind:'unified',url:route('unified'),label:'Americano / Mexicano'});\n    if(b)sessions.push({name:clean(b.setup.sessionName),kind:'club',url:route('club'),label:'Team Showdown'});",
 "    const a=activeUnified(),b=activeClub();\n    const p58Finished=x=>['champion','finished','completed','complete','final'].includes(String(x?.stage||'').toLowerCase());\n    if(a&&!p58Finished(a))sessions.push({name:clean(a.session),kind:'unified',url:route('unified'),label:'Americano / Mexicano'});\n    if(b&&!p58Finished(b))sessions.push({name:clean(b.setup.sessionName),kind:'club',url:route('club'),label:'Team Showdown'});",
 'No Resume for completed tournaments');
patch('public/index.html',
 "    const archived=parse(KEY_CLUB_ARCH);\n    if(Array.isArray(archived))archived.slice(0,4).forEach(x=>{\n      if(x?.id&&x.state?.setup)sessions.push({name:clean(x.state.setup.sessionName),kind:'archive',url:route('club','archive',x.id),label:'Saved Club Match'});\n    });",
 "    // Archived sessions live exclusively in Session History.",
 'No archived sessions in Home Resume');
// Club Match has a static native Advanced Settings panel. Keep the existing panel,
// and insert a matching Session Management section directly above it.
patch('public/modes/club-match/index.html',
 '<details class="mc32-advanced"><summary>Advanced Settings</summary>',
 '<details class="mc32-advanced"><summary>Session Management</summary><div class="mc32-advanced-body"><button type="button" data-p58-cloud class="p58-menu-action">CLOUD SESSION</button></div></details>\n<details class="mc32-advanced"><summary>Advanced Settings</summary>',
 'Club Match native Session Management');
// Unified native Menu & Settings includes Session Management. Insert a real action
// into that SAME native menu; fixed mini-button remains a fallback on Club Match.
patch('public/modes/unified/index.html',
 "block('SESSION DATA',[act('Backup Data','backup'),act('Restore Backup JSON','restore')])+",
 "block('SESSION DATA',[act('Backup Data','backup'),act('Restore Backup JSON','restore')])+`<button type=\"button\" data-p58-cloud class=\"p58-menu-action\">CLOUD SESSION</button>`+",
 'Unified Session Management native menu action');
patch('public/sw.js',"const VERSION = 'p5-pwa-phase57-v577';","const VERSION = 'p5-pwa-phase58-lab-01';",'PWA version');
patch('public/sw.js',
 "'/phase57/social-card-v574.js',",
 "'/phase57/social-card-v574.js', '/phase58/cloud-session.css', '/phase58/cloud-home.js', '/phase58/cloud-dashboard.js',",
 'PWA cloud client precache');
patch('public/sw.js',
 "asset.startsWith('/phase57/') ||",
 "asset.startsWith('/phase57/') || asset.startsWith('/phase58/') ||",
 'PWA cloud asset cache');
const home=fs.readFileSync('public/index.html','utf8');
const unified=fs.readFileSync('public/modes/unified/index.html','utf8');
const club=fs.readFileSync('public/modes/club-match/index.html','utf8');
if(!home.includes('/phase58/cloud-home.js')||!unified.includes('data-p58-cloud')||
 !unified.includes('/phase58/cloud-dashboard.js')||!club.includes('/phase58/cloud-dashboard.js'))throw Error('v5.8 missing cloud UI links');
console.log('PADEL 5IVE v5.8 cloud integration applied (LAB only).');
