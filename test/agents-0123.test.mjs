import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env } from './support/run.mjs';

// ---------- 0123: bring an old speck section in AGENTS.md up to date ----------

const OLD = '## speck\n\nThis repo uses speck. Read `speck/old-guide.md` first, then work only from a ready ticket.\n';

function repo(agents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  if (agents !== undefined) fs.writeFileSync(path.join(dir, 'AGENTS.md'), agents);
  const init = () => {
    const res = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8', env });
    assert.equal(res.status, 0, res.stderr);
    return res.stdout;
  };
  return { init, agents: () => fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8') };
}

// The section a fresh install writes, read back from a new repo, so the tests don't copy its wording.
function current() {
  const r = repo();
  r.init();
  const text = r.agents();
  return text.slice(text.indexOf('## speck'));
}

test('0123 AC1: an out-of-date ## speck section is replaced with the current one, up to the next heading of the same or a higher level', () => {
  const r = repo(`# Agent guide\n\nRules.\n\n${OLD}\n### Old speck detail\n\nMore old text.\n\n## Other\n\nKeep me.\n`);
  const out = r.init();
  const text = r.agents();
  assert.doesNotMatch(text, /old-guide\.md|Old speck detail|More old text/);
  assert.ok(text.includes(current().trimEnd()), 'it holds the current section');
  assert.match(text, /## Other\n\nKeep me\.\n$/);
  assert.match(out, /updated AGENTS\.md.*speck section/i);
});

test('0123 AC1: a ## speck section at the end of the file, or ended by a # heading, is replaced too', () => {
  const atEnd = repo(`# Agent guide\n\n${OLD}`);
  atEnd.init();
  assert.equal(atEnd.agents(), `# Agent guide\n\n${current()}`);
  const top = repo(`${OLD}\n# Next\n`);
  top.init();
  assert.equal(top.agents(), `${current().trimEnd()}\n\n# Next\n`);
});

test('0123 AC2: everything outside the section is left byte for byte as it was', () => {
  const before = '# Agent guide\r\n\r\nUse British English.  \n\n\n';
  const after = '\n## Later\n\n```\n## inside a fence, after the section\n```\nno newline at end';
  const r = repo(`${before}${OLD}${after}`);
  r.init();
  const text = r.agents();
  assert.ok(text.startsWith(before), 'text before the section is unchanged');
  assert.ok(text.endsWith(after), 'text after the section is unchanged');
  assert.equal(text, `${before}${current().trimEnd()}\n${after}`);
});

test('0123 AC3: a section that already matches is left untouched and not reported', () => {
  const r = repo('# Mine\n');
  r.init();
  const first = r.agents();
  const out = r.init();
  assert.equal(r.agents(), first);
  assert.doesNotMatch(out, /updated AGENTS\.md|out of date/);
  // Also when another section follows it.
  const followed = repo(`# Mine\n\n${current()}\n## Other\n\nText.\n`);
  const before = followed.agents();
  assert.doesNotMatch(followed.init(), /updated AGENTS\.md|out of date/);
  assert.equal(followed.agents(), before);
});

test('0123 AC4: AGENTS.md without a speck section, or no AGENTS.md, gets the section added as today', () => {
  const none = repo();
  assert.match(none.init(), /updated AGENTS\.md/);
  assert.equal(none.agents(), `# Agent guide\n\n${current()}`);
  const mine = repo('# Mine\n\nRules.\n');
  assert.match(mine.init(), /updated AGENTS\.md/);
  assert.equal(mine.agents(), `# Mine\n\nRules.\n\n${current()}`);
});

test('0123 AC5: speck mentioned without a ## speck heading is left as it is, with a warning and the current text', () => {
  const original = '# Mine\n\n### Workflow\n\nThis repo uses speck. Read `speck/old-guide.md` first.\n';
  const r = repo(original);
  const out = r.init();
  assert.equal(r.agents(), original);
  assert.doesNotMatch(out, /updated AGENTS\.md/);
  assert.match(out, /AGENTS\.md/);
  assert.match(out, /out of date/);
  const body = current().split('\n').find(l => l.startsWith('This repo uses speck'));
  assert.ok(out.includes(body), 'it shows the current text to compare');
});

test('0123 AC1: lines in fenced code blocks are not headings, inside or before the section', () => {
  const example = '# Mine\n\n```md\n## speck\nan example, not the section\n```\n\n';
  const r = repo(`${example}${OLD}\n~~~sh\n# a shell comment\n~~~\n\nOld tail.\n\n## Other\n`);
  r.init();
  assert.equal(r.agents(), `${example}${current().trimEnd()}\n\n## Other\n`);
});

test('0123 AC1, AC2: headings indented by up to three spaces count, and what follows them is kept byte for byte', () => {
  for (const next of ['  ## Other\n', '   # Other\n']) {
    const after = `${next}\nKeep these user rules.\n`;
    const r = repo(`# Mine\n\n ${OLD}\n${after}`);
    r.init();
    assert.equal(r.agents(), `# Mine\n\n${current().trimEnd()}\n\n${after}`, JSON.stringify(next));
  }
});

test('0123 AC1, AC2: an underlined heading ends the section, but a list item or a rule after a blank line does not', () => {
  for (const line of ['=====', '-----']) {
    const after = `Other\n${line}\n\nKeep these user rules.\n`;
    const r = repo(`# Mine\n\n${OLD}\n${after}`);
    r.init();
    assert.equal(r.agents(), `# Mine\n\n${current().trimEnd()}\n\n${after}`, line);
  }
  const r = repo(`# Mine\n\n${OLD}\n- an old rule\n---\n\n---\n\n## Other\n`);
  r.init();
  assert.equal(r.agents(), `# Mine\n\n${current().trimEnd()}\n\n## Other\n`);
});
