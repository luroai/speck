// 0519: a board with closed cards in Plan, Build and Shipped, and a measure of each closed card in a real browser.
import { T, full } from './panel.mjs';

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'A ticket whose title is long enough that it never fits on one line at any of these widths';
export const BOARD = {
  run: { on: true },
  ideas: [],
  tickets: [
    full('0901', { title: 'A short draft', priority: 3, size: 'S', risk: 'low' }),
    full('0902', { title: LONG, priority: 2, size: 'M', risk: 'high', kind: 'task', after: ['0911', '0912'], waiting_on: ['0911', '0912'] }),
    full('0903', { title: 'A fix draft', priority: 0, size: 'S', risk: 'low', type: 'fix', lint: { errors: 2, warnings: 1 } }),
    full('0904', { title: 'A bug draft', priority: 1, size: 'M', risk: 'high', type: 'bug' }),
    T('0911', 'building', { title: 'Building now', priority: 3, size: 'M', risk: 'low', started: ago(65), build_running: true }),
    T('0912', 'blocked', { title: LONG, type: 'bug', started: ago(5990), self_check: 'no changes', rounds: [{ round: 1, verdict: 'request_changes' }], blocked_question: 'A or B?' }),
    T('0913', 'ready', { title: 'Queued', priority: 3, size: 'M', risk: 'low' }),
    T('0921', 'done', { title: 'Shipped short', started: ago(1500), finished: ago(600), builder_cost_usd: 2.9, rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens: 500 }] }),
    T('0922', 'done', { title: LONG, type: 'bug', started: ago(3000), finished: ago(1200), builder_cost_usd: 12.25, rounds: [{ round: 1, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens: 500 }, { round: 2, reviewer: 'codex', verdict: 'approve', seconds: 10, tokens: 500 }] }),
    T('0923', 'done', { title: 'Shipped, no figures', finished: ago(900) }),
  ],
};
export const STUB = `(() => {
  const STATE = ${JSON.stringify(BOARD)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// The board has loaded once every lane has its cards.
export const CARD_COUNTS = `document.querySelectorAll('#shaping .item.ticket').length === 4 && document.querySelectorAll('#queue .q').length === 3 && document.querySelectorAll('#shipped tr').length === 3`;
// Each closed Plan card's labels: their text, border, type size and box, and its title's type size.
export const LABELS = `(async () => {
  await document.fonts.ready;
  return [...document.querySelectorAll('#shaping .item.ticket:not(.open)')].map(c => ({ id: c.querySelector('.id').textContent,
    titleSize: parseFloat(getComputedStyle(c.querySelector('.title')).fontSize),
    labels: [...c.querySelectorAll('.checks .tag')].map(n => { const r = n.getBoundingClientRect(), s = getComputedStyle(n);
      return { text: n.textContent, border: parseFloat(s.borderTopWidth), size: parseFloat(s.fontSize), top: r.top, left: r.left, right: r.right }; }) }));
})()`;
