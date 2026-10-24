import { panelRepo, freePort, startPanel, stop, browserPage, T } from './panel.mjs';

// Two queued tickets, each with a plain Queued line, as in 0165's test. With chained, one waits on the other, so each
// has a dependency chip in its title row (0468). Shared by 0190's and 0224's tests.
export const STATE = ({ chained = false } = {}) => ({
  run: { on: false },
  tickets: [
    T('0204', 'ready', { title: 'Ready to build', priority: 0, size: 'M', risk: 'low', type: 'bug', auto_ship: true }),
    T('0205', 'ready', { title: 'Another', priority: 1, size: 'S', risk: 'high', type: 'fix', auto_ship: false, ...(chained ? { waiting_on: ['0204'], after: ['0204'] } : {}) }),
  ],
  ideas: [],
});
const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

// Runs fn with a real panel showing state in a 375 px wide phone browser. 0463: with each card closed, as an open one
// has its facts in a table in place of its Queued line.
export async function onPhone(fn, state = STATE()) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(state) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q .act').length === 2`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
