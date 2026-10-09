// Keeps the tests' temporary repos and folders out of the system temporary folder.
// Import this first in every test file. It gives the run its own folder, points
// os.tmpdir() (and every child process) at it, empties it after each test and
// removes it when the process exits. A run that is killed outright leaves at most
// this folder with the files of the test that was running.
import { afterEach } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const RUN_TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-test-'));
for (const k of ['TMPDIR', 'TMP', 'TEMP']) process.env[k] = RUN_TMP;

const remove = p => { try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3 }); } catch {} };
export const emptyRunTmp = () => {
  let entries = [];
  try { entries = fs.readdirSync(RUN_TMP); } catch { return; }
  for (const f of entries) remove(path.join(RUN_TMP, f));
};

afterEach(emptyRunTmp);
process.on('exit', () => remove(RUN_TMP));
for (const [sig, n] of [['SIGINT', 2], ['SIGTERM', 15], ['SIGHUP', 1]]) {
  process.once(sig, () => { remove(RUN_TMP); process.exit(128 + n); });
}
