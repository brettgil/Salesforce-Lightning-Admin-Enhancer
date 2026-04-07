// Runs at document_start — before any page JS — so we patch pushState/replaceState
// before Salesforce stores its own reference to them.
(function () {
  function dispatch(source) {
    console.log('[SLAE] nav-interceptor dispatch | source:', source, '| url:', window.location.href);
    window.dispatchEvent(new CustomEvent('slae-navigate', { detail: { url: window.location.href } }));
  }

  const origPush = history.pushState.bind(history);
  history.pushState = function (...args) {
    console.log('[SLAE] pushState called | args[2]:', args[2]);
    origPush(...args);
    dispatch('pushState');
  };

  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    console.log('[SLAE] replaceState called | args[2]:', args[2]);
    origReplace(...args);
    dispatch('replaceState');
  };

  window.addEventListener('popstate', () => dispatch('popstate'));
})();
