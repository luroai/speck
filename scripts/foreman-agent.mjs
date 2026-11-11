// 0287: the Foreman agent. With watch: fix, when work stops for a reason speck has no steps for (a ship refused
// for a reason it doesn't hand back to the build, or a build that ends with its ticket neither approved nor blocked),
// speck run starts an agent with a short brief to look into it. The agent follows the speck-watch skill and does one
// thing, through `speck watch <action>` (0486: was `speck foreman`): resume the build with an instruction, re-run the
// ship once, make a draft fix ticket or ask the user one question. Each is noted in the ticket's Notes and shown in the Foreman's status detail.
// 0567: with watch: decide, it can also go with its own recommendation instead of asking.
// 0569: speck run also starts it for a build still running far past the usual time, when it can only tell you what it
// found or make a draft fix ticket.
// 0636: and, with watch fix or decide, to check a blocked question in the running app (app-check.mjs). 0637: and on another agent of yours while its own is held by a usage limit (watch-stand-in.mjs). 0651: on QA's settings, saying QA, once they're set.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, sh, loadConfig, speckNameOf, speckSays, worktreeList, ticketBranches, findRepoRoot, setting, setField, syncHeader, contentLines, waitFields } from './core.mjs';
import { replaceSection, commitTicketOnly } from './close.mjs';
import { buildTicket, saveRecord, foremanSubject, oldForemanSubject, byWatch } from './build-records.mjs';
import { readableLog } from './build-log.mjs';
import { resumeFor, resumedRecord } from './hand-back.mjs';
import { pidAlive } from './run-switch.mjs';
import { runWords, choseCount, FOREMAN_CHOSE, callOf, withCall } from './go-with.mjs';
import { processesWithEnv, sessionInUse } from './build-procs.mjs';
import { refsOf } from './ship-queue.mjs';
import { fixingOf, speckActs, MAX_DECIDED } from './foreman.mjs';
import { questionFacts } from './question-facts.mjs';
import { statusData } from './speck.mjs';
import { askKey, dealtWith, readReplies, cmdForemanReply } from './foreman-answer.mjs';
import { cursorCli, CURSOR_HEADLESS } from './cursor-build.mjs';
import { knownProviders, cantRun } from './custom-providers.mjs';
import { providerNamed } from './provider-review.mjs';
import { PROVIDER_SCRIPT, CLAUDE_FLAGS, FOREMAN_MODE } from './provider-build.mjs';
import { onPath } from './install.mjs';
import { recordWatchSpend } from './spend.mjs';
import { providerKey } from './keys.mjs';
import { usualBuild, runningLong, canRunLong } from './long-build.mjs';
import { limitWaiting, keepUsageOfLog } from './usage-limit.mjs';
import { reviewerWaiting } from './reviewer-limit.mjs';
import { takeAt, resumeTime, resumeClock, resumeWhy } from './resume-at.mjs';
import { appCheckable, appStartSet, checkKey, checkItem, checkOf, checkBrief, checkedSays, checkStale, CHECK_ACTIONS, qaOn, qaConfig } from './app-check.mjs';
import { stopApp } from './app.mjs';
import { standIn, movedOf } from './watch-stand-in.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));

// None is <id>.json or <id>.log, so nothing that reads the runs folder's build records takes them for one.
const STATE = 'run.foreman-agent.json'; // speck run's: the agent running, those waiting, what it has looked into
const DID = 'run.foreman-did.jsonl'; // the agent's actions, one JSON object a line, written by `speck foreman`
const LOG = 'run.watch.log'; // the agent's output, from its latest run. 0486: named so the lines that print it don't say foreman

// The agents the Foreman can run on, and what each action is.
export const FOREMAN_AGENTS = Object.freeze(['claude', 'codex', 'cursor']);
export const ACTIONS = Object.freeze({
  resume: 'resumed its build',
  reship: 'asked speck run to ship it again, once',
  fix: 'made a draft fix ticket',
  ask: 'asked you',
  decide: 'went with the recommendation', // 0567
  tell: 'told you what it found', // 0569
});
const LONG_ACTIONS = Object.freeze(['fix', 'tell']); // 0569: what it may do about a build that's still running
const RECENT = 5; // how many of its actions the status detail shows

// The agent the Foreman runs on: watch_agent when it's set, otherwise the builder when that's Codex or Cursor (0333),
// otherwise Claude Code. 0392: or a model provider in `providers`, such as deepseek, set as watch_agent or as the builder.
export const foremanAgentOf = (cfg, providers = knownProviders(), agent = setting(cfg, 'watch_agent')) => (FOREMAN_AGENTS.includes(agent) || providerNamed(agent, providers) ? agent
  : ['codex', 'cursor'].includes(cfg?.builder) || providerNamed(cfg?.builder, providers) ? cfg.builder : 'claude');
// 0392: the model provider the Foreman runs on, or null.
export const foremanProvider = (cfg, providers = knownProviders()) => providerNamed(foremanAgentOf(cfg, providers), providers);
// 0392: the agent the Foreman runs on as speck run names it: a provider by its label, such as DeepSeek.
const agentLabel = (cfg, providers = knownProviders()) => foremanProvider(cfg, providers)?.label ?? foremanAgentOf(cfg, providers);

// 0392: why the Foreman can't start on a model provider now, in a sentence, or '' when it can or isn't on one.
// `installed` says whether a command is on the PATH, so tests can stand in.
export function foremanCantStart(repo, cfg, { providers = knownProviders(repo), installed = onPath } = {}) {
  const p = foremanProvider(cfg, providers);
  if (!p) return '';
  if (cantRun(p, 'look into stops for speck')) return cantRun(p, 'look into stops for speck'); // 0401
  if (!installed('claude')) return `speck needs Claude Code installed to look into stops on ${p.label}, as speck runs ${p.label}'s models through it (claude isn't on the PATH). Install Claude Code (https://claude.com/claude-code), or set foreman to another agent.`;
  let key = '';
  try { key = providerKey(repo, p.name, { providers }); } catch (e) { return e.message; }
  return key ? '' : `this machine has no ${p.label} API key for speck to look into stops with. Set one with \`speck keys set ${p.name}\`, or set foreman to another agent.`;
}
const textOf = v => (typeof v === 'string' ? v.trim() : '');
const oneLine = v => textOf(v).replace(/\s+/g, ' ');
const sentence = v => (/[.!?]$/.test(v) ? v : `${v}.`);
// ' at YYYY-MM-DD HH:MM UTC', or '' for a time that can't be read.
const utc = at => (typeof at === 'string' && Number.isFinite(Date.parse(at)) ? ` at ${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC` : '');

