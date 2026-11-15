---
id: "0694"
title: "Compare builder models by their results in Shipped"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-show-what-a-shipped-ticket-was-built-with.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0694 · Compare builder models by their results in Shipped

**Status:** 📋 ready

## Problem
Since 1.3 tickets can build on different models and levels, but nothing compares how they do. Shipped gives one set of figures for every ticket, and a shipped ticket doesn't say which model built it, so you can't tell whether a cheaper model holds up or only looks cheaper, for example after a few days of quick tickets on Sonnet.

## Outcome
Shipped shows how each builder model does, and each shipped ticket says what built it.

## Acceptance criteria
1. Shipped has a By model table, under its figures and for the same tickets they count, with one row per builder model: the number of tickets, median minutes from start to approval, median review rounds, the share approved in the first round and median builder cost per ticket, worked out as Shipped's own figures are.
2. A ticket counts under the builder model that cost most across its builds, as `speck spend --by=model` names models. Tickets with no recorded builder model count in one last row, Unknown, shown only when there are some.
3. A row with fewer than 5 tickets says "few tickets" beside its count, so a model isn't judged on two or three.
4. A shipped ticket's full view has a Built with fact naming the builder model or models its builds ran on, as recorded, or "Not recorded".
5. At 375 pixels wide the table fits the lane without a horizontal scroll, wrapping or shortening its headings as Shipped's figures do.

## Out of scope
- Grouping by level or effort.
- Choosing a ticket's level from these figures: for later, once enough tickets have run on each model.
- Recording the builder and model at the start of a build: the models come from the builds' own records, as `speck spend` reads them.

## Notes
- Asked for 2026-11-15, as part of the 1.5.0 plan: "results per model". From `speck/ideas/2026-11-15-show-what-a-shipped-ticket-was-built-with.md`.
- The board already gives each ticket `builder_models` (`scripts/speck.mjs`), and Shipped's figures are worked out in `templates/panel-model.js` (`stats`).
- Checked 2026-11-15: `speck spend --by=model` since 1 November gives claude-opus-5-5 $355.98, claude-sonnet-5-5 $11.88 and gpt-6.1-sol $21.03.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
