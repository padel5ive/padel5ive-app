/* PADEL 5IVE v5.8.6 — freeze the original game-mode venue backdrop
 * on a dedicated viewport-composited layer for iPad Safari and other devices.
 * Read original body/background pseudo styles BEFORE hiding them; retain the
 * exact source artwork, gradients and cropping. Scoring and scrolling untouched.
 */
(()=>{'use strict';
  const install=()=>{
    const body=document.body;
    if(!body||body.classList.contains('p586-dashboard-locked'))return;
    if(window.matchMedia?.('print')?.matches)return;
    let pseudo,normal;
    try{
      pseudo=window.getComputedStyle(body,'::before');
      normal=window.getComputedStyle(body);
    }catch(_){return}
    const original=[pseudo,normal].find(style=>
      style&&typeof style.backgroundImage==='string'&&/url\(/i.test(style.backgroundImage)
    );
    if(!original)return; // Never replace wallpaper with a blank fixed layer.
    const backdrop=document.createElement('div');
    backdrop.className='p586-dashboard-backdrop';
    backdrop.setAttribute('aria-hidden','true');
    backdrop.style.backgroundImage=original.backgroundImage;
    backdrop.style.backgroundPosition=original.backgroundPosition||'center top';
    backdrop.style.backgroundSize=original.backgroundSize||'cover';
    backdrop.style.backgroundRepeat=original.backgroundRepeat||'no-repeat';
    backdrop.style.backgroundBlendMode=original.backgroundBlendMode||'normal';
    if(original.backgroundColor && original.backgroundColor!=='rgba(0, 0, 0, 0)' &&
       original.backgroundColor!=='transparent')backdrop.style.backgroundColor=original.backgroundColor;
    body.insertBefore(backdrop,body.firstChild);
    body.classList.add('p586-dashboard-locked');
  };
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else install();
})();
