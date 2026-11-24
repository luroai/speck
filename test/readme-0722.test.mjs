import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';
import { readmeNpxProblems, setupPrompt } from './support/release.mjs';

// ---------- 0722: test the README's terminal install command ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ----- AC1 -----

test('0722 AC1: every speck npx command in the README matches the setup prompt\'s', () => {
  assert.deepEqual(readmeNpxProblems(read('README.md')), []);
});

test('0722 AC1: the check fails when a command outside the setup prompt differs', () => {
  const prompt = setupPrompt(read('README.md'));
  assert.ok(prompt, 'needs a real setup prompt as the base');
  const base = `## Get started\n\n\`\`\`text\n${prompt}\`\`\`\n\n## Without an agent\n\n\`\`\`bash\nnpx 'github:luroai/speck#v0.1.0' init\n\`\`\`\n`;
  assert.equal(readmeNpxProblems(base).length, 1);
});

test('0722 AC1: the check fails when the README has no setup prompt', () => {
  assert.equal(readmeNpxProblems('## Without an agent\n\n```bash\nnpx \'github:luroai/speck#semver:*\' init\n```\n').length, 1);
});

// ----- AC2 -----

const RULE = ['docs/brief.md', 'skills/speck-ticket/SKILL.md', 'templates/reviewer-prompt.md'];

test('0722 AC2: the brief, ticket skill and reviewer prompt list the terminal install command among the tested README facts', () => {
  for (const f of RULE) {
    const text = f === 'docs/brief.md'
      ? (read(f).split('\n').find(l => l.includes('**Criteria about documents.**')) || '')
      : read(f);
    assert.ok(text.includes('terminal install command'), f);
  }
});
