// 0192: speck ship tests the ticket merged with the base branch as it is now, and lands exactly what it tested.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { shipRepo, remoteMoves, runIn, CLI, env } from './support/ship.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');

// A ship whose test command is a script: each run logs one line with what it saw (shared.txt, other.txt and the tree
// it ran on), then runs `body`. On the ticket branch shared.txt holds "feature"; on main other.txt holds "base" until
// main moves on.
function scriptedShip(body = '', opts = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0192-')));
  const log = path.join(dir, 'ran.log'), script = path.join(dir, 'tests.sh');
  fs.writeFileSync(script, [
    `printf '%s|%s|%s\\n' "$(cat shared.txt)" "$(cat other.txt)" "$(git rev-parse 'HEAD^{tree}')" >> ${log}`,
    body,
  ].join('\n'));
  const r = shipRepo({ test: `sh ${script}`, ...opts });
  const ran = () => (fs.existsSync(log) ? read(dir, 'ran.log').trim().split('\n') : []).map(l => {
    const [shared, other, tree] = l.split('|');
    return { shared, other, tree };
  });
  return { ...r, ran };
}

// main moves on without touching the ticket's files.
const mainMoves = (r, content = 'moved\n') => {
  fs.writeFileSync(path.join(r.dir, 'other.txt'), content);
  r.g('commit', '-qam', 'main moves on');
};

// TAP output naming a failing test, then a failing exit, when the ticket's change and main's newer change are together.
const failsTogether = [
  'if grep -q feature shared.txt && grep -q moved other.txt; then',
  "  printf 'TAP version 13\\n# Subtest: widget adds up\\nnot ok 1 - widget adds up\\n  ---\\n  ...\\nok 2 - other thing\\n1..2\\n'",
  '  exit 1',
  'fi',
].join('\n');

test('0192 AC1: the tests run on the ticket merged with the base branch as it is now', () => {
  const r = scriptedShip();
  mainMoves(r);
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  const ran = r.ran();
  assert.equal(ran.length, 1, JSON.stringify(ran));
  assert.equal(ran[0].shared, 'feature', 'the ticket\'s change was there');
  assert.equal(ran[0].other, 'moved', 'and so was main\'s newer change');
});

test('0192 AC1: the commit that lands has exactly the files whose tests passed, but for the ticket\'s own status', () => {
  for (const worktree of [true, false]) {
    const r = scriptedShip('', { worktree });
    if (!worktree) r.g('checkout', '-q', 'main');
    mainMoves(r);
    if (!worktree) r.g('checkout', '-q', 'speck/0001-export-bookings');
    const res = runIn(r.dir, 'ship', '1');
    assert.equal(res.status, 0, res.stderr + res.stdout);
    const [{ tree }] = r.ran();
    const differ = r.g('diff', '--no-renames', '--name-only', tree, 'main^{tree}').split('\n').filter(Boolean);
    assert.deepEqual(differ.sort(), ['speck/tickets/0001-export-bookings.md', 'speck/tickets/done/0001-export-bookings.md'], `worktree ${worktree}`);
    assert.equal(r.g('show', 'main:other.txt'), 'moved');
    assert.equal(r.g('show', 'main:shared.txt'), 'feature');
  }
});

test('0192 AC1: after catching up with the remote, the tests run with the remote\'s new commits too', () => {
  const r = scriptedShip('test -f remote.txt');
  remoteMoves(r, 'remote.txt', 'from elsewhere\n');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.equal(r.g('show', 'main:remote.txt'), 'from elsewhere');
  const [{ tree }] = r.ran();
  const differ = r.g('diff', '--no-renames', '--name-only', tree, 'main^{tree}').split('\n').filter(Boolean);
  assert.ok(differ.every(f => f.startsWith('speck/tickets/')), differ.join(', '));
});

test('0192 AC1: if the base branch gets a commit while the tests run, the tests run again with it before shipping', () => {
  // The first run commits a new file to main, as you might while ship runs.
  const r = scriptedShip('cd "$MAIN" && if [ ! -e late.txt ]; then printf "late\\n" > late.txt && git add late.txt && git commit -qm late; fi');
  const out = spawnSync(process.execPath, [CLI, 'ship', '1'], { cwd: r.dir, encoding: 'utf8', env: { ...env, MAIN: r.dir } });
  assert.equal(out.status, 0, out.stderr + out.stdout);
  const ran = r.ran();
  assert.equal(ran.length, 2, 'the tests ran again');
  assert.equal(r.g('show', 'main:late.txt'), 'late', 'your commit is on main');
  const differ = r.g('diff', '--no-renames', '--name-only', ran[1].tree, 'main^{tree}').split('\n').filter(Boolean);
  assert.ok(differ.every(f => f.startsWith('speck/tickets/')), `what landed is what the second run tested: ${differ.join(', ')}`);
});

