// Runs at document_start — before any page JS — so we patch pushState
// before Salesforce stores its own reference to it.
(function () {
  const original = history.pushState.bind(history);
  history.pushState = function (...args) {
    original(...args);
    window.dispatchEvent(new CustomEvent('slae-navigate', { detail: { url: window.location.href } }));
  };
})();
