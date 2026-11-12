---
id: "0661"
title: "Set each build level from the team page"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0660"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T12:10:00.215Z"

---
# 0661 · Set each build level from the team page

**Status:** 🔨 building

## Problem
After 0660, changing what Quick, Balanced and Deep build with, or adding a level such as Graphics, means editing `speck/config.yml` by hand. The team page is where you set up the builder, so the levels belong there too, where you can change them from your phone.

## Outcome
The team page shows the project's build levels, and you can change, add and remove them there.

## Acceptance criteria
1. The builder's card on the team page lists each of the project's levels in the order `speck/config.yml` gives them, each with its builder, model and effort, or "settings" for one it leaves out.
2. Changing a level's builder, model or effort there saves it to that level in `speck/config.yml`, offering the same choices the builder's own settings offer, and the next build of a ticket at that level uses it.
3. Adding a level with a name and any of the three values saves it to `levels:` in `speck/config.yml`. A name that isn't lowercase letters, digits and hyphens, or that's already a level, is refused with a message saying why, and nothing is saved.
4. Removing a level deletes it from `speck/config.yml`, except when a ticket that isn't done or cancelled names it: then it's refused with a message naming those tickets, and nothing is saved.
5. When `speck/config.yml` has no `levels:`, the page shows the three default levels, and the first change saves all three with the change to `levels:` in `speck/config.yml`.

## Out of scope
- Picking a ticket's level: 0662.
- Levels for the reviewer or QA.
- Saving levels for this machine only.

## Notes
- Follow how the team page saves `builder_model` and `builder_effort` today (`scripts/settings.mjs`, `templates/panel-settings.js`), keeping the page as narrow as it is now (one column on a phone).
- Failing before this build: none
- Self-check: saving the values a level already has now answers without an empty commit, and a level a ticket couldn't be built at (the reviewer sharing its model) is refused, each with a test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
