'use strict';

// ---- view: builds every node with createElement and textContent, so ticket text is never read as HTML ----
const LOST_MS = 10000; // how long the board's stream, or an answer for the board, can be missing before the page says it's disconnected (0187, 0186)
const WAIT_MS = 15000; // how long the page waits for its request for the board before giving it up (0186)
const RETRY_MS = 1000; // how soon the page starts again a stream the browser has given up on
const LOG_LINES = 200; // how many of a log's last lines are shown, as the server first sends them (0189)
// 0433: put in by the server on the script tag in panel.html that loads this file, as the file itself is served as it is.
const PAGE = document.currentScript.dataset.page; // 0285: the stamp of the code this page was sent with, which /api/state gives as it is now
const TOKEN = document.currentScript.dataset.token; // put in by the server each time it starts, and sent with Set ready, Back to Plan, each priority change, stop, Go with the recommendation, ship, the speck run switch, each setting saved and each API key saved (0393)
const $ = id => document.getElementById(id);
// 0283: what a blocked question's build says about its options, as speck status --json gives it. Nothing for an unknown.
function questionFacts(t) {
  const facts = [
    t.blocked_noticeable === true ? 'Changes what you\'d notice' : t.blocked_noticeable === false ? 'Doesn\'t change what you\'d notice' : null,
    t.blocked_clear === true ? 'Clear recommendation' : t.blocked_clear === false ? 'Close call' : null,
  ].filter(Boolean);
  return facts.length ? el('div', 'question-facts', null, ...facts.map(f => el('span', 'question-fact', f))) : null;
}
function el(tag, cls, text, ...kids) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = String(text);
  for (const k of kids) if (k) node.appendChild(k);
  return node;
}
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const mark = (cls, ok) => el('span', cls, null, el('span', ok ? 'tick' : 'sq'));
function check(cls, ok, text) { const s = mark(cls, ok); s.appendChild(el('span', null, text)); return s; }
// A chain icon on a ticket that starts a chain, a padlock on one waiting on others, or nothing. Hover text says which.
function chainIcon(t) {
  const icon = t.chain ? el('span', 'chain') : t.waiting_on.length ? el('span', 'lock') : null;
  if (icon) icon.title = t.chain ? `Starts a chain: unlocks ${t.unlocks.join(', ')}` : `Waiting on ${t.waiting_on.join(', ')}`;
  return icon;
}
// 0419: a Plan or Build ticket's first line: its id, its chain icon when it has one (`icon`), then its title.
// 0434: the whole title is its tooltip, as a closed ticket's title is cut off when it doesn't fit on one line.
const titleLine = (t, icon) => el('div', 'line', null, el('span', 'id', t.id), icon ? chainIcon(t) : null, titled(el('span', 'title', t.title)));
const titled = n => { n.title = n.textContent; return n; };
// 0419: its second line, in smaller type: the parts separated by " · ", each kept whole, so the line breaks only at
// the space after a dot, and only when it doesn't fit. The dot's span keeps the space before it, so a wrapped line
// ends with the dot and the next starts with a part, and that space is outside it, so a line never starts with any
// of the span's room.
function detailsLine(cls, parts) {
  const line = el('div', cls);
  parts.filter(Boolean).forEach((p, i) => { if (i) { line.appendChild(el('span', 'sep', ' ·')); line.appendChild(document.createTextNode(' ')); } line.appendChild(p); });
  return line;
}
// Its priority, size and risk, then a bug, fix or document tag, as words in the details line.
const tagsOf = (t, pick) => [...fieldTags(t, pick), typeTag(t), taskTag(t)];
// A "bug" tag for a bug ticket, a "fix" tag for a fix ticket (a broken base branch), or nothing.
const typeTag = t => (t.type === 'bug' || t.type === 'fix'
  ? explained(el('span', `tag ${t.type}`, t.type), t.type === 'bug' ? 'Bug: fixes a defect' : 'Fix: fixes a broken main, built before anything else') : null);
// 0350: a "document" tag for a ticket whose task is to write a document, or nothing for a code ticket.
const taskTag = t => (t.task === 'document' ? explained(el('span', 'tag document', 'document'), 'Document: the build writes a document, not code') : null);
// A ticket's priority, size and risk tags, each only when it has that field. `pick`: the priority tag opens the menu
// that sets it (a draft in the Tickets list).
function fieldTags(t, pick) {
  const out = [];
  if (t.priority !== undefined && t.priority !== null && t.priority !== '') {
    const tag = el('span', t.priority === 0 ? 'tag p0' : t.priority === 1 ? 'tag p1' : 'tag', `P${t.priority}`);
    out.push(pick ? priorityPicker(t, tag) : explained(tag, priorityMeaning(t.priority)));
  }
  if (t.size) {
    const size = String(t.size), known = Object.hasOwn(SIZES, size);
    out.push(explained(el('span', 'tag', size), known ? `${size}: ${SIZES[size]}` : `Size ${size}`, known ? `Size ${size}: ${SIZES[size]}` : `Size ${size}`));
  }
  if (t.risk) out.push(explained(el('span', t.risk === 'high' ? 'tag high' : 'tag', t.risk), riskMeaning(String(t.risk), t.auto_ship === true)));
  return out;
}
// 0165: what each tag means. The size wording follows /speck-ticket's size rules.
const SIZES = { S: 'a small, contained change', M: 'several files or one new component', L: 'too big for one ticket, so it needs splitting' };
function priorityMeaning(p) {
  const n = Number(p);
  if (!Number.isInteger(n) || n < 0) return `Priority ${p}`;
  return `Priority ${n}: ${n === 0 ? 'built before any other ticket' : n === 1 ? 'built after P0 tickets' : `built after P0 to P${n - 1} tickets`}`;
}
// `autoShips`: the ticket's auto_ship, which follows auto_ship and auto_ship_risk in speck/config.yml (0167).
function riskMeaning(risk, autoShips) {
  const name = risk === 'low' ? 'Low risk' : risk === 'high' ? 'High risk' : `Risk ${risk}`;
  return `${name}: ${autoShips ? 'ships by itself once approved' : 'waits for you to ship it'}`;
}
// A tag that shows its tip when it's tapped, clicked or pressed with Enter or Space, or hovered with a mouse. A screen
// reader announces `label`, its meaning. The tap is for the tag only, so it never opens or closes its ticket.
function explained(tag, tip, label = tip) {
  tag.tip = tip;
  tag.tabIndex = 0;
  tag.setAttribute('role', 'button');
  tag.setAttribute('aria-label', label);
  tag.addEventListener('click', e => {
    e.stopPropagation();
    if (tipTag === tag && !tipByHover) closeTip();
    else showTip(tag, false); // a tip a hover opened stays once it's clicked
  });
  tag.addEventListener('keydown', pressWithKeys);
  tag.addEventListener('mouseenter', () => { if (canHover()) showTip(tag, true); });
  tag.addEventListener('mouseleave', () => { if (tipTag === tag && tipByHover) closeTip(); });
  return tag;
}
// Enter and Space click it, as a button's keys do, so an open priority menu only closes.
function pressWithKeys(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault(); // Space would scroll the page
  e.stopPropagation();
  e.currentTarget.click();
}
let tipTag = null, tipByHover = false; // the tag whose tip is showing, or null, and whether a hover opened it
function showTip(tag, byHover) {
  const box = $('tag-tip');
  tipTag = tag;
  tipByHover = byHover;
  box.textContent = tag.tip;
  box.hidden = false;
  if (typeof tag.getBoundingClientRect !== 'function') return;
  // Under the tag, or above it when there's no room below, and never past either side of the screen.
  box.style.left = '0px'; // so its width is measured with the whole screen's width to fit in
  const r = tag.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight, gap = 6;
  box.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
  box.style.top = `${r.bottom + gap + h <= innerHeight - 8 ? r.bottom + gap : Math.max(8, r.top - gap - h)}px`;
}
function closeTip() {
  if (tipTag === null) return;
  tipTag = null;
  $('tag-tip').hidden = true;
}
const within = (n, box) => { for (; n; n = n.parentNode) if (n === box) return true; return false; };
// View state only, kept across refreshes and never sent to the server.
let shapingView = 'tickets'; // which Shaping list is showing: 'tickets', 'ideas' or 'inbox'
const open = new Set(); // ids of the open tickets
const openIdeas = new Set(); // paths of the open ideas
const openInbox = new Set(); // paths of the open inbox notes
const openQueue = new Set(); // ids of the open queue tickets
const openShipped = new Set(); // ids of the shipped cards that are open (0162, 0466)
let moreStats = false; // whether Shipped shows all six stats (0162)
const logs = new Map(); // id → the log shown for an open queue ticket ({ text, truncated, build, at }), or { failed: true } before any arrived
const logEarly = new Map(); // id → the updates its stream sent while its log was still being asked for (0189)
const logRetry = new Set(); // ids whose log couldn't be loaded, asked for again at the stream's next keep-alive (0189)
let streamName = null; // the name the server gave the board's stream, on which an opened log is sent as it's written (0189)
let logOrder = 0; // numbers each request opening or closing a log on the stream, so the server can tell which came last
const logAsks = new Map(); // id → the number of its latest log request, so only the latest answer is used
const logPending = new Map(); // id → the AbortController of its log request still waiting for an answer
const logBoxes = new Map(); // id → the log box last built for an open queue ticket, which each new log updates in place
const logScroll = new Map(); // a log box built by this render → where to scroll it once it's on the page (null: the bottom)
let queueIds = new Set(); // ids in the queue at the last render, so a ticket that has left it isn't asked for
const settingReady = new Set(); // ids whose Set ready request hasn't been answered yet
const refused = new Map(); // id → why the server refused to set it ready
let priorityMenu = null; // the id of the draft whose priority menu is open, or null
const priorityRefused = new Map(); // id → why the server refused to set its priority, until the next click on its tag
const stopping = new Set(); // ids whose stop request hasn't been answered yet
const stopRefused = new Map(); // id → why the server refused to stop its build, until the next click on its Stop build button
const goingWith = new Set(); // 0284: ids whose Go with the recommendation request hasn't been answered yet
const goWithRefused = new Map(); // 0284: id → why the server refused it, until the next click on its button
const askDrafts = new Map(); // 0318: id → the answer typed so far to the Foreman's question, kept through redraws
const askPending = new Map(); // 0318: id → 'answer' or 'dismiss' while the server is at it
const askRefused = new Map(); // 0318: id → why the server refused, until the next press
const askBoxes = new Map(); // 0318: `<where>:<id>` → its latest Answer box, so a redraw keeps the focus in it
const unreadying = new Set(); // ids whose Back to Plan request hasn't been answered yet
const planRefused = new Map(); // id → why the server refused to move it back to Plan, until the next click on its Back to Plan button
const copied = new Map(); // id → [copy number, 'Copied' or why it couldn't], until 2 seconds after the latest copy
const copyButtons = new Map(); // id → the Copy button last built for it
let fullId = null; // the id of the ticket in the side pane, or null
let fullFrom = null; // 0326: { id, list } of the Full ticket button that opened the pane, or null when something else did
let focusBack = false; // 0326: the pane has closed, so the next render puts the focus back
let foremanOpen = false; // 0285: whether the Foreman's detail is open. 0366: declared early, as holdPage reads it
let runLog = null, runLogFor = null, runLogAsking = false, runLogShown, runLogDrawn = null; // 0415: runLogShown: the log's lines as drawn (runLogDrawn), joined, undefined when not drawn
let packOf = null; // while the side pane shows a review pack instead: { id, state: 'loading' | 'ok' | 'none' | 'error', text }
let shippingId = null; // the id whose Ship request hasn't been answered yet: one ship at a time
let runSwitching = null; // 'on' or 'off' while the speck run switch's request hasn't been answered yet
const shipped = new Map(); // id → what speck ship printed when the panel shipped it
const shipRefused = new Map(); // id → why speck ship refused it, until the next click on its Ship button or the pack is opened again
const changesNotes = new Map(); // 0357: id → the note in its pack's box, kept while the pane is redrawn and after a refusal
let changesSending = null; // the id whose Ask for changes request hasn't been answered yet
const changesSaid = new Map(); // id → what speck changes printed when the panel sent its note
const changesRefused = new Map(); // id → why speck changes refused it, until its next Ask for changes
let copies = 0;
const flip = (set, key) => { if (set.has(key)) set.delete(key); else set.add(key); render(); };
const list = v => (Array.isArray(v) ? v : []);

