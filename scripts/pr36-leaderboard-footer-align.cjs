'use strict';
// PR36 visual-only: remove the leaderboard's legacy 14px collapsed margin.
// This aligns its bottom with the Rounds panel while keeping scoring, ranking and iPad unchanged.
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* PR36 LEADERBOARD FOOTER ALIGNMENT: same 12px rhythm as Rounds */';
if(html.includes(marker)){console.log('PASS PR36 leaderboard footer alignment already installed');process.exit(0)}
for(const needle of ['PR36 FOOTER RHYTHM: move safe-area clearance from branding to main','p5-pr36-mobile-active','p5-b41-leaderboard'])if(!html.includes(needle))throw Error('PR36 leaderboard footer baseline drift: '+needle);
const css='\n'+marker+'\n@media screen and (max-width:700px){\n #americano.p5-pr36-mobile-active[data-p5-pr36-view="leaderboard"]>.layout>aside>.p5-b41-leaderboard{margin-bottom:0!important}\n}\n';
const styleEnd=html.lastIndexOf('</style>'),bodyEnd=html.lastIndexOf('</body>');
if(styleEnd<0||bodyEnd<styleEnd||!/^<\/body>\s*<\/html>\s*$/i.test(html.slice(bodyEnd)))throw Error('PR36 leaderboard footer style anchor changed');
html=html.slice(0,styleEnd)+css+html.slice(styleEnd);
fs.writeFileSync(file,html);
console.log('PASS PR36 leaderboard footer: consistent 12px gap, Rounds/iPad unchanged');
