// 0686: a ticket can be cancelled on its own branch during its build, for example when speck takes a blocked
// question's recommendation to cancel it. That cancel is committed only on the branch, so once the build has ended,
// speck run cancels the ticket on the base branch too, as `speck cancel` does, so no ticket waits for it in after:.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, git, findTicket, setField, syncHeader, waitFields, placeTicket, ticketBranches, padId, posix } from './core.mjs';
import { commitTicketOnly } from './close.mjs';
import { ticketAt } from './built-on.mjs';

// Cancels ticket `id` in the main checkout `repo`, on the base branch, when its branch has it cancelled: with the
// branch's cancel_reason and cancelled date, filed in speck/tickets/done/, committing only that ticket. Returns
// 'cancelled', or null when there's nothing to do. Throws a SpeckError saying why when it can't, changing nothing.
export function cancelOnBase(repo, cfg, id) {
  if (!/^\d+$/.test(String(id ?? ''))) return null;
  const pad = padId(id);
  const branch = ticketBranches(repo, cfg, pad).find(b => ticketAt(repo, b, pad)?.fm.status === 'cancelled');
  if (!branch) return null;
  const from = ticketAt(repo, branch, pad).fm;
  let t;
  try { t = findTicket(repo, pad); } catch { return null; }
  if (['done', 'cancelled'].includes(t.fm.status)) return null;
  const on = git(['branch', '--show-current'], repo).trim();
  if (on !== cfg.base_branch) throw new SpeckError(`the main checkout is on "${on}", not ${cfg.base_branch}`);
  const rel = posix(path.relative(repo, t.file));
  if (sh('git', ['status', '--porcelain', '--', rel], { cwd: repo }).stdout.trim())
    throw new SpeckError(`${rel} has uncommitted changes in the main checkout. Commit or undo them`);
  let text = setField(t.raw, 'cancel_reason', JSON.stringify(String(from.cancel_reason ?? '')));
  text = setField(text, 'cancelled', String(from.cancelled ?? new Date().toISOString().slice(0, 10)));
  const original = t.raw, was = t.file;
  fs.writeFileSync(t.file, syncHeader(waitFields(setField(text, 'status', 'cancelled'), t.fm.status, 'cancelled')));
  try { placeTicket(repo, t, 'cancelled'); } catch (e) { fs.writeFileSync(was, original); throw e; }
  const commit = commitTicketOnly(repo, t.file, original, `speck(${pad}): cancelled on ${branch}`, was);
  if (commit.status !== 0) throw new SpeckError(`committing it failed: ${(commit.stderr || commit.stdout || '').trim().split('\n').pop() || 'git gave no reason'}`);
  return 'cancelled';
}

// speck run's part: each build that ended is checked once, and one that can't be cancelled on the base branch yet is
// said once and tried again at each check until it can, or until there's nothing left to do.
export function cancelledQueue({ repo, readConfig, say = line => console.log(line) }) {
  const pending = new Set(), said = new Set();
  const attempt = id => {
    let base = 'the base branch';
    try {
      const cfg = readConfig();
      base = cfg.base_branch;
      const done = cancelOnBase(repo, cfg, id);
      pending.delete(id); said.delete(id);
      if (done) say(`${id} was cancelled on its branch, so speck run cancelled it on ${base} too, filed in speck/tickets/done/.`);
    } catch (e) {
      if (said.has(id)) return;
      said.add(id);
      say(`${id} was cancelled on its branch, but speck run couldn't cancel it on ${base}: ${e instanceof SpeckError ? e.message : e?.message || e}. It tries again at its next check.`);
    }
  };
  return {
    ended(id) { const pad = padId(id); pending.add(pad); attempt(pad); },
    check() { for (const id of [...pending]) attempt(id); },
  };
}
