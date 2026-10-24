import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, agentRows, rowNamed, buttonIn, keyInputOf, typeKey, focusedKey, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { settingsAnswer, panelAgentRequest, panelKeyAddRequest } from '../scripts/settings.mjs';
import { readYourAgents } from '../scripts/your-agents.mjs';
import { providerKey } from '../scripts/keys.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0399: set up your agents in Settings ----------

const KEY = 'sk-0399-secret-Hq82w';
const find = (found = AGENTS_FOUND) => async () => structuredClone(found);
const answerOf = r => settingsAnswer(r.dir, async () => ({ models: [] }), async () => ({ models: [] }), find());
const viewRow = (answer, id) => answer.your_agents.agents.find(a => a.id === id);
const head = r => r.g('rev-parse', 'HEAD');

test('0399 AC1: the Settings answer lists each agent with whether it is yours, ready, and the roles using it', async () => {
  const r = panelRepo();
  const answer = await answerOf(r);
  assert.equal(answer.your_agents.list, false);
  assert.deepEqual(answer.your_agents.agents.map(a => a.id), ['claude', 'codex', 'cursor', 'deepseek']);
  const claude = viewRow(answer, 'claude'), cursor = viewRow(answer, 'cursor'), deepseek = viewRow(answer, 'deepseek');
  assert.equal(claude.yours, true);
  assert.equal(claude.installed, true);
  assert.equal(claude.signed_in, true);
  assert.deepEqual(claude.roles, ['builder', 'speck']);
  assert.deepEqual(viewRow(answer, 'codex').roles, ['reviewer']);
  assert.equal(cursor.yours, false);
  assert.equal(cursor.installed, false);
  assert.equal(deepseek.kind, 'provider');
  assert.equal(deepseek.key_set, false);
  assert.equal(deepseek.yours, false);
});

test('0399 AC1: Your agents comes after Auto-build, listing each of your agents with its state and a Remove button', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()));
  await openSettings(p);
  const pane = p.byId('settings');
  const groups = pane.children.filter(n => /\b(sgroup|switches)\b/.test(n.className || ''));
  assert.match(groups[0].className, /\bswitches\b/, 'Appearance and Auto-build first');
  assert.equal(groups[1], agentsBox(p), 'then Your agents');
  assert.match(groups[1].textContent, /^Your agents/);
  const rows = agentRows(p);
  assert.deepEqual(rows.map(r => p.all(r).find(n => /\bname\b/.test(n.className || '')).textContent), ['Claude Code', 'Codex', 'DeepSeek']);
  assert.match(rowNamed(p, 'Claude Code').textContent, /Installed, signed in/);
  assert.match(rowNamed(p, 'Codex').textContent, /Installed, not signed in/);
  assert.match(rowNamed(p, 'Codex').textContent, /codex login/);
  assert.match(rowNamed(p, 'DeepSeek').textContent, /Key set/);
  for (const name of ['Claude Code', 'Codex', 'DeepSeek']) assert.ok(buttonIn(p, rowNamed(p, name), 'Remove'), name);
});

test('0399 AC1: removing an agent a role uses is refused, naming the role, and removing another takes it off the list', async () => {
  const r = panelRepo();
  const refused = await panelAgentRequest(r.dir, 'codex', 'remove', { find: find() });
  assert.equal(refused.status, 422);
  assert.match(refused.body.error, /Codex is the reviewer/);
  assert.equal(readYourAgents(r.dir), null, 'nothing changed');
  assert.ok(refused.body.your_agents.agents.find(a => a.id === 'codex').yours);
  const both = await panelAgentRequest(r.dir, 'claude', 'remove', { find: find() });
  assert.match(both.body.error, /Claude Code is the builder and the agent speck watches with/);
  const found = structuredClone(AGENTS_FOUND);
  found.agents.find(a => a.id === 'cursor').installed = found.agents.find(a => a.id === 'cursor').signed_in = true;
  delete found.agents.find(a => a.id === 'cursor').why;
  const ok = await panelAgentRequest(r.dir, 'cursor', 'remove', { find: find(found) });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.match(ok.body.said, /Removed Cursor/);
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex']);
  assert.equal(ok.body.your_agents.agents.find(a => a.id === 'cursor').yours, false);
  for (const name of ['nobody', '__proto__', 'constructor', '%E0%A4%A']) assert.equal((await panelAgentRequest(r.dir, name, 'remove', { find: find() })).status, 404, name);
});

