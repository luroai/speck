import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './support/cli.mjs';
import { PROVIDERS, findProvider } from '../scripts/providers.mjs';
import { keysFile, keysStatus, providerKey, removeProviderKey, saveProviderKey } from '../scripts/keys.mjs';

// ---------- 0389: a model provider's API key, kept for this machine ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const KEY = 'sk-0389-secret-Zq7xW';
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

// A git repo with speck/config.yml committed, speck/.cache/ ignored, and a worktree of it.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keys-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\ncommands:\n  test: npm test\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  git(dir, 'add', '.');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  const wt = path.join(dir + '.worktrees', 'side');
  git(dir, 'worktree', 'add', '-q', '-b', 'side', wt);
  return { dir, wt };
}

// `speck keys ...` as a process of its own, with `input` on its input (a pipe, not a terminal).
const keys = (cwd, input, ...args) => spawnSync(process.execPath, [CLI, 'keys', ...args], { cwd, input, encoding: 'utf8' });
const mode = file => fs.statSync(file).mode & 0o777;

// Every file under `dir`, but the keys file itself.
function filesUnder(dir, skip) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p, skip));
    else if (e.isFile() && p !== skip) out.push(p);
  }
  return out;
}

test('0389 AC1: keys set reads the key from a pipe and saves it in an ignored file only its owner can read; remove deletes it', () => {
  const r = repo();
  const set = keys(r.wt, `${KEY}\n`, 'set', 'deepseek');
  assert.equal(set.status, 0, set.stderr);
  const file = keysFile(r.wt);
  assert.equal(file, path.join(r.dir, 'speck', '.cache', 'machine', 'keys.json'));
  assert.equal(mode(file), 0o600);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.equal(git(r.dir, 'check-ignore', '-q', file).status, 0, 'git ignores the keys file');
  const remove = keys(r.dir, '', 'remove', 'deepseek');
  assert.equal(remove.status, 0, remove.stderr);
  assert.match(remove.stdout, /Removed the DeepSeek API key/);
  assert.equal(providerKey(r.dir, 'deepseek'), null);
  assert.equal(fs.existsSync(file), false);
  assert.match(keys(r.dir, '', 'remove', 'deepseek').stdout, /no DeepSeek API key/);
});

test('0389 AC1: a key on the command line is refused, without showing it, and nothing is saved', () => {
  const r = repo();
  const res = keys(r.dir, '', 'set', 'deepseek', KEY);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /never the command line/);
  assert.ok(!(res.stdout + res.stderr).includes(KEY));
  assert.equal(fs.existsSync(keysFile(r.dir)), false);
});

test('0389 AC1: an unknown provider is refused, naming the ones speck knows, including built-in names', () => {
  const r = repo();
  for (const name of ['openai', 'constructor', '__proto__']) {
    const res = keys(r.dir, `${KEY}\n`, 'set', name);
    assert.notEqual(res.status, 0, name);
    assert.match(res.stderr, new RegExp(`doesn't know a model provider called "${name}". It knows: deepseek`));
    assert.equal(fs.existsSync(keysFile(r.dir)), false);
    assert.match(keys(r.dir, '', 'remove', name).stderr, /It knows: deepseek/);
  }
});

test('0389 AC1: a blank key or one with spaces is refused without showing it', () => {
  const r = repo();
  assert.match(keys(r.dir, '\n', 'set', 'deepseek').stderr, /No key was given/);
  const spaced = keys(r.dir, 'sk-a b-secret\n', 'set', 'deepseek');
  assert.notEqual(spaced.status, 0);
  assert.ok(!spaced.stderr.includes('secret'));
  assert.equal(fs.existsSync(keysFile(r.dir)), false);
  const closed = spawnSync('sh', ['-c', `"${process.execPath}" "${CLI}" keys set deepseek <&-`], { cwd: r.dir, encoding: 'utf8' });
  assert.equal(closed.status, 1);
  assert.match(closed.stderr, /^No key was given/);
});

test('0389 AC1: typed in a terminal, the key is not echoed, and echo is back on afterwards', { skip: !fs.existsSync('/usr/bin/python3') && 'needs python3 for a terminal' }, () => {
  const r = repo();
  // A real terminal: python's pty runs the command, types the key as soon as the prompt is shown, and prints all it saw.
  const py = `
import os, pty, sys, select, time
pid, fd = pty.fork()
if pid == 0:
    os.execvp('sh', ['sh', '-c', sys.argv[1]])
out = b''; typed = False; end = time.time() + 20
while time.time() < end:
    r, _, _ = select.select([fd], [], [], 0.05)
    if r:
        try: chunk = os.read(fd, 4096)
        except OSError: break
        if not chunk: break
        out += chunk
    if not typed and b'API key' in out:
        os.write(fd, sys.argv[2].encode() + b'\\n'); typed = True
os.waitpid(pid, 0)
sys.stdout.write(out.decode('utf8', 'replace'))
`;
  const cmd = `"${process.execPath}" "${CLI}" keys set deepseek; stty -a`;
  const res = spawnSync('python3', ['-c', py, cmd, KEY], { cwd: r.dir, encoding: 'utf8', timeout: 30000 });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /DeepSeek API key/);
  assert.match(res.stdout, /Saved the DeepSeek API key/);
  assert.ok(!res.stdout.includes(KEY), `the key was shown: ${res.stdout}`);
  assert.match(res.stdout, /(^|\s)echo(\s|$)/m, 'echo is on again');
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
});

