#!/usr/bin/env node
// speck: Ship code you can't read, and still trust it.
// Deterministic helpers used by the speck skills. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ideaCounts } from './idea-counts.mjs';
import { TEMPLATES, STATUSES, TYPES, SpeckError, sh, git, findRepoRoot, loadConfig, contentLines, setField, blank, ticketType, ticketTask, ticketPriority, byPriority, reviewerSettings, syncHeader, ticketsDir, ideasDir, doneIdeasDir, repoPath, listTickets, findTicket, placeTicket, nextId, slugify, lintTicket, ticketRounds, posix, STATUS_LINE, ideaStatus, writeField, worktreeList, worktreePath, padId, ticketsElsewhere, checkNotBeingBuilt, builderSpent, pausedSince, waitFields } from './core.mjs';
import { cmdReview, cmdRecord, cmdNext, cmdReviewerSettings, cmdReviewRunning, cmdPrompt, cmdDiff } from './review.mjs';
import { cmdPack } from './pack.mjs';
import { cmdPr, prShown } from './pull-request.mjs';
import { cmdPicture } from './pictures.mjs';
import { cmdOutput } from './output.mjs';
import { cmdDiffstat } from './diffstat.mjs';
import { cmdClose, commitTicketOnly } from './close.mjs';
import { SKILL_DIRS, cmdDoctor, cmdInit } from './install.mjs';
import { cmdShip, shipState, autoShipWhyNot } from './ship.mjs';
import { cmdMergeCheck } from './merge-check.mjs';
import { cmdDetect } from './detect.mjs';
import { cmdAgents } from './agents.mjs';
import { cmdConfig } from './config.mjs';
import { cmdConfigShow } from './settings.mjs';
import { cmdTest } from './turns.mjs';
import { cmdPanel, panelServer } from './panel.mjs';
import { cmdRun, cmdPause, cmdPlay, cmdStop, resumeCommandOf, pidAlive, processRows, buildKilled, resumeHint, runState } from './run.mjs';
import { foremanView, foremanLines, readForeman, fixingOf } from './foreman.mjs';
import { withForeman, foremanBoard, foremanTicketLines } from './foreman-took.mjs';
import { agentView, cmdForeman } from './foreman-agent.mjs';
import { logTail } from './build-log.mjs';
import { buildStop, countStop } from './stop-wait.mjs';
import { removeScratch } from './scratch.mjs';
import { roundRunning } from './review-running.mjs';
import { runInProcess } from './in-process.mjs';
import { questionFacts } from './question-facts.mjs';
import { goWithResumable, goWithWaiting } from './go-with.mjs';
import { handedBack } from './hand-back.mjs';
import { buildSession } from './build-records.mjs';
import { noteThisBuild } from './seen-builds.mjs';
import { changesPending } from './changes-asked.mjs';
import { cmdChanges } from './changes.mjs';

// Every name speck.mjs exported before it was split into modules (0018, 0078) can still be imported from it.
export { panelServer };
export { runWorker } from './run.mjs';
export { TEMPLATES, SpeckError, sh, findRepoRoot, parseYaml, loadConfig, parseTicket, setField, reviewerSettings, ticketHeader, syncHeader, findTicket, nextId, lintTicket, changedLines, ticketRounds, writeField, worktreeList, padId } from './core.mjs';
export { stripRounds, validateVerdict, nextAction } from './review.mjs';
export { splitCommand, commandArgs, verdictFromOutput } from './reviewers.mjs';
export { reviewPack } from './pack.mjs';
export { replaceSection, pathsOutside, commitTicketOnly } from './close.mjs';
export { installTooling, doctorChecks } from './install.mjs';
export { shipTicket } from './ship.mjs';
export { shipQueue } from './ship-queue.mjs';
export { readableLog } from './build-log.mjs';

// `ticketed (<ids>)`, with the new id added unless it's already listed. Any other value is replaced.
export function ticketedStatus(value, id) {
  const m = value.match(/^ticketed\b\s*(?:\(([^)]*)\))?(.*)$/);
  const ids = m ? (m[1] || '').split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!ids.includes(id)) ids.push(id);
  return `ticketed (${ids.join(', ')})${m ? m[2] : ''}`;
}

