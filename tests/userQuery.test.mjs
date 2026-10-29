import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUserSoql as soql, isPortalUser, RESULT_LIMIT } from '../src/utils/userQuery.js';

test('defaults: all users, name sort, limit + 1', () => {
  const s = soql('jane');
  assert.match(s, /WHERE \(Name LIKE '%jane%' OR Username LIKE '%jane%' OR Email LIKE '%jane%'\) ORDER BY/);
  assert.match(s, /ORDER BY IsActive DESC, Name ASC/);
  assert.ok(s.endsWith(`LIMIT ${RESULT_LIMIT + 1}`));
  assert.doesNotMatch(s, /UserType (NOT )?IN/);
});

test('escapes quotes and backslashes', () => {
  assert.match(soql("o'brien\\"), /'%o\\'brien\\\\%'/);
});

test('standard filter', () => assert.match(soql('a', { type: 'standard' }), / AND UserType IN \('Standard', 'CsnOnly'\)/));
test('portal filter',   () => assert.match(soql('a', { type: 'portal' }),   / AND UserType NOT IN \('Standard', 'CsnOnly'\)/));
test('active only',     () => assert.match(soql('a', { activeOnly: true }), / AND IsActive = true/));
test('last login sort', () => assert.match(soql('a', { sort: 'login' }),    /ORDER BY LastLoginDate DESC NULLS LAST, Name ASC/));

test('isPortalUser', () => {
  assert.equal(isPortalUser('Standard'), false);
  assert.equal(isPortalUser('CsnOnly'), false);
  assert.equal(isPortalUser('PowerPartner'), true);
  assert.equal(isPortalUser('Guest'), true);
  assert.equal(isPortalUser(undefined), false);
});
