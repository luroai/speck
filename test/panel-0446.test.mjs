import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { agentView } from '../scripts/foreman-agent.mjs';

// ---------- 0446: what the Foreman agent's board says (0581: speck's events on the screen went with it) ----------

test('0446 AC1: the Foreman agent\'s board says when it started looking into a ticket', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0446-'));
  fs.writeFileSync(path.join(runs, 'run.foreman-agent.json'), JSON.stringify({ running: { id: '0363', token: 't', pid: null, key: 'k', what: 'its ship was refused', started: '2026-10-24T08:00:00.000Z' } }));
  assert.deepEqual(agentView(runs, []).running, { id: '0363', what: 'its ship was refused', started: '2026-10-24T08:00:00.000Z' });
});
