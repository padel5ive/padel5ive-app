/* PADEL 5IVE PWA Lab v5.6.6 — in-card Home navigation.
 * Move the existing Home link, preserving href and click handling.
 * Runs only in installed standalone mode, never ordinary Safari.
 */
(() => {
  'use strict';
  if (!window.matchMedia?.('(display-mode: standalone)').matches) return;
  const enhance = () => {
    if (document.body.classList.contains('p5-pwa-compact-nav')) return;
    const nav = document.querySelector('body > nav.p54-app-nav');
    const link = nav?.querySelector('a#p54-home-link');
    const header = document.querySelector('body > main.wrap > header.header') ||
      document.querySelector('body > div.wrap > header.brand-banner.master-brand');
    if (!nav || !link || !header) return;
    if (header.querySelector('.p5-pwa-header-footer')) return;
    const footer = document.createElement('div');
    footer.className = 'p5-pwa-header-footer';
    link.textContent = '← HOME';
    link.setAttribute('aria-label', 'Back to PADEL 5IVE Home');
    footer.append(link);
    header.appendChild(footer);
    document.body.classList.add('p5-pwa-compact-nav');
    nav.setAttribute('aria-hidden', 'true');
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance, { once: true });
  } else enhance();
})();
