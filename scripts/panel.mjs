// speck panel: the control panel in the browser, its server processes and their writes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEMPLATES, SpeckError, sh, findRepoRoot, loadConfig, findTicket, checkSetValue, checkSetTicket, setTicketField, worktreeList, padId, readableLog, ticketShown, runsOf, commitTicketOnly } from './speck.mjs';
import { stopBuild } from './run.mjs';
import { panelShip, panelChanges, requestBody, panelRunOn, panelRunOff, panelRunState } from './panel-run.mjs';
export { panelRunOn } from './panel-run.mjs';
import { boardReader } from './panel-board.mjs';
import { panelPack } from './pack.mjs';
import { pictureFile } from './pictures.mjs';
import { documentFile } from './output.mjs';
import { boardFeed, boardVersions, panelBoard } from './board-feed.mjs';
import { logFeed } from './log-feed.mjs';
import { panelSettings, panelSettingRequest, panelSaveRequestAsync, reviewerModels, builderModels, foremanModels } from './settings.mjs';
import { codexModelsAsync } from './codex-models.mjs';
import { foremanView, readForeman, fixingOf } from './foreman.mjs';
import { agentView } from './foreman-agent.mjs';
import { panelForemanReply } from './foreman-answer.mjs';
import { findAgentsAsync, agentModelsAsync } from './agents.mjs';
import { goWith } from './go-with.mjs';

// ---------- panel (a view in the browser, with its writes: Set ready and Back to Plan, a draft's priority, Stop build, Go with the recommendation, an answer to the Foreman's question, Ship, Ask for changes, the speck run switch and a setting) ----------

const PANEL_PORT = 4777;
const htmlEscape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function panelPort(args) {
  const i = args.findIndex(a => a === '--port' || a.startsWith('--port='));
  if (i === -1) return PANEL_PORT;
  const v = args[i].startsWith('--port=') ? args[i].slice(7) : args[i + 1];
  if (!/^\d+$/.test(v ?? '') || +v < 1 || +v > 65535) throw new SpeckError(`--port must be a whole number from 1 to 65535 (got "${v ?? ''}").`);
  return +v;
}

// The one extra address `--url` gives, for reaching the panel through a private tunnel: { origin, host } with its
// https origin and its Host header, or null without --url. Only https://<hostname>, with an optional trailing /.
function panelUrl(args) {
  const at = args.flatMap((a, i) => (a === '--url' || a.startsWith('--url=') ? [i] : []));
  if (!at.length) return null;
  const example = 'for example --url https://speck.example.ts.net';
  if (at.length > 1) throw new SpeckError(`Give --url once: the panel serves one extra address (${example}).`);
  const i = at[0];
  const v = args[i].startsWith('--url=') ? args[i].slice(6) : args[i + 1];
  const m = /^https:\/\/([a-z0-9.-]+)\/?$/i.exec(v ?? '');
  let host = null;
  try { if (m) host = new URL(v).hostname; } catch { /* not an address */ }
  if (!host || host !== m[1].toLowerCase() || /^\.|\.\.|\.$/.test(host))
    throw new SpeckError(`--url must be an https:// address with only a hostname, and at most a / after it: no http://, port, path, query or username (got "${v ?? ''}"). Give it as the address your private tunnel serves, ${example}`);
  return { origin: `https://${host}`, host };
}

