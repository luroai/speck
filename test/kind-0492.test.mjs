// 0492: a ticket is code or a task (`kind: code | task`), the old `task: code | document` line still works, and
// nothing speck shows people calls a ticket that isn't code a document task.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';
import { ticketKind } from '../scripts/core.mjs';
import { autoShipWhyNot } from '../scripts/ship.mjs';
import { outputFolder, documentSection, documentLines, panelDocuments, documentFile } from '../scripts/output.mjs';
import { ROOT, T, fm, good, fakePage, items, queueRows, shippedRows, panelRepo, round, exitOf, nowOf } from './support/panel.mjs';

const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
const ticket = o => parseTicket(`---\n${fm(o)}\n---\n${good}`);
const lint = o => lintTicket(ticket(o), cfg).errors;
const kindErrors = o => lint(o).filter(e => /\b(kind|task|output)\b/.test(e));

test('0492 AC1: lint accepts kind code or task, and refuses any other value, naming the allowed ones', () => {
  for (const o of [{ kind: 'code' }, { kind: 'task', output: 'emails' }, { kind: 'task   # a plan', output: 'plans' }])
    assert.deepEqual(kindErrors(o), [], JSON.stringify(o));
  for (const bad of ['document', 'Task', 'docs', '3', '[code]', '{}', 'constructor', '__proto__']) {
    const errors = kindErrors({ kind: bad });
    assert.equal(errors.length, 1, `kind ${bad}: one error, ${JSON.stringify(errors)}`);
    assert.match(errors[0], /^kind must be code or task\b/, bad);
  }
});

test('0492 AC1: a kind: task ticket needs a valid output, as a task: document ticket does', () => {
  for (const o of [{ kind: 'task' }, { kind: 'task', output: '""' }, { kind: 'task', output: '../x' }, { kind: 'task', output: '/tmp/x' }]) {
    const errors = kindErrors(o);
    assert.equal(errors.length, 1, JSON.stringify(o));
    assert.match(errors[0], /output/, JSON.stringify(o));
  }
  assert.deepEqual(kindErrors({ kind: 'task' }), kindErrors({ task: 'document' }), 'the same error for the old line');
  assert.deepEqual(kindErrors({ kind: 'code' }), [], 'a code ticket needs no output');
});

test('0492 AC1, AC2: speck new writes kind: code with its comment and no task line, and speck set keeps an old task line', () => {
  const r = panelRepo();
  const made = r.run('new', 'Draft the launch email');
  assert.equal(made.status, 0, made.stderr);
  const text = fs.readFileSync(path.join(r.dir, made.stdout.trim()), 'utf8');
  const head = text.slice(0, text.indexOf('\n---', 4)).split('\n');
  const line = head.find(l => /^kind:/.test(l));
  assert.ok(line, 'a kind line in the frontmatter');
  assert.match(line, /^kind:\s*code\s+# code \| task \(what the build does: changes the project's code, or does a task and leaves its result in outputs\/\)$/);
  assert.ok(!head.some(l => /^task:/.test(l)), 'no task line');
  assert.equal(ticketKind(parseTicket(text)), 'code');
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'ticket.md'), 'utf8');
  assert.ok(tpl.split('\n').includes(line), 'templates/ticket.md has the same line');

  // An old ticket keeps its task line through speck set, and status --json gives each ticket its kind.
  const dir = path.join(r.dir, 'speck', 'tickets');
  fs.writeFileSync(path.join(dir, '0005-b.md'), `---\n${fm({ id: '"0005"', task: 'document', output: 'emails' })}\n---\n${good}`);
  fs.writeFileSync(path.join(dir, '0006-c.md'), `---\n${fm({ id: '"0006"', kind: 'task', task: 'code', output: 'plans' })}\n---\n${good}`);
  fs.writeFileSync(path.join(dir, '0007-d.md'), `---\n${fm({ id: '"0007"', kind: 'code', task: 'document' })}\n---\n${good}`);
  const set = r.run('set', '0005', 'priority', '3');
  assert.equal(set.status, 0, set.stderr);
  const after = fs.readFileSync(path.join(dir, '0005-b.md'), 'utf8');
  assert.match(after, /^task: document$/m, 'the old line is kept');
  assert.ok(!/^kind:/m.test(after), 'no kind line added');
  const out = r.run('status', '--json');
  assert.equal(out.status, 0, out.stderr);
  const kinds = Object.fromEntries(JSON.parse(out.stdout).tickets.map(t => [t.id, t.kind]));
  assert.deepEqual(kinds, { '0001': 'code', '0002': 'code', '0005': 'task', '0006': 'task', '0007': 'code' });
  for (const t of JSON.parse(out.stdout).tickets) assert.ok(!('task' in t), `${t.id}: no task field in status --json`);
});

