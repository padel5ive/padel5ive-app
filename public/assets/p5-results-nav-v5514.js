(function(){
 function activate(){const links=[...document.querySelectorAll('.share-tabs a')];if(!links.length)return;
  const ids=links.map(a=>document.getElementById(a.hash.slice(1)));let current=0;
  ids.forEach((el,i)=>{if(el && el.getBoundingClientRect().top<130)current=i;});
  links.forEach((a,i)=>{a.classList.toggle('is-active',i===current);if(i===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 }
 document.addEventListener('click',e=>{const a=e.target.closest('.share-tabs a');if(a){document.querySelectorAll('.share-tabs a').forEach(x=>x.classList.toggle('is-active',x===a));}});
 window.addEventListener('scroll',activate,{passive:true});
 const observer=new MutationObserver(()=>{if(document.querySelector('.share-tabs a')){activate();observer.disconnect();}});
 observer.observe(document.getElementById('app'),{childList:true,subtree:true});
})();