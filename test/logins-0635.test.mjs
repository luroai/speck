// 0635: test logins kept on this machine only, where speck's agents can read them, and never committed.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loginsFile, saveLogin, savedLogins, loginPasswords } from '../scripts/logins.mjs';
import { privateLinesInSpeck, privateWordList, privateSaid } from '../scripts/private-words.mjs';
import { messagePrivateLines, stagedPrivateLines } from '../scripts/commit-check.mjs';
import { commitFile, hookedRepo } from './support/commit-check.mjs';
import { commandRepo, approveVerdict, gitEnv } from './support/speck.mjs';
import { ticketRounds } from '../scripts/core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const PASS = 'Pw-0635-Kx9q';
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } });

// A git repo with speck/config.yml committed, speck/.cache/ ignored, and a worktree of it.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-logins-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\ncommands:\n  test: npm test\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'init');
  const wt = path.join(dir + '.worktrees', 'side');
  git(dir, 'worktree', 'add', '-q', '-b', 'side', wt);
  return { dir, wt };
}

// `speck logins ...` as a process of its own, with `input` on its input (a pipe, not a terminal).
const logins = (cwd, input, ...args) => spawnSync(process.execPath, [CLI, 'logins', ...args], { cwd, input, encoding: 'utf8' });
const mode = file => fs.statSync(file).mode & 0o777;

test('0635 AC1: logins set reads the username and password from a pipe and saves them in an ignored file only its owner can read', () => {
  const r = repo();
  const set = logins(r.wt, `ann@example.com\n${PASS}\n`, 'set', 'admin');
  assert.equal(set.status, 0, set.stderr);
  assert.doesNotMatch(set.stdout + set.stderr, new RegExp(PASS));
  const file = loginsFile(r.wt);
  assert.equal(file, path.join(r.dir, 'speck', '.cache', 'machine', 'logins.json'));
  assert.equal(mode(file), 0o600);
  assert.equal(git(r.dir, 'check-ignore', '-q', file).status, 0, 'git ignores the logins file');
  assert.deepEqual(savedLogins(r.dir).admin, { username: 'ann@example.com', password: PASS });
  assert.equal(git(r.dir, 'status', '--porcelain').stdout, '', 'nothing for git to commit');
});

test('0635 AC1: logins set refuses a password on the command line, without echoing it or saving anything', () => {
  const r = repo();
  for (const extra of [['ann', PASS], [`--password=${PASS}`]]) {
    const set = logins(r.dir, `ann\n${PASS}\n`, 'set', 'admin', ...extra);
    assert.notEqual(set.status, 0);
    assert.match(set.stderr, /never the command line/);
    assert.doesNotMatch(set.stdout + set.stderr, new RegExp(PASS));
  }
  assert.equal(fs.existsSync(loginsFile(r.dir)), false);
});

test('0635 AC1: logins set refuses a missing username or password, or a name it can\'t keep', () => {
  const r = repo();
  for (const input of ['', 'ann\n', '\nsecret\n', 'ann\n\n']) {
    const set = logins(r.dir, input, 'set', 'admin');
    assert.notEqual(set.status, 0, JSON.stringify(input));
    assert.match(set.stderr, /nothing was saved/i);
  }
  for (const name of ['__proto__', 'a b', '-x']) {
    const set = logins(r.dir, `ann\n${PASS}\n`, 'set', name);
    assert.notEqual(set.status, 0, name);
  }
  assert.equal(fs.existsSync(loginsFile(r.dir)), false);
});

test('0635 AC1: a logins file someone else can read is made the owner\'s only again', () => {
  const r = repo();
  saveLogin(r.dir, 'admin', 'ann', PASS);
  fs.chmodSync(loginsFile(r.dir), 0o644);
  assert.equal(savedLogins(r.dir).admin.password, PASS);
  assert.equal(mode(loginsFile(r.dir)), 0o600);
});

test('0635 AC2: logins lists names and usernames only, show prints one, remove deletes one, and an unknown name lists the known ones', () => {
  const r = repo();
  assert.equal(logins(r.dir, `ann@example.com\n${PASS}\n`, 'set', 'admin').status, 0);
  assert.equal(logins(r.dir, 'bob\nother-Pw-2\n', 'set', 'viewer').status, 0);
  const list = logins(r.wt, '');
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /admin: ann@example\.com/);
  assert.match(list.stdout, /viewer: bob/);
  assert.doesNotMatch(list.stdout, new RegExp(`${PASS}|other-Pw-2`));
  const show = logins(r.wt, '', 'show', 'admin');
  assert.equal(show.status, 0, show.stderr);
  assert.match(show.stdout, /ann@example\.com/);
  assert.match(show.stdout, new RegExp(PASS));
  for (const sub of ['show', 'remove']) {
    const bad = logins(r.dir, '', sub, 'nobody');
    assert.notEqual(bad.status, 0);
    assert.match(bad.stderr, /nobody/);
    assert.match(bad.stderr, /admin, viewer/);
  }
  const rm = logins(r.dir, '', 'remove', 'admin');
  assert.equal(rm.status, 0, rm.stderr);
  assert.deepEqual(Object.keys(savedLogins(r.dir)), ['viewer']);
  assert.equal(logins(r.dir, '', 'remove', 'viewer').status, 0);
  assert.equal(fs.existsSync(loginsFile(r.dir)), false, 'the last one removed removes the file');
});

