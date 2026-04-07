function logAllSalesforceCookies() {
  const domains = ['salesforce.com', 'force.com', 'salesforce-setup.com'];
  domains.forEach(domain => {
    chrome.cookies.getAll({ domain }, (cookies) => {
      const summary = cookies.map(c => `${c.domain} | ${c.name}=${c.value ? c.value.slice(0,20)+'...' : '(blank)'}`);
      console.log(`[SLAE] cookies for *.${domain}:`, summary);
    });
  });
}

function getSidCookie(url, tabUrl, callback) {
  const apiUrl = url;
  const setupUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  const urls = [
    { label: 'api (my.sf.com)',   url: apiUrl },
    { label: 'setup (sf-setup)', url: setupUrl },
    { label: 'tab (lightning)',   url: tabUrl || apiUrl },
  ];
  // Log all three sid values so we can compare them
  urls.forEach(({ label, url: u }) => {
    chrome.cookies.get({ url: u, name: 'sid' }, (c) => {
      console.log(`[SLAE] sid @ ${label}: ${c ? c.value.slice(0, 60) : 'NOT FOUND'}`);
    });
  });
  // Try api domain first, then setup, then tab
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
