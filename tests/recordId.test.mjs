import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecordIdFromPath as f } from '../src/utils/recordId.js';

const A = '001Ho00001AbCdE';        // 15
const B = '0035g00000XyZ1AAAB';     // 18

test('object + id', () => assert.equal(f(`/lightning/r/Account/${A}/view`), A));
test('id only',     () => assert.equal(f(`/lightning/r/${B}/view`), B));
test('related list',() => assert.equal(f(`/lightning/r/Contact/${B}/related/Cases/view`), B));
test('custom obj',  () => assert.equal(f(`/lightning/r/My_Obj__c/${A}/edit`), A));
test('15-char standard object name first', () =>
  assert.equal(f(`/lightning/r/ServiceContract/${B}/view`), B));
test('non-record pages', () => {
  assert.equal(f('/lightning/o/Account/list'), null);
  assert.equal(f('/lightning/setup/SetupOneHome/home'), null);
  assert.equal(f('/lightning/r/Account/view'), null);
});
