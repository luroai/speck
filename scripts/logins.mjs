// 0635: test logins for checking a change in the running app, kept for this machine only, as API keys are (0389), in
// the main checkout's speck/.cache/machine/logins.json, which git ignores and only its owner can read or write. Every
// worktree reads the same file. A password is never put on a command line: `speck logins set` reads it from its input.
// Each saved password counts as a private word (private-words.mjs), so speck never commits or saves one.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isatty } from 'node:tty';
import { SpeckError, findRepoRoot } from './core.mjs';
import { machineConfigFile } from './machine.mjs';
import { sharedCacheDir } from './turns.mjs';
import { READ_SILENTLY } from './keys.mjs';

export const loginsFile = repo => path.join(path.dirname(machineConfigFile(repo)), 'logins.json');

// A name speck can keep a login under and type on a command line: a letter or digit, then letters, digits, . _ or -.
const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
function checkedName(name) {
  if (!NAME.test(String(name ?? ''))) throw new SpeckError(`That can't be a login's name: use letters, digits, dots, dashes and underscores, starting with a letter or digit, such as admin. Nothing was saved.`);
  return name;
}

// The logins in this machine's file, by name, as { username, password }: {} when there's no file.
export function savedLogins(repo) {
  const file = loginsFile(repo);
  let text;
  try {
    // A file someone else could read is made the owner's only again before it's read.
    if ((fs.statSync(file).mode & 0o077) !== 0) fs.chmodSync(file, 0o600);
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return {};
    throw new SpeckError(`This machine's test logins file, ${file}, can't be read (${e.code || e.message}). Make it a file you can read, or delete it and save each login again with \`speck logins set <name>\`.`);
  }
  let read;
  try { read = JSON.parse(text); } catch { read = null; }
  if (!read || typeof read !== 'object' || Array.isArray(read))
    throw new SpeckError(`This machine's test logins file, ${file}, can't be read. Delete it, then save each login again with \`speck logins set <name>\`.`);
  const out = {};
  for (const [name, l] of Object.entries(read))
    if (NAME.test(name) && l && typeof l.username === 'string' && typeof l.password === 'string' && l.username && l.password)
      out[name] = { username: l.username, password: l.password };
  return out;
}

// Writes `logins`, or removes the file when there are none, so only its owner can read or write it at any moment.
function writeLogins(repo, logins) {
  const file = loginsFile(repo);
  if (!Object.keys(logins).length) { fs.rmSync(file, { force: true }); return; }
  sharedCacheDir(repo, 'machine');
  const tmp = `${file}.${process.pid}.tmp`;
  fs.rmSync(tmp, { force: true });
  try {
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try { fs.fchmodSync(fd, 0o600); fs.writeSync(fd, `${JSON.stringify(logins, null, 2)}\n`); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  } catch (e) { fs.rmSync(tmp, { force: true }); throw e; } // never leaves a copy of a password behind
}

// Each saved password, lower-cased as private words are, for the private-word checks.
export function loginPasswords(repo) {
  return Object.values(savedLogins(repo)).map(l => l.password.toLowerCase());
}

export function saveLogin(repo, name, username, password) {
  checkedName(name);
  const u = String(username ?? '').trim(), p = String(password ?? '');
  if (!u) throw new SpeckError('No username was given, so nothing was saved. Type it when asked, or pipe in the username and password on two lines: speck logins set <name> < <file>.');
  if (!p.trim()) throw new SpeckError('No password was given, so nothing was saved. Type it when asked, or pipe in the username and password on two lines: speck logins set <name> < <file>.');
  if (/[\r\n]/.test(u + p)) throw new SpeckError('A username or password can\'t span lines, so nothing was saved.');
  const logins = savedLogins(repo);
  logins[name] = { username: u, password: p };
  writeLogins(repo, logins);
}

// The login called `name`, or a plain error naming the ones this machine has.
function loginOf(logins, name) {
  if (Object.hasOwn(logins, name)) return logins[name];
  const known = Object.keys(logins);
  throw new SpeckError(`This machine has no test login called "${name}". ${known.length ? `It has: ${known.join(', ')}.` : 'It has none: save one with `speck logins set <name>`.'}`);
}

// The username and password from this process's input: typed in a terminal, the password without being shown, or
// piped in on two lines. [username, password].
export function readLoginInput() {
  if (!isatty(0)) {
    let text = '';
    try { text = fs.readFileSync(0, 'utf8'); } catch { /* no input to read, such as a closed one: no login */ }
    const [u = '', p = ''] = text.split('\n').map(l => l.replace(/\r$/, ''));
    return [u, p];
  }
  const ask = spawnSync('sh', ['-c', 'printf %s "$1" >&2; IFS= read -r u; printf %s "$u"', 'sh', 'Username: '], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (ask.status !== 0) throw new SpeckError('Couldn\'t read the username, so nothing was saved. Pipe in the username and password on two lines instead: speck logins set <name> < <file>.');
  const r = spawnSync('sh', ['-c', READ_SILENTLY, 'sh', 'Password (it isn\'t shown as you type): '], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
  if (r.status !== 0) throw new SpeckError('Couldn\'t read the password without showing it, so nothing was saved. Pipe in the username and password on two lines instead: speck logins set <name> < <file>.');
  return [ask.stdout, r.stdout];
}

const USAGE = 'Usage: speck logins, to list the test logins on this machine, speck logins set <name>, which reads the username and password from its input, speck logins show <name> or speck logins remove <name>.';

export function cmdLogins(args, { readLogin = readLoginInput } = {}) {
  const repo = findRepoRoot(), [sub, name, ...rest] = args;
  if (!sub) {
    const logins = savedLogins(repo), names = Object.keys(logins);
    if (!names.length) { console.log('No test logins are saved on this machine. Save one with `speck logins set <name>`.'); return; }
    for (const n of names) console.log(`${n}: ${logins[n].username}`);
    return;
  }
  if (sub === 'set') {
    if (!name) throw new SpeckError(USAGE);
    // Never echoes what was given: it may be the password itself.
    if (rest.length || name.startsWith('--')) throw new SpeckError('speck logins set takes the username and password from its input, never the command line, so nothing was saved. Run `speck logins set <name>` and type them when asked. If you typed a password on that command line, it may be in your shell\'s history: change it.');
    checkedName(name);
    const [username, password] = readLogin();
    saveLogin(repo, name, username, password);
    console.log(`Saved the test login ${name} for this machine only, where git ignores it. Remove it with \`speck logins remove ${name}\`.`);
    return;
  }
  if (sub === 'show' || sub === 'remove') {
    if (!name || rest.length) throw new SpeckError(USAGE);
    const logins = savedLogins(repo), l = loginOf(logins, name);
    if (sub === 'show') { console.log(`username: ${l.username}\npassword: ${l.password}`); return; }
    delete logins[name];
    writeLogins(repo, logins);
    console.log(`Removed the test login ${name} from this machine.`);
    return;
  }
  throw new SpeckError(USAGE);
}