test('0399 AC1: the page shows the server\'s refusal to remove the reviewer\'s agent, and keeps it listed', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()), { '/api/agents/codex/remove': { status: 422, body: { error: 'Codex is the reviewer, so it wasn\'t removed.', your_agents: YOURS_VIEW() } } });
  await openSettings(p);
  p.press(buttonIn(p, rowNamed(p, 'Codex'), 'Remove'));
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/agents/codex/remove']);
  assert.match(agentsBox(p).textContent, /Codex is the reviewer/);
  assert.ok(rowNamed(p, 'Codex'));
});

test('0399 AC2: Add an agent offers each agent that is not yours: an installed one can be added, one that is not says how to install it', async () => {
  const r = panelRepo();
  const answer = await answerOf(r);
  assert.match(viewRow(answer, 'cursor').install, /cursor\.com\/docs\/cli\/installation/);
  const found = structuredClone(AGENTS_FOUND);
  Object.assign(found.agents.find(a => a.id === 'cursor'), { installed: true, signed_in: false, why: 'Cursor isn\'t signed in: run agent login.' });
  const head0 = head(r);
  const added = await panelAgentRequest(r.dir, 'cursor', 'add', { find: find(found) });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex', 'cursor']);
  assert.equal(head(r), head0, 'no commit');
  assert.equal(r.g('status', '--porcelain'), '', 'nothing git sees');
  const missing = await panelAgentRequest(panelRepo().dir, 'cursor', 'add', { find: find() });
  assert.equal(missing.status, 422);
  assert.match(missing.body.error, /Cursor isn't installed/);

  const view = YOURS_VIEW();
  const p = agentsPage(settingsWithAgents(view), { '/api/agents/cursor/add': { ok: true, said: 'Added Cursor to your agents on this machine.', your_agents: YOURS_VIEW({ cursor: true }) } });
  await openSettings(p);
  assert.doesNotMatch(agentsBox(p).textContent, /cursor\.com/, 'the offers show once Add an agent is pressed');
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  await p.settle();
  const offered = p.all(agentsBox(p)).filter(n => /\boffer\b/.test(n.className || ''));
  // 0408: TestCo, a provider with no key, isn't offered: it's added with Add an API provider.
  assert.deepEqual(offered.map(n => p.all(n).find(x => /\bname\b/.test(x.className || '')).textContent), ['Cursor']);
  assert.ok(!buttonIn(p, rowNamed(p, 'Cursor', true), 'Add'), 'not installed: nothing to add');
  assert.match(rowNamed(p, 'Cursor', true).textContent, /Install the Cursor CLI/);
  assert.equal(keyInputOf(p, 'testco'), undefined, '0408: a provider with no key is not offered');
});

test('0399 AC2: adding an installed agent from the page adds it to the list', async () => {
  const view = YOURS_VIEW({ cursorInstalled: true });
  const p = agentsPage(settingsWithAgents(view), { '/api/agents/cursor/add': { ok: true, said: 'Added Cursor to your agents on this machine.', your_agents: YOURS_VIEW({ cursor: true }) } });
  await openSettings(p);
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  p.press(buttonIn(p, rowNamed(p, 'Cursor', true), 'Add'));
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/agents/cursor/add']);
  assert.ok(p.posts()[0].headers['X-Speck-Token']);
  assert.ok(buttonIn(p, rowNamed(p, 'Cursor'), 'Remove'), 'now one of yours');
  assert.match(agentsBox(p).textContent, /Added Cursor/);
});

test('0399 AC3: adding a provider asks for its key in an empty password field, and it joins your list once saved, with no commit', async () => {
  const r = panelRepo();
  const head0 = head(r);
  const out = await panelKeyAddRequest(r.dir, 'deepseek', JSON.stringify({ key: KEY }), { find: find() });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.deepEqual(readYourAgents(r.dir), ['claude', 'codex', 'deepseek']);
  assert.equal(out.body.your_agents.agents.find(a => a.id === 'deepseek').yours, true);
  assert.doesNotMatch(JSON.stringify(out.body), new RegExp(KEY));
  assert.equal(head(r), head0, 'no commit');
  assert.equal(r.g('status', '--porcelain'), '', 'nothing git sees');
  const bad = await panelKeyAddRequest(r.dir, 'deepseek', JSON.stringify({ key: 'has a space' }), { find: find() });
  assert.equal(bad.status, 422);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY, 'a refused key changes nothing');

  // 0408: on the page, a provider with no key isn't offered under Add an agent, so its key is pasted in its own row
  // once it's one of yours.
  const view = YOURS_VIEW({ testco: true });
  Object.assign(view.agents.find(a => a.id === 'testco'), { ready: false, key_set: false });
  const p = agentsPage(settingsWithAgents(view), { '/api/keys/testco': { ok: true, provider: 'testco', key_set: true, your_agents: YOURS_VIEW({ testco: true }) } });
  await openSettings(p);
  const input = keyInputOf(p, 'testco');
  assert.equal(input.type, 'password');
  assert.equal(input.value, '');
  typeKey(p, 'testco', KEY);
  p.press(buttonIn(p, rowNamed(p, 'TestCo'), 'Save key'));
  await p.settle();
  const posts = p.posts();
  assert.deepEqual(posts.map(c => c.url), ['/api/keys/testco']);
  assert.equal(JSON.parse(posts[0].body).key, KEY);
  assert.ok(!posts[0].url.includes(KEY));
  assert.ok(buttonIn(p, rowNamed(p, 'TestCo'), 'Remove'), 'one of yours');
  assert.equal(keyInputOf(p, 'testco').value, '', 'the field is empty again');
  assert.doesNotMatch(agentsBox(p).textContent, new RegExp(KEY));
});

