import { onElement } from '../utils/observer.js';
import { getSearchTools } from '../utils/searchTools.js';
import { buildUserSoql, isPortalUser, RESULT_LIMIT } from '../utils/userQuery.js';

const ELEMENT_ID = 'slae-user-search';
const PREFS_KEY = 'userSearchPrefs';
const DEFAULT_PREFS = { type: 'all', activeOnly: false, sort: 'name' };
let debounceTimer = null;

// Filter/sort choices are remembered per browser between uses.
function loadPrefs() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ [PREFS_KEY]: DEFAULT_PREFS }, (data) => {
      resolve({ ...DEFAULT_PREFS, ...data[PREFS_KEY] });
    });
  });
}

function savePrefs(prefs) {
  chrome.storage.local.set({ [PREFS_KEY]: prefs });
}

function getApiBase() {
  const hostname = window.location.hostname;
  if (hostname.endsWith('.lightning.force.com')) {
    return `https://${hostname.replace('.lightning.force.com', '.my.salesforce.com')}`;
  }
  return `https://${hostname.replace('salesforce-setup.com', 'salesforce.com')}`;
}

function searchUsers(query, prefs) {
  return new Promise((resolve) => {
    const soql = buildUserSoql(query, prefs);
    const url = `${getApiBase()}/services/data/v59.0/query/?q=${encodeURIComponent(soql)}`;
    chrome.runtime.sendMessage({ action: 'fetchUsers', url }, (res) => {
      if (chrome.runtime.lastError) resolve([]);
      else resolve(res?.records ?? []);
    });
  });
}

function userHref(userId, destination) {
  if (destination === 'record') return `/lightning/r/User/${userId}/view`;
  return `/lightning/setup/ManageUsers/page?address=%2F${userId}%3Fnoredirect%3D1%26isUserEntityOverride%3D1`;
}

function formatLastLogin(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function buildDetails(user) {
  const details = document.createElement('dl');
  details.className = 'slae-user-result-details';
  [
    ['Profile', user.Profile?.Name ?? '—'],
    ['Email', user.Email ?? '—'],
    ['Last Login', formatLastLogin(user.LastLoginDate)],
  ].forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    details.append(dt, dd);
  });
  return details;
}

function buildControls(prefs, onChange) {
  const controls = document.createElement('div');
  controls.className = 'slae-user-search-controls';

  const chips = document.createElement('div');
  chips.className = 'slae-user-chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'User type');
  [['all', 'All'], ['standard', 'Standard'], ['portal', 'Portal']].forEach(([value, label]) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'slae-user-chip';
    chip.textContent = label;
    chip.title = value === 'portal' ? 'Community, partner, customer and guest users' : '';
    chip.setAttribute('aria-pressed', String(prefs.type === value));
    chip.addEventListener('click', () => {
      if (prefs.type === value) return;
      prefs.type = value;
      chips.querySelectorAll('.slae-user-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      onChange();
    });
    chips.appendChild(chip);
  });

  const active = document.createElement('label');
  active.className = 'slae-user-active-toggle';
  const activeBox = document.createElement('input');
  activeBox.type = 'checkbox';
  activeBox.checked = prefs.activeOnly;
  activeBox.addEventListener('change', () => {
    prefs.activeOnly = activeBox.checked;
    onChange();
  });
  active.append(activeBox, 'Active only');

  const sort = document.createElement('select');
  sort.className = 'slae-user-sort';
  sort.setAttribute('aria-label', 'Sort by');
  [['name', 'Name'], ['login', 'Last Login']].forEach(([value, label]) => {
    sort.add(new Option(label, value, false, prefs.sort === value));
  });
  sort.addEventListener('change', () => {
    prefs.sort = sort.value;
    onChange();
  });

  controls.append(chips, active, sort);
  return controls;
}

