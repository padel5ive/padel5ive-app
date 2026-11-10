'use strict';
const fs=require('node:fs'),s=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const spec of [
 ['window.P5Structured=',5000],
 ['function formSetup(',4600],
 ['function structuredReg(s)',3300],
 ['function reg(s)',3900],
 ['function nextRegistration()',2500],
 ['function start(){collectRegistration()',1300],
 ['function validate(s)',2200],
 ['p5-51-label-a',850],
 ['GROUP A LABEL',850],
 ['GROUP NAME<input',1150],
 ["id='setup-pairing'",1450],
 ['id="setup-pairing"',1900],
 ['pairingStyles',1400],
 ['Structured Pairing',1000],
 ['NORMAL',800],
 ['Flexible Pairing',700],
 ['pairingOptions',1000],
 ['Group A',700],
 ['p5-52-registration',700]
]){
 const [term,span]=spec;const locations=[];let i=-1;
 while((i=s.indexOf(term,i+1))>=0){locations.push(i);if(locations.length>=90)break;}
 console.log('TERM',JSON.stringify(term),'COUNT',locations.length,'LOC',locations.slice(-8).join(','));
 for(const pos of locations.slice(0,term==='p5-51-label-a'||term==='Group A'||term==='Structured Pairing'?1:2)){
  console.log('SNIP',JSON.stringify(term),pos,s.slice(Math.max(0,pos-200),pos+span).replace(/\n/g,' '));
 }
}
