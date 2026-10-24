import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0334: offer an all-Cursor setup with models picked from the account's list ----------

const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const INSTALLED = path.join(ROOT, '.claude', 'skills', 'speck-setup', 'SKILL.md');
const read = file => fs.readFileSync(file, 'utf8');

// Section 5's bullet for an all-Cursor setup, from "- **All-Cursor setup:**" up to the next top-level bullet.
const allCursor = () => {
  const text = read(SKILL);
  const section = text.slice(text.indexOf('## 5. Builder and reviewer'), text.indexOf('## 6. '));
  const start = section.indexOf('- **All-Cursor setup:**');
  assert.ok(start >= 0, 'section 5 has an All-Cursor setup bullet');
  const end = section.indexOf('\n- ', start + 1);
  return section.slice(start, end < 0 ? undefined : end);
};

test('0334 AC1: with a Cursor builder, section 5 offers an all-Cursor setup: builds on auto, a Cursor reviewer on a picked model, the Foreman on Cursor or another agent', () => {
  const bullet = allCursor();
  assert.match(bullet, /picks? Cursor[^.]*builder|builder is Cursor/i);
  assert.match(bullet, /one question/i);
  assert.match(bullet, /`auto`/);
  assert.match(bullet, /reviewer on Cursor[^.]*model[^.]*pick/i);
  assert.match(bullet, /speck's (own )?agent[^.]*Cursor[^.]*(another|other) (installed|agent)/i); // 0488: was the Foreman
});

test('0334 AC2: models are offered only from speck agents --json, by name, never made up', () => {
  const bullet = allCursor();
  assert.ok(bullet.includes('speck agents --json'), bullet);
  assert.match(bullet, /only[^.]*`models`|`models`[^.]*only/i);
  assert.match(bullet, /by (its|each one's) `name`/);
  assert.match(bullet, /never make up a model name/i);
});

test('0334 AC3: recommends a reviewer model from another provider when builder_model is set, and says any is accepted on auto', () => {
  const bullet = allCursor();
  assert.match(bullet, /builder_model[^.]*set[^.]*another provider|another provider[^.]*builder_model[^.]*set/i);
  assert.match(bullet, /`auto`[^.]*any reviewer model is accepted|any reviewer model is accepted[^.]*`auto`/i);
  assert.match(bullet, /own chat/i);
});

test('0334 AC4: everything is set with speck config set, with no hand edit and no allow_same_model_review', () => {
  const bullet = allCursor();
  for (const cmd of ['speck config set builder cursor', 'speck config set reviewer cursor', 'speck config set reviewer_model <name>',
    'speck config set watch_agent <name>', 'speck config set watch_model <name>']) assert.ok(bullet.includes(cmd), `missing ${cmd}`);
  assert.match(bullet, /never edit `speck\/config\.yml`|no hand edit/i);
  assert.match(bullet, /without `allow_same_model_review`|no `allow_same_model_review`|leave `allow_same_model_review`/i);
  assert.doesNotMatch(bullet, /allow_same_model_review true/);
});

test('0334 AC5: the installed copy matches the source skill', () => {
  assert.equal(read(INSTALLED), read(SKILL));
});
