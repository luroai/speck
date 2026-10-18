// A repo with a ticket blocked on its build's question, as speck run leaves it, for 0284's and 0286's tests.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { panelRepo } from './panel.mjs';
import { runsOf } from '../../scripts/speck.mjs';

export const OPTION = 'B, keep the test and fix it';
export const QUESTION = `Should the old test be removed (A) or kept and fixed (B)?\n\nRecommended: ${OPTION}\nChanges what you'd notice: no\nClear winner: yes`;
export const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
export const ENDED = { session: 'sess-1', pid: 0, exited: '2026-10-18T10:00:00.000Z', exit_code: 0 };

// A repo whose ticket 0001 is blocked on its own branch, checked out here, with `question` under Blocked question, and
// a run record `record` from speck run (none when null).
export function blockedRepo({ question = QUESTION, record = ENDED, status = 'blocked', buildCommand = null } = {}) {
  const r = panelRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  if (buildCommand !== null) fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^build_command:.*$/m, `build_command: '${buildCommand}'`));
  r.g('checkout', '-q', '-b', 'speck/0001-export-bookings');
  const raw = fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, `status: ${status}`);
  fs.writeFileSync(r.file, `${raw.replace(/\s*$/, '')}\n\n## Notes\n- A note.\n\n## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\n${question}\n`);
  r.g('commit', '-qam', 'blocked');
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const file = path.join(runs, '0001.json');
  if (record) fs.writeFileSync(file, JSON.stringify({ id: '0001', cwd: r.dir, command: [], ...record, pid: record.pid === 0 ? deadPid() : record.pid }));
  return { ...r, runs, record: file, ticket: () => fs.readFileSync(r.file, 'utf8'), head: () => r.g('rev-parse', 'HEAD') };
}
