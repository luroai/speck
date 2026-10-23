// 0177: a panel whose board readings are slow, so a test can check what it does meanwhile. Moved here from
// test/panel-0177.test.mjs by 0207, so other tests can use it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, fm, freePort, startPanel, request, tokenOf, cliCopy } from './panel.mjs';

// A copy of the CLI in which, whenever the panel's server process does them, on any thread: each board reading
// (statusData) adds a line to a file, so a test can count them, and each scan of every ticket file (listTickets, which
// a board reading does once) waits SPECK_TEST_READ_MS first, so it's slow, and adds how long it waited to a second file. `extra` is more code to run in each
// reading. Other commands (speck ship, speck run) run at their usual speed. 0429: with SPECK_TEST_SLOW_READS set, only
// that many scans are slow, those started before that many have finished waiting, and the rest run at their usual speed.
export function slowCli(extra = '') {
  const { cli } = cliCopy();
  const panelOnly = "process.execArgv.includes('--input-type=module') && process.env.SPECK_TEST_READS";
  const patch = (file, at, code) => {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(src.includes(at), `${path.basename(file)} has ${at.trim()}`);
    fs.writeFileSync(file, src.replace(at, `${at}  if (${panelOnly}) { ${code} }\n`));
  };
  patch(cli, 'export function statusData(repo) {\n', `fs.appendFileSync(process.env.SPECK_TEST_READS, 'read\\n'); ${extra}`);
  patch(path.join(path.dirname(cli), 'core.mjs'), 'export function listTickets(repo) {\n',
    "const waited = process.env.SPECK_TEST_READS + '.ms', slowed = fs.existsSync(waited) ? fs.readFileSync(waited, 'utf8').split('\\n').filter(Boolean).length : 0; "
    + "if (!(slowed >= Number(process.env.SPECK_TEST_SLOW_READS))) { const t0 = Date.now(); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(process.env.SPECK_TEST_READ_MS)); fs.appendFileSync(waited, (Date.now() - t0) + '\\n'); }");
  return cli;
}

// The slowed panel serving `dir`, each reading taking `ms`, or only the first `slowReads` of them when given (0429).
export async function slowServe(dir, ms, extra, slowReads) {
  const reads = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-reads-')), 'reads.txt');
  fs.writeFileSync(reads, '');
  const p = await startPanel(dir, ['--port', String(await freePort())], slowCli(extra), { SPECK_TEST_READS: reads, SPECK_TEST_READ_MS: String(ms), ...(slowReads ? { SPECK_TEST_SLOW_READS: String(slowReads) } : {}) });
  const token = tokenOf((await request(p.port)).body);
  const readings = () => fs.readFileSync(reads, 'utf8').split('\n').filter(Boolean).length;
  // How long the first reading waited, in ms, once it has (0207): one reading, however many a request then needed.
  const readingMs = () => { const first = fs.readFileSync(`${reads}.ms`, 'utf8').split('\n')[0]; assert.ok(first, 'a reading has finished'); return Number(first); };
  return { p, port: p.port, token, readings, readingMs };
}
// A panel repo with a draft 0002 as well, committed, served slowed.
export async function slowPanel(ms, extra, slowReads) {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', priority: 3 }));
  r.g('add', '-A'); r.g('commit', '-qm', 'two');
  return { r, ...(await slowServe(r.dir, ms, extra, slowReads)) };
}