test('0492 AC2: an old task line reads as its kind, and kind wins where a ticket has both', () => {
  const cases = [[{}, 'code'], [{ task: 'code' }, 'code'], [{ task: 'document' }, 'task'], [{ task: '""' }, 'code'],
    [{ kind: 'code' }, 'code'], [{ kind: 'task' }, 'task'], [{ kind: '""', task: 'document' }, 'task'],
    [{ kind: 'code', task: 'document' }, 'code'], [{ kind: 'task', task: 'code' }, 'task']];
  for (const [o, want] of cases) assert.equal(ticketKind(ticket(o)), want, JSON.stringify(o));
  // Lint treats them the same: an old document line needs an output, and kind: code overrides it.
  assert.deepEqual(kindErrors({ task: 'document', output: 'emails' }), []);
  assert.deepEqual(kindErrors({ kind: 'code', task: 'document' }), [], 'kind: code wins, so no output is needed');
  assert.equal(kindErrors({ kind: 'task', task: 'code' }).length, 1, 'kind: task wins, so it needs an output');
  for (const bad of ['post', 'constructor', '__proto__']) {
    const errors = kindErrors({ task: bad });
    assert.equal(errors.length, 1, `task ${bad}`);
    assert.match(errors[0], /\bkind: code\b.*\bkind: task\b/, 'says what to write instead');
    assert.ok(!/document (task|ticket)/i.test(errors[0]), errors[0]);
  }
});

// A repo folder with one ticket in it, for the functions that read a ticket from disk.
function repoWith(fields) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kind-0492-'));
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0001-x.md'), `---\n${fm(fields)}\n---\n${good}`);
  return dir;
}

test('0492 AC3: what speck prints for a task ticket never calls it a document task or its result a document', () => {
  const dir = repoWith({ kind: 'task', output: 'memos' });
  const t = { ...parseTicket(fs.readFileSync(path.join(dir, 'speck', 'tickets', '0001-x.md'), 'utf8')) };
  const said = [
    autoShipWhyNot({ auto_ship: true, auto_ship_risk: ['low'] }, '0001', 'low', [], 'task'),
    documentSection(dir, t),
    documentLines(dir, t).join('\n'),
    lint({ kind: 'task' }).join('\n'),
  ];
  const code = repoWith({ kind: 'code' });
  try { outputFolder(code, '1'); assert.fail('refuses a code ticket'); } catch (e) { said.push(e.message); }
  for (const s of said) {
    assert.ok(s.trim(), 'says something');
    assert.ok(!/\bdocuments?\b/i.test(s), `no "document": ${s}`);
  }
  assert.match(said[0], /ticket 0001 is a task, and a task waits for you to ship it/);
  assert.match(said[2], /### Result/);
  assert.match(said[4], /Ticket 0001 is a code ticket, not a task, so it has no output folder\./);
});

test('0492 AC3: no script or template speck shows people says document task, document ticket or read the document', () => {
  const files = [...fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => f.endsWith('.mjs')).map(f => path.join('scripts', f)),
    ...fs.readdirSync(path.join(ROOT, 'templates')).filter(f => /\.(js|md|html|yml)$/.test(f)).map(f => path.join('templates', f))];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const re of [/document task/i, /document ticket/i, /read the document/i, /writes a document/i])
      assert.ok(!re.test(text), `${f} says ${re}`);
  }
  assert.ok(!fs.readFileSync(path.join(ROOT, 'templates', 'reviewer-document.md'), 'utf8').match(/\bdocument\b/i), 'the reviewer prompt\'s part says result, not document');
  assert.ok(!/aria-label="Document"/.test(fs.readFileSync(path.join(ROOT, 'templates', 'panel.html'), 'utf8')), 'the pop-up a task\'s file opens in isn\'t named Document');
});

const texts = (p, n) => p.all(n).filter(x => /^tag\b/.test(x.className || '')).map(x => x.textContent);
const card = (p, list, id) => list.find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const TIP = 'Task: the build does a task and leaves its result in outputs/, not code';

