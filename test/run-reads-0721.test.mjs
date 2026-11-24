// 0721: speck run's checks don't re-read done tickets' build logs or re-run git for them, and read each spend file once.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runRepo, fm, good } from './support/run.mjs';
import { statusData } from '../scripts/speck.mjs';
import { WATCH_SPEND, DELEGATED_SPEND } from '../scripts/spend.mjs';

const ticketText = (id, o = {}, body = good) => `---\n${fm({ id: `"${id}"`, ...o })}\n---\n${body}`;

// A `git` on PATH that logs each call whose args name a ticket id, then runs the real git.
function countingGit(ids) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-git-0721-'));
  const real = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  const log = path.join(dir, 'calls');
  const needles = ids.map(id => String(id).padStart(4, '0'));
  fs.writeFileSync(path.join(dir, 'git'), `#!/bin/sh
log='${log}'
real='${real}'
for a in "$@"; do
  for id in ${needles.map(n => `'${n}'`).join(' ')}; do
    case "$a" in *"$id"*) echo "$id $*" >> "$log"; exec "$real" "$@"; esac
  done
done
exec "$real" "$@"
`, { mode: 0o755 });
  const calls = () => { try { return fs.readFileSync(log, 'utf8').split('\n').filter(Boolean); } catch { return []; } };
  return {
    env: { PATH: `${dir}${path.delimiter}${process.env.PATH}` },
    calls,
    forId: id => calls().filter(l => l.startsWith(String(id).padStart(4, '0') + ' ')),
    reset: () => fs.rmSync(log, { force: true }),
  };
}

// Counts opens/reads of done/cancelled tickets' build logs, and of the shared spend files, while `fn` runs.
function track(runs, closedIds, fn) {
  const logs = [], spend = [];
  const closed = new Set(closedIds.map(id => `${String(id).padStart(4, '0')}.log`));
  const realRead = fs.readFileSync, realOpen = fs.openSync, realReadSync = fs.readSync;
  const noteLog = (how, file) => {
    const base = path.basename(String(file));
    if (closed.has(base) && path.dirname(String(file)) === runs) logs.push({ how, file: base });
  };
  fs.readFileSync = function (file, ...rest) {
    const s = String(file);
    noteLog('readFile', s);
    if (s === path.join(runs, WATCH_SPEND) || s === path.join(runs, DELEGATED_SPEND)) spend.push(path.basename(s));
    return realRead.call(this, file, ...rest);
  };
  fs.openSync = function (file, ...rest) {
    noteLog('open', file);
    return realOpen.call(this, file, ...rest);
  };
  fs.readSync = function (fd, ...rest) {
    // logTail reads through an fd opened above; count those as a read when the open was noted.
    return realReadSync.call(this, fd, ...rest);
  };
  try { return { result: fn(), logs, spend }; }
  finally { fs.readFileSync = realRead; fs.openSync = realOpen; fs.readSync = realReadSync; }
}

function withRuns(dir, closed, { spend = true } = {}) {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const now = new Date().toISOString();
  for (const id of closed) {
    const pad = String(id).padStart(4, '0');
    fs.writeFileSync(path.join(runs, `${pad}.json`), `${JSON.stringify({
      id: pad, session: `s-${pad}`, cwd: dir, pid: 1, started: now, exited: now, exit_code: 0, agent: 'claude',
    })}\n`);
    fs.writeFileSync(path.join(runs, `${pad}.log`), `building ${pad}\n{"type":"assistant","message":{"content":[{"type":"text","text":"done"}]}}\n{"type":"result","result":"ok","total_cost_usd":0.01}\n`);
  }
  if (spend) {
    fs.writeFileSync(path.join(runs, WATCH_SPEND), `${JSON.stringify({ id: '0001', run: 'r1', ended: now, tokens: 11, cost_usd: 0.01 })}\n`);
    fs.writeFileSync(path.join(runs, DELEGATED_SPEND), `${JSON.stringify({ id: '0001', thread: 'th1', ended: now, tokens: 7, cost_usd: 0.02 })}\n`);
  }
  return runs;
}

// A done ticket whose Notes have a recent Foreman choice, so the board asks git whether its criteria changed.
const decidedNotes = `## Notes
- Went with the recommendation: leave it (chosen by speck, 2026-11-24 12:00 UTC).
`;

function closedRepo() {
  const { dir, g } = runRepo({
    tickets: [
      ['0001', { status: 'done' }],
      ['0002', { status: 'cancelled' }],
      ['0003', { status: 'draft' }],
    ],
  });
  const tickets = path.join(dir, 'speck', 'tickets');
  fs.mkdirSync(path.join(tickets, 'done'), { recursive: true });
  fs.writeFileSync(path.join(tickets, 'done', '0001-t.md'), ticketText('0001', { status: 'done' }, `${good}${decidedNotes}`));
  fs.writeFileSync(path.join(tickets, 'done', '0002-t.md'), ticketText('0002', { status: 'cancelled' }));
  fs.rmSync(path.join(tickets, '0001-t.md'), { force: true });
  fs.rmSync(path.join(tickets, '0002-t.md'), { force: true });
  g('add', '-A'); g('commit', '-qm', 'closed');
  // A start commit so shippedCriteriaChanged has something to look for.
  g('commit', '--allow-empty', '-qm', 'speck(0001): start');
  const runs = withRuns(dir, ['0001', '0002']);
  return { dir, runs, g };
}

