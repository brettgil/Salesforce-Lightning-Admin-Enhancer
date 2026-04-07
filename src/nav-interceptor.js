// Runs at document_start — before any page JS — so we patch pushState/replaceState
// before Salesforce stores its own reference to them.
(function () {
  function dispatch() {
    window.dispatchEvent(new CustomEvent('slae-navigate', { detail: { url: window.location.href } }));
  }

  const origPush = history.pushState.bind(history);
  history.pushState = function (...args) {
    origPush(...args);
    dispatch();
  };

  const origReplace = history.replaceState.bind(history);
  history.replaceState = function (...args) {
    origReplace(...args);
    dispatch();
  };

  window.addEventListener('popstate', dispatch);
})();
