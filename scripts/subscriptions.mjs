// 0646: the Settings view's "Your subscriptions": each of your agents with how much of its plan is left and when it
// resets, from the readings speck keeps (agent-usage.mjs), read afresh each time Settings opens. Cursor's is read again
// from its usage screen when it's stale, as `speck agents` reads it. A model provider on an API key has no plan to
// read, so it shows this week's spend from what speck recorded instead. The panel's GET /api/usage answers it, apart
// from GET /api/settings, so a slow read of Cursor's screen holds up nothing else in the view.

import fs from 'node:fs';
import path from 'node:path';
import { sharedCacheDir } from './turns.mjs';
import { knownProviders } from './custom-providers.mjs';
import { findAgentsAsync } from './agents.mjs';
import { readUsage, saveUsage, cursorUsageStale } from './agent-usage.mjs';
import { readCursorUsage } from './cursor-usage.mjs';
import { yourAgentsView } from './your-agents.mjs';
import { spendReport, runsOf } from './spend-view.mjs';
import { loadConfig } from './core.mjs';

// Each window's name as the view shows it, in this order.
export const WINDOW_LABELS = Object.freeze({ five_hour: '5 hours', seven_day: 'Week', included: 'Month', auto: 'Auto', api: 'API' });
// From this much used, a window's bar is in the needs-you colour.
export const HIGH_PERCENT = 90;

const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const iso = v => (typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(Date.parse(v)).toISOString() : null);
const day = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const PLANS = { pro: 'Pro', plus: 'Plus', max: 'Max', team: 'Team', business: 'Business', enterprise: 'Enterprise', free: 'Free', premium: 'Premium' };
const planName = v => (typeof v === 'string' && v.trim() ? (Object.hasOwn(PLANS, v.trim().toLowerCase()) ? PLANS[v.trim().toLowerCase()] : v.trim().slice(0, 40)) : null);

// Codex says which limit it reached as its own name for it: the window it names, or else each window used up.
function codexRefused(reading, name, w) {
  if (reading.limit_reached !== true) return false;
  const said = String(reading.limit_type ?? '').toLowerCase();
  const named = /primary|five|5h|hour/.test(said) ? 'five_hour' : /secondary|week|seven|7d/.test(said) ? 'seven_day' : null;
  return named ? named === name : (num(w.used_percent) ?? 0) >= 100;
}

// One kept reading as the view shows it: { plan, read_at, windows: [{ name, label, used_percent, resets_at, resets_on,
// high, limited }] }, windows in WINDOW_LABELS' order. A window whose reset time has passed isn't limited any more.
export function readingShown(agent, reading, now = Date.now()) {
  const windows = Object.keys(WINDOW_LABELS).filter(n => plain(reading.windows?.[n])).map(name => {
    const w = reading.windows[name], used = num(w.used_percent), resets_at = iso(w.resets_at), resets_on = resets_at ? null : day(reading.resets_on);
    const over = resets_at ? Date.parse(resets_at) <= now : false;
    const refused = !over && (w.refused === true || (agent === 'codex' && codexRefused(reading, name, w)));
    return { name, label: WINDOW_LABELS[name], used_percent: used === null ? null : Math.max(0, Math.min(100, used)), resets_at, resets_on,
      high: refused || (used !== null && used >= HIGH_PERCENT), limited: refused };
  });
  const od = plain(reading.on_demand) && num(reading.on_demand.spent) !== null ? { on_demand: { spent: reading.on_demand.spent, limit: num(reading.on_demand.limit) } } : {};
  return { plan: planName(reading.plan), read_at: iso(reading.read_at), windows, ...od };
}

// Why an agent has no reading, in one line.
const NONE = {
  claude: 'No reading yet: speck reads it when a build or a watch run on Claude Code ends.',
  codex: 'No reading yet: speck reads it when a build, a review or a watch run on Codex ends.',
  cursor: 'No reading yet: speck reads it from Cursor\'s usage screen when Settings opens, once Cursor is installed and signed in.',
};

