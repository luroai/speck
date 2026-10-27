// 0527: speck spend, what the project's tickets spent on AI, by ticket, model, week or month.

import path from 'node:path';
import { SpeckError, findRepoRoot, loadConfig, listTickets, ticketsElsewhere, ticketRounds, worktreeList, padId } from './core.mjs';
import { spendParts, sumParts } from './spend.mjs';
import { backfill, backfillLines } from './backfill.mjs';

const VIEWS = ['ticket', 'model', 'week', 'month'];
const USAGE = 'Usage: speck spend [--by=ticket|model|week|month] [--since=YYYY-MM-DD] [--until=YYYY-MM-DD] [--json], or speck spend --backfill';

// The main checkout, where speck run starts builds, or `repo` when it isn't a git checkout.
function mainOf(repo) {
  try { return worktreeList(repo)[0]?.path || repo; } catch { return repo; }
}
// The main checkout's speck/.cache/runs/, where speck run keeps its records and logs.
const runsOf = repo => path.join(mainOf(repo), 'speck', '.cache', 'runs');

// Every ticket, from the worktree its branch is checked out in when it's there, as speck status reads them.
function allTickets(repo) {
  const tickets = listTickets(repo);
  let elsewhere = [];
  try { elsewhere = ticketsElsewhere(repo, loadConfig(repo)); } catch { /* not a git checkout: only these */ }
  for (const t of elsewhere) {
    const i = tickets.findIndex(x => x.fm.id === t.fm.id);
    if (i >= 0) tickets[i] = t; else tickets.push(t);
  }
  return tickets;
}

const two = n => String(n).padStart(2, '0');
const day = d => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
// The local day `iso` ended on, its week's Monday and its month, or nulls when it isn't known.
const when = iso => {
  if (!iso) return { day: null, week: null, month: null };
  const d = new Date(iso), monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return { day: day(d), week: day(monday), month: day(d).slice(0, 7) };
};

// A YYYY-MM-DD date that's a real day, or a SpeckError saying why not.
function dateArg(name, v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? '');
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3])
    throw new SpeckError(`--${name}=${v ?? ''} isn't a date: give a real day as YYYY-MM-DD, for example --${name}=2026-10-01.`);
  return v;
}

// The options `args` give: {by, since, until, json, backfill}, or a SpeckError saying what's wrong.
export function spendOptions(args) {
  const o = { by: 'ticket', since: null, until: null, json: false, backfill: false };
  for (const a of args) {
    const [k, ...rest] = a.split('='), v = rest.length ? rest.join('=') : null;
    if (k === '--json' && v === null) o.json = true;
    else if (k === '--backfill' && v === null) o.backfill = true;
    else if (k === '--by' && VIEWS.includes(v)) o.by = v;
    else if (k === '--by') throw new SpeckError(`--by=${v ?? ''} isn't a view: give ticket, model, week or month.\n${USAGE}`);
    else if (k === '--since' || k === '--until') o[k.slice(2)] = dateArg(k.slice(2), v);
    else throw new SpeckError(`Unknown option "${a}".\n${USAGE}`);
  }
  if (o.backfill && args.length > 1) throw new SpeckError(`--backfill takes no other options: run speck spend --backfill on its own, then speck spend to see the spend.\n${USAGE}`);
  if (o.since && o.until && o.since > o.until) throw new SpeckError(`--since=${o.since} is after --until=${o.until}, so no day is in between: give a --since on or before the --until.`);
  return o;
}

const plain = v => typeof v === 'number' && Number.isFinite(v);
// A cost and whether it leaves out spend whose cost is unknown: the sum of the known costs (null when none is known).
function costOf(items) {
  let cost = null;
  for (const x of items) if (plain(x.cost_usd)) cost = Math.round(((cost ?? 0) + x.cost_usd) * 1e10) / 1e10;
  return { cost_usd: cost, cost_unknown: items.some(x => !plain(x.cost_usd) && x.tokens > 0) };
}
const tokensOf = items => items.reduce((t, x) => t + (plain(x.tokens) ? x.tokens : 0), 0);

