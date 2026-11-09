// Helpers for the tests of the panel's Decided for you list (0568, 0590).
import { fakePage } from './panel.mjs';

export const D = (id, o = {}) => ({ id, title: `Ticket ${id}`, option: `Option of ${id}`, at: '2026-11-08T10:30:00.000Z', criteria_changed: false, ...o });
// The page with this board. `globals` replaces what it sees, such as a `Date` a test moves.
export function board(tickets, decided, globals = {}) {
  const answers = [];
  const p = fakePage([], { scrollX: 0, scrollY: 0, scrollTo() {}, ...globals, fetch: async url => {
    answers.push(String(url));
    if (/\/pack$/.test(url)) return { ok: true, status: 200, json: async () => ({ pack: '# Pack', pictures: [], documents: [] }) };
    return { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [], decided }))) };
  } });
  p.document.documentElement = { dataset: {}, classList: { toggle() {} } };
  p.document.querySelectorAll = sel => sel.split(', ').filter(x => x.startsWith('#')).map(x => p.byId(x.slice(1)));
  p.document.activeElement = null;
  p.answers = answers;
  return p;
}
export const buttons = (p, text) => p.all(p.byId('decided')).filter(n => n.tagName === 'button' && n.textContent === text);
export const rows = p => p.all(p.byId('decided')).filter(n => /\bdecided-row\b/.test(n.className));
export const openList = async p => { await p.settle(); p.press(p.byId('decided-open')); await p.settle(); };
