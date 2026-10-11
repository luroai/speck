import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, CLI, env, freePort, startPanel, stop, request } from './support/panel.mjs';

// ---------- 0057: file ticketed idea notes in speck/ideas/done ----------

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run('init', '--skip-checks').status, 0);
  const at = p => path.join(dir, p);
  const write = (p, text) => { fs.mkdirSync(path.dirname(at(p)), { recursive: true }); fs.writeFileSync(at(p), text); return p; };
  const read = p => fs.readFileSync(at(p), 'utf8');
  const exists = p => fs.existsSync(at(p));
  const source = p => (read(p).match(/^source: (.*?)\s*(#.*)?$/m) || [])[1];
  return { dir, run, write, read, exists, source };
}
const note = status => `# CSV export\n\nCaptured: 2026-10-08 · Status: ${status}\n\n## What\nExport bookings.\n`;
const ticketFile = (id, src, status = 'draft') => `---\nid: "${id}"\ntitle: "T ${id}"\nstatus: ${status}\nsize: S\nrisk: low\nbuilder: claude\nreviewer: codex\nsource: ${src}               # e.g. speck/ideas/x.md\n---\n# ${id} · T ${id}\n\n## Problem\nP.\n`;

test('0057 AC1: speck new --source on an inbox note sets it ticketed, files it in speck/ideas/done/ and writes the new path as source', () => {
  const r = repo();
  r.write('speck/ideas/csv.md', note('idea'));
  const out = r.run('new', 'Export CSV', '--source=speck/ideas/csv.md');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), path.join('speck', 'tickets', '0001-export-csv.md'));
  assert.ok(!r.exists('speck/ideas/csv.md'), 'gone from the inbox folder');
  assert.equal(r.read('speck/ideas/done/csv.md'), note('ticketed (0001)'), 'same name, status set, nothing else changed');
  assert.equal(r.source('speck/tickets/0001-export-csv.md'), '"speck/ideas/done/csv.md"');
});

test('0057 AC1: a note with no Status line is warned about and left where it is', () => {
  const r = repo();
  r.write('speck/ideas/plain.md', '# Plain\n');
  const out = r.run('new', 'Plain', '--source=speck/ideas/plain.md');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stderr, /Status:/);
  assert.ok(r.exists('speck/ideas/plain.md'));
  assert.equal(r.source('speck/tickets/0001-plain.md'), '"speck/ideas/plain.md"');
});

test('0057 AC1: a name already taken in speck/ideas/done/ is refused before anything is written', () => {
  const r = repo();
  r.write('speck/ideas/csv.md', note('idea'));
  r.write('speck/ideas/done/csv.md', note('ticketed (0009)'));
  const out = r.run('new', 'Export CSV', '--source=speck/ideas/csv.md');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /speck\/ideas\/done\/csv\.md/);
  assert.doesNotMatch(out.stderr, /    at /, 'no stack trace');
  assert.deepEqual(fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).filter(f => f.endsWith('.md')), [], 'no ticket');
  assert.equal(r.read('speck/ideas/csv.md'), note('idea'));
  assert.equal(r.read('speck/ideas/done/csv.md'), note('ticketed (0009)'));
});

test('0057 AC2: --source in speck/ideas/done/ adds the id and leaves the note there; the old path finds the filed note', () => {
  const r = repo();
  r.write('speck/ideas/csv.md', note('idea'));
  assert.equal(r.run('new', 'First', '--source=speck/ideas/csv.md').status, 0);
  const second = r.run('new', 'Second', '--source=speck/ideas/done/csv.md');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(r.read('speck/ideas/done/csv.md'), note('ticketed (0001, 0002)'));
  assert.equal(r.source('speck/tickets/0002-second.md'), '"speck/ideas/done/csv.md"');
  // The old inbox path, after the note has moved.
  const third = r.run('new', 'Third', '--source=speck/ideas/csv.md');
  assert.equal(third.status, 0, third.stderr);
  assert.equal(r.read('speck/ideas/done/csv.md'), note('ticketed (0001, 0002, 0003)'));
  assert.equal(r.source('speck/tickets/0003-third.md'), '"speck/ideas/done/csv.md"');
  assert.ok(!r.exists('speck/ideas/csv.md'));
  assert.deepEqual(fs.readdirSync(path.join(r.dir, 'speck', 'ideas', 'done')), ['csv.md']);
  // A note in neither place is still refused.
  const ghost = r.run('new', 'Ghost', '--source=speck/ideas/nope.md');
  assert.notEqual(ghost.status, 0);
  assert.match(ghost.stderr, /speck\/ideas\/nope\.md/);
});

