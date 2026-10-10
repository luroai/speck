// 0098: speck merge-check <id> reports, as JSON, what merging the base branch into a ticket's branch would conflict on.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runIn, gIn } from './support/ship.mjs';

const BRANCH = 'speck/0001-export-bookings';
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

// A repo with ticket 0001 on its own branch. `base` maps file paths to their content on both branches before they
// split; `ticket` and `main` map paths to what each side then commits. With `worktree`, the branch is checked out
// in its own worktree and main in the main checkout.
function mergeRepo({ base = {}, ticket = {}, main = {}, worktree = true } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-mc-')));
  const g = (cwd, ...a) => { const r = gIn(cwd, ...a); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  const put = (cwd, files) => {
    for (const [f, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(cwd, f)), { recursive: true });
      fs.writeFileSync(path.join(cwd, f), text);
    }
  };
  g(dir, 'init', '-q', '-b', 'main');
  assert.equal(runIn(dir, 'init', '--skip-checks').status, 0);
  assert.equal(runIn(dir, 'new', 'Export bookings').status, 0);
  put(dir, base);
  g(dir, 'add', '-A'); g(dir, 'commit', '-qm', 'base');
  g(dir, 'branch', BRANCH);
  put(dir, main);
  g(dir, 'add', '-A'); g(dir, 'commit', '-q', '--allow-empty', '-m', 'main moves on');
  let wt = dir;
  if (worktree) {
    wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-mc-wt-'))), 'wt');
    g(dir, 'worktree', 'add', '-q', wt, BRANCH);
  } else g(dir, 'checkout', '-q', BRANCH);
  put(wt, ticket);
  g(wt, 'add', '-A'); g(wt, 'commit', '-q', '--allow-empty', '-m', 'work');
  // Everything merge-check must leave alone: both branches, each folder's HEAD, index, status and files.
  const folder = cwd => ({
    head: g(cwd, 'rev-parse', 'HEAD'), branch: g(cwd, 'branch', '--show-current'),
    index: g(cwd, 'ls-files', '-s'), status: gIn(cwd, 'status', '--porcelain').stdout,
    unstaged: gIn(cwd, 'diff').stdout, staged: gIn(cwd, 'diff', '--cached').stdout,
    merging: fs.existsSync(path.join(g(cwd, 'rev-parse', '--absolute-git-dir'), 'MERGE_HEAD')),
    files: Object.fromEntries(fs.readdirSync(cwd).filter(f => f.endsWith('.txt') || f.endsWith('.json')).map(f => [f, fs.readFileSync(path.join(cwd, f), 'utf8')])),
  });
  const snapshot = () => ({ main: g(dir, 'rev-parse', 'main'), branch: g(dir, 'rev-parse', BRANCH), dir: folder(dir), wt: folder(wt) });
  return { dir, wt, run: (...a) => runIn(wt, 'merge-check', ...a), snapshot };
}

const lines = (...l) => l.map(x => `${x}\n`).join('');
const check = res => { noTrace(res); assert.equal(res.status, 0, res.stderr); return JSON.parse(res.stdout); };
const fileIn = (report, p) => report.files.find(f => f.path === p);

test('AC1 AC2: a clean merge prints one JSON object with "clean": true and no files, and changes nothing', () => {
  const r = mergeRepo({
    base: { 'a.txt': lines(1, 2, 3, 4, 5, 6) },
    ticket: { 'a.txt': lines('one', 2, 3, 4, 5, 6) },
    main: { 'a.txt': lines(1, 2, 3, 4, 5, 'six'), 'b.txt': 'new\n' },
  });
  const before = r.snapshot();
  const res = r.run('1');
  const report = check(res);
  assert.equal(report.clean, true);
  assert.deepEqual(report.files, []);
  assert.equal(report.branch, BRANCH);
  assert.equal(report.base, 'main');
  assert.deepEqual(r.snapshot(), before);
});

test('AC1: a conflicting merge leaves the branch, worktree and index exactly as they were', () => {
  const r = mergeRepo({ base: { 'a.txt': 'x\n' }, ticket: { 'a.txt': 'ticket\n' }, main: { 'a.txt': 'main\n' } });
  const before = r.snapshot();
  const report = check(r.run('1'));
  assert.equal(report.clean, false);
  assert.deepEqual(r.snapshot(), before);
  // The JSON is one object, alone on stdout.
  assert.equal(r.run('1').stdout.trim().split('\n').length, 1);
});

test('AC1: it works from the main checkout and with the branch checked out there', () => {
  const r = mergeRepo({ base: { 'a.txt': 'x\n' }, ticket: { 'a.txt': 'ticket\n' }, main: { 'a.txt': 'main\n' } });
  assert.equal(check(runIn(r.dir, 'merge-check', '1')).clean, false);
  const s = mergeRepo({ base: { 'a.txt': 'x\n' }, ticket: { 'a.txt': 'ticket\n' }, main: { 'a.txt': 'main\n' }, worktree: false });
  const before = s.snapshot();
  assert.equal(check(s.run('1')).clean, false);
  assert.deepEqual(s.snapshot(), before);
});

