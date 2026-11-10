// Salesforce's Classic pages take an `isdtp` query parameter that renders
// them without the header, tabs and sidebar. Lightning sets it on the
// Classic pages it embeds in an iframe (Setup's User detail, for example),
// and Classic copies it onto the links inside the page. The User page's
// Contact link, for instance, is javascript:srcUp('/003…?isdtp=p1'), which
// sends the whole tab to that Classic URL on the setup domain — a page with
// no navigation.
//
// Two rules fix that, for top-level page loads only (frames keep `isdtp`):
//   1. A bare record URL (/{id}?…isdtp=…) goes to the Lightning
//      record page. Just dropping `isdtp` would leave you in Classic, because
//      the setup domain renders /{id} as a Classic page.
//   2. Any other Salesforce page just has `isdtp` removed.
export const STRIP_ISDTP_DEFAULTS = { stripIsdtp: true };

export const RECORD_RULE_ID = 100;
export const STRIP_RULE_ID = 101;

const SALESFORCE_DOMAINS = [
  'lightning.force.com',
  'my.salesforce.com',
  'my.salesforce-setup.com',
];

// Chrome compiles regexFilter with RE2 under a 2KB limit, and counted
// repetition like {15} is expanded into that many copies — so the id is
// matched as "one alphanumeric path segment" rather than by exact length.
// Real Salesforce paths with no slash or dot before the query are record ids.
export const RECORD_URL_REGEX =
  '^(https://[^/]+)/([a-zA-Z0-9]+)\\?(?:.*&)?isdtp=.*';
export const RECORD_URL_SUBSTITUTION = '\\1/lightning/r/\\2/view';

/**
 * @param {object} settings  { stripIsdtp: boolean }
 * @returns {chrome.declarativeNetRequest.Rule[]}
 */
export function buildStripIsdtpRules(settings) {
  if (!settings.stripIsdtp) return [];
  const base = { requestDomains: SALESFORCE_DOMAINS, resourceTypes: ['main_frame'] };
  return [
    {
      id: RECORD_RULE_ID,
      priority: 2,
      action: { type: 'redirect', redirect: { regexSubstitution: RECORD_URL_SUBSTITUTION } },
      condition: { ...base, regexFilter: RECORD_URL_REGEX },
    },
    {
      id: STRIP_RULE_ID,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { transform: { queryTransform: { removeParams: ['isdtp'] } } },
      },
      condition: { ...base, regexFilter: '[?&]isdtp=' },
    },
  ];
}