function cmdNew(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const title = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!title) throw new SpeckError('Usage: speck new <title> [--source=path] [--type=bug|fix]');
  const source = (args.find(a => a.startsWith('--source=')) || '').slice(9);
  // Every --type must be --type=bug or every one --type=fix, so a mistyped or second, different value creates nothing.
  const types = args.filter(a => a === '--type' || a.startsWith('--type=')).map(a => a.slice(7));
  const badType = types.find(v => !TYPES.includes(v) || v !== types[0]);
  if (badType !== undefined) throw new SpeckError(`--type must be --type=bug or --type=fix, given once (got "${badType}"). Leave it out for any other ticket.`);
  const type = types[0] || '';
  // The source is checked before anything is written, so a mistyped path creates no ticket.
  // A note in speck/ideas/ that has already been filed in speck/ideas/done/ is found there.
  let sourceFile = source && path.resolve(repo, source);
  const isFile = f => fs.statSync(f, { throwIfNoEntry: false })?.isFile();
  const inInbox = sourceFile && path.dirname(sourceFile) === ideasDir(repo);
  if (inInbox && !isFile(sourceFile) && isFile(path.join(doneIdeasDir(repo), path.basename(sourceFile))))
    sourceFile = path.join(doneIdeasDir(repo), path.basename(sourceFile));
  if (sourceFile && !isFile(sourceFile))
    throw new SpeckError(`No idea note at ${source}. Check the path (relative to the repo root), then run this again.`);
  const filed = inInbox && path.join(doneIdeasDir(repo), path.basename(sourceFile));
  if (filed && filed !== sourceFile && fs.existsSync(filed))
    throw new SpeckError(`${repoPath(repo, filed)} already exists, so ${source} can't be filed there once it's ticketed. Rename one of them, then run this again.`);
  const id = nextId(repo);
  let text = fs.readFileSync(path.join(TEMPLATES, 'ticket.md'), 'utf8');
  text = setField(text, 'id', id);
  text = setField(text, 'title', JSON.stringify(title));
  text = setField(text, 'builder', cfg.builder);
  text = setField(text, 'reviewer', cfg.reviewer);
  const settings = reviewerSettings({}, cfg);
  text = setField(text, 'reviewer_model', settings.model || '');
  text = setField(text, 'reviewer_effort', settings.effort || '');
  // A note that gets a status is filed in speck/ideas/done/, so the ticket points at it there.
  const note = sourceFile && fs.readFileSync(sourceFile, 'utf8');
  const target = note && STATUS_LINE.test(note) && filed ? filed : sourceFile;
  text = setField(text, 'source', JSON.stringify(target && target !== path.resolve(repo, source) ? repoPath(repo, target) : source));
  if (type) text = setField(text, 'type', type);
  // A fix ticket mends a broken base branch, which holds up every ship, so it starts at priority 0, ahead of everything.
  if (type === 'fix') text = setField(text, 'priority', 0);
  text = syncHeader(setField(text, 'created', new Date().toISOString().slice(0, 10)));
  const file = path.join(ticketsDir(repo), `${id}-${slugify(title)}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  if (sourceFile) {
    if (STATUS_LINE.test(note)) {
      fs.writeFileSync(sourceFile, note.replace(STATUS_LINE, (_, head, value) => head + ticketedStatus(value, id)));
      if (target !== sourceFile) { fs.mkdirSync(doneIdeasDir(repo), { recursive: true }); fs.renameSync(sourceFile, target); }
    } else console.error(`⚠️ ${source} has no \`Status:\` line, so its status couldn't be updated. Add \`Status: ticketed (${id})\` to it by hand.`);
  }
  console.log(path.relative(process.cwd(), file));
}

function cmdLint(args) {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, args[0]);
  const { errors, warnings, acceptanceCriteria } = lintTicket(t, cfg);
  for (const e of errors) console.log(`✗ ${e}`);
  for (const w of warnings) console.log(`! ${w}`);
  if (!errors.length) console.log(`✓ ${t.fm.id} passes size rules (${acceptanceCriteria.length} acceptance criteria, size ${t.fm.size}, risk ${t.fm.risk}).`);
  if (errors.length) throw new SpeckError('', 1);
}

