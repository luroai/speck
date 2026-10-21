// 0357: an approved ticket's review pack in the panel has a box for a note and an "Ask for changes" button, which runs
// speck changes (0356) with the note, as its Ship button runs speck ship (0133).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freePort, startPanel, stop, request, post, tokenOf, fakePage, T, queueRows, deferred } from './support/panel.mjs';
import { gitEnv } from './support/speck.mjs';
import { runIn } from './support/ship.mjs';
import { changesRepo, reviewLog, NOTE } from './support/changes.mjs';
import { panelChanges } from '../scripts/panel-run.mjs';

Object.assign(process.env, gitEnv); // speck changes commits, from a process started by this one

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = () => ({ ideas: [], tickets: [T('0005', 'approved', { started: ago(30) }), T('0006', 'building', { started: ago(10) })] });
const PACK = '## 0005 · Ticket 0005\n**Verdict:** ✅ Approved by reviewer\n';
const answered = (status, body) => ({ ok: status < 400, status, json: async () => body });

// A page whose server answers each changes request with `answer(url, opts)`, and /api/state with `s()`.
function page({ s = STATE, answer = () => answered(200, { ok: true, message: 'Your note is in 0005\'s Review log.' }) } = {}) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/changes$/.test(url)) { sent.push([url, opts]); return answer(url, opts); }
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? { pack: PACK } : s();
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
  });
  p.sent = sent;
  return p;
}
const pane = p => p.byId('full-ticket');
const buttonsIn = (p, n, text) => p.all(n).filter(x => x.tagName === 'button' && (text instanceof RegExp ? text.test(x.textContent) : x.textContent === text));
const askOf = p => buttonsIn(p, pane(p), /^(Ask for changes|Sending)/)[0] || null;
const boxOf = p => p.all(pane(p)).find(n => n.tagName === 'textarea') || null;
const rowOf = (p, id) => queueRows(p).find(r => r.textContent.includes(id));
const type = (box, text) => { box.value = text; box.listeners.input({ target: box }); };
async function openPack(p, id = '0005') {
  await p.settle();
  p.press(rowOf(p, id).children.find(n => n.className === 'top'));
  await p.settle();
  p.press(buttonsIn(p, rowOf(p, id), 'Review pack')[0]);
  await p.settle();
}

test('0357 AC1: an approved ticket\'s pack has a box and an Ask for changes button beside Ship, which can\'t be pressed while the box is empty or only spaces', async () => {
  const p = page();
  await openPack(p);
  const box = boxOf(p), b = askOf(p), ship = buttonsIn(p, pane(p), 'Ship')[0];
  assert.ok(box, 'a text box');
  assert.ok(b, 'an Ask for changes button');
  assert.equal(b.textContent, 'Ask for changes');
  assert.ok(ship, 'the Ship button is still there');
  assert.equal(b.parentNode, ship.parentNode, 'next to the Ship button');
  assert.equal(b.disabled, true, 'empty: can\'t be pressed');
  type(boxOf(p), '   \n\t ');
  assert.equal(askOf(p).disabled, true, 'only spaces: can\'t be pressed');
  p.press(askOf(p));
  await p.settle();
  assert.equal(p.sent.length, 0, 'nothing sent');
  type(boxOf(p), 'Call it Download.');
  assert.equal(askOf(p).disabled, false, 'with a note it can be pressed');
});

test('0357 AC1: a ticket that isn\'t approved has no box or button in its pack', async () => {
  let status = 'approved';
  const p = page({ s: () => ({ ideas: [], tickets: [T('0005', status, { started: ago(30) })] }) });
  await openPack(p);
  assert.ok(askOf(p));
  status = 'reviewing';
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(pane(p).hidden, false, 'the pack stays open');
  assert.equal(askOf(p), null);
  assert.equal(boxOf(p), null);
});

test('0357 AC2: pressing it sends the note with the token, shows it is sending, then shows what speck said', async () => {
  const done = deferred();
  const p = page({ answer: () => done });
  await openPack(p);
  type(boxOf(p), '  Call it Download.  ');
  p.press(askOf(p));
  await p.settle();
  assert.equal(p.sent.length, 1);
  const [url, opts] = p.sent[0];
  assert.equal(url, '/api/tickets/0005/changes');
  assert.equal(opts.method, 'POST');
  assert.equal(opts.headers['X-Speck-Token'], '{{token}}');
  assert.deepEqual(JSON.parse(opts.body), { note: 'Call it Download.' });
  assert.equal(askOf(p).disabled, true, 'can\'t be pressed again while it is sent');
  p.press(askOf(p));
  await p.settle();
  assert.equal(p.sent.length, 1, 'a second press sends nothing more');
  const said = 'Your note is in 0005\'s Review log, and 0005 won\'t ship until it\'s approved again. speck run resumes its build with it.';
  done.resolve(answered(200, { ok: true, message: said }));
  await p.settle();
  assert.ok(p.all(pane(p)).some(n => n._text === said && !/\bbad\b/.test(n.className)), 'what speck said shows');
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.ok(p.all(pane(p)).some(n => n._text === said), 'still there after the next update');
});

