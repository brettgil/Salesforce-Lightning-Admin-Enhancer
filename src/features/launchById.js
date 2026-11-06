import { onElement } from '../utils/observer.js';
import { getSearchTools } from '../utils/searchTools.js';

const BARE_ID_PATTERN = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/;
const EXPANDED_WIDTH = 220;
const EDGE_MARGIN = 8;
const PLACEHOLDER = 'Record ID or URL';
const SHORT_PLACEHOLDER = 'ID or URL';

// Width that just fits text in the input, so the unfocused input is no wider than its hint.
function fitWidth(input, text) {
  const style = getComputedStyle(input);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${style.fontSize} ${style.fontFamily}`;
  let width = ctx.measureText(text).width + 4; // slack for font loading / subpixel rounding
  if (style.boxSizing === 'border-box') {
    width += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
  }
  return `${Math.ceil(width)}px`;
}

// Sizes the input to its placeholder, switching to the short one when headerFit.js narrows it
// (level 2), and keeps the placeholder in step with the header's fit level.
function fitToPlaceholder(input) {
  input.style.setProperty('--slae-launch-width', fitWidth(input, PLACEHOLDER));
  input.style.setProperty('--slae-launch-short-width', fitWidth(input, SHORT_PLACEHOLDER));
  const header = input.closest('.slds-global-header');
  if (!header) return;
  const sync = () => {
    input.placeholder = header.classList.contains('slae-fit-2') ? SHORT_PLACEHOLDER : PLACEHOLDER;
  };
  sync();
  new MutationObserver(sync).observe(header, { attributes: true, attributeFilter: ['class'] });
}

// headerFit.js narrows the input when the header is tight. While focused (which covers paste) it
// grows leftwards over the free space; the negative margin keeps its footprint, so the Go button
// and search box don't move.
function expand(input) {
  const rect = input.getBoundingClientRect();
  const grow = Math.max(0, Math.min(EXPANDED_WIDTH - rect.width, rect.left - EDGE_MARGIN));
  if (!grow) return;
  input.style.width = `${parseFloat(getComputedStyle(input).width) + grow}px`;
  input.style.marginLeft = `-${grow}px`;
}

function collapse(input) {
  input.style.width = '';
  input.style.marginLeft = '';
}

function navigate(input, error) {
  const value = input.value.trim();

  // Full URL — strip hostname, navigate the path+query+hash on the current org
  if (value.includes('://')) {
    try {
      const url = new URL(value);
      error.classList.remove('slae-launch-error--visible');
      window.location.assign(url.pathname + url.search + url.hash);
      return;
    } catch {
      error.textContent = 'Invalid URL';
      error.classList.add('slae-launch-error--visible');
      return;
    }
  }

  // Relative path — navigate directly
  if (value.startsWith('/') && !value.startsWith('//')) {
    error.classList.remove('slae-launch-error--visible');
    window.location.assign(value);
    return;
  }

  // Bare ID
  if (BARE_ID_PATTERN.test(value)) {
    error.classList.remove('slae-launch-error--visible');
    window.location.assign('/' + value);
    return;
  }

  error.textContent = 'Invalid ID';
  error.classList.add('slae-launch-error--visible');
}

export function init() {
  onElement('.slds-global-header__item_search', (searchItem) => {
    if (document.getElementById('slae-launch-by-id')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'slae-launch-by-id';
    wrapper.className = 'slae-launch-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = PLACEHOLDER;
    input.title = PLACEHOLDER;
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

    input.addEventListener('focus', () => expand(input));
    input.addEventListener('blur', () => collapse(input));

    input.addEventListener('input', () => {
      error.classList.remove('slae-launch-error--visible');
    });

    button.addEventListener('click', () => navigate(input, error));

    wrapper.append(input, button, error);
    getSearchTools(searchItem).appendChild(wrapper);
    fitToPlaceholder(input);
  });
}
