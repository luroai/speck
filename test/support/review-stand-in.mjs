// 0649, 0692: fake agents for review rounds on a stand-in: a `claude` that reviews and a `codex` that can refuse on
// its usage limit, and a review repo with reviewer_bench set to claude.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BUILD_ENV } from '../../scripts/build-env.mjs';
import { reviewRepo } from './speck.mjs';

const verdict = v => ({ verdict: v, criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' });
// A fake `claude`, signed in unless FAKE_SIGNED_OUT, that reviews with FAKE_VERDICT and logs its arguments and prompts,
// and a fake `codex`, signed in, refusing on its limit when FAKE_REFUSE is set.
export function fakeAgents() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0649-bin-')), log = path.join(bin, 'calls.log');
  const head = `#!${process.execPath}\nconst fs = require('fs'), args = process.argv.slice(2), log = ${JSON.stringify(log)};\n`;
  fs.writeFileSync(path.join(bin, 'claude'), `${head}
if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: !process.env.FAKE_SIGNED_OUT })); process.exit(0); }
fs.appendFileSync(log, JSON.stringify({ agent: 'claude', args, prompt: fs.readFileSync(0, 'utf8') }) + '\\n');
console.log(JSON.stringify({ result: JSON.stringify(process.env.FAKE_VERDICT === 'approve' ? ${JSON.stringify(verdict('approve'))} : ${JSON.stringify(verdict('changes_requested'))}), session_id: 'C1' }));
`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'codex'), `${head}
if (args[0] === 'login') process.exit(0);
fs.appendFileSync(log, JSON.stringify({ agent: 'codex', args, prompt: fs.readFileSync(0, 'utf8') }) + '\\n');
if (process.env.FAKE_REFUSE) { console.log(JSON.stringify({ type: 'turn.failed', error: { message: 'You\\u2019ve hit your usage limit. Try again later.' } })); process.exit(1); }
fs.writeFileSync(args[args.indexOf('-o') + 1], JSON.stringify(${JSON.stringify(verdict('changes_requested'))}));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
`, { mode: 0o755 });
  const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : []);
  return { PATH: [bin, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter), calls };
}
export function standInRepo() {
  const r = reviewRepo({ ticketFields: 'status: building\nbuilder: cursor\nreviewer_model: gpt-own', config: '\nreviewer_bench: claude\n' });
  const agents = fakeAgents();
  const review = (more = {}) => r.runEnv({ PATH: agents.PATH, [BUILD_ENV]: 'session-1', FAKE_VERDICT: 'changes_requested', ...more }, 'review', '1');
  const commit = () => { r.git('add', '-A'); r.git('commit', '-qm', 'round'); };
  return { r, ...agents, review, commit };
}
