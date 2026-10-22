// What speck run keeps about each build it launched: its run record and marks, what they say about how it ended,
// where its ticket is kept and how to resume it by hand.

import fs from 'node:fs';
import path from 'node:path';
import { sh, findTicket, worktreeList, parseTicket } from './core.mjs';
import { splitCommand } from './reviewers.mjs';
import { CODEX_RESUME_COMMAND } from './codex-build.mjs';
import { cursorResumeCommand } from './cursor-build.mjs';
import { ownBuilder } from './build-model.mjs';
import { pidAlive } from './run-switch.mjs';
import { sessionInUse } from './build-procs.mjs';

export const DEFAULT_RESUME_COMMAND = 'claude --resume {session}';

// A word for a POSIX shell: as it is when it's only letters, digits, /, ., _ and -, otherwise in single quotes.
const shellWord = w => (/^[A-Za-z0-9\/._-]+$/.test(w) ? w : `'${w.replace(/'/g, "'\\''")}'`);

// The command that resumes a build's session by hand, {session} standing for it and {id} for its ticket: resume_command
// in speck/config.yml, or the default if it isn't set. 0289: for a Codex build (`codex`, which speck run's own Codex
// command builds), the Codex default, unless resume_command is set to something other than Claude Code's. 0290: the same
// for a Cursor build (`cursor`), with Cursor's. `agent` is the agent that ran the build: by default, speck run's own.
export function resumeCommandOf(cfg, agent = ownBuilder(cfg)) {
  const cmd = !Object.hasOwn(cfg, 'resume_command') ? null : typeof cfg.resume_command === 'string' ? cfg.resume_command.trim() : '';
  let first = '';
  try { first = splitCommand(cmd ?? '')[0] ?? ''; } catch { /* an unclosed quote: used as it is */ }
  if ((agent === 'codex' || agent === 'cursor') && (cmd === null || path.basename(first) === 'claude'))
    return agent === 'codex' ? CODEX_RESUME_COMMAND : cursorResumeCommand();
  // 0312: a Claude Code build speck run started with its own command, while resume_command resumes another agent's
  if (agent === 'claude' && cmd && path.basename(first) !== 'claude') return DEFAULT_RESUME_COMMAND;
  return cmd ?? DEFAULT_RESUME_COMMAND;
}

// The session a build launched by `speck run` ran in, from its run record: {id, cwd}, where cwd is the folder the build
// started from (where its session is kept), or null when there's no record, it can't be read or it lacks either.
// 0289: with resume_command too when the agent that ran the build (Codex, or Cursor: 0290) resumes it with another
// command than `board`'s.
export function buildSession(runs, id, cfg, board) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return null; }
  const text = v => typeof v === 'string' && v !== '';
  if (!rec || typeof rec !== 'object' || !text(rec.session) || !text(rec.cwd)) return null;
  const own = resumeCommandOf(cfg, rec.agent ?? null);
  return { id: rec.session, cwd: rec.cwd, ...(own !== board ? { resume_command: own } : {}) };
}

// How to resume a killed build by hand, with resumeCommandOf.
export function resumeHint(cfg, rec) {
  const session = typeof rec?.session === 'string' && rec.session ? rec.session : null;
  if (!session) return 'Run /speck-build to carry it on.';
  const cmd = resumeCommandOf(cfg, rec.agent ?? null);
  if (!cmd) return `Resume session ${session} to carry it on.`;
  const cwd = typeof rec.cwd === 'string' && rec.cwd ? `cd ${shellWord(rec.cwd)} && ` : '';
  return `To carry it on, run: ${cwd}${cmd.split('{session}').join(shellWord(session)).split('{id}').join(String(rec.id ?? ''))}`;
}

