// 0285: the Foreman, speck run's one status for the whole pipeline. speck run records, as it works, why each ready
// ticket isn't building and what shipping is waiting for (run.foreman.json in its runs folder). foremanView() turns that
// record, whether speck run is on and the blocked tickets into what the panel's header shows and `speck status` prints,
// so both say the same and neither works the reasons out for itself.
import fs from 'node:fs';
import path from 'node:path';

// Not <id>.json, so nothing that reads the runs folder's build records takes it for one.
const FILE = 'run.foreman.json';

// Saves speck run's record, only when it has changed, so the panel's watch on the runs folder hears only of real
// changes. Written to a temporary file and renamed into place, so nothing reading it sees half a record. A record that
// can't be saved is left as it was: the next check tries again.
export function saveForeman(runs, record) {
  const file = path.join(runs, FILE), text = `${JSON.stringify(record, null, 2)}\n`;
  try { if (fs.readFileSync(file, 'utf8') === text) return; } catch { /* none yet */ }
  const tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, text); fs.renameSync(tmp, file); } catch { fs.rmSync(tmp, { force: true }); }
}

// speck run's last record, or null when there's none or it can't be read.
export function readForeman(runs) {
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(runs, FILE), 'utf8'));
    return rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : null;
  } catch { return null; }
}

// The reason a ready ticket isn't building, in a word or two, for the status: by the kind speck run recorded.
const SHORT = { after: 'other tickets', slots: 'build slots', switching: 'new code', uncommitted: 'not committed', stopped: 'stopped', unstarted: 'not started', chat: 'Cursor chat' };

// 0286: foreman_fixing, what the Foreman does with a blocked question: off (nothing), tell (counts it under Needs you)
// or fix (takes the recommendation of one that changes nothing you'd notice and has a clear winner). tell by default,
// and for any value speck doesn't know.
export const FIXING = Object.freeze(['off', 'tell', 'fix']);
export const fixingOf = cfg => (cfg && FIXING.includes(cfg.foreman_fixing) ? cfg.foreman_fixing : 'tell');
// 0286: whether the Foreman may take a blocked ticket's recommendation, from what `speck status --json` gives (0283):
// a recommendation, no change you'd notice and a clear winner. Anything unknown is left for you.
export const fixable = t => !!t && t.status === 'blocked' && typeof t.blocked_recommendation === 'string' && t.blocked_recommendation !== ''
  && t.blocked_noticeable === false && t.blocked_clear === true;

const list = v => (Array.isArray(v) ? v : []);
const text = v => (typeof v === 'string' ? v : '');

// 0299: a ticket's line while speck run switches to new code and nothing of its own holds it up. The detail says once,
// above its sections, what the switch is waiting for.
export const SWITCHING = 'waiting for speck run to switch to new code';
// 0299: the ready list speck run records while it switches to new code: each ready ticket not building, with its own
// reason when `own` gives one ({ kind, why } or null), such as tickets in its after: list not done yet.
export function switchingReady(tickets, running, own) {
  return list(tickets).filter(t => t.status === 'ready' && !running.has(t.id)).map(t => {
    const o = own(t);
    return o ? { id: t.id, kind: o.kind, why: o.why } : { id: t.id, kind: 'switching', why: SWITCHING };
  });
}

