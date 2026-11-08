---
id: "0573"
title: "Rename lint to the ready check"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-rename-lint-to-a-plainer-term.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0563","0564","0565","0566","0567","0568","0569","0570","0571","0572"]                # ticket ids that must be done first
created: 2026-11-08

---
# 0573 · Rename lint to the ready check

**Status:** 📋 ready

## Problem
"Lint" is programmer jargon and doesn't say what the check does, and the user once had to ask what "lint passes" meant. The panel already calls the same checks Readiness, so speck uses two names for one thing, in the CLI, the skills, the docs and its messages.

## Outcome
speck calls the check that a ticket is ready to build the ready check, run with `speck check <id>`, and `speck lint <id>` still works.

## Acceptance criteria
1. `speck check <id>` does what `speck lint <id>` does today, with the same results and exit codes, and `speck lint <id>` still works the same. speck's help lists `speck check` and says `speck lint` still works.
2. speck's own messages that name the check, such as `speck set <id> status ready` refusing a ticket, call it the ready check and name `speck check`, not lint.
3. The skills, `docs/brief.md`, the README and the ticket template name `speck check` and the ready check, and don't name `speck lint` or lint, apart from saying once in the brief that `speck lint` still works.
4. The panel's Readiness list is headed "Ready check".
5. No test that passed before this change fails.

## Out of scope
- `CHANGELOG.md`'s earlier sections, release notes and shipped tickets, which keep the old name.
- What the check reports and how it marks errors (✗) and warnings (!).

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- Decided: `speck check`, called the ready check in prose, as the idea suggested. `speck lint` stays as another name, so older skills in other projects don't break.
- Today: the command is `cmdLint` in `scripts/speck.mjs` and `scripts/lint.mjs`; "lint" appears in `scripts/` (`core.mjs`, `ship.mjs`, `output.mjs`, `pack.mjs`, `stall.mjs`, `detect.mjs` and others), `skills/speck-build`, `skills/speck-ticket`, `skills/speck-review`, `docs/brief.md` and about 50 test files. The panel's heading is in `templates/panel.js` (`'Readiness'`).
- Waits for every other ticket in 0.22.0, as it touches the skills, the brief and scripts they change.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
