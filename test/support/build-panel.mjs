import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, panelRepo, freePort, startPanel, stop, request, tokenOf } from './panel.mjs';

// A panel repo whose 0001 is building, with a stand-in build launched as speck run does (leading its own process group)
// and its run record; 0002 is building by hand, with no record (0071, 0145).
export const runs = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
export const psState = pid => spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();
export const cli = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
export async function buildPanel() {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
  r.write('0002-two.md', `id: "0002"\ntitle: Two\nstatus: building\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex`);
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  fs.mkdirSync(runs(r.dir, ''), { recursive: true });
  fs.writeFileSync(runs(r.dir, '0001.json'), JSON.stringify({ session: 's-0071', pid: build.pid, cwd: r.dir }));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  const token = tokenOf((await request(port)).body);
  const done = async () => { try { process.kill(build.pid, 'SIGKILL'); } catch {} await stop(p); };
  return { r, port, token, pid: build.pid, done };
}
