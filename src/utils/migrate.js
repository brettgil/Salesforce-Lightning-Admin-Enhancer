const V1_TO_V2 = {
  logoOpen: 'clickableLogo',
  moveQuickFind: 'quickFindLayout',
  quickFocus: 'quickFocus',
};

const V1_KEYS = Object.keys(V1_TO_V2);

/**
 * Runs once per install/upgrade. Maps v1 storage keys to v2 keys so
 * existing user preferences are preserved after upgrading.
 * Sets a `v2migrated` flag when done so it never runs again.
 */
export function migrateIfNeeded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['v2migrated', ...V1_KEYS], (data) => {
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
  });
}
