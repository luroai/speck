// 0529: a price table of known rates for pricing review rounds, a Codex session file, and a review repo whose ticket is
// reviewed by a stand-in for Claude Code's CLI that prints the usage, modelUsage and total_cost_usd it's given.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewRepo, changesVerdict } from './speck.mjs';

// Rates in dollars per token: [input, cached input, cache writes, output]. Kept in a speck-keep-* folder, so it lasts
// the whole test file (tmp.mjs).
export function priceFile() {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-prices-')), 'prices.json');
  fs.writeFileSync(file, JSON.stringify({ source: 'test', taken: '2026-10-27', models: {
    'openai/gpt-test': [0.000002, 0.0000002, null, 0.00001],
    'anthropic/claude-test': [0.000003, 0.0000003, 0.00000375, 0.000015],
  } }));
  return file;
}

// A Codex home whose sessions folder has a rollout file for `thread`, recording `model` for each of its turns.
export function codexHome(thread, models) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-home-'));
  const dir = path.join(home, 'sessions', '2026', '10', '27');
  fs.mkdirSync(dir, { recursive: true });
  const lines = [{ type: 'session_meta', payload: { id: thread } }, ...models.map(model => ({ type: 'turn_context', payload: { model } }))];
  fs.writeFileSync(path.join(dir, `rollout-2026-10-27T11-45-04-${thread}.jsonl`), lines.map(l => JSON.stringify(l)).join('\n') + '\n');
  return home;
}

// FAKE_ENVELOPE: JSON merged into the result envelope the stand-in prints.
export function claudeCostRepo() {
  const r = reviewRepo({ ticketFields: 'builder: codex\nreviewer: claude' });
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-claude-cost-'));
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
const fs = require('fs');
fs.readFileSync(0, 'utf8');
const v = ${JSON.stringify(JSON.stringify(changesVerdict))};
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, session_id: 'S1',
  result: '\`\`\`json\\n' + v + '\\n\`\`\`', ...JSON.parse(process.env.FAKE_ENVELOPE || '{}') }));
`, { mode: 0o755 });
  const PATH = `${bin}${path.delimiter}${process.env.PATH}`;
  const review = (env = {}, ...a) => r.runEnv({ PATH, ...env }, 'review', '1', ...a);
  const secondRound = (env = {}) => {
    fs.writeFileSync(path.join(r.dir, 'a.txt'), 'claude-cost-fix\n');
    r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
    const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
    fs.writeFileSync(resp, '- F1: fixed.\n');
    return review(env, `--response=${resp}`);
  };
  return { ...r, review, secondRound };
}
