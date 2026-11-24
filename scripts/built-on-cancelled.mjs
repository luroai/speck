// 0710: speck built-on <id> --rebuild | --keep, the two ways on for a ticket whose build started on another ticket's
// approved work (0674) when that ticket is then cancelled, so it will never ship and the ticket can't ship after it.
// --rebuild drops the ticket's branch and worktree and sets it ready on the base branch, without the cancelled ticket
// in after:, so its next build starts from the base branch. --keep keeps the cancelled ticket's work in the ticket:
// built_on: is cleared on its branch, so all of that work counts as the ticket's own, and an approved ticket gets a
// line in its Review log, as `speck changes` adds, so it isn't shipped until a review round has looked at all of it.
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, findRepoRoot, loadConfig, findTicket, setField, syncHeader, ticketBranches, worktreeList, padId, posix } from './core.mjs';
import { ticketAt, builtOnWaiting } from './built-on.mjs';
import { commitTicketOnly, replaceSection } from './close.mjs';
import { onBase } from './split-off.mjs';
import { changesLine, changesPending } from './changes-asked.mjs';
import { ticketsRounds } from './review.mjs';
import { shipState } from './ship.mjs';
import { handBackChanges } from './changes.mjs';
import { lastOwnTicketCommit, markStillReady } from './build-records.mjs';

const USAGE = 'Usage: speck built-on <id> --rebuild | --keep';
// Only a ticket whose build has ended: one building or reviewing has a build that may still be running.
const ENDED = ['approved', 'blocked'];

// The ticket's one branch, its copy of the ticket there and the cancelled ticket it was built on, or a refusal saying
// why, before anything is changed.
function check(repo, cfg, pad) {
  const branches = ticketBranches(repo, cfg, pad);
  if (!branches.length) throw new SpeckError(`Ticket ${pad} has no branch, so it wasn't built on another ticket's work. Nothing was changed.`);
  if (branches.length > 1) throw new SpeckError(`Ticket ${pad} has more than one branch (${branches.join(', ')}). Delete the ones you don't want, then run this again. Nothing was changed.`);
  const branch = branches[0], t = ticketAt(repo, branch, pad);
  const on = builtOnWaiting(repo, cfg, t?.fm);
  if (!on?.cancelled)
    throw new SpeckError(`Ticket ${pad} ${on ? `was built on ticket ${on.id}, which hasn't been cancelled, so it ships once ${on.id} has` : 'wasn\'t built on a ticket that was cancelled'}. Nothing was changed.`);
  if (!ENDED.includes(t.fm.status)) throw new SpeckError(`Ticket ${pad} is "${t.fm.status}", so its build may still be running. Run this once it's approved or blocked. Nothing was changed.`);
  if (shipState(runsOf(repo), pad)?.running) throw new SpeckError(`Ticket ${pad} is being shipped now. Nothing was changed.`);
  return { branch, t, on };
}

const runsOf = repo => path.join(worktreeList(repo)[0]?.path || repo, 'speck', '.cache', 'runs');

// The ticket's after: without `id`, as the JSON list setField writes.
const afterWithout = (fm, id) => JSON.stringify((Array.isArray(fm.after) ? fm.after : []).map(padId).filter(a => a !== id));

