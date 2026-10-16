import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, skillText } from './support/speck.mjs';
import { syncAgentsSection } from '../scripts/install.mjs';

// ---------- 0252: set a ticket ready only when the user's latest message says to ----------

const step9 = () => {
  const md = skillText('speck-ticket');
  const start = md.indexOf('\n9. ');
  assert.ok(start >= 0, '/speck-ticket has a step 9');
  return md.slice(start + 1).split('\n## ')[0].trim();
};

// The one rule, as the AGENTS.md section and /speck-setup state it.
const RULE = /only when the user's latest message tells you to set that ticket ready/;

test("0252 AC1: step 9 sets a ticket ready only when the user's latest message says so, and lists what doesn't count", () => {
  const s = step9();
  assert.match(s, /only when the user's latest message explicitly tells you to set that ticket ready/);
  assert.match(s, /"set 0251 ready"/, 'it gives an example');
  assert.match(s, /speck set <id> status ready/);
  for (const not of [/choosing an option/, /approving or changing wording/, /answering a question/,
    /agreeing to a proposal that bundles setting it ready with other steps/, /earlier in the conversation/]) {
    assert.match(s, not);
  }
  assert.doesNotMatch(s, /If the user explicitly approves, run/, 'the vague wording is gone');
});

test('0252 AC2: step 9 never bundles setting ready into a proposal, and asks on its own after other changes', () => {
  const s = step9();
  assert.match(s, /Never offer to set a ticket ready as part of a proposal with other steps/);
  assert.match(s, /"Shall I set <id> ready\?"/);
  assert.match(s, /as a question on its own, after any other change is done/);
});

test('0252 AC3: the AGENTS.md section speck init writes states the rule in one sentence', () => {
  const { text } = syncAgentsSection('');
  const sentences = text.split(/(?<=\.)\s+/).filter(s => RULE.test(s));
  assert.equal(sentences.length, 1, 'one sentence states it');
  assert.match(sentences[0], /Nothing else counts|nothing else counts/);
  const own = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');
  assert.match(own, RULE, "this repo's own AGENTS.md has it too");
});

test('0252 AC3: /speck-setup states the rule where the user approves the first ticket', () => {
  const md = skillText('speck-setup');
  const line = md.split('\n').find(l => l.includes('**New project:** read the first ticket'));
  assert.ok(line, '/speck-setup has the first-ticket step');
  assert.match(line, RULE);
});

test("0252 AC4: /speck-build's fix-ticket step still sets a fix ticket ready without asking", () => {
  const md = skillText('speck-build');
  assert.ok(md.includes("3. In the main checkout, run `speck set <fix-id> status ready` without asking the user, so it builds next, ahead of everything else. Set only a `draft` one, and only if it has no branch yet (`git branch --list '<branch_prefix><fix-id>-*'` prints nothing): one that's ready, building, reviewing, approved or blocked is already on its way, and setting it ready would undo that. If `speck set` refuses (its lint names what's missing), fill that in and try again; if it still refuses, leave it `draft` and say so in step 4."));
  assert.doesNotMatch(md, RULE, '/speck-build does not take on the rule');
});
