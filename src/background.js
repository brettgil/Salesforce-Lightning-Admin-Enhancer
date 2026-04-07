function getSidCookie(url, tabUrl, callback) {
  // The my.salesforce.com sid is the valid API session — always try it first.
  // The setup and lightning domain sids are UI sessions rejected by the REST API.
  const apiUrl = url;
  const setupUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  chrome.cookies.get({ url: apiUrl, name: 'sid' }, (c1) => {
    if (c1?.value) { callback(c1); return; }
    chrome.cookies.get({ url: setupUrl, name: 'sid' }, (c2) => {
      if (c2?.value) { callback(c2); return; }
      chrome.cookies.get({ url: tabUrl || apiUrl, name: 'sid' }, callback);
    });
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
