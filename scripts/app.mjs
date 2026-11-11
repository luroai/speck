// 0634: `speck app <id>` starts the project's app, commands.start in speck/config.yml, from the ticket's checkout on a
// free port, waits until app_url answers and prints it, leaving the app running. `speck app <id> --stop` stops it.
// Every process the app starts carries, in its environment (procs.mjs), a mark for the ticket in this repo and one for
// that start, so --stop ends every process started for the ticket, even by two starts at once, and never others by
// name. Each start keeps a record and a log in the main checkout's speck/.cache/apps/<id>/.

import fs from 'node:fs';
import crypto from 'node:crypto';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { SpeckError, findRepoRoot, loadConfig, padId } from './core.mjs';
import { buildTicket } from './build-records.mjs';
import { mainCheckout } from './output.mjs';
import { marked, descendants } from './procs.mjs';
import { checkConfigValue } from './config.mjs';

const MARK = 'SPECK_APP_RUN', DEFAULT_URL = 'http://127.0.0.1:{port}/', DEFAULT_SECONDS = 60;
const POLL_MS = 200, ASK_MS = 1000, STOP_MS = 5000, LAST_LINES = 20;
const USAGE = 'Usage: speck app <id> starts the project\'s app for a ticket, and speck app <id> --stop stops it.';

// The settings `speck config show` explains, with speck's defaults, under Building and reviewing.
export const APP_SETTINGS = [
  { key: 'commands.start', default: '',
    explain: 'The command that starts your app, such as "npm run dev -- --port {port}". speck app <id> runs it from the ticket\'s worktree, or the main checkout when the ticket has none, with {port} replaced by a free port. Blank: speck can\'t start your app.' },
  { key: 'app_url', default: DEFAULT_URL,
    explain: 'Where to open your app once it\'s started, with {port} replaced by the same free port. speck app waits until it answers, then prints it.' },
  { key: 'app_start_seconds', default: DEFAULT_SECONDS,
    explain: 'How long speck app waits for app_url to answer. If it doesn\'t answer in time, everything speck app started is stopped, and it prints the last lines your app wrote.' },
];

// The app's settings as speck reads them, checked as `speck config set` checks them, or a SpeckError saying how to fix one.
export function appSettings(cfg) {
  const start = String(cfg.commands?.start ?? '').trim();
  const read = (key, v, fallback) => {
    if (v === undefined || v === null || v === '') return fallback;
    try { return checkConfigValue(key, String(v)); } catch (e) {
      throw new SpeckError(`${e.message} Fix it with \`speck config set ${key} <value>\`, then run this again.`);
    }
  };
  return { start, url: read('app_url', cfg.app_url, DEFAULT_URL) || DEFAULT_URL, seconds: read('app_start_seconds', cfg.app_start_seconds, DEFAULT_SECONDS) };
}