function ticketItem(t) {
  const isOpen = open.has(t.id);
  const why = priorityRefused.has(String(t.id)) ? el('div', 'bad prio-refused', priorityRefused.get(String(t.id))) : null;
  return goable(hoverable(el('div', `item ticket${isOpen ? ' open' : ''}`, null, ticketHead(t), why, isOpen ? ticketDetail(t, list(t.acceptance_criteria)) : null), t), t);
}
// A ticket's top row. When only its chain changes, through other tickets, a new top row replaces the old one and the
// details stay on the page.
// 0419: its details line is its priority, size and risk, its criteria and lint result, then the tickets it waits on
// after "after", or those it unlocks when it starts a chain. 0463: only while it's closed; open, its steps and facts
// are in a track and a table, as an open one in flight's are.
function ticketHead(t) {
  const criteria = list(t.acceptance_criteria);
  const lint = t.lint || { errors: 0, warnings: 0 };
  const head = el('div', 'head', null, titleLine(t, true), ...open.has(t.id) ? [trackOf({ steps: NOT_STARTED }), waitingFacts(t, 'Draft', 'After', true)] : [detailsLine('checks', [...tagsOf(t, true),
    el('span', null, plural(criteria.length, 'criterion', 'criteria')),
    lint.errors ? check('bad', false, `lint: ${plural(lint.errors, 'error')}`) : check('ok', true, 'lint passes'),
    lint.warnings ? check('warn', false, plural(lint.warnings, 'warning')) : null,
    t.chain ? el('span', 'ids', 'unlocks ', ...idLinks(t.unlocks)) : t.waiting_on.length ? el('span', 'ids', 'after ', ...idLinks(t.waiting_on)) : null])]);
  // Only the top row opens and closes it, so clicking or selecting text in the details leaves it open.
  head.addEventListener('click', () => flip(open, t.id));
  return head;
}
const ownData = t => { const { unlocks, chain, linked, deps, ...own } = t; return own; }; // what /api/state has for this ticket
function newHead(node, t) {
  const old = child(node, 'head'), head = ticketHead(t);
  node.insertBefore(head, old);
  node.removeChild(old);
  const detail = child(node, 'detail');
  if (detail) putDeps(detail, null, t); // 0467
}
// A heading and its Markdown, formatted as in the full ticket pane, or nothing when the text is empty. The blocks go
// straight under the heading, each paragraph a `p.text`, so a selection can run from one section's text into the next.
function part(body, heading, text) {
  if (text === null || text === undefined || text === '') return;
  body.appendChild(el('h4', null, heading));
  for (const n of mdBlocks(markdown(text))) {
    if (n.tagName.toLowerCase() === 'p') n.className = 'text';
    body.appendChild(n);
  }
}
// A draft's priority tag, which opens a menu of P1 to P5 with its own marked, and the menu while it's open. A click
// while it's open closes it and does nothing else (see the document's click listener below).
function priorityPicker(t, tag) {
  const id = String(t.id), box = el('span', 'prio', null, tag);
  tag.className += ' pick';
  tag.title = 'Set the priority';
  tag.tabIndex = 0; // 0165: reached with Tab, pressed with Enter or Space, and announced with its meaning
  tag.setAttribute('role', 'button');
  tag.setAttribute('aria-label', `${priorityMeaning(t.priority)}. Opens the priority menu`);
  tag.addEventListener('keydown', pressWithKeys);
  tag.addEventListener('click', e => {
    e.stopPropagation(); // the click is for the tag, not the ticket
    priorityRefused.delete(id);
    priorityMenu = id;
    render();
  });
  if (priorityMenu !== id) return box;
  const menu = el('span', 'prio-menu');
  for (let n = 1; n <= 5; n++) {
    const b = el('button', String(t.priority) === String(n) ? 'on' : null, `P${n}`);
    b.type = 'button';
    b.addEventListener('click', e => { e.stopPropagation(); setPriority(id, n); });
    menu.appendChild(b);
  }
  box.appendChild(menu);
  return box;
}
// An open ticket, short: its problem and outcome, then its readiness list. The rest is in the side pane.
function ticketDetail(t, criteria) {
  const body = el('div', 'md');
  part(body, 'Problem', t.problem);
  part(body, 'Outcome', t.outcome);
  return el('div', 'detail', null, withDeps(t), body, readiness(t, criteria, true)); // 0467: first, its dependency box
}
// A ticket's readiness list from what speck can check, its Set ready button, the Full ticket button when `withFull`,
// and why the server last refused to set it ready.
function readiness(t, criteria, withFull) {
  const ready = el('div', 'ready', null, el('h4', null, 'Readiness'));
  const line = (cls, ok, text) => ready.appendChild(el('div', cls, null, el('span', ok ? 'tick' : 'sq'), el('span', null, text)));
  const sizeOk = t.size === 'S' || t.size === 'M';
  line(sizeOk && t.risk !== 'high' ? 'ok' : sizeOk ? 'warn' : 'bad', sizeOk && t.risk !== 'high', `Size ${t.size ?? '?'}, risk ${t.risk ?? '?'}`);
  line(criteria.length ? 'ok' : 'bad', criteria.length > 0, plural(criteria.length, 'criterion', 'criteria'));
  const msgs = t.lint_messages || {};
  const errors = list(msgs.errors), warnings = list(msgs.warnings);
  for (const e of errors) line('bad', false, e);
  for (const w of warnings) line('warn', false, w);
  if (!errors.length && !warnings.length) line('ok', true, 'lint passes');
  const after = list(t.after), waiting = list(t.waiting_on);
  for (const id of after) {
    const done = !waiting.includes(id);
    line(done ? 'ok' : 'warn', done, `after: ${id} ${done ? 'done' : 'not done'}`);
  }
  if (!after.length) line('ok', true, 'no after: tickets');
  ready.appendChild(setReadyButton(t, errors.length || (t.lint && t.lint.errors) || 0));
  if (withFull) ready.appendChild(fullButton(t, 'shaping'));
  if (refused.has(t.id)) ready.appendChild(el('div', 'bad refused', refused.get(t.id)));
  return ready;
}
// Gate 1 from the panel: the server sets the ticket ready and commits it, and the next refresh moves it to the queue.
function setReadyButton(t, lintErrors) {
  const pending = settingReady.has(t.id);
  const b = el('button', 'set-ready', pending ? 'Setting ready…' : 'Set ready');
  b.type = 'button';
  b.disabled = pending || lintErrors > 0;
  if (lintErrors > 0) b.title = `Fix the lint ${lintErrors === 1 ? 'error' : 'errors'} first: a ticket that fails lint can't be ready.`;
  b.addEventListener('click', e => {
    e.stopPropagation(); // the click is for the button, not the ticket
    if (b.disabled) return;
    setReady(t.id);
  });
  return b;
}
// Shows the whole ticket in the side pane, leaving the ticket open in the list. `list` is the id of the list it's in.
function fullButton(t, list) {
  const b = el('button', 'full-open', 'Full ticket');
  b.type = 'button';
  b.fullOf = String(t.id); // 0326: so the focus can come back to it, or to the button drawn in its place
  b.addEventListener('click', e => {
    e.stopPropagation();
    openFull(t, { id: String(t.id), list });
  });
  return b;
}
// 0157: a number from 10,000 up shortened to thousands or millions ("108k", "2.4M"); below that, null.
function shortened(n) {
  if (n < 10000) return null;
  const k = Math.round(n / 1000);
  return k < 1000 ? `${k}k` : `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
}
// A token count, shortened from 10,000 up with the exact number as its tooltip; below that, the exact number.
function tokenCount(n) {
  const exact = n.toLocaleString('en-GB'), short = shortened(n), v = el('span', 'v', short === null ? exact : short);
  if (short !== null) v.title = exact;
  return v;
}
// 0466: a Shipped card's title, which opens and closes the card as the rest of its top row does. Tab, Enter and Space
// work as on a button (0141), and the focus stays on it once the card is drawn again.
function shippedTitle(t, isOpen) {
  const a = el('span', 'title', (t.title || '').trim() || `Ticket ${t.id}`); // a blank title would leave nothing to press
  a.tabIndex = 0;
  a.setAttribute('role', 'button');
  a.setAttribute('aria-expanded', String(isOpen));
  a.shippedOf = String(t.id);
  a.addEventListener('keydown', pressWithKeys);
  return a;
}
// Opens or closes a shipped card. When its title had the focus, the title drawn in its place takes it.
function toggleShipped(id) {
  const had = document.activeElement && document.activeElement.shippedOf === id;
  flip(openShipped, id);
  if (!had) return;
  const find = n => { if (n.shippedOf === id) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; };
  const title = find($('shipped'));
  if (title && title.focus) title.focus({ preventScroll: true });
}
function openFull(t, from = null) {
  fullId = String(t.id);
  packOf = null;
  fullFrom = from;
  render();
  const pane = $('full-ticket');
  if (pane.focus) pane.focus({ preventScroll: true }); // so the keys scroll the pane, and none reach the page behind
}
// 0132: shows the ticket's review pack in the side pane, as `speck pack <id>` prints it from the panel's checkout now.
function packButton(t) {
  const b = el('button', 'full-open', 'Review pack');
  b.type = 'button';
  b.addEventListener('click', e => {
    e.stopPropagation(); // the click is for the button, not the ticket
    fullId = String(t.id);
    fullFrom = null;
    packOf = { id: fullId, state: 'loading' };
    shipRefused.delete(fullId);
    shipped.delete(fullId);
    changesSaid.delete(fullId); // 0357: the box comes back, holding any note that wasn't sent
    changesRefused.delete(fullId);
    render();
    const pane = $('full-ticket');
    if (pane.focus) pane.focus({ preventScroll: true }); // so the keys scroll the pane, and none reach the page behind
    loadPack(fullId);
  });
  return b;
}
// Fetches the pack once, when it's opened. An answer for a pack that's been closed, or replaced since, is dropped.
let packSeq = 0;
async function loadPack(id) {
  const mine = ++packSeq;
  let next;
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/pack`, { cache: 'no-store' });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    if (res.ok && body && body.pack === null) next = { state: 'none' };
    else if (res.ok && body && typeof body.pack === 'string') next = { state: 'ok', text: body.pack, pictures: packPictures(body.pictures), documents: packDocuments(body.documents) };
    else next = { state: 'error', text: body && typeof body.error === 'string' && body.error ? body.error : `The server couldn't make the review pack (${res.status}).` };
  } catch {
    next = { state: 'error', text: "Couldn't reach the panel server, so the review pack can't be shown." };
  }
  if (mine !== packSeq || !packOf || packOf.id !== id) return;
  packOf = { id, ...next };
  render();
}
// 0294: the pictures of a visual change the server listed with the pack, each with its caption, served by the panel.
const packPictures = list => (Array.isArray(list) ? list : []).filter(p => p && typeof p.caption === 'string' && typeof p.url === 'string' && /^\/api\/tickets\/\d+\/pictures\/\d+$/.test(p.url));
// Each picture, small, with its caption under it. Pressing it opens it full size in a new tab.
function picturesPart(pictures) {
  return [el('h6', 'md-h3', 'Pictures'), el('div', 'pack-pictures', null, ...pictures.map(p => {
    const img = el('img');
    img.src = p.url;
    img.alt = p.caption;
    img.loading = 'lazy';
    const a = el('a', null, null, img);
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = 'Open full size';
    return el('figure', null, null, a, el('figcaption', null, p.caption));
  }))];
}
// 0354: a document task's files the server listed with the pack, each with its path from the project root, served by the panel.
const packDocuments = list => (Array.isArray(list) ? list : []).filter(d => d && typeof d.path === 'string' && typeof d.url === 'string' && /^\/api\/tickets\/\d+\/output\/./.test(d.url));
const isMarkdown = d => /\.(md|markdown)$/i.test(d.path);
// 0359: each file as a button at the top of the pack, labelled with its path. A button has no address, so a browser that
// opens links itself has nothing to open: pressing a Markdown file shows it formatted in a pop-up over the whole panel
// (0362), and any other opens in a new tab, served by the panel.
function documentsPart(documents) {
  return [el('div', 'pack-documents', null, ...documents.map(d => {
    const b = el('button', 'pack-document', d.path);
    b.type = 'button';
    b.title = isMarkdown(d) ? 'Show it formatted, over the whole panel' : 'Open it in a new tab';
    b.docOf = d.path; // 0362: so the focus can come back to it, or to the button drawn in its place
    b.addEventListener('click', e => { e.stopPropagation(); if (isMarkdown(d)) openDocument(d); else window.open(d.url, '_blank', 'noopener'); });
    return b;
  }))];
}
// 0362: the Markdown file shown in the pop-up, or null while it's closed: { id, path, state: 'loading' | 'error' | 'ok',
// text }. It's kept apart from the pack, so the side pane behind it keeps its nodes as they were.
let docOpen = null, docSeq = 0;
// 0363: the ticket the side pane shows, kept by renderFull, and the signature of what the pop-up's Ship and Ask for
// changes show, so they're redrawn only when it changes, and the document under them keeps its nodes.
let paneTicket = null, docActsBuilt = null;
// Fetches a Markdown file once, when it's pressed. An answer for a file that's been closed, or replaced since, is dropped.
async function openDocument(d) {
  if (!packOf) return;
  const id = packOf.id, mine = ++docSeq;
  docOpen = { id, path: d.path, state: 'loading' };
  drawDoc();
  let next;
  try {
    const res = await fetch(d.url, { cache: 'no-store' });
    next = res.ok ? { state: 'ok', text: await res.text() } : { state: 'error', text: `Couldn't open ${d.path}: the panel didn't find it (${res.status}).` };
  } catch {
    next = { state: 'error', text: `Couldn't reach the panel server, so ${d.path} can't be shown.` };
  }
  if (mine !== docSeq || !docOpen || docOpen.id !== id || docOpen.path !== d.path) return;
  docOpen = { ...docOpen, ...next };
  drawDoc();
}
// Closes the pop-up and puts the focus back on the file's button, or the one drawn in its place since.
function closeDoc() {
  if (!docOpen) return;
  const path = docOpen.path, pane = $('full-ticket');
  docSeq++;
  docOpen = null;
  drawDoc();
  const find = n => { if (n.docOf === path) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; };
  const to = find(pane) || pane;
  if (to.focus) to.focus();
}
// The pop-up, over the whole panel: the file's path, Close, and the file formatted as the pack is, tables included.
// While it's open, the side pane and its backdrop are inert as well as the page (holdPage), so only the pop-up can be
// clicked, scrolled or reached with Tab.
function drawDoc() {
  const view = $('doc-view'), was = !view.hidden && view.children.length > 0, had = within(document.activeElement, view);
  view.hidden = !docOpen;
  holdPane();
  if (!docOpen) { view.replaceChildren(); return; }
  const close = el('button', 'close', 'Close');
  close.type = 'button';
  close.addEventListener('click', e => { e.stopPropagation(); closeDoc(); });
  const body = el('div', 'md');
  if (docOpen.state === 'loading') body.appendChild(el('p', null, `Loading ${docOpen.path}…`));
  else if (docOpen.state === 'error') body.appendChild(el('p', 'bad', docOpen.text));
  else {
    for (const n of mdBlocks(markdown(docOpen.text, { tables: true }))) body.appendChild(n);
    const title = [...body.children].find(n => /^h[56]$/i.test(n.tagName)); // 0445: its first heading is its title
    if (title) title.className += ' doc-title';
  }
  view.setAttribute('aria-label', docOpen.path);
  docActsBuilt = null;
  view.replaceChildren(el('div', 'top', null, el('span', 'title', docOpen.path), close), el('div', 'doc-actions'), body);
  drawDocActs();
  if (!was) view.scrollTop = 0;
  if ((!was || had) && view.focus) view.focus({ preventScroll: true }); // into it, or back into it when Close was redrawn
}
// 0363: above the document, the review pack's Ship and Ask for changes, from shipPart as the pack draws them, so they
// ship it or send it back exactly as the pack's do. Redrawn when what they show changes, with the focus kept in the pop-up.
const docActsSig = t => signature([t.status, t.shipping === true, t.pull_request ?? null, shippingId, shipped.get(String(t.id)) ?? null,
  shipRefused.get(String(t.id)) ?? null, changesSending, changesSaid.get(String(t.id)) ?? null, changesRefused.get(String(t.id)) ?? null]);
