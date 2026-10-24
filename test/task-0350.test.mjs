// 0350: a ticket says its task, code or document, and it shows on the board. 0492: it's now its kind, code or task.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';
import { T, fm, good, fakePage, items, queueRows, shippedRows, panelRepo } from './support/panel.mjs';

const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
const lint = o => lintTicket(parseTicket(`---\n${fm(o)}\n---\n${good}`), cfg).errors;
const taskErrors = o => lint(o).filter(e => /\btask\b/.test(e) && !/\boutput\b/.test(e)); // 0351 checks the output

test('0350 AC1: lint accepts a missing, blank, code or document task', () => {
  for (const o of [{}, { task: '""' }, { task: '' }, { task: 'code' }, { task: 'document' }, { task: 'document   # a doc' }])
    assert.deepEqual(taskErrors(o), [], JSON.stringify(o));
});

test('0350 AC1: lint errors on any other task, naming the allowed ones', () => {
  for (const bad of ['Document', 'post', 'docs', '3', '[code]', '{}', 'constructor', '__proto__']) {
    const errors = taskErrors({ task: bad });
    assert.equal(errors.length, 1, `task ${bad}: one error`);
    assert.match(errors[0], /\bcode\b/, 'names code');
    assert.match(errors[0], /\bdocument\b/, 'names document');
  }
});

// 0492: speck new writes kind: code in place of task: code, and status --json gives a kind in place of a task.
test('0350 AC2: speck new writes kind: code, with a comment listing code | task', () => {
  const r = panelRepo();
  const made = r.run('new', 'Write the guide');
  assert.equal(made.status, 0, made.stderr);
  const text = fs.readFileSync(path.join(r.dir, made.stdout.trim()), 'utf8');
  const head = text.slice(0, text.indexOf('\n---', 4));
  const line = head.split('\n').find(l => /^kind:/.test(l));
  assert.ok(line, 'a kind line in the frontmatter');
  assert.match(line, /^kind:\s*code\s+#.*code \| task/);
  assert.equal(parseTicket(text).fm.kind, 'code');
});

test('0350 AC3: status --json gives each ticket its kind from its task line, code when missing or blank', () => {
  const r = panelRepo();
  const dir = path.join(r.dir, 'speck', 'tickets');
  const write = (name, o) => fs.writeFileSync(path.join(dir, name), `---\n${fm(o)}\n---\n${good}`);
  write('0002-b.md', { id: '"0002"', task: '""' });
  write('0003-c.md', { id: '"0003"', task: 'code' });
  write('0004-d.md', { id: '"0004"', task: 'document' });
  fs.writeFileSync(path.join(dir, '0005-e.md'), `---\n${fm({ id: '"0005"' })}\ntask:\n---\n${good}`); // a bare "task:" line
  const out = r.run('status', '--json');
  assert.equal(out.status, 0, out.stderr);
  const tasks = Object.fromEntries(JSON.parse(out.stdout).tickets.map(t => [t.id, t.kind]));
  assert.deepEqual(tasks, { '0001': 'code', '0002': 'code', '0003': 'code', '0004': 'task', '0005': 'code' });
});

// The tag rows' text in a card, from Plan, Build and Shipped.
const texts = (p, n) => p.all(n).filter(x => /^tag\b/.test(x.className || '')).map(x => x.textContent);
const card = (p, list, id) => list.find(r => p.all(r).some(n => n.className === 'id' && n._text === id));

test('0350 AC4: a task ticket\'s card shows a "task" tag; a code ticket\'s shows none', async () => {
  const ago = min => new Date(Date.now() - min * 60000).toISOString();
  const s = () => ({ ideas: [], tickets: [
    T('0001', 'draft', { kind: 'task' }), T('0002', 'draft', { kind: 'code' }),
    T('0003', 'ready', { kind: 'task' }), T('0004', 'ready', { kind: 'code' }),
    T('0005', 'done', { started: ago(50), finished: ago(20), kind: 'task' }),
    T('0006', 'done', { started: ago(50), finished: ago(20), kind: 'code' }),
  ] });
  const p = fakePage([s(), s(), s()]);
  await p.settle();
  const where = [[items(p), '0001', '0002'], [queueRows(p), '0003', '0004'], [shippedRows(p), '0005', '0006']];
  for (const [list, doc, code] of where) {
    const d = card(p, list, doc), c = card(p, list, code);
    assert.ok(d && c, `cards for ${doc} and ${code}`);
    assert.ok(texts(p, d).includes('task'), `${doc} shows a task tag`);
    const tag = p.all(d).find(x => x.textContent === 'task' && /^tag\b/.test(x.className));
    assert.match(tag.className, /\btask\b/, 'a tag of its own, as the bug tag is');
    assert.ok(!texts(p, c).includes('task') && !texts(p, c).includes('code'), `${code} shows no task tag`);
  }
});
