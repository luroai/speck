// 0759: `speck serve --install` and `--uninstall`. The install functions are called directly with a stand-in for the
// machine: a temporary home folder and a recorder in place of systemctl, loginctl and launchctl, so nothing here
// installs a real service.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serveInstall, serveUninstall, unitFile, plistFile, UNIT, LABEL } from '../scripts/serve-install.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// A stand-in machine: `answers(cmd, args)` may return a result for a command, otherwise it succeeds with no output.
function machine(platform, answers = () => null) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0759-'));
  const ran = [];
  return {
    ran, home,
    d: {
      platform, home, user: 'robin', uid: 501, node: '/usr/bin/node', cli: '/opt/speck/scripts/speck.mjs',
      env: { PATH: '/usr/local/bin:/usr/bin', SPECK_HOME_SETTINGS_DIR: path.join(home, '.config', 'speck') },
      run: (cmd, args) => { ran.push([cmd, ...args].join(' ')); return answers(cmd, args) ?? { status: 0, stdout: '', stderr: '', error: null }; },
    },
  };
}
const lingerOff = (cmd, args) => (cmd === 'loginctl' && args[0] === 'show-user' ? { status: 0, stdout: 'no\n', stderr: '', error: null } : null);
const lingerOn = (cmd, args) => (cmd === 'loginctl' && args[0] === 'show-user' ? { status: 0, stdout: 'yes\n', stderr: '', error: null } : null);
const execLine = text => text.split('\n').find(l => l.startsWith('ExecStart='));

test('0759 AC1: on Linux, --install writes a systemd user service running speck serve with the port and --url given, enables it with lingering, starts it and prints how to see its status and log', () => {
  const m = machine('linux', lingerOff);
  const out = serveInstall(['--install', '--port', '4800', '--url', 'https://speck.example.ts.net'], m.d).join('\n');
  const file = unitFile(m.d);
  assert.equal(file, path.join(m.home, '.config', 'systemd', 'user', UNIT));
  const unit = fs.readFileSync(file, 'utf8');
  assert.equal(execLine(unit), 'ExecStart="/usr/bin/node" "/opt/speck/scripts/speck.mjs" "serve" "--port" "4800" "--url" "https://speck.example.ts.net"');
  assert.match(unit, /^Restart=always$/m, 'starts again if it stops');
  assert.match(unit, /^WorkingDirectory=%h$/m, 'runs from your home folder');
  assert.match(unit, /^WantedBy=default\.target$/m, 'enabled for the user manager, which lingering starts at boot');
  assert.match(unit, /^Environment="PATH=\/usr\/local\/bin:\/usr\/bin"$/m, 'finds git and the agents as your shell does');
  assert.deepEqual(m.ran, [
    'loginctl show-user robin --property=Linger --value',
    'loginctl enable-linger --no-ask-password robin',
    'systemctl --user daemon-reload',
    `systemctl --user enable ${UNIT}`,
    `systemctl --user restart ${UNIT}`,
  ]);
  assert.match(out, /systemctl --user status speck-serve/);
  assert.match(out, /journalctl --user -u speck-serve/);
});

test('0759 AC1: without --port or --url it runs plain speck serve, and escapes what systemd would expand', () => {
  const m = machine('linux', lingerOn);
  m.d.cli = '/home/robin/100%/$speck/speck.mjs';
  serveInstall(['--install'], m.d);
  assert.equal(execLine(fs.readFileSync(unitFile(m.d), 'utf8')), 'ExecStart="/usr/bin/node" "/home/robin/100%%/$$speck/speck.mjs" "serve"');
  assert.ok(!m.ran.some(c => c.includes('enable-linger')), 'lingering already on: left as it is');
});

