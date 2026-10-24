import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fm, panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, readT, fakePage, full, T, items, top, queueRows, shippedRows, deferred, factsOf } from './support/panel.mjs';

// ---------- 0077: set a draft ticket's priority with a click in the panel ----------

const priorityPath = (id, n) => `/api/tickets/${id}/priority/${n}`;
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const isOpen = item => /\bopen\b/.test(item.className);
const pTag = (p, n) => p.all(n).find(x => /\btag\b/.test(x.className) && /^P/.test(x._text));
const menuOf = (p, n) => p.all(n).find(x => /\bprio-menu\b/.test(x.className || ''));
const choices = (p, n) => p.all(menuOf(p, n)).filter(x => x.tagName === 'button');
const refusal = (p, item) => (item.children.find(x => /\bprio-refused\b/.test(x.className || '')) || {}).textContent;
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const postsOf = p => p.calls.filter(c => c.opts && c.opts.method === 'POST');

async function shaping(tickets, more = []) {
  const s = { tickets, ideas: [] };
  const p = fakePage([s, ...more]);
  await p.settle();
  return p;
}

test('0077 AC1: only a draft\'s priority tag in the Tickets list is clickable; no priority, no tag', async () => {
  const done = T('0005', 'done', { started: '2026-10-09T10:00:00Z', finished: '2026-10-09T11:00:00Z' });
  const p = await shaping([full('0001', { priority: 2 }), full('0002', { priority: null }), T('0003', 'ready'), T('0004', 'building'), done]);
  const tag = pTag(p, itemOf(p, '0001'));
  assert.equal(tag.textContent, 'P2');
  assert.match(tag.className, /\bpick\b/, 'the draft\'s tag is clickable');
  assert.ok(tag.listeners.click, 'with a click handler');
  assert.equal(pTag(p, itemOf(p, '0002')), undefined, 'a draft with no priority shows no tag');
  // 0434: the queue shows the tag while its ticket is open. 0462: one in flight shows its priority in its facts instead
  queueRows(p).find(r => r.textContent.startsWith('0004')).children[0].listeners.click();
  await p.settle();
  assert.deepEqual(factsOf(queueRows(p).find(r => r.textContent.startsWith('0004')))[3], ['Priority', 'P2']);
  for (const id of ['0003']) {
    queueRows(p).find(r => r.textContent.startsWith(id)).children[0].listeners.click();
    await p.settle();
    const row = queueRows(p).find(r => r.textContent.startsWith(id)), t = pTag(p, row);
    assert.ok(t, `${row.textContent}: the queue shows the tag`);
    assert.equal(t.className, 'tag', 'as today');
    p.press(t); // since 0165 it shows its tip, but it opens no menu (checked below) and leaves the row as it is
    assert.ok(/\bopen\b/.test(row.className), 'the row stays open');
  }
  for (const row of [...queueRows(p), ...shippedRows(p)]) assert.equal(p.all(row).filter(x => /\b(pick|prio-menu)\b/.test(x.className || '')).length, 0);
  // The P1 tag keeps its own colour.
  const q = await shaping([full('0001', { priority: 1 })]);
  assert.match(pTag(q, itemOf(q, '0001')).className, /\bp1\b/);
});

test('0077 AC2: clicking the tag opens a menu of P1–P5 with the current one marked, without opening the row', async () => {
  const p = await shaping([full('0001', { priority: 3 }), full('0002', { priority: 4 })]);
  assert.equal(menuOf(p, itemOf(p, '0001')), undefined, 'no menu at first');
  p.press(pTag(p, itemOf(p, '0001')));
  const item = itemOf(p, '0001');
  assert.ok(menuOf(p, item), 'the menu opens');
  assert.deepEqual(choices(p, item).map(b => b.textContent), ['P1', 'P2', 'P3', 'P4', 'P5']);
  assert.deepEqual(choices(p, item).map(b => /\bon\b/.test(b.className)), [false, false, true, false, false], 'P3 is marked');
  assert.equal(isOpen(item), false, 'the row stays closed');
  assert.equal(menuOf(p, itemOf(p, '0002')), undefined, 'only that ticket\'s menu');
  // On an open row the menu leaves it open.
  const q = await shaping([full('0001', { priority: 3 })]);
  q.press(top(itemOf(q, '0001')));
  assert.ok(isOpen(itemOf(q, '0001')));
  q.press(pTag(q, itemOf(q, '0001')));
  assert.ok(menuOf(q, itemOf(q, '0001')));
  assert.ok(isOpen(itemOf(q, '0001')), 'the row stays open');
});

