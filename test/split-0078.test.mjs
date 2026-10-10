import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, gitEnv } from './support/panel.mjs';

// ---------- 0078: finish splitting speck.mjs into modules under 600 lines ----------

const SCRIPTS = path.join(ROOT, 'scripts');
const read = name => fs.readFileSync(path.join(SCRIPTS, name), 'utf8');
const modules = () => fs.readdirSync(SCRIPTS).filter(f => f.endsWith('.mjs'));
const defines = (src, name) => new RegExp(`^(?:export )?(?:async )?function ${name}\\(`, 'm').test(src);
const lines = src => src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
const gitRoot = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });

// The commit this branch started from (or last merged). Until the split is on the base branch, it holds the
// single-file speck.mjs, so the CLI there is the "before" for AC4. Once it's merged, there's no "before" left.
const base = gitRoot('merge-base', 'main', 'HEAD').stdout.trim();
const splitMerged = !base || gitRoot('cat-file', '-e', `${base}:scripts/core.mjs`).status === 0;
const SKIP = splitMerged && 'the split is already on main, so there is no single-file speck.mjs to compare against';

const AREAS = {
  review: ['cmdReview', 'cmdRecord', 'cmdPrompt', 'cmdDiff', 'cmdNext', 'cmdClose', 'cmdReviewerSettings', 'reviewRound', 'runCodexReview', 'nextAction'],
  pack: ['reviewPack', 'cmdPack'],
  install: ['installTooling', 'doctorChecks', 'cmdInit', 'cmdDoctor'],
  ship: ['shipTicket', 'cmdShip', 'autoShipBlocker', 'shipChecks'],
};

test('0078 AC1: the review, review pack, install and doctor, and ship code live outside speck.mjs, which keeps the entry point', () => {
  const speck = read('speck.mjs');
  const others = modules().filter(f => f !== 'speck.mjs').map(f => [f, read(f)]);
  for (const [area, names] of Object.entries(AREAS)) {
    for (const name of names) {
      assert.ok(!defines(speck, name), `${name} (${area}) is not in speck.mjs`);
      const homes = others.filter(([, src]) => defines(src, name)).map(([f]) => f);
      assert.equal(homes.length, 1, `${name} (${area}) is defined in exactly one module, not ${JSON.stringify(homes)}`);
    }
  }
  assert.ok(/^const COMMANDS = /m.test(speck) && /process\.argv\[1\]/.test(speck), 'speck.mjs keeps the entry point');
});

test('0078 AC2: no file under scripts/ is over 600 lines', () => {
  const all = fs.readdirSync(SCRIPTS, { recursive: true }).filter(f => fs.statSync(path.join(SCRIPTS, f)).isFile());
  assert.ok(all.length > 3, 'the split added modules');
  for (const f of all) assert.ok(lines(read(f)) <= 600, `scripts/${f} has ${lines(read(f))} lines`);
});

const EXPORTS = ['TEMPLATES', 'SpeckError', 'sh', 'findRepoRoot', 'parseYaml', 'loadConfig', 'parseTicket', 'setField', 'reviewerSettings',
  'ticketHeader', 'syncHeader', 'findTicket', 'nextId', 'lintTicket', 'changedLines', 'stripRounds', 'ticketRounds', 'validateVerdict',
  'nextAction', 'splitCommand', 'commandArgs', 'verdictFromOutput', 'reviewPack', 'installTooling', 'doctorChecks', 'ticketedStatus',
  'checkSetValue', 'checkSetTicket', 'setTicketField', 'writeField', 'worktreeList', 'shipTicket', 'padId', 'readableLog', 'buildPaused',
  'statusData', 'replaceSection', 'pathsOutside', 'commitTicketOnly', 'panelServer'];

test('0078 AC3: every name speck.mjs exported before the split can still be imported from it', async () => {
  const m = await import('../scripts/speck.mjs');
  for (const name of EXPORTS) assert.notEqual(m[name], undefined, name);
  assert.equal(m.TEMPLATES, path.join(ROOT, 'templates'));
  assert.equal(new m.SpeckError('x').code, 1);
});

test('0078 AC3: the list above is every name speck.mjs exported before the split', { skip: SKIP }, () => {
  const before = gitRoot('show', `${base}:scripts/speck.mjs`).stdout;
  const names = [...before.matchAll(/^export (?:async )?(?:function|const|class|let) (\w+)/gm)].map(m => m[1]);
  for (const m of before.matchAll(/^export \{([^}]*)\}/gm)) names.push(...m[1].split(',').map(s => s.trim()).filter(Boolean));
  assert.deepEqual([...names].sort(), [...EXPORTS].sort());
});

