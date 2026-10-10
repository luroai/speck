// speck panel: the control panel in the browser, its server processes and their writes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEMPLATES, SpeckError, sh, findRepoRoot, loadConfig, findTicket, lintTicket, writeField, worktreeList, padId, readableLog, statusData, commitTicketOnly } from './speck.mjs';
import { pauseBuild, playBuild, stopBuild } from './run.mjs';

// ---------- panel (a view in the browser, with two writes: Set ready and a draft's priority) ----------

const PANEL_PORT = 4777;
const htmlEscape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function panelPort(args) {
  const i = args.findIndex(a => a === '--port' || a.startsWith('--port='));
  if (i === -1) return PANEL_PORT;
  const v = args[i].startsWith('--port=') ? args[i].slice(7) : args[i + 1];
  if (!/^\d+$/.test(v ?? '') || +v < 1 || +v > 65535) throw new SpeckError(`--port must be a whole number from 1 to 65535 (got "${v ?? ''}").`);
  return +v;
}

// The panel's one write: set a draft ticket to ready, as `speck set <id> status ready` does, and commit only that
// ticket, since `speck start` needs it committed. Every refusal comes before the first write. Returns
// { status, body } for the server to send.
function panelSetReady(repo, id) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id;
  if (t.fm.status !== 'draft') return { status: 409, body: { error: `Ticket ${pad} is "${t.fm.status}", not a draft, so it can't be set ready from here.` } };
  const { errors } = lintTicket(t, cfg);
  if (errors.length) return { status: 422, body: { error: `Not ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}` } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const rel = path.relative(repo, t.file);
  writeField(t, 'status', 'ready');
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): ready`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so it's still a draft:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}

// The panel's pause and play icon: pauses or plays a build exactly as `speck pause <id>` or `speck play <id>` does,
// refusing for the same reasons with the same words.
function panelPausePlay(repo, id, what) {
  try { findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  try { return { status: 200, body: { ok: true, message: (what === 'pause' ? pauseBuild : playBuild)(repo, [id]) } }; }
  catch (e) { if (e instanceof SpeckError) return { status: 409, body: { error: e.message } }; throw e; }
}

// The panel's Stop build button: stops a build exactly as `speck stop <id>` does, refusing for the same reasons with the
// same words.
function panelStop(repo, id) {
  try { findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const lines = [];
  try { stopBuild(repo, [id], line => lines.push(line)); } catch (e) { if (e instanceof SpeckError) return { status: 409, body: { error: e.message } }; throw e; }
  return { status: 200, body: { ok: true, message: lines.join('\n') } };
}

// The panel's other write: set a draft ticket's priority, as `speck set <id> priority <n>` does, and commit only that
// ticket. `value` is from the URL, so anything but 1 to 5 is refused. Every refusal comes before the first write.
function panelSetPriority(repo, id, value) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id;
  if (t.fm.status !== 'draft') return { status: 409, body: { error: `Ticket ${pad} is "${t.fm.status}", not a draft, so its priority can't be changed from here.` } };
  if (!/^[1-5]$/.test(value)) return { status: 422, body: { error: `Priority must be a whole number from 1 to 5, not "${value.slice(0, 20)}".` } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  if (String(t.fm.priority) === value) return { status: 200, body: { ok: true, id: pad } }; // already at that priority
  const rel = path.relative(repo, t.file);
  writeField(t, 'priority', value);
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): priority ${value}`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so its priority is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}

// True only for the token this server made, compared in constant time.
// Compared as bytes, since a header with non-ASCII characters can match in length but not in bytes.
function sameToken(given, token) {
  if (typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The tail of a build's log from `speck run`, for the panel: its last 200 lines, from the main checkout, with trailing
// blank lines dropped, and whether it has more. A ticket with no log gets empty text. Reads only, writing nothing.
const PANEL_LOG_LINES = 200;
function panelLog(repo, id) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  let text;
  try { text = readableLog(fs.readFileSync(path.join(main, 'speck', '.cache', 'runs', `${padId(id)}.log`), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { text: '', truncated: false }; throw e; }
  const lines = text.split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return { text: lines.slice(-PANEL_LOG_LINES).join('\n'), truncated: lines.length > PANEL_LOG_LINES };
}

// `speck panel`. The process you start only launches the first server process and waits until the last one has gone.
// Everything else, serving, watching the code and restarting, happens in server processes, each running the code as it
// was when it started: when the code changes, a server starts its successor on the new code, hands it the port and stops.
export function cmdPanel(args) {
  findRepoRoot(); // plain errors before anything starts
  panelPort(args);
  // Made once, when `speck panel` starts, and passed down through every restart, so an open page's token keeps working.
  const { child } = startPanelServer(args, crypto.randomBytes(32).toString('hex'), null, 'pipe');
  // Each server process writes its exit code to this pipe as it exits, and the pipe closes once they all have.
  let code = 1, piped = false, disconnected = false;
  const done = () => { if (piped && disconnected) process.exit(code); };
  child.on('message', m => { if (m && m.type === 'failed') console.error(m.message); });
  child.on('disconnect', () => { disconnected = true; done(); });
  child.on('error', e => { console.error(`The panel couldn't start: ${e.message}`); process.exit(1); });
  child.stdio[4].setEncoding('utf8');
  child.stdio[4].on('data', d => { const last = d.trim().split('\n').pop(); if (/^\d+$/.test(last)) code = +last; });
  child.stdio[4].on('close', () => { piped = true; done(); });
  // Server processes stop by themselves once this has gone.
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}

