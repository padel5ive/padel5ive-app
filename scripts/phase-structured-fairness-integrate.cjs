'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->';
const insert=marker+'<script src="/assets/p5-structured-fairness-lab.js"></script><script src="/assets/p5-structured-mexicano-diversity-lab.js"></script>';
if(!html.includes('window.P5StructuredCycle534=')||!html.includes('window.P5StructuredMX534=')||!html.includes('window.P5Fair532='))throw Error('Structured engine baseline missing; integration aborted');
if(!html.includes('</body>'))throw Error('Dashboard closing body tag missing');
for(const p of ['public/assets/p5-structured-fairness-lab.js','public/assets/p5-structured-mexicano-diversity-lab.js'])if(!fs.existsSync(p))throw Error('Missing new lab asset: '+p);
if(!html.includes(marker)){
 html=html.replace('</body>',insert+'</body>');
 fs.writeFileSync(file,html,'utf8');
}else if(html.split(marker).length!==2)throw Error('Duplicate structured lab injection marker');
console.log('PASS: Structured lab scripts injected after native engines, before closing body.');
