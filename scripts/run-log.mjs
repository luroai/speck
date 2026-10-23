// 0415: speck run's output, from speck/.cache/runs/run.log, as the panel's Pipeline pop-up shows it. Only that one
// file is read, whatever a request asks: nothing a page sends names a file, and a run.log that is a link, a folder or
// anything but a plain file is read as no log at all.
import fs from 'node:fs';
import path from 'node:path';

// The latest RUN_LOG_LINES lines are shown, whole. The file is read back from its end, RUN_LOG_CHUNK bytes at a time,
// until it holds more line breaks than that or reaches the start, and what was read is decoded once it does.
export const RUN_LOG_LINES = 200;
const RUN_LOG_CHUNK = 64 * 1024;
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
    const chunks = [];
    let from = st.size, breaks = 0, lines = [];
    while (from > 0) {
      const start = Math.max(0, from - RUN_LOG_CHUNK), buf = Buffer.alloc(from - start);
      let got = 0;
      while (got < buf.length) { const n = fs.readSync(fd, buf, got, buf.length - got, start + got); if (!n) break; got += n; }
      chunks.unshift(buf.subarray(0, got));
      from = start;
      for (const b of buf.subarray(0, got)) if (b === 10) breaks++;
      if (breaks <= RUN_LOG_LINES && from > 0) continue;
      lines = Buffer.concat(chunks).toString('utf8').split('\n').map(l => l.replace(/\r$/, ''));
      while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
      // The first line read may be part of a longer one, but with more than RUN_LOG_LINES the latest are whole. Blank
      // lines at the end don't count, so with them it may read on.
      if (lines.length > RUN_LOG_LINES || from === 0) break;
    }
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
