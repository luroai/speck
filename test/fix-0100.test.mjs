import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';
import { ROOT, T, fm, good, page, fakePage, items, queueRows, shippedRows, panelRepo } from './support/panel.mjs';
import { runRepo, runOnce } from './support/run.mjs';

// ---------- 0100: fix tickets for a broken main, at P0 ----------

const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
const lint = o => lintTicket(parseTicket(`---\n${fm(o)}\n---\n${good}`), cfg).errors;
const read = (r, rel) => fs.readFileSync(path.join(r.dir, rel), 'utf8');

test('0100 AC1: speck new --type=fix creates a fix ticket with priority 0, and lint accepts it', () => {
  const r = panelRepo();
  const made = r.run('new', 'Mend the failing tests on main', '--type=fix');
  assert.equal(made.status, 0, made.stderr);
  assert.match(made.stdout.trim(), /0002-mend-the-failing-tests-on-main\.md$/, 'the flag is not part of the title');
  const t = parseTicket(read(r, made.stdout.trim()));
  assert.equal(t.fm.type, 'fix');
  assert.equal(t.fm.priority, 0);
  const out = r.run('lint', '2');
  assert.doesNotMatch(out.stdout, /✗ (type|priority)/, out.stdout);
  assert.deepEqual(lint({ type: 'fix', priority: 0 }), []);
  assert.deepEqual(lint({ type: 'fix', priority: 2 }), [], 'a fix ticket may have another priority');
  assert.deepEqual(lint({ type: 'fix   # broken main' }), [], 'fix with a comment');
});

test('0100 AC1: --type=bug still works, and other types are still refused, creating nothing', () => {
  const r = panelRepo();
  const bug = r.run('new', 'Fix lost work', '--type=bug');
  assert.equal(bug.status, 0, bug.stderr);
  assert.equal(parseTicket(read(r, bug.stdout.trim())).fm.priority, 3, 'a bug keeps the template priority');
  const before = fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).sort();
  for (const bad of [['--type=FIX'], ['--type=fixes'], ['--type=fix', '--type=bug'], ['--type'], ['--type=']]) {
    const refused = r.run('new', 'Another', ...bad);
    assert.notEqual(refused.status, 0, `${bad} is refused`);
    assert.match(refused.stderr, /--type=bug or --type=fix/, 'names both values');
    assert.doesNotMatch(refused.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.deepEqual(fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).sort(), before, 'nothing created');
});

test('0100 AC2: lint reports priority 0 as an error on any ticket that is not a fix ticket', () => {
  for (const type of [undefined, '""', 'bug', 'fixes']) {
    const errors = lint({ ...(type === undefined ? {} : { type }), priority: 0 }).filter(e => /priority/.test(e));
    assert.equal(errors.length, 1, `type ${type}: one priority error`);
    assert.match(errors[0], /priority 0.*fix ticket/, 'says only a fix ticket can have it');
  }
  for (const bad of ['-1', '6', '0.5']) assert.equal(lint({ type: 'fix', priority: bad }).filter(e => /priority/.test(e)).length, 1, `fix ticket, priority ${bad}`);
});

test('0100 AC2: speck set <id> priority 0 refuses on a ticket that is not a fix ticket, and works on a fix ticket', () => {
  const r = panelRepo();
  const before = read(r, path.relative(r.dir, r.file));
  const refused = r.run('set', '1', 'priority', '0');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /fix ticket/);
  assert.doesNotMatch(refused.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(read(r, path.relative(r.dir, r.file)), before, 'nothing changed');
  const made = r.run('new', 'Mend main', '--type=fix');
  assert.equal(r.run('set', '2', 'priority', '4').status, 0);
  const back = r.run('set', '2', 'priority', '0');
  assert.equal(back.status, 0, back.stderr);
  assert.equal(parseTicket(read(r, made.stdout.trim())).fm.priority, 0);
  for (const bad of ['-1', '00', '6']) assert.notEqual(r.run('set', '2', 'priority', bad).status, 0, `priority ${bad} is refused`);
});

// The ids of a status group in `speck status`, in order.
const group = (out, name) => {
  const lines = out.split('\n');
  const rows = [];
  for (const l of lines.slice(lines.findIndex(x => x.startsWith(`${name.toUpperCase()} (`)) + 1)) { if (!l.startsWith('  ')) break; const m = l.match(/^ {2}(\d{4})\b/); if (m) rows.push(m[1]); }
  return rows;
};

