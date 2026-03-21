chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'fetchOrgId') {
    const setupUrl = message.url.replace('salesforce.com', 'salesforce-setup.com');

    chrome.cookies.get({ url: setupUrl, name: 'sid' }, (cookie) => {
      if (!cookie) {
        console.warn('[SLAE] No sid cookie found for', setupUrl);
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
});
