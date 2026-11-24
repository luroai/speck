import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSkill } from './support/speck.mjs';

const md = () => buildSkill();
const section = (s, a, b) => s.split(a)[1].split(b)[0];

test('0712 AC1: the block steps point review-limit answers to speck answer or the panel', () => {
  const block = section(md(), '## 6. Block', '## Rules');
  assert.match(block, /speck answer <id> "<answer>"/);
  assert.match(block, /panel's Answer/);
  const loop = md().split('\n').find(l => l.includes('`Review limit: yes` on a line of its own'));
  assert.match(loop, /speck answer <id> "<answer>"/);
});

test('0712 AC2: resuming a review-limit block with no allowing line stops and points to speck answer', () => {
  const step = md().split('\n').find(l => l.startsWith('2. The ticket must be `ready`'));
  assert.match(step, /Review limit: yes/);
  assert.match(step, /speck answer/);
  assert.match(step, /stop/i);
});

test('0712 AC3: the skill still never tells the builder to write the allowing line', () => {
  assert.match(md(), /Never write the `Review limit: … allowed 2 more review rounds` line in the ticket's Notes yourself/);
});