// The skill the agent follows, as the agent finds it in the repo.
export const skillPath = agent => `${agent === 'codex' ? '.agents' : '.claude'}/skills/speck-watch/SKILL.md`;

// The brief the agent starts with: the ticket, what happened, the last lines of its log and what it may do. 0567: `decide`
// when watch is decide, which offers the agent the decide action. 0569: `long` for a build that's still running long.
export function foremanBrief({ id, what, log, tail, agent = 'claude', decide = false, long = false }) {
  const cli = 'node .speck/scripts/speck.mjs watch';
  if (long) return [
    `You are speck, watching the pipeline. Ticket ${id}'s build is still running, far longer than usual, and speck run asked you to look into why.`,
    `What happened: ${what}`,
    `Last lines of ${log}:`,
    tail || '(the log is empty or missing)',
    '',
    `Follow the speck-watch skill (${skillPath(agent)}), and what it says about a build that runs long. Find out why, then do exactly one of these, with --why saying why in a sentence:`,
    `- ${cli} fix ${id} "<title of the fix ticket>" --why="..."   make a draft fix ticket when the base branch itself is broken`,
    `- ${cli} tell ${id} "<what you found>" --why="..."   otherwise tell the user what you found, even when the slowness was harmless`,
    'Never stop or restart the build, set a ticket ready, approve work, ship anything yourself, merge, push or change any code or file by hand.',
  ].join('\n');
  return [
    `You are speck, watching the pipeline. Work on ticket ${id} stopped for a reason speck has no steps for, and speck run asked you to look into it.`,
    `What happened: ${what}`,
    `Last lines of ${log}:`,
    tail || '(the log is empty or missing)',
    '',
    `Follow the speck-watch skill (${skillPath(agent)}). Find out why it stopped, then do exactly one of these, with --why saying why in a sentence:`,
    `- ${cli} resume ${id} "<what the build should do>" --why="..."   resume the ticket's build with an instruction`,
    `- ${cli} resume ${id} "<what the build should do>" --at <time> --why="..."   the same, at a set time, when the stop will clear by itself then: 12:30 (UTC) or a full ISO date and time`,
    `- ${cli} reship ${id} --why="..."   have speck run ship it again, once (only an approved ticket auto_ship covers)`,
    `- ${cli} fix ${id} "<title of the fix ticket>" --why="..."   make a draft fix ticket for what's broken`,
    ...(decide ? [`- ${cli} decide ${id} "<the option you recommend>" --why="..."   watch is decide, so use this instead of asking when you have a recommendation and the ticket is low risk: speck goes with it and resumes the build`] : []),
    `- ${cli} ask ${id} "<one question for the user>" --why="..."   ask the user, in one line`,
    'Never set a ticket ready, approve work, ship anything yourself, merge, push or change any code or file by hand.',
  ].join('\n');
}

// The command that starts the agent with `brief`, on watch_model and watch_effort when they're set. Claude Code may
// only read and run speck and read-only git commands; Codex has no such list, so it runs as Codex builds do. 0333: so
// does Cursor, as `cli`, without watch_effort, as Cursor's model names carry the effort. 0392: a model provider's
// Foreman runs Claude Code's, --bare and without watch_effort, on watch_model or else the provider's default model,
// through provider-build.mjs, which reads this machine's key for it and gives Claude Code only what it needs to run and
// the provider's address and key (providerForemanEnv).
// 0636: `check` for a check in the app, which Claude Code may also do in a browser.
export function foremanArgv(cfg, brief, cli, providers = knownProviders(), check = false) {
  const agent = foremanAgentOf(cfg, providers), model = textOf(setting(cfg, 'watch_model')), effort = textOf(setting(cfg, 'watch_effort'));
  const p = providerNamed(agent, providers);
  if (p) return [process.execPath, PROVIDER_SCRIPT, FOREMAN_MODE, p.name, p.address, ...claudeArgv(brief, model || p.defaultModel, '', ['--bare', ...CLAUDE_FLAGS], check)];
  if (agent === 'cursor') return [cli ?? cursorCli(), ...CURSOR_HEADLESS, ...(model ? ['--model', model] : []), brief];
  if (agent === 'codex')
    return ['codex', 'exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(model ? ['-m', model] : []),
      ...(effort ? ['-c', `model_reasoning_effort="${effort}"`] : []), brief];
  return claudeArgv(brief, model, effort, [], check);
}

// Claude Code's Foreman command, `flags` first: it may only read and run speck and read-only git commands.
// 0636: a check in the app may also use a browser: Playwright's tools, or headless Chromium or Chrome.
const BROWSER_TOOLS = ['mcp__playwright', 'Bash(chromium:*)', 'Bash(chromium-browser:*)', 'Bash(google-chrome:*)'];
const claudeArgv = (brief, model, effort, flags = [], check = false) => ['claude', ...flags, '-p', brief, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'dontAsk',
  ...(model ? ['--model', model] : []), ...(effort ? ['--effort', effort] : []),
  '--allowedTools', 'Read', 'Grep', 'Glob', 'Bash(node .speck/scripts/speck.mjs:*)', 'Bash(git log:*)', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git show:*)', ...(check ? BROWSER_TOOLS : [])];

