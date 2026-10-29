// SOQL for User Search. Kept free of DOM/chrome APIs so it can be unit tested.

export const RESULT_LIMIT = 50;

// Internal users. Chatter Free (CsnOnly) is internal too; everything else
// (PowerPartner, CspLitePortal, PowerCustomerSuccess, Guest, ...) is a portal/community user.
const STANDARD_TYPES = "('Standard', 'CsnOnly')";

export function isPortalUser(userType) {
  return !!userType && userType !== 'Standard' && userType !== 'CsnOnly';
}

function escapeSoql(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * @param {string} query - text matched against Name, Username and Email
 * @param {object} [opts]
 * @param {'all'|'standard'|'portal'} [opts.type='all']
 * @param {boolean} [opts.activeOnly=false]
 * @param {'name'|'login'} [opts.sort='name']
 * @returns {string} SOQL fetching one row past RESULT_LIMIT so callers can tell results were cut off
 */
export function buildUserSoql(query, { type = 'all', activeOnly = false, sort = 'name' } = {}) {
  const q = escapeSoql(query);
  const where = [`(Name LIKE '%${q}%' OR Username LIKE '%${q}%' OR Email LIKE '%${q}%')`];
  if (type === 'standard') where.push(`UserType IN ${STANDARD_TYPES}`);
  if (type === 'portal') where.push(`UserType NOT IN ${STANDARD_TYPES}`);
  if (activeOnly) where.push('IsActive = true');

  const orderBy = sort === 'login'
    ? 'LastLoginDate DESC NULLS LAST, Name ASC'
    : 'IsActive DESC, Name ASC';

  return `SELECT Id, Name, Username, Email, IsActive, UserType, Profile.Name, LastLoginDate FROM User WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ${RESULT_LIMIT + 1}`;
}
