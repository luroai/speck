import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0638: speck works out how to start your app the first time it needs to: speck app <id> --start tries a command, and
// saves it as commands.start once it answers; speck run's watch agent checks a question in the app with it blank.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitIn } from './support/speck.mjs';
import { gitEnv } from './support/panel.mjs';
import { speckProcess } from './support/cli.mjs';
import { OPTION } from './support/blocked.mjs';
import { CHECK, checking } from './support/app-check.mjs';
import { readActions } from '../scripts/foreman-agent.mjs';
import { parseConfig } from '../scripts/core.mjs';

Object.assign(process.env, gitEnv); // speck watch commits in this process
const env = { ...process.env, NO_COLOR: '1' };

// A stand-in app: answers every request with the path asked for.
const APP = `require('http').createServer((q, s) => s.end(q.url)).listen(Number(process.argv[2]), '127.0.0.1');\n`;
const node = JSON.stringify(process.execPath);
const START = `${node} app.js {port}`, URL_ = 'http://localhost:{port}/health';
const ticketText = (id, title) => `---\nid: "${id}"\ntitle: "${title}"\nstatus: building\nsize: S\nrisk: low\n---\n# ${id} · ${title}\n\n## Problem\nx\n## Outcome\ny\n## Acceptance criteria\n1. z\n`;

// A committed repo on main with ticket 0001, the stand-in app and `config` in speck/config.yml.
function repo(config = '') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0638-')));
  gitIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nbranch_prefix: speck/\nworktrees: true\napp_start_seconds: 5\n${config}`);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0001-one.md'), ticketText('0001', 'One'));
  fs.writeFileSync(path.join(dir, 'app.js'), APP);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'base');
  return dir;
}
const git = (dir, ...a) => gitIn(dir, ...a).stdout.trim();
const configOn = (dir, ref = 'main') => parseConfig(git(dir, 'show', `${ref}:speck/config.yml`));
const app = (dir, ...a) => speckProcess(dir, env, 'app', '1', ...a);
// Runs speck app with `args`, then always stops what it started.
async function withApp(dir, args, use) {
  const r = app(dir, ...args);
  try { return await use(r); } finally { app(dir, '--stop'); }
}
const addressOf = out => (out.match(/http:\/\/\S+?(?=\s|$)/) || [])[0]?.replace(/[.,]$/, '');

test('0638 AC1: --start and --url start the app with that command and address instead of commands.start and app_url, {port} working as in them', async () => {
  const dir = repo(`commands:\n  start: '${node} -e "setInterval(() => {}, 1e6)"'\napp_url: http://127.0.0.1:{port}/never\n`);
  await withApp(dir, ['--start', START, '--url', URL_], async r => {
    assert.equal(r.status, 0, r.stderr);
    const url = addressOf(r.stdout);
    assert.match(url, /^http:\/\/localhost:\d+\/health$/, r.stdout);
    assert.equal(await (await fetch(url)).text(), '/health');
  });
  // For that run only: commands.start and app_url are as they were.
  assert.match(configOn(dir).commands.start, /setInterval/);
  assert.equal(configOn(dir).app_url, 'http://127.0.0.1:{port}/never');
  assert.equal(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), git(dir, 'show', 'main:speck/config.yml') + '\n');
  // --start= and --url= work too, and the address defaults to app_url's.
  await withApp(dir, [`--start=${START}`, '--url=http://127.0.0.1:{port}/'], r => assert.equal(r.status, 0, r.stderr));
});

test('0638 AC1: a blank --start, a bad --url or a stray word is refused in one line and starts nothing', () => {
  const dir = repo();
  for (const args of [['--start', ''], ['--start'], ['--start', START, '--url', 'not a url'], ['--start', START, 'extra']]) {
    const r = app(dir, ...args);
    assert.notEqual(r.status, 0, args.join(' '));
    assert.equal(r.stderr.trim().split('\n').length, 1, r.stderr);
    assert.ok(!/at .*\.mjs:\d+/.test(r.stderr), r.stderr);
  }
  assert.ok(!fs.existsSync(path.join(dir, 'speck', '.cache', 'apps', '0001')) || !fs.readdirSync(path.join(dir, 'speck', '.cache', 'apps', '0001')).length);
});

test('0638 AC2: with commands.start blank, an app that answers is saved as commands.start and app_url, committed alone on the base branch, said in one line', async () => {
  const dir = repo('commands:\n  test: npm test\n');
  fs.writeFileSync(path.join(dir, 'other.txt'), 'not mine'); gitIn(dir, 'add', 'other.txt'); // staged by someone else
  const before = git(dir, 'rev-parse', 'main');
  await withApp(dir, ['--start', START, '--url', URL_], r => {
    assert.equal(r.status, 0, r.stderr);
    const said = r.stdout.split('\n').filter(l => /commands\.start/.test(l));
    assert.equal(said.length, 1, r.stdout);
    assert.match(said[0], /speck: set how to start the app/);
  });
  assert.equal(configOn(dir).commands.start, START);
  assert.equal(configOn(dir).commands.test, 'npm test', 'the rest of the file is kept');
  assert.equal(configOn(dir).app_url, URL_);
  assert.equal(git(dir, 'log', '-1', '--format=%s', 'main'), 'speck: set how to start the app');
  assert.equal(git(dir, 'rev-parse', 'main~1'), before);
  assert.equal(git(dir, 'diff', '--name-only', 'main~1', 'main'), 'speck/config.yml');
  assert.equal(git(dir, 'diff', '--cached', '--name-only'), 'other.txt', 'what someone else staged stays staged');
  assert.equal(git(dir, 'status', '--porcelain', '--', 'speck/config.yml'), '');
});

