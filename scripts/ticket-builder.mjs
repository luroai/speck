// 0312: each ticket is built with the builder its `builder:` field records. With build_command blank (0324: or exactly
// Claude Code's own, as switching the builder to Claude Code sets it), speck run starts a
// ticket's build with that builder's own command: Codex's (0289), Cursor's (0290) or Claude Code's (the build_command
// speck sets up for it). builder_model is passed only when the ticket's builder is the one in speck/config.yml, as it's
// in that builder's own format. A builder that isn't installed, or that speck has no command for, isn't started.
// 0391: a model provider's, such as DeepSeek's, is built through Claude Code with the provider's own command
// (provider-build.mjs), and isn't started without Claude Code or this machine's key for the provider.
import crypto from 'node:crypto';
import { splitCommand } from './speck.mjs';
import { setField, blank } from './core.mjs';
import { DEFAULT_BUILD_COMMAND, withBuilderModel, configBuilder, buildsEachTicket, buildConfig, modelOf, effortOf } from './build-model.mjs';
import { codexStartWords } from './codex-build.mjs';
import { cursorStartWords, cursorCli, createChat } from './cursor-build.mjs';
import { onPath } from './install.mjs';
import { providerKey } from './keys.mjs';
import { knownProviders, cantRun } from './custom-providers.mjs';
import { providerNamed } from './provider-review.mjs';
import { providerStartWords } from './provider-build.mjs';
import { levelled } from './levels.mjs';

