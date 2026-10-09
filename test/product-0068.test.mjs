import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, env, good, fm } from './support/run.mjs';
import { validateVerdict, ticketRounds } from '../scripts/speck.mjs';

// ---------- 0068: remove product.md so the code is the only source of truth ----------

const MENTION = /product\.md|product_md|living spec/i;
const verdict = { verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 'Fine.', escalation_question: '' };

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', 'main');
  return { dir, g, run, at: p => path.join(dir, p) };
}

// A repo with speck installed, an old speck/product.md holding a marker, and ticket 0001 on its branch with one change.
// Its reviewer "fake" logs each prompt it's sent and answers with FAKE_VERDICT.
function reviewRepo() {
  const r = repo();
  assert.equal(r.run('init', '--skip-checks').status, 0);
  fs.writeFileSync(r.at('speck/product.md'), '# Old spec\nPRODUCT-SPEC-MARKER\n');
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-'));
  const fake = path.join(bin, 'fake-reviewer');
  const log = path.join(bin, 'prompts.log');
  fs.writeFileSync(fake, `#!${process.execPath}
const fs = require('fs');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(fs.readFileSync(0, 'utf8')) + '\\n');
console.log(process.env.FAKE_VERDICT);
`, { mode: 0o755 });
  const cfgFile = r.at('speck/config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(fake)}\n`));
  fs.writeFileSync(r.at('speck/tickets/0001-export.md'), `---\n${fm({ reviewer: 'fake' })}\n---\n# 0001 · Export bookings as CSV\n\n${good}`);
  r.g('add', '-A'); r.g('commit', '-qm', 'base');
  r.g('checkout', '-qb', 'speck/0001-export');
  fs.writeFileSync(r.at('a.txt'), 'change\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'work');
  const review = (v, ...a) => spawnSync(process.execPath, [CLI, 'review', '1', ...a], { cwd: r.dir, encoding: 'utf8', env: { ...env, FAKE_VERDICT: JSON.stringify(v) } });
  const prompts = () => fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const fix = text => { fs.writeFileSync(r.at('a.txt'), text); r.g('add', '-A'); r.g('commit', '-qm', 'fix'); };
  return { ...r, review, prompts, fix };
}

test('0068 AC1: speck init in a repo with no product.md creates none, and its AGENTS.md section does not mention it', () => {
  const r = repo();
  const res = r.run('init', '--skip-checks');
  assert.equal(res.status, 0, res.stderr);
  assert.ok(!fs.existsSync(r.at('speck/product.md')), 'no speck/product.md');
  assert.doesNotMatch(res.stdout, MENTION, 'init output does not mention it');
  const agents = fs.readFileSync(r.at('AGENTS.md'), 'utf8');
  assert.match(agents, /This repo uses speck/);
  assert.doesNotMatch(agents, MENTION);
  // The section it adds to an existing AGENTS.md is the same.
  const other = repo();
  fs.writeFileSync(other.at('AGENTS.md'), '# Mine\n');
  assert.equal(other.run('init', '--skip-checks').status, 0);
  const text = fs.readFileSync(other.at('AGENTS.md'), 'utf8');
  assert.ok(text.startsWith('# Mine\n'));
  assert.doesNotMatch(text, MENTION);
});

test('0068 AC1: speck init leaves an existing speck/product.md byte-for-byte unchanged, with or without --force', () => {
  const r = repo();
  const bytes = Buffer.from('# My product\r\n\nno trailing newline, odd bytes: é\u0000', 'utf8');
  fs.mkdirSync(r.at('speck'), { recursive: true });
  fs.writeFileSync(r.at('speck/product.md'), bytes);
  for (const args of [['init', '--skip-checks'], ['init', '--skip-checks'], ['init', '--skip-checks', '--force']]) {
    const res = r.run(...args);
    assert.equal(res.status, 0, res.stderr);
    assert.ok(fs.readFileSync(r.at('speck/product.md')).equals(bytes), `unchanged after ${args.join(' ')}`);
  }
});

test('0068 AC1: templates/product.md no longer exists', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'templates', 'product.md')));
});

