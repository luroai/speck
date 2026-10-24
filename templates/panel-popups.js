'use strict';
// 0473: the panel's pop-ups, which the page loads from /panel-popups.js after its own script and before Settings: the full
// ticket in the side pane, with a review pack, a document's pop-up and the Pipeline log. They open, draw, update and
// close using the page's helpers, such as el and $, and the page's render draws them (renderFull, renderForeman).
// What the pop-ups show, and the requests they make, kept between redraws.
let fullId = null; // the id of the ticket in the side pane, or null
let fullFrom = null; // 0326: { id, list } of the Full ticket button that opened the pane, or null when something else did
let focusBack = false; // 0326: the pane has closed, so the next render puts the focus back
let foremanOpen = false; // 0285: whether the Foreman's detail is open
let runLog = null, runLogFor = null, runLogAsking = false, runLogShown, runLogDrawn = null; // 0415: runLogShown: the log's lines as drawn (runLogDrawn), joined, undefined when not drawn
let packOf = null; // while the side pane shows a review pack instead: { id, state: 'loading' | 'ok' | 'none' | 'error', text }
let shippingId = null; // the id whose Ship request hasn't been answered yet: one ship at a time
const shipped = new Map(); // id → what speck ship printed when the panel shipped it
const shipRefused = new Map(); // id → why speck ship refused it, until the next click on its Ship button or the pack is opened again
const changesNotes = new Map(); // 0357: id → the note in its pack's box, kept while the pane is redrawn and after a refusal
let changesSending = null; // the id whose Ask for changes request hasn't been answered yet
const changesSaid = new Map(); // id → what speck changes printed when the panel sent its note
const changesRefused = new Map(); // id → why speck changes refused it, until its next Ask for changes
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
// A click on the backdrop closes the pane and nothing else. A drag from the pane to the backdrop clicks a node above both.
$('full-backdrop').addEventListener('click', e => { if (e.target === $('full-backdrop')) closeFull(); });
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
// 0366: the detail, in the pop-up over the whole panel that a document opens in (0362). Its top, with Close, is kept
// while it's open and only the detail under it is drawn again, so the focus stays in the pop-up through a refresh.
// While it's open the page behind is held (holdPage), so only the pop-up can be clicked, scrolled or reached with Tab.
// 0415: the Pipeline pop-up, with speck run's output as its Log section. 0458: the log is all it shows, apart from a
// stale page's Reload page button above it. 0470: titled Pipeline log, with no Log heading over the log box.
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
    body = el('div', 'fm-body', null, el('div', 'fm-stale'), el('div', 'fm-log'));
    box.replaceChildren(el('div', 'top', null, el('span', 'title', 'Pipeline log'), close), body);
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
