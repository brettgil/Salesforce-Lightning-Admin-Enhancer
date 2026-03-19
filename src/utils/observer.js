/**
 * Watches for elements matching a CSS selector.
 * Calls the callback for any existing matches immediately,
 * then continues watching for dynamically added ones.
 *
 * @param {string} selector - CSS selector to watch for
 * @param {function} callback - Called with each matched element
 * @param {Element} [root=document.body] - Element to observe
 * @returns {MutationObserver}
 */
export function onElement(selector, callback, root = document.body) {
  document.querySelectorAll(selector).forEach(callback);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches(selector)) callback(node);
        node.querySelectorAll(selector).forEach(callback);
      }
    }
  });

  observer.observe(root, { childList: true, subtree: true });
  return observer;
}
