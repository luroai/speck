// 0332: a review repo whose ticket is reviewed by `reviewer: cursor`, with a stand-in for Cursor's CLI on the PATH, as
// `agent` or as `cursor-agent`, that logs how it was run and answers as `agent -p --output-format json` does: one JSON
// object with the reply in `result` and the chat's id in `session_id`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reviewRepo, changesVerdict } from './speck.mjs';

export function cursorRepo({ ticketFields = '', config = '', cli = 'agent', onlyCli = false } = {}) {
  const r = reviewRepo({ config, ticketFields: `builder: codex\nreviewer: cursor\n${ticketFields}` });
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cursor-'));
  const log = path.join(bin, 'cursor.log');
  fs.writeFileSync(path.join(bin, cli), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ cli: ${JSON.stringify(cli)}, args, stdin: fs.readFileSync(0, 'utf8') }) + '\\n');
if (process.env.FAKE_RESUME_FAIL && args.includes('--resume')) { console.error('Chat not found'); process.exit(1); }
const v = ${JSON.stringify(JSON.stringify(changesVerdict))};
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, duration_ms: 10, session_id: process.env.FAKE_SESSION || 'C1',
  result: 'Here is my review.\\n\`\`\`json\\n' + v + '\\n\`\`\`' }));
`, { mode: 0o755 });
  // onlyCli: a PATH with git and the stand-in, and no other Cursor CLI the machine may have installed.
  if (onlyCli) fs.symlinkSync(spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim(), path.join(bin, 'git'));
  const PATH = onlyCli ? bin : `${bin}${path.delimiter}${process.env.PATH}`;
  const review = (env = {}, ...a) => r.runEnv({ PATH, ...env }, 'review', '1', ...a);
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  // A second round: a fix committed and a response file, run with `env`.
  const secondRound = (env = {}) => {
    fs.writeFileSync(path.join(r.dir, 'a.txt'), 'cursor-fix-marker\n');
    r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
    const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
    fs.writeFileSync(resp, '- F1: fixed for the resumed round.\n');
    return review(env, `--response=${resp}`);
  };
  return { ...r, bin, PATH, review, calls, secondRound };
}