test('0068 AC2: a verdict with no product_md passes validation, and the schema does not list it', () => {
  assert.equal(validateVerdict({ ...verdict }).verdict, 'changes_requested');
  assert.equal(validateVerdict({ ...verdict, verdict: 'approve' }).verdict, 'approve', 'an approval is not overridden for lacking it');
  // A verdict from before this change still validates.
  assert.equal(validateVerdict({ ...verdict, product_md: { accurate: false, note: 'old' } }).verdict, 'changes_requested');
  const schemaText = fs.readFileSync(path.join(ROOT, 'templates', 'review-verdict.schema.json'), 'utf8');
  assert.doesNotMatch(schemaText, MENTION);
  const schema = JSON.parse(schemaText);
  assert.ok(!schema.required.includes('product_md'));
  assert.ok(!('product_md' in schema.properties));
});

test('0068 AC2: the round-1 prompt has no product.md content and asks for no product.md check', () => {
  const r = reviewRepo();
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.doesNotMatch(p.stdout, /PRODUCT-SPEC-MARKER/, 'the old file is not sent');
  assert.doesNotMatch(p.stdout, MENTION);
  assert.doesNotMatch(p.stdout, /\{\{PRODUCT\}\}/, 'no unfilled placeholder');
  assert.match(p.stdout, /Export bookings as CSV/, 'the ticket is still there');
  assert.match(p.stdout, /\+change/, 'the diff is still there');
  // The same through speck review, which records a round from a verdict with no product_md.
  assert.equal(r.review(verdict).status, 10);
  const [sent] = r.prompts();
  assert.doesNotMatch(sent, /PRODUCT-SPEC-MARKER/);
  assert.doesNotMatch(sent, MENTION);
});

