// Salesforce login pages default to different forms: test.salesforce.com
// leads with email, login.salesforce.com with username. Both accept a query
// parameter that opens either form directly.
export const LOGIN_FORM_HOSTS = {
  loginFormTest: 'test.salesforce.com',
  loginFormProd: 'login.salesforce.com',
};

export const LOGIN_FORM_DEFAULTS = {
  loginFormTest: 'default',
  loginFormProd: 'default',
};

// The form each host opens on when no parameter is given.
export const SALESFORCE_DEFAULT_FORM = {
  loginFormTest: 'email',
  loginFormProd: 'username',
};

const FORM_QUERY = {
  username: '?login=1',
  email: '?email_login=1',
};

/**
 * Builds declarativeNetRequest rules that send the bare root of each login
 * host to the user's preferred form. URLs with any path or query (startURL,
 * SSO, logout, the form parameters themselves) never match, and links clicked on the login page
 * itself are left alone so the in-page "Log In with ..." links keep working.
 *
 * @param {object} settings   loginForm* values: 'default' | 'username' | 'email'
 * @returns {chrome.declarativeNetRequest.Rule[]}
 */
export function buildLoginFormRules(settings) {
  const rules = [];
  Object.entries(LOGIN_FORM_HOSTS).forEach(([key, host], i) => {
    const query = FORM_QUERY[settings[key]];
    if (!query) return;
    rules.push({
      id: i + 1,
      priority: 1,
      action: { type: 'redirect', redirect: { url: `https://${host}/${query}` } },
      condition: {
        urlFilter: `|https://${host}/|`,
        resourceTypes: ['main_frame'],
        excludedInitiatorDomains: [host],
      },
    });
  });
  return rules;
}

export function loginFormKeyForHost(host) {
  return Object.keys(LOGIN_FORM_HOSTS).find((key) => LOGIN_FORM_HOSTS[key] === host) ?? null;
}

/**
 * Which form a login URL's query string asks for, or null for neither.
 *
 * @param {string} search  location.search, e.g. '?login=1'
 * @returns {'username'|'email'|null}
 */
export function formFromSearch(search) {
  const params = new URLSearchParams(search);
  if (params.get('login') === '1') return 'username';
  if (params.get('email_login') === '1') return 'email';
  return null;
}

/**
 * Whether to offer "Always use this login option" on a login page: only when
 * the page shows a form that isn't already saved, and never for the form the
 * host opens on anyway while the setting is still on Salesforce default.
 */
export function shouldOfferLoginForm(key, form, saved) {
  if (!form || saved === form) return false;
  return !(saved === 'default' && SALESFORCE_DEFAULT_FORM[key] === form);
}