const LABELS = { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' };
const OWN = Object.keys(LABELS);
const name = v => (typeof v === 'string' ? v.trim() : '');
export { configBuilder };

// The builder a ticket records in its `builder:` field, or the one in speck/config.yml when it records none.
export const ticketBuilder = (t, cfg) => name(t?.builder) || configBuilder(cfg);

// The words that start a Claude Code build of ticket `t`, with --model when builder_model is set and claude is the
// configured builder. 0659: or when the ticket sets its own.
export const claudeStartWords = (cfg, t = {}) => withBuilderModel(splitCommand(DEFAULT_BUILD_COMMAND), buildConfig(cfg, 'claude', t));

// 0659: ticket `t` as a stand-in on builder_bench builds it (0647, 0648): on `agent`, without the ticket's own
// builder_model or builder_effort, which are in its own builder's format. 0660: nor its level's.
export const standInTicket = (t, agent) => ({ ...t, builder: agent, builder_model: '', builder_effort: '', ...(blank(t?.level) ? {} : { level: '' }) });

// 0659: ticket `t`'s own builder_model and builder_effort, trimmed: '' for each it leaves blank.
const ticketValues = t => ({ builder_model: modelOf(t ?? {}), builder_effort: effortOf(t) });

// 0659: ticket text `text`, with frontmatter `fm`, recording stand-in `agent` as its builder: its own builder_model and
// builder_effort, set for the builder it had, are cleared, so no later build, resume or board gives them to `agent`.
// 0660: and its level, whose model and effort were set for the builder it had too.
export function standInText(text, fm, agent) {
  let out = setField(text, 'builder', agent);
  for (const k of ['builder_model', 'builder_effort', 'level']) if (!blank(fm?.[k])) out = setField(out, k, '');
  return out;
}

// 0659: status ticket `t` as speck run launches it: with its own builder_model and builder_effort, read from its
// frontmatter by `fmOf(id)`, as the board's builder_model is the model its builds run on, or a stand-in's, without them.
// 0660: each it leaves blank from its level in `cfg`, as the board's builder already is (ticketAgents).
export function launchTicket(t, standIn, fmOf, cfg = {}) {
  if (standIn) return standInTicket(t, t.builder);
  let fm = {};
  try { fm = fmOf(t.id) ?? {}; } catch { /* unreadable: it builds on the settings' */ }
  return { ...t, ...ticketValues(levelled(fm, cfg)) };
}

// 0659: what speck run keeps in a build's run record of ticket `t`'s own builder_model and builder_effort, so its
// resumes and hand-backs run on them too.
export function ticketRecord(t) {
  const { builder_model: model, builder_effort: effort } = ticketValues(t);
  return { ...(model ? { ticket_builder_model: model } : {}), ...(effort ? { ticket_builder_effort: effort } : {}) };
}

// 0659: a run record's ticket values, as buildConfig takes them.
export const recordTicket = rec => ticketValues({ builder_model: rec?.ticket_builder_model, builder_effort: rec?.ticket_builder_effort });

// How speck run starts ticket `t`'s build with build_command blank: { agent, words }, {id} and {session} standing for
// the ticket and its session, or { why } saying in a few words why it isn't started. `installed` says whether a command
// is on the PATH, so tests can stand in. 0391: `providers` are the model providers speck knows, and a provider's key
// is checked in `repo`'s when it's given.
export function buildPlan(cfg, t, installed = onPath, { repo = null, providers = knownProviders(repo ?? undefined) } = {}) {
  const builder = ticketBuilder(t, cfg);
  const p = Object.hasOwn(LABELS, builder) ? null : providerNamed(builder, providers);
  if (p) return providerPlan(cfg, t, p, installed, repo, providers);
  if (!Object.hasOwn(LABELS, builder))
    return { why: `its builder is ${builder}, which speck run has no command of its own for. Set build_command in speck/config.yml to build it, or set its builder to ${[...OWN, ...providers.map(x => x.name)].join(', ')}` };
  const own = buildConfig(cfg, builder, t);
  const words = builder === 'codex' ? codexStartWords(own) : builder === 'cursor' ? cursorStartWords(own, cursorCli()) : claudeStartWords(cfg, t);
  if (!installed(words[0])) return { why: `its builder, ${LABELS[builder]}, isn't installed here (${builder === 'cursor' ? 'neither agent nor cursor-agent' : words[0]} isn't on the PATH). Install it, or set the ticket's builder to one that is` };
  return { agent: builder, words };
}

// 0391: how speck run starts a build with provider `p`, as buildPlan says it.
function providerPlan(cfg, t, p, installed, repo, providers) {
  if (cantRun(p, 'build')) return { why: `its builder, ${cantRun(p, 'build').replace(/\. Pick another agent for it in Settings\.$/, '')}. Set the ticket's builder to another` }; // 0401
  if (!installed('claude')) return { why: `its builder, ${p.label}, needs Claude Code installed, as speck runs ${p.label}'s models through it (claude isn't on the PATH). Install Claude Code (https://claude.com/claude-code), or set the ticket's builder to another` };
  let key = '';
  try { key = repo ? providerKey(repo, p.name, { providers }) : 'not checked'; } catch (e) { return { why: e.message.replace(/\.$/, '') }; }
  if (!key) return { why: `this machine has no ${p.label} API key for its builder, ${p.label}. Set one with \`speck keys set ${p.name}\`, or set the ticket's builder to another` };
  return { agent: p.name, words: providerStartWords(buildConfig(cfg, p.name, t), p) };
}

// 0622: the agent ticket `t`'s build would run on: its own builder, or the configured one when build_command, written by you, ignores that.
export const launchAgent = (cfg, command, t) => (buildsEachTicket(command ?? '') ? ticketBuilder(t, cfg) : configBuilder(cfg));

// How speck run launches ticket `t`: { agent, words, tag }, with build_command's `words` and no agent when `command` is
// one you've written yourself (0324), `tag` being the build's session (a Cursor build's chat, made for it here). null when it can't be started now: the
// reason is said once until it changes, and kept in `failed` as { kind, why } for the Foreman's record. `chat` makes a
// Cursor chat and `installed` checks the PATH, so tests can stand in. 0659: `record` is what its run record keeps of
// the ticket's own builder_model and builder_effort (ticketRecord), which go to Claude Code too when build_command is yours.
export function launchPlan(cfg, t, { command, words, repo, failed, chat = createChat, installed = onPath }) {
  const stay = (kind, why) => {
    if (failed.get(t.id)?.why !== why) console.log(`${t.id} wasn't started, and stays ready: ${why}. speck run tries again on its next check.`);
    failed.set(t.id, { kind, why });
    return null;
  };
  const each = buildsEachTicket(command ?? ''), mine = each || ticketBuilder(t, cfg) === configBuilder(cfg) ? t : {}; // 0659: yours builds every ticket as the configured builder's
  const plan = !each ? { agent: null, words: withBuilderModel(words, { builder: cfg.builder, ...ticketValues(mine) }) } : buildPlan(cfg, t, installed, { repo });
  if (plan.why) return stay('builder', plan.why);
  let tag = crypto.randomUUID();
  if (plan.agent === 'cursor') {
    const made = chat(plan.words[0], repo);
    if (!made.session) return stay('chat', made.why);
    tag = made.session;
  }
  failed.delete(t.id);
  return { ...plan, tag, record: ticketRecord(mine) };
}

// The one line speck run says as it starts when build_command is one you've written yourself (0324) and a ticket on the board records a builder other
// than the one in speck/config.yml, or null.
export function ignoredBuildersNote(cfg, tickets) {
  const command = typeof cfg?.build_command === 'string' ? cfg.build_command.trim() : '';
  if (buildsEachTicket(command)) return null;
  const builder = configBuilder(cfg);
  const others = (tickets || []).filter(t => !['done', 'cancelled'].includes(t.status) && name(t.builder) && name(t.builder) !== builder).map(t => t.id);
  if (!others.length) return null;
  return `build_command is set in speck/config.yml, so every build starts with it, and the builder each ticket records is ignored: ${others.join(', ')} ${others.length === 1 ? 'records' : 'record'} a builder other than ${builder}. Set build_command blank, or to Claude Code's own command, to build each ticket with its own builder.`;
}
