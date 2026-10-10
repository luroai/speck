import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fm, panelRepo, freePort, startPanel, stop, request, post, tokenOf, readyPath, readyPanel as plainPanel, headOf, readT, cliCopy } from './support/panel.mjs';

// ---------- 0079: the panel's ticket writes use the same code as speck set ----------

const priorityPath = (id, n) => `/api/tickets/${id}/priority/${n}`;
// A panel with a draft 0002 that passes lint and has a priority, as a new ticket does.
async function readyPanel() {
  const out = await plainPanel();
  out.r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: '3              # 1 (highest) to 5' }));
  return out;
}
const ticketFiles = r => fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).map(f => [f, fs.statSync(path.join(r.dir, 'speck', 'tickets', f)).isFile() ? readT(r, f) : '']);
// What `speck set` prints when it refuses, run on a throwaway copy of the ticket so the repo itself is untouched.
function setRefusal(r, name, args) {
  const file = path.join(r.dir, 'speck', 'tickets', name), before = fs.readFileSync(file, 'utf8');
  const out = r.run('set', ...args);
  assert.notEqual(out.status, 0, `speck set ${args.join(' ')} refuses`);
  assert.equal(fs.readFileSync(file, 'utf8'), before, 'speck set changed nothing');
  return out.stderr.replace(/\n$/, '');
}

test('0079 AC1: the panel has no copy of speck set\'s checks or write, and imports the shared ones', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'panel.mjs'), 'utf8');
  for (const copy of [/\blintTicket\b/, /\bwriteField\b/, /Not ready:/, /\[1-5\]/, /whole number from 1 to 5/])
    assert.doesNotMatch(src, copy, `panel.mjs has no ${copy}`);
  const speck = fs.readFileSync(path.join(ROOT, 'scripts', 'speck.mjs'), 'utf8');
  const cmdSet = speck.slice(speck.indexOf('function cmdSet('), speck.indexOf('\n}\n', speck.indexOf('function cmdSet(')));
  for (const fn of ['checkSetValue', 'checkSetTicket', 'setTicketField']) {
    assert.match(src, new RegExp(`\\b${fn}\\(`), `the panel calls ${fn}`);
    assert.match(cmdSet, new RegExp(`\\b${fn}\\(`), `speck set calls ${fn}`);
  }
});

test('0079 AC1: a rule added to speck set\'s shared checks applies in the panel too', async () => {
  const { cli } = cliCopy();
  const file = path.join(path.dirname(cli), 'speck.mjs');
  const code = fs.readFileSync(file, 'utf8');
  assert.ok(code.includes('export function checkSetValue(') && code.includes('export function checkSetTicket('), 'the shared checks are exported from speck.mjs');
  const valueAt = code.indexOf('{', code.indexOf('export function checkSetValue('));
  const ticketAt = code.indexOf('{', code.indexOf('export function checkSetTicket('));
  let edited = code.slice(0, ticketAt + 1) + `\n  if (key === 'status' && t.fm.title === 'Two') throw new SpeckError('No tickets called Two.');` + code.slice(ticketAt + 1);
  edited = edited.slice(0, valueAt + 1) + `\n  if (key === 'priority' && value === '4') throw new SpeckError('No fours.');` + edited.slice(valueAt + 1);
  fs.writeFileSync(file, edited);
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: 3 }));
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)], cli);
  try {
    const token = tokenOf((await request(port)).body);
    const before = headOf(r);
    const four = await post(port, priorityPath('0002', 4), { token });
    assert.equal(four.status, 422, four.body);
    assert.equal(JSON.parse(four.body).error, 'No fours.');
    const ready = await post(port, readyPath('0002'), { token });
    assert.equal(ready.status, 422, ready.body);
    assert.equal(JSON.parse(ready.body).error, 'No tickets called Two.');
    assert.equal(headOf(r), before, 'nothing committed');
    assert.match(readT(r, '0002-two.md'), /^status: draft$/m);
    assert.match(readT(r, '0002-two.md'), /^priority: 3$/m);
  } finally { await stop(p); }
});

test('0079 AC2: a draft that fails the size rules gets exactly speck set\'s Not ready text, and nothing changes', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    r.write('0003-three.md', fm({ id: '"0003"', title: 'Three', size: 'L' }), '## Problem\nP.\n## Outcome\nO.\n');
    const want = setRefusal(r, '0003-three.md', ['3', 'status', 'ready']);
    assert.match(want, /^Not ready:\n  ✗ /);
    const before = headOf(r), files = ticketFiles(r);
    const res = await post(port, readyPath('0003'), { token });
    assert.equal(res.status, 422, res.body);
    assert.equal(JSON.parse(res.body).error, want);
    assert.equal(headOf(r), before, 'nothing committed');
    assert.deepEqual(ticketFiles(r), files, 'no file changed');
  } finally { await stop(p); }
});

