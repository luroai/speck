// 0279: builder_model, the model every build speck run starts or resumes runs on. Claude Code builds are given it as
// --model <value>: Claude Code takes an alias (fable, opus, sonnet, haiku) or a full model name. 0289: Codex builds
// speck run starts with its own command are given it as -m <value> (codex-build.mjs), and Cursor builds as --model
// <value> (cursor-build.mjs).

// The build_command that starts Claude Code builds, as speck/config.yml has it when speck sets it up.
export const DEFAULT_BUILD_COMMAND = 'claude -p "/speck-build {id}" --session-id {session} --output-format stream-json --verbose --dangerously-skip-permissions';

// 0324: true when speck run builds each ticket with the builder it records: build_command blank, or exactly Claude
// Code's own, which switching the builder to Claude Code sets. Any other build_command is used for every ticket.
export const buildsEachTicket = cmd => typeof cmd === 'string' && (cmd.trim() === '' || cmd.trim() === DEFAULT_BUILD_COMMAND);

// 0312: the builder speck/config.yml names: claude when it names none.
export const configBuilder = cfg => (typeof cfg?.builder === 'string' ? cfg.builder.trim() : '') || 'claude';

// builder_model as speck/config.yml has it, trimmed, a number read as YAML gives it (builder_model: 5) included: ''
// when it's blank or missing.
export const modelOf = cfg => typeof cfg.builder_model === 'string' || typeof cfg.builder_model === 'number' ? String(cfg.builder_model).trim() : '';

// 0289: true when speck run builds with its own Codex command: builder codex, and build_command set blank. A config
// without build_command at all is refused by speck run, as before.
export const codexBuilds = cfg => cfg?.builder === 'codex' && typeof cfg.build_command === 'string' && !cfg.build_command.trim();

// 0290: true when speck run builds with its own Cursor command: builder cursor, and build_command set blank.
export const cursorBuilds = cfg => cfg?.builder === 'cursor' && typeof cfg.build_command === 'string' && !cfg.build_command.trim();

// 0290: the agent speck run's own command builds with, 'codex' or 'cursor', or null when build_command is used.
export const ownBuilder = cfg => (codexBuilds(cfg) ? 'codex' : cursorBuilds(cfg) ? 'cursor' : null);

// build_command's words with `--model <builder_model>` added at the end when the builder is claude and builder_model
// is set, replacing any --model the command already gives. Otherwise the words exactly as they are.
export function withBuilderModel(words, cfg) {
  const model = modelOf(cfg);
  if (!model || cfg.builder !== 'claude') return words;
  const kept = words.filter((w, i) => !w.startsWith('--model=') && w !== '--model' && words[i - 1] !== '--model');
  return [...kept, '--model', model];
}

// The one line speck run says when it starts with builder_model set for a builder that isn't claude, or null.
export function builderModelNote(cfg) {
  const model = modelOf(cfg);
  if (!model || cfg.builder === 'claude' || ownBuilder(cfg)) return null; // 0289, 0290: speck's own commands pass it
  return `builder_model (${model}) is only passed to Claude Code builds, and the builder is ${String(cfg.builder ?? '') || 'not set'}, so builds start without it.`;
}
