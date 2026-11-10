/* PADEL 5IVE v5.8.12 | Smart Player Input for shared Registration.
 * Paste WhatsApp list -> preview -> explicit import. No Reclub/API requests.
 */
(()=>{'use strict';
 const MAX=60, state={text:'',parsed:null,group:'A',flash:'',pairs:[],selected:null,excluded:[]};
 const norm=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
 const empty=s=>!s||/^(?:[.\-–—_*•?]+|tba|tbd|kosong|empty|vacant)$/i.test(s);
 function parse(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const numberedPattern=/^\s*(?:[-•*]\s*)?(\d{1,3})\s*[.)\-:]\s*(.*)$/u;
  // Reclub shares contain several independently numbered groups. Only the
  // explicit Participants section is the default confirmed registration list.
  // Unlabelled (N) groups and On Hold are NOT assumed to be participants.
  const sectionPattern=/^\s*([^()\d]{0,55}?)\s*\(\s*(\d{1,3})\s*\)\s*:?\s*$/u;
  const isParticipants=x=>/^\s*participants\s*$/i.test(x);
  const reclub=lines.some(line=>{
   const m=line.match(sectionPattern);return !!m&&isParticipants(m[1]);
  });
  let candidates=[],excludedOnHold=0,excludedOther=0,declared=0,quickFormat='';
  if(reclub){
   let inParticipants=false;
   for(const line of lines){
    const heading=line.match(sectionPattern);
    if(heading){
     const label=heading[1].trim().toLowerCase(),count=Number(heading[2]);
     inParticipants=isParticipants(label);
     if(inParticipants)declared+=count;
     else if(/^(?:on hold|on-hold|waitlist|waiting list|pending)$/i.test(label))excludedOnHold+=count;
     else excludedOther+=count;
     continue;
    }
    if(inParticipants){
     const numbered=line.match(numberedPattern);
     if(numbered)candidates.push(numbered[2]);
    }
   }
  }else{
   const numbered=lines.map(line=>line.match(numberedPattern)).filter(Boolean);
   if(numbered.length)candidates=numbered.map(m=>m[2]);
   else {
    const nonempty=lines.map(line=>line.trim()).filter(Boolean);
    if(nonempty.length===1){
     const line=nonempty[0];
     // Commas/semicolons explicitly separate full names (including spaces).
     const commaParts=line.split(/[,;，]+/u).map(x=>x.trim()).filter(Boolean);
     if(commaParts.length>1&&commaParts.every(x=>/\p{L}/u.test(x)&&x.length<=70&&!/\d/.test(x))){
      candidates=commaParts;quickFormat='commas';
     }else{
      // A clean single-line string of >=3 name-like tokens is a quick list.
      // No guessing multi-word names: each whitespace token is a player;
      // show the split clearly in Preview and suggest comma/newline for full names.
      const words=line.split(/\s+/u);
      const safeWord=/^[\p{L}][\p{L}\p{M}'’.-]*$/u;
      if(words.length>=3&&words.length<=MAX&&words.every(x=>safeWord.test(x)&&x.length<=40)){
       candidates=words;quickFormat='spaces';
      }else if(/^[\p{L}][\p{L}\p{M} .'’\-]{1,68}$/u.test(line))candidates=[line];
     }
    }else candidates=nonempty.filter(line=>/^[\p{L}][\p{L}\p{M} .'’\-]{1,68}$/u.test(line));
   }
  }
  const names=[],seen=new Set();
  let skipped=0,marked=0,duplicates=0,guests=0;
  for(let name of candidates){
   name=String(name||'').trim();
   if(empty(name)){skipped++;continue;}
   let cleaned=name.replace(/(?:\s*[*✱⭐★☆])+\s*$/u,'').trim().replace(/\s+/g,' ');
   if(name!==cleaned)marked++;
   // Reclub's "Ian +1 (Ian's +1)" is a guest SLOT, not a real guest name.
   // Keep it separate from Ian and visibly flag it for organizer review.
   const guest=cleaned.match(/^(.+?)\s+\+([1-9]\d*)\s+\(([^()]*)\)$/u);
   if(guest&&/\+\d+\s*$/u.test(guest[3]))cleaned=guest[1].trim()+' +'+guest[2];
   if(empty(cleaned)||!/\p{L}/u.test(cleaned)){skipped++;continue;}
   if(cleaned.length>70)continue;
   const k=norm(cleaned);
   if(seen.has(k)){duplicates++;continue;}
   seen.add(k);
   if(/\s\+[1-9]\d*\s*$/u.test(cleaned))guests++;
   names.push(cleaned);
  }
  return {
   names,skipped,marked,duplicates,guests,
   slots:candidates.length,numbered:reclub||candidates.length>0,
   overflow:names.length>MAX,source:reclub?'reclub':quickFormat?'quick-list':'whatsapp',
   quickFormat,declared,excludedOnHold,excludedOther
  };
 }
 const node=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
 function context(){
  const card=document.querySelector('#americano .p5-b32-registration');
  if(!card)return null;
  const mode=card.classList.contains('p5-52-registration')?'structured':
   card.querySelector('h1')?.textContent.includes('Fixed Partner')?'fixed':'individual';
  const existing=new Set();
  card.querySelectorAll('input[data-person]').forEach(x=>{if(x.value.trim())existing.add(norm(x.value));});
  return {card,mode,existing};
 }
 function pending(){
  const c=context(),p=state.parsed;
  if(!c||!p||p.raw!==state.text||p.overflow||(p.source==='reclub'&&p.declared!==p.slots))return null;
  const fresh=p.names.filter(n=>!c.existing.has(norm(n)));
  if(!fresh.length)return null;
  if(c.mode==='fixed'){
   const active=fresh.filter(n=>!state.excluded.some(x=>norm(x)===norm(n)));
   const flattened=state.pairs.flat(),keys=flattened.map(norm),expected=new Set(active.map(norm));
   if(!state.pairs.length||state.selected||flattened.length!==active.length||
      new Set(keys).size!==keys.length||keys.some(k=>!expected.has(k)))return null;
   return {mode:'fixed',names:flattened,pairs:state.pairs.map(pair=>pair.slice())};
  }
  return {mode:c.mode,names:fresh,group:state.group};
 }
 function imported(count){
  state.text='';state.parsed=null;state.pairs=[];state.selected=null;state.excluded=[];
  state.flash=count+' player'+(count===1?'':'s')+' added. Review Registration before Start.';
 }
 function resetPairing(){state.pairs=[];state.selected=null;state.excluded=[];}
 function fixedPairing(root,fresh){
  const board=node('section','p5812-pair-board');
  board.setAttribute('aria-label','Fixed Partner Pairing Review');
  const valid=new Set(fresh.map(norm)),used=new Set();
  state.pairs=state.pairs.filter(pair=>pair.length===2&&pair.every(n=>valid.has(norm(n)))&&pair.every(n=>!state.excluded.some(x=>norm(x)===norm(n)))&&pair.every(n=>!used.has(norm(n))&&used.add(norm(n))));
  const assigned=new Set(state.pairs.flat().map(norm));
  if(state.selected&&(!valid.has(norm(state.selected))||assigned.has(norm(state.selected))))state.selected=null;
  state.excluded=state.excluded.filter(n=>valid.has(norm(n))&&!assigned.has(norm(n)));
  const available=fresh.filter(n=>!assigned.has(norm(n))&&!state.excluded.some(x=>norm(x)===norm(n)));
  const count=node('div','p5812-pair-header');
  count.append(node('strong','','PAIRING REVIEW'),node('span','',state.pairs.length+' pairs · '+available.length+' unpaired'));
  board.append(count);
  board.append(node('p','p5812-pair-help','Tap two names to create a pair. Select Change to edit any pair.'));
  const ready=node('div','p5812-pair-ready');
  if(!state.pairs.length)ready.append(node('p','p5812-pair-empty','No pairs assigned yet. Choose two players below.'));
  state.pairs.forEach((pair,i)=>{
   const row=node('div','p5812-pair-row');
   row.append(node('span','p5812-pair-number','PAIR '+String(i+1).padStart(2,'0')));
   const content=node('div','p5812-pair-names');
   content.append(node('strong','',pair[0]),node('span','p5812-pair-plus','+'),node('strong','',pair[1]));
   row.append(content);
   const edit=node('button','p5812-pair-edit','CHANGE');edit.type='button';edit.setAttribute('aria-label','Change pair '+(i+1)+': '+pair.join(' and '));
   edit.addEventListener('click',()=>{state.pairs.splice(i,1);state.selected=pair[0];preview(root);});
   row.append(edit);ready.append(row);
  });
  board.append(ready);
  const header=node('div','p5812-pool-heading');
  header.append(node('strong','','UNPAIRED PLAYERS'),node('span','',state.selected?'Choose partner for '+state.selected:available.length+' available'));
  board.append(header);
  const pool=node('div','p5812-player-pool');
  for(const name of available){
   const chip=node('button','p5812-player-chip'+(state.selected&&norm(state.selected)===norm(name)?' is-selected':''),name);
   chip.type='button';chip.setAttribute('aria-pressed',String(!!state.selected&&norm(state.selected)===norm(name)));
   chip.addEventListener('click',()=>{
    if(!state.selected)state.selected=name;
    else if(norm(state.selected)===norm(name))state.selected=null;
    else{state.pairs.push([state.selected,name]);state.selected=null;}
    preview(root);
   });
   const item=node('div','p5812-player-item');item.append(chip);
   const omit=node('button','p5812-player-skip','SKIP');omit.type='button';omit.setAttribute('aria-label','Exclude '+name+' from import');
   omit.addEventListener('click',()=>{state.excluded.push(name);if(state.selected&&norm(state.selected)===norm(name))state.selected=null;preview(root);});
   item.append(omit);pool.append(item);
  }
  if(!available.length)pool.append(node('p','p5812-muted','All available players have been assigned or skipped.'));
  board.append(pool);
  if(state.excluded.length){
   const skipped=node('div','p5812-skipped');
   skipped.append(node('span','','SKIPPED · '+state.excluded.length));
   state.excluded.forEach(name=>{
    const restore=node('button','p5812-restore','RESTORE '+name);restore.type='button';restore.setAttribute('aria-label','Restore '+name+' to pairing');
    restore.addEventListener('click',()=>{state.excluded=state.excluded.filter(n=>norm(n)!==norm(name));preview(root);});
    skipped.append(restore);
   });
   board.append(skipped);
  }
  if(available.length||state.selected)board.append(node('p','p5812-pair-notice','Assign every included player to a pair, or Skip players who are not playing.'));
  return board;
 }
 function preview(root){
  const c=context(),p=state.parsed,out=root.querySelector('.p5812-preview'),button=root.querySelector('[data-act="smart-player-import"]');
  out.replaceChildren();out.hidden=!p;button.hidden=!p;button.disabled=true;button.textContent='ADD TO REGISTRATION';
  if(!p||!c)return;
  const fresh=p.names.filter(x=>!c.existing.has(norm(x)));
  out.append(node('p','p5812-count',(p.source==='reclub'?'Reclub Participants':p.source==='quick-list'?'Quick name list':'WhatsApp list')+' · '+p.names.length+' detected · '+fresh.length+' new'+(p.skipped?' · '+p.skipped+' empty slots skipped':'')));
  if(p.quickFormat==='spaces')out.append(node('p','p5812-warning','Space-separated list: each word is treated as one player. For full names, separate players with commas or put one name per line. Review the preview.'));
  if(p.quickFormat==='commas')out.append(node('p','p5812-muted','Names separated by commas; spaces within full names are preserved.'));
  if(p.source==='reclub'){
   out.append(node('p','p5812-muted',p.excludedOnHold+' On Hold excluded · '+p.excludedOther+' other-list entries excluded'));
   if(p.declared!==p.slots)out.append(node('p','p5812-error','Reclub Participants count differs from numbered entries. Review before importing.'));
  }
  if(p.guests)out.append(node('p','p5812-warning',p.guests+' guest placeholder'+(p.guests===1?'':'s')+' (e.g. Ian +1). Replace with actual name when available.'));
  if(p.marked)out.append(node('p','p5812-muted',p.marked+' trailing * markers removed; no meaning assumed.'));
  if(p.duplicates||fresh.length!==p.names.length)out.append(node('p','p5812-muted',(p.duplicates+p.names.length-fresh.length)+' duplicate name(s) skipped.'));
  if(!p.numbered)out.append(node('p','p5812-muted','No numbered slots detected. Check the names carefully.'));
  if(c.mode==='fixed')out.append(fixedPairing(root,fresh));
  else{
   const list=node('ol','p5812-names');
   fresh.forEach(x=>list.append(node('li','',x)));out.append(list);
  }
  if(p.overflow)out.append(node('p','p5812-error','Too many names. Use up to '+MAX+' names per import.'));
  if(c.mode==='structured'){
   const label=node('label','p5812-group','IMPORT TO GROUP');
   const select=node('select');select.setAttribute('aria-label','Import to group');
   ['A','B'].forEach(g=>{const opt=node('option','', 'Group '+g);opt.value=g;select.append(opt);});
   select.value=state.group;select.addEventListener('change',()=>{state.group=select.value;});
   label.append(select);out.append(label);
   out.append(node('p','p5812-muted','Select a group. Balance Group A/B before starting.'));
  }
  const ready=pending();
  if(ready){button.disabled=false;button.textContent=c.mode==='fixed'?'ADD '+ready.pairs.length+' PAIR'+(ready.pairs.length===1?'':'S')+' TO REGISTRATION':'ADD '+ready.names.length+' PLAYER'+(ready.names.length===1?'':'S');}
 }
 function mount(){
  const c=context();if(!c||c.card.querySelector('#p5812-smart'))return;
  const anchor=c.card.querySelector('.p5-v2-reg.p5-b32-reg-list, .p5-52-columns');
  if(!anchor)return;
  const root=node('details','p5812-smart');root.id='p5812-smart';
  const title=node('summary','p5812-title');title.append(node('strong','','SMART PLAYER INPUT'));root.append(title);
  const box=node('div','p5812-body');box.append(node('p','p5812-help','Supports WhatsApp List, Reclub Participants List & Simple Name List. For full names, use commas or new lines.'));
  const field=node('textarea','p5812-textarea');field.rows=4;field.maxLength=16000;field.setAttribute('aria-label','Paste player list');field.placeholder='Paste player list here…';field.value=state.text;
  field.addEventListener('input',()=>{state.text=field.value;state.parsed=null;resetPairing();state.flash='';clear.hidden=!state.text;review.disabled=!state.text.trim();preview(root);});box.append(field);
  const actions=node('div','p5812-buttons');
  const review=node('button','p5812-review','PREVIEW PLAYERS');review.type='button';review.disabled=!state.text.trim();review.addEventListener('click',()=>{state.text=field.value;if(!state.text.trim())return;resetPairing();state.parsed={...parse(state.text),raw:state.text};state.flash='';preview(root);});
  const clear=node('button','p5812-clear','CLEAR');clear.type='button';clear.hidden=!state.text;clear.addEventListener('click',()=>{state.text='';state.parsed=null;resetPairing();state.flash='';field.value='';clear.hidden=true;review.disabled=true;preview(root);field.focus();});
  actions.append(review,clear);box.append(actions);
  const out=node('div','p5812-preview');out.hidden=true;box.append(out);
  const add=node('button','p5812-add','ADD TO REGISTRATION');add.type='button';add.dataset.act='smart-player-import';add.disabled=true;add.hidden=true;box.append(add);
  if(state.flash)box.append(node('p','p5812-success',state.flash));
  root.append(box);c.card.insertBefore(root,anchor);
  // Collapsed by default, and after a successful import. Reopen only to keep a drafted paste.\n  if(state.text)root.open=true;
  preview(root);
 }
 function init(){
  const app=document.getElementById('americano');if(!app)return;
  new MutationObserver(mount).observe(app,{childList:true});mount();
 }
 window.P5SmartInput=Object.freeze({parse,pending,imported});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
