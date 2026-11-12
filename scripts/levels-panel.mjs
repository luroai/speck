// 0661: the team page's build levels. The builder's card lists the project's levels, and each change, addition or
// removal there is saved to `levels:` in speck/config.yml, rewriting only that block, and committed on the base branch
// as a Save in Settings is. With no `levels:` in the file, the first change saves the three default levels with it.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, parseConfig, stripComment, yamlValue, EFFORTS, listTickets } from './core.mjs';
import { checkConfigValue } from './config.mjs';
import { commitTicketOnly } from './close.mjs';
import { choicesOf } from './settings.mjs';
import { knownProviders } from './custom-providers.mjs';
import { ticketSameModelProblem } from './same-model.mjs';
import { LEVEL_KEYS, levelsOf, levelsShown, ticketLevel } from './levels.mjs';

// A level's name: lowercase letters, digits and hyphens (0660's Notes).
export const LEVEL_NAME = /^[a-z0-9-]+$/;
const CLOSED = ['done', 'cancelled'];

// `text` with its last top-level `levels:` block (the one speck reads) replaced by `levels`, { name: { key: value } },
// in their order, or with one added at the end when it has none. Everything else in the file stays as it was.
export function setLevelsText(text, levels) {
  const lines = text.split('\n'), cr = lines[0]?.endsWith('\r') ? '\r' : '';
  const names = Object.keys(levels);
  const block = names.length ? ['levels:', ...names.flatMap(name => {
    const set = LEVEL_KEYS.filter(k => levels[name][k] !== undefined && levels[name][k] !== '');
    return set.length ? [`  ${name}:`, ...set.map(k => `    ${k}: ${yamlValue(String(levels[name][k]))}`)] : [`  ${name}: {}`];
  })] : ['levels: {}'];
  const at = lines.map((l, i) => (/^levels:/.test(stripComment(l.replace(/\r$/, ''))) ? i : -1)).filter(i => i >= 0).pop();
  if (at === undefined) {
    if (lines.at(-1) === '') lines.pop();
    return [...lines, '', ...block, ''].map((l, i, all) => (i < all.length - 1 ? l.replace(/\r$/, '') + cr : l)).join('\n');
  }
  let end = at + 1;
  while (end < lines.length && (lines[end].trim() === '' || /^\s/.test(lines[end]))) end++;
  while (end > at + 1 && lines[end - 1].trim() === '') end--; // blank lines after the block stay where they are
  const old = lines[at].replace(/\r$/, ''), comment = old.slice(stripComment(old).length);
  block[0] += comment;
  lines.splice(at, end - at, ...block.map(l => l + cr));
  return lines.join('\n');
}

