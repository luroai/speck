import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0490: cut the README down to what a first-time reader needs ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ----- AC2 -----

// Every setting name, command and file path the README named before 0490 cut it, taken from its code spans. A full
// command line the README gave is listed as the speck command it runs (`node .speck/scripts/speck.mjs doctor` is
// `speck doctor`), and a command's placeholders are left out where the brief gives a real value instead. The brief's
// own path, `docs/brief.md`, isn't listed: the brief is that file.
const SETTINGS = [
  'after:', 'allow_same_model_review', 'allow_same_model_review: true', 'auto_ship', 'auto_ship_risk', '`[low]`',
  'base_branch', 'build_command', 'builder', 'builder: claude', 'builder: codex', 'builder: cursor', 'builder: deepseek',
  'builder_effort', 'builder_model', 'command', 'commands', 'commands.checks', 'escalate_after_repeat_disputes',
  'foreman', 'foreman_effort', 'foreman_fixing', 'foreman_model', 'limits', 'limits.max_acceptance_criteria',
  'limits.max_changed_lines', 'max_merge_rounds', 'max_parallel_builds', 'max_parallel_tests', 'max_review_rounds',
  'resume_command', 'reviewer', 'reviewer: claude', 'reviewer: cursor', 'reviewer: deepseek', 'reviewer_effort',
  'reviewer_model', 'reviewer_options.cursor', 'session_id_path', 'ship_mode', 'ship_mode: local', 'ship_mode: pr',
  'watch', 'watch: fix', 'watch_agent', 'watch_effort', 'watch_model', 'worktrees: true', '{model}', '{effort}',
  '{session}', 'claude-subagent', 'deepseek-v4-flash', 'deepseek-v4-pro', 'claude-opus-5-5-high',
];
const COMMANDS = [
  "npx 'github:luroai/speck#semver:*' init", 'node .speck/scripts/speck.mjs', 'speck init', 'speck doctor', 'speck help',
  'speck set <id> status ready', 'speck set <fix-id> status ready', 'speck run', 'speck panel',
  'speck panel --url https://<hostname>', 'speck pause <id>', 'speck play <id>', 'speck stop <id>', 'speck status',
  '--json', 'speck pack <id>', 'speck cancel <id> "<reason>"', 'speck config set <key> <value>',
  'speck config set builder <name>', 'speck config set --repo <key> <value>', '--machine', '--replace',
  'speck config show', 'speck keys', 'speck keys set deepseek', 'speck keys set deepseek < key.txt',
  'speck keys remove deepseek', 'speck agents', 'speck agents add <agent>', 'speck agents remove <agent>',
  'speck answer <id> "<answer>"', 'speck dismiss <id>', 'speck merge-check <id>', 'speck new "<title>"', '--type=fix',
  'speck review', 'speck ship <id>', 'speck start <id>', 'speck test --files <file>…', 'speck test --recorded',
  '/speck-setup', '/speck-capture', '/speck-ticket', '/speck-build <id>', '/speck-review <id>', '/speck-ship <id>',
  '/speck-status', 'codex exec resume', '`gh`', 'cursor-agent', '`agent`', '--trust', 'dontAsk', 'tailscale serve',
];
const PATHS = [
  'AGENTS.md', 'CLAUDE.md', '.agents/skills/', '.claude/skills/', '.speck/', 'speck/config.yml', 'speck/ideas/',
  'speck/tickets/', 'speck/tickets/done/', 'speck/.cache/', 'speck/.cache/machine/config.yml',
  'speck/.cache/machine/keys.json', 'speck/.cache/machine/agents.json', 'speck/.cache/machine/providers.json',
  'outputs/', 'http://127.0.0.1:4777', '## Blocked question', '## Delivery log', '## Review log', '## Review rounds',
  'Failing before this build:', 'Status: inbox',
];
// The values the README named for settings, statuses, verdicts and merge classes.
const VALUES = [
  'draft', 'building', 'approved', 'blocked', 'done', 'main', 'off', 'tell', 'pass', 'fail', 'unclear', 'approve',
  'changes_requested', 'escalate', 'blocking', 'minor', 'fixed', 'disputed', 'needs_pm', 'added-lines', 'lockfile',
  'logic',
].map(value => `\`${value}\``);

test('0490 AC2: every setting name, command and file path the README named before the cut is named in the brief', () => {
  const brief = read('docs/brief.md');
  const missing = [...SETTINGS, ...COMMANDS, ...PATHS, ...VALUES].filter(name => !brief.includes(name));
  assert.deepEqual(missing, []);
});
