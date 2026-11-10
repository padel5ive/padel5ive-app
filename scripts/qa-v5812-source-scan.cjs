'use strict';const fs=require('node:fs'),s=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const term of ['function collectRegistration()','function addParticipant()','function start()','function nextRegistration()',"case 'registration-add':",'function save()','function render(){','function action(act,el,scoreSide)']){
let i=s.indexOf(term);console.log('TERM '+term+' AT '+i);if(i>=0)console.log('CONTEXT '+term+'\n'+s.slice(i,Math.min(s.length,i+2100))+'\nENDCTX');}
