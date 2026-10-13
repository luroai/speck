// speck panel: the control panel in the browser, its server processes and their writes.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEMPLATES, SpeckError, sh, findRepoRoot, loadConfig, findTicket, checkSetValue, checkSetTicket, setTicketField, worktreeList, padId, readableLog, statusData, runsOf, commitTicketOnly } from './speck.mjs';
import { stopBuild, runState, runsDir, pidAlive } from './run.mjs';
import { reviewPack, NO_ROUNDS } from './pack.mjs';

// ---------- panel (a view in the browser, with its writes: Set ready and Back to Plan, a draft's priority, Stop build, Ship and the speck run switch) ----------

const PANEL_PORT = 4777;
const htmlEscape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function panelPort(args) {
  const i = args.findIndex(a => a === '--port' || a.startsWith('--port='));
  if (i === -1) return PANEL_PORT;
  const v = args[i].startsWith('--port=') ? args[i].slice(7) : args[i + 1];
  if (!/^\d+$/.test(v ?? '') || +v < 1 || +v > 65535) throw new SpeckError(`--port must be a whole number from 1 to 65535 (got "${v ?? ''}").`);
  return +v;
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
  const shown = statusData(repo).tickets.find(x => padId(x.id) === padId(pad)) || { status: t.fm.status };
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
// checkout, with trailing blank lines dropped, and whether it has more. A ticket with no log gets empty text. Reads only, writing nothing.
const PANEL_LOG_LINES = 200;
function panelLog(repo, id) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  let text;
  try { text = readableLog(fs.readFileSync(path.join(main, 'speck', '.cache', 'runs', `${padId(id)}.log`), 'utf8'), { times: true }); }
  catch (e) { if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { text: '', truncated: false }; throw e; }
  const lines = text.split('\n');
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return { text: lines.slice(-PANEL_LOG_LINES).join('\n'), truncated: lines.length > PANEL_LOG_LINES };
}

// A ticket's review pack for the panel's Review pack button: the text `speck pack <id>` prints from this checkout now,
// or null when the ticket has no review rounds, which isn't an error. Reads only, writing nothing.
function panelPack(repo, id) {
  try { findTicket(repo, id); } catch (e) { if (e instanceof SpeckError) return { status: 404, body: { error: e.message } }; throw e; }
  try { return { status: 200, body: { pack: reviewPack(repo, id) } }; }
  catch (e) {
    if (!(e instanceof SpeckError)) throw e;
    return e.message === NO_ROUNDS ? { status: 200, body: { pack: null } } : { status: 409, body: { error: e.message } };
  }
}

