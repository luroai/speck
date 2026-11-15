// 0667: what each of the project's levels builds with, for a ticket's Level menu in the panel, worked out as a build
// works it out: the level's own builder, model and effort, else the Builder's in speck/config.yml. The last, named '',
// is Default, a ticket with no level, which builds with the Builder's own.
import { ticketAgents, blank } from './core.mjs';
import { buildConfig, ticketBuilderModel, buildsEachTicket } from './build-model.mjs';
import { levelNames, levelled, levelProblem, ticketLevel } from './levels.mjs';
import { knownProviders } from './custom-providers.mjs';
import { findProvider } from './providers.mjs';
import { CLAUDE_MODELS, providerModelName } from './settings.mjs';

const AGENT_NAMES = { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' };

// An agent by the name the Builder's row gives it: speck's own by theirs, a model provider by its label, any other as named.
const agentName = (id, providers) => {
  const p = findProvider(id, providers);
  return p && p.name === id ? p.label : Object.hasOwn(AGENT_NAMES, id) ? AGENT_NAMES[id] : id;
};
// A model by the name the Builder's list gives it, where speck knows it without asking the agent; otherwise its slug.
function modelName(id, slug, providers) {
  const p = findProvider(id, providers);
  if (p && p.name === id) return providerModelName(p, slug);
  if (id === 'claude') return CLAUDE_MODELS.find(m => m.slug === slug)?.display_name ?? slug;
  return slug;
}

// Whether a build on `builder` is given an effort: Claude Code's always, Codex's when speck starts it with its own command
// (codex-build.mjs). Cursor's and a model provider's never are.
const takesEffort = (builder, cfg) => builder === 'claude' || (builder === 'codex' && buildsEachTicket(cfg?.build_command ?? ''));

// [{ name, builder, agent, model, model_slug, effort }] for each level in speck/config.yml's order, then Default (name '').
// `model` is the model by name where speck knows it without asking the agent, `model_slug` as the build is given it, both
// '' when the build leaves it to the agent's own default, so the page can name a Codex or Cursor model as their lists do.
// `effort` is '' when it's left to the agent's own default, and null when the builder isn't given one at all.
export function levelBuilds(cfg, repo, providers = knownProviders(repo)) {
  return [...levelNames(cfg), ''].map(name => ({ name, ...buildsWith({ level: name }, cfg, providers) }));
}

// 0669: what ticket `fm`'s next build would use, as levelBuilds gives a level's: { builder, agent, model, model_slug,
// effort }. Its own builder, builder_model and builder_effort, else its level's, else the Builder's in speck/config.yml.
export function buildsWith(fm, cfg, providers) {
  const l = levelled(fm, cfg), builder = ticketAgents(l, cfg).builder;
  const model = ticketBuilderModel(l, cfg, providers) || '', effort = buildConfig(cfg, builder, l).builder_effort;
  return { builder, agent: agentName(builder, providers), model: model ? modelName(builder, model, providers) : '', model_slug: model,
    effort: takesEffort(builder, cfg) ? effort || '' : null };
}

// 0669: a ticket's Builder fact for the panel: buildsWith, with `from` where they come from ('ticket' when it names its
// own builder, model or effort, else its level's name, else 'default'), and `own` its own builder and builder_model, as
// its file has them, for its menu to mark.
export function ticketBuild(fm, cfg, providers) {
  const own = { builder: blank(fm?.builder) ? '' : String(fm.builder).trim(), builder_model: blank(fm?.builder_model) ? '' : String(fm.builder_model).trim() };
  const level = levelProblem(fm, cfg) ? '' : ticketLevel(fm);
  const from = own.builder || own.builder_model || !blank(fm?.builder_effort) ? 'ticket' : level || 'default';
  return { ...buildsWith(fm, cfg, providers), from, own };
}
