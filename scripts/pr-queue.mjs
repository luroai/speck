// 0295: speck run's pull request queue, used instead of its ship queue with `ship_mode: pr`. It opens the pull request
// of each approved ticket that has none, one at a time, with `speck pr <id>` in a process of its own, and says in one
// line what came of it. One that couldn't be opened is tried again once the base branch or its branch has a new commit.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { refsOf } from './ship-queue.mjs';
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

export function prQueue(repo, cfg, { say = console.log, launch = launchPr } = {}) {
  const runs = sharedCacheDir(repo, 'runs'), base = cfg.base_branch;
  const last = new Map(); // each ticket's refs at its last try
  let current = null;
  const check = tickets => {
    if (current) return;
    for (const t of tickets) {
      if (t.status !== 'approved' || t.build_running || t.pull_request?.url) continue;
      const refs = refsOf(repo, cfg, t.id), key = `${refs.base} ${refs.head}`;
      if (last.get(t.id) === key) continue;
      last.set(t.id, key);
      current = t.id;
      const log = path.join(runs, `${t.id}.pr.log`);
      say(`Opening ${t.id}'s pull request: speck pr ${t.id}. Log: ${path.relative(repo, log)}`);
      launch(repo, t.id, log, code => {
        current = null;
        const rec = readPrRecord(runs, t.id);
        if (code === 0 && typeof rec?.url === 'string') return say(`Opened ${t.id}'s pull request: ${rec.url}`);
        const why = (code !== 0 && typeof rec?.error === 'string' && rec.error) || lastLine(log) || (code === null ? 'speck pr was stopped' : `speck pr exited with ${code}`);
        say(`${t.id}'s pull request wasn't opened: ${why} speck run tries again once ${base} or its branch has a new commit.`);
      });
      return;
    }
  };
  return { check, running: () => current };
}
