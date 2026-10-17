import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveOf } from './support/settings.mjs';
import { panelSettings, panelSetSetting, panelSettingRequest } from '../scripts/settings.mjs';

// ---------- 0259: change auto_ship and auto_ship_risk from the panel, asking first before more tickets ship by themselves ----------

Object.assign(process.env, gitEnv); // panelSetSetting commits in this process

const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => fs.readFileSync(cfgOf(r), 'utf8');
const snapshot = r => ({ text: readCfg(r), head: headOf(r), status: r.g('status', '--porcelain') });
const lineOf = (r, key) => readCfg(r).split('\n').find(l => l.startsWith(`${key}:`));

// A Settings view as the server sends it, with auto_ship and auto_ship_risk set to `ship` and `risks`.
const view = (ship, risks) => ({ groups: [{ title: 'Shipping', settings: [
  { key: 'auto_ship', value: ship, default: false, explain: 'What auto_ship does.', editable: true, choices: [true, false] },
  { key: 'auto_ship_risk', value: risks, default: false, explain: 'What auto_ship_risk does.', editable: true, choices: ['low', 'high'] },
] }] });
// A page whose confirm() records what it asked and answers `answer`.
function askingPage(views, saves, answer) {
  const asked = [];
  const p = settingsPage(views, saves, { confirm: msg => { asked.push(String(msg)); return answer; } });
  p.asked = asked;
  return p;
}
const boxesOf = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'input' && n.type === 'checkbox');
const ticked = (p, key) => boxesOf(p, key).filter(b => b.checked).map(b => b.value);
const tick = (p, key, risk, on) => { boxesOf(p, key).find(b => b.value === risk).checked = on; };
const posts = p => p.settingsCalls.filter(c => c.method === 'POST').map(c => c.url);

