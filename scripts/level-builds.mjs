// 0667: what each of the project's levels builds with, for a ticket's Level menu in the panel, worked out as a build
// works it out: the level's own builder, model and effort, else the Builder's in speck/config.yml. The last, named '',
// is Default, a ticket with no level, which builds with the Builder's own.
import { ticketAgents } from './core.mjs';
import { buildConfig, ticketBuilderModel } from './build-model.mjs';
import { levelNames, levelled } from './levels.mjs';
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

// [{ name, builder, agent, model, effort }] for each level in speck/config.yml's order, then Default (name ''). `model`
// and `effort` are '' when the build leaves them to the agent's own default.
export function levelBuilds(cfg, repo, providers = knownProviders(repo)) {
  return [...levelNames(cfg), ''].map(name => {
    const fm = levelled({ level: name }, cfg), builder = ticketAgents(fm, cfg).builder;
    const model = ticketBuilderModel(fm, cfg, providers), effort = buildConfig(cfg, builder, fm).builder_effort;
    return { name, builder, agent: agentName(builder, providers), model: model ? modelName(builder, model, providers) : '', effort: effort || '' };
  });
}
