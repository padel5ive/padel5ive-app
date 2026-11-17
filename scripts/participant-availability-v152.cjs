/* PADEL 5IVE v1.5.2 · Shared native participant availability selector hotfix.
 * PR36 preserved correct P5Availability controller, but rendered only one contextual action.
 * Both Active and Sit Out must be true native buttons. Keep NOT_ARRIVED state unchanged
 * until moderator explicitly selects and saves. Do not patch engine, scores or sessions.
 */
'use strict';
const fs=require('node:fs');
const target='public/modes/unified/index.html';
let html=fs.readFileSync(target,'utf8');
const marker='P5 V152 INTERACTIVE PARTICIPATION SELECTOR';
if(html.includes(marker))throw Error('Availability selector already installed');
const pattern=/<div class="p5-b31-status-choice p5-polish-one-action" role="group" aria-label="Player availability action">[\s\S]*?<\/div>/g;
const matches=html.match(pattern)||[];
if(matches.length!==1)throw Error('Native PR36 availability selector source drift: expected one, found '+matches.length);
const replacement="<div class=\"p5-b31-status-choice p5-b31-dual-choice\" role=\"group\" aria-label=\"Participation status\"><button type=\"button\" class=\"${draft==='ACTIVE'?'is-selected':''}\" data-act=\"participant-toggle\" data-status=\"active\" data-id=\"${m.personId}\" aria-pressed=\"${draft==='ACTIVE'}\">Active</button><button type=\"button\" class=\"${draft==='SIT_OUT'?'is-selected is-sitout':''}\" data-act=\"participant-toggle\" data-status=\"sitout\" data-id=\"${m.personId}\" aria-pressed=\"${draft==='SIT_OUT'}\">Sit Out</button></div>";
if(!matches[0].includes('data-act="participant-toggle"')||!matches[0].includes('draft'))throw Error('Unexpected PR36 participation DOM source');
html=html.replace(pattern,replacement);
const css="\n/* V1.5.2 native shared availability selector; ALWAYS interactive in Manage Players too. */\n#p5-modal-root .p5-b31-dual-choice{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  padding:5px!important;gap:5px!important;min-width:0!important;align-items:stretch!important;\n}\n#p5-modal-root .p5-b31-dual-choice button{\n  position:relative!important;pointer-events:auto!important;touch-action:manipulation!important;\n  min-width:0!important;min-height:46px!important;padding:10px 7px!important;\n  border:1px solid transparent!important;border-radius:8px!important;\n  color:#c3cdd2!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important;\n}\n#p5-modal-root .p5-b31-dual-choice button.is-selected{\n  border-color:rgba(208,173,126,.64)!important;background:#334657!important;\n  color:#f0e0c6!important;\n}\n#p5-modal-root .p5-b31-dual-choice button.is-selected.is-sitout{\n  background:#4d3b34!important;border-color:#bd9074!important;color:#f4dac7!important;\n}\n@media(max-width:700px){\n  #p5-modal-root .p5-b31-dual-choice button{\n    min-height:48px!important;font-size:12px!important;line-height:1.3!important;\n  }\n}\n";
const closeStyle=html.lastIndexOf('</style>');
if(closeStyle<0)throw Error('Expected unified style anchor');
html=html.slice(0,closeStyle)+'\n/* '+marker+' */\n'+css+'\n'+html.slice(closeStyle);
fs.writeFileSync(target,html);
console.log('PASS v1.5.2: dual native Active / Sit Out buttons share original P5Availability save/cancel and schedule safeguards');
