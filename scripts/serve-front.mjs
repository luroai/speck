// 0757: speck serve's one address. It answers on 127.0.0.1 at its port, 4777 unless --port gives another, and with
// --url at that https address too, serving only the Host headers a panel serves and taking a choice only from a page
// at the address, as its Origin says. It opens on All projects: the panel's own page, from this copy of speck, with only
// the bridge on it (0596), listing every project on `speck projects`' list, at / whatever has been chosen. Choosing one
// sets a cookie for this address and shows that project's panel under /project/, its page's files with it, as they
// load from beside the page (0543); its requests to /api/ go by the cookie. Each is passed on to that project's panel,
// on its own port, and its answer back, as a panel's project menu does (0516): its own page, with its own key, its live
// updates and every write, which that panel checks as its own. So whatever its version, the browser's Back, or opening
// the address again, goes back to All projects. Every answer says it's speck serve's address (X-Speck-Serve), so a
// project's page from this speck has its project menu there, with All projects first, even with its panel the only one
// running. For a page from an older speck, which shows its menu only with two or more panels running, the address
// keeps a record among the panels' as one, `speck serve`, which this speck leaves out (runningPanels).
// 0765: it also has the factory floor, at /floor, which gathers every project's summary and board (serve-floor.mjs).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { SpeckError, TEMPLATES } from './core.mjs';
import { panelsDir, runningPanels, registerPanel, summaryOf, passOn, goneAnswer } from './panel-projects.mjs';
import { panelFile } from './panel-files.mjs';
import { panelPort } from './panel.mjs';
import { panelUrl } from './panel-url.mjs';
import { newestUsage } from './agent-usage.mjs';
import { usageWarnings } from './subscriptions.mjs';
import { BUILD_ENV } from './build-env.mjs';
import { floorFile, floorBoards, floorAnswer } from './serve-floor.mjs';

const PANEL_PORT = 4777; // a panel's own default, which speck serve's is too
const SHOWN = '/project'; // where a chosen project's panel is shown; panel-header.js goes to it from All projects
// What the address says of itself to an older panel's bridge, which lists it as a panel: a project with nothing to count.
const OWN = { status: 'All projects', tone: 'idle', mood: 'asleep', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [] };

// speck serve's address from its arguments, checked as a panel's: { port, url }, url being { origin, host } or null.
export const serveAddress = args => ({ port: panelPort(args), url: panelUrl(args) });
// The address as speck serve says it.
export const addressText = (port, origin) => `http://127.0.0.1:${port}/${origin ? ` and ${origin}/` : ''}`;

