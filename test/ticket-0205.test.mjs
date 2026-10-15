import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0205: chain tickets that change the same files while shaping them ----------
// These criteria are skill instructions, so the tests check the skill text says each rule.

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const skill = () => read('skills/speck-ticket/SKILL.md');
// The numbered step of `## Steps` whose bold title starts with `title`, up to the next numbered step or heading.
const stepTitled = (md, title) => {
  const lines = md.split('\n');
  const start = lines.findIndex(l => new RegExp(`^\\d+\\. \\*\\*${title}`).test(l));
  assert.ok(start >= 0, `the ticket skill has a "${title}" step`);
  const end = lines.findIndex((l, i) => i > start && (/^\d+\. /.test(l) || /^## /.test(l)));
  return { text: lines.slice(start, end < 0 ? undefined : end).join('\n'), at: md.indexOf(lines[start]), num: Number(lines[start].match(/^(\d+)\./)[1]) };
};
const chain = () => stepTitled(skill(), 'Chain tickets that change the same files');
const triage = () => skill().split('## Triage the inbox')[1].split('\n## ')[0];

test('0205 AC1: before presenting, the skill lists each new ticket\'s likely files and compares them with every open ticket\'s, from their Notes and the code they name', () => {
  const md = skill();
  const { text, at } = chain();
  assert.ok(at > md.indexOf('**Create each ticket**'), 'after the tickets are made');
  assert.ok(at < md.indexOf('**Present the tickets**'), 'before they are presented');
  assert.match(text, /list the files each new ticket is likely to change/);
  assert.match(text, /every open ticket/);
  for (const s of ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved']) assert.match(text, new RegExp(`\\b${s}\\b`), `open includes ${s}`);
  assert.doesNotMatch(text, /\b(done|cancelled)\b/, 'done and cancelled tickets are not open');
  assert.match(text, /`speck status --json`/, 'statuses come from speck status, which shows tickets being built elsewhere');
  assert.match(text, /Notes and the code they name/);
});

test('0205 AC2: for each overlap it sets the new ticket\'s after: to the other ticket, and never makes a loop', () => {
  const { text } = chain();
  assert.match(text, /each overlap/);
  assert.match(text, /new ticket's `after:`/);
  assert.match(text, /built one after the other/);
  assert.match(text, /[Nn]ever make a loop/);
  assert.match(text, /lead back to the new ticket/, 'says how to spot a loop');
  assert.match(text, /later one waits for the earlier/, 'two new tickets chain one way only');
  assert.match(text, /never edit the other/, 'only the new ticket changes');
});

test('0205 AC3: presenting shows each after: it set and the files that caused it, in one line per ticket', () => {
  const { text } = stepTitled(skill(), 'Present the tickets');
  assert.match(text, /each `after:` (it|you) set/);
  assert.match(text, /files that caused it/);
  assert.match(text, /one line per ticket/);
});

test('0205 AC4: triage that makes tickets follows the same step, and the installed copies match skills/', () => {
  const { num } = chain();
  const t = triage();
  const ticketIt = t.split('\n').find(l => /"Ticket it"/.test(l)) || '';
  assert.match(ticketIt, new RegExp(`step ${num}`), 'triage names the chaining step by number');
  assert.match(ticketIt, /[Cc]hain/);
  for (const name of fs.readdirSync(path.join(ROOT, 'skills'))) {
    const installed = path.join(ROOT, '.claude', 'skills', name, 'SKILL.md');
    if (fs.existsSync(installed)) assert.equal(fs.readFileSync(installed, 'utf8'), read(`skills/${name}/SKILL.md`), `.claude/skills/${name} matches skills/`);
  }
});
