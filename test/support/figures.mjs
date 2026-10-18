// The README's "Built with speck" figures, worked out from done tickets as 0210 to 0254 did (0282).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './panel.mjs';

// Shipped (status done) and cancelled counts, the median minutes from a build's `started` to its `finished`, rounded,
// and the median of the Delivery log's "Review rounds" with how many were approved in round 1. Tickets without a time
// or rounds are left out of those medians.
export function builtWithSpeckFigures(tickets) {
  const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  let shipped = 0, cancelled = 0, firstRound = 0;
  const minutes = [], rounds = [];
  for (const t of tickets) {
    const status = t.match(/^status:\s*(\w+)/m)?.[1];
    if (status === 'cancelled') { cancelled++; continue; }
    if (status !== 'done') continue;
    shipped++;
    const start = t.match(/^started:\s*"?([^"\n]+)"?/m)?.[1], end = t.match(/^finished:\s*"?([^"\n]+)"?/m)?.[1];
    if (start && end) minutes.push((Date.parse(end) - Date.parse(start)) / 60000);
    const r = t.match(/^- Review rounds:\s*(\d+)/m)?.[1];
    if (r) { rounds.push(Number(r)); if (r === '1') firstRound++; }
  }
  return { shipped, cancelled, medianMinutes: Math.round(median(minutes)), medianRounds: median(rounds), firstRound };
}

// The done tickets as they were in a commit, read with git, so the figures a release was built from stay the same as
// later tickets ship. Throws when the commit is missing or can't be read.
export function doneTicketsAt(commit) {
  if (!commit) throw new Error('no commit to read the done tickets from');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const archive = spawnSync('git', ['archive', '--format=tar', commit, 'speck/tickets/done'], { cwd: ROOT, maxBuffer: 1 << 28 });
  if (archive.status !== 0) throw new Error(String(archive.stderr));
  const tar = spawnSync('tar', ['-x', '-C', dir], { input: archive.stdout });
  if (tar.status !== 0) throw new Error(String(tar.stderr));
  const done = path.join(dir, 'speck', 'tickets', 'done');
  return fs.readdirSync(done).filter(f => f.endsWith('.md')).map(f => fs.readFileSync(path.join(done, f), 'utf8'));
}
