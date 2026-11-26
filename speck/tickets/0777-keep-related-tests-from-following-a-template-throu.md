---
id: "0777"
title: "Keep related tests from following a template through the panel's test support"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-26-keep-related-tests-from-following-a-template-through-panel-support.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:48:45.628Z"

---
# 0777 · Keep related tests from following a template through the panel's test support

**Status:** 🔨 building

## Problem
`speck test --related` brings in every test that imports `test/support/panel.mjs` whenever any template that file can read changes. A change to the factory floor chose 533 test files, and 0766's build 625, so a build's related run outlasts the builder's 10-minute shell limit.

## Outcome
A changed template brings in only the tests that load that template.

## Acceptance criteria
1. A change to `templates/floor.html` alone brings in the tests that load the factory floor, and not the panel tests that never load it.
2. A change to a file the panel's page loads still brings in the tests that load the panel (0696).
3. A change to `test/support/panel.mjs` itself still brings in every test that imports it.
4. No test that passed before this change fails.

## Out of scope
- How related tests are found for code that isn't a template.

## Notes
- From 0767's build. The earlier fix (`speck/ideas/done/2026-10-23-keep-related-tests-from-picking-the-whole-suite.md`) didn't cover a support file that reads any page by name.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
