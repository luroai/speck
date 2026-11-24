import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0734: the tests that failed a full suite on main, under a load of 90 on 16 cores, made steady. Each named
// test passing is checked by running it (`speck test --files`, and the full suite at ship); these check that each now
// measures what a busy machine doesn't change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';
import { findChrome } from './support/panel.mjs';
import { testBody } from './support/quick-run.mjs';

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
const body = (f, name) => testBody(src(f), name);
const withChrome = (value, f) => {
  const was = process.env.SPECK_TEST_CHROME;
  if (value === undefined) delete process.env.SPECK_TEST_CHROME; else process.env.SPECK_TEST_CHROME = value;
  try { return f(); } finally { if (was === undefined) delete process.env.SPECK_TEST_CHROME; else process.env.SPECK_TEST_CHROME = was; }
};

test('0734 AC1: 0657 AC3 runs the house-rule files with no browser, so they start no real panel, and SPECK_TEST_CHROME still names one otherwise', () => {
  assert.equal(withChrome('none', findChrome), null, 'SPECK_TEST_CHROME=none finds none');
  assert.equal(withChrome('/opt/some/chrome', findChrome), '/opt/some/chrome', 'a path is still used as given');
  assert.match(src('house-rules-full-0657.test.mjs'), /const cleanEnv = \(\) => \{ const e = \{ \.\.\.env, SPECK_TEST_CHROME: 'none' \}/);
});

test('0734 AC1: 0061\'s self-check and 0517 AC3\'s slides are timed by CPU time, which waiting doesn\'t add to', async () => {
  const self = body('panel-0061.test.mjs', '0061 self-check');
  assert.match(self, /process\.cpuUsage\(\)/);
  assert.doesNotMatch(self, /Date\.now\(\)/, 'no time on the clock');
  const slides = body('panel-0517.test.mjs', "0517 AC3: in a real browser with 500 shipped tickets");
  assert.match(slides, /name === 'ThreadTime'/, 'the page\'s main thread\'s CPU time');
  assert.match(slides, /for \(const a of slides\) a\.pause\(\)/, 'the slide is held until the time is read, so the redraw after it isn\'t counted');
  assert.match(slides, /times\.push\(Math\.round\(\(await threadMs\(\)\) - cpu0\)\)/);
  // What the 0061 measure counts: 300 ms of waiting adds next to nothing.
  const cpu = () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
  const from = cpu();
  await new Promise(r => setTimeout(r, 300));
  assert.ok(cpu() - from < 100, `300 ms of waiting used ${cpu() - from} ms of CPU`);
});

test('0734 AC1: 0202\'s stalling run writes until both its processes have started (for up to 30 s), then stalls after 3 s', () => {
  const t = body('stall-0202.test.mjs', '0202 AC1, AC2');
  assert.match(t, /\(while :; do echo starting; sleep 0\.2; done\) & T=\$!; node spawn\.mjs orphan a; node spawn\.mjs kept b & for i in \$\(seq 600\); do \[ -f b \] && break; sleep 0\.05; done; kill \$T; echo started; sleep 300', 3000\)/);
});

test('0734 AC1: 0208\'s panel test counts its second on top of a change in the main checkout, with no keep-alive look to find a missed worktree', () => {
  const t = body('panel-0208.test.mjs', '0208 AC1: in the panel');
  assert.match(t, /SPECK_PANEL_PING_MS: '60000'/);
  assert.match(t, /const base = Date\.now\(\) - t0;/);
  assert.match(t, /reaches\(from, t0, 1000 \+ base, '0001', 'building'/);
});

test('0734 AC1: 0476 waits up to 10 s for a lane\'s tab to open and its slide to end, and still checks the slide by its own 120 ms', () => {
  const s = src('panel-0476.test.mjs');
  assert.match(s, /\$\{lane\}'s tab to open`, 10000\);/);
  assert.match(s, /the slide to end`, 10000\);/);
  assert.match(s, /assert\.ok\(left < 121,/);
});
