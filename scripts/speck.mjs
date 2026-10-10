#!/usr/bin/env node
// speck: small tickets, independent review, you merge.
// Deterministic helpers used by the speck skills. No dependencies.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, STATUSES, TYPES, SpeckError, sh, git, findRepoRoot, loadConfig, contentLines, setField, blank, ticketType, ticketPriority, byPriority, reviewerSettings, syncHeader, ticketsDir, ideasDir, doneIdeasDir, repoPath, listTickets, findTicket, placeTicket, nextId, slugify, lintTicket, changedLines, ticketRounds, posix, STATUS_LINE, ideaStatus, writeField, worktreeList, padId } from './core.mjs';
import { cmdReview, cmdRecord, cmdNext, cmdReviewerSettings, cmdPrompt, cmdDiff } from './review.mjs';
import { cmdPack } from './pack.mjs';
import { cmdClose, commitTicketOnly } from './close.mjs';
import { SKILL_DIRS, cmdDoctor, cmdInit } from './install.mjs';
import { cmdShip } from './ship.mjs';
import { cmdMergeCheck } from './merge-check.mjs';
import { cmdDetect } from './detect.mjs';
import { cmdConfig } from './config.mjs';
import { cmdTest } from './turns.mjs';
import { cmdPanel, panelServer } from './panel.mjs';
import { cmdRun, cmdPause, cmdPlay, cmdStop, DEFAULT_RESUME_COMMAND, pidAlive, processRows, buildKilled, resumeHint } from './run.mjs';

// Every name speck.mjs exported before it was split into modules (0018, 0078) can still be imported from it.
export { panelServer };
export { TEMPLATES, SpeckError, sh, findRepoRoot, parseYaml, loadConfig, parseTicket, setField, reviewerSettings, ticketHeader, syncHeader, findTicket, nextId, lintTicket, changedLines, ticketRounds, writeField, worktreeList, padId } from './core.mjs';
export { stripRounds, validateVerdict, nextAction } from './review.mjs';
export { splitCommand, commandArgs, verdictFromOutput } from './reviewers.mjs';
export { reviewPack } from './pack.mjs';
export { replaceSection, pathsOutside, commitTicketOnly } from './close.mjs';
export { installTooling, doctorChecks } from './install.mjs';
export { shipTicket } from './ship.mjs';

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
  if (t.fm.status === 'done') throw new SpeckError(`Ticket ${t.fm.id} is done, so it can't be cancelled: delivered work is part of the record.`);
  if (t.fm.status === 'cancelled') throw new SpeckError(`Ticket ${t.fm.id} is already cancelled.`);
  // Stored as a JSON string, so text like `false`, `0` or `a "quoted" word` reads back exactly as typed. A reason kept from an earlier cancel is replaced in place.
  let text = setField(t.raw, 'cancel_reason', JSON.stringify(reason));
  text = setField(text, 'cancelled', new Date().toISOString().slice(0, 10));
  fs.writeFileSync(t.file, syncHeader(setField(text, 'status', 'cancelled')));
  placeTicket(repo, t, 'cancelled');
  console.log(`${t.fm.id} cancelled → ${path.relative(repo, t.file)}`);
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

// Where a ticket's worktree goes: beside the main checkout, never inside it, and at the same path each time.
function worktreePath(main, branch) {
  return path.join(path.dirname(main), `${path.basename(main)}.worktrees`, ...branch.split('/'));
}

