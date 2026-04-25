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
  setupFavorites: true,
  appSwitchBehavior: 'off',
  loginAsReturn: true,
  recordIdHeader: true,
  userSearch: true,
  userSearchDestination: 'setup',
  loadAll: true,
  fieldApiName: true,
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