// ---------- AC4: the same output and exit codes as the single-file CLI ----------

const DATES = { GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' };
const approve = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 'fine', escalation_question: '' };
const ticketBody = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n## Review log\n## Delivery log\n`;

// A fake codex on the PATH: `exec` writes a verdict asking for changes, anything else (doctor's checks) succeeds.
function fakeCodex() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
if (args[0] !== 'exec') process.exit(0);
fs.readFileSync(0, 'utf8');
fs.writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'fail', evidence: 'no' }], findings: [{ id: 'F1', severity: 'blocking', file: 'a.txt', line: 1, problem: 'Wrong.', fix: 'Fix it.', state: 'new' }], summary: 'not yet', escalation_question: '' }));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
`, { mode: 0o755 });
  return bin;
}

// A repo set up by `cli`, with ticket 0001 ready and a commit on its branch, and a fake codex on the PATH.
function fixture(cli, { worktrees = 'false' } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-')));
  const env = { ...process.env, ...gitEnv, ...DATES, PATH: `${fakeCodex()}${path.delimiter}${process.env.PATH}` };
  const run = (...a) => spawnSync(process.execPath, [cli, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"').replace(/^worktrees:.*$/m, `worktrees: ${worktrees}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + ticketBody);
  assert.equal(run('set', '1', 'status', 'ready').status, 0);
  g('add', '-A'); g('commit', '-qm', 'base');
  // The builder's files sit outside the repo, as they would in /tmp, so close and ship see a clean checkout.
  const files = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-files-'));
  fs.writeFileSync(path.join(files, 'approve.json'), JSON.stringify(approve));
  fs.writeFileSync(path.join(files, 'response.md'), 'Fixed F1.\n');
  fs.writeFileSync(path.join(files, 'tests.txt'), 'all pass\n');
  const at = name => path.join(files, name);
  return { dir, run, g, file, at };
}

// What each step printed, with what differs between any two runs (the folder, times, durations) written the same way.
function transcript(r, steps) {
  const tidy = s => s.replaceAll(r.dir, '<repo>').replaceAll(r.at(''), '<files>').replaceAll(fs.realpathSync(os.tmpdir()), '<tmp>')
    .replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z/g, '<time>')
    .replace(/\b\d+(\.\d+)?\s?(ms|s|sec|seconds?|min|minutes?|h|hours?)\b/g, '<dur>');
  return steps.map(step => {
    const args = typeof step === 'function' ? step(r) : step;
    if (!args) return null;
    const res = r.run(...args);
    return { args: tidy(args.join(' ')), status: res.status, stdout: tidy(res.stdout), stderr: tidy(res.stderr) };
  }).filter(Boolean).concat([{ ticket: tidy(fs.existsSync(r.file) ? fs.readFileSync(r.file, 'utf8') : '(moved)'), log: r.g('log', '--all', '--format=%s').stdout }]);
}

// Each command, with its errors as well as its usual output, through a whole build: start, review rounds, close, ship.
const STEPS = [
  [], ['help'], ['--help'], ['bogus'],
  ['lint', '1'], ['lint'], ['lint', '42'], ['status'], ['status', '--json'], ['diffstat'],
  ['set', '1', 'priority', '9'], ['set', '1', 'colour', 'red'], ['set'],
  ['new', 'Another thing'], ['cancel', '2', 'Not needed'], ['cancel', '2'],
  ['review'], ['record'], ['close'], ['ship'], ['diff'], ['pack', '42'], ['next', '1'], ['close', '1'],
  ['ship', '1'], ['ship', '1', '--auto'],
  ['start', '1'],
  r => { fs.writeFileSync(path.join(r.dir, 'a.txt'), 'change\n'); r.g('add', 'a.txt'); r.g('commit', '-qm', 'work'); return ['diffstat']; },
  ['next', '1'], r => ['prompt', '1', `--tests=${r.at('tests.txt')}`], ['diff', '1'], ['reviewer-settings', '1'],
  r => ['review', '1', `--tests=${r.at('tests.txt')}`], ['next', '1'], ['pack', '1'], ['status'],
  ['close', '1'], r => ['record', '1', r.at('approve.json')],
  r => ['record', '1', r.at('approve.json'), `--response=${r.at('response.md')}`, '--reviewer=claude-subagent'], ['next', '1'], ['diff', '1'], ['pack', '1'],
  r => { r.g('add', '-A'); r.g('commit', '-qm', 'rounds'); return ['close', '1']; },
  ['pack', '1'], ['ship', '1', '--auto'], ['status', '--json'], ['doctor'],
];

