import { onElement } from '../utils/observer.js';

const CACHE_KEY = 'orgIdCache';

function isSetupPage() {
  return (
    window.location.hostname.includes('salesforce-setup.com') ||
    window.location.pathname.includes('/lightning/setup/')
  );
}

function getApiBaseUrl() {
  const hostname = window.location.hostname.replace('salesforce-setup.com', 'salesforce.com');
  return `https://${hostname}`;
}

async function fetchOrgId() {
  const cached = await new Promise((resolve) => {
    chrome.storage.local.get(CACHE_KEY, (result) => resolve(result[CACHE_KEY]));
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

  chrome.storage.local.set({ [CACHE_KEY]: id });
  return id;
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
    wrapper.title = 'Click to copy Id';

    const label = document.createElement('span');
    label.className = 'slae-org-id-label';
    label.textContent = 'Org Id: ';

    const value = document.createElement('span');
    value.className = 'slae-org-id-value';
    value.textContent = orgId;

    wrapper.append(label, value);

    wrapper.addEventListener('click', () => {
      navigator.clipboard.writeText(orgId);
      value.textContent = 'Copied!';
      setTimeout(() => { value.textContent = orgId; }, 1500);
    });

    searchItem.appendChild(wrapper);
  });
}
