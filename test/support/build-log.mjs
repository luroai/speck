// A page whose ticket logs a test serves, for the build log's tests (0548, 0602).
import { fakePage } from './panel.mjs';
import { manualSources } from './stream.mjs';

export const NAME = 'ab'.repeat(16);
// A page with the board `tickets`, on a stream the test drives, whose log requests are answered by `logOf(id)`: a log,
// an Error for a request that fails, or a promise the test settles later. `made` is called with each node made.
export function logPage(tickets, logOf, made = () => {}) {
  const { EventSource, sources } = manualSources();
  const calls = [];
  const fetch = async url => {
    calls.push(String(url));
    const m = String(url).match(/^\/api\/tickets\/(\w+)\/log$/);
    if (m) { const log = await logOf(m[1]); if (log instanceof Error) throw log; return { ok: true, status: 200, json: async () => log }; }
    if (/\/log\/close$/.test(url)) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    if (/\/api\/run-log$/.test(url)) return { ok: true, status: 200, json: async () => ({ lines: ['10:00:00 Shipped 0457.'] }) };
    return { ok: true, status: 200, json: async () => ({ tickets, ideas: [], run: { on: true, pid: 1 }, run_log: '1' }) };
  };
  let focused = null;
  const p = fakePage([], { fetch, EventSource, getSelection: () => ({ isCollapsed: true, rangeCount: 0 }), scrollX: 0, scrollY: 0, scrollTo() {} },
    { made: n => { n.focus = () => { focused = n; }; made(n); } });
  for (const id of ['foreman', 'run', 'build-section']) p.byId(id).focus = () => { focused = p.byId(id); };
  p.document.documentElement = { classList: { toggle() {} } };
  const held = [p.byId('main-stand-in')];
  p.document.querySelectorAll = sel => (/\bmain\b/.test(sel) ? held : []);
  Object.defineProperty(p.document, 'activeElement', { get: () => focused });
  p.focused = () => focused;
  p.calls2 = calls;
  p.main = held[0];
  p.source = () => sources[sources.length - 1];
  return p;
}
