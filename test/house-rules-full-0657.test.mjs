// Full suite only: it runs the panel's house-rule files, which start real panels, twice in a copy of the repo.
// 0657 AC3: a change that breaks one of the panel's house rules fails a build's `speck test --files` and the quick run
// each ship waits for, with any other test file.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLI, env, gIn } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = ['test/panel-0161.test.mjs', 'test/panel-0427.test.mjs'];

// A committed copy of the panel and its rule files, with one other test file, its commands.checks listing the rule
// files, and a stylesheet rule that sets 13 px text and one that fills with a colour but sets no text colour.
function brokenCopy() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'house-rules-0657-')));
  for (const f of ['scripts', 'skills', 'templates', 'test/support', ...RULES]) fs.cpSync(path.join(ROOT, f), path.join(dir, f), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), fs.readFileSync(path.join(ROOT, 'package.json')));
  fs.writeFileSync(path.join(dir, 'test', 'other.test.mjs'), "import { test } from 'node:test';\ntest('other passes', () => {});\n");
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), [
    'base_branch: main', 'commands:', '  test: node test/support/suite.mjs --quick', '  test_files: node --test {files}',
    `  checks: [${RULES.join(', ')}]`, '',
  ].join('\n'));
  fs.appendFileSync(path.join(dir, 'templates', 'panel-cards.css'), '\n.house-rule-13 { font-size: 13px; }\n.house-rule-fill { background: var(--accent); }\n');
  gIn(dir, 'init', '-q', '-b', 'main'); gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'broken');
  return dir;
}
const cleanEnv = () => { const e = { ...env }; delete e.NODE_TEST_CONTEXT; return e; };
const failed = (out, name) => assert.match(out, new RegExp(`^not ok \\d+ - ${name}`, 'm'), `${name} fails`);

test('0657 AC3: 13 px text, or a fill with no text colour of its own, fails speck test --files with another file, and the quick run', () => {
  const dir = brokenCopy();
  for (const args of [[CLI, 'test', '--files', 'test/other.test.mjs'], ['test/support/suite.mjs', '--quick']]) {
    const r = spawnSync(process.execPath, args, { cwd: dir, env: cleanEnv(), encoding: 'utf8', timeout: 300000 });
    const out = r.stdout + r.stderr;
    assert.notEqual(r.status, 0, `${args.join(' ')} fails:\n${out}`);
    failed(out, '0427 AC1: no text is set at 13 px');
    failed(out, '0161 AC1: a background that isn');
    assert.equal(out.match(/^not ok \d+ - /gm)?.length, 2, `only the two broken rules fail:\n${out}`);
    assert.match(out, /^ok \d+ - other passes/m, 'the other file ran too');
  }
});
