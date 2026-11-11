// 0636, 0638: a ticket blocked on a question to check in the running app, and speck run's agent queue for it.
import fs from 'node:fs';
import path from 'node:path';
import { T } from './panel.mjs';
import { OPTION, QUESTION, blockedRepo } from './blocked.mjs';
import { loadConfig } from '../../scripts/speck.mjs';
import { foremanAgentQueue, foremanAction } from '../../scripts/foreman-agent.mjs';

export const CHECK = 'Open Settings and look at the new Save button in the dark look';
export const ASKED = `${QUESTION}\nCheck in the app: ${CHECK}`;
export const NOW = new Date('2026-11-11T14:00:00Z');

export function settings(r, { watch = 'decide', start = 'npm run dev -- --port {port}' } = {}) { // uncommitted, so it moves no branch
  const file = path.join(r.dir, 'speck', 'config.yml');
  let text = fs.readFileSync(file, 'utf8').replace(/^watch:.*$/m, `watch: ${watch}`);
  if (start) text = text.replace(/^commands:\n/m, `commands:\n  start: "${start}"\n`);
  fs.writeFileSync(file, text);
}
// The board's entry for a ticket blocked on a question to check in the app.
export const blocked = (o = {}) => T('0001', 'blocked', { blocked_question: 'Should the old test be removed (A) or kept and fixed (B)?', blocked_recommendation: OPTION, blocked_noticeable: false, blocked_clear: true, blocked_check_in_app: CHECK, ...o });

// A repo whose ticket 0001 is blocked on a question to check in the app, and speck run's agent queue for it.
export function checking({ watch = 'decide', start, risk = 'low', question = ASKED } = {}) {
  const r = blockedRepo({ question });
  if (risk !== 'low') { fs.writeFileSync(r.file, r.ticket().replace(/^risk: .*$/m, `risk: ${risk}`)); r.g('commit', '-qam', 'risk'); }
  settings(r, { watch, ...(start !== undefined ? { start } : {}) });
  const a = { starts: [], said: [], stopped: [], resumed: [], live: new Set(), running: new Set() };
  a.q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => loadConfig(r.dir), words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: a.running, ships: { again: () => {} },
    say: m => a.said.push(m), statusOf: () => 'blocked', providers: [], cantStart: () => '', alive: pid => a.live.has(pid), withToken: () => [], inUse: () => false, startBuild: (id, argv) => { a.resumed.push({ id, argv }); a.running.add(id); },
    stopCheckApp: id => { a.stopped.push(id); return Promise.resolve(true); },
    start: (argv, cwd, log, env) => { const pid = 91000 + a.starts.length; a.starts.push({ argv, token: env.SPECK_FOREMAN_RUN, pid, brief: argv[argv.indexOf('-p') + 1] }); a.live.add(pid); return { pid, exited: () => !a.live.has(pid) }; } });
  a.check = (t = blocked({ risk })) => a.q.check([t]);
  a.end = () => { for (const s of a.starts) a.live.delete(s.pid); };
  a.act = (...args) => foremanAction(r.dir, args, { token: a.starts.at(-1).token, now: NOW });
  return { r, a };
}
