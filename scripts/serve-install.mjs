// 0759: `speck serve --install` and `speck serve --uninstall`. --install makes `speck serve` start by itself and start
// again if it stops: on Linux a systemd user service, enabled to start at boot with lingering turned on, and on a Mac a
// launchd agent that starts at login and is kept running. Running it again replaces that one service with the new
// arguments. --uninstall stops it and removes only what --install wrote, turning lingering off again only when --install
// turned it on. Each function takes what it touches (platform, home folder, user, and how to run a command) so the
// tests can check it without changing the machine they run on.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError } from './core.mjs';
import { panelUrl } from './panel-url.mjs';
import { serveFiles } from './serve.mjs';

export const UNIT = 'speck-serve.service';
export const LABEL = 'dev.speck.serve';
const LINGER_MARK = '# speck serve --install turned lingering on for this user';
const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');

// The machine as it is: what the commands use unless a test gives its own.
export function machineDeps() {
  let user = '', uid = 0;
  try { const u = os.userInfo(); user = u.username; uid = u.uid; } catch { /* said where it's needed */ }
  return {
    platform: process.platform, env: process.env, home: os.homedir(), user, uid, node: process.execPath, cli: CLI,
    run: (cmd, args) => {
      const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { status: r.error ? null : r.status, stdout: r.stdout || '', stderr: (r.stderr || '').trim(), error: r.error?.code || null };
    },
  };
}

// The arguments --install passes on to speck serve: [] or --port <n> and --url <address>, each at most once.
function serveArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--install') continue;
    if (a === '--port' || a === '--url') { i++; continue; }
    if (a.startsWith('--port=') || a.startsWith('--url=')) continue;
    throw new SpeckError(`speck serve --install doesn't take ${a}. Use speck serve --install [--port <n>] [--url https://<hostname>].`);
  }
  const ports = args.flatMap((a, i) => (a === '--port' ? [args[i + 1]] : a.startsWith('--port=') ? [a.slice(7)] : []));
  if (ports.length > 1) throw new SpeckError('Give --port once.');
  if (ports.length) {
    const v = ports[0];
    if (!/^\d+$/.test(v ?? '') || +v < 1 || +v > 65535) throw new SpeckError(`--port must be a whole number from 1 to 65535 (got "${v ?? ''}").`);
    out.push('--port', String(+v));
  }
  const url = panelUrl(args);
  if (url) out.push('--url', url.origin);
  return out;
}

const noNewline = (what, s) => { if (/[\n\r\0]/.test(s)) throw new SpeckError(`${what} has a line break in it, so it can't go in a service file: ${JSON.stringify(s)}.`); return s; };
// One argument in a systemd unit: quoted, with \ and " escaped, % as %% (a specifier otherwise) and $ as $$ (a variable).
const unitArg = s => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%').replace(/\$/g, '$$$$')}"`;
const unitEnv = (k, v) => `"${k}=${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/%/g, '%%')}"`;
const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function readText(file) { try { return fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw new SpeckError(`Can't read ${file} (${e.code || e.message}).`); } }
function writeText(file, text) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
  catch (e) { throw new SpeckError(`Can't write ${file} (${e.code || e.message}). Make sure you can write to that folder, then run this again.`); }
}
// Puts back what a file held before a failed install, or removes the one it wrote.
const putBack = (file, before) => { try { if (before === null) fs.rmSync(file, { force: true }); else fs.writeFileSync(file, before); } catch { /* said with the error */ } };

const failed = (r, cmd) => (r.error === 'ENOENT' ? `${cmd.split(' ')[0]} isn't on this machine` : `\`${cmd}\` failed${r.stderr ? `: ${r.stderr}` : ` (exit code ${r.status})`}`);

export function unitFile(d) { return path.join(d.env.XDG_CONFIG_HOME || path.join(d.home, '.config'), 'systemd', 'user', UNIT); }
export function plistFile(d) { return path.join(d.home, 'Library', 'LaunchAgents', `${LABEL}.plist`); }

