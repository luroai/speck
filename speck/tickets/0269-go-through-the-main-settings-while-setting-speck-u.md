---
id: "0269"
title: "Go through the main settings while setting speck up"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:22:09.236Z"

---
# 0269 · Go through the main settings while setting speck up

**Status:** 🔨 building

## Problem
`speck init` writes speck's generic defaults into a new project's `speck/config.yml`, and the setup skill then asks only about the base branch, the test command, worktree setup, the builder and reviewer, and unattended builds. It never goes through how much ships without you, how many builds run at once or how big a ticket can be, so those keep defaults the user never chose. Someone who later finds `auto_ship` on, or a 300-line limit, may not know where it came from or what it means.

## Outcome
Setting speck up takes the user through each setting in the panel's Settings view that setup doesn't already ask about. For each, it explains it in plain words, recommends a value for this project and records the user's answer.

## Acceptance criteria
1. The setup skill (`skills/speck-setup/SKILL.md`) goes through every setting in the panel's Settings view (0257) that it doesn't already ask about: `auto_ship`, `auto_ship_risk`, `max_parallel_builds`, `max_parallel_tests`, `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds`. For each, it says what the setting does using the same explanation the Settings view shows, gives the current value, recommends one and waits for the user's answer.
2. The explanations setup uses come from the same place the Settings view's do (`scripts/settings.mjs`), through a speck command, so setup and the panel never say different things. The command prints each setting's group, name, current value, whether that value is the default, and its explanation.
3. Setup records each value the user picks with `speck config set`, and leaves a setting the user keeps as it is unchanged in the file.
4. Setup never turns `auto_ship` on, or adds `high` to `auto_ship_risk`, unless the user says yes to that setting by itself, after setup has said that a ticket it covers is merged and pushed to the base branch without waiting for them.
5. When speck is already set up and setup runs again, it shows those settings' current values and asks only about the ones the user wants to change.

## Out of scope
- Changing settings from the panel: 0258–0261.
- The settings setup already asks about: base branch, test command, worktree setup, builder and reviewer, and `build_command`.

## Notes
- Checked 2026-10-17: `speck init` copies `templates/config.yml` (`cmdInit` in `scripts/install.mjs`), whose values are generic (`auto_ship: false`, `max_changed_lines: 300`, `max_parallel_builds: 1`), not this repo's own. A project set up with speck 0.5.x had a config matching the template apart from what its setup set: `commands.test`, `commands.test_files`, `worktree_setup` and `auto_ship: true`.
- Criteria 1, 4 and 5 are about the skill's instructions, so check them by review.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
