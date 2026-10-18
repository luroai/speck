// 0284: the panel's Go with the recommendation button on a blocked question. The panel records the choice in the
// ticket's Notes, sets it building and commits it, and keeps the choice in the build's run record as go_with. speck
// run's next check then resumes the build's own session with a message saying so, as it does after a hand-back (0194).
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, setField, syncHeader, contentLines, waitFields, worktreeList } from './core.mjs';
import { replaceSection, commitTicketOnly } from './close.mjs';
import { buildTicket, saveRecord, resumeHint } from './build-records.mjs';
import { questionFacts } from './question-facts.mjs';
import { pidAlive, runState } from './run-switch.mjs';
import { resumeFor } from './hand-back.mjs';
import { refsOf } from './ship-queue.mjs';
import { sessionInUse } from './build-procs.mjs';
import { splitCommand } from './reviewers.mjs';
import { codexBuilds, codexStartWords } from './codex-build.mjs';
import { cursorBuilds, cursorStartWords } from './cursor-build.mjs';

// What the build's session is told when speck run resumes it. `skill` is how its agent names /speck-build. 0286: `by`
// 'foreman' when the Foreman chose it (foreman_fixing: fix), not the user.
export const goWithMessage = (id, option, skill = '/speck-build', by = 'user') =>
  `${by === 'foreman' ? 'The Foreman (foreman_fixing: fix) chose' : 'The user chose'} the recommended option for ticket ${id}'s blocked question: ${option}. It's recorded in the ticket's Notes, and the ticket is building again. Carry on with ${skill} ${id} from where you left off, going with that option.`;
// 0286: how the Notes line says the Foreman chose it, which is also how it knows it has chosen once for the ticket.
export const FOREMAN_CHOSE = 'chosen by the Foreman';
const choseOnce = lines => (lines || []).some(line => /^\s*[-*]\s+Went with the recommendation:/.test(line) && line.includes(`(${FOREMAN_CHOSE}`));

// A ticket's run record from speck run, or null when it has none or it can't be read.
function readRecord(runs, id) {
  if (!/^[\w-]+$/.test(String(id))) return null;
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return null; }
  return rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : null;
}
// The main checkout's speck/.cache/runs/, where speck run keeps its records, as runsOf in speck.mjs finds it.
function runsOf(repo) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'runs');
}
// The choice waiting in a run record: { option, at, head }, head being the commit the ticket's branch was at once the
// choice was committed. null when there's none.
const pendingOf = rec => (rec?.go_with && typeof rec.go_with === 'object' && typeof rec.go_with.option === 'string' && rec.go_with.option && typeof rec.go_with.head === 'string' && rec.go_with.head ? rec.go_with : null);

// The words speck run starts builds with, as it reads them from speck/config.yml, or [] when it has none it can use.
function runWords(cfg) {
  if (codexBuilds(cfg)) return codexStartWords(cfg);
  if (cursorBuilds(cfg)) return cursorStartWords(cfg, 'agent');
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  try { return command ? splitCommand(command) : []; } catch { return []; }
}
// Why speck run couldn't resume the build in run record `rec`, in a few words, or null when it can.
const cantResume = (cfg, id, rec) => (!rec ? 'it has no run record from speck run' : resumeFor(runWords(cfg), cfg, id, rec, '').why ?? null);

// Whether the panel can offer the button: speck run built it, and could resume its session.
export const goWithResumable = (runs, id, cfg) => cantResume(cfg, id, readRecord(runs, id)) === null;
// Whether speck run has a choice waiting to resume the build with.
export const goWithWaiting = (runs, id) => !!pendingOf(readRecord(runs, id));

