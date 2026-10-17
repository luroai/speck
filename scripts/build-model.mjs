// 0279: builder_model, the model every build speck run starts or resumes runs on. Only Claude Code builds are given
// it, as --model <value>: Claude Code takes an alias (fable, opus, sonnet, haiku) or a full model name.

// builder_model as speck/config.yml has it, trimmed, a number read as YAML gives it (builder_model: 5) included: ''
// when it's blank or missing.
const modelOf = cfg => typeof cfg.builder_model === 'string' || typeof cfg.builder_model === 'number' ? String(cfg.builder_model).trim() : '';

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
  if (!model || cfg.builder === 'claude') return null;
  return `builder_model (${model}) is only passed to Claude Code builds, and the builder is ${String(cfg.builder ?? '') || 'not set'}, so builds start without it.`;
}
