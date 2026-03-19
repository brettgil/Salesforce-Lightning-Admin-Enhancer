const DEFAULTS = {
  clickableLogo: true,
  launchById: true,
};

/**
 * Gets all extension settings from Chrome sync storage.
 * Falls back to defaults for any missing keys.
 *
 * @returns {Promise<object>}
 */
export function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, resolve);
  });
}
