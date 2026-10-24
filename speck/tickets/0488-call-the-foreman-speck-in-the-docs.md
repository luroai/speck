---
id: "0488"
title: "Call the Foreman speck in the docs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0487"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:48:07.127Z"

---
# 0488 · Call the Foreman speck in the docs

**Status:** 🔨 building

## Problem
The README, the brief, the setup skill and the agent's own skill still describe the Foreman, its settings and its commands, after the panel, the messages and the settings stop using it.

## Outcome
speck's docs describe speck as the one watching the pipeline, with the new setting and command names.

## Acceptance criteria
1. `README.md`, `docs/brief.md`, every `skills/*/SKILL.md` and `templates/config.yml` contain no "Foreman" or "foreman" in any case, except the old setting names and `speck foreman` where they say those still work.
2. They name `watch`, `watch_agent`, `watch_model`, `watch_effort`, `speck answer`, `speck dismiss`, `speck watch` and the `speck-watch` skill wherever they named the old ones, and the brief's `speck config set` row says the old setting names are still read.
3. The README's and the brief's descriptions of the header, Settings' Watching group and blocked questions read naturally with speck as the one watching, in British English (checked by review).
4. `CHANGELOG.md` and `docs/releases/` don't change. No test that passed before this change fails.

## Out of scope
- The code's own wording (0485, 0486, 0487).

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: README's Foreman and Settings bullets (lines 130 to 165), the brief's `speck panel`, `speck config set`, `speck foreman` and `speck status` rows, `skills/speck-setup/SKILL.md` (its Foreman agent questions) and the agent's skill, moved to `skills/speck-watch/SKILL.md` by 0486.
- Waits for 0487, which names the settings this describes, and through it 0485 and 0486.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
