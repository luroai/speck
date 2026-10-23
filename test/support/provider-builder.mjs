// 0391: a stand-in for Claude Code's CLI on a PATH of its own, with only the system's folders after it, so no real
// Claude Code installed for the user is ever found. Each call records its arguments, environment, folder and pid, then
// exits with FAKE_EXIT after FAKE_MS.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function fakeClaude() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-bin-')), out = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-out-'));
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
const fs = require('fs'), path = require('path'), out = ${JSON.stringify(out)};
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ n, args: process.argv.slice(2), env: process.env, cwd: process.cwd(), pid: process.pid }));
setTimeout(() => process.exit(+(process.env.FAKE_EXIT || 0)), +(process.env.FAKE_MS || 0));
`, { mode: 0o755 });
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'))).sort((a, b) => a.n - b.n);
  return { bin, PATH: [bin, '/usr/local/bin', '/usr/bin', '/bin'].join(path.delimiter), calls };
}

// The word after `flag` in `args`, or undefined.
export const after = (args, flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
