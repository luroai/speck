import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0251: open the README with a plain description of what speck does ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PLAIN = 'speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time, so you can set them going, walk away and trust what you come back to.';
const OPENING = 'You own two decisions: what gets built and what gets shipped. Everything in between is automated. speck builds each ticket, has a second AI review it, and stops only when it needs you.';
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
  has(o, [/conversation with your (coding )?agent/, /speck's panel/, /same app/, /Claude Code's desktop app/, /Cursor/, /built-in browser/]);
  has(o, [/set them ready/, /walk away/, /meeting/, /lunch/, /bed/, /builds/, /tests/, /review/, /auto-ship on/, /ships/]);
});

test('0251 AC2: a paragraph of its own says why speck exists', () => {
  const why = paragraphs().filter(p => /built by a product manager/.test(p));
  assert.equal(why.length, 1, 'one paragraph says speck was built by a product manager');
  has(why[0], [/for product managers/, /non-technical/, /engineering teams/, /code they can't read/, /trust/, /tagline/,
    /without reading the code/, /criteria agreed up front/, /independent check of every change/, /plain English/]);
  assert.doesNotMatch(why[0], /\b(I|my|me)\b/, 'it is in the third person');
});

test('0251 AC3: the opening says why you can trust the result, claiming only what speck does today', () => {
  const o = opening();
  has(o, [/same steps/, /whatever the task/, /tests are written first/, /acceptance criteria/, /self-check/, /second AI/,
    /independent/, /whole test suite/, /Nothing ships unless you ship it/, /auto-ship to cover its risk/, /`main`/, /GitHub/, /remote/]);
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
