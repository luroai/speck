import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, fakePage, queueRows, round, panelRepo } from './support/panel.mjs';
import { statusData } from '../scripts/speck.mjs';

// ---------- 0382: name the model on the review step ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const asked = n => ({ ...round(n, 10), verdict: 'changes_requested' });
const reviewing = (id, o) => T(id, 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', builder: 'claude', reviewer: 'cursor', ...o });

function fake(tickets) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const say = (p, id) => p.all(rowOf(p, id)).filter(n => /\bsay\b/.test(n.className || ''))[0].textContent;

// A panel repo whose config has `cfgModel` as reviewer_model and whose ticket 0001 has `ticketModel`.
function repo(cfgModel, ticketModel) {
  const r = panelRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^reviewer_model:.*$/m, `reviewer_model: "${cfgModel}"`));
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^reviewer_model:.*$/m, `reviewer_model: "${ticketModel}"`));
  return statusData(r.dir).tickets.find(t => t.id === '0001');
}

test('0382 AC1: a ticket in review whose model is set names the model as written, with the round', async () => {
  const p = fake([
    reviewing('0701', { review_running: 2, rounds: [asked(1)], reviewer_model: 'grok-4.7-high', review_model: 'grok-4.7-high' }),
    reviewing('0702', { review_running: null, reviewer: 'claude', reviewer_model: 'opus-x', review_model: 'opus-x' }),
  ]);
  await p.settle();
  assert.equal(say(p, '0701'), 'grok-4.7-high is reviewing · round 2');
  assert.equal(say(p, '0702'), 'opus-x is reviewing · round 1');
  assert.doesNotMatch(say(p, '0701'), /Cursor/);
  assert.doesNotMatch(say(p, '0702'), /Claude/);
});

test('0382 AC1: the board gives each ticket the model its review runs on, the ticket\'s own when it is set', () => {
  assert.equal(repo('gpt-6.1-sol', 'grok-4.7-high').review_model, 'grok-4.7-high');
});

test('0382 AC2: with the ticket\'s model blank the board gives the config\'s, and with both blank none', () => {
  assert.equal(repo('gpt-6.1-sol', '').review_model, 'gpt-6.1-sol');
  assert.equal(repo('', '').review_model, null);
});

test('0382 AC2: with no model, the sentence names the reviewer as before, or the reviewer when none is set', async () => {
  const p = fake([
    reviewing('0711', { review_running: 1, reviewer: 'codex', review_model: null }),
    reviewing('0712', { review_running: 1, reviewer: '', review_model: null }),
    reviewing('0713', { review_running: 1, reviewer: 'codex', review_model: '  ' }),
  ]);
  await p.settle();
  assert.equal(say(p, '0711'), 'Codex is reviewing · round 1');
  assert.equal(say(p, '0712'), 'The reviewer is reviewing · round 1');
  assert.equal(say(p, '0713'), 'Codex is reviewing · round 1');
});

test('0382 AC3: while the builder fixes a round\'s findings, the sentence names the builder, not the model', async () => {
  const p = fake([reviewing('0721', { rounds: [asked(1), asked(2)], review_running: null, review_model: 'grok-4.7-high' })]);
  await p.settle();
  assert.equal(say(p, '0721'), "Claude is fixing round 2's findings");
});
