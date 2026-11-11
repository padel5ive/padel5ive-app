'use strict';
/* Insert after the shared PR29 dashboard transform, without touching gameplay. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const href='/pwa/iphone-stage1-session-order-v1.css?v=1';
assert(html.includes('p5-v26-session-control')&&html.includes('p5-v26-round-card'),'Stage 1 layout anchors missing');
assert(fs.existsSync('public/pwa/iphone-stage1-session-order-v1.css'),'Mobile CSS is missing');
if(!html.includes(href)){
 assert(html.includes('</head>'),'Unified HTML has no head close');
 html=html.replace('</head>', '<link rel="stylesheet" href="'+href+'">\n</head>');
 fs.writeFileSync(file,html);
}
assert.equal(html.split(href).length-1,1,'Mobile stylesheet must only load once');
console.log('PASS iPhone Session Control below Leaderboard CSS installed; iPad uses native PR29 columns.');
