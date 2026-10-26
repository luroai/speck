import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0491: test documents' facts in the brief, not the README ----------

const SELF = 'test/docs-0491.test.mjs';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ----- AC1 -----

// The skill and the prompt are instructions to agents, so their wording is checked. The brief is a document, so only
// the names its "Criteria about documents" paragraph gives are: how it reads is checked by review.
const INSTRUCTIONS = ['skills/speck-ticket/SKILL.md', 'templates/reviewer-prompt.md'];
const TESTED = ['setup prompt', "status line's version", 'demo pictures', 'links resolve'];

test('0491 AC1: the ticket skill and the reviewer prompt mark README facts (checked by review), naming the four that are tested', () => {
  for (const f of INSTRUCTIONS) {
    const text = read(f);
    assert.match(text, /a fact in the README ends with `\(checked by review\)`/, f);
    for (const tested of TESTED) assert.ok(text.includes(tested), `${f}: ${tested}`);
    assert.match(text, /any other document, such as the brief, `docs\/` or the changelog, (has no marker and )?is (still )?tested/, f);
  }
});

test('0491 AC1: the brief\'s Criteria about documents names the README, (checked by review), the four that are tested and the other documents', () => {
  const para = read('docs/brief.md').split('\n').find(l => l.includes('**Criteria about documents.**'));
  assert.ok(para, 'the brief has the paragraph');
  for (const name of ['README', '`(checked by review)`', ...TESTED, 'brief', '`docs/`', 'changelog']) assert.ok(para.includes(name), name);
});

// ----- AC2 -----

// A test that names a made-up repo's README.md on a line of its own marks the line with this.
const MADE_UP = "a made-up repo's README";

