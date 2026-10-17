// speck run's ship queue (0193): ships each approved ticket that auto_ship covers, one at a time, once whatever stopped
// its last ship has changed, so none waits for the user after its build's own auto-ship didn't finish.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sh, ticketBranches } from './core.mjs';
import { shipState, otherShipRunning } from './ship.mjs';
import { sharedCacheDir } from './turns.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));

// The approved tickets speck run may ship, from `speck status --json`'s tickets, in the order it ships them: fix
// tickets first, then the one approved earliest. auto_ship there is what `speck ship --auto` decides. A ticket whose
// build is still running, such as one handed back to it (0194), waits for that build to end.
export function shipOrder(tickets) {
  const at = t => { const ms = Date.parse(t.approved); return Number.isFinite(ms) ? ms : Infinity; };
  return tickets.filter(t => t.status === 'approved' && t.auto_ship === true && !t.build_running)
    .sort((a, b) => (b.type === 'fix') - (a.type === 'fix') || (at(a) - at(b) || 0) || String(a.id).localeCompare(String(b.id)));
}

// The commit a local branch is at, or '' if it isn't there.
const headOf = (repo, branch) => { const r = sh('git', ['rev-parse', '--verify', '-q', `refs/heads/${branch}`], { cwd: repo }); return r.status === 0 ? r.stdout.trim() : ''; };

// The commits the base branch and the ticket's branch are at: '' for one that isn't there, or when there's more than one.
export function refsOf(repo, cfg, id) {
  let branches = [];
  try { branches = ticketBranches(repo, cfg, id); } catch { /* unreadable: no branch */ }
  return { base: headOf(repo, cfg.base_branch), head: branches.length === 1 ? headOf(repo, branches[0]) : '' };
}

// An earlier auto-ship of the ticket that ended without shipping (its build's own, or one an earlier speck run started)
// counts as its last try when neither branch has a commit since it started. Commit times are in whole seconds, so a
// commit in the same second counts as newer: at worst the ticket is tried once more. Returns its message, or null.
function earlierTry(repo, runs, id, refs) {
  const s = shipState(runs, id);
  if (!s || s.running || !s.ended) return null;
  const started = Date.parse(s.started);
  const older = sha => { if (!sha) return false; const r = sh('git', ['show', '-s', '--format=%ct', sha], { cwd: repo }); return r.status === 0 && Number(r.stdout.trim()) * 1000 + 1000 <= started; };
  return older(refs.base) && older(refs.head) ? s.message || '' : null;
}

// The last line a ship wrote to its log, which is its refusal when it didn't ship.
function lastLine(log) {
  try { return fs.readFileSync(log, 'utf8').trim().split('\n').pop().trim(); } catch { return ''; }
}

// Starts `speck ship <id> --auto` from the repo in its own process group, so stopping speck run leaves it running,
// writing to `log`. SPECK_SHIP_ALONE has it exit 15, changing nothing, if another ship is running as it starts. done(code, error) is called once as it ends: its exit code (null if a signal ended it), or the error
// that stopped it starting.
export function launchShip(repo, id, log, done) {
  let fd = null, over = false;
  const end = (code, error = null) => { if (!over) { over = true; done(code, error); } };
  try {
    fd = fs.openSync(log, 'w');
    const child = spawn(process.execPath, [CLI, 'ship', id, '--auto'], { cwd: repo, detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, SPECK_SHIP_ALONE: '1' } });
    child.on('error', e => end(null, e.message));
    child.on('exit', code => end(code));
    child.unref();
  } catch (e) { end(null, e.message); }
  finally { if (fd !== null) fs.closeSync(fd); }
}

// The refusals a ticket's build has steps for, by the exit code of the ship, so speck run hands the ticket back (0194):
// a conflict, the tests failing on the ticket merged with the base branch while the base branch's own pass, and the
// base branch's own tests failing.
const HAND_BACK = { 13: 'conflict', 16: 'tests', 14: 'base' };

