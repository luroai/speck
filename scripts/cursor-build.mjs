// 0290: Cursor builds. With `builder: cursor` and build_command blank, speck run makes a chat for each build with
// `agent create-chat`, keeps its id as the build's session, and starts and resumes the build in that chat with
// `agent -p`. The run record marks such a build `agent: cursor`, so it's resumed as one whatever the config says later.
import { spawnSync } from 'node:child_process';
import { modelOf, cursorBuilds } from './build-model.mjs';
import { onPath, CURSOR_CLIS } from './install.mjs';
export { cursorBuilds };

const HEADLESS = ['-p', '--force', '--trust', '--output-format', 'stream-json'];
export const CURSOR_HEADLESS = Object.freeze(HEADLESS); // 0333: the Foreman starts the same way

// Cursor's CLI: `agent`, or `cursor-agent` when only that is installed. `agent` when neither is, so what fails names
// the CLI Cursor installs today.
export const cursorCli = () => CURSOR_CLIS.find(onPath) ?? CURSOR_CLIS[0];

// The words speck run starts each Cursor build with, {session} standing for its chat and {id} for the ticket. A blank
// builder_model is passed as auto, the one model every Cursor plan can use: a chat keeps the model it first ran on.
export const cursorStartWords = (cfg, cli = cursorCli()) =>
  [cli, ...HEADLESS, '--model', modelOf(cfg) || 'auto', '--resume', '{session}', '/speck-build {id}'];

// The command that carries on a Cursor build's chat with `message`, or null when it has no session.
export function cursorResumeArgv(session, message, cli = cursorCli()) {
  if (typeof session !== 'string' || !session) return null;
  return [cli, ...HEADLESS, '--resume', session, message];
}

// The command the panel and speck's hints show to resume a Cursor build by hand. {id} is its ticket.
export const cursorResumeCommand = (cli = cursorCli()) =>
  `${cli} ${HEADLESS.join(' ')} --resume {session} '/speck-build {id}: carry on from where you left off.'`;

const oneLine = s => String(s ?? '').replace(/\s+/g, ' ').trim();

// Makes an empty chat for a build, in `cwd`, where the build runs: { session } with its id, or { why } in one line.
// speck run waits for it, so it's given 20 seconds at most. `run` is spawnSync unless given, so tests can stand in.
export function createChat(cli, cwd, run = spawnSync) {
  const r = run(cli, ['create-chat'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20_000 });
  if (r.error?.code === 'ENOENT') return { why: `Cursor's CLI isn't installed (neither agent nor cursor-agent is on the PATH): install it from https://cursor.com/docs/cli/installation` };
  if (r.error?.code === 'ETIMEDOUT') return { why: `${cli} create-chat didn't answer within 20 seconds` };
  if (r.error) return { why: `${cli} create-chat couldn't run (${oneLine(r.error.message)})` };
  if (r.status !== 0) return { why: `${cli} create-chat failed: ${oneLine(r.stderr) || oneLine(r.stdout) || (r.signal ? `it was ended by ${r.signal}` : `it exited with ${r.status}`)}` };
  const id = String(r.stdout ?? '').trim();
  if (!/^[\w-]+$/.test(id)) return { why: `${cli} create-chat printed no chat id${id ? ` (it printed: ${oneLine(id).slice(0, 200)})` : ''}` };
  return { session: id };
}
