import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, panelRepo, startPanel, stop, request, freePort } from './support/panel.mjs';
import { foremanView } from '../scripts/foreman.mjs';

// ---------- 0495: what the Foreman says about the base branch and a wait (0581: speck's captions went with the screen) ----------

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });

test('0495 AC2: the Foreman gives the base branch\'s name, and the panel sends it with its state', async () => {
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [], base: 'trunk' }).base, 'trunk');
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [] }).base, '', 'blank when not given');
  const { dir } = panelRepo();
  const p = await startPanel(dir, ['--port', String(await freePort())]);
  try {
    assert.equal(JSON.parse((await request(p.port, { pathName: '/api/state' })).body).foreman.base, 'main');
  } finally { await stop(p); }
});

const WAITS = [
  ['other tickets', rec({ ready: [{ id: '0002', kind: 'after', why: 'waiting for 0009' }] }), [T('0002', 'ready')], 'waiting for 0009'],
  ['build slots', rec({ ready: [{ id: '0002', kind: 'slots', why: 'all 1 build slot in use' }] }), [T('0002', 'ready')], 'all 1 build slot in use'],
  ['on hold', rec({ ship: { running: null, hold: { message: 'paused' }, refused: [] } }), [], 'Shipping is paused'],
  ['new commit', rec({ ship: { running: null, hold: null, refused: [{ id: '0003', message: 'new commits' }] } }), [], 'new commits'],
  ['new code', rec({ switching: { why: 'speck run is switching' } }), [], 'speck run is switching'],
];
for (const [short, record, tickets, why] of WAITS) {
  test(`0495 AC3: Waiting: ${short} gives its reason`, () => {
    const v = foremanView({ run: ON, record, tickets });
    assert.equal(v.word, `Waiting: ${short}`);
    assert.equal(v.why, why);
  });
}

test('0495 AC3: the Foreman gives no reason when it isn\'t waiting', () => {
  assert.equal(foremanView({ run: ON, record: rec({ building: ['0001'] }), tickets: [T('0001', 'building')] }).why, '');
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [] }).why, '');
});
