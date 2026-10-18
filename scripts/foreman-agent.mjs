// 0287: the Foreman agent. With foreman_fixing: fix, when work stops for a reason speck has no steps for (a ship refused
// for a reason it doesn't hand back to the build, or a build that ends with its ticket neither approved nor blocked),
// speck run starts an agent with a short brief to look into it. The agent follows the speck-foreman skill and does one
// thing, through `speck foreman <action>`: resume the build with an instruction, re-run the ship once, make a draft fix
// ticket or ask the user one question. Each is noted in the ticket's Notes and shown in the Foreman's status detail.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, sh, loadConfig, worktreeList, ticketBranches, findRepoRoot } from './core.mjs';
import { replaceSection, commitTicketOnly } from './close.mjs';
import { buildTicket, saveRecord } from './build-records.mjs';
import { readableLog } from './build-log.mjs';
import { resumeFor } from './hand-back.mjs';
import { pidAlive } from './run-switch.mjs';
import { runWords } from './go-with.mjs';
import { fixingOf } from './foreman.mjs';
import { statusData } from './speck.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));

// None is <id>.json or <id>.log, so nothing that reads the runs folder's build records takes them for one.
const STATE = 'run.foreman-agent.json'; // speck run's: the agent running, those waiting, what it has looked into
const DID = 'run.foreman-did.jsonl'; // the agent's actions, one JSON object a line, written by `speck foreman`
const LOG = 'run.foreman-agent.log'; // the agent's output, from its latest run

// The agents the Foreman can run on, and what each action is.
export const FOREMAN_AGENTS = Object.freeze(['claude', 'codex']);
export const ACTIONS = Object.freeze({
  resume: 'resumed its build',
  reship: 'asked speck run to ship it again, once',
  fix: 'made a draft fix ticket',
  ask: 'asked you',
});
const RECENT = 5; // how many of its actions the status detail shows

// The agent the Foreman runs on: foreman when it's set, otherwise the builder when that's Codex, otherwise Claude Code.
export const foremanAgentOf = cfg => (FOREMAN_AGENTS.includes(cfg?.foreman) ? cfg.foreman
  : cfg?.builder === 'codex' ? 'codex' : 'claude');
const textOf = v => (typeof v === 'string' ? v.trim() : '');

// The skill the agent follows, as the agent finds it in the repo.
export const skillPath = agent => `${agent === 'codex' ? '.agents' : '.claude'}/skills/speck-foreman/SKILL.md`;

// The brief the agent starts with: the ticket, what happened, the last lines of its log and what it may do.
export function foremanBrief({ id, what, log, tail, agent = 'claude' }) {
  const cli = 'node .speck/scripts/speck.mjs foreman';
  return [
    `You are speck's Foreman. Work on ticket ${id} stopped for a reason speck has no steps for, and speck run asked you to look into it.`,
    `What happened: ${what}`,
    `Last lines of ${log}:`,
    tail || '(the log is empty or missing)',
    '',
    `Follow the speck-foreman skill (${skillPath(agent)}). Find out why it stopped, then do exactly one of these, with --why saying why in a sentence:`,
    `- ${cli} resume ${id} "<what the build should do>" --why="..."   resume the ticket's build with an instruction`,
    `- ${cli} reship ${id} --why="..."   have speck run ship it again, once (only an approved ticket auto_ship covers)`,
    `- ${cli} fix ${id} "<title of the fix ticket>" --why="..."   make a draft fix ticket for what's broken`,
    `- ${cli} ask ${id} "<one question for the user>" --why="..."   ask the user, in one line`,
    'Never set a ticket ready, approve work, ship anything yourself, merge, push or change any code or file by hand.',
  ].join('\n');
}

// The command that starts the agent with `brief`, on foreman_model and foreman_effort when they're set. Claude Code may
// only read and run speck and read-only git commands; Codex has no such list, so it runs as Codex builds do.
export function foremanArgv(cfg, brief) {
  const agent = foremanAgentOf(cfg), model = textOf(cfg?.foreman_model), effort = textOf(cfg?.foreman_effort);
  if (agent === 'codex')
    return ['codex', 'exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(model ? ['-m', model] : []),
      ...(effort ? ['-c', `model_reasoning_effort="${effort}"`] : []), brief];
  return ['claude', '-p', brief, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'dontAsk',
    ...(model ? ['--model', model] : []), ...(effort ? ['--effort', effort] : []),
    '--allowedTools', 'Read', 'Grep', 'Glob', 'Bash(node .speck/scripts/speck.mjs:*)', 'Bash(git log:*)', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git show:*)'];
}

