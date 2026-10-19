// 0312: each ticket is built with the builder its `builder:` field records. With build_command blank, speck run starts a
// ticket's build with that builder's own command: Codex's (0289), Cursor's (0290) or Claude Code's (the build_command
// speck sets up for it). builder_model is passed only when the ticket's builder is the one in speck/config.yml, as it's
// in that builder's own format. A builder that isn't installed, or that speck has no command for, isn't started.
import crypto from 'node:crypto';
import { splitCommand } from './speck.mjs';
import { DEFAULT_BUILD_COMMAND, withBuilderModel, configBuilder } from './build-model.mjs';
import { codexStartWords } from './codex-build.mjs';
import { cursorStartWords, cursorCli, createChat } from './cursor-build.mjs';
import { onPath } from './install.mjs';

const LABELS = { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' };
const OWN = Object.keys(LABELS);
const name = v => (typeof v === 'string' ? v.trim() : '');
export { configBuilder };

// The builder a ticket records in its `builder:` field, or the one in speck/config.yml when it records none.
export const ticketBuilder = (t, cfg) => name(t?.builder) || configBuilder(cfg);

// speck/config.yml as a build with `builder` reads it: without builder_model when `builder` isn't the one it names.
const configFor = (cfg, builder) => (builder === configBuilder(cfg) ? { ...cfg, builder } : { ...cfg, builder, builder_model: '' });

// The words that start a Claude Code build, with --model when builder_model is set and claude is the configured builder.
export const claudeStartWords = cfg => withBuilderModel(splitCommand(DEFAULT_BUILD_COMMAND), configFor(cfg, 'claude'));

// How speck run starts ticket `t`'s build with build_command blank: { agent, words }, {id} and {session} standing for
// the ticket and its session, or { why } saying in a few words why it isn't started. `installed` says whether a command
// is on the PATH, so tests can stand in.
export function buildPlan(cfg, t, installed = onPath) {
  const builder = ticketBuilder(t, cfg);
  if (!Object.hasOwn(LABELS, builder))
    return { why: `its builder is ${builder}, which speck run has no command of its own for. Set build_command in speck/config.yml to build it, or set its builder to ${OWN.join(', ')}` };
  const own = configFor(cfg, builder);
  const words = builder === 'codex' ? codexStartWords(own) : builder === 'cursor' ? cursorStartWords(own, cursorCli()) : claudeStartWords(cfg);
  if (!installed(words[0])) return { why: `its builder, ${LABELS[builder]}, isn't installed here (${builder === 'cursor' ? 'neither agent nor cursor-agent' : words[0]} isn't on the PATH). Install it, or set the ticket's builder to one that is` };
  return { agent: builder, words };
}

// How speck run launches ticket `t`: { agent, words, tag }, with build_command's `words` and no agent when `command` is
// set, `tag` being the build's session (a Cursor build's chat, made for it here). null when it can't be started now: the
// reason is said once until it changes, and kept in `failed` as { kind, why } for the Foreman's record. `chat` makes a
// Cursor chat and `installed` checks the PATH, so tests can stand in.
export function launchPlan(cfg, t, { command, words, repo, failed, chat = createChat, installed = onPath }) {
  const stay = (kind, why) => {
    if (failed.get(t.id)?.why !== why) console.log(`${t.id} wasn't started, and stays ready: ${why}. speck run tries again on its next check.`);
    failed.set(t.id, { kind, why });
    return null;
  };
  const plan = command ? { agent: null, words } : buildPlan(cfg, t, installed);
  if (plan.why) return stay('builder', plan.why);
  let tag = crypto.randomUUID();
  if (plan.agent === 'cursor') {
    const made = chat(plan.words[0], repo);
    if (!made.session) return stay('chat', made.why);
    tag = made.session;
  }
  failed.delete(t.id);
  return { ...plan, tag };
}

// The one line speck run says as it starts when build_command is set and a ticket on the board records a builder other
// than the one in speck/config.yml, or null.
export function ignoredBuildersNote(cfg, tickets) {
  const command = typeof cfg?.build_command === 'string' ? cfg.build_command.trim() : '';
  if (!command) return null;
  const builder = configBuilder(cfg);
  const others = (tickets || []).filter(t => !['done', 'cancelled'].includes(t.status) && name(t.builder) && name(t.builder) !== builder).map(t => t.id);
  if (!others.length) return null;
  return `build_command is set in speck/config.yml, so every build starts with it, and the builder each ticket records is ignored: ${others.join(', ')} ${others.length === 1 ? 'records' : 'record'} a builder other than ${builder}. Set build_command blank to build each ticket with its own builder.`;
}
