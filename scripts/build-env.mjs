// The environment of each build speck run starts.

// Set in the environment of each build speck run launches, so every process the build starts inherits it.
export const BUILD_ENV = 'SPECK_BUILD_SESSION';

// 0245: a Claude Code build speck run starts can't run a command in the background, since ending its turn while one
// runs ends the build partway. Set only when the command starts Claude Code, and never over a value already set.
const NO_BACKGROUND = 'CLAUDE_CODE_DISABLE_BACKGROUND_TASKS';
const startsClaude = argv => typeof argv[0] === 'string' && (argv[0] === 'claude' || argv[0].endsWith('/claude'));

// The environment of a build speck run starts: its own, with the build's session and, for Claude Code, no background commands.
export function buildEnv(argv, session, env = process.env) {
  const out = { ...env, [BUILD_ENV]: session };
  if (startsClaude(argv) && !Object.hasOwn(env, NO_BACKGROUND)) out[NO_BACKGROUND] = '1';
  return out;
}
