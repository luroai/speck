// 0509: `speck panel --background` and `speck panel --stop`. --background starts `speck panel` in its own process
// group and session, writing its output to speck/.cache/panel.log, so it keeps running after the shell that started
// it has ended, and keeps a record of it, speck/.cache/panel-<port>.json, for --stop to find it by.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, findRepoRoot } from './speck.mjs';
import { pidAlive } from './run-switch.mjs';

const START_MS = 15000, STOP_MS = 5000, POLL_MS = 100, ASK_MS = 1000;

function cacheRoot(repo) {
  const root = path.join(repo, 'speck', '.cache');
  fs.mkdirSync(root, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return root;
}
const recordFile = (repo, port) => path.join(cacheRoot(repo), `panel-${port}.json`);
function readRecord(file) {
  try { const r = JSON.parse(fs.readFileSync(file, 'utf8')); return Number.isInteger(r?.pid) && r.pid > 0 && Number.isInteger(r.port) ? r : null; }
  catch { return null; }
}
const forget = file => { try { fs.unlinkSync(file); } catch { /* already gone */ } };
const addresses = (port, url) => `http://127.0.0.1:${port}/${url ? ` and ${url.origin}/` : ''}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Whether this repo's panel answers on the port: its /api/panel names the same folder.
export function panelAnswers(repo, port) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: '/api/panel', headers: { Host: `127.0.0.1:${port}` }, timeout: ASK_MS }, res => {
      let body = '';
      res.setEncoding('utf8').on('data', d => { body += d; });
      res.on('end', () => { try { resolve(res.statusCode === 200 && JSON.parse(body).repo === fs.realpathSync(repo)); } catch { resolve(false); } });
      res.on('error', () => resolve(false));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(false));
  });
}

// `speck panel` with --background or --stop, the port and --url already checked by cmdPanel.
export function panelAway(args, port, url) {
  const background = args.includes('--background'), stop = args.includes('--stop');
  if (background && stop) throw new SpeckError('Give --background or --stop, not both.');
  const fail = e => { console.error(e instanceof SpeckError ? e.message : `speck panel: ${e?.message || e}`); process.exit(e?.code > 0 ? e.code : 1); };
  const given = args.some(a => a === '--port' || a.startsWith('--port='));
  return (background ? startAway(args, port, url) : stopAway(given ? port : null)).catch(fail);
}

async function startAway(args, port, url) {
  const repo = findRepoRoot(), file = recordFile(repo, port), log = path.join(cacheRoot(repo), 'panel.log');
  if (await panelAnswers(repo, port)) {
    console.log(`speck panel: already running at ${addresses(port, url)}`);
    return;
  }
  let from = 0, fd, child;
  try { from = fs.statSync(log).size; } catch { /* no log yet */ }
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  try {
    fd = fs.openSync(log, 'a');
    child = spawn(process.execPath, [cli, 'panel', ...args.filter(a => a !== '--background')],
      { cwd: process.cwd(), detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, SPECK_PANEL_AWAY: '1' } });
  } finally { if (fd !== undefined) fs.closeSync(fd); }
  child.unref();
  const said = () => { try { return fs.readFileSync(log).subarray(from).toString('utf8').trim(); } catch { return ''; } };
  let exited = null;
  child.on('error', e => { exited = { message: `The panel couldn't start: ${e.message}` }; });
  child.on('exit', code => { exited = { code }; });
  fs.writeFileSync(file, `${JSON.stringify({ pid: child.pid, port, url: url?.origin ?? null, started: new Date().toISOString() })}\n`);
  for (const until = Date.now() + START_MS; Date.now() < until; await sleep(POLL_MS)) {
    if (exited) {
      forget(file);
      throw new SpeckError(exited.message || said() || `The panel stopped with exit code ${exited.code} before it was serving. Its output is in speck/.cache/panel.log.`, exited.code > 0 ? exited.code : 1);
    }
    if (await panelAnswers(repo, port)) {
      console.log(`speck panel: ${addresses(port, url)} (running in the background: stop it with speck panel --stop; its output is in speck/.cache/panel.log)`);
      process.exit(0); // the child's exit listener would otherwise hold this process
    }
  }
  try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
  forget(file);
  throw new SpeckError(`The panel didn't answer at ${addresses(port, url)} within ${START_MS / 1000} seconds, so it was stopped. Its output is in speck/.cache/panel.log.`);
}

async function stopAway(port) {
  const repo = findRepoRoot(), root = cacheRoot(repo);
  const files = port !== null ? [recordFile(repo, port)]
    : fs.readdirSync(root).filter(n => /^panel-\d+\.json$/.test(n)).map(n => path.join(root, n));
  let stopped = 0;
  for (const file of files) {
    const r = readRecord(file);
    // A record whose process has gone, or whose port no longer has this repo's panel (its pid may be another
    // process's by now), is stale: nothing of ours to stop.
    if (!r || !pidAlive(r.pid) || !(await panelAnswers(repo, r.port))) { forget(file); continue; }
    try { process.kill(r.pid, 'SIGTERM'); } catch { /* gone already */ }
    let gone = await goneWithin(r, STOP_MS);
    if (!gone) { try { process.kill(-r.pid, 'SIGKILL'); } catch { /* gone already */ } gone = await goneWithin(r, STOP_MS); }
    if (!gone) throw new SpeckError(`The panel at http://127.0.0.1:${r.port}/ (process ${r.pid}) didn't stop. Stop that process yourself.`);
    forget(file);
    console.log(`speck panel: stopped the panel at http://127.0.0.1:${r.port}/`);
    stopped++;
  }
  if (!stopped) console.log(`speck panel: no panel started with --background is running here${port !== null ? ` on port ${port}` : ''}.`);
}

async function goneWithin(r, ms) {
  for (const until = Date.now() + ms; Date.now() < until; await sleep(POLL_MS))
    if (!pidAlive(r.pid) && !(await panelAnswers(findRepoRoot(), r.port))) return true;
  return false;
}
