// 0674: a ticket can start on the approved branch of the one after: ticket it still waits for. `speck start` makes its
// branch from the base branch as usual, merges that ticket's branch into it and writes that ticket's id to its built_on:
// field. Its diff is measured from that merge, and until that ticket is done on the base branch, it can't ship.

import fs from 'node:fs';
import { SpeckError, sh, git, parseTicket, setField, ticketBranches, padId } from './core.mjs';

// A ticket as `ref` has it, looked for by its id under speck/tickets/, or null when `ref` has no such ticket.
export function ticketAt(repo, ref, id) {
  const pad = padId(id);
  const ls = sh('git', ['ls-tree', '-r', '--name-only', '--full-tree', ref, '--', 'speck/tickets/'], { cwd: repo });
  if (ls.status !== 0) return null;
  const name = ls.stdout.split('\n').find(f => /^speck\/tickets\/(done\/)?[^/]+\.md$/.test(f) && baseName(f).startsWith(`${pad}-`));
  if (!name) return null;
  const shown = sh('git', ['show', `${ref}:${name}`], { cwd: repo });
  if (shown.status !== 0) return null;
  try { return { file: name, ...parseTicket(shown.stdout) }; } catch { return null; }
}
const baseName = f => f.slice(f.lastIndexOf('/') + 1);

// The id in `fm`'s built_on:, or null when it has none. speck start writes only ticket ids there, so anything else is none.
const builtOnId = fm => /^\d+$/.test(String(fm?.built_on ?? '').trim()) ? String(fm.built_on).trim() : null;

// The ticket `fm`'s build started on, while it isn't done on the base branch: { id, branch }, with its branch, or null
// once it's gone. null for a ticket built on nothing, or on a ticket that has shipped.
export function builtOnWaiting(repo, cfg, fm) {
  const v = builtOnId(fm);
  if (!v) return null;
  const id = padId(v);
  if (ticketAt(repo, cfg.base_branch, id)?.fm.status === 'done') return null;
  return { id, branch: ticketBranches(repo, cfg, id)[0] ?? null };
}

// Where the own change of a ticket built on another starts, as of `ref`: git's own merge of where `ref` meets the base
// branch and where it meets that ticket's branch, which is what speck start's merge made. Once that ticket has shipped,
// the base branch has both, so they're where `ref` meets it. null when `ref` meets them at one commit, for the usual
// merge base, as for any ticket not built on another. A tree, not a commit: use it only to diff from.
export function ownBase(repo, cfg, fm, ref = 'HEAD') {
  if (!builtOnId(fm)) return null;
  const lines = r => r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  const meets = lines(sh('git', ['merge-base', '--all', cfg.base_branch, ref], { cwd: repo }));
  const on = builtOnWaiting(repo, cfg, fm)?.branch;
  if (on) meets.push(...lines(sh('git', ['merge-base', on, ref], { cwd: repo })));
  const tips = meets.length > 1 ? lines(sh('git', ['merge-base', '--independent', ...meets], { cwd: repo })) : meets;
  if (tips.length !== 2) return null;
  // A merge with conflicts keeps git's conflict markers, as a merge round's diff does, so how they were resolved shows.
  const r = sh('git', ['merge-tree', '--write-tree', ...tips], { cwd: repo });
  const tree = r.stdout.split('\n')[0].trim();
  return (r.status === 0 || r.status === 1) && /^[0-9a-f]{40,64}$/.test(tree) ? tree : null;
}

// Merges the approved ticket `on`'s branch into the new branch checked out in `dir`, or refuses, putting it back.
export function mergeBuiltOn(dir, pad, on, base) {
  const r = sh('git', ['merge', '-q', '--no-ff', '--no-edit', '-m', `speck(${pad}): start on ${on.id}`, on.branch], { cwd: dir });
  if (r.status === 0) return;
  sh('git', ['merge', '--abort'], { cwd: dir });
  throw new SpeckError(`Ticket ${on.id}'s approved work doesn't merge cleanly with ${base}, so ${pad} can't start on it. It can start once ${on.id} has shipped.`);
}

