/* PADEL 5IVE v5.5.16 — iPad hardware Tab / iOS Next.
   Shared initial setup and registration focus navigation. No engine changes. */
(()=>{
  'use strict';
  const selector='input:not([type="hidden"]):not([type="file"]):not([type="radio"]):not([type="checkbox"]),select,textarea';
  const usable=el=>{
    if(!(el instanceof HTMLElement)||el.disabled||el.readOnly||el.tabIndex<0)return false;
    if(el.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
    const st=getComputedStyle(el),r=el.getBoundingClientRect();
    return st.display!=='none'&&st.visibility!=='hidden'&&r.width>3&&r.height>3;
  };
  function group(el){
    if(!(el instanceof HTMLElement)||!el.matches(selector))return null;
    if(el.closest('#americano')){
      const setup=el.closest('.p5-b2-form');
      if(setup)return {root:setup,selector};
      if(el.matches('[data-person],[data-group-for],#p5-51-label-a,#p5-51-label-b'))
        return {root:el.closest('#americano'),selector:'input[data-person],select[data-group-for],input[id^="p5-51-label-"]'};
      return null;
    }
    // Team Showdown: setup card includes the current club's registration inputs.
    const setup=el.closest('.setup-card');
    if(setup)return {root:setup,selector};
    if(el.matches('input[data-field="player"]')){
      const roster=el.closest('.grid2');
      if(roster&&roster.querySelector('.roster-group'))return {root:roster,selector:'input[data-field="player"]'};
    }
    return null;
  }
  function fields(el){const g=group(el);return g?[...g.root.querySelectorAll(g.selector)].filter(usable):[];}
  function advance(el,back){
    const list=fields(el),i=list.indexOf(el);
    if(i<0)return false;
    const next=list[i+(back?-1:1)];
    if(!next)return false;
    try{next.focus({preventScroll:true});}catch{next.focus();}
    if(document.activeElement!==next)return false;
    next.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
    if(next instanceof HTMLInputElement&&/^(text|search|tel|email|url|password)$/i.test(next.type)){
      try{next.setSelectionRange(next.value.length,next.value.length);}catch{}
    }
    return true;
  }
  document.addEventListener('keydown',ev=>{
    if(ev.defaultPrevented||ev.metaKey||ev.ctrlKey||ev.altKey||ev.isComposing)return;
    const el=ev.target;
    if(!group(el))return;
    if(ev.key==='Tab'){
      if(advance(el,ev.shiftKey))ev.preventDefault();
    }else if(ev.key==='Enter'&&!ev.shiftKey&&el instanceof HTMLInputElement&&
      !['date','datetime-local','time','month','week','number','submit','button'].includes(el.type)){
      if(advance(el,false)){ev.preventDefault();}
      else{ev.preventDefault();el.blur();}
    }
  },true);
  function hint(el){
    if(!(el instanceof HTMLInputElement)||!group(el)||!usable(el))return;
    if(['date','datetime-local','time','month','week','number'].includes(el.type))return;
    const list=fields(el),desired=list.indexOf(el)===list.length-1?'done':'next';
    if(el.getAttribute('enterkeyhint')!==desired)el.setAttribute('enterkeyhint',desired);
  }
  document.addEventListener('focusin',e=>hint(e.target),true);
  document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('input').forEach(hint));
})();