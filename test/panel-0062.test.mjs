import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fm, panelRepo, freePort, startPanel, stop, fakePage, full, T, click, items, top, queueRows, deferred, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0062: the full ticket pane shows the open ticket's readiness list and Set ready ----------

const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const buttons = (p, n) => p.all(n).filter(x => x.tagName === 'button');
const named = (p, n, text) => buttons(p, n).find(b => b.textContent === text);
const fullButton = (p, item) => named(p, item, 'Full ticket');
const setReadyOf = (p, n) => p.all(n).find(x => x.tagName === 'button' && /\bset-ready\b/.test(x.className));
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const readyBox = (p, n) => p.all(n).find(x => /\bready\b/.test(x.className) && x.tagName === 'div');
// The readiness list's lines: each line's text and its colour class, without the buttons or a refusal.
const lines = (p, n) => readyBox(p, n).children.filter(x => x.tagName === 'div' && !/\brefused\b/.test(x.className)).map(x => [x.className, x.textContent]);
const refusal = (p, n) => (readyBox(p, n).children.find(x => /\brefused\b/.test(x.className)) || {}).textContent;
const paneBody = p => pane(p).children[1];

const MIXED = {
  size: 'M', risk: 'high', acceptance_criteria: ['One.', 'Two.', 'Three.'],
  lint: { errors: 1, warnings: 2 },
  lint_messages: { errors: ['Outcome contains "and": one outcome per ticket.'], warnings: ['Notes has no Self-check line.', 'Priority is blank.'] },
  after: ['0007', '0008'], waiting_on: ['0008'],
};

async function openPane(tickets, more = []) {
  const s = { tickets, ideas: [] };
  const p = fakePage([s, ...more]);
  await p.settle();
  const id = tickets[0].id;
  click(top(itemOf(p, id)));
  click(fullButton(p, itemOf(p, id)));
  assert.ok(paneOpen(p), 'the pane opens');
  return p;
}

test('0062 AC1: the pane shows the same readiness lines as the open ticket, after the id and title and before the problem', async () => {
  for (const o of [MIXED, {}, { size: 'L', risk: undefined, acceptance_criteria: [], after: ['0003'], waiting_on: [] }]) {
    const p = await openPane([full('0001', o)]);
    const want = lines(p, itemOf(p, '0001'));
    assert.ok(want.length >= 4, 'the list has its readiness lines');
    assert.deepEqual(lines(p, pane(p)), want, 'the same lines, in the same order and colours');
    const [head, body] = pane(p).children;
    assert.ok(head.textContent.startsWith('0001'), 'the id and title come first');
    const ready = readyBox(p, pane(p));
    assert.equal(body.children[0], ready, 'the readiness list is the first thing after them');
    const problem = body.children.findIndex(n => n.tagName === 'h4' && n.textContent === 'Problem');
    assert.ok(problem > 0, 'before the problem');
  }
  const p = await openPane([full('0001', MIXED)]);
  const text = lines(p, pane(p)).map(l => l[1]);
  assert.deepEqual(text, ['Size M, risk high', '3 criteria', 'Outcome contains "and": one outcome per ticket.', 'Notes has no Self-check line.', 'Priority is blank.',
    'after: 0007 done', 'after: 0008 not done']);
  const q = await openPane([full('0001')]);
  assert.ok(lines(q, pane(q)).some(l => l[1] === 'lint passes') && lines(q, pane(q)).some(l => l[1] === 'no after: tickets'));
});

test('0062 AC2: the pane has the same buttons as the open ticket except Full ticket, disabled with the same hover text', async () => {
  for (const o of [MIXED, {}]) {
    const p = await openPane([full('0001', o)]);
    const listButtons = buttons(p, readyBox(p, itemOf(p, '0001'))).map(b => b.textContent);
    const paneButtons = buttons(p, readyBox(p, pane(p))).map(b => b.textContent);
    assert.deepEqual(listButtons, ['Set ready', 'Full ticket']);
    assert.deepEqual(paneButtons, listButtons.filter(b => b !== 'Full ticket'));
    const a = setReadyOf(p, itemOf(p, '0001')), b = setReadyOf(p, pane(p));
    assert.equal(b.disabled, a.disabled);
    assert.equal(b.title, a.title);
    assert.equal(b.disabled, o === MIXED, 'disabled only with lint errors');
    if (o === MIXED) assert.match(b.title, /lint/);
  }
});

