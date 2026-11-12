/* PADEL 5IVE · Structured Americano late-return density integration.
 * Runs AFTER frozen PR36 patching. Injects only an external, mode-scoped
 * scheduling adapter; never rewrites embedded engine source or a scored match.
 */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
const asset='/assets/p5-structured-late-return-density.js';
const tag='<script src="'+asset+'"></script>';
const marker='<!-- P5 STRUCTURED LATE RETURN DENSITY 20261112 -->';
let html=fs.readFileSync(file,'utf8');
if(html.includes(marker)){
 if(html.split(marker).length!==2||html.split(tag).length!==2)
  throw Error('Duplicate Structured late-return adapter detected.');
 console.log('PASS Structured late-return adapter already integrated');process.exit(0);
}
if(!html.includes('<!-- P5 STRUCTURED FAIRNESS LAB 20261111 -->')||
   !html.includes('/* PR36 PROTECTED ROUND DISTRIBUTION: reserve a future fixture before compaction */'))
 throw Error('Structured fairness and protected PR36 baseline are required.');
if(!fs.existsSync('public'+asset))throw Error('Missing late-return scheduling adapter asset');
const tail=html.lastIndexOf('</body>');
if(tail<0||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(tail)))
 throw Error('Final document close not found');
html=html.slice(0,tail)+marker+tag+'\n'+html.slice(tail);
fs.writeFileSync(file,html);
console.log('PASS Structured late-return final-court adapter integrated after protected PR36 baseline.');
