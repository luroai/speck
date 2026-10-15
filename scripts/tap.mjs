// The test output a reviewer is given: a short summary when it's TAP, as `node --test` writes it, otherwise the output in full.

import fs from 'node:fs';
import path from 'node:path';

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

// The summary of TAP output for the ticket `id`, or null when the output isn't TAP. `file` is where the full output is.
export function summariseTap(text, id, file) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return null;
  const all = results(lines, header + 1);
  const lastTop = Math.max(header, ...all.filter(t => t.indent === 0).map(t => t.end));
  const totals = lines.slice(lastTop + 1).filter(l => TOTAL.test(l)).map(l => l.trimEnd());
  const failing = all.filter(t => !t.ok && t.directive !== 'TODO');
  const named = new RegExp(`(?<!\\d)${String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`);
  const own = all.filter(t => named.test(t.name));
  return [
    `Test output summarised for the reviewer: the run's totals, every failing test with its details, and every test named with ${id}. The full output is in ${file}.`,
    '', 'Totals:', ...(totals.length ? totals : ['(none given: the run may have stopped early)']),
    '', `Failing tests (${failing.length}):`, ...(failing.length ? failing.map(t => details(lines, t, all)) : ['(none)']),
    '', `Tests named with ${id} (${own.length}):`, ...(own.length ? own.map(t => `${outcome(t)}: ${t.path}`) : ['(none)']),
  ].join('\n');
}

// The failing tests in TAP output, each as its path of names, leaving out a test whose failure is only that one of its
// subtests failed. Empty when the output isn't TAP or names no failing test.
export function failingTests(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  const failing = results(lines, header + 1).filter(t => !t.ok && t.directive !== 'TODO');
  const leaves = failing.filter(t => !failing.some(o => o !== t && o.start >= t.start && o.end <= t.end && o.indent > t.indent));
  return [...new Set(leaves.map(t => t.path).filter(Boolean))];
}

// The test output to put in the reviewer's prompt, from the file given with --tests.
export function testOutput(file, id) {
  if (!file) return '(no test output provided)';
  const text = fs.readFileSync(file, 'utf8');
  return summariseTap(text, id, path.resolve(file)) ?? text;
}

// The failing tests in TAP output, as failingTests gives them, each with the file named by its `location:` (null when
// it has none): [{ name, file }]. A test listed twice keeps the first file found for it.
export function failingTestFiles(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  const failing = results(lines, header + 1).filter(t => !t.ok && t.directive !== 'TODO');
  const leaves = failing.filter(t => !failing.some(o => o !== t && o.start >= t.start && o.end <= t.end && o.indent > t.indent));
  const found = new Map();
  for (const t of leaves) {
    if (!t.path) continue;
    let file = null;
    for (let i = t.at + 1; i <= t.end && file === null; i++) {
      const m = /^\s*location: (?:'((?:[^']|'')*)'|"((?:[^"\\]|\\.)*)"|(\S.*?))\s*$/.exec(lines[i]);
      if (!m) continue;
      const where = m[1] !== undefined ? m[1].replaceAll("''", "'") : m[2] !== undefined ? m[2].replace(/\\(.)/g, '$1') : m[3];
      file = /^(.+):\d+:\d+$/.exec(where)?.[1] ?? null;
    }
    if (!found.has(t.path) || (found.get(t.path) === null && file !== null)) found.set(t.path, file);
  }
  return [...found].map(([name, file]) => ({ name, file }));
}

// The tests in TAP output that passed, not skipped or todo, each as its path of names.
export function passingTests(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const header = lines.findIndex(l => HEADER.test(l));
  if (header < 0) return [];
  return [...new Set(results(lines, header + 1).filter(t => t.ok && !t.directive).map(t => t.path).filter(Boolean))];
}
