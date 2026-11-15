---
id: "0687"
title: "Let a fix ticket fix the failing tests it names"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-15-let-a-fix-ticket-fix-the-failing-tests-it-names.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:21.778Z"

---
# 0687 · Let a fix ticket fix the failing tests it names

**Status:** 🔨 building

## Problem
A fix ticket that speck makes when the full suite fails names the tests it must fix, and those tests are listed as failing before its build. The build and review rules say a test failing before the build is never changed or fixed, so the reviewer escalates a fix ticket for doing exactly its job: 0671 blocked on this and went on only because speck took the recommendation.

## Outcome
A `type: fix` ticket may change or fix the failing tests it names, and other failing-before tests stay off limits.

## Acceptance criteria
1. `skills/speck-build/SKILL.md`, `skills/speck-review/SKILL.md` and `templates/reviewer-prompt.md` each say that a ticket with `type: fix` may change or fix the tests its acceptance criteria name, even when they're listed as failing before the build, and that every other failing-before test stays unchanged (checked by review).
2. The reviewer's prompt as speck builds it for a `type: fix` ticket contains that exception, and for any other ticket it doesn't.
3. No test that passed before this change fails.

## Out of scope
- Changing how speck writes fix tickets or which tests they name.

## Notes
- From 0671's round 1 and 0683, which hit the same rule.
- `.claude/skills/` is this repo's installed copy of `skills/`; keep them the same.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
