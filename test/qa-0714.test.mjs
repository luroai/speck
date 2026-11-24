// 0714: a check in the running app always says QA did it, even with QA's settings blank.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { gitEnv } from './support/panel.mjs';
import { CHECK, ASKED, NOW, settings, blocked } from './support/app-check.mjs';
import { OPTION, blockedRepo } from './support/blocked.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { foremanAgentQueue, foremanAction } from '../scripts/foreman-agent.mjs';

Object.assign(process.env, gitEnv);

test('0714 AC1+AC2: with QA\'s settings blank, the check is QA\'s in the log, and runs on the watch agent\'s', async () => {
  const r = blockedRepo({ question: ASKED });
  settings(r, { watch: 'decide' });
  const file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').trimEnd()}\nwatch_agent: claude\nwatch_model: opus\nwatch_effort: low\n`);
  const said = [], starts = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again: () => {} },
    say: m => said.push(m), statusOf: () => 'blocked', providers: [], cantStart: () => '', alive: pid => live.has(pid), withToken: () => [], inUse: () => false, startBuild: () => {},
    heldAgent: () => false, readyAgents: () => ['claude'], stopCheckApp: () => Promise.resolve(true),
    start: (argv, cwd, log, env) => { const pid = 93000 + starts.length; starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; } });
  q.check([blocked()]);
  assert.equal(starts[0].argv[0], 'claude');
  assert.ok(starts[0].argv.includes('opus') && starts[0].argv.includes('low'), 'still the watch agent\'s model and effort');
  assert.ok(said.some(l => /QA is checking it in the app on claude/.test(l)), said.join('\n'));
  foremanAction(r.dir, ['decide', '0001', OPTION, '--saw=It shows as asked', '--why=Fine'], { token: starts.at(-1).token, now: NOW });
  for (const s of starts) live.delete(s.pid);
  q.check([blocked({ status: 'building' })]);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(said.some(l => /QA checked it in the app and/.test(l)), said.join('\n'));
  assert.ok(!said.some(l => /I'm looking into it/.test(l)), said.join('\n'));
});
