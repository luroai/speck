// 0292: a review repo whose ticket is reviewed by `reviewer: claude`, with a stand-in for Claude Code's CLI on the PATH
// that logs how it was run and answers as `claude -p --output-format json` does: a JSON envelope with the verdict in
// `result` and the session's id in `session_id`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewRepo, changesVerdict } from './speck.mjs';

export function claudeRepo({ ticketFields = '', config = '' } = {}) {
  const r = reviewRepo({ config, ticketFields: `builder: codex\nreviewer: claude\n${ticketFields}` });
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-claude-'));
  const log = path.join(bin, 'claude.log');
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, stdin: fs.readFileSync(0, 'utf8') }) + '\\n');
if (process.env.FAKE_RESUME_FAIL && args.includes('--resume')) { console.error('No conversation found'); process.exit(1); }
const v = ${JSON.stringify(JSON.stringify(changesVerdict))};
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, session_id: process.env.FAKE_SESSION || 'S1',
  result: 'Here is my review.\\n\`\`\`json\\n' + v + '\\n\`\`\`', usage: { input_tokens: 100, output_tokens: 20 } }));
`, { mode: 0o755 });
  const PATH = `${bin}${path.delimiter}${process.env.PATH}`;
  const review = (env = {}, ...a) => r.runEnv({ PATH, ...env }, 'review', '1', ...a);
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  // A second round: a fix committed and a response file, run with `env`.
  const secondRound = (env = {}) => {
    fs.writeFileSync(path.join(r.dir, 'a.txt'), 'claude-fix-marker\n');
    r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
    const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
    fs.writeFileSync(resp, '- F1: fixed for the resumed round.\n');
    return review(env, `--response=${resp}`);
  };
  return { ...r, bin, review, calls, secondRound };
}

// The value after `flag` in `args`, or undefined.
export const after = (args, flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
