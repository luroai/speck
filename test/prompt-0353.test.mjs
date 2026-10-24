// 0353: for a document task, the reviewer prompt names the document's folder in the main checkout's outputs/ and
// lists what's in it, and tells the reviewer to judge the criteria by reading it. A code ticket's prompt is unchanged.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewRepo, speck, ROOT } from './support/speck.mjs';
import { stripRounds } from '../scripts/review.mjs';
import { testOutput } from '../scripts/tap.mjs';

const docRepo = (output = 'memos/pricing/') => reviewRepo({ ticketFields: `kind: task\noutput: ${output}` });
const folder = r => path.join(fs.realpathSync(r.dir), 'outputs', 'memos', 'pricing') + path.sep;

test('0353 AC1: a document task\'s prompt names its folder\'s absolute path and lists every file in it', () => {
  const r = docRepo();
  fs.mkdirSync(path.join(r.dir, 'outputs', 'memos', 'pricing', 'drafts'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'outputs', 'memos', 'pricing', 'memo.md'), 'Prices go up.\n');
  fs.writeFileSync(path.join(r.dir, 'outputs', 'memos', 'pricing', 'drafts', 'first.md'), 'Draft.\n');
  fs.writeFileSync(path.join(r.dir, 'outputs', 'elsewhere.md'), 'Not this ticket\'s.\n');
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.ok(p.stdout.includes(folder(r)), 'the absolute path of the folder');
  assert.ok(p.stdout.includes('memo.md'));
  assert.ok(p.stdout.includes(path.join('drafts', 'first.md')), 'files in folders inside it too');
  assert.ok(!p.stdout.includes('elsewhere.md'), 'only this ticket\'s folder');
  assert.ok(p.stdout.indexOf(folder(r)) < p.stdout.indexOf('## Diff against'), 'before the diff');
});

test('0353 AC1: the prompt says when the folder is empty, or missing, and makes nothing', () => {
  const r = docRepo();
  const missing = r.run('prompt', '1');
  assert.equal(missing.status, 0, missing.stderr);
  assert.ok(missing.stdout.includes(folder(r)));
  assert.match(missing.stdout, /doesn't exist|missing/i);
  assert.ok(!fs.existsSync(path.join(r.dir, 'outputs')), 'speck prompt makes no folder');
  fs.mkdirSync(path.join(r.dir, 'outputs', 'memos', 'pricing'), { recursive: true });
  const empty = r.run('prompt', '1');
  assert.equal(empty.status, 0, empty.stderr);
  assert.ok(empty.stdout.includes(folder(r)));
  assert.match(empty.stdout, /empty/i);
});

test('0353 AC1: run from a worktree, the prompt names the folder in the main checkout', () => {
  const r = docRepo();
  r.git('checkout', '-q', 'main');
  const wt = `${r.dir}-wt`;
  assert.equal(r.git('worktree', 'add', '-q', wt, 'speck/0001-x').status, 0);
  fs.mkdirSync(path.join(r.dir, 'outputs', 'memos', 'pricing'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'outputs', 'memos', 'pricing', 'memo.md'), 'Prices go up.\n');
  const p = speck(wt, process.env, 'prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.ok(p.stdout.includes(folder(r)));
  assert.ok(p.stdout.includes('memo.md'));
  assert.ok(!fs.existsSync(path.join(wt, 'outputs')), 'nothing made in the worktree');
});

test('0353 AC1: a document task whose output fails lint gets no folder, and says why', () => {
  const r = docRepo('../escape');
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.ok(!p.stdout.includes(path.join(path.dirname(fs.realpathSync(r.dir)), 'escape')), 'no path outside outputs/');
  assert.match(p.stdout, /outputs\//);
});

test('0353 AC2: a document task\'s prompt tells the reviewer to read the document, cite passages and not count missing tests', () => {
  const r = docRepo();
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.match(p.stdout, /\ba task\b/i); // 0492: a task, not a document task
  assert.match(p.stdout, /cite/i);
  assert.match(p.stdout, /missing test/i);
});

test('0353 AC3: a code ticket\'s prompt is the template filled in, with nothing added', () => {
  const r = reviewRepo();
  fs.mkdirSync(path.join(r.dir, 'outputs'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'outputs', 'stray.md'), 'x\n');
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  const values = { TICKET: stripRounds(fs.readFileSync(r.ticketFile, 'utf8')), BASE: 'main', DIFF: r.run('diff', '1').stdout, TESTS: testOutput(undefined, '0001') };
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'reviewer-prompt.md'), 'utf8');
  const schema = fs.readFileSync(path.join(ROOT, 'templates', 'review-verdict.schema.json'), 'utf8');
  const expected = `${tpl.replace(/\{\{(TICKET|BASE|DIFF|TESTS)\}\}/g, (_, k) => values[k])}\n\nReturn ONLY a JSON object matching this schema:\n${schema}\n`;
  assert.equal(p.stdout, expected);
});

test('0353 AC1 self-check: with a response file, the document comes before the diff and the response before the test output', () => {
  const r = docRepo();
  const resp = path.join(r.dir, '..', `${path.basename(r.dir)}-response.md`);
  fs.writeFileSync(resp, 'Wrote memo.md.\n');
  const p = r.run('prompt', '1', `--response=${resp}`);
  assert.equal(p.status, 0, p.stderr);
  const at = s => p.stdout.indexOf(s);
  assert.ok(at(folder(r)) > at('## Ticket') && at(folder(r)) < at('## Diff against'));
  assert.ok(at('Wrote memo.md.') > at('## Diff against') && at('Wrote memo.md.') < at('## Test output (from the builder)'));
});

test('0353 AC1 self-check: a later review round lists the files in the folder as they are then', () => {
  const r = docRepo();
  assert.equal(r.run('review', '1').status, 10);
  fs.mkdirSync(path.join(r.dir, 'outputs', 'memos', 'pricing'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'outputs', 'memos', 'pricing', 'memo.md'), 'Prices go up.\n');
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('commit', '-qam', 'fix');
  assert.equal(r.run('review', '1').status, 10);
  const [first, second] = r.prompts();
  assert.match(first, /doesn't exist/);
  assert.ok(second.includes(folder(r)) && second.includes('memo.md'));
});

test('0353 AC1 F1: a folder with hundreds of files has every one listed', () => {
  const r = docRepo();
  const dir = path.join(r.dir, 'outputs', 'memos', 'pricing');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 250; i++) fs.writeFileSync(path.join(dir, `part-${i}.md`), 'x\n');
  const p = r.run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  for (let i = 0; i < 250; i++) assert.ok(p.stdout.includes(`\`part-${i}.md\``), `part-${i}.md is listed`);
  assert.doesNotMatch(p.stdout, /and \d+ more/);
});