export function rebuild(repo, cfg, pad) {
  const { branch, on } = check(repo, cfg, pad);
  const wt = worktreeList(repo).find(w => w.branch === branch);
  if (wt && wt.path === worktreeList(repo)[0]?.path)
    throw new SpeckError(`Ticket ${pad}'s branch is checked out in the main checkout. Switch it back to ${cfg.base_branch}, then run this again. Nothing was changed.`);
  if (wt) {
    if (sh('git', ['status', '--porcelain'], { cwd: wt.path }).stdout.trim())
      throw new SpeckError(`Ticket ${pad}'s worktree at\n${wt.path}\nhas uncommitted changes. Commit or remove them, then run this again. Nothing was changed.`);
    const here = path.resolve(process.cwd()), there = path.resolve(wt.path);
    if (here === there || here.startsWith(there + path.sep))
      throw new SpeckError(`This removes ticket ${pad}'s worktree, which you're in. Run it from the main checkout. Nothing was changed.`);
  }
  const head = sh('git', ['rev-parse', branch], { cwd: repo }).stdout.trim();
  onBase(repo, cfg, main => {
    const t = findTicket(main, pad), rel = posix(path.relative(main, t.file));
    if (sh('git', ['status', '--porcelain', '--', rel], { cwd: main }).stdout.trim())
      throw new SpeckError(`${rel} has uncommitted changes on ${cfg.base_branch}. Commit or undo them, then run this again. Nothing was changed.`);
    if (['done', 'cancelled'].includes(t.fm.status)) throw new SpeckError(`Ticket ${pad} is ${t.fm.status} on ${cfg.base_branch}, so it isn't built again. Nothing was changed.`);
    const text = syncHeader(setField(setField(t.raw, 'after', afterWithout(t.fm, on.id)), 'status', 'ready'));
    if (text !== t.raw) {
      // speck run launches a ticket only once, unless it's committed since its build ended still ready (0327).
      const then = lastOwnTicketCommit(main, rel, pad);
      fs.writeFileSync(t.file, text);
      const c = commitTicketOnly(main, t.file, t.raw, `speck(${pad}): rebuild from ${cfg.base_branch}, as ${on.id} was cancelled`);
      if (c.status !== 0) throw new SpeckError(`Couldn't commit ${rel} on ${cfg.base_branch}, so nothing was changed:\n${(c.stderr || c.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
      try { if (then) markStillReady(runsOf(repo), pad, then); } catch { /* no run record: speck run never launched it */ }
    }
  }, `set ticket ${pad} ready again, so nothing was changed`);
  if (wt) {
    const r = sh('git', ['worktree', 'remove', '--force', wt.path], { cwd: repo });
    if (r.status !== 0) throw new SpeckError(`Ticket ${pad} is ready again on ${cfg.base_branch}, but its worktree at ${wt.path} couldn't be removed:\n${r.stderr.trim()}\nRemove it and delete ${branch}, then it can be built again.`);
  }
  const d = sh('git', ['branch', '-D', branch], { cwd: repo });
  if (d.status !== 0) throw new SpeckError(`Ticket ${pad} is ready again on ${cfg.base_branch}, but its branch ${branch} couldn't be deleted:\n${d.stderr.trim()}\nDelete it, then it can be built again.`);
  return `Ticket ${pad} is ready again on ${cfg.base_branch}, without ${on.id} in after:, and its branch and worktree are gone, so its next build starts from ${cfg.base_branch}. Its old work was at ${head.slice(0, 12)}: \`git branch ${branch} ${head.slice(0, 12)}\` brings it back.`;
}

export function keep(repo, cfg, pad, now = new Date()) {
  const { branch, on } = check(repo, cfg, pad);
  const wt = worktreeList(repo).find(w => w.branch === branch);
  if (!wt) throw new SpeckError(`Ticket ${pad}'s branch, ${branch}, isn't checked out, so the change can't be committed there. Check it out, then run this again. Nothing was changed.`);
  const t = findTicket(wt.path, pad), rel = posix(path.relative(wt.path, t.file));
  if (sh('git', ['status', '--porcelain', '--', rel], { cwd: wt.path }).stdout.trim())
    throw new SpeckError(`${rel} has uncommitted changes in ${wt.path}. Commit or undo them, then run this again. Nothing was changed.`);
  let text = setField(setField(t.raw, 'built_on', '""'), 'after', afterWithout(t.fm, on.id));
  const all = ticketsRounds(wt.path, t);
  const review = t.fm.status === 'approved' && !changesPending(t.raw, all).length;
  const note = `Ticket ${on.id}, which this ticket was built on, was cancelled, so its work is kept in this ticket: review the whole change against ${cfg.base_branch} as this ticket's own.`;
  const line = changesLine(note, all.length, now);
  if (review) text = /^## Review log\s*$/m.test(text) ? replaceSection(text, 'Review log', old => [old, line].filter(Boolean).join('\n'), rel) : `${text.replace(/\n*$/, '')}\n\n## Review log\n${line}\n`;
  fs.writeFileSync(t.file, syncHeader(text));
  const c = commitTicketOnly(wt.path, t.file, t.raw, `speck(${pad}): keep ${on.id}'s work, as it was cancelled`);
  if (c.status !== 0) throw new SpeckError(`Couldn't commit ${rel}, so nothing was changed:\n${(c.stderr || c.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  const resumed = review && handBackChanges(repo, cfg, pad, note, sh('git', ['rev-parse', 'HEAD'], { cwd: wt.path }).stdout.trim(), now);
  return `Ticket ${pad} keeps ${on.id}'s work as its own. ${!review ? `Its next review round looks at all of it: run /speck-build ${pad} to carry on.`
    : `It won't ship until a review round has looked at all of it: ${resumed || `run /speck-build ${pad} to review it again.`}`}`;
}

export function cmdBuiltOn(args) {
  const id = args.find(a => !a.startsWith('--')), mode = ['--rebuild', '--keep'].filter(m => args.includes(m));
  if (!id || mode.length !== 1) throw new SpeckError(USAGE);
  const repo = findRepoRoot(), cfg = loadConfig(repo), pad = findTicket(repo, id).fm.id;
  console.log(mode[0] === '--rebuild' ? rebuild(repo, cfg, pad) : keep(repo, cfg, pad));
}
