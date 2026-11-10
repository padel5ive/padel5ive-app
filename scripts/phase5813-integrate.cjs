/* v5.8.13 · Pairing Style copy + Structured mandatory group labels.
 * Build-layer only. The scheduling/scoring engines remain untouched.
 */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const changes=[["const game=selected?.game||'',style=selected?.id?.startsWith('structured-')?'structured':selected?.kind||'';","const game=selected?.game||'',style=selected?.id?.startsWith('structured-')?'structured':selected?.kind||'';\n   const pairingStyleOptions=[['individual','Normal • Flexible Pairing'],['fixed','Fixed Partners'],['structured','Structured Pairing (Left/Right • ♂/♀)']];\n   const pairingStyleHelp=style==='individual'?'Players rotate partners throughout the session.':style==='fixed'?'Partners remain together throughout the session.':style==='structured'?'Partners are selected from opposite groups.':'';"],["<label>PAIRING STYLE<select id=\"setup-pairing\">${opts((game==='Mexicano'?[['fixed','Fixed Partner'],['individual','Flexible Pairing'],['structured','Structured Pairing']]:game==='Americano'?[['fixed','Fixed Partner'],['individual','Flexible Pairing'],['structured','Structured Pairing']]:[]),style,'Select pairing style')}</select></label>","<label>PAIRING STYLE<select id=\"setup-pairing\">${opts(game?pairingStyleOptions:[],style,'Select pairing style')}</select><small id=\"p5813-style-help\" class=\"p5813-style-help\" aria-live=\"polite\">${esc(pairingStyleHelp)}</small></label>"],["pairing.innerHTML='<option value=\"\">Select pairing style</option>'+[...new Set(styles)].map(k=>`<option value=\"${k}\">${k==='structured'?'Structured Pairing':k==='individual'?'Flexible Pairing':'Fixed Partner'}</option>`).join('');","const pairingLabels={individual:'Normal • Flexible Pairing',fixed:'Fixed Partners',structured:'Structured Pairing (Left/Right • ♂/♀)'};\n   pairing.innerHTML='<option value=\"\">Select pairing style</option>'+['individual','fixed','structured'].filter(k=>styles.includes(k)).map(k=>`<option value=\"${k}\">${pairingLabels[k]}</option>`).join('');"],["if(styles.includes(value))pairing.value=value;","if(styles.includes(value))pairing.value=value;\n   const pairingHelp=document.getElementById('p5813-style-help');\n   if(pairingHelp){\n    pairingHelp.textContent=pairing.value==='individual'?'Players rotate partners throughout the session.':pairing.value==='fixed'?'Partners remain together throughout the session.':pairing.value==='structured'?'Partners are selected from opposite groups.':'';\n    pairingHelp.hidden=!pairing.value;\n   }"],["s.groupConfig={labels:['Group A','Group B']};","// Blank names are intentional for new Structured sessions; require organizer input.\n   s.groupConfig={labels:['','']};"],["<label class=\"p5-52-label\">GROUP NAME<input id=\"p5-51-label-${id.toLowerCase()}\" maxlength=\"28\" value=\"${esc(label)}\" placeholder=\"Group ${id}\" aria-label=\"Group ${id} name\"></label>","<label class=\"p5-52-label\">GROUP NAME <span class=\"p5813-required\" aria-label=\"Required\">*</span><span class=\"p5813-input-wrap\" data-p5813-group=\"${id}\"><input id=\"p5-51-label-${id.toLowerCase()}\" maxlength=\"28\" required aria-required=\"true\" value=\"${esc(label)}\" placeholder=\"Enter group name\" aria-describedby=\"p5813-example-${id.toLowerCase()}\" aria-label=\"Group ${id} name\"><span class=\"p5813-visible-example\" id=\"p5813-example-${id.toLowerCase()}\" aria-label=\"Example group name\"><span>e.g. ${id==='A'?'Left':'Right'} /</span><svg class=\"p5813-gender p5813-gender-male\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" focusable=\"false\" aria-hidden=\"true\"><circle cx=\"9\" cy=\"15\" r=\"4.5\"/><path d=\"M12.25 11.75 19 5M14.5 5H19v4.5\"/></svg><svg class=\"p5813-gender p5813-gender-female\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" focusable=\"false\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"8\" r=\"4.5\"/><path d=\"M12 12.5V21M8 17h8\"/></svg></span></span></label>"],["<p class=\"p5-52-intro muted\">Set your group names, then enter players directly under each group.</p>","<p class=\"p5-52-intro muted\">Name both groups, then register players under each group.</p>"],["<span>${esc(labels[0])} · ${counts.A} players</span><span>${esc(labels[1])} · ${counts.B} players</span>","<span>${esc(labels[0]||'Group A')} · ${counts.A} players</span><span>${esc(labels[1]||'Group B')} · ${counts.B} players</span>"],["<p class=\"p5-52-rule\">Each team pairs one player from each group. Active group counts must match at Start and Next Round.</p>","<p class=\"p5-52-rule\">Both group names are required and must differ. Partners come from opposite groups; active group counts must stay balanced.</p>"],["catch(e){return alertModal('Advanced Player Rules',e.message);}const individual=ENG[s.mode].kind==='individual'","catch(e){return alertModal(P5Structured.is(s)?'Pairing Groups':'Advanced Player Rules',e.message);}const individual=ENG[s.mode].kind==='individual'"]];
