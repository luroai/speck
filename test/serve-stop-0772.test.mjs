// 0772: `speck serve --stop` with the service `--install` made stops the service itself, so it doesn't start speck
// serve again. The service functions are called with a stand-in machine, as 0759's tests do, so nothing here stops a
// real service; one test runs a real speck serve with a stand-in systemctl, which stops it as systemd would.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stopInstalledService, serveUninstall, unitFile, plistFile, UNIT, LABEL } from '../scripts/serve-install.mjs';
import { ROOT, machine as serveMachine, standInProject, addProject, serveOnce, portOf, pidAlive, readJson, until, getJson } from './support/serve.mjs';

const ok = { status: 0, stdout: '', stderr: '', error: null };
// A stand-in machine with its own home folder: `answers(cmd, args)` may return a result for a command.
function machine(platform, answers = () => null) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0772-'));
  const ran = [];
  return {
    ran, home,
    d: {
      platform, home, user: 'robin', uid: 501, node: '/usr/bin/node', cli: '/opt/speck/scripts/speck.mjs', env: {},
      run: (cmd, args) => { ran.push([cmd, ...args].join(' ')); return answers(cmd, args) ?? ok; },
    },
  };
}
const installed = (m, file) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '# Written by speck serve --install.\n'); return file; };

test('0772 AC1: on Linux, with the service installed, it stops the service with systemctl and says how to start it again', () => {
  const m = machine('linux');
  installed(m, unitFile(m.d));
  const line = stopInstalledService(m.d);
  assert.deepEqual(m.ran, [`systemctl --user stop ${UNIT}`]);
  assert.match(line, /stays stopped/);
  assert.match(line, /systemctl --user start speck-serve/);
});

test('0772 AC1: on a Mac, it boots the launch agent out, also when it isn\'t loaded, and says how to load it again', () => {
  const m = machine('darwin');
  const file = installed(m, plistFile(m.d));
  const line = stopInstalledService(m.d);
  assert.deepEqual(m.ran, [`launchctl bootout gui/501/${LABEL}`]);
  assert.match(line, /stays stopped/);
  assert.ok(line.includes(`launchctl bootstrap gui/501 ${file}`), line);
  const gone = machine('darwin', (cmd, args) => (args[0] === 'bootout' ? { status: 3, stdout: '', stderr: 'Boot-out failed: 3: No such process', error: null } : null));
  installed(gone, plistFile(gone.d));
  assert.match(stopInstalledService(gone.d), /stays stopped/);
});