// `speck set`'s own checks, as the panel's 422 response, or null when they pass.
function setRefusal(t, cfg, key, value) {
  try { checkSetValue(key, value); checkSetTicket(t, cfg, key, value); return null; }
  catch (e) { if (e instanceof SpeckError) return { status: 422, body: { error: e.message } }; throw e; }
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
  // `speck set` would move a draft filed with the finished tickets back to speck/tickets/, and this commit holds one file.
  if (path.dirname(path.resolve(t.file)) !== path.resolve(repo, 'speck', 'tickets'))
    return { status: 409, body: { error: `Ticket ${pad} is a draft filed in speck/tickets/done/, so it can't be set ready from here. Run \`speck set ${pad} status ready\`, which moves it back to speck/tickets/, then commit it.` } };
  const refused = setRefusal(t, cfg, 'status', 'ready');
  if (refused) return refused;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const rel = path.relative(repo, t.file);
  setTicketField(repo, t, 'status', 'ready');
  const commit = commitTicketOnly(repo, t.file, t.raw, `speck(${pad}): ready`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so it's still a draft:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
}

// The panel's Back to Plan button: the reverse of Set ready. Sets a ready ticket back to draft, as
// `speck set <id> status draft` does, and commits only that ticket, so `speck run` no longer starts it. Every refusal
// comes before the first write.
function panelBackToPlan(repo, id) {
  const cfg = loadConfig(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id;
  // As the panel shows it: a ticket being built is read from its own worktree, where its status has moved on, and a
  // build speck run has launched may not have set it building yet.
  const shown = ticketShown(repo, pad) || { status: t.fm.status };
  if (shown.status !== 'ready' || t.fm.status !== 'ready')
    return { status: 409, body: { error: `Ticket ${pad} is "${shown.status !== 'ready' ? shown.status : t.fm.status}", not waiting in the queue, so it can't go back to Plan from here.` } };
  if (shown.build_running)
    return { status: 409, body: { error: `speck run has just started building ticket ${pad}, so it can't go back to Plan. Once it shows as building, Stop build ends it.` } };
  if (shown.worktree)
    return { status: 409, body: { error: `Ticket ${pad} is being started in its own worktree, ${shown.worktree}, so it can't go back to Plan from here.` } };
  const refused = setRefusal(t, cfg, 'status', 'draft');
  if (refused) return refused;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const rel = path.relative(repo, t.file), raw = t.raw;
  const from = setTicketField(repo, t, 'status', 'draft');
  const commit = commitTicketOnly(repo, t.file, raw, `speck(${pad}): draft`, from);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so it's still ready:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: { ok: true, id: pad } };
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
  // `speck set` can clear a priority with "", but the panel only sets one.
  if (value === '') return { status: 422, body: { error: `Pick a priority from 1 to 5: the panel can't clear one.` } };
  const refused = setRefusal(t, cfg, 'priority', value);
  if (refused) return refused;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  if (String(t.fm.priority) === value) return { status: 200, body: { ok: true, id: pad } }; // already at that priority
  const rel = path.relative(repo, t.file);
  setTicketField(repo, t, 'priority', value);
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

// The tail of a build's log from `speck run`, for the panel: its last 200 lines, each entry with its time, from the main
// checkout, with trailing blank lines dropped, and whether it has more. A ticket with no log gets empty text. Reads only, writing nothing. A page's stream follows it from there (0189).
const PANEL_LOG_LINES = 200;
function panelLog(repo, id) {
  let text;
  try { text = readableLog(fs.readFileSync(path.join(runsOf(repo), `${padId(id)}.log`), 'utf8'), { times: true }); }
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
  panelUrl(args);
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

// One server process: serves the panel page, /api/state and each ticket's build log and review pack to this machine only, plus the writes,
// POST /api/tickets/<id>/ready, POST /api/tickets/<id>/draft, POST /api/tickets/<id>/priority/<n>, POST /api/tickets/<id>/stop, POST /api/tickets/<id>/recommendation, POST /api/foreman/<id>/answer or /dismiss, POST /api/tickets/<id>/ship, POST /api/tickets/<id>/changes and POST /api/run/on or /off. Every request reads the files afresh, the page
// included, so a changed panel.html shows on a reload, except that /api/state requests share a reading of the board (0177), and /api/events tells each open page when the board changes (0187), after which /api/state gives it only what changed (0188), and sends it each build log it opens there as it's written (0189). It also watches the code, and when it changes, hands over to a
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
  const port = panelPort(args), url = panelUrl(args);
  const cfg = loadConfig(repo);
  const repoName = htmlEscape(path.basename(worktreeList(repo)[0]?.path || repo)), base = htmlEscape(cfg.base_branch);
  let restartError = null; // the last failed restart, shown on the page until a restart works or the code is put back
  let stopping = false;
  let shipping = null; // the id of the ticket a Ship button is shipping, until speck ship has finished
  let switching = false; // true while the speck run switch is turning it on or off
  const pageFile = path.join(TEMPLATES, 'panel.html');
  // 0285: the code a page was sent with: this server's code and the page file. /api/state gives the stamp of the code
  // now, so a page sent before either changed can say it's out of date.
  const stampOf = html => crypto.createHash('sha256').update(running).update('\0').update(html).digest('hex').slice(0, 16);
  const page = () => { const html = fs.readFileSync(pageFile, 'utf8'); return html.replace('{{page}}', () => stampOf(html))
    .replace('{{repo}}', () => repoName).replace('{{base}}', () => base).replace('{{token}}', () => token); };
  const pageNow = () => { try { return { page: stampOf(fs.readFileSync(pageFile, 'utf8')) }; } catch { return {}; } };
  // With --url, its one address too: the tunnel in front of the panel sends its hostname as the Host, with no port.
  const origins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, ...(url ? [url.origin] : [])]);
  // Only these Host headers are served, so a web page on another name that resolves here (DNS rebinding) gets nothing.
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, ...(url ? [url.host] : [])]);
  const send = (res, status, type, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      ...(status === 405 ? { Allow: 'GET' } : {}), ...(stopping ? { Connection: 'close' } : {}), ...headers });
    res.end(body);
  };
  // 0149: what lets a phone add the panel to its home screen as an app, from templates/icons/: its manifest and icons.
  const iconsDir = path.join(TEMPLATES, 'icons');
  const icons = { '/manifest.webmanifest': 'application/manifest+json', '/icon.svg': 'image/svg+xml',
    '/icon-192.png': 'image/png', '/icon-512.png': 'image/png', '/apple-touch-icon.png': 'image/png' };
  // 0177: /api/state. Requests that arrive while the board is being read share that reading, unless a write has finished
  // since it started: then they wait for the next one, so every answer after a write shows it. A request whose
  // connection has closed by the time its reading would start doesn't cause one.
  // The server is ready once its board reader has loaded the code, so a change to it after then can't reach the reader.
  const readBoard = await boardReader(repo);
  const runs = runsOf(repo); // the main checkout's, which doesn't move
  let writes = 0, reading = null, waiting = [];
  const closed = res => res.destroyed || !res.socket || res.socket.destroyed;
  // What /api/state answers with for a reading: the board, plus speck run's state and the last restart's error, kept in
  // parts so a page gets only what changed since the board it has (0188, see boardVersions), with the finished tickets
  // the page shows only in the Shipped figures cut down to those (0178, see panelBoard).
  // 0286: foreman_fixing as speck/config.yml has it now, or its default when that can't be read.
  const fixingNow = () => { try { return fixingOf(loadConfig(repo)); } catch { return 'tell'; } };
  const boards = boardVersions(), stateOf = out => {
    if (out.error) return { status: 500, body: JSON.stringify({ error: out.error }) };
    // run is there only while speck run is on, as restart_error is only while there is one: without it, speck run is off.
    // 0285: the Foreman's status, from speck run's own record, and the stamp of the page's code now.
    try {
      const run = panelRunState(repo, runs), foreman = foremanView({ run, record: readForeman(runs), tickets: out.board && out.board.tickets, fixing: fixingNow(), agent: agentView(runs, out.board && out.board.tickets) });
      const snap = boards.snapshot({ ...panelBoard(out.board), ...(run.on ? { run } : {}), ...(restartError ? { restart_error: restartError } : {}), foreman, ...pageNow() });
      return { status: 200, body: snap.body, snap };
    }
    catch (e) { return { status: 500, body: JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) }) }; }
  };
  const answerState = (res, have) => {
    if (closed(res)) return;
    const { state: { status, body, snap }, version } = latest, out = snap ? boards.answer(snap, version, have) : { body, name: null };
    send(res, status, 'application/json', out.body, out.name ? { 'X-Speck-Board': out.name } : {});
  };
  // 0187: each board that differs from the last is announced to every open page's event stream (see boardFeed), and
  // latest is that reading, which each page then asks for, so a change is read once however many pages are open.
  let latest = null, refresh = false;
  const logs = logFeed(runs, (...a) => feed.send(...a), id => panelLog(repo, id)); // 0189: each log a page opens, as it's written
  const feed = boardFeed(repo, runs, () => { refresh = true; if (!reading) nextReading(); }, logs);
  const announce = out => { const state = stateOf(out), version = feed.announce(state.body); if (state.snap) boards.keep(version, state.snap); latest = { state, at: writes, version }; };
  const nextReading = () => {
    const these = waiting.filter(w => !closed(w.res));
    waiting = [];
    const wanted = refresh && feed.watched();
    // With no page open, a change isn't read until one asks, but the last reading is out of date.
    if (refresh && !wanted) latest = null;
    refresh = false;
    if (!these.length && !wanted) return;
    reading = { at: writes, these };
    readBoard().then(out => {
      const done = reading;
      reading = null;
      // A write has finished since this reading started: its requests wait for the next one, which shows the write.
      if (done.at !== writes) { waiting = [...done.these, ...waiting]; refresh = true; }
      else { announce(out); for (const { res, have } of done.these) answerState(res, have); }
      nextReading();
    });
  };
  const changed = feed.changed;
  // A page asking for the board a stream announced gets the latest reading, unless a write has finished since it.
  const askState = (res, told = null, have = null) => {
    if (told !== null && latest && latest.at === writes && latest.version >= told) return answerState(res, have);
    if (reading && reading.at === writes) return reading.these.push({ res, have });
    waiting.push({ res, have });
    if (!reading) nextReading();
  };
  // Every write's answer: what it did, after which a reading started before it is out of date.
  const wrote = (res, out) => { writes++; changed(); send(res, out.status, 'application/json', JSON.stringify(out.body)); };
  const server = http.createServer((req, res) => {
    if (!hosts.has(String(req.headers.host || '').toLowerCase())) return send(res, 403, 'text/plain', 'Forbidden: open the panel at 127.0.0.1 or localhost.\n');
    const where = req.url.split('?')[0];
    const ready = where.match(/^\/api\/tickets\/(\d{1,4})\/ready$/);
    if (req.method === 'POST' && ready) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetReady(repo, ready[1]);
        return wrote(res, out);
      } catch (e) { return wrote(res, { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }); }
    }
    const draft = where.match(/^\/api\/tickets\/(\d{1,4})\/draft$/);
    if (req.method === 'POST' && draft) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelBackToPlan(repo, draft[1]);
        return wrote(res, out);
      } catch (e) { return wrote(res, { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }); }
    }
    const priority = where.match(/^\/api\/tickets\/(\d{1,4})\/priority\/([^/]*)$/);
    if (req.method === 'POST' && priority) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelSetPriority(repo, priority[1], priority[2]);
        return wrote(res, out);
      } catch (e) { return wrote(res, { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }); }
    }
    const setting = req.method === 'POST' && where.match(/^\/api\/settings\/([^/]+)\/([^/]*)$/); // 0258: one setting
    const saveAll = req.method === 'POST' && where === '/api/settings/save'; // 0274: the Settings view's one Save
    if ((setting || saveAll) && (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token)))
      return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
    const query = new URLSearchParams(req.url.split('?')[1] || ''); // 0259's ?confirm= and 0261's ?scope=
    if (saveAll) return (async () => wrote(res, await panelSaveRequestAsync(repo, req.url.split('?')[1] || '')))(); // 0311: reads the new builder's models first
    if (setting) return wrote(res, panelSettingRequest(repo, setting[1], setting[2], query.get('confirm'), query.get('scope')));
    const stopPath = where.match(/^\/api\/tickets\/(\d{1,4})\/stop$/);
    if (req.method === 'POST' && stopPath) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelStop(repo, stopPath[1]);
        return wrote(res, out);
      } catch (e) { return wrote(res, { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }); }
    }
    const recommendation = where.match(/^\/api\/tickets\/(\d{1,4})\/recommendation$/); // 0284: Go with the recommendation
    if (req.method === 'POST' && recommendation) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        return wrote(res, goWith(repo, recommendation[1], new Date(), { by: 'user' })); // 0317: only the button is you
      } catch (e) { return wrote(res, { status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }); }
    }
    const reply = where.match(/^\/api\/foreman\/(\d{1,4})\/(answer|dismiss)$/); // 0318: your reply to the Foreman's question
    if (req.method === 'POST' && reply) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      const chunks = [];
      let size = 0, tooBig = false;
      req.on('data', c => { size += c.length; if (size > 65536) tooBig = true; else chunks.push(c); });
      req.on('end', () => {
        if (tooBig) return send(res, 413, 'application/json', JSON.stringify({ error: 'That answer is too long. Shorten it and try again.' }));
        try { return wrote(res, panelForemanReply(repo, reply[1], reply[2], Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { return wrote(res, { status: 500, body: { error: String(e?.message || e) } }); }
      });
      return;
    }
    const ship = where.match(/^\/api\/tickets\/(\d{1,4})\/ship$/);
    if (req.method === 'POST' && ship) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      // One ship at a time, and the page shows it as shipping until it has finished.
      if (shipping) return send(res, 409, 'application/json', JSON.stringify({ error: `Ticket ${shipping} is shipping. Wait for it to finish, then try again.` }));
      shipping = padId(ship[1]);
      panelShip(repo, ship[1])
        .catch(e => ({ status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }))
        .then(out => { shipping = null; wrote(res, out); });
      return;
    }
    const changes = where.match(/^\/api\/tickets\/(\d{1,4})\/changes$/); // 0357: Ask for changes, with the note
    if (req.method === 'POST' && changes) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      requestBody(req).then(body => (body === null ? { status: 413, body: { error: 'That note is too long. Shorten it and try again.' } } : panelChanges(repo, changes[1], body)))
        .catch(e => ({ status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } })).then(out => wrote(res, out));
      return;
    }
    const runSwitch = where.match(/^\/api\/run\/(on|off)$/);
    if (req.method === 'POST' && runSwitch) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      if (switching) return send(res, 409, 'application/json', JSON.stringify({ error: 'speck run is being turned on or off. Wait for that to finish, then try again.' }));
      switching = true;
      Promise.resolve().then(() => (runSwitch[1] === 'on' ? panelRunOn(repo) : panelRunOff(repo)))
        .catch(e => ({ status: 500, body: { error: e instanceof SpeckError ? e.message : String(e?.message || e) } }))
        .then(out => { switching = false; wrote(res, out); });
      return;
    }
    // The panel no longer pauses or plays builds (0145): speck pause and speck play do. Their POSTs get the 404 below.
    const gone = req.method === 'POST' && /^\/api\/tickets\/\d{1,4}\/(pause|play)$/.test(where);
    if (req.method !== 'GET' && !gone) return send(res, 405, 'text/plain', 'Method not allowed.\n');
    if (where === '/') {
      try { return send(res, 200, 'text/html', page()); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the panel page, ${pageFile}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    // 0302: the design's LCD renderer, which draws the builder badges, served as it is.
    if (where === '/lcd.js') {
      try { return send(res, 200, 'text/javascript', fs.readFileSync(path.join(TEMPLATES, 'lcd.js'))); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read ${path.join(TEMPLATES, 'lcd.js')}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    // 0304: the design's dot-matrix typeface for speck's name, served from the repo so it shows with no internet.
    if (where === '/fonts/Doto.ttf') {
      const file = path.join(TEMPLATES, 'fonts', 'Doto.ttf');
      let body;
      try { body = fs.readFileSync(file); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read ${file}: ${e.message}\nPut the file back, then reload.\n`); }
      res.writeHead(200, { 'Content-Type': 'font/ttf', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(stopping ? { Connection: 'close' } : {}) });
      return res.end(body);
    }
    if (Object.hasOwn(icons, where)) {
      let body;
      try { body = fs.readFileSync(path.join(iconsDir, where.slice(1))); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read ${path.join(iconsDir, where.slice(1))}: ${e.message}\nPut the file back, then reload.\n`); }
      if (icons[where] === 'image/png') {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(stopping ? { Connection: 'close' } : {}) });
        return res.end(body);
      }
      return send(res, 200, icons[where], body);
    }
    if (where === '/api/events') return feed.open(res, latest !== null, stopping);
    if (where === '/api/state') {
      const told = String(req.headers['x-speck-board'] ?? '');
      return askState(res, /^\d{1,15}$/.test(told) ? Number(told) : null, String(req.headers['x-speck-have'] ?? ''));
    }
    const log = where.match(/^\/api\/tickets\/(\d{1,4})\/log(\/close)?$/);
    if (log) {
      try { return send(res, 200, 'application/json', JSON.stringify(logs.answer(req.headers, padId(log[1]), !!log[2]))); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't read the build log: ${e.message}` })); }
    }
    // 0257: the settings people tune, read afresh from speck/config.yml each time the Settings view opens.
    // 0276: with the models the reviewer offers, read now too.
    if (where === '/api/settings') {
      return (async () => {
        // 0279: and the builder's, asking Codex once when it's both
        let models, built, foreman, agents, asked = null, cursorAsked = null;
        const read = () => (asked ??= codexModelsAsync());
        const readCursor = () => (cursorAsked ??= agentModelsAsync('cursor')); // 0347: and Cursor once when it's both
        // 0288: and which agents are installed and signed in, for the reviewers it offers, at the same time
        const found = findAgentsAsync({ models: false }).catch(() => undefined);
        try { models = await reviewerModels(repo, read, readCursor); } catch (e) { models = { reviewer: '', why: `Couldn't read the reviewer's models (${e.message}), so type the model's name.` }; }
        try { built = await builderModels(repo, read, readCursor); } catch (e) { built = { builder: '', why: `Couldn't read the builder's models (${e.message}), so type the model's name.` }; }
        // 0348: and the Foreman agent's
        try { foreman = await foremanModels(repo, read, readCursor); } catch (e) { foreman = { foreman: '', why: `Couldn't read the Foreman agent's models (${e.message}), so type the model's name.` }; }
        agents = await found;
        try { send(res, 200, 'application/json', JSON.stringify(panelSettings(repo, { models, builderModels: built, foremanModels: foreman, agents }))); }
        catch (e) { send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't read speck/config.yml: ${e.message}` })); }
      })();
    }
    const pack = where.match(/^\/api\/tickets\/(\d{1,4})\/pack$/);
    if (pack) {
      try { const out = panelPack(repo, pack[1]); return send(res, out.status, 'application/json', JSON.stringify(out.body)); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't make the review pack: ${e.message}` })); }
    }
    // 0294: a picture the builder took of a visual change, shown in its review pack.
    const picture = where.match(/^\/api\/tickets\/(\d{1,4})\/pictures\/(\d{1,3})$/);
    if (picture) {
      let found;
      try { found = pictureFile(repo, picture[1], picture[2]); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the picture: ${e.message}\n`); }
      if (!found) return send(res, 404, 'text/plain', 'No such picture.\n');
      res.writeHead(200, { 'Content-Type': found.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(stopping ? { Connection: 'close' } : {}) });
      return res.end(found.body);
    }
    // 0354: a file in a document task's output folder, linked from its review pack. Only from inside that folder: a path
    // that leads outside it, by .. or by a link, isn't found. A page the build wrote is sandboxed, so it can't act as the panel.
    const output = where.match(/^\/api\/tickets\/(\d{1,4})\/output\/(.+)$/);
    if (output) {
      let rel = null, found;
      try { rel = decodeURIComponent(output[2]); } catch { /* malformed: not found */ }
      try { found = rel === null ? null : documentFile(repo, output[1], rel); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the file: ${e.message}\n`); }
      if (!found) return send(res, 404, 'text/plain', 'No such file.\n');
      res.writeHead(200, { 'Content-Type': found.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        ...(/^(text\/html|image\/svg)/.test(found.type) ? { 'Content-Security-Policy': 'sandbox' } : {}), ...(stopping ? { Connection: 'close' } : {}) });
      return res.end(found.body);
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
  if (!handover) console.log(`speck panel: http://127.0.0.1:${port}/${url ? ` and ${url.origin}/` : ''} (press Ctrl+C to stop)`);
  process.send('ready');

  // Stops taking connections, closes the idle ones at once and the rest once answered (each answer then says
  // Connection: close), so the browser's next request reaches the new server, then exits.
  const stop = () => {
    stopping = true;
    clearInterval(watcher);
    feed.close(); // each page reconnects, to the server taking over
    setTimeout(() => process.exit(0), PANEL_STOP_MS).unref();
    server.close(() => process.exit(0));
    server.closeIdleConnections();
  };
  // Starts a server on the new code and hands over to it once it's ready. If it can't start, this one keeps serving and
  // says why, until a later change.
  const restart = () => {
    if (codeHash() === running) { if (restartError) { restartError = null; changed(); } return; } // back to the code that's running: nothing to do
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
      changed();
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
    // Not while a ship runs: shipping can change the code (merging the base branch), and stopping would drop its answer.
    if (!changedAt || successor || stopping || shipping || switching || Date.now() - changedAt < PANEL_SETTLE_MS) return;
    changedAt = 0;
    restart();
  }, PANEL_WATCH_MS);
}
