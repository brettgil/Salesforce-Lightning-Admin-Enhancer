function getSidCookie(url, tabUrl, callback) {
  const setupUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  console.log('[SLAE] getSidCookie — apiUrl:', url);
  console.log('[SLAE] getSidCookie — setupUrl:', setupUrl);
  console.log('[SLAE] getSidCookie — tabUrl:', tabUrl);
  chrome.cookies.get({ url: setupUrl, name: 'sid' }, (cookie) => {
    console.log('[SLAE] setup sid cookie:', cookie ? `value="${cookie.value}" domain=${cookie.domain}` : 'NOT FOUND');
    if (cookie?.value) { callback(cookie); return; }
    const fallbackUrl = tabUrl || url;
    console.log('[SLAE] falling back to:', fallbackUrl);
    chrome.cookies.get({ url: fallbackUrl, name: 'sid' }, (cookie2) => {
      console.log('[SLAE] fallback sid cookie:', cookie2 ? `value="${cookie2.value}" domain=${cookie2.domain}` : 'NOT FOUND');
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
      if (!cookie) {
        console.warn('[SLAE] fetchUsers — no sid cookie found, returning empty');
        sendResponse({ records: [] });
        return;
      }
      console.log('[SLAE] fetchUsers — using sid from domain:', cookie.domain, '| value blank?', !cookie.value);
      fetch(message.url, {
        headers: { Authorization: `Bearer ${cookie.value}` },
      })
        .then((res) => {
          console.log('[SLAE] fetchUsers — API response status:', res.status);
          return res.ok ? res.json() : res.text().then(t => { console.warn('[SLAE] fetchUsers — API error body:', t); return null; });
        })
        .then((data) => sendResponse({ records: data?.records ?? [] }))
        .catch((e) => { console.error('[SLAE] fetchUsers — fetch error:', e); sendResponse({ records: [] }); });
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