function cmdSet(args) {
  const [id, key, ...rest] = args;
  const value = rest.join(' ');
  // priority is the one field that can be cleared, with `speck set <id> priority ""`.
  if (!id || !key || (!value && !(key === 'priority' && rest.length))) throw new SpeckError('Usage: speck set <id> <field> <value>');
  checkSetValue(key, value);
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  checkNotBeingBuilt(repo, cfg, t);
  checkSetTicket(t, cfg, key, value);
  // Setting ready commits the ticket, as the panel does, since `speck start` and `speck run` need it committed on the
  // base branch. Every refusal comes before the first write.
  const ready = key === 'status' && value === 'ready';
  if (ready) {
    const branch = sh('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: repo }).stdout.trim();
    if (branch !== cfg.base_branch)
      throw new SpeckError(`This checkout is ${branch ? `on "${branch}"` : 'not on a branch'}, not ${cfg.base_branch}, so setting ${t.fm.id} ready would commit it to the wrong branch. Switch to ${cfg.base_branch}, then run this again.`);
  }
  const original = t.raw;
  const from = setTicketField(repo, t, key, value);
  // A ticket already committed as ready has nothing to commit.
  const changed = ready && sh('git', ['status', '--porcelain', '--', ...new Set([t.file, from].map(f => path.relative(repo, f)))], { cwd: repo }).stdout.trim();
  if (changed) {
    const commit = commitTicketOnly(repo, t.file, original, `speck(${padId(t.fm.id)}): ready`, from);
    if (commit.status !== 0)
      throw new SpeckError(`Couldn't commit ${posix(path.relative(repo, from))}, so ${t.fm.id} is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}\nFix that, then run this again.`);
  }
  console.log(`${t.fm.id} ${key} → ${value}`);
}

// `speck set`'s checks and write, shared with the panel so the two can't drift. The checks throw a SpeckError saying
// why, before anything is written. checkSetValue needs no ticket, so `speck set` makes it before looking one up.
export function checkSetValue(key, value) {
  if (key === 'priority' && value !== '' && !/^[0-5]$/.test(value))
    throw new SpeckError(`priority must be a whole number from 1 to 5, 0 on a fix ticket, or "" to clear it (got ${JSON.stringify(value)}).`);
}

export function checkSetTicket(t, cfg, key, value) {
  if (key === 'priority' && value === '0' && ticketType(t) !== 'fix')
    throw new SpeckError(`priority must be a whole number from 1 to 5 (got "0"): priority 0 is only for a fix ticket, and ${t.fm.id} isn't one.`);
  if (key !== 'status') return;
  if (!STATUSES.includes(value)) throw new SpeckError(`status must be one of ${STATUSES.join(', ')}.`);
  // Cancelling records why, so it has its own command; `set` would lose the reason.
  if (value === 'cancelled') throw new SpeckError(`Use \`speck cancel ${t.fm.id} "<reason>"\` instead: cancelling records the reason.`);
  if (value === 'ready') {
    const { errors } = lintTicket(t, cfg);
    if (errors.length) throw new SpeckError(`Not ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}`);
  }
}

// Returns where the ticket was before, which differs from t.file when a status change moved it.
export function setTicketField(repo, t, key, value) {
  const from = t.file;
  writeField(t, key, value);
  // Setting done moves the ticket into speck/tickets/done/, and any other status brings it back.
  if (key === 'status') placeTicket(repo, t, value);
  return from;
}

// Cancelling is a status change with a why. The reason and the date are part of the record, so it gets its own
// command rather than `speck set`. The ticket is filed with the finished ones, where it stays visible as cancelled.
function cmdCancel(args) {
  const [id, ...rest] = args;
  if (!id) throw new SpeckError('Usage: speck cancel <id> "<reason>"');
  const reason = rest.join(' ').trim();
  const repo = findRepoRoot();
  const t = findTicket(repo, id);
  // Every refusal comes before the first write, so a refused cancel changes nothing.
  if (blank(reason)) throw new SpeckError(`Give a reason: speck cancel ${t.fm.id} "<reason>".`);
  checkNotBeingBuilt(repo, loadConfig(repo), t, 'cancel');
  if (t.fm.status === 'done') throw new SpeckError(`Ticket ${t.fm.id} is done, so it can't be cancelled: delivered work is part of the record.`);
  if (t.fm.status === 'cancelled') throw new SpeckError(`Ticket ${t.fm.id} is already cancelled.`);
  // Stored as a JSON string, so text like `false`, `0` or `a "quoted" word` reads back exactly as typed. A reason kept from an earlier cancel is replaced in place.
  let text = setField(t.raw, 'cancel_reason', JSON.stringify(reason));
  text = setField(text, 'cancelled', new Date().toISOString().slice(0, 10));
  fs.writeFileSync(t.file, syncHeader(waitFields(setField(text, 'status', 'cancelled'), t.fm.status, 'cancelled')));
  placeTicket(repo, t, 'cancelled');
  console.log(`${t.fm.id} cancelled → ${path.relative(repo, t.file)}`);
  removeScratch(t.fm.id);
}

// ---------- start a build ----------

// True if `p` exists in commit `rev`, following committed symlinks the way a checkout would (speck's own repo links
// .speck/scripts to ../scripts). Nothing on disk or in the index counts.
function inCommit(repo, rev, p, hops = 0) {
  const parts = p.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const r = sh('git', ['ls-tree', rev, '--', parts.slice(0, i + 1).join('/')], { cwd: repo });
    const [mode, , obj] = r.stdout.trim().split(/\s+/);
    if (r.status !== 0 || !obj) return false;
    if (mode === '120000') {
      const target = sh('git', ['cat-file', '-p', obj], { cwd: repo }).stdout;
      const next = path.posix.normalize(path.posix.join(parts.slice(0, i).join('/'), target, ...parts.slice(i + 1)));
      return hops < 10 && !next.startsWith('..') && inCommit(repo, rev, next, hops + 1);
    }
  }
  return true;
}

