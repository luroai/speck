// Keeps the tests' temporary repos and folders out of the system temporary folder.
// Import this first in every test file. It gives the run its own folder, points
// os.tmpdir() (and every child process) at it, empties it after each test and
// removes it when the process exits. Once its tests are done, and when the process
// exits or is stopped with SIGINT, SIGTERM or SIGHUP, it ends every process the file
// started (see reap.mjs). A run that is killed outright leaves at most this folder
// with the files of the test that was running, and the test helpers that wait on a
// file in it end by themselves once it's removed.
import { after, afterEach } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reap } from './reap.mjs';

export const RUN_TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-test-'));
for (const k of ['TMPDIR', 'TMP', 'TEMP']) process.env[k] = RUN_TMP;

const remove = p => { try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3 }); } catch {} };
export const emptyRunTmp = () => {
  let entries = [];
  try { entries = fs.readdirSync(RUN_TMP); } catch { return; }
  for (const f of entries) remove(path.join(RUN_TMP, f));
};

// Every process this file starts inherits these, even one in a session or process group of its own.
const MARKS = ['TMPDIR', 'TMP', 'TEMP'].map(k => `${k}=${RUN_TMP}`);
export const reapRun = () => reap(MARKS);

afterEach(emptyRunTmp);
after(reapRun);
process.on('exit', () => { reapRun(); remove(RUN_TMP); });
for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) {
  process.once(sig, () => process.exit(128 + n));
}
