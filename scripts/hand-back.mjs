// speck run's hand-backs (0194): when a ship its queue started is refused in a way the ticket's build has steps for,
// speck run resumes that build's own session with a message saying what happened and which steps to follow.
import fs from 'node:fs';
import path from 'node:path';
import { refsOf } from './ship-queue.mjs';
import { shipState } from './ship.mjs';
import { codexResumeArgv } from './codex-build.mjs';

// What a killed build is told when speck run resumes it.
const resumeMessage = (id, skill = '/speck-build') => `The build of ticket ${id} was stopped unexpectedly before it finished, and speck run has resumed it. Carry on with ${skill} ${id} from where you left off.`;

// The steps in /speck-build's section 5 for each kind of hand-back (0194).
const HAND_BACK_STEPS = { conflict: 'Conflict', tests: 'Tests fail together', base: 'Base branch failing' };

// What a build's session is told when speck run hands its ticket back (0194): what the ship found, in speck ship's own
// words, and which of /speck-build's steps to follow. `count` is how many conflict or failing-test hand-backs this one
// makes for the ticket: the third asks the session to block the ticket instead of merging again.
export function handBackMessage({ id, kind, why, base, count }) {
  const what = {
    conflict: `merging it into ${base} hit a conflict`,
    tests: `the tests failed on it as it would land, merged with ${base} as it is now, while ${base}'s own tests pass: its own change broke them, or it doesn't work with ${base}'s newer changes`,
    base: `${base}'s own tests are failing`,
  }[kind];
  const head = `speck run's ship queue tried to ship ticket ${id}, and ${what}, so nothing was shipped. speck ship said: ${why}`;
  if (kind === 'base') return `${head}\nFollow the "Base branch failing" steps in section 5 of /speck-build for ${id}. Leave ${id} approved: once ${base} has a new commit, speck run's ship queue tries it again.`;
  if (count > 2) return `${head}\nspeck run has handed ${id} back twice already without it shipping, so don't merge again: follow the "Handed back again" steps in section 5 of /speck-build for ${id}.`;
  return `${head}\nFollow the "${HAND_BACK_STEPS[kind]}" steps in section 5 of /speck-build for ${id}, in its worktree, until it's approved again. Then stop: speck run's ship queue ships it.`;
}

// build_command turned into the command that resumes a build's session: --session-id {session} becomes
// --resume {session}, and the one word with {id} in it (the prompt) becomes `message`. null if it has neither.
export function resumeArgv(words, id, session, message = resumeMessage(id)) {
  if (typeof session !== 'string' || !session) return null;
  const at = words.findIndex((w, i) => w === '--session-id' && words[i + 1] === '{session}');
  const prompts = words.flatMap((w, i) => (w.includes('{id}') ? [i] : []));
  if (at < 0 || prompts.length !== 1) return null;
  return words.map((w, i) => (i === at ? '--resume' : i === prompts[0] ? message : w.replace(/\{session\}/g, session)));
}

// How speck run resumes a build from its run record `rec`, with `message` (a killed build's by default): { argv }, or
// { argv: null, why } saying in a few words why it can't. A Codex build (0289) carries on its own session with
// `codex exec resume`, once its session id has been read from its log; any other with build_command (resumeArgv).
export function resumeFor(words, cfg, id, rec, message) {
  const session = typeof rec?.session === 'string' && rec.session ? rec.session : null;
  if (rec?.agent === 'codex') {
    const argv = codexResumeArgv(cfg, session, message ?? resumeMessage(id, '$speck-build'));
    return argv ? { argv } : { argv: null, why: 'no session id has been read from its log yet, as Codex stopped before writing one' };
  }
  const argv = resumeArgv(words, id, session, message ?? resumeMessage(id));
  return argv ? { argv } : { argv: null, why: session ? 'build_command needs --session-id {session} and one word with {id} in it' : 'its run record has no session' };
}

