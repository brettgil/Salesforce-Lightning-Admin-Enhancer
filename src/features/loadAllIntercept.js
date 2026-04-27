// Runs in MAIN world — boosts Object Manager list pageSize from 50 → 500.
// Tracks the real loaded count so offset stays in sync with actual records rendered.
(function () {
  if (window.__slaeLoadAllInstalled) return;
  window.__slaeLoadAllInstalled = true;

  const PAGE_PATTERN = /\/lightning\/setup\/ObjectManager\/[^/]+\/[^/]+\/view/;
  let enabled = false;
  let loadedCount = 0;
  let lastPathname = '';

  window.addEventListener('slae-load-all-enable', () => { enabled = true; });

  const origXHR = window.XMLHttpRequest;
  const origOpen = origXHR.prototype.open;
  const origSend = origXHR.prototype.send;

  origXHR.prototype.open = function (method, url, ...rest) {
    this._slae = { method, url };
    return origOpen.apply(this, [method, url, ...rest]);
  };

  origXHR.prototype.send = function (body) {
    const u = this._slae?.url ?? '';
    if (
      enabled &&
      PAGE_PATTERN.test(window.location.pathname) &&
      u.includes('/aura') &&
      typeof body === 'string' &&
      body.includes('queryDetails')
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPathname) {
        loadedCount = 0;
        lastPathname = currentPath;
      }

      // If the request starts at offset 0 it's a fresh query (initial load or filter change) —
      // reset loadedCount so subsequent pages stay in sync with what's actually rendered.
      const originalOffset = parseInt((body.match(/%22offset%22%3A(\d+)/i) ?? [])[1] ?? '0', 10);
      if (originalOffset === 0) loadedCount = 0;

      const modified = body
        .replace(/%22pageSize%22%3A\d+/i, '%22pageSize%22%3A500')
        .replace(/%22offset%22%3A\d+/i, `%22offset%22%3A${loadedCount}`);

      const self = this;
      const origOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function (e) {
        if (self.readyState === 4) {
          try {
            const json = JSON.parse(self.responseText);
            const count = json?.actions?.[0]?.returnValue?.records?.length ?? 0;
            loadedCount += count;
          } catch { /* not JSON */ }
        }
        if (origOnReadyStateChange) origOnReadyStateChange.call(self, e);
      };

      return origSend.call(this, modified);
    }
    return origSend.apply(this, arguments);
  };
})();
