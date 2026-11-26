// 0764: what a project's line (projectLine, panel-line.mjs) needs beyond its board, read each time speck serve's front
// asks the panel for its summary: the settings, the model providers and speck run's records of the work in hand.
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, runsOf } from './speck.mjs';
import { ticketRounds } from './core.mjs';
import { knownProviders } from './custom-providers.mjs';
import { readAgentState } from './foreman-agent.mjs';
import { checkOf } from './app-check.mjs';
import { roundStarted } from './review-running.mjs';
import { stationOf } from './panel-line.mjs';

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
const named = v => (typeof v === 'string' && v.trim() ? v.trim() : null);
const at = v => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : null);

// When board ticket `t`'s last review round was saved, from its file where the board read it, or null.
function lastRound(repo, t) {
  if (typeof t.path !== 'string' || !t.path) return null;
  const from = typeof t.worktree === 'string' && t.worktree ? t.worktree : repo;
  try { return at(ticketRounds(fs.readFileSync(path.join(from, t.path), 'utf8')).rounds.at(-1)?.meta?.saved_at); } catch { return null; }
}

// { cfg, providers, tickets, check }, or null when the settings can't be read. `tickets` has, by id, for each ticket at
// the builder: `stands_in_for`, the agent its build stands in for on the builder's bench (0647's start, 0648's take-over),
// `resumed`, when the watch agent last resumed its build, and `last_round`, when its last review round was saved; for each
// at the reviewer, `round`, roundStarted's for the round being run. `check` is QA's check in the running app now (0636):
// { id, agent, started }, or null. `runs` is speck run's records folder in the main checkout.
export function lineFacts(repo, board, runs = runsOf(repo)) {
  let cfg, providers;
  try { cfg = loadConfig(repo); providers = knownProviders(repo); } catch { return null; }
  const tickets = new Map();
  for (const t of Array.isArray(board?.tickets) ? board.tickets : []) {
    const id = t && typeof t === 'object' ? String(t.id ?? '') : '', station = id ? stationOf(t) : null;
    if (!/^[\w-]+$/.test(id) || tickets.has(id) || (station !== 'builder' && station !== 'reviewer')) continue;
    if (station === 'reviewer') { tickets.set(id, { round: roundStarted(runs, id) }); continue; }
    const rec = readObject(path.join(runs, `${id}.json`)) ?? {}, rounds = Array.isArray(t.rounds) && t.rounds.length > 0;
    tickets.set(id, { stands_in_for: named(rec.stand_in?.for) ?? named(rec.took_over?.from), resumed: at(rec.foreman_resumed), last_round: rounds ? lastRound(repo, t) : null });
  }
  let check = null;
  try { const r = readAgentState(runs).running; if (r && checkOf(r)) check = { id: String(r.id), agent: named(r.agent), started: at(r.started) }; } catch { /* none running */ }
  return { cfg, providers, tickets: Object.fromEntries(tickets), check };
}
