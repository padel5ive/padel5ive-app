/* Phase 5.8 integrated HTML parse + Team Showdown menu audit. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let count=0;
for(const filename of ['public/index.html','public/modes/unified/index.html','public/modes/club-match/index.html']){
 const html=fs.readFileSync(filename,'utf8');
 const r=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
 let match;while((match=r.exec(html))){
  if(/\bsrc\s*=/.test(match[1])||/type\s*=\s*["'](?:application\/json|module)/i.test(match[1]))continue;
  if(!match[2].trim())continue;
  try{new vm.Script(match[2],{filename:filename+':inline-'+count});}
  catch(e){throw Error('Invalid compiled embedded JS at '+filename+' script #'+count+': '+e.message);}
  count++;
 }
 if(filename.includes('modes/club-match')){
  const markers=['Menu & Settings','menu-settings','SESSION MANAGEMENT','Session Management','Backup Data','Restore Backup','backup-data','settings'];
  for(const term of markers){const p=html.lastIndexOf(term);if(p>=0)console.log('CLUB MENU '+term+' at '+p+':\n'+html.slice(Math.max(0,p-430),Math.min(html.length,p+550)).replace(/\n{3,}/g,'\n\n'));}
 }
}
const sw=fs.readFileSync('public/sw.js','utf8');
assert(sw.includes("asset.startsWith('/phase58/')"),'PWA cloud client assets must be cacheable');
assert(!sw.includes("'/api/cloud-session'"),'Cloud API must NOT be cached by service-worker');
console.log('PASS v5.8 inline JS syntax:',count,'embedded scripts; UI links present.');
