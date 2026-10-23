// 0415: speck run's output, from speck/.cache/runs/run.log, as the panel's Pipeline pop-up shows it. Only that one
// file is read, whatever a request asks: nothing a page sends names a file, and a run.log that is a link, a folder or
// anything but a plain file is read as no log at all.
import fs from 'node:fs';
import path from 'node:path';

// The latest RUN_LOG_LINES lines are shown, read from the last RUN_LOG_BYTES of the file at most.
export const RUN_LOG_LINES = 200;
const RUN_LOG_BYTES = 256 * 1024;
const NOFOLLOW = fs.constants.O_NOFOLLOW || 0;

const runLogFile = runs => path.join(runs, 'run.log');
const plainFile = file => { try { return fs.lstatSync(file).isFile(); } catch { return false; } };
const stampOf = st => `${st.size}:${st.mtimeMs}`;

// What changes each time speck run writes to run.log, for the board to carry (run_log), or null with no run.log.
export function runLogStamp(runs) {
  const file = runLogFile(runs);
  if (!plainFile(file)) return null;
  try { return stampOf(fs.statSync(file)); } catch { return null; }
}

// The log as GET /api/run-log answers: { lines, stamp }, the latest RUN_LOG_LINES lines, newest first, without blank
// lines at the end, or { lines: null, stamp: null } with no run.log.
export function runLogTail(runs) {
  const file = runLogFile(runs), none = { lines: null, stamp: null };
  if (!plainFile(file)) return none;
  let fd;
  try { fd = fs.openSync(file, fs.constants.O_RDONLY | NOFOLLOW); }
  catch (e) { if (['ENOENT', 'ENOTDIR', 'ELOOP'].includes(e.code)) return none; throw e; }
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) return none;
    const from = Math.max(0, st.size - RUN_LOG_BYTES), buf = Buffer.alloc(st.size - from);
    let got = 0;
    while (got < buf.length) { const n = fs.readSync(fd, buf, got, buf.length - got, from + got); if (!n) break; got += n; }
    const lines = buf.subarray(0, got).toString('utf8').split('\n').map(l => l.replace(/\r$/, ''));
    if (from > 0) lines.shift(); // the first line read may be the end of a longer one
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    return { lines: lines.slice(-RUN_LOG_LINES).reverse(), stamp: stampOf(st) };
  } finally { fs.closeSync(fd); }
}

// What the board carries: { run_log }, which changes with each write to run.log, so a page with the Pipeline pop-up
// open asks for the log again, or nothing with no run.log.
export function runLogPart(runs) {
  const stamp = runLogStamp(runs);
  return stamp ? { run_log: stamp } : {};
}

// GET /api/run-log's answer, { status, body }: always run.log in speck run's records, whatever the request says.
export function runLogAnswer(runs) {
  try { return { status: 200, body: runLogTail(runs) }; }
  catch (e) { return { status: 500, body: { error: `Couldn't read speck run's log: ${e.message}` } }; }
}