// speck run's hand-backs. keep(h) takes one from the ship queue (shipQueue's handBack), check(tickets), on each of
// speck run's checks, resumes each waiting one while a build slot is free, and waiting(id) says whether one is waiting
// for a ticket, so the queue doesn't ship it meanwhile (shipQueue's waiting). `running` is speck run's set of builds,
// `startBuild` starts one as speck run does, and `runs()` is its runs folder.
export function handBackQueue({ repo, cfg, words, max, running, startBuild, saveRecord, resumeHint, runs, fill = () => null }) {
  // A ship speck run started that needs work on its ticket, kept in the build's run record as hand_back, so a restart
  // still hands it back. Carried out by resumeHandBack, from check, once a build slot is free. A ticket whose build
  // session can't be resumed is said once, here, with what to do.
  const keep = h => {
    const file = path.join(runs(), `${h.id}.json`);
    let rec = null;
    try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* no record */ }
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) rec = null;
    if (rec) rec = fill(h.id) ?? rec; // 0289: a Codex build's session, read from its log if it's not kept yet
    const why = !rec ? 'it has no run record from speck run, so it wasn\'t built by speck run' : resumeFor(words, cfg, h.id, rec, '').why ?? null;
    if (!why) try { return saveRecord(file, { ...rec, hand_back: { kind: h.kind, why: h.why, head: h.head, at: new Date().toISOString() } }); } catch (e) { return cantHandBack(h, rec, `its run record couldn't be saved (${e.message})`); }
    cantHandBack(h, rec, why);
  };
  const cantHandBack = (h, rec, why) =>
    console.log(`${h.id} needs its build to follow the "${HAND_BACK_STEPS[h.kind]}" steps in /speck-build, but speck run can't resume its build session: ${why}. ${rec ? resumeHint(cfg, rec) : 'Resume the session that built it'}, and ask it to follow those steps.`);

  // Resumes the build's own session with the hand-back's message, from the folder it started in, logging to the end of
  // its log. Its record loses its exit while it runs, so the board shows the build running, and counts the hand-backs
  // for conflicts and failing tests, so the third asks the session to block the ticket instead.
  const resumeHandBack = (id, file, rec) => {
    const { hand_back: h, exited: _e, exit_code: _c, ...kept } = rec;
    const count = (Number.isInteger(rec.hand_backs) ? rec.hand_backs : 0) + (h.kind === 'base' ? 0 : 1);
    const { argv, why } = resumeFor(words, cfg, id, rec, handBackMessage({ id, kind: h.kind, why: String(h.why ?? ''), base: cfg.base_branch, count }));
    const next = { ...kept, handed_back: new Date().toISOString(), hand_backs: count, hand_back_command: argv };
    if (!argv) { try { saveRecord(file, { ...kept, exited: rec.exited, exit_code: rec.exit_code }); } catch { /* said below */ } return cantHandBack({ id, kind: h.kind }, rec, why); }
    try { saveRecord(file, next); } catch (e) { return cantHandBack({ id, kind: h.kind }, rec, `its run record couldn't be saved (${e.message})`); }
    const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
    console.log(`${id}'s ship needs work on the ticket, so speck run is handing it back to its build (session ${rec.session}).`);
    startBuild(id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...next, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
  };

  // A ticket's hand-back from its run record: { file, rec, h, live }, live while its branch is where the ship found it.
  // null if it has none.
  const pending = id => {
    if (!/^[\w-]+$/.test(String(id))) return null;
    const file = path.join(runs(), `${id}.json`);
    let rec;
    try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
    const h = rec?.hand_back;
    if (!h || typeof h !== 'object' || !Object.hasOwn(HAND_BACK_STEPS, h.kind)) return null;
    return { file, rec, h, live: h.head === refsOf(repo, cfg, id).head };
  };

  // Approved tickets with a hand-back waiting, each handed back while there's a free slot and no ship of it is running.
  // One whose branch has moved since its ship (worked on by hand, say) is dropped: its next ship decides afresh.
  const check = tickets => {
    for (const t of tickets) {
      if (t.status !== 'approved' || t.build_running || running.has(t.id)) continue;
      const p = pending(t.id);
      if (!p) continue;
      if (!p.live) { const { hand_back: _, ...kept } = p.rec; try { saveRecord(p.file, kept); } catch { /* tried again next check */ } continue; }
      if (shipState(runs(), t.id)?.running) continue;
      if (running.size >= max) return;
      resumeHandBack(t.id, p.file, p.rec);
    }
  };

  return { keep, check, waiting: id => !!pending(id)?.live };
}