// Starts answering at the address, and resolves once it does, with { port, close }, or rejects with a SpeckError
// saying why it can't. `projects()` gives each project on the list as { folder, name, port }, `port` being where its
// panel answers or null, and throws a SpeckError when the list can't be read. `env` says where the panels keep their
// records. Port 0 takes any free port, for speck's own tests.
// 0762: `shown()`, when given, gives the ports of the panels the address may show, as a Set: those of the projects on
// the list that aren't turned off. Any other running panel, started by hand for a project that's off or not listed, is
// left out of the choices and of a project's menu, as the project lists in /api/state answers passed on are cut down to
// them (stateShown), whatever speck the project's page is from. When they change, each open project page's stream is
// told to read its board again (nudge), so its menu changes within a few seconds.
// 0771: `handle`, when given, is the socket speck serve on older code answers on, which it answers on too, in place of
// `port`, until that one stops. It also gives the socket it answers on (handle()), and handOff(ms), for when speck serve
// on new code answers on it too: see there.
export async function startFront({ port, url = null, env = process.env, projects, shown = null, handle = null }) {
  const dir = panelsDir({ ...env, [BUILD_ENV]: undefined }); // your panels', as speck serve starts them, even from a build
  const showing = () => { if (!shown) return null; try { return shown(); } catch { return new Set(); } };
  const panels = () => { const all = runningPanels(dir), only = showing(); return only ? all.filter(p => only.has(p.port)) : all; };
  const running = to => panels().some(p => p.port === to);
  let at = port, hosts = new Set(), origins = new Set(), id = '', cookie = '';
  const ours = req => origins.has(String(req.headers.origin || '').toLowerCase());
  const json = (res, status, body, headers = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(body)); };
  const text = (res, status, body, type = 'text/plain', headers = {}) => { res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(body); };
  const clear = () => `${cookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
  const redirect = (res, to, headers = {}) => { res.writeHead(302, { Location: to, 'Cache-Control': 'no-store', ...headers }); res.end(); };
  // The port of the panel this browser chose at the address, from its cookie, or null for All projects.
  const chosen = req => { const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${cookie}=(\\d{1,5})(?:;|$)`)); return m ? +m[1] : null; };
  // All projects: the panel's page, with no project, key or board of its own.
  const page = () => fs.readFileSync(path.join(TEMPLATES, 'panel.html'), 'utf8').replace('{{page}}', () => '').replace('{{repo}}', () => 'All projects')
    .replace('{{base}}', () => '').replace('{{token}}', () => '').replace('{{panel}}', () => id).replace('{{serve}}', () => '1');

  // 0762: an /api/state answer from the panel on `to`, with its project menu's list (projects.list, 0516) cut down to the
  // panels the address shows, and the address's own record, which an older page lists as speck serve. An answer that
  // gives only what changed (0188) may leave the list out, as unchanged since the page's board: the list that panel
  // last sent through the address is put in, cut down as it is now. Until the address has seen one, the page is sent
  // the whole board. Gives the answer's rewrite for passOn, or null when the address shows every running panel.
  const sentLists = new Map(); // panel port → the projects part it last sent through the address, or null for none
  function stateShown(req, to) {
    if (!shown) return null;
    if (!sentLists.has(to)) delete req.headers['x-speck-have'];
    return answer => (answer.statusCode === 200 ? text => cutState(text, to) : null);
  }
  function cutState(text, to) {
    const v = JSON.parse(text), only = showing() || new Set();
    if (!v || typeof v !== 'object' || Array.isArray(v)) return text;
    const cut = part => (part && typeof part === 'object' && Array.isArray(part.list) ? { ...part, list: part.list.filter(p => p && (p.port === at || p.port === part.self || only.has(p.port))) } : part);
    const d = v.delta;
    if (d && typeof d === 'object') {
      if (!d.set || typeof d.set !== 'object' || !Array.isArray(d.keys)) return text;
      if (Object.hasOwn(d.set, 'projects')) { sentLists.set(to, d.set.projects); d.set.projects = cut(d.set.projects); }
      else if (!d.keys.includes('projects')) sentLists.set(to, null);
      else if (sentLists.get(to)) d.set.projects = cut(sentLists.get(to));
      return JSON.stringify(v);
    }
    if (!Object.hasOwn(v, 'projects')) { sentLists.set(to, null); return text; }
    sentLists.set(to, v.projects);
    v.projects = cut(v.projects);
    return JSON.stringify(v);
  }

  // 0762: each project page's stream passed on, which can be told to read its board again. A board's number of 0 makes
  // its panel answer at once with the board it has (0177), which comes cut down to what the address shows now. It's
  // told only between the panel's own events, so none is cut in two.
  // 0771: and ended as it hands off, or at once once it has, so its page reconnects to speck serve on the new code.
  const streams = new Map(); // a stream's answer → { nudge(), end() }
  function nudgeable(answer, res) {
    let tail = '\n\n', owed = false, ended = false;
    const tell = () => { owed = false; res.write('data: 0\n\n'); };
    const end = () => { ended = true; streams.delete(res); res.end(); };
    streams.set(res, { nudge: () => { if (tail === '\n\n') tell(); else owed = true; }, end });
    answer.on('data', d => { if (ended) return; res.write(d); tail = (tail + String(d)).slice(-2); if (tail === '\n\n' && owed) tell(); });
    answer.on('end', () => { if (!ended) res.end(); });
    res.on('close', () => streams.delete(res));
    if (handing) end();
  }
  // Which panels it shows, looked at every 2 seconds: when they change, every project page's stream is told.
  let lastShown = null;
  const watcher = shown ? setInterval(() => {
    const now = JSON.stringify([...(showing() || [])].sort((a, b) => a - b));
    if (lastShown !== null && now !== lastShown) for (const s of streams.values()) s.nudge();
    lastShown = now;
  }, 2000) : null;
  watcher?.unref();

  // POST /api/projects/<port>: show the project whose panel is on that port at this address, or All projects again
  // for this address's own port. Only from a page at this address: it may be a project's page, carrying its panel's key.
  function choose(req, res, to) {
    res.removeHeader('X-Speck-Panel'); // the address's own answer, whichever page asked
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    if (!ours(req)) return json(res, 403, { error: 'Forbidden: only a page at this address can do that. Reload it.' });
    if (to === at) return json(res, 200, { ok: true }, { 'Set-Cookie': clear() });
    if (!running(to)) return json(res, 404, { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' });
    return json(res, 200, { ok: true }, { 'Set-Cookie': `${cookie}=${to}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict` });
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

  // 0765: POST /api/floor[?station=<key>&have=<name>]: the factory floor's stations and the chosen one's board
  // (floorAnswer). Only from a page at this address, as the summaries are.
  const boards = floorBoards();
  async function floor(req, res) {
    res.removeHeader('X-Speck-Panel');
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' }, { Allow: 'POST' });
    if (!ours(req)) return json(res, 403, { error: 'Forbidden: only a page at this address can do that. Reload it.' });
    let listed;
    try { listed = projects(); } catch (e) { return json(res, 500, { error: e instanceof SpeckError ? e.message : `speck serve couldn't read your projects: ${e?.message || e}` }); }
    const q = new URLSearchParams(req.url.split('?')[1] || '');
    let readings = {};
    try { readings = newestUsage(listed.map(p => p.folder).filter(f => fs.existsSync(path.join(f, 'speck')))); } catch { /* none when the readings can't be read */ } // 0768
    try { return json(res, 200, await floorAnswer({ listed, live: new Set(panels().map(p => p.port)), via: at, station: q.get('station'), have: q.get('have'), boards, readings })); }
    catch (e) { return json(res, 500, { error: `speck serve couldn't read the factory floor: ${e?.message || e}` }); }
  }

  // The address's own: All projects at /, whatever has been chosen, and its files. 0765: and the factory floor's.
  function own(req, res, where) {
    if (req.method !== 'GET') return text(res, 405, 'Method not allowed.\n', 'text/plain', { Allow: 'GET' });
    if (where === '/') {
      try { return text(res, 200, page(), 'text/html'); }
      catch (e) { return text(res, 500, `Couldn't read the panel page, ${path.join(TEMPLATES, 'panel.html')}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    if (floorFile(where, res)) return; // 0765
    if (panelFile(where, res)) return;
    return text(res, 404, 'Not found.\n');
  }

  const live = new Set(); // 0771: the answers it's giving, which a hand-off waits for
  let handing = false; // 0771: from its hand-off on, each answer closes its connection
  const server = http.createServer((req, res) => {
    live.add(res);
    res.on('close', () => live.delete(res));
    if (handing) res.setHeader('Connection', 'close');
    if (!hosts.has(String(req.headers.host || '').toLowerCase())) return text(res, 403, 'Forbidden: open the panel at 127.0.0.1 or localhost.\n');
    res.setHeader('X-Speck-Serve', '1'); // on every answer, a project's passed on too, so its page knows it's at speck serve's address
    res.setHeader('X-Speck-Panel', id); // a project's page answered here, rather than by its own panel, reloads
    const where = req.url.split('?')[0], pick = where.match(/^\/api\/projects\/(\d{1,5})$/);
    if (pick) return choose(req, res, +pick[1]);
    if (where === '/api/projects/summary') return void summaries(req, res);
    if (where === '/api/floor') return void floor(req, res); // 0765
    if (where === '/api/projects/own' && req.headers['x-speck-via']) return json(res, 200, OWN); // an older panel's bridge asking
    if (where === SHOWN) return redirect(res, `${SHOWN}/`); // so its page's files load from under it
    const shown = where.startsWith(`${SHOWN}/`);
    if (!shown && !where.startsWith('/api/')) return own(req, res, where);
    const to = chosen(req);
    if (to !== null && running(to)) {
      const rewrite = where === '/api/state' ? stateShown(req, to) : null; // 0762
      const pipe = where === '/api/events' && !shown ? nudgeable : null; // 0762
      return passOn(req, res, to, { via: at, ours: ours(req), path: shown ? req.url.slice(SHOWN.length) : req.url, gone: () => goneAnswer(req, res, to, panels(), { serve: true }), rewrite, pipe });
    }
    // No project to show. Its page goes to All projects, forgetting a choice whose panel has stopped. A project's page
    // still open is told on its stream that its project has gone, and its other requests are answered as from another
    // panel, so it reloads, and goes there too.
    if (shown) return where === `${SHOWN}/` && req.method === 'GET' ? redirect(res, '/', to === null ? {} : { 'Set-Cookie': clear() }) : text(res, 404, 'Not found.\n');
    if (to !== null) return goneAnswer(req, res, to, panels(), { serve: true });
    if (where === '/api/events') return goneAnswer(req, res, at, panels(), { serve: true });
    return json(res, 404, { error: 'No project is shown at this address. Reload the page to see All projects.' });
  });
  await new Promise((resolve, reject) => {
    server.once('error', e => reject(handle ? new SpeckError(`speck serve couldn't answer on the socket handed over: ${e.message}`) : e.code === 'EADDRINUSE'
      ? new SpeckError(`Port ${port} is already in use, so speck serve didn't start.${port === PANEL_PORT ? ` A panel started with \`speck panel\` takes it unless given another --port.` : ''} Stop whatever is using it, or give speck serve another port with --port <n>.`)
      : new SpeckError(`speck serve couldn't answer on port ${port}: ${e.message}`)));
    if (handle) server.listen(handle, resolve); else server.listen(port, '127.0.0.1', resolve);
  });
  server.on('error', e => console.error(`speck serve: ${e.message}`));
  at = server.address().port;
  hosts = new Set([`127.0.0.1:${at}`, `localhost:${at}`, ...(url ? [url.host] : [])]);
  origins = new Set([`http://127.0.0.1:${at}`, `http://localhost:${at}`, ...(url ? [url.origin] : [])]);
  id = crypto.createHash('sha256').update(`speck serve\0${at}`).digest('hex').slice(0, 16);
  cookie = `speck-serve-${at}`;
  // Its record among the panels', which a page from an older speck lists as speck serve. 0771: written again by
  // register() when speck serve on new code wrote its own over it, then didn't start.
  let unregister = () => {};
  const register = () => { unregister = registerPanel({ port: at, name: 'speck serve', serve: true }, dir); };
  register();
  // 0771: speck serve on new code answers on its socket too, and has its own record among the panels'. This stops taking
  // connections, then ends each stream it passes on, whose page reconnects to the new code, and resolves once it has
  // given every answer it's giving, each closing its connection, or after `ms`, closing what's left.
  function handOff(ms) {
    handing = true;
    clearInterval(watcher);
    return new Promise(resolve => {
      const idle = setInterval(() => server.closeIdleConnections(), 250);
      const late = setTimeout(() => server.closeAllConnections(), ms);
      server.close(() => { clearInterval(idle); clearTimeout(late); resolve(); });
      for (const s of [...streams.values()]) s.end();
      for (const res of live) if (!res.headersSent) res.setHeader('Connection', 'close');
    });
  }
  return { port: at, handle: () => server._handle, handOff, register, close: () => { clearInterval(watcher); unregister(); server.close(); server.closeAllConnections(); } };
}
