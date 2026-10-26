'use strict';

// The panel page's model: pure, no DOM. It turns the board into what the page shows. The page loads it from
// /panel-model.js before its own script, and tests run it on its own (0431).
const IN_FLIGHT = ['building', 'reviewing', 'blocked', 'approved'];
// A ticket's five-step bar: each step is done, the current one ('now') or neither. A ready ticket has neither on every step.
function progress(t) {
  const rounds = Array.isArray(t.rounds) ? t.rounds : [];
  const last = rounds[rounds.length - 1];
  const latest = last && Number.isFinite(Number(last.round)) && last.round !== null && last.round !== '' ? Number(last.round) : rounds.length;
  const selfCheck = typeof t.self_check === 'string' && t.self_check.trim() !== '';
  const approved = t.status === 'approved';
  const done = [selfCheck || rounds.length > 0, rounds.length > 0 || (selfCheck && t.status === 'reviewing'), approved, approved, false];
  const labels = ['Build', 'Self-check', rounds.length ? `Review ${latest}` : 'Review', 'Approve', 'Ship'];
  const current = t.status === 'ready' ? -1 : approved ? 4 : done.indexOf(false); // approved: Ship is current
  return labels.map((label, i) => ({ label, state: t.status === 'ready' ? '' : done[i] ? 'done' : i === current ? 'now' : '' }));
}
// 0156: what an in-flight queue ticket is doing, as its card says it: a plain sentence, the card's state colour for it
// ('bad', 'to-ship' or '' for the normal text colour), and whether an agent is at work on it, which gives its card the
// border of its stage (0171).
// `shipping` is true while a ship of it is running, whoever started it.
// An approved ticket that isn't shipping waits for you, in green (0440), whether or not its build has exited yet. One that is
// shipping is at work, in the normal text colour. 0196: so is one auto-ship will ship once its build has ended, and
// one whose build is closing out says it waits to ship, in the normal text colour, unless it's waiting for you.
// 0203: while speck run is off, one auto-ship covers waits for you to turn Auto-build on, in green.
// 0223: the review round a building or reviewing ticket's reviewer is running, or null.
const roundUnderReview = t => ((t.status === 'building' || t.status === 'reviewing') && Number.isInteger(t.review_running) && t.review_running > 0 ? t.review_running : null);
// 0443: a long sentence in short words, for a closed card's status line on a phone: the sentence is their tooltip and
// accessible name. A sentence not here is short already, or gives way to the grid of lights.
const SHORT = {
  'Approved · waiting for you to ship it': 'Ready to ship',
  'Approved · waiting to ship': 'Shipping next',
  'Blocked · it has a question for you': 'Has a question',
  'Blocked · speck will take its recommendation': 'speck will answer',
  'The build stopped': 'Build stopped',
  'Approved · turn on Auto-build to ship it': 'Turn on Auto-build',
  'Finished · read the result': 'Read the result',
};
function doing(t, shipping) {
  const d = doingNow(t, shipping);
  const short = Object.prototype.hasOwnProperty.call(SHORT, d.sentence) ? SHORT[d.sentence] : null;
  return { ...d, short, word: wordOf(t, d, short) };
}
// 0462: what it's doing in a word or two, for an open card's Now cell: reviewing, fixing, checking or writing while an
// agent is at work, otherwise the sentence's short words, or the sentence when it's short already.
function wordOf(t, d, short) {
  if (!d.working) return short || d.sentence;
  if (d.round !== null) return 'Reviewing';
  if (/ is fixing /.test(d.sentence)) return 'Fixing';
  return d.sentence === 'Checking its own work' ? 'Checking' : 'Writing';
}
// 0462: who is at work on it, for an open card's Builder or Reviewer cell: the reviewer by its model, as the status line
// names it, while it reviews a round, otherwise the builder by its own name. A dash for a ticket that names neither.
function workerOf(t, d) {
  if (d.round !== null && d.round !== undefined && d.by) return { label: 'Reviewer', value: d.by };
  const name = typeof t.builder_label === 'string' && t.builder_label.trim() ? t.builder_label.trim() : typeof t.builder === 'string' ? t.builder.trim() : '';
  return { label: 'Builder', value: name ? `${name[0].toUpperCase()}${name.slice(1)}` : '–' };
}
function doingNow(t, shipping) {
  if (shipping) return { sentence: 'Shipping', tone: '', moving: true };
  if (t.ship_waiting) return { sentence: 'Approved · waiting to ship', tone: '', moving: true };
  const approved = t.status === 'approved' || t.status === 'done';
  const autoShips = t.status === 'approved' && t.auto_ship === true && !t.red && !t.to_ship;
  const tone = t.red ? 'bad' : t.to_ship || (approved && !autoShips) ? 'to-ship' : '';
  const at = sentence => ({ sentence, tone, moving: false });
  if (t.status === 'blocked') return at(t.foreman_will === true ? 'Blocked · speck will take its recommendation' : 'Blocked · it has a question for you'); // 0317
  if (t.red && (t.status === 'building' || t.status === 'reviewing')) return at('The build stopped');
  if (t.paused) return at('Paused');
  if (t.run_waiting) return at('Approved · turn on Auto-build to ship it');
  if (t.doc_finished) return at('Finished · read the result'); // 0361, 0492
  if (approved) return at(autoShips ? 'Approved · waiting to ship' : 'Approved · waiting for you to ship it');
  const steps = Array.isArray(t.steps) ? t.steps : [], now = steps.findIndex(s => s.state === 'now');
  let sentence = now === 1 ? 'Checking its own work' : 'Writing tests and code';
  // 0223: while a round is running (review_running), the round being run, even on a building ticket whose first round
  // a subagent is running; otherwise the builder is fixing the last recorded round's findings. A board that doesn't say
  // whether one is running names the last recorded round, as before.
  const name = (v, none) => { const w = typeof v === 'string' && v.trim() ? v.trim() : none; return `${w[0].toUpperCase()}${w.slice(1)}`; };
  // 0382: the model the review runs on, as written, when one is set; otherwise the reviewer, as before.
  const reviewer = typeof t.review_model === 'string' && t.review_model.trim() ? t.review_model.trim() : name(t.reviewer, 'the reviewer');
  // 0434: `round` and `by`: the round the reviewer is reviewing and who reviews it, for the card's status line.
  const running = roundUnderReview(t);
  let round = null;
  if (running !== null) { sentence = `${reviewer} is reviewing · round ${running}`; round = running; }
  else if (t.status === 'reviewing') {
    const n = (steps[2] && /(\d+)$/.exec(steps[2].label)) || [null, '1'];
    // 0391: a model provider's builder by its own name, such as DeepSeek
    const builder = typeof t.builder_label === 'string' && t.builder_label.trim() ? t.builder_label.trim() : name(t.builder, 'the builder');
    if (t.review_running === null && n[0] !== null) sentence = `${builder} is fixing round ${n[1]}'s findings`;
    else { sentence = `${reviewer} is reviewing · round ${n[1]}`; round = Number(n[1]); }
  }
  // 0434: `working`: its builder or reviewer is at work on it, so its card shows the grid of moving lights.
  const working = t.status === 'building' || t.status === 'reviewing';
  return { sentence, tone, moving: working, working, round, by: round !== null ? reviewer : null };
}
// 0171: the stage a ticket an agent is at work on has reached, for its card's border: 'build', 'check', 'review' or
// 'ship', from what it's doing (`d`, from doing). Null when no agent is at work on it.
function stageOf(t, d) {
  if (!d.moving) return null;
  if (d.sentence === 'Shipping' || t.ship_waiting) return 'ship';
  if (t.status === 'reviewing') return 'review';
  return (Array.isArray(t.steps) ? t.steps : []).findIndex(s => s.state === 'now') === 1 ? 'check' : 'build';
}
// An amount in US dollars, to the cent.
const dollars = n => `$${n.toFixed(2)}`;
// The middle value, or the mean of the two middle ones; null with no values.
function median(values) {
  const v = [...values].sort((a, b) => a - b), mid = Math.floor(v.length / 2);
  return !v.length ? null : v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
// When a ticket shipped, in the browser's time zone: HH:MM today, otherwise D Mon, HH:MM (0157), or a dash with no time.
function shippedAt(ms, now) {
  if (ms === null) return '–';
  const d = new Date(ms), pad = n => String(n).padStart(2, '0'), hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return sameDay(d, new Date(now)) ? hm : `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hm}`;
}
// 0449: how long ago a ticket shipped, for an empty Build lane: "12 min ago" within the hour today, "today 08:10"
// earlier today, or its day ("22 Oct") before today, however few minutes ago that was.
function shippedAgo(ms, now) {
  const mins = Math.floor((now - ms) / 60000), d = new Date(ms), pad = n => String(n).padStart(2, '0');
  if (!sameDay(d, new Date(now))) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (mins < 60) return mins < 1 ? 'just now' : `${mins} min ago`;
  return `today ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
// Links through after: among the tickets that aren't done or cancelled. For each id: the ones that list it in after:
// (unlocks, in JSON order, each once) and every ticket linked to it in either direction, through others too (linked).
function chains(tickets) {
  const open = tickets.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const ids = new Set(open.map(t => String(t.id)));
  const unlocks = new Map(), next = new Map();
  const add = (map, k, v) => { if (!map.has(k)) map.set(k, []); if (!map.get(k).includes(v)) map.get(k).push(v); };
  for (const t of open) {
    const id = String(t.id);
    add(next, id, id);
    for (const a of Array.isArray(t.after) ? t.after.map(String) : []) {
      if (a === id) continue;
      add(unlocks, a, id);
      if (ids.has(a)) { add(next, id, a); add(next, a, id); }
    }
  }
  const linked = new Map();
  for (const id of ids) {
    if (linked.has(id)) continue;
    const group = [id];
    for (let i = 0; i < group.length; i++) for (const n of next.get(group[i]) || []) if (!group.includes(n)) group.push(n);
    for (const n of group) linked.set(n, group);
  }
  return { unlocks: id => unlocks.get(String(id)) || [], linked: id => linked.get(String(id)) || [String(id)] };
}
// 0467: what an open ticket's dependency box shows, or null for none. `byId`: every ticket on the board by id, done ones
// too. `unlocks`: chains()'s. A ticket whose after: names two or more shows a Waits on box: each of them, in id order,
// with its state ('shipped', 'building' or 'queued') and how many are in each. One whose after: names one, or that an
// unfinished ticket waits on, shows a Chain box: five slots, up to two tickets before it, itself, then up to two after
// it. Before it: the one it waits on, then the one that one waits on when it waits on only one. After it: the lowest
// id waiting on it, then the lowest waiting on that. When more lie beyond an end, its last slot is { more: n } in their
// place, n counting the ones not shown. A slot with nothing in it is null.
const byNumber = (a, b) => a.localeCompare(b, 'en', { numeric: true });
function depsOf(t, byId, unlocks) {
  const id = String(t.id), waiting = new Set((Array.isArray(t.waiting_on) ? t.waiting_on : []).map(String));
  const afterOf = x => [...new Set((x && Array.isArray(x.after) ? x.after : []).map(String))].filter(a => a !== String(x.id));
  // Shipped is done, building is in flight, queued the rest. One not on the board is shipped when it's in the ticket's
  // after: and its waiting_on leaves it out, as speck counts it done.
  const after = afterOf(t);
  const stateOf = d => { const o = byId.get(d); return o ? o.status === 'done' ? 'shipped' : IN_FLIGHT.includes(o.status) ? 'building' : 'queued' : after.includes(d) && !waiting.has(d) ? 'shipped' : 'queued'; };
  if (after.length >= 2) {
    // Shipped or not as its facts table counts them, from waiting_on.
    const items = after.sort(byNumber).map(d => ({ id: d, state: !waiting.has(d) ? 'shipped' : stateOf(d) === 'building' ? 'building' : 'queued' }));
    const count = s => items.filter(i => i.state === s).length;
    return { kind: 'waits', items, shipped: count('shipped'), building: count('building'), queued: count('queued') };
  }
  const later = unlocks(id).map(String).filter(d => d !== id);
  if (!after.length && !later.length) return null;
  const seen = new Set([id]);
  const before = [];
  for (let at = t; ;) {
    const a = afterOf(at);
    if (a.length !== 1 || seen.has(a[0])) break;
    seen.add(a[0]);
    before.push(a[0]);
    at = byId.get(a[0]) || { id: a[0], after: [] };
  }
  // Every ticket waiting on it, through others too, and the walk along the lowest ids.
  const all = new Set(), queue = [id];
  while (queue.length) for (const d of unlocks(queue.shift()).map(String)) if (d !== id && !all.has(d)) { all.add(d); queue.push(d); }
  const walk = [];
  for (let at = id, done = new Set([id]); walk.length < 2;) {
    const next = unlocks(at).map(String).filter(d => !done.has(d)).sort(byNumber)[0];
    if (next === undefined) break;
    done.add(next);
    walk.push(next);
    at = next;
  }
  const slot = d => ({ id: d, state: stateOf(d) });
  const side = (ids, total) => { const s = [0, 1].map(i => (i < ids.length ? slot(ids[i]) : null)); if (total > Math.min(ids.length, 2)) s[1] = { more: total - 1 }; return s; };
  const left = side(before, before.length).reverse(), right = side(walk, all.size);
  return { kind: 'chain', before: before.length, after: all.size, slots: [...left, { id, state: 'self' }, ...right] };
}
// A word for a POSIX shell: as it is when it's only letters, digits, /, ., _ and -, otherwise in single quotes.
const shellWord = w => (/^[A-Za-z0-9\/._-]+$/.test(w) ? w : `'${w.replace(/'/g, "'\\''")}'`);
// How to reopen a blocked or killed (`stopped`) build's session: `cd <folder> && <resume_command>` with {session}
// and {id} (its ticket, 0289) put in, or only "session <id>" when resume_command is blank. 0289: the session's own
// resume_command, for the agent that ran its build, when it has one. null for any other ticket, or one with no session.
function resumeOf(t, resumeCommand, stopped) {
  const s = t.session;
  if ((t.status !== 'blocked' && !stopped) || !s || typeof s !== 'object' || typeof s.id !== 'string' || !s.id || typeof s.cwd !== 'string' || !s.cwd) return null;
  const own = typeof s.resume_command === 'string' ? s.resume_command : resumeCommand;
  const cmd = typeof own === 'string' ? own.trim() : '';
  if (!cmd) return { text: `session ${s.id}`, command: false };
  return { text: `cd ${shellWord(s.cwd)} && ${cmd.split('{session}').join(shellWord(s.id)).split('{id}').join(String(t.id))}`, command: true };
}
// An in-flight ticket's time since started, as MM:SS: minutes padded to two digits and counting past 59, never below 00:00.
function counter(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), pad = n => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
// 0520: a note's `Captured: <YYYY-MM-DD>` date, as written, or null when the line is missing or holds no real date
// (such as 2026-02-30), as its card says.
function capturedAt(body) {
  const d = ((typeof body === 'string' ? body : '').match(/^Captured:[ \t]*(\d{4}-\d{2}-\d{2})(?![\d-])/m) || [])[1];
  const at = d ? Date.parse(`${d}T00:00:00Z`) : NaN;
  return Number.isFinite(at) && new Date(at).toISOString().startsWith(d) ? d : null;
}
function panelModel(state) {
  const tickets = (state && Array.isArray(state.tickets) ? state.tickets : []).filter(t => t && t.status !== 'cancelled');
  const links = chains(tickets), byId = new Map(tickets.map(t => [String(t.id), t]));
  // A ticket starts a chain when it waits on nothing and an unfinished ticket waits on it. 0467: deps, its dependency box.
  const chain = t => {
    const waiting_on = Array.isArray(t.waiting_on) ? t.waiting_on : [], unlocks = links.unlocks(t.id);
    return { ...t, waiting_on, unlocks, chain: !waiting_on.length && unlocks.length > 0, linked: links.linked(t.id), deps: depsOf({ ...t, waiting_on }, byId, links.unlocks) };
  };
  const ideas = (state && Array.isArray(state.ideas) ? state.ideas : []).filter(i => i);
  const statusOf = i => String(i.status || '').trim();
  // The id on an inbox note's `From ticket:` line (0036), or null when it has none.
  const fromTicket = body => ((typeof body === 'string' ? body : '').match(/^From ticket:[ \t]*(\S+)/m) || [])[1] || null;
  const is = (...statuses) => t => statuses.includes(t.status);
  const rounds = t => (Array.isArray(t.rounds) ? t.rounds : []);
  const time = v => { const n = typeof v === 'string' ? Date.parse(v) : NaN; return Number.isFinite(n) ? n : null; };
  const now = Date.now();
  const runOn = !!(state && state.run && state.run.on); // whether speck run is on (0203)
  const byStart = (a, b) => { const x = time(a.started), y = time(b.started);
    return (x === null) - (y === null) || (x !== null && y !== null ? x - y : 0) || String(a.id).localeCompare(String(b.id), 'en', { numeric: true }); };
  // What a ticket's builder spent, as speck run recorded it, or null when it isn't recorded.
  const spent = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
  // When a build ended: its approval (0139), or none when that's missing, unreadable or before it started.
  const approvedAt = t => { const a = time(t.approved), s = time(t.started); return a !== null && s !== null && a >= s ? a : null; };
  // 0166: the time a ticket spent blocked or paused, waiting for you, which its build time leaves out. None when unrecorded.
  const waited = t => { const w = typeof t.waited_seconds === 'number' ? t.waited_seconds : NaN; return Number.isFinite(w) && w > 0 ? w * 1000 : 0; };
  // 0153: speck ship sets a ticket done before it pushes, so one whose ship is still running stays in the queue until it ends.
  const beingShipped = t => !!t.ship && typeof t.ship === 'object' && t.ship.running === true;
  const done = tickets.filter(t => t.status === 'done' && !beingShipped(t)).map(t => {
    const start = time(t.started), end = time(t.finished), until = approvedAt(t) ?? end;
    const took = start !== null && until !== null ? Math.max(0, until - start - waited(t)) : null;
    // 0178: one the server cut down to the Shipped figures gives its rounds' count and tokens in review_total.
    const total = t.review_total && typeof t.review_total === 'object' ? t.review_total : null;
    // 0204: a ship that merged it but couldn't push the base branch, until speck sees the commit on the remote, with speck ship's message.
    const unpushed = !!t.ship && typeof t.ship === 'object' && t.ship.unpushed === true;
    return { ...t, end, unpushed, unpushed_message: unpushed && typeof t.ship.message === 'string' && t.ship.message ? t.ship.message : null, when: shippedAt(end, now), roundCount: total ? Number(total.rounds) || 0 : rounds(t).length,
      tokens: total ? Number(total.tokens) || 0 : rounds(t).reduce((n, r) => n + (Number(r && r.tokens) || 0), 0),
      builderTokens: spent(t.builder_tokens), builderCost: spent(t.builder_cost_usd),
      exactMinutes: took !== null ? took / 60000 : null,
      minutes: took !== null ? Math.round(took / 60000) : null };
  });
  // Each median covers the done tickets that have its data: both times, at least one review round, reviewer tokens or
  // the builder's tokens or cost recorded.
  const stat = (values, round) => { const m = median(values); return { median: m === null ? null : round(m), count: values.length }; };
  // Newest finished first; done tickets with no finished time keep their JSON order after those. Then the latest 10.
  const finished = done.filter(t => t.end !== null).sort((a, b) => b.end - a.end);
  return {
    drafts: tickets.filter(is('draft')).map(chain),
    // The user's own ideas still to shape, in JSON order: inbox, dropped and ticketed notes are left out.
    ideas: ideas.filter(i => !['inbox', 'dropped'].includes(statusOf(i)) && !String(i.status || '').startsWith('ticketed')),
    // Follow-ups waiting in the inbox, in JSON order.
    inbox: ideas.filter(i => statusOf(i) === 'inbox').map(i => ({ ...i, from: fromTicket(i.body) })),
    // 0520: Capture's list: every note whose status is idea or inbox, newest captured first by its `Captured:` line's
    // date, those without one last, otherwise in JSON order.
    capture: ideas.filter(i => ['idea', 'inbox'].includes(statusOf(i))).map((i, at) => ({ ...i, from: statusOf(i) === 'inbox' ? fromTicket(i.body) : null, at, on: capturedAt(i.body) }))
      .sort((a, b) => (a.on === null) - (b.on === null) || (b.on || '').localeCompare(a.on || '') || a.at - b.at).map(({ at, on, ...i }) => i),
    // One list: in-flight tickets, then ready ones in JSON order, the order speck run starts them. 0200: in-flight ones
    // go in the order their builds started, so each keeps its place until it ships; one with no start time goes after, by id.
    queue: [...tickets.filter(t => IN_FLIGHT.includes(t.status) || (t.status === 'done' && beingShipped(t))).sort(byStart), ...tickets.filter(is('ready'))].map(chain).map(t => {
      const inFlight = t.status !== 'ready', start = time(t.started);
      // An approved ticket's timer stops at its approval (0139); every other in-flight one counts on.
      const approved_at = t.status === 'approved' ? approvedAt(t) : null;
      // A build from speck run that has exited while its ticket is still in hand needs you, as a blocked ticket does.
      const exited = t.build_exit && typeof t.build_exit === 'object' && t.status !== 'blocked';
      // A build that was killed, with no exit recorded, is no longer at work on its ticket either.
      const stopped = !exited && t.build_stopped === true && (t.status === 'building' || t.status === 'reviewing');
      // 0153: a ship running now, whoever started it, from speck ship's own record. An auto-ship that ended without
      // shipping counts only on an approved ticket, and only if it ended after the ticket's last approval.
      const ship = t.ship && typeof t.ship === 'object' ? t.ship : null;
      const shipping = !!ship && ship.running === true;
      const ship_since = shipping ? time(ship.started) : null;
      const shipEnd = ship ? time(ship.ended) ?? time(ship.started) : null, approvedTime = time(t.approved);
      const ship_failed = !!ship && ship.running === false && ship.auto === true && (approvedTime === null || (shipEnd !== null && shipEnd >= approvedTime));
      const auto_failed = ship_failed && t.status === 'approved';
      // 0338: a ticket blocked after its auto-ship didn't finish (handed back, its build asked you) still says so,
      // with the ship's message, but has no Ship hint, as speck ship ships only an approved ticket.
      const blocked_failed = ship_failed && t.status === 'blocked' && approvedTime !== null;
      // 0196: an approved ticket auto-ship covers is on its way out once its build has ended, until its ship starts,
      // unless its last auto-ship didn't finish: since 0194 a build ends at approved, and speck run's ship queue ships it.
      // 0203: with speck run off, nothing ships it until you turn Auto-build on, so it waits for you instead.
      const run_waiting = t.status === 'approved' && t.auto_ship === true && !shipping && !auto_failed && !runOn;
      const ship_waiting = t.status === 'approved' && t.auto_ship === true && !!exited && !shipping && !auto_failed && runOn;
      // 0338: one whose auto-ship didn't finish isn't waiting for you while speck run is on and carries it on: it was
      // handed back to its build after that ship and the build is running, or the build has ended and another ticket is
      // on its way, whose ship gives main a new commit and has the queue try this one again.
      const handed_at = auto_failed ? time(t.handed_back) : null;
      const handed = handed_at !== null && (shipEnd === null || handed_at >= shipEnd);
      const others = tickets.some(o => String(o.id) !== String(t.id) && ['ready', 'building', 'reviewing', 'approved'].includes(o.status));
      const carried_by = !handed || !runOn ? null : t.build_running === true ? 'Handed back to its build, which is working on it'
        : others ? 'It will be shipped again when main or its branch has a new commit' : null;
      const exit_label = shipping || ship_waiting || run_waiting ? null : auto_failed || blocked_failed ? "Auto-ship didn't finish" : stopped ? 'Build stopped unexpectedly' : !exited ? null : t.status === 'approved' ? 'Build finished without shipping'
        : t.status === 'building' || t.status === 'reviewing' ? 'Build stopped before finishing' : null;
      // An approved ticket whose build has exited is waiting for you to ship it, so it's green (purple until 0440) rather than red (0138),
      // unless its auto-ship failed. 0167: so is one auto-ship doesn't cover, whatever its build is doing, unless it's shipping.
      const to_ship = t.status === 'approved' && !auto_failed && (exit_label !== null || run_waiting || (t.auto_ship === false && !shipping));
      // 0361: a task whose build has finished is done, and its result waits in its review pack: its row
      // says so, with no exit line or log box.
      const doc_finished = t.kind === 'task' && exit_label === 'Build finished without shipping';
      // A build speck run launched and is running can be stopped from its row, which says when it's paused.
      const pausable = (t.status === 'building' || t.status === 'reviewing') && t.build_running === true && !exited;
      const paused = pausable && t.paused === true;
      // 0166: the timer leaves out the time waited, and stops while the ticket is blocked or its build is paused, at when
      // that began. One with no record of when keeps counting, as before.
      // 0217: and while its build has stopped before finishing, at its exit, or at when speck noticed it had been killed.
      const stopped_at = stopped ? time(t.build_stopped_at) : exit_label === 'Build stopped before finishing' ? time(t.build_exit.at) : null;
      const held_at = approved_at ?? (t.status === 'blocked' ? time(t.blocked_at) : null) ?? (paused ? time(t.paused_at) : null) ?? stopped_at;
      return { ...t, inFlight, pausable, paused, steps: progress(t.status === 'done' ? { ...t, status: 'approved' } : t), red: t.status === 'blocked' || (exit_label !== null && !to_ship && !carried_by), to_ship, carried_by, doc_finished, exit_label: doc_finished ? null : exit_label, resume: resumeOf(t, state.resume_command, stopped),
        exit_message: auto_failed || blocked_failed ? (typeof ship.message === 'string' && ship.message ? ship.message : null)
          : exited && exit_label && !doc_finished && typeof t.build_exit.message === 'string' ? t.build_exit.message : null,
        ship_hint: auto_failed && !carried_by ? `Ship it from its review pack, or run /speck-ship ${t.id}` : null,
        shipping, ship_waiting, run_waiting, ship_since, ship_counter: ship_since !== null ? counter(now - ship_since) : null,
        since: inFlight && start !== null ? start + waited(t) : null, approved_at, held_at, counter: inFlight && start !== null ? counter((held_at ?? Date.now()) - start - waited(t)) : null };
    }),
    // The latest 10 (0411), as SHIPPED_SHOWN in scripts/board-feed.mjs, and any older one not pushed yet (0204).
    shipped: [...finished, ...done.filter(t => t.end === null)].filter((t, i) => i < 10 || t.unpushed),
    shippedTotal: done.length,
    stats: {
      today: done.filter(t => t.end !== null && sameDay(new Date(t.end), new Date(now))).length,
      minutes: stat(done.filter(t => t.exactMinutes !== null).map(t => t.exactMinutes), Math.round),
      rounds: stat(done.filter(t => t.roundCount > 0).map(t => t.roundCount), n => Math.round(n * 10) / 10),
      tokens: stat(done.filter(t => t.tokens > 0).map(t => t.tokens), Math.round),
      builderTokens: stat(done.filter(t => t.builderTokens !== null).map(t => t.builderTokens), Math.round),
      builderCost: stat(done.filter(t => t.builderCost !== null).map(t => t.builderCost), n => Math.round(n * 100) / 100),
    },
  };
}
// A build's log as the panel shows it: ANSI escape sequences removed, each run of blank lines as one, a line first
// saying earlier lines aren't shown when the server cut it short, or "No log yet." with nothing in it.
// In turn: a control sequence (ESC [), a string such as a window title (ESC ], P, X, ^ or _, to BEL or ESC \), an
// escape with intermediate bytes such as a character set (ESC ( B), any other two-byte escape, a lone ESC, and the
// one-byte control sequence introducer.
const ANSI = /\x1b\[[0-?]*[ -\/]*[@-~]|\x1b[\]PX^_][^\x07\x1b]*(?:\x07|\x1b\\)?|\x1b[ -\/]+[0-~]?|\x1b[0-~]?|\x9b[0-?]*[ -\/]*[@-~]/g;
const TRUNCATED = "Earlier lines aren't shown: this is the last 200 lines of the log.";
function logText(log) {
  const raw = log && typeof log.text === 'string' ? log.text : '';
  const out = [];
  for (const line of raw.replace(ANSI, '').replace(/\r\n?/g, '\n').split('\n')) {
    const blank = line.trim() === '';
    if (blank && (!out.length || out[out.length - 1] === '')) continue;
    out.push(blank ? '' : line);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  if (!out.length) return 'No log yet.';
  return (log.truncated === true ? [TRUNCATED, ...out] : out).join('\n');
}
// A ticket section's Markdown as blocks for the full ticket pane: paragraphs, `#` to `###` headings, fenced code blocks
// and `- `, `* ` or `1. ` lists nested by indentation, at most MAX_NEST deep (deeper items stay at that depth). A blank
// line between list items keeps the list going. Blockquotes, tables, rules, HTML elements over several lines and a line
// starting an element that never closes (to the next blank line) are kept as written, unformatted, and so is anything
// else not listed here. With `tables` (the review pack: 0132), a table is formatted: its header row, the delimiter row
// under it and each row after it with a pipe, with `\|` as a pipe inside a cell.
const MAX_NEST = 16;
const FENCE = /^([ \t]*)(`{3,})[^`]*$/;
const ITEM = /^([ \t]*)([-*]|\d{1,9}\.)[ \t]+(.*)$/;
const HEADING = /^ {0,3}(#{1,3})[ \t]+(\S.*?)[ \t]*$/;
const QUOTE = /^[ \t]*>/, RULE = /^[ \t]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/, PIPE = /^[ \t]*\|/;
const DELIM = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/; // a table's second row
const BLOCK_TAG = /^[ \t]*<([A-Za-z][A-Za-z0-9-]*)(?:\s[^<>]*)?\/?>/; // a line starting with an HTML tag
const indentOf = s => s.replace(/\t/g, '    ').length;
function markdown(text, { tables = false } = {}) {
  const all = String(text ?? '').replace(/\r\n?/g, '\n'), lines = all.split('\n');
  const blocks = [], misses = new Map(), starts = [0]; // starts: where each line begins in `all`
  for (const line of lines) starts.push(starts[starts.length - 1] + line.length + 1);
  let para = null, lists = [], gap = false; // the paragraph being read, the open lists (outermost first), and a blank line just read
  const end = () => { para = null; lists = []; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], next = lines[i + 1] ?? '';
    const fence = line.match(FENCE), item = line.match(ITEM), heading = line.match(HEADING);
    const afterGap = gap;
    gap = false;
    const tableStart = line.includes('|') && next.includes('|') && DELIM.test(next);
    const open = line.match(BLOCK_TAG);
    const closed = open ? elementEnd(all, starts[i] + open[0].length, open, misses) : -1;
    if (closed > starts[i + 1]) { // an HTML element over more than one line, its contents and all, as written
      end();
      const last = starts.findIndex(at => at >= closed) - 1; // the line it closes on, whose text after it is formatted
      blocks.push({ type: 'paragraph', literal: true, text: [all.slice(starts[i], closed)], tail: all.slice(closed, starts[last + 1] - 1) });
      i = last;
    } else if (closed === -2) { // an element that never closes: as written, up to the next blank line
      end();
      const body = [];
      for (; i < lines.length && lines[i].trim() !== ''; i++) body.push(lines[i]);
      blocks.push({ type: 'paragraph', literal: true, text: body });
      i--;
    } else if (fence) {
      end();
      const cut = indentOf(fence[1]), body = [];
      const close = new RegExp(`^[ \\t]*\`{${fence[2].length},}[ \\t]*$`);
      for (i++; i < lines.length && !close.test(lines[i]); i++) body.push(lines[i].replace(/^[ \t]*/, ws => ' '.repeat(Math.max(0, indentOf(ws) - cut))));
      blocks.push({ type: 'code', text: body.join('\n') });
    } else if (line.trim() === '') {
      para = null;
      gap = true;
    } else if (tables && tableStart) {
      end();
      const rows = [cells(line)];
      for (i += 2; i < lines.length && lines[i].trim() !== '' && lines[i].includes('|'); i++) rows.push(cells(lines[i]));
      i--;
      blocks.push({ type: 'table', head: rows[0], rows: rows.slice(1) });
    } else if (QUOTE.test(line) || RULE.test(line) || PIPE.test(line) || tableStart || (para && para.table && line.includes('|'))) {
      if (!para || !para.literal || afterGap) { end(); para = { type: 'paragraph', literal: true, text: [] }; blocks.push(para); }
      if (tableStart) para.table = true;
      para.text.push(line);
    } else if (heading) {
      end();
      blocks.push({ type: 'heading', level: heading[1].length, inline: inline(heading[2]) });
    } else if (item) {
      para = null;
      const indent = indentOf(item[1]), ordered = item[2] !== '-' && item[2] !== '*';
      while (lists.length > 1 && lists[lists.length - 1].indent > indent) lists.pop();
      let top = lists[lists.length - 1];
      if (top && indent > top.indent && lists.length < MAX_NEST) { // nested in the item above
        const parent = top.list.items[top.list.items.length - 1];
        top = { indent, list: { type: 'list', ordered, start: ordered ? Number(item[2].slice(0, -1)) : 1, items: [] } };
        parent.lists.push(top.list);
        lists.push(top);
      } else if (!top || top.list.ordered !== ordered) { // a new list beside the one above, or the first
        const list = { type: 'list', ordered, start: ordered ? Number(item[2].slice(0, -1)) : 1, items: [] };
        const parent = lists.length > 1 ? lists[lists.length - 2].list.items.at(-1) : null;
        if (parent) parent.lists.push(list); else blocks.push(list);
        if (top) lists.pop();
        top = { indent: top ? top.indent : indent, list };
        lists.push(top);
      }
      top.list.items.push({ text: [item[3]], lists: [] });
    } else if (lists.length && !afterGap && /^[ \t]/.test(line)) { // an indented line goes on with the list item above
      const items = lists[lists.length - 1].list.items;
      items[items.length - 1].text.push(line.trim());
    } else if (para && !para.literal) {
      para.text.push(line.trim());
    } else {
      end();
      para = { type: 'paragraph', text: [line.trim()] };
      blocks.push(para);
    }
  }
  const finish = b => (b.type === 'paragraph' ? { type: 'paragraph', inline: b.literal ? [{ type: 'text', text: b.text.join('\n') }, ...inline(b.tail || '')] : inline(b.text.join('\n')) }
    : b.type === 'list' ? { ...b, items: b.items.map(it => ({ inline: inline(it.text.join('\n')), lists: it.lists.map(finish) })) }
    : b.type === 'table' ? { type: 'table', head: b.head.map(c => inline(c)), rows: b.rows.map(r => r.map(c => inline(c))) } : b);
  return blocks.map(finish);
}
// A table row's cells: the text between its pipes, trimmed, without the pipes at either end, `\|` read as a pipe.
const cells = line => line.trim().replace(/^\|/, '').replace(/(^|[^\\])\|$/, '$1').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
// Inline Markdown: code spans, **bold**, *italic* and _italic_, and links. Only an http or https link keeps its URL.
// Bold, italic and links nest at most MAX_NEST deep; deeper, their symbols show as written.
function inline(s, links = true, depth = 0) {
  const out = [], spans = keptSpans(s), misses = {}; // misses: where a search for each closer last failed
  let text = '';
  const push = node => { if (text) out.push({ type: 'text', text }); text = ''; out.push(node); };
  // The first index from `from` where `at` holds, skipping over kept spans, or -1. A search that failed from one point
  // fails from any later one, so it isn't run again.
  const seek = (kind, from, at) => {
    if (from >= (misses[kind] ?? Infinity)) return -1;
    for (let j = from; j < s.length; j++) {
      if (spans.has(j)) { j = spans.get(j).end - 1; continue; }
      if (at(j)) return j;
    }
    misses[kind] = Math.min(from, misses[kind] ?? Infinity);
    return -1;
  };
  const word = ch => /[\p{L}\p{N}]/u.test(ch || '');
  const nest = depth < MAX_NEST;
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (spans.has(i)) {
      const { end, node } = spans.get(i);
      if (node.type === 'text') text += node.text; else push(node);
      i = end;
    } else if (c === '`') {
      const run = s.slice(i).match(/^`+/)[0]; // a run that closes no code span stays as written
      text += run; i += run.length;
    } else if (nest && c === '*' && s[i + 1] === '*' && /[^\s*]/.test(s[i + 2] || '')) {
      const close = seek('**', i + 2, j => s[j] === '*' && s[j + 1] === '*' && /\S/.test(s[j - 1]));
      if (close < 0) { text += '**'; i += 2; continue; }
      push({ type: 'strong', inline: inline(s.slice(i + 2, close), links, depth + 1) });
      i = close + 2;
    } else if (nest && (c === '*' || (c === '_' && !word(s[i - 1]))) && /[^\s*_]/.test(s[i + 1] || '')) {
      const close = seek(c, i + 1, j => s[j] === c && /\S/.test(s[j - 1]) && s[j + 1] !== c && s[j - 1] !== c && (c === '*' || !word(s[j + 1])));
      if (close < 0) { text += c; i++; continue; }
      push({ type: 'em', inline: inline(s.slice(i + 1, close), links, depth + 1) });
      i = close + 1;
    } else if (nest && c === '[' && links && s[i - 1] !== '!') {
      const close = seek(']', i + 1, j => s[j] === ']');
      const url = close > i + 1 ? linkTarget(s, close + 1) : null;
      if (url === null) { text += c; i++; continue; }
      const kids = inline(s.slice(i + 1, close), false, depth + 1);
      if (/^https?:\/\/\S/i.test(url)) push({ type: 'link', href: url, inline: kids });
      else for (const k of kids) push(k);
      i = close + url.length + 3;
    } else if (c === '_' || c === '*') {
      const run = s.slice(i).match(/^[*_]+/)[0]; // a run that opens nothing stays as written
      text += run; i += run.length;
    } else { text += c; i++; }
  }
  if (text) out.push({ type: 'text', text });
  return out;
}
// What in `s` is kept from inline formatting, by where it starts: the index after it, and its node. Code spans become
// code; raw HTML (a whole element when it closes), images and backslash escapes stay as written. A code span opens at a run of backticks and closes
// at the next run of the same length, read left to right.
const TAG = /<\/?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?\/?>/y;
function keptSpans(s) {
  const runs = [];
  for (const m of s.matchAll(/`+/g)) runs.push([m.index, m[0].length]);
  const next = new Array(runs.length), seen = new Map(); // next: the following run of the same length, or -1
  for (let k = runs.length - 1; k >= 0; k--) { next[k] = seen.get(runs[k][1]) ?? -1; seen.set(runs[k][1], k); }
  const spans = new Map();
  for (let k = 0, after = 0; k < runs.length; k++) {
    const [at, n] = runs[k];
    if (at < after || next[k] < 0) continue;
    const close = runs[next[k]][0];
    let code = s.slice(at + n, close).replace(/\n/g, ' ');
    if (/^ [\s\S]*[^ ][\s\S]* $/.test(code)) code = code.slice(1, -1);
    spans.set(at, { end: close + n, node: { type: 'code', text: code } });
    after = close + n;
  }
  const keep = (at, end) => spans.set(at, { end, node: { type: 'text', text: s.slice(at, end) } });
  let noBracket = Infinity, noComment = Infinity; // from where no ']' or '-->' was found, so it isn't looked for again
  const elements = new Map(); // tag name → from where its closing tag wasn't found
  for (let i = 0; i < s.length; i++) {
    if (spans.has(i)) { i = spans.get(i).end - 1; continue; }
    if (s[i] === '\\' && /[!-\/:-@[-`{-~]/.test(s[i + 1] || '')) { keep(i, i + 2); i++; continue; }
    TAG.lastIndex = i;
    const tag = s[i] === '<' && TAG.exec(s);
    if (tag) { // a tag, or a whole element when it closes, as written
      const end = Math.max(i + tag[0].length, elementEnd(s, i + tag[0].length, tag, elements));
      keep(i, end); i = end - 1; continue;
    }
    if (s.startsWith('<!--', i) && i < noComment) {
      const end = s.indexOf('-->', i + 4);
      if (end < 0) noComment = i;
      else { keep(i, end + 3); i = end + 2; continue; }
    }
    if (s[i] === '!' && s[i + 1] === '[' && i < noBracket) {
      let close = i + 2;
      while (close < s.length && s[close] !== ']') close = spans.has(close) ? spans.get(close).end : close + 1;
      if (close >= s.length) noBracket = i;
      const url = close < s.length ? linkTarget(s, close + 1) : null;
      if (url !== null) { keep(i, close + url.length + 3); i = close + url.length + 2; }
    }
  }
  return spans;
}
// The index after the closing tag that ends the element an opening `tag` match starts, counting nested ones of the same
// name; -1 for a closing, self-closing or void tag; or -2 for one that never closes. `misses` (tag name → from where no
// closing tag was found) saves looking again.
const VOID = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
function elementEnd(s, from, tag, misses) {
  const name = (tag[0].match(/^[ \t]*<([A-Za-z][A-Za-z0-9-]*)/) || [])[1];
  if (!name || tag[0].endsWith('/>') || VOID.test(name)) return -1;
  const key = name.toLowerCase();
  if (from >= (misses.get(key) ?? Infinity)) return -2;
  const re = new RegExp(`<(\\/?)${name}(?:\\s[^<>]*)?\\/?>`, 'gi');
  re.lastIndex = from;
  for (let m, depth = 1; (m = re.exec(s));) {
    if (m[1]) { if (--depth === 0) return re.lastIndex; } else if (!m[0].endsWith('/>')) depth++;
  }
  misses.set(key, Math.min(from, misses.get(key) ?? Infinity));
  return -2;
}
// The URL in `(url)` at `from`, with no spaces and any parentheses in it paired, or null.
function linkTarget(s, from) {
  if (s[from] !== '(') return null;
  let depth = 0;
  for (let j = from + 1; j < s.length && !/\s/.test(s[j]); j++) {
    if (s[j] === '(') depth++;
    else if (s[j] === ')' && depth-- === 0) return j > from + 1 ? s.slice(from + 1, j) : null;
  }
  return null;
}
// 0459: a line of speck run's log as the Pipeline pop-up shows it: its time (HH:MM:SS and a space, 0460) or '', a short
// summary of its text, starting with the ticket's id when it names one, and its kind, 'fail' or 'msg'. The summary is
// at most RUN_LOG_WIDTH characters and never shows a session id, a process id, a file path or a command.
const RUN_LOG_WIDTH = 48;
const RUN_ID = /(?<![\w:./-])(\d{4,})(?![\w:/-]|\.\w)/;
const runCut = s => (s.length > RUN_LOG_WIDTH ? `${s.slice(0, RUN_LOG_WIDTH - 1).trimEnd()}…` : s);
// A sentence without what it mustn't show: parentheses with a session or process in them, `code`, ids of sessions,
// processes, paths, links, file names and speck's or a tool's commands. Whatever is left is tidied of the gaps they leave.
function runPlain(s) {
  return s
    .replace(/\([^()]*\b(?:session|process|pid)\b[^()]*\)/gi, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '')
    .replace(/\b(?:process|pid|session)\s+\d+/gi, '')
    .replace(/\S*\/\S*/g, '')
    .replace(/\S*\w\.(?:mjs|cjs|js|ts|md|log|json|ya?ml|css|html|txt|lock|git)\b\S*/g, '')
    .replace(/(?<![\w.'-])(?:speck|npm|npx|node|git|gh|claude|codex|cursor-agent)\s+[a-z][\w-]*(?:\s+(?:--?[\w=.-]+|\d{4,}))+/g, '')
    .replace(/(?<![\w.'-])npm (?:test|ci|install)\b/g, '')
    .replace(/\bLog:\s*(?=$|[.,;])/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([,;:])(?=[.,;:]|$)/g, '')
    .trim();
}
const runFirst = s => { const m = s.match(/^.*?[.!?](?=\s|$)/); return m ? m[0] : s; };
// The short reasons a ship gives, for `<id> didn't ship`, or null for one it doesn't.
function shipWhy(why) {
  if (/\bconflict/i.test(why)) return 'a conflict';
  if (/\b(?:tests? failed|failing tests)\b/i.test(why)) return 'tests failed';
  const first = runPlain(runFirst(why)).replace(/[.!?]$/, '');
  return first || null;
}
function runLogSummary(text) {
  const s = String(text).trim();
  let m;
  if ((m = s.match(/^Launched (\d{4,})\b/))) return `${m[1]} build started`;
  if ((m = s.match(/^Resumed (\d{4,})\b/))) return `${m[1]} build resumed`;
  if ((m = s.match(/^(\d{4,}) build exited with code (\d+)\.?$/))) return m[2] === '0' ? `${m[1]} build finished` : `${m[1]} build failed (code ${m[2]})`;
  if ((m = s.match(/^Shipping (\d{4,}):/))) return `${m[1]} shipping`;
  if ((m = s.match(/^Shipped (\d{4,})\.?$/))) return `${m[1]} shipped`;
  if ((m = s.match(/^(\d{4,}) didn't ship(?::\s*([\s\S]*))?$/))) {
    const why = m[2] ? shipWhy(m[2]) : null, long = why ? `${m[1]} didn't ship: ${why}` : '';
    return long && long.length <= RUN_LOG_WIDTH ? long : `${m[1]} didn't ship`;
  }
  if ((m = s.match(/^(\d{4,}) build\b.*\bstopped\.$/))) return `${m[1]} build stopped`;
  const plain = runFirst(runPlain(s)), id = plain.match(RUN_ID);
  return runCut(id && !plain.startsWith(id[1]) ? `${id[1]} ${plain}` : plain);
}
function runLogLine(line) {
  const m = String(line).match(/^(\d\d:\d\d:\d\d )([\s\S]*)$/), text = runLogSummary(m ? m[2] : line);
  const fail = /^\d{4,} (?:build failed|didn't ship)/.test(text);
  return { at: m ? m[1] : '', text, kind: fail ? 'fail' : 'msg' };
}
