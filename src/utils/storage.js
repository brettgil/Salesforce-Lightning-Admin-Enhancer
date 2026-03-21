const DEFAULT_NAV_FAV_LINKS = JSON.stringify({
  'Company Information': '/lightning/setup/CompanyProfileInfo/home',
  'Flow': '/lightning/setup/Flows/home',
  'Users': '/lightning/setup/ManageUsers/home',
});

const DEFAULTS = {
  clickableLogo: true,
  launchById: true,
  quickFindLayout: true,
  quickFocus: true,
  navFavorites: true,
  navFavoritesLinks: DEFAULT_NAV_FAV_LINKS,
  processBuilder: true,
  orgIdHeader: true,
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