test('0100 AC3: fix tickets sort first in speck status and status --json', () => {
  const r = panelRepo();
  r.write('0002-a.md', fm({ id: '"0002"', status: 'ready', priority: 1 }));
  r.write('0003-a.md', fm({ id: '"0003"', status: 'ready', type: 'fix', priority: 3 }));
  r.write('0004-a.md', fm({ id: '"0004"', status: 'ready', type: 'fix', priority: 0 }));
  r.write('0005-a.md', fm({ id: '"0005"', status: 'ready', type: 'bug', priority: 0 }));
  r.write('0006-a.md', fm({ id: '"0006"', status: 'ready', type: 'fix' }));
  r.write('0007-a.md', fm({ id: '"0007"', status: 'ready', priority: -1 }));
  const fix = ['0004', '0003', '0006'];
  const rest = ['0002', '0001', '0005', '0007']; // 0001 is P3; 0005 (P0 on a bug) and 0007 (P-1) are invalid, so last
  assert.deepEqual(group(r.run('status').stdout, 'ready'), [...fix, ...rest]);
  const json = JSON.parse(r.run('status', '--json').stdout).tickets.map(t => t.id);
  assert.deepEqual(json, [...fix, ...rest]);
});

test('0100 AC3: speck run starts fix tickets first', () => {
  const r = runRepo({ tickets: [['0001', { priority: 1 }], ['0002', { type: 'bug', priority: 1 }], ['0003', { type: 'fix', priority: 2 }], ['0004', { type: 'fix', priority: 0 }]], max: 1 });
  const out = runOnce(r.dir, { FAKE_MS: '0' });
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(r.calls().map(c => c.args[0]), ['0004', '0003', '0001', '0002']);
});

test('0100 AC4: speck status shows fix after a fix ticket\'s id, and --json has type "fix"', () => {
  const r = panelRepo();
  r.write('0002-fix.md', fm({ id: '"0002"', title: 'Mend main', type: 'fix', priority: 0 }));
  const out = r.run('status').stdout;
  assert.match(out, /^\s+0002 fix\s+P0\s/m);
  assert.doesNotMatch(out, /^\s+0001 fix/m);
  assert.equal(JSON.parse(r.run('status', '--json').stdout).tickets.find(t => t.id === '0002').type, 'fix');
});

test('0100 AC4: the panel shows a fix tag beside a fix ticket\'s id in Shaping, the queue and Shipped', async () => {
  const p = fakePage([{ tickets: [
    T('0001', 'draft', { type: 'fix', priority: 0 }), T('0002', 'draft', { type: 'bug' }),
    T('0003', 'ready', { type: 'fix', priority: 0 }), T('0004', 'ready'),
    T('0005', 'done', { type: 'fix', priority: 0, finished: new Date().toISOString() }), T('0006', 'done', { type: null, finished: new Date().toISOString() }),
  ], ideas: [] }]);
  await p.settle();
  const idOf = row => p.all(row).find(n => n.className === 'id')._text;
  const afterId = row => {
    const id = p.all(row).find(n => n.className === 'id');
    const parent = p.all(row).find(n => (n.children || []).includes(id));
    return parent.children[parent.children.indexOf(id) + 1];
  };
  // 0151: in Plan the fix tag comes after the priority, size and risk tags, in the row under the title.
  const lastTag = row => p.all(row).find(n => /\btag-row\b/.test(n.className || '')).children.filter(n => /\btag\b/.test(n.className || '')).at(-1);
  const anyFix = row => p.all(row).some(n => /\bfix\b/.test(n.className || ''));
  for (const [where, rows] of [['Shaping', items(p)], ['queue', queueRows(p)], ['Shipped', shippedRows(p)]]) {
    const fix = rows.find(r => ['0001', '0003', '0005'].includes(idOf(r)));
    const other = rows.find(r => ['0002', '0004', '0006'].includes(idOf(r)));
    assert.ok(fix && other, `${where} lists both`);
    const tag = where === 'Shaping' ? lastTag(fix) : afterId(fix);
    assert.match(tag.className || '', /\btag fix\b/, `${where}: a fix tag ${where === 'Shaping' ? 'after the other tags' : 'right after the id'}`);
    assert.equal(tag._text, 'fix');
    assert.ok(!anyFix(other), `${where}: no fix tag on another ticket`);
  }
  assert.match(page(), /\.tag\.fix\s*\{[^}]*color:/, 'the fix tag has a colour');
});

test('0100: the ticket template and /speck-ticket mention fix tickets', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'ticket.md'), 'utf8');
  assert.match(tpl.split('\n').find(l => /^type:/.test(l)), /\bfix\b/);
  assert.match(tpl.split('\n').find(l => /^priority:/.test(l)), /\b0\b.*fix/);
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ticket', 'SKILL.md'), 'utf8');
  assert.match(skill, /--type=fix/);
});
