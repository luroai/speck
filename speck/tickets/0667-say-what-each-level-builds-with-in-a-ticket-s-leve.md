---
id: "0667"
title: "Say what each level builds with in a ticket's Level menu"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0666"]                # ticket ids that must be done first
created: 2026-11-12

---
# 0667 · Say what each level builds with in a ticket's Level menu

**Status:** 📋 ready

## Problem
A ticket's Level menu (0662) offers Quick, Balanced, Deep and "Settings" without saying what any of them builds with. "Settings" reads like a way to open the Settings page, but it takes the ticket's level off, and nothing in the menu leads to where levels are changed.

## Outcome
A ticket's Level menu says what each choice builds with and leads to where levels are set.

## Acceptance criteria
1. The choice that takes a ticket's level off is called "Default" in the menu and in the ticket's Level fact, never "Settings".
2. Each choice in the menu shows, under its name, the builder, model and effort it builds with, worked out as a build would (the level's own, else the Builder's in Settings), such as "Claude Code · Fable · high" or "Codex · default model · low". "Default" shows the Builder's own.
3. The menu ends with "Change levels", which closes the menu and opens Settings scrolled to Build levels on the Builder's card. It doesn't change the ticket's level.
4. Picking a level, refusals and done or cancelled tickets work as 0662 made them.

## Out of scope
- Setting a ticket's own builder model or effort in the panel.
- The Build levels on the Builder's card: 0666.

## Notes
- The board gives the page `levels` as names only (`scripts/panel.mjs`), so it needs each level's resolved builder, model and effort too. `ticketBuilderModel` in `scripts/build-model.mjs` and 0660's level resolution already work them out.
- Use the same "Default" word as 0666, and the Builder's agent and model names as the Builder's row shows them.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
