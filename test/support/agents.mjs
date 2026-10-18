// 0288: stand-ins for Claude Code, Codex and Cursor's CLI, so a test decides what each says without any of them
// installed. Each is a shell script answering only the commands speck asks, with what `spec` gives.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SLEEP = spawnSync('sh', ['-c', 'command -v sleep'], { encoding: 'utf8' }).stdout.trim() || '/bin/sleep';

// One answer: { out, code, sleep }.
const answer = (dir, name, { out = '', code = 0, sleep = 0 } = {}) => {
  fs.writeFileSync(path.join(dir, `${name}.out`), out);
  return `${sleep ? `exec ${SLEEP} ${sleep}\n` : ''}while IFS= read -r line || [ -n "$line" ]; do printf '%s\\n' "$line"; done < "${dir}/${name}.out"\nexit ${code}`;
};

// A folder holding the stand-ins `spec` names: { claude: { auth }, codex: { login, models }, agent: { status, models } },
// each an answer. One left out isn't installed. Returns the folder, to be the whole PATH.
export function fakeAgents(spec = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-agents-'));
  const script = (name, cases) => fs.writeFileSync(path.join(dir, name), `#!/bin/sh\ncase "$*" in\n${
    Object.entries(cases).map(([args, a]) => `"${args}")\n${answer(dir, `${name}-${args.replace(/\W+/g, '-')}`, a)}\n;;`).join('\n')}\n*) exit 9 ;;\nesac\n`, { mode: 0o755 });
  if (spec.claude) script('claude', { 'auth status': spec.claude.auth });
  if (spec.codex) script('codex', { 'login status': spec.codex.login, 'debug models': spec.codex.models });
  if (spec.agent) script(spec.agent.as || 'agent', { status: spec.agent.status, models: spec.agent.models });
  return dir;
}

export const CODEX_CATALOGUE = JSON.stringify({ models: [
  { slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: 'The frontier model for hard work.', visibility: 'list', supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }] },
  { slug: 'gpt-small', visibility: 'list', supported_reasoning_levels: [] },
  { slug: 'gpt-secret', display_name: 'Secret', description: 'Hidden.', visibility: 'hide', supported_reasoning_levels: [] },
] });

export const CURSOR_MODELS = [
  'Available models',
  '',
  'auto - Auto',
  'opus-4.6-thinking - Claude 4.6 Opus (Thinking)  (default)',
  'sonnet-4.6 - Claude 4.6 Sonnet  (current)',
  '',
  'Tip: use --model <id> to switch.',
].join('\n');

// Every agent installed and signed in.
export const READY = {
  claude: { auth: { out: JSON.stringify({ loggedIn: true, authMethod: 'claude.ai' }) } },
  codex: { login: { out: 'Logged in using ChatGPT' }, models: { out: CODEX_CATALOGUE } },
  agent: { status: { out: '\u001b[32m ✓ Logged in as you@example.com\u001b[0m' }, models: { out: CURSOR_MODELS } },
};
