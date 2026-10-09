import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLoginFormRules as build } from '../src/utils/loginForm.js';

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