test('0062 AC2: either button shows "Setting ready…" in both places while a request for the ticket is in progress', async () => {
  for (const from of ['list', 'pane']) {
    const answer = deferred();
    const p = await openPane([full('0001')], [answer]);
    const sender = from === 'list' ? setReadyOf(p, itemOf(p, '0001')) : setReadyOf(p, pane(p));
    click(sender);
    for (const where of [itemOf(p, '0001'), pane(p)]) {
      const b = setReadyOf(p, where);
      assert.equal(b.textContent, 'Setting ready…', `${from}: pending shows everywhere`);
      assert.equal(b.disabled, true);
    }
    answer.resolve({ ok: false, status: 409, json: async () => ({ error: 'Not a draft.' }) });
    await p.settle();
    for (const where of [itemOf(p, '0001'), pane(p)]) assert.equal(setReadyOf(p, where).textContent, 'Set ready');
  }
});

// Since 0063 the pane stays open on the ticket in the queue, without its readiness list.
test('0062 AC3: Set ready in the pane posts, keeps the pane open, and a success moves it to the queue on the next refresh', async () => {
  const draft = { tickets: [full('0002')], ideas: [] };
  const p = fakePage([draft, { ok: true, id: '0002' }, { tickets: [T('0002', 'ready')], ideas: [] }]);
  await p.settle();
  click(top(itemOf(p, '0002')));
  click(fullButton(p, itemOf(p, '0002')));
  let stopped = false;
  setReadyOf(p, pane(p)).listeners.click({ stopPropagation() { stopped = true; } });
  assert.ok(paneOpen(p), 'open while the request is in progress');
  await p.settle();
  assert.ok(stopped, 'the click goes no further');
  assert.equal(p.calls[1].url, '/api/tickets/0002/ready');
  assert.equal(p.calls[1].opts.method, 'POST');
  assert.ok(paneOpen(p), 'open after the answer, until the next refresh');
  await refresh(p);
  assert.ok(paneOpen(p) && pane(p).textContent.startsWith('0002'), 'the refresh leaves it open on the ticket');
  assert.equal(readyBox(p, pane(p)), undefined, 'with no readiness list');
  assert.ok(queueRows(p).some(r => r.textContent.includes('0002')), 'and the ticket is in the queue');
});

test('0062 AC3: a refusal shows under both buttons until the next click on either', async () => {
  const draft = { tickets: [full('0002')], ideas: [] };
  const reason = 'Not ready:\n  ✗ size L can never be ready: split it into sibling tickets.';
  for (const again of ['list', 'pane']) {
    const second = deferred();
    const p = fakePage([draft, { status: 422, body: { error: reason } }, clone(draft), second]);
    await p.settle();
    click(top(itemOf(p, '0002')));
    click(fullButton(p, itemOf(p, '0002')));
    click(setReadyOf(p, pane(p)));
    await p.settle();
    assert.ok(paneOpen(p), 'still open');
    assert.equal(refusal(p, pane(p)), reason, 'under the button in the pane');
    assert.equal(refusal(p, itemOf(p, '0002')), reason, 'and in the list');
    const [b] = readyBox(p, pane(p)).children.filter(x => x.tagName === 'button');
    const after = readyBox(p, pane(p)).children;
    assert.ok(after.indexOf(b) < after.findIndex(x => /\brefused\b/.test(x.className)), 'the reason is under the button');
    await refresh(p);
    assert.equal(refusal(p, pane(p)), reason, 'kept through a refresh');
    click(again === 'list' ? setReadyOf(p, itemOf(p, '0002')) : setReadyOf(p, pane(p)));
    assert.equal(refusal(p, pane(p)), undefined, `${again}: the next click clears it in the pane`);
    assert.equal(refusal(p, itemOf(p, '0002')), undefined, `${again}: and in the list`);
    second.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) });
    await p.settle();
  }
});

