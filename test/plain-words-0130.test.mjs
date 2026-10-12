import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/panel.mjs';

// ---------- 0130: the builder writes each change up in plain words before it's approved ----------

const CLI = path.join(ROOT, '.speck', 'scripts', 'speck.mjs');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Section 5 of /speck-build, up to the next `## ` heading, and the part of it before `speck close` is run.
const section5 = () => read('skills/speck-build/SKILL.md').split(/^## 5\./m)[1].split(/^## /m)[0];
const beforeClose = () => section5().split(/^2\. Run `speck close <id>`/m)[0];
// The body of a `## <name>` section of a ticket, up to the next `## ` heading.
const sectionOf = (text, name) => {
  const m = text.match(new RegExp(`^## ${name}[ \\t]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return m && m[1];
};

// A fresh repo with one ticket made by `speck new`, whose sections after the header are replaced by `body`.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0130-')));
  const env = { ...process.env, HOME: dir, USERPROFILE: dir, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const run = args => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run(['init', '--skip-checks']).status, 0);
  const made = run(['new', 'Export a CSV']);
  assert.equal(made.status, 0, made.stderr);
  const file = path.join(dir, made.stdout.trim());
  return { dir, file, run };
}
const body = `## Problem\nUsers cannot export.\n\n## Outcome\nUsers can export CSV.\n\n## Acceptance criteria\n1. Export button downloads a CSV.\n\n## Out of scope\n- PDF export\n\n## Notes\n`;
const plainWordsMentions = out => out.split('\n').filter(l => /plain words/i.test(l));

test('0130 AC1: the ticket template has an `## In plain words` section holding only a comment', () => {
  const s = sectionOf(read('templates/ticket.md'), 'In plain words');
  assert.ok(s !== null, 'the template has an `## In plain words` section');
  const comment = s.trim();
  assert.match(comment, /^<!--[\s\S]*-->$/, 'it holds only a comment');
  assert.match(comment, /builder/i);
  assert.match(comment, /before (it'?s )?approv/i);
});

test('0130 AC1: `speck new` makes tickets with the empty `## In plain words` section', () => {
  const r = repo();
  const s = sectionOf(fs.readFileSync(r.file, 'utf8'), 'In plain words');
  assert.ok(s !== null, 'the new ticket has an `## In plain words` section');
  assert.match(s.trim(), /^<!--[\s\S]*-->$/);
});

test('0130 AC2: /speck-build has the builder fill in `## In plain words` before `speck close`', () => {
  const s = beforeClose();
  assert.match(s, /`## In plain words`/);
  assert.match(s, /before[^.]*`speck close`/i);
  const fill = s.split('\n').find(l => /`## In plain words`/.test(l));
  assert.match(fill, /what's different for someone using the product/i);
  assert.match(fill, /how to see the change for (yourself|themselves)/i);
  assert.match(fill, /keep(ing)? an eye on/i);
});

test('0130 AC2: the commit before `speck close` includes the `## In plain words` section', () => {
  const commit = beforeClose().split('\n').find(l => /^\s*Commit the notes and the ticket/.test(l));
  assert.ok(commit, 'section 5 step 1 still commits before `speck close`');
  assert.match(commit, /In plain words/);
});

test('0130 AC3: /speck-build says to write it for someone who does not read code, without code details', () => {
  const fill = beforeClose().split('\n').find(l => /`## In plain words`/.test(l));
  assert.match(fill, /someone who doesn't read code/i);
  for (const thing of [/file paths/i, /\bcode\b/i, /function names/i, /test names/i]) assert.match(fill, thing);
  assert.match(fill, /no file paths, code, function names or test names/i);
});

test('0130 AC4: speck lint passes, without a warning, on a ticket whose `## In plain words` is empty', () => {
  const r = repo();
  const head = fs.readFileSync(r.file, 'utf8').split('## Problem')[0];
  fs.writeFileSync(r.file, head + body + '\n## In plain words\n<!-- Filled in by the builder before approval. -->\n');
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(plainWordsMentions(out.stdout + out.stderr), []);
  assert.doesNotMatch(out.stdout, /^! /m, out.stdout);
});

test('0130 AC4: speck lint passes, without a warning, on a ticket with no `## In plain words` section', () => {
  const r = repo();
  const head = fs.readFileSync(r.file, 'utf8').split('## Problem')[0];
  fs.writeFileSync(r.file, head + body);
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(plainWordsMentions(out.stdout + out.stderr), []);
  assert.doesNotMatch(out.stdout, /^! /m, out.stdout);
});

test('0130 AC4: speck lint passes on a fresh draft from `speck new`, with no word about `## In plain words`', () => {
  const r = repo();
  const out = r.run(['lint', '1']);
  assert.deepEqual(plainWordsMentions(out.stdout + out.stderr), []);
});