function unitText(d, args, lingerMark) {
  const exec = [d.node, d.cli, 'serve', ...args].map(a => unitArg(noNewline('An argument', a))).join(' ');
  return [
    '# Written by speck serve --install. speck serve --uninstall stops and removes it.',
    ...(lingerMark ? [LINGER_MARK] : []),
    '[Unit]',
    'Description=speck serve: a panel for every project on your speck projects list',
    '',
    '[Service]',
    `ExecStart=${exec}`,
    'WorkingDirectory=%h',
    ...(d.env.PATH ? [`Environment=${unitEnv('PATH', noNewline('PATH', d.env.PATH))}`] : []),
    'Restart=always',
    'RestartSec=5',
    'KillMode=process', // 0758: stopping speck serve leaves each project's speck run, and its builds, running
    '',
    '[Install]',
    'WantedBy=default.target',
    '',
  ].join('\n');
}

function plistText(d, args, log) {
  const str = s => `<string>${xml(noNewline('An argument', s))}</string>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- Written by speck serve --install. speck serve --uninstall stops and removes it. -->
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${[d.node, d.cli, 'serve', ...args].map(a => `    ${str(a)}`).join('\n')}
  </array>
  <key>WorkingDirectory</key>
  ${str(d.home)}
${d.env.PATH ? `  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    ${str(d.env.PATH)}
  </dict>
` : ''}  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  ${str(log)}
  <key>StandardErrorPath</key>
  ${str(log)}
</dict>
</plist>
`;
}

const unsupported = d => new SpeckError(`speck serve --install works on Linux, with systemd, and on a Mac, not on ${d.platform}. Start speck serve --background yourself instead.`);

// `speck serve --install [--port <n>] [--url https://<hostname>]`: the lines it prints.
export function serveInstall(args, d = machineDeps()) {
  const passed = serveArgs(args);
  if (d.platform === 'linux') return installLinux(d, passed);
  if (d.platform === 'darwin') return installMac(d, passed);
  throw unsupported(d);
}

// `speck serve --uninstall`: the lines it prints.
export function serveUninstall(args, d = machineDeps()) {
  const odd = args.find(a => a !== '--uninstall');
  if (odd !== undefined) throw new SpeckError(`speck serve --uninstall doesn't take ${odd}.`);
  if (d.platform === 'linux') return uninstallLinux(d);
  if (d.platform === 'darwin') return uninstallMac(d);
  throw unsupported(d);
}

function installLinux(d, args) {
  if (!d.user) throw new SpeckError('speck serve --install can\'t tell which user you are, so it can\'t install a service.');
  const file = unitFile(d), before = readText(file);
  const sys = (...a) => { const r = d.run('systemctl', ['--user', ...a]); return r.status === 0 ? null : failed(r, `systemctl --user ${a.join(' ')}`); };
  // Lingering starts your user's services at boot, before you log in. Turned off again by --uninstall only if it was
  // off and this turned it on, which the unit file remembers across a later --install.
  const shown = d.run('loginctl', ['show-user', d.user, '--property=Linger', '--value']);
  const lingerWasOn = shown.status === 0 && shown.stdout.trim() === 'yes';
  const markedBefore = before?.split('\n').includes(LINGER_MARK) ?? false;
  unitText(d, args, false); // refuses a path it can't write into a unit before anything changes
  let lingerNote = null, mark = markedBefore;
  if (!lingerWasOn) {
    const r = d.run('loginctl', ['enable-linger', '--no-ask-password', d.user]);
    if (r.status === 0) mark = true;
    else lingerNote = `It starts when you log in, but not at boot until lingering is on: ${failed(r, `loginctl enable-linger ${d.user}`)}. Run \`sudo loginctl enable-linger ${d.user}\` to start it at boot.`;
  }
  // From here, a failure puts back the service file as it was and turns off lingering this has just turned on.
  const undo = why => {
    putBack(file, before);
    if (mark && !markedBefore) d.run('loginctl', ['disable-linger', '--no-ask-password', d.user]);
    return new SpeckError(`speck serve's service wasn't installed, as ${why}. ${before === null ? 'Nothing was left behind.' : 'The service file is as it was.'} Check that systemd runs a user manager for you (\`systemctl --user status\`), then run this again.`);
  };
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, unitText(d, args, mark)); }
  catch (e) { throw undo(`${file} couldn't be written (${e.code || e.message})`); }
  const why = sys('daemon-reload') || sys('enable', UNIT) || sys('restart', UNIT);
  if (why) throw undo(why);
  return [
    `speck serve is installed as a systemd user service, ${UNIT}, running ${['speck serve', ...args].join(' ')}. It's running now, starts at boot and starts again if it stops.`,
    `Its service file: ${file}`,
    ...(lingerNote ? [lingerNote] : []),
    `Its status: systemctl --user status ${UNIT.replace(/\.service$/, '')}`,
    `Its log: journalctl --user -u ${UNIT.replace(/\.service$/, '')} -f`,
    'speck serve --uninstall stops and removes it.',
  ];
}