test('0062 AC4: the readiness list changes on the refresh with the ticket, and the rest of the pane keeps its nodes', async () => {
  const before = full('0001', { lint: { errors: 0, warnings: 0 } });
  const changed = full('0001', { ...MIXED, acceptance_criteria: before.acceptance_criteria }); // the pane's text is unchanged
  const s = t => ({ tickets: [t], ideas: [] });
  const p = fakePage([s(before), s(clone(before)), s(changed), s(clone(changed)), s(clone(changed))]);
  await p.settle();
  click(top(itemOf(p, '0001')));
  click(fullButton(p, itemOf(p, '0001')));
  const kept = p.all(paneBody(p)).find(n => n.tagName === 'p'); // text in the problem, which a reader might have selected
  const detached = () => kept.detached || 0;
  const [head, body] = pane(p).children;
  const ready = readyBox(p, pane(p));
  await refresh(p);
  assert.equal(readyBox(p, pane(p)), ready, 'unchanged: the readiness list keeps its nodes');
  assert.equal(detached(), 0);
  await refresh(p);
  assert.deepEqual(lines(p, pane(p)), lines(p, itemOf(p, '0001')), 'the new readiness lines');
  assert.ok(lines(p, pane(p)).some(l => l[1] === 'after: 0008 not done'));
  assert.equal(setReadyOf(p, pane(p)).disabled, true, 'and the button follows the new lint');
  assert.equal(detached(), 0, 'the problem text stays on the page');
  assert.equal(pane(p).children[0], head, 'and so do the id and title');
  assert.equal(pane(p).children[1], body, 'and the sections');
  assert.equal(body.detached || 0, 0);
  await refresh(p);
  const now = readyBox(p, pane(p));
  await refresh(p);
  assert.equal(readyBox(p, pane(p)), now);
  assert.equal(detached(), 0);
});

test('0062 AC4: a request in progress and its refusal change only the readiness list', async () => {
  const s = { tickets: [full('0001')], ideas: [] };
  const answer = deferred();
  const p = fakePage([s, answer, clone(s)]);
  await p.settle();
  click(top(itemOf(p, '0001')));
  click(fullButton(p, itemOf(p, '0001')));
  const kept = p.all(paneBody(p)).find(n => n.tagName === 'p');
  click(setReadyOf(p, pane(p)));
  assert.equal(setReadyOf(p, pane(p)).textContent, 'Setting ready…');
  answer.resolve({ ok: false, status: 409, json: async () => ({ error: 'Not a draft.' }) });
  await p.settle();
  assert.equal(refusal(p, pane(p)), 'Not a draft.');
  await refresh(p);
  assert.equal(kept.detached || 0, 0, 'the problem text stays on the page throughout');
});

test('0062 AC3 and AC4: in a real browser, a refusal keeps the pane open with the focus, and a readiness change keeps a selection', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const write = size => r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', size }),
    '## Problem\nUsers cannot export their bookings.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n');
  write('S');
  const port = await freePort();
  const panel = await startPanel(r.dir, ['--port', String(port)]);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  const press = async sel => {
    const [x, y] = await b.js(`(r => [r.left + r.width / 2, r.top + r.height / 2])(document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect())`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  };
  try {
    await b.until(`[...document.querySelectorAll('#shaping .item')].some(n => n.textContent.startsWith('0002'))`, 'the ticket');
    await b.js(`[...document.querySelectorAll('#shaping .item')].find(n => n.textContent.startsWith('0002')).querySelector('.head').click()`);
    await b.js(`[...document.querySelectorAll('#shaping .item.open button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(`!!document.querySelector('#full-ticket .set-ready')`, 'the pane with its Set ready');
    r.g('checkout', '-q', '-b', 'elsewhere'); // the server refuses off the base branch
    await press('#full-ticket .set-ready');
    await b.until(`!!document.querySelector('#full-ticket .refused')`, 'the refusal in the pane');
    assert.match(await b.js(`document.querySelector('#full-ticket .refused').textContent`), /main/);
    assert.ok(await b.js(`!!document.querySelector('#shaping .item.open .refused')`), 'and in the list');
    assert.equal(await b.js(`document.activeElement === document.getElementById('full-ticket')`), true, 'the pane keeps the focus, so the keys still scroll it');
    assert.equal(await b.js(`document.getElementById('full-ticket').hidden`), false, 'the pane stays open');

    await b.js(`(() => { const t = [...document.querySelectorAll('#full-ticket p')].find(p => p.textContent.startsWith('Users cannot')).firstChild;
      const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 12); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    assert.equal(await b.js('getSelection().toString()'), 'Users cannot');
    write('M');
    await b.until(`[...document.querySelectorAll('#full-ticket .ready div')].some(d => d.textContent === 'Size M, risk low')`, 'the new readiness list');
    assert.equal(await b.js('getSelection().toString()'), 'Users cannot', 'the selection in the problem is kept');
  } finally {
    await b.close();
    await stop(panel);
  }
});