// Starts building a ready ticket, or a blocked one with no branch: makes its branch from the local base branch, in its own worktree when worktrees
// are on, sets it to building and commits that there. Anything that goes wrong before the start commit is undone.
function cmdStart(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck start <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const pad = t.fm.id;
  // 0217: a build resuming a ticket its last build left stopped starts here, so the time it waited stops counting.
  const note = countStop(repo, pad);
  if (note) console.log(note.trim());
  // An existing build comes first, so resuming from anywhere (even inside its worktree) gets the path to carry on in.
  const list = worktreeList(repo);
  const existing = git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
  if (existing.length) {
    const at = list.find(w => existing.includes(w.branch));
    throw new SpeckError(at
      ? `Ticket ${pad} has already started: ${at.branch} is checked out at\n${at.path}\nCarry on the build there.`
      : `Ticket ${pad} already has a branch, ${existing.join(', ')}. Check it out to carry on the build, or delete it to start again.`);
  }
  // 0219: a blocked ticket with no branch was stopped before its build started it, so it starts as a ready one does.
  if (t.fm.status !== 'ready' && t.fm.status !== 'blocked') throw new SpeckError(`Ticket ${pad} is "${t.fm.status}", not "ready". Only a ready ticket can be started.`);
  const waits = startWaits(repo, cfg, t);
  if (waits) throw new SpeckError(waits);
  const rel = posix(path.relative(repo, t.file));
  if (git(['status', '--porcelain', '--', rel], repo).trim())
    throw new SpeckError(`${rel} has uncommitted changes. Commit it first, so the build starts from the ticket as you approved it.`);
  // Named after the ticket's file, which keeps its name when the title changes.
  const branch = `${cfg.branch_prefix}${path.basename(t.file, '.md')}`;
  if (cfg.worktrees !== true) {
    if (git(['status', '--porcelain'], repo).trim()) throw new SpeckError('You have uncommitted or untracked changes. Commit or remove them so the working tree is clean, then run this again.');
    const from = git(['branch', '--show-current'], repo).trim() || git(['rev-parse', 'HEAD'], repo).trim();
    git(['switch', '-q', '-c', branch, cfg.base_branch], repo);
    try { finishStart(repo, pad); } catch (e) {
      sh('git', ['checkout', '-q', '-f', from], { cwd: repo }); // drops the half-made status change with the branch
      sh('git', ['branch', '-D', branch], { cwd: repo });
      throw e;
    }
    console.log(`Started ${pad} on ${branch}, in this checkout:\n${fs.realpathSync(repo)}`);
    return;
  }
  // A worktree only has what's in the base commit it's made from, so the CLI and every installed skill must be there.
  const skills = SKILL_DIRS.flatMap(d => {
    const abs = path.join(repo, d);
    const names = fs.existsSync(abs) ? fs.readdirSync(abs).filter(n => n.startsWith('speck-')) : [];
    return (names.length ? names : ['speck-build']).map(n => `${d}/${n}/SKILL.md`);
  });
  const missing = ['.speck/scripts/speck.mjs', ...skills].filter(p => !inCommit(repo, cfg.base_branch, p));
  if (missing.length) {
    const what = [...new Set(missing.map(m => m.startsWith('.speck/') ? '.speck/' : m))];
    throw new SpeckError(`${what.join(', ')} ${missing.length > 1 ? 'aren\'t' : 'isn\'t'} in ${cfg.base_branch}'s latest commit, so a worktree wouldn't have ${missing.length > 1 ? 'them' : 'it'}. Commit .speck/ and the skills folders on ${cfg.base_branch} (git add .speck .claude/skills .agents/skills, then commit), then run this again.`);
  }
  const at = worktreePath(list[0].path, branch);
  if (fs.existsSync(at)) throw new SpeckError(`There's already a folder at ${at}. Move or remove it, then run this again.`);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  git(['worktree', 'add', '-q', '-b', branch, at, cfg.base_branch], repo);
  const undo = () => { sh('git', ['worktree', 'remove', '--force', at], { cwd: repo }); sh('git', ['branch', '-D', branch], { cwd: repo }); };
  const setup = String(cfg.worktree_setup || '').trim();
  if (setup) {
    console.log(`Running worktree_setup in the new worktree: ${setup}`);
    const r = sh('sh', ['-c', setup], { cwd: at });
    if (r.status !== 0) {
      undo();
      const tail = (r.stderr || r.stdout).trim().split('\n').slice(-5).join('\n');
      throw new SpeckError(`worktree_setup (${setup}) failed with exit ${r.status}, so the worktree and branch were removed and ${pad} is still ready.${tail ? `\n${tail}` : ''}`);
    }
  }
  try { finishStart(at, pad); } catch (e) { undo(); throw e; }
  console.log(`Started ${pad} on ${branch}, in its own worktree. Do all of the build there:\n${at}`);
}

