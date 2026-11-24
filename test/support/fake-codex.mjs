import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// A fake `codex` on a PATH of its own: records its arguments, folder, pid and build session in <out>/<n>.json, writes
// a thread.started line (FAKE_THREAD, none when it's blank) as Codex's --json output starts, then exits after FAKE_MS.
const FAKE = `
const fs = require('fs'), path = require('path');
const out = process.env.FAKE_OUT;
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
const call = path.join(out, n + '.json');
fs.writeFileSync(call + '.part', JSON.stringify({ at: Date.now(), args: process.argv.slice(2), cwd: process.cwd(), pid: process.pid, build: process.env.SPECK_BUILD_SESSION }));
fs.renameSync(call + '.part', call); // whole or not there: calls() reads while this runs
if (process.env.FAKE_THREAD) console.log(JSON.stringify({ type: 'thread.started', thread_id: process.env.FAKE_THREAD }));
console.log(JSON.stringify({ type: 'turn.started' }));
setTimeout(() => process.exit(0), +(process.env.FAKE_MS || 0));
`;
export function fakeCodex() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-out-'));
  fs.writeFileSync(path.join(bin, 'fake.cjs'), FAKE);
  fs.writeFileSync(path.join(bin, 'codex'), `#!/bin/sh\nexec "${process.execPath}" "${path.join(bin, 'fake.cjs')}" "$@"\n`, { mode: 0o755 });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => read(path.join(out, f))).sort((a, b) => a.at - b.at);
  return { out, env: o => ({ PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_OUT: out, ...o }), calls };
}
