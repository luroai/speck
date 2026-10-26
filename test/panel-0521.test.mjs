import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, fakePage, notes, top, click, panelModel } from './support/panel.mjs';

// ---------- 0521: ideas an agent raised carry an agent tag in Capture ----------

const note = (name, status, captured, extra = '') => ({ path: `speck/ideas/${name}.md`, title: name, status,
  body: `# ${name}\n\nCaptured: ${captured} · Status: ${status}\n${extra}\n## What\nThe whole text of ${name}.\n` });
const board = () => ({ tickets: [], ideas: [
  note('user-new', 'idea', '2026-10-26', 'Raised by: you\n'),
  note('agent-new', 'inbox', '2026-10-25', 'Raised by: agent\nFrom ticket: 0005\n'),
  note('agent-idea', 'idea', '2026-10-24', 'Raised by: agent\n'),
  note('user-followup', 'inbox', '2026-10-23', 'Raised by: you\nFrom ticket: 0006\n'),
  note('old-followup', 'inbox', '2026-10-22', 'From ticket: 0007\n'),
  note('old-idea', 'idea', '2026-10-21'),
] });
const opened = async (b = board()) => { const p = fakePage([b]); await p.settle(); return p; };
const title = (p, n) => p.all(n).find(x => /\btitle\b/.test(x.className)).textContent;
const agentTag = (p, n) => p.all(n).find(x => /\btag\b/.test(x.className || '') && /\bagent\b/.test(x.className || ''));
const skill = name => fs.readFileSync(path.join(ROOT, 'skills', name, 'SKILL.md'), 'utf8');

// ---------- AC1 ----------

test('0521 AC1: /speck-capture writes a Raised by line after Captured, you for the user\'s own ask and agent otherwise', () => {
  const s = skill('speck-capture');
  assert.match(s, /Captured: <date> · Status: idea\n\s*Raised by: you\n/, 'the template has it on its own line after Captured');
  assert.match(s, /`Raised by: agent`/, 'and names the agent value for an idea an agent raised itself');
});

test('0521 AC1: /speck-build\'s follow-up notes say Raised by: agent after Captured and From ticket', () => {
  assert.match(skill('speck-build'), /Captured: <date> · Status: inbox\n\s*From ticket: <id>\n\s*Raised by: agent\n/);
});

// ---------- AC2 ----------

test('0521 AC2: in Capture, a note an agent raised has an agent tag on its closed card, and the user\'s notes have none', async () => {
  const p = await opened();
  const tagged = notes(p).filter(n => agentTag(p, n)).map(n => title(p, n));
  assert.deepEqual(tagged, ['agent-new', 'agent-idea', 'old-followup']);
  for (const n of notes(p)) assert.doesNotMatch(n.className, /\bopen\b/, 'on the closed card');
  const tag = agentTag(p, notes(p)[1]);
  assert.equal(tag._text ?? tag.textContent, 'agent');
});

test('0521 AC2: the agent tag explains itself on a tap, as a ticket\'s task tag does', async () => {
  const p = await opened();
  const tag = agentTag(p, notes(p)[1]);
  p.pointer('touch');
  p.press(tag);
  assert.match(p.byId('tag-tip').textContent, /^Agent: /, 'its tip');
  assert.match(p.byId('tag-tip').textContent, /agent raised/i, 'saying an agent raised it');
  assert.equal(tag.attrs['aria-label'], p.byId('tag-tip').textContent, 'announced with its meaning');
  assert.doesNotMatch(notes(p)[1].className, /\bopen\b/, 'the tap is for the tag, not the card');
});

test('0521 AC2: the agent tag uses a ticket tag\'s style', () => {
  const css = fs.readFileSync(path.join(ROOT, 'templates', 'panel-base.css'), 'utf8');
  assert.match(css, /\.tag\.agent \{[^}]*border-color:/, 'a boxed tag with its own colour, like .tag.task');
});

// ---------- AC3 ----------

test('0521 AC3: with no Raised by line, a From ticket line means an agent raised it, and none means the user did', () => {
  const m = panelModel()(board());
  assert.deepEqual(Object.fromEntries(m.capture.map(i => [i.title, i.agent])),
    { 'user-new': false, 'agent-new': true, 'agent-idea': true, 'user-followup': false, 'old-followup': true, 'old-idea': false });
});

test('0521 AC3: an unknown Raised by value, or one only in the body, falls back to the From ticket line', () => {
  const m = panelModel()({ tickets: [], ideas: [
    note('odd', 'idea', '2026-10-01', 'Raised by: somebody\n'),
    note('odd-followup', 'inbox', '2026-10-01', 'Raised by: somebody\nFrom ticket: 0001\n'),
    note('in-text', 'idea', '2026-10-01', 'It was Raised by: agent in a sentence.\n'),
    { path: 'speck/ideas/no-body.md', title: 'no-body', status: 'idea' },
  ] });
  assert.deepEqual(Object.fromEntries(m.capture.map(i => [i.title, i.agent])), { odd: false, 'odd-followup': true, 'in-text': false, 'no-body': false });
});

// ---------- AC4 ----------

test('0521 AC4: the tag changes nothing else: newest first, cards open and close, and no control or write', async () => {
  const p = await opened();
  assert.deepEqual(notes(p).map(n => title(p, n)), ['user-new', 'agent-new', 'agent-idea', 'user-followup', 'old-followup', 'old-idea']);
  const sent = p.calls.length;
  click(top(notes(p)[1]));
  assert.match(notes(p)[1].className, /\bopen\b/, 'a tagged card still opens');
  click(top(notes(p)[1]));
  await p.settle();
  const tags = p.all(p.byId('capture-section')).map(n => n.tagName);
  for (const t of ['button', 'input', 'select', 'textarea', 'a', 'form']) assert.ok(!tags.includes(t), `no ${t} in Capture`);
  assert.ok(p.calls.slice(sent).every(c => !c.opts || !c.opts.method || c.opts.method === 'GET'), 'nothing written');
});