// The local Monday this week started on, as YYYY-MM-DD, as speck spend's weeks start.
export function weekStart(now = Date.now()) {
  const d = new Date(now), m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`;
}

// What provider `p`'s models spent since `since`, from `rows` (speck spend --by=model's): { cost_usd, cost_unknown },
// cost_usd 0 when nothing was spent on them, and null when `rows` is null, as speck's records couldn't be read.
export function providerSpend(p, rows) {
  if (!Array.isArray(rows)) return { cost_usd: null, cost_unknown: false };
  const mine = rows.filter(r => p.models.includes(r.model));
  let cost = 0;
  for (const r of mine) if (num(r.cost_usd) !== null) cost = Math.round((cost + r.cost_usd) * 1e10) / 1e10;
  return { cost_usd: cost, cost_unknown: mine.some(r => r.cost_unknown === true) };
}

// Whether speck's spend records in `runs` can all be read: speck spend's readers take a record they can't read as none,
// which would show a provider's spend as $0. None at all is fine: nothing was recorded.
export function spendReadable(runs) {
  let names;
  try { names = fs.readdirSync(runs); } catch (e) { return e.code === 'ENOENT'; }
  return names.filter(n => /\.(json|jsonl|log)$/.test(n)).every(n => {
    try { fs.accessSync(path.join(runs, n), fs.constants.R_OK); return true; } catch (e) { return e.code === 'ENOENT'; }
  });
}

// Reads Cursor's usage again when it's yours, ready and stale, keeping it as `speck agents` does. Two Settings opened at
// once share one read. null when it didn't read, '' when it kept a new reading, or why it couldn't, in a few words.
let cursorReading = null;
async function refreshCursor(repo, cursor, readCursor, now) {
  if (!cursor || cursor.ready !== true || !cursorUsageStale(repo, now)) return null;
  cursorReading ??= (async () => {
    try {
      const got = await readCursor({ command: cursor.command || 'agent', cwd: sharedCacheDir(repo, path.join('machine', 'cursor-usage')) });
      if (got?.reading && saveUsage(repo, 'cursor', got.reading)) return '';
      return got?.reading ? 'speck couldn\'t keep what it read' : got?.why || 'it gave nothing to read';
    } catch (e) { return String(e?.message ?? e).split('\n')[0]; }
    finally { cursorReading = null; }
  })();
  return cursorReading;
}

// What GET /api/usage answers: { agents: [...] }, each of your agents in Your agents' order, as { id, name, kind } and
// for an agent `reading` (readingShown's) or `none`, why it has none, in one line, with `why` when a fresh read of
// Cursor failed; for a provider `spend`, this week's, with `since` and `read_at`. Or { why } in one line.
export async function subscriptionsAnswer(repo, { find = findAgentsAsync, readCursor = readCursorUsage, now = Date.now, providers = knownProviders(repo) } = {}) {
  let view;
  try {
    const found = await find({ models: false });
    view = yourAgentsView(repo, found, loadConfig(repo), { providers });
    view.agents = view.agents.map(a => ({ ...a, command: found.agents.find(f => f.id === a.id)?.command }));
  } catch (e) { return { why: `Couldn't read your agents: ${String(e?.message ?? e).split('\n')[0]}.` }; }
  const mine = view.agents.filter(a => a.yours === true);
  const cursorWhy = await refreshCursor(repo, mine.find(a => a.id === 'cursor'), readCursor, now());
  const usage = readUsage(repo), at = now(), since = weekStart(at);
  let rows = null;
  const spendRows = () => {
    if (rows === null) { try { rows = spendReadable(runsOf(repo)) ? spendReport(repo, { by: 'model', since }).rows : false; } catch { rows = false; } }
    return rows || null;
  };
  return { agents: mine.map(a => {
    const base = { id: a.id, name: a.name, kind: a.kind };
    if (a.kind === 'provider') {
      const p = providers.find(x => x.name === a.id);
      return { ...base, spend: { ...providerSpend({ models: Array.isArray(p?.models) ? p.models : [] }, spendRows()), since }, read_at: new Date(at).toISOString() };
    }
    const why = a.id === 'cursor' && cursorWhy ? { why: `Couldn't read Cursor's usage just now: ${cursorWhy}.` } : {};
    const shown = usage[a.id] ? readingShown(a.id, usage[a.id], at) : null;
    return shown && shown.read_at ? { ...base, reading: shown, ...why } : { ...base, none: Object.hasOwn(NONE, a.id) ? NONE[a.id] : 'No reading yet.', ...why };
  }) };
}

