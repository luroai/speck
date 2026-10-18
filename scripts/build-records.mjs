// What speck run keeps about each build it launched: its run record and marks, what they say about how it ended,
// where its ticket is kept and how to resume it by hand.

import fs from 'node:fs';
import path from 'node:path';
import { sh, findTicket, worktreeList } from './core.mjs';
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
  return cmd ?? DEFAULT_RESUME_COMMAND;
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

// Where the ticket's build keeps it: the checkout its branch is in, or the main checkout before the build has started it.
export function buildTicket(repo, cfg, id) {
  const list = worktreeList(repo);
  const branch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${id}-`);
  const at = list.find(w => w.branch && branch.test(w.branch) && fs.existsSync(w.path))?.path || list[0].path;
  return { at, t: findTicket(at, id) };
}
