import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { gitEnv, ROOT } from './support/panel.mjs';
import { QUESTION, blockedRepo } from './support/blocked.mjs';
import { statusData, loadConfig, parseTicket } from '../scripts/speck.mjs';
import { questionFacts } from '../scripts/question-facts.mjs';
import { fixable } from '../scripts/foreman.mjs';
import { foremanFixQueue } from '../scripts/foreman-fix.mjs';
import { goWithQueue } from '../scripts/go-with.mjs';

Object.assign(process.env, gitEnv); // goWith commits in this process

const SPLIT = 'Split: keep the export, move the emails to a new ticket';
const SIZE = `The build is 1,400 lines against a limit of 1,000. Split it, or raise the limit?\n\nRecommended: ${SPLIT}\nChanges what you'd notice: yes\nClear winner: no\nSize guard: yes`;
const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const SCOPE = '## Problem\nBookings emails were left out.\n\n## Outcome\nBookings are emailed.\n\n## Acceptance criteria\n1. A booking is emailed.\n\n## Out of scope\n- Export.\n';

// A size-guard block as a worktree build leaves it: the main checkout on the base branch, the build's branch beside it.
function blockedInWorktree(question = SIZE) {
  const r = blockedRepo({ question });
  r.g('checkout', '-q', 'main');
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0563-'));
  fs.rmdirSync(wt);
  r.g('worktree', 'add', '-q', wt, 'speck/0001-export-bookings');
  const file = path.join(wt, path.relative(r.dir, r.file));
  return { ...r, wt, ticket: () => fs.readFileSync(file, 'utf8') };
}
function runCheck(r, fixing, { queue = null } = {}) {
  const said = [], started = [], running = new Set();
  const fixes = queue || foremanFixQueue({ repo: r.dir, readConfig: () => ({ ...loadConfig(r.dir), watch: fixing }), say: m => said.push(m) });
  const goWiths = goWithQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running,
    startBuild: (id, argv) => { started.push({ id, argv }); running.add(id); },
    saveRecord: (f, rec) => fs.writeFileSync(f, JSON.stringify(rec)), resumeHint: () => '', runs: () => r.runs });
  const tickets = statusData(r.wt || r.dir).tickets;
  fixes.check(tickets);
  goWiths.check(tickets);
  return { said, started, queue: fixes, tickets };
}
const scopeFile = (text = SCOPE) => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0563-')), 'scope.md');
  fs.writeFileSync(f, text);
  return f;
};
const chosen = r => { const out = runCheck(r, 'fix'); assert.equal(out.started.length, 1, out.said.join('\n')); return out; };
const spawnIn = (cwd, ...args) => spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'speck.mjs'), ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
const ticketsOnMain = r => r.g('ls-tree', '--name-only', 'main', 'speck/tickets/').split('\n').filter(Boolean);
const splitOffFile = r => ticketsOnMain(r).find(f => /\/0002-/.test(f));

test('0563 AC1: a size-guard block says so in a fourth fact, kept out of the question', () => {
  const f = questionFacts(SIZE.split('\n'));
  assert.equal(f.sizeGuard, true);
  assert.equal(f.recommendation, SPLIT);
  assert.ok(!f.question.includes('Size guard'));
  assert.equal(f.noticeable, true);
  assert.equal(f.clear, false);
});

test('0563 AC1: any other question has no size-guard fact, and one that can\'t be read stays in the question', () => {
  assert.equal(questionFacts(QUESTION.split('\n')).sizeGuard, undefined);
  assert.equal(questionFacts(['Size guard: no']).sizeGuard, false);
  const f = questionFacts(['Size guard: maybe', 'Size guard: constructor']);
  assert.equal(f.sizeGuard, undefined);
  assert.equal(f.question, 'Size guard: maybe\nSize guard: constructor');
});

test('0563 AC1: the board gives a size-guard block away from any other question', () => {
  const size = blockedRepo({ question: SIZE });
  assert.equal(statusData(size.dir).tickets.find(t => t.id === '0001').blocked_size_guard, true);
  const other = blockedRepo();
  assert.equal(statusData(other.dir).tickets.find(t => t.id === '0001').blocked_size_guard, undefined);
});

