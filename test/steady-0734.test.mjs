import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0734: the tests that failed a full suite on main, under a load of 90 on 16 cores, made steady. Each is checked by
// running it (`speck test --files`, and the full suite at ship). This checks the one helper the change adds to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome } from './support/panel.mjs';

const withChrome = (value, f) => {
  const was = process.env.SPECK_TEST_CHROME;
  if (value === undefined) delete process.env.SPECK_TEST_CHROME; else process.env.SPECK_TEST_CHROME = value;
  try { return f(); } finally { if (was === undefined) delete process.env.SPECK_TEST_CHROME; else process.env.SPECK_TEST_CHROME = was; }
};

test('0734 AC1: SPECK_TEST_CHROME=none finds no browser, so 0657 AC3\'s copy skips its real-browser tests, and a path is still used as given', () => {
  assert.equal(withChrome('none', findChrome), null);
  assert.equal(withChrome('/opt/some/chrome', findChrome), '/opt/some/chrome');
});
