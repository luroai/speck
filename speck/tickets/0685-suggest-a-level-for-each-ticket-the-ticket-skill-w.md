---
id: "0685"
title: "Suggest a level for each ticket the ticket skill writes"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0685 · Suggest a level for each ticket the ticket skill writes

**Status:** 📝 draft

## Problem
Since 1.3 a ticket can be built at a level, such as quick, deep or one of your own, but every ticket the ticket skill writes leaves `level` blank, so each one builds on the settings unless you remember to pick one. The ticket writer has read the work and the code it changes, so it's well placed to say which level fits, and you'd only need to agree or change it at Gate 1.

## Outcome
The ticket skill sets a level on each ticket it writes when one of the project's levels fits, and says why in one line, leaving you to change it before setting the ticket ready.

## Acceptance criteria
1. `skills/speck-ticket/SKILL.md`'s steps tell the ticket writer to list the project's levels with the builder, model and effort each gives (as `speck status --json` or `speck/config.yml` gives them), and to set `level` on each ticket with `speck set <id> level <name>` when one fits the work better than the settings, leaving it blank when none does (checked by review).
2. The skill says how to choose, in a few lines: a level giving less effort or a cheaper model for small, low-risk changes such as wording, docs or a test fix; one giving more for M tickets, high-risk ones or ones whose criteria need careful reasoning; and a level the user has named for a kind of work, such as graphics, for tickets of that kind (checked by review).
3. When the ticket writer presents the tickets (step 8), the skill has it give each ticket's level, or "Default", with a one-line reason, and say the user can change it in the panel's Level menu or by asking, before setting the ticket ready (checked by review).
4. The skill never has the ticket writer set a ticket ready because it set a level, and setting a level stays separate from Gate 1 (checked by review). No test that passed before this change fails.

## Out of scope
- speck run, Virgil or the watch agent choosing or changing a level by itself.
- Choosing a level from the results per model: that comes after enough tickets have run through each.
- Triage, which makes tickets with the same steps and so picks up the change.

## Notes
- Asked for 2026-11-15, as part of the 1.5.0 plan: "the ticket writer suggests a level".
- `.claude/skills/speck-ticket/SKILL.md` is this repo's installed copy of `skills/speck-ticket/SKILL.md`; keep them the same, as other skill changes have.
- Tests that read the skill: `test/ticket-0672.test.mjs`, `test/ticket-0475.test.mjs`, `test/triage-0037.test.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