test('0357 AC3: a refusal shows speck changes\' reason, and the note stays in the box, after the next update too', async () => {
  const why = 'Ticket 0005 already has changes you asked for waiting for its build. Add to them once it\'s approved again. Nothing was changed.';
  const p = page({ answer: () => answered(409, { error: why }) });
  await openPack(p);
  type(boxOf(p), 'Call it Download.');
  p.press(askOf(p));
  await p.settle();
  const shown = p.all(pane(p)).find(n => n._text === why);
  assert.ok(shown, 'the reason shows');
  assert.match(shown.className, /\bbad\b/);
  assert.equal(boxOf(p).value, 'Call it Download.', 'the note is kept');
  assert.equal(askOf(p).disabled, false, 'it can be tried again');
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(boxOf(p).value, 'Call it Download.');
  assert.ok(p.all(pane(p)).some(n => n._text === why));
  const r = page({ answer: () => { throw new Error('offline'); } });
  await openPack(r);
  type(boxOf(r), 'Call it Download.');
  r.press(askOf(r));
  await r.settle();
  assert.match(pane(r).textContent, /Couldn't reach the panel server/);
  assert.equal(boxOf(r).value, 'Call it Download.');
});

test('0357 AC2 (self-check): once a note is sent the box goes, and opening the pack again brings it back empty', async () => {
  const p = page();
  await openPack(p);
  type(boxOf(p), 'Call it Download.');
  p.press(askOf(p));
  await p.settle();
  assert.equal(boxOf(p), null, 'no box while what speck said shows');
  assert.ok(buttonsIn(p, pane(p), 'Ship')[0], 'Ship is still there');
  p.press(buttonsIn(p, rowOf(p, '0005'), 'Review pack')[0]);
  await p.settle();
  assert.equal(boxOf(p).value, '', 'back, empty');
  assert.doesNotMatch(pane(p).textContent, /Review log/, 'the old message has gone');
});

// ---------- the server ----------

test('0357 AC2: panelChanges runs speck changes with the note and answers with what it said', async () => {
  const r = changesRepo();
  const out = await panelChanges(r.dir, '1', JSON.stringify({ note: NOTE }));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.match(out.body.message, /^Your note is in 0001's Review log/);
  assert.ok(reviewLog(r.ticket()).includes(NOTE), 'the note is in the Review log');
});

test('0357 AC3: when speck changes refuses, panelChanges answers with its message and changes nothing', async () => {
  const r = changesRepo();
  const before = r.head();
  const out = await panelChanges(r.dir, '1', JSON.stringify({ note: '   ' }));
  assert.equal(out.status, 409);
  const cli = runIn(r.dir, 'changes', '1', '   ');
  assert.notEqual(cli.status, 0);
  assert.equal(out.body.error, cli.stderr.trim(), 'the same message as speck changes');
  assert.equal(r.head(), before, 'nothing committed');
  for (const body of ['', 'not json', '{"note":3}', '[]']) {
    const bad = await panelChanges(r.dir, '1', body);
    assert.equal(bad.status, 400, body);
    assert.match(bad.body.error, /Reload/);
  }
  const missing = await panelChanges(r.dir, '42', JSON.stringify({ note: NOTE }));
  assert.equal(missing.status, 404);
  assert.match(missing.body.error, /42/);
  assert.equal(r.head(), before);
});

test('0357 AC2: the panel serves POST /api/tickets/<id>/changes to its own page only', async () => {
  const r = changesRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body), body = JSON.stringify({ note: NOTE });
    for (const opts of [{}, { token: 'nope' }, { token, origin: 'http://evil.example' }]) {
      const res = await post(p.port, '/api/tickets/1/changes', { ...opts, body });
      assert.equal(res.status, 403, JSON.stringify(opts));
    }
    assert.ok(!reviewLog(r.ticket()).includes(NOTE), 'nothing changed');
    const res = await post(p.port, '/api/tickets/1/changes', { token, body });
    assert.equal(res.status, 200, res.body);
    assert.match(JSON.parse(res.body).message, /Review log/);
    assert.ok(reviewLog(r.ticket()).includes(NOTE));
  } finally { await stop(p); }
});
