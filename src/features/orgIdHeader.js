import { onElement } from '../utils/observer.js';
import { onUrlChange } from '../utils/navWatch.js';

const cacheKey = () => `orgIdCache_${window.location.hostname}`;

function isSetupPage() {
  return (
    window.location.hostname.includes('salesforce-setup.com') ||
    window.location.pathname.includes('/lightning/setup/')
  );
}

function isSetupHomePage() {
  return window.location.pathname.startsWith('/lightning/setup/SetupOneHome/');
}

function getApiBaseUrl() {
  const hostname = window.location.hostname.replace('salesforce-setup.com', 'salesforce.com');
  return `https://${hostname}`;
}

async function fetchOrgId() {
  const key = cacheKey();
  const cached = await new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
  if (cached) return cached;

  const url = `${getApiBaseUrl()}/services/data/v59.0/query?q=SELECT+Id+FROM+Organization`;
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'fetchOrgId', url }, (res) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(res);
    });
  });

  const id = response?.id;
  if (!id) return null;

  chrome.storage.local.set({ [key]: id });
  return id;
}

// Extract a Salesforce record ID from setup page URLs.
// Pattern 1: /lightning/setup/{Page}/{RecordId}/view
// Pattern 2: ?address=%2F{RecordId}%3F... (encoded URL in address param)
function getSetupRecordId() {
  const pathMatch = window.location.pathname.match(
    /\/lightning\/setup\/[^/]+\/([A-Za-z0-9]{15,18})(?:\/|$)/
  );
  if (pathMatch) return pathMatch[1];

  const queryMatch = window.location.search.match(
    /[?&]address=%2F([A-Za-z0-9]{15,18})(?:%3F|%26|&|$)/i
  );
  if (queryMatch) return queryMatch[1];

  return null;
}


function resolveDisplay(orgId) {
  if (!isSetupHomePage()) {
    const recordId = getSetupRecordId();
    if (recordId) return { label: 'Record Id: ', title: 'Click to copy Record Id', id: recordId };
  }
  return { label: 'Org Id: ', title: 'Click to copy Org Id', id: orgId };
}

function updateDisplay(wrapper, label, value, orgId) {
  const { label: text, title, id } = resolveDisplay(orgId);
  wrapper.style.display = '';
  label.textContent = text;
  wrapper.title = title;
  wrapper._currentId = id;
  value.textContent = id;
}

export async function init() {
  if (!isSetupPage()) return;

  const orgId = await fetchOrgId();
  if (!orgId) return;

  onElement('.slds-global-header__item_search', (searchItem) => {
    if (searchItem.querySelector('#slae-org-id')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'slae-org-id';
    wrapper.className = 'slae-org-id-wrapper';

    const label = document.createElement('span');
    label.className = 'slae-org-id-label';

    const value = document.createElement('span');
    value.className = 'slae-org-id-value';

    wrapper.append(label, value);

    // Resolve at click time, never from a cached value.
    wrapper.addEventListener('click', () => {
      const { id } = resolveDisplay(orgId);
      if (!id) return;
      navigator.clipboard.writeText(id);
      value.textContent = 'Copied!';
      setTimeout(() => updateDisplay(wrapper, label, value, orgId), 1500);
    });

    searchItem.appendChild(wrapper);
    updateDisplay(wrapper, label, value, orgId);

    const unsubscribe = onUrlChange(() => {
      if (!wrapper.isConnected) { unsubscribe(); return; }
      updateDisplay(wrapper, label, value, orgId);
    });
  });
}
