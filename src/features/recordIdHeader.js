import { onElement } from '../utils/observer.js';
import { onUrlChange } from '../utils/navWatch.js';
import { getRecordIdFromPath } from '../utils/recordId.js';

const ELEMENT_ID = 'slae-record-id';

const currentId = () => getRecordIdFromPath(window.location.pathname);

function updateDisplay(wrapper, value) {
  const id = currentId();
  if (!id) {
    wrapper.style.display = 'none';
    return;
  }
  wrapper.style.display = '';
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

    // Read the ID at click time, never from a cached value.
    wrapper.addEventListener('click', () => {
      const id = currentId();
      if (!id) return;
      navigator.clipboard.writeText(id);
      value.textContent = 'Copied!';
      setTimeout(() => updateDisplay(wrapper, value), 1500);
    });

    searchItem.appendChild(wrapper);
    updateDisplay(wrapper, value);

    const unsubscribe = onUrlChange(() => {
      // Lightning may re-render the header; drop watchers for removed copies.
      if (!wrapper.isConnected) { unsubscribe(); return; }
      updateDisplay(wrapper, value);
    });
  });
}