// Starts a server process on the code as it is now, with the token, and the port to take over from `from` (the running
// server, if any). `lifeline` is the pipe to `cmdPanel` ('pipe' for the first, then fd 4, passed on). The new process
// says 'ready' once it's serving, or { type: 'failed', line, message } and exits if it can't start.
function startPanelServer(args, token, from, lifeline) {
  const code = codeHash();
  const loader = `try { const m = await import(process.env.SPECK_PANEL_CODE_URL); await m.panelServer(); }
catch (e) { const line = (e && e.name === 'SpeckError' ? '' : (e && e.name || 'Error') + ': ') + String(e && e.message || e).split('\\n')[0];
  process.send({ type: 'failed', line, message: e && e.name === 'SpeckError' ? e.message : line }, () => process.exit(typeof e?.code === 'number' ? e.code : 1)); }`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', loader], {
    stdio: ['ignore', 'inherit', 'inherit', 'ipc', lifeline],
    env: { ...process.env, SPECK_PANEL_CODE_URL: pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs')).href, SPECK_PANEL_ARGS: JSON.stringify(args),
      SPECK_PANEL_TOKEN: token, SPECK_PANEL_CODE: code, SPECK_PANEL_HANDOVER: from ? '1' : '' } });
  if (from) child.on('message', m => { if (m === 'port') child.send('listen', from, () => {}); });
  return { child, code };
}

const PANEL_WATCH_MS = 250, PANEL_SETTLE_MS = 500, PANEL_START_MS = 10000, PANEL_STOP_MS = 3000;

// The code `speck panel` runs from: every .mjs file in the CLI's own folder (scripts/, or .speck/scripts/ in a repo set
// up with `speck init`). `codeStamp` is cheap, to notice a change; `codeHash` is the content, to tell a real change.
function panelCode() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => n.endsWith('.mjs')).sort(); } catch { /* gone for now: no code to compare */ }
  return names.map(n => path.join(dir, n));
}
function codeStamp() {
  return panelCode().map(f => { try { const st = fs.statSync(f); return `${f}:${st.size}:${st.mtimeMs}:${st.ino}`; } catch { return `${f}:-`; } }).join('|');
}
function codeHash() {
  const h = crypto.createHash('sha256');
  for (const f of panelCode()) { h.update(f); h.update('\0'); try { h.update(fs.readFileSync(f)); } catch { h.update('-'); } h.update('\0'); }
  return h.digest('hex');
}

