// 0764: the line on the factory floor (0766), as a project's summary gives it (projectSummary): each ticket being built,
// reviewed or checked in the running app, at its station, with the agent, model and effort it runs on, why it's on them
// and since when; what each station would run on for a new ticket with no level, and whether QA is set up; and the queue.
// `facts` are lineFacts' (line-facts.mjs): the settings, the model providers and speck run's records of the work in hand,
// or null when they couldn't be read, when only what the board says is given.
import { blank, ticketAgents, reviewerSettings, byPriority, setting } from './core.mjs';
import { buildsWith, agentName, modelName } from './level-builds.mjs';
import { providerNamed } from './provider-review.mjs';
import { qaConfig } from './app-check.mjs';
import { benchOwnAgent } from './bench.mjs';
import { fixingOf, speckActs } from './foreman.mjs';

const list = v => (Array.isArray(v) ? v : []);
const obj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const text = v => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const time = v => { const n = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(n) ? n : null; };
const iso = n => (n === null ? null : new Date(n).toISOString());
const shipping = t => obj(t.ship) && t.ship.running === true;

// AC4: a model left blank, in the words a ticket's Builder fact gives it: Claude Code's own default, which depends on the
// account, so no model is named (0700), as Settings says it too, or any other agent's default model. A model provider's
// blank model is its default model, by name, as the provider is given it.
export const BLANK_MODEL = Object.freeze({ claude: 'its own default', other: 'default model' });
const DEFAULT_EFFORT = 'default effort';
const UNKNOWN = Object.freeze({ agent: null, agent_name: null, model: null, model_slug: null, effort: null });

// What a station runs on, in words: the agent and its name, the model by name and as the agent is given it ('' when it's
// left to the agent), and the effort ('default effort' when it's left to the agent, null when the agent isn't given one).
function runsOn(agent, slug, effort, providers, takesEffort) {
  const p = providerNamed(agent, providers), given = text(slug) || (p ? text(p.defaultModel) : '');
  const claude = agent === 'claude' || agent === 'claude-subagent';
  return { agent, agent_name: agent === 'claude-subagent' ? 'Claude Code subagent' : agentName(agent, providers),
    model: given ? modelName(claude ? 'claude' : agent, given, providers) : claude ? BLANK_MODEL.claude : BLANK_MODEL.other,
    model_slug: given, effort: takesEffort ? text(effort) || DEFAULT_EFFORT : null };
}
// A build as the board gives it (a ticket's build_with or a level_builds entry), in runsOn's words, as its Builder fact says it.
const builtWith = b => ({ agent: text(b.builder) || null, agent_name: text(b.agent) || null, model: text(b.model) || (b.builder === 'claude' ? BLANK_MODEL.claude : BLANK_MODEL.other),
  model_slug: text(b.model_slug), effort: b.effort === null ? null : text(b.effort) || DEFAULT_EFFORT });
// Whether a reviewer, or QA, on `agent` is given an effort: Cursor's model names carry it, and a model provider isn't given one.
const reviewerEffort = (agent, providers) => agent !== 'cursor' && !providerNamed(agent, providers);
const qaEffort = agent => agent === 'claude' || agent === 'codex'; // as foremanArgv gives it

// AC2: what each station would run on for a new ticket with no level: the builder as the board's Default level builds,
// the reviewer and QA as the settings give them, QA on the watch agent's while its own settings are blank (0651), and
// whether QA is set up: whether speck checks a build's question in the running app at all (watch fix or decide).
export function idleStations(board, facts) {
  const cfg = obj(facts) && obj(facts.cfg) ? facts.cfg : null, providers = list(facts && facts.providers);
  const own = list(board && board.level_builds).find(b => obj(b) && b.name === '');
  const builder = own ? builtWith(own) : cfg ? builtWith(buildsWith({ level: '' }, cfg, providers)) : { ...UNKNOWN };
  if (!cfg) return { builder, reviewer: { ...UNKNOWN }, qa: { ...UNKNOWN, set_up: null } };
  const { reviewer } = ticketAgents({}, cfg), r = reviewerSettings({}, cfg);
  const qa = qaConfig(cfg, providers), q = benchOwnAgent(cfg, 'qa_bench', providers);
  return { builder, reviewer: runsOn(reviewer, r.model, r.effort, providers, reviewerEffort(reviewer, providers)),
    qa: { ...runsOn(q, setting(qa, 'watch_model'), setting(qa, 'watch_effort'), providers, qaEffort(q)), set_up: speckActs(fixingOf(cfg)) } };
}

// The station ticket `t` is at, as the panel reads it (0223): the reviewer's while a round of its review runs, or while
// it's reviewing and the board doesn't say it's between rounds; the builder's while it's building or has a round's
// findings to fix, or has been handed back to its build since it was approved; and QA's while QA checks its question in
// the running app, or is to (0713). null when it's at none.
export function stationOf(t) {
  const running = Number.isInteger(t.review_running) && t.review_running > 0;
  if (t.status === 'building') return running ? 'reviewer' : 'builder';
  if (t.status === 'reviewing') return running || !(t.review_running === null && list(t.rounds).length) ? 'reviewer' : 'builder';
  if (t.status === 'blocked') return t.app_checking === true ? 'qa' : null;
  const handed = time(t.handed_back), approved = time(t.approved);
  return t.status === 'approved' && t.build_running === true && !shipping(t) && handed !== null && (approved === null || handed >= approved) ? 'builder' : null;
}

