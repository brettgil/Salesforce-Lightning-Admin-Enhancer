import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLoginFormRules as build, formFromSearch, shouldOfferLoginForm as offer, loginFormKeyForHost } from '../src/utils/loginForm.js';

test('defaults build no rules', () =>
  assert.deepEqual(build({ loginFormTest: 'default', loginFormProd: 'default' }), []));

test('username on test redirects to ?login=1', () => {
  const [rule] = build({ loginFormTest: 'username', loginFormProd: 'default' });
  assert.equal(rule.action.redirect.url, 'https://test.salesforce.com/?login=1');
  assert.equal(rule.condition.urlFilter, '|https://test.salesforce.com/|');
  assert.deepEqual(rule.condition.resourceTypes, ['main_frame']);
  assert.deepEqual(rule.condition.excludedInitiatorDomains, ['test.salesforce.com']);
});

test('email on login redirects to ?email_login=1', () => {
  const [rule] = build({ loginFormTest: 'default', loginFormProd: 'email' });
  assert.equal(rule.action.redirect.url, 'https://login.salesforce.com/?email_login=1');
});

test('both hosts get distinct rule ids', () => {
  const rules = build({ loginFormTest: 'email', loginFormProd: 'username' });
  assert.equal(rules.length, 2);
  assert.notEqual(rules[0].id, rules[1].id);
});

test('unknown values build no rules', () =>
  assert.deepEqual(build({ loginFormTest: 'bogus' }), []));

test('host to setting key', () => {
  assert.equal(loginFormKeyForHost('test.salesforce.com'), 'loginFormTest');
  assert.equal(loginFormKeyForHost('login.salesforce.com'), 'loginFormProd');
  assert.equal(loginFormKeyForHost('acme.my.salesforce.com'), null);
});

test('form from query string', () => {
  assert.equal(formFromSearch('?login=1'), 'username');
  assert.equal(formFromSearch('?email_login=1'), 'email');
  assert.equal(formFromSearch('?login=1&startURL=%2Fhome'), 'username');
  assert.equal(formFromSearch(''), null);
  assert.equal(formFromSearch('?startURL=%2Fhome'), null);
  assert.equal(formFromSearch('?login=0'), null);
});

test('offer the checkbox only for a form that is not already in effect', () => {
  assert.equal(offer('loginFormTest', 'username', 'default'), true);
  assert.equal(offer('loginFormTest', 'username', 'username'), false);
  assert.equal(offer('loginFormTest', 'username', 'email'), true);
  assert.equal(offer('loginFormTest', 'email', 'default'), false);
  assert.equal(offer('loginFormProd', 'email', 'default'), true);
  assert.equal(offer('loginFormProd', 'username', 'default'), false);
  assert.equal(offer('loginFormProd', 'username', 'email'), true);
  assert.equal(offer('loginFormTest', null, 'default'), false);
});