test('0389 AC1: a keys file someone else could read is made the owner\'s only again', () => {
  const r = repo();
  saveProviderKey(r.dir, 'deepseek', KEY);
  fs.chmodSync(keysFile(r.dir), 0o644);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.equal(mode(keysFile(r.dir)), 0o600);
});

test('0389 AC2: the key is never printed, and is in no file but the keys file; speck keys says only whether it is set', () => {
  const r = repo();
  const before = fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8');
  const none = speck(r.dir, process.env, 'keys');
  assert.equal(none.stdout, 'DeepSeek (deepseek): no key\n');
  const outs = [keys(r.wt, `${KEY}\n`, 'set', 'deepseek'), speck(r.dir, process.env, 'keys'), speck(r.wt, process.env, 'keys'),
    speck(r.dir, process.env, 'config', 'show'), speck(r.dir, process.env, 'status', '--json')];
  for (const o of outs) assert.ok(!(o.stdout + o.stderr).includes(KEY), `printed: ${o.stdout}${o.stderr}`);
  assert.equal(outs[1].stdout, 'DeepSeek (deepseek): key set\n');
  assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), before);
  assert.equal(git(r.dir, 'status', '--porcelain').stdout, '');
  for (const f of [...filesUnder(r.dir, keysFile(r.dir)), ...filesUnder(r.wt, null)])
    assert.ok(!fs.readFileSync(f).includes(KEY), `the key is in ${f}`);
});

test('0389 AC3: every checkout and worktree reads the same key from the main checkout', () => {
  const r = repo();
  saveProviderKey(r.wt, 'deepseek', KEY);
  assert.equal(keysFile(r.wt), keysFile(r.dir));
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.equal(providerKey(r.wt, 'deepseek'), KEY);
  assert.equal(fs.existsSync(path.join(r.wt, 'speck', '.cache', 'machine', 'keys.json')), false);
  assert.equal(speck(r.dir, process.env, 'keys').stdout, 'DeepSeek (deepseek): key set\n');
  assert.equal(removeProviderKey(r.dir, 'deepseek'), true);
  assert.equal(providerKey(r.wt, 'deepseek'), null);
});

test('0389 AC4: speck knows its providers from one list, DeepSeek first, each with a name, label, address, models and default', () => {
  assert.equal(PROVIDERS[0].name, 'deepseek');
  assert.equal(PROVIDERS[0].label, 'DeepSeek');
  assert.equal(PROVIDERS[0].address, 'https://api.deepseek.com/anthropic');
  assert.deepEqual([...PROVIDERS[0].models], ['deepseek-v4-pro', 'deepseek-v4-flash']);
  for (const p of PROVIDERS) {
    assert.match(p.name, /^[a-z0-9-]+$/);
    assert.ok(p.label);
    assert.match(p.address, /^https:\/\//);
    assert.ok(p.models.length);
    assert.ok(p.models.includes(p.defaultModel));
  }
  assert.equal(new Set(PROVIDERS.map(p => p.name)).size, PROVIDERS.length);
  assert.equal(findProvider('DeepSeek'), PROVIDERS[0]);
  assert.equal(findProvider('constructor'), null);
});

test('0389 AC4: a provider added to the list gets a key the same way', () => {
  const r = repo();
  const own = { name: 'testco', label: 'TestCo', address: 'https://api.test.example/anthropic', models: ['t-1'], defaultModel: 't-1' };
  const providers = [...PROVIDERS, own];
  assert.throws(() => saveProviderKey(r.dir, 'testco', KEY), /It knows: deepseek/);
  saveProviderKey(r.dir, 'testco', 'sk-test', { providers });
  saveProviderKey(r.wt, 'deepseek', KEY, { providers });
  assert.equal(providerKey(r.wt, 'testco', { providers }), 'sk-test');
  assert.deepEqual(keysStatus(r.dir, { providers }), [{ name: 'deepseek', label: 'DeepSeek', set: true }, { name: 'testco', label: 'TestCo', set: true }]);
  assert.equal(removeProviderKey(r.dir, 'testco', { providers }), true);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.equal(mode(keysFile(r.dir)), 0o600);
});