// Starts building a ready ticket: makes its branch from the local base branch, in its own worktree when worktrees
// are on, sets it to building and commits that there. Anything that goes wrong before the start commit is undone.
function cmdStart(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck start <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const t = findTicket(repo, id);
  const pad = t.fm.id;
  // An existing build comes first, so resuming from anywhere (even inside its worktree) gets the path to carry on in.
  const list = worktreeList(repo);
  const existing = git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
  if (existing.length) {
    const at = list.find(w => existing.includes(w.branch));
    throw new SpeckError(at
      ? `Ticket ${pad} has already started: ${at.branch} is checked out at\n${at.path}\nCarry on the build there.`
      : `Ticket ${pad} already has a branch, ${existing.join(', ')}. Check it out to carry on the build, or delete it to start again.`);
  }
  if (t.fm.status !== 'ready') throw new SpeckError(`Ticket ${pad} is "${t.fm.status}", not "ready". Only a ready ticket can be started.`);
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

// Tickets being built in other worktrees, read from that worktree's copy, which has the real status.
function ticketsElsewhere(repo, cfg) {
  const here = fs.realpathSync(repo);
  const ticketBranch = new RegExp(`^${cfg.branch_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d{4})-`);
  return worktreeList(repo).flatMap(w => {
    const m = w.branch && w.branch.match(ticketBranch);
    if (!m || w.path === here || !fs.existsSync(w.path)) return [];
    try { return [{ ...findTicket(w.path, m[1]), at: w.path }]; } catch { return []; }
  });
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

// A build log as people read it. With `--output-format stream-json`, Claude Code writes one JSON event per line as it
// works: these become the agent's text and one line per tool call ("→ Bash: run the tests"), and the rest (tool output,
// session and rate-limit events) are left out. Any other line, such as plain `claude -p` output or an error, is kept as is.
// With `times`, each agent message, tool call and failed tool result starts with its event's local time (`HH:MM:SS `),
// when the event has an ISO 8601 timestamp that reads as a date.
const LOG_DETAIL = 200;
export function readableLog(text, { times = false } = {}) {
  const out = [];
  let last = null; // the agent's latest text, so the result that repeats it isn't shown twice
  const short = s => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > LOG_DETAIL ? `${s.slice(0, LOG_DETAIL - 1)}…` : s; };
  const two = n => String(n).padStart(2, '0');
  const clock = t => {
    const d = times && typeof t === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(t) ? new Date(t) : null;
    return d && !Number.isNaN(d.getTime()) ? `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())} ` : '';
  };
  for (const line of String(text ?? '').split('\n')) {
    let e = null;
    if (line.startsWith('{')) { try { e = JSON.parse(line); } catch { /* not an event */ } }
    if (!e || typeof e !== 'object' || typeof e.type !== 'string') { out.push(line); continue; }
    const at = clock(e.timestamp);
    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type === 'text' && typeof b.text === 'string' && b.text.trim()) { out.push(at + b.text.trim(), ''); last = b.text.trim(); }
        else if (b?.type === 'tool_use') {
          const i = b.input && typeof b.input === 'object' ? b.input : {};
          const what = i.description || i.command || i.file_path || i.path || i.pattern || i.url || i.query || i.prompt || i.skill || '';
          out.push(`${at}→ ${b.name || 'tool'}${what ? `: ${short(what)}` : ''}`);
        }
      }
    } else if (e.type === 'user' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type !== 'tool_result' || b.is_error !== true) continue;
        const c = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map(x => x?.text || '').join(' ') : '';
        out.push(`${at}  ✗ ${short(c) || 'failed'}`);
      }
    } else if (e.type === 'result') {
      const r = typeof e.result === 'string' ? e.result.trim() : '';
      if (r && r !== last) out.push(r);
      if (e.is_error === true || (e.subtype && e.subtype !== 'success')) out.push(`Build ended: ${e.subtype || 'error'}`);
    }
  }
  return out.join('\n');
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
  try { message = readableLog(fs.readFileSync(path.join(dir, `${id}.log`), 'utf8')).replace(/\s+$/, '').split('\n').slice(-50).join('\n') || null; } catch { /* no log */ }
  return { at: rec.exited ?? null, code: rec.exit_code ?? null, message };
}

// The session a build launched by `speck run` ran in, from its run record: {id, cwd}, where cwd is the folder the build
// started from (where its session is kept), or null when there's no record, it can't be read or it lacks either.
function buildSession(runs, id) {
  id = String(id ?? '');
  if (!/^[\w-]+$/.test(id)) return null;
  let rec;
  try { rec = JSON.parse(fs.readFileSync(path.join(runs, `${id}.json`), 'utf8')); } catch { return null; }
  const text = v => typeof v === 'string' && v !== '';
  return rec && typeof rec === 'object' && text(rec.session) && text(rec.cwd) ? { id: rec.session, cwd: rec.cwd } : null;
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
function runsOf(repo) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'runs');
}

