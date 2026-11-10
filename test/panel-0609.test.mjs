import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, full, click, page, styles } from './support/panel.mjs';

// ---------- 0609: Build's tab shows only its count, not a needs-you number beside it ----------

const TAB = { capture: 'tab-capture', plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const board = word => ({
  ideas: [],
  tickets: [full('0001', { title: 'A draft' }), full('0003', { status: 'ready', title: 'Queued' }), full('0005', { status: 'blocked', title: 'Stuck' })],
  foreman: { word, tone: /^Needs you/.test(word) ? 'bad' : 'idle' },
  run: { on: true },
});
function livePage(s) {
  const box = { state: s };
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(box.state))) }) });
  p.set = next => { box.state = next; };
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const tabHtml = id => page().match(new RegExp(`<button [^>]*id="${id}"[^>]*>([\\s\\S]*?)</button>`))[1];
const WORDS = ['Needs you 3', 'Needs you 12', 'Needs you 1', 'Building', 'Idle'];

// ---------- AC1 ----------

test('0609 AC1: Build\'s tab holds its name and its count only, like the other tabs', () => {
  assert.equal(tabHtml('tab-build'), '<span class="tab-name">Build</span><span class="tab-n" id="tab-build-n"></span>');
  for (const l of ['capture', 'plan', 'shipped']) assert.doesNotMatch(tabHtml(TAB[l]), /needs/);
  assert.equal(page().includes('id="build-needs"'), false, 'no needs-you number anywhere in the tabs');
  assert.doesNotMatch(styles(), /\.tab \.needs/, 'no style left for it');
});

test('0609 AC1: whatever needs you, and whichever lane is open, Build\'s tab shows "Build" and its count', async () => {
  const p = livePage(board(WORDS[0]));
  await p.settle();
  for (const word of WORDS) {
    p.set(board(word));
    await refresh(p);
    for (const l of ['build', 'plan', 'shipped', 'capture']) {
      click(p.byId(TAB[l]));
      assert.equal(p.byId('build-needs').textContent, '', `"${word}", ${l} open: no needs-you number written`);
      assert.equal(p.byId('tab-build-n').textContent, '2', `"${word}", ${l} open: its count, the tab's only number`);
    }
  }
});

// ---------- AC2 ----------

test('0609 AC2: the black bar still says how many need you', async () => {
  const p = livePage(board('Needs you 3'));
  await p.settle();
  assert.equal(p.byId('bar-needs-part').hidden, false);
  assert.equal(p.byId('bar-needs').textContent, '3 need you');
  p.set(board('Needs you 1'));
  await refresh(p);
  assert.equal(p.byId('bar-needs').textContent, '1 needs you');
  p.set(board('Building'));
  await refresh(p);
  assert.equal(p.byId('bar-needs-part').hidden, true);
});

// ---------- AC3 ----------

test('0609 AC3: a screen reader reads Build as it reads the others, its name and its count, whatever needs you', async () => {
  const p = livePage(board(WORDS[0]));
  await p.settle();
  const label = l => (p.byId(TAB[l]).attrs || {})['aria-label'];
  for (const word of WORDS) {
    p.set(board(word));
    await refresh(p);
    assert.match(label('build'), /^Build, \d+ tickets?$/, `"${word}"`);
    assert.match(label('plan'), /^Plan, \d+ tickets?$/, `"${word}": as Plan reads`);
  }
});