test('0721 AC1: a second board check with nothing changed reads no done or cancelled ticket\'s build log and starts no git for them', () => {
  const { dir, runs } = closedRepo();
  const git = countingGit(['0001', '0002']);
  const prev = process.env.PATH;
  process.env.PATH = git.env.PATH;
  try {
    const first = track(runs, ['0001', '0002'], () => statusData(dir));
    assert.ok(first.logs.some(l => l.file === '0001.log'), 'the first check reads the done ticket\'s log');
    assert.ok(first.logs.some(l => l.file === '0002.log'), 'and the cancelled ticket\'s');
    assert.ok(git.forId('0001').length > 0, 'the first check asks git about the done ticket with a Foreman choice');
    git.reset();
    const second = track(runs, ['0001', '0002'], () => statusData(dir));
    assert.deepEqual(second.logs, [], 'nothing changed, so no done or cancelled log is read again');
    assert.deepEqual(git.forId('0001'), [], 'and no git for the done ticket');
    assert.deepEqual(git.forId('0002'), [], 'or the cancelled one');
    assert.deepEqual(
      second.result.tickets.map(t => [t.id, t.status, t.build_exit?.code, t.watch_tokens, t.delegated_tokens]),
      first.result.tickets.map(t => [t.id, t.status, t.build_exit?.code, t.watch_tokens, t.delegated_tokens]),
    );
  } finally { process.env.PATH = prev; }
});

test('0721 AC2: each spend record file is read at most once per check, however many tickets there are', () => {
  const { dir, runs } = closedRepo();
  // Several more closed tickets so a naive per-ticket read would show up.
  for (const id of ['0004', '0005', '0006']) {
    fs.writeFileSync(path.join(dir, 'speck', 'tickets', 'done', `${id}-t.md`), ticketText(id, { status: 'done' }));
    withRuns(dir, [id], { spend: false });
  }
  const r = track(runs, ['0001', '0002', '0004', '0005', '0006'], () => statusData(dir));
  const watch = r.spend.filter(f => f === WATCH_SPEND);
  const delegated = r.spend.filter(f => f === DELEGATED_SPEND);
  assert.equal(watch.length, 1, `watch spend read once, got ${watch.length}`);
  assert.equal(delegated.length, 1, `delegated spend read once, got ${delegated.length}`);
});

test('0721 AC3: when a ticket\'s build log or run record changes, the next check reads it again', () => {
  const { dir, runs } = closedRepo();
  statusData(dir);
  fs.writeFileSync(path.join(runs, '0001.log'), `changed\n{"type":"result","result":"ok"}\n`);
  let r = track(runs, ['0001', '0002'], () => statusData(dir));
  assert.ok(r.logs.some(l => l.file === '0001.log'), 'a changed log is read again');
  assert.ok(!r.logs.some(l => l.file === '0002.log'), 'an unchanged cancelled ticket\'s log is not');
  fs.writeFileSync(path.join(runs, '0002.json'), `${JSON.stringify({
    id: '0002', session: 's2', cwd: dir, pid: 2, started: new Date().toISOString(), exited: new Date().toISOString(), exit_code: 1,
  })}\n`);
  r = track(runs, ['0001', '0002'], () => statusData(dir));
  assert.ok(r.logs.some(l => l.file === '0002.log'), 'a changed run record brings its log back in');
  assert.equal(r.result.tickets.find(t => t.id === '0002').build_exit?.code, 1);
});

test('0721 AC4: speck status --json gives the same board for the same repo before and after caching kicks in', () => {
  const { dir } = closedRepo();
  const a = statusData(dir);
  const b = statusData(dir);
  // Drop fields that are allowed to differ only by object identity; compare the JSON contract.
  assert.equal(JSON.stringify(b), JSON.stringify(a));
});

test('0721 AC4 (round 1 F1): a warmed board still takes up a change to shared spend or to the settings', () => {
  const { dir, runs, g } = closedRepo();
  // Leave the done ticket's reviewer blank so the board takes it from the settings.
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', 'done', '0001-t.md'),
    ticketText('0001', { status: 'done', reviewer: '""' }, `${good}${decidedNotes}`));
  statusData(dir);
  const now = new Date().toISOString();
  fs.appendFileSync(path.join(runs, WATCH_SPEND), `${JSON.stringify({ id: '0001', run: 'r2', ended: now, tokens: 100, cost_usd: 0.5 })}\n`);
  let board = statusData(dir);
  assert.equal(board.tickets.find(t => t.id === '0001').watch_tokens, 111, 'watch spend is re-read when the file changes');
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^reviewer:.*$/m, 'reviewer: claude'));
  g('add', '-A'); g('commit', '-qm', 'reviewer');
  board = statusData(dir);
  assert.equal(board.tickets.find(t => t.id === '0001').reviewer, 'claude', 'settings still shape a done ticket\'s board entry');
});

test('0721 AC4 (round 1 F2): recent_spend follows the current seven-day window, not a frozen cached entry', () => {
  const { dir, runs } = closedRepo();
  const old = new Date(Date.now() - 8 * 864e5).toISOString();
  fs.writeFileSync(path.join(runs, WATCH_SPEND), `${JSON.stringify({ id: '0001', run: 'old', ended: old, tokens: 9, cost_usd: 0.09 })}\n`);
  const first = statusData(dir);
  assert.ok(!(first.tickets.find(t => t.id === '0001').recent_spend || []).some(p => p.part === 'watch' && p.tokens === 9),
    'spend older than seven days is not recent');
  const fresh = new Date().toISOString();
  fs.writeFileSync(path.join(runs, WATCH_SPEND), `${JSON.stringify({ id: '0001', run: 'new', ended: fresh, tokens: 9, cost_usd: 0.09 })}\n`);
  const second = statusData(dir);
  assert.ok((second.tickets.find(t => t.id === '0001').recent_spend || []).some(p => p.part === 'watch' && p.tokens === 9),
    'the same tokens are recent once their ended time is inside the window');
});