test('0638 AC2: without --url only commands.start is saved', async () => {
  const dir = repo();
  await withApp(dir, ['--start', START], r => assert.equal(r.status, 0, r.stderr));
  assert.equal(configOn(dir).commands.start, START);
  assert.equal(configOn(dir).app_url, undefined);
});

test('0638 AC2: from a ticket\'s worktree, with the base branch checked out nowhere, it\'s committed on the base branch', async () => {
  const dir = repo();
  gitIn(dir, 'checkout', '-q', '-b', 'other');
  const wt = path.join(`${dir}.worktrees`, 'speck', '0001-one');
  assert.equal(gitIn(dir, 'worktree', 'add', '-q', '-b', 'speck/0001-one', wt).status, 0);
  await withApp(wt, ['--start', START], r => assert.equal(r.status, 0, r.stderr));
  assert.equal(configOn(dir).commands.start, START);
  assert.equal(git(dir, 'log', '-1', '--format=%s', 'main'), 'speck: set how to start the app');
  assert.equal(git(dir, 'rev-parse', '--abbrev-ref', 'HEAD'), 'other');
  assert.equal(git(dir, 'worktree', 'list').split('\n').length, 2, 'the short-lived checkout is gone');
});

test('0638 AC2: with commands.start set, or an app that doesn\'t answer, it saves nothing', async () => {
  const dir = repo(`commands:\n  start: '${START}'\n`), head = git(dir, 'rev-parse', 'main');
  await withApp(dir, ['--start', `${START} `, '--url', URL_], r => {
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!/commands\.start/.test(r.stdout), r.stdout);
  });
  assert.equal(git(dir, 'rev-parse', 'main'), head);
  const blank = repo(), was = git(blank, 'rev-parse', 'main');
  const r = app(blank, '--start', `${node} -e "process.exit(3)"`);
  assert.notEqual(r.status, 0);
  assert.equal(git(blank, 'rev-parse', 'main'), was);
  assert.equal(configOn(blank).commands, undefined);
});

test('0638 AC2: when speck/config.yml has uncommitted changes on the base branch, it saves nothing, says why and leaves the app running', async () => {
  const dir = repo(), file = path.join(dir, 'speck', 'config.yml');
  fs.appendFileSync(file, '# mine\n');
  const head = git(dir, 'rev-parse', 'main');
  await withApp(dir, ['--start', START], async r => {
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout + r.stderr, /speck\/config\.yml has uncommitted changes/);
    assert.equal(await (await fetch(addressOf(r.stdout))).text(), '/', 'still running');
  });
  assert.equal(git(dir, 'rev-parse', 'main'), head);
  assert.ok(fs.readFileSync(file, 'utf8').endsWith('# mine\n'));
});

test('0638 AC3: with commands.start blank, speck run starts the watch agent, with a brief to work out how to start the app and try it with speck app --start', () => {
  for (const watch of ['decide', 'fix']) {
    const { a } = checking({ watch, start: '' });
    a.check();
    assert.equal(a.starts.length, 1, watch);
    const brief = a.starts[0].brief;
    for (const said of ['README', 'package or build files', 'scripts', 'on a given port', 'speck.mjs app 0001 --start', '{port}', 'speck.mjs logins', 'speck.mjs picture 0001', 'speck.mjs app 0001 --stop', CHECK])
      assert.ok(brief.includes(said), `${said}\n${brief}`);
    assert.ok(brief.indexOf('README') < brief.indexOf('speck.mjs logins'), 'first works out how to start it');
  }
  const { a } = checking();
  a.check();
  assert.ok(!a.starts[0].brief.includes('--start'), 'with commands.start set, the brief is as before');
});

test('0638 AC4: when nothing answers, the brief says to ask, naming each command tried and the last lines, and the question waits for you', () => {
  const { r, a } = checking({ start: '' });
  a.check();
  const brief = a.starts[0].brief;
  assert.match(brief, /nothing you try answers/i);
  assert.match(brief, /watch ask 0001/);
  assert.match(brief, /each command you tried/);
  assert.match(brief, /last lines/);
  a.act('ask', '0001', 'How do I start the app? I tried npm start (Error: missing .env) and npm run dev (port in use).', '--saw=Neither command answered', '--why=Nothing I tried started it');
  assert.deepEqual(readActions(r.runs).map(x => x.action), ['ask']);
  assert.match(r.ticket(), /^status: blocked$/m);
  assert.ok(!r.ticket().includes(`Went with the recommendation: ${OPTION}`));
});

for (const [name, o] of [['watch: tell', { watch: 'tell' }], ['watch: off', { watch: 'off' }], ['high risk', { risk: 'high' }]])
  test(`0638 AC5: with ${name} and commands.start blank, the question waits for you`, () => {
    const { a } = checking({ ...o, start: '' });
    a.check();
    assert.equal(a.starts.length, 0);
  });

test('0638 AC1: the brief, the watch skill and speck help name speck app --start and --url, and the commit it makes', () => {
  const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');
  const brief = read('docs/brief.md'), watch = read('skills/speck-watch/SKILL.md');
  for (const said of ['speck app <id> --start "<command>"', '--url "<address>"', '`speck: set how to start the app`']) assert.ok(brief.includes(said), said);
  for (const said of ['speck app <id> --start "<command>"', '--url "<address>"', 'speck watch ask']) assert.ok(watch.includes(said), said);
  assert.ok(!/and `commands\.start` (is )?set/.test(watch + read('skills/speck-build/SKILL.md')), 'a check no longer needs commands.start set');
  const help = speckProcess(fs.realpathSync(os.tmpdir()), env, 'help').stdout;
  assert.match(help, /speck app <id>.*--start "<command>" \[--url "<address>"\]/);
});