test('0079 AC3: a priority outside 1 to 5 gets exactly speck set\'s message for that value, and nothing changes', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    // The panel takes the value from the URL as it is, without decoding it (0077), so %201 is the value it gets.
    for (const n of ['0', '6', '-1', '2.5', '01', '%201', '%31', 'one', '9999999999']) {
      const want = setRefusal(r, '0002-two.md', ['2', 'priority', n]);
      const before = headOf(r), files = ticketFiles(r);
      const res = await post(port, priorityPath('0002', n), { token });
      assert.equal(res.status, 422, `${JSON.stringify(n)}: ${res.body}`);
      assert.equal(JSON.parse(res.body).error, want, JSON.stringify(n));
      assert.equal(headOf(r), before, `${JSON.stringify(n)}: nothing committed`);
      assert.deepEqual(ticketFiles(r), files, `${JSON.stringify(n)}: no file changed`);
    }
  } finally { await stop(p); }
});

test('0079 AC4: the panel keeps its own rules, commit messages and responses', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    const before = headOf(r), files = ticketFiles(r);
    // Only drafts: 0001 is ready.
    const notDraft = await post(port, readyPath('0001'), { token });
    assert.equal(notDraft.status, 409);
    assert.equal(JSON.parse(notDraft.body).error, 'Ticket 0001 is "ready", not a draft, so it can\'t be set ready from here.');
    const notDraftP = await post(port, priorityPath('0001', 2), { token });
    assert.equal(notDraftP.status, 409);
    assert.equal(JSON.parse(notDraftP.body).error, 'Ticket 0001 is "ready", not a draft, so its priority can\'t be changed from here.');
    // The panel never clears a priority, though speck set can.
    const cleared = await post(port, priorityPath('0002', ''), { token });
    assert.equal(cleared.status, 422);
    assert.match(JSON.parse(cleared.body).error, /1 to 5/);
    // Only on the base branch.
    r.g('checkout', '-q', '-b', 'elsewhere');
    for (const pathName of [readyPath('0002'), priorityPath('0002', 1)]) {
      const res = await post(port, pathName, { token });
      assert.equal(res.status, 409, pathName);
      assert.equal(JSON.parse(res.body).error, 'This checkout is on "elsewhere", not main, so the ticket would be committed to the wrong branch. Switch to main, then try again.');
    }
    r.g('checkout', '-q', 'main');
    assert.equal(headOf(r), before, 'nothing committed');
    assert.deepEqual(ticketFiles(r), files, 'no file changed');
    // Only that ticket committed, with the same messages and responses.
    fs.writeFileSync(path.join(r.dir, 'other.txt'), 'other\n');
    const prio = await post(port, priorityPath('0002', 2), { token });
    assert.equal(prio.status, 200);
    assert.deepEqual(JSON.parse(prio.body), { ok: true, id: '0002' });
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0002): priority 2');
    assert.equal(r.g('show', '--name-only', '--format=', 'HEAD'), 'speck/tickets/0002-two.md');
    const ready = await post(port, readyPath('0002'), { token });
    assert.equal(ready.status, 200);
    assert.deepEqual(JSON.parse(ready.body), { ok: true, id: '0002' });
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0002): ready');
    assert.equal(r.g('show', '--name-only', '--format=', 'HEAD'), 'speck/tickets/0002-two.md');
    assert.equal(r.g('status', '--porcelain'), '?? other.txt', 'the other file is left alone');
  } finally { await stop(p); }
});

test('0079 AC5: after the panel\'s Ready, the ticket is byte for byte what speck set writes', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    const file = path.join(r.dir, 'speck', 'tickets', '0002-two.md'), original = fs.readFileSync(file, 'utf8');
    assert.equal(r.run('set', '2', 'status', 'ready').status, 0);
    const want = fs.readFileSync(file, 'utf8');
    assert.notEqual(want, original);
    fs.writeFileSync(file, original);
    const res = await post(port, readyPath('0002'), { token });
    assert.equal(res.status, 200, res.body);
    assert.equal(fs.readFileSync(file, 'utf8'), want);
  } finally { await stop(p); }
});

test('0079 AC5: after the panel\'s priority, the ticket is byte for byte what speck set writes', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    const file = path.join(r.dir, 'speck', 'tickets', '0002-two.md'), original = fs.readFileSync(file, 'utf8');
    for (const n of ['1', '5']) {
      fs.writeFileSync(file, original);
      assert.equal(r.run('set', '2', 'priority', n).status, 0);
      const want = fs.readFileSync(file, 'utf8');
      assert.notEqual(want, original);
      fs.writeFileSync(file, original);
      const res = await post(port, priorityPath('0002', n), { token });
      assert.equal(res.status, 200, res.body);
      assert.equal(fs.readFileSync(file, 'utf8'), want, n);
    }
  } finally { await stop(p); }
});

test('0079 AC4 (self-check): a draft filed in speck/tickets/done/ is refused, since speck set would move it', async () => {
  const { r, port, p, token } = await readyPanel();
  try {
    r.write('0003-three.md', fm({ id: '"0003"', title: 'Three' }), undefined, 'speck/tickets/done');
    const done = path.join(r.dir, 'speck', 'tickets', 'done', '0003-three.md'), text = fs.readFileSync(done, 'utf8');
    const before = headOf(r), files = ticketFiles(r);
    const res = await post(port, readyPath('0003'), { token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /speck\/tickets\/done\/.*speck set 0003 status ready/s);
    assert.equal(fs.readFileSync(done, 'utf8'), text, 'left where it was, unchanged');
    assert.equal(headOf(r), before, 'nothing committed');
    assert.deepEqual(ticketFiles(r), files, 'nothing added to speck/tickets/');
  } finally { await stop(p); }
});
