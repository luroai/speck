// 0726: machine-wide build slots, kept in ~/.config/speck/build-turns beside machine_parallel_builds. Each speck run
// claims one when it starts a build and frees it when that build ends, so every project on the machine shares the limit.
// Claims are named for the project and ticket, so a restarted speck run reuses the claim of a build still running.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SpeckError } from './core.mjs';
import { homeSettingsDir, machineParallelBuilds } from './home-settings.mjs';

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const parse = text => { try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const alive = pid => Number.isInteger(pid) && pid > 0 && pidAlive(pid);

// The turns folder: ~/.config/speck/build-turns, or under SPECK_HOME_SETTINGS_DIR in the tests. '' when there's no home.
export function buildTurnsDir(env = process.env) {
  const d = homeSettingsDir(env);
  return d ? path.join(d, 'build-turns') : '';
}

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); }
  catch (e) {
    throw new SpeckError(`Can't make ${dir}, where the turns machine_parallel_builds shares are kept (${e.message}). Make it writable, or remove the limit with \`speck config set machine_parallel_builds ""\`, then run this again.`);
  }
}

const claimName = (repo, id) => `${crypto.createHash('sha256').update(String(repo)).digest('hex').slice(0, 16)}.${id}.lock`;

function held(file) {
  const text = read(file);
  if (text === null) return false;
  return alive(parse(text).pid);
}

// Drops claims whose build process has gone, and returns the held ones as { file, text, pid, cwd, id }.
function heldClaims(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.lock')) continue;
    const file = path.join(dir, name), text = read(file);
    if (text === null) continue;
    const o = parse(text);
    if (!alive(o.pid)) { fs.rmSync(file, { force: true }); continue; }
    out.push({ file, text, pid: o.pid, cwd: o.cwd, id: o.id });
  }
  return out;
}

// A short critical section so two speck runs don't both see a free slot and both claim.
function withDirLock(dir, fn) {
  ensureDir(dir);
  const lock = path.join(dir, '.claiming');
  const end = Date.now() + 5000;
  for (;;) {
    try { fs.mkdirSync(lock); break; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // A claim lock left by a killed process: take it over once it's old enough.
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 10000) { fs.rmdirSync(lock); continue; }
      } catch { /* gone, try again */ }
      if (Date.now() > end) throw new SpeckError(`Can't take a turn in ${dir} (another speck run is claiming a build slot). Try again in a moment, or remove the limit with \`speck config set machine_parallel_builds ""\`.`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
  try { return fn(); } finally { try { fs.rmdirSync(lock); } catch { /* already gone */ } }
}

// Tries to take a machine-wide build slot for ticket `id` in `repo`. Returns { file, text } or null when every slot is
// held. With `force` (an already-running build being adopted), always claims so it counts, even when over the limit.
// When the limit isn't set, returns null without claiming.
export function takeBuildTurn(repo, id, pid = process.pid, { force = false } = {}) {
  const max = machineParallelBuilds();
  if (max === null) return null;
  const dir = buildTurnsDir();
  if (!dir) throw new SpeckError(`There's no home folder for machine_parallel_builds's turns, so no build was started. Set HOME, or remove the limit with \`speck config set machine_parallel_builds ""\`.`);
  return withDirLock(dir, () => {
    const file = path.join(dir, claimName(repo, id));
    const existing = heldClaims(dir);
    const mine = existing.find(c => c.file === file || (c.id === id && c.cwd === repo) || c.pid === pid);
    const text = JSON.stringify({ pid, cwd: repo, id });
    if (mine) {
      fs.writeFileSync(mine.file, text);
      return { file: mine.file, text };
    }
    if (!force && existing.length >= max) return null;
    fs.writeFileSync(file, text);
    return { file, text };
  });
}

// Updates a claim to the build's own process once it has started, so the slot stays held if speck run itself ends.
export function pointBuildTurn(claim, pid) {
  if (!claim?.file || !Number.isInteger(pid) || pid <= 0) return claim;
  const cur = parse(claim.text), next = JSON.stringify({ ...cur, pid });
  try { fs.writeFileSync(claim.file, next); } catch { return claim; }
  return { file: claim.file, text: next };
}

// Frees a build's machine slot once the build has ended or no longer counts.
export function freeBuildTurn(claim) {
  if (!claim?.file) return;
  const text = read(claim.file);
  if (text === null || text === claim.text || parse(text).pid === parse(claim.text).pid) fs.rmSync(claim.file, { force: true });
}

// Why a ready ticket can't start: every machine-wide slot is in use. null when the limit isn't set or a slot is free.
export function machineBuildWait() {
  const max = machineParallelBuilds();
  if (max === null) return null;
  const dir = buildTurnsDir();
  if (!dir) return `machine_parallel_builds is ${max}, but there's no home folder for its turns`;
  try { ensureDir(dir); } catch (e) { return e instanceof SpeckError ? e.message : String(e?.message || e); }
  const going = heldClaims(dir);
  if (going.length < max) return null;
  const who = going.map(c => `process ${c.pid}${c.cwd ? ` in ${c.cwd}` : ''}`);
  return `all ${max} build slot${max === 1 ? '' : 's'} on this machine in use (machine_parallel_builds)${who.length ? `: ${who.join('; ')}` : ''}`;
}

// True when this speck run may start another build: under the project's max and, when set, the machine-wide limit.
export function hasBuildRoom(runningSize, projectMax) {
  if (runningSize >= projectMax) return false;
  return machineBuildWait() === null;
}

// Tracks this speck run's claims so start, adopt and end share one map (keeps run.mjs under the line limit).
export function machineClaims() {
  const claims = new Map();
  return {
    drop(id) { freeBuildTurn(claims.get(id)); claims.delete(id); },
    // Claims a slot before a new build starts. true when it may start (no limit, or a slot taken).
    takeForStart(repo, id) {
      if (machineParallelBuilds() === null) return true;
      const claim = takeBuildTurn(repo, id, process.pid);
      if (!claim) return false;
      claims.set(id, claim);
      return true;
    },
    point(id, pid) { const c = claims.get(id); if (c) claims.set(id, pointBuildTurn(c, pid)); },
    // An already-running build counts even when that puts the machine over the limit.
    adopt(repo, id, pid) {
      if (machineParallelBuilds() === null) return;
      const claim = takeBuildTurn(repo, id, pid, { force: true });
      if (claim) claims.set(id, claim);
    },
  };
}