test('AC1: refuses plainly, changing nothing, when the ticket has no branch', () => {
  const r = mergeRepo();
  assert.equal(gIn(r.dir, 'worktree', 'remove', '--force', r.wt).status, 0);
  assert.equal(gIn(r.dir, 'branch', '-D', BRANCH).status, 0);
  const before = gIn(r.dir, 'for-each-ref').stdout;
  const res = runIn(r.dir, 'merge-check', '1');
  noTrace(res);
  assert.notEqual(res.status, 0);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /0001 has no branch/);
  assert.equal(gIn(r.dir, 'for-each-ref').stdout, before);
});

test('AC1: refuses plainly, changing nothing, when the worktree has uncommitted changes', () => {
  for (const staged of [false, true]) {
    const r = mergeRepo({ base: { 'a.txt': 'x\n' }, ticket: { 'a.txt': 'ticket\n' }, main: { 'a.txt': 'main\n' } });
    fs.writeFileSync(path.join(r.wt, 'a.txt'), 'half done\n');
    if (staged) gIn(r.wt, 'add', 'a.txt');
    const before = r.snapshot();
    const res = r.run('1');
    noTrace(res);
    assert.notEqual(res.status, 0);
    assert.equal(res.stdout, '');
    assert.match(res.stderr, /uncommitted changes/);
    assert.match(res.stderr, new RegExp(r.wt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.deepEqual(r.snapshot(), before);
  }
});

test('AC1: refuses plainly without an id, or for a ticket that does not exist', () => {
  const r = mergeRepo();
  for (const args of [[], ['42']]) {
    const res = r.run(...args);
    noTrace(res);
    assert.notEqual(res.status, 0);
    assert.equal(res.stdout, '');
    assert.ok(res.stderr.trim());
  }
});

test('AC3 AC4: both sides adding lines at the same place is added-lines, with the conflict count and line range', () => {
  const r = mergeRepo({
    base: { 'list.txt': lines('a', 'b', 'c', 'd', 'e', 'f', 'g') },
    ticket: { 'list.txt': lines('a', 'b', 'from ticket', 'c', 'd', 'e', 'f', 'g', 'ticket end') },
    main: { 'list.txt': lines('a', 'b', 'from main', 'c', 'd', 'e', 'f', 'g', 'main end') },
  });
  const report = check(r.run('1'));
  assert.equal(report.clean, false);
  const f = fileIn(report, 'list.txt');
  assert.equal(f.class, 'added-lines');
  assert.equal(f.conflicts, 2);
  // The merged file as git merge leaves it: a and b, the first conflict's five lines (markers included), c to g,
  // then the second conflict.
  assert.deepEqual(f.lines, [{ start: 3, end: 7 }, { start: 13, end: 17 }]);
});

test('AC3: a change to a line the base had is logic, even if another conflict in the file only adds lines', () => {
  const r = mergeRepo({
    base: { 'code.txt': lines('a', 'b', 'c', 'd', 'e', 'f', 'g'), 'one.txt': lines('keep', 'old') },
    ticket: { 'code.txt': lines('a', 'b', 'from ticket', 'c', 'd', 'e', 'f', 'G ticket'), 'one.txt': lines('keep', 'ticket') },
    main: { 'code.txt': lines('a', 'b', 'from main', 'c', 'd', 'e', 'f', 'G main'), 'one.txt': lines('keep', 'main') },
  });
  const report = check(r.run('1'));
  assert.equal(fileIn(report, 'code.txt').class, 'logic');
  assert.equal(fileIn(report, 'code.txt').conflicts, 2);
  assert.equal(fileIn(report, 'one.txt').class, 'logic');
  assert.deepEqual(fileIn(report, 'one.txt').lines, [{ start: 2, end: 6 }]);
});

test('AC3: a deleted line on one side is logic', () => {
  const r = mergeRepo({
    base: { 'a.txt': lines('a', 'b', 'c') },
    ticket: { 'a.txt': lines('a', 'c', 'ticket') },
    main: { 'a.txt': lines('a', 'b', 'main', 'c') },
  });
  assert.equal(fileIn(check(r.run('1')), 'a.txt').class, 'logic');
});

test('AC3: lockfiles, as the size check recognises them, are lockfile, even when both sides only added lines', () => {
  const r = mergeRepo({
    base: { 'package-lock.json': lines('{', '}'), 'web/yarn.lock': lines('a', 'b') },
    ticket: { 'package-lock.json': lines('{', '"t": 1', '}'), 'web/yarn.lock': lines('a', 'ticket') },
    main: { 'package-lock.json': lines('{', '"m": 1', '}'), 'web/yarn.lock': lines('a', 'main') },
  });
  const report = check(r.run('1'));
  assert.equal(fileIn(report, 'package-lock.json').class, 'lockfile');
  assert.equal(fileIn(report, 'web/yarn.lock').class, 'lockfile');
  assert.equal(fileIn(report, 'package-lock.json').conflicts, 1);
});

test('AC3: a file under speck/ is ticket, and a name only containing speck/ is not', () => {
  const r = mergeRepo({
    base: { 'speck/ideas/note.md': lines('# Note', 'old'), 'docs/speck/x.txt': lines('old') },
    ticket: { 'speck/ideas/note.md': lines('# Note', 'ticket'), 'docs/speck/x.txt': lines('ticket') },
    main: { 'speck/ideas/note.md': lines('# Note', 'main'), 'docs/speck/x.txt': lines('main') },
  });
  const report = check(r.run('1'));
  assert.equal(fileIn(report, 'speck/ideas/note.md').class, 'ticket');
  assert.equal(fileIn(report, 'docs/speck/x.txt').class, 'logic');
});

test('AC3 AC4: a conflict with no conflict markers (deleted on one side) is logic with one conflict and no line ranges', () => {
  const r = mergeRepo({
    base: { 'gone.txt': lines('a', 'b') },
    ticket: { 'gone.txt': lines('a', 'b', 'ticket') },
    main: {},
  });
  fs.rmSync(path.join(r.dir, 'gone.txt'));
  gIn(r.dir, 'commit', '-qam', 'remove gone.txt');
  const f = fileIn(check(r.run('1')), 'gone.txt');
  assert.equal(f.class, 'logic');
  assert.equal(f.conflicts, 1);
  assert.deepEqual(f.lines, []);
});

test('AC3: a file both sides added with different content is logic, since the base had nothing to add to', () => {
  const r = mergeRepo({ ticket: { 'new.txt': lines('ticket') }, main: { 'new.txt': lines('main') } });
  assert.equal(fileIn(check(r.run('1')), 'new.txt').class, 'logic');
});

test('AC3: lines that merely look like conflict markers in a file are not counted as conflicts', () => {
  const r = mergeRepo({
    base: { 'doc.txt': lines('Title', '=======', 'a', 'b', 'c', 'd') },
    ticket: { 'doc.txt': lines('Title', '=======', 'a', 'b', 'c', 'd', 'ticket') },
    main: { 'doc.txt': lines('Title', '=======', 'a', 'b', 'c', 'd', 'main') },
  });
  const f = fileIn(check(r.run('1')), 'doc.txt');
  assert.equal(f.class, 'added-lines');
  assert.equal(f.conflicts, 1);
  assert.deepEqual(f.lines, [{ start: 7, end: 11 }]);
});

test('AC4: line ranges follow the conflict style git merge would use in the repo', () => {
  const r = mergeRepo({
    base: { 'a.txt': lines('a', 'old', 'z') },
    ticket: { 'a.txt': lines('a', 'ticket', 'z') },
    main: { 'a.txt': lines('a', 'main', 'z') },
  });
  assert.deepEqual(fileIn(check(r.run('1')), 'a.txt').lines, [{ start: 2, end: 6 }]);
  gIn(r.dir, 'config', 'merge.conflictStyle', 'diff3');
  // diff3 adds the base's section (a ||||||| line and the old line), so the conflict is two lines longer.
  assert.deepEqual(fileIn(check(r.run('1')), 'a.txt').lines, [{ start: 2, end: 8 }]);
});

test('AC3 AC4: each conflicted file is reported once, sorted by path', () => {
  const r = mergeRepo({
    base: { 'b.txt': 'x\n', 'a.txt': 'x\n' },
    ticket: { 'b.txt': 'ticket\n', 'a.txt': 'ticket\n' },
    main: { 'b.txt': 'main\n', 'a.txt': 'main\n' },
  });
  const report = check(r.run('1'));
  assert.deepEqual(report.files.map(f => f.path), ['a.txt', 'b.txt']);
  for (const f of report.files) assert.deepEqual(Object.keys(f).sort(), ['class', 'conflicts', 'lines', 'path']);
});

test('AC1: refuses plainly, changing nothing, when the base branch is missing or shares no history with the branch', () => {
  const r = mergeRepo({ base: { 'a.txt': 'x\n' }, ticket: { 'a.txt': 'ticket\n' } });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^base_branch: .*$/m, 'base_branch: trunk'));
  let before = r.snapshot();
  let res = runIn(r.dir, 'merge-check', '1');
  noTrace(res);
  assert.notEqual(res.status, 0);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /trunk/);
  assert.deepEqual(r.snapshot(), before);
  // An orphan trunk branch: git refuses to merge histories that share nothing, and so does merge-check.
  assert.equal(gIn(r.dir, 'checkout', '-q', '--orphan', 'trunk').status, 0);
  assert.equal(gIn(r.dir, 'commit', '-q', '--allow-empty', '-m', 'orphan').status, 0);
  assert.equal(gIn(r.dir, 'checkout', '-q', 'main').status, 0);
  before = r.snapshot();
  res = runIn(r.dir, 'merge-check', '1');
  noTrace(res);
  assert.notEqual(res.status, 0);
  assert.equal(res.stdout, '');
  assert.match(res.stderr, /Couldn't work out the merge of trunk into speck\/0001-export-bookings: .*unrelated histories/);
  assert.deepEqual(r.snapshot(), before);
});
