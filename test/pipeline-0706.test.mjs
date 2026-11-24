// 0706: the Pipeline log's lines still read as whole sentences once paths and commands are taken out.
import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { model } from './support/panel.mjs';

const summary = vm.runInNewContext(`${model()}\nrunLogSummary`, {});
const DANGLING = /:\s*(?:[.,;]|$)|\b(?:run|in|into|of|with)\s*(?:[.,;:]|$)|\brun \d{4,}/i;
const LINES = {
  conflict: "0457 didn't ship: Merging speck/0457-x into main hit a conflict, so nothing was shipped and main is unchanged. Conflicting files: a/b.mjs, c.md. Merge main into speck/0457-x, resolve the conflicts, get the result reviewed, then ship again.",
  resume: "0457 is blocked, with its branch and work kept. Resume its session, or run /speck-build 0457, to carry on.",
  paused: "0457 paused (session abc, process 12). Run `speck play 0457` to carry it on.",
  lastLines: "0457 is still ready, so the build never started it. speck run won't launch it again until x. Last lines of speck/.cache/runs/0457.log:\nsome output",
  filed: "0457 was cancelled on its branch, so speck run cancelled it on main too, filed in the done folder (speck/tickets/done/).",
  uncommitted: "speck/config.yml has uncommitted changes on main, so speck didn't save how to start your app: commit or undo them, then set commands.start yourself (`speck config set commands.start \"x\"`).",
  appUrl: "Saved how to start your app as commands.start and app_url in speck's config file (speck/config.yml), committed on main as \"x\".",
  itsLog: "0457: I looked into it and took no action. Its log: speck/.cache/runs/w.log",
};
for (const [name, line] of Object.entries(LINES))
  test(`0706 AC1: the ${name} line leaves nothing dangling`, () => {
    const s = summary(line);
    assert.ok(s && !DANGLING.test(s), s);
  });
test('0706 AC2: the resume line keeps its meaning', () => assert.match(summary(LINES.resume), /Resume its session/));
test('0706 AC3: a line with no path or command is unchanged', () => {
  assert.equal(summary('speck run stopped. 1 build is still running: 0457.'), '0457 speck run stopped. 1 build is still running: 0457.');
  assert.equal(summary('Shipped 0001.'), '0001 shipped');
});
test('0706 AC3: ordinary sentences with those phrases are left whole', () => {
  assert.equal(summary('Please tell me which folder to put it in.'), 'Please tell me which folder to put it in.');
  assert.equal(summary('Last lines of the build are useful.'), 'Last lines of the build are useful.');
  assert.equal(summary('speck run: watching for ready tickets.'), 'speck run: watching for ready tickets.');
});