test('0077 AC2: choosing a priority posts it with the token, closes the menu and leaves the row as it was', async () => {
  for (const startOpen of [false, true]) {
    const p = await shaping([full('0001', { priority: 3 })], [{ ok: true, id: '0001' }]);
    if (startOpen) p.press(top(itemOf(p, '0001')));
    p.press(pTag(p, itemOf(p, '0001')));
    p.press(choices(p, itemOf(p, '0001'))[0]);
    await p.settle();
    const [call] = postsOf(p);
    assert.equal(call.url, priorityPath('0001', 1));
    assert.equal(call.opts.method, 'POST');
    assert.match(call.opts.headers['X-Speck-Token'], /token/, 'sends the page\'s token');
    assert.equal(menuOf(p, itemOf(p, '0001')), undefined, 'the menu closes');
    assert.equal(isOpen(itemOf(p, '0001')), startOpen, 'the row is as it was');
    assert.equal(refusal(p, itemOf(p, '0001')), undefined, 'no refusal');
  }
});

test('0077 AC2: a click outside the menu or Escape closes it and changes nothing else', async () => {
  for (const how of ['own row', 'other row', 'tag again', 'section', 'Escape']) {
    const p = await shaping([full('0001', { priority: 3 }), full('0002', { priority: 4 })]);
    p.press(pTag(p, itemOf(p, '0001')));
    assert.ok(menuOf(p, itemOf(p, '0001')));
    if (how === 'Escape') p.key('Escape');
    else {
      const target = how === 'own row' ? top(itemOf(p, '0001')) : how === 'other row' ? top(itemOf(p, '0002')) : how === 'tag again' ? pTag(p, itemOf(p, '0001')) : p.byId('shaping');
      assert.equal(p.press(target), true, `${how}: the click goes no further`);
    }
    assert.equal(menuOf(p, itemOf(p, '0001')), undefined, `${how}: the menu closes`);
    assert.equal(isOpen(itemOf(p, '0001')), false, `${how}: the row stays closed`);
    assert.equal(isOpen(itemOf(p, '0002')), false, `${how}: so does the other`);
    assert.equal(postsOf(p).length, 0, `${how}: nothing is sent`);
  }
  // With no menu open, clicks do what they did.
  const p = await shaping([full('0001', { priority: 3 })]);
  assert.equal(p.press(top(itemOf(p, '0001'))), false);
  assert.ok(isOpen(itemOf(p, '0001')));
});

test('0077 AC3: a refusal shows under the ticket\'s top row until the next click on its tag', async () => {
  const s = { tickets: [full('0001', { priority: 3 })], ideas: [] };
  const reason = 'Ticket 0001 is "ready", not a draft, so its priority can\'t be changed from here.';
  for (const failure of [{ status: 409, body: { error: reason } }, new Error('offline')]) {
    const p = fakePage([s, failure, clone(s)]);
    await p.settle();
    p.press(pTag(p, itemOf(p, '0001')));
    p.press(choices(p, itemOf(p, '0001'))[1]);
    await p.settle();
    const item = itemOf(p, '0001');
    const shown = refusal(p, item);
    if (failure instanceof Error) assert.match(shown, /reach the panel server/);
    else assert.equal(shown, reason);
    const at = item.children.findIndex(x => /\bprio-refused\b/.test(x.className || ''));
    assert.equal(item.children[at - 1], top(item), 'right under the top row');
    assert.equal(isOpen(item), false, 'the row stays closed');
    await refresh(p);
    assert.equal(refusal(p, itemOf(p, '0001')), shown, 'kept through a refresh');
    p.press(pTag(p, itemOf(p, '0001')));
    assert.equal(refusal(p, itemOf(p, '0001')), undefined, 'the next click on the tag clears it');
    assert.ok(menuOf(p, itemOf(p, '0001')), 'and opens the menu');
  }
});

// A panel repo with a draft 0002 at P3 (untracked, as a fresh draft is), served on a free port.
async function priorityPanel() {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: '3              # 1 (highest) to 5' }));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  const token = tokenOf((await request(port)).body);
  return { r, port, p, token };
}
const ticketFiles = r => ['0001-export-bookings.md', '0002-two.md'].map(n => readT(r, n));

