import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0251: open the README with a plain description of what speck does ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
// 0262: the README revision (commit 1041577) cut the plain line to end at "every time.", shortened the opening and
// reworded it. The checks below follow its wording; each change is noted where it's made.
const PLAIN = 'speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time.';
const OPENING = 'You make two decisions: what gets built and what gets shipped. When your tickets look right, set them ready, start the builds from the panel and walk away.';
// The README's opening: everything after the plain line under the tagline and before the image.
const opening = () => {
  const r = read('README.md');
  const from = r.indexOf(PLAIN);
  const to = r.indexOf('<picture>');
  assert.ok(from > 0 && to > from, 'the plain line comes before the image');
  return r.slice(from + PLAIN.length, to);
};
const paragraphs = () => opening().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
const has = (text, words) => { for (const w of words) assert.match(text, w, `the opening says ${w}`); };

test('0251 AC1: the opening says who speck is for, where you work and that you can walk away', () => {
  const o = opening();
  has(o, [/don't write code/, /product managers/, /founders/, /programme managers/, /designers/, /engineers/]);
  has(o, [/conversation with your (coding )?agent/, /speck's panel/, /one app/, /Claude Code's desktop app/, /Cursor/, /built-in browser/]);
  has(o, [/set them ready/, /walk away/, /meeting/, /lunch/, /bed/, /builds/, /tests/, /review/, /ship low-risk tickets on its own/, /ships/]);
  // 0262: "same app" became "one app", and "auto-ship on" became shipping low-risk tickets on its own.
});

test('0251 AC2: a paragraph of its own says why speck exists', () => {
  const why = paragraphs().filter(p => /built by a product manager/.test(p));
  assert.equal(why.length, 1, 'one paragraph says speck was built by a product manager');
  // 0262: the revision says who it's for in its own words and moved how you can trust the result to the trust
  // paragraph, which 0251 AC3 checks. It dropped the mention of the tagline.
  has(why[0], [/for people who work in and around engineering teams/, /don't write code/, /product managers/, /code they can't read/]);
  assert.doesNotMatch(why[0], /\b(I|my|me)\b/, 'it is in the third person');
});

test('0251 AC3: the opening says why you can trust the result, claiming only what speck does today', () => {
  const o = opening();
  // 0262: the revision dropped "whatever the task" and what shipping does with `main` and a remote, renamed the
  // self-check and auto-ship in plain words, and brought in the review pack.
  has(o, [/without reading the code/, /same steps/, /tests are written first/, /acceptance criteria you agreed up front/,
    /checks its own work/, /second AI/, /independent/, /whole test suite/, /Nothing ships until you ship it/,
    /ship low-risk tickets on its own/, /review pack in plain English/, /evidence for every criterion/]);
  assert.doesNotMatch(o, /release/i, 'it promises no GitHub releases');
});

test('0251 AC4: the ticket records both no-ai-slop detect passes', () => {
  const dir = ['speck/tickets', 'speck/tickets/done'].find(d => fs.readdirSync(path.join(ROOT, d)).some(f => f.startsWith('0251-')));
  const ticket = read(`${dir}/${fs.readdirSync(path.join(ROOT, dir)).find(f => f.startsWith('0251-'))}`);
  const notes = ticket.match(/^## Notes\n([\s\S]*?)^## /m)?.[1] || '';
  assert.match(notes, /No-ai-slop detect, first pass/);
  assert.match(notes, /No-ai-slop detect, second pass: no pattern left unaddressed/);
});

test('0251 AC5: the paragraph about your two decisions stays in the opening, before the image', () => {
  assert.ok(opening().includes(OPENING));
});