// What the Foreman shows: `run` is speck run's state ({ on, pid }, see runState), `record` its last record (readForeman)
// and `tickets` the board's, each with its id, status, title and blocked_question. A record counts only while the
// speck run that wrote it holds the lock: one left by an earlier speck run is out of date. Returns
// { word, tone, building, ready: [{ id, why }], held: [message], ship: { running, hold, refused: [{ id, message }],
// waiting: [{ id, why }] } | null,
// blocked: [{ id, title, question }] }, word being the status in one or two words and tone its colour:
// off, idle, ok (building or shipping), warn (waiting) or bad (needs you). 0286: `fixing` is foreman_fixing: with off,
// blocked tickets aren't counted under Needs you. 0287: `agent` is the Foreman agent's (agentView), given back as it is,
// its questions to you counted under Needs you.
export function foremanView({ run, record, tickets, fixing = 'tell', agent = null }) {
  const on = !!(run && run.on);
  const rec = on && record && record.lock === run.pid ? record : null;
  const all = list(tickets).filter(t => t && typeof t === 'object');
  const blocked = all.filter(t => t.status === 'blocked').map(t => ({ id: String(t.id), title: text(t.title), question: text(t.blocked_question) }));
  const building = rec ? list(rec.building).map(String) : [];
  const said = new Map(rec ? list(rec.ready).filter(r => r && typeof r.id === 'string').map(r => [r.id, r]) : []);
  const ready = all.filter(t => t.status === 'ready' && !building.includes(String(t.id))).map(t => {
    const r = said.get(String(t.id));
    return { id: String(t.id), kind: on ? (r ? text(r.kind) : '') : 'off', why: on ? (r ? text(r.why) : 'speck run hasn\'t checked it yet') : 'speck run is off' };
  });
  const s = rec && rec.ship && typeof rec.ship === 'object' ? rec.ship : null;
  const ship = s ? {
    running: typeof s.running === 'string' ? s.running : null,
    hold: s.hold && typeof s.hold === 'object' ? { message: text(s.hold.message) } : null,
    refused: list(s.refused).filter(r => r && typeof r.id === 'string').map(r => ({ id: r.id, message: text(r.message) })),
  } : null;
  // 0299: every approved ticket auto_ship covers that isn't shipping now, with why. A record without the list (older
  // code) gives the refusals it had.
  if (ship) ship.waiting = Array.isArray(s.waiting) ? s.waiting.filter(w => w && typeof w.id === 'string').map(w => ({ id: w.id, why: text(w.why) }))
    : ship.refused.map(r => ({ id: r.id, why: r.message }));
  const switching = rec && rec.switching && typeof rec.switching === 'object';
  // 0299: what holds up every build or ship, said once above the detail's sections rather than on each ticket's line.
  const held = [];
  if (switching) held.push(text(rec.switching.why) || 'speck run is switching to new code');
  if (ship && ship.hold) held.push(`Shipping is ${ship.hold.message}`);
  const ag = agent && typeof agent === 'object' ? agent : { running: null, waiting: [], did: [], asks: [] };
  const asks = list(ag.asks).filter(a => a && !blocked.some(b => b.id === a.id));
  const view = (word, tone) => ({ word, tone, building, ready: ready.map(({ id, why }) => ({ id, why })), held, ship, blocked, agent: ag });
  if (!on) return view('Off', 'off');
  if ((blocked.length && fixing !== 'off') || asks.length) return view(`Needs you ${(fixing !== 'off' ? blocked.length : 0) + asks.length}`, 'bad');
  if (ship && ship.running) return view(`Shipping ${ship.running}`, 'ok');
  if (building.length) return view(`Building ${building.length}`, 'ok');
  const why = switching ? 'new code' : ship && ship.hold ? 'on hold' : ready.find(r => SHORT[r.kind]) ? SHORT[ready.find(r => SHORT[r.kind]).kind]
    : ship && ship.refused.length ? 'new commit' : null;
  return why ? view(`Waiting: ${why}`, 'warn') : view('Idle', 'idle');
}

// The Foreman for `speck status`: its status, then each ready ticket's reason and shipping's state, one per line.
// Blocked tickets aren't repeated: speck status lists them with their questions.
export function foremanLines(v) {
  const lines = [`FOREMAN: ${v.word}`];
  for (const h of v.held || []) lines.push(`  ${h}`); // 0299: once, before the tickets it holds up
  for (const r of v.ready) lines.push(`  ${r.id} ready, not building: ${r.why}`);
  for (const w of v.ship ? v.ship.waiting : []) lines.push(`  ${w.id} waiting to ship: ${w.why}`);
  const a = v.agent; // 0287: the Foreman agent
  if (a?.running) lines.push(`  The Foreman is looking into ${a.running.id}: ${a.running.what}`);
  for (const q of a?.asks || []) lines.push(`  The Foreman asks you about ${q.id}: ${q.question}`);
  for (const d of a?.did || []) lines.push(`  The Foreman ${d.did} for ${d.id}${d.text ? `: ${d.text}` : ''}. Why: ${d.why}`);
  return lines;
}
