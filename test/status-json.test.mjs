import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, good, fm, round, gitEnv, startRepo } from './support/speck.mjs';

const statusJson = (run, cwd) => {
  const res = cwd ? spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } }) : run('status', '--json');
  assert.equal(res.status, 0, res.stderr + res.stdout);
  return JSON.parse(res.stdout); // throws if anything but one JSON value is on stdout
};

// A repo with tickets written straight to disk, so every field can be chosen.
function jsonRepo() {
  const r = startRepo({ config: { worktrees: 'false' } });
  const write = (name, fmText, body = good, where = 'speck/tickets') => {
    fs.mkdirSync(path.join(r.dir, where), { recursive: true });
    fs.writeFileSync(path.join(r.dir, where, name), `---\n${fmText}\n---\n${body}`);
  };
  return { ...r, write };
}

test('0030 AC1: speck status --json prints one JSON object with tickets and ideas, and plain status is unchanged', () => {
  const r = startRepo({ config: { worktrees: 'false' } });
  const plain = r.run('status').stdout;
  // 0285: after the Foreman's status, with speck run off
  assert.equal(plain, 'FOREMAN: Off\n  0001 ready, not building: speck run is off\n\nREADY (1)\n  0001  P3  S/low  Export bookings\n\nIDEAS (0: 0 waiting, 0 in the inbox, 0 ticketed) in speck/ideas/\n');
  const res = r.run('status', '--json');
  assert.equal(res.status, 0);
  const out = JSON.parse(res.stdout);
  assert.deepEqual(Object.keys(out).sort(), ['idea_counts', 'ideas', 'resume_command', 'tickets']); // resume_command added by 0044, idea_counts by 0325
  assert.ok(Array.isArray(out.tickets) && Array.isArray(out.ideas));
  assert.equal(out.tickets.length, 1);
  assert.equal(r.run('status').stdout, plain, 'text output still the same');

  // No tickets and no ideas folder.
  fs.rmSync(path.join(r.dir, 'speck', 'tickets'), { recursive: true, force: true });
  fs.rmSync(path.join(r.dir, 'speck', 'ideas'), { recursive: true, force: true });
  assert.deepEqual(statusJson(r.run), { tickets: [], ideas: [], idea_counts: { waiting: 0, inbox: 0, ticketed: 0 }, resume_command: 'claude --resume {session}' });
});