test('0563 AC2: watch: fix takes a size-guard split, notes that speck chose it and resumes the build', () => {
  const r = blockedInWorktree();
  const { started } = chosen(r);
  assert.match(r.ticket(), new RegExp(`Went with the recommendation: ${SPLIT} \\(chosen by speck, as watch is fix`));
  assert.match(r.ticket(), /^status: building/m);
  assert.equal(started[0].id, '0001');
  assert.ok(started[0].argv.join(' ').includes('speck split-off 0001'), 'the build is told how to make the split-off ticket');
});

test('0563 AC2: only once per ticket: a second size-guard block waits for you', () => {
  const r = blockedInWorktree();
  const first = chosen(r);
  fs.writeFileSync(path.join(r.wt, path.relative(r.dir, r.file)), r.ticket().replace(/^status: .*$/m, 'status: blocked'));
  r.g('-C', r.wt, 'commit', '-qam', 'blocked again');
  const rec = JSON.parse(fs.readFileSync(r.record, 'utf8'));
  delete rec.went_with; rec.exited = '2026-10-18T11:00:00.000Z'; rec.exit_code = 0;
  fs.writeFileSync(r.record, JSON.stringify(rec));
  const again = runCheck(r, 'fix', { queue: first.queue });
  assert.equal(again.started.length, 0);
  assert.match(r.ticket(), /^status: blocked/m);
});

test('0563 AC2: raising the limit is never taken, even when marked as changing nothing with a clear winner', () => {
  for (const rec of ['Raise the limit to 1,500', 'Split nothing, raise the limit', 'Keep it all and lift the limit']) {
    const question = `Split, or raise the limit?\n\nRecommended: ${rec}\nChanges what you'd notice: no\nClear winner: yes\nSize guard: yes`;
    const facts = questionFacts(question.split('\n'));
    assert.equal(fixable({ status: 'blocked', blocked_recommendation: facts.recommendation, blocked_noticeable: facts.noticeable, blocked_clear: facts.clear, blocked_size_guard: facts.sizeGuard }), false, rec);
  }
  const r = blockedInWorktree(`Split, or raise the limit?\n\nRecommended: Raise the limit to 1,500\nChanges what you'd notice: no\nClear winner: yes\nSize guard: yes`);
  const out = runCheck(r, 'fix');
  assert.equal(out.started.length, 0);
  assert.match(r.ticket(), /^status: blocked/m);
});

test('0563 AC2 F1: with worktrees off, the build in the main checkout gets its split taken and its new ticket on the base branch', () => {
  const r = blockedRepo({ question: SIZE }); // the build's branch is checked out in the main checkout
  const out = chosen(r);
  assert.equal(out.started[0].id, '0001');
  assert.match(r.ticket(), /^status: building/m);
  const made = spawnIn(r.dir, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`);
  assert.equal(made.status, 0, made.stderr);
  const t = parseTicket(r.g('show', `main:${splitOffFile(r)}`));
  assert.equal(t.fm.status, 'ready');
  assert.deepEqual(t.fm.after, ['0001']);
  assert.match(r.g('rev-parse', '--abbrev-ref', 'HEAD'), /^speck\/0001-/, 'the build stays on its own branch');
  assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets/'), '', 'nothing left over in the build\'s folder');
  assert.equal(r.g('worktree', 'list', '--porcelain').match(/^worktree /gm).length, 1, 'the short-lived checkout is gone');
});

test('0563 AC3: the split-off ticket is ready, runs after the original and holds the scope given up', () => {
  const r = blockedInWorktree();
  chosen(r);
  const made = spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`);
  assert.equal(made.status, 0, made.stderr);
  const file = splitOffFile(r);
  assert.ok(file, 'committed on the base branch');
  const t = parseTicket(r.g('show', `main:${file}`));
  assert.equal(t.fm.status, 'ready');
  assert.deepEqual(t.fm.after, ['0001']);
  assert.match(t.sections.problem.join('\n'), /Bookings emails were left out/);
  assert.match(t.sections.outcome.join('\n'), /Bookings are emailed/);
  assert.match(t.sections['acceptance criteria'].join('\n'), /A booking is emailed/);
  assert.match(t.sections['out of scope'].join('\n'), /Export/);
  assert.match(t.sections.notes.join('\n'), /Split off from ticket 0001/);
  assert.match(t.sections.notes.join('\n'), /size limit/);
});

