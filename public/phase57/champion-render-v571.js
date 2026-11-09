/* PADEL 5IVE 5.7.2 · Shared Team Showdown-inspired public champion presentation.
 * Public-results-only visual adapter. Actual standings, knockout outcomes,
 * names and scores continue to come from the existing canonical renderer.
 */
(()=>{'use strict';
const app=document.getElementById('app');if(!app)return;
const element=(tag,className,value)=>{
 const n=document.createElement(tag);n.className=className;
 if(value!==undefined)n.textContent=String(value);
 return n;
};
function enhance(){
 const card=app.querySelector('#champion.champion');
 if(!card||card.classList.contains('p57-award'))return;
 const name=card.querySelector('h2')?.textContent?.trim()||'';
 if(!name||name==='Competition in progress')return;
 const sourceLabel=card.querySelector('.eyebrow')?.textContent?.trim()||'';
 const sourceCaption=card.querySelector('.champion-sub')?.textContent?.trim()||'';
 const isRanking=/FINAL RANKING/i.test(sourceLabel);
 const winnerLabel=isRanking?'SESSION CHAMPIONS':'TOURNAMENT CHAMPIONS';
 let runner=card.querySelector('.pair-sub span')?.textContent?.replace(/^RUNNER-UP\s*·\s*/i,'').trim()||'';
 if(!runner&&isRanking){
   const row=app.querySelectorAll('#leaderboard tbody tr')[1];
   runner=(row?.querySelector('.pick')?.textContent||'')
     .replace(/^\s*\d+\s*·\s*/,'').replace(/\s*↗\s*$/,'').trim();
 }
 const content=element('div','p57-award-content');
 const eyebrow=element('p','p57-award-eyebrow','PADEL 5IVE · OFFICIAL RESULTS');
 const trophy=element('div','p57-award-trophy');
 trophy.setAttribute('aria-hidden','true');
 // Same centered cup silhouette used in the Team Showdown public award.
 trophy.innerHTML='<svg viewBox="0 0 170 112" focusable="false" aria-hidden="true"><defs><linearGradient id="p57CupMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe7b7"/><stop offset=".32" stop-color="#d7a86a"/><stop offset=".68" stop-color="#f2d7a4"/><stop offset="1" stop-color="#a66d39"/></linearGradient></defs><g fill="none" stroke="url(#p57CupMetal)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".83"><path d="M43 22C31 24 23 33 23 47s8 26 20 32M127 22c12 2 20 11 20 25s-8 26-20 32"/><path d="M35 29l-8 2 5 8M27 42l-7 5 8 5M27 55l-7 8 10 3M33 68l-2 10 11 0M135 29l8 2-5 8M143 42l7 5-8 5M143 55l7 8-10 3M137 68l2 10-11 0"/></g><path d="M57 19h56c0 34-11 49-25 53v15h14v7H68v-7h14V72C68 68 57 53 57 19Z" fill="url(#p57CupMetal)"/><path d="M57 26H45c-3 0-5 3-5 6 0 17 8 25 24 26M113 26h12c3 0 5 3 5 6 0 17-8 25-24 26" fill="none" stroke="url(#p57CupMetal)" stroke-width="6" stroke-linejoin="round"/><path d="M71 24c0 15 2 25 8 34" fill="none" stroke="#fff0cc" stroke-width="3" opacity=".38" stroke-linecap="round"/><path d="M65 94h40v8H65Z" fill="url(#p57CupMetal)"/><path d="M61 102h48v5H61Z" fill="#b78653"/></svg>';
 const label=element('div','p57-award-kicker',winnerLabel);
 const winner=element('h2','p57-award-name',name);
 content.append(eyebrow,trophy,label,winner);
 if(sourceCaption){
   content.append(element('p','p57-award-description',sourceCaption));
 }
 if(runner){
   const runnerBlock=element('div','p57-runner');
   runnerBlock.append(element('span','p57-runner-label','RUNNER-UP'),element('strong','p57-runner-name',runner));
   content.append(runnerBlock);
 }
 card.classList.add('p57-award');
 card.replaceChildren(content);
}
enhance();
new MutationObserver(enhance).observe(app,{childList:true});
})();