// { why } a ticket can't start yet because of its after: list, or {} if every ticket there is done, as speck run waits
// for. `tickets` gives every ticket, with a ticket being built in another worktree as it is there, for its real status.
// { on: { id, branch } } instead when all but one are done and that one's branch has it approved, committed, so its
// build is over: the build starts on that branch's work.
export function startWaits(repo, cfg, t, tickets) {
  const after = Array.isArray(t.fm.after) ? t.fm.after.map(padId) : [];
  if (!after.length) return {};
  const status = new Map(tickets().map(x => [padId(x.fm.id), x.fm.status]));
  const waiting = [], gone = [];
  for (const id of [...new Set(after)]) {
    const s = status.get(id);
    if (s === 'done') continue;
    if (s === undefined) gone.push(`${id}, which matches no ticket`);
    else if (s === 'cancelled') gone.push(`${id}, which was cancelled`);
    else waiting.push({ id, s });
  }
  const branch = waiting.length === 1 && waiting[0].s === 'approved' && !gone.length && ticketBranches(repo, cfg, waiting[0].id)[0];
  if (branch && ticketAt(repo, branch, waiting[0].id)?.fm.status === 'approved') return { on: { id: waiting[0].id, branch } };
  const why = [];
  if (waiting.length) why.push(`Ticket ${t.fm.id} waits on ${waiting.map(w => `${w.id} (${w.s})`).join(', ')}. It can start once ${waiting.length > 1 ? 'they\'ve' : 'it\'s'} shipped.`);
  if (gone.length) why.push(goneWhy(t.fm.id, gone));
  return { why: why.length ? why.join('\n') : null };
}

// 0675: why speck run doesn't start a ready ticket because of its after: list, or null when nothing there holds it
// back: a row of `speck status --json` with starts_on can start on that approved ticket's work, as speck start allows.
// 0686: a cancelled ticket there (after_cancelled) is never waited for: it's said as speck start says it.
export function afterWait(t) {
  if (!(Array.isArray(t.waiting_on) && t.waiting_on.length) || t.starts_on) return null;
  const cancelled = Array.isArray(t.after_cancelled) ? t.after_cancelled : [];
  const waiting = t.waiting_on.filter(id => !cancelled.includes(id)), gone = t.waiting_on.filter(id => cancelled.includes(id));
  const wait = waiting.length ? `waiting for ${waiting.join(', ')}` : '';
  return gone.length ? `${wait ? `${wait}. ` : ''}${goneWhy(t.id, gone.map(id => `${id}, which was cancelled`))}` : wait;
}

// Why a ticket can't start while its after: lists tickets it will never get: each in `gone`, saying why.
const goneWhy = (id, gone) => `Ticket ${id}'s after: lists ${gone.join(', and ')}. Take ${gone.length > 1 ? 'them' : 'it'} out of after: before the ticket can start.`;

// Writes the ticket it starts on to `t`'s built_on:, as a quoted id, so it reads back as text, not a number.
export const markBuiltOn = (t, on) => fs.writeFileSync(t.file, setField(t.raw, 'built_on', JSON.stringify(on.id)));

// What `speck start` says first when it started on another ticket's work, or ''.
export const startedOn = on => on ? `Started on ticket ${on.id}'s approved work, merged in from ${on.branch}. It ships once ${on.id} has.\n` : '';

// The id of the ticket a checkout's branch is for, from its name, or null on any other branch.
export function branchTicket(repo, cfg) {
  const branch = git(['branch', '--show-current'], repo).trim();
  const m = branch.startsWith(cfg.branch_prefix) && branch.slice(cfg.branch_prefix.length).match(/^(\d{4})-/);
  return m ? m[1] : null;
}

// `speck ship` refuses a ticket built on another until that one has shipped. The ticket on its branch names it in
// built_on:, so taking it out of after: doesn't let it through.
export function builtOnCheck(repo, cfg, pad) {
  const branches = ticketBranches(repo, cfg, pad);
  if (branches.length !== 1) return; // shipTicket says why
  const on = builtOnWaiting(repo, cfg, ticketAt(repo, branches[0], pad)?.fm);
  if (on) throw new SpeckError(`Ticket ${pad} was built on ticket ${on.id}, which hasn't shipped yet, so nothing was shipped. Ship ${on.id} first, then ship ${pad}.`);
}