// The subject of the commits `speck foreman` makes, which don't count as new commits on the ticket.
const foremanSubject = id => `speck(${id}): Foreman:`;
const ref = (repo, name) => { const r = sh('git', ['rev-parse', '--verify', '-q', name], { cwd: repo }); return r.status === 0 ? r.stdout.trim() : ''; };

// True when `to` is `from` with only `speck foreman`'s commits on top, so the ship queue doesn't take its notes as new
// work to ship.
export function foremanOnly(repo, id, from, to) {
  if (!from || !to || from === to) return from === to;
  if (sh('git', ['merge-base', '--is-ancestor', from, to], { cwd: repo }).status !== 0) return false;
  const r = sh('git', ['log', '--format=%s', `${from}..${to}`], { cwd: repo });
  const subjects = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  return subjects.length > 0 && subjects.every(s => s.startsWith(foremanSubject(id)));
}

// The commits a stop is looked into for: the base branch's and the ticket branch's latest commit that isn't the
// Foreman's own, so the Foreman's notes don't make the same stop count as a new one.
export function codeKey(repo, cfg, id) {
  let branches = [];
  try { branches = ticketBranches(repo, cfg, id); } catch { /* unreadable: no branch */ }
  let head = '';
  if (branches.length === 1) {
    const r = sh('git', ['log', '-1', '--format=%H', '--invert-grep', '--fixed-strings', `--grep=${foremanSubject(id)}`, `refs/heads/${branches[0]}`], { cwd: repo });
    head = r.status === 0 ? r.stdout.trim() : '';
  }
  return `${ref(repo, `refs/heads/${cfg.base_branch}`)} ${head}`;
}

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };

// speck run's record of the Foreman agent: { running: { id, token, pid, key, what, started } | null, queue: [{ id, key,
// what, log }], tried: { <id>: key }, resumes: [{ id, message }] }.
export function readAgentState(runs) {
  const s = readObject(path.join(runs, STATE)) || {};
  const list = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && typeof x.id === 'string') : []);
  const tried = Object.create(null);
  if (s.tried && typeof s.tried === 'object') for (const [k, v] of Object.entries(s.tried)) if (typeof v === 'string') tried[k] = v;
  const r = s.running;
  return { running: r && typeof r === 'object' && typeof r.id === 'string' && typeof r.token === 'string' ? r : null, queue: list(s.queue), tried, resumes: list(s.resumes) };
}
const saveAgentState = (runs, s) => saveRecord(path.join(runs, STATE), { ...s, tried: { ...s.tried } });

// The agent's actions, oldest first, each { run, id, action, text, why, at, status, fix_id? }.
export function readActions(runs) {
  let text = '';
  try { text = fs.readFileSync(path.join(runs, DID), 'utf8'); } catch { return []; }
  return text.split('\n').flatMap(line => {
    try { const v = JSON.parse(line); return v && typeof v === 'object' && typeof v.id === 'string' && Object.hasOwn(ACTIONS, v.action) ? [v] : []; } catch { return []; }
  });
}

// What the Foreman's status detail shows of the agent: the stop it's looking into, those waiting, its last actions
// (newest first) and its questions still waiting for you: those whose ticket is still as it was when it asked.
export function agentView(runs, tickets = []) {
  const s = readAgentState(runs), actions = readActions(runs);
  const statusOf = new Map((Array.isArray(tickets) ? tickets : []).filter(t => t && typeof t === 'object').map(t => [String(t.id), t.status]));
  const latest = new Map(actions.map(a => [a.id, a]));
  const asks = [...latest.values()].filter(a => a.action === 'ask' && statusOf.has(a.id) && statusOf.get(a.id) === a.status)
    .map(a => ({ id: a.id, question: textOf(a.text), at: textOf(a.at) }));
  return {
    running: s.running ? { id: s.running.id, what: textOf(s.running.what) } : null,
    waiting: s.queue.map(q => q.id),
    did: actions.slice(-RECENT).reverse().map(a => ({ id: a.id, action: a.action, did: ACTIONS[a.action], text: textOf(a.text), why: textOf(a.why), at: textOf(a.at), ...(a.fix_id ? { fix_id: a.fix_id } : {}) })),
    asks,
  };
}

// The last `n` readable lines of a log, or '' when there's none.
export function logTail(file, n = 15) {
  try { return readableLog(fs.readFileSync(file, 'utf8')).replace(/\s+$/, '').split('\n').slice(-n).join('\n'); } catch { return ''; }
}

