// The settings people tune, grouped as the panel's Settings view shows them, each with speck's default and a plain
// explanation of what it does (0257). One place for them, so the views that change settings can reuse them.

import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, parseYaml } from './core.mjs';

export const SETTING_GROUPS = [
  { title: 'Shipping', settings: [
    { key: 'auto_ship', default: false,
      explain: 'When true, speck run ships each approved ticket whose risk auto_ship_risk lists: it is merged and pushed to the base branch without waiting for you. When false, every approved ticket waits for you to ship it.' },
    { key: 'auto_ship_risk', default: ['low'],
      explain: 'Which ticket risks auto_ship covers: low, high or both. While auto_ship is on, a ticket it covers is merged and pushed to the base branch without waiting for you, so adding high lets risky changes ship unseen too.' },
  ] },
  { title: 'Building and reviewing', settings: [
    { key: 'builder', default: 'claude',
      explain: 'The agent that builds each ticket, writing its tests and code. New tickets take it from here, so changing it changes who builds tickets made from now on.' },
    { key: 'reviewer', default: 'codex',
      explain: 'The agent that reviews each build and decides whether it is approved: codex, claude-subagent or a command you have set up. New tickets take it from here, so changing it changes who reviews tickets made from now on.' },
    { key: 'reviewer_model', default: '',
      explain: 'The model the reviewer runs on, written as the reviewer names it. Blank leaves it to the reviewer\'s own default, and a ticket\'s own value overrides this one.' },
    { key: 'reviewer_effort', default: '',
      explain: 'How hard the reviewer thinks: low, medium, high, xhigh or max, or blank for the reviewer\'s own default. More effort takes longer and costs more, but can catch more.' },
    { key: 'allow_same_model_review', default: false,
      explain: 'Whether the builder and reviewer may be the same model. Leave it false so a different model checks the work: true lets a model review work like its own, which tends to catch less.' },
  ] },
  { title: 'How much runs at once', settings: [
    { key: 'max_parallel_builds', default: 1,
      explain: 'How many tickets speck run builds at once. More finish sooner, but use more of your computer and agent usage, and builds that change the same files are more likely to clash.' },
    { key: 'max_parallel_tests', default: 1,
      explain: 'How many test runs go at once in this project, from any build, while the rest wait their turn. Raising it shortens the wait, but can slow the computer down or make tests that share something fail.' },
  ] },
  { title: 'Ticket size limits', settings: [
    { key: 'limits.max_acceptance_criteria', default: 5,
      explain: 'The most acceptance criteria a ticket can have before speck refuses to set it ready and asks you to split it. Raising it allows bigger tickets, which are harder to review well.' },
    { key: 'limits.max_changed_lines', default: 300,
      explain: 'How many lines a build can change, not counting tests and lockfiles, before it stops and proposes a split. Raising it lets bigger changes through in one review.' },
    { key: 'limits.max_review_rounds', default: 3,
      explain: 'How many review rounds a build gets before it stops and asks you. More rounds let the builder fix more on its own, and fewer bring problems to you sooner.' },
  ] },
];

const own = (o, k) => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.hasOwn(o, k);
// A setting's place in an object read from speck/config.yml, or undefined when it isn't there.
const lookup = (o, key) => key.split('.').reduce((at, k) => own(at, k) ? at[k] : undefined, o);

// Each group's settings, with the value speck reads from `repo`'s speck/config.yml now, and `default: true` for one
// missing from the file, which has speck's default.
export function panelSettings(repo) {
  const file = parseYaml(fs.readFileSync(path.join(repo, 'speck', 'config.yml'), 'utf8'));
  const cfg = loadConfig(repo);
  return { groups: SETTING_GROUPS.map(g => ({ title: g.title, settings: g.settings.map(s => {
    const inFile = lookup(file, s.key) !== undefined, read = lookup(cfg, s.key);
    return { key: s.key, value: inFile && read !== undefined ? read : s.default, default: !inFile, explain: s.explain };
  }) })) };
}