// 0720: the agents the bridge warns about, from speck's newest kept readings, without reading any of them again:
// [{ id, name, windows: [{ label, used_percent, limited, resets_at, resets_on }] }], each agent with a window at
// HIGH_PERCENT or more, or limited, and only those windows. A window whose reset time has passed has reset since its
// reading, so it isn't one.
const USAGE_NAMES = Object.freeze({ claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' });
const stillOpen = (w, now) => !(w.resets_at && Date.parse(w.resets_at) <= now);
const asWarn = (w, limited = w.limited) => ({ label: w.label, used_percent: w.used_percent, limited, resets_at: w.resets_at, resets_on: w.resets_on });
// Which Codex window limit_type names, as readingShown/codexRefused map it, or null when the type names none (the bridge
// then falls back below). Recognised names that have already reset must not fall back onto another window.
function codexLimitWindow(reading) {
  if (reading.limit_reached !== true) return false;
  const said = String(reading.limit_type ?? '').toLowerCase();
  if (/primary|five|5h|hour/.test(said)) return 'five_hour';
  if (/secondary|week|seven|7d/.test(said)) return 'seven_day';
  return null;
}
export function usageWarnings(usage, now = Date.now()) {
  if (!plain(usage)) return [];
  return Object.keys(USAGE_NAMES).filter(id => Object.hasOwn(usage, id) && plain(usage[id])).flatMap(id => {
    const reading = usage[id], shown = readingShown(id, reading, now);
    if (!shown.read_at) return [];
    let windows = shown.windows.filter(w => w.high && stillOpen(w, now)).map(w => asWarn(w));
    // An explicit limit_reached whose type names no window (and whose windows are under 100%) still counts for the
    // bridge: name the agent and every open window with the reset times speck has, marked limited. A recognised type
    // that has already reset is left out: its window is no longer limited.
    if (!windows.length && codexLimitWindow(reading) === null)
      windows = shown.windows.filter(w => stillOpen(w, now)).map(w => asWarn(w, true));
    return windows.length ? [{ id, name: USAGE_NAMES[id], windows }] : [];
  });
}

// 0768: each subscription as the factory floor shows it, from speck's newest kept readings (newestUsage's), without
// reading any of them again: [{ id, name, label, used_percent, resets_at, resets_on, high, limited }], in Claude Code,
// Codex, Cursor order, each with its tightest window: a limited one, or else the one most used. A window whose reset
// time has passed has reset since its reading, so it's left out; an agent with no reading, or no window left, isn't there.
export function floorUsage(usage, now = Date.now()) {
  if (!plain(usage)) return [];
  return Object.keys(USAGE_NAMES).filter(id => Object.hasOwn(usage, id) && plain(usage[id])).flatMap(id => {
    const shown = readingShown(id, usage[id], now);
    if (!shown.read_at) return [];
    const open = shown.windows.filter(w => stillOpen(w, now) && (w.limited || w.used_percent !== null));
    if (!open.length) return [];
    const rank = w => (w.limited ? 1000 : w.used_percent);
    const w = open.reduce((a, b) => (rank(b) > rank(a) ? b : a));
    // A limit_reached whose type names no window still limits it, as the bridge warns (usageWarnings).
    const limited = w.limited || (!open.some(x => x.limited) && codexLimitWindow(usage[id]) === null);
    return [{ id, name: USAGE_NAMES[id], label: w.label, used_percent: limited && w.used_percent === null ? 100 : w.used_percent,
      resets_at: w.resets_at, resets_on: w.resets_on, high: w.high || limited, limited }];
  });
}
