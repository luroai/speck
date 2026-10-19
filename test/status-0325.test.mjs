import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startRepo } from './support/speck.mjs';
import { panelModel } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';

// A repo whose speck/ideas/ holds notes of every status, as `name: status` (null: no Status: line).
function ideasRepo(notes, done = {}) {
  const r = startRepo({ config: { worktrees: 'false' } });
  const write = (where, entries) => {
    fs.mkdirSync(where, { recursive: true });
    for (const [name, status] of Object.entries(entries)) {
      const line = status === null ? '' : `Captured: 2026-10-19 · Status: ${status}\n`;
      fs.writeFileSync(path.join(where, `${name}.md`), `# ${name}\n\n${line}\n## What\nSomething.\n`);
    }
  };
  write(path.join(r.dir, 'speck', 'ideas'), notes);
  write(path.join(r.dir, 'speck', 'ideas', 'done'), done);
  return r;
}
const ideasLine = r => r.run('status').stdout.split('\n').find(l => l.startsWith('IDEAS'));
const counts = r => JSON.parse(r.run('status', '--json').stdout).idea_counts;

const mixed = () => ideasRepo(
  { a: 'idea', b: 'idea', c: 'inbox', d: 'inbox', e: 'inbox', f: 'dropped', g: 'dropped', h: 'ticketed (0009)', constructor: 'idea' },
  { x: 'ticketed (0002)', y: 'ticketed (0003)', z: 'dropped' },
);

test('0325 AC1: the IDEAS line counts waiting, inbox and ticketed notes apart, and leaves dropped ones out', () => {
  assert.equal(ideasLine(mixed()), 'IDEAS (9: 3 waiting, 3 in the inbox, 3 ticketed) in speck/ideas/');
  assert.equal(ideasLine(ideasRepo({ a: 'dropped' }, { b: 'dropped' })), 'IDEAS (0: 0 waiting, 0 in the inbox, 0 ticketed) in speck/ideas/');
});

test('0325 AC2: speck status --json gives the same counts', () => {
  assert.deepEqual(counts(mixed()), { waiting: 3, inbox: 3, ticketed: 3 });
  const r = startRepo({ config: { worktrees: 'false' } });
  fs.rmSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true, force: true });
  assert.deepEqual(counts(r), { waiting: 0, inbox: 0, ticketed: 0 }, 'no ideas folder');
});

test('0325 AC3: a note with no Status: line counts as waiting', () => {
  const r = ideasRepo({ a: null, b: 'inbox' });
  assert.equal(ideasLine(r), 'IDEAS (2: 1 waiting, 1 in the inbox, 0 ticketed) in speck/ideas/');
  assert.deepEqual(counts(r), { waiting: 1, inbox: 1, ticketed: 0 });
});

test("0325 AC4: the counts match the panel's Ideas and Inbox tabs", () => {
  const r = ideasRepo({ a: 'idea', b: null, c: 'inbox', d: 'dropped', e: 'ticketed (0004)', f: 'parked', g: '' }, { x: 'ticketed (0002)' });
  const data = statusData(r.dir), m = panelModel()(data);
  assert.equal(data.idea_counts.waiting, m.ideas.length);
  assert.equal(data.idea_counts.inbox, m.inbox.length);
  assert.deepEqual(data.idea_counts, { waiting: 4, inbox: 1, ticketed: 2 });
});
