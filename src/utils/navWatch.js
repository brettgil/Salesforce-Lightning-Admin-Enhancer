/**
 * Shared "the page or URL may have changed" signal for features that display
 * URL-derived values (Record Id / Org Id headers).
 *
 * No single signal is reliable in Lightning, so several are combined:
 *   - slae-navigate      pushState/replaceState, dispatched by nav-interceptor.js (MAIN world)
 *   - navigation API     currententrychange (same-document navigations)
 *   - popstate/hashchange
 *   - title changes      Lightning updates document.title on navigation
 *   - visibilitychange   resync the moment a background tab becomes visible
 *   - 1s poll            safety net if every event above is missed; skipped while hidden
 *   - trailing re-check  300ms after each event, in case the URL settles late
 *
 * Callbacks must be idempotent — they are called more often than the URL changes.
 * Enable logging with:  localStorage.setItem('slaeDebug', '1')
 */
const POLL_MS = 1000;
const TRAILING_MS = 300;

const subscribers = new Set();
let started = false;
let lastHref = '';
let lastTitle = '';
let pollTimer = null;
let trailingTimer = null;
let titleObserver = null;

function debug(...args) {
  try {
    if (localStorage.getItem('slaeDebug')) console.log('[SLAE nav]', ...args);
  } catch { /* storage unavailable */ }
}

function notify(source) {
  const href = window.location.href;
  debug(source, href === lastHref ? '(url unchanged)' : `${lastHref} -> ${href}`);
  lastHref = href;
  for (const cb of [...subscribers]) {
    try { cb(source); } catch (e) { console.warn('[SLAE] nav subscriber failed:', e); }
  }
}

function onNavEvent(source) {
  notify(source);
  clearTimeout(trailingTimer);
  trailingTimer = setTimeout(() => notify(`${source}+trailing`), TRAILING_MS);
}

const onSlaeNavigate = () => onNavEvent('slae-navigate');
const onPopState     = () => onNavEvent('popstate');
const onHashChange   = () => onNavEvent('hashchange');
const onNavApi       = () => onNavEvent('navigation-api');
const onVisibility   = () => { if (!document.hidden) notify('visible'); };

function start() {
  started = true;
  lastHref = window.location.href;
  lastTitle = document.title;

  window.addEventListener('slae-navigate', onSlaeNavigate);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('hashchange', onHashChange);
  document.addEventListener('visibilitychange', onVisibility);
  window.navigation?.addEventListener('currententrychange', onNavApi);

  titleObserver = new MutationObserver(() => {
    if (document.title === lastTitle) return;
    lastTitle = document.title;
    onNavEvent('title');
  });
  titleObserver.observe(document.head || document.documentElement, {
    childList: true, subtree: true, characterData: true,
  });

  pollTimer = setInterval(() => {
    if (document.hidden) return;
    if (window.location.href !== lastHref) notify('poll');
  }, POLL_MS);

  debug('started');
}

function stop() {
  started = false;
  window.removeEventListener('slae-navigate', onSlaeNavigate);
  window.removeEventListener('popstate', onPopState);
  window.removeEventListener('hashchange', onHashChange);
  document.removeEventListener('visibilitychange', onVisibility);
  window.navigation?.removeEventListener('currententrychange', onNavApi);
  titleObserver?.disconnect();
  titleObserver = null;
  clearInterval(pollTimer);
  clearTimeout(trailingTimer);
  debug('stopped');
}

/** Subscribe to page/URL change signals. Returns an unsubscribe function. */
export function onUrlChange(callback) {
  subscribers.add(callback);
  if (!started) start();
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && started) stop();
  };
}