// What speck spend shows for the tickets in `repo`: {by, since, until, rows, totals}, every cost the sum of the known
// costs, null when none is known, with cost_unknown saying whether it leaves out spend whose cost isn't known.
export function spendReport(repo, { by = 'ticket', since = null, until = null } = {}) {
  const runs = runsOf(repo);
  const counted = x => (!since && !until) || (x.day && (!since || x.day >= since) && (!until || x.day <= until));
  const tickets = allTickets(repo).sort((a, b) => padId(a.fm.id).localeCompare(padId(b.fm.id))).map(t => {
    let rounds = [];
    try { rounds = ticketRounds(t.raw).rounds; } catch { /* rounds it can't read count nothing */ }
    const parts = spendParts(runs, t.fm.id, rounds).map(x => ({ ...x, ...when(x.ended) })).filter(counted);
    return { t, parts };
  }).filter(x => x.parts.length);
  const all = tickets.flatMap(x => x.parts), sum = sumParts(all);
  const totals = { cost_usd: sum.total_cost_usd, cost_unknown: sum.total_cost_unknown.length > 0, tokens: tokensOf(all),
    tickets_with_unknown_cost: tickets.filter(x => sumParts(x.parts).total_cost_unknown.length).length };
  let rows;
  if (by === 'ticket') {
    rows = tickets.map(({ t, parts }) => {
      const s = sumParts(parts), of = p => costOf(parts.filter(x => x.part === p));
      return { id: padId(t.fm.id), title: String(t.fm.title ?? ''), builder: of('builder'), reviewer: of('reviewer'), watch: of('watch'), delegated: of('delegated'),
        total: { cost_usd: s.total_cost_usd, cost_unknown: s.total_cost_unknown.length > 0 }, total_cost_unknown: s.total_cost_unknown, tokens: tokensOf(parts) };
    });
  } else if (by === 'model') {
    const models = new Map();
    for (const x of all) for (const m of x.models) {
      const name = m.model ?? 'unknown model';
      const r = models.get(name) ?? { model: name, tokens: { input: 0, cached: 0, write: 0, output: 0 }, unsplit_tokens: 0, items: [] };
      const unsplit = m.tokens ? 0 : x.models.length === 1 ? (plain(x.tokens) ? x.tokens : 0) : 0;
      if (m.tokens) for (const k of Object.keys(r.tokens)) r.tokens[k] += m.tokens[k] ?? 0;
      r.unsplit_tokens += unsplit;
      const tokens = (m.tokens ? Object.values(m.tokens).reduce((a, b) => a + b, 0) : 0) + unsplit;
      r.items.push({ cost_usd: x.models.length === 1 ? x.cost_usd : m.cost_usd, tokens });
      models.set(name, r);
    }
    rows = [...models.values()].sort((a, b) => (a.model === 'unknown model') - (b.model === 'unknown model') || a.model.localeCompare(b.model))
      .map(({ items, ...r }) => ({ ...r, total_tokens: tokensOf(items), ...costOf(items) }));
  } else {
    const groups = new Map();
    for (const x of all) { const k = x[by] ?? 'unknown date'; groups.set(k, [...(groups.get(k) ?? []), x]); }
    rows = [...groups.entries()].sort(([a], [b]) => (a === 'unknown date') - (b === 'unknown date') || a.localeCompare(b))
      .map(([k, items]) => ({ [by]: k, ...costOf(items), tokens: tokensOf(items) }));
  }
  return { by, since, until, rows, totals };
}

const dollars = n => `$${n.toFixed(2)}`;
// A cost as speck spend prints it: "unknown" when none of it is known, "at least" the known part when some isn't, and
// "-" when nothing was spent.
const shown = ({ cost_usd: c, cost_unknown: u }) => (c === null ? (u ? 'unknown' : '-') : `${u ? 'at least ' : ''}${dollars(c)}`);
const count = n => n.toLocaleString('en-GB');

// The lines speck spend prints for `report` (spendReport's), its columns lined up.
export function spendLines(report) {
  const { by, since, until, rows, totals } = report;
  const range = since || until ? ` ${since ? `from ${since}` : ''}${since && until ? ' ' : ''}${until ? `to ${until}` : ''}` : '';
  if (!rows.length) return [`No AI spend recorded${range}.`];
  // 0534: a Delegated column for Codex sessions started in a ticket's worktree, when any ticket shown has some.
  const delegated = by === 'ticket' && rows.some(r => r.delegated && (r.delegated.cost_usd !== null || r.delegated.cost_unknown));
  const table = by === 'ticket'
    ? [['Ticket', 'Title', 'Builder', 'Reviewer', 'Watch', ...(delegated ? ['Delegated'] : []), 'Total', 'Tokens'],
      ...rows.map(r => [r.id, r.title, shown(r.builder), shown(r.reviewer), shown(r.watch), ...(delegated ? [shown(r.delegated)] : []), shown(r.total), count(r.tokens)])]
    : by === 'model'
      ? [['Model', 'Input', 'Cached input', 'Cache writes', 'Output', 'Tokens', 'Cost'],
        ...rows.map(r => [r.model, count(r.tokens.input), count(r.tokens.cached), count(r.tokens.write), count(r.tokens.output), count(r.total_tokens), shown(r)])]
      : [[by === 'week' ? 'Week of' : 'Month', 'Cost', 'Tokens'], ...rows.map(r => [r[by], shown(r), count(r.tokens)])];
  const widths = table[0].map((_, i) => Math.max(...table.map(r => r[i].length)));
  const lines = table.map(r => r.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd());
  const n = totals.tickets_with_unknown_cost;
  lines.push(`Total${range}: ${shown(totals)}, ${count(totals.tokens)} tokens. ${n === 0 ? 'No ticket has' : n === 1 ? '1 ticket has' : `${n} tickets have`} a part with an unknown cost.`);
  return lines;
}

// 0528: speck spend --backfill: recovers past spend for every ticket (backfill.mjs), from the transcripts of sessions
// started in the main checkout. The lines it prints.
export function backfillSpend(repo, homes = {}) {
  const tickets = allTickets(repo).map(t => {
    let rounds = [];
    try { rounds = ticketRounds(t.raw).rounds; } catch { /* rounds it can't read are left as they are */ }
    return { id: t.fm.id, rounds };
  }).filter(t => /^\d+$/.test(String(t.id ?? '')));
  return backfillLines(backfill({ repo: mainOf(repo), runs: runsOf(repo), tickets, ...homes }));
}

export function cmdSpend(args) {
  const opts = spendOptions(args);
  if (opts.backfill) return console.log(backfillSpend(findRepoRoot()).join('\n'));
  const report = spendReport(findRepoRoot(), opts);
  console.log(opts.json ? JSON.stringify(report, null, 2) : spendLines(report).join('\n'));
}