// Starts the agent in its own process group, so stopping speck run leaves it running, writing to its log. Returns
// { pid, exited } (exited() true once it has ended), or { error }.
function spawnAgent(argv, cwd, log, env) {
  let fd = null, ended = false;
  try {
    fd = fs.openSync(log, 'w');
    const child = spawn(argv[0], argv.slice(1), { cwd, detached: true, stdio: ['ignore', fd, fd], env });
    child.on('error', () => { ended = true; });
    child.on('exit', () => { ended = true; });
    child.unref();
    return { pid: child.pid, exited: () => ended };
  } catch (e) { return { error: e.message }; } finally { if (fd !== null) fs.closeSync(fd); }
}

// speck run's side. stuck({ id, what, log }) takes a stop speck has no steps for; check(tickets), on each of its checks,
// starts the agent for the next one waiting, at most one at a time, carries out what an agent that has ended asked for
// and resumes builds it asked to, while a build slot is free. Each ticket is looked into at most once for the same
// commits (codeKey). `ships` is speck run's ship queue, whose again(id) ships a ticket once more.
export function foremanAgentQueue({ repo, runs, readConfig, words, cfg, max, running, startBuild, ships,
  start = spawnAgent, key = id => codeKey(repo, cfg, id), alive = pidAlive, say = console.log }) {
  let child = null; // the agent this speck run started: { token, exited }
  const config = () => { try { return readConfig(); } catch { return null; } };
  const save = s => { try { saveAgentState(runs(), s); return true; } catch (e) { say(`The Foreman couldn't save its record (${e.message}), so it tries again on speck run's next check.`); return false; } };

  const stuck = ({ id, what, log }) => {
    const c = config();
    if (!c || fixingOf(c) !== 'fix') return;
    const s = readAgentState(runs()), k = key(id);
    if (s.tried[id] === k || s.running?.id === id && s.running.key === k || s.queue.some(q => q.id === id && q.key === k)) return;
    s.queue = [...s.queue.filter(q => q.id !== id), { id, key: k, what: String(what), log: String(log || '') }];
    if (save(s)) say(`${id}: the Foreman will look into it, as foreman_fixing is fix: ${what}`);
  };

  // An agent that has ended: each action it took for its ticket is carried out.
  const finish = s => {
    const r = s.running, mine = readActions(runs()).filter(a => a.run === r.token && a.id === r.id);
    for (const a of mine) {
      if (a.action === 'reship') { ships.again(a.id); say(`${a.id}: the Foreman asked for its ship to be tried again: ${a.why}`); }
      else if (a.action === 'resume') s.resumes = [...s.resumes.filter(x => x.id !== a.id), { id: a.id, message: a.text }];
      else say(`${a.id}: the Foreman ${ACTIONS[a.action]}: ${a.text}${a.why ? ` (${a.why})` : ''}`);
    }
    if (!mine.length) say(`${r.id}: the Foreman looked into it and took no action. Its log: ${path.relative(repo, path.join(runs(), LOG))}`);
    s.running = null;
    child = null;
  };

  const launch = (s, c, next) => {
    const token = crypto.randomUUID(), agent = foremanAgentOf(c);
    const brief = foremanBrief({ id: next.id, what: next.what, log: next.log ? path.relative(repo, next.log) : 'its log', tail: next.log ? logTail(next.log) : '', agent });
    const argv = foremanArgv(c, brief);
    s.queue = s.queue.slice(1);
    s.tried[next.id] = next.key;
    const started = start(argv, repo, path.join(runs(), LOG), { ...process.env, SPECK_FOREMAN_RUN: token });
    if (started.error || !started.pid) { save(s); return say(`${next.id}: the Foreman couldn't start ${agent}: ${started.error || 'it has no process id'}.`); }
    child = { token, exited: started.exited };
    s.running = { id: next.id, token, pid: started.pid, key: next.key, what: next.what, started: new Date().toISOString() };
    save(s);
    say(`${next.id}: the Foreman (${agent}) is looking into it. Log: ${path.relative(repo, path.join(runs(), LOG))}`);
  };

  const resume = (s, t) => {
    const r = s.resumes.find(x => x.id === t.id);
    const file = path.join(runs(), `${t.id}.json`), rec = readObject(file);
    s.resumes = s.resumes.filter(x => x !== r);
    const message = `speck's Foreman looked into why ticket ${t.id}'s work stopped, and asks the build to carry on: ${r.message} Carry on with ${rec?.agent === 'codex' ? '$speck-build' : '/speck-build'} ${t.id} from where you left off.`;
    const { argv, why } = rec ? resumeFor(words, cfg, t.id, rec, message) : { argv: null, why: 'it has no run record' };
    if (!argv) return say(`${t.id}: the Foreman asked for its build to be resumed, but speck run can't: ${why}.`);
    const { exited: _e, exit_code: _c, ...kept } = rec, next = { ...kept, foreman_resumed: new Date().toISOString(), resume_command: argv };
    try { saveRecord(file, next); } catch (e) { return say(`${t.id}: the Foreman asked for its build to be resumed, but its run record couldn't be saved (${e.message}).`); }
    const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
    say(`${t.id}: speck run is resuming its build, as the Foreman asked (session ${rec.session}).`);
    startBuild(t.id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...next, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
  };

  const check = tickets => {
    const s = readAgentState(runs());
    let changed = false;
    if (s.running) {
      const gone = child && child.token === s.running.token ? child.exited() : !(Number.isInteger(s.running.pid) && alive(s.running.pid));
      if (gone) { finish(s); changed = true; }
    }
    const c = config();
    // A stop whose ticket has since finished needs no look.
    const over = new Set(tickets.filter(t => t.status === 'done' || t.status === 'cancelled').map(t => String(t.id)));
    if (s.queue.some(q => over.has(q.id))) { s.queue = s.queue.filter(q => !over.has(q.id)); changed = true; }
    if (!s.running && s.queue.length) {
      if (c && fixingOf(c) === 'fix') { launch(s, c, s.queue[0]); changed = false; }
      else { s.queue = []; changed = true; } // turned off meanwhile: nothing waits
    }
    for (const t of tickets) {
      if (!s.resumes.some(x => x.id === t.id) || running.has(t.id) || t.build_running) continue;
      if (running.size >= max) break;
      resume(s, t);
      changed = true;
    }
    if (changed) save(s);
  };

  return { stuck, check };
}

// Why a build that ended left its ticket stuck, or null when its ticket is approved, blocked or finished, or speck run
// can't tell.
export function buildStuck(status) {
  if (!status || ['approved', 'blocked', 'done', 'cancelled'].includes(status)) return null;
  return status === 'ready' ? 'its build ended without starting the ticket, which is still ready'
    : `its build ended with the ticket still ${status}, neither approved nor blocked`;
}

// ---------- speck foreman <action> <id> [text] --why=<why>: what the Foreman agent may do ----------

const USAGE = 'Usage: speck foreman resume <id> "<instruction>" | reship <id> | fix <id> "<title>" | ask <id> "<question>", each with --why="<why>". Only the Foreman agent speck run starts may run it.';

// Writes `line` at the end of the ticket's Notes and commits only the ticket where its build keeps it. Returns nothing,
// or throws a SpeckError saying why, changing nothing.
function noteInTicket(at, t, line, message) {
  const text = replaceSection(t.raw, 'Notes', old => (old ? `${old}\n${line}` : line), path.relative(at, t.file));
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, message); }
  catch (e) { commit = { status: 1, stderr: e.message }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status !== 0) throw new SpeckError(`Couldn't commit ${path.relative(at, t.file)}, so nothing was done:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
}

// Makes a draft fix ticket titled `title` in the main checkout, with `why` as its Problem, and commits only it. Its id.
function makeFixTicket(main, cfg, title, why) {
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: main }).stdout.trim();
  if (branch !== cfg.base_branch) throw new SpeckError(`The main checkout is on "${branch}", not ${cfg.base_branch}, so no fix ticket was made.`);
  const r = spawnSync(process.execPath, [CLI, 'new', title, '--type=fix'], { cwd: main, encoding: 'utf8' });
  if (r.status !== 0) throw new SpeckError(`speck new refused the fix ticket: ${(r.stderr || r.stdout).trim()}`);
  const file = path.resolve(main, r.stdout.trim().split('\n').pop());
  const raw = fs.readFileSync(file, 'utf8');
  const id = (raw.match(/^id:\s*"?(\d+)"?/m) || [])[1];
  let text = raw;
  try { text = replaceSection(raw, 'Problem', () => why, path.relative(main, file)); } catch { /* left as the template has it */ }
  fs.writeFileSync(file, text);
  const commit = commitTicketOnly(main, file, raw, `speck(${id}): fix ticket`);
  if (commit.status !== 0) { fs.rmSync(file, { force: true }); throw new SpeckError(`Couldn't commit the fix ticket, so none was made:\n${(commit.stderr || commit.stdout || '').trim()}`); }
  return id;
}

