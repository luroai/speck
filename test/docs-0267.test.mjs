import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT } from './support/speck.mjs';
import { STARTS } from './support/heavy.mjs';

// ---------- 0267: remove the tests that pin documents' wording ----------

const SELF = 'test/docs-0267.test.mjs';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const releaseNotes = () => fs.readdirSync(path.join(ROOT, 'docs', 'releases')).map(f => `docs/releases/${f}`);

// Names a document: the README, the brief, the changelog or the release notes.
const DOC = /README|brief\.md|'brief|CHANGELOG|docs\/releases|'docs'/;

// The test files that name a document, each with the names of the tests in it that do, or null to run the whole file
// when one is named outside any test, in a helper its tests share. The heavy files (heavy.mjs), which start a real
// panel, browser or `speck run`, are left out to keep this quick: what they check in documents is a name or a setting.
function docTests() {
  const out = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs')).map(f => `test/${f}`)) {
    if (f === SELF || STARTS.test(read(f)) || !DOC.test(read(f))) continue;
    const outside = [], names = [];
    let cur = null;
    for (const line of read(f).split('\n')) {
      const start = !cur && line.match(/^test\((['"`])((?:\\.|(?!\1).)*)\1/);
      if (start) cur = { name: start[2].replace(/\\(.)/g, '$1'), lines: [] };
      (cur ? cur.lines : outside).push(line);
      if (cur && /^\}\)*;$/.test(line)) { if (DOC.test(cur.lines.join('\n'))) names.push(cur.name); cur = null; }
    }
    out.push({ file: f, names: DOC.test(outside.join('\n')) ? null : names });
  }
  return out;
}

// A copy of the checkout's files, committed in a repo of its own, with `docs` written over them.
function copyWith(docs) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0267-'));
  const files = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' }).stdout.split('\0').filter(Boolean);
  for (const f of files) {
    const from = path.join(ROOT, f), to = path.join(dir, f);
    const stat = fs.lstatSync(from, { throwIfNoEntry: false });
    if (!stat) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (stat.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(from), to);
    else fs.copyFileSync(from, to);
  }
  for (const [f, text] of Object.entries(docs)) fs.writeFileSync(path.join(dir, f), text);
  const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...a], { cwd: dir, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-qm', 'copy');
  return dir;
}

