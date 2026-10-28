// 0549: the builder settings speck run starts and resumes builds with, read afresh on each of its checks, so a change
// to builder, builder_model, builder_effort, build_command, resume_command or max_parallel_builds, in the project or on
// this machine only, applies from the next build without restarting speck run.
import { SpeckError, splitCommand } from './speck.mjs';
import { builderMismatch } from './install.mjs';
import { codexBuilds, codexStartWords } from './codex-build.mjs';
import { cursorBuilds, cursorCli, cursorStartWords } from './cursor-build.mjs';
import { maxParallelBuilds } from './machine.mjs';
import { withBuilderModel, DEFAULT_BUILD_COMMAND, providerBuilds } from './build-model.mjs';
import { providerStartWords } from './provider-build.mjs';

// What speck run starts builds with from `cfg`: { cfg, command, words, max }. Throws a SpeckError saying why when the
// settings can't start a build, `starting` when speck run is starting with them.
export function builderSettings(cfg, { starting = false } = {}) {
  const command = typeof cfg.build_command === 'string' ? cfg.build_command.trim() : '';
  const codex = codexBuilds(cfg); // 0289: builder codex with build_command blank builds with speck's own Codex command
  const cursor = cursorBuilds(cfg) ? cursorCli() : null; // 0290: and builder cursor with Cursor's CLI
  const provider = providerBuilds(cfg); // 0391: and a model provider, such as deepseek, through Claude Code
  const own = { codex: 'Codex', cursor: 'Cursor' }[cfg.builder];
  if (!command && !codex && !cursor && !provider)
    throw new SpeckError(`No build_command is set in speck/config.yml, so speck run has nothing to start builds with. Add, for example:\n  build_command: '${own ? '' : DEFAULT_BUILD_COMMAND}'${own ? `\nA blank build_command starts each build with ${own}.` : ''}`);
  let words;
  if (codex) words = codexStartWords(cfg);
  else if (cursor) words = cursorStartWords(cfg, cursor);
  else if (provider) words = providerStartWords(cfg, provider);
  else try { words = splitCommand(command); } catch { throw new SpeckError(`build_command in speck/config.yml has a quote that isn't closed: ${command}`); }
  const mismatch = builderMismatch(cfg);
  if (mismatch) throw new SpeckError(`${starting ? 'speck run won\'t start: ' : ''}${mismatch.problem} ${mismatch.fix}`);
  words = withBuilderModel(words, cfg); // 0279: every build it starts, resumes or hands back runs on builder_model
  return { cfg, command, words, max: maxParallelBuilds(cfg) };
}

// speck run's settings as they are now: a function returning builderSettings of what `read()` gives, or null while
// they can't start a build, with why() saying why. Why is said once, until it changes, and so is their being fixed.
export function liveSettings(read, say = console.log) {
  let why = null;
  const now = () => {
    try {
      const s = builderSettings(read());
      if (why) say('speck run\'s settings can start builds again, so it starts them from this check.');
      why = null;
      return s;
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg !== why) say(`speck run can't start or resume builds with its settings as they are now, so it starts none until they're fixed: ${msg}`);
      why = msg;
      return null;
    }
  };
  now.why = () => why;
  return now;
}
