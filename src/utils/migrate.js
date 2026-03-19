const V1_TO_V2 = {
  logoOpen: 'clickableLogo',
  moveQuickFind: 'quickFindLayout',
  quickFocus: 'quickFocus',
  navFavs: 'navFavorites',
  navFavsLinks: 'navFavoritesLinks',
  resizePB: 'processBuilder',
};

const V1_KEYS = Object.keys(V1_TO_V2);

// The default Process Builder entry added in v2.0 — removed in v2.1.
// If a user's saved links still contain this exact entry, remove it.
// If they have a custom Process Builder URL, leave it alone.
const REMOVED_DEFAULTS = {
  'Process Builder': '/lightning/setup/ProcessAutomation/home',
};

/**
 * Runs once per install/upgrade. Maps v1 storage keys to v2 keys so
 * existing user preferences are preserved after upgrading.
 * Sets a `v2migrated` flag when done so it never runs again.
 */
function migrateV2(data) {
  return new Promise((resolve) => {
    if (data.v2migrated) return resolve();

    const updates = { v2migrated: true };

    for (const [oldKey, newKey] of Object.entries(V1_TO_V2)) {
      if (oldKey in data) {
        updates[newKey] = data[oldKey];
      }
    }

    chrome.storage.sync.set(updates, () => {
      chrome.storage.sync.remove(V1_KEYS, resolve);
    });
  });
}

/**
 * Removes default nav favorite entries that were dropped from later versions.
 * Only removes an entry if its URL exactly matches the old default value,
 * so user-customized URLs are never touched.
 * Sets a `navFavsDefaultsCleaned` flag when done so it only runs once.
 */
function cleanNavFavDefaults(data) {
  return new Promise((resolve) => {
    if (data.navFavsDefaultsCleaned) return resolve();
    if (!data.navFavoritesLinks) {
      return chrome.storage.sync.set({ navFavsDefaultsCleaned: true }, resolve);
    }

    let links;
    try {
      links = JSON.parse(data.navFavoritesLinks);
    } catch {
      return chrome.storage.sync.set({ navFavsDefaultsCleaned: true }, resolve);
    }

    let changed = false;
    for (const [label, url] of Object.entries(REMOVED_DEFAULTS)) {
      if (links[label] === url) {
        delete links[label];
        changed = true;
      }
    }

    const updates = { navFavsDefaultsCleaned: true };
    if (changed) updates.navFavoritesLinks = JSON.stringify(links);

    chrome.storage.sync.set(updates, resolve);
  });
}

export function migrateIfNeeded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['v2migrated', 'navFavsDefaultsCleaned', 'navFavoritesLinks', ...V1_KEYS],
      async (data) => {
        await migrateV2(data);
        await cleanNavFavDefaults(data);
        resolve();
      }
    );
  });
}
