'use strict';
/* PADEL 5IVE · PR30 · iPhone Stage 1 only
 * Visually reorders native Session Control after Leaderboard.
 * Does not move DOM nodes, re-render controls, or touch scores / cloud permissions.
 * Leaves iPad native left-column control and right-column leaderboard untouched.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const id='p5-iphone-session-control-order';
if(html.includes('id="'+id+'"')){console.log('PASS iPhone Session Control mobile layout already integrated');process.exit(0);}
assert(html.includes('p5-v26-session-control')&&html.includes('p5-v26-round-card')&&html.includes('</head>'),'Unified Stage 1 anchors missing');
const scope='#americano .layout:has(> div:first-child > .p5-v26-session-control)';
const rules=[
 '/* iPhone-only Stage 1: Court Scoring → Leaderboard → Session Control. */',
 '@media screen and (max-width: 779px){',
 ' '+scope+' {display:flex!important;flex-direction:column!important;gap:12px!important;}',
 ' '+scope+' > div:first-child {display:contents!important;}',
 ' '+scope+' > div:first-child > .p5-v26-round-card {order:0!important;}',
 ' '+scope+' > div:first-child > .prematch-setup {order:1!important;}',
 ' '+scope+' > aside {order:2!important;width:100%!important;min-width:0!important;margin:0!important;}',
 ' '+scope+' > div:first-child > .p5-v26-session-control {order:3!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0!important;}',
 '}'
].join('\n');
html=html.replace('</head>','<style id="'+id+'">\n'+rules+'\n</style>\n</head>');
fs.writeFileSync(file,html);
console.log('PASS PR30: iPhone-only Stage 1 control after leaderboard; iPad markup untouched');
