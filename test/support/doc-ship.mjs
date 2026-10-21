// 0355: repos with an approved document task ready to ship, for the tests of how a document task ships.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { copied } from './copy.mjs';
import { gIn, runIn } from './ship.mjs';

const approveVerdict = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' };
const body = `## Problem\nThe team needs a pricing plan.\n## Outcome\nA pricing plan in outputs/plans.\n## Acceptance criteria\n1. The plan names three tiers.\n## Out of scope\n- Launch dates\n`;
export const DOC_BRANCH = 'speck/0001-write-a-pricing-plan';

// An approved document task (ticket 0001) on its own branch, checked out in a worktree, with main in the main checkout.
// `test` is the test command. `outside` names files outside speck/ the branch also changes, before the review.
// `auto` turns auto_ship on for both risks. Each kind is built once per test file and copied (copy.mjs).
export function docRepo({ test = 'true', outside = [], auto = false } = {}) {
  const dir = fs.realpathSync(copied('doc-ship', [test, outside, auto], 'speck-doc-ship-', d => build(d, { test, outside, auto })));
  const g = (...a) => gIn(dir, ...a).stdout.trim();
  g('update-index', '-q', '--refresh'); // the copy changed every file's stat, which git would otherwise take for changes
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-wt-'))), 'wt');
  assert.equal(gIn(dir, 'worktree', 'add', '-q', wt, DOC_BRANCH).status, 0);
  const ticketIn = cwd => ['speck/tickets/0001-write-a-pricing-plan.md', 'speck/tickets/done/0001-write-a-pricing-plan.md']
    .map(p => path.join(cwd, p)).find(p => fs.existsSync(p));
  const statusIn = cwd => fs.readFileSync(ticketIn(cwd), 'utf8').match(/^status: (\S+)/m)[1];
  const sha = ref => g('rev-parse', '--verify', '-q', ref);
  return { dir, wt, g, sha, statusIn, run: (...a) => runIn(dir, ...a) };
}

function build(dir, { test, outside, auto }) {
  const g = (...a) => gIn(dir, ...a).stdout.trim();
  const run = (...a) => runIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let cfg = fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, `  test: ${JSON.stringify(test)}`);
  if (auto) cfg = cfg.replace(/^auto_ship: .*$/m, 'auto_ship: true').replace(/^auto_ship_risk: .*$/m, 'auto_ship_risk: [low, high]');
  fs.writeFileSync(cfgFile, cfg);
  const file = path.join(dir, run('new', 'Write a pricing plan').stdout.trim());
  const [head] = fs.readFileSync(file, 'utf8').split('## Problem');
  fs.writeFileSync(file, head.replace(/^task: .*$/m, 'task: document\noutput: plans') + body);
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'base\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  g('checkout', '-qb', DOC_BRANCH);
  for (const f of outside) fs.writeFileSync(path.join(dir, f), 'from the document task\n');
  fs.appendFileSync(file, '\nSelf-check: no changes\n');
  g('add', '-A'); g('commit', '-qm', 'work');
  const v = path.join(os.tmpdir(), `verdict-${path.basename(dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(run('record', '1', v).status, 0);
  assert.equal(run('set', '1', 'status', 'approved').status, 0);
  g('add', '-A'); g('commit', '-qm', 'approved');
  g('checkout', '-q', 'main');
}
