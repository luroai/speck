import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0036: a build's ticket-worthy follow-ups go to the inbox ----------
// These criteria are skill instructions, so the tests check the skill text says each rule.

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const build = () => read('skills/speck-build/SKILL.md');
// Section 5 step 1 of /speck-build: from "1. If minor findings" up to step 2.
const step1 = () => {
  const s = build();
  const start = s.indexOf('## 5. Approved');
  const body = s.slice(start, s.indexOf('## 6. Block'));
  const from = body.search(/^1\. /m);
  const to = body.search(/^2\. Run `speck close/m);
  assert.ok(start >= 0 && from >= 0 && to > from, 'section 5 has steps 1 and 2');
  return body.slice(from, to);
};

test('0036 AC1: step 1 writes each ticket-worthy follow-up as its own dated note in speck/ideas/', () => {
  const s = step1();
  assert.match(s, /`## Delivery log`/, 'follow-ups still go to the Delivery log');
  assert.match(s, /`speck\/ideas\/<YYYY-MM-DD>-<slug>\.md`/, 'names the note path');
  assert.match(s, /own note/, 'one note per follow-up');
  for (const kind of ['behaviour change', 'bug', 'missing check']) assert.ok(s.includes(kind), `qualifies: ${kind}`);
  assert.match(s, /[Tt]idy-ups/, 'tidy-ups are named');
  assert.match(s, /unused code/, 'with the unused-code example');
  assert.match(s, /known limits/, 'notes on known limits stay out');
  assert.match(s, /only in the Delivery log/, 'tidy-ups and limits go only in the Delivery log');
  assert.match(s, /[Ii]f none qualify,? (write|it writes) no note/, 'no note when none qualify');
});

test('0036 AC2: the note follows the /speck-capture format with Status: inbox and a From ticket line, in order', () => {
  const s = step1();
  const block = (s.match(/```markdown\n([\s\S]*?)```/) || [])[1];
  assert.ok(block, 'step 1 shows the note shape');
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  const at = re => lines.findIndex(l => re.test(l));
  const order = [/^# </, /^Captured: <date> · Status: inbox$/, /^From ticket: <id>$/, /^## What$/, /^## Why$/, /^## Notes$/].map(at);
  order.forEach((i, n) => assert.ok(i >= 0, `line ${n} present`));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'heading, status, From ticket, What, Why, Notes in order');
  assert.equal(order[1], order[0] + 1, 'the status line comes straight after the heading');
  assert.equal(order[2], order[1] + 1, 'From ticket is its own line straight after the status line');
  assert.match(s, /`\/speck-capture`/, 'points at the capture format');
});

test('0036 AC3: duplicates are skipped without asking, and listed with their match in the Delivery log', () => {
  const s = step1();
  for (const where of ['idea note', '`speck/ideas/done/`', '`speck/tickets/`', '`speck/tickets/done/`']) assert.ok(s.includes(where), `checks ${where}`);
  assert.match(s, /[Ss]kip/, 'skips duplicates');
  assert.match(s, /[Dd]on't (stop to )?ask/, 'without asking the user');
  assert.match(s, /skipped follow-up and (its|the) match/, 'lists each skipped follow-up with its match');
});

test('0036 AC4: the notes are committed by name on the ticket branch before speck close, and the report counts them', () => {
  const s = step1();
  assert.match(s, /before `speck close`/, 'committed before close');
  assert.match(s, /by name/, 'staged by name');
  assert.match(s, /ticket branch/, 'on the ticket branch');
  const sec5 = build().slice(build().indexOf('## 5. Approved'), build().indexOf('## 6. Block'));
  const shipped = sec5.split('\n').find(l => /exit code 0/.test(l));
  const not12 = sec5.split('\n').find(l => /exits with 12/.test(l));
  for (const [name, line] of [['shipped', shipped], ['exit 12', not12]]) {
    assert.match(line, /how many follow-ups went to the inbox/, `${name} report counts inbox notes`);
    assert.match(line, /or that none did/, `${name} report says when none did`);
  }
});

test('0036 AC5: /speck-review points unfixed minor findings at the same step', () => {
  const review = read('skills/speck-review/SKILL.md');
  const rule = review.split('\n').find(l => /Minor findings don't block/.test(l));
  assert.ok(rule, 'the minor-findings rule is there');
  assert.match(rule, /section 5 step 1/, 'points at /speck-build section 5 step 1');
  assert.match(rule, /`\/speck-build`/, 'names the build skill');
});

test('0036: the installed skill copies match the source skills', () => {
  for (const name of ['speck-build', 'speck-review']) {
    const src = read(`skills/${name}/SKILL.md`);
    for (const dir of ['.claude/skills', '.agents/skills']) assert.equal(read(`${dir}/${name}/SKILL.md`), src, `${dir}/${name}`);
  }
});
