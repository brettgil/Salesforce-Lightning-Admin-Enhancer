function getSidCookie(url, tabUrl, callback) {
  // Try the tab's current domain first — it always holds the active session.
  // The salesforce-setup.com cookie may be from a previous visit and stale.
  const primaryUrl = tabUrl || url;
  const fallbackUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  chrome.cookies.get({ url: primaryUrl, name: 'sid' }, (cookie) => {
    if (cookie?.value) { callback(cookie); return; }
    chrome.cookies.get({ url: fallbackUrl, name: 'sid' }, callback);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabUrl = sender.tab?.url;

  if (message.action === 'fetchOrgId') {
    getSidCookie(message.url, tabUrl, (cookie) => {
      if (!cookie) {
        console.warn('[SLAE] No sid cookie found for', message.url);
        sendResponse({ id: null });
        return;
      }

      fetch(message.url, {
        headers: { Authorization: `Bearer ${cookie.value}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => sendResponse({ id: data?.records?.[0]?.Id ?? null }))
        .catch(() => sendResponse({ id: null }));
    });
    return true;
  }

  if (message.action === 'fetchUsers') {
    getSidCookie(message.url, tabUrl, (cookie) => {
      if (!cookie) { sendResponse({ records: [] }); return; }
      fetch(message.url, {
        headers: { Authorization: `Bearer ${cookie.value}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => sendResponse({ records: data?.records ?? [] }))
        .catch(() => sendResponse({ records: [] }));
    });
    return true;
  }

  if (message.action === 'fetchFavorites') {
    getSidCookie(message.baseUrl, tabUrl, (cookie) => {
      if (!cookie) { sendResponse({ favorites: [] }); return; }

      fetch(`${message.baseUrl}/services/data/v59.0/ui-api/favorites`, {
        headers: { Authorization: `Bearer ${cookie.value}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => sendResponse({ favorites: data?.favorites ?? [] }))
        .catch(() => sendResponse({ favorites: [] }));
    });
    return true;
  }
});
