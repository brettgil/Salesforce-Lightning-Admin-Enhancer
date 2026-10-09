// Runs on test.salesforce.com and login.salesforce.com. Kept apart from
// content.js so nothing but the Preferred Login Form prompt loads on login pages.
(async () => {
  if (location.pathname !== '/') return;

  const {
    LOGIN_FORM_DEFAULTS, loginFormKeyForHost, formFromSearch, shouldOfferLoginForm,
  } = await import(chrome.runtime.getURL('src/utils/loginForm.js'));

  const key = loginFormKeyForHost(location.hostname);
  const form = formFromSearch(location.search);
  if (!key || !form) return;

  const settings = await chrome.storage.sync.get({ ...LOGIN_FORM_DEFAULTS, loginFormPrompt: true });
  if (!settings.loginFormPrompt || !shouldOfferLoginForm(key, form, settings[key])) return;

  try {
    const { init } = await import(chrome.runtime.getURL('src/features/loginFormPrompt.js'));
    init(key, form, settings[key]);
  } catch (e) {
    console.warn('[SLAE] Failed to load loginFormPrompt:', e);
  }
})();
