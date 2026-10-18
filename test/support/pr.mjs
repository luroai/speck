// Repos in pull request mode (0295, 0296): an approved ticket in its own worktree, main pushed to a bare remote, and a
// stand-in for gh that merges into that remote.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadConfig, parseTicket } from '../../scripts/core.mjs';
import { shipRepo, gIn, env } from './ship.mjs';
import { speck } from './cli.mjs';
import { fakeGh } from './gh.mjs';

export const TICKET = 'speck/tickets/0001-export-bookings.md';
export const runs = dir => path.join(dir, 'speck', '.cache', 'runs');

// `mode` is ship_mode, and `config` any other lines to set, such as 'auto_ship: true', on both branches.
export function prRepo({ mode = 'pr', config = [] } = {}) {
  const r = shipRepo();
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  gIn(bare, 'init', '-q', '--bare', '-b', 'main');
  for (const cwd of [r.dir, r.wt]) {
    const file = path.join(cwd, 'speck', 'config.yml');
    let text = fs.readFileSync(file, 'utf8').replace(/^ship_mode: .*$/m, `ship_mode: ${mode}`);
    for (const line of config) text = text.replace(new RegExp(`^${line.split(':')[0]}: .*$`, 'm'), line);
    fs.writeFileSync(file, text);
    assert.equal(gIn(cwd, 'commit', '-qam', `ship_mode ${mode}`).status, 0);
  }
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  const gh = fakeGh();
  gh.set('remote', bare);
  const cfg = loadConfig(r.dir);
  const ticketIn = cwd => parseTicket(fs.readFileSync(path.join(cwd, TICKET), 'utf8'));
  const remoteHas = ref => gIn(bare, 'rev-parse', '--verify', '-q', ref).stdout.trim();
  return { ...r, bare, gh, cfg, ticketIn, remoteHas, cli: (cwd, ...a) => speck(cwd, gh.env(env), ...a) };
}