if(html.includes('id="p5813-style-help"')){
 if(!html.includes('class="p5813-input-wrap"')||!html.includes('class="p5813-visible-example"'))throw Error('Partial v5.8.13 integration');
 console.log('v5.8.13 already integrated');
 process.exit(0);
}
for(const [before,after] of changes){
 const matches=html.split(before).length-1;
 if(matches!==1)throw Error('v5.8.13 source drift: expected exactly one match ('+matches+'): '+before.slice(0,115));
 html=html.replace(before,after);
}
const style=`<style id="p5813-setup-style">
#americano .p5813-style-help{display:block;margin-top:7px;color:#aebbc4;font-size:11px;line-height:1.45;letter-spacing:0;font-weight:400;text-transform:none}
#americano .p5813-style-help[hidden],#americano .p5813-style-help:empty{display:none!important}
#americano .p5813-required{display:inline;color:#cba879;font-size:12px;font-weight:700;margin-left:3px;vertical-align:baseline}
#americano .p5-52-label .p5813-input-wrap{display:block;width:100%;min-width:0}
#americano .p5-52-label .p5813-input-wrap>input{display:block;width:100%;box-sizing:border-box}
#americano .p5-52-label .p5813-input-wrap>input::placeholder{color:#8295a4;opacity:.78}
#americano .p5813-visible-example{display:flex;align-items:center;gap:0;margin:8px 0 0 2px;white-space:nowrap;color:#91a4af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;font-weight:400;line-height:1.35;letter-spacing:normal;text-transform:none}
#americano .p5813-visible-example>span{white-space:nowrap}
#americano .p5813-visible-example .p5813-gender{display:block;flex:0 0 15px;width:15px;height:15px;margin-left:5px;overflow:visible;color:inherit;stroke-width:2}
#americano .p5813-input-wrap[data-p5813-group="A"] .p5813-gender-female,
#americano .p5813-input-wrap[data-p5813-group="B"] .p5813-gender-male{display:none}
#americano .p5813-input-wrap>input:not(:placeholder-shown)+.p5813-visible-example{display:none}
</style>`;
const closing=html.indexOf('</head>');
if(closing<0)throw Error('Missing HTML head closing');
html=html.slice(0,closing)+style+'\n'+html.slice(closing);
fs.writeFileSync(file,html);
// Home Game Mode selection is a separate UI. Keep its visible pairing
// names aligned with Initial Setup; never alter the data-pairing IDs or routes.
const homePath='public/index.html';
let home=fs.readFileSync(homePath,'utf8');
const homeChanges=[
 ["['flexible','Normal / Flexible Pairing',false,'Partners rotate each round']",
  "['flexible','Normal • Flexible Pairing',false,'Partners rotate each round']"],
 ["['fixed','Fixed Partner',false,'Same partner for the session']",
  "['fixed','Fixed Partners',false,'Same partner for the session']"],
 ["['structured','Structured Pairing',false,'One player from Group A + one from Group B']",
  "['structured','Structured Pairing (Left/Right • ♂/♀)',false,'One player from Group A + one from Group B']"],
 ["m+' · Normal / Flexible Pairing'","m+' · Normal • Flexible Pairing'"],
 ["Normal · Flexible · Fixed Partner · Structured","Flexible Pairing · Fixed Partners · Structured"]
];
for(const [before,after] of homeChanges){
 const occurrences=home.split(before).length-1;
 const already=home.includes(after);
 if(occurrences===0&&already)continue;
 if(occurrences!==((before==='Normal · Flexible · Fixed Partner · Structured')?2:1))
  throw Error('v5.8.13 Home pairing source drift ('+occurrences+'): '+before);
 home=home.split(before).join(after);
}
fs.writeFileSync(homePath,home);
console.log('v5.8.13: pairing style copy, live description, blank required Structured group labels.');