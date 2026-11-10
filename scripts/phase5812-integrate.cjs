/* PADEL 5IVE v5.8.12 Smart Player Input — native registration action. */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const native="case 'registration-add':collectRegistration();addParticipant();render();break;";
const injected="case 'smart-player-import':{\n    if(s.stage!=='registration')break;\n    const batch=window.P5SmartInput?.pending?.();\n    if(!batch||!Array.isArray(batch.names)||!batch.names.length)return toast('Preview the player list before adding.');\n    const individual=ENG[s.mode].kind==='individual',structured=P5Structured.is(s);\n    if(batch.mode!==(structured?'structured':individual?'individual':'fixed'))return toast('Registration mode changed. Preview again.');\n    // Fixed Partner imports ONLY pair assignments selected explicitly in Pairing Review.\n    // Never derive pairs from the order of the source list.\n    if(!individual){\n     if(!Array.isArray(batch.pairs)||!batch.pairs.length||batch.pairs.some(pair=>!Array.isArray(pair)||pair.length!==2))\n      return toast('Select two players per pair in Pairing Review first.');\n     const flat=batch.pairs.flat();\n     if(flat.length!==batch.names.length||flat.some((name,i)=>name!==batch.names[i]))\n      return toast('Pairing Review changed. Preview again.');\n    }\n    if(batch.names.some(name=>typeof name!=='string'||!name.trim()||name.length>70))\n     return toast('Invalid player name. Review the list first.');\n    const normalized=batch.names.map(name=>name.trim().toLowerCase());\n    if(new Set(normalized).size!==normalized.length)return toast('Duplicate player in Pairing Review.');\n    collectRegistration();\n    const existing=new Set(s.roster.flatMap(p=>p.names.filter(Boolean)).map(n=>n.trim().toLowerCase()));\n    if(normalized.some(name=>existing.has(name)))return toast('Player already registered. Preview again to avoid duplicates.');\n    const group=batch.group==='B'?'B':'A';\n    const spare=s.roster.filter(p=>p.names.every(n=>!String(n||'').trim())&&(!structured||p.group===group));\n    const entries=individual?batch.names.map(name=>[name]):batch.pairs.map(pair=>pair.slice());\n    for(const names of entries){\n     const blank=spare.shift();\n     if(blank){blank.names=names;if(structured)blank.group=group;}\n     else{const person={id:s.nextId++,names};if(structured)person.group=group;s.roster.push(person);}\n    }\n    const persisted=save();\n    window.P5SmartInput.imported(batch.names.length);\n    render();\n    toast((individual?batch.names.length+' players':batch.pairs.length+' pairs')+' imported'+(persisted?'':' · Export backup before leaving'));\n   }break;";
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
