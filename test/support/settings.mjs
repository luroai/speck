// The Settings view's test helpers, shared by 0258's, 0259's, 0261's and 0274's tests.

import { fakePage } from './panel.mjs';

// A page whose fetch answers the board with an empty one, GET /api/settings with each of `views` in turn and a POST
// with each of `saves` in turn, or once a promise among them resolves. `globals` replaces what the page sees, for example its `confirm`.
export function settingsPage(views, saves = [], globals = {}) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: String(url), method, headers: opts.headers || {} });
    let body = method === 'POST' ? saves.shift() : String(url).startsWith('/api/settings') ? views.shift() : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.then) body = await body; // 0274: an answer the test gives later
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch, ...globals });
  p.settingsCalls = calls;
  return p;
}
export const openSettings = async p => { p.press(p.byId('settings-open')); await p.settle(); };
export const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || ''))
  .find(r => p.all(r).find(n => /\bname\b/.test(n.className || ''))?.textContent === key);
export const controlOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'select' || n.tagName === 'input');
// 0274: the view's one Save button.
export const saveButton = p => p.all(p.byId('settings')).find(n => n.tagName === 'button' && /\bsave-all\b/.test(n.className || ''));
// A value typed or picked in a setting's control, as the browser tells the page.
export function changeTo(p, key, value) {
  const c = controlOf(p, key);
  c.value = String(value);
  for (const type of ['input', 'change']) if (c.listeners[type]) c.listeners[type]({ target: c });
}
// auto_ship_risk's boxes, and one ticked or unticked, as the browser tells the page.
export const boxesOf = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'input' && n.type === 'checkbox');
export function tick(p, key, risk, on) {
  const box = boxesOf(p, key).find(b => b.value === risk);
  box.checked = on;
  if (box.listeners.change) box.listeners.change({ target: box });
}
// The page's POSTs, by address.
export const posted = p => p.settingsCalls.filter(c => c.method === 'POST').map(c => c.url);