// The subject of the commits `speck foreman` makes, which don't count as new commits on the ticket (kept in build-records).
export { foremanSubject };
const ref = (repo, name) => { const r = sh('git', ['rev-parse', '--verify', '-q', name], { cwd: repo }); return r.status === 0 ? r.stdout.trim() : ''; };

// True when `to` is `from` with only `speck foreman`'s commits on top, so the ship queue doesn't take its notes as new
// work to ship.
export function foremanOnly(repo, id, from, to) {
  if (!from || !to || from === to) return from === to;
  if (sh('git', ['merge-base', '--is-ancestor', from, to], { cwd: repo }).status !== 0) return false;
  const r = sh('git', ['log', '--format=%s', `${from}..${to}`], { cwd: repo });
  const subjects = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  return subjects.length > 0 && subjects.every(s => byWatch(id, s));
}

// The commits a stop is looked into for: the base branch's and the ticket branch's latest commit that isn't the
// Foreman's own, so the Foreman's notes don't make the same stop count as a new one.
export function codeKey(repo, cfg, id) {
  let branches = [];
  try { branches = ticketBranches(repo, cfg, id); } catch { /* unreadable: no branch */ }
  let head = '';
  if (branches.length === 1) {
    const r = sh('git', ['log', '-1', '--format=%H', '--invert-grep', '--fixed-strings', `--grep=${foremanSubject(id)}`, `--grep=${oldForemanSubject(id)}`, `refs/heads/${branches[0]}`], { cwd: repo });
    head = r.status === 0 ? r.stdout.trim() : '';
  }
  return `${ref(repo, `refs/heads/${cfg.base_branch}`)} ${head}`;
}

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };

// speck run's record of the Foreman agent: { running: { id, token, pid, key, what, started, command, long? } | null, queue: [{ id, key,
// what, log, long? }], tried: { <id>: key }, long: { <id>: key }, resumes: [{ id, message, by?, question?, status?, head?, session?, at?, why? }], answered: [askKey] }.
// 0318: answered lists your answers to its questions already carried out, and a resume `by` 'user' carries one out. 0569:
// long is the build of each ticket last dealt with for running long, kept apart from tried so a stop is still looked into.
// 0625: a resume with `at` waits for that time. 0636: checked is the question of each ticket last checked in the app (checkKey).
export function readAgentState(runs) {
  const s = readObject(path.join(runs, STATE)) || {};
  const list = v => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object' && typeof x.id === 'string') : []);
  const texts = v => { const o = Object.create(null); if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x === 'string') o[k] = x; return o; };
  const r = s.running;
  const answered = Array.isArray(s.answered) ? s.answered.filter(k => typeof k === 'string') : [];
  return { running: r && typeof r === 'object' && typeof r.id === 'string' && typeof r.token === 'string' ? r : null, queue: list(s.queue), tried: texts(s.tried), long: texts(s.long), checked: texts(s.checked), resumes: list(s.resumes), answered, moved: movedOf(s.moved) }; // 0637
}
const saveAgentState = (runs, s) => saveRecord(path.join(runs, STATE), { ...s, tried: { ...s.tried }, long: { ...s.long }, checked: { ...s.checked } });

// The agent's actions, oldest first, each { run, id, action, text, why, at, status, fix_id? }.
export function readActions(runs) {
  let text = '';
  try { text = fs.readFileSync(path.join(runs, DID), 'utf8'); } catch { return []; }
  return text.split('\n').flatMap(line => {
    try { const v = JSON.parse(line); return v && typeof v === 'object' && typeof v.id === 'string' && Object.hasOwn(ACTIONS, v.action) ? [v] : []; } catch { return []; }
  });
}