// Written to a temporary file and renamed into place, so nothing reading it sees half of it.
export function saveRecord(file, rec) {
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify(rec, null, 2)}\n`); fs.renameSync(tmp, file); }
  catch (e) { fs.rmSync(tmp, { force: true }); throw e; }
}

// True if `speck stop` ended the build in this run record: a <id>.stopped file beside it names its session and pid.
export function stoppedBySpeck(recordFile) {
  try {
    const rec = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    const mark = JSON.parse(fs.readFileSync(recordFile.replace(/\.json$/, '.stopped'), 'utf8'));
    return !!rec && typeof rec === 'object' && !!mark && typeof mark === 'object' && Number.isInteger(mark.pid) && mark.pid === rec.pid && mark.session === rec.session;
  } catch { return false; }
}

// True if the build's log holds the result a stream-json build writes as it ends by itself. A build that was killed
// never writes one. A build_command without stream-json output writes none either, so each of its ends counts as a kill.
function logEnded(log) {
  let text;
  try { text = fs.readFileSync(log, 'utf8'); } catch { return false; }
  return text.split('\n').some(l => { if (!l.startsWith('{')) return false; try { return JSON.parse(l)?.type === 'result'; } catch { return false; } });
}

// The run record of a build that was killed: no exit recorded, a pid that has gone, not ended by `speck stop`, and
// no sign in its log that it ended by itself. null for any other build, or no readable record.
export function buildKilled(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const file = path.join(runs, `${id}.json`);
  let rec;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || Array.isArray(rec) || Object.hasOwn(rec, 'exited')) return null;
  if (!Number.isInteger(rec.pid) || rec.pid <= 0 || pidAlive(rec.pid)) return null;
  if (stoppedBySpeck(file) || logEnded(path.join(runs, `${id}.log`)) || sessionInUse(rec.session)) return null;
  return rec;
}

// The last commit that changed a ticket file, as a hash ('' if none), in the checkout `dir` it's read from.
export const lastTicketCommit = (dir, rel) => { const r = sh('git', ['log', '-1', '--format=%H', '--', rel], { cwd: dir }); return r.status === 0 ? r.stdout.trim() : ''; };

// The subject every commit `speck foreman` makes to a ticket starts with.
export const foremanSubject = id => `speck(${id}): Foreman:`;

// 0349: the last commit at `rev` that changed a ticket file and isn't the Foreman's, as a hash ('' if none, or if git
// doesn't know `rev`), so a note the Foreman commits doesn't count as the ticket being committed again.
export function lastOwnTicketCommit(dir, rel, id, rev = 'HEAD') {
  if (rev !== 'HEAD' && !/^[0-9a-f]{4,64}$/i.test(rev)) return '';
  const r = sh('git', ['log', '--format=%H %s', rev, '--', rel], { cwd: dir });
  if (r.status !== 0) return '';
  const own = r.stdout.split('\n').find(l => l && !l.slice(l.indexOf(' ') + 1).startsWith(foremanSubject(id)));
  return own ? own.split(' ')[0] : '';
}

// 0327: a build that ended with its ticket still ready never started it. Its run record keeps the ticket's last commit
// as it ended, so speck run can tell once the ticket has been committed since: set ready again, or changed while ready.
export function markStillReady(runs, id, commit) {
  const file = path.join(runs, `${id}.json`);
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) throw new Error('it isn\'t a JSON object');
  saveRecord(file, { ...rec, still_ready_commit: commit });
}

// True once the ticket `t` has a commit other than the one its last build kept as it ended still ready, leaving out the
// Foreman's (0349) on both sides. False when none was kept, or `speck stop` ended that build (heldByStop decides those).
export function readyAgain(repo, runs, t) {
  const file = path.join(runs, `${t.id}.json`);
  let rec;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return false; }
  if (typeof rec?.still_ready_commit !== 'string' || stoppedBySpeck(file)) return false;
  const dir = t.worktree || repo;
  const now = lastOwnTicketCommit(dir, t.path, t.id);
  const then = lastOwnTicketCommit(dir, t.path, t.id, rec.still_ready_commit) || rec.still_ready_commit;
  return now !== '' && now !== then;
}

// True for a ticket whose last build `speck stop` ended, until the ticket has a commit other than the one it had when
// it was stopped (set ready again, for example). A ticket still ready because blocking it failed isn't launched again.
export function heldByStop(repo, runs, t) {
  const file = path.join(runs, `${t.id}.json`);
  if (!stoppedBySpeck(file)) return false;
  let mark = null;
  try { mark = JSON.parse(fs.readFileSync(file.replace(/\.json$/, '.stopped'), 'utf8')); } catch { /* unreadable: held */ }
  return typeof mark?.ticket_commit !== 'string' || mark.ticket_commit === lastTicketCommit(t.worktree || repo, t.path);
}

// 0376: true once the ticket `t` has been committed ready since `speck stop` ended its last build: its last commit
// where it's read from isn't the one it had as it was stopped, and has it ready. The stop's own commit blocks it.
export function readyAfterStop(repo, runs, t) {
  const file = path.join(runs, `${t.id}.json`);
  if (!stoppedBySpeck(file)) return false;
  let mark;
  try { mark = JSON.parse(fs.readFileSync(file.replace(/\.json$/, '.stopped'), 'utf8')); } catch { return false; }
  const dir = t.worktree || repo, now = lastTicketCommit(dir, t.path);
  if (!now || typeof mark?.ticket_commit !== 'string' || now === mark.ticket_commit) return false;
  const r = sh('git', ['show', `${now}:${t.path}`], { cwd: dir });
  try { return r.status === 0 && parseTicket(r.stdout).fm.status === 'ready'; } catch { return false; }
}

// Where the ticket's build keeps it:the checkout its branch is in, or the main checkout before the build has started it.
export function buildTicket(repo, cfg, id) {
  const list = worktreeList(repo);
  const branch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${id}-`);
  const at = list.find(w => w.branch && branch.test(w.branch) && fs.existsSync(w.path))?.path || list[0].path;
  return { at, t: findTicket(at, id) };
}

// Whether the ticket at `rel` is ready in the base branch's latest commit. A ticket set ready but not committed, or
// never committed at all, isn't: `speck start` would refuse it.
export function readyOnBase(repo, base, rel) {
  const r = sh('git', ['show', `refs/heads/${base}:${rel}`], { cwd: repo });
  if (r.status !== 0) return false;
  try { return parseTicket(r.stdout).fm.status === 'ready'; } catch { return false; }
}
