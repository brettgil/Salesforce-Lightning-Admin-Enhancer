// Runs in the page's MAIN world at document_start (see manifest.json).
//
// This MUST run in the MAIN world: content scripts default to an isolated world,
// where patching history.pushState/replaceState has no effect on the calls
// Salesforce's own scripts make — so navigation events were never dispatched.
// Patching before any page JS runs also means Salesforce stores our wrapper.
// The dispatched CustomEvent is a DOM event, so isolated-world content scripts receive it.
(function () {
  if (window.__slaeNavInstalled) return;
  window.__slaeNavInstalled = true;

  function dispatch() {
    window.dispatchEvent(new CustomEvent('slae-navigate', { detail: { url: window.location.href } }));
  }

  const origPush = history.pushState.bind(history);
  history.pushState = function (...args) {
    const result = origPush(...args);
    dispatch();
    return result;
  };

  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    const result = origReplace(...args);
    dispatch();
    return result;
  };

  window.addEventListener('popstate', dispatch);
})();
