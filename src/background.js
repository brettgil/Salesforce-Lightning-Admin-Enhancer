function getSidCookie(url, tabUrl, callback) {
  const primaryUrl = tabUrl || url;
  const fallbackUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  console.log('[SLAE] getSidCookie primary:', primaryUrl);
  chrome.cookies.get({ url: primaryUrl, name: 'sid' }, (cookie) => {
    console.log('[SLAE] primary sid:', cookie ? `domain=${cookie.domain} value="${cookie.value.slice(0,20)}..."` : 'NOT FOUND');
    if (cookie?.value) { callback(cookie); return; }
    console.log('[SLAE] getSidCookie fallback:', fallbackUrl);
    chrome.cookies.get({ url: fallbackUrl, name: 'sid' }, (cookie2) => {
      console.log('[SLAE] fallback sid:', cookie2 ? `domain=${cookie2.domain} value="${cookie2.value.slice(0,20)}..."` : 'NOT FOUND');
      callback(cookie2);
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
      if (!cookie) { console.warn('[SLAE] fetchUsers — no cookie'); sendResponse({ records: [] }); return; }
      console.log('[SLAE] fetchUsers — sid domain:', cookie.domain, '| has value:', !!cookie.value);
      fetch(message.url, {
        headers: { Authorization: `Bearer ${cookie.value}` },
      })
        .then((res) => {
          console.log('[SLAE] fetchUsers — status:', res.status);
          return res.ok ? res.json() : res.text().then(t => { console.warn('[SLAE] fetchUsers — error:', t); return null; });
        })
        .then((data) => { console.log('[SLAE] fetchUsers — records:', data?.records?.length ?? 'null'); sendResponse({ records: data?.records ?? [] }); })
        .catch((e) => { console.error('[SLAE] fetchUsers — fetch threw:', e); sendResponse({ records: [] }); });
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