test('0259 AC1: auto_ship and auto_ship_risk are editable, and a change is saved and committed as 0258\'s are', () => {
  const r = panelRepo();
  const s = byKey(panelSettings(r.dir));
  assert.equal(s.auto_ship.editable, true);
  assert.equal(s.auto_ship_risk.editable, true);
  assert.deepEqual(s.auto_ship.choices, [true, false]);
  assert.deepEqual(s.auto_ship_risk.choices, ['low', 'high']);

  // auto_ship is off, so adding high lets nothing more ship: saved at once.
  const before = readCfg(r).split('\n'), head = headOf(r);
  let out = panelSetSetting(r.dir, 'auto_ship_risk', 'low,high');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const after = readCfg(r).split('\n');
  assert.equal(after.filter((l, i) => l !== before[i]).length, 1, 'one line changed');
  assert.match(lineOf(r, 'auto_ship_risk'), /^auto_ship_risk: \[low, high\]\s+# which ticket risks auto_ship covers/);
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config auto_ship_risk [low, high]');
  assert.equal(r.g('rev-parse', 'HEAD~1'), head);
  assert.equal(r.g('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), 'speck/config.yml');
  assert.deepEqual(byKey(panelSettings(r.dir)).auto_ship_risk.value, ['low', 'high']);

  out = panelSetSetting(r.dir, 'auto_ship', 'true', { confirmed: 'low,high' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.match(lineOf(r, 'auto_ship'), /^auto_ship: true\s+#/);
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config auto_ship true');
  assert.equal(byKey(panelSettings(r.dir)).auto_ship.value, true);

  // The same value writes nothing.
  const was = snapshot(r);
  assert.equal(panelSetSetting(r.dir, 'auto_ship', 'true').body.changed, false);
  assert.equal(panelSetSetting(r.dir, 'auto_ship_risk', 'high,low').body.changed, false);
  assert.deepEqual(snapshot(r), was);
});

test('0259 AC1: they are refused as 0258\'s settings are: a bad value, off the base branch, or with config.yml changed', () => {
  const r = panelRepo();
  let was = snapshot(r);
  let out = panelSetSetting(r.dir, 'auto_ship', 'yes', { confirmed: 'low,high' });
  assert.equal(out.status, 422);
  assert.match(out.body.error, /true or false/);
  out = panelSetSetting(r.dir, 'auto_ship_risk', 'medium');
  assert.equal(out.status, 422);
  assert.match(out.body.error, /low, high or both/);
  assert.deepEqual(snapshot(r), was);

  r.g('checkout', '-q', '-b', 'elsewhere');
  was = snapshot(r);
  out = panelSetSetting(r.dir, 'auto_ship_risk', 'high');
  assert.equal(out.status, 409);
  assert.match(out.body.error, /"elsewhere", not main/);
  assert.deepEqual(snapshot(r), was);
  r.g('checkout', '-q', 'main');

  fs.appendFileSync(cfgOf(r), '# a note of mine\n');
  was = snapshot(r);
  out = panelSetSetting(r.dir, 'auto_ship', 'true', { confirmed: 'low' });
  assert.equal(out.status, 409);
  assert.match(out.body.error, /uncommitted changes/);
  assert.deepEqual(snapshot(r), was);
});

test('0259 AC1: in the view, auto_ship is picked on or off, and auto_ship_risk ticked low, high or both', async () => {
  const p = askingPage([view(false, ['low']), view(false, ['low', 'high'])], [{ ok: true, changed: true }], true);
  await p.settle();
  await openSettings(p);
  const ship = controlOf(p, 'auto_ship');
  assert.equal(ship.tagName, 'select');
  assert.deepEqual(p.all(ship).filter(n => n.tagName === 'option').map(n => n.value), ['true', 'false']);
  assert.equal(ship.value, 'false');
  assert.deepEqual(boxesOf(p, 'auto_ship_risk').map(b => b.value), ['low', 'high']);
  assert.deepEqual(ticked(p, 'auto_ship_risk'), ['low']);
  tick(p, 'auto_ship_risk', 'high', true);
  p.press(saveOf(p, 'auto_ship_risk'));
  await p.settle();
  assert.deepEqual(p.asked, [], 'auto_ship is off: nothing more ships, so no dialog');
  assert.deepEqual(posts(p), ['/api/settings/auto_ship_risk/low%2Chigh']);
  assert.deepEqual(ticked(p, 'auto_ship_risk'), ['low', 'high'], 'the new value, read afresh');
});

test('0259 AC2: turning auto_ship on asks first, naming the tickets that would ship by themselves, and cancelling changes nothing', async () => {
  const p = askingPage([view(false, ['low'])], [], false);
  await p.settle();
  await openSettings(p);
  controlOf(p, 'auto_ship').value = 'true';
  p.press(saveOf(p, 'auto_ship'));
  await p.settle();
  assert.equal(p.asked.length, 1);
  assert.match(p.asked[0], /approved low-risk tickets/);
  assert.doesNotMatch(p.asked[0], /high-risk/);
  assert.match(p.asked[0], /merge.*push.*base branch/s);
  assert.match(p.asked[0], /without waiting for you/);
  assert.deepEqual(posts(p), [], 'nothing is sent');
  assert.equal(controlOf(p, 'auto_ship').value, 'false', 'the view is as it was');
  assert.doesNotMatch(rowOf(p, 'auto_ship').textContent, /refused|couldn't/i);

  // Both risks: it names both.
  const q = askingPage([view(false, ['low', 'high']), view(true, ['low', 'high'])], [{ ok: true, changed: true }], true);
  await q.settle();
  await openSettings(q);
  controlOf(q, 'auto_ship').value = 'true';
  q.press(saveOf(q, 'auto_ship'));
  await q.settle();
  assert.match(q.asked[0], /approved low-risk and high-risk tickets/);
  assert.deepEqual(posts(q), ['/api/settings/auto_ship/true?confirm=low%2Chigh'], 'confirmed: sent, naming the risks it asked about');
  assert.equal(controlOf(q, 'auto_ship').value, 'true');
});

test('0259 AC2: adding a risk while auto_ship is on asks first, and cancelling leaves the boxes as they were', async () => {
  const p = askingPage([view(true, ['low'])], [], false);
  await p.settle();
  await openSettings(p);
  tick(p, 'auto_ship_risk', 'high', true);
  p.press(saveOf(p, 'auto_ship_risk'));
  await p.settle();
  assert.equal(p.asked.length, 1);
  assert.match(p.asked[0], /approved low-risk and high-risk tickets/);
  assert.deepEqual(posts(p), []);
  assert.deepEqual(ticked(p, 'auto_ship_risk'), ['low']);

  const q = askingPage([view(true, ['high']), view(true, ['low', 'high'])], [{ ok: true, changed: true }], true);
  await q.settle();
  await openSettings(q);
  tick(q, 'auto_ship_risk', 'low', true);
  q.press(saveOf(q, 'auto_ship_risk'));
  await q.settle();
  assert.equal(q.asked.length, 1, 'adding low lets more ship too');
  assert.deepEqual(posts(q), ['/api/settings/auto_ship_risk/low%2Chigh?confirm=low%2Chigh']);
});

test('0259 AC2: the server writes nothing that lets more tickets ship by themselves unless the request says it was confirmed', () => {
  const r = panelRepo();
  let was = snapshot(r);
  let out = panelSetSetting(r.dir, 'auto_ship', 'true');
  assert.equal(out.status, 409);
  assert.equal(out.body.confirm, true);
  assert.match(out.body.error, /approved low-risk tickets/);
  assert.deepEqual(snapshot(r), was);
  assert.equal(panelSettingRequest(r.dir, 'auto_ship', 'true').status, 409);
  assert.equal(panelSettingRequest(r.dir, 'auto_ship', 'true', 'low,high').status, 409, 'confirming other risks than would ship');
  assert.equal(panelSettingRequest(r.dir, 'auto_ship', 'true', 'low').status, 200);

  was = snapshot(r);
  out = panelSetSetting(r.dir, 'auto_ship_risk', 'low,high');
  assert.equal(out.status, 409);
  assert.match(out.body.error, /approved low-risk and high-risk tickets/);
  assert.deepEqual(snapshot(r), was);
  assert.equal(panelSetSetting(r.dir, 'auto_ship_risk', 'low,high', { confirmed: 'low,high' }).status, 200);
  assert.deepEqual(byKey(panelSettings(r.dir)).auto_ship_risk.value, ['low', 'high']);
});

test('0259 AC2: a confirmation that names fewer risks than would now ship is refused, and the view reads the settings again', async () => {
  // Another tab added high while auto_ship was off; this one still read low only, and asks about low only.
  const r = panelRepo();
  assert.equal(panelSetSetting(r.dir, 'auto_ship_risk', 'low,high').status, 200);
  const was = snapshot(r);
  const out = panelSetSetting(r.dir, 'auto_ship', 'true', { confirmed: 'low' });
  assert.equal(out.status, 409);
  assert.equal(out.body.confirm, true);
  assert.match(out.body.error, /approved low-risk and high-risk tickets/);
  assert.deepEqual(snapshot(r), was);

  const p = askingPage([view(false, ['low']), view(false, ['low', 'high'])], [{ status: 409, body: out.body }], true);
  await p.settle();
  await openSettings(p);
  controlOf(p, 'auto_ship').value = 'true';
  p.press(saveOf(p, 'auto_ship'));
  await p.settle();
  assert.deepEqual(posts(p), ['/api/settings/auto_ship/true?confirm=low']);
  assert.equal(controlOf(p, 'auto_ship').value, 'false', 'as it is now');
  assert.deepEqual(ticked(p, 'auto_ship_risk'), ['low', 'high'], 'read again');
  assert.match(rowOf(p, 'auto_ship').textContent, /low-risk and high-risk.*hasn't been confirmed/);
  // Saving again asks about what would ship now.
  controlOf(p, 'auto_ship').value = 'true';
  p.press(saveOf(p, 'auto_ship'));
  await p.settle();
  assert.equal(p.asked.length, 2);
  assert.match(p.asked[1], /approved low-risk and high-risk tickets/);
});

test('0259 AC3: turning auto_ship off, or removing a risk, is saved without a dialog', async () => {
  const r = panelRepo();
  assert.equal(panelSetSetting(r.dir, 'auto_ship_risk', 'low,high').status, 200);
  assert.equal(panelSetSetting(r.dir, 'auto_ship', 'true', { confirmed: 'low,high' }).status, 200);
  let out = panelSetSetting(r.dir, 'auto_ship_risk', 'high');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(byKey(panelSettings(r.dir)).auto_ship_risk.value, ['high']);
  out = panelSetSetting(r.dir, 'auto_ship', 'false');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(byKey(panelSettings(r.dir)).auto_ship.value, false);

  const p = askingPage([view(true, ['low', 'high']), view(true, ['low']), view(false, ['low'])], [{ ok: true }, { ok: true }], false);
  await p.settle();
  await openSettings(p);
  tick(p, 'auto_ship_risk', 'high', false);
  p.press(saveOf(p, 'auto_ship_risk'));
  await p.settle();
  controlOf(p, 'auto_ship').value = 'false';
  p.press(saveOf(p, 'auto_ship'));
  await p.settle();
  assert.deepEqual(p.asked, []);
  assert.deepEqual(posts(p), ['/api/settings/auto_ship_risk/low', '/api/settings/auto_ship/false']);
});

test('0259 AC4: auto_ship_risk with no risk ticked is refused, saying to turn auto_ship off instead, and nothing is written', async () => {
  const r = panelRepo();
  const was = snapshot(r);
  for (const v of ['', ' ', '[]']) {
    const out = panelSetSetting(r.dir, 'auto_ship_risk', v, { confirmed: 'low,high' });
    assert.equal(out.status, 422, JSON.stringify(v));
    assert.match(out.body.error, /auto_ship to false/);
  }
  assert.deepEqual(snapshot(r), was);

  const p = askingPage([view(true, ['low'])], [], true);
  await p.settle();
  await openSettings(p);
  tick(p, 'auto_ship_risk', 'low', false);
  p.press(saveOf(p, 'auto_ship_risk'));
  await p.settle();
  assert.deepEqual(posts(p), [], 'nothing is sent');
  assert.deepEqual(p.asked, []);
  assert.match(rowOf(p, 'auto_ship_risk').textContent, /turn auto_ship off/);
});

test('0259 AC2: the panel server passes on that the change was confirmed, and only with its token', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const was = snapshot(r);
    assert.equal((await post(p.port, '/api/settings/auto_ship/true?confirm=low')).status, 403);
    const asked = await post(p.port, '/api/settings/auto_ship/true', { token });
    assert.equal(asked.status, 409);
    assert.equal(JSON.parse(asked.body).confirm, true);
    assert.deepEqual(snapshot(r), was);
    const ok = await post(p.port, '/api/settings/auto_ship/true?confirm=low', { token });
    assert.equal(ok.status, 200, ok.body);
    assert.match(lineOf(r, 'auto_ship'), /^auto_ship: true /);
  } finally { await stop(p); }
});