const fail = (status, error, repo) => ({ status, body: { error, ...(repo ? shownOf(repo) : {}) } });
function shownOf(repo) {
  try { return levelsShown(parseConfig(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'))); } catch { return {}; }
}

// The value of each of the level's three settings in `query`, checked as the builder's own settings are checked, or
// the error saying why one is refused. A key missing from `query` is left out.
function valuesIn(query, repo) {
  const out = {};
  for (const key of LEVEL_KEYS) {
    if (!query.has(key)) continue;
    const value = String(query.get(key)).trim();
    if (key === 'builder' && value !== '') {
      const choices = choicesOf('builder', parseConfig(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8')), knownProviders(repo));
      if (!choices.includes(value)) return { error: `A level's builder must be blank or one of ${choices.join(', ')} (got ${JSON.stringify(value)}).` };
    }
    if (key === 'builder_model' && /[\x00-\x1f\x7f]/.test(value)) return { error: 'A level\'s model must be on one line, with no tabs or other control characters.' };
    if (key === 'builder_effort') {
      try { checkConfigValue('builder_effort', value); }
      catch (e) { if (e instanceof SpeckError) return { error: `A level's effort must be blank or one of ${EFFORTS.join(', ')}, or an effort Codex lists for one of its models (got ${JSON.stringify(value)}).` }; throw e; }
    }
    out[key] = value;
  }
  return { values: out };
}

// The panel's POST /api/levels/<name>/<action>, with the name still written as in the address and `query` the
// address's query. `set` changes a level's builder, builder_model and builder_effort, each one the query gives, blank
// being the settings'. `add` adds a level with those it gives. `remove` deletes one, unless a ticket that isn't done or
// cancelled names it. Every failure is an answer saying why, and nothing is saved then. Each answer gives the levels
// as they are once it's done, as levelsShown gives them.
export function panelLevelRequest(repo, rawName, action, query = '') {
  let name;
  try { name = decodeURIComponent(String(rawName ?? '')).trim(); }
  catch { return fail(400, 'That level\'s name isn\'t written properly in the address. Reload the panel, then try again.', repo); }
  if (!['set', 'add', 'remove'].includes(action)) return fail(404, 'speck can only change, add or remove a level here. Reload the panel, then try again.', repo);
  const file = path.join(repo, 'speck', 'config.yml');
  let text, cfg;
  try { text = fs.readFileSync(file, 'utf8'); cfg = loadConfig(repo, { benches: false }); }
  catch (e) { return fail(500, `Couldn't read speck/config.yml, so nothing was saved: ${e instanceof SpeckError ? e.message : e?.code ?? 'an error'}.`); }
  // Each level as speck reads it, trimmed, with only the values it gives.
  const levels = Object.fromEntries(levelsShown(parseConfig(text)).levels.map(({ name: n, ...v }) => [n, v])), has = Object.hasOwn(levels, name);
  const q = new URLSearchParams(query);
  let said;
  if (action === 'add') {
    if (!LEVEL_NAME.test(name)) return fail(422, `A level's name must be lowercase letters, digits and hyphens, such as graphics or deep-2 (got ${JSON.stringify(name)}), so it wasn't added.`, repo);
    if (has) return fail(422, `There's already a level called ${name}, so it wasn't added. Change that one, or pick another name.`, repo);
    const { values, error } = valuesIn(q, repo);
    if (error) return fail(422, error, repo);
    levels[name] = values;
    said = `Added the ${name} level.`;
  } else if (!has) {
    return fail(404, `This project has no level called ${JSON.stringify(name)}. Reload the panel, then try again.`, repo);
  } else if (action === 'set') {
    const { values, error } = valuesIn(q, repo);
    if (error) return fail(422, error, repo);
    levels[name] = { ...levels[name], ...values };
    said = `Saved the ${name} level.`;
  } else {
    const naming = listTickets(repo).filter(t => !CLOSED.includes(String(t.fm?.status ?? '').trim()) && ticketLevel(t.fm) === name).map(t => String(t.fm.id ?? path.basename(t.file).slice(0, 4)));
    if (naming.length)
      return fail(422, `${naming.length > 1 ? 'Tickets' : 'Ticket'} ${naming.join(', ')} ${naming.length > 1 ? 'are' : 'is'} built at the ${name} level and ${naming.length > 1 ? 'aren\'t' : 'isn\'t'} done, so it wasn't removed. Give ${naming.length > 1 ? 'them' : 'it'} another level first.`, repo);
    delete levels[name];
    said = `Removed the ${name} level.`;
  }
  for (const k of Object.keys(levels)) for (const key of LEVEL_KEYS) if (levels[k][key] === '') delete levels[k][key];
  if (action !== 'remove') {
    const will = { ...cfg, levels };
    const problem = will.allow_same_model_review === true ? null : ticketSameModelProblem({ level: name }, will);
    if (problem) return fail(422, `A ticket at the ${name} level couldn't be built: ${problem}`, repo);
  }
  const next = setLevelsText(text, levels);
  if (JSON.stringify(levelsOf(parseConfig(next))) !== JSON.stringify(levels))
    return fail(422, 'Couldn\'t write the levels so that speck reads them back as given. Edit levels: in speck/config.yml by hand instead.', repo);
  if (next === text) return { status: 200, body: { ok: true, said: `The ${name} level already has those values.`, ...levelsShown(parseConfig(text)) } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return fail(409, `This checkout is on "${branch}", not ${cfg.base_branch}, so the level would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.`, repo);
  const dirty = sh('git', ['status', '--porcelain', '--', 'speck/config.yml'], { cwd: repo });
  if (dirty.status !== 0 || dirty.stdout.trim())
    return fail(409, 'speck/config.yml has uncommitted changes, so saving would commit them too. Commit or undo them, then try again.', repo);
  try {
    fs.writeFileSync(file, next);
    const commit = commitTicketOnly(repo, file, text, `speck: config level ${name} ${action === 'set' ? 'changed' : action === 'add' ? 'added' : 'removed'}`);
    if (commit.status !== 0)
      return fail(500, `Couldn't commit speck/config.yml, so nothing was saved:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`, repo);
  } catch (e) {
    try { if (fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text); } catch { /* put back all it can */ }
    return fail(500, `Couldn't save the level, so nothing was saved: ${e.message}`, repo);
  }
  return { status: 200, body: { ok: true, said, ...levelsShown(parseConfig(next)) } };
}
