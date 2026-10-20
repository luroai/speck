import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0335: read the agents' models outside the setup agent's sandbox ----------

const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const INSTALLED = path.join(ROOT, '.claude', 'skills', 'speck-setup', 'SKILL.md');
const read = file => fs.readFileSync(file, 'utf8');

// Section 5's paragraph on a sandbox stopping speck reading the models: the one that mentions a sandbox.
const sandbox = () => {
  const text = read(SKILL);
  const section = text.slice(text.indexOf('## 5. Builder and reviewer'), text.indexOf('## 6. '));
  const para = section.split(/\n\n/).find(p => /sandbox/i.test(p));
  assert.ok(para, 'section 5 has a paragraph about the agent\'s sandbox');
  return para;
};

test('0335 AC1: with no models and a network, SSL or certificate failure in models_why, run speck agents --json again outside the sandbox, asking first if needed', () => {
  const para = sandbox();
  assert.ok(para.includes('`models_why`'), para);
  for (const word of [/network/i, /SSL/, /certificate/i]) assert.match(para, word);
  assert.ok(para.includes('speck agents --json'), para);
  assert.match(para, /outside (its|your) (own )?sandbox/i);
  assert.match(para, /approv/i);
});

test('0335 AC2: otherwise, ask the user to run the listing command in their own terminal and paste the list, and offer models from it', () => {
  const para = sandbox();
  assert.ok(para.includes('`agent models`'), para);
  assert.match(para, /own terminal/i);
  assert.match(para, /paste/i);
});

test('0335 AC3: says this happens inside an agent\'s sandbox and that speck run builds aren\'t affected', () => {
  const para = sandbox();
  assert.ok(para.includes('`speck run`'), para);
});

test('0335 AC4: the installed copy matches the source skill', () => {
  assert.equal(read(INSTALLED), read(SKILL));
});
