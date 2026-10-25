import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { foremanView, foremanLines, FIXING_SAYS } from '../scripts/foreman.mjs';

// ---------- 0501: speck status names the watch setting instead of Fixing ----------

const ON = { on: true, pid: 4242 };
const rec = () => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] } });
const lines = fixing => foremanLines(foremanView({ run: ON, record: rec(), tickets: [], fixing }));
const setWatch = (r, v) => {
  const file = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, /^watch:/m.test(text) ? text.replace(/^watch:.*$/m, `watch: ${v}`) : `${text.replace(/\s*$/, '')}\nwatch: ${v}\n`);
};

test('0501 AC1: with watch fix, the first line names watch: fix and the line under it says what fix does', () => {
  const [first, second] = lines('fix');
  assert.equal(first, 'SPECK: Idle · watch: fix');
  assert.equal(second, `  watch: ${FIXING_SAYS.fix}`);
  assert.match(second, /^ {2}watch: fix\. speck takes the recommendation/);
});

test('0501 AC2: with watch tell or off, the first line is the word alone', () => {
  for (const v of ['tell', 'off']) {
    const out = lines(v);
    assert.equal(out[0], 'SPECK: Idle', v);
    assert.ok(!out.some(l => /watch:/.test(l)), v);
  }
});

test('0501 AC3: speck status prints Fixing nowhere, and the panel keeps its Fixing stage word', () => {
  for (const v of ['fix', 'tell', 'off']) assert.ok(!lines(v).join('\n').includes('Fixing'), v);
  const r = blockedRepo();
  setWatch(r, 'fix');
  const out = r.run('status').stdout;
  assert.match(out, /^SPECK: \S.* · watch: fix$/m);
  assert.ok(!out.includes('Fixing'), out);
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'panel-model.js'), 'utf8'), /return 'Fixing'/);
});
