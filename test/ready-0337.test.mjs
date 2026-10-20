import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/run.mjs';
import { waitingLine } from './support/ready.mjs';

// ---------- 0337: the 0108 launch test looks only for speck run's waiting line ----------

// Each line speck run prints from a template in scripts/run.mjs containing `marker`, for ticket 0001 on main.
const printed = marker => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts', 'run.mjs'), 'utf8');
  const lines = src.split('\n').filter(l => l.includes(marker));
  assert.equal(lines.length, 1, `one line in run.mjs prints "${marker}"`);
  const template = lines[0].match(/console\.log\(`(.*)`\);/)[1];
  return ['until its ticket is set ready again and committed', 'until speck run restarts, as its run record couldn\'t be updated']
    .map(again => template.replace(/\$\{(t\.)?id\}/g, '0001').replace('${cfg.base_branch}', 'main').replace('${again}', again)
      .replace(/\$\{path\.relative\(repo, log\)\}/, 'speck/.cache/runs/0001.log').replace('\\n${tail}', '\nstderr line 7'));
};

test('0337 AC1: the line for a build that never started its ticket isn\'t taken for the waiting line', () => {
  for (const line of printed('so the build never started it')) assert.doesNotMatch(line, waitingLine, line);
});

test('0337 AC2: the line saying a ready ticket waits to be committed before it\'s launched still matches', () => {
  for (const line of printed('waiting for it to be committed')) assert.match(line, waitingLine, line);
  assert.match('0001 is ready but not committed as ready on main.', waitingLine);
  assert.match('0001 is waiting for its ready status to be committed.', waitingLine);
});
