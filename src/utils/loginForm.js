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