function beforeCli() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-before-'));
  const tar = spawnSync('git', ['archive', '--format=tar', base, 'scripts', 'templates', 'skills', 'package.json'], { cwd: ROOT, encoding: 'latin1' });
  assert.equal(tar.status, 0, tar.stderr);
  const x = spawnSync('tar', ['-x', '-C', dir], { input: Buffer.from(tar.stdout, 'latin1') });
  assert.equal(x.status, 0, String(x.stderr));
  return path.join(dir, 'scripts', 'speck.mjs');
}

test('0078 AC4: every CLI command gives the same output and exit code as before the split', { skip: SKIP }, () => {
  const old = beforeCli();
  for (const worktrees of ['false', 'true']) {
    const was = transcript(fixture(old, { worktrees }), STEPS);
    const now = transcript(fixture(CLI, { worktrees }), STEPS);
    assert.ok(was.some(s => s.status === 0) && was.some(s => s.status > 1), 'the steps include successes and refusals');
    for (let i = 0; i < was.length; i++) assert.deepEqual(now[i], was[i], `worktrees ${worktrees}, step ${i}: ${was[i].args ?? 'the ticket and the git log'}`);
  }
});

test('0078 AC4: no existing test changed', { skip: SKIP }, () => {
  const changed = gitRoot('diff', '--name-only', base, '--', 'test/').stdout.split('\n').filter(Boolean);
  const added = gitRoot('diff', '--name-only', '--diff-filter=A', base, '--', 'test/').stdout.split('\n').filter(Boolean);
  assert.deepEqual(changed.filter(f => !added.includes(f)), [], 'only new test files');
});

// ---------- AC5: an installed copy ----------

test('0078 AC5: a project set up with speck init runs review, record, pack, doctor and ship from .speck/scripts/speck.mjs', () => {
  const r = fixture(CLI);
  const installed = path.join(r.dir, '.speck', 'scripts', 'speck.mjs');
  assert.ok(!fs.lstatSync(path.join(r.dir, '.speck', 'scripts')).isSymbolicLink(), 'a copy, not a link');
  for (const f of modules()) assert.ok(fs.existsSync(path.join(r.dir, '.speck', 'scripts', f)), `.speck/scripts/${f}`);
  const env = { ...process.env, ...gitEnv, PATH: `${fakeCodex()}${path.delimiter}${process.env.PATH}` };
  const run = (...a) => spawnSync(process.execPath, [installed, ...a], { cwd: r.dir, encoding: 'utf8', env });
  r.g('checkout', '-qb', 'speck/0001-export-bookings');
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'change\n');
  r.g('add', 'a.txt'); r.g('commit', '-qm', 'work');
  const review = run('review', '1', `--tests=${r.at('tests.txt')}`);
  assert.equal(review.status, 10, review.stderr);
  assert.match(review.stdout, /changes_requested/);
  const record = run('record', '1', r.at('approve.json'), `--response=${r.at('response.md')}`, '--reviewer=claude-subagent');
  assert.equal(record.status, 0, record.stderr);
  assert.match(run('pack', '1').stdout, /Round 2/);
  const doctor = run('doctor');
  assert.match(doctor.stdout, /Checking what speck needs:/);
  r.g('add', '-A'); r.g('commit', '-qm', 'rounds');
  const close = run('close', '1');
  assert.equal(close.status, 0, close.stderr);
  const ship = run('ship', '1');
  assert.equal(ship.status, 0, ship.stderr);
  assert.match(r.g('log', '-1', '--format=%s', 'main').stdout, /^speck\(0001\)/);
});

test('0078 AC5: re-running speck init in that project still updates .speck/', () => {
  const r = fixture(CLI);
  const dir = path.join(r.dir, '.speck', 'scripts');
  const moved = modules().filter(f => !['speck.mjs', 'panel.mjs', 'run.mjs'].includes(f));
  assert.ok(moved.length, 'there are new modules');
  for (const f of moved) fs.writeFileSync(path.join(dir, f), '// stale\n');
  fs.rmSync(path.join(dir, moved[0]));
  const again = spawnSync(process.execPath, [path.join(dir, 'speck.mjs'), 'init', '--skip-checks'], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
  assert.notEqual(again.status, 0, 'the broken copy cannot run');
  const fixed = r.run('init', '--skip-checks');
  assert.equal(fixed.status, 0, fixed.stderr);
  assert.match(fixed.stdout, /updated \.speck\//);
  for (const f of modules()) assert.equal(fs.readFileSync(path.join(dir, f), 'utf8'), read(f), `.speck/scripts/${f} is up to date`);
  assert.equal(spawnSync(process.execPath, [path.join(dir, 'speck.mjs'), 'status'], { cwd: r.dir, encoding: 'utf8' }).status, 0, 'the updated copy runs');
});