// speck run's queue. check(tickets), on each of speck run's checks, starts the next ship if one may start now. running()
// is the ticket whose ship it has going, or null (0247). note() is what speck run adds when it stops. `launch` starts
// a ship (launchShip), `say` prints a line, and `handBack` gets { id, kind, why, head } for a refusal the ticket's
// build has steps for, head being its branch as the ship tried it.
// A ticket for which `waiting(id)` is true has a hand-back still to run, so it isn't shipped until that has run.
export function shipQueue(repo, cfg, { say = console.log, launch = launchShip, handBack = () => {}, waiting = () => false } = {}) {
  const runs = sharedCacheDir(repo, 'runs');
  const base = cfg.base_branch;
  const last = new Map(); // each ticket's refs at its last try
  let current = null; // the ship this speck run has going
  let hold = null; // the base branch's commit a ship found failing (exit 14): only fix tickets ship while it's still there
  const killed = new Map(); // 0212: each ticket's refs when a ship of it killed partway was last tried again at once

  const ended = (id, prev, refs, log, since, code, error) => {
    current = null;
    if (code === 0) return say(`Shipped ${id}.`);
    // Another ship started just before it: not a try, so it's tried again once that one has ended.
    if (code === 15) return prev ? last.set(id, prev) : last.delete(id);
    // The record's message is this ship's only if the ship took the record after it started.
    const rec = shipState(runs, id);
    // 0212: a ship killed partway left its record without an end. That's no answer about the ticket, so it's tried
    // again on the next check, once for these refs: killed again with nothing new, it waits for a new commit.
    const key = `${refs.base} ${refs.head}`;
    if (rec && !rec.running && !rec.ended && rec.started >= since && killed.get(id) !== key) {
      killed.set(id, key);
      prev ? last.set(id, prev) : last.delete(id);
      return say(`${id}'s ship was stopped partway, so speck run will try it again.`);
    }
    const why = error || (rec?.started >= since && rec.message) || lastLine(log) || (code === null ? 'it was stopped' : `it exited with ${code}`);
    // 0216: merged but not pushed, so the ticket is done and won't be tried again: its message says how to push it.
    if (!error && rec?.unpushed && rec.started >= since) return say(`${id} merged into ${base} but wasn't pushed: ${why}`);
    say(`${id} didn't ship: ${why}\nspeck run will try it again once ${base} or its branch has a new commit.`);
    if (code === 14) {
      hold = headOf(repo, base); // as the ship ended: it may have tested commits made while it ran
      say(`Shipping is on hold until ${base} passes: speck run won't start another ship, other than a fix ticket's, until ${base} has a new commit.`);
    }
    if (!error && HAND_BACK[code]) handBack({ id, kind: HAND_BACK[code], why, head: refs.head });
  };

  const check = tickets => {
    if (current) return;
    if (hold !== null && headOf(repo, base) !== hold) {
      hold = null;
      say(`${base} has a new commit, so speck run is shipping again.`);
    }
    for (const t of shipOrder(tickets)) {
      // 0263: on hold, only a fix ticket ships, as it's what gives the base branch the commit that lifts the hold.
      if (hold !== null && t.type !== 'fix') continue;
      if (waiting(t.id)) continue;
      const refs = refsOf(repo, cfg, t.id);
      if (!last.has(t.id)) {
        const message = earlierTry(repo, runs, t.id, refs);
        if (message !== null) {
          last.set(t.id, refs);
          say(`${t.id}'s last auto-ship didn't finish${message ? `: ${message}` : '.'}\nspeck run will ship it once ${base} or its branch has a new commit.`);
        }
      }
      const prev = last.get(t.id);
      if (prev && prev.base === refs.base && prev.head === refs.head) continue;
      if (otherShipRunning(runs)) return; // another ship: wait for it to end
      const log = path.join(runs, `${t.id}.ship.log`), since = new Date().toISOString();
      current = t.id;
      last.set(t.id, refs);
      if (hold !== null) say(`${t.id} is a fix ticket, so speck run is shipping it despite the hold on ${base}.`);
      say(`Shipping ${t.id}: speck ship ${t.id} --auto. Log: ${path.relative(repo, log)}`);
      launch(repo, t.id, log, (code, error) => ended(t.id, prev, refs, log, since, code, error));
      return;
    }
  };

  return { check, running: () => current, note: () => (current ? ` The ship of ${current} is still running, and carries on to its end.` : '') };
}
