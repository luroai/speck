'use strict';
// 0473: the panel's pop-ups, which the page loads from /panel-popups.js after its own script and before Settings: the full
// ticket in the side pane, with a review pack, a task's file in a pop-up and the Pipeline log. They open, draw, update and
// close using the page's helpers, such as el and $, and the page's render draws them (renderFull, renderForeman).
// What the pop-ups show, and the requests they make, kept between redraws.
let fullId = null; // the id of the ticket in the side pane, or null
let fullFrom = null; // 0326: { id, list } of the Full ticket button that opened the pane, or null when something else did
let focusBack = false; // 0326: the pane has closed, so the next render puts the focus back
let foremanOpen = false; // 0285: whether the Foreman's detail is open
let decidedOpen = false, decidedBuilt = null; // 0568: whether the Decided for you list is open, and what it was last drawn from
let runLog = null, runLogFor = null, runLogAsking = false, runLogShown, runLogDrawn = null; // 0415: runLogShown: the log's lines as drawn (runLogDrawn), joined, undefined when not drawn
let buildLogOf = null; // 0548: the id of the ticket whose build log the Pipeline log's pop-up shows instead, or null
let buildLogShown, buildLogDrawn = null, buildLogBuild = null; // 0548: as runLogShown and runLogDrawn, and the build they're from
let packOf = null; // while the side pane shows a review pack instead: { id, state: 'loading' | 'ok' | 'none' | 'error', text }
let shippingId = null; // the id whose Ship request hasn't been answered yet: one ship at a time
const shipped = new Map(); // id → what speck ship printed when the panel shipped it
const shipRefused = new Map(); // id → why speck ship refused it, until the next click on its Ship button or the pack is opened again
const changesNotes = new Map(); // 0357: id → the note in its pack's box, kept while the pane is redrawn and after a refusal
let changesSending = null; // the id whose Ask for changes request hasn't been answered yet
const changesSaid = new Map(); // id → what speck changes printed when the panel sent its note
const changesRefused = new Map(); // id → why speck changes refused it, until its next Ask for changes
const changesOpen = new Set(); // 0583: ids whose note box is unfolded in the full view's bar
let packFromFull = false; // 0583: the review pack showing was opened from the full view, so closing it goes back there
let liveBox = null, liveBuilt = null, liveSub = null; // 0584: the full view's live section, the signature of what it shows, and its counter
let liveLogOf = null; // 0584: the id of the ticket whose log the full view is following, or null
let logFromRow = false; // 0584: the build log's pop-up was opened by the full view's Build log row
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
function openFull(t, from = null) {
  fullId = String(t.id);
  packOf = null;
  fullFrom = from;
  clearSaid(fullId); // 0583: its bar starts afresh, as the pack does
  changesOpen.delete(fullId);
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
    openPack(t.id);
  });
  return b;
}
function openPack(id) {
  fullId = String(id);
  fullFrom = null;
  packOf = { id: fullId, state: 'loading' };
  packFromFull = false;
  clearSaid(fullId);
  for (const k of packFolders) if (k.startsWith(`${fullId}/`)) packFolders.delete(k); // 0562: its folders fold again
  render();
  const pane = $('full-ticket');
  if (pane.focus) pane.focus({ preventScroll: true }); // so the keys scroll the pane, and none reach the page behind
  loadPack(fullId);
}
// What speck ship or speck changes last said about it. 0357: the box comes back, holding any note that wasn't sent.
function clearSaid(id) { shipRefused.delete(id); shipped.delete(id); changesSaid.delete(id); changesRefused.delete(id); }
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
// 0354: a task's files the server listed with the pack, each with its path from the project root, served by the panel.
const packDocuments = list => (Array.isArray(list) ? list : []).filter(d => d && typeof d.path === 'string' && typeof d.url === 'string' && /^\/api\/tickets\/\d+\/output\/./.test(d.url));
const isMarkdown = d => /\.(md|markdown)$/i.test(d.path);
// 0359: each file as a button at the top of the pack. A button has no address, so a browser that opens links itself has
// nothing to open: pressing a Markdown file shows it formatted in a pop-up over the whole panel (0362), and any other
// opens in a new tab, served by the panel.
// 0561: the task's summary, marked by the server, is labelled Start here.
// 0562: each file is named from inside the output folder, with its path from the project root as its tooltip, and each
// folder directly inside it is one row, folded at first, unfolding to a button for each file it holds however deep.
const packFolders = new Set(); // 0562: `<id>/<folder>` for each folder unfolded in a review pack, until the pack is opened again
// A file's path inside the output folder, from the address the panel serves it at.
function insidePath(d) {
  const rel = d.url.replace(/^\/api\/tickets\/\d+\/output\//, '');
  try { return rel.split('/').map(decodeURIComponent).join('/'); } catch { return rel; }
}
function documentButton(d, label) {
  const b = el('button', 'pack-document', d.summary === true ? 'Start here' : label);
  b.type = 'button';
  b.title = d.path;
  b.docOf = d.path; // 0362: so the focus can come back to it, or to the button drawn in its place
  b.addEventListener('click', e => { e.stopPropagation(); if (isMarkdown(d)) openDocument(d); else window.open(d.url, '_blank', 'noopener'); });
  return b;
}
function documentsPart(documents) {
  const rows = [], folders = new Map();
  for (const d of documents) {
    const rel = insidePath(d), cut = d.summary === true ? -1 : rel.indexOf('/');
    if (cut < 0) { rows.push(documentButton(d, rel)); continue; }
    const name = rel.slice(0, cut);
    if (!folders.has(name)) { const f = []; folders.set(name, f); rows.push(f); }
    folders.get(name).push([d, rel.slice(cut + 1)]);
  }
  for (const [name, files] of folders) rows[rows.indexOf(files)] = folderRow(name, files);
  return [el('div', 'pack-documents', null, ...rows)];
}
// A folder's row: a button saying how many files it holds, and under it, while it's unfolded, a button for each. Pressing
// it folds or unfolds it in place, so the pack around it keeps its nodes, and the focus stays on it.
function folderRow(name, files) {
  const key = `${packOf?.id}/${name}`;
  const b = el('button', 'pack-folder', `${name}/ · ${files.length} ${files.length === 1 ? 'file' : 'files'}`);
  b.type = 'button';
  const row = el('div', 'pack-folder-row', null, b);
  const show = open => {
    b.setAttribute('aria-expanded', String(open));
    if (row.children.length > 1) row.removeChild(row.children[1]);
    if (open) row.appendChild(el('div', 'pack-folder-files', null, ...files.map(([d, inside]) => documentButton(d, inside))));
  };
  b.addEventListener('click', e => {
    e.stopPropagation();
    const open = !packFolders.has(key);
    if (open) packFolders.add(key); else packFolders.delete(key);
    show(open);
  });
  show(packFolders.has(key));
  return row;
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
  // 0359: a task's files go at the top, above Ship. 0561: when it has a summary, only the summary goes above Ship, and
  // the other files straight after it.
  const docs = packOf.state === 'ok' ? packOf.documents : [], summary = docs[0]?.summary === true ? docs.slice(0, 1) : [];
  const rest = docs.slice(summary.length), files = rest.length ? documentsPart(rest) : [];
  const top = el('div', 'top', null, el('span', 'id', t.id), el('span', 'title', 'Review pack'), close);
  return summary.length ? [top, ...documentsPart(summary), ...shipPart(t), ...files, body] : [top, ...files, ...shipPart(t), body];
}
// 0133: an approved ticket's pack has a Ship button, above the pack. Clicking it is the user shipping (Gate 2), as
// /speck-ship is: the server runs speck ship for it. Under it, that it's shipping, what speck ship said, or why it refused.
// That it's shipping, and what speck ship said, show whatever the ticket's status: speck ship sets it done before it
// pushes, so an update can show it done while the push is still going, or after a push that failed.
function shipPart(t, inBar = false) { // 0583: inBar: for the full view's bar, which opens no pack first and folds the note's box
  const id = String(t.id), pending = shippingId === id || t.shipping === true, out = [];
  if (shipped.has(id)) return [el('div', 'ship-said', shipped.get(id))];
  out.push(...prPart(t)); // 0295
  if (pending || (t.status === 'approved' && (inBar || packOf.state === 'ok'))) {
    const b = el('button', 'ship', pending ? 'Shipping…' : 'Ship');
    b.type = 'button';
    b.disabled = shippingId !== null || t.shipping === true || changesSending === id; // one ship at a time, and none while one runs from elsewhere (0153)
    b.title = 'Merge this ticket into the base branch and push it, as /speck-ship does';
    b.addEventListener('click', e => { e.stopPropagation(); if (!b.disabled) shipTicket(id); });
    // 0357: and, until it's shipping or its note has gone, a box for a note and an Ask for changes button beside Ship.
    const asking = !pending && t.status === 'approved' && !changesSaid.has(id);
    out.push(asking ? el('div', 'pack-actions', null, ...changesPart(id, b, inBar)) : b);
  }
  if (pending) out.push(el('div', 'ship-said', `Shipping ${id}: running the tests, then merging and pushing. This can take a few minutes.`));
  if (shipRefused.has(id)) out.push(el('div', 'ship-said bad', shipRefused.get(id)));
  if (changesSaid.has(id)) out.push(el('div', 'ship-said', changesSaid.get(id)));
  if (changesRefused.has(id)) out.push(el('div', 'ship-said bad', changesRefused.get(id)));
  return out;
}
// 0357: the note's box, and a row of the Ship button `ship` and Ask for changes, which can't be pressed while the box is
// empty or only spaces. Typing changes only the button, so the pane isn't redrawn under it.
// 0583: `fold`: in the full view's bar the box starts folded, Ask for changes comes first and Ship last in the accent,
// and pressing Ask for changes with no note unfolds or folds the box.
function changesPart(id, ship, fold = false) {
  const box = el('textarea', 'changes-note'), sending = changesSending === id;
  box.value = changesNotes.get(id) || '';
  box.placeholder = 'What you want changed';
  box.rows = 2;
  box.disabled = sending;
  box.setAttribute('aria-label', `What you want changed in ${id}`);
  const b = el('button', 'ask-changes', sending ? 'Sending…' : 'Ask for changes');
  b.type = 'button';
  b.title = 'Send your note back to the build, as speck changes does: the ticket is built and reviewed again before it ships';
  const noted = () => String(box.value ?? '').trim() !== '';
  const can = () => !sending && changesSending === null && shippingId === null && (fold || noted());
  b.disabled = !can();
  box.hidden = fold && !changesOpen.has(id);
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
  b.addEventListener('click', e => {
    e.stopPropagation();
    if (!can()) return;
    if (!fold || (changesOpen.has(id) && noted())) { askForChanges(id); return; }
    if (changesOpen.has(id)) changesOpen.delete(id); else changesOpen.add(id);
    box.hidden = !changesOpen.has(id);
    if (!box.hidden && box.focus) box.focus();
  });
  return [box, el('div', 'pack-buttons', null, ...(fold ? [b, ship] : [ship, b]))];
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
    if (res.ok) { changesNotes.delete(id); changesOpen.delete(id); changesSaid.set(id, body && typeof body.message === 'string' && body.message ? body.message : `Your note was sent back to ${id}'s build.`); }
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
// The side pane (0583): a back link to the lane it came from, its id, a status pill and its title; then its step track and
// facts; then, for a draft, its readiness list and buttons as in the list, without Full ticket; then its outcome, its
// criteria with a tick on each one the reviewer passed, rows that open its review pack and build log, and its other
// sections that have something in them, their Markdown formatted; then, for an approved ticket, the bar with its actions.
// 0584: a ticket in the Build lane has its live section under its track and facts.
function fullTicket(t, draft, steps, barShown) {
  const lane = LANE_OF[backList()], back = el('span', 'close', lane);
  back.tabIndex = 0;
  back.setAttribute('role', 'link');
  back.setAttribute('aria-label', `Back to ${lane}`);
  back.addEventListener('click', closeFull);
  back.addEventListener('keydown', pressWithKeys);
  const body = el('div', null, null, draft ? paneReadiness(t) : null);
  liveBox = liveShows(t) ? liveSection(t) : null;
  if (liveBox) steps.appendChild(liveBox); // 0584
  mdPart(body, 'Outcome', t.outcome);
  const criteria = list(t.acceptance_criteria), passed = new Set(list(t.criteria_passed));
  if (criteria.length) {
    const ol = el('ol', 'criteria');
    criteria.forEach((c, i) => {
      const [first, ...rest] = markdown(c);
      // A criterion's first paragraph sits in its numbered item, not in a paragraph of its own.
      const lead = first && first.type === 'paragraph' ? mdInline(first.inline) : first ? mdBlocks([first]) : [];
      ol.appendChild(el('li', null, null, passed.has(i + 1) ? tick() : null, ...lead, ...mdBlocks(rest)));
    });
    body.appendChild(el('h4', null, 'Acceptance criteria'));
    body.appendChild(ol);
  }
  const rows = paneRows(t);
  if (rows) body.appendChild(rows);
  mdPart(body, 'Problem', t.problem);
  mdPart(body, 'Out of scope', t.out_of_scope);
  mdPart(body, 'Notes', t.notes);
  // 0424: its id and status beside its title. They're laid out by the stylesheet.
  const pill = el('span', 'state', String(t.status ?? ''));
  setTone(pill, paneTone(t));
  return [el('div', 'top', null, el('span', 'id', t.id), pill, back, el('span', 'title', t.title)), steps, body, barShown ? shipBar(t) : null].filter(Boolean);
}
const LANE_OF = { shaping: 'Plan', queue: 'Build', shipped: 'Shipped' };
// The list the back link returns to: the one its Full ticket button is in, or the one the ticket is in now.
const backList = () => (fullFrom && LANE_OF[fullFrom.list] ? fullFrom.list : paneFrom === 'draft' ? 'shaping' : paneFrom);
function tick() {
  const n = el('span', 'tick');
  n.setAttribute('role', 'img');
  n.setAttribute('aria-label', 'Passed by the reviewer');
  return n;
}
const setTone = (pill, tone) => pill.setAttribute('data-tone', tone);
// 0583: the pill's colour: 'waits' when it waits for you, 'working' while it's being worked on, otherwise nothing.
function paneTone(t) {
  if (paneFrom === 'draft') return 'waits';
  if (paneFrom === 'shipped' || !t.inFlight) return '';
  const d = doing(t, t.shipping || shippingId === String(t.id), speckCalled());
  if (d.moving) return 'working';
  return d.tone === 'to-ship' || (d.tone === 'bad' && t.foreman_will !== true) ? 'waits' : '';
}
// 0583: its four bars, each 'done', 'now' (filled, where it is), 'waits' (filled in orange: it waits for you there) or empty.
const PANE_STEPS = ['Ready', 'Built', 'Reviewed', 'Ship'];
function paneTrack(t, tone) {
  const now = t.inFlight ? (Array.isArray(t.steps) ? t.steps : []).findIndex(s => s.state === 'now') : -1;
  const at = paneFrom === 'shipped' ? 4 : paneFrom === 'draft' ? 0 : !t.inFlight ? -1 : now < 2 ? 1 : now === 2 ? 2 : 3;
  const reached = at === -1 ? 1 : at; // queued: Ready is done, and nothing is current
  return el('div', 'track', null, ...PANE_STEPS.map((label, i) => {
    const state = i < reached ? 'done' : i === at ? (tone === 'waits' ? 'waits' : 'now') : '';
    const n = el('span', `step${state ? ` ${state}` : ''}`, label);
    n.title = state === 'waits' ? `${label}: waiting for you` : label;
    return n;
  }));
}
// 0583: its facts, two to a row. A value that's too long wraps, so nothing is cut short on a phone.
function paneFacts(t) {
  const priority = t.priority !== undefined && t.priority !== null && t.priority !== '' ? `P${t.priority}` : '–';
  const why = typeof t.auto_ship_why === 'string' ? t.auto_ship_why.trim() : '';
  const ships = t.auto_ship === true ? (t.run_waiting ? 'No · Auto-build is off' : 'Yes') : t.auto_ship === false ? (why ? `No · ${why}` : 'No') : '–';
  const named = s => (typeof s === 'string' && s.trim() ? `${s.trim()[0].toUpperCase()}${s.trim().slice(1)}` : '');
  const name = named(t.reviewer), model = typeof t.review_model === 'string' && t.review_model.trim() ? t.review_model.trim() : typeof t.reviewer_model === 'string' ? t.reviewer_model.trim() : '';
  return el('dl', 'facts', null, factCell('Priority', priority, null), factCell('Size', t.size ? String(t.size) : '–', null), factCell('Risk', t.risk ? String(t.risk) : '–', null),
    factCell('Ships by itself', ships, null), factCell('Builder', workerOf(t, { round: null }).value, null), factCell('Reviewer', name ? `${name}${model ? ` · ${model}` : ''}` : '–', null));
}
// 0583: the rows that open what it has so far: a review pack once a round has run or it waits to ship, and a build log once its build has started.
const hasPack = t => list(t.rounds).length > 0 || t.roundCount > 0 || t.status === 'approved' || t.shipping === true || t.doc_finished === true;
const hasLog = t => paneFrom === 'shipped' || t.inFlight === true;
function paneRows(t) {
  const row = (label, go) => { const b = el('button', 'pane-row', label); b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); go(); }); return b; };
  const pack = hasPack(t) ? row('Review pack', () => { const from = fullFrom; openPack(t.id); fullFrom = from; packFromFull = true; }) : null;
  const log = hasLog(t) ? row('Build log', () => openLogFromPane(String(t.id))) : null;
  if (log) log.buildLogOf = String(t.id); // so the focus can come back to it
  return pack || log ? el('div', 'pane-rows', null, pack, log) : null;
}
// Opens its build log's pop-up. With its card closed, nothing has loaded its log yet.
function openLogFromPane(id) {
  buildLogOf = id;
  logFromRow = true;
  if (!openQueue.has(id) && liveLogOf !== id) loadLog(id);
  render();
}
// 0584: the full view's live section, for a ticket in the Build lane: what its open card says about a running or stopped
// build, or only the Foreman's question on one that hasn't started. It has the card's class, so it has the card's styles. Its
// log is kept while the rest is drawn again.
const liveShows = t => paneFrom === 'queue' && !packOf && (t.inFlight === true || !!foremanAskOf(t.id));
function liveSig(t) {
  if (!t || !liveShows(t)) return null;
  const id = String(t.id), { counter, ship_counter, ...own } = ownData(t);
  return signature([id, own, t.counter !== null, stopping.has(id), stopRefused.get(id) ?? null, goingWith.has(id), goWithRefused.get(id) ?? null, foremanAskOf(id)?.question ?? null,
    askPending.get(id) ?? null, askRefused.get(id) ?? null, speckCalled(), shippingId === id]);
}
// Where it is, in the sentence its card says it in, its step's name, and how long it has been going.
function liveNow(t, d) {
  const tone = d.tone ? ` ${d.tone}` : '', now = t.steps.find(s => s.state === 'now'), counter = queueCounter(t);
  const line = detailsLine('live-now', [el('span', `say${tone}`, d.sentence),
    d.sentence === 'Shipping' ? null : d.round !== null && d.round !== undefined ? el('span', `stage${tone}`, `Review ${d.round}`) : now ? el('span', `stage${tone}`, now.label) : null,
    counter ? el('span', 'sub', counter) : null]);
  return line;
}
function liveParts(t) {
  const id = String(t.id);
  if (!t.inFlight) return [foremanAskBox(id, foremanAskOf(id).question, 'pane')];
  return [liveNow(t, doing(t, t.shipping || shippingId === id, speckCalled())), ...buildNotes(t, 'pane'),
    el('div', 'live-buttons', null, buildLogButton(id), t.pausable ? stopButton(t) : null),
    t.pausable && stopRefused.has(id) ? el('div', 'stop-refused', stopRefused.get(id)) : null].filter(Boolean);
}
const liveCounterIn = parts => (parts[0] && parts[0].className === 'live-now' ? child(parts[0], 'sub') || null : null);
function liveSection(t) {
  const parts = liveParts(t);
  liveSub = liveCounterIn(parts);
  return el('div', 'q live', null, el('div', 'live-state', null, ...parts), t.inFlight ? logBox(String(t.id), paneKey(t.id)) : null);
}
// Draws it again in place, leaving its log box as it is unless the ticket no longer has a log or has just got one.
function drawLive(t) {
  const state = liveBox.children[0], parts = liveParts(t), pane = $('full-ticket');
  const focused = within(document.activeElement, state);
  state.replaceChildren(...parts);
  liveSub = liveCounterIn(parts);
  const log = child(liveBox, 'log');
  if (t.inFlight && !log) liveBox.appendChild(logBox(String(t.id), paneKey(t.id)));
  if (!t.inFlight && log) { liveBox.removeChild(log); logBoxes.delete(paneKey(t.id)); }
  if (focused && pane.focus) pane.focus({ preventScroll: true }); // so the keys still scroll the pane
}
// The track and facts have been drawn again, so it moves under the new ones, with its log's place and the focus kept.
function moveLive(steps) {
  const log = child(liveBox, 'log'), active = document.activeElement, inside = within(active, liveBox);
  if (log) logScroll.set(log, atBottom(log) ? null : log.scrollTop);
  steps.appendChild(liveBox);
  if (inside && active.focus) active.focus({ preventScroll: true });
}
// Follows the log of the ticket the live section shows, and stops following one it no longer shows.
function followLive(t) {
  const id = t && liveShows(t) && t.inFlight ? String(t.id) : null;
  if (id === liveLogOf) return;
  const was = liveLogOf;
  liveLogOf = id;
  if (was !== null) { logBoxes.delete(paneKey(was)); if (!logWanted(was)) closeLog(was); }
  if (id !== null && !openQueue.has(id) && buildLogOf !== id) loadLog(id);
}
// The live section's counter, for the page's clock, as a card's is.
const liveCounters = () => (liveSub && paneTicket && paneTicket.counter !== null && paneTicket.held_at === null ? [[liveSub, paneTicket.since, !!paneTicket.paused]] : []);
// 0583: the bar fixed to the bottom of an approved ticket's full view: Ask for changes and Ship, then what they said.
const barShows = t => t.status === 'approved' || t.shipping === true || shippingId === String(t.id) || shipped.has(String(t.id));
const shipBar = t => el('div', 'ship-bar', null, ...shipPart(t, true));
// 0465, 0583: the track and facts, by the list the ticket is in, and (0467) its dependency box.
function paneSteps(t) {
  return el('div', 'steps', null, paneTrack(t, paneTone(t)), paneFacts(t), paneFrom === 'shipped' ? null : withDeps(t, true));
}
// What the pane's track and table show.
const stepsShown = n => signature([[...n.children[0].children].map(s => [s.className, s.textContent]),
  ...[...n.children[1].children].map(c => [c.children[0].textContent, c.children[1].title, c.children[1].textContent]), n.children[2] ? n.children[2].sig : null]);
