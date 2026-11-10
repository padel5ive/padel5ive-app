/* v5.8.13 · Pairing Style copy + Structured mandatory group labels.
 * Build-layer only. The scheduling/scoring engines remain untouched.
 */
'use strict';
const fs=require('node:fs');
const file='public/modes/unified/index.html';
let html=fs.readFileSync(file,'utf8');
const changes=[["const game=selected?.game||'',style=selected?.id?.startsWith('structured-')?'structured':selected?.kind||'';","const game=selected?.game||'',style=selected?.id?.startsWith('structured-')?'structured':selected?.kind||'';\n   const pairingStyleOptions=[['individual','Normal • Flexible Pairing'],['fixed','Fixed Partners'],['structured','Structured Pairing (Left/Right • ♂/♀)']];\n   const pairingStyleHelp=style==='individual'?'Players rotate partners throughout the session.':style==='fixed'?'Partners remain together throughout the session.':style==='structured'?'Partners are selected from opposite groups.':'';"],["<label>PAIRING STYLE<select id=\"setup-pairing\">${opts((game==='Mexicano'?[['fixed','Fixed Partner'],['individual','Flexible Pairing'],['structured','Structured Pairing']]:game==='Americano'?[['fixed','Fixed Partner'],['individual','Flexible Pairing'],['structured','Structured Pairing']]:[]),style,'Select pairing style')}</select></label>","<label>PAIRING STYLE<select id=\"setup-pairing\">${opts(game?pairingStyleOptions:[],style,'Select pairing style')}</select><small id=\"p5813-style-help\" class=\"p5813-style-help\" aria-live=\"polite\">${esc(pairingStyleHelp)}</small></label>"],["pairing.innerHTML='<option value=\"\">Select pairing style</option>'+[...new Set(styles)].map(k=>`<option value=\"${k}\">${k==='structured'?'Structured Pairing':k==='individual'?'Flexible Pairing':'Fixed Partner'}</option>`).join('');","const pairingLabels={individual:'Normal • Flexible Pairing',fixed:'Fixed Partners',structured:'Structured Pairing (Left/Right • ♂/♀)'};\n   pairing.innerHTML='<option value=\"\">Select pairing style</option>'+['individual','fixed','structured'].filter(k=>styles.includes(k)).map(k=>`<option value=\"${k}\">${pairingLabels[k]}</option>`).join('');"],["if(styles.includes(value))pairing.value=value;","if(styles.includes(value))pairing.value=value;\n   const pairingHelp=document.getElementById('p5813-style-help');\n   if(pairingHelp){\n    pairingHelp.textContent=pairing.value==='individual'?'Players rotate partners throughout the session.':pairing.value==='fixed'?'Partners remain together throughout the session.':pairing.value==='structured'?'Partners are selected from opposite groups.':'';\n    pairingHelp.hidden=!pairing.value;\n   }"],["s.groupConfig={labels:['Group A','Group B']};","// Blank names are intentional for new Structured sessions; require organizer input.\n   s.groupConfig={labels:['','']};"],["<label class=\"p5-52-label\">GROUP NAME<input id=\"p5-51-label-${id.toLowerCase()}\" maxlength=\"28\" value=\"${esc(label)}\" placeholder=\"Group ${id}\" aria-label=\"Group ${id} name\"></label>","<label class=\"p5-52-label\">GROUP NAME <span class=\"p5813-required\">REQUIRED</span><input id=\"p5-51-label-${id.toLowerCase()}\" maxlength=\"28\" required aria-required=\"true\" value=\"${esc(label)}\" placeholder=\"${id==='A'?'e.g. Left / ♂':'e.g. Right / ♀'}\" aria-label=\"Group ${id} name\"></label>"],["<p class=\"p5-52-intro muted\">Set your group names, then enter players directly under each group.</p>","<p class=\"p5-52-intro muted\">Name both groups, then register players under each group.</p>"],["<span>${esc(labels[0])} · ${counts.A} players</span><span>${esc(labels[1])} · ${counts.B} players</span>","<span>${esc(labels[0]||'Group A')} · ${counts.A} players</span><span>${esc(labels[1]||'Group B')} · ${counts.B} players</span>"],["<p class=\"p5-52-rule\">Each team pairs one player from each group. Active group counts must match at Start and Next Round.</p>","<p class=\"p5-52-rule\">Both group names are required and must differ. Partners come from opposite groups; active group counts must stay balanced.</p>"],["catch(e){return alertModal('Advanced Player Rules',e.message);}const individual=ENG[s.mode].kind==='individual'","catch(e){return alertModal(P5Structured.is(s)?'Pairing Groups':'Advanced Player Rules',e.message);}const individual=ENG[s.mode].kind==='individual'"]];
if(html.includes('id="p5813-style-help"')){
 if(!html.includes("placeholder=\"\${id==='A'?'e.g. Left / ♂':'e.g. Right / ♀'}\""))throw Error('Partial v5.8.13 integration');
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
#americano .p5813-required{font-size:9px;font-weight:650;letter-spacing:.1em;color:#cca979;margin-left:5px}
#americano .p5-52-label input[required]:placeholder-shown{border-color:rgba(188,160,117,.48)}
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