import fs from 'node:fs';
import {createHash} from 'node:crypto';
const must=['public/index.html','public/og-cover.jpg','public/modes/unified/index.html','public/modes/club-match/index.html','netlify/functions/unified-results.mjs','netlify/functions/results.mjs'];
for(const path of must){if(!fs.existsSync(path)||fs.statSync(path).size<100)throw Error('Missing or empty required file: '+path);}
const root=fs.readFileSync('public/index.html','utf8');
const unified=fs.readFileSync('public/modes/unified/index.html','utf8');
const club=fs.readFileSync('public/modes/club-match/index.html','utf8');
const redirect=fs.readFileSync('netlify.toml','utf8');
if(!root.includes('window.P5PreviewLaunch=function') || !root.includes('START NEW SESSION'))throw Error('Home routing or session action missing');
if(!unified.includes('P5PublicResults') || !unified.includes('Champion'))throw Error('Unified module not found');
if(!club.includes('TEAM SHOWDOWN') && !club.includes('Team Showdown'))throw Error('Club Match module not found');
if(!redirect.includes('publish = "public"') || !redirect.includes('/u/*') || !redirect.includes('/r/*'))throw Error('Unsafe or incomplete Netlify routing');
console.log('PADEL 5IVE v5.4.13 build checks passed:',must.length,'required files');