test('0635 AC3: a saved password counts as a private word in the commit check, naming the file and line without it', () => {
  const r = hookedRepo('');
  saveLogin(r.dir, 'admin', 'ann', PASS);
  const c = commitFile(r, 'speck/ideas/note.md', `one\nlog in with ${PASS.toLowerCase()}\n`);
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /speck\/ideas\/note\.md line 2: a saved test login's password/);
  assert.doesNotMatch(c.stderr, new RegExp(PASS, 'i'));
  r.g('reset', '-q');
  assert.equal(commitFile(r, 'speck/ideas/note.md', 'clean\n').status, 0);
  const msg = path.join(r.dir, 'msg.txt');
  fs.writeFileSync(msg, `fix\nused ${PASS}\n`);
  assert.deepEqual(messagePrivateLines(msg, r.dir), [{ line: 2, what: 'login' }]);
});

test('0635 AC3: a commit in a worktree reads the main checkout\'s logins', () => {
  const r = hookedRepo('');
  saveLogin(r.dir, 'admin', 'ann', PASS);
  const wt = path.join(r.dir + '.worktrees', 'side');
  r.g('worktree', 'add', '-q', '-b', 'side', wt);
  fs.mkdirSync(path.join(wt, 'speck'), { recursive: true });
  fs.writeFileSync(path.join(wt, 'speck', 'a.md'), `${PASS}\n`);
  git(wt, 'add', 'speck/a.md');
  assert.deepEqual(stagedPrivateLines(wt), [{ file: 'speck/a.md', line: 1, what: 'login' }]);
});

test('0635 AC3: speck ship\'s check finds a saved password under speck/, and its message doesn\'t repeat it', () => {
  const r = repo();
  saveLogin(r.dir, 'admin', 'ann', PASS);
  fs.mkdirSync(path.join(r.wt, 'speck', 'ideas'), { recursive: true });
  fs.writeFileSync(path.join(r.wt, 'speck', 'ideas', 'x.md'), `a\nthe password is ${PASS}\n`);
  git(r.wt, 'add', 'speck/ideas/x.md');
  git(r.wt, 'commit', '-q', '--no-verify', '-m', 'x');
  assert.deepEqual(privateLinesInSpeck(r.dir, 'main', 'side'), [{ file: 'speck/ideas/x.md', line: 2, what: 'login' }]);
  assert.equal(privateSaid('login'), "a saved test login's password (from speck logins)");
  assert.doesNotMatch(privateSaid('login'), new RegExp(PASS));
});

test('0635 AC3: privateWordList with a repo gives the saved passwords as logins, lower-cased', () => {
  const r = repo();
  assert.deepEqual(privateWordList(r.dir).logins, []);
  saveLogin(r.dir, 'admin', 'ann', PASS);
  assert.deepEqual(privateWordList(r.wt).logins, [PASS.toLowerCase()]);
  assert.deepEqual(loginPasswords(r.wt), [PASS.toLowerCase()]);
});

test('0635 AC4: a review round speck saves has each saved password replaced by [private]', () => {
  const r = commandRepo();
  saveLogin(r.dir, 'admin', 'ann', PASS);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0635-home-'));
  const said = path.join(home, 'response.md');
  fs.writeFileSync(said, `Signed in with ${PASS}.\n`);
  const v = { ...approveVerdict, summary: `Logged in as ann with ${PASS.toUpperCase()}.` };
  const out = r.runEnv({ HOME: home, FAKE_VERDICT: JSON.stringify(v) }, 'review', '1', `--response=${said}`);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  const last = ticketRounds(fs.readFileSync(r.ticketFile, 'utf8')).rounds.at(-1);
  assert.equal(last.verdict.summary, 'Logged in as ann with [private].');
  assert.match(last.meta.builder_response, /Signed in with \[private\]\./);
  assert.doesNotMatch(fs.readFileSync(r.ticketFile, 'utf8'), new RegExp(PASS, 'i'));
});

test('0635 AC5: with no logins saved, speck logins says so in one line and makes nothing', () => {
  const r = repo();
  const list = logins(r.wt, '');
  assert.equal(list.status, 0, list.stderr);
  assert.equal(list.stdout.trim().split('\n').length, 1);
  assert.match(list.stdout, /No test logins/);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', '.cache')), false, 'no folder made');
  assert.equal(git(r.dir, 'status', '--porcelain').stdout, '');
});

test('0635 AC1 AC2: the brief and speck help name the logins commands and the file', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(brief, /^\| `speck logins` \|/m);
  for (const fact of ['`speck logins set <name>`', '`speck logins show <name>`', '`speck logins remove <name>`', '`speck/.cache/machine/logins.json`'])
    assert.ok(brief.includes(fact), fact);
  const help = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
  assert.match(help.stdout + help.stderr, /speck logins \[set\|show\|remove <name>\]/);
});

test('0635 AC3 F1: a saved password holding [private] is still refused by the commit and ship checks, without being shown', () => {
  const odd = 'abc[private]def';
  const r = hookedRepo('');
  saveLogin(r.dir, 'admin', 'ann', odd);
  const c = commitFile(r, 'speck/ideas/note.md', `password ${odd}\n`);
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /speck\/ideas\/note\.md line 1: a saved test login's password/);
  assert.ok(!c.stderr.includes(odd));
  const s = repo();
  saveLogin(s.dir, 'admin', 'ann', odd);
  fs.mkdirSync(path.join(s.wt, 'speck'), { recursive: true });
  fs.writeFileSync(path.join(s.wt, 'speck', 'x.md'), `password ${odd.toUpperCase()}\n`);
  git(s.wt, 'add', 'speck/x.md');
  git(s.wt, 'commit', '-q', '--no-verify', '-m', 'x');
  assert.deepEqual(privateLinesInSpeck(s.dir, 'main', 'side'), [{ file: 'speck/x.md', line: 1, what: 'login' }]);
});
