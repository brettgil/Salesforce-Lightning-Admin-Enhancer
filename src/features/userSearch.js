import { onElement } from '../utils/observer.js';

const ELEMENT_ID = 'slae-user-search';
let debounceTimer = null;

function getApiBase() {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.lightning.force.com')) {
    return `https://${hostname.replace('.lightning.force.com', '.my.salesforce.com')}`;
  }
  return `https://${hostname.replace('salesforce-setup.com', 'salesforce.com')}`;
}

function escapeSoql(str) {
  return str.replace(/'/g, "\\'");
}

function searchUsers(query) {
  return new Promise((resolve) => {
    const q = escapeSoql(query);
    const soql = `SELECT Id, Name, Username, Email, IsActive FROM User WHERE Name LIKE '%${q}%' OR Username LIKE '%${q}%' OR Email LIKE '%${q}%' ORDER BY IsActive DESC, Name ASC LIMIT 10`;
    const url = `${getApiBase()}/services/data/v59.0/query/?q=${encodeURIComponent(soql)}`;
    chrome.runtime.sendMessage({ action: 'fetchUsers', url }, (res) => {
      if (chrome.runtime.lastError) resolve([]);
      else resolve(res?.records ?? []);
    });
  });
}

function buildWidget() {
  const wrapper = document.createElement('div');
  wrapper.id = ELEMENT_ID;
  wrapper.className = 'slae-user-search';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'slae-user-search-btn';
  btn.title = 'Search Username or Email';
  btn.setAttribute('aria-label', 'Search Users by Name, Username or Email');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  const panel = document.createElement('div');
  panel.className = 'slae-user-search-panel';
  panel.hidden = true;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'slae-user-search-input';
  input.placeholder = 'Search by email or username...';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const results = document.createElement('div');
  results.className = 'slae-user-search-results';

  panel.append(input, results);
  wrapper.append(btn, panel);

  function open() {
    panel.hidden = false;
    input.focus();
  }

  function close() {
    panel.hidden = true;
    input.value = '';
    results.innerHTML = '';
  }

  function setStatus(msg) {
    results.innerHTML = `<div class="slae-user-search-status">${msg}</div>`;
  }

  function renderResults(users) {
    results.innerHTML = '';
    if (users.length === 0) {
      setStatus('No users found.');
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('a');
      row.className = 'slae-user-result';
      row.href = `/lightning/r/User/${user.Id}/view`;

      const info = document.createElement('div');
      info.className = 'slae-user-result-info';

      const name = document.createElement('div');
      name.className = 'slae-user-result-name';
      name.textContent = user.Name;

      const meta = document.createElement('div');
      meta.className = 'slae-user-result-meta';
      meta.textContent = user.Username;

      info.append(name, meta);

      const badge = document.createElement('span');
      badge.className = `slae-user-result-badge slae-user-result-badge--${user.IsActive ? 'active' : 'inactive'}`;
      badge.textContent = user.IsActive ? 'Active' : 'Inactive';

      row.append(info, badge);
      results.appendChild(row);
    });
  }

  async function doSearch(query) {
    if (query.length < 3) {
      results.innerHTML = '';
      return;
    }
    setStatus('Searching...');
    const users = await searchUsers(query);
    renderResults(users);
  }

  let tooltip = null;
  btn.addEventListener('mouseenter', () => {
    tooltip = document.createElement('div');
    tooltip.className = 'slae-user-tooltip';
    tooltip.textContent = 'Search Users by Name, Username or Email';
    document.body.appendChild(tooltip);
    const rect = btn.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 8}px`;
  });
  btn.addEventListener('mouseleave', () => {
    if (tooltip) { tooltip.remove(); tooltip = null; }
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tooltip) { tooltip.remove(); tooltip = null; }
    if (panel.hidden) open();
    else close();
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(input.value.trim()), 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      doSearch(input.value.trim());
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  }, true);

  return wrapper;
}

export function init() {
  // Setup: inject after the bordered content wrapper, inside the search container
  onElement('.forceSearchInputDesktop', (el) => {
    if (el.querySelector(`#${ELEMENT_ID}`)) return;
    const contentWrapper = el.querySelector('.contentWrapper');
    if (!contentWrapper) return;
    contentWrapper.after(buildWidget());
  });

  // Lightning: inject inside the div wrapping the search button so right:0 aligns to the input edge
  onElement('.forceSearchAssistant', (el) => {
    if (el.querySelector(`#${ELEMENT_ID}`)) return;
    const btnWrapper = el.querySelector(':scope > div');
    if (!btnWrapper) return;
    btnWrapper.style.position = 'relative';
    btnWrapper.appendChild(buildWidget());
  });
}