// Ticket `t`'s own facts in `facts`, or {}.
const factsOf = (facts, id) => (obj(facts) && obj(facts.tickets) && Object.hasOwn(facts.tickets, id) && obj(facts.tickets[id]) ? facts.tickets[id] : {});
const why = (reason, o = {}) => ({ why: reason, level: o.level ?? null, stands_in_for: o.for ?? null });
const standsIn = (agent, providers) => (agent ? { agent, agent_name: agent === 'claude-subagent' ? 'Claude Code subagent' : agentName(agent, providers) } : null);

// At the builder: what its build runs on, as its Builder fact says it (0669), and why: its own fields, its level, the
// settings, or a stand-in from the builder's bench (0647, 0648). Since it last got there: its build started, it was handed
// back or resumed by the watch agent, or a review round it has to fix was recorded, whichever was last.
function atBuilder(t, f, providers) {
  const b = obj(t.build_with) ? t.build_with : null;
  const on = b ? builtWith(b) : runsOn(text(t.builder) || 'claude', text(t.builder_model), '', providers, false);
  const from = b ? text(b.from) : '', bench = text(f.stands_in_for) && f.stands_in_for !== on.agent ? text(f.stands_in_for) : '';
  const since = Math.max(...[t.started, t.handed_back, f.resumed, f.last_round].map(time).filter(n => n !== null));
  return { ...on, ...(bench ? why('bench', { for: standsIn(bench, providers) }) : from === 'ticket' ? why('ticket') : from && from !== 'default' ? why('level', { level: from }) : why('settings')),
    since: Number.isFinite(since) ? iso(since) : null };
}

// At the reviewer: the round being run, on a stand-in from the reviewer's bench, on its own default model and effort
// (0649), or on the ticket's reviewer, model and effort, its own or the settings'. Since the round started.
function atReviewer(t, f, providers, idle, cfg) {
  const round = obj(f.round) ? f.round : {}, sub = obj(round.stand_in) && text(round.stand_in.name) ? round.stand_in : null, since = iso(time(round.started));
  if (sub) return { ...runsOn(text(sub.name), '', '', providers, reviewerEffort(text(sub.name), providers)), ...why('bench', { for: standsIn(text(sub.for), providers) }), since };
  const agent = text(t.reviewer) || idle.reviewer.agent || 'codex', effort = text(t.reviewer_effort) || text(cfg && cfg.reviewer_effort);
  const own = (idle.reviewer.agent !== null && agent !== idle.reviewer.agent) || !blank(t.reviewer_model) || !blank(t.reviewer_effort);
  return { ...runsOn(agent, text(t.review_model), effort, providers, reviewerEffort(agent, providers)), ...why(own ? 'ticket' : 'settings'), since };
}

// At QA: the check in the app running now, on QA's own agent, model and effort, or on a stand-in from its bench, on that
// agent's own defaults (0651); one still to run, on QA's own. Since the check started, or null while it waits.
function atQa(t, facts, providers, idle) {
  const c = obj(facts) && obj(facts.check) && String(facts.check.id) === String(t.id) ? facts.check : null, since = iso(time(c && c.started));
  const { set_up: _, ...own } = idle.qa, agent = c ? text(c.agent) : '';
  if (agent && agent !== own.agent) return { ...runsOn(agent, '', '', providers, qaEffort(agent)), ...(own.agent ? why('bench', { for: standsIn(own.agent, providers) }) : why('settings')), since };
  return { ...own, ...why('settings'), since };
}

// The line: `work`, each ticket at the builder, the reviewer or QA (AC1), in that order and the board's within each; `idle`,
// what each station would run on (AC2); and `queue`, how many tickets are ready and the next three by priority (AC3).
export function projectLine({ board, facts = null }) {
  const tickets = list(board && board.tickets).filter(obj), cfg = obj(facts) && obj(facts.cfg) ? facts.cfg : null;
  const providers = list(facts && facts.providers), idle = idleStations(board, facts), at = { builder: [], reviewer: [], qa: [] };
  for (const t of tickets) {
    const station = stationOf(t), id = String(t.id ?? ''), f = factsOf(facts, id);
    if (!station) continue;
    const on = station === 'builder' ? atBuilder(t, f, providers) : station === 'reviewer' ? atReviewer(t, f, providers, idle, cfg) : atQa(t, facts, providers, idle);
    at[station].push({ id, title: text(t.title), station, ...on });
  }
  const ready = tickets.filter(t => t.status === 'ready');
  return { work: [...at.builder, ...at.reviewer, ...at.qa], idle, queue: { ready: ready.length, next: [...ready].sort(byPriority).slice(0, 3).map(t => String(t.id ?? '')) } };
}