test('0077 AC2: the server sets the priority as speck set does and commits only the ticket', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    // What `speck set` makes of it, then the file put back.
    const file = path.join(r.dir, 'speck', 'tickets', '0002-two.md'), original = readT(r, '0002-two.md');
    assert.equal(r.run('set', '2', 'priority', '1').status, 0);
    const want = readT(r, '0002-two.md');
    assert.match(want, /^priority: 1 +# 1 \(highest\) to 5$/m);
    fs.writeFileSync(file, original);
    // Another change, staged, and another, not staged, that the commit must leave alone.
    fs.writeFileSync(path.join(r.dir, 'staged.txt'), 'staged\n'); r.g('add', 'staged.txt');
    fs.appendFileSync(path.join(r.dir, 'speck', 'config.yml'), '\n# unstaged edit\n');
    const before = headOf(r);
    const res = await post(port, priorityPath('0002', 1), { token });
    assert.equal(res.status, 200, res.body);
    assert.match(res.headers['content-type'], /application\/json/);
    assert.equal(readT(r, '0002-two.md'), want, 'exactly as speck set writes it');
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0002): priority 1');
    assert.equal(r.g('rev-parse', 'HEAD~1'), before, 'one new commit');
    assert.equal(r.g('show', '--name-only', '--format=', 'HEAD'), 'speck/tickets/0002-two.md');
    assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets/0002-two.md'), '');
    assert.equal(r.g('diff', '--cached', '--name-only'), 'staged.txt', 'the staged change is still staged');
    assert.equal(r.g('diff', '--name-only'), 'speck/config.yml', 'the unstaged change is still unstaged');
    // Again, to another priority, and to the one it already has, which changes nothing and is no error.
    assert.equal((await post(port, priorityPath('2', 5), { token })).status, 200);
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0002): priority 5');
    const head = headOf(r);
    const same = await post(port, priorityPath('0002', 5), { token });
    assert.equal(same.status, 200, same.body);
    assert.equal(headOf(r), head, 'no empty commit');
    assert.match(readT(r, '0002-two.md'), /^priority: 5 /m);
    assert.match(readT(r, '0002-two.md'), /^status: draft/m, 'still a draft');
  } finally { await stop(p); }
});

test('0077 AC3: without the panel\'s Origin and token the request gets 403 and changes nothing', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    const before = headOf(r), files = ticketFiles(r);
    const bad = [
      { token, origin: null }, { token, origin: 'http://evil.example' }, { token, origin: `http://127.0.0.1:${port + 1}` },
      { token, origin: 'null' }, {}, { token: '' }, { token: 'nope' }, { token: token.slice(0, -1) },
    ];
    for (const o of bad) assert.equal((await post(port, priorityPath('0002', 1), o)).status, 403, JSON.stringify({ ...o, token: o.token === token ? 'right' : o.token }));
    assert.equal((await post(port, priorityPath('0002', 1), { token, host: 'evil.example' })).status, 403, 'the Host check still applies');
    for (const method of ['PUT', 'DELETE', 'PATCH']) assert.equal((await post(port, priorityPath('0002', 1), { token, method })).status, 405, method);
    assert.equal(headOf(r), before);
    assert.deepEqual(ticketFiles(r), files);
    const ok = await post(port, priorityPath('0002', 1), { token, origin: `http://localhost:${port}`, host: `localhost:${port}` });
    assert.equal(ok.status, 200, ok.body);
  } finally { await stop(p); }
});

test('0077 AC3: a priority that isn\'t 1 to 5, or a ticket that isn\'t a draft, is refused with a reason and changes nothing', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    const cases = [
      ...['0', '6', '-1', '2.5', '1.0', '01', ' 1', 'one', '1x', '%31', '', '9999999999'].map(n => ['0002', n, /1 to 5/]),
      ['0001', '1', /ready/], // ready, not a draft
      ['0099', '1', /0099/],
    ];
    for (const [id, n, why] of cases) {
      const before = headOf(r), files = ticketFiles(r);
      const res = await post(port, priorityPath(id, encodeURIComponent(n).replace('%2531', '%31')), { token });
      assert.ok(res.status >= 400 && res.status < 500, `${id} ${JSON.stringify(n)}: ${res.status}`);
      assert.match(JSON.parse(res.body).error, why, `${id} ${JSON.stringify(n)}`);
      assert.equal(headOf(r), before, `${id} ${JSON.stringify(n)}: nothing committed`);
      assert.deepEqual(ticketFiles(r), files, `${id} ${JSON.stringify(n)}: no file changed`);
    }
    // A checkout that isn't on the base branch.
    r.g('checkout', '-q', '-b', 'elsewhere');
    const before = headOf(r);
    const res = await post(port, priorityPath('0002', 1), { token });
    assert.ok(res.status >= 400 && res.status < 500, String(res.status));
    assert.match(JSON.parse(res.body).error, /main/);
    assert.match(readT(r, '0002-two.md'), /^priority: 3 /m);
    assert.equal(headOf(r), before);
  } finally { await stop(p); }
});

