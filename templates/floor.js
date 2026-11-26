'use strict';
// 0765: the factory floor, a page at speck serve's address for a laptop or desktop window, in the look of an
// instrument panel. A station for each project on `speck projects`' list that isn't off, numbered in the list's order,
// with its state, how many tickets are building, queued, need you and shipped in the last 7 days, and a line of what
// it shipped each day for 14 days; under them, the chosen project's Capture, Plan, Build and Shipped side by side. It
// reads them all from speck serve (POST api/floor, scripts/serve-floor.mjs), which gathers them from each project's own
// panel, and again every 2 seconds, so a change in any project shows within a few. Choosing a station shows its
// project's lanes, and is kept in this browser, so a reload shows the same one. It loads after the panel's model
// (panel-model.js), which makes the lanes from the project's board as its panel's tabs have them. Everything here is
// inside this function, so none of its names can clash with the model's.
// 0766: above the stations, the line: a row for each project through Queue, Builder, Reviewer, QA and Ship, from the line
// its summary gives (0764's, scripts/panel-line.mjs), each lit station naming its ticket, agent, model and effort. The
// members' faces on its headings are the panel's own (speck-face.js, which loads before this).
(() => {
  const FLOOR_MS = 2000, GIVE_UP_MS = 15000, KEPT = 'speck-floor-station', SVG = 'http://www.w3.org/2000/svg';
  const LANES = [['capture', 'Capture', 'Nothing captured'], ['plan', 'Plan', 'Nothing to plan'], ['build', 'Build', 'Nothing building or queued'], ['shipped', 'Shipped', 'Nothing shipped yet']];
  const $ = id => document.getElementById(id);
  const list = v => (Array.isArray(v) ? v : []);
  const count = v => (Number.isFinite(v) && v > 0 ? v : 0);
  const two = n => (Number.isInteger(n) && n >= 0 ? String(n).padStart(2, '0') : '–');
  const tenth = v => Math.round(v * 10) / 10;
  function el(tag, cls, text, ...kids) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    for (const k of kids) if (k) node.appendChild(k);
    return node;
  }
  function shape(tag, attrs) {
    const node = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  }

  // The station chosen in this browser, by its key, or null. A browser that keeps nothing keeps the choice till a reload.
  function keptStation() {
    try { const v = localStorage.getItem(KEPT); return typeof v === 'string' && /^[0-9a-f]{12}$/.test(v) ? v : null; } catch { return null; }
  }
  function keepStation(key) {
    try { localStorage.setItem(KEPT, key); } catch { /* nothing kept */ }
  }

  // stations: the last answer's. chosen: the station chosen here, which may have left the list. shown: the station whose
  // board is shown, the one chosen or, until one is, the first. board and boardName: its board, and the name speck serve
  // gave it, sent back so an unchanged one isn't sent again. boardGone: its panel gave none in the last answer.
  let stations = null, chosen = keptStation(), shown = null, board = null, boardName = null, boardGone = false;
  let said = null, asking = false, again = false, stationsDrawn = null, boardDrawn = null, lanesMade = null, lineDrawn = null;

  async function ask() {
    if (asking) { again = true; return; }
    asking = true;
    const want = chosen, stop = new AbortController(), giveUp = setTimeout(() => stop.abort(), GIVE_UP_MS);
    const query = [want ? `station=${encodeURIComponent(want)}` : null, boardName ? `have=${encodeURIComponent(boardName)}` : null].filter(Boolean).join('&');
    try {
      const res = await fetch(`api/floor${query ? `?${query}` : ''}`, { method: 'POST', signal: stop.signal });
      let body = null;
      try { body = await res.json(); } catch { /* said below */ }
      if (res.ok && body && Array.isArray(body.stations)) { took(body, want); said = null; }
      else said = body && typeof body.error === 'string' && body.error ? body.error : `speck serve refused (${res.status}).`;
    } catch { said = 'can\'t reach speck serve.'; }
    clearTimeout(giveUp);
    asking = false;
    draw();
    if (again) { again = false; ask(); }
  }
  function took(body, want) {
    stations = body.stations.filter(s => s && typeof s === 'object' && typeof s.key === 'string' && typeof s.name === 'string');
    if (want !== chosen) return; // asked before another station was chosen: its board isn't the one wanted now
    const of = typeof body.chosen === 'string' ? body.chosen : null;
    if (of !== shown) { shown = of; board = null; boardName = null; }
    if (body.board && typeof body.board === 'object' && !Array.isArray(body.board)) { board = body.board; boardName = typeof body.board_name === 'string' ? body.board_name : null; }
    boardGone = of !== null && body.board_name === null;
  }
  function choose(key) {
    chosen = key;
    keepStation(key);
    if (key === shown) return;
    shown = key;
    board = null;
    boardName = null;
    boardGone = false;
    draw();
    ask();
  }

  function draw() {
    const note = $('floor-said');
    note.hidden = !said;
    note.textContent = said ? `Couldn't read your projects: ${said}` : '';
    drawLine();
    drawStations();
    drawBoard();
  }

  // ---------- 0766: the line ----------

  const MEMBERS = ['builder', 'reviewer', 'qa'];
  const COLUMNS = [['queue', 'Queue'], ['builder', 'Builder'], ['reviewer', 'Reviewer'], ['qa', 'QA'], ['ship', 'Ship']];
  const obj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const words = v => (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)) ? String(v).trim() : '');
  // An agent's colour, kept apart from the status colours: Claude Code sand, Codex blue, Cursor silver, any other grey.
  const agentColour = a => (a === 'claude' || a === 'claude-subagent' ? 'claude' : a === 'codex' || a === 'cursor' ? a : 'other');
  // Why a ticket is on its agent and model, in a few words, or '' for a reason the floor doesn't know.
  function whyOf(w) {
    if (w.why === 'level') return words(w.level) ? `Level ${words(w.level)}` : 'Its level';
    if (w.why === 'ticket') return 'Ticket\'s own';
    if (w.why === 'settings') return 'Settings';
    if (w.why === 'bench') { const s = obj(w.stands_in_for) ? words(w.stands_in_for.agent_name) || words(w.stands_in_for.agent) : ''; return s ? `Stands in for ${s}` : 'Stand-in'; }
    return '';
  }
  // How long a ticket has been at its station, from `since`, or '' when it hasn't a time there yet.
  function timeThere(since) {
    const at = typeof since === 'string' ? Date.parse(since) : NaN;
    if (!Number.isFinite(at)) return '';
    const m = Math.floor(Math.max(0, Date.now() - at) / 60000);
    if (m < 1) return 'under 1 min';
    if (m < 60) return `${m} min`;
    if (m < 1440) return `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`;
    return `${Math.floor(m / 1440)} d`;
  }
  // What a project's line gives, made safe to draw: each station's tickets and what it would run on, the queue and Ship.
  // null when its summary gives no line, as an older speck's doesn't, or its panel isn't answering.
  function lineNow(s) {
    const l = s.running && obj(s.line) ? s.line : null;
    if (!l) return null;
    const at = { builder: [], reviewer: [], qa: [] };
    for (const w of list(l.work)) if (obj(w) && Object.hasOwn(at, w.station) && words(w.id)) at[w.station].push(w);
    const idle = obj(l.idle) ? l.idle : {}, q = obj(l.queue) ? l.queue : {};
    return { at, idle: m => (obj(idle[m]) ? idle[m] : null), ready: count(q.ready), next: list(q.next).map(words).filter(Boolean),
      ship: list(l.ship).filter(t => obj(t) && words(t.id)) };
  }

  function drawLine() {
    const box = $('line'), minute = Math.floor(Date.now() / 60000), drawn = JSON.stringify([stations, minute, !stations && !!said]);
    if (drawn === lineDrawn) return;
    lineDrawn = drawn;
    if (!stations) return void box.replaceChildren(...(said ? [] : [el('p', 'floor-none', 'Reading your projects…')]));
    if (!stations.length) return void box.replaceChildren();
    const heads = COLUMNS.map(([key, label]) => el('div', `line-head line-head-${key}`, null,
      MEMBERS.includes(key) && globalThis.SpeckFace ? SpeckFace.draw({ role: key, size: 20, look: 'dark' }) : null, el('span', 'line-head-label', label)));
    box.replaceChildren(el('div', 'line-grid', null, el('div', 'line-heads', null, el('div', 'line-corner'), ...heads), ...stations.map(lineRow)));
  }
  function lineRow(s) {
    const l = lineNow(s), off = !s.running || s.mood === 'asleep';
    const idle = !!l && !off && MEMBERS.every(m => !l.at[m].length) && !l.ready && !l.ship.length;
    const project = el('div', 'line-project', null, el('span', 'line-n', two(s.n)), el('span', 'line-name', s.name));
    project.title = s.name;
    const cells = !l ? COLUMNS.map(([key], i) => el('div', `line-cell line-${key}`, null, el('p', 'line-empty', i ? '–' : 'No line from this project')))
      : [queueCell(l), ...MEMBERS.map(m => memberCell(m, l)), shipCell(l)];
    const row = el('div', `line-row${off ? ' off' : idle ? ' idle' : ''}`, null, project, ...cells);
    row.setAttribute('aria-label', `${s.name}${off ? ', off' : idle ? ', idle' : ''}`);
    return row;
  }
  function queueCell(l) {
    return el('div', 'line-cell line-queue', null, el('span', `queue-n${l.ready ? ' some' : ''}`, String(l.ready)),
      el('span', 'queue-next', l.next.length ? `Next ${l.next.join(' · ')}` : 'Nothing ready'));
  }
  function memberCell(m, l) {
    const cell = el('div', `line-cell line-${m}`);
    if (l.at[m].length) for (const w of l.at[m]) cell.appendChild(slotOf(w, true));
    else if (m === 'qa' && obj(l.idle('qa')) && l.idle('qa').set_up === false) cell.appendChild(el('div', 'slot none', 'No QA set up'));
    else if (l.idle(m) && (words(l.idle(m).agent_name) || words(l.idle(m).agent))) cell.appendChild(slotOf(l.idle(m), false));
    else cell.appendChild(el('div', 'slot none', 'Not known')); // its panel couldn't read its settings
    return cell;
  }
  // A station's slot: lit with the ticket on it, or dimmed with what it would run on, its agent a stripe in its colour.
  function slotOf(w, lit) {
    const agent = words(w.agent_name) || words(w.agent), model = words(w.model), effort = words(w.effort), time = lit ? timeThere(w.since) : '', why = lit ? whyOf(w) : '';
    const slot = el('div', `slot ${lit ? 'lit' : 'idle'} agent-${agentColour(w.agent)}`, null, el('span', 'slot-stripe'),
      lit ? el('span', 'slot-top', null, el('span', 'slot-id', words(w.id)), time ? el('span', 'slot-time', time) : null) : null,
      lit ? el('span', 'slot-title', words(w.title)) : null,
      el('span', 'slot-runs', null, agent ? el('span', 'slot-agent', agent) : null, model ? el('span', 'slot-model', model) : null, effort ? el('span', 'slot-effort', effort) : null),
      why ? el('span', 'slot-why', why) : null);
    slot.title = [lit ? `${words(w.id)} · ${words(w.title)}` : 'Idle', [agent, model, effort].filter(Boolean).join(' · '), why, time ? `For ${time}` : ''].filter(Boolean).join('\n');
    return slot;
  }
  function shipCell(l) {
    if (!l.ship.length) return el('div', 'line-cell line-ship', null, el('p', 'line-empty', 'Nothing to ship'));
    return el('div', 'line-cell line-ship', null, el('ol', 'ship-list', null, ...l.ship.map(t => {
      const mark = t.shipping === true ? 'Shipping' : t.yours === true ? 'Waits for you' : '';
      const item = el('li', `ship-item${t.yours === true && t.shipping !== true ? ' yours' : ''}${t.shipping === true ? ' shipping' : ''}`, null,
        el('span', 'ship-id', words(t.id)), el('span', 'ship-title', words(t.title)), mark ? el('span', 'ship-mark', mark) : null);
      item.title = `${words(t.id)} · ${words(t.title)}${mark ? `\n${mark}` : ''}`;
      return item;
    })));
  }

  // A station's look: orange while it needs you or something in it is moving, dim while its panel isn't answering.
  const toneOf = s => (!s.running ? 'gone' : count(s.needs_you) > 0 || s.tone === 'bad' ? 'needs' : s.busy === true || count(s.building) > 0 || s.tone === 'ok' ? 'moving' : 'still');
  function drawStations() {
    const box = $('stations'), drawn = JSON.stringify([stations, shown, !stations && !!said]);
    if (drawn === stationsDrawn) return;
    stationsDrawn = drawn;
    if (!stations) return void box.replaceChildren(...(said ? [] : [el('p', 'floor-none', 'Reading your projects…')]));
    if (!stations.length) return void box.replaceChildren(el('p', 'floor-none', 'No projects on your list yet. Add one with speck projects add.'));
    const focused = document.activeElement ? document.activeElement.stationKey : undefined;
    box.setAttribute('style', `--wide: ${stations.length}; --narrow: ${Math.ceil(stations.length / 2)}`); // a row, or two under 1024 px (floor.css)
    const made = stations.map(stationOf);
    box.replaceChildren(...made);
    const back = focused === undefined ? null : made.find(b => b.stationKey === focused);
    if (back && back.focus) back.focus(); // a redraw keeps the focus on the station it was on
  }
  function stationOf(s) {
    const on = s.key === shown, state = s.running ? String(s.status || 'Idle') : 'Not answering';
    const figure = (label, n, needs = false) => el('span', `figure${needs ? ' needs' : ''}`, null, el('span', 'figure-n', s.running ? String(count(n)) : '–'), el('span', 'figure-label', label));
    const top = el('span', 'station-state', state);
    top.title = state;
    const b = el('button', `station ${toneOf(s)}${on ? ' chosen' : ''}`, null,
      el('span', 'station-top', null, el('span', 'station-n', two(s.n)), top),
      el('span', 'station-name', s.name),
      el('span', 'station-figures', null, figure('Building', s.building), figure('Queued', s.queued), figure('Need you', s.needs_you, s.running && count(s.needs_you) > 0), figure('Shipped 7d', s.shipped_week)),
      lineOf(s.shipped_days));
    b.type = 'button';
    b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => choose(s.key));
    b.stationKey = s.key;
    return b;
  }
  // A station's line: how many tickets it shipped on each of the last 14 days, oldest on the left, its busiest day at
  // the top, with the counts as its accessible name. None while its board can't be read.
  function lineOf(days) {
    const ok = Array.isArray(days) && days.length > 1 && days.every(n => Number.isInteger(n) && n >= 0);
    const chart = shape('svg', { class: 'line-chart', viewBox: '0 0 130 30', preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    if (ok) {
      const most = Math.max(1, ...days), step = 130 / (days.length - 1);
      chart.appendChild(shape('polyline', { points: days.map((n, i) => `${tenth(i * step)},${tenth(28 - (n / most) * 26)}`).join(' ') }));
    }
    const line = el('span', 'station-line', null, el('span', 'figure-label', 'Shipped · 14 days'), chart);
    line.setAttribute('role', 'img');
    line.setAttribute('aria-label', ok ? `Shipped each day for the last ${days.length} days, oldest first: ${days.join(', ')}` : 'Its ships each day can\'t be read');
    return line;
  }

  function drawBoard() {
    const s = stations ? stations.find(x => x.key === shown) || null : null, lanes = s && board ? lanesNow() : null;
    const drawn = JSON.stringify([s && [s.n, s.name], lanes, boardGone]);
    if (drawn === boardDrawn) return;
    boardDrawn = drawn;
    $('board-title').textContent = s ? `Board · ${two(s.n)} ${s.name}` : 'Board';
    const box = $('lanes');
    if (!s) return void box.replaceChildren();
    if (!lanes) return void box.replaceChildren(el('p', 'floor-none', boardGone ? `${s.name}'s panel isn't giving its board, so it can't be shown.` : `Reading ${s.name}'s board…`));
    box.replaceChildren(...(boardGone ? [el('p', 'board-gone', `${s.name}'s panel isn't giving its board, so this is the last one it gave.`)] : []),
      ...LANES.map(([key, label, empty]) => laneOf(label, key, empty, lanes[key])));
  }
  function laneOf(label, key, empty, lane) {
    const section = el('section', `lane lane-${key}`, null, el('div', 'lane-head', null, el('h3', 'lane-label', label), el('span', 'lane-n', String(lane.n))),
      lane.cards.length ? el('ol', 'cards', null, ...lane.cards.map(cardOf)) : el('p', 'lane-empty', empty));
    section.setAttribute('aria-label', `${label}, ${lane.n}`);
    return section;
  }
  function cardOf(c) {
    const card = el('li', `card ${c.tone}`, null, el('span', 'card-id', c.id), el('span', 'card-title', c.title), el('span', 'card-detail', c.detail));
    card.title = `${c.id} · ${c.title}\n${c.detail}`;
    return card;
  }

  // The lanes of the board shown, made again when the board or the day changes (a shipped time says the day after midnight).
  function lanesNow() {
    const day = new Date().toDateString();
    if (!lanesMade || lanesMade.board !== board || lanesMade.day !== day) lanesMade = { board, day, lanes: lanesOf(board) };
    return lanesMade.lanes;
  }
  // The board's four lanes, each { n, cards }, from the panel's model: n as the panel's tab counts it, and each card
  // { id, title, tone, detail }, its tone being needs or moving (orange), shipped (green) or still.
  function lanesOf(state) {
    const m = panelModel(state), f = state.foreman && typeof state.foreman === 'object' ? state.foreman : {};
    const name = typeof f.name === 'string' && f.name.trim() ? f.name.trim() : 'speck';
    const asked = new Set(list(f.agent && f.agent.asks).filter(a => a && typeof a.question === 'string' && a.question).map(a => String(a.id)));
    const groups = BUILD_GROUPS.map(([g]) => g);
    // Build as the panel's groups it: what needs you, then what's moving, then the queue.
    const build = m.queue.map(t => { const d = t.inFlight ? doing(t, t.shipping === true, name) : null, a = asked.has(String(t.id)); return { t, d, a, group: buildGroup(t, d, a) }; })
      .sort((x, y) => groups.indexOf(x.group) - groups.indexOf(y.group));
    return {
      capture: { n: m.capture.length, cards: m.capture.map(noteCard) },
      plan: { n: m.drafts.length, cards: m.drafts.map(draftCard) },
      build: { n: m.queue.length, cards: build.map(x => buildCard(x, name)) },
      shipped: { n: m.shippedTotal, cards: m.shipped.map(shippedCard) },
    };
  }
  // An idea or inbox note: its kind in place of an id, and where it came from and when it was captured.
  function noteCard(i) {
    const on = capturedOn(i.body), from = i.from ? `From ${i.from}` : null;
    const detail = on ? (from ? `${from} · ${on}` : `Captured ${on}`) : from || 'No capture date';
    return { id: String(i.status).trim() === 'inbox' ? 'Inbox' : 'Idea', title: String(i.title || ''), tone: 'still', detail };
  }
  // A note's `Captured: <YYYY-MM-DD>` day, as "20 Nov", with its year when it isn't this one, or null.
  function capturedOn(body) {
    const m = /^Captured:[ \t]*(\d{4})-(\d{2})-(\d{2})(?![\d-])/m.exec(typeof body === 'string' ? body : '');
    if (!m) return null;
    const [y, mo, d] = m.slice(1).map(Number), at = new Date(y, mo - 1, d);
    if (at.getFullYear() !== y || at.getMonth() !== mo - 1 || at.getDate() !== d) return null; // such as 2026-02-30
    return `${d} ${MONTHS[mo - 1]}${y === new Date().getFullYear() ? '' : ` ${y}`}`;
  }
  // A draft: its priority, size and risk, a bug or fix, a task, and the tickets it waits on.
  function draftCard(t) {
    const waits = list(t.waiting_on).map(String);
    const facts = [t.priority !== undefined && t.priority !== null && t.priority !== '' ? `P${t.priority}` : null, t.size ? String(t.size) : null, t.risk ? `${t.risk} risk` : null,
      t.type === 'bug' || t.type === 'fix' ? t.type : null, t.kind === 'task' ? 'task' : null, waits.length ? `after ${waits.join(', ')}` : null];
    return { id: String(t.id), title: String(t.title || ''), tone: 'still', detail: facts.filter(Boolean).join(' · ') || 'Draft' };
  }
  // A ticket in Build: where it is, in the words of its row in the panel, and the tickets a ready one waits on.
  function buildCard({ t, d, a, group }, name) {
    const said = a ? `${name} has a question` : !t.inFlight ? 'Ready' : d.round !== null && d.round !== undefined ? `Reviewing · round ${d.round}` : d.word;
    const waits = !t.inFlight ? list(t.waiting_on).map(String) : [], after = waitsToShipAfter(t), dot = rowDot(group, d);
    return { id: String(t.id), title: String(t.title || ''), tone: dot === 'needs' ? 'needs' : dot === 'run' ? 'moving' : 'still',
      detail: [said, waits.length ? `after ${waits.join(', ')}` : null, after ? `ships after ${after}` : null].filter(Boolean).join(' · ') };
  }
  // A shipped ticket: when it shipped, its review rounds and how long it took; one merged but not pushed needs you.
  function shippedCard(t) {
    const figures = [t.roundCount > 0 ? `${t.roundCount} round${t.roundCount === 1 ? '' : 's'}` : null, Number.isFinite(t.minutes) ? `${t.minutes} min` : null];
    const detail = [t.unpushed ? 'Merged, but not pushed' : null, t.end !== null ? t.when : null, ...figures].filter(Boolean).join(' · ') || 'Shipped';
    return { id: String(t.id), title: String(t.title || ''), tone: t.unpushed ? 'needs' : 'shipped', detail };
  }

  document.addEventListener('DOMContentLoaded', () => {
    draw();
    ask();
    setInterval(ask, FLOOR_MS);
  });
})();
