// 0662: the panel's Level picker. Sets a ticket's build level, as `speck set <id> level <name>` does, and commits only
// that ticket, as the priority picker does. A blank name blanks it, so the settings decide its builder again.
import path from 'node:path';
import { SpeckError, sh, loadConfig, findTicket, checkSetValue, checkSetTicket, setTicketField, commitTicketOnly } from './speck.mjs';
import { checkNotBeingBuilt } from './core.mjs';
import { levelProblem, ticketLevel } from './levels.mjs';

const IN_HAND = ['building', 'reviewing', 'blocked', 'approved'];

// Every refusal comes before the first write. `value` is from the URL, so only one of the project's levels, or blank,
// gets through. Returns { status, body } for the server to send.
export function panelSetLevel(repo, id, value) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id, status = t.fm.status;
  // A ticket being built in its own worktree: `speck set`'s own refusal, word for word.
  try { checkNotBeingBuilt(repo, cfg, t); } catch (e) { if (e instanceof SpeckError) return { status: 409, body: { error: e.message } }; throw e; }
  if (IN_HAND.includes(status)) return { status: 409, body: { error: `Ticket ${pad} is being built (${status}), so its level can't change until it ships.` } };
  if (status === 'done' || status === 'cancelled') return { status: 409, body: { error: `Ticket ${pad} is ${status}, so its level can't change.` } };
  const problem = levelProblem({ level: value }, cfg);
  if (problem) return { status: 422, body: { error: problem } };
  try { checkSetValue('level', value); checkSetTicket(t, cfg, 'level', value); }
  catch (e) { if (e instanceof SpeckError) return { status: 422, body: { error: e.message } }; throw e; }
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  if (ticketLevel(t.fm) === value) return { status: 200, body: { ok: true, id: pad } }; // already at that level
  const rel = path.relative(repo, t.file);
  setTicketField(repo, t, 'level', value);
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): level ${value || 'blank'}`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so its level is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}
