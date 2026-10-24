import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/panel.mjs';

// ---------- 0116: the build handles a ship that needs help itself, and speck-integrate is gone ----------

const CLI = path.join(ROOT, '.speck', 'scripts', 'speck.mjs');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const build = () => read('skills/speck-build/SKILL.md');
// Section 5 of /speck-build, up to the next `## ` heading.
const section5 = () => build().split(/^## 5\./m)[1].split(/^## /m)[0];
// A `### ` part of section 5, up to the next `### ` heading or the end of the section.
const part = heading => {
  const m = section5().match(new RegExp(`^### ${heading}[^\\n]*\\n([\\s\\S]*?)(?=^### |(?![\\s\\S]))`, 'm'));
  assert.ok(m, `section 5 has a "${heading}" part`);
  return m[1];
};
// The exit-13 and exit-14 bullets of section 5: since 0194, those of "When speck run hands it back".
const bullet = code => section5().split('\n').find(l => new RegExp(`exit(s with|ed) ${code}`).test(l)) || '';

test('0116 AC1: exit 13 sends the build to its conflict steps', () => {
  assert.match(bullet(13), /"Conflict"/);
});

test('0116 AC1: a conflict is classed with speck merge-check and each file resolved by its class', () => {
  const s = part('Conflict');
  assert.match(s, /`speck merge-check <id>`/);
  assert.match(s, /git merge <ref>/);
  assert.match(s, /no rebase or squash/i);
  for (const cls of ['added-lines', 'lockfile', 'ticket', 'logic']) assert.match(s, new RegExp('`' + cls + '`'), cls);
  assert.match(s, /keep both sides/i);
  assert.match(s, /install command/i);
  assert.match(s, /`## Review rounds` exactly as they are/);
  assert.match(s, /intent of both sides/i);
  assert.ok(s.indexOf('speck merge-check <id>') < s.indexOf('git merge <ref>'), 'merge-check runs before the merge');
});

test('0116 AC1: the tests and a merge round come before shipping again, with a fresh response file', () => {
  const s = part('Conflict');
  assert.match(s, /`speck test --files <file>… 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`/, 'the ticket\'s test files (0235)');
  assert.match(s, /merge round/i);
  assert.match(s, /`speck review <id>/);
  assert.match(s, /response file fresh/i);
  assert.match(s, /each file you resolved and how, with its class/);
  // Since 0194 the build stops at approved again, and speck run's ship queue ships it.
  assert.match(s, /`speck close <id>`, then stop/);
  assert.ok(s.indexOf('speck test') < s.indexOf('speck review <id>'), 'tests before the merge round');
  assert.ok(s.indexOf('speck review <id>') < s.lastIndexOf('speck close <id>'), 'merge round before approving again');
});

test('0116 AC1: after two merges that still conflict, it blocks the ticket with the files in its question', () => {
  const s = part('Handed back again'); // since 0194: speck run says when it has handed the ticket back twice
  assert.match(s, /handed this ticket back twice already/);
  assert.match(s, /block the ticket \(section 6\)/i);
  assert.match(s, /conflicting files in the question/);
});

test('0116 AC2: exit 14 changes no code and creates one fix ticket unless an open one covers it', () => {
  assert.match(bullet(14), /"Base branch failing"/);
  const s = part('Base branch failing');
  assert.match(s, /change no code/i);
  assert.match(s, /`speck new "<title>" --type=fix`/);
  assert.match(s, /`type: fix`/);
  assert.match(s, /not `speck\/tickets\/done\/`/);
  assert.match(s, /already covers/i);
  assert.match(s, /don't make another/i);
  assert.match(s, /plain words/i);
});

test('0116 AC2: the fix ticket is set ready without asking, and the build stops leaving its own ticket approved', () => {
  const s = part('Base branch failing');
  assert.match(s, /`speck set <fix-id> status ready`/);
  assert.match(s, /without asking/i);
  assert.doesNotMatch(build(), /auto_fix_main/, 'no setting decides it');
  assert.match(s, /then stop/i);
  assert.match(s, /leave this ticket `approved`/i);
  assert.match(s, /tell the user/i);
  assert.ok(s.indexOf('speck new') < s.indexOf('speck set <fix-id> status ready'), 'created before it is set ready');
});

test('0116 AC2: an open fix ticket already on its way is left as it is', () => {
  const s = part('Base branch failing');
  assert.match(s, /only a `draft` one/);
  assert.match(s, /git branch --list '<branch_prefix><fix-id>-\*'/);
});

test('0116 AC2: the rules allow committing the fix ticket in the main checkout, and nothing else there', () => {
  const rule = build().split(/^## Rules/m)[1].split('\n').find(l => /Never commit, stage or change files in the main checkout/.test(l));
  assert.ok(rule, 'the main-checkout rule is there');
  assert.match(rule, /fix ticket/);
  assert.match(part('Base branch failing'), /in the main checkout/);
});

test('0116 AC3: the build asks only when two tickets contradict each other or a merge round blocks', () => {
  const s = part('Asking the user');
  assert.match(s, /only when two tickets contradict each other/i);
  assert.match(s, /`speck next <id>` says `block`/);
  assert.match(s, /## Blocked question/);
  assert.match(s, /`speck set <id> status blocked`/);
  assert.match(s, /without git terms/i);
  assert.match(s, /options/i);
  assert.match(s, /recommend/i);
  // Every place in the two other parts that asks the user names one of the two reasons.
  for (const p of [part('Conflict'), part('Base branch failing')])
    for (const line of p.split('\n').filter(l => /ask(ing)? the user/i.test(l) && !/without asking/i.test(l)))
      assert.match(line, /contradict|`block`/, line);
});

test('0116 AC3: the repeated-conflict question is in plain words too', () => {
  assert.match(part('Handed back again'), /handed this ticket back twice already[^\n]*without git terms/);
});

const initRepo = () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0116-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  return dir;
};
const init = dir => {
  const r = spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r;
};

test('0116 AC4: speck init no longer installs speck-integrate', () => {
  const dir = initRepo();
  init(dir);
  for (const base of ['.claude/skills', '.agents/skills']) {
    assert.ok(fs.existsSync(path.join(dir, base, 'speck-build', 'SKILL.md')), `${base} still gets the other skills`);
    assert.ok(!fs.existsSync(path.join(dir, base, 'speck-integrate')), base);
  }
});

test('0116 AC4: re-running speck init removes the copy an earlier version installed', () => {
  const dir = initRepo();
  init(dir);
  for (const base of ['.claude/skills', '.agents/skills']) {
    fs.mkdirSync(path.join(dir, base, 'speck-integrate'), { recursive: true });
    fs.writeFileSync(path.join(dir, base, 'speck-integrate', 'SKILL.md'), '---\nname: speck-integrate\n---\n');
  }
  init(dir);
  for (const base of ['.claude/skills', '.agents/skills']) assert.ok(!fs.existsSync(path.join(dir, base, 'speck-integrate')), base);
});

test('0116 AC4: re-running speck init also removes an old link to it, even a broken one', () => {
  const dir = initRepo();
  init(dir);
  const at = path.join(dir, '.claude/skills', 'speck-integrate');
  fs.symlinkSync('../../skills/speck-integrate', at, 'dir'); // points nowhere in this repo
  init(dir);
  assert.throws(() => fs.lstatSync(at), /ENOENT/);
});

test('0116 AC4: the skill is gone from speck and from this repo\'s skill folders', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'skills', 'speck-integrate')));
  for (const base of ['.claude/skills', '.agents/skills'])
    assert.throws(() => fs.lstatSync(path.join(ROOT, base, 'speck-integrate')), /ENOENT/, base);
});

// 0194 brought back a ship queue, in speck run, so only the skill's name is checked.
// 0491: whether the README names it is checked by review.
test('0116 AC4: the brief and the skills no longer describe the skill', () => {
  const files = ['docs/brief.md', ...fs.readdirSync(path.join(ROOT, 'skills')).map(s => `skills/${s}/SKILL.md`)];
  for (const f of files) assert.doesNotMatch(read(f), /speck-integrate/, f);
});

test('0116 AC2 self-check: if setting the fix ticket ready is refused, it stays a draft and the report says so', () => {
  const s = part('Base branch failing');
  assert.match(s, /If `speck set` refuses/);
  assert.match(s, /leave it `draft` and say so in step 4/);
  assert.match(s, /whether it's ready or still a draft/);
});

test('0116 AC3 F1: a contradiction found partway through a merge undoes the merge before the question is committed', () => {
  const s = part('Asking the user');
  assert.match(s, /`git merge --abort`/);
  assert.match(s, /without choosing either ticket's side/);
  assert.match(s, /Don't commit a half-resolved merge/);
  assert.ok(s.indexOf('git merge --abort') < s.indexOf('`speck set <id> status blocked`'), 'undone before the blocked commit');
  assert.match(s, /start "Conflict" again from step 1/);
});

test('0116 AC3 F1: aborting a half-resolved merge lets the blocked question be committed', () => {
  const dir = initRepo();
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'base\n'); g('add', 'shared.txt'); g('commit', '-qm', 'base');
  g('checkout', '-qb', 'ticket');
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'ticket\n'); g('commit', '-qam', 'ticket');
  const approved = g('rev-parse', 'HEAD').stdout;
  g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'other\n'); g('commit', '-qam', 'other');
  g('checkout', '-q', 'ticket');
  assert.notEqual(g('merge', 'main').status, 0, 'the merge conflicts');
  fs.writeFileSync(path.join(dir, 'question.md'), 'q\n'); g('add', 'question.md');
  assert.notEqual(g('commit', '-qm', 'blocked').status, 0, 'git refuses to commit a half-resolved merge');
  assert.equal(g('merge', '--abort').status, 0);
  assert.equal(g('rev-parse', 'HEAD').stdout, approved, 'back where the reviewer approved it');
  assert.equal(fs.readFileSync(path.join(dir, 'shared.txt'), 'utf8'), 'ticket\n');
  fs.writeFileSync(path.join(dir, 'question.md'), 'q\n'); g('add', 'question.md');
  assert.equal(g('commit', '-qm', 'blocked').status, 0, 'the blocked question commits once the merge is undone');
});
