const DEFAULTS = {
  clickableLogo: true,
  launchById: true,
};

function saveOptions() {
  const settings = {};
  for (const key of Object.keys(DEFAULTS)) {
    settings[key] = document.getElementById(key).checked;
  }

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved. Reload your Salesforce page to apply changes.';
    setTimeout(() => { status.textContent = ''; }, 2500);
  });
}

function restoreOptions() {
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    for (const [key, value] of Object.entries(settings)) {
      const el = document.getElementById(key);
      if (el) el.checked = value;
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
