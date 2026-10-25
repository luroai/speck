// 0356: speck changes <id> "<note>": the user sends changes they want back to an approved ticket's build. The note goes
// in the ticket's Review log, dated, committed on its branch, and in the build's run record as a hand-back of kind
// 'changes', so speck run resumes the build's own session with it (handBackQueue). Until a round reviews the changes
// and the ticket is approved again, speck next says review and nothing ships it (ticketNext, autoShipWhyNot).
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, findRepoRoot, loadConfig, findTicket, ticketBranches, worktreeList } from './core.mjs';
import { replaceSection, commitTicketOnly } from './close.mjs';
import { buildTicket, saveRecord, resumeHint } from './build-records.mjs';
import { runWords } from './go-with.mjs';
import { resumeFor } from './hand-back.mjs';
import { ticketsRounds } from './review.mjs';
import { shipState } from './ship.mjs';
import { runState } from './run-switch.mjs';
import { changesLine, changesPending, oneLine } from './changes-asked.mjs';
import { tildePaths } from './private-words.mjs';

// A ticket's run record from speck run, or null when it has none or it can't be read.
function readRecord(file) {
  let rec = null;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  return rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : null;
}

// The main checkout's speck/.cache/runs/, where speck run keeps its records, as runsOf in speck.mjs finds it.
function runsOf(repo) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'runs');
}

// Every refusal comes before the first write, so a refused note changes nothing.
export function askForChanges(repo, id, note, now = new Date()) {
  const cfg = loadConfig(repo);
  const pad = findTicket(repo, id).fm.id;
  const { at, t } = buildTicket(repo, cfg, pad);
  const text = oneLine(note);
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: at }).stdout.trim();
  const onBranch = branch.startsWith(`${cfg.branch_prefix}${pad}-`);
  const branches = ticketBranches(repo, cfg, pad);
  if (!onBranch && branches.length)
    throw new SpeckError(`Ticket ${pad}'s branch, ${branches.join(', ')}, isn't checked out, so your note can't be committed there. Check it out, then run this again. Nothing was changed.`);
  if (t.fm.status !== 'approved') {
    const why = t.fm.status === 'done' ? 'It has shipped, so ask for the changes in a new ticket.' : 'Only an approved ticket can have changes sent back to its build.';
    throw new SpeckError(`Ticket ${pad} is "${t.fm.status}", not approved. ${why} Nothing was changed.`);
  }
  if (!text) throw new SpeckError(`Say what you want changed: speck changes ${pad} "<note>". Nothing was changed.`);
  const all = ticketsRounds(at, t);
  if (changesPending(t.raw, all).length)
    throw new SpeckError(`Ticket ${pad} already has changes you asked for waiting for its build. Add to them once it's approved again. Nothing was changed.`);
  const runs = runsOf(repo), file = path.join(runs, `${pad}.json`), rec = readRecord(file);
  const why = !rec ? 'it has no run record from speck run, so it wasn\'t built by speck run' : resumeFor(runWords(cfg), cfg, pad, rec, '').why ?? null;
  if (why) throw new SpeckError(`Ticket ${pad}'s build session can't be resumed: ${why}. Nothing was changed. Ask for the changes in a new ticket, or resume the session that built it and tell it what to change.`);
  if (shipState(runs, pad)?.running) throw new SpeckError(`Ticket ${pad} is being shipped now. Nothing was changed: once it's done, ask for the changes in a new ticket.`);

  const rel = path.relative(at, t.file);
  // Throws before anything is written when the ticket has no Review log heading.
  const updated = tildePaths(replaceSection(t.raw, 'Review log', old => [old, changesLine(text, all.length, now)].filter(Boolean).join('\n'), rel)); // 0506
  let commit;
  try { fs.writeFileSync(t.file, updated); commit = commitTicketOnly(at, t.file, t.raw, `speck(${pad}): changes asked for`); }
  catch (e) { commit = { status: 1, stderr: e.message }; try { fs.writeFileSync(t.file, t.raw); } catch { /* never written */ } }
  if (commit.status !== 0)
    throw new SpeckError(`Couldn't commit ${rel}, so nothing was changed:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  const head = sh('git', ['rev-parse', 'HEAD'], { cwd: at }).stdout.trim();
  try { saveRecord(file, { ...rec, hand_back: { kind: 'changes', why: text, head, at: now.toISOString() } }); }
  catch (e) { throw new SpeckError(`Your note is in ${pad}'s Review log, so it won't ship until it's approved again, but its run record couldn't be saved (${e.message}), so speck run won't resume its build. ${resumeHint(cfg, rec)}, and tell it what to change.`); }
  return `Your note is in ${pad}'s Review log, and ${pad} won't ship until it's approved again. ${runState(runs).on ? `speck run resumes its build with it.` : `speck run is off: turn it on and it resumes ${pad}'s build with it.`}`;
}

export function cmdChanges(args) {
  const [id, ...rest] = args;
  if (!id) throw new SpeckError('Usage: speck changes <id> "<note>"');
  console.log(askForChanges(findRepoRoot(), id, rest.join(' ')));
}
