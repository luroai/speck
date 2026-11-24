// 0721: helpers that keep an idle board check from re-reading done tickets' build logs or re-asking git about them.
// Only the expensive answers are kept — by the files or commits they depend on — so spend, settings and waiting_on
// still update on every check.

import fs from 'node:fs';
import path from 'node:path';

const fileKey = file => {
  try { const s = fs.statSync(file, { bigint: true }); return `${s.dev}:${s.ino}:${s.size}:${s.mtimeNs}:${s.ctimeNs}`; }
  catch { return ''; }
};

// buildExit as last computed for a ticket, keyed by its run record and log. Unchanged ones aren't opened again.
const exits = new Map(); // runs/id → { key, value }

export function cachedBuildExit(runs, id, compute) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const key = `${fileKey(path.join(runs, `${id}.json`))}|${fileKey(path.join(runs, `${id}.log`))}`;
  const slot = `${runs}\0${id}`, had = exits.get(slot);
  if (had?.key === key) return had.value;
  const value = compute();
  exits.set(slot, { key, value });
  return value;
}

// shippedCriteriaChanged as last computed, keyed by the base tip and the criteria text. Unchanged ones start no git.
const shipped = new Map(); // key → bool
const tips = new Map(); // repo\0branch → tip (one rev-parse per check's first ask)

export function cachedShipped(repo, branch, pad, body, tipOf, compute) {
  const tipKey = `${repo}\0${branch}`;
  let tip = tips.get(tipKey);
  if (tip === undefined) { tip = tipOf(); tips.set(tipKey, tip); }
  const key = `${tipKey}\0${tip}\0${pad}\0${body}`;
  if (shipped.has(key)) return shipped.get(key);
  const value = compute();
  shipped.set(key, value);
  return value;
}

// Drop tip cache between board checks so a new tip is seen; exit and shipped answers stay until their own keys change.
export function beginBoardCheck() { tips.clear(); }
