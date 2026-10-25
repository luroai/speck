import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0510: setup opens the panel and turns speck run on when it finishes ----------

const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const INSTALLED = path.join(ROOT, '.claude', 'skills', 'speck-setup', 'SKILL.md');
const read = file => fs.readFileSync(file, 'utf8');
const finish = (file = SKILL) => { const text = read(file); const at = text.indexOf('## 8. Finish'); assert.ok(at >= 0, 'setup has a Finish section'); return text.slice(at); };
// The Finish step whose bold title names it, up to the next numbered step.
const step = title => {
  const text = finish(), at = text.indexOf(`**${title}**`);
  assert.ok(at >= 0, `Finish has a "${title}" step`);
  const next = text.slice(at).search(/\n\d+\. /);
  return next < 0 ? text.slice(at) : text.slice(at, at + next);
};

test('0510 AC1: Finish starts the panel with speck panel --background', () => {
  assert.match(step('Start the panel.'), /`speck panel --background`/);
  assert.equal(finish(INSTALLED), finish(), 'the installed skill is the same');
});

test('0510 AC2: Finish opens the panel, and links to the README\'s panel section', () => {
  const open = step('Open it.');
  assert.match(open, /`open <address>`/);
  assert.match(open, /`xdg-open <address>`/);
  const link = open.match(/https:\/\/github\.com\/([^/\s]+\/[^/#\s]+)#([\w-]+)/);
  assert.ok(link, 'it links to a section of speck\'s README');
  assert.equal(`github:${link[1]}`, JSON.parse(read(path.join(ROOT, 'package.json'))).repository, 'the link names speck\'s own repo');
  assert.equal(link[2], 'the-panel', 'the anchor GitHub gives the README\'s "The panel" heading');
});

test('0510 AC3: Finish turns speck run on in the background, writing to the log the switch uses', () => {
  const run = step('Turn `speck run` on.');
  assert.match(run, /`mkdir -p speck\/\.cache\/runs && nohup node \.speck\/scripts\/speck\.mjs run >> speck\/\.cache\/runs\/run\.log 2>&1 < \/dev\/null &`/);
  assert.match(read(path.join(ROOT, 'scripts', 'panel-run.mjs')), /path\.join\(runsDir\(repo\), 'run\.log'\)/, 'the panel\'s switch writes the same log');
});

test('0510 AC4: if the panel doesn\'t start, Finish says to start it later with speck panel', () => {
  assert.match(step('Start the panel.'), /start it later with `speck panel`/);
});

test('0510 AC5: the next steps still give speck set <id> status ready', () => {
  assert.match(finish(), /`speck set <id> status ready`/);
});