// Why a ticket can't start yet because of its after: list, or null if every ticket there is done, as speck run waits for.
// Statuses come from statusTickets, so a ticket being built in another worktree shows its real status.
function startWaits(repo, cfg, t) {
  const after = Array.isArray(t.fm.after) ? t.fm.after.map(padId) : [];
  if (!after.length) return null;
  const status = new Map(statusTickets(repo, cfg).map(x => [padId(x.fm.id), x.fm.status]));
  const waiting = [], gone = [];
  for (const id of [...new Set(after)]) {
    const s = status.get(id);
    if (s === 'done') continue;
    if (s === undefined) gone.push(`${id}, which matches no ticket`);
    else if (s === 'cancelled') gone.push(`${id}, which was cancelled`);
    else waiting.push(`${id} (${s})`);
  }
  const why = [];
  if (waiting.length) why.push(`Ticket ${t.fm.id} waits on ${waiting.join(', ')}. It can start once ${waiting.length > 1 ? 'they\'ve' : 'it\'s'} shipped.`);
  if (gone.length) why.push(`Ticket ${t.fm.id}'s after: lists ${gone.join(', and ')}. Take ${gone.length > 1 ? 'them' : 'it'} out of after: before the ticket can start.`);
  return why.length ? why.join('\n') : null;
}

function finishStart(dir, pad) {
  writeField(findTicket(dir, pad), 'status', 'building');
  git(['add', '-A', '--', 'speck/tickets'], dir);
  git(['commit', '-q', '-m', `speck(${pad}): start`], dir);
}

// Every ticket once. A ticket being built elsewhere replaces this checkout's copy of it, so it shows under its real status.
function statusTickets(repo, cfg) {
  const tickets = listTickets(repo);
  for (const t of ticketsElsewhere(repo, cfg)) {
    const i = tickets.findIndex(x => x.fm.id === t.fm.id);
    if (i >= 0) tickets[i] = t; else tickets.push(t);
  }
  return tickets;
}

// Each acceptance criterion's full text without its number: a numbered line at the start of a line begins one, and
// the lines under it (wrapped text, nested lists) belong to it, so a multi-line criterion comes through whole.
function criteriaText(lines = []) {
  const items = [];
  for (const line of lines.join('\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const m = line.match(/^\d+\.\s+(\S.*)$/);
    if (m) items.push([m[1]]);
    else if (items.length) items[items.length - 1].push(line);
  }
  return items.map(l => l.join('\n').replace(/\s+$/, ''));
}

// A section's text without template comments, with leading and trailing empty lines dropped, or null if nothing else is in it.
function sectionText(lines) {
  const text = (lines || []).join('\n').replace(/<!--[\s\S]*?-->/g, '').replace(/^(?:[ \t]*\n)+/, '').replace(/\s+$/, '');
  return text.trim() ? text : null;
}

// The text after `Self-check:` on the first line of Notes that starts with it (a list marker before it is allowed), or null.
function selfCheck(lines) {
  for (const line of (sectionText(lines) || '').split('\n')) {
    const m = line.match(/^\s*(?:[-*+]\s+)?Self-check:(.*)$/);
    if (m) return m[1].trim() || null;
  }
  return null;
}

// How a build launched by `speck run` ended, from its run record and log in the main checkout's speck/.cache/runs/
// (where speck run keeps them): {at, code, message}, or null when there's no record, it can't be read or the build
// hasn't exited. message is the last 50 lines of the log, trailing blank lines dropped, or null when it's missing or empty.
function buildExit(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  const dir = runs;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8')); } catch { return null; }
  if (!rec || typeof rec !== 'object' || !Object.hasOwn(rec, 'exited')) return null;
  let message = null;
  try { message = logTail(path.join(dir, `${id}.log`)); } catch { /* no log */ }
  return { at: rec.exited ?? null, code: rec.exit_code ?? null, message };
}

// True while a build launched by `speck run` is paused: `speck pause` left a <id>.paused file beside its run record
// naming this build's session and pid, and the build has neither exited nor gone. The mark is a file of its own, so
// pause and play never write the run record that speck run keeps.
export function buildPaused(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return false;
  let rec, mark;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); mark = JSON.parse(fs.readFileSync(path.join(runs, `${id}.paused`), 'utf8')); } catch { return false; }
  return !!rec && typeof rec === 'object' && !!mark && typeof mark === 'object' && !Object.hasOwn(rec, 'exited')
    && Number.isInteger(rec.pid) && rec.pid > 0 && mark.pid === rec.pid && mark.session === rec.session && pidAlive(rec.pid);
}

// True while a build launched by `speck run` is running, as `speck pause` sees it: its run record has no exit, and its
// pid is alive and leads its own process group (`leads`).
function buildRunning(runs, id, leads) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return false;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return false; }
  return !!rec && typeof rec === 'object' && !Array.isArray(rec) && !Object.hasOwn(rec, 'exited')
    && Number.isInteger(rec.pid) && rec.pid > 0 && pidAlive(rec.pid) && leads(rec.pid);
}