function uninstallLinux(d) {
  const file = unitFile(d), text = readText(file);
  if (text === null) return [`speck serve isn't installed as a service on this machine (there's no ${file}), so there's nothing to remove.`];
  const r = d.run('systemctl', ['--user', 'disable', '--now', UNIT]);
  if (r.status !== 0) throw new SpeckError(`speck serve's service wasn't removed, as ${failed(r, `systemctl --user disable --now ${UNIT}`)}. Its service file is still there: ${file}.`);
  try { fs.rmSync(file, { force: true }); } catch (e) { throw new SpeckError(`speck serve's service is stopped, but ${file} couldn't be removed (${e.code || e.message}). Remove it yourself.`); }
  const out = [`speck serve's service is stopped, and ${file} is removed.`];
  const reload = d.run('systemctl', ['--user', 'daemon-reload']);
  if (reload.status !== 0) out.push(`systemd still lists it until it reloads, as ${failed(reload, 'systemctl --user daemon-reload')}.`);
  if (d.user && text.split('\n').includes(LINGER_MARK)) {
    const l = d.run('loginctl', ['disable-linger', '--no-ask-password', d.user]);
    out.push(l.status === 0 ? 'Lingering is off again, as speck serve --install turned it on.' : `Lingering, which speck serve --install turned on, is still on, as ${failed(l, `loginctl disable-linger ${d.user}`)}. Run \`sudo loginctl disable-linger ${d.user}\` to turn it off.`);
  }
  return out;
}

function installMac(d, args) {
  const file = plistFile(d), before = readText(file), target = `gui/${d.uid}`;
  const log = serveFiles(d.env)?.log || path.join(d.home, '.config', 'speck', 'serve.log');
  try { fs.mkdirSync(path.dirname(log), { recursive: true, mode: 0o700 }); } catch { /* launchd says so if it can't write it */ }
  writeText(file, plistText(d, args, log));
  d.run('launchctl', ['bootout', `${target}/${LABEL}`]); // the one installed before, if any: fails when there's none
  const r = d.run('launchctl', ['bootstrap', target, file]);
  if (r.status !== 0) {
    putBack(file, before);
    throw new SpeckError(`speck serve's launch agent wasn't loaded, as ${failed(r, `launchctl bootstrap ${target} ${file}`)}. ${before === null ? 'Nothing was left behind.' : 'Its file is as it was, but it isn\'t loaded: run this again.'}`);
  }
  return [
    `speck serve is installed as a launch agent, ${LABEL}, running ${['speck serve', ...args].join(' ')}. It's running now, starts when you log in and starts again if it stops.`,
    `Its file: ${file}`,
    `Its status: launchctl print ${target}/${LABEL}`,
    `Its log: tail -f ${log}`,
    'speck serve --uninstall stops and removes it.',
  ];
}

const notLoaded = r => r.status === 3 || /no such process/i.test(r.stderr);
function uninstallMac(d) {
  const file = plistFile(d);
  if (readText(file) === null) return [`speck serve isn't installed as a launch agent on this machine (there's no ${file}), so there's nothing to remove.`];
  const target = `gui/${d.uid}/${LABEL}`, r = d.run('launchctl', ['bootout', target]);
  // bootout fails when it isn't loaded, which is fine, but only once that's certain: bootout says no such process (3),
  // or launchctl print says it can't find the service (113). Any other failure keeps the file and says so.
  if (r.status !== 0 && !notLoaded(r)) {
    const p = d.run('launchctl', ['print', target]);
    if (!(p.status === 113 || /could not find service/i.test(p.stderr))) throw new SpeckError(`speck serve's launch agent wasn't removed, as ${failed(r, `launchctl bootout ${target}`)}${p.status === 0 ? ' and it\'s still loaded' : ', and launchctl couldn\'t say whether it\'s still loaded'}. Its file is still there: ${file}.`);
  }
  try { fs.rmSync(file, { force: true }); } catch (e) { throw new SpeckError(`speck serve's launch agent is stopped, but ${file} couldn't be removed (${e.code || e.message}). Remove it yourself.`); }
  return [`speck serve's launch agent is stopped, and ${file} is removed.`];
}
