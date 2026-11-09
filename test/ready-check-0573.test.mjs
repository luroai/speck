import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, gitEnv, fakePage, full, click, items, top } from './support/panel.mjs';

// ---------- 0573: speck calls the check that a ticket is ready to build the ready check ----------

// A fresh repo with draft 0001, which fails the check until it's filled in, and 0002, which passes it.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-check-')));
  const env = { ...process.env, ...gitEnv };
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run('init', '--skip-checks').status, 0);
  run('new', 'Export bookings');
  const file = path.join(dir, run('new', 'Export invoices').stdout.trim());
  const body = fs.readFileSync(file, 'utf8')
    .replace(/## Problem\n[^]*?\n## Notes/, '## Problem\nUsers need it.\n\n## Outcome\nThey get it.\n\n## Acceptance criteria\n1. It works.\n\n## Out of scope\n- Nothing.\n\n## Notes');
  fs.writeFileSync(file, body);
  return { dir, run };
}
const same = (a, b, what) => {
  assert.equal(a.status, b.status, `${what}: exit code`);
  assert.equal(a.stdout, b.stdout, `${what}: output`);
  assert.equal(a.stderr, b.stderr, `${what}: errors`);
};
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).map(s => `skills/${s}/SKILL.md`).filter(f => fs.existsSync(path.join(ROOT, f)));
const LINT = /\blint(s|ed|ing)?\b/i;

test('0573 AC1: speck check gives speck lint\'s output and exit code, for a pass, a failure and a ticket or id that isn\'t there', () => {
  const r = repo();
  const results = { fails: ['1'], passes: ['2'], missing: ['42'], 'no id': [] };
  for (const [what, args] of Object.entries(results)) same(r.run('check', ...args), r.run('lint', ...args), what);
  assert.equal(r.run('check', '1').status, 1, 'a ticket that fails exits 1, as lint does');
  assert.match(r.run('check', '1').stdout, /^✗ /m);
  assert.equal(r.run('check', '2').status, 0);
  assert.match(r.run('check', '2').stdout, /✓ 0002 passes size rules/);
});

test('0573 AC1: speck help lists speck check and says speck lint still works', () => {
  const help = repo().run('help').stdout;
  assert.match(help, /^ {2}speck check <id> +.*ready check/m);
  assert.match(help, /^ {2}speck lint <id> +.*speck check.*still works/m);
});

test('0573 AC2: speck set status ready, refusing a ticket, calls it the ready check and names speck check, not lint', () => {
  const r = repo();
  const out = r.run('set', '1', 'status', 'ready');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /ready check/);
  assert.match(out.stderr, /`speck check 0001`/);
  assert.match(out.stderr, /^ {2}✗ /m, 'still lists what stops it');
  assert.doesNotMatch(out.stderr, LINT);
});

test('0573 AC2: a ticket with no id in its frontmatter is told to run speck check <id>, not an undefined one', () => {
  const r = repo();
  const file = path.join(r.dir, 'speck', 'tickets', fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).find(f => f.startsWith('0001')));
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^id:.*\n/m, ''));
  const out = r.run('set', '1', 'status', 'ready');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /`speck check <id>`/);
  assert.doesNotMatch(out.stderr, /undefined/);
});

test('0573 AC2: the help line for speck set calls it the ready check', () => {
  const line = repo().run('help').stdout.split('\n').find(l => l.startsWith('  speck set <id>'));
  assert.match(line, /status ready runs the ready check first/);
  assert.doesNotMatch(line, LINT);
});

test('0573 AC2: the panel\'s pass line and the Set ready tooltip call it the ready check', async () => {
  const bad = full('0002', { title: 'Bad', lint: { errors: 1, warnings: 0 }, lint_messages: { errors: ['Size L.'], warnings: [] } });
  const p = fakePage([{ tickets: [full('0001'), bad], ideas: [] }]);
  await p.settle();
  click(top(items(p)[0]));
  assert.ok(items(p)[0].textContent.includes('Ready check passes'));
  click(top(items(p)[1]));
  const set = p.all(items(p)[1]).find(n => n.tagName === 'button' && n.textContent === 'Set ready');
  assert.equal(set.disabled, true);
  assert.match(set.title, /ready check/);
  assert.doesNotMatch(set.title, LINT);
});

test('0573 AC3: the skills and the ticket template never say lint', () => {
  for (const f of [...SKILLS, 'templates/ticket.md']) assert.doesNotMatch(read(f), LINT, f);
});

test('0573 AC3: the skills that run the check, the brief and the ticket template name speck check', () => {
  for (const f of ['skills/speck-ticket/SKILL.md', 'skills/speck-build/SKILL.md', 'skills/speck-review/SKILL.md', 'docs/brief.md', 'templates/ticket.md'])
    assert.ok(read(f).includes('speck check'), f);
  assert.ok(read('skills/speck-ticket/SKILL.md').includes('`speck check <id>`'), 'the step that runs it');
  assert.ok(read('docs/brief.md').includes('| `speck check <id>` |'), 'the brief\'s command table');
});

test('0573 AC3: the brief says speck lint still works exactly once, and otherwise never says lint', () => {
  const brief = read('docs/brief.md');
  assert.equal(brief.match(/\blint\b/gi)?.length, 1, 'one mention');
  assert.match(brief, /`speck lint <id>` still works/);
});

test('0573 AC4: the panel\'s readiness list is headed Ready check', async () => {
  const p = fakePage([{ tickets: [full('0001')], ideas: [] }]);
  await p.settle();
  click(top(items(p)[0]));
  const headings = p.all(items(p)[0]).filter(n => n.tagName === 'h4').map(n => n.textContent);
  assert.ok(headings.includes('Ready check'), headings.join());
  assert.ok(!headings.includes('Readiness'));
});
