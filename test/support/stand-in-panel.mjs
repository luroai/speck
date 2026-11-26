// A stand-in for a project's own speck, for speck serve's tests (0756), copied into a project's .speck/scripts/ as its
// speck.mjs. `panel --port <n>` does what speck serve relies on a real panel for, without the cost of starting one:
// it serves GET /api/panel for the folder it was started in, on 127.0.0.1, and keeps a record of itself where real
// panels do (SPECK_PANELS_DIR, which every test sets) while it runs. GET /copy says which file it runs from. SIGUSR2
// makes it another program with the same pid, as if the panel had stopped and its pid had been reused: it stops
// serving, takes its record away and runs on under another name, ending on SIGTERM as most programs do.
// `run` stands in for speck run (0758).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
// 0758: `run` stands in for speck run: it takes speck/.cache/runs/run.lock with its pid, refusing while another holds
// it, says it's watching and runs until SIGINT or SIGTERM, saying it stopped as speck run does and taking the lock away.
if (args[0] === 'run') {
  const runs = path.join(process.cwd(), 'speck', '.cache', 'runs'), lock = path.join(runs, 'run.lock');
  fs.mkdirSync(runs, { recursive: true });
  let held = null;
  try { held = Number(fs.readFileSync(lock, 'utf8').trim()); } catch { /* none */ }
  if (held) { try { process.kill(held, 0); console.error(`speck run is already running (process ${held}).`); process.exit(1); } catch { /* gone */ } }
  fs.writeFileSync(lock, String(process.pid));
  console.log('speck run: watching the board');
  const off = () => { console.log('speck run stopped.'); try { if (Number(fs.readFileSync(lock, 'utf8')) === process.pid) fs.unlinkSync(lock); } catch { /* gone */ } process.exit(0); };
  process.on('SIGINT', off);
  process.on('SIGTERM', off);
  setInterval(() => {}, 1000);
} else if (args[0] !== 'panel') { console.error(`This stand-in speck only runs panel and run, not ${args[0]}.`); process.exit(2); }
if (args[0] === 'panel') startPanel();
function startPanel() {
  const at = args.indexOf('--port');
  const port = Number(args[at + 1]);
  const repo = fs.realpathSync(process.cwd());
  const dir = process.env.SPECK_PANELS_DIR;
  const record = dir ? path.join(dir, `${port}.json`) : null;

  const server = http.createServer((req, res) => {
    const where = req.url.split('?')[0];
    res.setHeader('Content-Type', 'application/json');
    if (where === '/api/panel') return res.end(JSON.stringify({ repo, url: null }));
    if (where === '/copy') return res.end(JSON.stringify({ script: fileURLToPath(import.meta.url), pid: process.pid }));
    res.statusCode = 404;
    res.end('{}');
  });
  server.on('error', e => {
    console.error(e.code === 'EADDRINUSE' ? `Port ${port} is already in use, so the panel didn't start.` : `The panel couldn't start: ${e.message}`);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    if (record) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(record, `${JSON.stringify({ pid: process.pid, port, name: path.basename(repo), repo })}\n`);
    }
    console.log(`speck panel: http://127.0.0.1:${port}/ (press Ctrl+C to stop)`);
  });
  const bye = () => {
    try { if (record && JSON.parse(fs.readFileSync(record, 'utf8')).pid === process.pid) fs.unlinkSync(record); } catch { /* gone already */ }
    process.exit(0);
  };
  process.on('SIGTERM', bye);
  process.on('SIGINT', bye);
  process.on('SIGUSR2', () => {
    server.close();
    try { if (record && JSON.parse(fs.readFileSync(record, 'utf8')).pid === process.pid) fs.unlinkSync(record); } catch { /* gone already */ }
    process.title = 'another-program';
    process.removeAllListeners('SIGTERM');
    process.on('SIGTERM', () => process.exit(0));
    setInterval(() => {}, 1000);
  });
}
