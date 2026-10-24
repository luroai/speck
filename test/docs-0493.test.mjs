import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0493: the skills and docs call a ticket that isn't code a task ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).map(d => `skills/${d}/SKILL.md`)
  .filter(f => fs.existsSync(path.join(ROOT, f)));
const OLD = /document (task|ticket)s?\b|`task: (document|code)`/i;
const oldLines = f => read(f).split('\n').filter(l => OLD.test(l));

// The README isn't read here: only its setup prompt, version, pictures and links are tested (0491), so review checks
// that it doesn't name the old field either.
test('0493 AC1: no skill calls a ticket a document task or names the task: field', () => {
  assert.ok(SKILLS.length > 0, 'found the skills');
  for (const f of SKILLS) assert.deepEqual(oldLines(f), [], f);
});

test('0493 AC1: the brief names the old task: field on one line only, saying it is still read', () => {
  const lines = oldLines('docs/brief.md');
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.ok(lines[0].includes('`task: document`') && lines[0].includes('`kind: task`'), lines[0]);
});

test('0493 AC1: the ticket skill and the brief name kind: code and kind: task, and the build skill kind: task', () => {
  for (const f of ['skills/speck-ticket/SKILL.md', 'docs/brief.md']) {
    for (const name of ['`kind: code`', '`kind: task`']) assert.ok(read(f).includes(name), `${f}: ${name}`);
  }
  assert.ok(read('skills/speck-build/SKILL.md').includes('`kind: task`'));
});