test('0057 AC3: re-running init files ticketed notes and rewrites the tickets that pointed at them; other notes stay', () => {
  const r = repo();
  r.write('speck/ideas/a.md', note('ticketed (0001)'));
  r.write('speck/ideas/b.md', note('ticketed (0002, 0003)'));
  r.write('speck/ideas/c.md', note('idea'));
  r.write('speck/ideas/d.md', note('inbox'));
  r.write('speck/ideas/e.md', note('dropped'));
  r.write('speck/ideas/f.md', '# No status\n');
  r.write('speck/tickets/0001-a.md', ticketFile('0001', '"speck/ideas/a.md"'));
  r.write('speck/tickets/0002-b.md', ticketFile('0002', 'speck/ideas/b.md'));
  r.write('speck/tickets/done/0003-b.md', ticketFile('0003', '"speck/ideas/b.md"', 'done'));
  r.write('speck/tickets/0004-c.md', ticketFile('0004', '"speck/ideas/c.md"'));
  r.write('speck/tickets/0005-x.md', ticketFile('0005', '""'));
  const out = r.run('init', '--skip-checks');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /2 ticketed idea notes/);
  assert.equal(r.read('speck/ideas/done/a.md'), note('ticketed (0001)'));
  assert.equal(r.read('speck/ideas/done/b.md'), note('ticketed (0002, 0003)'));
  for (const f of ['a', 'b']) assert.ok(!r.exists(`speck/ideas/${f}.md`));
  for (const f of ['c', 'd', 'e', 'f']) assert.ok(r.exists(`speck/ideas/${f}.md`), `${f} stays put`);
  assert.equal(r.source('speck/tickets/0001-a.md'), '"speck/ideas/done/a.md"');
  assert.equal(r.source('speck/tickets/0002-b.md'), '"speck/ideas/done/b.md"');
  assert.equal(r.source('speck/tickets/done/0003-b.md'), '"speck/ideas/done/b.md"');
  assert.equal(r.source('speck/tickets/0004-c.md'), '"speck/ideas/c.md"');
  assert.equal(r.source('speck/tickets/0005-x.md'), '""', 'a blank source is left blank');
  assert.match(r.read('speck/tickets/0001-a.md'), /^source: "speck\/ideas\/done\/a\.md" +# e\.g\./m, 'the comment is kept');
  // Running it again changes nothing.
  const snapshot = () => ['speck/tickets/0001-a.md', 'speck/tickets/done/0003-b.md', 'speck/ideas/done/a.md'].map(r.read).join('');
  const was = snapshot();
  const again = r.run('init', '--skip-checks');
  assert.equal(again.status, 0, again.stderr);
  assert.doesNotMatch(again.stdout, /ticketed idea note/);
  assert.equal(snapshot(), was);
});

test('0057 AC3: a ticketed note whose name is taken in done/ is left with a message, and its tickets keep their source', () => {
  const r = repo();
  r.write('speck/ideas/a.md', note('ticketed (0001)'));
  r.write('speck/ideas/done/a.md', note('ticketed (0007)'));
  r.write('speck/tickets/0001-a.md', ticketFile('0001', '"speck/ideas/a.md"'));
  const out = r.run('init', '--skip-checks');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /speck\/ideas\/a\.md/);
  assert.equal(r.read('speck/ideas/a.md'), note('ticketed (0001)'));
  assert.equal(r.read('speck/ideas/done/a.md'), note('ticketed (0007)'));
  assert.equal(r.source('speck/tickets/0001-a.md'), '"speck/ideas/a.md"');
});

test('0057 AC4: speck status counts filed notes as ticketed; --json lists only speck/ideas/', () => {
  const r = repo();
  r.write('speck/ideas/a.md', note('idea'));
  r.write('speck/ideas/b.md', note('ticketed (0001)'));
  r.write('speck/ideas/done/c.md', note('ticketed (0002)'));
  r.write('speck/ideas/done/d.md', note('ticketed (0003)'));
  r.run('new', 'Something');
  assert.match(r.run('status').stdout, /^IDEAS \(4: 1 waiting, 3 ticketed\) in speck\/ideas\/$/m);
  const json = JSON.parse(r.run('status', '--json').stdout);
  assert.deepEqual(json.ideas.map(i => i.path), ['speck/ideas/a.md', 'speck/ideas/b.md']);
});

test('0057 AC4: the panel lists only notes in speck/ideas/', async () => {
  const r = repo();
  r.write('speck/ideas/a.md', note('idea'));
  r.write('speck/ideas/done/c.md', note('ticketed (0002)'));
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = p;
  try {
    const res = await request(port, { pathName: '/api/state' });
    assert.deepEqual(JSON.parse(res.body).ideas.map(i => i.path), ['speck/ideas/a.md']);
  } finally { await stop(p); }
});

test('0057 AC5: the overlap check, /speck-ticket and inbox triage read speck/ideas/done/ too', () => {
  const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const capture = read('skills/speck-capture/SKILL.md');
  const check = capture.slice(capture.indexOf('## Check for overlap first'), capture.indexOf('## Steps'));
  assert.match(check, /every note in `speck\/ideas\/` and `speck\/ideas\/done\/`/);
  const ticket = read('skills/speck-ticket/SKILL.md');
  const steps = ticket.slice(ticket.indexOf('## Steps'), ticket.indexOf('## Triage the inbox'));
  assert.match(steps, /`speck\/ideas\/done\/`/, '/speck-ticket reads filed notes');
  assert.match(steps, /every idea note in `speck\/ideas\/` and `speck\/ideas\/done\/`/, 'its overlap check covers them');
  const triage = ticket.slice(ticket.indexOf('## Triage the inbox'), ticket.indexOf('## Rules'));
  assert.match(triage, /idea note in `speck\/ideas\/` or `speck\/ideas\/done\/`/, 'triage compares against filed notes');
  // A build's follow-up check runs the same comparison.
  assert.match(read('skills/speck-build/SKILL.md'), /every idea note in `speck\/ideas\/` and `speck\/ideas\/done\/`/);
});
