import { onElement } from '../utils/observer.js';

function getPinnedLinks() {
  return new Promise(resolve => {
    if (!chrome?.storage?.sync) return resolve({});
    chrome.storage.sync.get({ navFavoritesLinks: '{}' }, result => {
      try { resolve(JSON.parse(result.navFavoritesLinks)); }
      catch { resolve({}); }
    });
  });
}

function setPinnedLinks(links) {
  return new Promise(resolve => {
    if (!chrome?.storage?.sync) return resolve();
    chrome.storage.sync.set(
      { navFavoritesLinks: JSON.stringify(links, null, 2) },
      resolve
    );
  });
}

function pinIcon(active) {
  return active
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="#0176d3" xmlns="http://www.w3.org/2000/svg"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9aa0ac" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/></svg>`;
}

export function init() {
  if (!window.location.hostname.includes('salesforce-setup.com')) return;

  onElement('li.onesetupNavTreeNode a.slds-tree__item-label', async link => {
    const div = link.closest('.slds-tree__item');
    if (!div || div.querySelector('.slae-nav-pin')) return;

    const label = link.textContent.trim();
    const url = link.getAttribute('href');
    if (!url) return;

    const links = await getPinnedLinks();
    const isPinned = label in links;

    const btn = document.createElement('button');
    btn.className = 'slae-nav-pin' + (isPinned ? ' is-pinned' : '');
    btn.title = isPinned ? 'Remove from My Setup Shortcuts' : 'Add to My Setup Shortcuts';
    btn.innerHTML = pinIcon(isPinned);

    btn.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();

      const current = await getPinnedLinks();
      if (label in current) {
        delete current[label];
        btn.classList.remove('is-pinned');
        btn.title = 'Add to My Setup Shortcuts';
        btn.innerHTML = pinIcon(false);
      } else {
        current[label] = url;
        btn.classList.add('is-pinned');
        btn.title = 'Remove from My Setup Shortcuts';
        btn.innerHTML = pinIcon(true);
      }
      await setPinnedLinks(current);
    });

    div.appendChild(btn);
  });
}
