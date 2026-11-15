// A ticket speck's agent has asked you about, for the tests on answering it (0318, 0680).
import { T } from './panel.mjs';
import { blockedRepo } from './blocked.mjs';
import { loadConfig } from '../../scripts/speck.mjs';
import { foremanAgentQueue, foremanAction } from '../../scripts/foreman-agent.mjs';

export const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
export const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
export const ASKED = 'Should it keep the old test?';

// The Foreman agent's queue, as 0287's tests have it: starts and resumed builds are kept, and an agent runs until end().
export function agents(r) {
  const starts = [], resumed = [], said = [], again = [], running = new Set(), live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix' }),
    words: WORDS, cfg: CFG, max: 1, running, ships: { again: id => again.push(id) }, say: m => said.push(m),
    startBuild: (id, argv) => { resumed.push({ id, argv }); running.add(id); },
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  return { q, starts, resumed, said, again, running, end: s => live.delete(s.pid) };
}

// A repo whose ticket 0001 (at `status`, blocked on `question` when given) the Foreman agent has asked you about, with the agent ended.
export function asked(status = 'building', question) {
  const r = blockedRepo(question === undefined ? { status } : { status, question }), a = agents(r);
  a.q.stuck({ id: '0001', what: 'its build ended', log: '' });
  a.q.check([T('0001', status)]);
  foremanAction(r.dir, ['ask', '0001', ASKED, '--why=the build stopped on a choice'], { token: a.starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  a.end(a.starts[0]);
  a.q.check([T('0001', status)]);
  return { r, a, check: (s = status) => a.q.check([T('0001', s)]) };
}
