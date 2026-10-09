import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';
import { ROOT, T, fm, good, page, fakePage, items, queueRows, shippedRows, panelRepo } from './support/panel.mjs';

// ---------- 0049: bug tickets ----------

const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
const lint = o => lintTicket(parseTicket(`---\n${fm(o)}\n---\n${good}`), cfg).errors;
const css = () => page().match(/<style>([\s\S]*?)<\/style>/)[1];
const rule = sel => (css().match(new RegExp(`(^|\\n)\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[2] || '';
const colour = name => (css().match(new RegExp(`--${name}:\\s*([^;]+);`)) || [])[1]?.trim();

test('0049 AC1: lint accepts a missing, blank or bug type and names the field for any other value', () => {
  assert.deepEqual(lint(), [], 'missing');
  assert.deepEqual(lint({ type: '""' }), [], 'blank');
  assert.deepEqual(lint({ type: '"  "' }), [], 'only spaces');
  assert.deepEqual(lint({ type: '' }), [], 'bare type:');
  assert.deepEqual(lint({ type: '# blank or bug' }), [], 'bare type: with a comment');
  assert.deepEqual(lint({ type: 'bug' }), [], 'bug');
  assert.deepEqual(lint({ type: 'bug   # a comment' }), [], 'bug with a comment');
  for (const v of ['feature', 'Bug', 'chore', 'constructor', '[bug]', '3', '{}', '[]']) {
    const errors = lint({ type: v });
    assert.equal(errors.length, 1, `type: ${v} gives one error`);
    assert.match(errors[0], /\btype\b/, 'the error names the field');
  }
});

test('0049 AC1: the ticket template has a blank type field with a comment listing the values', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'ticket.md'), 'utf8');
  const line = tpl.split('\n').find(l => /^type:/.test(l));
  assert.ok(line, 'the template has a type field');
  assert.match(line, /^type:\s*""\s+#.*\bbug\b/, 'blank, with a comment naming bug');
  assert.equal(parseTicket(tpl).fm.type, '');
});

test('0049 AC2: speck new --type=bug creates a bug ticket, and any other type is refused, creating nothing', () => {
  const r = panelRepo();
  const made = r.run('new', 'Fix lost work', '--type=bug');
  assert.equal(made.status, 0, made.stderr);
  const text = fs.readFileSync(path.join(r.dir, made.stdout.trim()), 'utf8');
  assert.equal(parseTicket(text).fm.type, 'bug');
  assert.match(made.stdout.trim(), /0002-fix-lost-work\.md$/, 'the flag is not part of the title');
  const plain = r.run('new', 'A feature');
  assert.equal(parseTicket(fs.readFileSync(path.join(r.dir, plain.stdout.trim()), 'utf8')).fm.type, '', 'no flag: blank type');
  const before = fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).sort();
  for (const bad of [['--type=feature'], ['--type='], ['--type=BUG'], ['--type', 'bug'], ['--type=bug', '--type=chore']]) {
    const refused = r.run('new', 'Another', ...bad);
    assert.notEqual(refused.status, 0, `${bad} is refused`);
    assert.match(refused.stderr, /type/, 'a plain message about the type');
    assert.doesNotMatch(refused.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.deepEqual(fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).sort(), before, 'nothing created');
});

test('0049 AC3: speck status shows bug after a bug ticket\'s id, and --json has type for every ticket', () => {
  const r = panelRepo();
  r.write('0002-bug.md', fm({ id: '"0002"', title: 'Fix lost work', type: 'bug' }));
  r.write('0003-blank.md', fm({ id: '"0003"', title: 'Blank type', type: '""' }));
  r.write('0004-bare.md', fm({ id: '"0004"', title: 'Bare type', type: '' }));
  r.write('0005-comment.md', fm({ id: '"0005"', title: 'Bare type with a comment', type: '# blank or bug' }));
  const out = r.run('status').stdout;
  assert.match(out, /^\s+0002 bug\s+P/m, 'bug after the id');
  assert.doesNotMatch(out, /^\s+0001 bug/m);
  assert.doesNotMatch(out, /^\s+0003 bug/m);
  const json = JSON.parse(r.run('status', '--json').stdout);
  const type = id => json.tickets.find(t => t.id === id).type;
  assert.equal(type('0002'), 'bug');
  assert.equal(type('0003'), null, 'blank is null');
  assert.equal(type('0001'), null, 'missing is null');
  assert.equal(type('0004'), null, 'bare type: is null');
  assert.equal(type('0005'), null, 'bare type: with a comment is null');
  for (const id of ['0004', '0005']) assert.equal(json.tickets.find(t => t.id === id).lint.errors, 0, `${id} passes lint`);
  assert.ok(json.tickets.every(t => Object.hasOwn(t, 'type')));
});

test('0049 AC4: a bug ticket shows a bug tag beside its id in Shaping, the queue and Shipped; others show none', async () => {
  const p = fakePage([{ tickets: [
    T('0001', 'draft', { type: 'bug' }), T('0002', 'draft', { type: null }),
    T('0003', 'ready', { type: 'bug' }), T('0004', 'ready'),
    T('0005', 'done', { type: 'bug', finished: new Date().toISOString() }), T('0006', 'done', { type: null, finished: new Date().toISOString() }),
  ], ideas: [] }]);
  await p.settle();
  const idOf = row => p.all(row).find(n => n.className === 'id')._text;
  const bugTag = row => {
    const ids = p.all(row).filter(n => n.className === 'id');
    const parent = p.all(row).find(n => (n.children || []).includes(ids[0]));
    const next = parent.children[parent.children.indexOf(ids[0]) + 1];
    return next && /\bbug\b/.test(next.className || '') ? next : null;
  };
  const anyBug = row => p.all(row).some(n => /\bbug\b/.test(n.className || ''));
  for (const [where, rows] of [['Shaping', items(p)], ['queue', queueRows(p)], ['Shipped', shippedRows(p)]]) {
    const bug = rows.find(r => ['0001', '0003', '0005'].includes(idOf(r)));
    const other = rows.find(r => ['0002', '0004', '0006'].includes(idOf(r)));
    assert.ok(bug && other, `${where} lists both`);
    const tag = bugTag(bug);
    assert.ok(tag, `${where}: a bug tag right after the id`);
    assert.equal(tag._text, 'bug');
    assert.ok(!anyBug(other), `${where}: no tag on a ticket that isn't a bug`);
  }
});

test('0049 AC4: the bug tag has a colour of its own', () => {
  const r = rule('.tag.bug');
  assert.match(r, /color:\s*var\(--bug\)/, 'the tag uses --bug');
  const bug = colour('bug');
  assert.ok(bug, '--bug is defined');
  for (const other of ['accent', 'idea', 'bad', 'warn']) assert.notEqual(bug.toLowerCase(), colour(other).toLowerCase(), `not the same as --${other}`);
});

test('0049 AC5: /speck-ticket says to create a ticket that fixes a defect with --type=bug', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ticket', 'SKILL.md'), 'utf8');
  assert.match(skill, /defect[^\n]*--type=bug|--type=bug[^\n]*defect/);
});
