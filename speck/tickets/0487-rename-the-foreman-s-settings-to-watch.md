---
id: "0487"
title: "Rename the Foreman's settings to watch"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0485", "0486"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:26:36.248Z"

---
# 0487 · Rename the Foreman's settings to watch

**Status:** 🔨 building

## Problem
The settings for what speck does when work stops are named after the Foreman: `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort`. Settings shows those names, so the Foreman lives on there after the panel and the messages stop using it.

## Outcome
The settings are called `watch`, `watch_agent`, `watch_model` and `watch_effort`, and a config that still has the old names works as before.

## Acceptance criteria
1. speck reads `watch` (`off`, `tell` or `fix`), `watch_agent`, `watch_model` and `watch_effort` with the same values, defaults and meanings that `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort` have today, from `speck/config.yml` and from this machine's own settings.
2. A config that sets only an old name behaves exactly as if it set the new one, and where both are set the new name wins. `speck config set` with an old name saves the new name and leaves no line with the old name for that setting.
3. Settings shows and saves only the new names. Their explanations say speck where they said the Foreman, and the role's list, models and effort work as before (0400, 0402).
4. `speck status`, `speck config`, and every message that names one of these settings use the new name, and a new `speck/config.yml` from `templates/config.yml` has the new names with their comments. No test that passed before this change fails.

## Out of scope
- Rewriting existing config files: the old names are read, not changed, until `speck config set` or Settings saves one.
- The README, the brief and the setup skill (0488).

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: `SETTING_GROUPS` in `scripts/settings.mjs`, the kinds in `scripts/config.mjs`, `foremanAgentOf`, `FIXING` in `scripts/foreman.mjs`, `templates/config.yml`, and `AGENT_KEYS`, `SETTING_PAIRS`, `ROLE_PAIRS` and `ROLES` in `templates/panel-settings.js`. This repo's own `speck/config.yml` has no Foreman settings.
- Waits for 0485 (Settings' group title and the role's name in `templates/panel-settings.js`) and 0486 (messages that name `foreman_fixing`).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