test('0399 AC3: a saved key is never shown, and can be replaced from the provider\'s row', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()), { '/api/keys/deepseek': { ok: true, provider: 'deepseek', key_set: true, your_agents: YOURS_VIEW() } });
  await openSettings(p);
  const input = keyInputOf(p, 'deepseek');
  assert.equal(input.type, 'password');
  assert.equal(input.value, '', 'a saved key is never shown');
  assert.match(input.placeholder, /replace/);
  typeKey(p, 'deepseek', KEY);
  p.press(buttonIn(p, rowNamed(p, 'DeepSeek'), 'Replace key'));
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/keys/deepseek']);
  assert.match(agentsBox(p).textContent, /Saved the DeepSeek API key/);
  assert.ok(!p.posts().some(c => c.url.startsWith('/api/settings')), 'the settings aren\'t saved with it');
  // An empty field sends nothing.
  p.press(buttonIn(p, rowNamed(p, 'DeepSeek'), 'Replace key'));
  await p.settle();
  assert.equal(p.posts().length, 1);
  assert.match(agentsBox(p).textContent, /Paste the DeepSeek API key first/);
});

test('0399 AC4: a change redraws only the group, in the same box, and the focus stays on the same control or moves to the next one', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW({ cursorInstalled: true })), {
    '/api/agents/cursor/add': { ok: true, said: 'Added Cursor.', your_agents: YOURS_VIEW({ cursor: true }) },
    '/api/agents/cursor/remove': { ok: true, said: 'Removed Cursor.', your_agents: YOURS_VIEW({ cursorInstalled: true }) } });
  await openSettings(p);
  const box = agentsBox(p), others = p.byId('settings').children.filter(n => n !== box);
  const detached = others.map(n => n.detached || 0);
  const adding = buttonIn(p, box, 'Add an agent');
  adding.focus();
  p.press(adding);
  assert.equal(focusedKey(p), 'adding', 'the focus stays on the button, now Done');
  const add = buttonIn(p, rowNamed(p, 'Cursor', true), 'Add');
  add.focus();
  p.press(add);
  assert.equal(focusedKey(p), 'add:cursor', 'kept while it adds');
  await p.settle();
  assert.equal(focusedKey(p), 'remove:cursor', 'on the added agent\'s Remove');
  p.press(buttonIn(p, rowNamed(p, 'Cursor'), 'Remove'));
  await p.settle();
  assert.equal(focusedKey(p), 'adding', 'on Add an agent once it is gone');
  assert.equal(agentsBox(p), box, 'the same box');
  assert.deepEqual(p.byId('settings').children.filter(n => n !== box), others, 'the rest of the view is as it was');
  assert.deepEqual(others.map(n => n.detached || 0), detached, 'nothing else drawn again');
});

