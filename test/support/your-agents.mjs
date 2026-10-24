// 0399's helpers for the Settings view's "Your agents" group, shared with 0393's tests of the provider key field.

import { fakePage } from './panel.mjs';
import { CLAUDE_MODELS } from '../../scripts/settings.mjs';

// The agents findAgentsAsync finds, without models: Claude Code ready, Codex installed and signed in, Cursor not installed.
export const AGENTS_FOUND = Object.freeze({ agents: [
  { id: 'claude', name: 'Claude Code', command: 'claude', installed: true, signed_in: true },
  { id: 'codex', name: 'Codex', command: 'codex', installed: true, signed_in: true },
  { id: 'cursor', name: 'Cursor', command: 'agent', installed: false, signed_in: false, why: 'Cursor isn\'t installed.' }] });

// "Your agents" as the server gives it: Claude Code, Codex (not signed in) and DeepSeek (its key set) yours; Cursor, not
// installed unless `cursorInstalled`, and TestCo, a provider with no key, not yours unless `cursor` or `testco`.
// `long` makes Codex's reason long, as a narrow window must fit.
export function YOURS_VIEW({ cursor = false, cursorInstalled = cursor, testco = false, long = false } = {}) {
  const codexWhy = long ? 'Codex isn\'t signed in: run codex login, then reload this view. https://github.com/openai/codex/blob/main/docs/authentication-and-signing-in.md' : 'Codex isn\'t signed in: run codex login.';
  return { list: true, agents: [
    { id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: ['builder', 'speck'] },
    { id: 'codex', name: 'Codex', kind: 'agent', yours: true, ready: false, installed: true, signed_in: false, why: codexWhy, roles: ['reviewer'] },
    { id: 'cursor', name: 'Cursor', kind: 'agent', yours: cursor, ready: cursorInstalled, installed: cursorInstalled, signed_in: cursorInstalled, roles: [],
      ...(cursorInstalled ? {} : { why: 'Cursor isn\'t installed.', install: 'Install the Cursor CLI: https://cursor.com/docs/cli/installation' }) },
    { id: 'deepseek', name: 'DeepSeek', kind: 'provider', yours: true, ready: true, key_set: true, roles: [] },
    { id: 'testco', name: 'TestCo', kind: 'provider', yours: testco, ready: testco, key_set: testco, roles: [],
      ...(testco ? {} : { why: 'TestCo has no API key on this machine: set one with speck keys set testco.' }) }] };
}

const row = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
// A Settings view, as GET /api/settings gives it, with `yours` as its Your agents.
export const settingsWithAgents = yours => ({ groups: [
  { title: 'Building and reviewing', settings: [row('builder', 'claude', { choices: ['claude', 'codex', 'cursor', 'deepseek'] }), row('max_parallel_builds', 4)] },
  { title: 'Watching', settings: [row('foreman', '', { choices: ['', 'claude', 'codex', 'cursor', 'deepseek'] })] }],
  builder_models: { builder: 'claude', models: CLAUDE_MODELS }, claude_models: CLAUDE_MODELS,
  providers: [{ name: 'deepseek', label: 'DeepSeek', models: [], default_model: 'deepseek-v4-pro', key_set: true }], your_agents: yours });

// A page whose fetch answers GET /api/settings with `view`, each POST to an address in `answers` with its answer (one
// with a status fails with it), and the rest with an empty board. Each node can take the focus, as a browser's can.
export function agentsPage(view, answers = {}) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method, headers: opts.headers || {}, body: opts.body });
    let body = method === 'POST' ? answers[u] : u.startsWith('/api/settings') ? structuredClone(view) : u.startsWith('/api/agent-models') ? { agent: '', why: 'no' } : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.then) body = await body;
    if (body === undefined) return { ok: false, status: 404, json: async () => ({ error: `no answer for ${u}` }) };
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => structuredClone(body) };
  };
  let doc = null;
  const p = fakePage([], { fetch }, { made: n => {
    n.focus = () => { doc.activeElement = n; };
    n.getAttribute = k => n.attrs?.[k] ?? null;
  } });
  doc = p.document;
  p.agentCalls = calls;
  p.posts = () => calls.filter(c => c.method === 'POST');
  return p;
}

export const agentsBox = p => p.all(p.byId('settings')).find(n => n.tagName === 'section' && /\bagents\b/.test(n.className || ''));
const nameIn = (p, r) => p.all(r).find(n => /\bname\b/.test(n.className || ''))?.textContent;
// Your agents' rows, or with `offer`, Add an agent's.
export const agentRows = (p, offer = false) => p.all(agentsBox(p)).filter(n => /\bagent\b/.test(n.className || '') && /\boffer\b/.test(n.className || '') === offer);
export const rowNamed = (p, name, offer = false) => agentRows(p, offer).find(r => nameIn(p, r) === name);
export const buttonIn = (p, node, text) => (node ? p.all(node).find(n => n.tagName === 'button' && n.textContent === text) : undefined);
export const keyInputOf = (p, id) => p.all(agentsBox(p)).find(n => n.tagName === 'input' && n.attrs?.['data-provider'] === id);
// A key typed in a provider's field, as the browser tells the page.
export function typeKey(p, id, text) {
  const input = keyInputOf(p, id);
  input.value = text;
  input.listeners.input?.({ target: input });
}
export const focusedKey = p => p.document.activeElement?.attrs?.['data-focus'] ?? null;
