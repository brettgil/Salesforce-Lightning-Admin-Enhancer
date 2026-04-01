import { onElement } from '../utils/observer.js';


function getApiBaseUrl() {
  return `https://${window.location.hostname.replace('salesforce-setup.com', 'salesforce.com')}`;
}

function sendBgMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (res) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(res);
    });
  });
}

async function loadFavorites() {
  const res = await sendBgMessage({ action: 'fetchFavorites', baseUrl: getApiBaseUrl() });
  const favs = res?.favorites ?? [];
  return favs;
}

// Salesforce stores some favorites as /lightning/setup/SetupOneHome/{recordId}
// which doesn't resolve as a page. Navigate to just /{recordId} instead.
function resolveTarget(target) {
  const last = target.split('/').filter(Boolean).pop() ?? '';
  if (/^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(last)) return `/${last}`;
  return target;
}

let dropdownEl = null;

function closeDropdown() {
  dropdownEl?.remove();
  dropdownEl = null;
  document.removeEventListener('click', onOutsideClick, true);
}

function onOutsideClick(e) {
  if (dropdownEl && !dropdownEl.contains(e.target)) closeDropdown();
}

function showDropdown(anchor, favorites) {
  closeDropdown();

  dropdownEl = document.createElement('div');
  dropdownEl.className = 'slae-fav-dropdown';

  // Header
  const header = document.createElement('div');
  header.className = 'slae-fav-dropdown-header';
  const title = document.createElement('span');
  title.textContent = 'MY FAVORITES';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'slae-fav-dropdown-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeDropdown(); });
  header.append(title, closeBtn);
  dropdownEl.appendChild(header);

  // List
  if (favorites.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'slae-fav-dropdown-empty';
    msg.textContent = 'No favorites yet.';
    dropdownEl.appendChild(msg);
  } else {
    const ul = document.createElement('ul');
    ul.className = 'slae-fav-dropdown-list';

    for (const fav of favorites) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'slae-fav-dropdown-link';
      const resolved = resolveTarget(fav.target);
      a.href = resolved;

      const icon = document.createElement('span');
      icon.className = 'slae-fav-icon';
      if (fav.iconColor) icon.style.backgroundColor = `#${fav.iconColor}`;
      if (fav.iconUrl) {
        const img = document.createElement('img');
        img.src = fav.iconUrl;
        img.alt = '';
        icon.appendChild(img);
      }

      const text = document.createElement('span');
      text.className = 'slae-fav-item-text';
      const name = document.createElement('span');
      name.className = 'slae-fav-item-name';
      name.textContent = fav.name ?? fav.target;
      const subtitle = document.createElement('span');
      subtitle.className = 'slae-fav-item-subtitle';
      subtitle.textContent = fav.subtitle ?? fav.objectType ?? '';
      text.append(name, subtitle);

      a.append(icon, text);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeDropdown();
        window.location.assign(resolved);
      });
      li.appendChild(a);
      ul.appendChild(li);
    }

    dropdownEl.appendChild(ul);
  }

  // Footer
  const footer = document.createElement('div');
  footer.className = 'slae-fav-dropdown-footer';
  const editLink = document.createElement('a');
  editLink.href = '/lightning/favorites/home';
  editLink.textContent = 'Edit Favorites';
  editLink.addEventListener('click', (e) => { e.preventDefault(); closeDropdown(); window.location.assign('/lightning/favorites/home'); });
  footer.appendChild(editLink);
  dropdownEl.appendChild(footer);

  anchor.style.position = 'relative';
  anchor.appendChild(dropdownEl);

  setTimeout(() => document.addEventListener('click', onOutsideClick, true), 0);
}

function enableFavorites(el) {
  if (el.dataset.slaeInit) return;
  el.dataset.slaeInit = 'true';

  const dropBtn = el.querySelector('.slds-global-actions__favorites-more');
  if (!dropBtn) return;

  let favorites = [];

  dropBtn.removeAttribute('disabled');

  loadFavorites().then((favs) => { favorites = favs; });

  dropBtn.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    const anchor = el.closest('li') ?? el;
    showDropdown(anchor, favorites);
  }, true);
}

export function init() {
  if (!window.location.hostname.includes('salesforce-setup.com')) return;
  onElement('.oneFavorites', enableFavorites);
}
