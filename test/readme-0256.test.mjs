import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- 0256: start each README section with a plain sentence ----------
// 0267 removed the checks on how each section opens, which review checks now. What's left checks the commands and
// links the changed sections gave.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('0256 AC3: the commands and links the changed sections gave are still there', () => {
  const r = read('README.md');
  for (const fact of [
    '[`docs/brief.md`](docs/brief.md)',
    '`node .speck/scripts/speck.mjs panel`',
    'http://127.0.0.1:4777',
    '`node .speck/scripts/speck.mjs <command>`',
    '[LICENSE](LICENSE)',
  ]) assert.ok(r.includes(fact), `the README still gives ${fact}`);
});
