import fs from 'node:fs';
import {createHash} from 'node:crypto';
const must=['public/index.html','public/og-cover.jpg','public/modes/unified/index.html','public/modes/club-match/index.html','netlify/functions/unified-results.mjs','netlify/functions/results.mjs','public/assets/p5-direct-pdf.js','public/assets/p5-interactive-results.js','public/assets/fixed-master-official-results.css','public/results/unified/index.html'];
for(const path of must){if(!fs.existsSync(path)||fs.statSync(path).size<100)throw Error('Missing or empty required file: '+path);}
const root=fs.readFileSync('public/index.html','utf8');
const unified=fs.readFileSync('public/modes/unified/index.html','utf8');
const club=fs.readFileSync('public/modes/club-match/index.html','utf8');
const redirect=fs.readFileSync('netlify.toml','utf8');
if(!root.includes('window.P5PreviewLaunch=function') || !root.includes('START NEW SESSION'))throw Error('Home routing or session action missing');
if(!unified.includes('P5PublicResults') || !unified.includes('Champion'))throw Error('Unified module not found');
if(!club.includes('TEAM SHOWDOWN') && !club.includes('Team Showdown'))throw Error('Club Match module not found');
if(!redirect.includes('publish = "public"') || !redirect.includes('/u/*') || !redirect.includes('/r/*'))throw Error('Unsafe or incomplete Netlify routing');
if(!unified.includes('window.P5CourtRotation') || !unified.includes("case 'pdf-download'"))throw Error('Court rotation or native PDF export missing');
if(!unified.includes('55 55 55 55 55 55') || !club.includes('55 55 55 55'))throw Error('Share PIN visual labels missing');
if(!redirect.includes('to = "/results/unified/index.html"'))throw Error('Public Unified share route must use master-style interactive viewer');
const viewer=fs.readFileSync('public/assets/p5-interactive-results.js','utf8');
if(!viewer.includes('Analyze Your') || !viewer.includes('Knockout Bracket') || !viewer.includes('Round History'))throw Error('Read-only interactive viewer missing master sections');
if(unified.includes("act('Download Official Report HTML'"))throw Error('Legacy HTML download remains in Share & Export');
console.log('PADEL 5IVE v5.4.13.8 build checks passed:',must.length,'required files');
