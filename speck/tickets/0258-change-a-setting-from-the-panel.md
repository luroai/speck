---
id: "0258"
title: "Change a setting from the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0257"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-17T08:53:20.250Z"

---
# 0258 · Change a setting from the panel

**Status:** 🔨 building

## Problem
Changing a setting today means finding the line in `speck/config.yml`, knowing which values speck accepts, editing it and committing it so `speck run` sees it. That's a lot to ask of someone who just wants two builds at once or a more thorough reviewer.

## Outcome
The settings in the Settings view that are safe to change can be changed there, with only values speck accepts, and the change is committed for the whole repo.

## Acceptance criteria
1. In the Settings view, `reviewer`, `reviewer_model`, `reviewer_effort`, `max_parallel_builds`, `max_parallel_tests`, `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds` can each be changed in place. `reviewer_effort` offers only blank (the reviewer's default) and the effort levels speck accepts. `reviewer` offers only `codex`, `claude-subagent` and the names under `reviewer_options`. Every other setting in the view stays read-only.
2. Saving a change rewrites only that setting's line in `speck/config.yml`, keeping every other line, comment and the order of settings, then commits only `speck/config.yml` on the base branch as `speck: config <key> <value>`. The view then shows the new value. Saving the value a setting already has writes and commits nothing.
3. A value speck wouldn't accept is refused with a message saying what's allowed, leaving the file and git unchanged. Examples: a `max_parallel_builds` of 0, or a `reviewer` that makes the builder and reviewer the same agent while `allow_same_model_review` is false.
4. A change is refused, with a message saying why, leaving the file and git unchanged, when the panel's checkout isn't on the base branch or `speck/config.yml` has uncommitted changes.
5. A change request without the panel's token or from another origin is refused with 403, as the panel's other writes are. A request to change a setting not listed in criterion 1 (for example `build_command` or `auto_ship`) is refused. Neither changes anything.

## Out of scope
- `auto_ship` and `auto_ship_risk`: 0259, which asks before loosening who ships.
- `builder`, which needs a matching `build_command`, and `allow_same_model_review`, which weakens the independent review. Both stay read-only.
- Settings for this machine only: 0260 and 0261.

## Notes
- `risk: high` because the panel has no login and this lets it change how builds are reviewed. Writes use the same origin and token check as the panel's other writes.
- Reuse `checkConfigValue` and `setConfigText` in `scripts/config.mjs` (what `speck config set` uses), and commit as `panelSetPriority` in `scripts/panel.mjs` does. The same-agent check is in `scripts/core.mjs` (`modelFamily`).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