// The lines of a test's source that name this repo's README.md in a string, as a file to read: in any quotes, as
// README.md, ./README.md or ../README.md, leaving out comments. A made-up repo's README.md, given as an object's key
// (a file written into a temporary repo) or on a line marked as one, doesn't count, nor does a README.md in a folder.
function readmeLines(src) {
  return src.split('\n').map((line, i) => ({ n: i + 1, line })).filter(({ line }) => {
    if (line.includes(MADE_UP)) return false;
    const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, '').replace(/\s\/\/\s.*$/, '');
    return /(['"`])(?:\.{1,2}\/)?README\.md\1(?!\s*:)/.test(code);
  }).map(({ n, line }) => `${n}: ${line.trim()}`);
}

// The test files allowed to read the README, each with what it checks there. A fact anywhere else in the README is
// checked by review.
const SETUP = 'the setup prompt', VERSION = "the status line's version and the setup prompt"; // and nothing else in it
const ALLOWED = {
  'test/readme-0089.test.mjs': SETUP,
  'test/readme-0250.test.mjs': SETUP,
  'test/setup-0107.test.mjs': SETUP,
  'test/install-0253.test.mjs': SETUP,
  'test/readme-0249.test.mjs': 'the <picture> block and its images',
  'test/readme-links-0491.test.mjs': "that the README's links and anchors resolve",
  ...Object.fromEntries(['0092', '0106', '0210', '0226', '0236', '0243', '0248', '0254', '0282', '0297', '0298', '0307',
    '0329', '0336', '0339', '0343', '0346', '0360', '0367', '0375', '0380', '0394', '0452', '0507', '0515'].map(id => [`test/release-${id}.test.mjs`, VERSION])),
};

const testSources = () => ['test', 'test/support'].flatMap(dir => fs.readdirSync(path.join(ROOT, dir))
  .filter(f => f.endsWith('.mjs')).map(f => `${dir}/${f}`)).filter(f => f !== SELF);

test('0491 AC2: the check finds each way a test names the README, and not a made-up repo\'s', () => {
  const found = src => readmeLines(src).length > 0;
  for (const src of [
    "const r = read('README.md');",
    'fs.readFileSync(path.join(ROOT, "README.md"), "utf8")',
    "fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8')",
    "for (const f of ['README.md', 'docs/brief.md']) check(f);",
    'const f = `./README.md`;',
  ]) assert.ok(found(src), src);
  for (const src of [
    "// read('README.md') in a comment",
    "const wt = branch(r, { 'README.md': 'changed\\n' });",
    "make(dir, 'openspec/changes/README.md');",
    `assert.deepEqual(files, ['README.md']); // ${MADE_UP}`,
    'assert.match(desc, /README/);',
  ]) assert.ok(!found(src), src);
});

test('0491 AC2: only the allowed test files read README.md', () => {
  const reading = {};
  for (const f of testSources()) {
    const lines = readmeLines(read(f));
    if (lines.length) reading[f] = lines;
  }
  const extra = Object.keys(reading).filter(f => !ALLOWED[f]);
  assert.deepEqual(extra, [], `test files reading README.md that aren't allowed:\n${extra.map(f => `${f}\n  ${reading[f].join('\n  ')}`).join('\n')}`);
  // The list stays true: every file on it is there and still reads the README.
  const stale = Object.keys(ALLOWED).filter(f => !reading[f]);
  assert.deepEqual(stale, [], 'allowed files that no longer read README.md');
});

// ----- AC3 -----

// The setting names and commands each removed README check looked for, now checked in the brief.
const MOVED = {
  'release-0226': ['speck run', 'speck pause <id>'],
  'release-0282': ['speck config show', '--machine', 'commands.checks', 'speck/.cache/machine/config.yml'],
  'release-0297': ['`speck agents', 'reviewer: claude', 'speck config set builder', '`codex`', '`cursor`'],
  'release-0298': ['`watch: fix`', '`watch_agent`', '`watch_model`', '`watch_effort`', 'ship_mode: pr'],
  'readme-0250 AC2': ['/speck-capture', '/speck-ticket', 'speck set <id> status ready', 'after:', 'speck panel', '/speck-build',
    '/speck-review', 'speck run', 'max_parallel_builds', 'speck pack <id>', '/speck-ship', 'auto_ship', 'auto_ship_risk'],
  'readme-0250 AC3': ['--type=fix', 'speck set <fix-id> status ready', '`draft`', '`blocked`', 'speck/ideas/', 'Status: inbox',
    '## Blocked question', '/speck-build <id>', 'speck merge-check <id>', 'max_merge_rounds', 'speck panel [--port <n>] [--url https://<hostname>]',
    '## Review rounds', '## Delivery log'],
  'readme-0250 AC4': ['max_review_rounds', 'escalate_after_repeat_disputes', '`blocking`', '`minor`', '`fixed`', '`disputed`', '`needs_pm`',
    '## Review log', 'speck/.cache/', 'speck/tickets/done/', 'speck test --recorded', 'Failing before this build', 'speck test --files', 'speck ship'],
  'readme-0256': ['node .speck/scripts/speck.mjs panel', 'http://127.0.0.1:4777', 'node .speck/scripts/speck.mjs <command>'],
  'agents-0398': ['speck agents add', 'speck agents remove', 'speck/.cache/machine/agents.json'],
  'builder-model-0311': ['speck config set builder <name>', '`builder_model`', '`speck agents'],
  'builder-switch-0293': ['speck config set builder <name>', '--replace'],
  'keys-0389': ['speck/.cache/machine/keys.json', 'speck keys set deepseek', 'speck keys remove deepseek'],
  'core 0014': ['.agents/skills/', '.claude/skills/'],
  'providers-0401': ['speck/.cache/machine/providers.json'],
  'review-provider-0390': ['reviewer: deepseek', 'speck keys set deepseek'],
  'run-provider-0391': ['`builder: deepseek`'],
  'settings-builder-effort-0402': ['`builder_effort`'],
};

test('0491 AC3: the brief names every setting and command the removed README checks looked for', () => {
  const brief = read('docs/brief.md');
  const missing = Object.entries(MOVED).flatMap(([from, names]) => names.filter(n => !brief.includes(n)).map(n => `${from}: ${n}`));
  assert.deepEqual(missing, []);
});

test('0491 AC3: the brief gives the default it names for escalate_after_repeat_disputes, as a new project gets it', () => {
  const value = read('templates/config.yml').match(/^\s*escalate_after_repeat_disputes: (\d+)/m)?.[1];
  assert.ok(value, 'templates/config.yml sets it');
  assert.ok(read('docs/brief.md').includes(`\`limits.escalate_after_repeat_disputes\`, default ${value}`));
});
