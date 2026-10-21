// An approved ticket in its own worktree, built by speck run, for 0356's tests on sending changes back to its build.
import fs from 'node:fs';
import path from 'node:path';
import { mergeRepo, read, TICKET } from './merge-rounds.mjs';
import { deadPid } from './blocked.mjs';
import { runsOf } from '../../scripts/speck.mjs';

export const NOTE = 'Make the export button blue, and call it "Download".';
export const ENDED = { session: 'sess-1', exited: '2026-10-21T10:00:00.000Z', exit_code: 0 };
export const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];

// mergeRepo's approved ticket (one round, a fake command reviewer), with auto_ship on in the main checkout's config,
// and a run record `record` from speck run in the main checkout's runs folder (none when null).
export function changesRepo({ record = ENDED } = {}) {
  const r = mergeRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, read(r.dir, 'speck/config.yml').replace(/^auto_ship: .*$/m, 'auto_ship: true'));
  r.g('commit', '-qam', 'auto_ship on');
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const file = path.join(runs, '0001.json');
  if (record) fs.writeFileSync(file, JSON.stringify({ id: '0001', cwd: r.wt, command: [], ...record, pid: deadPid() }));
  const ticket = () => read(r.wt, TICKET);
  const head = () => r.g('-C', r.wt, 'rev-parse', 'HEAD');
  const rec = () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
  return { ...r, runs, record: file, ticket, head, rec };
}

// The ticket's Review log section, without its heading.
export const reviewLog = text => text.split(/^## Review log$/m)[1].split(/^## /m)[0];
