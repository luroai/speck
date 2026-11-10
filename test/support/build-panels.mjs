// 0619: stand-ins for panels, started inside a build or by you, for build-panels-0619's tests.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PROJECTS = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'panel-projects.mjs')).href;

// A process with `env` that records itself as a panel on `port` (none when 0), as a panel does, and stays running.
export function panelLike(env, port) {
  const code = `${port ? `const { registerPanel } = await import(${JSON.stringify(PROJECTS)}); registerPanel({ port: ${port}, name: 'demo', repo: '/' });` : ''} setInterval(() => {}, 1000);`;
  const p = spawn(process.execPath, ['--input-type=module', '-e', code], { env, detached: true, stdio: 'ignore' });
  p.unref();
  return p;
}

// A panel record for `pid` on `port`, written into `dir` as registerPanel writes one.
export function recordIn(dir, port, pid) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${port}.json`), `${JSON.stringify({ pid, port, name: 'demo', repo: '/' })}\n`);
}

// Waits up to `ms` for `cond`.
export async function until(cond, ms = 10000) {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise(r => setTimeout(r, 50))) if (await cond()) return true;
  return false;
}
