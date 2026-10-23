// 0390: a review repo whose ticket is reviewed by a model provider's reviewer (`reviewer: deepseek`), with a stand-in
// for Claude Code's CLI on the PATH that logs how it was run, with what environment, and answers as
// `claude -p --output-format json` does.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { reviewRepo, changesVerdict } from './speck.mjs';
import { saveProviderKey } from '../../scripts/keys.mjs';

export const KEY = 'sk-0390-secret-Hd82q';

export function providerRepo({ ticketFields = '', key = KEY, reviewer = 'deepseek' } = {}) {
  const r = reviewRepo({ ticketFields: `builder: claude\nreviewer: ${reviewer}\n${ticketFields}` });
  if (key) saveProviderKey(r.dir, 'deepseek', key);
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-provider-'));
  const log = path.join(bin, 'claude.log');
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, env: process.env, stdin: fs.readFileSync(0, 'utf8') }) + '\\n');
const v = ${JSON.stringify(JSON.stringify(changesVerdict))};
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, session_id: 'DS1',
  result: '\`\`\`json\\n' + v + '\\n\`\`\`', usage: { input_tokens: 100, output_tokens: 20 } }));
`, { mode: 0o755 });
  const PATH = `${bin}${path.delimiter}${process.env.PATH}`;
  const review = (env = {}, ...a) => r.runEnv({ PATH, ...env }, 'review', '1', ...a);
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const secondRound = (env = {}) => {
    fs.writeFileSync(path.join(r.dir, 'a.txt'), 'provider-fix\n');
    r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
    const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
    fs.writeFileSync(resp, '- F1: fixed.\n');
    return review(env, `--response=${resp}`);
  };
  return { ...r, bin, review, calls, secondRound };
}