function buildWidget(destination, prefs) {
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
  input.placeholder = 'Search by name, email or username...';
  input.autocomplete = 'off';
  input.spellcheck = false;

  const results = document.createElement('div');
  results.className = 'slae-user-search-results';

  const controls = buildControls(prefs, () => {
    savePrefs(prefs);
    clearTimeout(debounceTimer);
    doSearch(input.value.trim());
    input.focus();
  });

  panel.append(input, controls, results);
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
    results.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'slae-user-search-status';
    div.textContent = msg;
    results.appendChild(div);
  }

  function renderResults(users) {
    results.innerHTML = '';
    if (users.length === 0) {
      setStatus('No users found.');
      return;
    }

    // The query fetches one extra row so we know when matches were cut off.
    const truncated = users.length > RESULT_LIMIT;
    users = users.slice(0, RESULT_LIMIT);

    users.forEach((user) => {
      const item = document.createElement('div');
      item.className = 'slae-user-item';

      const rowWrap = document.createElement('div');
      rowWrap.className = 'slae-user-item-row';

      const row = document.createElement('a');
      row.className = 'slae-user-result';
      row.href = userHref(user.Id, destination);

      const info = document.createElement('div');
      info.className = 'slae-user-result-info';

      const name = document.createElement('div');
      name.className = 'slae-user-result-name';
      name.textContent = user.Name;

      const meta = document.createElement('div');
      meta.className = 'slae-user-result-meta';
      meta.textContent = user.Username;

      if (isPortalUser(user.UserType)) {
        const portal = document.createElement('span');
        portal.className = 'slae-user-result-portal';
        portal.textContent = 'Portal';
        portal.title = user.UserType;
        name.appendChild(portal);
      }

      info.append(name, meta);

      const badge = document.createElement('span');
      badge.className = `slae-user-result-badge slae-user-result-badge--${user.IsActive ? 'active' : 'inactive'}`;
      badge.textContent = user.IsActive ? 'Active' : 'Inactive';

      row.append(info, badge);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'slae-user-result-toggle';
      toggle.title = 'Show details';
      toggle.setAttribute('aria-label', `Show details for ${user.Name}`);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

      const details = buildDetails(user);
      details.hidden = true;

      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        details.hidden = !details.hidden;
        toggle.setAttribute('aria-expanded', String(!details.hidden));
        item.classList.toggle('slae-user-item--expanded', !details.hidden);
      });

      rowWrap.append(row, toggle);
      item.append(rowWrap, details);
      results.appendChild(item);
    });

    const count = document.createElement('div');
    count.className = 'slae-user-search-count';
    count.textContent = truncated
      ? `Showing first ${RESULT_LIMIT} matches. Refine your search to narrow them down.`
      : `${users.length} ${users.length === 1 ? 'user' : 'users'}`;
    results.prepend(count);
  }

  // Filter changes can fire searches back to back; only render the latest one.
  let searchSeq = 0;
  async function doSearch(query) {
    const seq = ++searchSeq;
    if (query.length < 3) {
      results.innerHTML = '';
      return;
    }
    setStatus('Searching...');
    const users = await searchUsers(query, prefs);
    if (seq === searchSeq) renderResults(users);
  }

  let tooltip = null;
  btn.addEventListener('mouseenter', () => {
    tooltip = document.createElement('div');
    tooltip.className = 'slae-user-tooltip';
    tooltip.textContent = 'Search Users by Name, Username or Email';
    document.body.appendChild(tooltip);
    const rect = btn.getBoundingClientRect();
    const spaceAbove = rect.top;
    const tooltipHeight = tooltip.offsetHeight;
    const below = spaceAbove < tooltipHeight + 16;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    if (below) {
      tooltip.classList.add('slae-user-tooltip--below');
      tooltip.style.top = `${rect.bottom + 8}px`;
    } else {
      tooltip.style.top = `${rect.top - 8}px`;
    }
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

export async function init(destination = 'setup') {
  const prefs = await loadPrefs();
  // Sits left of the global search box, after Launch by ID's Go button, so changes to the
  // search input itself (Ask button, Agentforce Coworker search bar) can't displace it.
  onElement('.slds-global-header__item_search', (searchItem) => {
    if (searchItem.querySelector(`#${ELEMENT_ID}`)) return;
    getSearchTools(searchItem).appendChild(buildWidget(destination, prefs));
  });
}
