import { onElement } from '../utils/observer.js';

const SFID_PATTERN = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;

function isValidSalesforceId(value) {
  return SFID_PATTERN.test(value.trim());
}

function navigate(input, error) {
  const id = input.value.trim();

  if (!isValidSalesforceId(id)) {
    error.textContent = 'Invalid ID';
    error.classList.add('slae-launch-error--visible');
    return;
  }

  error.classList.remove('slae-launch-error--visible');
  window.location.assign('/' + id);
}

export function init() {
  onElement('.slds-global-header__item_search', (searchItem) => {
    if (searchItem.querySelector('#slae-launch-by-id')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'slae-launch-by-id';
    wrapper.className = 'slae-launch-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Record ID';
    input.className = 'slae-launch-input';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Go';
    button.className = 'slae-launch-button';

    const error = document.createElement('span');
    error.className = 'slae-launch-error';

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') navigate(input, error);
    });

    input.addEventListener('input', () => {
      error.classList.remove('slae-launch-error--visible');
    });

    button.addEventListener('click', () => navigate(input, error));

    wrapper.append(input, button, error);
    searchItem.style.position = 'relative';
    searchItem.prepend(wrapper);
  });
}
