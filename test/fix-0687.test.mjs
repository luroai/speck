// 0687: a fix ticket may change or fix the failing tests its criteria name, so its reviewer prompt says so, and no
// other ticket's does. The skills say it too, which the reviewer checks by reading them.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewRepo } from './support/speck.mjs';

const EXCEPTION = 'This ticket has `type: fix`';

test('0687 AC2: a fix ticket\'s reviewer prompt has the exception for the failing tests it names', () => {
  const p = reviewRepo({ ticketFields: 'type: fix' }).run('prompt', '1');
  assert.equal(p.status, 0, p.stderr);
  assert.ok(p.stdout.includes(EXCEPTION));
  assert.ok(!p.stdout.includes('{{'), 'no marker is left in the prompt');
});

test('0687 AC2: any other ticket\'s reviewer prompt has no exception and no marker', () => {
  for (const type of ['', 'bug']) {
    const p = reviewRepo({ ticketFields: type ? `type: ${type}` : '' }).run('prompt', '1');
    assert.equal(p.status, 0, p.stderr);
    assert.ok(!p.stdout.includes(EXCEPTION), `type: ${type || 'blank'}`);
    assert.ok(!p.stdout.includes('{{'), 'no marker is left in the prompt');
    assert.ok(p.stdout.includes('Failing before this build: not checked'), 'the rest of the scope rule stays');
  }
});
