// 0300: builds speck run didn't start, such as /speck-build in a conversation or a build resumed by hand. Each speck
// command a build runs as it works writes the build's own process into the ticket's run record, as speck run does for
// the builds it starts, so speck run counts, shows and watches it on its next check. A build resumed by hand is also
// found by its session, named on the command line that resumed it.

import fs from 'node:fs';
import path from 'node:path';
import { sh, findRepoRoot, loadConfig, padId } from './core.mjs';
import { BUILD_ENV } from './build-env.mjs';
import { pidAlive } from './run-switch.mjs';
import { saveRecord } from './build-records.mjs';
import { ticketShown, runsOf } from './speck.mjs';

// What runs a build, by the name of the program a process runs: Claude Code, Codex and Cursor's CLI (`agent`, or
// `cursor-agent`), each with the agent its run record names. A name may go on (`codex-x86_64-…`), except `agent`'s.
const AGENTS = [[/^claude/, null], [/^codex/, 'codex'], [/^(cursor-agent|agent$)/, 'cursor']];
// What a build's command may run in between it and the speck command: shells, and the commands that start one.
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'fish', 'env', 'timeout', 'nice', 'nohup', 'script', 'npx', 'npm']);

const base = w => path.basename(String(w || '')).replace(/^-/, '');

// Every process, as a Map of pid to { ppid, args }, the words of its command line.
export function processTable() {
  const r = sh('ps', ['-A', '-ww', '-o', 'pid=,ppid=,args=']);
  const rows = new Map();
  if (r.status !== 0) return rows;
  for (const line of r.stdout.split('\n')) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
    if (m) rows.set(Number(m[1]), { ppid: Number(m[2]), args: m[3].trim().split(/\s+/) });
  }
  return rows;
}

// The agent a command line runs, or undefined when it runs none: null for Claude Code, otherwise its run record's agent.
// A script run by node counts as the program it is.
function agentOf(args) {
  const names = [base(args[0])];
  if (names[0] === 'node' && args[1]) names.push(base(args[1]));
  for (const name of names) for (const [re, agent] of AGENTS) if (re.test(name)) return agent;
  return undefined;
}

// The session a build's command line names: after --session-id, --resume or -r, or after `resume` (Codex). null if none.
function sessionIn(args) {
  const i = args.findIndex((w, n) => n > 0 && ['--session-id', '--resume', '-r', 'resume'].includes(w) && args[n + 1] && !args[n + 1].startsWith('-'));
  if (i >= 0) return args[i + 1];
  const eq = args.map(w => w.match(/^--(?:session-id|resume)=(.+)$/)).find(Boolean);
  return eq ? eq[1] : null;
}

// The build this process is running in: the agent that started it, through nothing but shells, as
// { pid, session, agent, args, cwd }, or null when it isn't running in one (in a terminal, or under a test runner).
// Claude Code says its own pid and session in CLAUDE_PID and CLAUDE_CODE_SESSION_ID.
export function buildOfThisProcess({ rows = processTable(), env = process.env, pid = process.pid } = {}) {
  let at = rows.get(pid)?.ppid;
  for (let hops = 0; at && at > 1 && hops < 20; hops++) {
    const row = rows.get(at);
    if (!row) return null;
    const agent = agentOf(row.args);
    if (agent !== undefined) {
      const own = agent === null && String(env.CLAUDE_PID) === String(at) && env.CLAUDE_CODE_SESSION_ID;
      let cwd = null;
      try { cwd = fs.readlinkSync(`/proc/${at}/cwd`); } catch { /* not Linux, or not ours */ }
      return { pid: at, session: own ? env.CLAUDE_CODE_SESSION_ID : sessionIn(row.args), agent, args: row.args, cwd };
    }
    if (!SHELLS.has(base(row.args[0]))) return null;
    at = row.ppid;
  }
  return null;
}

const readRecord = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
const live = rec => !!rec && !Object.hasOwn(rec, 'exited') && Number.isInteger(rec.pid) && rec.pid > 0 && pidAlive(rec.pid);