// A heading and its Markdown, formatted, or nothing when the text is empty.
function mdPart(body, heading, text) {
  if (text === null || text === undefined || text === '') return;
  body.appendChild(el('h4', null, heading));
  body.appendChild(el('div', 'md', null, ...mdBlocks(markdown(text))));
}
const paneReadiness = t => readiness(t, list(t.acceptance_criteria), false);
// What the pane shows apart from its readiness list and its track and table, and what that list shows, with the view
// state it depends on.
const fullText = t => [t.id, t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes, t.criteria_passed ?? null, hasPack(t), hasLog(t), backList()];
const readyData = t => [ownData(t), settingReady.has(t.id), refused.get(t.id) ?? null];
// Shows the ticket whose id is in fullId wherever it shows: in the Tickets list, the queue or the Shipped list, the
// first one in that order when ids repeat. It closes the pane when the ticket shows in none of them. The pane keeps
// its nodes while what they show is unchanged, so text selected in it survives the refresh. When only a draft's
// readiness list data or its Set ready state changes, a new list replaces the old and the rest stays. The same goes
// for the track and table under the title (0465), whose counter is put right in place, as a card's is.
let fullBuilt = null, readyBuilt = null, stepsBuilt = null, barBuilt = null; // the signatures of what the pane, its readiness list and its track and table show
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
  const tone = t && !packOf ? paneTone(t) : '', steps = t && !packOf ? paneSteps(t) : null, stepsSig = steps ? signature([fullId, t.status, tone, stepsShown(steps)]) : null;
  const barSig = t && !packOf && barShows(t) ? docActsSig(t) : null; // 0583
  const liveNew = liveSig(t); // 0584
  followLive(t);
  pane.hidden = !t;
  $('full-backdrop').hidden = !t;
  holdPage(pageHeld());
  if (sig !== fullBuilt) {
    fullBuilt = sig;
    liveBuilt = liveNew;
    liveBox = null; liveSub = null;
    readyBuilt = readySig;
    stepsBuilt = stepsSig;
    barBuilt = barSig;
    pane.replaceChildren(...(t ? (packOf ? packPane(t) : fullTicket(t, !!draft, steps, barSig !== null)) : []));
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
    if (state) { state.textContent = String(t.status ?? ''); setTone(state, tone); } // 0424
    pane.insertBefore(steps, pane.children[1]);
    pane.removeChild(pane.children[2]);
    if (liveBox) moveLive(steps); // 0584
  }
  if (liveNew !== liveBuilt) { // 0584: the live section, in place
    liveBuilt = liveNew;
    const holder = pane.children[1];
    if (liveNew === null) { if (liveBox) holder.removeChild(liveBox); liveBox = null; liveSub = null; }
    else if (liveBox) drawLive(t);
    else { liveBox = liveSection(t); holder.appendChild(liveBox); }
  }
  if (liveSub) putCounter(liveSub, queueCounter(t)); // the counter comes from the clock, as on a kept card
  if (barSig !== barBuilt) { // 0583: the bar, drawn again when what it shows changes, with the focus kept in the pane
    barBuilt = barSig;
    const old = pane.children[3] || null, had = !!old && within(document.activeElement, old);
    if (old) pane.removeChild(old);
    if (barSig !== null) pane.appendChild(shipBar(t));
    if (had && pane.focus) pane.focus({ preventScroll: true });
  }
}
function closeFull() {
  if (packOf && packFromFull) { packOf = null; packFromFull = false; render(); const pane = $('full-ticket'); if (pane.focus) pane.focus({ preventScroll: true }); return; } // 0583: back to the full view
  fullId = null; packOf = null; focusBack = true; render(); // 0362: the pop-up goes with it (renderFull)
}
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
function holdPane() { for (const id of ['full-ticket', 'full-backdrop']) $(id).inert = !!docOpen || settingsView !== null || buildLogOf !== null; } // 0583: and a build log opened from it
// A click on the backdrop closes the pane and nothing else. A drag from the pane to the backdrop clicks a node above both.
$('full-backdrop').addEventListener('click', e => { if (e.target === $('full-backdrop')) closeFull(); });
// 0415: a click beside the Pipeline pop-up's column is a click outside it, as with Settings (0368).
let foremanDownBeside = false;
$('foreman').addEventListener('pointerdown', e => { foremanDownBeside = e.target === $('foreman') && besideColumn(e, $('foreman')); });
$('foreman').addEventListener('click', e => {
  if ((foremanOpen || buildLogOf !== null) && foremanDownBeside && e.target === $('foreman') && besideColumn(e, $('foreman'))) { if (foremanOpen) closeForeman(); else closeBuildLog(); }
});
$('run').addEventListener('click', e => {
  e.stopPropagation();
  if (foremanOpen) { closeForeman(); return; }
  foremanOpen = true;
  render();
});
// 0568: the Decided for you list, in a pop-up over the whole panel, opened from the line under speck's status. A
// decision whose ticket has a review pack with Ask for changes (approved and not shipping) has a Change button, which
// opens that pack. It's drawn again only when what it shows changes, so a refresh doesn't take the focus or the scroll.
$('decided-open').addEventListener('click', e => {
  e.stopPropagation();
  decidedOpen = true;
  render();
});
function closeDecided() {
  decidedOpen = false;
  render();
  const line = $('decided-open');
  if (line.focus) line.focus();
}
function decidedRow(d, can) {
  const id = String(d.id), row = el('div', 'decided-row', null, el('div', 'decided-head', null, el('span', 'id', id), el('span', 'decided-title', String(d.title ?? ''))),
    el('div', 'decided-option', String(d.option ?? '')), el('div', 'decided-when', `${tookAt(d.at)}${d.criteria_changed === true ? ' · changed a criterion' : ''}`));
  if (can) {
    const b = el('button', 'full-open decided-change', 'Change');
    b.type = 'button';
    b.setAttribute('aria-label', `Change ${id}`);
    b.addEventListener('click', e => { e.stopPropagation(); decidedOpen = false; openPack(id); });
    row.appendChild(b);
  }
  return row;
}
function renderDecided(m) {
  const list = (Array.isArray(state.decided) ? state.decided : []).filter(d => d && typeof d === 'object');
  const line = $('decided-open'), box = $('decided'), was = !box.hidden;
  line.hidden = !list.length;
  line.textContent = list.length ? `${speckCalled()} decided ${list.length} for you in the last 7 days` : '';
  const can = d => m.queue.some(t => String(t.id) === String(d.id) && t.status === 'approved' && t.shipping !== true) && shippingId !== String(d.id);
  box.hidden = !decidedOpen;
  holdPage(pageHeld());
  if (!decidedOpen) { box.replaceChildren(); decidedBuilt = null; return; }
  const sig = signature(list.map(d => [d, can(d)]));
  if (sig === decidedBuilt) return;
  decidedBuilt = sig;
  const had = within(document.activeElement, box), shut = el('button', 'close', 'Close');
  shut.type = 'button';
  shut.addEventListener('click', e => { e.stopPropagation(); closeDecided(); });
  box.replaceChildren(el('div', 'top', null, el('span', 'title', 'Decided for you'), shut),
    list.length ? el('div', 'decided-list', null, ...list.map(d => decidedRow(d, can(d)))) : el('p', 'decided-none', 'Nothing decided in the last 7 days.'));
  if (!was) box.scrollTop = 0;
  if ((!was || had) && box.focus) box.focus({ preventScroll: true });
}
// 0366: closes the Foreman's pop-up, with the focus back on the bar, which opened it.
function closeForeman() {
  foremanOpen = false;
  render();
  const run = $('run');
  if (run.focus) run.focus();
}
// 0366: the detail, in the pop-up over the whole panel that a document opens in (0362). Its top, with Close, is kept
// while it's open and only the detail under it is drawn again, so the focus stays in the pop-up through a refresh.
// While it's open the page behind is held (holdPage), so only the pop-up can be clicked, scrolled or reached with Tab.
// 0415: the Pipeline pop-up, with speck run's output as its Log section. 0458: the log is all it shows, apart from a
// stale page's Reload page button above it. 0470: titled Pipeline log, with no Log heading over the log box.
// 0548: or, while buildLogOf is set, a ticket's build log in its place (renderBuildLog).
function renderForeman(stale) {
  const box = $('foreman'), shows = foremanOpen ? 'run' : buildLogOf !== null ? `build ${buildLogOf}` : null;
  const was = !box.hidden && box.children.length > 0 && box.shows === shows;
  box.hidden = shows === null;
  box.shows = shows;
  holdPage(pageHeld());
  holdPane(); // 0583
  if (shows === null) { box.replaceChildren(); return; }
  if (!foremanOpen) { renderBuildLog(was); return; }
  let body = was ? box.children[1] : null;
  if (!body) {
    body = popFrame('Pipeline log', closeForeman);
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
  const lines = given && given.slice().reverse().map(String), was = sec.children[0];
  if (!lines || !lines.length) {
    runLogDrawn = null;
    sec.replaceChildren(el('div', 'run-log', null, el('p', 'none', lines && runLogFor === null ? 'Reading speck run\'s log…' : 'speck run hasn\'t written anything yet.')));
    return;
  }
  fillLog(sec, runLogDrawn, lines, runLogRow);
  runLogDrawn = lines;
}
// 0548: puts a pop-up's log lines (oldest first) in its log box (sec): in the list drawn there, whose lines are `drawn`,
// or, when there's none or `fresh`, a new one, each line made by `row`. `dropped` says how many lines dropped out at
// the top (runLogDropped).
function fillLog(sec, drawn, lines, row, fresh = false, dropped = runLogDropped) {
  const was = sec.children[0];
  const list = !fresh && was && /^ol$/i.test(was.tagName || '') && Array.isArray(drawn) ? was : el('ol', 'run-log');
  // A box at its bottom, or just drawn, shows the new lines. A reader scrolled up stays where they are: the first line
  // they can see is found again, past the lines that dropped out at the top, and the box scrolled so it's where it was.
  const follow = list !== was || atBottom(list), rect = n => (n && typeof n.getBoundingClientRect === 'function' ? n.getBoundingClientRect() : null);
  let anchor = null;
  if (!follow && rect(list)) {
    const seen = Array.from(list.children).findIndex(li => rect(li) && rect(li).bottom > rect(list).top);
    const d = seen < 0 ? null : dropped(drawn, lines);
    if (d !== null && seen - d >= 0 && seen - d < lines.length) anchor = { at: seen - d, top: rect(list.children[seen]).top };
  }
  list.replaceChildren(...lines.map(row));
  if (list !== was) sec.replaceChildren(list);
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
// 0548: the pop-up's frame: its title row, with the title and Close, then its body, with room for a stale page's line
// and the log box. Returns the body.
function popFrame(title, close) {
  const box = $('foreman'), shut = el('button', 'close', 'Close');
  shut.type = 'button';
  shut.addEventListener('click', e => { e.stopPropagation(); close(); });
  const body = el('div', 'fm-body', null, el('div', 'fm-stale'), el('div', 'fm-log'));
  box.setAttribute('aria-label', title);
  box.replaceChildren(el('div', 'top', null, el('span', 'title', title), shut), body);
  return body;
}
// 0548: opens an open Build card's build log in the Pipeline log's pop-up, leaving the card as it is.
function buildLogButton(id) {
  const b = el('button', 'full-open', 'Full log');
  b.type = 'button';
  b.setAttribute('aria-haspopup', 'dialog');
  b.buildLogOf = id; // so the focus can come back to it, or to the one drawn in its place
  b.addEventListener('click', e => {
    e.stopPropagation();
    buildLogOf = id;
    render();
  });
  return b;
}
// 0548: closes it, with the focus back on the Full log button that opened it, or on the one drawn in its place since,
// or, when its card has gone, on the Build lane.
function closeBuildLog() {
  const id = buildLogOf, row = logFromRow;
  buildLogOf = null;
  logFromRow = false;
  if (!logWanted(id)) closeLog(id); // 0583: opened from the full view, with its card closed
  render();
  const find = (n, cls) => { if (n.buildLogOf === id && (!cls || n.className === cls)) return n; for (const c of n.children || []) { const f = find(c, cls); if (f) return f; } return null; };
  const to = (row && find($('full-ticket'), 'pane-row')) || find($('full-ticket')) || find($('queue')) || $('build-section'); // 0583: its row in the full view first
  if (to.focus) to.focus({ preventScroll: true });
}
// 0548: the ticket's build log in the pop-up, titled "<id> build log", in place of the Pipeline log, which has no stale
// page's line. Its frame is kept while it's open and only the log under it is drawn again.
function renderBuildLog(was) {
  const box = $('foreman');
  if (!was) {
    const body = popFrame(`${buildLogOf} build log`, closeBuildLog);
    body.children[0].hidden = true;
    buildLogShown = undefined; buildLogDrawn = null; buildLogBuild = null;
  }
  drawBuildLog();
  if (!was) box.scrollTop = 0;
  if (!was && box.focus) box.focus({ preventScroll: true });
}
// 0548: the lines its card's log box shows (logShown), each laid out as the Pipeline log's are, the newest at the
// bottom. The page calls it with each new log (showLog). A log not loaded yet, or one that couldn't be, or an empty one,
// says so in the card's words. A new build's log is drawn afresh, scrolled to its newest line.
function drawBuildLog() {
  const box = $('foreman'), sec = buildLogOf !== null && !foremanOpen && !box.hidden && box.children[1] ? box.children[1].children[1] : null;
  if (!sec) return;
  const log = logs.get(buildLogOf), text = logShown(log), build = log && !log.failed ? log.build : null;
  const key = `${build}\n${text}`;
  if (key === buildLogShown) return;
  buildLogShown = key;
  if (LOG_PLAIN.has(text)) {
    buildLogDrawn = null;
    sec.replaceChildren(el('div', 'run-log', null, el('p', 'none', text)));
    return;
  }
  const lines = text.split('\n');
  fillLog(sec, buildLogDrawn, lines, buildLogRow, build !== buildLogBuild, buildLogDropped);
  buildLogDrawn = lines;
  buildLogBuild = build;
}
// 0548: a build log's line, as the Pipeline log's (runLogRow): its time, then its text, coloured by its kind (logParts).
function buildLogRow(line) {
  const p = logParts(line, false);
  return el('li', p.cls, null, p.at ? el('span', 'at', p.at) : null, document.createTextNode(p.text));
}
// 0548: as runLogDropped, for a build log, which may start with the note that earlier lines aren't shown, and whose last
// line may have been written further since (logUpdate's drop), as the card's box allows (setLogText).
function buildLogDropped(was, now) {
  const w = was[0] === TRUNCATED ? 1 : 0, n = now[0] === TRUNCATED ? 1 : 0, a = was.slice(w), b = now.slice(n);
  for (let d = 0; d < a.length; d++) {
    if (a.length - d > b.length) continue;
    let same = true;
    for (let j = 0; same && d + j < a.length; j++) same = d + j === a.length - 1 ? b[j].startsWith(a[d + j]) : b[j] === a[d + j];
    if (same) return d + w - n;
  }
  return null;
}