// 0133: the Ship button in an approved ticket's review pack. It's the user shipping (Gate 2), so it runs `speck ship <id>`
// as /speck-ship does, in its own process, since a ship runs the tests and can take minutes. Resolves with { status,
// body }: 200 and what it printed when it shipped, or 409 and its message when it refused, having changed nothing.
async function panelShip(repo, id) {
  try { findTicket(repo, id); } catch (e) { if (e instanceof SpeckError) return { status: 404, body: { error: e.message } }; throw e; }
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  return new Promise(resolve => {
    const child = spawn(process.execPath, [cli, 'ship', padId(id)], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.setEncoding('utf8').on('data', d => { out += d; });
    child.stderr.setEncoding('utf8').on('data', d => { err += d; });
    child.on('error', e => resolve({ status: 500, body: { error: `Couldn't run speck ship: ${e.message}` } }));
    child.on('close', code => resolve(code === 0
      ? { status: 200, body: { ok: true, message: out.trim() } }
      : { status: 409, body: { error: err.trim() || `speck ship stopped with exit code ${code}.` } }));
  });
}

// 0128: the panel's speck run switch. Turning it on starts `speck run` for this repo in its own process group, with its
// output going to speck/.cache/runs/run.log, so it keeps running after the page is closed and after `speck panel` stops,
// Ctrl+C included. Resolves with { status, body }: 200 and the run once it holds the lock, or 409 and speck run's own
// message when it refused, having changed nothing.
const RUN_SWITCH_MS = 10000, RUN_SWITCH_POLL_MS = 50;
function panelRunOn(repo) {
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  const log = path.join(runsDir(repo), 'run.log');
  let from = 0, fd, child;
  try { from = fs.statSync(log).size; } catch { /* no output yet */ }
  try {
    fd = fs.openSync(log, 'a');
    child = spawn(process.execPath, [cli, 'run'], { cwd: repo, detached: true, stdio: ['ignore', fd, fd] });
  } catch (e) { return Promise.resolve({ status: 500, body: { error: `Couldn't start speck run: ${e.message}` } }); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
  child.unref();
  // What this speck run has written to the log so far.
  const said = () => { try { return fs.readFileSync(log).subarray(from).toString('utf8').trim(); } catch { return ''; } };
  return new Promise(resolve => {
    let check, timer;
    const finish = out => { clearInterval(check); clearTimeout(timer); resolve(out); };
    child.on('error', e => finish({ status: 500, body: { error: `Couldn't start speck run: ${e.message}` } }));
    child.on('exit', code => finish({ status: 409, body: { error: said() || `speck run stopped with exit code ${code} before it was on.` } }));
    check = setInterval(() => {
      const run = runState(runsOf(repo));
      if (run.on && run.pid === child.pid) finish({ status: 200, body: { ok: true, run } });
    }, RUN_SWITCH_POLL_MS);
    timer = setTimeout(() => finish({ status: 500, body: { error: `speck run (process ${child.pid}) started but didn't take its lock within ${RUN_SWITCH_MS / 1000} seconds. Its output is in ${path.relative(repo, log)}.` } }), RUN_SWITCH_MS);
  });
}

// True when the process is `speck run`, from its command line, so a lock left with a pid that has since been reused by
// another program never gets that program stopped.
function isSpeckRun(pid) {
  const r = sh('ps', ['-ww', '-o', 'args=', '-p', String(pid)]);
  return r.status === 0 && /speck(\.mjs)?\s+run(\s|$)/.test(r.stdout.trim());
}

// Turning it off stops the running `speck run`, from the panel or a terminal, as Ctrl+C does: SIGINT, which it answers by
// stopping and leaving its builds running. Resolves once it has stopped.
function panelRunOff(repo) {
  const run = runState(runsOf(repo));
  if (!run.on) return Promise.resolve({ status: 409, body: { error: 'speck run is off already.' } });
  if (!isSpeckRun(run.pid))
    return Promise.resolve({ status: 409, body: { error: `speck run's lock names process ${run.pid}, which isn't speck run, so it wasn't stopped. If no speck run is running, delete ${path.relative(repo, path.join(runsOf(repo), 'run.lock'))}.` } });
  try { process.kill(run.pid, 'SIGINT'); }
  catch (e) { return Promise.resolve({ status: 500, body: { error: `Couldn't stop speck run (process ${run.pid}): ${e.message}` } }); }
  const end = Date.now() + RUN_SWITCH_MS;
  return new Promise(resolve => {
    const check = setInterval(() => {
      const now = runState(runsOf(repo));
      if (!pidAlive(run.pid) || now.pid !== run.pid) { clearInterval(check); resolve({ status: 200, body: { ok: true, run: { on: false, pid: null } } }); }
      else if (Date.now() > end) { clearInterval(check); resolve({ status: 500, body: { error: `speck run (process ${run.pid}) was asked to stop but is still running after ${RUN_SWITCH_MS / 1000} seconds. Try again, or stop it from its terminal.` } }); }
    }, RUN_SWITCH_POLL_MS);
  });
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

// One server process: serves the panel page, /api/state and each ticket's build log and review pack to this machine only, plus the writes,
// POST /api/tickets/<id>/ready, POST /api/tickets/<id>/draft, POST /api/tickets/<id>/priority/<n>, POST /api/tickets/<id>/stop, POST /api/tickets/<id>/ship and POST /api/run/on or /off. Every request reads the files afresh, the page
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
  let shipping = null; // the id of the ticket a Ship button is shipping, until speck ship has finished
  let switching = false; // true while the speck run switch is turning it on or off
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
    const draft = where.match(/^\/api\/tickets\/(\d{1,4})\/draft$/);
    if (req.method === 'POST' && draft) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelBackToPlan(repo, draft[1]);
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
    const stopPath = where.match(/^\/api\/tickets\/(\d{1,4})\/stop$/);
    if (req.method === 'POST' && stopPath) {
      if (!origins.has(String(req.headers.origin || '').toLowerCase()) || !sameToken(req.headers['x-speck-token'], token))
        return send(res, 403, 'application/json', JSON.stringify({ error: 'Forbidden: only the panel page this server sent can do that. Reload it.' }));
      try {
        const out = panelStop(repo, stopPath[1]);
        return send(res, out.status, 'application/json', JSON.stringify(out.body));
      } catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
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
        .then(out => { shipping = null; send(res, out.status, 'application/json', JSON.stringify(out.body)); });
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
        .then(out => { switching = false; send(res, out.status, 'application/json', JSON.stringify(out.body)); });
      return;
    }
    // The panel no longer pauses or plays builds (0145): speck pause and speck play do. Their POSTs get the 404 below.
    const gone = req.method === 'POST' && /^\/api\/tickets\/\d{1,4}\/(pause|play)$/.test(where);
    if (req.method !== 'GET' && !gone) return send(res, 405, 'text/plain', 'Method not allowed.\n');
    if (where === '/') {
      try { return send(res, 200, 'text/html', page()); }
      catch (e) { return send(res, 500, 'text/plain', `Couldn't read the panel page, ${pageFile}: ${e.message}\nPut the file back, then reload.\n`); }
    }
    if (where === '/api/state') {
      // run is there only while speck run is on, as restart_error is only while there is one: without it, speck run is off.
      try { const run = runState(runsOf(repo)); return send(res, 200, 'application/json', JSON.stringify({ ...statusData(repo), ...(run.on ? { run } : {}), ...(restartError ? { restart_error: restartError } : {}) })); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: e instanceof SpeckError ? e.message : String(e?.message || e) })); }
    }
    const log = where.match(/^\/api\/tickets\/(\d{1,4})\/log$/);
    if (log) {
      try { return send(res, 200, 'application/json', JSON.stringify(panelLog(repo, log[1]))); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't read the build log: ${e.message}` })); }
    }
    const pack = where.match(/^\/api\/tickets\/(\d{1,4})\/pack$/);
    if (pack) {
      try { const out = panelPack(repo, pack[1]); return send(res, out.status, 'application/json', JSON.stringify(out.body)); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: `Couldn't make the review pack: ${e.message}` })); }
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
    // Not while a ship runs: shipping can change the code (merging the base branch), and stopping would drop its answer.
    if (!changedAt || successor || stopping || shipping || switching || Date.now() - changedAt < PANEL_SETTLE_MS) return;
    changedAt = 0;
    restart();
  }, PANEL_WATCH_MS);
}
