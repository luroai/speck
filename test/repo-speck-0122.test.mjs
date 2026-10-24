import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/panel.mjs';
import { filesNaming } from './support/private-words.mjs';
import { readsRepoSpeck, MARKER } from './support/repo-speck.mjs';

// ---------- 0122: speck's tests don't read this repo's own speck/ folder ----------

// Every test file and support module, as paths relative to the repo.
const testSources = () => fs.readdirSync(path.join(ROOT, 'test'), { recursive: true, withFileTypes: true })
  .filter(e => e.isFile() && e.name.endsWith('.mjs')).map(e => path.relative(ROOT, path.join(e.parentPath ?? e.path, e.name)));

const repoWith = (files) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0122-repo-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  for (const [f, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true });
    fs.writeFileSync(path.join(repo, f), body);
  }
  spawnSync('git', ['add', '-A'], { cwd: repo });
  return repo;
};

test('0122 AC1: no test file or support module builds a path into this repo\'s speck/ folder', () => {
  const files = testSources();
  assert.ok(files.length > 50 && files.some(f => f.startsWith(path.join('test', 'support'))), 'scans the tests and their support modules');
  const found = files.flatMap(f => readsRepoSpeck(fs.readFileSync(path.join(ROOT, f), 'utf8')).map(l => `${f}:${l}`));
  assert.deepEqual(found, [], `tests reading this repo's speck/ folder:\n${found.join('\n')}`);
});

test('0122 AC2: the private-words check skips every file under speck/ and still scans every other tracked file', () => {
  const repo = repoWith({
    'speck/config.yml': 'zorblat\n', 'speck/tickets/done/0001-x.md': 'zorblat\n', 'speck/ideas/done/note.md': 'zorblat\n',
    'README.md': 'Zorblat\n', 'docs/speck/x.md': 'zorblat\n', 'speckle.md': 'zorblat\n', 'test/a.mjs': 'zorblat\n', 'clean.md': 'fine\n',
  });
  assert.deepEqual(filesNaming(['zorblat'], repo).sort(), ['README.md', 'docs/speck/x.md', 'speckle.md', 'test/a.mjs']); // a made-up repo's README
});

test('0122 AC3: the check catches a path to this repo\'s speck/ folder, built from its root, through a helper or relative, on one line or several', () => {
  const S = 'speck'; // kept out of the samples' text, so this file doesn't trip its own check
  for (const src of [
    `fs.readFileSync(path.join(ROOT, '${S}', 'config.yml'), 'utf8')`,
    `fs.readdirSync(path.join(ROOT, "${S}/tickets/done"))`,
    `fs.existsSync(path.join(REPO, \`${S}/tickets/0001-a.md\`))`,
    `fs.readFileSync(ROOT + '/${S}/config.yml')`,
    `read(ROOT, '${S}/ideas/note.md')`,
    `const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');\nread('${S}/ideas/done/x.md');`,
    `const filesIn = dir => fs.readdirSync(path.join(ROOT, dir), { recursive: true });\nfilesIn('${S}');`,
    `fs.readFileSync(path.join(ROOT,\n  '${S}', 'config.yml'), 'utf8')`,
    `const read = f =>\n  fs.readFileSync(path.join(ROOT, f), 'utf8');\nread(\n  '${S}/config.yml');`,
    `fs.readFileSync('${S}/config.yml', 'utf8')`,
    `fs.readdirSync(\n  './${S}/tickets/done')`,
    `fs.readFileSync(path.resolve('${S}', 'config.yml'))`,
  ]) assert.notDeepEqual(readsRepoSpeck(src), [], src);
});

test('0122 AC3: the check lets through temporary repos, speck\'s own folders and the CLI', () => {
  const S = 'speck';
  for (const src of [
    `fs.readFileSync(path.join(r.dir, '${S}', 'config.yml'), 'utf8')`,
    `r.read('${S}/tickets/0001-a.md')`,
    `const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');\nread(dir, '${S}/config.yml');`,
    `const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');\nread('docs/brief.md');\nread('${S}le.md');`,
    `const CLI = path.join(ROOT, '.${S}', 'scripts', '${S}.mjs');`,
    `path.join(ROOT, 'skills', '${S}-build', 'SKILL.md')`,
    `fs.readFileSync(path.join(ROOT, 'scripts', '${S}.mjs'))`,
    `fs.readFileSync(path.join(r.dir,\n  '${S}', 'config.yml'), 'utf8')`,
    `assert.equal(file, path.join('${S}', 'tickets', '0001-a.md'));`,
    `fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'));\nconst t = '${S}/tickets/0001-a.md';`,
  ]) assert.deepEqual(readsRepoSpeck(src), [], src);
});

test('0122 AC3: only a line marked as reading a temporary repo is let through, and only that line', () => {
  const S = 'speck';
  const src = `fs.readFileSync('${S}/config.yml'); // ${MARKER}\nfs.readFileSync('${S}/config.yml');`;
  assert.deepEqual(readsRepoSpeck(src), [`2: fs.readFileSync('${S}/config.yml');`]);
});

test('0122 AC3: each reader found is reported with its line number and text', () => {
  const S = 'speck';
  assert.deepEqual(readsRepoSpeck(`const a = 1;\nconst b = fs.readFileSync(path.join(ROOT, '${S}', 'config.yml'));\n`),
    [`2: const b = fs.readFileSync(path.join(ROOT, '${S}', 'config.yml'));`]);
  assert.deepEqual(readsRepoSpeck(`const a = 1;\nconst b = fs.readFileSync(path.join(ROOT,\n  '${S}', 'config.yml'));\n`),
    ['2: const b = fs.readFileSync(path.join(ROOT,'], 'a path spread over lines is reported where it starts');
});