// What `speck status --json` prints: everything status knows, for programs such as the control panel.
// The field names are a contract (0030); don't rename them.
export function statusData(repo) {
  const cfg = loadConfig(repo);
  const tickets = statusTickets(repo, cfg);
  const done = new Set(tickets.filter(t => t.fm.status === 'done').map(t => padId(t.fm.id)));
  const runs = runsOf(repo);
  // Whether a pid leads its own process group, as a build speck run launched does. ps runs once, and only if needed.
  let rows = null;
  const leads = pid => { try { rows ??= processRows(); } catch { rows = []; } return rows.some(([p, , g]) => p === pid && g === pid); };
  const entries = tickets.map(t => {
    const lint = lintTicket(t, cfg);
    const question = contentLines(t.sections['blocked question']).join('\n');
    const after = Array.isArray(t.fm.after) ? t.fm.after : [];
    const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
    return {
      ...t.fm,
      type: ticketType(t),
      priority: ticketPriority(t),
      path: posix(path.relative(t.at || repo, t.file)),
      worktree: t.at || null,
      acceptance_criteria: criteriaText(t.sections['acceptance criteria']),
      blocked_question: question || null,
      lint: { errors: lint.errors.length, warnings: lint.warnings.length },
      problem: sectionText(t.sections.problem),
      outcome: sectionText(t.sections.outcome),
      out_of_scope: sectionText(t.sections['out of scope']),
      notes: sectionText(t.sections.notes),
      self_check: selfCheck(t.sections.notes),
      lint_messages: { errors: lint.errors, warnings: lint.warnings },
      rounds: ticketRounds(t.raw).rounds.map(r => ({
        round: r?.meta?.round ?? null,
        reviewer: r?.meta?.reviewer ?? null,
        verdict: r?.verdict?.verdict ?? null,
        seconds: num(r?.meta?.seconds),
        tokens: (num(r?.meta?.usage?.input_tokens) || 0) + (num(r?.meta?.usage?.output_tokens) || 0),
      })),
      waiting_on: after.filter(id => !done.has(padId(id))),
      build_exit: buildExit(runs, t.fm.id),
      session: buildSession(runs, t.fm.id),
      paused: buildPaused(runs, t.fm.id),
      build_running: buildRunning(runs, t.fm.id, leads),
      build_stopped: inHand(t) && !!buildKilled(runs, t.fm.id),
    };
  });
  entries.sort(byPriority);
  const dir = path.join(repo, 'speck', 'ideas');
  const ideas = (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort() : []).map(f => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    return { path: `speck/ideas/${f}`, title: (text.match(/^# (.+)$/m) || [])[1]?.trim() || f, status: ideaStatus(text) || null, body: text };
  });
  // The command that reopens a build's session, for the panel. A config without the setting gets the default.
  const resume = !Object.hasOwn(cfg, 'resume_command') ? DEFAULT_RESUME_COMMAND : typeof cfg.resume_command === 'string' ? cfg.resume_command.trim() : '';
  return { tickets: entries, ideas, resume_command: resume };
}

function cmdStatus(args = []) {
  const repo = findRepoRoot();
  if (args.includes('--json')) return console.log(JSON.stringify(statusData(repo), null, 2));
  const cfg = loadConfig(repo), runs = runsOf(repo);
  const tickets = statusTickets(repo, cfg);
  if (!tickets.length) return console.log('No tickets yet. Capture an idea, then run /speck-ticket.');
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
      if (s === 'blocked') {
        const q = contentLines(t.sections['blocked question']).join(' ');
        if (q) console.log(`        ? ${q}`);
      }
      if (s === 'cancelled' && !blank(t.fm.cancel_reason)) console.log(`        ❌ ${t.fm.cancel_reason}`);
    }
  }
  // Notes filed in speck/ideas/done/ count as ticketed, whatever their status says.
  const mdIn = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')) : []);
  const notes = mdIn(ideasDir(repo)), filed = mdIn(doneIdeasDir(repo)).length;
  const ticketed = filed + notes.filter(f => ideaStatus(fs.readFileSync(path.join(ideasDir(repo), f), 'utf8')).startsWith('ticketed')).length;
  const total = notes.length + filed;
  console.log(`\nIDEAS (${total}: ${total - ticketed} waiting, ${ticketed} ticketed) in speck/ideas/`);
}

