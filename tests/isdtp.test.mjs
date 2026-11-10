import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStripIsdtpRules as build, RECORD_URL_REGEX, RECORD_URL_SUBSTITUTION,
} from '../src/utils/isdtp.js';
import { buildLoginFormRules } from '../src/utils/loginForm.js';

// Mirrors how declarativeNetRequest applies regexSubstitution (\1 → $1).
const redirect = (url) => {
  const re = new RegExp(RECORD_URL_REGEX);
  return re.test(url) ? url.replace(re, RECORD_URL_SUBSTITUTION.replace(/\\(\d)/g, '$$$1')) : null;
};
const SETUP = 'https://acme--dev.sandbox.my.salesforce-setup.com';

test('off builds no rules', () => assert.deepEqual(build({ stripIsdtp: false }), []));

test('rules only touch top-level Salesforce page loads', () => {
  for (const rule of build({ stripIsdtp: true })) {
    assert.deepEqual(rule.condition.resourceTypes, ['main_frame']);
    assert.ok(rule.condition.requestDomains.includes('my.salesforce-setup.com'));
  }
});

test('record rule wins over the plain strip rule', () => {
  const [record, strip] = build({ stripIsdtp: true });
  assert.ok(record.priority > strip.priority);
  assert.deepEqual(strip.action.redirect.transform.queryTransform.removeParams, ['isdtp']);
});

test('Classic record URL with isdtp goes to the Lightning record page', () => {
  assert.equal(redirect(`${SETUP}/003cX00000srvdm?isdtp=p1`), `${SETUP}/lightning/r/003cX00000srvdm/view`);
  assert.equal(redirect(`${SETUP}/003cX00000srvdmQAA?a=1&isdtp=vw&b=2`), `${SETUP}/lightning/r/003cX00000srvdmQAA/view`);
});

test('record rule ignores other URLs', () => {
  assert.equal(redirect(`${SETUP}/003cX00000srvdm`), null);
  assert.equal(redirect(`${SETUP}/003cX00000srvdm?notisdtp=p1`), null);
  assert.equal(redirect(`${SETUP}/apex/MyPage?isdtp=p1`), null);
  assert.equal(redirect(`${SETUP}/setup/ui/x/003cX00000srvdm?isdtp=p1`), null);
});

test('strip filter matches the parameter, not lookalikes', () => {
  const re = new RegExp(build({ stripIsdtp: true })[1].condition.regexFilter);
  assert.ok(re.test(`${SETUP}/apex/MyPage?isdtp=p1`));
  assert.ok(!re.test(`${SETUP}/apex/MyPage?notisdtp=p1`));
});

test('rule ids do not collide with login form rules', () => {
  const login = buildLoginFormRules({ loginFormTest: 'email', loginFormProd: 'username' }).map((r) => r.id);
  for (const { id } of build({ stripIsdtp: true })) assert.ok(!login.includes(id));
});