// One server process: serves the panel page, /api/state and each build's log to this machine only, plus the writes,
// POST /api/tickets/<id>/ready, POST /api/tickets/<id>/priority/<n> and POST /api/tickets/<id>/pause, /play or /stop. Every request reads the files afresh, the page
// included, so a changed panel.html shows on a reload. It also watches the code, and when it changes, hands over to a
// server on the new code (see cmdPanel).
export async function panelServer() {
  const env = process.env;
  const args = JSON.parse(env.SPECK_PANEL_ARGS || '[]'), handover = env.SPECK_PANEL_HANDOVER === '1';
  // A web page elsewhere can send a POST here (the Host check doesn't stop a form post to 127.0.0.1), but can't read
  // this token, which goes only into the page, and its Origin gives it away. Taken out of the environment, so the
  // commands this runs don't get it.
  const token = env.SPECK_PANEL_TOKEN, running = env.SPECK_PANEL_CODE || codeHash();
  for (const k of ['SPECK_PANEL_ARGS', 'SPECK_PANEL_HANDOVER', 'SPECK_PANEL_TOKEN', 'SPECK_PANEL_CODE', 'SPECK_PANEL_CODE_URL']) delete env[k];
  if (!token || !process.send) throw new SpeckError('Start the panel with: speck panel');
  let successor = null; // the server starting on new code, until it's ready or fails
  // The pipe to cmdPanel: this writes its exit code there, and stops once cmdPanel has gone (Ctrl+C or a kill).
  process.on('exit', c => { if (successor) successor.kill('SIGKILL'); try { fs.writeSync(4, `${c}\n`); } catch { /* cmdPanel has gone */ } });
  const life = new net.Socket({ fd: 4, readable: true, writable: false, allowHalfOpen: true });
  life.on('end', () => process.exit(0));
  life.on('error', () => process.exit(0));
  life.resume();

  const repo = findRepoRoot();
  const port = panelPort(args);
  const cfg = loadConfig(repo);
  const repoName = htmlEscape(path.basename(worktreeList(repo)[0]?.path || repo)), base = htmlEscape(cfg.base_branch);
  let restartError = null; // the last failed restart, shown on the page until a restart works or the code is put back
  let stopping = false;
  const pageFile = path.join(TEMPLATES, 'panel.html');
  const page = () => fs.readFileSync(pageFile, 'utf8')
    .replace('{{repo}}', () => repoName).replace('{{base}}', () => base).replace('{{token}}', () => token);
  const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]);
  // Only these Host headers are served, so a web page on another name that resolves here (DNS rebinding) gets nothing.
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const send = (res, status, type, body) => {
    res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'GET' } : {}), ...(stopping ? { Connection: 'close' } : {}) });
    res.end(body);
  };
  const server = http.createServer((req, res) => {
    if (!hosts.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'text/plain', 'Forbidden: open the panel at 127.0.0.1 or localhost.\n');
    const where = req.url.split('?')[0];
    const ready = where.match(/^\/api\/tickets\/(\d{1,4})\/ready$/);
    if (req.method === 'POST' && ready) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetReady(repo, ready[1]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const priority = where.match(/^\/api\/tickets\/(\d{1,4})\/priority\/([^/]*)$/);
    if (req.method === 'POST' && priority) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetPriority(repo, priority[1], priority[2]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const toggle = where.match(/^\/api\/tickets\/(\d{1,4})\/(pause|play|stop)$/);
    if (req.method === 'POST' && toggle) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = toggle[2] === 'stop' ? panelStop(repo, toggle[1]) : panelPausePlay(repo, toggle[1], toggle[2]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    if (req.method !== 'GET') return send(res, 405, 'text/plain', 'Method not allowed.\n');
    if (where === '/') {
      try { return send(res, 200, 'text/html', page()); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the panel page, ${pageFile}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    if (where === '/api/state') {
      try { return send(res, 200, 'application/json', JSON.stringify({ ...statusData(repo), ...(restartError ? { restart_error: restartError } : {}) })); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const log = where.match(/^\/api\/tickets\/(\d{1,4})\/log$/);
    if (log) {
      try { return send(res, 200, 'application/json', JSON.stringify(panelLog(repo, log[1]))); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't read the build log: ${e.message}` })); }
    }
    return send(res, 404, 'text/plain', 'Not found.\n');
  });

  // The port: the server this one replaces hands over the socket it's listening on, and both take connections until
  // the old one stops. The first server listens itself.
  const where = handover
    ? await new Promise(resolve => { process.on('message', (m, h) => { if (m === 'listen' && h) resolve(h); }); process.send('port'); })
    : { port, host: '127.0.0.1' };
  await new Promise((resolve, reject) => {
    server.once('error', e => reject(e.code === 'EADDRINUSE'
      ? new SpeckError(`Port ${port} is already in use, so the panel didn't start. Stop whatever is using it, or pick another port with --port <n>.`)
      : new SpeckError(`The panel couldn't start on port ${port}: ${e.message}`)));
    server.listen(where, resolve);
  });
  server.on('error', e => console.error(`speck panel: ${e.message}`));
  if (!handover) console.log(`speck panel: http://127.0.0.1:${port}/ (press Ctrl+C to stop)`);
  process.send('ready');

  // Stops taking connections, closes the idle ones at once and the rest once answered (each answer then says
  // Connection: close), so the browser's next request reaches the new server, then exits.
  const stop = () => {
    stopping = true;
    clearInterval(watcher);
    setTimeout(() => process.exit(0), PANEL_STOP_MS).unref();
    server.close(() => process.exit(0));
    server.closeIdleConnections();
  };
  // Starts a server on the new code and hands over to it once it's ready. If it can't start, this one keeps serving and
  // says why, until a later change.
  const restart = () => {
    if (codeHash() === running) { restartError = null; return; } // back to the code that's running: nothing to do
    const { child } = startPanelServer(args, token, server, 4);
    successor = child;
    let settled = false;
    const fail = line => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      successor = null;
      restartError = line;
      console.error(`speck panel couldn't restart with the new code: ${line}\nIt's still running the code it had, and tries again on the next change.`);
    };
    const timer = setTimeout(() => fail(`it wasn't ready within ${PANEL_START_MS / 1000} seconds`), PANEL_START_MS);
    child.on('error', e => fail(e.message));
    child.on('exit', c => fail(`it stopped with exit code ${c} before it was ready`));
    child.on('message', m => {
      if (m && m.type === 'failed') fail(m.line);
      if (m !== 'ready' || settled) return;
      settled = true;
      clearTimeout(timer);
      successor = null;
      child.removeAllListeners();
      child.disconnect();
      child.unref();
      console.log('speck panel: the code changed, so it restarted with the new code.');
      stop();
    });
  };
  // Checks the code four times a second, and once a change has settled (unchanged for PANEL_SETTLE_MS), restarts if
  // the content differs from what's running. The first check always compares, in case the code changed while starting.
  let stamp = '', changedAt = 0;
  const watcher = setInterval(() => {
    const now = codeStamp();
    if (now !== stamp) { stamp = now; changedAt = Date.now(); return; }
    if (!changedAt || successor || stopping || Date.now() - changedAt < PANEL_SETTLE_MS) return;
    changedAt = 0;
    restart();
  }, PANEL_WATCH_MS);
}
