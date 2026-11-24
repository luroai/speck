// 0721: a done or cancelled ticket's board entry as last built, keyed by the ticket file and its run records.
// Unchanged ones aren't built again, so an idle check reads no done ticket's build log and starts no git for it.

import fs from 'node:fs';
import path from 'node:path';
import { padId } from './core.mjs';

const closedBoard = new Map(); // pad id → { key, entry, shipped }

const fileKey = file => {
  try { const s = fs.statSync(file, { bigint: true }); return `${s.dev}:${s.ino}:${s.size}:${s.mtimeNs}:${s.ctimeNs}`; }
  catch { return ''; }
};

export const closedDeps = (runs, id, ticketFile) => {
  const pad = padId(id);
  return [ticketFile, path.join(runs, `${pad}.json`), path.join(runs, `${pad}.log`),
    path.join(runs, `${pad}.ship.json`), path.join(runs, `${pad}.pr.json`)].map(fileKey).join('|');
};

// The cached board entry for a closed ticket when its deps are unchanged, or null.
export function closedHit(runs, id, ticketFile) {
  const pad = padId(id), key = closedDeps(runs, id, ticketFile), had = closedBoard.get(pad);
  return had?.key === key ? { pad, entry: { ...had.entry }, shipped: had.shipped } : null;
}

export function keepClosed(id, runs, ticketFile, entry, shipped) {
  closedBoard.set(padId(id), { key: closedDeps(runs, id, ticketFile), entry: { ...entry }, shipped });
}

export function sweepClosed(seen) {
  for (const id of closedBoard.keys()) if (!seen.has(id)) closedBoard.delete(id);
}
