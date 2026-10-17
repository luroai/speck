import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { LATEST, releaseMismatches, setupPrompt, setupPromptProblems } from './support/release.mjs';

// ---------- 0253: make every speck install command use the latest release ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const prompt = () => setupPrompt(read('README.md')) || '';
// Every npx command for speck in a text, as written.
const npxCommands = s => [...s.matchAll(/npx (?:-y )?'?github:luroai\/speck[^\s`]*/g)].map(m => m[0]);

test('0253 AC1: the setup prompt runs init at the latest release, quoted, naming no fixed release', () => {
  assert.equal(LATEST, "npx 'github:luroai/speck#semver:*'");
  const p = prompt();
  assert.ok(p.includes(`\`${LATEST} init\``), p);
  assert.doesNotMatch(p, /#v\d/);
  assert.deepEqual(npxCommands(p), [LATEST]);
});

test('0253 AC2: the README\'s command to run in a terminal installs the latest release', () => {
  assert.match(read('README.md'), /```bash\nnpx 'github:luroai\/speck#semver:\*' init\n```/);
});

test('0253 AC2: the brief gives the latest release\'s init and detect commands', () => {
  const brief = read('docs/brief.md');
  assert.ok(brief.includes(`\`${LATEST} init\``), 'speck init');
  assert.ok(brief.includes(`\`${LATEST} detect\``), 'speck detect before speck is installed');
});

test('0253 AC2: the message for a copy that can\'t install itself gives the latest release', () => {
  // test/luro-0082.test.mjs runs a copy that can't install itself and checks the message it prints.
  assert.ok(read('scripts/install.mjs').includes(`can't install itself. Run \`${LATEST} init\` instead.`));
});

test('0253 AC2: /speck-setup runs speck through the latest release before it is installed', () => {
  const s = read('skills/speck-setup/SKILL.md');
  assert.ok(s.includes(`use \`${LATEST}\` instead`));
  assert.ok(s.includes(`\`${LATEST} detect\``));
  assert.ok(s.includes(`run \`${LATEST} init\``));
});

test('0253 AC2: every speck npx command outside the changelog and release notes uses the latest release, quoted', () => {
  const files = ['README.md', 'docs/brief.md', 'scripts/install.mjs', ...fs.readdirSync(path.join(ROOT, 'skills')).map(d => `skills/${d}/SKILL.md`)];
  for (const f of files) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    for (const c of npxCommands(read(f))) assert.equal(c, LATEST, `${f}: ${c}`);
  }
});

test('0253 AC2: the changelog and release notes keep each release\'s fixed version', () => {
  assert.ok(read('CHANGELOG.md').includes('`npx github:luroai/speck#v0.5.3 init`'));
  assert.ok(read('docs/releases/v0.5.3.md').includes('npx github:luroai/speck#v0.5.3 init'));
  assert.doesNotMatch(read('CHANGELOG.md') + read('docs/releases/v0.5.3.md'), /semver/);
});

test('0253 AC4: the setup prompt check passes on the README and on the quoted latest release', () => {
  assert.deepEqual(setupPromptProblems(read('README.md')), []);
  assert.deepEqual(setupPromptProblems("## Get started\n\n```text\nThen run `npx 'github:luroai/speck#semver:*' init` and follow speck-setup\n```\n"), []);
});

test('0253 AC4: the setup prompt check fails on a fixed release, no release, an unquoted one or no prompt', () => {
  const at = cmd => `## Get started\n\n\`\`\`text\nThen run \`${cmd} init\` and follow speck-setup\n\`\`\`\n`;
  for (const cmd of ['npx github:luroai/speck#v0.5.3', "npx 'github:luroai/speck#v0.5.3'", 'npx github:luroai/speck', 'npx github:luroai/speck#semver:*', 'npx "github:luroai/speck#semver:*"']) {
    assert.equal(setupPromptProblems(at(cmd)).length, 1, cmd);
  }
  // The latest release elsewhere doesn't hide a fixed one beside it in the prompt.
  assert.equal(setupPromptProblems(at(`${LATEST} init\` or \`npx github:luroai/speck#v0.5.3`)).length, 1);
  assert.equal(setupPromptProblems('nothing here').length, 1);
});

test('0253 AC4: the version check covers package.json and the newest changelog section, not the prompt', () => {
  const changelog = v => `# Changelog\n\n## ${v} · 1 January 2027\n\n### A\n\n- a\n`;
  assert.deepEqual(releaseMismatches({ pkg: JSON.stringify({ version: '1.2.3' }), changelog: changelog('1.2.3') }), []);
  assert.equal(releaseMismatches({ pkg: JSON.stringify({ version: '1.2.4' }), changelog: changelog('1.2.3') }).length, 1);
  assert.deepEqual(releaseMismatches({ pkg: read('package.json'), changelog: read('CHANGELOG.md') }), []);
});

test('0253 AC4: no release test still checks the prompt names the current version', () => {
  for (const f of fs.readdirSync(path.join(ROOT, 'test')).filter(f => f.endsWith('.test.mjs') && f !== 'install-0253.test.mjs')) {
    const t = read(`test/${f}`);
    assert.doesNotMatch(t, /speck#v\$\{/, f);
    assert.doesNotMatch(t, /speck#v\\d\+/, f);
    assert.doesNotMatch(t, /speck#v\(\[/, f);
  }
});

test('0253 AC3: the brief names the files the version check reads', () => {
  for (const s of ['`package.json`', '`CHANGELOG.md`']) assert.ok(read('docs/brief.md').includes(s), s);
});
