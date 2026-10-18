// 0295: speck run's pull request queue, used instead of its ship queue with `ship_mode: pr`. It opens the pull request
// of each approved ticket that has none, or whose link isn't yet written on it, one at a time, with `speck pr <id>` in
// a process of its own, and says in one line what came of it. One that couldn't be opened is tried again once the base branch or its branch has a new commit.
// 0296: it ships them too, with `speck ship <id> --auto`, which merges the pull request: each one auto_ship covers, and
// each one merged on GitHub, which only needs tidying up after. It looks at each pull request with gh no more than
// once every `lookMs`, and tries one that wasn't shipped again once its pull request, the base branch or its branch changes.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { refsOf, launchShip } from './ship-queue.mjs';
import { otherShipRunning } from './ship.mjs';
import { prLook } from './pr-ship.mjs';
import { readPrRecord } from './pull-request.mjs';
import { sharedCacheDir } from './turns.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));

// Starts `speck pr <id>` from the repo in its own process group, writing to `log`. done(code) is called once as it
// ends, with null if a signal ended it or it couldn't start.
export function launchPr(repo, id, log, done) {
  let fd = null, over = false;
  const end = code => { if (!over) { over = true; done(code); } };
  try {
    fd = fs.openSync(log, 'w');
    const child = spawn(process.execPath, [CLI, 'pr', id], { cwd: repo, detached: true, stdio: ['ignore', fd, fd] });
    child.on('error', () => end(null));
    child.on('exit', code => end(code));
    child.unref();
  } catch { end(null); }
  finally { if (fd !== null) fs.closeSync(fd); }
}

const lastLine = log => { try { return fs.readFileSync(log, 'utf8').trim().split('\n').pop().trim(); } catch { return ''; } };

const LOOK_MS = 60000;

export function prQueue(repo, cfg, { say = console.log, launch = launchPr, ship = launchShip, look = id => prLook(repo, cfg, id), lookMs = LOOK_MS, now = Date.now } = {}) {
  const runs = sharedCacheDir(repo, 'runs'), base = cfg.base_branch;
  const last = new Map(); // each ticket's refs at its last try
  const looked = new Map(), shipped = new Map(); // 0296: when each pull request was last looked at, and how it was at its last ship
  let current = null;
  const check = tickets => {
    if (current) return;
    for (const t of tickets) {
      if (t.status !== 'approved' || t.build_running || (t.pull_request?.url && !t.pull_request.error)) continue;
      const refs = refsOf(repo, cfg, t.id), key = `${refs.base} ${refs.head}`;
      if (last.get(t.id) === key) continue;
      last.set(t.id, key);
      current = t.id;
      const log = path.join(runs, `${t.id}.pr.log`);
      say(`Opening ${t.id}'s pull request: speck pr ${t.id}. Log: ${path.relative(repo, log)}`);
      launch(repo, t.id, log, code => {
        current = null;
        const rec = readPrRecord(runs, t.id);
        if (code === 0 && typeof rec?.url === 'string' && !rec.error) return say(`Opened ${t.id}'s pull request: ${rec.url}`);
        const why = (code !== 0 && typeof rec?.error === 'string' && rec.error) || lastLine(log) || (code === null ? 'speck pr was stopped' : `speck pr exited with ${code}`);
        say(`${rec?.url ? `${t.id}: ` : `${t.id}'s pull request wasn't opened: `}${why} speck run tries again once ${base} or its branch has a new commit.`);
      });
      return;
    }
    for (const t of tickets) {
      if (t.status !== 'approved' || t.build_running || !t.pull_request?.url || t.pull_request.error) continue;
      if (now() - (looked.get(t.id) ?? -Infinity) < lookMs) continue;
      looked.set(t.id, now());
      const v = look(t.id);
      const merged = v?.state === 'MERGED';
      if (!merged && !(v?.state === 'OPEN' && t.auto_ship === true)) continue;
      const refs = refsOf(repo, cfg, t.id), key = `${v.key} ${refs.base} ${refs.head}`;
      if (shipped.get(t.id) === key) continue;
      if (otherShipRunning(runs)) return; // another ship: wait for it to end
      shipped.set(t.id, key);
      current = t.id;
      const log = path.join(runs, `${t.id}.ship.log`);
      say(`${merged ? `${t.id}'s pull request was merged on GitHub, so speck run is tidying up after it` : `Merging ${t.id}'s pull request`}: speck ship ${t.id} --auto. Log: ${path.relative(repo, log)}`);
      ship(repo, t.id, log, (code, error) => {
        current = null;
        if (code === 0) return say(`Shipped ${t.id}.`);
        if (code === 15) { shipped.delete(t.id); looked.delete(t.id); return; } // another ship started just before it: not a try
        say(`${t.id} didn't ship: ${error || lastLine(log) || (code === null ? 'it was stopped' : `it exited with ${code}`)} speck run tries again once its pull request, ${base} or its branch changes.`);
      });
      return;
    }
  };
  return { check, running: () => current };
}
