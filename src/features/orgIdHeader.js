import { onElement } from '../utils/observer.js';

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

function updateDisplay(wrapper, label, value, orgId) {
  if (isSetupHomePage()) {
    wrapper.style.display = '';
    label.textContent = 'Org Id: ';
    wrapper.title = 'Click to copy Org Id';
    wrapper._currentId = orgId;
    value.textContent = orgId;
    return;
  }

  const recordId = getSetupRecordId();
  if (recordId) {
    wrapper.style.display = '';
    label.textContent = 'Record Id: ';
    wrapper.title = 'Click to copy Record Id';
    wrapper._currentId = recordId;
    value.textContent = recordId;
  } else {
    wrapper.style.display = '';
    label.textContent = 'Org Id: ';
    wrapper.title = 'Click to copy Org Id';
    wrapper._currentId = orgId;
    value.textContent = orgId;
  }
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

    wrapper.addEventListener('click', () => {
      const id = wrapper._currentId;
      if (!id) return;
      navigator.clipboard.writeText(id);
      const prev = value.textContent;
      value.textContent = 'Copied!';
      setTimeout(() => { value.textContent = prev; }, 1500);
    });

    searchItem.appendChild(wrapper);
    updateDisplay(wrapper, label, value, orgId);

    window.addEventListener('slae-navigate', () => updateDisplay(wrapper, label, value, orgId));

    // Fallback: setup sidebar nav (Home, Object Manager, etc.) bypasses pushState,
    // but Salesforce always updates the page title on navigation.
    const titleEl = document.querySelector('title');
    if (titleEl) {
      new MutationObserver(() => updateDisplay(wrapper, label, value, orgId))
        .observe(titleEl, { childList: true });
    }
  });
}
