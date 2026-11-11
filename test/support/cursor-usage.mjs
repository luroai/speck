// 0643: a stand-in for Cursor's CLI, `agent`, for reading its usage screen: it answers `status` as signed in, and when
// opened with no arguments draws a welcome screen, reads a line and, when that line is /usage, draws `screen`, then
// waits until it's stopped. It notes each time it's opened, with its arguments, and its own and its child's process ids.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ESC = '\u001b';

// The text of a usage screen as Cursor draws it, with these rows.
export const usageScreen = ({ plan = 'Premium', resets = 'Resets 12 Nov', included = 1, auto = 1, api = 0, onDemand = '$0', limit = 'No monthly limit' } = {}) => [
  `${ESC}[2K${ESC}[G${'─'.repeat(40)}`,
  ` Usage • ${plan}${' '.repeat(30)}${resets}`,
  ' Monthly plan and on-demand usage',
  ' Category        Current             Usage',
  ...(included === null ? [] : [` Included        ${included}% used             ${ESC}[32m█░░░░${ESC}[0m`]),
  ...(auto === null ? [] : [`   Auto          ${auto}% used             █░░░░`]),
  ...(api === null ? [] : [`   API           ${api}% used             ░░░░░`]),
  ` On-Demand       ${onDemand}                  ————`,
  ` ${limit}`,
  ' Esc to close',
].join('\r\n');

// A folder holding the stand-in: { dir, log, opened(), pids() }. `screen` is what it draws for /usage, `welcome` what it
// draws first, and `sleep` how long it waits once drawn.
export function fakeCursor({ screen = usageScreen(), welcome = '  Cursor Agent\r\n  v2026.11.11\r\n\r\n  → Plan, search, build anything\r\n' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cursor-usage-'));
  const log = path.join(dir, 'opened.log'), pids = path.join(dir, 'pids.log');
  fs.writeFileSync(path.join(dir, 'welcome.txt'), welcome);
  fs.writeFileSync(path.join(dir, 'screen.txt'), `\r\n${screen}\r\n`);
  fs.writeFileSync(path.join(dir, 'agent'), `#!/bin/sh
case "$*" in
  status) printf ' ✓ Logged in as you@example.com\\n'; exit 0 ;;
  models) printf 'auto - Auto\\n'; exit 0 ;;
esac
printf '%s\\n' "[$*]" >> "${log}"
cat "${dir}/welcome.txt"
sleep 30 &
printf '%s %s\\n' "$$" "$!" >> "${pids}"
IFS= read -r line
case "$line" in */usage*) cat "${dir}/screen.txt" ;; esac
wait
`, { mode: 0o755 });
  const lines = file => { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); } catch { return []; } };
  return { dir, log, opened: () => lines(log), pids: () => lines(pids).flatMap(l => l.split(' ').map(Number)) };
}

export const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
