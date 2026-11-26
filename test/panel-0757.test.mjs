import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0757: the page at speck serve's address: its own page, All projects and nothing else, and a project's page shown there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage } from './support/panel.mjs';

const SERVE_PAGE = { ids: { 'speck-serve': { content: '1' } } }; // as speck serve fills in its own page
const summary = (port, name, o = {}) => ({ port, name, running: true, status: 'Idle', tone: 'idle', mood: 'watching', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [], ...o });
const three = { self: null, usage: [], projects: [
  summary(4801, 'alpha', { status: 'Needs you 1', needs_you: 1, needs: [{ id: '0007', title: 'Pick a colour', why: 'question', detail: 'Blue or green?' }] }),
  summary(4802, 'bravo', { status: 'Building 1', building: 1, busy: true }),
  { port: null, name: 'charlie', running: false },
] };
const board = extra => ({ tickets: [T('0001', 'ready'), T('0007', 'blocked', { title: 'Pick a colour' })], ideas: [], ...extra });
const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const within = (p, cls) => nodes(p.byId('bridge')).filter(n => String(n.className || '').split(' ').includes(cls));
const press = n => n.listeners.click({ stopPropagation() {} });
const storage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
const projectCalls = p => p.calls.filter(c => /^\/api\/projects\/\d+$/.test(c.url));
const options = p => p.byId('project').children.map(o => ({ value: o.value, text: o.textContent, selected: o.selected }));
// The page's fetch at speck serve's address, where every answer says so (X-Speck-Serve), answering with `answers` in turn.
function serveFetch(answers) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const next = answers.shift(), headers = { get: k => (/^x-speck-serve$/i.test(k) ? '1' : null) };
    if (next && next.status) return { ok: false, status: next.status, headers, json: async () => next.body };
    return { ok: true, status: 200, headers, json: async () => next };
  };
  return { fetch, calls };
}

// ---------- speck serve's own page: All projects ----------

test('0757 AC2: speck serve\'s own page opens on All projects, with nothing to go back to, and asks for no board or stream', async () => {
  const streams = [];
  class Source { constructor(url) { streams.push(url); } addEventListener() {} close() {} }
  const p = fakePage([three], { EventSource: Source }, SERVE_PAGE);
  await p.settle();
  assert.equal(p.byId('bridge').hidden, false, 'All projects is open');
  assert.equal(within(p, 'bridge-heading')[0].textContent, 'All projects');
  assert.equal(within(p, 'back').length, 0, 'with no Back, as there\'s no project under it');
  assert.deepEqual(p.calls.map(c => [c.url, c.opts && c.opts.method]), [['/api/projects/summary', 'POST']], 'it asks only for the projects');
  assert.deepEqual(streams, [], 'and opens no stream of a board');
  assert.deepEqual(within(p, 'bridge-name').map(n => n.textContent), ['alpha', 'bravo', 'charlie'], 'every project on the list');
  assert.equal(p.document.title, 'speck · All projects');
  assert.ok([...p.intervals.values()].some(i => i.ms === 5000), 'asked for again every 5 seconds');
  p.key('Escape');
  assert.equal(p.byId('bridge').hidden, false, 'Escape leaves it open');
});

test('0757 AC2: pressing a project there shows its panel at the address, and a ticket\'s card keeps the ticket to open there', async () => {
  let reloaded = 0;
  const p = fakePage([three, { ok: true }], { location: { reload: () => { reloaded++; } } }, SERVE_PAGE);
  await p.settle();
  press(within(p, 'bridge-row')[1]);
  await p.settle();
  assert.deepEqual(projectCalls(p).map(c => [c.url, c.opts.method]), [['/api/projects/4802', 'POST']], 'bravo, by its panel\'s port');
  assert.equal(reloaded, 1, 'and the page reloads, as bravo\'s');
  const s = storage();
  const q = fakePage([three, { ok: true }], { sessionStorage: s, location: { reload() {} } }, SERVE_PAGE);
  await q.settle();
  press(within(q, 'bridge-card')[0]);
  await q.settle();
  assert.deepEqual(projectCalls(q).map(c => c.url), ['/api/projects/4801']);
  assert.deepEqual(JSON.parse(s.m.get('speck-open-ticket')), { port: 4801, id: '0007' });
});

