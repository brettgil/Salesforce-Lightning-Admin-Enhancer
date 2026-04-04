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
  loginAsReturn: true,
  recordIdHeader: true,
};

// In-memory list of {label, url} objects driving the favorites UI
let navFavLinks = [];
let dragSrcIndex = null;

// In-memory list of {label, content} objects driving the snippets UI
let snippetItems = [];
let snippetDragSrc = null;

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

function renderSnippetList() {
  const list = document.getElementById('snippet-list');
  list.innerHTML = '';

  if (snippetItems.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'snippet-empty';
    empty.textContent = 'No snippets saved yet.';
    list.appendChild(empty);
    return;
  }

  snippetItems.forEach(({ label, content }, i) => {
    const row = document.createElement('div');
    row.className = 'snippet-row';
    row.draggable = true;

    row.addEventListener('dragstart', (e) => {
      snippetDragSrc = i;
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('snippet-row--dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('snippet-row--dragging');
      list.querySelectorAll('.snippet-row').forEach(r => r.classList.remove('snippet-row--over'));
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.snippet-row').forEach(r => r.classList.remove('snippet-row--over'));
      row.classList.add('snippet-row--over');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (snippetDragSrc === null || snippetDragSrc === i) return;
      const [moved] = snippetItems.splice(snippetDragSrc, 1);
      snippetItems.splice(i, 0, moved);
      snippetDragSrc = null;
      saveSnippets();
      renderSnippetList();
    });

    const handle = document.createElement('span');
    handle.className = 'nav-fav-handle';
    handle.textContent = '⠿';
    handle.title = 'Drag to reorder';

    const body = document.createElement('div');
    body.className = 'snippet-row-body';

    const header = document.createElement('div');
    header.className = 'snippet-row-header';

    const labelEl = document.createElement('div');
    labelEl.className = 'snippet-row-label';
    labelEl.textContent = label;

    const actions = document.createElement('div');
    actions.className = 'snippet-row-actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'snippet-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'nav-fav-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      snippetItems.splice(i, 1);
      saveSnippets();
      renderSnippetList();
    });

    actions.append(copyBtn, removeBtn);
    header.append(labelEl, actions);

    const preview = document.createElement('div');
    preview.className = 'snippet-row-preview';
    preview.textContent = content;

    body.append(header, preview);

    row.append(handle, body);
    list.appendChild(row);
  });
}

function saveSnippets() {
  chrome.storage.local.set({ snippets: JSON.stringify(snippetItems) });
}

function addSnippet() {
  const labelInput = document.getElementById('snippet-label-input');
  const contentInput = document.getElementById('snippet-content-input');
  const label = labelInput.value.trim();
  const content = contentInput.value.trim();
  if (!label || !content) return;

  snippetItems.push({ label, content });
  saveSnippets();
  labelInput.value = '';
  contentInput.value = '';
  renderSnippetList();
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
  settings.appSwitchBehavior = document.getElementById('appSwitchBehavior').value;

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved. Reload your Salesforce page to apply changes.';
    setTimeout(() => { status.textContent = ''; }, 2500);
  });
}

function restoreOptions() {
  const defaults = { ...CHECKBOX_DEFAULTS, navFavoritesLinks: DEFAULT_NAV_FAV_LINKS, appSwitchBehavior: 'off' };

  chrome.storage.sync.get(defaults, (settings) => {
    for (const [key, value] of Object.entries(settings)) {
      const el = document.getElementById(key);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = value;
      else if (el.tagName === 'SELECT') el.value = value;
    }

    try {
      const parsed = JSON.parse(settings.navFavoritesLinks || '{}');
      navFavLinks = Object.entries(parsed).map(([label, url]) => ({ label, url }));
    } catch {
      navFavLinks = [];
    }
    renderFavList();
  });

  chrome.storage.local.get({ snippets: '[]' }, (local) => {
    try {
      snippetItems = JSON.parse(local.snippets);
    } catch {
      snippetItems = [];
    }
    renderSnippetList();
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('nav-fav-add-btn').addEventListener('click', addFav);
document.getElementById('nav-fav-url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addFav();
});

document.getElementById('snippet-add-btn').addEventListener('click', addSnippet);
document.getElementById('snippet-content-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addSnippet();
});
