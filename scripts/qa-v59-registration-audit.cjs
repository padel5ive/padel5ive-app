const fs=require('node:fs');
const s=fs.readFileSync('public/modes/unified/index.html','utf8');
for(const [name,needle,len] of [
 ['registration function',' function reg(s)',8200],
 ['extra reg function','function reg(s)',6000],
 ['p5 registration hook','p5-b32-registration',3500],
 ['coach registration','function rule',2500],
 ['native add','function addParticipant()',1700],
 ['collect','function collectRegistration()',2600],
 ['paste safe','function registration',1600],
 ['native setup','function start()',2500],
 ['controls placeholder','</details>',500],
 ['Registration wrapper','class="card p5-b32-registration',500],
]){const i=s.indexOf(needle,2460000);console.log('==== '+name+' @'+i);if(i>=0)console.log(s.slice(Math.max(0,i-100),i+len));}
const i=s.indexOf('function reg(s)',2460000);if(i>=0){const after=s.slice(i,i+23000);console.log('===== REGISTRATION-FULL =====\n'+after);}
