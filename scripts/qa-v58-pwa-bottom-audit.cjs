/* Read-only diagnostics for iOS PWA background boundary. */
const fs=require('node:fs');
const h=fs.readFileSync('public/index.html','utf8');
const css=fs.readFileSync('public/pwa-standalone-layout-v5601.css','utf8');
const buckets=[
  ['html',/html\b[^\{]{0,90}\{[^}]{0,600}\}/gi],
  ['body',/(?:^|[\n\r])\s*body\b[^{]{0,90}\{[^}]{0,650}\}/gim],
  ['#portal',/#portal\b[^{]{0,120}\{[^}]{0,750}\}/gi],
  ['.p541-venue',/\.p541-venue\b[^{]{0,120}\{[^}]{0,750}\}/gi],
  ['.p54-workspace',/\.p54-workspace\b[^{]{0,120}\{[^}]{0,750}\}/gi],
  ['#p54-workspace',/#p54-workspace\b[^{]{0,120}\{[^}]{0,750}\}/gi],
  ['.signature',/\.signature\b[^{]{0,100}\{[^}]{0,650}\}/gi],
];
for(const [name,re] of buckets){
 const matches=[...h.matchAll(re)];
 console.log('\n===== '+name+' total '+matches.length+' =====');
 matches.slice(-15).forEach((m,i)=>console.log('RULE '+(matches.length-Math.min(matches.length,15)+i)+' AT '+m.index+' '+m[0].replace(/\s+/g,' ').slice(0,840)));
}
const tail=h.lastIndexOf('id="portal"'),view=h.lastIndexOf('id="p54-workspace"');
console.log('PORTAL markup at '+tail+'\n'+h.slice(Math.max(0,tail-450),tail+350));
console.log('WORKSPACE markup at '+view+'\n'+h.slice(Math.max(0,view-350),view+300));
console.log('STANDALONE CSS\n'+css.slice(0,1500));
