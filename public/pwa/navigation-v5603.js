/* PADEL 5IVE PWA Lab 5.6.3 — standalone navigation recovery.
 * Only changes navigation and initial scroll; no tournament state changes.
 */
(() => {
  'use strict';
  if (!window.matchMedia?.('(display-mode: standalone)').matches) return;

  // WebKit occasionally restores the previous screen's y-position on PWA
  // navigation and on return from an installed app's background state.
  try { history.scrollRestoration = 'manual'; } catch (_) {}

  const resetDocumentScroll = () => {
    const doc = document.scrollingElement;
    if (doc) doc.scrollTop = 0;
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    catch (_) { window.scrollTo(0, 0); }
  };

  // On navigation to the game mode or back from the session, show its header
  // instead of a previously-scrolled section.
  addEventListener('pageshow', () => {
    resetDocumentScroll();
    requestAnimationFrame(resetDocumentScroll);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      resetDocumentScroll();
      requestAnimationFrame(resetDocumentScroll);
    }, { once: true });
  } else {
    resetDocumentScroll();
    requestAnimationFrame(resetDocumentScroll);
  }

  // Landing's Initial Setup is a separate, fixed, internally scrollable view.
  // Only reset it when that view OPENS (never while scoring or typing).
  const workspace = document.querySelector('#p54-workspace');
  if (workspace) {
    let wasOpen = document.body.classList.contains('p54-active');
    const resetWorkspace = () => {
      workspace.scrollTop = 0;
      requestAnimationFrame(() => { workspace.scrollTop = 0; });
    };
    const observer = new MutationObserver(() => {
      const open = document.body.classList.contains('p54-active');
      if (open && !wasOpen) resetWorkspace();
      wasOpen = open;
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (wasOpen) resetWorkspace();
  }

  // Use ordinary same-origin navigation to exit a game mode. No synthetic
  // "back" operation (which could return to a scrolled, cached game view).
  document.addEventListener('click', event => {
    const a = event.target.closest?.('a#p54-home-link');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    const destination = new URL(href, location.href);
    if (destination.origin !== location.origin) return;
    event.preventDefault();
    location.assign(destination.href);
  }, true);
})();
