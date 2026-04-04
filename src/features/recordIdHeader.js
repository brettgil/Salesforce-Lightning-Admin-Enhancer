import { onElement } from '../utils/observer.js';

const ELEMENT_ID = 'slae-record-id';

function getRecordIdFromUrl() {
  const match = window.location.pathname.match(/\/lightning\/r\/[^/]+\/([^/]+)\//);
  return match ? match[1] : null;
}

function updateDisplay(wrapper) {
  const id = getRecordIdFromUrl();
  const value = wrapper.querySelector('.slae-org-id-value');

  if (!id) {
    wrapper.style.display = 'none';
    return;
  }

  wrapper.style.display = '';
  wrapper._currentId = id;
  value.textContent = id;
}

export function init() {
  if (window.location.hostname.includes('salesforce-setup.com')) return;

  onElement('.slds-global-header__item_search', (searchItem) => {
    if (searchItem.querySelector(`#${ELEMENT_ID}`)) return;

    const wrapper = document.createElement('div');
    wrapper.id = ELEMENT_ID;
    wrapper.className = 'slae-org-id-wrapper';
    wrapper.title = 'Click to copy Record Id';

    const label = document.createElement('span');
    label.className = 'slae-org-id-label';
    label.textContent = 'Record Id:';

    const value = document.createElement('span');
    value.className = 'slae-org-id-value';

    wrapper.append(label, value);

    wrapper.addEventListener('click', () => {
      const id = wrapper._currentId;
      if (!id) return;
      navigator.clipboard.writeText(id);
      value.textContent = 'Copied!';
      setTimeout(() => { value.textContent = id; }, 1500);
    });

    searchItem.appendChild(wrapper);
    updateDisplay(wrapper);

    // Update when navigating between records via SPA
    window.addEventListener('slae-navigate', () => updateDisplay(wrapper));
  });
}