test('0399 AC2: a provider removed with its key still kept can be added back without pasting it again', async () => {
  const view = YOURS_VIEW();
  Object.assign(view.agents.find(a => a.id === 'testco'), { key_set: true, ready: true });
  delete view.agents.find(a => a.id === 'testco').why;
  const p = agentsPage(settingsWithAgents(view), { '/api/agents/testco/add': { ok: true, said: 'Added TestCo to your agents on this machine.', your_agents: YOURS_VIEW({ testco: true }) } });
  await openSettings(p);
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  assert.doesNotMatch(rowNamed(p, 'TestCo', true).textContent, /Paste your TestCo API key/);
  p.press(buttonIn(p, rowNamed(p, 'TestCo', true), 'Add'));
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/agents/testco/add']);
  assert.ok(rowNamed(p, 'TestCo'));
});

test('0399 AC1: the README names the group and its Add an agent as Settings shows them', () => {
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /\*\*Your agents\*\* group/);
  assert.match(readme, /\*\*Add an agent\*\*/);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0399 AC4: at 320 px the group fits the window, with every agent and the key fields open', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    const view = JSON.stringify(settingsWithAgents(YOURS_VIEW({ long: true })));
    await b.js(`(() => { const real = window.fetch; window.fetch = (u, o) => String(u).startsWith('/api/settings') ? Promise.resolve(new Response(${JSON.stringify(view)}, { headers: { 'Content-Type': 'application/json' } })) : real(u, o);
      document.getElementById('settings-open').click(); return true; })()`);
    await b.until(`!!document.querySelector('#settings .agents .add button')`, 'Your agents');
    await b.js(`document.querySelector('#settings .agents .add button').click(); true`);
    await b.until(`document.querySelectorAll('#settings .agents .offer').length === 1`, 'the offers');
    await b.js('document.fonts.ready.then(() => true)');
    const out = await b.js(`(() => {
      const pane = document.getElementById('settings'), box = pane.querySelector('.agents'), r = box.getBoundingClientRect();
      const over = [...box.querySelectorAll('*')].map(n => [n, n.getBoundingClientRect()]).filter(([, x]) => x.width && (x.right > r.right + 0.5 || x.left < r.left - 0.5)).map(([n]) => n.outerHTML.slice(0, 80));
      return { over, wide: pane.scrollWidth > pane.clientWidth, right: r.right, width: innerWidth };
    })()`);
    assert.deepEqual(out.over, [], 'nothing sticks out of the group');
    assert.equal(out.wide, false, 'nothing to scroll sideways');
    assert.ok(out.right <= out.width, JSON.stringify(out));
  } finally { await b.close(); }
});
