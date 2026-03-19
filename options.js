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
};

function saveOptions() {
  const settings = {};

  for (const key of Object.keys(CHECKBOX_DEFAULTS)) {
    settings[key] = document.getElementById(key).checked;
  }

  settings.navFavoritesLinks = document.getElementById('navFavoritesLinks').value.trim();

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
      if (el.type === 'checkbox') {
        el.checked = value;
      } else {
        el.value = value;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
