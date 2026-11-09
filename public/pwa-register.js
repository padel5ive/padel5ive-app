/* PADEL 5IVE PWA Lab 5.6.0 — progressive enhancement, engine untouched. */
(() => {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (!(location.protocol === 'https:' || location.hostname === 'localhost')) return;
  function offlineIndicator() {
    const el = document.createElement('div');
    el.id = 'p5-pwa-offline-notice';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = 'OFFLINE · Scores stay on this device. Share Results requires internet.';
    el.style.cssText = [
      'position:fixed','bottom:calc(14px + env(safe-area-inset-bottom,0px))',
      'left:50%','transform:translateX(-50%)','max-width:calc(100vw - 28px)',
      'padding:9px 14px','font:600 11px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif',
      'color:#f5dfba','background:rgba(8,23,36,.98)',
      'border:1px solid rgba(215,177,116,.55)','border-radius:8px',
      'box-shadow:0 8px 22px rgba(0,0,0,.28)',
      'pointer-events:none','z-index:2147483600','text-align:center',
      'letter-spacing:.02em'
    ].join(';');
    document.body.appendChild(el);
    const refresh = () => { el.hidden = navigator.onLine; };
    addEventListener('online', refresh);
    addEventListener('offline', refresh);
    refresh();
  }
  function begin() {
    offlineIndicator();
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(reg => {
        window.PADEL5IVE_PWA = Object.freeze({ version: '5.6.0-lab', update: () => reg.update() });
        if (navigator.onLine) reg.update().catch(() => {});
      })
      .catch(err => console.warn('PADEL 5IVE PWA registration unavailable:', err));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, { once: true });
  else begin();
})();
/* Installable-app only: recover navigation and reset restored setup scroll. */
(() => {
  if (!window.matchMedia || !window.matchMedia('(display-mode: standalone)').matches) return;
  const nav = document.createElement('script');
  nav.src = '/pwa/navigation-v5603.js';
  document.head.appendChild(nav);
})();
