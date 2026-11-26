// 0757: speck serve's one address. It answers on 127.0.0.1 at its port, 4777 unless --port gives another, and with
// --url at that https address too, serving only the Host headers a panel serves and taking a choice only from a page
// at the address, as its Origin says. It opens on All projects: the panel's own page, from this copy of speck, with only
// the bridge on it (0596), listing every project on `speck projects`' list. Choosing one sets a cookie for this
// address, which from then on passes each of the page's requests on to that project's panel, on its own port, and its
// answers back, as a panel's project menu does (0516): its own page, with its own key, and its live updates, and every
// write, which that panel checks as its own. The cookie lasts until the browser closes, so the address opens on All
// projects again. A project's page says it's here by the X-Speck-Serve header on every answer.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { SpeckError, TEMPLATES } from './core.mjs';
import { panelsDir, runningPanels, summaryOf, passOn, goneAnswer } from './panel-projects.mjs';
import { panelFile } from './panel-files.mjs';
import { panelPort } from './panel.mjs';
import { panelUrl } from './panel-url.mjs';
import { newestUsage } from './agent-usage.mjs';
import { usageWarnings } from './subscriptions.mjs';
import { BUILD_ENV } from './build-env.mjs';

const PANEL_PORT = 4777; // a panel's own default, which speck serve's is too

// speck serve's address from its arguments, checked as a panel's: { port, url }, url being { origin, host } or null.
export const serveAddress = args => ({ port: panelPort(args), url: panelUrl(args) });
// The address as speck serve says it.
export const addressText = (port, origin) => `http://127.0.0.1:${port}/${origin ? ` and ${origin}/` : ''}`;