function drawDocActs() {
  const view = $('doc-view'), acts = docOpen && [...view.children].find(n => n.className === 'doc-actions');

  const t = acts && paneTicket && String(paneTicket.id) === String(docOpen.id) ? paneTicket : null;
  if (!t) return;
  const sig = docActsSig(t);
  if (sig === docActsBuilt) return;
  docActsBuilt = sig;
  const had = within(document.activeElement, acts);
  acts.replaceChildren(...shipPart(t));
  if (had && view.focus) view.focus({ preventScroll: true });
}
// The side pane with a review pack: its Markdown formatted, tables included, and the findings in a <details> element
// that folds away, as the pack's own <details> does where Markdown is shown with HTML.
function packPane(t) {
  const close = el('button', 'close', 'Close');
  close.type = 'button';
  close.addEventListener('click', closeFull);
  const body = el('div', 'md');
  if (packOf.state === 'loading') body.appendChild(el('p', null, 'Loading the review pack…'));
  else if (packOf.state === 'none') body.appendChild(el('p', null, `There's no review pack for ${t.id}: it has no review rounds recorded.`));
  else if (packOf.state === 'error') body.appendChild(el('p', 'bad', packOf.text));
  else {
    const blocks = packBlocks(packOf.text);
    // The pictures go under the acceptance criteria, or at the end of a pack without them.
    if (packOf.pictures.length) { const at = blocks.findIndex(n => n.className === 'ac-table'); blocks.splice(at < 0 ? blocks.length : at + 1, 0, ...picturesPart(packOf.pictures)); }
    for (const n of blocks) body.appendChild(n);
  }
  // 0359: a document task's files go at the top, above Ship.
  const documents = packOf.state === 'ok' && packOf.documents.length ? documentsPart(packOf.documents) : [];
  return [el('div', 'top', null, el('span', 'id', t.id), el('span', 'title', 'Review pack'), close), ...documents, ...shipPart(t), body];
}
// 0133: an approved ticket's pack has a Ship button, above the pack. Clicking it is the user shipping (Gate 2), as
// /speck-ship is: the server runs speck ship for it. Under it, that it's shipping, what speck ship said, or why it refused.
// That it's shipping, and what speck ship said, show whatever the ticket's status: speck ship sets it done before it
// pushes, so an update can show it done while the push is still going, or after a push that failed.
function shipPart(t) {
  const id = String(t.id), pending = shippingId === id || t.shipping === true, out = [];
  if (shipped.has(id)) return [el('div', 'ship-said', shipped.get(id))];
  out.push(...prPart(t)); // 0295
  if (pending || (t.status === 'approved' && packOf.state === 'ok')) {
    const b = el('button', 'ship', pending ? 'Shipping…' : 'Ship');
    b.type = 'button';
    b.disabled = shippingId !== null || t.shipping === true || changesSending === id; // one ship at a time, and none while one runs from elsewhere (0153)
    b.title = 'Merge this ticket into the base branch and push it, as /speck-ship does';
    b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) shipTicket(id); });
    // 0357: and, until it's shipping or its note has gone, a box for a note and an Ask for changes button beside Ship.
    const asking = !pending && t.status === 'approved' && !changesSaid.has(id);
    out.push(asking ? el('div', 'pack-actions', null, ...changesPart(id, b)) : b);
  }
  if (pending) out.push(el('div', 'ship-said', `Shipping ${id}: running the tests, then merging and pushing. This can take a few minutes.`));
  if (shipRefused.has(id)) out.push(el('div', 'ship-said bad', shipRefused.get(id)));
  if (changesSaid.has(id)) out.push(el('div', 'ship-said', changesSaid.get(id)));
  if (changesRefused.has(id)) out.push(el('div', 'ship-said bad', changesRefused.get(id)));
  return out;
}
// 0357: the note's box, and a row of the Ship button `ship` and Ask for changes, which can't be pressed while the box is
// empty or only spaces. Typing changes only the button, so the pane isn't redrawn under it.
function changesPart(id, ship) {
  const box = el('textarea', 'changes-note'), sending = changesSending === id;
  box.value = changesNotes.get(id) || '';
  box.placeholder = 'What you want changed';
  box.rows = 2;
  box.disabled = sending;
  box.setAttribute('aria-label', `What you want changed in ${id}`);
  const b = el('button', 'ask-changes', sending ? 'Sending…' : 'Ask for changes');
  b.type = 'button';
  b.title = 'Send your note back to the build, as speck changes does: the ticket is built and reviewed again before it ships';
  const can = () => !sending && changesSending === null && shippingId === null && String(box.value ?? '').trim() !== '';
  b.disabled = !can();
  // 0363: the pack and the document's pop-up each have a box for the note: typing in one puts the same note in the other.
  box.noteOf = id;
  box.sync = () => { box.value = changesNotes.get(id) || ''; b.disabled = !can(); };
  box.addEventListener('input', () => {
    changesNotes.set(id, String(box.value ?? ''));
    b.disabled = !can();
    const each = n => { if (n !== box && n.noteOf === id && n.sync) n.sync(); for (const c of n.children || []) each(c); };
    for (const at of ['full-ticket', 'doc-view']) each($(at));
  });
  box.addEventListener('click', e => e.stopPropagation());
  b.addEventListener('click', e => { e.stopPropagation(); if (can()) askForChanges(id); });
  return [box, el('div', 'pack-buttons', null, ship, b)];
}
async function askForChanges(id) {
  const note = String(changesNotes.get(id) || '').trim();
  if (changesSending !== null || !note) return;
  changesRefused.delete(id);
  changesSending = id;
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/changes`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    if (res.ok) { changesNotes.delete(id); changesSaid.set(id, body && typeof body.message === 'string' && body.message ? body.message : `Your note was sent back to ${id}'s build.`); }
    else changesRefused.set(id, body && typeof body.error === 'string' && body.error ? body.error : `The server refused (${res.status}).`);
  } catch {
    changesRefused.set(id, "Couldn't reach the panel server, so your note wasn't sent. Try again.");
  }
  changesSending = null;
  render();
}
// 0295: in pull request mode, the ticket's pull request, opening on GitHub when pressed, or why it couldn't be opened.
function prPart(t) {
  const pr = t.pull_request && typeof t.pull_request === 'object' ? t.pull_request : null;
  if (pr && typeof pr.url === 'string' && /^https?:\/\//.test(pr.url)) {
    const a = el('a', null, pr.url);
    a.href = pr.url;
    a.target = '_blank';
    a.rel = 'noopener';
    return [el('div', 'ship-said pr', null, el('span', null, 'Pull request: '), a)];
  }
  return pr && typeof pr.error === 'string' && pr.error ? [el('div', 'ship-said bad', `No pull request yet: ${pr.error}`)] : [];
}
// Asks first; cancelling changes nothing. The next update shows the ticket in the Shipped table once it has shipped.
async function shipTicket(id) {
  if (shippingId !== null) return;
  if (typeof confirm !== 'function' || !confirm(`Ship ${id}? This runs speck ship, as /speck-ship does: it runs the tests, merges the ticket into the base branch, pushes it and deletes its branch.`)) return;
  shipRefused.delete(id);
  shippingId = id;
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/ship`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    if (res.ok) shipped.set(id, body && typeof body.message === 'string' && body.message ? body.message : `Shipped ${id}.`);
    else shipRefused.set(id, body && typeof body.error === 'string' && body.error ? body.error : `The server refused (${res.status}).`);
  } catch {
    shipRefused.set(id, "Couldn't reach the panel server, so the ticket wasn't shipped. It may still be shipping: check the Shipped table before trying again.");
  }
  shippingId = null;
  render();
}
function packBlocks(text) {
  const out = [], md = s => mdBlocks(markdown(s, { tables: true }));
  let at = 0;
  for (const m of text.matchAll(/^<details><summary>(.*)<\/summary>[ \t]*$([\s\S]*?)^<\/details>[ \t]*$/gm)) {
    out.push(...md(text.slice(at, m.index)), el('details', null, null, el('summary', null, m[1]), ...md(m[2])));
    at = m.index + m[0].length;
  }
  return [...out, ...md(text.slice(at))];
}
// The side pane: the ticket's id and title, then (0465) the step track and facts table its card shows open, for a draft
// its readiness list and buttons as in the list, without Full ticket, then each of its sections that has something in
// it, its Markdown formatted.
function fullTicket(t, draft, steps) {
  const close = el('button', 'close', 'Close');
  close.type = 'button';
  close.addEventListener('click', closeFull);
  const body = el('div', null, null, draft ? paneReadiness(t) : null);
  mdPart(body, 'Problem', t.problem);
  mdPart(body, 'Outcome', t.outcome);
  const criteria = list(t.acceptance_criteria);
  if (criteria.length) {
    const ol = el('ol', 'criteria');
    for (const c of criteria) {
      const [first, ...rest] = markdown(c);
      // A criterion's first paragraph sits in its numbered item, not in a paragraph of its own.
      const lead = first && first.type === 'paragraph' ? mdInline(first.inline) : first ? mdBlocks([first]) : [];
      ol.appendChild(el('li', null, null, ...lead, ...mdBlocks(rest)));
    }
    body.appendChild(el('h4', null, 'Acceptance criteria'));
    body.appendChild(ol);
  }
  mdPart(body, 'Out of scope', t.out_of_scope);
  mdPart(body, 'Notes', t.notes);
  // 0424: its id and status above its title. 0465: its track and table under it, in place of its tags.
  return [el('div', 'top', null, el('span', 'id', t.id), el('span', 'state', String(t.status ?? '')), close, el('span', 'title', t.title)), steps, body];
}
// 0465: the track and table the ticket's card shows open, drawn as the list it's in draws them: a draft's as in Plan, a
// ready one's as in Build, one in flight's as in Build, and a shipped one's as in Shipped. Its priority is a value
// alone, with no menu (0143).
function paneSteps(t) {
  const [track, facts] = paneFrom === 'draft' ? [trackOf({ steps: NOT_STARTED }), waitingFacts(t, 'Draft', 'After', false)]
    : paneFrom === 'shipped' ? [trackOf({ steps: shippedSteps(t) }), shippedFacts(t, shippedDay)]
      : !t.inFlight ? [trackOf({ steps: NOT_STARTED }), waitingFacts(t, 'Queued', 'Waiting on', false)]
        : [trackOf(t), factsOf(t, doing(t, t.shipping || shippingId === String(t.id)))];
  return el('div', 'steps', null, track, facts, paneFrom === 'shipped' ? null : withDeps(t, true)); // 0467: and its dependency box
}
// What the pane's track and table show, apart from the counter in a Time cell, which the clock puts right.
const stepsShown = n => signature([n.children[0].className, ...[...n.children[0].children].map(s => [s.className, s.textContent]),
  ...[...n.children[1].children].map(c => { const v = c.children[1]; return [c.children[0].textContent, v.className, v.className === 'value time' ? null : [v.title, v.textContent]]; }), n.children[2] ? n.children[2].sig : null]);
// A heading and its Markdown, formatted, or nothing when the text is empty.
function mdPart(body, heading, text) {
  if (text === null || text === undefined || text === '') return;
  body.appendChild(el('h4', null, heading));
  body.appendChild(el('div', 'md', null, ...mdBlocks(markdown(text))));
}
// Nodes for Markdown blocks and inline runs from markdown(). Text goes in as text nodes, never read as HTML, and a link
// gets its URL only when markdown() kept one, which it does only for http and https.
function mdBlocks(blocks) {
  return blocks.map(b => {
    if (b.type === 'code') return el('pre', null, null, el('code', null, b.text));
    if (b.type === 'table') {
      // 0158: each cell carries its column's heading, which a phone shows above it, and a review pack's criteria table
      // is marked, so a phone puts each criterion's number and result on one line.
      const heads = b.head.map(plainText);
      const cell = (tag, c, i) => { const n = el(tag, null, null, ...mdInline(c)); if (tag === 'td') n.setAttribute('data-label', heads[i] ?? ''); return n; };
      const row = (tag, cs) => el('tr', null, null, ...cs.map((c, i) => cell(tag, c, i)));
      const criteria = heads.join('|') === '#|Criterion|Result|Evidence';
      return el('table', criteria ? 'ac-table' : null, null, el('thead', null, null, row('th', b.head)), el('tbody', null, null, ...b.rows.map(r => row('td', r))));
    }
    if (b.type === 'heading') return el(b.level === 1 ? 'h5' : 'h6', `md-h${b.level}`, null, ...mdInline(b.inline));
    if (b.type === 'list') {
      const node = el(b.ordered ? 'ol' : 'ul', null, null, ...b.items.map(it => el('li', null, null, ...mdInline(it.inline), ...mdBlocks(it.lists))));
      if (b.ordered && b.start !== 1) node.start = b.start;
      return node;
    }
    return el('p', null, null, ...mdInline(b.inline));
  });
}
// Inline runs from markdown() as the text they show.
const plainText = nodes => nodes.map(n => (n.inline ? plainText(n.inline) : n.text ?? '')).join('').trim();
function mdInline(nodes) {
  return nodes.map(n => {
    if (n.type === 'text') return document.createTextNode(n.text);
    if (n.type === 'code') return el('code', 'md-code', n.text);
    if (n.type === 'link') {
      const a = el('a', null, null, ...mdInline(n.inline));
      a.href = n.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      return a;
    }
    return el(n.type === 'strong' ? 'strong' : 'em', null, null, ...mdInline(n.inline));
  });
}
const paneReadiness = t => readiness(t, list(t.acceptance_criteria), false);
// What the pane shows apart from its readiness list and its track and table, and what that list shows, with the view
// state it depends on.
const fullText = t => [t.id, t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes];
const readyData = t => [ownData(t), settingReady.has(t.id), refused.get(t.id) ?? null];
// Shows the ticket whose id is in fullId wherever it shows: in the Tickets list, the queue or the Shipped list, the
// first one in that order when ids repeat. It closes the pane when the ticket shows in none of them. The pane keeps
// its nodes while what they show is unchanged, so text selected in it survives the refresh. When only a draft's
// readiness list data or its Set ready state changes, a new list replaces the old and the rest stays. The same goes
// for the track and table under the title (0465), whose counter is put right in place, as a card's is.
let fullBuilt = null, readyBuilt = null, stepsBuilt = null; // the signatures of what the pane, its readiness list and its track and table show
let paneFrom = null; // 0465: which list the pane's ticket is in: 'draft', 'queue' or 'shipped'
function renderFull(m) {
  const pane = $('full-ticket'), find = ts => ts.find(d => String(d.id) === fullId);
  const draft = fullId === null ? null : find(m.drafts), t = fullId === null ? null : draft || find(m.queue) || find(m.shipped) || null;
  if (!t && fullId !== null && within(document.activeElement, pane)) focusBack = true; // 0326: it closed with the focus in it
  if (!t) { fullId = null; packOf = null; }
  if (docOpen && (!packOf || String(packOf.id) !== String(docOpen.id))) { if (within(document.activeElement, $('doc-view'))) focusBack = true; docSeq++; docOpen = null; drawDoc(); } // 0362: its pack has gone
  paneTicket = t;
  paneFrom = !t ? null : draft ? 'draft' : find(m.queue) ? 'queue' : 'shipped';
  drawDocActs(); // 0363
  const sig = t ? signature([fullId, !!draft, packOf ? ['pack', packOf, t.status, t.shipping === true, shippingId, shipped.get(fullId) ?? null, shipRefused.get(fullId) ?? null, changesSending, changesSaid.get(fullId) ?? null, changesRefused.get(fullId) ?? null] : fullText(t)]) : null, readySig = draft && !packOf ? signature([fullId, readyData(draft)]) : null;
  const steps = t && !packOf ? paneSteps(t) : null, stepsSig = steps ? signature([fullId, t.status, stepsShown(steps)]) : null;
  pane.hidden = !t;
  $('full-backdrop').hidden = !t;
  holdPage(pageHeld());
  if (sig !== fullBuilt) {
    fullBuilt = sig;
    readyBuilt = readySig;
    stepsBuilt = stepsSig;
    pane.replaceChildren(...(t ? (packOf ? packPane(t) : fullTicket(t, !!draft, steps)) : []));
    return;
  }
  if (readySig !== readyBuilt) {
    readyBuilt = readySig;
    const body = pane.children[2], old = body.children[0];
    const focused = !!old.contains && old.contains(document.activeElement); // its Set ready, just clicked
    body.insertBefore(paneReadiness(t), old);
    body.removeChild(old);
    if (focused && pane.focus) pane.focus({ preventScroll: true }); // so the keys still scroll the pane
  }
  if (stepsSig !== stepsBuilt) {
    stepsBuilt = stepsSig;
    const state = [...pane.children[0].children].find(n => n.className === 'state');
    if (state) state.textContent = String(t.status ?? ''); // 0424
    pane.insertBefore(steps, pane.children[1]);
    pane.removeChild(pane.children[2]);
  } else if (steps) {
    const sub = paneCounter();
    if (sub) putCounter(sub, queueCounter(t));
  }
}
// 0465: the counter in the pane's Time cell, for a ticket in flight in the queue, or null.
const paneCounter = () => (paneFrom === 'queue' && paneTicket.inFlight && !packOf ? timeOf($('full-ticket').children[1].children[1]) : null);
function closeFull() { fullId = null; packOf = null; focusBack = true; render(); } // 0362: the pop-up goes with it (renderFull)
// 0326: once the pane has closed and the board is drawn, the focus goes back to the Full ticket button that opened it,
// the one drawn in its place since, or, when its ticket has none on the board now, to the top of the list it was in.
// 0466: a shipped one's, or the Shipped lane.
function returnFocus() {
  const from = fullFrom;
  focusBack = false;
  fullFrom = null;
  if (!from) return;
  const find = n => { if (n.fullOf === from.id) return n; for (const c of n.children || []) { const f = find(c); if (f) return f; } return null; };
  const to = from.list === 'shipped' ? find($('shipped')) || $('shipped-section') // 0466
    : find($(from.list)) || find($(from.list === 'queue' ? 'shaping' : 'queue')) || $(from.list === 'queue' ? 'build-section' : 'shaping-section');
  openTab(laneOf(to)); // 0410: the tab holding it opens first
  if (to.focus) to.focus({ preventScroll: true }); // 0441: the list stays where it was, as 0060 asks, even with the button out of view
}
// 0362, 0368: while a document's pop-up or Settings covers the panel, the side pane and its backdrop can't be reached either.
function holdPane() { for (const id of ['full-ticket', 'full-backdrop']) $(id).inert = !!docOpen || settingsView !== null; }
// While the pane is open the page can't scroll or take the focus, and it's put back where it was when the pane closes.
// 0366: the same while Settings or the Foreman's pop-up is open.
const pageHeld = () => fullId !== null || settingsView !== null || foremanOpen;
let heldAt = null; // the page's scroll position when the pane opened, or null while it's closed
function holdPage(on) {
  const root = document.documentElement;
  if (!root || (heldAt !== null) === on) return;
  if (on) heldAt = [scrollX, scrollY];
  root.classList.toggle('held', on);
  for (const n of document.querySelectorAll('header, #offline, #restart, #tabs, main')) n.inert = on; // Tab can't reach, press or scroll to it (0410: nor the tabs)
  if (!on) { scrollTo(...heldAt); heldAt = null; }
}
// A click on the backdrop closes the pane and nothing else. A drag from the pane to the backdrop clicks a node above both.
// 0160: the header stays at the top of the screen. --head is its height on screen, so a ticket scrolled to sits below
// it. 0413: the header is speck's screen in its frame, and the project and base branch, cut short when the title row
// is narrow, show in full in their tooltip.
const pageHeader = document.querySelector?.('header');
if (pageHeader) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--head', `${pageHeader.offsetHeight}px`)).observe(pageHeader);
  const repo = pageHeader.querySelector('.repo');
  if (repo) repo.title = repo.textContent.trim();
}
// 0453: a phone draws a side of a button's border only when that edge is on a whole pixel (0281), so each button with a
// border is made a whole number of pixels wide, and what follows it in its row starts on a whole pixel too. It's done
// as soon as the page changes, before it's drawn, so new words never squeeze into an old width, and again for every
// button when the window's size or the fonts change. `wholeOf` keeps what each button showed when it was measured, so
// one is measured again only when its words or classes change.
const wholeOf = new WeakMap(), wholeSized = new WeakSet();
function wholeButtons(again = false) {
  const sig = b => `${b.className}\n${b.textContent}`;
  const todo = [...document.querySelectorAll('button')].filter(b => (again || wholeOf.get(b) !== sig(b)) && b.getClientRects().length);
  for (const b of todo) if (wholeSized.has(b)) { b.style.width = ''; wholeSized.delete(b); }
  const widths = todo.map(b => (getComputedStyle(b).borderLeftStyle === 'none' ? null : b.getBoundingClientRect().width));
  todo.forEach((b, i) => {
    wholeOf.set(b, sig(b));
    const w = widths[i];
    if (w === null || Math.abs(w - Math.round(w)) < 1e-3) return;
    b.style.boxSizing = 'border-box';
    b.style.width = `${Math.ceil(w)}px`;
    wholeSized.add(b);
  });
}
if (typeof MutationObserver === 'function' && document.body) {
  new MutationObserver(() => wholeButtons()).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden', 'class', 'aria-selected', 'open'] });
  addEventListener('resize', () => wholeButtons(true));
  document.fonts?.addEventListener?.('loadingdone', () => wholeButtons(true));
  wholeButtons();
}
$('full-backdrop').addEventListener('click', e => { if (e.target === $('full-backdrop')) closeFull(); });
$('more-stats').addEventListener('click', () => { moreStats = !moreStats; render(); });
// 0396: a switch, a button kept between redraws so it keeps focus, showing its state beside a sliding knob.
function toggleSwitch(id, label) {
  const b = el('button', 'switch');
  b.type = 'button';
  b.id = id;
  b.setAttribute('role', 'switch');
  b.setAttribute('aria-label', label);
  return b;
}
function drawToggle(b, on, word) {
  b.setAttribute('aria-checked', String(on));
  b.replaceChildren(el('span', 'track', null, el('span', 'knob')), el('span', 'state', word));
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (tipTag !== null) closeTip();
  else if (docOpen !== null) closeDoc(); // 0362: the pop-up, over everything else
  else if (foremanOpen && settingsView === null) closeForeman(); // 0285: the Foreman's detail
  else if (settingsLeaving !== null) keepEditing(); // 0275: Escape answers the question with Keep editing
  else if (settingsView !== null && settingTip !== null) { settingHoverWait++; showSettingTip(null, false); } // 0268: the explanation first, then the view. 0371: and no pause left to show it again
  else if (settingsView !== null) leaveSettings();
  else if (priorityMenu !== null) closePriorityMenu();
  else if (fullId !== null) closeFull();
});
// While a priority menu is open, a click anywhere else only closes it: caught on its way down, before it reaches what
// was clicked, so it neither opens nor closes a ticket nor presses a button.
const inPriorityMenu = n => { for (; n; n = n.parentNode) if (/\bprio-menu\b/.test(String(n.className || ''))) return true; return false; };
document.addEventListener('click', e => {
  if (tipTag !== null && !within(e.target, tipTag) && !within(e.target, $('tag-tip'))) closeTip(); // 0165: a click anywhere else closes the tip
  if (priorityMenu === null || inPriorityMenu(e.target)) return;
  e.stopPropagation();
  e.preventDefault();
  closePriorityMenu();
}, true);
function closePriorityMenu() { priorityMenu = null; render(); }
document.addEventListener('scroll', () => closeTip(), { capture: true, passive: true }); // 0165: a scroll anywhere closes the tip
// The server sets the draft's priority and commits it, and the next refresh moves it to its place in the list.
async function setPriority(id, n) {
  priorityMenu = null;
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/priority/${n}`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      priorityRefused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    priorityRefused.set(id, "Couldn't reach the panel server, so the priority wasn't changed.");
  }
  render();
}
async function setReady(id) {
  refused.delete(id);
  settingReady.add(id);
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/ready`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      refused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    refused.set(id, "Couldn't reach the panel server, so the ticket wasn't changed.");
  }
  settingReady.delete(id);
  render();
}
// 0435: when a note was captured, from its `Captured: <YYYY-MM-DD>` line, as `8 Oct`, with the year when it isn't this
// year's, or null when the line is missing or holds no real date.
function capturedOn(body) {
  const m = /^Captured:[ \t]*(\d{4})-(\d{2})-(\d{2})(?![\d-])/m.exec(typeof body === 'string' ? body : '');
  if (!m) return null;
  const [y, mo, d] = m.slice(1).map(Number), at = new Date(y, mo - 1, d);
  if (at.getFullYear() !== y || at.getMonth() !== mo - 1 || at.getDate() !== d) return null; // such as 2026-02-30
  return `${d} ${MONTHS[mo - 1]}${y === new Date().getFullYear() ? '' : ` ${y}`}`;
}
// A collapsed idea or inbox card is its title and one short line (0435); open, the note's path is above its text.
function noteItem(i, kind, open, second) {
  const isOpen = open.has(i.path);
  const head = el('div', 'head', null, el('div', 'line', null, titled(el('span', 'title', i.title))), el('span'),
    el('div', 'checks', null, el('span', null, second)));
  head.addEventListener('click', () => flip(open, i.path));
  return el('div', `item ${kind}${isOpen ? ' open' : ''}`, null, head,
    isOpen ? el('div', 'detail', null, el('div', null, null, el('div', 'path mono', i.path), noteOf(i))) : null);
}
function ideaItem(i) {
  const on = capturedOn(i.body), status = String(i.status || '').trim();
  return noteItem(i, 'idea', openIdeas, [on ? `Captured ${on}` : 'No capture date', status && status !== 'idea' ? status : null].filter(Boolean).join(' · '));
}
function inboxItem(i) {
  const on = capturedOn(i.body);
  return noteItem(i, 'inbox', openInbox, i.from ? `From ${i.from} · ${on ? `captured ${on}` : 'No capture date'}` : on ? `Captured ${on}` : 'No capture date');
}
// An opened idea's or inbox note's whole text, its Markdown formatted as in the review pack, tables included.
const noteOf = i => el('div', 'note md', null, ...mdBlocks(markdown(typeof i.body === 'string' ? i.body : '', { tables: true })));
function shapingToggle(m) {
  const button = (view, label, n) => {
    const b = el('button', `toggle ${view}${shapingView === view ? ' on' : ''}`, `${label} · ${n}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(shapingView === view)); // 0450: a screen reader hears which list is open
    b.addEventListener('click', () => { shapingView = view; render(); });
    return b;
  };
  $('shaping-toggle').replaceChildren(button('tickets', 'Tickets', m.drafts.length), button('ideas', 'Ideas', m.ideas.length), button('inbox', 'Inbox', m.inbox.length));
  $('shaping-section').className = `shaping ${shapingView}`;
}
// A queue row: the ticket, its progress when it's in flight (0156), then what's under it. A blocked ticket is red, and so
// is one whose build has exited, unless it's approved: then it's waiting for you to ship it, and green (0440).
function queueItem(t) {
  const id = String(t.id), isOpen = openQueue.has(id), d = t.inFlight ? doing(t, t.shipping || shippingId === id) : null;
  const stage = d && !t.red && !t.to_ship ? stageOf(t, d) : null; // 0171: a running ticket's border shows its stage
  const cls = `q${t.red ? ' blocked' : t.to_ship ? ' to-ship' : stage ? ` at-${stage}` : !t.inFlight ? ' queued' : ''}${!t.inFlight && t.waiting_on.length ? ' wait' : ''}`;
  // 0419: the id and title, then one details line: what it's doing, or that it's queued, then its priority, size and risk.
  // 0434: its priority, size and risk only while it's open.
  // 0461: an open one in flight shows its five steps as a track under its title. 0462: and its facts in a table under it.
  // 0463: and so does an open queued one, its steps all grey.
  const top = el('div', 'top', null, titleLine(t, !t.inFlight), isOpen ? trackOf(t.inFlight ? t : { steps: NOT_STARTED }) : null,
    t.inFlight ? isOpen ? factsOf(t, d) : progressOf(t, d) : isOpen ? waitingFacts(t, 'Queued', 'Waiting on', false) : queuedLine(t));
  // Only the top row opens and closes it, so clicking or selecting text in the log leaves it open. A click that ends
  // selecting text in the top row leaves it as it is too, so the selection stays.
  top.addEventListener('click', () => { if (typeof getSelection !== 'function' || getSelection().isCollapsed !== false) toggleLog(id); });
  const q = goable(el('div', `${cls}${isOpen ? ' open' : ''}`, null, top, isOpen ? withDeps(t) : null), t); // 0467: and its dependency box under it
  if (!t.inFlight) hoverable(q, t); // tickets in flight are left as they are
  if (!t.inFlight) {
    const ask = foremanAskOf(id); // 0318: a build that ended without starting it
    if (ask) q.appendChild(foremanAskBox(id, ask.question, 'card'));
    if (isOpen) {
      q.appendChild(fullButton(t, 'queue'));
      q.appendChild(backToPlanButton(t));
      if (planRefused.has(id)) q.appendChild(el('div', 'plan-refused', planRefused.get(id)));
      q.appendChild(logBox(id));
    }
    return q;
  }
  const ask = foremanAskOf(id); // 0318
  // 0434: a closed card is its two lines, with only the Foreman's question under them, as its status line gives no sign
  // of it. A blocked question, a paused build's hint, a message and the rest show once it's open.
  if (!isOpen) {
    if (ask) q.appendChild(foremanAskBox(id, ask.question, 'card'));
    return q;
  }
  const facts = t.status === 'blocked' ? questionFacts(t) : null;
  if (t.status === 'blocked' && (t.blocked_question || facts)) q.appendChild(el('div', 'question', t.blocked_question, facts, goWithButton(t), goWithRefusal(t)));
  if (ask) q.appendChild(foremanAskBox(id, ask.question, 'card'));
  if (t.resume) q.appendChild(resumeLine(t));
  if (t.paused) q.appendChild(el('div', 'act', `Paused · carry it on with speck play ${t.id}`));
  if (t.exit_label) {
    q.appendChild(el('div', t.to_ship ? 'act to-ship' : t.carried_by ? 'act' : 'act bad', t.exit_label));
    if (t.carried_by) q.appendChild(el('div', 'act carried', t.carried_by)); // 0338
    if (t.exit_message) q.appendChild(el('div', t.to_ship ? 'question exit to-ship' : t.carried_by ? 'question exit carried' : 'question exit', t.exit_message));
  }
  if (t.ship_hint) q.appendChild(el('div', 'act', t.ship_hint));
  const pack = t.status === 'approved' || t.shipping || t.doc_finished; // 0361: a finished document is in its review pack
  // 0317: a blocked ticket says whether the Foreman will take its recommendation or it's waiting for you, and one whose
  // build carries on with a recommendation says who went with it, until it moves on
  if (t.status === 'blocked' && t.foreman_will === true) q.appendChild(el('div', 'act foreman-will', `The Foreman will take its recommendation: ${t.blocked_recommendation}`));
  else if (t.status === 'blocked') q.appendChild(el('div', 'act', `Waiting for you. Answer the question, then run /speck-build ${t.id}`)); // the bar already shows the status
  const went = wentWithOf(t);
  if (went) q.appendChild(el('div', 'act went-with', `${went.by === 'foreman' ? 'The Foreman went with the recommendation' : 'You went with the recommendation'}: ${went.option} · ${tookAt(went.at)}`));
  q.appendChild(fullButton(t, 'queue'));
  if (pack) q.appendChild(packButton(t));
  if (t.pausable) {
    q.appendChild(stopButton(t));
    if (stopRefused.has(id)) q.appendChild(el('div', 'stop-refused', stopRefused.get(id)));
  }
  q.appendChild(logBox(id));
  return q;
}
// 0461: a ticket's five steps, each a bar with its name under it, in its own colour once it's reached. A blocked
// ticket's, or one whose build stopped, has its current step in crimson.
const STEP_KEYS = ['build', 'check', 'review', 'approve', 'ship'];
const NOT_STARTED = ['Build', 'Self-check', 'Review', 'Approve', 'Ship'].map(label => ({ label, state: '' })); // 0463: none reached
function trackOf(t) {
  const steps = (Array.isArray(t.steps) ? t.steps : []).slice(0, STEP_KEYS.length).map((s, i) => {
    const n = el('span', `step ${STEP_KEYS[i]}${s.state ? ` ${s.state}` : ''}`, s.label);
    n.title = s.label; // the whole name, when it's cut short
    return n;
  });
  return el('div', `track${t.red ? ' stopped' : ''}`, null, ...steps);
}
// 0168: an in-flight ticket's progress, under its title: what it's doing in a sentence and the current stage's name, in
// words only since 0416, then its timer (0058), then any bug, fix or document tag. 0462: only while it's closed; open,
// its facts are in a table (factsOf).
// 0201: a shipping ticket says so once, with no stage's name. 0434: then its timer, and not how long its ship has run.
// 0434: while its builder or reviewer is at work, a grid of moving lights in place of the sentence, and a round under
// review names the round and its reviewer, such as "Review 1 · <its model>".
function progressOf(t, d) {
  const tone = d.tone ? ` ${d.tone}` : '', now = t.steps.find(s => s.state === 'now');
  const ships = d.sentence === 'Shipping', counter = queueCounter(t);
  const line = detailsLine(ships ? 'progress ship-line' : 'progress', [d.working ? null : say(d, tone, false),
    ships ? null : d.round !== null && d.round !== undefined ? el('span', `stage${tone}`, `Review ${d.round}`) : now ? el('span', `stage${tone}`, now.label) : null,
    d.by ? el('span', 'by', d.by) : null,
    counter ? el('span', 'sub', counter) : null, typeTag(t), taskTag(t)]);
  // a space after it, not a dot. The line starts with an element, as detailsLine puts text only after a dot.
  if (d.working) { const first = line.children[0] || null; line.insertBefore(lights(d.sentence), first); line.insertBefore(document.createTextNode(' '), first); }
  return line;
}
// 0462: an open in-flight ticket's facts, under its track: six cells in three columns and two rows, each its label above
// its value. A value is one line, cut short with … when it's too long, and its whole text is its tooltip. A screen
// reader reads each cell as its label, then its value. The Time cell's value is the counter the clock puts right.
const hidden = n => { n.setAttribute('aria-hidden', 'true'); return n; }; // the cell's value says it already
function factsOf(t, d) {
  const who = workerOf(t, d), counter = queueCounter(t);
  const waiting = t.status === 'approved' && !d.moving && d.sentence !== 'Approved · waiting to ship'; // waiting for you, not for speck run
  const tone = d.tone ? ` ${d.tone}` : '';
  return el('dl', 'facts', null,
    factCell('Now', d.word, `now${tone}`, d.sentence, d.working ? hidden(lights(d.sentence)) : null),
    factCell(who.label, who.value, null),
    factCell(waiting ? 'Waiting' : 'Time', counter || '–', 'time'),
    ...lastFacts(t, null));
}
// A cell of a facts table: its label, then its value, whose tooltip is `tip`. `lit`: anything before the value's text.
// `parts`: what the value shows in place of its text, which is still its tooltip.
function factCell(label, value, cls, tip = value, lit = null, parts = null) {
  const v = el('dd', cls ? `value ${cls}` : 'value', null, lit, ...parts || [el('span', cls === 'time' ? 'sub' : 'text', value)]);
  v.title = tip;
  return el('div', 'fact', null, el('dt', 'label', label), v);
}
// The table's bottom row: its priority, size and risk, and its kind. `pick`: its priority opens the menu that sets it,
// as a draft's priority tag does.
function lastFacts(t, pick) {
  const size = t.size ? String(t.size) : '–', risk = t.risk ? String(t.risk) : '–';
  const kind = t.type === 'bug' || t.type === 'fix' ? t.type : t.task === 'document' ? 'document' : 'code';
  const priority = t.priority !== undefined && t.priority !== null && t.priority !== '' ? `P${t.priority}` : '–';
  const set = pick && priority !== '–' ? priorityPicker(t, el('span', 'set-prio', priority)) : null; // plain text, not a tag
  return [factCell('Priority', priority, set ? 'pick' : null, priority, null, set ? [set] : null),
    factCell('Size · risk', `${size} · ${risk}`, null),
    factCell('Type', kind, kind === 'code' ? null : kind)];
}
// 0463: an open ticket that hasn't started: the same table, with `status` where one in flight has Now, then how many of
// the tickets it waits on haven't shipped (`after`: that cell's label), and its lint result, its errors and warnings in
// their colours. `pick`: its priority opens the menu that sets it, as on a draft.
function waitingFacts(t, status, after, pick) {
  const left = list(t.waiting_on).length, of = Math.max(list(t.after).length, left);
  const lint = t.lint || { errors: 0, warnings: 0 };
  const bits = [lint.errors ? el('span', 'bad', plural(lint.errors, 'error')) : null, lint.warnings ? el('span', 'warn', plural(lint.warnings, 'warning')) : null].filter(Boolean);
  const lintText = bits.length ? bits.map(b => b.textContent).join(' · ') : 'passes';
  return el('dl', 'facts', null,
    factCell('Status', status, null),
    factCell(after, !left ? '—' : of > 1 ? `${left} left of ${of}` : `${left} left`, null),
    factCell('Lint', lintText, null, lintText, null, bits.length ? bits.flatMap((b, i) => (i ? [document.createTextNode(' · '), b] : [b])) : null),
    ...lastFacts(t, pick));
}
// 0467: an open ticket's dependency box, under its table, from the model's deps, or nothing when it has none. A Waits
// on box: a header counting its tickets by state, a bar with one even segment for each, then a grid of chips six to a
// row, one for each that hasn't shipped, and one chip two columns wide that shows and hides the shipped ones. A Chain
// box: a header counting the tickets before and after it, then five even slots, each a circle over an id. A chip or a
// circle for a ticket on the page goes to it, as an id in a note does (goTo). In the side pane, which covers the page,
// it shows that ticket in the pane instead.
const depsShown = new Set(); // ids whose Waits on box shows its shipped tickets too
const DEP_WORDS = { shipped: 'shipped', building: 'building', queued: 'queued', self: 'this ticket' };
const depsIds = t => (!t.deps ? [] : t.deps.kind === 'waits' ? t.deps.items.map(i => i.id) : t.deps.slots.filter(s => s && s.id && s.state !== 'self').map(s => s.id));
const depsLinks = t => depsIds(t).filter(id => onPage.has(String(id))); // the ones that go to their ticket
// A chip or a slot: a button that goes to the ticket when it's on the page, otherwise the same, not a button.
function depNode(cls, id, state, kids, inPane) {
  const go = state !== 'self' && onPage.has(String(id));
  const n = el(go ? 'button' : 'span', cls, null, ...kids);
  n.title = `${id} · ${DEP_WORDS[state]}`;
  if (!go) return n;
  n.type = 'button';
  n.setAttribute('aria-label', `Go to ticket ${id}, ${DEP_WORDS[state]}`);
  n.addEventListener('click', e => { e.stopPropagation(); if (inPane) openFull({ id }, fullFrom); else goTo(String(id)); }); // neither opens nor closes the card it's in
  return n;
}
function depsBox(t, inPane = false) {
  const d = t.deps;
  if (!d) return null;
  const id = String(t.id);
  if (d.kind === 'waits') {
    const counts = ['shipped', 'building', 'queued'].filter(s => d[s] > 0).map(s => `${d[s]} ${s}`).join(' · ');
    const bar = el('div', 'deps-bar', null, ...d.items.map(i => el('i', i.state)).sort((a, b) => STATE_ORDER[a.className] - STATE_ORDER[b.className]));
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', counts);
    const shown = depsShown.has(id), open = d.items.filter(i => i.state !== 'shipped'), done = d.items.filter(i => i.state === 'shipped');
    const chips = [...open, ...shown ? done : []].map(i => depNode(`chip ${i.state}`, i.id, i.state, [el('span', null, i.id)], inPane));
    if (done.length) {
      const more = el('button', 'chip more', shown ? 'Hide shipped' : `+${done.length} shipped`);
      more.type = 'button';
      more.setAttribute('aria-expanded', String(shown));
      more.addEventListener('click', e => { e.stopPropagation(); flip(depsShown, id); });
      chips.push(more);
    }
    return el('div', 'deps deps-waits', null, el('div', 'deps-head', null, el('b', null, 'Waits on'), el('span', null, counts)), bar, el('div', 'deps-grid', null, ...chips));
  }
  const slots = d.slots.map(s => (!s ? el('span', 'slot')
    : s.more ? el('span', 'slot more', null, el('span', 'dot'), el('span', 'sid', `+${s.more}`))
      : depNode(`slot ${s.state}`, s.id, s.state, [el('span', 'dot'), el('span', 'sid', s.id)], inPane)));
  return el('div', 'deps deps-chain', null, el('div', 'deps-head', null, el('b', null, 'Chain'), el('span', null, `${d.before} before · ${d.after} after`)), el('div', 'deps-slots', null, ...slots));
}
const STATE_ORDER = { shipped: 0, building: 1, queued: 2 };
// What a dependency box shows, to tell when it needs drawing again.
const depsSig = t => signature([t.deps || null, depsShown.has(String(t.id)), depsLinks(t)]);
// Puts an open card's dependency box right in `card`, straight after `top`, or first in it when `top` is null: a new
// one in place of the old when what it shows has changed, or none when it has none now.
function putDeps(card, top, t) {
  const kids = [...card.children], old = kids.find(n => /^deps\b/.test(n.className)) || null;
  const sig = depsSig(t);
  if (old && old.sig === sig) return;
  const next = depsBox(t);
  if (next) { next.sig = sig; card.insertBefore(next, old || kids[kids.indexOf(top) + 1] || null); }
  if (old) card.removeChild(old);
}
const withDeps = (t, inPane) => { const b = depsBox(t, inPane); if (b) b.sig = depsSig(t); return b; };
const shippedDay = when => when.replace(/,.*$/, ''); // 0464: the day alone, before today
// 0464: a shipped ticket's five steps, every one done, the Review step naming its last round, such as "Review 2".
const shippedSteps = t => NOT_STARTED.map((s, i) => ({ label: i === 2 && t.roundCount > 0 ? `Review ${t.roundCount}` : s.label, state: 'done' }));
// 0464: its facts, in the same table: when it shipped, as its line says it, with the time too as its tooltip, then
// its figures, tokens shortened as on the line with the exact count as their tooltip. One it doesn't have shows "—".
function shippedFacts(t, day) {
  const tokens = (label, n, has) => (!has ? factCell(label, '—', null)
    : factCell(label, shortened(n) ?? n.toLocaleString('en-GB'), null, n.toLocaleString('en-GB')));
  return el('dl', 'facts', null,
    t.end !== null ? factCell('Shipped', day(t.when), null, t.when) : factCell('Shipped', '—', null),
    factCell('Time', t.minutes !== null ? `${t.minutes} min` : '—', null),
    factCell('Review rounds', t.roundCount > 0 ? String(t.roundCount) : '—', null),
    factCell('Builder cost', t.builderCost !== null ? dollars(t.builderCost) : '—', null),
    tokens('Builder tokens', t.builderTokens, t.builderTokens !== null), tokens('Reviewer tokens', t.tokens, t.tokens > 0));
}
// 0443: what a ticket no agent is working on is doing, in words: closed, a long sentence in short words, with the
// sentence as their tooltip and accessible name; open, the sentence.
function say(d, tone, isOpen) {
  if (isOpen || !d.short) return el('span', `say${tone}`, d.sentence);
  const s = el('span', `say${tone}`, d.short);
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', d.sentence);
  s.title = d.sentence;
  return s;
}
// 0434: a 4 × 4 grid of dots with lights moving across it, its name and tooltip the sentence it stands for. The lights
// move by CSS, only when the browser allows motion; with reduced motion one diagonal of dots stays lit.
function lights(sentence) {
  const grid = el('span', 'lights', null, ...Array.from({ length: 16 }, (_, i) => el('i', `d${(i >> 2) + (i & 3)}`)));
  grid.setAttribute('role', 'img');
  grid.setAttribute('aria-label', sentence);
  grid.title = sentence;
  return grid;
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
// An open building or reviewing ticket whose build speck run launched and is running or paused has a Stop build button.
// It asks first, and opens or closes nothing.
function stopButton(t) {
  const id = String(t.id), pending = stopping.has(id);
  const b = el('button', 'stop-build', pending ? 'Stopping…' : 'Stop build');
  b.type = 'button';
  b.disabled = pending;
  b.title = 'End this build and every process it started, and block its ticket, as speck stop does';
  b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) stopBuild(id); });
  return b;
}
// The server stops the build as speck stop does; the next update shows the ticket blocked. A refusal shows under the
// button until the next click on it. Cancelling the question changes nothing.
async function stopBuild(id) {
  if (stopping.has(id)) return;
  if (typeof confirm !== 'function' || !confirm(`Stop ${id}'s build? It ends the build and every process it started, and blocks the ticket. Its branch, worktree and commits are kept.`)) return;
  stopRefused.delete(id);
  stopping.add(id);
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/stop`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      stopRefused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    stopRefused.set(id, "Couldn't reach the panel server, so the build wasn't stopped.");
  }
  stopping.delete(id);
  render();
}
// 0284: a blocked question with a recommendation, whose build speck run can resume, has a Go with the recommendation
// button. It asks first, naming the option; the server records it and speck run carries the build on with it.
// 0317: the recommendation a ticket's build is carrying on with, as the server gives it, or null; and a choice's time.
const wentWithOf = t => (t.went_with && typeof t.went_with === 'object' && typeof t.went_with.option === 'string' && t.went_with.option ? t.went_with : null);
const tookAt = at => (typeof at === 'string' && Number.isFinite(Date.parse(at)) ? `${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC` : '');
function goWithButton(t) {
  if (t.status !== 'blocked' || typeof t.blocked_recommendation !== 'string' || !t.blocked_recommendation || t.blocked_resumable !== true) return null;
  const id = String(t.id), pending = goingWith.has(id);
  const b = el('button', 'go-with', pending ? 'Going with it…' : 'Go with the recommendation');
  b.type = 'button';
  b.disabled = pending;
  b.title = `Go with "${t.blocked_recommendation}", and have speck run carry the build on`;
  b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) goWithIt(id, t.blocked_recommendation); });
  return b;
}
const goWithRefusal = t => (goWithRefused.has(String(t.id)) ? el('div', 'go-with-refused', goWithRefused.get(String(t.id))) : null);
async function goWithIt(id, option) {
  if (goingWith.has(id)) return;
  if (typeof confirm !== 'function' || !confirm(`Go with the recommendation for ${id}: "${option}"? It's recorded in the ticket's Notes, the ticket is set building, and speck run resumes its build with it.`)) return;
  goWithRefused.delete(id);
  goingWith.add(id);
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/recommendation`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      goWithRefused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    goWithRefused.set(id, "Couldn't reach the panel server, so nothing changed.");
  }
  goingWith.delete(id);
  render();
}
// 0318: the Foreman agent's question about a ticket, as the server gives it, or null.
function foremanAskOf(id) {
  const a = state && state.foreman && typeof state.foreman === 'object' ? state.foreman.agent : null;
  return (a && Array.isArray(a.asks) ? a.asks : []).find(q => q && String(q.id) === String(id) && typeof q.question === 'string' && q.question) || null;
}
// 0318: the question with an Answer box and Answer and Dismiss buttons, on the ticket's card (`where` 'card'). The server notes your reply in the ticket's Notes, and speck run carries an answer out.
function foremanAskBox(id, question, where) {
  const pending = askPending.get(id) || null;
  const box = el('textarea', 'ask-answer');
  box.value = askDrafts.get(id) || '';
  box.placeholder = 'Your answer';
  box.rows = 2;
  box.disabled = !!pending;
  box.setAttribute('aria-label', `Your answer to the Foreman's question about ${id}`);
  box.askKey = `${where}:${id}`;
  askBoxes.set(box.askKey, box);
  box.addEventListener('input', () => askDrafts.set(id, String(box.value ?? '')));
  box.addEventListener('click', e => e.stopPropagation()); // typing in it neither opens nor closes the card
  const press = (label, doing, action) => {
    const b = el('button', 'ask-reply', pending === action ? doing : label);
    b.type = 'button';
    b.disabled = !!pending;
    b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) replyToForeman(id, action, question); });
    return b;
  };
  const answer = press('Answer', 'Answering…', 'answer'), dismiss = press('Dismiss', 'Dismissing…', 'dismiss');
  answer.title = 'Send your answer: speck run carries the work on with it';
  dismiss.title = 'Dismiss the question, leaving the ticket as it is';
  return el('div', 'foreman-ask', null, el('p', 'question', `The Foreman asks you: ${question}`), box, el('div', 'ask-buttons', null, answer, dismiss),
    askRefused.has(id) ? el('div', 'ask-refused', askRefused.get(id)) : null);
}
async function replyToForeman(id, action, question) {
  if (askPending.has(id)) return;
  const text = String(askDrafts.get(id) || '').trim();
  askRefused.delete(id);
  if (action === 'answer' && !text) { askRefused.set(id, 'Write your answer in the box first.'); render(); return; }
  if (action === 'dismiss' && (typeof confirm !== 'function' || !confirm(`Dismiss the Foreman's question about ${id}: "${question}"? It's noted in the ticket's Notes, and the ticket is left as it is.`))) return;
  askPending.set(id, action);
  render();
  try {
    const res = await fetch(`/api/foreman/${encodeURIComponent(id)}/${action}`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    if (res.ok) askDrafts.delete(id);
    else {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      askRefused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    askRefused.set(id, "Couldn't reach the panel server, so nothing changed.");
  }
  askPending.delete(id);
  render();
}
// An open ready ticket in the queue has a Back to Plan button: the server sets it back to draft and commits it, and
// the next refresh moves it to Plan's drafts. A refusal shows under the button until the next click on it.
function backToPlanButton(t) {
  const id = String(t.id), pending = unreadying.has(id);
  const b = el('button', 'back-to-plan', pending ? 'Moving to Plan…' : 'Back to Plan');
  b.type = 'button';
  b.disabled = pending;
  b.title = 'Take this ticket out of the Build queue and back to a draft in Plan, so it isn\'t built';
  b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) backToPlan(id); });
  return b;
}
async function backToPlan(id) {
  if (unreadying.has(id)) return;
  planRefused.delete(id);
  unreadying.add(id);
  render();
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/draft`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let why = null;
      try { why = (await res.json()).error; } catch { /* no JSON: say what we know */ }
      planRefused.set(id, typeof why === 'string' && why ? why : `The server refused (${res.status}).`);
    }
  } catch {
    planRefused.set(id, "Couldn't reach the panel server, so the ticket wasn't changed.");
  }
  unreadying.delete(id);
  render();
}
// An open queue ticket's log, as text in a box with its own scrollbar.
const logShown = log => (!log ? 'Loading the log…' : log.failed ? "Couldn't load the log yet. Trying again in a few seconds…" : logText(log));
// A box built afresh, when the ticket opens or its row is rebuilt, goes to the bottom once it's on the page, or where
// the reader had scrolled the box it replaces.
function logBox(id) {
  const old = logBoxes.get(id), box = el('pre', 'log');
  setLogText(box, logShown(logs.get(id)));
  logBoxes.set(id, box);
  logScroll.set(box, old && !atBottom(old) ? old.scrollTop : null);
  return box;
}
// Within a few pixels of the bottom, as scrollTop rarely lands exactly on it.
const atBottom = box => !(box.scrollHeight - box.clientHeight - box.scrollTop > 8);
// Opens or closes a queue ticket. Opening it asks for its log once, opened on the board's stream (0189), which then
// sends each entry as it's written; closing it closes it there. A closed ticket's log is never asked for.
function toggleLog(id) {
  flip(openQueue, id);
  if (openQueue.has(id)) { loadLog(id); return; }
  logBoxes.delete(id);
  logEarly.delete(id);
  logRetry.delete(id);
  if (logPending.has(id)) { logPending.get(id).abort(); logPending.delete(id); }
  if (streamName) fetch(`/api/tickets/${encodeURIComponent(id)}/log/close`, { cache: 'no-store', headers: { 'X-Speck-Stream': streamName, 'X-Speck-Order': String(++logOrder) } }).catch(() => {});
}
// A request that fails leaves the last log on screen, and it's asked for again at the stream's next keep-alive. A
// request still waiting when the next is made is aborted, so slow answers can't pile up.
async function loadLog(id) {
  const mine = (logAsks.get(id) || 0) + 1, ctl = new AbortController();
  logAsks.set(id, mine);
  if (logPending.has(id)) logPending.get(id).abort();
  logPending.set(id, ctl);
  logEarly.delete(id);
  logRetry.delete(id);
  let log = null;
  try {
    const res = await fetch(`/api/tickets/${encodeURIComponent(id)}/log`, { cache: 'no-store', signal: ctl.signal, ...(streamName ? { headers: { 'X-Speck-Stream': streamName, 'X-Speck-Order': String(++logOrder) } } : {}) });
    const body = res.ok ? await res.json() : null;
    if (body && typeof body.text === 'string')
      log = { text: body.text, truncated: body.truncated === true, build: Number.isInteger(body.build) ? body.build : null, at: Number.isInteger(body.at) ? body.at : null };
  } catch { /* the server is down: keep what's shown */ }
  if (logPending.get(id) === ctl) logPending.delete(id);
  if (logAsks.get(id) !== mine || !openQueue.has(id)) return; // a newer request has taken over, or it's closed
  const early = logEarly.get(id) || [];
  logEarly.delete(id);
  if (!log) logRetry.add(id);
  const old = logs.get(id);
  if (log) logs.set(id, log);
  else if (!old) logs.set(id, { failed: true });
  else return;
  showLog(id, !!log && replaced(old, log));
  for (const u of early) logUpdate(u);
}
// 0189: an update from the stream to an open log: the lines to take off its end (drop: a last line written further
// since) and the new lines to add at the bottom, or a new build's log, which replaces it. One that arrives before the log it follows is kept until that has. One already shown is left out, and
// after a missed one the log is asked for again.
function logUpdate(u) {
  if (!u || typeof u !== 'object' || !Number.isInteger(u.build) || !Number.isInteger(u.at)) return;
  if (u.reset === true ? typeof u.text !== 'string' : !Number.isInteger(u.drop) || u.drop < 0 || !Array.isArray(u.lines) || !u.lines.every(l => typeof l === 'string')) return;
  const id = String(u.id);
  if (!openQueue.has(id)) return;
  if (logPending.has(id)) { if (!logEarly.has(id)) logEarly.set(id, []); logEarly.get(id).push(u); return; }
  const old = logs.get(id);
  if (!old || old.failed || old.build === null) return;
  if (u.build < old.build || (u.build === old.build && u.at <= old.at)) return;
  if (u.reset === true) {
    logs.set(id, { text: u.text, truncated: u.truncated === true, build: u.build, at: u.at });
    return showLog(id, true);
  }
  if (u.build !== old.build || u.at !== old.at + 1) return loadLog(id);
  const kept = old.text ? old.text.split('\n') : [];
  if (u.drop > kept.length) return loadLog(id);
  const lines = [...kept.slice(0, kept.length - u.drop), ...u.lines];
  logs.set(id, { text: lines.slice(-LOG_LINES).join('\n'), truncated: old.truncated || lines.length > LOG_LINES, build: u.build, at: u.at });
  showLog(id, false);
}
// A new build of the ticket starts its log afresh: the new one isn't cut short, and the old one was, or doesn't run on
// into it.
const replaced = (old, log) => !!old && !old.failed && !log.truncated && (old.truncated || !log.text.startsWith(old.text));
// Puts the newest log in its box in place, without render(). A box at the bottom stays there, so the newest line is in
// view, and so does a box whose log was replaced by a new build's. Otherwise the box stays where the reader left it.
function showLog(id, toBottom) {
  const box = logBoxes.get(id);
  if (!box) return;
  const follow = toBottom || atBottom(box);
  setLogText(box, logShown(logs.get(id)));
  if (follow) box.scrollTop = box.scrollHeight;
}
// 0422: a log line's row: its time (HH:MM:SS and a space) in a span of its own, then its text, coloured by its kind:
// the note that earlier lines aren't shown, a failure (✗, or Build ended), a tool call (→) or the agent's message.
// `more`: another line follows, so the row ends with its newline, keeping the log's text as it was. `plain`: one of
// the box's own notes, such as No log yet., which isn't a log line.
const LOG_PLAIN = new Set(['Loading the log…', "Couldn't load the log yet. Trying again in a few seconds…", 'No log yet.']);
function logParts(line, plain) {
  const m = plain ? null : line.match(/^(\d\d:\d\d:\d\d )([\s\S]*)$/), text = m ? m[2] : line, t = text.trimStart();
  const kind = plain ? 'plain' : line === TRUNCATED ? 'note' : line === '' ? 'gap' : t.startsWith('✗') || text.startsWith('Build ended:') ? 'fail'
    : t.startsWith('→') ? 'tool' : 'msg';
  return { cls: `ln ${kind}${m ? ' timed' : ''}`, at: m ? m[1] : '', text };
}
const logTextOf = new WeakMap(); // row → the text node with its text
function logRow(line, more, plain) {
  const p = logParts(line, plain), t = document.createTextNode(p.text);
  const row = el('span', p.cls, null, p.at ? el('span', 'at', p.at) : null, t, more ? document.createTextNode('\n') : null);
  logTextOf.set(row, t);
  return row;
}
// Puts a newer log in its box, a row a line. New lines after the old are added at the bottom. When the old lines run on
// into the new ones once the oldest have dropped out of the tail, only the fewest rows that makes them fit are taken
// out at the top and the rest added at the bottom, so text selected in the rows that stay stays selected. The last old
// line may have grown: its new text is added to its row's, or, when that changes its time or its kind, its row alone is
// made again. Anything else makes every row afresh.
const logLinesOf = new WeakMap(); // box → the lines its rows show
function setLogText(box, text) {
  const next = text.split('\n'), plain = LOG_PLAIN.has(text), cur = logLinesOf.get(box);
  logLinesOf.set(box, plain ? null : next);
  const rows = Array.from(box.children);
  if (cur && !plain) {
    const head = cur[0] === TRUNCATED && next[0] === TRUNCATED ? 1 : 0;
    for (let k = head; k < cur.length; k++) {
      const kept = cur.slice(k), last = kept.length - 1;
      if (kept.length > next.length - head || !kept.every((l, i) => (i < last ? l === next[head + i] : next[head + i].startsWith(l)))) continue;
      for (const r of rows.slice(head, k)) box.removeChild(r);
      const at = head + last, more = at < next.length - 1, row = rows[k + last];
      const was = logParts(kept[last], false), now = logParts(next[at], false);
      if (was.cls !== now.cls || was.at !== now.at || !logTextOf.has(row)) { box.insertBefore(logRow(next[at], more, false), row); box.removeChild(row); }
      else {
        if (now.text !== was.text) logTextOf.get(row).appendData(now.text.slice(was.text.length));
        if (more) row.appendChild(document.createTextNode('\n'));
      }
      for (let i = at + 1; i < next.length; i++) box.appendChild(logRow(next[i], i < next.length - 1, false));
      return;
    }
  }
  box.replaceChildren(...next.map((l, i) => logRow(l, i < next.length - 1, plain)));
}
const queueCounter = t => (t.counter !== null ? `${t.paused ? 'Paused · ' : ''}${t.counter}` : t.paused ? 'Paused' : '');
// A closed ready ticket's details line (0419): Queued, the tickets it waits on or unlocks, then any bug, fix or document
// tag. 0463: open, its facts are in a table (waitingFacts).
function queuedLine(t) {
  const note = t.chain ? 'unlocks ' : t.waiting_on.length ? 'waiting on ' : null;
  const line = detailsLine('act', [el('b', null, 'Queued'), note ? el('span', 'ids', note, ...idLinks(noteIds(t))) : null, typeTag(t), taskTag(t)]);
  line.links = shownLinks(t).join(','); // which ids are buttons, as the text alone doesn't say
  return line;
}
// Puts new text in a node with one text node by replacing only the characters that differ, in place, so a selection in
// or across it stays and moves with the text. A browser would pull a selection's end inside those characters back to
// their start, so it is put at their new end instead.
function setText(node, text) {
  const t = node.firstChild;
  if (!t || t !== node.lastChild || t.nodeType !== 3) { node.textContent = text; return; }
  const old = t.data;
  if (old === text) return;
  let a = 0, b = 0;
  while (a < old.length && a < text.length && old[a] === text[a]) a++;
  while (b < old.length - a && b < text.length - a && old[old.length - 1 - b] === text[text.length - 1 - b]) b++;
  const count = old.length - a - b, put = text.slice(a, text.length - b);
  const sel = getSelection(), range = sel.rangeCount ? sel.getRangeAt(0) : null;
  const end = range && range.endContainer === t && range.endOffset > a && range.endOffset <= a + count;
  t.replaceData(a, count, put);
  if (end) range.setEnd(t, a + put.length);
}
const child = (node, cls) => [...node.children].find(n => n.className === cls); // children is an HTMLCollection, with no find
// What a kept queue row shows from the clock or from other tickets, put right on its node: the counter, and for a
// ready ticket its chain icon and Queued line. Only the parts that change are replaced.
// An in-flight row's details line, and its counter (0419: in that line, when it has one).
// 0462: an open one's counter is in its facts' Time cell.
const progressLine = q => [...child(q, 'top').children].find(n => /^(progress|facts)\b/.test(n.className)) || null;
const timeOf = p => { const v = [...p.children].map(c => c.children[1]).find(v => v && v.className === 'value time'); return v ? child(v, 'sub') || null : null; };
// Puts a counter right, and in a Time cell its tooltip too, which is a dash when it has no counter.
function putCounter(sub, text) {
  const cell = sub.parentNode && sub.parentNode.className === 'value time' ? sub.parentNode : null;
  setText(sub, cell ? text || '–' : text);
  if (cell) cell.title = sub.textContent;
}
const counterOf = q => { const p = progressLine(q); return !p ? null : p.className === 'facts' ? timeOf(p) : child(p, 'sub') || null; };
function queueUpdate(q, t) {
  const sub = counterOf(q);
  if (sub) putCounter(sub, queueCounter(t));
  if (openQueue.has(String(t.id))) putDeps(q, child(q, 'top'), t); // 0467
  if (t.inFlight) return;
  const top = child(q, 'top'), row = child(top, 'line'), icon = chainIcon(t), old = child(row, 'chain') || child(row, 'lock');
  if (!old || !icon || old.className !== icon.className || old.title !== icon.title) {
    if (icon) row.insertBefore(icon, old || child(row, 'title')); // the icon comes right after the id
    if (old) row.removeChild(old);
  }
  // 0463: an open one's facts table, in place of its line
  const isOpen = openQueue.has(String(t.id)), act = child(top, isOpen ? 'facts' : 'act'), line = isOpen ? waitingFacts(t, 'Queued', 'Waiting on', false) : queuedLine(t);
  if (act.textContent !== line.textContent || act.links !== line.links) { top.insertBefore(line, act); top.removeChild(act); }
}
// The counters run on their own 1-second timer, apart from the state updates and render(), so they move on between updates.
// Each tick puts only the counters right, and the timer is cleared once no in-flight ticket in the queue has a started.
const COUNTER_MS = 1000;
let counters = []; // [counter node, started plus time waited in ms, paused] for each counting queue row, from the last render
let counterTimer = null;
function startCounters(list) {
  counters = list;
  if (!counters.length && counterTimer !== null) { clearInterval(counterTimer); counterTimer = null; }
  if (counters.length && counterTimer === null) counterTimer = setInterval(tickCounters, COUNTER_MS);
}
function tickCounters() {
  for (const [sub, since, paused] of counters) putCounter(sub, `${paused ? 'Paused · ' : ''}${counter(Date.now() - since)}`);
}
// Under a blocked question: the command that reopens the build's session, with a button that copies it.
function resumeLine(t) {
  const line = el('div', 'resume', null, el('code', 'cmd', t.resume.text));
  if (!t.resume.command) return line;
  const shown = copied.get(t.id);
  const b = el('button', 'copy', shown ? shown[1] : 'Copy');
  b.type = 'button';
  b.addEventListener('click', e => { e.stopPropagation(); copy(t.id, t.resume.text); });
  copyButtons.set(t.id, b);
  line.appendChild(b);
  return line;
}
async function copy(id, text) {
  const mine = ++copies;
  let said = 'Copied';
  try { await navigator.clipboard.writeText(text); } catch { said = "Couldn't copy: select the command instead"; }
  copied.set(id, [mine, said]);
  copyLabel(id);
  setTimeout(() => { if (copied.has(id) && copied.get(id)[0] === mine) { copied.delete(id); copyLabel(id); } }, 2000);
}
// The label is put right on the button, so the row it's in, and any text selected there, stays.
function copyLabel(id) {
  const b = copyButtons.get(id);
  if (b) b.textContent = copied.has(id) ? copied.get(id)[1] : 'Copy';
}
// Hovering a ticket in Shaping or a ready one in the queue lights it and every ticket linked to it through after:, and
// leaves the rest as they are (0185). A ticket with no links lights nothing: its own hover fill is enough.
// The classes are set on the nodes in place, so a Shaping item keeps its node (and any text selected in it).
let hovered = null; // the id of the ticket under the pointer, or null
let linked = new Map(); // id → the ids linked to it, from the last render
// A tap on a touch screen, such as a phone's, sends mouseenter too, and nothing ends it until a tap somewhere else, so
// only a mouse lights tickets up, not a finger or a pen (0154). The pointer that sent it is known from the pointerover a browser sends just before.
// The (hover: none) media query can't say this: a touch laptop's mouse hovers, and headless Chrome reports none with a mouse.
let pointerKind = null; // the type of the pointer that last moved over something: 'mouse', 'touch' or 'pen', or null before any
document.addEventListener('pointerover', e => { pointerKind = e.pointerType; }, true);
const canHover = () => pointerKind === null || pointerKind === 'mouse';
function hoverable(node, t) {
  node.ticketId = String(t.id);
  node.addEventListener('mouseenter', () => { if (!canHover()) return; hovered = node.ticketId; lightUp(); });
  node.addEventListener('mouseleave', () => { if (hovered === node.ticketId) hovered = null; lightUp(); });
  return node;
}
function lightUp() {
  const rows = [...$('shaping').children, ...$('queue').children].filter(n => n.ticketId !== undefined);
  if (!rows.some(n => n.ticketId === hovered)) hovered = null; // it has left the page, with no mouseleave
  const group = hovered !== null && linked.get(hovered);
  const lit = group && group.length > 1 ? group : [];
  for (const n of rows) {
    const cls = n.className.replace(/ hl\b/g, '');
    n.className = lit.includes(n.ticketId) ? `${cls} hl` : cls;
  }
}
// 0154: each id in a "waiting on" or "unlocks" note is a button that scrolls its ticket into view and lights it for
// 1.5 seconds, when that ticket is on the page (in the queue, or a draft while Plan shows its tickets); otherwise plain text.
let onPage = new Set(); // the ids of the tickets on the page, from the last render
const FLASH_MS = 1500;
let flashId = null, flashes = 0; // the id lit by the latest tap on its id, until its time is up, and how many taps there have been
const noteIds = t => (t.chain ? t.unlocks : t.waiting_on); // the ids in its note
const shownLinks = t => noteIds(t).filter(id => onPage.has(String(id))); // the ones that are buttons
function idLinks(ids) {
  return ids.flatMap((id, i) => [i ? document.createTextNode(', ') : null, onPage.has(String(id)) ? gotoButton(String(id)) : document.createTextNode(String(id))].filter(Boolean));
}
function gotoButton(id) {
  const b = el('button', 'goto', null, el('span', null, id)); // the span: its text, above the other ids' tap areas (0164)
  b.type = 'button';
  b.setAttribute('aria-label', `Go to ticket ${id}`);
  // Stopped here, so it neither opens nor closes the ticket it's in.
  b.addEventListener('click', e => { e.stopPropagation(); goTo(id); });
  return b;
}
function goable(node, t) { node.gotoId = String(t.id); return node; }
const ticketRows = () => [...$('shaping').children, ...$('queue').children].filter(n => n.gotoId !== undefined);
function goTo(id) {
  const row = ticketRows().find(n => n.gotoId === id);
  if (!row) return;
  openTab(laneOf(row)); // 0410: the tab holding it opens first
  if (typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'center' });
  if (flashId === id) { flashId = null; flash(); void row.offsetWidth; } // lit already: start its fade again
  flashId = id;
  const mine = ++flashes;
  flash();
  setTimeout(() => { if (mine === flashes) { flashId = null; flash(); } }, FLASH_MS);
}
// Puts the class on the lit ticket's node, and on no other, so a node rebuilt by a refresh keeps it.
function flash() {
  for (const n of ticketRows()) {
    const cls = n.className.replace(/ flash\b/g, '');
    n.className = n.gotoId === flashId ? `${cls} flash` : cls;
  }
}
// Puts the nodes in the box in order, leaving in place any that are already there, so a node kept from the last
// render is never taken out of the page (a browser drops any text selected in a node it takes out).
function fill(id, nodes, emptyText) {
  const box = $(id), want = nodes.length ? nodes : [typeof emptyText === 'string' ? el('div', 'empty', emptyText) : emptyText];
  for (const c of [...box.children]) if (!want.includes(c)) box.removeChild(c);
  want.forEach((n, i) => { if (box.children[i] !== n) box.insertBefore(n, box.children[i] || null); });
}
// 0449: an empty Build lane says it's clear, when the last ticket shipped and how many shipped today (leaving those
// out with nothing shipped yet), and the next step: a button to Plan's drafts, or to talk to your agent with none.
function idleLane(m) {
  const last = m.shipped.find(t => t.end !== null) || null;
  const when = last ? el('div', 'idle-last', `Last shipped ${last.id} · ${shippedAgo(last.end, Date.now())}`) : null;
  idleClock(when, last);
  let next;
  if (m.drafts.length) {
    next = el('button', 'full-open go-plan', `Go to Plan · ${plural(m.drafts.length, 'draft')}`);
    next.type = 'button';
    next.addEventListener('click', () => {
      shapingView = 'tickets';
      openTab('plan');
      render();
      if ($('tab-plan').focus) $('tab-plan').focus();
    });
  } else next = el('div', 'idle-hint', 'Talk to your agent to capture an idea or make a ticket.');
  return el('div', 'empty idle', null, el('div', 'idle-head', 'Nothing building'), when,
    last ? el('div', 'idle-today', `${m.stats.today} shipped today`) : null, next);
}
// The last-shipped line's minutes move on between updates of the board, on a timer cleared once the line has gone.
const IDLE_MS = 30000;
let idleTimer = null;
function idleClock(node, t) {
  if (idleTimer !== null) { clearInterval(idleTimer); idleTimer = null; }
  if (node) idleTimer = setInterval(() => setText(node, `Last shipped ${t.id} · ${shippedAgo(t.end, Date.now())}`), IDLE_MS);
}
// The items built by the last render, for each box, by key ('t:<id>' or 'i:<path>' in Shaping, the id elsewhere), each
// with everything it shows. An item whose own data and view state are unchanged keeps its node, so text selected in it,
// and a box's scroll position, survive the refresh. What it shows from other items or the clock (`derived`) is put
// right with `update`, on the node it keeps.
const built = new Map();
// The same field values give the same signature, whatever order the fields come in, at every level.
const signature = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(f => [f, x[f]])) : x));
function keptItems(box, list, keyOf, viewOf, make, { own = x => x, derived = () => null, update = () => {} } = {}) {
  const before = built.get(box) || new Map(), now = new Map();
  const nodes = list.map(x => {
    const key = keyOf(x), sig = signature([own(x), viewOf(x)]), from = signature(derived(x)), last = before.get(key);
    if (now.has(key)) return make(x); // a repeated id or path: built afresh each time, as it can't share a node
    const kept = last && last.sig === sig, node = kept ? last.node : make(x);
    if (kept && last.from !== from) update(node, x);
    now.set(key, { sig, from, node });
    return node;
  });
  built.set(box, now);
  return nodes;
}

// 0410: Plan, Build and Shipped are tabs under the header, and only the open one's lane shows. Build opens with the
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
    openLane = lane;
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
  // While Build's tab is closed, it says how many things need you, as the Foreman's status does
  const needs = openLane === 'build' ? null : /^Needs you (\d+)$/.exec(foremanOf(state).word);
  // 0425: the number alone, so the tabs fit a third of a narrow pane; its accessible name says what it is
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
let state = null;
drawTabs();
function render() {
  if (!state) return;
  const m = panelModel(state);
  // A menu whose ticket isn't showing any more is closed, so it can't catch the next click.
  if (priorityMenu !== null && (shapingView !== 'tickets' || !m.drafts.some(t => String(t.id) === priorityMenu))) priorityMenu = null;
  shapingToggle(m);
  onPage = new Set([...(shapingView === 'tickets' ? m.drafts : []), ...m.queue].map(t => String(t.id)));
  // A refused stop's reason goes once its ticket has no Stop build button, so a later build of it doesn't show it.
  for (const id of stopRefused.keys()) if (!m.queue.some(t => String(t.id) === id && t.pausable)) stopRefused.delete(id);
  // The same for a refused Back to Plan once its ticket isn't ready in the queue.
  for (const id of planRefused.keys()) if (!m.queue.some(t => String(t.id) === id && !t.inFlight)) planRefused.delete(id);
  // 0284: and a refused Go with the recommendation once its ticket isn't blocked.
  for (const id of goWithRefused.keys()) if (!m.queue.some(t => String(t.id) === id && t.status === 'blocked')) goWithRefused.delete(id);
  // 0318: and what's kept for the Foreman's question once it's gone. A redraw that replaces the Answer box being typed
  // in puts the focus back in the new one, where it was.
  for (const ids of [askDrafts, askRefused]) for (const id of ids.keys()) if (!foremanAskOf(id)) ids.delete(id);
  const typing = typeof document.activeElement === 'object' && document.activeElement && document.activeElement.askKey ? document.activeElement : null;
  askBoxes.clear();
  if (shapingView === 'inbox') fill('shaping', keptItems('shaping', m.inbox, i => `n:${i.path}`, i => openInbox.has(i.path), inboxItem), 'Inbox is empty.');
  else if (shapingView === 'ideas') fill('shaping', keptItems('shaping', m.ideas, i => `i:${i.path}`, i => openIdeas.has(i.path), ideaItem), 'No ideas waiting.');
  else fill('shaping', keptItems('shaping', m.drafts, t => `t:${t.id}`,
    t => [open.has(t.id), settingReady.has(t.id), refused.get(t.id) ?? null, priorityMenu === String(t.id), priorityRefused.get(String(t.id)) ?? null], ticketItem,
    { own: ownData, derived: t => [t.chain, t.unlocks, shownLinks(t), depsSig(t)], update: newHead }), 'No draft tickets.');
  renderFull(m);

  // The counter comes from the clock, not the ticket, so it is put right on a kept row.
  // A log box is kept through the refresh while its ticket is unchanged, and each new log is put in it in place (showLog).
  const rows = keptItems('queue', m.queue, t => String(t.id), t => [openQueue.has(String(t.id)), shippingId === String(t.id), stopping.has(String(t.id)), stopRefused.get(String(t.id)) ?? null,
    unreadying.has(String(t.id)), planRefused.get(String(t.id)) ?? null, goingWith.has(String(t.id)), goWithRefused.get(String(t.id)) ?? null,
    foremanAskOf(t.id)?.question ?? null, askPending.get(String(t.id)) ?? null, askRefused.get(String(t.id)) ?? null], queueItem,
    { own: t => { const { counter, ship_counter, ...own } = ownData(t); return own; }, derived: t => [t.counter, t.chain, t.unlocks, shownLinks(t), depsSig(t)], update: queueUpdate });
  fill('queue', rows, m.queue.length ? '' : idleLane(m));
  if (m.queue.length) idleClock(null, null);
  const pt = paneTicket, paneSub = pt ? paneCounter() : null; // 0465: the pane's counter moves on too
  startCounters([...m.queue.flatMap((t, i) => (t.counter !== null && t.held_at === null && counterOf(rows[i]) ? [[counterOf(rows[i]), t.since, !!t.paused]] : [])),
    ...(paneSub && pt.counter !== null && pt.held_at === null ? [[paneSub, pt.since, !!pt.paused]] : [])]);
  for (const [box, top] of logScroll) box.scrollTop = top === null ? box.scrollHeight : top;
  logScroll.clear();
  queueIds = new Set(m.queue.map(t => String(t.id)));
  linked = new Map([...m.drafts, ...m.queue].map(t => [String(t.id), t.linked]));
  lightUp();
  flash();
  const flying = m.queue.filter(t => t.inFlight).length;
  // 0449: an empty lane says so in its message alone
  $('queue-n').textContent = m.queue.length ? `${flying} in flight · ${m.queue.length - flying} queued` : '';
  $('queue-n').hidden = !m.queue.length;

  // 0157: each shipped ticket is a card. 0420: its id and title, with a bug or fix tag after the title, then one line:
  // when it shipped (the time, or the day before today) and (0162) its figures, separated by " · ".
  // 0464: open, the line gives way to the step track and facts table an open ticket in flight has, every step done.
  // 0466: its top row opens and closes it, as a Build ticket's does, and open, Full ticket and Review pack are under it. The shipped time turns from the time alone to date and time after midnight, so
  // it is put right on a kept card.
  // In the line, a ticket shipped before today shows its day alone ("20 Oct"), so the line fits a 420 px pane; its
  // tooltip says when it shipped, with the time, and its figures.
  const day = shippedDay;
  const metaTip = (t, figs) => [t.end !== null ? `Shipped ${t.when}` : null, figs || null].filter(Boolean).join(' · ');
  for (const id of openShipped) if (!m.shipped.some(t => String(t.id) === id)) openShipped.delete(id);
  fill('shipped', keptItems('shipped', m.shipped, t => String(t.id), t => openShipped.has(String(t.id)), t => {
    const id = String(t.id), isOpen = openShipped.has(id);
    const line = [t.minutes !== null ? `${t.minutes} min` : null, t.roundCount > 0 ? plural(t.roundCount, 'round') : null,
      t.builderCost !== null ? dollars(t.builderCost) : null].filter(Boolean).join(' · ');
    const tags = [typeTag(t), taskTag(t)].filter(Boolean);
    const name = el('td', 'name', null, el('div', 'line', null, el('span', 'id', t.id), titled(shippedTitle(t, isOpen)), tags.length ? el('span', 'tags tag-row', null, ...tags) : null));
    const parts = [t.end !== null ? el('span', 'when', day(t.when)) : null, line ? el('span', 'figline', line) : null].filter(Boolean);
    // 0204: merged, but the push of the base branch failed: what speck ship said, which says how to fix it.
    const unpushed = t.unpushed ? el('td', 'unpushed', null, el('div', 'unpushed-head', 'Merged, but not pushed'), t.unpushed_message ? el('div', 'unpushed-said', t.unpushed_message) : null) : null;
    const meta = !isOpen && parts.length ? detailsLine('meta', parts) : null;
    if (meta) meta.title = metaTip(t, line);
    const under = isOpen ? el('td', 'full-cell', null, fullButton(t, 'shipped'), packButton(t)) : null;
    const tr = isOpen ? el('tr', 'open', null, name, el('td', 'steps', null, trackOf({ steps: shippedSteps(t) }), shippedFacts(t, day)), unpushed, under)
      : el('tr', null, null, name, meta ? el('td', 'sum', null, meta) : null, unpushed);
    // Only the top row opens and closes it, not the warning or buttons under it, and a click that ends selecting text in
    // it leaves it as it is, as in Build.
    tr.addEventListener('click', e => {
      if ([unpushed, under].some(n => n && within(e.target, n))) return;
      if (typeof getSelection !== 'function' || getSelection().isCollapsed !== false) toggleShipped(id);
    });
    return tr;
  }, { own: t => { const { when, ...own } = t; return own; }, derived: t => t.when, update: (tr, t) => {
    const meta = child(child(tr, 'sum') || tr, 'meta'), w = meta && child(meta, 'when');
    if (w) { setText(w, day(t.when)); meta.title = metaTip(t, child(meta, 'figline')?.textContent); }
    const facts = child(child(tr, 'steps') || tr, 'facts'), cell = facts && child(facts.children[0], 'value');
    if (cell && t.end !== null) { setText(cell.children[0], day(t.when)); cell.title = t.when; }
  } }), 'Nothing shipped yet.');
  // 0162: three stats, and More stats shows the other three. A stat over 9,999 is shortened as a card's figures are,
  // with the exact number as its tooltip. 0420: the three are one line, "24 today · median 10 min, $1.77", short enough
  // to fit beside More stats or Fewer stats in a 420 px pane, each saying what it is, and the tickets a median covers,
  // as its tooltip; the other three stay tiles.
  const num = (n, money = false) => {
    const exact = n === null ? '–' : money ? `$${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : n.toLocaleString('en-GB');
    const short = n === null ? null : shortened(n), b = el('b', 'num', short === null ? exact : `${money ? '$' : ''}${short}`);
    if (short !== null) b.title = exact;
    return b;
  };
  const stat = (n, label, s, money = false) => el('div', 'stat', null, num(n, money), el('span', 'label', label), s ? el('span', 'count', plural(s.count, 'ticket')) : null);
  const part = (tip, ...parts) => {
    const p = el('span', 'part', null, ...parts.map(x => typeof x === 'string' ? document.createTextNode(x) : x));
    p.title = tip;
    return p;
  };
  const tiles = (box, list) => { $(box).replaceChildren(...(m.shippedTotal ? list : [])); };
  const line = $('shipped-stats');
  line.replaceChildren();
  if (m.shippedTotal) {
    const { today, minutes, builderCost } = m.stats;
    line.appendChild(part('Tickets shipped today', num(today), ' today'));
    line.appendChild(el('span', 'sep', ' ·'));
    line.appendChild(document.createTextNode(' '));
    line.appendChild(part(`Median time to build, over ${plural(minutes.count, 'ticket')}`, 'median ', num(minutes.median), ' min'));
    line.appendChild(document.createTextNode(', '));
    line.appendChild(part(`Median builder cost, over ${plural(builderCost.count, 'ticket')}`, num(builderCost.median, true)));
  }
  tiles('shipped-more', [stat(m.stats.rounds.median, 'median review rounds', m.stats.rounds), stat(m.stats.tokens.median, 'median reviewer tokens', m.stats.tokens),
    stat(m.stats.builderTokens.median, 'median builder tokens', m.stats.builderTokens)]);
  $('shipped-stats').hidden = m.shippedTotal === 0;
  $('shipped-stats-line').hidden = m.shippedTotal === 0;
  $('shipped-more').hidden = m.shippedTotal === 0 || !moreStats;
  const more = $('more-stats');
  more.hidden = m.shippedTotal === 0;
  more.textContent = moreStats ? 'Fewer stats' : 'More stats';
  more.setAttribute('aria-expanded', String(moreStats));
  $('shipped-n').textContent = `${m.shippedTotal} in total`;

  // 0285: the Foreman, speck run's one status for the whole pipeline. Pressing it opens its detail. 0413: its word is
  // the top row of speck's screen, which is the button, and the frame's edge is in the needs-you colour while the word
  // is "Needs you <n>". The button stays put and only what the screen shows changes, so it keeps the focus.
  const f = foremanOf(state), stale = pageStale(state);
  const run = $('run'), word = stale ? 'Reload page' : f.word;
  noteBoard(state, f, word); // 0414
  drawScreen(word);
  $('bezel').className = NEEDS_YOU.test(word) ? 'bezel needs' : 'bezel';
  run.setAttribute('aria-label', `The Foreman: ${word}`); // 0451: Settings says whether fixing is on
  run.setAttribute('aria-expanded', String(foremanOpen));
  run.title = stale ? 'The panel is running newer code than this page shows: open to reload it' : 'The pipeline: speck run\'s log';
  renderForeman(stale);
  drawTabs(); // 0410: and Build's "<n> needs you"
  drawRunSwitch();
  const again = typing && typing.isConnected === false ? askBoxes.get(typing.askKey) : null; // 0318
  if (again && again !== typing) {
    again.focus();
    try { again.setSelectionRange(typing.selectionStart, typing.selectionEnd); } catch { /* nothing selected */ }
  }
  if (tipTag !== null && tipTag.isConnected === false) closeTip(); // 0165: its tag has left the page, so it goes too
  if (focusBack && fullId === null) returnFocus(); // 0326
}
// 0415: a click beside the Pipeline pop-up's column is a click outside it, as with Settings (0368).
let foremanDownBeside = false;
$('foreman').addEventListener('pointerdown', e => { foremanDownBeside = e.target === $('foreman') && besideColumn(e, $('foreman')); });
$('foreman').addEventListener('click', e => { if (foremanOpen && foremanDownBeside && e.target === $('foreman') && besideColumn(e, $('foreman'))) closeForeman(); });
$('run').addEventListener('click', e => {
  e.stopPropagation();
  if (foremanOpen) { closeForeman(); return; }
  foremanOpen = true;
  render();
});
// 0366: closes the Foreman's pop-up, with the focus back on speck's screen (0413), which opened it.
function closeForeman() {
  foremanOpen = false;
  render();
  const run = $('run');
  if (run.focus) run.focus();
}
// 0285: the Foreman's status and detail, as the server worked them out from speck run's own record. A server without
// it (older code) gets what the page can tell: on or off.
function foremanOf(st) {
  const f = st && st.foreman && typeof st.foreman === 'object' ? st.foreman : null;
  const on = !!(st && st.run && st.run.on), list = v => (Array.isArray(v) ? v : []);
  const tone = f && typeof f.tone === 'string' ? f.tone : on ? 'idle' : 'off';
  return { word: f && typeof f.word === 'string' ? f.word : on ? 'Idle' : 'Off', tone, on,
    building: list(f && f.building), ready: list(f && f.ready), held: list(f && f.held), ship: f && f.ship && typeof f.ship === 'object' ? f.ship : null, blocked: list(f && f.blocked),
    agent: f && f.agent && typeof f.agent === 'object' ? f.agent : null, // 0287: the Foreman agent's work
    fixing: f && typeof f.fixing === 'string' ? f.fixing : null, fixing_says: f && typeof f.fixing_says === 'string' ? f.fixing_says : '', took: list(f && f.took) }; // 0317
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
const draftText = t => JSON.stringify([t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes, t.priority, t.size, t.risk, t.task, t.type, t.after]);
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
// 0285: true when the server's code is newer than the code this page was sent with.
const pageStale = st => !!(st && typeof st.page === 'string' && st.page && st.page !== PAGE);
// 0366: the detail, in the pop-up over the whole panel that a document opens in (0362). Its top, with Close, is kept
// while it's open and only the detail under it is drawn again, so the focus stays in the pop-up through a refresh.
// While it's open the page behind is held (holdPage), so only the pop-up can be clicked, scrolled or reached with Tab.
// 0415: the Pipeline pop-up, with speck run's output as its Log section. 0458: the log is all it shows, apart from a
// stale page's Reload page button above it.
function renderForeman(stale) {
  const box = $('foreman'), was = !box.hidden && box.children.length > 0;
  box.hidden = !foremanOpen;
  holdPage(pageHeld());
  if (!foremanOpen) { box.replaceChildren(); return; }
  let body = was ? box.children[1] : null;
  if (!body) {
    const close = el('button', 'close', 'Close');
    close.type = 'button';
    close.addEventListener('click', e => { e.stopPropagation(); closeForeman(); });
    body = el('div', 'fm-body', null, el('div', 'fm-stale'), el('div', 'fm-log', null, el('h3', null, 'Log')));
    box.replaceChildren(el('div', 'top', null, el('span', 'title', 'Pipeline'), close), body);
    runLogShown = undefined; runLogDrawn = null;
  }
  const top = body.children[0];
  const lost = !stale && within(document.activeElement, top); // the Reload page button had the focus and goes
  top.hidden = !stale;
  if (!stale) top.replaceChildren();
  else if (!top.children.length) {
    const reload = el('button', 'reload', 'Reload page');
    reload.type = 'button';
    reload.id = 'foreman-reload';
    reload.addEventListener('click', () => location.reload());
    top.replaceChildren(el('p', 'stale', 'The panel is running newer code than this page shows. ', reload));
  }
  wantRunLog();
  drawRunLog();
  if (!was) box.scrollTop = 0;
  if ((!was || lost) && box.focus) box.focus({ preventScroll: true }); // into it, or back into it when what had it goes
}
// 0415: speck run's output, from run.log (0459: the newest line at the bottom). The board's run_log changes with each write to it, and
// while the pop-up is open the page asks for the log again (GET /api/run-log) each time it does, one request at a time.
// A board without run_log has no run.log. runLog is the last answer, for the run_log it was asked for (runLogFor),
// declared with foremanOpen.
function wantRunLog() {
  const stamp = state && typeof state.run_log === 'string' && state.run_log ? state.run_log : null;
  if (!foremanOpen || stamp === null || runLogAsking || stamp === runLogFor) return;
  runLogAsking = true;
  let got = false;
  fetch('/api/run-log', { cache: 'no-store' })
    .then(res => (res.ok ? res.json() : null))
    .then(body => { if (body && (body.lines === null || Array.isArray(body.lines))) { runLog = body.lines; runLogFor = stamp; got = true; } })
    .catch(() => { /* asked again at the next board or ping */ })
    // Once it has the log, it asks again at once if run_log changed meanwhile. One that failed waits for the next redraw.
    .finally(() => { runLogAsking = false; if (foremanOpen) { drawRunLog(); if (got) wantRunLog(); } });
}
function drawRunLog() {
  const box = $('foreman'), sec = !box.hidden && box.children[1] ? box.children[1].children[1] : null;
  if (!sec) return;
  const stamp = state && typeof state.run_log === 'string' && state.run_log ? state.run_log : null;
  const given = stamp === null ? null : runLogFor === null ? [] : runLog;
  const key = given === null ? null : given.join('\n');
  if (key === runLogShown) return;
  runLogShown = key;
  // 0459: the oldest line at the top and the newest at the bottom, in a box of its own that scrolls. The server gives
  // them newest first.
  const lines = given && given.slice().reverse().map(String), was = sec.children[1];
  if (!lines || !lines.length) {
    runLogDrawn = null;
    sec.replaceChildren(sec.children[0], el('div', 'run-log', null, el('p', 'none', lines && runLogFor === null ? 'Reading speck run\'s log…' : 'speck run hasn\'t written anything yet.')));
    return;
  }
  const list = was && /^ol$/i.test(was.tagName || '') && Array.isArray(runLogDrawn) ? was : el('ol', 'run-log');
  // A box at its bottom, or just drawn, shows the new lines. A reader scrolled up stays where they are: the first line
  // they can see is found again, past the lines that dropped out at the top, and the box scrolled so it's where it was.
  const follow = list !== was || atBottom(list), rect = n => (n && typeof n.getBoundingClientRect === 'function' ? n.getBoundingClientRect() : null);
  let anchor = null;
  if (!follow && rect(list)) {
    const seen = Array.from(list.children).findIndex(li => rect(li) && rect(li).bottom > rect(list).top);
    const d = seen < 0 ? null : runLogDropped(runLogDrawn, lines);
    if (d !== null && seen - d >= 0 && seen - d < lines.length) anchor = { at: seen - d, top: rect(list.children[seen]).top };
  }
  runLogDrawn = lines;
  list.replaceChildren(...lines.map(runLogRow));
  if (list !== was) sec.replaceChildren(sec.children[0], list);
  const again = anchor && rect(list.children[anchor.at]);
  if (follow) list.scrollTop = list.scrollHeight;
  else if (again) list.scrollTop += again.top - anchor.top;
}
// 0459: a line of the log, laid out as a build log's line (0422): its time, then its summary (runLogLine).
function runLogRow(line) {
  const p = runLogLine(line);
  return el('li', `ln ${p.kind}${p.at ? ' timed' : ''}`, null, p.at ? el('span', 'at', p.at) : null, document.createTextNode(p.text));
}
// How many lines dropped out at the top of the log as drawn (was) to make it now: the fewest d for which was, from line
// d on, is how now starts, or null when it isn't at any d, as when speck run's log was started afresh.
function runLogDropped(was, now) {
  for (let d = 0; d < was.length; d++) {
    if (was.length - d > now.length) continue;
    let same = true;
    for (let j = 0; same && d + j < was.length; j++) same = now[j] === was[d + j];
    if (same) return d;
  }
  return null;
}
// 0285: the speck run switch, working as the header's did (0150): a press turns speck run off or on. 0396: Auto-build's
// switch, at the top of Settings.
const runSwitchButton = toggleSwitch('run-switch', 'Auto-build');
runSwitchButton.addEventListener('click', e => {
  e.stopPropagation();
  if (state && !runSwitchButton.disabled) switchRun(state.run && state.run.on ? 'off' : 'on');
});
function drawRunSwitch() {
  const on = !!(state && state.run && state.run.on);
  runSwitchButton.className = `run-switch ${on ? 'run-on' : 'run-off'}`;
  drawToggle(runSwitchButton, on, runSwitching ? (runSwitching === 'on' ? 'Starting…' : 'Pausing…') : on ? 'On' : 'Off');
  runSwitchButton.disabled = !!runSwitching || !state;
  runSwitchButton.title = on ? 'Pause Auto-build: ready tickets wait' : 'Start Auto-build: build ready tickets';
}
// 0368: Settings covers the strip under the header, so a refusal shows beside the switch too, kept between redraws.
const runSwitchSaid = el('p', 'bad');
runSwitchSaid.hidden = true;
function foremanGroup(rows = []) {
  return el('section', 'sgroup', null, el('div', 'sh', null, el('h4', null, 'Foreman')), ...rows);
}
// 0128: the speck run switch. The server starts or stops speck run and answers once it's on or off, so the button shows
// that at once. A refusal shows speck run's own message under the header until the next click on the switch.
async function switchRun(to) {
  if (runSwitching) return;
  runSwitching = to;
  showRunError(null);
  render();
  try {
    const res = await fetch(`/api/run/${to}`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    if (res.ok && body && body.run) {
      if (body.run.on) state.run = body.run;
      else delete state.run;
      have = null; // the page's board now differs from the one the panel numbered, so the next one comes whole (0188)
    } else showRunError(body && typeof body.error === 'string' && body.error ? body.error : `The server refused (${res.status}).`);
  } catch {
    showRunError(`Couldn't reach the panel server, so speck run wasn't turned ${to}.`);
  }
  runSwitching = null;
  render();
}
function showRunError(text) {
  $('run-error').hidden = !text;
  $('run-error').textContent = text || '';
  runSwitchSaid.hidden = !text;
  runSwitchSaid.textContent = text || '';
}
let offline = false; // whether the page says it's disconnected, or can't read the tickets (0186)
function setConnected(ok, problem) {
  offline = !ok;
  $('offline').hidden = ok;
  if (!ok) $('offline').textContent = problem
    ? `speck panel couldn't read the tickets: ${problem} Showing the last state received until it can read them again.`
    : "Disconnected: can't reach speck panel. Showing the last state received. Reconnecting…";
  if (state) render();
}

// speck panel restarts by itself when its code changes. When the new code fails to start, the old server keeps serving
// and says so in restart_error, until a later change starts.
function showRestartError(line) {
  $('restart').hidden = !line;
  $('restart').textContent = line ? `speck panel couldn't restart with its changed code: ${line} It's still running the code it had, and tries again on the next change.` : '';
}

// 0187: the panel tells the page each time the board changes, over one event stream, and the page then asks for that
// board. Nothing asks on a timer: while nothing changes, the stream carries only a keep-alive (ping), on which the page
// redraws what it works out from the clock. One request for the board waits at a time, for up to WAIT_MS, and a board
// announced meanwhile is asked for once it's answered (0186); one that fails is asked again at the next ping. A dropped
// stream reconnects by itself, and the panel tells the page of its board as soon as it's back, so "Disconnected" shows
// only if it stays gone for LOST_MS. Coming back to the page, as a phone does when it wakes, starts a new stream at once,
// in case the old one died unnoticed.
// 0186: a slow or failed answer for the board shows nothing either, until the page has gone LOST_MS without a board
// since it asked (slow), and the notice goes with the next board that arrives.
// 0188: the page says which board it has (have, as the panel numbered it), and the panel answers with only what changed
// since (applyDelta), or with the whole board. A new stream, or an update the page can't apply, gets the whole board.
let pending = null, source = null, lost = null, retry = null; // retry: the board a failed request asked for
let have = null, want = null, slow = null, problem = null; // want: the latest board announced while a request waited
function applyDelta(old, d) {
  if (!old || !d || d.from !== have || !Array.isArray(d.keys) || !d.set || !d.lists) return null;
  const next = [];
  for (const name of d.keys) {
    if (Object.hasOwn(d.set, name)) { next.push([name, d.set[name]]); continue; }
    const l = Object.hasOwn(d.lists, name) ? d.lists[name] : null;
    if (!l) { if (!Object.hasOwn(old, name)) return null; next.push([name, old[name]]); continue; }
    if (!Array.isArray(old[name]) || !Array.isArray(l.put) || !Array.isArray(l.drop)) return null;
    const keyOf = x => String(x[l.by]), items = new Map(old[name].map(x => [keyOf(x), x])), added = [];
    for (const k of l.drop) items.delete(k);
    for (const x of l.put) { if (!items.has(keyOf(x))) added.push(keyOf(x)); items.set(keyOf(x), x); }
    if (!Array.isArray(l.moves) || !l.moves.every(m => Array.isArray(m) && m.length === 2)) return null;
    const moving = new Set(l.moves.map(m => m[0])), order = [...old[name].map(keyOf).filter(k => items.has(k)), ...added].filter(k => !moving.has(k));
    for (const [k, after] of l.moves) { const i = after === null ? 0 : order.indexOf(after) + 1; if (after !== null && !i) return null; order.splice(i, 0, k); }
    if (order.length !== items.size || new Set(order).size !== order.length || order.some(k => !items.has(k))) return null;
    next.push([name, order.map(k => items.get(k))]);
  }
  return Object.fromEntries(next);
}
async function load(version) {
  if (pending) { want = version; return; }
  retry = null; want = null; problem = null;
  const ctl = new AbortController(), giveUp = setTimeout(() => ctl.abort(), WAIT_MS);
  pending = ctl;
  if (slow === null) slow = setTimeout(() => { slow = null; setConnected(false, problem); }, LOST_MS);
  let again = null;
  try {
    const res = await fetch('/api/state', { cache: 'no-store', signal: ctl.signal, headers: { 'X-Speck-Board': String(version), ...(have ? { 'X-Speck-Have': have } : {}) } });
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    let now = res.headers && typeof res.headers.get === 'function' ? res.headers.get('X-Speck-Board') : null;
    if (res.ok && body && body.delta) {
      const next = applyDelta(state, body.delta);
      if (!next) { have = null; again = version; return; }
      now = body.delta.to;
      body = next;
    }
    if (!res.ok || !body || !Array.isArray(body.tickets)) {
      failed((body && body.error) || `the server answered ${res.status}.`);
      // A board the panel couldn't read is announced again once it can; any other failure asks again at the next ping.
      if (!(body && body.error)) retry = version;
    } else {
      state = body; have = now; showRestartError(body.restart_error);
      if (slow !== null) { clearTimeout(slow); slow = null; }
      setConnected(true);
    }
  } catch (e) {
    failed(null); retry = version;
  } finally {
    clearTimeout(giveUp);
    pending = null;
    if (want !== null) load(want);
    else if (again !== null) load(again);
  }
}
// A request for the board that failed: the notice says why once LOST_MS has passed without a board (slow has gone off),
// or at once when it already shows.
function failed(why) {
  problem = why;
  if (slow === null || offline) setConnected(false, why);
}
function heard() {
  if (lost !== null) { clearTimeout(lost); lost = null; }
}
function connect() {
  if (source) source.close();
  have = null; // it may have missed boards while it had no stream, so the next one comes whole
  streamName = null;
  const s = source = new EventSource('/api/events');
  s.addEventListener('open', () => { if (source === s) have = null; }); // and so may one the browser has reconnected
  s.addEventListener('message', e => { if (source === s) { heard(); load(e.data); } });
  // 0189: each stream, the browser's reconnections included, is named first, and the open logs are opened on it.
  s.addEventListener('stream', e => {
    if (source !== s) return;
    streamName = /^[0-9a-f]{32}$/.test(e.data) ? e.data : null;
    for (const id of openQueue) if (queueIds.has(id)) loadLog(id);
  });
  s.addEventListener('log', e => { if (source !== s) return; let u = null; try { u = JSON.parse(e.data); } catch { /* not an update */ } logUpdate(u); });
  s.addEventListener('ping', () => {
    if (source !== s) return;
    heard();
    if (retry !== null) load(retry); else if (state) render();
    for (const id of logRetry) if (openQueue.has(id) && queueIds.has(id)) loadLog(id);
  });
  s.addEventListener('error', () => {
    if (source !== s) return;
    streamName = null; // its logs closed with it
    if (lost === null) lost = setTimeout(() => { lost = null; setConnected(false); }, LOST_MS);
    // A stream the browser won't try again by itself, such as one answered with an error, the page starts again.
    if (s.readyState === 2) setTimeout(() => { if (source === s) connect(); }, RETRY_MS);
  });
}

// 0432, 0433: the page starts once the whole page has loaded, after the Settings script it loads from /panel-settings.js
// has run, so nothing it hears first finds Settings missing.
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('visibilitychange', () => { const on = document.visibilityState === 'visible'; speckShown(on); if (on) connect(); });
  connect();
});