function cmdDiffstat() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const { total, counted } = changedLines(repo, cfg.base_branch);
  for (const r of counted) console.log(`  ${String(r.lines).padStart(5)}  ${r.file}`);
  console.log(`${total} changed lines (limit ${cfg.limits.max_changed_lines}, excluding tests, lockfiles and speck/)`);
  if (total > cfg.limits.max_changed_lines) throw new SpeckError('Over the size limit: stop and propose a split.', 2);
}

const HELP = `speck: small tickets, independent review, you merge.

  speck init                          set up speck in this repo, or update it (re-run any time)
  speck doctor                        check that git, GitHub, Claude Code and Codex are ready
  speck detect                        print what setup needs to know about this folder and machine, as JSON
  speck new <title> [--source=path]   create the next numbered draft ticket
  speck lint <id>                     check a ticket against the size rules
  speck set <id> <field> <value>      update a ticket field (status ready runs lint first and commits the ticket; priority "" clears it)
  speck config set <key> <value>      change one setting in speck/config.yml, checked first (nested: commands.test)
  speck start <id>                    start building a ready ticket, in its own worktree if worktrees are on
  speck cancel <id> "<reason>"         cancel a ticket, and record why
  speck status [--json]               tickets by status, blocked first (--json: everything, for programs)
  speck panel [--port <n>]           a control panel in your browser, at http://127.0.0.1:4777
  speck run                           start a build for each ready ticket as it becomes ready, until stopped
  speck pause <id>                    hold a build speck run launched where it is, until it's played
  speck play <id>                     carry a paused build on from where it was paused
  speck stop <id>                     end a build speck run launched for good, and block its ticket
  speck diffstat                      changed lines against the size limit
  speck test                          run the test command, waiting for a turn if max_parallel_tests runs are going
  speck review <id> [--tests=f] [--response=f]   run one codex review round
  speck record <id> <verdict.json> [--reviewer=x] record a round from another reviewer
  speck prompt <id> [--tests=f]       print the reviewer prompt (for subagent reviewers)
  speck reviewer-settings <id>        print and save the model and effort to start a reviewer with
  speck diff <id>                     the changes since the reviewer's last round, as the reviewer sees them
  speck close <id>                    write the review and delivery logs, set approved and commit, once the reviewer approves
  speck next <id>                     what the builder should do next: review, fix, block or ship
  speck pack <id>                     print the review pack
  speck merge-check <id>              what merging the base branch into the ticket's branch would conflict on, as JSON
  speck ship <id> [--auto]            merge an approved ticket into the base branch (the user's gate; --auto
                                      ships only if auto_ship in speck/config.yml allows it for this ticket)
`;

const COMMANDS = { init: cmdInit, doctor: cmdDoctor, detect: cmdDetect, new: cmdNew, lint: cmdLint, set: cmdSet, config: cmdConfig, start: cmdStart, cancel: cmdCancel, status: cmdStatus, panel: cmdPanel, run: cmdRun, pause: cmdPause, play: cmdPlay, stop: cmdStop, diffstat: cmdDiffstat, test: cmdTest,
  review: cmdReview, record: cmdRecord, prompt: cmdPrompt, 'reviewer-settings': cmdReviewerSettings, diff: cmdDiff, close: cmdClose, next: cmdNext, pack: cmdPack, 'merge-check': cmdMergeCheck, ship: cmdShip };

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (!cmd || cmd === 'help' || cmd === '--help') console.log(HELP);
    else if (COMMANDS[cmd]) COMMANDS[cmd](args);
    else throw new SpeckError(`Unknown command "${cmd}".\n\n${HELP}`);
  } catch (e) {
    if (e instanceof SpeckError) { if (e.message) console.error(e.message); process.exit(e.code); }
    throw e;
  }
}
