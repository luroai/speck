// 0131: `speck pack <id> --plain` prints a short review pack in plain English, for someone who doesn't read code.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shipRepo, gIn, runIn } from './support/ship.mjs';

const TICKET = 'speck/tickets/0001-export-bookings.md';
const PLAIN = 'Anyone can now download their bookings as a spreadsheet.\n\nOpen the bookings page and press Export.';
const CRITERIA = '1. Export button downloads a CSV.\n2. The CSV has one row per booking.\n3. Empty lists give a CSV with only the header.';
const body = (plain = PLAIN, criteria = CRITERIA) => `## Problem\nUsers cannot export.\n\n## Outcome\nUsers can export their bookings as a CSV file.\n\n` +
  `## Acceptance criteria\n${criteria}\n\n` +
  `## Out of scope\n- PDF export\n\n## Notes\n- Uses \`src/export.js\`.\n\n` +
  (plain === null ? '' : `## In plain words\n${plain}\n\n`) + `## Blocked question\n<!-- Filled in by speck only when status is blocked. -->\n\n`;
const verdict = (v, criteria, findings = []) => ({ verdict: v, criteria, findings, summary: 'Checked `shared.txt` and test/export.test.js.', escalation_question: '' });
const crit = (...s) => s.map((status, i) => ({ id: i + 1, status, evidence: `see shared.txt line ${i + 1}` }));

// shipRepo's approved ticket, with `body` as its sections, a reviewer model set, an optional sensitive file and risk,
// and a last round with `last` as its verdict.
function plainRepo({ plain, criteria, risk = 'low', sensitive = false, last = verdict('approve', crit('pass', 'pass', 'pass')) } = {}) {
  const r = shipRepo();
  const file = path.join(r.wt, TICKET);
  const text = fs.readFileSync(file, 'utf8');
  const [head, rest] = text.split('## Problem');
  const roundsAt = rest.indexOf('## Review rounds');
  fs.writeFileSync(file, head.replace(/^risk: \S+/m, `risk: ${risk}`).replace(/^reviewer_model: .*$/m, 'reviewer_model: gpt-secret-model')
    + body(plain, criteria) + rest.slice(roundsAt));
  if (sensitive) {
    fs.mkdirSync(path.join(r.wt, 'src'), { recursive: true });
    fs.writeFileSync(path.join(r.wt, 'src', 'auth.js'), 'a\n');
  }
  gIn(r.wt, 'add', '-A'); gIn(r.wt, 'commit', '-qm', 'ticket');
  const v = path.join(os.tmpdir(), `verdict-0131-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(last));
  const rec = runIn(r.wt, 'record', '1', v, '--reviewer=codex');
  assert.ok([0, 10, 11].includes(rec.status), rec.stderr);
  gIn(r.wt, 'add', '-A'); gIn(r.wt, 'commit', '-qm', 'round');
  const pack = (...a) => {
    const out = runIn(r.wt, 'pack', '1', ...a);
    assert.equal(out.status, 0, out.stderr);
    return out.stdout;
  };
  return { ...r, pack };
}

// Where each piece starts in the pack, in the order AC1 gives them.
const at = (out, s) => { const i = out.indexOf(s); assert.ok(i >= 0, `the pack has: ${s}\n---\n${out}`); return i; };

test('0131 AC1: the plain pack prints the id and title, the approval, the outcome, the plain words and each criterion, in that order', () => {
  const out = plainRepo().pack('--plain');
  const order = [
    at(out, '0001'), at(out, 'Export bookings'),
    at(out, 'The reviewer approved this change.'),
    at(out, 'Users can export their bookings as a CSV file.'),
    at(out, 'Anyone can now download their bookings as a spreadsheet.'), at(out, 'Open the bookings page and press Export.'),
    at(out, 'Export button downloads a CSV.'), at(out, 'The CSV has one row per booking.'), at(out, 'Empty lists give a CSV with only the header.'),
  ];
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('0131 AC1: each criterion is marked passed, failed or unclear from the latest round', () => {
  const lines = plainRepo({ last: verdict('changes_requested', crit('pass', 'fail', 'unclear')) }).pack('--plain').split('\n');
  const line = s => lines.find(l => l.includes(s));
  assert.match(line('Export button downloads a CSV.'), /✅ passed/);
  assert.match(line('The CSV has one row per booking.'), /❌ failed/);
  assert.match(line('Empty lists give a CSV with only the header.'), /⚠️ unclear/);
});

test('0131 AC1: a criterion the latest round has no result for is marked unclear', () => {
  const lines = plainRepo({ last: verdict('changes_requested', crit('pass')) }).pack('--plain').split('\n');
  assert.match(lines.find(l => l.includes('The CSV has one row per booking.')), /⚠️ unclear/);
});

test('0131 AC1: when the latest round didn\'t approve, the pack says the reviewer hasn\'t approved it yet', () => {
  const out = plainRepo({ last: verdict('changes_requested', crit('pass', 'fail', 'fail'),
    [{ id: 'F1', severity: 'blocking', state: 'open', file: 'src/export.js', issue: 'Breaks on empty input.' }]) }).pack('--plain');
  assert.match(out, /The reviewer hasn't approved this change yet\./);
  assert.doesNotMatch(out, /The reviewer approved this change\./);
});

test('0131 AC2: apart from the ticket\'s own text, the plain pack shows no file paths, finding ids, tokens, models or sessions', () => {
  const out = plainRepo({ last: verdict('approve', crit('pass', 'pass', 'pass'),
    [{ id: 'F7', severity: 'minor', state: 'open', file: 'other.txt', issue: 'Tidy other.txt.' }]) }).pack('--plain');
  for (const s of ['shared.txt', 'other.txt', 'test/export.test.js', 'speck/', 'F7', 'token', 'gpt-secret-model', 'model', 'codex', 'session', 'Elapsed', 'Changed lines'])
    assert.ok(!out.toLowerCase().includes(s.toLowerCase()), `the plain pack mentions ${s}:\n${out}`);
});

test('0131 AC2: a file path quoted in the ticket\'s own text is still shown', () => {
  const out = plainRepo({ plain: 'The export now lives in `src/export.js`.' }).pack('--plain');
  assert.match(out, /`src\/export\.js`/);
});

test('0131 AC1: a criterion that runs over several lines is shown with all of its wording', () => {
  const criteria = '1. Export button downloads a CSV.\n   Include every booking and keep accented names.\n2. The CSV has one row per booking.\n3. Empty lists give a CSV\nwith only the header.';
  const lines = plainRepo({ criteria, last: verdict('changes_requested', crit('fail', 'pass', 'pass')) }).pack('--plain').split('\n');
  const one = lines.find(l => l.includes('Export button downloads a CSV.'));
  assert.match(one, /❌ failed: Export button downloads a CSV\. Include every booking and keep accented names\.$/);
  assert.match(lines.find(l => l.includes('Empty lists')), /✅ passed: Empty lists give a CSV with only the header\.$/);
});

const riskLines = out => out.split('\n').filter(l => /risk|sensitive|closer look/i.test(l));

test('0131 AC3: a high-risk ticket gets one sentence suggesting a closer look', () => {
  const lines = riskLines(plainRepo({ risk: 'high' }).pack('--plain'));
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.match(lines[0], /high risk/i);
  assert.match(lines[0], /closer look before/i);
});

test('0131 AC3: a change touching a sensitive file gets one sentence suggesting a closer look, without naming the file', () => {
  const lines = riskLines(plainRepo({ sensitive: true }).pack('--plain'));
  assert.equal(lines.length, 1, lines.join('\n'));
  assert.match(lines[0], /closer look before/i);
  assert.doesNotMatch(lines[0], /auth\.js/);
});

test('0131 AC3: both together still give one sentence', () => {
  const lines = riskLines(plainRepo({ risk: 'high', sensitive: true }).pack('--plain'));
  assert.equal(lines.length, 1, lines.join('\n'));
});

test('0131 AC3: a low-risk change touching no sensitive file says nothing about risk', () => {
  assert.deepEqual(riskLines(plainRepo().pack('--plain')), []);
});

const MISSING = "The builder didn't write this change up in plain words.";

test('0131 AC4: a missing `## In plain words` section is reported where it would be', () => {
  const out = plainRepo({ plain: null }).pack('--plain');
  assert.ok(at(out, 'Users can export their bookings as a CSV file.') < at(out, MISSING));
  assert.ok(at(out, MISSING) < at(out, 'Export button downloads a CSV.'));
});

