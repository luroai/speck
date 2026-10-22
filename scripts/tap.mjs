// The test output a reviewer is given: a short summary when it's TAP, as `node --test` writes it, otherwise the output in full.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError } from './core.mjs';

const HEADER = /^TAP version \d+\s*$/;
const SUBTEST = /^(\s*)# Subtest: (.*)$/;
const RESULT = /^(\s*)(not ok|ok)\b(?: \d+)?(?: - (.*?))?(?: # (SKIP|TODO)\b.*)?\s*$/i;
const TOTAL = /^# [a-z_]+ \d[\d.]*\s*$/;

// Every test result in the output, with where it starts (its `# Subtest:` line) and ends (its YAML block's `...`).
function results(lines, from) {
  const open = [];
  const found = [];
  for (let i = from; i < lines.length; i++) {
    const sub = SUBTEST.exec(lines[i]);
    if (sub) { open.push({ indent: sub[1].length, name: sub[2], start: i }); continue; }
    const r = RESULT.exec(lines[i]);
    if (!r) continue;
    const indent = r[1].length;
    while (open.length && open.at(-1).indent > indent) open.pop();
    const mine = open.at(-1)?.indent === indent ? open.pop() : null;
    const name = r[3] ?? mine?.name ?? '';
    let end = i;
    if (lines[i + 1] === `${r[1]}  ---`) {
      end = lines.indexOf(`${r[1]}  ...`, i + 2);
      if (end < 0) end = lines.length - 1;
    }
    found.push({ name, path: [...open.map(o => o.name), name].join(' > '), indent, ok: r[2].toLowerCase() === 'ok', directive: (r[4] || '').toUpperCase(), start: mine ? mine.start : i, at: i, end });
    i = end;
  }
  return found;
}

// A test's own lines: its result, its YAML block and anything else it printed, without its subtests' lines.
function details(lines, t, all) {
  const inner = all.filter(o => o !== t && o.start >= t.start && o.end <= t.end);
  const own = [];
  for (let i = t.start; i <= t.end; i++) {
    if (i === t.start && SUBTEST.test(lines[i])) continue;
    if (i === t.at || inner.some(o => i >= o.start && i <= o.end) || /^\s*1\.\.\d+\s*$/.test(lines[i])) continue;
    own.push(lines[i].slice(Math.min(t.indent, lines[i].length - lines[i].trimStart().length)));
  }
  return [`not ok - ${t.path}`, ...own].join('\n');
}

const outcome = t => t.directive === 'SKIP' ? 'skipped' : t.directive === 'TODO' ? 'todo' : t.ok ? 'passed' : 'failed';

// What `speck test` prints before running a full run's failing tests' files once more, and at the start of the line it
// ends with when they all passed then, naming them (0195).
export const RETRY_NOTE = 'Some tests failed: running their files once more, to tell a chance failure from a real one: ';
export const FLAKY = 'Flaky: ';

// Where a test's `location:` says it is, in its YAML block, or null when it has none.
function location(lines, t) {
  for (let i = t.at + 1; i <= t.end; i++) {
    const m = /^\s*location: (?:'((?:[^']|'')*)'|"((?:[^"\\]|\\.)*)"|(\S.*?))\s*$/.exec(lines[i]);
    if (m) return m[1] !== undefined ? m[1].replaceAll("''", "'") : m[2] !== undefined ? m[2].replace(/\\(.)/g, '$1') : m[3];
  }
  return null;
}

// The file a test's `location:` names, in its YAML block, or null when it has none.
const locationFile = (lines, t) => /^(.+):\d+:\d+$/.exec(location(lines, t) ?? '')?.[1] ?? null;

// Failing tests without those whose failure is only that one of their subtests failed.
const leaves = failing => failing.filter(t => !failing.some(o => o !== t && o.start >= t.start && o.end <= t.end && o.indent > t.indent));

// TAP output read for a summary, or null when it isn't TAP. Only the full run's lines are read when its failing tests'
// files were run once more. When the run passed on that second try (0195), its failing tests are counted as passed on a
// second try instead (secondTry: their paths). When it didn't, each failing test is listed once, with the second try's
// details when it failed there too, and any test that failed only there after them (0221): a test that failed in both
// is told apart from another of the same name by its location. failing: each failing test
// with its details.
function readTap(text) {
  let lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return null;
  const note = lines.findIndex((l, i) => i > header && l.startsWith(RETRY_NOTE));
  const after = note > 0 ? lines.slice(note + 1) : [];
  const retried = after.some(l => l.startsWith(FLAKY));
  if (note > 0) lines = lines.slice(0, note);
  const all = results(lines, header + 1);
  const failed = all.filter(t => !t.ok && t.directive !== 'TODO');
  const failing = retried ? [] : failed.map(t => ({ ...t, where: location(lines, t), details: details(lines, t, all) }));
  const again = after.findIndex(l => HEADER.test(l));
  if (!retried && again >= 0) {
    const second = results(after, again + 1);
    for (const t of second.filter(o => !o.ok && o.directive !== 'TODO')) {
      // The same test when it has the same path of names and, where both say, the same location: tests can share names.
      const where = location(after, t);
      const first = failing.find(f => f.path === t.path && !f.again && (!f.where || !where || f.where === where));
      const entry = { ...t, again: true, details: details(after, t, second) };
      if (first) Object.assign(first, { details: entry.details, again: true }); else failing.push(entry);
    }
  }
  return { lines, header, all, retried, failing,
    secondTry: retried ? [...new Set(leaves(failed).map(t => t.path).filter(Boolean))] : [] };
}

