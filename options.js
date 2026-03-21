const DEFAULT_NAV_FAV_LINKS = JSON.stringify({
  'Company Information': '/lightning/setup/CompanyProfileInfo/home',
  'Flow': '/lightning/setup/Flows/home',
  'Users': '/lightning/setup/ManageUsers/home',
}, null, 2);

const CHECKBOX_DEFAULTS = {
  clickableLogo: true,
  launchById: true,
  quickFindLayout: true,
  quickFocus: true,
  navFavorites: true,
  processBuilder: true,
  orgIdHeader: true,
  setupFavorites: true,
};

// In-memory list of {label, url} objects driving the favorites UI
let navFavLinks = [];
let dragSrcIndex = null;

function renderFavList() {
  const list = document.getElementById('nav-fav-list');
  list.innerHTML = '';

  if (navFavLinks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'nav-fav-empty';
    empty.textContent = 'No favorites added yet.';
    list.appendChild(empty);
    return;
  }

  navFavLinks.forEach(({ label, url }, i) => {
    const row = document.createElement('div');
    row.className = 'nav-fav-row';
    row.draggable = true;
    row.dataset.index = i;

    row.addEventListener('dragstart', (e) => {
      dragSrcIndex = i;
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('nav-fav-row--dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('nav-fav-row--dragging');
      list.querySelectorAll('.nav-fav-row').forEach((r) => r.classList.remove('nav-fav-row--over'));
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.nav-fav-row').forEach((r) => r.classList.remove('nav-fav-row--over'));
      row.classList.add('nav-fav-row--over');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      const [moved] = navFavLinks.splice(dragSrcIndex, 1);
      navFavLinks.splice(i, 0, moved);
      dragSrcIndex = null;
      renderFavList();
    });

    const handle = document.createElement('span');
    handle.className = 'nav-fav-handle';
    handle.textContent = '⠿';
    handle.title = 'Drag to reorder';

    const labelEl = document.createElement('span');
    labelEl.className = 'nav-fav-row-label';
    labelEl.textContent = label;
    labelEl.title = label;

    const urlEl = document.createElement('span');
    urlEl.className = 'nav-fav-row-url';
    urlEl.textContent = url;
    urlEl.title = url;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'nav-fav-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      navFavLinks.splice(i, 1);
      renderFavList();
    });

    row.append(handle, labelEl, urlEl, removeBtn);
    list.appendChild(row);
  });
}

function addFav() {
  const labelInput = document.getElementById('nav-fav-label');
  const urlInput = document.getElementById('nav-fav-url');
  const label = labelInput.value.trim();
  const url = urlInput.value.trim();
  if (!label || !url) return;

  navFavLinks.push({ label, url });
  labelInput.value = '';
  urlInput.value = '';
  renderFavList();
  labelInput.focus();
}

function saveOptions() {
  const settings = {};

  for (const key of Object.keys(CHECKBOX_DEFAULTS)) {
    settings[key] = document.getElementById(key).checked;
  }

  const linksObj = {};
  for (const { label, url } of navFavLinks) {
    linksObj[label] = url;
  }
  settings.navFavoritesLinks = JSON.stringify(linksObj, null, 2);

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved. Reload your Salesforce page to apply changes.';
    setTimeout(() => { status.textContent = ''; }, 2500);
  });
}

function restoreOptions() {
  const defaults = { ...CHECKBOX_DEFAULTS, navFavoritesLinks: DEFAULT_NAV_FAV_LINKS };

  chrome.storage.sync.get(defaults, (settings) => {
    for (const [key, value] of Object.entries(settings)) {
      const el = document.getElementById(key);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = value;
    }

    try {
      const parsed = JSON.parse(settings.navFavoritesLinks || '{}');
      navFavLinks = Object.entries(parsed).map(([label, url]) => ({ label, url }));
    } catch {
      navFavLinks = [];
    }
    renderFavList();
  });
}

function renderFavoritesBackup() {
  chrome.storage.local.get('favoritesCache', (result) => {
    const favs = result.favoritesCache ?? [];
    const container = document.getElementById('favorites-backup-list');
    container.innerHTML = '';

    if (favs.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'fav-backup-empty';
      msg.textContent = 'No cached favorites yet. Visit Setup with the feature enabled to populate this.';
      container.appendChild(msg);
      return;
    }

    for (const fav of favs) {
      const row = document.createElement('div');
      row.className = 'fav-backup-item';

      const label = document.createElement('span');
      label.className = 'fav-backup-label';
      label.textContent = fav.label ?? fav.name ?? '(untitled)';

      const url = document.createElement('span');
      url.className = 'fav-backup-url';
      url.textContent = fav.target ?? '';
      url.title = fav.target ?? '';

      row.append(label, url);
      container.appendChild(row);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  renderFavoritesBackup();
});
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('nav-fav-add-btn').addEventListener('click', addFav);
document.getElementById('nav-fav-url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addFav();
});
