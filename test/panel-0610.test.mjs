import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, fakePage } from './support/panel.mjs';
import { manualSources } from './support/stream.mjs';

// ---------- 0610: All projects is the project menu's first entry ----------

const foreman = (o = {}) => ({ word: 'Idle', tone: 'ok', mood: 'watching', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
const board = (o = {}) => ({ tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: foreman(), ...o });
const three = { self: 4778, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }, { port: 4779, name: 'notes' }] };
const options = p => p.byId('project').children.map(o => ({ value: o.value, text: o.textContent, selected: o.selected, disabled: !!o.disabled }));
const chosen = p => options(p).filter(o => o.selected).map(o => o.text);
const choose = async (p, value) => { p.byId('project').value = value; p.byId('project').listeners.change(); await p.settle(); };
const opened = async (states, globals) => { const p = fakePage(states, globals); await p.settle(); return p; };

test('0610 AC1: with two or more panels running, All projects is the first entry, the projects under it, and it opens the bridge', async () => {
  for (const projects of [{ self: 4777, list: three.list.slice(0, 2) }, three]) {
    const p = await opened([board({ projects }), { self: projects.self, projects: [] }]);
    assert.deepEqual(options(p).map(o => o.text), ['All projects', ...projects.list.map(x => x.name)]);
    assert.equal(options(p)[0].value, 'all');
    await choose(p, 'all');
    assert.equal(p.byId('bridge').hidden, false, 'the bridge opens');
    assert.equal(p.calls.some(c => /^\/api\/projects\/\d/.test(c.url)), false, 'it switches to no project');
  }
});

test('0610 AC1: there is no All projects button beside the menu', async () => {
  const header = (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';
  assert.doesNotMatch(header, /All projects|bridge/i, 'only the menu, filled in by the page, offers it');
  const made = [];
  const p = fakePage([board({ projects: three })], {}, { made: n => made.push(n) });
  await p.settle();
  const offered = made.filter(n => n.textContent === 'All projects');
  assert.deepEqual(offered.map(n => n.tagName), ['option'], 'All projects once, as the menu\'s entry');
  assert.equal(offered[0].parentNode, p.byId('project'));
});

test('0610 AC1: while the project shown has stopped, All projects still comes first', async () => {
  const { EventSource, sources } = manualSources();
  const p = fakePage([board({ projects: three })], { EventSource });
  const s = sources[0];
  s.emit('open'); s.emit('message', '1'); await p.settle();
  s.emit('gone', JSON.stringify({ port: 4778, list: [{ port: 4777, name: 'speck' }, { port: 4779, name: 'notes' }] }));
  await p.settle();
  assert.deepEqual(options(p).map(o => o.text), ['All projects', 'alpha (stopped)', 'speck', 'notes']);
  assert.deepEqual(chosen(p), ['alpha (stopped)']);
});

test('0610 AC2: with one panel running, there is no All projects entry', async () => {
  for (const projects of [undefined, { self: 4777, list: [{ port: 4777, name: 'speck' }] }]) {
    const p = await opened([board(projects ? { projects } : {})]);
    assert.equal(p.byId('project-pick').hidden, true);
    assert.equal(options(p).some(o => o.text === 'All projects'), false);
  }
});

test('0610 AC3: the menu shows the project shown, or All projects while the bridge is open', async () => {
  const p = await opened([board({ projects: three }), { self: 4778, projects: [] }]);
  assert.deepEqual(chosen(p), ['alpha'], 'the project shown, not the first entry');
  await choose(p, 'all');
  assert.deepEqual(chosen(p), ['All projects']);
  p.key('Escape');
  assert.equal(p.byId('bridge').hidden, true);
  assert.deepEqual(chosen(p), ['alpha'], 'the project shown again');
});
