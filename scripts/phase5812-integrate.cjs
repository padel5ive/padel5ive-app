/* PADEL 5IVE v5.8.12 Smart Player Input — native registration action. */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const native="case 'registration-add':collectRegistration();addParticipant();render();break;";
const injected="case 'smart-player-import':{\n    if(s.stage!=='registration')break;\n    const batch=window.P5SmartInput?.pending?.();\n    if(!batch||!batch.names?.length)return toast('Preview the WhatsApp list before adding players.');\n    const individual=ENG[s.mode].kind==='individual',structured=P5Structured.is(s);\n    if(batch.mode!==(structured?'structured':individual?'individual':'fixed'))return toast('Player Registration has changed. Preview again.');\n    if(!individual&&(!batch.paired||batch.names.length%2))return toast('Confirm complete consecutive pairs before importing.');\n    collectRegistration();\n    const existing=new Set(s.roster.flatMap(p=>p.names.filter(Boolean)).map(n=>n.trim().toLowerCase()));\n    if(batch.names.some(n=>existing.has(n.trim().toLowerCase())))return toast('Player list changed. Preview again to avoid duplicates.');\n    const group=batch.group==='B'?'B':'A';\n    const spare=s.roster.filter(p=>p.names.every(n=>!String(n||'').trim())&&(!structured||p.group===group));\n    const newEntries=[];\n    if(individual)batch.names.forEach(name=>newEntries.push([name]));\n    else for(let i=0;i<batch.names.length;i+=2)newEntries.push([batch.names[i],batch.names[i+1]]);\n    for(const names of newEntries){\n     const blank=spare.shift();\n     if(blank){blank.names=names;if(structured)blank.group=group;}\n     else {const person={id:s.nextId++,names};if(structured)person.group=group;s.roster.push(person);}\n    }\n    const persisted=save();\n    window.P5SmartInput.imported(batch.names.length);\n    render();\n    toast(batch.names.length+' player'+(batch.names.length===1?'':'s')+' imported'+(persisted?'':' · Save local backup before leaving'));\n   }break;";
if(!html.includes("case 'smart-player-import':")){
 if(html.split(native).length!==2)throw Error('v5812: registration controller source drift');
 html=html.replace(native,injected+'\n   '+native);
}
const js='<script defer src="/assets/p5-smart-player-input-v5812.js"></script>';
if(!html.includes(js)){
 const end=html.lastIndexOf('</body>');
 if(end<0)throw Error('v5812: no body close');
 html=html.slice(0,end)+js+'\n'+html.slice(end);
}
const css='<link rel="stylesheet" href="/assets/p5-smart-player-input-v5812.css">';
if(!html.includes(css)){
 const head=html.indexOf('</head>');
 if(head<0||head>html.indexOf('<body'))throw Error('v5812: no root head close');
 html=html.slice(0,head)+css+'\n'+html.slice(head);
}
fs.writeFileSync(file,html);
for(const p of ['public/assets/p5-smart-player-input-v5812.js','public/assets/p5-smart-player-input-v5812.css'])
 if(!fs.statSync(p).size)throw Error('v5812: empty Smart Input asset '+p);
console.log('v5.8.12: WhatsApp Smart Player Input integrated with native shared Registration.');