test('0030 AC2: each ticket has its frontmatter, path, worktree, acceptance criteria, blocked question and lint counts', () => {
  const r = jsonRepo();
  r.write('0002-blocked-one.md', fm({ id: '"0002"', title: 'Blocked one', status: 'blocked', priority: 2, custom_field: 'kept' }),
    good.replace('1. Export button downloads a CSV.', '1. First thing works.\n2. Second thing: also works.') +
    '## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\nShould it be A or B?\nI recommend A.\n');
  r.write('0003-done-one.md', fm({ id: '"0003"', title: 'Done one', status: 'done', priority: 4 }), good + '## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\n', 'speck/tickets/done');
  const { tickets } = statusJson(r.run);
  const byId = Object.fromEntries(tickets.map(t => [t.id, t]));
  assert.deepEqual(Object.keys(byId).sort(), ['0001', '0002', '0003'], 'each ticket once');

  const b = byId['0002'];
  for (const [k, v] of Object.entries({ id: '0002', title: 'Blocked one', status: 'blocked', priority: 2, size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', custom_field: 'kept' }))
    assert.deepEqual(b[k], v, k);
  assert.equal(b.path, 'speck/tickets/0002-blocked-one.md');
  assert.equal(b.worktree, null);
  assert.deepEqual(b.acceptance_criteria, ['First thing works.', 'Second thing: also works.']);
  assert.equal(b.blocked_question, 'Should it be A or B?\nI recommend A.');
  assert.deepEqual(b.lint, { errors: 0, warnings: 2 }, 'no heading or status line: two warnings, as speck lint says');

  const d = byId['0003'];
  assert.equal(d.path, 'speck/tickets/done/0003-done-one.md');
  assert.equal(d.blocked_question, null, 'only the comment');
  const one = byId['0001'];
  assert.equal(one.blocked_question, null, 'no section at all');
  assert.deepEqual(one.lint, { errors: 0, warnings: 0 });
  assert.equal(one.reviewer_model, '');

  // Lint errors are counted the same way as speck lint.
  r.write('0004-bad.md', fm({ id: '"0004"', title: 'Bad', size: 'L', risk: 'medium' }), good);
  const bad = statusJson(r.run).tickets.find(t => t.id === '0004');
  const lintOut = r.run('lint', '4').stdout.split('\n');
  assert.deepEqual(bad.lint, { errors: lintOut.filter(l => l.startsWith('✗')).length, warnings: lintOut.filter(l => l.startsWith('!')).length });
  assert.equal(bad.lint.errors, 2, 'size L and risk medium');
  assert.deepEqual(bad.acceptance_criteria, ['Export button downloads a CSV.']);
});

test('0030 AC2: a ticket being built in another worktree comes from that worktree, with its path', () => {
  const r = startRepo({ config: { worktrees: 'true' } });
  assert.equal(r.run('start', '1').status, 0);
  const wt = r.worktrees()[1];
  const env = { ...process.env, ...gitEnv };
  spawnSync(process.execPath, [CLI, 'set', '1', 'status', 'reviewing'], { cwd: wt, env });
  const fromMain = statusJson(r.run).tickets;
  assert.equal(fromMain.length, 1, 'shown once');
  assert.equal(fromMain[0].status, 'reviewing');
  assert.equal(fromMain[0].worktree, wt);
  assert.equal(fromMain[0].path, 'speck/tickets/0001-export-bookings.md');
  const fromWt = statusJson(null, wt).tickets;
  assert.equal(fromWt[0].worktree, null, 'read from the current checkout');
  assert.equal(fromWt[0].status, 'reviewing');
});

const rec = (round, meta, verdict) => ({ meta: { round, reviewer: 'codex', ...meta }, verdict: { verdict, criteria: [], findings: [], summary: 's', escalation_question: '' } });
const jsonRoundsSection = recs => `## Review rounds\n<!-- Written by speck after each review round. Don't edit it by hand. -->\n` +
  recs.map(x => `\n<details><summary>Round ${x.meta.round} · ${x.meta.reviewer} · ${x.verdict.verdict}</summary>\n\n\`\`\`json\n${JSON.stringify(x, null, 2)}\n\`\`\`\n\n</details>\n`).join('');

test('0030 AC3: each ticket lists its review rounds in order with reviewer, verdict, seconds and tokens', () => {
  const r = jsonRepo();
  r.write('0002-reviewed.md', fm({ id: '"0002"', title: 'Reviewed' }), good + jsonRoundsSection([
    rec(1, { seconds: 42, usage: { input_tokens: 1000, cached_input_tokens: 500, output_tokens: 234 } }, 'changes_requested'),
    rec(2, { reviewer: 'claude-subagent' }, 'approve'),
  ]));
  const { tickets } = statusJson(r.run);
  assert.deepEqual(tickets.find(t => t.id === '0002').rounds, [
    { round: 1, reviewer: 'codex', verdict: 'changes_requested', seconds: 42, tokens: 1234 },
    { round: 2, reviewer: 'claude-subagent', verdict: 'approve', seconds: null, tokens: 0 },
  ]);
  assert.deepEqual(tickets.find(t => t.id === '0001').rounds, []);
});

test('0030 AC4: waiting_on lists after ids not done, and tickets sort by priority then id', () => {
  const r = jsonRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two', status: 'done', priority: 5 }), good, 'speck/tickets/done');
  r.write('0003-three.md', fm({ id: '"0003"', title: 'Three', priority: 1, after: '["0009", "0002", "0001"]' }), good);
  r.write('0004-four.md', fm({ id: '"0004"', title: 'Four' }), good); // no priority
  r.write('0005-five.md', fm({ id: '"0005"', title: 'Five', priority: 1, after: '[]' }), good);
  const { tickets } = statusJson(r.run);
  assert.deepEqual(tickets.map(t => t.id), ['0003', '0005', '0001', '0002', '0004']);
  assert.deepEqual(tickets.find(t => t.id === '0003').waiting_on, ['0009', '0001'], 'missing ticket and not-done ticket, in order');
  assert.deepEqual(tickets.find(t => t.id === '0005').waiting_on, []);
  assert.deepEqual(tickets.find(t => t.id === '0004').waiting_on, [], 'no after field');
});

test('0030 AC5: ideas list each note sorted by file name with path, title and status', () => {
  const r = startRepo({ config: { worktrees: 'false' } });
  const ideas = path.join(r.dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  fs.writeFileSync(path.join(ideas, 'b-board.md'), '# Speck board\n\nCaptured: 2026-10-08 · Status: ticketed (0030, 0031)\n\n## Later\n# Not this one\n');
  fs.writeFileSync(path.join(ideas, 'a-untitled.md'), 'No heading here.\n## Only a level-two heading\n');
  fs.writeFileSync(path.join(ideas, 'c-notes.txt'), '# Not markdown\n');
  // 0033 adds body; the 0030 fields are unchanged.
  assert.deepEqual(statusJson(r.run).ideas.map(({ body, ...rest }) => rest), [
    { path: 'speck/ideas/a-untitled.md', title: 'a-untitled.md', status: null },
    { path: 'speck/ideas/b-board.md', title: 'Speck board', status: 'ticketed (0030, 0031)' },
  ]);
});

test('0030 AC2: a multi-line acceptance criterion comes through whole, with its nested list', () => {
  const r = jsonRepo();
  r.write('0002-multi.md', fm({ id: '"0002"', title: 'Multi' }), good.replace('1. Export button downloads a CSV.',
    '1. Export a CSV with:\n   - names\n   - dates, wrapped\n     onto a second line\n\n2. Second criterion.\n<!-- a comment -->'));
  const t = statusJson(r.run).tickets.find(x => x.id === '0002');
  assert.deepEqual(t.acceptance_criteria, ['Export a CSV with:\n   - names\n   - dates, wrapped\n     onto a second line', 'Second criterion.']);
});

// ---------- 0022: the first review round sets the ticket to reviewing ----------

test('0033 AC1: each ticket has its problem, outcome, out of scope, notes, self-check and lint messages', () => {
  const r = jsonRepo();
  r.write('0002-full.md', fm({ id: '"0002"', title: 'Full', status: 'draft', priority: 2 }),
    '## Problem\n<!-- What is wrong today? -->\nUsers cannot export.\n\n  It hurts.\n\n## Outcome\nUsers can export CSV.\n' +
    '## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n<!-- What this ticket will not do. -->\n- PDF export\n- Excel\n' +
    '## Notes\n- Design: see the mockup.\n- Self-check: added a guard for empty files.\n- Self-check: a second one is ignored.\n' +
    '## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\n');
  r.write('0003-bare.md', fm({ id: '"0003"', title: 'Bare and odd', size: 'L' }),
    '## Problem\n<!-- only a comment -->\n\n## Outcome\nOut.\n## Acceptance criteria\n1. One.\n## Notes\n<!-- x -->\nNo self check here, but Self-check: mid-line does not count.\n');
  r.write('0004-empty-check.md', fm({ id: '"0004"', title: 'Empty', problem: 'from frontmatter' }), good + '## Notes\nSelf-check:\n');
  const { tickets } = statusJson(r.run);
  const by = Object.fromEntries(tickets.map(t => [t.id, t]));

  const f = by['0002'];
  assert.equal(f.problem, 'Users cannot export.\n\n  It hurts.', 'comments gone, inner lines kept');
  assert.equal(f.outcome, 'Users can export CSV.');
  assert.equal(f.out_of_scope, '- PDF export\n- Excel');
  assert.equal(f.notes, '- Design: see the mockup.\n- Self-check: added a guard for empty files.\n- Self-check: a second one is ignored.');
  assert.equal(f.self_check, 'added a guard for empty files.', 'the first Self-check line, list marker allowed');
  assert.deepEqual(f.lint_messages, { errors: [], warnings: f.lint_messages.warnings });

  const b = by['0003'];
  assert.equal(b.problem, null, 'only a comment');
  assert.equal(b.out_of_scope, null, 'no section');
  assert.equal(b.notes, 'No self check here, but Self-check: mid-line does not count.');
  assert.equal(b.self_check, null);
  assert.equal(by['0001'].notes, null);
  assert.equal(by['0001'].self_check, null);
  assert.equal(by['0004'].self_check, null, 'nothing after Self-check:');
  assert.equal(by['0004'].problem, 'Users cannot export.', 'the section replaces a frontmatter field of the same name');

  // Lint messages are the same text speck lint prints, and match the counts.
  for (const id of ['2', '3']) {
    const t = by[id.padStart(4, '0')];
    const out = r.run('lint', id).stdout.split('\n');
    assert.deepEqual(t.lint_messages, {
      errors: out.filter(l => l.startsWith('✗ ')).map(l => l.slice(2)),
      warnings: out.filter(l => l.startsWith('! ')).map(l => l.slice(2)),
    }, id);
    assert.deepEqual(t.lint, { errors: t.lint_messages.errors.length, warnings: t.lint_messages.warnings.length });
  }
  assert.ok(b.lint_messages.errors.some(e => /size L/.test(e)) && b.lint_messages.warnings.some(w => /two outcomes/.test(w)));

  // Every existing field is unchanged.
  for (const k of ['id', 'title', 'status', 'priority', 'size', 'risk', 'path', 'worktree', 'acceptance_criteria', 'blocked_question', 'lint', 'rounds', 'waiting_on'])
    assert.ok(k in f, k);
  assert.deepEqual(f.acceptance_criteria, ['Export button downloads a CSV.']);
  assert.equal(f.blocked_question, null);
});

test('0033 AC1: each idea has its full text as body, and the other idea fields are unchanged', () => {
  const r = startRepo({ config: { worktrees: 'false' } });
  const ideas = path.join(r.dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  const text = '# Speck board\n\nCaptured: 2026-10-08 · Status: idea\n\n<!-- kept -->\n## Later\nMore <b>text</b>.\n';
  fs.writeFileSync(path.join(ideas, 'b-board.md'), text);
  fs.writeFileSync(path.join(ideas, 'a-empty.md'), '');
  assert.deepEqual(statusJson(r.run).ideas, [
    { path: 'speck/ideas/a-empty.md', title: 'a-empty.md', status: null, body: '' },
    { path: 'speck/ideas/b-board.md', title: 'Speck board', status: 'idea', body: text },
  ]);
});