test('0563 AC3: the split-off ticket keeps the original\'s risk, kind and priority', () => {
  const r = blockedInWorktree();
  const f = path.join(r.wt, path.relative(r.dir, r.file));
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^risk: .*$/m, 'risk: high').replace(/^priority: .*$/m, 'priority: 2'));
  r.g('-C', r.wt, 'commit', '-qam', 'high risk');
  chosen(r);
  assert.equal(spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`).status, 0);
  const t = parseTicket(r.g('show', `main:${splitOffFile(r)}`));
  assert.equal(t.fm.risk, 'high');
  assert.equal(t.fm.priority, 2);
});

test('0563 AC3: a split-off is made only after speck chose the split, and only once', () => {
  const r = blockedInWorktree();
  const early = spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`);
  assert.notEqual(early.status, 0);
  assert.match(early.stderr, /only .*speck chose/i);
  assert.equal(splitOffFile(r), undefined);
  chosen(r);
  assert.equal(spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`).status, 0);
  const twice = spawnIn(r.wt, 'split-off', '0001', 'Email again', `--from=${scopeFile()}`);
  assert.notEqual(twice.status, 0);
  assert.match(twice.stderr, /already/);
  assert.equal(ticketsOnMain(r).filter(f => /\/000[23]-/.test(f)).length, 1);
});

test('0563 AC3: a scope that\'s missing a section or fails lint makes no ticket, and says what to do', () => {
  const r = blockedInWorktree();
  chosen(r);
  const noFile = spawnIn(r.wt, 'split-off', '0001', 'Email bookings', '--from=/nowhere/scope.md');
  assert.notEqual(noFile.status, 0);
  assert.match(noFile.stderr, /scope/i);
  for (const text of ['## Problem\nOnly this.\n', SCOPE.replace('1. A booking is emailed.', '')]) {
    const out = spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile(text)}`);
    assert.notEqual(out.status, 0, text);
    assert.ok(!out.stderr.includes('    at '), out.stderr);
  }
  assert.equal(splitOffFile(r), undefined);
  assert.deepEqual(fs.readdirSync(path.join(r.dir, 'speck/tickets')).filter(f => /^0002/.test(f)), [], 'nothing left behind');
});

test('0563 AC4: with watch tell or off a size-guard block waits for you', () => {
  for (const fixing of ['tell', 'off']) {
    const r = blockedInWorktree();
    const out = runCheck(r, fixing);
    assert.equal(out.started.length, 0, fixing);
    assert.match(r.ticket(), /^status: blocked/m);
  }
});

test('0563 AC4: any other question is handled as before', () => {
  const t = { status: 'blocked', blocked_recommendation: 'A' };
  assert.equal(fixable({ ...t, blocked_noticeable: false, blocked_clear: true }), true);
  assert.equal(fixable({ ...t, blocked_noticeable: true, blocked_clear: true }), false);
  assert.equal(fixable({ ...t, blocked_noticeable: false, blocked_clear: false }), false);
  assert.equal(fixable({ ...t, blocked_recommendation: 'Split the file', blocked_noticeable: true, blocked_clear: false }), false, 'a split that isn\'t the size guard\'s');
  assert.equal(fixable({ ...t, blocked_recommendation: 'Split the file', blocked_noticeable: true, blocked_clear: false, blocked_size_guard: false }), false);
  const r = blockedRepo();
  const out = runCheck(r, 'fix');
  assert.equal(out.started.length, 1, out.said.join('\n'));
  assert.ok(!out.started[0].argv.join(' ').includes('split-off'));
});

test('0563 AC3 F1: a main checkout on some other branch still gets the ticket on the base branch', () => {
  const r = blockedInWorktree();
  chosen(r);
  r.g('checkout', '-q', '-b', 'elsewhere');
  const out = spawnIn(r.wt, 'split-off', '0001', 'Email bookings', `--from=${scopeFile()}`);
  assert.equal(out.status, 0, out.stderr);
  assert.ok(splitOffFile(r), 'on the base branch');
  assert.equal(r.g('rev-parse', '--abbrev-ref', 'HEAD'), 'elsewhere');
});

test('0563 self-check: names that are built in, and no arguments, are refused plainly', () => {
  const r = blockedInWorktree();
  chosen(r);
  for (const args of [['split-off'], ['split-off', '__proto__', 'A title', `--from=${scopeFile()}`], ['split-off', '0001', 'A title']]) {
    const out = spawnIn(r.wt, ...args);
    assert.notEqual(out.status, 0, args.join(' '));
    assert.ok(!out.stderr.includes('    at '), out.stderr);
  }
  assert.equal(splitOffFile(r), undefined);
});
