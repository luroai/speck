---
id: "0652"
title: "Turn Settings into your team"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0646","0650","0651"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0652 · Turn Settings into your team

**Status:** 📋 ready

## Problem
Settings is a list of agent, model and effort pickers per role. You think of the work as a team: who manages, who builds, who reviews and who checks the app, and who takes over when one runs out.

## Outcome
Settings opens on Your team: a card for each member, with its character, its job, what it runs on and its bench, above your subscriptions.

## Acceptance criteria
1. Settings opens with Your team: a card for Virgil (named with `speck_name`), the Builder, the Reviewer and QA, each with its character, its job in one line, the agent, model and effort it runs on, and its bench in order.
2. A card's agent, model, effort and bench can be changed there, saved with Save as those settings are today, with the same checks and the same machine-only saving for your own settings.
3. Your subscriptions (0646) sits under the cards, and the rest of Settings (shipping, limits and the app settings) under that, unchanged.
4. A card whose agent is limited says so and which bench agent stands in.
5. It fits a phone-width panel in the light and the dark look, with no setting lost from today's Settings.

## Out of scope
- Copying a team to another project.

## Notes
- Mockup: the Your team board in https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ, option D characters.
- From `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md`. Keep the panel thin.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