// A ticket a build has in hand, which a killed build leaves behind.
const inHand = t => t.fm.status === 'building' || t.fm.status === 'reviewing';

// The main checkout's speck/.cache/runs/, where speck run keeps its records and logs.
export function runsOf(repo) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'runs');
}

// What `speck status --json` prints: everything status knows, for programs such as the control panel.
// The field names are a contract (0030); don't rename them.
// Whether a pid leads its own process group, as a build speck run launched does. ps runs once, and only if needed.
const groupLeader = (rows = null) => pid => { try { rows ??= processRows(); } catch { rows = []; } return rows.some(([p, , g]) => p === pid && g === pid); };
// 0177: one ticket's status, worktree and build_running as statusData gives them, reading only that ticket: from the
// worktree its branch is checked out in, as statusTickets does, or else from here.
export function ticketShown(repo, id) {
  let t = ticketsElsewhere(repo, loadConfig(repo), id).at(-1);
  if (!t) try { t = findTicket(repo, id); } catch { return null; }
  return t ? { status: t.fm.status, worktree: t.at || null, build_running: buildRunning(runsOf(repo), t.fm.id, groupLeader()) } : null;
}

export function statusData(repo) {
  const cfg = loadConfig(repo);
  const tickets = statusTickets(repo, cfg);
  const done = new Set(tickets.filter(t => t.fm.status === 'done').map(t => padId(t.fm.id)));
  const runs = runsOf(repo);
  const leads = groupLeader(), fixing = fixingOf(cfg);
  const entries = tickets.map(t => {
    const lint = lintTicket(t, cfg);
    const facts = questionFacts(contentLines(t.sections['blocked question'])); // 0283
    const question = facts.question;
    const after = Array.isArray(t.fm.after) ? t.fm.after : [];
    const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    const stop = inHand(t) ? buildStop(runs, t.fm.id) : null;
    return withForeman(t, fixing, { // 0317
      ...t.fm,
      type: ticketType(t),
      task: ticketTask(t), // 0350
      priority: ticketPriority(t),
      path: posix(path.relative(t.at || repo, t.file)),
      worktree: t.at || null,
      acceptance_criteria: criteriaText(t.sections['acceptance criteria']),
      blocked_question: question || null,
      // 0283: the option the build recommends, whether any option changes what you'd notice, and whether it's a clear winner; null when unknown
      blocked_recommendation: facts.recommendation,
      blocked_noticeable: facts.noticeable,
      blocked_clear: facts.clear,
      // 0284: whether speck run can resume its build, so the panel can offer to go with the recommendation
      blocked_resumable: t.fm.status === 'blocked' && goWithResumable(runs, t.fm.id, cfg),
      lint: { errors: lint.errors.length, warnings: lint.warnings.length },
      problem: sectionText(t.sections.problem),
      outcome: sectionText(t.sections.outcome),
      out_of_scope: sectionText(t.sections['out of scope']),
      notes: sectionText(t.sections.notes),
      self_check: selfCheck(t.sections.notes),
      lint_messages: { errors: lint.errors, warnings: lint.warnings },
      review_model: reviewerSettings(t.fm, cfg).model, // 0382: the model its review runs on, the ticket's or the config's, or null
      // 0167: whether speck ship --auto would ship it once approved, so the panel knows an approved one is waiting for you
      auto_ship: autoShipWhyNot(cfg, padId(t.fm.id), t.fm.risk, ticketRounds(t.raw).rounds, ticketTask(t), changesPending(t.raw, ticketRounds(t.raw).rounds).length > 0) === '', // 0356
      rounds: ticketRounds(t.raw).rounds.map(r => ({
        round: r?.meta?.round ?? null,
        reviewer: r?.meta?.reviewer ?? null,
        verdict: r?.verdict?.verdict ?? null,
        seconds: num(r?.meta?.seconds),
        tokens: (num(r?.meta?.usage?.input_tokens) || 0) + (num(r?.meta?.usage?.output_tokens) || 0),
      })),
      // 0223: the review round being run now, or null: whether the reviewer or the builder is at work on a reviewing ticket.
      review_running: inHand(t) ? roundRunning(runs, t.fm.id, ticketRounds(t.raw).rounds.length) : null,
      waiting_on: after.filter(id => !done.has(padId(id))),
      // 0217: once a build of it has started again, a stopped build is no longer shown as stopped.
      // 0284: nor is one waiting for speck run to resume it with the recommendation you went with.
      build_exit: stop?.counted || (inHand(t) && goWithWaiting(runs, t.fm.id)) ? null : buildExit(runs, t.fm.id),
      session: buildSession(runs, t.fm.id, cfg, resumeCommandOf(cfg)),
      paused: buildPaused(runs, t.fm.id),
      paused_at: (at => (at === null ? null : new Date(at).toISOString()))(buildPaused(runs, t.fm.id) ? pausedSince(path.join(runs, `${t.fm.id}.paused`)) : null),
      build_running: buildRunning(runs, t.fm.id, leads),
      handed_back: handedBack(runs, t.fm.id),
      build_stopped: !!stop?.killed && !stop.counted,
      build_stopped_at: stop?.killed && !stop.counted && stop.since !== null ? new Date(stop.since).toISOString() : null,
      ship: shipState(runs, t.fm.id),
      pull_request: prShown(runs, t.fm.id, t.fm), // 0295: its pull request's link, or why it couldn't be opened
      ...(spent => ({ builder_tokens: spent.tokens, builder_cost_usd: spent.cost_usd }))(builderSpent(runs, t.fm.id)),
    });
  });
  entries.sort(byPriority);
  const dir = path.join(repo, 'speck', 'ideas');
  const ideas = (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort() : []).map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    return { path: `speck/ideas/${f}`, title: (text.match(/^# (.+)$/m) || [])[1]?.trim() || f, status: ideaStatus(text) || null, body: text };
  });
  // The command that reopens a build's session, for the panel. A config without the setting gets the default (0289:
  // Codex's, for Codex builds).
  return { tickets: entries, ideas, idea_counts: ideaCounts(repo), resume_command: resumeCommandOf(cfg) };
}

function cmdStatus(args = []) {
  const repo = findRepoRoot();
  if (args.includes('--json')) return console.log(JSON.stringify(statusData(repo), null, 2));
  const cfg = loadConfig(repo), runs = runsOf(repo);
  const tickets = statusTickets(repo, cfg);
  if (!tickets.length) return console.log('No tickets yet. Capture an idea, then run /speck-ticket.');
  // 0285: the Foreman, as the panel's header shows it, from speck run's own record. Blocked tickets are listed below.
  const board = foremanBoard(tickets, cfg, runs), foremanOn = new Map(board.map(b => [b.id, b])); // 0317
  for (const line of foremanLines(foremanView({ run: runState(runs), record: readForeman(runs), tickets: board, fixing: fixingOf(cfg), agent: agentView(runs, board) }))) console.log(line);
  const order = ['approved', 'blocked', 'reviewing', 'building', 'ready', 'draft', 'done', 'cancelled'];
  for (const s of order) {
    const group = tickets.filter(t => t.fm.status === s).map(t => ({ t, id: t.fm.id, type: ticketType(t), priority: ticketPriority(t) })).sort(byPriority);
    if (!group.length) continue;
    console.log(`\n${s.toUpperCase()} (${group.length})${s === 'approved' ? ': waiting for you. Read `speck pack <id>`, then run /speck-ship <id>' : ''}`);
    for (const { t, priority } of group) {
      console.log(`  ${t.fm.id}${TYPES.includes(t.fm.type) ? ` ${t.fm.type}` : ''}  P${priority === null ? '-' : typeof priority === 'object' ? JSON.stringify(priority) : priority}  ${t.fm.size}/${t.fm.risk}  ${t.fm.title}`);
      if (t.at) console.log(`        ↳ being built in ${t.at}`);
      const killed = inHand(t) ? buildKilled(runs, t.fm.id) : null;
      if (killed) console.log(`        ! Build stopped unexpectedly. ${resumeHint(cfg, killed)}`);
      for (const line of foremanTicketLines(foremanOn.get(t.fm.id), contentLines(t.sections['blocked question']).join(' '))) console.log(line); // 0317
      if (s === 'cancelled' && !blank(t.fm.cancel_reason)) console.log(`        ❌ ${t.fm.cancel_reason}`);
    }
  }
  const { waiting, inbox, ticketed } = ideaCounts(repo);
  console.log(`\nIDEAS (${waiting + inbox + ticketed}: ${waiting} waiting, ${inbox} in the inbox, ${ticketed} ticketed) in speck/ideas/`);
}

const HELP = `speck: Ship code you can't read, and still trust it.

  speck init                          set up speck in this repo, or update it (re-run any time)
  speck doctor                        check that Node.js, git, the builder and the reviewer are ready
  speck detect                        print what setup needs to know about this folder and machine, as JSON
  speck agents [--json]               Claude Code, Codex and Cursor: whether each is installed and signed in, and its models
  speck new <title> [--source=path]   create the next numbered draft ticket
  speck lint <id>                     check a ticket against the size rules
  speck set <id> <field> <value>      update a ticket field (status ready runs lint first and commits the ticket; priority "" clears it)
  speck config set <key> <value>      change one setting, checked first: your own (builder, reviewer, auto_ship...) for this machine only, the rest in speck/config.yml
  speck config set --repo <key> <value>     change speck/config.yml's value instead; --machine <key> "" removes this machine's own value
  speck config show [--json]          the main settings by group, with each one's value, whether it's the default and
                                      what it does, as the panel's Settings view explains them
  speck start <id>                    start building a ready ticket, in its own worktree if worktrees are on
  speck cancel <id> "<reason>"         cancel a ticket, and record why
  speck status [--json]               tickets by status, blocked first (--json: everything, for programs)
  speck panel [--port <n>]           a control panel in your browser, at http://127.0.0.1:4777
                                      --url https://<hostname>: also serves it at that address, behind a private tunnel
  speck run                           start a build for each ready ticket as it becomes ready, and ship approved ones auto_ship covers, until stopped
  speck pause <id>                    hold a build speck run launched where it is, until it's played
  speck play <id>                     carry a paused build on from where it was paused
  speck stop <id>                     end a build speck run launched for good, and block its ticket
  speck diffstat                      changed lines against the size limit
  speck test [--fresh]                run the test command, waiting for a turn if max_parallel_tests runs are going,
                                      or reuse the result for the same code (--fresh: always run it)
  speck test --recorded               print the result recorded for the same code, without running any tests
  speck test --files <file>…          run only those test files with commands.test_files (blank: the whole suite)
                                      and the files commands.checks lists
  speck review <id> [--tests=f] [--response=f]   run one review round; exits 12 if it's still running after 9 minutes
  speck review <id> --wait            wait up to 9 more minutes for the round that is running
  speck record <id> <verdict.json> [--reviewer=x] record a round from another reviewer
  speck prompt <id> [--tests=f] [--response=f]  print the reviewer prompt (for subagent reviewers)
  speck reviewer-settings <id>        print and save the model and effort to start a reviewer with
  speck review-running <id> [--ended] show the next round as running in the panel until speck record
                                      (for subagent reviewers; --ended: the round was given up on)
  speck diff <id>                     the changes since the reviewer's last round, as the reviewer sees them
  speck close <id>                    write the review and delivery logs, set approved and commit, once the reviewer approves
  speck next <id>                     what the builder should do next: review, fix, block or ship
  speck pack <id> [--plain]           print the review pack (--plain: a short one in plain English, for someone who
                                      doesn't read code)
  speck picture <id> <file> "<caption>"  keep a picture of a visual change with the ticket's review pack
                                      (--clear instead of a file and caption: remove its pictures)
  speck output <id>                   print a document task's folder in the main checkout's outputs/, making it if missing
  speck merge-check <id>              what merging the base branch into the ticket's branch would conflict on, as JSON
  speck changes <id> "<note>"         send changes you want back to an approved ticket's build: speck run resumes
                                      it to make them, and it's reviewed and approved again before it ships
  speck ship <id> [--auto]            merge an approved ticket into the base branch (the user's gate; --auto
                                      ships only if auto_ship in speck/config.yml allows it for this ticket)
  speck pr <id>                       push an approved ticket's branch and open its pull request with gh (ship_mode: pr)
  speck foreman <action> <id> ...     what the Foreman agent speck run starts may do: resume, reship, fix or ask
                                      (only that agent may run it)
  speck foreman answer <id> "<text>"  answer the Foreman's question about a ticket (speck foreman dismiss <id>:
                                      dismiss it)
`;

const COMMANDS = { init: cmdInit, doctor: cmdDoctor, detect: cmdDetect, agents: cmdAgents, new: cmdNew, lint: cmdLint, set: cmdSet, config: args => args[0] === 'show' ? cmdConfigShow(args.slice(1)) : cmdConfig(args), start: cmdStart, cancel: cmdCancel, status: cmdStatus, panel: cmdPanel, run: cmdRun, pause: cmdPause, play: cmdPlay, stop: cmdStop, diffstat: cmdDiffstat, test: cmdTest,
  review: cmdReview, record: cmdRecord, prompt: cmdPrompt, 'reviewer-settings': cmdReviewerSettings, 'review-running': cmdReviewRunning, diff: cmdDiff, close: cmdClose, next: cmdNext, pack: cmdPack, picture: cmdPicture, output: cmdOutput, 'merge-check': cmdMergeCheck, changes: cmdChanges, ship: cmdShip, pr: cmdPr, foreman: cmdForeman };

// Runs one command line, as `node speck.mjs <args>` does: a SpeckError it ends with is thrown.
function dispatch([cmd, ...args]) {
  if (!cmd || cmd === 'help' || cmd === '--help') console.log(HELP);
  else if (COMMANDS[cmd]) { try { COMMANDS[cmd](args); } finally { noteThisBuild(cmd, args); } }
  else throw new SpeckError(`Unknown command "${cmd}".\n\n${HELP}`);
}

// Runs one speck command, `args` as given after `speck` on the command line, in this process: see runInProcess.
export { runInProcess };
export const runCommand = (args, opts) => runInProcess(() => dispatch(args), opts);

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    dispatch(process.argv.slice(2));
  } catch (e) {
    if (e instanceof SpeckError) { if (e.message) console.error(e.message); process.exit(e.code); }
    throw e;
  }
}