// One action of the Foreman agent, from its brief: checked, noted in the ticket and recorded for speck run, which carries
// out a resume or a reship once the agent has ended. `token` is the agent's run (SPECK_FOREMAN_RUN). One action a run.
// Returns what it says.
export function foremanAction(repo, args, { token = process.env.SPECK_FOREMAN_RUN, now = new Date(), tickets = null } = {}) {
  const words = args.filter(a => !a.startsWith('--'));
  const [action, rawId, ...rest] = words;
  const oneLine = v => textOf(v).replace(/\s+/g, ' '); // kept to one line in the Notes
  const why = oneLine((args.find(a => a.startsWith('--why=')) || '').slice('--why='.length));
  if (!Object.hasOwn(ACTIONS, action || '') || !rawId) throw new SpeckError(USAGE);
  const cfg = loadConfig(repo);
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const runs = path.join(main, 'speck', '.cache', 'runs');
  const s = readAgentState(runs);
  if (!token || !s.running || s.running.token !== token) throw new SpeckError(`Only the Foreman agent speck run starts may run speck foreman, and none is running as this one. ${USAGE}`);
  let at, t;
  try { ({ at, t } = buildTicket(repo, cfg, rawId)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`No ticket ${rawId}: ${e.message}`); throw e; }
  const id = t.fm.id;
  if (s.running.id !== id) throw new SpeckError(`This Foreman run is looking into ticket ${s.running.id}, not ${id}.`);
  if (readActions(runs).some(a => a.run === token)) throw new SpeckError(`This Foreman run has already taken its one action for ${id}. Stop here.`);
  const text = oneLine(rest.join(' '));
  if (!why) throw new SpeckError(`Say why with --why="<why, in a sentence>". ${USAGE}`);
  if (action !== 'reship' && !text) throw new SpeckError(`speck foreman ${action} needs ${action === 'resume' ? 'the instruction for the build' : action === 'fix' ? 'the fix ticket\'s title' : 'the question'}. ${USAGE}`);
  if (['done', 'cancelled'].includes(t.fm.status)) throw new SpeckError(`Ticket ${id} is ${t.fm.status}, so there's nothing to do for it.`);
  if (action === 'resume') {
    const rec = readObject(path.join(runs, `${id}.json`));
    const cant = !rec ? 'it has no run record from speck run' : resumeFor(runWords(cfg), cfg, id, rec, '').why;
    if (cant) throw new SpeckError(`Ticket ${id}'s build can't be resumed by speck run: ${cant}. Choose another action.`);
  }
  if (action === 'reship') {
    const list = tickets || statusData(repo).tickets;
    const row = list.find(x => String(x.id) === id);
    if (t.fm.status !== 'approved' || !row || row.auto_ship !== true) throw new SpeckError(`Ticket ${id} isn't an approved ticket that auto_ship covers, so speck run won't ship it. Choose another action.`);
  }
  replaceSection(t.raw, 'Notes', old => old, path.relative(at, t.file)); // a ticket with no Notes refuses before anything is made
  let fixId = null;
  if (action === 'fix') fixId = makeFixTicket(main, cfg, text, why);
  const when = `${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const did = action === 'resume' ? `resumed its build: ${text}` : action === 'reship' ? 'asked speck run to ship it again, once'
    : action === 'fix' ? `made draft fix ticket ${fixId}: ${text}` : `asked you: ${text}`;
  noteInTicket(at, t, `- The Foreman (${when}) ${did}. Why: ${why}`, `${foremanSubject(id)} ${action}`);
  const entry = { run: token, id, action, text, why, at: now.toISOString(), status: t.fm.status, ...(fixId ? { fix_id: fixId } : {}) };
  fs.appendFileSync(path.join(runs, DID), `${JSON.stringify(entry)}\n`);
  return {
    resume: `Noted in ${id}'s Notes. speck run resumes its build with your instruction once you've ended. Stop here.`,
    reship: `Noted in ${id}'s Notes. speck run ships it again once you've ended. Stop here.`,
    fix: `Made draft fix ticket ${fixId}, which waits for the user to shape it and set it ready, and noted it in ${id}'s Notes. Stop here.`,
    ask: `Noted in ${id}'s Notes. The Foreman's status shows your question to the user. Stop here.`,
  }[action];
}

export function cmdForeman(args) { console.log(foremanAction(findRepoRoot(), args)); }