test('0068 AC2: later rounds, including a rebuilt round-1 prompt, have no product.md content or check', () => {
  const r = reviewRepo();
  assert.equal(r.review(verdict).status, 10);
  r.fix('second\n');
  assert.equal(r.review(verdict).status, 10);
  // Without the saved round-1 prompt, it's rebuilt from the round-1 commit, which has speck/product.md.
  fs.rmSync(r.at('speck/.cache'), { recursive: true, force: true });
  r.fix('third\n');
  assert.equal(r.review(verdict).status, 11);
  const sent = r.prompts();
  assert.equal(sent.length, 3);
  for (const [i, p] of sent.entries()) {
    assert.doesNotMatch(p, /PRODUCT-SPEC-MARKER/, `round ${i + 1}`);
    assert.doesNotMatch(p, MENTION, `round ${i + 1}`);
  }
  assert.match(sent[2], /# Earlier review rounds/, 'round 3 has the history');
});

test('0068 AC2 (F1): a round-1 prompt saved before this change is rebuilt for later rounds, keeping its test output', () => {
  const r = reviewRepo();
  const tests = r.at('../tests-0068.txt');
  fs.writeFileSync(tests, '# saved-tests-marker\n```\nfenced line\n```\n');
  assert.equal(r.review(verdict, `--tests=${tests}`).status, 10);
  // Make the saved copy look like one from an older speck: the spec check, the spec itself and the old schema field.
  const file = r.at('speck/.cache/0001/round-1.prompt.md');
  const now = fs.readFileSync(file, 'utf8');
  assert.match(now, /# saved-tests-marker/);
  const legacy = now
    .replace('\n## Severity', '5. **Living spec.** If `speck/product.md` was changed, check it. LEGACY-CHECK-MARKER\n\n## Severity')
    .replace('## Diff against', '## Living spec (speck/product.md)\n\nLEGACY-SPEC-MARKER\n\n## Diff against')
    .replace('"escalation_question",', '"product_md",\n    "escalation_question",');
  assert.notEqual(legacy, now);
  fs.writeFileSync(file, legacy);
  r.fix('second\n');
  assert.equal(r.review(verdict).status, 10);
  const later = r.prompts()[1];
  const history = later.indexOf('# Earlier review rounds');
  assert.ok(history > 0);
  assert.doesNotMatch(later, /LEGACY-(SPEC|CHECK)-MARKER/);
  assert.doesNotMatch(later.slice(0, history), MENTION, 'the resent round-1 prompt has no spec, check or schema field');
  assert.equal(later.slice(0, history).trimEnd(), now.trimEnd(), 'rebuilt as round 1 was sent, test output included');
  // A saved copy from this version is still resent exactly as it was.
  fs.writeFileSync(file, `${now.trimEnd()}\nCURRENT-COPY-MARKER\n`);
  r.fix('third\n');
  assert.equal(r.review(verdict).status, 11);
  assert.ok(r.prompts()[2].startsWith(`${now.trimEnd()}\nCURRENT-COPY-MARKER`));
});

test('0068 AC2: the review summary has no product.md line, and a stored round with product_md still shows', () => {
  const r = reviewRepo();
  assert.equal(r.review(verdict).status, 10);
  // A round stored before this change, with a product_md field, recorded by another reviewer.
  const old = r.at('../old-verdict.json');
  fs.writeFileSync(old, JSON.stringify({ ...verdict, product_md: { accurate: false, note: 'OLD-NOTE-MARKER' } }));
  const rec = r.run('record', '1', old, '--reviewer=claude-subagent');
  assert.equal(rec.status, 10, rec.stderr);
  const t = fs.readFileSync(r.at('speck/tickets/0001-export.md'), 'utf8');
  assert.equal(ticketRounds(t).rounds[1].verdict.product_md.note, 'OLD-NOTE-MARKER', 'the old field is kept as it was');
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /### Review history/);
  assert.doesNotMatch(pack.stdout, MENTION);
  assert.doesNotMatch(pack.stdout, /OLD-NOTE-MARKER/);
  assert.doesNotMatch(pack.stderr, /    at /);
});

// Every file under a folder, as paths relative to the repo.
const filesIn = dir => fs.readdirSync(path.join(ROOT, dir), { recursive: true, withFileTypes: true })
  .filter(e => e.isFile()).map(e => path.relative(ROOT, path.join(e.parentPath ?? e.path, e.name)));
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('0068 AC3: no skill, template or top-level doc mentions product.md or a living spec', () => {
  const files = [...filesIn('skills'), ...filesIn('templates'), 'README.md', 'AGENTS.md', 'docs/brief.md', 'docs/HANDOFF.md'];
  assert.ok(files.length > 10);
  const hits = files.filter(f => MENTION.test(read(f)));
  assert.deepEqual(hits, []);
});

test('0068 AC3: the build skill has no step to update a spec', () => {
  const md = read('skills/speck-build/SKILL.md');
  assert.doesNotMatch(md, /\bspec\b/i);
  assert.doesNotMatch(md, /Current capabilities/);
});

test('0068 AC3: the capture and ticket overlap checks compare against idea notes and tickets only', () => {
  const capture = read('skills/speck-capture/SKILL.md');
  const check = (capture.split('## Check for overlap first')[1] || '').split('\n## ')[0];
  assert.ok(check, 'capture still has its overlap check');
  for (const where of ['`speck/ideas/`', '`speck/ideas/done/`', '`speck/tickets/`', '`speck/tickets/done/`']) assert.ok(check.includes(where), `capture checks ${where}`);
  const ticket = read('skills/speck-ticket/SKILL.md');
  const step = ticket.split('\n').find(l => l.includes('**Check for overlap.**'));
  assert.ok(step, 'ticket still has its overlap step');
  for (const where of ['`speck/ideas/`', '`speck/ideas/done/`', '`speck/tickets/`', '`speck/tickets/done/`']) assert.ok(step.includes(where), `ticket checks ${where}`);
  for (const text of [check, step, ticket]) assert.doesNotMatch(text, MENTION);
});

test('0068 AC4: speck/product.md is gone from this repo and no test reads it', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'speck', 'product.md')));
  const self = path.join('test', 'product-0068.test.mjs');
  const others = filesIn('test').filter(f => f.endsWith('.mjs') && f !== self);
  assert.ok(others.length > 10);
  assert.deepEqual(others.filter(f => /product\.md/.test(read(f))), []);
});
