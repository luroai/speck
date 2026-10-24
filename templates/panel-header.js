'use strict';
// 0474: the panel's header, which the page loads from /panel-header.js after its own script and before the pop-ups: the
// dark frame's title row, speck's screen (its poses, words and time, drawn by the design's renderer from lcd.js) and the
// strip of the Plan, Build and Shipped lanes under it (0477). It uses the page's helpers ($, el, setText, within, foremanOf and the rest), and
// the page's render() calls drawHeader and drawTabs.

// 0160: the header stays at the top of the screen. --head is its height on screen, so a ticket scrolled to sits below
// it. 0413: the header is speck's screen in its frame, and the project and base branch, cut short when the title row
// is narrow, show in full in their tooltip.
const pageHeader = document.querySelector?.('header');
if (pageHeader) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--head', `${pageHeader.offsetHeight}px`)).observe(pageHeader);
  const repo = pageHeader.querySelector('.repo');
  if (repo) repo.title = repo.textContent.trim();
}
// The design's LCD renderer, for speck's screen at the top of the panel (0413). 0416: the cards have no builder badges.
const LCD = globalThis.SpeckLCD;
function reducedMotion() { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
// The renderer reads the reduced-motion setting once, as the page loads, so a change to it holds speck's screen still
// or lets it move again.
if (typeof matchMedia === 'function') matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  if (screen.lcd) { screen.cast.still = screen.still = e.matches; screen.lcd.dirty = true; } // 0413: speck's screen (0414: its poses and word)
});
// A change of the screen's pixels per CSS pixel (a zoom, or another screen) gives each screen its new size, which its
// renderer doesn't see, as the screen's size on the page stays the same. Its look it follows itself.
if (typeof matchMedia === 'function') {
  (function zoomed() {
    matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`).addEventListener('change', () => {
      if (screen.lcd) screen.lcd.size(); // 0413: speck's screen
      zoomed();
    }, { once: true });
  })();
}
// 0413: speck's screen, the top of the panel, drawn by the design's LCD renderer (SpeckLCD.Screen and render, from
// lcd.js) on 160 × 72 dots. Its top row is the Foreman's word in the 5 × 7 font, in capitals, with the time at its
// right, HH:MM in the 24-hour clock, as on the design's handheld (0451). Its colon shows for the first half of each
// second, or always with reduced motion. A word too wide for the row scrolls from right to left, 16 dots a second
// after a pause, and loops round, or with reduced motion stays still, cut short. The screen is made once, when the
// renderer and a canvas are there, and kept between redraws. 0414: under a dotted line speck shows the pipeline
// (speckNow), with a caption, centred, under a second dotted line. The Screen draws every frame, even with reduced
// motion, so speck changes as soon as the pipeline does; reduced motion holds the poses and the word still.
const SCREEN = { cols: 160, rows: 72, top: 11, floor: 61, line: 63, cap: 65, speed: 16, pause: 1800 };
const NEEDS_YOU = /^Needs you \d+$/;
let screen = { word: '', since: null, lcd: null, cast: null, still: false, shown: null };
function drawScreen(word) {
  const up = String(word).toUpperCase();
  if (up !== screen.word) screen.since = null; // a new word starts again from the left
  screen.word = up;
  const canvas = $('screen');
  if (!screen.lcd && LCD && typeof LCD.Screen === 'function' && typeof canvas.getContext === 'function') {
    screen.still = reducedMotion();
    screen.cast = new LCD.Cast(speckPoses(), 'idle', { still: screen.still, at: { ...LCD.STATE_AT, watch: 1000, ask: 1000, flag: 1000, ship: 1100 } });
    screen.lcd = new LCD.Screen(canvas, { cols: SCREEN.cols, rows: SCREEN.rows, still: false, crisp: [SCREEN.line + 1], draw: screenFrame });
  }
  if (screen.lcd) screen.lcd.dirty = true;
}
// One frame of the screen at time `t`, onto the screen `s` (its pen() draws on its dots).
function screenFrame(s, t) {
  const p = s.pen(), { F5, INK, FAINT } = LCD, cols = SCREEN.cols, still = s.still || screen.still;
  const at = new Date(), two = n => String(n).padStart(2, '0');
  const time = `${two(at.getHours())}${still || at.getMilliseconds() < 500 ? ':' : ' '}${two(at.getMinutes())}`; // 0451
  const b = p.textBox(time, cols - 4, 2, { font: F5, align: 'right', valign: 'top' }), right = b.left - 6;
  p.textAt(time, b, INK);
  const W = screen.word.length * 6 - 1, room = right - 4;
  let x = 4;
  if (W > room && !still) {
    if (screen.since === null) screen.since = t;
    const C = W + room + 8, u = Math.floor(Math.max(0, t - screen.since - SCREEN.pause) * SCREEN.speed / 1000) % C;
    x = 4 - u;
    if (x < 4 - W) x += C;
  }
  p.clip = [0, 0, right + 1, SCREEN.top]; p.text(screen.word, x, 2, { font: F5, align: 'left', valign: 'top' }); p.clip = null;
  for (let i = 1; i < cols; i += 2) { p.put(i, SCREEN.top, FAINT); p.put(i, SCREEN.line, FAINT); }
  for (let i = 22; i < cols - 21; i += 3) p.put(i, SCREEN.floor, FAINT); // the floor speck stands on
  // 0414: what speck does now. A new event starts its pose from the start, even when it's the pose already showing.
  const now = speckNow(Date.now()), key = now.key || `${now.pose} ${now.cap}`;
  if (screen.cast && key !== screen.shown) {
    screen.shown = key;
    if (!screen.cast.set(now.pose, t) && now.key) screen.cast.cs = t;
  }
  const sp = s.pen(.75, cols / 2, SCREEN.floor - 1);
  sp.clip = [0, SCREEN.top + 1, cols, SCREEN.floor + 1];
  LCD.render(sp, screen.cast ? screen.cast.frame(t) : { B: { t }, props: [] });
  const CW = now.cap.length * 6 - 1;
  p.clip = [4, SCREEN.line + 1, cols - 4, SCREEN.rows];
  p.text(now.cap, Math.max(4, Math.round(cols / 2 - CW / 2)), SCREEN.cap, { font: F5, align: 'left', valign: 'top' });
  p.clip = null;
}
// 0414: speck's poses: the landing page's states (its `building` is the laptop), three of the panel's, and the
// console mock's clipboard, `watch`.
const rim = a => ({ x: 20 * Math.cos(a), y: -24 + 20 * Math.sin(a) });
const ease = k => -(Math.cos(Math.PI * Math.max(0, Math.min(1, k))) - 1) / 2;
// Watching the floor: a clipboard in one hand, glancing about, now and then reading it and ticking a line off.
function watchPose(t) {
  const { INK, FAINT, OFF } = LCD;
  const p = (t % 7200) / 7200, reading = p > .58 && p < .86;
  const G = [-.6, 0, .55, 0], gi = Math.floor(t / 1500), gk = ease(((t % 1500) / 1500) / .25);
  let lookX = G[(gi + 3) % 4] + (G[gi % 4] - G[(gi + 3) % 4]) * gk, lookY = .05;
  if (reading) { const k = ease(Math.min((p - .58) / .05, (.86 - p) / .05)); lookX = lookX + (.85 - lookX) * k; lookY = .05 + .45 * k; }
  const ticks = Math.floor(t / 7200) % 4 + (p > .74 ? 1 : 0);
  return { B: { t, x: -7, lookX, lookY, sy: 1 + .015 * Math.sin(t / 640), arms: [{ s: rim(.4), h: { x: 25, y: -19 } }] }, props: [{ key: 'clip', draw(pen) {
    const x = 17, y = -36, w = 15, h = 22, q = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    pen.lw = 1.4; pen.fillPoly(q, OFF); pen.poly(q, INK);
    pen.fillPoly([[x + 4.5, y - 3], [x + w - 4.5, y - 3], [x + w - 4.5, y + 2], [x + 4.5, y + 2]], INK);
    for (let i = 0; i < 4; i++) {
      const ly = y + 6 + i * 4.2;
      pen.line(x + 6, ly, x + w - 3, ly, i < ticks ? INK : FAINT);
      if (i < ticks) pen.dotAt(x + 3.2, ly, INK);
    }
  } }] };
}
const speckPoses = () => ({ ...LCD.STATES, watch: watchPose, ask: LCD.PANEL.bad, flag: LCD.PANEL.wait, ship: LCD.PANEL.ship });
// 0414: what speck does, from what the page has seen of the pipeline. Each board is compared with the one before it
// (noteBoard): what changed queues an event, played one after another, or starts the laptop while drafts are written.
// Between them speck follows the Foreman's word (speckRests). 0436: and passes the time during a long wait.
const SPECK = { push: 3200, event: 6000, writing: 30000, nap: 15 * 60000, watch: 2 * 60000, pastime: 60000, turn: 3 * 60000, missed: 60000 };
// 0436: the pastimes, tea, chess, messy and sweeping, with their captions while Idle and while waiting on the pipeline.
const IDLE_MOODS = [['eating', 'TEA, WHILE IT IS QUIET'], ['playing', 'NOTHING READY. CHESS?'], ['messy', 'CRUMBS IN THE WORKTREE'], ['cleaning', 'SWEEPING OLD BRANCHES']];
const PASTIMES = [['eating', 'A CUP OF TEA'], ['playing', 'A QUICK GAME OF CHESS'], ['messy', 'CRUMBS ON THE CLIPBOARD'], ['cleaning', 'A QUICK SWEEP']];
// rest: when the word's rhythm started, which of its turns has picked a pastime, and which one (0436). 0446: st and
// seenAt, the last board noted and when; hiddenAt, when the page was hidden; back, set when it's shown again until the
// next board is noted.
const speckDo = { seen: null, queue: [], playing: null, writing: null, word: null, rest: null, last: null, woke: false, n: 0,
  st: null, seenAt: null, hiddenAt: null, back: null };
// 0436: a pastime at random, never the one before.
function pickPastime(d) {
  const all = IDLE_MOODS.map((_, i) => i).filter(i => i !== d.last);
  d.last = all[Math.max(0, Math.min(all.length - 1, Math.floor(Math.random() * all.length)))];
  return d.last;
}
const byId = (a, b) => a.localeCompare(b, 'en', { numeric: true });
// A draft's text, to tell when it changes.
const draftText = t => JSON.stringify([t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes, t.priority, t.size, t.risk, t.kind, t.type, t.after]);
function noteBoard(st, f, word) {
  const d = speckDo, now = Date.now();
  if (word !== d.word) { d.word = word; d.woke = false; d.rest = { since: now, turn: -1, i: null }; }
  if (!st || !Array.isArray(st.tickets)) return;
  const fresh = st !== d.st;
  d.st = st;
  const tickets = new Map(st.tickets.filter(t => t && typeof t === 'object' && t.id != null).map(t => [String(t.id), t]));
  const ids = [...tickets.keys()].sort(byId), ag = f.agent && typeof f.agent === 'object' ? f.agent : {};
  const asks = (Array.isArray(ag.asks) ? ag.asks : []).filter(a => a && a.id != null).map(a => ({ id: String(a.id), key: `${a.id} ${a.at}`, at: a.at }));
  const shipping = new Set(ids.filter(id => tickets.get(id).ship && tickets.get(id).ship.running === true));
  if (f.ship && typeof f.ship.running === 'string') shipping.add(f.ship.running);
  const seen = { tickets: new Map(ids.map(id => [id, { status: tickets.get(id).status, text: draftText(tickets.get(id)) }])), asks: new Set(asks.map(a => a.key)),
    running: ag.running && ag.running.id != null ? String(ag.running.id) : null, shipping };
  const was = d.seen, wasAt = d.seenAt;
  d.seen = seen;
  if (fresh) d.seenAt = now;
  const back = fresh ? d.back : null;
  if (back) d.back = null;
  if (!was) return; // what happened before the page loaded doesn't play
  const from = d.queue.length;
  // 0446: each event notes when the page heard of it and, when the board says, when it happened.
  const play = (pose, cap, ms, when) => { const at = typeof when === 'string' ? Date.parse(when) : NaN; d.queue.push({ pose, cap, ms, key: `e${++d.n}`, noted: now, at: Number.isFinite(at) ? at : null }); };
  const became = (id, status) => was.tickets.has(id) && was.tickets.get(id).status !== status && tickets.get(id).status === status;
  const runOn = !!(st.run && st.run.on);
  const ship = id => (tickets.get(id) && tickets.get(id).ship) || {};
  for (const id of ids) if (became(id, 'done')) play('celebrating', `${id} SHIPPED`, SPECK.event, tickets.get(id).finished);
  for (const id of [...shipping].sort(byId)) if (!was.shipping.has(id)) play('ship', `SHIPPING ${id}`, SPECK.push, ship(id).started);
  for (const id of ids) if (became(id, 'blocked')) play('ask', `${id} HAS A QUESTION`, SPECK.event, tickets.get(id).blocked_at);
  for (const a of asks) if (!was.asks.has(a.key)) play('ask', `${a.id} HAS A QUESTION`, SPECK.event, a.at);
  for (const id of ids) if (became(id, 'approved') && !(tickets.get(id).auto_ship === true && runOn)) play('flag', `${id} IS READY TO SHIP`, SPECK.event, tickets.get(id).approved);
  if (seen.running && seen.running !== was.running) play('confused', `LOOKING INTO ${seen.running}`, SPECK.event, ag.running.started);
  // 0446: the first board after the page is shown again holds what changed while it had no stream. A change the board
  // dates from before the page was shown, or doesn't date at all, is from while it was hidden: one with no date came
  // after the board before, which is all that's known of when. Of those and the one kept when the page was shown, only
  // the latest plays, and only when it came less than a minute before. A change dated from after plays as any other.
  if (back) {
    const got = d.queue.splice(from), later = got.filter(e => e.at !== null && e.at >= back.at);
    const missed = got.filter(e => !later.includes(e)).map(e => ({ ...e, at: e.at ?? wasAt })).filter(e => e.at !== null);
    const one = latestMissed([...(back.kept ? [back.kept] : []), ...missed], back.at);
    if (one) d.queue.push(one);
    d.queue.push(...later);
  }
  const drafts = ids.filter(id => tickets.get(id).status === 'draft' && (!was.tickets.has(id) || (was.tickets.get(id).status === 'draft' && was.tickets.get(id).text !== seen.tickets.get(id).text)));
  if (drafts.length) d.writing = { id: drafts[drafts.length - 1], until: now + SPECK.writing };
}
// 0446: the page hidden (visible false) or shown again. Of the events from while it was hidden, only the latest plays,
// and only when it came less than a minute before the page was shown; the next board's changes count as from then too,
// so nothing missed plays until that board has come.
function speckShown(visible) {
  const d = speckDo, now = Date.now();
  if (!visible) { if (d.hiddenAt === null) d.hiddenAt = now; return; }
  if (d.hiddenAt === null) return;
  const since = d.hiddenAt, missed = [...(d.playing ? [d.playing] : []), ...d.queue].filter(e => e.noted >= since);
  d.hiddenAt = null;
  if (d.playing && d.playing.noted >= since) d.playing = null;
  d.queue = d.queue.filter(e => e.noted < since);
  const one = latestMissed(missed, now);
  let kept = null;
  if (one) { const { until, ...e } = one; kept = e; }
  d.back = { at: now, kept }; // kept waits for the next board, which may hold a later one
}
// 0446: of events missed while the page was hidden, the one that happened last, by its date or else when the page
// heard of it, when that was less than a minute before `shown`; otherwise null. Of two at once, the later in the list.
function latestMissed(events, shown) {
  let one = null;
  for (const e of events) { const at = e.at ?? e.noted; if (at !== null && (!one || at >= (one.at ?? one.noted))) one = e; }
  return one && shown - (one.at ?? one.noted) < SPECK.missed ? one : null;
}
// What speck does at `now`: { pose, cap }, with a `key` of its own for each event.
function speckNow(now) {
  const d = speckDo;
  if (d.playing && now >= d.playing.until) d.playing = null;
  if (!d.playing && d.queue.length) { const e = d.queue.shift(); d.playing = { ...e, until: now + e.ms }; }
  if (d.playing) { d.woke = true; return d.playing; }
  if (d.writing && now < d.writing.until) { d.woke = true; return { pose: 'building', cap: `WRITING ${d.writing.id}` }; }
  return speckRests(now);
}
// What speck does between events, by the Foreman's word. 0436: while it's Building, Shipping or Waiting, speck
// watches (or is grumpy) for 2 minutes, then passes the time for 1, and so on; while it's Idle it changes pastime every
// 3 minutes and naps after 15. An event or writing starts the rhythm again, and wakes it from a nap.
function speckRests(now) {
  const d = speckDo, w = d.word || '', r = d.rest || (d.rest = { since: now, turn: -1, i: null });
  if (d.woke) { d.woke = false; r.since = now; r.turn = w === 'Idle' && r.i !== null ? 0 : -1; }
  const el = Math.max(0, now - r.since);
  let m, own = null;
  if (w === 'Off') return { pose: 'sleeping', cap: 'SPECK RUN IS OFF' };
  if ((m = /^Needs you (\d+)$/.exec(w))) return { pose: 'ask', cap: `${m[1]} NEEDS YOU` };
  if ((m = /^Building (\d+)$/.exec(w))) own = { pose: 'watch', cap: m[1] === '1' ? 'WATCHING 1 BUILD' : `WATCHING ${m[1]} BUILDS` };
  else if (/^Shipping\b/.test(w)) own = { pose: 'watch', cap: 'WATCHING THE SHIP' };
  else if (/^Waiting\b/.test(w)) own = { pose: 'grumpy', cap: 'WAITING' };
  if (own) {
    const every = SPECK.watch + SPECK.pastime, turn = Math.floor(el / every);
    if (el - turn * every < SPECK.watch) return own;
    if (r.turn !== turn) { r.turn = turn; r.i = pickPastime(d); }
    return { pose: PASTIMES[r.i][0], cap: PASTIMES[r.i][1] };
  }
  if (w === 'Idle') {
    if (el >= SPECK.nap) return { pose: 'sleeping', cap: 'NAPPING' };
    const turn = Math.floor(el / SPECK.turn);
    if (r.turn !== turn) { r.turn = turn; r.i = pickPastime(d); }
    return { pose: IDLE_MOODS[r.i][0], cap: IDLE_MOODS[r.i][1] };
  }
  return { pose: 'idle', cap: w === 'Reload page' ? 'RELOAD THE PAGE' : '' };
}
// 0285: the Foreman, speck run's one status for the whole pipeline. Pressing it opens its detail. 0413: its word is
// the top row of speck's screen, which is the button, and the frame's edge is in the needs-you colour while the word
// is "Needs you <n>". The button stays put and only what the screen shows changes, so it keeps the focus.
function drawHeader(f, stale) {
  const run = $('run'), word = stale ? 'Reload page' : f.word;
  noteBoard(state, f, word); // 0414
  drawScreen(word);
  $('bezel').className = NEEDS_YOU.test(word) ? 'bezel needs' : 'bezel';
  run.setAttribute('aria-label', 'speck\'s screen'); // 0485: its word is in its tooltip. 0451: Settings says whether fixing is on
  run.setAttribute('aria-expanded', String(foremanOpen));
  run.title = `speck: ${word} · ${stale ? 'The panel is running newer code than this page shows: open to reload it' : 'The pipeline: speck run\'s log'}`;
}
// 0410: Plan, Build and Shipped are tabs under the header, and only the open one's lane shows. 0477: they're a strip
// of the lanes' names, still tabs to a screen reader. Build opens with the
// page. Each lane's list keeps its own scroll position, put back when its tab opens again.
const LANES = { plan: ['tab-plan', 'shaping-section', 'shaping'], build: ['tab-build', 'build-section', 'queue'], shipped: ['tab-shipped', 'shipped-section', 'shipped-list'] };
const TAB_ORDER = ['plan', 'build', 'shipped'];
let openLane = 'build';
const laneScroll = new Map(); // a closed lane's list's scroll position, by lane
// The lane a node is in, by the list or section holding it: Plan for anything that isn't in Build or Shipped.
const laneOf = n => TAB_ORDER.find(l => within(n, $(LANES[l][1])) || within(n, $(LANES[l][2]))) || 'plan';
function openTab(lane) {
  if (!LANES[lane]) return;
  if (lane !== openLane) {
    laneScroll.set(openLane, $(LANES[openLane][2]).scrollTop || 0);
    const from = rowAt();
    openLane = lane;
    slideFrom(from); // 0476: slides to its card
  }
  drawTabs();
  if (laneScroll.has(lane)) { $(LANES[lane][2]).scrollTop = laneScroll.get(lane); laneScroll.delete(lane); }
}
function drawTabs() {
  for (const l of TAB_ORDER) {
    const [tab, section] = LANES[l], on = l === openLane;
    $(tab).setAttribute('aria-selected', String(on));
    $(section).hidden = !on;
  }
  placeLanes(touch && touch.way === 'x' ? touch.shown : 0); // a refresh leaves a card a finger is moving where it is
  // Build says how many things need you, as the Foreman's status does (0477: whichever lane is in view)
  const needs = /^Needs you (\d+)$/.exec(foremanOf(state).word);
  // 0425: the number alone; its accessible name says what it is
  setText($('build-needs'), needs ? needs[1] : '');
  $('tab-build').setAttribute('aria-label', needs ? `Build, ${needs[1]} needs you` : 'Build');
}
for (const [i, l] of TAB_ORDER.entries()) {
  const tab = $(LANES[l][0]);
  tab.addEventListener('click', () => { openTab(l); render(); });
  // The left and right arrow keys open the tab beside it, round from the last to the first, with the focus on it.
  tab.addEventListener('keydown', e => {
    const step = e.altKey || e.ctrlKey || e.metaKey ? 0 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; // Alt+Left is the browser's Back
    if (!step) return;
    if (e.preventDefault) e.preventDefault();
    const next = TAB_ORDER[(i + step + TAB_ORDER.length) % TAB_ORDER.length];
    openTab(next);
    render();
    const to = $(LANES[next][0]);
    if (to.focus) to.focus();
  });
}
// 0476: the lanes are three cards in one row, as wide as the column. At rest only the open one shows, as before; while
// the row moves, all three show in their places (data-slide on the lanes' box: 'drag' while a finger moves it, 'settle'
// while it comes to rest), and the row is moved so the open card is in view: --lane is its place in the row, and --drag
// how far a finger has moved the row from there. A swipe, a sideways scroll on a trackpad, the left and right arrow keys
// or a tab bring another card into view.
const lanesBox = document.querySelector?.('main') || $('lanes');
const SLIDE_MS = 200; // how long a card takes to come to rest
let slides = []; // the slide's animations, one for each card, while the row comes to rest
function placeLanes(drag = 0) {
  if (!lanesBox.style) return;
  lanesBox.style.setProperty('--lane', String(TAB_ORDER.indexOf(openLane)));
  lanesBox.style.setProperty('--drag', `${drag}px`);
}
// Shows every card in its place in the row, each closed lane's list where it was left.
function showRow(how) {
  if (!lanesBox.dataset.slide) for (const l of TAB_ORDER) if (l !== openLane && laneScroll.has(l)) $(LANES[l][2]).scrollTop = laneScroll.get(l);
  lanesBox.dataset.slide = how;
}
// Where the row is now, in pixels from the first card: moved by a finger or a slide, or at rest on the open card.
function rowAt() {
  if (!lanesBox.dataset) return 0;
  if (lanesBox.dataset.slide) return new DOMMatrix(getComputedStyle($(LANES[openLane][1])).transform).m41;
  return -TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth;
}
// Slides the row from `from` px to the open card, and shows only that card once it's there. With reduced motion, the
// open card shows at once.
function slideFrom(from) {
  if (!lanesBox.dataset) return;
  for (const a of slides) a.cancel();
  slides = [];
  placeLanes();
  const to = -TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth;
  if (reducedMotion() || Math.abs(from - to) < 1 || typeof lanesBox.animate !== 'function') { delete lanesBox.dataset.slide; return; }
  showRow('settle');
  const mine = slides = TAB_ORDER.map(l => $(LANES[l][1]).animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: SLIDE_MS, easing: 'cubic-bezier(.25, .8, .35, 1)' }));
  mine[0].finished.then(() => { if (slides === mine) { slides = []; delete lanesBox.dataset.slide; } }, () => {});
}
// The lane beside the open one, `step` along the row (-1 left, 1 right), opened if there is one there. The ends don't
// wrap round, as a card can't be swiped past the last one. Without one, the row slides back to the open card.
function stepLane(step) {
  const next = TAB_ORDER[TAB_ORDER.indexOf(openLane) + step];
  if (next) { openTab(next); render(); } else slideFrom(rowAt());
}
// Whether a node, or one it's in, inside the lanes scrolls sideways itself, as a wide code block does: a swipe or a
// sideways scroll that starts there scrolls it instead.
function scrollsSideways(n) {
  for (; n && n !== lanesBox && n.nodeType === 1; n = n.parentNode) {
    if (n.scrollWidth > n.clientWidth + 1 && /^(auto|scroll)$/.test(getComputedStyle(n).overflowX)) return true;
  }
  return false;
}
// A touch is followed sideways or left to the browser to scroll up and down, by the way it has gone more once it's gone
// 10 px. Followed sideways, the row moves with the finger (a third as far past either end), and on lifting it a quick
// flick changes lane however short it was, and a slower drag past a third of the card's width does. The lists only
// scroll up and down themselves (touch-action: pan-y), so the browser never holds on to a sideways touch.
let touch = null; // { x, y, way: null | 'x' | 'y', drag, base, shown, at: [[time, x]…] } while a finger is down, or null
const FLICK = 0.3; // px per ms
if (lanesBox.addEventListener) {
  lanesBox.addEventListener('touchstart', e => {
    touch = null;
    if (e.touches.length !== 1 || pageHeld() || scrollsSideways(e.target)) return;
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, way: null, drag: 0, base: 0, shown: 0, at: [[e.timeStamp, t.clientX]] };
  }, { passive: true });
  lanesBox.addEventListener('touchmove', e => {
    if (!touch || touch.way === 'y') return;
    if (e.touches.length !== 1) { touch = null; slideFrom(rowAt()); return; }
    const t = e.touches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    if (!touch.way) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      touch.way = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (touch.way === 'y') return;
      // A card still coming to rest stops where the finger catches it
      touch.base = slides.length ? rowAt() + TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth : 0;
      for (const a of slides) a.cancel();
      slides = [];
      if (!reducedMotion()) showRow('drag');
    }
    if (e.cancelable) e.preventDefault();
    touch.at.push([e.timeStamp, t.clientX]);
    if (touch.at.length > 6) touch.at.shift();
    const i = TAB_ORDER.indexOf(openLane), pastEnd = (i === 0 && dx > 0) || (i === TAB_ORDER.length - 1 && dx < 0);
    touch.drag = dx;
    touch.shown = reducedMotion() ? 0 : touch.base + (pastEnd ? dx / 3 : dx);
    placeLanes(touch.shown);
  }, { passive: false });
  const lift = e => {
    const was = touch;
    touch = null;
    if (!was || was.way !== 'x') return;
    // The finger's speed over the last 100 ms of its moving, or none when it stopped for 100 ms before lifting
    const [t1, x1] = was.at[was.at.length - 1], [t0, x0] = was.at.find(([t]) => t1 - t <= 100);
    const speed = t1 > t0 && e.timeStamp - t1 <= 100 ? (x1 - x0) / (t1 - t0) : 0;
    const step = e.type === 'touchcancel' ? 0
      : Math.abs(speed) >= FLICK && Math.sign(speed) === Math.sign(was.drag) ? -Math.sign(speed)
        : Math.abs(was.drag) > lanesBox.clientWidth / 3 ? -Math.sign(was.drag) : 0;
    if (step) stepLane(step); else slideFrom(rowAt());
  };
  lanesBox.addEventListener('touchend', lift);
  lanesBox.addEventListener('touchcancel', lift);
  // A sideways scroll on a trackpad changes lane once it has gone 40 px, and once only, until it stops: a pause of
  // 150 ms, as its glide after the fingers lift keeps it going.
  let wheelSum = 0, wheelDone = false, wheelQuiet = 0;
  lanesBox.addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || scrollsSideways(e.target)) return;
    if (e.cancelable) e.preventDefault();
    clearTimeout(wheelQuiet);
    wheelQuiet = setTimeout(() => { wheelSum = 0; wheelDone = false; }, 150);
    if (wheelDone) return;
    wheelSum += e.deltaX;
    if (Math.abs(wheelSum) >= 40) { wheelDone = true; stepLane(Math.sign(wheelSum)); }
  }, { passive: false });
}
// The left and right arrow keys, pressed anywhere but in a text field or on a tab (which has its own), with nothing
// over the lanes, change lane. The page's own key handler sends them here.
const TYPED = /^(INPUT|TEXTAREA|SELECT)$/i;
function laneKey(e) {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || pageHeld() || priorityMenu !== null) return;
  const n = e.target;
  if (n && (TYPED.test(n.tagName || '') || n.isContentEditable || (n.getAttribute && n.getAttribute('role') === 'tab'))) return;
  if (e.preventDefault) e.preventDefault();
  stepLane(step);
}
drawTabs();