// The summary of TAP output for the ticket `id`, or null when the output isn't TAP. `file` is where the full output is.
export function summariseTap(text, id, file) {
  const tap = readTap(text);
  if (!tap) return null;
  const { lines, header, all, retried, failing, secondTry } = tap;
  const lastTop = Math.max(header, ...all.filter(t => t.indent === 0).map(t => t.end));
  const totals = lines.slice(lastTop + 1).filter(l => TOTAL.test(l)).map(l => l.trimEnd());
  const named = new RegExp(`(?<!\\d)${String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`);
  const own = all.filter(t => named.test(t.name));
  const said = t => retried && outcome(t) === 'failed' ? 'passed on a second try' : outcome(t);
  return [
    `Test output summarised for the reviewer: the run's totals, every failing test with its details, and every test named with ${id}. The full output is in ${file}.`,
    ...(retried ? ['', 'Result: passed. The tests under "Passed on a second try" failed in the full run, then passed when their files were run once more, so they count as chance failures, not failing tests.'] : []),
    '', retried ? 'Totals (the full run):' : 'Totals:', ...(totals.length ? totals : ['(none given: the run may have stopped early)']),
    '', `Failing tests (${failing.length}):`, ...(failing.length ? failing.map(t => t.details) : ['(none)']),
    ...(retried ? ['', `Passed on a second try (${secondTry.length}):`, ...secondTry] : []),
    '', `Tests named with ${id} (${own.length}):`, ...(own.length ? own.map(t => `${said(t)}: ${t.path}`) : ['(none)']),
  ].join('\n');
}

// What the reviewer's summary of TAP output says about the tests, for the round's record and the review pack:
// { failing, second_try }, how many failing tests it lists and the paths it lists as passed on a second try.
// Null when the output isn't TAP.
export function tapCounts(text) {
  const tap = readTap(text);
  return tap && { failing: tap.failing.length, second_try: tap.secondTry };
}

// The failing tests in TAP output, each as its path of names, leaving out a test whose failure is only that one of its
// subtests failed. Empty when the output isn't TAP or names no failing test. When the output goes on with the line
// saying the failing tests' files ran once more (0195) and that run's TAP, a test that failed in the first run and
// passed in the second is a chance failure and left out (0377): two failing tests of one name need two passes.
export function failingTests(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  const note = lines.findIndex((l, i) => i > header && l.startsWith(RETRY_NOTE));
  const failed = list => leaves(list.filter(t => !t.ok && t.directive !== 'TODO')).map(t => t.path).filter(Boolean);
  if (note < 0) return [...new Set(failed(results(lines, header + 1)))];
  const after = lines.slice(note + 1);
  const second = after.findIndex(l => HEADER.test(l));
  const again = second < 0 ? [] : results(after, second + 1);
  const passed = new Map();
  for (const t of again.filter(o => o.ok && !o.directive)) passed.set(t.path, (passed.get(t.path) || 0) + 1);
  const first = failed(results(lines.slice(0, note), header + 1)).filter(p => {
    const n = passed.get(p) || 0;
    passed.set(p, n - 1);
    return n <= 0;
  });
  return [...new Set([...first, ...failed(again)])];
}

// The test output in the file given with --tests, refused in plain words when it can't be read.
function readTests(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) {
    throw new SpeckError(`Can't read the test output in ${file} (${e.code || e.message}). Check the file given with --tests, then run this again.`);
  }
}

// The test output to put in the reviewer's prompt, from the file given with --tests.
export function testOutput(file, id) {
  if (!file) return '(no test output provided)';
  const text = readTests(file);
  return summariseTap(text, id, path.resolve(file)) ?? text;
}

// What the round's record keeps about the test output given with --tests: { tests: tapCounts } when it's TAP, else {}.
export function testsMeta(file) {
  const counts = file ? tapCounts(readTests(file)) : null;
  return counts ? { tests: counts } : {};
}

// Every failing test in TAP output, leaving out one whose failure is only that one of its subtests failed, each as its
// path of names and the file its `location:` names (null when it has none): [{ name, file }]. Tests with the same name
// are each listed.
export function failingTestFiles(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  const failing = results(lines, header + 1).filter(t => !t.ok && t.directive !== 'TODO');
  return leaves(failing).map(t => ({ name: t.path, file: locationFile(lines, t) }));
}

// Every test in TAP output that passed, not skipped or todo, as its path of names, once for each time it passed.
export function passingTests(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  return results(lines, header + 1).filter(t => t.ok && !t.directive).map(t => t.path).filter(Boolean);
}
