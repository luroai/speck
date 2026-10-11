import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { shipRepo, CLI, env, gIn, runIn } from './support/ship.mjs';

// ---------- 0115: speck ship waits for staged changes in the base checkout to clear ----------
// The ticket changes shared.txt. Staging other.txt in the base checkout is all that stops the merge.

const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const shipped = r => { assert.equal(r.statusIn(r.dir), 'done'); assert.equal(read(r.dir, 'shared.txt'), 'feature\n'); };
const delay = ms => new Promise(res => setTimeout(res, ms));

// Starts `speck ship 1` without waiting for it, so the test can act while it waits. SPECK_SHIP_MINUTE_MS shortens a minute.
function shipAsync(r, extra = {}) {
  const child = spawn(process.execPath, [CLI, 'ship', '1'], { cwd: r.dir, env: { ...env, ...extra } });
  const out = { stdout: '', stderr: '' };
  child.stdout.on('data', d => { out.stdout += d; });
  child.stderr.on('data', d => { out.stderr += d; });
  const done = new Promise(res => child.on('close', status => res({ status, ...out })));
  const waitFor = async (re, ms = 20000) => {
    for (const end = Date.now() + ms; Date.now() < end; await delay(50)) if (re.test(out.stdout)) return;
    child.kill();
    assert.fail(`Never printed ${re}. stdout: ${out.stdout}\nstderr: ${out.stderr}`);
  };
  return { child, out, done, waitFor };
}

const setWait = (r, line) => {
  const file = path.join(r.dir, 'speck', 'config.yml');
  const text = fs.readFileSync(file, 'utf8').replace(/^ship_wait_minutes:.*\n/m, '');
  fs.writeFileSync(file, line ? `${text}${line}\n` : text);
  r.g('add', 'speck/config.yml'); r.g('commit', '-qm', 'wait');
};

test('AC1: ship says once which files are staged, waits, and ships soon after they are committed', async () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const s = shipAsync(r);
  await s.waitFor(/waiting/i);
  assert.match(s.out.stdout, /other\.txt/);
  assert.match(s.out.stdout, /committed or unstaged/);
  await delay(300);
  r.g('commit', '-qm', 'mine');
  const committed = Date.now();
  const res = await s.done;
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.ok(Date.now() - committed < 10500, 'checks again at least every 10 seconds');
  assert.equal(res.stdout.match(/waiting/gi).length, 1, 'says it once');
  shipped(r);
  assert.equal(gIn(r.dir, 'show', 'main:other.txt').stdout, 'mine\n', 'the commit made while it waited is kept');
});

test('AC1: ship ships once staged changes are unstaged, keeping the edit uncommitted', async () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  r.g('reset', '-q', '--', 'other.txt');
  const res = await s.done;
  assert.equal(res.status, 0, res.stderr + res.stdout);
  shipped(r);
  assert.equal(read(r.dir, 'other.txt'), 'mine\n');
  assert.equal(gIn(r.dir, 'status', '--porcelain', '--untracked-files=no').stdout, ' M other.txt\n');
});

test('AC1: staged changes made while the tests run are waited for too, and the commit that clears them is kept', async () => {
  const r = shipRepo({ test: 'cd {main} && printf "mine\\n" > other.txt && git add other.txt' });
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  assert.match(s.out.stdout, /other\.txt/);
  r.g('commit', '-qm', 'mine');
  const res = await s.done;
  assert.equal(res.status, 0, res.stderr + res.stdout);
  shipped(r);
  assert.equal(gIn(r.dir, 'show', 'main:other.txt').stdout, 'mine\n');
});

test('AC2: after ship_wait_minutes it refuses as before, changing nothing', async () => {
  const r = shipRepo();
  setWait(r, 'ship_wait_minutes: 2');
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const before = r.snapshot();
  const started = Date.now();
  const res = await shipAsync(r, { SPECK_SHIP_MINUTE_MS: '500', SPECK_SHIP_POLL_MS: '100' }).done;
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.ok(Date.now() - started >= 1000, 'waited the 2 (shortened) minutes');
  assert.match(res.stdout, /2 minutes/);
  assert.match(res.stderr, /other\.txt \(staged\)/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('AC2: ship_wait_minutes defaults to 30 and is in the config template', async () => {
  const r = shipRepo();
  assert.match(read(r.dir, 'speck/config.yml'), /^ship_wait_minutes: 30\b/m);
  setWait(r, '');
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const s = shipAsync(r);
  await s.waitFor(/waiting/i);
  assert.match(s.out.stdout, /30 minutes/);
  s.child.kill();
  await s.done;
});

test('AC2: speck config set accepts ship_wait_minutes as a whole number of at least 1', () => {
  const r = shipRepo();
  for (const bad of ['0', '-1', '1.5', 'soon']) {
    const res = r.run('config', 'set', 'ship_wait_minutes', bad);
    assert.equal(res.status, 1, bad);
    assert.match(res.stderr, /ship_wait_minutes must be a whole number of 1 or more/);
  }
  const ok = r.run('config', 'set', 'ship_wait_minutes', '5');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(read(r.dir, 'speck/config.yml'), /^ship_wait_minutes: 5\b/m);
});

test('AC2: a bad ship_wait_minutes in the config refuses with a plain message, changing nothing', () => {
  const r = shipRepo();
  setWait(r, 'ship_wait_minutes: 0');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /ship_wait_minutes in speck\/config\.yml must be a whole number of 1 or more/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.deepEqual(r.snapshot(), before);
});

test('AC3: a staged change to a file the ticket changes still refuses at once', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'mine\n');
  r.g('add', 'shared.txt');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.doesNotMatch(res.stdout, /waiting/i);
  assert.match(res.stderr, /shared\.txt/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
});

test('AC3: staged files alongside an edit to a file the ticket changes refuse at once', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'mine\n');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.doesNotMatch(res.stdout, /waiting/i);
  assert.match(res.stderr, /shared\.txt \(the ticket changes it too\)/);
  assert.deepEqual(r.snapshot(), before);
});

