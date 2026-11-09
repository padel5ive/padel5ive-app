/* PADEL 5IVE · Phase 5.7.1 — Public champion presentation adapter.
 * Read-only. Runs after the original public renderer has loaded real results.
 * User-generated names are only assigned through textContent.
 */
(()=>{'use strict';
const app=document.getElementById('app');if(!app)return;
const el=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
function enhance(){
 const card=app.querySelector('#champion.champion');
 if(!card||card.classList.contains('p57-award'))return;
 const title=card.querySelector('h2')?.textContent?.trim()||'';
 if(!title||title==='Competition in progress')return;
 const overline=card.querySelector('.eyebrow')?.textContent?.trim()||'OFFICIAL CHAMPIONS';
 const subtitle=card.querySelector('.champion-sub')?.textContent?.trim()||'Official Final Result';
 let runner=card.querySelector('.pair-sub span')?.textContent?.replace(/^RUNNER-UP\s*·\s*/i,'').trim()||'';
 const isFinalRanking=/FINAL RANKING/i.test(overline);
 // If an older read-only report snapshot lacks a runner-up payload,
 // the second standings row is authoritative for a non-KO session.
 if(!runner&&isFinalRanking){
  const second=app.querySelectorAll('#leaderboard tbody tr')[1]?.querySelector('.pick')?.textContent||'';
  runner=second.replace(/^\s*\d+\s*·\s*/,'').replace(/\s*↗\s*$/,'').trim();
 }
 const content=el('div','p57-award-content');
 content.append(
  el('div','p57-award-head','PADEL 5IVE  /  OFFICIAL FINAL RESULT'),
  el('div','p57-award-kicker',isFinalRanking?'SESSION WINNER':'TOURNAMENT CHAMPIONS'),
  el('h2','p57-award-name',title),
  el('p','p57-award-description',subtitle)
 );
 if(runner){
  const secondary=el('div','p57-runner');
  secondary.append(el('span','p57-runner-label','RUNNER-UP'),el('strong','p57-runner-name',runner));
  content.append(secondary);
 }
 const trophy=el('div','p57-trophy-panel');
 trophy.setAttribute('aria-hidden','true');
 trophy.innerHTML='<svg viewBox="0 0 120 144" role="img" aria-label="Championship trophy"><path d="M37 18H83V37C83 66 72 82 60 87C48 82 37 66 37 37Z"/><path d="M37 28H22V41C22 59 32 70 44 71M83 28H98V41C98 59 88 70 76 71"/><path d="M60 87V110M45 111H75M41 120H79V130H41Z"/><path d="M47 26H73M48 36H72" opacity=".45"/><path d="M60 50L64 56L71 57L66 62L67 70L60 66L53 70L54 62L49 57L56 56Z" fill="#d3ae7c" stroke="none"/></svg>';
 card.classList.add('p57-award');
 card.replaceChildren(content,trophy);
}
enhance();
new MutationObserver(enhance).observe(app,{childList:true});
})();
