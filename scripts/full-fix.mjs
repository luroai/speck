// 0658: with watch fix or decide, speck run raises and readies a fix ticket itself when the full suite fails on the base
// branch, as a build does for a broken base branch, so the failure waits on that ticket rather than under Needs you.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sh, setting, listTickets, padId, ticketType } from './core.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));
// The ticket statuses in which a fix ticket is on its way: it's left out of Needs you while it is.
const ON_ITS_WAY = ['ready', 'building', 'reviewing', 'approved'];
const CLOSED = ['done', 'cancelled'];

const readJson = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' ? v : null; } catch { return null; } };
const firstLine = r => String(r.stderr || r.stdout || '').trim().split('\n').filter(Boolean).pop() || `exit code ${r.status}`;
const fixActs = cfg => ['fix', 'decide'].includes(setting(cfg, 'watch'));
const failingWhat = f => (f.tests.length ? f.tests.join(', ') : `the run ended with exit code ${f.status}, and its output names no failing tests`);

// Whether an open fix ticket's text names this failure: one of its failing tests or, when it names none, its commit.
const covers = (t, f) => (f.tests.length ? f.tests.some(n => t.raw.includes(n)) : t.raw.includes(f.commit.slice(0, 7)));

// The body of `## <name>` in `text` replaced, as close.mjs's replaceSection does (importing it here would loop back to
// full-suite.mjs). Throws when the template has no such section.
function replaceSection(text, name, body) {
  const m = text.match(new RegExp(`^## ${name}[ \\t]*$`, 'm'));
  if (!m) throw new Error(`the ticket template has no "## ${name}" section`);
  const from = m.index + m[0].length, next = text.slice(from).search(/^## /m), end = next === -1 ? text.length : from + next;
  return `${text.slice(0, from)}\n${body}\n${end < text.length ? `\n${text.slice(end)}` : ''}`;
}

// The fix ticket's text, from the template speck new wrote: what fails, on which commit, and that it must pass again.
function fixText(raw, base, f) {
  const short = f.commit.slice(0, 7);
  const tests = f.tests.length ? f.tests.map(n => `- ${n}`).join('\n') : `- None named: the full suite ended with exit code ${f.status}, and its output names no failing tests.`;
  let text = replaceSection(raw, 'Problem', `The full suite fails on ${base} at commit ${short} (${f.commit}). Failing tests:\n${tests}`);
  text = replaceSection(text, 'Outcome', `The full suite passes on ${base} again.`);
  text = replaceSection(text, 'Acceptance criteria', [
    `1. ${f.tests.length ? `Each of these tests passes on ${base} again: ${f.tests.join(', ')}.` : `The full suite ends with exit code 0 on ${base} again.`}`,
    '2. No test that passed before this change fails.',
  ].join('\n'));
  text = replaceSection(text, 'Out of scope', '- Changes the failing tests don\'t need.');
  return text;
}

// Makes the fix ticket in the main checkout, on the base branch, and commits only it. Returns its id, or throws an Error
// saying why, leaving no ticket behind.
function makeFix(repo, base, f) {
  const r = spawnSync(process.execPath, [CLI, 'new', `Fix the full suite failing on ${base} at ${f.commit.slice(0, 7)}`, '--type=fix'], { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`speck new refused it: ${firstLine(r)}`);
  const file = path.resolve(repo, r.stdout.trim().split('\n').pop());
  const raw = fs.readFileSync(file, 'utf8');
  const id = (raw.match(/^id:\s*"?(\d+)"?/m) || [])[1];
  const rel = path.relative(repo, file);
  let commit;
  try {
    fs.writeFileSync(file, fixText(raw, base, f));
    commit = sh('git', ['add', '--', rel], { cwd: repo });
    if (commit.status === 0) commit = sh('git', ['commit', '-q', '-m', `speck(${id}): fix ticket`, '--', rel], { cwd: repo }); // only the ticket
  } catch (e) { commit = { status: 1, stderr: e.message }; }
  if (commit.status !== 0) { sh('git', ['reset', '-q', '--', rel], { cwd: repo }); fs.rmSync(file, { force: true }); throw new Error(`it couldn't be committed: ${firstLine(commit)}`); }
  return id;
}

// Sets fix ticket `id` ready with speck set, which runs the ready check and commits it. Throws an Error saying why not.
function setReady(repo, id) {
  const r = spawnSync(process.execPath, [CLI, 'set', id, 'status', 'ready'], { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`speck set refused to set it ready: ${firstLine(r)}`);
}

// Whether the failing run `f` ran on code that has fix ticket `t` done: the fix shipped and the suite still failed.
const ranWithFix = (repo, t, f) => sh('git', ['cat-file', '-e', `${f.commit}:speck/tickets/done/${path.basename(t.file)}`], { cwd: repo }).status === 0;

// speck run's fix tickets for a failing full suite, from the main checkout `repo`. check(cfg, failing), on each of
// fullSuiteQueue's checks, with the latest failing run or null, returns the id of the fix ticket that's fixing it, or
// null while the failure counts under Needs you: with watch tell or off, once the fix ticket is blocked, cancelled or
// left a draft, or once a run on code with the fix shipped still fails. It makes at most one fix ticket a failure,
// kept in `dir`/fix.json until a full run passes, and says in the log what it did, or once why it couldn't.
export function fullFixQueue({ repo, dir, say = console.log }) {
  const file = path.join(dir, 'fix.json'), couldnt = new Set();
  const save = v => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(v)); fs.renameSync(tmp, file); };
  const check = (cfg, failing) => {
    if (!failing) { fs.rmSync(file, { force: true }); couldnt.clear(); return null; }
    if (!fixActs(cfg)) return null;
    const base = String(cfg.base_branch || '').trim(), short = failing.commit.slice(0, 7);
    let tickets;
    try { tickets = listTickets(repo); } catch { return null; }
    const kept = readJson(file), byId = id => tickets.find(t => padId(t.fm.id) === padId(id)) || null;
    const reread = id => { tickets = listTickets(repo); return byId(id); }; // after speck set or speck new changed it
    let t = kept && typeof kept.id === 'string' ? byId(kept.id) : null;
    if (!kept) {
      t = tickets.find(x => ticketType(x) === 'fix' && !CLOSED.includes(x.fm.status) && covers(x, failing)) || null;
      try {
        if (t) {
          // An open fix ticket names it already: one left a draft is set ready, as a build does, unless it's been started.
          const started = sh('git', ['branch', '--list', `${cfg.branch_prefix || ''}${padId(t.fm.id)}-*`], { cwd: repo }).stdout.trim();
          const id = padId(t.fm.id);
          if (t.fm.status === 'draft' && !started) { setReady(repo, id); t = reread(id); say(`The full suite fails on ${base} at ${short}, and fix ticket ${id} covers it, so I set it ready.`); }
        } else {
          const branch = sh('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: repo }).stdout.trim();
          if (branch !== base) throw new Error(`the main checkout is ${branch ? `on "${branch}"` : 'not on a branch'}, not ${base}`);
          const id = makeFix(repo, base, failing);
          try { setReady(repo, id); } catch (e) { say(`I made fix ticket ${id} for the full suite failing on ${base} at ${short}, but couldn't set it ready (${e.message}), so it counts under Needs you.`); save({ id, commit: failing.commit }); return null; }
          t = reread(id);
          say(`The full suite fails on ${base} at ${short} (${failingWhat(failing)}), so I made fix ticket ${id} and set it ready. It builds next.`);
        }
      } catch (e) {
        if (!couldnt.has(failing.commit)) { couldnt.add(failing.commit); say(`I couldn't make a fix ticket for the full suite failing on ${base} at ${short}: ${e.message}. It counts under Needs you.`); }
        return null;
      }
      if (!t) return null;
      save({ id: padId(t.fm.id), commit: failing.commit });
    }
    if (!t) return null;
    if (ON_ITS_WAY.includes(t.fm.status)) return padId(t.fm.id);
    return t.fm.status === 'done' && !ranWithFix(repo, t, failing) ? padId(t.fm.id) : null;
  };
  return { check };
}