// Runs `files` with node --test in `dir`, only the tests named `names` when given, resolving to the exit code, how many
// tests passed and the names of those that failed. The run is a test run of its own, not part of this one's. One still
// going after 5 minutes is ended, and fails.
function runIn(dir, files, names) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const only = names ? [`--test-name-pattern=^(?:${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`] : [];
  return new Promise(resolve => {
    const child = spawn(process.execPath, ['--test', '--test-reporter=tap', ...only, ...files], { cwd: dir, env, timeout: 300000, killSignal: 'SIGKILL' });
    let stdout = '', stderr = '';
    child.stdout.setEncoding('utf8').on('data', d => { stdout += d; });
    child.stderr.setEncoding('utf8').on('data', d => { stderr += d; });
    child.on('error', e => { stderr += e.message; });
    child.on('close', status => {
      const failed = [...stdout.matchAll(/^\s*not ok \d+ - (.*)$/gm)].map(m => m[1]);
      const passed = Number(stdout.match(/^# pass (\d+)$/m)?.[1] || 0);
      resolve({ status, passed, failed, out: stdout + stderr });
    });
  });
}

// Runs the tests docTests() finds in `dir`: whole files in one run, the chosen tests of the others in a second, both at
// once (0429).
async function runDocTests(dir) {
  const all = docTests();
  const parts = all.filter(t => t.names?.length);
  const [whole, some] = await Promise.all([runIn(dir, all.filter(t => !t.names).map(t => t.file)),
    runIn(dir, parts.map(t => t.file), parts.flatMap(t => t.names))]);
  return { files: all.length, status: whole.status || some.status, passed: whole.passed + some.passed,
    failed: [...whole.failed, ...some.failed], out: whole.out + some.out };
}

// ----- rewording and reordering, keeping every fact -----

// Changes words in prose, leaving code spans, link targets and HTML alone.
const reword = line => line.split(/(`[^`]*`|\]\([^)]*\)|<[^>]*>)/).map((part, i) => i % 2 ? part : part
  .replace(/\bthe\b/g, 'this').replace(/\band\b/g, 'plus').replace(/\ba\b/g, 'one').replace(/\bis\b/g, 'stays')).join('');

// Splits markdown into blocks separated by blank lines, keeping each fenced code block whole.
function blocks(text) {
  const out = [];
  let cur = [], fenced = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && !line.trim() && !line.startsWith('```')) { if (cur.length) out.push(cur.join('\n')); cur = []; }
    else cur.push(line);
  }
  if (cur.length) out.push(cur.join('\n'));
  return out;
}
const isProse = b => /^[A-Za-z*_[]/.test(b) && !/^\* /.test(b);
const isHeading = b => /^#{1,6} /.test(b);

// `text` with every paragraph of prose given new opening words and reworded, a word added to each heading, and in
// each part under a heading, the first two paragraphs of prose swapped. With `reorder`, the `##` sections come in
// reverse order. Code blocks, HTML, lists, tables and quotes keep their words; prose keeps its code spans and links.
function mutate(text, { headings = true, reorder = false } = {}) {
  const parts = [[]];
  for (const b of blocks(text)) {
    if (/^## /.test(b)) parts.push([]);
    parts.at(-1).push(b);
  }
  const done = parts.map(part => {
    const out = part.map(b => isHeading(b) ? (headings && !/^# /.test(b) ? `${b} for you` : b)
      : isProse(b) ? `In short, ${b.split('\n').map(reword).join('\n')}`
      : b.startsWith('```') || b.startsWith('<') ? b
      : b.split('\n').map(reword).join('\n'));
    const prose = part.map((b, i) => (isProse(b) ? i : -1)).filter(i => i >= 0);
    if (prose.length >= 2) [out[prose[0]], out[prose[1]]] = [out[prose[1]], out[prose[0]]];
    return out;
  });
  const [intro, ...sections] = done;
  const ordered = reorder ? [intro, ...sections.reverse()] : [intro, ...sections];
  return ordered.flat().join('\n\n') + '\n';
}

test('0267 AC1, AC3: rewording and reordering the README, the brief, the changelog and the release notes fails no test', async () => {
  const docs = {
    'README.md': mutate(read('README.md'), { reorder: true }),
    'docs/brief.md': mutate(read('docs/brief.md'), { reorder: true }),
    // Each version's heading names its version, and the newest comes first: facts the version check reads.
    'CHANGELOG.md': mutate(read('CHANGELOG.md'), { headings: false }),
  };
  for (const f of releaseNotes()) docs[f] = mutate(read(f));
  for (const [f, text] of Object.entries(docs)) assert.notEqual(text, read(f), `${f} was changed`);
  const r = await runDocTests(copyWith(docs));
  assert.ok(r.files >= 20, `found the test files that read documents: ${r.files}`);
  assert.ok(r.passed >= 100, `the tests ran: ${r.passed} passed\n${r.out.slice(-2000)}`);
  assert.deepEqual(r.failed, [], r.out.slice(-4000));
  assert.equal(r.status, 0, r.out.slice(-4000));
});

test('0267 AC3: the rewording rewords the opening and every section\'s first sentence, whatever its words, and swaps two paragraphs', () => {
  const doc = [
    '# speck', '**Tag line.**', 'Plain line names `npx x init` and [a link](https://example.com/the).', 'Second paragraph.',
    '## One', 'Opening sentence with no words to swap. Next sentence.', '- a list item', 'Later paragraph.',
    '## Two', '```bash\nnpx the init\n```', '| `cmd` | does a thing |', 'Only paragraph.',
  ].join('\n\n') + '\n';
  assert.equal(mutate(doc, { reorder: true }), [
    '# speck', 'In short, Plain line names `npx x init` plus [one link](https://example.com/the).', 'In short, **Tag line.**', 'In short, Second paragraph.',
    '## Two for you', '```bash\nnpx the init\n```', '| `cmd` | does one thing |', 'In short, Only paragraph.',
    '## One for you', 'In short, Later paragraph.', '- one list item', 'In short, Opening sentence with no words to swap. Next sentence.',
  ].join('\n\n') + '\n');
  // Without reordering, the sections stay in place; the changelog keeps its headings.
  assert.match(mutate(doc), /## One for you[\s\S]*## Two for you/);
  assert.match(mutate(doc, { headings: false }), /^## One$[\s\S]*^## Two$/m);
});

test('0267 AC2: the tests that check facts in documents still catch a wrong command, version, link or name', async () => {
  const readme = read('README.md');
  const version = JSON.parse(read('package.json')).version;
  const broken = readme
    .replaceAll("npx 'github:luroai/speck#semver:*'", 'npx github:luroai/speck#v0.1.0')
    .replaceAll('[LICENSE](LICENSE)', 'LICENSE')
    .replaceAll(version, '9.9.9')
    .replaceAll('`/speck-setup`', '/speck-start');
  const r = await runIn(copyWith({ 'README.md': broken }),
    ['test/install-0253.test.mjs', 'test/licence-0090.test.mjs', 'test/release-0248.test.mjs', 'test/setup-0088.test.mjs']);
  assert.notEqual(r.status, 0);
  for (const name of [
    /^0253 AC1: the setup prompt runs init at the latest release/, // a command
    /^AC2: the README links to LICENSE/, // a link
    /^0248 AC3: the README and the brief name the current version/, // a version
    /^0088 AC1: the README and the brief name \/speck-setup/, // a name
  ]) assert.ok(r.failed.some(t => name.test(t)), `${name} fails:\n${r.failed.join('\n')}`);
});