test('AC3: an edit to a file the ticket changes, made while ship waits, refuses at once', async () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'mine\n');
  const res = await s.done;
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /shared\.txt \(the ticket changes it too\)/);
  assert.equal(read(r.dir, 'shared.txt'), 'mine\n');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('AC4: while it waits, ship changes nothing in either checkout, not even the index files', async () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const indexes = () => [path.join(r.dir, '.git', 'index'), path.join(r.dir, '.git', 'worktrees', 'wt', 'index')]
    .map(f => [fs.readFileSync(f).toString('hex'), fs.statSync(f).mtimeMs]);
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  const before = r.snapshot(), index = indexes();
  await delay(1000);
  assert.deepEqual(indexes(), index);
  assert.deepEqual(r.snapshot(), before);
  assert.ok(!fs.existsSync(path.join(r.dir, '.git', 'index.lock')));
  s.child.kill();
  await s.done;
});

test('AC1: a commit made on the base branch while ship waited is kept if the merge then fails', async () => {
  const r = shipRepo({ test: 'cd {main} && printf "mine\\n" > other.txt && git add other.txt' });
  // Right after ship's own commit, an edit to shared.txt in the base checkout makes the merge refuse.
  r.hook(`case "$(git log -1 --format=%s)" in *": ship") printf 'late\\n' > {main}/shared.txt ;; esac`);
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  r.g('commit', '-qm', 'mine');
  const mine = r.sha('main');
  const res = await s.done;
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.equal(r.sha('main'), mine, 'your commit is still on main');
  assert.equal(read(r.dir, 'shared.txt'), 'late\n');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('AC3: a staged rename of a file the ticket changes refuses at once (review F1)', () => {
  const r = shipRepo();
  r.g('mv', 'shared.txt', 'renamed.txt');
  const before = r.snapshot();
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.doesNotMatch(res.stdout, /waiting/i);
  assert.match(res.stderr, /shared\.txt -> renamed\.txt/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
});

test('AC1: one ship says it is waiting only once, even when the tests stage more after an earlier wait (review F2)', async () => {
  const r = shipRepo({ test: 'cd {main} && printf "mine\\n" > notes.txt && git add notes.txt' });
  fs.writeFileSync(path.join(r.dir, 'other.txt'), 'mine\n');
  r.g('add', 'other.txt');
  const s = shipAsync(r, { SPECK_SHIP_POLL_MS: '100' });
  await s.waitFor(/waiting/i);
  r.g('commit', '-qm', 'other');
  // The tests then stage notes.txt: commit it once it's there.
  for (const end = Date.now() + 20000; !r.g('diff', '--cached', '--name-only').includes('notes.txt'); await delay(50))
    assert.ok(Date.now() < end, `notes.txt never staged. stdout: ${s.out.stdout}`);
  r.g('commit', '-qm', 'notes');
  const res = await s.done;
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(res.stdout.match(/waiting/gi).length, 1, res.stdout);
  shipped(r);
  assert.equal(gIn(r.dir, 'show', 'main:notes.txt').stdout, 'mine\n');
});

test('AC3: a staged change to a file with a non-ASCII name the ticket changes refuses at once (review round 2 F1)', () => {
  const r = shipRepo();
  fs.writeFileSync(path.join(r.wt, 'café.txt'), 'feature\n');
  gIn(r.wt, 'add', 'café.txt'); gIn(r.wt, 'commit', '-qm', 'café');
  fs.writeFileSync(path.join(r.dir, 'café.txt'), 'mine\n');
  r.g('add', 'café.txt');
  const before = r.snapshot();
  const res = spawnSync(process.execPath, [CLI, 'ship', '1'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_SHIP_MINUTE_MS: '20' } });
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.doesNotMatch(res.stdout, /waiting/i);
  assert.match(res.stderr, /café\.txt \(staged\)/);
  assert.match(res.stderr, /Nothing was shipped/);
  assert.deepEqual(r.snapshot(), before);
});
