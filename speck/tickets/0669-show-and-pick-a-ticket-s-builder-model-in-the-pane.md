---
id: "0669"
title: "Choose a ticket's builder model in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-10-11-choose-the-builder-s-model-per-ticket.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0667"]                # ticket ids that must be done first
created: 2026-11-12

---
# 0669 · Choose a ticket's builder model in the panel

**Status:** 📋 ready

## Problem
Since 0659 a ticket can name its own builder and model, but only in the ticket file or with `speck set`. A draft or ready ticket in the panel doesn't say which builder, model and effort it will be built with, so you can't see what a level or the ticket's own model will do, or change it from your phone.

## Outcome
A ticket in the panel says what it will be built with, and you can change its builder and model there.

## Acceptance criteria
1. A ticket's facts, in an open draft in Plan and in a ticket's full view, show a Builder fact with the agent, model and effort its next build would use, worked out as a build would (the ticket's own, else its level's, else the Builder's in Settings), such as "Claude Code · Fable · high", with "default model" or "default effort" for one nobody sets. Under it, in smaller words, it says where they come from: "This ticket", the level's name (such as "Deep level") or "Default".
2. Pressing the Builder fact opens a menu offering "Default", then the same agent and model choices as the Builder's row in Settings, in the same words. Picking one sets the ticket's `builder` and `builder_model` as `speck set` does, and "Default" blanks both, so the level or Settings decides. The facts show the change without a reload.
3. Changing it is refused, with the message `speck set` gives, for a ticket that's building, reviewing, blocked or approved, and it keeps its builder. A done or cancelled ticket shows the builder, model and effort it was built with, without the menu.
4. A pick the ready check would refuse, such as the same model as the ticket's reviewer without `allow_same_model_review`, is refused with the ready check's message, and the ticket keeps its builder.

## Out of scope
- Setting a ticket's own `builder_effort` in the panel: a level sets effort.
- The Level menu's own wording: 0667.

## Notes
- Follow the Level fact and menu from 0662 (`levelFact` in `templates/panel.js`, `POST /api/tickets/<id>/level/<name>` in `scripts/panel.mjs`). The board already gives each ticket `builder`, `builder_label` and `builder_model`, worked out with its level (`ticketBuilderModel` in `scripts/build-model.mjs`). It needs the effort and where they come from too.
- The full view already has a Builder fact (`paneFacts` in `templates/panel-popups.js`), showing only the agent and model. The open draft in Plan has none.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
