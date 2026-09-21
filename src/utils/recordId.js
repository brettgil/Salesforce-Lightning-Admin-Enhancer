// Salesforce record IDs are 15 or 18 alphanumeric characters.
const ID_RE = /^(?:[a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})$/;

export function isSalesforceId(value) {
  return typeof value === 'string' && ID_RE.test(value);
}

/**
 * Extract the record ID from a Lightning record page path.
 *
 *   /lightning/r/Account/001xx.../view          -> ID is the 2nd segment
 *   /lightning/r/001xx.../view                  -> ID is the 1st segment
 *   /lightning/r/Contact/003xx.../related/Cases/view
 *
 * The 2nd segment is checked first because some standard object API names
 * (e.g. "ServiceContract") are 15 alphanumeric characters and would otherwise
 * be mistaken for an ID when they sit in the 1st segment.
 */
export function getRecordIdFromPath(pathname) {
  const match = pathname.match(/^\/lightning\/r\/(.+)$/);
  if (!match) return null;

  const segments = match[1].split('/').filter(Boolean);
  if (isSalesforceId(segments[1])) return segments[1];
  if (isSalesforceId(segments[0])) return segments[0];
  return null;
}
