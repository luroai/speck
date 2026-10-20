import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runRepo } from './support/run.mjs';
import { markStillReady, readyAgain } from '../scripts/build-records.mjs';
import { foremanSubject } from '../scripts/foreman-agent.mjs';

// ---------- 0349: a Foreman's commit to a still-ready ticket doesn't launch its build again ----------

const runs = dir => { const d = path.join(dir, 'speck', '.cache', 'runs'); fs.mkdirSync(d, { recursive: true }); return d; };
const ticket = { id: '0001', path: 'speck/tickets/0001-t.md' };
// A build of 0001 that has ended, as speck run records it, with the ticket's last commit kept as it ended still ready.
const ended = r => {
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', session: 's', pid: 123, exited: '2026-10-19T10:00:00.000Z', exit_code: 0 }));
  markStillReady(runs(r.dir), '0001', r.g('log', '-1', '--format=%H', '--', ticket.path));
};
const commitTicket = (r, line, subject) => {
  fs.appendFileSync(path.join(r.dir, ticket.path), `\n${line}\n`);
  r.g('commit', '-qam', subject);
};
const again = r => readyAgain(r.dir, runs(r.dir), ticket);

test('0349 AC1: the Foreman\'s commits to a still-ready ticket don\'t launch it again', () => {
  const r = runRepo();
  ended(r);
  commitTicket(r, '- The Foreman asked a question.', `${foremanSubject('0001')} asked`);
  assert.equal(again(r), false);
  commitTicket(r, '- The Foreman asked again.', `${foremanSubject('0001')} asked\n\nWhy: still waiting`);
  assert.equal(again(r), false);
});

test('0349 AC1: a build that ended just after a Foreman commit isn\'t launched again by the next one', () => {
  const r = runRepo();
  commitTicket(r, '- The Foreman asked a question.', `${foremanSubject('0001')} asked`);
  ended(r); // the commit kept is the Foreman's own
  assert.equal(again(r), false);
  commitTicket(r, '- The Foreman asked again.', `${foremanSubject('0001')} asked`);
  assert.equal(again(r), false);
});

test('0349 AC1: only a subject that starts with the Foreman\'s counts as the Foreman\'s', () => {
  const r = runRepo();
  ended(r);
  commitTicket(r, 'Edited.', `ready again, after ${foremanSubject('0001')} asked`);
  assert.equal(again(r), true);
  const s = runRepo();
  ended(s);
  commitTicket(s, 'Edited.', `${foremanSubject('0002')} asked`); // another ticket's Foreman subject
  assert.equal(again(s), true);
});

test('0349 AC2: a commit that isn\'t the Foreman\'s still launches it again, including one after a Foreman commit', () => {
  const r = runRepo();
  ended(r);
  commitTicket(r, 'Edited.', 'speck(0001): criterion corrected');
  assert.equal(again(r), true);
  const s = runRepo();
  ended(s);
  commitTicket(s, '- The Foreman asked a question.', `${foremanSubject('0001')} asked`);
  assert.equal(again(s), false);
  commitTicket(s, 'Answered.', 'speck(0001): ready');
  assert.equal(again(s), true);
  commitTicket(s, '- The Foreman noted it.', `${foremanSubject('0001')} noted`); // a Foreman commit after it doesn't hide it
  assert.equal(again(s), true);
});

test('0349 AC2: a kept commit that git doesn\'t know still counts as committed since', () => {
  const r = runRepo();
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', pid: 1, exited: 'x', still_ready_commit: '0'.repeat(40) }));
  assert.equal(again(r), true);
  fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify({ id: '0001', pid: 1, exited: 'x', still_ready_commit: '--all' }));
  assert.equal(again(r), true);
});
