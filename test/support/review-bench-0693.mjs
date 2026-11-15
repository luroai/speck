// 0693: fake agents for a round that passes along reviewer_bench: a `codex` reviewer, a `claude` and a Cursor `agent`,
// each signed in and reviewing, and each refusing on its usage limit when FAKE_REFUSE names it (a comma-separated list).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BUILD_ENV } from '../../scripts/build-env.mjs';
import { reviewRepo } from './speck.mjs';

const verdict = { verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' };
// What each refuses with: Claude names its zone, so its reset is read; Codex's and Cursor's say no time.
const REFUSALS = { claude: 'You’ve hit your usage limit · resets 11pm (UTC)', cursor: 'You’ve hit your usage limit. Try again later.' };

export function benchAgents() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0693-bin-')), log = path.join(bin, 'calls.log');
  const head = agent => `#!${process.execPath}\nconst fs = require('fs'), args = process.argv.slice(2), log = ${JSON.stringify(log)};
const refuses = (process.env.FAKE_REFUSE || '').split(',').includes(${JSON.stringify(agent)});\n`;
  // Claude and Cursor review as reviewers set up as a command: a JSON envelope with the verdict as its result.
  const commandAgent = (agent, signedIn) => `${head(agent)}${signedIn}
fs.appendFileSync(log, JSON.stringify({ agent: ${JSON.stringify(agent)}, args }) + '\\n');
fs.readFileSync(0, 'utf8');
if (refuses) { console.log(JSON.stringify({ is_error: true, result: ${JSON.stringify(REFUSALS[agent])} })); process.exit(1); }
console.log(JSON.stringify({ result: JSON.stringify(${JSON.stringify(verdict)}), session_id: 'S1' }));
`;
  fs.writeFileSync(path.join(bin, 'claude'), commandAgent('claude', `if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }`), { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'agent'), commandAgent('cursor', `if (args[0] === 'status') { console.log('Logged in as someone'); process.exit(0); }`), { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'codex'), `${head('codex')}
if (args[0] === 'login') process.exit(0);
fs.appendFileSync(log, JSON.stringify({ agent: 'codex', args }) + '\\n');
fs.readFileSync(0, 'utf8');
if (refuses) { console.log(JSON.stringify({ type: 'turn.failed', error: { message: 'You\\u2019ve hit your usage limit. Try again later.' } })); process.exit(1); }
fs.writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify(${JSON.stringify(verdict)}));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
`, { mode: 0o755 });
  const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l).agent) : []);
  return { PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter), calls };
}

// A review repo whose codex reviewer has claude, then cursor, on its bench, with a build speck run started.
export function benchRepo() {
  const r = reviewRepo({ ticketFields: 'status: building\nbuilder: cursor', config: '\nreviewer_bench: claude, cursor\nallow_same_model_review: true\n' });
  const agents = benchAgents();
  const review = (refuse, more = {}) => r.runEnv({ PATH: agents.PATH, [BUILD_ENV]: 'session-1', FAKE_REFUSE: refuse, ...more }, 'review', '1');
  return { r, ...agents, review };
}
