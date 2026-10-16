import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- 0256: start each README section with a plain sentence ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// The README's `##` sections, ignoring lines inside code blocks.
function sections(text) {
  const out = [];
  let fenced = false, cur = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const m = !fenced && line.match(/^## (.+)$/);
    if (m) out.push(cur = { title: m[1], lines: [] });
    else if (cur) cur.lines.push(line);
  }
  return out;
}

// The section's first block of text: the lines up to the first blank line.
const firstBlock = s => {
  const lines = s.lines.slice(s.lines.findIndex(l => l.trim()));
  const end = lines.findIndex(l => !l.trim());
  return lines.slice(0, end === -1 ? undefined : end).join(' ');
};
const firstSentence = block => block.match(/^.*?[.!?](?=\s|$)/)?.[0] || '';

test('0256 AC1: every ## section opens with a paragraph, not a list, table, code block, subheading, image or quote', () => {
  const all = sections(read('README.md'));
  assert.ok(all.length >= 15, 'found the README sections');
  for (const s of all) {
    const block = firstBlock(s);
    assert.ok(block, `${s.title} has text`);
    assert.doesNotMatch(block, /^(\s*[-*|>#<]|```|\s*\d+\.\s)/, `${s.title} opens with a paragraph, not "${block.slice(0, 40)}"`);
  }
});

test('0256 AC1: every ## section\'s first sentence is a whole, short sentence', () => {
  for (const s of sections(read('README.md'))) {
    const sentence = firstSentence(firstBlock(s));
    assert.ok(sentence, `${s.title} opens with a sentence ending in a full stop: "${firstBlock(s).slice(0, 60)}"`);
    assert.match(sentence, /^[A-Za-z`[]/, `${s.title}'s first sentence starts with a word`);
    const words = sentence.split(/\s+/).length;
    assert.ok(words >= 5 && words <= 30, `${s.title}'s first sentence has 5 to 30 words, not ${words}: "${sentence}"`);
  }
});

test('0256 AC1: no section opens with a slogan, a fragment or a lead-in to a list', () => {
  const openers = sections(read('README.md')).map(s => firstSentence(firstBlock(s)));
  for (const old of ['If you can write a good ticket', 'Things you won\'t have to do', 'Most AI coding tools', 'MIT.', 'In your agent', '[`docs/brief.md`](docs/brief.md) has', '`node .speck/scripts/speck.mjs panel`', 'Every approved ticket has'])
    assert.ok(!openers.some(o => o.startsWith(old)), `no section opens with "${old}"`);
});

test('0256 AC2: the ticket\'s Notes record both no-ai-slop detect passes', () => {
  const dirs = ['speck/tickets', 'speck/tickets/done'];
  const file = dirs.flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.startsWith('0256-')).map(f => `${d}/${f}`))[0];
  assert.ok(file, 'found the ticket');
  const notes = read(file).match(/^## Notes\n([\s\S]*?)(?=^## )/m)?.[1] || '';
  assert.match(notes, /^- No-ai-slop detect, first pass:/m);
  assert.match(notes, /^  - L\d+ /m, 'each pattern found is listed with its line');
  assert.match(notes, /^- No-ai-slop detect, second pass: no pattern left unaddressed/m);
});

test('0256 AC3: the facts the changed sections gave are still there', () => {
  const r = read('README.md');
  for (const fact of [
    'If you can write a good ticket, you can ship.',
    'Every approved ticket has a **review pack** written for someone who doesn\'t read code:',
    '[`docs/brief.md`](docs/brief.md) has the full design.',
    'Most AI coding tools sell speed or autonomy',
    '`node .speck/scripts/speck.mjs panel` opens a control panel in your browser, at `http://127.0.0.1:4777`',
    'In your agent:',
    'In your terminal, as `node .speck/scripts/speck.mjs <command>`',
    'run this in the folder of the project you want to build:',
    'MIT',
    'See [LICENSE](LICENSE).',
  ]) assert.ok(r.toLowerCase().includes(fact.toLowerCase()), `the README still says "${fact}"`);
});