test('0131 AC4: an empty `## In plain words` section, or one holding only its comment, is reported the same way', () => {
  for (const plain of ['', '<!-- Filled in by the builder before approval: the change for someone who doesn\'t read code. -->']) {
    const out = plainRepo({ plain }).pack('--plain');
    assert.ok(out.includes(MISSING), out);
    assert.doesNotMatch(out, /Filled in by the builder/);
  }
});

test('0131 AC4: a written section doesn\'t get the missing sentence', () => {
  assert.ok(!plainRepo().pack('--plain').includes(MISSING));
});

test('0131 AC5: without --plain, `speck pack` prints the full review pack unchanged', () => {
  const r = plainRepo({ sensitive: true });
  const out = r.pack();
  assert.match(out, /^## 0001 · Export bookings\n\*\*Verdict:\*\* ✅ Approved by reviewer \(codex, model gpt-secret-model, effort default, round 2 of 3\)\n/);
  assert.match(out, /### Acceptance criteria\n\| # \| Criterion \| Result \| Evidence \|/);
  assert.match(out, /^- Sensitive files touched: `src\/auth\.js`$/m);
  assert.match(out, /### Actuals\n- Review rounds: 2\n- Reviewer tokens: 0\n/);
  assert.match(out, /_Generated by speck\. The merge decision is yours\._\n$/);
  assert.ok(!out.includes('The reviewer approved this change.'));
  assert.ok(!out.includes('Anyone can now download'));
});