// Starts answering at the address, and resolves once it does, with { port, close }, or rejects with a SpeckError
// saying why it can't. `projects()` gives each project on the list as { folder, name, port }, `port` being where its
// panel answers or null, and throws a SpeckError when the list can't be read. `env` says where the panels keep their
// records. Port 0 takes any free port, for speck's own tests.
export async function startFront({ port, url = null, env = process.env, projects }) {
  const dir = panelsDir({ ...env, [BUILD_ENV]: undefined }); // your panels', as speck serve starts them, even from a build
  const panels = () => runningPanels(dir);
  const running = to => panels().some(p => p.port === to);
  let at = port, hosts = new Set(), origins = new Set(), id = '', cookie = '';
  const ours = req => origins.has(String(req.headers.origin || '').toLowerCase());
  const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(body)); };
  const text = (res, status, body, type = 'text/plain', headers = {}) => { res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(body); };
  const clear = () => `${cookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
  // The port of the panel this browser chose at the address, from its cookie, or null for All projects.
  const chosen = req => { const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${cookie}=(\\d{1,5})(?:;|$)`)); return m ? +m[1] : null; };
  // All projects: the panel's page, with no project, key or board of its own.
  const page = () => fs.readFileSync(path.join(TEMPLATES, 'panel.html'), 'utf8').replace('{{page}}', () => '').replace('{{repo}}', () => 'All projects')
    .replace('{{base}}', () => '').replace('{{token}}', () => '').replace('{{panel}}', () => id).replace('{{serve}}', () => '1');

  // POST /api/projects/<port>: show the project whose panel is on that port at this address, or All projects again
  // for this address's own port. Only from a page at this address: it may be a project's page, carrying its panel's key.
  function choose(req, res, to) {
    res.removeHeader('X-Speck-Panel'); // the address's own answer, whichever page asked
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    if (!ours(req)) return json(res, 403, { error: 'Forbidden: only a page at this address can do that. Reload it.' });
    if (to === at) return json(res, 200, { ok: true }, { 'Set-Cookie': clear() });
    if (!running(to)) return json(res, 404, { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' });
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${cookie}=${to}; Path=/; HttpOnly; SameSite=Strict` });
  }

  // POST /api/projects/summary: 0595's summary of each project on the list, from its own panel, all at once, by name. A
  // project whose panel doesn't answer within 2 seconds is there with running: false, and only its name and port, and
  // one with no panel running, with no port: only a running panel's port is ever asked.
  async function summaries(req, res) {
    res.removeHeader('X-Speck-Panel');
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    if (!ours(req)) return json(res, 403, { error: 'Forbidden: only a page at this address can do that. Reload it.' });
    let listed;
    try { listed = projects(); } catch (e) { return json(res, 500, { error: e instanceof SpeckError ? e.message : `speck serve couldn't read your projects: ${e?.message || e}` }); }
    const live = new Set(panels().map(p => p.port));
    const out = await Promise.all(listed.map(async p => {
      const port = Number.isInteger(p.port) && live.has(p.port) ? p.port : null, s = port === null ? null : await summaryOf(port, at);
      return s ? { ...s, port, name: p.name, running: true } : { port, name: p.name, running: false };
    }));
    out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : (a.port ?? 0) - (b.port ?? 0)));
    let usage = [];
    try { usage = usageWarnings(newestUsage(listed.map(p => p.folder).filter(f => fs.existsSync(path.join(f, 'speck'))))); } catch { /* none when the readings can't be read */ } // 0720
    return json(res, 200, { self: null, projects: out, usage: Array.isArray(usage) ? usage : [] });
  }

  // The address's own answers, while no project is chosen: All projects and its files. A project's page asking here
  // since its project stopped being chosen is told its project has gone (its stream) or answered as from another
  // panel (anything else), so it reloads and shows All projects.
  function own(req, res, where) {
    if (where === '/api/events') return goneAnswer(req, res, at, panels(), { serve: true });
    if (where.startsWith('/api/')) return json(res, 404, { error: 'No project is shown at this address. Reload the page to see All projects.' });
    if (req.method !== 'GET') return text(res, 405, 'Method not allowed.\n', 'text/plain', { Allow: 'GET' });
    if (where === '/') {
      try { return text(res, 200, page(), 'text/html'); }
      catch (e) { return text(res, 500, `Couldn't read the panel page, ${path.join(TEMPLATES, 'panel.html')}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    if (panelFile(where, res)) return;
    return text(res, 404, 'Not found.\n');
  }

  const server = http.createServer((req, res) => {
    if (!hosts.has(String(req.headers.host || '').toLowerCase())) return text(res, 403, 'Forbidden: open the panel at 127.0.0.1 or localhost.\n');
    res.setHeader('X-Speck-Serve', '1'); // on every answer, a project's passed on too, so its page knows it's at speck serve's address
    res.setHeader('X-Speck-Panel', id); // a project's page answered here, rather than by its own panel, reloads
    const where = req.url.split('?')[0], pick = where.match(/^\/api\/projects\/(\d{1,5})$/);
    if (pick) return choose(req, res, +pick[1]);
    if (where === '/api/projects/summary') return void summaries(req, res);
    const to = chosen(req);
    if (to !== null) {
      if (running(to)) return passOn(req, res, to, { via: at, ours: ours(req), gone: () => goneAnswer(req, res, to, panels(), { serve: true }) });
      if (where !== '/' || req.method !== 'GET') return goneAnswer(req, res, to, panels(), { serve: true });
      res.setHeader('Set-Cookie', clear()); // its panel has stopped: a reload shows All projects, and forgets the choice
    }
    return own(req, res, where);
  });
  await new Promise((resolve, reject) => {
    server.once('error', e => reject(e.code === 'EADDRINUSE'
      ? new SpeckError(`Port ${port} is already in use, so speck serve didn't start.${port === PANEL_PORT ? ` A panel started with \`speck panel\` takes it unless given another --port.` : ''} Stop whatever is using it, or give speck serve another port with --port <n>.`)
      : new SpeckError(`speck serve couldn't answer on port ${port}: ${e.message}`)));
    server.listen(port, '127.0.0.1', resolve);
  });
  server.on('error', e => console.error(`speck serve: ${e.message}`));
  at = server.address().port;
  hosts = new Set([`127.0.0.1:${at}`, `localhost:${at}`, ...(url ? [url.host] : [])]);
  origins = new Set([`http://127.0.0.1:${at}`, `http://localhost:${at}`, ...(url ? [url.origin] : [])]);
  id = crypto.createHash('sha256').update(`speck serve\0${at}`).digest('hex').slice(0, 16);
  cookie = `speck-serve-${at}`;
  return { port: at, close: () => { server.close(); server.closeAllConnections(); } };
}
