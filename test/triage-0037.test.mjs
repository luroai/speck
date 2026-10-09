import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0037: triage the inbox from chat ----------
// These criteria are skill instructions, so the tests check the skill text says each rule.

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ticket = () => read('skills/speck-ticket/SKILL.md');
// The "Triage the inbox" section of /speck-ticket, up to the next `## ` heading.
const triage = () => {
  const s = ticket();
  const start = s.indexOf('## Triage the inbox');
  assert.ok(start >= 0, '/speck-ticket has a "Triage the inbox" section');
  const rest = s.slice(start + 3);
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
};
// The numbered step that starts with `n. `, up to the next numbered step.
const step = n => {
  const s = triage();
  const from = s.search(new RegExp(`^${n}\\. `, 'm'));
  assert.ok(from >= 0, `triage has step ${n}`);
  const rest = s.slice(from + 3);
  const to = rest.search(/^\d+\. /m);
  return to < 0 ? rest : rest.slice(0, to);
};

test('0037 AC1: asked to triage, the agent reads every inbox note, or says the inbox is empty in one line and stops', () => {
  const desc = ticket().match(/^description: (.*)$/m)[1];
  assert.match(desc, /triage the inbox/, 'the skill is found when the user asks to triage the inbox');
  const s = step(1);
  assert.match(s, /every note in `speck\/ideas\/`/, 'reads every idea note');
  assert.match(s, /`Status:` (value )?is `inbox`/, 'whose status is inbox');
  assert.match(s, /inbox is empty/, 'says the inbox is empty');
  assert.match(s, /one line/, 'in one line');
  assert.match(s, /stop/, 'and stops');
});

test('0037 AC2: without asking, it drops done, covered and duplicate notes, keeping one of each duplicate set, and names each with its reason', () => {
  const s = step(2);
  assert.match(s, /[Ww]ithout asking/, 'without asking');
  assert.match(s, /already done/, 'drops notes already done');
  for (const where of ['idea note', '`speck/ideas/done/`', 'ticket']) assert.ok(s.includes(where), `drops notes covered by ${where}`);
  assert.match(s, /duplicate each other/, 'handles inbox notes that duplicate each other');
  assert.match(s, /[Kk]eep one/, 'keeps one of them');
  assert.match(s, /`Status:` (value )?to `dropped`/, 'drops by setting the status to dropped');
  assert.match(s, /[Nn]ame each/, 'names each one dropped');
  assert.match(s, /reason/, 'with the reason');
  assert.match(s, /one line/, 'in one line');
});

test('0037 AC3: it puts at most three remaining notes to the user, each with title, source ticket and a one-line reason, asking ticket it or drop it', () => {
  const s = step(3);
  assert.match(s, /at most three/, 'at most three');
  assert.match(s, /title/, 'with its title');
  assert.match(s, /`From ticket:`/, 'with the ticket it came from');
  assert.match(s, /one-line reason/, 'with a one-line reason');
  assert.match(s, /worth doing/, "why it's worth doing");
  assert.match(s, /"[Tt]icket it"/, 'offers ticket it');
  assert.match(s, /"[Dd]rop it"/, 'offers drop it');
});

test('0037 AC4: "ticket it" makes a draft ticket with the note as --source; "drop it" sets dropped; nothing is set to ready', () => {
  const s = step(4);
  assert.match(s, /"[Tt]icket it"/);
  assert.match(s, /[Ss]teps above/, 'uses the /speck-ticket steps');
  assert.match(s, /--source=<the note>|--source=speck\/ideas\//, 'with the note as --source');
  assert.match(s, /`ticketed \(<id>\)`/, 'which sets the note to ticketed (<id>)');
  assert.match(s, /draft/, 'the ticket stays a draft');
  assert.match(s, /"[Dd]rop it"/);
  assert.match(s, /`dropped`/, 'drop it sets dropped');
  assert.match(triage(), /[Nn]ever set (a ticket|anything) to `ready`|[Nn]othing is ever set to `ready`/, 'nothing is set to ready');
});

test('0037 AC5: notes still inbox get Triaged: <n>, those reaching 2 are dropped and listed, and changed notes are committed by name', () => {
  const s = step(5);
  assert.match(s, /still `inbox`/, 'every note still inbox');
  assert.match(s, /`Triaged: <n>`/, 'gets a Triaged line');
  assert.match(s, /add/i, 'added if missing');
  assert.match(s, /rais(e|ed) (it|its number) by one/, 'or raised by one');
  assert.match(s, /`Triaged: 2`/, 'at Triaged: 2');
  assert.match(s, /`dropped`/, 'it is dropped instead');
  assert.match(s, /[Ll]ist/, 'and the agent lists those');
  assert.match(s, /by name/, 'staged by name');
  assert.match(s, /`speck: triage inbox`/, 'committed as speck: triage inbox');
});

test('0037: the installed skill copies match the source skill', () => {
  const src = read('skills/speck-ticket/SKILL.md');
  for (const dir of ['.claude/skills', '.agents/skills']) assert.equal(read(`${dir}/speck-ticket/SKILL.md`), src, `${dir}/speck-ticket`);
});