test('0492 AC3: a task ticket\'s card shows a task tag with its tip, in Tickets, Build and Shipped, whichever line it has', async () => {
  const ago = min => new Date(Date.now() - min * 60000).toISOString();
  const s = () => ({ ideas: [], tickets: [
    T('0001', 'draft', { kind: 'task' }), T('0002', 'draft', { kind: 'code' }),
    T('0003', 'ready', { kind: 'task' }), T('0004', 'ready', { kind: 'code' }),
    T('0005', 'done', { started: ago(50), finished: ago(20), kind: 'task' }),
    T('0006', 'done', { started: ago(50), finished: ago(20), kind: 'code' }),
  ] });
  const p = fakePage([s(), s(), s()]);
  await p.settle();
  for (const [list, task, code] of [[items(p), '0001', '0002'], [queueRows(p), '0003', '0004'], [shippedRows(p), '0005', '0006']]) {
    const d = card(p, list, task), c = card(p, list, code);
    assert.ok(d && c, `cards for ${task} and ${code}`);
    const tag = p.all(d).find(x => x.textContent === 'task' && /^tag\b/.test(x.className));
    assert.ok(tag, `${task} shows a task tag`);
    assert.equal(tag.tip, TIP);
    assert.equal(tag.attrs['aria-label'], TIP);
    assert.ok(!d.textContent.toLowerCase().includes('document'), `${task}: no "document" on its card`);
    assert.ok(!texts(p, c).includes('task') && !texts(p, c).includes('code'), `${code} shows no kind tag`);
  }
});

test('0492 AC3: a finished task\'s closed card reads Read the result, and open its Type cell says task', async () => {
  const t = T('0001', 'approved', { kind: 'task', auto_ship: false, rounds: [round(1, 1)], ...exitOf('log line') });
  const p = fakePage([{ ideas: [], tickets: [t] }, { text: 'log', truncated: false }]);
  await p.settle();
  const row = () => queueRows(p).find(r => r.textContent.includes('0001'));
  const progress = row().children[0].children.find(n => n.className === 'progress');
  assert.ok(progress.textContent.startsWith('Read the result'), progress.textContent);
  assert.ok(!row().textContent.toLowerCase().includes('document'), row().textContent);
  p.press(row().children.find(n => n.className === 'top'));
  await p.settle();
  assert.equal(nowOf(row()).textContent, 'Read the result');
  assert.ok(!/document/i.test(nowOf(row()).title), nowOf(row()).title);
  const type = p.all(row()).find(n => n.tagName === 'dt' && n.textContent === 'Type');
  assert.ok(type, 'a Type cell');
  const fact = p.all(row()).find(n => n.className === 'fact' && n.children.includes(type));
  assert.equal(fact.children[1].textContent, 'task');
  assert.ok(!p.all(row()).some(n => /\bdocument\b/i.test(n.title || '') || /\bdocument\b/i.test(n.tip || '') || /\bdocument\b/i.test(n.attrs?.['aria-label'] || '')), 'no tooltip or accessible name says document');
});

test('0492 AC4: a kind: task ticket has an output folder, a reviewer prompt part, pack files and served files, and waits for you to ship it', () => {
  const dir = repoWith({ kind: 'task', output: 'memos' });
  const folder = outputFolder(dir, '1');
  assert.equal(folder, path.join(dir, 'outputs', 'memos') + path.sep);
  fs.writeFileSync(path.join(folder, 'memo.md'), '# Memo\n');
  const t = parseTicket(fs.readFileSync(path.join(dir, 'speck', 'tickets', '0001-x.md'), 'utf8'));
  assert.ok(documentSection(dir, t).includes('memo.md'), 'the reviewer is told the file');
  assert.deepEqual(documentLines(dir, t), ['', '### Result', '- `outputs/memos/memo.md`']);
  assert.deepEqual(panelDocuments(dir, t), [{ path: 'outputs/memos/memo.md', url: '/api/tickets/0001/output/memo.md' }]);
  assert.equal(String(documentFile(dir, '1', 'memo.md').body), '# Memo\n');
  assert.notEqual(autoShipWhyNot({ auto_ship: true, auto_ship_risk: ['low'] }, '0001', 'low', [], 'task'), '', 'never ships by itself');
  assert.equal(autoShipWhyNot({ auto_ship: true, auto_ship_risk: ['low'] }, '0001', 'low', [], 'code'), '', 'a code ticket can');
  // A code ticket that still has an old task: document line under kind: code has none of it.
  const code = repoWith({ kind: 'code', task: 'document', output: 'memos' });
  const c = parseTicket(fs.readFileSync(path.join(code, 'speck', 'tickets', '0001-x.md'), 'utf8'));
  assert.equal(documentSection(code, c), '');
  assert.deepEqual(documentLines(code, c), []);
  assert.equal(documentFile(code, '1', 'memo.md'), null);
});