// What the Foreman's status detail shows of the agent: the stop it's looking into, those waiting, its last actions
// (newest first) and its questions still waiting for you: those whose ticket is still as it was when it asked, and that
// you haven't answered or dismissed (0318). 0328: each question among its last actions has an outcome saying what became
// of it, '' while it still waits for you. 0576: `name` is what you call speck.
export function agentView(runs, tickets = [], name = 'speck') {
  const s = readAgentState(runs), actions = readActions(runs), dealt = dealtWith(runs);
  const statusOf = new Map((Array.isArray(tickets) ? tickets : []).filter(t => t && typeof t === 'object').map(t => [String(t.id), t.status]));
  const latest = new Map(actions.map(a => [a.id, a]));
  // 0328: what became of each question in its last actions: '' while it waits for you, otherwise a sentence saying so.
  const replies = new Map(readReplies(runs).map(r => [r.key, r]));
  const askOutcome = a => {
    const key = askKey(a.id, a.at), r = replies.get(key);
    if (r) return r.action === 'answer' ? `You answered it${utc(r.at)}${oneLine(r.text) ? `: ${sentence(oneLine(r.text))}` : '.'}` : `You dismissed it${utc(r.at)}.`;
    if (dealt.has(key)) return 'No longer waiting: your reply is being noted.';
    if (latest.get(a.id) !== a) return `No longer waiting: ${name} has done something else about ${a.id} since.`;
    if (!statusOf.has(a.id)) return `No longer waiting: ${a.id} is no longer on the board.`;
    if (statusOf.get(a.id) !== a.status) return `No longer waiting: ${a.id} is ${statusOf.get(a.id)} now.`;
    return '';
  };
  const asks = [...latest.values()].filter(a => a.action === 'ask' && statusOf.has(a.id) && statusOf.get(a.id) === a.status && !dealt.has(askKey(a.id, a.at)))
    .map(a => ({ id: a.id, question: textOf(a.text), at: textOf(a.at) }));
  return {
    running: s.running ? { id: s.running.id, what: textOf(s.running.what), started: textOf(s.running.started) } : null, // started: 0446
    waiting: s.queue.map(q => q.id),
    resuming: [...new Set([...s.resumes.map(r => r.id), ...limitWaiting(runs), ...reviewerWaiting(runs)])], // 0616: the builds speck run is to resume, taken off as it tries each. 0622, 0623: and those waiting out a usage limit
    scheduled: s.resumes.filter(r => typeof r.at === 'string' && Number.isFinite(Date.parse(r.at))).map(r => ({ id: r.id, at: r.at, text: textOf(r.message), why: textOf(r.why) })), // 0625: those waiting for their time
    did: actions.slice(-RECENT).reverse().map(a => ({ id: a.id, action: a.action, did: a.resume_at ? `scheduled its build's resume${utc(a.resume_at)}` : ACTIONS[a.action], text: textOf(a.text), why: textOf(a.why), at: textOf(a.at), ...(a.fix_id ? { fix_id: a.fix_id } : {}),
      ...(a.action === 'ask' ? { outcome: askOutcome(a) } : {}) })),
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
// commits (codeKey), and not at all while its question to you still waits (0566). `ships` is speck run's ship queue, whose again(id) ships a ticket once more. 0392: `providers` are
// the model providers speck knows, and `cantStart(cfg)` says why the Foreman can't start on one now. 0566: `statusOf(id)`
// is a ticket's status now. 0567: `inUse(session)` says whether a build's session is running now. 0569: `now` is the time in
// ms and `load` the machine's load averages. 0625: `agentLimited(agent, log)` says whether the usage limit stopped an agent's own run. 0637: heldAgent and readyAgents are standIn's.
export function foremanAgentQueue({ repo, runs, readConfig, words, cfg, max, settings = () => ({ cfg, words, max }), running, startBuild, ships,
  start = spawnAgent, key = id => codeKey(repo, cfg, id), alive = pidAlive, say = console.log, persist = saveAgentState,
  withToken = token => processesWithEnv(`SPECK_FOREMAN_RUN=${token}`), providers = null, cantStart = c => foremanCantStart(repo, c, providers ? { providers } : {}),
  statusOf = id => statusData(repo).tickets.find(t => String(t.id) === id)?.status, inUse = sessionInUse, now = Date.now, load = os.loadavg, heldBuild = () => false, heldAgent = () => false, agentLimited = () => false, readyAgents = () => [], stopCheckApp = id => stopApp(repo, id, () => {}) }) {
  let child = null; // the agent this speck run started: { token, exited }. While it runs, no other starts, whatever the record says
  const finished = new Set(); // the runs whose actions have been carried out, so a record that couldn't be saved doesn't repeat them
  const carried = new Set(); // 0318: the same for your answers to its questions
  const config = () => { try { return readConfig(); } catch { return null; } };
  const speak = text => say(speckSays(text)); // 0591: a line of the log in the engineering manager's own voice
  const save = s => { try { persist(runs(), s); return true; } catch (e) { speak(`I couldn't save my record of what I look into (${e.message}), so I'll try again on speck run's next check.`); return false; } };

  const stuck = ({ id, what, log }) => {
    const c = config();
    if (!c || !speckActs(fixingOf(c))) return;
    // 0566: a question still waiting for you (agentView's, so what Needs you counts) holds back any look at its ticket.
    let status = null;
    try { status = statusOf(id); } catch { /* unreadable: check() holds it back before it starts */ }
    if (agentView(runs(), [{ id, status }]).asks.length) return;
    const s = readAgentState(runs()), k = key(id);
    if (s.tried[id] === k || s.running?.id === id && s.running.key === k || s.queue.some(q => q.id === id && q.key === k)) return;
    s.queue = [...s.queue.filter(q => q.id !== id), { id, key: k, what: String(what), log: String(log || '') }];
    if (save(s)) speak(`${id}: I'll look into it, as watch is ${fixingOf(c)}: ${what}`);
  };

  // 0569: each build running long: said once in speck run's log with watch: tell, or queued once for the agent with fix or
  // decide, while no question of its still waits for you (0566).
  const longBuilds = (s, tickets, c) => {
    const watch = c ? fixingOf(c) : 'off', acts = speckActs(watch);
    if ((!acts && watch !== 'tell') || !running.size) return;
    const usual = usualBuild(tickets);
    for (const t of tickets) {
      if (!running.has(t.id)) continue;
      const rec = readObject(path.join(runs(), `${t.id}.json`));
      const long = rec && !Object.hasOwn(rec, 'exited') ? runningLong(t, rec, usual, now(), load()) : null;
      if (!long || s.long[t.id] === long.key) continue;
      if (acts && agentView(runs(), tickets).asks.some(a => a.id === t.id)) continue;
      s.long[t.id] = long.key;
      if (acts) s.queue = [...s.queue.filter(q => q.id !== t.id), { id: t.id, key: long.key, what: long.what, log: path.join(runs(), `${t.id}.log`), long: true }];
      if (save(s)) { if (acts) speak(`${t.id}: I'll look into it, as watch is ${watch}: ${long.what}`); else say(`${t.id}: ${long.what}`); }
    }
  };

  // 0636: each low-risk ticket blocked on a question to check in the app, queued once per question while no question of
  // the agent's about it still waits for you.
  const appChecks = (s, tickets, c) => {
    for (const t of tickets) {
      if (!appCheckable(c, t) || s.checked[t.id] === checkKey(t)) continue;
      if (agentView(runs(), tickets).asks.some(a => a.id === t.id)) continue;
      s.checked[t.id] = checkKey(t);
      s.queue = [...s.queue.filter(q => q.id !== t.id), checkItem(t, path.join(runs(), `${t.id}.log`))];
      if (save(s)) speak(`${t.id}: ${qaOn(c) ? 'QA will' : 'I\'ll'} check its question in the app, as watch is ${fixingOf(c)}: ${t.blocked_check_in_app}`);
    }
  };

  // An agent that has ended: each action it took for its ticket is carried out.
  const finish = s => {
    const r = s.running;
    s.running = null;
    child = null;
    if (finished.has(r.token)) return;
    finished.add(r.token);
    // 0636: whatever it did, the app it started to check the question is stopped.
    if (checkOf(r)) Promise.resolve().then(() => stopCheckApp(r.id)).then(was => { if (was) speak(`${r.id}: ${r.qa ? 'QA stopped the app it' : 'I stopped the app I'} started to check it.`); },
      e => speak(`${r.id}: I couldn't stop the app I started to check it (${e?.message || e}). Stop it with speck app ${r.id} --stop.`));
    // 0525: what it spent, kept for its ticket before the next run replaces its log. 0642: and its agent's usage.
    try { recordWatchSpend(runs(), { id: r.id, run: r.token, command: r.command, log: path.join(runs(), LOG) }); }
    catch (e) { speak(`${r.id}: I couldn't keep what looking into it spent (${e.message}).`); } finally { keepUsageOfLog(repo, r.agent, path.join(runs(), LOG)); }
    const mine = readActions(runs()).filter(a => a.run === r.token && a.id === r.id);
    for (const a of mine) {
      if (a.action === 'reship') { ships.again(a.id); speak(`${a.id}: I asked for its ship to be tried again: ${a.why}`); }
      // 0618: a resume keeps what it was asked against too, as a decide does, unless it was asked before speck kept it.
      else if (a.action === 'resume' || a.action === 'decide') {
        s.resumes = [...s.resumes.filter(x => x.id !== a.id), { id: a.id, message: a.text, ...(a.action === 'decide' ? { by: 'decide', head: a.head, session: a.session, status: a.status, ...(a.watch ? { watch: a.watch } : {}) } : a.head ? { by: 'watch', head: a.head, session: a.session, status: a.status } : {}), ...(a.resume_at ? { at: a.resume_at, why: a.why } : {}) }];
        if (a.resume_at || r.qa) speak(a.resume_at ? `${a.id}: I'll resume it at ${resumeClock(Date.parse(a.resume_at), now())}: ${resumeWhy(a.why)}` : `${a.id}: QA checked it in the app and ${ACTIONS[a.action]}: ${a.text} (${a.why})`); // 0625. 0651: and QA's decide
      }
      else speak(`${a.id}: ${r.qa ? 'QA checked it in the app and' : 'I'} ${ACTIONS[a.action].replace('what it found', 'what I found')}: ${a.text}${a.why ? ` (${a.why})` : ''}`);
    }
    // 0625: a look the usage limit stopped wasn't a look: it's looked into once the limit has reset.
    if (!mine.length && agentLimited(r.agent, path.join(runs(), LOG))) {
      if (!r.long && !checkOf(r)) delete s.tried[r.id];
      s.queue = [{ id: r.id, key: r.key, what: r.what, log: r.log, ...(r.long ? { long: true } : {}), ...(checkOf(r) ? { check: r.check } : {}) }, ...s.queue.filter(q => q.id !== r.id)];
      speak(`${r.id}: The usage limit stopped me looking into it, so I'll look again once it has reset.`);
    } else if (!mine.length) speak(`${r.id}: ${r.qa ? 'QA checked it in the app' : 'I looked into it'} and took no action. Its log: ${path.relative(repo, path.join(runs(), LOG))}`);
  };

  const launch = (s, c, next) => {
    const known = providers ?? knownProviders(repo); // 0401: read on each start, so a provider added since counts
    const token = crypto.randomUUID(), agent = foremanAgentOf(c, known), label = agentLabel(c, known);
    const check = checkOf(next), qa = !!check && qaOn(c); // 0636. 0651: `c` is QA's already
    const brief = check ? checkBrief({ id: next.id, check, skill: skillPath(agent), watch: fixingOf(c), startSet: appStartSet(c) })
      : foremanBrief({ id: next.id, what: next.what, log: next.log ? path.relative(repo, next.log) : 'its log', tail: next.log ? logTail(next.log) : '', agent, decide: fixingOf(c) === 'decide', long: next.long === true });
    const argv = foremanArgv(c, brief, undefined, known, !!check);
    // Reserved in the record before it starts, so a record that can't be saved starts nothing, and the agent's token is
    // there for `speck foreman` to check.
    s.queue = s.queue.slice(1);
    if (!next.long && !check) s.tried[next.id] = next.key; // 0569: a look at a running build doesn't stand for a look at a stop. 0636: nor does a check in the app
    s.running = { id: next.id, token, pid: null, key: next.key, what: next.what, log: next.log, agent, started: new Date().toISOString(),
      command: argv.filter(w => w !== brief), ...(next.long ? { long: true } : {}), ...(check ? { check } : {}), ...(qa ? { qa } : {}) }; // 0525: for its model, when its spend is read
    if (!save(s)) return;
    const cant = cantStart(c); // 0392: a provider's without Claude Code or this machine's key for it
    if (cant) { s.running = null; save(s); return speak(`${next.id}: I couldn't start looking into it on ${label}: ${cant}`); }
    const started = start(argv, repo, path.join(runs(), LOG), { ...process.env, SPECK_FOREMAN_RUN: token });
    if (started.error || !started.pid) { s.running = null; save(s); return speak(`${next.id}: I couldn't start ${label} to look into it: ${started.error || 'it has no process id'}.`); }
    child = { token, exited: started.exited };
    s.running = { ...s.running, pid: started.pid };
    save(s);
    speak(`${next.id}: ${qa ? 'QA is checking it in the app' : 'I\'m looking into it'} on ${label}. Log: ${path.relative(repo, path.join(runs(), LOG))}`);
  };

  const resume = (s, t, { cfg, words }) => {
    const r = s.resumes.find(x => x.id === t.id);
    const file = path.join(runs(), `${t.id}.json`), rec = readObject(file);
    s.resumes = s.resumes.filter(x => x !== r);
    const skill = rec?.agent === 'codex' ? '$speck-build' : '/speck-build';
    const message = r.by === 'user'
      ? `speck looked into why ticket ${t.id}'s work stopped and asked the user: "${r.question}" Their answer: ${r.message} Carry on with ${skill} ${t.id} from where you left off, as they said.`
      : r.by === 'decide' // 0567
      ? `speck (watch: ${r.watch === 'fix' ? 'fix' : 'decide'}) looked into why ticket ${t.id}'s work stopped and went with its recommendation: ${r.message}. It's recorded in the ticket's Notes. Carry on with ${skill} ${t.id} from where you left off, going with that option.`
      : `speck looked into why ticket ${t.id}'s work stopped, and asks the build to carry on: ${r.message} Carry on with ${skill} ${t.id} from where you left off.`;
    const { argv, why } = rec ? resumeFor(words, cfg, t.id, rec, message) : { argv: null, why: 'it has no run record' };
    if (!argv) return speak(`${t.id}: I asked for its build to be resumed, but speck run can't: ${why}.`);
    const { exited: _e, exit_code: _c, ...kept } = rec, next = { ...resumedRecord(kept), foreman_resumed: new Date().toISOString(), resume_command: argv };
    try { saveRecord(file, next); } catch (e) { return speak(`${t.id}: I asked for its build to be resumed, but its run record couldn't be saved (${e.message}).`); }
    const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
    speak(`${t.id}: I asked speck run to resume its build (session ${rec.session}).`);
    startBuild(t.id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...next, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
  };

  const due = x => !(now() < Date.parse(x.at)); // 0625: one with no time, or none that can be read, doesn't wait

  const { movedBack, lookOn } = standIn({ heldAgent, readyAgents, speak, agents: FOREMAN_AGENTS }); // 0637
  const check = tickets => {
    const s = readAgentState(runs());
    let changed = false;
    if (child && !child.exited() && s.running?.token !== child.token) return; // its record wasn't saved: wait for it to end
    if (s.running) {
      // One started by an earlier speck run whose process id wasn't saved is found by the token in its environment, and
      // counts as running when that can't be checked.
      const pidless = () => { try { return withToken(s.running.token).length === 0; } catch { return false; } };
      const gone = child && child.token === s.running.token ? child.exited() : Number.isInteger(s.running.pid) ? !alive(s.running.pid) : pidless();
      if (gone) { finish(s); changed = true; }
    }
    const c = config();
    longBuilds(s, tickets, c); // 0569
    appChecks(s, tickets, c); // 0636
    // A stop whose ticket has since finished needs no look.
    const over = new Set(tickets.filter(t => t.status === 'done' || t.status === 'cancelled').map(t => String(t.id)));
    // 0569: nor does a long build that has ended. One paused or out of hand meanwhile gets its look once it's running again.
    for (const q of s.queue.filter(x => x.long)) {
      const t = tickets.find(x => String(x.id) === q.id);
      if (running.has(q.id) && t && canRunLong(t)) continue;
      over.add(q.id);
      if (running.has(q.id)) delete s.long[q.id];
    }
    // 0636: nor does a check in the app whose question has changed or that speck no longer checks.
    for (const q of s.queue.filter(x => checkOf(x))) { const t = tickets.find(x => String(x.id) === q.id); if (!t || !appCheckable(c, t) || checkKey(t) !== q.key) over.add(q.id); }
    // 0566: nor does one that came while the agent was still asking you about its ticket.
    if (s.queue.length) for (const a of agentView(runs(), tickets).asks) over.add(a.id);
    if (s.queue.some(q => over.has(q.id))) { s.queue = s.queue.filter(q => !over.has(q.id)); changed = true; }
    if (s.moved) { const known = providers ?? knownProviders(repo); if (movedBack(s, !!c && speckActs(fixingOf(c)), c && foremanAgentOf(c, known), known)) changed = true; } // 0637
    if (!s.running && s.queue.length) {
      if (c && speckActs(fixingOf(c))) { const known = providers ?? knownProviders(repo), qc = checkOf(s.queue[0]) ? qaConfig(c, known) : c, on = lookOn(s, qc, foremanAgentOf(qc, known), known, qc !== c); if (on) { launch(s, on, s.queue[0]); changed = false; } } // 0622: what waits is looked into once its agent's usage limit has reset. 0637: or on another agent of yours meanwhile
      else { s.queue = []; changed = true; } // turned off meanwhile: nothing waits
    }
    // 0318: your answers to its questions, each carried out once, as it would its own instruction, while the ticket is
    // still as it was when you answered.
    for (const x of readReplies(runs())) {
      if (x.action !== 'answer' || carried.has(x.key) || s.answered.includes(x.key)) continue;
      carried.add(x.key);
      s.answered = [...s.answered, x.key];
      changed = true;
      const t = tickets.find(y => String(y.id) === x.id);
      if (!t || t.status !== x.status) { speak(`${x.id}: I didn't carry out your answer, as the ticket has moved on since.`); continue; }
      if (x.carry === 'reship') { ships.again(x.id); speak(`${x.id}: I asked speck run to ship it again, once, as you answered.`); }
      else s.resumes = [...s.resumes.filter(y => y.id !== x.id), { id: x.id, message: x.text, by: 'user', question: x.question, status: x.status }];
    }
    // An answer waiting for a build slot is dropped once its ticket has moved on.
    const stale = s.resumes.filter(x => x.by === 'user' && !tickets.some(t => String(t.id) === x.id && t.status === x.status));
    for (const x of stale) speak(`${x.id}: I didn't carry out your answer, as the ticket has moved on since.`);
    if (stale.length) { s.resumes = s.resumes.filter(x => !stale.includes(x)); changed = true; }
    // 0567: so is a recommendation speck went with, as goWithQueue drops the button's, once its build has been carried on.
    const movedOn = x => { const session = readObject(path.join(runs(), `${x.id}.json`))?.session; return !tickets.some(t => String(t.id) === x.id && t.status === x.status) || refsOf(repo, cfg, x.id).head !== x.head || session !== x.session || inUse(session); };
    const gone = s.resumes.filter(x => (x.by === 'decide' || x.by === 'watch') && movedOn(x)); // 0618: and so is a resume the agent asked for
    for (const x of gone) speak(x.by === 'decide' ? `${x.id}: I went with its recommendation, but its build has been carried on since, so speck run left it as it is.`
      : Number.isFinite(Date.parse(x.at)) ? `${x.id}: I'd scheduled its build's resume for ${resumeClock(Date.parse(x.at), now())}, but the ticket has moved on since, so speck run left it as it is.` // 0625
      : `${x.id}: I asked for its build to be resumed, but the ticket has moved on since, so speck run left it as it is.`);
    if (gone.length) { s.resumes = s.resumes.filter(x => !gone.includes(x)); changed = true; }
    for (const t of tickets) {
      if (!s.resumes.some(x => x.id === t.id && due(x)) || running.has(t.id) || t.build_running || heldBuild(t.id)) continue; // 0622
      const now = settings(); // 0549: the builder settings as they are now, or null while they can't start a build
      if (!now || running.size >= now.max) break;
      resume(s, t, now);
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

// ---------- speck watch <action> <id> [text] --why=<why>: what the agent looking into a stop may do ----------

const USAGE = 'Usage: speck watch resume <id> "<instruction>" [--at <time>] | reship <id> | fix <id> "<title>" | ask <id> "<question>" | decide <id> "<option>" | tell <id> "<what you found>", each with --why="<why>", and on a check in the app --saw="<what you saw>". Only the agent speck run starts to look into a stop may run these. You answer or dismiss its question with speck answer <id> "<your answer>" or speck dismiss <id>.';

// Writes `line` at the end of the ticket's Notes and commits only the ticket where its build keeps it. Returns nothing,
// or throws a SpeckError saying why, changing nothing. 0567: `then` makes any other change to the ticket's text.
export function noteInTicket(at, t, line, message, then = text => text) {
  const text = then(replaceSection(t.raw, 'Notes', old => (old ? `${old}\n${line}` : line), path.relative(at, t.file)));
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

// 0567: why the agent can't go with its own recommendation for ticket `t` in checkout `at`, or null when it can. The
// choice waits for you in the same cases as the Go with the recommendation button's with watch: decide (goWith). A size
// guard's block is left to that check, which takes only a split. 0636: a check in the app may also decide with watch: fix.
function cantDecide(cfg, t, at, rec, checking = false) {
  const pad = t.fm.id, watch = fixingOf(cfg);
  if (watch !== 'decide' && !(checking && watch === 'fix')) return `speck watch decide works only with watch: decide${checking ? ' or fix' : ''}, and watch is ${watch} here`;
  if (t.fm.risk !== 'low') return `Ticket ${pad} is ${t.fm.risk === 'high' ? 'high risk' : 'of unknown risk'}, so its question waits for the user`;
  if (choseCount(t.sections.notes) >= MAX_DECIDED) return `${speckNameOf(cfg)} has already taken ${MAX_DECIDED} recommendations for ticket ${pad}, so its question waits for the user`;
  if (t.fm.status === 'blocked' && questionFacts(contentLines(t.sections['blocked question'])).sizeGuard === true) return `Ticket ${pad} is blocked by the size guard, so its question waits for the user`;
  if (!Object.hasOwn(rec || {}, 'exited') && Number.isInteger(rec?.pid) && rec.pid > 0 && pidAlive(rec.pid)) return `Ticket ${pad}'s build is still running`;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: at }).stdout.trim();
  return branch.startsWith(`${cfg.branch_prefix}${pad}-`) ? null : `Ticket ${pad}'s branch isn't checked out where its build left it, so the choice can't be committed there`;
}

// One action of the Foreman agent, from its brief: checked, noted in the ticket and recorded for speck run, which carries
// out a resume or a reship once the agent has ended. `token` is the agent's run (SPECK_FOREMAN_RUN). One action a run.
// Returns what it says.
export function foremanAction(repo, args, { token = process.env.SPECK_FOREMAN_RUN, now = new Date(), tickets = null } = {}) {
  const { at: atText, left } = takeAt(args); // 0625
  const words = left.filter(a => !a.startsWith('--'));
  const [action, rawId, ...rest] = words;
  const oneLine = v => textOf(v).replace(/\s+/g, ' '); // kept to one line in the Notes
  const why = oneLine((args.find(a => a.startsWith('--why=')) || '').slice('--why='.length));
  const saw = oneLine((args.find(a => a.startsWith('--saw=')) || '').slice('--saw='.length)); // 0636
  if (!Object.hasOwn(ACTIONS, action || '') || !rawId) throw new SpeckError(USAGE);
  const cfg = loadConfig(repo);
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const runs = path.join(main, 'speck', '.cache', 'runs');
  const s = readAgentState(runs);
  if (!token || !s.running || s.running.token !== token) throw new SpeckError(`Only the agent speck run starts to look into a stop may run speck watch, and none is running as this one. ${USAGE}`);
  let at, t;
  try { ({ at, t } = buildTicket(repo, cfg, rawId)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`No ticket ${rawId}: ${e.message}`); throw e; }
  const id = t.fm.id;
  if (s.running.id !== id) throw new SpeckError(`This run is looking into ticket ${s.running.id}, not ${id}.`);
  if (s.running.long && !LONG_ACTIONS.includes(action)) throw new SpeckError(`Ticket ${id}'s build is still running, so speck watch ${action} can't be used on it. Use fix or tell.`);
  if (!s.running.long && action === 'tell') throw new SpeckError(`speck watch tell is for a build that runs long, and ticket ${id} stopped. Choose another action.`);
  if (readActions(runs).some(a => a.run === token)) throw new SpeckError(`This run has already taken its one action for ${id}. Stop here.`);
  const text = oneLine(rest.join(' ')), check = checkOf(s.running); // 0636: a check in the app may only decide or ask, saying what it saw
  if (check && !CHECK_ACTIONS.includes(action)) throw new SpeckError(`This run is checking ticket ${id}'s question in the app, so speck watch ${action} can't be used. Use decide or ask.`);
  if (check && !saw) throw new SpeckError(`Say what you checked and saw in the app with --saw="<what you saw, in a sentence>". ${USAGE}`);
  if (!check && saw) throw new SpeckError(`--saw is only for checking a question in the app, so nothing was changed. ${USAGE}`);
  if (check && checkStale(t, s.running)) throw new SpeckError(`${checkStale(t, s.running)}, so nothing was changed. Stop here: speck run checks a new question by itself.`);
  const rec = check && action === 'decide' ? String(questionFacts(contentLines(t.sections['blocked question'])).recommendation || '') : '';
  if (check && action === 'decide' && (!rec || rec.trim().toLowerCase() !== text.trim().toLowerCase()))
    throw new SpeckError(`A check in the app goes only with the build's recommendation${rec ? `, "${rec}"` : ', and it has none'}, so nothing was changed. Ask the user instead.`);
  if (!why) throw new SpeckError(`Say why with --why="<why, in a sentence>". ${USAGE}`);
  if (action !== 'reship' && !text) throw new SpeckError(`speck watch ${action} needs ${action === 'resume' ? 'the instruction for the build' : action === 'fix' ? 'the fix ticket\'s title' : action === 'decide' ? 'the option you recommend' : action === 'tell' ? 'what you found' : 'the question'}. ${USAGE}`);
  if (atText !== undefined && action !== 'resume') throw new SpeckError(`--at works only with speck watch resume, so nothing was changed. ${USAGE}`);
  const resumeAt = atText === undefined ? null : resumeTime(atText, now); // 0625
  if (['done', 'cancelled'].includes(t.fm.status)) throw new SpeckError(`Ticket ${id} is ${t.fm.status}, so there's nothing to do for it.`);
  if (action === 'decide') { // 0567
    const no = cantDecide(cfg, t, at, readObject(path.join(runs, `${id}.json`)), !!check);
    if (no) throw new SpeckError(`${no}, so nothing was changed. Choose another action.`);
  }
  if (action === 'resume' || action === 'decide') {
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
    : action === 'fix' ? `made draft fix ticket ${fixId}: ${text}` : action === 'tell' ? `told you: ${text.replace(/\.$/, '')}` : `asked you: ${text}`;
  // 0567: decide says it as the button does, which is how the board reads it, and sets a blocked ticket building as it does.
  const checked = check ? checkedSays(check.line, saw, s.running.qa === true) : ''; // 0636: what it checked in the app and saw
  if (action === 'decide') noteInTicket(at, t, `- Went with the recommendation: ${text} (${FOREMAN_CHOSE}, as watch is ${fixingOf(cfg)}, ${when}).${checked}`, `${foremanSubject(id)} decide`,
    raw => (t.fm.status === 'blocked' ? syncHeader(waitFields(setField(raw, 'status', 'building'), 'blocked', 'building', now.getTime())) : raw));
  else if (resumeAt !== null) noteInTicket(at, t, `- speck (${when}) I'll resume ${id} at ${resumeClock(resumeAt, now.getTime())}: ${resumeWhy(why)} Its instruction: ${text}`, `${foremanSubject(id)} ${action}`); // 0625
  else noteInTicket(at, t, `- speck (${when}) ${checked ? did.replace(/\.$/, '') : did}.${checked} Why: ${why}`, `${foremanSubject(id)} ${action}`);
  // 0567: a decide keeps what its resume checks the ticket against: its commit, its build's session and its status now. 0618: so does a resume.
  const decided = action === 'decide' || action === 'resume' ? { status: action === 'decide' && t.fm.status === 'blocked' ? 'building' : t.fm.status, head: sh('git', ['rev-parse', 'HEAD'], { cwd: at }).stdout.trim(), session: readObject(path.join(runs, `${id}.json`))?.session } : {};
  if (action === 'decide') { // 0589: a run record that can't be saved loses only the call's question and other options, as the choice stands
    const file = path.join(runs, `${id}.json`), facts = t.fm.status === 'blocked' ? questionFacts(contentLines(t.sections['blocked question'])) : {}; // any other ticket's section is an old question
    try { saveRecord(file, withCall(runs, id, readObject(file), callOf(facts, text, now))); } catch { /* the Notes still list it */ }
  }
  const entry = { run: token, id, action, text, why, at: now.toISOString(), status: t.fm.status, ...decided, ...(action === 'decide' ? { watch: fixingOf(cfg) } : {}), ...(fixId ? { fix_id: fixId } : {}), ...(resumeAt !== null ? { resume_at: new Date(resumeAt).toISOString() } : {}) };
  fs.appendFileSync(path.join(runs, DID), `${JSON.stringify(entry)}\n`);
  return {
    resume: resumeAt !== null ? `Noted in ${id}'s Notes. speck run resumes its build at ${resumeClock(resumeAt, now.getTime())} with your instruction, unless the ticket has moved on by then. Stop here.` : `Noted in ${id}'s Notes. speck run resumes its build with your instruction once you've ended. Stop here.`,
    reship: `Noted in ${id}'s Notes. speck run ships it again once you've ended. Stop here.`,
    fix: `Made draft fix ticket ${fixId}, which waits for the user to shape it and set it ready, and noted it in ${id}'s Notes. Stop here.`,
    ask: `Noted in ${id}'s Notes. speck's status shows your question to the user. Stop here.`,
    decide: `Noted in ${id}'s Notes. speck run resumes its build with your recommendation once you've ended. Stop here.`,
    tell: `Noted in ${id}'s Notes. speck run says it in its log once you've ended, and it needs no answer. Stop here.`,
  }[action];
}

// speck watch <action> <id> …: the agent's. 0486: speck foreman, the old name, takes these and your answer and dismiss.
export function cmdWatch(args) { console.log(foremanAction(findRepoRoot(), args)); } // a declaration, as speck.mjs takes it while the modules load
export function cmdForeman(args) {
  if (['answer', 'dismiss'].includes(args[0])) return cmdForemanReply(args); // 0318: yours
  cmdWatch(args);
}
