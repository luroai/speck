import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, skillText, buildSkill } from './support/speck.mjs';

const overlapCheck = md => (md.split('## Check for overlap first')[1] || '').split('\n## ')[0];

test('0010 AC1: /speck-capture checks ideas and every ticket (in full) before writing a note', () => {
  const md = skillText('speck-capture');
  const check = overlapCheck(md);
  assert.ok(check, 'capture skill has a "Check for overlap first" section');
  assert.ok(md.indexOf('## Check for overlap first') < md.indexOf('speck/ideas/<YYYY-MM-DD>'), 'the check comes before the note is written');
  assert.match(check, /every note in `speck\/ideas\/`/);
  assert.match(check, /every ticket in `speck\/tickets\/` and `speck\/tickets\/done\/`/);
  assert.match(check, /problem, outcome and acceptance criteria, not only/i);
  assert.match(check, /`speck\/ideas\/done\/`/);
  assert.match(check, /same, or largely the same, outcome/i, 'overlap is a judgement, not a text match');
});

test('0010 AC2: /speck-ticket runs the same check before speck new', () => {
  const md = skillText('speck-ticket');
  const ref = md.search(/overlap check/i);
  assert.ok(ref >= 0, 'ticket skill refers to the overlap check');
  assert.match(md, /`speck-capture` skill/);
  assert.ok(ref < md.indexOf('speck new "<title>"'), 'the check comes before speck new');
  assert.doesNotMatch(md, /`speck status` to avoid duplicating/, 'the title-only check is replaced');
});

test('0010 AC3: on overlap the agent names each match and waits for an answer before writing', () => {
  const check = overlapCheck(skillText('speck-capture'));
  assert.match(check, /idea[^\n]*path[^\n]*`Status:`/i, 'ideas: path and status');
  assert.match(check, /ticket[^\n]*id[^\n]*status[^\n]*cancel_reason|ticket[^\n]*id[^\n]*status[^\n]*reason/i, 'tickets: id, status and cancel reason');
  assert.match(check, /add to the existing item, go ahead anyway or stop/);
  assert.match(check, /write nothing until the user answers/i);
});

