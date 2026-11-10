// 0619: stopping the panels a build left running once it ends, and no others. A panel a build started records itself
// in the build's own folder (buildPanelsDir), and only a process there whose environment still holds the build's
// session is stopped, so a panel you started, or a process that has since taken a gone panel's pid, never is.
import fs from 'node:fs';
import path from 'node:path';
import { BUILD_ENV } from './build-env.mjs';
import { processesWithEnv } from './build-procs.mjs';
import { buildPanelsDir } from './panel-projects.mjs';
import { pidAlive } from './run-switch.mjs';

const KILL_MS = 3000; // how long a panel has to stop on SIGTERM before it's killed

// Stops the panels the build with this session left running, and deletes their folder. Returns them, as [{ port, pid }].
export function stopBuildPanels(session, env = process.env) {
  if (typeof session !== 'string' || !session) return [];
  const dir = buildPanelsDir(session, env);
  if (!dir || !fs.existsSync(dir)) return [];
  const records = [];
  for (const n of fs.readdirSync(dir).filter(n => /^\d{1,5}\.json$/.test(n))) {
    try { const r = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); if (Number.isInteger(r?.pid) && r.pid > 0) records.push({ port: Number(n.slice(0, -5)), pid: r.pid }); }
    catch { /* half-written, or gone meanwhile */ }
  }
  const entry = `${BUILD_ENV}=${session}`;
  const ours = new Set(records.length ? processesWithEnv(entry) : []);
  const stopped = records.filter(r => ours.has(r.pid) && r.pid !== process.pid);
  for (const r of stopped) try { process.kill(r.pid, 'SIGTERM'); } catch { /* gone already */ }
  if (stopped.length) setTimeout(() => {
    const still = new Set(processesWithEnv(entry));
    for (const r of stopped) if (still.has(r.pid) && pidAlive(r.pid)) try { process.kill(r.pid, 'SIGKILL'); } catch { /* gone already */ }
  }, KILL_MS).unref();
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* gone already */ }
  return stopped;
}

// The same for the build whose run record is `file`: the session in its environment, a Codex build's env_session.
// Says which panels it stopped, prefixed with the ticket's id, and never throws.
export function stopPanelsOfRun(id, file, say = console.log) {
  try {
    const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
    const stopped = stopBuildPanels(rec?.env_session ?? rec?.session);
    for (const r of stopped) say(`${id}: stopped the panel its build left running at http://127.0.0.1:${r.port}/.`);
    return stopped;
  } catch (e) {
    if (e?.code !== 'ENOENT') say(`${id}: couldn't stop the panels its build left running (${e.message}).`);
    return [];
  }
}
