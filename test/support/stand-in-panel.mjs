// A stand-in for a project's own speck, for speck serve's tests (0756), copied into a project's .speck/scripts/ as its
// speck.mjs. `panel --port <n>` does what speck serve relies on a real panel for, without the cost of starting one:
// it serves GET /api/panel for the folder it was started in, on 127.0.0.1, and keeps a record of itself where real
// panels do (SPECK_PANELS_DIR, which every test sets) while it runs. GET /copy says which file it runs from.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args[0] !== 'panel') { console.error(`This stand-in speck only runs panel, not ${args[0]}.`); process.exit(2); }
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