// The panel's write. Every refusal comes before the first write. The choice goes in the run record once it's committed,
// with the commit the branch is then at. Returns { status, body } for the server to send.
// 0286: with `by` 'foreman', speck run's Foreman makes the choice, saying so in the Notes, at most once per ticket.
export function goWith(repo, id, now = new Date(), { by = 'user' } = {}) {
  const cfg = loadConfig(repo);
  let at, t;
  try { ({ at, t } = buildTicket(repo, cfg, id)); } catch (e) { if (e instanceof SpeckError) return { status: 404, body: { error: e.message } }; throw e; }
  const pad = t.fm.id, refuse = error => ({ status: 409, body: { error } });
  const byHand = `Answer the question, then run /speck-build ${pad}.`;
  if (t.fm.status !== 'blocked') return refuse(`Ticket ${pad} is "${t.fm.status}", not blocked, so it has no question waiting for you.`);
  const option = questionFacts(contentLines(t.sections['blocked question'])).recommendation;
  if (!option) return refuse(`Ticket ${pad}'s question has no recommendation to go with. ${byHand}`);
  if (by === 'foreman' && choseOnce(t.sections.notes)) return refuse(`The Foreman has already gone with a recommendation for ticket ${pad} once, so this question waits for you. ${byHand}`);
  const runs = runsOf(repo);
  const file = path.join(runs, `${pad}.json`), rec = readRecord(runs, pad);
  const why = cantResume(cfg, pad, rec)
    ?? (!Object.hasOwn(rec, 'exited') && Number.isInteger(rec.pid) && rec.pid > 0 && pidAlive(rec.pid) ? 'its build is still running' : null);
  if (why) return refuse(`Ticket ${pad}'s build can't be resumed from here: ${why}. ${byHand}`);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: at }).stdout.trim();
  if (!branch.startsWith(`${cfg.branch_prefix}${pad}-`)) return refuse(`Ticket ${pad}'s branch isn't checked out where its build left it, so its choice can't be committed there. ${byHand}`);
  const when = `${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const line = `- Went with the recommendation: ${option} (${by === 'foreman' ? `${FOREMAN_CHOSE}, as foreman_fixing is fix` : 'chosen by the user in the panel'}, ${when}).`;
  let text;
  try { text = replaceSection(t.raw, 'Notes', old => (old ? `${old}\n${line}` : line), path.relative(at, t.file)); }
  catch (e) { if (e instanceof SpeckError) return refuse(e.message); throw e; }
  text = syncHeader(waitFields(setField(text, 'status', 'building'), 'blocked', 'building', now.getTime()));
  let commit;
  try { fs.writeFileSync(t.file, text); commit = commitTicketOnly(at, t.file, t.raw, `speck(${pad}): go with the recommendation`); }
  catch (e) { commit = { status: 1, stderr: e.message }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${path.relative(at, t.file)}, so it's still blocked:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  const head = sh('git', ['rev-parse', 'HEAD'], { cwd: at }).stdout.trim();
  try { saveRecord(file, { ...rec, go_with: { option, at: now.toISOString(), head, ...(by === 'foreman' ? { by } : {}) } }); }
  catch (e) { return { status: 500, body: { error: `Your choice is in ${pad}'s Notes and it's set building, but its run record couldn't be saved (${e.message}), so speck run won't resume it. ${resumeHint(cfg, rec)}, and tell it you went with the recommendation.` } }; }
  const on = runState(runs).on;
  return { status: 200, body: { ok: true, id: pad, message: on ? `speck run resumes ${pad}'s build with it.` : `speck run is off: turn it on and it resumes ${pad}'s build with it.` } };
}

// speck run's side: check(tickets), on each of its checks, resumes each building ticket's build that has a choice
// waiting, while a build slot is free, from the folder it started in, logging to the end of its log. Its record loses
// its exit and go_with, keeping the choice as went_with, so the board shows the build running and it's resumed once.
// A choice whose branch has moved since, or whose session is in use, was carried on by hand: it's dropped.
export function goWithQueue({ cfg, words, max, running, startBuild, saveRecord: save, resumeHint: hint = resumeHint, runs, repo }) {
  const check = tickets => {
    for (const t of tickets) {
      if ((t.status !== 'building' && t.status !== 'reviewing') || t.build_running || running.has(t.id)) continue;
      const rec = readRecord(runs(), t.id), g = pendingOf(rec);
      if (!g) continue;
      const file = path.join(runs(), `${t.id}.json`), who = g.by === 'foreman' ? 'the Foreman' : 'you'; // 0286
      const { go_with: _, exited: _e, exit_code: _c, ...kept } = rec;
      if (g.head !== refsOf(repo, cfg, t.id).head || sessionInUse(rec.session)) {
        try { save(file, { ...kept, exited: rec.exited, exit_code: rec.exit_code }); } catch { /* tried again next check */ }
        console.log(`${t.id}: ${who} went with its recommendation, but its build has been carried on since, so speck run left it as it is.`);
        continue;
      }
      if (running.size >= max) return;
      const { argv, why } = resumeFor(words, cfg, t.id, rec, goWithMessage(t.id, g.option, rec.agent === 'codex' ? '$speck-build' : '/speck-build', g.by));
      if (!argv) {
        try { save(file, { ...kept, exited: rec.exited, exit_code: rec.exit_code }); } catch { /* said again next check */ }
        console.log(`${t.id}: ${who} went with its recommendation, but speck run can't resume its build session: ${why}. ${hint(cfg, rec)}, and tell it ${who} went with the recommendation.`);
        continue;
      }
      const next = { ...kept, went_with: g, resume_command: argv };
      try { save(file, next); } catch (e) { console.log(`${t.id}: ${who} went with its recommendation, but speck run couldn't save its run record (${e.message}), so it tries again on its next check.`); continue; }
      const cwd = typeof rec.cwd === 'string' && fs.existsSync(rec.cwd) ? rec.cwd : repo;
      console.log(`${t.id}: ${who} went with its recommendation, so speck run is resuming its build (session ${rec.session}).`);
      startBuild(t.id, argv, cwd, rec.session, 'a', pid => `${JSON.stringify({ ...next, pid: pid ?? rec.pid }, null, 2)}\n`, rec.env_session ?? rec.session);
    }
  };
  return { check };
}