test('0192 AC2: when the ticket and main\'s newer changes fail together, nothing ships and it names the failing tests', () => {
  for (const worktree of [true, false]) {
    const r = scriptedShip(failsTogether, { worktree });
    if (!worktree) r.g('checkout', '-q', 'main');
    mainMoves(r);
    if (!worktree) r.g('checkout', '-q', 'speck/0001-export-bookings');
    const before = r.snapshot();
    const res = runIn(r.dir, 'ship', '1');
    assert.equal(res.status, 1, res.stderr + res.stdout);
    noTrace(res);
    assert.match(res.stderr, /Nothing was shipped|nothing was shipped/);
    assert.match(res.stderr, /fail together/);
    assert.match(res.stderr, /widget adds up/);
    assert.doesNotMatch(res.stderr, /other thing/, 'only the failing tests are named');
    assert.match(res.stderr, /main's own tests pass/);
    assert.deepEqual(r.snapshot(), before, `nothing changed, worktree ${worktree}`);
    assert.equal(r.statusIn(r.wt), 'approved');
    assert.equal(r.ran().length, 2, 'once merged, once on main alone');
  }
});

test('0192 AC2: the same ticket ships while main hasn\'t moved, as each passes on its own', () => {
  const r = scriptedShip(failsTogether);
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
});

test('0192 AC2: when the ticket alone fails, it still says the failure comes from the ticket\'s change', () => {
  const r = scriptedShip("printf 'TAP version 13\\nnot ok 1 - lonely test\\n1..1\\n'; grep -q base shared.txt");
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  assert.match(res.stderr, /comes from this ticket's change/);
  assert.match(res.stderr, /lonely test/);
  assert.doesNotMatch(res.stderr, /fail together/);
});

test('0192 AC3: when main has moved on and the merge is clean, it ships without another review round', () => {
  const r = scriptedShip();
  mainMoves(r);
  const rounds = read(r.wt, 'speck/tickets/0001-export-bookings.md').match(/^### Round/gm)?.length ?? 0;
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  assert.match(res.stdout, /Shipped 0001/);
  assert.equal(r.statusIn(r.dir), 'done');
  assert.equal((read(r.dir, 'speck/tickets/done/0001-export-bookings.md').match(/^### Round/gm)?.length ?? 0), rounds, 'no new review round');
  assert.equal(r.g('show', 'main:other.txt'), 'moved');
  assert.equal(r.g('show', 'main:shared.txt'), 'feature');
});

test('0192 AC4: when the merge has conflicts, it refuses with exit 13 and changes nothing', () => {
  for (const worktree of [true, false]) {
    const r = scriptedShip('', { worktree });
    if (!worktree) r.g('checkout', '-q', 'main');
    fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main side\n');
    r.g('commit', '-qam', 'main moves on');
    if (!worktree) r.g('checkout', '-q', 'speck/0001-export-bookings');
    const before = r.snapshot();
    const res = runIn(r.dir, 'ship', '1');
    assert.equal(res.status, 13, res.stderr + res.stdout);
    noTrace(res);
    assert.match(res.stderr, /hit a conflict/);
    assert.match(res.stderr, /shared\.txt/);
    assert.deepEqual(r.snapshot(), before, `worktree ${worktree}`);
    assert.equal(r.statusIn(r.wt), 'approved');
  }
});

test('0192 AC1 (self-check): if main gets a commit after the tests passed, what would land isn\'t what was tested, so nothing ships and the commit stays', () => {
  const r = scriptedShip();
  // Right after ship's own commit, someone commits to main.
  r.hook(`case "$(git log -1 --format=%s)" in *": ship") cd {main} && printf 'late\\n' > late.txt && git add late.txt && git commit -qm late ;; esac`);
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /didn't give what the tests ran on/);
  assert.match(res.stderr, /late\.txt/);
  assert.match(res.stderr, /nothing was shipped/);
  assert.equal(r.g('log', '-1', '--format=%s', 'main'), 'late', 'the late commit is still on main');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0192 AC1 (self-check): after catching up with the remote, a commit made on main while the tests run refuses the ship and stays', () => {
  const r = scriptedShip('cd "$MAIN" && if [ ! -e late.txt ]; then printf "late\\n" > late.txt && git add late.txt && git commit -qm late; fi');
  remoteMoves(r, 'remote.txt', 'from elsewhere\n');
  const res = spawnSync(process.execPath, [CLI, 'ship', '1'], { cwd: r.dir, encoding: 'utf8', env: { ...env, MAIN: r.dir } });
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /nothing was shipped/i);
  assert.equal(r.g('log', '-1', '--format=%s', 'main'), 'late', 'your commit is still on main');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0192 AC1 (review F1): a hook that changes code in ship\'s own commit is caught: nothing ships', () => {
  const r = scriptedShip();
  // While ship commits the ticket as done, a pre-commit hook stages a change to another file.
  r.hook('if git diff --cached --name-only | grep -q tickets/done/; then printf "hooked\\n" > notes.txt && git add notes.txt; fi', 'pre-commit');
  const before = r.sha('main');
  const res = runIn(r.dir, 'ship', '1');
  assert.equal(res.status, 1, res.stderr + res.stdout);
  noTrace(res);
  assert.match(res.stderr, /didn't give what the tests ran on/);
  assert.match(res.stderr, /notes\.txt/);
  assert.equal(r.sha('main'), before, 'main is unchanged');
  assert.equal(r.statusIn(r.wt), 'approved');
});

test('0192 AC2 (review F2): failing tests are named even when the output is over 1 MiB', () => {
  const r = scriptedShip([
    'if grep -q feature shared.txt && grep -q moved other.txt; then',
    "  printf 'TAP version 13\\nnot ok 1 - early failure\\n'",
    "  yes '# filler line for a long run' | head -c 1500000",
    "  printf 'ok 2 - late pass\\n1..2\\n'",
    '  exit 1',
    'fi',
  ].join('\n'));
  mainMoves(r);
  const res = spawnSync(process.execPath, [CLI, 'ship', '1'], { cwd: r.dir, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(res.status, 1, res.stderr.slice(0, 2000));
  assert.match(res.stderr, /fail together/);
  assert.match(res.stderr, /Failing tests: early failure\./);
});
