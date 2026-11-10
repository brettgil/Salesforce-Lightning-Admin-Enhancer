import { LOGIN_FORM_HOSTS, LOGIN_FORM_DEFAULTS, buildLoginFormRules } from './utils/loginForm.js';
import { STRIP_ISDTP_DEFAULTS, buildStripIsdtpRules } from './utils/isdtp.js';

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

// Redirect rules (Preferred Login Form, Strip Chromeless Mode) — kept in step with their settings.
const RULE_SETTING_DEFAULTS = { ...LOGIN_FORM_DEFAULTS, ...STRIP_ISDTP_DEFAULTS };

async function syncRedirectRules() {
  const settings = await chrome.storage.sync.get(RULE_SETTING_DEFAULTS);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const rules = [...buildLoginFormRules(settings), ...buildStripIsdtpRules(settings)];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: await supportedRules(rules),
  });
}

// One rule Chrome can't compile fails the whole update, so drop it on its own.
async function supportedRules(rules) {
  const checks = await Promise.all(rules.map(async (rule) => {
    const regex = rule.condition.regexFilter;
    if (!regex) return true;
    const { isSupported, reason } = await chrome.declarativeNetRequest.isRegexSupported({ regex });
    if (!isSupported) console.warn(`[SLAE] Skipping redirect rule ${rule.id}: ${reason}`);
    return isSupported;
  }));
  return rules.filter((_, i) => checks[i]);
}

chrome.runtime.onInstalled.addListener(syncRedirectRules);
chrome.runtime.onStartup.addListener(syncRedirectRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && Object.keys(RULE_SETTING_DEFAULTS).some((key) => key in changes)) syncRedirectRules();
});