// Writes the build this process runs in into ticket `id`'s run record in `runs`, unless speck run started it (BUILD_ENV
// is set), the record already names a build that's running, or it isn't running in a build. `status` is the ticket's:
// only a ticket a build has in hand counts. Returns the record written, or null. Never throws: a speck command never
// fails because of it.
export function noteBuild(runs, id, status, { env = process.env, build = () => buildOfThisProcess({ env }), now = new Date() } = {}) {
  try {
    if (!/^[\w-]+$/.test(String(id ?? '')) || !['building', 'reviewing'].includes(status) || env[BUILD_ENV]) return null;
    const file = path.join(runs, `${id}.json`);
    if (live(readRecord(file))) return null;
    const b = build();
    if (!b || !Number.isInteger(b.pid) || b.pid <= 0) return null;
    const rec = { id, session: b.session ?? null, ...(b.agent ? { agent: b.agent } : {}), cwd: b.cwd || path.dirname(path.dirname(path.dirname(runs))), started: now.toISOString(), pid: b.pid, command: b.args, seen: true };
    fs.mkdirSync(runs, { recursive: true });
    saveRecord(file, rec);
    return rec;
  } catch { return null; }
}

// The process of a build resumed by hand: a running process naming `session` as a word of its command line, the agent
// itself when there is one. null if none.
export function sessionProcess(session, rows = processTable()) {
  if (typeof session !== 'string' || !session) return null;
  const naming = [...rows].filter(([p, r]) => p !== process.pid && r.args.some(w => w.split('=').includes(session)));
  const pick = naming.find(([, r]) => agentOf(r.args) !== undefined) ?? naming.find(([, r]) => !naming.some(([q]) => q === r.ppid)) ?? naming[0];
  return pick ? pick[0] : null;
}

// For ticket `id`, whose build has stopped by its run record (it exited, or its pid has gone): when its session has been
// resumed by hand, the record is given that build's process in place of its exit, so it shows and counts as running.
// Returns the record written, or null.
export function claimResumed(runs, id, { find = sessionProcess } = {}) {
  const file = path.join(runs, `${id}.json`);
  const rec = readRecord(file);
  if (!rec || live(rec) || typeof rec.session !== 'string' || !rec.session) return null;
  const pid = find(rec.session);
  if (!Number.isInteger(pid) || pid <= 0 || !pidAlive(pid)) return null;
  const { exited: _e, exit_code: _c, ...kept } = rec;
  const next = { ...kept, pid, seen: true };
  try { saveRecord(file, next); } catch { return null; }
  return next;
}

// 0319: what speck run says of a running build it finds on a check: outside speck run only when its record is marked
// seen, as noteBuild and claimResumed mark it. Any other was launched or resumed by a speck run, such as a second one
// running in the same repo, which speck run's lock should prevent.
export const adoptedAs = rec => (rec?.seen === true ? 'is being built outside speck run' : 'is already being built');

// 0300: the commands a build runs as it works, each with the ticket it's for: named first, or else the ticket whose
// branch this checkout is on.
const BUILD_COMMANDS = new Set(['start', 'next', 'review', 'merge-check', 'test', 'diffstat']);
function buildTicketOf(cmd, args) {
  const named = ['start', 'next', 'review', 'merge-check'].includes(cmd) ? args.find(a => !a.startsWith('-')) : null;
  if (named) return named;
  const repo = findRepoRoot();
  const prefix = loadConfig(repo).branch_prefix;
  const branch = sh('git', ['branch', '--show-current'], { cwd: repo }).stdout.trim();
  return typeof prefix === 'string' && branch.startsWith(prefix) ? (branch.slice(prefix.length).match(/^(\w+)-/)?.[1] ?? null) : null;
}

// 0300: keeps the build this command runs in, if speck run didn't start it, in its ticket's run record (noteBuild),
// whether the command succeeded or not. Nothing it can't read stops the command.
export function noteThisBuild(cmd, args) {
  if (!BUILD_COMMANDS.has(cmd) || process.env[BUILD_ENV]) return;
  try {
    const id = buildTicketOf(cmd, args);
    if (!id || !/^\w+$/.test(id)) return;
    const repo = findRepoRoot(), shown = ticketShown(repo, id);
    if (shown) noteBuild(runsOf(repo), padId(id), shown.status);
  } catch { /* not in a repo, or no such ticket: nothing to keep */ }
}
