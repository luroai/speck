import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ticketedStatus } from '../scripts/speck.mjs';
import { CLI, gitIn } from './support/speck.mjs';

function ideaRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8' });
  gitIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const ideas = path.join(dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  const write = (name, text) => { fs.writeFileSync(path.join(ideas, name), text); return `speck/ideas/${name}`; };
  // A ticketed note is filed in speck/ideas/done/ (0057), so it's read from there once it has moved.
  const read = name => fs.readFileSync(path.join(ideas, fs.existsSync(path.join(ideas, name)) ? '' : 'done', name), 'utf8');
  const tickets = () => fs.readdirSync(path.join(dir, 'speck', 'tickets')).filter(f => f.endsWith('.md'));
  return { dir, run, write, read, tickets };
}
const ideaNote = status => `# CSV export\n\nCaptured: 2026-10-08 · Status: ${status}\n\n## What\nExport bookings. Status: not a status line.\n`;

test('0009 AC1: speck new --source marks the idea ticketed with the new id and changes nothing else', () => {
  const r = ideaRepo();
  const src = r.write('csv.md', ideaNote('idea'));
  const out = r.run('new', 'Export bookings as CSV', `--source=${src}`);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), path.join('speck', 'tickets', '0001-export-bookings-as-csv.md'), 'stdout is still just the ticket path');
  assert.equal(r.read('csv.md'), ideaNote('ticketed (0001)'));
  // Any earlier value is replaced, and Windows line endings are kept.
  const crlf = r.write('crlf.md', ideaNote('idea (after v0.1)').replace(/\n/g, '\r\n'));
  assert.equal(r.run('new', 'Another', `--source=${crlf}`).status, 0);
  assert.equal(r.read('crlf.md'), ideaNote('ticketed (0002)').replace(/\n/g, '\r\n'));
});

test('0009 AC2: a second ticket from the same idea is added to the list, never twice', () => {
  const r = ideaRepo();
  const src = r.write('csv.md', ideaNote('idea'));
  r.run('new', 'First', `--source=${src}`);
  r.run('new', 'Second', `--source=${src}`);
  assert.equal(r.read('csv.md'), ideaNote('ticketed (0001, 0002)'));
  // An id that's already listed isn't added again.
  r.write('again.md', ideaNote('ticketed (0002, 0003)'));
  assert.equal(r.run('new', 'Third', '--source=speck/ideas/again.md').status, 0);
  assert.equal(r.read('again.md'), ideaNote('ticketed (0002, 0003)'));
});

test('0009 AC3: a missing source is refused with no ticket, and a note with no Status line only warns', () => {
  const r = ideaRepo();
  const out = r.run('new', 'Ghost', '--source=speck/ideas/nope.md');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /speck\/ideas\/nope\.md/);
  assert.doesNotMatch(out.stderr, /    at /, 'no stack trace');
  assert.deepEqual(r.tickets(), [], 'no ticket created');
  const plain = '# Loose note\n\nNo status here.\n';
  const src = r.write('plain.md', plain);
  const warned = r.run('new', 'Loose', `--source=${src}`);
  assert.equal(warned.status, 0, warned.stderr);
  assert.match(warned.stderr, /Status:/);
  assert.match(warned.stderr, /plain\.md/);
  assert.deepEqual(r.tickets(), ['0001-loose.md'], 'ticket still created, with the next number');
  assert.equal(r.read('plain.md'), plain, 'note unchanged');
  // With no --source, nothing about ideas is printed.
  assert.equal(r.run('new', 'No source').stderr, '');
});

test('0009 AC4: speck status shows ideas as waiting or ticketed', () => {
  const r = ideaRepo();
  r.write('a.md', ideaNote('idea'));
  r.write('b.md', ideaNote('idea (separate project)'));
  r.write('c.md', '# No status line\n');
  r.write('d.md', ideaNote('ticketed (0006)'));
  r.run('new', 'Something');
  assert.match(r.run('status').stdout, /^IDEAS \(4: 3 waiting, 1 ticketed\) in speck\/ideas\/$/m);
});

test('0009 AC1/AC2: ticketedStatus replaces other values, extends the list and keeps any note after it', () => {
  assert.equal(ticketedStatus('idea', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('ticketedfoo', '0011'), 'ticketed (0011)', 'a different word is replaced, not extended');
  assert.equal(ticketedStatus('ticketed', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('ticketed (0011)', '0012'), 'ticketed (0011, 0012)');
  assert.equal(ticketedStatus('ticketed (0011, 0012)', '0011'), 'ticketed (0011, 0012)');
  assert.equal(ticketedStatus('ticketed (0006) and split later', '0013'), 'ticketed (0006, 0013) and split later');
});

// ---------- auto-ship: ship as soon as the reviewer approves, when config allows it ----------
