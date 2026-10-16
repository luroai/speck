import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- 0250: bring the README's wording in line with the landing page ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readme = () => read('README.md');
const headings = () => [...readme().matchAll(/^## (.+)$/gm)].map(m => m[1]);
const section = name => readme().match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'))?.[1] || '';
const subsections = s => [...s.matchAll(/^### (.+)\n([\s\S]*?)(?=^### |(?![\s\S]))/gm)].map(m => ({ title: m[1], body: m[2] }));
// The setting's value in templates/config.yml, the defaults a new project gets.
const setting = key => read('templates/config.yml').match(new RegExp(`^\\s*${key}: (\\S+)`, 'm'))?.[1];

// The landing page's words, from site/index.html in the speck-site repo.
const TAGLINE = 'Your judgement, at agent speed.';
const OPENING = 'You own two decisions: what gets built and what gets shipped. Everything in between is automated. speck builds each ticket, has a second AI review it, and stops only when it needs you.';

test('0250 AC1: the README opens with the tagline, the opening paragraph, the image, then Get started', () => {
  const r = readme();
  const lines = r.split('\n').filter(l => l.trim());
  assert.equal(lines[0], '# speck');
  assert.equal(lines[1], `**${TAGLINE}**`);
  assert.equal(lines[2], OPENING);
  assert.equal(lines[3], '<picture>');
  assert.equal(headings()[0], 'Get started');
  // Between the image and Get started there's only the status line.
  const between = r.slice(r.indexOf('</picture>') + '</picture>'.length, r.indexOf('## Get started')).trim();
  assert.match(between, /^> Status: [^\n]*$/);
});

test('0250 AC1: the setup prompt keeps the pinned install at the current version', () => {
  const { version } = JSON.parse(read('package.json'));
  const prompt = section('Get started').match(/```[^\n]*\n([\s\S]*?)```/)?.[1] || '';
  assert.ok(prompt.includes(`npx github:luroai/speck#v${version} init`), prompt);
});

test('0250 AC2: How it works follows the landing page\'s three parts in order', () => {
  assert.equal(headings()[1], 'How it works');
  const parts = subsections(section('How it works'));
  assert.deepEqual(parts.map(p => p.title), [
    'Your first decision: what gets built',
    'Everything in between',
    'Your second decision: what ships',
  ]);
  const [first, between, second] = parts.map(p => p.body);
  for (const s of ['/speck-capture', '/speck-ticket', 'set <id> status ready', 'after:', 'speck panel']) assert.ok(first.includes(s), `first decision names ${s}`);
  assert.match(between, /tests first/i);
  assert.match(between, /self-check/i);
  assert.match(between, /second AI/);
  assert.match(between, /own git worktree/);
  for (const s of ['/speck-build', '/speck-review', 'speck run', 'max_parallel_builds', 'reviewer']) assert.ok(between.includes(s), `everything in between names ${s}`);
  for (const s of ['review pack', 'speck pack <id>', '/speck-ship', 'Ship button', 'auto_ship', 'auto_ship_risk']) assert.ok(second.includes(s), `second decision names ${s}`);
});

test('0250 AC3: The clever bits gives each of the landing page\'s clever bits, in order, with what makes it happen', () => {
  const s = section('The clever bits');
  const bits = [...s.matchAll(/^\*\*(.+?)\*\* (.*)$/gm)].map(m => ({ title: m[1], body: m[2] }));
  const want = [
    ['It raises its own fix tickets.', ['--type=fix', 'priority 0', 'speck set <fix-id> status ready']],
    ['It files its own follow-ups.', ['speck/ideas/', 'Status: inbox', '/speck-ticket']],
    ['Ideas only become tickets in conversation.', ['/speck-capture', '/speck-ticket', 'draft']],
    ['It asks, then moves on.', ['blocked', '## Blocked question', '/speck-build <id>']],
    ['It sorts out its own merge conflicts.', ['speck merge-check <id>', 'merge round', 'max_merge_rounds']],
    ['It fits in your pocket.', ['panel --url', 'home screen']],
    ['It keeps the receipts.', ['## Review rounds', '## Delivery log', 'cost']],
  ];
  assert.deepEqual(bits.map(b => b.title), want.map(w => w[0]));
  for (const [i, [title, mechanisms]] of want.entries())
    for (const m of mechanisms) assert.ok(bits[i].body.includes(m), `${title} names ${m}`);
});

test('0250 AC4: Under the hood covers the review turns, where state lives, which tests run when and the ship queue', () => {
  const s = section('Under the hood');
  assert.ok(s, 'the README has an Under the hood section');
  assert.ok(headings().indexOf('Under the hood') > headings().indexOf('The clever bits'));
  const parts = Object.fromEntries(subsections(s).map(p => [p.title, p.body]));
  assert.deepEqual(Object.keys(parts), ['The review loop', 'Where state lives', 'Which tests run when', 'Builds and the ship queue']);

  const loop = parts['The review loop'];
  for (const x of ['max_review_rounds', 'escalate_after_repeat_disputes', 'blocking', 'minor', 'fixed', 'disputed', 'needs_pm', 'same reviewer session'])
    assert.ok(loop.includes(x), `the review loop names ${x}`);
  // The defaults it gives are the ones a new project gets, as the brief says.
  assert.match(loop, new RegExp(`\`max_review_rounds\`, default ${setting('max_review_rounds')}\\b`));
  assert.match(loop, new RegExp(`two consecutive rounds`));
  assert.equal(setting('escalate_after_repeat_disputes'), '2');

  const state = parts['Where state lives'];
  for (const x of ['frontmatter', '## Review rounds', '## Review log', '## Delivery log', 'speck/.cache/', 'speck/tickets/done/'])
    assert.ok(state.includes(x), `where state lives names ${x}`);

  const tests = parts['Which tests run when'];
  for (const x of ['speck test --recorded', 'Failing before this build', 'speck test --files', 'speck ship', 'whole suite'])
    assert.ok(tests.includes(x), `which tests run when names ${x}`);

  const queue = parts['Builds and the ship queue'];
  for (const x of ['speck run', 'max_parallel_builds', 'ship queue', 'one at a time', 'base branch'])
    assert.ok(queue.includes(x), `builds and the ship queue names ${x}`);
});

test('0250 AC4: Under the hood agrees with the brief on the facts it shares', () => {
  const brief = read('docs/brief.md');
  const s = section('Under the hood');
  // The brief's rules on ending the loop, the repeated-dispute rule and where review working files go.
  assert.match(brief, /same finding is disputed in two consecutive rounds/);
  assert.match(s, /same finding is disputed in two consecutive rounds/);
  assert.match(brief, /Working files for a review in progress go in `speck\/\.cache\/`/);
  assert.match(s, /working files for reviews in progress/);
  assert.match(brief, /Minor findings never block/);
  assert.match(s, /Minor findings never block/);
});

test('0250 AC5: the README keeps every section it had, after the new ones', () => {
  const h = headings();
  for (const name of ['What a review pack looks like', 'Who it\'s for', 'The panel', 'Requirements', 'Without an agent', 'Commands', 'Using another reviewer', 'Repo layout', 'Built with speck', 'Design', 'Licence'])
    assert.ok(h.includes(name), `the README has ${name}`);
  assert.equal(h.at(-1), 'Licence');
});

test('0250 AC5: the facts the old introduction and How you work with it gave are still there', () => {
  const r = readme();
  for (const fact of [
    'idea → ticket → [you: ready]',
    'Claude Code by default',
    'Codex by default',
    'sized for one agent in one sitting',
    'makes you split anything bigger',
    'for overlap with what\'s already there',
    'could be read two ways',
    'highest priority first',
    'so ships never race each other for `main`',
    'at most three decisions',
    'The code, the tickets and the tests say what the product does',
    'time, review rounds and tokens',
    'No GitHub needed',
    'pushes it if you have a remote',
    'Most AI coding tools sell speed or autonomy',
    'You think in outcomes, not diffs',
    'light, auditable loop',
    'not for large multi-team specs',
    'Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec)',
  ]) assert.ok(r.includes(fact), `the README still says "${fact}"`);
});

test('0250 AC6: the ticket\'s Notes record the no-ai-slop passes', () => {
  const dirs = ['speck/tickets', 'speck/tickets/done'];
  const file = dirs.flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.startsWith('0250-')).map(f => `${d}/${f}`))[0];
  assert.ok(file, 'found the ticket');
  const notes = read(file).match(/^## Notes\n([\s\S]*?)(?=^## )/m)?.[1] || '';
  assert.match(notes, /^- No-ai-slop detect, first pass:/m);
  assert.match(notes, /^- No-ai-slop detect, second pass: no pattern left unaddressed/m);
});