test('0077 AC4: the next refresh shows the new priority and moves the ticket to its place; nothing else changes', async () => {
  const a = full('0001', { priority: 2 }), b = full('0002', { priority: 3 }), c = full('0003', { priority: 4 });
  const s = (...t) => ({ tickets: t, ideas: [] });
  const answer = deferred();
  const p = fakePage([s(a, b, c), answer, s(full('0003', { priority: 1 }), clone(a), clone(b))]);
  await p.settle();
  p.press(top(itemOf(p, '0001')));
  const kept = [itemOf(p, '0001'), itemOf(p, '0002')];
  p.press(pTag(p, itemOf(p, '0003')));
  p.press(choices(p, itemOf(p, '0003'))[0]);
  answer.resolve({ ok: true, status: 200, json: async () => ({ ok: true, id: '0003' }) });
  await p.settle();
  assert.deepEqual(items(p).map(n => n.textContent.slice(0, 4)), ['0001', '0002', '0003'], 'unchanged until the refresh');
  await refresh(p);
  assert.deepEqual(items(p).map(n => n.textContent.slice(0, 4)), ['0003', '0001', '0002'], 'moved to its place');
  assert.equal(pTag(p, itemOf(p, '0003')).textContent, 'P1');
  assert.equal(itemOf(p, '0001'), kept[0], 'the other tickets keep their nodes');
  assert.equal(itemOf(p, '0002'), kept[1]);
  assert.ok(isOpen(itemOf(p, '0001')), 'and their open state');
  assert.equal(isOpen(itemOf(p, '0003')), false);
  assert.equal(menuOf(p, p.byId('shaping')), undefined, 'no menu left open');
});

test('0077 AC4: the server\'s next state has the new priority, in priority order', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    r.write('0003-three.md', fm({ id: '"0003"', title: 'Three', priority: 2 }));
    const drafts = async () => JSON.parse((await request(port, { pathName: '/api/state' })).body).tickets.filter(t => t.status === 'draft').map(t => [t.id, t.priority]);
    assert.deepEqual(await drafts(), [['0003', 2], ['0002', 3]]);
    assert.equal((await post(port, priorityPath('0002', 1), { token })).status, 200);
    assert.deepEqual(await drafts(), [['0002', 1], ['0003', 2]]);
  } finally { await stop(p); }
});

test('0077 AC2 (self-check): choosing the priority a ticket already has commits nothing, even with other edits in it', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    r.g('add', 'speck/tickets/0002-two.md'); r.g('commit', '-qm', 'two');
    fs.appendFileSync(path.join(r.dir, 'speck', 'tickets', '0002-two.md'), '\nAn edit in progress.\n');
    const before = headOf(r), file = readT(r, '0002-two.md');
    const res = await post(port, priorityPath('0002', 3), { token });
    assert.equal(res.status, 200, res.body);
    assert.equal(headOf(r), before, 'no commit');
    assert.equal(readT(r, '0002-two.md'), file, 'the file as it was');
    assert.equal(r.g('diff', '--name-only'), 'speck/tickets/0002-two.md', 'with its edit still uncommitted');
  } finally { await stop(p); }
});

test('0077 AC2 (self-check): when the commit fails, the ticket is put back as it was', async () => {
  const { r, port, p, token } = await priorityPanel();
  try {
    fs.writeFileSync(path.join(r.dir, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    const before = headOf(r), file = readT(r, '0002-two.md');
    const res = await post(port, priorityPath('0002', 1), { token });
    assert.equal(res.status, 500);
    assert.match(JSON.parse(res.body).error, /priority is unchanged/);
    assert.equal(headOf(r), before);
    assert.equal(readT(r, '0002-two.md'), file);
    assert.match(r.g('status', '--porcelain', '--', 'speck/tickets/0002-two.md'), /^\?\?/, 'still untracked');
  } finally { await stop(p); }
});
