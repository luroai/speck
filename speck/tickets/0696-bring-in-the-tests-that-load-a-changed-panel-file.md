---
id: "0696"
title: "Bring in the tests that load a changed panel file"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-10-24-bring-in-page-tests-for-a-panel-script-change.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:08:47.961Z"

---
# 0696 · Bring in the tests that load a changed panel file

**Status:** 🔨 building

## Problem
`speck test --related` brings in a test file when its text names a changed file, or when it imports a support module that names one. `test/support/panel.mjs` loads the panel's page with paths built from parts, such as `path.join(ROOT, 'templates', 'panel.js')`, so a change to the panel's script or styles brings in almost none of the about 160 tests that load it. 0468's change broke 61 of them unseen, and 0495, 0502 and 0583 hit the same gap, each handed back at ship or running every panel test by hand.

## Outcome
A change to a file the panel's page loads brings in the tests that load the page.

## Acceptance criteria
1. A branch that changes `templates/panel.js`, `templates/panel.css` or any other file `test/support/panel.mjs` loads into the page brings in, with `speck test --related`, every test file that imports `test/support/panel.mjs`.
2. A support module that names a file by joining its parts, such as `path.join(ROOT, 'templates', 'panel.js')` or `new URL('../../templates/panel.js', import.meta.url)`, counts as naming it, as a module that writes the path whole does today.
3. A branch that changes only files no support module loads brings in the same test files as today: for example, a change to `scripts/ship-queue.mjs` alone doesn't bring in the panel's tests.
4. No test that passed before this change fails.

## Out of scope
- Other ways a test can depend on a file without naming it, such as reading a whole folder.

## Notes
- From the inbox note. `scripts/related.mjs` (0437, 0447); 0447 kept it from picking too many by counting only modules few support files name, so keep that rule.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
