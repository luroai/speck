// 0363: an approved document task's document pop-up (0362) has the review pack's Ship and Ask for changes controls, so the
// document can be read and shipped, or sent back, without leaving it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, T, queueRows, deferred, page as html } from './support/panel.mjs';
import { PACK, DOCS } from './support/documents.mjs';

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const MEMO = '# Pricing\n\nPrices go **up**.\n';
const json = (status, body) => ({ ok: status < 400, status, json: async () => JSON.parse(JSON.stringify(body)) });

// A page whose server answers /api/state with the ticket at `status()`, the pack with the document task's files, the memo
// with MEMO, and each ship and changes request with `ship()` and `changes()`.
function page({ status = () => 'approved', shipping = () => false, ship = () => json(200, { ok: true, message: 'Shipped 0005: merged and pushed.' }),
  changes = () => json(200, { ok: true, message: 'Your note is in 0005\'s Review log.' }), confirmed = () => true } = {}) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/ship$/.test(url)) { sent.push(['ship', url, opts]); return ship(); }
      if (/\/changes$/.test(url)) { sent.push(['changes', url, opts]); return changes(); }
      if (/\/output\//.test(url)) return { ok: true, status: 200, text: async () => MEMO };
      if (/\/log$/.test(url)) return json(200, { text: '', truncated: false });
      if (/\/pack$/.test(url)) return json(200, { pack: PACK, documents: DOCS });
      return json(200, { ideas: [], tickets: [T('0005', status(), { started: ago(30), ...(shipping() ? { ship: { running: true, auto: false, started: ago(1) } } : {}) })] });
    },
    confirm: () => confirmed(),
  });
  p.sent = sent;
  return p;
}
const pane = p => p.byId('full-ticket');
const view = p => p.byId('doc-view');
const buttonsIn = (p, n, text) => p.all(n).filter(x => x.tagName === 'button' && (text instanceof RegExp ? text.test(x.textContent) : x.textContent === text));
const shipIn = (p, n) => buttonsIn(p, n, /^(Ship|Shipping…)$/)[0] || null;
const askIn = (p, n) => buttonsIn(p, n, /^(Ask for changes|Sending…)$/)[0] || null;
const boxIn = (p, n) => p.all(n).find(x => x.tagName === 'textarea') || null;
const type = (box, text) => { box.value = text; box.listeners.input({ target: box }); };
const tick = async p => { for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
// Opens 0005's review pack, then its memo in the pop-up.
async function openDoc(p) {
  await p.settle();
  const row = () => queueRows(p).find(n => n.textContent.includes('0005'));
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  p.press(buttonsIn(p, row(), 'Review pack')[0]);
  await p.settle();
  p.press(buttonsIn(p, pane(p), DOCS[0].path)[0]);
  await p.settle();
  assert.equal(view(p).hidden, false, 'the pop-up is open');
}
// The text of the nodes in `n` in page order, so what comes before what can be checked.
const order = (p, n) => p.all(n).map(x => x.tagName === 'button' ? `[${x.textContent}]` : x.tagName === 'textarea' ? '[box]' : /^h\d$/.test(x.tagName) ? `#${x.textContent}` : null).filter(Boolean);

// ---------- AC1: Ship and Ask for changes above the document ----------

test('0363 AC1: an approved ticket\'s document pop-up shows Ship, and the box and button for Ask for changes, above the document, as the pack does', async () => {
  const p = await (async () => { const p = page(); await openDoc(p); return p; })();
  const ship = shipIn(p, view(p)), ask = askIn(p, view(p)), box = boxIn(p, view(p));
  assert.ok(ship && ask && box, 'Ship, Ask for changes and the box');
  assert.equal(ship.textContent, 'Ship');
  assert.equal(ship.disabled, false);
  assert.equal(ask.disabled, true, 'empty box: can\'t be pressed, as in the pack');
  assert.equal(ask.parentNode, ship.parentNode, 'side by side, as in the pack');
  const o = order(p, view(p));
  assert.ok(o.indexOf('[Ship]') < o.indexOf('#Pricing') && o.indexOf('[box]') < o.indexOf('#Pricing'), `above the document: ${o}`);
  assert.equal(shipIn(p, view(p)).title, shipIn(p, pane(p)).title, 'the same button as the pack\'s');
});

// ---------- AC2: Ship ships it, says so and what speck ship said or why it refused ----------

test('0363 AC2: Ship in the pop-up asks, posts the ship with the token as the pack does, shows it is shipping, then what speck ship said', async () => {
  const done = deferred();
  const p = page({ ship: () => done });
  await openDoc(p);
  p.press(shipIn(p, view(p)));
  await p.settle();
  assert.equal(p.sent.length, 1);
  const [what, url, opts] = p.sent[0];
  assert.equal(what, 'ship');
  assert.equal(url, '/api/tickets/0005/ship');
  assert.equal(opts.method, 'POST');
  assert.ok(opts.headers['X-Speck-Token'], 'with the token');
  assert.equal(view(p).hidden, false, 'the pop-up stays open');
  assert.equal(shipIn(p, view(p)).textContent, 'Shipping…');
  assert.equal(shipIn(p, view(p)).disabled, true, 'can\'t be pressed while it ships');
  assert.ok(view(p).textContent.includes('Shipping 0005: running the tests, then merging and pushing. This can take a few minutes.'), view(p).textContent);
  assert.equal(askIn(p, view(p)), null, 'no Ask for changes while it ships, as in the pack');
  assert.ok(view(p).textContent.includes('Prices go'), 'the document is still there');
  done.resolve(json(200, { ok: true, message: 'Shipped 0005: merged and pushed.' }));
  await p.settle();
  assert.ok(view(p).textContent.includes('Shipped 0005: merged and pushed.'), view(p).textContent);
  assert.equal(shipIn(p, view(p)), null, 'no Ship once it has shipped');
});

test('0363 AC2: a refused ship says why in the pop-up, with the same wording as the pack', async () => {
  for (const [answer, said] of [[() => json(409, { error: 'Tests failed: 2 failing.' }), 'Tests failed: 2 failing.'],
    [() => json(500, null), 'The server refused (500).'],
    [() => Promise.reject(new Error('down')), "Couldn't reach the panel server, so the ticket wasn't shipped. It may still be shipping: check the Shipped table before trying again."]]) {
    const p = page({ ship: answer });
    await openDoc(p);
    p.press(shipIn(p, view(p)));
    await p.settle();
    assert.ok(view(p).textContent.includes(said), view(p).textContent);
    assert.ok(pane(p).textContent.includes(said), 'the pack says the same');
    assert.equal(shipIn(p, view(p)).disabled, false, 'it can be tried again');
  }
});

test('0363 AC2: cancelling the question ships nothing', async () => {
  const p = page({ confirmed: () => false });
  await openDoc(p);
  p.press(shipIn(p, view(p)));
  await p.settle();
  assert.equal(p.sent.length, 0);
  assert.equal(shipIn(p, view(p)).textContent, 'Ship');
});

test('0363 AC2: while a ship runs from elsewhere, the pop-up\'s Ship can\'t be pressed and it says it is shipping', async () => {
  let shipping = false;
  const p = page({ shipping: () => shipping });
  await openDoc(p);
  assert.equal(shipIn(p, view(p)).disabled, false);
  shipping = true;
  await tick(p);
  assert.equal(view(p).hidden, false, 'still open');
  assert.equal(shipIn(p, view(p)).disabled, true);
  assert.equal(shipIn(p, view(p)).textContent, 'Shipping…');
  p.press(shipIn(p, view(p)));
  await p.settle();
  assert.equal(p.sent.length, 0, 'nothing sent');
});

// ---------- AC3: Ask for changes sends the note and says what it said ----------

test('0363 AC3: Ask for changes in the pop-up sends the note as the pack does, and what it said shows in the pop-up', async () => {
  const done = deferred();
  const p = page({ changes: () => done });
  await openDoc(p);
  type(boxIn(p, view(p)), '  Call it Download.  ');
  assert.equal(askIn(p, view(p)).disabled, false);
  p.press(askIn(p, view(p)));
  await p.settle();
  const [what, url, opts] = p.sent[0];
  assert.equal(what, 'changes');
  assert.equal(url, '/api/tickets/0005/changes');
  assert.equal(opts.method, 'POST');
  assert.ok(opts.headers['X-Speck-Token']);
  assert.deepEqual(JSON.parse(opts.body), { note: 'Call it Download.' });
  assert.equal(askIn(p, view(p)).textContent, 'Sending…');
  assert.equal(shipIn(p, view(p)).disabled, true, 'no ship while the note is sending');
  done.resolve(json(200, { ok: true, message: 'Your note is in 0005\'s Review log.' }));
  await p.settle();
  assert.ok(view(p).textContent.includes('Your note is in 0005\'s Review log.'), view(p).textContent);
  assert.equal(askIn(p, view(p)), null, 'its note has gone, as in the pack');
});

test('0363 AC3: a refused note says why in the pop-up, with the same wording as the pack, and the note stays', async () => {
  for (const [answer, said] of [[() => json(409, { error: '0005 isn\'t approved.' }), '0005 isn\'t approved.'],
    [() => Promise.reject(new Error('down')), "Couldn't reach the panel server, so your note wasn't sent. Try again."]]) {
    const p = page({ changes: answer });
    await openDoc(p);
    type(boxIn(p, view(p)), 'Shorter.');
    p.press(askIn(p, view(p)));
    await p.settle();
    assert.ok(view(p).textContent.includes(said), view(p).textContent);
    assert.equal(boxIn(p, view(p)).value, 'Shorter.', 'the note is kept to try again');
  }
});

test('0363 AC3: a note typed in the pop-up is the one the pack shows and sends once the pop-up closes', async () => {
  const p = page();
  await openDoc(p);
  type(boxIn(p, view(p)), 'Shorter.');
  p.key('Escape');
  await p.settle();
  assert.equal(view(p).hidden, true);
  assert.equal(boxIn(p, pane(p)).value, 'Shorter.');
  assert.equal(askIn(p, pane(p)).disabled, false);
  p.press(askIn(p, pane(p)));
  await p.settle();
  assert.deepEqual(JSON.parse(p.sent[0][2].body), { note: 'Shorter.' });
});

test('0363 AC3: typing in the pop-up\'s box keeps the document\'s nodes, so nothing is redrawn under it', async () => {
  const p = page();
  await openDoc(p);
  const before = p.all(view(p));
  type(boxIn(p, view(p)), 'Shorter.');
  assert.deepEqual(p.all(view(p)), before);
});

// ---------- AC4: no controls on a ticket that isn't approved; the pack as before ----------

test('0363 AC4: a ticket that isn\'t approved and isn\'t shipping shows no Ship or Ask for changes in the pop-up', async () => {
  let status = 'approved';
  const p = page({ status: () => status });
  await openDoc(p);
  assert.ok(shipIn(p, view(p)));
  status = 'reviewing';
  await tick(p);
  assert.equal(view(p).hidden, false, 'still open');
  assert.equal(shipIn(p, view(p)), null);
  assert.equal(askIn(p, view(p)), null);
  assert.equal(boxIn(p, view(p)), null);
  assert.ok(view(p).textContent.includes('Prices go'), 'the document is still there');
});

test('0363 AC4: the pack\'s own Ship and Ask for changes work as before, with the pop-up closed', async () => {
  const p = page();
  await openDoc(p);
  p.key('Escape');
  await p.settle();
  type(boxIn(p, pane(p)), 'Shorter.');
  p.press(askIn(p, pane(p)));
  await p.settle();
  assert.ok(pane(p).textContent.includes('Your note is in 0005\'s Review log.'));
  p.press(shipIn(p, pane(p)));
  await p.settle();
  assert.deepEqual(p.sent.map(s => s[1]), ['/api/tickets/0005/changes', '/api/tickets/0005/ship']);
  assert.ok(pane(p).textContent.includes('Shipped 0005: merged and pushed.'));
});

test('0363 AC1: the pop-up\'s Ship and Ask for changes look as the pack\'s do, in the document\'s centred column', () => {
  const css = html().match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m => m[1].replace(/^[^{]*\{/, '').split(',').map(x => x.trim()));
  for (const s of ['.ship', '.ship:disabled', '.ship-said', '.ship-said.bad', '.changes-note', '.pack-buttons', '.ask-changes', '.ask-changes:disabled'])
    assert.ok(sels.some(l => l.includes(`#full-ticket ${s}`) && l.includes(`#doc-view ${s}`)), `${s} shared`);
  assert.ok(sels.some(l => l.includes('#doc-view .doc-actions') && l.includes('#doc-view .md')), 'in the same column as the document');
});
