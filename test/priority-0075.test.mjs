import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fakePage, items, queueRows } from './support/panel.mjs';
import { runRepo } from './support/run.mjs';
import { ORDER_CASES, runUntilLaunched } from './support/quick-run.mjs';

// ---------- 0075: treat a ticket with no priority the same everywhere ----------

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'speck.mjs');
const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
// The three ways to have no priority: no line, a bare `priority:` and `priority: ""`.
const NONE = { missing: null, bare: 'priority:', quoted: 'priority: ""' };

// A repo with speck installed and the given tickets: [id, status, priority line or null], written by hand.
function repo(tickets) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-prio-')));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run('init', '--skip-checks').status, 0);
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  const fileOf = id => path.join(dir, 'speck', 'tickets', `${id}-t.md`);
  for (const [id, status, line] of tickets) {
    const fm = [`id: "${id}"`, `title: Ticket ${id}`, `status: ${status}`, ...(line === null ? [] : [line]), 'size: S', 'risk: low', 'builder: claude', 'reviewer: codex'];
    fs.writeFileSync(fileOf(id), `---\n${fm.join('\n')}\n---\n${good}`);
  }
  return { dir, run, fileOf, json: () => JSON.parse(run('status', '--json').stdout).tickets };
}
// The ids of a status group in `speck status`, in order, with their priority tags.
function group(out, name) {
  const lines = out.split('\n');
  const at = lines.findIndex(l => l.startsWith(`${name.toUpperCase()} (`));
  const rows = [];
  for (const l of lines.slice(at + 1)) { if (!l.startsWith('  ')) break; const m = l.match(/^ {2}(\d{4})\S*(?: bug)?\s+(P\S*)\s/); if (m) rows.push(`${m[1]} ${m[2]}`); }
  return rows;
}

for (const [form, line] of Object.entries(NONE)) {
  test(`0075 AC1: a ${form} priority shows as P- after every prioritised ticket in its group, then by id`, () => {
    const r = repo([['0001', 'ready', line], ['0002', 'ready', 'priority: 5'], ['0003', 'ready', 'priority: 1'], ['0004', 'ready', line], ['0005', 'draft', line]]);
    const out = r.run('status');
    assert.equal(out.status, 0, out.stderr);
    assert.deepEqual(group(out.stdout, 'ready'), ['0003 P1', '0002 P5', '0001 P-', '0004 P-']);
    assert.deepEqual(group(out.stdout, 'draft'), ['0005 P-']);
    assert.doesNotMatch(out.stdout, /object Object/);
  });

  test(`0075 AC1: status --json gives a ${form} priority as null and lists it after every ticket with one`, () => {
    const r = repo([['0001', 'ready', line], ['0002', 'ready', 'priority: 5'], ['0003', 'draft', 'priority: 1'], ['0004', 'ready', line]]);
    const t = r.json();
    assert.deepEqual(t.map(x => x.id), ['0003', '0002', '0001', '0004']);
    assert.deepEqual(t.map(x => x.priority), [1, 5, null, null]);
  });
}

test('0075 AC1: speck run launches a ready ticket with no priority after ready tickets with one', async () => {
  const { tickets, order } = ORDER_CASES['0075 AC1'];
  const r = runRepo({ tickets, max: 1 });
  const out = await runUntilLaunched(r, order.length, { env: { FAKE_MS: '0' } });
  assert.equal(out.status, 0, out.out);
  assert.deepEqual(r.calls().map(c => c.args[0]), order);
});

for (const bad of ['0', '6', '2.5', 'high', '-1', '{}', '[1]']) {
  test(`0075 AC2: lint gives an error for priority ${bad}`, () => {
    const r = repo([['0001', 'draft', `priority: ${bad}`]]);
    const out = r.run('lint', '1');
    assert.notEqual(out.status, 0);
    assert.match(out.stdout, /^✗ priority must be.*1 to 5/m);
  });
}

for (const [form, line] of Object.entries({ ...NONE, one: 'priority: 1', five: 'priority: 5   # 1 (highest) to 5' })) {
  test(`0075 AC2: lint gives no priority error for a ${form} priority`, () => {
    const r = repo([['0001', 'draft', line]]);
    const out = r.run('lint', '1');
    assert.equal(out.status, 0, out.stdout);
    assert.doesNotMatch(out.stdout, /priority/);
  });
}

for (const bad of ['0', '6', '2.5', 'high', ' 3', '03', 'null']) {
  test(`0075 AC2: speck set refuses priority ${JSON.stringify(bad)}, changing nothing`, () => {
    const r = repo([['0001', 'draft', 'priority: 2   # 1 (highest) to 5']]);
    const before = fs.readFileSync(r.fileOf('0001'), 'utf8');
    const out = r.run('set', '1', 'priority', bad);
    assert.notEqual(out.status, 0);
    assert.match(out.stderr, /priority must be a whole number from 1 to 5/);
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(fs.readFileSync(r.fileOf('0001'), 'utf8'), before);
  });
}

test('0075 AC2: speck set accepts each whole number from 1 to 5', () => {
  const r = repo([['0001', 'draft', 'priority: 2']]);
  for (const n of [1, 2, 3, 4, 5]) {
    assert.equal(r.run('set', '1', 'priority', String(n)).status, 0);
    assert.equal(r.json()[0].priority, n);
  }
});

test('0075 AC3: speck set <id> priority "" clears it, keeping the trailing comment, and it then has no priority', () => {
  const r = repo([['0001', 'ready', 'priority: 2              # 1 (highest) to 5'], ['0002', 'ready', 'priority: 4']]);
  const out = r.run('set', '1', 'priority', '');
  assert.equal(out.status, 0, out.stderr);
  const line = fs.readFileSync(r.fileOf('0001'), 'utf8').split('\n').find(l => l.startsWith('priority:'));
  assert.match(line, /^priority: ""\s+# 1 \(highest\) to 5$/);
  assert.deepEqual(r.json().map(x => [x.id, x.priority]), [['0002', 4], ['0001', null]]);
  assert.deepEqual(group(r.run('status').stdout, 'ready'), ['0002 P4', '0001 P-']);
  assert.equal(r.run('lint', '1').status, 0);
  // Other fields still refuse a blank value.
  const title = r.run('set', '1', 'title', '');
  assert.notEqual(title.status, 0);
  assert.match(title.stderr, /Usage: speck set/);
});

test('0075 AC4: the panel shows no priority tag for each of the three forms', async () => {
  const r = repo([['0001', 'draft', null], ['0002', 'draft', 'priority:'], ['0003', 'draft', 'priority: ""'], ['0004', 'draft', 'priority: 2'],
    ['0005', 'ready', null], ['0006', 'ready', 'priority:'], ['0007', 'ready', 'priority: ""']]);
  const p = fakePage([{ tickets: r.json(), ideas: [] }]);
  await p.settle();
  const pTags = n => p.all(n).filter(x => /\btag\b/.test(x.className || '') && /^P/.test(x._text || ''));
  const rows = [...items(p), ...queueRows(p)];
  for (const id of ['0001', '0002', '0003', '0004', '0005', '0006', '0007']) {
    const row = rows.find(n => n.textContent.includes(id));
    assert.ok(row, `${id} is shown`);
    assert.deepEqual(pTags(row).map(x => x._text), id === '0004' ? ['P2'] : [], id);
    assert.doesNotMatch(row.textContent, /object Object/, id);
  }
});

test('0075 AC3: speck help says priority "" clears it', () => {
  const out = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
  assert.match(out.stdout + out.stderr, /speck set <id> <field> <value> .*priority "" clears it/);
});