test('0759 AC1: when lingering can\'t be turned on, it still installs and says how to start it at boot', () => {
  const m = machine('linux', (cmd, args) => lingerOff(cmd, args) ?? (args[0] === 'enable-linger' ? { status: 1, stdout: '', stderr: 'Access denied', error: null } : null));
  const out = serveInstall(['--install'], m.d).join('\n');
  assert.ok(fs.existsSync(unitFile(m.d)));
  assert.match(out, /sudo loginctl enable-linger robin/);
});

test('0759 AC1: a bad --port, --url or other argument is refused and writes nothing', () => {
  for (const args of [['--install', '--port', '0'], ['--install', '--url', 'http://x.ts.net'], ['--install', '--fast']]) {
    const m = machine('linux', lingerOff);
    assert.throws(() => serveInstall(args, m.d), /--port|--url|doesn't take/);
    assert.ok(!fs.existsSync(unitFile(m.d)), `${args.join(' ')}: nothing written`);
    assert.deepEqual(m.ran, [], `${args.join(' ')}: nothing run`);
  }
});

test('0759 AC1: when systemd fails, the install says why and leaves nothing behind', () => {
  const m = machine('linux', (cmd, args) => lingerOff(cmd, args) ?? (cmd === 'systemctl' ? { status: 1, stdout: '', stderr: 'Failed to connect to bus', error: null } : null));
  assert.throws(() => serveInstall(['--install'], m.d), /Failed to connect to bus/);
  assert.ok(!fs.existsSync(unitFile(m.d)), 'service file removed');
  assert.equal(m.ran.at(-1), 'loginctl disable-linger --no-ask-password robin', 'lingering it turned on is turned off again');
});

test('0759 AC2: on a Mac, --install writes a launch agent that runs speck serve at login and keeps it running, and loads it', () => {
  const m = machine('darwin');
  const out = serveInstall(['--install', '--port=4800'], m.d).join('\n');
  const file = plistFile(m.d);
  assert.equal(file, path.join(m.home, 'Library', 'LaunchAgents', `${LABEL}.plist`));
  const plist = fs.readFileSync(file, 'utf8');
  assert.match(plist, new RegExp(`<key>Label</key>\\s*<string>${LABEL.replace(/\./g, '\\.')}</string>`));
  assert.match(plist, /<key>ProgramArguments<\/key>\s*<array>\s*<string>\/usr\/bin\/node<\/string>\s*<string>\/opt\/speck\/scripts\/speck\.mjs<\/string>\s*<string>serve<\/string>\s*<string>--port<\/string>\s*<string>4800<\/string>\s*<\/array>/);
  assert.match(plist, /<key>RunAtLoad<\/key>\s*<true\/>/);
  assert.match(plist, /<key>KeepAlive<\/key>\s*<true\/>/);
  assert.deepEqual(m.ran, [`launchctl bootout gui/501/${LABEL}`, `launchctl bootstrap gui/501 ${file}`]);
  assert.match(out, /launchctl print gui\/501\/dev\.speck\.serve/);
});

test('0759 AC3: on Linux, --uninstall stops and removes what --install wrote, and nothing else', () => {
  const m = machine('linux', lingerOff);
  serveInstall(['--install'], m.d);
  const other = path.join(path.dirname(unitFile(m.d)), 'other.service');
  fs.writeFileSync(other, '[Service]\n');
  m.ran.length = 0;
  serveUninstall(['--uninstall'], m.d);
  assert.ok(!fs.existsSync(unitFile(m.d)));
  assert.ok(fs.existsSync(other), 'another service is left alone');
  assert.deepEqual(m.ran, [`systemctl --user disable --now ${UNIT}`, 'systemctl --user daemon-reload', 'loginctl disable-linger --no-ask-password robin']);
});

test('0759 AC3: lingering that was on before --install stays on after --uninstall, even after a second --install', () => {
  const m = machine('linux', lingerOn);
  serveInstall(['--install'], m.d);
  serveInstall(['--install', '--port', '4801'], m.d);
  m.ran.length = 0;
  serveUninstall(['--uninstall'], m.d);
  assert.ok(!m.ran.some(c => c.includes('disable-linger')));
});

test('0759 AC3: lingering --install turned on is still turned off after a second --install', () => {
  let on = false;
  const m = machine('linux', (cmd, args) => {
    if (cmd === 'loginctl' && args[0] === 'show-user') return { status: 0, stdout: on ? 'yes\n' : 'no\n', stderr: '', error: null };
    if (args[0] === 'enable-linger') on = true;
    return null;
  });
  serveInstall(['--install'], m.d);
  serveInstall(['--install', '--port', '4801'], m.d);
  m.ran.length = 0;
  serveUninstall(['--uninstall'], m.d);
  assert.ok(m.ran.includes('loginctl disable-linger --no-ask-password robin'));
});

test('0759 AC3: on a Mac, --uninstall unloads and removes the launch agent, and nothing else', () => {
  const m = machine('darwin');
  serveInstall(['--install'], m.d);
  const other = path.join(path.dirname(plistFile(m.d)), 'com.other.plist');
  fs.writeFileSync(other, '<plist/>');
  m.ran.length = 0;
  serveUninstall(['--uninstall'], m.d);
  assert.ok(!fs.existsSync(plistFile(m.d)));
  assert.ok(fs.existsSync(other));
  assert.deepEqual(m.ran, [`launchctl bootout gui/501/${LABEL}`]);
});

test('0759 AC3: --uninstall with nothing installed changes nothing', () => {
  for (const p of ['linux', 'darwin']) {
    const m = machine(p);
    assert.match(serveUninstall(['--uninstall'], m.d).join('\n'), /nothing to remove/);
    assert.deepEqual(m.ran, []);
  }
});

test('0759 AC4: running --install again replaces the service with the new arguments rather than adding a second', () => {
  const lin = machine('linux', lingerOn);
  serveInstall(['--install', '--port', '4800'], lin.d);
  serveInstall(['--install', '--port', '4900', '--url', 'https://b.ts.net'], lin.d);
  const dir = path.dirname(unitFile(lin.d));
  assert.deepEqual(fs.readdirSync(dir), [UNIT], 'one service file');
  const exec = execLine(fs.readFileSync(unitFile(lin.d), 'utf8'));
  assert.match(exec, /"--port" "4900" "--url" "https:\/\/b\.ts\.net"$/);
  assert.doesNotMatch(exec, /4800/);
  assert.equal(lin.ran.filter(c => c === `systemctl --user restart ${UNIT}`).length, 2, 'restarted with the new arguments');

  const mac = machine('darwin');
  serveInstall(['--install', '--port', '4800'], mac.d);
  serveInstall(['--install', '--port', '4900'], mac.d);
  assert.deepEqual(fs.readdirSync(path.dirname(plistFile(mac.d))), [`${LABEL}.plist`]);
  const plist = fs.readFileSync(plistFile(mac.d), 'utf8');
  assert.match(plist, /<string>4900<\/string>/);
  assert.doesNotMatch(plist, /4800/);
  assert.deepEqual(mac.ran.slice(2), [`launchctl bootout gui/501/${LABEL}`, `launchctl bootstrap gui/501 ${plistFile(mac.d)}`], 'the old one unloaded before the new one loads');
});

test('0759 AC5: the brief\'s command table and speck\'s help describe --install and --uninstall', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `speck serve'));
  assert.ok(row?.includes('`speck serve --install'), 'the row names --install');
  assert.ok(row?.includes('`speck serve --uninstall`'), 'the row names --uninstall');
  const help = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'speck.mjs'), 'help'], { encoding: 'utf8' }).stdout;
  assert.match(help, /speck serve --install\|--uninstall/);
});

test('0759: --install with --stop or --background is refused before anything is installed', () => {
  for (const args of [['--install', '--stop'], ['--uninstall', '--background'], ['--install', '--uninstall']]) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'speck.mjs'), 'serve', ...args], { encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /not both/);
  }
});