const appsDir = (repo, pad) => {
  const dir = path.join(mainCheckout(repo), 'speck', '.cache', 'apps', pad);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
// The ticket's mark: the same for every start of its app in this repo, and different for every other ticket and repo.
const ticketMark = (repo, pad) => crypto.createHash('sha256').update(`${fs.realpathSync(mainCheckout(repo))}\0${pad}`).digest('hex').slice(0, 32);
// Each start's record, with the mark of that start, `run`, and its address, newest first.
function records(repo, pad) {
  const dir = appsDir(repo, pad);
  return fs.readdirSync(dir).filter(n => /^[0-9a-f-]+\.json$/.test(n)).map(n => {
    try { const r = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); return typeof r?.run === 'string' && typeof r.url === 'string' ? r : null; }
    catch { return null; }
  }).filter(Boolean).sort((a, b) => String(b.started).localeCompare(String(a.started)));
}
const forget = (repo, pad, run) => { for (const ext of ['json', 'log']) { try { fs.unlinkSync(path.join(appsDir(repo, pad), `${run}.${ext}`)); } catch { /* already gone */ } } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Every process still running with the mark, and every process they started.
export function appProcesses(mark) {
  const ours = marked(MARK, mark);
  return [...new Set([...ours, ...ours.flatMap(descendants)])];
}

// A port nothing on this machine is listening on now.
export const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer().on('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Whether anything answers at `url`, with any status, within `ms` in all, however slowly it sends.
export const answers = (url, ms = ASK_MS) => new Promise(resolve => {
  let req;
  const done = ok => { clearTimeout(timer); resolve(ok); };
  const timer = setTimeout(() => { req?.destroy(); resolve(false); }, Math.max(1, ms));
  try { req = (url.startsWith('https:') ? https : http).get(url, { rejectUnauthorized: false }, res => { res.resume(); done(true); }); }
  catch { done(false); return; }
  req.on('error', () => done(false));
});

// Ends every process with the mark, asking first and then forcing any that are left. True once they've all gone.
async function endAll(mark) {
  const signal = (pids, sig) => { for (const p of pids) { try { process.kill(p, sig); } catch { /* gone already */ } } };
  signal(appProcesses(mark), 'SIGTERM');
  for (const until = Date.now() + STOP_MS; Date.now() < until; await sleep(100)) if (!appProcesses(mark).length) return true;
  signal(appProcesses(mark), 'SIGKILL');
  for (const until = Date.now() + STOP_MS; Date.now() < until; await sleep(100)) if (!appProcesses(mark).length) return true;
  return false;
}

const lastLines = log => {
  let text = '';
  try { text = fs.readFileSync(log, 'utf8'); } catch { /* nothing written */ }
  const lines = text.replace(/\s+$/, '').split('\n').filter((l, i, all) => l || i < all.length - 1);
  return lines.length ? lines.slice(-LAST_LINES).join('\n') : '(it wrote nothing)';
};

// Starts the ticket's app and resolves to its address once it answers, or rejects with a SpeckError once it's stopped it.
export async function startApp(repo, id) {
  const cfg = loadConfig(repo), { start, url: urlTemplate, seconds } = appSettings(cfg);
  if (!start) throw new SpeckError('commands.start isn\'t set, so speck can\'t start your app: set it with `speck config set commands.start "<command>"`, using {port} for the port it should listen on.');
  const { at } = buildTicket(repo, cfg, padId(id)), pad = padId(id); // refuses a ticket that isn't there
  const was = records(repo, pad).find(r => appProcesses(r.run).length);
  if (was) {
    console.log(`Ticket ${pad}'s app is already running at ${was.url}. Stop it with speck app ${pad} --stop.`);
    return was.url;
  }
  const run = crypto.randomUUID(), dir = appsDir(repo, pad), file = path.join(dir, `${run}.json`), log = path.join(dir, `${run}.log`);
  const port = await freePort(), url = urlTemplate.replaceAll('{port}', String(port));
  const env = { ...process.env, [MARK]: `${ticketMark(repo, pad)}:${run}`, PORT: String(port) };
  const fd = fs.openSync(log, 'w');
  let child;
  try { child = spawn(start.replaceAll('{port}', String(port)), { shell: true, cwd: at, detached: true, stdio: ['ignore', fd, fd], env }); }
  finally { fs.closeSync(fd); }
  let exited = null;
  child.on('error', e => { exited = `couldn't run: ${e.message}`; });
  child.on('exit', code => { exited = `stopped with exit code ${code}`; });
  child.unref();
  const r = { pid: child.pid, run, port, url, cwd: at, log, started: new Date().toISOString() };
  fs.writeFileSync(file, `${JSON.stringify(r)}\n`);
  const fail = async why => {
    await endAll(run);
    const last = lastLines(log);
    forget(repo, pad, run);
    throw new SpeckError(`Ticket ${pad}'s app ${why}, so everything speck app started for it was stopped. The last lines it wrote:\n${last}`);
  };
  for (const until = Date.now() + seconds * 1000; Date.now() < until; await sleep(POLL_MS)) {
    if (await answers(url, Math.min(ASK_MS, until - Date.now()))) {
      child.removeAllListeners();
      console.log(`Ticket ${pad}'s app is running at ${url} (from ${at}). Stop it with speck app ${pad} --stop.`);
      return url;
    }
    if (exited && !appProcesses(run).length) return fail(exited); // a command that starts the app in the background and ends is fine
  }
  return fail(`didn't answer at ${url} within ${seconds} seconds`);
}

// Stops every app started for the ticket, with every process each one started. Resolves to whether one was running.
// 0636: `say` takes what it says.
export async function stopApp(repo, id, say = console.log) {
  const pad = padId(id), mark = ticketMark(repo, pad), all = records(repo, pad);
  const urls = all.filter(r => appProcesses(r.run).length).map(r => r.url);
  if (!appProcesses(mark).length) {
    for (const r of all) forget(repo, pad, r.run);
    say(`No app speck started for ticket ${pad} is running.`);
    return false;
  }
  if (!(await endAll(mark))) throw new SpeckError(`Ticket ${pad}'s app didn't stop: processes ${appProcesses(mark).join(', ')} are still running. Stop them yourself.`);
  for (const r of all) forget(repo, pad, r.run);
  say(`Stopped ticket ${pad}'s app${urls.length ? ` at ${urls.join(' and ')}` : ''}.`);
  return true;
}

export function cmdApp(args) {
  const stop = args.includes('--stop'), rest = args.filter(a => a !== '--stop');
  if (rest.length !== 1 || !/^\d+$/.test(rest[0])) throw new SpeckError(USAGE);
  const repo = findRepoRoot();
  const fail = e => { console.error(e instanceof SpeckError ? e.message : `speck app: ${e?.message || e}`); process.exit(e?.code > 0 ? e.code : 1); };
  return (stop ? stopApp(repo, rest[0]) : startApp(repo, rest[0])).then(() => process.exit(0), fail);
}
