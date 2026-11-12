// 0660: build levels. `levels:` in speck/config.yml names each level, and each can give a builder, builder_model and
// builder_effort. A ticket's `level:` names one: each of the three it leaves blank takes the level's, and each the level
// leaves out falls back to the settings, as a blank one on the ticket always has (0659).

export const LEVEL_KEYS = ['builder', 'builder_model', 'builder_effort'];

// The levels a project without `levels:` gets.
export const DEFAULT_LEVELS = Object.freeze({ quick: { builder_effort: 'low' }, balanced: {}, deep: { builder_effort: 'max' } });

const text = v => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
const isMap = v => v !== null && typeof v === 'object' && !Array.isArray(v);

// The project's levels: exactly those `levels:` lists when speck/config.yml has it, otherwise DEFAULT_LEVELS.
export const levelsOf = cfg => (cfg && Object.hasOwn(cfg, 'levels') ? (isMap(cfg.levels) ? cfg.levels : {}) : DEFAULT_LEVELS);

// The names of the project's levels, in the order speck/config.yml gives them.
export const levelNames = cfg => Object.keys(levelsOf(cfg));

// The level ticket `fm` names, trimmed: '' when it names none.
export const ticketLevel = fm => text(fm?.level);

// What's wrong with ticket `fm`'s level, or null: one the project doesn't have, or one that isn't a map of settings.
export function levelProblem(fm, cfg) {
  const name = ticketLevel(fm);
  if (!name) return null;
  const levels = levelsOf(cfg), names = Object.keys(levels);
  if (!Object.hasOwn(levels, name))
    return `level "${name}" isn't one of this project's levels in speck/config.yml${names.length ? ` (${names.join(', ')})` : ', which has none'}. Set it to one of them, or blank.`;
  const l = levels[name];
  if (l !== null && l !== '' && !isMap(l)) return `level "${name}" in speck/config.yml must list builder, builder_model or builder_effort under it, each on its own line, or nothing.`;
  return null;
}

// The builder, builder_model and builder_effort ticket `fm`'s level gives, trimmed, '' for each it leaves out: all ''
// for a blank level, or one the project doesn't have.
export function levelValues(fm, cfg) {
  const name = ticketLevel(fm), levels = levelsOf(cfg);
  const l = name && Object.hasOwn(levels, name) && isMap(levels[name]) ? levels[name] : {};
  return Object.fromEntries(LEVEL_KEYS.map(k => [k, Object.hasOwn(l, k) ? text(l[k]) : '']));
}

// Ticket `fm` with each of the three it leaves blank filled from its level, as a build of it reads them.
export function levelled(fm, cfg) {
  const lv = levelValues(fm ?? {}, cfg), out = { ...(fm ?? {}) };
  for (const k of LEVEL_KEYS) if (!text(out[k]) && lv[k]) out[k] = lv[k];
  return out;
}
