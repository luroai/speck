---
id: "0388"
title: "Leave a ticket's agents to the settings unless it names them"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0387"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0388 · Leave a ticket's agents to the settings unless it names them

**Status:** 📋 ready

## Problem
`speck new` copies the builder, reviewer and reviewer model into each ticket, and the ticket keeps them. Switching reviewer means editing and committing every open ticket: on 2026-10-22, switching to Grok and back took three commits across ten tickets.

## Outcome
A ticket uses the builder and reviewer the settings give, unless it names its own.

## Acceptance criteria
1. A new ticket leaves builder, reviewer, reviewer_model and reviewer_effort blank.
2. A ticket with any of these blank is built with the builder, and reviewed with the reviewer, model and effort, that the settings give when its build starts and when each review round starts. Each round records the reviewer, model and effort it used, as today. A round whose reviewer or model differs from the last round's starts a fresh session with the full history.
3. A ticket that names any of them uses what it names, as today. `speck lint` and the same-model check judge the values the ticket would use.
4. Wherever the panel or `speck status` shows a ticket's builder or reviewer, it shows the one the ticket would use now.
5. No test that passed before this change fails.

## Out of scope
- Clearing these fields in existing tickets. They keep what they name, and `speck set <id> reviewer ""` clears one by hand.
- Where your own settings are kept: 0386 and 0387.

## Notes
- Checked 2026-10-22: `cmdNew` in `scripts/speck.mjs` sets builder, reviewer and reviewer_model from the config, and `templates/ticket.md` names `builder: claude` and `reviewer: codex`. `speck review` already falls back with `t.fm.reviewer || cfg.reviewer` (`scripts/review.mjs`), `ticketBuilder` falls back to the config's builder (`scripts/ticket-builder.mjs`), and `reviewerSettings` falls back for model and effort (`scripts/core.mjs`).
- Waits for 0387: both change how settings reach the panel.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
