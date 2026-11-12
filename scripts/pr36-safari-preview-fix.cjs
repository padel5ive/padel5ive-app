'use strict';
// PR36 review follow-up: iPad Safari score picker and court-flow alignment.
// Applied after the original PR36 build patch; does not alter scoring or scheduling.
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const marker='/* P5 PR36 REVIEW: explicit score picker interaction and aligned flow rule */';
const focus="s.ui.modal={type:'score',title:'Confirm Score',match:m,ko};render();const input=$('p5-score-a');if(input)input.focus();";
const unfocused="s.ui.modal={type:'score',title:'Confirm Score',match:m,ko};render();";
if(html.includes(focus))html=html.replace(focus,unfocused);
else if(!html.includes(unfocused))throw Error('PR36 review: scoreModal focus source changed; inspect before patching');
if(!html.includes(marker)){
 const style=`
${marker}
/* Only a deliberate tap should open an iPad Safari native score select. */
#americano .p5-stage1-score-grid>.p5-v26-flow-combo{position:relative!important;overflow:hidden!important}
#americano .p5-stage1-score-grid>.p5-v26-flow-combo::before{content:'';position:absolute;inset:0 auto 0 0;width:2px;background:#bba077;opacity:.6;pointer-events:none}
#americano .p5-v26-flow-combo>.p5-rest-card::before{content:none!important;display:none!important}
`;
 const end='</style>\n</body></html>';
 if(!html.endsWith(end))throw Error('PR36 review: expected final style anchor changed');
 html=html.slice(0,-end.length)+style+end;
}
if(html.includes(focus))throw Error('PR36 review: unexpected auto-focused score selector remains');
fs.writeFileSync(file,html);
console.log('PASS PR36 review follow-up: manual Safari score selection + flow accent aligned');
