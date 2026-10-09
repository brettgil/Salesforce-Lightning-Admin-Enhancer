import { LOGIN_FORM_HOSTS, LOGIN_FORM_DEFAULTS, buildLoginFormRules } from './utils/loginForm.js';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== 'install' && reason !== 'update') return;

  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  chrome.storage.local.get({ lastSeenVersion: null }, ({ lastSeenVersion }) => {
    if (lastSeenVersion === currentVersion) return;

    chrome.action.setBadgeText({ text: 'N' });
    chrome.action.setBadgeBackgroundColor({ color: '#0176d3' });

    chrome.tabs.create({ url: chrome.runtime.getURL('whats-new.html') });
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'clearWhatsNewBadge') {
    const currentVersion = chrome.runtime.getManifest().version;
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.set({ lastSeenVersion: currentVersion });
  }
});

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

// The session id is a live credential — only ever send it to a Salesforce REST endpoint.
function isSalesforceApiUrl(value) {
  try {
    const { protocol, hostname, pathname } = new URL(value);
    return protocol === 'https:'
      && (hostname.endsWith('.salesforce.com') || hostname.endsWith('.force.com'))
      && pathname.startsWith('/services/data/');
  } catch {
    return false;
  }
}

function fetchWithSid({ apiUrl, tabUrl, fetchUrl, emptyResult, parseData, sendResponse }) {
  const targetUrl = fetchUrl || apiUrl;
  if (!isSalesforceApiUrl(targetUrl)) {
    sendResponse(emptyResult);
    return;
  }
  getSidCookie(targetUrl, tabUrl, (cookie) => {
    if (!cookie) { sendResponse(emptyResult); return; }
    fetch(targetUrl, { headers: { Authorization: `Bearer ${cookie.value}` } })
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

// Preferred Login Form — keeps the redirect rules in step with the setting.
async function syncLoginFormRules() {
  const settings = await chrome.storage.sync.get(LOGIN_FORM_DEFAULTS);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: buildLoginFormRules(settings),
  });
}

chrome.runtime.onInstalled.addListener(syncLoginFormRules);
chrome.runtime.onStartup.addListener(syncLoginFormRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && Object.keys(LOGIN_FORM_HOSTS).some((key) => key in changes)) syncLoginFormRules();
});
