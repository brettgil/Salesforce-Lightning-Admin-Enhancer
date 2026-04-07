function getSidCookie(url, tabUrl, callback) {
  // The my.salesforce.com sid is the valid API session — always try it first.
  // The setup and lightning domain sids are UI sessions rejected by the REST API.
  const setupUrl = url.replace('salesforce.com', 'salesforce-setup.com');
  chrome.cookies.get({ url, name: 'sid' }, (c1) => {
    if (c1?.value) { callback(c1); return; }
    chrome.cookies.get({ url: setupUrl, name: 'sid' }, (c2) => {
      if (c2?.value) { callback(c2); return; }
      chrome.cookies.get({ url: tabUrl || url, name: 'sid' }, callback);
    });
  });
}

function fetchWithSid({ apiUrl, tabUrl, fetchUrl, emptyResult, parseData, sendResponse }) {
  getSidCookie(apiUrl, tabUrl, (cookie) => {
    if (!cookie) { sendResponse(emptyResult); return; }
    fetch(fetchUrl || apiUrl, { headers: { Authorization: `Bearer ${cookie.value}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => sendResponse(parseData(data)))
      .catch(() => sendResponse(emptyResult));
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabUrl = sender.tab?.url;

  if (message.action === 'fetchOrgId') {
    fetchWithSid({
      apiUrl: message.url, tabUrl, sendResponse,
      emptyResult: { id: null },
      parseData: (data) => ({ id: data?.records?.[0]?.Id ?? null }),
    });
    return true;
  }

  if (message.action === 'fetchUsers') {
    fetchWithSid({
      apiUrl: message.url, tabUrl, sendResponse,
      emptyResult: { records: [] },
      parseData: (data) => ({ records: data?.records ?? [] }),
    });
    return true;
  }

  if (message.action === 'fetchFavorites') {
    fetchWithSid({
      apiUrl: message.baseUrl, tabUrl, sendResponse,
      fetchUrl: `${message.baseUrl}/services/data/v59.0/ui-api/favorites`,
      emptyResult: { favorites: [] },
      parseData: (data) => ({ favorites: data?.favorites ?? [] }),
    });
    return true;
  }
});
