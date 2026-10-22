---
id: "0386"
title: "Keep your own settings out of git"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T22:58:32.613Z"

---
# 0386 · Keep your own settings out of git

**Status:** 🔨 building

## Problem
Every setting lives in speck/config.yml, which is committed. Choosing which agent builds or reviews, or turning auto-ship on, means a commit to `main` that then goes out with the next ship's push. Running builds don't see the change, because they read the copy in their own worktree.

## Outcome
Your own settings are kept for this machine in a file git ignores, and speck/config.yml keeps only the project's own settings and defaults.

## Acceptance criteria
1. Your own settings are builder, builder_model, build_command, resume_command, reviewer, reviewer_model, reviewer_effort, allow_same_model_review, auto_ship, auto_ship_risk, foreman, foreman_model, foreman_effort, foreman_fixing, max_parallel_builds and max_parallel_tests. `speck config set <key> <value>` for one of them saves it for this machine. It leaves speck/config.yml unchanged and commits nothing. Switching the builder this way also saves the new build_command for this machine, as it's set in speck/config.yml today (0293).
2. Every speck command, in the main checkout and in every worktree, uses this machine's value over speck/config.yml's. That includes a build or review round already running, from the next time it reads its settings. A setting with no value for this machine uses speck/config.yml's, as today.
3. Each value is checked and refused with the same message as `speck config set` gives today. It reads back exactly as given, including text with spaces or quotes and a list such as `auto_ship_risk: [low, high]`. `speck config set --repo <key> <value>` changes speck/config.yml's value instead, as `speck config set` does today. `--machine` still works, and `--machine <key> ""` removes this machine's value.
4. Every other setting, such as commands, limits, base_branch and ship_mode, is set in speck/config.yml as today, and `--machine` still refuses it. `speck config show` marks each value that comes from this machine.
5. The README's and the brief's description of settings says which are your own, where they're kept, and how to change speck/config.yml's defaults (checked by review). No test that passed before this change fails.

## Out of scope
- The panel's Settings view: 0387.
- Tickets copying the builder and reviewer: 0388.
- Moving values out of speck/config.yml. Its values stay as the project's defaults, and nothing is migrated.

## Notes
- Checked 2026-10-22: `MACHINE_SETTINGS` in `scripts/machine.mjs` holds only max_parallel_builds and max_parallel_tests (0260). Their values are kept in the main checkout's `speck/.cache/machine/config.yml`, which every worktree reads, and `loadConfig` in `scripts/core.mjs` puts them over speck/config.yml's. `saveMachineValue` writes `key: value` unquoted, and `applyMachineConfig` accepts only whole numbers, so both need to handle text, true/false and lists.
- Checked 2026-10-22: `speck config set builder <name>` sets build_command in the same change (0293), in `scripts/config.mjs`.
- Assumption: review_timeout_minutes, test_stall_minutes and ship_wait_minutes stay project settings.
- From the user's request on 2026-10-22, for 0.13.0. 0375 waits for it.
- Failing before this build: none
- Existing tests that ran `speck config set` for one of the sixteen settings and expected speck/config.yml to change (0087, 0109, 0260, 0293, 0311) now pass `--repo`, as criterion 1 makes the plain command save for this machine. Their checks are otherwise unchanged. 0260 AC4's refused key `reviewer` is now `base_branch`, since `reviewer` is one of your own settings.
- The panel keeps 0261's two machine settings until 0387 moves it to all of them.
- Self-check: removing this machine's builder with `--machine builder ""` now also removes the build_command switching to it saved, so speck/config.yml's pair applies again.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
