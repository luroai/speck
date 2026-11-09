// 0595: what the bridge (0596) shows of one speck panel, from the board and status its /api/state is made of: its status
// word, how many tickets are building, queued and need you, what needs you, and what it shipped and spent in the last 7 days.
import { sumParts } from './spend.mjs';
import { buildTimes, LAST_SHIPPED } from './long-build.mjs';

const WEEK_MS = 7 * 864e5;
const list = v => (Array.isArray(v) ? v : []);
const text = v => (typeof v === 'string' ? v : '');
const time = v => { const n = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(n) ? n : null; };
const shipping = t => !!t.ship && typeof t.ship === 'object' && t.ship.running === true;

// Whether an approved ticket is waiting for you at Ship, as the page's model has it (to_ship, or a ship_hint on one whose
// auto-ship didn't finish). Nothing ships one auto_ship doesn't cover, or any while speck run is off.
function atShip(t, tickets, runOn) {
  if (t.status !== 'approved' || shipping(t)) return false;
  const s = t.ship && typeof t.ship === 'object' ? t.ship : null, approved = time(t.approved), ended = s ? time(s.ended) ?? time(s.started) : null;
  const failed = !!s && s.running === false && s.auto === true && (approved === null || (ended !== null && ended >= approved));
  if (!failed) return t.auto_ship !== true || !runOn;
  // Unless speck run carries it on: handed back to its build since, which is at work on it or has other tickets on their way.
  const handed = time(t.handed_back);
  const carried = runOn && handed !== null && (ended === null || handed >= ended)
    && (t.build_running === true || tickets.some(o => String(o.id) !== String(t.id) && ['ready', 'building', 'reviewing', 'approved'].includes(o.status)));
  return !carried;
}

// `board` is speck status --json's data, `foreman` foremanView's and `run` panelRunState's. Each thing that needs you is
// { id, title, why, detail }, why being 'question', 'manager' (the engineering manager's question), 'ship' or 'high_risk'
// (waiting at Ship, and high risk), and detail the question's words. Blocked questions count as the status word counts them.
export function projectSummary({ board, foreman, run, now = Date.now() }) {
  const tickets = list(board && board.tickets).filter(t => t && typeof t === 'object');
  const f = foreman && typeof foreman === 'object' ? foreman : {}, runOn = !!(run && run.on), since = now - WEEK_MS;
  const blocked = list(f.blocked).filter(b => b && typeof b === 'object'), byId = new Map(tickets.map(t => [String(t.id), t]));
  const questions = f.fixing === 'off' ? [] : blocked.filter(b => !b.foreman).map(b => ({ id: String(b.id), title: text(b.title), why: 'question', detail: text(b.question) }));
  const manager = list(f.agent && f.agent.asks).filter(a => a && byId.has(String(a.id)) && !blocked.some(b => String(b.id) === String(a.id)))
    .map(a => ({ id: String(a.id), title: text(byId.get(String(a.id)).title), why: 'manager', detail: text(a.question) }));
  const ship = tickets.filter(t => atShip(t, tickets, runOn)).map(t => ({ id: String(t.id), title: text(t.title), why: t.risk === 'high' ? 'high_risk' : 'ship', detail: '' }));
  const needs = [...questions, ...manager, ...ship];
  const building = tickets.filter(t => t.status === 'building' || t.status === 'reviewing').length;
  // 0579: speck's mood from the board, for its face: asleep while speck run is off, asking while anything needs you,
  // focused while a build is building or reviewing or a ticket is shipping, otherwise watching.
  const busy = !!(building || list(f.building).length || (f.ship && f.ship.running) || tickets.some(shipping));
  const mood = !runOn ? 'asleep' : needs.length ? 'asking' : busy ? 'focused' : 'watching';
  const spent = sumParts(tickets.flatMap(t => list(t.recent_spend)).filter(p => p && time(p.ended) !== null && time(p.ended) >= since));
  return {
    status: text(f.word), tone: text(f.tone), mood, busy, // 0596: for the bridge
    building,
    queued: tickets.filter(t => t.status === 'ready').length,
    needs_you: needs.length, needs,
    shipped_week: tickets.filter(t => t.status === 'done' && !shipping(t) && time(t.finished) !== null && time(t.finished) >= since).length,
    spent_week_usd: spent.total_cost_usd, spent_week_unknown: spent.total_cost_unknown.length > 0,
    build_minutes: buildTimes(tickets.filter(t => !shipping(t))).slice(0, LAST_SHIPPED).map(x => x.minutes), // 0596: each build's, so the bridge can take one median over every project
  };
}

// 0579: speck's mood from the board, for its face, as projectSummary works it out. Its other moods aren't the board's:
// the page's SpeckMood.watcher and SpeckMood.beside add them.
export function speckMood({ board, foreman, run, now = Date.now() }) {
  return projectSummary({ board, foreman, run, now }).mood;
}
