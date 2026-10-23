// 0293: switching the builder. Each builder speck can start by itself has its own build_command: Claude Code's
// default, or blank for Codex (0289) and Cursor (0290), which speck run then starts with its own command. Switching
// the builder sets build_command to the new builder's own, asking first when it was set by hand.

import { modelFamily } from './core.mjs';
import { DEFAULT_BUILD_COMMAND } from './build-model.mjs';
import { PROVIDERS } from './providers.mjs';
import { knownProviders } from './custom-providers.mjs';

// 0393: and each model provider, such as DeepSeek, which speck run starts with its own command when build_command is blank.
export const BUILDER_NAMES = Object.freeze({ claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor', ...Object.fromEntries(PROVIDERS.map(p => [p.name, p.label])) });
export const OWN_BUILD_COMMANDS = Object.freeze({ claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '', ...Object.fromEntries(PROVIDERS.map(p => [p.name, ''])) });

// The build_command speck sets for `builder`, or null for a builder it can't start by itself (such as gemini).
// 0401: a provider you've added on this machine is started with its own command too, as speck's own are.
const yourProvider = (builder, providers = knownProviders()) => providers.find(p => p.name === builder) ?? null;
export const ownBuildCommand = (builder, providers) => Object.hasOwn(OWN_BUILD_COMMANDS, builder) ? OWN_BUILD_COMMANDS[builder] : yourProvider(builder, providers) ? '' : null;
// 0401: a builder's name, a provider you've added by the name you gave it.
const builderName = builder => (Object.hasOwn(BUILDER_NAMES, builder) ? BUILDER_NAMES[builder] : yourProvider(builder)?.label ?? builder);

// Whether build_command in `file`, speck/config.yml as read, was set by hand: it's there, and isn't its builder's own
// command. One that isn't there at all wasn't.
export function handSetBuildCommand(file) {
  const cmd = file?.build_command;
  if (cmd === undefined || cmd === null) return false;
  const builder = file.builder === undefined || file.builder === null ? 'claude' : String(file.builder);
  return typeof cmd !== 'string' || cmd.trim() !== (ownBuildCommand(builder) ?? '');
}

// A reviewer from another family than `builder`'s.
export const otherFamilyReviewer = builder => modelFamily(builder) === 'claude' ? 'codex' : 'claude';

// build_command as a sentence says it: blank, and what that does, or the command in quotes.
export const describeBuildCommand = (builder, cmd) => cmd === ''
  ? `blank, so speck run starts each build with ${builderName(builder)}'s own command` : `'${cmd}'`;

// 0311: why switching the builder to `builder` clears builder_model `model`, or null when it's kept: when it's blank,
// or one of the models `builder` offers. `offered()` gives their names, read only when there's a model to check, or
// null when they can't be read, and then it's cleared too, as it can't be checked.
export function clearsBuilderModel(model, builder, offered) {
  if (model === undefined || model === null || String(model).trim() === '') return null;
  const names = offered(), name = builderName(builder);
  if (names === null) return `${name}'s models couldn't be read, so builder_model can't be checked`;
  return names.includes(String(model)) ? null : `${name} doesn't offer ${model}, as speck agents lists its models`;
}