test('0010 AC4: with no overlap the skill carries on and says so in one line', () => {
  const check = overlapCheck(skillText('speck-capture'));
  assert.match(check, /no overlap/i);
  assert.match(check, /one line/i);
  assert.match(check, /carry on|continue/i);
  assert.match(skillText('speck-capture'), /Reply with the file path, the overlap check's one-line result/, 'capture reports it in its reply');
  assert.match(skillText('speck-ticket'), /If nothing overlaps, say so in one line and carry on/);
  assert.match(skillText('speck-ticket'), /Present the tickets\*\* to the user: the overlap check's one-line result/, 'ticket reports it when presenting');
});

// ---------- 0003: the claude-subagent reviewer end to end ----------
// The live run with a real Claude subagent is described in ticket 0003's Notes. These tests replay that
// loop through the CLI, with each reply saved the way the subagent actually sent it: inside a ```json fence.

const selfCheck = () => {
  const md = buildSkill();
  const step = md.split('\n').findIndex(l => /^\d+\. \*\*Self-check/.test(l));
  if (step < 0) return { md, text: '', at: -1 };
  const lines = md.split('\n').slice(step);
  const end = lines.findIndex((l, i) => i > 0 && (/^\d+\. /.test(l) || /^## /.test(l)));
  return { md, text: lines.slice(0, end).join('\n'), at: md.indexOf(lines[0]) };
};

test('0023 AC1: the build skill has a self-check step after implementation and before review, covering the agreed areas', () => {
  const { md, text, at } = selfCheck();
  assert.ok(at > md.indexOf('## 3. Implement'), 'in the implement section');
  assert.ok(at < md.indexOf('the first review round sets the ticket to `reviewing`'), 'before the ticket goes to reviewing (0022: the first round sets it)');
  assert.ok(at < md.indexOf('## 4. Review loop'), 'before the review loop');
  assert.ok(at > md.indexOf('**Size guard:**'), 'after the size guard');
  // Each area is its own checklist item, named in bold, with the substance the ticket asks for.
  const item = label => (text.split('\n').find(l => l.includes(`**${label}:**`)) || '');
  assert.match(item('Unusual input'), /empty/i);
  assert.match(item('Unusual input'), /missing/i);
  assert.match(item('Unusual input'), /malformed/i);
  assert.match(item('Unusual input'), /built in/i);
  assert.match(item('State over time'), /between review rounds, runs or re-runs/i);
  assert.match(item('Error paths'), /plain error message/i);
  assert.match(item('Claims'), /docs or skills/);
  assert.match(item('Claims'), /matches the code, and a test covers it/i);
  assert.match(item('Scope'), /outside the ticket/i);
});

test('0023 AC2: each problem found gets a test and a fix, and the ticket Notes record the result', () => {
  const { text } = selfCheck();
  assert.match(text, /add a test/i);
  assert.match(text, /fix/i);
  assert.match(text, /re-run the tests/i);
  assert.match(text, /`Self-check: [^`]+`/);
  assert.match(text, /`Self-check: no changes`/);
  assert.match(text, /Notes/);
});

test('0023 AC3: the step says it is not a review or an approval, and the reviewer still decides', () => {
  const { text } = selfCheck();
  assert.match(text, /not a review or an approval/i);
  assert.match(text, /reviewer still decides/i);
});

// ---------- 0026: pre-check every ticket before it goes ready ----------

const ticketSkill = () => fs.readFileSync(path.join(ROOT, 'skills', 'speck-ticket', 'SKILL.md'), 'utf8');
const preCheck = () => {
  const md = ticketSkill();
  const lines = md.split('\n');
  const start = lines.findIndex(l => /^\d+\. \*\*Pre-check/.test(l));
  if (start < 0) return { md, text: '', at: -1 };
  const end = lines.findIndex((l, i) => i > start && (/^\d+\. /.test(l) || /^## /.test(l)));
  return { md, text: lines.slice(start, end).join('\n'), at: md.indexOf(lines[start]) };
};

test('0026 AC1: before presenting, each criterion is checked for more than one reading, and rewritten or asked about', () => {
  const { md, text, at } = preCheck();
  assert.ok(at > 0, 'the ticket skill has a Pre-check step');
  assert.ok(at > md.indexOf('speck lint <id>'), 'after the lint');
  assert.ok(at < md.indexOf('**Present the tickets**'), 'before the tickets are presented');
  assert.match(text, /each acceptance criterion/i);
  assert.match(text, /builder and (a )?reviewer could read it differently/i);
  assert.match(text, /rewrite it/i);
  assert.match(text, /ask the user/i);
});

test('0026 AC2: external facts are listed, checked where possible, and recorded in Notes as checked with a date or unverified', () => {
  const { text } = preCheck();
  for (const kind of ['tool and command names', 'flags', 'file formats', 'URLs', 'versions']) assert.ok(text.includes(kind), kind);
  assert.match(text, /current documentation/i);
  assert.match(text, /installed tool/i);
  assert.match(text, /`Checked <YYYY-MM-DD>: [^`]+`/);
  assert.match(text, /`Unverified: [^`]+`/);
  assert.match(text, /Notes/);
});

test('0026 AC3: the build pre-flight re-checks unverified facts and stops if one is wrong', () => {
  const md = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const pre = md.split('## 1. Pre-flight')[1].split('\n## ')[0];
  const line = pre.split('\n').find(l => /Unverified:/.test(l)) || '';
  assert.match(line, /check/i);
  assert.match(line, /If one turns out to be wrong, stop and tell the user/i, 'stops for any wrong fact, with no extra conditions');
  assert.ok(pre.indexOf(line) < pre.indexOf('Create the branch'), 'before any branch is created');
  // Round 1 F1: checking must not edit the ticket before the clean-tree check; checked facts are recorded on the branch.
  assert.doesNotMatch(line, /record it as/i, 'the check itself changes nothing');
  const record = pre.indexOf('`Checked <YYYY-MM-DD>: …`');
  assert.ok(record > pre.indexOf('Create the branch'), 'checked facts are recorded after the branch exists');
  // Since 0028, speck start makes the start commit, so checked facts get their own commit on the branch straight after.
  assert.match(pre.slice(record).split('\n')[0], /commit it/i, 'and committed on the branch');
});

// ---------- 0027: ship a ticket whose branch is in another worktree ----------

// An approved ticket whose branch is checked out in its own worktree, with main checked out in the main folder.