test('0772 AC1: when the service can\'t be stopped, it says so plainly and stops nothing', () => {
  const m = machine('linux', cmd => (cmd === 'systemctl' ? { status: 1, stdout: '', stderr: 'Failed to connect to bus', error: null } : null));
  installed(m, unitFile(m.d));
  assert.throws(() => stopInstalledService(m.d), e => /wasn't stopped/.test(e.message) && /Nothing was stopped/.test(e.message) && /Failed to connect to bus/.test(e.message));
  const mac = machine('darwin', (cmd, args) => ({ status: args[0] === 'print' ? 0 : 5, stdout: '', stderr: 'Boot-out failed: 5: Input/output error', error: null }));
  installed(mac, plistFile(mac.d));
  assert.throws(() => stopInstalledService(mac.d), /Nothing was stopped/);
});

test('0772 AC3: stopping leaves the service installed and enabled, and --uninstall still removes it', () => {
  for (const [platform, fileOf] of [['linux', unitFile], ['darwin', plistFile]]) {
    const m = machine(platform);
    const file = installed(m, fileOf(m.d));
    stopInstalledService(m.d);
    assert.ok(fs.existsSync(file), `${platform}: its file is still there`);
    assert.ok(!m.ran.some(c => /\b(disable|remove|unload)\b/.test(c)), `${platform}: nothing turns it off at boot: ${m.ran}`);
    serveUninstall(['--uninstall'], m.d);
    assert.ok(!fs.existsSync(file), `${platform}: --uninstall removes it`);
  }
});

test('0772 AC4: without the service installed, or for a speck serve using other settings than the service\'s, it touches no service', () => {
  for (const platform of ['linux', 'darwin', 'win32']) {
    const m = machine(platform);
    assert.equal(stopInstalledService(m.d), null);
    assert.deepEqual(m.ran, []);
  }
  const m = machine('linux');
  installed(m, unitFile(m.d));
  m.d.env.SPECK_HOME_SETTINGS_DIR = path.join(m.home, 'elsewhere');
  assert.equal(stopInstalledService(m.d), null);
  assert.deepEqual(m.ran, []);
  m.d.env.SPECK_HOME_SETTINGS_DIR = path.join(m.home, '.config', 'speck');
  assert.match(stopInstalledService(m.d), /stays stopped/, 'the service\'s own settings folder, named outright');
});

test('0772 AC1 AC2: a real speck serve run by the service is stopped through it, with every panel it started, and says how to start it again', { skip: process.platform !== 'linux' && 'the stand-in is systemctl' }, async () => {
  const base = serveMachine();
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0772-home-')));
  const settings = path.join(home, '.config', 'speck'), bin = path.join(home, 'bin'), log = path.join(home, 'systemctl.log');
  fs.mkdirSync(bin);
  // Stands in for systemd: `stop` sends speck serve SIGTERM and waits for it to end, as systemctl stop does.
  fs.writeFileSync(path.join(bin, 'systemctl'), `#!${process.execPath}
const fs = require('fs');
fs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(' ') + '\\n');
if (process.argv[3] === 'stop') {
  const pid = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(settings, 'serve.json'))}, 'utf8')).pid;
  process.kill(pid, 'SIGTERM');
  const alive = () => { try { process.kill(pid, 0); return true; } catch { return false; } };
  const end = Date.now() + 20000, wait = () => (alive() && Date.now() < end ? setTimeout(wait, 50) : process.exit(0));
  wait();
}
`, { mode: 0o755 });
  const m = { ...base, settings, record: path.join(settings, 'serve.json'), env: { ...base.env, HOME: home, XDG_CONFIG_HOME: path.join(home, '.config'), SPECK_HOME_SETTINGS_DIR: settings, PATH: `${bin}${path.delimiter}${process.env.PATH}` } };
  installed(m, path.join(home, '.config', 'systemd', 'user', UNIT));
  const a = standInProject('alpha');
  addProject(m, a);
  const r = serveOnce(m, '--background');
  assert.equal(r.status, 0, r.stderr);
  const { pid } = readJson(m.record);
  const port = portOf(r.stdout, 'alpha');
  const panel = await until('alpha\'s panel answering', async () => (await getJson(port, '/copy'))?.pid);
  try {
    const stop = serveOnce(m, '--stop');
    assert.equal(stop.status, 0, stop.stdout + stop.stderr);
    assert.deepEqual(fs.readFileSync(log, 'utf8').trim().split('\n'), [`--user stop ${UNIT}`]);
    assert.match(stop.stdout, new RegExp(`speck serve: stopped \\(process ${pid}\\) and the 1 panel it started: alpha`));
    assert.match(stop.stdout, /stays stopped/);
    assert.match(stop.stdout, /systemctl --user start speck-serve/);
    assert.ok(!pidAlive(pid), 'speck serve has stopped');
    await until('alpha\'s panel stopping', () => !pidAlive(panel));
  } finally {
    for (const p of [pid, panel]) { try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } }
  }
});

test('0772 AC5: the brief\'s speck serve row names how --stop stops the installed service', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck serve'));
  assert.ok(row.includes('systemctl --user stop'), 'names systemctl --user stop');
  assert.ok(row.includes('launchctl bootout'), 'names launchctl bootout');
});