test('0757 AC2: a choice refused there says why on All projects, which stays open', async () => {
  const s = storage();
  const p = fakePage([three, { status: 404, body: { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' } }], { sessionStorage: s }, SERVE_PAGE);
  await p.settle();
  press(within(p, 'bridge-card')[0]);
  await p.settle();
  assert.equal(p.byId('bridge').hidden, false);
  assert.equal(within(p, 'bridge-error')[0].textContent, 'Couldn\'t show that project: That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.');
  assert.equal(s.m.has('speck-open-ticket'), false, 'and the ticket isn\'t kept for a page that won\'t come');
  const q = fakePage([three, new Error('offline')], {}, SERVE_PAGE);
  await q.settle();
  press(within(q, 'bridge-row')[0]);
  await q.settle();
  assert.equal(within(q, 'bridge-error')[0].textContent, 'Couldn\'t show that project: can\'t reach speck serve.');
});

test('0757 AC2: a failed read there names speck serve, and an empty list says how to add a project', async () => {
  const p = fakePage([new Error('offline')], {}, SERVE_PAGE);
  await p.settle();
  assert.equal(within(p, 'bridge-error')[0].textContent, 'Couldn\'t read your projects: can\'t reach speck serve.');
  const q = fakePage([{ self: null, usage: [], projects: [] }], {}, SERVE_PAGE);
  await q.settle();
  assert.deepEqual(within(q, 'bridge-none').map(n => n.textContent), ['Nothing needs you.', 'No projects on your list yet. Add one with speck projects add.']);
});

test('0757 AC4: a project with no panel running is on All projects as Not answering, counts for nothing, and pressing it says why without asking', async () => {
  const p = fakePage([three], {}, SERVE_PAGE);
  await p.settle();
  const row = within(p, 'bridge-row')[2];
  assert.deepEqual(nodes(row).filter(n => /^bridge-(name|line)$/.test(n.className)).map(n => n.textContent), ['charlie', 'Not answering']);
  assert.equal(nodes(row).find(n => /^bridge-dot/.test(n.className)).className, 'bridge-dot gone');
  assert.equal(within(p, 'bridge-counts')[0].textContent, '1 building · 1 project busy · 1 needs you', 'only the projects that answered count');
  press(row);
  await p.settle();
  assert.deepEqual(projectCalls(p), [], 'it isn\'t asked for');
  assert.equal(within(p, 'bridge-error')[0].textContent, 'Couldn\'t show that project: charlie\'s panel isn\'t running, so it can\'t be shown. speck serve\'s output says why.');
  // Two projects of the same name, one with no panel, are told apart by the one's port only.
  const q = fakePage([{ self: null, usage: [], projects: [summary(4801, 'app'), { port: null, name: 'app', running: false }] }], {}, SERVE_PAGE);
  await q.settle();
  assert.deepEqual(within(q, 'bridge-name').map(n => n.textContent), ['app · 4801', 'app']);
});

// ---------- a project's page at speck serve's address ----------

test('0757 AC2: at speck serve\'s address, a project\'s menu goes back to All projects even while its panel is the only one running', async () => {
  const { fetch, calls } = serveFetch([board(), three]);
  const p = fakePage([], { fetch });
  await p.settle();
  assert.equal(p.byId('project-pick').hidden, false, 'the menu is there');
  assert.deepEqual(options(p), [{ value: 'all', text: 'All projects', selected: false }, { value: '', text: 'This project', selected: true }]);
  p.byId('project').value = 'all';
  p.byId('project').listeners.change();
  await p.settle();
  assert.equal(p.byId('bridge').hidden, false, 'All projects opens');
  assert.equal(calls.at(-1).url, '/api/projects/summary');
  assert.deepEqual(within(p, 'bridge-name').map(n => n.textContent), ['alpha', 'bravo', 'charlie'], 'with every project on speck serve\'s list');
  assert.equal(within(p, 'back').length, 1, 'and Back to this project');
  press(within(p, 'back')[0]);
  assert.equal(p.byId('bridge').hidden, true);
  // Away from speck serve, a panel on its own still has no menu.
  const q = fakePage([board()]);
  await q.settle();
  assert.equal(q.byId('project-pick').hidden, true);
});

test('0757 AC2: at speck serve\'s address, the menu goes to any other project', async () => {
  let reloaded = 0;
  const { fetch, calls } = serveFetch([board({ projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }, { port: 4802, name: 'bravo' }] } }), { ok: true }]);
  const p = fakePage([], { fetch, location: { reload: () => { reloaded++; } } });
  await p.settle();
  assert.deepEqual(options(p).map(o => o.text), ['All projects', 'alpha', 'bravo']);
  assert.equal(options(p).find(o => o.selected).text, 'alpha');
  p.byId('project').value = '4802';
  p.byId('project').listeners.change();
  await p.settle();
  assert.deepEqual(calls.filter(c => /^\/api\/projects\/\d+$/.test(c.url)).map(c => [c.url, c.opts.method]), [['/api/projects/4802', 'POST']]);
  assert.equal(reloaded, 1);
});

test('0757 AC2: a ticket pressed on All projects opens on its project\'s page there, its panel the only one running', async () => {
  const s = storage();
  s.setItem('speck-open-ticket', JSON.stringify({ port: 4801, id: '0007' }));
  const { fetch } = serveFetch([board()]);
  const p = fakePage([], { fetch, sessionStorage: s });
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the ticket is open');
  assert.equal(s.m.has('speck-open-ticket'), false);
  // Away from speck serve, a panel that can't say which port it is opens nothing.
  const t = storage();
  t.setItem('speck-open-ticket', JSON.stringify({ port: 4801, id: '0007' }));
  const q = fakePage([board()], { sessionStorage: t });
  await q.settle();
  assert.equal(q.byId('full-ticket').hidden, true);
});

test('0757 AC4 self-check: at speck serve\'s address, a stopped project\'s page says speck serve starts it again, rather than to start it by hand', async () => {
  const sources = [];
  class Source { constructor() { this.on = {}; sources.push(this); } addEventListener(t, f) { this.on[t] = f; } close() {} }
  const { fetch } = serveFetch([board({ projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }, { port: 4802, name: 'bravo' }] } })]);
  const p = fakePage([], { fetch, EventSource: Source });
  sources[0].on.message({ data: '1' });
  await p.settle();
  sources[0].on.gone({ data: JSON.stringify({ port: 4801, list: [{ port: 4802, name: 'bravo' }] }) });
  await p.settle();
  assert.equal(p.byId('offline').textContent, 'alpha\'s panel has stopped, so this shows the last state received. speck serve starts it again by itself, or pick another project from the menu at the top.');
  assert.deepEqual(options(p).map(o => o.text), ['All projects', 'alpha (stopped)', 'bravo'], 'All projects still there, with one project left');
});
