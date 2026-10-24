// 0317: what the Foreman will do about a blocked ticket and what it has done, from the ticket's Notes, where goWith
// records each recommendation taken and who chose it (0284, 0286), so the panel and `speck status` say the same.
import { chosenBySpeck, goWithResumable } from './go-with.mjs';
import { fixable, fixingOf } from './foreman.mjs';
import { contentLines } from './core.mjs';
import { questionFacts } from './question-facts.mjs';

// Each "Went with the recommendation" line in a ticket's Notes, oldest first: { option, by, at }, `by` being 'foreman'
// when the Foreman chose it and 'user' when you pressed the panel's button, and `at` its time as an ISO string.
const LINE = /^\s*[-*]\s+Went with the recommendation: (.+) \((chosen by [^()]*), (\d{4}-\d\d-\d\d) (\d\d:\d\d) UTC\)\.?\s*$/;
export function wentWithLines(lines) {
  const out = [];
  for (const line of Array.isArray(lines) ? lines : []) {
    const m = typeof line === 'string' ? line.match(LINE) : null;
    if (!m || !Number.isFinite(Date.parse(`${m[3]}T${m[4]}:00Z`))) continue;
    out.push({ option: m[1], by: chosenBySpeck(m[2]) ? 'foreman' : 'user', at: new Date(`${m[3]}T${m[4]}:00Z`).toISOString() });
  }
  return out;
}

// What the board gives for ticket `t` (a parsed ticket) and `entry` (its board entry so far, with the blocked_* facts):
// went_with, the choice its build is carrying on with, until the ticket moves on (it's no longer building or reviewing,
// or it has been approved since); foreman_took, every recommendation the Foreman took for it; and foreman_will, whether
// the Foreman will take its recommendation: Fixing is fix, the question changes nothing you'd notice, it has a clear
// winner, the Foreman hasn't taken one for this ticket before, and speck run could resume its build.
export function foremanFacts(t, entry, fixing, resumable) {
  const all = wentWithLines(t.sections?.notes);
  const last = all.length ? all[all.length - 1] : null, approved = Date.parse(t.fm?.approved);
  const carrying = last && (t.fm.status === 'building' || t.fm.status === 'reviewing') && !(Number.isFinite(approved) && Date.parse(last.at) < approved);
  const took = all.filter(w => w.by === 'foreman').map(({ option, at }) => ({ option, at }));
  return {
    went_with: carrying ? last : null,
    foreman_took: took,
    foreman_will: fixing === 'fix' && fixable(entry) && !took.length && resumable === true,
  };
}

// `entry`, statusData's board entry for `t`, with the facts above.
export const withForeman = (t, fixing, entry) => ({ ...entry, ...foremanFacts(t, entry, fixing, entry.blocked_resumable) });

// A choice's time as the Notes give it, for the panel and `speck status`.
export const tookAt = at => (typeof at === 'string' && Number.isFinite(Date.parse(at)) ? `${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC` : '');
// Who went with it, as a ticket says it.
export const whoWent = w => (w && w.by === 'foreman' ? 'speck went with the recommendation' : 'You went with the recommendation');

// The board `speck status` gives the Foreman, from its parsed tickets: each with the facts above, as the panel has them.
export function foremanBoard(tickets, cfg, runs) {
  return tickets.map(t => {
    const facts = questionFacts(contentLines(t.sections['blocked question']));
    const entry = { id: t.fm.id, status: t.fm.status, title: t.fm.title, blocked_question: null, blocked_recommendation: facts.recommendation, blocked_noticeable: facts.noticeable, blocked_clear: facts.clear };
    return { ...entry, ...foremanFacts(t, entry, fixingOf(cfg), t.fm.status === 'blocked' && goWithResumable(runs, t.fm.id, cfg)) };
  });
}
// The lines `speck status` puts under a ticket from its board entry `b`: a blocked one's question `q` and whether it
// waits for the Foreman or for you, and who went with the recommendation its build is carrying on with.
export function foremanTicketLines(b, q) {
  const lines = [];
  if (b?.status === 'blocked' && q) lines.push(`        ? ${q}`);
  if (b?.status === 'blocked') lines.push(b.foreman_will ? `        → speck will take its recommendation: ${b.blocked_recommendation}` : '        → Waiting for you');
  if (b?.went_with) lines.push(`        ✓ ${whoWent(b.went_with)}: ${b.went_with.option} (${tookAt(b.went_with.at)})`);
  return lines;
}
